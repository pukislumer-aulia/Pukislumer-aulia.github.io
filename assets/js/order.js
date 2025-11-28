/* =========================================================
   order.js — FINAL (PART 1/2)
   - Mengikuti HTML lama (tidak merubah struktur HTML)
   - Auto-calc, topping/taburan show/hide, nota popup
   - Menyimpan lastOrder
   - Menyiapkan generatePdf (di PART 2)
========================================================= */

(function(){
  'use strict';

  /* ----------------------
     Konstanta & utilitas
  -----------------------*/
  const ADMIN_WA = "6281296668670"; // ubah nomor toko di sini bila perlu
  const ASSET_PREFIX = "assets/images/"; // path gambar (logo.png, qris.jpg, ttd.png)
  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino"];
  const DOUBLE_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  // contoh base price per jenis/isi/mode -> sesuaikan bila perlu
  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 13000, single: 15000, double: 18000 }, "10": { non: 25000, single: 28000, double: 32000 } }
  };

  const MAX_TOPPING = 5;
  const MAX_TABURAN = 5;
  const DISCOUNT_RULE_BOXES = [10]; // contoh: >=10 box = 10% discount (implement below as needed)
  // helper
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function formatRp(num){ return "Rp " + Number(num || 0).toLocaleString('id-ID'); }
  function escapeHtml(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  /* ----------------------
     BANGUN CHECKBOX Topping/Taburan DI DALAM HTML LAMA
     (HTML lama memiliki containers #ultraSingleGroup dan #ultraDoubleGroup)
  -----------------------*/
  function buildToppingUI() {
    const singleContainer = $('#ultraSingleGroup');
    const doubleContainer = $('#ultraDoubleGroup');
    if (!singleContainer || !doubleContainer) return;

    // clear any existing (safe)
    singleContainer.innerHTML = '';
    doubleContainer.innerHTML = '';

    // single toppings (these appear for single mode; may also appear in double)
    SINGLE_TOPPINGS.forEach(t => {
      const id = 'topping-' + t.toLowerCase().replace(/\s+/g,'-');
      const label = document.createElement('label');
      label.className = 'topping-check';
      // keep markup compatible with HTML lama (input + text)
      label.innerHTML = `<input type="checkbox" value="${t}" id="${id}"> ${t}`;
      singleContainer.appendChild(label);
    });

    // taburan (double-only)
    DOUBLE_TABURAN.forEach(t => {
      const id = 'taburan-' + t.toLowerCase().replace(/\s+/g,'-');
      const label = document.createElement('label');
      label.className = 'taburan-check';
      label.innerHTML = `<input type="checkbox" value="${t}" id="${id}"> ${t}`;
      doubleContainer.appendChild(label);
    });

    // add listener for toggling .checked class and validation counts
    document.addEventListener('change', function(e){
      const tgt = e.target;
      if (!tgt) return;
      const label = tgt.closest('.topping-check') || tgt.closest('.taburan-check');
      if (label) {
        if (tgt.checked) label.classList.add('checked'); else label.classList.remove('checked');
      }
      // validate counts according to selected mode
      const mode = getSelectedToppingMode();
      const sCount = $$('.topping-check input:checked').length;
      const dCount = $$('.taburan-check input:checked').length;
      if (mode === 'single' && sCount > MAX_TOPPING) {
        tgt.checked = false;
        if (label) label.classList.remove('checked');
        alert(`Maksimal ${MAX_TOPPING} topping untuk mode Single`);
      }
      if (mode === 'double') {
        if (tgt.closest('.topping-check') && sCount > MAX_TOPPING) {
          tgt.checked = false;
          if (label) label.classList.remove('checked');
          alert(`Maksimal ${MAX_TOPPING} topping untuk mode Double`);
        }
        if (tgt.closest('.taburan-check') && dCount > MAX_TABURAN) {
          tgt.checked = false;
          if (label) label.classList.remove('checked');
          alert(`Maksimal ${MAX_TABURAN} taburan untuk mode Double`);
        }
      }
      updatePriceUI(); // recalc when toppings change
    });
  }

  /* ----------------------
     HELPERS membaca form (mengikuti HTML lama)
  -----------------------*/
  function getSelectedRadioValue(name) {
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }

  function getToppingValues() {
    return $$('.topping-check input:checked').map(i => i.value);
  }
  function getTaburanValues() {
    return $$('.taburan-check input:checked').map(i => i.value);
  }

  /* ----------------------
     Kalkulasi harga sederhana (sesuaikan jika aturan berbeda)
  -----------------------*/
  function getPricePerBox(jenis, isi, mode) {
    jenis = jenis || 'Original';
    isi = String(isi || '5');
    mode = mode || 'non';
    try {
      return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0;
    } catch (e) { return 0; }
  }

  function calcDiscount(jumlahBox, subtotal) {
    // contoh sederhana:
    // jika jumlahBox >= 10 -> 10% diskon, >=5 -> 5% (sesuaikan aturan bisnis)
    if (jumlahBox >= 10) return Math.round(subtotal * 0.10);
    if (jumlahBox >= 5) return Math.round(subtotal * 0.05);
    return 0;
  }

  /* ----------------------
     Update tampilan harga di UI
  -----------------------*/
  function updatePriceUI() {
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = $('#ultraIsi') ? $('#ultraIsi').value : '5';
    const mode = getSelectedToppingMode();
    const jumlah = $('#ultraJumlah') ? Number($('#ultraJumlah').value) || 1 : 1;

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    if ($('#ultraPricePerBox')) $('#ultraPricePerBox').innerText = formatRp(pricePerBox);
    if ($('#ultraSubtotal')) $('#ultraSubtotal').innerText = formatRp(subtotal);
    if ($('#ultraDiscount')) $('#ultraDiscount').innerText = (discount > 0) ? '-' + formatRp(discount) : '-';
    if ($('#ultraGrandTotal')) $('#ultraGrandTotal').innerText = formatRp(total);

    return { pricePerBox, subtotal, discount, total };
  }

  function getSelectedToppingMode() {
    // supports input[name="ultraToppingMode"]
    const v = getSelectedRadioValue('ultraToppingMode');
    return v || 'non';
  }

  /* ----------------------
     Show/hide toppings based on mode (non/single/double)
     Follows HTML lama: #ultraSingleGroup & #ultraDoubleGroup exist in HTML
  -----------------------*/
  function updateToppingVisibility() {
    const mode = getSelectedToppingMode();
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;

    // clear selections in groups when switching to non
    if (mode === 'non') {
      // hide both and uncheck all
      singleGroup.style.display = 'none';
      doubleGroup.style.display = 'none';
      $$('.topping-check input:checked').forEach(i => { i.checked = false; i.closest('.topping-check')?.classList.remove('checked'); });
      $$('.taburan-check input:checked').forEach(i => { i.checked = false; i.closest('.taburan-check')?.classList.remove('checked'); });
      updatePriceUI();
      return;
    }

    if (mode === 'single') {
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'none';
      // hide double-group inputs (unchecked)
      $$('.taburan-check input:checked').forEach(i => { i.checked = false; i.closest('.taburan-check')?.classList.remove('checked'); });
      // show only single toppings (singleGroup contains single toppings by buildToppingUI)
      // ensure layout flex-wrap
      singleGroup.style.flexWrap = 'wrap';
      updatePriceUI();
      return;
    }

    if (mode === 'double') {
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'flex';
      singleGroup.style.flexWrap = 'wrap';
      doubleGroup.style.flexWrap = 'wrap';
      updatePriceUI();
      return;
    }
  }

  /* ----------------------
     BIND listeners untuk auto-calc & mode
  -----------------------*/
  function attachFormListeners() {
    // build topping UI first (if HTML containers exist)
    buildToppingUI();
    // initial visibility
    updateToppingVisibility();

    // elements that affect price
    // jenis change
    $$('.opt-group input[name="ultraJenis"], input[name="ultraJenis"]').forEach(r => r.addEventListener('change', () => updatePriceUI()));
    // isi change
    $('#ultraIsi')?.addEventListener('change', () => updatePriceUI());
    // topping mode change
    $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', () => { updateToppingVisibility(); updatePriceUI(); }));
    // jumlah change
    $('#ultraJumlah')?.addEventListener('input', () => updatePriceUI());

    // toppings & taburan handled in buildToppingUI change listener (updates price)
  }

  /* ----------------------
     Prepare order object from form
  -----------------------*/
  function buildOrderObject() {
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = $('#ultraIsi') ? $('#ultraIsi').value : '5';
    const mode = getSelectedToppingMode();
    const jumlahBox = $('#ultraJumlah') ? Number($('#ultraJumlah').value) || 1 : 1;
    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlahBox;
    const discount = calcDiscount(jumlahBox, subtotal);
    const total = subtotal - discount;

    const topping = getToppingValues();
    const taburan = getTaburanValues();

    const order = {
      id: 'INV' + Date.now(),
      orderID: 'INV' + Date.now(),
      antrian: localStorage.getItem('nomorAntrian') ? Number(localStorage.getItem('nomorAntrian')) : Date.now(),
      nama: $('#ultraNama') ? $('#ultraNama').value.trim() : '-',
      wa: $('#ultraWA') ? $('#ultraWA').value.trim() : '-',
      jenis, isi, mode,
      topping, taburan,
      jumlahBox, pricePerBox, subtotal, discount, total,
      note: $('#ultraNote') ? $('#ultraNote').value.trim() : '-',
      tgl: new Date().toLocaleString('id-ID')
    };

    return order;
  }

  /* ----------------------
     Save order (localStorage)
  -----------------------*/
  function saveOrder(order) {
    try {
      const arr = JSON.parse(localStorage.getItem('orders') || '[]');
      arr.push(order);
      localStorage.setItem('orders', JSON.stringify(arr));
      localStorage.setItem('lastOrder', JSON.stringify(order));
      // update nomor antrian increment
      const current = Number(localStorage.getItem('nomorAntrian') || 0) + 1;
      localStorage.setItem('nomorAntrian', current);
      order.antrian = current;
    } catch (e) { console.error('saveOrder error', e); }
  }

  /* ----------------------
     Render nota popup (fills #notaContent)
  -----------------------*/
  function renderNota(order) {
    if (!order) return;
    // convert arrays to string for display
    const toppingText = (order.topping && order.topping.length) ? order.topping.join(', ') : '-';
    const taburanText = (order.taburan && order.taburan.length) ? order.taburan.join(', ') : '-';

    const content = `
      <p><strong>No. Antrian:</strong> ${escapeHtml(order.antrian)}</p>
      <p><strong>Nama:</strong> ${escapeHtml(order.nama)}</p>
      <p><strong>WA:</strong> ${escapeHtml(order.wa)}</p>

      <p><strong>Jenis:</strong> ${escapeHtml(order.jenis)} — ${escapeHtml(String(order.isi))} pcs</p>
      <p><strong>Mode:</strong> ${escapeHtml(order.mode)}</p>
      <p><strong>Topping:</strong> ${escapeHtml(toppingText)}</p>
      <p><strong>Taburan:</strong> ${escapeHtml(taburanText)}</p>

      <p><strong>Jumlah Box:</strong> ${escapeHtml(String(order.jumlahBox))}</p>
      <p><strong>Harga Satuan:</strong> ${formatRp(order.pricePerBox)}</p>
      <p><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</p>
      <p><strong>Diskon:</strong> ${order.discount>0 ? '-' + formatRp(order.discount) : '-'}</p>
      <p style="font-weight:700;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</p>

      <p><strong>Catatan:</strong> ${escapeHtml(order.note)}</p>
    `;
    const notaContent = $('#notaContent');
    if (notaContent) notaContent.innerHTML = content;
    const notaContainer = $('#notaContainer');
    if (notaContainer) notaContainer.classList.add('show');
  }

  /* ----------------------
     Attach form submit & buttons
  -----------------------*/
  function attachButtons() {
    // form submit -> make nota
    const form = $('#formUltra') || $('#form-ultra') || document.querySelector('form#formUltra');
    if (form) {
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const order = buildOrderObject();
        saveOrder(order);
        renderNota(order);
      });
    }

    // nota close
    const notaClose = $('#notaClose') || $('#closeNota') || document.querySelector('.nota-close');
    if (notaClose) notaClose.addEventListener('click', () => {
      const nc = $('#notaContainer');
      if (nc) nc.classList.remove('show');
    });

    // send WA admin
    const sendBtn = $('#ultraSendAdmin') || $('#btnWa') || $('#sendAdmin');
    if (sendBtn) {
      sendBtn.addEventListener('click', function(){
        const order = buildOrderObject();
        saveOrder(order);
        // build message
        const lines = [
          `No. Antrian: ${order.antrian}`,
          `Nama: ${order.nama}`,
          `WA: ${order.wa}`,
          `Jenis: ${order.jenis}`,
          `Isi: ${order.isi} pcs`,
        ];
        if (order.mode === 'single') lines.push(`Topping: ${order.topping.length ? order.topping.join(', ') : '-'}`);
        if (order.mode === 'double') {
          lines.push(`Topping: ${order.topping.length ? order.topping.join(', ') : '-'}`);
          lines.push(`Taburan: ${order.taburan.length ? order.taburan.join(', ') : '-'}`);
        }
        lines.push(`Jumlah Box: ${order.jumlahBox}`);
        lines.push(`Catatan: ${order.note}`);
        lines.push(`Total: ${formatRp(order.total)}`);
        window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
      });
    }

    // print / pdf button
    const printBtn = $('#notaPrint') || $('#btnPdf') || document.querySelector('.btn-pdf');
    if (printBtn) {
      printBtn.addEventListener('click', async function(){
        // prefer lastOrder
        let last = null;
        try { last = JSON.parse(localStorage.getItem('lastOrder') || 'null'); } catch(e) { last = null; }
        if (!last) { last = buildOrderObject(); localStorage.setItem('lastOrder', JSON.stringify(last)); }
        // ensure generatePdf attached
        if (typeof window.generatePdf !== 'function') {
          await tryAttachGeneratePdf(6000);
        }
        if (typeof window.generatePdf === 'function') {
          await window.generatePdf(last);
        } else {
          alert('PDF generator belum tersedia (jsPDF belum dimuat). Silakan pastikan library jsPDF dimuat sebelum order.js atau refresh.');
        }
      });
    }
  }

  /* ----------------------
     jsPDF wait/attach helper (generator declared in PART 2)
  -----------------------*/
  function waitForJsPdf(timeoutMs = 7000, interval = 200){
    return new Promise((resolve) => {
      const start = Date.now();
      const id = setInterval(() => {
        const found = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || window.jspdf || null;
        if (found) { clearInterval(id); resolve({ok:true, obj: found}); }
        if (Date.now() - start > timeoutMs) { clearInterval(id); resolve({ok:false, obj:null}); }
      }, interval);
    });
  }

  async function tryAttachGeneratePdf(timeoutMs = 7000){
    const res = await waitForJsPdf(timeoutMs);
    if (!res.ok) return false;
    if (typeof makeGeneratePdf === 'function') {
      window.generatePdf = makeGeneratePdf(res.obj);
      return true;
    }
    return false;
  }

  /* ----------------------
     Init
  -----------------------*/
  function init(){
    attachFormListeners();
    attachButtons();
    // initial UI update
    updatePriceUI();
    // try attach generatePdf in background (non-blocking)
    tryAttachGeneratePdf(3000).catch(()=>{});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose helpers for debugging
  window._order_helpers = {
    updatePriceUI, buildToppingUI, updateToppingVisibility, buildOrderObject, saveOrder, renderNota
  };

})();
/* =========================================================
   order.js — FINAL (PART 2/2) - FIXED
   - PDF generator (makeGeneratePdf)
   - includes local formatRp to avoid ReferenceError
   - loads images to dataURL if possible
   - uses jsPDF + autoTable if available
========================================================= */

(function(){
  'use strict';

  // local formatRp to make this module self-contained
  function formatRp(num) {
    return "Rp " + Number(num || 0).toLocaleString('id-ID');
  }

  // helper to load image as dataURL (for jsPDF.addImage)
  function loadImageAsDataURL(src) {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function(){
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img,0,0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } catch (e) {
            // fallback: resolve null
            resolve(null);
          }
        };
        img.onerror = function(){ resolve(null); };
        // try both absolute/relative paths (best-effort)
        img.src = window.location.origin + '/' + 'assets/images/logo.png';
        setTimeout(()=>{ if (!img.complete) { img.src = 'assets/images/logo.png'; } }, 300);
      } catch (err) { resolve(null); }
    });
  }

  // makeGeneratePdf builds a generatePdf function when jsPDF ctor is available
  function makeGeneratePdf(jsPDFlib) {
    // jsPDFlib might be the constructor or object with .jsPDF
    let Doc = jsPDFlib && jsPDFlib.jsPDF ? jsPDFlib.jsPDF : jsPDFlib;
    if (typeof Doc !== 'function' && window.jsPDF) Doc = window.jsPDF;
    return async function generatePdf(order) {
      try {
        if (!Doc) throw new Error('jsPDF constructor tidak ditemukan');
        const doc = new Doc({ unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();

        // load images (logo, qris, ttd) as dataURL if possible
        const logoPath = 'assets/images/logo.png';
        const qrisPath = 'assets/images/qris.jpg';
        const ttdPath = 'assets/images/ttd.png';

        // try to load images (non-blocking)
        const [logoData, qrisData, ttdData] = await Promise.all([
          loadImageAsDataURL(logoPath), loadImageAsDataURL(qrisPath), loadImageAsDataURL(ttdPath)
        ]);

        // header
        if (logoData) {
          try { doc.addImage(logoData, 'PNG', 14, 8, 32, 32); } catch(e) {}
        }
        doc.setFontSize(16);
        doc.text('Pukis Lumer Aulia', pageW / 2, 18, { align: 'center' });
        doc.setFontSize(10);
        doc.text('Invoice Pemesanan', pageW / 2, 24, { align: 'center' });

        // metadata
        const startY = 32;
        let y = startY;
        doc.setFontSize(10);
        doc.text(`Order ID: ${order.orderID || order.id || '-'}`, 14, y);
        doc.text(`Tanggal: ${order.tgl || new Date().toLocaleString('id-ID')}`, pageW - 14, y, { align: 'right' });
        y += 8;
        doc.text(`Nama: ${order.nama}`, 14, y);
        // nomor antrian - place above name as requested (we also show as separate row)
        doc.text(`No. Antrian: ${order.antrian || '-'}`, pageW - 14, y, { align: 'right' });
        y += 10;

        // prepare table rows
        const toppingText = (order.topping && order.topping.length) ? order.topping.join(', ') : '-';
        const taburanText = (order.taburan && order.taburan.length) ? order.taburan.join(', ') : '-';
        const rows = [
          ['Jenis', String(order.jenis || '-')],
          ['Isi Box', String(order.isi || '-') + ' pcs'],
          ['Mode', String(order.mode || '-')],
          ['Topping', toppingText],
          ['Taburan', taburanText],
          ['Jumlah Box', String(order.jumlahBox || 0) + ' box'],
          ['Harga Satuan', order.pricePerBox ? formatRp(order.pricePerBox) : '-'],
          ['Subtotal', order.subtotal ? formatRp(order.subtotal) : '-'],
          ['Diskon', order.discount > 0 ? '-' + formatRp(order.discount) : '-'],
          ['Total Bayar', order.total ? formatRp(order.total) : '-'],
          ['Catatan', order.note || '-']
        ];

        // use autoTable if available
        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            startY: y,
            head: [['Item', 'Keterangan']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [34, 34, 34], textColor: 255 },
            styles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 'auto' } }
          });
        } else {
          // fallback manual table
          doc.setFontSize(10);
          let ty = y;
          const col1 = 16;
          const col2 = 80;
          rows.forEach(r => {
            doc.text(String(r[0]), col1, ty);
            const wrapped = doc.splitTextToSize(String(r[1]), pageW - col2 - 16);
            doc.text(wrapped, col2, ty);
            ty += Math.max(8, wrapped.length * 6);
          });
          y = ty;
        }

        // position after table
        const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : (y + 10);

        // QRIS (left)
        if (qrisData) {
          try {
            doc.addImage(qrisData, 'JPEG', 14, finalY + 8, 60, 60);
            doc.setFontSize(9);
            doc.text('Scan untuk pembayaran QRIS', 14, finalY + 72);
          } catch (e) {}
        }

        // TTD (right, directly below "Hormat Kami")
        const ttdX = pageW - 70;
        const ttdY = finalY + 12;
        doc.setFontSize(10);
        doc.text('Hormat Kami,', ttdX, ttdY);
        if (ttdData) {
          try {
            doc.addImage(ttdData, 'PNG', ttdX, ttdY + 6, 50, 40);
          } catch(e) {}
        }
        // signature name
        doc.setFontSize(10);
        doc.text('Pukis Lumer Aulia', ttdX, ttdY + 52);

        // save
        const filename = `Invoice_${(order.nama||'Pelanggan').replace(/\s+/g,'_')}_${order.orderID||order.id||Date.now()}.pdf`;
        doc.save(filename);
        return true;
      } catch (err) {
        console.error('generatePdf error', err);
        alert('Gagal membuat PDF: ' + (err && err.message ? err.message : err));
        return false;
      }
    };
  }

  // attach makeGeneratePdf to window so PART1 can call tryAttachGeneratePdf
  window.makeGeneratePdf = makeGeneratePdf;

})();
