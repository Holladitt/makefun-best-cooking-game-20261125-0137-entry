// WOK RUSH — random.js
// RNG deterministik (mulberry32) supaya staging screenshot dan replay selalu sama
// untuk seed yang sama. Semua acakan game lewat sini, bukan Math.random.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngRange(rng, min, max) {
  return min + rng() * (max - min);
}

export function rngInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function rngPick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function rngPickExcept(rng, list, exceptId) {
  const pool = list.filter((item) => item.id !== exceptId);
  return pool[Math.floor(rng() * pool.length)];
}
