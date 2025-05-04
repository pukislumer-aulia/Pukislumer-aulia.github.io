document.addEventListener("DOMContentLoaded", () => {
  // === Seleksi elemen DOM ===
  const form         = document.getElementById("orderForm");
  const toppingArea  = document.getElementById("toppingArea");
  const toppingRadios= document.querySelectorAll('input[name="toppingType"]');
  const boxSize      = document.getElementById("boxSize");
  const menu         = document.getElementById("menu");
  const qty          = document.getElementById("qty");
  const totalDisplay = document.getElementById("totalDisplay");

  // === Data topping ===
  const singleToppings = ["Coklat", "Tiramisu", "Matcha", "Cappucino", "Stroberi", "Vanilla", "Taro"];
  const doubleToppings = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

  // === Build / Update checkbox topping ===
  function updateToppings() {
    const type = document.querySelector('input[name="toppingType"]:checked')?.value;
    toppingArea.innerHTML = ""; // kosongkan dulu
    if (type === "single") {
      createToppingGroup("Topping Single", singleToppings, "single");
    } else if (type === "double") {
      createToppingGroup("Topping Single", singleToppings, "single");
      createToppingGroup("Topping Double", doubleToppings, "double");
    }
  }

  function createToppingGroup(labelText, toppings, namePrefix) {
    // judul grup
    const lbl = document.createElement("p");
    lbl.textContent = labelText;
    lbl.style.fontWeight = "bold";
    toppingArea.appendChild(lbl);

    // masing-masing checkbox
    toppings.forEach(t => {
      const wrapper = document.createElement("label");
      const cb = document.createElement("input");
      cb.type  = "checkbox";
      cb.name  = `${namePrefix}Topping`;
      cb.value = t;
      cb.addEventListener("change", validateToppingLimit);
      wrapper.appendChild(cb);
      wrapper.append(" " + t);
      toppingArea.appendChild(wrapper);
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

  // === Hitung Harga Otomatis ===
  function calculatePrice() {
    const jenis = menu.value;
    const type  = document.querySelector('input[name="toppingType"]:checked')?.value || "none";
    const size  = parseInt(boxSize.value);
    const jumlah= parseInt(qty.value) || 0;

    const hargaTable = {
      original: {
        none:   {5:10000,10:18000},
        single: {5:13000,10:25000},
        double: {5:15000,10:28000}
      },
      pandan: {
        none:   {5:12000,10:22000},
        single: {5:15000,10:28000},
        double: {5:18000,10:32000}
      }
    };

    const unitPrice = hargaTable[jenis]?.[type]?.[size] || 0;
    const total = unitPrice * jumlah;
    totalDisplay.innerHTML = `<strong>Total Harga:</strong> Rp ${total.toLocaleString("id-ID")}`;
    return total;
  }

  // === Pasang Event Listeners ===
  toppingRadios.forEach(r => r.addEventListener("change", () => { updateToppings(); calculatePrice(); }));
  [menu, boxSize, qty].forEach(el => el.addEventListener("change", calculatePrice));
  toppingArea.addEventListener("change", calculatePrice);

  form.addEventListener("submit", e => {
    e.preventDefault();
    const nama     = document.getElementById("name").value.trim();
    const jenisVal = menu.value;
    const sizeVal  = parseInt(boxSize.value);
    const qtyVal   = parseInt(qty.value);
    const typeVal  = document.querySelector('input[name="toppingType"]:checked')?.value || "none";
    const toppings = Array.from(toppingArea.querySelectorAll("input:checked")).map(cb => cb.value);
    const total    = calculatePrice();

    if (toppings.length > sizeVal) {
      alert(`Jumlah topping melebihi isi box! Maksimal ${sizeVal}`);
      return;
    }

    const message = `
Halo! Saya ingin pesan Pukis:
Nama: ${nama}
Jenis: ${jenisVal}
Topping: ${typeVal.toUpperCase()}${toppings.length? " - " + toppings.join(", "): " (Tanpa Topping)"}
Ukuran Kotak: ${sizeVal} pcs
Jumlah Kotak: ${qtyVal}
Total: Rp ${total.toLocaleString("id-ID")}
    `.trim();

    window.open(`https://wa.me/6281296668670?text=${encodeURIComponent(message)}`, "_blank");
  });

  // === Inisialisasi Awal ===
  updateToppings();
  calculatePrice();
});
