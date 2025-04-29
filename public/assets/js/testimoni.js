// Muat testimoni dari localStorage saat halaman dimuat
window.onload = function () {
  tampilkanTestimoni();
};

function tampilkanTestimoni() {
  const container = document.getElementById('testimonials-container');
  const data = JSON.parse(localStorage.getItem('testimonials')) || [];

  container.innerHTML = `
    <h2>Daftar Testimoni</h2>
    ${data.length === 0 ? '<p>Belum ada testimoni pelanggan.</p>' : ''}
  `;

  data.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'testimonial-item';
    div.innerHTML = `
      <p class="testimonial-name"><strong>${item.name}</strong></p>
      <p class="testimonial-text">"${item.testimonial}"</p>
      <button onclick="hapusTestimoni(${index})" class="delete-btn">Hapus</button>
    `;
    container.appendChild(div);
  });
}

function hapusTestimoni(index) {
  if (confirm('Yakin ingin menghapus testimoni ini?')) {
    const data = JSON.parse(localStorage.getItem('testimonials')) || [];
    data.splice(index, 1);
    localStorage.setItem('testimonials', JSON.stringify(data));
    tampilkanTestimoni();
  }
}

document.getElementById('testimonial-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const testimonial = document.getElementById('testimonial').value.trim();

  if (name && testimonial) {
    const data = JSON.parse(localStorage.getItem('testimonials')) || [];
    data.push({ name, testimonial });
    localStorage.setItem('testimonials', JSON.stringify(data));

    this.reset();
    tampilkanTestimoni();
  }
});
