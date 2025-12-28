/* =========================================================
   ADMIN PANEL - PUKIS LUMER AULIA
   FINAL VERSION (NO MODULE, NO IMPORT)
   COMPATIBLE MOBILE & DESKTOP
========================================================= */

(function () {
  "use strict";

  /* ================= CONFIG ================= */
  const ADMIN_PIN = "030419";
  const LOGIN_KEY = "pukis_admin_login";
  const ORDER_KEY = "pukis_orders";

  /* ================= DOM ================= */
  const loginScreen = document.getElementById("loginScreen");
  const adminPanel = document.getElementById("adminPanel");

  const pinInput = document.getElementById("pinInput");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const statTotalOrder = document.getElementById("statTotalOrder");
  const statPending = document.getElementById("statPending");
  const statDone = document.getElementById("statDone");
  const statRevenue = document.getElementById("statRevenue");

  const orderTableBody = document.querySelector("#orderTable tbody");

  const filterAll = document.getElementById("filterAll");
  const filterPending = document.getElementById("filterPending");
  const filterDone = document.getElementById("filterDone");
  const printLastInvoice = document.getElementById("printLastInvoice");

  const invoiceModal = document.getElementById("invoiceModal");
  const invoicePreview = document.getElementById("invoicePreview");
  const btnPrintInvoice = document.getElementById("btnPrintInvoice");
  const btnExportPdf = document.getElementById("btnExportPdf");
  const btnCloseModal = document.getElementById("btnCloseModal");

  /* ================= UTIL ================= */
  function rupiah(num) {
    return "Rp " + Number(num || 0).toLocaleString("id-ID");
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleString("id-ID");
  }

  function getOrders() {
    return JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
  }

  function saveOrders(data) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(data));
  }

  /* ================= LOGIN ================= */
  function renderLogin() {
    const loggedIn = localStorage.getItem(LOGIN_KEY) === "true";

    if (loggedIn) {
      loginScreen.style.display = "none";
      adminPanel.style.display = "block";
      renderOrders();
    } else {
      loginScreen.style.display = "flex";
      adminPanel.style.display = "none";
    }
  }

  loginBtn.addEventListener("click", function () {
    const pin = pinInput.value.trim();

    if (!pin) {
      alert("Masukkan PIN");
      return;
    }

    if (pin === ADMIN_PIN) {
      localStorage.setItem(LOGIN_KEY, "true");
      pinInput.value = "";
      renderLogin();
    } else {
      alert("PIN SALAH");
    }
  });

  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem(LOGIN_KEY);
    location.reload();
  });

  /* ================= STAT ================= */
  function renderStat(orders) {
    statTotalOrder.textContent = orders.length;
    statPending.textContent = orders.filter(o => o.status === "pending").length;
    statDone.textContent = orders.filter(o => o.status === "done").length;

    const omzet = orders
      .filter(o => o.status === "done")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    statRevenue.textContent = rupiah(omzet);
  }

  /* ================= TABLE ================= */
  function renderOrders(filter = "all") {
    const orders = getOrders();
    orderTableBody.innerHTML = "";

    const filtered = orders.filter(o => {
      if (filter === "pending") return o.status === "pending";
      if (filter === "done") return o.status === "done";
      return true;
    });

    filtered.forEach((o, i) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${o.invoice}</td>
        <td>${o.customerName}</td>
        <td>${rupiah(o.total)}</td>
        <td>
          <span class="status ${o.status === "pending" ? "status-pending" : "status-done"}">
            ${o.status}
          </span>
        </td>
        <td>
          <button class="btn-secondary" data-view="${i}">Detail</button>
          <button class="btn-primary" data-done="${i}">Done</button>
          <button class="btn-danger" data-del="${i}">Hapus</button>
        </td>
      `;

      orderTableBody.appendChild(tr);
    });

    renderStat(orders);
  }

  /* ================= ACTIONS ================= */
  orderTableBody.addEventListener("click", function (e) {
    const orders = getOrders();

    if (e.target.dataset.view !== undefined) {
      openInvoice(orders[e.target.dataset.view]);
    }

    if (e.target.dataset.done !== undefined) {
      orders[e.target.dataset.done].status = "done";
      saveOrders(orders);
      renderOrders();
    }

    if (e.target.dataset.del !== undefined) {
      if (confirm("Hapus order ini?")) {
        orders.splice(e.target.dataset.del, 1);
        saveOrders(orders);
        renderOrders();
      }
    }
  });

  /* ================= FILTER ================= */
  filterAll.onclick = () => renderOrders("all");
  filterPending.onclick = () => renderOrders("pending");
  filterDone.onclick = () => renderOrders("done");

  /* ================= INVOICE ================= */
  function openInvoice(o) {
    invoicePreview.innerHTML = `
      <h2 style="text-align:center">PUKIS LUMER AULIA</h2>
      <hr>
      <p><b>Invoice:</b> ${o.invoice}</p>
      <p><b>Tanggal:</b> ${formatDate(o.createdAt)}</p>
      <p><b>Nama:</b> ${o.customerName}</p>

      <table width="100%" border="1" cellspacing="0" cellpadding="6">
        ${Object.entries(o.items || {}).map(
          ([k, v]) => `<tr><td>${k}</td><td>${Array.isArray(v) ? v.join(", ") : v}</td></tr>`
        ).join("")}
        <tr><td><b>Total</b></td><td><b>${rupiah(o.total)}</b></td></tr>
      </table>

      <p style="text-align:center;margin-top:10px">
        Terima kasih telah berbelanja di toko kami
      </p>
    `;

    btnPrintInvoice.onclick = () => {
      const w = window.open("", "", "width=800,height=600");
      w.document.write(invoicePreview.innerHTML);
      w.print();
    };

    btnExportPdf.onclick = () => exportPDF(o);
    invoiceModal.style.display = "flex";
  }

  btnCloseModal.onclick = () => {
    invoiceModal.style.display = "none";
  };

  /* ================= PDF ================= */
  function exportPDF(o) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("PUKIS LUMER AULIA", 105, 15, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Invoice: ${o.invoice}`, 14, 30);
    doc.text(`Tanggal: ${formatDate(o.createdAt)}`, 14, 36);
    doc.text(`Nama: ${o.customerName}`, 14, 42);

    doc.autoTable({
      startY: 50,
      head: [["Item", "Keterangan"]],
      body: Object.entries(o.items || {}).map(
        ([k, v]) => [k, Array.isArray(v) ? v.join(", ") : v]
      ).concat([["Total", rupiah(o.total)]])
    });

    doc.save(o.invoice + ".pdf");
  }

  /* ================= INIT ================= */
  renderLogin();

})();
