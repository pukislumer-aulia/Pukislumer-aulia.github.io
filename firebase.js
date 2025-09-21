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
// 🔹 Helper: Ambil dokumen dari Firestore
// ==========================================
export async function getDocData(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Error getDocData:", err);
    return null;
  }
}

// ==========================================
// 🔹 Helper: Update dokumen 'about' di Firestore
// ==========================================
export async function updateAboutData(data) {
  try {
    await setDoc(doc(db, "content", "about"), data);
  } catch (err) {
    console.error("Error updateAboutData:", err);
    throw err;
  }
}

// 🔹 Helper: Ambil dokumen konten generik
export async function getContent(docId) {
  try {
    const docRef = doc(db, "content", docId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : {};
  } catch (err) {
    console.error("Error getContent:", err);
    return {};
  }
}

// 🔹 Helper: Update dokumen konten generik
export async function updateContent(docId, data) {
  try {
    await setDoc(doc(db, "content", docId), data);
  } catch (err) {
    console.error("Error updateContent:", err);
    throw err;
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
