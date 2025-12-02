/* =================================================
   assets/js/admin-edit.js
   Halaman edit: load by invoice query, simpan kembali
   ================================================= */
(function(){
  'use strict';

  const STORAGE_KEY = 'pukisOrders';
  const $ = s => document.querySelector(s);

  function loadOrders(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ console.error(e); return []; }
  }
  function saveOrders(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr || [])); }

  function qParam(k){
    const p = new URLSearchParams(window.location.search);
    return p.get(k);
  }

  function findOrder(invoice){
    const arr = loadOrders();
    return arr.find(o => (o.invoice || o.orderID) === invoice);
  }

  function updateOrder(updated){
    const arr = loadOrders().map(o => {
      if ((o.invoice || o.orderID) === (updated.invoice || updated.orderID)){
        return updated;
      }
      return o;
    });
    saveOrders(arr);
  }

  function init(){
    const invoice = qParam('invoice');
    if (!invoice) { alert('Invoice tidak ditemukan'); window.location.href='admin.html'; return; }

    const order = findOrder(invoice);
    if (!order) { alert('Pesanan tidak ditemukan'); window.location.href='admin.html'; return; }

    // bind fields
    $('#editInvoice').value = order.invoice || order.orderID || '';
    $('#editNama').value = order.nama || '';
    $('#editWA').value = order.wa || '';
    $('#editJenis').value = order.jenis || 'Original';
    $('#editIsi').value = order.isi || '5';
    $('#editMode').value = order.mode || 'non';
    $('#editJumlah').value = order.jumlah || 1;
    $('#editNote').value = order.note || '';
    $('#editStatus').value = order.status || 'Pending';

    $('#backBtn').addEventListener('click', ()=> window.location.href='admin.html');
    $('#cancelBtn').addEventListener('click', ()=> window.location.href='admin.html');

    $('#editForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        invoice: $('#editInvoice').value,
        nama: $('#editNama').value.trim(),
        wa: $('#editWA').value.trim(),
        jenis: $('#editJenis').value,
        isi: $('#editIsi').value,
        mode: $('#editMode').value,
        jumlah: parseInt($('#editJumlah').value) || 1,
        note: $('#editNote').value,
        status: $('#editStatus').value,
        tgl: new Date().toLocaleString('id-ID'),
        total: (function(){
          // recalc basic price logic:
          const isiVal = Number($('#editIsi').value);
          let base = isiVal === 5 ? 10000 : 20000;
          if ($('#editMode').value === 'single') base += 2000;
          if ($('#editMode').value === 'double') base += 4000;
          return base * (parseInt($('#editJumlah').value)||1);
        })()
      };

      updateOrder(updated);
      alert('Perubahan tersimpan');
      window.location.href = 'admin.html';
    });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
