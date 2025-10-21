const API_URL = "https://script.google.com/macros/s/AKfycbydG2BUKgHFc1G-S1u5aKJNW8NgUZ5K6GIv2ZArUhlhYHrwuAIjRB2lhe4mq277ig/exec";

async function sendData(sheet, payload) {
  payload.sheet = sheet;
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// === CURHAT ===
async function simpanCurhat() {
  const nama = document.getElementById("curhatNama").value;
  const isi = document.getElementById("curhatIsi").value;

  await sendData("curhat", { nama, isi });
  alert("Curhat tersimpan");
}

// === PEMBINAAN ===
async function simpanPembinaan() {
  const nama = document.getElementById("pembinaanNama").value;
  const jenis_pelanggaran = document.getElementById("pembinaanJenis").value;
  const tindakan = document.getElementById("pembinaanTindakan").value;
  const target = document.getElementById("pembinaanTarget").value;
  const catatan = document.getElementById("pembinaanCatatan").value;
  const status = document.getElementById("pembinaanStatus").value;

  await sendData("pembinaan", { nama, jenis_pelanggaran, tindakan, target, catatan, status });
  alert("Pembinaan tersimpan");
}

// === KOMUNIKASI ORTU ===
async function simpanKomunikasi() {
  const nama = document.getElementById("komNama").value;
  const pesan = document.getElementById("komPesan").value;
  const metode = document.getElementById("komMetode").value;
  const dari = document.getElementById("komDari").value;

  await sendData("komunikasi", { nama, pesan, metode, dari });
  alert("Komunikasi tersimpan");
}

