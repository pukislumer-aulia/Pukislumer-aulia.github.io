/* ==========================================================
   ADMIN PANEL — PUKIS LUMER AULIA
   FINAL VERSION — CLEAN, MOBILE READY
   ========================================================== */

/* ----------- PROTECT ADMIN PAGE ----------- */
if (!sessionStorage.getItem("adminLogged")) {
    window.location.href = "admin-login.html";
}

/* ----------- LOAD ELEMENTS ----------- */
const tableBody = document.querySelector("#orderTable tbody");
const totalOrdersEl = document.getElementById("totalOrders");
const pendingOrdersEl = document.getElementById("pendingOrders");
const doneOrdersEl = document.getElementById("doneOrders");

/* Buttons */
const logoutBtn = document.getElementById("logoutBtn");
const logoutBtn2 = document.getElementById("logoutBtn2");
const printLastInvoice = document.getElementById("printLastInvoice");

const filterAll = document.getElementById("filterAll");
const filterPending = document.getElementById("filterPending");
const filterDone = document.getElementById("filterDone");

/* ----------- LOAD DATA FROM LOCAL STORAGE ----------- */
let orders = JSON.parse(localStorage.getItem("orders") || "[]");

/* ----------- SOUND NOTIFICATION ----------- */
function playNotification() {
    const audio = new Audio("assets/audio/notif.mp3");
    audio.play().catch(() => {});
}

/* ----------- SAVE BACK TO STORAGE ----------- */
function saveOrders() {
    localStorage.setItem("orders", JSON.stringify(orders));
}

/* ------------------------------------------------------
   UPDATE STATISTICS CARD
------------------------------------------------------ */
function updateStats() {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "pending").length;
    const done = orders.filter(o => o.status === "done").length;

    totalOrdersEl.textContent = total;
    pendingOrdersEl.textContent = pending;
    doneOrdersEl.textContent = done;
}

/* ------------------------------------------------------
   RENDER ORDER TABLE
------------------------------------------------------ */
function renderTable(list) {
    tableBody.innerHTML = "";

    list.forEach(order => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${order.invoice}</td>
            <td>${order.nama}</td>
            <td>Rp ${order.total.toLocaleString()}</td>
            <td>
                <span class="status ${order.status}">
                    ${order.status === "done" ? "Selesai" : "Belum"}
                </span>
            </td>
            <td>
                <button class="btn-action edit" onclick="editOrder('${order.id}')"><i class="fa fa-pen"></i></button>
                <button class="btn-action print" onclick="printInvoice('${order.id}')"><i class="fa fa-print"></i></button>
                <button class="btn-action wa" onclick="sendWA('${order.id}')"><i class="fa fa-whatsapp"></i></button>
            </td>
        `;

        tableBody.appendChild(tr);
    });

    updateStats();
}

/* ------------------------------------------------------
   FILTER
------------------------------------------------------ */
filterAll.onclick = () => renderTable(orders);
filterPending.onclick = () => renderTable(orders.filter(o => o.status === "pending"));
filterDone.onclick = () => renderTable(orders.filter(o => o.status === "done"));

/* ------------------------------------------------------
   EDIT ORDER
------------------------------------------------------ */
window.editOrder = function (id) {
    sessionStorage.setItem("editOrderId", id);
    window.location.href = "admin-edit.html";
};

/* ------------------------------------------------------
   PRINT INVOICE (PDF)
------------------------------------------------------ */
window.printInvoice = function (id) {
    const { jsPDF } = window.jspdf;

    const order = orders.find(o => o.id === id);
    if (!order) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Pukis Lumer Aulia — Nota Pembelian", 14, 20);

    doc.setFontSize(12);
    doc.text(`Invoice: ${order.invoice}`, 14, 30);
    doc.text(`Nama: ${order.nama}`, 14, 37);
    doc.text(`WA: ${order.wa}`, 14, 44);
    doc.text(`Tanggal: ${order.tanggal}`, 14, 51);

    doc.autoTable({
        startY: 60,
        head: [["Jenis", "Isi", "Topping", "Jumlah", "Harga"]],
        body: [
            [
                order.jenis,
                order.isi + " pcs",
                order.topping || "-",
                order.jumlah + " box",
                "Rp " + order.total.toLocaleString()
            ]
        ]
    });

    doc.save(`Nota-${order.invoice}.pdf`);

    order.status = "done";
    saveOrders();
    renderTable(orders);
};

/* ------------------------------------------------------
   SEND WHATSAPP TO BUYER
------------------------------------------------------ */
window.sendWA = function (id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const msg =
`Halo *${order.nama}*, berikut detail pesanan Anda:

• Invoice: ${order.invoice}
• Jenis: ${order.jenis}
• Isi: ${order.isi} pcs
• Topping: ${order.topping || "-"}
• Jumlah Box: ${order.jumlah}
• Total: Rp ${order.total.toLocaleString()}

Terima kasih!`;

    const url = `https://wa.me/${order.wa}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
};

/* ------------------------------------------------------
   PRINT LAST INVOICE
------------------------------------------------------ */
printLastInvoice.onclick = () => {
    if (orders.length === 0) return alert("Belum ada order.");
    const last = orders[orders.length - 1];
    printInvoice(last.id);
};

/* ------------------------------------------------------
   LOGOUT
------------------------------------------------------ */
logoutBtn.onclick = logout;
logoutBtn2.onclick = logout;

function logout() {
    sessionStorage.removeItem("adminLogged");
    window.location.href = "admin-login.html";
}

/* ------------------------------------------------------
   LISTEN FOR NEW ORDERS (REALTIME)
------------------------------------------------------ */
let lastCount = orders.length;

setInterval(() => {
    const fresh = JSON.parse(localStorage.getItem("orders") || "[]");

    if (fresh.length > lastCount) {
        playNotification();
    }

    orders = fresh;
    lastCount = fresh.length;
    renderTable(orders);

}, 1000);

/* ------------------------------------------------------
   INITIAL LOAD
------------------------------------------------------ */
renderTable(orders);
