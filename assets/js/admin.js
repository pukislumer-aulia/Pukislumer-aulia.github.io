/*
  ADMIN PANEL — FINAL LOCK (A4 STANDARD)
  PUKIS LUMER AULIA

  ✔ PDF A4 Portrait (Printer Standar)
  ✔ TABEL RAPI & TERKUNCI
  ✔ WATERMARK: LUNAS / PENDING
  ✔ QRIS + TTD + FOOTER
  ✔ RESET SEMUA PESANAN
  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(() => {
  'use strict';

  const ADMIN_PIN   = '030419';
  const STORAGE_KEY = 'pukisOrders';

  const $  = id => document.getElementById(id);
  const rp = n => (Number(n) || 0).toLocaleString('id-ID');

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
  function getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function saveOrders(o) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  }

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
              <option value="pending"${o.status === 'pending' ? ' selected' : ''}>pending</option>
              <option value="lunas"${o.status === 'lunas' ? ' selected' : ''}>lunas</option>
            </select>
          </td>
          <td>
            <button onclick="printPdf(${i})">PDF</button>
          </td>
        </tr>`;
    });

    renderStats(orders);
  }

  window.updateStatus = function (i, s) {
    const o = getOrders();
    o[i].status = s;
    saveOrders(o);
    loadAdmin();
  };

  /* ================= RESET ================= */
  window.resetAllOrders = function () {
    if (!confirm('Yakin reset semua pesanan?')) return;
    localStorage.removeItem(STORAGE_KEY);
    loadAdmin();
  };

  /* ================= PDF A4 ================= */
  window.printPdf = function (i) {
    const o = getOrders()[i];
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    /* HEADER */
    doc.setFontSize(16);
    doc.text('PUKIS LUMER AULIA', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Invoice : ${o.invoice}`, 14, 25);
    doc.text(`Nama    : ${o.nama}`,    14, 31);
    doc.text(`No. WA  : ${o.wa}`,      14, 37);

    doc.text(`Tanggal : ${new Date(o.tgl).toLocaleString()}`, 140, 25);
    doc.text(`Antrian : ${i + 1}`, 140, 31);

    /* WATERMARK */
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(50);
    doc.text(
      o.status === 'lunas' ? 'LUNAS' : 'PENDING',
      105,
      150,
      { align: 'center', angle: 45 }
    );
    doc.setTextColor(0);

    /* TABLE */
    doc.autoTable({
      startY: 45,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      head: [['Keterangan', 'Detail']],
      body: [
  ['Nama Toko', 'PUKIS LUMER AULIA'],
  ['Jenis Pesanan', o.mode.toUpperCase()],
  ['Topping', o.topping?.length ? o.topping.join(', ') : '-'],
  ['Taburan', o.taburan?.length ? o.taburan.join(', ') : '-'],
  ['Jumlah', o.qty + ' Box'],
  ['Catatan', o.catatan || '-'],
  ['Total', 'Rp ' + rp(o.total)]
]

    const yFooter = doc.lastAutoTable.finalY + 15;

    /* QRIS */
    doc.addImage('assets/images/qris-pukis.jpg', 'JPG', 14, yFooter, 40, 40);

    /* TTD */
    doc.setFontSize(10);
    doc.text('Hormat Kami', 150, yFooter);
    doc.addImage('assets/images/ttd.png', 'PNG', 145, yFooter + 5, 40, 20);

    /* FOOTER */
    doc.setFontSize(10);
    doc.text(
      'Terimakasih sudah Belanja di Dapur Aulia\nKami Tunggu Kunjungan Selanjutnya',
      105,
      285,
      { align: 'center' }
    );

    doc.save(o.invoice + '.pdf');
  };

  /* ================= STATS ================= */
  function renderStats(o) {
    let total = 0;
    o.forEach(x => {
      if (x.status === 'lunas') total += Number(x.total || 0);
    });
    $('stats').innerHTML =
      `<b>Total Pendapatan (LUNAS):</b> Rp ${rp(total)}
       <br><button onclick="resetAllOrders()" style="margin-top:8px;
       background:#c0392b;color:#fff;border:none;padding:6px 10px;
       border-radius:5px;cursor:pointer">
       Reset Semua Pesanan</button>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('btnLogin').onclick = loginAdmin;
  });

})();
