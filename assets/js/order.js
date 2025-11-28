/* =========================================================
   ORDER.JS — FINAL SUPER CLEAN (PART 1/2)
   Semua fungsi order dipusatkan di file ini:
   - Ambil data form
   - Kalkulasi harga
   - Render nota popup
   - Update topping berdasarkan mode
   - Generate PDF (di PART 2)
   - Nomor antrian otomatis
   - Kirim WhatsApp
========================================================= */


/* =========================================================
   UTILITIES
========================================================= */

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatRp(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}


/* =========================================================
   MENGAMBIL DATA ORDER
========================================================= */

function getOrderFormData() {
  const nama = document.getElementById("nama").value.trim();
  const wa = document.getElementById("wa").value.trim();
  const jenis = document.getElementById("jenis").value.trim();
  const mode = document.getElementById("mode").value.trim();

  const jumlahBox = Number(document.getElementById("jumlahBox").value) || 0;
  const pricePerBox = Number(document.getElementById("pricePerBox").value) || 0;
  const note = document.getElementById("note").value.trim();

  /* ===== Topping ===== */
  const toppingNodes = document.querySelectorAll(".topping-check input");
  let toppingArr = [];
  toppingNodes.forEach(x => {
    if (x.checked) toppingArr.push(x.value);
  });
  const topping = toppingArr.join(", ") || "-";

  /* ===== Taburan ===== */
  const taburanNodes = document.querySelectorAll(".taburan-check input");
  let taburanArr = [];
  taburanNodes.forEach(x => {
    if (x.checked) taburanArr.push(x.value);
  });
  const taburan = taburanArr.join(", ") || "-";

  /* ===== Hitungan ===== */
  const subtotal = jumlahBox * pricePerBox;

  let discount = 0;
  if (jumlahBox >= 3) discount = 2000; // boleh diganti sewaktu-waktu

  const total = subtotal - discount;

  /* ===== Nomor Antrian ===== */
  let antrian = localStorage.getItem("nomorAntrian");
  if (!antrian) antrian = 1;
  else antrian = Number(antrian) + 1;

  localStorage.setItem("nomorAntrian", antrian);

  return {
    antrian,
    nama,
    wa,
    jenis,
    mode,
    topping,
    taburan,
    jumlahBox,
    pricePerBox,
    subtotal,
    discount,
    total,
    note
  };
}


/* =========================================================
   SHOW/HIDE TOPPING & TABURAN BERDASARKAN MODE
========================================================= */

function updateToppingMode() {
  const mode = document.getElementById("mode").value;

  const toppingItems = document.querySelectorAll(".topping-check");
  const taburanItems = document.querySelectorAll(".taburan-check");

  // RESET SEMUA
  toppingItems.forEach(el => el.style.display = "none");
  taburanItems.forEach(el => el.style.display = "none");

  /* === NON TOPPING === */
  if (mode === "non") return;

  /* === SINGLE TOPPING === */
  if (mode === "single") {
    toppingItems.forEach(el => {
      const val = el.querySelector("input").value.toLowerCase();
      if (
        val.includes("coklat") ||
        val.includes("tiramisu") ||
        val.includes("vanilla") ||
        val.includes("stroberi") ||
        val.includes("cappucino")
      ) {
        el.style.display = "inline-flex";
      }
    });
    return;
  }

  /* === DOUBLE TOPPING === */
  if (mode === "double") {
    toppingItems.forEach(el => el.style.display = "inline-flex");
    taburanItems.forEach(el => el.style.display = "inline-flex");
  }
}

document.getElementById("mode").addEventListener("change", updateToppingMode);
document.addEventListener("DOMContentLoaded", updateToppingMode);


/* =========================================================
   RENDER NOTA POPUP
========================================================= */

function renderNota(data) {
  const notaContainer = document.getElementById("notaContainer");
  const notaContent = document.getElementById("notaContent");

  notaContent.innerHTML = `
    <p><strong>No. Antrian:</strong> ${escapeHtml(data.antrian)}</p>
    <p><strong>Nama:</strong> ${escapeHtml(data.nama)}</p>
    <p><strong>WA:</strong> ${escapeHtml(data.wa)}</p>

    <p><strong>Jenis:</strong> ${escapeHtml(data.jenis)}</p>
    <p><strong>Mode:</strong> ${escapeHtml(data.mode)}</p>
    <p><strong>Topping:</strong> ${escapeHtml(data.topping)}</p>
    <p><strong>Taburan:</strong> ${escapeHtml(data.taburan)}</p>

    <p><strong>Jumlah Box:</strong> ${escapeHtml(String(data.jumlahBox))}</p>
    <p><strong>Harga Satuan:</strong> ${formatRp(data.pricePerBox)}</p>
    <p><strong>Subtotal:</strong> ${formatRp(data.subtotal)}</p>
    <p><strong>Diskon:</strong> ${data.discount > 0 ? "-" + formatRp(data.discount) : "-"}</p>
    <p><strong>Total Bayar:</strong> ${formatRp(data.total)}</p>

    <p><strong>Catatan:</strong> ${escapeHtml(data.note)}</p>
  `;

  notaContainer.classList.add("show");
}


/* =========================================================
   TOMBOL CLOSE NOTA
========================================================= */

document.getElementById("closeNota").addEventListener("click", () => {
  document.getElementById("notaContainer").classList.remove("show");
});

/* =========================================================
   GENERATE PDF — FINAL
   Termasuk:
   - Logo (logo.png)
   - QRIS (qris.jpg)
   - TTD (ttd.png)
   - Tabel lengkap (harga satuan, diskon, total bayar)
   - Catatan paling bawah
   - No Antrian paling atas
========================================================= */

function generatePdf(data) {
  const doc = new jspdf.jsPDF();

  /* ===== HEADER LOGO ===== */
  doc.addImage("logo.png", "PNG", 14, 8, 32, 32);
  doc.setFontSize(16);
  doc.text("Aish Original", 52, 22);
  doc.setFontSize(10);
  doc.text("Invoice Pemesanan", 52, 30);

  /* ===== TABEL ===== */
  doc.autoTable({
    head: [["Item", "Keterangan"]],
    body: [
      ["No. Antrian", data.antrian],
      ["Nama", data.nama],
      ["Jenis", data.jenis],
      ["Mode", data.mode],
      ["Topping", data.topping],
      ["Taburan", data.taburan],
      ["Jumlah Box", data.jumlahBox + " box"],
      ["Harga Satuan", formatRp(data.pricePerBox)],
      ["Subtotal", formatRp(data.subtotal)],
      ["Diskon", data.discount > 0 ? "-" + formatRp(data.discount) : "-"],
      ["Total Bayar", formatRp(data.total)],
      ["Catatan", data.note || "-"]
    ],
    startY: 48
  });

  /* ===== QRIS ===== */
  doc.addImage(
    "qris.jpg",
    "JPEG",
    14,
    doc.autoTable.previous.finalY + 12,
    70,
    70
  );
  doc.text("Scan untuk pembayaran QRIS", 14, doc.autoTable.previous.finalY + 88);

  /* ===== TTD ===== */
  doc.text("Hormat Kami,", 130, doc.autoTable.previous.finalY + 20);

  doc.addImage(
    "ttd.png",
    "PNG",
    130,
    doc.autoTable.previous.finalY + 28,
    50,
    40
  );

  doc.text("Aish Original", 130, doc.autoTable.previous.finalY + 78);

  /* ===== SAVE PDF ===== */
  doc.save(`Invoice_${data.nama}_${data.antrian}.pdf`);
}



/* =========================================================
   KIRIM WHATSAPP
========================================================= */
function sendWhatsapp(data) {
  const pesan = `
No. Antrian: ${data.antrian}
Nama: ${data.nama}
Jenis: ${data.jenis}
Mode: ${data.mode}
Topping: ${data.topping}
Taburan: ${data.taburan}
Jumlah Box: ${data.jumlahBox}
Harga Satuan: ${formatRp(data.pricePerBox)}
Subtotal: ${formatRp(data.subtotal)}
Diskon: ${data.discount > 0 ? "-" + formatRp(data.discount) : "-"}
Total Bayar: ${formatRp(data.total)}
Catatan: ${data.note}
  `.trim();

  const nomor = "628xxxxxxxxxx"; // GANTI DGN NOMOR WA TOKO
  const url = `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;

  window.open(url, "_blank");
}



/* =========================================================
   SUBMIT FORM ORDER (TAMPILKAN POPUP NOTA)
========================================================= */
document.getElementById("form-ultra").addEventListener("submit", (e) => {
  e.preventDefault();

  const data = getOrderFormData();
  renderNota(data);
});



/* =========================================================
   BUTTON PDF
========================================================= */
document.getElementById("btnPdf").addEventListener("click", () => {
  const data = getOrderFormData();
  generatePdf(data);
});



/* =========================================================
   BUTTON WHATSAPP
========================================================= */
document.getElementById("btnWa").addEventListener("click", () => {
  const data = getOrderFormData();
  sendWhatsapp(data);
});
