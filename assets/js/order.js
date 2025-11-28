/* order.js
   Semua logic terkait Order:
   - Harga & topping
   - getOrderFormData
   - updatePriceUI
   - updateToppingDisplay
   - saveOrderLocal
   - renderNota (popup) -> TIDAK menampilkan Jenis/Mode/Topping/Taburan (sesuai permintaan)
   - generatePdf(order) -> MENAMPILKAN semua field di TABEL rapi
   - safe init untuk tombol Cetak
*/

/* eslint-disable no-unused-vars */
(function () {
  'use strict';

  /* ----------------------
     Utilities & constants
  -----------------------*/
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const ADMIN_WA = "6281296668670";

  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 13000, single: 15000, double: 18000 }, "10": { non: 25000, single: 28000, double: 32000 } },
  };
  const SINGLE_TOPPINGS = ["Coklat", "Tiramisu", "Vanilla", "Stroberi", "Cappucino"];
  const DOUBLE_TABURAN = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];
  const MAX_TOPPING = 5, MAX_TABURAN = 5, DISKON_MIN_BOX = 10, DISKON_PER_BOX = 1000;

  function formatRp(num) { return "Rp " + Number(num || 0).toLocaleString("id-ID"); }
  function escapeHtml(str = "") { return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
  function getSelectedRadio(name) { const r = $(`input[name="${name}"]:checked`); return r ? r.value : null; }
  function getChecked(selector) { return $$(selector + ":checked").map(e => e.value); }

  /* ----------------------
     Price calculation
  -----------------------*/
  function calculatePrice(jenis, isi, mode) {
    return ((BASE_PRICE[jenis] || {})[isi] || {})[mode] || 0;
  }
  function calculateSubtotal(pricePerBox, jumlah) { return pricePerBox * jumlah; }
  function calculateDiscount(jumlah) { return jumlah >= DISKON_MIN_BOX ? DISKON_PER_BOX * jumlah : 0; }
  function calculateGrandTotal(subtotal, discount) { return subtotal - discount; }

  /* ----------------------
     Get order data from form
  -----------------------*/
  function getOrderFormData() {
    const jenis = getSelectedRadio("ultraJenis") || "Original";
    const isi = $("#ultraIsi") ? $("#ultraIsi").value : "5";
    const mode = getSelectedRadio("ultraToppingMode") || "non";
    const jumlahBox = $("#ultraJumlah") ? parseInt($("#ultraJumlah").value) || 1 : 1;
    const pricePerBox = calculatePrice(jenis, isi, mode);
    const subtotal = calculateSubtotal(pricePerBox, jumlahBox);
    const discount = calculateDiscount(jumlahBox);
    const total = calculateGrandTotal(subtotal, discount);

    const order = {
      id: "INV" + Date.now(),
      orderID: "INV" + Date.now(),
      nama: $("#ultraNama") ? $("#ultraNama").value.trim() : "-",
      wa: $("#ultraWA") ? $("#ultraWA").value.trim() : "-",

      // keep these for PDF table, even if nota popup won't show them
      jenis, isi, mode,
      topping: getChecked(".ultraTopping"),
      taburan: getChecked(".ultraTaburan"),

      jumlahBox, pricePerBox, subtotal, discount, total,
      note: $("#ultraNote") ? $("#ultraNote").value.trim() : "-",
      createdAt: new Date().toISOString(),
      tgl: new Date().toLocaleString("id-ID"),
    };

    return order;
  }

  /* ----------------------
     Update price UI (in form)
  -----------------------*/
  function updatePriceUI() {
    const data = getOrderFormData();
    if ($("#ultraPricePerBox")) $("#ultraPricePerBox").innerText = formatRp(data.pricePerBox);
    if ($("#ultraSubtotal")) $("#ultraSubtotal").innerText = formatRp(data.subtotal);
    if ($("#ultraDiscount")) $("#ultraDiscount").innerText = data.discount > 0 ? "-" + formatRp(data.discount) : "-";
    if ($("#ultraGrandTotal")) $("#ultraGrandTotal").innerText = formatRp(data.total);
  }

  /* ----------------------
     Topping display (build checkboxes)
  -----------------------*/
  function updateToppingDisplay() {
    const mode = getSelectedRadio("ultraToppingMode");
    const isi = parseInt($("#ultraIsi") ? $("#ultraIsi").value : 5);
    const singleEl = $("#ultraSingleGroup");
    const doubleEl = $("#ultraDoubleGroup");
    if (!singleEl || !doubleEl) return;

    singleEl.innerHTML = "";
    doubleEl.innerHTML = "";

    if (mode === "single" || mode === "double") { singleEl.style.display = "flex"; } else singleEl.style.display = "none";
    if (mode === "double") { doubleEl.style.display = "flex"; } else doubleEl.style.display = "none";

    if (mode === "single" || mode === "double") {
      SINGLE_TOPPINGS.forEach((t, i) => {
        if (i < isi) singleEl.insertAdjacentHTML("beforeend", `<label class="topping-check"><input type="checkbox" class="ultraTopping" value="${t}"><span>${t}</span></label>`);
      });
    }
    if (mode === "double") {
      DOUBLE_TABURAN.forEach((t, i) => {
        if (i < isi) doubleEl.insertAdjacentHTML("beforeend", `<label class="topping-check"><input type="checkbox" class="ultraTaburan" value="${t}"><span>${t}</span></label>`);
      });
    }
    updatePriceUI();
  }

  /* event listeners for topping & inputs */
  function attachFormListeners() {
    $$('input[name="ultraToppingMode"], input[name="ultraJenis"]').forEach(r => r.addEventListener("change", () => { updateToppingDisplay(); updatePriceUI(); }));
    ["ultraIsi", "ultraJumlah"].forEach(id => {
      const el = $("#" + id);
      if (el) el.addEventListener("change", () => { updateToppingDisplay(); updatePriceUI(); });
    });

    document.addEventListener("change", e => {
      const t = e.target; if (!t) return;
      if (t.matches(".ultraTopping, .ultraTaburan")) {
        const lbl = t.closest("label"); if (lbl) { t.checked ? lbl.classList.add("checked") : lbl.classList.remove("checked"); }
        const mode = getSelectedRadio("ultraToppingMode"), isi = parseInt($("#ultraIsi") ? $("#ultraIsi").value : 5);
        const s = getChecked(".ultraTopping").length, d = getChecked(".ultraTaburan").length;
        if (mode === "single" && s > MAX_TOPPING) { t.checked = false; alert(`Maksimal ${MAX_TOPPING} topping`); }
        if (mode === "double") {
          if (t.classList.contains("ultraTopping") && s > MAX_TOPPING) { t.checked = false; alert(`Maksimal ${MAX_TOPPING} topping`); }
          if (t.classList.contains("ultraTaburan") && d > MAX_TABURAN) { t.checked = false; alert(`Maksimal ${MAX_TABURAN} taburan`); }
        }
        updatePriceUI();
      }
    });
  }

  /* ----------------------
     Save order to localStorage
  -----------------------*/
  function saveOrderLocal(order) {
    try {
      const arr = JSON.parse(localStorage.getItem("orders") || "[]");
      arr.push(order); localStorage.setItem("orders", JSON.stringify(arr));

      const arr2 = JSON.parse(localStorage.getItem("allOrders") || "[]");
      arr2.push(order); localStorage.setItem("allOrders", JSON.stringify(arr2));

      localStorage.setItem("lastOrder", JSON.stringify(order));
    } catch (e) { console.error("saveOrderLocal error", e); }
  }

  /* ----------------------
     Render nota (popup) - simplified per request
     Note: NOTA popup will NOT show Jenis/Mode/Topping/Taburan
  -----------------------*/
  function renderNota(data) {
    const content = $("#notaContent");
    const card = $("#notaContainer .nota-card");
    if (!content && !card) return;
    const target = content || card;

    const html = `
      <p><strong>Order ID:</strong> ${escapeHtml(data.orderID || data.id || "-")}</p>
      <p><strong>Nama:</strong> ${escapeHtml(data.nama)}</p>
      <p><strong>WA:</strong> ${escapeHtml(data.wa)}</p>

      <p><strong>Jumlah Box:</strong> ${escapeHtml(String(data.jumlahBox))}</p>
      <p><strong>Harga per Box:</strong> ${formatRp(data.pricePerBox)}</p>
      <p><strong>Subtotal:</strong> ${formatRp(data.subtotal)}</p>
      <p><strong>Diskon:</strong> ${data.discount > 0 ? "-" + formatRp(data.discount) : "-"}</p>
      <p style="font-weight:700;"><strong>Total:</strong> ${formatRp(data.total)}</p>

      <p><strong>Catatan:</strong> ${escapeHtml(data.note)}</p>
    `;
    target.innerHTML = html;
  }

  /* ----------------------
     PDF generation (jsPDF + autoTable)
     - All key fields placed in a neat 2-column table
     - Fixed variable name bugs (isi, mode, topping, taburan)
  -----------------------*/
  function waitForJsPdf(timeoutMs = 7000, intervalMs = 150) {
    return new Promise((resolve) => {
      const started = Date.now();
      const id = setInterval(() => {
        const found = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || window.jspdf || null;
        if (found) {
          clearInterval(id);
          resolve({ ok: true, obj: found, elapsed: Date.now() - started });
        } else if (Date.now() - started > timeoutMs) {
          clearInterval(id);
          resolve({ ok: false, obj: null, elapsed: Date.now() - started });
        }
      }, intervalMs);
    });
  }

  function makeGeneratePdf(jsPDFCtor) {
    return async function generatePdf(order) {
      try {
        const o = order || {};
        // normalize fields
        o.jenis = o.jenis || "-";
        o.isi = (o.isi !== undefined && o.isi !== null) ? o.isi : "-";
        o.mode = o.mode || "-";
        o.topping = Array.isArray(o.topping) ? o.topping : (o.topping ? [o.topping] : []);
        o.taburan = Array.isArray(o.taburan) ? o.taburan : (o.taburan ? [o.taburan] : []);
        o.jumlahBox = o.jumlahBox || 0;
        o.pricePerBox = o.pricePerBox || 0;
        o.subtotal = o.subtotal || 0;
        o.discount = o.discount || 0;
        o.total = o.total || 0;
        o.note = o.note || "-";
        o.nama = o.nama || "Pelanggan";
        o.orderID = o.orderID || (o.id || String(Date.now()));
        o.tgl = o.tgl || new Date().toLocaleString("id-ID");
        o.wa = o.wa || "-";

        // find constructor
        let DocCtor = jsPDFCtor;
        if (jsPDFCtor && typeof jsPDFCtor === "object" && jsPDFCtor.jsPDF) DocCtor = jsPDFCtor.jsPDF;
        if (typeof DocCtor !== "function") DocCtor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);

        if (typeof DocCtor !== "function") throw new Error("jsPDF constructor not found");

        // instantiate
        const doc = new DocCtor({ unit: "mm", format: "a4", compress: true });
        const pageW = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(18);
        try { doc.setFont("helvetica", "bold"); } catch(e){}
        doc.text("PUKIS LUMER AULIA", pageW / 2, 16, { align: "center" });

        doc.setFontSize(10);
        doc.text("Pasar Kuliner Padang Panjang", pageW / 2, 22, { align: "center" });
        doc.text("0812-9666-8670", pageW / 2, 26, { align: "center" });

        doc.setLineWidth(0.5);
        doc.line(10, 30, pageW - 10, 30);

        // meta
        let y = 36;
        doc.setFontSize(10);
        doc.text(`Order ID: ${o.orderID}`, 14, y);
        doc.text(`Tanggal: ${o.tgl}`, pageW - 14, y, { align: "right" });
        y += 8;
        doc.text(`Nama: ${o.nama}`, 14, y);
        doc.text(`WA: ${o.wa}`, pageW - 14, y, { align: "right" });
        y += 10;

        // We will **NOT** print jenis/mode/topping/taburan here as free text;
        // all fields go to the neat 2-column table below.

        // table rows (Item, Keterangan)
        const tableRows = [
          ["Jenis", String(o.jenis)],
          ["Isi Box", String(o.isi) + " pcs"],
          ["Mode", String(o.mode)],
          ["Topping", o.topping.length ? o.topping.join(", ") : "-"],
          ["Taburan", o.taburan.length ? o.taburan.join(", ") : "-"],
          ["Jumlah Box", String(o.jumlahBox) + " Box"],
          ["Harga per Box", formatRp(o.pricePerBox)],
          ["Subtotal", formatRp(o.subtotal)],
          ["Diskon", o.discount > 0 ? "- " + formatRp(o.discount) : "-"],
          ["Total Bayar", formatRp(o.total)],
          ["Catatan", o.note || "-"]
        ];

        // autoTable if available
        const hasAutoTable = typeof doc.autoTable === "function";
        if (hasAutoTable) {
          doc.autoTable({
            startY: y,
            head: [["Item", "Keterangan"]],
            body: tableRows,
            theme: "grid",
            headStyles: { fillColor: [214, 51, 108], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 'auto' } }
          });
        } else {
          // fallback manual rendering in two columns
          doc.setFontSize(10);
          let ty = y;
          const colX1 = 18;
          const colX2 = 90;
          tableRows.forEach(r => {
            doc.text(String(r[0]), colX1, ty);
            const wrapped = doc.splitTextToSize(String(r[1]), pageW - colX2 - 18);
            doc.text(wrapped, colX2, ty);
            ty += Math.max(8, wrapped.length * 6);
          });
        }

        // Footer: thank you
        const finalY = doc.lastAutoTable ? (doc.lastAutoTable.finalY + 12) : (y + 120);
        doc.setFontSize(10);
        doc.text("Hormat Kami,", pageW - 60, finalY);
        doc.text("Terimakasih sudah Belanja di toko Kami", pageW / 2, finalY + 20, { align: "center" });

        // filename
        const safeName = (o.nama || "Pelanggan").replace(/\s+/g, "_").replace(/[^\w\-_.]/g, "");
        const filename = `Invoice_${safeName}_${o.orderID}.pdf`;
        doc.save(filename);

        return true;
      } catch (err) {
        console.error("generatePdf error:", err);
        alert("Gagal membuat PDF: " + (err && err.message ? err.message : err));
        return false;
      }
    };
  }

  /* ----------------------
     tryAttachGeneratePdf: init generatePdf() if jsPDF ready
  -----------------------*/
  async function tryAttachGeneratePdf() {
    const res = await waitForJsPdf(7000, 150);
    if (!res.ok) {
      console.warn("jsPDF not found after timeout; generatePdf will not be attached.");
      return;
    }
    window.generatePdf = makeGeneratePdf(res.obj);
    console.log("generatePdf attached");
  }

  /* ----------------------
     Button handlers & init
  -----------------------*/
  function attachOrderHandlers() {
    // form submit
    $("#formUltra")?.addEventListener("submit", e => {
      e.preventDefault();
      const data = getOrderFormData();
      if (!data.nama || !data.wa) return alert("Isi nama & WA terlebih dahulu.");
      saveOrderLocal(data);
      renderNota(data);
      $("#notaContainer")?.classList.add("show");
      $("#notaContainer .nota-card")?.scrollIntoView({ behavior: "smooth" });
      alert("Nota dibuat. Silakan cek & tekan 'Cetak/PDF' atau 'Kirim WA Admin'.");
    });

    // print
    $("#notaPrint")?.addEventListener("click", async () => {
      let lastRaw = localStorage.getItem("lastOrder") || "{}";
      let last;
      try { last = JSON.parse(lastRaw); } catch (e) { last = null; }
      if (!last || !last.orderID) {
        last = getOrderFormData();
        localStorage.setItem("lastOrder", JSON.stringify(last));
      }
      if (typeof window.generatePdf !== "function") {
        // try to attach now (in case jsPDF loaded later)
        await tryAttachGeneratePdf();
      }
      if (typeof window.generatePdf === "function") {
        await window.generatePdf(last);
      } else {
        alert("generatePdf belum tersedia. Pastikan library jsPDF sudah dimuat.");
      }
    });

    // send WA admin
    $("#ultraSendAdmin")?.addEventListener("click", () => {
      const data = getOrderFormData();
      if (!data.nama || !data.wa) return alert("Isi nama & WA terlebih dahulu.");
      saveOrderLocal(data);

      const lines = [
        "Halo Admin, saya ingin memesan Pukis Lumer Aulia:",
        `Nama: ${data.nama}`,
        `WA: ${data.wa}`,
        `Jenis: ${data.jenis}`,
        `Isi: ${data.isi} pcs`,
      ];
      if (data.mode === "single") lines.push(`Topping: ${data.topping.join(",") || "-"}`);
      if (data.mode === "double") { lines.push(`Topping: ${data.topping.join(",") || "-"}`); lines.push(`Taburan: ${data.taburan.join(",") || "-"}`); }
      lines.push(`Jumlah Box: ${data.jumlahBox}`);
      lines.push(`Catatan: ${data.note}`);
      lines.push(`Total: ${formatRp(data.total)}`);
      lines.push("Terima kasih 🙏");

      window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
    });

    // nota close
    $("#notaClose")?.addEventListener("click", () => { $("#notaContainer")?.classList.remove("show"); });
  }

  /* ----------------------
     Public init
  -----------------------*/
  function initOrderModule() {
    updateToppingDisplay();
    updatePriceUI();
    attachFormListeners();
    attachOrderHandlers();
    tryAttachGeneratePdf().catch(() => {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initOrderModule);
  else initOrderModule();

  // expose helper for debug or external usage
  window.getOrderFormData = getOrderFormData;
  window.saveOrderLocal = saveOrderLocal;
  window.renderNota = renderNota;

})();
