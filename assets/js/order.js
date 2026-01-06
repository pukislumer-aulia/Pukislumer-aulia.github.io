/*
  assets/js/order.js — Final Revised (single-file)
  Fully synchronized with provided HTML
*/

(function(){
  'use strict';

  // ---------------- CONFIG ----------------
  const ADMIN_WA = '6281296668670'; // fallback admin number
  const STORAGE_ORDERS_KEY = 'pukisOrders';
  const STORAGE_LAST_ORDER_KEY = 'lastOrder';
  const ASSET_PREFIX = 'assets/images/';
  const QRIS_FILE = 'qris-pukis.jpg';
  const TTD_FILE = 'ttd.png';

  // Topping definitions (single toppings + taburan)
  const SINGLE_TOPPINGS = ['Coklat','Tiramisu','Vanilla','Stroberi','Cappucino'];
  const DOUBLE_TABURAN = ['Meses','Keju','Kacang','Choco Chip','Oreo'];

  // Price table (jenis -> isi -> mode)
  const BASE_PRICE = {
    Original: { '5': { non: 10000, single: 13000, double: 15000 }, '10': { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { '5': { non: 12000, single: 15000, double: 17000 }, '10': { non: 21000, single: 28000, double: 32000 } }
  };

  // Validation rules
  const MAX_SINGLE_TOPPING = 5;
  const MAX_DOUBLE_TOPPING = 5;
  const MAX_DOUBLE_TABURAN = 5;

  // Helper selectors
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function formatRp(n){
    const v = Number(n||0);
    if (Number.isNaN(v)) return 'Rp0';
    return 'Rp ' + v.toLocaleString('id-ID');
  }

  function escapeHtml(s){
    return String(s==null? '': s)
      .replace(/[&<>'\"]/g, m=>({
        '&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'
      }[m]));
  }

  // ---------------- BUILD TOPPING UI ----------------
  function buildToppingUI(){
    const singleWrap = $('#ultraSingleGroup');
    const doubleWrap = $('#ultraDoubleGroup');
    if (!singleWrap || !doubleWrap){
      console.warn('Topping containers missing');
      return;
    }

    singleWrap.innerHTML = '';
    doubleWrap.innerHTML = '';

    // single toppings
    SINGLE_TOPPINGS.forEach(t => {
      const id = 'topping_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label');
      lab.className = 'topping-check';
      lab.htmlFor = id;

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'topping';
      input.value = t;
      input.id = id;

      input.addEventListener('change', () => {
        lab.classList.toggle('checked', input.checked);
      });

      const span = document.createElement('span');
      span.textContent = ' ' + t;

      lab.appendChild(input);
      lab.appendChild(span);
      singleWrap.appendChild(lab);
    });

    // double taburan
    DOUBLE_TABURAN.forEach(t => {
      const id = 'taburan_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label');
      lab.className = 'taburan-check';
      lab.htmlFor = id;
      lab.style.margin = '6px';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'taburan';
      input.value = t;
      input.id = id;

      input.addEventListener('change', () => {
        lab.classList.toggle('checked', input.checked);
      });

      const span = document.createElement('span');
      span.textContent = ' ' + t;

      lab.appendChild(input);
      lab.appendChild(span);
      doubleWrap.appendChild(lab);
    });

    // delegate events (single)
    singleWrap.addEventListener('change', function(e){
      const target = e.target;
      if (!target || target.type !== 'checkbox') return;
      const label = target.closest('label');

      const mode = getSelectedToppingMode();
      const sel = $$('input[name="topping"]:checked').length;

      if (mode === 'single' && sel > MAX_SINGLE_TOPPING){
        target.checked = false;
        label && label.classList.remove('checked');
        alert(`Maksimal ${MAX_SINGLE_TOPPING} topping untuk mode Single.`);
      }

      if (mode === 'double' && sel > MAX_DOUBLE_TOPPING){
        target.checked = false;
        label && label.classList.remove('checked');
        alert(`Maksimal ${MAX_DOUBLE_TOPPING} topping untuk mode Double.`);
      }

      updatePriceUI();
    });

    // delegate events (taburan)
    doubleWrap.addEventListener('change', function(e){
      const target = e.target;
      if (!target || target.type !== 'checkbox') return;

      const mode = getSelectedToppingMode();
      if (mode !== 'double'){
        if (target.checked){
          target.checked = false;
          alert('Taburan hanya aktif pada mode Double.');
        }
      } else {
        const selTab = $$('input[name="taburan"]:checked').length;
        if (selTab > MAX_DOUBLE_TABURAN){
          target.checked = false;
          alert(`Maksimal ${MAX_DOUBLE_TABURAN} taburan untuk mode Double.`);
        }
      }
      updatePriceUI();
    });
  }

  // ---------------- FORM HELPERS ----------------
  function getSelectedRadioValue(name){
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r? r.value : null;
  }
  function getToppingValues(){
    return Array.from(document.querySelectorAll('input[name="topping"]:checked')).map(i=>i.value);
  }
  function getTaburanValues(){
    return Array.from(document.querySelectorAll('input[name="taburan"]:checked')).map(i=>i.value);
  }
  function getIsiValue(){
    const el = $('#ultraIsi');
    return el? String(el.value) : '5';
  }
  function getJumlahBox(){
    const el = $('#ultraJumlah');
    if (!el) return 1;
    const v = parseInt(el.value,10);
    return (isNaN(v)||v<1)?1:v;
  }

  // ---------------- PRICE LOGIC ----------------
  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || 'Original';
    isi = String(isi || '5');
    mode = (mode||'non').toLowerCase();
    try {
      return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0;
    } catch(e){ return 0; }
  }

  function calcDiscount(jumlahBox, subtotal){
    if (jumlahBox >= 10) return 1000;
    if (jumlahBox >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function getSelectedToppingMode(){
    return getSelectedRadioValue('ultraToppingMode') || 'non';
  }

  function updatePriceUI(){
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue();
    const mode = getSelectedToppingMode();
    const jumlah = getJumlahBox();

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    $('#ultraPricePerBox') && ($('#ultraPricePerBox').textContent = formatRp(pricePerBox));
    $('#ultraSubtotal') && ($('#ultraSubtotal').textContent = formatRp(subtotal));
    $('#ultraDiscount') && ($('#ultraDiscount').textContent = discount>0 ? '-' + formatRp(discount) : '-');
    $('#ultraGrandTotal') && ($('#ultraGrandTotal').textContent = formatRp(total));

    return { pricePerBox, subtotal, discount, total };
  }

  // ---------------- BUILD ORDER ----------------
  function buildOrderObject(){
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue();
    const mode = getSelectedToppingMode();
    const jumlahBox = getJumlahBox();
    const topping = getToppingValues();
    const taburan = getTaburanValues();

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlahBox;
    const discount = calcDiscount(jumlahBox, subtotal);
    const total = subtotal - discount;

    const namaEl = $('#ultraNama');
    const waEl = $('#ultraWA');
    const noteEl = $('#ultraNote');

    const nama = namaEl ? namaEl.value.trim() : '';
    const waRaw = waEl ? waEl.value.trim() : '';
    const note = noteEl ? noteEl.value.trim() : '';

    if (!nama){ alert('Nama pemesan harus diisi.'); namaEl && namaEl.focus(); return null; }
    if (!waRaw){ alert('Nomor WA harus diisi.'); waEl && waEl.focus(); return null; }

    const digits = waRaw.replace(/\D/g,'');
    if (digits.length < 9){
      alert('Nomor WA tidak valid.');
      waEl && waEl.focus();
      return null;
    }

    let wa = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (/^8\d+/.test(wa)) wa = '62' + wa;

    const invoice = 'INV-' + Date.now();

    return {
      invoice, nama, wa, jenis, isi, mode, topping, taburan,
      jumlah: jumlahBox,
      pricePerBox, subtotal, discount, total,
      note,
      tgl: new Date().toLocaleString('id-ID'),
      status: 'Pending'
    };
  }

  // ---------------- STORAGE ----------------
  function saveOrderLocal(order){
    if (!order) return;
    const arr = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
    arr.push(order);
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(arr));
    localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order));
  }

  function getLastOrder(){
    try { return JSON.parse(localStorage.getItem(STORAGE_LAST_ORDER_KEY) || 'null'); }
    catch(e){ return null; }
  }

  /* ===============================
     GLOBAL STATE ORDER
  ================================ */
  let currentOrder = null;

  /* ===============================
     RENDER NOTA
  ================================ */
  function renderNotaOnScreen(order){
    if (!order) return;
    const c = $('#notaContent');
    if (!c) return;

    c.innerHTML = `
      <strong>Invoice:</strong> ${escapeHtml(order.invoice)}<br>
      <strong>Nama:</strong> ${escapeHtml(order.nama)}<br>
      <strong>WA:</strong> ${escapeHtml(order.wa)}<br>
      <strong>Total:</strong> ${formatRp(order.total)}
    `;

    const container = $('#notaContainer');
    if (container){
      container.style.display = 'flex';
      container.classList.add('show');
    }
  }

  /* ===============================
     SEND TO ADMIN VIA WA
  ================================ */
  function sendOrderToAdminViaWA(order){
    if (!order) return;

    const text = `Invoice: ${order.invoice}\nNama: ${order.nama}\nTotal: ${formatRp(order.total)}`;
    const admin = ADMIN_WA;

    window.open(`https://wa.me/${admin}?text=${encodeURIComponent(text)}`, '_blank');
  }

  /* ===============================
     EVENTS
  ================================ */
  function onToppingModeChange(){
    updatePriceUI();
  }

  function onFormSubmit(e){
    e.preventDefault();
    const order = buildOrderObject();
    if (!order) return;
    currentOrder = order;
    renderNotaOnScreen(order);
  }

  async function onSendAdminClick(e){
    e.preventDefault();
    if (!currentOrder) return;
    saveOrderLocal(currentOrder);
    sendOrderToAdminViaWA(currentOrder);
    alert('Pesanan terkirim.');
    hideNota();
    $('#formUltra') && $('#formUltra').reset();
    currentOrder = null;
  }

  function onNotaPrint(e){
    e.preventDefault();
    if (window.generatePdf && currentOrder){
      window.generatePdf(currentOrder,false);
    }
  }

  function hideNota(){
    const nc = $('#notaContainer');
    if (nc){
      nc.classList.remove('show');
      nc.style.display = 'none';
    }
  }

  /* ===============================
     INIT (WAJIB)
  ================================ */
  document.addEventListener('DOMContentLoaded', function () {

    buildToppingUI();

    $$('input[name="ultraToppingMode"]').forEach(r =>
      r.addEventListener('change', onToppingModeChange)
    );

    $$('input[name="ultraJenis"]').forEach(r =>
      r.addEventListener('change', updatePriceUI)
    );

    $('#ultraIsi') && $('#ultraIsi').addEventListener('change', updatePriceUI);
    $('#ultraJumlah') && $('#ultraJumlah').addEventListener('input', updatePriceUI);

    $('#formUltra') && $('#formUltra').addEventListener('submit', onFormSubmit);
    $('#notaClose') && $('#notaClose').addEventListener('click', hideNota);
    $('#notaPrint') && $('#notaPrint').addEventListener('click', onNotaPrint);
    $('#sendToAdmin') && $('#sendToAdmin').addEventListener('click', onSendAdminClick);

    updatePriceUI();
  });

})(); // ⬅️ PENUTUP IIFE (WAJIB)
