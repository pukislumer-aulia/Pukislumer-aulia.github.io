/* =========================================================
   assets/js/order.js
   FINAL TERKUNCI — JANGAN DIEDIT LAGI
   Dipakai oleh: index.html & admin.html
========================================================= */
(function () {
  "use strict";

  /* ================= KONFIG ================= */
  const STORAGE_KEY = "PUKIS_ORDERS";
  const ADMIN_WA = "6281296668670";

  const SINGLE_TOPPINGS = ["Coklat","Tiramisu","Vanilla","Stroberi","Cappucino"];
  const TABURAN = ["Meses","Keju","Kacang","Choco Chip","Oreo"];

  const BASE_PRICE = {
    Original: {
      5: { non: 10000, single: 13000, double: 15000 },
      10:{ non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      5: { non: 12000, single: 15000, double: 18000 },
      10:{ non: 25000, single: 28000, double: 32000 }
    }
  };

  /* ================= UTIL ================= */
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const rp = n => "Rp " + Number(n||0).toLocaleString("id-ID");

  const getRadio = n => document.querySelector(`input[name="${n}"]:checked`)?.value || "";
  const getChecked = n => $$(`input[name="${n}"]:checked`).map(i => i.value);

  function genInvoice(){
    const d = new Date();
    return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  }

  /* ================= STORAGE ================= */
  function getOrders(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveOrder(o){
    const arr = getOrders();
    arr.push(o);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  /* ================= HARGA ================= */
  function pricePerBox(){
    const jenis = getRadio("ultraJenis") || "Original";
    const isi   = Number($("#ultraIsi")?.value || 5);
    const mode  = getRadio("ultraToppingMode") || "non";
    return BASE_PRICE[jenis][isi][mode];
  }

  function updatePrice(){
    const qty = Number($("#ultraJumlah")?.value || 1);
    const p   = pricePerBox();
    const sub = p * qty;
    let disc = 0;
    if (qty >= 10) disc = 1000;
    else if (qty >= 5) disc = Math.round(sub * 0.01);
    const total = sub - disc;

    $("#ultraPricePerBox") && ($("#ultraPricePerBox").textContent = rp(p));
    $("#ultraSubtotal") && ($("#ultraSubtotal").textContent = rp(sub));
    $("#ultraDiscount") && ($("#ultraDiscount").textContent = disc ? "-" + rp(disc) : "-");
    $("#ultraGrandTotal") && ($("#ultraGrandTotal").textContent = rp(total));

    return { p, sub, disc, total };
  }

  /* ================= TOPPING LOCK ================= */
  function resetAllTopping(){
    $$('input[name="topping"], input[name="taburan"]').forEach(c=>{
      c.checked = false;
      c.disabled = true;
    });
  }

  function applyMode(){
    const mode = getRadio("ultraToppingMode");

    resetAllTopping();

    if (mode === "single"){
      $$('input[name="topping"]').forEach(c=>c.disabled=false);
    }

    if (mode === "double"){
      $$('input[name="topping"], input[name="taburan"]').forEach(c=>c.disabled=false);
    }
  }

  /* ================= BUILD ORDER (AMAN) ================= */
  function buildOrder(){
    const nama = $("#ultraNama")?.value.trim();
    const waRaw = $("#ultraWA")?.value.trim();
    if (!nama || !waRaw) {
      alert("Nama & WhatsApp wajib diisi");
      return null;
    }

    let wa = waRaw.replace(/\D/g,"");
    if (wa.startsWith("0")) wa = "62" + wa.slice(1);

    const mode = getRadio("ultraToppingMode") || "non";

    let topping = [];
    let taburan = [];

    if (mode === "single"){
      topping = getChecked("topping").slice(0,5);
    }

    if (mode === "double"){
      topping = getChecked("topping").slice(0,5);
      taburan = getChecked("taburan").slice(0,5);
    }

    const harga = updatePrice();

    return {
      invoice: genInvoice(),
      nama, wa,
      jenis: getRadio("ultraJenis"),
      isi: $("#ultraIsi")?.value,
      mode,
      topping,
      taburan,
      jumlah: Number($("#ultraJumlah")?.value || 1),
      hargaSatuan: harga.p,
      subtotal: harga.sub,
      diskon: harga.disc,
      total: harga.total,
      status: "BARU",
      waktu: Date.now()
    };
  }

  /* ================= WA ================= */
  function sendWA(order){
    const text = `Pesanan Baru\nInvoice: ${order.invoice}\nNama: ${order.nama}\nTotal: ${rp(order.total)}`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`,"_blank");
  }

  /* ================= EVENT ================= */
  function init(){
    $$('input[name="ultraToppingMode"]').forEach(r=>{
      r.addEventListener("change", ()=>{
        applyMode();
        updatePrice();
      });
    });

    $$("input,select").forEach(el=>el.addEventListener("change", updatePrice));

    $("#formUltra")?.addEventListener("submit", e=>{
      e.preventDefault();
      const o = buildOrder();
      if (!o) return;
      saveOrder(o);
      sendWA(o);
      alert("Pesanan tersimpan");
      e.target.reset();
      applyMode();
      updatePrice();
    });

    applyMode();
    updatePrice();
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();

  /* ================= EXPOSE ADMIN ================= */
  window.OrderStore = {
    getAll: getOrders,
    saveAll: arr => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)),
    rp
  };
})();
