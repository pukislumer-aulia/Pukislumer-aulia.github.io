// assets/js/order.js
import { jsPDF } from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";

document.addEventListener("DOMContentLoaded", () => {

  // ================= CONFIG =================
  const BASE_PRICE = { Original: {5:10000,10:18000}, Pandan:{5:12000,10:22000} };
  const TOPPING_EXTRA = { non:0, single:2000, double:4000 };
  const ADMIN_WA = "6281296668670"; // Nomor admin WA

  // ================= SELECTORS =================
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

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
  const notaSendAdmin = $("#notaSendAdmin");

  // ================= HELPERS =================
  const formatRp = n => isNaN(n)?"Rp0":"Rp "+Number(n).toLocaleString("id-ID");
  const getSelectedRadioValue = name => { const r = document.querySelector(`input[name="${name}"]:checked`); return r?r.value:null; };
  const getCheckedValues = selector => $$(selector).filter(ch=>ch.checked).map(ch=>ch.value);

  // Batasi max checkbox
  function enforceMax(selector,max){
    $$(selector).forEach(cb=>{
      cb.addEventListener("change",()=>{
        const count = $$(selector).filter(x=>x.checked).length;
        if(count>max){ cb.checked=false; alert(`Maksimal ${max} pilihan.`); }
      });
    });
  }
  enforceMax(".ultraSingle",5);
  enforceMax(".ultraDouble",5);

  // ================= TOPPING VISIBILITY =================
  function updateToppingVisibility(){
    const mode = getSelectedRadioValue("ultraToppingMode") || "non";
    if(ultraSingleGroup) ultraSingleGroup.style.display=(mode==="single"||mode==="double")?"block":"none";
    if(ultraDoubleGroup) ultraDoubleGroup.style.display=(mode==="double")?"block":"none";
    calculatePrice();
  }
  $$('input[name="ultraToppingMode"]').forEach(r=>r.addEventListener("change",updateToppingVisibility));

  // ================= CALCULATE PRICE =================
  function calculatePrice(){
    const jenis = getSelectedRadioValue("ultraJenis")||"Original";
    const isi = Number(ultraIsi.value||5);
    const jumlah = Number(ultraJumlah.value||1);
    const mode = getSelectedRadioValue("ultraToppingMode")||"non";

    const basePerBox = (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi]) || BASE_PRICE["Original"][5];
    const toppingExtra = TOPPING_EXTRA[mode]||0;
    const pricePerBox = basePerBox+toppingExtra;
    const subtotal = pricePerBox*jumlah;
    const discount = 0;
    const grandTotal = subtotal-discount;

    ultraPricePerBox.textContent = formatRp(pricePerBox);
    ultraSubtotal.textContent = formatRp(subtotal);
    ultraDiscount.textContent = discount?formatRp(discount):"-";
    ultraGrandTotal.textContent = formatRp(grandTotal);

    return {pricePerBox,subtotal,discount,grandTotal,jenis,isi,jumlah,mode};
  }

  // Event update otomatis
  ultraIsi?.addEventListener("change",calculatePrice);
  ultraJumlah?.addEventListener("change",calculatePrice);
  $$('input[name="ultraJenis"]').forEach(r=>r.addEventListener("change",calculatePrice));
  $$('input[name="ultraToppingMode"]').forEach(r=>r.addEventListener("change",calculatePrice));
  $$(".ultraSingle").forEach(cb=>cb.addEventListener("change",calculatePrice));
  $$(".ultraDouble").forEach(cb=>cb.addEventListener("change",calculatePrice));

  updateToppingVisibility();
  calculatePrice();

  // ================= BUILD ORDER =================
  function buildOrderObject(){
    const calc = calculatePrice();
    let wa = ultraWA.value.trim();
    if(wa.startsWith("0")) wa="62"+wa.slice(1);
    return {
      id:"INV"+Date.now().toString().slice(-8),
      nama:ultraNama.value.trim(),
      wa,
      jenis:calc.jenis,
      mode:calc.mode,
      single:getCheckedValues(".ultraSingle"),
      double:getCheckedValues(".ultraDouble"),
      isi:calc.isi,
      jumlah:calc.jumlah,
      pricePerBox:calc.pricePerBox,
      subtotal:calc.subtotal,
      discount:calc.discount,
      total:calc.grandTotal,
      createdAt:new Date().toISOString()
    };
  }

  // ================= GENERATE PDF =================
  function generateInvoicePDF(order){
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text("PUKIS LUMER AULIA",pageWidth/2,20,{align:"center"});
    doc.setFontSize(12);
    doc.text(`Invoice: ${order.id}`,14,30);
    doc.text(`Tanggal: ${new Date().toLocaleString("id-ID")}`,14,38);
    doc.text(`Nama: ${order.nama}`,14,46);
    doc.text(`WA: ${order.wa}`,14,54);

    const body=[
      ["Jenis",order.jenis],
      ["Topping Mode",order.mode],
      ["Topping (Single)",order.single.length?order.single.join(","):"-"],
      ["Taburan (Double)",order.double.length?order.double.join(","):"-"],
      ["Isi/Box",`${order.isi} pcs`],
      ["Jumlah Box",String(order.jumlah)],
      ["Harga/Box",formatRp(order.pricePerBox)],
      ["Subtotal",formatRp(order.subtotal)]
    ];

    doc.autoTable({
      startY:60,
      head:[["Keterangan","Isi"]],
      body,
      theme:"grid",
      styles:{fontSize:10}
    });

    const finalY = doc.lastAutoTable?doc.lastAutoTable.finalY+8:150;
    doc.setFontSize(12); doc.setFont(undefined,"bold");
    doc.text("TOTAL BAYAR:",14,finalY+10);
    doc.text(formatRp(order.total),pageWidth-14,finalY+10,{align:"right"});
    doc.setFontSize(10); doc.setFont(undefined,"normal");
    doc.text("Terima kasih atas pesanan Anda.",pageWidth/2,285,{align:"center"});

    return doc;
  }

  // ================= WA =================
  function buildWAMessage(order){
    return `Halo! Saya ingin memesan Pukis:

Nama: ${order.nama||"-"}
Jenis: ${order.jenis||"-"}
Topping Mode: ${order.mode||"-"}
Topping (Single): ${order.single.length?order.single.join(","):"-"}
Taburan (Double): ${order.double.length?order.double.join(","):"-"}
Isi per Box: ${order.isi} pcs
Jumlah Box: ${order.jumlah} box
Total Bayar: ${formatRp(order.total)}
Invoice: ${order.id}`;
  }
  function openWA(order){ window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(buildWAMessage(order))}`,"_blank"); }

  // ================= NOTA =================
  let lastOrder=null;
  formUltra.addEventListener("submit",ev=>{
    ev.preventDefault();
    if(!ultraNama.value||!ultraWA.value) return alert("Isi nama dan WA terlebih dahulu.");
    const order = buildOrderObject(); lastOrder=order;

    // Nota popup
    notaContent.innerHTML=`
      <div>
        <h4>Invoice: ${order.id}</h4>
        <p><strong>Nama:</strong> ${order.nama}</p>
        <p><strong>WA:</strong> ${order.wa}</p>
        <p><strong>Total:</strong> ${formatRp(order.total)}</p>
        <hr/>
        <p><strong>Detail Pesanan:</strong></p>
        <ul>
          <li>Jenis: ${order.jenis}</li>
          <li>Mode: ${order.mode}</li>
          <li>Topping: ${order.single.length?order.single.join(","):"-"}</li>
          <li>Taburan: ${order.double.length?order.double.join(","):"-"}</li>
          <li>Isi/Box: ${order.isi} pcs</li>
          <li>Jumlah Box: ${order.jumlah}</li>
        </ul>
      </div>`;
    notaContainer.style.display="flex";
  });

  notaClose?.addEventListener("click",()=>{notaContainer.style.display="none";});
  notaPrint?.addEventListener("click",()=>{
    if(!lastOrder) return alert("Belum ada pesanan.");
    generateInvoicePDF(lastOrder)?.save(`Invoice-${lastOrder.id}.pdf`);
  });
  notaSendAdmin?.addEventListener("click",()=>{
    if(!lastOrder) return alert("Belum ada pesanan.");
    openWA(lastOrder);
  });

});
