/* ===========================================================
   assets/js/order.js
   ORDER.JS — Final Revisi FULL CLEAN
   - Mengikuti seluruh instruksi Asnidar Laila
   - Tidak ada duplikasi fungsi
   - Tidak ada nested function salah tempat
   - Tidak ada potongan tersisa dari file lama
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

  const SINGLE_TOPPING_MASTER = [
    'Coklat','coklat',
    'Tiramisu','tiramisu',
    'Vanilla','vanilla',
    'Stroberi','stroberi',
    'Cappucino','cappucino'
  ];

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
  // DOM refs
  // ----------------------------
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

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

  // ----------------------------
  // Helpers
  // ----------------------------
  function formatRp(n) {
    if (n == null || isNaN(n)) return 'Rp0';
    return 'Rp ' + Number(n).toLocaleString('id-ID');
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
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

  // Helper robust
  function getCheckedValuesByName(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
      .map(i => i.value);
  }

  function getCheckedValuesByAny(namesArray) {
    const set = new Set();
    namesArray.forEach(n => {
      getCheckedValuesByName(n).forEach(v => set.add(v));
    });
    return Array.from(set);
  }

  // ----------------------------
  // Build Topping UI
  // ----------------------------
  function buildToppingsUI() {
    // SINGLE GROUP
    if (elSingleGroup) {
      elSingleGroup.innerHTML = '';
      SINGLE_TOPPINGS.forEach(t => {
        elSingleGroup.insertAdjacentHTML('beforeend',
          `<label><input type="checkbox" name="single_topping" value="${t}"> ${t}</label>`);
      });
    }

    // DOUBLE GROUP
    if (elDoubleGroup) {
      elDoubleGroup.innerHTML = '';

      // Single toppings (repeated again inside double mode)
      SINGLE_TOPPINGS.forEach(t => {
        elDoubleGroup.insertAdjacentHTML('beforeend',
          `<label><input type="checkbox" name="single_topping" value="${t}"> ${t}</label>`);
      });

      // Double-only toppings
      DOUBLE_ONLY_TOPPINGS.forEach(t => {
        elDoubleGroup.insertAdjacentHTML('beforeend',
          `<label><input type="checkbox" name="double_topping" value="${t}"> ${t}</label>`);
      });
    }

    // TABURAN (opsional)
    if (elTaburanGroup) {
      elTaburanGroup.innerHTML = '';
      DOUBLE_ONLY_TOPPINGS.forEach(t => {
        elTaburanGroup.insertAdjacentHTML('beforeend',
          `<label><input type="checkbox" name="taburan" value="${t}"> ${t}</label>`);
      });
    }
  }
   // ----------------------------
  // Update Visibility Sesuai Mode
  // ----------------------------
  function updateToppingVisibility() {
    const mode = getRadioValue('ultraToppingMode');

    if (elSingleGroup) elSingleGroup.style.display = (mode === 'single') ? 'block' : 'none';
    if (elDoubleGroup) elDoubleGroup.style.display = (mode === 'double') ? 'block' : 'none';
    if (elTaburanGroup) elTaburanGroup.style.display = (mode === 'double') ? 'block' : 'none';
  }

  // ----------------------------
  // Harga
  // ----------------------------
  function getPricePerBox() {
    const jenis = getRadioValue('ultraJenis') || 'Original';
    const isi = $('#ultraIsi') ? $('#ultraIsi').value : '5';
    const mode = getRadioValue('ultraToppingMode') || 'non';

    const jenisKey = jenis;
    const isiVal = isi;
    const modeKey = mode;

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
  // Validation
  // ----------------------------
  function validateOrder() {
    if (!elNama.value.trim()) { alert('Nama harus diisi'); elNama.focus(); return false; }
    if (!elWA.value.trim()) { alert('Nomor WA harus diisi'); elWA.focus(); return false; }

    const jumlah = Number(elJumlah.value || 0);
    if (jumlah < 1) { alert('Jumlah box minimal 1'); elJumlah.focus(); return false; }

    if (!getRadioValue('ultraJenis')) { alert('Pilih jenis pukis'); return false; }
    if (!$('#ultraIsi').value) { alert('Pilih isi per box'); return false; }

    const mode = getRadioValue('ultraToppingMode');
    if (!mode) { alert('Pilih mode topping'); return false; }

    if (mode === 'single') {
      const s = getCheckedValuesByAny(['single_topping', 'topping_single']);
      if (!s.length) { alert('Pilih minimal 1 topping (single)'); return false; }
    }

    if (mode === 'double') {
      const s = getCheckedValuesByAny(['single_topping']);
      const d = getCheckedValuesByAny(['double_topping']);
      if (!s.length && !d.length) {
        alert('Pilih minimal 1 topping untuk double');
        return false;
      }
    }

    return true;
  }

  // ----------------------------
  // Build Order (Versi robust sesuai perintahmu)
  // ----------------------------
  function buildOrderObject() {
    if (!validateOrder()) return null;

    const namaVal = elNama.value.trim();
    const waRaw = elWA.value.trim().replace(/\s+/g, '').replace('+', '');
    const wa = waRaw.startsWith('0') ? '62' + waRaw.slice(1) :
              (waRaw.startsWith('62') ? waRaw : waRaw);

    const jumlah = Number(elJumlah.value || 1);
    const note = elNote ? elNote.value.trim() : '';

    const jenis = getRadioValue('ultraJenis') || 'Original';
    const isi = $('#ultraIsi') ? $('#ultraIsi').value : '5';
    const mode = getRadioValue('ultraToppingMode') || 'non';

    const singleChosen = getCheckedValuesByAny(['toppingSingle','single_topping','topping','topping_single']);
    const doubleChosen = getCheckedValuesByAny(['toppingDouble','double_topping','toppingDoubleList','topping_double_1','topping_double_2']);
    const taburanChosen = getCheckedValuesByAny(['taburan','topping_taburan','topping_tab']);

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
  // Render Nota (Sesuai format contohmu)
  // ----------------------------
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

    if (order.mode === 'non') {
      lines.push(`<div><strong>Mode Topping:</strong> Non Topping</div>`);
      lines.push(`<div><strong>Non Topping:</strong> Polosan</div>`);
      lines.push(`<div><strong>Taburan:</strong> -</div>`);
    }

    else if (order.mode === 'single') {
      lines.push(`<div><strong>Mode Topping:</strong> Single Topping</div>`);
      const t = order.single.length ? escapeHtml(order.single.join(', ')) : '-';
      lines.push(`<div><strong>Topping:</strong> ${t}</div>`);
      const tab = order.taburan.length ? escapeHtml(order.taburan.join(', ')) : '-';
      lines.push(`<div><strong>Taburan:</strong> ${tab}</div>`);
    }

    else if (order.mode === 'double') {
      lines.push(`<div><strong>Mode Topping:</strong> Double Topping</div>`);

      let tops = [];
      if (order.single.length) tops = order.single;
      else tops = order.double.filter(v =>
        SINGLE_TOPPING_MASTER.some(s => s.toLowerCase() === v.toLowerCase())
      );

      let tabs = [];
      if (order.taburan.length) tabs = order.taburan;
      else tabs = order.double.filter(v =>
        !SINGLE_TOPPING_MASTER.some(s => s.toLowerCase() === v.toLowerCase())
      );

      lines.push(`<div><strong>Topping:</strong> ${tops.length ? escapeHtml(tops.join(', ')) : '-'}</div>`);
      lines.push(`<div><strong>Taburan:</strong> ${tabs.length ? escapeHtml(tabs.join(', ')) : '-'}</div>`);
    }

    lines.push('<hr>');
    lines.push(`<div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>`);
    lines.push(`<div><strong>Diskon:</strong> ${order.discount ? formatRp(order.discount) : '-'}</div>`);
    lines.push(`<div style="font-weight:800;margin-top:6px;"><strong>TOTAL:</strong> ${formatRp(order.total)}</div>`);
    lines.push('<br>');
    lines.push('<div>Mohon validasi nomor invoice dan total. Terima kasih.</div>');

    if (order.note) {
      lines.push('<hr>');
      lines.push(`<div><strong>Catatan:</strong> ${escapeHtml(order.note)}</div>`);
    }

    return lines.join('');
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
  // Kirim ke WA Admin
  // ----------------------------
  function openWaAdmin(order) {
    const lines = [];
    lines.push(`INVOICE: ${order.invoice}`);
    lines.push(`Nama: ${order.nama}`);
    lines.push(`WA: ${order.wa}`);
    lines.push(`Jenis: ${order.jenis}`);
    lines.push(`Isi per box: ${order.isi}`);
    lines.push(`Jumlah box: ${order.jumlah}`);

    if (order.single.length) lines.push(`Single: ${order.single.join(', ')}`);
    if (order.double.length) lines.push(`Double: ${order.double.join(', ')}`);
    if (order.taburan.length) lines.push(`Taburan: ${order.taburan.join(', ')}`);

    if (order.note) lines.push(`Catatan: ${order.note}`);

    lines.push(`Subtotal: ${formatRp(order.subtotal)}`);
    lines.push(`Diskon: ${order.discount ? formatRp(order.discount) : '-'}`);
    lines.push(`TOTAL: ${formatRp(order.total)}`);
    lines.push('');
    lines.push('Mohon validasi nomor invoice dan total. Terima kasih.');

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${ADMIN_WA}?text=${text}`, '_blank');
  }

  // ----------------------------
  // Nota Overlay
  // ----------------------------
  function showNota(html) {
    notaContent.innerHTML = html;
    notaContainer.style.display = 'flex';
    notaContainer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function hideNota() {
    notaContainer.style.display = 'none';
    notaContainer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (notaClose) notaClose.addEventListener('click', hideNota);
  if (notaContainer) {
    notaContainer.addEventListener('click', e => {
      if (e.target === notaContainer) hideNota();
    });
  }

  // ----------------------------
  // Event: Cek Pesanan → Show Nota
  // ----------------------------
  if (btnCek) {
    btnCek.addEventListener('click', function (ev) {
      ev.preventDefault();
      const order = buildOrderObject();
      if (!order) return;

      showNota(renderNota(order));

      // simpan order global sementara untuk konfirmasi
      window._orderPreview = order;
    });
  }

  // ----------------------------
  // Event: Konfirmasi Pesanan
  // ----------------------------
  if (notaConfirm) {
    notaConfirm.addEventListener('click', function () {
      const order = window._orderPreview;
      if (!order) return;

      const ok = saveOrderLocal(order);
      if (!ok) { alert('Gagal menyimpan pesanan.'); return; }

      openWaAdmin(order);
      hideNota();
      alert('Terima kasih! Pesananmu telah dikirim.');

      const form = $('#formUltra');
      if (form) form.reset();

      buildToppingsUI();
      updateToppingVisibility();
      updatePriceUI();
    });
  }

  // ----------------------------
  // Init
  // ----------------------------
  buildToppingsUI();
  updateToppingVisibility();
  updatePriceUI();

  document.addEventListener('change', function (e) {
    const n = e.target.name;
    if (['single_topping','double_topping','taburan'].includes(n)) {
      updatePriceUI();
    }
  });

  // Expose debug
  window._pukis = {
    buildToppingsUI,
    updateToppingVisibility,
    updatePriceUI,
    buildOrderObject,
    renderNota,
    getPricePerBox
  };

})();
