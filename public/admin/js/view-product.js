 // Fetch product data from backend API
  fetch('/api/products')
    .then(res => res.json())
    .then(products => {
      const container = document.querySelector('.content-section');
      if (!products || products.length === 0) {
        container.innerHTML = "<p>No products available</p>";
        return;
      }

      // Build Bootstrap cards
      container.innerHTML = `
        <div class="product-grid">
          ${products.map(p => `
            <div class="product-card">
                <img src="${p.image}" alt="${p.name}" style="height:180px; object-fit:cover;">
                  <h5>${p.name || "Unnamed Product"}</h5>
                  <p class="product-price"><strong>Price:</strong> ₹${p.price || 0}</p>
                  <p class="product-price"><strong>Discount:</strong> ${p.discount || 0}%</p>
                  <p><strong>You Tube Link: </strong>${p.description || "No You Tube Link"}</p>
                  <p><strong>Description About the Product: </strong>${p.about || "No description for this product"}</p>
                  <h4>Catalogues:</h4>
                  <div>
                    ${(() => {
                      const grouped = {};
                      (p.catalogues || []).forEach(c => {
                        const parts = c.split(" - ");
                        const heading = parts[0] || "Category";
                        const value = parts[1] || "";
                        if (!grouped[heading]) grouped[heading] = [];
                        grouped[heading].push(value);
                      });
                      return Object.keys(grouped).map(heading => `
                        <div><strong>${heading}:</strong> ${grouped[heading].join(", ")}</div>
                      `).join("");
                    })()}
                  </div>
                   <p><strong> Colors:</strong>
                ${(p.colors && p.colors.length > 0)
                  ? p.colors.join(", ")
                  : "Default  Product Color"}
              </p>
                <div class="card-actions">
                  <a class="btn" href="/admin/edit-product.html?id=${p._id}">Edit</a>
                  <a class="btn" href="/admin/delete-product/${p._id}" onclick="return confirm('Are you sure?')">Delete</a>
                </div>
              </div>
          `).join("")}
        </div>
      `;
    })
    .catch(err => {
      console.error("Error fetching products:", err);
      document.getElementById('product-list').innerHTML = "<p>Error loading products</p>";
    });