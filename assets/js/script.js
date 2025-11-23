/* ===============================
   PUKIS LUMER AULIA — SCRIPT FINAL PRO
   =============================== */

/* Ambil Data Form */
function getOrderFormData() {
  return {
    id: "INV" + Date.now(),
    name: document.getElementById("buyerName").value,
    menu: document.getElementById("menuSelect").value,
    toppingType: getSelectedToppingType(),
    toppings: getSelectedToppings(),
    boxSize: document.getElementById("boxSize").value,
    qty: parseInt(document.getElementById("qty").value),
    priceEach: calculatePrice(),
    grandTotal: calculateTotal(),
    buyerWA: document.getElementById("buyerWA").value,
    createdAt: new Date().toISOString()
  };
}

/* Topping Type */
function getSelectedToppingType() {
  const t = document.querySelector('input[name="toppingType"]:checked');
  return t ? t.value : "none";
}

/* Toppings List */
function getSelectedToppings() {
  return Array.from(document.querySelectorAll(".topping:checked"))
    .map(t => t.value);
}

/* Validasi Form */
function validateOrder() {
  const order = getOrderFormData();
  if (!order.name || !order.qty || !order.buyerWA) {
    alert("Isi nama, jumlah dan nomor WA terlebih dahulu.");
    return false;
  }
  return true;
}

/* PRICE RULE */
function calculatePrice() {
  const prices = {
    original: { none: 10000, single: 13000, double: 15000 },
    pandan: { none: 12000, single: 15000, double: 18000 }
  };
  const order = getOrderFormData();
  return prices[order.menu][order.toppingType] || 0;
}

/* Hitung Total */
function calculateTotal() {
  const { qty } = getOrderFormData();
  return calculatePrice() * qty;
}

/* Display Total */
function updatePriceUI() {
  const total = calculateTotal();
  document.getElementById("totalDisplay").innerHTML =
    `<strong>Rp ${total.toLocaleString("id-ID")}</strong>`;
}

/* Generate WhatsApp */
function createWhatsAppMessage(order) {
  return `
Halo, saya ingin pesan *Pukis Lumer Aulia*:

👤 Nama: ${order.name}
🍰 Menu: ${order.menu}
🍫 Topping: ${order.toppings.join(", ") || "-"}
📦 Ukuran Box: ${order.boxSize} pcs
🔢 Jumlah Box: ${order.qty}
💰 Total: Rp ${order.grandTotal.toLocaleString("id-ID")}

Mohon diproses ya kak 😊`.trim();
}

/* Kirim WA + Simpan */
function submitOrder() {
  if (!validateOrder()) return;

  const order = getOrderFormData();
  storeOrder(order);

  const waMessage = encodeURIComponent(createWhatsAppMessage(order));
  const waLink = `https://wa.me/6281296668670?text=${waMessage}`;
  window.open(waLink, "_blank");

  alert("Pesanan disimpan dan dikirim ke WhatsApp!");
  document.getElementById("orderForm").reset();
  updatePriceUI();
}

/* SIMPAN PESANAN */
function storeOrder(order) {
  const data = JSON.parse(localStorage.getItem("orders") || "[]");
  data.push(order);
  localStorage.setItem("orders", JSON.stringify(data));
}

/* TESTIMONI */
document.getElementById("testimoniForm")?.addEventListener("submit", (e)=>{
  e.preventDefault();

  const nama = document.getElementById("testiName").value;
  const pesan = document.getElementById("testiMessage").value;

  const testimonials = JSON.parse(localStorage.getItem("testimonials") || "[]");
  testimonials.push({ name:nama, testimonial:pesan });
  localStorage.setItem("testimonials", JSON.stringify(testimonials));

  addTestimonialUI(nama, pesan);
  e.target.reset();
});

function addTestimonialUI(name, text){
  const ul = document.getElementById("listTestimoni");
  const li = document.createElement("li");
  li.innerHTML = `<strong>${name}</strong><br>"${text}"`;
  ul.appendChild(li);
}

/* FLOATING SHARE BUTTON */
document.getElementById("toggleShareBtn")?.addEventListener("click", ()=>{
  document.getElementById("floatingIcons").classList.toggle("show");
});

/* EVENT */
document.querySelectorAll('input[name="toppingType"]').forEach(el=>{
  el.addEventListener("change", ()=>{
    updateToppingList();
    updatePriceUI();
  });
});

document.getElementById("menuSelect")?.addEventListener("change", updatePriceUI);
document.getElementById("boxSize")?.addEventListener("change", updatePriceUI);
document.getElementById("qty")?.addEventListener("input", updatePriceUI);

function updateToppingList(){
  const type = getSelectedToppingType();
  const toppingArea = document.getElementById("toppingArea");
  toppingArea.innerHTML = "";

  const list = type === "none" ? [] :
    ["Coklat","Keju","Oreo","Tiramisu","Matcha","Strawberry"];

  list.forEach(t=>{
    toppingArea.innerHTML += `
      <label><input type="checkbox" class="topping" value="${t}"> ${t}</label>
    `;
  });
}

/* INIT */
window.addEventListener("DOMContentLoaded", ()=>{
  updatePriceUI();
  updateToppingList();
});
