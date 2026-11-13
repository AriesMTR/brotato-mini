#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const defaultOut = path.join(ROOT, '烬塔残响_单文件离线版.html');

const argIdx = process.argv.indexOf('--out');
const outPath = argIdx !== -1 && process.argv[argIdx + 1]
  ? path.resolve(process.cwd(), process.argv[argIdx + 1])
  : defaultOut;

const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const stripQuery = u => u.split('?')[0];

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg'
};

function toDataUri(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  if (ext === '.svg') {
    const svgRaw = fs.readFileSync(absPath, 'utf8').trim();
    return `data:image/svg+xml,${encodeURIComponent(svgRaw)}`;
  }
  const mime = MIME_BY_EXT[ext] || 'application/octet-stream';
  return `data:${mime};base64,${fs.readFileSync(absPath).toString('base64')}`;
}

// Build window.__SPIRE_INLINE_ASSETS__ map for full offline file:// support
const inlineAssets = {};
if (fs.existsSync(path.join(ROOT, 'assets/icon.png'))) {
  inlineAssets['assets/icon.png'] = toDataUri(path.join(ROOT, 'assets/icon.png'));
}
if (fs.existsSync(path.join(ROOT, 'assets/icon.svg'))) {
  inlineAssets['assets/icon.svg'] = toDataUri(path.join(ROOT, 'assets/icon.svg'));
}
for (const subDir of ['assets/spire', 'assets/audio']) {
  const absDir = path.join(ROOT, subDir);
  if (!fs.existsSync(absDir)) continue;
  for (const name of fs.readdirSync(absDir).sort()) {
    const abs = path.join(absDir, name);
    if (!fs.statSync(abs).isFile()) continue;
    const ext = path.extname(name).toLowerCase();
    if (!MIME_BY_EXT[ext]) continue;
    inlineAssets[`${subDir}/${name}`] = toDataUri(abs);
  }
}

// Collect all CSS <link rel="stylesheet" href="...">
const cssLinks = [...indexHtml.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*>/g)];
if (!cssLinks.length) throw new Error('No stylesheet links found in index.html');
const combinedCss = cssLinks
  .map(m => fs.readFileSync(path.join(ROOT, stripQuery(m[1])), 'utf8').trim())
  .join('\n\n')
  .split('\n')
  .map(l => (l.length ? `  ${l}` : ''))
  .join('\n');

// Collect all <script defer src="...">
const scriptTags = [...indexHtml.matchAll(/<script\s+defer\s+src="([^"]+)"\s*><\/script>/g)];
if (!scriptTags.length) throw new Error('No deferred script tags found in index.html');
const combinedJs = scriptTags
  .map(m => fs.readFileSync(path.join(ROOT, stripQuery(m[1])), 'utf8').trim())
  .join('\n\n');

let bundled = indexHtml
  .replace(/^\s*<link\s+rel="manifest"\s+href="[^"]+"\s*>\r?\n/m, '');

// Replace any static src="assets/..." or href="assets/..." in HTML with inline data URIs
bundled = bundled.replace(/\b(src|href)="(assets\/[^"]+)"/g, (full, attr, rawRef) => {
  const cleanRef = stripQuery(rawRef);
  if (inlineAssets[cleanRef]) {
    return `${attr}="${inlineAssets[cleanRef]}"`;
  }
  const abs = path.join(ROOT, cleanRef);
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
    return `${attr}="${toDataUri(abs)}"`;
  }
  return full;
});

// Replace stylesheet links with inline <style>
bundled = bundled.replace(
  /(?:\s*<link\s+rel="stylesheet"\s+href="[^"]+"\s*>\r?\n)+/,
  `  <style>\n${combinedCss}\n  </style>\n`
);

// Replace script tags with inline asset registry + combined JS <script>
const inlineAssetsScript = `<script id="spire-inline-assets-v240">\nwindow.__SPIRE_INLINE_ASSETS__ = ${JSON.stringify(inlineAssets)};\n</script>`;
const scriptBlockRegex = /(?:\s*<!--[^\n]*脚本[^\n]*-->\r?\n)?(?:\s*<script\s+defer\s+src="[^"]+"\s*><\/script>\r?\n)+/;
if (!scriptBlockRegex.test(bundled)) {
  throw new Error('Failed to locate deferred script block in index.html for replacement');
}
bundled = bundled.replace(
  scriptBlockRegex,
  `\n${inlineAssetsScript}\n<script>\n${combinedJs}\n</script>\n`
);

fs.writeFileSync(outPath, bundled, 'utf8');
console.log(`Bundled standalone single-file HTML -> ${outPath} (${(bundled.length / (1024 * 1024)).toFixed(2)} MB, ${Object.keys(inlineAssets).length} inline assets)`);
