/* ===============================
   ORDER.JS — PUKIS LUMER AULIA
   Final / Integrated — PART 1
   Blocks: 1..8
   =============================== */
console.info("[order.js] Loaded — FINAL v2025.11");

document.addEventListener("DOMContentLoaded", () => {
  /* ========== Block 1: Utilities & DOM ========== */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const formatRp = n => "Rp " + Number(n || 0).toLocaleString("id-ID");
  const ADMIN_WA = "6281296668670"; // admin WA (sesuai instruksi)
  const STORAGE_ORDERS = "orders";      // kompatibilitas lama
  const STORAGE_ALL_ORDERS = "allOrders"; // versi baru
  const STORAGE_TESTIMONIALS = "testimonials";

  // DOM elements (must match HTML)
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

  /* ========== Block 2: Constants ========== */
  const MAX_TOPPING = 5;
  const MAX_TABURAN = 5;
  // Discount rule: Rp 500/box if beli >= 10 box BESAR (isi === "10")
  const DISCOUNT_PER_BOX_BIG10 = 500;

  // Price table (as requested)
  const PRICE_MAP = {
    Original: {
      "5": { non: 10000, single: 13000, double: 15000 },   // box kecil (5 pcs)
      "10": { non: 18000, single: 25000, double: 28000 }   // box besar (10 pcs)
    },
    Pandan: {
      "5": { non: 13000, single: 15000, double: 18000 },
      "10": { non: 25000, single: 28000, double: 32000 }
    }
  };

  const SINGLE_TOPPINGS = ["Coklat", "Tiramisu", "Vanilla", "Stroberi", "Cappucino"];
  const DOUBLE_TABURAN = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

  /* ========== Block 3: Helpers ========== */
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

  /* ========== Block 4: Queue / Antrian (auto reset harian) ========== */
  function getQueueInfo(){
    const keyDate = "queue_date";
    const keyNum = "queue_last";
    const today = new Date().toISOString().slice(0,10);
    const lastDate = localStorage.getItem(keyDate);
    let lastNum = parseInt(localStorage.getItem(keyNum) || "0", 10);

    if(lastDate !== today){
      // reset
      localStorage.setItem(keyDate, today);
      localStorage.setItem(keyNum, "0");
      lastNum = 0;
    }
    return { keyDate, keyNum, lastNum };
  }
  function nextQueueNumber(){
    const info = getQueueInfo();
    let n = parseInt(localStorage.getItem(info.keyNum) || "0", 10);
    n = n + 1;
    localStorage.setItem(info.keyNum, String(n));
    return n;
  }

  /* ========== Block 5: Price / Order calculation ========== */
  let currentOrder = {}; // will hold computed data

  function calculateOrderData(){
    const jenis = getSelectedRadioValue("ultraJenis") || "Original";
    const isi = safeGet(ultraIsi, "5");
    const mode = getSelectedRadioValue("ultraToppingMode") || "non";
    const jumlahBox = parseInt(safeGet(ultraJumlah, "1"), 10) || 1;

    const pricePerBox = ((PRICE_MAP[jenis]||{})[isi]||{})[mode] || 0;
    const subtotal = pricePerBox * jumlahBox;

    // discount only if buying box besar (isi == "10") AND jumlahBox >= 10
    const discount = (isi === "10" && jumlahBox >= 10) ? (DISCOUNT_PER_BOX_BIG10 * jumlahBox) : 0;
    const total = subtotal - discount;

    // toppings
    const topping = getCheckedValues(".ultraTopping");
    const taburan = mode === "double" ? getCheckedValues(".ultraTaburan") : [];

    const invoice = nowInvoiceId();
    const queueNo = nextQueueNumber();

    currentOrder = {
      orderID: invoice,
      queueNo,
      nama: safeGet($("#ultraNama"), "-"),
      wa: safeGet($("#ultraWA"), "-"),
      jenis,
      isi,
      mode,
      topping,
      taburan,
      jumlahBox,
      pricePerBox,
      subtotal,
      discount,
      total,
      note: safeGet($("#ultraNote"), "-"),
      createdAt: new Date().toISOString(),
      tgl: new Date().toLocaleString("id-ID")
    };

    // update UI
    $("#ultraPricePerBox").innerText = formatRp(pricePerBox);
    $("#ultraSubtotal").innerText = formatRp(subtotal);
    $("#ultraDiscount").innerText = discount > 0 ? "- " + formatRp(discount) : "-";
    $("#ultraGrandTotal").innerText = formatRp(total);

    // persist small copy to avoid losing while editing
    localStorage.setItem("lastOrderDraft", JSON.stringify(currentOrder));

    return currentOrder;
  }

  /* ========== Block 6: Topping UI render & enforcement ========== */
  function renderToppings(){
    const mode = getSelectedRadioValue("ultraToppingMode") || "non";
    const isiVal = parseInt(safeGet(ultraIsi,"5"),10);

    // clear groups
    if(ultraSingleGroup) ultraSingleGroup.innerHTML = "";
    if(ultraDoubleGroup) ultraDoubleGroup.innerHTML = "";

    if(mode === "non"){
      if(ultraSingleGroup) ultraSingleGroup.style.display = "none";
      if(ultraDoubleGroup) ultraDoubleGroup.style.display = "none";
      return;
    }

    // show single group for both single & double
    if(ultraSingleGroup) { ultraSingleGroup.style.display = "flex"; ultraSingleGroup.style.flexWrap = "wrap"; }
    if(mode === "double" && ultraDoubleGroup) ultraDoubleGroup.style.display = "flex";

    // Single toppings (limit by isi)
    SINGLE_TOPPINGS.forEach((t,i)=>{
      const show = i < isiVal;
      const html = `<label class="topping-check" style="display:${show?'inline-flex':'none'};align-items:center;padding:6px;margin:6px;border-radius:8px;border:1px solid #eee;cursor:pointer;">
                      <input type="checkbox" class="ultraTopping" value="${t}"> <span style="margin-left:8px;">${t}</span>
                    </label>`;
      if(ultraSingleGroup) ultraSingleGroup.insertAdjacentHTML("beforeend", html);
    });

    // Taburan (only for double)
    if(mode === "double" && ultraDoubleGroup){
      DOUBLE_TABURAN.forEach((t,i)=>{
        const show = i < isiVal;
        const html = `<label class="topping-check" style="display:${show?'inline-flex':'none'};align-items:center;padding:6px;margin:6px;border-radius:8px;border:1px solid #eee;cursor:pointer;">
                        <input type="checkbox" class="ultraTaburan" value="${t}"> <span style="margin-left:8px;">${t}</span>
                      </label>`;
        ultraDoubleGroup.insertAdjacentHTML("beforeend", html);
      });
    }

    // attach change listeners (delegated handled global)
  }

  /* ========== Block 7: Topping limits enforcement (delegated) ========== */
  document.addEventListener("change", (ev) => {
    const t = ev.target;
    if(!t) return;
    // visual toggle on label
    if(t.matches(".ultraTopping") || t.matches(".ultraTaburan")){
      const lbl = t.closest("label.topping-check");
      if(lbl) {
        if(t.checked) lbl.classList.add("checked");
        else lbl.classList.remove("checked");
      }
      // enforce limits
      const mode = getSelectedRadioValue("ultraToppingMode") || "non";
      const selectedT = getCheckedValues(".ultraTopping");
      const selectedTb = getCheckedValues(".ultraTaburan");
      const allowable = parseInt(safeGet(ultraIsi,"5"),10);
      // caps are per-request MAX_TOPPING/MAX_TABURAN but ideally equal to 'isi'
      const capTop = Math.min(MAX_TOPPING, allowable);
      const capTab = Math.min(MAX_TABURAN, allowable);

      if(mode === "single" && selectedT.length > capTop){
        t.checked = false;
        alert(`Maksimal ${capTop} topping untuk Single.`);
      }
      if(mode === "double"){
        if(t.classList.contains("ultraTopping") && selectedT.length > capTop){
          t.checked = false; alert(`Maksimal ${capTop} topping.`);
        }
        if(t.classList.contains("ultraTaburan") && selectedTb.length > capTab){
          t.checked = false; alert(`Maksimal ${capTab} taburan.`);
        }
      }
      // recalc UI numbers
      calculateOrderData();
    }
  });

  /* ========== Block 8: Event wiring for inputs ========== */
  // when user changes topping mode / jenis / isi / jumlah, update UI
  $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener("change", () => { renderToppings(); calculateOrderData(); }));
  $$('input[name="ultraJenis"]').forEach(r => r.addEventListener("change", calculateOrderData));
  if(ultraIsi) ultraIsi.addEventListener("change", () => { renderToppings(); calculateOrderData(); });
  if(ultraJumlah) ultraJumlah.addEventListener("input", calculateOrderData);

  // initial render
  renderToppings();
  calculateOrderData();

  /* ========== End of PART 1 blocks ==========
     Continue to PART 2 (submit, storage, PDF, helpers)
  */
});

/* ===============================
   ORDER.JS — PUKIS LUMER AULIA
   Final / Integrated — PART 2
   Blocks: 9..end
   =============================== */
(function(){ // keep scope isolated for subsequent functions
  const $ = s => document.querySelector(s);
  const formatRp = n => "Rp " + Number(n || 0).toLocaleString("id-ID");
  const ADMIN_WA = "6281296668670";
  const STORAGE_ORDERS = "orders";
  const STORAGE_ALL_ORDERS = "allOrders";
  const STORAGE_TESTIMONIALS = "testimonials";

  // create a lightweight loading overlay for PDF generation
  function showLoader(msg="Memproses..."){
    let el = document.getElementById("order-loader-overlay");
    if(!el){
      el = document.createElement("div");
      el.id = "order-loader-overlay";
      el.style.position = "fixed";
      el.style.inset = "0";
      el.style.background = "rgba(0,0,0,0.45)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.zIndex = "99999";
      el.innerHTML = `<div style="background:#fff;padding:18px 22px;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:8px;">
                        <div class="loader-spinner" style="width:42px;height:42px;border-radius:50%;border:4px solid #eee;border-top-color:#ff5e7e;animation:spin 1s linear infinite"></div>
                        <div style="font-weight:600">${msg}</div>
                      </div>
                      <style>
                        @keyframes spin{to{transform:rotate(360deg)}}
                      </style>`;
      document.body.appendChild(el);
    }
    el.style.display = "flex";
  }
  function hideLoader(){
    const el = document.getElementById("order-loader-overlay");
    if(el) el.style.display = "none";
  }

  // load last draft if exists and populate form (non-destructive)
  function restoreDraft(){
    try{
      const d = JSON.parse(localStorage.getItem("lastOrderDraft") || "{}");
      if(d && d.nama && !$("#ultraNama").value) $("#ultraNama").value = d.nama;
      if(d && d.wa && !$("#ultraWA").value) $("#ultraWA").value = d.wa;
      // don't override selection if user already changed
    }catch(e){ /* ignore */ }
  }

  // Save order copies to storage keys used by admin (both keys for compatibility)
  function persistOrder(order){
    try{
      // orders (legacy)
      const arr = JSON.parse(localStorage.getItem(STORAGE_ORDERS) || "[]");
      arr.push(order);
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(arr));

      // allOrders (new)
      const arr2 = JSON.parse(localStorage.getItem(STORAGE_ALL_ORDERS) || "[]");
      arr2.push(order);
      localStorage.setItem(STORAGE_ALL_ORDERS, JSON.stringify(arr2));

      // also save lastOrder for print/cetak ulang quick access
      localStorage.setItem("lastOrder", JSON.stringify(order));
    }catch(e){ console.error("persistOrder error", e); }
  }

  // validate minimal fields
  function validateOrder(order){
    if(!order.nama || String(order.nama).trim().length < 2) return "Nama pemesan tidak valid.";
    if(!order.wa || !/^\d{8,15}$/.test(order.wa.replace(/\D/g,''))) return "Nomor WA tidak valid (min 8 digit).";
    if(!order.jenis) return "Pilih jenis pukis.";
    if(!order.isi) return "Pilih isi per box.";
    return null;
  }

  // render nota in overlay (reuse existing notaContent)
  function renderNota(order){
    const c = $("#notaContent");
    if(!c) return;
    const toppingDisplay = (order.mode === "single") ? (order.topping.join(", ") || "-") : (order.mode === "double" ? (order.topping.join(", ") || "-") : "-");
    const taburanDisplay = order.mode === "double" ? (order.taburan.join(", ") || "-") : "-";
    const html = `
      <p><strong>Order ID:</strong> ${order.orderID}</p>
      <p><strong>Nomor Antrian:</strong> ${order.queueNo}</p>
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

  // produce a sanitized copy of currentOrder from draft
  function getCurrentOrderFromDraft(){
    try{
      const d = JSON.parse(localStorage.getItem("lastOrderDraft") || "{}");
      return d && d.orderID ? d : null;
    }catch(e){ return null; }
  }

  // handle form submit
  $("#formUltra")?.addEventListener("submit", (e) => {
    e.preventDefault();
    // recompute order (call function declared in PART1)
    // PART1 sets currentOrder via calculateOrderData() & saved to lastOrderDraft.
    // we attempt to use the draft; otherwise recompute by triggering events:
    let order = getCurrentOrderFromDraft();
    if(!order){
      // try to call calculateOrderData if available (it is in PART1)
      if(typeof window.calculateOrderData === "function"){
        order = window.calculateOrderData() || getCurrentOrderFromDraft();
      } else {
        // fallback read fields directly
        const jenis = getSelectedRadioValue("ultraJenis") || "Original";
        const isi = ($("#ultraIsi")?$("#ultraIsi").value:"5");
        const mode = getSelectedRadioValue("ultraToppingMode") || "non";
        const jumlahBox = parseInt($("#ultraJumlah")?$("#ultraJumlah").value:1,10) || 1;
        order = {
          orderID: "INV-"+Date.now(),
          queueNo: nextQueueNumber(),
          nama: $("#ultraNama")?$("#ultraNama").value:"-",
          wa: $("#ultraWA")?$("#ultraWA").value:"-",
          jenis, isi, mode,
          topping: getCheckedValues(".ultraTopping"),
          taburan: getCheckedValues(".ultraTaburan"),
          jumlahBox,
          pricePerBox: 0,
          subtotal: 0,
          discount: 0,
          total: 0,
          note: $("#ultraNote")?$("#ultraNote").value:"-",
          createdAt: new Date().toISOString(),
          tgl: new Date().toLocaleString("id-ID")
        };
      }
    }

    // Validate
    const v = validateOrder(order);
    if(v){ alert(v); return; }

    // Persist
    persistOrder(order);

    // Render nota & show
    renderNota(order);
    const nc = $("#notaContainer");
    if(nc) nc.style.display = "flex";

    // Save testimonials? (not here) — but we already save to storage

    // quick message
    alert("Nota dibuat. Silakan cek dan tekan 'Cetak / PDF' atau 'Kirim WA Admin'.");

  });

  // close nota
  $("#notaClose")?.addEventListener("click", ()=>{ const nc = $("#notaContainer"); if(nc) nc.style.display = "none"; });

  // Send WA Admin
  $("#ultraSendAdmin")?.addEventListener("click", ()=>{
    // use lastOrder if exists
    const order = JSON.parse(localStorage.getItem("lastOrder") || "{}");
    if(!order || !order.nama) return alert("Tidak ada data order untuk dikirim. Buat nota terlebih dahulu.");
    const lines = [
      "Assalamu'alaikum",
      "Saya ingin memesan Pukis Lumer Aulia:",
      `Order ID: ${order.orderID}`,
      `Nama: ${order.nama}`,
      `WA: ${order.wa}`,
      `Jenis: ${order.jenis} — ${order.isi} pcs`,
      `Mode: ${order.mode}`,
    ];
    if(order.mode === "single") lines.push(`Topping: ${order.topping.join(", ") || "-"}`);
    if(order.mode === "double") { lines.push(`Topping: ${order.topping.join(", ") || "-"}`); lines.push(`Taburan: ${order.taburan.join(", ") || "-"}`); }
    lines.push(`Jumlah Box: ${order.jumlahBox}`);
    lines.push(`Total: ${formatRp(order.total)}`);
    lines.push(`Catatan: ${order.note}`);
    lines.push("");
    lines.push("Terima kasih 🙏");
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  });

  /* ====== Block: Testimonial handling with admin moderation ====== */
  // Save testimonial as pending for moderation
  $("#testimonialForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = ($("#nameInput")?.value || "").trim();
    const text = ($("#testimonialInput")?.value || "").trim();
    if(!name || !text) return alert("Isi nama & testimoni.");
    const arr = JSON.parse(localStorage.getItem(STORAGE_TESTIMONIALS) || "[]");
    // store with status pending
    arr.push({ name, testimonial: text, createdAt: new Date().toISOString(), status: "pending" });
    localStorage.setItem(STORAGE_TESTIMONIALS, JSON.stringify(arr));
    $("#nameInput").value = ""; $("#testimonialInput").value = "";
    alert("Terima kasih — testimoni terkirim untuk moderasi admin.");
    // reload testimonial UI (only approved will show)
    loadTestimonials(); // function defined in PART1, but may exist; otherwise implement quick filter
  });

  // loadTestimonials shows only approved ones. If missing, provide fallback:
  function loadTestimonialsFallback(){
    const container = $("#testimonialsList");
    if(!container) return;
    const all = JSON.parse(localStorage.getItem(STORAGE_TESTIMONIALS) || "[]");
    container.innerHTML = "";
    all.filter(t => t.status === "approved").slice().reverse().forEach(t => {
      const li = document.createElement("li");
      li.className = "testimonial-card";
      li.innerHTML = `<strong>${escapeHtml(t.name)}</strong><br>${escapeHtml(t.testimonial)}`;
      container.appendChild(li);
    });
  }
  // try to call existing loadTestimonials if present; otherwise use fallback
  if(typeof window.loadTestimonials === "function") {
    try { window.loadTestimonials(); } catch(e){ loadTestimonialsFallback(); }
  } else { loadTestimonialsFallback(); }

  /* ========== Block: PDF generator ========== */
  async function generatePdf(order){
    showLoader("Membuat PDF...");
    try{
      const { jsPDF } = window.jspdf;
      if(!jsPDF) throw new Error("jsPDF tidak tersedia");
      const pdf = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
      const fmtRp = n => "Rp " + Number(n||0).toLocaleString("id-ID");

      // load images
      async function loadImage(src){
        return new Promise(resolve => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });
      }
      const [logoImg, ttdImg, qrisImg] = await Promise.all([
        loadImage("assets/images/logo.png"),
        loadImage("assets/images/ttd.png"),
        loadImage("assets/images/qris-pukis.jpg")
      ]);

      // watermark
      pdf.setTextColor(220,220,220);
      pdf.setFontSize(48);
      pdf.text("PUKIS LUMER AULIA", pdf.internal.pageSize.getWidth()/2, pdf.internal.pageSize.getHeight()/2, {align:"center", angle:45});
      pdf.setTextColor(0,0,0);

      // header
      pdf.setFontSize(14); pdf.setFont("helvetica","bold");
      pdf.text("INVOICE", 14, 16);
      pdf.setFontSize(20); pdf.setTextColor(214,51,108);
      pdf.text("PUKIS LUMER AULIA", pdf.internal.pageSize.getWidth()/2, 22, {align:"center"});
      pdf.setTextColor(0,0,0); pdf.setFontSize(9);
      if(logoImg) pdf.addImage(logoImg, "PNG", pdf.internal.pageSize.getWidth()-55, 6, 40, 20);
      pdf.text("Pasar Kuliner Padang Panjang", pdf.internal.pageSize.getWidth()-10, 28, {align:"right"});
      pdf.text("📞 0812-9666-8670", pdf.internal.pageSize.getWidth()-10, 32, {align:"right"});
      pdf.line(10,36, pdf.internal.pageSize.getWidth()-10,36);

      // invoice meta
      let y = 44;
      pdf.setFontSize(10);
      pdf.text(`Order ID: ${order.orderID}`, 14, y);
      pdf.text(`Tanggal: ${order.tgl || order.createdAt}`, pdf.internal.pageSize.getWidth()-14, y, {align:"right"});
      y += 7;
      pdf.text(`No. Antrian: ${order.queueNo}`, 14, y);
      pdf.text(`Invoice by: Pukis Lumer Aulia`, pdf.internal.pageSize.getWidth()-14, y, {align:"right"});
      y += 8;

      // customer data
      pdf.text(`Nama: ${order.nama}`, 14, y); pdf.text(`WA: ${order.wa}`, pdf.internal.pageSize.getWidth()-14, y, {align:"right"});
      y += 7;
      pdf.text(`Jenis: ${order.jenis} — ${order.isi} pcs`, 14, y);
      y += 7;
      pdf.text(`Mode: ${order.mode}`, 14, y);
      y += 7;
      if(order.mode === "single") { pdf.text(`Topping: ${order.topping.join(", ")||"-"}`, 14, y); y += 7; }
      if(order.mode === "double") {
        pdf.text(`Topping: ${order.topping.join(", ")||"-"}`, 14, y); y += 7;
        pdf.text(`Taburan: ${order.taburan.join(", ")||"-"}`, 14, y); y += 7;
      }

      if(order.note && order.note !== "-"){
        pdf.text("Catatan:", 14, y); y += 6;
        const split = pdf.splitTextToSize(order.note, pdf.internal.pageSize.getWidth() - 28);
        pdf.text(split, 14, y); y += (split.length * 6) + 4;
      } else { y += 4; }

      // table (autoTable if available)
      const desc = `${order.jenis} — ${order.isi} pcs` + (order.mode === "non" ? " (Tanpa Topping)" : (order.mode === "single" ? ` | Topping: ${order.topping.join(", ")||"-"}` : ` | Topping: ${order.topping.join(", ")||"-"} | Taburan: ${order.taburan.join(", ")||"-"}`));
      if(pdf.autoTable){
        pdf.autoTable({
          startY: y,
          head: [["Deskripsi","Harga/Box","Jumlah","Total"]],
          body: [[desc, fmtRp(order.pricePerBox), `${order.jumlahBox} Box`, fmtRp(order.total)]],
          theme: "grid",
          headStyles: { fillColor: [214,51,108], textColor: 255 },
          styles: { fontSize: 10 }
        });
      } else {
        pdf.text("Deskripsi", 14, y); pdf.text("Harga", 100, y); pdf.text("Jumlah", 140, y); pdf.text("Total", 170, y);
        y += 6;
        pdf.text(desc, 14, y); pdf.text(fmtRp(order.pricePerBox), 100, y); pdf.text(`${order.jumlahBox} Box`, 140, y); pdf.text(fmtRp(order.total), 170, y);
        y += 10;
      }

      const lastY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 8 : y + 20;
      pdf.setFontSize(11);
      pdf.text(`Subtotal: ${fmtRp(order.subtotal)}`, pdf.internal.pageSize.getWidth()-14, lastY, {align:"right"});
      if(order.discount > 0) pdf.text(`Disc: -${fmtRp(order.discount)}`, pdf.internal.pageSize.getWidth()-14, lastY+6, {align:"right"});
      pdf.setFont("helvetica","bold");
      pdf.text(`Total Bayar: ${fmtRp(order.total)}`, pdf.internal.pageSize.getWidth()-14, lastY + (order.discount>0?14:8), {align:"right"});

      // Footer: QRIS + TTD + Thanks
      let footerY = lastY + (order.discount>0?24:18);
      if(qrisImg){
        pdf.text("QRIS Pembayaran", 14, footerY);
        pdf.addImage(qrisImg, "PNG", 14, footerY+4, 36, 36);
      }
      if(ttdImg){
        pdf.addImage(ttdImg, "PNG", pdf.internal.pageSize.getWidth()-60, footerY+4, 46, 22);
      }

      pdf.setFontSize(10);
      pdf.text("Hormat Kami,", pdf.internal.pageSize.getWidth()-60, footerY+30);
      pdf.setFontSize(11);
      pdf.text("Terimakasih sudah Belanja di toko Kami 🙏", pdf.internal.pageSize.getWidth()/2, footerY+60, {align:"center"});

      // Save file
      const filename = `Invoice_${(order.nama||"Pelanggan").replace(/\s+/g,"_")}_${order.orderID}.pdf`;
      pdf.save(filename);

      // done
      hideLoader();
      return true;
    }catch(err){
      hideLoader();
      console.error("generatePdf error:", err);
      alert("Gagal membuat PDF: " + (err?.message || err));
      return false;
    }
  }

  // wire up print button
  $("#notaPrint")?.addEventListener("click", async ()=>{
    const last = JSON.parse(localStorage.getItem("lastOrder") || "{}");
    if(!last || !last.orderID) return alert("Tidak ada order untuk dicetak. Buat nota dulu.");
    await generatePdf(last);
  });

  /* ========== Block: misc helpers used earlier but may not exist in scope ========== */
  // ensure functions referenced from PART1 are present in window
  if(typeof window.calculateOrderData !== "function"){
    // fallback: re-implement minimal calculateOrderData & expose globally
    window.calculateOrderData = function(){
      // replicate compute by reading DOM
      const jenis = getSelectedRadioValue("ultraJenis") || "Original";
      const isi = ($("#ultraIsi")?$("#ultraIsi").value:"5");
      const mode = getSelectedRadioValue("ultraToppingMode") || "non";
      const jumlahBox = parseInt($("#ultraJumlah")?$("#ultraJumlah").value:1,10) || 1;
      const pricePerBox = (((PRICE_MAP && PRICE_MAP[jenis])||{})[isi]||{})[mode] || 0;
      const subtotal = pricePerBox * jumlahBox;
      const discount = (isi === "10" && jumlahBox >= 10) ? (DISCOUNT_PER_BOX_BIG10 * jumlahBox) : 0;
      const total = subtotal - discount;
      const order = {
        orderID: nowInvoiceId(),
        queueNo: nextQueueNumber(),
        nama: $("#ultraNama")?$("#ultraNama").value:"-",
        wa: $("#ultraWA")?$("#ultraWA").value:"-",
        jenis, isi, mode,
        topping: getCheckedValues(".ultraTopping"),
        taburan: getCheckedValues(".ultraTaburan"),
        jumlahBox, pricePerBox, subtotal, discount, total,
        note: $("#ultraNote")?$("#ultraNote").value:"-",
        createdAt: new Date().toISOString(), tgl: new Date().toLocaleString("id-ID")
      };
      localStorage.setItem("lastOrderDraft", JSON.stringify(order));
      localStorage.setItem("lastOrder", JSON.stringify(order));
      return order;
    };
  }

  // small guard: if admin table render function exists, call it to refresh
  if(typeof window.renderAdminTable === "function"){
    try{ window.renderAdminTable(); }catch(e){}
  }

  // On script load restore draft if any
  try{ restoreDraft(); }catch(e){}

})();
