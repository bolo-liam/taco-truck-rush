// Taco Truck Rush — hand-in program (Node 22, standard library only).
// It assembles the entry the grader reads: it copies this repository's
// game/ and screenshots/ into the output directory and writes the dossier
// the judge reads, using the vendored make.fun library. Run it locally as:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));

const shotsInRepo = join(repoRoot, 'screenshots');
const shotsOut = join(outputDir, 'screenshots');
mkdirSync(shotsOut, { recursive: true });
if (existsSync(shotsInRepo)) {
  const shots = readdirSync(shotsInRepo).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error('Expected 3 or 4 screenshots, found ' + shots.length);
  }
  cpSync(shotsInRepo, shotsOut, { recursive: true });
}

// Dossier caps mirror the gate: 160 KiB of source text, at most 4
// screenshots of 256 KiB, game/ under 993 files / 48 MiB, paths under
// 1000 bytes. buildDossier refuses anything over them.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
