// Toggle Topping Atas hanya jika pilih "Double"
function toggleToppingAtas() {
  const tipeTopping = document.getElementById('tipeTopping').value;
  const toppingAtasSection = document.getElementById('toppingAtasSection');
  toppingAtasSection.style.display = tipeTopping === 'Double' ? 'block' : 'none';
}

// Menyimpan dan menampilkan testimoni
document.getElementById('testimonialForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('nameInput').value.trim();
  const testimonial = document.getElementById('testimonialInput').value.trim();

  if (name && testimonial) {
    let testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
    testimonials.push({ name, testimonial });
    localStorage.setItem('testimonials', JSON.stringify(testimonials));

    document.getElementById('nameInput').value = '';
    document.getElementById('testimonialInput').value = '';
    alert('Terima kasih atas testimoni kamu!');
    showTestimonials();
  }
});

function showTestimonials() {
  const container = document.getElementById('testimonialsList');
  if (!container) return;

  const testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
  container.innerHTML = '';

  testimonials.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'testimonial';
    div.innerHTML = `<p><strong>${item.name}</strong>: "${item.testimonial}"</p>`;
    container.appendChild(div);
  });
}

// Panggil fungsi saat load halaman
window.onload = function () {
  toggleToppingAtas();
  showTestimonials();
};
