/* ============================================================
   PUKIS LUMER AULIA — ORDER.JS OFFLINE
   Penjelasan setiap blok ditulis dalam Bahasa Indonesia
   ============================================================ */


/* ============================================================
   1. VALIDASI LIBRARY PDF (jsPDF & AutoTable)
   — Pastikan kedua library sudah dimuat dari file lokal
   ============================================================ */
if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error("❌ jsPDF TIDAK ditemukan. Pastikan file lokal dimuat:");
    console.error("   - assets/js/lib/jspdf.umd.min.js");
    throw new Error("jsPDF belum dimuat (OFFLINE MODE)");
}

if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF gagal: jsPDF belum dimuat.");
}


/* ============================================================
   2. FUNGSI UTAMA: generatePdf(data)
   — Membuat file PDF berdasarkan data order
   ============================================================ */
window.generatePdf = async function (data) {

    // Mengambil konstruktor jsPDF
    const { jsPDF } = window.jspdf;

    // Membuat dokumen baru A4 portrait
    const doc = new jsPDF({
        unit: "px",
        format: "a4",
        compress: true,
    });

    /* -------------------------------------------
       HEADER PDF
       ------------------------------------------- */
    doc.setFontSize(18);
    doc.text("INVOICE — Pukis Lumer Aulia", 20, 30);

    doc.setFontSize(12);
    doc.text(`ID Pemesanan: ${data.id}`, 20, 55);
    doc.text(`Tanggal: ${new Date().toLocaleString("id-ID")}`, 20, 70);

    /* -------------------------------------------
       DETAIL PEMESAN
       ------------------------------------------- */
    doc.setFontSize(14);
    doc.text("Detail Pemesan", 20, 105);

    doc.setFontSize(12);
    doc.text(`Nama: ${data.nama}`, 20, 130);
    doc.text(`WA: ${data.wa}`, 20, 145);

    /* -------------------------------------------
       TABEL PEMESANAN
       ------------------------------------------- */
    const rows = [
        ["Jenis", data.jenis],
        ["Isi Box", data.isi + " pcs"],
        ["Mode Topping", data.mode],
        ["Topping", data.topping.length ? data.topping.join(", ") : "-"],
        ["Taburan", data.taburan.length ? data.taburan.join(", ") : "-"],
        ["Jumlah Box", data.jumlahBox],
        ["Harga per Box", "Rp " + data.pricePerBox.toLocaleString("id-ID")],
        ["Subtotal", "Rp " + data.subtotal.toLocaleString("id-ID")],
        ["Diskon", data.discount > 0 ? "- Rp " + data.discount.toLocaleString("id-ID") : "-"],
        ["Total Bayar", "Rp " + data.total.toLocaleString("id-ID")],
        ["Catatan", data.note || "-"],
    ];

    // Membuat tabel AutoTable
    doc.autoTable({
        startY: 170,
        head: [["Item", "Keterangan"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [255, 94, 126] },
        styles: { fontSize: 12 },
    });

    /* -------------------------------------------
       FOOTER PDF
       ------------------------------------------- */
    const finalY = doc.lastAutoTable.finalY + 40;
    doc.setFontSize(11);
    doc.text("Terima kasih telah memesan Pukis Lumer Aulia ❤️", 20, finalY);

    /* -------------------------------------------
       SIMPAN FILE
       ------------------------------------------- */
    const filename = `PukisLumerAulia_${data.id}.pdf`;
    doc.save(filename);
};


/* ============================================================
   3. DEBUG HELPER
   — Log ke console jika PDF siap digunakan
   ============================================================ */
console.log("ORDER.JS OFFLINE MODE — Siap membentuk PDF");
