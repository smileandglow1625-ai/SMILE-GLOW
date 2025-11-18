const express = require("express");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const router = express.Router();

// ------------------- Register Admin -------------------
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exist = await Admin.findOne({ email });
    if (exist)
      return res.json({ success: false, message: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const admin = new Admin({ email, password: hashed });
    await admin.save();

    res.json({ success: true, message: "Admin registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Login -------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.json({ success: false, message: "Admin not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.json({ success: false, message: "Wrong password" });

    res.json({ success: true, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Generate OTP -------------------
router.post("/generate-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.json({ success: false, message: "Admin not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    admin.otp = otp;
    admin.otpExpires = expiry;

    await admin.save();

    res.json({ success: true, otp }); // Actual project: send OTP in email
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Verify OTP -------------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.json({ success: false, message: "Admin not found" });

    if (admin.otp !== otp)
      return res.json({ success: false, message: "Invalid OTP" });
    if (Date.now() > admin.otpExpires)
      return res.json({ success: false, message: "OTP expired" });

    admin.otp = null;
    admin.otpExpires = null;
    await admin.save();

    res.json({ success: true, message: "OTP Verified" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Forgot Password -------------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.json({ success: false, message: "Admin not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password = hashed;

    await admin.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
