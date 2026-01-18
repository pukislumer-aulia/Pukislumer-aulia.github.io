/*
  assets/js/order.js — FINAL STABLE
  Sinkron 100% dengan HTML saat ini
*/

(function () {
  'use strict';

  /* ================= CONFIG ================= */
  const ADMIN_WA = '6281296668670';

  const BASE_PRICE = {
    Original: {
      '5': { non: 10000, single: 13000, double: 15000 },
      '10': { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      '5': { non: 12000, single: 15000, double: 17000 },
      '10': { non: 21000, single: 28000, double: 32000 }
    }
  };

  /* ================= HELPERS ================= */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  /* ================= READ FORM ================= */
  const getRadio = n => $(`input[name="${n}"]:checked`)?.value || null;
  const getIsi = () => $('#ultraIsi')?.value || '5';
  const getJumlah = () => Math.max(1, parseInt($('#ultraJumlah')?.value || '1', 10));

  const getChecked = name =>
    $$(`input[name="${name}"]:checked`).map(i => i.value);

  /* ================= TOPPING VISIBILITY ================= */
  function syncTopping() {
    const mode = getRadio('ultraToppingMode');
    $('#ultraSingleGroup')?.classList.toggle('show', mode === 'single');
    $('#ultraDoubleGroup')?.classList.toggle('show', mode === 'double');
  }

  /* ================= PRICE ================= */
  function updatePrice() {
    const jenis = getRadio('ultraJenis') || 'Original';
    const isi = getIsi();
    const mode = getRadio('ultraToppingMode') || 'non';
    const qty = getJumlah();

    const perBox = BASE_PRICE[jenis]?.[isi]?.[mode] || 0;
    const subtotal = perBox * qty;
    const discount = qty >= 10 ? 1000 : qty >= 5 ? Math.round(subtotal * 0.01) : 0;
    const total = subtotal - discount;

    $('#ultraPricePerBox').textContent = rp(perBox);
    $('#ultraSubtotal').textContent = rp(subtotal);
    $('#ultraDiscount').textContent = discount ? '-' + rp(discount) : '-';
    $('#ultraGrandTotal').textContent = rp(total);

    return { perBox, subtotal, discount, total };
  }

  /* ================= BUILD ORDER ================= */
  function buildOrder() {
    const nama = $('#ultraNama').value.trim();
    const waRaw = $('#ultraWA').value.trim();

    if (!nama) return alert('Nama wajib diisi'), null;
    if (!waRaw) return alert('No. WA wajib diisi'), null;

    let wa = waRaw.replace(/\D/g, '');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (wa.startsWith('8')) wa = '62' + wa;

    const mode = getRadio('ultraToppingMode') || 'non';
    const single = getChecked('toppingSingle');
    const double = getChecked('toppingDouble');
    const taburan = getChecked('taburan');

    if (mode === 'single' && single.length === 0)
      return alert('Pilih topping single'), null;

    if (mode === 'double' && double.length === 0)
      return alert('Pilih topping double'), null;

    const price = updatePrice();

    return {
      invoice: 'INV-' + Date.now(),
      nama,
      wa,
      jenis: getRadio('ultraJenis'),
      isi: getIsi(),
      mode,
      single,
      double,
      taburan,
      jumlah: getJumlah(),
      total: price.total
    };
  }

  /* ================= NOTA ================= */
  let currentOrder = null;

  function showNota(o) {
    $('#notaContent').innerHTML = `
      <b>Invoice:</b> ${o.invoice}<br>
      <b>Nama:</b> ${o.nama}<br>
      <b>Total:</b> ${rp(o.total)}
    `;
    $('#notaContainer').style.display = 'flex';
  }

  function hideNota() {
    $('#notaContainer').style.display = 'none';
  }

  /* ================= EVENTS ================= */
  function submitForm(e) {
    e.preventDefault();
    const o = buildOrder();
    if (!o) return;
    currentOrder = o;
    showNota(o);
  }

  function sendWA() {
    if (!currentOrder) return;
    const msg =
      `Invoice: ${currentOrder.invoice}\n` +
      `Nama: ${currentOrder.nama}\n` +
      `Total: ${rp(currentOrder.total)}`;
    window.open(
      `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
    hideNota();
    $('#formUltra').reset();
    syncTopping();
    updatePrice();
    currentOrder = null;
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded', () => {
    syncTopping();
    updatePrice();

    $$('input[name="ultraJenis"]').forEach(i => i.onchange = updatePrice);
    $$('input[name="ultraToppingMode"]').forEach(i => i.onchange = () => {
      syncTopping();
      updatePrice();
    });

    $$('input[type="checkbox"]').forEach(i => i.onchange = updatePrice);
    $('#ultraIsi').onchange = updatePrice;
    $('#ultraJumlah').oninput = updatePrice;

    $('#formUltra').onsubmit = submitForm;
    $('#sendToAdmin').onclick = sendWA;
    $('#notaClose').onclick = hideNota;
  });

})();
