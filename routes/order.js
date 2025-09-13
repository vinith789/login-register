const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User"); // to get user info
const nodemailer = require("nodemailer");

require("dotenv").config();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

// Confirm order
// Confirm order
router.post("/confirm", async (req, res) => {
  try {
    const { userId, address } = req.body;

    // Get cart items
    const cartItems = await Cart.find({ userId });
    if (!cartItems.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Get user details
    const user = await User.findOne({ email: userId });

    // Calculate totals
    let totalQty = 0, totalPrice = 0;
    const products = cartItems.map(item => {
      const discount = item.discount || 0;
      const finalPrice = item.price - (item.price * discount / 100);
      const subtotal = finalPrice * item.qty;

      totalQty += item.qty;
      totalPrice += subtotal;

      return {
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        discount: item.discount,
        qty: item.qty,
        selectedColor: item.selectedColor || "Default",
        subtotal: Math.round(subtotal)
      };
    });

    // Save order + clear cart in parallel
    const order = new Order({
      userId,
      products,
      totalQty,
      totalPrice: Math.round(totalPrice),
      address
    });

    await Promise.all([
      order.save(),
      Cart.deleteMany({ userId })
    ]);

    // ✅ Send fast response to frontend
    res.json({ message: "Check Your mail Box For More Information" });

    // 🔄 Background email sending (no wait for user)
    const productList = products.map(
      p => `
        <tr>
          <td>${p.productId}</td>
          <td>${p.name}</td>
          <td>${p.selectedColor}</td>
          <td>${p.qty}</td>
          <td>$${p.subtotal}</td>
        </tr>`
    ).join("");

    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: address.email,
      subject: "🎉 Congratulations – Your Order is Confirmed!",
      html: `
        <h2>Hello ${address.fullname}, 🎉</h2>
        <p>Your order has been placed successfully at <b>Allwin Baby Shop</b> 🍼💖</p>
        <h3>🛒 Products Ordered</h3>
        <table border="1" cellspacing="0" cellpadding="5">
          <tr>
            <th>Product ID</th>
            <th>Name</th>
            <th>Color</th>
            <th>Qty</th>
            <th>Subtotal</th>
          </tr>
          ${productList}
        </table>
        <p><b>Total Quantity:</b> ${totalQty}</p>
        <p><b>Total Price:</b> $${Math.round(totalPrice)}</p>
      `
    };

    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: "vinithvinith2207@gmail.com",
      subject: "🛒 New Order Received",
      html: `
        <h2>New Order Alert 🚨</h2>
        <p>Customer: ${address.fullname} (${user?.email || address.email})</p>
        <h3>Products Ordered</h3>
        <table border="1" cellspacing="0" cellpadding="5">
          <tr>
            <th>Product ID</th>
            <th>Name</th>
            <th>Color</th>
            <th>Qty</th>
            <th>Subtotal</th>
          </tr>
          ${productList}
        </table>
        <p><b>Total Quantity:</b> ${totalQty}</p>
        <p><b>Total Price:</b> $${Math.round(totalPrice)}</p>
      `
    };

    // 🔄 Background (async, don’t wait)
    Promise.all([
      transporter.sendMail(userMailOptions),
      transporter.sendMail(adminMailOptions)
    ])
    .then(() => console.log("✅ Emails sent successfully"))
    .catch(err => console.error("❌ Email error:", err));

  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: "Failed to confirm order" });
  }
});


// Helper function to get delivery estimate based on status
function getDeliveryEstimate(status) {
  switch (status) {
    case "Ordered":
      return "7 to 8 days";
    case "Processing":
      return "5 to 6 days";
    case "Shipped":
      return "3 to 4 days";
    default:
      return "Unknown";
  }
}

// 📌 Get user orders
router.get("/my-orders", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userEmail = req.session.user.email; // user email from session
    const orders = await Order.find({ userId: userEmail }).sort({ createdAt: -1 });

    const updatedOrders = orders.map(order => ({
      ...order._doc,
      deliveryEstimate: getDeliveryEstimate(order.status) // ✅ now defined
    }));

    res.json(updatedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Get all orders (for admin)
router.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    // Add delivery estimate to each order
    const updatedOrders = orders.map(order => ({
      ...order._doc,
      deliveryEstimate: getDeliveryEstimate(order.status)
    }));

    res.json(updatedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// 📌 Update order status + send mail to user
router.post("/admin/orders/update-status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const updateData = { status };
    if (status === "Delivered") {
      updateData.deliveredAt = new Date(); // ✅ store current time when delivered
    }

    // update order
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Get delivery estimate
    const deliveryTime = getDeliveryEstimate(status);

    // prepare products list for email
    const productList = order.products.map(
      p => `
        <tr>
          <td>${p.productId}</td>
          <td>${p.name}</td>
          <td>${p.selectedColor}</td>
          <td>${p.qty}</td>
          <td>$${p.subtotal}</td>
        </tr>`
    ).join("");

    let subject, htmlContent;

    if (status === "Delivered") {
      // ✅ Thank you mail
      subject = "🎉 Thank You for Shopping with Allwin Baby Shop!";
      htmlContent = `
        <h2>Hello ${order.address.fullname},</h2>
        <p>We’re excited to let you know that your order has been <b>delivered successfully</b> </p>

        <h3>🛒 Order Summary</h3>
        <table border="1" cellspacing="0" cellpadding="5">
          <tr>
            <th>Product ID</th>
            <th>Name</th>
            <th>Color</th>
            <th>Qty</th>
            <th>Subtotal</th>
          </tr>
          ${productList}
        </table>

        <p><b>Total Quantity:</b> ${order.totalQty}</p>
        <p><b>Total Price:</b> $${order.totalPrice}</p>

        <p>🙏 Thank you for shopping with <b>Allwin Baby Shop</b> 🍼💖</p>
        <p>We hope to see you again soon!</p>
      `;
    } else {
      // ✅ Normal status update mail
      subject = `📦 Your Order is now ${status}`;
      htmlContent = `
        <h2>Hello ${order.address.fullname},</h2>
        <p>Your order status has been updated to:</p>
        <h3 style="color:green">${status}</h3>

        <h3>🛒 Order Summary</h3>
        <table border="1" cellspacing="0" cellpadding="5">
          <tr>
            <th>Product ID</th>
            <th>Name</th>
            <th>Color</th>
            <th>Qty</th>
            <th>Subtotal</th>
          </tr>
          ${productList}
        </table>

        <p><b>Total Quantity:</b> ${order.totalQty}</p>
        <p><b>Total Price:</b> $${order.totalPrice}</p>
        <p><b>Estimated Delivery:</b> ${deliveryTime}</p>
      `;
    }

    // send mail
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: order.address.email,
      subject,
      html: htmlContent
    });

    res.json({ message: "Status updated & email sent", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});


module.exports = router;
