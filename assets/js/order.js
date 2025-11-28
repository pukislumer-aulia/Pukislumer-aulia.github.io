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
    // Block 7 — PDF Generator (FINAL)
    // =======================================================
    async function generatePdf(order) {
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) throw new Error("jsPDF tidak tersedia!");

            const pdf = new jsPDF({ unit: "mm", format: "a4" });

            // ========= WATERMARK =========
            pdf.setTextColor(220,220,220);
            pdf.setFontSize(46);
            pdf.text("PUKIS LUMER AULIA", 105, 150, {align:"center", angle:45});
            pdf.setTextColor(0,0,0);

            // ========= HEADER =========
            const logo = await loadImg("assets/images/logo.png");
            if (logo) pdf.addImage(logo, "PNG", 150, 10, 40, 20);

            pdf.setFontSize(20);
            pdf.setTextColor(214,51,108);
            pdf.text("PUKIS LUMER AULIA", 105, 18, {align:"center"});

            pdf.setTextColor(0,0,0);
            pdf.setFontSize(10);
            pdf.text("Pasar Kuliner Padang Panjang", 200, 34, {align:"right"});
            pdf.text("0812-9666-8670", 200, 38, {align:"right"});

            pdf.line(10, 42, 200, 42);

            // ========= META =========
            let y = 50;
            pdf.text(`Order ID: ${order.orderID}`, 10, y);
            pdf.text(`Tanggal: ${order.tgl}`, 200, y, {align: "right"}); y+=7;

            pdf.text(`Antrian: ${order.queueNo}`, 10, y); y+=7;

            // ========= CUSTOMER =========
            pdf.text(`Nama: ${order.nama}`, 10, y); 
            pdf.text(`WA: ${order.wa}`, 200, y, {align:"right"}); y+=7;

            pdf.text(`Jenis: ${order.jenis} — ${order.isi} pcs`, 10, y); y+=7;
            pdf.text(`Mode: ${order.mode}`, 10, y); y+=7;

            if(order.mode==="single"){
                pdf.text(`Topping: ${order.topping.join(", ")||"-"}`, 10, y); y+=7;
            }
            if(order.mode==="double"){
                pdf.text(`Topping: ${order.topping.join(", ")||"-"}`, 10, y); y+=7;
                pdf.text(`Taburan: ${order.taburan.join(", ")||"-"}`, 10, y); y+=7;
            }

            // ========= CATATAN =========
            if(order.note && order.note !== "-"){
                pdf.text("Catatan:", 10, y); y+=6;
                const split = pdf.splitTextToSize(order.note, 180);
                pdf.text(split, 10, y);
                y += split.length * 6 + 4;
            }

            // ========= TABLE =========
            const desc = `${order.jenis} — ${order.isi} pcs`;
            pdf.autoTable({
                startY: y,
                head: [["Deskripsi", "Harga/Box", "Jumlah", "Total"]],
                body: [[
                    desc,
                    formatRp(order.pricePerBox),
                    `${order.jumlahBox} Box`,
                    formatRp(order.total)
                ]],
                theme: "grid",
                headStyles: { fillColor: [214,51,108], textColor: 255 },
                styles: { fontSize: 10 }
            });

            const lastY = pdf.lastAutoTable.finalY + 10;

            pdf.setFont("helvetica", "bold");
            pdf.text(`Total Bayar: ${formatRp(order.total)}`, 200, lastY, {align:"right"});

            // ========= FOOTER =========
            const qris = await loadImg("assets/images/qris-pukis.jpg");
            if(qris) pdf.addImage(qris, "PNG", 10, lastY+10, 40, 40);

            const ttd = await loadImg("assets/images/ttd.png");
            if(ttd) pdf.addImage(ttd, "PNG", 150, lastY+10, 40, 20);

            pdf.text("Terimakasih sudah belanja 🙏", 105, lastY+60, {align:"center"});

            pdf.save(`Invoice_${order.orderID}.pdf`);
            return true;
        } 
        catch(e){
            alert("Gagal membuat PDF: " + e.message);
            console.error(e);
            return false;
        }
    }

    async function loadImg(src){
        return new Promise(res=>{
            const img = new Image();
            img.onload = ()=>res(img);
            img.onerror = ()=>res(null);
            img.src = src;
        });
    }

    $("#notaPrint")?.addEventListener("click", async ()=>{
        const order = JSON.parse(localStorage.getItem("lastOrder")||"{}");
        if(!order.orderID) return alert("Tidak ada order.");
        await generatePdf(order);
    });

});
