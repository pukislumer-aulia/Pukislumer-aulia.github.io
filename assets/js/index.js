// Toggle floating buttons
document.getElementById('toggleFloat').addEventListener('click', function() {
    var items = document.querySelectorAll('.float-button');
    items.forEach(function(btn) {
        if (btn.style.display === 'block') {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'block';
        }
    });
});

// Logika topping pada form pemesanan
document.getElementById('toppingType').addEventListener('change', function() {
    var atas = document.getElementById('toppingAtas');
    if (this.value === 'single') {
        atas.style.display = 'none';
    } else {
        atas.style.display = 'block';
    }
});
// Atur tampilan topping berdasarkan default saat load halaman
window.addEventListener('DOMContentLoaded', function() {
    var toppingSelect = document.getElementById('toppingType');
    var atas = document.getElementById('toppingAtas');
    if (toppingSelect.value === 'single') {
        atas.style.display = 'none';
    }
});

// Testimoni: simpan dan tampilkan dari localStorage
var testimonialForm = document.getElementById('testimonialForm');
testimonialForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var name = document.getElementById('testName').value;
    var message = document.getElementById('testMessage').value;
    if (!name || !message) return;
    var existing = JSON.parse(localStorage.getItem('testimonials')) || [];
    existing.push({name: name, message: message});
    localStorage.setItem('testimonials', JSON.stringify(existing));
    document.getElementById('testName').value = '';
    document.getElementById('testMessage').value = '';
    renderTestimonials();
});

function renderTestimonials() {
    var list = document.getElementById('testimonials-list');
    list.innerHTML = '';
    var testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
    testimonials.forEach(function(t) {
        var div = document.createElement('div');
        div.classList.add('testimonial-item');
        div.innerHTML = '<h3>' + t.name + '</h3><p>' + t.message + '</p>';
        list.appendChild(div);
    });
}

// Tampilkan testimoni saat halaman dimuat
window.addEventListener('DOMContentLoaded', renderTestimonials);
