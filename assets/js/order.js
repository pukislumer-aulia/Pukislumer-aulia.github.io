/* ============================================================
   PUKIS LUMER AULIA — ORDER.JS OFFLINE FINAL FIX
   Versi Stabil • Tidak Ada Duplikasi • Tidak Ada Konflik
   Semua komentar dalam Bahasa Indonesia
   ============================================================ */


/* ============================================================
   1. TUNGGU LIBRARY jsPDF & AUTOTABLE TERLOAD (WAJIB)
   — Android & GitHub Pages kadang lambat load file besar
   — Maka kita beri delay agar 100% library sudah terbaca
   ============================================================ */
await new Promise(res => setTimeout(res, 150));


/* ============================================================
   2. VALIDASI LIBRARY PDF (jsPDF & AutoTable)
   — Jika file di assets/js/lib/ belum dimuat, hentikan proses
   ============================================================ */
if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error("❌ jsPDF TIDAK ditemukan. Pastikan file lokal dimuat:");
    console.error("   - assets/js/lib/jspdf.umd.min.js");
    console.error("   - assets/js/lib/jspdf.plugin.autotable.min.js");
    alert("PDF gagal: jsPDF belum dimuat. Periksa kembali folder assets/js/lib/");
    throw new Error("jsPDF belum dimuat (OFFLINE MODE)");
}


/* ============================================================
   3. FUNGSI UTAMA — Membuat PDF Nota Pemesanan
   ============================================================ */
window.generatePdf = async function (data) {

    // Import konstruktor jsPDF dari library UMD
    const { jsPDF } = window.jspdf;

    // Membuat dokumen A4 portrait
    const doc = new jsPDF({
        unit: "px",
        format: "a4",
        compress: true,
    });

    /* --------------------------------------------------------
       HEADER PDF
       -------------------------------------------------------- */
    doc.setFontSize(18);
    doc.text("INVOICE — Pukis Lumer Aulia", 20, 30);

    doc.setFontSize(12);
    doc.text(`ID Pemesanan: ${data.id}`, 20, 55);
    doc.text(`Tanggal: ${new Date().toLocaleString("id-ID")}`, 20, 70);

    /* --------------------------------------------------------
       DATA PEMESAN
       -------------------------------------------------------- */
    doc.setFontSize(14);
    doc.text("Detail Pemesan", 20, 105);

    doc.setFontSize(12);
    doc.text(`Nama: ${data.nama}`, 20, 130);
    doc.text(`WA: ${data.wa}`, 20, 145);

    /* --------------------------------------------------------
       TABEL ITEM PESANAN
       -------------------------------------------------------- */
    const rows = [
        ["Jenis", data.jenis],
        ["Isi Box", `${data.isi} pcs`],
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

    doc.autoTable({
        startY: 170,
        head: [["Item", "Keterangan"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [255, 94, 126] },
        styles: { fontSize: 12 },
    });

    /* --------------------------------------------------------
       FOOTER PDF
       -------------------------------------------------------- */
    const endY = doc.lastAutoTable.finalY + 40;
    doc.setFontSize(11);
    doc.text("Terima kasih telah memesan Pukis Lumer Aulia ❤️", 20, endY);

    /* --------------------------------------------------------
       SIMPAN FILE PDF
       -------------------------------------------------------- */
    const filename = `PukisLumerAulia_${data.id}.pdf`;
    doc.save(filename);
};


/* ============================================================
   4. DEBUG — Memberi tanda bahwa order.js OFFLINE berhasil dimuat
   ============================================================ */
console.log("✅ ORDER.JS OFFLINE FINAL — Siap membuat PDF.");
