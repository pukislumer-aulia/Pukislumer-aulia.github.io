/* =====================================================
   assets/js/login.js
   LOGIN ADMIN — SHA-256 HASH + sessionStorage
   ===================================================== */

(async function(){
  'use strict';

  const VALID_USER = "pukislumer";
  const VALID_PASS_HASH = "cb969b5cb364a7e06e5e853ee1bc74d2c4aa1bea1261d6ae2bc1d1bff0f90f95";
  // Hash di atas = SHA-256("Aulia1234")

  const $ = s => document.querySelector(s);

  async function sha256(str){
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,'0')).join('');
  }

  $('#loginForm').addEventListener('submit', async (e)=>{
    e.preventDefault();

    const user = $('#username').value.trim();
    const pass = $('#password').value;

    const passHash = await sha256(pass);

    if (user === VALID_USER && passHash === VALID_PASS_HASH) {
      sessionStorage.setItem('adminLogin', 'active');
      window.location.href = "admin.html";
      return;
    }

    $('#errorMsg').textContent = "Username atau password salah";
  });

})();
