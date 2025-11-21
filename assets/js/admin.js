// FILE: assets/js/admin.js
import { auth, db, logout, getCollectionData } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) window.location.href = 'login.html';
  else {
    // contoh: load orders
    const orders = await getCollectionData('orders').catch(()=>[]);
    const tbody = document.querySelector('#ordersTable tbody');
    if(tbody) {
      tbody.innerHTML = orders.map(o => `<tr><td>${o.invoiceID||o.id}</td><td>${o.nama||'-'}</td><td>${o.grandTotal? 'Rp '+Number(o.grandTotal).toLocaleString() : '-'}</td><td>${o.buyerWA||'-'}</td><td>${o.createdAt? new Date(o.createdAt).toLocaleString(): '-'}</td></tr>`).join('');
    }
    // testimonials
    const tlist = document.getElementById('testimonialList');
    if(tlist) tlist.innerHTML = (orders.testimoni || []).map(t => `<div class="testimonial-card"><p>${t}</p></div>`).join('');
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await logout();
  window.location.href = 'login.html';
});
