// WOK RUSH — config.js
// Semua konstanta, definisi bahan, resep, dan tata letak dapur.
// Satu-satunya tempat angka-angka game tinggal; world.js hanya membaca dari sini.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

export const SHIFT_SECONDS = 180;
export const TARGET_ORDERS = 12;
export const MAX_ACTIVE_ORDERS = 4;

// Bahan: id, nama, warna, butuh potong?, waktu potong (detik), waktu masak (detik).
export const INGREDIENTS = {
  noodle:  { id: 'noodle',  name: 'Mie',    color: '#f2c14e', dark: '#c98f1b', chop: false, chopTime: 0,   cookTime: 5 },
  rice:    { id: 'rice',    name: 'Nasi',   color: '#f7f3e8', dark: '#cfc4a8', chop: false, chopTime: 0,   cookTime: 5 },
  egg:     { id: 'egg',     name: 'Telur',  color: '#fdf6d8', dark: '#e8b93c', chop: false, chopTime: 0,   cookTime: 4 },
  chicken: { id: 'chicken', name: 'Ayam',   color: '#f0a58c', dark: '#c96a4a', chop: true,  chopTime: 1.5, cookTime: 6 },
  beef:    { id: 'beef',    name: 'Sapi',   color: '#a8543f', dark: '#7c3524', chop: true,  chopTime: 1.5, cookTime: 6 },
  veg:     { id: 'veg',     name: 'Sayur',  color: '#7cc24a', dark: '#4d8a26', chop: true,  chopTime: 1.5, cookTime: 4 },
  shrimp:  { id: 'shrimp',  name: 'Udang',  color: '#ff9a6b', dark: '#e05e2b', chop: false, chopTime: 0,   cookTime: 5 },
  cheese:  { id: 'cheese',  name: 'Keju',   color: '#ffd94d', dark: '#e0a800', chop: true,  chopTime: 1.5, cookTime: 3 },
};

export const INGREDIENT_ORDER = ['noodle', 'rice', 'egg', 'chicken', 'beef', 'veg', 'shrimp', 'cheese'];

// Resep: dua bahan, harga dasar (koin). Tip = hingga +50% bila disajikan cepat.
export const RECIPES = [
  { id: 'mie-telur',   name: 'Mie Goreng Telur',   ingredients: ['noodle', 'egg'],     price: 18 },
  { id: 'nasi-ayam',   name: 'Nasi Goreng Ayam',   ingredients: ['rice', 'chicken'],   price: 22 },
  { id: 'mie-sapi',    name: 'Mie Sapi Lada Hitam', ingredients: ['noodle', 'beef'],   price: 26 },
  { id: 'tumis-sayur', name: 'Tumis Sayur Telur',  ingredients: ['veg', 'egg'],       price: 16 },
  { id: 'udang-tiram', name: 'Udang Saus Tiram',   ingredients: ['shrimp', 'veg'],     price: 28 },
  { id: 'omelet-keju', name: 'Omelet Keju Leleh',  ingredients: ['egg', 'cheese'],     price: 20 },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export function ingredientById(id) {
  return INGREDIENTS[id] || null;
}

// Tata letak dapur (koordinat canvas 1280x800).
export const STATIONS = {
  fridge: { id: 'fridge', name: 'Lemari Bahan', x: 28,  y: 190, w: 190, h: 240 },
  board:  { id: 'board',  name: 'Talenan',      x: 290, y: 190, w: 200, h: 140 },
  wok1:   { id: 'wok1',   name: 'Wok 1',        x: 550, y: 190, w: 170, h: 140 },
  wok2:   { id: 'wok2',   name: 'Wok 2',        x: 760, y: 190, w: 170, h: 140 },
  plate:  { id: 'plate',  name: 'Meja Plating', x: 990, y: 190, w: 220, h: 140 },
  serve:  { id: 'serve',  name: 'Meja Saji',    x: 990, y: 400, w: 220, h: 150 },
  bin:    { id: 'bin',    name: 'Tempat Sampah', x: 290, y: 640, w: 150, h: 90 },
};

export const PLAYER_START = { x: 640, y: 620 };
export const PLAYER_SPEED = 300; // px per detik
export const PLAYER_RADIUS = 26;

// Order: interval spawn menyempit dan timer memendek seiring shift berjalan.
export function spawnIntervalAt(elapsed) {
  const p = Math.min(1, elapsed / SHIFT_SECONDS);
  return 14 - 6 * p; // 14 detik -> 8 detik
}

export function orderTimeAt(elapsed) {
  const p = Math.min(1, elapsed / SHIFT_SECONDS);
  return 60 - 15 * p; // 60 detik -> 45 detik
}

export const BURN_AFTER_DONE = 7; // detik setelah matang sebelum gosong
export const TIP_MAX_FRACTION = 0.5;
