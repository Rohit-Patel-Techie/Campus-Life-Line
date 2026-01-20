import "./campuslifeline.js";

const API = "https://rohit2026.pythonanywhere.com/api";
const params = new URLSearchParams(window.location.search);

const requestId = params.get("request_id");
const donorId = params.get("donor_id");
const action = params.get("action") || "accept";

const box = document.getElementById("responseBox");

async function respond() {
    const res = await fetch(`${API}/requests/${requestId}/respond/?donor_id=${donorId}&action=${action}`, {
        method: "POST"
    });

    if (res.status === 409) {
        box.innerHTML = `<div class="status-error">Request already accepted by another donor.</div>`;
        return;
    }

    const data = await res.json();

    if (data.status === "rejected") {
        box.innerHTML = `<div class="status-error">You have rejected the request. Thank you.</div>`;
        return;
    }

    if (data.status === "accepted") {
        box.innerHTML = `
      <div class="status-success">
        <h2>✅ Request Accepted</h2>
        <p><b>Patient:</b> ${data.patient_contact.name} • ${data.patient_contact.contact_number}</p>
        <p><b>Donor:</b> ${data.donor_contact.name} • ${data.donor_contact.contact_number}</p>
        <p><b>Hospital:</b> ${data.patient_contact.hospital_name}</p>
      </div>
    `;
    }
}

respond();