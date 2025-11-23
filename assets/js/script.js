/* ======================================
   PUKIS LUMER AULIA — SCRIPT FINAL PRO
   ====================================== */

/* Loader */
window.addEventListener("load", () => {
  const loader = document.getElementById("site-loader");
  setTimeout(() => loader.style.display = "none", 800);
});

/* Ambil Data Form */
function getOrderFormData() {
  const toppingType = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || "non";

  return {
    id: "INV" + Date.now(),
    name: document.getElementById("ultraNama").value,
    wa: document.getElementById("ultraWA").value,
    jenis: document.querySelector('input[name="ultraJenis"]:checked')?.value || "Original",
    isi: parseInt(document.getElementById("ultraIsi").value),
    toppingType,
    singleTopping: getChecked(".single-top"),
    doubleTopping: getChecked(".double-top"),
    jumlah: parseInt(document.getElementById("ultraJumlah").value),
    note: document.getElementById("ultraNote").value || "-",
    priceBox: calculatePrice(),
    subtotal: calculateSubtotal(),
    discount: calculateDiskon(),
    total: calculateGrandTotal(),
    createdAt: new Date().toISOString()
  };
}

function getChecked(selector) {
  return Array.from(document.querySelectorAll(selector + ":checked"))
    .map(el => el.value);
}

/* PRICE RULE */
function calculatePrice() {
  const harga = {
    "Original": { non: 10000, single: 13000, double: 15000 },
    "Pandan": { non: 12000, single: 15000, double: 18000 }
  };
  const jenis = document.querySelector('input[name="ultraJenis"]:checked')?.value || "Original";
  const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || "non";
  return harga[jenis][mode];
}

function calculateSubtotal() {
  const price = calculatePrice();
  const jumlah = parseInt(document.getElementById("ultraJumlah").value);
  return price * jumlah;
}

/* Diskon Promo */
function calculateDiskon() {
  const jumlah = parseInt(document.getElementById("ultraJumlah").value);
  return jumlah >= 5 ? 2000 * jumlah : 0;
}

function calculateGrandTotal() {
  return calculateSubtotal() - calculateDiskon();
}

/* UI Update */
function updatePriceUI() {
  document.getElementById("ultraPricePerBox").innerText = formatRp(calculatePrice());
  document.getElementById("ultraSubtotal").innerText = formatRp(calculateSubtotal());
  document.getElementById("ultraDiscount").innerText = "-" + formatRp(calculateDiskon());
  document.getElementById("ultraGrandTotal").innerText = formatRp(calculateGrandTotal());
}

function formatRp(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

/* Topping Logic */
function showTopping() {
  const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value;
  const isi = parseInt(document.getElementById("ultraIsi").value);

  const singleEl = document.getElementById("ultraSingleGroup");
  const doubleEl = document.getElementById("ultraDoubleGroup");

  const toppingsSingle = ["Coklat", "Keju", "Oreo", "Tiramisu", "Matcha", "Strawberry"];
  const toppingsDouble = ["Meses", "Kacang", "Susu", "Crush Oreo"];

  singleEl.innerHTML = "";
  doubleEl.innerHTML = "";

  if (mode === "non") {
    singleEl.style.display = "none";
    doubleEl.style.display = "none";
    updatePriceUI();
    return;
  }

  if (mode === "single" || mode === "double") {
    singleEl.style.display = "block";
  }
  if (mode === "double") {
    doubleEl.style.display = "block";
  }

  toppingsSingle.forEach((t, i) => {
    if (i < isi) singleEl.innerHTML += `
      <label class="topping-check">
        <input type="checkbox" class="single-top" value="${t}">
        <span>${t}</span>
      </label>`;
  });

  toppingsDouble.forEach((t, i) => {
    if (mode === "double" && i < isi)
      doubleEl.innerHTML += `
      <label class="topping-check">
        <input type="checkbox" class="double-top" value="${t}">
        <span>${t}</span>
      </label>`;
  });

  updatePriceUI();
}

/* INIT EVENTS */
document.querySelectorAll('input[name="ultraToppingMode"]').forEach(el =>
  el.addEventListener("change", showTopping)
);

document.querySelectorAll('input[name="ultraJenis"]').forEach(el =>
  el.addEventListener("change", () => {
    showTopping();
    updatePriceUI();
  })
);

["ultraIsi", "ultraJumlah"].forEach(id =>
  document.getElementById(id).addEventListener("change", showTopping)
);

/* ======================================
   BAGIAN 2 — PUKIS LUMER AULIA (FINAL PRO)
   Lanjutan dari BAGIAN 1
   ====================================== */

(function(){
  "use strict";

  /* ---------- Utility (reuse) ---------- */
  const q = (s) => document.querySelector(s);
  const qAll = (s) => Array.from(document.querySelectorAll(s));
  const ADMIN_WA = "6281296668670";

  /* ---------- Form submit & save ---------- */
  // use existing getOrderFormData() from BAGIAN 1 (it returns full order object)
  async function handleFormSubmit(e) {
    e.preventDefault();

    // basic validation
    const name = (q("#ultraNama")?.value || "").trim();
    const wa = (q("#ultraWA")?.value || "").trim();
    if (!name || !wa) {
      alert("Isi nama & nomor WhatsApp terlebih dahulu.");
      return;
    }

    // Build order using function defined earlier
    const order = getOrderFormData();

    // enforce topping limits per group (defensive)
    const singleChecked = getChecked(".single-top").length;
    const doubleChecked = getChecked(".double-top").length;
    if (order.toppingType === "single" && singleChecked > order.isi) {
      alert(`Maksimal ${order.isi} topping (single).`);
      return;
    }
    if (order.toppingType === "double" && (singleChecked > order.isi || doubleChecked > order.isi)) {
      alert(`Maksimal ${order.isi} topping per grup (single/taburan).`);
      return;
    }

    // Save locally (admin-friendly)
    saveOrderLocal(order);

    // Render nota to modal
    renderNota(order); // renderNota implemented in BAGIAN1 or in order.js; ensure exists
    // show nota
    const overlay = q("#notaContainer");
    overlay?.classList.add("show");

    // auto-scroll to nota
    overlay?.querySelector(".nota-card")?.scrollIntoView({behavior:"smooth"});

    // Optionally open WA? We'll not auto-open on submit; user can click "Kirim WA Admin" button
    // but we can auto-open a compose link (commented) — leave commented for user preference
    // sendWhatsApp(order);

    // reset form? keep values so user can adjust; we won't auto-reset
    console.log("[script] Order saved locally:", order);
    alert("Nota dibuat. Silakan cek dan tekan 'Cetak / PDF' atau 'Kirim WA Admin'.");
  }

  // attach to form (id=formUltra)
  q("#formUltra")?.addEventListener("submit", handleFormSubmit);

  /* ---------- Save order (localStorage) ---------- */
  function saveOrderLocal(order) {
    const arr = JSON.parse(localStorage.getItem("orders") || "[]");
    arr.push(order);
    localStorage.setItem("orders", JSON.stringify(arr));
  }

  /* ---------- Send WA Admin (button) ---------- */
  q("#ultraSendAdmin")?.addEventListener("click", () => {
    const order = getOrderFormData();
    // validate minimal
    if (!order.name || !order.wa) {
      alert("Isi nama & WA terlebih dahulu.");
      return;
    }
    // save then open WA
    saveOrderLocal(order);
    const msgLines = [
      "Assalamu'alaikum",
      "Saya ingin memesan Pukis Lumer Aulia:",
      `Nama: ${order.name}`,
      `WA: ${order.wa}`,
      `Jenis: ${order.jenis}`,
      `Isi: ${order.isi} pcs`,
      `Mode: ${order.toppingType}`,
    ];
    if (order.toppingType === "single") {
      msgLines.push(`Topping: ${order.singleTopping.join(", ") || "-"}`);
    } else if (order.toppingType === "double") {
      msgLines.push(`Topping: ${order.singleTopping.join(", ") || "-"}`);
      msgLines.push(`Taburan: ${order.doubleTopping.join(", ") || "-"}`);
    }
    msgLines.push(`Jumlah Box: ${order.jumlah}`);
    msgLines.push(`Catatan: ${order.note}`);
    msgLines.push(`Total: ${formatRp(order.total)}`);
    msgLines.push("Terima kasih 🙏");

    const waLink = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msgLines.join("\n"))}`;
    window.open(waLink, "_blank");
  });

  /* ---------- Nota print (invoke generatePdf) ---------- */
  q("#notaPrint")?.addEventListener("click", async () => {
    // build current order snapshot (use getOrderFormData)
    const order = getOrderFormData();
    // try-catch safe
    try {
      if (typeof window.generatePdf === "function") {
        // branding-full: attempt to pass formatting flag
        await window.generatePdf({...order, branding: "full"});
      } else {
        // fallback: try to create a simple PDF via window.jspdf directly
        if (window.jspdf && window.jspdf.jsPDF) {
          try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            pdf.setFontSize(12);
            pdf.text("PUKIS LUMER AULIA - Nota Sederhana", 10, 20);
            pdf.setFontSize(10);
            pdf.text(`Nama: ${order.name}`, 10, 30);
            pdf.text(`No WA: ${order.wa}`, 10, 36);
            pdf.text(`Jenis: ${order.jenis}`, 10, 42);
            pdf.text(`Isi: ${order.isi} pcs`, 10, 48);
            pdf.text(`Mode: ${order.toppingType}`, 10, 54);
            if (order.singleTopping?.length) pdf.text(`Topping: ${order.singleTopping.join(", ")}`, 10, 60);
            if (order.doubleTopping?.length) pdf.text(`Taburan: ${order.doubleTopping.join(", ")}`, 10, 66);
            pdf.text(`Jumlah: ${order.jumlah}`, 10, 72);
            pdf.text(`Total: ${formatRp(order.total)}`, 10, 78);
            pdf.save(`${order.id || "Nota"}.pdf`);
          } catch (e) {
            console.error("Fallback PDF failed:", e);
            alert("Cetak PDF gagal. Pastikan library jsPDF terpasang.");
          }
        } else {
          alert("Fitur PDF tidak tersedia. Periksa apakah order.js sudah dimuat.");
        }
      }
    } catch (err) {
      console.error("generatePdf error:", err);
      alert("Gagal membuat PDF: " + (err && err.message ? err.message : err));
    }
  });

  /* ---------- Nota modal close (overlay) ---------- */
  q("#notaClose")?.addEventListener("click", () => {
    q("#notaContainer")?.classList.remove("show");
  });

  /* ---------- Testimonials: load + submit ---------- */
  function loadTestimonials() {
    const container = q("#testimonialsList");
    const saved = JSON.parse(localStorage.getItem("testimonials") || "[]");
    container.innerHTML = "";

    // first add saved (user) testimonials (latest first)
    saved.slice().reverse().forEach(t => {
      const li = document.createElement("li");
      li.className = "testimonial-card";
      li.innerHTML = `<strong>${escapeHtml(t.name)}</strong><br>${escapeHtml(t.testimonial)}`;
      container.appendChild(li);
    });

    // If no saved, keep default fake ones already in HTML (we preserved them)
  }

  q("#testimonialForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (q("#nameInput")?.value || "").trim();
    const text = (q("#testimonialInput")?.value || "").trim();
    if (!name || !text) return alert("Isi nama & testimoni.");

    const arr = JSON.parse(localStorage.getItem("testimonials") || "[]");
    arr.push({ name, testimonial: text, createdAt: new Date().toISOString() });
    localStorage.setItem("testimonials", JSON.stringify(arr));
    q("#nameInput").value = ""; q("#testimonialInput").value = "";
    loadTestimonials();
    alert("Terima kasih, testimoni kamu sudah tersimpan!");
  });

  /* ---------- Floating share toggle & admin float ---------- */
  q("#toggleShareBtn")?.addEventListener("click", () => {
    const icons = q("#floatingIcons");
    if (!icons) return;
    const shown = icons.classList.toggle("show");
    icons.setAttribute("aria-hidden", String(!shown));
    // animate button
    const btn = q("#toggleShareBtn");
    if (btn) btn.textContent = shown ? "✕" : "+";
  });

  // admin float open new tab (link is in HTML anchor)
  // nothing to attach here

  /* ---------- Lightbox handled in BAGIAN1 initLightbox (fallback included) ---------- */

  /* ---------- Topping check visual & limits enforcement (event delegation) ---------- */
  document.addEventListener("change", (ev) => {
    const target = ev.target;
    if (!target) return;

    // handle checkbox visuals
    if (target.matches(".single-top, .double-top")) {
      // toggle checked class on parent label for styling
      const lbl = target.closest("label");
      if (lbl) {
        if (target.checked) lbl.classList.add("checked");
        else lbl.classList.remove("checked");
      }

      // limit enforcement
      const isi = parseInt(q("#ultraIsi")?.value || "5", 10);
      // single group limit
      const singleCount = getChecked(".single-top").length;
      const doubleCount = getChecked(".double-top").length;
      const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || "non";

      if (mode === "single" && singleCount > isi) {
        target.checked = false;
        alert(`Maksimal ${isi} topping untuk single mode.`);
      }
      if (mode === "double") {
        if (target.classList.contains("single-top") && singleCount > isi) {
          target.checked = false;
          alert(`Maksimal ${isi} topping (single) untuk mode double.`);
        }
        if (target.classList.contains("double-top") && doubleCount > isi) {
          target.checked = false;
          alert(`Maksimal ${isi} taburan (double).`);
        }
      }

      // recalc prices (in case you implement topping price later)
      updatePriceUI();
    }
  });

  /* ---------- Helper: escape HTML ---------- */
  function escapeHtml(str = "") {
    return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
  }

  /* ---------- Init final: load testimonials, attach listeners from BAGIAN1 ---------- */
  function initFinal() {
    loadTestimonials();
    // ensure price UI is current
    if (typeof updatePriceUI === "function") updatePriceUI();
    // ensure topping UI exists
    if (typeof showTopping === "function") showTopping();
  }

  // run after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFinal);
  } else {
    initFinal();
  }

})();
