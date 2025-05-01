const singleToppingDiv = document.getElementById("singleTopping");
const doubleToppingDiv = document.getElementById("doubleTopping");
const singleRadio = document.getElementById("singleRadio");
const doubleRadio = document.getElementById("doubleRadio");
const boxSize = document.getElementById("boxSize");
const qty = document.getElementById("qty");
const totalDisplay = document.getElementById("totalDisplay");

singleToppingDiv.style.display = "none";
doubleToppingDiv.style.display = "none";

singleRadio.addEventListener("change", () => {
  singleToppingDiv.style.display = "block";
  doubleToppingDiv.style.display = "none";
  document.querySelectorAll('input[name="doubleTopping"]').forEach(cb => cb.checked = false);
  updateTotal();
});

doubleRadio.addEventListener("change", () => {
  doubleToppingDiv.style.display = "block";
  singleToppingDiv.style.display = "none";
  document.getElementById("singleToppingSelect").value = "";
  updateTotal();
});

document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", updateTotal);
  el.addEventListener("change", updateTotal);
});

function updateTotal() {
  const box = boxSize.value;
  const jumlah = parseInt(qty.value) || 0;
  let harga = 0;

  if (singleRadio.checked) {
    if (box === "kecil") harga = 13000;
    else if (box === "besar") harga = 25000;
  } else if (doubleRadio.checked) {
    if (box === "kecil") harga = 15000;
    else if (box === "besar") harga = 28000;
  }

  const total = harga * jumlah;
  totalDisplay.innerHTML = `<strong>Total Harga:</strong> Rp ${total.toLocaleString()}`;
}

document.getElementById("orderForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const nama = document.getElementById("name").value.trim();
  const menu = document.getElementById("menu").value;
  const ukuran = boxSize.value;
  const jumlah = parseInt(qty.value);

  if (!ukuran || jumlah < 1) {
    alert("Pilih ukuran kotak dan jumlahnya.");
    return;
  }

  let toppingText = "";
  let hargaPerBox = 0;

  if (singleRadio.checked) {
    const topping = document.getElementById("singleToppingSelect").value;
    if (!topping) {
      alert("Pilih topping single terlebih dahulu.");
      return;
    }
    toppingText = `Single Topping: ${topping}`;
    hargaPerBox = (ukuran === "kecil") ? 13000 : 25000;
  } else if (doubleRadio.checked) {
    const selected = document.querySelectorAll('input[name="doubleTopping"]:checked');
    if (selected.length !== 2) {
      alert("Pilih tepat 2 topping untuk double.");
      return;
    }
    const toppingArr = Array.from(selected).map(cb => cb.value);
    toppingText = `Double Topping: ${toppingArr.join(" + ")}`;
    hargaPerBox = (ukuran === "kecil") ? 15000 : 28000;
  } else {
    alert("Pilih jenis topping terlebih dahulu.");
    return;
  }

  const ukuranText = (ukuran === "kecil") ? "Kotak Kecil (5 pcs)" : "Kotak Besar (10 pcs)";
  const totalHarga = hargaPerBox * jumlah;

  const pesan = `Halo Pukis Lumer Aulia! Saya ingin memesan:\n\n` +
                `Nama: ${nama}\n` +
                `Menu: ${menu}\n` +
                `Ukuran: ${ukuranText}\n` +
                `Jumlah Kotak: ${jumlah}\n` +
                `${toppingText}\n` +
                `Total Harga: Rp ${totalHarga.toLocaleString()}`;

  const nomorWa = "6281296668670";
  const url = `https://wa.me/${nomorWa}?text=${encodeURIComponent(pesan)}`;
  window.open(url, "_blank");
});
