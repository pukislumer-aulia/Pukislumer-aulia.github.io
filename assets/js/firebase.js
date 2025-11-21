// FILE: assets/js/firebase.js
// Minimal Firebase helpers (sesuaikan config mu)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  // <-- masukkan konfigurasi firebase kamu di sini
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function getDocData(path, id) {
  const d = await getDoc(doc(db, path, id));
  return d.exists() ? d.data() : null;
}
async function setDocData(path, id, data) {
  return await setDoc(doc(db, path, id), data, { merge: true });
}
async function getCollectionData(path) {
  const snap = await getDocs(collection(db, path));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loginEmailPassword(email, password) {
  const u = await signInWithEmailAndPassword(auth, email, password);
  return u.user;
}
function logout() { return signOut(auth); }

export { app, auth, db, getDocData, setDocData, getCollectionData, loginEmailPassword, logout };
