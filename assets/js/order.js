// ===============================
// ORDER SYSTEM — PUKIS LUMER AULIA
// Final version with robust PDF generation and image fallback
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const formatRp = (n) => "Rp" + Number(n).toLocaleString("id-ID");

  console.info("[order.js] Loaded at", new Date().toISOString());

  const BASE_PRICE = {
    Original: {
      "5": { non: 10000, single: 13000, double: 15000 },
      "10": { non: 18000, single: 25000, double: 28000 },
    },
    Pandan: {
      "5": { non: 13000, single: 15000, double: 18000 },
      "10": { non: 25000, single: 28000, double: 32000 },
    },
  };

  const ADMIN_WA = "6281296668670";

  // ELEMENTS
  const ultraNama = $("#ultraNama");
  const ultraWA = $("#ultraWA");
  const ultraIsi = $("#ultraIsi");
  const ultraJumlah = $("#ultraJumlah");
  const ultraPricePerBox = $("#ultraPricePerBox");
  const ultraSubtotal = $("#ultraSubtotal");
  const ultraDiscount = $("#ultraDiscount");
  const ultraGrandTotal = $("#ultraGrandTotal");
  const ultraSingleGroup = $("#ultraSingleGroup");
  const ultraDoubleGroup = $("#ultraDoubleGroup");
  const formUltra = $("#formUltra");
  const notaContainer = $("#notaContainer");
  const notaContent = $("#notaContent");
  const notaClose = $("#notaClose");
  const notaPrint = $("#notaPrint");
  const notaSendAdmin = $("#ultraSendAdmin");
  const ultraNote = $("#ultraNote"); // optional

  let dataPesanan = {};

  function getSelectedRadioValue(name) {
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }

  function getCheckedValues(selector) {
    return [...$$(selector)]
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
  }

  // helper: wait for a condition (polling)
  function waitFor(conditionFn, timeout = 3000, interval = 50) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function poll() {
        try {
          if (conditionFn()) return resolve(true);
        } catch (e) {
          // ignore
        }
        if (Date.now() - start > timeout) return reject(new Error("waitFor timeout"));
        setTimeout(poll, interval);
      })();
    });
  }

  function updateToppingDisplay() {
    const mode = getSelectedRadioValue("ultraToppingMode");

    if (ultraSingleGroup) ultraSingleGroup.style.display = mode === "single" ? "block" : "none";
    if (ultraDoubleGroup) ultraDoubleGroup.style.display = mode === "double" ? "block" : "none";

    if (mode === "non") {
      $$(".ultraTopping, .ultraTaburan").forEach((x) => (x.checked = false));
    }

    calculatePrice();
  }

  // attach topping mode listeners safely
  const toppingModeRadios = $$('input[name="ultraToppingMode"]') || [];
  toppingModeRadios.forEach((r) => r.addEventListener("change", updateToppingDisplay));

  // initial display
  try { updateToppingDisplay(); } catch (err) { console.warn("updateToppingDisplay failed:", err); }

  function toppingLimitEvent(e) {
    try {
      const mode = getSelectedRadioValue("ultraToppingMode");
      const t = getCheckedValues(".ultraTopping");
      const tb = getCheckedValues(".ultraTaburan");

      if (mode === "single" && t.length > 5) {
        e.target.checked = false;
        alert("Maksimal 5 topping!");
        return;
      }

      if (mode === "double") {
        if (e.target.classList.contains("ultraTopping") && t.length > 5) {
          e.target.checked = false;
          alert("Maksimal 5 topping!");
          return;
        }
        if (e.target.classList.contains("ultraTaburan") && tb.length > 5) {
          e.target.checked = false;
          alert("Maksimal 5 taburan!");
          return;
        }
      }

      calculatePrice();
    } catch (err) {
      console.error("toppingLimitEvent error", err);
    }
  }

  const toppingCheckboxes = $$('.ultraTopping, .ultraTaburan') || [];
  toppingCheckboxes.forEach((cb) => cb.addEventListener("change", toppingLimitEvent));

  function calculatePrice() {
    try {
      const jenis = getSelectedRadioValue("ultraJenis") || "Original";
      const isi = ultraIsi ? ultraIsi.value : "5";
      const mode = getSelectedRadioValue("ultraToppingMode") || "non";
      const jumlahBox = ultraJumlah ? (parseInt(ultraJumlah.value, 10) || 1) : 1;

      const pricePerBox = (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) ? BASE_PRICE[jenis][isi][mode] : 0;
      const subtotal = pricePerBox * jumlahBox;
      const discount = 0;
      const total = subtotal - discount;

      if (ultraPricePerBox) ultraPricePerBox.textContent = formatRp(pricePerBox);
      if (ultraSubtotal) ultraSubtotal.textContent = formatRp(subtotal);
      if (ultraDiscount) ultraDiscount.textContent = "-";
      if (ultraGrandTotal) ultraGrandTotal.textContent = formatRp(total);

      dataPesanan = {
        nama: ultraNama ? (ultraNama.value || "-") : "-",
        wa: ultraWA ? (ultraWA.value || "-") : "-",
        jenis,
        isi,
        mode,
        topping: getCheckedValues(".ultraTopping"),
        taburan: mode === "double" ? getCheckedValues(".ultraTaburan") : [],
        jumlahBox,
        pricePerBox,
        subtotal,
        discount,
        total,
        note: ultraNote ? (ultraNote.value || "-") : "-",
      };
      // debug snapshot
      // console.debug("calculatePrice -> dataPesanan", dataPesanan);
    } catch (err) {
      console.error("calculatePrice error", err);
    }
  }

  if (ultraIsi) ultraIsi.addEventListener("change", calculatePrice);
  if (ultraJumlah) ultraJumlah.addEventListener("input", calculatePrice);
  const jenisRadios = $$('input[name="ultraJenis"]') || [];
  jenisRadios.forEach((r) => r.addEventListener("change", calculatePrice));

  calculatePrice();

  formUltra.addEventListener("submit", (e) => {
    e.preventDefault();
    calculatePrice();
    renderNota();
    if (notaContainer) notaContainer.style.display = "flex";
  });

  if (notaClose) notaClose.addEventListener("click", () => {
    notaContainer.style.display = "none";
  });

  function renderNota() {
    try {
      const d = dataPesanan;
      let text = `
        <p><strong>Nama:</strong> ${d.nama}</p>
        <p><strong>WA:</strong> ${d.wa}</p>
        <p><strong>Jenis:</strong> ${d.jenis}</p>
        <p><strong>Isi:</strong> ${d.isi} pcs</p>`;

      if (d.mode === "single")
        text += `<p><strong>Topping:</strong> ${d.topping.join(", ") || "-"}</p>`;

      if (d.mode === "double")
        text += `<p><strong>Topping:</strong> ${d.topping.join(", ") || "-"}</p>
                <p><strong>Taburan:</strong> ${d.taburan.join(", ") || "-"}</p>`;

      text += `<p><strong>Jumlah Box:</strong> ${d.jumlahBox}</p>
               <p><strong>Catatan:</strong> ${d.note}</p>`;

      if (notaContent) notaContent.innerHTML = text;
    } catch (err) {
      console.error("renderNota error", err);
    }
  }

  notaSendAdmin.addEventListener("click", () => {
    calculatePrice();
    const d = dataPesanan;

    let msg =
      `Halo Admin, saya ingin memesan Pukis:\n` +
      `Nama: ${d.nama}\n` +
      `Jenis: ${d.jenis}\n` +
      `Isi: ${d.isi} pcs\n` +
      (d.mode === "single" ? `Topping: ${d.topping.join(", ") || "-"}\n` : "") +
      (d.mode === "double"
        ? `Topping: ${d.topping.join(", ") || "-"}\nTaburan: ${d.taburan.join(", ") || "-"}\n`
        : "") +
      `Jumlah: ${d.jumlahBox} Box\n` +
      `Total: ${formatRp(d.total)}\n` +
      `Catatan: ${d.note}\n\n` +
      `Terimakasih 🙏`;

    console.log("[order.js] Opening WA with message:", msg);
    window.open(
      `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  });

  notaPrint.addEventListener("click", async () => {
    console.log("[order.js] Cetak PDF button clicked - start generatePdf");
    try {
      calculatePrice();
      // ensure jsPDF and autotable are available
      await waitFor(() => window.jspdf && typeof window.jspdf === "object", 3000).catch(() => {});
      if (!window.jspdf) {
        console.error("jsPDF not loaded");
        alert("PDF gagal dibuat: jsPDF belum ter-load. Pastikan urutan script di HTML.");
        return;
      }
      // wait for autoTable plugin to attach (try-catch safe)
      await waitFor(() => {
        try {
          const { jsPDF } = window.jspdf;
          const pdfTest = new jsPDF();
          return !!pdfTest.autoTable;
        } catch (e) {
          return false;
        }
      }, 3000).catch(() => {});

      // call the generator
      await generatePdf(dataPesanan);
    } catch (err) {
      console.error("notaPrint handler error:", err);
      alert("PDF gagal dibuat: " + (err && err.message ? err.message : err));
    }
  });

  // end DOMContentLoaded
});

// =======================
// PDF GENERATOR (Robust, with logging & fallbacks)
// =======================
async function generatePdf(data) {
  console.log("[generatePdf] start", data);
  // small sleep to reduce potential race conditions
  await new Promise((r) => setTimeout(r, 30));

  // ensure jspdf is present
  if (!window.jspdf) {
    const errMsg = "jsPDF tidak tersedia (window.jspdf undefined)";
    console.error("[generatePdf]", errMsg);
    throw new Error(errMsg);
  }

  const { jsPDF } = window.jspdf;
  // try to construct pdf to detect plugin
  let pdf;
  try {
    pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  } catch (err) {
    console.error("[generatePdf] jsPDF constructor failed:", err);
    throw err;
  }

  const formatRp = (n) => "Rp" + Number(n).toLocaleString("id-ID");

  // safe image loader (returns Image object or null)
  const loadImage = (src) =>
    new Promise((resolve) => {
      try {
        const img = new Image();
        // try anonymous crossOrigin (GitHub Pages should be same origin, but keep it)
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            console.log("[generatePdf] image loaded:", src, img.naturalWidth + "x" + img.naturalHeight);
          } catch (e) {}
          resolve(img);
        };
        img.onerror = (e) => {
          console.warn("[generatePdf] image failed to load:", src, e);
          resolve(null);
        };
        img.src = src;
      } catch (e) {
        console.warn("[generatePdf] loadImage error:", e);
        resolve(null);
      }
    });

  // load assets in parallel (relative paths as in your project)
  const [logo, ttd, qris] = await Promise.all([
    loadImage("assets/images/logo.png"),
    loadImage("assets/images/ttd.png"),
    loadImage("assets/images/qris-pukis.jpg"),
  ]);

  console.log("[generatePdf] assets loaded ->", {
    logo: !!logo,
    ttd: !!ttd,
    qris: !!qris,
  });

  try {
    // Prepare data (defensive)
    const {
      nama = "-",
      wa = "-",
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
    } = data || {};

    // HEADER
    try {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("INVOICE", 10, 12);
    } catch (e) {
      // some environments may have limited font support
      console.warn("[generatePdf] header font/text warn:", e);
      pdf.text("INVOICE", 10, 12);
    }

    // TITLE USING CUSTOM PACIFICO FONT (attempt, but safe fallback)
    try {
      pdf.setFont("Pacifico-Regular", "normal"); // attempt custom font if loaded in page
      pdf.setFontSize(30);
      pdf.setTextColor(214, 51, 108);
      pdf.text("PUKIS LUMER AULIA", 105, 15, { align: "center" });
    } catch (e) {
      // fallback to helvetica bold center
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(214, 51, 108);
      pdf.text("PUKIS LUMER AULIA", 105, 15, { align: "center" });
    }

    // RESET FONT & COLOR
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    // add logo if available (safe try/catch)
    if (logo) {
      try {
        // If logo is an HTMLImageElement, we can pass it directly to addImage in newer jsPDF builds
        pdf.addImage(logo, "PNG", 155, 5, 40, 20);
      } catch (e) {
        // fallback: convert to dataURL using canvas
        try {
          const c = document.createElement("canvas");
          c.width = logo.naturalWidth;
          c.height = logo.naturalHeight;
          const ctx = c.getContext("2d");
          ctx.drawImage(logo, 0, 0);
          const dataUrl = c.toDataURL("image/png");
          pdf.addImage(dataUrl, "PNG", 155, 5, 40, 20);
        } catch (e2) {
          console.warn("[generatePdf] failed to add logo image to PDF", e2);
        }
      }
    } else {
      console.warn("[generatePdf] logo not available");
    }

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Pasar Kuliner Padang Panjang", 155, 27);
    pdf.text("Telp: 0812-9666-8670", 155, 31);

    pdf.line(10, 35, 200, 35);

    // customer info
    let y = 43;
    const now = new Date();
    const tgl = now.toLocaleDateString("id-ID");
    const invoiceNum = "INV-" + now.getFullYear().toString() + (now.getMonth()+1).toString().padStart(2,"0") + now.getDate().toString().padStart(2,"0") + "-" + now.getHours().toString().padStart(2,"0") + now.getMinutes().toString().padStart(2,"0") + now.getSeconds().toString().padStart(2,"0");

    pdf.setFontSize(11);
    pdf.text("Kepada : " + nama, 10, y);
    pdf.text("Tanggal : " + tgl, 150, y);
    pdf.text("No. Invoice : " + invoiceNum, 150, y + 6);

    // watermark (light)
    pdf.setTextColor(235);
    pdf.setFontSize(36);
    try {
      pdf.text("PUKIS LUMER AULIA", 105, 160, { align: "center", angle: 32 });
    } catch (e) {
      // some environments don't support angle -> fallback center text
      try { pdf.text("PUKIS LUMER AULIA", 105, 160, { align: "center" }); } catch (e2) {}
    }
    pdf.setTextColor(0);

    // catatan
    y += 18;
    pdf.setFontSize(11);
    pdf.text("Catatan :", 10, y);
    // allow multi-line note by splitting on lines
    const noteLines = (note || "-").toString().split(/\r?\n/);
    noteLines.forEach((ln, idx) => {
      pdf.text(ln, 10, y + 6 + idx * 6);
    });

    // table start Y
    let startTableY = y + 14 + (noteLines.length - 1) * 6;

    // ensure autoTable is available on pdf instance
    if (!pdf.autoTable) {
      console.warn("[generatePdf] pdf.autoTable not found. autoTable features may not be available.");
    }

    // build table body (single line representing order)
    const keterangan = `${jenis} — ` + (
      mode === "single" ? (topping.join(", ") || "Non Topping") :
      mode === "double" ? ((topping.join(", ") || "-") + " + " + (taburan.join(", ") || "-")) :
      "Non Topping"
    ) + ` (${isi} pcs)`;

    // Use autoTable safely inside try/catch
    try {
      if (pdf.autoTable) {
        pdf.autoTable({
          startY: startTableY,
          head: [["Keterangan", "Harga", "Jumlah", "Total"]],
          body: [
            [
              keterangan,
              formatRp(pricePerBox),
              jumlahBox + " Box",
              formatRp(total),
            ],
          ],
          theme: "grid",
          headStyles: { fillColor: [214, 51, 108], textColor: 255 },
          styles: { fontSize: 10 },
        });
      } else {
        throw new Error("autoTable not present");
      }
    } catch (errAuto) {
      console.error("[generatePdf] autoTable error or missing:", errAuto);
      // As a fallback, print a simple text table
      let fy = startTableY;
      pdf.setFontSize(10);
      pdf.text("Keterangan", 10, fy); pdf.text("Harga", 100, fy); pdf.text("Jumlah", 140, fy); pdf.text("Total", 170, fy);
      fy += 6;
      pdf.text(keterangan, 10, fy); pdf.text(formatRp(pricePerBox), 100, fy); pdf.text(jumlahBox + " Box", 140, fy); pdf.text(formatRp(total), 170, fy);
    }

    // compute finalY based on autoTable if available
    let finalY = (pdf.lastAutoTable && pdf.lastAutoTable.finalY) ? pdf.lastAutoTable.finalY + 10 : startTableY + 30;

    // totals (right aligned)
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("Subtotal: " + formatRp(subtotal), 195, finalY, { align: "right" });
    finalY += 6;
    if (discount && discount > 0) {
      pdf.text("Discount: " + formatRp(discount), 195, finalY, { align: "right" });
      finalY += 6;
    }
    pdf.setFont("helvetica", "bold");
    pdf.text("Total Bayar: " + formatRp(total), 195, finalY, { align: "right" });

    // signature + qris (position under totals)
    finalY += 12;

    // ===== TTD handling with robust fallback =====
    if (ttd) {
      // First try: direct addImage with HTMLImageElement (supported in newer jsPDF)
      try {
        pdf.addImage(ttd, "PNG", 150, finalY, 40, 18);
        console.log("[generatePdf] ttd added directly as HTMLImageElement");
      } catch (e1) {
        console.warn("[generatePdf] direct add ttd failed, attempting canvas fallback:", e1);

        // Canvas fallback: draw image to canvas and get dataURL (this often fixes issues from metadata/icc/cmyk)
        try {
          const c = document.createElement("canvas");
          // limit max dimensions to avoid memory blowup while preserving aspect
          const MAX_DIM = 1200;
          let w = ttd.naturalWidth || ttd.width || 400;
          let h = ttd.naturalHeight || ttd.height || 200;
          const scale = Math.min(1, MAX_DIM / Math.max(w, h));
          w = Math.floor(w * scale);
          h = Math.floor(h * scale);
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d");
          // draw white background to avoid transparency issues when using certain convertors
          ctx.fillStyle = "rgba(0,0,0,0)";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(ttd, 0, 0, w, h);

          // export as PNG (RGB)
          const dataUrl = c.toDataURL("image/png");
          pdf.addImage(dataUrl, "PNG", 150, finalY, 40, 18);
          console.log("[generatePdf] ttd added via canvas fallback");
        } catch (e2) {
          console.error("[generatePdf] ttd canvas fallback failed:", e2);
          try {
            pdf.text("(Tanda tangan tidak tersedia)", 150, finalY + 5);
          } catch (e3) {}
        }
      }
    } else {
      console.warn("[generatePdf] ttd not available (not loaded)");
      try { pdf.text("(Tanda tangan tidak tersedia)", 150, finalY + 5); } catch (e) {}
    }

    // ===== QRIS handling =====
    if (qris) {
      try {
        pdf.setFont("helvetica", "normal");
        pdf.text("Scan QR untuk pembayaran:", 105, finalY, { align: "center" });
        // prefer JPEG if original loaded type is JPEG
        try {
          pdf.addImage(qris, "JPEG", 80, finalY + 3, 50, 50);
        } catch (eAdd) {
          // fallback to canvas dataURL
          const c2 = document.createElement("canvas");
          c2.width = qris.naturalWidth || qris.width || 400;
          c2.height = qris.naturalHeight || qris.height || 400;
          const ctx2 = c2.getContext("2d");
          ctx2.drawImage(qris, 0, 0, c2.width, c2.height);
          const dataUrl2 = c2.toDataURL("image/png");
          pdf.addImage(dataUrl2, "PNG", 80, finalY + 3, 50, 50);
        }
      } catch (e) {
        console.warn("[generatePdf] failed to add qris image:", e);
      }
    } else {
      console.warn("[generatePdf] qris not available at assets/images/qris-pukis.jpg");
    }

    pdf.setFont("helvetica", "normal");
    pdf.text("Terimakasih atas pembelian anda ❤️", 105, finalY + 60, { align: "center" });

    // final save (wrapped try/catch)
    try {
      const filename = `Invoice_${(nama || "Pelanggan").toString().replace(/\s+/g, "_")}.pdf`;
      pdf.save(filename);
      console.log("[generatePdf] PDF saved as", filename);
    } catch (errSave) {
      console.error("[generatePdf] save failed:", errSave);
      throw errSave;
    }

  } catch (err) {
    console.error("[generatePdf] unexpected error", err);
    throw err;
  }
  }
