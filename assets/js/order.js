/* =========================================================
   order.js — FINAL (single-file, tolerant to HTML)
   - Merge Part1/2/3
   - Safe guards: create missing hidden elements (notaPrint) so JS won't fail
   - Keeps all features: toppings, auto-calc, taburan, PDF, saveLastNota
   - No auto WA send, no redirect loops
   ========================================================= */

(function(){
  'use strict';

  // ---------------------- CONFIG ----------------------
  const ADMIN_WA = "6281296668670";
  const STORAGE_ORDERS_KEY = "pukisOrders";
  const STORAGE_LAST_ORDER_KEY = "lastOrder";

  const ASSET_PREFIX = "assets/images/";
  const QRIS_IMAGE = "qris-pukis.jpg";
  const TTD_IMAGE = "ttd.png";

  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino","Taro","Matcha"];
  const DOUBLE_TABURAN  = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 12000, single: 15000, double: 17000 }, "10": { non: 21000, single: 28000, double: 32000 } }
  };

  const MAX_SINGLE_TOPPING = 5;
  const MAX_DOUBLE_TOPPING = 5;
  const MAX_DOUBLE_TABURAN = 5;

  // helpers
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function formatRp(n){ const v = Number(n || 0); if (Number.isNaN(v)) return "Rp 0"; return "Rp " + v.toLocaleString('id-ID'); }
  function escapeHtml(s){ return String(s==null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // ----------------------
  //  TOLERANCE HELPERS
  //  - Create hidden notaPrint if missing (to keep JS paths stable)
  //  - Ensure containers exist (ultraSingleGroup, ultraDoubleGroup, notaContainer, notaContent)
  // ----------------------
  function ensureElement(selector, tag='div', attributes={}){
    let el = document.querySelector(selector);
    if (el) return el;
    // create and append near form if possible, else append to body
    el = document.createElement(tag);
    // apply attributes
    Object.entries(attributes).forEach(([k,v]) => el.setAttribute(k, v));
    // If selector is id like '#notaPrint' append to notaContainer if exists
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      el.id = id;
    }
    // try to find sensible parent
    const form = document.querySelector('#formUltra') || document.querySelector('#form-ultra');
    if (form && (selector === '#ultraSingleGroup' || selector === '#ultraDoubleGroup')) {
      form.appendChild(el);
    } else {
      document.body.appendChild(el);
    }
    return el;
  }

  function ensureRequiredUI(){
    ensureElement('#ultraSingleGroup', 'div', { 'class': 'topping-wrap', 'style': 'display:none;margin-bottom:8px;' });
    ensureElement('#ultraDoubleGroup', 'div', { 'class': 'topping-wrap', 'style': 'display:none;margin-bottom:8px;' });
    ensureElement('#notaContainer', 'div', { 'class':'nota-overlay','style':'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:none;align-items:center;justify-content:center;' });
    ensureElement('#notaContent', 'div', { 'style':'margin-top:12px;font-size:14px;line-height:1.4;' });
    // create hidden notaPrint if not exists (JS expects it; keep hidden to not change UI)
    let printBtn = document.querySelector('#notaPrint');
    if (!printBtn){
      printBtn = document.createElement('button');
      printBtn.id = 'notaPrint';
      printBtn.type = 'button';
      printBtn.style.display = 'none';
      document.body.appendChild(printBtn);
    }
  }

  // =====================================================
  //   BUILD TOPPING UI
  // =====================================================
  function buildToppingUI(){
    const singleWrap = $('#ultraSingleGroup');
    const doubleWrap = $('#ultraDoubleGroup');
    if (!singleWrap || !doubleWrap) return;

    singleWrap.innerHTML = '';
    doubleWrap.innerHTML = '';

    SINGLE_TOPPINGS.forEach(t => {
      const id = 'topping_' + t.toLowerCase().replace(/\s+/g,'_');
      const label = document.createElement('label');
      label.className = 'topping-check';
      label.style.margin = '6px';
      label.innerHTML = `<input type="checkbox" name="topping" value="${t}" id="${id}"> ${t}`;
      singleWrap.appendChild(label);
    });

    DOUBLE_TABURAN.forEach(t => {
      const id = 'taburan_' + t.toLowerCase().replace(/\s+/g,'_');
      const label = document.createElement('label');
      label.style.margin = '6px';
      label.innerHTML = `<input type="checkbox" name="taburan" value="${t}" id="${id}"> ${t}`;
      doubleWrap.appendChild(label);
    });

    singleWrap.addEventListener('change', e => {
      if (!e.target.matches('input[type="checkbox"]')) return;
      const mode = getSelectedToppingMode();
      const label = e.target.closest('label');
      if (label){
        if (e.target.checked) label.classList.add('checked'); else label.classList.remove('checked');
      }
      if (mode === 'single'){
        const sel = $$('input[name="topping"]:checked').length;
        if (sel > MAX_SINGLE_TOPPING){
          e.target.checked = false; label.classList.remove('checked');
          alert(`Maksimal ${MAX_SINGLE_TOPPING} topping untuk mode Single.`);
        }
      }
      if (mode === 'double'){
        const sel = $$('input[name="topping"]:checked').length;
        if (sel > MAX_DOUBLE_TOPPING){
          e.target.checked = false; label.classList.remove('checked');
          alert(`Maksimal ${MAX_DOUBLE_TOPPING} topping untuk mode Double.`);
        }
      }
      updatePriceUI();
    });

    doubleWrap.addEventListener('change', e => {
      if (!e.target.matches('input[type="checkbox"]')) return;
      const mode = getSelectedToppingMode();
      if (mode !== 'double'){
        e.target.checked = false; alert("Taburan hanya aktif di mode Double."); return;
      }
      const sel = $$('input[name="taburan"]:checked').length;
      if (sel > MAX_DOUBLE_TABURAN){ e.target.checked = false; alert(`Maksimal ${MAX_DOUBLE_TABURAN} taburan.`); }
      updatePriceUI();
    });
  }

  // =====================================================
  //   RADIO / INPUT HELPERS
  // =====================================================
  const getSelectedRadioValue = (name) => {
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  };
  const getToppingValues = () => $$('input[name="topping"]:checked').map(i=>i.value);
  const getTaburanValues = () => $$('input[name="taburan"]:checked').map(i=>i.value);
  const getIsiValue = () => { const el = $('#ultraIsi'); return el ? String(el.value) : '5'; };
  const getJumlahBox = () => { const el = $('#ultraJumlah'); if (!el) return 1; const v=parseInt(el.value,10); return (isNaN(v)||v<1)?1:v; };

  function getSelectedToppingMode(){ return getSelectedRadioValue('ultraToppingMode') || 'non'; }

  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || "Original"; isi = String(isi || "5"); mode = (mode||"non").toLowerCase();
    try { return BASE_PRICE[jenis][isi][mode] || 0; } catch(e){ return 0; }
  }

  function calcDiscount(jumlahBox, subtotal){
    if (jumlahBox >= 10) return 1000;
    if (jumlahBox >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePriceUI(){
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue(); const mode = getSelectedToppingMode(); const jumlah = getJumlahBox();
    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlah; const discount = calcDiscount(jumlah, subtotal); const total = subtotal - discount;
    $('#ultraPricePerBox')?.textContent = formatRp(pricePerBox);
    $('#ultraSubtotal')?.textContent = formatRp(subtotal);
    $('#ultraDiscount')?.textContent = discount>0 ? '-' + formatRp(discount) : '-';
    $('#ultraGrandTotal')?.textContent = formatRp(total);
    return { pricePerBox, subtotal, discount, total };
  }

  // =====================================================
  //   BUILD ORDER OBJECT
  // =====================================================
  function buildOrderObject(){
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue(); const mode = getSelectedToppingMode(); const jumlahBox = getJumlahBox();
    const topping = getToppingValues(); const taburan = getTaburanValues();
    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlahBox; const discount = calcDiscount(jumlahBox, subtotal); const total = subtotal - discount;
    const nama = $('#ultraNama')?.value.trim() || '';
    const waRaw = $('#ultraWA')?.value.trim() || '';
    const note = $('#ultraNote')?.value.trim() || '-';
    if (!nama){ alert("Nama harus diisi."); return null; }
    if (!waRaw){ alert("Nomor WA harus diisi."); return null; }
    let digits = waRaw.replace(/\D/g,'');
    if (digits.length < 9){ alert("Nomor WA tidak valid."); return null; }
    let wa = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (/^8\d{6,}$/.test(wa)) wa = '62' + wa;
    const invoice = "INV-" + Date.now();
    return { invoice, nama, wa, jenis, isi, mode, topping, taburan, jumlah: jumlahBox, pricePerBox, subtotal, discount, total, note, tgl: new Date().toLocaleString('id-ID'), status: "Pending" };
  }

  // =====================================================
  //   STORAGE
  // =====================================================
  function saveOrderLocal(order){
    if (!order) return;
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
      arr.push(order);
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(arr));
      localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order));
      // also set generic lastOrder key for compatibility
      localStorage.setItem("lastOrder", JSON.stringify(order));
      // expose for fallback UI
      window._lastNotaData = order;
    } catch(e){ console.error('saveOrderLocal error', e); }
  }

  function getLastOrder(){
    try { return JSON.parse(localStorage.getItem("lastOrder") || 'null'); } catch(e){ return null; }
  }

  // =====================================================
  //   SAVE LAST NOTA (explicit patch)
  // =====================================================
  function saveLastNota(order){
    try { localStorage.setItem("lastOrder", JSON.stringify(order)); window._lastNotaData = order; } catch(e){ console.error(e); }
  }

  // =====================================================
  //   RENDER NOTA POPUP
  // =====================================================
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
    if (container){ container.style.display = 'flex'; container.classList.add('show'); }
    try { localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order)); } catch(e){}
    window._lastNota = order;
  }

  // =====================================================
  //   SEND TO ADMIN VIA WA (manual)
  // =====================================================
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

  // =====================================================
  //   ATTACH LISTENERS
  // =====================================================
  function attachFormListeners(){
    // ensure required UI elements exist
    ensureRequiredUI();

    // build topping UI
    buildToppingUI();

    // initial visibility
    updateToppingVisibility();

    // watchers
    document.querySelectorAll('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', () => { updateToppingVisibility(); updatePriceUI(); }));
    document.querySelectorAll('input[name="ultraJenis"]').forEach(r => r.addEventListener('change', updatePriceUI));
    $('#ultraIsi')?.addEventListener('change', updatePriceUI);
    $('#ultraJumlah')?.addEventListener('input', updatePriceUI);

    // form submit
    const form = document.querySelector('#formUltra') || document.querySelector('#form-ultra');
    if (form){
      // remove previously attached submit handler if any (defensive)
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const order = buildOrderObject();
        if (!order) return;
        saveOrderLocal(order);
        renderNotaOnScreen(order);
      });
    }

    // send admin button
    const sendBtn = document.querySelector('#ultraSendAdmin');
    if (sendBtn){
      sendBtn.addEventListener('click', function(e){
        e.preventDefault();
        const order = getLastOrder();
        if (!order){ alert('Belum ada nota yang dibuat.'); return; }
        sendOrderToAdminViaWA(order);
        alert('Permintaan cetak sudah dikirim ke WhatsApp Admin.');
      });
    }

    // nota close
    const notaClose = document.querySelector('#notaClose');
    if (notaClose) notaClose.addEventListener('click', () => { const nc = $('#notaContainer'); if (nc){ nc.classList.remove('show'); nc.style.display = 'none'; } });

    // print/pdf button (if exists) -> uses window.generatePdf
    const printBtn = document.querySelector('#notaPrint');
    if (printBtn){
      printBtn.addEventListener('click', async function(e){
        e.preventDefault();
        const last = getLastOrder();
        if (!last){ alert('Data nota belum tersedia. Silakan buat nota terlebih dahulu.'); return; }
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

    // fallback buttons inside notaContainer: notaAskAdmin & notaSendWA -> keep them working even if order.js runs late
    const notaAskAdmin = document.querySelector('#notaAskAdmin');
    if (notaAskAdmin){
      notaAskAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        const last = getLastOrder();
        if (!last){ alert('Belum ada nota. Silakan buat nota terlebih dahulu.'); return; }
        // open WA asking admin to print (not auto-send)
        sendOrderToAdminViaWA(last);
      });
    }
    const notaSendWA = document.querySelector('#notaSendWA');
    if (notaSendWA){
      notaSendWA.addEventListener('click', (e) => {
        e.preventDefault();
        const last = getLastOrder();
        if (!last){ alert('Belum ada nota. Silakan buat nota terlebih dahulu.'); return; }
        // quick summary to admin
        const msg = `Order baru:\nInvoice: ${last.invoice}\nNama: ${last.nama}\nTotal: ${formatRp(last.total)}`;
        window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, '_blank');
      });
    }
  }

  // =====================================================
  //   VISIBILITY
  // =====================================================
  function updateToppingVisibility(){
    const mode = getSelectedToppingMode();
    const singleGroup = document.querySelector('#ultraSingleGroup');
    const doubleGroup = document.querySelector('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;
    if (mode === 'non'){
      singleGroup.style.display = 'none'; doubleGroup.style.display = 'none';
      document.querySelectorAll('input[name="topping"]:checked').forEach(i=>{ i.checked=false; i.closest('label')?.classList.remove('checked'); });
      document.querySelectorAll('input[name="taburan"]:checked').forEach(i=> i.checked=false);
    } else if (mode === 'single'){
      singleGroup.style.display = 'flex'; doubleGroup.style.display = 'none';
    } else if (mode === 'double'){
      singleGroup.style.display = 'flex'; doubleGroup.style.display = 'flex';
    }
  }

  // =====================================================
  //   PDF PART (makeGeneratePdf & auto attach)
  // =====================================================
  // load image to data URL
  function loadImageAsDataURL(path, timeoutMs = 5000){
    return new Promise(resolve => {
      if (!path) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      let done=false;
      const timer = setTimeout(()=>{ if(!done){ done=true; resolve(null); } }, timeoutMs);
      img.onload = ()=>{
        if(done) return;
        done=true; clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img,0,0);
          resolve(canvas.toDataURL('image/png'));
        } catch(e){ resolve(null); }
      };
      img.onerror = ()=>{ if(!done){ done=true; clearTimeout(timer); resolve(null); } };
      img.src = path;
    });
  }

  function makeGeneratePdf(lib){
    let jsPDFCtor = null;
    if (lib?.jsPDF) jsPDFCtor = lib.jsPDF;
    else if (window.jsPDF) jsPDFCtor = window.jsPDF;
    if (!jsPDFCtor){
      return async function(){ alert('jsPDF belum dimuat.'); };
    }
    return async function generatePdf(order){
      try {
        if (!order){ alert('Order tidak ditemukan.'); return false; }
        const doc = new jsPDFCtor({ unit:'mm', format:'a4' });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();
        const [qrisPng, ttdPng] = await Promise.all([
          loadImageAsDataURL(ASSET_PREFIX + QRIS_IMAGE),
          loadImageAsDataURL(ASSET_PREFIX + TTD_IMAGE)
        ]);
        doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('PUKIS LUMER AULIA', W/2, 15, { align:'center' });
        doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.text('Invoice Pemesanan', 14, 25);
        let y = 34; doc.setFontSize(10);
        doc.text(`Invoice : ${order.invoice}`, 14, y);
        doc.text(`Tanggal : ${order.tgl || '-'}`, W-14, y, { align:'right' }); y += 7;
        doc.text(`Nama    : ${order.nama}`, 14, y);
        doc.text(`No. WA  : ${order.wa}`, W-14, y, { align:'right' }); y += 10;
        const toppingTxt = order.topping?.length ? order.topping.join(', ') : '-';
        const taburanTxt = order.taburan?.length ? order.taburan.join(', ') : '-';
        const rows = [
          ['Jenis', order.jenis],
          ['Isi Box', order.isi + ' pcs'],
          ['Mode', order.mode],
          ['Topping', toppingTxt],
          ['Taburan', taburanTxt],
          ['Jumlah Box', order.jumlah + ' box'],
          ['Harga Satuan', formatRp(order.pricePerBox)],
          ['Subtotal', formatRp(order.subtotal)],
          ['Diskon', order.discount>0 ? '-' + formatRp(order.discount) : '-'],
          ['Total Bayar', formatRp(order.total)]
        ];
        if (typeof doc.autoTable === 'function'){
          doc.autoTable({ startY: y, head:[['Item','Keterangan']], body: rows, styles:{ fontSize:10 }, headStyles:{ fillColor:[255,105,180], textColor:255 }, alternateRowStyles:{ fillColor:[230,240,255] } });
          y = doc.lastAutoTable.finalY + 10;
        } else {
          rows.forEach(r => { doc.text(`${r[0]} : ${r[1]}`, 14, y); y += 6; });
          y += 10;
        }
        if (qrisPng){ try { doc.addImage(qrisPng,'PNG',14,y,40,45); doc.setFontSize(9); doc.text('Scan QRIS untuk pembayaran', 14, y + 50); } catch(e){} }
        const sigX = W - 14 - 40; let sigY = y;
        doc.setFontSize(10); doc.text('Hormat Kami,', sigX, sigY); sigY += 6;
        if (ttdPng){ try { doc.addImage(ttdPng,'PNG',sigX-5,sigY,40,25); sigY += 30; } catch(e){ sigY += 25; } } else { sigY += 25; }
        doc.setFont('helvetica','bold'); doc.text('Pukis Lumer Aulia', sigX, sigY);
        try { doc.setFontSize(45); doc.setTextColor(180,180,180); doc.setFont('helvetica','bold'); doc.text('Pukis Lumer Aulia', W/2, H/2, { align:'center' }); doc.setTextColor(0,0,0); } catch(e){}
        doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Terima kasih telah berbelanja ❤️', W/2, H-12, { align:'center' });
        const safeName = (order.nama || 'Pelanggan').replace(/\s+/g,'_').replace(/[^\w\-_.]/g,'');
        const fileName = `Invoice_${safeName}_${order.invoice}.pdf`;
        doc.save(fileName);
        return true;
      } catch(err){ console.error('generatePdf error', err); alert('Gagal membuat PDF.'); return false; }
    };
  }

  window.makeGeneratePdf = makeGeneratePdf;

  (function tryAttachNow(){
    const lib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf : (window.jsPDF ? window.jsPDF : null);
    if (lib){
      try { window.generatePdf = makeGeneratePdf(lib); } catch(e) {}
    }
  })();

  // =====================================================
  //   INIT
  // =====================================================
  function init(){
    ensureRequiredUI();
    attachFormListeners();
    updatePriceUI();
    // Defensive: if jsPDF loads later, auto attach
    setTimeout(() => {
      const lib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf : (window.jsPDF ? window.jsPDF : null);
      if (lib && !window.generatePdf){
        window.generatePdf = makeGeneratePdf(lib);
      }
    }, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // Expose for debug
  window._orderjs = {
    buildToppingUI, updatePriceUI, buildOrderObject, saveOrderLocal, getLastOrder, renderNotaOnScreen, sendOrderToAdminViaWA, saveLastNota
  };

})(); // end file
