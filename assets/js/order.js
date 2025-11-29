/* =========================================================
   order.js — FINAL (UPDATED)
   - Hanya perubahan sesuai permintaan user (lihat komentar)
   - Menghapus nomor antrian
   - PDF: layout & teks sesuai poin user
   - Watermark italic + bold, agak buram, di tengah dan area kolom
   - QRIS menggunakan assets/images/qris-pukis.jpg
   - Tidak merubah struktur HTML / CSS
========================================================= */

(function(){

  'use strict';

  /* ----------------------
     Konstanta & utilitas
  -----------------------*/

  const ADMIN_WA = "6281296668670"; // nomor toko
  const ASSET_PREFIX = "assets/images/"; // path gambar (logo.png, qris-pukis.jpg, ttd.png)

  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino","Taro","Matcha"];
  const DOUBLE_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  // contoh base price per jenis/isi/mode -> sesuaikan bila perlu
  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 13000, single: 15000, double: 18000 }, "10": { non: 25000, single: 28000, double: 32000 } }
  };

  const MAX_TOPPING = 5;
  const MAX_TABURAN = 5;

  // helper
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function formatRp(num){ return "Rp " + Number(num || 0).toLocaleString('id-ID'); }
  function escapeHtml(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  /* ----------------------
     BANGUN CHECKBOX Topping/Taburan
  -----------------------*/
  function buildToppingUI() {
    const singleContainer = $('#ultraSingleGroup');
    const doubleContainer = $('#ultraDoubleGroup');
    if (!singleContainer || !doubleContainer) return;

    singleContainer.innerHTML = '';
    doubleContainer.innerHTML = '';

    SINGLE_TOPPINGS.forEach(t => {
      const id = 'topping-' + t.toLowerCase().replace(/\s+/g,'-');
      const label = document.createElement('label');
      label.className = 'topping-check';
      label.innerHTML = `<input type="checkbox" value="${t}" id="${id}"> ${t}`;
      singleContainer.appendChild(label);
    });

    DOUBLE_TABURAN.forEach(t => {
      const id = 'taburan-' + t.toLowerCase().replace(/\s+/g,'-');
      const label = document.createElement('label');
      label.className = 'taburan-check';
      label.innerHTML = `<input type="checkbox" value="${t}" id="${id}"> ${t}`;
      doubleContainer.appendChild(label);
    });

    document.addEventListener('change', function(e){
      const tgt = e.target;
      if (!tgt) return;
      const label = tgt.closest('.topping-check') || tgt.closest('.taburan-check');
      if (label) {
        if (tgt.checked) label.classList.add('checked'); else label.classList.remove('checked');
      }
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
      updatePriceUI();
    });
  }

  /* ----------------------
     HELPERS membaca form
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
     Kalkulasi harga sederhana
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
    const v = getSelectedRadioValue('ultraToppingMode');
    return v || 'non';
  }

  /* ----------------------
     Show/hide toppings based on mode
  -----------------------*/
  function updateToppingVisibility() {
    const mode = getSelectedToppingMode();
    const singleGroup = $('#ultraSingleGroup');
    const doubleGroup = $('#ultraDoubleGroup');
    if (!singleGroup || !doubleGroup) return;

    if (mode === 'non') {
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
      $$('.taburan-check input:checked').forEach(i => { i.checked = false; i.closest('.taburan-check')?.classList.remove('checked'); });
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
    buildToppingUI();
    updateToppingVisibility();

    $$('.opt-group input[name="ultraJenis"], input[name="ultraJenis"]').forEach(r => r.addEventListener('change', () => updatePriceUI()));
    $('#ultraIsi')?.addEventListener('change', () => updatePriceUI());
    $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', () => { updateToppingVisibility(); updatePriceUI(); }));
    $('#ultraJumlah')?.addEventListener('input', () => updatePriceUI());
  }

  /* ----------------------
     Prepare order object from form
     NOTE: nomor antrian dihilangkan sesuai permintaan
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

    const now = Date.now();

    const order = {
      id: 'INV' + now,
      orderID: 'INV' + now,
      // antrian dihapus -> tetap '-' agar kompatibel bila ada referensi di UI
      antrian: '-',
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
     Save order (localStorage) - simpan orders & lastOrder
     TIDAK lagi menyimpan / menaikkan nomor antrian
  -----------------------*/
  function saveOrder(order) {
    try {
      const arr = JSON.parse(localStorage.getItem('orders') || '[]');
      arr.push(order);
      localStorage.setItem('orders', JSON.stringify(arr));
      localStorage.setItem('lastOrder', JSON.stringify(order));
    } catch (e) { console.error('saveOrder error', e); }
  }

  /* ----------------------
     Render nota popup (fills #notaContent)
     Menghapus tampilan nomor antrian (sesuai permintaan)
  -----------------------*/
  function renderNota(order) {
    if (!order) return;
    const toppingText = (order.topping && order.topping.length) ? order.topping.join(', ') : '-';
    const taburanText = (order.taburan && order.taburan.length) ? order.taburan.join(', ') : '-';

    // Tampilan nota di popup — jangan ubah struktur HTML, hanya isi konten
    const content = `
      <p><strong>Nomor Invoice:</strong> ${escapeHtml(order.orderID)}</p>
      <p><strong>Kepada :</strong> ${escapeHtml(order.nama)}</p>
      <p><strong>Nomor Telp:</strong> ${escapeHtml(order.wa)}</p>
      <p><strong>Catatan:</strong> ${escapeHtml(order.note)}</p>

      <hr style="margin:8px 0">

      <p><strong>Jenis:</strong> ${escapeHtml(order.jenis)} — ${escapeHtml(String(order.isi))} pcs</p>
      <p><strong>Mode:</strong> ${escapeHtml(order.mode)}</p>
      <p><strong>Topping:</strong> ${escapeHtml(toppingText)}</p>
      <p><strong>Taburan:</strong> ${escapeHtml(taburanText)}</p>

      <p><strong>Jumlah Box:</strong> ${escapeHtml(String(order.jumlahBox))}</p>
      <p><strong>Harga Satuan:</strong> ${formatRp(order.pricePerBox)}</p>
      <p><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</p>
      <p><strong>Diskon:</strong> ${order.discount>0 ? '-' + formatRp(order.discount) : '-'}</p>
      <p style="font-weight:700;"><strong>Total Bayar:</strong> ${formatRp(order.total)}</p>

      <p style="margin-top:10px;"><em>Terima kasih telah berbelanja di toko Kami</em></p>
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
    const form = $('#formUltra') || $('#form-ultra') || document.querySelector('form#formUltra');
    if (form) {
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const order = buildOrderObject();
        saveOrder(order);
        renderNota(order);
      });
    }

    const notaClose = $('#notaClose') || $('#closeNota') || document.querySelector('.nota-close');
    if (notaClose) notaClose.addEventListener('click', () => {
      const nc = $('#notaContainer');
      if (nc) nc.classList.remove('show');
    });

    // send WA admin — Hapus nomor antrian dari pesan
    const sendBtn = $('#ultraSendAdmin') || $('#btnWa') || $('#sendAdmin');
    if (sendBtn) {
      sendBtn.addEventListener('click', function(){
        const order = buildOrderObject();
        saveOrder(order);
        // build message
        const lines = [
          `Invoice: ${order.orderID}`,
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
        let last = null;
        try { last = JSON.parse(localStorage.getItem('lastOrder') || 'null'); } catch(e) { last = null; }
        if (!last) { last = buildOrderObject(); localStorage.setItem('lastOrder', JSON.stringify(last)); }
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
     jsPDF wait/attach helper (generator declared below)
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

  /* =======================================================
     PDF GENERATOR (makeGeneratePdf)
     - diterapkan perubahan sesuai permintaan user
  ======================================================= */

  (function(){
    // helper untuk load gambar -> dataURL
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

    function makeGeneratePdf(JS) {
      let Doc = JS && JS.jsPDF ? JS.jsPDF : JS;
      if (!Doc && window.jsPDF) Doc = window.jsPDF;

      return async function generatePdf(order) {
        try {
          if (!Doc) throw new Error("jsPDF tidak ditemukan");

          const doc = new Doc({ unit: "mm", format: "a4" });
          const W = doc.internal.pageSize.getWidth();
          const H = doc.internal.pageSize.getHeight();

          /* LOAD GAMBAR: gunakan qris-pukis.jpg sesuai permintaan */
          const qrisData = await loadPNGorJPG(ASSET_PREFIX + "qris-pukis.jpg");
          const ttdData = await loadPNGorJPG(ASSET_PREFIX + "ttd.png");

          /* HEADER PDF */
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(0,0,0);
          // Judul utama di tengah (tetap ada)
          doc.text("PUKIS LUMER AULIA", W / 2, 15, { align: "center" });

          // Left: INVOICE PEMBAYARAN (lebih besar, merah maron tebal)
          const leftX = 14;
          const rightX = W - 14;
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          // maroon color
          doc.setTextColor(96, 0, 0); // maroon-ish
          doc.text("INVOICE PEMBAYARAN", leftX, 26);

          // Reset text color for other texts where needed
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(0,0,0);

          // Right side: PUKIS LUMER AULIA (sama font/feel seperti invoice pemesanan)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("PUKIS LUMER AULIA", rightX, 25, { align: "right" });

          // bawah kanan: alamat + tanggal cetak + telp (tebal)
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          const alamat = "Alamat: Jl. Mr. Asa'ad, Kel. Balai-balai (Pasar Kuliner Padang Panjang)";
          const tanggalCetak = `Tanggal cetak: ${order.tgl || new Date().toLocaleString("id-ID")}`;
          const telp = "Telp: 0812 966 68670";
          // multi-line right aligned
          const rightLines = [alamat, tanggalCetak, telp];
          let ry = 30;
          rightLines.forEach(line => {
            doc.text(line, rightX, ry, { align: "right" });
            ry += 5;
          });

          // =========================
          // Left metadata block under "INVOICE PEMBAYARAN"
          // Nomor invoice / kepada / nomor telp / catatan
          // =========================
          doc.setFont("helvetica","normal");
          doc.setFontSize(10);
          let ly = 34;
          doc.text(`Nomor Invoice: ${order.orderID || "-"}`, leftX, ly); ly += 6;
          doc.text(`Kepada : ${order.nama || "-"}`, leftX, ly); ly += 6;
          doc.text(`Nomor Telp: ${order.wa || "-"}`, leftX, ly); ly += 6;
          doc.text(`Catatan : ${order.note || "-"}`, leftX, ly);
          ly += 8;

          /* =======================================================
             TABEL (autoTable) - isi data pesanan
          ======================================================= */

          const toppingTxt = order.topping && order.topping.length ? order.topping.join(", ") : "-";
          const taburanTxt = order.taburan && order.taburan.length ? order.taburan.join(", ") : "-";

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

          if (typeof doc.autoTable === "function") {
            doc.autoTable({
              startY: ly + 4,
              head: [["Item", "Keterangan"]],
              body: rows,
              theme: "grid",
   
