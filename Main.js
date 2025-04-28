function toggleToppingAtas() {
  var tipe = document.getElementById('tipeTopping').value;
  var toppingAtas = document.getElementById('toppingAtasSection');
  toppingAtas.style.display = (tipe === 'Single') ? 'none' : 'block';
}

function loadTestimonials() {
  const testimonials = JSON.parse(localStorage.getItem('testimonials')) || [...];
  testimonials.forEach(({name, testimonial}) => displayTestimonial(name, testimonial));
}

function displayTestimonial(name, testimonial) {
  const testimonialList = document.getElementById('testimonialsList');
  const newTestimonial = document.createElement('div');
  newTestimonial.classList.add('testimonial');
  newTestimonial.innerHTML = `<p><em>"${testimonial}"</em><br><strong>— ${name}</strong></p>`;
  testimonialList.appendChild(newTestimonial);
}

document.addEventListener('DOMContentLoaded', function() {
  toggleToppingAtas();
  loadTestimonials();

  document.getElementById('testimonialForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('nameInput').value.trim();
    const testimonial = document.getElementById('testimonialInput').value.trim();
    if (name && testimonial) {
      const testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
      testimonials.push({name, testimonial});
      localStorage.setItem('testimonials', JSON.stringify(testimonials));
      displayTestimonial(name, testimonial);
      this.reset();
      alert('Terima kasih atas testimoni Anda!');
    }
  });
});
