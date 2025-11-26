// ================================
// ADMIN.JS FINAL — PUKIS LUMER AULIA
// Versi: Ultimate Stable
// ================================
console.info("[admin.js] Loaded Final");

// =========================
// KONFIGURASI ADMIN
// =========================
const ADMIN_PIN = "8670";
const loginModal = document.getElementById("adminLoginModal");
const adminContent = document.getElementById("adminContent");
const promoInput = document.getElementById("promoValue");
const promoStatus = document.getElementById("promoStatus");
const promoBtn = document.getElementById("promoSet");

// =========================
// LOGIN SYSTEM
// =========================
function showLogin() {
  loginModal.style.display = "flex";
  adminContent.style.display = "none";
}

function showDashboard() {
  loginModal.style.display = "none";
  adminContent.style.display = "block";
  loadAllData();
}

document.getElementById("adminLoginBtn")?.addEventListener("click", () => {
  const pin = document.getElementById("adminPinInput")?.value;
  if (!pin) return alert("Masukkan PIN admin");

  if (pin === ADMIN_PIN) {
    localStorage.setItem("adminLoggedIn", "yes");
    showDashboard();
  } else {
    alert("PIN salah!");
  }
});

if (localStorage.getItem("adminLoggedIn") === "yes") showDashboard();
else showLogin();


// ===================================
// LOAD SEMUA BAGIAN DASHBOARD
// ===================================
function loadAllData() {
  loadOrders();
  loadStatistics();
  loadPromo();
  loadQueue();
  loadHistory();
  loadAnalytics();
}


// ================================
// ANTRIAN otomatis (reset harian)
// ================================
function loadQueue() {
  const today = new Date().toLocaleDateString();
  const savedDay = localStorage.getItem("queueDay");

  if (savedDay !== today) {
    localStorage.setItem("queueDay", today);
    localStorage.setItem("queueNumber", "0");
  }
}

function getNewQueueNumber() {
  let num = Number(localStorage.getItem("queueNumber") || 0) + 1;
  localStorage.setItem("queueNumber", num);
  return num;
}


// ================================
// PROMO ADMIN
// ================================
function loadPromo() {
  const promo = localStorage.getItem("promoValue") || 0;
  promoInput.value = promo;
  promoStatus.textContent = promo > 0 ? `Promo aktif: Rp${Number(promo).toLocaleString()}` : "Promo OFF";
}

promoBtn?.addEventListener("click", () => {
  const v = Number(promoInput.value);
  if (isNaN(v) || v < 0) return alert("Promo tidak valid!");

  localStorage.setItem("promoValue", v);
  loadPromo();
  alert("Promo berhasil diperbarui!");
});


// ================================
// LOAD ORDERS
// ================================
function loadOrders() {
  const tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  orders.forEach(o => {
    tbody.innerHTML += `
      <tr>
        <td>${o.invoice}</td>
        <td>${o.nama}</td>
        <td>${o.wa}</td>
        <td>${o.jenis} (${o.isi})</td>
        <td>${o.toppingList.join(", ") || "-"}</td>
        <td>${o.taburanList.join(", ") || "-"}</td>
        <td>${o.jumlahBox} box</td>
        <td>Rp${Number(o.total).toLocaleString()}</td>
        <td>${o.queue}</td>
        <td>${o.lunas ? "LUNAS" : "BELUM"}</td>
        <td>${new Date(o.createdAt).toLocaleString()}</td>
      </tr>
    `;
  });
}


// ================================
// HISTORY — CETAK ULANG
// ================================
function loadHistory() {
  const wrap = document.getElementById("historyList");
  wrap.innerHTML = "";

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  orders.forEach(o => {
    wrap.innerHTML += `
      <div class="history-card">
        <p><strong>${o.invoice}</strong> — ${o.nama}</p>
        <small>${new Date(o.createdAt).toLocaleString()}</small>
        <button onclick="reprintInvoice('${o.invoice}')">Cetak Ulang</button>
      </div>
    `;
  });
}


// ================================
// CETAK ULANG INVOICE
// ================================
function reprintInvoice(inv) {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const data = orders.find(o => o.invoice === inv);
  if (!data) return alert("Invoice tidak ditemukan");

  generatePDF(data, true);
}



// ================================
// STATISTIK
// ================================
function loadStatistics() {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  const totalOrder = orders.length;
  const revenue = orders.reduce((a, c) => a + Number(c.total || 0), 0);

  document.getElementById("statOrders").textContent = totalOrder;
  document.getElementById("statRevenue").textContent = "Rp" + revenue.toLocaleString();
}



// ================================
// ANALYTICS
// ================================
function loadAnalytics() {
  const analytics = JSON.parse(localStorage.getItem("pukis-analytics") || "[]");
  document.getElementById("analyticsData").textContent = JSON.stringify(analytics, null, 2);
}



// ================================
// EXPORT CSV
// ================================
document.getElementById("exportCSV")?.addEventListener("click", () => {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  let csv = "invoice,nama,wa,jenis,isi,topping,taburan,jumlah,total,queue,lunas,tanggal\n" +
    orders.map(o =>
      `${o.invoice},${o.nama},${o.wa},${o.jenis},${o.isi},"${o.toppingList.join(";")}","${o.taburanList.join(";")}",${o.jumlahBox},${o.total},${o.queue},${o.lunas},${o.createdAt}`
    ).join("\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "orders-export.csv";
  a.click();
});


// ================================
// CLEAR ORDERS
// ================================
document.getElementById("clearOrders")?.addEventListener("click", () => {
  if (!confirm("Hapus semua pesanan offline?")) return;

  localStorage.removeItem("orders");
  loadOrders();
});


// ================================
// LOGOUT
// ================================
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("adminLoggedIn");
  showLogin();
});
