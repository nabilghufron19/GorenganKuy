/* ============================================
   admin.js — Login, tab, CRUD produk/paket/testi
   ============================================ */

/* ---- Auth ---- */
function doLogin() {
  const u = document.getElementById('loginUser').value;
  const p = document.getElementById('loginPass').value;
  const creds = JSON.parse(localStorage.getItem('admin_creds') || '{"user":"admin","pass":"admin123"}');
  if (u === creds.user && p === creds.pass) {
    document.getElementById('adminLogin').classList.add('hide');
    document.getElementById('adminLayout').style.display = 'flex';
    loadAllData();
    initMediaDisplays();
    toast('Selamat datang, ' + u + '! 👋', 'success');
  } else {
    document.getElementById('loginErr').textContent = 'Username atau password salah!';
  }
}

function doLogout() {
  document.getElementById('adminLogin').classList.remove('hide');
  document.getElementById('adminLayout').style.display = 'none';
  document.getElementById('loginErr').textContent = '';
  document.getElementById('loginUser').value = 'admin';
  document.getElementById('loginPass').value = '';
}

function openAdmin()  { document.getElementById('adminPanel').classList.add('show'); }
function closeAdmin() { document.getElementById('adminPanel').classList.remove('show'); }

/* ---- Tab switching ---- */
function switchTab(name, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

/* ---- Produk CRUD ---- */
function openProdukForm(prod = null) {
  document.getElementById('editProdukId').value      = prod ? prod.id : '';
  document.getElementById('produkModalTitle').textContent = prod ? 'Edit Produk' : 'Tambah Produk';
  document.getElementById('fNama').value             = prod ? prod.nama : '';
  document.getElementById('fDesc').value             = prod ? (prod.deskripsi || prod.desc || '') : '';
  document.getElementById('fHarga').value            = prod ? prod.harga : '';
  document.getElementById('fKategori').value         = prod ? prod.kategori : 'unggulan';
  document.getElementById('fBadge').value            = prod ? (prod.badge || '') : '';
  document.getElementById('fFotoData').value         = prod && prod.foto ? prod.foto : '';
  const box      = document.getElementById('prodFotoPreview');
  const btnClear = document.getElementById('btnClearFoto');
  if (prod && prod.foto) {
    if (box) box.innerHTML = `<img src="${prod.foto}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
    if (btnClear) btnClear.style.display = 'block';
  } else {
    if (box) box.innerHTML = '<div class="preview-empty" style="font-size:10px;padding:8px">Belum ada</div>';
    if (btnClear) btnClear.style.display = 'none';
  }
  document.getElementById('produkModal').classList.add('show');
}
function closeProdukModal() { document.getElementById('produkModal').classList.remove('show'); }

async function saveProduk() {
  const id       = document.getElementById('editProdukId').value;
  const badgeVal = document.getElementById('fBadge').value;
  const badgeLabels = { 'badge-hot':'🔥 Hot', 'badge-best':'⭐ Best Seller', 'badge-new':'✨ New' };
  const nama  = document.getElementById('fNama').value.trim();
  const harga = parseInt(document.getElementById('fHarga').value) || 0;
  if (!nama)  { toast('Nama produk wajib diisi!', 'error'); return; }
  if (!harga) { toast('Harga wajib diisi!', 'error'); return; }
  const prod = {
    nama,
    deskripsi: document.getElementById('fDesc').value.trim(),
    harga,
    kategori:    document.getElementById('fKategori').value,
    badge:       badgeVal || null,
    badge_label: badgeVal ? (badgeLabels[badgeVal] || badgeVal) : null,
    foto:        document.getElementById('fFotoData').value || null,
  };
  if (id) prod.id = parseInt(id);
  await saveProdukDB(prod);
  closeProdukModal();
  toast((id ? 'Produk diperbarui' : 'Produk ditambahkan') + '! ✅', 'success');
  const prods = await getProducts();
  renderAdminProducts(prods);
  renderLandingProducts(prods);
  updateDashboard(prods, await getTestis());
}

async function confirmDelProduk(id) {
  if (!confirm('Hapus produk ini?')) return;
  await deleteProdukDB(id);
  toast('Produk dihapus!', '');
  const prods = await getProducts();
  renderAdminProducts(prods);
  renderLandingProducts(prods);
  updateDashboard(prods, await getTestis());
}

/* ---- Testimoni CRUD ---- */
function openTestiForm()  { document.getElementById('testiModal').classList.add('show'); }
function closeTestiModal() { document.getElementById('testiModal').classList.remove('show'); }

async function saveTesti() {
  const t = {
    nama:     document.getElementById('tNama').value,
    lokasi:   document.getElementById('tLokasi').value,
    komentar: document.getElementById('tKomentar').value,
    rating:   parseInt(document.getElementById('tRating').value) || 5,
  };
  if (!t.nama || !t.komentar) { toast('Nama dan komentar wajib diisi!', 'error'); return; }
  await saveTestiDB(t);
  closeTestiModal();
  toast('Testimoni ditambahkan! ✅', 'success');
  const testis = await getTestis();
  renderAdminTestis(testis);
  renderLandingTestis(testis);
  document.getElementById('tNama').value = '';
  document.getElementById('tLokasi').value = '';
  document.getElementById('tKomentar').value = '';
}

async function confirmDelTesti(id) {
  if (!confirm('Hapus testimoni ini?')) return;
  await deleteTestiDB(id);
  toast('Testimoni dihapus!', '');
  const testis = await getTestis();
  renderAdminTestis(testis);
  renderLandingTestis(testis);
  updateDashboard(await getProducts(), testis);
}

/* ---- Paket CRUD ---- */
function openPaketForm(paket = null) {
  document.getElementById('editPaketId').value        = paket ? paket.id : '';
  document.getElementById('paketModalTitle').textContent = paket ? 'Edit Paket' : 'Tambah Paket';
  document.getElementById('pNama').value              = paket ? paket.nama : '';
  document.getElementById('pEmoji').value             = paket ? (paket.emoji || '') : '';
  document.getElementById('pSub').value               = paket ? (paket.sub || '') : '';
  document.getElementById('pHarga').value             = paket ? paket.harga : '';
  document.getElementById('pIsi').value               = paket ? (paket.isi || '') : '';
  document.getElementById('pFeatured').checked        = paket ? !!paket.featured : false;
  document.getElementById('paketModal').classList.add('show');
}
function closePaketModal() { document.getElementById('paketModal').classList.remove('show'); }

async function savePaket() {
  const id    = document.getElementById('editPaketId').value;
  const nama  = document.getElementById('pNama').value.trim();
  const harga = parseInt(document.getElementById('pHarga').value) || 0;
  const isi   = document.getElementById('pIsi').value.trim();
  if (!nama)  { toast('Nama paket wajib diisi!', 'error'); return; }
  if (!harga) { toast('Harga wajib diisi!', 'error'); return; }
  if (!isi)   { toast('Isi paket wajib diisi!', 'error'); return; }
  const paket = {
    nama, harga, isi,
    emoji:    document.getElementById('pEmoji').value.trim() || '📦',
    sub:      document.getElementById('pSub').value.trim(),
    featured: document.getElementById('pFeatured').checked,
  };
  if (id) paket.id = parseInt(id) || id;
  await savePaketDB(paket);
  closePaketModal();
  toast((id ? 'Paket diperbarui' : 'Paket ditambahkan') + '! ✅', 'success');
  const pakets = await getPakets();
  renderAdminPakets(pakets);
  renderLandingPakets(pakets);
}

async function confirmDelPaket(id) {
  if (!confirm('Hapus paket ini?')) return;
  await deletePaketDB(id);
  toast('Paket dihapus!', '');
  const pakets = await getPakets();
  renderAdminPakets(pakets);
  renderLandingPakets(pakets);
}
