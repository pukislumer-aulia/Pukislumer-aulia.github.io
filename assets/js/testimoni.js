document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".form-testimonial form");
  const list = document.getElementById("testimoni-list");

  // Load dari localStorage
  const testimonials = JSON.parse(localStorage.getItem("testimonials")) || [];

  function renderTestimonials() {
    list.innerHTML = "";
    testimonials.forEach((t, i) => {
      const div = document.createElement("div");
      div.className = "testimonial";
      div.innerHTML = `<p>"${t.text}" - <strong>${t.name}</strong></p>`;
      list.appendChild(div);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = form.querySelector('input[name="name"]').value.trim();
    const text = form.querySelector('textarea[name="testimonial"]').value.trim();

    if (name && text) {
      testimonials.push({ name, text });
      localStorage.setItem("testimonials", JSON.stringify(testimonials));
      form.reset();
      renderTestimonials();
    }
  });

  renderTestimonials();
});
