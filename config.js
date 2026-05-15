/* ============================================
   config.js — State global, Supabase, demo data
   ============================================ */

const SUPABASE_URL = 'https://ttftmzfncjtfyrphanlw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DTSgzhCZp4dQXKUgANcqiQ_6dL-NxYR';

let sb = null;
let isDemo = false;

function initSupabase(url, key) {
  try {
    sb = window.supabase.createClient(url, key);
    return true;
  } catch(e) {
    return false;
  }
}

function loadConfig() {
  return initSupabase(SUPABASE_URL, SUPABASE_KEY);
}

function updateConnStatus() {
  const dot = document.getElementById('connDot');
  const lbl = document.getElementById('connLabel');
  if (!dot || !lbl) return;
  if (sb) {
    dot.className = 'conn-dot online';
    lbl.textContent = 'Terhubung ke: ' + SUPABASE_URL;
  } else {
    dot.className = 'conn-dot';
    lbl.textContent = 'Menghubungkan...';
  }
}

/* ---- Demo / fallback data ---- */
let demoProducts = [
  {id:1,nama:'Tempe Mendoan',deskripsi:'Tempe tipis berlapis adonan tepung bumbu, digoreng setengah matang — lembut, gurih, dan nagih!',harga:2000,emoji:'🥙',badge:'badge-hot',badge_label:'🔥 Terpopuler',bg:'#f5a623',kategori:'unggulan'},
  {id:2,nama:'Tahu Berontak',deskripsi:'Tahu isi sayuran segar berbalut tepung crispy — garing di luar, lembut meledak di dalam!',harga:2000,emoji:'🧆',badge:'badge-best',badge_label:'⭐ Best Seller',bg:'#e8621a',kategori:'unggulan'},
  {id:3,nama:'Weci / Bakwan',deskripsi:'Bakwan sayur khas Malang-Kraksaan dengan campuran wortel, kol, dan tauge. Gurih dan renyah!',harga:1500,emoji:'🥞',badge:'badge-best',badge_label:'⭐ Favorit Lokal',bg:'#27ae60',kategori:'unggulan'},
  {id:4,nama:'Pisang Goreng',deskripsi:'Pisang kepok manis berbalut tepung crispy. Manis alami, garing sempurna, cocok buat takjil!',harga:2000,emoji:'🍌',badge:'badge-hot',badge_label:'🔥 Hits!',bg:'#f5a623',kategori:'unggulan'},
  {id:5,nama:'Risol Mayo',deskripsi:'Kulit lumpia renyah berisi ayam suwir, telur, dan saus mayo creamy. Kekinian dan bikin ketagihan!',harga:3000,emoji:'🌯',badge:'badge-new',badge_label:'✨ New!',bg:'#9b59b6',kategori:'unggulan'},
  {id:6,nama:'Mendoan Jumbo XL',deskripsi:'Mendoan ukuran jumbo — 2x lebih besar, 2x lebih nikmat!',harga:4000,emoji:'🥙',badge:'badge-best',badge_label:'⭐ Andalan',bg:'#e74c3c',kategori:'andalan'},
  {id:7,nama:'Tahu Pedas Mercon',deskripsi:'Tahu isi special berbalut bumbu mercon super pedas.',harga:2500,emoji:'🌶️',badge:'badge-hot',badge_label:'🔥 Panas!',bg:'#e74c3c',kategori:'andalan'},
];

let demoTestis = [
  {id:1,nama:'Fatimah R.',lokasi:'📍 Kraksaan',komentar:'Mendoannya lembut banget, persis kayak yang dijual di Banyumas!',rating:5},
  {id:2,nama:'Ahmad S.',lokasi:'📍 Paiton',komentar:'Tahu Berontak-nya gila enak! Udah pesen 3x minggu ini 😂',rating:5},
];

let demoPakets = [
  {id:1,nama:'Paket Santai',emoji:'🥡',sub:'Buat 1-2 orang',harga:12000,featured:false,isi:'3 pcs Tempe Mendoan\n3 pcs Tahu Berontak\n2 pcs Weci\nSambal Kecap Gratis'},
  {id:2,nama:'Paket Ramai',emoji:'🎉',sub:'Buat 3-5 orang',harga:28000,featured:true,isi:'8 pcs Tempe Mendoan\n6 pcs Tahu Berontak\n5 pcs Weci\n4 pcs Bakwan Sayur\n3 pcs Pisang Goreng\nSambal + Kecap Gratis'},
  {id:3,nama:'Paket Keluarga',emoji:'👨‍👩‍👧‍👦',sub:'Buat 6-10 orang',harga:55000,featured:false,isi:'15 pcs Tempe Mendoan\n12 pcs Tahu Berontak\n10 pcs Weci\n8 pcs Bakwan\n6 pcs Pisang Goreng\n5 pcs Risol Mayo\nSambal & Kecap Gratis'},
];

let demoSettings = {
  nama:'Gorengan Kuy', slogan:'Kriuk Tiada Duanya', wa:'6285335101970',
  alamat:'Kraksaan, Jawa Timur', jam:'14.00 – 21.00 WIB',
  kuning:'#f5a623', oranye:'#e8621a', coklat:'#1a0a00', hero_emoji:'🍟',
  stat1:'500+', stat2:'12', stat3:'4.9⭐', stat4:'100%',
  admin_user:'admin', admin_pass:'admin123'
};

/* Variabel cart dan produk (dipakai cart.js & data.js) */
let cart = [];
let allProds = [];
