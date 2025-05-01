// admin.js

document.addEventListener("DOMContentLoaded", function () {
  // Toggle Sidebar (jika elemen tersedia)
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });
  }

  // Tombol update status (contoh)
  const orderStatusBtns = document.querySelectorAll(".update-status-btn");
  orderStatusBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const orderId = this.dataset.id;
      alert("Status pesanan " + orderId + " diperbarui!");
    });
  });

  // Menampilkan data pesanan dari localStorage
  function tampilkanDataPesanan() {
    const tbody = document.getElementById("order-table-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    const data = JSON.parse(localStorage.getItem("dataPesanan")) || [];

    data.forEach((pesanan, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${pesanan.nama}</td>
        <td>${pesanan.topping}</td>
        <td>${pesanan.jumlah}</td>
        <td>Sedang Diproses</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Panggil fungsi saat halaman dimuat
  tampilkanDataPesanan();
});
