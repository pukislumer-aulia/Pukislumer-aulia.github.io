/****************************************************
 *  ORDER.JS PREMIUM – PUKIS LUMER AULIA
 *  Fitur:
 *  - Harga otomatis
 *  - Dropdown dinamis Non/Single/Double
 *  - Max 5 topping, max 5 taburan
 *  - Nota PDF premium
 *  - Kirim WA admin
 ****************************************************/

import { jsPDF } from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";

/* ======================
    KONFIGURASI HARGA
======================= */

const PRICE = {
    jenis: {
        original: 0,
        pandan: 0
    },
    topping: {
        non: 0,
        single: 2000,
        double: 4000
    },
    isiBox: {
        5: 8000,
        10: 15000
    }
};

const ADMIN_WA = "62812xxxxxxx"; // ganti nomor admin


/* =============================
    ELEMENT FORM
============================= */

const jenisInput = document.getElementById("jenis");
const isiBoxInput = document.getElementById("isiBox");
const jumlahBoxInput = document.getElementById("jumlahBox");
const toppingModeInput = document.getElementById("toppingMode");

const singleContainer = document.getElementById("singleToppingContainer");
const doubleContainer = document.getElementById("doubleToppingContainer");

const hargaBoxOutput = document.getElementById("hargaBox");
const totalHargaOutput = document.getElementById("totalHarga");

const btnSubmit = document.getElementById("btnOrder");
const btnPDF = document.getElementById("btnPDF");
const btnWA = document.getElementById("btnWA");

// Data pesanan terakhir
let lastOrder = null;


/* ============================
    ATURAN TOPPING
============================= */

const toppingList = ["Coklat", "Cappucino", "Vanilla", "Stroberi", "Tiramisu"];
const taburanList = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];


/* ==================================================
   FUNGSI MEMBUAT CHECKBOX DINAMIS
=================================================== */

function renderCheckbox(container, items, className, maxSelect = 5) {
    container.innerHTML = "";
    items.forEach(item => {
        const id = `${className}-${item}`;

        container.innerHTML += `
            <label class="check-item">
                <input type="checkbox" class="${className}" value="${item}">
                ${item}
            </label>
        `;
    });

    // batas maksimal
    const checkboxes = container.querySelectorAll(`.${className}`);
    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const selected = [...checkboxes].filter(c => c.checked).length;
            if (selected > maxSelect) {
                cb.checked = false;
                alert(`Maksimal hanya ${maxSelect} pilihan!`);
            }
        });
    });
}


/* ==================================================
    MUNCULKAN TOPPING BERDASARKAN MODE
=================================================== */

function updateToppingVisibility() {
    const mode = toppingModeInput.value;

    singleContainer.style.display = "none";
    doubleContainer.style.display = "none";

    if (mode === "single") {
        renderCheckbox(singleContainer, toppingList, "singleCB");
        singleContainer.style.display = "block";
    }

    if (mode === "double") {
        renderCheckbox(singleContainer, toppingList, "singleCB");
        renderCheckbox(doubleContainer, taburanList, "doubleCB");
        singleContainer.style.display = "block";
        doubleContainer.style.display = "block";
    }

    hitungHarga();
}


/* ==================================================
    HITUNG HARGA OTOMATIS
=================================================== */

function hitungHarga() {
    const jenis = jenisInput.value;
    const isi = Number(isiBoxInput.value);
    const toppingMode = toppingModeInput.value;
    const jlhBox = Number(jumlahBoxInput.value);

    if (!isi || !jlhBox) return;

    let pricePerBox = PRICE.isiBox[isi] + PRICE.topping[toppingMode];

    hargaBoxOutput.innerText = "Rp " + pricePerBox.toLocaleString();

    const total = pricePerBox * jlhBox;
    totalHargaOutput.innerText = "Rp " + total.toLocaleString();

    return {
        pricePerBox,
        total
    };
}


/* ==================================================
    AMBIL DATA TOPPING
=================================================== */

function getSelected(className) {
    return [...document.querySelectorAll(`.${className}:checked`)].map(cb => cb.value);
}


/* ==================================================
     BUAT OBJEK ORDER
=================================================== */

function createOrder() {
    const harga = hitungHarga();

    return {
        invoiceID: "INV" + Date.now(),
        nama: document.getElementById("nama").value,
        buyerWA: document.getElementById("wa").value,

        jenis: jenisInput.value,
        toppingMode: toppingModeInput.value,
        isiPerBox: Number(isiBoxInput.value),
        jumlahBox: Number(jumlahBoxInput.value),

        singleList: getSelected("singleCB"),
        doubleList: getSelected("doubleCB"),

        pricePerBox: harga.pricePerBox,
        subTotal: harga.total,
        discount: 0,
        grandTotal: harga.total
    };
}


/* ==================================================
    PDF PREMIUM
=================================================== */

function generatePremiumNota(order) {
    const doc = new jsPDF();

    // watermark emas
    doc.setFontSize(40);
    doc.setTextColor(212, 175, 55);
    doc.text("PUKIS LUMER AULIA", 20, 150, { angle: 45, opacity: 0.15 });

    // logo
    doc.addImage("assets/images/logo.png", "PNG", 15, 10, 35, 35);

    // judul
    doc.setFontSize(18);
    doc.text("INVOICE PEMBELIAN", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.text(`No: ${order.invoiceID}`, 105, 28, null, null, "center");

    // pembeli
    doc.text(`Nama: ${order.nama}`, 15, 55);
    doc.text(`WA: ${order.buyerWA}`, 15, 62);

    // tabel
    doc.autoTable({
        startY: 75,
        head: [["Keterangan", "Isi"]],
        body: [
            ["Jenis", order.jenis],
            ["Topping Mode", order.toppingMode],
            ["Topping Single", order.singleList.join(", ") || "-"],
            ["Taburan Double", order.doubleList.join(", ") || "-"],
            ["Isi/Box", order.isiPerBox + " pcs"],
            ["Jumlah Box", order.jumlahBox],
            ["Harga/Box", "Rp " + order.pricePerBox.toLocaleString()],
            ["Total", "Rp " + order.grandTotal.toLocaleString()]
        ],
        theme: "grid",
        headStyles: { fillColor: [212, 175, 55] }
    });

    // tanda tangan digital
    doc.addImage("assets/images/ttd.png", "PNG", 140, 220, 40, 20);
    doc.text("Admin Pukis Lumer Aulia", 145, 245);

    return doc;
}


/* ==================================================
    KIRIM WA
=================================================== */

function sendWA(order) {
    const text = `
Halo! Saya ingin memesan Pukis:

Nama: ${order.nama}
Jenis: ${order.jenis}
Topping Mode: ${order.toppingMode}
Topping Single: ${order.singleList.join(", ") || "-"}
Taburan Double: ${order.doubleList.join(", ") || "-"}
Isi per Box: ${order.isiPerBox} pcs
Jumlah Box: ${order.jumlahBox} box
Total Bayar: Rp ${order.grandTotal.toLocaleString()}
`;

    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`);
}


/* ==================================================
    EVENT LISTENER
=================================================== */

toppingModeInput.addEventListener("change", updateToppingVisibility);
jenisInput.addEventListener("change", hitungHarga);
isiBoxInput.addEventListener("change", hitungHarga);
jumlahBoxInput.addEventListener("change", hitungHarga);

btnSubmit.addEventListener("click", () => {
    lastOrder = createOrder();
    alert("Pesanan berhasil dibuat!");
});

btnPDF.addEventListener("click", () => {
    const pdf = generatePremiumNota(lastOrder);
    pdf.save(`Invoice-${lastOrder.invoiceID}.pdf`);
});

btnWA.addEventListener("click", () => {
    sendWA(lastOrder);
});

updateToppingVisibility();
hitungHarga();
