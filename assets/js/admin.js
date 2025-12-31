/* =========================================================
   ADMIN PANEL - PUKIS LUMER AULIA
   FINAL – SINGLE FILE – DOM SAFE
   LOGIN FIXED (MOBILE & DESKTOP)
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
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

    const invoiceModal = document.getElementById("invoiceModal");
    const invoicePreview = document.getElementById("invoicePreview");
    const btnPrintInvoice = document.getElementById("btnPrintInvoice");
    const btnExportPdf = document.getElementById("btnExportPdf");
    const btnCloseModal = document.getElementById("btnCloseModal");

    /* ================= SAFETY CHECK ================= */
    if (!loginBtn || !pinInput) {
      alert("Admin.js gagal load: elemen login tidak ditemukan");
      return;
    }

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
          <td>${o.invoice || "-"}</td>
          <td>${o.customerName || "-"}</td>
          <td>${rupiah(o.total)}</td>
          <td>
            <span class="status ${o.status === "pending" ? "status-pending" : "status-done"}">
              ${o.status}
            </span>
          </td>
          <td>
            <button data-view="${i}">Detail</button>
            <button data-done="${i}">Done</button>
            <button data-del="${i}">Hapus</button>
          </td>
        `;
        orderTableBody.appendChild(tr);
      });

      renderStat(orders);
    }

    /* ================= ACTION ================= */
    orderTableBody.addEventListener("click", function (e) {
      const orders = getOrders();
      const i =
        e.target.dataset.view ??
        e.target.dataset.done ??
        e.target.dataset.del;

      if (i === undefined) return;

      if (e.target.dataset.view !== undefined) {
        openInvoice(orders[i]);
      }

      if (e.target.dataset.done !== undefined) {
        orders[i].status = "done";
        saveOrders(orders);
        renderOrders();
      }

      if (e.target.dataset.del !== undefined) {
        if (confirm("Hapus order ini?")) {
          orders.splice(i, 1);
          saveOrders(orders);
          renderOrders();
        }
      }
    });

    filterAll.onclick = () => renderOrders("all");
    filterPending.onclick = () => renderOrders("pending");
    filterDone.onclick = () => renderOrders("done");

    /* ================= INVOICE ================= */
    function openInvoice(o) {
      invoicePreview.innerHTML = `
        <h2 style="text-align:center">PUKIS LUMER AULIA</h2>
        <hr>
        <p><b>Invoice:</b> ${o.invoice || "-"}</p>
        <p><b>Tanggal:</b> ${formatDate(o.createdAt || Date.now())}</p>
        <p><b>Nama:</b> ${o.customerName || "-"}</p>
        <p><b>Total:</b> ${rupiah(o.total)}</p>
      `;
      invoiceModal.style.display = "flex";
    }

    btnCloseModal.onclick = () => {
      invoiceModal.style.display = "none";
    };

    btnPrintInvoice.onclick = function () {
      const w = window.open("", "", "width=800,height=600");
      w.document.write(invoicePreview.innerHTML);
      w.document.close();
      w.print();
    };

    btnExportPdf.onclick = function () {
      if (!window.jspdf) {
        alert("Library PDF belum dimuat");
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text("PUKIS LUMER AULIA", 105, 15, { align: "center" });
      doc.text(invoicePreview.innerText, 10, 30);
      doc.save("invoice.pdf");
    };

    /* ================= INIT ================= */
    renderLogin();
/* =========================================================
   assets/js/admin.js
   FINAL — ADMIN DASHBOARD
   NON MODULE | REALTIME POLLING | PDF
========================================================= */
(function () {
  "use strict";

  const PIN = "1234"; // GANTI PIN DI SINI
  const STORAGE_KEY = "orders";

  const $ = s => document.querySelector(s);
  const formatRp = n => "Rp " + Number(n || 0).toLocaleString("id-ID");

  /* ===== LOGIN ===== */
  const loginScreen = $("#loginScreen");
  const adminPanel = $("#adminPanel");

  $("#loginBtn")?.addEventListener("click", () => {
    const pin = $("#pinInput").value;
    if (pin === PIN) {
      loginScreen.style.display = "none";
      adminPanel.style.display = "block";
      loadOrders();
    } else {
      alert("PIN SALAH");
    }
  });

  $("#logoutBtn")?.addEventListener("click", () => {
    location.reload();
  });

  /* ===== ORDER RENDER ===== */
  function loadOrders() {
    const orders = OrderStore.getAll();
    const tbody = $("#orderTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    orders.forEach((o, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.invoice}</td>
        <td>${o.customerName || "-"}</td>
        <td>${formatRp(o.total)}</td>
        <td>
          <select data-i="${i}">
            <option ${o.status === "pending" ? "selected" : ""}>pending</option>
            <option ${o.status === "done" ? "selected" : ""}>done</option>
          </select>
        </td>
        <td>
          <button data-pdf="${i}">PDF</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    bindEvents();
    updateStat();
  }

  function bindEvents() {
    $$("select[data-i]").forEach(sel => {
      sel.onchange = () => {
        const idx = sel.dataset.i;
        const orders = OrderStore.getAll();
        orders[idx].status = sel.value;
        OrderStore.saveAll(orders);
        updateStat();
      };
    });

    $$("button[data-pdf]").forEach(btn => {
      btn.onclick = () => {
        const o = OrderStore.getAll()[btn.dataset.pdf];
        printPDF(o);
      };
    });
  }

  /* ===== STAT ===== */
  function updateStat() {
    const orders = OrderStore.getAll();
    $("#statTotalOrder").textContent = orders.length;
    $("#statPending").textContent = orders.filter(o => o.status === "pending").length;
    $("#statDone").textContent = orders.filter(o => o.status === "done").length;
    $("#statRevenue").textContent = formatRp(
      orders.reduce((a, b) => a + (b.total || 0), 0)
    );
  }

  /* ===== PDF ===== */
  function printPDF(order) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: [58, 200] });

    let y = 8;
    doc.setFontSize(10);
    doc.text("PUKIS LUMER AULIA", 29, y, { align: "center" });
    y += 6;

    doc.setFontSize(8);
    doc.text(`Invoice: ${order.invoice}`, 2, y); y += 4;
    doc.text(`Nama: ${order.customerName || "-"}`, 2, y); y += 4;
    doc.text(`Total: ${formatRp(order.total)}`, 2, y);

    doc.text("Terima kasih 🙏", 29, y + 10, { align: "center" });
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  }

  /* ===== REALTIME (POLLING) ===== */
  setInterval(() => {
    if (adminPanel.style.display === "block") {
      loadOrders();
    }
  }, 3000);

})();
  })();
});
