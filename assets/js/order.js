/* =========================================================
   assets/js/order.js — FINAL STABLE
   Compatible with:
   - index.html (frontend)
   - admin.js / assets/js/modules/orders.js
   - localStorage key: "orders"
   ========================================================= */

(function () {
  "use strict";

  /* ================= CONFIG ================= */
  const ADMIN_WA = "6281296668670";
  const STORAGE_KEY = "orders";

  const SINGLE_TOPPINGS = ["Coklat", "Tiramisu", "Vanilla", "Stroberi", "Cappucino"];
  const TABURAN_TOPPINGS = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

  const BASE_PRICE = {
    Original: {
      5: { non: 10000, single: 13000, double: 15000 },
      10: { non: 18000, single: 25000, double: 28000 }
    },
    Pandan: {
      5: { non: 12000, single: 15000, double: 17000 },
      10: { non: 21000, single: 28000, double: 32000 }
    }
  };

  /* ================= HELPERS ================= */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function rupiah(n) {
    return "Rp " + Number(n || 0).toLocaleString("id-ID");
  }

  function invoiceId() {
    const d = new Date();
    return (
      "INV-" +
      d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      "-" +
      Math.random().toString(36).substr(2, 5).toUpperCase()
    );
  }

  function getRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  }

  function checkedValues(name) {
    return $$(`input[name="${name}"]:checked`).map((i) => i.value);
  }

  /* ================= ELEMENTS ================= */
  const elNama = $("#ultraNama");
  const elWA = $("#ultraWA");
  const elJumlah = $("#ultraJumlah");
  const elNote = $("#ultraNote");

  const elSingleGroup = $("#ultraSingleGroup");
  const elDoubleGroup = $("#ultraDoubleGroup");

  const elPricePerBox = $("#ultraPricePerBox");
  const elSubtotal = $("#ultraSubtotal");
  const elDiscount = $("#ultraDiscount");
  const elGrandTotal = $("#ultraGrandTotal");

  const notaContainer = $("#notaContainer");
  const notaContent = $("#notaContent");
  const notaClose = $("#notaClose");
  const notaConfirm = $("#notaConfirm");

  /* ================= BUILD TOPPING UI ================= */
  function buildToppings() {
    if (elSingleGroup && elSingleGroup.innerHTML.trim() === "") {
      SINGLE_TOPPINGS.forEach((t) => {
        elSingleGroup.insertAdjacentHTML(
          "beforeend",
          `<label class="topping-option">
            <input type="checkbox" name="toppingSingle" value="${t}"> ${t}
          </label>`
        );
      });
    }

    if (elDoubleGroup && elDoubleGroup.innerHTML.trim() === "") {
      SINGLE_TOPPINGS.forEach((t) => {
        elDoubleGroup.insertAdjacentHTML(
          "beforeend",
          `<label class="topping-option">
            <input type="checkbox" name="toppingDouble" value="${t}"> ${t}
          </label>`
        );
      });

      TABURAN_TOPPINGS.forEach((t) => {
        elDoubleGroup.insertAdjacentHTML(
          "beforeend",
          `<label class="topping-option">
            <input type="checkbox" name="taburan" value="${t}"> ${t}
          </label>`
        );
      });
    }
  }

  function updateToppingVisibility() {
    const mode = getRadio("ultraToppingMode");

    elSingleGroup.classList.add("hidden");
    elDoubleGroup.classList.add("hidden");

    if (mode === "single") elSingleGroup.classList.remove("hidden");
    if (mode === "double") elDoubleGroup.classList.remove("hidden");
  }

  /* ================= PRICE ================= */
  function pricePerBox() {
    const jenis = getRadio("ultraJenis") || "Original";
    const isi = Number($("#ultraIsi").value || 5);
    const mode = getRadio("ultraToppingMode") || "non";
    return BASE_PRICE[jenis][isi][mode];
  }

  function discount(jumlah, subtotal) {
    if (jumlah >= 10) return 1000;
    if (jumlah >= 5) return Math.round(subtotal * 0.01);
    return 0;
  }

  function updatePrice() {
    const harga = pricePerBox();
    const jumlah = Number(elJumlah.value || 1);
    const sub = harga * jumlah;
    const disc = discount(jumlah, sub);
    const total = sub - disc;

    elPricePerBox.textContent = rupiah(harga);
    elSubtotal.textContent = rupiah(sub);
    elDiscount.textContent = disc ? "-" + rupiah(disc) : "-";
    elGrandTotal.textContent = rupiah(total);

    return { harga, sub, disc, total };
  }

  /* ================= BUILD ORDER ================= */
  function buildOrder() {
    if (!elNama.value.trim()) return alert("Nama wajib diisi");
    if (!elWA.value.trim()) return alert("No WA wajib diisi");

    const hargaInfo = updatePrice();

    return {
      id: invoiceId(),
      invoice: invoiceId(),
      customerName: elNama.value.trim(),
      wa: elWA.value.trim(),
      note: elNote.value.trim(),

      jenis: getRadio("ultraJenis"),
      isi: $("#ultraIsi").value,
      mode: getRadio("ultraToppingMode"),

      topping: checkedValues("toppingSingle").concat(
        checkedValues("toppingDouble")
      ),
      taburan: checkedValues("taburan"),

      jumlah: Number(elJumlah.value),
      hargaSatuan: hargaInfo.harga,
      subtotal: hargaInfo.sub,
      discount: hargaInfo.disc,
      total: hargaInfo.total,

      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /* ================= NOTA ================= */
  function renderNota(order) {
    return `
      <div><b>Invoice:</b> ${order.invoice}</div>
      <div><b>Nama:</b> ${order.customerName}</div>
      <div><b>WA:</b> ${order.wa}</div>
      <hr>
      <div><b>Jenis:</b> ${order.jenis}</div>
      <div><b>Isi:</b> ${order.isi} pcs</div>
      <div><b>Jumlah:</b> ${order.jumlah} box</div>
      <div><b>Topping:</b> ${order.topping.join(", ") || "-"}</div>
      <div><b>Taburan:</b> ${order.taburan.join(", ") || "-"}</div>
      <hr>
      <div><b>Total:</b> ${rupiah(order.total)}</div>
    `;
  }

  /* ================= STORAGE ================= */
  function saveOrder(order) {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    arr.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function openWA(order) {
    const msg = encodeURIComponent(
      `INVOICE ${order.invoice}\nNama: ${order.customerName}\nTotal: ${rupiah(
        order.total
      )}`
    );
    window.open(`https://wa.me/${ADMIN_WA}?text=${msg}`, "_blank");
  }

  /* ================= EVENTS ================= */
  $("#ultraSubmit").addEventListener("click", function () {
    const order = buildOrder();
    if (!order) return;

    window.__pendingOrder = order;
    notaContent.innerHTML = renderNota(order);
    notaContainer.style.display = "flex";
  });

  notaClose.addEventListener("click", () => (notaContainer.style.display = "none"));

  notaConfirm.addEventListener("click", function () {
    const order = window.__pendingOrder;
    if (!order) return;

    saveOrder(order);
    openWA(order);
    notaContainer.style.display = "none";
    alert("Pesanan dikirim. Admin akan memvalidasi via WA.");
    $("#formUltra").reset();
    updatePrice();
  });

  /* ================= INIT ================= */
  document.addEventListener("DOMContentLoaded", function () {
    buildToppings();
    updateToppingVisibility();
    updatePrice();

    $$('input[name="ultraToppingMode"]').forEach((r) =>
      r.addEventListener("change", updateToppingVisibility)
    );

    $("#ultraIsi").addEventListener("change", updatePrice);
    elJumlah.addEventListener("input", updatePrice);
  });
})();
