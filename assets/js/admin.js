// Manajemen menu (simpan ke localStorage)
var menuForm = document.getElementById('menuForm');
menuForm.addEventListener('submit', function(e) {
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
    menuItems.forEach(function(item) {
        var li = document.createElement('li');
        li.textContent = item;
        menuList.appendChild(li);
    });
}

function renderMenuOptions() {
    var dataList = document.getElementById('menuOptions');
    dataList.innerHTML = '';
    var menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
    menuItems.forEach(function(item) {
        var opt = document.createElement('option');
        opt.value = item;
        dataList.appendChild(opt);
    });
}

// Manajemen pesanan (simpan ke localStorage)
var orderFormAdmin = document.getElementById('orderFormAdmin');
orderFormAdmin.addEventListener('submit', function(e) {
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
    orders.push({name: name, menu: menu, topping: topping, toppingAtas: toppingAtas});
    localStorage.setItem('orders', JSON.stringify(orders));
    orderFormAdmin.reset();
    renderOrders();
});

function renderOrders() {
    var ordersBody = document.getElementById('ordersBody');
    ordersBody.innerHTML = '';
    var orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.forEach(function(o) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + o.name + '</td><td>' + o.menu + '</td><td>' + o.topping + '</td><td>' + o.toppingAtas + '</td>';
        ordersBody.appendChild(tr);
    });
}

// Logika topping di halaman admin
document.getElementById('adminToppingType').addEventListener('change', function() {
    var atas = document.getElementById('adminToppingAtas');
    if (this.value === 'single') {
        atas.style.display = 'none';
    } else {
        atas.style.display = 'block';
    }
});

window.addEventListener('DOMContentLoaded', function() {
    var select = document.getElementById('adminToppingType');
    var atasDiv = document.getElementById('adminToppingAtas');
    if (select.value === 'single') {
        atasDiv.style.display = 'none';
    }
    renderMenuList();
    renderMenuOptions();
    renderOrders();
});
