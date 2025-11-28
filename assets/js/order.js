// ========================================================
// ORDER.JS FINAL — PUKIS LUMER AULIA
// Versi paling stabil — 2025.11
// Tanpa duplikat, tanpa konflik, PDF sudah fix total
// ========================================================

console.info("[order.js] Loaded — FINAL v2025.11");

document.addEventListener("DOMContentLoaded", () => {

    // ================================  
    // Block 1: Helper & DOM  
    // ================================
    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));
    window.$ = $; 
    window.$$ = $$;

    const formatRp = n => "Rp " + Number(n || 0).toLocaleString("id-ID");

    const formUltra = $("#formUltra");
    const notaContainer = $("#notaContainer");
    const notaContent = $("#notaContent");

    // ================================  
    // Block 2: Harga  
    // ================================
    const PRICE_MAP = {
        Original: {
            "5": { non: 10000, single: 13000, double: 15000 },
            "10": { non: 18000, single: 25000, double: 28000 }
        },
        Pandan: {
            "5": { non: 12000, single: 15000, double: 18000 },
            "10": { non: 22000, single: 28000, double: 32000 }
        }
    };

    const SINGLE_TOPPINGS = ["Coklat", "Tiramisu", "Vanilla", "Stroberry", "Cappucino"];
    const DOUBLE_TABURAN = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

    // =======================================================
    // Block 3 — Kalkulasi Total
    // =======================================================
    window.calculateOrderData = function () {
        const jenis = $("input[name='ultraJenis']:checked")?.value || "Original";
        const isi = $("#ultraIsi")?.value || "5";
        const mode = $("input[name='ultraToppingMode']:checked")?.value || "non";
        const jumlahBox = parseInt($("#ultraJumlah")?.value || "1");

        const pricePerBox = PRICE_MAP[jenis][isi][mode];
        const subtotal = pricePerBox * jumlahBox;
        const discount = (isi === "10" && jumlahBox >= 10) ? jumlahBox * 500 : 0;
        const total = subtotal - discount;

        const topping = $$(".ultraTopping:checked").map(x => x.value);
        const taburan = $$(".ultraTaburan:checked").map(x => x.value);

        const order = {
            orderID: "INV-" + Date.now(),
            queueNo: nextQueueNumber(),
            nama: $("#ultraNama")?.value || "-",
            wa: $("#ultraWA")?.value || "-",
            jenis, isi, mode,
            topping, taburan,
            jumlahBox, pricePerBox, subtotal, discount, total,
            note: $("#ultraNote")?.value || "-",
            createdAt: new Date().toISOString(),
            tgl: new Date().toLocaleString("id-ID")
        };

        localStorage.setItem("lastOrderDraft", JSON.stringify(order));

        $("#ultraPricePerBox").innerText = formatRp(pricePerBox);
        $("#ultraSubtotal").innerText = formatRp(subtotal);
        $("#ultraDiscount").innerText = discount > 0 ? "- " + formatRp(discount) : "-";
        $("#ultraGrandTotal").innerText = formatRp(total);

        return order;
    };

    // =======================================================
    // Block 4 — Antrian Otomatis Harian
    // =======================================================
    function nextQueueNumber() {
        const dateKey = "queue_date";
        const numKey = "queue_last";
        const today = new Date().toISOString().slice(0, 10);

        let lastDate = localStorage.getItem(dateKey);
        let lastNum = Number(localStorage.getItem(numKey) || "0");

        if (lastDate !== today) {
            localStorage.setItem(dateKey, today);
            localStorage.setItem(numKey, "0");
            return 1;
        }

        lastNum++;
        localStorage.setItem(numKey, lastNum);
        return lastNum;
    }

    // =======================================================
    // Block 5 — Render Topping  
    // =======================================================
    function renderToppings() {
        const mode = $("input[name='ultraToppingMode']:checked")?.value || "non";
        const isi = Number($("#ultraIsi")?.value || "5");

        const groupSingle = $("#ultraSingleGroup");
        const groupDouble = $("#ultraDoubleGroup");

        groupSingle.innerHTML = "";
        groupDouble.innerHTML = "";

        if (mode === "non") {
            groupSingle.style.display = "none";
            groupDouble.style.display = "none";
            return;
        }

        groupSingle.style.display = "flex";
        SINGLE_TOPPINGS.forEach((t, i) => {
            if (i < isi) {
                groupSingle.innerHTML += `
                    <label class="topping-check">
                        <input type="checkbox" class="ultraTopping" value="${t}">
                        <span>${t}</span>
                    </label>`;
            }
        });

        if (mode === "double") {
            groupDouble.style.display = "flex";
            DOUBLE_TABURAN.forEach((t, i) => {
                if (i < isi) {
                    groupDouble.innerHTML += `
                        <label class="topping-check">
                            <input type="checkbox" class="ultraTaburan" value="${t}">
                            <span>${t}</span>
                        </label>`;
                }
            });
        }
    }

    // initial
    renderToppings();
    calculateOrderData();


    // =======================================================
    // Block 6 — Submit Order & Tampilkan Nota
    // =======================================================
    formUltra?.addEventListener("submit", e => {
        e.preventDefault();

        const order = calculateOrderData();
        localStorage.setItem("lastOrder", JSON.stringify(order));

        notaContainer.style.display = "flex";
        notaContent.innerHTML = `
            <p><strong>Order ID:</strong> ${order.orderID}</p>
            <p><strong>Antrian:</strong> ${order.queueNo}</p>
            <p><strong>Nama:</strong> ${order.nama}</p>
            <p><strong>WA:</strong> ${order.wa}</p>
            <p><strong>Jenis:</strong> ${order.jenis} — ${order.isi} pcs</p>
            <p><strong>Mode:</strong> ${order.mode}</p>
            <p><strong>Topping:</strong> ${order.topping.join(", ") || "-"}</p>
            ${order.mode === "double" ? `<p><strong>Taburan:</strong> ${order.taburan.join(", ") || "-"}</p>` : ""}
            <p><strong>Jumlah Box:</strong> ${order.jumlahBox}</p>
            <p><strong>Total:</strong> ${formatRp(order.total)}</p>
        `;
    });

    $("#notaClose")?.addEventListener("click", () => notaContainer.style.display = "none");


    // =======================================================
// Block 7 — PDF Generator (FINAL, TANPA DUPLIKAT)
// =======================================================

async function generatePdf(order) {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) throw new Error("jsPDF tidak tersedia!");

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const formatRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

        /* ---- Loader gambar ---- */
        async function loadImage(src) {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = src;
            });
        }

        // Ambil logo, ttd, qris
        const [logoImg, ttdImg, qrisImg] = await Promise.all([
            loadImage("assets/images/logo.png"),
            loadImage("assets/images/ttd.png"),
            loadImage("assets/images/qris-pukis.jpg")
        ]);

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();

        /* ---- WATERMARK ---- */
        pdf.setTextColor(220, 220, 220);
        pdf.setFontSize(48);
        pdf.text("PUKIS LUMER AULIA", pageW / 2, pageH / 2, {
            align: "center",
            angle: 45
        });
        pdf.setTextColor(0, 0, 0);

        /* ---- HEADER ---- */
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("INVOICE", 14, 16);

        pdf.setFontSize(20);
        pdf.setTextColor(214, 51, 108);
        pdf.text("PUKIS LUMER AULIA", pageW / 2, 22, { align: "center" });
        pdf.setTextColor(0, 0, 0);

        if (logoImg) pdf.addImage(logoImg, "PNG", pageW - 55, 6, 40, 20);

        pdf.setFontSize(9);
        pdf.text("Pasar Kuliner Padang Panjang", pageW - 10, 28, { align: "right" });
        pdf.text("📞 0812-9666-8670", pageW - 10, 32, { align: "right" });

        pdf.line(10, 36, pageW - 10, 36);

        /* ---- META DATA ---- */
        let y = 44;
        pdf.setFontSize(10);

        pdf.text(`Order ID: ${order.orderID}`, 14, y);
        pdf.text(`Tanggal: ${order.tgl}`, pageW - 14, y, { align: "right" });
        y += 7;

        pdf.text(`No. Antrian: ${order.queueNo}`, 14, y);
        pdf.text(`Invoice by: Pukis Lumer Aulia`, pageW - 14, y, { align: "right" });
        y += 8;

        /* ---- CUSTOMER DATA ---- */
        pdf.text(`Nama: ${order.nama}`, 14, y);
        pdf.text(`WA: ${order.wa}`, pageW - 14, y, { align: "right" });
        y += 7;

        pdf.text(`Jenis: ${order.jenis} — ${order.isi} pcs`, 14, y);
        y += 7;
        pdf.text(`Mode: ${order.mode}`, 14, y);
        y += 7;

        if (order.mode === "single") {
            pdf.text(`Topping: ${order.topping.join(", ") || "-"}`, 14, y);
            y += 7;
        }

        if (order.mode === "double") {
            pdf.text(`Topping: ${order.topping.join(", ") || "-"}`, 14, y);
            y += 7;
            pdf.text(`Taburan: ${order.taburan.join(", ") || "-"}`, 14, y);
            y += 7;
        }

        if (order.note && order.note !== "-") {
            pdf.text("Catatan:", 14, y);
            y += 6;
            const split = pdf.splitTextToSize(order.note, pageW - 28);
            pdf.text(split, 14, y);
            y += split.length * 6 + 4;
        }

        /* ---- TABEL DETAIL (Versi Lama) ---- */
        const detailRows = [
            ["Jenis", order.jenis],
            ["Isi Box", order.isi + " pcs"],
            ["Mode", order.mode],
            ["Topping", order.topping.length ? order.topping.join(", ") : "-"],
            ["Taburan", order.taburan.length ? order.taburan.join(", ") : "-"],
            ["Jumlah Box", order.jumlahBox + " Box"],
            ["Harga per Box", formatRp(order.pricePerBox)],
            ["Subtotal", formatRp(order.subtotal)],
            ["Diskon", order.discount > 0 ? "- " + formatRp(order.discount) : "-"],
            ["Total Bayar", formatRp(order.total)],
            ["Catatan", order.note || "-"]
        ];

        pdf.autoTable({
            startY: y,
            head: [["Item", "Keterangan"]],
            body: detailRows,
            theme: "striped",
            headStyles: { fillColor: [214, 51, 108], textColor: 255 },
            styles: { fontSize: 10 }
        });

        const lastY = pdf.lastAutoTable.finalY + 10;

        /* ---- FOOTER (QRIS + TTD + THANKS) ---- */
        if (qrisImg) pdf.addImage(qrisImg, "PNG", 14, lastY + 4, 36, 36);
        if (ttdImg) pdf.addImage(ttdImg, "PNG", pageW - 60, lastY + 4, 46, 22);

        pdf.setFontSize(10);
        pdf.text("Hormat Kami,", pageW - 60, lastY + 30);

        pdf.setFontSize(11);
        pdf.text("Terimakasih sudah Belanja di toko Kami 🙏",
            pageW / 2, lastY + 60,
            { align: "center" }
        );

        /* ---- SIMPAN FILE ---- */
        const filename = `Invoice_${(order.nama || "Pelanggan").replace(/\s+/g, "_")}_${order.orderID}.pdf`;
        pdf.save(filename);

        return true;

    } catch (err) {
        alert("Gagal membuat PDF: " + err.message);
        console.error(err);
        return false;
    }
}

/* ---- Button Print ---- */
$("#notaPrint")?.addEventListener("click", async () => {
    const order = JSON.parse(localStorage.getItem("lastOrder") || "{}");
    if (!order.orderID) return alert("Tidak ada order.");
    await generatePdf(order);
});
