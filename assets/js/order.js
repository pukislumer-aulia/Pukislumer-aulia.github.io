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
    const notaSendAdmin = $("#ultraSendAdmin");

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
        $$('#ultraSingleGroup input[type="checkbox"]').forEach(cb => cb.checked = false);
        $$('#ultraDoubleGroup input[type="checkbox"]').forEach(cb => cb.checked = false);

        calculatePrice(); // Update harga saat topping mode berubah
    }

    $$('input[name="ultraToppingMode"]').forEach(r => {
        r.addEventListener("change", () => {
            updateToppingDisplay();
            calculatePrice();
        });
    });

    updateToppingDisplay();

    // ====== Maksimal 5 topping dan 5 taburan ======
    $$('#ultraSingleGroup input[type="checkbox"], #ultraDoubleGroup input[type="checkbox"]').forEach(cb => {
        cb.addEventListener("change", () => {
            const checkedSingleTopping = getCheckedValues('#ultraSingleGroup input[name="singleTopping"]');
            const checkedDoubleTopping = getCheckedValues('#ultraDoubleGroup input[name="doubleTopping"]');
            const checkedTaburan = getCheckedValues('#ultraDoubleGroup input[name="taburan"]');
            const mode = getSelectedRadioValue("ultraToppingMode");

            if (mode === "double") {
                if (checkedDoubleTopping.length > 5) {
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
                if (checkedSingleTopping.length > 5) {
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
            topping: mode === "single" ? getCheckedValues('#ultraSingleGroup input[name="singleTopping"]') : getCheckedValues('#ultraDoubleGroup input[name="doubleTopping"]'),
            taburan: mode === "double" ? getCheckedValues('#ultraDoubleGroup input[name="taburan"]') : [],
            jumlahBox: jumlahBox,
            pricePerBox: pricePerBox,
            subtotal: subtotal,
            discount: discount,
            total: total,
            logo: "assets/images/logo_png", // Path ke logo
            ttd: "assets/ttd.png" // Path ke tanda tangan digital
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

    // ====== Cetak / Download PDF (Data Only) ======
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
            total,
            logo, // Ambil path logo dari dataPesanan
            ttd // Ambil path ttd dari dataPesanan
        } = dataPesanan;

        // Data nota
        const notaData = {
            nama: nama,
            wa: wa,
            jenis: jenis,
            isi: isi,
            mode: mode,
            topping: topping,
            taburan: taburan,
            jumlahBox: jumlahBox,
            pricePerBox: pricePerBox,
            subtotal: subtotal,
            discount: discount,
            total: total,
            logo: logo, // Gunakan path logo dari dataPesanan
            ttd: ttd // Gunakan path ttd dari dataPesanan
        };

        // Kirim data nota ke fungsi untuk menghasilkan PDF (perlu diimplementasikan dengan library PDF pilihan)
        generatePdf(notaData);
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
            `box besar single topping = 25.000\\n` +
            `box besar duoble topping = 28.000\\n` +
            `Pandan:\\n` +
            `box kecil Non topping = 13.000\\n` +
            `box kecil single topping = 15.000\\n` +
            `box kecil duoble topping = 18.000\\n` +
            `Box besar Non Topping = 25.000\\n` +
            `box besar single topping = 28.000\\n` +
            `box besar duoble topping = 32.000`;

        const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
    });

    // Fungsi untuk menghasilkan PDF dengan data nota (perlu diimplementasikan)
    function generatePdf(notaData) {
        console.log("Data nota untuk PDF:", notaData);
        alert("Fungsi generatePdf() perlu diimplementasikan dengan library PDF pilihan (jsPDF, PDFMake, dll.)");

        // Contoh implementasi dengan jsPDF (perlu penyesuaian lebih lanjut)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Tambah logo
        const img = new Image();
        img.src = notaData.logo;
        img.onload = function() {
            doc.addImage(img, 'PNG', 14, 14, 50, 15);

            // Tambah watermark
            // (Anda perlu menyediakan gambar watermark yang sesuai)
            const watermarkImg = new Image();
            watermarkImg.src = 'assets/images/watermark-emas.png'; // Ganti dengan path watermark Anda
            watermarkImg.onload = function() {
                // Dapatkan ukuran halaman PDF
                const pageSize = doc.internal.pageSize;
                const pageWidth = pageSize.getWidth();
                const pageHeight = pageSize.getHeight();

                // Tambah watermark di tengah halaman
                doc.addImage(watermarkImg, 'PNG', pageWidth / 2 - 75, pageHeight / 2 - 75, 150, 150);
                doc.setPage(1); // Kembali ke halaman pertama setelah menambahkan watermark

                // Data tabel
                const tableData = [
                    ["Nama", notaData.nama],
                    ["Nomor WA", notaData.wa],
                    ["Jenis Pukis", notaData.jenis],
                    ["Isi per Box", `${notaData.isi} pcs`],
                    ...(notaData.mode === "double" ? [
                        ["Topping", notaData.topping.join(", ")],
                        ["Taburan", notaData.taburan.join(", ")]
                    ] : notaData.mode === "single" ? [
                        ["Topping", notaData.topping.join(", ")]
                    ] : []),
                    ["Jumlah Box", notaData.jumlahBox],
                    ["Harga per Box", formatRp(notaData.pricePerBox)],
                    ["Subtotal", formatRp(notaData.subtotal)],
                    ["Diskon", notaData.discount > 0 ? formatRp(notaData.discount) : "-"],
                    ["Total Bayar", formatRp(notaData.total)]
                ];

                // Tambah tabel
                doc.autoTable({
                    body: tableData,
                    startY: 40,
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

                // Tambah tanda tangan digital
                const ttdImg = new Image();
                ttdImg.src = notaData.ttd;
                ttdImg.onload = function() {
                    const finalY = doc.autoTable.previous.finalY; // Mendapatkan posisi Y terakhir dari tabel
                    doc.addImage(ttdImg, 'PNG', 14, finalY + 10, 50, 15); // Tambah tanda tangan di bawah tabel

                    doc.save(`nota-pemesanan-${Date.now()}.pdf`);
                };
                ttdImg.onerror = function() {
                    console.error("Gagal memuat gambar tanda tangan digital.");
                    doc.save(`nota-pemesanan-${Date.now()}.pdf`);
                };
            };
            watermarkImg.onerror = function() {
                console.error("Gagal memuat gambar watermark.");
                doc.save(`nota-pemesanan-${Date.now()}.pdf`);
            };
        };
        img.onerror = function() {
            console.error("Gagal memuat gambar logo.");
            doc.save(`nota-pemesanan-${Date.now()}.pdf`);
        };
    }
}); // end DOMContentLoaded
