/*
  assets/js/order.js — FINAL PRODUCTION (LOCKED)
  PDF Profesional + Invoice Popup
  Aman dipakai jangka panjang
*/

(function () {
  'use strict';

  const ADMIN_WA = '6281296668670';

  const BASE_PRICE = {
    Original: {
      '5': { non: 10000, single: 13000, double: 15000 },
      '10': { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      '5': { non: 12000, single: 15000, double: 17000 },
      '10': { non: 21000, single: 28000, double: 32000 }
    }
  };

  /* ================= SAFE HELPERS ================= */
  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  const getRadio = n =>
    document.querySelector(`input[name="${n}"]:checked`)?.value || 'non';

  const getChecked = n =>
    $$(`input[name="${n}"]:checked`).map(i => i.value);

  /* ================= TOPPING ================= */
  function syncTopping() {
    const mode = getRadio('ultraToppingMode');
    if ($('ultraSingleGroup')) $('ultraSingleGroup').style.display = mode === 'single' ? 'flex' : 'none';
    if ($('ultraDoubleGroup')) $('ultraDoubleGroup').style.display = mode === 'double' ? 'flex' : 'none';
  }

  /* ================= PRICE ================= */
  function updatePrice() {
    const jenis = getRadio('ultraJenis');
    const isi = $('ultraIsi').value;
    const mode = getRadio('ultraToppingMode');
    const qty = Math.max(1, parseInt($('ultraJumlah').value, 10));

    const perBox = BASE_PRICE[jenis][isi][mode];
    const subtotal = perBox * qty;
    const discount = qty >= 10 ? 1000 : qty >= 5 ? Math.round(subtotal * 0.01) : 0;
    const total = subtotal - discount;

    $('ultraPricePerBox').textContent = rp(perBox);
    $('ultraSubtotal').textContent = rp(subtotal);
    $('ultraDiscount').textContent = discount ? '-' + rp(discount) : '-';
    $('ultraGrandTotal').textContent = rp(total);

    return { total, qty };
  }

  /* ================= BUILD ORDER ================= */
  function buildOrder() {
    const nama = $('ultraNama').value.trim();
    const waRaw = $('ultraWA').value.trim();
    if (!nama || !waRaw) return alert('Nama & WA wajib diisi'), null;

    let wa = waRaw.replace(/\D/g, '');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (wa.startsWith('8')) wa = '62' + wa;

    const mode = getRadio('ultraToppingMode');
    const single = getChecked('toppingSingle');
    const double = getChecked('toppingDouble');
    const taburan = getChecked('taburan');

    if (mode === 'single' && single.length === 0)
      return alert('Pilih topping single'), null;

    if (mode === 'double' && (double.length === 0 || taburan.length === 0))
      return alert('Double wajib topping & taburan'), null;

    const price = updatePrice();

    return {
      invoice: 'INV-' + Date.now(),
      nama,
      wa,
      jenis: getRadio('ultraJenis'),
      mode,
      single,
      double,
      taburan,
      catatan: $('ultraNote').value || '-',
      qty: price.qty,
      total: price.total
    };
  }
/* ===============================
     SAVE ORDER TO ADMIN STORAGE
     (AUTO CONNECT ADMIN PANEL)
     ⚠️ FINAL LOCK — JANGAN DIUBAH
  =============================== */
  function saveOrderToAdmin(order) {
    try {
      const STORAGE_KEY = 'pukisOrders';
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

      orders.push({
        tgl: new Date().toISOString(),
        invoice: order.invoice,
        nama: order.nama,
        wa: order.wa,
        jenis: order.jenis,
        mode: order.mode,
        toppingSingle: order.single || [],
        toppingDouble: order.double || [],
        taburan: order.taburan || [],
        catatan: order.catatan,
        qty: order.qty,
        total: order.total,
        status: 'pending',
        pdfBase64: null
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn('Gagal simpan order admin:', e);
    }
  }
  /* ================= NOTA ================= */
  let currentOrder = null;

  function showNota(o) {
    $('notaContent').innerHTML = `
      <b>Invoice:</b> ${o.invoice}<br>
      <b>Nama:</b> ${o.nama}<br>
      <b>WA:</b> ${o.wa}<br>
      <b>Jenis:</b> ${o.mode.toUpperCase()}<br>
      <b>Jumlah:</b> ${o.qty} Box<br>
      <b>Total:</b> ${rp(o.total)}<br><br>
      <button id="sendToAdmin" class="btn-primary">Kirim WA</button>
      <button id="printPDF" class="btn-primary">Cetak PDF</button>
    `;
    $('notaContainer').style.display = 'flex';

    $('sendToAdmin').onclick = sendWA;
    $('printPDF').onclick = printPDF;
  }

  function hideNota() {
    $('notaContainer').style.display = 'none';
  }

  /* ================= PDF ================= */
  async function printPDF() {
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
        ['Invoice', currentOrder.invoice],
        ['Nama', currentOrder.nama],
        ['No. WA', currentOrder.wa],
        ['Jenis Pesanan', currentOrder.mode.toUpperCase()],
        ['Topping', currentOrder.single.join(', ') || currentOrder.double.join(', ') || '-'],
        ['Taburan', currentOrder.taburan.join(', ') || '-'],
        ['Catatan', currentOrder.catatan],
        ['Jumlah', currentOrder.qty + ' Box'],
        ['Total', rp(currentOrder.total)]
      ]
    });

    const qris = await loadImage('assets/images/qris.jpg');
    doc.addImage(qris, 'JPEG', 150, 230, 40, 40);

    const ttd = await loadImage('assets/images/TTD.png');
    doc.addImage(ttd, 'PNG', 130, doc.lastAutoTable.finalY + 10, 50, 20);

    doc.text('Terimakasih sudah berkunjung ke Pukis Lumer Aulia', 105, 285, { align: 'center' });

    doc.save(currentOrder.invoice + '.pdf');
  }

  function loadImage(src) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = src;
    });
  }

  /* ================= EVENTS ================= */
  function submitForm(e) {
    e.preventDefault();
    const o = buildOrder();
    if (!o) return;
    currentOrder = o;
    showNota(o);
  }

  function sendWA() {
    const msg =
      `Invoice: ${currentOrder.invoice}\n` +
      `Nama: ${currentOrder.nama}\n` +
      `Total: ${rp(currentOrder.total)}`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncTopping();
    updatePrice();

    $$('input[name="ultraToppingMode"]').forEach(i => i.onchange = syncTopping);
    $$('input').forEach(i => i.onchange = updatePrice);

    $('formUltra').onsubmit = submitForm;
    $('notaClose').onclick = hideNota;
  });

})();
