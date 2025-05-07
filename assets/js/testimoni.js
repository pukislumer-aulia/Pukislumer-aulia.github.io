// Inisialisasi Firebase (pastikan konfigurasi sudah benar)
const firebaseConfig = {
  // Ganti dengan konfigurasi Firebase kamu
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener("DOMContentLoaded", () => {
  const testimonialList = document.getElementById("testimonialList");

  // Tampilkan testimoni dari localStorage (fake)
  const saved = JSON.parse(localStorage.getItem("testimoni")) || [];
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

  // Ambil testimoni dari Firebase
  const testiRef = database.ref("testimoni");
  testiRef.once("value", (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data.nama && data.pesan) {
        const teks = `"${data.pesan}" - ${data.nama}`;
        tambahKeHalaman(teks);
      }
    });
  });
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

// Kirim testimoni baru ke Firebase
document.getElementById("testimoniForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nama = document.getElementById("nama").value.trim();
  const pesan = document.getElementById("pesan").value.trim();

  if (!nama || !pesan) {
    alert("Lengkapi semua kolom testimoni.");
    return;
  }

  const testiRef = database.ref("testimoni").push();
  testiRef.set({
    nama,
    pesan,
    waktu: new Date().toISOString()
  });

  alert("Testimoni berhasil dikirim!");
  this.reset();
});
