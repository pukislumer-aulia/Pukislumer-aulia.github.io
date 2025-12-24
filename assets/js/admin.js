// assets/js/admin.js

import { Auth } from "./core/auth.js";

// Import module admin
import "./modules/orders.js";
import "./modules/nota.js";

// ===== ELEMENTS (SAFE) =====
const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const pinInput = document.getElementById("pinInput");

// ===== GUARD =====
if (!loginScreen || !adminPanel) {
  console.warn("admin.js: bukan halaman admin");
  // hentikan eksekusi agar tidak error di halaman lain
  throw new Error("ADMIN_PAGE_REQUIRED");
}

// ===== RENDER UI =====
function render() {
  const loggedIn = Auth.isLoggedIn();

  if (loggedIn) {
    loginScreen.style.display = "none";
    adminPanel.style.display = "block";
  } else {
    loginScreen.style.display = "flex";
    adminPanel.style.display = "none";
  }

  console.log("[ADMIN] render:", loggedIn ? "LOGGED IN" : "LOGGED OUT");
}

// ===== INIT =====
render();

// ===== LOGIN =====
loginBtn?.addEventListener("click", () => {
  const pin = pinInput?.value?.trim();

  if (!pin) {
    alert("Masukkan PIN");
    return;
  }

  const success = Auth.login(pin);

  if (!success) {
    alert("PIN salah atau tidak valid");
    return;
  }

  pinInput.value = "";
  render();
});

// ===== LOGOUT =====
logoutBtn?.addEventListener("click", () => {
  Auth.logout();
  location.reload();
});

// ===== SECURITY: BLOCK ACCESS IF NOT LOGIN =====
if (!Auth.isLoggedIn()) {
  // Pastikan panel tidak sempat muncul
  adminPanel.style.display = "none";
}
