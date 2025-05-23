document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("orderForm");
  const toppingArea = document.getElementById("toppingArea");
  const toppingRadios = document.querySelectorAll('input[name="toppingType"]');
  const boxSize = document.getElementById("boxSize");
  const menu = document.getElementById("menu");
  const qty = document.getElementById("qty");
  const totalDisplay = document.getElementById("totalDisplay");

  const singleToppings = ["Coklat", "Tiramisu", "Matcha", "Cappucino", "Stroberi", "Vanilla", "Taro"];
  const doubleToppings = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

  function updateToppings() {
    const type = document.querySelector('input[name="toppingType"]:checked')?.value;
    toppingArea.innerHTML = "";

    if (type === "single") {
      createToppingGroup("Topping Single", singleToppings, "single");
    } else if (type === "double") {
      createToppingGroup("Topping Single", singleToppings, "single");
      createToppingGroup("Topping Double", doubleToppings, "double");
    }
  }

  function createToppingGroup(labelText, toppings, namePrefix) {
    const groupLabel = document.createElement("p");
    groupLabel.textContent = labelText;
    groupLabel.style.fontWeight = "bold";
    toppingArea.appendChild(groupLabel);

    toppings.forEach((topping) => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = `${namePrefix}Topping`;
      checkbox.value = topping;
      checkbox.addEventListener("change", validateToppingLimit);
      label.appendChild(checkbox);
      label.append(" " + topping);
      toppingArea.appendChild(label);
    });
  }

  function validateToppingLimit() {
    const max = parseInt(boxSize.value);
    const selected = toppingArea.querySelectorAll("input[type='checkbox']:checked");
    if (selected.length > max) {
      alert(`Maksimal ${max} topping sesuai isi box.`);
      this.checked = false;
    }
  }

  function calculatePrice() {
    const jenis = menu.value;
    const type = document.querySelector('input[name="toppingType"]:checked')?.value || "none";
    const size = parseInt(boxSize.value);
    const jumlah = parseInt(qty.value) || 0;

    const hargaTable = {
      original: {
        none:   {5: 10000, 10: 18000},
        single: {5: 13000, 10: 25000},
        double: {5: 15000, 10: 28000}
      },
      pandan: {
        none:   {5: 12000, 10: 22000},
        single: {5: 15000, 10: 28000},
        double: {5: 18000, 10: 32000}
      }
    };

    const unitPrice = hargaTable[jenis]?.[type]?.[size] || 0;
    const total = unitPrice * jumlah;

    totalDisplay.innerHTML = `<strong>Total Harga:</strong> Rp ${total.toLocaleString("id-ID")}`;
    return total;
  }

  // Pasang event listener
  toppingRadios.forEach(r => r.addEventListener("change", () => { updateToppings(); calculatePrice(); }));
  [menu, boxSize, qty].forEach(el => el.addEventListener("change", calculatePrice));
  toppingArea.addEventListener("change", calculatePrice);

  // Submit handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("name").value.trim();
    const jenis = menu.value;
    const size = parseInt(boxSize.value);
    const jumlah = parseInt(qty.value);
    const type = document.querySelector('input[name="toppingType"]:checked')?.value || "none";
    const toppings = Array.from(toppingArea.querySelectorAll("input[type='checkbox']:checked"))
                          .map(cb => cb.value);
    const total = calculatePrice();

    if (toppings.length > size) {
      alert(`Jumlah topping melebihi isi box! Maksimal ${size}`);
      return;
    }

    const message = `
Halo! Saya ingin pesan Pukis:
Nama: ${nama}
Jenis: ${jenis}
Topping: ${type.toUpperCase()}${toppings.length? " - " + toppings.join(", "): " (Tanpa Topping)"}
Ukuran Kotak: ${size} pcs
Jumlah Kotak: ${jumlah}
Total: Rp ${total.toLocaleString("id-ID")}
    `.trim();

    window.open(`https://wa.me/6281296668670?text=${encodeURIComponent(message)}`, "_blank");
  });

  // Inisialisasi pertama kali
  updateToppings();
  calculatePrice();
});
