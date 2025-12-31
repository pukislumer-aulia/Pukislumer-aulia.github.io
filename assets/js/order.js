/* =========================================================
   assets/js/order.js  (FINAL – NON MODULE)
   Dipakai oleh: index.html & admin.html
   Fitur:
   - Hitung harga otomatis
   - Simpan order (localStorage)
   - Sinkron admin & index
   - Cetak nota PDF (jsPDF)
========================================================= */

(function () {
  "use strict";

  /* ================== KONFIGURASI ================== */
  const STORAGE_KEY = "PUKIS_ORDERS";
  const ADMIN_WA = "6281296668670";

  const BASE_PRICE = {
    Original: {
      5: { non: 10000, single: 13000, double: 15000 },
      10:{ non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      5: { non: 12000, single: 15000, double: 18000 },
      10:{ non: 25000, single: 28000, double: 32000 }
    }
  };

  /* ================== UTIL ================== */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function formatRp(n) {
    return "Rp " + Number(n || 0).toLocaleString("id-ID");
  }

  function genInvoice() {
    const d = new Date();
    return (
      "INV-" +
      d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    );
  }

  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveOrders(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  /* ================== HITUNG HARGA ================== */
  function getPricePerBox() {
    const jenis = $('input[name="ultraJenis"]:checked')?.value || "Original";
    const isi = Number($('#ultraIsi')?.value || 5);
    const mode = $('input[name="ultraToppingMode"]:checked')?.value || "non";
    return BASE_PRICE[jenis][isi][mode];
  }

  function updatePriceUI() {
    const jumlah = Number($('#ultraJumlah')?.value || 1);
    const harga = getPricePerBox();
    const subtotal = harga * jumlah;

    let diskon = 0;
    if (jumlah >= 10) diskon = 1000;
    else if (jumlah >= 5) diskon = Math.round(subtotal * 0.01);

    const total = subtotal - diskon;

    $('#ultraPricePerBox') && ($('#ultraPricePerBox').textContent = formatRp(harga));
    $('#ultraSubtotal') && ($('#ultraSubtotal').textContent = formatRp(subtotal));
    $('#ultraDiscount') && ($('#ultraDiscount').textContent = diskon ? '-' + formatRp(diskon) : '-');
    $('#ultraGrandTotal') && ($('#ultraGrandTotal').textContent = formatRp(total));

    return { harga, subtotal, diskon, total };
  }

  /* ================== ORDER ================== */
  function buildOrder() {
    const nama = $('#ultraNama')?.value.trim();
    const waRaw = $('#ultraWA')?.value.trim();

    if (!nama || !waRaw) {
      alert("Nama & WhatsApp wajib diisi");
      return null;
    }

    let wa = waRaw.replace(/\D/g, "");
    if (wa.startsWith("0")) wa = "62" + wa.slice(1);

    const jenis = $('input[name="ultraJenis"]:checked')?.value;
    const isi = $('#ultraIsi')?.value;
    const mode = $('input[name="ultraToppingMode"]:checked')?.value;
    const jumlah = Number($('#ultraJumlah')?.value || 1);

    const price = updatePriceUI();

    return {
      invoice: genInvoice(),
      tanggal: new Date().toISOString(),
      nama,
      wa,
      jenis,
      isi,
      mode,
      jumlah,
      harga: price.harga,
      subtotal: price.subtotal,
      diskon: price.diskon,
      total: price.total,
      status: "BARU"
    };
  }

  /* ================== SIMPAN & WA ================== */
  function saveOrder(order) {
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);
  }

  function sendWAAdmin(order) {
    const text = `Pesanan Baru\n\nInvoice: ${order.invoice}\nNama: ${order.nama}\nTotal: ${formatRp(order.total)}`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`, '_blank');
  }

  /* ================== PDF ================== */
  function cetakPDF(order) {
    if (typeof window.jspdf === 'undefined') {
      alert('jsPDF belum dimuat');
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.setFontSize(12);
    pdf.text('NOTA PEMESANAN', 20, 20);
    pdf.text(`Invoice : ${order.invoice}`, 20, 30);
    pdf.text(`Nama    : ${order.nama}`, 20, 38);
    pdf.text(`WhatsApp: ${order.wa}`, 20, 46);
    pdf.text(`Total   : ${formatRp(order.total)}`, 20, 60);

    pdf.save(order.invoice + '.pdf');
  }

  /* ================== EVENT ================== */
  function init() {
    $$('input, select').forEach(el => el.addEventListener('change', updatePriceUI));

    $('#formUltra')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const order = buildOrder();
      if (!order) return;

      saveOrder(order);
      sendWAAdmin(order);
      cetakPDF(order);

      alert('Pesanan berhasil disimpan');
      this.reset();
      updatePriceUI();
    });

    updatePriceUI();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

  /* ================== GLOBAL UNTUK ADMIN ================== */
  window.OrderStore = {
    getAll: getOrders,
    saveAll: saveOrders,
    formatRp
  };
})();
