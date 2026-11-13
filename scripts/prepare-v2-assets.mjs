#!/usr/bin/env node
// Copy approved design atlases without resampling or altering their pixels.
// Generated clean backgrounds are versioned assets, with prompts recorded beside them.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const design = path.resolve(root, '../output/design');
const dest = path.join(root, 'assets/spire/v2');
fs.mkdirSync(dest, { recursive: true });
const copyMap = [
  ['revision-v2/images/01-awakening.png', 'awakening-atlas.png', 2, 2, 'cinematic-atlas'],
  ['revision-v2/images/02-qingyu.png', 'qingyu-atlas.png', 3, 1, 'cinematic-atlas'],
  ['revision-v2/images/03-jinyu-stages.png', 'jinyu-atlas.png', 2, 2, 'cinematic-atlas'],
  ['revision-v2/images/04-astria-stages.png', 'astria-atlas.png', 2, 2, 'cinematic-atlas'],
  ['revision-v2/images/05-jialan-stages.png', 'jialan-atlas.png', 2, 2, 'cinematic-atlas'],
  ['revision-v2/images/06-eclipse-stages.png', 'eclipse-atlas.png', 2, 2, 'cinematic-atlas'],
  ['revision-v2/images/07-dialogue-tension.png', 'dialogue-reference.png', 1, 1, 'design-reference-only'],
  ['revision-v2/images/08-player-defeat-final.png', 'player-defeat-reference.png', 1, 1, 'design-reference-only'],
  ['images/01-title.png', 'title-reference.png', 1, 1, 'design-reference-only'],
  ['images/02-preparation.png', 'preparation-reference.png', 1, 1, 'design-reference-only'],
  ['images/08-endings.png', 'endings-atlas.png', 2, 1, 'cinematic-atlas'],
];
function pngInfo(file) {
  const data = fs.readFileSync(file);
  if (data.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error('Expected PNG: ' + file);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), bytes: data.length,
    sha256: crypto.createHash('sha256').update(data).digest('hex') };
}
const assets = [];
for (const [source, file, columns, rows, role] of copyMap) {
  const src = path.join(design, source);
  const target = path.join(dest, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, target);
  else if (!fs.existsSync(target)) throw new Error('Missing approved design source: ' + src);
  const safe = columns === 3 ? [0.015, 0.006, 0.970, 0.875]
    : rows === 2 ? [0.012, 0.110, 0.976, 0.878]
    : columns === 2 ? [0.012, 0.065, 0.976, 0.923] : [0, 0, 1, 1];
  const entry = { file, url: 'assets/spire/v2/' + file, source: '../output/design/' + source,
    role, columns, rows, ...pngInfo(target) };
  if (role === 'cinematic-atlas') {
    entry.panelOrder = columns === 2 && rows === 2 ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : 'left-to-right';
    entry.safeRectWithinPanel = { x: safe[0], y: safe[1], width: safe[2], height: safe[3] };
    entry.note = 'Crop at render time to hide baked design labels and gutters; never show the whole atlas as one scene.';
  } else entry.note = 'Baked UI exists in this reference. Do not use as a production background.';
  assets.push(entry);
}
for (const file of ['title-clean.png', 'wind-pavilion.png', 'player-defeat-clean.png']) {
  const target = path.join(dest, file);
  if (!fs.existsSync(target)) throw new Error('Missing generated clean background: ' + target);
  assets.push({ file, url: 'assets/spire/v2/' + file, role: 'production-background',
    generatedWith: 'built-in image_gen', promptManifest: 'image-prompts.json', ...pngInfo(target) });
}
const manifest = { version: 2, artDirection: 'Cold Japanese animated-film cinematography, preserving the approved character designs.',
  usage: 'Use clean backgrounds for live UI; scene atlases only through their per-panel safe crop. Portraits remain assets/spire/port_*.jpg.',
  assets };
fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ assets: assets.length, totalBytes: assets.reduce((sum, a) => sum + a.bytes, 0), directory: dest }));
