/* assets/js/order.js — Main script for order form and nota popup */

document.addEventListener("DOMContentLoaded", () => {
    /* -------------------------------------------------------------
       ELEMENT REFERENCES
    ------------------------------------------------------------- */
    const namaEl = document.getElementById("namaPemesan");
    const isiEl = document.getElementById("isiBox");
    const jumlahEl = document.getElementById("jumlahBox");
    const formPukis = document.getElementById("formPukis");
    const totalHargaEl = document.getElementById("totalHarga");
    const toppingModeEls = document.querySelectorAll('input[name="topping"]');
    const singleToppingGroup = document.getElementById("singleToppingGroup");
    const doubleToppingGroup = document.getElementById("doubleToppingGroup");
    const notaPopup = document.getElementById("notaContainer");
    const notaContent = document.getElementById("notaContent");
    const notaClose = document.getElementById("notaClose");
    const notaPrint = document.getElementById("notaPrint");
    const notaWAAdmin = document.getElementById("notaWAAdmin");

    /* -------------------------------------------------------------
       DATA & CONFIG
    ------------------------------------------------------------- */
    const ADMIN_WA = "6281296668670";

    const hargaPukis = {
        original: {
            non: {
                5: 10000,
                10: 18000
            },
            single: {
                5: 13000,
                10: 25000
            },
            double: {
                5: 15000,
                10: 28000
            }
        },
        pandan: {
            non: {
                5: 12000,
                10: 22000
            },
            single: {
                5: 15000,
                10: 28000
            },
            double: {
                5: 18000,
                10: 32000
            }
        }
    };

    // Daftar topping dan taburan
    const singleToppings = ["Coklat", "Tiramisu", "Stroberi", "Cappucino", "Vanilla", "Matcha"];
    const doubleToppings = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

    /* -------------------------------------------------------------
       FUNCTION: FORMAT RUPIAH
    ------------------------------------------------------------- */
    function formatRupiah(num) {
        return "Rp" + num.toLocaleString("id-ID");
    }

    /* -------------------------------------------------------------
       BUILD CHECKBOX ( dinamic)
    ------------------------------------------------------------- */
     // [FUNCTION] Build Topping List UI
     function buildToppingList(list, target) {
        target.innerHTML = "";
        list.forEach(item => {
            const lbl = document.createElement("label");
            lbl.innerHTML = `<input type="checkbox" class="topping-check" value="${item}"> ${item}`;
            target.appendChild(lbl);
        });
    }

       buildToppingList(singleToppings, singleToppingGroup);
       buildToppingList(doubleToppings, doubleToppingGroup);

    /* -------------------------------------------------------------
       GET SELECTED CHECKBOX FUNCTION
    ------------------------------------------------------------- */
    function getSelectedToppings(selector) {
        const selectedToppings = [];
        document.querySelectorAll(selector + ':checked').forEach(checkbox => {
            selectedToppings.push(checkbox.value);
        });
        return selectedToppings;
    }

    /* -------------------------------------------------------------
       FUNGSI HITUNG HARGA
    ------------------------------------------------------------- */
    function calculatePrice() {
        let total = 0;

        const jenis = document.querySelector('input[name="jenis"]:checked').value;
        const topping = document.querySelector('input[name="topping"]:checked').value;
        const isi = parseInt(document.getElementById("isiBox").value);
        const jumlah = parseInt(document.getElementById("jumlahBox").value);

        let hargaSatuan = hargaPukis[jenis][topping][isi] || 0;
        total = hargaSatuan * jumlah;

        totalHargaEl.innerText = formatRupiah(total);
        return total;
    }

    /* -------------------------------------------------------------
       UPDATE SECTION TOPPING
    ------------------------------------------------------------- */
    function updateToppingVisibility() {
        const topping = document.querySelector('input[name="topping"]:checked').value;
        singleToppingGroup.style.display = (topping === "single") ? "block" : "none";
        doubleToppingGroup.style.display = (topping === "double") ? "block" : "none";
        const isi = parseInt(document.getElementById("isiBox").value);

        // Get all Single Topping value
        const singleTopping = Array.from(document.querySelectorAll('.singleTopping:checked')).map(el => el.value);

        // Get all Double Topping value
        const doubleTopping = Array.from(document.querySelectorAll('.doubleTopping:checked')).map(el => el.value);
    }

    /* -------------------------------------------------------------
       GENERATE NOTA
    ------------------------------------------------------------- */
    function generateNotaHTML(data) {
        return `
            <p><strong>Nama:</strong> ${data.nama}</p>
            <p><strong>Jenis:</strong> ${data.jenis}</p>
            <p><strong>Topping:</strong> ${data.topping}</p>
            <p><strong>Isi per Box:</strong> ${data.isi} pcs</p>
            <p><strong>Jumlah Box:</strong> ${data.jumlah}</p>
            <hr>
            <p><strong>Total Harga:</strong> ${formatRupiah(data.total)}</p>
        `;
    }

    /* -------------------------------------------------------------
       FUNCTION SEND WHATSAPP
    ------------------------------------------------------------- */
    function sendWhatsApp(data) {
        let message = `Halo Admin, ada pesanan baru:\nNama: ${data.nama}\nJenis: ${data.jenis}\n`;

        if (data.topping === 'single') {
            message += `Topping Single: ${data.singleTopping.join(', ')}\n`;
        } else if (data.topping === 'double') {
            message += `Topping Double:\nRasa: ${data.singleTopping.join(', ')}\nTaburan: ${data.doubleTopping.join(', ')}\n`;
        } else {
            message += `Tanpa Topping\n`;
        }

        message += `Isi per Box: ${data.isi} pcs\nJumlah Box: ${data.jumlah}\nTotal Harga: ${formatRupiah(data.total)}`;
        const whatsappUrl = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    /* -------------------------------------------------------------
       GET FORM DATA
    ------------------------------------------------------------- */
    function getFormData() {
        const nama = namaEl.value.trim();
        const jenis = document.querySelector('input[name="jenis"]:checked').value;
        const topping = document.querySelector('input[name="topping"]:checked').value;
        const isi = document.getElementById("isiBox").value;
        const jumlah = document.getElementById("jumlahBox").value;
        let toppingText = '';

         if (topping === 'single') {
            toppingText = getSelectedToppings('.topping-check').join(', ');
         } else if (topping === 'double') {
            toppingText = `Rasa: ${getSelectedToppings('.topping-check').join(', ')}<br>Taburan: ${getSelectedToppings('.topping-check').join(', ')}`;
         }

        return {
            nama,
            jenis,
            topping,
            isi,
            jumlah,
            singleTopping: getSelectedToppings('.topping-check'),
            doubleTopping: getSelectedToppings('.topping-check'),
            total: calculatePrice()
        };
    }

    /* -------------------------------------------------------------
       VALIDATION TOPPING
    ------------------------------------------------------------- */
    function validateTopping() {
        const topping = document.querySelector('input[name="topping"]:checked').value;
        const isi = parseInt(document.getElementById("isiBox").value);
        const single = getSelectedToppings('.topping-check');
        const double = getSelectedToppings('.topping-check');

        if (topping === 'single' && single.length > isi) {
            alert(`Single topping maksimal ${isi} rasa.`);
            return false;
        }
        if (topping === 'double' && (single.length > isi || double.length > isi)) {
            alert(`Double topping maksimal ${isi} rasa dan taburan maksimal ${isi}.`);
            return false;
        }
        return true;
    }
       /* -------------------------------------------------------------
        EVENT: Form Submit
    ------------------------------------------------------------- */
    formPukis.addEventListener("submit", function(e) {
        e.preventDefault();
        if (!validateTopping()) return;
          const data = getFormData();

          /* popup WA inside nota */
          sendWhatsApp(data)
    });
    /* -------------------------------------------------------------
     EVENT: notaClose
  ------------------------------------------------------------- */
      notaClose.addEventListener("click", () => {
          notaPopup.classList.remove("show");
      });

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
       INIT SECTION
    ------------------------------------------------------------- */
    // [FUNGSI] Ubah tampilan topping
    function ubahTopping() {
        const topping = document.querySelector('input[name="topping"]:checked').value;
        singleToppingGroup.style.display = (topping === "single") ? "block" : "none";
        doubleToppingGroup.style.display = (topping === "double") ? "block" : "none";
        calculatePrice();

    }

    document.querySelectorAll('input[name="jenis"], input[name="topping"], #isiBox, #jumlahBox').forEach(el => {
        el.addEventListener('change', () => {
            ubahTopping();
            calculatePrice();
        });
    });

    document.querySelectorAll('.topping-check').forEach(el => el.addEventListener('change', calculatePrice));
    window.addEventListener('load', () => {
        ubahTopping();
        calculatePrice();
    });
});
