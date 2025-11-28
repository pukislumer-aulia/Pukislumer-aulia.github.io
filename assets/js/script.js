/* =========================================================
   SCRIPT.JS — FINAL CLEAN (PART 1/2)
   Fungsi umum halaman:
   - Form testimoni
   - Render testimoni
   - Simpan testimoni ke localStorage
   - Kontrol galeri
   - Scroll dan UI helper
   Tidak ada fungsi order di file ini (semua di order.js)
========================================================= */


/* =========================================================
   LOCAL STORAGE TESTIMONI
========================================================= */

function loadTestimoni() {
  let data = localStorage.getItem("testimoniList");
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveTestimoni(list) {
  localStorage.setItem("testimoniList", JSON.stringify(list));
}


/* =========================================================
   RENDER TESTIMONI
========================================================= */

function renderTestimoni() {
  const list = loadTestimoni();
  const container = document.getElementById("testimoniList");

  if (!container) return;

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p>Belum ada testimoni.</p>";
    return;
  }

  list.forEach((item) => {
    const card = document.createElement("div");
    card.className = "testi-card";
    card.innerHTML = `
      <div class="testi-name">${item.nama}</div>
      <div class="testi-text">${item.pesan}</div>
      <div class="testi-date">${item.tanggal}</div>
    `;
    container.appendChild(card);
  });
}


/* =========================================================
   SUBMIT TESTIMONI
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-testimoni");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nama = document.getElementById("namaTesti").value.trim();
    const pesan = document.getElementById("pesanTesti").value.trim();

    if (nama === "" || pesan === "") {
      alert("Nama dan testimoni wajib diisi.");
      return;
    }

    const list = loadTestimoni();

    list.unshift({
      nama,
      pesan,
      tanggal: new Date().toLocaleString("id-ID")
    });

    saveTestimoni(list);
    renderTestimoni();

    form.reset();
    alert("Terima kasih, testimoni berhasil dikirim!");
  });

  renderTestimoni();
});


/* =========================================================
   GALLERY PREVIEW
========================================================= */

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("gallery-img")) {
    showImagePreview(e.target.src);
  }
});

function showImagePreview(src) {
  const popup = document.getElementById("imagePreview");
  const img = document.getElementById("imagePreviewImg");

  if (!popup || !img) return;

  img.src = src;
  popup.classList.add("show");
}

document.getElementById("closePreview")?.addEventListener("click", () => {
  document.getElementById("imagePreview").classList.remove("show");
});

/* =========================================================
   SCRIPT.JS — FINAL CLEAN (PART 2/2)
   FUNGSI UMUM TAMBAHAN (NON ORDER)
========================================================= */


/* =========================================================
   SMOOTH SCROLLING UNTUK LINK
========================================================= */

document.querySelectorAll("a[href^='#']").forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});


/* =========================================================
   UI HELPER — FIX NAV AUTO SCROLL
========================================================= */

window.addEventListener("load", () => {
  if (window.location.hash) {
    const section = document.querySelector(window.location.hash);
    if (section) {
      setTimeout(() => {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }
});


/* =========================================================
   PRELOAD IMAGE (Logo, QRIS, TTD)
========================================================= */

const preloadImages = [
  "logo.png",
  "qris.jpg",
  "ttd.png"
];

preloadImages.forEach((src) => {
  const img = new Image();
  img.src = src;
});


/* =========================================================
   ENABLE CARD TILT (EFEK MELAYANG)
========================================================= */

document.querySelectorAll(".ultra-card, .testi-card, .fact-box").forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    card.style.transform = `
      perspective(600px)
      rotateX(${(-y / 30)}deg)
      rotateY(${(x / 30)}deg)
      scale(1.02)
    `;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "none";
  });
});


/* =========================================================
   SHOW/HIDE BACK TO TOP BUTTON
========================================================= */

const backTop = document.getElementById("backToTop");

if (backTop) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) backTop.classList.add("show");
    else backTop.classList.remove("show");
  });

  backTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}


/* =========================================================
   DONE — SCRIPT.JS FINAL
========================================================= */

console.log("script.js final loaded.");
