// FILE: assets/js/order.js
// Harga dan logika pesanan
const HARGA = {
  Original: { 5: { non:10000, single:13000, double:15000 }, 10:{ non:18000, single:25000, double:28000 } },
  Pandan:   { 5: { non:13000, single:15000, double:18000 }, 10:{ non:25000, single:28000, double:32000 } }
};
const ADMIN_WA = "6281296668670";
function formatRp(n){ return "Rp " + Number(n).toLocaleString("id-ID"); }
function getCheckedValues(selector){ return Array.from(document.querySelectorAll(selector + ':checked')).map(el=>el.value); }

function updateToppingVisibility(){
  const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || 'non';
  document.getElementById("ultraSingleGroup").style.display = (mode === "single" || mode === "double") ? "block" : "none";
  document.getElementById("ultraDoubleGroup").style.display = (mode === "double") ? "block" : "none";
}
document.querySelectorAll('input[name="ultraToppingMode"]').forEach(r=>r.addEventListener('change', updateToppingVisibility));
updateToppingVisibility();

function calcUltraPrice(){
  const jenis = document.querySelector('input[name="ultraJenis"]:checked')?.value || 'Original';
  const isi = Number(document.getElementById("ultraIsi").value);
  const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || 'non';
  const jumlah = Number(document.getElementById("ultraJumlah").value) || 1;
  const keyMode = (mode === "non") ? "non" : (mode === "single" ? "single" : "double");
  const pricePerBox = (HARGA[jenis] && HARGA[jenis][isi] && HARGA[jenis][isi][keyMode]) ? HARGA[jenis][isi][keyMode] : 0;
  const subTotal = pricePerBox * jumlah;
  const discount = 0;
  const grandTotal = subTotal - discount;
  document.getElementById("ultraPricePerBox").innerText = formatRp(pricePerBox);
  document.getElementById("ultraSubtotal").innerText = formatRp(subTotal);
  document.getElementById("ultraDiscount").innerText = discount ? `- ${formatRp(discount)}` : "-";
  document.getElementById("ultraGrandTotal").innerText = formatRp(grandTotal);
  return { pricePerBox, subTotal, discount, grandTotal };
}
document.querySelectorAll('#ultraIsi, #ultraJumlah, input[name="ultraJenis"], input[name="ultraToppingMode"]').forEach(el=>el.addEventListener('change', calcUltraPrice));
document.querySelectorAll('.ultraSingle, .ultraDouble').forEach(el=>el.addEventListener('change', calcUltraPrice));
window.addEventListener('load', calcUltraPrice);

document.getElementById("formUltra")?.addEventListener("submit", async function(e){
  e.preventDefault();
  const nama = document.getElementById("ultraNama").value.trim();
  let waRaw = document.getElementById("ultraWA").value.trim();
  if (!nama || !waRaw) { alert("Isi nama dan nomor WA"); return; }
  if (/^0/.test(waRaw)) waRaw = waRaw.replace(/^0/,'62');
  const jenis = document.querySelector('input[name="ultraJenis"]:checked')?.value || 'Original';
  const isi = Number(document.getElementById("ultraIsi").value);
  const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || 'non';
  const jumlah = Number(document.getElementById("ultraJumlah").value) || 1;
  const singleList = getCheckedValues('.ultraSingle');
  const doubleList = getCheckedValues('.ultraDouble');
  const calc = calcUltraPrice();
  const invoiceID = `PLA-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Date.now()).slice(-6)}`;
  const order = { invoiceID, createdAt: new Date().toISOString(), nama, buyerWA: waRaw, jenis, isiPerBox: isi, toppingMode: mode === 'non' ? 'Non Topping' : (mode === 'single' ? 'Single Topping' : 'Double Topping'), singleList: singleList.join(', '), doubleList: doubleList.join(', '), jumlahBox: jumlah, pricePerBox: calc.pricePerBox, subTotal: calc.subTotal, discount: calc.discount, grandTotal: calc.grandTotal };
  // buat nota sederhana di popup
  const notaHtml = `<div><strong>No. Invoice:</strong> ${order.invoiceID}</div><div><strong>Nama:</strong> ${order.nama}</div><div><strong>Total:</strong> ${formatRp(order.grandTotal)}</div>`;
  document.getElementById('notaContent').innerHTML = notaHtml;
  document.getElementById('notaContainer').style.display = 'flex';
  const waMessage = `Halo! Saya ingin memesan Pukis:\n- Nama: ${order.nama}\n- Jenis: ${order.jenis}\n- Topping: ${order.toppingMode}\n- Isi per Box: ${order.isiPerBox} pcs\n- Jumlah Box: ${order.jumlahBox}\n- Rasa: ${order.singleList || '-'}\n- Taburan: ${order.doubleList || '-'}\nTotal: ${formatRp(order.grandTotal)}\nNo. Invoice: ${order.invoiceID}\nNomor WA pembeli: ${order.buyerWA}\n`;
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(waMessage)}`, '_blank');
});
import { jsPDF } from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

// fungsi buat nota premium
export function generatePremiumNota(order) {
    const doc = new jsPDF();

    // ========== WATERMARK EMAS ========== 
    doc.setFontSize(40);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text("PUKIS LUMER AULIA", 20, 150, {
        angle: 45,
        opacity: 0.15
    });

    // ========== LOGO (posisi kiri atas) ========== 
    doc.addImage("assets/images/logo.png", "PNG", 15, 10, 35, 35);

    // ========== JUDUL ========== 
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("INVOICE PEMBELIAN", 105, 20, null, null, "center");

    // ========== NOMOR INVOICE ========== 
    doc.setFontSize(12);
    doc.text(`Invoice: ${order.invoiceID}`, 105, 28, null, null, "center");

    // ========== INFORMASI PEMBELI ==========
    doc.setFontSize(12);
    doc.text(`Nama: ${order.nama}`, 15, 55);
    doc.text(`WA: ${order.buyerWA}`, 15, 62);

    // ========== TABEL PESANAN ========== 
    doc.autoTable({
        startY: 75,
        head: [["Keterangan", "Isi"]],
        body: [
            ["Jenis", order.jenis],
            ["Isi/Box", order.isiPerBox + " pcs"],
            ["Jumlah Box", order.jumlahBox],
            ["Topping Mode", order.toppingMode],
            ["Rasa Single", order.singleList || "-"],
            ["Taburan Double", order.doubleList || "-"],
            ["Harga/Box", "Rp " + order.pricePerBox.toLocaleString()],
            ["Subtotal", "Rp " + order.subTotal.toLocaleString()],
            ["Diskon", order.discount ? "Rp " + order.discount : "-"],
            ["Total Bayar", "Rp " + order.grandTotal.toLocaleString()],
        ],
        theme: "grid",
        headStyles: { fillColor: [212, 175, 55] },  // Gold
        styles: { fontSize: 11 }
    });

    // ========== TTD DIGITAL ========== 
    doc.addImage("assets/images/ttd.png", "PNG", 140, 220, 40, 20);
    doc.text("Admin Pukis Lumer Aulia", 145, 245);

    // ========== FOOTER ========== 
    doc.setFontSize(10);
    doc.text("Terima kasih atas pesanan Anda!", 105, 285, null, null, "center");

    return doc;
}
