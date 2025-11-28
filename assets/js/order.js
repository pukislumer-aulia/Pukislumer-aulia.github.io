/* order.js — robust loader & generatePdf with polling for jsPDF
   Versi: tolerant, debug-friendly, no top-level await
   Bahasa: komentar singkat (ID) */

(function () {
  "use strict";

  // ---------- helper kecil ----------
  function log(...args){ console.log("[order.js]", ...args); }
  function warn(...args){ console.warn("[order.js]", ...args); }
  function err(...args){ console.error("[order.js]", ...args); }

  // ---------- tunggu jsPDF hingga timeout ----------
  function waitForJsPdf(timeoutMs = 7000, intervalMs = 200){
    return new Promise((resolve) => {
      const started = Date.now();
      log("Menunggu jsPDF tersedia (timeout " + timeoutMs + "ms) ...");
      const id = setInterval(() => {
        // coba beberapa lokasi kemungkinan jsPDF
        const found = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || window.jspdf || null;
        if(found){
          clearInterval(id);
          log("Detected jsPDF object:", found);
          resolve({ ok: true, obj: found, elapsed: Date.now()-started });
        } else if(Date.now() - started > timeoutMs){
          clearInterval(id);
          warn("Timeout menunggu jsPDF (elapsed " + (Date.now()-started) + "ms).");
          resolve({ ok: false, obj: null, elapsed: Date.now()-started });
        }
      }, intervalMs);
    });
  }

  // ---------- fungsi deteksi autoTable ----------
  function hasAutoTable(){
    try{
      // beberapa plugin menempelkan autoTable ke prototype atau ke doc instance
      const docTry = (window.jspdf && window.jspdf.jsPDF) ? new window.jspdf.jsPDF() : (window.jsPDF ? new window.jsPDF() : null);
      if(!docTry) return false;
      const ok = typeof docTry.autoTable === "function";
      // cleanup: tidak perlu destroy docTry, GC akan ambil
      return ok;
    }catch(e){
      return false;
    }
  }

  // ---------- createPdf (dipakai setelah jsPDF tersedia) ----------
  function makeGeneratePdf(jsPDFCtor){
    return function generatePdf(data){
      try{
        // Instansiasi konstruktor yang ditemukan; beberapa build punya bentuk berbeda
        let DocCtor = jsPDFCtor;
        // jika jsPDFCtor adalah object (UMD memberikan { jsPDF: f }), ambil .jsPDF
        if(jsPDFCtor && typeof jsPDFCtor === "object" && jsPDFCtor.jsPDF) DocCtor = jsPDFCtor.jsPDF;
        // jika masih function (konstruktor) gunakan itu
        const doc = new DocCtor({ unit: "px", format: "a4", compress: true });

        // Header sederhana
        doc.setFontSize(18);
        doc.text("INVOICE — Pukis Lumer Aulia", 20, 30);
        doc.setFontSize(11);
        doc.text(`Order ID: ${data.id || (data.orderID||"UNKNOWN")}`, 20, 55);
        doc.text(`Tanggal: ${data.tgl || new Date().toLocaleString("id-ID")}`, 20, 70);

        // Customer
        doc.setFontSize(12);
        doc.text(`Nama: ${data.nama || "-"}`, 20, 95);
        doc.text(`WA: ${data.wa || "-"}`, 20, 110);

        // Table rows
        const rows = [
          ["Jenis", data.jenis || "-"],
          ["Isi per Box", (data.isi || "-") + " pcs"],
          ["Mode Topping", data.mode || "-"],
          ["Topping", (data.topping && data.topping.length) ? data.topping.join(", ") : "-"],
          ["Taburan", (data.taburan && data.taburan.length) ? data.taburan.join(", ") : "-"],
          ["Jumlah Box", String(data.jumlahBox || "-")],
          ["Harga/Box", "Rp " + ((data.pricePerBox||0)).toLocaleString("id-ID")],
          ["Subtotal", "Rp " + ((data.subtotal||0)).toLocaleString("id-ID")],
          ["Diskon", data.discount?("- Rp " + data.discount.toLocaleString("id-ID")) : "-"],
          ["Total", "Rp " + ((data.total||0)).toLocaleString("id-ID")],
          ["Catatan", data.note || "-"]
        ];

        if(typeof doc.autoTable === "function"){
          doc.autoTable({
            startY: 140,
            head: [["Item","Keterangan"]],
            body: rows,
            theme: "grid",
            headStyles: { fillColor:[214,51,108], textColor:255 },
            styles: { fontSize: 10 }
          });
        } else {
          // fallback: tampilkan baris secara manual
          let y = 140;
          doc.setFontSize(10);
          rows.forEach(r => {
            doc.text(String(r[0]), 20, y);
            doc.text(String(r[1]), 120, y);
            y += 12;
          });
        }

        // Footer & save
        const filename = `Nota_${(data.nama||"pelanggan").replace(/\s+/g,"_")}_${(data.id||Date.now())}.pdf`;
        doc.save(filename);
        log("generatePdf: sukses, file disimpan ->", filename);
        return true;
      }catch(e){
        err("generatePdf error:", e);
        alert("Gagal membuat PDF (lihat console).");
        return false;
      }
    };
  }

  // ---------- inisialisasi: tunggu jsPDF, attach generatePdf ----------
  (async function init(){
    const res = await waitForJsPdf(7000, 200);
    if(!res.ok){
      // jika tidak ketemu, laporkan status resource yang mungkin relevan
      warn("jsPDF tidak tersedia setelah timeout.");
      // tampilkan apakah file dapat diakses via fetch (cek cepat)
      try{
        const u1 = "/assets/js/lib/jspdf.umd.min.js";
        const u2 = "/assets/js/lib/jspdf.plugin.autotable.min.js";
        const r1 = await fetch(u1, { method:"HEAD" });
        const r2 = await fetch(u2, { method:"HEAD" });
        log("HEAD:", u1, r1.status, "|", u2, r2.status);
      }catch(e){ warn("Fetch HEAD check gagal:", e); }
      alert("PDF gagal. jsPDF tidak terdeteksi. Cek console untuk detail.");
      return;
    }

    // attach generatePdf ke window dengan konstruktor/bentuk yang terdeteksi
    window.generatePdf = makeGeneratePdf(res.obj);
    log("generatePdf attached. autoTable?", typeof ( (res.obj && res.obj.jsPDF) ? res.obj.jsPDF.prototype.autoTable : (res.obj && res.obj.prototype ? res.obj.prototype.autoTable : null) ) );
    log("init selesai. Anda dapat menekan tombol Cetak / PDF sekarang.");
  })();

  // ---------- menyediakan fallback handler untuk tombol notaPrint jika script lain memanggil langsung ----------
  // jika tombol notaPrint sudah ada saat load, jangan menimpa listener lain — kita hanya memastikan tombol memanggil window.generatePdf bila ada
  function safeAttachPrintButton(){
    const btn = document.getElementById("notaPrint");
    if(!btn) return;
    btn.addEventListener("click", async function(){
      // ambil order data dari localStorage/DOM - hukum aplikasimu (cari lastOrder atau getOrderFormData)
      let order = null;
      try{ order = JSON.parse(localStorage.getItem("lastOrder")||"null"); }catch(e){ order = null; }
      if(!order){
        // fallback: coba panggil fungsi global getOrderFormData jika ada
        if(typeof window.getOrderFormData === "function"){ try{ order = window.getOrderFormData(); }catch(e){ order = null; } }
      }
      if(!order){
        alert("Tidak ada data order. Buat nota terlebih dahulu.");
        return;
      }
      if(typeof window.generatePdf !== "function"){
        alert("generatePdf belum siap. Coba lagi sebentar lalu tekan Cetak lagi.");
        console.log("[order.js] generatePdf belum siap; order:", order);
        return;
      }
      try{
        await window.generatePdf(order);
      }catch(e){
        console.error("[order.js] error saat generatePdf:", e);
        alert("Gagal membuat PDF (lihat console).");
      }
    }, {passive:false});
  }

  // jalankan safe attach saat DOM siap
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", safeAttachPrintButton);
  } else {
    safeAttachPrintButton();
  }

  // debug startup
  log("order.js loaded (robust). Menunggu jsPDF...");
})();
