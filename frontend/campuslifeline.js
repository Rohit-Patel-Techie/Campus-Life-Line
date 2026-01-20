const API = "https://rohit2026.pythonanywhere.com/api";

const form = document.getElementById("guidanceForm");
const output = document.getElementById("guidanceOutput");

// ===== Hamburger Menu =====
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
if (menuToggle) {
  menuToggle.onclick = () => {
    navMenu.classList.toggle("show");
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
  };
}

// ===== Donor Form =====
const donorForm = document.getElementById("donorForm");
if (donorForm) {
  donorForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(donorForm));
    const res = await fetch(`${API}/donors/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const donor = await res.json();
    const donorName = encodeURIComponent(data.name || "Donor");
    const donorId = encodeURIComponent(donor.id || "");
    window.location.href = `donor-success.html?name=${donorName}&id=${donorId}`;
  };
}

// ===== Request Form =====
const requestForm = document.getElementById("requestForm");
if (requestForm) {
  requestForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(requestForm));
    const res = await fetch(`${API}/requests/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    window.location.href = `matching-donors.html?request_id=${result.id}`;
  };
}

// ===== Firestore Live Updates =====
const requestsBox = document.getElementById("requests");
if (requestsBox) {
  onSnapshot(collection(db, "requests"), (snapshot) => {
    requestsBox.innerHTML = snapshot.docs.map(doc => {
      const r = doc.data();
      return `<div>
        <b>${r.blood_group || "N/A"}</b> at ${r.hospital_name || "Unknown"} (${r.area || "N/A"})
      </div><hr>`;
    }).join("");
  });
}

function renderGuidanceJson(data) {
  const steps = data.steps || [];
  const docs = data.documents_required || {};
  const precautions = data.precautions || [];

  const stepsHtml = steps.map(s => `
    <div class="guidance-item">
      <div class="guidance-number">${s.number}</div>
      <div class="guidance-text">${s.text}</div>
    </div>
  `).join("");

  const patientDocs = (docs.patient || []).map(d => `<li>${d}</li>`).join("");
  const donorDocs = (docs.donor || []).map(d => `<li>${d}</li>`).join("");
  const precautionItems = precautions.map(p => `<li>${p}</li>`).join("");

  output.innerHTML = `
    <div class="guidance-list">${stepsHtml}</div>

    <div class="guidance-section">
      <h4>Required Documents</h4>
      <div class="doc-grid">
        <div class="doc-card">
          <h5>Patient</h5>
          <ul>${patientDocs || "<li>Not specified</li>"}</ul>
        </div>
        <div class="doc-card">
          <h5>Donor</h5>
          <ul>${donorDocs || "<li>Not specified</li>"}</ul>
        </div>
      </div>
    </div>

    <div class="guidance-section">
      <h4>Precautions</h4>
      <ul class="precaution-list">
        ${precautionItems || "<li>Not specified</li>"}
      </ul>
    </div>
  `;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  output.innerHTML = `<p class="muted">Getting guidance...</p>`;

  const data = Object.fromEntries(new FormData(form).entries());
  const payload = {
    role: data.role,
    blood_group: data.blood_group,
    location: data.location,
    situation: data.situation,
    last_donation_date: data.last_donation_date || null,
    tone: data.tone || "calm, reassuring",
    documents: data.documents || ""
  };

  try {
    const res = await fetch(`${API}/guidance/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");

    renderGuidanceJson(json);
  } catch (err) {
    output.innerHTML = `<p class="muted">Error: ${err.message}</p>`;
  }
});