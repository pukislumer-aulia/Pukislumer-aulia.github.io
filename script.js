function toggleToppingAtas() {
  var tipeTopping = document.getElementById('tipeTopping').value;
  var toppingAtasSection = document.getElementById('toppingAtasSection');
  if (tipeTopping === 'Double') {
    toppingAtasSection.style.display = 'block';
  } else {
    toppingAtasSection.style.display = 'none';
  }
}

document.getElementById('orderForm').addEventListener('submit', function(event) {
  event.preventDefault();
  alert('Terima kasih sudah memesan! Pesanan Anda akan segera kami proses.');
  this.reset();
  document.getElementById('toppingAtasSection').style.display = 'none';
});

// Testimoni Form
document.getElementById('testimonialForm').addEventListener('submit', function(event) {
  event.preventDefault();
  var name = document.getElementById('nameInput').value.trim();
  var testimonial = document.getElementById('testimonialInput').value.trim();
  
  if (name && testimonial) {
    var testimonialItem = document.createElement('div');
    testimonialItem.className = 'testimonial';
    testimonialItem.innerHTML = '<strong>' + name + '</strong><p>' + testimonial + '</p>';
    document.getElementById('testimonialsList').appendChild(testimonialItem);
    document.getElementById('testimonialForm').reset();
  } else {
    alert('Mohon isi semua kolom testimoni.');
  }
});
