// ==========================================
// 🔹 firebase.js
// 🔹 Konfigurasi Firebase & helper untuk Admin / Frontend
// ==========================================

// 🔹 Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ==========================================
// 🔹 Konfigurasi Firebase
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAnbQ7lq8YO7j2CF-nyoEhd9vckN7P1IWA",
  authDomain: "pukis-lumer-aulia.firebaseapp.com",
  projectId: "pukis-lumer-aulia",
  storageBucket: "pukis-lumer-aulia.appspot.com",
  messagingSenderId: "1059510074119",
  appId: "1:1059510074119:web:06b32f510a3d038324a3a2",
  measurementId: "G-NZY82GKPXS"
};

// ==========================================
// 🔹 Inisialisasi App, Auth & Firestore
// ==========================================
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ==========================================
// 🔹 Helper: Cek login & redirect jika belum
// ==========================================
export function checkLoginRedirect(redirectUrl = "login.html") {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = redirectUrl;
    }
  });
}

// ==========================================
// 🔹 Helper: Ambil dokumen konten generik
// ==========================================
export async function getContent(docId = "about") {
  try {
    const docRef = doc(db, "content", docId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : {};
  } catch (err) {
    console.error("Error getContent:", err);
    return {};
  }
}

// ==========================================
// 🔹 Helper: Update dokumen konten generik
// ==========================================
export async function updateContent(docId = "about", data) {
  try {
    await setDoc(doc(db, "content", docId), data);
  } catch (err) {
    console.error("Error updateContent:", err);
    throw err;
  }
}

// ==========================================
// 🔹 Helper: Load konten ke index.html (frontend)
// ==========================================
export async function loadHomePage() {
  const data = await getContent("about");
  if (!data) return;

  // Mapping semua elemen yang ada di index.html
  if (data.judul) document.getElementById("judulUtama").innerText = data.judul;
  if (data.sapaan) document.getElementById("sambutan1").innerText = data.sapaan;
  if (data.doa) document.getElementById("sambutan2").innerText = data.doa;
  if (data.kota) document.getElementById("lokasi1").innerText = data.kota;
  if (data.serambi) document.getElementById("lokasi2").innerText = data.serambi;
  if (data.ajakan) document.getElementById("lokasi3").innerText = data.ajakan;
  if (data.jam) document.getElementById("jamOperasional").innerText = data.jam;
  if (data.bestseller) document.getElementById("bestSeller").innerText = data.bestseller;
  if (data.lokasi) document.getElementById("lokasiTeks").innerText = data.lokasi;
  if (data.ojol) document.getElementById("ojolText").innerText = data.ojol;
  if (data.alasan) document.getElementById("kenapaText").innerText = data.alasan;

  // Fakta list
  const faktaList = [];
  for (let i = 1; i <= 6; i++) {
    if (data["fakta" + i]) faktaList.push(data["fakta" + i]);
  }
  const ulFakta = document.getElementById("faktaList");
  if (ulFakta) {
    ulFakta.innerHTML = "";
    faktaList.forEach(f => {
      const li = document.createElement("li");
      li.innerText = f;
      ulFakta.appendChild(li);
    });
  }

  // Promo
  if (data.promo) {
    const promoEl = document.getElementById("promo");
    if (promoEl) promoEl.innerText = data.promo;
  }
  if (data.promoImageInput) {
    const promoImg = document.getElementById("promoImage");
    if (promoImg) promoImg.src = data.promoImageInput;
  }

  // Galeri
  if (data.galeriInput) {
    const galeriContainer = document.getElementById("galeriContainer");
    if (galeriContainer) {
      galeriContainer.innerHTML = "";
      data.galeriInput.split("|").forEach(url => {
        if (url.trim() !== "") {
          const div = document.createElement("div");
          div.className = "gallery-item";
          const img = document.createElement("img");
          img.src = url.trim();
          img.className = "responsive-img";
          div.appendChild(img);
          galeriContainer.appendChild(div);
        }
      });
    }
  }

  // Footer
  if (data.footer) {
    const footerEl = document.getElementById("footerText");
    if (footerEl) footerEl.innerText = data.footer;
  }
}

// ==========================================
// 🔹 Helper: Logout user
// ==========================================
export function logoutUser(redirectUrl = "login.html") {
  signOut(auth)
    .then(() => {
      window.location.href = redirectUrl;
    })
    .catch(err => {
      console.error("Logout error:", err);
      alert("Gagal logout, cek console");
    });
}
