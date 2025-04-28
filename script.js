function toggleMenu() {
  const menu = document.getElementById('menuButtons');
  if (menu.style.display === 'flex') {
    menu.style.display = 'none';
  } else {
    menu.style.display = 'flex';
  }
}

function inviteFriend() {
  if (navigator.share) {
    navigator.share({
      title: 'Pukis Lumer Aulia',
      text: 'Ayo cek Pukis Lumer Aulia! Lezat dan nikmat!',
      url: window.location.href
    }).catch(console.error);
  } else {
    alert('Fitur berbagi tidak tersedia di perangkat ini.');
  }
}
