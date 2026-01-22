/*
  assets/js/order.js — FINAL LOCKED (PRODUCTION)
  PUKIS LUMER AULIA

  ✔ Non / Single / Double tampil BENAR
  ✔ Single  → topping muncul
  ✔ Double  → topping + taburan muncul
  ✔ Harga otomatis STABIL
  ✔ Popup invoice 1 tombol WA
  ✔ Anti double submit
  ✔ PDF HANYA ADMIN
  ✔ Aman Android low-end

  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(function () {
  'use strict';

  /* ===============================
     SUBMIT LOCK
  =============================== */
  let __LOCK_SUBMIT = false;

  /* ================= CONFIG ================= */
  const ADMIN_WA = '6281296668670';
  const STORAGE_KEY = 'pukisOrders';

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

  /* ================= HELPERS ================= */
  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const rp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

  const getRadio = name => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  };

  const getChecked = name =>
    $$(`input[name="${name}"]:checked`).map(i => i.value);

  /* ================= TOPPING VISIBILITY ================= */
  function syncTopping() {
    const mode = getRadio('ultraToppingMode') || 'non';

    const single = $('ultraSingleGroup');
    const double = $('ultraDoubleGroup');

    if (single) single.style.display = (mode === 'single') ? 'block' : 'none';
    if (double) double.style.display = (mode === 'double') ? 'block' : 'none';
  }

  /* ================= PRICE ================= */
  function updatePrice() {
    const jenisEl = document.querySelector('input[name="ultraJenis"]:checked');
    const jenis = jenisEl ? jenisEl.value : 'Original';

    const isi = $('ultraIsi') ? $('ultraIsi').value : '5';
    const mode = getRadio('ultraToppingMode') || 'non';
    const qty = Math.max(1, parseInt($('ultraJumlah')?.value || '1', 10));

    const perBox = BASE_PRICE[jenis]?.[isi]?.[mode] || 0;
    const subtotal = perBox * qty;

    const discount =
      qty >= 10 ? 1000 :
      qty >= 5  ? Math.round(subtotal * 0.01) : 0;

    const total = subtotal - discount;

    if ($('ultraPricePerBox')) $('ultraPricePerBox').textContent = rp(perBox);
    if ($('ultraSubtotal')) $('ultraSubtotal').textContent = rp(subtotal);
    if ($('ultraDiscount')) $('ultraDiscount').textContent = discount ? '-' + rp(discount) : '-';
    if ($('ultraGrandTotal')) $('ultraGrandTotal').textContent = rp(total);

    return { qty, total };
  }

  /* ================= BUILD ORDER ================= */
  function buildOrder() {
    const nama = $('ultraNama')?.value.trim();
    const waRaw = $('ultraWA')?.value.trim();

    if (!nama || !waRaw) {
      alert('Nama dan Nomor WhatsApp wajib diisi');
      return null;
    }

    let wa = waRaw.replace(/\D/g, '');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (wa.startsWith('8')) wa = '62' + wa;

    const mode = getRadio('ultraToppingMode') || 'non';
    const single = getChecked('toppingSingle');
    const double = getChecked('toppingDouble');
    const taburan = getChecked('taburan');

    if (mode === 'single' && single.length === 0) {
      alert('Pilih minimal 1 topping');
      return null;
    }

    if (mode === 'double' && (double.length === 0 || taburan.length === 0)) {
      alert('Double wajib topping dan taburan');
      return null;
    }

    const price = updatePrice();

    return {
      invoice: 'INV-' + Date.now(),
      tgl: new Date().toISOString(),
      nama,
      wa,
      jenis: getRadio('ultraJenis') || 'Original',
      mode,
      single,
      double,
      taburan,
      catatan: $('ultraNote')?.value || '-',
      qty: price.qty,
      total: price.total
    };
  }

  /* ================= SAVE ADMIN ================= */
  function saveOrderToAdmin(order) {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    orders.push({ ...order, status: 'pending', pdfBase64: null });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }

  /* ================= NOTA POPUP ================= */
  let currentOrder = null;

  function showNota(o) {
    $('notaContent').innerHTML = `
      <b>Invoice :</b> ${o.invoice}<br>
      <b>Nama :</b> ${o.nama}<br>
      <b>WA :</b> ${o.wa}<br>
      <b>Jenis :</b> ${o.mode.toUpperCase()}<br>
      <b>Jumlah :</b> ${o.qty} Box<br>
      <b>Pesan :</b> ${o.catatan}<br>
      <b>Total :</b> ${rp(o.total)}<br><br>
      <button id="sendToAdmin" class="btn-primary">
        Kirim pesan ke WhatsApp
      </button>
    `;
    $('notaContainer').style.display = 'flex';
    $('sendToAdmin').onclick = sendWA;
  }

  function hideNota() {
    if ($('notaContainer')) $('notaContainer').style.display = 'none';
  }

  /* ================= SEND WA ================= */
  function sendWA() {
  const toppingText =
    currentOrder.mode === 'single'
      ? currentOrder.single.join(', ')
      : currentOrder.mode === 'double'
      ? currentOrder.double.join(', ')
      : '-';

  const taburanText =
    currentOrder.mode === 'double'
      ? currentOrder.taburan.join(', ')
      : '-';

  const msg =
`PUKIS LUMER AULIA

Invoice : ${currentOrder.invoice}
Nama    : ${currentOrder.nama}
WA      : ${currentOrder.wa}
Jenis   : ${currentOrder.mode.toUpperCase()}

Topping :
${toppingText}

Taburan :
${taburanText}

Jumlah  : ${currentOrder.qty} Box
Catatan : ${currentOrder.catatan}
Total   : Rp ${Number(currentOrder.total).toLocaleString('id-ID')}
`;

  window.open(
    `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`,
    '_blank'
  );
}

  /* ================= SUBMIT ================= */
  function submitForm(e) {
    e.preventDefault();
    if (__LOCK_SUBMIT) return;
    __LOCK_SUBMIT = true;

    const order = buildOrder();
    if (!order) {
      __LOCK_SUBMIT = false;
      return;
    }

    saveOrderToAdmin(order);
    currentOrder = order;
    showNota(order);

    setTimeout(() => { __LOCK_SUBMIT = false; }, 800);
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded', () => {
    syncTopping();
    updatePrice();

    $$('input[name="ultraToppingMode"]').forEach(el => {
      el.addEventListener('change', () => {
        syncTopping();
        updatePrice();
      });
    });

    $$('input:not([name="ultraToppingMode"]), select').forEach(el => {
      el.addEventListener('change', updatePrice);
    });

    if ($('formUltra')) $('formUltra').addEventListener('submit', submitForm);
    if ($('notaClose')) $('notaClose').addEventListener('click', hideNota);
  });

})();
