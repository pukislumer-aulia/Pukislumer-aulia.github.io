/* assets/js/order.js — REVISI: topping fix + popup WA + simpan ke admin via localStorage */
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

    const MAX_TOPPINGS = 5; // Maksimum per kategori (single / taburan)

    const HARGA_PUKIS = {
        "Original": {
            5: { non: 10000, single: 13000, double: 15000 },
            10:{ non: 18000, single: 25000, double: 28000 }
        },
        "Pandan": {
            5: { non: 13000, single: 15000, double: 18000 },
            10:{ non: 25000, single: 28000, double: 32000 }
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
        notaPrint: $("#notaPrint"),
        notaWaBtn: $("#notaWaBtn")
    };

    /* =============================
       STATE
    ============================= */
    let selectedSingle = [];
    let selectedTaburan = [];

    /* =============================
       RENDER TOPPINGS
    ============================= */
    function createToppingButton(name, isSelected) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "topping-btn";
        btn.textContent = name;
        btn.dataset.name = name;
        btn.setAttribute("aria-pressed", !!isSelected);

        if (isSelected) btn.classList.add("active");

        // toggle when clicked
        btn.addEventListener("click", () => {
            // determine which list this button belongs to by checking container ancestry
            const parent = btn.closest(".toppings-col");
            const role = parent?.dataset.role; // "single" or "taburan"
            const isSingle = role === "single";
            toggleTopping(name, isSingle);
        });

        return btn;
    }

    function renderToppingButtons() {
        // clear containers
        el.singleGroup.innerHTML = "";
        el.doubleGroup.innerHTML = "";

        // --- single group (for single mode) ---
        const singleWrap = document.createElement("div");
        singleWrap.className = "toppings-col";
        singleWrap.dataset.role = "single";
        TOPPINGS_SINGLE.forEach(name => {
            const isSel = selectedSingle.includes(name);
            singleWrap.appendChild(createToppingButton(name, isSel));
        });
        el.singleGroup.appendChild(singleWrap);

        // --- double group: two columns (left = single toppings, right = taburan) ---
        // build wrapper with two columns so UX lebih jelas
        const doubleLeft = document.createElement("div");
        doubleLeft.className = "toppings-col double-left";
        doubleLeft.dataset.role = "single";
        TOPPINGS_SINGLE.forEach(name => {
            const isSel = selectedSingle.includes(name);
            doubleLeft.appendChild(createToppingButton(name, isSel));
        });

        const doubleRight = document.createElement("div");
        doubleRight.className = "toppings-col double-right";
        doubleRight.dataset.role = "taburan";
        TOPPINGS_TABURAN.forEach(name => {
            const isSel = selectedTaburan.includes(name);
            doubleRight.appendChild(createToppingButton(name, isSel));
        });

        // append columns to doubleGroup
        const doubleWrapper = document.createElement("div");
        doubleWrapper.className = "double-columns";
        doubleWrapper.appendChild(doubleLeft);
        doubleWrapper.appendChild(doubleRight);
        el.doubleGroup.appendChild(doubleWrapper);

        updateActiveStatesUI();
    }

    function updateActiveStatesUI() {
        // ensure every button reflects selected arrays (class active, aria-pressed)
        const allBtns = document.querySelectorAll(".topping-btn");
        allBtns.forEach(btn => {
            const name = btn.dataset.name;
            const parent = btn.closest(".toppings-col");
            const role = parent?.dataset.role;
            const isSingle = role === "single";
            const isSel = isSingle ? selectedSingle.includes(name) : selectedTaburan.includes(name);
            if (isSel) {
                btn.classList.add("active");
                btn.setAttribute("aria-pressed", "true");
            } else {
                btn.classList.remove("active");
                btn.setAttribute("aria-pressed", "false");
            }
        });
    }

    function toggleTopping(topping, isSingle) {
        const arr = isSingle ? selectedSingle : selectedTaburan;
        const idx = arr.indexOf(topping);
        if (idx >= 0) {
            arr.splice(idx, 1);
        } else {
            if (arr.length >= MAX_TOPPINGS) {
                // flash disabled state
                const btns = Array.from(document.querySelectorAll(".topping-btn"));
                const found = btns.find(b => b.dataset.name === topping);
                if (found) {
                    found.classList.add("disabled");
                    setTimeout(() => found.classList.remove("disabled"), 300);
                }
                return;
            }
            arr.push(topping);
        }
        // update UI without full re-render for snappiness
        updateActiveStatesUI();
        calcPrice();
    }

    /* =============================
       SHOW / HIDE GROUP UI
    ============================= */
    function updateToppingUI() {
        const mode = $$("input[name='ultraToppingMode']:checked")[0]?.value || "non";

        // set display and aria-hidden properly
        if (mode === "single") {
            el.singleGroup.style.display = "flex";
            el.singleGroup.setAttribute("aria-hidden", "false");
            el.doubleGroup.style.display = "none";
            el.doubleGroup.setAttribute("aria-hidden", "true");
        } else if (mode === "double") {
            el.singleGroup.style.display = "none";
            el.singleGroup.setAttribute("aria-hidden", "true");
            el.doubleGroup.style.display = "flex";
            el.doubleGroup.setAttribute("aria-hidden", "false");
        } else {
            el.singleGroup.style.display = "none";
            el.singleGroup.setAttribute("aria-hidden", "true");
            el.doubleGroup.style.display = "none";
            el.doubleGroup.setAttribute("aria-hidden", "true");
        }

        // render buttons if not rendered yet (or to reflect mode changes)
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

        // choose base by mode (non/single/double)
        let base = HARGA_PUKIS[jenis][isi][mode] || 0;
        let total = base * jml;

        el.pricePerBox.textContent = formatRupiah(base);
        el.subtotal.textContent = formatRupiah(base * jml);
        el.grandTotal.textContent = formatRupiah(total);

        return { base, total };
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
            alert("Nomor WA tidak valid. Gunakan format 08xxx atau +628xxx");
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
          SAVE ORDER (for admin)
    ============================= */
    function saveOrder(order) {
        try {
            const orders = JSON.parse(localStorage.getItem("orders") || "[]");
            orders.push(order);
            localStorage.setItem("orders", JSON.stringify(orders));
            // also set lastOrder for quick access
            localStorage.setItem("lastOrder", JSON.stringify(order));
            // set a small event token so admin page can detect (if it listens to storage)
            localStorage.setItem("orderEvent", JSON.stringify({ time: Date.now(), invoice: order.invoice }));
        } catch (e) {
            console.error("Error saving order", e);
            alert("Gagal menyimpan pesanan. Coba lagi nanti.");
        }
    }

    /* =============================
        SEND WA TO ADMIN
    ============================= */
    function sendToAdmin(order) {
        let msg = `*ORDER BARU*\nInvoice: ${order.invoice}\nNama: ${order.nama}\nWA: ${order.wa}\nJenis: ${order.jenis}\nIsi: ${order.isi} pcs\nMode: ${order.mode}\nJumlah Box: ${order.jumlah}\nTotal: ${formatRupiah(order.total)}`;

        if (order.mode === "single") {
            msg += `\nTopping: ${order.single.join(", ") || "-"}`;
        } else if (order.mode === "double") {
            msg += `\nTopping Single: ${order.single.join(", ") || "-"}\nTaburan: ${order.taburan.join(", ") || "-"}`;
        } else {
            msg += `\nTanpa Topping`;
        }

        msg += `\nCatatan: ${order.note || "-"}`;

        const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
        // open WA in new tab
        window.open(url, "_blank", "noopener");
    }

    /* =============================
       GENERATE NOTA HTML & WA LINK
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
            <p><strong>Invoice:</strong> ${order.invoice}</p>
            <p><strong>Nama:</strong> ${order.nama}</p>
            <p><strong>WA:</strong> ${order.wa}</p>
            <p><strong>Jenis:</strong> ${order.jenis}</p>
            <p><strong>${toppingText}</strong></p>
            <p><strong>Isi per Box:</strong> ${order.isi} pcs</p>
            <p><strong>Jumlah Box:</strong> ${order.jumlah}</p>
            <hr>
            <p><strong>Total Harga:</strong> ${formatRupiah(order.total)}</p>
            <p><strong>Catatan:</strong> ${order.note || "-"}</p>
            <p class="muted"><small>Dibuat: ${order.tanggal}</small></p>
        `;
    }

    function buildWaLinkForNota(order) {
        let msg = `Halo Admin, ada pesanan baru.\nInvoice: ${order.invoice}\nNama: ${order.nama}\nTotal: ${formatRupiah(order.total)}\nSilakan cek admin panel.\nTerima kasih.`;
        return `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
    }

    /* =============================
         PRINT / PDF (Nota)
    ============================= */
    function handleNotaPrint() {
        // Fallback: if jsPDF not available, open print dialog
        if (!window.jspdf) {
            window.print();
            return;
        }

        const { jsPDF } = window.jspdf;
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

        const { total } = calcPrice();

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
            status: "pending"
        };

        // 1) save for admin
        saveOrder(order);

        // 2) open WA to notify admin (ke WA official)
        sendToAdmin(order);

        // 3) show nota popup (validation)
        el.notaContent.innerHTML = generateNotaHTML(order);
        el.notaContainer.classList.add("show");

        // set WA link on nota button
        if (el.notaWaBtn) {
            el.notaWaBtn.href = buildWaLinkForNota(order);
        }

        // 4) reset form state (but keep lastOrder saved)
        el.form.reset();
        selectedSingle = [];
        selectedTaburan = [];
        renderToppingButtons();
        updateToppingUI();
        calcPrice();

        // small confirmation toast / alert
        setTimeout(() => {
            // focus on nota close for accessibility
            el.notaClose?.focus();
        }, 120);

        // also notify user
        alert("Pesanan tersimpan & WA dikirim ke admin. Silakan cek popup nota untuk cetak/WA.");
    }

    /* =============================
          INIT
    ============================= */
    function init() {
        // initial render
        renderToppingButtons();
        updateToppingUI();
        calcPrice();

        // events
        el.toppingMode.forEach(r => r.addEventListener("change", updateToppingUI));
        el.jenis.forEach(r => r.addEventListener("change", calcPrice));
        el.isi.addEventListener("change", calcPrice);
        el.jml.addEventListener("input", calcPrice);

        el.form.addEventListener("submit", handleSubmit);

        // popup actions
        el.notaClose.addEventListener("click", () => el.notaContainer.classList.remove("show"));
        el.notaPrint.addEventListener("click", handleNotaPrint);
        if (el.notaWaBtn) el.notaWaBtn.addEventListener("click", () => {
            // notaWaBtn is an <a>, so leave default behavior; optionally close popup
            el.notaContainer.classList.remove("show");
        });

        // accessibility: close popup on Esc
        document.addEventListener("keydown", (ev) => {
            if (ev.key === "Escape") {
                el.notaContainer.classList.remove("show");
            }
        });
    }

    document.addEventListener("DOMContentLoaded", init);

})();
