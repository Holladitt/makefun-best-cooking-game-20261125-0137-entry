// WOK RUSH — main.ts
// Program penyerahan entry (Node 22, stdlib saja): menyalin game/ dan
// screenshots/ dari repo ke direktori output lalu menulis dossier.json
// dengan buildDossier dari vendor/makefun-game.ts (copy kit, tidak diubah).
// Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan /output.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = new URL('.', import.meta.url).pathname;
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('WOK RUSH dossier written: ' + join(outDir, 'dossier.json'));
