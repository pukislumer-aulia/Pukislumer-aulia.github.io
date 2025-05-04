document.addEventListener("DOMContentLoaded", () => {
  const testimonialList = document.getElementById("testimonialList");

  // Cek apakah ada testimoni di localStorage
  const saved = JSON.parse(localStorage.getItem("testimoni")) || [];

  // Jika belum ada, tampilkan default testimoni
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
