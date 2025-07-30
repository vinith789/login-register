const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const nodemailer = require("nodemailer");
const path = require("path");

const User = require("./models/User");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "otp-secret",
  resave: false,
  saveUninitialized: true
}));



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"));


// Temp store for OTP users
let tempUsers = {};

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "vinithvinith35614@gmail.com",  // Replace with your email
    pass: "xclojvvjwatvkphn"          // Replace with your app password
  },
  tls: {
  rejectUnauthorized: false
}


});

// Route: Home (Register)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Route: Login
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Route: Verify
app.get("/verify", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "verify.html"));
});

// Send OTP Route
app.post("/send-otp", (req, res) => {
  const { name, email, password } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  tempUsers[email] = { name, email, password, otp };

transporter.sendMail({
  from: "vinithvinith35614@gmail.com",
  to: email,
  subject: "Your OTP Code",
  text: `Your OTP is: ${otp}`
}, (err, info) => {
  if (err) {
    console.log("Email send error:", err);
    return res.send("<script>alert('Failed to send OTP.'); window.location.href='/';</script>");
  }
  console.log("Email sent successfully:", info.response); // <-- Add this
  req.session.tempEmail = email;
  res.redirect("/verify");
});

});

// Verify OTP Route
app.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;
  const email = req.session.tempEmail;

  if (!tempUsers[email]) {
    return res.send("<script>alert('Session expired. Please register again.'); window.location.href='/';</script>");
  }

  if (tempUsers[email].otp == otp) {
    const { name, password } = tempUsers[email];

    // Save to DB
    await User.create({ name, email, password });
    delete tempUsers[email];

    res.send("<script>alert('OTP Verified. You can now login.'); window.location.href='/login';</script>");
  } else {
    res.send("<script>alert('Invalid OTP. Try again.'); window.location.href='/verify';</script>");
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (!user) {
    return res.send("<script>alert('Invalid credentials.'); window.location.href='/login';</script>");
  }

  req.session.user = { name: user.name, email: user.email };

res.send(`
  <html>
    <head>
      <link rel="stylesheet" href="./style.css" />
      <title>Welcome</title>
    </head>
    <body>
      <div class="welcome-container">
        <h2>Welcome, ${user.name}!</h2>
        <p>Email: ${user.email}</p>
        <a href="/logout">Logout</a>
      </div>
    </body>
  </html>
`);

});

// Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
