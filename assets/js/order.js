const toppingData = {
  single: ["Coklat", "Tiramisu", "Matcha", "Cappucino", "Stroberry", "Vanilla", "Taro"],
  double: ["Coklat", "Tiramisu", "Matcha", "Cappucino", "Stroberry", "Vanilla", "Taro", "Meses", "Keju", "Kacang", "Choco Chips", "Oreo"]
};

const harga = {
  original: {
    non: { 5: 10000, 10: 18000 },
    single: { 5: 13000, 10: 25000 },
    double: { 5: 15000, 10: 28000 }
  },
  pandan: {
    non: { 5: 12000, 10: 22000 },
    single: { 5: 15000, 10: 28000 },
    double: { 5: 18000, 10: 32000 }
  }
};

const form = document.getElementById('orderForm');
const toppingContainer = document.getElementById('toppingContainer');
const toppingOptions = document.getElementById('toppingOptions');
const totalPrice = document.getElementById('totalPrice');

form.addEventListener('change', updateUI);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const variant = form.variant.value;
  const toppingType = form.toppingType.value;
  const boxSize = form.boxSize.value;
  const toppings = Array.from(document.querySelectorAll('input[name="topping"]:checked')).map(el => el.value);
  const hargaAkhir = harga[variant][toppingType][boxSize];

  if (toppings.length > parseInt(boxSize)) {
    alert("Jumlah topping melebihi isi box!");
    return;
  }

  const waMessage = `Halo! Saya ingin order:\n- Varian: ${variant}\n- Topping: ${toppingType}\n- Ukuran: ${boxSize} pcs\n- Pilihan Topping: ${toppings.join(', ') || 'Tidak ada'}\n- Total: Rp${hargaAkhir.toLocaleString()}`;
  window.open(`https://wa.me/6281296668670?text=${encodeURIComponent(waMessage)}`, '_blank');
});

function updateUI() {
  const variant = form.variant.value;
  const toppingType = form.toppingType.value;
  const boxSize = form.boxSize.value;

  // Update topping
  toppingOptions.innerHTML = "";
  if (toppingType === "non" || !variant || !boxSize) {
    toppingContainer.style.display = "none";
  } else {
    toppingContainer.style.display = "block";
    const allowed = toppingData[toppingType];
    allowed.forEach(t => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = "checkbox";
      input.name = "topping";
      input.value = t;
      label.appendChild(input);
      label.append(" " + t);
      toppingOptions.appendChild(label);
    });
  }

  // Update harga
  if (variant && toppingType && boxSize && harga[variant] && harga[variant][toppingType]) {
    const total = harga[variant][toppingType][boxSize];
    totalPrice.textContent = `Rp${total.toLocaleString()}`;
  } else {
    totalPrice.textContent = "Rp0";
  }
}
