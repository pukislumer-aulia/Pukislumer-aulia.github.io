// ================================
// ORDER.JS — PUKIS LUMER AULIA
// ================================
console.info("[order.js] Loaded");

const formUltra = document.getElementById("formUltra");
const notaContainer = document.getElementById("notaContainer");
const notaClose = document.getElementById("notaClose");
const notaContent = document.getElementById("notaContent");
const notaPrint = document.getElementById("notaPrint");

const priceMap = {
  "Original": { "5": { "non":10000, "single":13000, "double":15000 }, "10": { "non":18000, "single":25000, "double":28000 } },
  "Pandan": { "5": { "non":13000, "single":15000, "double":18000 }, "10": { "non":25000, "single":28000, "double":32000 } }
};

function calculatePrice() {
  const jenis = formUltra.ultraJenis.value;
  const isi = formUltra.ultraIsi.value;
  const mode = formUltra.ultraToppingMode.value;
  const jumlah = Number(formUltra.ultraJumlah.value) || 1;

  const perBox = priceMap[jenis][isi][mode] || 0;
  let subtotal = perBox * jumlah;
  let discount = 0;
  if(jumlah >= 10) discount = 500 * jumlah;
  const total = subtotal - discount;

  document.getElementById("ultraPricePerBox").textContent = "Rp" + perBox.toLocaleString();
  document.getElementById("ultraSubtotal").textContent = "Rp" + subtotal.toLocaleString();
  document.getElementById("ultraDiscount").textContent = discount ? "- Rp" + discount.toLocaleString() : "-";
  document.getElementById("ultraGrandTotal").textContent = "Rp" + total.toLocaleString();

  return { perBox, subtotal, discount, total };
}

formUltra.addEventListener("input", calculatePrice);

formUltra.addEventListener("submit", e => {
  e.preventDefault();
  const data = {
    nama: formUltra.ultraNama.value,
    wa: formUltra.ultraWA.value,
    jenis: formUltra.ultraJenis.value,
    isi: formUltra.ultraIsi.value,
    toppingMode: formUltra.ultraToppingMode.value,
    jumlahBox: Number(formUltra.ultraJumlah.value),
    note: formUltra.ultraNote.value,
    createdAt: new Date(),
  };
  localStorage.setItem("lastOrder", JSON.stringify(data));
  showNota(data);
});

function showNota(data) {
  notaContent.innerHTML = `
    <p><strong>Nama:</strong> ${data.nama}</p>
    <p><strong>WA:</strong> ${data.wa}</p>
    <p><strong>Jenis:</strong> ${data.jenis}</p>
    <p><strong>Isi/Box:</strong> ${data.isi}</p>
    <p><strong>Topping Mode:</strong> ${data.toppingMode}</p>
    <p><strong>Jumlah Box:</strong> ${data.jumlahBox}</p>
    <p><strong>Catatan:</strong> ${data.note}</p>
  `;
  notaContainer.classList.add("show");
}

notaClose.addEventListener("click", () => notaContainer.classList.remove("show"));

notaPrint.addEventListener("click", () => {
  const order = JSON.parse(localStorage.getItem("lastOrder") || "{}");
  if(!order.nama) return alert("Tidak ada data nota!");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text("NOTA PEMESANAN PUKIS LUMER AULIA",10,12);
  pdf.text(`Nama: ${order.nama}`,10,24);
  pdf.text(`WA: ${order.wa}`,10,32);
  pdf.text(`Jenis: ${order.jenis}`,10,40);
  pdf.text(`Isi/Box: ${order.isi}`,10,48);
  pdf.text(`Topping Mode: ${order.toppingMode}`,10,56);
  pdf.text(`Jumlah Box: ${order.jumlahBox}`,10,64);
  pdf.text(`Catatan: ${order.note}`,10,72);
  pdf.save("nota.pdf");
});
