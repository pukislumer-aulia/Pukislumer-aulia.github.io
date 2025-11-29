document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.removeItem("adminLoggedIn");
    window.location.href = "login.html";
  });

  const ordersList = document.getElementById("ordersList");
  const tpl = document.getElementById("orderTemplate");

  function loadOrders() {
    let list = [];

    try {
      const raw = localStorage.getItem("orders") || localStorage.getItem("lastNota");
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) list = data;
        else list.push(data);
      }
    } catch (e) {}

    if (!list.length) {
      ordersList.innerHTML = "<p class='note'>Belum ada pesanan.</p>";
      return;
    }

    ordersList.innerHTML = "";
    list.forEach((o) => {
      const node = tpl.content.cloneNode(true);

      node.querySelector(".invoice").textContent = o.invoice || "-";
      node.querySelector(".name").textContent = o.nama || "-";
      node.querySelector(".total").textContent = (o.total || 0).toLocaleString("id-ID");

      // WA button
      node.querySelector(".waBtn").href =
        "https://wa.me/6281296668670?text=" + encodeURIComponent(
          `Halo Admin, saya ingin minta cetak invoice.\n\n` +
          `Invoice: ${o.invoice}\n` +
          `Nama: ${o.nama}\n` +
          `Total: Rp ${(o.total || 0).toLocaleString("id-ID")}`
        );

      // Lihat invoice
      node.querySelector(".viewBtn").addEventListener("click", () => {
        alert(
          "Invoice: " + o.invoice +
          "\nNama: " + o.nama +
          "\nTotal: Rp " + (o.total || 0).toLocaleString("id-ID")
        );
      });

      ordersList.appendChild(node);
    });
  }

  loadOrders();
});
