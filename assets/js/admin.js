/* ==================================================
   ADMIN PANEL — FINAL LOCK (THERMAL)
   PUKIS LUMER AULIA
   ✔ PDF Thermal 58mm / 80mm
   ✔ CAP STATUS: LUNAS / PENDING / BATAL
   ✔ QRIS + TTD + FOOTER
   ⚠️ JANGAN DIUBAH TANPA AUDIT
================================================== */
(() => {
  'use strict';

  /* ================= CONFIG ================= */
  const ADMIN_PIN = '030419';
  const STORAGE_KEY = 'pukisOrders';

  /* THERMAL SETTING */
  const PAPER_WIDTH = 80; // 80 = thermal 80mm | ubah ke 58 jika printer 58mm

  const $ = id => document.getElementById(id);
  const rp = n => (Number(n) || 0).toLocaleString('id-ID');

  /* ================= LOGIN ================= */
  function loginAdmin() {
    const pin = $('pin')?.value || '';
    if (pin !== ADMIN_PIN) {
      alert('PIN salah');
      $('pin').value = '';
      return;
    }
    $('login').style.display = 'none';
    $('admin').style.display = 'block';
    loadAdmin();
  }

  /* ================= STORAGE ================= */
  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveOrders(o) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  }

  /* ================= LOAD TABLE ================= */
  function loadAdmin() {
    const orders = getOrders();
    const tbody = document.querySelector('#orderTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    orders.forEach((o, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(o.tgl).toLocaleString()}</td>
        <td>${o.invoice}</td>
        <td>${o.nama}</td>
        <td>${o.wa}</td>
        <td>${o.mode}</td>
        <td>${o.qty}</td>
        <td>Rp ${rp(o.total)}</td>
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

  /* ================= STATUS ================= */
  window.updateStatus = function (i, status) {
    const orders = getOrders();
    if (!orders[i]) return;
    orders[i].status = status;
    saveOrders(orders);
    loadAdmin();
  };

  /* ================= PDF THERMAL ================= */
  window.printPdf = async function (i) {
    const o = getOrders()[i];
    if (!o) return alert('Data tidak ditemukan');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [PAPER_WIDTH, 200]
    });

    /* HEADER */
    doc.setFontSize(12);
    doc.text('PUKIS LUMER AULIA', PAPER_WIDTH / 2, 8, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Invoice: ' + o.invoice, 4, 14);

    /* TABLE */
    doc.autoTable({
      startY: 16,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: PAPER_WIDTH - 32 }
      },
      body: [
        ['Nama', o.nama],
        ['WA', o.wa],
        ['Jenis', o.mode.toUpperCase()],
        ['Jumlah', o.qty + ' Box'],
        ['Pesan', o.catatan || '-'],
        ['Total', 'Rp ' + rp(o.total)]
      ]
    });

    /* CAP STATUS */
    let capText = 'PENDING';
    let capColor = [255, 165, 0];

    if (o.status === 'selesai') {
      capText = 'LUNAS';
      capColor = [0, 160, 80];
    }
    if (o.status === 'dibatalkan') {
      capText = 'BATAL';
      capColor = [200, 0, 0];
    }

    doc.setFontSize(26);
    doc.setTextColor(...capColor);
    doc.text(
      capText,
      PAPER_WIDTH / 2,
      doc.lastAutoTable.finalY / 1.2,
      { align: 'center', angle: -15 }
    );
    doc.setTextColor(0);

    /* IMAGES */
    const loadImg = src =>
      new Promise(res => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });

    try {
      const qris = await loadImg('assets/images/qris-pukis.jpg');
      const ttd = await loadImg('assets/images/ttd.png');

      doc.addImage(qris, 'JPEG', 4, doc.lastAutoTable.finalY + 6, 20, 20);
      doc.addImage(
        ttd,
        'PNG',
        PAPER_WIDTH - 24,
        doc.lastAutoTable.finalY + 8,
        20,
        10
      );
    } catch {}

    /* FOOTER */
    doc.setFontSize(8);
    doc.text(
      'Terimakasih sudah belanja\nKami tunggu kunjungan selanjutnya',
      PAPER_WIDTH / 2,
      doc.lastAutoTable.finalY + 32,
      { align: 'center' }
    );

    doc.save(o.invoice + '.pdf');
  };

  /* ================= STATS ================= */
  function renderStats(orders) {
    const now = new Date();
    let totalBulanan = 0;

    orders.forEach(o => {
      if (o.status === 'selesai') {
        const d = new Date(o.tgl);
        if (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        ) {
          totalBulanan += Number(o.total || 0);
        }
      }
    });

    $('stats').innerHTML = `
      <b>Total Pendapatan Bulan Ini:</b>
      Rp ${rp(totalBulanan)}
    `;
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded', () => {
    $('btnLogin').onclick = loginAdmin;
  });

})();
