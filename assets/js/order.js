/* =========================================================
   order.js — FINAL (revisi + fitur admin/WA/PDF)
   - Simpan di: assets/js/order.js
   - Pastikan ada assets/images/ttd.png & qris-pukis.jpg
   - Menyatukan: topping UI, kalkulasi harga, nota popup,
     penyimpanan ke localStorage (pukisOrders), lastOrder,
     WA ke admin, dan generator PDF (jsPDF + autotable)
   ======================================================== */

(function () {
  'use strict';

  /* -------------------------
     Konfigurasi & data tetap
  --------------------------*/

  const ADMIN_WA = "6281296668670"; // nomor admin (dalam format E.164 tanpa +)
  const STORAGE_ORDERS_KEY = "pukisOrders";
  const STORAGE_LAST_ORDER_KEY = "lastOrder";

  const ASSET_PREFIX = "assets/images/";
  const QRIS_FILENAME = "qris-pukis.jpg";
  const TTD_FILENAME = "ttd.png";

  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Stroberi","Cappucino","Vanilla","Taro","Matcha"];
  const DOUBLE_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 13000, single: 15000, double: 18000 }, "10": { non: 25000, single: 28000, double: 32000 } }
  };

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // safe rupiah formatter (digit-by-digit)
  function formatRp(n){
    const v = Number(n || 0);
    if (Number.isNaN(v)) return "Rp 0";
    return "Rp " + v.toLocaleString('id-ID');
  }

  /* -------------------------
     Build topping & taburan UI
  --------------------------*/
  function buildToppingUI(){
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;

    singleGroup.innerHTML = '';
    doubleGroup.innerHTML = '';

    SINGLE_TOPPINGS.forEach(t => {
      const id = 'topping_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label');
      lab.className = 'topping-check';
      lab.innerHTML = `<input type="checkbox" name="topping[]" value="${t}" id="${id}"> ${t}`;
      singleGroup.appendChild(lab);
    });

    DOUBLE_TABURAN.forEach(t => {
      const id = 'taburan_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label');
      lab.className = 'taburan-check';
      lab.innerHTML = `<input type="checkbox" name="taburan[]" value="${t}" id="${id}"> ${t}`;
      doubleGroup.appendChild(lab);
    });

    // bind change via event delegation
    [singleGroup, doubleGroup].forEach(g => {
      g.addEventListener('change', function(e){
        if (!e.target) return;
        if (e.target.matches('input[type="checkbox"]')) {
          handleCheckboxChange(e);
        }
      });
    });
  }

  /* -------------------------
     Form helpers
  --------------------------*/
  function getSelectedRadioValue(name){
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }
  function getToppingValues(){ return Array.from(document.querySelectorAll('input[name="topping[]"]:checked')).map(i=>i.value); }
  function getTaburanValues(){ return Array.from(document.querySelectorAll('input[name="taburan[]"]:checked')).map(i=>i.value); }
  function getIsiValue(){ const el = $('#ultraIsi'); return el ? String(el.value) : '5'; }
  function getJumlahBox(){ const el = $('#ultraJumlah'); const v = el ? Number(el.value) : 1; return Number.isFinite(v) && v>0 ? Math.floor(v) : 1; }

  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || 'Original';
    isi = String(isi || '5');
    mode = (mode || 'non').toLowerCase();
    try { return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0; }
    catch(e){ return 0; }
  }

  function calcDiscount(jumlahBox, subtotal){
    // contoh: diskon 1% untuk 5+, 10+ (sesuai kebutuhan)
    if (jumlahBox >= 10) return Math.round(subtotal * 0.01);
    if (jumlahBox >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  /* -------------------------
     Price UI update
  --------------------------*/
  function updatePriceUI(){
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue();
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';
    const jumlah = getJumlahBox();

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    const elPrice = $('#ultraPricePerBox');
    const elSubtotal = $('#ultraSubtotal');
    const elDiscount = $('#ultraDiscount');
    const elGrand = $('#ultraGrandTotal');

    if (elPrice) elPrice.textContent = formatRp(pricePerBox);
    if (elSubtotal) elSubtotal.textContent = formatRp(subtotal);
    if (elDiscount) elDiscount.textContent = discount>0 ? '-' + formatRp(discount) : '-';
    if (elGrand) elGrand.textContent = formatRp(total);

    return { jenis, isi, mode, jumlah, pricePerBox, subtotal, discount, total };
  }

  /* -------------------------
     Topping visibility & validation
  --------------------------*/
  function updateToppingVisibility(){
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;

    if (mode === 'non'){
      singleGroup.style.display = 'none';
      doubleGroup.style.display = 'none';
      singleGroup.querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=false);
      doubleGroup.querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=false);
    } else if (mode === 'single'){
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'none';
      doubleGroup.querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=false);
    } else if (mode === 'double'){
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'flex';
    }
  }

  function handleCheckboxChange(e){
    const isi = Number(getIsiValue()) || 5;
    const target = e.target;
    if (!target) return;
    const isTopping = !!target.closest('#ultraSingleGroup');
    const isTaburan = !!target.closest('#ultraDoubleGroup');

    if (isTopping){
      const selCount = getToppingValues().length;
      if (selCount > isi){
        target.checked = false;
        alert(`Maksimal topping = ${isi} (isi box).`);
      }
    }
    if (isTaburan){
      const selCount = getTaburanValues().length;
      if (selCount > isi){
        target.checked = false;
        alert(`Maksimal taburan = ${isi} (isi box).`);
      }
    }

    // visual
    const lab = target.closest('label');
    if (lab){
      if (target.checked) lab.classList.add('checked'); else lab.classList.remove('checked');
    }

    updatePriceUI();
  }

  /* -------------------------
     Build order object & save
  --------------------------*/

  // NEW: buildOrderObject yang lebih ketat, normalisasi WA, buat invoice, dan sertakan status
  function buildOrderObject(){
    const nama = $('#ultraNama')?.value.trim() || '';
    const waRaw = $('#ultraWA')?.value.trim() || '';
    const note = $('#ultraNote')?.value.trim() || '';
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue();
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';
    const topping = getToppingValues();
    const taburan = getTaburanValues();
    const jumlahBox = getJumlahBox();

    // validations
    if (!nama) { alert("Nama pemesan harus diisi."); return null; }
    if (!waRaw) { alert("Nomor WhatsApp harus diisi."); return null; }
    // basic phone validation (minimal 9 digits ignoring non-digit)
    const digits = waRaw.replace(/\D/g, '');
    if (digits.length < 9) { alert("Nomor WhatsApp tampak tidak valid."); return null; }

    // normalize WA: jika mulai 0 -> ganti ke 62, jika sudah 62 atau 8xx assume ok
    let waNorm = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (waNorm.startsWith('0')) waNorm = '62' + waNorm.slice(1);
    // if user accidentally provided leading 8xx w/o 0, allow it (convert)
    if (/^8\d{7,}$/.test(waNorm)) waNorm = '62' + waNorm;

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlahBox;
    const discount = calcDiscount(jumlahBox, subtotal);
    const total = subtotal - discount;

    const now = Date.now();
    const invoice = 'INV-' + now;

    // final object structure compatible dengan admin.js
    return {
      invoice: invoice,
      nama: nama,
      wa: waNorm, // normalized e164-like without plus
      jenis: jenis,
      isi: isi,
      mode: mode,
      topping: topping,
      taburan: taburan,
      jumlah: jumlahBox,
      pricePerBox: pricePerBox,
      subtotal: subtotal,
      discount: discount,
      total: total,
      note: note,
      tgl: new Date().toLocaleString('id-ID'),
      status: "Pending" // penting untuk admin
    };
  }

  // NEW: save to unified storage keys: pukisOrders & lastOrder
  function saveOrderLocal(order){
    if (!order) return;
    try {
      let arr = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
      arr.push(order);
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(arr));
      localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order));
    } catch (e){
      console.error('saveOrderLocal error', e);
    }
  }

  /* -------------------------
     Render nota on screen
  --------------------------*/
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function renderNotaOnScreen(order){
    if (!order) return;
    const c = $('#notaContent');
    if (!c) return;
    const toppingText = order.topping && order.topping.length ? order.topping.join(', ') : '-';
    const taburanText = order.taburan && order.taburan.length ? order.taburan.join(', ') : '-';

    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:180px">
          <div style="font-weight:800;color:#5f0000;font-size:14px;margin-bottom:6px;">INVOICE PEMBAYARAN</div>
          <div><strong>Nomor Invoice:</strong> ${escapeHtml(order.invoice)}</div>
          <div><strong>Kepada :</strong> ${escapeHtml(order.nama)}</div>
          <div><strong>Nomor Telp:</strong> ${escapeHtml(order.wa)}</div>
          <div><strong>Catatan:</strong> ${escapeHtml(order.note)}</div>
        </div>
      </div>
      <hr style="margin:8px 0">
      <div>
        <div><strong>Jenis:</strong> ${escapeHtml(order.jenis)} — ${escapeHtml(String(order.isi))} pcs</div>
        <div><strong>Mode:</strong> ${escapeHtml(order.mode)}</div>
        <div><strong>Topping:</strong> ${escapeHtml(toppingText)}</div>
        <div><strong>Taburan:</strong> ${escapeHtml(taburanText)}</div>
        <div><strong>Jumlah Box:</strong> ${escapeHtml(String(order.jumlah))}</div>
        <div><strong>Harga Satuan:</strong> ${formatRp(order.pricePerBox)}</div>
        <div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>
        <div><strong>Diskon:</strong> ${order.discount>0 ? '-' + formatRp(order.discount) : '-'}</div>
        <div style="font-weight:800;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</div>
        <p style="margin-top:10px;font-style:italic">Terima kasih telah berbelanja di toko Kami</p>
      </div>
    `;
    const container = $('#notaContainer');
    if (container) {
      container.style.display = 'flex';
      container.classList.add('show');
    }
    // store globally for fallback handlers
    window._lastNotaData = order;
  }

  /* -------------------------
     Send to WA
  --------------------------*/
  function sendOrderToAdminViaWA(order){
    if (!order) return;
    const lines = [
      `Assalamu'alaikum Admin 🙏`,
      `Ada pesanan baru:`,
      ``,
      `Invoice : ${order.invoice}`,
      `Nama    : ${order.nama}`,
      `WA      : ${order.wa}`,
      `Jenis   : ${order.jenis}`,
      `Isi     : ${order.isi} pcs`,
      `Mode    : ${order.mode}`,
      `Topping : ${order.topping && order.topping.length ? order.topping.join(', ') : '-'}`,
      `Taburan : ${order.taburan && order.taburan.length ? order.taburan.join(', ') : '-'}`,
      `Jumlah  : ${order.jumlah} box`,
      `Catatan : ${order.note || '-'}`,
      ``,
      `Total Bayar: ${formatRp(order.total)}`,
      ``,
      `Mohon bantu cetak invoice. Terima kasih 😊`
    ];
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }
/* =========================================================
   order.js — FINAL (revisi + fitur admin/WA/PDF)
   - Simpan di: assets/js/order.js
   - Pastikan ada assets/images/ttd.png & qris-pukis.jpg
   - Menyatukan: topping UI, kalkulasi harga, nota popup,
     penyimpanan ke localStorage (pukisOrders), lastOrder,
     WA ke admin, dan generator PDF (jsPDF + autotable)
   ======================================================== */

(function () {
  'use strict';

  /* -------------------------
     Konfigurasi & data tetap
  --------------------------*/

  const ADMIN_WA = "6281296668670"; // nomor admin (dalam format E.164 tanpa +)
  const STORAGE_ORDERS_KEY = "pukisOrders";
  const STORAGE_LAST_ORDER_KEY = "lastOrder";

  const ASSET_PREFIX = "assets/images/";
  const QRIS_FILENAME = "qris-pukis.jpg";
  const TTD_FILENAME = "ttd.png";

  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Stroberi","Cappucino","Vanilla","Taro","Matcha"];
  const DOUBLE_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 13000, single: 15000, double: 18000 }, "10": { non: 25000, single: 28000, double: 32000 } }
  };

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // safe rupiah formatter (digit-by-digit)
  function formatRp(n){
    const v = Number(n || 0);
    if (Number.isNaN(v)) return "Rp 0";
    return "Rp " + v.toLocaleString('id-ID');
  }

  /* -------------------------
     Build topping & taburan UI
  --------------------------*/
  function buildToppingUI(){
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;

    singleGroup.innerHTML = '';
    doubleGroup.innerHTML = '';

    SINGLE_TOPPINGS.forEach(t => {
      const id = 'topping_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label');
      lab.className = 'topping-check';
      lab.innerHTML = `<input type="checkbox" name="topping[]" value="${t}" id="${id}"> ${t}`;
      singleGroup.appendChild(lab);
    });

    DOUBLE_TABURAN.forEach(t => {
      const id = 'taburan_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label');
      lab.className = 'taburan-check';
      lab.innerHTML = `<input type="checkbox" name="taburan[]" value="${t}" id="${id}"> ${t}`;
      doubleGroup.appendChild(lab);
    });

    // bind change via event delegation
    [singleGroup, doubleGroup].forEach(g => {
      g.addEventListener('change', function(e){
        if (!e.target) return;
        if (e.target.matches('input[type="checkbox"]')) {
          handleCheckboxChange(e);
        }
      });
    });
  }

  /* -------------------------
     Form helpers
  --------------------------*/
  function getSelectedRadioValue(name){
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }
  function getToppingValues(){ return Array.from(document.querySelectorAll('input[name="topping[]"]:checked')).map(i=>i.value); }
  function getTaburanValues(){ return Array.from(document.querySelectorAll('input[name="taburan[]"]:checked')).map(i=>i.value); }
  function getIsiValue(){ const el = $('#ultraIsi'); return el ? String(el.value) : '5'; }
  function getJumlahBox(){ const el = $('#ultraJumlah'); const v = el ? Number(el.value) : 1; return Number.isFinite(v) && v>0 ? Math.floor(v) : 1; }

  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || 'Original';
    isi = String(isi || '5');
    mode = (mode || 'non').toLowerCase();
    try { return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0; }
    catch(e){ return 0; }
  }

  function calcDiscount(jumlahBox, subtotal){
    // contoh: diskon 1% untuk 5+, 10+ (sesuai kebutuhan)
    if (jumlahBox >= 10) return Math.round(subtotal * 0.01);
    if (jumlahBox >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  /* -------------------------
     Price UI update
  --------------------------*/
  function updatePriceUI(){
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue();
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';
    const jumlah = getJumlahBox();

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    const elPrice = $('#ultraPricePerBox');
    const elSubtotal = $('#ultraSubtotal');
    const elDiscount = $('#ultraDiscount');
    const elGrand = $('#ultraGrandTotal');

    if (elPrice) elPrice.textContent = formatRp(pricePerBox);
    if (elSubtotal) elSubtotal.textContent = formatRp(subtotal);
    if (elDiscount) elDiscount.textContent = discount>0 ? '-' + formatRp(discount) : '-';
    if (elGrand) elGrand.textContent = formatRp(total);

    return { jenis, isi, mode, jumlah, pricePerBox, subtotal, discount, total };
  }

  /* -------------------------
     Topping visibility & validation
  --------------------------*/
  function updateToppingVisibility(){
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;

    if (mode === 'non'){
      singleGroup.style.display = 'none';
      doubleGroup.style.display = 'none';
      singleGroup.querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=false);
      doubleGroup.querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=false);
    } else if (mode === 'single'){
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'none';
      doubleGroup.querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=false);
    } else if (mode === 'double'){
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'flex';
    }
  }

  function handleCheckboxChange(e){
    const isi = Number(getIsiValue()) || 5;
    const target = e.target;
    if (!target) return;
    const isTopping = !!target.closest('#ultraSingleGroup');
    const isTaburan = !!target.closest('#ultraDoubleGroup');

    if (isTopping){
      const selCount = getToppingValues().length;
      if (selCount > isi){
        target.checked = false;
        alert(`Maksimal topping = ${isi} (isi box).`);
      }
    }
    if (isTaburan){
      const selCount = getTaburanValues().length;
      if (selCount > isi){
        target.checked = false;
        alert(`Maksimal taburan = ${isi} (isi box).`);
      }
    }

    // visual
    const lab = target.closest('label');
    if (lab){
      if (target.checked) lab.classList.add('checked'); else lab.classList.remove('checked');
    }

    updatePriceUI();
  }

  /* -------------------------
     Build order object & save
  --------------------------*/

  // NEW: buildOrderObject yang lebih ketat, normalisasi WA, buat invoice, dan sertakan status
  function buildOrderObject(){
    const nama = $('#ultraNama')?.value.trim() || '';
    const waRaw = $('#ultraWA')?.value.trim() || '';
    const note = $('#ultraNote')?.value.trim() || '';
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue();
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';
    const topping = getToppingValues();
    const taburan = getTaburanValues();
    const jumlahBox = getJumlahBox();

    // validations
    if (!nama) { alert("Nama pemesan harus diisi."); return null; }
    if (!waRaw) { alert("Nomor WhatsApp harus diisi."); return null; }
    // basic phone validation (minimal 9 digits ignoring non-digit)
    const digits = waRaw.replace(/\D/g, '');
    if (digits.length < 9) { alert("Nomor WhatsApp tampak tidak valid."); return null; }

    // normalize WA: jika mulai 0 -> ganti ke 62, jika sudah 62 atau 8xx assume ok
    let waNorm = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (waNorm.startsWith('0')) waNorm = '62' + waNorm.slice(1);
    // if user accidentally provided leading 8xx w/o 0, allow it (convert)
    if (/^8\d{7,}$/.test(waNorm)) waNorm = '62' + waNorm;

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlahBox;
    const discount = calcDiscount(jumlahBox, subtotal);
    const total = subtotal - discount;

    const now = Date.now();
    const invoice = 'INV-' + now;

    // final object structure compatible dengan admin.js
    return {
      invoice: invoice,
      nama: nama,
      wa: waNorm, // normalized e164-like without plus
      jenis: jenis,
      isi: isi,
      mode: mode,
      topping: topping,
      taburan: taburan,
      jumlah: jumlahBox,
      pricePerBox: pricePerBox,
      subtotal: subtotal,
      discount: discount,
      total: total,
      note: note,
      tgl: new Date().toLocaleString('id-ID'),
      status: "Pending" // penting untuk admin
    };
  }

  // NEW: save to unified storage keys: pukisOrders & lastOrder
  function saveOrderLocal(order){
    if (!order) return;
    try {
      let arr = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
      arr.push(order);
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(arr));
      localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order));
    } catch (e){
      console.error('saveOrderLocal error', e);
    }
  }

  /* -------------------------
     Render nota on screen
  --------------------------*/
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function renderNotaOnScreen(order){
    if (!order) return;
    const c = $('#notaContent');
    if (!c) return;
    const toppingText = order.topping && order.topping.length ? order.topping.join(', ') : '-';
    const taburanText = order.taburan && order.taburan.length ? order.taburan.join(', ') : '-';

    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:180px">
          <div style="font-weight:800;color:#5f0000;font-size:14px;margin-bottom:6px;">INVOICE PEMBAYARAN</div>
          <div><strong>Nomor Invoice:</strong> ${escapeHtml(order.invoice)}</div>
          <div><strong>Kepada :</strong> ${escapeHtml(order.nama)}</div>
          <div><strong>Nomor Telp:</strong> ${escapeHtml(order.wa)}</div>
          <div><strong>Catatan:</strong> ${escapeHtml(order.note)}</div>
        </div>
      </div>
      <hr style="margin:8px 0">
      <div>
        <div><strong>Jenis:</strong> ${escapeHtml(order.jenis)} — ${escapeHtml(String(order.isi))} pcs</div>
        <div><strong>Mode:</strong> ${escapeHtml(order.mode)}</div>
        <div><strong>Topping:</strong> ${escapeHtml(toppingText)}</div>
        <div><strong>Taburan:</strong> ${escapeHtml(taburanText)}</div>
        <div><strong>Jumlah Box:</strong> ${escapeHtml(String(order.jumlah))}</div>
        <div><strong>Harga Satuan:</strong> ${formatRp(order.pricePerBox)}</div>
        <div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>
        <div><strong>Diskon:</strong> ${order.discount>0 ? '-' + formatRp(order.discount) : '-'}</div>
        <div style="font-weight:800;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</div>
        <p style="margin-top:10px;font-style:italic">Terima kasih telah berbelanja di toko Kami</p>
      </div>
    `;
    const container = $('#notaContainer');
    if (container) {
      container.style.display = 'flex';
      container.classList.add('show');
    }
    // store globally for fallback handlers
    window._lastNotaData = order;
  }

  /* -------------------------
     Send to WA
  --------------------------*/
  function sendOrderToAdminViaWA(order){
    if (!order) return;
    const lines = [
      `Assalamu'alaikum Admin 🙏`,
      `Ada pesanan baru:`,
      ``,
      `Invoice : ${order.invoice}`,
      `Nama    : ${order.nama}`,
      `WA      : ${order.wa}`,
      `Jenis   : ${order.jenis}`,
      `Isi     : ${order.isi} pcs`,
      `Mode    : ${order.mode}`,
      `Topping : ${order.topping && order.topping.length ? order.topping.join(', ') : '-'}`,
      `Taburan : ${order.taburan && order.taburan.length ? order.taburan.join(', ') : '-'}`,
      `Jumlah  : ${order.jumlah} box`,
      `Catatan : ${order.note || '-'}`,
      ``,
      `Total Bayar: ${formatRp(order.total)}`,
      ``,
      `Mohon bantu cetak invoice. Terima kasih 😊`
    ];
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }
