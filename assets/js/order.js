/* assets/js/order.js — FINAL FULL VERSION */
(function(){
  'use strict';

  const ADMIN_WA = "6281296668670"; // nomor admin WA
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* =============================
        TOPPING LISTS
  ============================= */
  const TOPPINGS_SINGLE = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino"];
  const TOPPINGS_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  const MAX_SINGLE = 5;
  const MAX_TABURAN = 5;

  /* =============================
        HARGA PUKIS BERDASARKAN
        JENIS, ISI BOX & MODE
  ============================= */
  const priceMap = {
    "Original": {
      5:   { non: 10000, single: 13000, double: 15000 },
      10:  { non: 18000, single: 25000, double: 28000 }
    },
    "Pandan": {
      5:   { non: 13000, single: 15000, double: 18000 },
      10:  { non: 25000, single: 28000, double: 32000 }
    }
  };

  /* =============================
        UTIL
  ============================= */
  function validateWA(wa){
    wa = (wa||"").replace(/\s+/g,'').trim();
    return /^(08\d{8,13}|\+628\d{7,13})$/.test(wa);
  }

  function genInvoice(){
    return "INV-" + (crypto.randomUUID 
      ? crypto.randomUUID().split("-")[0].toUpperCase()
      : Date.now().toString(36).toUpperCase());
  }

  function genId(){
    return "o" + (crypto.randomUUID 
      ? crypto.randomUUID().split("-")[0]
      : Date.now().toString(36));
  }

  /* =============================
     STATE SELECTION
  ============================= */
  let selectedSingle = [];
  let selectedTaburan = [];

  /* =============================
     RENDER TOPPING BUTTONS
  ============================= */
  function renderToppingButtons(){
    const single = $("#ultraSingleGroup");
    const doubleSingle = $("#ultraDoubleSingle");
    const doubleTaburan = $("#ultraDoubleTaburan");

    if(single) single.innerHTML = "";
    if(doubleSingle) doubleSingle.innerHTML = "";
    if(doubleTaburan) doubleTaburan.innerHTML = "";

    // SINGLE TOPPING BUTTONS
    TOPPINGS_SINGLE.forEach(name=>{
      const btn = makeSingleButton(name);
      if(single) single.appendChild(btn);

      if(doubleSingle){
        const clone = makeSingleButton(name);
        doubleSingle.appendChild(clone);
      }
    });

    // TABURAN BUTTONS
    TOPPINGS_TABURAN.forEach(name=>{
      const b = makeTaburanButton(name);
      if(doubleTaburan) doubleTaburan.appendChild(b);
    });

    refreshDisabledStates();
  }

  function makeSingleButton(name){
    const b = document.createElement("button");
    b.type = "button";
    b.className = "topping-btn single";
    b.textContent = name;
    b.dataset.name = name;

    if(selectedSingle.includes(name)) b.classList.add("active");

    b.addEventListener("click", ()=>{
      const i = selectedSingle.indexOf(name);
      if(i>=0){
        selectedSingle.splice(i,1);
      } else {
        if(selectedSingle.length >= MAX_SINGLE){
          b.classList.add("disabled");
          return setTimeout(()=>b.classList.remove("disabled"),300);
        }
        selectedSingle.push(name);
      }
      renderToppingButtons();
      calcPrice();
    });

    return b;
  }

  function makeTaburanButton(name){
    const b = document.createElement("button");
    b.type = "button";
    b.className = "topping-btn taburan";
    b.textContent = name;
    b.dataset.name = name;

    if(selectedTaburan.includes(name)) b.classList.add("active");

    b.addEventListener("click", ()=>{
      const i = selectedTaburan.indexOf(name);
      if(i>=0){
        selectedTaburan.splice(i,1);
      } else {
        if(selectedTaburan.length >= MAX_TABURAN){
          b.classList.add("disabled");
          return setTimeout(()=>b.classList.remove("disabled"),300);
        }
        selectedTaburan.push(name);
      }
      renderToppingButtons();
      calcPrice();
    });

    return b;
  }

  /* =============================
     UPDATE UI BASED ON MODE
  ============================= */
  function updateToppingUI(){
    const mode = $("input[name='ultraToppingMode']:checked")?.value || "non";

    const single = $("#ultraSingleGroup");
    const wrapper = $("#ultraDoubleWrapper");

    if(mode === "non"){
      if(single) single.style.display = "none";
      if(wrapper) wrapper.style.display = "none";
    }
    else if(mode === "single"){
      if(single) single.style.display = "flex";
      if(wrapper) wrapper.style.display = "none";
    }
    else if(mode === "double"){
      if(single) single.style.display = "none";
      if(wrapper) wrapper.style.display = "block";
    }

    calcPrice();
  }

  /* =============================
        PRICE CALC
  ============================= */
  function calcPrice(){
    const jenis = $("input[name='ultraJenis']:checked")?.value || "Original";
    const isi   = Number($("#ultraIsi").value) || 5;
    const mode  = $("input[name='ultraToppingMode']:checked")?.value || "non";
    const jml   = Math.max(1, Number($("#ultraJumlah").value) || 1);

    const base = priceMap[jenis][isi][mode] || 0;
    const total = base * jml;

    $("#ultraPricePerBox").textContent = "Rp " + base.toLocaleString();
    $("#ultraSubtotal").textContent = "Rp " + (base*jml).toLocaleString();
    $("#ultraGrandTotal").textContent = "Rp " + total.toLocaleString();

    return { base, total };
  }

  /* =============================
        SAVE ORDER
  ============================= */
  function saveOrder(order){
    const arr = JSON.parse(localStorage.getItem("orders") || "[]");
    arr.push(order);
    localStorage.setItem("orders", JSON.stringify(arr));
  }

  /* =============================
      SEND WA TO ADMIN
  ============================= */
  function sendToAdmin(order){
    let msg =
`*ORDER BARU MASUK*
• Invoice: ${order.invoice}
• Nama: ${order.nama}
• WA: ${order.wa}
• Jenis: ${order.jenis}
• Isi: ${order.isi} pcs
• Mode: ${order.mode}
• Jumlah Box: ${order.jumlah}
• Total: Rp ${order.total.toLocaleString()}
`;

    if(order.mode === "single"){
      msg += `• Topping: ${order.single.join(", ") || "-"}\n`;
    }
    if(order.mode === "double"){
      msg += `• Topping Single: ${order.single.join(", ") || "-"}\n`;
      msg += `• Taburan: ${order.taburan.join(", ") || "-"}\n`;
    }

    msg += `\n*Catatan:* ${order.note || "-"}\n\nSilakan diproses admin 🙏`;

    const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  /* =============================
        INIT
  ============================= */
  function init(){
    renderToppingButtons();

    // radio events
    $$("input[name='ultraToppingMode']").forEach(r => r.addEventListener("change", updateToppingUI));
    $$("input[name='ultraJenis']").forEach(r => r.addEventListener("change", calcPrice));
    $("#ultraIsi").addEventListener("change", calcPrice);
    $("#ultraJumlah").addEventListener("input", calcPrice);

    // SUBMIT
    $("#ultraSubmit").addEventListener("click", (e)=>{
      e.preventDefault();

      const nama = $("#ultraNama").value.trim();
      const wa   = $("#ultraWA").value.trim();

      if(!nama) return alert("Nama harus diisi");
      if(!validateWA(wa)) return alert("Nomor WA tidak valid");

      const jenis = $("input[name='ultraJenis']:checked").value;
      const isi   = Number($("#ultraIsi").value);
      const mode  = $("input[name='ultraToppingMode']:checked").value;
      const jml   = Math.max(1, Number($("#ultraJumlah").value) || 1);
      const note  = $("#ultraNote").value.trim();

      const { total } = calcPrice();

      const order = {
        id: genId(),
        invoice: genInvoice(),
        nama, wa, jenis, isi, mode, jumlah:jml, note,
        total,
        tanggal: new Date().toLocaleString("id-ID"),
        status: "pending"
      };

      if(mode === "single"){
        order.single = selectedSingle.slice(0, MAX_SINGLE);
      }
      else if(mode === "double"){
        order.single = selectedSingle.slice(0, MAX_SINGLE);
        order.taburan = selectedTaburan.slice(0, MAX_TABURAN);
      }

      saveOrder(order);
      sendToAdmin(order);

      // reset UI
      $("#formUltra").reset();
      selectedSingle = [];
      selectedTaburan = [];
      renderToppingButtons();
      updateToppingUI();
      calcPrice();

      alert("Pesanan berhasil + WA dikirim ke admin!");
    });

    updateToppingUI();
    calcPrice();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
