/*
  assets/js/admin.js — FINAL PRODUCTION (LOCKED)
  ADMIN PANEL — PUKIS LUMER AULIA
  ✔ Login PIN
  ✔ Statistik Harian & Bulanan
  ✔ Cetak PDF (ADMIN ONLY)
  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(function () {
  'use strict';

  /* ===============================
     ADMIN CONFIG
  =============================== */
  const ADMIN_PIN = '030419';
  const STORAGE_KEY = 'pukisOrders';

  /* ===============================
     LOGIN
  =============================== */
  function loginAdmin() {
    const pinInput = document.getElementById('pin');
    const loginBox = document.getElementById('login');
    const adminBox = document.getElementById('admin');

    if (!pinInput || !loginBox || !adminBox) return;

    if (pinInput.value === ADMIN_PIN) {
      loginBox.style.display = 'none';
      adminBox.style.display = 'block';
      loadAdminTable();
    } else {
      alert('PIN salah');
      pinInput.value = '';
      pinInput.focus();
    }
  }

  /* ===============================
     LOAD & RENDER TABLE
  =============================== */
  function loadAdminTable() {
    const orders = getOrders();
    const tbody = document.querySelector('#orderTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    orders.forEach((o, i) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${formatDate(o.tgl)}</td>
        <td>${o.invoice || '-'}</td>
        <td>${o.nama || '-'}</td>
        <td>Rp ${formatRp(o.total)}</td>
        <td>
          <select data-index="${i}">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>pending</option>
            <option value="selesai" ${o.status === 'selesai' ? 'selected' : ''}>selesai</option>
            <option value="dibatalkan" ${o.status === 'dibatalkan' ? 'selected' : ''}>dibatalkan</option>
          </select>
        </td>
        <td>
          <button data-pdf="${i}">PDF</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    bindTableEvents();
    renderStats(orders);
  }

  /* ===============================
     TABLE EVENTS (SAFE BIND)
  =============================== */
  function bindTableEvents() {
    document.querySelectorAll('#orderTable select').forEach(sel => {
      sel.onchange = () => updateStatus(sel.dataset.index, sel.value);
    });

    document.querySelectorAll('#orderTable button[data-pdf]').forEach(btn => {
      btn.onclick = () => printPdf(btn.dataset.pdf);
    });
  }

  /* ===============================
     STORAGE
  =============================== */
  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }

  /* ===============================
     UPDATE STATUS
  =============================== */
  function updateStatus(index, status) {
    const orders = getOrders();
    if (!orders[index]) return;

    orders[index].status = status;
    saveOrders(orders);
    loadAdminTable();
  }

  /* ===============================
     PRINT PDF (ADMIN ONLY)
  =============================== */
  function printPdf(index) {
    const orders = getOrders();
    const o = orders[index];
    if (!o) {
      alert('Data order tidak ditemukan');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('Library PDF tidak tersedia');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('PUKIS LUMER AULIA', 105, 15, { align: 'center' });

    doc.setTextColor(200);
    doc.text('PUKIS LUMER AULIA', 105, 140, { angle: 45, align: 'center' });
    doc.setTextColor(0);

    doc.autoTable({
      startY: 25,
      head: [['Keterangan', 'Detail']],
      body: [
        ['Invoice', o.invoice],
        ['Nama', o.nama],
        ['WA', o.wa],
        ['Jenis', (o.mode || '').toUpperCase()],
        ['Topping', (o.single || o.double || []).join(', ') || '-'],
        ['Taburan', (o.taburan || []).join(', ') || '-'],
        ['Pesan', o.catatan || '-'],
        ['Jumlah', (o.qty || 0) + ' Box'],
        ['Total', 'Rp ' + formatRp(o.total)]
      ]
    });

    doc.text(
      'Terimakasih sudah berkunjung ke Pukis Lumer Aulia',
      105,
      285,
      { align: 'center' }
    );

    doc.save(o.invoice + '.pdf');
  }

  /* ===============================
     STATISTICS
  =============================== */
  function renderStats(orders) {
    const el = document.getElementById('stats');
    if (!el) return;

    const s = calcStats(orders);

    el.innerHTML = `
      <strong>Order Hari Ini:</strong> ${s.orderHarian}<br>
      <strong>Pendapatan Hari Ini:</strong> Rp ${formatRp(s.pendapatanHarian)}<br>
      <strong>Order Bulan Ini:</strong> ${s.orderBulanan}<br>
      <strong>Pendapatan Bulan Ini:</strong> Rp ${formatRp(s.pendapatanBulanan)}
    `;
  }

  function calcStats(orders) {
    const now = new Date();
    let orderHarian = 0;
    let orderBulanan = 0;
    let pendapatanHarian = 0;
    let pendapatanBulanan = 0;

    orders.forEach(o => {
      if (o.status !== 'selesai' || !o.tgl) return;

      const d = new Date(o.tgl);

      if (d.toDateString() === now.toDateString()) {
        orderHarian++;
        pendapatanHarian += Number(o.total || 0);
      }

      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
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
     UTIL
  =============================== */
  function formatRp(num) {
    return (Number(num) || 0).toLocaleString('id-ID');
  }

  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /* ===============================
     INIT
  =============================== */
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnLogin');
    if (btn) btn.addEventListener('click', loginAdmin);
  });

})();
