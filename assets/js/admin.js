// ==========================================
// ADMIN DASHBOARD PRO — FULL LOCAL VERSION
// PUKIS LUMER AULIA — 2025 OPTIMIZED
// ==========================================

console.info("[admin.js] Loaded");

const ADMIN_PIN = "030419"; // PIN ADMIN (bisa diganti sendiri)

const loginModal = document.getElementById("adminLoginModal");
const adminContent = document.getElementById("adminContent");

function showLogin() {
  loginModal.style.display = "flex";
  adminContent.style.display = "none";
}
function showDashboard() {
  loginModal.style.display = "none";
  adminContent.style.display = "block";
  loadAllData();
}

// === LOGIN WITH PIN ===
document.getElementById("adminLoginBtn")?.addEventListener("click", () => {
  const pin = document.getElementById("adminPinInput")?.value;
  if (!pin) return alert("Masukkan PIN admin");
  if (pin === ADMIN_PIN) {
    localStorage.setItem("adminLoggedIn", "yes");
    showDashboard();
  } else {
    alert("PIN Salah!");
  }
});

// Auto login jika pernah login sebelumnya
if (localStorage.getItem("adminLoggedIn") === "yes") {
  showDashboard();
} else {
  showLogin();
}


// =====================================
// LOAD ALL DATA
// =====================================

function loadAllData() {
  loadOrders();
  loadTestimonials();
  loadStatistics();
  loadAnalytics();
}


// =====================================
// ORDERS SECTION
// =====================================

function loadOrders() {
  const tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  orders.forEach(o => {
    tbody.innerHTML += `
      <tr>
        <td>${o.orderID}</td>
        <td>${o.nama}</td>
        <td>${o.wa}</td>
        <td>${o.jenis} (${o.isi}pcs)</td>
        <td>${o.jumlahBox} Box</td>
        <td>Rp${Number(o.total).toLocaleString("id-ID")}</td>
        <td>${new Date(o.createdAt).toLocaleString()}</td>
      </tr>
    `;
  });
}


// =====================================
// TESTIMONIALS SECTION
// =====================================

function loadTestimonials() {
  const wrap = document.getElementById("testimonialList");
  wrap.innerHTML = "";

  const testi = JSON.parse(localStorage.getItem("testimonials") || "[]");

  testi.forEach(t => {
    wrap.innerHTML += `
      <div class="testimonial-card">
        <p>“${t.pesan}”</p>
        <small>— ${t.nama}</small>
      </div>
    `;
  });
}


// =====================================
// STATISTICS SECTION
// =====================================

function loadStatistics() {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  const totalOrder = orders.length;
  const revenue = orders.reduce((a,c) => a + Number(c.total||0),0);

  document.getElementById("statOrders").textContent = totalOrder;
  document.getElementById("statRevenue").textContent = 
    "Rp" + revenue.toLocaleString("id-ID");

  const totalCoupons = JSON.parse(localStorage.getItem("pukis-coupons") || "[]").length;
  document.getElementById("statCoupons").textContent = totalCoupons;
}


// =====================================
// ANALYTICS (OPTIONAL)
// =====================================

function loadAnalytics() {
  const analytics = JSON.parse(localStorage.getItem("pukis-analytics") || "[]");
  document.getElementById("analyticsData").textContent =
    JSON.stringify(analytics, null, 2);
}


// =====================================
// ADMIN ACTIONS
// =====================================

document.getElementById("refreshOrders")?.addEventListener("click", loadAllData);

document.getElementById("exportCSV")?.addEventListener("click", () => {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  let csv = "orderID,nama,wa,jenis,isi,jumlah,total,tanggal\n" + 
    orders.map(o =>
      `${o.orderID},"${o.nama}",${o.wa},${o.jenis},${o.isi},${o.jumlahBox},${o.total},${o.createdAt}`
    ).join("\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "orders-export.csv";
  a.click();
});

document.getElementById("clearOrders")?.addEventListener("click", () => {
  if (!confirm("Hapus semua pesanan offline?")) return;
  localStorage.removeItem("orders");
  loadOrders();
});

// LOGOUT ADMIN
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("adminLoggedIn");
  showLogin();
});
