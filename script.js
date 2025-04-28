// Toggle tampilkan topping atas hanya kalau pilih Double
function toggleToppingAtas() {
  const tipeTopping = document.getElementById('tipeTopping').value;
  const toppingAtasSection = document.getElementById('toppingAtasSection');
  if (tipeTopping === 'Double') {
    toppingAtasSection.style.display = 'block';
  } else {
    toppingAtasSection.style.display = 'none';
  }
}

// Menangani form testimonial
document.addEventListener('DOMContentLoaded', function() {
  const testimonialForm = document.getElementById('testimonialForm');
  const testimonialsList = document.getElementById('testimonialsList');

  testimonialForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const nameInput = document.getElementById('nameInput');
    const testimonialInput = document.getElementById('testimonialInput');

    const testimonialItem = document.createElement('div');
    testimonialItem.classList.add('testimonial-item');
    testimonialItem.innerHTML = `<strong>${nameInput.value}</strong><p>${testimonialInput.value}</p>`;

    testimonialsList.appendChild(testimonialItem);

    testimonialForm.reset();
  });
});
