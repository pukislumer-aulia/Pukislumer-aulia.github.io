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
  const PAPER_WIDTH = 80; // 80mm | ubah ke 58 jika printer 58mm

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
        <td>${o.mode.toUpperCase()}</td>
        <td>${o.qty}</td>
        <td>Rp ${rp(o.total)}</td>
        <td>
          <select onchange="updateStatus(${i}, this.value)">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>PENDING</option>
            <option value="selesai" ${o.status === 'selesai' ? 'selected' : ''}>LUNAS</option>
            <option value="dibatalkan" ${o.status === 'dibatalkan' ? 'selected' : ''}>BATAL</option>
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
      format: [PAPER_WIDTH, 220]
    });

    let y = 6;

    /* HEADER */
    doc.setFontSize(11);
    doc.text('PUKIS LUMER AULIA', PAPER_WIDTH / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.text(`Invoice : ${o.invoice}`, 4, y); y += 4;
    doc.text(`Tanggal : ${new Date(o.tgl).toLocaleString('id-ID')}`, 4, y); y += 4;
    doc.text(`Nama    : ${o.nama}`, 4, y); y += 4;
    doc.text(`WA      : ${o.wa}`, 4, y); y += 4;

    /* DATA TABLE */
    doc.autoTable({
      startY: y + 2,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: PAPER_WIDTH - 32 }
      },
      body: [
        ['Jenis', o.mode.toUpperCase()],
        ['Topping', (o.single || o.double || []).join(', ') || '-'],
        ['Taburan', (o.taburan || []).join(', ') || '-'],
        ['Jumlah', o.qty + ' Box'],
        ['Catatan', o.catatan || '-'],
        ['Total', 'Rp ' + rp(o.total)]
      ]
    });

    const tableEnd = doc.lastAutoTable.finalY;

    /* CAP STATUS */
    let cap = 'PENDING';
    let capColor = [255, 165, 0];

    if (o.status === 'selesai') {
      cap = 'LUNAS';
      capColor = [0, 160, 80];
    } else if (o.status === 'dibatalkan') {
      cap = 'BATAL';
      capColor = [200, 0, 0];
    }

    doc.setFontSize(24);
    doc.setTextColor(...capColor);
    doc.text(cap, PAPER_WIDTH / 2, tableEnd - 10, {
      align: 'center',
      angle: -12
    });
    doc.setTextColor(0);

    /* LOAD IMAGE */
    const loadImg = src =>
      new Promise(res => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
      });

    try {
      const qris = await loadImg('assets/images/qris-pukis.jpg');
      const ttd = await loadImg('assets/images/ttd.png');

      doc.addImage(qris, 'JPEG', 4, tableEnd + 6, 22, 22);
      doc.text('Hormat Kami', PAPER_WIDTH - 26, tableEnd + 6);
      doc.addImage(ttd, 'PNG', PAPER_WIDTH - 28, tableEnd + 10, 22, 12);
    } catch {}

    /* FOOTER */
    doc.setFontSize(8);
    doc.text(
      'Terimakasih sudah Belanja di Dapur Aulia\nKami Tunggu Kunjungan Selanjutnya',
      PAPER_WIDTH / 2,
      tableEnd + 40,
      { align: 'center' }
    );

    doc.save(o.invoice + '.pdf');
  };

  /* ================= STATS ================= */
  function renderStats(orders) {
    const now = new Date();
    let total = 0;

    orders.forEach(o => {
      if (o.status === 'selesai') {
        const d = new Date(o.tgl);
        if (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        ) {
          total += Number(o.total || 0);
        }
      }
    });

    $('stats').innerHTML = `
      <b>Total Pendapatan Bulan Ini:</b>
      Rp ${rp(total)}
    `;
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded', () => {
    $('btnLogin').onclick = loginAdmin;
  });

})();
