/* =========================================================
   order.js — PART 1
   (TIDAK DIUBAH, SESUAI HTML LAMA)
   Mengatur:
   - Mode topping (non / single / double)
   - Topping & taburan checkbox sesuai HTML lama
   - Hitung otomatis harga
   - Update nota popup
   - Kirim WA
   - Kirim data ke PDF (dibuat oleh Part 2)
========================================================= */

(function () {
  "use strict";

  /* ====== Ambil elemen HTML lama ====== */
  const jenisSelect = document.getElementById("ultraJenis");
  const isiSelect = document.getElementById("ultraIsi");

  const modeRadios = document.querySelectorAll("input[name='ultraToppingMode']");
  const groupSingle = document.getElementById("ultraSingleGroup");
  const groupDouble = document.getElementById("ultraDoubleGroup");

  const namaInput = document.getElementById("ultraNama");
  const waInput = document.getElementById("ultraWA");
  const jumlahBoxInput = document.getElementById("ultraQty");

  const pricePerBoxInput = document.getElementById("ultraPricePerBox");
  const subtotalInput = document.getElementById("ultraSubtotal");
  const discountInput = document.getElementById("ultraDiscount");
  const grandTotalInput = document.getElementById("ultraGrandTotal");

  const noteInput = document.getElementById("ultraNote");

  const notaPopup = document.getElementById("notaContent");
  const btnShowNota = document.getElementById("showNota");
  const btnPrintNota = document.getElementById("notaPrint");
  const btnWA = document.getElementById("sendWA");

  /* ====== Harga isi box ====== */
  const priceMap = {
    "10": 10000,
    "15": 15000,
    "20": 20000,
    "25": 25000,
    "30": 30000,
  };

  /* ======================================================
     MODE TOPPING (mengikuti HTML lama)
  ====================================================== */
  function updateMode() {
    const mode = document.querySelector("input[name='ultraToppingMode']:checked")?.value;

    groupSingle.style.display = "none";
    groupDouble.style.display = "none";

    if (mode === "single") {
      groupSingle.style.display = "block";
    } else if (mode === "double") {
      groupDouble.style.display = "block";
    }
  }

  modeRadios.forEach((r) => r.addEventListener("change", updateMode));

  /* ====== Hitung Harga ====== */
  function hitungTotal() {
    const isi = isiSelect.value;
    const jumlah = Number(jumlahBoxInput.value || 0);

    const hargaSatuan = priceMap[isi] || 0;
    const subtotal = hargaSatuan * jumlah;

    let diskon = 0;
    const total = subtotal - diskon;

    pricePerBoxInput.value = hargaSatuan;
    subtotalInput.value = subtotal;
    discountInput.value = diskon;
    grandTotalInput.value = total;
  }

  jenisSelect.addEventListener("change", hitungTotal);
  isiSelect.addEventListener("change", hitungTotal);
  jumlahBoxInput.addEventListener("input", hitungTotal);

  /* ======================================================
     NOTA POPUP
  ====================================================== */
  function getCheckedValues(container) {
    return [...container.querySelectorAll("input[type='checkbox']:checked")].map(
      (c) => c.value
    );
  }

  function updateNota() {
    const mode = document.querySelector("input[name='ultraToppingMode']:checked")?.value;

    const topping = mode === "single" ? getCheckedValues(groupSingle) : [];
    const taburan = mode === "double" ? getCheckedValues(groupDouble) : [];

    const isi = `
      <b>Jenis:</b> ${jenisSelect.value}<br>
      <b>Isi Box:</b> ${isiSelect.value} pcs<br>
      <b>Mode:</b> ${mode}<br>
      <b>Topping:</b> ${topping.join(", ") || "-"}<br>
      <b>Taburan:</b> ${taburan.join(", ") || "-"}<br>
      <b>Jumlah Box:</b> ${jumlahBoxInput.value}<br>
      <b>Harga Satuan:</b> ${pricePerBoxInput.value}<br>
      <b>Subtotal:</b> ${subtotalInput.value}<br>
      <b>Diskon:</b> ${discountInput.value}<br>
      <b>Total Bayar:</b> ${grandTotalInput.value}<br>
      <b>Catatan:</b> ${noteInput.value || "-"}<br>
    `;

    notaPopup.innerHTML = isi;
  }

  document.querySelectorAll("input, select").forEach((el) =>
    el.addEventListener("change", updateNota)
  );

  /* ======================================================
     KIRIM WA
  ====================================================== */
  function sendWA() {
    const mode = document.querySelector("input[name='ultraToppingMode']:checked")?.value;
    const topping = mode === "single" ? getCheckedValues(groupSingle) : [];
    const taburan = mode === "double" ? getCheckedValues(groupDouble) : [];

    const pesan =
      `*PESANAN PUKIS LUMER AULIA*\n\n` +
      `Nama : ${namaInput.value}\n` +
      `No HP: ${waInput.value}\n` +
      `Jenis : ${jenisSelect.value}\n` +
      `Isi Box : ${isiSelect.value} pcs\n` +
      `Mode : ${mode}\n` +
      `Topping : ${topping.join(", ") || "-"}\n` +
      `Taburan : ${taburan.join(", ") || "-"}\n` +
      `Jumlah Box : ${jumlahBoxInput.value}\n` +
      `Total Bayar : Rp ${grandTotalInput.value}\n` +
      `Catatan : ${noteInput.value || "-"}\n`;

    const url = `https://wa.me/${waInput.value}?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  }

  btnWA.addEventListener("click", sendWA);

  /* ======================================================
     CETAK PDF → memakai PART 2 (di bawah)
  ====================================================== */
  btnPrintNota.addEventListener("click", async function () {
    const mode = document.querySelector("input[name='ultraToppingMode']:checked")?.value;

    const order = {
      orderID: "INV" + Date.now(),
      jenis: jenisSelect.value,
      isi: isiSelect.value,
      mode,
      topping: mode === "single" ? getCheckedValues(groupSingle) : [],
      taburan: mode === "double" ? getCheckedValues(groupDouble) : [],
      jumlahBox: jumlahBoxInput.value,
      pricePerBox: pricePerBoxInput.value,
      subtotal: subtotalInput.value,
      discount: discountInput.value,
      total: grandTotalInput.value,
      nama: namaInput.value,
      wa: waInput.value,
      note: noteInput.value,
      tgl: new Date().toLocaleString("id-ID"),
    };

    if (window.generatePdf) {
      await window.generatePdf(order);
    } else {
      alert("Gagal membuat PDF, library belum siap.");
    }
  });

  window.tryAttachGeneratePdf = function (JS) {
    window.generatePdf = window.makeGeneratePdf(JS);
  };
})();

/* =========================================================
   order.js — PART 2 FINAL (PDF)
========================================================= */

(function () {
  "use strict";

  function formatRp(num) {
    return "Rp " + Number(num || 0).toLocaleString("id-ID");
  }

  function loadPNGorJPG(path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext("2d").drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
      img.src = path;
    });
  }

  function makeGeneratePdf(JS) {
    let Doc = JS && JS.jsPDF ? JS.jsPDF : JS;
    if (!Doc && window.jsPDF) Doc = window.jsPDF;

    return async function generatePdf(order) {
      try {
        if (!Doc) throw new Error("jsPDF tidak ditemukan");

        const doc = new Doc({ unit: "mm", format: "a4" });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        const qrisData = await loadPNGorJPG("assets/images/qris-pukis.jpg");
        const ttdData = await loadPNGorJPG("assets/images/ttd.png");

        /* ==== Watermark miring ==== */
        doc.setFont("helvetica", "bold");
        doc.setFontSize(48);
        doc.setTextColor(150, 150, 150);
        doc.setGState(doc.GState({ opacity: 0.07 }));

        doc.saveGraphicsState();
        doc.rotate(-35 * Math.PI/180, { origin: [W/2, H/2] });
        doc.text("Pukis Lumer Aulia", W/2, H/2, { align: "center" });
        doc.restoreGraphicsState();

        doc.setGState(doc.GState({ opacity: 1 }));
        doc.setTextColor(0, 0, 0);

        /* ==== Header ==== */
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(128, 0, 0);
        doc.text("INVOICE PEMBAYARAN", 14, 20);

        doc.setTextColor(0,0,0);
        doc.setFont("helvetica","normal");
        doc.setFontSize(10);

        /* ==== Data Pembeli ==== */
        let y = 28;
        doc.text(`Nomor Invoice : ${order.orderID}`, 14,y); y+=6;
        doc.text(`Kepada        : ${order.nama}`, 14,y); y+=6;
        doc.text(`Nomor Telp    : ${order.wa}`, 14,y); y+=6;
        doc.text(`Catatan       : ${order.note || "-"}`, 14,y); y+=10;

        /* ==== Identitas toko kanan ==== */
        const X = W - 14;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(128,0,0);
        doc.text("PUKIS LUMER AULIA", X, 20, { align:"right" });

        doc.setTextColor(0,0,0);
        doc.setFontSize(10);

        doc.setFont("helvetica","bold");
        doc.text("Alamat:", X, 28, { align:"right" });

        doc.setFont("helvetica","normal");
        doc.text("Jl. Mr. Asa'ad, Kelurahan Balai-balai", X, 34, { align:"right" });
        doc.text("(Pasar Kuliner Padang Panjang)", X, 40, { align:"right" });

        doc.setFont("helvetica","bold");
        doc.text("Tanggal Cetak:", X, 48, { align:"right" });

        doc.setFont("helvetica","normal");
        doc.text(new Date().toLocaleString("id-ID"), X, 54, { align:"right" });

        doc.setFont("helvetica","bold");
        doc.text("Telp: 0812 966 68670", X, 62, { align:"right" });

        /* ==== Table ==== */

        const toppingTxt = order.topping?.length ? order.topping.join(", ") : "-";
        const taburanTxt = order.taburan?.length ? order.taburan.join(", ") : "-";

        const rows = [
          ["Jenis", order.jenis],
          ["Isi Box", order.isi + " pcs"],
          ["Mode", order.mode],
          ["Topping", toppingTxt],
          ["Taburan", taburanTxt],
          ["Jumlah Box", order.jumlahBox + " box"],
          ["Harga Satuan", formatRp(order.pricePerBox)],
          ["Subtotal", formatRp(order.subtotal)],
          ["Diskon", order.discount > 0 ? "-" + formatRp(order.discount) : "-"],
          ["Total Bayar", formatRp(order.total)],
        ];

        if (typeof doc.autoTable === "function") {
          doc.autoTable({
            startY: y,
            head: [["Item", "Keterangan"]],
            body: rows,
            theme: "grid",
            headStyles: { fillColor:[255,105,180], textColor:255 },
            alternateRowStyles: { fillColor:[230,240,255] },
            styles: { fontSize:10, textColor:[0,0,0] },
            columnStyles: {
              0:{ cellWidth:45 },
              1:{ cellWidth:W - 45 - 28 },
            }
          });
        }

        const endTableY = doc.lastAutoTable?.finalY || y+40;

        /* ==== QRIS ==== */
        if (qrisData) {
          doc.addImage(qrisData,"JPEG", 14, endTableY+8, 40,50);
          doc.setFontSize(9);
          doc.text("Scan QRIS untuk pembayaran", 14, endTableY+62);
        }

        /* ==== TTD ==== */
        const ttdX = W - 14 - 50;
        const ttdY = endTableY + 10;

        doc.setFontSize(10);
        doc.text("Hormat Kami,", ttdX, ttdY);

        if (ttdData) {
          doc.addImage(ttdData,"PNG", ttdX, ttdY+4, 40,30);
        }

        doc.text("Pukis Lumer Aulia", ttdX, ttdY+40);

        /* ==== Terimakasih ==== */
        doc.setFont("helvetica","bold");
        doc.setFontSize(13);
        doc.text("Terimakasih telah berbelanja di toko Kami", W/2, H-25, { align:"center" });

        /* ==== Footer Sosmed ==== */
        doc.setFont("helvetica","normal");
        doc.setFontSize(9);

        doc.text("FB     : PUKIS LUMER AULIA", W/2, H-18, { align:"center" });
        doc.text("IG     : pukis.lumer_aulia", W/2, H-14, { align:"center" });
        doc.text("Tiktok : pukislumer.aulia", W/2, H-10, { align:"center" });
        doc.text("Twitter: pukislumer_", W/2, H-6, { align:"center" });

        /* ==== Save ==== */
        const filename = `Invoice_${(order.nama||"Pelanggan").replace(/\s+/g,"_")}_${order.orderID}.pdf`;
        doc.save(filename);

        return true;
      } catch (err) {
        alert("Gagal membuat PDF: " + err.message);
        console.error(err);
        return false;
      }
    };
  }

  window.makeGeneratePdf = makeGeneratePdf;
})();
