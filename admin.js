// ==========================================
// Admin.js
// Modul JS untuk halaman admin.html
// Tetap menggunakan field yang sama agar sinkron ke index.html
// ==========================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ==========================================
// 1️⃣ Cek login user
// Jika user tidak login, redirect ke login.html
// ==========================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadContent();
  } else {
    window.location.href = "login.html";
  }
});

// ==========================================
// 2️⃣ Load konten Firestore ke input admin
// ==========================================
async function loadContent() {
  const docRef = doc(db, "content", "about"); // dokumen yang sama dengan frontend
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Loop semua field dan isi input sesuai id
      for (let key in data) {
        const input = document.getElementById(key);
        if (input) input.value = data[key];
      }
    }
  } catch (err) {
    console.error("Gagal load konten:", err);
  }
}

// ==========================================
// 3️⃣ Simpan konten ke Firestore
// ==========================================
const saveBtn = document.getElementById("saveBtn");
saveBtn.addEventListener("click", async () => {
  const fields = [
    "judul","sapaan","doa","kota","serambi","ajakan","jam","bestseller",
    "lokasi","ojol","alasan","fakta1","fakta2","fakta3","fakta4","fakta5","fakta6",
    "promo","testimoni","share","footer","promoImageInput","galeriInput"
  ];

  const data = {};
  fields.forEach(id => {
    const input = document.getElementById(id);
    if (input) data[id] = input.value;
  });

  try {
    await setDoc(doc(db, "content", "about"), data);
    alert("Konten berhasil disimpan!");
  } catch (err) {
    console.error("Gagal menyimpan konten:", err);
    alert("Gagal menyimpan konten, cek console");
  }
});

// ==========================================
// 4️⃣ Logout user
// ==========================================
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => window.location.href = "login.html")
    .catch(err => {
      console.error("Gagal logout:", err);
      alert("Gagal logout, cek console");
    });
});
