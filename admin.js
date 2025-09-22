// ==========================================
// 🔹 admin.js
// Logic untuk halaman Admin (admin.html)
// ==========================================

import { 
  firestore,
  auth,
  getDocData,
  setDocData,
  checkLoginRedirect,
  logout,
  defaultData
} from "./firebase.js";

// ID dokumen di Firestore (bebas, tapi konsisten)
const CONTENT_DOC_ID = "main_content";

// ==========================================
// 🔹 DOM Elements
// ==========================================
const form = document.getElementById("adminForm");
const logoutBtn = document.getElementById("logoutBtn");
const resetBtn = document.getElementById("resetBtn"); // tombol kembali ke default

// ==========================================
// 🔹 Load Data dari Firestore
// ==========================================
async function loadContent() {
  await checkLoginRedirect(); // pastikan admin login

  const data = await getDocData("content", CONTENT_DOC_ID);
  const content = data || defaultData;

  // Isi form dengan data
  for (const key in content) {
    const el = document.getElementById(key + "Input");
    if (el) {
      if (Array.isArray(content[key])) {
        el.value = content[key].join("|");
      } else {
        el.value = content[key];
      }
    }
  }
}

// ==========================================
// 🔹 Simpan Data ke Firestore
// ==========================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {};
  for (const key in defaultData) {
    const el = document.getElementById(key + "Input");
    if (el) {
      if (el.value.includes("|")) {
        data[key] = el.value.split("|").map(v => v.trim()).filter(v => v);
      } else {
        data[key] = el.value.trim();
      }
    }
  }

  await setDocData("content", CONTENT_DOC_ID, data);
  alert("✅ Konten berhasil disimpan!");
});

// ==========================================
// 🔹 Reset ke Default
// ==========================================
resetBtn.addEventListener("click", async () => {
  if (confirm("Yakin ingin mengembalikan ke pengaturan default?")) {
    await setDocData("content", CONTENT_DOC_ID, defaultData);
    await loadContent();
    alert("✅ Konten sudah dikembalikan ke default.");
  }
});

// ==========================================
// 🔹 Logout
// ==========================================
logoutBtn.addEventListener("click", async () => {
  await logout();
  window.location.href = "login.html";
});

// ==========================================
// 🔹 Init
// ==========================================
loadContent();
