document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("testimonial-form");
  const nameInput = document.getElementById("name");
  const testimonialInput = document.getElementById("testimonial");
  const container = document.getElementById("testimonials-container");

  function loadTestimonials() {
    const testimonials = JSON.parse(localStorage.getItem("testimonials")) || [];

    container.innerHTML = `<h2>Daftar Testimoni</h2>`;
    if (testimonials.length === 0) {
      container.innerHTML += `<p>Belum ada testimoni pelanggan.</p>`;
      return;
    }

    testimonials.forEach(({ name, testimonial }, index) => {
      const item = document.createElement("div");
      item.classList.add("testimonial-item");
      item.innerHTML = `
        <p class="testimonial-name"><strong>${name}</strong></p>
        <p class="testimonial-text">"${testimonial}"</p>
        <button onclick="hapusTestimoni(${index})" class="delete-btn">Hapus</button>
      `;
      container.appendChild(item);
    });
  }

  window.hapusTestimoni = function (index) {
    if (confirm("Yakin ingin menghapus testimoni ini?")) {
      const data = JSON.parse(localStorage.getItem("testimonials")) || [];
      data.splice(index, 1);
      localStorage.setItem("testimonials", JSON.stringify(data));
      loadTestimonials();
    }
  };

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = nameInput.value.trim();
      const testimonial = testimonialInput.value.trim();

      if (name && testimonial) {
        const testimonials = JSON.parse(localStorage.getItem("testimonials")) || [];
        testimonials.push({ name, testimonial });
        localStorage.setItem("testimonials", JSON.stringify(testimonials));
        loadTestimonials();
        form.reset();
      }
    });
  }

  loadTestimonials();
});
