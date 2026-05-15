/* ============================================
   settings.js — applySettings (DOM patch lengkap),
                 saveSettings, media upload
   ============================================ */

/* ---------------------------------------------------
   applySettings — patch SEMUA elemen DOM sekaligus
   Ini adalah fungsi kunci perbaikan bug nama UMKM.
   Dipanggil saat: halaman load & setelah simpan.
   --------------------------------------------------- */
function applySettings(s) {
  /* 1. CSS variables warna */
  document.documentElement.style.setProperty('--kuning', s.kuning || '#f5a623');
  document.documentElement.style.setProperty('--oranye', s.oranye || '#e8621a');
  document.documentElement.style.setProperty('--coklat', s.coklat || '#1a0a00');

  const nama   = s.nama   || 'Gorengan Kuy';
  const slogan = s.slogan || 'Kriuk Tiada Duanya';
  const wa     = s.wa     || '6285335101970';

  /* 2. Nama di navbar */
  const navLogo = document.getElementById('navLogo');
  if (navLogo && !localStorage.getItem('brand_logo')) {
    navLogo.innerHTML = `${nama.split(' ')[0]}<span> ${nama.split(' ').slice(1).join(' ') || 'Kuy'}</span>`;
  }

  /* 3. Nama + slogan di sidebar admin */
  const sidebarName = document.querySelector('.sidebar-logo .lname');
  if (sidebarName) sidebarName.textContent = '🔥 ' + nama;

  /* 4. Footer logo */
  const footerLogo = document.querySelector('.footer-logo');
  if (footerLogo) footerLogo.textContent = nama + ' 🔥';

  /* 5. Judul tab browser */
  document.title = nama + ' — ' + slogan;

  /* 6. Hero badge slogan */
  const badge = document.querySelector('.hero-badge');
  if (badge) badge.innerHTML = `<span class="fire">🔥</span> ${slogan} Sejak 2020`;

  /* 7. Hero tagline (jika ada elemen khusus) */
  // (tagline di-hardcode di HTML, biarkan apa adanya kecuali diperlukan)

  /* 8. Emoji hero */
  const bigEmoji = document.querySelector('.big-emoji');
  if (bigEmoji && s.hero_emoji) bigEmoji.textContent = s.hero_emoji;

  /* 9. Statistik hero */
  if (s.stat1) { const el = document.getElementById('statPelanggan'); if (el) el.textContent = s.stat1; }
  if (s.stat2) { const el = document.getElementById('statMenu');      if (el) el.textContent = s.stat2; }
  const stats = document.querySelectorAll('.stat-num');
  if (stats[2] && s.stat3) stats[2].textContent = s.stat3;
  if (stats[3] && s.stat4) stats[3].textContent = s.stat4;

  /* 10. Link WA di navbar CTA */
  const navCtaWa = document.querySelector('a.nav-cta[href*="wa.me"]');
  if (navCtaWa) navCtaWa.href = `https://wa.me/${wa}`;

  /* 11. Link WA di section CTA */
  const ctaWaBtn = document.querySelector('a.wa-btn[href*="wa.me"]');
  if (ctaWaBtn) ctaWaBtn.href = `https://wa.me/${wa}?text=${encodeURIComponent('Halo ' + nama + '! 🔥 Saya mau order ya')}`;

  /* 12. Footer info */
  const footerInfo = document.querySelector('.footer-info');
  if (footerInfo) {
    footerInfo.innerHTML = `📍 ${s.alamat || 'Kraksaan, Jawa Timur'}<br>📱 ${wa}<br>🕐 Buka setiap hari ${s.jam || '14.00 – 21.00 WIB'}`;
  }

  /* 13. Update demoSettings supaya cart.js bisa baca WA & nama terbaru */
  demoSettings.nama   = nama;
  demoSettings.slogan = slogan;
  demoSettings.wa     = wa;
  if (s.alamat) demoSettings.alamat = s.alamat;
  if (s.jam)    demoSettings.jam    = s.jam;

  /* 14. Media: sync dari Supabase settings ke localStorage lalu terapkan */
  if (s.brand_logo && s.brand_logo !== '') localStorage.setItem('brand_logo', s.brand_logo);
  if (s.hero_bg    && s.hero_bg    !== '') localStorage.setItem('hero_bg', s.hero_bg);
  if (s.site_favicon && s.site_favicon !== '') localStorage.setItem('site_favicon', s.site_favicon);

  updateLogoDisplay();
  updateBgDisplay();
  updateFaviconDisplay();
}

/* ---------------------------------------------------
   loadSettingsForm — isi form pengaturan dengan data
   --------------------------------------------------- */
function loadSettingsForm(s) {
  const map = {
    sNama:'nama', sSlogan:'slogan', sWa:'wa', sAlamat:'alamat', sJam:'jam',
    sKuning:'kuning', sOranye:'oranye', sCoklat:'coklat', sHeroEmoji:'hero_emoji',
    sStat1:'stat1', sStat2:'stat2', sStat3:'stat3', sStat4:'stat4',
    sAdminUser:'admin_user',
  };
  for (const [elId, key] of Object.entries(map)) {
    const el = document.getElementById(elId);
    if (el && s[key]) el.value = s[key];
  }
}

/* ---------------------------------------------------
   saveSettings — simpan & langsung patch DOM
   --------------------------------------------------- */
async function saveSettings() {
  const fields = [
    ['sNama','nama'],['sSlogan','slogan'],['sWa','wa'],['sAlamat','alamat'],['sJam','jam'],
    ['sKuning','kuning'],['sOranye','oranye'],['sCoklat','coklat'],['sHeroEmoji','hero_emoji'],
    ['sStat1','stat1'],['sStat2','stat2'],['sStat3','stat3'],['sStat4','stat4'],
  ];
  for (const [id, key] of fields) {
    const val = document.getElementById(id)?.value;
    if (val) await upsertSetting(key, val);
  }
  /* Credentials admin */
  const newUser  = document.getElementById('sAdminUser')?.value;
  const newPass  = document.getElementById('sAdminPass')?.value;
  const newPass2 = document.getElementById('sAdminPass2')?.value;
  if (newUser) {
    const creds = JSON.parse(localStorage.getItem('admin_creds') || '{"user":"admin","pass":"admin123"}');
    creds.user = newUser;
    if (newPass) {
      if (newPass !== newPass2) { toast('Password tidak cocok!', 'error'); return; }
      creds.pass = newPass;
    }
    localStorage.setItem('admin_creds', JSON.stringify(creds));
  }
  /* Ambil settings terbaru lalu apply ke seluruh DOM */
  const s = await getSettings();
  applySettings(s);
  toast('Pengaturan disimpan! ✅', 'success');
}

/* ============================================
   MEDIA / UPLOAD
   ============================================ */
let pendingLogo    = null;
let pendingBg      = null;
let pendingFavicon = null;

function handleUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const maxMB = type === 'bg' ? 5 : type === 'favicon' ? 0.5 : 2;
  if (file.size > maxMB * 1024 * 1024) { toast(`File terlalu besar! Max ${maxMB}MB`, 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const data = e.target.result;
    if (type === 'logo') {
      pendingLogo = data;
      const box = document.getElementById('logoPreviewBox');
      if (box) box.innerHTML = `<img src="${data}" style="max-height:90px;max-width:100%;object-fit:contain;padding:8px">`;
    } else if (type === 'bg') {
      pendingBg = data;
      const box = document.getElementById('bgPreviewBox');
      if (box) box.innerHTML = `<img src="${data}"><button class="del-img" onclick="removeBg()">✕</button>`;
    } else if (type === 'favicon') {
      pendingFavicon = data;
      const box = document.getElementById('faviconPreviewBox');
      if (box) box.innerHTML = `<img src="${data}" style="max-height:64px;max-width:64px;object-fit:contain;padding:8px">`;
    }
  };
  reader.readAsDataURL(file);
}

function applyLogo() {
  if (!pendingLogo) { toast('Upload logo dulu!', 'error'); return; }
  localStorage.setItem('brand_logo', pendingLogo);
  upsertSetting('brand_logo', pendingLogo);
  updateLogoDisplay();
  updateStorageInfo();
  toast('Logo berhasil diterapkan! ✅', 'success');
}
function removeLogo() {
  localStorage.removeItem('brand_logo');
  upsertSetting('brand_logo', '');
  pendingLogo = null;
  const box = document.getElementById('logoPreviewBox');
  if (box) box.innerHTML = '<div class="preview-empty">Belum ada logo</div>';
  updateLogoDisplay();
  updateStorageInfo();
  toast('Logo dihapus', '');
}
function updateLogoDisplay() {
  const logo = localStorage.getItem('brand_logo');
  const navLogo  = document.getElementById('navLogo');
  const heroLogo = document.getElementById('heroBrandLogo');
  if (logo) {
    if (navLogo) navLogo.innerHTML = `<img src="${logo}" class="nav-logo-img" alt="Logo"><span style="display:none">${demoSettings.nama}</span>`;
    if (heroLogo) heroLogo.innerHTML = `<img src="${logo}" class="hero-brand-logo" alt="Logo">`;
    const box = document.getElementById('logoPreviewBox');
    if (box) box.innerHTML = `<img src="${logo}" style="max-height:90px;max-width:100%;object-fit:contain;padding:8px">`;
  } else {
    const nama = demoSettings.nama || 'Gorengan Kuy';
    const parts = nama.split(' ');
    if (navLogo) navLogo.innerHTML = `${parts[0]}<span> ${parts.slice(1).join(' ') || 'Kuy'}</span>`;
    if (heroLogo) heroLogo.innerHTML = '';
  }
}

function applyBg() {
  if (!pendingBg) { toast('Upload background dulu!', 'error'); return; }
  localStorage.setItem('hero_bg', pendingBg);
  upsertSetting('hero_bg', pendingBg);
  updateBgDisplay();
  updateStorageInfo();
  toast('Background hero diterapkan! ✅', 'success');
}
function removeBg() {
  localStorage.removeItem('hero_bg');
  upsertSetting('hero_bg', '');
  pendingBg = null;
  const box = document.getElementById('bgPreviewBox');
  if (box) box.innerHTML = '<div class="preview-empty">Pakai warna default</div>';
  updateBgDisplay();
  updateStorageInfo();
  toast('Background dihapus', '');
}
function updateBgDisplay() {
  const bg   = localStorage.getItem('hero_bg');
  const hero = document.querySelector('.hero');
  if (!hero) return;
  if (bg) {
    hero.style.backgroundImage    = `url(${bg})`;
    hero.style.backgroundSize     = 'cover';
    hero.style.backgroundPosition = 'center';
    const box = document.getElementById('bgPreviewBox');
    if (box) box.innerHTML = `<img src="${bg}"><button class="del-img" onclick="removeBg()">✕</button>`;
  } else {
    hero.style.backgroundImage = '';
  }
}

function applyFavicon() {
  if (!pendingFavicon) { toast('Upload favicon dulu!', 'error'); return; }
  localStorage.setItem('site_favicon', pendingFavicon);
  upsertSetting('site_favicon', pendingFavicon);
  updateFaviconDisplay();
  updateStorageInfo();
  toast('Favicon diterapkan! ✅', 'success');
}
function removeFavicon() {
  localStorage.removeItem('site_favicon');
  upsertSetting('site_favicon', '');
  pendingFavicon = null;
  const box = document.getElementById('faviconPreviewBox');
  if (box) box.innerHTML = '<div class="preview-empty">Pakai emoji default 🔥</div>';
  updateFaviconDisplay();
  toast('Favicon dihapus', '');
}
function updateFaviconDisplay() {
  const fav = localStorage.getItem('site_favicon');
  let link = document.querySelector("link[rel~='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = fav || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔥</text></svg>';
  if (fav) {
    const box = document.getElementById('faviconPreviewBox');
    if (box) box.innerHTML = `<img src="${fav}" style="max-height:64px;max-width:64px;object-fit:contain;padding:8px">`;
  }
}

/* Foto produk di form */
function handleProdFormFoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('File terlalu besar! Maks 2MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const data = e.target.result;
    document.getElementById('fFotoData').value = data;
    const box = document.getElementById('prodFotoPreview');
    if (box) box.innerHTML = `<img src="${data}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
    const btnClear = document.getElementById('btnClearFoto');
    if (btnClear) btnClear.style.display = 'block';
    toast('Foto siap ✅', 'success');
  };
  reader.readAsDataURL(file);
}
function clearProdFoto() {
  document.getElementById('fFotoData').value = '';
  const box = document.getElementById('prodFotoPreview');
  if (box) box.innerHTML = '<div class="preview-empty" style="font-size:10px;padding:8px">Belum ada</div>';
  const inp = document.getElementById('fFotoInput');
  if (inp) inp.value = '';
  const btnClear = document.getElementById('btnClearFoto');
  if (btnClear) btnClear.style.display = 'none';
}
function renderProdFotoGrid() {
  const grid = document.getElementById('prodFotoGrid');
  if (grid) grid.innerHTML = '<div style="color:#475569;font-size:12px;padding:8px;grid-column:1/-1">Upload foto di form tambah produk</div>';
}
function handleProdFotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast(`${file.name} terlalu besar! Maks 2MB`, 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const grid = document.getElementById('prodFotoGrid');
    if (grid) {
      const id = Date.now();
      grid.innerHTML += `<div class="media-item" id="pf${id}">
        <img src="${e.target.result}" alt="${file.name}">
        <button class="media-del" onclick="this.parentElement.remove()">✕</button>
      </div>`;
    }
    toast('Foto diunggah ✅', 'success');
  };
  reader.readAsDataURL(file);
}

/* Galeri toko */
function readFileAsBase64(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.readAsDataURL(file);
  });
}
async function handleGaleriUpload(event) {
  const files = Array.from(event.target.files);
  let count = 0;
  for (const file of files) {
    if (file.size > 3 * 1024 * 1024) { toast(`${file.name} terlalu besar!`, 'error'); continue; }
    const data = await readFileAsBase64(file);
    if (sb && !isDemo) {
      await sb.from('gallery').insert({ nama: file.name, foto: data, keterangan: '' });
    } else {
      let galeri = JSON.parse(localStorage.getItem('galeri_bank') || '[]');
      galeri.push({ id: Date.now() + Math.random(), name: file.name, data });
      localStorage.setItem('galeri_bank', JSON.stringify(galeri));
    }
    count++;
  }
  await renderGaleriGrid();
  updateStorageInfo();
  toast(`${count} foto galeri ditambahkan! ✅`, 'success');
}
async function renderGaleriGrid() {
  const grid = document.getElementById('galeriGrid');
  if (!grid) return;
  let items = [];
  if (sb && !isDemo) {
    const { data } = await sb.from('gallery').select('*').order('created_at', { ascending: false });
    items = (data || []).map(r => ({ id: r.id, name: r.nama, data: r.foto, fromDb: true }));
  } else {
    items = JSON.parse(localStorage.getItem('galeri_bank') || '[]');
  }
  grid.innerHTML = items.map(f => `
    <div class="media-item">
      <img src="${f.data}" alt="${f.name||''}">
      <button class="media-del" onclick="delGaleri('${f.id}',${f.fromDb||false})">✕</button>
    </div>
  `).join('') || '<div style="color:#475569;font-size:12px;padding:8px;grid-column:1/-1">Belum ada foto galeri</div>';
}
async function delGaleri(id, fromDb) {
  if (fromDb && sb && !isDemo) {
    await sb.from('gallery').delete().eq('id', id);
  } else {
    let galeri = JSON.parse(localStorage.getItem('galeri_bank') || '[]');
    galeri = galeri.filter(f => String(f.id) !== String(id));
    localStorage.setItem('galeri_bank', JSON.stringify(galeri));
  }
  await renderGaleriGrid();
  updateStorageInfo();
  toast('Foto dihapus', '');
}

/* Storage info */
function updateStorageInfo() {
  try {
    let total = 0;
    for (let k in localStorage) { if (localStorage.hasOwnProperty(k)) total += (localStorage[k].length || 0) * 2; }
    const kb  = (total / 1024).toFixed(1);
    const pct = Math.min((total / (5 * 1024 * 1024)) * 100, 100).toFixed(1);
    const el  = document.getElementById('storageUsed');
    const bar = document.getElementById('storageBar');
    if (el)  el.textContent = kb > 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb + ' KB';
    if (bar) { bar.style.width = pct + '%'; bar.style.background = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#f5a623'; }
  } catch(e) {}
}

async function clearAllMedia() {
  if (!confirm('Hapus semua foto tersimpan (logo, background, galeri, foto produk)?\nIni tidak bisa dibatalkan!')) return;
  ['brand_logo','hero_bg','site_favicon','foto_bank','galeri_bank'].forEach(k => localStorage.removeItem(k));
  if (sb && !isDemo) {
    await Promise.all([
      upsertSetting('brand_logo', ''),
      upsertSetting('hero_bg', ''),
      upsertSetting('site_favicon', ''),
      sb.from('gallery').delete().neq('id', 0),
    ]);
  }
  updateLogoDisplay(); updateBgDisplay(); updateFaviconDisplay();
  renderProdFotoGrid(); await renderGaleriGrid();
  const boxes = { logoPreviewBox:'Belum ada logo', bgPreviewBox:'Pakai warna default', faviconPreviewBox:'Pakai emoji default 🔥' };
  for (const [id, text] of Object.entries(boxes)) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="preview-empty">${text}</div>`;
  }
  updateStorageInfo();
  toast('Semua media dihapus', '');
}

/* Inisialisasi semua display media */
async function initMediaDisplays() {
  updateLogoDisplay();
  updateBgDisplay();
  updateFaviconDisplay();
  renderProdFotoGrid();
  await renderGaleriGrid();
  updateStorageInfo();
}
