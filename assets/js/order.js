// assets/js/order.js
// ORDER.JS — Final Clean Version (matched with index.html / style.css / script.js)
// - Hanya 1 tombol CEK PESANAN (id="ultraSubmit")
// - Logika harga TIDAK DIUBAH (BASE_PRICE digunakan seperti versi awal)
// - Topping/taburan logic utuh
// - Nota popup & simpan ke localStorage (key: pukis_orders)
// - WA admin otomatis (6281296668670)

(function () {
  'use strict';

  // ----------------------------
  // Konfigurasi (aman untuk diubah nanti)
  // ----------------------------
  const ADMIN_WA = '6281296668670'; // nomor admin (sesuai permintaan)
  const STORAGE_KEY = 'pukis_orders';

  const SINGLE_TOPPINGS = ['Coklat', 'Tiramisu', 'Vanilla', 'Stroberi', 'Cappucino'];
  const DOUBLE_TABURAN = ['Meses', 'Keju', 'Kacang', 'Choco Chip', 'Oreo'];

  // harga (logika asli dipertahankan via BASE_PRICE)
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

  // ----------------------------
  // Element references (sesuai index.html final)
  // ----------------------------
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const elNama = $('#ultraNama');
  const elWA = $('#ultraWA');
  const elJumlah = $('#ultraJumlah');
  const elNote = $('#ultraNote');
  const btnCek = $('#ultraSubmit');

  const elSingleGroup = $('#ultraSingleGroup'); // tempat checkbox single
  const elDoubleGroup = $('#ultraDoubleGroup'); // tempat checkbox double + taburan

  const elPricePerBox = $('#ultraPricePerBox');
  const elSubtotal = $('#ultraSubtotal');
  const elDiscount = $('#ultraDiscount');
  const elGrandTotal = $('#ultraGrandTotal');

  const notaContainer = $('#notaContainer'); // overlay nota (display:flex when shown)
  const notaContent = $('#notaContent');
  const notaClose = $('#notaClose'); // close button in nota
  const notaConfirm = $('#notaConfirm'); // "Buat Pesanan" button inside nota

  // Defensive checks
  if (!elNama || !elWA || !elJumlah || !btnCek || !elPricePerBox) {
    console.error('order.js: Required DOM elements not found. Make sure index.html matches expected IDs.');
    return;
  }

  // ----------------------------
  // Helpers
  // ----------------------------
  function formatRp(n) {
    if (n == null) return 'Rp0';
    return 'Rp ' + Number(n).toLocaleString('id-ID');
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function genInvoice() {
    const d = new Date();
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `INV-${y}${mm}${dd}-${rand}`;
  }

  function getRadioValue(name) {
    const sel = document.querySelector(`input[name="${name}"]:checked`);
    return sel ? sel.value : '';
  }

  function getSelectedCheckboxValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);
  }

  // ----------------------------
  // Build dynamic topping UI (checkboxes)
  // ----------------------------
  function buildToppingsUI() {
    if (elSingleGroup) {
      elSingleGroup.innerHTML = '';
      SINGLE_TOPPINGS.forEach(t => {
        const id = 'single_' + t.toLowerCase().replace(/\s+/g, '_');
        const label = document.createElement('label');
        label.className = 'topping-check single';
        label.htmlFor = id;
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'topping'; // single radio group name 'topping'
        input.value = t;
        input.id = id;
        label.appendChild(input);
        const span = document.createElement('span');
        span.textContent = ' ' + t;
        label.appendChild(span);
        elSingleGroup.appendChild(label);
      });
    }

    if (elDoubleGroup) {
      elDoubleGroup.innerHTML = '';
      // Double toppings as two select-like radio groups (so user picks two different toppings)
      const wrapper = document.createElement('div');
      wrapper.className = 'double-toppings';

      const left = document.createElement('div');
      left.className = 'double-left';
      DOUBLE_TABURAN.forEach(t => {
        const id = 'dbl1_' + t.toLowerCase().replace(/\s+/g, '_');
        const label = document.createElement('label');
        label.className = 'topping-check double';
        label.htmlFor = id;
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'topping_double_1';
        input.value = t;
        input.id = id;
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + t));
        left.appendChild(label);
      });

      const right = document.createElement('div');
      right.className = 'double-right';
      DOUBLE_TABURAN.forEach(t => {
        const id = 'dbl2_' + t.toLowerCase().replace(/\s+/g, '_');
        const label = document.createElement('label');
        label.className = 'topping-check double';
        label.htmlFor = id;
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'topping_double_2';
        input.value = t;
        input.id = id;
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + t));
        right.appendChild(label);
      });

      // Taburan (checkboxes) separate area
      const taburanWrap = document.createElement('div');
      taburanWrap.className = 'taburan-wrapper';
      taburanWrap.style.marginTop = '8px';
      const tabTitle = document.createElement('div');
      tabTitle.style.color = '#fff';
      tabTitle.style.margin = '6px 0';
      tabTitle.textContent = 'Pilih Taburan';
      taburanWrap.appendChild(tabTitle);

      DOUBLE_TABURAN.forEach(t => {
        const id = 'tab_' + t.toLowerCase().replace(/\s+/g, '_');
        const label = document.createElement('label');
        label.className = 'taburan-check';
        label.htmlFor = id;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'taburan'; 
        input.value = t;
        input.id = id;
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + t));
        taburanWrap.appendChild(label);
      });

      wrapper.appendChild(left);
      wrapper.appendChild(right);
      elDoubleGroup.appendChild(wrapper);
      elDoubleGroup.appendChild(taburanWrap);
    }
  }

// ==========================
// SHOW / HIDE TOPPING
// ==========================
document.querySelectorAll("input[name='modeTopping']").forEach(el => {
    el.addEventListener("change", updateToppingVisibility);
});

function updateToppingVisibility() {
    const mode = document.querySelector("input[name='modeTopping']:checked").value;

    const wrap = document.getElementById("toppingWrapper");
    const single = document.getElementById("toppingSingle");
    const double = document.getElementById("toppingDouble");

    // Reset
    wrap.classList.add("hidden");
    single.classList.add("hidden");
    double.classList.add("hidden");

    // Mode NON
    if (mode === "non") {
        return;
    }

    // Mode SINGLE
    if (mode === "single") {
        wrap.classList.remove("hidden");
        single.classList.remove("hidden");
    }

    // Mode DOUBLE
    if (mode === "double") {
        wrap.classList.remove("hidden");
        double.classList.remove("hidden");
    }
}
   // ----------------------------
  // Perhitungan harga per box (menggunakan BASE_PRICE — tidak mengubah rumus)
  // ----------------------------
  function getPricePerBox() {
    const jenisRaw = getRadioValue('ultraJenis') || '';
    const jenis = String(jenisRaw).toLowerCase();
    const jenisKey = (jenis === 'original') ? 'Original' : (jenis === 'pandan' ? 'Pandan' : null);

    const isiVal = ($('#ultraIsi') ? $('#ultraIsi').value : '') || '5';
    const modeRaw = getRadioValue('ultraToppingMode') || 'non';
    const mode = (modeRaw === 'single') ? 'single' : (modeRaw === 'double' ? 'double' : 'non');

    if (!jenisKey || !BASE_PRICE[jenisKey] || !BASE_PRICE[jenisKey][String(isiVal)]) {
      return 0;
    }

    const priceObj = BASE_PRICE[jenisKey][String(isiVal)];
    const price = priceObj[mode] || priceObj['non'] || 0;
    return price;
  }

  function calcDiscount(jumlah, subtotal) {
    if (jumlah >= 10) return 1000;
    if (jumlah >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  // ----------------------------
  // Update UI Price Summary (realtime)
  // ----------------------------
  function updatePriceUI() {
    const pricePerBox = getPricePerBox();
    const jumlah = Number(elJumlah.value || 1);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    if (elPricePerBox) elPricePerBox.textContent = formatRp(pricePerBox);
    if (elSubtotal) elSubtotal.textContent = formatRp(subtotal);
    if (elDiscount) elDiscount.textContent = discount ? '-' + formatRp(discount) : '-';
    if (elGrandTotal) elGrandTotal.textContent = formatRp(total);

    return { pricePerBox, subtotal, discount, total };
  }

  // ----------------------------
  // Validation
  // ----------------------------
  function validateOrder() {
    if (!elNama || !elWA || !elJumlah) return false;

    if (elNama.value.trim() === '') {
      alert('Nama harus diisi');
      elNama.focus();
      return false;
    }

    if (elWA.value.trim() === '') {
      alert('Nomor WA harus diisi');
      elWA.focus();
      return false;
    }

    const jumlah = Number(elJumlah.value || 0);
    if (isNaN(jumlah) || jumlah < 1) {
      alert('Jumlah box minimal 1');
      elJumlah.focus();
      return false;
    }

    const jenis = getRadioValue('ultraJenis');
    if (!jenis) { alert('Pilih jenis pukis'); return false; }

    const isi = $('#ultraIsi') ? $('#ultraIsi').value : '';
    if (!isi) { alert('Pilih isi per box'); return false; }

    const mode = getRadioValue('ultraToppingMode');
    if (!mode) { alert('Pilih mode topping'); return false; }

    if (mode === 'single') {
      const s = getRadioValue('topping');
      if (!s) { alert('Pilih topping single'); return false; }
    }

    if (mode === 'double') {
      const t1 = getRadioValue('topping_double_1');
      const t2 = getRadioValue('topping_double_2');
      if (!t1 || !t2) { alert('Pilih 2 topping untuk double'); return false; }
      if (t1 === t2) { alert('Pilih dua topping yang berbeda'); return false; }
    }

    return true;
  }

  // ----------------------------
  // Build order object
  // ----------------------------
  function buildOrderObject() {
    if (!validateOrder()) return null;

    const namaVal = elNama.value.trim();
    const waVal = elWA.value.trim().replace(/\+/g, '').replace(/\s+/g, '');
    const jumlah = Number(elJumlah.value || 1);
    const note = elNote ? elNote.value.trim() : '';

    const jenis = getRadioValue('ultraJenis') || 'Original';
    const isi = $('#ultraIsi') ? $('#ultraIsi').value : '5';
    const mode = getRadioValue('ultraToppingMode') || 'non';

    let singleChosen = [];
    let doubleChosen = [];
    if (mode === 'single') {
      const s = getRadioValue('topping');
      if (s) singleChosen = [s];
    } else if (mode === 'double') {
      const t1 = getRadioValue('topping_double_1');
      const t2 = getRadioValue('topping_double_2');
      if (t1) doubleChosen.push(t1);
      if (t2) doubleChosen.push(t2);
    }

    const taburan = getSelectedCheckboxValues('taburan');

    const pricePerBox = getPricePerBox();
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    const invoice = genInvoice();

    return {
      invoice,
      nama: namaVal,
      wa: waVal.startsWith('62') ? waVal : (waVal.startsWith('0') ? '62' + waVal.slice(1) : waVal),
      jenis,
      isi,
      jumlah,
      mode,
      single: singleChosen,
      double: doubleChosen,
      taburan,
      note,
      pricePerBox,
      subtotal,
      discount,
      total,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }

  // ----------------------------
  // Render nota
  // ----------------------------
  function renderNota(order) {
    if (!order) return '<div>Error membuat nota.</div>';
    const lines = [];

    lines.push(`<div><strong>Invoice:</strong> ${escapeHtml(order.invoice)}</div>`);
    lines.push(`<div><strong>Nama:</strong> ${escapeHtml(order.nama)}</div>`);
    lines.push(`<div><strong>WA:</strong> ${escapeHtml(order.wa)}</div>`);
    lines.push(`<div><strong>Jenis:</strong> ${escapeHtml(order.jenis)}</div>`);
    lines.push(`<div><strong>Isi per box:</strong> ${escapeHtml(order.isi)}</div>`);
    lines.push(`<div><strong>Jumlah Box:</strong> ${order.jumlah} box</div>`);
    lines.push('<hr>');
    if (order.mode === 'single') {
      lines.push(`<div><strong>Topping:</strong> ${escapeHtml(order.single[0] || '-')}</div>`);
    } else if (order.mode === 'double') {
      lines.push(`<div><strong>Topping Double:</strong> ${escapeHtml(order.double.join(' + ') || '-')}</div>`);
    } else {
      lines.push(`<div><strong>Topping:</strong> Non</div>`);
    }
    lines.push(`<div><strong>Taburan:</strong> ${escapeHtml(order.taburan.join(', ') || '-')}</div>`);
    lines.push('<hr>');
    lines.push(`<div><strong>Harga / Box:</strong> ${formatRp(order.pricePerBox)}</div>`);
    lines.push(`<div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>`);
    lines.push(`<div><strong>Diskon:</strong> ${order.discount ? formatRp(order.discount) : '-'}</div>`);
    lines.push(`<div style="font-weight:800;margin-top:6px;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</div>`);
    if (order.note) lines.push(`<hr><div><strong>Catatan:</strong> ${escapeHtml(order.note)}</div>`);

    return lines.join('');
  }

  // ----------------------------
  // LocalStorage
  // ----------------------------
  function saveOrderLocal(order) {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      arr.unshift(order);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      return true;
    } catch (err) {
      console.error('Gagal menyimpan order ke localStorage', err);
      return false;
    }
  }

  // ----------------------------
  // WA Admin
  // ----------------------------
  function openWaAdmin(order) {
    const lines = [];
    lines.push(`INVOICE: ${order.invoice}`);
    lines.push(`Nama: ${order.nama}`);
    lines.push(`WA: ${order.wa}`);
    lines.push(`Jenis: ${order.jenis}`);
    lines.push(`Isi per box: ${order.isi}`);
    lines.push(`Jumlah box: ${order.jumlah}`);
    if (order.mode === 'single') lines.push(`Single: ${order.single.join(', ')}`);
    if (order.mode === 'double') lines.push(`Double: ${order.double.join(' + ')}`);
    if (order.taburan.length) lines.push(`Taburan: ${order.taburan.join(', ')}`);
    if (order.note) lines.push(`Catatan: ${order.note}`);
    lines.push(`Subtotal: ${formatRp(order.subtotal)}`);
    lines.push(`Diskon: ${order.discount ? formatRp(order.discount) : '-'}`);
    lines.push(`TOTAL: ${formatRp(order.total)}`);
    lines.push('');
    lines.push('Mohon validasi nomor invoice dan total. Terima kasih.');

    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${ADMIN_WA}?text=${text}`;
    window.open(url, '_blank');
  }

  // ----------------------------
  // Nota popup
  // ----------------------------
  function showNotaOverlay(html) {
    if (!notaContainer || !notaContent) return;
    notaContent.innerHTML = html;
    notaContainer.style.display = 'flex';
    notaContainer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function hideNotaOverlay() {
    if (!notaContainer) return;
    notaContainer.style.display = 'none';
    notaContainer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (notaClose) notaClose.addEventListener('click', hideNotaOverlay);
  if (notaContainer) {
    notaContainer.addEventListener('click', function (e) {
      if (e.target === notaContainer) hideNotaOverlay();
    });
  }

  // ----------------------------
  // Event tombol CEK PESANAN
  // ----------------------------
  btnCek.addEventListener('click', function (ev) {
    ev.preventDefault();
    const order = buildOrderObject();
    if (!order) return;
    const html = renderNota(order);
    showNotaOverlay(html);
  });

  // ----------------------------
  // Event tombol BUAT PESANAN
  // ----------------------------
  if (notaConfirm) {
    notaConfirm.addEventListener('click', function () {
      const order = buildOrderObject();
      if (!order) return;

      const ok = saveOrderLocal(order);
      if (!ok) {
        alert('Gagal menyimpan pesanan, coba lagi.');
        return;
      }

      openWaAdmin(order);
      hideNotaOverlay();
      alert('Terima kasih! Pesananmu telah dikirim untuk validasi. Admin akan menghubungi via WA.');

      const form = $('#formUltra');
      if (form) form.reset();

      buildToppingsUI();
      updateToppingVisibility();
      updatePriceUI();
    });
  }

  // ----------------------------
  // Realtime update
  // ----------------------------
  buildToppingsUI();
  updateToppingVisibility();
  updatePriceUI();

  function attachChangeListeners() {
    const jenisInputs = document.querySelectorAll('input[name="ultraJenis"]');
    jenisInputs.forEach(i => i.addEventListener('change', updatePriceUI));

    const isiEl = $('#ultraIsi');
    if (isiEl) isiEl.addEventListener('change', updatePriceUI);

    const modeInputs = document.querySelectorAll('input[name="ultraToppingMode"]');
    modeInputs.forEach(i => {
      i.addEventListener('change', function () {
        updateToppingVisibility();
        updatePriceUI();
      });
    });

    if (elJumlah) elJumlah.addEventListener('input', updatePriceUI);

    document.addEventListener('change', function (e) {
      if (e.target.name === 'topping' ||
          e.target.name === 'topping_double_1' ||
          e.target.name === 'topping_double_2' ||
          e.target.name === 'taburan') {
        updatePriceUI();
      }
    });
  }

  attachChangeListeners();

  window._pukis = {
    buildToppingsUI,
    updateToppingVisibility,
    updatePriceUI,
    buildOrderObject,
    renderNota,
    getPricePerBox
  };

})();
