// admin.js
import {
  firestore,
  getDocData,
  setDocData,
  checkLoginRedirect,
  logout,
  defaultData
} from "./firebase.js";

const form = document.getElementById("adminForm");
const btnSimpan = document.getElementById("btnSimpan");
const btnReset = document.getElementById("btnReset");
const btnLogout = document.getElementById("btnLogout");

// Pastikan hanya user login yang bisa masuk
await checkLoginRedirect("login.html");

// 🔹 Load data ke form
async function loadData() {
  const about = await getDocData("content", "about");
  const data = about || defaultData;

  document.getElementById("judulInput").value = data.judul || "";
  document.getElementById("sapaanInput").value = data.sapaan || "";
  document.getElementById("doaInput").value = data.doa || "";
  document.getElementById("lokasiInput").value = data.lokasi || "";
  document.getElementById("ojolInput").value = data.ojol || "";
  document.getElementById("alasanInput").value = data.alasan || "";
  document.getElementById("promoTextInput").value = data.promoText || "";
  document.getElementById("promoImageInput").value = data.promoImage || "";
  document.getElementById("footerInput").value = data.footer || "";
  document.getElementById("testimoniInput").value = (data.testimoni || []).join("\n");
  document.getElementById("galeriInput").value = (data.galeri || []).join("|");
}

// 🔹 Simpan ke Firestore
btnSimpan.addEventListener("click", async () => {
  const data = {
    judul: document.getElementById("judulInput").value,
    sapaan: document.getElementById("sapaanInput").value,
    doa: document.getElementById("doaInput").value,
    lokasi: document.getElementById("lokasiInput").value,
    ojol: document.getElementById("ojolInput").value,
    alasan: document.getElementById("alasanInput").value,
    promoText: document.getElementById("promoTextInput").value,
    promoImage: document.getElementById("promoImageInput").value,
    footer: document.getElementById("footerInput").value,
    testimoni: document.getElementById("testimoniInput").value.split("\n").map(t => t.trim()).filter(Boolean),
    galeri: document.getElementById("galeriInput").value.split("|").map(u => u.trim()).filter(Boolean),
  };

  try {
    await setDocData("content", "about", data);
    alert("Data berhasil disimpan!");
  } catch (err) {
    alert("Gagal menyimpan: " + err.message);
  }
});

// 🔹 Reset ke default
btnReset.addEventListener("click", async () => {
  if (confirm("Kembalikan ke pengaturan default?")) {
    await setDocData("content", "about", defaultData);
    await loadData();
    alert("Data dikembalikan ke default.");
  }
});

// 🔹 Logout
btnLogout.addEventListener("click", async () => {
  await logout();
  window.location.href = "login.html";
});

// Jalankan load pertama
loadData();
