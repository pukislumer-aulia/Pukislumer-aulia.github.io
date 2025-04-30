// Simpan menu ke localStorage
var menuForm = document.getElementById('menuForm');
menuForm.addEventListener('submit', function (e) {
  e.preventDefault();
  var name = document.getElementById('menuName').value;
  if (!name) return;
  var menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
  menuItems.push(name);
  localStorage.setItem('menuItems', JSON.stringify(menuItems));
  document.getElementById('menuName').value = '';
  renderMenuList();
  renderMenuOptions();
});

function renderMenuList() {
  var menuList = document.getElementById('menuList');
  menuList.innerHTML = '';
  var menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
  menuItems.forEach(function (item) {
    var li = document.createElement('li');
    li.textContent = item;
    menuList.appendChild(li);
  });
}

function renderMenuOptions() {
  var dataList = document.getElementById('menuOptions');
  dataList.innerHTML = '';
  var menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
  menuItems.forEach(function (item) {
    var opt = document.createElement('option');
    opt.value = item;
    dataList.appendChild(opt);
  });
}

// Simpan pesanan ke localStorage
var orderFormAdmin = document.getElementById('orderFormAdmin');
orderFormAdmin.addEventListener('submit', function (e) {
  e.preventDefault();
  var name = document.getElementById('orderNameAdmin').value;
  var menu = document.getElementById('menuChoice').value;
  var topping = document.getElementById('adminToppingType').value;
  var toppingAtas = document.getElementById('adminToppingAtas').value;
  if (!name || !menu || !topping) return;
  if (topping === 'single') {
    toppingAtas = '';
  }
  var orders = JSON.parse(localStorage.getItem('orders')) || [];
  orders.push({
    name: name,
    menu: menu,
    topping: topping,
    toppingAtas: toppingAtas,
  });
  localStorage.setItem('orders', JSON.stringify(orders));
  orderFormAdmin.reset();
  renderOrders();
  checkToppingVisibility(); // agar tetap sesuai saat reset
});

function renderOrders() {
  var ordersBody = document.getElementById('ordersBody');
  ordersBody.innerHTML = '';
  var orders = JSON.parse(localStorage.getItem('orders')) || [];
  orders.forEach(function (o) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' +
      o.name +
      '</td><td>' +
      o.menu +
      '</td><td>' +
      o.topping +
      '</td><td>' +
      o.toppingAtas +
      '</td>';
    ordersBody.appendChild(tr);
  });
}

// Logika topping tampil/sembunyi
document
  .getElementById('adminToppingType')
  .addEventListener('change', checkToppingVisibility);

function checkToppingVisibility() {
  var select = document.getElementById('adminToppingType');
  var atasContainer = document.getElementById('adminToppingAtasContainer');
  atasContainer.style.display = select.value === 'single' ? 'none' : 'block';
}

// Load saat halaman dimuat
window.addEventListener('DOMContentLoaded', function () {
  renderMenuList();
  renderMenuOptions();
  renderOrders();
  checkToppingVisibility();
});
