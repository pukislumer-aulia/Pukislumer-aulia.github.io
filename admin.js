<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Pukis Lumer Aulia</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f8f8; padding: 20px; }
    h1 { color: #d6336c; }
    label { display: block; margin-top: 10px; font-weight: bold; }
    input, textarea { width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 5px; }
    button { margin-top: 15px; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; }
    #btnSimpan { background: #28a745; color: #fff; }
    #btnReset { background: #ffc107; color: #000; }
    #btnLogout { background: #dc3545; color: #fff; }
  </style>
</head>
<body>
  <h1>Admin Panel - Pukis Lumer Aulia</h1>

  <form id="adminForm">
    <label>Judul</label>
    <input type="text" id="judulInput">

    <label>Sapaan</label>
    <input type="text" id="sapaanInput">

    <label>Doa</label>
    <input type="text" id="doaInput">

    <label>Lokasi</label>
    <input type="text" id="lokasiInput">

    <label>Ajakan</label>
    <input type="text" id="ajakanInput">

    <label>Jam Operasional</label>
    <input type="text" id="jamOperasionalInput">

    <label>Best Seller</label>
    <input type="text" id="bestSellerInput">

    <label>Alamat</label>
    <input type="text" id="alamatInput">

    <label>Ojol</label>
    <input type="text" id="ojolInput">

    <label>Alasan</label>
    <textarea id="alasanInput"></textarea>

    <label>Fakta Unik (pisahkan dengan baris baru)</label>
    <textarea id="faktaUnikInput"></textarea>

    <label>Promo Text</label>
    <input type="text" id="promoTextInput">

    <label>Promo Image URL</label>
    <input type="text" id="promoImageInput">

    <label>Footer</label>
    <textarea id="footerInput"></textarea>

    <label>Testimoni (pisahkan dengan baris baru)</label>
    <textarea id="testimoniInput"></textarea>

    <label>Galeri (pisahkan dengan tanda |)</label>
    <textarea id="galeriInput"></textarea>

    <button type="button" id="btnSimpan">💾 Simpan</button>
    <button type="button" id="btnReset">🔄 Kembali ke Default</button>
    <button type="button" id="btnLogout">🚪 Logout</button>
  </form>

  <!-- Script -->
  <script type="module" src="admin.js"></script>
</body>
</html>
