document.getElementById('orderForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const order = document.getElementById('order').value;
  alert(`Terima kasih ${name}, pesanan anda "${order}" sudah diterima!`);
});

function share() {
  if (navigator.share) {
    navigator.share({
      title: 'Pukis Lumer Aulia',
      text: 'Coba deh Pukis Lumer Aulia, enak banget!',
      url: window.location.href
    }).then(() => console.log('Berhasil dibagikan'))
      .catch(error => console.log('Error sharing', error));
  } else {
    alert('Maaf, browser kamu belum support fitur bagikan.');
  }
}
