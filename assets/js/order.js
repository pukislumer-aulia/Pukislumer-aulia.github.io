document.addEventListener("DOMContentLoaded", function () {
  const singleRadio = document.getElementById("singleRadio");
  const doubleRadio = document.getElementById("doubleRadio");
  const singleDiv = document.getElementById("singleTopping");
  const doubleDiv = document.getElementById("doubleTopping");
  const qtyInput = document.getElementById("qty");
  const boxSize = document.getElementById("boxSize");
  const totalDisplay = document.getElementById("totalDisplay");
  const orderForm = document.getElementById("orderForm");

  function updateToppingDisplay() {
    singleDiv.style.display = singleRadio.checked ? "block" : "none";
    doubleDiv.style.display = doubleRadio.checked ? "block" : "none";
    calculateTotal();
  }

  singleRadio.addEventListener("change", updateToppingDisplay);
  doubleRadio.addEventListener("change", updateToppingDisplay);

  [qtyInput, boxSize, singleRadio, doubleRadio].forEach((el) => {
    el.addEventListener("change", calculateTotal);
  });

  function calculateTotal() {
    const qty = parseInt(qtyInput.value) || 0;
    const size = boxSize.value;
    let pricePerBox = 0;

    if (size === "kecil") {
      pricePerBox = singleRadio.checked ? 12000 : doubleRadio.checked ? 14000 : 0;
    } else if (size === "besar") {
      pricePerBox = singleRadio.checked ? 24000 : doubleRadio.checked ? 27000 : 0;
    }

    const total = qty * pricePerBox;
    totalDisplay.innerHTML = `<strong>Total Harga:</strong> Rp ${total.toLocaleString("id-ID")}`;
    return total;
  }

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const menu = document.getElementById("menu").value;
    const size = boxSize.value;
    const qty = qtyInput.value;
    const total = calculateTotal();
    let topping = "";

    if (singleRadio.checked) {
      topping = document.getElementById("singleToppingSelect").value;
    } else if (doubleRadio.checked) {
      const checked = Array.from(document.querySelectorAll('input[name="doubleTopping"]:checked')).map(cb => cb.value);
      topping = checked.join(" + ");
    }

    const message = `Halo, saya mau pesan:\nNama: ${name}\nMenu: ${menu}\nTopping: ${topping}\nUkuran: ${size}\nJumlah: ${qty}\nTotal Harga: Rp ${total.toLocaleString("id-ID")}`;
    window.open(`https://wa.me/6281296668670?text=${encodeURIComponent(message)}`);
  });
});
