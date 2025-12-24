// assets/js/admin.js

import { Auth } from "./core/auth.js";

// Elements
const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const pinInput = document.getElementById("pinInput");

// Init
function render() {
  if (Auth.isLoggedIn()) {
    loginScreen.style.display = "none";
    adminPanel.style.display = "block";
  } else {
    loginScreen.style.display = "flex";
    adminPanel.style.display = "none";
  }
}

render();

// Login
loginBtn?.addEventListener("click", () => {
  const pin = pinInput.value.trim();

  if (!Auth.login(pin)) {
    alert("PIN salah atau tidak valid");
    return;
  }

  pinInput.value = "";
  render();
});

// Logout
logoutBtn?.addEventListener("click", () => {
  Auth.logout();
  location.reload();
});
