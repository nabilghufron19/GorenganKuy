/* ============================================
   ui.js — Toast, notifikasi, reveal animation
   ============================================ */

function toast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function showNotif(msg) {
  const n = document.createElement('div');
  n.style.cssText = 'position:fixed;bottom:90px;right:28px;background:var(--oranye);color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;animation:fadeUp .3s ease';
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2000);
}

function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}
