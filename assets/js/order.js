// assets/js/order.js (module)

document.addEventListener('DOMContentLoaded', () => {
  // helper
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const formatRp = n => 'Rp' + Number(n).toLocaleString('id-ID');

  const BASE_PRICE = {
    Original: { '5': { non: 10000, single: 13000, double: 15000 }, '10': { non: 18000, single: 25000, double: 28000 } },
    Pandan: { '5': { non: 13000, single: 15000, double: 18000 }, '10': { non: 25000, single: 28000, double: 32000 } }
  };

  const ADMIN_WA = '6281296668670';

  // DOM refs
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
    return Array.from(document.querySelectorAll(selector)).filter(c => c.checked).map(c => c.value);
  }

  // update topping display
  function updateToppingDisplay() {
    const mode = getSelectedRadioValue('ultraToppingMode');
    ultraSingleGroup.style.display = (mode === 'single') ? 'block' : 'none';
    ultraDoubleGroup.style.display = (mode === 'double') ? 'block' : 'none';

    // when switching modes, uncheck irrelevant boxes
    // keep checkboxes in DOM but clear their checked state
    $$('.ultraTopping').forEach(cb => cb.checked = false);
    $$('.ultraTaburan').forEach(cb => cb.checked = false);

    calculatePrice();
  }

  // attach change listeners to topping mode radios
  document.querySelectorAll('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', updateToppingDisplay));

  updateToppingDisplay();

  // limit topping/taburan to max 5
  function toppingTaburanHandler(event) {
    const mode = getSelectedRadioValue('ultraToppingMode');
    const checkedTopping = getCheckedValues('.ultraTopping');
    const checkedTaburan = getCheckedValues('.ultraTaburan');

    if (mode === 'double') {
      if (event.target.classList.contains('ultraTopping') && checkedTopping.length > 5) {
        event.target.checked = false; alert('Maksimal 5 topping yang dapat dipilih.'); return;
      }
      if (event.target.classList.contains('ultraTaburan') && checkedTaburan.length > 5) {
        event.target.checked = false; alert('Maksimal 5 taburan yang dapat dipilih.'); return;
      }
    } else if (mode === 'single') {
      if (event.target.classList.contains('ultraTopping') && checkedTopping.length > 5) {
        event.target.checked = false; alert('Maksimal 5 topping yang dapat dipilih.'); return;
      }
    }

    calculatePrice();
  }

  $$('.ultraTopping, .ultraTaburan').forEach(cb => cb.addEventListener('change', toppingTaburanHandler));

  // calculate price
  function calculatePrice() {
    const jenis = getSelectedRadioValue('ultraJenis') || 'Original';
    const isi = ultraIsi.value || '5';
    const mode = getSelectedRadioValue('ultraToppingMode') || 'non';
    const jumlahBox = parseInt(ultraJumlah.value || '1', 10) || 1;

    const pricePerBox = (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) ? BASE_PRICE[jenis][isi][mode] : null;

    if (!pricePerBox) {
      console.error('Harga tidak valid untuk kombinasi jenis, isi, dan mode yang dipilih.');
      ultraPricePerBox.textContent = 'Rp0'; ultraSubtotal.textContent = 'Rp0'; ultraDiscount.textContent = '-'; ultraGrandTotal.textContent = 'Rp0';
      dataPesanan = {};
      return;
    }

    const subtotal = pricePerBox * jumlahBox;
    const discount = 0;
    const total = subtotal - discount;

    ultraPricePerBox.textContent = formatRp(pricePerBox);
    ultraSubtotal.textContent = formatRp(subtotal);
    ultraDiscount.textContent = discount > 0 ? formatRp(discount) : '-';
    ultraGrandTotal.textContent = formatRp(total);

    dataPesanan = {
      nama: ultraNama.value.trim() || '-',
      wa: ultraWA.value.trim() || '-',
      jenis: jenis,
      isi: isi,
      mode: mode,
      topping: getCheckedValues('.ultraTopping'),
      taburan: mode === 'double' ? getCheckedValues('.ultraTaburan') : [],
      jumlahBox: jumlahBox,
      pricePerBox: pricePerBox,
      subtotal: subtotal,
      discount: discount,
      total: total,
      logo: 'assets/images/logo_png.png',
      ttd: 'assets/images/ttd.png'
    };
  }

  // listeners to update price
  ultraIsi.addEventListener('change', calculatePrice);
  ultraJumlah.addEventListener('input', calculatePrice);
  document.querySelectorAll('input[name="ultraJenis"]').forEach(r => r.addEventListener('change', calculatePrice));
  document.querySelectorAll('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', calculatePrice));

  // generate nota HTML
  function generateNota() {
    const { nama, wa, jenis, isi, mode, topping, taburan, jumlahBox, pricePerBox, subtotal, discount, total } = dataPesanan;

    const toppingText = (topping && topping.length) ? topping.join(', ') : '-';
    const taburanText = (taburan && taburan.length) ? taburan.join(', ') : '-';

    let html = `<p><strong>Nama:</strong> ${nama}</p><p><strong>Nomor WA:</strong> ${wa}</p><p><strong>Jenis Pukis:</strong> ${jenis}</p><p><strong>Isi per Box:</strong> ${isi} pcs</p>`;
    if (mode === 'double') html += `<p><strong>Topping:</strong> ${toppingText}</p><p><strong>Taburan:</strong> ${taburanText}</p>`;
    else if (mode === 'single') html += `<p><strong>Topping:</strong> ${toppingText}</p>`;
    html += `<p><strong>Jumlah Box:</strong> ${jumlahBox}</p><hr><p><strong>Harga per Box:</strong> ${formatRp(pricePerBox)}</p><p><strong>Subtotal:</strong> ${formatRp(subtotal)}</p><p><strong>Diskon:</strong> ${discount > 0 ? formatRp(discount) : '-'}</p><p><strong>Total Bayar:</strong> ${formatRp(total)}</p>`;

    notaContent.innerHTML = html;
  }

  // open popup
  formUltra.addEventListener('submit', (e) => { e.preventDefault(); calculatePrice(); generateNota(); notaContainer.style.display = 'flex'; });
  notaClose.addEventListener('click', () => notaContainer.style.display = 'none');

  // print / download pdf
  notaPrint.addEventListener('click', () => {
    calculatePrice();
    const notaData = dataPesanan;
    generatePdf(notaData);
  });

  // send WA admin
  notaSendAdmin.addEventListener('click', () => {
    calculatePrice();
    const { nama, wa, jenis, isi, mode, topping, taburan, jumlahBox, total } = dataPesanan;
    const toppingText = (topping && topping.length) ? topping.join(', ') : '-';
    const taburanText = (taburan && taburan.length) ? taburan.join(', ') : '-';

    let msg = `Halo! Saya ingin memesan Pukis:\n` +
      `Nama: ${nama}\n` +
      `Jenis: ${jenis}\n` +
      `${mode === 'double' ? `Topping: ${toppingText}\nTaburan: ${taburanText}\n` : mode === 'single' ? `Topping: ${toppingText}\n` : ''}` +
      `Isi per Box: ${isi} pcs\n` +
      `Jumlah Box: ${jumlahBox} box\n` +
      `Harga: ${formatRp(total)}\n\n` +
      `Jenis Pukis:\n1. Original\n2. Pandan\nTopping:\na. Non Topping\nb. Single Topping, bisa pilih maksimal 5 Topping (coklat, tiramisu, vanilla, stroberi, cappucino)\nc. Double topping, bisa pilih maksimal 5 Topping single (coklat, tiramisu, vanilla, stroberi, cappucino) dan sekaligus bisa pilih maksimal 5 taburan (meses, keju, kacang, choco chip, Oreo)\nHarga sesuai isi per Box:\nOriginal:\nbox kecil Non topping = 10.000\nbox kecil single topping = 13.000\nbox kecil double topping = 15.000\nBox besar Non Topping = 18.000\nbox besar single topping = 25.000\nbox besar double topping = 28.000\nPandan:\nbox kecil Non topping = 13.000\nbox kecil single topping = 15.000\nbox kecil double topping = 18.000\nBox besar Non Topping = 25.000\nbox besar single topping = 28.000\nbox besar double topping = 32.000`;

    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodedMsg}`, '_blank');
  });

  calculatePrice();
});

// generatePdf function (global async)
async function generatePdf(data) {
  const { nama, wa, jenis, isi, mode, topping, taburan, jumlahBox, pricePerBox, subtotal, discount, total, logo, ttd } = data;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();

  // watermark (light)
  pdf.setFontSize(30); pdf.setTextColor(200);
  pdf.text('Pukis Lumer Aulia', pageWidth / 2, 150, { align: 'center', angle: 45 });

  // add logo if available
  try {
    if (logo) {
      const img = new Image(); img.src = logo; await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      pdf.addImage(img, 'PNG', 10, 10, 50, 20);
    }
  } catch (err) { console.warn('Logo gagal dimuat:', err); }

  pdf.setFontSize(18); pdf.setTextColor(0); pdf.setFont('helvetica', 'bold');
  pdf.text('Nota Pemesanan', pageWidth / 2, 35, { align: 'center' });

  pdf.setFontSize(12); pdf.setFont('helvetica', 'normal');
  let y = 50; const lineHeight = 7;
  pdf.text(`Nama: ${nama}`, 15, y); y += lineHeight;
  pdf.text(`Nomor WA: ${wa}`, 15, y); y += lineHeight;
  pdf.text(`Jenis Pukis: ${jenis}`, 15, y); y += lineHeight;
  pdf.text(`Isi per Box: ${isi} pcs`, 15, y); y += lineHeight;

  const toppingText = topping && topping.length ? topping.join(', ') : '-';
  const taburanText = taburan && taburan.length ? taburan.join(', ') : '-';
  if (mode === 'double') { pdf.text(`Topping: ${toppingText}`, 15, y); y += lineHeight; pdf.text(`Taburan: ${taburanText}`, 15, y); y += lineHeight; }
  else if (mode === 'single') { pdf.text(`Topping: ${toppingText}`, 15, y); y += lineHeight; }

  pdf.text(`Jumlah Box: ${jumlahBox}`, 15, y); y += lineHeight;

  const headers = ['Deskripsi', 'Harga'];
  const tableData = [ ['Harga per Box', formatRp(pricePerBox)], ['Subtotal', formatRp(subtotal)], ['Diskon', discount > 0 ? formatRp(discount) : '-'], ['Total Bayar', formatRp(total)] ];

  pdf.autoTable({ head: [headers], body: tableData, startY: y + 10, margin: { left: 15, right: 15 }, styles: { overflow: 'linebreak', fontSize: 10, cellPadding: 4 }, headStyles: { fillColor: '#d6336c', textColor: '#fff', fontStyle: 'bold' } });

  try {
    if (ttd) {
      const ttdImg = new Image(); ttdImg.src = ttd; await new Promise((res, rej) => { ttdImg.onload = res; ttdImg.onerror = rej; });
      pdf.addImage(ttdImg, 'PNG', 150, pdf.autoTable.previous.finalY + 10, 40, 20);
      pdf.setFontSize(10); pdf.text('Hormat Kami,', 150, pdf.autoTable.previous.finalY + 35);
    }
  } catch (err) { console.warn('TTD gagal dimuat:', err); }

  pdf.save(`Nota_PukisLumer_${nama.replace(/\s+/g,'_') || 'Pelanggan'}.pdf`);
      }
