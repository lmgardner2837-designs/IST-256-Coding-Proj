document.addEventListener("DOMContentLoaded", () => {
  const isSandbox =
    window.location.hostname.includes("codingrooms") ||
    window.location.hostname.includes("zybooks");

  const API_BASE = isSandbox ? "" : "http://127.0.0.1:3000";

  const listDiv = document.getElementById("returnsList");
  const statusDiv = document.getElementById("returnStatus");

  function showStatus(msg, type = "info") {
    statusDiv.textContent = msg;
    statusDiv.className = "";
    if (!msg) return;
    statusDiv.classList.add("alert");
    if (type === "success") statusDiv.classList.add("alert-success");
    else if (type === "error") statusDiv.classList.add("alert-danger");
    else statusDiv.classList.add("alert-secondary");
  }

  async function loadReturns() {
    try {
      showStatus("");
      const res = await fetch(`${API_BASE}/returns?status=pending`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const rows = await res.json();

      listDiv.innerHTML = "";

      if (!rows.length) {
        listDiv.innerHTML =
          '<div class="alert alert-info mb-0">No pending return requests.</div>';
        return;
      }

      rows.forEach((r) => {
        const card = document.createElement("div");
        card.className = "card mb-3";
        card.innerHTML = `
          <div class="card-body">
            <p><strong>Shopper Email:</strong> ${r.email}</p>
            <p><strong>Product SKU:</strong> ${r.product_sku}</p>
            <p><strong>Quantity:</strong> ${r.quantity}</p>
            <p><strong>Reason:</strong> ${r.reason}</p>
            <p><strong>Status:</strong> ${r.status}</p>
            <button class="btn btn-success me-2" data-id="${r.id}" data-status="approved">Approve</button>
            <button class="btn btn-danger" data-id="${r.id}" data-status="rejected">Reject</button>
          </div>
        `;
        listDiv.appendChild(card);
      });
    } catch (err) {
      console.error("Error loading returns:", err);
      showStatus("Could not load return requests.", "error");
    }
  }

  // Handle approve/reject clicks
  listDiv.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const status = btn.getAttribute("data-status");

    try {
      const res = await fetch(`${API_BASE}/returns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }

      showStatus(`Return ${status}.`, "success");
      loadReturns();
    } catch (err) {
      console.error("Error updating return:", err);
      showStatus("Could not update return status.", "error");
    }
  });

  loadReturns();
});
