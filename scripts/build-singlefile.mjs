#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const defaultOut = path.resolve(ROOT, '../brotato_mini.html');

const argIdx = process.argv.indexOf('--out');
const outPath = argIdx !== -1 && process.argv[argIdx + 1]
  ? path.resolve(process.cwd(), process.argv[argIdx + 1])
  : defaultOut;

const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const stripQuery = u => u.split('?')[0];

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

// Inline SVG icon as data URI for offline standalone HTML
const svgRaw = fs.readFileSync(path.join(ROOT, 'assets/icon.svg'), 'utf8').trim();
const svgDataUri = `data:image/svg+xml,${encodeURIComponent(svgRaw)}`;

let bundled = indexHtml
  .replace(/^\s*<link\s+rel="manifest"\s+href="[^"]+"\s*>\r?\n/m, '')
  .replace(/<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="assets\/icon\.svg"\s*>/, `<link rel="icon" type="image/svg+xml" href="${svgDataUri}">`)
  .replace(/<link\s+rel="apple-touch-icon"\s+href="assets\/icon\.svg"\s*>/, `<link rel="apple-touch-icon" href="${svgDataUri}">`);

// Replace stylesheet links with inline <style>
bundled = bundled.replace(
  /(?:\s*<link\s+rel="stylesheet"\s+href="[^"]+"\s*>\r?\n)+/,
  `  <style>\n${combinedCss}\n  </style>\n`
);

// Replace script tags with inline <script>
bundled = bundled.replace(
  /\s*<!-- 模块化脚本[\s\S]*?-->\r?\n(?:\s*<script\s+defer\s+src="[^"]+"\s*><\/script>\r?\n)+/,
  `\n<script>\n${combinedJs}\n</script>\n`
);

fs.writeFileSync(outPath, bundled, 'utf8');
console.log(`Bundled standalone single-file HTML -> ${outPath} (${(bundled.length / 1024).toFixed(1)} KB)`);
