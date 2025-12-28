/* =========================================================
   ADMIN PANEL – PUKIS LUMER AULIA
   FULL FEATURE
========================================================= */

import {
  STORE,
  ADMIN,
  STORAGE,
  rupiah,
  formatDate,
  generateInvoice
} from "./core/config.js";

/* ================= DOM ================= */
const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const pinInput = document.getElementById("adminPin");

const orderTable = document.getElementById("orderTableBody");
const totalOrderEl = document.getElementById("statTotal");
const pendingEl = document.getElementById("statPending");
const doneEl = document.getElementById("statDone");

const modal = document.getElementById("orderModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
const btnPrint = document.getElementById("btnPrint");
const btnPDF = document.getElementById("btnPDF");

/* ================= LOGIN ================= */
function checkLogin() {
  if (localStorage.getItem(ADMIN.LOGIN_KEY) === "true") {
    loginBox.style.display = "none";
    adminPanel.style.display = "block";
    loadOrders();
  }
}

loginBtn.onclick = () => {
  if (pinInput.value === ADMIN.PIN) {
    localStorage.setItem(ADMIN.LOGIN_KEY, "true");
    checkLogin();
  } else {
    alert("PIN salah!");
  }
};

logoutBtn.onclick = () => {
  localStorage.removeItem(ADMIN.LOGIN_KEY);
  location.reload();
};

/* ================= ORDERS ================= */
function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE.ORDERS) || "[]");
}

function saveOrders(data) {
  localStorage.setItem(STORAGE.ORDERS, JSON.stringify(data));
}

/* ================= STAT ================= */
function updateStat(orders) {
  totalOrderEl.textContent = orders.length;
  pendingEl.textContent = orders.filter(o => o.status === "pending").length;
  doneEl.textContent = orders.filter(o => o.status === "done").length;
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
      <td>${formatDate(o.date)}</td>
      <td>${rupiah(o.items.total)}</td>
      <td>
        <span class="status ${o.status === "pending" ? "pending" : "done"}">
          ${o.status}
        </span>
      </td>
      <td>
        <button class="btn-secondary" onclick="viewOrder(${i})">Detail</button>
        <button class="btn-primary" onclick="markDone(${i})">Done</button>
        <button class="btn-danger" onclick="deleteOrder(${i})">Hapus</button>
      </td>
    `;

    orderTable.appendChild(tr);
  });

  updateStat(orders);
}

/* ================= ACTIONS ================= */
window.markDone = index => {
  const orders = getOrders();
  orders[index].status = "done";
  saveOrders(orders);
  loadOrders();
};

window.deleteOrder = index => {
  if (!confirm("Hapus pesanan ini?")) return;
  const orders = getOrders();
  orders.splice(index, 1);
  saveOrders(orders);
  loadOrders();
};

/* ================= MODAL ================= */
window.viewOrder = index => {
  const o = getOrders()[index];

  modalContent.innerHTML = `
    <h2 style="text-align:center">${STORE.name}</h2>
    <hr>

    <p><b>Invoice:</b> ${o.invoice}</p>
    <p><b>Tanggal:</b> ${formatDate(o.date)}</p>
    <p><b>Nama:</b> ${o.customerName}</p>
    <p><b>Catatan:</b> ${o.note || "-"}</p>

    <table width="100%" border="1" cellspacing="0" cellpadding="6">
      <tr><td>Jenis</td><td>${o.items.jenis}</td></tr>
      <tr><td>Isi Box</td><td>${o.items.isiBox}</td></tr>
      <tr><td>Mode</td><td>${o.items.mode}</td></tr>
      <tr><td>Topping</td><td>${o.items.topping.join(", ") || "-"}</td></tr>
      <tr><td>Taburan</td><td>${o.items.taburan.join(", ") || "-"}</td></tr>
      <tr><td>Jumlah Box</td><td>${o.items.jumlahBox}</td></tr>
      <tr><td>Harga</td><td>${rupiah(o.items.hargaSatuan)}</td></tr>
      <tr><td>Subtotal</td><td>${rupiah(o.items.subtotal)}</td></tr>
      <tr><td>Diskon</td><td>${rupiah(o.items.diskon)}</td></tr>
      <tr><td><b>Total</b></td><td><b>${rupiah(o.items.total)}</b></td></tr>
    </table>

    <p style="margin-top:12px">${STORE.footer}</p>
  `;

  btnPrint.onclick = () => printNota(o);
  btnPDF.onclick = () => exportPDF(o);

  modal.style.display = "flex";
};

modalClose.onclick = () => modal.style.display = "none";

/* ================= PRINT ================= */
function printNota(o) {
  const win = window.open("", "", "width=800,height=600");
  win.document.write(`<html><body>${modalContent.innerHTML}</body></html>`);
  win.document.close();
  win.print();
}

/* ================= PDF ================= */
function exportPDF(o) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(STORE.name, 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Invoice: ${o.invoice}`, 14, 30);
  doc.text(`Tanggal: ${formatDate(o.date)}`, 14, 36);
  doc.text(`Nama: ${o.customerName}`, 14, 42);
  doc.text(`Catatan: ${o.note || "-"}`, 14, 48);

  doc.autoTable({
    startY: 55,
    head: [["Item", "Keterangan"]],
    body: [
      ["Jenis", o.items.jenis],
      ["Isi Box", o.items.isiBox],
      ["Mode", o.items.mode],
      ["Topping", o.items.topping.join(", ") || "-"],
      ["Taburan", o.items.taburan.join(", ") || "-"],
      ["Jumlah Box", o.items.jumlahBox],
      ["Harga Satuan", rupiah(o.items.hargaSatuan)],
      ["Subtotal", rupiah(o.items.subtotal)],
      ["Diskon", rupiah(o.items.diskon)],
      ["Total", rupiah(o.items.total)]
    ]
  });

  doc.text(STORE.footer, 105, 280, { align: "center" });
  doc.save(`${o.invoice}.pdf`);
}

/* ================= INIT ================= */
checkLogin();
