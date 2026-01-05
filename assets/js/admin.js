/* ===============================
   ADMIN CONFIG
================================ */
const ADMIN_PIN = '030419';
const STORAGE_KEY = 'pukisOrders';

/* ===============================
   LOGIN
================================ */
function loginAdmin(){
  const pinInput = document.getElementById('pin');
  if (!pinInput) return;

  if (pinInput.value === ADMIN_PIN){
    document.getElementById('login').style.display = 'none';
    document.getElementById('admin').style.display = 'block';
    loadAdminTable();
  } else {
    alert('PIN salah');
    pinInput.value = '';
  }
}

/* ===============================
   LOAD & RENDER TABLE
================================ */
function loadAdminTable(){
  const orders = getOrders();
  const tbody = document.querySelector('#orderTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  orders.forEach((o, i) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${o.tgl || '-'}</td>
      <td>${o.invoice || '-'}</td>
      <td>${o.nama || '-'}</td>
      <td>Rp ${formatRpAdmin(o.total)}</td>
      <td>
        <select onchange="updateStatus(${i}, this.value)">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>pending</option>
          <option value="selesai" ${o.status === 'selesai' ? 'selected' : ''}>selesai</option>
          <option value="dibatalkan" ${o.status === 'dibatalkan' ? 'selected' : ''}>dibatalkan</option>
        </select>
      </td>
      <td>
        <button onclick="printPdf(${i})">PDF</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  renderStats(orders);
}

/* ===============================
   GET & SAVE ORDERS
================================ */
function getOrders(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e){
    return [];
  }
}

function saveOrders(orders){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

/* ===============================
   UPDATE STATUS
================================ */
function updateStatus(index, status){
  const orders = getOrders();
  if (!orders[index]) return;

  orders[index].status = status;
  saveOrders(orders);
  loadAdminTable();
}

/* ===============================
   PRINT PDF
================================ */
function printPdf(index){
  const orders = getOrders();
  const order = orders[index];
  if (!order || !order.pdfBase64){
    alert('PDF tidak tersedia.');
    return;
  }

  const win = window.open();
  win.document.write(`
    <iframe 
      src="${order.pdfBase64}" 
      style="width:100%;height:100%;border:none;">
    </iframe>
  `);
}

/* ===============================
   STATISTICS
================================ */
function renderStats(orders){
  const stats = calcStats(orders);
  const el = document.getElementById('stats');
  if (!el) return;

  el.innerHTML = `
    <strong>Order Hari Ini:</strong> ${stats.orderHarian}<br>
    <strong>Pendapatan Hari Ini:</strong> Rp ${formatRpAdmin(stats.pendapatanHarian)}<br>
    <strong>Order Bulan Ini:</strong> ${stats.orderBulanan}<br>
    <strong>Pendapatan Bulan Ini:</strong> Rp ${formatRpAdmin(stats.pendapatanBulanan)}
  `;
}

function calcStats(orders){
  const now = new Date();
  let orderHarian = 0;
  let orderBulanan = 0;
  let pendapatanHarian = 0;
  let pendapatanBulanan = 0;

  orders.forEach(o => {
    if (o.status !== 'selesai') return;
    if (!o.tgl) return;

    const d = new Date(o.tgl);

    if (d.toDateString() === now.toDateString()){
      orderHarian++;
      pendapatanHarian += Number(o.total || 0);
    }

    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()){
      orderBulanan++;
      pendapatanBulanan += Number(o.total || 0);
    }
  });

  return {
    orderHarian,
    pendapatanHarian,
    orderBulanan,
    pendapatanBulanan
  };
}

/* ===============================
   UTIL FORMAT RUPIAH (ADMIN)
================================ */
function formatRpAdmin(num){
  return (Number(num) || 0).toLocaleString('id-ID');
}

/* ===============================
   AUTO BIND LOGIN
================================ */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnLogin');
  if (btn){
    btn.addEventListener('click', loginAdmin);
  }
});
