// assets/js/modules/nota.js

import { Storage } from "../core/storage.js";

const ORDER_KEY = "orders";

// ===== ELEMENT =====
const printLastBtn = document.getElementById("printLastInvoice");
const modal = document.getElementById("notaModal");
const notaContent = document.getElementById("notaContent");
const modalPrintBtn = document.getElementById("modalPrintBtn");

// ===== GET LAST ORDER =====
function getLastOrder() {
  const orders = Storage.get(ORDER_KEY) || [];
  if (orders.length === 0) return null;
  return orders[orders.length - 1];
}

// ===== GENERATE PDF =====
function generatePDF(order) {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    unit: "mm",
    format: [58, 200]
  });

  doc.setFontSize(10);
  doc.text("PUKIS LUMER AULIA", 29, 8, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Invoice: ${order.invoice}`, 2, 14);
  doc.text(`Nama: ${order.customerName}`, 2, 18);
  doc.text(
    new Date(order.createdAt).toLocaleString("id-ID"),
    2,
    22
  );

  doc.autoTable({
    startY: 26,
    theme: "plain",
    styles: { fontSize: 8 },
    body: order.items.map(i => [
      `${i.name} x${i.qty}`,
      `Rp ${(i.qty * i.price).toLocaleString("id-ID")}`
    ])
  });

  const y = doc.lastAutoTable.finalY + 4;

  doc.text(
    `TOTAL: Rp ${order.total.toLocaleString("id-ID")}`,
    2,
    y
  );

  doc.text("Terima kasih 🙏", 29, y + 8, { align: "center" });

  return doc;
}

// ===== SHOW MODAL =====
function showNota(order) {
  notaContent.innerHTML = `
    <strong>${order.invoice}</strong><br>
    ${order.customerName}<br>
    Total: <b>Rp ${order.total.toLocaleString("id-ID")}</b>
  `;
  modal.style.display = "flex";

  modalPrintBtn.onclick = () => {
    const pdf = generatePDF(order);
    pdf.autoPrint();
    window.open(pdf.output("bloburl"), "_blank");
  };
}

// ===== EVENTS =====
printLastBtn?.addEventListener("click", () => {
  const order = getLastOrder();
  if (!order) {
    alert("Belum ada order");
    return;
  }
  showNota(order);
});
