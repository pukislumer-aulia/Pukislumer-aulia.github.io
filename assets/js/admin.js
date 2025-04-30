 checkToppingVisibility();
});
// admin.js

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });
  }

  // Contoh fungsi admin: mengupdate status order
  const orderStatusBtns = document.querySelectorAll(".update-status-btn");

  orderStatusBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const orderId = this.dataset.id;
      alert("Status pesanan " + orderId + " diperbarui!");
      // Di real project, request AJAX dikirim ke backend di sini.
    });
  });
});
