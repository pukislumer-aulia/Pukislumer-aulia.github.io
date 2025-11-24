/* ======================================
   PUKIS LUMER AULIA — SCRIPT FINAL PRO
   ====================================== */

/* Loader */
window.addEventListener("load", () => {
  const loader = document.getElementById("site-loader");
  setTimeout(() => loader.style.display = "none", 800);
});

/* ---------- Utility ---------- */
const q = (s) => document.querySelector(s);
const qAll = (s) => Array.from(document.querySelectorAll(s));
const ADMIN_WA = "6281296668670";

/* ---------- LocalStorage Init Testimoni Palsu ---------- */
(function initFakeTestimonials() {
  const key = "testimonials";
  if(!localStorage.getItem(key)){
    const fake = [
      {name:"Anggi, Payakumbuh", testimonial:"Pukisnya lembut dan toppingnya melimpah! Bakalan order lagi."},
      {name:"Wenni, Pekanbaru", testimonial:"Rasa pandan-nya mantap, cocok buat cemilan sore!"},
      {name:"Annisa, Bukittinggi", testimonial:"Pukis terenak yang pernah aku coba. Anak-anak juga suka!"},
      {name:"Maulana, Padang Panjang", testimonial:"Awalnya penasaran, sekali coba ketagihan, Topping nya gak pelit, penjual juga Ramah"}
    ];
    localStorage.setItem(key, JSON.stringify(fake));
  }
})();

/* ---------- Ambil Data Form ---------- */
function getOrderFormData() {
  const toppingType = q('input[name="ultraToppingMode"]:checked')?.value || "non";

  return {
    id: "INV" + Date.now(),
    name: q("#ultraNama")?.value || "",
    wa: q("#ultraWA")?.value || "",
    jenis: q('input[name="ultraJenis"]:checked')?.value || "Original",
    isi: parseInt(q("#ultraIsi")?.value || "5"),
    toppingType,
    singleTopping: getChecked(".single-top"),
    doubleTopping: getChecked(".double-top"),
    jumlah: parseInt(q("#ultraJumlah")?.value || "1"),
    note: q("#ultraNote")?.value || "-",
    priceBox: calculatePrice(),
    subtotal: calculateSubtotal(),
    discount: calculateDiskon(),
    total: calculateGrandTotal(),
    createdAt: new Date().toISOString()
  };
}

function getChecked(selector) {
  return qAll(selector + ":checked").map(el => el.value);
}

/* ---------- PRICE RULE ---------- */
function calculatePrice() {
  const harga = {
    "Original": { non: 10000, single: 13000, double: 15000 },
    "Pandan": { non: 12000, single: 15000, double: 18000 }
  };
  const jenis = q('input[name="ultraJenis"]:checked')?.value || "Original";
  const mode = q('input[name="ultraToppingMode"]:checked')?.value || "non";
  return harga[jenis][mode];
}

function calculateSubtotal() {
  return calculatePrice() * parseInt(q("#ultraJumlah")?.value || "1");
}

function calculateDiskon() {
  const jumlah = parseInt(q("#ultraJumlah")?.value || "1");
  return jumlah >= 5 ? 2000 * jumlah : 0;
}

function calculateGrandTotal() {
  return calculateSubtotal() - calculateDiskon();
}

function formatRp(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

function updatePriceUI() {
  q("#ultraPricePerBox").innerText = formatRp(calculatePrice());
  q("#ultraSubtotal").innerText = formatRp(calculateSubtotal());
  q("#ultraDiscount").innerText = "-" + formatRp(calculateDiskon());
  q("#ultraGrandTotal").innerText = formatRp(calculateGrandTotal());
}

/* ---------- Topping Logic ---------- */
function showTopping() {
  const mode = q('input[name="ultraToppingMode"]:checked')?.value;
  const isi = parseInt(q("#ultraIsi")?.value || "5");

  const singleEl = q("#ultraSingleGroup");
  const doubleEl = q("#ultraDoubleGroup");

  const toppingsSingle = ["Coklat", "Tiramisu", "Vanila", "Stroberi", "Cappucino"];
  const toppingsDouble = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

  singleEl.innerHTML = "";
  doubleEl.innerHTML = "";

  if(mode === "non") {
    singleEl.style.display = "none";
    doubleEl.style.display = "none";
    updatePriceUI();
    return;
  }

  if(mode === "single" || mode === "double") singleEl.style.display = "flex";
  if(mode === "double") doubleEl.style.display = "flex";

  if(mode === "single" || mode === "double") {
    toppingsSingle.forEach((t,i) => {
      if(i < isi) singleEl.innerHTML += `
        <label class="topping-check">
          <input type="checkbox" class="single-top" value="${t}">
          <span>${t}</span>
        </label>`;
    });
  }

  if(mode === "double") {
    toppingsDouble.forEach((t,i) => {
      if(i < isi) doubleEl.innerHTML += `
        <label class="topping-check">
          <input type="checkbox" class="double-top" value="${t}">
          <span>${t}</span>
        </label>`;
    });
  }

  updatePriceUI();
}

/* ---------- Event Listeners ---------- */
qAll('input[name="ultraToppingMode"]').forEach(el => el.addEventListener("change", showTopping));
qAll('input[name="ultraJenis"]').forEach(el => {
  el.addEventListener("change", () => {
    showTopping();
    updatePriceUI();
  });
});
["ultraIsi","ultraJumlah"].forEach(id => {
  q("#"+id)?.addEventListener("change", showTopping);
});
/* ======================================
   BAGIAN 2 — PUKIS LUMER AULIA SCRIPT FINAL
   ====================================== */

/* ---------- Form Submit Handler ---------- */
function handleFormSubmit(e) {
  e.preventDefault();

  const name = (q("#ultraNama")?.value || "").trim();
  const wa = (q("#ultraWA")?.value || "").trim();
  if(!name || !wa) return alert("Isi nama & nomor WhatsApp terlebih dahulu.");

  const order = getOrderFormData();

  const singleChecked = getChecked(".single-top").length;
  const doubleChecked = getChecked(".double-top").length;
  if(order.toppingType === "single" && singleChecked > order.isi) {
    return alert(`Maksimal ${order.isi} topping (single).`);
  }
  if(order.toppingType === "double" && (singleChecked > order.isi || doubleChecked > order.isi)) {
    return alert(`Maksimal ${order.isi} topping per grup (single/taburan).`);
  }

  saveOrderLocal(order);
  renderNota(order);
  q("#notaContainer")?.classList.add("show");
  q("#notaContainer .nota-card")?.scrollIntoView({behavior:"smooth"});
  console.log("[script] Order saved locally:", order);
  alert("Nota dibuat. Silakan cek dan tekan 'Cetak / PDF' atau 'Kirim WA Admin'.");
}
q("#formUltra")?.addEventListener("submit", handleFormSubmit);

/* ---------- LocalStorage Save Order ---------- */
function saveOrderLocal(order) {
  const arr = JSON.parse(localStorage.getItem("orders") || "[]");
  arr.push(order);
  localStorage.setItem("orders", JSON.stringify(arr));
}

/* ---------- Send WA Admin ---------- */
q("#ultraSendAdmin")?.addEventListener("click", () => {
  const order = getOrderFormData();
  if(!order.name || !order.wa) return alert("Isi nama & WA terlebih dahulu.");
  saveOrderLocal(order);

  const msgLines = [
    "Assalamu'alaikum",
    "Saya ingin memesan Pukis Lumer Aulia:",
    `Nama: ${order.name}`,
    `WA: ${order.wa}`,
    `Jenis: ${order.jenis}`,
    `Isi: ${order.isi} pcs`,
    `Mode: ${order.toppingType}`
  ];
  if(order.toppingType === "single") {
    msgLines.push(`Topping: ${order.singleTopping.join(", ") || "-"}`);
  } else if(order.toppingType === "double") {
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

/* ---------- Nota Print / PDF ---------- */
q("#notaPrint")?.addEventListener("click", async () => {
  const order = getOrderFormData();
  try {
    if(typeof window.generatePdf === "function") {
      await window.generatePdf({...order, branding:"full"});
    } else if(window.jspdf && window.jspdf.jsPDF) {
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
      if(order.singleTopping?.length) pdf.text(`Topping: ${order.singleTopping.join(", ")}`, 10, 60);
      if(order.doubleTopping?.length) pdf.text(`Taburan: ${order.doubleTopping.join(", ")}`, 10, 66);
      pdf.text(`Jumlah: ${order.jumlah}`, 10, 72);
      pdf.text(`Total: ${formatRp(order.total)}`, 10, 78);
      pdf.save(`${order.id || "Nota"}.pdf`);
    } else {
      alert("Fitur PDF tidak tersedia. Pastikan order.js sudah dimuat.");
    }
  } catch(err) {
    console.error("generatePdf error:", err);
    alert("Gagal membuat PDF: " + (err?.message || err));
  }
});

/* ---------- Nota Modal Close ---------- */
q("#notaClose")?.addEventListener("click", () => {
  q("#notaContainer")?.classList.remove("show");
});

/* ---------- Load & Submit Testimonials ---------- */
function loadTestimonials() {
  const container = q("#testimonialsList");
  const saved = JSON.parse(localStorage.getItem("testimonials") || "[]");
  container.innerHTML = "";
  saved.slice().reverse().forEach(t => {
    const li = document.createElement("li");
    li.className = "testimonial-card";
    li.innerHTML = `<strong>${escapeHtml(t.name)}</strong><br>${escapeHtml(t.testimonial)}`;
    container.appendChild(li);
  });
}
q("#testimonialForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = (q("#nameInput")?.value || "").trim();
  const text = (q("#testimonialInput")?.value || "").trim();
  if(!name || !text) return alert("Isi nama & testimoni.");
  const arr = JSON.parse(localStorage.getItem("testimonials") || "[]");
  arr.push({name,testimonial:text,createdAt:new Date().toISOString()});
  localStorage.setItem("testimonials", JSON.stringify(arr));
  q("#nameInput").value = ""; q("#testimonialInput").value = "";
  loadTestimonials();
  alert("Terima kasih, testimoni kamu sudah tersimpan!");
});

/* ---------- Floating Share Toggle ---------- */
q("#toggleShareBtn")?.addEventListener("click", () => {
  const icons = q("#floatingIcons");
  if(!icons) return;
  const shown = icons.classList.toggle("show");
  icons.setAttribute("aria-hidden", String(!shown));
  const btn = q("#toggleShareBtn");
  if(btn) btn.textContent = shown ? "✕" : "+";
});

/* ---------- Topping Check Visual & Limits ---------- */
document.addEventListener("change", (ev) => {
  const target = ev.target;
  if(!target) return;
  if(target.matches(".single-top, .double-top")) {
    const lbl = target.closest("label");
    if(lbl) target.checked ? lbl.classList.add("checked") : lbl.classList.remove("checked");

    const isi = parseInt(q("#ultraIsi")?.value || "5");
    const singleCount = getChecked(".single-top").length;
    const doubleCount = getChecked(".double-top").length;
    const mode = q('input[name="ultraToppingMode"]:checked')?.value || "non";

    if(mode==="single" && singleCount>isi) { target.checked=false; alert(`Maksimal ${isi} topping untuk single mode.`); }
    if(mode==="double"){
      if(target.classList.contains("single-top") && singleCount>isi){ target.checked=false; alert(`Maksimal ${isi} topping (single) untuk mode double.`); }
      if(target.classList.contains("double-top") && doubleCount>isi){ target.checked=false; alert(`Maksimal ${isi} taburan (double).`); }
    }
    updatePriceUI();
  }
});

/* ---------- Helper: escape HTML ---------- */
function escapeHtml(str=""){ return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- Init Final ---------- */
function initFinal(){
  loadTestimonials();
  if(typeof updatePriceUI==="function") updatePriceUI();
  if(typeof showTopping==="function") showTopping();
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded", initFinal);
}else{
  initFinal();
}
