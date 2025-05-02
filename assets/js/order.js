document.addEventListener("DOMContentLoaded", function () {
  const singleRadio = document.getElementById("singleRadio");
  const doubleRadio = document.getElementById("doubleRadio");
  const singleToppingDiv = document.getElementById("singleTopping");
  const doubleToppingDiv = document.getElementById("doubleTopping");
  const menuSelect = document.getElementById("menu");
  const boxSize = document.getElementById("boxSize");
  const qtyInput = document.getElementById("qty");
  const totalDisplay = document.getElementById("totalDisplay");
  const orderForm = document.getElementById("orderForm");

  function updateToppingVisibility() {
    if (singleRadio.checked) {
      singleToppingDiv.style.display = "block";
      doubleToppingDiv.style.display = "none";
    } else if (doubleRadio.checked) {
      singleToppingDiv.style.display = "none";
      doubleToppingDiv.style.display = "block";
    } else {
      singleToppingDiv.style.display = "none";
      doubleToppingDiv.style.display = "none";
    }
  }

  singleRadio.addEventListener("change", updateToppingVisibility);
  doubleRadio.addEventListener("change", updateToppingVisibility);

  function getHarga(menu, topping, box, qty) {
    let harga = 0;
    const base = menu.includes("Pandan") ? "Pandan" : "Original";

    const hargaTable = {
      Original: {
        none: { kecil: 10000, besar: 18000 },
        single: { kecil: 13000, besar: 25000 },
        double: { kecil: 15000, besar: 28000 },
      },
      Pandan: {
        none: { kecil: 12000, besar: 22000 },
        single: { kecil: 15000, besar: 28000 },
        double: { kecil: 18000, besar: 32000 },
      },
    };

    const kategori = topping === "none" ? "none" : topping === "single" ? "single" : "double";
    harga = hargaTable[base][kategori][box] * qty;
    return harga;
  }

  function updateTotal() {
    const menu = menuSelect.value;
    const box = boxSize.value;
    const qty = parseInt(qtyInput.value) || 0;
    let toppingType = "none";

    if (singleRadio.checked) toppingType = "single";
    if (doubleRadio.checked) toppingType = "double";

    if (menu && box && qty > 0) {
      const harga = getHarga(menu, toppingType, box, qty);
      totalDisplay.innerHTML = `<strong>Total Harga:</strong> Rp ${harga.toLocaleString("id-ID")}`;
    } else {
      totalDisplay.innerHTML = `<strong>Total Harga:</strong> Rp 0`;
    }
  }

  [menuSelect, boxSize, qtyInput, singleRadio, doubleRadio].forEach(el => {
    el.addEventListener("change", updateTotal);
  });

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const menu = menuSelect.value;
    const box = boxSize.value;
    const qty = qtyInput.value;

    let toppingInfo = "";
    let toppingType = "Non Topping";

    if (singleRadio.checked) {
      toppingType = "Single Topping";
      toppingInfo = document.getElementById("singleToppingSelect").value;
    } else if (doubleRadio.checked) {
      toppingType = "Double Topping";
      const selected = [...document.querySelectorAll('input[name="doubleTopping"]:checked')].map(e => e.value);
      const boxCount = box === "kecil" ? 5 : 10;
      if (selected.length > boxCount) {
        alert(`Maksimal ${boxCount} topping untuk box ini`);
        return;
      }
      toppingInfo = selected.join(", ");
    }

    const message = `Halo, saya mau pesan PUKIS LUMER:\n\nNama: ${name}\nMenu: ${menu}\nTopping: ${toppingType} - ${toppingInfo}\nUkuran Box: ${box}\nJumlah Box: ${qty}\n\nTotal: ${totalDisplay.textContent.replace("Total Harga: ", "")}`;
    const waUrl = `https://wa.me/6281296668670?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  });

  updateToppingVisibility();
});
