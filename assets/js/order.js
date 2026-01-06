/*
  assets/js/order.js — Final Revised (single-file)
  Fully synchronized with provided HTML
*/

(function(){
  'use strict';

  // ---------------- CONFIG ----------------
  const ADMIN_WA = '6281296668670';
  const STORAGE_ORDERS_KEY = 'pukisOrders';
  const STORAGE_LAST_ORDER_KEY = 'lastOrder';

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

  const MAX_SINGLE_TOPPING = 5;
  const MAX_DOUBLE_TOPPING = 5;
  const MAX_DOUBLE_TABURAN = 5;

  // ---------------- HELPERS ----------------
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function formatRp(n){
    const v = Number(n||0);
    return 'Rp ' + v.toLocaleString('id-ID');
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  // ---------------- BUILD TOPPING UI ----------------
  // ❗ DISENGAJA DIKOSONGKAN
  // ❗ HTML SUDAH FINAL — JS TIDAK BOLEH MENGHAPUS / MEMBUAT CHECKBOX
  function buildToppingUI(){
    return;
  }

  // ---------------- FORM READERS ----------------
  function getRadio(name){
    const r = $(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }

  function getIsi(){
    return $('#ultraIsi')?.value || '5';
  }

  function getJumlah(){
    const v = parseInt($('#ultraJumlah')?.value || '1',10);
    return isNaN(v) || v < 1 ? 1 : v;
  }

  function getSingleToppings(){
    return $$('input[name="toppingSingle"]:checked').map(i=>i.value);
  }

  function getDoubleToppings(){
    return $$('input[name="toppingDouble"]:checked').map(i=>i.value);
  }

  function getTaburan(){
    return $$('input[name="taburan"]:checked').map(i=>i.value);
  }

  // ---------------- PRICE ----------------
  function getPricePerBox(jenis, isi, mode){
    return BASE_PRICE[jenis]?.[isi]?.[mode] || 0;
  }

  function calcDiscount(jumlah, subtotal){
    if (jumlah >= 10) return 1000;
    if (jumlah >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePriceUI(){
    const jenis  = getRadio('ultraJenis') || 'Original';
    const isi    = getIsi();
    const mode   = getRadio('ultraToppingMode') || 'non';
    const jumlah = getJumlah();

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    $('#ultraPricePerBox') && ($('#ultraPricePerBox').textContent = formatRp(pricePerBox));
    $('#ultraSubtotal') && ($('#ultraSubtotal').textContent = formatRp(subtotal));
    $('#ultraDiscount') && ($('#ultraDiscount').textContent = discount ? '-' + formatRp(discount) : '-');
    $('#ultraGrandTotal') && ($('#ultraGrandTotal').textContent = formatRp(total));

    return { pricePerBox, subtotal, discount, total };
  }

  // ---------------- ORDER BUILD ----------------
  function buildOrderObject(){
    const nama = $('#ultraNama')?.value.trim();
    const waRaw = $('#ultraWA')?.value.trim();

    if (!nama){ alert('Nama wajib diisi'); return null; }
    if (!waRaw){ alert('WA wajib diisi'); return null; }

    let wa = waRaw.replace(/\D/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (wa.startsWith('8')) wa = '62' + wa;

    const jenis = getRadio('ultraJenis') || 'Original';
    const isi = getIsi();
    const mode = getRadio('ultraToppingMode') || 'non';
    const jumlah = getJumlah();

    const single = getSingleToppings();
    const double = getDoubleToppings();
    const taburan = getTaburan();

    if (mode === 'single' && single.length > MAX_SINGLE_TOPPING){
      alert('Topping single melebihi batas');
      return null;
    }

    if (mode === 'double' && double.length > MAX_DOUBLE_TOPPING){
      alert('Topping double melebihi batas');
      return null;
    }

    if (mode === 'double' && taburan.length > MAX_DOUBLE_TABURAN){
      alert('Taburan melebihi batas');
      return null;
    }

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    return {
      invoice: 'INV-' + Date.now(),
      nama, wa,
      jenis, isi, mode,
      toppingSingle: single,
      toppingDouble: double,
      taburan,
      jumlah,
      pricePerBox, subtotal, discount, total,
      tgl: new Date().toLocaleString('id-ID'),
      status: 'Pending'
    };
  }

  // ---------------- STORAGE ----------------
  function saveOrder(order){
    const arr = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY)||'[]');
    arr.push(order);
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(arr));
    localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order));
  }

  // ---------------- NOTA ----------------
  let currentOrder = null;

  function renderNota(order){
    const c = $('#notaContent');
    if (!c) return;

    c.innerHTML = `
      <b>Invoice:</b> ${escapeHtml(order.invoice)}<br>
      <b>Nama:</b> ${escapeHtml(order.nama)}<br>
      <b>Total:</b> ${formatRp(order.total)}
    `;

    $('#notaContainer').style.display = 'flex';
    $('#notaContainer').classList.add('show');
  }

  function hideNota(){
    const n = $('#notaContainer');
    if (!n) return;
    n.classList.remove('show');
    n.style.display = 'none';
  }

  // ---------------- EVENTS ----------------
  function onSubmit(e){
    e.preventDefault();
    const o = buildOrderObject();
    if (!o) return;
    currentOrder = o;
    renderNota(o);
  }

  function sendToAdmin(){
    if (!currentOrder) return;
    saveOrder(currentOrder);

    const msg = `Invoice: ${currentOrder.invoice}\nNama: ${currentOrder.nama}\nTotal: ${formatRp(currentOrder.total)}`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`,'_blank');

    hideNota();
    $('#formUltra').reset();
    currentOrder = null;
  }

  // ---------------- INIT ----------------
  document.addEventListener('DOMContentLoaded', function(){


    $$('input[name="ultraJenis"]').forEach(r=>r.addEventListener('change',updatePriceUI));
    $$('input[name="ultraToppingMode"]').forEach(r=>r.addEventListener('change',updatePriceUI));

    $$('input[name="toppingSingle"]').forEach(c=>c.addEventListener('change',updatePriceUI));
    $$('input[name="toppingDouble"]').forEach(c=>c.addEventListener('change',updatePriceUI));
    $$('input[name="taburan"]').forEach(c=>c.addEventListener('change',updatePriceUI));

    $('#ultraIsi')?.addEventListener('change',updatePriceUI);
    $('#ultraJumlah')?.addEventListener('input',updatePriceUI);

    $('#formUltra')?.addEventListener('submit',onSubmit);
    $('#sendToAdmin')?.addEventListener('click',sendToAdmin);
    $('#notaClose')?.addEventListener('click',hideNota);

    updatePriceUI();
  });

})();
