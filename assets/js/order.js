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
   order.js — FINAL (PART 2/2)
   PERUBAHAN SESUAI 9 POIN SANAK:

   ✔ Watermark miring, tebal, sangat buram
   ✔ INVOICE PEMBAYARAN (maroon, bold, besar)
   ✔ Data invoice & pembeli di kiri
   ✔ Identitas toko di kanan
   ✔ QRIS file qris-pukis.jpg ukuran 40×50 mm
   ✔ Footer sosial media
   ✔ Terimakasih di atas footer
   ✔ Nomor antrian dihapus
   ✔ Tabel pink + biru muda tetap
   ✔ TTD tetap (40×30)
   ✔ Semua lain TIDAK DIUBAH
========================================================= */

(function () {
  "use strict";

  /* ---------- Format Rupiah ---------- */
  function formatRp(num) {
    return "Rp " + Number(num || 0).toLocaleString("id-ID");
  }

  /* -------- Load PNG/JPG → dataURL -------- */
  function loadPNGorJPG(path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext("2d").drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = path;
    });
  }

  /* =======================================================
     makeGeneratePdf()
  ======================================================= */
  function makeGeneratePdf(JS) {
    let Doc = JS && JS.jsPDF ? JS.jsPDF : JS;
    if (!Doc && window.jsPDF) Doc = window.jsPDF;

    return async function generatePdf(order) {
      try {
        if (!Doc) throw new Error("jsPDF tidak ditemukan");

        const doc = new Doc({ unit: "mm", format: "a4" });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        /* LOAD GAMBAR */
        const qrisData = await loadPNGorJPG("assets/images/qris-pukis.jpg");
        const ttdData = await loadPNGorJPG("assets/images/ttd.png");

        /* =======================================================
           WATERMARK MIRING TEBAL
        ======================================================= */
        doc.setFont("helvetica", "bold");
        doc.setFontSize(48);
        doc.setTextColor(120, 120, 120);
        doc.setGState(doc.GState({ opacity: 0.07 }));

        // Miring -35°
        doc.saveGraphicsState();
        doc.rotate(-35 * Math.PI / 180, { origin: [W / 2, H / 2] });
        doc.text("Pukis Lumer Aulia", W / 2, H / 2, { align: "center" });
        doc.restoreGraphicsState();

        doc.setGState(doc.GState({ opacity: 1 }));
        doc.setTextColor(0, 0, 0);

        /* =======================================================
           HEADER
        ======================================================= */

        // INVOICE PEMBAYARAN — maroon bold
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(128, 0, 0);
        doc.text("INVOICE PEMBAYARAN", 14, 20);

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        /* =======================================================
           KIRI — DATA INVOICE & PEMBELI
        ======================================================= */
        let y = 28;

        doc.text(`Nomor Invoice : ${order.orderID || "-"}`, 14, y);
        y += 6;

        doc.text(`Kepada        : ${order.nama || "-"}`, 14, y);
        y += 6;

        doc.text(`Nomor Telp    : ${order.wa || "-"}`, 14, y);
        y += 6;

        doc.text(`Catatan       : ${order.note || "-"}`, 14, y);
        y += 10;

        /* =======================================================
           KANAN — IDENTITAS TOKO
        ======================================================= */

        const Xright = W - 14;

        // Judul toko maroon bold
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(128, 0, 0);
        doc.text("PUKIS LUMER AULIA", Xright, 20, { align: "right" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        doc.text("Alamat:", Xright, 28, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text("Jl. Mr. Asa'ad, Kelurahan Balai-balai", Xright, 34, {
          align: "right",
        });
        doc.text("(Pasar Kuliner Padang Panjang)", Xright, 40, {
          align: "right",
        });

        doc.setFont("helvetica", "bold");
        doc.text("Tanggal Cetak:", Xright, 48, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(new Date().toLocaleString("id-ID"), Xright, 54, {
          align: "right",
        });

        doc.setFont("helvetica", "bold");
        doc.text("Telp: 0812 966 68670", Xright, 62, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        /* =======================================================
           TABEL AUTO-TABLE
        ======================================================= */

        const toppingTxt =
          order.topping && order.topping.length
            ? order.topping.join(", ")
            : "-";

        const taburanTxt =
          order.taburan && order.taburan.length
            ? order.taburan.join(", ")
            : "-";

        const rows = [
          ["Jenis", order.jenis || "-"],
          ["Isi Box", (order.isi || "-") + " pcs"],
          ["Mode", order.mode || "-"],
          ["Topping", toppingTxt],
          ["Taburan", taburanTxt],
          ["Jumlah Box", order.jumlahBox + " box"],
          ["Harga Satuan", formatRp(order.pricePerBox || 0)],
          ["Subtotal", formatRp(order.subtotal || 0)],
          ["Diskon", order.discount > 0 ? "-" + formatRp(order.discount) : "-"],
          ["Total Bayar", formatRp(order.total || 0)],
        ];

        if (typeof doc.autoTable === "function") {
          doc.autoTable({
            startY: y,
            head: [["Item", "Keterangan"]],
            body: rows,
            theme: "grid",

            headStyles: {
              fillColor: [255, 105, 180], // Pink
              textColor: 255,
            },

            alternateRowStyles: {
              fillColor: [230, 240, 255], // Biru muda
            },

            styles: {
              fontSize: 10,
              textColor: [0, 0, 0],
            },

            columnStyles: {
              0: { cellWidth: 45 },
              1: { cellWidth: W - 45 - 28 },
            },
          });
        }

        const endTableY =
          (doc.lastAutoTable && doc.lastAutoTable.finalY) || y + 40;

        /* =======================================================
           QRIS 40 × 50 mm
        ======================================================= */
        if (qrisData) {
          doc.addImage(qrisData, "JPEG", 14, endTableY + 8, 40, 50);
          doc.setFontSize(9);
          doc.text("Scan QRIS untuk pembayaran", 14, endTableY + 62);
        }

        /* =======================================================
           TTD 40×30
        ======================================================= */
        const ttdX = W - 14 - 50;
        const ttdY = endTableY + 10;

        doc.setFontSize(10);
        doc.text("Hormat Kami,", ttdX, ttdY);

        if (ttdData) {
          doc.addImage(ttdData, "PNG", ttdX, ttdY + 4, 40, 30);
        }

        doc.text("Pukis Lumer Aulia", ttdX, ttdY + 40);

        /* =======================================================
           UCAPAN TERIMAKASIH
        ======================================================= */

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Terimakasih telah berbelanja di toko Kami", W / 2, H - 25, {
          align: "center",
        });

        /* =======================================================
           FOOTER SOSIAL MEDIA
        ======================================================= */

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        doc.text("FB     : PUKIS LUMER AULIA", W / 2, H - 18, {
          align: "center",
        });
        doc.text("IG     : pukis.lumer_aulia", W / 2, H - 14, {
          align: "center",
        });
        doc.text("Tiktok : pukislumer.aulia", W / 2, H - 10, {
          align: "center",
        });
        doc.text("Twitter: pukislumer_", W / 2, H - 6, { align: "center" });

        /* SAVE */
        const filename = `Invoice_${(order.nama || "Pelanggan").replace(
          /\s+/g,
          "_"
        )}_${order.orderID || Date.now()}.pdf`;

        doc.save(filename);

        return true;
      } catch (err) {
        alert("Gagal membuat PDF: " + err.message);
        console.error(err);
        return false;
      }
    };
  }

  window.makeGeneratePdf = makeGeneratePdf;
})();
