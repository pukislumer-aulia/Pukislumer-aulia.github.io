/* script.js
   UI helpers unrelated to Order core logic.
   - Loader hide
   - Gallery lightbox
   - Testimonials load
   - Floating share toggle
*/

(function(){
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // loader
  window.addEventListener("load", () => {
    const loader = document.getElementById("site-loader");
    if (loader) setTimeout(() => loader.style.display = "none", 300);
  });

  // gallery lightbox
  document.addEventListener("click", e => {
    const t = e.target;
    if (t.matches(".gallery-img")) {
      const overlay = document.getElementById("lightboxOverlay") || document.getElementById("lightboxOverlay");
      const img = document.getElementById("lightboxImg");
      if (overlay && img) {
        img.src = t.src || t.getAttribute("data-src") || "";
        overlay.classList.add("show");
      }
    }
    if (t.matches("#lightboxOverlay") || t.closest("#lightboxOverlay")) {
      const overlay = document.getElementById("lightboxOverlay");
      if (overlay) overlay.classList.remove("show");
    }
  });

  // testimonials: load from localStorage (already seeded by order.js)
  function loadTestimonials(limit = 3) {
    const container = document.getElementById("testimonialsList");
    if (!container) return;
    const arr = JSON.parse(localStorage.getItem("testimonials") || "[]");
    container.innerHTML = "";
    arr.slice().reverse().slice(0, limit).forEach(t => {
      const li = document.createElement("li");
      li.className = "testimonial-card";
      li.innerHTML = `<strong>${escapeHtml(t.name)}</strong><br>${escapeHtml(t.testimonial)}`;
      container.appendChild(li);
    });
  }

  // helper escape (same as order.js)
  function escapeHtml(str = "") { return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

  // floating share toggle
  document.getElementById("toggleShareBtn")?.addEventListener("click", () => {
    const icons = document.getElementById("floatingIcons"); if (!icons) return;
    const shown = icons.classList.toggle("show");
    icons.setAttribute("aria-hidden", String(!shown));
    document.getElementById("toggleShareBtn").textContent = shown ? "✕" : "+";
  });

  // testimonial submit (if exists)
  document.getElementById("testimonialForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const name = (document.getElementById("nameInput")?.value || "").trim();
    const text = (document.getElementById("testimonialInput")?.value || "").trim();
    if (!name || !text) return alert("Isi nama & testimoni.");
    const arr = JSON.parse(localStorage.getItem("testimonials") || "[]");
    arr.push({ name, testimonial: text, createdAt: new Date().toISOString() });
    localStorage.setItem("testimonials", JSON.stringify(arr));
    document.getElementById("nameInput").value = ""; document.getElementById("testimonialInput").value = "";
    loadTestimonials();
    alert("Terima kasih, testimoni sudah tersimpan!");
  });

  // init
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => loadTestimonials(3));
  else loadTestimonials(3);

})();
