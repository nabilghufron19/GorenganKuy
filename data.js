/* ============================================
   data.js — CRUD Supabase + render landing page
   ============================================ */

/* ---------- Getters ---------- */
async function getProducts() {
  if (!sb || isDemo) return [...demoProducts];
  const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return [...demoProducts]; }
  return data;
}

async function getTestis() {
  if (!sb || isDemo) return [...demoTestis];
  const { data, error } = await sb.from('testimonials').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return [...demoTestis]; }
  return data;
}

async function getSettings() {
  if (!sb || isDemo) return { ...demoSettings };
  const { data, error } = await sb.from('settings').select('*');
  if (error || !data.length) return { ...demoSettings };
  const s = {};
  data.forEach(r => s[r.key] = r.value);
  return { ...demoSettings, ...s };
}

async function upsertSetting(key, value) {
  if (!sb || isDemo) { demoSettings[key] = value; return; }
  await sb.from('settings').upsert({ key, value }, { onConflict: 'key' });
}

async function getPakets() {
  const saved = localStorage.getItem('pakets_data');
  if (saved) { try { demoPakets = JSON.parse(saved); } catch(e) {} }
  if (!sb || isDemo) return [...demoPakets];
  const { data, error } = await sb.from('pakets').select('*').order('id', { ascending: true });
  if (error || !data || !data.length) return [...demoPakets];
  demoPakets = data;
  return data;
}

/* ---------- Mutators ---------- */
async function saveProdukDB(prod) {
  if (!sb || isDemo) {
    if (prod.id) {
      const i = demoProducts.findIndex(p => p.id == prod.id);
      if (i >= 0) demoProducts[i] = { ...demoProducts[i], ...prod };
    } else {
      prod.id = Date.now();
      demoProducts.unshift(prod);
    }
    return;
  }
  try {
    if (prod.id) {
      const { id, ...data } = prod;
      const { error } = await sb.from('products').update(data).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await sb.from('products').insert(prod);
      if (error) throw error;
    }
  } catch(e) {
    toast('Gagal simpan: ' + e.message, 'error');
    console.error(e);
  }
}

async function deleteProdukDB(id) {
  if (!sb || isDemo) { demoProducts = demoProducts.filter(p => p.id != id); return; }
  await sb.from('products').delete().eq('id', id);
}

async function saveTestiDB(t) {
  if (!sb || isDemo) { t.id = Date.now(); demoTestis.unshift(t); return; }
  await sb.from('testimonials').insert(t);
}

async function deleteTestiDB(id) {
  if (!sb || isDemo) { demoTestis = demoTestis.filter(t => t.id != id); return; }
  await sb.from('testimonials').delete().eq('id', id);
}

async function savePaketDB(paket) {
  if (paket.id) {
    const i = demoPakets.findIndex(p => p.id == paket.id);
    if (i >= 0) demoPakets[i] = { ...demoPakets[i], ...paket };
  } else {
    paket.id = Date.now();
    demoPakets.push(paket);
  }
  localStorage.setItem('pakets_data', JSON.stringify(demoPakets));
  if (sb && !isDemo) {
    try {
      if (paket.id && paket.id < 1e12) {
        const { id, ...data } = paket;
        await sb.from('pakets').update(data).eq('id', id);
      } else {
        await sb.from('pakets').insert(paket);
      }
    } catch(e) { console.warn('Paket DB save failed:', e.message); }
  }
}

async function deletePaketDB(id) {
  demoPakets = demoPakets.filter(p => p.id != id);
  localStorage.setItem('pakets_data', JSON.stringify(demoPakets));
  if (sb && !isDemo) { try { await sb.from('pakets').delete().eq('id', id); } catch(e) {} }
}

/* ---------- Load all & render ---------- */
async function loadAllData() {
  const [prods, testis, settings, pakets] = await Promise.all([
    getProducts(), getTestis(), getSettings(), getPakets()
  ]);
  renderLandingProducts(prods);
  renderLandingTestis(testis);
  renderLandingPakets(pakets);
  applySettings(settings);
  updateDashboard(prods, testis);
  renderAdminProducts(prods);
  renderAdminTestis(testis);
  renderAdminPakets(pakets);
  loadSettingsForm(settings);
  updateConnStatus();
}

/* ---------- Landing page renderers ---------- */
function renderLandingProducts(prods) {
  const unggulan = prods.filter(p => p.kategori === 'unggulan');
  const andalan  = prods.filter(p => p.kategori === 'andalan');

  document.getElementById('menuGrid').innerHTML = unggulan.map(m => `
    <div class="menu-card reveal">
      <div class="menu-thumb" style="background:linear-gradient(135deg,${m.bg||'#f5a623'}22,${m.bg||'#f5a623'}44)">
        <div class="bg-shape" style="background:${m.bg||'#f5a623'}"></div>
        ${m.foto
          ? `<img src="${m.foto}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0">`
          : `<div class="food-emoji">${m.emoji||'🍽'}</div>`}
      </div>
      <div class="menu-body">
        ${m.badge ? `<span class="menu-badge ${m.badge}">${m.badge_label||m.badge}</span>` : ''}
        <div class="menu-nama">${m.nama}</div>
        <div class="menu-desc">${m.deskripsi||m.desc||''}</div>
        <div class="menu-footer">
          <div class="menu-harga">Rp ${(m.harga||0).toLocaleString('id-ID')}<span>/pcs</span></div>
          <button class="add-btn" onclick="addToCart(${m.id})">+</button>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('andalanGrid').innerHTML = andalan.map(m => `
    <div class="andalan-card reveal" onclick="addToCartObj(${JSON.stringify(m).replace(/"/g,'&quot;')})">
      <div class="andalan-emoji">${m.emoji||'🍽'}</div>
      <div class="andalan-info">
        <div class="andalan-nama">${m.nama}</div>
        <div class="andalan-desc">${m.deskripsi||m.desc||''}</div>
        <div class="andalan-harga">Rp ${(m.harga||0).toLocaleString('id-ID')}/pcs — klik untuk tambah</div>
      </div>
    </div>
  `).join('');

  allProds = prods;
  initReveal();
  document.getElementById('statMenu').textContent = prods.length;
}

function renderLandingPakets(pakets) {
  const grid = document.getElementById('paketGrid');
  if (!grid) return;
  grid.innerHTML = pakets.map(p => `
    <div class="paket-card${p.featured ? ' featured' : ''}">
      ${p.featured ? '<div class="featured-badge">TERLARIS</div>' : ''}
      <div class="paket-emoji">${p.emoji||'📦'}</div>
      <div class="paket-nama">${p.nama}</div>
      <div class="paket-sub">${p.sub||''}</div>
      <ul class="paket-isi">
        ${(p.isi||'').split('\n').filter(x=>x.trim()).map(item=>`<li>${item.trim()}</li>`).join('')}
      </ul>
      <div class="paket-harga">Rp ${(p.harga||0).toLocaleString('id-ID')}</div>
      <button class="paket-btn" onclick="orderPaket('${p.nama}','Rp ${(p.harga||0).toLocaleString('id-ID')}')">Pesan Sekarang</button>
    </div>
  `).join('');
}

function renderLandingTestis(testis) {
  if (!testis.length) return;
  document.getElementById('testiGrid').innerHTML = testis.map((t, i) => `
    <div class="testi-card reveal ${i===1?'d1':i===2?'d2':''}">
      <div class="testi-stars">${'⭐'.repeat(t.rating||5)}</div>
      <p class="testi-text">"${t.komentar}"</p>
      <div class="testi-author">
        <div class="testi-avatar">${t.nama ? t.nama[0].toUpperCase() : '?'}</div>
        <div><div class="testi-name">${t.nama}</div><div class="testi-loc">${t.lokasi||''}</div></div>
      </div>
    </div>
  `).join('');
  initReveal();
}

/* ---------- Admin table renderers ---------- */
function updateDashboard(prods, testis) {
  document.getElementById('dProduk').textContent = prods.length;
  document.getElementById('dTesti').textContent = testis.length;
  document.getElementById('dUnggulan').textContent = prods.filter(p => p.kategori === 'unggulan').length;
  document.getElementById('dAndalan').textContent  = prods.filter(p => p.kategori === 'andalan').length;
  const top = prods.slice(0, 5);
  document.getElementById('dashProdukBody').innerHTML = top.map(p => `
    <tr>
      <td><span class="td-emoji">${p.emoji||'🍽'}</span></td>
      <td style="font-weight:600">${p.nama}</td>
      <td style="text-transform:capitalize">${p.kategori}</td>
      <td style="color:#f5a623;font-weight:700">Rp ${(p.harga||0).toLocaleString('id-ID')}</td>
      <td><span class="badge-pill ${p.badge==='badge-hot'?'pill-hot':p.badge==='badge-new'?'pill-new':'pill-best'}">${p.badge_label||''}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:#475569;padding:20px">Belum ada produk</td></tr>';
}

function renderAdminProducts(prods) {
  document.getElementById('produkTableBody').innerHTML = prods.map(p => `
    <tr>
      <td>
        ${p.foto
          ? `<img src="${p.foto}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;display:block">`
          : `<div style="width:40px;height:40px;border-radius:8px;background:#1a3a2a;display:flex;align-items:center;justify-content:center;font-size:18px">🍽</div>`
        }
      </td>
      <td style="font-weight:600">${p.nama}</td>
      <td style="text-transform:capitalize">${p.kategori}</td>
      <td style="color:#f5a623;font-weight:700">Rp ${(p.harga||0).toLocaleString('id-ID')}</td>
      <td>${p.badge ? `<span class="badge-pill ${p.badge==='badge-hot'?'pill-hot':p.badge==='badge-new'?'pill-new':'pill-best'}">${p.badge_label||''}</span>` : '<span style="color:#475569;font-size:11px">—</span>'}</td>
      <td><div class="td-actions">
        <button class="btn-edit" onclick="openProdukForm(${JSON.stringify(p).replace(/"/g,'&quot;')})">✏️ Edit</button>
        <button class="btn-del" onclick="confirmDelProduk(${p.id})">🗑️ Hapus</button>
      </div></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#475569;padding:20px">Belum ada produk</td></tr>';
}

function renderAdminTestis(testis) {
  document.getElementById('testiTableBody').innerHTML = testis.map(t => `
    <tr>
      <td><div class="testi-avatar" style="margin:0;width:36px;height:36px;font-size:14px">${t.nama ? t.nama[0].toUpperCase() : '?'}</div></td>
      <td style="font-weight:600">${t.nama}</td>
      <td>${t.lokasi||''}</td>
      <td>${'⭐'.repeat(t.rating||5)}</td>
      <td style="max-width:220px;color:#94a3b8;font-size:12px">${(t.komentar||'').substring(0,80)}...</td>
      <td><button class="btn-del" onclick="confirmDelTesti(${t.id})">🗑️ Hapus</button></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#475569;padding:20px">Belum ada testimoni</td></tr>';
}

function renderAdminPakets(pakets) {
  const tbody = document.getElementById('paketTableBody');
  if (!tbody) return;
  tbody.innerHTML = pakets.map(p => `
    <tr>
      <td style="font-size:24px">${p.emoji||'📦'}</td>
      <td style="font-weight:600">${p.nama}</td>
      <td style="color:#94a3b8;font-size:12px">${p.sub||'—'}</td>
      <td style="color:#f5a623;font-weight:700">Rp ${(p.harga||0).toLocaleString('id-ID')}</td>
      <td>${p.featured ? '<span class="badge-pill pill-hot">⭐ TERLARIS</span>' : '<span style="color:#475569;font-size:11px">—</span>'}</td>
      <td><div class="td-actions">
        <button class="btn-edit" onclick="openPaketForm(${JSON.stringify(p).replace(/"/g,'&quot;')})">✏️ Edit</button>
        <button class="btn-del" onclick="confirmDelPaket(${p.id})">🗑️ Hapus</button>
      </div></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#475569;padding:20px">Belum ada paket</td></tr>';
}
