/* FILE: assets/js/script.js
   PUKIS LUMER AULIA — SCRIPT FINAL PRO (UPGRADED)
   Terhubung dengan: index.html (ultra*), order.js (PDF generator), admin.js
*/

(() => {
  "use strict";

  /* --------- Helpers --------- */
  const q = (sel) => document.querySelector(sel);
  const qAll = (sel) => Array.from(document.querySelectorAll(sel));
  const fmtRp = (n = 0) => "Rp " + Number(n).toLocaleString("id-ID");

  /* --------- Elements (match index.html) --------- */
  const formUltra = q("#formUltra");
  const ultraNama = q("#ultraNama");
  const ultraWA = q("#ultraWA");
  const ultraIsi = q("#ultraIsi");
  const ultraJumlah = q("#ultraJumlah");
  const ultraPricePerBox = q("#ultraPricePerBox");
  const ultraSubtotal = q("#ultraSubtotal");
  const ultraDiscount = q("#ultraDiscount") || null;
  const ultraGrandTotal = q("#ultraGrandTotal");
  const ultraSingleGroup = q("#ultraSingleGroup");
  const ultraDoubleGroup = q("#ultraDoubleGroup");
  const notaContainer = q("#notaContainer") || q(".nota-overlay");
  const notaContent = q("#notaContent");
  const notaClose = q("#notaClose");
  const notaPrint = q("#notaPrint");
  const ultraSendAdmin = q("#ultraSendAdmin");

  const testimonialsListContainer = q("#testimonialsList");
  const testimonialForm = q("#testimonialForm");
  const testiName = q("#nameInput");
  const testiMessage = q("#testimonialInput");

  const galleryItems = qAll(".gallery-img").concat(qAll(".lightbox-item"));

  const siteLoader = q("#site-loader");

  /* --------- Pricing table (single source of truth) --------- */
  const BASE_PRICE = {
    Original: { "5": { non: 10000, single: 13000, double: 15000 }, "10": { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { "5": { non: 12000, single: 15000, double: 18000 }, "10": { non: 22000, single: 28000, double: 32000 } },
  };

  const ADMIN_WA = "6281296668670";

  /* --------- Utility: get selected topping mode --------- */
  function getToppingMode() {
    const r = document.querySelector('input[name="ultraToppingMode"]:checked');
    return r ? r.value : "non";
  }

  /* --------- Create topping UI (with accent check visuals) --------- */
  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Matcha","Cappucino","Strawberry","Vanilla","Taro"];
  const DOUBLE_TOPPINGS = ["Coklat","Tiramisu","Matcha","Cappucino","Strawberry","Vanilla","Taro"];
  const DOUBLE_TABURAN  = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  function renderToppingUI() {
    const mode = getToppingMode();
    // clear groups
    ultraSingleGroup.innerHTML = "";
    ultraDoubleGroup.innerHTML = "";

    // Single group
    if (mode === "single") {
      ultraSingleGroup.style.display = "block";
      ultraDoubleGroup.style.display = "none";
      SINGLE_TOPPINGS.forEach(t => {
        const el = document.createElement("label");
        el.className = "topping-label";
        el.innerHTML = `<input type="checkbox" class="ultraTopping" value="${t}"> <span class="topping-name">${t}</span> <span class="tick">✓</span>`;
        ultraSingleGroup.appendChild(el);
      });
    } else if (mode === "double") {
      ultraSingleGroup.style.display = "none";
      ultraDoubleGroup.style.display = "block";
      // toppings
      DOUBLE_TOPPINGS.forEach(t => {
        const el = document.createElement("label");
        el.className = "topping-label";
        el.innerHTML = `<input type="checkbox" class="ultraTopping" value="${t}"> <span class="topping-name">${t}</span> <span class="tick">✓</span>`;
        ultraDoubleGroup.appendChild(el);
      });
      // separator
      const sep = document.createElement("div");
      sep.style.height = "8px";
      ultraDoubleGroup.appendChild(sep);
      // taburan
      DOUBLE_TABURAN.forEach(t => {
        const el = document.createElement("label");
        el.className = "topping-label taburan";
        el.innerHTML = `<input type="checkbox" class="ultraTaburan" value="${t}"> <span class="topping-name">${t}</span> <span class="tick">✓</span>`;
        ultraDoubleGroup.appendChild(el);
      });
    } else {
      ultraSingleGroup.style.display = "none";
      ultraDoubleGroup.style.display = "none";
    }

    // attach limit handlers
    qAll(".ultraTopping").forEach(cb => cb.removeEventListener("change", toppingLimitHandler));
    qAll(".ultraTaburan").forEach(cb => cb.removeEventListener("change", toppingLimitHandler));
    qAll(".ultraTopping").forEach(cb => cb.addEventListener("change", toppingLimitHandler));
    qAll(".ultraTaburan").forEach(cb => cb.addEventListener("change", toppingLimitHandler));
  }

  function toppingLimitHandler(e) {
    const mode = getToppingMode();
    const toppingsChecked = qAll(".ultraTopping").filter(i => i.checked).length;
    const taburanChecked = qAll(".ultraTaburan").filter(i => i.checked).length;

    if (mode === "single" && toppingsChecked > 5) {
      e.target.checked = false;
      alert("Maksimal 5 topping untuk mode single.");
      return;
    }
    if (mode === "double") {
      if (e.target.classList.contains("ultraTopping") && toppingsChecked > 5) {
        e.target.checked = false;
        alert("Maksimal 5 topping (double).");
        return;
      }
      if (e.target.classList.contains("ultraTaburan") && taburanChecked > 5) {
        e.target.checked = false;
        alert("Maksimal 5 taburan (double).");
        return;
      }
    }
    // refresh price on change
    calculateAndRenderPrice();
    // toggle visual tick
    updateToppingVisuals();
  }

  /* --------- Price calculation & render --------- */
  function getSelectedJenis() {
    const r = document.querySelector('input[name="ultraJenis"]:checked');
    return r ? r.value : "Original";
  }

  function calculateAndRenderPrice() {
    const jenis = getSelectedJenis();
    const isi = ultraIsi.value || "5";
    const mode = getToppingMode();
    const jumlah = parseInt(ultraJumlah.value || "1", 10);
    const pricePerBox = (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) ? BASE_PRICE[jenis][isi][mode] : 0;
    const subtotal = pricePerBox * jumlah;
    const discount = 0;
    const total = subtotal - discount;

    ultraPricePerBox.textContent = fmtRp(pricePerBox);
    ultraSubtotal.textContent = fmtRp(subtotal);
    if (ultraDiscount) ultraDiscount.textContent = discount > 0 ? `- ${fmtRp(discount)}` : "-";
    ultraGrandTotal.textContent = fmtRp(total);

    return { pricePerBox, subtotal, discount, total, jumlah, jenis, isi, mode };
  }

  /* --------- Build order object & store (format admin friendly) --------- */
  function buildOrderObject() {
    const d = calculateAndRenderPrice();
    const toppingVals = qAll(".ultraTopping").filter(x=>x.checked).map(x=>x.value);
    const taburanVals = qAll(".ultraTaburan").filter(x=>x.checked).map(x=>x.value);

    const order = {
      orderID: "ORD-" + Date.now(),
      nama: ultraNama.value || "-",
      buyerWA: ultraWA.value || "-",
      jenis: d.jenis || "-",
      isi: d.isi || "-",
      mode: d.mode || "non",
      topping: toppingVals,
      taburan: taburanVals,
      jumlahBox: d.jumlah,
      pricePerBox: d.pricePerBox,
      subtotal: d.subtotal,
      discount: d.discount,
      total: d.total,
      note: "",
      createdAt: new Date().toISOString()
    };
    return order;
  }

  function saveOrderLocal(order) {
    const existing = JSON.parse(localStorage.getItem("orders") || "[]");
    existing.push(order);
    localStorage.setItem("orders", JSON.stringify(existing));
  }

  /* --------- Nota render & actions --------- */
  function renderNota(order) {
    if (!notaContent) return;
    const lines = [];
    lines.push(`<p><strong>Nama:</strong> ${order.nama}</p>`);
    lines.push(`<p><strong>WA:</strong> ${order.buyerWA}</p>`);
    lines.push(`<p><strong>Jenis:</strong> ${order.jenis}</p>`);
    lines.push(`<p><strong>Isi:</strong> ${order.isi} pcs</p>`);
    if (order.mode === "single") lines.push(`<p><strong>Topping:</strong> ${order.topping.join(", ") || "-"}</p>`);
    if (order.mode === "double") {
      lines.push(`<p><strong>Topping:</strong> ${order.topping.join(", ") || "-"}</p>`);
      lines.push(`<p><strong>Taburan:</strong> ${order.taburan.join(", ") || "-"}</p>`);
    }
    lines.push(`<p><strong>Jumlah Box:</strong> ${order.jumlahBox}</p>`);
    lines.push(`<p><strong>Total:</strong> <strong>${fmtRp(order.total)}</strong></p>`);
    notaContent.innerHTML = lines.join("");
  }

  /* --------- WA message and open --------- */
  function sendWhatsApp(order) {
    const msg =
`Halo Admin, saya ingin memesan Pukis Lumer Aulia:
Nama: ${order.nama}
Nomor WA: ${order.buyerWA}
Jenis: ${order.jenis}
Isi: ${order.isi} pcs
Mode: ${order.mode}
Topping: ${order.topping.join(", ") || "-"}
Taburan: ${order.taburan.join(", ") || "-"}
Jumlah Box: ${order.jumlahBox}
Total: ${fmtRp(order.total)}
Terima kasih 🙏`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${ADMIN_WA}?text=${encoded}`, "_blank");
  }

  /* --------- Form submit handler (create nota + save) --------- */
  formUltra?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    // basic validation
    if (!ultraNama.value || !ultraWA.value) {
      alert("Isi nama dan nomor WhatsApp terlebih dahulu.");
      return;
    }

    const order = buildOrderObject();
    saveOrderLocal(order);
    renderNota(order);
    // show nota modal
    if (notaContainer) notaContainer.classList.add("show");
    // optionally allow printing via order.js generatePdf
  });

  /* --------- UltraSendAdmin (kirim WA dari form, juga menyimpan) --------- */
  ultraSendAdmin?.addEventListener("click", () => {
    // validate
    if (!ultraNama.value || !ultraWA.value) {
      alert("Isi nama dan nomor WhatsApp terlebih dahulu.");
      return;
    }
    const order = buildOrderObject();
    saveOrderLocal(order);
    sendWhatsApp(order);
    alert("Pesanan disimpan dan WA terbuka ke admin.");
  });

  /* --------- Nota close & print --------- */
  notaClose?.addEventListener("click", () => {
    notaContainer?.classList.remove("show");
  });

  notaPrint?.addEventListener("click", async () => {
    // try to call generatePdf from order.js (it should be global)
    try {
      const order = buildOrderObject();
      if (window.generatePdf) {
        await window.generatePdf(order);
      } else {
        alert("Fitur PDF tidak tersedia (order.js belum ter-load).");
      }
    } catch (err) {
      console.error("PDF error:", err);
      alert("Gagal membuat PDF: " + (err.message || err));
    }
  });

  /* --------- Testimonial handling (store + UI) --------- */
  function renderTestimonials() {
    const data = JSON.parse(localStorage.getItem("testimonials") || "[]");
    testimonialsListContainer.innerHTML = "";
    if (!Array.isArray(data) || data.length === 0) {
      testimonialsListContainer.innerHTML = "<p style='opacity:.7'>Belum ada testimoni.</p>";
      return;
    }
    data.slice().reverse().forEach(t => {
      const card = document.createElement("div");
      card.className = "testimonial-card";
      card.innerHTML = `<strong>${escapeHtml(t.name)}</strong><p style="margin:6px 0 0">${escapeHtml(t.testimonial)}</p>`;
      testimonialsListContainer.appendChild(card);
    });
  }

  testimonialForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = testiName.value.trim();
    const testimonial = testiMessage.value.trim();
    if (!name || !testimonial) return alert("Isi nama & testimoni.");
    const arr = JSON.parse(localStorage.getItem("testimonials") || "[]");
    arr.push({ name, testimonial, createdAt: new Date().toISOString() });
    localStorage.setItem("testimonials", JSON.stringify(arr));
    testiName.value = ""; testiMessage.value = "";
    renderTestimonials();
  });

  /* --------- Lightbox gallery (works with .gallery-img and .lightbox-item) --------- */
  function initLightbox() {
    const items = Array.from(new Set([...qAll(".gallery-img"), ...qAll(".lightbox-item")]));
    items.forEach(img => {
      img.addEventListener("click", () => {
        const overlay = q("#lightboxOverlay");
        const lightImg = q("#lightboxImg");
        if (!overlay || !lightImg) {
          // fallback: create temporary overlay
          const box = document.createElement("div");
          box.className = "lightbox-overlay show";
          box.innerHTML = `<img src="${img.src}" alt="">`;
          box.addEventListener("click", () => box.remove());
          document.body.appendChild(box);
          return;
        }
        lightImg.src = img.src;
        overlay.classList.add("show");
      });
    });

    // click to close overlay
    const overlay = q("#lightboxOverlay");
    if (overlay) overlay.addEventListener("click", () => {
      overlay.classList.remove("show");
      q("#lightboxImg").src = "";
    });
  }

  /* --------- Topping visuals: add tick class when checked --------- */
  function updateToppingVisuals() {
    qAll(".topping-label").forEach(lbl => {
      const cb = lbl.querySelector("input[type='checkbox']");
      if (!cb) return;
      if (cb.checked) lbl.classList.add("checked");
      else lbl.classList.remove("checked");
    });
  }

  /* --------- Utility: escape HTML for safe output --------- */
  function escapeHtml(str = "") {
    return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  /* --------- Init / Bind simple events --------- */
  function attachBasicBindings() {
    // render topping initially & on mode change
    renderToppingUI();
    qAll('input[name="ultraToppingMode"]').forEach(r => r.addEventListener("change", () => {
      renderToppingUI();
      calculateAndRenderPrice();
    }));

    // update price when jenis, isi, jumlah change
    qAll('input[name="ultraJenis"]').forEach(r => r.addEventListener("change", calculateAndRenderPrice));
    ultraIsi?.addEventListener("change", calculateAndRenderPrice);
    ultraJumlah?.addEventListener("input", calculateAndRenderPrice);

    // update visuals after dynamic topping render (delegate)
    document.addEventListener("change", (ev) => {
      if (ev.target && (ev.target.classList.contains("ultraTopping") || ev.target.classList.contains("ultraTaburan"))) {
        updateToppingVisuals();
      }
    });

    // Send Admin button already handled above
  }

  /* --------- Page loader hide & initial render --------- */
  function initPage() {
    try {
      renderTestimonials();
      initLightbox();
      attachBasicBindings();
      calculateAndRenderPrice();
    } finally {
      // hide loader
      if (siteLoader) siteLoader.style.display = "none";
    }
  }

  /* --------- Kickoff on DOM ready --------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }

})();
