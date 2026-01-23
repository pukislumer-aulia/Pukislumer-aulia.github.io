/*
  assets/js/admin.js — FINAL LOCK (PRODUCTION)
  PUKIS LUMER AULIA
  ⚠️ PDF TIDAK DIUBAH
*/
(() => {
  'use strict';

  const ADMIN_PIN = '030419';
  const STORAGE_KEY = 'pukisOrders';

  const $ = id => document.getElementById(id);
  const $$ = q => Array.from(document.querySelectorAll(q));
  const rp = n => (Number(n) || 0).toLocaleString('id-ID');
  const pad4 = n => String(n).padStart(4, '0');

  /* ================= LOGIN ================= */
  function loginAdmin() {
    if ($('pin').value !== ADMIN_PIN) return alert('PIN salah');
    $('login').style.display = 'none';
    $('admin').style.display = 'block';
    loadAdmin();
  }

  /* ================= STORAGE ================= */
  const getOrders = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const saveOrders = o =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));

  /* ================= MANUAL ORDER ================= */
  window.addManualOrder = function () {
    const nama = $('mNama').value.trim();
    const wa   = $('mWa').value.trim();
    if (!nama || !wa) return alert('Nama & WA wajib');

    const jenis_pukis =
      document.querySelector('input[name="mJenisPukis"]:checked')?.value || 'Original';
    const isi_per_box = $('mIsi').value;
    const mode = $('mMode').value;
    const qty = Math.max(1, Number($('mQty').value || 1));
    const total = Number($('mTotal').value || 0);
    if (total <= 0) return alert('Total tidak valid');

    const toppingRaw = $('mTopping').value || '';
    const taburanRaw = $('mTaburan').value || '';

    const single = mode === 'single'
      ? toppingRaw.split(',').map(x => x.trim()).filter(Boolean)
      : [];
    const double = mode === 'double'
      ? toppingRaw.split(',').map(x => x.trim()).filter(Boolean)
      : [];
    const taburan = mode === 'double'
      ? taburanRaw.split(',').map(x => x.trim()).filter(Boolean)
      : [];

    const orders = getOrders();
    orders.push({
      invoice: 'INV-' + Date.now(),
      tgl: new Date().toISOString(),
      nama, wa,
      jenis_pukis, isi_per_box, mode,
      single, double, taburan,
      qty, total,
      catatan: $('mCatatan').value || '-',
      status: 'pending'
    });
    saveOrders(orders);
    loadAdmin();
  };

  /* ================= TABLE ================= */
  function loadAdmin() {
    const orders = getOrders();
    const tbody = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '';
    orders.forEach((o, i) => {
      tbody.innerHTML += `
        <tr>
          <td>${new Date(o.tgl).toLocaleString('id-ID')}</td>
          <td>${o.invoice}</td>
          <td>${o.nama}</td>
          <td>${o.wa}</td>
          <td>
            ${o.jenis_pukis}<br>
            ${o.isi_per_box} pcs<br>
            ${o.mode}
          </td>
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

  window.updateStatus = (i, s) => {
    const o = getOrders();
    o[i].status = s;
    saveOrders(o);
    loadAdmin();
  };

  /* ================= PDF ASLI (AUTO TABLE + QR + TTD) ================= */
  window.printPdf = function (i) {
    const o = getOrders()[i];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p','mm','a4');
    const antrian = pad4(i + 1);

    doc.setFontSize(16);
    doc.text('PUKIS LUMER AULIA',105,15,{align:'center'});

    doc.setFontSize(10);
    doc.text(`Invoice : ${o.invoice}`,14,25);
    doc.text(`Nama    : ${o.nama}`,14,31);
    doc.text(`WA      : ${o.wa}`,14,37);

    doc.text(`Tanggal : ${new Date(o.tgl).toLocaleString('id-ID')}`,140,25);
    doc.text(`No Antri: ${antrian}`,140,31);

    doc.autoTable({
      startY:45,
      theme:'grid',
      head:[['KETERANGAN','DETAIL']],
      body:[
        ['Jenis Pukis', o.jenis_pukis],
        ['Isi per Box', o.isi_per_box + ' pcs'],
        ['Mode', o.mode.toUpperCase()],
        ['Topping', o.mode !== 'non' ? (o.single.concat(o.double).join(', ') || '-') : '-'],
        ['Taburan', o.mode === 'double' ? (o.taburan.join(', ') || '-') : '-'],
        ['Jumlah', o.qty + ' Box'],
        ['Catatan', o.catatan || '-'],
        ['Total', 'Rp ' + rp(o.total)]
      ],
      styles:{fontSize:10,cellPadding:4},
      headStyles:{fillColor:[16,32,51],textColor:255,halign:'center'},
      columnStyles:{0:{cellWidth:60,fontStyle:'bold'},1:{cellWidth:110}}
    });

    const y = doc.lastAutoTable.finalY + 12;
    doc.addImage('assets/images/qris-pukis.jpg','JPEG',14,y,40,40);
    doc.addImage('assets/images/ttd.png','PNG',130,y+14,40,20);

    doc.setFontSize(10);
    doc.text(
      'Terimakasih sudah berbelanja di Pukis Lumer Aulia',
      105,285,{align:'center'}
    );

    doc.save(o.invoice + '.pdf');
  };

  /* ================= STATS ================= */
  function renderStats(o){
    let total = 0, now = new Date();
    o.forEach(x=>{
      const d = new Date(x.tgl);
      if(x.status === 'selesai' && d.getMonth() === now.getMonth())
        total += Number(x.total || 0);
    });
    $('stats').innerHTML =
      `<b>Total Pendapatan Bulan Ini:</b> Rp ${rp(total)}`;
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded',()=>{
    $('btnLogin').onclick = loginAdmin;
    $('btnResetAll') && (
      $('btnResetAll').onclick = () => {
        localStorage.removeItem(STORAGE_KEY);
        loadAdmin();
      }
    );
  });

})();
