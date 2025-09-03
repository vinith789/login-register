const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "otp-secret",
  resave: false,
  saveUninitialized: true
}));

// Connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

// Routes
const authRoutes = require("./routes/auth");
const resetRoutes = require("./routes/reset");
const adminRoutes = require("./routes/admin");
const searchLogger = require("./routes/search");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");

app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes); 
app.use("/", adminRoutes);
app.use("/", authRoutes);
app.use("/", resetRoutes);
app.use("/", searchLogger);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
