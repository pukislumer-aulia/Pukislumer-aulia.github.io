// Inisialisasi Firebase (pastikan ini di-load lebih dulu jika di file terpisah)
const firebaseConfig = {
  // Ganti dengan config Firebase kamu
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener("DOMContentLoaded", () => {
  const testimonialList = document.getElementById("testimonialList");

  // Cek apakah ada testimoni di localStorage
  const saved = JSON.parse(localStorage.getItem("testimoni")) || [];

  // Jika belum ada, tampilkan testimoni fake/default
  if (saved.length === 0) {
    const defaultTestimoni = [
      "Kuenya lembut banget dan lumer di mulut!",
      "Toppingnya banyak pilihan dan enak semua.",
      "Pelayanan cepat, kuenya masih hangat saat sampai.",
      "Pukis pandan favorit keluarga saya!",
      "Sudah order 3x, selalu puas!"
    ];
    defaultTestimoni.forEach((isi) => tambahKeHalaman(isi));
    localStorage.setItem("testimoni", JSON.stringify(defaultTestimoni));
  } else {
    saved.forEach((isi) => tambahKeHalaman(isi));
  }
});

function tambahTestimoni() {
  const input = document.getElementById("testimonialInput");
  const isi = input.value.trim();
  if (isi !== "") {
    tambahKeHalaman(isi);
    simpanKeLocalStorage(isi);
    input.value = "";
  }
}

function tambahKeHalaman(teks) {
  const testimonialList = document.getElementById("testimonialList");
  const div = document.createElement("div");
  div.classList.add("testimonial-item");
  div.textContent = teks;
  testimonialList.appendChild(div);
}

function simpanKeLocalStorage(teks) {
  const existing = JSON.parse(localStorage.getItem("testimoni")) || [];
  existing.push(teks);
  localStorage.setItem("testimoni", JSON.stringify(existing));
}

function hapusSemuaTestimoni() {
  if (confirm("Yakin ingin menghapus semua testimoni?")) {
    localStorage.removeItem("testimoni");
    document.getElementById("testimonialList").innerHTML = "";
  }
}

// Event listener untuk form testimoni ke Firebase
document.getElementById("testimoniForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nama = document.getElementById("nama").value.trim();
  const pesan = document.getElementById("pesan").value.trim();

  if (!nama || !pesan) {
    alert("Lengkapi semua kolom testimoni.");
    return;
  }

  // Simpan testimoni ke Firebase
  const testiRef = database.ref("testimoni").push();
  testiRef.set({
    nama,
    pesan,
    waktu: new Date().toISOString()
  });

  alert("Testimoni berhasil dikirim!");
  this.reset();
});
