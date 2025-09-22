// ==========================================
// 🔹 firebase.js
// Konfigurasi Firebase & helper untuk Admin / Frontend
// ==========================================

// 🔹 Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
  getFirestore, doc, getDoc, setDoc, collection, getDocs 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ==========================================
// 🔹 Konfigurasi Firebase
// Ganti isi firebaseConfig sesuai dengan konfigurasi project Firebase milikmu
// (bisa dilihat di Project Settings > General > SDK setup and configuration)
// ==========================================
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// ==========================================
// 🔹 Inisialisasi
// ==========================================
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

// ==========================================
// 🔹 Firestore Helpers
// ==========================================
async function getDocData(collectionName, docId) {
  const snap = await getDoc(doc(firestore, collectionName, docId));
  return snap.exists() ? snap.data() : null;
}

async function setDocData(collectionName, docId, data) {
  await setDoc(doc(firestore, collectionName, docId), data, { merge: true });
}

async function getCollectionData(collectionName) {
  const colRef = collection(firestore, collectionName);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ==========================================
// 🔹 Auth Helpers
// ==========================================
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

async function loginEmailPassword(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

function logout() {
  return signOut(auth);
}

// ==========================================
// 🔹 Default Data (Konten Utama)
// ==========================================
const defaultData = {
  judul: "PUKIS LUMER AULIA",
  sapaan: "Assalamu'alaikum warahmatullahi wabarakatuh",
  doa: "Dimanapun kamu, semoga selalu berkah dan rejeki berlimpah. Aamiin.",

  lokasi: "Padang Panjang Kota Kuliner. Kota Serambi Mekkah orang mengenalnya.",
  ajakan: "Kalau main ke Pasar Kuliner, wajib cobain ke PUKIS LUMER AULIA",
  jamOperasional: "16.00 – 23.59 WIB",
  bestSeller: "Double Topping Vanilla Oreo vs Cokelat Kacang",
  alamat: "Pasar Kuliner Padang Panjang (Cari Gerobak Pink)",
  ojol: "Tersedia di Maxim, Food, GrabFood, dan GoFood!",

  alasan: "Kenapa Pilih Pukis Lumer Aulia? Pukis kami dibuat dengan resep rahasia keluarga...",
  faktaUnik: [
    "Resep adonan spesial keluarga sejak 2023!",
    "Pionir Pukis Lumer kekinian di Padang Panjang.",
    "Tekstur lembut sempurna berkat teknik panggang tradisional.",
    "100% Tanpa Bahan Pengawet.",
    "Lebih dari 10 Varian Topping setiap hari.",
    "Jajanan No #1 di Padang Panjang.",
    "Jajan Bergizi Karena Dibuat Dari Bahan Premium."
  ],

  promoText: "Promo spesial minggu ini!",
  promoImage: "",

  footer: "© 2025 Pukis Lumer Aulia - Hak cipta dilindungi UU",
  testimoni: [
    "Enak banget!",
    "Lembut dan lumer di mulut!"
  ],
  galeri: []
};

// ==========================================
// 🔹 Export
// ==========================================
export {
  firestore,
  auth,
  getDocData,
  setDocData,
  getCollectionData,
  checkLoginRedirect,
  loginEmailPassword,
  logout,
  defaultData
};
