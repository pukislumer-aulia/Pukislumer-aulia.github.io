(function () {

  function saveLastNota(data) {
    try {
      window._lastNotaData = data;
      localStorage.setItem("lastNota", JSON.stringify(data));
    } catch (e) {}
  }
  window.saveLastNota = saveLastNota;

  function getNota() {
    try {
      if (window._lastNotaData) return window._lastNotaData;

      const raw = localStorage.getItem("lastNota");
      if (raw) return JSON.parse(raw);

      const orders = localStorage.getItem("orders");
      if (orders) {
        const arr = JSON.parse(orders);
        if (Array.isArray(arr) && arr.length) return arr[arr.length - 1];
      }
    } catch (e) {}
    return null;
  }

  function sendAdminWA() {
    const d = getNota();
    if (!d) return alert("Nota masih kosong.");

    const msg =
      "Halo Admin, saya ingin minta cetak invoice.\n\n" +
      "Invoice: " + (d.invoice || "-") + "\n" +
      "Nama: " + (d.nama || "-") + "\n" +
      "Total: Rp " + (d.total || 0).toLocaleString("id-ID");

    window.open(
      "https://wa.me/6281296668670?text=" + encodeURIComponent(msg),
      "_blank"
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("notaAskAdmin");
    if (btn) btn.addEventListener("click", sendAdminWA);
  });
})();
