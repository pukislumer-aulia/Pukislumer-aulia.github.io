// index.js

document.addEventListener("DOMContentLoaded", function () {
  // Smooth scroll ke bagian saat klik menu
  const navLinks = document.querySelectorAll("nav a[href^='#']");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Animasi saat scroll
  const animatedItems = document.querySelectorAll(".animate-on-scroll");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    },
    { threshold: 0.1 }
  );

  animatedItems.forEach((item) => {
    observer.observe(item);
  });
});
