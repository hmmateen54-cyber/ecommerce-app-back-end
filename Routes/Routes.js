const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middlewere/Middlewere");

const {
  register,
  login,
  logout,
  getMe,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} = require("../Controllers/AuthControllers");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected profile data",
    user: req.user,
  });
});
router.get("/me", authMiddleware, getMe);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
