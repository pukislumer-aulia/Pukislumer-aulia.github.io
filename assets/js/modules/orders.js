// assets/js/modules/orders.js

import { Storage } from "../core/storage.js";

const ORDER_KEY = "orders";

// ====== ELEMENTS ======
const tbody = document.querySelector("#orderTable tbody");
const filterAllBtn = document.getElementById("filterAll");
const filterPendingBtn = document.getElementById("filterPending");
const filterDoneBtn = document.getElementById("filterDone");

// ====== DATA ======
function getOrders() {
  return Storage.get(ORDER_KEY) || [];
}

function saveOrders(orders) {
  Storage.set(ORDER_KEY, orders);
}

// ====== RENDER ======
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
        <td colspan="5" style="text-align:center;padding:12px;">
          Belum ada order
        </td>
      </tr>`;
    return;
  }

  filtered.forEach(order => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${order.invoice}</td>
      <td>${order.customerName}</td>
      <td>Rp ${order.total.toLocaleString("id-ID")}</td>
      <td>
        <span class="status status-${order.status}">
          ${order.status}
        </span>
      </td>
      <td>
        ${
          order.status === "pending"
            ? `<button data-id="${order.id}" class="btn-done">Selesai</button>`
            : "-"
        }
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ====== UPDATE STATUS ======
function markAsDone(orderId) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return;

  orders[idx].status = "done";
  orders[idx].updatedAt = Date.now();

  saveOrders(orders);
  renderOrders();
}

// ====== EVENTS ======
tbody.addEventListener("click", e => {
  if (e.target.classList.contains("btn-done")) {
    markAsDone(e.target.dataset.id);
  }
});

filterAllBtn.addEventListener("click", () => renderOrders("all"));
filterPendingBtn.addEventListener("click", () => renderOrders("pending"));
filterDoneBtn.addEventListener("click", () => renderOrders("done"));

// ====== INIT ======
renderOrders();
