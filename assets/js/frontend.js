// FILE: assets/js/frontend.js
import { db } from './firebase.js'; // jika butuh
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// update realtime dari dokumen 'content/about' (jika dipakai)
const docRef = doc(db, "content", "about");
onSnapshot(docRef, (docSnap) => {
  if (!docSnap.exists()) return;
  const data = docSnap.data();
  const mapping = {
    judul: 'judulUtama', sapaan: 'sambutan1', doa: 'sambutan2',
    promoText: 'promoText', footer: null
  };
  Object.keys(mapping).forEach(k => {
    const elId = mapping[k];
    if (elId && data[k]) {
      const el = document.getElementById(elId);
      if (el) el.innerText = data[k];
    }
  });
});
