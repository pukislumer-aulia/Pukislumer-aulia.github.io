// order.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("#order-form");

  const singleTopping = document.querySelector("#singleTopping");
  const doubleTopping = document.querySelector("#doubleTopping");

  const toppingSingleGroup = document.querySelector("#toppingSingleGroup");
  const toppingDoubleGroup = document.querySelector("#toppingDoubleGroup");

  // Toggle antara single dan double topping
  singleTopping.addEventListener("change", function () {
    if (this.checked) {
      toppingSingleGroup.style.display = "block";
      toppingDoubleGroup.style.display = "none";
      doubleTopping.checked = false;
    }
  });

  doubleTopping.addEventListener("change", function () {
    if (this.checked) {
      toppingDoubleGroup.style.display = "block";
      toppingSingleGroup.style.display = "none";
      singleTopping.checked = false;
    }
  });

  // Form submit
  document.getElementById("orderForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nama = this.nama.value;
  const menu = this.menu.value;
  const jumlah = this.jumlah.value;
  const catatan = this.catatan.value;
  
  const pesan = `Halo! Saya ingin pesan:\nNama: ${nama}\nMenu: ${menu}\nJumlah: ${jumlah}\nCatatan: ${catatan}`;
  const url = `https://wa.me/6281296668670?text=${encodeURIComponent(pesan)}`;
  window.open(url, "_blank");
});
});
