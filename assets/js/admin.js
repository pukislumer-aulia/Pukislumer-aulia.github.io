/*
  ADMIN PANEL — FINAL LOCK (A4)
  PUKIS LUMER AULIA

  ✔ NOMOR ANTRIAN 0001
  ✔ TOPPING + TABURAN BENAR
  ✔ QRIS + TTD + HORMAT KAMI
  ✔ WATERMARK LUNAS / PENDING
  ✔ RESET SEMUA PESANAN
  ⚠️ JANGAN DIUBAH TANPA AUDIT
*/

(() => {
  'use strict';

  const ADMIN_PIN   = '030419';
  const STORAGE_KEY = 'pukisOrders';

  const $  = id => document.getElementById(id);
  const rp = n => (Number(n)||0).toLocaleString('id-ID');
  const pad4 = n => String(n).padStart(4,'0');

  /* LOGIN */
  function loginAdmin(){
    if ($('pin').value !== ADMIN_PIN) {
      alert('PIN salah');
      $('pin').value='';
      return;
    }
    $('login').style.display='none';
    $('admin').style.display='block';
    loadAdmin();
  }

  /* STORAGE */
  const getOrders = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const saveOrders = o =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));

  /* RESET */
  function resetAllOrders(){
    if(!confirm('Yakin hapus SEMUA pesanan?')) return;
    localStorage.removeItem(STORAGE_KEY);
    loadAdmin();
    alert('Semua pesanan dihapus');
  }

  /* LOAD TABLE */
  function loadAdmin(){
    const orders = getOrders();
    const tbody = document.querySelector('#orderTable tbody');
    tbody.innerHTML='';

    orders.forEach((o,i)=>{
      tbody.innerHTML+=`
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

  window.updateStatus=(i,s)=>{
    const o=getOrders();
    o[i].status=s;
    saveOrders(o);
    loadAdmin();
  };

  /* PDF A4 */
  window.printPdf = function(i){
    const o = getOrders()[i];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p','mm','a4');

    const antrian = pad4(i+1);

    /* HEADER */
    doc.setFontSize(16);
    doc.text('PUKIS LUMER AULIA',105,15,{align:'center'});

    doc.setFontSize(10);
    doc.text(`Invoice : ${o.invoice}`,14,25);
    doc.text(`Nama    : ${o.nama}`,14,31);
    doc.text(`WA      : ${o.wa}`,14,37);

    doc.text(`Tanggal : ${new Date(o.tgl).toLocaleString('id-ID')}`,140,25);
    doc.text(`No Antri: ${antrian}`,140,31);

    /* TOPPING & TABURAN (FIX BUG) */
    const topping =
      o.mode==='single' ? (o.single||[]) :
      o.mode==='double' ? (o.double||[]) : [];

    const taburan =
      o.mode==='double' ? (o.taburan||[]) : [];

    /* TABLE */
    doc.autoTable({
      startY:45,
      theme:'grid',
      styles:{fontSize:10,cellPadding:3},
      columnStyles:{0:{cellWidth:60}},
      body:[
        ['Jenis Pesanan', o.mode.toUpperCase()],
        ['Topping', topping.length ? topping.join(', ') : '-'],
        ['Taburan', taburan.length ? taburan.join(', ') : '-'],
        ['Jumlah', o.qty+' Box'],
        ['Catatan', o.catatan||'-'],
        ['Total', 'Rp '+rp(o.total)]
      ]
    });

    let y = doc.lastAutoTable.finalY + 10;

    /* QRIS */
    doc.addImage('assets/images/qris-pukis.jpg','JPEG',14,y,40,40);

    /* HORMAT KAMI + TTD */
    doc.setFontSize(10);
    doc.text('Hormat Kami',170,y+10,{align:'right'});
    doc.addImage('assets/images/ttd.png','PNG',130,y+14,40,20);

    /* WATERMARK */
    const wm = o.status==='selesai' ? 'LUNAS' : 'PENDING';
    doc.setTextColor(220,220,220);
    doc.setFontSize(60);
    doc.text(wm,105,160,{align:'center',angle:45});
    doc.setTextColor(0);

    /* FOOTER */
    doc.setFontSize(10);
    doc.text(
      'Terimakasih sudah Belanja di Dapur Aulia\nKami Tunggu Kunjungan Selanjutnya',
      105,285,{align:'center'}
    );

    doc.save(o.invoice+'.pdf');
  };

  /* STATS */
  function renderStats(o){
    let t=0,n=new Date();
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
