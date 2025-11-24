/* ===============================
   ORDER.JS — PUKIS LUMER AULIA
   Final Hybrid Version (Upgrade PDF + Admin)
   =============================== */

document.addEventListener("DOMContentLoaded", () => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const formatRp = n => "Rp " + Number(n).toLocaleString("id-ID");

  const ADMIN_WA = "6281296668670";
  const MAX_TOPPING = 5;
  const MAX_TABURAN = 5;
  const DISKON_MIN_BOX = 10;
  const DISKON_PER_BOX = 1000;

  const BASE_PRICE = {
    Original: { "5": { non:10000, single:13000, double:15000 },
                "10":{ non:18000, single:25000, double:28000 } },
    Pandan:   { "5": { non:13000, single:15000, double:18000 },
                "10":{ non:25000, single:28000, double:32000 } },
  };

  const SINGLE_TOPPINGS = ["Coklat", "Tiramisu", "Vanilla", "Stroberi", "Cappucino"];
  const DOUBLE_TABURAN = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

  // DOM Elements
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
  const ultraNote = $("#ultraNote");

  let dataPesanan = {};

  function getSelectedRadioValue(name){
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }
  function getCheckedValues(selector){
    return [...$$(selector)].filter(cb=>cb.checked).map(cb=>cb.value);
  }

  function calculatePrice(){
    try{
      const jenis = getSelectedRadioValue("ultraJenis") || "Original";
      const isi = ultraIsi ? ultraIsi.value : "5";
      const mode = getSelectedRadioValue("ultraToppingMode") || "non";
      const jumlahBox = ultraJumlah ? (parseInt(ultraJumlah.value,10)||1) : 1;

      const pricePerBox = (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) ? BASE_PRICE[jenis][isi][mode] : 0;
      let subtotal = pricePerBox * jumlahBox;
      let discount = (jumlahBox >= DISKON_MIN_BOX) ? DISKON_PER_BOX * jumlahBox : 0;
      let total = subtotal - discount;

      if(ultraPricePerBox) ultraPricePerBox.textContent = formatRp(pricePerBox);
      if(ultraSubtotal) ultraSubtotal.textContent = formatRp(subtotal);
      if(ultraDiscount) ultraDiscount.textContent = discount>0? "-"+formatRp(discount) : "-";
      if(ultraGrandTotal) ultraGrandTotal.textContent = formatRp(total);

      const now = new Date();
      const invoiceNum = "INV-"+now.getFullYear()+(now.getMonth()+1).toString().padStart(2,"0")+now.getDate().toString().padStart(2,"0")+"-"+now.getHours().toString().padStart(2,"0")+now.getMinutes().toString().padStart(2,"0");

      dataPesanan = {
        orderID: invoiceNum,
        nama: ultraNama ? (ultraNama.value||"-") : "-",
        wa: ultraWA ? (ultraWA.value||"-") : "-",
        jenis,
        isi,
        mode,
        topping: getCheckedValues(".ultraTopping"),
        taburan: mode==="double"? getCheckedValues(".ultraTaburan") : [],
        jumlahBox,
        pricePerBox,
        subtotal,
        discount,
        total,
        note: ultraNote ? (ultraNote.value||"-") : "-",
        tgl: now.toLocaleDateString("id-ID") + " " + now.toLocaleTimeString("id-ID")
      };

      // Simpan ke storage untuk Admin
      const allOrders = JSON.parse(localStorage.getItem("allOrders")||"[]");
      const existingIndex = allOrders.findIndex(o=>o.orderID===dataPesanan.orderID);
      if(existingIndex===-1) allOrders.push(dataPesanan);
      else allOrders[existingIndex] = dataPesanan;
      localStorage.setItem("allOrders", JSON.stringify(allOrders));

    }catch(err){ console.error("calculatePrice error", err);}
  }

  function updateToppingDisplay(){
    const mode = getSelectedRadioValue("ultraToppingMode");
    if(ultraSingleGroup) ultraSingleGroup.style.display = mode==="single"||mode==="double"?"block":"none";
    if(ultraDoubleGroup) ultraDoubleGroup.style.display = mode==="double"?"block":"none";

    $$(".ultraTopping, .ultraTaburan").forEach(cb=>{ cb.checked=false; cb.disabled=true; });

    if(mode==="single"){
      $$(".ultraTopping").forEach(cb=>{
        cb.disabled=false;
        cb.style.display = SINGLE_TOPPINGS.includes(cb.value)? "inline-block":"none";
      });
    } else if(mode==="double"){
      $$(".ultraTopping").forEach(cb=>{
        cb.disabled=false;
        cb.style.display = SINGLE_TOPPINGS.includes(cb.value)? "inline-block":"none";
      });
      $$(".ultraTaburan").forEach(cb=>{
        cb.disabled=false;
        cb.style.display = DOUBLE_TABURAN.includes(cb.value)? "inline-block":"none";
      });
    }

    calculatePrice();
  }

  $$('input[name="ultraToppingMode"]').forEach(r=>r.addEventListener("change", updateToppingDisplay));
  try{ updateToppingDisplay(); } catch(err){ console.warn("updateToppingDisplay failed:", err); }

  function toppingLimitEvent(e){
    const mode = getSelectedRadioValue("ultraToppingMode");
    const t = getCheckedValues(".ultraTopping");
    const tb = getCheckedValues(".ultraTaburan");

    if(mode==="single" && t.length>MAX_TOPPING){ e.target.checked=false; alert(`Maksimal ${MAX_TOPPING} topping!`); return; }
    if(mode==="double"){
      if(e.target.classList.contains("ultraTopping") && t.length>MAX_TOPPING){ e.target.checked=false; alert(`Maksimal ${MAX_TOPPING} topping!`); return; }
      if(e.target.classList.contains("ultraTaburan") && tb.length>MAX_TABURAN){ e.target.checked=false; alert(`Maksimal ${MAX_TABURAN} taburan!`); return; }
    }
    calculatePrice();
  }

  $$('.ultraTopping, .ultraTaburan').forEach(cb=>cb.addEventListener("change", toppingLimitEvent));
  if(ultraIsi) ultraIsi.addEventListener("change", calculatePrice);
  if(ultraJumlah) ultraJumlah.addEventListener("input", calculatePrice);
  $$('input[name="ultraJenis"]').forEach(r=>r.addEventListener("change", calculatePrice));

  calculatePrice();

  // FORM SUBMIT & NOTA
  formUltra.addEventListener("submit", e=>{
    e.preventDefault();
    calculatePrice();
    renderNota();
    if(notaContainer) notaContainer.style.display="flex";
  });
  if(notaClose) notaClose.addEventListener("click", ()=>{ notaContainer.style.display="none"; });

  function renderNota(){
    const d = dataPesanan;
    let text = `<p><strong>Order ID:</strong> ${d.orderID}</p>
                <p><strong>Nama:</strong> ${d.nama}</p>
                <p><strong>WA:</strong> ${d.wa}</p>
                <p><strong>Jenis:</strong> ${d.jenis}</p>
                <p><strong>Isi:</strong> ${d.isi} pcs</p>`;
    if(d.mode==="single") text+= `<p><strong>Topping:</strong> ${d.topping.join(", ")||"-"}</p>`;
    if(d.mode==="double") text+= `<p><strong>Topping:</strong> ${d.topping.join(", ")||"-"}</p>
                                    <p><strong>Taburan:</strong> ${d.taburan.join(", ")||"-"}</p>`;
    text+= `<p><strong>Jumlah Box:</strong> ${d.jumlahBox}</p>
            <p><strong>Catatan:</strong> ${d.note}</p>`;
    text+= `<p>Terimakasih sudah Belanja di toko Kami 🙏</p>`;
    if(notaContent) notaContent.innerHTML=text;
  }

  if(notaSendAdmin){
    notaSendAdmin.addEventListener("click", ()=>{
      calculatePrice();
      const d = dataPesanan;
      let msg = `Halo Admin, saya ingin memesan Pukis:\n` +
                `Order ID: ${d.orderID}\n` +
                `Nama: ${d.nama}\n` +
                `Jenis: ${d.jenis}\n` +
                `Isi: ${d.isi} pcs\n` +
                (d.mode==="single"? `Topping: ${d.topping.join(", ")||"-"}\n`:"") +
                (d.mode==="double"? `Topping: ${d.topping.join(", ")||"-"}\nTaburan: ${d.taburan.join(", ")||"-"}\n`:"") +
                `Jumlah: ${d.jumlahBox} Box\n` +
                `Total: ${formatRp(d.total)}\n` +
                `Catatan: ${d.note}\n\nTerimakasih 🙏`;
      window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, "_blank");
    });
  }

  if(notaPrint){
    notaPrint.addEventListener("click", async ()=>{
      calculatePrice();
      try{
        if(!window.jspdf){ alert("PDF gagal dibuat: jsPDF belum ter-load."); return; }
        await generatePdf(dataPesanan);
      } catch(err){ alert("PDF gagal dibuat: "+(err?.message||err)); }
    });
  }

  const toggleShareBtn = $("#toggleShareBtn");
  const floatingIcons = $("#floatingIcons");
  if(toggleShareBtn && floatingIcons){
    toggleShareBtn.addEventListener("click", ()=>{
      const shown = floatingIcons.classList.toggle("show");
      toggleShareBtn.textContent = shown ? "✕" : "+";
    });
  }

  const bottomNav = $("#bottomNav");
  let bottomNavTimeout = null;
  let lastScroll = window.scrollY;
  window.addEventListener("scroll", ()=>{
    if(!bottomNav) return;
    const currentScroll = window.scrollY;
    if(currentScroll > lastScroll){
      bottomNav.style.bottom="-70px";
      clearTimeout(bottomNavTimeout);
      bottomNavTimeout = setTimeout(()=>{ bottomNav.style.bottom="0"; }, 3000);
    }
    lastScroll = currentScroll;
  });

  function loadTestimonials(){
    const container = $("#testimonialsList");
    const saved = JSON.parse(localStorage.getItem("testimonials")||"[]");
    container.innerHTML="";
    saved.slice().reverse().forEach(t=>{
      const li = document.createElement("li");
      li.className="testimonial-card";
      li.innerHTML=`<strong>${escapeHtml(t.name)}</strong><br>${escapeHtml(t.testimonial)}`;
      container.appendChild(li);
    });
  }

  const testimonialForm = $("#testimonialForm");
  if(testimonialForm){
    testimonialForm.addEventListener("submit", e=>{
      e.preventDefault();
      const name = ($("#nameInput")?.value||"").trim();
      const text = ($("#testimonialInput")?.value||"").trim();
      if(!name || !text) return alert("Isi nama & testimoni.");
      const arr = JSON.parse(localStorage.getItem("testimonials")||"[]");
      arr.push({ name, testimonial: text, createdAt: new Date().toISOString() });
      localStorage.setItem("testimonials", JSON.stringify(arr));
      $("#nameInput").value=""; $("#testimonialInput").value="";
      loadTestimonials();
      alert("Terima kasih, testimoni kamu sudah tersimpan!");
    });
  }

  function escapeHtml(str=""){ return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function initFinal(){
    loadTestimonials();
    updateToppingDisplay();
    calculatePrice();
  }
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded", initFinal);
  } else { initFinal(); }

});

/* =======================
   PDF Generator with Watermark & Footer
   ======================= */
async function generatePdf(data){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
  const fmtRp = n=>"Rp "+Number(n).toLocaleString("id-ID");

  async function loadImage(src){ return new Promise(resolve=>{ const img=new Image(); img.crossOrigin="anonymous"; img.onload=()=>resolve(img); img.onerror=()=>resolve(null); img.src=src; }); }
  const [logo, ttd, qris] = await Promise.all([
    loadImage("assets/images/logo.png"),
    loadImage("assets/images/ttd.png"),
    loadImage("assets/images/qris-pukis.jpg")
  ]);

  const {
    orderID="-", nama="-", jenis="-", isi="-", mode="non", topping=[], taburan=[], jumlahBox=1,
    pricePerBox=0, subtotal=0, discount=0, total=0, note="-", tgl="-", wa="-"
  } = data||{};

  // Watermark
  pdf.setTextColor(200,200,200);
  pdf.setFontSize(50);
  pdf.text("PUKIS LUMER AULIA",105,150,{align:"center", angle:45});
  pdf.setTextColor(0,0,0);

  const now = new Date();
  const invoiceNum = orderID;

  if(logo) pdf.addImage(logo,"PNG",155,5,40,20);
  pdf.setFontSize(9); pdf.text("Pasar Kuliner Padang Panjang",155,27); pdf.text("📞 0812-9666-8670",155,31);
  pdf.line(10,35,200,35);

  let y=43; pdf.setFontSize(11);
  pdf.text("Order ID : "+orderID,10,y);
  pdf.text("Tanggal : "+tgl,150,y); y+=7;
  pdf.text("Nama Pemesan : "+nama,10,y); pdf.text("WA : "+wa,150,y); y+=10;

  if(note!=="-"){ pdf.text("Catatan :",10,y); pdf.text(note,10,y+6); y+=12; }

  const desc = `${jenis} — ${isi} pcs\n` + (mode==="single"? `Topping: ${topping.join(",")||"-"}` : mode==="double"? `Topping: ${topping.join(",")||"-"} | Taburan: ${taburan.join(",")||"-"}` : "Tanpa Topping");

  if(pdf.autoTable){
    pdf.autoTable({
      startY:y,
      head:[["Deskripsi","Harga","Jumlah","Total"]],
      body:[[desc,fmtRp(pricePerBox),jumlahBox+" Box",fmtRp(total)]],
      theme:"grid",
      headStyles:{fillColor:[214,51,108],textColor:255},
      styles:{fontSize:10}
    });
  }

  const finalY = pdf.lastAutoTable?.finalY ? pdf.lastAutoTable.finalY + 10 : y+30;

  pdf.setFontSize(11); pdf.text("Subtotal: "+fmtRp(subtotal),195,finalY,{align:"right"});
  if(discount>0) pdf.text("Disc: "+fmtRp(discount),195,finalY+6,{align:"right"});
  pdf.setFont("helvetica","bold"); pdf.text("Total Bayar: "+fmtRp(total),195,finalY+(discount>0?12:6),{align:"right"});

  let sigY = finalY + (discount>0?20:16); pdf.setFont("helvetica","normal"); pdf.text("Hormat Kami,",150,sigY);
  if(ttd) pdf.addImage(ttd,"PNG",150,sigY+5,40,18);
  if(qris){ pdf.text("QRIS Pembayaran",13,sigY); pdf.addImage(qris,"PNG",10,sigY+5,35,35); }

  pdf.text("Terimakasih sudah Belanja di toko Kami 🙏",105,sigY+50,{align:"center"});

  pdf.save(`Invoice_${(nama||"Pelanggan").replace(/\s+/g,"_")}.pdf`);
                          }
