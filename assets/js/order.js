// assets/js/order.js (module)

document.addEventListener('DOMContentLoaded', () => {

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const formatRp = n => 'Rp' + Number(n).toLocaleString('id-ID');

  const BASE_PRICE = {
    Original: {
      '5': { non: 10000, single: 13000, double: 15000 },
      '10': { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      '5': { non: 13000, single: 15000, double: 18000 },
      '10': { non: 25000, single: 28000, double: 32000 }
    }
  };

  const ADMIN_WA = '6281296668670';

  const ultraNama = $('#ultraNama');
  const ultraWA = $('#ultraWA');
  const ultraIsi = $('#ultraIsi');
  const ultraJumlah = $('#ultraJumlah');
  const ultraPricePerBox = $('#ultraPricePerBox');
  const ultraSubtotal = $('#ultraSubtotal');
  const ultraDiscount = $('#ultraDiscount');
  const ultraGrandTotal = $('#ultraGrandTotal');

  const formUltra = $('#formUltra');
  const ultraSingleGroup = $('#ultraSingleGroup');
  const ultraDoubleGroup = $('#ultraDoubleGroup');

  const notaContainer = $('#notaContainer');
  const notaContent = $('#notaContent');
  const notaClose = $('#notaClose');
  const notaPrint = $('#notaPrint');
  const notaSendAdmin = $('#ultraSendAdmin');

  let dataPesanan = {};

  function getSelectedRadioValue(name) {
    const r = document.querySelector(`input[name="${name}"]:checked`);
    return r ? r.value : null;
  }

  function getCheckedValues(selector) {
    return [...document.querySelectorAll(selector)]
      .filter(c => c.checked)
      .map(c => c.value);
  }

  function updateToppingDisplay() {
    const mode = getSelectedRadioValue('ultraToppingMode');

    ultraSingleGroup.style.display = mode === 'single' ? 'block' : 'none';
    ultraDoubleGroup.style.display = mode === 'double' ? 'block' : 'none';

    if (mode === 'non') {
      $$('.ultraTopping, .ultraTaburan').forEach(x => x.checked = false);
    }

    calculatePrice();
  }

  document.querySelectorAll('input[name="ultraToppingMode"]')
    .forEach(r => r.addEventListener('change', updateToppingDisplay));

  updateToppingDisplay();

  function toppingLimitEvent(e) {
    const mode = getSelectedRadioValue('ultraToppingMode');
    const t = getCheckedValues('.ultraTopping');
    const tb = getCheckedValues('.ultraTaburan');

    if (mode === 'single' && t.length > 5) {
      e.target.checked = false;
      alert("Maksimal 5 topping!");
      return;
    }

    if (mode === 'double') {
      if (e.target.classList.contains('ultraTopping') && t.length > 5) {
        e.target.checked = false;
        alert("Maksimal 5 topping!");
        return;
      }

      if (e.target.classList.contains('ultraTaburan') && tb.length > 5) {
        e.target.checked = false;
        alert("Maksimal 5 taburan!");
        return;
      }
    }

    calculatePrice();
  }

  $$('.ultraTopping, .ultraTaburan')
    .forEach(cb => cb.addEventListener('change', toppingLimitEvent));

  function calculatePrice() {
    const jenis = getSelectedRadioValue('ultraJenis');
    const isi = ultraIsi.value;
    const mode = getSelectedRadioValue('ultraToppingMode');
    const jumlahBox = parseInt(ultraJumlah.value);

    const pricePerBox = BASE_PRICE[jenis][isi][mode];
    const subtotal = pricePerBox * jumlahBox;
    const discount = 0;
    const total = subtotal - discount;

    ultraPricePerBox.textContent = formatRp(pricePerBox);
    ultraSubtotal.textContent = formatRp(subtotal);
    ultraDiscount.textContent = '-';
    ultraGrandTotal.textContent = formatRp(total);

    dataPesanan = {
      nama: ultraNama.value || '-',
      wa: ultraWA.value || '-',
      jenis,
      isi,
      mode,
      topping: getCheckedValues('.ultraTopping'),
      taburan: mode === 'double' ? getCheckedValues('.ultraTaburan') : [],
      jumlahBox,
      pricePerBox,
      subtotal,
      discount,
      total
    };
  }

  ultraIsi.addEventListener('change', calculatePrice);
  ultraJumlah.addEventListener('input', calculatePrice);
  document.querySelectorAll('input[name="ultraJenis"]')
    .forEach(r => r.addEventListener('change', calculatePrice));

  formUltra.addEventListener('submit', e => {
    e.preventDefault();
    calculatePrice();
    renderNota();
    notaContainer.style.display = 'flex';
  });

  notaClose.addEventListener('click', () => {
    notaContainer.style.display = 'none';
  });

  function renderNota() {
    const d = dataPesanan;
    let text =
      `<p><strong>Nama:</strong> ${d.nama}</p>
       <p><strong>WA:</strong> ${d.wa}</p>
       <p><strong>Jenis:</strong> ${d.jenis}</p>
       <p><strong>Isi:</strong> ${d.isi} pcs</p>`;

    if (d.mode === 'single')
      text += `<p><strong>Topping:</strong> ${d.topping.join(', ') || '-'}</p>`

    if (d.mode === 'double')
      text += `<p><strong>Topping:</strong> ${d.topping.join(', ') || '-'}</p>
               <p><strong>Taburan:</strong> ${d.taburan.join(', ') || '-'}</p>`

    text += `
      <p><strong>Jumlah Box:</strong> ${d.jumlahBox}</p>
      <hr>
      <p><strong>Harga per Box:</strong> ${formatRp(d.pricePerBox)}</p>
      <p><strong>Total Bayar:</strong> ${formatRp(d.total)}</p>
    `;

    notaContent.innerHTML = text;
  }

  notaSendAdmin.addEventListener('click', () => {
    calculatePrice();
    const d = dataPesanan;

    const msg =
      `Halo Admin, saya ingin pesan Pukis:\n` +
      `Nama: ${d.nama}\n` +
      `Jenis: ${d.jenis}\n` +
      `Isi: ${d.isi} pcs\n` +
      (d.mode === 'single' ? `Topping: ${d.topping.join(', ') || '-'}\n` : '') +
      (d.mode === 'double' ?
        `Topping: ${d.topping.join(', ') || '-'}\nTaburan: ${d.taburan.join(', ') || '-'}\n` : '') +
      `Jumlah: ${d.jumlahBox} box\n` +
      `Total: ${formatRp(d.total)}\n\nMohon diproses 🙏`;

    window.open(
      `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  });

  notaPrint.addEventListener('click', async () => {
    try {
      calculatePrice();
      await generatePdf(dataPesanan);
    } catch (err) {
      alert("PDF gagal dibuat");
      console.error(err);
    }
  });

  calculatePrice();
});
// =========================
// PDF GENERATOR FUNCTION
// =========================

async function generatePdf(data) {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const formatRp = n => 'Rp' + Number(n).toLocaleString('id-ID');

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
  } = data;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("NOTA PEMESANAN", 105, 15, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  let y = 30;

  pdf.text(`Nama: ${nama}`, 10, y); y += 6;
  pdf.text(`WA: ${wa}`, 10, y); y += 6;
  pdf.text(`Jenis Pukis: ${jenis}`, 10, y); y += 6;
  pdf.text(`Isi per Box: ${isi} pcs`, 10, y); y += 6;

  if (mode === "single") {
    pdf.text(`Topping: ${topping.join(', ') || '-'}`, 10, y);
    y += 6;
  }
  if (mode === "double") {
    pdf.text(`Topping: ${topping.join(', ') || '-'}`, 10, y);
    y += 6;
    pdf.text(`Taburan: ${taburan.join(', ') || '-'}`, 10, y);
    y += 6;
  }

  pdf.text(`Jumlah Box: ${jumlahBox}`, 10, y);
  y += 10;

  pdf.autoTable({
    startY: y,
    head: [['Keterangan', 'Harga']],
    body: [
      ['Harga per Box', formatRp(pricePerBox)],
      ['Subtotal', formatRp(subtotal)],
      ['Diskon', discount > 0 ? formatRp(discount) : '-'],
      ['Total Bayar', formatRp(total)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [214, 51, 108],
      textColor: 255,
    },
  });

  pdf.save(`Nota_Pemesanan_${nama.replace(/\s+/g,'_')}.pdf`);
}
