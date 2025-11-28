/* ============================================================
   order.js — Versi Gabungan Final (Robust, Tanpa Duplikat)
   Menggabungkan:
   - perbaikan ulang order.js (tabel lengkap, watermark, header, footer)
   - order.js kurang tabel (loader jsPDF + polling + fallback)
   ============================================================ */

(function () {
  "use strict";

  // ---------- logging kecil ----------
  function log(...args){ console.log("[order.js]", ...args); }
  function warn(...args){ console.warn("[order.js]", ...args); }
  function err(...args){ console.error("[order.js]", ...args); }

  // ---------- tunggu jsPDF hingga timeout ----------
  function waitForJsPdf(timeoutMs = 7000, intervalMs = 200) {
    return new Promise((resolve) => {
      const started = Date.now();
      log("Menunggu jsPDF tersedia (timeout " + timeoutMs + "ms) ...");
      const id = setInterval(() => {
        // coba beberapa lokasi kemungkinan jsPDF
        const found = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || window.jspdf || null;
        if (found) {
          clearInterval(id);
          log("Detected jsPDF object:", found);
          resolve({ ok: true, obj: found, elapsed: Date.now() - started });
        } else if (Date.now() - started > timeoutMs) {
          clearInterval(id);
          warn("Timeout menunggu jsPDF (elapsed " + (Date.now() - started) + "ms).");
          resolve({ ok: false, obj: null, elapsed: Date.now() - started });
        }
      }, intervalMs);
    });
  }

  // ---------- util: detect autoTable ----------
  function docHasAutoTable(jsPDFCtor) {
    try {
      // buat doc percobaan dan cek
      let DocCtor = jsPDFCtor;
      if (jsPDFCtor && typeof jsPDFCtor === "object" && jsPDFCtor.jsPDF) DocCtor = jsPDFCtor.jsPDF;
      if (typeof DocCtor !== "function") return false;
      const docTry = new DocCtor({ unit: "mm", format: "a4" });
      return typeof docTry.autoTable === "function";
    } catch (e) {
      return false;
    }
  }

  // ---------- util: format rupiah ----------
  function formatRp(n) {
    return "Rp " + Number(n || 0).toLocaleString("id-ID");
  }

  // ---------- util: load image safely ----------
  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // ---------- buat fungsi generator PDF (mengembalikan fungsi) ----------
  function makeGeneratePdf(jsPDFCtor) {
    return async function generatePdf(order) {
      try {
        // validasi minimal data order
        order = order || {};
        // normalize beberapa field agar tidak crash
        order.jenis = order.jenis || "-";
        order.isi = (order.isi !== undefined && order.isi !== null) ? order.isi : "-";
        order.mode = order.mode || "-";
        order.topping = Array.isArray(order.topping) ? order.topping : (order.topping ? [order.topping] : []);
        order.taburan = Array.isArray(order.taburan) ? order.taburan : (order.taburan ? [order.taburan] : []);
        order.jumlahBox = order.jumlahBox || 0;
        order.pricePerBox = order.pricePerBox || 0;
        order.subtotal = order.subtotal || 0;
        order.discount = order.discount || 0;
        order.total = order.total || 0;
        order.note = order.note || "-";
        order.nama = order.nama || "Pelanggan";
        order.orderID = order.orderID || (order.id || String(Date.now()));
        order.tgl = order.tgl || new Date().toLocaleString("id-ID");
        order.queueNo = order.queueNo || "-";
        order.wa = order.wa || "-";

        // pilih konstruktor doc
        let DocCtor = jsPDFCtor;
        if (jsPDFCtor && typeof jsPDFCtor === "object" && jsPDFCtor.jsPDF) DocCtor = jsPDFCtor.jsPDF;
        if (typeof DocCtor !== "function") {
          // fallback: if jsPDF is a constructor directly at window.jsPDF
          DocCtor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
          if (typeof DocCtor !== "function") throw new Error("Konstruktor jsPDF tidak ditemukan.");
        }

        // muat gambar (non-blocking tapi kita await agar tampil apabila tersedia)
        const [logoImg, ttdImg, qrisImg] = await Promise.all([
          loadImage("/assets/images/logo.png"),
          loadImage("/assets/images/ttd.png"),
          loadImage("/assets/images/qris-pukis.jpg"),
        ]);

        // Instansiasi dokumen (unit mm cocok)
        const doc = new DocCtor({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        // WATERMARK
        doc.setTextColor(220, 220, 220);
        doc.setFontSize(48);
        // angle not available on older builds; safe call with try/catch
        try {
          doc.text("PUKIS LUMER AULIA", pageW / 2, pageH / 2, { align: "center", angle: 45 });
        } catch (e) {
          // fallback: centered without angle
          doc.text("PUKIS LUMER AULIA", pageW / 2, pageH / 2, { align: "center" });
        }
        doc.setTextColor(0, 0, 0);

        // HEADER
        doc.setFontSize(14);
        try { doc.setFont("helvetica", "bold"); } catch (e) { /* ignore if not supported */ }
        doc.text("INVOICE", 14, 16);

        doc.setFontSize(20);
        doc.setTextColor(214, 51, 108);
        doc.text("PUKIS LUMER AULIA", pageW / 2, 22, { align: "center" });
        doc.setTextColor(0, 0, 0);

        if (logoImg) {
          try { doc.addImage(logoImg, "PNG", pageW - 55, 6, 40, 20); } catch(e){ /* ignore addImage errors */ }
        }

        doc.setFontSize(9);
        doc.text("Pasar Kuliner Padang Panjang", pageW - 10, 28, { align: "right" });
        doc.text("0812-9666-8670", pageW - 10, 32, { align: "right" });
        doc.line(10, 36, pageW - 10, 36);

        // META DATA
        let y = 44;
        doc.setFontSize(10);
        doc.text("Order ID: " + order.orderID, 14, y);
        doc.text("Tanggal: " + order.tgl, pageW - 14, y, { align: "right" });
        y += 7;
        doc.text("No. Antrian: " + order.queueNo, 14, y);
        doc.text("Invoice by: Pukis Lumer Aulia", pageW - 14, y, { align: "right" });
        y += 8;

        // CUSTOMER DATA
        doc.text("Nama: " + order.nama, 14, y);
        doc.text("WA: " + order.wa, pageW - 14, y, { align: "right" });
        y += 7;

        doc.text("Jenis: " + order.jenis + " — " + order.isi + " pcs", 14, y); y += 7;
        doc.text("Mode: " + order.mode, 14, y); y += 7;

        if (order.mode === "single") {
          doc.text("Topping: " + (order.topping.length ? order.topping.join(", ") : "-"), 14, y);
          y += 7;
        }
        if (order.mode === "double") {
          doc.text("Topping: " + (order.topping.length ? order.topping.join(", ") : "-"), 14, y); y += 7;
          doc.text("Taburan: " + (order.taburan.length ? order.taburan.join(", ") : "-"), 14, y); y += 7;
        }

        if (order.note && order.note !== "-") {
          doc.text("Catatan:", 14, y);
          y += 6;
          const wrap = doc.splitTextToSize(order.note, pageW - 28);
          doc.text(wrap, 14, y);
          y += wrap.length * 6 + 4;
        }

        // TABEL DETAIL ORDER (sesuai dokumen Anda)
        const tableRows = [
          ["Jenis", order.jenis],
          ["Isi Box", order.isi + " pcs"],
          ["Mode", order.mode],
          ["Topping", (order.topping && order.topping.length) ? order.topping.join(", ") : "-"],
          ["Taburan", (order.taburan && order.taburan.length) ? order.taburan.join(", ") : "-"],
          ["Jumlah Box", (order.jumlahBox || 0) + " Box"],
          ["Harga per Box", formatRp(order.pricePerBox)],
          ["Subtotal", formatRp(order.subtotal)],
          ["Diskon", (order.discount && order.discount > 0) ? "- " + formatRp(order.discount) : "-"],
          ["Total Bayar", formatRp(order.total)],
          ["Catatan", order.note || "-"]
        ];

        // pakai autoTable kalau ada
        const autotableAvailable = typeof doc.autoTable === "function";
        if (autotableAvailable) {
          doc.autoTable({
            startY: y,
            head: [["Item", "Keterangan"]],
            body: tableRows,
            theme: "striped",
            headStyles: { fillColor: [214, 51, 108], textColor: 255 },
            styles: { fontSize: 10 }
          });
        } else {
          // fallback manual: dua kolom
          let ty = y;
          doc.setFontSize(10);
          tableRows.forEach(function (r) {
            doc.text(String(r[0]), 20, ty);
            // split keterangan jika terlalu panjang
            const wrapped = doc.splitTextToSize(String(r[1]), pageW - 140);
            // tulis di kolom kanan (shift X)
            doc.text(wrapped, 120, ty);
            ty += Math.max(12, wrapped.length * 6);
          });
        }

        const lastY = autotableAvailable ? (doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + 100) : y + tableRows.length * 12;

        // FOOTER — QRIS + TTD + THANKS
        let fy = lastY + 4;
        if (qrisImg) {
          doc.setFontSize(10);
          doc.text("QRIS Pembayaran:", 14, fy);
          try { doc.addImage(qrisImg, "PNG", 14, fy + 4, 36, 36); } catch (e) {}
        }
        if (ttdImg) {
          try { doc.addImage(ttdImg, "PNG", pageW - 60, fy + 4, 46, 22); } catch (e) {}
        }
        doc.setFontSize(10);
        doc.text("Hormat Kami,", pageW - 60, fy + 30);
        doc.setFontSize(11);
        doc.text("Terimakasih sudah Belanja di toko Kami 🙏", pageW / 2, fy + 60, { align: "center" });

        // SIMPAN FILE
        const filename = "Invoice_" + (order.nama || "Pelanggan").replace(/\s+/g, "_") + "_" + order.orderID + ".pdf";
        try {
          doc.save(filename);
          log("generatePdf: berhasil menyimpan ->", filename);
        } catch (e) {
          err("Gagal menyimpan PDF:", e);
          throw e;
        }

        return true;
      } catch (e) {
        err("generatePdf error:", e);
        alert("Gagal membuat PDF: " + (e && e.message ? e.message : e));
        return false;
      }
    };
  }

  // ---------- inisialisasi: tunggu jsPDF, attach generatePdf ----------
  (async function init() {
    const res = await waitForJsPdf(7000, 200);
    if (!res.ok) {
      warn("jsPDF tidak tersedia setelah timeout.");
      // coba cek quick HEAD ke asset (tidak wajib)
      try {
        const u1 = "/assets/js/lib/jspdf.umd.min.js";
        const u2 = "/assets/js/lib/jspdf.plugin.autotable.min.js";
        // fetch head (non-blocking)
        fetch(u1, { method: "HEAD" }).then(r => log("HEAD", u1, r.status)).catch(e => warn("HEAD err", e));
        fetch(u2, { method: "HEAD" }).then(r => log("HEAD", u2, r.status)).catch(e => warn("HEAD err", e));
      } catch (e) { warn("Check HEAD failed:", e); }
      alert("PDF gagal. jsPDF tidak terdeteksi. Cek console untuk detail.");
      return;
    }

    // attach generatePdf ke window dengan konstruktor/bentuk yang terdeteksi
    window.generatePdf = makeGeneratePdf(res.obj);
    log("generatePdf attached. autoTable?", docHasAutoTable(res.obj));
    log("init selesai. Anda dapat menekan tombol Cetak / PDF sekarang.");
  })();

  // ---------- safe attach untuk tombol cetak (jika ada) ----------
  function safeAttachPrintButton() {
    const btn = document.getElementById("notaPrint");
    if (!btn) return;
    btn.addEventListener("click", async function () {
      let order = null;
      try { order = JSON.parse(localStorage.getItem("lastOrder") || "null"); } catch (e) { order = null; }
      if (!order) {
        if (typeof window.getOrderFormData === "function") {
          try { order = window.getOrderFormData(); } catch (e) { order = null; }
        }
      }
      if (!order) {
        alert("Tidak ada data order. Buat nota terlebih dahulu.");
        return;
      }
      if (typeof window.generatePdf !== "function") {
        alert("generatePdf belum siap. Coba lagi sebentar lalu tekan Cetak lagi.");
        console.log("[order.js] generatePdf belum siap; order:", order);
        return;
      }
      try {
        await window.generatePdf(order);
      } catch (e) {
        err("Error saat generatePdf:", e);
        alert("Gagal membuat PDF (lihat console).");
      }
    }, { passive: false });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeAttachPrintButton);
  } else {
    safeAttachPrintButton();
  }

  log("order.js loaded (gabungan). Menunggu jsPDF...");
})();
