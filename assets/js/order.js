/*
  assets/js/order.js — FINAL LOCKED (PRODUCTION)
  PUKIS LUMER AULIA

  ✔ Non / Single / Double tampil BENAR
  ✔ Single  → topping muncul
  ✔ Double  → topping + taburan muncul
  ✔ Harga otomatis STABIL
  ✔ Popup invoice 1 tombol WA
  ✔ Format WA RAPI (list)
  ✔ Anti double submit
  ✔ PDF HANYA ADMIN

  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(function () {
  'use strict';

  let __LOCK_SUBMIT = false;

  const ADMIN_WA = '6281296668670';
  const STORAGE_KEY = 'pukisOrders';

  /* ================= PRICE CONFIG ================= */
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

  const $  = id => document.getElementById(id);
  const $$ = q => Array.from(document.querySelectorAll(q));
  const rp = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

  const getRadio = name =>
    document.querySelector(`input[name="${name}"]:checked`)?.value || 'non';

  const getChecked = name =>
    $$(`input[name="${name}"]:checked`).map(i => i.value);

  /* ================= TOPPING VISIBILITY ================= */
  function syncTopping() {
    const mode = getRadio('ultraToppingMode');

    if ($('ultraSingleGroup'))
      $('ultraSingleGroup').style.display = mode === 'single' ? 'block' : 'none';

    if ($('ultraDoubleGroup'))
      $('ultraDoubleGroup').style.display = mode === 'double' ? 'block' : 'none';
  }

  /* ================= PRICE ================= */
  function updatePrice() {
    const jenis = getRadio('ultraJenis') || 'Original';
    const isi   = $('ultraIsi')?.value || '5';
    const mode  = getRadio('ultraToppingMode');
    const qty   = Math.max(1, parseInt($('ultraJumlah')?.value || '1', 10));

    const perBox  = BASE_PRICE[jenis]?.[isi]?.[mode] || 0;
    const subtotal = perBox * qty;

    const discount =
      qty >= 10 ? 1000 :
      qty >= 5  ? Math.round(subtotal * 0.01) : 0;

    const total = subtotal - discount;

    $('ultraPricePerBox') && ($('ultraPricePerBox').textContent = rp(perBox));
    $('ultraSubtotal')   && ($('ultraSubtotal').textContent   = rp(subtotal));
    $('ultraDiscount')   && ($('ultraDiscount').textContent   = discount ? '-' + rp(discount) : '-');
    $('ultraGrandTotal') && ($('ultraGrandTotal').textContent = rp(total));

    return { qty, total };
  }

  /* ================= BUILD ORDER ================= */
  function buildOrder() {
    const nama  = $('ultraNama')?.value.trim();
    const waRaw = $('ultraWA')?.value.trim();

    if (!nama || !waRaw) {
      alert('Nama & WhatsApp wajib diisi');
      return null;
    }

    let wa = waRaw.replace(/\D/g, '');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (wa.startsWith('8')) wa = '62' + wa;

    const jenis   = getRadio('ultraJenis') || 'Original';
    const mode    = getRadio('ultraToppingMode');
    const single  = getChecked('toppingSingle');
    const double  = getChecked('toppingDouble');
    const taburan = getChecked('taburan');

    if (mode === 'single' && single.length === 0)
      return alert('Single wajib pilih topping'), null;

    if (mode === 'double' && (double.length === 0 || taburan.length === 0))
      return alert('Double wajib topping & taburan'), null;

    const price = updatePrice();

    return {
      invoice: 'INV-' + Date.now(),
      tgl: new Date().toISOString(),
      nama,
      wa,
      jenis_pukis: jenis,
      mode,
      single,
      double,
      taburan,
      qty: price.qty,
      total: price.total,
      catatan: $('ultraNote')?.value || '-',
      status: 'pending'
    };
  }

  /* ================= SAVE ADMIN ================= */
  function saveOrderToAdmin(order) {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    orders.push(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }

  /* ================= POPUP ================= */
  let currentOrder = null;

  function showNota(o) {
    const toppingHTML =
      o.mode === 'single'
        ? o.single.map(t => `- ${t}`).join('<br>')
        : o.mode === 'double'
        ? o.double.map(t => `- ${t}`).join('<br>')
        : '-';

    const taburanHTML =
      o.mode === 'double'
        ? o.taburan.map(t => `- ${t}`).join('<br>')
        : '-';

    $('notaContent').innerHTML = `
      <div style="font-weight:800;text-align:center;margin-bottom:10px">
        PUKIS LUMER AULIA
      </div>

      <b>Invoice :</b> ${o.invoice}<br>
      <b>Nama :</b> ${o.nama}<br>
      <b>WA :</b> ${o.wa}<br>
      <b>Jenis :</b> ${o.jenis_pukis}<br>
      <b>Mode :</b> ${o.mode.toUpperCase()}<br><br>

      <b>Topping :</b><br>${toppingHTML}<br><br>
      <b>Taburan :</b><br>${taburanHTML}<br><br>

      <b>Jumlah :</b> ${o.qty} Box<br>
      <b>Catatan :</b> ${o.catatan}<br>
      <b>Total :</b> ${rp(o.total)}<br><br>

      <button id="sendToAdmin" class="btn-primary">
        Kirim ke WhatsApp Admin
      </button>
    `;

    $('notaContainer').style.display = 'flex';
    $('sendToAdmin').onclick = sendWA;
  }

  /* ================= SEND WA ================= */
  function sendWA() {
    const o = currentOrder;

    const toppingText =
      o.mode === 'single'
        ? o.single.map(t => `- ${t}`).join('\n')
        : o.mode === 'double'
        ? o.double.map(t => `- ${t}`).join('\n')
        : '-';

    const taburanText =
      o.mode === 'double'
        ? o.taburan.map(t => `- ${t}`).join('\n')
        : '-';

    const msg =
`PUKIS LUMER AULIA

Invoice : ${o.invoice}
Nama    : ${o.nama}
WA      : ${o.wa}
Jenis   : ${o.jenis_pukis}
Mode    : ${o.mode.toUpperCase()}

Topping :
${toppingText}

Taburan :
${taburanText}

Jumlah  : ${o.qty} Box
Catatan : ${o.catatan}
Total   : Rp ${Number(o.total).toLocaleString('id-ID')}
`;

    window.open(
      'https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(msg),
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

    setTimeout(() => (__LOCK_SUBMIT = false), 800);
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded', () => {
    syncTopping();
    updatePrice();

    $$('input[name="ultraToppingMode"]').forEach(i =>
      i.addEventListener('change', () => {
        syncTopping();
        updatePrice();
      })
    );

    $$('input, select').forEach(i =>
      i.addEventListener('change', updatePrice)
    );

    $('formUltra')?.addEventListener('submit', submitForm);
  });

})();
