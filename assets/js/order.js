/* ===========================================================
   order.js — REKONSTRUKSI FINAL
   - Single topping = gaya A (.topping-check)
   - Double taburan = gaya B (label sederhana)
   - Hitung otomatis, validasi topping<=isi box
   - Simpan ke localStorage keys: pukisOrders, lastOrder
   - Tombol Minta Admin Cetak -> WA admin (ADMIN_WA)
   - PDF generator (jsPDF + autotable if available)
   - Render nota popup dan fallback handlers
   =========================================================== */

(function(){
  'use strict';

  // ---------- Configuration ----------
  const ADMIN_WA = "6281296668670"; // nomor admin (E.164 tanpa +)
  const STORAGE_ORDERS_KEY = "pukisOrders";
  const STORAGE_LAST_ORDER_KEY = "lastOrder";

  const ASSET_IMAGES = "assets/images/";
  const QRIS_IMAGE = "qris-pukis.jpg"; // optional, used in PDF
  const TTD_IMAGE = "ttd.png";         // optional, signature in PDF

  // Topping lists (adjust to your original choices)
  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Stroberi","Cappucino","Vanilla","Taro","Matcha"];
  const DOUBLE_TABURAN  = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  // Base price table (example — keep as your original)
  const BASE_PRICE = {
    Original: {
      "5":   { non: 10000, single: 13000, double: 15000 },
      "10":  { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      "5":   { non: 12000, single: 15000, double: 17000 },
      "10":  { non: 21000, single: 28000, double: 32000 }
    }
  };

  // Helpers for DOM
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Rupiah formatter
  function formatRp(amount){
    const n = Number(amount || 0);
    if (Number.isNaN(n)) return "Rp 0";
    return "Rp " + n.toLocaleString('id-ID');
  }

  // ---------- Build Topping UI ----------
  function buildToppingUI(){
    const singleWrap = $('#ultraSingleGroup');
    const doubleWrap = $('#ultraDoubleGroup');
    if (!singleWrap || !doubleWrap) return;

    // Clear existing
    singleWrap.innerHTML = '';
    doubleWrap.innerHTML = '';

    // Single toppings — gaya A (with class topping-check)
    SINGLE_TOPPINGS.forEach(t => {
      const id = `top_${t.toLowerCase().replace(/\s+/g,'_')}`;
      const label = document.createElement('label');
      label.className = 'topping-check'; // style A
      label.innerHTML = `<input type="checkbox" name="topping" value="${t}" id="${id}"> ${t}`;
      singleWrap.appendChild(label);
    });

    // Double taburan — gaya B (simple labels)
    DOUBLE_TABURAN.forEach(t => {
      const id = `tab_${t.toLowerCase().replace(/\s+/g,'_')}`;
      const label = document.createElement('label');
      label.style.margin = '6px';
      label.innerHTML = `<input type="checkbox" name="taburan" value="${t}" id="${id}"> ${t}`;
      doubleWrap.appendChild(label);
    });

    // Add visual toggle for checked (for gaya A we want .checked class)
    singleWrap.addEventListener('change', function(e){
      if (!e.target) return;
      const inp = e.target;
      if (inp.matches('input[type="checkbox"]')){
        const lab = inp.closest('label');
        if (lab) {
          if (inp.checked) lab.classList.add('checked'); else lab.classList.remove('checked');
        }
        validateToppingCounts();
        updatePriceUI();
      }
    });

    doubleWrap.addEventListener('change', function(e){
      if (!e.target) return;
      const inp = e.target;
      if (inp.matches('input[type="checkbox"]')){
        validateToppingCounts();
        updatePriceUI();
      }
    });
  }

  // ---------- Form helpers ----------
  function getSelectedRadio(name){
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }
  function getToppingSelected(){
    return Array.from(document.querySelectorAll('input[name="topping"]:checked')).map(i=>i.value);
  }
  function getTaburanSelected(){
    return Array.from(document.querySelectorAll('input[name="taburan"]:checked')).map(i=>i.value);
  }
  function getIsi(){
    const el = $('#ultraIsi'); return el ? String(el.value) : '5';
  }
  function getJumlahBox(){
    const el = $('#ultraJumlah'); if (!el) return 1;
    const v = parseInt(el.value,10);
    return (isNaN(v) || v < 1) ? 1 : v;
  }
  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || 'Original'; isi = String(isi || '5'); mode = (mode || 'non').toLowerCase();
    try {
      return BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode] ? BASE_PRICE[jenis][isi][mode] : 0;
    } catch(e){ return 0; }
  }

  // Discount logic (example: fixed Rp1.000 for 10 box, or 1% for >=5)
  function calcDiscount(jumlahBox, subtotal){
    if (jumlahBox >= 10) {
      // if you asked earlier "beli 10 box besar, dapat Rp 1.000"
      return 1000;
    }
    // example small discount for >=5, else 0
    if (jumlahBox >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  // ---------- Price update UI ----------
  function updatePriceUI(){
    const jenis = getSelectedRadio('ultraJenis') || 'Original';
    const isi   = getIsi();
    const mode  = getSelectedRadio('ultraToppingMode') || 'non';
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
    if (elDiscount) elDiscount.textContent = discount > 0 ? '-' + formatRp(discount) : '-';
    if (elGrand) elGrand.textContent = formatRp(total);

    return { jenis, isi, mode, jumlah, pricePerBox, subtotal, discount, total };
  }

  // ---------- Topping validation ----------
  function validateToppingCounts(){
    const isi = parseInt(getIsi(),10) || 5;
    const selectedTopping = getToppingSelected().length;
    const selectedTaburan = getTaburanSelected().length;

    if (selectedTopping > isi) {
      alert(`Maksimal topping = ${isi} (jumlah isi box). Pilihan topping akan dikurangi.`);
      // uncheck extras (leave first isi)
      const boxes = document.querySelectorAll('input[name="topping"]:checked');
      Array.from(boxes).slice(isi).forEach(i=>i.checked = false);
      // update visuals
      document.querySelectorAll('.topping-check').forEach(lab=>{
        const inp = lab.querySelector('input[type="checkbox"]');
        if (inp) {
          if (inp.checked) lab.classList.add('checked'); else lab.classList.remove('checked');
        }
      });
    }
    if (selectedTaburan > isi) {
      alert(`Maksimal taburan = ${isi} (jumlah isi box). Pilihan taburan akan dikurangi.`);
      const boxes = document.querySelectorAll('input[name="taburan"]:checked');
      Array.from(boxes).slice(isi).forEach(i=>i.checked = false);
    }
  }

  // ---------- Build order object ----------
  function buildOrderObject(){
    const nama = ($('#ultraNama') ? $('#ultraNama').value.trim() : '') || '';
    const waRaw = ($('#ultraWA') ? $('#ultraWA').value.trim() : '') || '';
    const jenis = getSelectedRadio('ultraJenis') || 'Original';
    const isi = getIsi();
    const mode = getSelectedRadio('ultraToppingMode') || 'non';
    const topping = getToppingSelected(); // array
    const taburan = getTaburanSelected(); // array
    const jumlah = getJumlahBox();
    const note = ($('#ultraNote') ? $('#ultraNote').value.trim() : '') || '';

    // Validations (must keep)
    if (!nama) { alert('Nama harus diisi'); return null; }
    if (!waRaw) { alert('Nomor WhatsApp harus diisi'); return null; }
    const digits = waRaw.replace(/\D/g,'');
    if (digits.length < 9) { alert('Nomor WA tidak valid (min 9 digit).'); return null; }

    // normalize WA to 62... (no +)
    let wa = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (/^8\d{7,}$/.test(wa)) wa = '62' + wa; // if user typed starting 8xx

    // price calc
    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    // Invoice: INV-<timestamp>
    const invoice = 'INV-' + Date.now();

    return {
      invoice,
      nama,
      wa,
      jenis,
      isi,
      mode,
      topping,
      taburan,
      jumlah,
      pricePerBox,
      subtotal,
      discount,
      total,
      note,
      tgl: new Date().toLocaleString('id-ID'),
      status: 'Pending'
    };
  }

  // ---------- Storage ----------
  function getOrdersFromStorage(){
    try {
      return JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
    } catch(e){ return []; }
  }
  function saveOrdersToStorage(arr){
    try { localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(arr)); } catch(e){}
  }
  function saveOrderLocal(order){
    if (!order) return;
    const arr = getOrdersFromStorage();
    arr.push(order);
    saveOrdersToStorage(arr);
    try { localStorage.setItem(STORAGE_LAST_ORDER_KEY, JSON.stringify(order)); } catch(e){}
    // also expose global lastNota for backward compat
    window._lastNotaData = order;
  }

  // ---------- Render Nota in Popup ----------
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

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
          <div><strong>Nomor Invoice:</strong> ${escapeHtml(order.invoice)}</div>
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
        <div><strong>Jumlah Box:</strong> ${escapeHtml(String(order.jumlah))}</div>
        <div><strong>Harga Satuan:</strong> ${formatRp(order.pricePerBox)}</div>
        <div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>
        <div><strong>Diskon:</strong> ${order.discount>0 ? '-' + formatRp(order.discount) : '-'}</div>
        <div style="font-weight:800;margin-top:6px;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</div>
        <p style="margin-top:10px;font-style:italic">Terima kasih telah berbelanja di Pukis Lumer Aulia.</p>
      </div>
    `;
    const container = $('#notaContainer');
    if (container) {
      container.style.display = 'flex';
      container.classList.add('show');
    }
    window._lastNotaData = order;
  }

  // ---------- Send to Admin via WA ----------
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
      `Isi Box : ${order.isi} pcs`,
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
    const waUrl = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(waUrl, '_blank');
  }

  // ---------- Fallback utility to read last order ----------
  function getLastOrder(){
    try {
      return JSON.parse(localStorage.getItem(STORAGE_LAST_ORDER_KEY) || 'null');
    } catch(e){ return null; }
  }
   /* --------------------------
   PDF generator factory + image loader
   -------------------------- */

(function(){
  // load image as dataURL
  function loadImageDataURL(path){
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function(){
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch(e){ resolve(null); }
      };
      img.onerror = function(){ resolve(null); };
      img.src = path;
    });
  }

  function makePdfGenerator(jsPDFLib){
    const jsPDFCtor = jsPDFLib && jsPDFLib.jsPDF ? jsPDFLib.jsPDF : jsPDFLib;
    return async function generatePdf(order){
      try {
        if (!jsPDFCtor) throw new Error('jsPDF tidak tersedia');

        const doc = new jsPDFCtor({ unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();
        const centerX = W / 2;

        // load assets (qris & ttd) if exist
        const qrisData = await loadImageDataURL(ASSET_IMAGES + QRIS_IMAGE).catch(()=>null);
        const ttdData  = await loadImageDataURL(ASSET_IMAGES + TTD_IMAGE).catch(()=>null);

        // header
        doc.setFont('helvetica','bold');
        doc.setFontSize(16);
        doc.text('PUKIS LUMER AULIA', centerX, 15, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica','normal');
        const leftX = 14;
        let y = 30;
        doc.text(`Invoice: ${order.invoice}`, leftX, y); y += 6;
        doc.text(`Nama   : ${order.nama}`, leftX, y); y += 6;
        doc.text(`WA     : ${order.wa}`, leftX, y); y += 6;
        doc.text(`Tanggal: ${order.tgl}`, leftX, y); y += 10;

        // items
        doc.setFont('helvetica','bold');
        doc.text('Rincian Pesanan', leftX, y); y += 6;
        doc.setFont('helvetica','normal');
        const rows = [
          ['Jenis', order.jenis || '-'],
          ['Isi Box', `${order.isi} pcs`],
          ['Mode', order.mode || '-'],
          ['Topping', (order.topping && order.topping.length) ? order.topping.join(', ') : '-'],
          ['Taburan', (order.taburan && order.taburan.length) ? order.taburan.join(', ') : '-'],
          ['Jumlah Box', `${order.jumlah} box`],
          ['Harga Satuan', formatRp(order.pricePerBox)],
          ['Subtotal', formatRp(order.subtotal)],
          ['Diskon', order.discount > 0 ? '-' + formatRp(order.discount) : '-'],
          ['Total', formatRp(order.total)]
        ];

        // use autoTable if available
        if (typeof doc.autoTable === 'function'){
          doc.autoTable({
            startY: y,
            head: [['Item','Keterangan']],
            body: rows,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [199,0,86], textColor: 255 },
            columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: W - 40 - 28 } }
          });
          y = doc.lastAutoTable.finalY + 8;
        } else {
          rows.forEach(r => {
            doc.text(`${r[0]}: ${r[1]}`, leftX, y);
            y += 6;
          });
          y += 6;
        }

        // QRIS on left
        if (qrisData){
          doc.addImage(qrisData, 'PNG', leftX, y, 40, 40);
          doc.setFontSize(9);
          doc.text('Scan QRIS untuk pembayaran', leftX + 46, y + 8);
        }

        // Signature on right
        const sigX = W - 80;
        let sigY = y;
        doc.setFontSize(11);
        doc.text('Hormat Kami,', sigX + 20, sigY);
        sigY += 8;
        if (ttdData){
          doc.addImage(ttdData, 'PNG', sigX + 5, sigY, 60, 30);
          sigY += 34;
        } else { sigY += 30; }
        doc.setFont('helvetica','bold');
        doc.text('Pukis Lumer Aulia', sigX + 20, sigY);

        // footer
        doc.setFontSize(10);
        doc.text('Terima kasih telah berbelanja', centerX, doc.internal.pageSize.getHeight() - 20, { align: 'center' });

        const safeName = (order.nama || 'pelanggan').replace(/\s+/g,'_').replace(/[^\w\-_.]/g,'');
        const fileName = `Invoice_${safeName}_${order.invoice || Date.now()}.pdf`;
        doc.save(fileName);
        return true;
      } catch(err){
        console.error('generatePdf error', err);
        alert('Gagal membuat PDF: ' + (err && err.message ? err.message : err));
        return false;
      }
    };
  }

  // expose generator if jsPDF present
  window._pdfFactory = makePdfGenerator;
  if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
    window.generatePdf = makePdfGenerator(window.jsPDF || window.jspdf);
  }
})();

/* --------------------------
   Attach events & init
   -------------------------- */

function attachOrderListeners(){
  // Build UI
  buildToppingUI();

  // radio mode change (non/single/double)
  $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', () => {
    const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || 'non';
    const sg = $('#ultraSingleGroup');
    const dg = $('#ultraDoubleGroup');
    if (sg && dg){
      if (mode === 'non'){ sg.style.display = 'none'; dg.style.display = 'none'; }
      else if (mode === 'single'){ sg.style.display = 'flex'; dg.style.display = 'none'; }
      else { sg.style.display = 'flex'; dg.style.display = 'flex'; }
    }
    updatePriceUI();
  }));

  // jenis change
  $$('input[name="ultraJenis"]').forEach(r => r.addEventListener('change', updatePriceUI));
  // isi change
  const isiSel = $('#ultraIsi');
  if (isiSel) isiSel.addEventListener('change', () => { validateToppingCounts(); updatePriceUI(); });
  // jumlah change
  const jumlahEl = $('#ultraJumlah');
  if (jumlahEl) jumlahEl.addEventListener('input', updatePriceUI);

  // submit form -> buat nota
  const form = $('#formUltra');
  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const order = buildOrderObject();
      if (!order) return;
      saveOrderLocal(order);
      renderNotaOnScreen(order);
      // optional: scroll to nota or focus
    });
  }

  // ultraSendAdmin -> immediate save + send WA
  const btnSendAdmin = $('#ultraSendAdmin');
  if (btnSendAdmin){
    btnSendAdmin.addEventListener('click', function(e){
      e.preventDefault();
      const order = buildOrderObject();
      if (!order) return;
      saveOrderLocal(order);
      sendOrderToAdminViaWA(order);
      alert('Permintaan cetak telah dikirim ke WhatsApp Admin.');
    });
  }

  // notaAskAdmin (in popup) -> send lastOrder to admin
  const notaAskAdmin = $('#notaAskAdmin');
  if (notaAskAdmin){
    notaAskAdmin.addEventListener('click', function(){
      const last = getLastOrder();
      if (!last) return alert('Data nota belum tersedia. Silakan buat nota terlebih dahulu.');
      sendOrderToAdminViaWA(last);
    });
  }
  // notaSendWA (short chat)
  const notaSendWA = $('#notaSendWA');
  if (notaSendWA){
    notaSendWA.addEventListener('click', function(){
      const last = getLastOrder();
      if (!last) return alert('Data nota belum tersedia. Silakan buat nota terlebih dahulu.');
      const msg = `Order baru:\nInvoice: ${last.invoice}\nNama: ${last.nama}\nTotal: ${formatRp(last.total)}`;
      window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }

  // notaPrint (hidden for user) -> uses lastOrder
  const notaPrint = $('#notaPrint');
  if (notaPrint){
    notaPrint.addEventListener('click', async function(e){
      e.preventDefault();
      const last = getLastOrder();
      if (!last) return alert('Data nota belum tersedia. Silakan buat nota terlebih dahulu.');
      if (typeof window.generatePdf !== 'function'){
        if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
          window.generatePdf = window._pdfFactory(window.jsPDF || window.jspdf);
        }
      }
      if (typeof window.generatePdf === 'function'){
        await window.generatePdf(last);
      } else {
        alert('PDF generator belum tersedia.');
      }
    });
  }

  // nota close button
  const notaClose = $('#notaClose');
  if (notaClose){
    notaClose.addEventListener('click', function(){
      const c = $('#notaContainer'); if (c) { c.classList.remove('show'); c.style.display = 'none'; }
    });
  }

  // initial states
  updatePriceUI();
  // set initial visibility for topping groups
  const currentMode = $('input[name="ultraToppingMode"]:checked') ? $('input[name="ultraToppingMode"]:checked').value : 'non';
  const sg = $('#ultraSingleGroup'), dg = $('#ultraDoubleGroup');
  if (sg && dg){
    if (currentMode === 'non'){ sg.style.display='none'; dg.style.display='none'; }
    else if (currentMode === 'single'){ sg.style.display='flex'; dg.style.display='none'; }
    else { sg.style.display='flex'; dg.style.display='flex'; }
  }
}

// init on DOM ready
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachOrderListeners);
else attachOrderListeners();

// Expose internal for debug
window._orderjs = {
  buildToppingUI,
  buildOrderObject,
  saveOrderLocal,
  getLastOrder,
  sendOrderToAdminViaWA,
  updatePriceUI
};
