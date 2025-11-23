/* ===============================
   ORDER SYSTEM — PUKIS LUMER AULIA
   Hybrid Final Version
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const formatRp = n => "Rp " + Number(n).toLocaleString("id-ID");

  const BASE_PRICE = {
    Original: { "5": { non:10000, single:13000, double:15000 },
                "10":{ non:18000, single:25000, double:28000 } },
    Pandan:   { "5": { non:13000, single:15000, double:18000 },
                "10":{ non:25000, single:28000, double:32000 } },
  };
  const ADMIN_WA = "6281296668670";

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
      const subtotal = pricePerBox * jumlahBox;
      const discount = 0;
      const total = subtotal - discount;

      if(ultraPricePerBox) ultraPricePerBox.textContent = formatRp(pricePerBox);
      if(ultraSubtotal) ultraSubtotal.textContent = formatRp(subtotal);
      if(ultraDiscount) ultraDiscount.textContent = "-";
      if(ultraGrandTotal) ultraGrandTotal.textContent = formatRp(total);

      dataPesanan = {
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
        note: ultraNote ? (ultraNote.value||"-") : "-"
      };
    }catch(err){ console.error("calculatePrice error", err);}
  }

  // ===== Topping Display Logic =====
  function updateToppingDisplay(){
    const mode = getSelectedRadioValue("ultraToppingMode");
    if(ultraSingleGroup) ultraSingleGroup.style.display = mode==="single"?"block":"none";
    if(ultraDoubleGroup) ultraDoubleGroup.style.display = mode==="double"?"block":"none";
    $$(".ultraTopping, .ultraTaburan").forEach(cb=>cb.checked=false);

    if(mode==="non"){
      $$(".ultraTopping, .ultraTaburan").forEach(cb=>cb.disabled=true);
    } else if(mode==="single"){
      $$(".ultraTopping").forEach(cb=>cb.disabled=false);
      $$(".ultraTaburan").forEach(cb=>cb.disabled=true);
    } else if(mode==="double"){
      $$(".ultraTopping, .ultraTaburan").forEach(cb=>cb.disabled=false);
    }
    calculatePrice();
  }

  const toppingModeRadios = $$('input[name="ultraToppingMode"]') || [];
  toppingModeRadios.forEach(r=>r.addEventListener("change", updateToppingDisplay));
  try{ updateToppingDisplay(); } catch(err){ console.warn("updateToppingDisplay failed:", err); }

  function toppingLimitEvent(e){
    const mode = getSelectedRadioValue("ultraToppingMode");
    const t = getCheckedValues(".ultraTopping");
    const tb = getCheckedValues(".ultraTaburan");
    if(mode==="single" && t.length>5){ e.target.checked=false; alert("Maksimal 5 topping!"); return; }
    if(mode==="double"){
      if(e.target.classList.contains("ultraTopping") && t.length>5){ e.target.checked=false; alert("Maksimal 5 topping!"); return; }
      if(e.target.classList.contains("ultraTaburan") && tb.length>5){ e.target.checked=false; alert("Maksimal 5 taburan!"); return; }
    }
    calculatePrice();
  }

  const toppingCheckboxes = $$('.ultraTopping, .ultraTaburan') || [];
  toppingCheckboxes.forEach(cb=>cb.addEventListener("change", toppingLimitEvent));

  if(ultraIsi) ultraIsi.addEventListener("change", calculatePrice);
  if(ultraJumlah) ultraJumlah.addEventListener("input", calculatePrice);
  const jenisRadios = $$('input[name="ultraJenis"]') || [];
  jenisRadios.forEach(r=>r.addEventListener("change", calculatePrice));

  calculatePrice();

  // ===== Nota Rendering =====
  formUltra.addEventListener("submit", e=>{
    e.preventDefault();
    calculatePrice();
    renderNota();
    if(notaContainer) notaContainer.style.display="flex";
  });

  if(notaClose) notaClose.addEventListener("click", ()=>{ notaContainer.style.display="none"; });

  function renderNota(){
    const d = dataPesanan;
    let text = `<p><strong>Nama:</strong> ${d.nama}</p>
                <p><strong>WA:</strong> ${d.wa}</p>
                <p><strong>Jenis:</strong> ${d.jenis}</p>
                <p><strong>Isi:</strong> ${d.isi} pcs</p>`;
    if(d.mode==="single") text+= `<p><strong>Topping:</strong> ${d.topping.join(", ")||"-"}</p>`;
    if(d.mode==="double") text+= `<p><strong>Topping:</strong> ${d.topping.join(", ")||"-"}</p>
                                    <p><strong>Taburan:</strong> ${d.taburan.join(", ")||"-"}</p>`;
    text+= `<p><strong>Jumlah Box:</strong> ${d.jumlahBox}</p>
            <p><strong>Catatan:</strong> ${d.note}</p>`;
    if(notaContent) notaContent.innerHTML=text;
  }

  // ===== Kirim WA ke admin =====
  notaSendAdmin.addEventListener("click", ()=>{
    calculatePrice();
    const d = dataPesanan;
    let msg = `Halo Admin, saya ingin memesan Pukis:\n` +
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

  // ===== Cetak PDF =====
  notaPrint.addEventListener("click", async ()=>{
    calculatePrice();
    try{
      if(!window.jspdf){ alert("PDF gagal dibuat: jsPDF belum ter-load."); return; }
      await generatePdf(dataPesanan);
    } catch(err){ alert("PDF gagal dibuat: "+(err?.message||err)); }
  });
});

// =======================
// PDF Generator Hybrid Version
// =======================
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
    nama="-", jenis="-", isi="-", mode="non", topping=[], taburan=[], jumlahBox=1,
    pricePerBox=0, subtotal=0, discount=0, total=0, note="-", wa="-"
  } = data||{};

  const now = new Date();
  const tgl = now.toLocaleDateString("id-ID"), jam=now.toLocaleTimeString("id-ID");
  const invoiceNum = "INV-"+now.getFullYear()+(now.getMonth()+1).toString().padStart(2,"0")+now.getDate().toString().padStart(2,"0")+"-"+now.getHours().toString().padStart(2,"0")+now.getMinutes().toString().padStart(2,"0");

  pdf.setFont("helvetica","bold"); pdf.setFontSize(14); pdf.text("INVOICE",10,12);
  try{ pdf.setFont("Pacifico-Regular"); } catch{}; pdf.setFontSize(26); pdf.setTextColor(214,51,108);
  pdf.text("PUKIS LUMER AULIA",105,17,{align:"center"});
  pdf.setFont("helvetica","normal"); pdf.setTextColor(0,0,0);
  if(logo) pdf.addImage(logo,"PNG",155,5,40,20);

  pdf.setFontSize(9); pdf.text("Pasar Kuliner Padang Panjang",155,27); pdf.text("📞 0812-9666-8670",155,31);
  pdf.line(10,35,200,35);

  let y=43; pdf.setFontSize(11);
  pdf.text("Nama Pemesan : "+nama,10,y); pdf.text("Tanggal : "+tgl+" "+jam,150,y); y+=7;
  pdf.text("Nomor Invoice : "+invoiceNum,150,y); y+=10;
  if(note!=="-"){ pdf.text("Catatan :",10,y); pdf.text(note,10,y+6); y+=12; }

  const desc = `${jenis} — ${isi} pcs\n` + (mode==="single"? `Topping: ${topping.join(",")||"-"}` : mode==="double"? `Topping: ${topping.join(",")||"-"} | Taburan: ${taburan.join(",")||"-"}` : "Tanpa Topping");

  if(pdf.autoTable){
    pdf.autoTable({startY:y, head:[["Deskripsi","Harga","Jumlah","Total"]], body:[[desc,fmtRp(pricePerBox),jumlahBox+" Box",fmtRp(total)]], theme:"grid", headStyles:{fillColor:[214,51,108],textColor:255}, styles:{fontSize:10}});
  } else {
    pdf.text("Deskripsi",10,y); pdf.text("Harga",100,y); pdf.text("Jumlah",140,y); pdf.text("Total",170,y); y+=6;
    pdf.text(desc,10,y); pdf.text(fmtRp(pricePerBox),100,y); pdf.text(jumlahBox+" Box",140,y); pdf.text(fmtRp(total),170,y);
  }
  const finalY = pdf.lastAutoTable?.finalY ? pdf.lastAutoTable.finalY + 10 : y+30;

  pdf.setFontSize(11); pdf.text("Subtotal: "+fmtRp(subtotal),195,finalY,{align:"right"});
  if(discount>0) pdf.text("Disc: "+fmtRp(discount),195,finalY+6,{align:"right"});
  pdf.setFont("helvetica","bold"); pdf.text("Total Bayar: "+fmtRp(total),195,finalY+(discount>0?12:6),{align:"right"});

  let sigY = finalY + (discount>0?20:16); pdf.setFont("helvetica","normal"); pdf.text("Hormat Kami,",150,sigY);
  if(ttd) pdf.addImage(ttd,"PNG",150,sigY+5,40,18);
  if(qris){ pdf.text("QRIS Pembayaran",13,sigY); pdf.addImage(qris,"PNG",10,sigY+5,35,35); }

  pdf.save(`Invoice_${(nama||"Pelanggan").replace(/\s+/g,"_")}.pdf`);
}
