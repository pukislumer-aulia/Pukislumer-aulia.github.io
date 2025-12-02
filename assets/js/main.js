/* assets/js/main.js — UI helpers global (safe to include everywhere) */
(function(){
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // Floating icons toggle
  const toggleBtn = $('#toggleShareBtn');
  const floating = $('#floatingIcons');
  if (toggleBtn && floating){
    toggleBtn.addEventListener('click', () => {
      floating.classList.toggle('show');
      const is = floating.classList.contains('show');
      floating.setAttribute('aria-hidden', !is);
    });
  }

  // Lightbox for gallery images
  const galleryImgs = $$('.gallery-img');
  const lightbox = $('#lightboxOverlay');
  const lightboxImg = $('#lightboxImg');
  if (galleryImgs.length && lightbox && lightboxImg){
    galleryImgs.forEach(img => {
      img.addEventListener('click', () => {
        const src = img.dataset.full || img.src;
        lightboxImg.src = src;
        lightbox.style.display = 'flex';
        lightbox.setAttribute('aria-hidden', 'false');
      });
    });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === lightboxImg){
        lightbox.style.display = 'none';
        lightbox.setAttribute('aria-hidden', 'true');
        lightboxImg.src = '';
      }
    });
  }

  // Testimonials submission (client-side only)
  const testForm = $('#testimonialForm');
  const testList = $('#testimonialsList');
  if (testForm && testList){
    testForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('nameInput')?.value || '').trim();
      const text = (document.getElementById('testimonialInput')?.value || '').trim();
      if (!name || !text){ alert('Isi nama & testimoni.'); return; }
      const li = document.createElement('li');
      li.className = 'testimonial-card';
      li.innerHTML = `<strong>${escapeHtml(name)}</strong><br>${escapeHtml(text)}`;
      testList.prepend(li);
      testForm.reset();
    });
  }

  // Simple escape to prevent accidental injection in testimonial UI
  function escapeHtml(s){ return String(s||'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c])); }

  // Prevent JS errors if some scripts expect a global order object
  window.APP = window.APP || {};
  window.APP.utils = {
    formatRp: (n) => {
      const v = Number(n||0);
      if (Number.isNaN(v)) return 'Rp0';
      return 'Rp ' + v.toLocaleString('id-ID');
    }
  };

})();
