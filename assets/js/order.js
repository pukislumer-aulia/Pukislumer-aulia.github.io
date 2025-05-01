document.addEventListener("DOMContentLoaded", function () {
  const menuSelect = document.getElementById("menu");
  const toppingRadios = document.querySelectorAll('input[name="toppingType"]');
  const singleToppingDiv = document.getElementById("singleToppingDiv");
  const toppingOptionsDiv = document.getElementById("toppingOptions");
  const boxSize = document.getElementById("boxSize");
  const qty = document.getElementById("qty");
  const totalDisplay = document.getElementById("totalDisplay");
  const orderForm = document.getElementById("orderForm");

  const toppingsSingle = [
    { name: "Coklat", color: "brown" },
    { name: "Tiramisu", color: "saddlebrown" },
    { name: "Matcha", color: "green" },
    { name: "Cappucino", color: "peru" },
    { name: "Stroberry", color: "red" },
    { name: "Vanilla", color: "white" },
    { name: "Taro", color: "purple" },
  ];

  const toppingsDouble = [
    { name: "Meses", color: "black" },
    { name: "Keju", color: "yellow" },
    { name: "Kacang", color: "sienna" },
    { name: "Choco Chips", color: "chocolate" },
    { name: "Oreo", color: "gray" },
  ];

  const renderToppings = (type) => {
    toppingOptionsDiv.innerHTML = "";
    let toppingList = [];

    if (type === "single") {
      toppingList = toppingsSingle;
    } else if (type === "double") {
      toppingList = [...toppingsSingle, ...toppingsDouble];
    }

    toppingList.forEach((topping, index) => {
      const id = `topping-${index}`;
      const wrapper = document.createElement("div");
      wrapper.className = "flex items-center space-x-2";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "toppings";
      checkbox.id = id;
      checkbox.value = topping.name;
      checkbox.className = "form-checkbox w-4 h-4";

      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = topping.name;
      label.style.color = topping.color;
      label.className = "font-bold";

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      toppingOptionsDiv.appendChild(wrapper);
    });
  };

  toppingRadios.forEach((radio) =>
    radio.addEventListener("change", function () {
      if (this.value === "none") {
        singleToppingDiv.style.display = "none";
        toppingOptionsDiv.innerHTML = "";
      } else if (this.value === "single") {
        singleToppingDiv.style.display = "block";
        renderToppings("single");
      } else if (this.value === "double") {
        singleToppingDiv.style.display = "block";
        renderToppings("double");
      }
    })
  );

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const menu = menuSelect.value;
    const size = boxSize.value;
    const jumlah = parseInt(qty.value);
    const toppingType = document.querySelector('input[name="toppingType"]:checked').value;

    let selectedToppings = [];
    document.querySelectorAll('input[name="toppings"]:checked').forEach((el) => {
      selectedToppings.push(el.value);
    });

    const maxTopping = size === "kecil" ? 5 : 10;
    if (toppingType !== "none" && selectedToppings.length > maxTopping) {
      alert(`Maksimal ${maxTopping} topping untuk box ${size}`);
      return;
    }

    let harga = 0;
    if (menu === "original") {
      if (toppingType === "none") {
        harga = size === "kecil" ? 10000 : 18000;
      } else if (toppingType === "single") {
        harga = size === "kecil" ? 13000 : 25000;
      } else if (toppingType === "double") {
        harga = size === "kecil" ? 15000 : 28000;
      }
    } else if (menu === "pandan") {
      if (toppingType === "none") {
        harga = size === "kecil" ? 12000 : 22000;
      } else if (toppingType === "single") {
        harga = size === "kecil" ? 15000 : 28000;
      } else if (toppingType === "double") {
        harga = size === "kecil" ? 18000 : 32000;
      }
    }

    const total = harga * jumlah;
    totalDisplay.innerHTML = `<strong>Total Harga:</strong> Rp ${total.toLocaleString("id-ID")}`;

    const pesan = `Halo! Saya ingin pesan:\nNama: ${name}\nMenu: ${menu.toUpperCase()}\nUkuran: ${size}\nJumlah: ${jumlah}\nTopping: ${selectedToppings.join(", ") || "Non Topping"}\nTotal: Rp ${total.toLocaleString("id-ID")}`;
    const encodedMessage = encodeURIComponent(pesan);
    window.open(`https://wa.me/6281296668670?text=${encodedMessage}`, "_blank");
  });
});
