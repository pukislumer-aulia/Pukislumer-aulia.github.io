/* assets/js/login.js */
(async function() {
    'use strict';

    const VALID_USER = "pukislumer";
    // SHA256("Aulia1234")
    const VALID_PASS_HASH = "1afd7064e91e80a2415cd304ada5b3fbb82e25914d216c077236da002ad32e7c";

    const $ = s => document.querySelector(s);

    async function sha256(str) {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = $('#username').value.trim();
        const pass = $('#password').value;

        try {
            const passHash = await sha256(pass);

            if (user === VALID_USER && passHash === VALID_PASS_HASH) {
                sessionStorage.setItem('adminLogged', 'true'); // <-- konsisten
                window.location.href = "admin.html";
                return;
            }

            $('#errorMsg').textContent = "Username atau password salah";
        } catch (error) {
            console.error("Error hashing password:", error);
            $('#errorMsg').textContent = "Terjadi kesalahan saat login.";
        }
    });

})();
