import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runStoryV2Suite, V21_CINEMATIC_FILES } from './story-v2.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const rawCssRefs = [...indexHtml.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*>/g)].map(m => m[1]);
const rawJsRefs = [...indexHtml.matchAll(/<script\s+defer\s+src="([^"]+)"\s*><\/script>/g)].map(m => m[1]);
assert(rawCssRefs.every(r => r.includes("?v=")), "All stylesheet links in index.html must carry ?v= cache-busting query string");
assert(rawJsRefs.every(r => r.includes("?v=")), "All deferred script tags in index.html must carry ?v= cache-busting query string");
const packageVersion = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
assert([...rawCssRefs, ...rawJsRefs].every(ref => new URL(ref, 'https://local.invalid').searchParams.get('v') === packageVersion),
  'Every stylesheet/module cache key must match the release version');
const cssFiles = rawCssRefs.map(r => r.split("?")[0]);
const jsFiles = rawJsRefs.map(r => r.split("?")[0]);

assert.strictEqual(new Set(cssFiles).size, cssFiles.length, "Stylesheets must not load twice");
assert.strictEqual(new Set(jsFiles).size, jsFiles.length, "Game modules must not load twice");
for (const rel of ['styles/base.css', 'styles/mobile.css', 'styles/presentation.css', 'styles/narrative.css']) {
  assert(cssFiles.includes(rel), 'Missing required stylesheet: ' + rel);
}
for (const rel of ['src/core/env.js', 'src/data/story-v2.js', 'src/game/director.js', 'src/ui/menus.js',
  'src/ui/presentation.js', 'src/game/combat.js', 'src/game/spawner.js', 'src/game/update.js', 'src/ui/shop.js', 'src/render/renderer.js']) {
  assert(jsFiles.includes(rel), 'Missing required module: ' + rel);
}
assert(jsFiles.indexOf('src/data/story-v2.js') < jsFiles.indexOf('src/game/director.js'), 'Story data must load before its director');

for (const rel of [...cssFiles, ...jsFiles, "manifest.json", "assets/icon.svg"]) {
  assert(fs.existsSync(path.join(ROOT, rel)), "Missing modular project file: " + rel);
}

const cssCombined = cssFiles.map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n");
const code = jsFiles.map(f => {
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  new vm.Script(src, { filename: f });
  return src;
}).join("\n\n");
const html = indexHtml + "\n<style>\n" + cssCombined + "\n</style>";

new vm.Script(code, { filename: "spire_modular_bundle.js" });

function readJpegPngDims(absPath) {
  const buf = fs.readFileSync(absPath);
  // PNG signature
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), fmt: "png" };
  }
  // JPEG SOF0/SOF2 scan
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) { off++; continue; }
      const marker = buf[off + 1];
      if (marker === 0xff) { off++; continue; }
      if (marker === 0xd8 || marker === 0xd9) { off += 2; continue; }
      const segLen = buf.readUInt16BE(off + 2);
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { h: buf.readUInt16BE(off + 5), w: buf.readUInt16BE(off + 7), fmt: "jpg" };
      }
      off += 2 + segLen;
    }
  }
  throw new Error("Unsupported image header: " + absPath);
}

function makeCtx(stats, drawCalls = null) {
  return new Proxy({
    arc(x, y, r) {
      if (typeof r !== "number" || Number.isNaN(r) || r < 0) {
        throw new Error(`IndexSizeError: arc radius (${r}) is negative or NaN.`);
      }
    },
    ellipse(x, y, rx, ry) {
      if (typeof rx !== "number" || typeof ry !== "number" || Number.isNaN(rx) || Number.isNaN(ry) || rx < 0 || ry < 0) {
        throw new Error(`IndexSizeError: ellipse radii (${rx}, ${ry}) invalid.`);
      }
    },
    drawImage(img, ...args) {
      if (!img) throw new Error("TypeError: drawImage called with null image");
      for (const v of args) {
        if (typeof v !== "number" || !Number.isFinite(v)) {
          throw new Error(`TypeError: drawImage numeric arg invalid: ${v}`);
        }
      }
      if (args.length === 8 && typeof img.width === "number" && typeof img.height === "number" && img.width > 0 && img.height > 0) {
        const [sx, sy, sw, sh, , , dw, dh] = args;
        if (sx < -0.01 || sy < -0.01 || sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0 || sx + sw > img.width + 0.01 || sy + sh > img.height + 0.01) {
          throw new Error(`IndexSizeError: drawImage source out of bounds (${sx},${sy},${sw},${sh}) vs (${img.width}x${img.height})`);
        }
      }
      if (drawCalls) drawCalls.push({ img, args });
    },
    createRadialGradient: () => {
      if (stats) stats.radialGradients++;
      return { addColorStop() {} };
    },
    createLinearGradient: () => ({ addColorStop() {} }),
    measureText: txt => ({ width: Math.max(12, String(txt || "").length * 14) })
  }, {
    get(target, prop) { return prop in target ? target[prop] : () => {}; },
    set(target, prop, val) {
      if (stats && prop === "shadowBlur" && val > 0) stats.shadowBlurs++;
      target[prop] = val;
      return true;
    }
  });
}

function makeEl(tag = "div", stats = null, drawCalls = null, owner = null) {
  const listeners = {};
  const children = [];
  let ownText = '';
  const el = {
    tagName: tag.toUpperCase(), nodeType: 1, parentNode: null, parentElement: null,
    width: tag.toLowerCase() === "canvas" ? 300 : undefined,
    height: tag.toLowerCase() === "canvas" ? 150 : undefined,
    style: { setProperty(k, v) { this[k] = String(v); }, getPropertyValue(k) { return this[k] || ''; }, removeProperty(k) { delete this[k]; } },
    dataset: {}, children, childNodes: children, scrollTop: 0, scrollHeight: 200,
    disabled: false, hidden: false, checked: false, value: '', href: '', download: '', _html: '', _attrs: {}, _src: '',
    complete: false, naturalWidth: 0, naturalHeight: 0,
    get src() { return this._src; },
    set src(value) {
      this._src = String(value || '');
      if (this.tagName !== 'IMG') return;
      const dims = owner && owner.assetDimsMap[this._src.split('?')[0]];
      this.complete = !!dims; this.naturalWidth = dims ? dims.w : 0; this.naturalHeight = dims ? dims.h : 0;
      if (dims) this.dispatch('load');
    },
    get id() { return this._attrs.id || ''; },
    set id(v) { this._attrs.id = String(v); if (owner) owner.els[String(v)] = this; },
    get innerHTML() { return this._html; },
    set innerHTML(v) {
      this._html = String(v); ownText = ''; this.replaceChildren();
      const stack = [this];
      const tokens = this._html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || [];
      const voidTags = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
      for (const token of tokens) {
        if (token.startsWith('<!--') || token.startsWith('<!')) continue;
        if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
        if (token.startsWith('<')) {
          const m = token.match(/^<([\w-]+)/); if (!m) continue;
          const child = makeEl(m[1], m[1] === 'canvas' ? stats : null, drawCalls, owner);
          const attrs = token.slice(m[0].length, -1);
          for (const x of attrs.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) child.setAttribute(x[1], x[2] ?? x[3] ?? x[4] ?? '');
          stack[stack.length - 1].appendChild(child);
          if (!voidTags.test(m[1]) && !token.endsWith('/>')) stack.push(child);
        } else stack[stack.length - 1]._appendText(token.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' '));
      }
    },
    get textContent() { return ownText + children.map(c => c.textContent || '').join(''); },
    set textContent(v) { this.replaceChildren(); ownText = String(v ?? ''); this._html = ownText; },
    _appendText(v) { ownText += v; },
    get className() { return Array.from(this.classList._s).join(' '); },
    set className(v) { this.classList._s = new Set(String(v || '').split(/\s+/).filter(Boolean)); },
    classList: {
      _s: new Set(), add(...c) { c.forEach(v => this._s.add(v)); }, remove(...c) { c.forEach(v => this._s.delete(v)); },
      contains(c) { return this._s.has(c); },
      toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }
    },
    get firstChild() { return children[0] || null; }, get firstElementChild() { return children[0] || null; },
    get lastChild() { return children[children.length - 1] || null; },
    get offsetParent() {
      let n = this; while (n) { if (n.hidden || n.classList.contains('hidden') || n.style.display === 'none') return null; n = n.parentNode; }
      return this.parentElement || null;
    },
    appendChild(ch) { if (ch.parentNode) ch.parentNode.removeChild(ch); ch.parentNode = this; ch.parentElement = this; children.push(ch); return ch; },
    append(...items) { items.forEach(ch => typeof ch === 'string' ? this._appendText(ch) : this.appendChild(ch)); },
    replaceChildren(...items) { for (const ch of [...children]) this.removeChild(ch); items.forEach(ch => this.appendChild(ch)); },
    removeChild(ch) { const i = children.indexOf(ch); if (i >= 0) children.splice(i, 1); ch.parentNode = null; ch.parentElement = null; return ch; },
    getAttribute(k) { if (k === 'class') return this.className || null; return Object.hasOwn(this._attrs, k) ? this._attrs[k] : null; },
    hasAttribute(k) { return this.getAttribute(k) !== null; },
    setAttribute(k, v) {
      const value = String(v); this._attrs[k] = value;
      if (k === 'id') this.id = value;
      else if (k === 'class') this.className = value;
      else if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      else if (['src', 'href', 'value', 'type', 'role', 'title', 'tabIndex'].includes(k)) this[k] = value;
      else if (k === 'hidden') this.hidden = true;
      else if (k === 'disabled') this.disabled = true;
      else if (k === 'checked') this.checked = true;
    },
    removeAttribute(k) { delete this._attrs[k]; if (k === 'hidden') this.hidden = false; if (k === 'disabled') this.disabled = false; },
    select() {}, focus() { if (owner && owner.document) owner.document.activeElement = this; }, blur() { if (owner && owner.document) owner.document.activeElement = owner.document.body; },
    click() { if (!this.disabled) this.dispatch('click', { detail: 0 }); },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }, contains(ch) { return ch === this || children.some(c => c.contains(ch)); },
    getBoundingClientRect() {
      const viewport = owner && owner.document && owner.document.defaultView;
      const width = this.width || (viewport && viewport.innerWidth) || (owner && owner.viewport.width) || 1440;
      const height = this.height || (viewport && viewport.innerHeight) || (owner && owner.viewport.height) || 900;
      return { left: 0, top: 0, right: width, bottom: height, width, height };
    },
    animate(keyframes, options = {}) {
      const animation = {
        target: this, keyframes, options, playState: 'running', currentTime: 0,
        effect: { target: this, getTiming: () => typeof options === 'number' ? { duration: options } : options },
        play() { this.playState = 'running'; }, pause() { this.playState = 'paused'; },
        cancel() { this.playState = 'idle'; this.currentTime = null; },
        finish() { this.playState = 'finished'; if (this.onfinish) this.onfinish(); }
      };
      if (owner) owner.animations.push(animation);
      return animation;
    },
    getAnimations() { return owner ? owner.animations.filter(a => a.target === this && a.playState !== 'idle') : []; },
    matches(sel) {
      return sel.split(',').some(raw => {
        let s = raw.trim().split(/\s+/).pop();
        for (const negated of s.matchAll(/:not\(([^)]+)\)/g)) if (this.matches(negated[1])) return false;
        s = s.replace(/:not\([^)]+\)/g, '');
        const tagMatch = s.match(/^[a-zA-Z][\w-]*/); if (tagMatch && this.tagName.toLowerCase() !== tagMatch[0].toLowerCase()) return false;
        const idMatch = s.match(/#([\w-]+)/); if (idMatch && this.id !== idMatch[1]) return false;
        for (const m of s.matchAll(/\.([\w-]+)/g)) if (!this.classList.contains(m[1])) return false;
        for (const m of s.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)) if (this.getAttribute(m[1]) === null || (m[2] && this.getAttribute(m[1]) !== m[2])) return false;
        return true;
      });
    },
    querySelectorAll(sel) { const out = []; function visit(n) { for (const c of n.children) { if (c.matches(sel)) out.push(c); visit(c); } } visit(this); return out; },
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
    closest(sel) { let n = this; while (n) { if (n.matches(sel)) return n; n = n.parentNode; } return null; },
    _listeners: listeners,
    addEventListener(ev, fn, options) { (listeners[ev] = listeners[ev] || []).push({ fn, capture: options === true || !!(options && options.capture) }); },
    removeEventListener(ev, fn) { listeners[ev] = (listeners[ev] || []).filter(record => record.fn !== fn); },
    dispatch(ev, obj = {}) {
      const e = Object.assign({ type: ev, target: this, currentTarget: this, bubbles: !['load', 'error', 'focus', 'blur', 'scroll'].includes(ev),
        preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this._stop = true; },
        stopImmediatePropagation() { this._stop = this._immediate = true; } }, obj);
      const ancestors = []; for (let n = this.parentNode; n; n = n.parentNode) ancestors.push(n);
      const deliver = (node, capture) => {
        e.currentTarget = node;
        for (const record of node._listeners[ev] || []) {
          if (record.capture !== capture) continue;
          record.fn(e); if (e._immediate) break;
        }
        if (!capture && !e._immediate && typeof node['on' + ev] === 'function') node['on' + ev](e);
      };
      for (const ancestor of [...ancestors].reverse()) { deliver(ancestor, true); if (e._stop) return !e.defaultPrevented; }
      deliver(this, true); if (!e._immediate) deliver(this, false);
      if (e.bubbles && !e._stop) for (const ancestor of ancestors) { deliver(ancestor, false); if (e._stop) break; }
      return !e.defaultPrevented;
    },
    dispatchEvent(e) { return this.dispatch(e.type, e); },
    getContext: () => makeCtx(stats, drawCalls), scrollIntoView() {}, setPointerCapture() {}, releasePointerCapture() {}
  };
  return el;
}

// Measure real asset dimensions once so MockImage mirrors real disk images!
const assetDimsMap = {};
const spireAssetsDir = path.join(ROOT, "assets/spire");
function collectAssetDimensions(dir) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) collectAssetDimensions(abs);
    else if (/\.(png|jpg|jpeg)$/i.test(name)) assetDimsMap[path.relative(ROOT, abs).split(path.sep).join('/')] = readJpegPngDims(abs);
  }
}
collectAssetDimensions(spireAssetsDir);

function createEnv(mobile, w, h, dprVal = 2, audioMode = "running", preferences = {}) {
  const els = {};
  const animations = [];
  const owner = { els, document: null, animations, assetDimsMap, viewport: { width: w, height: h } };
  const stored = new Map();
  const localStorage = { getItem: k => stored.has(k) ? stored.get(k) : null,
    setItem: (k, v) => stored.set(String(k), String(v)), removeItem: k => stored.delete(k), clear: () => stored.clear() };
  const stats = { radialGradients: 0, shadowBlurs: 0, downloads: [], clipboardText: "", oscStarted: 0 };
  const directorDraws = [];
  const gameDraws = [];
  const winListeners = {};
  const animationFrames = new Map(); let nextAnimationFrame = 0;
  let nowClock = 1000;

  class MockImage {
    constructor() {
      this.complete = false;
      this.naturalWidth = 0;
      this.naturalHeight = 0;
      this.width = 0;
      this.height = 0;
      this.onload = null;
      this.onerror = null;
      this._src = "";
    }
    set src(val) {
      this._src = String(val || "");
      const clean = this._src.split("?")[0];
      const d = assetDimsMap[clean] || (clean.includes("_sheet") ? { w: 1024, h: 256 } : (clean.includes("port_") ? { w: 550, h: 768 } : (clean.includes("cut_") || clean.includes("vista") ? { w: 1376, h: 768 } : { w: 256, h: 256 })));
      this.naturalWidth = d.w;
      this.naturalHeight = d.h;
      this.width = d.w;
      this.height = d.h;
      this.complete = true;
      if (typeof this.onload === "function") this.onload();
    }
    get src() { return this._src; }
  }

  class MockAudioContext {
    constructor() {
      this.state = audioMode === "suspended" ? "suspended" : "running";
      this.currentTime = 0;
      this.destination = {};
    }
    resume() {
      if (audioMode === "reject") return Promise.reject(new Error("NotAllowedError"));
      this.state = "running";
      return Promise.resolve();
    }
    createOscillator() {
      if (this.state !== "running") throw new Error("AudioContext not running!");
      return {
        type: "sine",
        frequency: {
          setValueAtTime(v) { if (!Number.isFinite(v) || v <= 0) throw new Error("Invalid freq: " + v); },
          exponentialRampToValueAtTime() {}
        },
        connect() {},
        start() { stats.oscStarted++; },
        stop() {}
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime(v) { if (!Number.isFinite(v) || v <= 0) throw new Error("Invalid gain: " + v); },
          exponentialRampToValueAtTime(v) { if (!Number.isFinite(v) || v <= 0) throw new Error("Invalid ramp gain: " + v); },
          linearRampToValueAtTime() {}
        },
        connect() {}
      };
    }
  }

  const sandbox = {
    Math, Date, Object, Array, Set, Map, Number, String, Boolean, JSON, Error, Promise, RegExp, console,
    parseInt, parseFloat, isNaN, isFinite,
    localStorage,
    matchMedia: query => ({ matches: query.includes('pointer') ? mobile : query.includes('reduced-motion') && !!preferences.reducedMotion, addEventListener() {}, removeEventListener() {} }),
    getComputedStyle: el => el.style,
    Image: MockImage,
    setTimeout: fn => { fn(); return 1; },
    clearTimeout: () => {},
    Blob: class Blob { constructor(parts, opts) { this.parts = parts; this.opts = opts; } },
    URL: { createObjectURL: () => "blob:mock-log-url", revokeObjectURL: () => {} },
    performance: { now: () => nowClock },
    _advanceClock: ms => { nowClock += ms; return nowClock; },
    requestAnimationFrame: fn => { const id = ++nextAnimationFrame; animationFrames.set(id, fn); return id; },
    cancelAnimationFrame: id => animationFrames.delete(id),
    _flushAnimationFrame: () => { const batch = [...animationFrames.values()]; animationFrames.clear(); batch.forEach(fn => fn(nowClock)); },
    navigator: {
      userAgent: mobile ? "MockMobileSafari/17.0" : "MockDesktopChrome/125.0",
      maxTouchPoints: mobile ? 5 : 0,
      clipboard: { writeText: txt => { stats.clipboardText = txt; return Promise.resolve(); } }
    },
    window: {
      innerWidth: w || (mobile ? 390 : 1440),
      innerHeight: h || (mobile ? 844 : 900),
      devicePixelRatio: dprVal,
      AudioContext: MockAudioContext,
      localStorage,
      matchMedia: query => ({ matches: query.includes('pointer') ? mobile : query.includes('reduced-motion') && !!preferences.reducedMotion, addEventListener() {}, removeEventListener() {} }),
      addEventListener(ev, fn, capture) { (winListeners[ev] = winListeners[ev] || []).push({ fn, capture: capture === true || !!(capture && capture.capture) }); },
      removeEventListener(ev, fn) { winListeners[ev] = (winListeners[ev] || []).filter(r => r.fn !== fn); },
      dispatch(ev, obj = {}) {
        const e = Object.assign({ type: ev, target: null, preventDefault() { this.defaultPrevented = true; },
          stopPropagation() { this._stop = true; }, stopImmediatePropagation() { this._stop = this._immediate = true; } }, obj);
        for (const record of [...(winListeners[ev] || [])].sort((a,b) => Number(b.capture) - Number(a.capture))) {
          record.fn(e); if (e._immediate) break;
        }
      }
    },
    document: {
      hidden: false,
      body: makeEl("body", null, null, owner),
      documentElement: makeEl("html", null, null, owner),
      activeElement: null,
      _docListeners: {},
      execCommand: () => true,
      addEventListener(ev, fn) { (this._docListeners[ev] = this._docListeners[ev] || []).push(fn); },
      dispatch(ev, obj) { (this._docListeners[ev] || []).forEach(fn => fn(obj)); },
      getElementById(id) {
        return els[id] || null;
      },
      querySelector(sel) { return this.body.querySelector(sel); },
      querySelectorAll(sel) { return this.body.querySelectorAll(sel); },
      createElement(tag) {
        const el = makeEl(tag, null, null, owner);
        if (tag === "a") {
          el.click = function () { stats.downloads.push({ href: this.href, download: this.download }); };
        }
        return el;
      }
    }
  };
  owner.document = sandbox.document;
  sandbox.document.body.innerHTML = indexHtml;
  sandbox.document.activeElement = sandbox.document.body;
  sandbox.document.defaultView = sandbox.window;
  sandbox.window.document = sandbox.document;
  const visualListeners = {};
  sandbox.window.visualViewport = {
    _width: null, _height: null, scale: 1, offsetLeft: 0, offsetTop: 0,
    get width() { return this._width ?? sandbox.window.innerWidth; }, set width(v) { this._width = v; },
    get height() { return this._height ?? sandbox.window.innerHeight; }, set height(v) { this._height = v; },
    addEventListener(type, fn) { (visualListeners[type] = visualListeners[type] || []).push(fn); },
    removeEventListener(type, fn) { visualListeners[type] = (visualListeners[type] || []).filter(item => item !== fn); },
    dispatch(type) { for (const fn of visualListeners[type] || []) fn({ type }); }
  };
  // The game canvas is the only drawing surface whose performance calls count.
  els.cv.getContext = () => makeCtx(stats, gameDraws);
  sandbox.globalThis = sandbox;
  if (mobile) sandbox.window.ontouchstart = null;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  vm.runInContext(`
    function __primeTrueEnding() {
      for (const key of ['jinyu','astria','jialan','qingyu']) { grantSpireMemento(key); rememberSpireMemento(key); }
    }
    function __drainDirector(preferred = 'refuse') {
      const visited = [];
      for (let guard = 0; guard < 300 && SpireDirector.isActive(); guard++) {
        const current = SpireDirector.getState();
        const sceneImage = document.querySelector('.story-scene-image');
        visited.push({ eventId: current.eventId, text: current.text, kind: current.kind,
          artPath: current.artPath, artFormat: current.artFormat, artScale: current.artScale,
          cameraMaxScale: current.cameraMaxScale, renderedImageWidth: sceneImage ? parseFloat(sceneImage.style.width) : 0 });
        if (current.choices && current.choices.length) {
          const available = current.choices.filter(c => !c.disabled && c.enabled !== false);
          const option = available.find(c => c.id === preferred || String(c.id).endsWith('.' + preferred)) ||
            available.find(c => /continue|proceed|ready|enter|confirm/.test(c.id)) ||
            available.find(c => c.id === 'back') || available[0];
          if (!option) throw new Error('No enabled narrative option at ' + current.eventId);
          if (SpireDirector.choose(option.id) === false) throw new Error('Narrative option rejected: ' + option.id);
        } else SpireDirector.advanceOrSkip(true);
      }
      if (SpireDirector.isActive()) throw new Error('Narrative did not finish within 300 events: ' + JSON.stringify(SpireDirector.getState()));
      return visited;
    }
    function __spawnPendingBoss() {
      player.weapons = []; player.hp = player.maxHp = 99999;
      for (let k = 0; k < 30; k++) update(0.05);
      return enemies.find(e => e.type === 'boss');
    }
    function __defeatStoryBoss() {
      const boss = __spawnPendingBoss();
      if (!boss) throw new Error('Missing story boss on floor ' + wave);
      hurtEnemy(boss, boss.maxHp + 99999, true);
      __drainDirector();
      if (boss.storyStage !== 2 || boss.hp <= 0) throw new Error('Boss did not enter phase two');
      hurtEnemy(boss, boss.maxHp + 99999, true);
      if (wave < MAX_WAVE) {
        if (state !== 'wave' || !spireFloorFlow.bossDefeated) {
          throw new Error('Early story boss defeat on floor ' + wave + ' must keep wave active to farm mobs');
        }
        finishWave();
      }
      __drainDirector();
      return boss;
    }
  `, sandbox);
  return { sandbox, els, stats, directorDraws, gameDraws, animations };
}

// ============================================================================
// Suite 1: 16-Floor Fixed Non-Random Boss Architecture & Scene Progression
// ============================================================================
{
  const { sandbox: s } = createEnv(false, 1440, 900, 2);
  assert.strictEqual(vm.runInContext("APP_VERSION", s), `v${packageVersion}`, "APP_VERSION must identify the current release");
  assert.strictEqual(vm.runInContext("MAX_WEAPON_TIER", s), 5, "MAX_WEAPON_TIER must be 5");
  assert.strictEqual(vm.runInContext("MAX_WAVE", s), 16, "MAX_WAVE must be strictly 16 floors");
  assert.strictEqual(vm.runInContext("menuStage", s), "home", "Game must boot onto clean Main Title Screen (menuStage === 'home')");
  assert.strictEqual(vm.runInContext("bootIntegrityPassed && document.getElementById('bootGate').classList.contains('hidden') && SpireBootGate.verifyModules().ok", s), true, "SpireBootGate must verify all 20 modules and hide #bootGate once ready");
  assert.strictEqual(vm.runInContext(`(() => {
    bootIntegrityPassed = false;
    player = null;
    startGame('allrounder', { mode: 'story' });
    const blocked = (player === null && state === 'menu');
    bootIntegrityPassed = true;
    return blocked;
  })()`, s), true, "SpireBootGate must block startGame() when bootIntegrityPassed is false");

  // Verify v2.1.2: 32 weapons x 2 evolutions = 64 unique evolutions, T4+T4 -> T5 merge + 2-choice evolution modal,
  // HD baked sprites across all 32 weapons, softened W1-W5 early difficulty with preserved 2.0x late cap,
  // boosted melee base damage, MONSTER_SPD_MUL = 0.80, RANGED_ENEMY_COUNT_MUL = 0.80, stick range >= 130, and Retina floorBakeScale >= 1.60
  const v140Audit = vm.runInContext(`(() => {
    const wIds = Object.keys(WEAPONS);
    if (wIds.length !== 32) return { ok: false, reason: 'Expected 32 weapons, got ' + wIds.length };
    const evoIds = new Set();
    for (const id of wIds) {
      const w = WEAPONS[id];
      if (!Array.isArray(w.evos) || w.evos.length !== 2) return { ok: false, reason: 'Weapon missing 2 evos: ' + id };
      for (const ev of w.evos) {
        if (!ev.id || !ev.name || !ev.desc || !ev.color || evoIds.has(ev.id)) return { ok: false, reason: 'Bad/dup evo on ' + id };
        evoIds.add(ev.id);
        const cv = getBakedWeaponSprite(id, 5, ev.id);
        if (!cv || cv.width !== 192 || cv.height !== 192) return { ok: false, reason: 'Failed HD sprite bake for ' + id };
      }
    }
    if (evoIds.size !== 64) return { ok: false, reason: 'Expected 64 unique evolutions, got ' + evoIds.size };
    if (!(getMidLateWaveHpMul(1) < 0.80 && getMidLateWaveHpMul(4) < 1.0 && getMidLateWaveHpMul(8) > 1.3 && getMidLateWaveHpMul(10) >= 1.90 && Math.abs(getMidLateWaveHpMul(16) - 3.0) <= 1e-6)) {
      return { ok: false, reason: 'Bad midLateHpMul curve' };
    }
    if (!(getMidLateWaveDmgMul(1) < 0.80 && getMidLateWaveDmgMul(4) < 1.0 && getMidLateWaveDmgMul(8) > 1.3 && getMidLateWaveDmgMul(10) >= 1.70 && Math.abs(getMidLateWaveDmgMul(16) - 2.45) <= 1e-6)) {
      return { ok: false, reason: 'Bad midLateDmgMul curve' };
    }
    if (MONSTER_HP_BASE_MUL !== 1.80 || BOSS_HP_MUL !== 4.80 || MONSTER_SPD_MUL !== 0.80 || RANGED_ENEMY_COUNT_MUL !== 0.80 || WEAPONS.stick.range < 130 || WEAPONS.stick.dmg < 18 || WEAPONS.katana.dmg < 30) {
      return { ok: false, reason: 'Bad v2.1.3 balance constants' };
    }
    const sheath = ITEMS.find(it => it.id === 'fox_parry_sheath');
    if (!sheath || sheath.tier !== 4 || sheath.maxCount !== 1) {
      return { ok: false, reason: 'Missing T4 unique melee deflect relic fox_parry_sheath' };
    }

    // Test T4 + T4 -> T5 merge & 2-choice evolution modal + multi-form elongated/oblique terrain blocks
    startGame('allrounder', { mode: 'endless' });
    __drainDirector();
    const seenForms = new Set();
    for (let sRun = 0; sRun < 6; sRun++) {
      spawnArenaTerrains();
      if (terrains.length < 4) return { ok: false, reason: 'Expected >=4 random terrain blocks, got ' + terrains.length };
      for (const tr of terrains) {
        if (tr.form) seenForms.add(tr.form);
        drawSingleTerrain(tr, true);
      }
    }
    if (seenForms.size < 3) return { ok: false, reason: 'Expected diverse elongated/oblique terrain forms, got ' + [...seenForms].join(',') };
    openShop(true);
    player.weapons = [makeWeapon('katana', 4), makeWeapon('katana', 4)];
    mergeSlot(0);
    const modalOpen = !document.getElementById('evoModal').classList.contains('hidden');
    const choiceCards = document.getElementById('evoChoices').children.length;
    applyWeaponEvolution(player.weapons[0], 1);
    checkPendingWeaponEvolutions();
    const modalClosed = document.getElementById('evoModal').classList.contains('hidden');
    const evolvedOk = player.weapons[0].tier === 5 && player.weapons[0].evo === WEAPONS.katana.evos[1].id;

    // Touchscreen desktop laptop should keep crisp Retina floorBakeScale >= 1.60 while strictly capping floorCanvas <= 3840px (<4096 GPU texture limit, zero flicker!)
    isTouch = true;
    setUIPref('desktop');
    const touchDesktopSharp = uiMode === 'desktop' && floorBakeScale >= 1.60 && floorCanvas.width <= 3840 && floorCanvas.height <= 3840;
    isTouch = false;
    setUIPref('auto');

    // Verify lowered initial volumes (BGM 28% / SFX 32%), volume step buttons, mute-all (including beep SFX), and #audioModal
    const initVolOk = Math.abs(AudioBank.bgmVol - 0.28) < 1e-6 && Math.abs(AudioBank.sfxVol - 0.32) < 1e-6 && !AudioBank.bgmMuted;
    openAudioModal();
    const audioModalOpened = isAudioModalOpen();
    adjustBgmVolume(-10);
    adjustSfxVolume(10);
    const steppedVolOk = Math.round(AudioBank.bgmVol * 100) === 18 && Math.round(AudioBank.sfxVol * 100) === 42 &&
      document.getElementById('bgmVolVal').textContent === '18%' && document.getElementById('sfxVolVal').textContent === '42%';
    toggleSpireAudio(); // mute all
    const mutedOk = AudioBank.bgmMuted === true && document.getElementById('hudAudioBtn').textContent.includes('🔇');
    resetAudioDefaults();
    closeAudioModal();
    const resetAudioOk = !isAudioModalOpen() && !AudioBank.bgmMuted && Math.round(AudioBank.bgmVol * 100) === 28 && Math.round(AudioBank.sfxVol * 100) === 32;

    return {
      ok: modalOpen && choiceCards === 2 && modalClosed && evolvedOk && touchDesktopSharp && initVolOk && audioModalOpened && steppedVolOk && mutedOk && resetAudioOk,
      reason: JSON.stringify({ modalOpen, choiceCards, modalClosed, evolvedOk, touchDesktopSharp, initVolOk, audioModalOpened, steppedVolOk, mutedOk, resetAudioOk })
    };
  })()`, s);
  assert.strictEqual(v140Audit.ok, true, "v1.4.0 audit failed: " + v140Audit.reason);

  // Verify across multiple runs AND D5 difficulty that Waves 1..16 follow exact Act scenes and fixed non-random Bosses
  const climbAudit = vm.runInContext(`(() => {
    const expectedScene = w => (w <= 4 ? 'foundry' : (w <= 8 ? 'glacier' : (w <= 12 ? 'wasteland' : 'desert')));
    const expectedBoss = { 4: 'butcher', 8: 'frost_queen', 12: 'void_weaver', 16: 'solar_seraph' };
    const expectedMini = { 6: 'glacial_valkyrie', 10: 'shadow_stalker', 14: 'iron_warden' };
    for (const dIdx of [0, 2, 5]) {
      selectedDiff = dIdx;
      selectedScene = 'random';
      startGame('allrounder');
      if (typeof SpireDirector !== 'undefined') __drainDirector();
      for (let w = 1; w <= 16; w++) {
        wave = w;
        if (w === 16) __primeTrueEnding();
        beginWave();
        if (typeof SpireDirector !== 'undefined') {
          __drainDirector();
        }
        if (curScene.id !== expectedScene(w)) return { ok: false, reason: 'Wrong scene on wave ' + w + ': ' + curScene.id };
        // Advance spawns so any queued boss/mini_boss materializes
        player.weapons = []; player.hp = 99999; player.maxHp = 99999;
        for (let k = 0; k < 30; k++) update(0.05);
        const bosses = enemies.filter(e => e.type === 'boss').map(e => e.variant);
        const minis = enemies.filter(e => e.type === 'mini_boss').map(e => e.variant);
        const specials = enemies.filter(e => e.type === 'special_boss').length + relics.length;
        if (specials > 0) return { ok: false, reason: 'Random special relic/boss appeared during story climb wave ' + w };
        if (expectedBoss[w]) {
          if (bosses.length !== 1 || bosses[0] !== expectedBoss[w]) {
            return { ok: false, reason: 'Wave ' + w + ' expected single fixed boss ' + expectedBoss[w] + ', got ' + JSON.stringify(bosses) };
          }
          if (!enemies.find(e => e.type === 'boss').canPhase2) {
            return { ok: false, reason: 'Wave 16 Final Boss solar_seraph must guarantee Phase 2 awakening' };
          }
        } else if (bosses.length !== 0) {
          return { ok: false, reason: 'Non-boss wave ' + w + ' spawned boss: ' + JSON.stringify(bosses) };
        }
        if (expectedMini[w] && diff.midElite) {
          if (diff.dualElite && w >= 10) {
            if (minis.length !== 2 || !minis.includes(expectedMini[w])) {
              return { ok: false, reason: 'Wave ' + w + ' D5 expected deterministic dual commander including ' + expectedMini[w] + ', got ' + JSON.stringify(minis) };
            }
          } else if (minis.length !== 1 || minis[0] !== expectedMini[w]) {
            return { ok: false, reason: 'Wave ' + w + ' expected fixed commander ' + expectedMini[w] + ', got ' + JSON.stringify(minis) };
          }
        } else if (minis.length !== 0) {
          return { ok: false, reason: 'Unexpected mini_boss on wave ' + w + ': ' + JSON.stringify(minis) };
        }
      }
    }
    // Defeating the final second phase is required; timer completion cannot bypass a boss.
    selectedDiff = 1;
    startGame('allrounder'); __drainDirector();
    wave = 12; beginWave(); __drainDirector();
    finishWave();
    if (state !== 'wave') return { ok: false, reason: 'Boss floor allowed timer victory' };
    __defeatStoryBoss();
    const stateAfter12 = state;
    wave = 16; __primeTrueEnding(); beginWave(); __drainDirector('refuse');
    __defeatStoryBoss();
    const stateAfter16 = state;
    return { ok: true, stateAfter12, stateAfter16 };
  })()`, s);

  assert.strictEqual(climbAudit.ok, true, climbAudit.reason || "16-floor climb audit failed");
  assert(["shop", "crate", "levelup"].includes(climbAudit.stateAfter12), "Floor 12 must proceed to rewards/shop, not end the run (got " + climbAudit.stateAfter12 + ")");
  assert.strictEqual(climbAudit.stateAfter16, "end", "Completing Floor 16 must trigger final victory");
  assert.strictEqual(vm.runInContext("logErrCount", s), 0, "Zero runtime errors in Suite 1");
}

// ============================================================================
// Suite 2: V2 narrative, choices, progress, retry and preview invariants
// ============================================================================
runStoryV2Suite({ createEnv, vm, assert, ROOT, assetDimsMap });

// ============================================================================
// Suite 3: Crisp Retina battlefield pixels, frame pacing, sprite motion and render costs
// ============================================================================
{
  for (const sample of [
    { mobile: false, width: 1440, height: 900, native: 2, budget: 11200000, maxDpr: 2.25 },
    { mobile: false, width: 2560, height: 1440, native: 2, budget: 11200000, maxDpr: 2.25 },
    { mobile: true, width: 390, height: 844, native: 3, budget: 3600000, maxDpr: 1.75 },
    { mobile: true, width: 1024, height: 1366, native: 3, budget: 3600000, maxDpr: 1.75 }
  ]) {
    const { sandbox: s } = createEnv(sample.mobile, sample.width, sample.height, sample.native);
    const canvas = vm.runInContext('({ width: cv.width, height: cv.height, dpr, smoothing: ctx.imageSmoothingQuality })', s);
    // Integer backing-store dimensions can round each edge by half a pixel.
    const integerRoundingAllowance = canvas.width + canvas.height + 1;
    assert(canvas.width * canvas.height <= sample.budget + integerRoundingAllowance,
      `Battlefield pixel budget exceeded at ${sample.width}x${sample.height}@${sample.native}`);
    assert(canvas.dpr <= sample.maxDpr, `Battlefield DPR must stay bounded on ${sample.mobile ? 'touch' : 'desktop'} screens`);
    assert.strictEqual(canvas.smoothing, 'high', 'Battlefield must preserve crisp high-quality resampling without blur');
  }
  const { sandbox: s } = createEnv(false, 1440, 900, 2);
  const adaptation = vm.runInContext(`(() => {
    const initialScale = battleResolutionScale;
    for (let i = 0; i < 310; i++) recordBattleFrame(1000 / 60);
    const normalUnchanged = battleResolutionScale === initialScale;
    resetBattleFrameSample(); recordBattleFrame(180);
    for (let i = 0; i < 160; i++) recordBattleFrame(1000 / 60);
    const oneSpikeUnchanged = battleResolutionScale === initialScale;
    recordBattleFrame(500); // Hidden tab / loading stall must not poison a sample.
    for (let i = 0; i < 160; i++) recordBattleFrame(1000 / 60);
    const loadingStallUnchanged = battleResolutionScale === initialScale;

    startGame('allrounder', { mode: 'story' }); __drainDirector();
    SpireDirector.setPreferences({ textScale: 1.3 });
    const root = document.getElementById('spireNarrative');
    const snapshot = () => JSON.stringify({ world: WORLD, x: player.x, y: player.y, hp: player.hp,
      maxHp: player.maxHp, weapons: player.weapons, reading: SpireDirector.getPreferences(),
      cssTextScale: root.style.getPropertyValue('--story-text-scale') });
    const before = snapshot(), initialPixels = cv.width * cv.height;
    resetBattleFrameSample();
    for (let i = 0; i < 80; i++) recordBattleFrame(32);
    const preservesSharpness = battleResolutionScale === 1 && cv.width * cv.height === initialPixels && before === snapshot();
    resize();
    const resizeKeepsCrisp = ctx.imageSmoothingQuality === 'high' && battleResolutionScale === 1 && before === snapshot();
    for (let i = 0; i < 400; i++) recordBattleFrame(32);
    const boundedMinimum = battleResolutionScale === 1 && dpr >= 1.7;

    resetBattleFrameSample(); for (let i = 0; i < 10; i++) recordBattleFrame(32);
    document.hidden = true; _advanceClock(100); loop(performance.now());
    const hiddenClearsSample = battleSampleFrames === 0 && battleSampleMs === 0;
    document.hidden = false;
    previousLoopMode = 'battle'; resetBattleFrameSample();
    for (let i = 0; i < 10; i++) recordBattleFrame(32);
    SpireDirector.replayEvent('opening.awakening'); _advanceClock(100); loop(performance.now());
    const narrativeClearsSample = battleSampleFrames === 0 && battleSampleMs === 0;
    SpireDirector.closeReplay();
    return { normalUnchanged, oneSpikeUnchanged, loadingStallUnchanged, preservesSharpness,
      resizeKeepsCrisp, boundedMinimum, hiddenClearsSample, narrativeClearsSample };
  })()`, s);
  for (const [key, value] of Object.entries(adaptation)) assert.strictEqual(value, true, 'Crisp Retina resolution invariant: ' + key);
}

{
  const { sandbox: s } = createEnv(false, 1440, 900, 2);
  const cadence = vm.runInContext(`(() => {
    const original = { update, draw, render: SpireDirector.render, active: SpireDirector.isActive,
      blocking: SpireDirector.isBlockingGameplay, state, last, framePacingRemainder, previousLoopMode };
    let updates = 0, draws = 0, elapsed = 0, mode = 'battle';
    const samples = [];
    try {
      update = dt => { updates++; elapsed += dt; };
      draw = () => { draws++; };
      SpireDirector.render = () => {};
      SpireDirector.isActive = () => mode === 'story';
      SpireDirector.isBlockingGameplay = () => mode === 'story';
      for (const hz of [60, 75, 90, 120, 144]) {
        for (mode of ['battle', 'menu', 'story']) {
          updates = draws = elapsed = 0;
          state = mode === 'menu' ? 'menu' : 'wave';
          const base = 1000;
          last = base; framePacingRemainder = 0; previousLoopMode = '';
          for (let tick = 1; tick <= hz * 2; tick++) loop(base + tick * 1000 / hz);
          samples.push({ hz, mode, updates, draws, elapsed });
        }
      }
      return samples;
    } finally {
      update = original.update; draw = original.draw;
      SpireDirector.render = original.render; SpireDirector.isActive = original.active;
      SpireDirector.isBlockingGameplay = original.blocking;
      state = original.state; last = original.last;
      framePacingRemainder = original.framePacingRemainder; previousLoopMode = original.previousLoopMode;
    }
  })()`, s);
  for (const sample of cadence) {
    if (sample.mode === 'battle') {
      assert(sample.updates >= 118 && sample.updates <= 122, `Battle cadence at ${sample.hz} Hz must stay within 60 +/- 1 updates/s; got ${sample.updates / 2}`);
      assert.strictEqual(sample.draws, sample.updates, `Battle draw/update must stay paired at ${sample.hz} Hz`);
      assert(Math.abs(sample.elapsed - 2) <= .04, `Battle simulation must preserve elapsed time at ${sample.hz} Hz; got ${sample.elapsed}s for 2s`);
    } else {
      assert.strictEqual(sample.draws, 0, `${sample.mode} must never repaint the covered battlefield at ${sample.hz} Hz`);
      const expected = sample.mode === 'story' ? 60 : 20;
      assert(Math.abs(sample.updates - expected) <= 2, `${sample.mode} must keep its intentional update budget at ${sample.hz} Hz`);
    }
  }
  const lazyMenu = vm.runInContext(`(() => {
    const roster = document.getElementById('classGrid');
    const homeLeavesRosterEmpty = menuStage === 'home' && roster.children.length === 0;
    openMenuStage('story');
    const box = document.getElementById('storyHeroShowcase');
    const image = box.querySelector('.prep-zero-portrait');
    const storyLeavesRosterEmpty = roster.children.length === 0;
    const buttons = Array.from(document.getElementById('storyDiffTabs').children);
    for (const button of buttons.slice(0, 3)) button.click();
    const imageSurvivesDifficulty = !!image && box.querySelector('.prep-zero-portrait') === image;
    openMenuStage('endless');
    const rosterBuildsOnDemand = roster.children.length === 6;
    openMenuStage('story');
    const imageSurvivesReturn = box.querySelector('.prep-zero-portrait') === image;
    return { homeLeavesRosterEmpty, storyLeavesRosterEmpty, imageSurvivesDifficulty, rosterBuildsOnDemand, imageSurvivesReturn };
  })()`, s);
  for (const [key, value] of Object.entries(lazyMenu)) assert.strictEqual(value, true, 'Lazy menu invariant: ' + key);
}

{
  const { sandbox: s, stats, gameDraws } = createEnv(false, 1440, 900, 2);
  assert(vm.runInContext("dpr >= 1.7 && dpr <= 2.25", s), "Desktop Retina battlefield must preserve crisp native DPR without blur");

  s.__battleDrawCount = () => gameDraws.length;
  const renderBudget = vm.runInContext(`(() => {
    const base = __battleDrawCount();
    _advanceClock(150); loop(performance.now());
    const menuNoDraw = __battleDrawCount() === base;
    startGame('allrounder', { mode: 'story' });
    const storyBase = __battleDrawCount();
    for (let i = 0; i < 4; i++) { _advanceClock(50); loop(performance.now()); }
    const storyNoDraw = __battleDrawCount() === storyBase;
    __drainDirector();
    const waveBase = __battleDrawCount();
    _advanceClock(20); loop(performance.now());
    const battleDraws = __battleDrawCount() > waveBase;
    const timeBeforeHidden = waveTime, drawsBeforeHidden = __battleDrawCount();
    document.hidden = true; _advanceClock(500); loop(performance.now());
    const hiddenDoesNoWork = waveTime === timeBeforeHidden && __battleDrawCount() === drawsBeforeHidden;
    document.hidden = false;
    pauseGame(); const paused = __battleDrawCount();
    _advanceClock(150); loop(performance.now());
    const pauseNoDraw = __battleDrawCount() === paused;
    resumeGame();
    return { menuNoDraw, storyNoDraw, battleDraws, hiddenDoesNoWork, pauseNoDraw };
  })()`, s);
  for (const [key, value] of Object.entries(renderBudget)) assert.strictEqual(value, true, 'Frame work budget: ' + key);

  const actionAudit = vm.runInContext(`(() => {
    startGame('brawler'); // Jinyu
    __drainDirector();
    const sheetsValid = ['zero', 'jinyu', 'astria', 'jialan', 'qingyu', 'eclipse'].every(k => {
      const shNorm = SpireAssets.getHeroSheet(k, false);
      const shFlash = SpireAssets.getHeroSheet(k, true);
      return shNorm && shFlash && shNorm.canvas && shFlash.canvas &&
        shNorm.canvas.width === 1024 && shNorm.canvas.height === 256 &&
        shFlash.canvas.width === 1024 && shFlash.canvas.height === 256 &&
        shNorm.cellW === 256 && shNorm.frames === 4;
    });

    // Test hero idle -> running stride -> sudden turn flip interpolation -> weapon attack pose Frame 3 + lunge
    player.weapons = []; enemies = []; trees = []; player._atkPoseT = 0;
    keys['a'] = true;
    for (let i = 0; i < 8; i++) { _advanceClock(40); update(0.04); draw(); }
    const flipLeft = player._visFlip;
    keys['a'] = false; keys['d'] = true;
    _advanceClock(20); update(0.02); draw(); // mid-turn smooth flip interpolation
    const midTurnFlip = player._visFlip;
    for (let i = 0; i < 12; i++) { _advanceClock(40); update(0.04); draw(); }
    keys['d'] = false;

    // Trigger melee & ranged attacks against a Boss -> must set _atkPoseT > 0 and render Frame 3 (sx = 768)
    const boss = createEnemy(player.x + 95, player.y, 'boss', 'butcher');
    boss.hp = 99999; boss.maxHp = 99999;
    player.weapons = [makeWeapon('katana', 3), makeWeapon('pistol', 3)];
    player.weapons[0].cd = 0; player.weapons[1].cd = 0;
    _advanceClock(20); update(0.02);
    const atkPoseTriggered = (player._atkPoseT || 0) > 0.05;
    draw();

    // Test Boss windup crouch & 3-ghost dash trail rendering across all 6 classes
    boss.lockedAim = 0; boss.dashT = 0.25;
    _advanceClock(35); draw();
    boss.lockedAim = undefined; boss.dashing = true; boss.vx = 520; boss.vy = 0;
    for (let i = 0; i < 6; i++) { _advanceClock(35); player.hp = player.maxHp; update(0.035); draw(); }

    // Test Soul Dash across all 6 classes + enemy projectile slicing + 4 Act Bosses' Signature Named Skills
    let dashArtsTested = 0;
    for (const cls of CLASSES.map(c => c.id)) {
      startGame(cls);
      __drainDirector();
      player.dashCd = 0;
      player.dashT = 0;
      keys['d'] = true;
      // Place an enemy bullet directly in front to verify dash projectile-slicing
      eBullets.push({ x: player.x + 28, y: player.y, vx: -120, vy: 0, dmg: 5, r: 5, color: '#ff3b6b' });
      const ebBefore = eBullets.length;
      const fired = triggerSoulDash();
      if (!fired) return { ok: false, reason: 'triggerSoulDash failed for ' + cls };
      for (let k = 0; k < 5; k++) { _advanceClock(35); update(0.035); draw(); }
      if (eBullets.length >= ebBefore) return { ok: false, reason: 'Soul Dash did not slice enemy projectile for ' + cls };
      keys['d'] = false;
      dashArtsTested++;
    }

    // Verify all 4 Fixed Act Bosses execute Signature Named Skills (windup telegraph + castLabel + burst execution)
    let sigBossesVerified = 0;
    for (const bVar of ['butcher', 'frost_queen', 'void_weaver', 'solar_seraph']) {
      enemies.length = 0; eBullets.length = 0; hazards.length = 0;
      const b = createEnemy(player.x + 190, player.y, 'boss', bVar);
      b.hp = 99999; b.maxHp = 99999;
      b.sigSkillT = 0.02;
      b.dashT = 9.0;
      _advanceClock(40); update(0.04); // enters sigWindupT
      if (!(b.sigWindupT > 0 && b.castLabel)) {
        return { ok: false, reason: 'Boss ' + bVar + ' did not enter signature skill windup' };
      }
      hudAcc = 1.0; update(0.02); draw(); // renders geometric telegraph + overhead badge + #bossCastSub
      // Advance past windup (0.88s) so signature pattern unleashes
      for (let k = 0; k < 22; k++) { _advanceClock(45); update(0.045); draw(); }
      if (b.sigWindupT !== 0) {
        return { ok: false, reason: 'Boss ' + bVar + ' signature windup did not finish cleanly' };
      }
      sigBossesVerified++;
    }

    // Verify 16x2 Boss Phase 1 & Phase 2 Cutout Portraits, 33% rates, 5.0s + 0.85s dissolve banner & 100% guaranteed Phase 2 portrait
    const portraitKeys = Object.keys(BOSS_PORTRAIT_DATA || {});
    const all32PortraitsReady = portraitKeys.length === 16 && portraitKeys.every(k => {
      const p1 = getBossAnimePortrait(k, false);
      const p2 = getBossAnimePortrait(k, true);
      return p1 && p2 && p1 !== p2 && p1.width === 440 && p1.height === 516 && p2.width === 440 && p2.height === 516;
    });
    const ratesValid = (RARE_PORTRAIT_RATE === 0.33 && PHASE2_AWAKEN_RATE === 0.33 && BOSS_CUTSCENE_SHOW_SEC === 5.0);

    // Render Phase 1 & Phase 2 cut-in banners across entrance, 5s hold, and 0.85s dissolve fade-out
    endlessMode = true;
    startBossCutscene('final_boss', 'butcher', '绯红断刃剑姬 · 烬羽', '🕯️ 第 4 层守誓之主', '⚔️ 贴近风眼安全');
    const p1Dur = bossCutscene ? bossCutscene.maxT : 0;
    for (const stepDt of [0.10, 2.40, 2.80]) { _advanceClock(stepDt * 1000); update(stepDt); draw(); }
    bossCutscene = null;

    // Trigger Phase 2 in Endless Mode -> must 100% guarantee immediate mythic_phase2 portrait banner + +50% HP + +30% DMG + ZERO extra time inflation!
    endlessMode = true;
    player.waveMythicAwakened = false;
    const preP2WaveTime = waveTime;
    const p2Boss = createEnemy(player.x + 150, player.y, 'boss', 'frost_queen');
    const p1Hp = p2Boss.maxHp, p1Dmg = p2Boss.dmg;
    p2Boss.canPhase2 = true;
    hurtEnemy(p2Boss, p2Boss.maxHp + 99999, true);
    const p2StatsOk = (p2Boss.maxHp === Math.max(450, Math.round(p1Hp * 1.50)) && p2Boss.hp === p2Boss.maxHp && p2Boss.dmg === Math.round(p1Dmg * 1.30) && waveTime === preP2WaveTime);
    const p2Guaranteed = !!(p2StatsOk && bossCutscene && bossCutscene.mode === 'mythic_phase2' && bossCutscene.variant === 'frost_queen' && bossCutscene.maxT >= 5.8);
    for (const stepDt of [0.12, 2.50, 2.75]) { _advanceClock(stepDt * 1000); update(stepDt); draw(); }
    bossCutscene = null;

    return { ok: true, sheetsValid, flipLeft, midTurnFlip, atkPoseTriggered, floorScale: curFloorScale, dashArtsTested, sigBossesVerified, all32PortraitsReady, ratesValid, p1Dur, p2Guaranteed };
  })()`, s);

  assert.strictEqual(actionAudit.ok, true, actionAudit.reason || "Action & Boss Signature audit failed");
  assert.strictEqual(actionAudit.sheetsValid, true, "All 6 1024x256 4-frame hero sprite sheets (normal + hit-flash) must pre-bake cleanly");
  assert(actionAudit.flipLeft < -0.5 && Math.abs(actionAudit.midTurnFlip) < 0.95, "Hero turn-around must smoothly interpolate _visFlip instead of snapping");
  assert.strictEqual(actionAudit.atkPoseTriggered, true, "Weapon fire/slash must trigger hero _atkPoseT attack animation pose");
  assert.strictEqual(actionAudit.floorScale, 1.0, "Desktop floor texture must bake at crisp 1.0x native resolution");
  assert.strictEqual(actionAudit.dashArtsTested, 6, "All 6 heroes must execute their signature Soul Dash arts & slice projectiles");
  assert.strictEqual(actionAudit.sigBossesVerified, 4, "All 4 Fixed Act Bosses must telegraph and unleash their signature named skills");
  assert.strictEqual(actionAudit.all32PortraitsReady, true, "All 16 Bosses must provide distinct 440x516 Phase 1 & Phase 2 cutout portraits (32 total)");
  assert.strictEqual(actionAudit.ratesValid, true, "Phase 1 portrait rate & Phase 2 awaken rate must both be 33% (0.33), with 5.0s display");
  assert(actionAudit.p1Dur >= 5.8, "Boss portrait cut-in banner must display for 5.0s plus smooth fade-out (~5.85s total)");
  assert.strictEqual(actionAudit.p2Guaranteed, true, "Triggering Phase 2 awakening must 100% guarantee displaying the Phase 2 portrait banner");

  // Confirm 4-frame sprite sheet slicing (sw=256, sh=256 across sx = 0, 256, 512, 768) actually executed on game canvas
  const seenFrameSx = new Set(
    gameDraws
      .filter(d => d.img && d.img.width === 1024 && d.img.height === 256 && d.args.length === 8 && d.args[2] === 256 && d.args[3] === 256)
      .map(d => d.args[0])
  );
  assert(seenFrameSx.has(768) && seenFrameSx.size >= 3, `Hero/Boss 4-frame sheet must slice distinct frames including attack frame sx=768 (saw sx=${JSON.stringify([...seenFrameSx])})`);
  assert.strictEqual(stats.radialGradients, 0, "Combat draw() must create ZERO per-frame radial gradients");
  assert.strictEqual(stats.shadowBlurs, 0, "Combat draw() must use ZERO expensive shadowBlur");
  assert.strictEqual(vm.runInContext("logErrCount", s), 0, "Zero runtime errors in Suite 3");
}

// ============================================================================
// Suite 4: Core Gameplay Systems + Main Screen Mode Split (Story=Protagonist Only / Endless=All Heroes) + Mobile Portrait & Landscape AVG/Cutscene
// ============================================================================
{
  const { sandbox: s } = createEnv(true, 390, 844, 3);
  const mobileInput = vm.runInContext(`(() => {
    startGame('allrounder', { mode: 'endless' });
    const touch = (id, x, y, target = cv) => ({ identifier: id, clientX: x, clientY: y, target });
    const emit = (type, touches, changedTouches = touches) => cv.dispatch(type, { touches, changedTouches });
    let finger = touch(11, 60, 650);
    emit('touchstart', [finger]); finger = touch(11, 105, 650); emit('touchmove', [finger]);
    const singleMoves = joy.active && joy.mag > .8 && joy.dx > .9;
    const zoomBeforeDash = camZoom;
    const dashFinger = touch(22, 340, 740, document.getElementById('dashTouchBtn'));
    emit('touchmove', [finger, dashFinger], [finger]);
    player.dashCd = player.dashT = 0; const dashed = triggerSoulDash();
    const secondHandDash = dashed && joy.active && joy.mag > 0 && camZoom === zoomBeforeDash;
    emit('touchcancel', []);
    const canceled = !joy.active && joy.mag === 0 && joy.dx === 0 && joy.dy === 0;

    finger = touch(31, 90, 600); emit('touchstart', [finger]);
    finger = touch(31, 130, 600); emit('touchmove', [finger]);
    let second = touch(32, 230, 600); emit('touchstart', [finger, second], [second]);
    const zoomBeforePinch = camZoom;
    second = touch(32, 280, 600); emit('touchmove', [finger, second]);
    const pinchOnlyZooms = camZoom > zoomBeforePinch && !joy.active && joy.mag === 0;
    emit('touchend', [finger], [second]); emit('touchmove', [touch(31, 155, 610)]);
    const pinchReleaseDoesNotDrift = !joy.active && joy.mag === 0;
    emit('touchend', [], [finger]);
    finger = touch(41, 70, 650); emit('touchstart', [finger]); emit('touchmove', [touch(41, 110, 650)]);
    const freshTouchResumes = joy.active && joy.mag > 0;
    window.innerWidth = 844; window.innerHeight = 390; window.dispatch('resize'); _flushAnimationFrame();
    const rotateClearsJoystick = !joy.active && joy.mag === 0;

    const wheelLeavesZoom = target => { userZoomed = false; const before = camZoom; window.dispatch('wheel', { deltaY: 120, target }); return camZoom === before && !userZoomed; };
    const outsideBattlefieldDoesNotZoom = wheelLeavesZoom(document.body);
    userZoomed = false; const battleZoom = camZoom; window.dispatch('wheel', { deltaY: 120, target: cv });
    const battlefieldCanZoom = camZoom !== battleZoom && userZoomed;
    openSpireSettings();
    const settingsDoNotZoom = wheelLeavesZoom(document.getElementById('presentationBody'));
    const pauseDoesNotZoom = wheelLeavesZoom(cv);
    closePresentationModal(); resumeGame();
    SpireDirector.replayEvent('opening.awakening');
    const beforeStoryTouch = camZoom;
    emit('touchstart', [touch(51, 50, 200)]); emit('touchmove', [touch(51, 95, 200)]);
    emit('touchstart', [touch(51, 95, 200), touch(52, 160, 200)]);
    emit('touchmove', [touch(51, 95, 200), touch(52, 260, 200)]);
    const storyOwnsInput = !joy.active && joy.mag === 0 && camZoom === beforeStoryTouch && wheelLeavesZoom(cv);
    SpireDirector.closeReplay(); showStart();
    const menuDoesNotZoom = wheelLeavesZoom(cv);
    return { singleMoves, secondHandDash, canceled, pinchOnlyZooms, pinchReleaseDoesNotDrift,
      freshTouchResumes, rotateClearsJoystick, outsideBattlefieldDoesNotZoom, battlefieldCanZoom,
      settingsDoNotZoom, pauseDoesNotZoom, storyOwnsInput, menuDoesNotZoom };
  })()`, s);
  for (const [key, value] of Object.entries(mobileInput)) assert.strictEqual(value, true, 'Mobile input invariant: ' + key);
}

{
  const { sandbox: s } = createEnv(true, 390, 844, 3);
  const rotation = vm.runInContext(`(() => {
    startGame('allrounder', { mode: 'endless' });
    enemies = [{ x: 210, y: 330, lockedAim: .7, dashWarnLen: 280, dashStartX: 210, dashStartY: 330 }];
    bullets = [{ x: 230, y: 350, vx: 14, vy: -3 }]; eBullets = [{ x: 260, y: 340, vx: -9, vy: 2 }];
    mines = [{ x: 270, y: 360 }]; rings = [{ x: 300, y: 370, r: 60 }];
    beams = [{ x1: 100, y1: 200, x2: 220, y2: 300 }]; portals = [{ x: 400, y: 420 }];
    const snapshot = () => JSON.stringify({ world: WORLD, player: { x: player.x, y: player.y, hp: player.hp, weapons: player.weapons },
      enemies, bullets, eBullets, mines, rings, beams, portals, hazards, turrets, drops, trees, relics, sporeZones, spawns });
    const before = snapshot(), portraitWorld = WORLD.w < WORLD.h;
    window.innerWidth = 844; window.innerHeight = 390; window.dispatch('resize'); _flushAnimationFrame();
    const landscapeKeepsCombat = snapshot() === before && uiMode === 'mobile-landscape' && viewW === 844 && viewH === 390;
    window.innerWidth = 390; window.innerHeight = 740; window.dispatch('resize'); _flushAnimationFrame();
    const browserChromeKeepsCombat = snapshot() === before && uiMode === 'mobile-portrait';
    window.innerWidth = 844; window.innerHeight = 390; window.dispatch('resize'); _flushAnimationFrame();
    startGame('allrounder', { mode: 'endless' });
    const freshRunUsesOrientation = WORLD.w > WORLD.h;
    return { portraitWorld, landscapeKeepsCombat, browserChromeKeepsCombat, freshRunUsesOrientation };
  })()`, s);
  for (const [key, value] of Object.entries(rotation)) assert.strictEqual(value, true, 'Mobile rotation invariant: ' + key);
}

{
  const { sandbox: s } = createEnv(true, 390, 844, 3);
  const webview = vm.runInContext(`(() => {
    startGame('allrounder', { mode: 'endless' });
    const world = JSON.stringify(WORLD), px = player.x, py = player.y;
    const vv = window.visualViewport;
    vv.width = 390; vv.height = 611;
    vv.dispatch('resize'); vv.dispatch('resize'); _flushAnimationFrame();
    const visibleViewportApplied = viewW === 390 && viewH === 611 &&
      document.documentElement.style.getPropertyValue('--app-height') === '611px';
    const viewportKeepsArena = JSON.stringify(WORLD) === world && player.x === px && player.y === py;
    vv.scale = 1.5; vv.width = 260; vv.height = 410; vv.dispatch('resize'); _flushAnimationFrame();
    const browserPinchDoesNotResizeGame = viewW === window.innerWidth && viewH === window.innerHeight;
    vv.scale = 1; vv.width = 390; vv.height = 844; vv.dispatch('resize'); _flushAnimationFrame();
    const finger = { identifier: 71, clientX: 60, clientY: 650, target: cv };
    cv.dispatch('touchstart', { touches: [finger], changedTouches: [finger] });
    cv.dispatch('touchmove', { touches: [{ ...finger, clientX: 110 }], changedTouches: [{ ...finger, clientX: 110 }] });
    keys.w = true; document.hidden = true; document.dispatch('visibilitychange', {});
    const hiddenClearsInput = state === 'paused' && !joy.active && joy.mag === 0 && !keys.w;
    document.hidden = false; document.dispatch('visibilitychange', {});
    const foregroundRemainsPaused = state === 'paused' && !joy.active;
    resumeGame();
    const resumeIsNeutral = state === 'wave' && !joy.active && joy.mag === 0;
    cv.dispatch('touchstart', { touches: [finger], changedTouches: [finger] });
    cv.dispatch('touchmove', { touches: [{ ...finger, clientX: 110 }], changedTouches: [{ ...finger, clientX: 110 }] });
    const freshTouchWorks = joy.active && joy.mag > 0;
    return { visibleViewportApplied, viewportKeepsArena, browserPinchDoesNotResizeGame,
      hiddenClearsInput, foregroundRemainsPaused, resumeIsNeutral, freshTouchWorks };
  })()`, s);
  for (const [key, value] of Object.entries(webview)) assert.strictEqual(value, true, 'Mobile WebView invariant: ' + key);
}

{
  const { sandbox: s, els, stats, directorDraws: mobDirDraws } = createEnv(true, 390, 844, 3);
  s.window.dispatch("pointerdown", {});

  const coreCheck = vm.runInContext(`(() => {
    // 0) Verify Main Screen -> Story Mode locks strictly to protagonist ('allrounder'), Endless Mode allows all 6 heroes
    const bootOnHome = menuStage === 'home' && !document.getElementById('menuHomeView').classList.contains('hidden');
    openMenuStage('story');
    const storyViewShown = menuStage === 'story' && !document.getElementById('menuStoryView').classList.contains('hidden');
    // Attempt to pass non-protagonist into story mode -> must clamp strictly to 'allrounder'
    startGame('brawler', { mode: 'story' });
    const storyLockedToZero = (player.cls === 'allrounder' && endlessMode === false);

    // Render Mobile Portrait (390x844) Opening Cutscene -> Act I Curtain -> Floor 1 AVG Dialogue
    for (let i = 0; i < 8; i++) { SpireDirector.update(0.12); SpireDirector.render(); }
    SpireDirector.advanceOrSkip(true); // -> Act I Curtain on 390x844 portrait
    SpireDirector.update(0.15); SpireDirector.render();
    SpireDirector.advanceOrSkip(true); // -> Floor 1 AVG Dialogue on 390x844 portrait
    for (let i = 0; i < 8; i++) { SpireDirector.update(0.10); SpireDirector.render(); }
    __drainDirector();

    // Switch to Mobile Landscape (844x390) and verify AVG & Cutscene render cleanly without errors
    window.innerWidth = 844; window.innerHeight = 390;
    resize();
    replayOpeningCutscene();
    SpireDirector.update(0.15); SpireDirector.render();
    SpireDirector.advanceOrSkip(true);
    window.innerWidth = 390; window.innerHeight = 844;
    resize();

    // Return to Start Menu -> must reset to Main Title Screen ('home'), then enter Endless Mode and pick other heroes
    showStart();
    const returnedHome = menuStage === 'home';
    openMenuStage('endless');
    const endlessRosterCount = document.getElementById('classGrid').children.length;
    const diffBtnsCount = document.getElementById('diffTabs').children.length;
    const sceneBtnsCount = document.getElementById('sceneTabs').children.length;

    // v2.7.0: Verify multi-level Hero Dossier Tabs ('traits' <-> 'combat') & Prep Tabs ('diff' <-> 'scene')
    setHeroDossierTab('combat');
    const combatHtmlOk = document.getElementById('endlessHeroShowcase').innerHTML.includes('STARTING ARMAMENTS');
    setHeroDossierTab('traits');
    const traitsHtmlOk = document.getElementById('endlessHeroShowcase').innerHTML.includes('trait-chip-grid');

    setEndlessPrepTab('scene');
    const scenePaneShown = !document.getElementById('endlessScenePane').classList.contains('hidden') &&
      document.getElementById('endlessDiffPane').classList.contains('hidden');
    setEndlessPrepTab('diff');
    const diffPaneRestored = !document.getElementById('endlessDiffPane').classList.contains('hidden') &&
      document.getElementById('endlessScenePane').classList.contains('hidden');

    // v2.7.0: Verify keyboard 1..6 & ArrowRight character tab switching in Endless Mode
    window.dispatch('keydown', { key: '3', preventDefault() {} });
    const keyDigitHero = selectedEndlessCls;
    window.dispatch('keydown', { key: 'ArrowRight', preventDefault() {} });
    const keyArrowHero = selectedEndlessCls;

    selectEndlessHero('ranger');
    startEndlessMode();
    const endlessRangerOk = (player.cls === 'ranger' && endlessMode === true && !SpireDirector.isBlockingGameplay());
    openShop(true);
    const endlessShopTitle = document.getElementById('shopTitle').textContent;

    // 1) Boss Floor One-Shot Protection (<= 42% maxHp single-hit cap on Boss floors 4/8/12/16) & Zero Player Invuln
    wave = 4; beginWave();
    player.maxHp = 100; player.hp = 100; player.armor = 0; player.dodge = 0; player.shield = 0; player.invuln = 0;
    hurtPlayer(500);
    const hpAfterBossNuke = player.hp;
    const invulnAfterHit = player.invuln;
    hurtPlayer(10);
    const consecutiveHitRegistered = player.hp < hpAfterBossNuke;

    // 2) Codex all 5 tabs render cleanly with 6 heroes, 4 Spire scenes, 32 weapons, 75 items
    openCodex('weapons'); const wCnt = document.getElementById('codexGrid').children.length;
    setCodexTab('items'); const iCnt = document.getElementById('codexGrid').children.length;
    setCodexTab('heroes'); const hCnt = document.getElementById('codexGrid').children.length;
    setCodexTab('monsters'); const mCnt = document.getElementById('codexGrid').children.length;
    setCodexTab('world'); setCodexFilter('scene'); const sCnt = document.getElementById('codexGrid').children.length;
    closeCodex();

    // 3) Death Wave-Retry on Story Mode Floor 8 restores exact Floor 8 Boss ('frost_queen') & pre-wave state
    selectedDiff = 2;
    SpireSave.clear(); // This fixture starts a fresh run; saved-run confirmation is tested separately.
    startStoryMode();
    __drainDirector();
    player.mats = 88;
    wave = 8; beginWave();
    __drainDirector();
    const preHp = player.maxHp;
    player.mats += 50;
    player.dodge = 0; player.armor = 0; player.shield = 0; player.invuln = 0;
    // Deal 4 consecutive hits without needing to clear invuln manually (zero i-frames!)
    for (let k = 0; k < 4; k++) { hurtPlayer(999); }
    __drainDirector();
    const diedCleanly = state === 'end';
    retryFailedWave();
    __drainDirector();
    for (let k = 0; k < 25; k++) update(0.05);
    draw();
    const magCircleDrawn = typeof player._visMagR === 'number' && player._visMagR >= 120;
    const retryBoss = enemies.find(e => e.type === 'boss');
    const retryOk = state === 'wave' && wave === 8 && player.cls === 'allrounder' && !endlessMode && player.mats === 88 && player.hp === preHp && retryBoss && retryBoss.variant === 'frost_queen' && magCircleDrawn;

    return {
      bootOnHome, storyViewShown, storyLockedToZero, returnedHome,
      endlessRosterCount, diffBtnsCount, sceneBtnsCount,
      combatHtmlOk, traitsHtmlOk, scenePaneShown, diffPaneRestored,
      keyDigitHero, keyArrowHero,
      endlessRangerOk, endlessShopTitle,
      hpAfterBossNuke, invulnAfterHit, consecutiveHitRegistered,
      wCnt, iCnt, hCnt, mCnt, sCnt, diedCleanly, retryOk
    };
  })()`, s);

  assert.strictEqual(coreCheck.bootOnHome, true, "Mobile & Desktop must boot onto uncluttered Main Title Screen");
  assert.strictEqual(coreCheck.storyViewShown, true, "Clicking Story Mode portal must open Story preparation stage");
  assert.strictEqual(coreCheck.storyLockedToZero, true, "Story Mode must strictly lock character to protagonist Zero ('allrounder')");
  assert.strictEqual(coreCheck.returnedHome, true, "showStart() must return cleanly to Main Title Screen");
  assert.strictEqual(coreCheck.endlessRosterCount, 6, "Endless Mode must expose all 6 Spire characters in symmetrical character tabs");
  assert.strictEqual(coreCheck.diffBtnsCount, 6, "Difficulty matrix must render 6 symmetrical D0..D5 buttons (3x2)");
  assert.strictEqual(coreCheck.sceneBtnsCount, 5, "Scene vista tabs must render 5 symmetrical cards (1 wide + 2x2)");
  assert.strictEqual(coreCheck.combatHtmlOk, true, "Hero dossier 'combat' tab must render armaments & Soul Dash specs");
  assert.strictEqual(coreCheck.traitsHtmlOk, true, "Hero dossier 'traits' tab must render structured positive/negative trait chips");
  assert.strictEqual(coreCheck.scenePaneShown, true, "Prep 'scene' tab must reveal #endlessScenePane and hide #endlessDiffPane");
  assert.strictEqual(coreCheck.diffPaneRestored, true, "Prep 'diff' tab must restore #endlessDiffPane cleanly");
  assert.strictEqual(coreCheck.keyDigitHero, "ranger", "Pressing '3' on Endless Mode must switch character tab to 3rd hero ('ranger')");
  assert.strictEqual(coreCheck.keyArrowHero, "engineer", "Pressing 'ArrowRight' on Endless Mode must advance character tab to 'engineer'");
  assert.strictEqual(coreCheck.endlessRangerOk, true, "Endless Mode must launch selected non-protagonist directly into endless run without story blocking");
  assert(coreCheck.endlessShopTitle.includes("无尽第 1 层"), `Endless Mode shop header must display endless floor label (got ${coreCheck.endlessShopTitle})`);
  assert(cssCombined.includes("@media") && cssCombined.includes("narrative"), "Narrative UI must include responsive styling; real viewport layout is reviewed separately in browser");
  assert(coreCheck.hpAfterBossNuke >= 58, `Boss floor one-shot protection must cap single hit at <=42% maxHp (HP left: ${coreCheck.hpAfterBossNuke})`);
  assert.strictEqual(coreCheck.invulnAfterHit, 0, "Player must have ZERO invulnerability frames after taking damage");
  assert.strictEqual(coreCheck.consecutiveHitRegistered, true, "Back-to-back hits must immediately register damage without i-frame immunity");
  assert.strictEqual(coreCheck.wCnt, 32, "Codex must render 32 weapons");
  assert.strictEqual(coreCheck.iCnt, 75, "Codex must render 75 items");
  assert.strictEqual(coreCheck.hCnt, 6, "Codex must render 6 Spire heroes");
  assert.strictEqual(coreCheck.mCnt, 37, "Codex must render all 37 unique Spire monsters, commanders & bosses");
  assert.strictEqual(coreCheck.sCnt, 4, "Codex must render 4 Spire scenes");
  assert.strictEqual(coreCheck.diedCleanly, true, "Multi-hit lethal damage must transition to end state");
  assert.strictEqual(coreCheck.retryOk, true, "retryFailedWave() on Floor 8 must restore exact checkpoint and fixed Boss frost_queen");
  assert(els.retryWaveBtn.textContent.includes("重试"), "Player defeat must offer a floor retry control");
  assert.strictEqual(stats.radialGradients, 0, "Mobile combat & UI suite must create ZERO per-frame radial gradients");
  assert.strictEqual(stats.shadowBlurs, 0, "Mobile combat & UI suite must use ZERO shadowBlur");
  assert.strictEqual(vm.runInContext("logErrCount", s), 0, "Zero runtime errors in Suite 4");
}

// ============================================================================
// Suite 5: Standalone Single-File Offline Bundle (`烬塔残响_单文件离线版.html`) Verification
// ============================================================================
{
  const singlePath = path.join(os.tmpdir(), `spire_singlefile_verify_${process.pid}.html`);
  const tempBuilt = true;
  execFileSync(process.execPath, [path.join(ROOT, "scripts/build-singlefile.mjs"), "--out", singlePath], { stdio: "ignore" });
  try {
    assert(fs.existsSync(singlePath), "Single-file bundle HTML must exist");
    const singleHtml = fs.readFileSync(singlePath, "utf8");
    assert(!/<script\s+defer\s+src=/.test(singleHtml), "Single-file HTML must not leave external <script defer src=...> tags");
    assert(!/<link\s+rel="stylesheet"/.test(singleHtml), "Single-file HTML must not leave external stylesheet links");
    assert(!/\b(?:src|href)="assets\//.test(singleHtml), "Single-file HTML must inline all static HTML src/href asset references");

    const scripts = [...singleHtml.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    assert.strictEqual(scripts.length, 2, "Single-file HTML should contain 2 inline <script> blocks (inline assets + game bundle)");
    new vm.Script(scripts[0], { filename: "singlefile_inline_assets.js" });
    new vm.Script(scripts[1], { filename: "singlefile_game_bundle.js" });

    const assetCheckBox = { window: {} };
    vm.createContext(assetCheckBox);
    vm.runInContext(scripts[0], assetCheckBox);
    const map = assetCheckBox.window.__SPIRE_INLINE_ASSETS__;
    assert(map && typeof map === "object", "window.__SPIRE_INLINE_ASSETS__ must be populated");
    for (const key of [
      "assets/spire/port_zero.jpg", "assets/spire/port_jinyu.jpg", "assets/spire/port_astria.jpg",
      "assets/spire/port_jialan.jpg", "assets/spire/port_qingyu.jpg", "assets/spire/port_eclipse.jpg",
      "assets/spire/hero_zero_sheet.png", "assets/spire/hero_jinyu_sheet.png", "assets/spire/hero_astria_sheet.png",
      "assets/spire/hero_jialan_sheet.png", "assets/spire/hero_qingyu_sheet.png", "assets/spire/hero_eclipse_sheet.png",
      "assets/spire/cut_intro_1.jpg", "assets/spire/cut_intro_2.jpg", "assets/spire/cut_intro_3.jpg",
      "assets/spire/cut_defeat_act1_1.jpg", "assets/spire/cut_defeat_act4_2.jpg",
      "assets/spire/v2/title-clean.png", "assets/spire/v2/wind-pavilion.png", "assets/spire/v2/player-defeat-clean.png",
      "assets/spire/v2/awakening-atlas.png", "assets/spire/v2/jinyu-atlas.png", "assets/spire/v2/endings-atlas.png",
      ...V21_CINEMATIC_FILES
    ]) {
      assert(typeof map[key] === "string" && map[key].startsWith("data:image/"), `Single-file bundle missing inline data URI for ${key}`);
    }
    assert(typeof map["assets/audio/scene_foundry_rain.wav"] === "string" && map["assets/audio/scene_foundry_rain.wav"].startsWith("data:audio/"), "Single-file bundle must inline scene audio WAV assets");
  } finally {
    if (tempBuilt && fs.existsSync(singlePath)) fs.unlinkSync(singlePath);
  }
}

console.log(`ALL 5 V${packageVersion} VERIFICATION SUITES PASSED! Modular files: ${cssFiles.length} CSS + ${jsFiles.length} JS | Total JS: ${(code.length / 1024).toFixed(1)} KB`);
