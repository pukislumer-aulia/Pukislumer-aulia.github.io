/* assets/js/script.js */
/* Testimoni + Admin logic (improved) */

(function(){
  'use strict';

  // === Utilities ===
  function $id(id){ return document.getElementById(id); }
  function nowStr(){ return new Date().toLocaleString('id-ID'); }
  function readMeta(name, fallback){ var m = document.querySelector('meta[name="'+name+'"]'); return (m && m.getAttribute('content'))? m.getAttribute('content') : fallback; }
  var API_BASE = readMeta('api-base','/api');

  // === Broadcast for same-browser tabs ===
  var bc = null;
  try { if (typeof BroadcastChannel !== 'undefined') bc = new BroadcastChannel('pukis_channel'); } catch(e){ bc = null; }

  function broadcast(msg){
    try{ if(bc) bc.postMessage(msg); } catch(e){}
  }

  // === Testimoni storage & sync ===
  var TESTI_KEY = 'pukisTestimoni_v2';

  function loadTestimoniLocal(){
    try { return JSON.parse(localStorage.getItem(TESTI_KEY) || '[]'); } catch(e){ return []; }
  }
  function saveTestimoniLocal(list){
    try{ localStorage.setItem(TESTI_KEY, JSON.stringify(list)); broadcast({type:'testimoni:update'}); } catch(e){}
  }

  function mergeUniqueTests(remoteList){
    var local = loadTestimoniLocal();
    var map = {};
    for(var i=0;i<local.length;i++){ map[(local[i].nama||'') + '|' + (local[i].pesan||'')] = local[i]; }
    for(var j=0;j<remoteList.length;j++){
      var key = (remoteList[j].nama||'') + '|' + (remoteList[j].pesan||'');
      if(!map[key]) local.unshift(remoteList[j]);
    }
    saveTestimoniLocal(local);
    return local;
  }

  function renderTestimoni(){
    var wrap = $id('testimoniList');
    if(!wrap) return;
    var list = loadTestimoniLocal();
    wrap.innerHTML = '';
    if(list.length === 0){
      wrap.innerHTML = '<p>Belum ada testimoni.</p>';
      return;
    }
    for(var i=0;i<list.length;i++){
      var t = list[i];
      var div = document.createElement('div');
      div.className = 'testi-card';
      div.innerHTML = '<div class="testi-name">'+escapeHtml(t.nama)+'</div>'
                    + '<div class="testi-text">'+escapeHtml(t.pesan)+'</div>'
                    + '<div class="testi-date" style="font-size:12px;color:#666;">'+(t.tanggal||'')+'</div>';
      wrap.appendChild(div);
    }
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

  // Try fetch testimonials from server (if available)
  function fetchRemoteTesti(){
    try{
      var xhr = new XMLHttpRequest();
      xhr.open('GET', API_BASE + '/testimonials', true);
      xhr.timeout = 8000;
      xhr.onreadystatechange = function(){
        if(xhr.readyState !== 4) return;
        if(xhr.status >= 200 && xhr.status < 300){
          try{
            var json = JSON.parse(xhr.responseText || '[]');
            if(Array.isArray(json)) mergeUniqueTests(json);
            renderTestimoni();
          }catch(e){}
        } else {
          renderTestimoni();
        }
      };
      xhr.send(null);
    }catch(e){
      renderTestimoni();
    }
  }

  // Try to push a testimonial to server; fallback to local only
  function pushTestiToServer(obj){
    try{
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_BASE + '/testimonials', true);
      xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
      xhr.timeout = 8000;
      xhr.onreadystatechange = function(){
        if(xhr.readyState !== 4) return;
        // we don't strictly require server to be successful; if ok, try merge
        if(xhr.status >= 200 && xhr.status < 300){
          try{
            var json = JSON.parse(xhr.responseText || '{}');
            // if server returns list or the saved item, we'll attempt to merge/fetch
            fetchRemoteTesti();
          }catch(e){}
        }
      };
      xhr.send(JSON.stringify(obj));
    }catch(e){}
  }

  // Export / Import helpers for admin/user
  function exportTestimoni(){
    var list = loadTestimoniLocal();
    var data = JSON.stringify(list, null, 2);
    var blob = new Blob([data], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'testimoni-pukis.json';
    a.click();
  }

  function importTestimoni(file, cb){
    var r = new FileReader();
    r.onload = function(){
      try{
        var json = JSON.parse(String(r.result || '[]'));
        if(Array.isArray(json)){
          mergeUniqueTests(json);
          renderTestimoni();
          if(cb) cb(true);
        } else { if(cb) cb(false); }
      }catch(e){ if(cb) cb(false); }
    };
    r.readAsText(file);
  }

  // === Admin auth (improved) ===
  // Strategy:
  // 1) Try server auth: POST /api/admin/auth { pin }
  // 2) If server not available, fallback to local hashed PIN:
  //    - If no local hash exists => create PIN (ask admin to set one) (first-run)
  //    - If exists => compare hash (SHA-256)
  // This way PIN is not in plaintext in source.

  function sha256hex(str, cb){
    // try using SubtleCrypto; fallback to simple JS hash (not cryptographically secure) if unavailable
    if(window.crypto && window.crypto.subtle && window.TextEncoder){
      var enc = new TextEncoder();
      window.crypto.subtle.digest('SHA-256', enc.encode(str)).then(function(hash){
        var hex = Array.prototype.map.call(new Uint8Array(hash), function(b){ return ('00' + b.toString(16)).slice(-2); }).join('');
        cb(hex);
      }).catch(function(){
        cb(simpleHashHex(str));
      });
    } else {
      cb(simpleHashHex(str));
    }
  }
  function simpleHashHex(s){
    // simple non-crypto fallback (fast), used only if subtle is not present
    var h = 2166136261 >>> 0;
    for(var i=0;i<s.length;i++){ h = Math.imul(h ^ s.charCodeAt(i), 16777619); }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  var ADMIN_PIN_KEY = 'pukis_admin_pin_hash_v1';

  function serverAuth(pin, cb){
    try{
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_BASE + '/admin/auth', true);
      xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
      xhr.timeout = 7000;
      xhr.onreadystatechange = function(){
        if(xhr.readyState !== 4) return;
        if(xhr.status >= 200 && xhr.status < 300){
          try{
            var json = JSON.parse(xhr.responseText || '{}');
            cb(true, json);
          }catch(e){ cb(true); }
        } else {
          cb(false);
        }
      };
      xhr.send(JSON.stringify({ pin: pin }));
    }catch(e){ cb(false); }
  }

  function localAuthFlow(pin, successCb, failCb){
    sha256hex(pin, function(hash){
      var stored = localStorage.getItem(ADMIN_PIN_KEY);
      if(!stored){
        // first-run: ask to confirm PIN creation
        if(!confirm('Tidak ada PIN admin lokal. Simpan PIN ini sebagai PIN lokal? (OK = simpan)')){ if(failCb) failCb(); return; }
        localStorage.setItem(ADMIN_PIN_KEY, hash);
        if(successCb) successCb();
        return;
      }
      if(stored === hash){ if(successCb) successCb(); else {} }
      else { if(failCb) failCb(); }
    });
  }

  function tryAuthenticate(pin, onSuccess, onFail){
    // Try server auth first
    serverAuth(pin, function(ok, data){
      if(ok){
        if(onSuccess) onSuccess(data || true);
      } else {
        // fallback to local
        localAuthFlow(pin, onSuccess, onFail);
      }
    });
  }

  // === UI binding ===
  document.addEventListener('DOMContentLoaded', function(){
    // testimoni form
    var f = $id('form-testimoni');
    if(f){
      f.addEventListener('submit', function(e){
        e.preventDefault();
        var nama = ($id('namaTesti') && $id('namaTesti').value) ? $id('namaTesti').value.trim() : '';
        var pesan = ($id('pesanTesti') && $id('pesanTesti').value) ? $id('pesanTesti').value.trim() : '';
        if(!nama || !pesan){ alert('Nama dan testimoni wajib diisi'); return; }
        var obj = { nama:nama, pesan:pesan, tanggal: nowStr() };
        // save locally + broadcast + try push to server
        var list = loadTestimoniLocal();
        list.unshift(obj);
        saveTestimoniLocal(list);
        renderTestimoni();
        pushTestiToServer(obj);
        f.reset();
        alert('Terima kasih! Testimoni terkirim.');
      });
    }

    // export / import
    var eb = $id('exportTesti');
    if(eb) eb.addEventListener('click', function(){ exportTestimoni(); });

    // import via drag-drop or file input (optional)
    // fetch remote testi on load
    fetchRemoteTesti();

    // broadcast listener
    if(bc){
      bc.onmessage = function(evt){
        try{
          var d = evt.data;
          if(d && d.type === 'testimoni:update') renderTestimoni();
        }catch(e){}
      };
    }

    renderTestimoni();

    // ADMIN UI
    var loginBtn = $id('loginBtn');
    if(loginBtn){
      loginBtn.addEventListener('click', function(){
        var pinVal = ($id('pinInput') && $id('pinInput').value) ? $id('pinInput').value : '';
        if(!pinVal){ alert('Masukkan PIN'); return; }
        tryAuthenticate(pinVal, function(){
          // success
          if($id('loginScreen')) $id('loginScreen').style.display = 'none';
          if($id('adminPanel')) $id('adminPanel').style.display = 'block';
          if(typeof loadOrders === 'function') loadOrders();
        }, function(){
          alert('PIN salah');
        });
      });
    }

    // logout button
    if($id('logoutBtn')){
      $id('logoutBtn').addEventListener('click', function(){
        localStorage.removeItem('adminLogged');
        // do not remove local PIN hash (admin still can login)
        location.reload();
      });
    }

    // import file handler (optional)
    var fileInput = $id('importTestiInput');
    if(fileInput){
      fileInput.addEventListener('change', function(e){
        var f = (e.target.files && e.target.files[0]) ? e.target.files[0] : null;
        if(!f) return;
        importTestimoni(f, function(ok){
          if(ok) alert('Import berhasil'); else alert('Import gagal');
        });
      });
    }

  }, false);

})();
