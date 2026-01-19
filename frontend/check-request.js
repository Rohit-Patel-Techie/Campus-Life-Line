const API = "http://127.0.0.1:8000/api";

// ✅ hamburger menu toggle (same as home page)
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const form = document.getElementById("checkForm");
const resultBox = document.getElementById("resultBox");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());

  const requestId = (payload.request_id || "").trim();
  const contactNumber = (payload.contact_number || "").trim();

  if (!requestId && !contactNumber) {
    resultBox.innerHTML = `<div class="status-error">Please enter Request ID or Phone Number.</div>`;
    return;
  }

  const params = new URLSearchParams();
  if (requestId) params.set("request_id", requestId);
  if (contactNumber) params.set("contact_number", contactNumber);

  const res = await fetch(`${API}/requests/status-lookup/?${params.toString()}`);
  const data = await res.json();

  if (!data.requests || data.requests.length === 0) {
    resultBox.innerHTML = `<div class="status-error">No request found.</div>`;
    return;
  }

  resultBox.innerHTML = `
    <div class="table-wrap">
      <table class="status-table">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Status</th>
            <th>Patient</th>
            <th>Phone</th>
            <th>Hospital</th>
            <th>Blood</th>
            <th>Donor</th>
            <th>Donor Phone</th>
            <th>Donor Email</th>
          </tr>
        </thead>
        <tbody>
          ${data.requests.map(r => `
            <tr>
              <td>${r.id}</td>
              <td><span class="badge ${r.status === "accepted" ? "badge-green" : "badge-yellow"}">${r.status}</span></td>
              <td>${r.name || "-"}</td>
              <td>${r.contact_number || "-"}</td>
              <td>${r.hospital_name || "-"}</td>
              <td>${r.blood_group || "-"}</td>
              <td>${r.donor_contact?.name || "Waiting..."}</td>
              <td>${r.donor_contact?.contact_number || "-"}</td>
              <td>${r.donor_contact?.email || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
});