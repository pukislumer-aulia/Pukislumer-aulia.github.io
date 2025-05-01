document.addEventListener("DOMContentLoaded", () => {
  const namaInput = document.getElementById("nama");
  const menuSelect = document.getElementById("menu");
  const toppingType = document.getElementById("topping-type");
  const toppingSection = document.getElementById("topping-section");
  const toppingOptions = document.getElementById("topping-options");
  const boxSize = document.getElementById("box-size");
  const quantity = document.getElementById("quantity");
  const totalPrice = document.getElementById("total-price");
  const form = document.getElementById("order-form");

  const toppingList = {
    single: ["Coklat", "Tiramisu", "Matcha", "Cappucino", "Stroberry", "Vanilla", "Taro"],
    double: ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"]
  };

  const harga = {
    "Pukis Original": {
      "Non Topping": { kecil: 10000, besar: 18000 },
      "Single Topping": { kecil: 13000, besar: 25000 },
      "Double Topping": { kecil: 15000, besar: 28000 }
    },
    "Pukis Pandan": {
      "Non Topping": { kecil: 12000, besar: 22000 },
      "Single Topping": { kecil: 15000, besar: 28000 },
      "Double Topping": { kecil: 18000, besar: 32000 }
    }
  };

  function renderToppingOptions(type) {
    toppingOptions.innerHTML = "";

    if (type === "Non Topping") {
      toppingSection.style.display = "none";
      return;
    }

    toppingSection.style.display = "block";
    let toppings = [...toppingList.single];
    if (type === "Double Topping") {
      toppings = toppings.concat(toppingList.double);
    }

    toppings.forEach(topping => {
      const id = topping.toLowerCase().replace(/\s/g, "-");
      const label = document.createElement("label");
      label.className = `topping-${id}`;
      label.style.display = "block";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "topping";
      checkbox.value = topping;

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" " + topping));
      toppingOptions.appendChild(label);
    });
  }

  function hitungTotal() {
    const menu = menuSelect.value;
    const topping = toppingType.value;
    const size = boxSize.value;
    const qty = parseInt(quantity.value) || 0;

    const hargaSatuan = harga[menu][topping][size];
    const total = hargaSatuan * qty;
    totalPrice.textContent = `Total: Rp${total.toLocaleString()}`;
    return total;
  }

  toppingType.addEventListener("change", () => {
    renderToppingOptions(toppingType.value);
    hitungTotal();
  });

  menuSelect.addEventListener("change", hitungTotal);
  boxSize.addEventListener("change", hitungTotal);
  quantity.addEventListener("input", hitungTotal);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = namaInput.value.trim();
    const menu = menuSelect.value;
    const topping = toppingType.value;
    const size = boxSize.value;
    const qty = quantity.value;
    const total = hitungTotal();

    const toppingChecked = [...document.querySelectorAll("input[name='topping']:checked")]
      .map(i => i.value).join(", ") || "Tanpa topping";

    const pesan = `Assalamu'alaikum, saya mau order:\n\nNama: ${nama}\nMenu: ${menu}\nTopping: ${topping} (${toppingChecked})\nUkuran: ${size}\nJumlah: ${qty}\nTotal Harga: Rp${total.toLocaleString()}`;

    const url = `https://wa.me/6281296668670?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  });

  // Inisialisasi awal
  renderToppingOptions(toppingType.value);
  hitungTotal();
});
