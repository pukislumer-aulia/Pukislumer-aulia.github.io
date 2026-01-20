/* ==================================================
   ADMIN PANEL — FINAL LOCK
   PUKIS LUMER AULIA
   ⚠️ JANGAN DIUBAH TANPA AUDIT
================================================== */
(() => {
  'use strict';

  const ADMIN_PIN = '030419';
  const STORAGE_KEY = 'pukisOrders';

  const $ = id => document.getElementById(id);
  const rp = n => (Number(n)||0).toLocaleString('id-ID');

  /* LOGIN */
  function loginAdmin(){
    const pin = $('pin').value;
    if (pin !== ADMIN_PIN){
      alert('PIN salah');
      $('pin').value = '';
      return;
    }
    $('login').style.display = 'none';
    $('admin').style.display = 'block';
    loadAdmin();
  }

  /* LOAD TABLE */
  function loadAdmin(){
    const orders = getOrders();
    const tbody = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '';

    orders.forEach((o,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(o.tgl).toLocaleString()}</td>
        <td>${o.invoice}</td>
        <td>${o.nama}</td>
        <td>${o.wa}</td>
        <td>${o.mode}</td>
        <td>${o.qty}</td>
        <td>Rp ${rp(o.total)}</td>
        <td>
          <select onchange="updateStatus(${i}, this.value)">
            <option value="pending" ${o.status==='pending'?'selected':''}>pending</option>
            <option value="selesai" ${o.status==='selesai'?'selected':''}>selesai</option>
            <option value="dibatalkan" ${o.status==='dibatalkan'?'selected':''}>dibatalkan</option>
          </select>
        </td>
        <td>
          <button onclick="printPdf(${i})">PDF</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderStats(orders);
  }

  /* STORAGE */
  function getOrders(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||[] }
    catch{ return [] }
  }

  function saveOrders(o){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  }

  /* STATUS */
  window.updateStatus = function(i,status){
    const o = getOrders();
    if(!o[i]) return;
    o[i].status = status;
    saveOrders(o);
    loadAdmin();
  }

  /* PDF */
  window.printPdf = function(i){
    const o = getOrders()[i];
    if(!o) return alert('Data tidak ditemukan');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('PUKIS LUMER AULIA',105,15,{align:'center'});
    doc.autoTable({
      startY:25,
      head:[['Keterangan','Detail']],
      body:[
        ['Invoice',o.invoice],
        ['Nama',o.nama],
        ['WA',o.wa],
        ['Jenis',o.mode],
        ['Jumlah',o.qty],
        ['Total','Rp '+rp(o.total)]
      ]
    });

    doc.save(o.invoice+'.pdf');
  }

  /* STATS */
  function renderStats(orders){
    const now = new Date();
    let total = 0;

    orders.forEach(o=>{
      if(o.status==='selesai'){
        const d = new Date(o.tgl);
        if(d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()){
          total += Number(o.total||0);
        }
      }
    });

    $('stats').innerHTML = `
      <b>Total Pendapatan Bulan Ini:</b>
      Rp ${rp(total)}
    `;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    $('btnLogin').onclick = loginAdmin;
  });

})();
