import { 
  firestore, setDocData, getDocData, checkLoginRedirect, logout, defaultData 
} from "./firebase.js";

// Pastikan admin login
await checkLoginRedirect();

const form = document.getElementById("adminForm");

// 🔹 Load data dari Firestore
async function loadData() {
  let data = await getDocData("konten", "utama");
  if (!data) data = defaultData;

  document.getElementById("judulInput").value = data.judul;
  document.getElementById("sapaanInput").value = data.sapaan;
  document.getElementById("doaInput").value = data.doa;
  document.getElementById("lokasiInput").value = data.lokasi;
  document.getElementById("ajakanInput").value = data.ajakan;
  document.getElementById("jamOperasionalInput").value = data.jamOperasional;
  document.getElementById("bestSellerInput").value = data.bestSeller;
  document.getElementById("alamatInput").value = data.alamat;
  document.getElementById("ojolInput").value = data.ojol;
  document.getElementById("alasanInput").value = data.alasan;
  document.getElementById("faktaUnikInput").value = (data.faktaUnik || []).join("\n");
  document.getElementById("promoTextInput").value = data.promoText;
  document.getElementById("promoImageInput").value = data.promoImage;
  document.getElementById("footerInput").value = data.footer;
  document.getElementById("testimoniInput").value = (data.testimoni || []).join("\n");
  document.getElementById("galeriInput").value = (data.galeri || []).join("|");
}

// 🔹 Simpan data ke Firestore
document.getElementById("btnSimpan").addEventListener("click", async () => {
  const newData = {
    judul: document.getElementById("judulInput").value,
    sapaan: document.getElementById("sapaanInput").value,
    doa: document.getElementById("doaInput").value,
    lokasi: document.getElementById("lokasiInput").value,
    ajakan: document.getElementById("ajakanInput").value,
    jamOperasional: document.getElementById("jamOperasionalInput").value,
    bestSeller: document.getElementById("bestSellerInput").value,
    alamat: document.getElementById("alamatInput").value,
    ojol: document.getElementById("ojolInput").value,
    alasan: document.getElementById("alasanInput").value,
    faktaUnik: document.getElementById("faktaUnikInput").value.split("\n").filter(l => l.trim() !== ""),
    promoText: document.getElementById("promoTextInput").value,
    promoImage: document.getElementById("promoImageInput").value,
    footer: document.getElementById("footerInput").value,
    testimoni: document.getElementById("testimoniInput").value.split("\n").filter(l => l.trim() !== ""),
    galeri: document.getElementById("galeriInput").value.split("|").map(g => g.trim()).filter(g => g !== "")
  };

  await setDocData("konten", "utama", newData);
  alert("✅ Konten berhasil disimpan!");
});

// 🔹 Reset ke default
document.getElementById("btnReset").addEventListener("click", async () => {
  await setDocData("konten", "utama", defaultData);
  await loadData();
  alert("🔄 Konten dikembalikan ke default!");
});

// 🔹 Logout
document.getElementById("btnLogout").addEventListener("click", async () => {
  await logout();
  window.location.href = "login.html";
});

// Load awal
loadData();
