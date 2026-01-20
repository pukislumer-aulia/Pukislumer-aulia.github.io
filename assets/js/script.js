/* ============================================================
   ⚠️ PRODUCTION LOCK ⚠️
   File ini TERKUNCI untuk versi LIVE.
   ❌ Jangan diubah tanpa audit teknis.
   📅 Locked: 2026-01
============================================================ */
/* ============================================================
   script.js — FINAL STABLE (AMAN & TIDAK BENTROK)
   Dipakai bersama order.js (JANGAN DISENTUH)
============================================================ */
(function () {
  "use strict";

  /* ============================================================
     PAGE LOADER
  ============================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    const loader = document.getElementById("site-loader");
    if (loader) {
      setTimeout(() => {
        loader.style.display = "none";
      }, 800);
    }
  });

  /* ============================================================
     FLOATING SHARE BUTTON
     (ID SESUAI HTML: shareToggleBtn & floatingIcons)
  ============================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("shareToggleBtn");
    const icons = document.getElementById("floatingIcons");

    if (!toggle || !icons) return;

    toggle.addEventListener("click", function () {
      const isHidden =
        icons.getAttribute("aria-hidden") === "true" ||
        icons.style.display === "none";

      icons.style.display = isHidden ? "flex" : "none";
      icons.style.flexDirection = "column";
      icons.style.position = "fixed";
      icons.style.right = "18px";
      icons.style.bottom = "78px";
      icons.style.zIndex = "9999";
      icons.setAttribute("aria-hidden", isHidden ? "false" : "true");
    });
  });

  /* ============================================================
     FORM TESTIMONI (LOKAL / FRONTEND ONLY)
     ID SESUAI HTML:
     - testimonialForm
     - nameInput
     - testimonialInput
     - testimonialsList
  ============================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("testimonialForm");
    const nameInput = document.getElementById("nameInput");
    const msgInput = document.getElementById("testimonialInput");
    const list = document.getElementById("testimonialsList");

    if (!form || !nameInput || !msgInput || !list) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = nameInput.value.trim();
      const msg = msgInput.value.trim();
      if (!name || !msg) return;

      const li = document.createElement("li");
      li.className = "testimonial-card";
      li.innerHTML = `”${msg}” — <strong>${name}</strong>`;

      list.prepend(li);
      nameInput.value = "";
      msgInput.value = "";
    });
  });

  /* ============================================================
     SMOOTH SCROLL (AMAN, TIDAK OVERRIDE LINK EKSTERNAL)
  ============================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("a[href^='#']").forEach(link => {
      link.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));
        if (!target) return;

        e.preventDefault();
        window.scrollTo({
          top: target.offsetTop - 70,
          behavior: "smooth"
        });
      });
    });
  });

  /* ============================================================
     AUTO RESIZE TEXTAREA
     (CATATAN ORDER & TESTIMONI)
  ============================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("textarea").forEach(textarea => {
      textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
      });
    });
  });

  /* ============================================================
     PROTEKSI GLOBAL
     - Cegah error jika element hilang
     - Tidak override window / order.js
  ============================================================ */
  window.addEventListener("error", function (e) {
    console.warn("UI script warning:", e.message);
  });

})();
