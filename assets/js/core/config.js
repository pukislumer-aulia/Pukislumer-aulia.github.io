/* =========================================================
   GLOBAL CONFIG – PUKIS LUMER AULIA
   File ini WAJIB di-load sebelum admin.js & order.js
========================================================= */

/* ================= TOKO ================= */
export const STORE = {
  name: "PUKIS LUMER AULIA",
  footer: "Terima kasih telah berbelanja di toko kami",
  signature: "Pukis Lumer Aulia",
  qrImage: "assets/img/qris.png",      // optional
  signImage: "assets/img/ttd.png"      // optional
};

/* ================= ADMIN ================= */
export const ADMIN = {
  PIN: "030419",
  LOGIN_KEY: "admin_login"
};

/* ================= STORAGE KEY ================= */
export const STORAGE = {
  ORDERS: "orders",
  LAST_INVOICE: "last_invoice",
  TESTIMONI: "testimoni"
};

/* ================= ORDER DEFAULT STRUCTURE ================= */
export const ORDER_TEMPLATE = {
  id: "",
  invoice: "",
  date: "",
  customerName: "",
  note: "",
  status: "pending",
  items: {
    jenis: "",
    isiBox: "",
    mode: "",
    topping: [],
    taburan: [],
    jumlahBox: 0,
    hargaSatuan: 0,
    subtotal: 0,
    diskon: 0,
    total: 0
  }
};

/* ================= HELPER ================= */
export function rupiah(num = 0) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

export function formatDate(date) {
  return new Date(date).toLocaleString("id-ID");
}

export function generateInvoice() {
  return "INV-" + Date.now();
}
