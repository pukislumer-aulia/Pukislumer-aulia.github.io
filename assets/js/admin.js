/*
  assets/js/admin.js — FINAL LOCK (AUTO PRICE + MANUAL FORM)
  PUKIS LUMER AULIA

  ✔ AUTO HARGA MANUAL FORM
  ✔ ISI PER BOX 5 / 10
  ✔ JENIS: ORIGINAL / PANDAN
  ✔ NON / SINGLE / DOUBLE
  ✔ TOPPING & TABURAN SYNC
  ✔ PDF A4 STABIL
  ✔ ADMIN STORAGE SAMA DENGAN ORDER.JS

  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(() => {
  'use strict';

  const ADMIN_PIN = '030419';
  const STORAGE_KEY = 'pukisOrders';

  /* ===== HARGA SAMA PERSIS DENGAN ORDER.JS ===== */
  const BASE_PRICE = {
    Original: {
      '5':  { non: 10000, single: 13000, double: 15000 },
      '10': { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      '5':  { non: 12000, single: 15000, double: 17000 },
      '10': { non: 21000, single: 28000, double: 32000 }
    }
  };

  const $ = id => document.getElementById(id);
  const $$ = q => Array.from(document.querySelectorAll(q));
  const rp = n => (Number(n) || 0).toLocaleString('id-ID');
  const pad4 = n => String(n).padStart(4, '0');

  /* ================= LOGIN ================= */
  function loginAdmin() {
    if ($('pin').value !== ADMIN_PIN) {
      alert('PIN salah');
      $('pin').value = '';
      return;
    }
    $('login').style.display = 'none';
    $('admin').style.display = 'block';
    loadAdmin();
  }

  /* ================= STORAGE ================= */
  const getOrders = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const saveOrders = o =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));

  /* ================= AUTO HARGA MANUAL ================= */
  function calcManualPrice() {
    const jenis = $$('input[name="mJenisPukis"]:checked')[0]?.value || 'Original';
    const isi   = $('mIsi')?.value || '5';
    const mode  = $('mMode')?.value || 'non';
    const qty   = Math.max(1, parseInt($('mQty')?.value || '1', 10));

    const perBox = BASE_PRICE[jenis]?.[isi]?.[mode] || 0;
    const subtotal = perBox * qty;

    const discount =
      qty >= 10 ? 1000 :
      qty >= 5 ? Math.round(subtotal * 0.01) : 0;

    const total = subtotal - discount;

    $('mTotal').value = total;
    $('mInfoHarga').innerHTML =
      `Harga/Box: Rp ${rp(perBox)}<br>
       Subtotal: Rp ${rp(subtotal)}<br>
       Diskon: ${discount ? '-Rp ' + rp(discount) : '-'}`;

    return total;
  }

  /* ================= TAMBAH MANUAL ================= */
  window.addManualOrder = function () {
    const nama = $('mNama').value.trim();
    const waRaw = $('mWa').value.trim();
    if (!nama || !waRaw) return alert('Nama & WA wajib');

    let wa = waRaw.replace(/\D/g,'');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (wa.startsWith('8')) wa = '62' + wa;

    const jenis = $$('input[name="mJenisPukis"]:checked')[0].value;
    const isi   = $('mIsi').value;
    const mode  = $('mMode').value;
    const qty   = parseInt($('mQty').value,10) || 1;

    const topping =
      mode !== 'non'
        ? $('mTopping').value.split(',').map(x=>x.trim()).filter(Boolean)
        : [];

    const taburan =
      mode === 'double'
        ? $('mTaburan').value.split(',').map(x=>x.trim()).filter(Boolean)
        : [];

    if (mode === 'single' && topping.length === 0)
      return alert('Single wajib topping');

    if (mode === 'double' && (topping.length === 0 || taburan.length === 0))
      return alert('Double wajib topping & taburan');

    const total = calcManualPrice();

    const orders = getOrders();
    orders.push({
      invoice: 'INV-' + Date.now(),
      tgl: new Date().toISOString(),
      nama,
      wa,
      jenis,
      isi,
      mode,
      single: mode === 'single' ? topping : [],
      double: mode === 'double' ? topping : [],
      taburan,
      qty,
      total,
      catatan: $('mCatatan').value || '-',
      status: 'pending'
    });

    saveOrders(orders);
    loadAdmin();
    alert('Pesanan manual tersimpan');
  };

  /* ================= LOAD TABLE ================= */
  function loadAdmin() {
    const orders = getOrders();
    const tbody = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '';

    orders.forEach((o,i)=>{
      tbody.innerHTML += `
        <tr>
          <td>${new Date(o.tgl).toLocaleString('id-ID')}</td>
          <td>${o.invoice}</td>
          <td>${o.nama}</td>
          <td>${o.wa}</td>
          <td>${o.jenis} / ${o.isi}pcs / ${o.mode}</td>
          <td>${o.qty}</td>
          <td>Rp ${rp(o.total)}</td>
          <td>
            <select onchange="updateStatus(${i},this.value)">
              <option value="pending"${o.status==='pending'?' selected':''}>pending</option>
              <option value="selesai"${o.status==='selesai'?' selected':''}>selesai</option>
            </select>
          </td>
          <td><button onclick="printPdf(${i})">PDF</button></td>
        </tr>`;
    });

    renderStats(orders);
  }

  window.updateStatus = (i,s)=>{
    const o=getOrders();
    o[i].status=s;
    saveOrders(o);
    loadAdmin();
  };

  /* ================= PDF ================= */
  window.printPdf = function(i){
    const o=getOrders()[i];
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF('p','mm','a4');
    const antri=pad4(i+1);

    doc.setFontSize(16);
    doc.text('PUKIS LUMER AULIA',105,15,{align:'center'});

    doc.setFontSize(10);
    doc.text(`Invoice : ${o.invoice}`,14,25);
    doc.text(`Nama    : ${o.nama}`,14,31);
    doc.text(`WA      : ${o.wa}`,14,37);
    doc.text(`Tanggal : ${new Date(o.tgl).toLocaleString('id-ID')}`,140,25);
    doc.text(`No Antri: ${antri}`,140,31);

    doc.autoTable({
      startY:45,
      theme:'grid',
      head:[['KETERANGAN','DETAIL']],
      body:[
        ['Jenis Pukis',o.jenis],
        ['Isi per Box',o.isi+' pcs'],
        ['Jenis Pesanan',o.mode.toUpperCase()],
        ['Topping',(o.single||o.double||[]).join(', ')||'-'],
        ['Taburan',(o.taburan||[]).join(', ')||'-'],
        ['Jumlah',o.qty+' Box'],
        ['Total','Rp '+rp(o.total)]
      ],
      styles:{fontSize:10},
      headStyles:{fillColor:[16,32,51],textColor:255}
    });

    doc.save(o.invoice+'.pdf');
  };

  /* ================= STATS ================= */
  function renderStats(o){
    let t=0;
    const n=new Date();
    o.forEach(x=>{
      const d=new Date(x.tgl);
      if(x.status==='selesai'&&d.getMonth()===n.getMonth())
        t+=Number(x.total||0);
    });
    $('stats').innerHTML=`<b>Total Pendapatan Bulan Ini:</b> Rp ${rp(t)}`;
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded',()=>{
    $('btnLogin').onclick=loginAdmin;
    $$('input,select').forEach(i=>i.addEventListener('change',calcManualPrice));
  });

})();
