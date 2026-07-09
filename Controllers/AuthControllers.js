const User = require("../Models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isMailConfigured, sendEmail } = require("../config/mail");
const otpGenerator = require("otp-generator");

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const tokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateOtp = () =>
  otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

const otpExpiryMs = 5 * 60 * 1000;
const resendCooldownMs = 60 * 1000;

const canUseDevOtpFallback = () =>
  process.env.NODE_ENV !== "production" && !isMailConfigured;

const printDevOtp = (to, otp) => {
  console.log(`DEV OTP for ${to}: ${otp}`);
};

const sendOtpEmail = async ({ to, name, otp, subject = "OTP Verification" }) => {
  if (canUseDevOtpFallback()) {
    printDevOtp(to, otp);
    return {
      sent: false,
      usedDevFallback: true,
    };
  }

  try {
    await sendEmail({
      to,
      subject,
      html: `
        <h2>Hello ${name}</h2>
        <p>Your OTP code is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("OTP email send failed:", error.message);
      printDevOtp(to, otp);

      return {
        sent: false,
        usedDevFallback: true,
      };
    }

    throw error;
  }

  return {
    sent: true,
    usedDevFallback: false,
  };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({
      email: normalizedEmail,
    });

    if (userExists) {
      return res.status(409).json({
        success: false,
        message: userExists.isVerified
          ? "User already exists"
          : "User already exists but is not verified. Please verify OTP or request a new one.",
        requiresOtp: !userExists.isVerified,
        email: userExists.email,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpExpire = Date.now() + otpExpiryMs;

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      otp,
      otpExpire,
      otpLastSentAt: Date.now(),
    });

    try {
      const emailResult = await sendOtpEmail({
        to: normalizedEmail,
        name: user.name,
        otp,
      });

      return res.status(201).json({
        success: true,
        message: emailResult.usedDevFallback
          ? "Registration successful. OTP printed in backend console for development."
          : "Registration successful. Please verify OTP sent to your email.",
        requiresOtp: true,
        email: user.email,
      });
    } catch (mailError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("OTP email send failed:", mailError.message);
      }

      return res.status(500).json({
        success: false,
        message: "OTP email could not be sent. Please check email configuration.",
        requiresOtp: true,
        email: user.email,
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    console.error("Registration failed:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your account first",
        email: user.email,
      });
    }

    const token = generateToken(user._id);
    res.cookie("token", token, tokenCookieOptions);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Account is already verified",
      });
    }

    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({
        message: "OTP not found. Please request a new OTP",
      });
    }

    if (user.otp !== otp.trim()) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (user.otpExpire.getTime() < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpLastSentAt = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already verified",
      });
    }

    if (
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt.getTime() < resendCooldownMs
    ) {
      const secondsLeft = Math.ceil(
        (resendCooldownMs - (Date.now() - user.otpLastSentAt.getTime())) / 1000,
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsLeft} seconds before requesting another OTP`,
      });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpire = Date.now() + otpExpiryMs;
    user.otpLastSentAt = Date.now();

    await user.save();

    try {
      const emailResult = await sendOtpEmail({
        to: user.email,
        name: user.name,
        otp,
        subject: "New OTP",
      });

      return res.json({
        success: true,
        message: emailResult.usedDevFallback
          ? "New OTP printed in backend console for development."
          : "New OTP sent successfully",
      });
    } catch (mailError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("OTP email send failed:", mailError.message);
      }

      return res.status(500).json({
        success: false,
        message: "OTP email could not be sent. Please check email configuration.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const resetOtp = generateOtp();
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Reset Password OTP",
      html: `
        <h2>Hello ${user.name}</h2>
        <p>Your password reset OTP is:</p>
        <h1>${resetOtp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Password reset OTP sent successfully",
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpire) {
      return res.status(400).json({
        message: "Reset OTP not found. Please request a new OTP",
      });
    }

    if (user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({
        message: "Invalid reset OTP",
      });
    }

    if (user.resetPasswordOtpExpire.getTime() < Date.now()) {
      return res.status(400).json({
        message: "Reset OTP expired",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      ...tokenCookieOptions,
      maxAge: undefined,
    });

    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
