// Validasi Form Order
function validateOrderForm() {
  const name = document.getElementById('name').value;
  const menu = document.getElementById('menu').value;
  const toppingType = getSelectedToppingType();
  const boxSize = document.getElementById('boxSize').value;
  const qty = document.getElementById('qty').value;

  if (!name || !menu || !toppingType || !boxSize || !qty) {
    alert('Semua kolom harus diisi dengan benar.');
    return false;
  }

  const maxToppings = parseInt(boxSize);
  const selectedToppings = document.querySelectorAll('.topping:checked').length;

  if (selectedToppings > maxToppings) {
    alert(`Jumlah topping maksimal untuk box ${boxSize} pcs adalah ${maxToppings} topping.`);
    return false;
  }

  return true;
}

// Ambil topping type yang dipilih
function getSelectedToppingType() {
  const radios = document.querySelectorAll('input[name="toppingType"]');
  for (const radio of radios) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return 'none';
}

// Kirim pesan order ke WhatsApp
function submitOrder() {
  if (!validateOrderForm()) return;

  const name = document.getElementById('name').value;
  const menu = document.getElementById('menu').value;
  const toppingType = getSelectedToppingType();
  const boxSize = document.getElementById('boxSize').value;
  const qty = document.getElementById('qty').value;
  const totalPrice = document.getElementById('totalDisplay').innerText;

  const toppingsSelected = Array.from(document.querySelectorAll('.topping:checked'))
    .map(topping => topping.value).join(', ') || 'Tidak ada topping';

  const orderMessage = `
    Halo, saya ingin pesan Pukis Lumer Aulia:
    - Nama: ${name}
    - Jenis Pukis: ${menu === 'original' ? 'Pukis Original' : 'Pukis Pandan'}
    - Topping: ${toppingType === 'none' ? 'Tanpa Topping' : toppingsSelected}
    - Ukuran Kotak: ${boxSize === '5' ? 'Kecil (5 pcs)' : 'Besar (10 pcs)'}
    - Jumlah Kotak: ${qty}
    - Total Harga: ${totalPrice}
  `;

  const encodedMessage = encodeURIComponent(orderMessage);
  const whatsappUrl = `https://wa.me/6281296668670?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}

// Update total harga
function updateTotalPrice() {
  const menu = document.getElementById('menu').value;
  const toppingType = getSelectedToppingType();
  const boxSize = document.getElementById('boxSize').value;
  const qty = parseInt(document.getElementById('qty').value) || 0;

  const priceData = {
    original: {
      none: { 5: 10000, 10: 18000 },
      single: { 5: 13000, 10: 25000 },
      double: { 5: 15000, 10: 28000 },
    },
    pandan: {
      none: { 5: 12000, 10: 22000 },
      single: { 5: 15000, 10: 28000 },
      double: { 5: 18000, 10: 32000 },
    }
  };

  const price = priceData[menu][toppingType][parseInt(boxSize)] || 0;
  const totalPrice = price * qty;
  document.getElementById('totalDisplay').innerHTML = `<strong>Total Harga:</strong> Rp ${totalPrice.toLocaleString()}`;
}

// Tampilkan topping berdasarkan tipe
function displayToppings(toppingType) {
  const toppingArea = document.getElementById('toppingArea');
  toppingArea.innerHTML = '';

  let availableToppings = [];
  if (toppingType === 'single') {
    availableToppings = ['Coklat', 'Tiramisu', 'Matcha', 'Cappucino', 'Strawberry', 'Vanilla', 'Taro'];
  } else if (toppingType === 'double') {
    availableToppings = ['Coklat', 'Tiramisu', 'Matcha', 'Cappucino', 'Strawberry', 'Vanilla', 'Taro', 'Meses', 'Keju', 'Kacang', 'Choco Chips', 'Oreo'];
  }

  availableToppings.forEach(topping => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" class="topping" value="${topping}"> ${topping}`;
    toppingArea.appendChild(label);
  });
}

// Ubah tampilan topping saat dicentang
function updateToppingStyles() {
  document.querySelectorAll('.singleTopping, .doubleTopping').forEach(cb => {
    const label = cb.parentElement;
    cb.checked
      ? label.classList.add('checked-topping')
      : label.classList.remove('checked-topping');
  });
}

// Testimoni form
document.getElementById("testimoniForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const nama = document.getElementById("nama").value;
  const pesan = document.getElementById("pesan").value;

  const li = document.createElement("li");
  li.innerHTML = `<strong>${nama}</strong><br>"${pesan}"`;
  document.getElementById("listTestimoni").appendChild(li);

  this.reset();
});

// Toggle menu button
function toggleMenu(btn) {
  const menu = document.querySelector(".floating-menu");
  menu.classList.toggle("show");
  if (btn) {
    btn.textContent = menu.classList.contains("show") ? "×" : "+";
  }
}

// Event bindings
window.addEventListener('DOMContentLoaded', () => {
  updateTotalPrice();
  updateToppingStyles();
});

document.querySelectorAll('input[name="toppingType"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    displayToppings(e.target.value);
    updateTotalPrice();
  });
});

document.getElementById('menu').addEventListener('change', updateTotalPrice);
document.getElementById('boxSize').addEventListener('change', updateTotalPrice);
document.getElementById('qty').addEventListener('input', updateTotalPrice);

document.getElementById('orderForm').addEventListener('submit', (e) => {
  e.preventDefault();
  submitOrder();
});
// Toggle tombol share mengambang
const toggleBtn = document.getElementById("toggleShareBtn");
const floatingIcons = document.getElementById("floatingIcons");

if (toggleBtn && floatingIcons) {
  toggleBtn.addEventListener("click", () => {
    floatingIcons.classList.toggle("show");
  });
}
