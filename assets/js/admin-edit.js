/* assets/js/admin-edit.js — FINAL FULL */
(function(){
  'use strict';

  if(!sessionStorage.getItem("adminLogged")){
    window.location.href="admin-login.html";
  }

  const $ = s => document.querySelector(s);

  const TOPPINGS_SINGLE = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino"];
  const TOPPINGS_TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  const MAX_SINGLE = 5;
  const MAX_TABURAN = 5;

  function loadOrders(){ return JSON.parse(localStorage.getItem("orders") || "[]"); }
  function saveOrders(arr){ localStorage.setItem("orders", JSON.stringify(arr)); }

  const priceMap = {
    "Original": {
      5:{non:10000,single:13000,double:15000},
      10:{non:18000,single:25000,double:28000}
    },
    "Pandan": {
      5:{non:13000,single:15000,double:18000},
      10:{non:25000,single:28000,double:32000}
    }
  };

  const editId = sessionStorage.getItem("editOrderId");
  if(!editId) return window.location.href="admin.html";

  let orders = loadOrders();
  let order = orders.find(o=>o.id===editId);
  if(!order) return window.location.href="admin.html";

  // fill form
  $("#editInvoice").value = order.invoice;
  $("#editNama").value = order.nama;
  $("#editWA").value = order.wa;
  $("#editJenis").value = order.jenis;
  $("#editIsi").value = order.isi;
  $("#editMode").value = order.mode;
  $("#editJumlah").value = order.jumlah;
  $("#editNote").value = order.note;
  $("#editStatus").value = order.status;

  // topping state
  let selectedSingle = (order.single || []).slice();
  let selectedTaburan = (order.taburan || []).slice();

  function renderEditToppings(){
    const scont = $("#editSingleGroup");
    const tcont = $("#editTaburanGroup");

    scont.innerHTML = "";
    tcont.innerHTML = "";

    TOPPINGS_SINGLE.forEach(name=>{
      const b = document.createElement("button");
      b.type="button";
      b.className="topping-btn single";
      b.textContent=name;
      b.dataset.name=name;

      if(selectedSingle.includes(name)) b.classList.add("active");

      b.addEventListener("click", ()=>{
        const i = selectedSingle.indexOf(name);
        if(i>=0) selectedSingle.splice(i,1);
        else{
          if(selectedSingle.length>=MAX_SINGLE){
            b.classList.add("disabled"); 
            return setTimeout(()=>b.classList.remove("disabled"), 350);
          }
          selectedSingle.push(name);
        }
        renderEditToppings();
      });

      scont.appendChild(b);
    });

    TOPPINGS_TABURAN.forEach(name=>{
      const b = document.createElement("button");
      b.type="button";
      b.className="topping-btn taburan";
      b.textContent=name;

      if(selectedTaburan.includes(name)) b.classList.add("active");

      b.addEventListener("click", ()=>{
        const i = selectedTaburan.indexOf(name);
        if(i>=0) selectedTaburan.splice(i,1);
        else{
          if(selectedTaburan.length>=MAX_TABURAN){
            b.classList.add("disabled");
            return setTimeout(()=>b.classList.remove("disabled"),350);
          }
          selectedTaburan.push(name);
        }
        renderEditToppings();
      });

      tcont.appendChild(b);
    });
  }

  renderEditToppings();

  /* SAVE CHANGES */
  $("#editForm").addEventListener("submit", e=>{
    e.preventDefault();

    order.nama = $("#editNama").value.trim();
    order.wa   = $("#editWA").value.trim();
    order.jenis= $("#editJenis").value;
    order.isi  = Number($("#editIsi").value);
    order.mode = $("#editMode").value;
    order.jumlah = Number($("#editJumlah").value);
    order.note = $("#editNote").value;
    order.status = $("#editStatus").value;

    const base = priceMap[order.jenis][order.isi][order.mode];
    order.total = base * order.jumlah;

    order.single = selectedSingle.slice(0,MAX_SINGLE);
    order.taburan = selectedTaburan.slice(0,MAX_TABURAN);

    saveOrders(orders);
    alert("Perubahan tersimpan");
    window.location.href="admin.html";
  });

  $("#deleteBtn").addEventListener("click", ()=>{
    if(!confirm("Hapus pesanan ini?")) return;
    orders = orders.filter(o=>o.id !== order.id);
    saveOrders(orders);
    window.location.href="admin.html";
  });

  $("#backBtn").addEventListener("click", ()=>{
    window.location.href="admin.html";
  });

})();
