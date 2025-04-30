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
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const nama = form.querySelector("#nama").value;
    const jumlah = form.querySelector("#jumlah").value;
    const topping = singleTopping.checked
      ? form.querySelector("#toppingSingle").value
      : form.querySelector("#toppingDouble1").value +
        " & " +
        form.querySelector("#toppingDouble2").value;

    const pesan = `Halo! Saya ingin pesan Pukis Lumer Aulia:
Nama: ${nama}
Jumlah: ${jumlah}
Topping: ${topping}`;

    const url = `https://wa.me/6281296668670?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  });
});
