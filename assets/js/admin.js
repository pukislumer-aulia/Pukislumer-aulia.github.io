/*
  ADMIN PANEL — FINAL LOCK (A4)
  PUKIS LUMER AULIA

  ✔ Login STABIL
  ✔ PDF A4 RAPI
  ✔ TABEL LENGKAP
  ✔ TOPPING + TABURAN AMAN
  ✔ WATERMARK: LUNAS / PENDING
  ✔ RESET SEMUA PESANAN
  ✔ TANPA SYNTAX MODERN BERBAHAYA

  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(function () {
  'use strict';

  /* ================= CONFIG ================= */
  var ADMIN_PIN = '030419';
  var STORAGE_KEY = 'pukisOrders';

  /* ================= UTIL ================= */
  function $(id) {
    return document.getElementById(id);
  }

  function rp(n) {
    return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
  }

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveOrders(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /* ================= LOGIN ================= */
  function loginAdmin() {
    var pin = $('pin').value;

    if (pin !== ADMIN_PIN) {
      alert('PIN salah');
      $('pin').value = '';
      return;
    }

    $('login').style.display = 'none';
    $('admin').style.display = 'block';
    loadAdmin();
  }

  /* ================= LOAD TABLE ================= */
  function loadAdmin() {
    var orders = getOrders();
    var tbody = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '';

    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];

      var tr = document.createElement('tr');

      tr.innerHTML =
        '<td>' + new Date(o.tgl).toLocaleString('id-ID') + '</td>' +
        '<td>' + o.invoice + '</td>' +
        '<td>' + o.nama + '</td>' +
        '<td>' + o.wa + '</td>' +
        '<td>' + (o.mode || '-') + '</td>' +
        '<td>' + o.qty + '</td>' +
        '<td>' + rp(o.total) + '</td>' +
        '<td>' +
          '<select data-index="' + i + '">' +
            '<option value="pending"' + (o.status === 'pending' ? ' selected' : '') + '>pending</option>' +
            '<option value="selesai"' + (o.status === 'selesai' ? ' selected' : '') + '>selesai</option>' +
          '</select>' +
        '</td>' +
        '<td><button data-pdf="' + i + '">PDF</button></td>';

      tbody.appendChild(tr);
    }

    bindTableEvents();
    renderStats(orders);
  }

  function bindTableEvents() {
    var selects = document.querySelectorAll('select[data-index]');
    for (var i = 0; i < selects.length; i++) {
      selects[i].onchange = function () {
        var idx = this.getAttribute('data-index');
        var orders = getOrders();
        orders[idx].status = this.value;
        saveOrders(orders);
        renderStats(orders);
      };
    }

    var pdfBtns = document.querySelectorAll('button[data-pdf]');
    for (var j = 0; j < pdfBtns.length; j++) {
      pdfBtns[j].onclick = function () {
        var idx = this.getAttribute('data-pdf');
        printPdf(idx);
      };
    }
  }

  /* ================= STATS ================= */
  function renderStats(orders) {
    var total = 0;
    var now = new Date();

    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];
      var d = new Date(o.tgl);

      if (
        o.status === 'selesai' &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        total += Number(o.total || 0);
      }
    }

    $('stats').innerHTML =
      '<b>Total Pendapatan Bulan Ini:</b> ' + rp(total) +
      '<br><button id="btnResetAll" style="margin-top:8px;padding:6px 10px;background:#c0392b;color:#fff;border:none;border-radius:4px;cursor:pointer">Reset Semua Pesanan</button>';

    $('btnResetAll').onclick = resetAllOrders;
  }

  function resetAllOrders() {
    if (!confirm('Yakin hapus SEMUA pesanan?')) return;
    localStorage.removeItem(STORAGE_KEY);
    loadAdmin();
  }

  /* ================= PDF A4 ================= */
  function printPdf(index) {
    var orders = getOrders();
    var o = orders[index];
    if (!o) return;

    /* NORMALISASI DATA LAMA */
    var topping = o.topping || o.single || [];
    var taburan = o.taburan || [];

    var { jsPDF } = window.jspdf;
    var doc = new jsPDF('p', 'mm', 'a4');

    /* HEADER */
    doc.setFontSize(16);
    doc.text('PUKIS LUMER AULIA', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Invoice : ' + o.invoice, 15, 25);
    doc.text('Nama    : ' + o.nama, 15, 32);
    doc.text('No. WA  : ' + o.wa, 15, 39);

    doc.text('Tanggal : ' + new Date(o.tgl).toLocaleString('id-ID'), 140, 25);
    doc.text('Status  : ' + (o.status || 'pending').toUpperCase(), 140, 32);

    /* TABLE */
    doc.autoTable({
      startY: 48,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 110 }
      },
      body: [
        ['Jenis Pesanan', (o.mode || '').toUpperCase()],
        ['Topping', topping.length ? topping.join(', ') : '-'],
        ['Taburan', taburan.length ? taburan.join(', ') : '-'],
        ['Jumlah', o.qty + ' Box'],
        ['Catatan', o.catatan || '-'],
        ['Total', rp(o.total)]
      ]
    });

    var endY = doc.lastAutoTable.finalY + 15;

    /* WATERMARK */
    doc.setFontSize(40);
    doc.setTextColor(200, 200, 200);
    doc.text(
      (o.status === 'selesai' ? 'LUNAS' : 'PENDING'),
      105,
      160,
      { align: 'center', angle: 30 }
    );

    doc.setTextColor(0, 0, 0);

    /* FOOTER */
    doc.setFontSize(10);
    doc.text('Terimakasih sudah Belanja di Dapur Aulia', 105, 270, { align: 'center' });
    doc.text('Kami tunggu kunjungan selanjutnya', 105, 276, { align: 'center' });

    doc.save(o.invoice + '.pdf');
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded', function () {
    $('btnLogin').onclick = loginAdmin;
  });

})();
