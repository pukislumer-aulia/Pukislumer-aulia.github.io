document.addEventListener('DOMContentLoaded', () => {
  // Simpan testimoni ke Local Storage
  const form = document.getElementById('testimonialForm');
  const nameInput = document.getElementById('name');
  const testimonialInput = document.getElementById('testimonial');
  const testimonialList = document.getElementById('testimonialList');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const newTestimonial = {
        name: nameInput.value.trim(),
        testimonial: testimonialInput.value.trim()
      };
      let testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
      testimonials.push(newTestimonial);
      localStorage.setItem('testimonials', JSON.stringify(testimonials));
      form.reset();
      displayTestimonials();
    });
  }

  if (testimonialList) {
    displayTestimonials();
  }

  function displayTestimonials() {
    const testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
    testimonialList.innerHTML = '';
    testimonials.forEach((item) => {
      const div = document.createElement('div');
      div.classList.add('testimonial-item');
      div.innerHTML = `
        <strong>${item.name}</strong>: <em>"${item.testimonial}"</em>
      `;
      testimonialList.appendChild(div);
    });

    if (testimonials.length === 0) {
      testimonialList.innerHTML = '<p>Belum ada testimoni pelanggan.</p>';
    }
  }
});

// Fungsi kirim ke WhatsApp
function sendOrder() {
  const nama = document.getElementById('orderName').value.trim();
  const alamat = document.getElementById('orderAddress').value.trim();
  const pesanan = document.getElementById('orderDetails').value.trim();
  const jumlah = document.getElementById('orderQuantity').value.trim();

  const message = `Halo Admin Pukis Lumer Aulia,%0ASaya mau pesan:%0A- Nama: ${nama}%0A- Alamat: ${alamat}%0A- Pesanan: ${pesanan}%0A- Jumlah: ${jumlah}`;
  const whatsappUrl = `https://wa.me/6281296668670?text=${message}`;

  window.open(whatsappUrl, '_blank');
}

// Fungsi undang teman
function shareToFriend() {
  const text = encodeURIComponent('Cobain Pukis Lumer Aulia! Enak banget! Order di Maxim, GrabFood, atau GoFood!');
  const url = encodeURIComponent(window.location.href);
  const shareUrl = `https://wa.me/?text=${text}%20${url}`;

  window.open(shareUrl, '_blank');
}

// Fungsi redirect ke Shopee
function openShopee() {
  window.open('https://shopee.co.id', '_blank');
}

// Fungsi pesan di Maxim
function openMaxim() {
  window.open('https://taximaxim.com/id', '_blank');
}
