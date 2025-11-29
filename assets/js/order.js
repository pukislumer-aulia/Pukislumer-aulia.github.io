/* =========================================================
   order.js — FINAL (improved, diagnostic, tolerant)
   - All features preserved: toppings, taburan, auto-calc, nota, save, PDF
   - Extra: robust ensureRequiredUI, diagnostic selfTest(), clear console hints
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

  // small helpers
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  function formatRp(n){ const v = Number(n||0); if (Number.isNaN(v)) return "Rp 0"; return "Rp " + v.toLocaleString('id-ID'); }
  function escapeHtml(s){ return String(s==null? '': s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function debugLog(...args){ if (window && window.console) console.log('[order.js]', ...args); }

  // ----------------------
  //  TOLERANCE HELPERS
  // ----------------------
  function ensureElement(selector, tag='div', attributes={}){
    let el = document.querySelector(selector);
    if (el) return el;
    el = document.createElement(tag);
    // set id if selector is id
    if (selector.startsWith('#')) {
      el.id = selector.slice(1);
    }
    Object.entries(attributes).forEach(([k,v]) => {
      if (k === 'class') el.className = v;
      else el.setAttribute(k,v);
    });
    // choose reasonable parent
    const form = document.querySelector('#formUltra') || document.querySelector('#form-ultra');
    if (form && (selector === '#ultraSingleGroup' || selector === '#ultraDoubleGroup')) {
      form.appendChild(el);
    } else {
      document.body.appendChild(el);
    }
    debugLog('ensureElement created', selector);
    return el;
  }

  function ensureRequiredUI(){
    ensureElement('#ultraSingleGroup', 'div', { 'class': 'topping-wrap', 'style': 'display:none;margin-bottom:8px;' });
    ensureElement('#ultraDoubleGroup', 'div', { 'class': 'topping-wrap', 'style': 'display:none;margin-bottom:8px;' });

    // nota container & content
    let nc = document.querySelector('#notaContainer');
    if (!nc){
      nc = ensureElement('#notaContainer','div', { 'class':'nota-overlay','style':'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:none;align-items:center;justify-content:center;' });
      // create inner nota card to avoid breaking layout expectations
      const card = document.createElement('div'); card.className = 'nota-card'; nc.appendChild(card);
    }
    let ncont = document.querySelector('#notaContent');
    if (!ncont){
      ncont = document.createElement('div');
      ncont.id = 'notaContent';
      ncont.setAttribute('style','margin-top:12px;font-size:14px;line-height:1.4;');
      // append inside notaContainer .nota-card if exists
      const card = nc.querySelector('.nota-card') || nc;
      card.appendChild(ncont);
      debugLog('notaContent auto-created and appended');
    } else {
      // if content exists but not inside container, move it
      if (!nc.contains(ncont)){
        const card = nc.querySelector('.nota-card') || nc;
        card.appendChild(ncont);
        debugLog('notaContent moved into notaContainer');
      }
    }

    // create hidden notaPrint if missing
    if (!document.querySelector('#notaPrint')){
      const btn = document.createElement('button');
      btn.id = 'notaPrint'; btn.type = 'button'; btn.style.display = 'none';
      document.body.appendChild(btn);
      debugLog('notaPrint created (hidden)');
    }
  }

  // =====================================================
  //   BUILD TOPPING UI
  // =====================================================
  function buildToppingUI(){
    const singleWrap = $('#ultraSingleGroup');
    const doubleWrap = $('#ultraDoubleGroup');
    if (!singleWrap || !doubleWrap) {
      debugLog('buildToppingUI aborted: missing wrappers');
      return;
    }
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

    // delegate events
    singleWrap.addEventListener('change', function(e){
      if (!e.target || !e.target.matches('input[type="checkbox"]')) return;
      const label = e.target.closest('label');
      if (label) e.target.checked ? label.classList.add('checked') : label.classList.remove('checked');
      const mode = getSelectedToppingMode();
      if (mode === 'single'){
        const sel = $$('input[name="topping"]:checked').length;
        if (sel > MAX_SINGLE_TOPPING){ e.target.checked = false; label.classList.remove('checked'); alert(`Maksimal ${MAX_SINGLE_TOPPING} topping untuk mode Single.`); }
      } else if (mode === 'double'){
        const sel = $$('input[name="topping"]:checked').length;
        if (sel > MAX_DOUBLE_TOPPING){ e.target.checked = false; label.classList.remove('checked'); alert(`Maksimal ${MAX_DOUBLE_TOPPING} topping untuk mode Double.`); }
      }
      updatePriceUI();
    });

    doubleWrap.addEventListener('change', function(e){
      if (!e.target || !e.target.matches('input[type="checkbox"]')) return;
      const mode = getSelectedToppingMode();
      if (mode !== 'double'){ e.target.checked = false; alert('Taburan hanya aktif pada mode Double.'); return; }
      const sel = $$('input[name="taburan"]:checked').length;
      if (sel > MAX_DOUBLE_TABURAN){ e.target.checked = false; alert(`Maksimal ${MAX_DOUBLE_TABURAN} taburan.`); }
      updatePriceUI();
    });

    debugLog('Topping UI built', { singleCount: SINGLE_TOPPINGS.length, taburanCount: DOUBLE_TABURAN.length });
  }

  // =====================================================
  //   HELPERS / PRICE
  // =====================================================
  const getSelectedRadioValue = (name) => {
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r? r.value : null;
  };
  const getToppingValues = () => $$('input[name="topping"]:checked').map(i=>i.value);
  const getTaburanValues = () => $$('input[name="taburan"]:checked').map(i=>i.value);
  const getIsiValue = () => { const el = $('#ultraIsi'); return el? String(el.value) : '5'; };
  const getJumlahBox = () => { const el = $('#ultraJumlah'); if (!el) return 1; const v = parseInt(el.value,10); return (isNaN(v)||v<1)?1:v; };
  function getSelectedToppingMode(){ return getSelectedRadioValue('ultraToppingMode') || 'non'; }

  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || 'Original'; isi = String(isi || '5'); mode = (mode||'non').toLowerCase();
    try { return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0; } catch(e){ return 0; }
  }
  function calcDiscount(jumlahBox, subtotal){
    if (jumlahBox >= 10) return 1000;
    if (jumlahBox >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePriceUI(){
    try {
      const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
      const isi = getIsiValue(); const mode = getSelectedToppingMode(); const jumlah = getJumlahBox();
      const pricePerBox = getPricePerBox(jenis, isi, mode);
      const subtotal = pricePerBox * jumlah; const discount = calcDiscount(jumlah, subtotal); const total = subtotal - discount;
      $('#ultraPricePerBox') && ($('#ultraPricePerBox').textContent = formatRp(pricePerBox));
      $('#ultraSubtotal') && ($('#ultraSubtotal').textContent = formatRp(subtotal));
      $('#ultraDiscount') && ($('#ultraDiscount').textContent = discount>0? '-' + formatRp(discount) : '-');
      $('#ultraGrandTotal') && ($('#ultraGrandTotal').textContent = formatRp(total));
      return { pricePerBox, subtotal, discount, total };
    } catch(err){
      console.error('[order.js] updatePriceUI error', err);
      return { pricePerBox:0, subtotal:0, discount:0, total:0 };
    }
  }

  // =====================================================
  //   ORDER BUILD / STORAGE / RENDER
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
    if (!nama){ alert('Nama harus diisi.'); return null; }
    if (!waRaw){ alert('Nomor WA harus diisi.'); return null; }
    let digits = waRaw.replace(/\D/g,'');
    if (digits.length < 9){ alert('Nomor WA tampak tidak valid.'); return null; }
    let wa = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (/^8\d{6,}$/.test(wa)) wa = '62' + wa;
    const invoice = 'INV-' + Date.now();
    const order = { invoice, nama, wa, jenis, isi, mode, topping, taburan, jumlah: jumlahBox, pricePerBox, subtotal, discount, total, note, tgl: new Date().toLocaleString('id-ID'), status: 'Pending' };
    return order;
  }

  function saveOrderLocal(order){
    if (!order) return;
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
      arr.push(order);
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(arr));
      localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order));
      localStorage.setItem('lastOrder', JSON.stringify(order)); // compatibility
      window._lastNotaData = order;
      debugLog('Order saved to localStorage', order.invoice);
    } catch(e){ console.error('[order.js] saveOrderLocal error', e); }
  }

  function getLastOrder(){
    try { return JSON.parse(localStorage.getItem('lastOrder') || 'null'); } catch(e){ return null; }
  }

  function saveLastNota(order){
    try { localStorage.setItem('lastOrder', JSON.stringify(order)); window._lastNotaData = order; } catch(e){ console.error(e); }
  }

  function renderNotaOnScreen(order){
    if (!order) return;
    const c = $('#notaContent');
    if (!c){ debugLog('renderNotaOnScreen: #notaContent missing'); return; }
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
    try { localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order)); } catch(e){}
    window._lastNota = order;
  }

  // =====================================================
  //   SEND TO ADMIN VIA WA
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
    try {
      ensureRequiredUI();
      buildToppingUI();
      updateToppingVisibility();

      $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', () => { updateToppingVisibility(); updatePriceUI(); }));
      $$('input[name="ultraJenis"]').forEach(r => r.addEventListener('change', updatePriceUI));
      $('#ultraIsi')?.addEventListener('change', updatePriceUI);
      $('#ultraJumlah')?.addEventListener('input', updatePriceUI);

      const form = document.querySelector('#formUltra') || document.querySelector('#form-ultra');
      if (form){
        // remove prior identical handler: defensive (can't remove anonymous, so just add)
        form.addEventListener('submit', function(e){
          e.preventDefault();
          const order = buildOrderObject();
          if (!order) return;
          saveOrderLocal(order);
          renderNotaOnScreen(order);
        });
      }

      const sendBtn = document.querySelector('#ultraSendAdmin');
      if (sendBtn){
        sendBtn.addEventListener('click', function(e){
          e.preventDefault();
          const last = getLastOrder();
          if (!last){ alert('Belum ada nota yang dibuat.'); return; }
          sendOrderToAdminViaWA(last);
          alert('Permintaan cetak sudah dikirim ke WhatsApp Admin.');
        });
      }

      const notaClose = document.querySelector('#notaClose');
      if (notaClose) notaClose.addEventListener('click', () => { const nc = $('#notaContainer'); if (nc){ nc.classList.remove('show'); nc.style.display = 'none'; } });

      const printBtn = document.querySelector('#notaPrint');
      if (printBtn){
        printBtn.addEventListener('click', async function(e){
          e.preventDefault();
          const last = getLastOrder();
          if (!last){ alert('Data nota belum tersedia. Silakan buat nota terlebih dahulu.'); return; }
          if (typeof window.generatePdf !== 'function'){
            if (window.makeGeneratePdf && (window.jspdf || window.jsPDF)) window.generatePdf = window.makeGeneratePdf(window.jspdf || window.jsPDF);
          }
          if (typeof window.generatePdf === 'function'){ await window.generatePdf(last); }
          else alert('PDF generator belum siap. Pastikan library jsPDF dimuat.');
        });
      }

      const notaAskAdmin = document.querySelector('#notaAskAdmin');
      if (notaAskAdmin){
        notaAskAdmin.addEventListener('click', (e) => {
          e.preventDefault();
          const last = getLastOrder();
          if (!last){ alert('Belum ada nota. Silakan buat nota terlebih dahulu.'); return; }
          sendOrderToAdminViaWA(last);
        });
      }

      const notaSendWA = document.querySelector('#notaSendWA');
      if (notaSendWA){
        notaSendWA.addEventListener('click', (e) => {
          e.preventDefault();
          const last = getLastOrder();
          if (!last){ alert('Belum ada nota. Silakan buat nota terlebih dahulu.'); return; }
          const msg = `Order baru:\nInvoice: ${last.invoice}\nNama: ${last.nama}\nTotal: ${formatRp(last.total)}`;
          window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, '_blank');
        });
      }

      debugLog('Listeners attached');
    } catch(err){
      console.error('[order.js] attachFormListeners error', err);
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
  //   PDF PART (factory)
  // =====================================================
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
          doc.autoTable({ startY: y, head:[['Item','Keterangan']], body: rows, styles:{ fontSize:10 }, headStyles:{ fillColor:[255,105,180], textColor:255 }, alternateRowStyles:{ fillColor:[240,240,250] } });
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
      } catch(err){ console.error('[order.js] generatePdf error', err); alert('Gagal membuat PDF.'); return false; }
    };
  }

  window.makeGeneratePdf = makeGeneratePdf;

  (function tryAttachNow(){
    const lib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf : (window.jsPDF ? window.jsPDF : null);
    if (lib){
      try { window.generatePdf = makeGeneratePdf(lib); debugLog('generatePdf auto-attached'); } catch(e){}
    }
  })();

  // =====================================================
  //   INIT + SELFTEST
  // =====================================================
  function init(){
    try {
      ensureRequiredUI();
      attachFormListeners();
      updatePriceUI();
      // auto attach pdf after slight delay if library loads late
      setTimeout(()=>{ const lib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf : (window.jsPDF ? window.jsPDF : null); if (lib && !window.generatePdf){ window.generatePdf = makeGeneratePdf(lib); debugLog('generatePdf late-attached'); } }, 1000);
      debugLog('order.js initialized');
    } catch(err){
      console.error('[order.js] init error', err);
    }
  }

  // Self-test helper: run after page loaded or call manually
  function selfTest(){
    try {
      console.group('%c order.js selfTest', 'color:#fff;background:#5e8af7;padding:4px;border-radius:4px');
      debugLog('Running selfTest...');
      ensureRequiredUI();
      buildToppingUI();
      const singleInputs = document.querySelectorAll('input[name="topping"]');
      const taburanInputs = document.querySelectorAll('input[name="taburan"]');
      debugLog('Counts', { toppings: singleInputs.length, taburans: taburanInputs.length });
      // simulate selecting single mode + 1 topping
      const singleMode = document.querySelector('input[name="ultraToppingMode"][value="single"]');
      if (singleMode){ singleMode.checked = true; singleMode.dispatchEvent(new Event('change',{bubbles:true})); }
      if (singleInputs.length){
        singleInputs[0].checked = true;
        singleInputs[0].dispatchEvent(new Event('change',{bubbles:true}));
      }
      const price = updatePriceUI();
      console.table([{ pricePerBox: price.pricePerBox, subtotal: price.subtotal, discount: price.discount, total: price.total }]);
      debugLog('SelfTest done — if toppings count = 0, check that order.js was loaded and no earlier script error exists.');
      console.groupEnd();
      return { toppings: singleInputs.length, taburans: taburanInputs.length, price };
    } catch(err){
      console.error('[order.js] selfTest error', err);
      return { error: String(err) };
    }
  }

  // expose debug/test
  window._orderjs = {
    buildToppingUI, updatePriceUI, buildOrderObject, saveOrderLocal, getLastOrder, renderNotaOnScreen, sendOrderToAdminViaWA, saveLastNota, selfTest
  };

  // run init when DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
