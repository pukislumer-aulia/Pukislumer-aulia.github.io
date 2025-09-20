// firebase.js
// Import Firebase SDK terbaru
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// 🔹 Ganti dengan konfigurasi Firebase milik kamu
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PROJECT_ID.firebaseio.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// 🔹 Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Ekspor layanan Firebase
const db = getDatabase(app);       // Realtime Database
const firestore = getFirestore(app); // Firestore (untuk konten)
const auth = getAuth(app);         // Authentication

// 🔹 Fungsi cek login aman (opsional, bisa dipakai di index/admin)
function checkLoginRedirect(redirectIfNotLoggedIn = "login.html") {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(user => {
      if (!user) {
        window.location.href = redirectIfNotLoggedIn;
      } else {
        resolve(user);
      }
    });
  });
}

export { db, firestore, auth, checkLoginRedirect };
