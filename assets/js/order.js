/* assets/js/order.js — FINAL FULL VERSION (REVISI) */
(function() {
    'use strict';

    const ADMIN_WA = "6281296668670";

    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));

    /* =============================
          DATA & CONFIG
    ============================= */
    const TOPPINGS_SINGLE = ["Coklat", "Tiramisu", "Vanilla", "Stroberi", "Cappucino"];
    const TOPPINGS_TABURAN = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

    const MAX_TOPPINGS = 5; // Maksimum topping/taburan yg boleh dipilih

    const HARGA_PUKIS = {
        "Original": {
            5: {
                non: 10000,
                single: 13000,
                double: 15000
            },
            10: {
                non: 18000,
                single: 25000,
                double: 28000
            }
        },
        "Pandan": {
            5: {
                non: 13000,
                single: 15000,
                double: 18000
            },
            10: {
                non: 25000,
                single: 28000,
                double: 32000
            }
        }
    };

    /* =============================
          UTIL FUNCTIONS
    ============================= */
    const isValidWA = wa => /^(08\d{8,13}|\+628\d{7,13})$/.test((wa || "").replace(/\s+/g, '').trim());

    const genInvoice = () => "INV-" + (crypto.randomUUID ? crypto.randomUUID().split("-")[0].toUpperCase() : Date.now().toString(36).toUpperCase());

    const genId = () => "o" + (crypto.randomUUID ? crypto.randomUUID().split("-")[0] : Date.now().toString(36));

    const formatRupiah = num => "Rp " + (num || 0).toLocaleString("id-ID");

    /* =============================
       ELEMENT REFERENCES
    ============================= */
    const el = {
        form: $("#formUltra"),
        nama: $("#ultraNama"),
        wa: $("#ultraWA"),
        jenis: $$("input[name='ultraJenis']"),
        isi: $("#ultraIsi"),
        toppingMode: $$("input[name='ultraToppingMode']"),
        jml: $("#ultraJumlah"),
        note: $("#ultraNote"),

        singleGroup: $("#ultraSingleGroup"),
        doubleGroup: $("#ultraDoubleGroup"),

        pricePerBox: $("#ultraPricePerBox"),
        subtotal: $("#ultraSubtotal"),
        grandTotal: $("#ultraGrandTotal"),

        submitBtn: $("#ultraSubmit"),
        notaContainer: $("#notaContainer"),
        notaContent: $("#notaContent"),
        notaClose: $("#notaClose"),
        notaPrint: $("#notaPrint")
    };

    /* =============================
       STATE
    ============================= */
    let selectedSingle = [];
    let selectedTaburan = [];

    /* =============================
       TOPPING BUTTONS
    ============================= */
    function renderToppingButtons() {
        el.singleGroup.innerHTML = "";
        el.doubleGroup.innerHTML = "";

        const renderButtons = (container, toppings, isSingle) => {
            toppings.forEach(name => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "topping-btn";
                btn.textContent = name;
                btn.dataset.name = name;

                const isSelected = isSingle ? selectedSingle.includes(name) : selectedTaburan.includes(name);
                if (isSelected) btn.classList.add("active");

                btn.addEventListener("click", () => {
                    toggleTopping(btn, name, isSingle);
                });

                container.appendChild(btn);
            });
        };

        renderButtons(el.singleGroup, TOPPINGS_SINGLE, true);
        renderButtons(el.doubleGroup, [...TOPPINGS_SINGLE, ...TOPPINGS_TABURAN], false);

        refreshDisabledStates();
    }

    function toggleTopping(button, topping, isSingle) {
        const toppingArray = isSingle ? selectedSingle : selectedTaburan;
        const maxToppings = MAX_TOPPINGS;

        const index = toppingArray.indexOf(topping);
        if (index >= 0) {
            toppingArray.splice(index, 1);
        } else {
            if (toppingArray.length >= maxToppings) {
                button.classList.add("disabled");
                setTimeout(() => button.classList.remove("disabled"), 300);
                return;
            }
            toppingArray.push(topping);
        }

        renderToppingButtons();
        calcPrice();
    }

    function refreshDisabledStates() {
        // (optional) disable buttons when limit is reached
    }

    /* =============================
       UPDATE UI BASED ON MODE
    ============================= */
    function updateToppingUI() {
        const mode = $$("input[name='ultraToppingMode']:checked")[0]?.value || "non";

        el.singleGroup.style.display = (mode === "single") ? "flex" : "none";
        el.doubleGroup.style.display = (mode === "double") ? "flex" : "none";

        renderToppingButtons();
        calcPrice();
    }

    /* =============================
          PRICE CALC
    ============================= */
    function calcPrice() {
        const jenis = $$("input[name='ultraJenis']:checked")[0]?.value || "Original";
        const isi = Number(el.isi.value) || 5;
        const mode = $$("input[name='ultraToppingMode']:checked")[0]?.value || "non";
        const jml = Math.max(1, Number(el.jml.value) || 1);

        let base = HARGA_PUKIS[jenis][isi][mode] || 0;
        let total = base * jml;

        el.pricePerBox.textContent = formatRupiah(base);
        el.subtotal.textContent = formatRupiah(base * jml);
        el.grandTotal.textContent = formatRupiah(total);

        return {
            base,
            total
        };
    }

    /* =============================
          VALIDATE
    ============================= */
    function validateForm() {
        if (!el.nama.value.trim()) {
            alert("Nama harus diisi.");
            el.nama.focus();
            return false;
        }
        if (!isValidWA(el.wa.value)) {
            alert("Nomor WA tidak valid.");
            el.wa.focus();
            return false;
        }
        if (Number(el.jml.value) <= 0) {
            alert("Jumlah harus lebih dari 0.");
            el.jml.focus();
            return false;
        }
        return true;
    }

    /* =============================
          SAVE ORDER
    ============================= */
    function saveOrder(order) {
        try {
            const orders = JSON.parse(localStorage.getItem("orders") || "[]");
            orders.push(order);
            localStorage.setItem("orders", JSON.stringify(orders));
        } catch (e) {
            console.error("Error saving order", e);
            alert("Gagal menyimpan pesanan. Coba lagi nanti.");
        }
    }

    /* =============================
        SEND WA TO ADMIN
    ============================= */
    function sendToAdmin(order) {
        let msg = `*ORDER BARU MASUK*\n• Invoice: ${order.invoice}\n• Nama: ${order.nama}\n• WA: ${order.wa}\n• Jenis: ${order.jenis}\n• Isi: ${order.isi} pcs\n• Mode: ${order.mode}\n• Jumlah Box: ${order.jumlah}\n• Total: ${formatRupiah(order.total)}`;

        if (order.mode === "single") {
            msg += `\n• Topping: ${order.single.join(", ") || "-"}`;
        } else if (order.mode === "double") {
            msg += `\n• Topping Single: ${order.single.join(", ") || "-"}`;
            msg += `\n• Taburan: ${order.taburan.join(", ") || "-"}`;
        }

        msg += `\n*Catatan:* ${order.note || "-"}\n\nSilakan diproses admin 🙏`;

        const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
    }

    /* =============================
       GENERATE NOTA
    ============================= */
    function generateNotaHTML(order) {
        let toppingText = "";
        if (order.mode === "single") {
            toppingText = `Topping: ${order.single.join(", ") || "-"}`;
        } else if (order.mode === "double") {
            toppingText = `Topping Single: ${order.single.join(", ") || "-"}<br>Taburan: ${order.taburan.join(", ") || "-"}`;
        } else {
            toppingText = "Tanpa Topping";
        }

        return `
            <p><strong>Nama:</strong> ${order.nama}</p>
            <p><strong>Jenis:</strong> ${order.jenis}</p>
            <p><strong>${toppingText}</strong></p>
            <p><strong>Isi per Box:</strong> ${order.isi} pcs</p>
            <p><strong>Jumlah Box:</strong> ${order.jumlah}</p>
            <hr>
            <p><strong>Total Harga:</strong> ${formatRupiah(order.total)}</p>
        `;
    }

    /* -------------------------------------------------------------
       EVENT: Gen PDF
    ------------------------------------------------------------- */
    function handleNotaPrint() {
        const {
            jsPDF
        } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(14);
        doc.text("Nota Pemesanan Pukis Lumer Aulia", 14, 14);

        let y = 26;
        const lines = el.notaContent.innerText.split("\n");

        lines.forEach(line => {
            doc.text(line, 14, y);
            y += 8;
        });

        doc.save("nota-pesan.pdf");
    }

    /* =============================
          HANDLE SUBMIT
    ============================= */
    function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) return;

        const jenis = $$("input[name='ultraJenis']:checked")[0].value;
        const isi = Number(el.isi.value);
        const mode = $$("input[name='ultraToppingMode']:checked")[0].value;
        const jml = Math.max(1, Number(el.jml.value) || 1);

        const {
            total
        } = calcPrice();

        const order = {
            id: genId(),
            invoice: genInvoice(),
            nama: el.nama.value.trim(),
            wa: el.wa.value.trim(),
            jenis,
            isi,
            mode,
            jumlah: jml,
            note: el.note.value.trim(),
            total,
            single: selectedSingle.slice(0, MAX_TOPPINGS),
            taburan: selectedTaburan.slice(0, MAX_TOPPINGS),
            tanggal: new Date().toLocaleString("id-ID"),
        };

        saveOrder(order);
        sendToAdmin(order);

        // popup nota
        el.notaContent.innerHTML = generateNotaHTML(order);
        el.notaContainer.classList.add("show");

        // Reset UI
        el.form.reset();
        selectedSingle = [];
        selectedTaburan = [];
        renderToppingButtons();
        updateToppingUI();
        calcPrice();

        alert("Pesanan berhasil + WA dikirim ke admin!");
    }

    /* =============================
          INIT
    ============================= */
    function init() {
        renderToppingButtons();
        updateToppingUI();
        calcPrice();

        el.toppingMode.forEach(r => r.addEventListener("change", updateToppingUI));
        el.jenis.forEach(r => r.addEventListener("change", calcPrice));
        el.isi.addEventListener("change", calcPrice);
        el.jml.addEventListener("input", calcPrice);

        el.form.addEventListener("submit", handleSubmit);
        el.notaClose.addEventListener("click", () => el.notaContainer.classList.remove("show"));
        el.notaPrint.addEventListener("click", handleNotaPrint);
    }

    document.addEventListener("DOMContentLoaded", init);

})();
