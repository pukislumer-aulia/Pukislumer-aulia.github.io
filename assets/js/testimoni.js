// testimoni.js

document.addEventListener("DOMContentLoaded", function () {
  const testiContainer = document.querySelector(".testimoni-container");
  const testiItems = document.querySelectorAll(".testimoni-item");
  let currentIndex = 0;

  function showTestimoni(index) {
    testiItems.forEach((item, i) => {
      item.style.display = i === index ? "block" : "none";
    });
  }

  function nextTestimoni() {
    currentIndex = (currentIndex + 1) % testiItems.length;
    showTestimoni(currentIndex);
  }

  if (testiItems.length > 0) {
    showTestimoni(currentIndex);
    setInterval(nextTestimoni, 5000); // Ganti testimoni tiap 5 detik
  }
});
