/* ===============================
   ORDER.JS — PUKIS LUMER AULIA
   Final / Integrated — REVISION (pdf-fix v2)
   =============================== */

console.info("[order.js] Loaded — FINAL v2025.11 (pdf-fix v2)");

document.addEventListener("DOMContentLoaded", () => {

  /* ========== Utilities & DOM ========== */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const formatRp = n => "Rp " + Number(n || 0).toLocaleString("id-ID");
  const ADMIN_WA = "6281296668670";
  const STORAGE_ORDERS = "orders";
  const STORAGE_ALL_ORDERS = "allOrders";
  const STORAGE_TESTIMONIALS = "testimonials";

  // DOM
  const formUltra = $("#formUltra");
  const notaContainer = $("#notaContainer");
  const notaContent = $("#notaContent");
  const notaClose = $("#notaClose");
  const notaPrint = $("#notaPrint");
  const notaSendAdmin = $("#ultraSendAdmin");
  const ultraSingleGroup = $("#ultraSingleGroup");
  const ultraDoubleGroup = $("#ultraDoubleGroup");
  const ultraIsi = $("#ultraIsi");
  const ultraJumlah = $("#ultraJumlah");

  /* ========== Constants & PriceMap (same as before) ========== */
  const MAX_TOPPING = 5;
  const MAX_TABURAN = 5;
  const DISCOUNT_PER_BOX_BIG10 = 500;
  const PRICE_MAP = {
    Original: { "5": { non:10000, single:13000, double:15000 }, "10": { non:18000, single:25000, double:28000 } },
    Pandan:   { "5": { non:13000, single:15000, double:18000 }, "10": { non:25000, single:28000, double:32000 } }
  };
  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino"];
  const DOUBLE_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  /* ========== Helpers ========== */
  function getSelectedRadioValue(name){
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }
  function getCheckedValues(selector){
    return $$(`${selector}:checked`).map(cb => cb.value);
  }
  function safeGet(el, fallback=""){ return el ? el.value : fallback; }
  function nowInvoiceId(){
    const d = new Date();
    return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}${String(d.getSeconds()).padStart(2,"0")}-${Math.floor(Math.random()*900+100)}`;
  }

  /* ========== Queue helpers ========== */
  function getQueueInfo(){
    const keyDate = "queue_date";
    const keyNum = "queue_last";
    const today = new Date().toISOString().slice(0,10);
    const lastDate = localStorage.getItem(keyDate);
    if(lastDate !== today){
      localStorage.setItem(keyDate, today);
      localStorage.setItem(keyNum, "0");
    }
    return { keyDate, keyNum };
  }
  function nextQueueNumber(){
    const info = getQueueInfo();
    let n = parseInt(localStorage.getItem(info.keyNum) || "0", 10);
    n = n + 1;
    localStorage.setItem(info.keyNum, String(n));
    return n;
  }

  /* ========== Order calc & UI ========== */
  function calculateOrderData(){
    const jenis = getSelectedRadioValue("ultraJenis") || "Original";
    const isi = safeGet(ultraIsi,"5");
    const mode = getSelectedRadioValue("ultraToppingMode") || "non";
    const jumlahBox = parseInt(safeGet(ultraJumlah,"1"),10) || 1;
    const pricePerBox = (((PRICE_MAP[jenis]||{})[isi]||{})[mode]) || 0;
    const subtotal = pricePerBox * jumlahBox;
    const discount = (isi === "10" && jumlahBox >= 10) ? (DISCOUNT_PER_BOX_BIG10 * jumlahBox) : 0;
    const total = subtotal - discount;
    const topping = getCheckedValues(".ultraTopping");
    const taburan = mode==="double" ? getCheckedValues(".ultraTaburan") : [];
    const order = {
      orderID: nowInvoiceId(),
      queueNo: nextQueueNumber(),
      nama: safeGet($("#ultraNama"),"-"),
      wa: safeGet($("#ultraWA"),"-"),
      jenis, isi, mode, topping, taburan, jumlahBox,
      pricePerBox, subtotal, discount, total,
      note: safeGet($("#ultraNote"),"-"),
      createdAt: new Date().toISOString(),
      tgl: new Date().toLocaleString("id-ID")
    };
    // update UI
    if($("#ultraPricePerBox")) $("#ultraPricePerBox").innerText = formatRp(pricePerBox);
    if($("#ultraSubtotal")) $("#ultraSubtotal").innerText = formatRp(subtotal);
    if($("#ultraDiscount")) $("#ultraDiscount").innerText = (discount>0 ? "- " + formatRp(discount) : "-");
    if($("#ultraGrandTotal")) $("#ultraGrandTotal").innerText = formatRp(total);
    // save draft
    localStorage.setItem("lastOrderDraft", JSON.stringify(order));
    return order;
  }

  function renderToppings(){
    const mode = getSelectedRadioValue("ultraToppingMode") || "non";
    const isiVal = parseInt(safeGet(ultraIsi,"5"),10);
    if(ultraSingleGroup) ultraSingleGroup.innerHTML = "";
    if(ultraDoubleGroup) ultraDoubleGroup.innerHTML = "";
    if(mode === "non"){ if(ultraSingleGroup) ultraSingleGroup.style.display="none"; if(ultraDoubleGroup) ultraDoubleGroup.style.display="none"; return; }
    if(ultraSingleGroup) { ultraSingleGroup.style.display="flex"; ultraSingleGroup.style.flexWrap="wrap"; }
    if(mode==="double" && ultraDoubleGroup) ultraDoubleGroup.style.display="flex";
    SINGLE_TOPPINGS.forEach((t,i)=>{
      const show = i < isiVal;
      const html = `<label class="topping-check" style="display:${show?'inline-flex':'none'};align-items:center;padding:6px;margin:6px;border-radius:8px;border:1px solid #eee;cursor:pointer;">
                      <input type="checkbox" class="ultraTopping" value="${t}"> <span style="margin-left:8px;">${t}</span>
                    </label>`;
      if(ultraSingleGroup) ultraSingleGroup.insertAdjacentHTML("beforeend", html);
    });
    if(mode==="double" && ultraDoubleGroup){
      DOUBLE_TABURAN.forEach((t,i)=>{
        const show = i < isiVal;
        const html = `<label class="topping-check" style="display:${show?'inline-flex':'none'};align-items:center;padding:6px;margin:6px;border-radius:8px;border:1px solid #eee;cursor:pointer;">
                        <input type="checkbox" class="ultraTaburan" value="${t}"> <span style="margin-left:8px;">${t}</span>
                      </label>`;
        ultraDoubleGroup.insertAdjacentHTML("beforeend", html);
      });
    }
  }

  // initial
  renderToppings();
  calculateOrderData();

  /* ========== delegated topping limits ========== */
  document.addEventListener("change", (ev) => {
    const t = ev.target;
    if(!t) return;
    if(t.matches(".ultraTopping") || t.matches(".ultraTaburan")){
      const lbl = t.closest("label.topping-check");
      if(lbl){ if(t.checked) lbl.classList.add("checked"); else lbl.classList.remove("checked"); }
      const mode = getSelectedRadioValue("ultraToppingMode") || "non";
      const s = getCheckedValues(".ultraTopping").length;
      const d = getCheckedValues(".ultraTaburan").length;
      const allowable = parseInt(safeGet(ultraIsi,"5"),10);
      const capTop = Math.min(MAX_TOPPING, allowable), capTab = Math.min(MAX_TABURAN, allowable);
      if(mode==="single" && s>capTop){ t.checked=false; alert(`Maksimal ${capTop} topping untuk Single.`); }
      if(mode==="double"){
        if(t.classList.contains("ultraTopping") && s>capTop){ t.checked=false; alert(`Maksimal ${capTop} topping.`); }
        if(t.classList.contains("ultraTaburan") && d>capTab){ t.checked=false; alert(`Maksimal ${capTab} taburan.`); }
      }
      calculateOrderData();
    }
  });

  $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener("change", () => { renderToppings(); calculateOrderData(); }));
  $$('input[name="ultraJenis"]').forEach(r => r.addEventListener("change", calculateOrderData));
  if(ultraIsi) ultraIsi.addEventListener("change", () => { renderToppings(); calculateOrderData(); });
  if(ultraJumlah) ultraJumlah.addEventListener("input", calculateOrderData);

  /* ========== End DOMContentLoaded block ========== */
}); // end DOM ready


/* ===============================
   PART 2: Submit, storage, PDF generator (with dynamic loader & normalization)
   =============================== */
(function(){
  const $ = s => document.querySelector(s);
  const formatRp = n => "Rp " + Number(n || 0).toLocaleString("id-ID");
  const ADMIN_WA = "6281296668670";
  const STORAGE_ORDERS = "orders";
  const STORAGE_ALL_ORDERS = "allOrders";
  const STORAGE_TESTIMONIALS = "testimonials";

  // loader overlay
  function showLoader(msg="Memproses..."){
    let el = document.getElementById("order-loader-overlay");
    if(!el){
      el = document.createElement("div");
      el.id = "order-loader-overlay";
      el.style.position = "fixed"; el.style.inset = "0"; el.style.background = "rgba(0,0,0,0.45)";
      el.style.display = "flex"; el.style.alignItems = "center"; el.style.justifyContent = "center"; el.style.zIndex = "99999";
      el.innerHTML = `<div style="background:#fff;padding:18px 22px;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:8px;">
                        <div style="width:42px;height:42px;border-radius:50%;border:4px solid #eee;border-top-color:#ff5e7e;animation:spin 1s linear infinite"></div>
                        <div style="font-weight:600">${msg}</div>
                      </div>
                      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
      document.body.appendChild(el);
    }
    el.style.display = "flex";
  }
  function hideLoader(){ const el = document.getElementById("order-loader-overlay"); if(el) el.style.display = "none"; }

  function restoreDraft(){
    try{
      const d = JSON.parse(localStorage.getItem("lastOrderDraft") || "{}");
      if(d && d.nama && !$("#ultraNama").value) $("#ultraNama").value = d.nama;
      if(d && d.wa && !$("#ultraWA").value) $("#ultraWA").value = d.wa;
    }catch(e){}
  }

  function persistOrder(order){
    try{
      const arr = JSON.parse(localStorage.getItem(STORAGE_ORDERS) || "[]");
      arr.push(order); localStorage.setItem(STORAGE_ORDERS, JSON.stringify(arr));
      const arr2 = JSON.parse(localStorage.getItem(STORAGE_ALL_ORDERS) || "[]");
      arr2.push(order); localStorage.setItem(STORAGE_ALL_ORDERS, JSON.stringify(arr2));
      localStorage.setItem("lastOrder", JSON.stringify(order));
    }catch(e){ console.error("persistOrder error", e); }
  }

  function validateOrder(order){
    if(!order.nama || String(order.nama).trim().length < 2) return "Nama pemesan tidak valid.";
    if(!order.wa || !/^\d{8,15}$/.test(order.wa.replace(/\D/g,''))) return "Nomor WA tidak valid (min 8 digit).";
    if(!order.jenis) return "Pilih jenis pukis.";
    if(!order.isi) return "Pilih isi per box.";
    return null;
  }

  function escapeHtml(str=""){ return String(str).replace(/[&<>\"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[m])); }

  // render nota in overlay
  function renderNota(order){
    const c = $("#notaContent"); if(!c) return;
    const toppingDisplay = (order.mode === "single") ? (order.topping.join(", ") || "-") : (order.mode === "double" ? (order.topping.join(", ") || "-") : "-");
    const taburanDisplay = order.mode === "double" ? (order.taburan.join(", ") || "-") : "-";
    const html = `
      <p><strong>Order ID:</strong> ${order.orderID || order.id || "-"}</p>
      <p><strong>Nomor Antrian:</strong> ${order.queueNo || "-"}</p>
      <p><strong>Nama:</strong> ${escapeHtml(order.nama)}</p>
      <p><strong>WA:</strong> ${escapeHtml(order.wa)}</p>
      <p><strong>Jenis:</strong> ${order.jenis}</p>
      <p><strong>Isi per Box:</strong> ${order.isi} pcs</p>
      <p><strong>Mode Topping:</strong> ${order.mode}</p>
      ${order.mode === "single" ? `<p><strong>Topping:</strong> ${escapeHtml(toppingDisplay)}</p>` : ""}
      ${order.mode === "double" ? `<p><strong>Topping:</strong> ${escapeHtml(toppingDisplay)}</p><p><strong>Taburan:</strong> ${escapeHtml(taburanDisplay)}</p>` : ""}
      <p><strong>Jumlah Box:</strong> ${order.jumlahBox}</p>
      <p><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</p>
      <p><strong>Diskon:</strong> ${order.discount>0?("- " + formatRp(order.discount)) : "-"}</p>
      <p style="font-weight:700;"><strong>Total:</strong> ${formatRp(order.total)}</p>
      <p><strong>Catatan:</strong> ${escapeHtml(order.note)}</p>
      <p style="margin-top:10px;text-align:center;">Terimakasih sudah Belanja di toko Kami 🙏</p>
    `;
    c.innerHTML = html;
  }

  function getCurrentOrderFromDraft(){
    try{ const d = JSON.parse(localStorage.getItem("lastOrderDraft") || "{}"); return d && (d.orderID||d.id) ? d : null; }catch(e){ return null; }
  }

  // Form submit: create order, persist, render nota
  $("#formUltra")?.addEventListener("submit", (e) => {
    e.preventDefault();
    let order = getCurrentOrderFromDraft();
    if(!order){
      if(typeof window.calculateOrderData === "function") order = window.calculateOrderData() || getCurrentOrderFromDraft();
      else {
        // fallback simple collect
        const jenis = getSelectedRadioValue("ultraJenis") || "Original";
        const isi = ($("#ultraIsi")?$("#ultraIsi").value:"5");
        const mode = getSelectedRadioValue("ultraToppingMode") || "non";
        const jumlahBox = parseInt($("#ultraJumlah")?$("#ultraJumlah").value:1,10) || 1;
        order = {
          orderID: "INV-"+Date.now(),
          queueNo: nextQueueNumber(),
          nama: $("#ultraNama")?$("#ultraNama").value:"-",
          wa: $("#ultraWA")?$("#ultraWA").value:"-",
          jenis, isi, mode, topping: getCheckedValues(".ultraTopping"), taburan: getCheckedValues(".ultraTaburan"),
          jumlahBox, pricePerBox:0, subtotal:0, discount:0, total:0, note: $("#ultraNote")?$("#ultraNote").value:"-",
          createdAt: new Date().toISOString(), tgl: new Date().toLocaleString("id-ID")
        };
      }
    }
    const v = validateOrder(order); if(v){ alert(v); return; }
    persistOrder(order);
    renderNota(order);
    const nc = $("#notaContainer");
    if(nc) nc.style.display = "flex";
    alert("Nota dibuat. Silakan cek dan tekan 'Cetak / PDF' atau 'Kirim WA Admin'.");
  });

  // close nota
  $("#notaClose")?.addEventListener("click", ()=>{ const nc = $("#notaContainer"); if(nc) nc.style.display = "none"; });

  // send WA admin
  $("#ultraSendAdmin")?.addEventListener("click", ()=>{
    const order = JSON.parse(localStorage.getItem("lastOrder") || "{}");
    if(!order || !order.nama) return alert("Tidak ada data order untuk dikirim. Buat nota terlebih dahulu.");
    const lines = [
      "Assalamu'alaikum",
      "Saya ingin memesan Pukis Lumer Aulia:",
      `Order ID: ${order.orderID || order.id || "-"}`,
      `Nama: ${order.nama}`,
      `WA: ${order.wa}`,
      `Jenis: ${order.jenis} — ${order.isi} pcs`,
      `Mode: ${order.mode}`
    ];
    if(order.mode === "single") lines.push(`Topping: ${order.topping.join(", ") || "-"}`);
    if(order.mode === "double") { lines.push(`Topping: ${order.topping.join(", ") || "-"}`); lines.push(`Taburan: ${order.taburan.join(", ") || "-"}`); }
    lines.push(`Jumlah Box: ${order.jumlahBox}`); lines.push(`Total: ${formatRp(order.total)}`); lines.push(`Catatan: ${order.note}`); lines.push(""); lines.push("Terima kasih 🙏");
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  });

  /* ========== Testimonials fallback ========== */
  $("#testimonialForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = ($("#nameInput")?.value || "").trim();
    const text = ($("#testimonialInput")?.value || "").trim();
    if(!name || !text) return alert("Isi nama & testimoni.");
    const arr = JSON.parse(localStorage.getItem(STORAGE_TESTIMONIALS) || "[]");
    arr.push({ name, testimonial: text, createdAt: new Date().toISOString(), status: "pending" });
    localStorage.setItem(STORAGE_TESTIMONIALS, JSON.stringify(arr));
    $("#nameInput").value = ""; $("#testimonialInput").value = ""; alert("Terima kasih — testimoni terkirim untuk moderasi admin.");
    if(typeof window.loadTestimonials === "function"){ try{ window.loadTestimonials(); }catch(e){ } }
  });

  function loadTestimonialsFallback(){
    const container = $("#testimonialsList"); if(!container) return;
    const all = JSON.parse(localStorage.getItem(STORAGE_TESTIMONIALS) || "[]");
    container.innerHTML = "";
    all.filter(t => t.status === "approved").slice().reverse().forEach(t => {
      const li = document.createElement("li"); li.className = "testimonial-card";
      li.innerHTML = `<strong>${escapeHtml(t.name)}</strong><br>${escapeHtml(t.testimonial)}`; container.appendChild(li);
    });
  }
  if(typeof window.loadTestimonials === "function") { try{ window.loadTestimonials(); }catch(e){ loadTestimonialsFallback(); } } else loadTestimonialsFallback();

  /* ========== PDF: ensure jsPDF & autotable loaded (dynamic) ========== */
  function ensureJsPdfLoaded(){
    return new Promise((resolve, reject) => {
      if(window.jspdf && window.jspdf.jsPDF) return resolve();
      // Load jspdf
      const cdnJs = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      const cdnAuto = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";
      let loaded = 0;
      function oneLoaded(){ loaded++; if(loaded===2) setTimeout(()=>resolve(),50); }
      // inject jspdf
      const s1 = document.createElement("script");
      s1.src = cdnJs; s1.async = true;
      s1.onload = oneLoaded; s1.onerror = () => { console.error("Failed loading jsPDF"); reject(new Error("Failed loading jsPDF")); };
      document.head.appendChild(s1);
      // inject autotable
      const s2 = document.createElement("script");
      s2.src = cdnAuto; s2.async = true;
      s2.onload = oneLoaded; s2.onerror = () => { console.warn("autoTable not loaded (it's optional)"); oneLoaded(); };
      document.head.appendChild(s2);
    });
  }

  /* ========== generatePdf with normalization & graceful errors ========== */
  async function generatePdf(order){
    showLoader("Membuat PDF...");
    try{
      // normalize order object (handle older shape with id)
      if(order && order.id && !order.orderID) order.orderID = order.id;
      // ensure libs
      await ensureJsPdfLoaded();
      const { jsPDF } = window.jspdf || window;
      if(!jsPDF) throw new Error("jsPDF tidak tersedia setelah pemuatan.");
      const pdf = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
      const fmtRp = n => "Rp " + Number(n||0).toLocaleString("id-ID");
      // helper to load image
      async function loadImage(src){ return new Promise(resolve => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; }); }
      const [logoImg, ttdImg, qrisImg] = await Promise.all([
        loadImage("assets/images/logo.png"),
        loadImage("assets/images/ttd.png"),
        loadImage("assets/images/qris-pukis.jpg")
      ]);
      // watermark/header...
      pdf.setTextColor(220,220,220); pdf.setFontSize(48);
      pdf.text("PUKIS LUMER AULIA", pdf.internal.pageSize.getWidth()/2, pdf.internal.pageSize.getHeight()/2, {align:"center", angle:45});
      pdf.setTextColor(0,0,0); pdf.setFontSize(14); pdf.setFont("helvetica","bold");
      pdf.text("INVOICE", 14, 16);
      pdf.setFontSize(20); pdf.setTextColor(214,51,108);
      pdf.text("PUKIS LUMER AULIA", pdf.internal.pageSize.getWidth()/2, 22, {align:"center"});
      pdf.setTextColor(0,0,0); pdf.setFontSize(9);
      if(logoImg) try{ pdf.addImage(logoImg, "PNG", pdf.internal.pageSize.getWidth()-55, 6, 40, 20); }catch(e){}
      pdf.text("Pasar Kuliner Padang Panjang", pdf.internal.pageSize.getWidth()-10, 28, {align:"right"});
      pdf.text("📞 0812-9666-8670", pdf.internal.pageSize.getWidth()-10, 32, {align:"right"});
      pdf.line(10,36, pdf.internal.pageSize.getWidth()-10,36);
      // meta
      let y = 44; pdf.setFontSize(10);
      pdf.text(`Order ID: ${order.orderID || order.id || "-"}`, 14, y);
      pdf.text(`Tanggal: ${order.tgl || order.createdAt || "-"}`, pdf.internal.pageSize.getWidth()-14, y, {align:"right"});
      y+=7; pdf.text(`No. Antrian: ${order.queueNo || "-"}`, 14, y); pdf.text(`Invoice by: Pukis Lumer Aulia`, pdf.internal.pageSize.getWidth()-14, y, {align:"right"}); y+=8;
      // customer
      pdf.text(`Nama: ${order.nama || "-"}`, 14, y); pdf.text(`WA: ${order.wa || "-"}`, pdf.internal.pageSize.getWidth()-14, y, {align:"right"}); y+=7;
      pdf.text(`Jenis: ${order.jenis || "-"} — ${order.isi || "-"} pcs`, 14, y); y+=7;
      pdf.text(`Mode: ${order.mode || "-"}`, 14, y); y+=7;
      if(order.mode === "single") { pdf.text(`Topping: ${order.topping?.join(", ")||"-"}`, 14, y); y+=7; }
      if(order.mode === "double") { pdf.text(`Topping: ${order.topping?.join(", ")||"-"}`, 14, y); y+=7; pdf.text(`Taburan: ${order.taburan?.join(", ")||"-"}`, 14, y); y+=7; }
      if(order.note && order.note !== "-"){ pdf.text("Catatan:", 14, y); y+=6; const split = pdf.splitTextToSize(order.note, pdf.internal.pageSize.getWidth()-28); pdf.text(split, 14, y); y += (split.length*6)+4; } else y+=4;
      // table (autotable if available)
      const desc = `${order.jenis || "-"} — ${order.isi || "-"} pcs` + (order.mode === "non" ? " (Tanpa Topping)" : (order.mode === "single" ? ` | Topping: ${order.topping?.join(", ")||"-"}` : ` | Topping: ${order.topping?.join(", ")||"-"} | Taburan: ${order.taburan?.join(", ")||"-"}`));
      if(pdf.autoTable){
        pdf.autoTable({ startY: y, head: [["Deskripsi","Harga/Box","Jumlah","Total"]], body: [[desc, fmtRp(order.pricePerBox), `${order.jumlahBox} Box`, fmtRp(order.total)]], theme: "grid", headStyles: { fillColor: [214,51,108], textColor: 255 }, styles: { fontSize: 10 } });
      } else {
        pdf.text("Deskripsi", 14, y); pdf.text("Harga", 100, y); pdf.text("Jumlah", 140, y); pdf.text("Total", 170, y); y+=6;
        pdf.text(desc, 14, y); try{ pdf.text(fmtRp(order.pricePerBox), 100, y); }catch(e){}; pdf.text(`${order.jumlahBox} Box`, 140, y); pdf.text(fmtRp(order.total), 170, y); y+=10;
      }
      const lastY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 8 : y + 20;
      pdf.setFontSize(11); pdf.text(`Subtotal: ${fmtRp(order.subtotal)}`, pdf.internal.pageSize.getWidth()-14, lastY, {align:"right"});
      if(order.discount>0) pdf.text(`Disc: -${fmtRp(order.discount)}`, pdf.internal.pageSize.getWidth()-14, lastY+6, {align:"right"});
      pdf.setFont("helvetica","bold"); pdf.text(`Total Bayar: ${fmtRp(order.total)}`, pdf.internal.pageSize.getWidth()-14, lastY + (order.discount>0?14:8), {align:"right"});
      let footerY = lastY + (order.discount>0?24:18);
      if(qrisImg) try{ pdf.addImage(qrisImg, "PNG", 14, footerY+4, 36, 36); }catch(e){}
      if(ttdImg) try{ pdf.addImage(ttdImg, "PNG", pdf.internal.pageSize.getWidth()-60, footerY+4, 46, 22); }catch(e){}
      pdf.setFontSize(10); pdf.text("Hormat Kami,", pdf.internal.pageSize.getWidth()-60, footerY+30);
      pdf.setFontSize(11); pdf.text("Terimakasih sudah Belanja di toko Kami 🙏", pdf.internal.pageSize.getWidth()/2, footerY+60, {align:"center"});
      // save
      const filename = `Invoice_${(order.nama||"Pelanggan").replace(/\s+/g,"_")}_${(order.orderID||order.id||Date.now())}.pdf`;
      pdf.save(filename);
      hideLoader(); return true;
    }catch(err){
      hideLoader();
      console.error("generatePdf error:", err);
      alert("Gagal membuat PDF: " + (err?.message || err));
      return false;
    }
  }

  // Protect from multiple installations of the print handler
  try{
    if(!window._notaPrintInstalled){
      window._notaPrintInstalled = true;
      // remove inline onclick if present
      const btn = $("#notaPrint");
      if(btn) try{ btn.onclick = null; }catch(e){}
      // attach
      $("#notaPrint")?.addEventListener("click", async ()=>{
        const lastRaw = localStorage.getItem("lastOrder") || "{}";
        let last;
        try{ last = JSON.parse(lastRaw); }catch(e){ last = {}; }
        // support older shape
        if(last && last.id && !last.orderID) last.orderID = last.id;
        if(!last || (!last.orderID && !last.id)) return alert("Tidak ada order untuk dicetak. Buat nota dulu.");
        await generatePdf(last);
      });
    }
  }catch(e){ console.warn("notaPrint attach issue", e); }

  // expose some helpers for console/debug
  window._orderHelpers = {
    generatePdf: generatePdf,
    persistOrder: function(o){ persistOrder(o); },
    restoreDraft: restoreDraft
  };

  // try to restore draft on load
  try{ restoreDraft(); }catch(e){}
})();
