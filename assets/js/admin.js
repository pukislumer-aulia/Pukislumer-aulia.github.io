
const ADMIN_PIN = "030419";
const STORAGE_KEY = "pukis_orders";

const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const orderBody = document.getElementById("orderBody");

let currentOrderId = null;

// ===== LOGIN =====
if (localStorage.getItem("admin_login") === "true") showAdmin();

document.getElementById("loginBtn").onclick = () => {
  if (document.getElementById("pinInput").value === ADMIN_PIN) {
    localStorage.setItem("admin_login", "true");
    showAdmin();
  } else alert("PIN salah");
};

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("admin_login");
  location.reload();
};

function showAdmin() {
  loginScreen.style.display = "none";
  adminPanel.style.display = "block";
  renderOrders();
}

// ===== DATA =====
function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveOrders(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ===== RENDER =====
function renderOrders(filter = "all") {
  const orders = getOrders();
  orderBody.innerHTML = "";

  const filtered = filter === "all"
    ? orders
    : orders.filter(o => o.status === filter);

  document.getElementById("totalOrders").textContent = orders.length;
  document.getElementById("pendingOrders").textContent = orders.filter(o => o.status === "pending").length;
  document.getElementById("completedOrders").textContent = orders.filter(o => o.status === "done").length;

  filtered.forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.invoice}</td>
      <td>${o.nama}</td>
      <td>Rp ${o.total.toLocaleString("id-ID")}</td>
      <td><span class="status ${o.status}">${o.status}</span></td>
      <td>
        <button onclick="openDetail('${o.invoice}')">Detail</button>
        <a href="https://wa.me/${o.wa}" target="_blank">WA</a>
      </td>`;
    orderBody.appendChild(tr);
  });
}

// ===== DETAIL =====
function openDetail(invoice) {
  const orders = getOrders();
  const order = orders.find(o => o.invoice === invoice);
  if (!order) return;

  currentOrderId = invoice;

  document.getElementById("modalContent").innerHTML = `
    <p><b>Nama:</b> ${order.nama}</p>
    <p><b>WA:</b> ${order.wa}</p>
    <p><b>Jenis:</b> ${order.jenis}</p>
    <p><b>Isi:</b> ${order.isi} pcs</p>
    <p><b>Jumlah Box:</b> ${order.jumlah}</p>
    <p><b>Mode:</b> ${order.mode}</p>
    <p><b>Topping:</b> ${(order.single||[]).join(", ")}</p>
    <p><b>Taburan:</b> ${(order.taburan||[]).join(", ")}</p>
    <p><b>Catatan:</b> ${order.note || "-"}</p>
    <p><b>Total:</b> Rp ${order.total.toLocaleString("id-ID")}</p>
  `;

  document.getElementById("orderModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("orderModal").style.display = "none";
}

// ===== ACTION =====
document.getElementById("markDoneBtn").onclick = () => {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.invoice === currentOrderId);
  if (idx !== -1) {
    orders[idx].status = "done";
    saveOrders(orders);
    closeModal();
    renderOrders();
  }
};

document.getElementById("deleteBtn").onclick = () => {
  let orders = getOrders();
  orders = orders.filter(o => o.invoice !== currentOrderId);
  saveOrders(orders);
  closeModal();
  renderOrders();
};

// ===== FILTER =====
document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.onclick = () => renderOrders(btn.dataset.filter);
});

// ===== NOTA =====
function buildNotaHTML(order) {
  return `
    <div style="font-family:Arial;font-size:12px">
      <h3 style="text-align:center">Pukis Lumer Aulia</h3>
      <hr>
      <p><b>Invoice:</b> ${order.invoice}</p>
      <p><b>Nama:</b> ${order.nama}</p>
      <p><b>WhatsApp:</b> ${order.wa}</p>
      <hr>
      <p><b>Jenis:</b> ${order.jenis}</p>
      <p><b>Isi / Box:</b> ${order.isi}</p>
      <p><b>Jumlah Box:</b> ${order.jumlah}</p>
      <p><b>Mode:</b> ${order.mode}</p>
      <p><b>Topping:</b> ${(order.single||[]).join(", ")}</p>
      <p><b>Taburan:</b> ${(order.taburan||[]).join(", ")}</p>
      <p><b>Catatan:</b> ${order.note || "-"}</p>
      <hr>
      <h3>Total: Rp ${order.total.toLocaleString("id-ID")}</h3>
      <p style="text-align:center">Terima kasih 🙏</p>
    </div>
  `;
}

// ===== CETAK =====
document.getElementById("printNotaBtn").onclick = () => {
  const orders = getOrders();
  const order = orders.find(o => o.invoice === currentOrderId);
  if (!order) return;

  const win = window.open("", "", "width=400");
  win.document.write(buildNotaHTML(order));
  win.document.close();
  win.focus();
  win.print();
};

// ===== EXPORT PDF =====
document.getElementById("pdfNotaBtn").onclick = () => {
  const orders = getOrders();
  const order = orders.find(o => o.invoice === currentOrderId);
  if (!order) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 160] // ukuran thermal
  });

  doc.setFontSize(10);
  doc.text("Pukis Lumer Aulia", 40, 10, { align: "center" });
  doc.line(5, 12, 75, 12);

  let y = 18;
  const line = (t) => { doc.text(t, 5, y); y += 6; };

  line(`Invoice: ${order.invoice}`);
  line(`Nama: ${order.nama}`);
  line(`WA: ${order.wa}`);
  y += 4;
  line(`Jenis: ${order.jenis}`);
  line(`Isi: ${order.isi}`);
  line(`Jumlah: ${order.jumlah}`);
  line(`Mode: ${order.mode}`);
  line(`Topping: ${(order.single||[]).join(", ")}`);
  line(`Taburan: ${(order.taburan||[]).join(", ")}`);
  line(`Catatan: ${order.note || "-"}`);
  y += 4;
  line(`TOTAL: Rp ${order.total.toLocaleString("id-ID")}`);

  doc.save(`nota-${order.invoice}.pdf`);
};
