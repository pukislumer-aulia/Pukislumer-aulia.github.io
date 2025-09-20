// firebase.js
// 🔹 Import Firebase SDK terbaru
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// 🔹 Konfigurasi Firebase (ganti sesuai project mu)
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// 🔹 Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

// 🔹 ===========================
// 🔹 Helper Firestore Functions
// 🔹 ===========================

// Ambil satu dokumen
async function getDocData(collectionName, docId) {
  try {
    const docRef = doc(firestore, collectionName, docId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Error getting doc:", err);
    return null;
  }
}

// Ambil semua dokumen dari collection
async function getCollectionData(collectionName) {
  try {
    const colRef = collection(firestore, collectionName);
    const snapshot = await getDocs(colRef);
    const data = [];
    snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    return data;
  } catch (err) {
    console.error("Error getting collection:", err);
    return [];
  }
}

// ===========================
// 🔹 Authentication Helper
// ===========================

// Cek login dan redirect jika belum login
function checkLoginRedirect(redirectIfNotLoggedIn = "login.html") {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, user => {
      if (!user) {
        window.location.href = redirectIfNotLoggedIn;
      } else {
        resolve(user);
      }
    });
  });
}

// Login email/password
async function loginEmailPassword(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    console.error("Login failed:", err);
    throw err;
  }
}

// Logout
function logout() {
  return signOut(auth);
}

// ===========================
// 🔹 Export semua service & helper
// ===========================
export {
  firestore,
  auth,
  getDocData,
  getCollectionData,
  checkLoginRedirect,
  loginEmailPassword,
  logout
};

// Load
document.getElementById("promoImageInput").value = about.promoImage || "";
document.getElementById("galeriInput").value = Array.isArray(about.galeri) ? about.galeri.join("|") : "";

// Simpan
data.promoImage = document.getElementById("promoImageInput").value;
data.galeri = document.getElementById("galeriInput").value.split("|").map(u => u.trim());
