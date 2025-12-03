// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const ShortUniqueId = require('short-uuid');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// lowdb setup (file: db.json)
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDB(){
  await db.read();
  db.data = db.data || { orders: [] };
  await db.write();
}
initDB();

// Utility: generate invoice INV-YYYYMMDD-XXXX (XXXX = random alnum 4)
function genInvoice(){
  const d = new Date();
  const y = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const rand = Math.random().toString(36).substring(2,6).toUpperCase();
  return `INV-${y}${mm}${dd}-${rand}`;
}

// Create order
app.post('/api/orders', async (req, res) => {
  try{
    const payload = req.body || {};
    // minimal validation
    if (!payload.nama || !payload.wa) return res.status(400).json({ error: 'Nama dan WA wajib diisi' });
    await db.read();
    const invoice = genInvoice();
    const now = new Date().toISOString();
    const order = {
      invoice,
      nama: payload.nama,
      wa: payload.wa,
      jenis: payload.jenis || 'Original',
      isi: payload.isi || '5',
      mode: (payload.mode || 'non'),
      topping: Array.isArray(payload.topping) ? payload.topping : (payload.topping ? [payload.topping] : []),
      taburan: Array.isArray(payload.taburan) ? payload.taburan : (payload.taburan ? [payload.taburan] : []),
      jumlah: Number(payload.jumlah || 1),
      pricePerBox: Number(payload.pricePerBox || 0),
      subtotal: Number(payload.subtotal || 0),
      discount: Number(payload.discount || 0),
      total: Number(payload.total || 0),
      note: payload.note || '',
      status: 'Pending',
      createdAt: now,
      updatedAt: now
    };
    db.data.orders.push(order);
    await db.write();
    return res.status(201).json({ ok: true, order });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders (with optional query filters)
app.get('/api/orders', async (req, res) => {
  await db.read();
  let arr = db.data.orders || [];
  const { status, invoice, nama } = req.query;
  if (status) arr = arr.filter(o => (o.status||'').toLowerCase() === status.toLowerCase());
  if (invoice) arr = arr.filter(o => o.invoice === invoice);
  if (nama) arr = arr.filter(o => (o.nama||'').toLowerCase().includes(nama.toLowerCase()));
  return res.json({ ok: true, orders: arr });
});

// Get single by invoice
app.get('/api/orders/:invoice', async (req, res) => {
  const invoice = req.params.invoice;
  await db.read();
  const order = (db.data.orders || []).find(o => o.invoice === invoice);
  if (!order) return res.status(404).json({ error: 'Not found' });
  return res.json({ ok: true, order });
});

// Update order (e.g., change status or edit)
app.put('/api/orders/:invoice', async (req, res) => {
  const invoice = req.params.invoice;
  const data = req.body || {};
  await db.read();
  const idx = (db.data.orders || []).findIndex(o => o.invoice === invoice);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const target = db.data.orders[idx];
  const allowed = ['status','note','nama','wa','jumlah','jenis','isi','mode','topping','taburan','pricePerBox','subtotal','discount','total'];
  allowed.forEach(k => { if (k in data) target[k] = data[k]; });
  target.updatedAt = new Date().toISOString();
  db.data.orders[idx] = target;
  await db.write();
  return res.json({ ok: true, order: target });
});

// Server-side PDF generation (simple invoice)
app.get('/api/orders/:invoice/pdf', async (req, res) => {
  const invoice = req.params.invoice;
  await db.read();
  const order = (db.data.orders || []).find(o => o.invoice === invoice);
  if (!order) return res.status(404).json({ error: 'Not found' });

  // create PDF buffer with pdfkit
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks = [];
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${invoice}.pdf`);
  doc.on('data', ch => chunks.push(ch));
  doc.on('end', () => {
    const result = Buffer.concat(chunks);
    res.send(result);
  });

  // PDF content
  doc.fontSize(18).text('PUKIS LUMER AULIA', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Invoice: ${order.invoice}`);
  doc.text(`Tanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}`);
  doc.text(`Nama: ${order.nama}`);
  doc.text(`WA: ${order.wa}`);
  doc.moveDown(0.5);
  doc.text(`Jenis: ${order.jenis} — ${order.isi} pcs`);
  doc.text(`Mode: ${order.mode}`);
  doc.text(`Topping: ${order.topping && order.topping.length ? order.topping.join(', ') : '-'}`);
  doc.text(`Taburan: ${order.taburan && order.taburan.length ? order.taburan.join(', ') : '-'}`);
  doc.text(`Jumlah: ${order.jumlah} box`);
  doc.moveDown(0.5);
  doc.text(`Harga / box: Rp ${Number(order.pricePerBox).toLocaleString('id-ID')}`);
  doc.text(`Subtotal: Rp ${Number(order.subtotal).toLocaleString('id-ID')}`);
  doc.text(`Diskon: Rp ${Number(order.discount).toLocaleString('id-ID')}`);
  doc.fontSize(14).text(`Total Bayar: Rp ${Number(order.total).toLocaleString('id-ID')}`, { underline: true });
  doc.moveDown(1);
  doc.fontSize(10).text('Terima kasih telah memesan. Silakan hubungi admin untuk konfirmasi pembayaran.', { align: 'left' });
  doc.end();
});

// fallback route (provide index)
app.get('*', (req,res) => {
  // serve index file by static middleware above; this fallback ensures SPA works
  res.sendFile(path.join(__dirname, 'public','index.html'));
});

app.listen(port, () => {
  console.log(`Server ready on http://localhost:${port}`);
});
