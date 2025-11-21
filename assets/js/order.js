/****************************************************
 * ORDER.JS FINAL – UNIVERSAL (Form Ultra Compatible)
 ****************************************************/

import { jsPDF } from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";

/* ======================
    KONFIGURASI HARGA
======================= */

const PRICE = {
    isi: { 5: 8000, 10: 15000 },
    topping: { non: 0, single: 2000, double: 4000 }
};

const ADMIN_WA = "62812xxxxxxx"; // Ganti nomor admin

/* ======================
    ELEMENT FORM ULTRA
======================= */

const fNama = document.getElementById("ultraNama");
const fWA = document.getElementById("ultraWA");

const fIsi = document.getElementById("ultraIsi");
const fJumlah = document.getElementById("ultraJumlah");

const fJenis = document.querySelectorAll("input[name='ultraJenis']");
const fMode = document.querySelectorAll("input[name='ultraToppingMode']");

const boxSingle = document.getElementById("ultraSingleGroup");
const boxDouble = document.getElementById("ultraDoubleGroup");

const oPrice = document.getElementById("ultraPricePerBox");
const oSubtotal = document.getElementById("ultraSubtotal");
const oDiscount = document.getElementById("ultraDiscount");
const oGrand = document.getElementById("ultraGrandTotal");

/* ======================
    LIMIT CHECKBOX
======================= */

function limitChecks(selector, max) {
    const boxes = [...document.querySelectorAll(selector)];
    boxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const total = boxes.filter(x => x.checked).length;
            if (total > max) {
                cb.checked = false;
                alert(`Maksimal ${max} pilihan`);
            }
        });
    });
}

limitChecks(".ultraSingle", 5);
limitChecks(".ultraDouble", 5);

/* ======================
    TAMPILKAN TOPPING
======================= */

function updateTopping() {
    const mode = document.querySelector("input[name='ultraToppingMode']:checked").value;

    boxSingle.style.display = "none";
    boxDouble.style.display = "none";

    if (mode === "single") boxSingle.style.display = "block";
    if (mode === "double") {
        boxSingle.style.display = "block";
        boxDouble.style.display = "block";
    }

    hitungHarga();
}

fMode.forEach(r => r.addEventListener("change", updateTopping));

/* ======================
    HITUNG HARGA
======================= */

function hitungHarga() {
    const isi = Number(fIsi.value);
    const jumlah = Number(fJumlah.value);
    const mode = document.querySelector("input[name='ultraToppingMode']:checked").value;

    const perBox = PRICE.isi[isi] + PRICE.topping[mode];
    const total = perBox * jumlah;

    oPrice.textContent = "Rp" + perBox.toLocaleString();
    oSubtotal.textContent = "Rp" + total.toLocaleString();
    oDiscount.textContent = "-";
    oGrand.textContent = "Rp" + total.toLocaleString();

    return { perBox, total };
}

[fIsi, fJumlah].forEach(el => el.addEventListener("change", hitungHarga));

/* ======================
    AMBIL DATA CHECKBOX
======================= */

function getChecked(selector) {
    return [...document.querySelectorAll(selector + ":checked")].map(x => x.value);
}

/* ======================
    BUAT DATA ORDER
======================= */

function createOrder() {
    const harga = hitungHarga();

    return {
        id: "INV" + Date.now(),
        nama: fNama.value,
        wa: fWA.value,
        jenis: document.querySelector("input[name='ultraJenis']:checked").value,
        mode: document.querySelector("input[name='ultraToppingMode']:checked").value,
        single: getChecked(".ultraSingle"),
        double: getChecked(".ultraDouble"),
        isi: Number(fIsi.value),
        jumlah: Number(fJumlah.value),

        hargaBox: harga.perBox,
        total: harga.total
    };
}
/* ======================
    BAGIAN 2/2 - PDF, WA, SUBMIT HANDLER
   ====================== */

/**
 * generatePremiumPDF(order)
 * - membuat jsPDF berisi watermark, logo, tabel rapi, ttd digital
 * - butuh file: assets/images/logo.png & assets/images/ttd.png
 */
function generatePremiumPDF(order) {
    const { jsPDF } = window.jspdf || { jsPDF: null };
    // jika import earlier via module tidak dipakai, fallback: window.jspdf
    const doc = new jsPDF();

    // lebar halaman untuk penempatan
    const pageWidth = doc.internal.pageSize.getWidth();

    // ---------- WATERMARK EMAS MIRING ----------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(50);
    doc.setTextColor(212, 175, 55); // gold
    doc.setGState && doc.setGState(new doc.GState && new doc.GState({ opacity: 0.12 })); // safe if available
    // rotate text: jsPDF doesn't take angle in text() consistently; apply transform workaround
    doc.saveGraphicsState && doc.saveGraphicsState();
    try {
        // center and rotate
        doc.text("PUKIS LUMER AULIA", pageWidth / 2, 140, { align: "center", angle: 45 });
    } catch (e) {
        // fallback without angle
        doc.text("PUKIS LUMER AULIA", 20, 150);
    }
    doc.restoreGraphicsState && doc.restoreGraphicsState();
    // reset color
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(12);

    // ---------- LOGO ----------
    // safe addImage: try/catch so missing images won't break execution
    try {
        doc.addImage("assets/images/logo.png", "PNG", 15, 12, 40, 40);
    } catch (e) {
        // silently ignore if file not found
    }

    // ---------- HEADER ----------
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth - 40, 20, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`No: ${order.id}`, pageWidth - 40, 28, { align: "right" });

    // buyer info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Kepada:", 15, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.nama || "-"}`, 15, 68);
    doc.text(`WA: ${order.wa || "-"}`, 15, 76);

    // tanggal
    doc.text(`Tanggal: ${new Date().toLocaleString("id-ID")}`, pageWidth - 40, 76, { align: "right" });

    // ---------- TABLE (autotable) ----------
    // head & body
    const tableBody = [
        ["Jenis", order.jenis || "-"],
        ["Mode Topping", order.mode || "-"],
        ["Topping (Single)", order.single && order.single.length ? order.single.join(", ") : "-"],
        ["Taburan (Double)", order.double && order.double.length ? order.double.join(", ") : "-"],
        ["Isi / Box", `${order.isi} pcs`],
        ["Jumlah Box", String(order.jumlah)],
        ["Harga / Box", `Rp ${Number(order.hargaBox).toLocaleString("id-ID")}`],
        ["Subtotal", `Rp ${Number(order.total).toLocaleString("id-ID")}`],
    ];

    // add autotable
    doc.autoTable({
        startY: 95,
        head: [["Keterangan", "Isi"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [212, 175, 55], textColor: 20, halign: "center" },
        styles: { fontSize: 10, cellPadding: 4 }
    });

    // ---------- TOTAL & NOTE ----------
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 95 + tableBody.length * 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL BAYAR:", 15, finalY + 12);
    doc.text(`Rp ${Number(order.total).toLocaleString("id-ID")}`, pageWidth - 40, finalY + 12, { align: "right" });

    // ---------- TTD (gambar) ----------
    try {
        doc.addImage("assets/images/ttd.png", "PNG", pageWidth - 80, finalY + 28, 55, 25);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Admin Pukis Lumer Aulia", pageWidth - 60, finalY + 56);
    } catch (e) {
        // ignore if missing
    }

    // ---------- FOOTER ----------
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Terima kasih telah memesan. Silakan simpan invoice ini sebagai bukti pembayaran.", pageWidth / 2, 285, { align: "center" });

    return doc;
}

/* ======================
   KIRIM PESAN KE WA (DETAIL)
   ====================== */
function buildWAMessage(order) {
    const single = order.single && order.single.length ? order.single.join(", ") : "-";
    const dbl = order.double && order.double.length ? order.double.join(", ") : "-";
    return `Halo! Saya ingin memesan Pukis:

Nama: ${order.nama || "-"}
Jenis: ${order.jenis || "-"}
Topping Mode: ${order.mode || "-"}
Topping (Single): ${single}
Taburan (Double): ${dbl}
Isi per Box: ${order.isi} pcs
Jumlah Box: ${order.jumlah} box
Total Bayar: Rp ${Number(order.total).toLocaleString("id-ID")}
Invoice: ${order.id}
`;
}

function sendToWA(order) {
    const msg = buildWAMessage(order);
    const phone = (typeof ADMIN_WA === "string" && ADMIN_WA) ? ADMIN_WA : "6281296668670";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
}

/* ======================
    SUBMIT HANDLER & NOTA POPUP
   ====================== */

const formUltra = document.getElementById("formUltra");
const notaContainer = document.getElementById("notaContainer");
const notaContent = document.getElementById("notaContent");
const notaClose = document.getElementById("notaClose");
const notaPrint = document.getElementById("notaPrint");
const notaSendAdmin = document.getElementById("notaSendAdmin");

// Keep lastOrder object
let lastOrderObj = null;

formUltra?.addEventListener("submit", (e) => {
    e.preventDefault();

    // create order data (reuse createOrder function from part1)
    const order = createOrder(); // assumes createOrder() exists (from part 1)
    // basic validation
    if (!order.nama || !order.wa) {
        alert("Lengkapi Nama dan Nomor WhatsApp.");
        return;
    }

    // save last order
    lastOrderObj = order;

    // tampilkan nota sederhana di popup (HTML)
    const html = `
      <div>
        <h4>Invoice: ${order.id}</h4>
        <p><strong>Nama:</strong> ${order.nama}</p>
        <p><strong>WA:</strong> ${order.wa}</p>
        <p><strong>Total:</strong> Rp ${Number(order.total).toLocaleString("id-ID")}</p>
        <hr/>
        <p><strong>Ringkasan:</strong></p>
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
    notaContent.innerHTML = html;
    notaContainer.style.display = "flex";

    // otomatis buka WA juga (opsional) — here we open WA after showing nota
    // Comment out if you don't want auto-opening
    // sendToWA(order);
});

// nota popup buttons
notaClose?.addEventListener("click", () => {
    notaContainer.style.display = "none";
});

notaPrint?.addEventListener("click", () => {
    if (!lastOrderObj) { alert("Belum ada pesanan."); return; }
    const pdf = generatePremiumPDF(lastOrderObj);
    pdf.save(`Invoice-${lastOrderObj.id}.pdf`);
});

notaSendAdmin?.addEventListener("click", () => {
    if (!lastOrderObj) { alert("Belum ada pesanan."); return; }
    sendToWA(lastOrderObj);
});

/* ======================
   QUICK BUTTONS (opsional)
   ====================== */
// Jika kamu mau sediakan tombol terpisah untuk langsung download / kirim WA,
// mis. id="btnPDF" atau id="btnWA", tambahkan listener:
const btnPDF = document.getElementById("btnPDF");
const btnWA = document.getElementById("btnWA");

btnPDF?.addEventListener("click", () => {
    if (!lastOrderObj) { alert("Belum ada pesanan."); return; }
    const pdf = generatePremiumPDF(lastOrderObj);
    pdf.save(`Invoice-${lastOrderObj.id}.pdf`);
});

btnWA?.addEventListener("click", () => {
    if (!lastOrderObj) { alert("Belum ada pesanan."); return; }
    sendToWA(lastOrderObj);
});

/* ======================
   INIT: tampilkan topping & hitung awal
   ====================== */
try { updateTopping(); } catch (e) { /* ignore if functions defined earlier */ }
try { hitungHarga(); } catch (e) { /* ignore */ }
