/*
  ADMIN.JS — FINAL PRODUCTION
  PUKIS LUMER AULIA
  LOCKED — DO NOT EDIT WITHOUT AUDIT
*/
(() => {
  'use strict';

  /* ================= CONFIG ================= */
  const ADMIN_PIN = '030419';
  const STORAGE_KEY = 'pukisOrders';

  /* ================= PRICE (SAMA DENGAN order.js) ================= */
  const BASE_PRICE = {
    Original: {
      '5':  { non: 10000, single: 13000, double: 15000 },
      '10': { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      '5':  { non: 12000, single: 15000, double: 17000 },
      '10': { non: 21000, single: 28000, double: 32000 }
    }
  };

  /* ================= HELPERS ================= */
  const $  = id => document.getElementById(id);
  const $$ = q => Array.from(document.querySelectorAll(q));
  const rp = n => (Number(n) || 0).toLocaleString('id-ID');
  const pad4 = n => String(n).padStart(4, '0');

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
    calcManualPrice();
  }

  /* ================= PRICE CALC ================= */
  function calcManualPrice() {
    const jenis =
      document.querySelector('input[name="mJenisPukis"]:checked')?.value || 'Original';
    const isi  = $('mIsi').value;
    const mode = $('mMode').value;
    const qty  = Math.max(1, parseInt($('mQty').value || '1', 10));

    const perBox = BASE_PRICE[jenis]?.[isi]?.[mode] || 0;
    const subtotal = perBox * qty;

    const discount =
      qty >= 10 ? 1000 :
      qty >= 5  ? Math.round(subtotal * 0.01) : 0;

    const total = subtotal - discount;

    $('mTotal').value = total;
    $('mInfoHarga').innerHTML =
      `Harga/Box: Rp ${rp(perBox)}<br>
       Subtotal: Rp ${rp(subtotal)}<br>
       Diskon: ${discount ? '-Rp ' + rp(discount) : '-'}`;

    return total;
  }

  /* ================= STORAGE ================= */
  const getOrders = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const saveOrders = o =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));

  /* ================= ADD MANUAL ================= */
  function addManualOrder() {
    const nama = $('mNama').value.trim();
    const wa   = $('mWa').value.trim();
    if (!nama || !wa) return alert('Nama & WA wajib');

    const total = calcManualPrice();
    if (total <= 0) return alert('Total tidak valid');

    const mode = $('mMode').value;

    const topping = $('mTopping').value.split(',').map(x => x.trim()).filter(Boolean);
    const taburan = $('mTaburan').value.split(',').map(x => x.trim()).filter(Boolean);

    const orders = getOrders();

    orders.push({
      invoice: 'INV-' + Date.now(),
      tgl: new Date().toISOString(),
      nama,
      wa,
      jenis_pukis: document.querySelector('input[name="mJenisPukis"]:checked').value,
      isi_per_box: $('mIsi').value,
      mode,
      single: mode === 'single' ? topping : [],
      double: mode === 'double' ? topping : [],
      taburan: mode === 'double' ? taburan : [],
      qty: parseInt($('mQty').value, 10),
      total,
      catatan: $('mCatatan').value || '-',
      status: 'pending'
    });

    saveOrders(orders);
    clearForm();
    loadAdmin();
  }

  function clearForm() {
    ['mNama','mWa','mTopping','mTaburan','mCatatan'].forEach(id => $(id).value = '');
    $('mQty').value = 1;
    calcManualPrice();
  }

  /* ================= LOAD TABLE ================= */
  function loadAdmin() {
    const orders = getOrders();
    const tbody = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '';

    orders.forEach((o, i) => {
      tbody.innerHTML += `
        <tr>
          <td>${new Date(o.tgl).toLocaleString('id-ID')}</td>
          <td>${o.invoice}</td>
          <td>${o.nama}</td>
          <td>${o.wa}</td>
          <td>${o.jenis_pukis}<br>${o.isi_per_box} pcs / box<br>${o.mode}</td>
          <td>${o.qty}</td>
          <td>Rp ${rp(o.total)}</td>
          <td>
            <select onchange="updateStatus(${i},this.value)">
              <option value="pending"${o.status==='pending'?' selected':''}>pending</option>
              <option value="selesai"${o.status==='selesai'?' selected':''}>selesai</option>
            </select>
          </td>
          <td><button onclick="printPdf(${i})">PDF</button></td>
        </tr>`;
    });

    renderStats(orders);
  }

  window.updateStatus = (i, s) => {
    const o = getOrders();
    o[i].status = s;
    saveOrders(o);
    loadAdmin();
  };

  /* ================= PDF ================= */
  window.printPdf = function (i) {
    const o = getOrders()[i];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('PUKIS LUMER AULIA', 105, 15, { align: 'center' });
    doc.text(`Invoice : ${o.invoice}`, 14, 30);
    doc.text(`Nama : ${o.nama}`, 14, 36);
    doc.text(`Total : Rp ${rp(o.total)}`, 14, 42);
    doc.save(o.invoice + '.pdf');
  };

  /* ================= STATS ================= */
  function renderStats(o) {
    let total = 0;
    const now = new Date();
    o.forEach(x => {
      const d = new Date(x.tgl);
      if (x.status === 'selesai' && d.getMonth() === now.getMonth())
        total += x.total;
    });
    $('stats').innerHTML = `<b>Total Pendapatan Bulan Ini:</b> Rp ${rp(total)}`;
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded', () => {
    $('btnLogin').onclick = loginAdmin;
    $('btnAddManual').onclick = addManualOrder;
    $('btnResetAll').onclick = () => {
      if (confirm('Hapus semua pesanan?')) {
        localStorage.removeItem(STORAGE_KEY);
        loadAdmin();
      }
    };

    $$('input,select').forEach(el =>
      el.addEventListener('change', calcManualPrice)
    );
  });

})();
