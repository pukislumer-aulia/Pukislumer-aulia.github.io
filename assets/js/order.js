document.addEventListener("DOMContentLoaded", function () {
  const singleRadio = document.getElementById("singleRadio");
  const doubleRadio = document.getElementById("doubleRadio");
  const singleToppingDiv = document.getElementById("singleTopping");
  const doubleToppingDiv = document.getElementById("doubleTopping");
  const singleToppingSelect = document.getElementById("singleToppingSelect");
  const orderForm = document.getElementById("orderForm");

  // Tampilkan field topping sesuai pilihan
  singleRadio.addEventListener("change", function () {
    if (this.checked) {
      singleToppingDiv.style.display = "block";
      doubleToppingDiv.style.display = "none";
    }
  });

  doubleRadio.addEventListener("change", function () {
    if (this.checked) {
      singleToppingDiv.style.display = "none";
      doubleToppingDiv.style.display = "block";
    }
  });

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const menu = document.getElementById("menu").value;
    const boxSize = document.getElementById("boxSize").value;
    const qty = parseInt(document.getElementById("qty").value);
    let topping = "";
    let total = 0;

    if (singleRadio.checked) {
      topping = singleToppingSelect.value;
      total = (boxSize === "kecil" ? 10000 : 18000) * qty;
    } else if (doubleRadio.checked) {
      const checked = document.querySelectorAll('input[name="doubleTopping"]:checked');
      if (checked.length !== 2) {
        alert("Pilih tepat 2 topping untuk Double Topping");
        return;
      }
      topping = Array.from(checked).map(el => el.value).join(" + ");
      total = (boxSize === "kecil" ? 13000 : 22000) * qty;
    }

    document.getElementById("totalDisplay").innerHTML = `<strong>Total Harga:</strong> Rp ${total.toLocaleString()}`;

    const message = `Halo! Saya ingin pesan:\nNama: ${name}\nMenu: ${menu}\nTopping: ${topping}\nUkuran: ${boxSize}\nJumlah Kotak: ${qty}\nTotal: Rp ${total.toLocaleString()}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/6281296668670?text=${encodedMessage}`, "_blank");
  });
});
