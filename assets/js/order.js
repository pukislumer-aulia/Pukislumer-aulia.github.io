/* ===========================================================
   assets/js/order.js
   ORDER.JS — Final Revisi (Part 1)
   - Matches index.html & style.css as provided
   - Hanya mengubah/menambahkan logic topping & taburan UI
   - Logika harga / nota / localStorage / WA admin tetap utuh
=========================================================== */

(function () {
  'use strict';

  // ----------------------------
  // Konfigurasi
  // ----------------------------
  const ADMIN_WA = '6281296668670';
  const STORAGE_KEY = 'pukis_orders';

  const SINGLE_TOPPINGS = ['Coklat', 'Tiramisu', 'Vanilla', 'Stroberi', 'Cappucino'];
  const DOUBLE_ONLY_TOPPINGS = ['Meses', 'Keju', 'Kacang', 'Choco Chip', 'Oreo'];
  // NOTE: taburan uses same labels as DOUBLE_ONLY_TOPPINGS per your instruction

  const BASE_PRICE = {
    Original: { '5': { non: 10000, single: 13000, double: 15000 }, '10': { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { '5': { non: 12000, single: 15000, double: 17000 }, '10': { non: 21000, single: 28000, double: 32000 } }
  };

  // ----------------------------
  // DOM refs
  // ----------------------------
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const elNama = $('#ultraNama');
  const elWA = $('#ultraWA');
  const elJumlah = $('#ultraJumlah');
  const elNote = $('#ultraNote');
  const btnCek = $('#ultraSubmit');

  const elSingleGroup = $('#ultraSingleGroup'); // container single
  const elDoubleGroup = $('#ultraDoubleGroup'); // container double (includes single + double-only)
  const elTaburanGroup = $('#ultraTaburanGroup'); // explicit taburan wrapper (we used this in your HTML)

  const elPricePerBox = $('#ultraPricePerBox');
  const elSubtotal = $('#ultraSubtotal');
  const elDiscount = $('#ultraDiscount');
  const elGrandTotal = $('#ultraGrandTotal');

  const notaContainer = $('#notaContainer');
  const notaContent = $('#notaContent');
  const notaClose = $('#notaClose');
  const notaConfirm = $('#notaConfirm');

  // Defensive
  if (!elNama || !elWA || !elJumlah || !btnCek) {
    console.error('order.js init: required DOM elements missing. Check index.html IDs.');
    // We don't abort here entirely to allow partial usage in dev env
  }

  // ----------------------------
  // Helpers
  // ----------------------------
  function formatRp(n) {
    if (n == null || isNaN(n)) return 'Rp0';
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

  function getCheckedValuesByName(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);
  }

  // ----------------------------
  // Build Topping UI into the containers present in HTML
  // This uses checkboxes for single/double modes as requested
  // ----------------------------
  function buildToppingsUI() {
    // SINGLE group (the HTML we provided earlier uses checkboxes).
    if (elSingleGroup) {
      // Clear then build five single toppings (checkbox)
      elSingleGroup.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'toppings-grid';
      SINGLE_TOPPINGS.forEach(t => {
        const lbl = document.createElement('label');
        lbl.className = 'topping-checkbox';
        const inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.name = 'single_topping';
        inp.value = t;
        inp.className = 'toppingSingle';
        lbl.appendChild(inp);
        lbl.appendChild(document.createTextNode(' ' + t));
        wrap.appendChild(lbl);
      });
      elSingleGroup.appendChild(wrap);
    }

    // DOUBLE group: include single toppings + double-only toppings and taburan
    if (elDoubleGroup) {
      elDoubleGroup.innerHTML = '';
      const container = document.createElement('div');
      container.className = 'double-toppings-wrapper';

      // single list (again) so double mode shows all single toppings
      const singleWrap = document.createElement('div');
      singleWrap.className = 'double-single-list';
      const titleS = document.createElement('strong');
      titleS.style.color = '#fff';
      titleS.style.display = 'block';
      titleS.style.marginBottom = '6px';
      titleS.textContent = 'Topping (Single)';
      singleWrap.appendChild(titleS);
      SINGLE_TOPPINGS.forEach(t => {
        const lbl = document.createElement('label');
        lbl.className = 'topping-checkbox';
        const inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.name = 'single_topping';
        inp.value = t;
        inp.className = 'toppingSingle';
        lbl.appendChild(inp);
        lbl.appendChild(document.createTextNode(' ' + t));
        singleWrap.appendChild(lbl);
      });
      container.appendChild(singleWrap);

      // double-only list
      const doubleWrap = document.createElement('div');
      doubleWrap.className = 'double-only-list';
      const titleD = document.createElement('strong');
      titleD.style.color = '#fff';
      titleD.style.display = 'block';
      titleD.style.marginBottom = '6px';
      titleD.textContent = 'Topping Tambahan (Taburan)';
      doubleWrap.appendChild(titleD);
      DOUBLE_ONLY_TOPPINGS.forEach(t => {
        const lbl = document.createElement('label');
        lbl.className = 'topping-checkbox';
        const inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.name = 'double_topping';
        inp.value = t;
        inp.className = 'toppingDouble';
        lbl.appendChild(inp);
        lbl.appendChild(document.createTextNode(' ' + t));
        doubleWrap.appendChild(lbl);
      });
      container.appendChild(doubleWrap);

      // Append to main double group
      elDoubleGroup.appendChild(container);
    }

    // Taburan wrapper (explicit). We support displaying it in both single & double modes.
    if (elTaburanGroup) {
      // If HTML already has children (user already added) we don't rebuild; else create default taburan checkboxes
      if (elTaburanGroup.innerHTML.trim() === '') {
        const title = document.createElement('strong');
        title.style.color = '#fff';
        title.style.display = 'block';
        title.style.marginBottom = '6px';
        title.textContent = 'Taburan (opsional)';
        elTaburanGroup.appendChild(title);
        DOUBLE_ONLY_TOPPINGS.forEach(t => {
          const lbl = document.createElement('label');
          lbl.className = 'taburan-checkbox';
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

  // ----------------------------
  // Show/hide topping areas based on mode
  // ----------------------------
  function updateToppingVisibility() {
    const mode = getRadioValue('ultraToppingMode') || 'non';

    // hide all first
    if (elSingleGroup) elSingleGroup.classList.add('hidden');
    if (elDoubleGroup) elDoubleGroup.classList.add('hidden');
    if (elTaburanGroup) elTaburanGroup.classList.add('hidden');

    if (mode === 'single') {
      if (elSingleGroup) elSingleGroup.classList.remove('hidden');
      if (elTaburanGroup) elTaburanGroup.classList.remove('hidden');
    } else if (mode === 'double') {
      if (elDoubleGroup) elDoubleGroup.classList.remove('hidden');
      if (elTaburanGroup) elTaburanGroup.classList.remove('hidden');
    } else {
      // non: nothing shown (per your rule)
    }
  }

  // ----------------------------
  // Price logic (UNCHANGED)
  // ----------------------------
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

  // ----------------------------
  // Validation (matches your HTML names)
  // ----------------------------
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

    if (mode === 'single') {
      // For single we require at least one single_topping (per your last instruction you wanted checkboxes and allow multiple)
      const selected = getCheckedValuesByName('single_topping');
      if (!selected || selected.length === 0) { alert('Pilih minimal 1 topping (single)'); return false; }
    }

    if (mode === 'double') {
      // For double, your HTML uses checkboxes: require at least one selection among single_topping or double_topping.
      const s = getCheckedValuesByName('single_topping');
      const d = getCheckedValuesByName('double_topping');
      if ((!s || s.length === 0) && (!d || d.length === 0)) { alert('Pilih minimal 1 topping untuk double'); return false; }
    }

    return true;
  }

  // ----------------------------
  // Build order object
  // ----------------------------
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

    const singleChosen = getCheckedValuesByName('single_topping') || [];
    const doubleChosen = getCheckedValuesByName('double_topping') || [];
    const taburanChosen = getCheckedValuesByName('taburan') || [];

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

  // ----------------------------
  // Render nota HTML
  // ----------------------------
  function renderNota(order) {
    if (!order) return '<div>Error membuat nota.</div>';
    const html = [];
    html.push(`<div><strong>Invoice:</strong> ${escapeHtml(order.invoice)}</div>`);
    html.push(`<div><strong>Nama:</strong> ${escapeHtml(order.nama)}</div>`);
    html.push(`<div><strong>WA:</strong> ${escapeHtml(order.wa)}</div>`);
    html.push(`<div><strong>Jenis:</strong> ${escapeHtml(order.jenis)}</div>`);
    html.push(`<div><strong>Isi per box:</strong> ${escapeHtml(order.isi)}</div>`);
    html.push(`<div><strong>Jumlah Box:</strong> ${order.jumlah} box</div>`);
    html.push('<hr>');
    if (order.mode === 'single') {
      html.push(`<div><strong>Topping:</strong> ${escapeHtml(order.single.join(', ') || '-')}</div>`);
    } else if (order.mode === 'double') {
      html.push(`<div><strong>Topping Double:</strong> ${escapeHtml((order.double.length? order.double.join(' + ') : order.single.join(', ')) || '-')}</div>`);
    } else {
      html.push(`<div><strong>Topping:</strong> Non</div>`);
    }
    html.push(`<div><strong>Taburan:</strong> ${escapeHtml(order.taburan.join(', ') || '-')}</div>`);
    html.push('<hr>');
    html.push(`<div><strong>Harga / Box:</strong> ${formatRp(order.pricePerBox)}</div>`);
    html.push(`<div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>`);
    html.push(`<div><strong>Diskon:</strong> ${order.discount ? formatRp(order.discount) : '-'}</div>`);
    html.push(`<div style="font-weight:800;margin-top:6px;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</div>`);
    if (order.note) html.push(`<hr><div><strong>Catatan:</strong> ${escapeHtml(order.note)}</div>`);
    return html.join('');
  }

  // ----------------------------
  // Save to localStorage
  // ----------------------------
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

  // ----------------------------
  // Open WA Admin for validation
  // ----------------------------
  function openWaAdmin(order) {
    const lines = [];
    lines.push(`INVOICE: ${order.invoice}`);
    lines.push(`Nama: ${order.nama}`);
    lines.push(`WA: ${order.wa}`);
    lines.push(`Jenis: ${order.jenis}`);
    lines.push(`Isi per box: ${order.isi}`);
    lines.push(`Jumlah box: ${order.jumlah}`);
    if (order.mode === 'single' && order.single.length) lines.push(`Single: ${order.single.join(', ')}`);
    if (order.mode === 'double' && order.double.length) lines.push(`Double: ${order.double.join(' + ')}`);
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

  // ----------------------------
  // Nota overlay show/hide
  // ----------------------------
  function showNota(html) {
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
  }

  if (notaClose) notaClose.addEventListener('click', hideNota);
  if (notaContainer) {
    notaContainer.addEventListener('click', function(e) {
      if (e.target === notaContainer) hideNota();
    });
  }

  // ----------------------------
  // Event: Cek Pesanan -> show nota (preview)
  // ----------------------------
  if (btnCek) {
    btnCek.addEventListener('click', function(ev) {
      ev.preventDefault();
      const order = buildOrderObject();
      if (!order) return;
      const html = renderNota(order);
      showNota(html);
    });
  }

/* --- END PART 1 --- */
/* ===========================================================
   assets/js/order.js
   ORDER.JS — Final Revisi (Part 2)
   (Continuation & final handlers)
=========================================================== */

  // ----------------------------
  // Event: Konfirmasi "Buat Pesanan" pada nota
  // ----------------------------
  if (notaConfirm) {
    notaConfirm.addEventListener('click', function() {
      const order = buildOrderObject();
      if (!order) return;

      const ok = saveOrderLocal(order);
      if (!ok) { alert('Gagal menyimpan pesanan, coba lagi.'); return; }

      // Open WA admin
      openWaAdmin(order);

      // Close overlay & notify buyer (generic)
      hideNota();
      alert('Terima kasih! Pesananmu telah dikirim untuk validasi. Admin akan menghubungi via WA.');

      // Reset form lightly
      const form = $('#formUltra');
      if (form) form.reset();

      // rebuild toppings & update visibility + price
      buildToppingsUI();
      updateToppingVisibility();
      updatePriceUI();
    });
  }

  // ----------------------------
  // Init: build & bind
  // ----------------------------
  buildToppingsUI();
  updateToppingVisibility();
  updatePriceUI();

  // Attach change listeners for price & visibility
  function attachListeners() {
    // jenis radios
    const jenisEls = document.querySelectorAll('input[name="ultraJenis"]');
    jenisEls.forEach(i => i.addEventListener('change', updatePriceUI));

    // isi select
    const isiEl = $('#ultraIsi');
    if (isiEl) isiEl.addEventListener('change', updatePriceUI);

    // topping mode radios
    const modeEls = document.querySelectorAll('input[name="ultraToppingMode"]');
    modeEls.forEach(i => {
      i.addEventListener('change', function() {
        updateToppingVisibility();
        updatePriceUI();
      });
    });

    // jumlah change
    if (elJumlah) elJumlah.addEventListener('input', updatePriceUI);

    // Delegate change events for dynamic checkboxes
    document.addEventListener('change', function(e) {
      if (!e || !e.target) return;
      const n = e.target.name;
      if (n === 'single_topping' || n === 'double_topping' || n === 'taburan' || n === 'topping') {
        // checkboxes don't alter price except taburan might be counted if you had logic for that;
        // Per instruction topping checkboxes do not change price; only mode does.
        updatePriceUI();
      }
    });
  }

  attachListeners();

  // Expose debug helpers
  window._pukis = {
    buildToppingsUI,
    updateToppingVisibility,
    updatePriceUI,
    buildOrderObject,
    renderNota,
    getPricePerBox
  };

})(); // end IIFE

/* --- END FILE --- */
