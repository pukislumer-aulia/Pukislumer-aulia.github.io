/* assets/js/order.js — Main script for order form and nota popup */

document.addEventListener("DOMContentLoaded", () => {
    /* -------------------------------------------------------------
       ELEMENT REFERENCES
    ------------------------------------------------------------- */
    const namaEl = document.getElementById("ultraNama");
    const waEl = document.getElementById("ultraWA");
    const jenisEls = document.querySelectorAll("input[name='ultraJenis']");
    const isiEl = document.getElementById("ultraIsi");
    const toppingModeEls = document.querySelectorAll("input[name='ultraToppingMode']");
    const singleGroup = document.getElementById("ultraSingleGroup");
    const doubleGroup = document.getElementById("ultraDoubleGroup");
    const noteEl = document.getElementById("ultraNote");
    const jumlahEl = document.getElementById("ultraJumlah");

    const pricePerBoxEl = document.getElementById("ultraPricePerBox");
    const subtotalEl = document.getElementById("ultraSubtotal");
    const discountEl = document.getElementById("ultraDiscount");
    const grandEl = document.getElementById("ultraGrandTotal");

    const formUltra = document.getElementById("formUltra");

    const notaPopup = document.getElementById("notaContainer");
    const notaContent = document.getElementById("notaContent");
    const notaClose = document.getElementById("notaClose");
    const notaPrint = document.getElementById("notaPrint");
    const notaWAAdmin = document.getElementById("notaWAAdmin");

    const sendAdminBtn = document.getElementById("ultraSendAdmin");

    /* -------------------------------------------------------------
       DATA & CONFIG
    ------------------------------------------------------------- */
    // [Array: Jenis Pukis]
    const jenisPukisList = [{
            id: 'original',
            name: 'Original',
            basePrice5: 10000,
            basePrice10: 18000
        },
        {
            id: 'pandan',
            name: 'Pandan',
            basePrice5: 12000,
            basePrice10: 21000
        }
    ];

    // [Array: Mode Topping]
    const modeToppingList = [{
            id: 'non',
            name: 'Non',
            priceAdd: 0
        },
        {
            id: 'single',
            name: 'Single',
            priceAdd: 2000
        },
        {
            id: 'double',
            name: 'Double',
            priceAdd: 4000
        }
    ];

    // [Array: Single Topping]
    const singleToppings = [
        "Vanilla", "Keju", "Chocolate", "Red Velvet",
        "Oreo", "Matcha", "Strawberry", "Blueberry"
    ];

    // [Array: Double Topping]
    const doubleToppings = [
        "Vanilla", "Keju", "Chocolate", "Oreo",
        "Strawberry", "Kacang", "Meses", "Matcha"
    ];

    /* -------------------------------------------------------------
       FUNCTION: Price Calculate
    ------------------------------------------------------------- */
    function calculatePrice() {
        // [Variable: Get Selected Data]
        const jenisId = document.querySelector("input[name='ultraJenis']:checked").value;
        const isi = parseInt(isiEl.value);
        const jumlah = parseInt(jumlahEl.value) || 1;
        const modeId = document.querySelector("input[name='ultraToppingMode']:checked").value;

        // [Object: Get Selected Jenis Pukis]
        const jenis = jenisPukisList.find(j => j.id === jenisId);

        // [Object: Get Selected Mode Topping]
        const mode = modeToppingList.find(m => m.id === modeId);

        // [Variable: Get Base Price]
        let price = isi === 5 ? jenis.basePrice5 : jenis.basePrice10;

        // [Variable: Add Mode Topping Price]
        price += mode.priceAdd;

        // [Variable: Calculate Subtotal]
        const subtotal = price * jumlah;

        // [Variable: Setup Discount]
        let discount = 0;
        if (jumlah >= 5) discount = subtotal * 0.10; // Diskon 10%

        // [Variable: Grand Total]
        const grand = subtotal - discount;

        // [UI: Set Price Data]
        pricePerBoxEl.textContent = formatRupiah(price);
        subtotalEl.textContent = formatRupiah(subtotal);
        discountEl.textContent = discount > 0 ? formatRupiah(discount) : "-";
        grandEl.textContent = formatRupiah(grand);
    }

    /* -------------------------------------------------------------
       FUNCTION: Rupiah Formatter
    ------------------------------------------------------------- */
    function formatRupiah(num) {
        return "Rp" + num.toLocaleString("id-ID");
    }

    /* -------------------------------------------------------------
       FUNCTION: Gen Nota
    ------------------------------------------------------------- */
    function generateNotaHTML(data) {
        return `
      <p><strong>Nama:</strong> ${data.nama}</p>
      <p><strong>WhatsApp:</strong> ${data.wa}</p>
      <p><strong>Jenis:</strong> ${data.jenis}</p>
      <p><strong>Isi:</strong> ${data.isi} pcs</p>
      <p><strong>Mode Topping:</strong> ${data.mode}</p>
      <p><strong>Topping:</strong> ${data.topping.join(", ") || "-"}</p>
      <p><strong>Catatan:</strong> ${data.note || "-"}</p>
      <p><strong>Jumlah Box:</strong> ${data.jumlah}</p>
      <hr>
      <p><strong>Total Bayar:</strong> ${formatRupiah(data.total)}</p>
    `;
    }

    /* -------------------------------------------------------------
       BUILD TOPPING CHECKBOX
    ------------------------------------------------------------- */
    // [FUNCTION] Build Topping List UI
    function buildToppingList(list, target) {
        target.innerHTML = "";
        list.forEach(item => {
            const lbl = document.createElement("label");
            lbl.innerHTML = `<input type="checkbox" value="${item}"> ${item}`;
            target.appendChild(lbl);
        });
    }

    // [FUNCTION] Update UI Topping Mode
    function updateToppingMode() {
        const mode = document.querySelector("input[name='ultraToppingMode']:checked").value;

        singleGroup.style.display = mode === "single" ? "flex" : "none";
        doubleGroup.style.display = mode === "double" ? "flex" : "none";
    }

    /* -------------------------------------------------------------
       EVENT: Form Submit
    ------------------------------------------------------------- */
    formUltra.addEventListener("submit", (e) => {
        e.preventDefault();

        // [Variable: Get Form Data]
        const nama = namaEl.value.trim();
        const wa = waEl.value.trim();
        const jenisId = document.querySelector("input[name='ultraJenis']:checked").value;
        const jenis = jenisPukisList.find(j => j.id === jenisId).name;

        const isi = parseInt(isiEl.value);
        const modeId = document.querySelector("input[name='ultraToppingMode']:checked").value;
        const mode = modeToppingList.find(m => m.id === modeId).name;

        const topping = [
            ...singleGroup.querySelectorAll("input:checked"),
            ...doubleGroup.querySelectorAll("input:checked")
        ].map(x => x.value);

        const note = noteEl.value.trim();
        const jumlah = parseInt(jumlahEl.value);
        const total = parseInt(grandEl.textContent.replace(/[Rp. ]/g, "")) || 0;

        // Tambahkan Validasi Disini
        if (!nama) {
            alert("Nama harus diisi.");
            namaEl.focus();
            return;
        }

        if (!wa) {
            alert("Nomor WhatsApp harus diisi.");
            waEl.focus();
            return;
        }

        // [Object: Mapping Form Data]
        const data = {
            nama,
            wa,
            jenis,
            isi,
            mode,
            topping,
            note,
            jumlah,
            total
        };

        // [UI: Set inner HTML content with generateNotaHTML function ]
        notaContent.innerHTML = generateNotaHTML(data);

        notaPopup.classList.add("show");
    });

    /* -------------------------------------------------------------
       EVENT: Close Popup
    ------------------------------------------------------------- */
    notaClose.addEventListener("click", () => {
        notaPopup.classList.remove("show");
    });

    /* -------------------------------------------------------------
       EVENT: Send to Whatsapp
    ------------------------------------------------------------- */
    sendAdminBtn.addEventListener("click", () => {
        /* this button sends blank — only after confirm */
        alert("Buat nota dulu agar pesan lengkap 🙏");
    });

    /* -------------------------------------------------------------
       EVENT: Wa Share with included data
    ------------------------------------------------------------- */
    notaWAAdmin.addEventListener("click", () => {
        // [Variable: Get Form Data]
        const nama = namaEl.value.trim();
        const wa = waEl.value.trim();
        const jenisId = document.querySelector("input[name='ultraJenis']:checked").value;
        const jenis = jenisPukisList.find(j => j.id === jenisId).name;

        const isi = parseInt(isiEl.value);
        const modeId = document.querySelector("input[name='ultraToppingMode']:checked").value;
        const mode = modeToppingList.find(m => m.id === modeId).name;

        const topping = [
            ...singleGroup.querySelectorAll("input:checked"),
            ...doubleGroup.querySelectorAll("input:checked")
        ].map(x => x.value);

        const note = noteEl.value.trim();
        const jumlah = parseInt(jumlahEl.value);
        const total = parseInt(grandEl.textContent.replace(/[Rp. ]/g, "")) || 0;

        // [Object: Mapping Form Data]
        const data = {
            nama,
            wa,
            jenis,
            isi,
            mode,
            topping,
            note,
            jumlah,
            total
        };
        sendToWhatsApp(data);
    });

    /* -------------------------------------------------------------
       FUNCTION: Send Whatsapp With Data
    ------------------------------------------------------------- */
    function sendToWhatsApp(data) {
        const ADMIN_WA = "6281296668670";
        const msg =
            `Halo Admin, saya ingin konfirmasi pesanan:

  Nama: ${data.nama}
  WA: ${data.wa}
  Jenis: ${data.jenis}
  Isi: ${data.isi} pcs
  Mode: ${data.mode}
  Topping: ${data.topping.join(", ") || "-"}
  Catatan: ${data.note || "-"}
  Jumlah Box: ${data.jumlah}
  Total Bayar: ${formatRupiah(data.total)}

  Mohon diproses ya 🙏`;

        const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
    }

    /* -------------------------------------------------------------
       EVENT: Gen PDF
    ------------------------------------------------------------- */
    notaPrint.addEventListener("click", () => {
        const {
            jsPDF
        } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(14);
        doc.text("Nota Pemesanan Pukis Lumer Aulia", 14, 14);

        let y = 26;
        const lines = notaContent.innerText.split("\n");

        lines.forEach(line => {
            doc.text(line, 14, y);
            y += 8;
        });

        doc.save("nota-pesan.pdf");
    });

    /* -------------------------------------------------------------
       INIT SECTION:
    ------------------------------------------------------------- */
    // [UI: Load Topping List]
    buildToppingList(singleToppings, singleGroup);
    buildToppingList(doubleToppings, doubleGroup);

    // [UI: Load Topping Mode Section]
    toppingModeEls.forEach(el => el.addEventListener("change", updateToppingMode));
    updateToppingMode();

    // [CALC: Auto calculate price when change]
    [isiEl, jumlahEl, ...toppingModeEls].forEach(el => el.addEventListener("change", calculatePrice));
    calculatePrice();
});
