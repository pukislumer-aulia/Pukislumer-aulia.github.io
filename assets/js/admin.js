/*
  ADMIN PANEL — FINAL LOCK (A4)
  PUKIS LUMER AULIA

  ✔ RESET SEMUA PESANAN
  ✔ WATERMARK: LUNAS / PENDING
  ✔ PDF A4 RAPI
  ✔ TOPPING + TABURAN AMAN
  ✔ NON / SINGLE / DOUBLE AMAN
  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(() => {
  'use strict';

  const ADMIN_PIN   = '030419';
  const STORAGE_KEY = 'pukisOrders';

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

  /* ================= PDF A4 ================= */
  window.printPdf = function(i){
    const o=getOrders()[i];
    if(!o) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p','mm','a4');

    /* NORMALISASI DATA */
    const topping = (o.mode!=='non' && o.single && o.single.length)
      ? o.single.join(', ')
      : '-';

    const taburan = (o.mode==='double' && o.taburan && o.taburan.length)
      ? o.taburan.join(', ')
      : '-';

    /* HEADER */
    doc.setFontSize(16);
    doc.text('PUKIS LUMER AULIA',105,15,{align:'center'});

    doc.setFontSize(10);
    doc.text(`Invoice : ${o.invoice}`,15,30);
    doc.text(`Nama    : ${o.nama}`,15,36);
    doc.text(`No. WA  : ${o.wa}`,15,42);

    doc.text(`Tanggal : ${new Date(o.tgl).toLocaleString('id-ID')}`,140,30);
    doc.text(`Status  : ${(o.status||'pending').toUpperCase()}`,140,36);

    /* TABLE */
    doc.autoTable({
      startY:50,
      theme:'grid',
      styles:{fontSize:10,cellPadding:3},
      columnStyles:{0:{cellWidth:60},1:{cellWidth:110}},
      body:[
        ['Nama Toko','Pukis Lumer Aulia'],
        ['Jenis Pesanan',o.mode.toUpperCase()],
        ['Topping',topping],
        ['Taburan',taburan],
        ['Jumlah',o.qty+' Box'],
        ['Catatan',o.catatan||'-'],
        ['Total','Rp '+rp(o.total)]
      ]
    });

    /* WATERMARK */
    const wm = o.status==='selesai' ? 'LUNAS' : 'PENDING';
    doc.setFontSize(48);
    doc.setTextColor(220,220,220);
    doc.text(wm,105,170,{align:'center',angle:30});
    doc.setTextColor(0);

    /* FOOTER */
    doc.setFontSize(11);
    doc.text('Terimakasih sudah Belanja di Dapur Aulia',105,270,{align:'center'});
    doc.text('Kami Tunggu Kunjungan Selanjutnya',105,276,{align:'center'});

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

    $('stats').innerHTML =
      `<b>Total Pendapatan Bulan Ini:</b> Rp ${rp(t)}
       <br>
       <button id="btnResetAll"
         style="margin-top:8px;padding:6px 12px;background:#c0392b;color:#fff;border:none;border-radius:4px;cursor:pointer">
         Reset Semua Pesanan
       </button>`;

    $('btnResetAll').onclick = resetAllOrders;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    $('btnLogin').onclick=loginAdmin;
  });

})();
