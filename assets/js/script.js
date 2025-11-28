/* ======================================================
   SCRIPT.JS FINAL — UI SAJA
   (Tidak ada fungsi order di sini)
====================================================== */

/* ======================================================
   LIGHTBOX GALLERY
====================================================== */
const lightOverlay = document.getElementById("lightboxOverlay");
const lightImg = document.getElementById("lightboxImg");

document.querySelectorAll(".gallery-img").forEach(img => {
  img.addEventListener("click", () => {
    lightImg.src = img.src;
    lightOverlay.classList.add("show");
  });
});

lightOverlay.addEventListener("click", () => {
  lightOverlay.classList.remove("show");
});

/* ======================================================
   FLOATING SHARE BUTTON
====================================================== */
const shareBtn = document.getElementById("shareBtn");

if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    if (navigator.share) {
      navigator.share({
        title: "Aish Original",
        text: "Cek menu pilihan terbaik!",
        url: window.location.href
      });
    }
  });
}
