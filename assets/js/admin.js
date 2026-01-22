/*
  ADMIN PANEL — FINAL LOCK (A4)
  PUKIS LUMER AULIA

  ✔ PDF A4 RAPI
  ✔ TABEL LENGKAP (TOPPING & TABURAN MUNCUL)
  ✔ WATERMARK: LUNAS / PENDING
  ✔ RESET SEMUA PESANAN
  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(() => {
  'use strict';

  const ADMIN_PIN   = '030419';
  const STORAGE_KEY = 'pukisOrders';

  const $  = id => document.getElementById(id);
  const rp = n  => (Number(n) || 0).toLocaleString('id-ID');

  /* ================= LOGIN ================= */
  function loginAdmin() {
    if ($('pin').value !== ADMIN_PIN) {
      alert('PIN salah');
      $('pin').value = '';
      return;
    }
    $('login').style.display = 'none';
    $('admin').style.display = 'block';
    loadAdmin();
  }

  /* ================= STORAGE ================= */
  const getOrders = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const saveOrders = o =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));

  /* ================= LOAD TABLE ================= */
  function loadAdmin() {
    const orders = getOrders();
    const tbody  = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '';

    orders.forEach((o, i) => {
      tbody.innerHTML += `
        <tr>
          <td>${new Date(o.tgl).toLocaleString()}</td>
          <td>${o.invoice}</td>
          <td>${o.nama}</td>
          <td>${o.wa}</td>
          <td>${o.mode.toUpperCase()}</td>
          <td>${o.qty}</td>
          <td>Rp ${rp(o.total)}</td>
          <td>
            <select onchange="updateStatus(${i},this.value)">
              <option value="pending"${o.status==='pending'?' selected':''}>pending</option>
              <option value="lunas"${o.status==='lunas'?' selected':''}>lunas</option>
              <option value="batal"${o.status==='batal'?' selected':''}>batal</option>
            </select>
          </td>
          <td><button onclick="printPdf(${i})">PDF</button></td>
        </tr>`;
    });

    renderStats(orders);
  }

  /* ================= STATUS ================= */
  window.updateStatus = function (i, s) {
    const o = getOrders();
    o[i].status = s;
    saveOrders(o);
    loadAdmin();
  };

  /* ================= RESET ================= */
  window.resetAllOrders = function () {
    if (!confirm('Yakin hapus SEMUA pesanan?')) return;
    localStorage.removeItem(STORAGE_KEY);
    loadAdmin();
  };

  /* ================= PDF A4 ================= */
  window.printPdf = function (i) {
    const o = getOrders()[i];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageW = 210;
    let y = 20;

    /* HEADER */
    doc.setFontSize(16);
    doc.text('PUKIS LUMER AULIA', pageW / 2, y, { align: 'center' });

    doc.setFontSize(10);
    y += 10;
    doc.text(`Invoice : ${o.invoice}`, 14, y);
    doc.text(`Tanggal : ${new Date(o.tgl).toLocaleString()}`, 140, y);

    y += 6;
    doc.text(`Nama : ${o.nama}`, 14, y);
    doc.text(`WA : ${o.wa}`, 140, y);

    /* WATERMARK */
    if (o.status === 'lunas' || o.status === 'pending') {
      doc.setTextColor(200);
      doc.setFontSize(60);
      doc.text(
        o.status.toUpperCase(),
        pageW / 2,
        150,
        { align: 'center', angle: 45 }
      );
      doc.setTextColor(0);
    }

    /* TABLE */
    y += 10;
    doc.autoTable({
      startY: y,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 110 }
      },
      body: [
        ['Nama Toko', 'PUKIS LUMER AULIA'],
        ['Jenis Pesanan', o.mode.toUpperCase()],
        [
          'Topping',
          o.topping?.length ? o.topping.join(', ') : '-'
        ],
        [
          'Taburan',
          o.taburan?.length ? o.taburan.join(', ') : '-'
        ],
        ['Jumlah', o.qty + ' Box'],
        ['Catatan', o.catatan || '-'],
        ['Total', 'Rp ' + rp(o.total)]
      ]
    });

    let endY = doc.lastAutoTable.finalY + 20;

    /* FOOTER */
    doc.setFontSize(11);
    doc.text('Hormat Kami', 150, endY);

    doc.setFontSize(10);
    doc.text(
      'Terimakasih sudah belanja di Dapur Aulia\nKami tunggu kunjungan selanjutnya',
      pageW / 2,
      endY + 20,
      { align: 'center' }
    );

    doc.save(o.invoice + '.pdf');
  };

  /* ================= STATS ================= */
  function renderStats(o) {
    let total = 0;
    const now = new Date();
    o.forEach(x => {
      const d = new Date(x.tgl);
      if (x.status === 'lunas' && d.getMonth() === now.getMonth())
        total += Number(x.total || 0);
    });
    $('stats').innerHTML =
      `<b>Total Pendapatan Bulan Ini:</b> Rp ${rp(total)}
       <br><button onclick="resetAllOrders()">Reset Semua Pesanan</button>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('btnLogin').onclick = loginAdmin;
  });

})();
