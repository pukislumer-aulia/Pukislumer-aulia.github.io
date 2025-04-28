function toggleToppingAtas() {
  var tipeTopping = document.getElementById("tipeTopping").value;
  var toppingAtasSection = document.getElementById("toppingAtasSection");
  if (tipeTopping === "Double") {
    toppingAtasSection.style.display = "block";
  } else {
    toppingAtasSection.style.display = "none";
  }
}

document.getElementById('testimonialForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var name = document.getElementById('nameInput').value;
  var testimonial = document.getElementById('testimonialInput').value;
  
  if (name && testimonial) {
    var testimonialList = document.getElementById('testimonialsList');
    var newTestimonial = document.createElement('p');
    newTestimonial.innerHTML = `<strong>${name}</strong>: ${testimonial}`;
    testimonialList.appendChild(newTestimonial);
    
    document.getElementById('nameInput').value = '';
    document.getElementById('testimonialInput').value = '';
  }
});
