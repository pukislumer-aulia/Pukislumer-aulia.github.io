/* assets/js/order.js — Order logic (safe to include; will no-op if elements missing) */
(function(){
  'use strict';

  // quick guard: if no form present, no-op (allows including file on any page)
  const form = document.getElementById('formUltra');
  if (!form) return;

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // config
  const ADMIN_WA = '6281296668670';
  const SINGLE_TOPPINGS = ['Meses','Keju','Kacang','Choco Chip','Oreo','Tiramisu','Vanilla','Stroberi'];
  const DOUBLE_TABURAN = ['Meses','Keju','Kacang','Choco Chip','Oreo'];
  const BASE_PRICE = {
    Original: { '5': { non: 10000, single: 13000, double: 15000 }, '10': { non: 18000, single: 25000, double: 28000 } },
    Pandan:   { '5': { non: 12000, single: 15000, double: 17000 }, '10': { non: 21000, single: 28000, double: 32000 } }
  };
  const MAX_SINGLE = 5, MAX_DOUBLE_TOPP = 5, MAX_DOUBLE_TAB = 5;

  // elements
  const elSingle = $('#ultraSingleGroup');
  const elDouble = $('#ultraDoubleGroup');
  const elJenis = $('input[name="ultraJenis"]');
  const elMode = $('input[name="ultraToppingMode"]');
  const elIsi = $('#ultraIsi');
  const elJumlah = $('#ultraJumlah');
  const elNama = $('#ultraNama');
  const elWA = $('#ultraWA');
  const elNote = $('#ultraNote');

  const elPriceBox = $('#ultraPricePerBox');
  const elSubtotal = $('#ultraSubtotal');
  const elDiscount = $('#ultraDiscount');
  const elGrand = $('#ultraGrandTotal');

  const btnSubmit = $('#ultraSubmit');
  const btnSendAdmin = $('#ultraSendAdmin');

  const notaContainer = $('#notaContainer');
  const notaContent = $('#notaContent');
  const notaClose = $('#notaClose');
  const notaPrint = $('#notaPrint');

  // helpers
  function formatRp(n){ const v = Number(n||0); if (Number.isNaN(v)) return 'Rp0'; return 'Rp ' + v.toLocaleString('id-ID'); }
  function getSelectedRadio(name){ const r = document.querySelector(`input[name="${name}"]:checked`); return r? r.value : null; }

  // Build toppings UI
  function buildToppings(){
    if (!elSingle || !elDouble) return;
    elSingle.innerHTML = '';
    elDouble.innerHTML = '';
    SINGLE_TOPPINGS.forEach(t=>{
      const id = 'topping_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label'); lab.className = 'topping-check'; lab.htmlFor = id;
      const input = document.createElement('input'); input.type='checkbox'; input.id=id; input.name='topping'; input.value=t;
      input.addEventListener('change', ()=>{ lab.classList.toggle('checked', input.checked); updatePriceUI(); });
      const span = document.createElement('span'); span.textContent = t;
      lab.appendChild(input); lab.appendChild(span); elSingle.appendChild(lab);
    });

    DOUBLE_TABURAN.forEach(t=>{
      const id = 'taburan_' + t.toLowerCase().replace(/\s+/g,'_');
      const lab = document.createElement('label'); lab.className = 'taburan-check'; lab.htmlFor = id;
      const input = document.createElement('input'); input.type='checkbox'; input.id=id; input.name='taburan'; input.value=t;
      input.addEventListener('change', ()=>{ lab.classList.toggle('checked', input.checked); updatePriceUI(); });
      const span = document.createElement('span'); span.textContent = t;
      lab.appendChild(input); lab.appendChild(span); elDouble.appendChild(lab);
    });
  }

  // price logic
  function getPricePerBox(jenis,isi,mode){
    jenis = jenis || 'Original'; isi = String(isi||'5'); mode = (mode||'non').toLowerCase();
    try { return (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi] && BASE_PRICE[jenis][isi][mode]) || 0; } catch(e){return 0;}
  }
  function calcDiscount(jumlah,subtotal){
    if (jumlah>=10) return 1000;
    if (jumlah>=5) return Math.round(subtotal*0.01);
    return 0;
  }

  function updatePriceUI(){
    const jenis = getSelectedRadio('ultraJenis') || 'Original';
    const isi = elIsi ? elIsi.value : '5';
    const mode = getSelectedRadio('ultraToppingMode') || 'non';
    const jumlah = elJumlah ? parseInt(elJumlah.value || '1',10) : 1;
    const price = getPricePerBox(jenis,isi,mode);
    const subtotal = price * jumlah;
    const discount = calcDiscount(jumlah,subtotal);
    const total = subtotal - discount;

    if (elPriceBox) elPriceBox.textContent = formatRp(price);
    if (elSubtotal) elSubtotal.textContent = formatRp(subtotal);
    if (elDiscount) elDiscount.textContent = discount > 0 ? '-' + formatRp(discount) : '-';
    if (elGrand) elGrand.textContent = formatRp(total);
  }

  // get selected topping arrays
  function getToppings(){ return Array.from(document.querySelectorAll('input[name="topping"]:checked')).map(i=>i.value); }
  function getTaburans(){ return Array.from(document.querySelectorAll('input[name="taburan"]:checked')).map(i=>i.value); }

  // show/hide topping groups based on mode
  function updateToppingVisibility(){
    const mode = getSelectedRadio('ultraToppingMode') || 'non';
    if (elSingle) elSingle.style.display = (mode === 'non') ? 'none' : 'flex';
    if (elDouble) elDouble.style.display = (mode === 'double') ? 'flex' : (mode === 'single' ? 'none' : 'none');

    // reset selections when turning off
    if (mode === 'non'){
      $$('input[name="topping"]:checked').forEach(i=>{ i.checked=false; i.closest('label')?.classList.remove('checked'); });
      $$('input[name="taburan"]:checked').forEach(i=>{ i.checked=false; i.closest('label')?.classList.remove('checked'); });
    }
  }

  // build order object + validation
  function buildOrder(){
    const nama = elNama ? elNama.value.trim() : '';
    const waRaw = elWA ? elWA.value.trim() : '';
    if (!nama){ alert('Nama harus diisi'); elNama?.focus(); return null; }
    if (!waRaw){ alert('Nomor WA harus diisi'); elWA?.focus(); return null; }
    const digits = waRaw.replace(/\D/g,'');
    if (digits.length < 9){ alert('Nomor WA tampak tidak valid'); elWA?.focus(); return null; }
    let wa = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (/^8\d{6,}$/.test(wa)) wa = '62' + wa;

    const jenis = getSelectedRadio('ultraJenis') || 'Original';
    const isi = elIsi ? elIsi.value : '5';
    const mode = getSelectedRadio('ultraToppingMode') || 'non';
    const jumlah = elJumlah ? parseInt(elJumlah.value || '1',10) : 1;
    const topping = getToppings();
    const taburan = getTaburans();
    const pricePerBox = getPricePerBox(jenis,isi,mode);
    const subtotal = pricePerBox * jumlah;
    const discount = calcDiscount(jumlah, subtotal);
    const total = subtotal - discount;
    const note = elNote ? elNote.value.trim() : '';

    // enforce limits
    if (mode === 'single' && topping.length > MAX_SINGLE){ alert(`Maksimal ${MAX_SINGLE} topping pada mode Single`); return null; }
    if (mode === 'double' && (topping.length > MAX_DOUBLE_TOPP || taburan.length > MAX_DOUBLE_TAB)){ alert(`Maksimal ${MAX_DOUBLE_TOPP} topping & ${MAX_DOUBLE_TAB} taburan pada mode Double`); return null; }

    const invoice = 'INV-' + Date.now();
    const order = { invoice, nama, wa, jenis, isi, mode, topping, taburan, jumlah, pricePerBox, subtotal, discount, total, note, tgl: new Date().toLocaleString('id-ID') };
    return order;
  }

  // render nota
  function renderNota(order){
    if (!notaContent || !notaContainer) return;
    const toppingText = order.topping.length ? order.topping.join(', ') : '-';
    const tabText = order.taburan.length ? order.taburan.join(', ') : '-';
    notaContent.innerHTML = `
      <div class="nota-row">
        <div><strong>Invoice:</strong> ${escapeHtml(order.invoice)}</div>
        <div><strong>Nama:</strong> ${escapeHtml(order.nama)}</div>
        <div><strong>WA:</strong> ${escapeHtml(order.wa)}</div>
        <div><strong>Tanggal:</strong> ${escapeHtml(order.tgl)}</div>
      </div>
      <hr/>
      <div><strong>Jenis / Isi:</strong> ${escapeHtml(order.jenis)} — ${escapeHtml(order.isi)} pcs</div>
      <div><strong>Mode:</strong> ${escapeHtml(order.mode)}</div>
      <div><strong>Topping:</strong> ${escapeHtml(toppingText)}</div>
      <div><strong>Taburan:</strong> ${escapeHtml(tabText)}</div>
      <div><strong>Jumlah:</strong> ${escapeHtml(String(order.jumlah))} box</div>
      <div><strong>Harga Satuan:</strong> ${formatRp(order.pricePerBox)}</div>
      <div><strong>Subtotal:</strong> ${formatRp(order.subtotal)}</div>
      <div><strong>Diskon:</strong> ${order.discount>0 ? '-' + formatRp(order.discount) : '-'}</div>
      <div style="font-weight:800;margin-top:8px"><strong>Total Bayar:</strong> ${formatRp(order.total)}</div>
      <p style="font-style:italic;margin-top:10px">Terima kasih telah berbelanja di Pukis Lumer Aulia.</p>
    `;
    notaContainer.classList.add('show');
    notaContainer.style.display = 'flex';
    try { localStorage.setItem('lastOrder', JSON.stringify(order)); } catch(e){}
    window._lastOrder = order;
  }

  // send WA to admin (opens wa)
  function sendWA(order){
    const admin = ADMIN_WA;
    if (!admin){ alert('Nomor admin belum tersedia'); return; }
    const lines = [
      "Assalamu'alaikum Admin 🙏",
      "Ada pesanan baru:",
      `Invoice: ${order.invoice}`,
      `Nama: ${order.nama}`,
      `WA: ${order.wa}`,
      `Jenis: ${order.jenis}`,
      `Isi: ${order.isi} pcs`,
      `Mode: ${order.mode}`,
      `Topping: ${order.topping.length ? order.topping.join(', ') : '-'}`,
      `Taburan: ${order.taburan.length ? order.taburan.join(', ') : '-'}`,
      `Jumlah: ${order.jumlah} box`,
      `Catatan: ${order.note || '-'}`,
      `Total: ${formatRp(order.total)}`,
      '',
      'Mohon bantu proses. Terima kasih'
    ];
    const url = `https://wa.me/${admin}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  }

  // PDF hook (uses window.generatePdf if exists)
  async function printNota(){
    const last = window._lastOrder || JSON.parse(localStorage.getItem('lastOrder') || 'null');
    if (!last){ alert('Belum ada order terakhir. Buat nota terlebih dahulu.'); return; }
    if (typeof window.generatePdf === 'function'){ await window.generatePdf(last); } else { alert('PDF generator tidak tersedia. Pastikan jsPDF dimuat.'); }
  }

  // util
  function escapeHtml(s){ return String(s||'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c])); }

  // listeners
  // build initial state
  buildToppings();
  updateToppingVisibility();
  updatePriceUI();

  // radio changes (delegated)
  $$('input[name="ultraToppingMode"]').forEach(r => r.addEventListener('change', () => { updateToppingVisibility(); updatePriceUI(); }));
  $$('input[name="ultraJenis"]').forEach(r => r.addEventListener('change', updatePriceUI));
  if (elIsi) elIsi.addEventListener('change', updatePriceUI);
  if (elJumlah) elJumlah.addEventListener('input', updatePriceUI);

  if (form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const order = buildOrder();
      if (!order) return;
      try { const arr = JSON.parse(localStorage.getItem('orders') || '[]'); arr.push(order); localStorage.setItem('orders', JSON.stringify(arr)); } catch(e){}
      renderNota(order);
    });
  }

  if (btnSendAdmin){
    btnSendAdmin.addEventListener('click', (e)=>{
      e.preventDefault();
      const order = buildOrder();
      if (!order) return;
      try { const arr = JSON.parse(localStorage.getItem('orders') || '[]'); arr.push(order); localStorage.setItem('orders', JSON.stringify(arr)); } catch(e){}
      sendWA(order);
    });
  }

  if (notaClose) notaClose.addEventListener('click', ()=>{ notaContainer.classList.remove('show'); notaContainer.style.display='none'; });
  if (notaPrint) notaPrint.addEventListener('click', (e)=>{ e.preventDefault(); printNota(); });

})();
