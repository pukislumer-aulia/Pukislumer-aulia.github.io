document.getElementById("orderForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const nama = document.getElementById("name").value;
  const menu = document.getElementById("menu").value;
  const qty = document.getElementById("qty").value;

  const pesan = `Halo! Saya ingin memesan:\n\nNama: ${nama}\nMenu: ${menu}\nJumlah: ${qty}`;
  const nomorWa = "6281296668670"; // Ganti dengan nomor WA kamu

  const url = `https://wa.me/${nomorWa}?text=${encodeURIComponent(pesan)}`;
  window.open(url, "_blank");
});
