// Ambil data dari form order
function getOrderFormData() {
  return {
    name: document.getElementById('name').value,
    menu: document.getElementById('menu').value,
    toppingType: getSelectedToppingType(),
    boxSize: document.getElementById('boxSize').value,
    qty: document.getElementById('qty').value,
    totalPrice: document.getElementById('totalDisplay').innerText
  };
}

// Ambil topping type yang dipilih
function getSelectedToppingType() {
  const radios = document.querySelectorAll('input[name="toppingType"]');
  for (const radio of radios) {
    if (radio.checked) return radio.value;
  }
  return 'none';
}

// Validasi form order
function validateOrderForm() {
  const { name, menu, toppingType, boxSize, qty } = getOrderFormData();

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

// Kirim pesan ke WhatsApp
function submitOrder() {
  if (!validateOrderForm()) return;

  const { name, menu, toppingType, boxSize, qty, totalPrice } = getOrderFormData();

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

// Hitung total harga
function updateTotalPrice() {
  const { menu, toppingType, boxSize, qty } = getOrderFormData();

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

  const price = priceData[menu]?.[toppingType]?.[parseInt(boxSize)] || 0;
  const total = price * (parseInt(qty) || 0);

  document.getElementById('totalDisplay').innerHTML = `<strong>Total Harga:</strong> Rp ${total.toLocaleString()}`;
}

// Tampilkan pilihan topping berdasarkan tipe
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

// Tambahkan testimoni
document.getElementById("testimoniForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const nama = document.getElementById("nama").value;
  const pesan = document.getElementById("pesan").value;

  const li = document.createElement("li");
  li.innerHTML = `<strong>${nama}</strong><br>"${pesan}"`;
  document.getElementById("listTestimoni").appendChild(li);

  this.reset();
});

// Toggle menu navigasi mengambang
function toggleMenu(btn) {
  const menu = document.querySelector(".floating-menu");
  menu.classList.toggle("show");
  if (btn) {
    btn.textContent = menu.classList.contains("show") ? "×" : "+";
  }
}

// Toggle ikon media sosial dengan aksesibilitas
const toggleBtn = document.getElementById("toggleShareBtn");
const floatingIcons = document.getElementById("floatingIcons");

if (toggleBtn && floatingIcons) {
  toggleBtn.addEventListener("click", () => {
    floatingIcons.classList.toggle("show");
    const isShown = floatingIcons.classList.contains("show");
    floatingIcons.setAttribute("aria-hidden", !isShown);
  });
}

// Event bindings saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
  updateTotalPrice();
  updateToppingStyles();
});

// Event listeners untuk perubahan input
document.querySelectorAll('input[name="toppingType"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    displayToppings(e.target.value);
    updateTotalPrice();
  });
});

document.getElementById('menu').addEventListener('change', updateTotalPrice);
document.getElementById('boxSize').addEventListener('change', updateTotalPrice);
document.getElementById('qty').addEventListener('input', updateTotalPrice);

// Submit order ke WhatsApp
document.getElementById('orderForm').addEventListener('submit', (e) => {
  e.preventDefault();
  submitOrder();
});
