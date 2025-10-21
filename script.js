/* Dashboard script — fetch data from Google Apps Script WebApp (doGet) */

/* ========== CONFIG ========== */
const API_URL = 'PASTE_WEBAPP_URL_HERE'; // <-- GANTI INI dengan Web App URL
const SHEETS = {
  curhat: 'curhat',
  pembinaan: 'pembinaan',
  komunikasi: 'komunikasi',
  students: 'students'
};

/* ========== UTIL ========== */
function waSafe(nowa){
  if(!nowa) return '';
  let s = String(nowa).trim().replace(/[^0-9+]/g,'');
  if(s.startsWith('0')) s = '62' + s.slice(1);
  if(s.startsWith('+')) s = s.slice(1);
  return s;
}

async function fetchSheet(sheet){
  const url = `${API_URL}?sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Gagal memuat sheet ' + sheet);
  const data = await res.json(); // 2D array (first row header)
  return data;
}

function csvDownload(filename, rows){
  const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

/* ========== UI SELECTORS ========== */
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.navbtn');
const pageTitle = document.getElementById('pageTitle');
const btnRefresh = document.getElementById('btnRefresh');

/* tables */
const tblCurhat = document.querySelector('#tblCurhat tbody');
const tblPem = document.querySelector('#tblPem tbody');
const tblKom = document.querySelector('#tblKom tbody');
const tblRekap = document.querySelector('#tblRekap tbody');

/* search / filters */
const searchCurhat = document.getElementById('searchCurhat');
const filterPemStatus = document.getElementById('filterPemStatus');
const filterKomMetode = document.getElementById('filterKomMetode');

/* counters / charts */
const countCurhat = document.getElementById('countCurhat');
const countPem = document.getElementById('countPem');
const countKom = document.getElementById('countKom');

let CHARTS = { curhat: null, pem: null, kom: null };

/* ========== NAVIGATION ========== */
navBtns.forEach(btn => {
  btn.addEventListener('click', ()=> {
    navBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const p = btn.dataset.page;
    pages.forEach(pg=>pg.classList.remove('active'));
    document.getElementById('page-' + p).classList.add('active');
    pageTitle.textContent = btn.textContent.trim();
    // load page data on demand
    if(p === 'curhat') loadCurhat();
    if(p === 'pembinaan') loadPembinaan();
    if(p === 'komunikasi') loadKomunikasi();
    if(p === 'rekap') loadRekap();
  });
});

/* topbar refresh */
btnRefresh.addEventListener('click', ()=> {
  const active = document.querySelector('.navbtn.active').dataset.page;
  if(active === 'home') loadHome();
  if(active === 'curhat') loadCurhat(true);
  if(active === 'pembinaan') loadPembinaan(true);
  if(active === 'komunikasi') loadKomunikasi(true);
  if(active === 'rekap') loadRekap(true);
});

/* export buttons */
document.getElementById('exportCurhat').addEventListener('click', ()=> exportCurhat());
document.getElementById('exportPem').addEventListener('click', ()=> exportPem());
document.getElementById('exportKom').addEventListener('click', ()=> exportKom());

/* search / filters events */
searchCurhat?.addEventListener('input', ()=> renderCurhatTable(lastCurhatData, searchCurhat.value));
filterPemStatus?.addEventListener('change', ()=> renderPemTable(lastPemData, filterPemStatus.value));
filterKomMetode?.addEventListener('change', ()=> renderKomTable(lastKomData, filterKomMetode.value));

/* ========== STATE ========== */
let lastCurhatData = [];
let lastPemData = [];
let lastKomData = [];
let studentsData = [];

/* ========== HOME (charts & summary) ========== */
async function loadHome(){
  try {
    const [curhat, pem, kom, students] = await Promise.all([
      fetchSheet(SHEETS.curhat),
      fetchSheet(SHEETS.pembinaan),
      fetchSheet(SHEETS.komunikasi),
      fetchSheet(SHEETS.students)
    ]);
    studentsData = students && students.length > 1 ? students.slice(1) : [];

    lastCurhatData = curhat || [];
    lastPemData = pem || [];
    lastKomData = kom || [];

    // counts
    const nCur = Math.max(0, (curhat.length || 1) - 1);
    const nPem = Math.max(0, (pem.length || 1) - 1);
    const nKom = Math.max(0, (kom.length || 1) - 1);
    countCurhat.textContent = nCur;
    countPem.textContent = nPem;
    countKom.textContent = nKom;

    // build simple charts (counts by nama top 8)
    buildChart('chartCurhat', curhat, 1, 'Jumlah Curhat', CHARTS.curhat);
    buildChart('chartPem', pem, 1, 'Jumlah Pembinaan', CHARTS.pem);
    buildChart('chartKom', kom, 1, 'Jumlah Komunikasi', CHARTS.kom);

    // summary boxes per top students (curhat count)
    renderSummaryBoxes(curhat, pem, kom);

  } catch(err) {
    console.error(err);
    alert('Gagal memuat data (cek API_URL dan deploy Apps Script)');
  }
}

function buildChart(domId, data2D, colIndexForLabel = 1, title = '', chartRef){
  // data2D: first row header
  const rows = (data2D || []).slice(1); // skip header
  const counts = {};
  rows.forEach(r => {
    const name = (r[colIndexForLabel] || 'Unknown').toString();
    counts[name] = (counts[name] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a,b)=> b[1]-a[1]).slice(0,8);
  const labels = sorted.map(s=>s[0]);
  const values = sorted.map(s=>s[1]);

  const ctx = document.getElementById(domId).getContext('2d');
  if(chartRef && chartRef instanceof Chart) chartRef.destroy();
  const c = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: title, data: values, backgroundColor: 'rgba(11,79,166,0.8)' }] },
    options: { responsive:true, plugins:{legend:{display:false}} }
  });
  if(domId === 'chartCurhat') CHARTS.curhat = c;
  if(domId === 'chartPem') CHARTS.pem = c;
  if(domId === 'chartKom') CHARTS.kom = c;
}

function renderSummaryBoxes(curhat, pem, kom){
  const wrap = document.getElementById('summaryBoxes');
  wrap.innerHTML = '';
  // compute per student totals
  const names = {};
  (curhat||[]).slice(1).forEach(r => { const name=r[1]||''; names[name]=names[name]||{c:0,p:0,k:0}; names[name].c++;});
  (pem||[]).slice(1).forEach(r => { const name=r[1]||''; names[name]=names[name]||{c:0,p:0,k:0}; names[name].p++;});
  (kom||[]).slice(1).forEach(r => { const name=r[1]||''; names[name]=names[name]||{c:0,p:0,k:0}; names[name].k++;});

  // sort by total interactions
  const arr = Object.entries(names).map(([name,obj])=> ({ name, total: obj.c+obj.p+obj.k, obj })).sort((a,b)=>b.total-a.total).slice(0,6);

  arr.forEach(item=>{
    const div = document.createElement('div');
    div.className = 'col-md-4 col-lg-2';
    div.innerHTML = `<div class="glass-card p-2 text-center"><div style="font-weight:700">${item.name}</div>
      <div class="small-muted">Total Interaksi: <strong>${item.total}</strong></div>
      <div class="small-muted">Curhat: ${item.obj.c} • Pembinaan: ${item.obj.p} • Kom: ${item.obj.k}</div></div>`;
    wrap.appendChild(div);
  });
}

/* ========== CURHAT PAGE ========== */
async function loadCurhat(force=false){
  if(!force && lastCurhatData.length>1){ renderCurhatTable(lastCurhatData, searchCurhat.value); return; }
  try{
    const data = await fetchSheet(SHEETS.curhat);
    lastCurhatData = data || [];
    renderCurhatTable(lastCurhatData, searchCurhat.value);
  }catch(err){ console.error(err); alert('Gagal memuat curhat'); }
}

function renderCurhatTable(data2D, q=''){
  tblCurhat.innerHTML = '';
  const rows = (data2D||[]).slice(1).reverse(); // latest first
  const ql = String(q||'').toLowerCase();
  rows.forEach(r => {
    const ts = r[0] || ''; const nama = r[1] || ''; const isi = r[2] || '';
    if(ql && !(nama.toLowerCase().includes(ql) || (isi+'').toLowerCase().includes(ql))) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${ts}</td><td>${nama}</td><td>${escapeHtml(isi)}</td>`;
    tblCurhat.appendChild(tr);
  });
}

/* ========== PEMBINAAN PAGE ========== */
async function loadPembinaan(force=false){
  if(!force && lastPemData.length>1){ renderPemTable(lastPemData, filterPemStatus.value); return; }
  try{
    const data = await fetchSheet(SHEETS.pembinaan);
    lastPemData = data || [];
    renderPemTable(lastPemData, filterPemStatus.value);
  }catch(err){ console.error(err); alert('Gagal memuat pembinaan'); }
}

function renderPemTable(data2D, statusFilter='ALL'){
  tblPem.innerHTML = '';
  const rows = (data2D||[]).slice(1).reverse();
  rows.forEach(r => {
    const ts = r[0]||''; const nama=r[1]||''; const jenis=r[2]||''; const tindakan=r[3]||''; const target=r[4]||''; const cat=r[5]||''; const status=r[6]||'';
    if(statusFilter !== 'ALL' && (status||'').toLowerCase() !== statusFilter.toLowerCase()) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${ts}</td><td>${nama}</td><td>${jenis}</td><td>${escapeHtml(tindakan)}</td><td>${escapeHtml(target)}</td><td>${escapeHtml(cat)}</td><td>${status}</td>`;
    tblPem.appendChild(tr);
  });
}

/* ========== KOMUNIKASI PAGE ========== */
async function loadKomunikasi(force=false){
  if(!force && lastKomData.length>1){ renderKomTable(lastKomData, filterKomMetode.value); return; }
  try{
    const data = await fetchSheet(SHEETS.komunikasi);
    lastKomData = data || [];
    renderKomTable(lastKomData, filterKomMetode.value);
  }catch(err){ console.error(err); alert('Gagal memuat komunikasi'); }
}

function renderKomTable(data2D, metodeFilter='ALL'){
  tblKom.innerHTML = '';
  const rows = (data2D||[]).slice(1).reverse();
  rows.forEach(r => {
    const ts=r[0]||''; const nama=r[1]||''; const pesan=r[2]||''; const metode=r[3]||''; const dari=r[4]||'';
    if(metodeFilter !== 'ALL' && ((metode||'').toLowerCase() !== metodeFilter.toLowerCase())) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${ts}</td><td>${nama}</td><td>${escapeHtml(pesan)}</td><td>${metode}</td><td>${dari}</td>`;
    tblKom.appendChild(tr);
  });
}

/* ========== REKAP per siswa ========== */
async function loadRekap(force=false){
  try{
    // ensure other data loaded
    if(lastCurhatData.length<=1) lastCurhatData = (await fetchSheet(SHEETS.curhat)) || [];
    if(lastPemData.length<=1) lastPemData = (await fetchSheet(SHEETS.pembinaan)) || [];
    if(lastKomData.length<=1) lastKomData = (await fetchSheet(SHEETS.komunikasi)) || [];
    const students = (await fetchSheet(SHEETS.students)) || [];
    const rows = (students||[]).slice(1);
    // compute totals per student
    const map = {};
    rows.forEach(r => { const name=r[0]||''; map[name]=map[name]||{c:0,p:0,k:0}; });
    (lastCurhatData||[]).slice(1).forEach(r => { const name=r[1]||''; if(!map[name]) map[name]={c:0,p:0,k:0}; map[name].c++; });
    (lastPemData||[]).slice(1).forEach(r => { const name=r[1]||''; if(!map[name]) map[name]={c:0,p:0,k:0}; map[name].p++; });
    (lastKomData||[]).slice(1).forEach(r => { const name=r[1]||''; if(!map[name]) map[name]={c:0,p:0,k:0}; map[name].k++; });
    // render table
    tblRekap.innerHTML = '';
    Object.keys(map).sort().forEach(name => {
      const item = map[name];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${name}</td><td>${item.c}</td><td>${item.p}</td><td>${item.k}</td>`;
      tblRekap.appendChild(tr);
    });
  }catch(err){ console.error(err); alert('Gagal memuat rekap'); }
}

/* ========== EXPORT FUNCTIONS ========== */
function exportCurhat(){
  const rows = [['timestamp','nama','isi_curhat']];
  (lastCurhatData||[]).slice(1).forEach(r => rows.push([r[0], r[1], r[2]]));
  csvDownload('curhat_vii_h.csv', rows);
}
function exportPem(){
  const rows = [['timestamp','nama','jenis_pelanggaran','tindakan','target','catatan','status']];
  (lastPemData||[]).slice(1).forEach(r => rows.push([r[0], r[1], r[2], r[3], r[4], r[5], r[6]]));
  csvDownload('pembinaan_vii_h.csv', rows);
}
function exportKom(){
  const rows = [['timestamp','nama','pesan','metode','dari']];
  (lastKomData||[]).slice(1).forEach(r => rows.push([r[0], r[1], r[2], r[3], r[4]]));
  csvDownload('komunikasi_vii_h.csv', rows);
}

/* ========== INITIAL LOAD ========== */
document.addEventListener('DOMContentLoaded', ()=> {
  // load home by default
  loadHome();

  // also load curhat/pem/kom in background but lazily when pages opened
  // attach nav hotkeys (1..5)
  document.addEventListener('keydown', (e)=> {
    if(e.key === '1') document.querySelector('[data-page="home"]').click();
    if(e.key === '2') document.querySelector('[data-page="curhat"]').click();
    if(e.key === '3') document.querySelector('[data-page="pembinaan"]').click();
    if(e.key === '4') document.querySelector('[data-page="komunikasi"]').click();
    if(e.key === '5') document.querySelector('[data-page="rekap"]').click();
  });
});

/* ========== HELPERS ========== */
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
