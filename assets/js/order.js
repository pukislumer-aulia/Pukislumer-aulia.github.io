/* ==========================================================
   order.js — Pukis Lumer Aulia
   FINAL CLEAN VERSION — No duplicate, no error
   ========================================================== */

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

  const sendAdminBtn = document.getElementById("ultraSendAdmin");

  /* -------------------------------------------------------------
     TOPPING LISTS
  ------------------------------------------------------------- */
  const singleToppings = [
    "Vanilla", "Keju", "Chocolate", "Red Velvet",
    "Oreo", "Matcha", "Strawberry", "Blueberry"
  ];

  const doubleToppings = [
    "Vanilla", "Keju", "Chocolate", "Oreo",
    "Strawberry", "Kacang", "Meses", "Matcha"
  ];

  /* -------------------------------------------------------------
     BUILD TOPPING INPUTS
  ------------------------------------------------------------- */
  function buildToppingList(list, target) {
    target.innerHTML = "";
    list.forEach(item => {
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="checkbox" value="${item}"> ${item}`;
      target.appendChild(lbl);
    });
  }

  buildToppingList(singleToppings, singleGroup);
  buildToppingList(doubleToppings, doubleGroup);

  /* -------------------------------------------------------------
     SHOW/HIDE TOPPING MODE
  ------------------------------------------------------------- */
  function updateToppingMode() {
    const mode = document.querySelector("input[name='ultraToppingMode']:checked").value;
    
    singleGroup.style.display = mode === "single" ? "flex" : "none";
    doubleGroup.style.display = mode === "double" ? "flex" : "none";
  }

  toppingModeEls.forEach(el => el.addEventListener("change", updateToppingMode));
  updateToppingMode();

  /* -------------------------------------------------------------
     PRICE CALCULATION
  ------------------------------------------------------------- */
  function calculatePrice() {
    const isi = parseInt(isiEl.value);
    const jumlah = parseInt(jumlahEl.value) || 1;
    const mode = document.querySelector("input[name='ultraToppingMode']:checked").value;

    let price = isi === 5 ? 10000 : 20000;

    if (mode === "single") price += 2000;
    if (mode === "double") price += 4000;

    const subtotal = price * jumlah;

    let discount = 0;
    if (jumlah >= 5) discount = subtotal * 0.10; // Diskon 10%

    const grand = subtotal - discount;

    pricePerBoxEl.textContent = formatRupiah(price);
    subtotalEl.textContent = formatRupiah(subtotal);
    discountEl.textContent = discount > 0 ? formatRupiah(discount) : "-";
    grandEl.textContent = formatRupiah(grand);
  }

  [isiEl, jumlahEl, ...toppingModeEls].forEach(el => el.addEventListener("change", calculatePrice));
  calculatePrice();

  function formatRupiah(num) {
    return "Rp" + num.toLocaleString("id-ID");
  }

  /* -------------------------------------------------------------
     GENERATE NOTA (HTML)
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

      <button id="popupWA" class="btn-wa" style="margin-top:12px;width:100%;">
        Konfirmasi pesanan anda ke admin
      </button>
    `;
  }

  /* -------------------------------------------------------------
     HANDLE FORM SUBMIT → SHOW POPUP
  ------------------------------------------------------------- */
  formUltra.addEventListener("submit", (e) => {
    e.preventDefault();

    const nama = namaEl.value.trim();
    const wa = waEl.value.trim();
    const jenis = document.querySelector("input[name='ultraJenis']:checked").value;
    const isi = parseInt(isiEl.value);
    const mode = document.querySelector("input[name='ultraToppingMode']:checked").value;
    
    const topping = [
      ...singleGroup.querySelectorAll("input:checked"),
      ...doubleGroup.querySelectorAll("input:checked")
    ].map(x => x.value);

    const note = noteEl.value.trim();
    const jumlah = parseInt(jumlahEl.value);

    const total = parseInt(grandEl.textContent.replace(/[Rp. ]/g,"")) || 0;

    const data = { nama, wa, jenis, isi, mode, topping, note, jumlah, total };

    notaContent.innerHTML = generateNotaHTML(data);
    notaPopup.classList.add("show");

    /* popup WA inside nota */
    document.getElementById("popupWA").onclick = () => {
      sendToWhatsApp(data);
    };
  });

  notaClose.addEventListener("click", () => {
    notaPopup.classList.remove("show");
  });

  /* -------------------------------------------------------------
     SEND TO WHATSAPP
  ------------------------------------------------------------- */
  const ADMIN_WA = "6281296668670";

  function sendToWhatsApp(data) {
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

  sendAdminBtn.addEventListener("click", () => {
    /* this button sends blank — only after confirm */
    alert("Buat nota dulu agar pesan lengkap 🙏");
  });

  /* -------------------------------------------------------------
     PRINT / PDF
  ------------------------------------------------------------- */
  notaPrint.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
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

});
