/*
  ADMIN PANEL — FINAL LOCK (THERMAL)
  PUKIS LUMER AULIA

  ✔ RESET SEMUA PESANAN
  ✔ WATERMARK: LUNAS / PENDING
  ✔ PDF THERMAL 80mm
  ✔ QRIS + TTD + FOOTER
  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(() => {
  'use strict';

  const ADMIN_PIN   = '030419';
  const STORAGE_KEY = 'pukisOrders';
  const PAPER_WIDTH = 80;
  const PAGE_HEIGHT = 260;

  const $  = id => document.getElementById(id);
  const rp = n => (Number(n)||0).toLocaleString('id-ID');

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
  function getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function saveOrders(o) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  }

  /* ================= RESET SEMUA ================= */
  function resetAllOrders() {
    if (!confirm('Yakin hapus SEMUA pesanan?')) return;
    localStorage.removeItem(STORAGE_KEY);
    loadAdmin();
    alert('Semua pesanan berhasil dihapus');
  }

  /* ================= LOAD ADMIN ================= */
  function loadAdmin() {
    const orders = getOrders();
    const tbody  = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '';

    orders.forEach((o,i)=>{
      tbody.innerHTML += `
        <tr>
          <td>${new Date(o.tgl).toLocaleString('id-ID')}</td>
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
    const o=getOrders();
    o[i].status=s;
    saveOrders(o);
    loadAdmin();
  };

  /* ================= PDF ================= */
  window.printPdf = function(i){
    const o=getOrders()[i];
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'mm',format:[PAPER_WIDTH,PAGE_HEIGHT]});

    let y=8;

    /* HEADER */
    doc.setFontSize(12);
    doc.text('PUKIS LUMER AULIA',PAPER_WIDTH/2,y,{align:'center'});
    y+=6;

    doc.setFontSize(8);
    doc.text(`Invoice : ${o.invoice}`,4,y);
    doc.text(`Nama    : ${o.nama}`,4,y+4);
    doc.text(`WA      : ${o.wa}`,4,y+8);

    doc.text(
      `Tanggal : ${new Date().toLocaleString('id-ID')}`,
      PAPER_WIDTH-4,y,{align:'right'}
    );

    y+=14;

    /* TABLE */
    const topping =
      o.mode==='single'||o.mode==='double'
        ? (o.single||[]).join(', ') : '-';

    const taburan =
      o.mode==='double'
        ? (o.taburan||[]).join(', ') : '-';

    doc.autoTable({
      startY:y,
      theme:'grid',
      styles:{fontSize:8,cellPadding:2},
      columnStyles:{0:{cellWidth:28},1:{cellWidth:48}},
      body:[
        ['Nama Toko','Pukis Lumer Aulia'],
        ['Invoice',o.invoice],
        ['Nama Pemesan',o.nama],
        ['No. WA',o.wa],
        ['Jenis Pesanan',o.mode.toUpperCase()],
        ['Topping',topping||'-'],
        ['Taburan',taburan||'-'],
        ['Jumlah',o.qty+' Box'],
        ['Catatan',o.catatan||'-'],
        ['Total','Rp '+rp(o.total)]
      ]
    });

    y=doc.lastAutoTable.finalY+6;

    /* WATERMARK (HANYA LUNAS / PENDING) */
    const wm = o.status==='selesai' ? 'LUNAS' : 'PENDING';
    doc.setFontSize(32);
    doc.setTextColor(220,220,220);
    doc.text(wm,PAPER_WIDTH/2,y+30,{
      align:'center',
      angle:45
    });
    doc.setTextColor(0);

    /* QRIS + TTD */
    doc.addImage('assets/images/qris-pukis.jpg','JPEG',4,y,24,24);
    doc.text('Hormat Kami',PAPER_WIDTH-4,y+6,{align:'right'});
    doc.addImage('assets/images/ttd.png','PNG',PAPER_WIDTH-28,y+8,24,14);

    y+=32;

    /* FOOTER */
    doc.setFontSize(8);
    doc.text(
      'Terimakasih sudah Belanja di Dapur Aulia\nKami Tunggu Kunjungan Selanjutnya',
      PAPER_WIDTH/2,y,{align:'center'}
    );

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

  document.addEventListener('DOMContentLoaded',()=>{
    $('btnLogin').onclick=loginAdmin;
    $('btnResetAll') && ($('btnResetAll').onclick=resetAllOrders);
  });

})();
