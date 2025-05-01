document.addEventListener("DOMContentLoaded", () => {
  const variantSelect = document.getElementById("variant");
  const sizeSelect = document.getElementById("size");
  const jumlahInput = document.getElementById("jumlah");
  const totalHargaText = document.getElementById("totalHarga");
  const form = document.querySelector(".order-form");

  const toppingSingle = document.getElementById("topping-single");
  const toppingDouble = document.getElementById("topping-double");

  const harga = {
    non: {
      small: 10000,
      large: 18000
    },
    single: {
      small: 13000,
      large: 25000
    },
    double: {
      small: 15000,
      large: 28000
    }
  };

  function updateToppingVisibility() {
    const variant = variantSelect.value;
    toppingSingle.style.display = variant === "single" ? "block" : "none";
    toppingDouble.style.display = variant === "double" ? "block" : "none";
  }

  function hitungTotal() {
    const variant = variantSelect.value;
    const size = sizeSelect.value;
    const jumlah = parseInt(jumlahInput.value) || 0;
    const total = harga[variant][size] * jumlah;
    totalHargaText.textContent = `Total Harga: Rp ${total.toLocaleString()}`;
    return total;
  }

  variantSelect.addEventListener("change", () => {
    updateToppingVisibility();
    hitungTotal();
  });

  sizeSelect.addEventListener("change", hitungTotal);
  jumlahInput.addEventListener("input", hitungTotal);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const variant = variantSelect.value;
    const size = sizeSelect.value;
    const jumlah = jumlahInput.value;
    const total = hitungTotal();

    let toppings = "Tanpa Topping";
    if (variant === "single") {
      toppings = [...document.querySelectorAll("input[name='toppingSingle']:checked")]
        .map(el => el.value).join(", ") || "Tanpa Topping";
    } else if (variant === "double") {
      toppings = [...document.querySelectorAll("input[name='toppingDouble']:checked")]
        .map(el => el.value).join(", ") || "Tanpa Topping";
    }

    const pesan = `Assalamu'alaikum, saya mau order:\n\nVarian: ${variant}\nUkuran: ${size}\nJumlah: ${jumlah}\nTopping: ${toppings}\nTotal Harga: Rp ${total.toLocaleString()}`;
    const url = `https://wa.me/6281296668670?text=${encodeURIComponent(pesan)}`;
    window.open(url, '_blank');
  });

  // Inisialisasi saat halaman dimuat
  updateToppingVisibility();
  hitungTotal();
});
