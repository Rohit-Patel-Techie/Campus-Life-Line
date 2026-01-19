import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const API = "http://127.0.0.1:8000/api";

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

// ===== Firestore Config =====
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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