async function loadOrderSummary() {
  try {
    // Get logged-in user
    const userRes = await fetch("/get-user");
    const user = await userRes.json();
    const userId = user.email;

    // Fetch cart items
    const res = await fetch(`/api/cart/user/${userId}`);
    const items = await res.json();
if (!items || items.length === 0) {
  document.body.innerHTML = ""; // clear page content
  setTimeout(() => {
    alert("Add a product for order");
    window.location.href = "/user/shop";
  }, 0);
  return;
}
    document.getElementById("order-heading").style.display = "block";
    document.getElementById("orderTable").style.display = "table";
    document.getElementById("orderSummary").style.display = "block";
    document.getElementById("deliveryForm").style.display = "block";
    document.getElementById("addressHeading").style.display = "block";


    const orderBody = document.getElementById("orderBody");
    const orderSummary = document.getElementById("orderSummary");
    orderBody.innerHTML = "";

    let totalQty = 0;
    let totalPrice = 0;

    items.forEach(item => {
      const discount = item.discount || 0;
      const finalPrice = item.price - (item.price * discount / 100);
      const subtotal = finalPrice * item.qty;

      totalQty += item.qty;
      totalPrice += subtotal;

      const color = item.selectedColor && item.selectedColor.trim() !== ""
        ? item.selectedColor
        : "Default Product Color";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><img src="../..${item.image}" alt="Product" width="60"></td>
        <td>${item.name}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td>${discount}%</td>
        <td>${color}</td>
        <td>${item.qty}</td>
        <td>₹${Math.round(subtotal)}</td>
      `;
      orderBody.appendChild(row);
    });

    if (items.length > 0) {
      orderSummary.style.display = "block";
      document.getElementById("productCount").textContent = "Products: " + items.length;
      document.getElementById("totalQty").textContent = "Total Quantity: " + totalQty;
      document.getElementById("totalPrice").textContent = "Total Price: ₹" + Math.round(totalPrice);
    }
  } catch (err) {
    console.error("Error loading order summary:", err);
  }
}

document.getElementById("deliveryForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const address = Object.fromEntries(formData.entries());

  const userRes = await fetch("/get-user");
  const user = await userRes.json();
  const userId = user.email;

  try {
    const res = await fetch("/api/order/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, address })
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Order placed successfully!\n\n" + (data.message || ""));

      // 🧹 Clear frontend order summary
      document.getElementById("orderBody").innerHTML = "";
      document.getElementById("orderSummary").style.display = "none";
      e.target.reset();

      // 🔄 Redirect to orders page
      window.location.href = "/user/orders";
    } else {
      alert("❌ Failed to place order: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    alert("⚠️ Something went wrong: " + err.message);
  }
});

loadOrderSummary();