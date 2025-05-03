const fakeTestimonials = [
  { name: "Andi", message: "Pukisnya enak banget, topingnya beragam, dan sangat lezat!" },
  { name: "Budi", message: "Favorit saya! Rasa dan kualitas tidak diragukan." },
  { name: "Citra", message: "Coklatnya lumer banget, saya ketagihan!" },
  { name: "Dewi", message: "Lembut, banyak pilihan topping, dan harga terjangkau." },
  { name: "Eka", message: "Pukis Pandannya cocok banget buat teman ngopi!" }
];

// Tampilkan testimoni dari fake + localStorage
function loadStoredTestimonials() {
  const storedTestimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
  const testimonialsContainer = document.getElementById('testimonials');
  testimonialsContainer.innerHTML = "";

  const allTestimonials = [...fakeTestimonials, ...storedTestimonials];

  allTestimonials.forEach(testimonial => {
    const testimonialDiv = document.createElement('div');
    testimonialDiv.classList.add('testimonial');
    testimonialDiv.innerHTML = `
      <p class="testimonial-message">"${testimonial.message}"</p>
      <p class="testimonial-name">- ${testimonial.name}</p>
    `;
    testimonialsContainer.appendChild(testimonialDiv);
  });
}

// Tambah testimoni baru
function addTestimonial() {
  const name = document.getElementById('testimonial-name').value.trim();
  const message = document.getElementById('testimonial-message').value.trim();

  if (!name || !message) {
    alert('Nama dan pesan tidak boleh kosong!');
    return;
  }

  const newTestimonial = { name, message };
  let storedTestimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
  storedTestimonials.push(newTestimonial);
  localStorage.setItem('testimonials', JSON.stringify(storedTestimonials));

  loadStoredTestimonials();

  // Kosongkan form
  document.getElementById('testimonial-name').value = '';
  document.getElementById('testimonial-message').value = '';
}

// Event form
document.getElementById('addTestimonialForm').addEventListener('submit', function(event) {
  event.preventDefault();
  addTestimonial();
});

// Load awal
window.onload = loadStoredTestimonials;
