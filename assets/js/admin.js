// ===== CONFIG =====
const ADMIN_PIN = "030419";
const ORDER_KEY = "orders";

// ===== ELEMENTS =====
const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const pinInput = document.getElementById("pinInput");

const tbody = document.querySelector("#orderTable tbody");
const totalOrdersEl = document.getElementById("totalOrders");
const pendingOrdersEl = document.getElementById("pendingOrders");
const completedOrdersEl = document.getElementById("completedOrders");

const filterAllBtn = document.getElementById("filterAll");
const filterPendingBtn = document.getElementById("filterPending");
const filterDoneBtn = document.getElementById("filterDone");

// ===== LOGIN =====
function showAdmin() {
  loginScreen.style.display = "none";
  adminPanel.style.display = "block";
}

function showLogin() {
  loginScreen.style.display = "flex";
  adminPanel.style.display = "none";
}

if (localStorage.getItem("admin_login") === "true") {
  showAdmin();
} else {
  showLogin();
}

loginBtn.addEventListener("click", () => {
  if (pinInput.value === ADMIN_PIN) {
    localStorage.setItem("admin_login", "true");
    showAdmin();
  } else {
    alert("PIN salah");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("admin_login");
  location.reload();
});

// ===== ORDERS =====
function getOrders() {
  return JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
}

function renderStats(orders) {
  totalOrdersEl.textContent = orders.length;
  pendingOrdersEl.textContent = orders.filter(o => o.status === "pending").length;
  completedOrdersEl.textContent = orders.filter(o => o.status === "done").length;
}

function renderOrders(filter = "all") {
  const orders = getOrders();
  tbody.innerHTML = "";

  const filtered =
    filter === "all" ? orders : orders.filter(o => o.status === filter);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada order</td></tr>`;
    renderStats(orders);
    return;
  }

  filtered.forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.invoice}</td>
      <td>${o.customerName}</td>
      <td>Rp ${o.total.toLocaleString("id-ID")}</td>
      <td><span class="status status-${o.status}">${o.status}</span></td>
      <td>
        ${o.status === "pending"
          ? `<button onclick="markDone('${o.id}')">Selesai</button>`
          : "-"}
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderStats(orders);
}

window.markDone = function (id) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx].status = "done";
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
    renderOrders();
  }
};

// ===== FILTER EVENTS =====
filterAllBtn.addEventListener("click", () => renderOrders("all"));
filterPendingBtn.addEventListener("click", () => renderOrders("pending"));
filterDoneBtn.addEventListener("click", () => renderOrders("done"));

// ===== INIT =====
renderOrders();
