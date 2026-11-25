// WOK RUSH — shots.js
// Staging deterministik untuk screenshot: memainkan aturan game sungguhan maju
// dari world segar dengan seed tetap (bukan scene palsu di luar loop game).
// ?shot=cover | rush | serve. Setiap staging memakai fungsi dunia yang sama
// dengan yang dipakai pemain: ambil bahan, potong, masak, plating, saji.

import { STATIONS, INGREDIENT_ORDER } from './config.js';
import {
  SHOT_SEED, createWorld, startShift, spawnOrder, pickIngredient,
  interactStation, updateWorld, stationCenter, addPopup,
} from './world.js';

function step(world, seconds) {
  const dt = 1 / 60;
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) updateWorld(world, dt, {});
}

function teleport(world, x, y) {
  world.player.x = x;
  world.player.y = y;
  world.player.moveTarget = null;
}

function atStation(world, stationId) {
  const c = stationCenter(STATIONS[stationId]);
  teleport(world, c.x, c.y + 110);
}

function useStation(world, stationId) {
  atStation(world, stationId);
  interactStation(world, stationId);
}

function take(world, ingId) {
  atStation(world, 'fridge');
  pickIngredient(world, ingId);
}

// Masak satu bahan sampai matang lalu taruh di piring plating.
function cookToPlate(world, ingId, wokId) {
  take(world, ingId);
  const needsChop = ingId === 'chicken' || ingId === 'beef' || ingId === 'veg' || ingId === 'cheese';
  if (needsChop) {
    useStation(world, 'board');
    step(world, 1.7);
    useStation(world, 'board'); // ambil hasil potongan
  }
  useStation(world, wokId);
  step(world, 6.5); // cukup untuk semua waktu masak
  useStation(world, wokId); // ambil hasil masakan
  useStation(world, 'plate');
}

// Sajikan satu order Mie Goreng Telur lengkap supaya koin dan statistik terisi.
function serveFirstOrder(world) {
  cookToPlate(world, 'noodle', 'wok1');
  cookToPlate(world, 'egg', 'wok2');
  useStation(world, 'plate'); // angkat piring lengkap
  useStation(world, 'serve'); // sajikan
}

function stageCover() {
  const world = createWorld(SHOT_SEED);
  startShift(world);
  spawnOrder(world, 'mie-telur');
  spawnOrder(world, 'nasi-ayam');
  spawnOrder(world, 'udang-tiram');
  serveFirstOrder(world);
  // Piring SIAP SAJI kedua: Nasi + Ayam (cocok dengan order #2).
  cookToPlate(world, 'rice', 'wok2');
  take(world, 'chicken');
  useStation(world, 'board');
  step(world, 1.7);
  useStation(world, 'board');
  useStation(world, 'wok1');
  step(world, 6.5);
  useStation(world, 'wok1');
  useStation(world, 'plate');
  // Wok 2: udang sedang dimasak (mengepul). Talenan: sayur sedang dipotong.
  take(world, 'shrimp');
  useStation(world, 'wok2');
  step(world, 3.0);
  take(world, 'veg');
  useStation(world, 'board');
  step(world, 0.8);
  // Koki memegang telur mentah, berdiri di tengah dapur.
  take(world, 'egg');
  teleport(world, 640, 560);
  return world;
}

function stageRush() {
  const world = createWorld(SHOT_SEED + 7);
  startShift(world);
  spawnOrder(world, 'mie-telur');
  spawnOrder(world, 'nasi-ayam');
  spawnOrder(world, 'udang-tiram');
  spawnOrder(world, 'omelet-keju');
  serveFirstOrder(world);
  // Piring setengah terisi: satu udang matang menunggu pasangan.
  cookToPlate(world, 'shrimp', 'wok1');
  // Wok 1: mie sedang dimasak. Wok 2: sapi sedang dimasak.
  take(world, 'noodle');
  useStation(world, 'wok1');
  step(world, 2.5);
  take(world, 'beef');
  useStation(world, 'board');
  step(world, 1.7);
  useStation(world, 'board');
  useStation(world, 'wok2');
  step(world, 3.5);
  // Talenan: ayam sedang dipotong. Koki memegang sayur mentah.
  take(world, 'chicken');
  useStation(world, 'board');
  step(world, 0.9);
  take(world, 'veg');
  teleport(world, 620, 520);
  return world;
}

function stageServe() {
  const world = createWorld(SHOT_SEED + 21);
  startShift(world);
  spawnOrder(world, 'mie-telur');
  spawnOrder(world, 'nasi-ayam');
  spawnOrder(world, 'udang-tiram');
  serveFirstOrder(world);
  // Rakit piring Nasi Goreng Ayam; sementara itu dapur tetap sibuk.
  cookToPlate(world, 'rice', 'wok1');
  take(world, 'chicken');
  useStation(world, 'board');
  step(world, 1.7);
  useStation(world, 'board');
  useStation(world, 'wok2');
  step(world, 6.5);
  useStation(world, 'wok2');
  useStation(world, 'plate');
  take(world, 'shrimp');
  useStation(world, 'wok1');
  step(world, 2.0);
  take(world, 'veg');
  useStation(world, 'board');
  step(world, 0.7);
  useStation(world, 'plate'); // angkat piring lengkap
  teleport(world, 1100, 625);
  addPopup(world, 850, 470, 'SIAP SAJI!', '#b6ff9e');
  return world;
}

export function stageShot(kind) {
  const world = kind === 'rush' ? stageRush() : kind === 'serve' ? stageServe() : stageCover();
  // Bersihkan hint sisa staging supaya tidak menutupi bar kontrol di screenshot.
  world.hint = '';
  world.hintUntil = 0;
  return world;
}

export const SHOT_KINDS = ['cover', 'rush', 'serve'];
export { INGREDIENT_ORDER };
