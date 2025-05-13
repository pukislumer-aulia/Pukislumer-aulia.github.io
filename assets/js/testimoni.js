// Konfigurasi Firebase (isi sesuai dengan Firebase kamu) const firebaseConfig = { apiKey: "API_KEY_KAMU", authDomain: "PROJECT_ID.firebaseapp.com", databaseURL: "https://PROJECT_ID.firebaseio.com", projectId: "PROJECT_ID", storageBucket: "PROJECT_ID.appspot.com", messagingSenderId: "SENDER_ID", appId: "APP_ID" };

firebase.initializeApp(firebaseConfig); const database = firebase.database();

document.addEventListener("DOMContentLoaded", () => { const testimonialList = document.getElementById("listTestimoni");

// Tampilkan testimoni palsu dari localStorage jika belum ada const saved = JSON.parse(localStorage.getItem("testimoni")) || []; if (saved.length === 0) { const defaultTestimoni = [ { nama: "Rina", pesan: "Kuenya lembut banget dan lumer di mulut!" }, { nama: "Dodi", pesan: "Toppingnya banyak pilihan dan enak semua." }, { nama: "Siska", pesan: "Pelayanan cepat, kuenya masih hangat saat sampai." }, { nama: "Budi", pesan: "Pukis pandan favorit keluarga saya!" }, { nama: "Ana", pesan: "Sudah order 3x, selalu puas!" } ];

defaultTestimoni.forEach(({ nama, pesan }) => {
  const teks = `"${pesan}" - ${nama}`;
  tambahKeHalaman(teks);
  saved.push(teks);
});

localStorage.setItem("testimoni", JSON.stringify(saved));

} else { saved.forEach(teks => tambahKeHalaman(teks)); }

// Ambil testimoni dari Firebase (tidak menimpa yang lokal) const testiRef = database.ref("testimoni"); testiRef.once("value", snapshot => { snapshot.forEach(childSnapshot => { const data = childSnapshot.val(); if (data.nama && data.pesan) { const teks = "${data.pesan}" - ${data.nama}; if (!saved.includes(teks)) { tambahKeHalaman(teks); } } }); }); });

function tambahKeHalaman(teks) { const testimonialList = document.getElementById("listTestimoni"); const li = document.createElement("li"); li.classList.add("testimonial-item"); li.textContent = teks; testimonialList.appendChild(li); }

function simpanKeLocalStorage(teks) { const existing = JSON.parse(localStorage.getItem("testimoni")) || []; existing.push(teks); localStorage.setItem("testimoni", JSON.stringify(existing)); }

document.getElementById("testimoniForm").addEventListener("submit", function (e) { e.preventDefault();

const nama = document.getElementById("nama").value.trim(); const pesan = document.getElementById("pesan").value.trim();

if (!nama || !pesan) { alert("Lengkapi semua kolom testimoni."); return; }

const teks = "${pesan}" - ${nama}; tambahKeHalaman(teks); simpanKeLocalStorage(teks);

// Simpan ke Firebase const testiRef = database.ref("testimoni").push(); testiRef.set({ nama, pesan, waktu: new Date().toISOString() });

alert("Testimoni berhasil dikirim!"); this.reset(); });

function hapusSemuaTestimoni() { if (confirm("Yakin ingin menghapus semua testimoni lokal?")) { localStorage.removeItem("testimoni"); document.getElementById("listTestimoni").innerHTML = ""; } }

