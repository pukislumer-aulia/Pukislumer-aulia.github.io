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

        // Validasi harga per box
        if (!pricePerBox) {
            console.error("Harga tidak valid untuk kombinasi jenis, isi, dan mode yang dipilih.");
            ultraPricePerBox.textContent = "Rp0";
            ultraSubtotal.textContent = "Rp0";
            ultraDiscount.textContent = "-";
            ultraGrandTotal.textContent = "Rp0";
            return;
        }

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
            logo,
            ttd
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
            logo: logo,
            ttd: ttd
        };

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
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Fungsi untuk menambahkan gambar dengan promise
        function addImageToDoc(doc, imgUrl, x, y, width, height) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
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

        // Header Invoice
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 14, 20);

        // Logo
        addImageToDoc(doc, notaData.logo, 14, 25, 50, 15)
            .then(() => {
                //Informasi Toko
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('SALFORD & CO.', 14, 45);
                doc.text('Fashion Terlengkap', 14, 50);

                // Tanggal & No Invoice
                doc.setFontSize(10);
                doc.text('TANGGAL:', 140, 20);
                doc.text(new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }), 140, 25);
                doc.text('NO INVOICE:', 140, 35);
                doc.text(`1 ${new Date().toLocaleDateString('dd/MM/yyyy')}`, 140, 40);

                // Kepada
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('KEPADA:', 14, 60);
                doc.setFont('helvetica', 'normal');
                doc.text(notaData.nama, 14, 65);
                doc.text(notaData.wa, 14, 70);

                //Header Table
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('KETERANGAN', 14, 80);
                doc.text('HARGA', 70, 80);
                doc.text('JML', 100, 80);
