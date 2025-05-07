// script.js

// Fungsi untuk memvalidasi form order
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

  const maxToppings = parseInt(boxSize); // Jumlah topping terbatas sesuai jumlah isi box
  const selectedToppings = document.querySelectorAll('.topping:checked').length;

  if (selectedToppings > maxToppings) {
    alert(`Jumlah topping maksimal untuk box ${boxSize} pcs adalah ${maxToppings} topping.`);
    return false;
  }

  return true;
}

// Fungsi untuk mendapatkan tipe topping yang dipilih
function handleTipeChange() {
  const tipe = document.getElementById("tipeTopping").value;
  const singleGroup = document.getElementById("singleToppingGroup");
  const doubleGroup = document.getElementById("doubleToppingGroup");

  if (tipe === "none") {
    singleGroup.style.display = "none";
    doubleGroup.style.display = "none";
  } else if (tipe === "single") {
    singleGroup.style.display = "block";
    doubleGroup.style.display = "none";
  } else if (tipe === "double") {
    singleGroup.style.display = "block";
    doubleGroup.style.display = "block";
  }
}

  return selectedToppingType;
}

// Fungsi untuk memvalidasi dan mengirimkan pesan via WhatsApp
function submitOrder() {
  if (!validateOrderForm()) {
    return;
  }

  const name = document.getElementById('name').value;
  const menu = document.getElementById('menu').value;
  const toppingType = getSelectedToppingType();
  const boxSize = document.getElementById('boxSize').value;
  const qty = document.getElementById('qty').value;
  const totalPrice = document.getElementById('totalDisplay').innerText;

  const toppingsSelected = Array.from(document.querySelectorAll('.topping:checked')).map(topping => topping.value).join(', ') || 'Tidak ada topping';

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
  const whatsappUrl = `https://wa.me/6281296668670?text=${encodedMessage}`; // Ganti dengan nomor WhatsApp Anda

  window.open(whatsappUrl, '_blank');
}

// Fungsi untuk meng-update total harga dan menampilkan topping
function updateTotalPrice() {
  const menu = document.getElementById('menu').value;
  const toppingType = getSelectedToppingType();
  const boxSize = document.getElementById('boxSize').value;
  const qty = document.getElementById('qty').value;

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

  const totalPrice = priceData[menu][toppingType][parseInt(boxSize)] * parseInt(qty);
  document.getElementById('totalDisplay').innerHTML = `<strong>Total Harga:</strong> Rp ${totalPrice.toLocaleString()}`;
}

// Fungsi untuk menampilkan topping sesuai tipe yang dipilih
function displayToppings(toppingType) {
  const toppingArea = document.getElementById('toppingArea');
  toppingArea.innerHTML = ''; // Bersihkan area topping sebelumnya

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

// Event listener untuk memilih topping
document.querySelectorAll('input[name="toppingType"]').forEach(radio => {
  radio.addEventListener('change', (event) => {
    displayToppings(event.target.value);
    updateTotalPrice();
  });
});

// Event listener untuk perubahan pada pilihan menu dan jumlah kotak
document.getElementById('menu').addEventListener('change', updateTotalPrice);
document.getElementById('boxSize').addEventListener('change', updateTotalPrice);
document.getElementById('qty').addEventListener('input', updateTotalPrice);

// Event listener untuk submit form
document.getElementById('orderForm').addEventListener('submit', (event) => {
  event.preventDefault();
  submitOrder();
});
<script>
  function toggleMenu() {
    document.querySelector('.floating-menu').classList.toggle('show');
  }
</script>


<script>
  document.getElementById("testimoniForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const nama = document.getElementById("nama").value;
    const pesan = document.getElementById("pesan").value;

    const li = document.createElement("li");
    li.innerHTML = `<strong>${nama}</strong><br>"${pesan}"`;

    document.getElementById("listTestimoni").appendChild(li);

    // Reset form
    document.getElementById("testimoniForm").reset();
  });
</script>

<script>
  function toggleMenu(btn) {
    const menu = document.getElementById("floatingMenu");
    menu.classList.toggle("show");

    // Ubah ikon tombol (+ / ×)
    btn.textContent = menu.classList.contains("show") ? "×" : "+";
  }
</script>
