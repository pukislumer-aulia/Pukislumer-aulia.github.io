/* assets/js/order.js
   Final merged & adjusted to match provided HTML + CSS
   - Populates topping areas (single/double/taburan)
   - Robust checkbox name handling
   - Price/nota/WA/localStorage logic preserved
*/
(function () {
  'use strict';

  // ------------ CONFIG ------------
  const ADMIN_WA = '6281296668670';
  const STORAGE_KEY = 'pukis_orders';
  const SINGLE_TOPPINGS = ['Coklat', 'Tiramisu', 'Vanilla', 'Stroberi', 'Cappucino'];
  const DOUBLE_ONLY_TOPPINGS = ['Meses', 'Keju', 'Kacang', 'Choco Chip', 'Oreo'];
  const BASE_PRICE = {
    Original: { '5': { non: 10000, single: 13000, double: 15000 }, '10': { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { '5': { non: 12000, single: 15000, double: 17000 }, '10': { non: 21000, single: 28000, double: 32000 } }
  };

  // ------------ DOM shorteners ------------
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // ------------ refs ------------
  const elNama = $('#ultraNama');
  const elWA = $('#ultraWA');
  const elJumlah = $('#ultraJumlah');
  const elNote = $('#ultraNote');
  const btnCek = $('#ultraSubmit');

  const elSingleGroup = $('#ultraSingleGroup');
  const elDoubleGroup = $('#ultraDoubleGroup');
  const elTaburanGroup = $('#ultraTaburanGroup');

  const elPricePerBox = $('#ultraPricePerBox');
  const elSubtotal = $('#ultraSubtotal');
  const elDiscount = $('#ultraDiscount');
  const elGrandTotal = $('#ultraGrandTotal');

  const notaContainer = $('#notaContainer');
  const notaContent = $('#notaContent');
  const notaClose = $('#notaClose');
  const notaConfirm = $('#notaConfirm');

  // ------------ safety check ------------
  if (!elNama || !elWA || !elJumlah || !btnCek) {
    console.warn('order.js: some expected DOM elements are missing. Check IDs in HTML.');
    // continue anyway to be robust in dev
  }

  // ------------ helpers ------------
  function formatRp(n) {
    if (n == null || isNaN(n)) return 'Rp 0';
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
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `INV-${y}${mm}${dd}-${rand}`;
  }

  function getRadioValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  }

  // Ambil semua nilai checkbox untuk sebuah name
  function getCheckedValuesByName(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);
  }

  // Ambil union dari beberapa nama kandidat (robust terhadap pergantian atribut name)
  function getCheckedValuesByAny(namesArray) {
    const s = new Set();
    namesArray.forEach(n => {
      getCheckedValuesByName(n).forEach(v => s.add(v));
    });
    return Array.from(s);
  }

  // master untuk membedakan topping single vs taburan (case-insensitive)
  const SINGLE_TOPPING_MASTER = SINGLE_TOPPINGS.reduce((acc, v) => { acc.push(v.toLowerCase()); return acc; }, []);

  // ------------ build UI for toppings (populates groups if empty) ------------
  function buildToppingsUI() {
    // SINGLE group: create checkboxes but be tolerant: use name 'toppingSingle' and also 'topping' for compatibility
    if (elSingleGroup) {
      if (elSingleGroup.innerHTML.trim() === '') {
        const wrap = document.createElement('div');
        wrap.className = 'topping-grid';
        SINGLE_TOPPINGS.forEach(t => {
          const lbl = document.createElement('label');
          lbl.className = 'topping-option';
          const inp = document.createElement('input');
          inp.type = 'checkbox';
          inp.name = 'toppingSingle'; // preferred name
          inp.value = t;
          inp.className = 'toppingSingle';
          // also include compatibility name attribute 'topping' if some variants expect it:
          // we won't add a duplicate input; instead we'll register that buildOrderObject checks multiple name candidates.
          lbl.appendChild(inp);
          lbl.appendChild(document.createTextNode(' ' + t));
          wrap.appendChild(lbl);
        });
        elSingleGroup.appendChild(wrap);
      }
    }

    // DOUBLE group: include single list + double-only list
    if (elDoubleGroup) {
      if (elDoubleGroup.innerHTML.trim() === '') {
        const container = document.createElement('div');
        container.className = 'double-toppings-wrapper';

        // single list inside double (so double mode shows single options)
        const singleWrap = document.createElement('div');
        singleWrap.className = 'double-single-list';
        const titleS = document.createElement('div');
        titleS.className = 'subtitle';
        titleS.textContent = 'Topping (Single)';
        singleWrap.appendChild(titleS);
        SINGLE_TOPPINGS.forEach(t => {
          const lbl = document.createElement('label');
          lbl.className = 'topping-option';
          const inp = document.createElement('input');
          inp.type = 'checkbox';
          inp.name = 'toppingDouble'; // use distinct name in double list
          inp.value = t;
          inp.className = 'toppingDouble';
          lbl.appendChild(inp);
          lbl.appendChild(document.createTextNode(' ' + t));
          singleWrap.appendChild(lbl);
        });
        container.appendChild(singleWrap);

        // double-only (taburan) inside double group
        const doubleWrap = document.createElement('div');
        doubleWrap.className = 'double-only-list';
        const titleD = document.createElement('div');
        titleD.className = 'subtitle';
        titleD.textContent = 'Topping Tambahan (Taburan)';
        doubleWrap.appendChild(titleD);
        DOUBLE_ONLY_TOPPINGS.forEach(t => {
          const lbl = document.createElement('label');
          lbl.className = 'topping-option';
          const inp = document.createElement('input');
          inp.type = 'checkbox';
          inp.name = 'taburan';
          inp.value = t;
          inp.className = 'taburan';
          lbl.appendChild(inp);
          lbl.appendChild(document.createTextNode(' ' + t));
          doubleWrap.appendChild(lbl);
        });
        container.appendChild(doubleWrap);

        elDoubleGroup.appendChild(container);
      }
}

    // Taburan group (separate list) - only if empty
    if (elTaburanGroup) {
      if (elTaburanGroup.innerHTML.trim() === '') {
        const title = document.createElement('div');
        title.className = 'subtitle';
        title.textContent = 'Taburan (opsional)';
        elTaburanGroup.appendChild(title);
        DOUBLE_ONLY_TOPPINGS.forEach(t => {
          const lbl = document.createElement('label');
          lbl.className = 'topping-option';
          const inp = document.createElement('input');
          inp.type = 'checkbox';
          inp.name = 'taburan';
          inp.value = t;
          inp.className = 'taburan';
          lbl.appendChild(inp);
          lbl.appendChild(document.createTextNode(' ' + t));
          elTaburanGroup.appendChild(lbl);
        });
      }
    }
  }

  // ------------ show/hide topping areas based on mode ------------
  function updateToppingVisibility() {
    const mode = getRadioValue('ultraToppingMode') || 'non';
    // hide all
    if (elSingleGroup) elSingleGroup.classList.add('hidden');
    if (elDoubleGroup) elDoubleGroup.classList.add('hidden');
    if (elTaburanGroup) elTaburanGroup.classList.add('hidden');

    if (mode === 'single') {
      if (elSingleGroup) elSingleGroup.classList.remove('hidden');
      if (elTaburanGroup) elTaburanGroup.classList.remove('hidden'); // allow taburan if user wants separate
    } else if (mode === 'double') {
      if (elDoubleGroup) elDoubleGroup.classList.remove('hidden');
      if (elTaburanGroup) elTaburanGroup.classList.remove('hidden');
    } else {
      // non: nothing shown
    }
  }

  // ------------ pricing ------------
  function getPricePerBox() {
    const jenisRaw = getRadioValue('ultraJenis') || 'Original';
    const jenisKey = (String(jenisRaw).toLowerCase() === 'pandan') ? 'Pandan' : 'Original';
    const isiVal = ($('#ultraIsi') ? $('#ultraIsi').value : '5') || '5';
    const modeRaw = getRadioValue('ultraToppingMode') || 'non';
    const modeKey = (modeRaw === 'single') ? 'single' : (modeRaw === 'double' ? 'double' : 'non');
    if (!BASE_PRICE[jenisKey] || !BASE_PRICE[jenisKey][isiVal]) return 0;
    const priceObj = BASE_PRICE[jenisKey][isiVal];
    return priceObj[modeKey] || priceObj['non'] || 0;
  }

  function calcDiscount(jumlah, subtotal) {
    if (jumlah >= 10) return 1000;
    if (jumlah >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePriceUI() {
    const pricePerBox = getPricePerBox();
    const jumlah = Number(elJumlah && elJumlah.value ? elJumlah.value : 1);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    if (elPricePerBox) elPricePerBox.textContent = formatRp(pricePerBox);
    if (elSubtotal) elSubtotal.textContent = formatRp(subtotal);
    if (elDiscount) elDiscount.textContent = discount ? '-' + formatRp(discount) : '-';
    if (elGrandTotal) elGrandTotal.textContent = formatRp(total);

    return { pricePerBox, subtotal, discount, total };
  }

  // ------------ validation ------------
  function validateOrder() {
    if (!elNama || !elWA || !elJumlah) return false;

    if (elNama.value.trim() === '') { alert('Nama harus diisi'); elNama.focus(); return false; }
    if (elWA.value.trim() === '') { alert('Nomor WA harus diisi'); elWA.focus(); return false; }

    const jumlah = Number(elJumlah.value || 0);
    if (isNaN(jumlah) || jumlah < 1) { alert('Jumlah box minimal 1'); elJumlah.focus(); return false; }

    const jenis = getRadioValue('ultraJenis');
    if (!jenis) { alert('Pilih jenis pukis'); return false; }

    const isi = ($('#ultraIsi') ? $('#ultraIsi').value : '') || '';
    if (!isi) { alert('Pilih isi per box'); return false; }

    const mode = getRadioValue('ultraToppingMode');
    if (!mode) { alert('Pilih mode topping'); return false; }

    // require at least one selection when needed
    if (mode === 'single') {
      const sel = getCheckedValuesByAny(['toppingSingle','single_topping','topping','topping_single','toppingDouble']);
      if (!sel || sel.length === 0) { alert('Pilih minimal 1 topping (single)'); return false; }
    }
    if (mode === 'double') {
      const s = getCheckedValuesByAny(['toppingDouble','toppingSingle','topping','topping_single']);
      const d = getCheckedValuesByAny(['taburan','topping_taburan','topping_tab','double_topping']);
      if ((!s || s.length === 0) && (!d || d.length === 0)) { alert('Pilih minimal 1 topping untuk double'); return false; }
    }

    return true;
  }

  // ------------ build order object (robust) ------------
  function buildOrderObject() {
    if (!validateOrder()) return null;

    const namaVal = elNama.value.trim();
    const waRaw = elWA.value.trim().replace(/\s+/g, '').replace('+', '');
    const wa = waRaw.startsWith('0') ? '62' + waRaw.slice(1) : (waRaw.startsWith('62') ? waRaw : waRaw);
    const jumlah = Number(elJumlah.value || 1);
    const note = elNote ? elNote.value.trim() : '';

    const jenis = getRadioValue('ultraJenis') || 'Original';
    const isi = $('#ultraIsi') ? $('#ultraIsi').value : '5';
    const mode = getRadioValue('ultraToppingMode') || 'non';

    // Try multiple candidate names so we're robust to HTML variations
    const singleChosen = getCheckedValuesByAny(['toppingSingle','single_topping','topping','topping_single']);
    const doubleChosen = getCheckedValuesByAny(['toppingDouble','double_topping','toppingDoubleList','topping_double_1','topping_double_2']);
    const taburanChosen = getCheckedValuesByAny(['taburan','topping_taburan','topping_tab','double_taburan']);

    const pricePerBox = getPricePerBox();
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;
    const invoice = genInvoice();

    return {
      invoice,
      nama: namaVal,
      wa,
      jenis,
      isi,
      jumlah,
      mode,
      single: singleChosen,
      double: doubleChosen,
      taburan: taburanChosen,
      note,
      pricePerBox,
      subtotal,
      discount,
      total,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }

  // ------------ render nota (matches your example format) ------------
  function renderNota(order) {
    if (!order) return '<div>Error membuat nota.</div>';
    const lines = [];

    lines.push(`<div><strong>INVOICE:</strong> ${escapeHtml(order.invoice)}</div>`);
    lines.push(`<div><strong>Nama:</strong> ${escapeHtml(order.nama)}</div>`);
    lines.push(`<div><strong>WA:</strong> ${escapeHtml(order.wa)}</div>`);
    lines.push(`<div><strong>Jenis:</strong> ${escapeHtml(order.jenis)}</div>`);
    lines.push(`<div><strong>Isi per box:</strong> ${escapeHtml(order.isi)}</div>`);
    lines.push(`<div><strong>Jumlah box:</strong> ${order.jumlah}</div>`);
    lines.push('<hr>');

    // Mode label & content
    if (order.mode === 'non' || order.mode === 'Non' || order.mode === '') {
      lines.push(`<div><strong>Mode Topping:</strong> Non Topping</div>`);
      lines.push(`<div><strong>Non Topping:</strong> Polosan</div>`);
      // Taburan none
      lines.push(`<div><strong>Taburan:</strong> -</div>`);
    } else if (order.mode === 'single') {
      lines.push(`<div><strong>Mode Topping:</strong> Single Topping</div>`);
      const toppingText = (order.single && order.single.length) ? escapeHtml(order.single.join(', ')) : '-';
      lines.push(`<div><strong>Topping:</strong> ${toppingText}</div>`);
      const tabText = (order.taburan && order.taburan.length) ? escapeHtml(order.taburan.join(', ')) : '-';
      lines.push(`<div><strong>Taburan:</strong> ${tabText}</div>`);
    } else if (order.mode === 'double') {
      lines.push(`<div><strong>Mode Topping:</strong> Double Topping</div>`);

      // Show toppings (prefer single list if user selected them; else extract from double array names)
      let toppingsForDisplay = [];
      if (order.single && order.single.length) {
        toppingsForDisplay = order.single;
      } else if (order.double && order.double.length) {
        toppingsForDisplay = order.double.filter(v => SINGLE_TOPPING_MASTER.includes(String(v).toLowerCase()));
      }
      const toppingText = (toppingsForDisplay.length) ? escapeHtml(toppingsForDisplay.join(', ')) : '-';
      lines.push(`<div><strong>Topping:</strong> ${toppingText}</div>`);

      // Taburan: prefer explicit taburan array; if empty, extract remaining from doubleChosen
      let tabForDisplay = [];
      if (order.taburan && order.taburan.length) {
        tabForDisplay = order.taburan;
      } else if (order.double && order.double.length) {
        tabForDisplay = order.double.filter(v => !SINGLE_TOPPING_MASTER.includes(String(v).toLowerCase()));
      }
      const tabText = (tabForDisplay.length) ? escapeHtml(tabForDisplay.join(', ')) : '-';
      lines.push(`<div><strong>Taburan:</strong> ${tabText}</div>`);
    } else {
      // fallback
      const toppingText = (order.single && order.single.length) ? escapeHtml(order.single.join(', ')) : '-';
      lines.push(`<div><strong>Topping:</strong> ${toppingText}</div>`);
      const tabText = (order.taburan && order.taburan.length) ? escapeHtml(order.taburan.join(', ')) : '-';
      lines.push(`<div><strong>Taburan:</strong> ${tabText}</div>`);
    }

    lines.push('<hr>');
    lines.push(`<div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>`);
    lines.push(`<div><strong>Diskon:</strong> ${order.discount ? formatRp(order.discount) : '-'}</div>`);
    lines.push(`<div style="font-weight:800;margin-top:6px;"><strong>TOTAL:</strong> ${formatRp(order.total)}</div>`);
    lines.push('<br>');
    lines.push('<div>Mohon validasi nomor invoice dan total. Terima kasih.</div>');

    if (order.note) lines.push(`<hr><div><strong>Catatan:</strong> ${escapeHtml(order.note)}</div>`);
    return lines.join('');
  }

  // ------------ storage / WA helpers ------------
  function saveOrderLocal(order) {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      arr.unshift(order);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      return true;
    } catch (err) {
      console.error('saveOrderLocal error', err);
      return false;
    }
  }

  function openWaAdmin(order) {
    const lines = [];
    lines.push(`INVOICE: ${order.invoice}`);
    lines.push(`Nama: ${order.nama}`);
    lines.push(`WA: ${order.wa}`);
    lines.push(`Jenis: ${order.jenis}`);
    lines.push(`Isi per box: ${order.isi}`);
    lines.push(`Jumlah box: ${order.jumlah}`);
    if (order.mode === 'single' && order.single && order.single.length) lines.push(`Topping: ${order.single.join(', ')}`);
    if (order.mode === 'double') {
      if (order.single && order.single.length) lines.push(`Topping: ${order.single.join(', ')}`);
      if (order.double && order.double.length) lines.push(`DoubleList: ${order.double.join(', ')}`);
    }
    if (order.taburan && order.taburan.length) lines.push(`Taburan: ${order.taburan.join(', ')}`);
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

  // ------------ nota overlay show/hide ------------
  function showNotaHtml(html) {
    if (!notaContainer || !notaContent) return;
    notaContent.innerHTML = html;
    notaContainer.style.display = 'flex';
    notaContainer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function hideNota() {
    if (!notaContainer) return;
    notaContainer.style.display = 'none';
    notaContainer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // also clear pending
    window._pendingOrder = null;
  }

  if (notaClose) notaClose.addEventListener('click', hideNota);
  if (notaContainer) {
    notaContainer.addEventListener('click', function (e) {
      if (e.target === notaContainer) hideNota();
    });
  }

  // ------------ events: cek pesanan (preview) & confirm ------------
  if (btnCek) {
    btnCek.addEventListener('click', function (ev) {
      ev.preventDefault();
      const order = buildOrderObject();
      if (!order) return;
      const html = renderNota(order);
      showNotaHtml(html);
      // keep pending order for confirm action
      window._pendingOrder = order;
    });
  }

  if (notaConfirm) {
    notaConfirm.addEventListener('click', function () {
      const order = window._pendingOrder || buildOrderObject();
      if (!order) return;
      // save and open WA admin
      const ok = saveOrderLocal(order);
      // open WA admin
      openWaAdmin(order);
      // close and notify
      hideNota();
      alert('Terima kasih! Pesananmu telah dikirim untuk validasi. Admin akan menghubungi via WA.');
      // reset form lightly
      const form = $('#formUltra');
      if (form) form.reset();
      // rebuild UI
      buildToppingsUI();
      updateToppingVisibility();
      updatePriceUI();
    });
  }

  // ------------ attach listeners for price & visibility & checkbox constraints ------------
  function attachListeners() {
    // initial price update
    $$('input[name="ultraJenis"]').forEach(i => i.addEventListener('change', updatePriceUI));
    const isiEl = $('#ultraIsi'); if (isiEl) isiEl.addEventListener('change', updatePriceUI);
    if (elJumlah) elJumlah.addEventListener('input', updatePriceUI);

    // topping mode radios
    $$('input[name="ultraToppingMode"]').forEach(i => i.addEventListener('change', function () {
      updateToppingVisibility();
      updatePriceUI();
    }));

    // delegate checkbox change to update price and optionally enforce simple constraints (no strict counts unless requested)
    document.addEventListener('change', function (e) {
      if (!e || !e.target) return;
      const n = e.target.name;
      if (n === 'topping' || n === 'toppingSingle' || n === 'toppingDouble' || n === 'taburan' || n === 'single_topping' || n === 'double_topping') {
        updatePriceUI();
      }
    });
  }

  // ------------ init ------------
  function init() {
    buildToppingsUI();
    updateToppingVisibility();
    updatePriceUI();
    attachListeners();
    // expose for debugging
    window._pukis = {
      buildToppingsUI,
      updateToppingVisibility,
      updatePriceUI,
      buildOrderObject,
      renderNota
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(); // end IIFE
