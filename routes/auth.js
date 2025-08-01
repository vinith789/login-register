const express = require("express");
const router = express.Router();
const path = require("path");
const User = require("../models/User");
const nodemailer = require("nodemailer");
require("dotenv").config();


let tempUsers = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Register page
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "register.html"));
});

// Login page
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "login.html"));
});

// OTP page
router.get("/verify", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "verify.html"));
});

// Send OTP
router.post("/send-otp", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.send("<script>alert('Email already registered. Please login.'); window.location.href='/login';</script>");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  tempUsers[email] = { name, email, password, otp };

  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}`
  }, (err) => {
    if (err) {
      console.log("Email send error:", err);
      return res.send("<script>alert('Failed to send OTP.'); window.location.href='/';</script>");
    }
    req.session.tempEmail = email;
    res.redirect("/verify");
  });
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;
  const email = req.session.tempEmail;

  if (!tempUsers[email]) {
    return res.send("<script>alert('Session expired. Please register again.'); window.location.href='/';</script>");
  }

  if (tempUsers[email].otp == otp) {
    const { name, password } = tempUsers[email];
    await User.create({ name, email, password });
    delete tempUsers[email];
    res.send("<script>alert('OTP Verified. You can now login.'); window.location.href='/login';</script>");
  } else {
    res.send("<script>alert('Invalid OTP. Try again.'); window.location.href='/verify';</script>");
  }
});

// Login
// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });
  if (!user) {
    return res.send("<script>alert('Invalid credentials.'); window.location.href='/login';</script>");
  }

  req.session.user = { name: user.name, email: user.email };

  // Admin redirect condition
  if (user.name === "admin" && user.email === "admin123@gmail.com") {
    return res.redirect("/admin/home");
  }

  // Regular user redirect
  res.redirect("/user/home");
});
// Admin Home page after login
router.get("/admin/home", (req, res) => {
  if (!req.session.user || req.session.user.email !== "admin123@gmail.com") {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, "../public/admin/home.html"));
});


// Home page after login
router.get("/user/home", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, "../public/user/home.html"));
});

router.get("/get-user", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json(req.session.user);
});



// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
