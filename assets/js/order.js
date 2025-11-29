/* =========================================================
   order.js — FINAL (COMPATIBLE DENGAN HTML YANG DIBERIKAN)
   - Mengembalikan pembuatan checkbox topping/taburan ke div kosong
   - Hitung otomatis full (harga, subtotal, diskon, total)
   - Validasi: jumlah topping/taburan max = isi box (sesuai catatan sebelumnya)
   - PDF: INVOICE PEMBAYARAN maroon kiri, PUKIS LUMER AULIA kanan, QRIS menggunakan assets/images/qris-pukis.jpg
   - Watermark: bold+italic, miring (rotasi) + low opacity, fallback apabila opacity/rotasi tidak didukung
   - Nomor antrian DIHAPUS / tidak disertakan
   - HANYA ubah JS; HTML tetap acuan
========================================================= */

(function () {
  'use strict';

  /* -------------------------
     Konfigurasi & data tetap
  --------------------------*/
  const ADMIN_WA = "6281296668670";
  const ASSET_PREFIX = "assets/images/";
  const QRIS_FILENAME = "qris-pukis.jpg";

  // topping / taburan sesuai permintaan
  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Stroberi","Cappucino","Vanilla","Taro","Matcha"];
  const DOUBLE_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  // Harga dasar (sesuaikan bila backend berbeda)
  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 13000, single: 15000, double: 18000 }, "10": { non: 25000, single: 28000, double: 32000 } }
  };

  // helper DOM
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function formatRp(n){
    // digit-by-digit safe formatting
    const v = Number(n || 0);
    if (Number.isNaN(v)) return "Rp 0";
    return "Rp " + v.toLocaleString('id-ID');
  }

  /* -------------------------
     Build topping & taburan UI
     - Isi #ultraSingleGroup & #ultraDoubleGroup sesuai arrays di atas
     - Checkbox name: topping[] / taburan[]  (mempermudah seleksi)
  --------------------------*/
  function buildToppingUI(){
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;

    // clear existing (but preserve if developer prefilled — still re-create to ensure classes)
    singleGroup.innerHTML = '';
    doubleGroup.innerHTML = '';

    // create single toppings
    SINGLE_TOPPINGS.forEach(t => {
      const id = 'topping_' + t.toLowerCase().replace(/\s+/g,'_');
      const label = document.createElement('label');
      label.className = 'topping-check';
      label.style.display = 'inline-flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';
      label.style.margin = '6px';
      label.style.padding = '6px 8px';
      label.style.borderRadius = '8px';
      label.style.border = '1px solid rgba(255,255,255,0.06)';
      label.style.cursor = 'pointer';
      label.innerHTML = `<input type="checkbox" name="topping[]" value="${t}" id="${id}"> ${t}`;
      singleGroup.appendChild(label);
    });

    // create double taburan
    DOUBLE_TABURAN.forEach(t => {
      const id = 'taburan_' + t.toLowerCase().replace(/\s+/g,'_');
      const label = document.createElement('label');
      label.className = 'taburan-check';
      label.style.display = 'inline-flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';
      label.style.margin = '6px';
      label.style.padding = '6px 8px';
      label.style.borderRadius = '8px';
      label.style.border = '1px solid rgba(255,255,255,0.06)';
      label.style.cursor = 'pointer';
      label.innerHTML = `<input type="checkbox" name="taburan[]" value="${t}" id="${id}"> ${t}`;
      doubleGroup.appendChild(label);
    });

    // attach checkbox listeners (delegation is safer but we'll attach to each checkbox here)
    const toppingInputs = singleGroup.querySelectorAll('input[type="checkbox"]');
    toppingInputs.forEach(inp => {
      inp.addEventListener('change', handleCheckboxChange);
    });
    const taburanInputs = doubleGroup.querySelectorAll('input[type="checkbox"]');
    taburanInputs.forEach(inp => {
      inp.addEventListener('change', handleCheckboxChange);
    });
  }

  /* -------------------------
     Helpers - baca form values (dari HTML acuan)
  --------------------------*/
  function getSelectedRadioValue(name){
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }

  function getToppingValues(){
    return Array.from(document.querySelectorAll('input[name="topping[]"]:checked')).map(i => i.value);
  }
  function getTaburanValues(){
    return Array.from(document.querySelectorAll('input[name="taburan[]"]:checked')).map(i => i.value);
  }

  function getIsiValue(){
    const el = $('#ultraIsi');
    return el ? String(el.value) : '5';
  }

  function getJumlahBox(){
    const el = $('#ultraJumlah');
    const v = el ? Number(el.value) : 1;
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 1;
  }

  /* -------------------------
     Harga & diskon
  --------------------------*/
  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || 'Original';
    isi = String(isi || '5');
    mode = (mode || 'non').toLowerCase();
    try {
      return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0;
    } catch (e) { return 0; }
  }

  function calcDiscount(jumlahBox, subtotal){
    if (jumlahBox >= 10) return Math.round(subtotal * 0.10);
    if (jumlahBox >= 5) return Math.round(subtotal * 0.05);
    return 0;
  }

  /* -------------------------
     Update price UI (live)
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
    if (elDiscount) elDiscount.textContent = discount > 0 ? '-' + formatRp(discount) : '-';
    if (elGrand) elGrand.textContent = formatRp(total);

    return { jenis, isi, mode, jumlah, pricePerBox, subtotal, discount, total };
  }

  /* -------------------------
     Visibility control untuk group topping
     - sesuai mode: non -> hide both; single -> show single only; double -> show both
  --------------------------*/
  function updateToppingVisibility(){
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');

    if (!singleGroup || !doubleGroup) return;

    if (mode === 'non'){
      singleGroup.style.display = 'none';
      doubleGroup.style.display = 'none';
      // uncheck all
      singleGroup.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
      doubleGroup.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
    } else if (mode === 'single'){
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'none';
      doubleGroup.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
    } else if (mode === 'double'){
      singleGroup.style.display = 'flex';
      doubleGroup.style.display = 'flex';
    }
  }

  /* -------------------------
     Checkbox change handler: validate & recalc
     - Validasi: jumlah topping/taburan maksimal = isi per box (sesuai catatan)
  --------------------------*/
  function handleCheckboxChange(e){
    const isi = Number(getIsiValue()) || 5; // isi per box (5 atau 10)
    const target = e.target;
    // determine group
    if (!target) return;
    const isTopping = target.closest('#ultraSingleGroup') !== null;
    const isTaburan = target.closest('#ultraDoubleGroup') !== null;

    if (isTopping){
      const selCount = getToppingValues().length;
      if (selCount > isi){
        // undo and alert
        target.checked = false;
        alert(`Maksimal topping (Single) = ${isi} (isi box).`);
      }
    }
    if (isTaburan){
      const selCount = getTaburanValues().length;
      if (selCount > isi){
        target.checked = false;
        alert(`Maksimal taburan = ${isi} (isi box).`);
      }
    }

    // visual cue (checked class)
    const label = target.closest('label');
    if (label){
      if (target.checked) label.classList.add('checked'); else label.classList.remove('checked');
    }

    // update price when checkboxes change
    updatePriceUI();
  }

  /* -------------------------
     Build order object (no antrian)
  --------------------------*/
  function buildOrderObject(){
    const nama = $('#ultraNama') ? $('#ultraNama').value.trim() : '-';
    const wa = $('#ultraWA') ? $('#ultraWA').value.trim() : '-';
    const note = $('#ultraNote') ? $('#ultraNote').value.trim() : '-';
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue();
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';
    const topping = getToppingValues();
    const taburan = getTaburanValues();
    const jumlahBox = getJumlahBox();
    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlahBox;
    const discount = calcDiscount(jumlahBox, subtotal);
    const total = subtotal - discount;
    const now = Date.now();

    return {
      orderID: 'INV' + now,
      nama: nama || '-',
      wa: wa || '-',
      note: note || '-',
      jenis, isi, mode,
      topping, taburan,
      jumlahBox, pricePerBox, subtotal, discount, total,
      tgl: new Date().toLocaleString('id-ID')
      // antrian intentionally omitted
    };
  }

  /* -------------------------
     Save to localStorage (compatibility)
  --------------------------*/
  function saveOrderLocal(order){
    try {
      const arr = JSON.parse(localStorage.getItem('orders') || '[]');
      arr.push(order);
      localStorage.setItem('orders', JSON.stringify(arr));
      localStorage.setItem('lastOrder', JSON.stringify(order));
    } catch (e){
      console.error('saveOrderLocal', e);
    }
  }

  /* -------------------------
     Render nota on screen (uses #notaContent) - left block + details
  --------------------------*/
  function renderNotaOnScreen(order){
    const c = $('#notaContent');
    if (!c) return;
    const toppingText = order.topping && order.topping.length ? order.topping.join(', ') : '-';
    const taburanText = order.taburan && order.taburan.length ? order.taburan.join(', ') : '-';

    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:180px">
          <div style="font-weight:800;color:#5f0000;font-size:14px;margin-bottom:6px;">INVOICE PEMBAYARAN</div>
          <div><strong>Nomor Invoice:</strong> ${escapeHtml(order.orderID)}</div>
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
        <div><strong>Jumlah Box:</strong> ${escapeHtml(String(order.jumlahBox))}</div>
        <div><strong>Harga Satuan:</strong> ${formatRp(order.pricePerBox)}</div>
        <div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>
        <div><strong>Diskon:</strong> ${order.discount>0 ? '-' + formatRp(order.discount) : '-'}</div>
        <div style="font-weight:800;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</div>
        <p style="margin-top:10px;font-style:italic">Terima kasih telah berbelanja di toko Kami</p>
      </div>
    `;

    const container = $('#notaContainer');
    if (container) container.classList.add('show');
  }

  /* escape helper */
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  /* -------------------------
     WA send (admin)
  --------------------------*/
  function sendOrderToAdminViaWA(order){
    const lines = [
      `Invoice: ${order.orderID}`,
      `Nama: ${order.nama}`,
      `WA: ${order.wa}`,
      `Jenis: ${order.jenis}`,
      `Isi: ${order.isi} pcs`
    ];
    if (order.mode === 'single' && order.topping.length) lines.push(`Topping: ${order.topping.join(', ')}`);
    if (order.mode === 'double') {
      if (order.topping.length) lines.push(`Topping: ${order.topping.join(', ')}`);
      if (order.taburan.length) lines.push(`Taburan: ${order.taburan.join(', ')}`);
    }
    lines.push(`Jumlah Box: ${order.jumlahBox}`);
    lines.push(`Catatan: ${order.note}`);
    lines.push(`Total: ${formatRp(order.total)}`);

    const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  }

  /* -------------------------
     PDF generator (jsPDF + autoTable if available)
     - Watermark: rotated diagonal (angle) + opacity (GState) with fallback
     - INVOICE PEMBAYARAN maroon on left
     - PUKIS LUMER AULIA right block (bold), alamat + tanggal + telp bold below
     - QRIS: assets/images/qris-pukis.jpg
     - Footer social media + "terima kasih..." above footer
  --------------------------*/
  (function () {
    // load image to dataURL
    function loadImage(path){
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function(){
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img,0,0);
            resolve(canvas.toDataURL('image/png'));
          } catch(e){
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = path;
      });
    }

    function makePdfFactory(jsPDFLib){
      const jsPDFCtor = jsPDFLib && jsPDFLib.jsPDF ? jsPDFLib.jsPDF : jsPDFLib;
      return async function generatePdf(order){
        try {
          if (!jsPDFCtor) throw new Error('jsPDF tidak ditemukan. Pastikan assets/js/lib/jspdf.umd.min.js ada');

          const doc = new jsPDFCtor({ unit: 'mm', format: 'a4' });
          const W = doc.internal.pageSize.getWidth();
          const H = doc.internal.pageSize.getHeight();

          // load images
          const qrisData = await loadImage(ASSET_PREFIX + QRIS_FILENAME);

          // Header center title (toko)
          doc.setFont('helvetica','bold');
          doc.setFontSize(16);
          doc.setTextColor(0,0,0);
          doc.text('PUKIS LUMER AULIA', W/2, 15, { align: 'center' });

          // Left: INVOICE PEMBAYARAN (maroon)
          const leftX = 14;
          const rightX = W - 14;
          doc.setFontSize(14);
          doc.setFont('helvetica','bold');
          doc.setTextColor(96,0,0); // maroon
          doc.text('INVOICE PEMBAYARAN', leftX, 26);

          // Right block: toko info (bold)
          doc.setFont('helvetica','bold');
          doc.setFontSize(9);
          doc.setTextColor(0,0,0);
          const alamat = "Alamat: Jl. Mr. Asa'ad, Kel. Balai-balai (Pasar Kuliner Padang Panjang)";
          const tanggalCetak = `Tanggal cetak: ${order.tgl || new Date().toLocaleString('id-ID')}`;
          const telp = "Telp: 0812 966 68670";
          let ry = 30;
          [alamat, tanggalCetak, telp].forEach(line => {
            doc.text(line, rightX, ry, { align: 'right' });
            ry += 5;
          });

          // Left metadata under invoice
          doc.setFont('helvetica','normal');
          doc.setFontSize(10);
          let ly = 34;
          doc.text(`Nomor Invoice: ${order.orderID || '-'}`, leftX, ly); ly += 6;
          doc.text(`Kepada : ${order.nama || '-'}`, leftX, ly); ly += 6;
          doc.text(`Nomor Telp: ${order.wa || '-'}`, leftX, ly); ly += 6;
          doc.text(`Catatan : ${order.note || '-'}`, leftX, ly); ly += 8;

          // Table rows (manual or autoTable)
          const toppingTxt = order.topping && order.topping.length ? order.topping.join(', ') : '-';
          const taburanTxt = order.taburan && order.taburan.length ? order.taburan.join(', ') : '-';

          const rows = [
            ["Jenis", order.jenis || "-"],
            ["Isi Box", (order.isi || "-") + " pcs"],
            ["Mode", order.mode || "-"],
            ["Topping", toppingTxt],
            ["Taburan", taburanTxt],
            ["Jumlah Box", (order.jumlahBox || 0) + " box"],
            ["Harga Satuan", formatRp(order.pricePerBox || 0)],
            ["Subtotal", formatRp(order.subtotal || 0)],
            ["Diskon", order.discount > 0 ? '-' + formatRp(order.discount) : '-'],
            ["Total Bayar", formatRp(order.total || 0)]
          ];

          let tableEndY = ly + 6;
          if (typeof doc.autoTable === 'function'){
            doc.autoTable({
              startY: ly + 4,
              head: [['Item','Keterangan']],
              body: rows,
              theme: 'grid',
              headStyles: { fillColor: [245, 200, 220], textColor: 0 },
              styles: { fontSize: 10 },
              columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: W - 45 - 28 } }
            });
            tableEndY = doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : (ly + 80);
          } else {
            // fallback
            let ty = ly + 8;
            rows.forEach(r => {
              doc.text(`${r[0]}: ${r[1]}`, leftX, ty);
              ty += 6;
            });
            tableEndY = ty;
          }

          // QRIS left under table
          if (qrisData){
            doc.addImage(qrisData, 'PNG', leftX, tableEndY + 8, 40, 50);
            doc.setFontSize(9);
            doc.text('Scan QRIS untuk pembayaran', leftX, tableEndY + 62);
          }

          // TTD area right
          const ttdX = W - 14 - 50;
          const ttdY = tableEndY + 14;
          doc.setFontSize(10);
          doc.text('Hormat Kami,', ttdX, ttdY);
          doc.text('Pukis Lumer Aulia', ttdX, ttdY + 36);

          // WATERMARK: attempt set opacity (GState) and rotation angle
          const watermarkText = 'Pukis Lumer Aulia';
          const angle = -35; // diagonal (negative = tilt left->right)
          const wmSize = 48;
          try {
            // set opacity if supported
            if (doc.setGState && typeof doc.GState === 'function') {
              doc.setGState(new doc.GState({ opacity: 0.06 }));
            }
          } catch(e){ /* ignore */ }

          // draw rotated text center
          try {
            doc.setFont('helvetica','bolditalic');
            doc.setFontSize(wmSize);
            doc.setTextColor(120,120,120);
            // newer jsPDF-supports angle option
            if (typeof doc.text === 'function') {
              // attempt angle option (supported in modern jsPDF)
              try {
                doc.text(watermarkText, W/2, H/2, { align: 'center', angle });
              } catch(e2) {
                // fallback: translate rotate then text (older jsPDF)
                doc.saveGraphicsState && doc.saveGraphicsState();
                try {
                  // try doc.rotate - some builds support
                  if (typeof doc.rotate === 'function') {
                    doc.setFont(wmSize);
                    doc.rotate(angle, { origin: [W/2, H/2] });
                    doc.text(watermarkText, W/2, H/2, { align: 'center' });
                    doc.rotate(-angle, { origin: [W/2, H/2] });
                  } else {
                    // last fallback: non-rotated center but low opacity (still usable)
                    doc.text(watermarkText, W/2, H/2, { align: 'center' });
                  }
                } catch(e3){
                  doc.text(watermarkText, W/2, H/2, { align: 'center' });
                }
                doc.restoreGraphicsState && doc.restoreGraphicsState();
              }
            }
          } catch(e){ /* ignore watermark failures */ }

          // reset opacity if supported
          try {
            if (doc.setGState && typeof doc.GState === 'function') {
              doc.setGState(new doc.GState({ opacity: 1 }));
            }
          } catch(e){}

          // Terima kasih di atas footer (center)
          doc.setFont('helvetica','bold');
          doc.setFontSize(13);
          doc.setTextColor(0,0,0);
          doc.text('Terima kasih telah berbelanja di toko Kami', W/2, H - 30, { align: 'center' });

          // Footer social media (center)
          doc.setFont('helvetica','normal');
          doc.setFontSize(9);
          const footerText = `FB : PUKIS LUMER AULIA    IG : pukis.lumer_aulia    Tiktok: pukislumer.aulia    Twitter: pukislumer_`;
          doc.text(footerText, W/2, H - 18, { align: 'center' });

          // save
          const safeName = (order.nama || 'Pelanggan').replace(/\s+/g,'_').replace(/[^\w-_\.]/g,'');
          const filename = `Invoice_${safeName}_${order.orderID || Date.now()}.pdf`;
          doc.save(filename);
          return true;
        } catch (err){
          console.error('generatePdf error', err);
          alert('Gagal membuat PDF: ' + (err && err.message ? err.message : err));
          return false;
        }
      };
    }

    // expose factory and, if jsPDF already loaded, prepare generatePdf
    window._makePdfFactory = makePdfFactory;
    if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)){
      window.generatePdf = makePdfFactory(window.jsPDF || window.jspdf);
    }
  })();

  /* -------------------------
     Attach listeners to form controls (HTML acuan)
  --------------------------*/
  function attachListeners(){
    // build toppings into DOM
    buildToppingUI();

    // show/hide based on mode
    const modeRadios = document.querySelectorAll('input[name="ultraToppingMode"]');
    modeRadios.forEach(r => r.addEventListener('change', function(){
      updateToppingVisibility();
      updatePriceUI();
    }));

    // jenis radio change
    const jenisRadios = document.querySelectorAll('input[name="ultraJenis"]');
    jenisRadios.forEach(r => r.addEventListener('change', updatePriceUI));

    // isi select & jumlah input
    const isiSel = $('#ultraIsi');
    if (isiSel) isiSel.addEventListener('change', function(){
      // when isi changes we must enforce topping limits (max=isi)
      updateToppingVisibility();
      updatePriceUI();
    });
    const jumlahInp = $('#ultraJumlah');
    if (jumlahInp) jumlahInp.addEventListener('input', updatePriceUI);

    // also attach delegation to checkbox changes inside groups (in case new created later)
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    [singleGroup, doubleGroup].forEach(g => {
      if (!g) return;
      g.addEventListener('change', function(e){
        if (e.target && e.target.matches('input[type="checkbox"]')) handleCheckboxChange(e);
      });
    });

    // form submit (Buat Nota)
    const form = $('#formUltra');
    if (form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const order = buildOrderObject();
        saveOrderLocal(order);
        renderNotaOnScreen(order);
      });
    }

    // WA send
    const btnWa = $('#ultraSendAdmin');
    if (btnWa){
      btnWa.addEventListener('click', function(e){
        e.preventDefault();
        const order = buildOrderObject();
        saveOrderLocal(order);
        sendOrderToAdminViaWA(order);
      });
    }

    // print/pdf
    const btnPdf = $('#notaPrint');
    if (btnPdf){
      btnPdf.addEventListener('click', async function(e){
        e.preventDefault();
        const order = buildOrderObject();
        saveOrderLocal(order);
        // ensure generatePdf exists or create if jsPDF present
        if (typeof window.generatePdf !== 'function'){
          if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)){
            window.generatePdf = window._makePdfFactory(window.jsPDF || window.jspdf);
          }
        }
        if (typeof window.generatePdf === 'function'){
          await window.generatePdf(order);
        } else {
          alert('PDF generator belum tersedia. Pastikan jsPDF dimuat di halaman.');
        }
      });
    }

    // nota close
    const notaClose = $('#notaClose');
    if (notaClose){
      notaClose.addEventListener('click', function(){
        const nc = $('#notaContainer');
        if (nc) nc.classList.remove('show');
      });
    }

    // initial display state & price calc
    updateToppingVisibility();
    updatePriceUI();
  }

  /* -------------------------
     Init on DOM ready
  --------------------------*/
  function init(){
    attachListeners();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* -------------------------
     Expose for debug if needed
  --------------------------*/
  window._orderjs_final = {
    buildToppingUI, updateToppingVisibility, updatePriceUI, buildOrderObject
  };

})();
