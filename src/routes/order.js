const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");

// POST /api/orders
router.post("/", async (req, res) => {
  try {
    const { user, items } = req.body;

    if (!user || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const newOrder = new Order({
      user,
      items,
      totalPrice: items.reduce((sum, i) => {
        const discount = i.discount || 0;
        const finalPrice = i.price - (i.price * discount / 100);
        return sum + (finalPrice * i.qty);
      }, 0),
      createdAt: new Date()
    });

    await newOrder.save();
    res.json({ message: "Order saved successfully", orderId: newOrder._id });

  } catch (err) {
    console.error("Order Save Error:", err);  // 👈 log full error
    res.status(500).json({ message: "Error saving order", error: err.message });
  }
});


module.exports = router;
