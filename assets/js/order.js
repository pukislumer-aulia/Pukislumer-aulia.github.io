// public/assets/js/order.js
(function(){
  const ADMIN_WA = '6281296668670';
  const API_BASE = '/api';
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
  function formatRp(n){ if (!n) return 'Rp0'; return 'Rp ' + Number(n).toLocaleString('id-ID'); }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function genInvoiceClient(){ const d = new Date(); const y=d.getFullYear(), mm=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); const rand = Math.random().toString(36).substring(2,6).toUpperCase(); return `INV-${y}${mm}${dd}-${rand}`; }

  // build topping UI
  function buildToppings(){
    const singleWrap = $('#ultraSingleGroup');
    const doubleWrap = $('#ultraDoubleGroup');
    singleWrap.innerHTML = ''; doubleWrap.innerHTML = '';
    SINGLE_TOPPINGS.forEach(t => {
      const id = 't_single_' + t.replace(/\s+/g,'_');
      const label = document.createElement('label'); label.className='topping-check';
      const input = document.createElement('input'); input.type='checkbox'; input.name='topping'; input.value=t; input.id=id;
      label.appendChild(input); label.appendChild(document.createTextNode(' ' + t));
      singleWrap.appendChild(label);
    });
    DOUBLE_TABURAN.forEach(t => {
      const id = 't_tab_' + t.replace(/\s+/g,'_');
      const label = document.createElement('label'); label.className='topping-check';
      const input = document.createElement('input'); input.type='checkbox'; input.name='taburan'; input.value=t; input.id=id;
      label.appendChild(input); label.appendChild(document.createTextNode(' ' + t));
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
    $('#ultraPricePerBox').textContent = formatRp(pricePerBox);
    $('#ultraSubtotal').textContent = formatRp(subtotal);
    $('#ultraDiscount').textContent = discount ? '-' + formatRp(discount) : '-';
    $('#ultraGrandTotal').textContent = formatRp(total);
    return { pricePerBox, subtotal, discount, total };
  }

  function buildOrderObject(){
    const nama = ($('#ultraNama')||{}).value?.trim();
    const waRaw = ($('#ultraWA')||{}).value?.trim();
    if (!nama){ alert('Nama harus diisi'); ($('#ultraNama')||{}).focus(); return null; }
    if (!waRaw){ alert('WA harus diisi'); ($('#ultraWA')||{}).focus(); return null; }
    let wa = waRaw.replace(/\s+/g,'').replace(/\+/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    const jenis = getRadioValue('ultraJenis') || 'Original';
    const isi = getIsi();
    const mode = getRadioValue('ultraToppingMode') || 'non';
    const topping = getSelected('topping');
    const taburan = getSelected('taburan');
    const jumlah = getJumlah();
    const note = ($('#ultraNote')||{}).value||'';
    const priceObj = updatePriceUI();
    const invoice = genInvoiceClient();
    return {
      invoice, nama, wa, jenis, isi, mode, topping, taburan,
      jumlah, pricePerBox: priceObj.pricePerBox, subtotal: priceObj.subtotal,
      discount: priceObj.discount, total: priceObj.total, note
    };
  }

  // Fallback local storage save (if API down)
  function saveFallback(order){
    try{
      const key = 'pukisOrdersFallback';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push(Object.assign({ savedAt: new Date().toISOString(), fallback: true }, order));
      localStorage.setItem(key, JSON.stringify(arr));
    }catch(e){
      console.error('fallback save failed', e);
    }
  }

  // send to server API
  async function sendToServer(order){
    try{
      const res = await fetch(API_BASE + '/orders', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(order)
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=>null);
        throw new Error('API error: ' + (txt || res.status));
      }
      const json = await res.json();
      return json.order;
    }catch(err){
      console.warn('sendToServer failed', err);
      throw err;
    }
  }

  // send WA to admin (open wa.me)
  function sendWAtoAdmin(order){
    const lines = [
      "Assalamu'alaikum Admin 🙏",
      "Ada pesanan baru:",
      "",
      `Invoice : ${order.invoice}`,
      `Nama    : ${order.nama}`,
      `WA      : ${order.wa}`,
      `Jenis   : ${order.jenis}`,
      `Isi     : ${order.isi} pcs`,
      `Mode    : ${order.mode}`,
      `Topping : ${order.topping && order.topping.length ? order.topping.join(', ') : '-'}`,
      `Taburan : ${order.taburan && order.taburan.length ? order.taburan.join(', ') : '-'}`,
      `Jumlah  : ${order.jumlah} box`,
      `Catatan : ${order.note || '-'}`,
      "",
      `Total Bayar: ${formatRp(order.total)}`,
      "",
      `Buka admin: ${location.origin}/admin.html?invoice=${encodeURIComponent(order.invoice)}`
    ];
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }

  // send WA to customer (pre-filled)
  function sendWAToCustomer(order){
    const lines = [
      `Halo ${order.nama}, terima kasih sudah pesan di Pukis Lumer Aulia.`,
      `Invoice: ${order.invoice}`,
      `Total Bayar: ${formatRp(order.total)}`,
      `Silakan lakukan konfirmasi pembayaran jika sudah transfer.`
    ];
    window.open(`https://wa.me/${order.wa.replace(/\D/g,'')}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }

  // render nota popup
  function renderNota(order){
    const c = $('#notaContent');
    if (!c) return;
    c.innerHTML = `
      <div><strong>Invoice:</strong> ${escapeHtml(order.invoice)}</div>
      <div><strong>Nama:</strong> ${escapeHtml(order.nama)}</div>
      <div><strong>WA:</strong> ${escapeHtml(order.wa)}</div>
      <div><strong>Jenis:</strong> ${escapeHtml(order.jenis)} — ${escapeHtml(order.isi)} pcs</div>
      <div><strong>Mode:</strong> ${escapeHtml(order.mode)}</div>
      <div><strong>Topping:</strong> ${escapeHtml(order.topping.join(', ') || '-')}</div>
      <div><strong>Taburan:</strong> ${escapeHtml(order.taburan.join(', ') || '-')}</div>
      <div><strong>Jumlah:</strong> ${order.jumlah} box</div>
      <div><strong>Total:</strong> ${formatRp(order.total)}</div>
      <div><strong>Catatan:</strong> ${escapeHtml(order.note || '-')}</div>
    `;
    const overlay = $('#notaContainer');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    window._pendingOrder = order;
  }

  function hideNota(){ const overlay = $('#notaContainer'); if (!overlay) return; overlay.classList.remove('show'); overlay.setAttribute('aria-hidden','true'); }

  // event handlers
  async function onFormSubmit(e){
    e.preventDefault();
    const order = buildOrderObject();
    if (!order) return;
    renderNota(order);
  }

  async function onNotaConfirm(e){
    e.preventDefault();
    const pending = window._pendingOrder;
    if (!pending) return alert('Tidak ada pesanan tertunda.');
    // try server
    try{
      const serverOrder = await sendToServer(pending);
      // success -> open admin WA + open admin page
      sendWAtoAdmin(serverOrder);
      window.open('/admin.html?invoice=' + encodeURIComponent(serverOrder.invoice), '_blank');
      alert('Pesanan berhasil dikirim ke server dan WA admin dibuka.');
      hideNota();
    }catch(err){
      // fallback: save local and open WA
      saveFallback(pending);
      sendWAtoAdmin(pending);
      window.open('/admin.html?invoice=' + encodeURIComponent(pending.invoice), '_blank');
      alert('Gagal menghubungi server. Pesanan disimpan sementara di local (fallback) dan WA admin dibuka.');
      hideNota();
    }
  }

  async function onSendAdminShortcut(e){
    e.preventDefault();
    const order = buildOrderObject();
    if (!order) return;
    try{
      const serverOrder = await sendToServer(order);
      sendWAtoAdmin(serverOrder);
      window.open('/admin.html?invoice=' + encodeURIComponent(serverOrder.invoice), '_blank');
      alert('Pesanan tersimpan dan WA admin dibuka.');
    }catch(err){
      saveFallback(order);
      sendWAtoAdmin(order);
      window.open('/admin.html?invoice=' + encodeURIComponent(order.invoice), '_blank');
      alert('Server error. Pesanan disimpan lokal sebagai cadangan dan WA admin dibuka.');
    }
  }

  // attach listeners & init
  function attach(){
    buildToppings();
    updatePriceUI();
    $$('input[name="ultraToppingMode"]').forEach(i => i.addEventListener('change', ()=>{
      const mode = getRadioValue('ultraToppingMode');
      if (mode === 'non'){ $('#ultraSingleGroup').style.display='none'; $('#ultraDoubleGroup').style.display='none'; $$('input[name="topping"]').forEach(c=>c.checked=false); $$('input[name="taburan"]').forEach(c=>c.checked=false); }
      else if (mode === 'single'){ $('#ultraSingleGroup').style.display='flex'; $('#ultraDoubleGroup').style.display='none'; }
      else { $('#ultraSingleGroup').style.display='flex'; $('#ultraDoubleGroup').style.display='flex'; }
      updatePriceUI();
    }));
    $$('input[name="ultraJenis"]').forEach(i => i.addEventListener('change', updatePriceUI));
    $('#ultraIsi').addEventListener('change', updatePriceUI);
    $('#ultraJumlah').addEventListener('input', updatePriceUI);
    $('#formUltra').addEventListener('submit', onFormSubmit);
    $('#notaConfirm').addEventListener('click', onNotaConfirm);
    $('#notaClose').addEventListener('click', hideNota);
    $('#ultraSendAdmin').addEventListener('click', onSendAdminShortcut);

    // top/bottom checkbox constraints
    document.addEventListener('change', function(e){
      if (!e.target) return;
      if (e.target.name === 'topping'){
        const mode = getRadioValue('ultraToppingMode');
        const checked = getSelected('topping') || [];
        if (mode === 'single' && checked.length > MAX_SINGLE){ e.target.checked = false; alert(`Maksimal ${MAX_SINGLE} topping untuk mode Single.`); }
        if (mode === 'double' && checked.length > MAX_DOUBLE_TOP){ e.target.checked = false; alert(`Maksimal ${MAX_DOUBLE_TOP} topping untuk mode Double.`); }
      }
      if (e.target.name === 'taburan'){
        const checked = getSelected('taburan') || [];
        if (checked.length > MAX_DOUBLE_TAB){ e.target.checked = false; alert(`Maksimal ${MAX_DOUBLE_TAB} taburan.`); }
      }
      updatePriceUI();
    });
  }

  // expose for tests
  window._PL = { genInvoiceClient, updatePriceUI, buildOrderObject };

  document.addEventListener('DOMContentLoaded', attach);
})();
