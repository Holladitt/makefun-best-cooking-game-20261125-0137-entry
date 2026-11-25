// WOK RUSH — render.js
// Semua gambar game: dapur, stasiun, bahan, koki, papan order, HUD, layar judul/akhir.
// Gambar murni canvas 2D (bentuk + warna), original. Render deterministik:
// semua animasi berasal dari world.time, tidak ada Math.random di sini.

import {
  CANVAS_W, CANVAS_H, INGREDIENTS, INGREDIENT_ORDER, recipeById, ingredientById,
  STATIONS, PLAYER_RADIUS,
} from './config.js';
import { plateMatchesOrder, holdingLabel, formatClock } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color || '#fff';
  ctx.font = (weight || 'bold') + ' ' + size + 'px sans-serif';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// ---- ikon bahan ------------------------------------------------------------

export function drawIngredient(ctx, ingId, x, y, r) {
  const ing = ingredientById(ingId);
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  if (ingId === 'noodle') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = Math.max(2, r * 0.22);
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, i * r * 0.45);
      ctx.bezierCurveTo(-r * 0.3, i * r * 0.45 - r * 0.5, r * 0.3, i * r * 0.45 + r * 0.5, r * 0.9, i * r * 0.45);
      ctx.stroke();
    }
  } else if (ingId === 'rice') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r, r * 0.65, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-r * 0.5 + i * r * 0.25, -r * 0.1 - (i % 2) * r * 0.2, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ingId === 'egg') {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5b81e';
    ctx.beginPath();
    ctx.arc(r * 0.15, -r * 0.05, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'chicken') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.ellipse(-r * 0.1, -r * 0.1, r * 0.7, r * 0.55, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f7ead9';
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.4, r * 0.35);
    ctx.lineTo(r * 0.85, r * 0.8);
    ctx.stroke();
    ctx.fillStyle = '#f7ead9';
    ctx.beginPath();
    ctx.arc(r * 0.9, r * 0.85, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'beef') {
    ctx.fillStyle = ing.color;
    rr(ctx, -r, -r * 0.6, r * 2, r * 1.2, r * 0.4);
    ctx.fill();
    ctx.strokeStyle = '#e8b49a';
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.2);
    ctx.lineTo(r * 0.6, -r * 0.2);
    ctx.moveTo(-r * 0.6, r * 0.2);
    ctx.lineTo(r * 0.4, r * 0.2);
    ctx.stroke();
  } else if (ingId === 'veg') {
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.5 + i * r * 0.5, (i % 2) * r * 0.2 - r * 0.1, r * 0.42, r * 0.62, (i - 1) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(0, r * 0.7);
    ctx.stroke();
  } else if (ingId === 'shrimp') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = r * 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0.3, Math.PI * 1.7);
    ctx.stroke();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.55, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, r * 0.6);
    ctx.lineTo(0, -r * 0.8);
    ctx.lineTo(r * 0.9, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [hx, hy] of [[-0.3, 0.25], [0.3, 0.3], [0, -0.1]]) {
      ctx.beginPath();
      ctx.arc(hx * r, hy * r, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---- dapur -----------------------------------------------------------------

function drawFloorAndWall(ctx, time) {
  // Dinding malam + jendela kota.
  ctx.fillStyle = '#2b3a55';
  ctx.fillRect(0, 0, CANVAS_W, 150);
  ctx.fillStyle = '#1d2a40';
  ctx.fillRect(0, 146, CANVAS_W, 6);
  // Jendela dengan lampu kota.
  for (let i = 0; i < 3; i++) {
    const wx = 60 + i * 120;
    ctx.fillStyle = '#f7c948';
    rr(ctx, wx, 30, 80, 90, 6);
    ctx.fill();
    ctx.fillStyle = '#2b3a55';
    ctx.fillRect(wx + 36, 30, 8, 90);
    ctx.fillRect(wx, 70, 80, 8);
  }
  // Lampu gantung.
  for (let i = 0; i < 4; i++) {
    const lx = 340 + i * 220;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 46);
    ctx.stroke();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(lx, 56, 12 + Math.sin(time * 2 + i) * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lantai ubin.
  ctx.fillStyle = '#3d2f26';
  ctx.fillRect(0, 152, CANVAS_W, CANVAS_H - 152);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  for (let x = 0; x < CANVAS_W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 152);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 152; y < CANVAS_H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
}

function drawProgressBar(ctx, x, y, w, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  rr(ctx, x, y, w, 12, 6);
  ctx.fill();
  ctx.fillStyle = color;
  rr(ctx, x + 2, y + 2, Math.max(0, (w - 4) * Math.min(1, frac)), 8, 4);
  ctx.fill();
}

function drawStation(ctx, world, station) {
  const { x, y, w, h } = station;
  ctx.fillStyle = '#5a4632';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#7a5c40';
  rr(ctx, x + 6, y + 6, w - 12, 26, 6);
  ctx.fill();
  text(ctx, station.name.toUpperCase(), x + w / 2, y + 20, 13, '#ffe9b0', 'center', '800');
}

function drawFridge(ctx, world) {
  const s = STATIONS.fridge;
  ctx.fillStyle = '#8fa8bf';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#a9c2d6';
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 8);
  ctx.fill();
  ctx.strokeStyle = '#5d7a94';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x + 8, s.y + s.h / 2);
  ctx.lineTo(s.x + s.w - 8, s.y + s.h / 2);
  ctx.stroke();
  text(ctx, 'LEMARI BAHAN', s.x + s.w / 2, s.y + 26, 13, '#24405a', 'center', '800');
  // Ikon bahan di rak kulkas.
  INGREDIENT_ORDER.forEach((id, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const ix = s.x + 32 + col * 44;
    const iy = s.y + 62 + row * 72;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    rr(ctx, ix - 19, iy - 19, 38, 52, 6);
    ctx.fill();
    drawIngredient(ctx, id, ix, iy - 2, 13);
    text(ctx, INGREDIENTS[id].name, ix, iy + 20, 10, '#24405a', 'center', '700');
  });
  text(ctx, 'Klik bahan / tekan 1-8', s.x + s.w / 2, s.y + s.h - 14, 11, '#24405a', 'center', '700');
}

function drawBoard(ctx, world) {
  const s = STATIONS.board;
  drawStation(ctx, world, s);
  const b = world.board;
  ctx.fillStyle = '#d9a066';
  rr(ctx, s.x + 22, s.y + 48, s.w - 44, 62, 8);
  ctx.fill();
  ctx.strokeStyle = '#b57e42';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (b.item) {
    drawIngredient(ctx, b.item, s.x + w2(s) / 2, s.y + 79, 22);
    if (b.state === 'chopping') {
      drawProgressBar(ctx, s.x + 30, s.y + 118, s.w - 60, b.progress, '#ffd94d');
      text(ctx, 'MEMOTONG…', s.x + s.w / 2, s.y + 100, 11, '#fff', 'center', '800');
    } else {
      text(ctx, 'SIAP DIAMBIL', s.x + s.w / 2, s.y + 118, 11, '#b6ff9e', 'center', '800');
    }
  } else {
    text(ctx, 'Bawa bahan ke sini', s.x + s.w / 2, s.y + 82, 12, '#e8d9b8', 'center', '700');
  }
  function w2(st) { return st.w; }
}

function drawSteam(ctx, x, y, time, seed) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#e8eef4';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ph = (time * 0.9 + seed + i * 0.33) % 1;
    const sx = x - 14 + i * 14 + Math.sin((time + i) * 3) * 4;
    const sy = y - ph * 34;
    ctx.globalAlpha = 0.55 * (1 - ph);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + 6, sy - 8, sx - 2, sy - 14);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWok(ctx, world, wok) {
  const s = STATIONS[wok.id];
  drawStation(ctx, world, s);
  const cx = s.x + s.w / 2;
  const cy = s.y + 84;
  // Kompor + wajan.
  ctx.fillStyle = '#22242a';
  rr(ctx, s.x + 18, s.y + 118, s.w - 36, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#3a3f4a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 58, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22242a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 48, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  if (wok.item) {
    drawIngredient(ctx, wok.item, cx, cy, 22);
    if (wok.state === 'cooking') {
      drawSteam(ctx, cx, cy - 20, world.time, wok.id === 'wok1' ? 0 : 0.5);
      drawProgressBar(ctx, s.x + 22, s.y + 100, s.w - 44, wok.progress, '#ff9a3c');
    } else if (wok.state === 'done') {
      drawSteam(ctx, cx, cy - 20, world.time, wok.id === 'wok1' ? 0.2 : 0.7);
      text(ctx, 'MATANG!', cx, s.y + 106, 12, '#b6ff9e', 'center', '800');
    } else if (wok.state === 'burnt') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 48, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'GOSONG!', cx, s.y + 106, 12, '#ff6b5e', 'center', '800');
    }
  } else {
    text(ctx, 'Wok kosong', cx, cy, 12, '#cbb98f', 'center', '700');
  }
}

function drawPlateStation(ctx, world) {
  const s = STATIONS.plate;
  drawStation(ctx, world, s);
  const cx = s.x + s.w / 2;
  const cy = s.y + 86;
  const ready = plateMatchesOrder(world);
  if (ready) {
    ctx.save();
    ctx.globalAlpha = 0.55 + Math.sin(world.time * 5) * 0.2;
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 74, 44, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#f4f1e6';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 62, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2ab';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 46, 25, 0, 0, Math.PI * 2);
  ctx.stroke();
  world.plate.items.forEach((ingId, i) => {
    const off = world.plate.items.length === 1 ? 0 : (i === 0 ? -24 : 24);
    drawIngredient(ctx, ingId, cx + off, cy - 4, 17);
  });
  if (world.plate.items.length === 0) {
    text(ctx, 'Taruh bahan matang', cx, cy, 11, '#8a8270', 'center', '700');
  } else if (ready) {
    text(ctx, 'SIAP SAJI — ' + recipeById(ready.recipeId).name.toUpperCase(), cx, s.y + 122, 12, '#ffd94d', 'center', '800');
  } else {
    text(ctx, 'Di piring: ' + world.plate.items.map((id) => INGREDIENTS[id].name).join(' + '), cx, s.y + 122, 11, '#fff', 'center', '700');
  }
}

function drawServe(ctx, world) {
  const s = STATIONS.serve;
  ctx.fillStyle = '#7a2e2e';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#a8433c';
  rr(ctx, s.x + 6, s.y + 6, s.w - 12, 34, 6);
  ctx.fill();
  text(ctx, 'MEJA SAJI', s.x + s.w / 2, s.y + 24, 14, '#ffe9b0', 'center', '800');
  // Jendela saji + bel.
  ctx.fillStyle = '#2b1c12';
  rr(ctx, s.x + 18, s.y + 52, s.w - 36, 62, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 82, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 14, s.y + 82, 28, 4);
  text(ctx, 'Sajikan piring lengkap di sini', s.x + s.w / 2, s.y + 128, 12, '#ffe9b0', 'center', '700');
}

function drawBin(ctx, world) {
  const s = STATIONS.bin;
  ctx.fillStyle = '#4a4f57';
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  ctx.fillStyle = '#5d636e';
  rr(ctx, s.x + 6, s.y + 6, s.w - 12, 18, 5);
  ctx.fill();
  text(ctx, 'SAMPAH', s.x + s.w / 2, s.y + s.h / 2 + 14, 12, '#dfe3ea', 'center', '800');
}

function drawPlayer(ctx, world) {
  const p = world.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Bayangan.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, PLAYER_RADIUS - 4, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Badan koki.
  ctx.fillStyle = '#f2f2f2';
  rr(ctx, -20, -6, 40, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-20, 8, 40, 6);
  // Kepala + topi koki.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -18, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -28, 9, 0, Math.PI * 2);
  ctx.arc(0, -33, 10, 0, Math.PI * 2);
  ctx.arc(8, -28, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -30, 26, 6);
  // Mata.
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-5 + p.facing * 2, -18, 2, 0, Math.PI * 2);
  ctx.arc(5 + p.facing * 2, -18, 2, 0, Math.PI * 2);
  ctx.fill();
  // Yang dipegang, di atas kepala.
  if (p.holding) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -46, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    if (p.holding.kind === 'plate') {
      ctx.fillStyle = '#f4f1e6';
      ctx.beginPath();
      ctx.ellipse(0, -48, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      p.holding.items.forEach((ingId, i) => {
        drawIngredient(ctx, ingId, p.holding.items.length === 1 ? 0 : (i === 0 ? -10 : 10), -50, 8);
      });
    } else {
      drawIngredient(ctx, p.holding.ing, 0, -48, 15);
      if (p.holding.kind === 'burnt') {
        text(ctx, 'GOSONG', 0, -70, 10, '#ff6b5e', 'center', '800');
      }
    }
    text(ctx, holdingLabel(p.holding), 0, 44, 11, '#fff', 'center', '700');
  }
  ctx.restore();
}

// ---- papan order + HUD ------------------------------------------------------

function drawOrderBoard(ctx, world) {
  ctx.fillStyle = '#1d2a40';
  ctx.fillRect(0, 0, CANVAS_W, 148);
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(0, 148, CANVAS_W, 4);
  text(ctx, 'WOK RUSH', 16, 34, 30, '#ffd94d', 'left', '900');
  text(ctx, 'Warung Malam', 16, 62, 13, '#9fb4d0', 'left', '700');
  // Koin + pesanan selesai.
  text(ctx, '🪙 ' + world.coins + ' koin', 16, 100, 20, '#fff', 'left', '800');
  text(ctx, 'Saji: ' + world.served + '/' + 12 + '  •  Gagal: ' + world.failed, 16, 128, 13, '#9fb4d0', 'left', '700');
  // Tiket order.
  const startX = 250;
  const ticketW = 196;
  const ticketH = 118;
  world.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const x = startX + i * (ticketW + 10);
    const y = 16;
    const frac = Math.max(0, order.timeLeft / order.total);
    ctx.fillStyle = frac > 0.5 ? '#fdf6e3' : frac > 0.25 ? '#ffe9b0' : '#ffc4bd';
    rr(ctx, x, y, ticketW, ticketH, 10);
    ctx.fill();
    ctx.fillStyle = '#2b3a55';
    text(ctx, '#' + order.id + '  ' + recipe.name, x + 10, y + 18, 13, '#2b3a55', 'left', '800');
    recipe.ingredients.forEach((ingId, j) => {
      drawIngredient(ctx, ingId, x + 26 + j * 44, y + 52, 16);
    });
    text(ctx, recipe.ingredients.map((id) => INGREDIENTS[id].name).join(' + '), x + 10, y + 84, 11, '#5a4632', 'left', '700');
    // Timer bar + angka.
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    rr(ctx, x + 10, y + 98, ticketW - 20, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#4da34d' : frac > 0.25 ? '#e8a13c' : '#d43d2a';
    rr(ctx, x + 10, y + 98, (ticketW - 20) * frac, 10, 5);
    ctx.fill();
    text(ctx, Math.ceil(order.timeLeft) + ' dtk', x + ticketW - 10, y + 84, 12, '#d43d2a', 'right', '800');
  });
  if (world.orders.length === 0) {
    text(ctx, 'Belum ada order — tunggu pelanggan…', startX + 10, 70, 15, '#9fb4d0', 'left', '700');
  }
  // Timer shift besar.
  const sx = CANVAS_W - 130;
  text(ctx, 'SHIFT', sx + 60, 30, 13, '#9fb4d0', 'center', '800');
  text(ctx, formatClock(world.shiftLeft), sx + 60, 66, 40, world.shiftLeft < 30 ? '#ff6b5e' : '#fff', 'center', '900');
  drawProgressBar(ctx, sx, 96, 120, world.shiftLeft / 180, '#ffd94d');
  text(ctx, 'Target 12 order', sx + 60, 124, 11, '#9fb4d0', 'center', '700');
}

function drawHint(ctx, world) {
  if (world.time < world.hintUntil && world.hint) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    const w = ctx.measureText(world.hint).width + 30;
    rr(ctx, CANVAS_W / 2 - w / 2, CANVAS_H - 64, w, 34, 8);
    ctx.fill();
    text(ctx, world.hint, CANVAS_W / 2, CANVAS_H - 46, 15, '#ffe9b0', 'center', '700');
  }
  // Kontrol singkat.
  text(ctx, 'WASD / Panah: gerak   •   Klik stasiun / E: pakai   •   1-8: ambil bahan   •   R: ulang', CANVAS_W / 2, CANVAS_H - 14, 12, 'rgba(255,255,255,0.55)', 'center', '600');
}

function drawPopups(ctx, world) {
  for (const pp of world.popups) {
    const age = 1 - (pp.until - world.time) / 1.6;
    ctx.globalAlpha = 1 - age;
    text(ctx, pp.text, pp.x, pp.y - age * 30, 22, pp.color, 'center', '900');
  }
  ctx.globalAlpha = 1;
}

function drawFridgePicker(ctx, world) {
  if (!world.fridgeOpen) return;
  const s = STATIONS.fridge;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  rr(ctx, s.x + s.w + 12, s.y - 6, 360, 150, 10);
  ctx.fill();
  text(ctx, 'PILIH BAHAN — klik / tekan 1-8', s.x + s.w + 192, s.y + 16, 13, '#ffd94d', 'center', '800');
  INGREDIENT_ORDER.forEach((id, i) => {
    const ix = s.x + s.w + 42 + i * 42;
    const iy = s.y + 62;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    rr(ctx, ix - 18, iy - 26, 36, 62, 6);
    ctx.fill();
    drawIngredient(ctx, id, ix, iy - 6, 13);
    text(ctx, String(i + 1), ix, iy + 26, 11, '#fff', 'center', '800');
  });
  text(ctx, 'Esc: tutup', s.x + s.w + 192, s.y + 122, 11, '#9fb4d0', 'center', '700');
}

// ---- layar judul / akhir ----------------------------------------------------

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(10,16,28,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'WOK RUSH', CANVAS_W / 2, 190, 84, '#ffd94d', 'center', '900');
  text(ctx, 'Warung malam paling sibuk di kota — masak cepat, saji tepat waktu!', CANVAS_W / 2, 250, 22, '#fff', 'center', '700');
  const lines = [
    '1. Ambil bahan di lemari (klik / tekan 1-8)',
    '2. Potong di talenan bila perlu, lalu masak di wok — jangan sampai gosong!',
    '3. Tata di piring plating, sajikan di meja saji sebelum timer order habis',
    '4. Sajikan cepat = tip besar. Shift 3 menit, target 12 order.',
  ];
  lines.forEach((line, i) => text(ctx, line, CANVAS_W / 2, 320 + i * 36, 18, '#dfe7f2', 'center', '600'));
  text(ctx, 'Gerak: WASD / Panah      Aksi: klik stasiun atau E / Spasi', CANVAS_W / 2, 500, 17, '#9fb4d0', 'center', '700');
  ctx.save();
  ctx.globalAlpha = 0.7 + Math.sin(world.time * 4) * 0.3;
  text(ctx, 'KLIK / TEKAN ENTER UNTUK MULAI', CANVAS_W / 2, 580, 26, '#ffd94d', 'center', '900');
  ctx.restore();
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(10,16,28,0.85)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SHIFT SELESAI!', CANVAS_W / 2, 200, 64, '#ffd94d', 'center', '900');
  text(ctx, 'Koin: ' + world.coins, CANVAS_W / 2, 300, 34, '#fff', 'center', '800');
  text(ctx, 'Order sukses: ' + world.served + '   •   Gagal: ' + world.failed, CANVAS_W / 2, 350, 24, '#dfe7f2', 'center', '700');
  const verdict = world.served >= 12 ? 'Koki legendaris! Semua order tersaji.' :
    world.served >= 8 ? 'Koki andalan warung — pelanggan pulang senang.' :
    world.served >= 4 ? 'Lumayan — dapur masih bisa lebih cepat.' :
    'Dapur kewalahan… coba lagi, koki!';
  text(ctx, verdict, CANVAS_W / 2, 410, 22, '#b6ff9e', 'center', '700');
  text(ctx, 'Tekan R untuk main lagi', CANVAS_W / 2, 500, 20, '#9fb4d0', 'center', '700');
}

// ---- entry utama ------------------------------------------------------------

export function renderWorld(ctx, world) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawFloorAndWall(ctx, world.time);
  drawFridge(ctx, world);
  drawBoard(ctx, world);
  drawWok(ctx, world, world.woks[0]);
  drawWok(ctx, world, world.woks[1]);
  drawPlateStation(ctx, world);
  drawServe(ctx, world);
  drawBin(ctx, world);
  drawPlayer(ctx, world);
  drawOrderBoard(ctx, world);
  drawFridgePicker(ctx, world);
  drawPopups(ctx, world);
  drawHint(ctx, world);
  if (world.state === 'title') drawTitle(ctx, world);
  if (world.state === 'over') drawGameOver(ctx, world);
}
