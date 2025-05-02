// order.js

// Mendapatkan elemen form dan elemen-elemen input yang diperlukan
const orderForm = document.getElementById('orderForm');
const nameInput = document.getElementById('name');
const menuSelect = document.getElementById('menu');
const toppingRadioButtons = document.querySelectorAll('input[name="toppingType"]');
const toppingArea = document.getElementById('toppingArea');
const boxSizeSelect = document.getElementById('boxSize');
const qtyInput = document.getElementById('qty');
const totalDisplay = document.getElementById('totalDisplay');

// Daftar topping untuk single dan double topping
const singleToppings = ['Coklat', 'Tiramisu', 'Matcha', 'Cappucino', 'Strawberry', 'Vanilla', 'Taro'];
const doubleToppings = ['Meses', 'Keju', 'Kacang', 'Choco Chips', 'Oreo'];

// Harga berdasarkan jenis pukis dan topping
const prices = {
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

// Fungsi untuk menampilkan topping berdasarkan tipe topping
function showToppings(toppingType) {
  // Menghapus topping area sebelum menampilkan topping baru
  toppingArea.innerHTML = '';

  let toppingsToShow = [];

  // Menentukan topping yang akan ditampilkan berdasarkan tipe topping
  if (toppingType === 'none') {
    return; // Tidak ada topping
  } else if (toppingType === 'single') {
    toppingsToShow = singleToppings;
  } else if (toppingType === 'double') {
    toppingsToShow = singleToppings.concat(doubleToppings);
  }

  // Menampilkan topping sebagai checkbox
  toppingsToShow.forEach(topping => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" class="topping" value="${topping}"> ${topping}`;
    toppingArea.appendChild(label);
  });
}

// Fungsi untuk menghitung total harga berdasarkan pilihan
function calculateTotal() {
  const menuValue = menuSelect.value;
  const toppingType = getSelectedToppingType();
  const boxSizeValue = parseInt(boxSizeSelect.value);
  const qtyValue = parseInt(qtyInput.value);

  // Menentukan harga berdasarkan pilihan
  const pricePerBox = prices[menuValue][toppingType][boxSizeValue];
  const totalPrice = pricePerBox * qtyValue;

  // Menampilkan total harga di halaman
  totalDisplay.innerHTML = `<strong>Total Harga:</strong> Rp ${totalPrice.toLocaleString()}`;
}

// Fungsi untuk mendapatkan tipe topping yang dipilih
function getSelectedToppingType() {
  let selectedToppingType = 'none'; // Default: Non Topping

  toppingRadioButtons.forEach(button => {
    if (button.checked) {
      selectedToppingType = button.value;
    }
  });

  return selectedToppingType;
}

// Event listener untuk perubahan pilihan menu, tipe topping, ukuran kotak, dan jumlah kotak
menuSelect.addEventListener('change', () => {
  const toppingType = getSelectedToppingType();
  showToppings(toppingType);
  calculateTotal();
});

toppingRadioButtons.forEach(button => {
  button.addEventListener('change', () => {
    const toppingType = button.value;
    showToppings(toppingType);
    calculateTotal();
  });
});

boxSizeSelect.addEventListener('change', calculateTotal);
qtyInput.addEventListener('input', calculateTotal);

// Fungsi untuk menangani pengiriman form (simulasi pesan via WhatsApp)
orderForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = nameInput.value;
  const menu = menuSelect.value;
  const toppingType = getSelectedToppingType();
  const boxSize = boxSizeSelect.value;
  const qty = qtyInput.value;
  const total = totalDisplay.innerText;

  // Menyusun pesan untuk WhatsApp
  const message = `Halo, saya ingin pesan Pukis Lumer Aulia:
- Nama: ${name}
- Jenis Pukis: ${menu === 'original' ? 'Pukis Original' : 'Pukis Pandan'}
- Topping: ${toppingType === 'none' ? 'Tanpa Topping' : toppingType}
- Ukuran Kotak: ${boxSize === '5' ? 'Kecil (5 pcs)' : 'Besar (10 pcs)'}
- Jumlah Kotak: ${qty}
- Total Harga: ${total}`;

  // Mengarahkan ke WhatsApp dengan pesan otomatis
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/6281234567890?text=${encodedMessage}`; // Ganti nomor dengan nomor WhatsApp Anda
  window.open(whatsappUrl, '_blank');
});
