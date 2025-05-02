// admin.js

// Menangani data dan aksi admin di halaman admin

// Fungsi untuk mengambil data pesanan dan menampilkan ke tabel
function displayOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderTable = document.getElementById('orderTable');
    orderTable.innerHTML = ''; // Clear tabel sebelumnya

    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = order.name;
        row.appendChild(nameCell);

        const menuCell = document.createElement('td');
        menuCell.textContent = order.menu;
        row.appendChild(menuCell);

        const toppingCell = document.createElement('td');
        toppingCell.textContent = order.toppingType;
        row.appendChild(toppingCell);

        const sizeCell = document.createElement('td');
        sizeCell.textContent = order.boxSize === '5' ? 'Kecil (5 pcs)' : 'Besar (10 pcs)';
        row.appendChild(sizeCell);

        const qtyCell = document.createElement('td');
        qtyCell.textContent = order.qty;
        row.appendChild(qtyCell);

        const totalCell = document.createElement('td');
        totalCell.textContent = `Rp ${order.total}`;
        row.appendChild(totalCell);

        // Tombol untuk menghapus pesanan
        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Hapus';
        deleteButton.onclick = function () {
            deleteOrder(index);
        };
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        orderTable.appendChild(row);
    });
}

// Fungsi untuk menghapus pesanan
function deleteOrder(index) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.splice(index, 1); // Hapus pesanan berdasarkan index
    localStorage.setItem('orders', JSON.stringify(orders));
    displayOrders(); // Perbarui tampilan setelah penghapusan
}

// Fungsi untuk menangani pengiriman form pesanan baru
function submitOrderForm(event) {
    event.preventDefault(); // Mencegah reload halaman

    const name = document.getElementById('name').value;
    const menu = document.getElementById('menu').value;
    const toppingType = document.querySelector('input[name="toppingType"]:checked').value;
    const boxSize = document.getElementById('boxSize').value;
    const qty = document.getElementById('qty').value;

    // Kalkulasi harga total berdasarkan pilihan
    let total = 0;

    if (menu === 'original') {
        if (toppingType === 'none') {
            total = boxSize === '5' ? 10000 : 18000;
        } else if (toppingType === 'single') {
            total = boxSize === '5' ? 13000 : 25000;
        } else if (toppingType === 'double') {
            total = boxSize === '5' ? 15000 : 28000;
        }
    } else if (menu === 'pandan') {
        if (toppingType === 'none') {
            total = boxSize === '5' ? 12000 : 22000;
        } else if (toppingType === 'single') {
            total = boxSize === '5' ? 15000 : 28000;
        } else if (toppingType === 'double') {
            total = boxSize === '5' ? 18000 : 32000;
        }
    }

    total *= qty; // Kalikan total dengan jumlah kotak yang dipesan

    // Simpan data pesanan ke Local Storage
    const order = {
        name,
        menu,
        toppingType,
        boxSize,
        qty,
        total
    };

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Tampilkan pesanan yang sudah masuk
    displayOrders();

    // Reset form
    document.getElementById('orderForm').reset();
}

// Menambahkan event listener untuk form pemesanan
document.getElementById('orderForm').addEventListener('submit', submitOrderForm);

// Tampilkan pesanan yang sudah ada ketika halaman dimuat
document.addEventListener('DOMContentLoaded', displayOrders);
