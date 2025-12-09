// products.js

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:3000";

  const form = document.getElementById("productForm");
  const messageBox = document.getElementById("productMessage");
  const tableBody = document.getElementById("productTable");
  const jsonOutput = document.getElementById("jsonOutput");
  const searchInput = document.getElementById("searchInput");

  const idInput = document.getElementById("productId");
  const descInput = document.getElementById("description");
  const categoryInput = document.getElementById("category");
  const unitInput = document.getElementById("unit");
  const priceInput = document.getElementById("price");
  const weightInput = document.getElementById("weight");

  let products = [];

  // ---- load products from DB ----
  async function loadProducts() {
    try {
      console.log("Loading products...");
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error("Server error: " + res.status);
      products = await res.json();
      console.log("Loaded", products.length, "products");
      renderProducts();
      messageBox.textContent = "";
    } catch (err) {
      console.error("Error loading products:", err);
      messageBox.textContent = "Could not load products from server.";
    }
  }

  // ---- render table + JSON ----
  function renderProducts() {
    tableBody.innerHTML = "";

    const filtered = filterProducts(searchInput.value);

    filtered.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${String(p.sku).padStart(3, "0")}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.unit || ""}</td>
        <td>${Number(p.price).toFixed(2)}</td>
        <td>${p.description || "N/A"}</td>
      `;
      tableBody.appendChild(tr);
    });

    const jsonArray = filtered.map((p) => ({
      id: String(p.sku).padStart(3, "0"),
      description: p.name,
      category: p.category,
      unit: p.unit || "",
      price: Number(p.price).toFixed(2),
      weight: p.description || "N/A",
    }));

    jsonOutput.textContent = JSON.stringify(jsonArray, null, 2);
  }

  function filterProducts(term) {
    term = (term || "").toLowerCase();
    if (!term) return products;

    return products.filter((p) => {
      const id = String(p.sku).padStart(3, "0").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      return (
        id.includes(term) || name.includes(term) || cat.includes(term)
      );
    });
  }

  // ---- submit: add / update product ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageBox.textContent = "";

    const rawId = idInput.value.trim();
    const sku = parseInt(rawId, 10);
    const name = descInput.value.trim();
    const category = categoryInput.value.trim();
    const unit = unitInput.value.trim();
    const price = parseFloat(priceInput.value);
    const weightInfo = weightInput.value.trim();

    if (!sku || !name || !category || isNaN(price)) {
      messageBox.textContent =
        "Product ID, Description, Category, and Price are required.";
      return;
    }

    const payload = {
      sku,
      name,
      category,
      unit,
      price,
      description: weightInfo,
      in_stock: 0,
    };

    try {
      const existing = products.find((p) => p.sku === sku);

      let res;
      if (existing) {
        console.log("Updating product id", existing.id);
        res = await fetch(`${API_BASE}/products/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        console.log("Creating new product with sku", sku);
        res = await fetch(`${API_BASE}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Server error");
      }

      await loadProducts();
      form.reset();
      messageBox.textContent = "Product saved to database.";
    } catch (err) {
      console.error("Error saving product:", err);
      messageBox.textContent = "Error saving product: " + err.message;
    }
  });

  searchInput.addEventListener("input", () => {
    renderProducts();
  });

  loadProducts();
});

