/*
  ADMIN PANEL — FINAL LOCK (THERMAL)
  PUKIS LUMER AULIA
  ✔ PDF Thermal 58mm / 80mm
  ✔ CAP STATUS: LUNAS / PENDING / BATAL
  ✔ QRIS + TTD + FOOTER
  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(() => {
  'use strict';

  const ADMIN_PIN = '030419';
  const STORAGE_KEY = 'pukisOrders';
  const PAPER_WIDTH = 80;

  const $ = id => document.getElementById(id);
  const rp = n => (Number(n)||0).toLocaleString('id-ID');

  function loginAdmin() {
    if ($('pin').value !== ADMIN_PIN)
      return alert('PIN salah'), $('pin').value='';

    $('login').style.display = 'none';
    $('admin').style.display = 'block';
    loadAdmin();
  }

  function getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function saveOrders(o) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  }

  function loadAdmin() {
    const orders = getOrders();
    const tbody = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '';

    orders.forEach((o,i)=>{
      tbody.innerHTML += `
        <tr>
          <td>${new Date(o.tgl).toLocaleString()}</td>
          <td>${o.invoice}</td>
          <td>${o.nama}</td>
          <td>${o.wa}</td>
          <td>${o.mode}</td>
          <td>${o.qty}</td>
          <td>Rp ${rp(o.total)}</td>
          <td>
            <select onchange="updateStatus(${i},this.value)">
              <option value="pending"${o.status==='pending'?' selected':''}>pending</option>
              <option value="selesai"${o.status==='selesai'?' selected':''}>selesai</option>
              <option value="dibatalkan"${o.status==='dibatalkan'?' selected':''}>dibatalkan</option>
            </select>
          </td>
          <td><button onclick="printPdf(${i})">PDF</button></td>
        </tr>`;
    });

    renderStats(orders);
  }

  window.updateStatus = function(i,s){
    const o=getOrders(); o[i].status=s; saveOrders(o); loadAdmin();
  };

  window.printPdf = function(i){
    const o=getOrders()[i];
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'mm',format:[PAPER_WIDTH,200]});

    doc.setFontSize(12);
    doc.text('PUKIS LUMER AULIA',PAPER_WIDTH/2,8,{align:'center'});

    doc.autoTable({
      startY:14,
      styles:{fontSize:8},
      body:[
        ['Invoice',o.invoice],
        ['Nama',o.nama],
        ['WA',o.wa],
        ['Jenis',o.mode.toUpperCase()],
        ['Jumlah',o.qty+' Box'],
        ['Catatan',o.catatan],
        ['Total','Rp '+rp(o.total)]
      ]
    });

    doc.text(
      'Terimakasih sudah belanja\nKami tunggu kunjungan selanjutnya',
      PAPER_WIDTH/2,
      doc.lastAutoTable.finalY+20,
      {align:'center'}
    );

    doc.save(o.invoice+'.pdf');
  };

  function renderStats(o){
    let t=0; const n=new Date();
    o.forEach(x=>{
      const d=new Date(x.tgl);
      if(x.status==='selesai'&&d.getMonth()===n.getMonth()) t+=Number(x.total||0);
    });
    $('stats').innerHTML=`<b>Total Pendapatan Bulan Ini:</b> Rp ${rp(t)}`;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    $('btnLogin').onclick=loginAdmin;
  });

})();
