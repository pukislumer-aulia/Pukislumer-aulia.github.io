function toggleToppingAtas() {
  const tipeTopping = document.getElementById("tipeTopping").value;
  const toppingAtasSection = document.getElementById("toppingAtasSection");
  toppingAtasSection.style.display = tipeTopping === "Double" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", function () {
  // Untuk testimoni
  const testimonialForm = document.getElementById("testimonialForm");
  const nameInput = document.getElementById("nameInput");
  const testimonialInput = document.getElementById("testimonialInput");
  const testimonialsList = document.getElementById("testimonialsList");

  function loadTestimonials() {
    const testimonials = JSON.parse(localStorage.getItem("testimonials")) || [];
    testimonialsList.innerHTML = "";

    testimonials.forEach(({ name, testimonial }) => {
      const item = document.createElement("div");
      item.classList.add("testimonial-item");
      item.innerHTML = `
        <p class="testimonial-name">${name}</p>
        <p class="testimonial-text">"${testimonial}"</p>
      `;
      testimonialsList.appendChild(item);
    });
  }

  if (testimonialForm) {
    testimonialForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = nameInput.value.trim();
      const testimonial = testimonialInput.value.trim();

      if (name && testimonial) {
        const testimonials = JSON.parse(localStorage.getItem("testimonials")) || [];
        testimonials.push({ name, testimonial });
        localStorage.setItem("testimonials", JSON.stringify(testimonials));
        loadTestimonials();
        testimonialForm.reset();
      }
    });
  }

  loadTestimonials();
});

// Fungsi untuk tombol "Ajak Teman"
function ajakTeman() {
  const message = encodeURIComponent("Hai! Coba deh Pukis Lumer Aulia di Pasar Kuliner Padang Panjang. Enak banget! Bisa order di GrabFood, GoFood, atau Maxim Food. IG: @pukis.lumer_aulia");
  const whatsappUrl = `https://wa.me/?text=${message}`;
  window.open(whatsappUrl, '_blank');
}
