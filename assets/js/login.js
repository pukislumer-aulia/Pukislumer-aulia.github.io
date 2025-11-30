(async function(){
  const FORM = document.getElementById("loginForm");
  const ERR = document.getElementById("loginError");

  // Kredensial admin
  const ADMIN_USER = "pukislumer";
  const ADMIN_PASS_HASH = "fb24e79e927651c01fb9b31c7648206dfa81857232ece2b2043614d00f90e1a5";

  async function sha256(text){
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2,"0"))
      .join("");
  }

  FORM.addEventListener("submit", async (e)=>{
    e.preventDefault();
    ERR.style.display = "none";

    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const passHash = await sha256(pass);

    if(user === ADMIN_USER && passHash === ADMIN_PASS_HASH){
      sessionStorage.setItem("adminLogin","active");
      window.location.href = "admin.html";
    } else {
      ERR.style.display = "block";
    }
  });

})();
