const testimonialForm = document.getElementById('testimonialForm');
const testimonialsList = document.getElementById('testimonialsList');

testimonialForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const name = document.getElementById('nameInput').value;
  const testimonial = document.getElementById('testimonialInput').value;

  const newTestimonial = document.createElement('div');
  newTestimonial.innerHTML = `<strong>${name}</strong><p>${testimonial}</p>`;
  testimonialsList.appendChild(newTestimonial);

  testimonialForm.reset();
  alert('Terima kasih atas testimoninya!');
});
