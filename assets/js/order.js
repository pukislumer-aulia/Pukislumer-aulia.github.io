/* ===========================================================
   ELEMENT DASAR
=========================================================== */

const sectionTopping = document.getElementById("sectionTopping");
const sectionTaburan = document.getElementById("sectionTaburan");

// Wrapper Single
const wrapperToppingSingle = document.getElementById("wrapperToppingSingle");

// Wrapper Double
const wrapperToppingDouble = document.getElementById("wrapperToppingDouble");

/* ===========================================================
   FUNGSI UTAMA: TAMPIL / SEMBUNYIKAN TOPPING SESUAI MODE
=========================================================== */

function updateToppingDisplay() {
    const mode = getRadioValue("modeTopping");

    // Reset tampil/sembunyi
    sectionTopping.classList.add("hidden");
    wrapperToppingSingle.classList.add("hidden");
    wrapperToppingDouble.classList.add("hidden");
    sectionTaburan.classList.add("hidden");

    // Reset pilihan checkbox
    clearAllCheckbox("toppingSingle");
    clearAllCheckbox("toppingDouble");
    clearAllCheckbox("taburan");

    // === Mode NON TOPPING ===
    if (mode === "non") {
        return; // tidak menampilkan apa pun
    }

    // === Mode SINGLE TOPPING ===
    if (mode === "single") {
        sectionTopping.classList.remove("hidden");
        wrapperToppingSingle.classList.remove("hidden");
        sectionTaburan.classList.remove("hidden");
    }

    // === Mode DOUBLE TOPPING ===
    if (mode === "double") {
        sectionTopping.classList.remove("hidden");
        wrapperToppingSingle.classList.remove("hidden");
        wrapperToppingDouble.classList.remove("hidden");
        sectionTaburan.classList.remove("hidden");
    }
}

/* ===========================================================
   FUNGSI HELPERS
=========================================================== */

function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function clearAllCheckbox(className) {
    document.querySelectorAll(`.${className}`).forEach(cb => {
        cb.checked = false;
    });
}

/* ===========================================================
   EVENT LISTENERS UTAMA
=========================================================== */

// Perubahan mode topping
document.querySelectorAll('input[name="modeTopping"]').forEach(radio => {
    radio.addEventListener("change", () => {
        updateToppingDisplay();
        hitungSubtotal();
    });
});

// Perubahan jenis pukis / isi box
document.querySelectorAll('input[name="jenisPukis"], input[name="isiPerBox"]').forEach(radio => {
    radio.addEventListener("change", () => {
        hitungSubtotal();
    });
});

// Perubahan taburan
document.querySelectorAll(".taburan").forEach(cb => {
    cb.addEventListener("change", () => {
        hitungSubtotal();
    });
});

// Perubahan topping (single/double hanya untuk display, tidak mempengaruhi harga)
document.querySelectorAll(".toppingSingle, .toppingDouble").forEach(cb => {
    cb.addEventListener("change", () => {
        // Tidak mempengaruhi harga → tidak menghitung ulang
    });
});

/* ===========================================================
   HITUNG HARGA (TETAP • TIDAK DIUBAH)
=========================================================== */

function hitungHarga() {
    const jenis = getRadioValue("jenisPukis");
    const isi = getRadioValue("isiPerBox");
    const mode = getRadioValue("modeTopping");

    let hargaBox = 0;

    // Harga dasar PUKIS
    if (jenis === "original") {
        if (isi === "5") hargaBox = hargaOriginal5;
        if (isi === "10") hargaBox = hargaOriginal10;
    } else if (jenis === "pandan") {
        if (isi === "5") hargaBox = hargaPandan5;
        if (isi === "10") hargaBox = hargaPandan10;
    }

    // Harga topping
    if (mode === "single") hargaBox += hargaToppingSingle;
    if (mode === "double") hargaBox += hargaToppingDouble;

    // Harga taburan (optional)
    const tab = getRadioValue("taburan");
    if (tab && mode !== "non") {
        hargaBox += hargaTaburan;
    }

    return hargaBox;
}

/* ===========================================================
   HITUNG SUBTOTAL (TIDAK DIUBAH)
=========================================================== */

function hitungSubtotal() {
    const qty = parseInt(document.getElementById("jumlahBox").value) || 1;
    const hargaBox = hitungHarga();
    const subtotal = qty * hargaBox;

    document.getElementById("hargaPerBox").innerText = hargaBox.toLocaleString();
    document.getElementById("subtotal").innerText = subtotal.toLocaleString();

    hitungTotal();
}

/* ===========================================================
   TOTAL BAYAR (TIDAK DIUBAH)
=========================================================== */

function hitungTotal() {
    const subtotal = parseInt(document.getElementById("subtotal").innerText.replace(/\./g, "")) || 0;
    const total = subtotal;

    document.getElementById("totalBayar").innerText = total.toLocaleString();
}

/* ===========================================================
   INIT
=========================================================== */

updateToppingDisplay();
hitungSubtotal();
