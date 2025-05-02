const toppingArea = document.getElementById("toppingArea");
const form = document.getElementById("orderForm");
const qtyInput = document.getElementById("qty");
const boxSizeSelect = document.getElementById("boxSize");
const totalDisplay = document.getElementById("totalDisplay");

// Data topping
const toppingSingle = ["Coklat", "Tiramisu", "Stroberi", "Cappucino", "Vanilla", "Taro", "Matcha"];
const toppingDouble = ["Meses", "Keju", "Kacang", "Choco Chip", "Oreo"];

// Harga dasar
const hargaBox = {
  5: 10000,
  10: 18000
};

// Hitung total
function updateTotal() {
  const box = parseInt(boxSizeSelect.value);
  const qty = parseInt(qtyInput.value) || 0;
  const total = hargaBox[box] * qty;
  totalDisplay.innerHTML = `<strong>Total Harga:</strong> Rp ${total.toLocaleString("id-ID")}`;
}

qtyInput.addEventListener("input", updateTotal);
boxSizeSelect.addEventListener("change", updateTotal);

// Tipe topping handler
document.querySelectorAll('input[name="toppingType"]').forEach(input => {
  input.addEventListener("change", () => {
    const type = input.value;
    toppingArea.innerHTML = "";

    if (type === "none") {
      toppingArea.style.display = "none";
    } else {
      toppingArea.style.display = "flex";

      if (type === "single") {
        toppingSingle.forEach(t => {
          const label = document.createElement("label");
          label.innerHTML = `<input type="checkbox" name="toppingSingle" value="${t}"/> ${t}`;
          toppingArea.appendChild(label);
        });
      }

      if (type === "double") {
        const singleDiv = document.createElement("div");
        const doubleDiv = document.createElement("div");

        singleDiv.innerHTML = "<strong>Base Topping:</strong><br/>";
        toppingSingle.forEach(t => {
          const label = document.createElement("label");
          label.innerHTML = `<input type="checkbox" name="toppingSingle" value="${t}"/> ${t}`;
          singleDiv.appendChild(label);
        });

        doubleDiv.innerHTML = "<br/><strong>Taburan Atas:</strong><br/>";
        toppingDouble.forEach(t => {
          const label = document.createElement("label");
          label.innerHTML = `<input type="checkbox" name="toppingDouble" value="${t}"/> ${t}`;
          doubleDiv.appendChild(label);
        });

        toppingArea.appendChild(singleDiv);
        toppingArea.appendChild(doubleDiv);
      }
    }
  });
});

// Kirim ke WhatsApp
form.addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const menu = document.getElementById("menu").value;
  const box = boxSizeSelect.value;
  const qty = qtyInput.value;
  const toppingType = document.querySelector('input[name="toppingType"]:checked')?.value || "none";

  let toppings = "";
  if (toppingType === "single") {
    const selected = [...document.querySelectorAll('input[name="toppingSingle"]:checked')].map(i => i.value);
    toppings = selected.join(", ");
  } else if (toppingType === "double") {
    const base = [...document.querySelectorAll('input[name="toppingSingle"]:checked')].map(i => i.value);
    const atas = [...document.querySelectorAll('input[name="toppingDouble"]:checked')].map(i => i.value);
    toppings = `Base: ${base.join(", ")} | Taburan: ${atas.join(", ")}`;
  } else {
    toppings = "Tanpa Topping";
  }

  const total = hargaBox[box] * parseInt(qty);
  const pesan = `Halo! Saya ingin pesan Pukis:\n\nNama: ${name}\nJenis: ${menu}\nTopping: ${toppings}\nUkuran: ${box} pcs\nJumlah: ${qty} box\nTotal: Rp ${total.toLocaleString("id-ID")}`;

  const url = `https://wa.me/6281296668670?text=${encodeURIComponent(pesan)}`;
  window.open(url, "_blank");
});

// Undang Teman
function shareSite() {
  const text = "Yuk coba Pukis Lumer Aulia! Pesan di sini:";
  const url = window.location.href;
  navigator.share ? navigator.share({ title: "Pukis Lumer Aulia", text, url }) : alert("Fitur ini tidak didukung di perangkat Anda.");
}
