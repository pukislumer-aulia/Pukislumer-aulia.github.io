// main.js

// Menangani tampilan dan interaksi halaman utama

// Mendapatkan elemen-elemen dari halaman
const promoBanner = document.querySelector('.promo-banner');
const gallery = document.querySelector('.gallery');

// Fungsi untuk menampilkan atau menyembunyikan promo banner
function togglePromoBanner() {
  if (promoBanner) {
    promoBanner.style.display = promoBanner.style.display === 'none' ? 'block' : 'none';
  }
}

// Fungsi untuk menampilkan galeri gambar dengan efek zoom saat diklik
function setupGallery() {
  const images = gallery.querySelectorAll('img');
  images.forEach(image => {
    image.addEventListener('click', () => {
      const imgSrc = image.getAttribute('src');
      const modal = document.createElement('div');
      modal.classList.add('modal');
      const modalImg = document.createElement('img');
      modalImg.src = imgSrc;
      modal.appendChild(modalImg);
      document.body.appendChild(modal);
      
      // Menutup modal ketika diklik
      modal.addEventListener('click', () => {
        modal.remove();
      });
    });
  });
}

// Fungsi untuk mengatur tampilan halaman galeri dan promo banner
function initPage() {
  // Setup gallery images
  setupGallery();

  // Menampilkan atau menyembunyikan promo banner setelah beberapa detik
  setTimeout(togglePromoBanner, 5000);
}

// Menjalankan inisialisasi halaman saat DOM siap
document.addEventListener('DOMContentLoaded', initPage);

// Optional: Menambahkan event listener untuk interaksi lainnya
// Contoh: Mengubah ukuran gambar header ketika ukuran layar berubah
window.addEventListener('resize', () => {
  const headerImg = document.querySelector('.header-img');
  if (headerImg) {
    headerImg.style.width = window.innerWidth < 768 ? '100%' : 'auto';
  }
});
