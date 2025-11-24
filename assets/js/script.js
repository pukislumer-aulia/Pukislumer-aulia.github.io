// ================================
// SCRIPT.JS — PUKIS LUMER AULIA
// ================================
console.info("[script.js] Loaded");

/* =======================
   FLOATING SHARE BUTTON
======================= */
const toggleShareBtn = document.getElementById("toggleShareBtn");
const floatingIcons = document.getElementById("floatingIcons");
toggleShareBtn.addEventListener("click", () => {
  floatingIcons.classList.toggle("show");
});

/* =======================
   LIGHTBOX GALLERY
======================= */
document.querySelectorAll(".gallery-img").forEach(img => {
  img.addEventListener("click", () => {
    const overlay = document.getElementById("lightboxOverlay");
    const lightboxImg = document.getElementById("lightboxImg");
    lightboxImg.src = img.src;
    overlay.classList.add("show");
  });
});
document.getElementById("lightboxOverlay").addEventListener("click", e => {
  if(e.target.id === "lightboxOverlay") e.target.classList.remove("show");
});

/* =======================
   BOTTOM NAV HIDE ON SCROLL
======================= */
let lastScroll = 0;
const bottomNav = document.querySelector(".bottom-nav");
window.addEventListener("scroll", () => {
  const current = window.pageYOffset;
  if(current > lastScroll) bottomNav.classList.add("hide");
  else bottomNav.classList.remove("hide");
  lastScroll = current;
});
