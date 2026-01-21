/* =========================================
   ADMIN PDF TEMPLATE — FINAL LOCKED
   BRANDING MEWAH | KHUSUS ADMIN
========================================= */
async function generateAdminPDF(order) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  /* ===== HEADER ===== */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PUKIS LUMER AULIA', 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Invoice Resmi Pemesanan', 105, 24, { align: 'center' });

  /* ===== WATERMARK ===== */
  doc.setTextColor(230);
  doc.setFontSize(40);
  doc.text('PUKIS LUMER AULIA', 105, 150, {
    align: 'center',
    angle: 45
  });
  doc.setTextColor(0);

  /* ===== TABLE ===== */
  doc.autoTable({
    startY: 35,
    theme: 'grid',
    headStyles: {
      fillColor: [22, 54, 92],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 4
    },
    head: [['Keterangan', 'Detail']],
    body: [
      ['Invoice', order.invoice],
      ['Tanggal', new Date(order.tgl).toLocaleString('id-ID')],
      ['Nama Pemesan', order.nama],
      ['No. WhatsApp', order.wa],
      ['Jenis Pesanan', order.mode.toUpperCase()],
      [
        'Topping',
        order.mode === 'single'
          ? order.single.join(', ')
          : order.double.join(', ')
      ],
      ['Taburan', order.taburan.join(', ') || '-'],
      ['Catatan', order.catatan],
      ['Jumlah', order.qty + ' Box'],
      ['Total', 'Rp ' + Number(order.total).toLocaleString('id-ID')]
    ]
  });

  const finalY = doc.lastAutoTable.finalY || 120;

  /* ===== LOAD IMAGE HELPER ===== */
  const loadImg = src =>
    new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = src;
    });

  /* ===== QRIS (KIRI BAWAH) ===== */
  try {
    const qris = await loadImg('assets/images/qris-pukis.jpg');
    doc.addImage(qris, 'JPEG', 15, 245, 40, 40);
  } catch (e) {}

  /* ===== TTD (KANAN BAWAH) ===== */
  try {
    const ttd = await loadImg('assets/images/ttd.png');
    doc.addImage(ttd, 'PNG', 150, 248, 40, 20);
  } catch (e) {}

  /* ===== FOOTER TEXT (TENGAH) ===== */
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Terimakasih sudah belanja\nKami tunggu kunjungan selanjutnya',
    105,
    280,
    { align: 'center' }
  );

  return doc;
}
