/* =========================
   script.js — GuruWali 7H
   ========================= */

const students = [
  "FATHAN GUSTOMY L VII-H",
  "IBTISAM ARIFA P VII-H",
  "INAYATI AENA P VII-H",
  "IQBAL WICAKSONO L VII-H",
  "IRMA NOVIANA P VII-H",
  "MELIYA EKA NUR AFRIANI P VII-H",
  "MUHAMAD HABIBI L VII-H",
  "MUHAMAD REHAN FARDAN L VII-H",
  "MUHAMMAD AFKARUL ISLAM L VII-H",
  "MUHAMMAD FAIQ IMAMMILLAH L VII-H",
  "MUHAMMAD IZZA KURNIAWAN L VII-H",
  "MUHAMMAD SYAUQI ASYROFAL KHABIBI L VII-H",
  "MUHAMMAD ZIYYA AHLUNNAZA",
  "MUHAMMAD ZULMI FAHKRI L VII-H",
  "MUKHMAD BAYU MAULID L VII-H",
  "MUTIARA SILMI P VII-H",
  "NAFISA IKLIMA AZZAHRA P VII-H",
  "NASY'ATUL MAHYA P VII-H",
  "NAUFAL HISAM PRATAMA L VII-H",
  "NUR WANIFA P VII-H"
];

// localStorage keys
const LS = {
  curhat: 'gw_curhat_v1',
  pembinaan: 'gw_pembinaan_v1',
  komunikasi: 'gw_komunikasi_v1',
  quick: 'gw_quick_v1'
};

let curhats = JSON.parse(localStorage.getItem(LS.curhat) || '[]');
let pembinaans = JSON.parse(localStorage.getItem(LS.pembinaan) || '[]');
let komunikasis = JSON.parse(localStorage.getItem(LS.komunikasi) || '[]');

document.addEventListener('DOMContentLoaded', () => {
  // navigation links (header)
  document.querySelectorAll('[data-link]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = a.dataset.link;
      showSection(target);
      document.querySelectorAll('.menu a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    });
  });

  // hero buttons and cards
  document.querySelectorAll('[data-action="goto"]').forEach(b => {
    b.addEventListener('click', () => showPanelFromBtn(b.dataset.target));
  });
  document.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => showPanelFromBtn(c.dataset.card)));

  // render initial
  renderStudentTable();
  renderCurhats();
  renderPembinaans();
  renderKomunikasi();

  // search
  document.getElementById('search')?.addEventListener('input', (e) => renderStudentTable(e.target.value));

  // export csv
  document.getElementById('export-csv')?.addEventListener('click', exportAllCSV);

  // buttons
  document.getElementById('btn-add-curhat')?.addEventListener('click', openCurhatForm);
  document.getElementById('btn-add-pembinaan')?.addEventListener('click', openPembinaanForm);
  document.getElementById('btn-add-kom')?.addEventListener('click', openKomunikasiForm);

  // modal close
  document.getElementById('modal-close')?.addEventListener('click', closeModal);

  // keyboard shortcut: "/" fokus search
  window.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement?.id !== 'search') {
      e.preventDefault();
      document.getElementById('search')?.focus();
    }
  });
});

/* --------- Navigation & panels --------- */
function showSection(name) {
  // home maps to section-home (hero+dashboard)
  if (name === 'home') {
    Array.from(document.querySelectorAll('#app > section')).forEach(s => s.style.display = '');
    document.getElementById('section-home').scrollIntoView({behavior:'smooth'});
    hideAllPanels();
    return;
  }
  showPanel(name);
}
function showPanelFromBtn(name){
  // convert name to panel id
  const map = { data: 'panel-data', curhat: 'panel-curhat', pembinaan: 'panel-pembinaan', ortu: 'panel-ortu', kontak: 'panel-kontak' };
  showPanel(map[name] || 'panel-data');
}
function hideAllPanels(){
  document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
}
function showPanel(id){
  hideAllPanels();
  // hide dashboard hero only for panels
  document.getElementById('section-home').style.display = (id === 'home' ? '' : 'none');
  const panelId = id.startsWith('panel-') ? id : `panel-${id}`;
  const el = document.getElementById(panelId);
  if(el) el.style.display = 'block';
  window.scrollTo({top:0,behavior:'smooth'});
}

/* --------- Students table --------- */
function renderStudentTable(filter = '') {
  const tbody = document.querySelector('#tbl-siswa tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  const list = students.filter(s => s.toLowerCase().includes(filter.toLowerCase()));
  list.forEach((name, idx) => {
    const jk = (name.includes(' P ')) ? 'P' : (name.includes(' L ') ? 'L' : '-');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${name}</td>
      <td>${jk}</td>
      <td>VII-H</td>
      <td>
        <button class="btn ghost" onclick="openQuick('${encodeURIComponent(name)}')">Quick</button>
        <button class="btn" onclick="openDetail('${encodeURIComponent(name)}')">Detail</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* --------- Quick note modal & detail --------- */
function openQuick(nameEnc){
  const name = decodeURIComponent(nameEnc);
  const quick = JSON.parse(localStorage.getItem(LS.quick) || '{}');
  const value = quick[name] || '';
  showModal(`
    <h3>Quick Note — ${name}</h3>
    <textarea id="quick-text" style="width:100%;min-height:120px;padding:8px;border-radius:8px;border:1px solid #ddd">${escapeHtml(value)}</textarea>
    <div style="text-align:right;margin-top:8px"><button class="btn" onclick="saveQuick('${encodeURIComponent(name)}')">Simpan</button></div>
  `);
}
function saveQuick(nameEnc){
  const name = decodeURIComponent(nameEnc);
  const txt = document.getElementById('quick-text').value;
  const quick = JSON.parse(localStorage.getItem(LS.quick) || '{}');
  quick[name] = txt;
  localStorage.setItem(LS.quick, JSON.stringify(quick));
  closeModal(); toast('Catatan cepat disimpan');
}
function openDetail(nameEnc){
  const name = decodeURIComponent(nameEnc);
  showModal(`<h3>${name}</h3><p class="muted">Kelas: VII-H</p><p class="muted">Gunakan tombol Quick untuk catatan cepat atau kembali ke Data Siswa</p>`);
}

/* --------- Curhat (CRUD minimal) --------- */
function renderCurhats(){
  const ctn = document.getElementById('curhat-list');
  if(!ctn) return;
  if(!curhats.length){ ctn.innerHTML = '<div class="list-empty">Belum ada catatan curhat.</div>'; return; }
  ctn.innerHTML = '';
  curhats.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'card';
    d.style.marginBottom = '10px';
    d.innerHTML = `<strong>${c.nama}</strong> <span class="muted">• ${c.date}</span><p class="muted">${escapeHtml(c.text)}</p>
      <div style="text-align:right;margin-top:6px"><button class="btn ghost" onclick="editCurhat(${i})">Edit</button> <button class="btn" onclick="deleteCurhat(${i})">Hapus</button></div>`;
    ctn.appendChild(d);
  });
}
function openCurhatForm(){
  showModal(`
    <h3>Tulis Curhat</h3>
    <div style="margin-bottom:8px"><select id="curhat-nama">${students.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
    <textarea id="curhat-text" style="width:100%;min-height:120px;padding:8px;border-radius:8px;border:1px solid #ddd"></textarea>
    <div style="text-align:right;margin-top:8px"><button class="btn" id="save-curhat">Simpan</button></div>
  `);
  document.getElementById('save-curhat').addEventListener('click', ()=> {
    const nama = document.getElementById('curhat-nama').value;
    const text = document.getElementById('curhat-text').value.trim();
    if(!text){ alert('Isi teks curhat'); return; }
    curhats.unshift({nama, text, date: new Date().toLocaleString()});
    localStorage.setItem(LS.curhat, JSON.stringify(curhats));
    closeModal(); renderCurhats(); toast('Curhat tersimpan');
  });
}
function editCurhat(i){
  const c = curhats[i];
  showModal(`
    <h3>Edit Curhat</h3>
    <p class="muted">${c.nama} • ${c.date}</p>
    <textarea id="edit-curhat" style="width:100%;min-height:120px;padding:8px;border-radius:8px;border:1px solid #ddd">${escapeHtml(c.text)}</textarea>
    <div style="text-align:right;margin-top:8px"><button class="btn" id="save-edit">Simpan</button></div>
  `);
  document.getElementById('save-edit').addEventListener('click', ()=> {
    curhats[i].text = document.getElementById('edit-curhat').value;
    localStorage.setItem(LS.curhat, JSON.stringify(curhats));
    closeModal(); renderCurhats(); toast('Diubah');
  });
}
function deleteCurhat(i){ if(!confirm('Hapus catatan?')) return; curhats.splice(i,1); localStorage.setItem(LS.curhat, JSON.stringify(curhats)); renderCurhats(); }

/* --------- Pembinaan --------- */
function renderPembinaans(){
  const ctn = document.getElementById('pembinaan-list');
  if(!ctn) return;
  if(!pembinaans.length){ ctn.innerHTML = '<div class="list-empty">Belum ada pembinaan.</div>'; return; }
  ctn.innerHTML = '';
  pembinaans.forEach((p,i) => {
    const d = document.createElement('div'); d.className='card'; d.style.marginBottom='10px';
    d.innerHTML = `<strong>${p.nama}</strong> <span class="muted">• ${p.date}</span><p class="muted">${escapeHtml(p.note)}</p>
      <div style="text-align:right;margin-top:6px"><button class="btn ghost" onclick="editPembinaan(${i})">Edit</button> <button class="btn" onclick="deletePembinaan(${i})">Hapus</button></div>`;
    ctn.appendChild(d);
  });
}
function openPembinaanForm(){
  showModal(`
    <h3>Tambah Pembinaan</h3>
    <div style="margin-bottom:8px"><select id="pem-nama">${students.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
    <textarea id="pem-text" style="width:100%;min-height:120px;padding:8px;border-radius:8px;border:1px solid #ddd" placeholder="Rencana/hasil pembinaan..."></textarea>
    <div style="text-align:right;margin-top:8px"><button class="btn" id="save-pem">Simpan</button></div>
  `);
  document.getElementById('save-pem').addEventListener('click', ()=> {
    const nama = document.getElementById('pem-nama').value;
    const note = document.getElementById('pem-text').value.trim();
    if(!note){ alert('Isi catatan pembinaan'); return; }
    pembinaans.unshift({nama, note, date:new Date().toLocaleString()});
    localStorage.setItem(LS.pembinaan, JSON.stringify(pembinaans));
    closeModal(); renderPembinaans(); toast('Pembinaan tersimpan');
  });
}
function editPembinaan(i){ const p=pembinaans[i]; showModal(`<h3>Edit Pembinaan</h3><p class="muted">${p.nama} • ${p.date}</p><textarea id="edit-pem" style="width:100%;min-height:120px">${escapeHtml(p.note)}</textarea><div style="text-align:right;margin-top:8px"><button class="btn" id="save-pem-edit">Simpan</button></div>`); document.getElementById('save-pem-edit').addEventListener('click', ()=>{ pembinaans[i].note=document.getElementById('edit-pem').value; localStorage.setItem(LS.pembinaan, JSON.stringify(pembinaans)); closeModal(); renderPembinaans(); toast('Diubah'); }) }
function deletePembinaan(i){ if(!confirm('Hapus pembinaan?')) return; pembinaans.splice(i,1); localStorage.setItem(LS.pembinaan, JSON.stringify(pembinaans)); renderPembinaans(); }

/* --------- Komunikasi Orang Tua --------- */
function renderKomunikasi(){
  const ctn = document.getElementById('kom-list');
  if(!ctn) return;
  if(!komunikasis.length){ ctn.innerHTML = '<div class="list-empty">Belum ada pesan komunikasi.</div>'; return; }
  ctn.innerHTML = '';
  komunikasis.forEach((k,i) => {
    const d = document.createElement('div'); d.className='card'; d.style.marginBottom='10px';
    d.innerHTML = `<strong>${k.nama}</strong> <span class="muted">• ${k.date}</span><p class="muted">${escapeHtml(k.msg)}</p>
      <div style="text-align:right;margin-top:6px"><button class="btn ghost" onclick="editKom(${i})">Edit</button> <button class="btn" onclick="deleteKom(${i})">Hapus</button></div>`;
    ctn.appendChild(d);
  });
}
function openKomunikasiForm(){
  showModal(`<h3>Buat Pesan untuk Orang Tua</h3><div style="margin-bottom:8px"><select id="kom-nama">${students.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div><textarea id="kom-text" style="width:100%;min-height:120px" placeholder="Pesan..."></textarea><div style="text-align:right;margin-top:8px"><button class="btn" id="save-kom">Simpan</button></div>`);
  document.getElementById('save-kom').addEventListener('click', ()=> {
    const nama = document.getElementById('kom-nama').value;
    const msg = document.getElementById('kom-text').value.trim();
    if(!msg){ alert('Isi pesan'); return; }
    komunikasis.unshift({nama, msg, date:new Date().toLocaleString()});
    localStorage.setItem(LS.komunikasi, JSON.stringify(komunikasis));
    closeModal(); renderKomunikasi(); toast('Pesan tersimpan');
  });
}
function editKom(i){ const k=komunikasis[i]; showModal(`<h3>Edit Pesan</h3><p class="muted">${k.nama} • ${k.date}</p><textarea id="edit-kom" style="width:100%;min-height:120px">${escapeHtml(k.msg)}</textarea><div style="text-align:right;margin-top:8px"><button class="btn" id="save-kom-edit">Simpan</button></div>`); document.getElementById('save-kom-edit').addEventListener('click', ()=>{ komunikasis[i].msg=document.getElementById('edit-kom').value; localStorage.setItem(LS.komunikasi, JSON.stringify(komunikasis)); closeModal(); renderKomunikasi(); toast('Diubah'); }) }
function deleteKom(i){ if(!confirm('Hapus pesan?')) return; komunikasis.splice(i,1); localStorage.setItem(LS.komunikasi, JSON.stringify(komunikasis)); renderKomunikasi(); }

/* --------- Export CSV (all notes) --------- */
function exportAllCSV(){
  const rows = [];
  rows.push(['Tipe','Nama','Tanggal','Isi']);
  curhats.forEach(c => rows.push(['Curhat', c.nama, c.date, c.text]));
  pembinaans.forEach(p => rows.push(['Pembinaan', p.nama, p.date, p.note]));
  komunikasis.forEach(k => rows.push(['Komunikasi', k.nama, k.date, k.msg]));
  const quick = JSON.parse(localStorage.getItem(LS.quick) || '{}');
  for(const k in quick) rows.push(['QuickNote', k, '', quick[k]]);
  const csv = rows.map(r => r.map(cell => `"${String(cell||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='laporan_guruwali_7H.csv'; a.click(); URL.revokeObjectURL(url);
  toast('Export CSV dimulai');
}

/* --------- Modal & UI helpers --------- */
function showModal(html){
  const modal = document.getElementById('modal');
  document.getElementById('modal-body').innerHTML = html;
  modal.style.display = 'grid';
  // attach close button (if not present)
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
}
function closeModal(){ document.getElementById('modal').style.display='none'; document.getElementById('modal-body').innerHTML=''; }

function toast(msg){
  const d = document.createElement('div'); d.textContent = msg;
  Object.assign(d.style,{position:'fixed',right:'18px',bottom:'18px',padding:'10px 12px',background:'#06203a',color:'#fff',borderRadius:'8px',zIndex:120});
  document.body.appendChild(d); setTimeout(()=> d.style.opacity=0,1800); setTimeout(()=> d.remove(),2400);
}

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
