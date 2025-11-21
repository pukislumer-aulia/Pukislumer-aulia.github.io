// ================= order.js – Bagian 1 =================
document.addEventListener("DOMContentLoaded", () => {
    // === Helper ===
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    const formatRp = n => "Rp" + n.toLocaleString('id-ID');

    const BASE_PRICE = {
        "Original": {
            "5": { "non": 10000, "single": 13000, "double": 15000 },
            "10": { "non": 18000, "single": 25000, "double": 28000 }
        },
        "Pandan": {
            "5": { "non": 13000, "single": 15000, "double": 18000 },
            "10": { "non": 25000, "single": 28000, "double": 32000 }
        }
    };

    const ADMIN_WA = "6281296668670";
    const ultraNama = $("#ultraNama");
    const ultraWA = $("#ultraWA");
    const ultraIsi = $("#ultraIsi");
    const ultraJumlah = $("#ultraJumlah");
    const ultraPricePerBox = $("#ultraPricePerBox");
    const ultraSubtotal = $("#ultraSubtotal");
    const ultraDiscount = $("#ultraDiscount");
    const ultraGrandTotal = $("#ultraGrandTotal");
    const formUltra = $("#formUltra");
    const ultraSingleGroup = $("#ultraSingleGroup");
    const ultraDoubleGroup = $("#ultraDoubleGroup");
    const notaContainer = $("#notaContainer");
    const notaBox = $("#notaBox");
    const notaContent = $("#notaContent");
    const notaClose = $("#notaClose");
    const notaPrint = $("#notaPrint");
    const notaSendAdmin = $("#notaSendAdmin");

    let dataPesanan = {}; // Menyimpan data pesanan

    function getSelectedRadioValue(name) {
        const r = document.querySelector(`input[name="${name}"]:checked`);
        return r ? r.value : null;
    }

    function getCheckedValues(selector) {
        return Array.from(document.querySelectorAll(selector))
            .filter(c => c.checked)
            .map(c => c.value);
    }

    // ====== Topping Mode ======
    function updateToppingDisplay() {
        const mode = getSelectedRadioValue("ultraToppingMode");
        ultraSingleGroup.style.display = (mode === "single") ? "block" : "none";
        ultraDoubleGroup.style.display = (mode === "double") ? "block" : "none";

        // reset checkbox
        $$('input.ultraSingle').forEach(cb => cb.checked = false);
        $$('input.ultraDouble').forEach(cb => cb.checked = false);

        calculatePrice(); // Update harga saat topping mode berubah
    }

    $$('input[name="ultraToppingMode"]').forEach(r => {
        r.addEventListener("change", () => {
            updateToppingDisplay();
            calculatePrice();
        });
    });

    updateToppingDisplay();

    // ====== Maksimal 5 topping/taburan per jenis ======
    $$('input.ultraSingle, input.ultraDouble').forEach(cb => {
        cb.addEventListener("change", () => {
            const mode = getSelectedRadioValue("ultraToppingMode");
            if (mode === "double") {
                const checkedTopping = Array.from($$('input.ultraSingle')).filter(c => c.checked);
                const checkedTaburan = Array.from($$('input.ultraDouble')).filter(c => c.checked);

                if (checkedTopping.length > 5) {
                    cb.checked = false;
                    alert("Maksimal 5 topping yang dapat dipilih.");
                    return;
                }

                if (checkedTaburan.length > 5) {
                    cb.checked = false;
                    alert("Maksimal 5 taburan yang dapat dipilih.");
                    return;
                }
            } else if (mode === "single") {
                const checkedTopping = Array.from($$('input.ultraSingle')).filter(c => c.checked);
                if (checkedTopping.length > 5) {
                    cb.checked = false;
                    alert("Maksimal 5 topping yang dapat dipilih.");
                    return;
                }
            }
            calculatePrice();
        });
    });

    // ====== HITUNG HARGA ======
    function calculatePrice() {
        const jenis = getSelectedRadioValue("ultraJenis") || "Original";
        const isi = ultraIsi.value || "5";
        const mode = getSelectedRadioValue("ultraToppingMode") || "non";
        const jumlahBox = parseInt(ultraJumlah.value || 1);

        let pricePerBox = BASE_PRICE[jenis][isi][mode];

        const subtotal = pricePerBox * jumlahBox;
        const discount = 0;
        const total = subtotal - discount;

        ultraPricePerBox.textContent = formatRp(pricePerBox);
        ultraSubtotal.textContent = formatRp(subtotal);
        ultraDiscount.textContent = discount > 0 ? formatRp(discount) : "-";
        ultraGrandTotal.textContent = formatRp(total);

        // Simpan data pesanan
        dataPesanan = {
            nama: ultraNama.value.trim() || "-",
            wa: ultraWA.value.trim() || "-",
            jenis: jenis,
            isi: isi,
            mode: mode,
            topping: getCheckedValues('input.ultraSingle'),
            taburan: getCheckedValues('input.ultraDouble'),
            jumlahBox: jumlahBox,
            pricePerBox: pricePerBox,
            subtotal: subtotal,
            discount: discount,
            total: total
        };
    }

    // ====== UPDATE HARGA OTOMATIS ======
    ultraIsi.addEventListener("change", calculatePrice);
    ultraJumlah.addEventListener("input", calculatePrice);
    $$('input[name="ultraJenis"]').forEach(r => r.addEventListener("change", calculatePrice));

    calculatePrice();

    // ================= order.js – Bagian 2 =================
    // ====== POPUP NOTA ======
    function generateNota() {
        const {
            nama,
            wa,
            jenis,
            isi,
            mode,
            topping,
            taburan,
            jumlahBox,
            pricePerBox,
            subtotal,
            discount,
            total
        } = dataPesanan;

        let toppingText = topping.length > 0 ? topping.join(", ") : "-";
        let taburanText = taburan.length > 0 ? taburan.join(", ") : "-";

        let html = `<p><strong>Nama:</strong> ${nama}</p>
                    <p><strong>Nomor WA:</strong> ${wa}</p>
                    <p><strong>Jenis Pukis:</strong> ${jenis}</p>
                    <p><strong>Isi per Box:</strong> ${isi} pcs</p>
                    ${mode === "double" ? `<p><strong>Topping:</strong> ${toppingText}</p><p><strong>Taburan:</strong> ${taburanText}</p>` : mode === "single" ? `<p><strong>Topping:</strong> ${toppingText}</p>` : ''}
                    <p><strong>Jumlah Box:</strong> ${jumlahBox}</p>
                    <hr>
                    <p><strong>Harga per Box:</strong> ${formatRp(pricePerBox)}</p>
                    <p><strong>Subtotal:</strong> ${formatRp(subtotal)}</p>
                    <p><strong>Diskon:</strong> ${discount > 0 ? formatRp(discount) : "-"}</p>
                    <p><strong>Total Bayar:</strong> ${formatRp(total)}</p>`;

        notaContent.innerHTML = html;
    }

    // ====== Buka Popup ======
    formUltra.addEventListener("submit", (e) => {
        e.preventDefault();
        generateNota();
        notaContainer.style.display = "flex";
    });

    // ====== Tutup Popup ======
    notaClose.addEventListener("click", () => notaContainer.style.display = "none");

    // ====== Cetak / Download PDF ======
    notaPrint.addEventListener("click", () => {
        const {
            nama,
            wa,
            jenis,
            isi,
            mode,
            topping,
            taburan,
            jumlahBox,
            pricePerBox,
            subtotal,
            discount,
            total
        } = dataPesanan;

        let toppingText = topping.length > 0 ? topping.join(", ") : "-";
        let taburanText = taburan.length > 0 ? taburan.join(", ") : "-";

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Nota Pemesanan Pukis Lumer Aulia", 14, 14);

        const tableData = [
            ["Nama", nama],
            ["Nomor WA", wa],
            ["Jenis Pukis", jenis],
            ["Isi per Box", `${isi} pcs`],
            ...(mode === "double" ? [
                ["Topping", toppingText],
                ["Taburan", taburanText]
            ] : mode === "single" ? [
                ["Topping", toppingText]
            ] : []),
            ["Jumlah Box", jumlahBox],
            ["Harga per Box", formatRp(pricePerBox)],
            ["Subtotal", formatRp(subtotal)],
            ["Diskon", discount > 0 ? formatRp(discount) : "-"],
            ["Total Bayar", formatRp(total)]
        ];

        doc.autoTable({
            body: tableData,
            startY: 20,
            theme: 'grid',
            styles: {
                fontSize: 9,
            },
            headerStyles: {
                fillColor: [214, 51, 108],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
        });
        doc.save(`nota-pemesanan-${Date.now()}.pdf`);
    });

    // ====== Kirim WA Admin ======
    notaSendAdmin.addEventListener("click", () => {
        const {
            nama,
            wa,
            jenis,
            isi,
            mode,
            topping,
            taburan,
            jumlahBox,
            total
        } = dataPesanan;

        let toppingText = topping.length > 0 ? topping.join(", ") : "-";
        let taburanText = taburan.length > 0 ? taburan.join(", ") : "-";

        let msg = `Halo! Saya ingin memesan Pukis:\\n` +
            `Nama: ${nama}\\n` +
            `Jenis: ${jenis}\\n` +
            `${mode === "double" ? `Topping: ${toppingText}\\nTaburan: ${taburanText}\\n` : mode === "single" ? `Topping: ${toppingText}\\n` : ''}` +
            `Isi per Box: ${isi} pcs\\n` +
            `Jumlah Box: ${jumlahBox} box\\n` +
            `Harga: ${formatRp(total)}\\n` +
            `\\n` +
            `Jenis Pukis:\\n` +
            `1. Original\\n` +
            `2. Pandan\\n` +
            `Topping:\\n` +
            `a. Non Topping\\n` +
            `b. Single Topping, bisa pilih maksimal 5 Topping (coklat, tiramisu, vanilla, stroberi, cappucino)\\n` +
            `c. Duoble topping, bisa pilih maksimal 5 Topping single (coklat, tiramisu, vanilla, stroberi, cappucino) dan sekaligus bisa pilih maksimal 5 taburan (meses, keju, kacang, choco chip, Oreo)\\n` +
            `Harga sesuai isi per Box:\\n` +
            `Original:\\n` +
            `box kecil Non topping = 10.000\\n` +
            `box kecil single topping = 13.000\\n` +
            `box kecil duoble topping = 15.000\\n` +
            `Box besar Non Topping = 18.000\\n` +
            `Box besar single topping = 25.000\\n` +
            `Box besar duoble topping = 28.000\\n` +
            `Pandan:\\n` +
            `box kecil Non topping = 13.000\\n` +
            `box kecil single topping = 15.000\\n` +
            `box kecil duoble topping = 18.000\\n` +
            `Box besar Non Topping = 25.000\\n` +
            `Box besar single topping = 28.000\\n` +
            `Box besar duoble topping = 32.000`;

        const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
    });
}); // end DOMContentLoaded
