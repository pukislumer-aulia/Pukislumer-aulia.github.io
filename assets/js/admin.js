// ==========================================
// ADMIN DASHBOARD — FULL LOCAL VERSION
// PUKIS LUMER AULIA — 2025 OPTIMIZED
// ==========================================

console.info("[admin.js] Loaded");

const ADMIN_PIN = "030419"; // PIN admin bisa diganti
const loginModal = document.getElementById("adminLoginModal");
const adminContent = document.getElementById("adminContent");

// ======================
// Login / Logout
// ======================
function showLogin() {
  if(loginModal) loginModal.style.display="flex";
  if(adminContent) adminContent.style.display="none";
}
function showDashboard() {
  if(loginModal) loginModal.style.display="none";
  if(adminContent) adminContent.style.display="block";
  loadAllData();
}

document.getElementById("adminLoginBtn")?.addEventListener("click",()=>{
  const pin=document.getElementById("adminPinInput")?.value;
  if(!pin) return alert("Masukkan PIN admin");
  if(pin===ADMIN_PIN){
    localStorage.setItem("adminLoggedIn","yes");
    showDashboard();
  } else alert("PIN salah!");
});

// Auto login jika sebelumnya sudah login
if(localStorage.getItem("adminLoggedIn")==="yes") showDashboard();
else showLogin();

// ======================
// Load All Data
// ======================
function loadAllData(){
  loadOrders();
  loadTestimonials();
  loadStatistics();
  loadAnalytics();
}

// ======================
// Orders Section
// ======================
function loadOrders(){
  const tbody=document.querySelector("#adminOrders tbody");
  if(!tbody) return;
  tbody.innerHTML="";
  const orders=JSON.parse(localStorage.getItem("orders")||"[]");
  orders.slice().reverse().forEach(o=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${o.id}</td>
      <td>${o.nama}</td>
      <td>${o.wa}</td>
      <td>${o.jenis} (${o.isi} pcs)</td>
      <td>${o.jumlahBox} Box</td>
      <td>${formatRp(o.total)}</td>
      <td>${new Date(o.createdAt).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// Testimonials Section
// ======================
function loadTestimonials(limit=5){
  const wrap=document.getElementById("adminTestimonials");
  if(!wrap) return;
  wrap.innerHTML="";
  const testi=JSON.parse(localStorage.getItem("testimonials")||"[]");
  testi.slice().reverse().slice(0,limit).forEach(t=>{
    const div=document.createElement("div");
    div.className="testimonial-card";
    div.innerHTML=`<strong>${escapeHtml(t.name)}</strong><br>${escapeHtml(t.testimonial)}`;
    wrap.appendChild(div);
  });
}

// ======================
// Statistics Section
// ======================
function loadStatistics(){
  const orders=JSON.parse(localStorage.getItem("orders")||"[]");
  document.getElementById("statOrders")?.textContent=orders.length;
  const revenue=orders.reduce((a,c)=>a+Number(c.total||0),0);
  document.getElementById("statRevenue")?.textContent=formatRp(revenue);
  const coupons=JSON.parse(localStorage.getItem("pukis-coupons")||"[]").length;
  document.getElementById("statCoupons")?.textContent=coupons;
}

// ======================================
// Analytics Section (Opsional)
// ======================================
function loadAnalytics(){
  const analytics=JSON.parse(localStorage.getItem("pukis-analytics")||"[]");
  const container=document.getElementById("analyticsData");
  if(container) container.textContent=JSON.stringify(analytics,null,2);
}

// ======================================
// Admin Actions
// ======================================

// Refresh data
document.getElementById("refreshOrders")?.addEventListener("click",loadAllData);

// Export Orders CSV
document.getElementById("exportCSV")?.addEventListener("click",()=>{
  const orders=JSON.parse(localStorage.getItem("orders")||"[]");
  if(!orders.length) return alert("Belum ada order");
  let csv="ID,Nama,WA,Jenis,Isi,Jumlah,Total,Tanggal\n";
  orders.forEach(o=>{
    csv+=`${o.id},"${o.nama}",${o.wa},${o.jenis},${o.isi},${o.jumlahBox},${o.total},${o.createdAt}\n`;
  });
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="orders.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// Clear all orders
document.getElementById("clearOrders")?.addEventListener("click",()=>{
  if(!confirm("Hapus semua pesanan offline?")) return;
  localStorage.removeItem("orders");
  loadOrders();
});

// Logout
document.getElementById("logoutBtn")?.addEventListener("click",()=>{
  localStorage.removeItem("adminLoggedIn");
  showLogin();
});

// ======================================
// Helper Functions
// ======================================
function formatRp(num){
  return "Rp "+Number(num).toLocaleString("id-ID");
}

function escapeHtml(str=""){
  return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ======================================
// Init
// ======================================
document.addEventListener("DOMContentLoaded",()=>{
  if(localStorage.getItem("adminLoggedIn")==="yes") loadAllData();
});
