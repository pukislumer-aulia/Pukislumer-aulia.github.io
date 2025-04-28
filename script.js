function toggleToppingAtas() {
  var tipe = document.getElementById('tipeTopping').value;
  var toppingAtas = document.getElementById('toppingAtasSection');
  toppingAtas.style.display = (tipe === 'Single') ? 'none' : 'block';
}

window.onload = function() {
  toggleToppingAtas();
  loadTestimonials();
};

document.getElementById('testimonialForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const name = document.getElementById('nameInput').value.trim();
  const testimonial = document.getElementById('testimonialInput').value.trim();
  if (name && testimonial) {
    const testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
    testimonials.push({name, testimonial});
    localStorage.setItem('testimonials', JSON.stringify(testimonials));
    displayTestimonial(name, testimonial);
    document.getElementById('testimonialForm').reset();
    alert('Terima kasih atas testimoni Anda!');
  }
});

function loadTestimonials() {
  const testimonials = JSON.parse(localStorage.getItem('testimonials')) || [
    {name: "Dina, Padang", testimonial: "Pukisnya super lembut, topping oreo favorit anak saya!"},
    {name: "Rahmat, Solok", testimonial: "Belum pernah makan pukis selembut ini. Wajib coba!"},
    {name: "Sari, Bukittinggi", testimonial: "Top banget, selalu fresh dan lumer di mulut!"},
    {name: "Andi, Payakumbuh", testimonial: "Double toppingnya bikin nagih. Pelayanan juga ramah."}
  ];
  testimonials.forEach(({name, testimonial}) => displayTestimonial(name, testimonial));
}

function displayTestimonial(name, testimonial) {
  const testimonialList = document.getElementById('testimonialsList');
  const newTestimonial = document.createElement('div');
  newTestimonial.classList.add('testimonial');
  newTestimonial.innerHTML = `<p><em>"${testimonial}"</em><br><strong>— ${name}</strong></p>`;
  testimonialList.appendChild(newTestimonial);
}
