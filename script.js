function toggleMenu() {
  const menu = document.getElementById('menuButtons');
  if (menu.style.display === "flex") {
    menu.style.display = "none";
  } else {
    menu.style.display = "flex";
  }
}

function inviteFriend() {
  if (navigator.share) {
    navigator.share({
      title: 'Ayo Coba Pukis Lumer Aulia!',
      text: 'Rasakan lelehan manis di setiap gigitan!',
      url: window.location.href
    });
  } else {
    alert('Fitur berbagi tidak didukung di browser ini.');
  }
}
