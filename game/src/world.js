// WOK RUSH — world.js
// State + aturan game: order masuk, potong, masak (bisa gosong), plating,
// sajikan, koin + tip, shift 3 menit, dan layar skor akhir.
// Tidak ada gambar di sini; render.js yang menggambar state ini.

import {
  CANVAS_W, CANVAS_H, SHIFT_SECONDS, TARGET_ORDERS, MAX_ACTIVE_ORDERS,
  INGREDIENTS, INGREDIENT_ORDER, RECIPES, recipeById, ingredientById,
  STATIONS, PLAYER_START, PLAYER_SPEED, PLAYER_RADIUS,
  spawnIntervalAt, orderTimeAt, BURN_AFTER_DONE, TIP_MAX_FRACTION,
} from './config.js';
import { makeRng, rngPickExcept } from './random.js';

export const SHOT_SEED = 1337;

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

export function createWorld(seed) {
  const rng = makeRng(seed);
  return {
    seed,
    rng,
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    state: 'title', // title | playing | over
    coins: 0,
    served: 0,
    failed: 0,
    best: 0,
    player: { x: PLAYER_START.x, y: PLAYER_START.y, holding: null, moveTarget: null, facing: 1 },
    orders: [], // { id, recipeId, timeLeft, total, born }
    nextOrderId: 1,
    spawnIn: 2,
    lastRecipeId: null,
    board: { item: null, progress: 0, state: 'empty' }, // empty | chopping | chopped
    woks: [
      { id: 'wok1', item: null, progress: 0, state: 'empty', doneFor: 0 },
      { id: 'wok2', item: null, progress: 0, state: 'empty', doneFor: 0 },
    ],
    plate: { items: [] }, // bahan matang di atas piring plating
    fridgeOpen: false,
    hint: '',
    hintUntil: 0,
    popups: [], // { x, y, text, color, until }
    stats: { chopped: 0, cooked: 0, burnt: 0 },
  };
}

export function setHint(world, text) {
  world.hint = text;
  world.hintUntil = world.time + 2.5;
}

export function addPopup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color: color || '#ffd94d', until: world.time + 1.6 });
}

export function startShift(world) {
  world.state = 'playing';
  world.time = 0;
  world.shiftLeft = SHIFT_SECONDS;
  world.spawnIn = 2;
}

export function spawnOrder(world, recipeId) {
  const recipe = recipeId ? recipeById(recipeId) : rngPickExcept(world.rng, RECIPES, world.lastRecipeId);
  const total = orderTimeAt(world.time);
  const order = { id: world.nextOrderId++, recipeId: recipe.id, timeLeft: total, total, born: world.time };
  world.orders.push(order);
  world.lastRecipeId = recipe.id;
  return order;
}

function orderMatchesPlate(recipe, plateItems) {
  if (plateItems.length !== recipe.ingredients.length) return false;
  const have = [...plateItems].sort();
  const need = [...recipe.ingredients].sort();
  return have.every((ing, i) => ing === need[i]);
}

export function plateMatchesOrder(world) {
  if (world.plate.items.length === 0) return null;
  for (const order of world.orders) {
    const recipe = recipeById(order.recipeId);
    if (orderMatchesPlate(recipe, world.plate.items)) return order;
  }
  return null;
}

export function holdingLabel(holding) {
  if (!holding) return '';
  if (holding.kind === 'plate') return 'Piring';
  const ing = ingredientById(holding.ing);
  if (holding.kind === 'raw') return ing.name + ' mentah';
  if (holding.kind === 'chopped') return ing.name + ' potong';
  if (holding.kind === 'cooked') return ing.name + ' matang';
  if (holding.kind === 'burnt') return ing.name + ' gosong';
  return '';
}

// ---- aksi pemain -----------------------------------------------------------

export function pickIngredient(world, ingId) {
  if (world.state !== 'playing') return false;
  if (world.player.holding) { setHint(world, 'Tangan penuh — letakkan dulu'); return false; }
  const ing = ingredientById(ingId);
  if (!ing) return false;
  world.player.holding = { kind: 'raw', ing: ingId };
  world.fridgeOpen = false;
  return true;
}

export function interactStation(world, stationId) {
  if (world.state !== 'playing') return;
  const p = world.player;
  if (stationId === 'fridge') {
    if (p.holding) { setHint(world, 'Tangan penuh — letakkan dulu'); return; }
    world.fridgeOpen = !world.fridgeOpen;
    return;
  }
  world.fridgeOpen = false;
  if (stationId === 'board') return interactBoard(world);
  if (stationId === 'wok1' || stationId === 'wok2') return interactWok(world, stationId);
  if (stationId === 'plate') return interactPlate(world);
  if (stationId === 'serve') return interactServe(world);
  if (stationId === 'bin') return interactBin(world);
}

function interactBoard(world) {
  const p = world.player;
  const b = world.board;
  if (b.state === 'chopping') { setHint(world, 'Masih dipotong…'); return; }
  if (b.state === 'chopped') {
    if (p.holding) { setHint(world, 'Tangan penuh'); return; }
    p.holding = { kind: 'chopped', ing: b.item };
    b.item = null;
    b.state = 'empty';
    b.progress = 0;
    return;
  }
  // board kosong
  if (!p.holding || p.holding.kind !== 'raw') { setHint(world, 'Bawa bahan mentah ke talenan'); return; }
  const ing = ingredientById(p.holding.ing);
  if (!ing.chop) { setHint(world, ing.name + ' tidak perlu dipotong — langsung ke wok'); return; }
  b.item = p.holding.ing;
  b.state = 'chopping';
  b.progress = 0;
  p.holding = null;
}

function interactWok(world, wokId) {
  const p = world.player;
  const wok = world.woks.find((w) => w.id === wokId);
  if (wok.state === 'cooking') { setHint(world, 'Masih dimasak…'); return; }
  if (wok.state === 'done' || wok.state === 'burnt') {
    if (p.holding) { setHint(world, 'Tangan penuh'); return; }
    p.holding = { kind: wok.state === 'burnt' ? 'burnt' : 'cooked', ing: wok.item };
    if (wok.state === 'burnt') world.stats.burnt++;
    wok.item = null;
    wok.state = 'empty';
    wok.progress = 0;
    wok.doneFor = 0;
    return;
  }
  // wok kosong
  if (!p.holding) { setHint(world, 'Bawa bahan ke wok'); return; }
  if (p.holding.kind === 'raw') {
    const ing = ingredientById(p.holding.ing);
    if (ing.chop) { setHint(world, ing.name + ' harus dipotong dulu di talenan'); return; }
    wok.item = p.holding.ing;
    wok.state = 'cooking';
    wok.progress = 0;
    p.holding = null;
    return;
  }
  if (p.holding.kind === 'chopped') {
    wok.item = p.holding.ing;
    wok.state = 'cooking';
    wok.progress = 0;
    p.holding = null;
    return;
  }
  setHint(world, 'Yang ini tidak dimasak di wok');
}

function interactPlate(world) {
  const p = world.player;
  if (p.holding && p.holding.kind === 'plate') {
    // Letakkan piring kembali ke meja plating, isinya ikut kembali.
    world.plate.items = [...p.holding.items];
    p.holding = null;
    return;
  }
  if (p.holding && p.holding.kind === 'cooked') {
    if (world.plate.items.includes(p.holding.ing)) {
      setHint(world, 'Piring sudah ada ' + ingredientById(p.holding.ing).name);
      return;
    }
    world.plate.items.push(p.holding.ing);
    p.holding = null;
    return;
  }
  if (p.holding && p.holding.kind === 'burnt') {
    setHint(world, 'Gosong! Buang ke tempat sampah');
    return;
  }
  if (!p.holding) {
    if (world.plate.items.length === 0) { setHint(world, 'Piring kosong — taruh bahan matang di sini'); return; }
    p.holding = { kind: 'plate', items: [...world.plate.items] };
    world.plate.items = [];
    return;
  }
  setHint(world, 'Letakkan dulu yang di tangan');
}

function interactServe(world) {
  const p = world.player;
  if (!p.holding || p.holding.kind !== 'plate') {
    setHint(world, 'Bawa piring yang sudah lengkap ke meja saji');
    return;
  }
  const held = p.holding.items;
  const match = world.orders.find((o) => orderMatchesPlate(recipeById(o.recipeId), held));
  if (!match) {
    setHint(world, 'Piring ini belum cocok dengan order mana pun');
    return;
  }
  const recipe = recipeById(match.recipeId);
  const speedBonus = Math.round(recipe.price * TIP_MAX_FRACTION * (match.timeLeft / match.total));
  const earned = recipe.price + speedBonus;
  world.coins += earned;
  world.served++;
  world.orders = world.orders.filter((o) => o.id !== match.id);
  const c = stationCenter(STATIONS.serve);
  addPopup(world, c.x, c.y - 60, '+' + earned + ' koin', '#ffd94d');
  p.holding = null;
}

function interactBin(world) {
  const p = world.player;
  if (!p.holding) { setHint(world, 'Tidak ada yang dibuang'); return; }
  if (p.holding.kind === 'burnt' || p.holding.kind === 'cooked') {
    p.holding = null;
    return;
  }
  setHint(world, 'Yang ini jangan dibuang');
}

// ---- update ----------------------------------------------------------------

export function nearestStation(world, x, y, maxDist) {
  let best = null;
  let bestD = maxDist || 150;
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    const c = stationCenter(s);
    const d = Math.hypot(x - c.x, y - c.y);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

export function updateWorld(world, dt, input) {
  if (world.state !== 'playing') return;
  world.time += dt;
  world.shiftLeft = Math.max(0, SHIFT_SECONDS - world.time);

  // Gerak pemain (keyboard) atau jalan otomatis ke target klik.
  const p = world.player;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx !== 0 || my !== 0) {
    p.moveTarget = null;
    const len = Math.hypot(mx, my);
    p.x += (mx / len) * PLAYER_SPEED * dt;
    p.y += (my / len) * PLAYER_SPEED * dt;
    p.facing = mx !== 0 ? Math.sign(mx) : p.facing;
  } else if (p.moveTarget) {
    const dx = p.moveTarget.x - p.x;
    const dy = p.moveTarget.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      p.moveTarget = null;
      if (p.moveTargetStation) {
        interactStation(world, p.moveTargetStation);
        p.moveTargetStation = null;
      }
    } else {
      p.x += (dx / d) * PLAYER_SPEED * dt;
      p.y += (dy / d) * PLAYER_SPEED * dt;
      p.facing = dx !== 0 ? Math.sign(dx) : p.facing;
    }
  }
  p.x = Math.max(24, Math.min(CANVAS_W - 24, p.x));
  p.y = Math.max(160, Math.min(CANVAS_H - 24, p.y));

  // Talenan: potong jalan sendiri setelah ditaruh.
  const b = world.board;
  if (b.state === 'chopping') {
    const ing = ingredientById(b.item);
    b.progress += dt / ing.chopTime;
    if (b.progress >= 1) {
      b.progress = 1;
      b.state = 'chopped';
      world.stats.chopped++;
    }
  }

  // Wok: masak, lalu bisa gosong bila dibiarkan.
  for (const wok of world.woks) {
    if (wok.state === 'cooking') {
      const ing = ingredientById(wok.item);
      wok.progress += dt / ing.cookTime;
      if (wok.progress >= 1) {
        wok.progress = 1;
        wok.state = 'done';
        wok.doneFor = 0;
        world.stats.cooked++;
      }
    } else if (wok.state === 'done') {
      wok.doneFor += dt;
      if (wok.doneFor > BURN_AFTER_DONE) wok.state = 'burnt';
    }
  }

  // Order: spawn berkala, timer jalan, kedaluwarsa = gagal.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < MAX_ACTIVE_ORDERS) {
    spawnOrder(world);
    world.spawnIn = spawnIntervalAt(world.time);
  }
  for (const order of world.orders) order.timeLeft -= dt;
  const expired = world.orders.filter((o) => o.timeLeft <= 0);
  if (expired.length > 0) {
    world.failed += expired.length;
    world.orders = world.orders.filter((o) => o.timeLeft > 0);
    setHint(world, 'Order kedaluwarsa! (' + expired.length + ')');
  }

  world.popups = world.popups.filter((pp) => pp.until > world.time);

  if (world.shiftLeft <= 0) {
    world.state = 'over';
    if (world.coins > world.best) world.best = world.coins;
  }
}

export function shiftProgress(world) {
  return Math.min(1, world.time / SHIFT_SECONDS);
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
