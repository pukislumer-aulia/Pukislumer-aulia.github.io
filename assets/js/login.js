(function() {
    'use strict';

    const VALID_USER = "pukislumer";
    const VALID_PASS = "Aulia1234"; // <-- password offline langsung

    const $ = s => document.querySelector(s);

    const form = document.getElementById('loginForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const user = $('#username').value.trim();
        const pass = $('#password').value.trim();

        if (user === VALID_USER && pass === VALID_PASS) {
            sessionStorage.setItem('adminLogged', 'true');
            window.location.href = "admin.html";
            return;
        }

        $('#errorMsg').textContent = "Username atau password salah";
    });
})();
