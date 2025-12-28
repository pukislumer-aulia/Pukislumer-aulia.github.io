/* =========================================================
   ADMIN PANEL – PUKIS LUMER AULIA
   FIX LOGIN + KOMPATIBEL HTML
========================================================= */

/* ================= DOM ================= */
const loginScreen = document.getElementById("loginScreen");
const adminPanel  = document.getElementById("adminPanel");
const loginBtn    = document.getElementById("loginBtn");
const logoutBtn   = document.getElementById("logoutBtn");
const pinInput    = document.getElementById("pinInput");

const statTotal   = document.getElementById("statTotalOrder");
const statPending = document.getElementById("statPending");
const statDone    = document.getElementById("statDone");
const statRevenue = document.getElementById("statRevenue");

const orderTable  = document.querySelector("#orderTable tbody");

const invoiceModal = document.getElementById("invoiceModal");
const invoicePreview = document.getElementById("invoicePreview");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnPrintInvoice = document.getElementById("btnPrintInvoice");
const btnExportPdf = document.getElementById("btnExportPdf");

/* ================= LOGIN ================= */
function checkLogin() {
  if (localStorage.getItem("ADMIN_LOGIN") === "true") {
    loginScreen.style.display = "none";
    adminPanel.style.display = "block";
    loadOrders();
  } else {
    loginScreen.style.display = "flex";
    adminPanel.style.display = "none";
  }
}

loginBtn.onclick = () => {
  if (pinInput.value === "030419") {
    localStorage.setItem("ADMIN_LOGIN", "true");
    checkLogin();
  } else {
    alert("PIN salah!");
  }
};

logoutBtn.onclick = () => {
  localStorage.removeItem("ADMIN_LOGIN");
  location.reload();
};

/* ================= ORDERS ================= */
function getOrders() {
  return JSON.parse(localStorage.getItem("pukis_orders") || "[]");
}

/* ================= STAT ================= */
function updateStat(orders) {
  statTotal.textContent = orders.length;
  statPending.textContent = orders.filter(o => o.status === "pending").length;
  statDone.textContent = orders.filter(o => o.status === "done").length;

  const revenue = orders
    .filter(o => o.status === "done")
    .reduce((s, o) => s + (o.items?.total || 0), 0);

  statRevenue.textContent = "Rp " + revenue.toLocaleString("id-ID");
}

/* ================= TABLE ================= */
function loadOrders() {
  const orders = getOrders();
  orderTable.innerHTML = "";

  orders.forEach((o, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${o.invoice}</td>
      <td>${o.customerName}</td>
      <td>Rp ${o.items.total.toLocaleString("id-ID")}</td>
      <td>
        <span class="status ${o.status}">
          ${o.status}
        </span>
      </td>
      <td>
        <button onclick="viewOrder(${i})">Detail</button>
        <button onclick="markDone(${i})">Done</button>
      </td>
    `;

    orderTable.appendChild(tr);
  });

  updateStat(orders);
}

/* ================= ACTION ================= */
window.markDone = i => {
  const orders = getOrders();
  orders[i].status = "done";
  localStorage.setItem("pukis_orders", JSON.stringify(orders));
  loadOrders();
};

/* ================= MODAL ================= */
window.viewOrder = i => {
  const o = getOrders()[i];

  invoicePreview.innerHTML = `
    <h3>${o.invoice}</h3>
    <p>Nama: ${o.customerName}</p>
    <p>Total: Rp ${o.items.total.toLocaleString("id-ID")}</p>
  `;

  invoiceModal.style.display = "flex";
};

btnCloseModal.onclick = () => {
  invoiceModal.style.display = "none";
};

/* ================= INIT ================= */
checkLogin();
