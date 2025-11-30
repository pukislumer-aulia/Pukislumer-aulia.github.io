/* ==========================================================
   ADMIN PANEL — PUKIS LUMER AULIA
   FINAL VERSION
========================================================== */

// 🔒 CEK LOGIN
if (!localStorage.getItem("isAdminLogin")) {
    window.location.href = "login.html";
}

// Ambil data pesanan
let orders = JSON.parse(localStorage.getItem("pukisOrders") || "[]");

// Elemen
const tableBody = document.querySelector("#orderTable tbody");
const filterAll = document.getElementById("filterAll");
const filterPending = document.getElementById("filterPending");
const filterDone = document.getElementById("filterDone");
const printLastBtn = document.getElementById("printLastInvoice");

// Render tabel
function renderTable(filter = "all") {
    tableBody.innerHTML = "";

    let filtered = orders;

    if (filter === "pending") {
        filtered = orders.filter(o => o.status === "Pending");
    } else if (filter === "done") {
        filtered = orders.filter(o => o.status === "Done");
    }

    filtered.forEach((order, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${order.invoice}</td>
            <td>${order.nama}</td>
            <td>Rp ${order.total.toLocaleString()}</td>
            <td>
                <span class="${order.status === "Pending" ? "status-pending" : "status-done"}">
                    ${order.status}
                </span>
            </td>
            <td>
                <button class="btn-green" onclick="printInvoice(${index})">Cetak</button>
                <button class="btn-orange" onclick="markDone(${index})">Done</button>
                <button class="btn-blue" onclick="sendInvoiceWA(${index})">Kirim WA</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

renderTable();


// =============================
//  CETAK NOTA (PDF)
// =============================
async function printInvoice(index) {
    const order = orders[index];
    if (!order) return;

    const {
        jsPDF
    } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Nota Pemesanan — Pukis Lumer Aulia", 10, 15);

    doc.setFontSize(12);
    doc.text(`Invoice : ${order.invoice}`, 10, 30);
    doc.text(`Nama    : ${order.nama}`, 10, 40);
    doc.text(`WA      : ${order.wa}`, 10, 50);
    doc.text(`Jenis   : ${order.jenis}`, 10, 60);
    doc.text(`Isi Box : ${order.isi} pcs`, 10, 70);
    doc.text(`Jumlah  : ${order.jumlah} box`, 10, 80);

    doc.text("Topping:", 10, 95);
    order.topping.forEach((t, i) => {
        doc.text(`- ${t}`, 15, 105 + (i * 8));
    });

    doc.text(`Catatan: ${order.catatan || "-"}`, 10, 140);

    doc.setFontSize(14);
    doc.text(`Total Bayar: Rp ${order.total.toLocaleString()}`, 10, 160);

    doc.save(`${order.invoice}.pdf`);
}

// =============================
//  CETAK NOTA TERBARU
// =============================
printLastBtn.addEventListener("click", () => {
    if (orders.length === 0) {
        alert("Belum ada pesanan.");
        return;
    }
    printInvoice(orders.length - 1);
});

// =============================
//  TANDAI SUDAH DICETAK
// =============================
function markDone(index) {
    orders[index].status = "Done";
    localStorage.setItem("pukisOrders", JSON.stringify(orders));
    renderTable();
}

// =============================
//  KIRIM INVOICE KE WA
// =============================
function sendInvoiceWA(index) {
    const order = orders[index];

    let text = `Assalamu'alaikum 👋
Berikut invoice pesanan Pukis Lumer Aulia:

Invoice : ${order.invoice}
Nama    : ${order.nama}
Jumlah  : ${order.jumlah} box
Total   : Rp ${order.total.toLocaleString()}

Silahkan ambil ya 😊`;

    const url = `https://wa.me/${order.wa.replace(/^0/, "62")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
}
