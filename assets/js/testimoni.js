document.addEventListener("DOMContentLoaded", function () {
  const testimonialsList = document.getElementById("testimonialsList");
  const testimonialForm = document.getElementById("testimonialForm");
  const nameInput = document.getElementById("nameInput");
  const testimonialInput = document.getElementById("testimonialInput");

  // Ambil testimoni dari localStorage atau pakai default jika kosong
  let testimonials = JSON.parse(localStorage.getItem("testimonials")) || [
    { name: "Rina", text: "Pukisnya lembut banget, favorit keluarga!" },
    { name: "Dodi", text: "Toppingnya mewah, harga bersahabat." },
    { name: "Sari", text: "Cocok untuk oleh-oleh dan ngemil!" },
  ];

  function displayTestimonials() {
    testimonialsList.innerHTML = "";
    testimonials.forEach((t) => {
      const div = document.createElement("div");
      div.classList.add("testimonial");
      div.innerHTML = `<strong>${t.name}</strong><p>${t.text}</p>`;
      testimonialsList.appendChild(div);
    });
  }

  testimonialForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const newTestimonial = {
      name: nameInput.value.trim(),
      text: testimonialInput.value.trim(),
    };
    if (newTestimonial.name && newTestimonial.text) {
      testimonials.push(newTestimonial);
      localStorage.setItem("testimonials", JSON.stringify(testimonials)); // Simpan ke localStorage
      displayTestimonials();
      nameInput.value = "";
      testimonialInput.value = "";
    }
  });

  displayTestimonials();
});
