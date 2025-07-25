document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const msgEl = document.getElementById("loginMessage");

  msgEl.textContent = "Logging in...";
  msgEl.className = "text-muted";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      msgEl.textContent = "Login successful!";
      msgEl.className = "text-success";
      window.location.href = "index.html";
    } else {
      msgEl.textContent = data.error || "Login failed.";
      msgEl.className = "text-danger";
    }
  } catch (err) {
    msgEl.textContent = "Network error.";
    msgEl.className = "text-danger";
  }
});
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const msgEl = document.getElementById("signupMessage");

  msgEl.textContent = "Signing up...";
  msgEl.className = "text-muted";

  try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      msgEl.textContent = "Sign up successful!";
      msgEl.className = "text-success";
      window.location.href = "index.html";
    } else {
      msgEl.textContent = data.error || "Sign up failed.";
      msgEl.className = "text-danger";
    }
  } catch (err) {
    msgEl.textContent = "Network error.";
    msgEl.className = "text-danger";
  }
});

document.querySelectorAll(".password-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (input.type === "password") {
      input.type = "text";
      toggle.classList.replace("bi-eye", "bi-eye-slash");
      toggle.style.color = "#0d6efd";
    } else {
      input.type = "password";
      toggle.classList.replace("bi-eye-slash", "bi-eye");
      toggle.style.color = "#6c757d";
    }
  });
});
