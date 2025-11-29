/* =========================================================
   order.js — FINAL (PART 1)
   - Mengembalikan fungsi asli + tambahan admin/save/pdf hooks
   - Single topping = gaya A (.topping-check) max 5
   - Double: topping max 5 + taburan max 5
   - Semua event, auto-calc, render nota tetap
   ======================================================== */
(function(){
  'use strict';

  // ---------------------- CONFIG ----------------------
  const ADMIN_WA = "6281296668670";
  const STORAGE_ORDERS_KEY = "pukisOrders"; // sinkron dengan admin.js
  const STORAGE_LAST_ORDER_KEY = "lastOrder";

  const ASSET_PREFIX = "assets/images/";
  const QRIS_IMAGE = "qris-pukis.jpg"; // optional
  const TTD_IMAGE = "ttd.png";         // optional

  // Topping lists (sesuaikan jika perlu)
  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino","Taro","Matcha"];
  const DOUBLE_TABURAN  = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  // Price table (sesuaikan dengan harga aktualmu)
  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 12000, single: 15000, double: 17000 }, "10": { non: 21000, single: 28000, double: 32000 } }
  };

  // VALIDATION RULES (sesuai permintaan)
  const MAX_SINGLE_TOPPING = 5; // single mode max
  const MAX_DOUBLE_TOPPING = 5; // double mode: topping main (single) max 5
  const MAX_DOUBLE_TABURAN = 5; // double mode: taburan max 5

  // helpers
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  function formatRp(n){ const v = Number(n||0); if (Number.isNaN(v)) return "Rp 0"; return "Rp " + v.toLocaleString('id-ID'); }
  function escapeHtml(s){ return String(s==null? '': s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // ---------------------- BUILD UI ----------------------
  function buildToppingUI(){
    const singleWrap = $('#ultraSingleGroup');
    const doubleWrap = $('#ultraDoubleGroup');
    if (!singleWrap || !doubleWrap) return;

    singleWrap.innerHTML = '';
    doubleWrap.innerHTML = '';

    // Single toppings — gaya A (.topping-check)
    SINGLE_TOPPINGS.forEach(t => {
      const id = 'topping_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label');
      lab.className = 'topping-check';
      lab.style.margin = '6px';
      lab.innerHTML = `<input type="checkbox" name="topping" value="${t}" id="${id}"> ${t}`;
      singleWrap.appendChild(lab);
    });

    // Double taburan — gaya B (simple label)
    DOUBLE_TABURAN.forEach(t => {
      const id = 'taburan_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label');
      lab.style.margin = '6px';
      lab.innerHTML = `<input type="checkbox" name="taburan" value="${t}" id="${id}"> ${t}`;
      doubleWrap.appendChild(lab);
    });

    // delegate change events for visual .checked & validation
    singleWrap.addEventListener('change', function(e){
      const target = e.target;
      if (!target || !target.matches('input[type="checkbox"]')) return;
      const label = target.closest('label');
      if (label) { if (target.checked) label.classList.add('checked'); else label.classList.remove('checked'); }

      // validate counts depending on mode
      const mode = getSelectedToppingMode();
      if (mode === 'single'){
        const sel = $$('input[name="topping"]:checked').length;
        if (sel > MAX_SINGLE_TOPPING){
          target.checked = false;
          if (label) label.classList.remove('checked');
          alert(`Maksimal ${MAX_SINGLE_TOPPING} topping untuk mode Single.`);
        }
      } else if (mode === 'double'){
        const sel = $$('input[name="topping"]:checked').length;
        if (sel > MAX_DOUBLE_TOPPING){
          target.checked = false;
          if (label) label.classList.remove('checked');
          alert(`Maksimal ${MAX_DOUBLE_TOPPING} topping untuk mode Double.`);
        }
      }
      updatePriceUI();
    });

    doubleWrap.addEventListener('change', function(e){
      const target = e.target;
      if (!target || !target.matches('input[type="checkbox"]')) return;
      const mode = getSelectedToppingMode();
      if (mode === 'double'){
        const selTab = $$('input[name="taburan"]:checked').length;
        if (selTab > MAX_DOUBLE_TABURAN){
          target.checked = false;
          alert(`Maksimal ${MAX_DOUBLE_TABURAN} taburan untuk mode Double.`);
        }
      } else {
        // if not double mode, auto-uncheck taburan
        if (target.checked) { target.checked = false; alert('Taburan hanya aktif pada mode Double.'); }
      }
      updatePriceUI();
    });
  }

  // ---------------------- FORM HELPERS ----------------------
  function getSelectedRadioValue(name){ const r = document.querySelector(`input[name="${name}"]:checked`); return r? r.value : null; }
  function getToppingValues(){ return Array.from(document.querySelectorAll('input[name="topping"]:checked')).map(i=>i.value); }
  function getTaburanValues(){ return Array.from(document.querySelectorAll('input[name="taburan"]:checked')).map(i=>i.value); }
  function getIsiValue(){ const el = $('#ultraIsi'); return el? String(el.value) : '5'; }
  function getJumlahBox(){ const el = $('#ultraJumlah'); if (!el) return 1; const v = parseInt(el.value,10); return (isNaN(v)||v<1)?1:v; }

  // ---------------------- PRICE LOGIC ----------------------
  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || 'Original'; isi = String(isi || '5'); mode = (mode||'non').toLowerCase();
    try { return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0; }
    catch(e) { return 0; }
  }

  function calcDiscount(jumlahBox, subtotal){
    // keep business rule: fixed Rp1000 for 10+ OR percentage if you prefer.
    if (jumlahBox >= 10) return 1000;
    if (jumlahBox >= 5) return Math.round(subtotal * 0.01);
    return 0;
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

    const elPrice = $('#ultraPricePerBox');
    const elSubtotal = $('#ultraSubtotal');
    const elDiscount = $('#ultraDiscount');
    const elGrand = $('#ultraGrandTotal');

    if (elPrice) elPrice.textContent = formatRp(pricePerBox);
    if (elSubtotal) elSubtotal.textContent = formatRp(subtotal);
    if (elDiscount) elDiscount.textContent = discount>0 ? '-' + formatRp(discount) : '-';
    if (elGrand) elGrand.textContent = formatRp(total);

    return { pricePerBox, subtotal, discount, total };
  }

  function getSelectedToppingMode(){ return getSelectedRadioValue('ultraToppingMode') || 'non'; }

  // ---------------------- BUILD ORDER OBJECT ----------------------
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

    const nama = $('#ultraNama') ? $('#ultraNama').value.trim() : '-';
    const waRaw = $('#ultraWA') ? $('#ultraWA').value.trim() : '-';
    const note = $('#ultraNote') ? $('#ultraNote').value.trim() : '-';

    // basic validation
    if (!nama) { alert('Nama pemesan harus diisi.'); return null; }
    if (!waRaw) { alert('Nomor WA harus diisi.'); return null; }
    const digits = waRaw.replace(/\D/g,'');
    if (digits.length < 9) { alert('Nomor WA tampak tidak valid (min 9 digit).'); return null; }

    // normalize WA
    let wa = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (/^8\d{6,}$/.test(wa)) wa = '62' + wa;

    const invoice = 'INV-' + Date.now();

    const order = {
      invoice,
      nama,
      wa,
      jenis,
      isi,
      mode,
      topping,
      taburan,
      jumlah: jumlahBox,
      pricePerBox,
      subtotal,
      discount,
      total,
      note,
      tgl: new Date().toLocaleString('id-ID'),
      status: 'Pending'
    };

    return order;
  }

  // ---------------------- STORAGE ----------------------
  function saveOrderLocal(order){
    if (!order) return;
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
      arr.push(order);
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(arr));
      localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order));
    } catch(e){
      console.error('saveOrderLocal error', e);
    }
  }

  function getLastOrder(){
    try { return JSON.parse(localStorage.getItem(STORAGE_LAST_ORDER_KEY) || 'null'); }
    catch(e){ return null; }
  }

  // ---------------------- RENDER NOTA POPUP ----------------------
  function renderNotaOnScreen(order){
    if (!order) return;
    const c = $('#notaContent');
    if (!c) return;
    const toppingText = order.topping && order.topping.length ? order.topping.join(', ') : '-';
    const taburanText = order.taburan && order.taburan.length ? order.taburan.join(', ') : '-';

    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="font-weight:800;color:#5f0000;font-size:14px;margin-bottom:6px;">INVOICE PEMESANAN</div>
          <div><strong>Invoice:</strong> ${escapeHtml(order.invoice)}</div>
          <div><strong>Nama:</strong> ${escapeHtml(order.nama)}</div>
          <div><strong>WA:</strong> ${escapeHtml(order.wa)}</div>
          <div><strong>Tanggal:</strong> ${escapeHtml(order.tgl)}</div>
        </div>
      </div>
      <hr style="margin:8px 0">
      <div>
        <div><strong>Jenis:</strong> ${escapeHtml(order.jenis)} — ${escapeHtml(String(order.isi))} pcs</div>
        <div><strong>Mode:</strong> ${escapeHtml(order.mode)}</div>
        <div><strong>Topping:</strong> ${escapeHtml(toppingText)}</div>
        <div><strong>Taburan:</strong> ${escapeHtml(taburanText)}</div>
        <div><strong>Jumlah:</strong> ${escapeHtml(String(order.jumlah))} box</div>
        <div><strong>Harga Satuan:</strong> ${formatRp(order.pricePerBox)}</div>
        <div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>
        <div><strong>Diskon:</strong> ${order.discount>0 ? '-' + formatRp(order.discount) : '-'}</div>
        <div style="font-weight:800;margin-top:6px;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</div>
        <p style="margin-top:10px;font-style:italic">Terima kasih telah berbelanja di Pukis Lumer Aulia.</p>
      </div>
    `;
    const container = $('#notaContainer');
    if (container) { container.style.display = 'flex'; container.classList.add('show'); }
    // store lastOrder for other handlers
    try { localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order)); } catch(e){}
    window._lastNota = order;
  }

  // ---------------------- SEND TO ADMIN WA ----------------------
  function sendOrderToAdminViaWA(order){
    if (!order) return;
    const lines = [
      "Assalamu'alaikum Admin 🙏",
      "Ada pesanan baru:",
      "",
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
      "",
      `Total Bayar: ${formatRp(order.total)}`,
      "",
      "Mohon bantu cetak invoice. Terima kasih 😊"
    ];
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }

  // ---------------------- Attach listeners (form + buttons) ----------------------
  function attachFormListeners(){
    // build topping UI
    buildToppingUI();

    // initial visibility based on current selected mode
    updateToppingVisibility();

    // watch mode change
    $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', () => { updateToppingVisibility(); updatePriceUI(); }));

    // watch jenis
    $$('input[name="ultraJenis"]').forEach(r => r.addEventListener('change', updatePriceUI));

    // watch isi change (although validation doesn't depend on isi in final rule)
    $('#ultraIsi')?.addEventListener('change', updatePriceUI);

    // watch jumlah
    $('#ultraJumlah')?.addEventListener('input', updatePriceUI);

    // form submit (buat nota)
    const form = $('#formUltra') || document.querySelector('#form-ultra') || document.querySelector('form#formUltra');
    if (form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const order = buildOrderObject();
        if (!order) return;
        saveOrderLocal(order);
        renderNotaOnScreen(order);
      });
    }

    // send admin button
    const sendBtn = $('#ultraSendAdmin');
    if (sendBtn){
      sendBtn.addEventListener('click', function(e){
        e.preventDefault();
        const order = buildOrderObject();
        if (!order) return;
        saveOrderLocal(order);
        sendOrderToAdminViaWA(order);
        alert('Permintaan cetak sudah dikirim ke WhatsApp Admin.');
      });
    }

    // nota close
    const notaClose = $('#notaClose');
    if (notaClose) notaClose.addEventListener('click', () => { const nc = $('#notaContainer'); if (nc) { nc.classList.remove('show'); nc.style.display = 'none'; } });

    // print/pdf button (uses lastOrder)
    const printBtn = $('#notaPrint');
    if (printBtn){
      printBtn.addEventListener('click', async function(e){
        e.preventDefault();
        let last = getLastOrder();
        if (!last) { alert('Data nota belum tersedia. Silakan buat nota terlebih dahulu.'); return; }
        if (typeof window.generatePdf !== 'function'){
          // try to attach factory if available
          if (window.makeGeneratePdf && (window.jspdf || window.jsPDF)) {
            window.generatePdf = window.makeGeneratePdf(window.jspdf || window.jsPDF);
          }
        }
        if (typeof window.generatePdf === 'function'){
          await window.generatePdf(last);
        } else {
          alert('PDF generator belum siap. Pastikan library jsPDF dimuat.');
        }
      });
    }
  }

  // ---------------------- Topping visibility ----------------------
  function updateToppingVisibility(){
    const mode = getSelectedToppingMode();
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;
    if (mode === 'non'){
      singleGroup.style.display = 'none';
      doubleGroup.style.display = 'none';
      // uncheck existing
      $$('input[name="topping"]:checked').forEach(i => { i.checked = false; i.closest('label')?.classList.remove('checked'); });
      $$('input[name="taburan"]:checked').forEach(i => { i.checked = false; });
    } else if (mode === 'single'){
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'none';
    } else if (mode === 'double'){
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'flex';
    }
  }

  // ---------------------- INIT ----------------------
  function init(){
    attachFormListeners();
    updatePriceUI();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // expose for debug / quick access
  window._orderjs_final = {
    buildToppingUI, updateToppingVisibility, updatePriceUI, buildOrderObject, saveOrderLocal, getLastOrder, sendOrderToAdminViaWA, renderNotaOnScreen
  };

})(); // end PART 1
/* =========================================================
   order.js — FINAL (PART 2)
   - PDF generator (jsPDF + autoTable if available)
   - Load images (QRIS, TTD) as dataURL safely
   - Expose window.makeGeneratePdf and auto-attach window.generatePdf
   ========================================================= */
(function(){
  'use strict';

  const ASSET_PREFIX = "assets/images/"; // same as Part 1
  const QRIS_FILE = "qris-pukis.jpg"; // optional; keep same filename as assets
  const TTD_FILE = "ttd.png";

  // small formatRp for PDF usage (kept consistent)
  function formatRp(num){
    const n = Number(num || 0);
    if (Number.isNaN(n)) return "Rp 0";
    return "Rp " + n.toLocaleString('id-ID');
  }

  // load image to dataURL (works for PNG/JPG)
  function loadImageAsDataURL(path, timeoutMs = 4000){
    return new Promise((resolve) => {
      if (!path) return resolve(null);
      const img = new Image();
      let settled = false;
      img.crossOrigin = "anonymous";
      const timer = setTimeout(()=> {
        if (!settled){ settled = true; resolve(null); }
      }, timeoutMs);
      img.onload = () => {
        if (settled) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = canvas.toDataURL('image/png');
          settled = true;
          clearTimeout(timer);
          resolve(data);
        } catch (e){
          settled = true;
          clearTimeout(timer);
          resolve(null);
        }
      };
      img.onerror = () => {
        if (!settled){ settled = true; clearTimeout(timer); resolve(null); }
      };
      img.src = path;
    });
  }

  // factory that returns generatePdf(order)
  function makeGeneratePdf(JS){
    // JS can be window.jspdf or window.jsPDF or the module object with .jsPDF
    let jsPDFCtor = null;
    if (!JS) {
      if (window.jspdf && window.jspdf.jsPDF) jsPDFCtor = window.jspdf.jsPDF;
      else if (window.jsPDF) jsPDFCtor = window.jsPDF;
    } else {
      jsPDFCtor = JS.jsPDF ? JS.jsPDF : JS;
    }
    if (!jsPDFCtor) {
      // no jsPDF available, factory will still return a function that errors
      return async function generatePdfUnavailable(){
        throw new Error('jsPDF tidak tersedia');
      };
    }

    return async function generatePdf(order){
      try {
        if (!order) throw new Error('Order tidak diberikan ke generatePdf');

        const doc = new jsPDFCtor({ unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        // load optional assets (non-blocking if failed)
        const qrisPath = ASSET_PREFIX + QRIS_FILE;
        const ttdPath = ASSET_PREFIX + TTD_FILE;

        const [qrisData, ttdData] = await Promise.all([
          loadImageAsDataURL(qrisPath).catch(()=>null),
          loadImageAsDataURL(ttdPath).catch(()=>null)
        ]);

        // Header
        doc.setFont('helvetica','bold');
        doc.setFontSize(16);
        doc.setTextColor(0,0,0);
        doc.text('PUKIS LUMER AULIA', W/2, 15, { align: 'center' });

        // Subheader / invoice label
        doc.setFont('helvetica','normal');
        doc.setFontSize(11);
        doc.text('Invoice Pemesanan', 14, 25);

        // metadata block
        let y = 34;
        doc.setFontSize(10);
        doc.text(`Order ID: ${order.orderID || order.invoice || '-'}`, 14, y);
        doc.text(`Tanggal: ${order.tgl || new Date().toLocaleString('id-ID')}`, W-14, y, { align: 'right' });
        y += 7;
        doc.text(`No. Antrian: ${order.antrian || '-'}`, W-14, y, { align: 'right' });
        doc.text(`Nama: ${order.nama || '-'}`, 14, y);
        y += 7;
        doc.setFont('helvetica','italic');
        doc.text(`Catatan: ${order.note || '-'}`, 14, y);
        doc.setFont('helvetica','normal');
        y += 10;

        // Build table rows (Item / Keterangan)
        const toppingTxt = order.topping && order.topping.length ? order.topping.join(', ') : '-';
        const taburanTxt = order.taburan && order.taburan.length ? order.taburan.join(', ') : '-';

        const rows = [
          ['Jenis', order.jenis || '-'],
          ['Isi Box', (order.isi || '-') + ' pcs'],
          ['Mode', order.mode || '-'],
          ['Topping', toppingTxt],
          ['Taburan', taburanTxt],
          ['Jumlah Box', (order.jumlah || order.jumlahBox || 0) + ' box'],
          ['Harga Satuan', formatRp(order.pricePerBox || 0)],
          ['Subtotal', formatRp(order.subtotal || 0)],
          ['Diskon', order.discount > 0 ? '-' + formatRp(order.discount) : '-'],
          ['Total Bayar', formatRp(order.total || 0)]
        ];

        // If autoTable available, use it
        if (typeof doc.autoTable === 'function'){
          doc.autoTable({
            startY: y,
            head: [['Item','Keterangan']],
            body: rows,
            styles: { fontSize: 10, textColor: 0 },
            headStyles: { fillColor: [255,105,180], textColor: 255 }, // pink header
            alternateRowStyles: { fillColor: [230,240,255] }, // light blue rows
            columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: W - 45 - 28 } }
          });
        } else {
          // simple fallback table
          let ty = y;
          rows.forEach(r => {
            doc.text(`${r[0]}: ${r[1]}`, 14, ty);
            ty += 6;
          });
        }

        const endTableY = doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : (y + (rows.length*6) + 8);

        // QRIS on left under table (40 x 50 mm)
        if (qrisData){
          try {
            doc.addImage(qrisData, 'PNG', 14, endTableY + 8, 40, 50);
            doc.setFontSize(9);
            doc.text('Scan QRIS untuk pembayaran', 14 + 46, endTableY + 30);
          } catch(e){}
        }

        // Signature area right
        const sigX = W - 14 - 50; // leave margin
        let sigY = Math.max(endTableY + 8, 120);
        doc.setFontSize(10);
        doc.text('Hormat Kami,', sigX + 8, sigY);
        sigY += 6;
        if (ttdData){
          try {
            doc.addImage(ttdData, 'PNG', sigX, sigY, 40, 30);
            sigY += 36;
          } catch(e){
            sigY += 30;
          }
        } else {
          sigY += 30;
        }
        doc.setFont('helvetica','bold');
        doc.setFontSize(10);
        doc.text('Pukis Lumer Aulia', sigX + 8, sigY);

        // Watermark large center
        try {
          doc.setTextColor(150,150,150);
          doc.setFont('helvetica','bold');
          doc.setFontSize(48);
          // jsPDF doesn't support opacity param in all versions; keep it simple
          doc.text('Pukis Lumer Aulia', W/2, H/2, { align: 'center' });
          doc.setTextColor(0,0,0);
        } catch(e){
          // ignore watermark errors
          doc.setTextColor(0,0,0);
        }

        // Footer thank you
        doc.setFontSize(13);
        doc.setFont('helvetica','bold');
        doc.text('Terima kasih telah berbelanja di toko Kami', W/2, H - 15, { align: 'center' });

        // Filename and save
        const safeName = (order.nama || 'Pelanggan').replace(/\s+/g,'_').replace(/[^\w\-_.]/g,'');
        const fileName = `Invoice_${safeName}_${order.orderID || order.invoice || Date.now()}.pdf`;
        doc.save(fileName);
        return true;
      } catch(err){
        console.error('generatePdf error', err);
        alert('Gagal membuat PDF: ' + (err && err.message ? err.message : err));
        return false;
      }
    };
  }

  // Expose factory as window.makeGeneratePdf (used in Part1)
  window.makeGeneratePdf = makeGeneratePdf;

  // If jsPDF already loaded, auto-create window.generatePdf
  (function tryAttachNow(){
    const lib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf : (window.jsPDF ? window.jsPDF : null);
    if (lib){
      try {
        window.generatePdf = makeGeneratePdf(lib);
      } catch(e){}
    }
  })();

  // Also expose a helper to wait for jsPDF and attach (used elsewhere)
  window._attachGeneratePdfWhenReady = async function(timeoutMs = 7000){
    const start = Date.now();
    return new Promise((resolve) => {
      const id = setInterval(() => {
        const lib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf : (window.jsPDF ? window.jsPDF : null);
        if (lib){
          try {
            window.generatePdf = makeGeneratePdf(lib);
            clearInterval(id);
            resolve(true);
            return;
          } catch(e){}
        }
        if (Date.now() - start > timeoutMs){
          clearInterval(id);
          resolve(false);
        }
      }, 200);
    });
  };

})(); // end PART 2
