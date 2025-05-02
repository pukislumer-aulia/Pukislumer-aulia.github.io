<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Pukis Lumer Aulia</title>
  <link rel="stylesheet" href="assets/css/style.css" />
</head>
<body>
  <header>
    <h1>Order Pukis Lumer Aulia</h1>
  </header>

  <main>
    <form id="orderForm">
      <label for="variant">Varian:</label>
      <select id="variant" name="variant" required>
        <option value="">-- Pilih Varian --</option>
        <option value="original">Original</option>
        <option value="pandan">Pandan</option>
      </select>

      <label for="toppingType">Jenis Topping:</label>
      <select id="toppingType" name="toppingType" required>
        <option value="">-- Pilih Topping --</option>
        <option value="non">Non Topping</option>
        <option value="single">Single Topping</option>
        <option value="double">Double Topping</option>
      </select>

      <label for="boxSize">Ukuran Box:</label>
      <select id="boxSize" name="boxSize" required>
        <option value="">-- Pilih Ukuran --</option>
        <option value="5">Box Kecil (5 pcs)</option>
        <option value="10">Box Besar (10 pcs)</option>
      </select>

      <div id="toppingContainer" style="display: none;">
        <p>Pilih Topping (maksimal sesuai isi box):</p>
        <div id="toppingOptions"></div>
      </div>

      <p>Total Harga: <span id="totalPrice">Rp0</span></p>

      <button type="submit">Order via WhatsApp</button>
    </form>
  </main>

  <script src="assets/js/order.js"></script>
</body>
</html>
