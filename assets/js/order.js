/* FILE: assets/js/order.js
   PUKIS LUMER AULIA — PDF GENERATOR FINAL PRO
   Digunakan oleh script.js → window.generatePdf()
*/

window.generatePdf = async function(orderData) {
  console.log("[generatePdf] start", orderData);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const fmtRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

  // Safe image loader
  async function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Load invoice assets
  const [logo, ttd, qris] = await Promise.all([
    loadImage("assets/images/logo.png"),
    loadImage("assets/images/ttd.png"),
    loadImage("assets/images/qris-pukis.jpg"),
  ]);

  const {
    nama = "-",
    buyerWA = "-",
    jenis = "-",
    isi = "-",
    mode = "non",
    topping = [],
    taburan = [],
    jumlahBox = 1,
    pricePerBox = 0,
    subtotal = 0,
    discount = 0,
    total = 0,
    note = "-",
    orderID = "ORD-" + Date.now()
  } = orderData;

  const now = new Date();
  const tgl = now.toLocaleDateString("id-ID");
  const jam = now.toLocaleTimeString("id-ID");

  // ===== HEADER =====
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("INVOICE", 10, 12);

  // TITLE
  try {
    pdf.setFont("Pacifico-Regular");
  } catch {}
  pdf.setFontSize(26);
  pdf.setTextColor(214, 51, 108);
  pdf.text("PUKIS LUMER AULIA", 105, 17, { align: "center" });

  // RESET STYLE
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0,0,0);

  // Logo
  if (logo) pdf.addImage(logo, "PNG", 155, 5, 40, 20);

  pdf.setFontSize(9);
  pdf.text("Pasar Kuliner Padang Panjang",155,27);
  pdf.text("📞 0812-9666-8670",155,31);

  pdf.line(10, 35, 200, 35);

  // Customer Info
  let y = 43;
  pdf.setFontSize(11);
  pdf.text("Nama Pemesan : " + nama, 10, y);
  pdf.text("Tanggal : " + tgl + " " + jam, 150, y);
  y += 7;
  pdf.text("Nomor Invoice : " + orderID, 150, y);

  // Catatan
  if (note && note !== "-") {
    y += 10;
    pdf.text("Catatan :", 10, y);
    pdf.text(note, 10, y+6);
    y += 12;
  } else {
    y += 10;
  }

  // =====  TABLE ITEM =====
  const desc =
    `${jenis} — ${isi} pcs\n` +
    (mode === "single"
      ? `Topping: ${topping.join(", ") || "-"}`
      : mode === "double"
        ? `Topping: ${topping.join(", ") || "-"} | Taburan: ${taburan.join(", ") || "-"}`
        : "Tanpa Topping");

  pdf.autoTable({
    startY: y,
    head: [["Deskripsi", "Harga", "Jumlah", "Total"]],
    body: [
      [
        desc,
        fmtRp(pricePerBox),
        jumlahBox + " Box",
        fmtRp(total),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [214,51,108], textColor: 255 },
    styles: { fontSize: 10 },
  });

  const finalY = pdf.lastAutoTable.finalY + 10;

  // ===== TOTALS =====
  pdf.setFontSize(11);
  pdf.text("Subtotal: " + fmtRp(subtotal), 195, finalY, { align: "right" });
  if (discount > 0)
    pdf.text("Disc: " + fmtRp(discount), 195, finalY+6, { align: "right" });
  pdf.setFont("helvetica","bold");
  pdf.text("Total Bayar: " + fmtRp(total),
           195, finalY + (discount>0?12:6),
           { align: "right" });

  // ===== Signature =====
  let sigY = finalY + (discount > 0 ? 20 : 16);
  pdf.setFont("helvetica","normal");
  pdf.text("Hormat Kami,", 150, sigY);

  if (ttd) pdf.addImage(ttd, "PNG", 150, sigY+5, 40, 18);

  // ===== QRIS =====
  if (qris) {
    pdf.text("QRIS Pembayaran", 13, sigY);
    pdf.addImage(qris, "PNG", 10, sigY+5, 35, 35);
  }

  // ===== Save PDF =====
  pdf.save(`${orderID}.pdf`);
};
