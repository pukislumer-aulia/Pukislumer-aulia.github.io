/* =========================================================
   order.js — FINAL CLEAN PART 1/3
   - Perhitungan otomatis
   - Sistem topping/taburan
   - Tidak ada WA otomatis (bug dihapus)
   - Patch saveLastNota() dimasukkan aman
   ========================================================= */

(function(){
  'use strict';

  // ---------------------- CONFIG ----------------------
  const ADMIN_WA = "6281296668670";
  const STORAGE_ORDERS_KEY = "pukisOrders";
  const STORAGE_LAST_ORDER_KEY = "lastOrder";

  // asset folder
  const ASSET_PREFIX = "assets/images/";
  const QRIS_IMAGE = "qris-pukis.jpg";
  const TTD_IMAGE = "ttd.png";

  // topping list
  const SINGLE_TOPPINGS = [
    "Coklat","Tiramisu","Vanilla","Stroberi",
    "Cappucino"
  ];

  // taburan list (untuk mode double)
  const DOUBLE_TABURAN = [
    "Meses","Keju","Kacang","Choco Chip","Oreo"
  ];

  // TABEL HARGA (SAMA, TIDAK DIUBAH)
  const BASE_PRICE = {
    Original: {
      "5":  { non: 10000, single: 13000, double: 15000 },
      "10": { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      "5":  { non: 12000, single: 15000, double: 17000 },
      "10": { non: 21000, single: 28000, double: 32000 }
    }
  };

  // LIMIT MAKSIMAL (SAMA)
  const MAX_SINGLE_TOPPING = 5;
  const MAX_DOUBLE_TOPPING = 5;
  const MAX_DOUBLE_TABURAN = 5;

  // helpers
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function formatRp(n){
    const v = Number(n || 0);
    if (Number.isNaN(v)) return "Rp 0";
    return "Rp " + v.toLocaleString('id-ID');
  }

  function escapeHtml(s){
    return String(s==null ? '' : s).replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
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

    // Single topping (label merah)
    SINGLE_TOPPINGS.forEach(t => {
      const id = 'topping_' + t.toLowerCase().replace(/\s+/g,'_');
      const label = document.createElement('label');
      label.className = 'topping-check';
      label.innerHTML = `
        <input type="checkbox" name="topping" value="${t}" id="${id}">
        ${t}
      `;
      singleWrap.appendChild(label);
    });

    // Double: pilihan topping tambahan (taburan)
    DOUBLE_TABURAN.forEach(t => {
      const id = 'taburan_' + t.toLowerCase().replace(/\s+/g,'_');
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="checkbox" name="taburan" value="${t}" id="${id}">
        ${t}
      `;
      doubleWrap.appendChild(label);
    });

    // Event for .checked effect + limit
    singleWrap.addEventListener('change', e => {
      if (!e.target.matches('input[type="checkbox"]')) return;

      const mode = getSelectedToppingMode();
      const label = e.target.closest('label');
      if (label){
        if (e.target.checked) label.classList.add('checked');
        else label.classList.remove('checked');
      }

      if (mode === 'single'){
        const sel = $$('input[name="topping"]:checked').length;
        if (sel > MAX_SINGLE_TOPPING){
          e.target.checked = false;
          label.classList.remove('checked');
          alert(`Maksimal ${MAX_SINGLE_TOPPING} topping untuk mode Single.`);
        }
      }

      if (mode === 'double'){
        const sel = $$('input[name="topping"]:checked').length;
        if (sel > MAX_DOUBLE_TOPPING){
          e.target.checked = false;
          label.classList.remove('checked');
          alert(`Maksimal ${MAX_DOUBLE_TOPPING} topping untuk mode Double.`);
        }
      }

      updatePriceUI();
    });

    doubleWrap.addEventListener('change', e => {
      if (!e.target.matches('input[type="checkbox"]')) return;
      const mode = getSelectedToppingMode();

      if (mode !== 'double'){
        e.target.checked = false;
        alert("Taburan hanya aktif di mode Double.");
        return;
      }

      const sel = $$('input[name="taburan"]:checked').length;
      if (sel > MAX_DOUBLE_TABURAN){
        e.target.checked = false;
        alert(`Maksimal ${MAX_DOUBLE_TABURAN} taburan.`);
      }

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

  const getToppingValues  = () => $$('input[name="topping"]:checked').map(i=>i.value);
  const getTaburanValues  = () => $$('input[name="taburan"]:checked').map(i=>i.value);

  const getIsiValue = () => {
    const el = $('#ultraIsi');
    return el ? String(el.value) : '5';
  };

  const getJumlahBox = () => {
    const el = $('#ultraJumlah');
    if (!el) return 1;
    const v = parseInt(el.value,10);
    return (isNaN(v) || v < 1) ? 1 : v;
  };

  // =====================================================
  //   PRICE LOGIC
  // =====================================================
  function getSelectedToppingMode(){
    return getSelectedRadioValue('ultraToppingMode') || 'non';
  }

  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || "Original";
    isi   = String(isi || "5");
    mode  = (mode||"non").toLowerCase();

    try {
      return BASE_PRICE[jenis][isi][mode] || 0;
    } catch(e){
      return 0;
    }
  }

  function calcDiscount(jumlahBox, subtotal){
    if (jumlahBox >= 10) return 1000;
    if (jumlahBox >= 5)  return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePriceUI(){
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = getIsiValue();
    const mode = getSelectedToppingMode();
    const jumlah = getJumlahBox();

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal    = pricePerBox * jumlah;
    const discount    = calcDiscount(jumlah, subtotal);
    const total       = subtotal - discount;

    $('#ultraPricePerBox')?.textContent = formatRp(pricePerBox);
    $('#ultraSubtotal')?.textContent    = formatRp(subtotal);
    $('#ultraDiscount')?.textContent    = discount > 0 ? "-" + formatRp(discount) : "-";
    $('#ultraGrandTotal')?.textContent  = formatRp(total);

    return { pricePerBox, subtotal, discount, total };
  }

  // =====================================================
  //   BUILD ORDER OBJECT
  // =====================================================
  function buildOrderObject(){
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi   = getIsiValue();
    const mode  = getSelectedToppingMode();
    const jumlahBox = getJumlahBox();

    const topping = getToppingValues();
    const taburan = getTaburanValues();

    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlahBox;
    const discount = calcDiscount(jumlahBox, subtotal);
    const total = subtotal - discount;

    const nama = $('#ultraNama')?.value.trim() || '';
    const waRaw = $('#ultraWA')?.value.trim() || '';
    const note = $('#ultraNote')?.value.trim() || '-';

    if (!nama){ alert("Nama harus diisi."); return null; }
    if (!waRaw){ alert("Nomor WA harus diisi."); return null; }

    let digits = waRaw.replace(/\D/g,'');
    if (digits.length < 9){
      alert("Nomor WA tidak valid.");
      return null;
    }

    // normalisasi WA
    let wa = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (/^8\d{6,}$/.test(wa)) wa = '62' + wa;

    const invoice = "INV-" + Date.now();

    return {
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
      status: "Pending"
    };
  }

/* --- PART 1 BERHENTI DI SINI ---
   Balas "Kirim PART 2" untuk melanjutkan
---------------------------------------- */
})();
/* =========================================================
   order.js — FINAL CLEAN PART 2/3
   - Render Nota Popup
   - saveLastNota()
   - Kirim WA Admin (manual saja, tidak otomatis)
   - Listener tombol-tombol
========================================================= */

// =====================================================
//   SAVE LAST NOTA (patch baru, aman)
// =====================================================
function saveLastNota(order){
  try {
    localStorage.setItem("lastOrder", JSON.stringify(order));
  } catch(e){
    console.error("saveLastNota error:", e);
  }
}

// =====================================================
//   GET LAST ORDER
// =====================================================
function getLastOrder(){
  try {
    return JSON.parse(localStorage.getItem("lastOrder") || "null");
  } catch(e){
    return null;
  }
}

// =====================================================
//   RENDER NOTA POPUP
// =====================================================
function renderNotaOnScreen(order){
  if (!order) return;

  const c = document.querySelector('#notaContent');
  if (!c) return;

  const toppingText = order.topping?.length ? order.topping.join(', ') : '-';
  const taburanText = order.taburan?.length ? order.taburan.join(', ') : '-';

  c.innerHTML = `
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div style="flex:1;min-width:200px">
        <div style="font-weight:800;color:#5f0000;font-size:14px;margin-bottom:6px;">
          INVOICE PEMESANAN
        </div>
        <div><strong>Invoice:</strong> ${escapeHtml(order.invoice)}</div>
        <div><strong>Nama:</strong> ${escapeHtml(order.nama)}</div>
        <div><strong>WA:</strong> ${escapeHtml(order.wa)}</div>
        <div><strong>Tanggal:</strong> ${escapeHtml(order.tgl)}</div>
      </div>
    </div>

    <hr style="margin:10px 0">
    <div>
      <div><strong>Jenis:</strong> ${escapeHtml(order.jenis)} — ${escapeHtml(String(order.isi))} pcs</div>
      <div><strong>Mode:</strong> ${escapeHtml(order.mode)}</div>
      <div><strong>Topping:</strong> ${escapeHtml(toppingText)}</div>
      <div><strong>Taburan:</strong> ${escapeHtml(taburanText)}</div>
      <div><strong>Jumlah Box:</strong> ${escapeHtml(String(order.jumlah))}</div>
      <div><strong>Harga Per Box:</strong> ${formatRp(order.pricePerBox)}</div>
      <div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>
      <div><strong>Diskon:</strong> ${order.discount>0 ? '-' + formatRp(order.discount) : '-'}</div>

      <div style="font-weight:900;margin-top:8px;">
        <strong>Total:</strong> ${formatRp(order.total)}
      </div>
      <p style="margin-top:10px;">
        Terima kasih telah berbelanja di Pukis Lumer Aulia ❤️
      </p>
    </div>
  `;

  saveLastNota(order);

  const container = document.querySelector('#notaContainer');
  if (container){
    container.style.display = 'flex';
    container.classList.add('show');
  }
}

// =====================================================
//   KIRIM WA ADMIN (manual, tidak otomatis)
// =====================================================
function sendOrderToAdminViaWA(order){
  if (!order) return;

  const lines = [
    "Assalamu'alaikum Admin 🙏",
    "",
    "Ada pesanan baru:",
    "",
    `Invoice : ${order.invoice}`,
    `Nama    : ${order.nama}`,
    `WA      : ${order.wa}`,
    `Jenis   : ${order.jenis}`,
    `Isi Box : ${order.isi}`,
    `Mode    : ${order.mode}`,
    `Topping : ${order.topping?.join(', ') || '-'}`,
    `Taburan : ${order.taburan?.join(', ') || '-'}`,
    `Jumlah  : ${order.jumlah} box`,
    "",
    `Total Bayar: ${formatRp(order.total)}`,
    "",
    "Mohon bantu cetak invoice. Terima kasih 🙏"
  ];

  const msg = encodeURIComponent(lines.join('\n'));
  const url = `https://wa.me/${ADMIN_WA}?text=${msg}`;
  window.open(url, "_blank");
}

// =====================================================
//   FORM LISTENERS — stable, tanpa duplikat event
// =====================================================
function attachFormListeners(){

  // Build topping UI
  buildToppingUI();

  // Mode topping visibility
  updateToppingVisibility();
  document.querySelectorAll('input[name="ultraToppingMode"]').forEach(r=>{
    r.addEventListener('change', ()=>{
      updateToppingVisibility();
      updatePriceUI();
    });
  });

  // Jenis
  document.querySelectorAll('input[name="ultraJenis"]').forEach(r=>{
    r.addEventListener('change', updatePriceUI);
  });

  // Isi
  document.querySelector('#ultraIsi')?.addEventListener('change', updatePriceUI);

  // Jumlah
  document.querySelector('#ultraJumlah')?.addEventListener('input', updatePriceUI);

  // Submit = buat nota
  const form = document.querySelector('#formUltra') ||
               document.querySelector('#form-ultra');

  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();

      const order = buildOrderObject();
      if (!order) return;

      saveLastNota(order);
      renderNotaOnScreen(order);
    });
  }

  // Tombol kirim WA admin (manual)
  const sendBtn = document.querySelector('#ultraSendAdmin');
  if (sendBtn){
    sendBtn.addEventListener('click', function(e){
      e.preventDefault();

      const order = getLastOrder();
      if (!order){
        alert("Belum ada nota yang dibuat.");
        return;
      }

      sendOrderToAdminViaWA(order);
    });
  }

  // Tombol close
  const closeBtn = document.querySelector('#notaClose');
  if (closeBtn){
    closeBtn.addEventListener('click', ()=>{
      const box = document.querySelector('#notaContainer');
      if (!box) return;
      box.classList.remove('show');
      box.style.display = 'none';
    });
  }

  // Tombol print PDF
  const printBtn = document.querySelector('#notaPrint');
  if (printBtn){
    printBtn.addEventListener('click', async function(e){
      e.preventDefault();

      const order = getLastOrder();
      if (!order){
        alert("Belum ada nota.");
        return;
      }

      if (typeof window.generatePdf !== 'function'){
        alert("PDF belum siap. Pastikan jsPDF sudah dimuat.");
        return;
      }

      await window.generatePdf(order);
    });
  }
}

// =====================================================
//   MODE VISIBILITY (non/single/double)
// =====================================================
function updateToppingVisibility(){
  const mode = getSelectedToppingMode();
  const singleGroup = document.querySelector('#ultraSingleGroup');
  const doubleGroup = document.querySelector('#ultraDoubleGroup');

  if (!singleGroup || !doubleGroup) return;

  if (mode === 'non'){
    singleGroup.style.display = 'none';
    doubleGroup.style.display = 'none';

    document.querySelectorAll('input[name="topping"]:checked')
      .forEach(i=>{ i.checked = false; i.closest('label')?.classList.remove('checked'); });

    document.querySelectorAll('input[name="taburan"]:checked')
      .forEach(i=> i.checked = false);

  } else if (mode === 'single'){
    singleGroup.style.display = 'flex';
    doubleGroup.style.display = 'none';

  } else if (mode === 'double'){
    singleGroup.style.display = 'flex';
    doubleGroup.style.display = 'flex';
  }
}

// =====================================================
//   INIT
// =====================================================
function init(){
  attachFormListeners();
  updatePriceUI();
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* --- PART 2 BERAKHIR --- 
   Balas: "Kirim PART 3"
*/
/* =========================================================
   order.js — FINAL CLEAN PART 3/3
   - PDF Generator (jsPDF + autoTable)
   - QRIS & TTD loader
   - Watermark
   - Auto attach generatePdf()
========================================================= */

(function(){
  'use strict';

  const ASSET_PREFIX = "assets/images/";
  const QRIS_FILE = "qris-pukis.jpg";
  const TTD_FILE  = "ttd.png";

  // Format Rupiah sederhana
  function formatRp(num){
    const n = Number(num || 0);
    if (Number.isNaN(n)) return "Rp 0";
    return "Rp " + n.toLocaleString('id-ID');
  }

  // =====================================================
  //   LOAD IMAGE AS DATA URL
  // =====================================================
  function loadImageAsDataURL(path, timeoutMs = 5000){
    return new Promise(resolve => {
      if (!path) return resolve(null);

      const img = new Image();
      img.crossOrigin = "anonymous";

      let done = false;
      const timer = setTimeout(()=>{
        if (!done){
          done = true;
          resolve(null);
        }
      }, timeoutMs);

      img.onload = ()=>{
        if (done) return;
        done = true;
        clearTimeout(timer);

        try {
          const canvas = document.createElement("canvas");
          canvas.width  = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0,0);
          resolve(canvas.toDataURL("image/png"));
        } catch(e){
          resolve(null);
        }
      };

      img.onerror = ()=>{
        if (!done){
          done = true;
          clearTimeout(timer);
          resolve(null);
        }
      };

      img.src = path;
    });
  }

  // =====================================================
  //   PDF FACTORY
  // =====================================================
  function makeGeneratePdf(lib){
    let jsPDFCtor = null;

    if (lib?.jsPDF) jsPDFCtor = lib.jsPDF;
    else if (window.jsPDF) jsPDFCtor = window.jsPDF;

    if (!jsPDFCtor){
      return async function(){ alert("jsPDF belum dimuat."); };
    }

    return async function generatePdf(order){
      try {
        if (!order){
          alert("Order tidak ditemukan.");
          return false;
        }

        const doc = new jsPDFCtor({ unit:'mm', format:'a4' });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        // LOAD QRIS + TTD
        const [qrisPng, ttdPng] = await Promise.all([
          loadImageAsDataURL(ASSET_PREFIX + QRIS_FILE),
          loadImageAsDataURL(ASSET_PREFIX + TTD_FILE)
        ]);

        // =====================================================
        //   HEADER
        // =====================================================
        doc.setFont("helvetica","bold");
        doc.setFontSize(16);
        doc.text("PUKIS LUMER AULIA", W/2, 15, { align:"center" });

        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text("Invoice Pemesanan", 14, 25);

        // metadata
        let y = 34;
        doc.setFontSize(10);

        doc.text(`Invoice : ${order.invoice}`, 14, y);
        doc.text(`Tanggal : ${order.tgl || "-"}`, W-14, y, { align:"right" });
        y += 7;

        doc.text(`Nama    : ${order.nama}`, 14, y);
        doc.text(`No. WA  : ${order.wa}`, W-14, y, { align:"right" });
        y += 10;

        // =====================================================
        //   TABLE
        // =====================================================
        const toppingTxt = order.topping?.length ? order.topping.join(', ') : '-';
        const taburanTxt = order.taburan?.length ? order.taburan.join(', ') : '-';

        const rows = [
          ["Jenis", order.jenis],
          ["Isi Box", order.isi + " pcs"],
          ["Mode", order.mode],
          ["Topping", toppingTxt],
          ["Taburan", taburanTxt],
          ["Jumlah Box", order.jumlah + " box"],
          ["Harga Satuan", formatRp(order.pricePerBox)],
          ["Subtotal", formatRp(order.subtotal)],
          ["Diskon", order.discount>0 ? "-" + formatRp(order.discount) : "-"],
          ["Total Bayar", formatRp(order.total)]
        ];

        if (typeof doc.autoTable === "function"){
          doc.autoTable({
            startY: y,
            head: [["Item","Keterangan"]],
            body: rows,
            styles: { fontSize:10 },
            headStyles: { fillColor:[255,105,180], textColor:255 },
            alternateRowStyles: { fillColor:[230,240,255] }
          });

          y = doc.lastAutoTable.finalY + 10;
        } else {
          // fallback table
          rows.forEach(r=>{
            doc.text(`${r[0]} : ${r[1]}`, 14, y);
            y += 6;
          });
          y += 10;
        }

        // =====================================================
        //   QRIS
        // =====================================================
        if (qrisPng){
          doc.addImage(qrisPng, "PNG", 14, y, 40, 45);
          doc.setFontSize(9);
          doc.text("Scan QRIS untuk pembayaran", 14, y + 50);
        }

        // =====================================================
        //   SIGNATURE
        // =====================================================
        const sigX = W - 14 - 40;
        let sigY = y;

        doc.setFontSize(10);
        doc.text("Hormat Kami,", sigX, sigY);
        sigY += 6;

        if (ttdPng){
          doc.addImage(ttdPng, "PNG", sigX-5, sigY, 40, 25);
          sigY += 30;
        } else {
          sigY += 25;
        }

        doc.setFont("helvetica","bold");
        doc.text("Pukis Lumer Aulia", sigX, sigY);

        // =====================================================
        //   WATERMARK (besar)
        // =====================================================
        try{
          doc.setFontSize(45);
          doc.setTextColor(180,180,180);
          doc.setFont("helvetica","bold");
          doc.text("Pukis Lumer Aulia", W/2, H/2, { align:"center" });
          doc.setTextColor(0,0,0);
        } catch(e){}

        // =====================================================
        //   FOOTER
        // =====================================================
        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text("Terima kasih telah berbelanja ❤️", W/2, H-12, { align:"center" });

        // =====================================================
        //   SAVE FILE
        // =====================================================
        const safeName = (order.nama || 'Pelanggan')
          .replace(/\s+/g,'_')
          .replace(/[^\w\-_.]/g,'');

        const fileName = `Invoice_${safeName}_${order.invoice}.pdf`;
        doc.save(fileName);

        return true;

      } catch(err){
        console.error("generatePdf error:", err);
        alert("Gagal membuat PDF.");
        return false;
      }
    };
  }

  // =====================================================
  //   EXPOSE
  // =====================================================
  window.makeGeneratePdf = makeGeneratePdf;

  // If jsPDF sudah ada → langsung attach
  (function tryAutoAttach(){
    if (window.jspdf && window.jspdf.jsPDF){
      window.generatePdf = makeGeneratePdf(window.jspdf);
    }
    if (window.jsPDF){
      window.generatePdf = makeGeneratePdf(window.jsPDF);
    }
  })();

})();
