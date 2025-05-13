// Konfigurasi Firebase (isi sesuai dengan Firebase kamu)
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PROJECT_ID.firebaseio.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener("DOMContentLoaded", () => {
  const testimonialList = document.getElementById("listTestimoni");

  // Tampilkan testimoni fake dari localStorage jika belum ada
  const saved = JSON.parse(localStorage.getItem("testimoni")) || [];
  if (saved.length === 0) {
    const defaultTestimoni = [
      '"Kuenya lembut banget dan lumer di mulut!" - Rina',
      '"Toppingnya banyak pilihan dan enak semua." - Dodi',
      '"Pelayanan cepat, kuenya masih hangat saat sampai." - Siska',
      '"Pukis pandan favorit keluarga saya!" - Budi',
      '"Sudah order 3x, selalu puas!" - Ana'
    ];
    defaultTestimoni.forEach(teks => tambahKeHalaman(teks));
    localStorage.setItem("testimoni", JSON.stringify(defaultTestimoni));
  } else {
    saved.forEach(teks => tambahKeHalaman(teks));
  }

  // Ambil testimoni dari Firebase (opsional, tidak menimpa localStorage)
  const testiRef = database.ref("testimoni");
  testiRef.once("value", snapshot => {
    snapshot.forEach(childSnapshot => {
      const data = childSnapshot.val();
      if (data.nama && data.pesan) {
        const teks = `"${data.pesan}" - ${data.nama}`;
        if (!saved.includes(teks)) {
          tambahKeHalaman(teks);
        }
      }
    });
  });
});

// Tambahkan testimoni baru ke halaman dan localStorage
function tambahKeHalaman(teks) {
  const testimonialList = document.getElementById("listTestimoni");
  const li = document.createElement("li");
  li.classList.add("testimonial-item");
  li.textContent = teks;
  testimonialList.appendChild(li);
}

function simpanKeLocalStorage(teks) {
  const existing = JSON.parse(localStorage.getItem("testimoni")) || [];
  existing.push(teks);
  localStorage.setItem("testimoni", JSON.stringify(existing));
}

// Kirim testimoni ke Firebase dan simpan lokal
document.getElementById("testimoniForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nama = document.getElementById("nama").value.trim();
  const pesan = document.getElementById("pesan").value.trim();

  if (!nama || !pesan) {
    alert("Lengkapi semua kolom testimoni.");
    return;
  }

  const teks = `"${pesan}" - ${nama}`;
  tambahKeHalaman(teks);
  simpanKeLocalStorage(teks);

  // Simpan ke Firebase
  const testiRef = database.ref("testimoni").push();
  testiRef.set({
    nama,
    pesan,
    waktu: new Date().toISOString()
  });

  alert("Testimoni berhasil dikirim!");
  this.reset();
});

// Fungsi tambahan (jika ingin hapus semua)
function hapusSemuaTestimoni() {
  if (confirm("Yakin ingin menghapus semua testimoni lokal?")) {
    localStorage.removeItem("testimoni");
    document.getElementById("listTestimoni").innerHTML = "";
  }
}
