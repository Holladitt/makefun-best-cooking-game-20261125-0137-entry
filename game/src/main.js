// WOK RUSH — main.js
// Loop game + wiring: input -> world -> render. Juga mode screenshot (?shot=)
// yang memainkan staging deterministik lalu menggambar satu frame.
// Suara: beep WebAudio sintetis (tanpa file), dimatikan total dalam mode shot.

import { CANVAS_W, CANVAS_H, STATIONS, INGREDIENT_ORDER } from './config.js';
import {
  createWorld, startShift, updateWorld, interactStation, pickIngredient,
  nearestStation, stationCenter,
} from './world.js';
import { renderWorld } from './render.js';
import { createInput, pointInRect } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const params = new URLSearchParams(window.location.search);
const shotKind = params.get('shot');

// ---- suara (opsional, sintetis) --------------------------------------------
let audioCtx = null;
function beep(freq, dur) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) { /* suara gagal: game tetap jalan */ }
}

// ---- mode screenshot ---------------------------------------------------------
if (shotKind) {
  const world = stageShot(shotKind);
  renderWorld(ctx, world);
  document.title = 'WOK RUSH — shot ' + shotKind;
  window.__wokRushShot = { kind: shotKind, coins: world.coins, served: world.served, orders: world.orders.length };
} else {
  // ---- mode main -----------------------------------------------------------
  const world = createWorld((Date.now() % 100000) | 0);
  try {
    const saved = Number(window.localStorage.getItem('wok-rush-best') || 0);
    if (saved > 0) world.best = saved;
  } catch (e) { /* abaikan */ }
  const input = createInput(canvas);

  let lastCoins = 0;
  let lastServed = 0;

  function handleClick(click) {
    if (!click) return;
    if (world.state === 'title') {
      startShift(world);
      beep(660, 0.12);
      return;
    }
    if (world.state === 'over') return;
    // Klik bahan di lemari (saat picker terbuka atau di area kulkas).
    if (world.fridgeOpen) {
      const s = STATIONS.fridge;
      for (let i = 0; i < INGREDIENT_ORDER.length; i++) {
        const ix = s.x + s.w + 42 + i * 42;
        const iy = s.y + 62;
        if (click.x >= ix - 18 && click.x <= ix + 18 && click.y >= iy - 26 && click.y <= iy + 36) {
          if (pickIngredient(world, INGREDIENT_ORDER[i])) beep(520, 0.08);
          return;
        }
      }
    }
    // Klik ikon bahan di dalam kulkas.
    const fr = STATIONS.fridge;
    if (pointInRect(click.x, click.y, fr)) {
      for (let i = 0; i < INGREDIENT_ORDER.length; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const ix = fr.x + 32 + col * 44;
        const iy = fr.y + 62 + row * 72;
        if (Math.hypot(click.x - ix, click.y - iy) < 24) {
          if (pickIngredient(world, INGREDIENT_ORDER[i])) beep(520, 0.08);
          return;
        }
      }
    }
    // Klik stasiun: jalan ke sana, lalu pakai.
    for (const key of Object.keys(STATIONS)) {
      const s = STATIONS[key];
      if (pointInRect(click.x, click.y, s)) {
        const c = stationCenter(s);
        world.player.moveTarget = { x: c.x, y: c.y + 110 };
        world.player.moveTargetStation = key;
        return;
      }
    }
    // Klik di lantai kosong: jalan ke sana.
    world.player.moveTarget = { x: click.x, y: click.y };
    world.player.moveTargetStation = null;
  }

  function handleKeys() {
    const num = input.consumeNumber();
    if (num !== null && world.state === 'playing') {
      if (pickIngredient(world, INGREDIENT_ORDER[num])) beep(520, 0.08);
    }
    if (input.consumeInteract()) {
      if (world.state === 'title') {
        startShift(world);
        beep(660, 0.12);
        return;
      }
      if (world.state === 'playing') {
        const station = nearestStation(world, world.player.x, world.player.y, 170);
        if (station) {
          interactStation(world, station.id);
          beep(440, 0.06);
        }
      }
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && (world.state === 'over' || world.state === 'title')) {
      const fresh = createWorld((Date.now() % 100000) | 0);
      fresh.best = world.best;
      Object.assign(world, fresh);
      startShift(world);
    }
    if (e.code === 'Escape') world.fridgeOpen = false;
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    handleKeys();
    handleClick(input.consumeClick());
    if (world.state === 'playing') {
      const before = world.coins;
      updateWorld(world, dt, input);
      if (world.coins > before) beep(880, 0.15);
      if (world.served > lastServed) lastServed = world.served;
      if (world.coins !== lastCoins) lastCoins = world.coins;
      if (world.state === 'over') {
        try {
          if (world.coins > world.best) {
            window.localStorage.setItem('wok-rush-best', String(world.coins));
          }
        } catch (e) { /* abaikan */ }
      }
    } else {
      // Layar judul tetap hidup (lampu berkelip) tanpa jalan aturan.
      world.time += dt;
    }
    renderWorld(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
