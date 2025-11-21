// ================= order.js - Bagian 1 =================
document.addEventListener("DOMContentLoaded",()=>{

  // ====== CONFIG ======
  const BASE_PRICE = { Original: {5:10000,10:18000}, Pandan: {5:12000,10:22000} };
  const TOPPING_EXTRA = { non:0, single:2000, double:4000 };
  const ADMIN_WA = "6281296668670";

  // ====== SELECTORS ======
  const $ = s=>document.querySelector(s);
  const $$ = s=>Array.from(document.querySelectorAll(s));

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

  // ====== HELPERS ======
  const formatRp = n=>"Rp"+Number(n).toLocaleString("id-ID");
  const getSelectedRadioValue = name=>{ const r = document.querySelector(`input[name="${name}"]:checked`); return r?r.value:null; };
  const getCheckedValues = selector=>$$(selector).filter(ch=>ch.checked).map(ch=>ch.value);

  // ====== MAX CHECKBOX ======
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

  // ====== TOPPING VISIBILITY ======
  function updateToppingVisibility(){
    const mode = getSelectedRadioValue("ultraToppingMode")||"non";
    if(ultraSingleGroup) ultraSingleGroup.style.display=(mode==="single"||mode==="double")?"block":"none";
    if(ultraDoubleGroup) ultraDoubleGroup.style.display=(mode==="double")?"block":"none";
  }
  $$('input[name="ultraToppingMode"]').forEach(r=>r.addEventListener("change",()=>{
    updateToppingVisibility();
    calculatePrice();
  }));

  updateToppingVisibility();
  // ================= order.js - Bagian 2 =================

  // ====== HITUNG HARGA ======
  function calculatePrice(){
    const jenis = getSelectedRadioValue("ultraJenis") || "Original";
    const isi = parseInt(ultraIsi.value || 5);
    const mode = getSelectedRadioValue("ultraToppingMode") || "non";
    const jumlahBox = parseInt(ultraJumlah.value || 1);

    // Harga dasar per box
    let pricePerBox = BASE_PRICE[jenis][isi] || 0;
    // Tambahan topping
    pricePerBox += TOPPING_EXTRA[mode] || 0;

    const subtotal = pricePerBox * jumlahBox;
    const discount = 0; // bisa ditambah logika diskon
    const total = subtotal - discount;

    ultraPricePerBox.textContent = formatRp(pricePerBox);
    ultraSubtotal.textContent = formatRp(subtotal);
    ultraDiscount.textContent = discount>0?formatRp(discount):"-";
    ultraGrandTotal.textContent = formatRp(total);

    return { jenis, isi, mode, pricePerBox, subtotal, discount, total, jumlahBox };
  }

  // ====== UPDATE HARGA OTOMATIS ======
  ultraIsi.addEventListener("change",calculatePrice);
  ultraJumlah.addEventListener("input",calculatePrice);
  $$('input[name="ultraJenis"]').forEach(r=>r.addEventListener("change",calculatePrice));
  $$('input.ultraSingle, input.ultraDouble').forEach(cb=>cb.addEventListener("change",calculatePrice));

  calculatePrice();

  // ====== BUILD NOTA HTML ======
  function buildNota(){
    const data = calculatePrice();
    const nama = ultraNama.value.trim();
    const wa = ultraWA.value.trim();
    const singleToppings = getCheckedValues(".ultraSingle").join(", ") || "-";
    const doubleToppings = getCheckedValues(".ultraDouble").join(", ") || "-";

    let html = `<p><strong>Nama:</strong> ${nama}</p>`;
    html += `<p><strong>No WA:</strong> ${wa}</p>`;
    html += `<p><strong>Jenis:</strong> ${data.jenis}</p>`;
    html += `<p><strong>Isi per Box:</strong> ${data.isi}</p>`;
    html += `<p><strong>Topping Single:</strong> ${singleToppings}</p>`;
    html += `<p><strong>Taburan Double:</strong> ${doubleToppings}</p>`;
    html += `<p><strong>Jumlah Box:</strong> ${data.jumlahBox}</p>`;
    html += `<p><strong>Harga per Box:</strong> ${formatRp(data.pricePerBox)}</p>`;
    html += `<p><strong>Subtotal:</strong> ${formatRp(data.subtotal)}</p>`;
    html += `<p><strong>Diskon:</strong> ${data.discount>0?formatRp(data.discount):"-"}</p>`;
    html += `<p><strong>Total Bayar:</strong> ${formatRp(data.total)}</p>`;

    notaContent.innerHTML = html;
    notaContainer.style.display = "flex";
  }

  // ====== CLOSE NOTA ======
  notaClose.addEventListener("click",()=>{ notaContainer.style.display="none"; });

  // ====== PDF ======
  notaPrint.addEventListener("click",()=>{
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.html(notaContent, {
      callback: function (doc) {
        doc.save("Nota-Pemesanan.pdf");
      },
      x:10, y:10, width:180
    });
  });

  // ====== KIRIM WA ADMIN ======
  notaSendAdmin.addEventListener("click",()=>{
    const data = calculatePrice();
    const nama = ultraNama.value.trim();
    const wa = ultraWA.value.trim();
    const singleToppings = getCheckedValues(".ultraSingle").join(", ") || "-";
    const doubleToppings = getCheckedValues(".ultraDouble").join(", ") || "-";

    const text = `*Nota Pemesanan Pukis Lumer Aulia*\nNama: ${nama}\nWA: ${wa}\nJenis: ${data.jenis}\nIsi/Box: ${data.isi}\nTopping: ${singleToppings}\nTaburan: ${doubleToppings}\nJumlah Box: ${data.jumlahBox}\nTotal Bayar: ${formatRp(data.total)}`;

    const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`;
    window.open(url,"_blank");
  });

  // ====== FORM SUBMIT ======
  formUltra.addEventListener("submit",e=>{
    e.preventDefault();
    buildNota();
  });

}); // DOMContentLoaded end
