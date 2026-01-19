const API = "http://127.0.0.1:8000/api";
const form = document.getElementById("requestForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());

  const res = await fetch(`${API}/requests/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.status === "saved") {
    localStorage.setItem("last_request_id", data.id);
    window.location.href = `matching-donors.html?request_id=${data.id}`;
  } else {
    alert("Failed to submit request.");
  }
});