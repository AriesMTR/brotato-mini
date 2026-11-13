import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const rawCssRefs = [...indexHtml.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*>/g)].map(m => m[1]);
const rawJsRefs = [...indexHtml.matchAll(/<script\s+defer\s+src="([^"]+)"\s*><\/script>/g)].map(m => m[1]);
assert(rawCssRefs.every(r => r.includes("?v=")), "All stylesheet links in index.html must carry ?v= cache-busting query string");
assert(rawJsRefs.every(r => r.includes("?v=")), "All deferred script tags in index.html must carry ?v= cache-busting query string");
const cssFiles = rawCssRefs.map(r => r.split("?")[0]);
const jsFiles = rawJsRefs.map(r => r.split("?")[0]);

assert.strictEqual(cssFiles.length, 2, "Expected 2 modular stylesheets (base.css + mobile.css)");
assert.strictEqual(jsFiles.length, 18, "Expected 18 modular script files in index.html (including src/game/director.js)");

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

function makeEl(tag = "div", stats = null, drawCalls = null) {
  const listeners = {};
  const children = [];
  const el = {
    tagName: tag.toUpperCase(),
    width: tag.toLowerCase() === "canvas" ? 300 : undefined,
    height: tag.toLowerCase() === "canvas" ? 150 : undefined,
    style: {},
    children,
    scrollTop: 0,
    scrollHeight: 200,
    disabled: false,
    textContent: "",
    value: "",
    href: "",
    src: "",
    download: "",
    _html: "",
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; if (v === "") children.length = 0; },
    get className() { return Array.from(this.classList._s).join(" "); },
    set className(v) {
      this.classList._s = new Set(String(v || "").split(/\s+/).filter(Boolean));
    },
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
      toggle(c, f) { if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else { f ? this._s.add(c) : this._s.delete(c); } }
    },
    appendChild(ch) { children.push(ch); return ch; },
    getAttribute(k) { return this._attrs ? this._attrs[k] || null : null; },
    setAttribute(k, v) { if (!this._attrs) this._attrs = {}; this._attrs[k] = String(v); },
    select() {},
    click() { if (this.onclick) this.onclick(); },
    remove() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: this.width || 1440, height: this.height || 900 };
    },
    querySelector(sel) {
      if (!this._qs) this._qs = {};
      if (!this._qs[sel]) this._qs[sel] = makeEl("button");
      return this._qs[sel];
    },
    addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    dispatch(ev, obj) { (listeners[ev] || []).forEach(fn => fn(obj)); },
    getContext: () => makeCtx(stats, drawCalls)
  };
  return el;
}

// Measure real asset dimensions once so MockImage mirrors real disk images!
const assetDimsMap = {};
const spireAssetsDir = path.join(ROOT, "assets/spire");
for (const fname of fs.readdirSync(spireAssetsDir)) {
  const abs = path.join(spireAssetsDir, fname);
  if (fs.statSync(abs).isFile() && /\.(png|jpg|jpeg)$/i.test(fname)) {
    assetDimsMap[`assets/spire/${fname}`] = readJpegPngDims(abs);
  }
}

function createEnv(mobile, w, h, dprVal = 2, audioMode = "running") {
  const els = {};
  const stats = { radialGradients: 0, shadowBlurs: 0, downloads: [], clipboardText: "", oscStarted: 0 };
  const directorDraws = [];
  const gameDraws = [];
  const winListeners = {};
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
    Image: MockImage,
    setTimeout: fn => { fn(); return 1; },
    clearTimeout: () => {},
    Blob: class Blob { constructor(parts, opts) { this.parts = parts; this.opts = opts; } },
    URL: { createObjectURL: () => "blob:mock-log-url", revokeObjectURL: () => {} },
    performance: { now: () => nowClock },
    _advanceClock: ms => { nowClock += ms; return nowClock; },
    requestAnimationFrame: () => 1,
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
      addEventListener(ev, fn) { (winListeners[ev] = winListeners[ev] || []).push(fn); },
      dispatch(ev, obj) { (winListeners[ev] || []).forEach(fn => fn(obj)); }
    },
    document: {
      hidden: false,
      body: makeEl("body"),
      _docListeners: {},
      execCommand: () => true,
      addEventListener(ev, fn) { (this._docListeners[ev] = this._docListeners[ev] || []).push(fn); },
      dispatch(ev, obj) { (this._docListeners[ev] || []).forEach(fn => fn(obj)); },
      getElementById(id) {
        if (!els[id]) {
          const isCv = id === "cv" || id === "spireDirectorCv";
          els[id] = makeEl(isCv ? "canvas" : "div", id === "cv" ? stats : null, id === "spireDirectorCv" ? directorDraws : (id === "cv" ? gameDraws : null));
        }
        return els[id];
      },
      querySelector(sel) {
        if (!els[sel]) els[sel] = makeEl("div");
        return els[sel];
      },
      createElement(tag) {
        const el = makeEl(tag);
        if (tag === "a") {
          el.click = function () { stats.downloads.push({ href: this.href, download: this.download }); };
        }
        return el;
      }
    }
  };
  sandbox.globalThis = sandbox;
  if (mobile) sandbox.window.ontouchstart = null;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return { sandbox, els, stats, directorDraws, gameDraws };
}

// ============================================================================
// Suite 1: 16-Floor Fixed Non-Random Boss Architecture & Scene Progression
// ============================================================================
{
  const { sandbox: s } = createEnv(false, 1440, 900, 2);
  assert.strictEqual(vm.runInContext("APP_VERSION", s), "v1.3.7", "APP_VERSION must be v1.3.7");
  assert.strictEqual(vm.runInContext("MAX_WAVE", s), 16, "MAX_WAVE must be strictly 16 floors");
  assert.strictEqual(vm.runInContext("menuStage", s), "home", "Game must boot onto clean Main Title Screen (menuStage === 'home')");

  // Verify across multiple runs AND D5 difficulty that Waves 1..16 follow exact Act scenes and fixed non-random Bosses
  const climbAudit = vm.runInContext(`(() => {
    const expectedScene = w => (w <= 4 ? 'foundry' : (w <= 8 ? 'glacier' : (w <= 12 ? 'wasteland' : 'desert')));
    const expectedBoss = { 4: 'butcher', 8: 'frost_queen', 12: 'void_weaver', 16: 'solar_seraph' };
    const expectedMini = { 6: 'glacial_valkyrie', 10: 'shadow_stalker', 14: 'iron_warden' };
    for (const dIdx of [0, 2, 5]) {
      selectedDiff = dIdx;
      selectedScene = 'random';
      startGame('allrounder');
      if (typeof SpireDirector !== 'undefined') SpireDirector.advanceOrSkip(true);
      for (let w = 1; w <= 16; w++) {
        wave = w;
        beginWave();
        if (typeof SpireDirector !== 'undefined') {
          for (let guard = 0; guard < 10 && SpireDirector.isBlockingGameplay(); guard++) SpireDirector.advanceOrSkip(true);
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
          if (w === 16 && !enemies.find(e => e.type === 'boss').canPhase2) {
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
    // Verify victory triggers on completing Floor 16 (and NOT on Floor 12!)
    selectedDiff = 1;
    startGame('allrounder');
    if (typeof SpireDirector !== 'undefined') {
      while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);
    }
    wave = 12; pendingCrates = 0; pendingLevels = 0;
    finishWave();
    const stateAfter12 = state;
    wave = 16; pendingCrates = 0; pendingLevels = 0;
    finishWave();
    const stateAfter16 = state;
    return { ok: true, stateAfter12, stateAfter16 };
  })()`, s);

  assert.strictEqual(climbAudit.ok, true, climbAudit.reason || "16-floor climb audit failed");
  assert.strictEqual(climbAudit.stateAfter12, "shop", "Floor 12 must proceed to inter-floor shop (NOT end the run early)");
  assert.strictEqual(climbAudit.stateAfter16, "end", "Completing Floor 16 must trigger final victory");
  assert.strictEqual(vm.runInContext("logErrCount", s), 0, "Zero runtime errors in Suite 1");
}

// ============================================================================
// Suite 2: Left-Column Anime Half-Body Portraits & Restored Opening Cutscene + Story Director
// ============================================================================
{
  // 2a. Verify all 6 Left-Column Anime Half-Body Portraits on disk have tall portrait aspect ratio (768px tall, ~512-628px wide, NEVER square chibi!)
  const charPortraitKeys = ["zero", "jinyu", "astria", "jialan", "qingyu", "eclipse"];
  for (const k of charPortraitKeys) {
    const rel = `assets/spire/port_${k}.jpg`;
    const dims = assetDimsMap[rel];
    assert(dims, `Missing dialogue portrait file: ${rel}`);
    assert.strictEqual(dims.h, 768, `${rel} must preserve full 768px vertical art height (got ${dims.h})`);
    assert(dims.w >= 500 && dims.w <= 640 && dims.h > dims.w * 1.2, `${rel} must be the left-column anime half-body portrait, not a square crop (got ${dims.w}x${dims.h})`);
  }

  // Verify Opening Cutscene CGs & Boss Defeat Redemption CGs exist on disk
  for (const rel of [
    "assets/spire/cut_intro_1.jpg", "assets/spire/cut_intro_2.jpg", "assets/spire/cut_intro_3.jpg",
    "assets/spire/cut_defeat_act1_1.jpg", "assets/spire/cut_defeat_act1_2.jpg",
    "assets/spire/cut_defeat_act2_1.jpg", "assets/spire/cut_defeat_act2_2.jpg",
    "assets/spire/cut_defeat_act3_1.jpg", "assets/spire/cut_defeat_act3_2.jpg",
    "assets/spire/cut_defeat_act4_1.jpg", "assets/spire/cut_defeat_act4_2.jpg"
  ]) {
    assert(assetDimsMap[rel], `Missing cinematic CG asset: ${rel}`);
  }

  // 2b. Verify Opening Cutscene triggers on startGame() AND via replayOpeningCutscene() button, and AVG renders tall Left-Column Standees
  const { sandbox: s, els, directorDraws } = createEnv(false, 1440, 900, 2);

  const directorAudit = vm.runInContext(`(() => {
    // 1) Replay Opening Cutscene from Start Menu
    state = 'menu';
    replayOpeningCutscene();
    const replayActive = SpireDirector.isActive() && SpireDirector.isBlockingGameplay();
    update(0.05);
    SpireDirector.render();
    SpireDirector.advanceOrSkip(true);
    const backToMenu = !SpireDirector.isActive() && state === 'menu';

    // 2) Starting a new game automatically plays 3-shot Opening Cutscene -> Act I Curtain -> Floor 1 AVG Dialogue
    startGame('allrounder');
    const openingStartedOnNewRun = SpireDirector.isActive() && SpireDirector.isBlockingGameplay();
    // Render Opening Cutscene frames (including crossfade window)
    for (let i = 0; i < 25; i++) {
      SpireDirector.update(0.12);
      SpireDirector.render();
    }
    // Advance past Opening Cutscene -> Act I Curtain -> into Floor 1 AVG Dialogue!
    SpireDirector.advanceOrSkip(true); // skips cutscene -> now on Act I curtain
    const curtainActive = SpireDirector.isActive();
    SpireDirector.render();
    SpireDirector.advanceOrSkip(true); // skips curtain -> now on Floor 1 AVG dialogue (Zero + Qingyu left/right standees)
    const floor1AvgActive = SpireDirector.isActive();
    for (let i = 0; i < 6; i++) {
      SpireDirector.update(0.08);
      SpireDirector.render();
    }
    while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);

    // 3) Verify all 16 floors have scripted AVG dialogues & Floors 4/8/12/16 play Entrance CG + Phase2 + Redemption Defeat CG + Farewell AVG
    const bossFloors = [4, 8, 12, 16];
    let bossStoryCount = 0;
    for (const bf of bossFloors) {
      wave = bf;
      beginWave();
      if (!SpireDirector.isBlockingGameplay()) return { ok: false, msg: 'Boss floor ' + bf + ' did not trigger entrance story' };
      SpireDirector.update(0.2);
      SpireDirector.render();
      while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);
      player.weapons = []; player.hp = 99999; player.maxHp = 99999;
      for (let k = 0; k < 25; k++) update(0.05);

      const boss = enemies.find(e => e.type === 'boss');
      if (!boss) return { ok: false, msg: 'Boss missing on floor ' + bf };
      boss.canPhase2 = true;
      hurtEnemy(boss, boss.maxHp + 99999, true); // Triggers Phase 2 + SpireDirector.onBossPhase2
      SpireDirector.update(0.15);
      SpireDirector.render();
      while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);

      hurtEnemy(boss, boss.maxHp + 99999, true); // Kills Boss -> Triggers SpireDirector.onBossDefeated (Redemption CG + Farewell AVG)
      if (!SpireDirector.isBlockingGameplay()) return { ok: false, msg: 'Boss defeat on floor ' + bf + ' did not trigger Redemption CG & Farewell dialogue' };
      SpireDirector.update(0.25);
      SpireDirector.render();
      SpireDirector.advanceOrSkip(true); // skip Redemption CG -> Farewell AVG
      SpireDirector.update(0.15);
      SpireDirector.render();
      while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);
      bossStoryCount++;
    }

    // 4) Verify AVG auto-play toggle & Qingyu's Left-Column Half-Body Portrait + interactive click chat in Shop
    SpireDirector.setAutoPlay(true);
    const autoEnabled = SpireDirector.isAutoPlay();
    SpireDirector.setAutoPlay(false);

    wave = 4;
    openShop(true);
    const initialWhisper = document.getElementById('shopSub').textContent;
    document.getElementById('shopMerchantPortrait').click();
    const clickedWhisper = document.getElementById('shopSub').textContent;
    return {
      ok: true,
      replayActive,
      backToMenu,
      openingStartedOnNewRun,
      curtainActive,
      floor1AvgActive,
      bossStoryCount,
      autoEnabled,
      initialWhisper,
      clickedWhisper
    };
  })()`, s);

  assert.strictEqual(directorAudit.ok, true, directorAudit.msg || "SpireDirector audit failed");
  assert.strictEqual(directorAudit.replayActive, true, "replayOpeningCutscene() must activate Opening Cutscene");
  assert.strictEqual(directorAudit.backToMenu, true, "Skipping Menu Opening Replay must cleanly return to Start Menu");
  assert.strictEqual(directorAudit.openingStartedOnNewRun, true, "startGame() must automatically play the 3-shot Opening Cutscene");
  assert.strictEqual(directorAudit.curtainActive, true, "Act I Curtain must follow Opening Cutscene");
  assert.strictEqual(directorAudit.floor1AvgActive, true, "Floor 1 AVG Dialogue must follow Act I Curtain");
  assert.strictEqual(directorAudit.bossStoryCount, 4, "All 4 Act Bosses (Floors 4, 8, 12, 16) must play Entrance CG, Phase 2 & Defeat Redemption sequences");
  assert.strictEqual(directorAudit.autoEnabled, true, "SpireDirector auto-play toggle must switch cleanly");
  assert(els.shopMerchantPortrait.src.includes("port_qingyu.jpg"), "Shop header must display Qingyu's left-column anime portrait");
  assert(directorAudit.initialWhisper.includes("烬羽"), "Post-Floor-4 shop whisper (#shopSub) must reflect Floor 4 story progression");
  assert.notStrictEqual(directorAudit.clickedWhisper, directorAudit.initialWhisper, "Clicking Qingyu's shop portrait must cycle interactive dialogue");
  const tallPortraitDraws = directorDraws.filter(d => d.img && d.img.height === 768 && d.args.length === 8 && d.args[7] >= 495);
  assert(tallPortraitDraws.length >= 6, `AVG Director must render Left-Column 768px Half-Body Standees at tall >=55% viewport height (saw ${tallPortraitDraws.length} draws)`);
  assert.strictEqual(vm.runInContext("logErrCount", s), 0, "Zero runtime errors in Suite 2");
}

// ============================================================================
// Suite 3: Action Clarity (2.0x Retina DPR, 1.0x Floor Scale) & 4-Frame Sprite Sheet Fluidity + Zero Gradients/ShadowBlur
// ============================================================================
{
  const { sandbox: s, stats, gameDraws } = createEnv(false, 1440, 900, 2);
  assert.strictEqual(vm.runInContext("dpr", s), 2, "Desktop Retina DPR must run at crisp 2.0x");

  const actionAudit = vm.runInContext(`(() => {
    startGame('brawler'); // Jinyu
    while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);
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
      while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);
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

    return { ok: true, sheetsValid, flipLeft, midTurnFlip, atkPoseTriggered, floorScale: curFloorScale, dashArtsTested, sigBossesVerified };
  })()`, s);

  assert.strictEqual(actionAudit.ok, true, actionAudit.reason || "Action & Boss Signature audit failed");
  assert.strictEqual(actionAudit.sheetsValid, true, "All 6 1024x256 4-frame hero sprite sheets (normal + hit-flash) must pre-bake cleanly");
  assert(actionAudit.flipLeft < -0.5 && Math.abs(actionAudit.midTurnFlip) < 0.95, "Hero turn-around must smoothly interpolate _visFlip instead of snapping");
  assert.strictEqual(actionAudit.atkPoseTriggered, true, "Weapon fire/slash must trigger hero _atkPoseT attack animation pose");
  assert.strictEqual(actionAudit.floorScale, 1.0, "Desktop floor texture must bake at crisp 1.0x native resolution");
  assert.strictEqual(actionAudit.dashArtsTested, 6, "All 6 heroes must execute their signature Soul Dash arts & slice projectiles");
  assert.strictEqual(actionAudit.sigBossesVerified, 4, "All 4 Fixed Act Bosses must telegraph and unleash their signature named skills");

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
    while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);

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

    // 1) Boss Floor One-Shot Protection (<= 42% maxHp single-hit cap on Boss floors 4/8/12/16)
    wave = 4; beginWave();
    player.maxHp = 100; player.hp = 100; player.armor = 0; player.dodge = 0; player.shield = 0; player.invuln = 0;
    hurtPlayer(500);
    const hpAfterBossNuke = player.hp;

    // 2) Codex all 5 tabs render cleanly with 6 heroes, 4 Spire scenes, 32 weapons, 68 items
    openCodex('weapons'); const wCnt = document.getElementById('codexGrid').children.length;
    setCodexTab('items'); const iCnt = document.getElementById('codexGrid').children.length;
    setCodexTab('heroes'); const hCnt = document.getElementById('codexGrid').children.length;
    setCodexTab('monsters'); const mCnt = document.getElementById('codexGrid').children.length;
    setCodexTab('world'); setCodexFilter('scene'); const sCnt = document.getElementById('codexGrid').children.length;
    closeCodex();

    // 3) Death Wave-Retry on Story Mode Floor 8 restores exact Floor 8 Boss ('frost_queen') & pre-wave state
    selectedDiff = 2;
    startStoryMode();
    while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);
    player.mats = 88;
    wave = 8; beginWave();
    while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);
    const preHp = player.maxHp;
    player.mats += 50;
    player.dodge = 0; player.armor = 0; player.shield = 0; player.invuln = 0;
    // Deal 3 hits to bypass one-shot protection and die cleanly
    for (let k = 0; k < 4; k++) { player.invuln = 0; hurtPlayer(999); }
    const diedCleanly = state === 'end';
    retryFailedWave();
    while (SpireDirector.isBlockingGameplay()) SpireDirector.advanceOrSkip(true);
    for (let k = 0; k < 25; k++) update(0.05);
    const retryBoss = enemies.find(e => e.type === 'boss');
    const retryOk = state === 'wave' && wave === 8 && player.cls === 'allrounder' && !endlessMode && player.mats === 88 && player.hp === preHp && retryBoss && retryBoss.variant === 'frost_queen';

    return {
      bootOnHome, storyViewShown, storyLockedToZero, returnedHome,
      endlessRosterCount, diffBtnsCount, sceneBtnsCount,
      combatHtmlOk, traitsHtmlOk, scenePaneShown, diffPaneRestored,
      keyDigitHero, keyArrowHero,
      endlessRangerOk, endlessShopTitle,
      hpAfterBossNuke, wCnt, iCnt, hCnt, mCnt, sCnt, diedCleanly, retryOk
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
  const mobPortraitStandees = mobDirDraws.filter(d => d.img && d.img.height === 768 && d.args.length === 8);
  assert(mobPortraitStandees.length >= 4, "Mobile Portrait AVG must render both foreground speaker and background listener standees cleanly");
  assert(coreCheck.hpAfterBossNuke >= 58, `Boss floor one-shot protection must cap single hit at <=42% maxHp (HP left: ${coreCheck.hpAfterBossNuke})`);
  assert.strictEqual(coreCheck.wCnt, 32, "Codex must render 32 weapons");
  assert.strictEqual(coreCheck.iCnt, 68, "Codex must render 68 items");
  assert.strictEqual(coreCheck.hCnt, 6, "Codex must render 6 Spire heroes");
  assert.strictEqual(coreCheck.mCnt, 37, "Codex must render all 37 unique Spire monsters, commanders & bosses");
  assert.strictEqual(coreCheck.sCnt, 4, "Codex must render 4 Spire scenes");
  assert.strictEqual(coreCheck.diedCleanly, true, "Multi-hit lethal damage must transition to end state");
  assert.strictEqual(coreCheck.retryOk, true, "retryFailedWave() on Floor 8 must restore exact checkpoint and fixed Boss frost_queen");
  assert(els.retryWaveBtn.textContent.includes("第 8 / 16 层"), "Retry button must use '第 X / 16 层' Spire terminology");
  assert.strictEqual(stats.radialGradients, 0, "Mobile combat & UI suite must create ZERO per-frame radial gradients");
  assert.strictEqual(stats.shadowBlurs, 0, "Mobile combat & UI suite must use ZERO shadowBlur");
  assert.strictEqual(vm.runInContext("logErrCount", s), 0, "Zero runtime errors in Suite 4");
}

// ============================================================================
// Suite 5: Standalone Single-File Offline Bundle (`烬塔残响_单文件离线版.html`) Verification
// ============================================================================
{
  let singlePath = path.join(ROOT, "烬塔残响_单文件离线版.html");
  let tempBuilt = false;
  if (!fs.existsSync(singlePath)) {
    singlePath = path.join(os.tmpdir(), `spire_singlefile_verify_${process.pid}.html`);
    execFileSync(process.execPath, [path.join(ROOT, "scripts/build-singlefile.mjs"), "--out", singlePath], { stdio: "ignore" });
    tempBuilt = true;
  }
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
      "assets/spire/cut_defeat_act1_1.jpg", "assets/spire/cut_defeat_act4_2.jpg"
    ]) {
      assert(typeof map[key] === "string" && map[key].startsWith("data:image/"), `Single-file bundle missing inline data URI for ${key}`);
    }
  } finally {
    if (tempBuilt && fs.existsSync(singlePath)) fs.unlinkSync(singlePath);
  }
}

console.log(`ALL 5 V1.3.7 VERIFICATION SUITES PASSED! Modular files: ${cssFiles.length} CSS + ${jsFiles.length} JS | Total JS: ${(code.length / 1024).toFixed(1)} KB`);
