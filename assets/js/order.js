/* ============================================================
   PUKIS LUMER AULIA — ORDER.JS OFFLINE FIX FINAL
   Deteksi otomatis jsPDF & AutoTable agar tidak error
   ============================================================ */

/* -------------------------------------------
   DETEKSI jsPDF (semua kemungkinan source)
   ------------------------------------------- */
let jsPDF = null;

try {
    // Urutan deteksi lengkap
    if (window.jspdf?.jsPDF) {
        jsPDF = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
        jsPDF = window.jsPDF;
    } else if (window.jspdf) {
        jsPDF = window.jspdf;
    }
} catch (e) {}

/* -------------------------------------------
   Jika jsPDF tetap tidak ketemu → error
   ------------------------------------------- */
if (!jsPDF) {
    alert("PDF gagal. Library jsPDF belum dimuat. Silakan refresh halaman.");
    console.error("❌ jsPDF tidak terdeteksi sama sekali");
    throw new Error("jsPDF NOT LOADED");
}

/* -------------------------------------------
   CEK AUTOTABLE
   ------------------------------------------- */
if (!jsPDF.prototype.autoTable) {
    console.warn("⚠ AutoTable belum terdeteksi. Pastikan file 'jspdf.plugin.autotable.min.js' sudah dimuat.");
}

/* ============================================================
   FUNGSI UTAMA: generatePdf()
   ============================================================ */
window.generatePdf = function (data) {

    const doc = new jsPDF({
        unit: "px",
        format: "a4",
        compress: true,
    });

    // HEADER
    doc.setFontSize(20);
    doc.text("INVOICE — Pukis Lumer Aulia", 20, 30);

    doc.setFontSize(12);
    doc.text(`ID: ${data.id}`, 20, 55);
    doc.text(`Tanggal: ${new Date().toLocaleString("id-ID")}`, 20, 70);

    // DETAIL PEMESAN
    doc.setFontSize(14);
    doc.text("Detail Pemesan", 20, 100);

    doc.setFontSize(12);
    doc.text(`Nama: ${data.nama}`, 20, 125);
    doc.text(`WhatsApp: ${data.wa}`, 20, 140);

    // TABEL PEMESANAN
    const rows = [
        ["Jenis", data.jenis],
        ["Isi Box", data.isi + " pcs"],
        ["Mode", data.mode],
        ["Topping", data.topping.length ? data.topping.join(", ") : "-"],
        ["Taburan", data.taburan.length ? data.taburan.join(", ") : "-"],
        ["Jumlah Box", String(data.jumlahBox)],
        ["Harga per Box", "Rp " + data.pricePerBox.toLocaleString("id-ID")],
        ["Subtotal", "Rp " + data.subtotal.toLocaleString("id-ID")],
        ["Diskon", data.discount > 0 ? "Rp -" + data.discount.toLocaleString("id-ID") : "-"],
        ["Total Bayar", "Rp " + data.total.toLocaleString("id-ID")],
        ["Catatan", data.note || "-"],
    ];

    if (doc.autoTable) {
        doc.autoTable({
            startY: 170,
            head: [["Item", "Keterangan"]],
            body: rows,
            theme: "striped",
            headStyles: { fillColor: [255, 94, 126] },
        });
    } else {
        doc.text("(AutoTable tidak tersedia — tabel tidak bisa ditampilkan)", 20, 170);
    }

    // FOOTER
    const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 30 : 250;
    doc.text("Terima kasih telah memesan ❤️", 20, y);

    doc.save(`Pukis_${data.id}.pdf`);
};

/* -------------------------------------------
   DEBUG
   ------------------------------------------- */
console.log("ORDER.JS — FIX FINAL LOADED");
