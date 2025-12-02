(function(){
  'use strict';

  if(!sessionStorage.getItem("adminLogged")){
    window.location.href = "admin-login.html";
  }

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const tableBody = document.querySelector("#orderTable tbody");

  let orders = loadOrders();

  function loadOrders(){
    return JSON.parse(localStorage.getItem("orders") || "[]");
  }

  function saveOrders(arr){
    localStorage.setItem("orders", JSON.stringify(arr));
  }

  /* ======================
      UPDATE STATISTIK
  ====================== */
  function updateStats(list = orders){
    $("#totalOrders").textContent   = list.length;
    $("#doneOrders").textContent    = list.filter(o=>o.status==="done").length;
    $("#pendingOrders").textContent = list.filter(o=>o.status==="pending").length;
  }

  /* ======================
      RENDER TABEL
  ====================== */
  window.renderTable = function(list){
    tableBody.innerHTML = "";

    list.forEach(order=>{
      const toppingsSummary =
        order.mode === "double"
          ? `${(order.single||[]).join(", ")} | ${(order.taburan||[]).join(", ")}`
          : order.mode === "single"
            ? (order.single||[]).join(", ")
            : "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${order.invoice}</td>
        <td>${order.nama}</td>
        <td>Rp ${Number(order.total).toLocaleString()}</td>
        <td>
          <span class="status ${order.status}">
            ${order.status === "done" ? "Selesai" : "Pending"}
          </span>
        </td>
        <td>
          <button class="btn-action edit" onclick="editOrder('${order.id}')">
            <i class="fa fa-pen"></i>
          </button>
          <button class="btn-action print" onclick="printInvoice('${order.id}')">
            <i class="fa fa-print"></i>
          </button>
          <button class="btn-action wa" onclick="sendWA('${order.id}')">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
          <div class="topping-info">
            <strong>Mode:</strong> ${order.mode}<br>
            <strong>Topping:</strong> ${toppingsSummary}
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    updateStats(list);
  };

  /* ======================
        FILTER BUTTONS
  ====================== */
  $("#filterAll").onclick = ()=>{
    activateFilter("filterAll");
    renderTable(orders);
  };

  $("#filterPending").onclick = ()=>{
    activateFilter("filterPending");
    renderTable(orders.filter(o=>o.status==="pending"));
  };

  $("#filterDone").onclick = ()=>{
    activateFilter("filterDone");
    renderTable(orders.filter(o=>o.status==="done"));
  };

  function activateFilter(id){
    $$(".filter-row button").forEach(btn => btn.classList.remove("active"));
    $("#"+id).classList.add("active");
  }

  /* ======================
        EDIT ORDER
  ====================== */
  window.editOrder = function(id){
    sessionStorage.setItem("editOrderId", id);
    window.location.href = "admin-edit.html";
  };

  /* ======================
        PRINT INVOICE
  ====================== */
  window.printInvoice = function(id){
    const order = orders.find(o=>o.id===id);
    if(!order) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("INVOICE PEMESANAN", 14, 18);

    doc.setFontSize(12);
    doc.text(`Invoice: ${order.invoice}`, 14, 30);
    doc.text(`Nama: ${order.nama}`, 14, 38);
    doc.text(`WA: ${order.wa}`, 14, 46);
    doc.text(`Tanggal: ${order.tanggal}`, 14, 54);

    let toppingText = "-";
    if(order.mode === "single"){
      toppingText = (order.single||[]).join(", ");
    }
    if(order.mode === "double"){
      toppingText = `Single: ${(order.single||[]).join(", ")} | Taburan: ${(order.taburan||[]).join(", ")}`;
    }

    doc.autoTable({
      startY: 62,
      head: [["Jenis","Isi","Mode","Topping","Jumlah","Total"]],
      body: [[
        order.jenis,
        order.isi + " pcs",
        order.mode,
        toppingText,
        order.jumlah,
        "Rp " + order.total.toLocaleString()
      ]]
    });

    doc.save(`${order.invoice}.pdf`);
  };

  /* ======================
        WHATSAPP CUSTOMER
  ====================== */
  window.sendWA = function(id){
    const o = orders.find(x=>x.id===id);
    if(!o) return;

    const msg = 
`Halo *${o.nama}*, pesanan kamu *${o.invoice}*:

Total: Rp ${o.total.toLocaleString()}
Status: ${o.status==="done" ? "Selesai" : "Pending"}

Terima kasih 🙏`;

    window.open(
      `https://wa.me/${o.wa}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  /* ======================
      LOGOUT
  ====================== */
  $("#logoutBtn").onclick = ()=>{
    sessionStorage.removeItem("adminLogged");
    window.location.href = "admin-login.html";
  };

  /* ======================
      AUTO REFRESH
  ====================== */
  window.addEventListener("storage", ()=>{
    orders = loadOrders();
    renderTable(orders);
  });

  setInterval(()=>{
    const fresh = loadOrders();
    if(fresh.length !== orders.length){
      orders = fresh;
      renderTable(orders);
    }
  }, 4000);

  renderTable(orders);

})();
