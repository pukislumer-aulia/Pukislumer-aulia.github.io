/* =========================================================
   assets/js/order.js
   FINAL — ONE FILE FOR INDEX + ADMIN
   NON-MODULE | MOBILE SAFE | LOGIC PRESERVED
========================================================= */
(function () {
  "use strict";

  /* ================= CONFIG ================= */
  const ADMIN_WA = "6281296668670";
  const STORAGE_KEY = "orders";

  const SINGLE_TOPPINGS = ["Coklat", "Tiramisu", "Vanilla", "Stroberi", "Cappucino"];
  const DOUBLE_ONLY_TOPPINGS = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

  const BASE_PRICE = {
    Original: {
      "5": { non: 10000, single: 13000, double: 15000 },
      "10": { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      "5": { non: 12000, single: 15000, double: 17000 },
      "10": { non: 21000, single: 28000, double: 32000 }
    }
  };

  /* ================= DOM SHORT ================= */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* ================= HELPERS ================= */
  const formatRp = n => "Rp " + Number(n || 0).toLocaleString("id-ID");

  const genInvoice = () => {
    const d = new Date();
    return (
      "INV-" +
      d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    );
  };

  const getRadio = name => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  };

  const getChecked = name =>
    Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);

  /* ================= STORAGE ================= */
  function getOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveOrder(order) {
    const arr = getOrders();
    arr.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  /* ================= PRICE ================= */
  function getPricePerBox() {
    const jenis = getRadio("ultraJenis") === "Pandan" ? "Pandan" : "Original";
    const isi = $("#ultraIsi") ? $("#ultraIsi").value : "5";
    const mode = getRadio("ultraToppingMode") || "non";
    return BASE_PRICE[jenis][isi][mode] || BASE_PRICE[jenis][isi].non;
  }

  function calcDiscount(jumlah, subtotal) {
    if (jumlah >= 10) return 1000;
    if (jumlah >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePriceUI() {
    const jumlah = Number($("#ultraJumlah")?.value || 1);
    const price = getPricePerBox();
    const subtotal = price * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;

    $("#ultraPricePerBox") && ($("#ultraPricePerBox").textContent = formatRp(price));
    $("#ultraSubtotal") && ($("#ultraSubtotal").textContent = formatRp(subtotal));
    $("#ultraDiscount") && ($("#ultraDiscount").textContent = discount ? "-" + formatRp(discount) : "-");
    $("#ultraGrandTotal") && ($("#ultraGrandTotal").textContent = formatRp(total));

    return { price, subtotal, discount, total };
  }

  /* ================= BUILD ORDER ================= */
  function buildOrder() {
    const nama = $("#ultraNama")?.value.trim();
    const waRaw = $("#ultraWA")?.value.trim();
    const jumlah = Number($("#ultraJumlah")?.value || 1);

    if (!nama || !waRaw || jumlah < 1) return null;

    const wa = waRaw.startsWith("0") ? "62" + waRaw.slice(1) : waRaw;
    const jenis = getRadio("ultraJenis");
    const isi = $("#ultraIsi")?.value;
    const mode = getRadio("ultraToppingMode") || "non";

    const single = getChecked("toppingSingle");
    const double = getChecked("toppingDouble");
    const taburan = getChecked("taburan");

    const { price, subtotal, discount, total } = updatePriceUI();

    return {
      invoice: genInvoice(),
      customerName: nama,
      wa: wa,
      jenis,
      isi,
      mode,
      single,
      double,
      taburan,
      jumlah,
      hargaSatuan: price,
      subtotal,
      discount,
      total,
      status: "pending",
      createdAt: Date.now()
    };
  }

  /* ================= NOTA HTML ================= */
  function renderNota(order) {
    return `
      <b>Invoice:</b> ${order.invoice}<br>
      <b>Nama:</b> ${order.customerName}<br>
      <b>WA:</b> ${order.wa}<br>
      <b>Jenis:</b> ${order.jenis}<br>
      <b>Isi:</b> ${order.isi} pcs<br>
      <b>Jumlah:</b> ${order.jumlah} box<br>
      <b>Total:</b> ${formatRp(order.total)}
    `;
  }

  /* ================= WA ADMIN ================= */
  function openWA(order) {
    const text = encodeURIComponent(
      `INVOICE ${order.invoice}
Nama: ${order.customerName}
WA: ${order.wa}
Total: ${formatRp(order.total)}`
    );
    window.open(`https://wa.me/${ADMIN_WA}?text=${text}`, "_blank");
  }

  /* ================= PDF (ADMIN) ================= */
  function generatePDF(order) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: [58, 200] });

    let y = 8;
    doc.setFontSize(10);
    doc.text("PUKIS LUMER AULIA", 29, y, { align: "center" });
    y += 6;

    doc.setFontSize(8);
    doc.text(`Invoice: ${order.invoice}`, 2, y); y += 4;
    doc.text(`Nama: ${order.customerName}`, 2, y); y += 4;
    doc.text(`Total: ${formatRp(order.total)}`, 2, y);

    doc.text("Terima kasih 🙏", 29, y + 10, { align: "center" });
    return doc;
  }

  /* ================= EVENTS INDEX ================= */
  $("#ultraSubmit")?.addEventListener("click", e => {
    e.preventDefault();
    const order = buildOrder();
    if (!order) return alert("Data belum lengkap");

    $("#notaContent").innerHTML = renderNota(order);
    $("#notaContainer").style.display = "flex";
    window._pendingOrder = order;
  });

  $("#notaConfirm")?.addEventListener("click", () => {
    const order = window._pendingOrder;
    if (!order) return;

    saveOrder(order);
    openWA(order);
    $("#notaContainer").style.display = "none";
    alert("Pesanan dikirim ke admin");
    $("#formUltra")?.reset();
    updatePriceUI();
  });

  $("#notaClose")?.addEventListener("click", () => {
    $("#notaContainer").style.display = "none";
  });

  /* ================= EVENTS ADMIN ================= */
  $("#printLastInvoice")?.addEventListener("click", () => {
    const orders = getOrders();
    if (!orders.length) return alert("Belum ada order");

    const pdf = generatePDF(orders[0]);
    pdf.autoPrint();
    window.open(pdf.output("bloburl"), "_blank");
  });

  /* ================= INIT ================= */
  document.addEventListener("change", updatePriceUI);
  updatePriceUI();

})();
