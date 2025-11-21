// FILE: assets/js/testimoni.js
const testimoniForm = document.getElementById("testimoniForm");
const listTestimoni = document.getElementById("listTestimoni");

function hapusSemuaTestimoni() {
  if (confirm("Apakah Anda yakin ingin menghapus semua testimoni?")) {
    listTestimoni.innerHTML = "";
  }
}
window.hapusSemuaTestimoni = hapusSemuaTestimoni;

testimoniForm?.addEventListener("submit", function (e) {
  e.preventDefault();
  const nama = document.getElementById("nama").value.trim();
  const pesan = document.getElementById("pesan").value.trim();
  if (!nama || !pesan) return;
  const li = document.createElement("li");
  li.innerHTML = `<strong>${nama}</strong><br>"${pesan}"`;
  listTestimoni.appendChild(li);
  testimoniForm.reset();
});
