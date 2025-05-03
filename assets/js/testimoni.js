// testimoni.js

// Fungsi untuk menampilkan testimonial
function displayTestimonials() {
  const testimonials = [
    { name: "Andi", message: "Pukisnya enak banget, topingnya beragam, dan sangat lezat!" },
    { name: "Budi", message: "Favorit saya, Pukis Lumer Aulia selalu jadi pilihan untuk cemilan. Rasa dan kualitas tidak diragukan!" },
    { name: "Citra", message: "Coklatnya lumer banget! Rasanya pas dan enak. Saya jadi ketagihan!" },
    { name: "Dewi", message: "Pukisnya lembut, toppingnya banyak pilihan, dan harganya terjangkau. Mantap!" },
    { name: "Eka", message: "Rasa Pukis Pandannya enak banget, cocok banget untuk teman ngopi!" }
  ];
document.addEventListener("DOMContentLoaded", () => {
  const testimonialList = document.getElementById("testimonialList");
  const defaultTestimoni = [
    "Kuenya lembut banget dan lumer di mulut!",
    "Toppingnya banyak pilihan dan enak semua.",
    "Pelayanan cepat, kuenya masih hangat saat sampai.",
    "Pukis pandan favorit keluarga saya!",
    "Sudah order 3x, selalu puas!"
  ];

  defaultTestimoni.forEach((isi) => {
    const div = document.createElement("div");
    div.classList.add("testimonial-item");
    div.textContent = isi;
    testimonialList.appendChild(div);
  });
});

function tambahTestimoni() {
  const input = document.getElementById("testimonialInput");
  const isi = input.value.trim();
  if (isi !== "") {
    const testimonialList = document.getElementById("testimonialList");
    const div = document.createElement("div");
    div.classList.add("testimonial-item");
    div.textContent = isi;
    testimonialList.appendChild(div);
    input.value = "";
  }
}
});

  const testimonialsContainer = document.getElementById('testimonials');
  testimonialsContainer.innerHTML = ''; // Clear existing testimonials

  testimonials.forEach(testimonial => {
    const testimonialDiv = document.createElement('div');
    testimonialDiv.classList.add('testimonial');
    testimonialDiv.innerHTML = `
      <p class="testimonial-message">"${testimonial.message}"</p>
      <p class="testimonial-name">- ${testimonial.name}</p>
    `;
    testimonialsContainer.appendChild(testimonialDiv);
  });
}

// Fungsi untuk menambahkan testimonial baru
function addTestimonial() {
  const name = document.getElementById('testimonial-name').value;
  const message = document.getElementById('testimonial-message').value;

  if (!name || !message) {
    alert('Nama dan pesan tidak boleh kosong!');
    return;
  }

  const newTestimonial = { name, message };

  // Simpan testimonial di localStorage (untuk demo saja, bisa disesuaikan)
  let storedTestimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
  storedTestimonials.push(newTestimonial);
  localStorage.setItem('testimonials', JSON.stringify(storedTestimonials));

  // Tampilkan testimonial yang baru ditambahkan
  displayTestimonials();

  // Clear input fields
  document.getElementById('testimonial-name').value = '';
  document.getElementById('testimonial-message').value = '';
}

// Fungsi untuk memuat testimonial dari localStorage saat halaman dimuat
function loadStoredTestimonials() {
  const storedTestimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
  const testimonialsContainer = document.getElementById('testimonials');

  storedTestimonials.forEach(testimonial => {
    const testimonialDiv = document.createElement('div');
    testimonialDiv.classList.add('testimonial');
    testimonialDiv.innerHTML = `
      <p class="testimonial-message">"${testimonial.message}"</p>
      <p class="testimonial-name">- ${testimonial.name}</p>
    `;
    testimonialsContainer.appendChild(testimonialDiv);
  });
}

// Event listener untuk form testimonial
document.getElementById('addTestimonialForm').addEventListener('submit', function(event) {
  event.preventDefault();
  addTestimonial();
});

// Memuat testimonial saat halaman dimuat
window.onload = loadStoredTestimonials;
