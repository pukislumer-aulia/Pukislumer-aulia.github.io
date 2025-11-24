/* ======================================
   PUKIS LUMER AULIA — SCRIPT USER FINAL
   ====================================== */

/* ---------- Loader ---------- */
window.addEventListener("load", () => {
  const loader = document.getElementById("site-loader");
  if(loader) setTimeout(()=>loader.style.display="none",800);
});

/* ---------- Utility ---------- */
const $ = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));
const ADMIN_WA = "6281296668670";

function formatRp(num){ return "Rp " + Number(num).toLocaleString("id-ID"); }
function escapeHtml(str=""){ return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- LocalStorage Init Testimoni ---------- */
(function initFakeTestimonials(){
  const key="testimonials";
  if(!localStorage.getItem(key)){
    const fake=[
      {name:"Anggi, Payakumbuh", testimonial:"Pukisnya lembut dan toppingnya melimpah! Bakalan order lagi."},
      {name:"Wenni, Pekanbaru", testimonial:"Rasa pandan-nya mantap, cocok buat cemilan sore!"},
      {name:"Annisa, Bukittinggi", testimonial:"Pukis terenak yang pernah aku coba. Anak-anak juga suka!"},
      {name:"Maulana, Padang Panjang", testimonial:"Awalnya penasaran, sekali coba ketagihan, Topping nya gak pelit, penjual juga Ramah"}
    ];
    localStorage.setItem(key,JSON.stringify(fake));
  }
})();

/* ---------- PRICE & TOPPING ---------- */
const BASE_PRICE = {
  Original: { "5": { non:10000, single:13000, double:15000 }, "10":{ non:18000, single:25000, double:28000 } },
  Pandan:   { "5": { non:13000, single:15000, double:18000 }, "10":{ non:25000, single:28000, double:32000 } },
};
const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino"];
const DOUBLE_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];
const MAX_TOPPING=5, MAX_TABURAN=5, DISKON_MIN_BOX=10, DISKON_PER_BOX=1000;

function getSelectedRadio(name){ const r=$(`input[name="${name}"]:checked`); return r?r.value:null; }
function getChecked(selector){ return $$(selector+":checked").map(e=>e.value); }

function calculatePrice(jenis, isi, mode){ return BASE_PRICE[jenis][isi][mode]||0; }
function calculateSubtotal(pricePerBox, jumlah){ return pricePerBox*jumlah; }
function calculateDiscount(jumlah){ return jumlah>=DISKON_MIN_BOX?DISKON_PER_BOX*jumlah:0; }
function calculateGrandTotal(subtotal, discount){ return subtotal-discount; }

/* ---------- GET ORDER FORM DATA ---------- */
function getOrderFormData(){
  const jenis = getSelectedRadio("ultraJenis") || "Original";
  const isi = $("#ultraIsi")?$("#ultraIsi").value:"5";
  const mode = getSelectedRadio("ultraToppingMode") || "non";
  const jumlahBox = $("#ultraJumlah")?parseInt($("#ultraJumlah").value)||1:1;
  const pricePerBox = calculatePrice(jenis,isi,mode);
  const subtotal = calculateSubtotal(pricePerBox,jumlahBox);
  const discount = calculateDiscount(jumlahBox);
  const total = calculateGrandTotal(subtotal,discount);

  return {
    id: "INV"+Date.now(),
    nama: $("#ultraNama")?$("#ultraNama").value:"-",
    wa: $("#ultraWA")?$("#ultraWA").value:"-",
    jenis, isi, mode,
    topping: getChecked(".ultraTopping"),
    taburan: getChecked(".ultraTaburan"),
    jumlahBox, pricePerBox, subtotal, discount, total,
    note: $("#ultraNote")?$("#ultraNote").value:"-",
    createdAt: new Date().toISOString()
  };
}

/* ---------- UPDATE PRICE UI ---------- */
function updatePriceUI(){
  const data = getOrderFormData();
  if($("#ultraPricePerBox")) $("#ultraPricePerBox").innerText = formatRp(data.pricePerBox);
  if($("#ultraSubtotal")) $("#ultraSubtotal").innerText = formatRp(data.subtotal);
  if($("#ultraDiscount")) $("#ultraDiscount").innerText = data.discount>0?"-"+formatRp(data.discount):"-";
  if($("#ultraGrandTotal")) $("#ultraGrandTotal").innerText = formatRp(data.total);
}

/* ---------- TOPPING DISPLAY ---------- */
function updateToppingDisplay(){
  const mode = getSelectedRadio("ultraToppingMode");
  const isi = parseInt($("#ultraIsi")?$("#ultraIsi").value:5);
  const singleEl = $("#ultraSingleGroup");
  const doubleEl = $("#ultraDoubleGroup");
  if(!singleEl||!doubleEl) return;

  singleEl.innerHTML=""; doubleEl.innerHTML="";

  if(mode==="single"||mode==="double"){ singleEl.style.display="flex"; } else singleEl.style.display="none";
  if(mode==="double"){ doubleEl.style.display="flex"; } else doubleEl.style.display="none";

  if(mode==="single"||mode==="double"){
    SINGLE_TOPPINGS.forEach((t,i)=>{ if(i<isi) singleEl.innerHTML+=`<label class="topping-check"><input type="checkbox" class="ultraTopping" value="${t}"><span>${t}</span></label>`; });
  }
  if(mode==="double"){
    DOUBLE_TABURAN.forEach((t,i)=>{ if(i<isi) doubleEl.innerHTML+=`<label class="topping-check"><input type="checkbox" class="ultraTaburan" value="${t}"><span>${t}</span></label>`; });
  }
  updatePriceUI();
}

/* ---------- Event Listeners for Topping & Inputs ---------- */
$$('input[name="ultraToppingMode"], input[name="ultraJenis"]').forEach(r=>r.addEventListener("change",()=>{ updateToppingDisplay(); updatePriceUI(); }));
["ultraIsi","ultraJumlah"].forEach(id=>{ const el=$("#"+id); if(el) el.addEventListener("change",()=>{ updateToppingDisplay(); updatePriceUI(); }); });

document.addEventListener("change", e=>{
  const t=e.target; if(!t) return;
  if(t.matches(".ultraTopping,.ultraTaburan")){
    const lbl=t.closest("label"); if(lbl){ t.checked?lbl.classList.add("checked"):lbl.classList.remove("checked"); }
    const mode=getSelectedRadio("ultraToppingMode"), isi=parseInt($("#ultraIsi")?$("#ultraIsi").value:5);
    const s=getChecked(".ultraTopping").length, d=getChecked(".ultraTaburan").length;
    if(mode==="single" && s>MAX_TOPPING){ t.checked=false; alert(`Maksimal ${MAX_TOPPING} topping`); }
    if(mode==="double"){ 
      if(t.classList.contains("ultraTopping") && s>MAX_TOPPING){ t.checked=false; alert(`Maksimal ${MAX_TOPPING} topping`); } 
      if(t.classList.contains("ultraTaburan") && d>MAX_TABURAN){ t.checked=false; alert(`Maksimal ${MAX_TABURAN} taburan`); } 
    }
    updatePriceUI();
  }
});

/* ======================================
   BAGIAN 2 — FORM, NOTA, WA, TESTIMONIALS
   ====================================== */

/* ---------- Form Submit ---------- */
$("#formUltra")?.addEventListener("submit", e=>{
  e.preventDefault();
  const data=getOrderFormData();
  if(!data.nama||!data.wa) return alert("Isi nama & WA terlebih dahulu.");
  saveOrderLocal(data);
  renderNota(data);
  $("#notaContainer")?.classList.add("show");
  $("#notaContainer .nota-card")?.scrollIntoView({behavior:"smooth"});
  alert("Nota dibuat. Silakan cek & tekan 'Cetak/PDF' atau 'Kirim WA Admin'.");
});

/* ---------- Save Order Local ---------- */
function saveOrderLocal(order){
  const arr=JSON.parse(localStorage.getItem("orders")||"[]");
  arr.push(order);
  localStorage.setItem("orders",JSON.stringify(arr));
}

/* ---------- Render Nota ---------- */
function renderNota(data){
  const container=$("#notaContainer .nota-card");
  if(!container) return;
  container.innerHTML=`
    <h3>INVOICE — Pukis Lumer Aulia</h3>
    <p><strong>Nama:</strong> ${escapeHtml(data.nama)}</p>
    <p><strong>WA:</strong> ${escapeHtml(data.wa)}</p>
    <p><strong>Jenis:</strong> ${data.jenis}</p>
    <p><strong>Isi:</strong> ${data.isi} pcs</p>
    <p><strong>Mode:</strong> ${data.mode}</p>
    ${data.topping.length?`<p><strong>Topping:</strong> ${data.topping.join(", ")}</p>`:""}
    ${data.taburan.length?`<p><strong>Taburan:</strong> ${data.taburan.join(", ")}</p>`:""}
    <p><strong>Jumlah Box:</strong> ${data.jumlahBox}</p>
    <p><strong>Catatan:</strong> ${escapeHtml(data.note)}</p>
    <p><strong>Total:</strong> ${formatRp(data.total)}</p>
  `;
}

/* ---------- Nota Print / PDF ---------- */
$("#notaPrint")?.addEventListener("click", async()=>{
  const data=getOrderFormData();
  try{
    if(typeof window.generatePdf==="function"){
      await window.generatePdf({...data, branding:"full"});
    } else {
      alert("PDF gagal. Pastikan order.js sudah dimuat.");
    }
  } catch(err){
    console.error("generatePdf error:", err);
    alert("Gagal membuat PDF: "+(err?.message||err));
  }
});

/* ---------- Nota Modal Close ---------- */
$("#notaClose")?.addEventListener("click",()=>{ $("#notaContainer")?.classList.remove("show"); });

/* ---------- Send WA Admin ---------- */
$("#ultraSendAdmin")?.addEventListener("click", ()=>{
  const data=getOrderFormData();
  if(!data.nama||!data.wa) return alert("Isi nama & WA terlebih dahulu.");
  saveOrderLocal(data);

  const lines=[
    "Halo Admin, saya ingin memesan Pukis Lumer Aulia:",
    `Nama: ${data.nama}`,
    `WA: ${data.wa}`,
    `Jenis: ${data.jenis}`,
    `Isi: ${data.isi} pcs`
  ];
  if(data.mode==="single") lines.push(`Topping: ${data.topping.join(",")||"-"}`);
  if(data.mode==="double"){
    lines.push(`Topping: ${data.topping.join(",")||"-"}`);
    lines.push(`Taburan: ${data.taburan.join(",")||"-"}`);
  }
  lines.push(`Jumlah Box: ${data.jumlahBox}`);
  lines.push(`Catatan: ${data.note}`);
  lines.push(`Total: ${formatRp(data.total)}`);
  lines.push("Terima kasih 🙏");

  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank");
});

/* ---------- Testimonials ---------- */
function loadTestimonials(limit=3){
  const container=$("#testimonialsList"); if(!container) return;
  const arr=JSON.parse(localStorage.getItem("testimonials")||"[]");
  container.innerHTML="";
  arr.slice().reverse().slice(0,limit).forEach(t=>{
    const li=document.createElement("li");
    li.className="testimonial-card";
    li.innerHTML=`<strong>${escapeHtml(t.name)}</strong><br>${escapeHtml(t.testimonial)}`;
    container.appendChild(li);
  });
}

$("#testimonialForm")?.addEventListener("submit", e=>{
  e.preventDefault();
  const name=($("#nameInput")?.value||"").trim();
  const text=($("#testimonialInput")?.value||"").trim();
  if(!name||!text) return alert("Isi nama & testimoni.");
  const arr=JSON.parse(localStorage.getItem("testimonials")||"[]");
  arr.push({name,testimonial:text,createdAt:new Date().toISOString()});
  localStorage.setItem("testimonials",JSON.stringify(arr));
  $("#nameInput").value=""; $("#testimonialInput").value="";
  loadTestimonials();
  alert("Terima kasih, testimoni sudah tersimpan!");
});

/* ---------- Floating Share ---------- */
$("#toggleShareBtn")?.addEventListener("click",()=>{
  const icons=$("#floatingIcons"); if(!icons) return;
  const shown=icons.classList.toggle("show");
  icons.setAttribute("aria-hidden",String(!shown));
  $("#toggleShareBtn").textContent=shown?"✕":"+";
});

/* ---------- Init Final ---------- */
function initFinal(){
  updateToppingDisplay();
  updatePriceUI();
  loadTestimonials();
}
if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded",initFinal); }
else{ initFinal(); }
