// assets/js/modules/orders.js

import { Storage } from "../core/storage.js";

const ORDER_KEY = "orders";

// ===== ELEMENTS (SAFE) =====
const tbody = document.querySelector("#orderTable tbody");
const filterAllBtn = document.getElementById("filterAll");
const filterPendingBtn = document.getElementById("filterPending");
const filterDoneBtn = document.getElementById("filterDone");

const totalOrdersEl = document.getElementById("totalOrders");
const pendingOrdersEl = document.getElementById("pendingOrders");
const completedOrdersEl = document.getElementById("completedOrders");

// Jika halaman bukan admin, hentikan
if (!tbody) {
  console.warn("orders.js: tbody tidak ditemukan (bukan halaman admin)");
  return;
}

// ===== DATA =====
function getOrders() {
  return Storage.get(ORDER_KEY) || [];
}

function saveOrders(orders) {
  Storage.set(ORDER_KEY, orders);
}

// ===== STATISTICS =====
function updateStats() {
  const orders = getOrders();

  if (totalOrdersEl)
    totalOrdersEl.textContent = orders.length;

  if (pendingOrdersEl)
    pendingOrdersEl.textContent =
      orders.filter(o => o.status === "pending").length;

  if (completedOrdersEl)
    completedOrdersEl.textContent =
      orders.filter(o => o.status === "done").length;
}

// ===== RENDER TABLE =====
function renderOrders(filter = "all") {
  const orders = getOrders();
  tbody.innerHTML = "";

  const filtered =
    filter === "all"
      ? orders
      : orders.filter(o => o.status === filter);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:14px;">
          Belum ada order
        </td>
      </tr>`;
    updateStats();
    return;
  }

  filtered.forEach(order => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${order.invoice}</td>
      <td>${order.customerName}</td>
      <td>Rp ${Number(order.total).toLocaleString("id-ID")}</td>
      <td>
        <span class="status status-${order.status}">
          ${order.status}
        </span>
      </td>
      <td>
        ${
          order.status === "pending"
            ? `
              <button 
                class="btn-small btn-status btn-done" 
                data-id="${order.id}">
                Selesai
              </button>
            `
            : "-"
        }
      </td>
    `;

    tbody.appendChild(tr);
  });

  updateStats();
}

// ===== UPDATE STATUS =====
function markAsDone(orderId) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return;

  orders[idx].status = "done";
  orders[idx].updatedAt = Date.now();

  saveOrders(orders);
  renderOrders("all");
}

// ===== EVENTS =====
tbody.addEventListener("click", e => {
  if (e.target.classList.contains("btn-done")) {
    const id = e.target.dataset.id;
    markAsDone(id);
  }
});

if (filterAllBtn)
  filterAllBtn.addEventListener("click", () => renderOrders("all"));

if (filterPendingBtn)
  filterPendingBtn.addEventListener("click", () => renderOrders("pending"));

if (filterDoneBtn)
  filterDoneBtn.addEventListener("click", () => renderOrders("done"));

// ===== INIT =====
renderOrders("all");
