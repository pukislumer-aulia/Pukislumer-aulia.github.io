// assets/js/order.js
(function(){
  'use strict';
  // Nomor admin distandarkan ke format internasional (tanpa leading +)
  const ADMIN_WA = '6281296668670'; // <-- sesuai nomor 081296668670 => 6281296668670

  const SINGLE_TOPPINGS = ['Coklat','Tiramisu','Vanilla','Stroberi','Cappucino'];
  const DOUBLE_TABURAN = ['Meses','Keju','Kacang','Choco Chip','Oreo'];
  const MAX_SINGLE = 5, MAX_DOUBLE_TOP = 5, MAX_DOUBLE_TAB = 5;
  const BASE_PRICE = {
    Original: { '5': { non: 10000, single: 13000, double: 15000 }, '10': { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { '5': { non: 12000, single: 15000, double: 17000 }, '10': { non: 21000, single: 28000, double: 32000 } }
  };

  // helpers
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  function formatRp(n){ if (!n && n !== 0) return 'Rp0'; return 'Rp ' + Number(n||0).toLocaleString('id-ID'); }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function genInvoiceClient(){ const d = new Date(); const y=d.getFullYear(), mm=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); const rand = Math.random().toString(36).substring(2,6).toUpperCase(); return `INV-${y}${mm}${dd}-${rand}`; }

  // build topping UI
  function buildToppings(){
    const singleWrap = $('#ultraSingleGroup');
    const doubleWrap = $('#ultraDoubleGroup');
    if (!singleWrap || !doubleWrap) return;
    singleWrap.innerHTML = ''; doubleWrap.innerHTML = '';
    SINGLE_TOPPINGS.forEach(t => {
      const id = 't_single_' + t.replace(/\s+/g,'_').toLowerCase();
      const label = document.createElement('label');
      label.className = 'topping-check single';
      label.setAttribute('for', id);
      const input = document.createElement('input'); input.type='checkbox'; input.name='topping'; input.value=t; input.id=id;
      label.appendChild(input);
      const span = document.createElement('span'); span.textContent = ' ' + t;
      label.appendChild(span);
      singleWrap.appendChild(label);
    });
    DOUBLE_TABURAN.forEach(t => {
      const id = 't_tab_' + t.replace(/\s+/g,'_').toLowerCase();
      const label = document.createElement('label');
      label.className = 'topping-check double';
      label.setAttribute('for', id);
      const input = document.createElement('input'); input.type='checkbox'; input.name='taburan'; input.value=t; input.id=id;
      label.appendChild(input);
      const span = document.createElement('span'); span.textContent = ' ' + t;
      label.appendChild(span);
      doubleWrap.appendChild(label);
    });
  }

  function getSelected(name){ return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i=>i.value); }
  function getRadioValue(name){ const r = document.querySelector(`input[name="${name}"]:checked`); return r? r.value : null; }
  function getIsi(){ const el = $('#ultraIsi'); return el ? el.value : '5'; }
  function getJumlah(){ const el = $('#ultraJumlah'); const v = parseInt(el.value,10); return isNaN(v)||v<1?1:v; }
  function getPricePerBox(jenis, isi, mode){
    jenis = jenis || 'Original'; isi = String(isi || '5'); mode = (mode||'non').toLowerCase();
    try{ return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0; } catch(e){ return 0; }
  }
  function calcDiscount(jumlah, subtotal){
    if (jumlah >= 10) return 1000;
    if (jumlah >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePriceUI(){
    const jenis = getRadioValue('ultraJenis') || 'Original';
    const isi = getIsi();
    const mode = getRadioValue('ultraToppingMode') || 'non';
    const jumlah = getJumlah();
    const pricePerBox = getPricePerBox(jenis, isi, mode);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;
    const elPrice = $('#ultraPricePerBox'); if (elPrice) elPrice.textContent = formatRp(pricePerBox);
    const elSub = $('#ultraSubtotal'); if (elSub) elSub.textContent = formatRp(subtotal);
    const elDisc = $('#ultraDiscount'); if (elDisc) elDisc.textContent = discount ? '-' + formatRp(discount) : '-';
    const elTotal = $('#ultraGrandTotal'); if (elTotal) elTotal.textContent = formatRp(total);
    return { pricePerBox, subtotal, discount, total };
  }

  function buildOrderObjectForSave(){
    const nama = ($('#ultraNama')||{}).value?.trim();
    const waRaw = ($('#ultraWA')||{}).value?.trim();
    if (!nama){ alert('Nama harus diisi'); ($('#ultraNama')||{}).focus(); return null; }
    if (!waRaw){ alert('WA harus diisi'); ($('#ultraWA')||{}).focus(); return null; }
    let wa = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    const jenis = getRadioValue('ultraJenis') || 'Original';
    const isi = getIsi();
    const mode = getRadioValue('ultraToppingMode') || 'non';
    const jumlah = getJumlah();
    const note = ($('#ultraNote')||{}).value?.trim() || '';
    const single = getSelected('topping');
    const taburan = getSelected('taburan');
    const price = updatePriceUI();
    const invoice = genInvoiceClient();
    return {
      invoice, nama, wa, jenis, isi, mode, jumlah, note, single, taburan,
      pricePerBox: price.pricePerBox, subtotal: price.subtotal, discount: price.discount, total: price.total,
      status: 'pending', createdAt: new Date().toISOString()
    };
  }

  function saveOrderToLocal(order){
    try{
      const key = 'pukis_orders';
      const all = JSON.parse(localStorage.getItem(key) || '[]');
      all.unshift(order);
      localStorage.setItem(key, JSON.stringify(all));
      return true;
    }catch(e){ console.error(e); return false; }
  }

  function openWaToAdmin(order){
    const txt = [];
    txt.push(`INVOICE: ${order.invoice}`);
    txt.push(`Nama: ${order.nama}`);
    txt.push(`WA: ${order.wa}`);
    txt.push(`Jumlah Box: ${order.jumlah} (Isi ${order.isi})`);
    txt.push(`Jenis: ${order.jenis}`);
    txt.push(`Mode Topping: ${order.mode}`);
    if (order.single && order.single.length) txt.push(`Single: ${order.single.join(', ')}`);
    if (order.taburan && order.taburan.length) txt.push(`Taburan: ${order.taburan.join(', ')}`);
    if (order.note) txt.push(`Catatan: ${order.note}`);
    txt.push(`Subtotal: ${formatRp(order.subtotal)}`);
    txt.push(`Diskon: ${order.discount? formatRp(order.discount) : '-' }`);
    txt.push(`Total: ${formatRp(order.total)}`);
    txt.push(`\nSilakan konfirmasi nomor invoice dan total. Terima kasih.`);
    const encoded = encodeURIComponent(txt.join('\n'));
    const waUrl = `https://wa.me/${ADMIN_WA}?text=${encoded}`;
    window.open(waUrl, '_blank');
  }

  // UI: show nota popup
  function showNotaPopup(htmlContent){
    const container = $('#notaContainer');
    const content = $('#notaContent');
    if (!container || !content) return;
    content.innerHTML = htmlContent;
    container.style.display = 'flex';
    container.setAttribute('aria-hidden','false');
  }

  function hideNotaPopup(){
    const container = $('#notaContainer');
    if (!container) return;
    container.style.display = 'none';
    container.setAttribute('aria-hidden','true');
  }

  // build display nota HTML
  function renderNotaHtml(order){
    const parts = [];
    parts.push(`<div><strong>Invoice:</strong> ${escapeHtml(order.invoice)}</div>`);
    parts.push(`<div><strong>Nama:</strong> ${escapeHtml(order.nama)}</div>`);
    parts.push(`<div><strong>WA:</strong> ${escapeHtml(order.wa)}</div>`);
    parts.push(`<div><strong>Jumlah:</strong> ${order.jumlah} box (Isi ${order.isi})</div>`);
    parts.push(`<div><strong>Jenis:</strong> ${escapeHtml(order.jenis)}</div>`);
    parts.push(`<div><strong>Mode Topping:</strong> ${escapeHtml(order.mode)}</div>`);
    if (order.single && order.single.length) parts.push(`<div><strong>Single:</strong> ${escapeHtml(order.single.join(', '))}</div>`);
    if (order.taburan && order.taburan.length) parts.push(`<div><strong>Taburan:</strong> ${escapeHtml(order.taburan.join(', '))}</div>`);
    if (order.note) parts.push(`<div><strong>Catatan:</strong> ${escapeHtml(order.note)}</div>`);
    parts.push(`<div style="margin-top:8px"><strong>Total:</strong> ${formatRp(order.total)}</div>`);
    return parts.join('');
  }

  // Attach events
  function attachUi(){
    buildToppings();
    // price update on changes
    ['#ultraJumlah','#ultraIsi','input[name="ultraJenis"]','input[name="ultraToppingMode"]'].forEach(sel=>{
      document.addEventListener('change', function(e){
        if (e.target && (e.target.matches(sel) || (sel.startsWith('input[') && e.target.name && e.target.name.indexOf(sel.replace(/.*name=\"|\".*/g,''))>-1))){
          updatePriceUI();
        }
      });
    });

    // also update when topping checkboxes change
    document.addEventListener('change', function(e){ if (e.target && (e.target.name==='topping' || e.target.name==='taburan')) updatePriceUI(); });

    // Cek Pesanan button
    const btn = $('#ultraSubmit');
    if (btn) btn.addEventListener('click', function(ev){
      ev.preventDefault();
      const order = buildOrderObjectForSave();
      if (!order) return;
      const html = renderNotaHtml(order);
      showNotaPopup(html);
    });

    // modal close
    const close = $('#notaClose'); if (close) close.addEventListener('click', hideNotaPopup);
    // confirm (Buat Pesanan)
    const confirmBtn = $('#notaConfirm'); if (confirmBtn) confirmBtn.addEventListener('click', function(){
      const order = buildOrderObjectForSave();
      if (!order) return;
      const ok = saveOrderToLocal(order);
      if (!ok){ alert('Gagal menyimpan pesanan. Coba lagi.'); return; }
      // open WA admin for validation
      openWaToAdmin(order);
      hideNotaPopup();
      // show success message to buyer
      alert('Terima kasih! Pesananmu telah dikirim untuk validasi. Admin akan menghubungi melalui WA.');
      // reset form lightly
      document.getElementById('formUltra').reset();
      updatePriceUI();
    });

    // close on overlay click (optional)
    const container = $('#notaContainer'); if (container) container.addEventListener('click', function(e){ if (e.target===container) hideNotaPopup(); });

    // init price UI
    updatePriceUI();
  }

  // init on DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachUi); else attachUi();

})();
