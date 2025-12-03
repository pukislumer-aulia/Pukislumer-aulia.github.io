/* assets/js/order.js — FINAL FIX */
(function(){
  'use strict';

  const ADMIN_WA = "6281296668670";

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const TOPPINGS_SINGLE = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino"];
  const TOPPINGS_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];
  const MAX_TOPPINGS = 5;

  const HARGA_PUKIS = {
    "Original": {5:{non:10000,single:13000,double:15000},10:{non:18000,single:25000,double:28000}},
    "Pandan":   {5:{non:13000,single:15000,double:18000},10:{non:25000,single:28000,double:32000}}
  };

  const el = {
    form: $("#formUltra"),
    nama: $("#ultraNama"),
    wa: $("#ultraWA"),
    jenis: $$("input[name='ultraJenis']"),
    isi: $("#ultraIsi"),
    toppingMode: $$("input[name='ultraToppingMode']"),
    jml: $("#ultraJumlah"),
    note: $("#ultraNote"),

    singleGroup: $("#ultraSingleGroup"),
    doubleGroup: $("#ultraDoubleGroup"),

    pricePerBox: $("#ultraPricePerBox"),
    subtotal: $("#ultraSubtotal"),
    grandTotal: $("#ultraGrandTotal"),

    submitBtn: $("#ultraSubmit"),
    notaContainer: $("#notaContainer"),
    notaContent: $("#notaContent"),
    notaClose: $("#notaClose"),
    notaPrint: $("#notaPrint")
  };

  let selectedSingle = [];
  let selectedTaburan = [];

  function formatRupiah(num){return "Rp "+(num||0).toLocaleString("id-ID");}
  function genId(){return "o"+(crypto.randomUUID?crypto.randomUUID().split("-")[0]:Date.now().toString(36));}
  function genInvoice(){return "INV-"+(crypto.randomUUID?crypto.randomUUID().split("-")[0].toUpperCase():Date.now().toString(36).toUpperCase());}
  function isValidWA(wa){return /^(08\d{8,13}|\+628\d{7,13})$/.test((wa||"").replace(/\s+/g,''));}

  /* =========================
     RENDER TOPPING BUTTONS
  ========================= */
  function renderToppings(){
    el.singleGroup.innerHTML="";
    el.doubleGroup.innerHTML="";

    TOPPINGS_SINGLE.forEach(name=>{
      const btn = document.createElement("button");
      btn.type="button";
      btn.textContent=name;
      btn.className="topping-btn single";
      if(selectedSingle.includes(name)) btn.classList.add("active");
      btn.addEventListener("click",()=>{toggleTopping(name,true)});
      el.singleGroup.appendChild(btn);
    });

    [...TOPPINGS_SINGLE,...TOPPINGS_TABURAN].forEach(name=>{
      const btn = document.createElement("button");
      btn.type="button";
      btn.textContent=name;
      btn.className="topping-btn taburan";
      if(selectedTaburan.includes(name)) btn.classList.add("active");
      btn.addEventListener("click",()=>{toggleTopping(name,false)});
      el.doubleGroup.appendChild(btn);
    });

    updateToppingUI();
  }

  function toggleTopping(name,isSingle){
    const arr = isSingle?selectedSingle:selectedTaburan;
    const index = arr.indexOf(name);
    if(index>=0) arr.splice(index,1);
    else if(arr.length<MAX_TOPPINGS) arr.push(name);
    renderToppings();
    calcPrice();
  }

  function updateToppingUI(){
    const mode = $$("input[name='ultraToppingMode']:checked")[0]?.value || "non";
    el.singleGroup.style.display = mode==="single"?"flex":"none";
    el.doubleGroup.style.display = mode==="double"?"flex":"none";
  }

  /* =========================
     PRICE CALC
  ========================= */
  function calcPrice(){
    const jenis = $$("input[name='ultraJenis']:checked")[0]?.value || "Original";
    const isi = Number(el.isi.value)||5;
    const mode = $$("input[name='ultraToppingMode']:checked")[0]?.value || "non";
    const jml = Math.max(1,Number(el.jml.value)||1);
    const base = HARGA_PUKIS[jenis][isi][mode]||0;
    const total = base*jml;

    el.pricePerBox.textContent=formatRupiah(base);
    el.subtotal.textContent=formatRupiah(base*jml);
    el.grandTotal.textContent=formatRupiah(total);
    return {base,total};
  }

  function validateForm(){
    if(!el.nama.value.trim()){alert("Nama harus diisi"); el.nama.focus(); return false;}
    if(!isValidWA(el.wa.value)){alert("Nomor WA tidak valid"); el.wa.focus(); return false;}
    if(Number(el.jml.value)<=0){alert("Jumlah harus >0"); el.jml.focus(); return false;}
    return true;
  }

  function saveOrder(order){
    const orders = JSON.parse(localStorage.getItem("orders")||"[]");
    orders.push(order);
    localStorage.setItem("orders",JSON.stringify(orders));
  }

  function sendToAdmin(order){
    let msg=`*ORDER BARU MASUK*\n• Invoice: ${order.invoice}\n• Nama: ${order.nama}\n• WA: ${order.wa}\n• Jenis: ${order.jenis}\n• Isi: ${order.isi} pcs\n• Mode: ${order.mode}\n• Jumlah Box: ${order.jumlah}\n• Total: ${formatRupiah(order.total)}`;
    if(order.mode==="single") msg+=`\n• Topping: ${order.single.join(", ")||"-"}`;
    if(order.mode==="double") msg+=`\n• Topping Single: ${order.single.join(", ")||"-"}\n• Taburan: ${order.taburan.join(", ")||"-"}`;
    msg+=`\n*Catatan:* ${order.note||"-"}\n\nSilakan diproses admin 🙏`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`,"_blank");
  }

  function generateNotaHTML(order){
    let toppingText="-";
    if(order.mode==="single") toppingText="Topping: "+(order.single.join(", ")||"-");
    if(order.mode==="double") toppingText=`Single: ${order.single.join(", ")||"-"} | Taburan: ${order.taburan.join(", ")||"-"}`;
    return `<p><strong>Nama:</strong> ${order.nama}</p>
            <p><strong>Jenis:</strong> ${order.jenis}</p>
            <p><strong>Isi per Box:</strong> ${order.isi} pcs</p>
            <p><strong>${toppingText}</strong></p>
            <p><strong>Jumlah Box:</strong> ${order.jumlah}</p>
            <hr>
            <p><strong>Total Harga:</strong> ${formatRupiah(order.total)}</p>
            <button id="notaSendWA" class="btn btn-wa">Kirim WA ke Admin & Simpan untuk Admin</button>`;
  }

  function handleSubmit(e){
    e.preventDefault();
    if(!validateForm()) return;

    const jenis = $$("input[name='ultraJenis']:checked")[0].value;
    const isi = Number(el.isi.value);
    const mode = $$("input[name='ultraToppingMode']:checked")[0].value;
    const jumlah = Math.max(1,Number(el.jml.value)||1);
    const {total} = calcPrice();

    const order = {
      id: genId(),
      invoice: genInvoice(),
      nama: el.nama.value.trim(),
      wa: el.wa.value.trim(),
      jenis, isi, mode, jumlah,
      note: el.note.value.trim(),
      total,
      single:selectedSingle.slice(0,MAX_TOPPINGS),
      taburan:selectedTaburan.slice(0,MAX_TOPPINGS),
      tanggal:new Date().toLocaleString("id-ID")
    };

    saveOrder(order);

    // popup nota
    el.notaContent.innerHTML=generateNotaHTML(order);
    el.notaContainer.classList.add("show");

    // tombol kirim WA di nota
    $("#notaSendWA").addEventListener("click",()=>{
      sendToAdmin(order);
      alert("WA terkirim & data tersimpan di admin!");
      el.notaContainer.classList.remove("show");
    });

    // reset form
    el.form.reset();
    selectedSingle=[];
    selectedTaburan=[];
    renderToppings();
    calcPrice();
  }

  function handleNotaClose(){el.notaContainer.classList.remove("show");}

  function init(){
    renderToppings();
    calcPrice();
    el.form.addEventListener("submit",handleSubmit);
    el.notaClose.addEventListener("click",handleNotaClose);
    el.jml.addEventListener("input",calcPrice);
    el.isi.addEventListener("change",calcPrice);
    el.toppingMode.forEach(r=>r.addEventListener("change",()=>{updateToppingUI();calcPrice();}));
    el.jenis.forEach(r=>r.addEventListener("change",calcPrice));
  }

  document.addEventListener("DOMContentLoaded",init);
})();
