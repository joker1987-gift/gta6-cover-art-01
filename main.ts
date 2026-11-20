// Neon Coast Cover Studio — make.fun entry program.
// Copies app/ and screenshots/ from this repository into the output
// directory and writes dossier.json there with the vendored library.
// The copy is a plain recursive walk in sorted order, so two runs over
// the same repository produce byte-identical output trees.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });

for (const name of ['app', 'screenshots']) {
  cpSync(join(here, name), join(outDir, name), { recursive: true });
}

// The dossier caps are the competition gate's own values: its text
// budget, at most four screenshots of at most 256 KiB each, and the
// app tree limits (993 entries, 48 MiB, 1,000-byte paths).
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const dossier = buildDossier(outDir, GATE_CAPS);

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
