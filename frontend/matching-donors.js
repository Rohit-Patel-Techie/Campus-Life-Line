import "./campuslifeline.js";

const API = "https://rohit2026.pythonanywhere.com/api";
const params = new URLSearchParams(window.location.search);
const requestId = params.get("request_id") || localStorage.getItem("last_request_id");

const summaryBox = document.getElementById("requestSummary");
const tableBody = document.getElementById("matchingTableBody");
const acceptPanel = document.getElementById("acceptPanel");
const sendAlertBtn = document.getElementById("sendAlertBtn");
const alertStatus = document.getElementById("alertStatus");
const bloodGroupStats = document.getElementById("bloodGroupStats");

if (!requestId) {
    acceptPanel.innerHTML = `<div class="status-error">❌ request_id missing</div>`;
    throw new Error("request_id missing");
}

function renderAccepted(donor) {
    acceptPanel.innerHTML = `
    <div class="status-success">
      <h3>✅ Donor Found</h3>
      <p><b>Donor:</b> ${donor.name} • ${donor.contact_number}</p>
      <p><b>Area:</b> ${donor.area}</p>
      <p><b>Email:</b> ${donor.email}</p>
    </div>
  `;
    disableAcceptButtons();
}

async function loadRequestAndMatches() {
    const res = await fetch(`${API}/requests/${requestId}/matches/`);
    const data = await res.json();

    const req = data.request;

    summaryBox.innerHTML = `
    <b>Patient:</b> ${req.name} •
    <b>Blood Group:</b> ${req.blood_group} •
    <b>Area:</b> ${req.area} •
    <b>Hospital:</b> ${req.hospital_name}
  `;

    tableBody.innerHTML = data.matching_donors.map(d => `
    <tr>
      <td>${d.name || "Anonymous"}</td>
      <td>${d.blood_group}</td>
      <td>${d.area || "N/A"}</td>
      <td>${d.college || "N/A"}</td>
      <td>
        <button class="btn-outline accept-btn" data-id="${d.id}">Accept Request</button>
      </td>
    </tr>
  `).join("");

    document.querySelectorAll(".accept-btn").forEach(btn => {
        btn.onclick = () => acceptRequest(btn.dataset.id);
    });

    // ✅ IMMEDIATE render if already accepted
    if (req.status === "accepted" && req.donor_contact) {
        renderAccepted(req.donor_contact);
    }
}

async function pollStatus() {
    const res = await fetch(`${API}/requests/${requestId}/status/`);
    const data = await res.json();

    if (data.status === "accepted" && data.donor_contact) {
        renderAccepted(data.donor_contact);
    }
}

async function sendAlerts() {
    alertStatus.textContent = "Sending alerts...";
    const res = await fetch(`${API}/requests/${requestId}/alerts/`, { method: "POST" });
    const data = await res.json();
    alertStatus.textContent = `Alerts sent to ${data.count || 0} donors.`;
}

async function acceptRequest(donorId) {
    const res = await fetch(`${API}/requests/${requestId}/respond/?donor_id=${donorId}&action=accept`, {
        method: "POST"
    });

    if (res.status === 409) {
        acceptPanel.innerHTML = `<div class="status-error">Request already accepted by another donor.</div>`;
        disableAcceptButtons();
        return;
    }

    const data = await res.json();
    if (data.status === "accepted") {
        renderAccepted(data.donor_contact);
    }
}

function disableAcceptButtons() {
    document.querySelectorAll(".accept-btn").forEach(b => {
        b.disabled = true;
        b.textContent = "Request Locked";
    });
}

sendAlertBtn.onclick = sendAlerts;

loadRequestAndMatches();
loadBloodGroupStats?.();
setInterval(pollStatus, 5000);