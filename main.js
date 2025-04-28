function loadTestimonials() {
  const testimonialList = document.getElementById('testimonialList');
  testimonialList.innerHTML = '';

  let testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];

  testimonials.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'testimonial-item';
    div.innerHTML = `
      <div class="testimonial-name"><b>${item.name}</b></div>
      <div class="testimonial-text">"${item.testimonial}"</div>
      <button onclick="editTestimonial(${index})">Edit</button>
      <button onclick="deleteTestimonial(${index})">Hapus</button>
    `;
    testimonialList.appendChild(div);
  });

  if (testimonials.length === 0) {
    testimonialList.innerHTML = '<p>Belum ada testimoni pelanggan.</p>';
  }
}

function deleteTestimonial(index) {
  let testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
  if (confirm('Yakin ingin menghapus?')) {
    testimonials.splice(index, 1);
    localStorage.setItem('testimonials', JSON.stringify(testimonials));
    loadTestimonials();
  }
}

function editTestimonial(index) {
  let testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
  let newTestimonial = prompt("Edit testimoni:", testimonials[index].testimonial);
  if (newTestimonial !== null) {
    testimonials[index].testimonial = newTestimonial;
    localStorage.setItem('testimonials', JSON.stringify(testimonials));
    loadTestimonials();
  }
}

window.onload = loadTestimonials;
