// ================= order.js =================
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
        $$('.ultraSingleTopping').forEach(cb => cb.checked = false);
        $$('.ultraDoubleTopping').forEach(cb => cb.checked = false);
        $$('.ultraTaburan').forEach(cb => cb.checked = false);

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
    function toppingTaburanHandler(event) {
        const mode = getSelectedRadioValue("ultraToppingMode");
        const checkedSingleTopping = getCheckedValues('.ultraSingleTopping');
        const checkedDoubleTopping = getCheckedValues('.ultraDoubleTopping');
        const checkedTaburan = getCheckedValues('.ultraTaburan');

        if (mode === "double") {
            if (checkedDoubleTopping.length > 5 && event.target.classList.contains('ultraDoubleTopping')) {
                event.target.checked = false;
                alert("Maksimal 5 topping yang dapat dipilih.");
                return;
            }
            if (checkedTaburan.length > 5 && event.target.classList.contains('ultraTaburan')) {
                event.target.checked = false;
                alert("Maksimal 5 taburan yang dapat dipilih.");
                return;
            }
        } else if (mode === "single") {
            if (checkedSingleTopping.length > 5 && event.target.classList.contains('ultraSingleTopping')) {
                event.target.checked = false;
                alert("Maksimal 5 topping yang dapat dipilih.");
                return;
            }
        }
        calculatePrice();
    }

    $$('.ultraSingleTopping, .ultraDoubleTopping, .ultraTaburan').forEach(cb => {
        cb.addEventListener("change", toppingTaburanHandler);
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
            topping: mode === "single" ? getCheckedValues('.ultraSingleTopping') : getCheckedValues('.ultraDoubleTopping'),
            taburan: mode === "double" ? getCheckedValues('.ultraTaburan') : [],
            jumlahBox: jumlahBox,
            pricePerBox: pricePerBox,
            subtotal: subtotal,
            discount: discount,
            total: total,
            logo: "assets/images/logo_png", // Path ke logo
            ttd: "assets/images/ttd.png" // Path ke tanda tangan digital
        };
    }

    // ====== UPDATE HARGA OTOMATIS ======
    ultraIsi.addEventListener("change", calculatePrice);
    ultraJumlah.addEventListener("input", calculatePrice);
    $$('input[name="ultraJenis"]').forEach(r => r.addEventListener("change", calculatePrice));
    $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener("change", calculatePrice));

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

        // Contoh implementasi dengan jsPDF (perlu penyesuaian lebih lanjut)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Fungsi untuk menambahkan gambar dengan promise
        function addImageToDoc(doc, imgUrl, x, y, width, height) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous"; // Penting untuk mengatasi masalah CORS
                img.onload = () => {
                    doc.addImage(img, 'PNG', x, y, width, height);
                    resolve();
                };
                img.onerror = (error) => {
                    console.error("Gagal memuat gambar:", imgUrl, error);
                    reject(error);
                };
                img.src = imgUrl;
            });
        }

        // Tambah logo
        addImageToDoc(doc, notaData.logo, 14, 14, 50, 15)
            .then(() => {
                // Tambah watermark
                return addImageToDoc(doc, 'assets/images/watermark-emas.png', doc.internal.pageSize.getWidth() / 2 - 75, doc.internal.pageSize.getHeight() / 2 - 75, 150, 150);
            })
            .then(() => {
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
                const finalY = doc.autoTable.previous.finalY; // Mendapatkan posisi Y terakhir dari tabel
                return addImageToDoc(doc, notaData.ttd, 14, finalY + 10, 50, 15);
            })
            .then(() => {
                doc.save(`nota-pemesanan-${Date.now()}.pdf`);
            })
            .catch(error => {
                console.error("Terjadi kesalahan dalam pembuatan PDF:", error);
                alert("Terjadi kesalahan dalam pembuatan PDF. Silakan coba lagi.");
            });
    }
}); // end DOMContentLoaded
