/* assets/js/admin-final.js */
(function(){
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const tableBody = $("#orderTableBody");
  const totalOrdersEl = $("#totalOrders");
  const pendingOrdersEl = $("#pendingOrders");
  const doneOrdersEl = $("#doneOrders");

  let orders = JSON.parse(localStorage.getItem("orders")||"[]");

  function updateStats(){
    totalOrdersEl.textContent = orders.length;
    const done = orders.filter(o=>o.status==="done").length;
    const pending = orders.length - done;
    doneOrdersEl.textContent = done;
    pendingOrdersEl.textContent = pending;
  }

  function renderTable(list){
    tableBody.innerHTML="";
    list.forEach(order=>{
      const toppings = order.mode==="double"
        ? `Single: ${(order.single||[]).join(", ")} | Taburan: ${(order.taburan||[]).join(", ")}`
        : order.mode==="single"
          ? (order.single||[]).join(", ")
          : "-";

      const tr = document.createElement("tr");
      tr.innerHTML=`
        <td>${order.invoice}</td>
        <td>${order.nama}</td>
        <td>Rp ${Number(order.total).toLocaleString()}</td>
        <td><span class="status ${order.status||'pending'}">${order.status==="done"?"Selesai":"Belum"}</span></td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-action edit" onclick="editOrder('${order.id}')"><i class="fa fa-pen"></i></button>
            <button class="btn-action print" onclick="printInvoice('${order.id}')"><i class="fa fa-print"></i></button>
            <button class="btn-action wa" onclick="sendWA('${order.id}')"><i class="fa fa-whatsapp"></i></button>
          </div>
          <div style="margin-top:6px;font-size:13px;color:#d1d5db">
            <strong>Mode:</strong> ${order.mode}<br>
            <strong>Topping:</strong> ${toppings}
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    updateStats();
  }

  // FILTER
  $("#filterAll").addEventListener("click",()=>{renderTable(orders)});
  $("#filterPending").addEventListener("click",()=>{renderTable(orders.filter(o=>o.status!=="done"))});
  $("#filterDone").addEventListener("click",()=>{renderTable(orders.filter(o=>o.status==="done"))});

  // EDIT
  window.editOrder = function(id){
    sessionStorage.setItem("editOrderId",id);
    window.location.href="admin-edit.html";
  }

  // WHATSAPP
  window.sendWA = function(id){
    const order = orders.find(o=>o.id===id);
    if(!order) return;
    const msg=`Halo *${order.nama}*, pesanan ${order.invoice}:\nTotal: Rp ${order.total.toLocaleString()}\nStatus: ${order.status==="done"?"Selesai":"Belum"}\nTerima kasih 🙏`;
    window.open(`https://wa.me/${order.wa}?text=${encodeURIComponent(msg)}`,"_blank");
  }

  // CETAK PDF
  window.printInvoice = function(id){
    const order = orders.find(o=>o.id===id);
    if(!order) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("INVOICE PEMESANAN",14,18);
    doc.setFontSize(12);
    doc.text(`Invoice: ${order.invoice}`,14,32);
    doc.text(`Nama: ${order.nama}`,14,38);
    doc.text(`WA: ${order.wa}`,14,44);
    doc.text(`Tanggal: ${order.tanggal}`,14,50);

    let toppingText="-";
    if(order.mode==="single") toppingText=(order.single||[]).join(", ");
    if(order.mode==="double") toppingText=`Single: ${(order.single||[]).join(", ")} | Taburan: ${(order.taburan||[]).join(", ")}`;

    doc.autoTable({
      startY:60,
      head:[["Jenis","Isi","Mode","Topping","Jumlah","Total"]],
      body:[[order.jenis, order.isi+" pcs", order.mode, toppingText, order.jumlah, "Rp "+order.total.toLocaleString()]]
    });

    doc.save(`${order.invoice}.pdf`);
  }

  // REFRESH OTOMATIS
  setInterval(()=>{
    const fresh = JSON.parse(localStorage.getItem("orders")||"[]");
    if(fresh.length!==orders.length){
      orders=fresh;
      renderTable(orders);
    }
  },3000);

  renderTable(orders);
})();
