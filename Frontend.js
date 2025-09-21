// ==========================================
// Frontend.js
// Modul JS untuk index.html
// Real-time update dari Firestore
// ==========================================

import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ==========================================
// 1️⃣ Referensi dokumen Firestore
// ==========================================
const docRef = doc(db, "content", "about");

// ==========================================
// 2️⃣ Listener real-time
// Setiap ada perubahan di Firestore, update DOM
// ==========================================
onSnapshot(docRef, (docSnap) => {
  if (!docSnap.exists()) return;

  const data = docSnap.data();

  // Update teks
  const textFields = [
    "judul","sapaan","doa","kota","serambi","ajakan","jam","bestseller",
    "lokasi","ojol","alasan","promo","testimoni","share","footer"
  ];
  textFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = data[id] || "";
  });

  // Update promo image
  const promoImage = document.getElementById("promoImage");
  if (promoImage) promoImage.src = data.promoImageInput || "";

  // Update galeri
  const galeriDiv = document.getElementById("galeri");
  if (galeriDiv) {
    galeriDiv.innerHTML = "";
    if (data.galeriInput) {
      data.galeriInput.split("|").forEach(url => {
        const img = document.createElement("img");
        img.src = url.trim();
        img.style.maxWidth = "200px";
        img.style.margin = "5px";
        img.style.borderRadius = "8px";
        galeriDiv.appendChild(img);
      });
    }
  }

  // Update fakta list
  const faktaList = document.getElementById("faktaList");
  if (faktaList) {
    faktaList.innerHTML = "";
    for (let i = 1; i <= 6; i++) {
      if (data["fakta" + i]) {
        const li = document.createElement("li");
        li.textContent = data["fakta" + i];
        faktaList.appendChild(li);
      }
    }
  }
});
