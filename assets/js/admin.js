<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Dashboard — Pukis Lumer Aulia</title>
<link rel="stylesheet" href="assets/css/admin.css">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
</head>
<body>

<!-- LOGIN MODAL -->
<div id="adminLoginModal" style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000000aa;">
  <div style="background:#fff;padding:24px;border-radius:12px;max-width:360px;width:100%;">
    <h2>Admin Login</h2>
    <input type="password" id="adminPinInput" placeholder="Masukkan PIN Admin" style="width:100%;padding:12px;border-radius:8px;margin-bottom:12px;">
    <button id="adminLoginBtn" style="width:100%;padding:12px;border-radius:8px;background:#ff5e7e;color:#fff;border:0;">Login</button>
  </div>
</div>

<!-- DASHBOARD -->
<div id="adminContent" style="display:none;padding:18px;">
  <h1>Dashboard Admin</h1>
  <button id="logoutBtn" style="padding:10px 14px;background:#1f2937;color:#fff;border:0;border-radius:8px;margin-bottom:12px;">Logout</button>

  <h2>Orders</h2>
  <button id="refreshOrders">Refresh</button>
  <button id="exportCSV">Export CSV</button>
  <button id="clearOrders">Clear Orders</button>
  <table id="ordersTable" border="1" cellspacing="0" cellpadding="6" style="width:100%;margin-top:12px;">
    <thead>
      <tr>
        <th>Nama</th><th>WA</th><th>Jenis</th><th>Topping</th><th>Jumlah Box</th><th>Total</th><th>Tanggal</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <h2>Testimonials</h2>
  <div id="testimonialList"></div>

  <h2>Statistics</h2>
  <p>Total Orders: <span id="statOrders">0</span></p>
  <p>Total Revenue: <span id="statRevenue">Rp0</span></p>

  <h2>Analytics</h2>
  <pre id="analyticsData" style="background:#eee;padding:12px;border-radius:8px;max-height:300px;overflow:auto;"></pre>
</div>

<script src="assets/js/admin.js"></script>
</body>
</html>
