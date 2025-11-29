/* =========================================================
   order.js — FINAL REVISI (TTD + Kolom kanan + Watermark diagonal)
   - Cocok dengan HTML yang Anda kirim
   - Topping/Taburan dibuat di #ultraSingleGroup / #ultraDoubleGroup
   - Hitung otomatis, validasi topping/taburan, simpan localStorage
   - PDF: ttd.png, kolom kanan wrap, header pink tua, zebra rows,
     watermark diagonal (kiri bawah -> kanan atas) berada di area konten
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
  const TTD_FILENAME = "ttd.png";

  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Stroberi","Cappucino","Vanilla","Taro","Matcha"];
  const DOUBLE_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 13000, single: 15000, double: 18000 }, "10": { non: 25000, single: 28000, double: 32000 } }
  };

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function formatRp(n){
    const v = Number(n || 0);
    if (Number.isNaN(v)) return "Rp 0";
    // digit-by-digit safe (per Decision boundary)
    return "Rp " + v.toLocaleString('id-ID');
  }

  /* -------------------------
     Build topping & taburan UI
  --------------------------*/
  function buildToppingUI(){
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;

    // preserve any existing markup class but clear children to ensure consistent behavior
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

    // small visual & event binding
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
    if (jumlahBox >= 10) return Math.round(subtotal * 0.10);
    if (jumlahBox >= 5) return Math.round(subtotal * 0.05);
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
      jenis, isi, mode, topping, taburan, jumlahBox, pricePerBox, subtotal, discount, total,
      tgl: new Date().toLocaleString('id-ID')
    };
  }

  function saveOrderLocal(order){
    try {
      const arr = JSON.parse(localStorage.getItem('orders') || '[]');
      arr.push(order);
      localStorage.setItem('orders', JSON.stringify(arr));
      localStorage.setItem('lastOrder', JSON.stringify(order));
    } catch(e){ console.error('saveOrderLocal', e); }
  }

  /* -------------------------
     Render nota on screen
  --------------------------*/
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

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

  /* -------------------------
     Send to WA
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

    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }

  /* -------------------------
     PDF generator (improved layout)
  --------------------------*/
  (function(){
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
          } catch(e){ resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = path;
      });
    }

    function makePdfFactory(jsPDFLib){
      const jsPDFCtor = jsPDFLib && jsPDFLib.jsPDF ? jsPDFLib.jsPDF : jsPDFLib;
      return async function generatePdf(order){
        try {
          if (!jsPDFCtor) throw new Error('jsPDF tidak ditemukan.');

          const doc = new jsPDFCtor({ unit: 'mm', format: 'a4' });
          const W = doc.internal.pageSize.getWidth();
          const H = doc.internal.pageSize.getHeight();

          const leftX = 14;
          const rightMargin = 14;
          const rightColWidth = 70; // area for right column (no visible border)
          const rightColRightX = W - rightMargin;
          const rightColLeftX = rightColRightX - rightColWidth;
          const centerX = W / 2;

          // Load images
          const qrisData = await loadImage(ASSET_PREFIX + QRIS_FILENAME);
          const ttdData = await loadImage(ASSET_PREFIX + TTD_FILENAME);

          // Header center: store title
          doc.setFont('helvetica','bold');
          doc.setFontSize(16);
          doc.setTextColor(0,0,0);
          doc.text('PUKIS LUMER AULIA', centerX, 15, { align: 'center' });

          // Left: INVOICE PEMBAYARAN (maroon)
          doc.setFontSize(14);
          doc.setFont('helvetica','bold');
          doc.setTextColor(96,0,0); // maroon
          doc.text('INVOICE PEMBAYARAN', leftX, 26);

          // Right column: PUKIS LUMER AULIA + alamat + tanggal + telp
          doc.setFont('helvetica','bold');
          doc.setFontSize(11);
          doc.setTextColor(96,0,0); // match maroon-ish
          // Write store name at right column, center aligned within column
          const rightTitle = 'PUKIS LUMER AULIA';
          // place it right-aligned inside column but use splitTextToSize to wrap long lines
          const maxRightWidth = rightColWidth - 4;
          const splitTitle = doc.splitTextToSize(rightTitle, maxRightWidth);
          let ry = 23;
          splitTitle.forEach(line => {
            doc.text(line, rightColRightX - 2, ry, { align: 'right' });
            ry += 5;
          });

          // Below that: alamat, tanggal cetak, telp (bold)
          doc.setFont('helvetica','bold');
          doc.setFontSize(9);
          doc.setTextColor(0,0,0);
          const alamat = "Alamat: Jl. Mr. Asa'ad, Kel. Balai-balai (Pasar Kuliner Padang Panjang)";
          const tanggalCetak = `Tanggal cetak: ${order.tgl || new Date().toLocaleString('id-ID')}`;
          const telp = "Telp: 0812 966 68670";
          const rightLines = doc.splitTextToSize(alamat, maxRightWidth).concat(doc.splitTextToSize(tanggalCetak, maxRightWidth)).concat(doc.splitTextToSize(telp, maxRightWidth));
          rightLines.forEach(line => {
            doc.text(line, rightColRightX - 2, ry, { align: 'right' });
            ry += 5;
          });

          // Left metadata block under INVOICE PEMBAYARAN
          doc.setFont('helvetica','normal');
          doc.setFontSize(10);
          let ly = 34;
          doc.text(`Nomor Invoice: ${order.orderID || '-'}`, leftX, ly); ly += 6;
          doc.text(`Kepada : ${order.nama || '-'}`, leftX, ly); ly += 6;
          doc.text(`Nomor Telp: ${order.wa || '-'}`, leftX, ly); ly += 6;
          doc.text(`Catatan : ${order.note || '-'}`, leftX, ly); ly += 8;

          // Table — use autoTable if available
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
              headStyles: { fillColor: [199, 0, 86], textColor: 255 }, // pink tua header
              styles: { fontSize: 10, textColor: 0 },
              alternateRowStyles: { fillColor: [255, 245, 250] }, // pink-light for alternate
              columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: W - 45 - rightMargin - 14 } }
            });
            tableEndY = doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : (ly + 80);
          } else {
            // fallback simple text
            let ty = ly + 8;
            rows.forEach(r => {
              doc.text(`${r[0]}: ${r[1]}`, leftX, ty);
              ty += 6;
            });
            tableEndY = ty;
          }

          // QRIS under table (left)
          if (qrisData){
            doc.addImage(qrisData, 'PNG', leftX, tableEndY + 8, 40, 50);
            doc.setFontSize(9);
            doc.text('Scan QRIS untuk pembayaran', leftX, tableEndY + 62);
          }

          // Signature block on RIGHT column centered in that column
          // We'll position it vertically a bit below tableEndY if space; else push to next page
          const sigTop = Math.max(tableEndY + 8, ry + 6); // ensure below whichever is lower
          const sigCenterX = rightColLeftX + rightColWidth / 2;
          let sigY = sigTop;
          doc.setFontSize(10);
          doc.setFont('helvetica','normal');
          doc.text('Hormat Kami,', sigCenterX, sigY, { align: 'center' });
          sigY += 6;

          // TTD image (try center)
          if (ttdData){
            // choose image width 40mm, height auto ratio to keep scale. We'll use 40x25 mm
            const imgW = 40;
            const imgH = 25;
            const imgX = sigCenterX - (imgW / 2);
            doc.addImage(ttdData, 'PNG', imgX, sigY, imgW, imgH);
            sigY += imgH + 6;
          } else {
            // leave gap for signature if not present
            sigY += 25;
          }

          doc.setFont('helvetica','bold');
          doc.setFontSize(10);
          doc.text('Pukis Lumer Aulia', sigCenterX, sigY, { align: 'center' });

          // WATERMARK diagonal left-bottom -> right-top inside content area
          // We'll draw across the table area from near leftX to near rightColLeftX
          try {
            // set low opacity if supported
            if (doc.setGState && typeof doc.GState === 'function') {
              doc.setGState(new doc.GState({ opacity: 0.06 }));
            }
          } catch(e){ /* ignore */ }

          const wmText = 'Pukis Lumer Aulia';
          const angle = 35; // rotate positively for left-bottom -> right-top
          const wmFontSize = 56;

          // Determine area center for watermark: between leftX and rightColLeftX horizontally,
          // vertically between (ly) and (tableEndY)
          const areaLeft = leftX + 10;
          const areaRight = rightColLeftX - 10;
          const areaTop = 40;
          const areaBottom = Math.min(tableEndY + 10, H - 80);
          const areaCenterX = (areaLeft + areaRight) / 2;
          const areaCenterY = (areaTop + areaBottom) / 2;

          doc.setFont('helvetica','bolditalic');
          doc.setFontSize(wmFontSize);
          doc.setTextColor(120,120,120);

          // Try using angle option; fallback to non-rotated if fails
          try {
            // modern jsPDF supports angle in text options
            doc.text(wmText, areaCenterX, areaCenterY, { align: 'center', angle: angle });
          } catch (e) {
            // fallback: draw center (not rotated)
            doc.text(wmText, areaCenterX, areaCenterY, { align: 'center' });
          }

          // reset opacity
          try {
            if (doc.setGState && typeof doc.GState === 'function') {
              doc.setGState(new doc.GState({ opacity: 1 }));
            }
          } catch(e){}

          // Remark / TTD area done.

          // Terima kasih above footer (center)
          doc.setFont('helvetica','bold');
          doc.setFontSize(13);
          doc.setTextColor(0,0,0);
          doc.text('Terima kasih telah berbelanja di toko Kami', centerX, H - 30, { align: 'center' });

          // Footer social media (center)
          doc.setFont('helvetica','normal');
          doc.setFontSize(9);
          const footerText = `FB : PUKIS LUMER AULIA    IG : pukis.lumer_aulia    Tiktok: pukislumer.aulia    Twitter: pukislumer_`;
          doc.text(footerText, centerX, H - 18, { align: 'center' });

          // Save file
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

    window._makePdfFactory = makePdfFactory;
    if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
      window.generatePdf = makePdfFactory(window.jsPDF || window.jspdf);
    }
  })();

  /* -------------------------
     Attach listeners & init
  --------------------------*/
  function attachListeners(){
    buildToppingUI();

    // mode radios
    $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', function(){
      updateToppingVisibility();
      updatePriceUI();
    }));

    // jenis radios
    $$('input[name="ultraJenis"]').forEach(r => r.addEventListener('change', updatePriceUI));

    // isi & jumlah
    const isiSel = $('#ultraIsi');
    if (isiSel) isiSel.addEventListener('change', function(){
      updateToppingVisibility();
      updatePriceUI();
    });
    const jumlah = $('#ultraJumlah');
    if (jumlah) jumlah.addEventListener('input', updatePriceUI);

    // form submit
    const form = $('#formUltra');
    if (form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const order = buildOrderObject();
        saveOrderLocal(order);
        renderNotaOnScreen(order);
      });
    }

    // WA
    const btnWa = $('#ultraSendAdmin');
    if (btnWa) btnWa.addEventListener('click', function(e){
      e.preventDefault();
      const order = buildOrderObject();
      saveOrderLocal(order);
      sendOrderToAdminViaWA(order);
    });

    // PDF
    const btnPdf = $('#notaPrint');
    if (btnPdf) btnPdf.addEventListener('click', async function(e){
      e.preventDefault();
      const order = buildOrderObject();
      saveOrderLocal(order);
      if (typeof window.generatePdf !== 'function'){
        if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)){
          window.generatePdf = window._makePdfFactory(window.jsPDF || window.jspdf);
        }
      }
      if (typeof window.generatePdf === 'function'){
        await window.generatePdf(order);
      } else {
        alert('PDF generator belum tersedia. Pastikan jsPDF dimuat.');
      }
    });

    // nota close
    const notaClose = $('#notaClose');
    if (notaClose) notaClose.addEventListener('click', function(){ const nc = $('#notaContainer'); if (nc) nc.classList.remove('show'); });

    // initial state
    updateToppingVisibility();
    updatePriceUI();
  }

  function init(){
    attachListeners();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose for debug
  window._orderjs_final = { buildToppingUI, updateToppingVisibility, updatePriceUI, buildOrderObject };

})();
