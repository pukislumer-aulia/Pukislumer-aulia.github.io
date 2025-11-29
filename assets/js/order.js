/* =========================================================
   order.js — FINAL (REVISI)
   - Mematuhi: hanya ubah apa yang diminta user pada PDF/nota
   - Tidak membuat/mengganti checkbox topping/taburan (pakai HTML sebagai acuan)
   - Mengembalikan hitung otomatis (live calculation)
   - Nomor antrian dihapus dari invoice/penyimpanan
   - QRIS: assets/images/qris-pukis.jpg
   - Footer & teks sesuai permintaan
   - Pastikan HTML Anda memiliki elemen dengan id/class yang dipakai di sini
========================================================= */

(function () {
  'use strict';

  /* -----------------------
     Konfigurasi (ubah jika butuh)
  ------------------------*/
  const ADMIN_WA = "6281296668670";
  const ASSET_PREFIX = "assets/images/";
  const QRIS_FILENAME = "qris-pukis.jpg";

  // Struktur harga: tetap pakai data internal; cocokkan ke backend/HTML Anda jika berbeda
  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 13000, single: 15000, double: 18000 }, "10": { non: 25000, single: 28000, double: 32000 } }
  };

  // helper sederhana DOM
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function formatRp(num) { return "Rp " + Number(num || 0).toLocaleString('id-ID'); }
  function esc(s){ return String(s == null ? "" : s); }

  /* -----------------------
     Ambil nilai form dari HTML (HTML adalah acuan)
     - Tidak membuat checkbox baru. Menggunakan apa yang tersedia:
       * topping checkbox: selector '.topping-check input', '.topping input' atau input[name="topping[]"]
       * taburan checkbox: '.taburan-check input', '.taburan input' atau input[name="taburan[]']
  ------------------------*/
  function getSelectedRadioValue(name) {
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }

  function getToppingValuesFromDOM() {
    // beberapa kemungkinan selector yang biasa dipakai — baca yang ada di HTML
    const sels = [
      '.topping-check input:checked',
      '.topping input:checked',
      'input[name="topping[]"]:checked',
      'input[name="topping"]:checked'
    ];
    for (let s of sels) {
      const found = $$(s);
      if (found && found.length) return found.map(i => i.value);
    }
    return [];
  }

  function getTaburanValuesFromDOM() {
    const sels = [
      '.taburan-check input:checked',
      '.taburan input:checked',
      'input[name="taburan[]"]:checked',
      'input[name="taburan"]:checked'
    ];
    for (let s of sels) {
      const found = $$(s);
      if (found && found.length) return found.map(i => i.value);
    }
    return [];
  }

  function getNumberFromSelector(sel, fallback=0) {
    const el = $(sel);
    if (!el) return fallback;
    const v = Number(el.value);
    return isNaN(v) ? fallback : v;
  }

  function getPricePerBox(jenis, isi, mode) {
    jenis = jenis || 'Original';
    isi = String(isi || '5');
    mode = (mode || 'non').toLowerCase();
    try {
      return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0;
    } catch (e) { return 0; }
  }

  function calcDiscount(jumlahBox, subtotal) {
    if (jumlahBox >= 10) return Math.round(subtotal * 0.10);
    if (jumlahBox >= 5) return Math.round(subtotal * 0.05);
    return 0;
  }

  /* -----------------------
     Update harga otomatis ke UI (mengisi elemen hasil jika ada)
     - Elemen yang diharapkan di HTML: #ultraPricePerBox, #ultraSubtotal, #ultraDiscount, #ultraGrandTotal
  ------------------------*/
  function updatePriceUI() {
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isiEl = $('#ultraIsi') || $('#selectIsi') || document.querySelector('select[name="isi"]');
    const isi = isiEl ? isiEl.value : '5';
    const mode = getSelectedRadioValue('ultraToppingMode') || getSelectedRadioValue('toppingMode') || 'non';
    const jumlahEl = $('#ultraJumlah') || document.querySelector('input[name="jumlah"]') || document.querySelector('#qty');
    const jumlah = jumlahEl ? (Number(jumlahEl.value) || 1) : 1;

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
    if (elDiscount) elDiscount.textContent = (discount > 0) ? '-' + formatRp(discount) : '-';
    if (elGrand) elGrand.textContent = formatRp(total);

    // return object utk keperluan lain
    return { jenis, isi, mode, jumlah, pricePerBox, subtotal, discount, total };
  }

  /* -----------------------
     Build order object (tidak menyertakan nomor antrian)
  ------------------------*/
  function buildOrderObject() {
    const nama = $('#ultraNama') ? $('#ultraNama').value.trim() : (document.querySelector('input[name="nama"]') ? document.querySelector('input[name="nama"]').value.trim() : '-');
    const wa = $('#ultraWA') ? $('#ultraWA').value.trim() : (document.querySelector('input[name="wa"]') ? document.querySelector('input[name="wa"]').value.trim() : '-');
    const note = $('#ultraNote') ? $('#ultraNote').value.trim() : (document.querySelector('textarea[name="note"]') ? document.querySelector('textarea[name="note"]').value.trim() : '-');

    const jenis = getSelectedRadioValue('ultraJenis') || getSelectedRadioValue('jenis') || 'Original';
    const isiEl = $('#ultraIsi') || $('#selectIsi') || document.querySelector('select[name="isi"]');
    const isi = isiEl ? isiEl.value : '5';
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';

    const jumlahEl = $('#ultraJumlah') || document.querySelector('input[name="jumlah"]') || document.querySelector('#qty');
    const jumlahBox = jumlahEl ? (Number(jumlahEl.value) || 1) : 1;

    const topping = getToppingValuesFromDOM();
    const taburan = getTaburanValuesFromDOM();

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlahBox;
    const discount = calcDiscount(jumlahBox, subtotal);
    const total = subtotal - discount;

    const now = Date.now();
    const orderID = 'INV' + now;

    return {
      orderID,
      nama: nama || '-',
      wa: wa || '-',
      note: note || '-',
      jenis, isi, mode,
      topping, taburan,
      jumlahBox, pricePerBox, subtotal, discount, total,
      tgl: new Date().toLocaleString('id-ID')
      // antrian sengaja tidak disertakan / dihapus
    };
  }

  /* -----------------------
     Simpan order local (kompatibel, tidak menyertakan antrian)
  ------------------------*/
  function saveOrderLocal(order) {
    try {
      const arr = JSON.parse(localStorage.getItem('orders') || '[]');
      arr.push(order);
      localStorage.setItem('orders', JSON.stringify(arr));
      localStorage.setItem('lastOrder', JSON.stringify(order));
    } catch (e) {
      console.error('saveOrderLocal error', e);
    }
  }

  /* -----------------------
     Render nota sederhana ke elemen notaContent (HTML acuan)
     - Menampilkan nomor invoice, kepada, nomor telp, catatan di kiri
     - Tidak menyertakan antrian
  ------------------------*/
  function renderNotaOnScreen(order) {
    const notaContent = $('#notaContent') || document.querySelector('.nota-content');
    if (!notaContent) return;
    const toppingText = order.topping && order.topping.length ? order.topping.join(', ') : '-';
    const taburanText = order.taburan && order.taburan.length ? order.taburan.join(', ') : '-';

    notaContent.innerHTML = `
      <div class="nota-left-block">
        <p style="font-weight:700;color:#5f0000;font-size:14px;">INVOICE PEMBAYARAN</p>
        <p><strong>Nomor Invoice:</strong> ${esc(order.orderID)}</p>
        <p><strong>Kepada :</strong> ${esc(order.nama)}</p>
        <p><strong>Nomor Telp:</strong> ${esc(order.wa)}</p>
        <p><strong>Catatan:</strong> ${esc(order.note)}</p>
      </div>

      <div style="margin-top:8px;">
        <hr>
        <p><strong>Jenis:</strong> ${esc(order.jenis)} — ${esc(String(order.isi))} pcs</p>
        <p><strong>Mode:</strong> ${esc(order.mode)}</p>
        <p><strong>Topping:</strong> ${esc(toppingText)}</p>
        <p><strong>Taburan:</strong> ${esc(taburanText)}</p>
        <p><strong>Jumlah Box:</strong> ${esc(String(order.jumlahBox))}</p>
        <p><strong>Harga Satuan:</strong> ${formatRp(order.pricePerBox)}</p>
        <p><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</p>
        <p><strong>Diskon:</strong> ${order.discount > 0 ? '-' + formatRp(order.discount) : '-'}</p>
        <p style="font-weight:700;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</p>
        <p style="margin-top:12px;"><em>Terima kasih telah berbelanja di toko Kami</em></p>
      </div>
    `;
    // tunjukkan popup jika ada container
    const notaContainer = $('#notaContainer') || document.querySelector('.nota-container');
    if (notaContainer) notaContainer.classList.add('show');
  }

  /* -----------------------
     WA send (menggunakan order object). Tidak menyertakan antrian.
  ------------------------*/
  function sendOrderToAdminViaWA(order) {
    const lines = [
      `Invoice: ${order.orderID}`,
      `Nama: ${order.nama}`,
      `WA: ${order.wa}`,
      `Jenis: ${order.jenis}`,
      `Isi: ${order.isi} pcs`,
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

  /* -----------------------
     PDF generator (jsPDF + autoTable jika tersedia)
     - Implementasi perubahan sesuai permintaan user:
       * Watermark miring (bold+italic, low opacity)
       * INVOICE PEMBAYARAN kiri besar maroon
       * Detail toko kanan (alamat, tanggal cetak, telp) tebal
       * QRIS menggunakan assets/images/qris-pukis.jpg
       * Footer social media sesuai instruksi
       * Hapus nomor antrian dari PDF
  ------------------------*/
  (function () {
    function loadImageToDataURL(path) {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = path;
      });
    }

    function makePdfFactory(jsPDForLib) {
      const jsPDFLib = jsPDForLib && jsPDForLib.jsPDF ? jsPDForLib.jsPDF : jsPDForLib;
      return async function generatePdf(order) {
        try {
          if (!jsPDFLib) throw new Error('jsPDF tidak ditemukan. Pastikan library jsPDF dimuat.');

          const doc = new jsPDFLib({ unit: 'mm', format: 'a4' });
          const W = doc.internal.pageSize.getWidth();
          const H = doc.internal.pageSize.getHeight();

          // Load qris
          const qrisData = await loadImageToDataURL(ASSET_PREFIX + QRIS_FILENAME);

          // HEADER & teks sesuai permintaan
          const leftX = 14;
          const rightX = W - 14;

          // Right: toko name centered top (tetap)
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.text('PUKIS LUMER AULIA', W / 2, 15, { align: 'center' });

          // Left: INVOICE PEMBAYARAN - maroon tebal
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(96, 0, 0); // maroon-ish
          doc.text('INVOICE PEMBAYARAN', leftX, 26);

          // Reset color untuk block lain
          doc.setTextColor(0, 0, 0);

          // Right block: toko info tebal
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          const alamat = "Alamat: Jl. Mr. Asa'ad, Kel. Balai-balai (Pasar Kuliner Padang Panjang)";
          const tanggalCetak = `Tanggal cetak: ${order.tgl || new Date().toLocaleString('id-ID')}`;
          const telp = "Telp: 0812 966 68670";
          let ry = 30;
          [alamat, tanggalCetak, telp].forEach(line => {
            doc.text(line, rightX, ry, { align: 'right' });
            ry += 5;
          });

          // Left metadata below INVOICE PEMBAYARAN
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          let ly = 34;
          doc.text(`Nomor Invoice: ${order.orderID || "-"}`, leftX, ly); ly += 6;
          doc.text(`Kepada : ${order.nama || "-"}`, leftX, ly); ly += 6;
          doc.text(`Nomor Telp: ${order.wa || "-"}`, leftX, ly); ly += 6;
          doc.text(`Catatan : ${order.note || "-"}`, leftX, ly); ly += 8;

          // Table-like area (manual atau autoTable)
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
            ["Diskon", order.discount > 0 ? "-" + formatRp(order.discount) : "-"],
            ["Total Bayar", formatRp(order.total || 0)]
          ];

          let tableEndY = ly + 6;
          if (typeof doc.autoTable === 'function') {
            doc.autoTable({
              startY: ly + 4,
              head: [['Item', 'Keterangan']],
              body: rows,
              theme: 'grid',
              styles: { fontSize: 10 },
              columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: W - 45 - 28 } }
            });
            tableEndY = doc.lastAutoTable ? doc.lastAutoTable.finalY : (ly + 80);
          } else {
            // fallback text table
            let ty = ly + 8;
            rows.forEach(r => {
              doc.text(`${r[0]}: ${r[1]}`, leftX, ty);
              ty += 6;
            });
            tableEndY = ty;
          }

          // QRIS on left under table
          if (qrisData) {
            doc.addImage(qrisData, 'PNG', leftX, tableEndY + 8, 40, 50);
            doc.setFontSize(9);
            doc.text('Scan QRIS untuk pembayaran', leftX, tableEndY + 62);
          }

          // TTD area on right
          const ttdX = W - 14 - 50;
          const ttdY = tableEndY + 14;
          doc.setFontSize(10);
          doc.text('Hormat Kami,', ttdX, ttdY);
          doc.text('Pukis Lumer Aulia', ttdX, ttdY + 36);

          // WATERMARK (besar di tengah, bold italic, buram)
          try {
            if (doc.setGState) {
              doc.setGState(new doc.GState({ opacity: 0.06 }));
            }
          } catch (e) { /* ignore if not supported */ }

          doc.setFont('helvetica', 'bolditalic');
          doc.setFontSize(48);
          doc.setTextColor(110, 110, 110);
          // Rotasi diagonal: beberapa versi jsPDF mungkin tidak support rotation pada textOptions, 
          // jadi gunakan transform jika tersedia; tetap, untuk kompatibilitas kita letakkan center tanpa transformasi rotasi yang riskan.
          doc.text('Pukis Lumer Aulia', W / 2, H / 2, { align: 'center', baseline: 'middle' });

          // reset opacity
          try {
            if (doc.setGState) {
              doc.setGState(new doc.GState({ opacity: 1 }));
            }
          } catch (e) { }

          // Terima kasih di atas footer (tengah)
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(0,0,0);
          doc.text('Terima kasih telah berbelanja di toko Kami', W / 2, H - 30, { align: 'center' });

          // Footer social media (tengah)
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const footerText = `FB : PUKIS LUMER AULIA    IG : pukis.lumer_aulia    Tiktok: pukislumer.aulia    Twitter: pukislumer_`;
          doc.text(footerText, W / 2, H - 18, { align: 'center' });

          // Save file
          const filename = `Invoice_${(order.nama || 'Pelanggan').replace(/\s+/g,'_')}_${order.orderID || Date.now()}.pdf`;
          doc.save(filename);

          return true;
        } catch (err) {
          console.error('generatePdf error', err);
          alert('Gagal membuat PDF: ' + (err && err.message ? err.message : err));
          return false;
        }
      };
    }

    // expose factory jika jsPDF tersedia nanti
    window._makePdfFactory = makePdfFactory;
    // jika jsPDF sudah ada saat ini, siapakan generatePdf
    if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
      window.generatePdf = makePdfFactory(window.jsPDF || window.jspdf);
    }
  })();

  /* -----------------------
     Attach listeners: gunakan elemen yang ada di HTML
     - Jangan ubah HTML
     - Pastikan selectors cocok dengan HTML Anda
  ------------------------*/
  function attachListeners() {
    // recalc when options change
    const selectorsToWatch = [
      'input[name="ultraJenis"]',
      'input[name="jenis"]',
      '#ultraIsi',
      'select[name="isi"]',
      'input[name="ultraToppingMode"]',
      'input[name="toppingMode"]',
      '#ultraJumlah',
      'input[name="jumlah"]',
      '#ultraJumlah',
      'input[type="checkbox"]' // generic: recalc when checkboxes change (topping/taburan)
    ];

    selectorsToWatch.forEach(sel => {
      $$(sel).forEach(el => {
        el.addEventListener('change', updatePriceUI);
        el.addEventListener('input', updatePriceUI);
      });
    });

    // initial calc
    updatePriceUI();

    // form submit (jaga kompatibilitas nama form di HTML)
    const form = $('#formUltra') || document.querySelector('form#form-ultra') || document.querySelector('form[name="orderForm"]') || document.querySelector('form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const order = buildOrderObject();
        saveOrderLocal(order);
        renderNotaOnScreen(order);
      });
    }

    // tombol kirim admin WA
    const btnWa = $('#ultraSendAdmin') || $('#btnWa') || $('#sendAdmin') || document.querySelector('.btn-send-wp');
    if (btnWa) {
      btnWa.addEventListener('click', function (e) {
        e.preventDefault();
        const order = buildOrderObject();
        saveOrderLocal(order);
        sendOrderToAdminViaWA(order);
      });
    }

    // tombol print/pdf
    const btnPdf = $('#notaPrint') || $('#btnPdf') || document.querySelector('.btn-pdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', async function (e) {
        e.preventDefault();
        const order = buildOrderObject();
        saveOrderLocal(order);
        // ensure generator available
        if (typeof window.generatePdf !== 'function') {
          // attempt to create generator if jsPDF present
          if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
            window.generatePdf = window._makePdfFactory(window.jsPDF || window.jspdf);
          }
        }
        if (typeof window.generatePdf === 'function') {
          await window.generatePdf(order);
        } else {
          alert('PDF generator belum tersedia. Pastikan jsPDF dimuat di halaman.');
        }
      });
    }

    // close nota jika ada tombol tertutup
    const notaClose = $('#notaClose') || document.querySelector('.nota-close');
    if (notaClose) {
      notaClose.addEventListener('click', function () {
        const container = $('#notaContainer') || document.querySelector('.nota-container');
        if (container) container.classList.remove('show');
      });
    }
  }

  /* -----------------------
     Init when DOM ready
  ------------------------*/
  function init() {
    attachListeners();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose small helpers (debug)
  window._orderjs = {
    updatePriceUI, buildOrderObject, saveOrderLocal, getToppingValuesFromDOM, getTaburanValuesFromDOM
  };

})();
