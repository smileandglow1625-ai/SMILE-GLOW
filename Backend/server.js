// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const Appointment = require("./models/Appointment");
const Admin = require("./models/Admin");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();

/* ======================================================
   ⭐ ABSOLUTE WORKING CORS FIX (Render + Local + Browser)
====================================================== */
app.use(
  cors({
    origin: [
      "https://smileandglowaesthetic.com",
      "https://www.smileandglowaesthetic.com",
      "http://127.0.0.1:5500"   // for local testing
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight fix
app.options("*", cors());


// ⭐ MUST HAVE — FIXES PRE-FLIGHT (OPTIONS) ERROR
// app.options("*", cors());

/* ======================================================
   Body Parser
====================================================== */
app.use(bodyParser.json());

/* ======================================================
   MongoDB Connection
====================================================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* ======================================================
   Nodemailer Transporter
====================================================== */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ======================================================
   Verify Admin Token
====================================================== */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Not Authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid Token" });
  }
}

/* ======================================================
   Save Appointment (Public)
====================================================== */
app.post("/api/appointments", async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    res.json({ success: true, message: "Appointment saved!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.toString() });
  }
});

/* ======================================================
   Admin Register (Only once)
====================================================== */
app.post("/api/admin/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashed });
    await admin.save();

    res.json({ success: true, message: "Admin Created!" });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

/* ======================================================
   Admin Login
====================================================== */
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

/* ======================================================
   Forgot Password (Send OTP)
====================================================== */
app.post("/api/admin/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    admin.otp = otp;
    admin.otpExpires = expiry;
    await admin.save();

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Smile & Glow Admin OTP",
      html: `<h3>Your OTP is <b>${otp}</b></h3><p>Expires in 10 minutes.</p>`,
    });

    res.json({ success: true, message: "OTP sent!" });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

/* ======================================================
   Verify OTP + Reset Password
====================================================== */
app.post("/api/admin/verify-otp", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (!admin.otp || admin.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    if (admin.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.otp = undefined;
    admin.otpExpires = undefined;

    await admin.save();

    res.json({ success: true, message: "Password updated!" });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

/* ======================================================
   Admin Get Appointments
====================================================== */
app.get("/api/admin/appointments", verifyToken, async (req, res) => {
  try {
    const all = await Appointment.find().sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

/* ======================================================
   Admin Delete Appointment
====================================================== */
app.delete("/api/admin/appointments/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted", data: deleted });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

/* ======================================================
   Start Server
====================================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
