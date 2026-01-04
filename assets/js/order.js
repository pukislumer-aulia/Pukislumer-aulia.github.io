// assets/js/order.js
// ORDER.JS — FINAL CLEAN & STABLE VERSION
// - 1 tombol CEK PESANAN
// - Harga otomatis (BASE_PRICE TIDAK DIUBAH)
// - Topping single & double valid
// - Nota popup + simpan localStorage
// - Kirim WA admin otomatis

(function () {
  'use strict';

  /* ================= CONFIG ================= */
  const ADMIN_WA = '6281296668670';
  const STORAGE_KEY = 'pukis_orders';

  const SINGLE_TOPPINGS = ['Coklat', 'Tiramisu', 'Vanilla', 'Stroberi', 'Cappucino'];
  const DOUBLE_TOPPINGS = ['Meses', 'Keju', 'Kacang', 'Choco Chip', 'Oreo'];

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
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  const radioVal = name =>
    (document.querySelector(`input[name="${name}"]:checked`) || {}).value || '';

  const checkedVals = name =>
    $$(`input[name="${name}"]:checked`).map(i => i.value);

  const invoiceGen = () =>
    'INV-' + Date.now().toString(36).toUpperCase();

  /* ================= ELEMENT ================= */
  const el = {
    nama: $('#ultraNama'),
    wa: $('#ultraWA'),
    jumlah: $('#ultraJumlah'),
    note: $('#ultraNote'),
    isi: $('#ultraIsi'),
    singleWrap: $('#ultraSingleGroup'),
    doubleWrap: $('#ultraDoubleGroup'),
    btn: $('#ultraSubmit'),
    priceBox: $('#ultraPricePerBox'),
    subtotal: $('#ultraSubtotal'),
    discount: $('#ultraDiscount'),
    total: $('#ultraGrandTotal'),
    notaWrap: $('#notaContainer'),
    notaBody: $('#notaContent'),
    notaClose: $('#notaClose'),
    notaConfirm: $('#notaConfirm')
  };

  /* ================= TOPPING UI ================= */
  function buildToppings() {
    el.singleWrap.innerHTML = '';
    SINGLE_TOPPINGS.forEach(t => {
      el.singleWrap.innerHTML += `
        <label class="topping-check">
          <input type="radio" name="singleTopping" value="${t}"> ${t}
        </label>`;
    });

    el.doubleWrap.innerHTML = '<div class="double-cols"></div>';
    const col = el.doubleWrap.querySelector('.double-cols');

    DOUBLE_TOPPINGS.forEach(t => {
      col.innerHTML += `
        <label class="topping-check">
          <input type="checkbox" name="doubleTopping" value="${t}"> ${t}
        </label>`;
    });
  }

  function toggleTopping() {
    const mode = radioVal('ultraToppingMode');
    el.singleWrap.classList.toggle('hidden', mode !== 'single');
    el.doubleWrap.classList.toggle('hidden', mode !== 'double');
  }

  /* ================= PRICE ================= */
  function pricePerBox() {
    const jenis = radioVal('ultraJenis');
    const isi = el.isi.value;
    const mode = radioVal('ultraToppingMode') || 'non';
    return BASE_PRICE[jenis]?.[isi]?.[mode] || 0;
  }

  function calc() {
    const qty = Number(el.jumlah.value || 1);
    const price = pricePerBox();
    const sub = qty * price;
    const disc = qty >= 10 ? 1000 : qty >= 5 ? Math.round(sub * 0.01) : 0;
    const tot = sub - disc;

    el.priceBox.textContent = rp(price);
    el.subtotal.textContent = rp(sub);
    el.discount.textContent = disc ? '-' + rp(disc) : '-';
    el.total.textContent = rp(tot);

    return { qty, price, sub, disc, tot };
  }

  /* ================= ORDER ================= */
  function buildOrder() {
    const mode = radioVal('ultraToppingMode');
    if (mode === 'single' && !radioVal('singleTopping')) {
      alert('Pilih topping single'); return null;
    }
    if (mode === 'double' && checkedVals('doubleTopping').length < 2) {
      alert('Minimal 2 topping double'); return null;
    }

    const p = calc();
    return {
      invoice: invoiceGen(),
      nama: el.nama.value.trim(),
      wa: el.wa.value.trim().replace(/^0/, '62'),
      jenis: radioVal('ultraJenis'),
      isi: el.isi.value,
      jumlah: p.qty,
      mode,
      single: radioVal('singleTopping'),
      double: checkedVals('doubleTopping'),
      note: el.note.value.trim(),
      total: p.tot,
      created: new Date().toISOString()
    };
  }

  /* ================= NOTA ================= */
  function showNota(o) {
    el.notaBody.innerHTML = `
      <div><b>Invoice:</b> ${o.invoice}</div>
      <div><b>Nama:</b> ${o.nama}</div>
      <div><b>Jenis:</b> ${o.jenis}</div>
      <div><b>Isi:</b> ${o.isi} pcs</div>
      <div><b>Jumlah:</b> ${o.jumlah} box</div>
      <div><b>Total:</b> ${rp(o.total)}</div>`;
    el.notaWrap.style.display = 'flex';
  }

  function save(o) {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr.unshift(o);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function sendWA(o) {
    const msg = encodeURIComponent(
      `INVOICE ${o.invoice}\nNama: ${o.nama}\nTotal: ${rp(o.total)}`
    );
    window.open(`https://wa.me/${ADMIN_WA}?text=${msg}`, '_blank');
  }

  /* ================= EVENTS ================= */
  el.btn.onclick = e => {
    e.preventDefault();
    const o = buildOrder();
    if (o) showNota(o);
  };

  el.notaConfirm.onclick = () => {
    const o = buildOrder();
    if (!o) return;
    save(o);
    sendWA(o);
    el.notaWrap.style.display = 'none';
    alert('Pesanan dikirim ke admin');
    $('#formUltra').reset();
    calc();
  };

  el.notaClose.onclick = () => el.notaWrap.style.display = 'none';

  $$('input,select').forEach(i =>
    i.addEventListener('change', () => {
      toggleTopping();
      calc();
    })
  );

  /* ================= INIT ================= */
  buildToppings();
  toggleTopping();
  calc();

})();
