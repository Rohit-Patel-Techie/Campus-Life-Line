const API = "https://rohit2026.pythonanywhere.com/api";

const form = document.getElementById("requestForm");
const guidanceBtn = document.getElementById("getGuidanceBtn");
const guidanceBox = document.getElementById("guidanceBox");

guidanceBtn?.addEventListener("click", async () => {
  guidanceBox.innerHTML = "Loading guidance...";
  const res = await fetch(`${API}/guidance/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Give emergency blood donation guidance." })
  });
  const data = await res.json();
  guidanceBox.innerHTML = data.answer || "No response.";
});


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