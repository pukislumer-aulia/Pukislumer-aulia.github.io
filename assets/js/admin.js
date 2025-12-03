// public/assets/js/admin.js
(() => {
  const API = '/api';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function createRow(order){
    const tpl = document.querySelector('#orderRowTpl');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.invoice').textContent = order.invoice;
    node.querySelector('.nama').textContent = order.nama;
    node.querySelector('.meta').textContent = `${order.jenis} • ${order.isi} pcs • ${order.jumlah} box • ${order.total ? 'Rp ' + Number(order.total).toLocaleString('id-ID') : '-'}`;
    const statusSel = node.querySelector('.statusSelect');
    statusSel.value = order.status || 'Pending';
    statusSel.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      await fetch(`${API}/orders/${encodeURIComponent(order.invoice)}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: newStatus })});
      alert('Status diperbarui');
      loadOrders();
    });
    node.querySelector('.btn-send-cust').addEventListener('click', (e) => {
      // prefill wa to customer
      const lines = [
        `Halo ${order.nama}, ini admin Pukis Lumer Aulia.`,
        `Invoice: ${order.invoice}`,
        `Total Bayar: Rp ${Number(order.total).toLocaleString('id-ID')}`,
        `Status pesanan: ${order.status || 'Pending'}`
      ];
      window.open(`https://wa.me/${order.wa.replace(/\D/g,'')}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
    });
    node.querySelector('.btn-pdf').addEventListener('click', async () => {
      window.open(`${API}/orders/${encodeURIComponent(order.invoice)}/pdf`, '_blank');
    });
    node.querySelector('.btn-edit').addEventListener('click', () => openEditModal(order));
    return node;
  }

  async function loadOrders(q = {}){
    const qs = new URLSearchParams(q).toString();
    const res = await fetch(`${API}/orders?${qs}`);
    const json = await res.json();
    const arr = json.orders || [];
    const container = $('#ordersList'); container.innerHTML = '';
    if (!arr.length) { container.innerHTML = '<div class="empty">Tidak ada order</div>'; return; }
    arr.forEach(o => container.appendChild(createRow(o)));
  }

  function openEditModal(order){
    const modal = $('#editModal'); modal.setAttribute('aria-hidden','false'); modal.classList.add('show');
    const c = $('#editContent'); c.innerHTML = `
      <label>Nama</label><input id="e_nama" value="${order.nama}">
      <label>WA</label><input id="e_wa" value="${order.wa}">
      <label>Catatan</label><textarea id="e_note">${order.note||''}</textarea>
      <label>Status</label>
      <select id="e_status">
        <option${order.status==='Pending'?' selected':''}>Pending</option>
        <option${order.status==='Confirmed'?' selected':''}>Confirmed</option>
        <option${order.status==='Delivered'?' selected':''}>Delivered</option>
        <option${order.status==='Canceled'?' selected':''}>Canceled</option>
      </select>
    `;
    $('#editClose').onclick = () => { modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); };
    $('#saveEdit').onclick = async () => {
      const payload = {
        nama: $('#e_nama').value,
        wa: $('#e_wa').value,
        note: $('#e_note').value,
        status: $('#e_status').value
      };
      await fetch(`${API}/orders/${encodeURIComponent(order.invoice)}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      alert('Tersimpan');
      modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
      loadOrders();
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    $('#btnFilter').addEventListener('click', () => {
      const invoice = $('#filterInvoice').value.trim();
      const nama = $('#filterNama').value.trim();
      const status = $('#filterStatus').value;
      const q = {};
      if (invoice) q.invoice = invoice;
      if (nama) q.nama = nama;
      if (status) q.status = status;
      loadOrders(q);
    });
    $('#btnReload').addEventListener('click', () => loadOrders());
  });
})();
