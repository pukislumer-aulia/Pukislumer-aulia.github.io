document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const pinInput = document.getElementById("adminPin");

  if (!form || !pinInput) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const pin = pinInput.value.trim();
    const ADMIN_PIN = "12345"; // ubah sesuai kebutuhan

    if (pin === ADMIN_PIN) {
      localStorage.setItem("adminLoggedIn", "true");
      window.location.href = "admin.html"; // redirect sekali
    } else {
      alert("PIN salah!");
      pinInput.value = "";
      pinInput.focus();
    }
  });
});
