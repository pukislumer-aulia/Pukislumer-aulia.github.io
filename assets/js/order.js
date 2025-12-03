(function(){
  "use strict";

  // ==== SELECTORS ====
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // Form
  const form = $("#formUltra");
  const namaInput = $("#ultraNama");
  const waInput = $("#ultraWA");
  const jenisInput = $$("input[name='ultraJenis']");
  const isiSelect = $("#ultraIsi");
  const toppingModeInputs = $$("input[name='ultraToppingMode']");
  const singleGroup = $("#ultraSingleGroup");
  const doubleGroup = $("#ultraDoubleGroup");
  const noteInput = $("#ultraNote");
  const jumlahInput = $("#ultraJumlah");

  // Price summary
  const pricePerBoxEl = $("#ultraPricePerBox");
  const subtotalEl = $("#ultraSubtotal");
  const grandTotalEl = $("#ultraGrandTotal");

  // Nota
  const notaContainer = $("#notaContainer");
  const notaContent = $("#notaContent");
  const notaClose = $("#notaClose");

  // Data topping
  const singleToppings = ["Coklat", "Keju", "Kacang", "Oreo", "Meses"];
  const taburanToppings = ["Choco Chips", "Meises Warna", "Keju Parut", "Kacang Panggang"];

  let state = {
    mode: "non",
    single: [],
    taburan: [],
    pricePerBox: 0
  };

  // ==== FUNCTIONS ====

  function renderToppings(){
    singleGroup.innerHTML = "";
    doubleGroup.innerHTML = "";

    if(state.mode === "single" || state.mode === "double"){
      singleToppings.forEach(name=>{
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "topping-btn single";
        btn.textContent = name;
        btn.addEventListener("click", ()=>{
          if(btn.classList.contains("active")){
            btn.classList.remove("active");
            state.single = state.single.filter(x=>x!==name);
          } else {
            state.single.push(name);
            btn.classList.add("active");
          }
          updatePrice();
        });
        singleGroup.appendChild(btn);
      });
    }

    if(state.mode === "double"){
      taburanToppings.forEach(name=>{
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "topping-btn taburan";
        btn.textContent = name;
        btn.addEventListener("click", ()=>{
          if(btn.classList.contains("active")){
            btn.classList.remove("active");
            state.taburan = state.taburan.filter(x=>x!==name);
          } else {
            state.taburan.push(name);
            btn.classList.add("active");
          }
          updatePrice();
        });
        doubleGroup.appendChild(btn);
      });
    }
  }

  function updatePrice(){
    // Base price depending on isi
    const isi = parseInt(isiSelect.value,10);
    state.pricePerBox = isi === 5 ? 10000 : 18000; // contoh: 5 pcs 10K, 10 pcs 18K

    // Add topping surcharges
    if(state.mode === "single") state.pricePerBox += state.single.length * 2000;
    if(state.mode === "double") state.pricePerBox += (state.single.length + state.taburan.length) * 1500;

    const jumlah = parseInt(jumlahInput.value,10) || 1;
    const subtotal = state.pricePerBox;
    const grandTotal = state.pricePerBox * jumlah;

    pricePerBoxEl.textContent = `Rp${subtotal.toLocaleString()}`;
    subtotalEl.textContent = `Rp${(subtotal*jumlah).toLocaleString()}`;
    grandTotalEl.textContent = `Rp${grandTotal.toLocaleString()}`;
  }

  function resetForm(){
    form.reset();
    state = {mode:"non", single:[], taburan:[], pricePerBox:0};
    renderToppings();
    updatePrice();
  }

  function generateInvoice(){
    const invoiceId = "INV" + Date.now();
    return invoiceId;
  }

  // ==== EVENTS ====
  toppingModeInputs.forEach(radio=>{
    radio.addEventListener("change", ()=>{
      state.mode = radio.value;
      state.single = [];
      state.taburan = [];
      renderToppings();
      updatePrice();
    });
  });

  isiSelect.addEventListener("change", updatePrice);
  jumlahInput.addEventListener("input", updatePrice);

  form.addEventListener("submit", e=>{
    e.preventDefault();
    const order = {
      id: Date.now().toString(),
      invoice: generateInvoice(),
      nama: namaInput.value,
      wa: waInput.value,
      jenis: Array.from(jenisInput).find(r=>r.checked).value,
      isi: isiSelect.value,
      mode: state.mode,
      single: state.single,
      taburan: state.taburan,
      jumlah: parseInt(jumlahInput.value,10),
      total: state.pricePerBox * parseInt(jumlahInput.value,10),
      catatan: noteInput.value,
      tanggal: new Date().toLocaleString(),
      status: "pending"
    };

    // Simpan ke localStorage
    const orders = JSON.parse(localStorage.getItem("orders")||"[]");
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    // Tampilkan nota
    notaContent.innerHTML = `
      <p><strong>Invoice:</strong> ${order.invoice}</p>
      <p><strong>Nama:</strong> ${order.nama}</p>
      <p><strong>WA:</strong> ${order.wa}</p>
      <p><strong>Jenis:</strong> ${order.jenis}</p>
      <p><strong>Isi:</strong> ${order.isi} pcs</p>
      <p><strong>Mode:</strong> ${order.mode}</p>
      <p><strong>Topping:</strong> ${(order.single||[]).join(", ")}${order.mode==="double"? " | "+(order.taburan||[]).join(", "):""}</p>
      <p><strong>Jumlah Box:</strong> ${order.jumlah}</p>
      <p><strong>Total Bayar:</strong> Rp${order.total.toLocaleString()}</p>
      <p><strong>Catatan:</strong> ${order.catatan||"-"}</p>
    `;
    notaContainer.classList.add("show");

    resetForm();
  });

  notaClose.addEventListener("click", ()=>{
    notaContainer.classList.remove("show");
  });

  // Inisialisasi
  renderToppings();
  updatePrice();

})();
