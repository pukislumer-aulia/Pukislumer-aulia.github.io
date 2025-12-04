/* ============================================================
   PAGE LOADER
   (Menampilkan loader lalu menghilang setelah halaman siap)
============================================================ */
document.addEventListener("DOMContentLoaded", function () {
    const loader = document.getElementById("site-loader");
    if (loader) {
        setTimeout(() => {
            loader.style.display = "none";
        }, 800); // durasi loader
    }
});


/* ============================================================
   FLOATING SHARE BUTTON
   (Tombol + → munculkan ikon share: WA, Shopee, Maxim, GoFood,
    GrabFood, KombiFood — klik lagi → sembunyikan)
============================================================ */

const toggleShareBtn = document.getElementById("toggleShareBtn");
const floatingIcons = document.getElementById("floatingIcons");

if (toggleShareBtn && floatingIcons) {
    let shareOpen = false;

    toggleShareBtn.addEventListener("click", function () {
        shareOpen = !shareOpen;

        if (shareOpen) {
            floatingIcons.classList.add("show-icons");
        } else {
            floatingIcons.classList.remove("show-icons");
        }
    });
}


/* ============================================================
   FETCH TESTIMONI (Dinamis)
   - Mengambil testimoni dari JSON lokal / API
   - Menampilkan ke dalam <ul id="testimoniList">
============================================================ */

const testimoniList = document.getElementById("testimoniList");

async function loadTestimoni() {
    try {
        const res = await fetch("assets/data/testimoni.json");
        const data = await res.json();

        if (!Array.isArray(data)) return;

        testimoniList.innerHTML = "";

        data.forEach(item => {
            const li = document.createElement("li");
            li.className = "testimonial-item";
            li.innerHTML = `
                <strong>${item.nama}</strong><br>
                <span>${item.pesan}</span>
            `;
            testimoniList.appendChild(li);
        });

    } catch (err) {
        console.warn("Gagal load testimoni:", err);
    }
}

if (testimoniList) loadTestimoni();


/* ============================================================
   FORM TESTIMONI – SIMPAN LOKAL
============================================================ */
const formTestimoni = document.getElementById("form-testimoni");
const inputNamaTesti = document.getElementById("namaTesti");
const inputPesanTesti = document.getElementById("pesanTesti");

if (formTestimoni) {
    formTestimoni.addEventListener("submit", function (e) {
        e.preventDefault();

        const nama = inputNamaTesti.value.trim();
        const pesan = inputPesanTesti.value.trim();

        if (!nama || !pesan) return;

        const li = document.createElement("li");
        li.className = "testimonial-item";
        li.innerHTML = `<strong>${nama}</strong><br>${pesan}`;

        testimoniList.prepend(li);

        inputNamaTesti.value = "";
        inputPesanTesti.value = "";
    });
}
/* ============================================================
   SMOOTH SCROLL UNTUK NAVBAR & BUTTON ORDER
============================================================ */

document.querySelectorAll("a[href^='#']").forEach(link => {
    link.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            e.preventDefault();
            window.scrollTo({
                top: target.offsetTop - 70,
                behavior: "smooth"
            });
        }
    });
});


/* ============================================================
   PERBAIKAN Z-INDEX POPUP NOTA
   (Anti nembus, anti tertutup floating icons, aman di semua HP)
============================================================ */

const notaPopup = document.getElementById("notaPopup");

function showNotaPopup() {
    if (!notaPopup) return;
    notaPopup.classList.add("show-popup");
    document.body.classList.add("no-scroll"); // cegah layar geser saat open
}

function hideNotaPopup() {
    if (!notaPopup) return;
    notaPopup.classList.remove("show-popup");
    document.body.classList.remove("no-scroll");
}


/* ============================================================
   HANDLE CLOSE BUTTON NOTA
============================================================ */

const closeNotaBtn = document.getElementById("closeNota");

if (closeNotaBtn) {
    closeNotaBtn.addEventListener("click", function () {
        hideNotaPopup();
    });
}


/* ============================================================
   DETEKSI POPUP KETIKA KLIK DI LUAR AREA POPUP (SAFE MODE)
============================================================ */

document.addEventListener("click", function (e) {
    if (notaPopup && notaPopup.classList.contains("show-popup")) {
        const box = document.querySelector(".nota-box");
        if (box && !box.contains(e.target) && !e.target.closest("#cekPesananBtn")) {
            hideNotaPopup();
        }
    }
});


/* ============================================================
   STABILISASI MOBILE UI
   (Anti bug scroll pada Android & Safari)
============================================================ */

function lockBodyScroll() {
    document.body.style.overflow = "hidden";
}

function unlockBodyScroll() {
    document.body.style.overflow = "";
}


/* ============================================================
   FUNGSI CEK PESANAN (PANGGIL DARI order.js)
============================================================ */

window.openNotaPopup = function () {
    showNotaPopup();
};


/* ============================================================
   AUTO RESIZE TEXTAREA (CATATAN & FORM TESTIMONI)
============================================================ */

document.querySelectorAll("textarea").forEach(textarea => {
    textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    });
});


/* ============================================================
   ANTI TABRAKAN FLOATING ICON VS POPUP
============================================================ */

function freezeFloatingIcons() {
    const icons = document.getElementById("floatingIcons");
    if (icons) icons.style.pointerEvents = "none";
}

function enableFloatingIcons() {
    const icons = document.getElementById("floatingIcons");
    if (icons) icons.style.pointerEvents = "auto";
}

document.addEventListener("nota-open", freezeFloatingIcons);
document.addEventListener("nota-close", enableFloatingIcons);


/* ============================================================
   OPTIONAL: SHADOW NAVBAR SAAT SCROLL
============================================================ */

const navbar = document.querySelector(".navbar");

if (navbar) {
    window.addEventListener("scroll", function () {
        if (window.scrollY > 20) {
            navbar.classList.add("nav-scroll");
        } else {
            navbar.classList.remove("nav-scroll");
        }
    });
}
