/*
  assets/js/order.js — FINAL LOCKED (PRODUCTION + FIREBASE)
  PUKIS LUMER AULIA

  ✔ Isi per box 5pcs / 10pcs
  ✔ Harga ikut isi per box
  ✔ Popup + WA lengkap
  ✔ Sinkron admin.js (Firestore)
  ✔ Anti double submit
  ✔ LocalStorage backup
  ✔ Realtime multi device

  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

import { db } from './firebase.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

(function () {
  'use strict';

  let __LOCK_SUBMIT = false;

  const ADMIN_WA = '6281296668670';
  const STORAGE_KEY = 'pukisOrders';
  const FIRESTORE_COLLECTION = 'orders';

  /* ================= PRICE ================= */
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

  /* ================= TOPPING ================= */
  function syncTopping() {
    const mode = getRadio('ultraToppingMode');

    $('ultraSingleGroup') &&
      ($('ultraSingleGroup').style.display = mode === 'single' ? 'block' : 'none');

    $('ultraDoubleGroup') &&
      ($('ultraDoubleGroup').style.display = mode === 'double' ? 'block' : 'none');
  }

  /* ================= PRICE ================= */
  function updatePrice() {
    const jenis = getRadio('ultraJenis') || 'Original';
    const isi   = $('ultraIsi')?.value || '5';
    const mode  = getRadio('ultraToppingMode');
    const qty   = Math.max(1, parseInt($('ultraJumlah')?.value || '1', 10));

    const perBox   = BASE_PRICE[jenis]?.[isi]?.[mode] || 0;
    const subtotal = perBox * qty;

    const discount =
      qty >= 10 ? 1000 :
      qty >= 5  ? Math.round(subtotal * 0.01) : 0;

    const total = subtotal - discount;

    $('ultraPricePerBox') && ($('ultraPricePerBox').textContent = rp(perBox));
    $('ultraSubtotal')   && ($('ultraSubtotal').textContent   = rp(subtotal));
    $('ultraDiscount')   && ($('ultraDiscount').textContent   = discount ? '-' + rp(discount) : '-');
    $('ultraGrandTotal') && ($('ultraGrandTotal').textContent = rp(total));

    return { qty, isi, total };
  }

  /* ================= BUILD ORDER ================= */
  function buildOrder() {
    const nama  = $('ultraNama')?.value.trim();
    const waRaw = $('ultraWA')?.value.trim();
    if (!nama || !waRaw) return alert('Nama & WA wajib'), null;

    let wa = waRaw.replace(/\D/g, '');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (wa.startsWith('8')) wa = '62' + wa;

    const jenis   = getRadio('ultraJenis');
    const isi     = $('ultraIsi')?.value || '5';
    const mode    = getRadio('ultraToppingMode');
    const single  = getChecked('toppingSingle');
    const double  = getChecked('toppingDouble');
    const taburan = getChecked('taburan');

    if (mode === 'single' && single.length === 0)
      return alert('Single wajib topping'), null;

    if (mode === 'double' && (double.length === 0 || taburan.length === 0))
      return alert('Double wajib topping & taburan'), null;

    const price = updatePrice();

    return {
      invoice: 'INV-' + Date.now(),
      createdAt: serverTimestamp(),
      tgl_local: new Date().toLocaleString('id-ID'),

      nama,
      wa,
      jenis_pukis: jenis,
      isi_per_box: isi,
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

  /* ================= SAVE LOCAL ================= */
  function saveOrderLocal(o) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    data.push(o);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /* ================= SAVE FIREBASE ================= */
  async function saveOrderFirebase(o) {
    try {
      await addDoc(collection(db, FIRESTORE_COLLECTION), o);
    } catch (err) {
      console.error('Firebase error:', err);
      alert('Pesanan tersimpan lokal, gagal sync ke server.');
    }
  }

  /* ================= POPUP ================= */
  let currentOrder = null;

  function showNota(o) {
    $('notaContent').innerHTML = `
      <b>PUKIS LUMER AULIA</b><br><br>
      Invoice : ${o.invoice}<br>
      Nama    : ${o.nama}<br>
      WA      : ${o.wa}<br>
      Jenis   : ${o.jenis_pukis}<br>
      Isi     : ${o.isi_per_box} pcs / box<br>
      Mode    : ${o.mode.toUpperCase()}<br><br>

      <b>Topping</b><br>${o.single.concat(o.double).join('<br>') || '-'}<br><br>
      <b>Taburan</b><br>${o.taburan.join('<br>') || '-'}<br><br>

      Jumlah  : ${o.qty} Box<br>
      Total   : ${rp(o.total)}<br><br>

      <button id="sendToAdmin">Kirim ke WhatsApp</button>
    `;

    $('notaContainer').style.display = 'flex';
    $('sendToAdmin').onclick = sendWA;
  }

  /* ================= WA ================= */
  function sendWA() {
    const o = currentOrder;
    const msg =
`PUKIS LUMER AULIA
Invoice : ${o.invoice}
Nama    : ${o.nama}
WA      : ${o.wa}

Jenis   : ${o.jenis_pukis}
Isi     : ${o.isi_per_box} pcs / box
Mode    : ${o.mode.toUpperCase()}

Jumlah  : ${o.qty} Box
Total   : Rp ${o.total.toLocaleString('id-ID')}
`;

    window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(msg));
  }

  /* ================= SUBMIT ================= */
  async function submitForm(e) {
    e.preventDefault();
    if (__LOCK_SUBMIT) return;
    __LOCK_SUBMIT = true;

    const o = buildOrder();
    if (!o) return __LOCK_SUBMIT = false;

    saveOrderLocal(o);
    await saveOrderFirebase(o);

    currentOrder = o;
    showNota(o);

    setTimeout(() => __LOCK_SUBMIT = false, 800);
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncTopping();
    updatePrice();

    $$('input,select').forEach(i => i.addEventListener('change', updatePrice));
    $$('input[name="ultraToppingMode"]').forEach(i =>
      i.addEventListener('change', syncTopping)
    );

    $('formUltra')?.addEventListener('submit', submitForm);

    window.PUKIS_PRICE = { BASE_PRICE, rp };
  });

})();
