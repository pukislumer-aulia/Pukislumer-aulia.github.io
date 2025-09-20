// ==========================================
// 🔹 admin.js
// 🔹 Mengelola konten About, Promo, Galeri & Testimoni
// ==========================================

import { auth, checkLoginRedirect, getDocData, updateAboutData } from "./firebase.js";

// ==========================================
// 🔹 Pastikan user sudah login
// ==========================================
checkLoginRedirect();

// ==========================================
// 🔹 Ambil elemen input
// ==========================================
const judulInput       = document.getElementById("judulInput");
const sapaanInput      = document.getElementById("sapaanInput");
const doaInput         = document.getElementById("doaInput");
const lokasiInput      = document.getElementById("lokasiInput");
const ojolInput        = document.getElementById("ojolInput");
const alasanInput      = document.getElementById("alasanInput");
const promoTextInput   = document.getElementById("promoTextInput");
const promoImageInput  = document.getElementById("promoImageInput");
const footerInput      = document.getElementById("footerInput");
const testimoniInput   = document.getElementById("testimoniInput"); // Pisah baris
const galeriInput      = document.getElementById("galeriInput");    // Pisah dengan "|"
const btnSimpan        = document.getElementById("btnSimpan");

// ==========================================
// 🔹 Load data awal dari Firestore
// ==========================================
async function loadAbout() {
    const data = await getDocData("content", "about");
    if (!data) return;

    judulInput.value       = data.judul || "";
    sapaanInput.value      = data.sapaan || "";
    doaInput.value         = data.doa || "";
    lokasiInput.value      = data.lokasi || "";
    ojolInput.value        = data.ojol || "";
    alasanInput.value      = data.alasan || "";
    promoTextInput.value   = data.promoText || "";
    promoImageInput.value  = data.promoImage || "";
    footerInput.value      = data.footer || "";
    testimoniInput.value   = Array.isArray(data.testimoni) ? data.testimoni.join("\n") : "";
    galeriInput.value      = Array.isArray(data.galeri) ? data.galeri.join("|") : "";
}

// Panggil load data saat halaman terbuka
loadAbout();

// ==========================================
// 🔹 Simpan perubahan ke Firestore
// ==========================================
btnSimpan.addEventListener("click", async () => {

    const data = {
        judul       : judulInput.value,
        sapaan      : sapaanInput.value,
        doa         : doaInput.value,
        lokasi      : lokasiInput.value,
        ojol        : ojolInput.value,
        alasan      : alasanInput.value,
        promoText   : promoTextInput.value,
        promoImage  : promoImageInput.value,
        footer      : footerInput.value,
        testimoni   : testimoniInput.value.split("\n")
                         .map(t => t.trim())
                         .filter(t => t),
        galeri      : galeriInput.value.split("|")
                         .map(u => u.trim())
                         .filter(u => u)
    };

    try {
        await updateAboutData(data);
        alert("✅ Data berhasil diperbarui!");
    } catch (err) {
        console.error(err);
        alert("❌ Gagal memperbarui data. Cek console.");
    }
});
