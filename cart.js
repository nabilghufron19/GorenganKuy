/* ============================================
   cart.js — Keranjang belanja & order WhatsApp
   ============================================ */

function addToCart(id) {
  const item = allProds.find(m => m.id == id);
  if (!item) return;
  addToCartObj(item);
}

function addToCartObj(item) {
  const exist = cart.find(c => c.id == item.id);
  if (exist) exist.qty++;
  else cart.push({ ...item, qty: 1 });
  updateCart();
  showNotif('✅ ' + item.nama + ' ditambahkan!');
}

function removeCart(id) {
  cart = cart.filter(c => c.id != id);
  updateCart();
}

function changeQty(id, d) {
  const item = cart.find(c => c.id == id);
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) removeCart(id);
  else updateCart();
}

function updateCart() {
  const total = cart.reduce((a, b) => a + b.qty, 0);
  const totalHarga = cart.reduce((a, b) => a + b.harga * b.qty, 0);

  document.getElementById('cartNum').textContent = total;
  const btn = document.getElementById('cartFloat');
  btn.className = 'cart-float' + (total > 0 ? ' show' : '');

  const content = document.getElementById('cartContent');
  if (!cart.length) {
    content.innerHTML = '<div class="empty-cart">🛒<br>Belum ada yang dipilih nih!<br><br><a href="#unggulan" onclick="toggleCart()" style="color:var(--oranye);font-weight:700">Pilih menu dulu →</a></div>';
    document.querySelector('.cp-total')?.remove();
    document.querySelector('.order-btn')?.remove();
    return;
  }

  content.innerHTML = cart.map(c => `
    <div class="cp-item">
      <div class="cp-emoji">${c.emoji || '🍽'}</div>
      <div class="cp-info">
        <div class="cp-name">${c.nama}</div>
        <div class="cp-price">Rp ${(c.harga * c.qty).toLocaleString('id-ID')}</div>
      </div>
      <div class="cp-qty">
        <button class="cp-qbtn" onclick="changeQty(${c.id},-1)">−</button>
        <span style="font-weight:700;min-width:20px;text-align:center">${c.qty}</span>
        <button class="cp-qbtn" onclick="changeQty(${c.id},1)">+</button>
      </div>
    </div>
  `).join('') +
  `<div class="cp-total">Total: Rp ${totalHarga.toLocaleString('id-ID')}</div>
   <button class="order-btn" onclick="orderViaWA()">💬 Order via WhatsApp</button>`;
}

function orderViaWA() {
  let msg = 'Halo ' + (demoSettings.nama || 'Gorengan Kuy') + '! 🔥 Saya mau order:\n\n';
  cart.forEach(c => msg += `• ${c.nama} x${c.qty} = Rp ${(c.harga * c.qty).toLocaleString('id-ID')}\n`);
  msg += `\nTotal: Rp ${cart.reduce((a, b) => a + b.harga * b.qty, 0).toLocaleString('id-ID')}\n\nMohon konfirmasi ya!`;
  const wa = demoSettings.wa || '6285335101970';
  window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank');
}

function orderPaket(nama, harga) {
  const wa = demoSettings.wa || '6285335101970';
  const brandNama = demoSettings.nama || 'Gorengan Kuy';
  window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(`Halo ${brandNama}! 🔥 Saya mau order ${nama} (${harga}). Mohon konfirmasi ya!`), '_blank');
}

function toggleCart() {
  document.getElementById('cartModal').classList.toggle('show');
}

function closeCartOutside(e) {
  if (e.target === document.getElementById('cartModal')) toggleCart();
}
