// firebase.js
// 🔹 Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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

// 🔹 Inisialisasi
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

// ===========================
// 🔹 Firestore Helpers
// ===========================
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

// ===========================
// 🔹 Auth Helpers
// ===========================
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

// ===========================
// 🔹 Default Data
// ===========================
const defaultData = {
  judul: "Pukis Lumer Aulia",
  sapaan: "Selamat datang di Pukis Lumer Aulia!",
  doa: "Semoga berkah selalu.",
  lokasi: "Padang Panjang",
  ojol: "Tersedia di GoFood & GrabFood",
  alasan: "Rasa autentik dengan topping melimpah.",
  promoText: "Promo spesial minggu ini!",
  promoImage: "",
  footer: "© 2025 Pukis Lumer Aulia - Hak cipta dilindungi UU",
  testimoni: ["Enak banget!", "Lembut dan lumer di mulut!"],
  galeri: []
};

// ===========================
// 🔹 Export
// ===========================
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
