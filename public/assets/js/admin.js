// Script untuk menambah menu
document.addEventListener("DOMContentLoaded", function () {
  const menuForm = document.getElementById("menuForm");

  if (menuForm) {
    menuForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const nama = document.getElementById("nama").value.trim();
      const harga = document.getElementById("harga").value.trim();
      const deskripsi = document.getElementById("deskripsi").value.trim();

      if (nama && harga && deskripsi) {
        const menu = JSON.parse(localStorage.getItem("menu")) || [];
        menu.push({ nama, harga, deskripsi });
        localStorage.setItem("menu", JSON.stringify(menu));
        alert("Menu berhasil ditambahkan!");
        menuForm.reset();
      } else {
        alert("Mohon lengkapi semua data.");
      }
    });
  }
});

// Script untuk mencatat pesanan ke tabel
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-form');
  const tableBody = document.getElementById('orders-table')?.getElementsByTagName('tbody')[0];

  if (form && tableBody) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.name.value.trim();
      const quantity = form.quantity.value.trim();
      const notes = form.notes.value.trim();

      if (!name || !quantity) {
        alert('Nama dan Jumlah wajib diisi.');
        return;
      }

      const newRow = tableBody.insertRow();
      const cellName = newRow.insertCell(0);
      const cellQuantity = newRow.insertCell(1);
      const cellNotes = newRow.insertCell(2);

      cellName.textContent = name;
      cellQuantity.textContent = quantity;
      cellNotes.textContent = notes;

      form.reset();
    });
  }
});
