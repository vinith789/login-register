const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  user: {
    name: String,
    email: String,
    phone: String,
    address: String,
    pincode: String,
    district: String
  },
  items: [
    {
      name: { type: String, required: true },   // ✅ instead of productName
      price: { type: Number, required: true },
      qty: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      image: { type: String }  // ✅ instead of productImage
    }
  ],
  totalPrice: { type: Number, required: true }, // ✅ instead of total
  createdAt: { type: Date, default: Date.now }
});


// ✅ Prevent OverwriteModelError
module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
