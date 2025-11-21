// ================= order.js – Bagian 1 =================
document.addEventListener("DOMContentLoaded", () => {
    // === Helper ===
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    const formatRp = n => "Rp" + n.toLocaleString('id-ID');
    const BASE_PRICE = {
        "Original": { 5: 15000, 10: 28000 },
        "Pandan": { 5: 16000, 10: 30000 }
    };
    const TOPPING_EXTRA = { "non": 0, "single": 2000, "double": 4000 };
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
    }

    $$('input[name="ultraToppingMode"]').forEach(r => {
        r.addEventListener("change", () => {
            updateToppingDisplay();
            calculatePrice();
        });
    });

    updateToppingDisplay();

    // ====== Maksimal 5 topping ======
    $$('input.ultraSingle, input.ultraDouble').forEach(cb => {
        cb.addEventListener("change", () => {
            const mode = getSelectedRadioValue("ultraToppingMode");
            let checkboxes;
            if (mode === "single") {
                checkboxes = $$('input.ultraSingle');
            } else if (mode === "double") {
                checkboxes = $$('input.ultraDouble');
            } else {
                return; // Tidak ada batasan jika mode "non"
            }
            const checked = Array.from(checkboxes).filter(c => c.checked);
            if (checked.length > 5) {
                cb.checked = false; // Batalkan pilihan jika lebih dari 5
                alert("Maksimal 5 topping/taburan yang dapat dipilih.");
            }
            calculatePrice();
        });
    });

    // ====== HITUNG HARGA ======
    function calculatePrice() {
        const jenis = getSelectedRadioValue("ultraJenis") || "Original";
        const isi = parseInt(ultraIsi.value || 5);
        const mode = getSelectedRadioValue("ultraToppingMode") || "non";
        const jumlahBox = parseInt(ultraJumlah.value || 1);

        // Harga dasar per box
        let pricePerBox = BASE_PRICE[jenis][isi] || 0;

        // Tambahan topping
        pricePerBox += TOPPING_EXTRA[mode] || 0;
        const subtotal = pricePerBox * jumlahBox;
        const discount = 0;
        const total = subtotal - discount;

        ultraPricePerBox.textContent = formatRp(pricePerBox);
        ultraSubtotal.textContent = formatRp(subtotal);
        ultraDiscount.textContent = discount > 0 ? formatRp(discount) : "-";
        ultraGrandTotal.textContent = formatRp(total);

        return { jenis, isi, mode, pricePerBox, subtotal, discount, total, jumlahBox };
    }

    // ====== UPDATE HARGA OTOMATIS ======
    ultraIsi.addEventListener("change", calculatePrice);
    ultraJumlah.addEventListener("input", calculatePrice);
    $$('input[name="ultraJenis"]').forEach(r => r.addEventListener("change", calculatePrice));

    calculatePrice();

    // ================= order.js – Bagian 2 =================
    // ====== POPUP NOTA ======
    function generateNota() {
        const data = calculatePrice();
        const nama = ultraNama.value.trim() || "-";
        const wa = ultraWA.value.trim() || "-";
        let toppingSelected = [];
        if (data.mode === "single") {
            toppingSelected = getCheckedValues('input.ultraSingle');
        } else if (data.mode === "double") {
            toppingSelected = getCheckedValues('input.ultraDouble');
        }
        let toppingText = toppingSelected.length > 0 ? toppingSelected.join(", ") : "-"; // Tambahkan spasi setelah koma

        let html = `<p><strong>Nama:</strong> ${nama}</p>
                    <p><strong>Nomor WA:</strong> ${wa}</p>
                    <p><strong>Jenis Pukis:</strong> ${data.jenis}</p>
                    <p><strong>Isi per Box:</strong> ${data.isi} pcs</p>
                    <p><strong>Topping/Taburan:</strong> ${toppingText}</p>
                    <p><strong>Jumlah Box:</strong> ${data.jumlahBox}</p>
                    <hr>
                    <p><strong>Harga per Box:</strong> ${formatRp(data.pricePerBox)}</p>
                    <p><strong>Subtotal:</strong> ${formatRp(data.subtotal)}</p>
                    <p><strong>Diskon:</strong> ${data.discount > 0 ? formatRp(data.discount) : "-"}</p>
                    <p><strong>Total Bayar:</strong> ${formatRp(data.total)}</p>`;
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
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Nota Pemesanan Pukis Lumer Aulia", 14, 14);

        // Menggunakan autoTable untuk membuat tabel dari HTML
        doc.autoTable({
            html: '#notaContent',
            startY: 20,
            theme: 'grid', // Opsi tema: 'striped', 'grid', 'plain', 'css'
            styles: {
                fontSize: 9,
            },
            headerStyles: {
                fillColor: [214, 51, 108], // Warna pink: #d6336c
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
        });
        doc.save(`nota-pemesanan-${Date.now()}.pdf`);
    });

    // ====== Kirim WA Admin ======
    notaSendAdmin.addEventListener("click", () => {
        const data = calculatePrice();
        const nama = ultraNama.value.trim() || "-";
        const wa = ultraWA.value.trim() || "-";
        let toppingSelected = [];
        if (data.mode === "single") {
            toppingSelected = getCheckedValues('input.ultraSingle');
        } else if (data.mode === "double") {
            toppingSelected = getCheckedValues('input.ultraDouble');
        }
        let toppingText = toppingSelected.length > 0 ? toppingSelected.join(", ") : "-"; // Tambahkan spasi setelah koma

        let msg = `Halo! Saya ingin memesan Pukis:\\n` +
            `Nama: ${nama}\\n` +
            `Jenis: ${data.jenis}\\n` +
            `Topping: ${toppingText}\\n` +
            `Isi per Box: ${data.isi} pcs\\n` +
            `Jumlah Box: ${data.jumlahBox} box\\n` +
            `Harga: ${formatRp(data.total)}`;

        const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
    });
}); // end DOMContentLoaded
                                   
