const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String, // store image URL or filename
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  total: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);
