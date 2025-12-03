// PIN LOGIN
const ADMIN_PIN = "13579";

const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const pinInput = document.getElementById("pinInput");

loginBtn.onclick = () => {
    if (pinInput.value === ADMIN_PIN) {
        localStorage.setItem("adminLogged", "yes");
        loginScreen.style.display = "none";
        adminPanel.style.display = "block";
        loadOrders();
    } else {
        alert("PIN salah!");
    }
};

// Auto login
if (localStorage.getItem("adminLogged") === "yes") {
    loginScreen.style.display = "none";
    adminPanel.style.display = "block";
}

// Logout
document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem("adminLogged");
    location.reload();
};

// API
const API = "/api/orders";
const PRINT_API = "/api/receipt/";
let orders = [];
let lastInvoicePrinted = null;

// Load Orders
async function loadOrders() {
    const res = await fetch(API);
    orders = await res.json();
    renderStats();
    renderTable(orders);
}

function renderStats() {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "pending" || !o.status).length;
    const done = orders.filter(o => o.status === "selesai").length;

    document.getElementById("totalOrders").textContent = total;
    document.getElementById("pendingOrders").textContent = pending;
    document.getElementById("completedOrders").textContent = done;
}

// Render Table
function renderTable(list) {
    const tbody = document.querySelector("#orderTable tbody");
    tbody.innerHTML = "";

    list.forEach(o => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${o.invoice}</td>
            <td>${o.nama}</td>
            <td>Rp ${o.total.toLocaleString('id-ID')}</td>
            <td>${o.status || "pending"}</td>
            <td>
                <button class="btn-small btn-view" onclick='viewOrder(${JSON.stringify(o)})'>View</button>
                <button class="btn-small btn-wa" onclick='sendWA(${JSON.stringify(o)})'>WA</button>
                <button class="btn-small btn-status" onclick="changeStatus('${o.invoice}')">Set</button>
                <button class="btn-small btn-print" onclick="printInvoice('${o.invoice}')">Print</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// View Detail
function viewOrder(o) {
    const box = document.getElementById("notaContent");

    box.innerHTML = `
        <strong>Invoice:</strong> ${o.invoice}<br>
        <strong>Nama:</strong> ${o.nama}<br>
        <strong>WA:</strong> ${o.wa}<br>
        <strong>Jenis:</strong> ${o.jenis}<br>
        <strong>Isi:</strong> ${o.isi}<br>
        <strong>Mode:</strong> ${o.mode}<br>
        <strong>Topping:</strong> ${o.topping.join(", ") || "-"}<br>
        <strong>Taburan:</strong> ${o.taburan.join(", ") || "-"}<br>
        <strong>Jumlah:</strong> ${o.jumlah}<br>
        <strong>Total:</strong> Rp ${o.total.toLocaleString("id-ID")}<br>
        <strong>Catatan:</strong> ${o.note || "-"}
    `;

    document.getElementById("notaModal").style.display = "flex";
}

// Print Invoice
async function printInvoice(invoice) {
    lastInvoicePrinted = invoice;

    try {
        const res = await fetch(PRINT_API + invoice);
        if (res.ok) {
            const blob = await res.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = invoice + ".pdf";
            link.click();
        } else {
            alert("Server gagal mencetak, fallback PDF.");
            pdfFallback(invoice);
        }
    } catch (e) {
        pdfFallback(invoice);
    }
}

// fallback PDF
function pdfFallback(inv) {
    const o = orders.find(x => x.invoice === inv);
    if (!o) return;

    const w = window.open("", "_blank");
    w.document.write(`
        <h2>NOTA PEMBELIAN</h2>
        Invoice: ${o.invoice}<br>
        Nama: ${o.nama}<br>
        Total: Rp ${o.total.toLocaleString('id-ID')}<br>
    `);
    w.print();
}

// Print last invoice
document.getElementById("printLastInvoice").onclick = () => {
    if (!lastInvoicePrinted) return alert("Belum ada cetakan terakhir.");
    printInvoice(lastInvoicePrinted);
};

// Change status
async function changeStatus(invoice) {
    const newStatus = prompt("Masukkan status baru (pending / diproses / selesai):");
    if (!newStatus) return;

    await fetch(API + "/" + invoice, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    });

    loadOrders();
}

// Send WA
function sendWA(o) {
    const msg = `Halo ${o.nama}, pesanan Anda:\nInvoice: ${o.invoice}\nTotal: Rp ${o.total.toLocaleString('id-ID')}`;
    window.open(`https://wa.me/${o.wa}?text=${encodeURIComponent(msg)}`, "_blank");
}

// Filters
document.getElementById("filterAll").onclick = () => renderTable(orders);
document.getElementById("filterPending").onclick = () =>
    renderTable(orders.filter(o => !o.status || o.status === "pending"));
document.getElementById("filterDone").onclick = () =>
    renderTable(orders.filter(o => o.status === "selesai"));
