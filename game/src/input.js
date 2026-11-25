// WOK RUSH — input.js
// Keyboard + mouse untuk game: WASD/panah gerak, E/Spasi aksi, 1-8 ambil bahan,
// klik stasiun = jalan ke sana lalu pakai, klik bahan di lemari = ambil.
// Mengembalikan snapshot per-frame yang dibaca world.update.

export function createInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false,
    interactQueued: false,
    numberQueued: null, // 0..7
    clickQueued: null, // { x, y }
    anyQueued: false,
  };

  const keyMap = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  function onKeyDown(e) {
    if (keyMap[e.code] !== undefined) {
      input[keyMap[e.code]] = true;
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyE' || e.code === 'Space') {
      input.interactQueued = true;
      input.anyQueued = true;
      e.preventDefault();
      return;
    }
    if (e.code.startsWith('Digit')) {
      const n = Number(e.code.slice(5));
      if (n >= 1 && n <= 8) {
        input.numberQueued = n - 1;
        input.anyQueued = true;
      }
      return;
    }
    if (e.code === 'Enter') {
      input.interactQueued = true;
      input.anyQueued = true;
    }
  }

  function onKeyUp(e) {
    if (keyMap[e.code] !== undefined) input[keyMap[e.code]] = false;
  }

  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.clickQueued = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    input.anyQueued = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  input.consumeClick = function consumeClick() {
    const c = input.clickQueued;
    input.clickQueued = null;
    return c;
  };

  input.consumeInteract = function consumeInteract() {
    const v = input.interactQueued;
    input.interactQueued = false;
    return v;
  };

  input.consumeNumber = function consumeNumber() {
    const v = input.numberQueued;
    input.numberQueued = null;
    return v;
  };

  input.consumeAny = function consumeAny() {
    const v = input.anyQueued;
    input.anyQueued = false;
    return v;
  };

  return input;
}

// Titik klik di dalam kotak stasiun? Dipakai main.js untuk memilih stasiun.
export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
