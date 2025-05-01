document.addEventListener("DOMContentLoaded", function () {
  const nonRadio = document.getElementById("nonRadio");
  const singleRadio = document.getElementById("singleRadio");
  const doubleRadio = document.getElementById("doubleRadio");

  const singleToppingDiv = document.getElementById("singleTopping");
  const doubleToppingDiv = document.getElementById("doubleTopping");

  const orderForm = document.getElementById("orderForm");

  // Tampilkan atau sembunyikan field topping sesuai pilihan
  function updateToppingDisplay() {
    if (nonRadio.checked) {
      singleToppingDiv.style.display = "none";
      doubleToppingDiv.style.display = "none";
    } else if (singleRadio.checked) {
      singleToppingDiv.style.display = "block";
      doubleToppingDiv.style.display = "none";
    } else if (doubleRadio.checked) {
      singleToppingDiv.style.display = "block";
      doubleToppingDiv.style.display = "block";
    }
  }

  nonRadio.addEventListener("change", updateToppingDisplay);
  singleRadio.addEventListener("change", updateToppingDisplay);
  doubleRadio.addEventListener("change", updateToppingDisplay);

  updateToppingDisplay(); // Jalankan sekali saat awal

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const menu = document.getElementById("menu").value;
    const boxSize = document.getElementById("boxSize").value;
    const qty = parseInt(document.getElementById("qty").value);
    let topping = "Tanpa Topping";
    let total = 0;

    if (singleRadio.checked) {
      const selected = document.querySelectorAll('input[name="singleTopping"]:checked');
      if (selected.length === 0) {
        alert("Pilih setidaknya 1 topping untuk Single Topping");
        return;
      }
      topping = Array.from(selected).map(el => el.value).join(", ");
      total = (boxSize === "kecil" ? 10000 : 18000) * qty;
    } else if (doubleRadio.checked) {
      const selectedSingle = document.querySelectorAll('input[name="singleTopping"]:checked');
      const selectedDouble = document.querySelectorAll('input[name="doubleTopping"]:checked');
      const allToppings = [...selectedSingle, ...selectedDouble];
      if (allToppings.length === 0) {
        alert("Pilih setidaknya 1 topping untuk Double Topping");
        return;
      }
      topping = allToppings.map(el => el.value).join(", ");
      total = (boxSize === "kecil" ? 13000 : 22000) * qty;
    } else if (nonRadio.checked) {
      total = (boxSize === "kecil" ? 8000 : 15000) * qty;
    }

    document.getElementById("totalDisplay").innerHTML = `<strong>Total Harga:</strong> Rp ${total.toLocaleString()}`;

    const message = `Halo! Saya ingin pesan:\nNama: ${name}\nMenu: ${menu}\nTopping: ${topping}\nUkuran: ${boxSize}\nJumlah Kotak: ${qty}\nTotal: Rp ${total.toLocaleString()}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/6281296668670?text=${encodedMessage}`, "_blank");
  });
});
