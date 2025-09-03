const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  name: String,
  image: String,
  price: Number,
  discount: { type: Number, default: 0 },
  qty: { type: Number, default: 1 },
  subtotal: Number
});

module.exports = mongoose.model("Cart", cartSchema);
