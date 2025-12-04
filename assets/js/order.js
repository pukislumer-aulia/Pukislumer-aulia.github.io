// assets/js/order.js
(function(){
  'use strict';

  // read config from meta tags (so it's not hardcoded)
  function readMeta(name, fallback){
    var m = document.querySelector('meta[name="' + name + '"]');
    return (m && m.getAttribute('content')) ? m.getAttribute('content') : fallback;
  }

  var API_BASE = readMeta('api-base', '/api');
  var ADMIN_WA  = readMeta('admin-wa', '6281296668670');

  var SINGLE_TOPPINGS = ['Coklat','Tiramisu','Vanilla','Stroberi','Cappucino'];
  var DOUBLE_TABURAN   = ['Meses','Keju','Kacang','Choco Chip','Oreo'];

  var MAX_SINGLE = 5, MAX_DOUBLE_TOP = 5, MAX_DOUBLE_TAB = 5;

  var BASE_PRICE = {
    Original: {
      '5':  { non: 10000, single: 13000, double: 15000 },
      '10': { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      '5':  { non: 12000, single: 15000, double: 17000 },
      '10': { non: 21000, single: 28000, double: 32000 }
    }
  };

  // small helpers
  function $ (sel){ return document.querySelector(sel); }
  function $$ (sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function fmtRp(n){ return 'Rp ' + Number(n||0).toLocaleString('id-ID'); }
  function esc(s){ return String(s||'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  function nowISO(){ return (new Date()).toISOString(); }

  function genInvoice(){
    var d = new Date();
    var y = d.getFullYear(), m = ('0'+(d.getMonth()+1)).slice(-2), dd = ('0'+d.getDate()).slice(-2);
    var rand = Math.random().toString(36).substr(2,4).toUpperCase();
    return 'INV-' + y + m + dd + '-' + rand;
  }

  function buildToppingsUI(){
    var singleWrap = $('#ultraSingleGroup');
    var doubleWrap = $('#ultraDoubleGroup');
    if(!singleWrap || !doubleWrap) return;
    singleWrap.innerHTML = '';
    doubleWrap.innerHTML = '';

    for(var i=0;i<SINGLE_TOPPINGS.length;i++){
      var t = SINGLE_TOPPINGS[i];
      var id = 't_single_' + t.replace(/\s+/g,'_').toLowerCase();
      var lbl = document.createElement('label');
      lbl.style.display = 'block';
      lbl.style.margin = '4px 0';
      var inp = document.createElement('input'); inp.type = 'checkbox'; inp.name = 'topping'; inp.value = t; inp.id = id;
      lbl.appendChild(inp);
      lbl.appendChild(document.createTextNode(' ' + t));
      singleWrap.appendChild(lbl);
    }

    for(var j=0;j<DOUBLE_TABURAN.length;j++){
      var t2 = DOUBLE_TABURAN[j];
      var id2 = 't_tab_' + t2.replace(/\s+/g,'_').toLowerCase();
      var lbl2 = document.createElement('label');
      lbl2.style.display = 'block';
      lbl2.style.margin = '4px 0';
      var inp2 = document.createElement('input'); inp2.type='checkbox'; inp2.name='taburan'; inp2.value = t2; inp2.id = id2;
      lbl2.appendChild(inp2);
      lbl2.appendChild(document.createTextNode(' ' + t2));
      doubleWrap.appendChild(lbl2);
    }
  }

  function getSelected(name){
    var list = Array.prototype.slice.call(document.querySelectorAll('input[name="'+name+'"]:checked'));
    return list.map(function(i){ return i.value; });
  }
  function getRadio(name){
    var r = document.querySelector('input[name="'+name+'"]:checked');
    return r ? r.value : null;
  }

  function getIsi(){
    var el = document.getElementById('ultraIsi') || document.getElementById('ultraISI');
    return el ? el.value : '5';
  }

  function getJumlah(){
    var v = parseInt((document.getElementById('ultraJumlah') && document.getElementById('ultraJumlah').value) || '1',10);
    return isNaN(v) || v < 1 ? 1 : v;
  }

  function getPricePerBox(jenis, isi, mode){
    try {
      if (BASE_PRICE[jenis] && BASE_PRICE[jenis][isi]) {
        return BASE_PRICE[jenis][isi][mode] || 0;
      }
    } catch(e){}
    return 0;
  }

  function calcDiscount(jumlah, subtotal){
    if(jumlah >= 10) return 1000;
    if(jumlah >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePriceUI(){
    var jenis = getRadio('ultraJenis') || 'Original';
    var isi   = getIsi();
    var mode  = getRadio('ultraToppingMode') || 'non';
    var jumlah = getJumlah();
    // keep ultraISI in sync
    var ultraISIelem = document.getElementById('ultraISI');
    if(ultraISIelem) ultraISIelem.value = isi;

    var price = getPricePerBox(jenis, isi, mode);
    var subtotal = price * jumlah;
    var disc = calcDiscount(jumlah, subtotal);
    var total = subtotal - disc;

    var ePrice = document.getElementById('ultraPricePerBox');
    var eSub   = document.getElementById('ultraSubtotal');
    var eDisc  = document.getElementById('ultraDiscount');
    var eTotal = document.getElementById('ultraGrandTotal');

    if(ePrice) ePrice.textContent = fmtRp(price);
    if(eSub) eSub.textContent = fmtRp(subtotal);
    if(eDisc) eDisc.textContent = disc ? ('-' + fmtRp(disc)) : '-';
    if(eTotal) eTotal.textContent = fmtRp(total);

    return { price:price, subtotal:subtotal, discount:disc, total:total };
  }

  // Validation helpers
  function isDigitsOnly(s){
    return /^[0-9]+$/.test(String(s||''));
  }
  function normalizeWA(raw){
    if(!raw) return '';
    var t = String(raw).trim();
    // remove spaces and plus
    t = t.replace(/\s+/g,'').replace(/\+/g,'');
    if(t.indexOf('0') === 0) t = '62' + t.slice(1);
    // keep digits only
    t = t.replace(/\D/g,'');
    return t;
  }

  function buildOrderObject(){
    var nama = (document.getElementById('ultraNama') && document.getElementById('ultraNama').value) ? document.getElementById('ultraNama').value.trim() : '';
    var waRaw = (document.getElementById('ultraWA') && document.getElementById('ultraWA').value) ? document.getElementById('ultraWA').value.trim() : '';

    if(!nama){ alert('Nama harus diisi'); if(document.getElementById('ultraNama')) document.getElementById('ultraNama').focus(); return null; }
    if(!waRaw){ alert('WA harus diisi'); if(document.getElementById('ultraWA')) document.getElementById('ultraWA').focus(); return null; }

    var wa = normalizeWA(waRaw);
    if(wa.length < 8 || !isDigitsOnly(wa)){ alert('Nomor WA tidak valid. Gunakan angka, contoh: 0812xxxx atau +62812xxxx'); return null; }

    var jenis = getRadio('ultraJenis') || 'Original';
    var isi   = getIsi();
    var mode  = getRadio('ultraToppingMode') || 'non';
    var topping = getSelected('topping');
    var taburan = getSelected('taburan');
    var jumlah = getJumlah();
    var note = (document.getElementById('ultraNote') && document.getElementById('ultraNote').value) ? document.getElementById('ultraNote').value.trim() : '';

    // Validation: if mode single or double must choose at least one topping
    if((mode === 'single' || mode === 'double') && (!topping || topping.length === 0)){
      if(!confirm('Anda memilih mode topping "'+mode+'" tetapi belum memilih topping. Lanjutkan tanpa topping?')) return null;
    }

    // Limits
    if(topping && topping.length > ((mode==='single')?MAX_SINGLE:MAX_DOUBLE_TOP)){
      alert('Jumlah topping melebihi batas.');
      return null;
    }
    if(taburan && taburan.length > MAX_DOUBLE_TAB){
      alert('Jumlah taburan melebihi batas.');
      return null;
    }

    var priceObj = updatePriceUI();
    var invoice = genInvoice();

    return {
      invoice:invoice,
      nama:nama,
      wa:wa,
      jenis:jenis,
      isi:isi,
      mode:mode,
      topping:topping,
      taburan:taburan,
      jumlah:jumlah,
      pricePerBox:priceObj.price,
      subtotal:priceObj.subtotal,
      discount:priceObj.discount,
      total:priceObj.total,
      note:note,
      createdAt: nowISO()
    };
  }

  // Save fallback locally
  function saveFallback(order){
    try{
      var key = 'pukisOrdersFallback_v1';
      var arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push(order);
      localStorage.setItem(key, JSON.stringify(arr));
    }catch(e){ console.error('fallback save failed', e); }
  }

  // send to server with fetch; return saved order or throw
  function sendToServer(order){
    return new Promise(function(resolve,reject){
      try{
        var xhr = new XMLHttpRequest();
        xhr.open('POST', API_BASE + '/orders', true);
        xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
        xhr.timeout = 10000;
        xhr.onreadystatechange = function(){
          if(xhr.readyState !== 4) return;
          if(xhr.status >=200 && xhr.status < 300){
            try{
              var json = JSON.parse(xhr.responseText || '{}');
              resolve(json.order || order);
            }catch(e){ resolve(order); }
          } else {
            reject(new Error('API error ' + xhr.status));
          }
        };
        xhr.ontimeout = function(){ reject(new Error('timeout')); };
        xhr.onerror = function(){ reject(new Error('network error')); };
        xhr.send(JSON.stringify(order));
      }catch(err){ reject(err); }
    });
  }

  function sendWAtoAdmin(order){
    var lines = [
      "Assalamu'alaikum Admin 🙏",
      "Ada pesanan baru:",
      "",
      "Invoice : " + order.invoice,
      "Nama    : " + order.nama,
      "WA      : " + order.wa,
      "Jenis   : " + order.jenis,
      "Isi     : " + order.isi + " pcs",
      "Mode    : " + order.mode,
      "Topping : " + (order.topping && order.topping.length ? order.topping.join(', ') : '-'),
      "Taburan : " + (order.taburan && order.taburan.length ? order.taburan.join(', ') : '-'),
      "Jumlah  : " + order.jumlah + " box",
      "Catatan : " + (order.note || '-'),
      "",
      "Total Bayar: " + fmtRp(order.total)
    ];
    // open new tab/window for WA; do not navigate user's current tab
    window.open('https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank');
  }

  function sendWAtoCustomer(order){
    try{
      var text = 'Halo ' + order.nama + ', terima kasih sudah pesan. Invoice: ' + order.invoice + '. Total: ' + fmtRp(order.total) + '.';
      window.open('https://wa.me/' + order.wa + '?text=' + encodeURIComponent(text), '_blank');
    }catch(e){}
  }

  function renderNota(order){
    var c = document.getElementById('notaContent');
    if(!c) return;
    var tText = (order.topping && order.topping.length) ? esc(order.topping.join(', ')) : '-';
    var tabText = (order.taburan && order.taburan.length) ? esc(order.taburan.join(', ')) : '-';
    c.innerHTML = '<div><strong>Invoice:</strong> '+esc(order.invoice)+'</div>'
                + '<div><strong>Nama:</strong> '+esc(order.nama)+'</div>'
                + '<div><strong>WA:</strong> '+esc(order.wa)+'</div>'
                + '<div><strong>Jenis:</strong> '+esc(order.jenis)+' — '+esc(String(order.isi))+' pcs</div>'
                + '<div><strong>Mode:</strong> '+esc(order.mode)+'</div>'
                + '<div><strong>Topping:</strong> '+tText+'</div>'
                + '<div><strong>Taburan:</strong> '+tabText+'</div>'
                + '<div><strong>Jumlah:</strong> '+esc(String(order.jumlah))+' box</div>'
                + '<div><strong>Total Bayar:</strong> '+fmtRp(order.total)+'</div>';
    var overlay = document.getElementById('notaContainer');
    if(overlay){ overlay.style.display = 'flex'; overlay.setAttribute('aria-hidden','false'); }
    window._pendingOrder = order;
  }

  function hideNota(){
    var overlay = document.getElementById('notaContainer');
    if(overlay){ overlay.style.display = 'none'; overlay.setAttribute('aria-hidden','true'); }
    try{ delete window._pendingOrder; }catch(e){}
  }

  // submit handler
  function onFormSubmit(e){
    if(e && e.preventDefault) e.preventDefault();
    var order = buildOrderObject();
    if(!order) return;
    renderNota(order);
  }

  function onNotaConfirm(){
    var pending = window._pendingOrder;
    if(!pending) return alert('Tidak ada pesanan tertunda.');
    // send to server, but always open WA admin and customer (so admin gets notified)
    sendToServer(pending).then(function(saved){
      sendWAtoAdmin(saved);
      sendWAtoCustomer(saved);
    }).catch(function(err){
      // fallback: save locally then send WA
      saveFallback(pending);
      sendWAtoAdmin(pending);
      sendWAtoCustomer(pending);
    }).finally(function(){ hideNota(); });
  }

  function onSendAdminQuick(){
    var order = buildOrderObject();
    if(!order) return;
    sendToServer(order).then(function(saved){
      sendWAtoAdmin(saved);
    }).catch(function(){
      saveFallback(order);
      sendWAtoAdmin(order);
    });
  }

  // attach events
  function attach(){
    buildToppingsUI();
    updatePriceUI();

    var form = document.getElementById('formUltra');
    if(form) form.addEventListener('submit', onFormSubmit);

    var btnQuick = document.getElementById('ultraSendAdmin');
    if(btnQuick) btnQuick.addEventListener('click', onSendAdminQuick);

    var btnConfirm = document.getElementById('notaConfirm');
    if(btnConfirm) btnConfirm.addEventListener('click', onNotaConfirm);

    var btnClose = document.getElementById('notaClose');
    if(btnClose) btnClose.addEventListener('click', hideNota);

    // topping mode change
    var radios = document.getElementsByName('ultraToppingMode');
    for(var i=0;i<radios.length;i++){
      (function(r){
        r.addEventListener('change', function(){
          var mode = getRadio('ultraToppingMode') || 'non';
          var s = document.getElementById('ultraSingleGroup');
          var d = document.getElementById('ultraDoubleGroup');
          if(s) s.style.display = (mode === 'non') ? 'none' : 'block';
          if(d) d.style.display = (mode === 'double') ? 'block' : 'none';
          // uncheck all
          var allT = document.getElementsByName('topping');
          for(var j=0;j<allT.length;j++) allT[j].checked = false;
          var allTab = document.getElementsByName('taburan');
          for(var k=0;k<allTab.length;k++) allTab[k].checked = false;
          updatePriceUI();
        });
      })(radios[i]);
    }

    // dynamic change listeners
    var inputs = ['ultraJumlah','ultraIsi'];
    for(var ii=0; ii<inputs.length; ii++){
      var el = document.getElementById(inputs[ii]);
      if(el) el.addEventListener('input', updatePriceUI);
    }

    document.addEventListener('change', function(e){
      if(!e || !e.target) return;
      var name = e.target.name;
      if(name === 'topping'){
        var list = getSelected('topping');
        var mode = getRadio('ultraToppingMode') || 'non';
        if(mode === 'single' && list.length > MAX_SINGLE){ e.target.checked = false; alert('Maksimal '+MAX_SINGLE+' topping untuk mode Single.'); }
        if(mode === 'double' && list.length > MAX_DOUBLE_TOP){ e.target.checked = false; alert('Maksimal '+MAX_DOUBLE_TOP+' topping untuk mode Double.'); }
      }
      if(name === 'taburan'){
        var tlist = getSelected('taburan');
        if(tlist.length > MAX_DOUBLE_TAB){ e.target.checked = false; alert('Maksimal '+MAX_DOUBLE_TAB+' taburan.'); }
      }
      updatePriceUI();
    }, false);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();

})();
