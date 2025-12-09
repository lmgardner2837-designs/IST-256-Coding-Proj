document.addEventListener("DOMContentLoaded", () => {
  const isSandbox =
    window.location.hostname.includes("codingrooms") ||
    window.location.hostname.includes("zybooks");

  const API_BASE = isSandbox ? "" : "http://127.0.0.1:3000";

  const form = document.getElementById("returnForm");
  const statusBox = document.getElementById("statusBox");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const orderIdInput = document.getElementById("orderId");
  const skuInput = document.getElementById("sku");
  const qtyInput = document.getElementById("quantity");
  const reasonInput = document.getElementById("reason");

  function showStatus(msg, type) {
    statusBox.textContent = msg;
    statusBox.className = "";
    if (!msg) return;
    statusBox.classList.add("alert");
    if (type === "success") statusBox.classList.add("alert-success");
    else statusBox.classList.add("alert-danger");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showStatus("");

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const orderId = orderIdInput.value.trim();
    const sku = skuInput.value.trim();
    const quantity = parseInt(qtyInput.value, 10) || 0;
    const reason = reasonInput.value.trim();

    if (!email || !sku || quantity <= 0 || !reason) {
      showStatus("Please fill in Email, Product SKU, Quantity, and Reason.", "error");
      return;
    }

    const payload = {
      full_name: fullName || null,
      email,
      orderId: orderId || null,  
      sku,
      quantity,
      reason,
    };

    try {
      console.log("Submitting return:", payload);

      const res = await fetch(`${API_BASE}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }

      const saved = await res.json();
      console.log("Return saved:", saved);

      showStatus("Your return request has been submitted!", "success");
      form.reset();
      qtyInput.value = 1;
    } catch (err) {
      console.error("Error submitting return:", err);
      showStatus("Error submitting return: " + err.message, "error");
    }
  });
});
