async function loadUserOrders() {
  try {
    const res = await fetch("/api/order/my-orders");
    if (!res.ok) throw new Error("Please login first");

    const orders = await res.json();
    const container = document.getElementById("ordersContainer");
    container.innerHTML = "";

     if (orders.length === 0) {
      // No orders case
      container.innerHTML = `
        <p>You don't have any orders yet.</p>
        <button id="shopNowBtn" class="shop-now-btn">Shop Now</button>
      `;
      document.getElementById("shopNowBtn").addEventListener("click", () => {
        window.location.href = "/shop"; // Replace with your shop page URL
      });
      return;
    }
    
    orders.forEach(order => {
      const productsHTML = order.products.map(p => `
        <tr>
          <td><img src="../..${p.image}" alt="Product" width="60"></td>
          <td>${p.productId}</td>
          <td>${p.name}</td>
          <td>${p.selectedColor || "Default Color"}</td>
          <td>${p.qty}</td>
          <td>₹${p.subtotal}</td>
        </tr>
      `).join("");

      const orderDiv = document.createElement("div");
      orderDiv.classList.add("order-card"); // use CSS styling
      orderDiv.innerHTML = `
        <h3 class="order-id">Order ID: ${order._id}</h3>
        <p class="animated-status">
          Status: <b class="status">${order.status}</b> |
          ${
            order.status === "Delivered" ? `Delivered On:<b class="delivery">${new Date(order.deliveredAt).toLocaleDateString()}</b>` :`Delivery Estimate: <b class="delivery">${order.deliveryEstimate} </b>`
            }
        </p>
        <p>Total Qty: ${order.totalQty} | Total Price: ₹${order.totalPrice}</p>
        <h4>Products:</h4>
        <div class="table-container">
          <table id="orderTable">
            <tr>
              <th>Image</th>
              <th>Product ID</th>
              <th>Name</th>
              <th>Color</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
            ${productsHTML}
          </table>
        </div>
        <h4 id="addressHeading">Delivery Address:</h4>
        <p>
          ${order.address.fullname}<br>
          ${order.address.address}, ${order.address.building}<br>
          ${order.address.city}, ${order.address.state} - ${order.address.pincode}<br>
          Mobile: ${order.address.mobile}
        </p>
      `;
      container.appendChild(orderDiv);

      // Animate status/delivery
      const statusEl = orderDiv.querySelector(".status");
      const deliveryEl = orderDiv.querySelector(".delivery");
      statusEl.classList.add("fadeIn");
      deliveryEl.classList.add("fadeInDelay");
    });
  } catch (err) {
    console.error(err);
    document.getElementById("ordersContainer").innerHTML = "<p>Please login to view your orders.</p>";
  }
}

loadUserOrders();