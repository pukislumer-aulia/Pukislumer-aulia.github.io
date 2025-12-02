(function () {
    "use strict";

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    /* =========================================
        ELEMENT UTAMA
    ========================================== */
    const btnSingle = $("#modeSingle");
    const btnDouble = $("#modeDouble");

    const toppingSingleButtons = $$(".topping-single button");
    const toppingTaburanButtons = $$(".topping-taburan button");

    const jumlahInput = $("#jumlah");
    const jenisInput = $("#jenis");
    const isiInput   = $("#isi");
    const namaInput  = $("#nama");
    const waInput    = $("#wa");

    const btnBuat = $("#btnBuatPesanan");

    /* =========================================
        STATE
    ========================================== */
    let order = {
        id: "",
        invoice: "",
        tanggal: "",
        nama: "",
        wa: "",
        jenis: "",
        isi: 0,
        mode: "single",
        single: [],
        taburan: [],
        jumlah: 0,
        total: 0,
        status: "pending"
    };

    /* =========================================
       HELPER
    ========================================== */
    function generateInvoice() {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, "0");
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const y = now.getFullYear().toString().slice(-2);
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `INV-${d}${m}${y}-${rand}`;
    }

    function saveOrderToStorage(data) {
        const stored = JSON.parse(localStorage.getItem("orders") || "[]");
        stored.push(data);
        localStorage.setItem("orders", JSON.stringify(stored));
    }

    function hitungTotal() {
        const base = Number(isiInput.value || 0) * 1000;
        const jml = Number(jumlahInput.value || 1);
        order.total = base * jml;
        $("#totalHarga").textContent = "Rp " + order.total.toLocaleString();
    }

    /* =========================================
        MODE SINGLE / DOUBLE
    ========================================== */
    function setMode(mode) {
        order.mode = mode;

        btnSingle.classList.remove("active");
        btnDouble.classList.remove("active");

        if (mode === "single") {
            btnSingle.classList.add("active");
            $(".topping-single").style.display = "grid";
            $(".topping-taburan").style.display = "none";
        } else {
            btnDouble.classList.add("active");
            $(".topping-single").style.display = "grid";
            $(".topping-taburan").style.display = "grid";
        }
    }

    btnSingle.addEventListener("click", () => setMode("single"));
    btnDouble.addEventListener("click", () => setMode("double"));

    /* =========================================
        TOPPING EVENT (WITH COLOR TOGGLE)
    ========================================== */
    function toggleTopping(button, list) {
        const value = button.dataset.value;

        if (button.classList.contains("selected")) {
            button.classList.remove("selected");
            const idx = list.indexOf(value);
            if (idx >= 0) list.splice(idx, 1);
        } else {
            button.classList.add("selected");
            list.push(value);
        }
    }

    toppingSingleButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            toggleTopping(btn, order.single);
        });
    });

    toppingTaburanButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (order.mode === "double") {
                toggleTopping(btn, order.taburan);
            }
        });
    });

    /* =========================================
        PERUBAHAN INPUT
    ========================================== */
    jumlahInput.addEventListener("input", hitungTotal);
    isiInput.addEventListener("input", hitungTotal);

    /* =========================================
        VALIDASI
    ========================================== */
    function validate() {
        if (!namaInput.value.trim()) {
            alert("Nama tidak boleh kosong!");
            return false;
        }
        if (!waInput.value.trim()) {
            alert("Nomor WA tidak boleh kosong!");
            return false;
        }
        if (!isiInput.value) {
            alert("Pilih isi dahulu!");
            return false;
        }
        if (order.mode === "single" && order.single.length === 0) {
            alert("Pilih minimal 1 topping single!");
            return false;
        }
        if (order.mode === "double") {
            if (order.single.length === 0 || order.taburan.length === 0) {
                alert("Mode double memerlukan topping single & taburan!");
                return false;
            }
        }
        return true;
    }

    /* =========================================
       TOMBOL BUAT PESANAN
       (Double action → popup + admin)
    ========================================== */
    btnBuat.addEventListener("click", () => {

        if (!validate()) return;

        const now = new Date();

        order.id      = crypto.randomUUID();
        order.invoice = generateInvoice();
        order.tanggal = now.toLocaleString("id-ID");
        order.nama    = namaInput.value.trim();
        order.wa      = waInput.value.trim();
        order.jenis   = jenisInput.value;
        order.isi     = Number(isiInput.value);
        order.jumlah  = Number(jumlahInput.value);
        hitungTotal(); // update total akhir

        saveOrderToStorage(order);

        // Buka popup konfirmasi
        sessionStorage.setItem("lastOrder", JSON.stringify(order));
        window.location.href = "popup.html";
    });

})();
