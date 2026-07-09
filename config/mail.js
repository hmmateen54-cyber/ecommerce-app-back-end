const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const isMailConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;

const transporter = isMailConfigured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

const warnEmailConfig = () => {
  if (isMailConfigured) {
    return;
  }

  const message =
    "Email is not configured. Set EMAIL_USER and EMAIL_PASS. For Gmail, use a Gmail App Password, not your normal password.";

  if (isProduction) {
    console.error(message);
  } else {
    console.warn(`${message} Development OTPs will be printed in the backend console.`);
  }
};

const verifyEmailConfig = async () => {
  warnEmailConfig();

  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log("Email transporter verified successfully");
    return true;
  } catch (error) {
    if (!isProduction) {
      console.error("Email transporter verification failed:", error.message);
    }

    return false;
  }
};

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    throw new Error("Email service is not configured");
  }

  await transporter.sendMail({
    from: emailFrom,
    to,
    subject,
    html,
  });
};

module.exports = {
  emailFrom,
  isMailConfigured,
  sendEmail,
  verifyEmailConfig,
  warnEmailConfig,
};
