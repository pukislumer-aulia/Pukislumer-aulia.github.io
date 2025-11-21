// ================= order.js =================
document.addEventListener("DOMContentLoaded", () => {
    // === Helper ===
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    const formatRp = n => "Rp" + n.toLocaleString('id-ID');
    const BASE_PRICE = {
        "Original": {
            "5": {
                "non": 10000,
                "single": 13000,
                "double": 15000
            },
            "10": {
                "non": 18000,
                "single": 25000,
                "double": 28000
            }
        },
        "Pandan": {
            "5": {
                "non": 13000,
                "single": 15000,
                "double": 18000
            },
            "10": {
                "non": 25000,
                "single": 28000,
                "double": 32000
            }
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
        return Array.from(document.querySelectorAll(selector)).filter(c => c.checked).map(c => c.value);
    }

    // ====== Topping Mode ======
    function updateToppingDisplay() {
        const mode = getSelectedRadioValue("ultraToppingMode");
        ultraSingleGroup.style.display = (mode === "single") ? "block" : "none";
        ultraDoubleGroup.style.display = (mode === "double") ? "block" : "none";
        // reset checkbox
        $$('.ultraTopping').forEach(cb => cb.checked = false);
        $$('.ultraTaburan').forEach(cb => cb.checked = false);
        calculatePrice(); // Update harga saat topping mode berubah
    }

    Array.from($('input[name="ultraToppingMode"]')).forEach(r => {
        r.addEventListener("change", () => {
            updateToppingDisplay();
            calculatePrice();
        });
    });

    updateToppingDisplay();

    // ====== Maksimal 5 topping dan 5 taburan ======
    function toppingTaburanHandler(event) {
        const mode = getSelectedRadioValue("ultraToppingMode");
        const checkedTopping = getCheckedValues('.ultraTopping');
        const checkedTaburan = getCheckedValues('.ultraTaburan');

        if (mode === "double") {
            if (checkedTopping.length > 5 && event.target.classList.contains('ultraTopping')) {
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
            if (checkedTopping.length > 5 && event.target.classList.contains('ultraTopping')) {
                event.target.checked = false;
                alert("Maksimal 5 topping yang dapat dipilih.");
                return;
            }
        }
        calculatePrice();
    }

    Array.from($$('.ultraTopping, .ultraTaburan')).forEach(cb => {
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
            topping: getCheckedValues('.ultraTopping'),
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
    Array.from($('input[name="ultraJenis"]')).forEach(r => r.addEventListener("change", calculatePrice));
    Array.from($('input[name="ultraToppingMode"]')).forEach(r => r.addEventListener("change", calculatePrice));

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
        let html = `<p><strong>Nama:</strong> ${nama}</p><p><strong>Nomor WA:</strong> ${wa}</p><p><strong>Jenis Pukis:</strong> ${jenis}</p><p><strong>Isi per Box:</strong> ${isi} pcs</p>${mode === "double" ? `<p><strong>Topping:</strong> ${toppingText}</p><p><strong>Taburan:</strong> ${taburanText}</p>` : mode === "single" ? `<p><strong>Topping:</strong> ${toppingText}</p>` : ''}<p><strong>Jumlah Box:</strong> ${jumlahBox}</p><hr><p><strong>Harga per Box:</strong> ${formatRp(pricePerBox)}</p><p><strong>Subtotal:</strong> ${formatRp(subtotal)}</p><p><strong>Diskon:</strong> ${discount > 0 ? formatRp(discount) : "-"}</p><p><strong>Total Bayar:</strong> ${formatRp(total)}</p>`;
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
            Nama: nama,
            Wa: wa,
            Jenis: jenis,
            Isi: isi,
            Mode: mode,
            Topping: topping,
            Taburan: taburan,
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
        let msg = `Halo! Saya ingin memesan Pukis:\n` +
            `Nama: ${nama}\n` +
            `Jenis: ${jenis}\n` +
            `${mode === "double" ? `Topping: ${toppingText}\nTaburan: ${taburanText}\n` : mode === "single" ? `Topping: ${toppingText}\n` : ''}` +
            `Isi per Box: ${isi} pcs\n` +
            `Jumlah Box: ${jumlahBox} box\n` +
            `Harga: ${formatRp(total)}\n` +
            `\n` +
            `Jenis Pukis:\n` +
            `1. Original\n` +
            `2. Pandan\n` +
            `Topping:\n` +
            `a. Non Topping\n` +
            `b. Single Topping, bisa pilih maksimal 5 Topping (coklat, tiramisu, vanilla, stroberi, cappucino)\n` +
            `c. Double topping, bisa pilih maksimal 5 Topping single (coklat, tiramisu, vanilla, stroberi, cappucino) dan sekaligus bisa pilih maksimal 5 taburan (meses, keju, kacang, choco chip, Oreo)\n` +
            `Harga sesuai isi per Box:\n` +
            `Original:\n` +
            `box kecil Non topping = 10.000\n` +
            `box kecil single topping = 13.000\n` +
            `box kecil double topping = 15.000\n` +
            `Box besar Non Topping = 18.000\n` +
            `box besar single topping = 25.000\n` +
            `box besar double topping = 28.000\n` +
            `Pandan:\n` +
            `box kecil Non topping = 13.000\n` +
            `box kecil single topping = 15.000\n` +
            `box kecil double topping = 18.000\n` +
            `Box besar Non Topping = 25.000\n` +
            `box besar single topping = 28.000\n` +
            `box besar double topping = 32.000`;
        const encodedMsg = encodeURIComponent(msg);
        window.open(`https://wa.me/${ADMIN_WA}?text=${encodedMsg}`, '_blank');
    });

    calculatePrice();
});

async function generatePdf(data) {
    const {
        Nama,
        Wa,
        Jenis,
        Isi,
        Mode,
        Topping,
        Taburan,
        jumlahBox,
        pricePerBox,
        subtotal,
        discount,
        total,
        logo,
        ttd
    } = data;

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Fungsi untuk menambahkan watermark
    const addWatermark = (doc, text) => {
        doc.setFontSize(30);
        doc.setTextColor(200);
        const x = pageWidth / 2;
        const y = pageHeight / 2;
        doc.text(text, x, y, {
            align: 'center',
            angle: 45
        });
    };

    // Tambahkan watermark
    addWatermark(pdf, 'Pukis Lumer Aulia');

    // Tambahkan logo
    const logoImg = new Image();
    logoImg.src = logo;
    await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
    });
    pdf.addImage(logoImg, 'PNG', 10, 10, 50, 20);

    // Header
    pdf.setFontSize(18);
    pdf.setTextColor(0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nota Pemesanan', pageWidth / 2, 35, {
        align: 'center'
    });

    // Informasi Pemesanan
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    let y = 50; // Posisi Y awal
    const lineHeight = 7; // Jarak antar baris

    pdf.text(`Nama: ${Nama}`, 15, y);
    y += lineHeight;
    pdf.text(`Nomor WA: ${Wa}`, 15, y);
    y += lineHeight;
    pdf.text(`Jenis Pukis: ${Jenis}`, 15, y);
    y += lineHeight;
    pdf.text(`Isi per Box: ${Isi} pcs`, 15, y);
    y += lineHeight;

    // Topping dan Taburan
    let toppingText = Topping.length > 0 ? Topping.join(", ") : "-";
    let taburanText = Taburan.length > 0 ? Taburan.join(", ") : "-";
    if (Mode === "double") {
        pdf.text(`Topping: ${toppingText}`, 15, y);
        y += lineHeight;
        pdf.text(`Taburan: ${taburanText}`, 15, y);
        y += lineHeight;
    } else if (Mode === "single") {
        pdf.text(`Topping: ${toppingText}`, 15, y);
        y += lineHeight;
    }

    pdf.text(`Jumlah Box: ${jumlahBox}`, 15, y);
    y += lineHeight;

    // Tabel
    const headers = [
        "Deskripsi",
        "Harga"
    ];
    const tableData = [
        [
            "Harga per Box",
            formatRp(pricePerBox)
        ],
        [
            "Subtotal",
            formatRp(subtotal)
        ],
        [
            "Diskon",
            discount > 0 ? formatRp(discount) : "-"
        ],
        [
            "Total Bayar",
            formatRp(total)
        ]
    ];

    pdf.autoTable({
        head: [headers],
        body: tableData,
        startY: y + 10,
        margin: {
            left: 15,
            right: 15
        },
        styles: {
            overflow: 'linebreak',
            fontSize: 10,
            cellPadding: 4,
        },
        headStyles: {
            fillColor: '#d6336c',
            textColor: '#fff',
            fontStyle: 'bold'
        },
        didParseCell: function(data) {
            if (data.column.index === 0) {
                data.cell.styles.fontStyle = 'bold';
            }
        },
    });

    // Tanda tangan digital
    const ttdImg = new Image();
    ttdImg.src = ttd;
    await new Promise((resolve, reject) => {
        ttdImg.onload = resolve;
        ttdImg.onerror = reject;
    });
    pdf.addImage(ttdImg, 'PNG', 150, pdf.autoTable.previous.finalY + 10, 40, 20);
    pdf.setFontSize(10);
    pdf.text("Hormat Kami,", 150, pdf.autoTable.previous.finalY + 35);

    // Simpan PDF
    pdf.save(`Nota_PukisLumer_${Nama}.pdf`);
}


