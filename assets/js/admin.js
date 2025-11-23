/* ADMIN DASHBOARD PRO — HYBRID VERSION (Firebase + LocalStorage) */

import { auth, db, logout, getCollectionData } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// === PIN Backup (Digunakan jika Firebase Auth gagal) ===
const ADMIN_PIN = "123456";

const loginModal = document.getElementById("adminLoginModal");
const adminContent = document.getElementById("adminContent");

function localLoginMode() {
  loginModal.style.display = "flex";
  adminContent.style.display = "none";
}

function firebaseLoginMode() {
  loginModal.style.display = "none";
  adminContent.style.display = "block";
}

// === PIN LOGIN HANDLER ===
document.getElementById("adminLoginBtn")?.addEventListener("click", () => {
  const pin = document.getElementById("adminPinInput")?.value;
  if(pin === ADMIN_PIN){
    localStorage.setItem("adminLoggedIn", "yes");
    firebaseLoginMode();
    loadPageData();
  } else {
    alert("PIN Salah!");
  }
});

// === Firebase LOGIN HANDLER ===
onAuthStateChanged(auth, async (user) => {
  if (user) {
    firebaseLoginMode();
    loadPageData(true);
  } else {
    if(localStorage.getItem("adminLoggedIn") === "yes"){
      firebaseLoginMode();
      loadPageData();
    } else {
      localLoginMode();
    }
  }
});

// === LOAD DATA ===
async function loadPageData(firebase = false){
  loadLocalOrders();
  loadLocalTestimonials();
  loadAnalytics();
  loadStats();

  if(firebase){
    await loadFirebaseOrders();
  }
}

/* ==============
   LOAD ORDERS
================= */

// Firebase Orders
async function loadFirebaseOrders(){
  const tbody = document.querySelector('#ordersTable tbody');
  const orders = await getCollectionData('orders').catch(()=>[]);

  orders.forEach(o => {
    const row = `
      <tr>
        <td>${o.invoiceID || o.id}</td>
        <td>${o.nama || '-'}</td>
        <td>${o.grandTotal ? 'Rp ' + Number(o.grandTotal).toLocaleString() : '-'}</td>
        <td>${o.buyerWA || '-'}</td>
        <td>${o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
      </tr>`;
    tbody.innerHTML += row;
  });
}

// Local Orders (Backup Mode Offline)
function loadLocalOrders(){
  const tbody = document.querySelector('#ordersTable tbody');
  tbody.innerHTML = "";
  const orders = JSON.parse(localStorage.getItem("pukis-orders") || "[]");

  orders.forEach(o=>{
    tbody.innerHTML += `
      <tr>
        <td>${o.id}</td>
        <td>${o.name}</td>
        <td>${o.wa}</td>
        <td>${o.qty}</td>
        <td>Rp${Number(o.total).toLocaleString('id-ID')}</td>
        <td>${new Date(o.ts).toLocaleString()}</td>
      </tr>`;
  });
}

/* ==============
   TESTIMONIALS
================= */
function loadLocalTestimonials(){
  const wrap = document.getElementById("testimonialList");
  wrap.innerHTML = "";

  const testimonials = JSON.parse(localStorage.getItem("testimonials") || "[]");
  testimonials.forEach(t => {
    wrap.innerHTML += `
      <div class="testimonial-card">
        <p>"${t.testimonial}"</p>
        <small>— ${t.name}</small>
      </div>`;
  });
}

/* ==============
   ANALYTICS
================= */
function loadAnalytics(){
  const raw = JSON.parse(localStorage.getItem("pukis-analytics") || "[]");
  document.getElementById("analyticsData").textContent =
    JSON.stringify(raw, null, 2);
}

/* ==============
   STATISTICS
================= */
function loadStats(){
  const orders = JSON.parse(localStorage.getItem("pukis-orders") || "[]");

  document.getElementById("statOrders").textContent = orders.length;
  const revenue = orders.reduce((a,c)=> a + Number(c.total||0), 0);
  document.getElementById("statRevenue").textContent = "Rp" + revenue.toLocaleString("id-ID");

  const coupons = JSON.parse(localStorage.getItem("pukis-coupons-used") || "[]");
  document.getElementById("statCoupons").textContent = coupons.length;
}

/* ==============
   EXPORT & CLEAR
================= */

document.getElementById("refreshOrders")?.addEventListener("click", loadPageData);

document.getElementById("exportCSV")?.addEventListener("click", ()=>{
  const orders = JSON.parse(localStorage.getItem('pukis-orders')||'[]');
  let csv = 'id,name,wa,qty,total,ts\n' + orders.map(o=> `${o.id},"${o.name}",${o.wa},${o.qty},${o.total},${o.ts}`).join('\n');
  
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = 'orders-export.csv';
  a.click();
});

document.getElementById("clearOrders")?.addEventListener("click",()=>{
  if(confirm("Hapus semua pesanan offline?")){
    localStorage.removeItem("pukis-orders");
    loadLocalOrders();
  }
});

/* ==============
   LOGOUT
================= */
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  localStorage.removeItem("adminLoggedIn");
  await logout();
  loginModal.style.display = "flex";
  adminContent.style.display = "none";
});
