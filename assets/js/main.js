// main.js

document.addEventListener("DOMContentLoaded", function () {
  // Toggle navbar responsive
  const toggleBtn = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector("nav ul");

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener("click", function () {
      navMenu.classList.toggle("show-menu");
    });
  }

  // Efek hover untuk galeri
  const galleryItems = document.querySelectorAll(".gallery img");

  galleryItems.forEach((img) => {
    img.addEventListener("mouseenter", () => {
      img.classList.add("hovered");
    });
    img.addEventListener("mouseleave", () => {
      img.classList.remove("hovered");
    });
  });

  // Tombol ajak teman (share WA)
  const shareBtn = document.querySelector("#share-button");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      const text =
        "Yuk cobain Pukis Lumer Aulia di Pasar Kuliner Padang Panjang! Enak, lembut, dan meleleh di mulut!";
      const url = "https://wa.me/?text=" + encodeURIComponent(text);
      window.open(url, "_blank");
    });
  }
});
