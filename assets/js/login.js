/* =====================================================
   LOGIN.JS — FINAL STABIL TANPA KEDIP / REDIRECT LOOP
   - Tidak auto-redirect ke admin.html
   - Hanya redirect jika PIN benar
   - Menggunakan localStorage adminLoggedIn
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("Login page loaded without auto-redirect.");

    // Ambil elemen form & input PIN
    const form = document.getElementById("loginForm");
    const pinInput = document.getElementById("adminPin");

    if (!form || !pinInput) {
        console.error("Elemen loginForm atau adminPin tidak ditemukan dalam login.html");
        return;
    }

    // *** PERHATIKAN ***
    // Tidak ada kode auto-redirect di sini!
    // Tidak ada:
    // if (localStorage.getItem("adminLoggedIn") === "true") { ... }

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const pin = pinInput.value.trim();

        if (pin === "") {
            alert("Masukkan PIN admin.");
            pinInput.focus();
            return;
        }

        // PIN ADMIN — silakan ubah sesuai kebutuhan
        const ADMIN_PIN = "12345";

        if (pin === ADMIN_PIN) {

            // Simpan status login
            localStorage.setItem("adminLoggedIn", "true");

            // Arahkan ke halaman admin
            window.location.href = "admin.html";
        
        } else {
            alert("PIN salah. Silakan coba lagi.");
            pinInput.value = "";
            pinInput.focus();
        }
    });

});
