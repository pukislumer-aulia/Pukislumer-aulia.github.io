// assets/js/order.js
(function () {
  'use strict';

  /* ================= CONFIG ================= */
  const ADMIN_WA = '6281296668670';
  const STORAGE_KEY = 'pukis_orders';

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

  /* ================= SELECTORS ================= */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const elNama = $('#ultraNama');
  const elWA = $('#ultraWA');
  const elJumlah = $('#ultraJumlah');
  const elNote = $('#ultraNote');
  const elIsi = $('#ultraIsi');

  const singleGroup = $('#ultraSingleGroup');
  const doubleGroup = $('#ultraDoubleGroup');

  const elPriceBox = $('#ultraPricePerBox');
  const elSubtotal = $('#ultraSubtotal');
  const elDiscount = $('#ultraDiscount');
  const elTotal = $('#ultraGrandTotal');

  const btnCek = $('#ultraSubmit');
  const notaContainer = $('#notaContainer');
  const notaContent = $('#notaContent');
  const notaClose = $('#notaClose');
  const notaConfirm = $('#notaConfirm');

  if (!elNama || !elWA || !elJumlah || !btnCek) {
    console.error('order.js: Elemen penting tidak ditemukan');
    return;
  }

  /* ================= HELPERS ================= */
  function rp(n) {
    return 'Rp' + Number(n || 0).toLocaleString('id-ID');
  }

  function radioVal(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  }

  function checkedValues(name) {
    return $$(`input[name="${name}"]:checked`).map(e => e.value);
  }

  function hideAllToppings() {
    singleGroup.classList.add('hidden');
    doubleGroup.classList.add('hidden');
    $$('input[name="toppingSingle"],input[name="toppingDouble"],input[name="taburan"]')
      .forEach(i => i.checked = false);
  }

  /* ================= TOPPING MODE ================= */
  function updateToppingVisibility() {
    hideAllToppings();
    const mode = radioVal('ultraToppingMode');
    if (mode === 'single') singleGroup.classList.remove('hidden');
    if (mode === 'double') doubleGroup.classList.remove('hidden');
    updatePrice();
  }

  /* ================= PRICE ================= */
  function pricePerBox() {
    const jenis = radioVal('ultraJenis') || 'Original';
    const isi = elIsi.value || '5';
    const mode = radioVal('ultraToppingMode') || 'non';
    return BASE_PRICE[jenis]?.[isi]?.[mode] || 0;
  }

  function discount(jumlah, subtotal) {
    if (jumlah >= 10) return 1000;
    if (jumlah >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePrice() {
    const qty = Number(elJumlah.value || 1);
    const pBox = pricePerBox();
    const sub = pBox * qty;
    const disc = discount(qty, sub);
    const total = sub - disc;

    elPriceBox.textContent = rp(pBox);
    elSubtotal.textContent = rp(sub);
    elDiscount.textContent = disc ? '-' + rp(disc) : '-';
    elTotal.textContent = rp(total);
  }

  /* ================= VALIDATION ================= */
  function validate() {
    if (!elNama.value.trim()) return alert('Nama wajib diisi'), false;
    if (!elWA.value.trim()) return alert('No WA wajib diisi'), false;
    if (Number(elJumlah.value) < 1) return alert('Jumlah minimal 1'), false;

    const mode = radioVal('ultraToppingMode');
    if (mode === 'single' && !checkedValues('toppingSingle').length)
      return alert('Pilih topping single'), false;

    if (mode === 'double' && !checkedValues('toppingDouble').length)
      return alert('Pilih topping double'), false;

    return true;
  }

  /* ================= ORDER OBJECT ================= */
  function buildOrder() {
    if (!validate()) return null;

    const qty = Number(elJumlah.value);
    const pBox = pricePerBox();
    const sub = pBox * qty;
    const disc = discount(qty, sub);

    return {
      invoice: 'INV-' + Date.now(),
      nama: elNama.value.trim(),
      wa: elWA.value.trim().replace(/^0/, '62'),
      jenis: radioVal('ultraJenis'),
      isi: elIsi.value,
      mode: radioVal('ultraToppingMode'),
      toppingSingle: checkedValues('toppingSingle'),
      toppingDouble: checkedValues('toppingDouble'),
      taburan: checkedValues('taburan'),
      note: elNote.value.trim(),
      pricePerBox: pBox,
      subtotal: sub,
      discount: disc,
      total: sub - disc,
      time: new Date().toISOString()
    };
  }

  /* ================= NOTA ================= */
  function renderNota(o) {
    return `
      <strong>Nama:</strong> ${o.nama}<br>
      <strong>WA:</strong> ${o.wa}<br>
      <strong>Jenis:</strong> ${o.jenis}<br>
      <strong>Isi:</strong> ${o.isi}<br>
      <strong>Jumlah:</strong> ${elJumlah.value} box<br>
      <hr>
      <strong>Mode:</strong> ${o.mode}<br>
      <strong>Topping:</strong> ${[...o.toppingSingle, ...o.toppingDouble].join(', ') || '-'}<br>
      <strong>Taburan:</strong> ${o.taburan.join(', ') || '-'}<br>
      <hr>
      <strong>Total:</strong> ${rp(o.total)}
    `;
  }

  function showNota(html) {
    notaContent.innerHTML = html;
    notaContainer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function hideNota() {
    notaContainer.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ================= EVENTS ================= */
  btnCek.addEventListener('click', e => {
    e.preventDefault();
    const order = buildOrder();
    if (!order) return;
    showNota(renderNota(order));
  });

  if (notaClose) notaClose.addEventListener('click', hideNota);
  if (notaContainer) notaContainer.addEventListener('click', e => {
    if (e.target === notaContainer) hideNota();
  });

  if (notaConfirm) notaConfirm.addEventListener('click', () => {
    const order = buildOrder();
    if (!order) return;

    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    list.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    const msg = encodeURIComponent(`Invoice ${order.invoice}\nTotal ${rp(order.total)}`);
    window.open(`https://wa.me/${ADMIN_WA}?text=${msg}`, '_blank');

    hideNota();
    $('#formUltra').reset();
    hideAllToppings();
    updatePrice();
  });

  /* ================= BINDINGS ================= */
  $$('input[name="ultraToppingMode"]').forEach(i => i.addEventListener('change', updateToppingVisibility));
  $$('input[name="ultraJenis"]').forEach(i => i.addEventListener('change', updatePrice));
  $$('input[name="toppingSingle"],input[name="toppingDouble"],input[name="taburan"]').forEach(i => i.addEventListener('change', updatePrice));
  elIsi.addEventListener('change', updatePrice);
  elJumlah.addEventListener('input', updatePrice);

  /* ================= INIT ================= */
  hideAllToppings();
  updatePrice();

})();
