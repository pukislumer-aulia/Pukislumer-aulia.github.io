// FILE: assets/js/order.js (PREMIUM VERSION)

// ======== IMPORT LIBRARY ========
import { jsPDF } from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";

const ADMIN_WA = "6281296668670";

// ======== HARGA MENU ========
const HARGA = {
    Original: {
        5: { non: 10000, single: 13000, double: 15000 },
        10: { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
        5: { non: 13000, single: 15000, double: 18000 },
        10: { non: 25000, single: 28000, double: 32000 }
    }
};

function formatRp(n) {
    return "Rp " + Number(n).toLocaleString("id-ID");
}
function getCheckedValues(selector) {
    return Array.from(document.querySelectorAll(selector + ':checked')).map(el => el.value);
}

// ======== TOPPING VISIBILITY ========
function updateToppingVisibility() {
    const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || 'non';

    document.getElementById("ultraSingleGroup").style.display =
        (mode === "single" || mode === "double") ? "block" : "none";

    document.getElementById("ultraDoubleGroup").style.display =
        (mode === "double") ? "block" : "none";
}
document.querySelectorAll('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', updateToppingVisibility));
updateToppingVisibility();

// ======== HITUNG HARGA ========
function calcUltraPrice() {
    const jenis = document.querySelector('input[name="ultraJenis"]:checked')?.value || 'Original';
    const isi = Number(document.getElementById("ultraIsi").value);
    const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || 'non';
    const jumlah = Number(document.getElementById("ultraJumlah").value) || 1;

    const keyMode = mode === "non" ? "non" : (mode === "single" ? "single" : "double");
    const pricePerBox = HARGA[jenis]?.[isi]?.[keyMode] || 0;

    const subTotal = pricePerBox * jumlah;
    const discount = 0;
    const grandTotal = subTotal - discount;

    document.getElementById("ultraPricePerBox").innerText = formatRp(pricePerBox);
    document.getElementById("ultraSubtotal").innerText = formatRp(subTotal);
    document.getElementById("ultraDiscount").innerText = discount ? `- ${formatRp(discount)}` : "-";
    document.getElementById("ultraGrandTotal").innerText = formatRp(grandTotal);

    return { pricePerBox, subTotal, discount, grandTotal };
}
document.querySelectorAll('#ultraIsi, #ultraJumlah, input[name="ultraJenis"], input[name="ultraToppingMode"]').forEach(el => el.addEventListener('change', calcUltraPrice));
document.querySelectorAll('.ultraSingle, .ultraDouble').forEach(el => el.addEventListener('change', calcUltraPrice));
window.addEventListener('load', calcUltraPrice);


// =======================================================
// ★ PREMIUM PDF GENERATOR (LOGO + WATERMARK + TTD)
// =======================================================
export function generatePremiumNota(order) {
    const doc = new jsPDF("p", "mm", "a4");

    // ===== WATERMARK EMAS =====
    doc.setFontSize(40);
    doc.setTextColor(212, 175, 55);
    doc.text("PUKIS LUMER AULIA", 25, 150, {
        angle: 45,
        opacity: 0.13
    });

    // ===== LOGO =====
    doc.addImage("assets/images/logo.png", "PNG", 15, 10, 30, 30);

    // ===== TITLE =====
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("INVOICE PEMBELIAN", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.text(`Invoice: ${order.invoiceID}`, 105, 28, null, null, "center");

    // ===== CUSTOMER INFO =====
    doc.setFontSize(12);
    doc.text(`Nama Pembeli : ${order.nama}`, 15, 55);
    doc.text(`Nomor WA     : ${order.buyerWA}`, 15, 62);

    // ===== ORDER TABLE =====
    doc.autoTable({
        startY: 75,
        head: [["Keterangan", "Isi"]],
        body: [
            ["Jenis", order.jenis],
            ["Isi per Box", order.isiPerBox + " pcs"],
            ["Jumlah Box", order.jumlahBox],
            ["Mode Topping", order.toppingMode],
            ["Rasa Single", order.singleList || "-"],
            ["Taburan Double", order.doubleList || "-"],
            ["Harga per Box", formatRp(order.pricePerBox)],
            ["Subtotal", formatRp(order.subTotal)],
            ["Diskon", order.discount ? formatRp(order.discount) : "-"],
            ["Total Bayar", formatRp(order.grandTotal)]
        ],
        theme: "grid",
        headStyles: {
            fillColor: [212, 175, 55],  // GOLD
            textColor: 20
        },
        styles: { fontSize: 11 }
    });

    // ===== TANDA TANGAN DIGITAL =====
    doc.addImage("assets/images/ttd.png", "PNG", 140, 220, 45, 22);
    doc.text("Admin Pukis Lumer Aulia", 145, 245);

    // ===== FOOTER =====
    doc.setFontSize(10);
    doc.text("Terima kasih telah memesan di Pukis Lumer Aulia ❤️", 105, 285, null, null, "center");

    return doc;
}


// =======================================================
// ★ FORM SUBMIT HANDLER
// =======================================================
let lastOrder = null;

document.getElementById("formUltra")?.addEventListener("submit", function (e) {
    e.preventDefault();

    const nama = document.getElementById("ultraNama").value.trim();
    let wa = document.getElementById("ultraWA").value.trim();

    if (!nama || !wa) return alert("Isi nama & WA!");

    if (/^0/.test(wa)) wa = wa.replace(/^0/, "62");

    const jenis = document.querySelector('input[name="ultraJenis"]:checked').value;
    const isi = Number(document.getElementById("ultraIsi").value);
    const mode = document.querySelector('input[name="ultraToppingMode"]:checked').value;

    const jumlah = Number(document.getElementById("ultraJumlah").value);
    const singleList = getCheckedValues('.ultraSingle').join(', ');
    const doubleList = getCheckedValues('.ultraDouble').join(', ');

    const calc = calcUltraPrice();

    const invoiceID =
        `PLA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`;

    const order = lastOrder = {
        invoiceID,
        createdAt: new Date().toISOString(),
        nama,
        buyerWA: wa,
        jenis,
        isiPerBox: isi,
        jumlahBox: jumlah,
        toppingMode:
            mode === 'non' ? 'Non Topping' :
            mode === 'single' ? 'Single Topping' : 'Double Topping',
        singleList,
        doubleList,
        pricePerBox: calc.pricePerBox,
        subTotal: calc.subTotal,
        discount: calc.discount,
        grandTotal: calc.grandTotal
    };

    // DISPLAY NOTA POPUP (HTML)
    document.getElementById("notaContent").innerHTML = `
        <strong>Invoice:</strong> ${order.invoiceID}<br>
        <strong>Nama:</strong> ${order.nama}<br>
        <strong>Total:</strong> ${formatRp(order.grandTotal)}
    `;
    document.getElementById("notaContainer").style.display = "flex";

    // === WhatsApp auto-send ===
    const waMsg =
`Halo Admin,
Saya ingin memesan Pukis:

Nama: ${order.nama}
Jenis: ${order.jenis}
Isi per Box: ${order.isiPerBox} pcs
Jumlah Box: ${order.jumlahBox}
Rasa: ${order.singleList || "-"}
Taburan: ${order.doubleList || "-"}
Total Bayar: ${formatRp(order.grandTotal)}

Invoice: ${order.invoiceID}
WA Pembeli: ${order.buyerWA}`;

    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(waMsg)}`, "_blank");
});


// =======================================================
// ★ TOMBOL CETAK & KIRIM WA ADMIN
// =======================================================
document.getElementById("notaPrint")?.addEventListener("click", () => {
    if (!lastOrder) return;
    const pdf = generatePremiumNota(lastOrder);
    pdf.save(`Invoice-${lastOrder.invoiceID}.pdf`);
});

document.getElementById("notaSendAdmin")?.addEventListener("click", () => {
    if (!lastOrder) return;
    const text =
        `Halo Admin, berikut invoice: ${lastOrder.invoiceID}\nTotal: ${formatRp(lastOrder.grandTotal)}`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`);
});
