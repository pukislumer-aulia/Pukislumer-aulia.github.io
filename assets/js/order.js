// FILE: assets/js/order.js
// Harga dan logika pesanan
const HARGA = {
  Original: { 5: { non:10000, single:13000, double:15000 }, 10:{ non:18000, single:25000, double:28000 } },
  Pandan:   { 5: { non:13000, single:15000, double:18000 }, 10:{ non:25000, single:28000, double:32000 } }
};
const ADMIN_WA = "6281296668670";
function formatRp(n){ return "Rp " + Number(n).toLocaleString("id-ID"); }
function getCheckedValues(selector){ return Array.from(document.querySelectorAll(selector + ':checked')).map(el=>el.value); }

function updateToppingVisibility(){
  const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || 'non';
  document.getElementById("ultraSingleGroup").style.display = (mode === "single" || mode === "double") ? "block" : "none";
  document.getElementById("ultraDoubleGroup").style.display = (mode === "double") ? "block" : "none";
}
document.querySelectorAll('input[name="ultraToppingMode"]').forEach(r=>r.addEventListener('change', updateToppingVisibility));
updateToppingVisibility();

function calcUltraPrice(){
  const jenis = document.querySelector('input[name="ultraJenis"]:checked')?.value || 'Original';
  const isi = Number(document.getElementById("ultraIsi").value);
  const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || 'non';
  const jumlah = Number(document.getElementById("ultraJumlah").value) || 1;
  const keyMode = (mode === "non") ? "non" : (mode === "single" ? "single" : "double");
  const pricePerBox = (HARGA[jenis] && HARGA[jenis][isi] && HARGA[jenis][isi][keyMode]) ? HARGA[jenis][isi][keyMode] : 0;
  const subTotal = pricePerBox * jumlah;
  const discount = 0;
  const grandTotal = subTotal - discount;
  document.getElementById("ultraPricePerBox").innerText = formatRp(pricePerBox);
  document.getElementById("ultraSubtotal").innerText = formatRp(subTotal);
  document.getElementById("ultraDiscount").innerText = discount ? `- ${formatRp(discount)}` : "-";
  document.getElementById("ultraGrandTotal").innerText = formatRp(grandTotal);
  return { pricePerBox, subTotal, discount, grandTotal };
}
document.querySelectorAll('#ultraIsi, #ultraJumlah, input[name="ultraJenis"], input[name="ultraToppingMode"]').forEach(el=>el.addEventListener('change', calcUltraPrice));
document.querySelectorAll('.ultraSingle, .ultraDouble').forEach(el=>el.addEventListener('change', calcUltraPrice));
window.addEventListener('load', calcUltraPrice);

document.getElementById("formUltra")?.addEventListener("submit", async function(e){
  e.preventDefault();
  const nama = document.getElementById("ultraNama").value.trim();
  let waRaw = document.getElementById("ultraWA").value.trim();
  if (!nama || !waRaw) { alert("Isi nama dan nomor WA"); return; }
  if (/^0/.test(waRaw)) waRaw = waRaw.replace(/^0/,'62');
  const jenis = document.querySelector('input[name="ultraJenis"]:checked')?.value || 'Original';
  const isi = Number(document.getElementById("ultraIsi").value);
  const mode = document.querySelector('input[name="ultraToppingMode"]:checked')?.value || 'non';
  const jumlah = Number(document.getElementById("ultraJumlah").value) || 1;
  const singleList = getCheckedValues('.ultraSingle');
  const doubleList = getCheckedValues('.ultraDouble');
  const calc = calcUltraPrice();
  const invoiceID = `PLA-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Date.now()).slice(-6)}`;
  const order = { invoiceID, createdAt: new Date().toISOString(), nama, buyerWA: waRaw, jenis, isiPerBox: isi, toppingMode: mode === 'non' ? 'Non Topping' : (mode === 'single' ? 'Single Topping' : 'Double Topping'), singleList: singleList.join(', '), doubleList: doubleList.join(', '), jumlahBox: jumlah, pricePerBox: calc.pricePerBox, subTotal: calc.subTotal, discount: calc.discount, grandTotal: calc.grandTotal };
  // buat nota sederhana di popup
  const notaHtml = `<div><strong>No. Invoice:</strong> ${order.invoiceID}</div><div><strong>Nama:</strong> ${order.nama}</div><div><strong>Total:</strong> ${formatRp(order.grandTotal)}</div>`;
  document.getElementById('notaContent').innerHTML = notaHtml;
  document.getElementById('notaContainer').style.display = 'flex';
  const waMessage = `Halo! Saya ingin memesan Pukis:\n- Nama: ${order.nama}\n- Jenis: ${order.jenis}\n- Topping: ${order.toppingMode}\n- Isi per Box: ${order.isiPerBox} pcs\n- Jumlah Box: ${order.jumlahBox}\n- Rasa: ${order.singleList || '-'}\n- Taburan: ${order.doubleList || '-'}\nTotal: ${formatRp(order.grandTotal)}\nNo. Invoice: ${order.invoiceID}\nNomor WA pembeli: ${order.buyerWA}\n`;
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(waMessage)}`, '_blank');
});
