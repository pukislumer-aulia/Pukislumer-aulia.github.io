/* assets/js/order.js — FINAL FIX */
(function(){
  'use strict';

  const ADMIN_WA = "6281296668670";
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // DATA
  const TOPPINGS_SINGLE = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino"];
  const TOPPINGS_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];
  const MAX_SINGLE = 5;
  const MAX_DOUBLE_SINGLE = 5;
  const MAX_DOUBLE_TABURAN = 5;

  const HARGA_PUKIS = {
    Original: {
      5: {non:10000, single:13000, double:15000},
      10:{non:18000, single:25000, double:28000}
    },
    Pandan: {
      5: {non:13000, single:15000, double:18000},
      10:{non:25000, single:28000, double:32000}
    }
  };

  // ELEMENTS
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

  // STATE
  let selectedSingle = [];
  let selectedTaburan = [];

  // TOPPING RENDER
  function renderToppings(){
    el.singleGroup.innerHTML="";
    el.doubleGroup.innerHTML="";

    // Single mode
    TOPPINGS_SINGLE.forEach(name=>{
      const btn = document.createElement("button");
      btn.type="button";
      btn.className="topping-btn single";
      btn.textContent=name;
      if(selectedSingle.includes(name)) btn.classList.add("active");
      btn.addEventListener("click",()=>{
        if(selectedSingle.includes(name)){
          selectedSingle = selectedSingle.filter(t=>t!==name);
        } else {
          if(selectedSingle.length>=MAX_SINGLE) return;
          selectedSingle.push(name);
        }
        renderToppings();
        calcPrice();
      });
      el.singleGroup.appendChild(btn);
    });

    // Double mode
    [...TOPPINGS_SINGLE,...TOPPINGS_TABURAN].forEach(name=>{
      const btn = document.createElement("button");
      btn.type="button";
      btn.className="topping-btn double";
      btn.textContent=name;
      // Determine type
      const isSinglePart = TOPPINGS_SINGLE.includes(name);
      const arrayRef = isSinglePart ? selectedSingle : selectedTaburan;
      const maxLimit = isSinglePart ? MAX_DOUBLE_SINGLE : MAX_DOUBLE_TABURAN;

      if(arrayRef.includes(name)) btn.classList.add("active");
      btn.addEventListener("click",()=>{
        if(arrayRef.includes(name)){
          arrayRef.splice(arrayRef.indexOf(name),1);
        } else {
          if(arrayRef.length>=maxLimit) return;
          arrayRef.push(name);
        }
        renderToppings();
        calcPrice();
      });
      el.doubleGroup.appendChild(btn);
    });
  }

  function updateToppingUI(){
    const mode = $$("input[name='ultraToppingMode']:checked")[0].value;
    el.singleGroup.style.display=(mode==="single")?"flex":"none";
    el.doubleGroup.style.display=(mode==="double")?"flex":"none";
    renderToppings();
  }

  // PRICE CALC
  function calcPrice(){
    const jenis = $$("input[name='ultraJenis']:checked")[0].value;
    const isi = Number(el.isi.value);
    const mode = $$("input[name='ultraToppingMode']:checked")[0].value;
    const jml = Math.max(1, Number(el.jml.value));

    const base = HARGA_PUKIS[jenis][isi][mode]||0;
    const total = base * jml;

    el.pricePerBox.textContent="Rp "+base.toLocaleString();
    el.subtotal.textContent="Rp "+(base*jml).toLocaleString();
    el.grandTotal.textContent="Rp "+total.toLocaleString();
    return {base,total};
  }

  function isValidWA(wa){
    return /^(08\d{8,13}|\+628\d{7,13})$/.test(wa.replace(/\s+/g,""));
  }

  function genId(){return "o"+Date.now().toString(36);}
  function genInvoice(){return "INV-"+Date.now().toString(36).toUpperCase();}

  function saveOrder(order){
    const orders = JSON.parse(localStorage.getItem("orders")||"[]");
    orders.push(order);
    localStorage.setItem("orders",JSON.stringify(orders));
  }

  function sendToAdmin(order){
    let msg=`*ORDER BARU*\nInvoice: ${order.invoice}\nNama: ${order.nama}\nWA: ${order.wa}\nJenis: ${order.jenis}\nIsi: ${order.isi} pcs\nMode: ${order.mode}\nJumlah: ${order.jumlah}\nTotal: Rp ${order.total.toLocaleString()}`;
    if(order.mode==="single") msg+="\nTopping: "+(order.single.join(", ")||"-");
    if(order.mode==="double") msg+="\nSingle: "+(order.single.join(", ")||"-")+"\nTaburan: "+(order.taburan.join(", ")||"-");
    msg+="\nCatatan: "+(order.note||"-");
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`,"_blank");
  }

  function generateNotaHTML(order){
    let toppingText="";
    if(order.mode==="single") toppingText="Topping: "+(order.single.join(", ")||"-");
    if(order.mode==="double") toppingText="Single: "+(order.single.join(", ")||"-")+" | Taburan: "+(order.taburan.join(", ")||"-");
    if(order.mode==="non") toppingText="Tanpa topping";

    return `
      <p><strong>Nama:</strong> ${order.nama}</p>
      <p><strong>Jenis:</strong> ${order.jenis}</p>
      <p><strong>${toppingText}</strong></p>
      <p><strong>Isi per Box:</strong> ${order.isi} pcs</p>
      <p><strong>Jumlah Box:</strong> ${order.jumlah}</p>
      <hr>
      <p><strong>Total Harga:</strong> Rp ${order.total.toLocaleString()}</p>
    `;
  }

  function handleSubmit(e){
    e.preventDefault();
    if(!el.nama.value.trim()){alert("Nama harus diisi"); return;}
    if(!isValidWA(el.wa.value)){alert("WA tidak valid"); return;}
    if(Number(el.jml.value)<=0){alert("Jumlah minimal 1"); return;}

    const jenis = $$("input[name='ultraJenis']:checked")[0].value;
    const isi = Number(el.isi.value);
    const mode = $$("input[name='ultraToppingMode']:checked")[0].value;
    const jml = Math.max(1, Number(el.jml.value));

    const {total} = calcPrice();

    const order = {
      id: genId(),
      invoice: genInvoice(),
      nama: el.nama.value.trim(),
      wa: el.wa.value.trim(),
      jenis, isi, mode,
      jumlah: jml,
      note: el.note.value.trim(),
      total,
      single: selectedSingle.slice(),
      taburan: selectedTaburan.slice(),
      tanggal: new Date().toLocaleString()
    };

    saveOrder(order);
    sendToAdmin(order);

    el.notaContent.innerHTML=generateNotaHTML(order);
    el.notaContainer.classList.add("show");

    // reset
    el.form.reset();
    selectedSingle=[]; selectedTaburan=[];
    renderToppings();
    updateToppingUI();
    calcPrice();

    alert("Pesanan berhasil, WA terkirim ke admin!");
  }

  // INIT
  function init(){
    renderToppings();
    updateToppingUI();
    calcPrice();

    el.toppingMode.forEach(r=>r.addEventListener("change",updateToppingUI));
    el.jenis.forEach(r=>r.addEventListener("change",calcPrice));
    el.isi.addEventListener("change",calcPrice);
    el.jml.addEventListener("input",calcPrice);

    el.form.addEventListener("submit",handleSubmit);
    el.notaClose.addEventListener("click",()=>el.notaContainer.classList.remove("show"));
  }

  document.addEventListener("DOMContentLoaded",init);

})();
