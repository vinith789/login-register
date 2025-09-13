const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  products: [
    {
      productId: String,
      name: String,
      image: String,
      price: Number,
      discount: Number,
      qty: Number,
      selectedColor: String,
      subtotal: Number
    }
  ],
  totalQty: Number,
  totalPrice: Number,
  address: {
    fullname: String,
    email: String,
    mobile: String,
    address: String,
    building: String,
    city: String,
    state: String,
    pincode: String
  },
  status: {
    type: String,
    enum: ["Ordered", "Processing", "Shipped","Delivered"],
    default: "Ordered"
  },
   deliveredAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
