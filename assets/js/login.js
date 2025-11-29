/* ================================
   LOGIN ADMIN — Pukis Lumer Aulia
   ================================ */

const CORRECT_PIN = "2369"; // PIN ADMIN (boleh diganti)

/* ===========================================
   CEK STATUS — jika sudah login → masuk admin
   =========================================== */
if (localStorage.getItem("adminLoggedIn") === "true") {
  window.location.href = "admin.html";
}

/* ===================
   EVENT LOGIN BUTTON
   =================== */
document.getElementById("loginBtn")?.addEventListener("click", () => {
  const pin = document.getElementById("adminPin").value.trim();

  if (pin === "") {
    alert("PIN tidak boleh kosong");
    return;
  }

  if (pin !== CORRECT_PIN) {
    alert("PIN salah! Coba lagi.");
    return;
  }

  // Simpan status login
  localStorage.setItem("adminLoggedIn", "true");

  // Masuk ke halaman admin
  window.location.href = "admin.html";
});
