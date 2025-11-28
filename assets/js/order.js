/* ============================================================
   order.js — Versi Lengkap Final (Bersih & Tanpa Duplikat)
   ============================================================ */

// Tabel utama
function buildOrderTable(data) {
  return [
    ["Jenis", data.jenis || "-"],
    ["Isi per Box", (data.isi || "-") + " pcs"],
    ["Mode Topping", data.mode || "-"],
    ["Topping", (data.topping && data.topping.length) ? data.topping.join(", ") : "-"],
    ["Taburan", (data.taburan && data.taburan.length) ? data.taburan.join(", ") : "-"],
    ["Jumlah Box", String(data.jumlahBox || "-")],
    ["Harga/Box", "Rp " + ((data.pricePerBox || 0)).toLocaleString("id-ID")],
    ["Subtotal", "Rp " + ((data.subtotal || 0)).toLocaleString("id-ID")],
    ["Diskon", data.discount ? ("- Rp " + data.discount.toLocaleString("id-ID")) : "-"],
    ["Total", "Rp " + ((data.total || 0)).toLocaleString("id-ID")],
    ["Catatan", data.note || "-"]
  ];
}

async function generatePdf(order) {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) throw new Error("jsPDF tidak tersedia!");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const formatRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

    // loader gambar
    async function loadImage(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    }

    const [logoImg, ttdImg, qrisImg] = await Promise.all([
      loadImage("assets/images/logo.png"),
      loadImage("assets/images/ttd.png"),
      loadImage("assets/images/qris-pukis.jpg"),
    ]);

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // WATERMARK
    pdf.setTextColor(220, 220, 220);
    pdf.setFontSize(48);
    pdf.text("PUKIS LUMER AULIA", pageW / 2, pageH / 2, {
      align: "center",
      angle: 45
    });
    pdf.setTextColor(0, 0, 0);

    // HEADER
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("INVOICE", 14, 16);

    pdf.setFontSize(20);
    pdf.setTextColor(214, 51, 108);
    pdf.text("PUKIS LUMER AULIA", pageW / 2, 22, { align: "center" });
    pdf.setTextColor(0, 0, 0);

    if (logoImg) pdf.addImage(logoImg, "PNG", pageW - 55, 6, 40, 20);

    pdf.setFontSize(9);
    pdf.text("Pasar Kuliner Padang Panjang", pageW - 10, 28, { align: "right" });
    pdf.text("0812-9666-8670", pageW - 10, 32, { align: "right" });

    pdf.line(10, 36, pageW - 10, 36);

    // METADATA
    let y = 44;
    pdf.setFontSize(10);

    pdf.text("Order ID: " + order.orderID, 14, y);
    pdf.text("Tanggal: " + order.tgl, pageW - 14, y, { align: "right" });
    y += 7;

    pdf.text("No. Antrian: " + order.queueNo, 14, y);
    pdf.text("Invoice by: Pukis Lumer Aulia", pageW - 14, y, { align: "right" });
    y += 8;

    // CUSTOMER INFO
    pdf.text("Nama: " + order.nama, 14, y);
    pdf.text("WA: " + order.wa, pageW - 14, y, { align: "right" });
    y += 7;

    pdf.text("Jenis: " + order.jenis + " — " + order.isi + " pcs", 14, y);
    y += 7;
    pdf.text("Mode: " + order.mode, 14, y);
    y += 7;

    if (order.mode === "single") {
      pdf.text("Topping: " + (order.topping.join(", ") || "-"), 14, y);
      y += 7;
    }

    if (order.mode === "double") {
      pdf.text("Topping: " + (order.topping.join(", ") || "-"), 14, y);
      y += 7;
      pdf.text("Taburan: " + (order.taburan.join(", ") || "-"), 14, y);
      y += 7;
    }

    if (order.note && order.note !== "-") {
      pdf.text("Catatan:", 14, y);
      y += 6;
      const wrap = pdf.splitTextToSize(order.note, pageW - 28);
      pdf.text(wrap, 14, y);
      y += wrap.length * 6 + 4;
    }
      // ============================================================
    //  TABEL DETAIL ORDER
    // ============================================================

    const tableRows = [
      ["Jenis", order.jenis],
      ["Isi Box", order.isi + " pcs"],
      ["Mode", order.mode],
      ["Topping", order.topping.length ? order.topping.join(", ") : "-"],
      ["Taburan", order.taburan.length ? order.taburan.join(", ") : "-"],
      ["Jumlah Box", order.jumlahBox + " Box"],
      ["Harga per Box", formatRp(order.pricePerBox)],
      ["Subtotal", formatRp(order.subtotal)],
      ["Diskon", order.discount > 0 ? "- " + formatRp(order.discount) : "-"],
      ["Total Bayar", formatRp(order.total)],
      ["Catatan", order.note || "-"]
    ];

    // AutoTable jika tersedia
    if (typeof pdf.autoTable === "function") {
      pdf.autoTable({
        startY: y,
        head: [["Item", "Keterangan"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [214, 51, 108], textColor: 255 },
        styles: { fontSize: 10 }
      });
    } else {
      // fallback manual
      let ty = y;
      tableRows.forEach(row => {
        pdf.text(row[0], 20, ty);
        pdf.text(row[1], 120, ty);
        ty += 12;
      });
    }

    // Ambil posisi terakhir tabel
    const lastY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : y + tableRows.length * 12;


    // ============================================================
    //  FOOTER — QRIS + TTD + TERIMAKASIH
    // ============================================================

    let fy = lastY + 4;

    // QRIS
    if (qrisImg) {
      pdf.setFontSize(10);
      pdf.text("QRIS Pembayaran:", 14, fy);
      pdf.addImage(qrisImg, "PNG", 14, fy + 4, 36, 36);
    }

    // TTD
    if (ttdImg) {
      pdf.addImage(ttdImg, "PNG", pageW - 60, fy + 4, 46, 22);
    }

    pdf.setFontSize(10);
    pdf.text("Hormat Kami,", pageW - 60, fy + 30);

    // Terimakasih
    pdf.setFontSize(11);
    pdf.text(
      "Terimakasih sudah Belanja di toko Kami 🙏",
      pageW / 2,
      fy + 60,
      { align: "center" }
    );

    // ============================================================
    //  SIMPAN FILE
    // ============================================================

    const filename =
      "Invoice_" +
      (order.nama || "Pelanggan").replace(/\s+/g, "_") +
      "_" +
      order.orderID +
      ".pdf";

    pdf.save(filename);

  } catch (err) {
    console.error("generatePdf error:", err);
    alert("Gagal membuat PDF: " + err.message);
  }
}
