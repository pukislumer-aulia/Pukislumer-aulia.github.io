// script.js

document.addEventListener("DOMContentLoaded", function () {
  // Smooth scroll untuk navigasi
  const links = document.querySelectorAll("a.scroll");

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });

  // Efek hover gambar
  const galleryImages = document.querySelectorAll(".gallery img");
  galleryImages.forEach((img) => {
    img.addEventListener("mouseenter", () => {
      img.classList.add("hovered");
    });
    img.addEventListener("mouseleave", () => {
      img.classList.remove("hovered");
    });
  });

  // Tombol ajak teman
  const ajakBtn = document.querySelector("#ajak-teman");
  if (ajakBtn) {
    ajakBtn.addEventListener("click", () => {
      const shareText =
        "Ayo coba Pukis Lumer Aulia! Enak banget & banyak toppingnya! Yuk ke Pasar Kuliner Padang Panjang!";
      const url = encodeURIComponent("https://wa.me/?text=" + shareText);
      window.open(url, "_blank");
    });
  }
});
