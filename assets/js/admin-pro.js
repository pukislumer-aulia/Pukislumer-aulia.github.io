/* assets/js/admin-pro.js — FINAL */
(function(){
  'use strict';

  if(!sessionStorage.getItem("adminLogged")){
    window.location.href="admin-login.html";
  }

  const $ = s => document.querySelector(s);
  const tableBody = $("#orderTableBody");
  let orders = loadOrders();

  function loadOrders(){
    return JSON.parse(localStorage.getItem("orders") || "[]");
  }

  function saveOrders(arr){
    localStorage.setItem("orders", JSON.stringify(arr || []));
  }

  function updateStats(){
    const total = orders.length;
    const done  = orders.filter(o=>o.status==="done").length;
    $("#totalOrders").textContent = total;
    $("#completedOrders").textContent = done;
  }

  /* =============================
        RENDER TABLE ADMIN
  ============================= */
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
        <td><span class="status ${order.status}">${order.status==="done"?"Selesai":"Belum"}</span></td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-action edit" onclick="editOrder('${order.id}')"><i class="fa fa-pen"></i></button>
            <button class="btn-action print" onclick="printInvoice('${order.id}')"><i class="fa fa-print"></i></button>
            <button class="btn-action wa" onclick="sendWA('${order.id}')"><i class="fa fa-whatsapp"></i></button>
          </div>
          <div style="margin-top:6px;font-size:13px;color:#d1d5db">
            <strong>Mode:</strong> ${order.mode}<br>
            <strong>Topping:</strong> ${toppingsSummary}
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    updateStats();
  };

  /* =============================
       FUNCTION — EDIT ORDER
  ============================= */
  window.editOrder = function(id){
    sessionStorage.setItem("editOrderId", id);
    window.location.href="admin-edit.html";
  };

  /* =============================
       FUNCTION — WHATSAPP CUSTOMER
  ============================= */
  window.sendWA = function(id){
    const order = orders.find(o=>o.id===id);
    if(!order) return;

    const msg = 
`Halo *${order.nama}*, pesanan kamu *${order.invoice}*:

Total: Rp ${order.total.toLocaleString()}
Status: ${order.status==="done" ? "Selesai" : "Belum diproses"}

Terima kasih 🙏`;

    const url = `https://wa.me/${order.wa}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  /* =============================
       PRINT INVOICE (PDF)
  ============================= */
  window.printInvoice = function(id){
    const order = orders.find(o=>o.id===id);
    if(!order) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("INVOICE PEMESANAN", 14, 18);

    doc.setFontSize(12);
    doc.text(`Invoice: ${order.invoice}`, 14, 32);
    doc.text(`Nama: ${order.nama}`, 14, 38);
    doc.text(`WA: ${order.wa}`, 14, 44);
    doc.text(`Tanggal: ${order.tanggal}`, 14, 50);

    let toppingText = "-";
    if(order.mode === "single"){
      toppingText = (order.single||[]).join(", ");
    }
    if(order.mode === "double"){
      toppingText = `Single: ${(order.single||[]).join(", ")} | Taburan: ${(order.taburan||[]).join(", ")}`;
    }

    doc.autoTable({
      startY: 60,
      head: [["Jenis","Isi","Mode","Topping","Jumlah","Total"]],
      body: [[
        order.jenis,
        order.isi+" pcs",
        order.mode,
        toppingText,
        order.jumlah,
        "Rp "+order.total.toLocaleString()
      ]]
    });

    doc.save(`${order.invoice}.pdf`);
  };

  /* =============================
      OPTIMIZED AUTO-REFRESH
  ============================= */
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
  }, 5000);

  renderTable(orders);
})();
