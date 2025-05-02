// index.js

// Menangani logika pemesanan di halaman utama

// Mendapatkan elemen-elemen dari form
const orderForm = document.getElementById('orderForm');
const toppingArea = document.getElementById('toppingArea');
const totalDisplay = document.getElementById('totalDisplay');

// Daftar topping untuk Single dan Double Topping
const singleToppings = [
  'Coklat', 'Tiramisu', 'Matcha', 'Cappucino', 'Strawberry', 'Vanilla', 'Taro'
];
const doubleToppings = [
  'Meses', 'Keju', 'Kacang', 'Choco Chips', 'Oreo'
];

// Mengatur logika tampilan topping berdasarkan tipe topping yang dipilih
function handleToppingSelection() {
  const toppingType = document.querySelector('input[name="toppingType"]:checked').value;
  
  // Bersihkan area topping
  toppingArea.innerHTML = '';

  if (toppingType === 'none') {
    return;
  }

  const availableToppings = toppingType === 'single' ? singleToppings : singleToppings.concat(doubleToppings);
  
  availableToppings.forEach(topping => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = topping;
    checkbox.name = 'topping';
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(topping));
    toppingArea.appendChild(label);
  });
}

// Menghitung total harga berdasarkan pilihan menu, topping, dan ukuran box
function calculateTotal() {
  const menu = document.getElementById('menu').value;
  const toppingType = document.querySelector('input[name="toppingType"]:checked').value;
  const boxSize = document.getElementById('boxSize').value;
  const qty = document.getElementById('qty').value;

  let basePrice = 0;

  if (menu === 'original') {
    if (toppingType === 'none') {
      basePrice = boxSize === '5' ? 10000 : 18000;
    } else if (toppingType === 'single') {
      basePrice = boxSize === '5' ? 13000 : 25000;
    } else if (toppingType === 'double') {
      basePrice = boxSize === '5' ? 15000 : 28000;
    }
  } else if (menu === 'pandan') {
    if (toppingType === 'none') {
      basePrice = boxSize === '5' ? 12000 : 22000;
    } else if (toppingType === 'single') {
      basePrice = boxSize === '5' ? 15000 : 28000;
    } else if (toppingType === 'double') {
      basePrice = boxSize === '5' ? 18000 : 32000;
    }
  }

  // Menambahkan harga tambahan untuk topping yang dipilih
  const selectedToppings = Array.from(document.querySelectorAll('input[name="topping"]:checked')).map(input => input.value);
  const toppingPrice = selectedToppings.length * 2000; // Harga per topping

  const totalPrice = (basePrice + toppingPrice) * qty;
  totalDisplay.textContent = `Total Harga: Rp ${totalPrice}`;
}

// Fungsi untuk menangani pengiriman form
function submitOrderForm(event) {
  event.preventDefault(); // Mencegah reload halaman

  const name = document.getElementById('name').value;
  const menu = document.getElementById('menu').value;
  const toppingType = document.querySelector('input[name="toppingType"]:checked').value;
  const boxSize = document.getElementById('boxSize').value;
  const qty = document.getElementById('qty').value;
  
  // Menghitung total harga
  let basePrice = 0;
  let toppingPrice = 0;
  if (menu === 'original') {
    if (toppingType === 'none') {
      basePrice = boxSize === '5' ? 10000 : 18000;
    } else if (toppingType === 'single') {
      basePrice = boxSize === '5' ? 13000 : 25000;
    } else if (toppingType === 'double') {
      basePrice = boxSize === '5' ? 15000 : 28000;
    }
  } else if (menu === 'pandan') {
    if (toppingType === 'none') {
      basePrice = boxSize === '5' ? 12000 : 22000;
    } else if (toppingType === 'single') {
      basePrice = boxSize === '5' ? 15000 : 28000;
    } else if (toppingType === 'double') {
      basePrice = boxSize === '5' ? 18000 : 32000;
    }
  }

  const selectedToppings = Array.from(document.querySelectorAll('input[name="topping"]:checked')).map(input => input.value);
  toppingPrice = selectedToppings.length * 2000; // Harga per topping
  const totalPrice = (basePrice + toppingPrice) * qty;

  // Menampilkan konfirmasi pesanan dan informasi ke WhatsApp
  alert(`Pesanan berhasil dibuat!
    Nama: ${name}
    Menu: ${menu === 'original' ? 'Pukis Original' : 'Pukis Pandan'}
    Topping: ${selectedToppings.join(', ') || 'Tanpa topping'}
    Ukuran: ${boxSize === '5' ? 'Kecil (5 pcs)' : 'Besar (10 pcs)'}
    Jumlah: ${qty}
    Total Harga: Rp ${totalPrice}`);
  
  // Reset form setelah pengiriman
  orderForm.reset();
  toppingArea.innerHTML = '';
  totalDisplay.textContent = 'Total Harga: Rp 0';
}

// Menambahkan event listener untuk form pemesanan
orderForm.addEventListener('submit', submitOrderForm);

// Menambahkan event listener untuk perubahan tipe topping
const toppingRadios = document.querySelectorAll('input[name="toppingType"]');
toppingRadios.forEach(radio => {
  radio.addEventListener('change', handleToppingSelection);
});

// Inisialisasi tampilan topping saat pertama kali halaman dimuat
document.addEventListener('DOMContentLoaded', handleToppingSelection);
