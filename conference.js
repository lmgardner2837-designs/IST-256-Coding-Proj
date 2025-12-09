document.addEventListener("DOMContentLoaded", () => {
  const isSandbox =
    window.location.hostname.includes("codingrooms") ||
    window.location.hostname.includes("zybooks");

  const API_BASE = isSandbox ? "" : "http://127.0.0.1:3000";

  const form = document.getElementById("confForm");
  const statusBox = document.getElementById("statusBox");
  const jsonPreview = document.getElementById("jsonPreview");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const participationInput = document.getElementById("participation");
  const sessionInput = document.getElementById("session");
  const dietaryInput = document.getElementById("dietary");
  const commentsInput = document.getElementById("comments");

  function showStatus(msg, type = "info") {
    statusBox.textContent = msg;
    statusBox.className = "";
    statusBox.classList.add("mt-3");

    if (type === "success") statusBox.classList.add("alert", "alert-success");
    else if (type === "error") statusBox.classList.add("alert", "alert-danger");
    else statusBox.classList.add("alert", "alert-secondary");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusBox.textContent = "";

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const participation = participationInput.value;   // "1" or "2"
    const session = sessionInput.value;
    const dietary = dietaryInput.value.trim();
    const comments = commentsInput.value.trim();

    if (!fullName || !email || !participation || !session) {
      showStatus(
        "Please fill out Name, Email, Participation Type, and Session.",
        "error"
      );
      return;
    }

    const payload = {
      full_name: fullName,
      email,
      phone: phone || null,
      option_id: parseInt(participation, 10),   // numeric for INT column
      dietary_restrictions: dietary || null,
      comments: `Session: ${session}${
        comments ? " | Comments: " + comments : ""
      }`,
    };

    jsonPreview.textContent = JSON.stringify(payload, null, 4);

    try {
      console.log("Submitting conference signup:", payload);

      const res = await fetch(`${API_BASE}/conference_signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }

      const saved = await res.json();
      console.log("Conference signup saved:", saved);
      showStatus("Thank you! Your registration has been saved.", "success");
    } catch (err) {
      console.error("Error submitting conference signup:", err);
      showStatus("Error submitting signup: " + err.message, "error");
    }
  });
});  

