function toggleToppingAtas() {
  var tipe = document.getElementById('tipeTopping').value;
  var toppingAtas = document.getElementById('toppingAtasSection');
  toppingAtas.style.display = (tipe === 'Single') ? 'none' : 'block';
}

window.onload = function() {
  document.getElementById('loader').style.display = 'none';
  document.querySelector('.page-wrapper').style.display = 'block';
  toggleToppingAtas();
};
