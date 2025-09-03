const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const router = express.Router();

// Configure transporter
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

// A map to store timers for each email
const debounceTimers = new Map();

// API route to log searches
router.post("/log-search", async (req, res) => {
  const { name, email, search } = req.body || {};

  if (!name || !email || !search) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  try {
    // If there's already a timer for this email, clear it
    if (debounceTimers.has(email)) {
      clearTimeout(debounceTimers.get(email));
    }

    // Set a new debounce timer (1 second after last keystroke)
    const timer = setTimeout(async () => {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: "New User Search Logged",
          text: `User Search Activity:
          Name: ${name}
          Email: ${email}
          Searched for: "${search}"`
          });
        // console.log("Mail sent for", email, "search:", search);
      } catch (err) {
        console.error("Email error:", err);
      }

      debounceTimers.delete(email); // remove timer after sending
    }, 1000); // 1 second delay

    debounceTimers.set(email, timer);

    res.json({ success: true, message: "Search logged, mail will be sent if no new typing" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

module.exports = router;
