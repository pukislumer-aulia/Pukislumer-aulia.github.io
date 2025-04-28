// Animasi header saat halaman dibuka
window.addEventListener('load', () => {
  const headerImg = document.querySelector('header img');
  headerImg.style.opacity = 0;
  headerImg.style.transform = 'scale(1.2)';
  
  setTimeout(() => {
    headerImg.style.transition = 'opacity 1s ease, transform 1s ease';
    headerImg.style.opacity = 1;
    headerImg.style.transform = 'scale(1)';
  }, 100);
});

// Efek hover tambahan pada tombol
const buttons = document.querySelectorAll('button');
buttons.forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
  });
});
