// assets/js/firebase.js
// Firebase v10+ (ES Module) — FINAL & SIAP PAKAI

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ================================
   KONFIGURASI FIREBASE
   GANTI SESUAI PROJECT KAMU
================================ */

const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

/* ================================
   INIT FIREBASE
================================ */

const app = initializeApp(firebaseConfig);

/* ================================
   FIRESTORE
================================ */

const db = getFirestore(app);

/* ================================
   EXPORT
================================ */

export { db };
