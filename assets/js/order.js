// assets/js/order.js
// ORDER.JS FINAL — kompatibel dengan Form Ultra
// Pastikan <script type="module" src="assets/js/order.js"></script> di index.html
import "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";

document.addEventListener("DOMContentLoaded", () => {
  /* ================= CONFIG HARGA ================= */
  const BASE_PRICE = {
    Original: { 5: 10000, 10: 18000 },
    Pandan: { 5: 12000, 10: 22000 }
  };
  const TOPPING_EXTRA = { non: 0, single: 2000, double: 4000 };
  const ADMIN_WA = "6281296668670";

  /* ================= SELECTORS ================= */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const ultraNama = $("#ultraNama");
  const ultraWA = $("#ultraWA");
  const ultraIsi = $("#ultraIsi");
  const ultraJumlah = $("#ultraJumlah");
  const ultraPricePerBox = $("#ultraPricePerBox");
  const ultraSubtotal = $("#ultraSubtotal");
  const ultraDiscount = $("#ultraDiscount");
  const ultraGrandTotal = $("#ultraGrandTotal");
  const ultraSingleGroup = $("#ultraSingleGroup");
  const ultraDoubleGroup = $("#ultraDoubleGroup");
  const formUltra = $("#formUltra");
  const notaContainer = $("#notaContainer");
  const notaContent = $("#notaContent");
  const notaClose = $("#notaClose");
  const notaPrint = $("#notaPrint");
  const notaSendAdmin = $("#notaSendAdmin");

  /* ================= HELPERS ================= */
  function formatRp(n) {
    return isNaN(n) ? "Rp0" : "Rp " + Number(n).toLocaleString("id-ID");
  }

  function getSelectedRadioValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  function getCheckedValues(selector) {
    return Array.from(document.querySelectorAll(selector))
      .filter(ch => ch.checked)
      .map(ch => ch.value);
  }

  function enforceMax(selector, max) {
    const boxes = Array.from(document.querySelectorAll(selector));
    boxes.forEach(cb => {
      cb.addEventListener("change", () => {
        const count = boxes.filter(x => x.checked).length;
        if (count > max) {
          cb.checked = false;
          alert(`Maksimal ${max} pilihan.`);
        }
      });
    });
  }
  enforceMax(".ultraSingle", 5);
  enforceMax(".ultraDouble", 5);

  /* ================= UPDATE TOPPING VISIBILITY ================= */
  function updateToppingVisibility() {
    const mode = getSelectedRadioValue("ultraToppingMode") || "non";
    ultraSingleGroup.style.display = (mode === "single" || mode === "double") ? "block" : "none";
    ultraDoubleGroup.style.display = (mode === "double") ? "block" : "none";
    calculatePrice();
  }
  $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener("change", updateToppingVisibility));

  /* ================= CALCULATE PRICE ================= */
  function calculatePrice() {
    const jenis = getSelectedRadioValue("ultraJenis") || "Original";
    const isi = Number(ultraIsi.value || 5);
    const jumlah = Number(ultraJumlah.value || 1);
    const mode = getSelectedRadioValue("ultraToppingMode") || "non";

    const basePerBox = BASE_PRICE[jenis][isi] || BASE_PRICE["Original"][5];
    const toppingExtra = TOPPING_EXTRA[mode] || 0;
    const pricePerBox = basePerBox + toppingExtra;
    const subtotal = pricePerBox * jumlah;
    const discount = 0;
    const grandTotal = subtotal - discount;

    ultraPricePerBox.textContent = formatRp(pricePerBox);
    ultraSubtotal.textContent = formatRp(subtotal);
    ultraDiscount.textContent = discount ? formatRp(discount) : "-";
    ultraGrandTotal.textContent = formatRp(grandTotal);

    return { pricePerBox, subtotal, discount, grandTotal, jenis, isi, jumlah, mode };
  }

  ultraIsi.addEventListener("change", calculatePrice);
  ultraJumlah.addEventListener("change", calculatePrice);
  $$('input[name="ultraJenis"]').forEach(r => r.addEventListener("change", calculatePrice));
  $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener("change", calculatePrice));
  $$(".ultraSingle").forEach(cb => cb.addEventListener("change", calculatePrice));
  $$(".ultraDouble").forEach(cb => cb.addEventListener("change", calculatePrice));

  updateToppingVisibility();
  calculatePrice();

  /* ================= BUILD ORDER OBJECT ================= */
  function buildOrderObject() {
    const calc = calculatePrice();
    let wa = ultraWA.value.trim();
    if (wa.startsWith("0")) wa = "62" + wa.slice(1);
    return {
      id: "INV" + Date.now().toString().slice(-8),
      nama: ultraNama.value.trim(),
      wa,
      jenis: calc.jenis,
      mode: calc.mode,
      single: getCheckedValues(".ultraSingle"),
      double: getCheckedValues(".ultraDouble"),
      isi: calc.isi,
      jumlah: calc.jumlah,
      pricePerBox: calc.pricePerBox,
      subtotal: calc.subtotal,
      discount: calc.discount,
      total: calc.grandTotal,
      createdAt: new Date().toISOString()
    };
  }

  /* ================= PDF INVOICE ================= */
  function generateInvoicePDF(order) {
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDF) return alert("jsPDF tidak tersedia."), null;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // watermark
    try {
      doc.setFontSize(48);
      doc.setTextColor(212, 175, 55);
      doc.text("PUKIS LUMER AULIA", pageWidth/2, 140, {align:"center", angle:45});
      doc.setTextColor(0,0,0);
    } catch(e){}

    try { doc.addImage("assets/images/logo.png","PNG",14,10,36,36);} catch(e){}

    doc.setFontSize(16);
    doc.text("INVOICE PEMBELIAN", pageWidth-20,18,{align:"right"});
    doc.setFontSize(10);
    doc.text(`No: ${order.id}`, pageWidth-20,26,{align:"right"});
    doc.text(`Tanggal: ${new Date().toLocaleString("id-ID")}`, pageWidth-20,34,{align:"right"});

    doc.setFontSize(11);
    doc.text(`Nama: ${order.nama}`, 14,54);
    doc.text(`WA: ${order.wa}`, 14,62);

    const body = [
      ["Jenis", order.jenis],
      ["Topping Mode", order.mode],
      ["Topping (Single)", order.single.length ? order.single.join(", ") : "-"],
      ["Taburan (Double)", order.double.length ? order.double.join(", ") : "-"],
      ["Isi/Box", `${order.isi} pcs`],
      ["Jumlah Box", String(order.jumlah)],
      ["Harga/Box", formatRp(order.pricePerBox)],
      ["Subtotal", formatRp(order.subtotal)]
    ];

    doc.autoTable({
      startY: 76,
      head: [["Keterangan", "Isi"]],
      body,
      theme: "grid",
      headStyles: { fillColor: [212,175,55], textColor: 20 },
      styles: { fontSize: 10 }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 150;
    doc.setFontSize(12);
    doc.setFont(undefined,"bold");
    doc.text("TOTAL BAYAR:",14,finalY+10);
    doc.text(formatRp(order.total),pageWidth-20,finalY+10,{align:"right"});

    try { doc.addImage("assets/images/ttd.png","PNG",pageWidth-80,finalY+18,55,25);} catch(e){}

    doc.setFontSize(9);
    doc.setFont(undefined,"normal");
    doc.text("Terima kasih atas pesanan Anda.",pageWidth/2,285,{align:"center"});

    return doc;
  }

  /* ================= WA MESSAGE ================= */
  function buildWAMessage(order){
    return `Halo! Saya ingin memesan Pukis:

Nama: ${order.nama || "-"}
Jenis: ${order.jenis || "-"}
Topping Mode: ${order.mode || "-"}
Topping (Single): ${order.single.length ? order.single.join(", ") : "-"}
Taburan (Double): ${order.double.length ? order.double.join(", ") : "-"}
Isi per Box: ${order.isi} pcs
Jumlah Box: ${order.jumlah} box
Total Bayar: ${formatRp(order.total)}
Invoice: ${order.id}`;
  }

  function openWA(order){
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(buildWAMessage(order))}`,"_blank");
  }

  /* ================= NOTA POPUP ================= */
  let lastOrder = null;

  formUltra.addEventListener("submit", ev=>{
    ev.preventDefault();
    if(!ultraNama.value || !ultraWA.value) return alert("Isi nama dan WA terlebih dahulu.");
    const order = buildOrderObject();
    lastOrder = order;

    notaContent.innerHTML = `
      <div>
        <h4>Invoice: ${order.id}</h4>
        <p><strong>Nama:</strong> ${order.nama}</p>
        <p><strong>WA:</strong> ${order.wa}</p>
        <p><strong>Total:</strong> ${formatRp(order.total)}</p>
        <hr/>
        <p><strong>Detail Pesanan:</strong></p>
        <ul>
          <li>Jenis: ${order.jenis}</li>
          <li>Mode: ${order.mode}</li>
          <li>Topping: ${order.single.length ? order.single.join(", ") : "-"}</li>
          <li>Taburan: ${order.double.length ? order.double.join(", ") : "-"}</li>
          <li>Isi/Box: ${order.isi} pcs</li>
          <li>Jumlah Box: ${order.jumlah}</li>
        </ul>
      </div>
    `;
    notaContainer.style.display="flex";
  });

  notaClose.addEventListener("click", ()=>{ notaContainer.style.display="none"; });
  notaPrint.addEventListener("click", ()=>{ if(!lastOrder) return alert("Belum ada pesanan."); generateInvoicePDF(lastOrder)?.save(`Invoice-${lastOrder.id}.pdf`); });
  notaSendAdmin.addEventListener("click", ()=>{ if(!lastOrder) return alert("Belum ada pesanan."); openWA(lastOrder); });
});
