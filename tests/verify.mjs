import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert";
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
assert.strictEqual(jsFiles.length, 17, "Expected 17 modular script files in index.html");

for (const rel of [...cssFiles, ...jsFiles, "manifest.json", "assets/icon.svg"]) {
  assert(fs.existsSync(path.join(ROOT, rel)), "Missing modular project file: " + rel);
}

const cssCombined = cssFiles.map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n");
const code = jsFiles.map(f => {
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  new vm.Script(src, { filename: f }); // syntax-check each individual module file
  return src;
}).join("\n\n");
const html = indexHtml + "\n<style>\n" + cssCombined + "\n</style>";

new vm.Script(code, { filename: "brotato_modular_bundle.js" });

function makeCtx(stats) {
  return new Proxy({
    arc(x, y, r) {
      if (typeof r !== 'number' || Number.isNaN(r) || r < 0) {
        throw new Error(`IndexSizeError: Failed to execute 'arc' on 'CanvasRenderingContext2D': The radius provided (${r}) is negative or NaN.`);
      }
    },
    ellipse(x, y, rx, ry) {
      if (typeof rx !== 'number' || typeof ry !== 'number' || Number.isNaN(rx) || Number.isNaN(ry) || rx < 0 || ry < 0) {
        throw new Error(`IndexSizeError: Failed to execute 'ellipse' on 'CanvasRenderingContext2D': Radii (${rx}, ${ry}) invalid.`);
      }
    },
    drawImage(img, ...args) {
      if (!img) throw new Error('TypeError: drawImage called with null image');
      for (const v of args) {
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          throw new Error(`TypeError: drawImage numeric arg invalid: ${v}`);
        }
      }
      if (args.length === 8 && typeof img.width === 'number' && typeof img.height === 'number') {
        const [sx, sy, sw, sh, , , dw, dh] = args;
        if (sx < 0 || sy < 0 || sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0 || sx + sw > img.width || sy + sh > img.height) {
          throw new Error(`IndexSizeError: drawImage source out of bounds (${sx},${sy},${sw},${sh}) vs (${img.width}x${img.height})`);
        }
      }
    },
    createRadialGradient: () => {
      if (stats) stats.radialGradients++;
      return { addColorStop() {} };
    },
    createLinearGradient: () => ({ addColorStop() {} }),
    measureText: () => ({ width: 20 })
  }, {
    get(target, prop) { return prop in target ? target[prop] : () => {}; },
    set(target, prop, val) {
      if (stats && prop === 'shadowBlur' && val > 0) stats.shadowBlurs++;
      target[prop] = val;
      return true;
    }
  });
}

function makeEl(tag = 'div', stats = null) {
  const listeners = {};
  const children = [];
  const el = {
    tagName: tag.toUpperCase(),
    width: tag.toLowerCase() === 'canvas' ? 300 : undefined,
    height: tag.toLowerCase() === 'canvas' ? 150 : undefined,
    style: {},
    children,
    scrollTop: 0,
    scrollHeight: 200,
    disabled: false,
    textContent: '',
    value: '',
    href: '',
    download: '',
    _html: '',
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; if (v === '') children.length = 0; },
    get className() { return Array.from(this.classList._s).join(' '); },
    set className(v) {
      this.classList._s = new Set(String(v || '').split(/\s+/).filter(Boolean));
    },
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
      toggle(c, f) { if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else { f ? this._s.add(c) : this._s.delete(c); } }
    },
    appendChild(ch) { children.push(ch); return ch; },
    select() {},
    click() { if (this.onclick) this.onclick(); },
    remove() {},
    querySelector(sel) {
      if (!this._qs) this._qs = {};
      if (!this._qs[sel]) this._qs[sel] = makeEl('button');
      return this._qs[sel];
    },
    addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    dispatch(ev, obj) { (listeners[ev] || []).forEach(fn => fn(obj)); },
    getContext: () => makeCtx(stats)
  };
  return el;
}

function createEnv(mobile, w, h, dprVal = 3, audioMode = 'running') {
  const els = {};
  const stats = { radialGradients: 0, shadowBlurs: 0, downloads: [], clipboardText: '', oscStarted: 0 };
  const winListeners = {};
  let nowClock = 1000;

  class MockAudioContext {
    constructor() {
      this.state = audioMode === 'suspended' ? 'suspended' : 'running';
      this.currentTime = 0;
      this.destination = {};
    }
    resume() {
      if (audioMode === 'reject') return Promise.reject(new Error('NotAllowedError: user gesture required'));
      this.state = 'running';
      return Promise.resolve();
    }
    createOscillator() {
      if (this.state !== 'running') {
        throw new Error('AudioContext not running when createOscillator called!');
      }
      return {
        type: 'sine',
        frequency: {
          setValueAtTime(v) {
            if (!Number.isFinite(v) || v <= 0) throw new Error('Invalid oscillator freq: ' + v);
          },
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
          setValueAtTime(v) { if (!Number.isFinite(v) || v <= 0) throw new Error('Invalid gain: ' + v); },
          exponentialRampToValueAtTime(v) { if (!Number.isFinite(v) || v <= 0) throw new Error('Invalid ramp gain: ' + v); },
          linearRampToValueAtTime() {}
        },
        connect() {}
      };
    }
  }

  const sandbox = {
    Math, Date, Object, Array, Set, Number, String, Boolean, JSON, Error, Promise, console,
    setTimeout: fn => { fn(); return 1; },
    Blob: class Blob { constructor(parts, opts) { this.parts = parts; this.opts = opts; } },
    URL: {
      createObjectURL: () => 'blob:mock-log-url',
      revokeObjectURL: () => {}
    },
    performance: { now: () => nowClock },
    _advanceClock: ms => { nowClock += ms; return nowClock; },
    requestAnimationFrame: () => 1,
    navigator: {
      userAgent: mobile ? 'MockMobileSafari/17.0' : 'MockDesktopChrome/125.0',
      maxTouchPoints: mobile ? 5 : 0,
      clipboard: {
        writeText: txt => {
          stats.clipboardText = txt;
          return Promise.resolve();
        }
      }
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
      body: makeEl('body'),
      _docListeners: {},
      execCommand: () => true,
      addEventListener(ev, fn) { (this._docListeners[ev] = this._docListeners[ev] || []).push(fn); },
      dispatch(ev, obj) { (this._docListeners[ev] || []).forEach(fn => fn(obj)); },
      getElementById(id) {
        if (!els[id]) els[id] = makeEl(id === 'cv' ? 'canvas' : 'div', id === 'cv' ? stats : null);
        return els[id];
      },
      querySelector(sel) {
        if (!els[sel]) els[sel] = makeEl('div');
        return els[sel];
      },
      createElement(tag) {
        const el = makeEl(tag);
        if (tag === 'a') {
          el.click = function () { stats.downloads.push({ href: this.href, download: this.download }); };
        }
        return el;
      }
    }
  };
  if (mobile) sandbox.window.ontouchstart = null;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return { sandbox, els, stats };
}

// 1. Content Expansion (32 Weapons, 68 Items, 16 Upgrades), Desktop Arena, 5 Scenes & Zero Per-Frame Gradients
{
  const { sandbox: s, els, stats } = createEnv(false, 1440, 900, 2);
  assert.strictEqual(vm.runInContext('Object.keys(WEAPONS).length', s), 32, 'Should have 32 distinct weapons');
  assert.strictEqual(vm.runInContext('ITEMS.length', s), 68, 'Should have 68 passive items');
  assert.strictEqual(vm.runInContext('UPGRADES.length', s), 16, 'Should have 16 level-up stat choices');
  assert.strictEqual(vm.runInContext('WORLD.w', s), 2200, 'Desktop WORLD.w should be 2200');
  assert.strictEqual(vm.runInContext('WORLD.h', s), 1500, 'Desktop WORLD.h should be 1500');
  assert.strictEqual(vm.runInContext('uiMode', s), 'desktop', 'PC browser must stay in desktop UI mode');
  assert.strictEqual(s.document.body.classList.contains('m-ui'), false, 'PC browser body must NOT have m-ui class');

  const sceneIds = ['wasteland', 'desert', 'glacier', 'foundry', 'fungal'];
  for (const scId of sceneIds) {
    vm.runInContext(`selectedScene = "${scId}"; startGame("allrounder"); update(0.05); draw();`, s);
    assert.strictEqual(vm.runInContext('curScene.id', s), scId, `Scene ${scId} must activate`);
  }

  vm.runInContext('selectedDiff = 5; startGame("allrounder"); wave = 12; beginWave(); bossCutscene = null;', s);
  stats.radialGradients = 0;
  stats.shadowBlurs = 0;
  const allEnemyTypes = ["chaser","swarmer","shooter","mortar","charger","bomber","splitter","mini_slime","shielder","summoner","healer","brute","mini_boss","boss"];
  for (const t of allEnemyTypes) vm.runInContext(`createEnemy(player.x + 80, player.y - 60, "${t}")`, s);
  vm.runInContext('ITEMS.forEach(it => { player.items[it.id] = 1; it.apply(player); });', s);
  const allWeaponIds = vm.runInContext('Object.keys(WEAPONS)', s);
  for (const wId of allWeaponIds) {
    vm.runInContext(`player.weapons = [makeWeapon("${wId}", 4)]; player.weapons[0].cd = 0; update(0.05); draw();`, s);
  }
  for (const cls of ["allrounder","ranger","brawler","engineer","vampire","multitasker","bull","ghost"]) {
    vm.runInContext(`player.cls = "${cls}"; draw();`, s);
  }
  assert.strictEqual(stats.radialGradients, 0, 'draw() must NOT create per-frame radial gradients');
  assert.strictEqual(stats.shadowBlurs, 0, 'draw() must NOT use expensive shadowBlur');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'All 22 weapons, 36 items, 8 classes & 14 enemies must render with zero errors');
}

// 2. Prominent Mobile Countdown, Cheaper Shop Rerolls, Attack Range System, Alien Trees & Loot Crates
{
  const { sandbox: s, els } = createEnv(true, 390, 844, 3);
  s.window.dispatch('pointerdown', {}); // Unlock audio cleanly
  vm.runInContext('startGame("ranger");', s);

  // 2a. Mobile Countdown Capsule Prominence (Normal -> Warn <=10s -> Urgent <=5s + Overhead Badge)
  vm.runInContext('waveTime = 18; update(0.10); draw();', s);
  assert.strictEqual(els.timerCapsule.classList.contains('warn'), false, 'At 18s timerCapsule should not be warn');
  assert.strictEqual(els.timerCapsule.classList.contains('urgent'), false, 'At 18s timerCapsule should not be urgent');
  assert(els.timerFill.style.width.endsWith('%'), 'timerFill progress bar width must update live');

  vm.runInContext('waveTime = 8.5; update(0.10); draw();', s);
  assert.strictEqual(els.timerCapsule.classList.contains('warn'), true, 'At <=10s timerCapsule must have .warn class');

  vm.runInContext('waveTime = 4.2; update(0.10); draw();', s);
  assert.strictEqual(els.timerCapsule.classList.contains('urgent'), true, 'At <=5s timerCapsule must have .urgent class');
  assert.strictEqual(els.waveTimer.textContent, '5', 'Wave timer should display remaining ceil seconds');

  // 2b. Attack Range System (`📏 范围`)
  const rangerRange = vm.runInContext('getTotalRangeBonus()', s);
  assert.strictEqual(rangerRange, 65, 'Ranger class starts with +65 range');
  assert(vm.runInContext('player._displayRange', s) > 350, 'Ranger _displayRange should include +65 range bonus');
  vm.runInContext(`
    const gl = ITEMS.find(i => i.id === 'glasses');
    player.items.glasses = 1; gl.apply(player);
    const sc = ITEMS.find(i => i.id === 'sniper_cloak');
    player.items.sniper_cloak = 1; sc.apply(player);
    update(0.10);
    renderBuildSummary('statsRow', 'setsRow');
  `, s);
  assert.strictEqual(vm.runInContext('getTotalRangeBonus()', s), 65 + 45 + 90, 'Range bonus must sum class + items');
  assert(vm.runInContext('getEffectiveDmgMul()', s) > 1.10, 'sniper_cloak rangeToDmg must convert range bonus into damage %');
  assert(els.statsRow.innerHTML.includes('📏 范围'), 'statsRow must display 📏 范围');
  assert(els.mobQuickStats.innerHTML.includes('📏'), 'mobQuickStats must display 📏 range');

  // 2c. Alien Trees (`trees`) + Loot Crates (`crate`) + Harvesting (`harvestFlat`) + Crate Modal (`#crateMenu`)
  assert(vm.runInContext('trees.length', s) >= 1, 'beginWave() must spawn Alien Trees on battlefield');
  vm.runInContext(`
    player.harvestFlat = 20;
    player.luck = 80;
    const tr = trees[0];
    tr.x = player.x; tr.y = player.y;
    hurtTree(tr, 999);
    drops.push({ x: player.x, y: player.y, kind: 'crate', val: 1, bob: 0 });
    update(0.05);
  `, s);
  assert(vm.runInContext('pendingCrates', s) >= 1, 'Picking up crate drop must increment pendingCrates');
  const matsBeforeEnd = vm.runInContext('player.mats', s);
  vm.runInContext('finishWave();', s);
  assert(vm.runInContext('player.mats', s) >= matsBeforeEnd + 20, 'finishWave() must pay out harvestFlat diamonds');
  assert(Math.abs(vm.runInContext('player.harvestFlat', s) - 20 * 1.08) < 0.05, 'Harvesting must compound by +8% at end of wave');
  assert.strictEqual(vm.runInContext('state', s), 'crate', 'With pendingCrates > 0, finishWave() must open #crateMenu');
  assert.strictEqual(els.crateMenu.classList.contains('hidden'), false, 'crateMenu should be visible');

  // Test Recycle / Take button in Crate Menu
  vm.runInContext('pendingCrates = 1; showCrateMenu();', s);
  const crateCard = els.crateBox.children[0];
  crateCard.querySelector('.recycle-btn').onclick();
  assert.strictEqual(vm.runInContext('state === "shop" || state === "levelup"', s), true, 'Resolving crate transitions cleanly via advancePostWave()');

  // 2d. Cheaper Shop Rerolls & Free Reroll Recycler & Blacksmith Anvil
  vm.runInContext(`
    wave = 1;
    player.mats = 100;
    player.freeRerolls = 0;
    openShop(true);
  `, s);
  assert.strictEqual(vm.runInContext('rerollCost', s), 1, 'Wave 1 base shop reroll cost must be 1 diamond');
  vm.runInContext('rerollShop();', s);
  assert.strictEqual(vm.runInContext('rerollCost', s), 2, 'Wave 1 second reroll should only step up by +1 to 2 diamonds');

  vm.runInContext(`
    player.freeRerolls = 1;
    player.hasAnvil = true;
    player.weapons = [makeWeapon('pistol', 1)];
    openShop(true);
  `, s);
  assert.strictEqual(vm.runInContext('rerollCost', s), 0, 'With recycler item, first reroll in shop must cost 0');
  assert(els.rerollBtn.textContent.includes('免费刷新'), 'Free reroll button should show 免费刷新');
  assert.strictEqual(vm.runInContext('player.weapons[0].tier', s), 2, 'Blacksmith Anvil must auto-upgrade a weapon on shop open');
  assert(els.shopCards.children.some(c => c.innerHTML.includes('📏')), 'Weapon shop cards should display effective 📏 range');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero errors across countdown, range, trees, crates & shop rerolls');
}

// 3. Forensic Torture Test for "有时候一受伤就直接卡死了" (`hurtPlayer` + Suspended Audio + Multi-Hit Death + Corner Shake)
{
  // 3a. Suspended / Rejecting AudioContext on Mobile Safari (user hasn't unlocked audio or iOS suspended it)
  const { sandbox: sSusp } = createEnv(true, 390, 844, 3, 'suspended');
  vm.runInContext(`
    startGame("bull");
    player.thorns = 18;
    player.shieldMax = 1; player.shield = 1;
    createEnemy(player.x + 10, player.y, "chaser");
    createEnemy(player.x - 10, player.y, "bomber");
  `, sSusp);
  // Corner positions + extreme screen shake test on floorCanvas drawImage
  const corners = [
    [30, 30], [1150, 30], [30, 1930], [1150, 1930], [590, 980]
  ];
  for (const [cx, cy] of corners) {
    vm.runInContext(`
      player.x = ${cx}; player.y = ${cy};
      player.invuln = 0; player.hp = 80;
      hurtPlayer(12);
      shake = 18;
      update(0.05);
      draw();
    `, sSusp);
  }
  assert.strictEqual(vm.runInContext('logErrCount', sSusp), 0, 'Taking damage with suspended AudioContext & corner camera shake must NEVER error or freeze');

  // 3b. Test all 8 classes taking damage, dodging (`ghost`), thorns (`thorns`), cyberball, tentacle & multi-source lethal frame
  const { sandbox: sRun } = createEnv(true, 390, 844, 3, 'running');
  sRun.window.dispatch('touchstart', {});
  for (const cls of ["allrounder","ranger","brawler","engineer","vampire","multitasker","bull","ghost"]) {
    vm.runInContext(`
      startGame("${cls}");
      player.thorns = 15;
      player.cyberball = 10;
      player.critHeal = 0.2;
      createEnemy(player.x + 12, player.y, "charger");
      createEnemy(player.x - 12, player.y, "bomber");
      spawnHazard(player.x, player.y, 65, 10, 0.02);
      eBullets.push({ x: player.x, y: player.y, vx: 0, vy: 0, r: 8, dmg: 10, life: 2, color: "#ff5577" });
      for (let k = 0; k < 8; k++) { player.invuln = 0; player.hp = 100; update(0.05); draw(); }
    `, sRun);
  }

  // 3c. Lethal Multi-Hit in a Single Frame (must halt wave cleanly on death without re-entrant crash)
  vm.runInContext(`
    startGame("bull");
    player.hp = 5;
    player.armor = 0;
    player.dodge = 0;
    player.invuln = 0;
    createEnemy(player.x, player.y, "brute");
    createEnemy(player.x + 2, player.y, "charger");
    eBullets.push({ x: player.x, y: player.y, vx: 0, vy: 0, r: 10, dmg: 50, life: 2, color: "#ff5577" });
    spawnHazard(player.x, player.y, 70, 50, 0.01);
    update(0.05);
    draw();
  `, sRun);
  assert.strictEqual(vm.runInContext('state', sRun), 'end', 'Lethal hit must cleanly transition state to end');
  assert.strictEqual(vm.runInContext('logErrCount', sRun), 0, 'Zero errors across all hurtPlayer torture scenarios');
}

// 4. Illustrated Codex (`#codexModal`) — All 5 Categories & Sub-Filters
{
  const { sandbox: s, els } = createEnv(true, 390, 844, 3);
  assert.strictEqual(vm.runInContext('MONSTER_CODEX.length', s), 31, 'Codex should catalog all 31 monsters, scene-exclusives, bosses & special bosses');
  vm.runInContext('openCodex("weapons");', s);
  assert.strictEqual(els.codexModal.classList.contains('hidden'), false, 'openCodex must show #codexModal');
  assert.strictEqual(els.codexGrid.children.length, 32, 'Weapons tab must render all 32 weapons');
  vm.runInContext('setCodexFilter("elemental");', s);
  assert(els.codexGrid.children.length >= 5 && els.codexGrid.children.length < 32, 'Weapon set filter must filter weapon cards');

  vm.runInContext('setCodexTab("items");', s);
  assert.strictEqual(els.codexGrid.children.length, 68, 'Items tab must render all 68 items');
  vm.runInContext('setCodexFilter("4");', s);
  assert(els.codexGrid.children.length >= 12 && els.codexGrid.children.length < 68, 'Tier 4 filter must filter item cards (12 unique legendaries)');

  vm.runInContext('setCodexTab("heroes");', s);
  assert.strictEqual(els.codexGrid.children.length, 8, 'Heroes tab must render all 8 potato classes');

  vm.runInContext('setCodexTab("monsters");', s);
  assert.strictEqual(els.codexGrid.children.length, 31, 'Monsters tab must render all 31 monster & boss entries');
  for (const cat of ['normal', 'scene', 'boss', 'special']) {
    vm.runInContext(`setCodexFilter("${cat}");`, s);
    assert(els.codexGrid.children.length > 0, `Monster filter ${cat} must have entries`);
  }

  vm.runInContext('setCodexTab("world");', s);
  assert.strictEqual(els.codexGrid.children.length, 13, 'World & Relics tab must render 5 scenes + 5 terrains + 3 special relics');
  vm.runInContext('setCodexFilter("scene");', s);
  assert.strictEqual(els.codexGrid.children.length, 5, 'World scene filter must render 5 scenes');
  vm.runInContext('setCodexFilter("terrain");', s);
  assert.strictEqual(els.codexGrid.children.length, 5, 'World terrain filter must render 5 interactive terrains/portals');
  vm.runInContext('setCodexFilter("relic");', s);
  assert.strictEqual(els.codexGrid.children.length, 3, 'World relic filter must render 3 special relics');

  s.window.dispatch('keydown', { key: 'Escape' });
  assert.strictEqual(els.codexModal.classList.contains('hidden'), true, 'Escape key must close #codexModal first');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Codex rendering must produce zero errors');
}

// 5. Randomized Boss Varieties (4 Final Bosses + 3 Elite Commanders) & Rare Map Relics Summoning 3 Special Bosses
{
  const { sandbox: s, els, stats } = createEnv(false, 1440, 900, 2);
  vm.runInContext('selectedDiff = 5; startGame("allrounder");', s);

  // 5a. Verify all 4 Final Bosses & Twin Boss distinct variants
  const bossIds = vm.runInContext('Object.keys(BOSS_DEFS)', s);
  assert.strictEqual(bossIds.length, 4, 'Should define 4 distinct Final Bosses');
  vm.runInContext('wave = 12; beginWave(); for (let k = 0; k < 25; k++) update(0.05); draw();', s);
  const spawnedBossVariants = vm.runInContext('enemies.filter(e => e.type === "boss").map(e => e.variant)', s);
  assert.strictEqual(spawnedBossVariants.length, 2, 'Twin Boss difficulty on Wave 12 must spawn 2 Final Bosses');
  assert.notStrictEqual(spawnedBossVariants[0], spawnedBossVariants[1], 'Twin Bosses should spawn 2 distinct Boss variants');

  for (const bVar of bossIds) {
    vm.runInContext(`{
      bossCutscene = null; enemies = []; eBullets = []; hazards = [];
      const b = createEnemy(player.x + 210, player.y - 120, 'boss', '${bVar}');
      b.hp = b.maxHp * 0.45; // Test enraged phase too!
      for (let step = 0; step < 60; step++) { player.hp = player.maxHp; update(0.05); }
      draw();
    }`, s);
    assert(els['.boss-name'].textContent.length > 2, `HUD boss name should update for ${bVar}`);
  }

  // 5b. Verify all 3 Elite Commanders
  const miniIds = vm.runInContext('Object.keys(MINI_BOSS_DEFS)', s);
  assert.strictEqual(miniIds.length, 3, 'Should define 3 distinct Elite Commanders');
  for (const mVar of miniIds) {
    vm.runInContext(`{
      enemies = []; eBullets = []; hazards = [];
      createEnemy(player.x + 190, player.y - 90, 'mini_boss', '${mVar}');
      for (let step = 0; step < 50; step++) { player.hp = player.maxHp; update(0.05); }
      draw();
    }`, s);
  }

  // 5c. Verify all 3 Map Special Relics -> Proximity Charge -> Summon Special Boss -> Defeat Rewards
  const relicIds = ['blood_altar', 'golden_idol', 'void_cube'];
  for (const rId of relicIds) {
    vm.runInContext(`{
      wave = 5; beginWave();
      bossCutscene = null; relics = []; enemies = []; spawns = []; drops = [];
      const rel = spawnSpecialRelic('${rId}');
      // Off-screen pointer render check first
      rel.x = WORLD.w - 140; rel.y = WORLD.h - 140;
      player.x = 200; player.y = 200; cam.x = 200; cam.y = 200;
      draw();
      // Stand inside relic circle for 1.2s to summon Special Boss
      player.x = rel.x; player.y = rel.y;
      const beforeWaveTime = waveTime;
      for (let k = 0; k < 26; k++) { update(0.05); draw(); }
      globalThis.assertRelicConsumed = relics.length === 0;
      globalThis.assertTimeAdded = waveTime > beforeWaveTime + 15;
      // Step away while spawnWarning (0.90s) materializes Special Boss so auto-weapons don't kill it early
      bossCutscene = null;
      player.x = 200; player.y = 200;
      for (let k = 0; k < 25; k++) { player.hp = player.maxHp * 0.5; update(0.05); draw(); }
    }`, s);
    assert.strictEqual(vm.runInContext('assertRelicConsumed', s), true, `Relic ${rId} should be consumed after standing inside`);
    assert.strictEqual(vm.runInContext('assertTimeAdded', s), true, `Summoning ${rId} must extend waveTime`);
    const sbCount = vm.runInContext('enemies.filter(e => e.type === "special_boss").length', s);
    assert.strictEqual(sbCount, 1, `Relic ${rId} must spawn 1 special_boss`);
    assert.strictEqual(els.bossBarWrap.classList.contains('hidden'), false, 'Summoning special_boss must unhide #bossBarWrap');

    const dmgBefore = vm.runInContext('player.dmgMul', s);
    vm.runInContext(`{
      const sb = enemies.find(e => e.type === 'special_boss');
      sb.canPhase2 = false;
      bossCutscene = null;
      player.x = sb.x + 220; player.y = sb.y;
      for (let step = 0; step < 45; step++) { player.invuln = 0.5; update(0.05); draw(); }
      player.hp = Math.max(1, Math.floor(player.maxHp * 0.4));
      hurtEnemy(sb, sb.maxHp * 0.5, false);
      hurtEnemy(sb, sb.maxHp + 9999, true);
      update(0.10); draw();
    }`, s);
    if (rId === 'blood_altar') {
      assert.strictEqual(vm.runInContext('player.hp === player.maxHp', s), true, 'Crimson Lord must restore player to full HP');
      assert(vm.runInContext('drops.filter(d => d.kind === "crate").length', s) >= 1, 'Crimson Lord must drop 1 crate');
    } else if (rId === 'golden_idol') {
      assert(vm.runInContext('drops.filter(d => d.kind === "mat").reduce((a, d) => a + (d.val || 1), 0)', s) >= 65, 'Golden Golem must drop staged + death crystals');
    } else if (rId === 'void_cube') {
      assert(vm.runInContext('player.dmgMul', s) > dmgBefore + 0.11, 'Abyss Devourer must grant +12% permanent damage');
    }
  }
  assert.strictEqual(stats.radialGradients, 0, 'New bosses & relics must use zero per-frame radialGradients');
  assert.strictEqual(stats.shadowBlurs, 0, 'New bosses & relics must use zero shadowBlur');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'All Bosses, Commanders & Special Relics must run with zero errors');
}

// 6. Progressive & Probabilistic Scene-Exclusive Monsters (5) & Scene-Exclusive Events (5)
{
  const { sandbox: s } = createEnv(true, 390, 844, 3);
  vm.runInContext('startGame("allrounder");', s);

  // Wave 1 & Wave 2 must NEVER force scene-exclusive monsters or events
  for (let trial = 0; trial < 15; trial++) {
    vm.runInContext('wave = 1; beginWave();', s);
    assert.strictEqual(vm.runInContext('sceneMobEnabled', s), false, 'Wave 1 must never enable scene-exclusive monsters');
    assert.strictEqual(vm.runInContext('activeSceneEvent', s), null, 'Wave 1 must never enable scene-exclusive events');
    vm.runInContext('wave = 2; beginWave();', s);
    assert.strictEqual(vm.runInContext('sceneMobEnabled', s), false, 'Wave 2 must never enable scene-exclusive monsters');
    assert.strictEqual(vm.runInContext('activeSceneEvent', s), null, 'Wave 2 must never enable scene-exclusive events');
  }

  // Wave 5 probabilistic check (neither 0% nor 100% mandatory)
  let mobTrue = 0, mobFalse = 0;
  for (let trial = 0; trial < 60; trial++) {
    vm.runInContext('wave = 5; beginWave();', s);
    if (vm.runInContext('sceneMobEnabled', s)) mobTrue++; else mobFalse++;
  }
  assert(mobTrue > 0 && mobFalse > 0, `Wave 5 scene-exclusive monsters should be probabilistic (got ${mobTrue} true, ${mobFalse} false)`);

  // Test all 5 scene-exclusive monsters & all 5 scene events in combat + rendering
  const scenePairs = [
    ['wasteland', 'rad_scorpion', 'rad_meteor'],
    ['desert', 'sand_worm', 'sandstorm'],
    ['glacier', 'frost_wisp', 'blizzard'],
    ['foundry', 'magma_imp', 'geysers'],
    ['fungal', 'spore_mother', 'spore_tide']
  ];
  for (const [scId, mobType, evId] of scenePairs) {
    vm.runInContext(`{
      selectedScene = '${scId}';
      wave = 6; beginWave();
      sceneMobEnabled = true;
      activeSceneEvent = '${evId}';
      sceneEventT = 0.05;
      const m = createEnemy(player.x + 170, player.y - 60, '${mobType}');
      for (let k = 0; k < 45; k++) { player.hp = player.maxHp; update(0.05); draw(); }
      hurtEnemy(m, 99999, true);
      update(0.05); draw();
    }`, s);
  }
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'All 5 scene-exclusive monsters & 5 scene events must run with zero errors');
}

// 7. CSS Layout Audit: Mobile Portrait Single-Column + Larger Fonts + Desktop Centered Overlays
{
  const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  assert(cssMatch, 'Style tag must exist');
  const css = cssMatch[1];

  // Verify overlay centering fix (no broken .overlay > :last-child rule, uses .overlay::before & .overlay::after)
  assert(!css.includes('.overlay > :last-child'), 'Must not use .overlay > :last-child which breaks when .m-only is hidden on desktop');
  assert(css.includes('.overlay::before') && css.includes('.overlay::after'), 'Must center overlays via flex pseudo-spacers');

  // Verify desktop 4-column grids remain intact
  assert(/\.classes\s*\{[^}]*repeat\(4,/.test(css), 'Desktop .classes must remain 4-column');
  assert(/\.cards\s*\{[^}]*repeat\(4,/.test(css), 'Desktop .cards must remain 4-column');

  // Verify mobile portrait uses single-screen 2x4 grid for 8 classes, 1x4 single-column rows for shop/levelup, and 1fr for codex-grid
  assert(/body\.m-portrait\s+\.classes\s*\{[^}]*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(css), 'Mobile portrait .classes must be 2x4 single-screen grid');
  assert(/body\.m-portrait\s+#shopCards\s*\{[^}]*grid-template-columns:\s*1fr/.test(css), 'Mobile portrait #shopCards must be single-column (1fr) x 4 rows');
  assert(/body\.m-portrait\s+\.codex-grid[^{]*\{[^}]*grid-template-columns:\s*1fr/.test(css), 'Mobile portrait .codex-grid must be single-column (1fr)');
}

// 8. Balance Overhaul, 80% Global Dodge Cap, Crate Cap, 4 New Monsters, Widened Stat Spread & Clean Attack FX
{
  const { sandbox: s, stats } = createEnv(false, 1440, 900, 2);

  // 8a. Difficulty Curve Monotonicity (hpMul, dmgMul, spawnMul all strictly scale up from D0 -> D5)
  const diffs = vm.runInContext('DIFFS', s);
  for (let i = 1; i < diffs.length; i++) {
    assert(diffs[i].hpMul > diffs[i - 1].hpMul, `D${i} hpMul must exceed D${i - 1}`);
    assert(diffs[i].dmgMul > diffs[i - 1].dmgMul, `D${i} dmgMul must exceed D${i - 1}`);
    assert(diffs[i].spawnMul > diffs[i - 1].spawnMul, `D${i} spawnMul must exceed D${i - 1}`);
  }

  // 8b. Player Starting Stats (Higher HP, Lower Move Speed, Slower Initial Attack Speed, Global 80% Dodge Cap)
  for (const cls of ["allrounder","ranger","brawler","engineer","vampire","multitasker","bull","ghost"]) {
    vm.runInContext(`startGame("${cls}");`, s);
    assert.strictEqual(vm.runInContext('player.dodgeCap', s), 0.80, `${cls} must have 80% global dodge cap`);
    assert.strictEqual(vm.runInContext('player.spd', s), 182, `${cls} base spd must be lowered to 182`);
  }
  vm.runInContext('startGame("engineer");', s);
  assert.strictEqual(vm.runInContext('player.maxHp', s), 30, 'Base player HP must be 30');
  assert.strictEqual(vm.runInContext('player.atkSpd', s), 0.88, 'Base player atkSpd must be 0.88');

  // Stack 30 dodge items + upgrades -> must never exceed 0.80
  vm.runInContext(`
    const boots = ITEMS.find(i => i.id === 'boots');
    const adren = ITEMS.find(i => i.id === 'adren');
    const dodgeUpg = UPGRADES.find(u => u.name === '暗影闪避');
    for (let k = 0; k < 25; k++) { boots.apply(player); adren.apply(player); dodgeUpg.apply(player); }
  `, s);
  assert(Math.abs(vm.runInContext('player.dodge', s) - 0.80) < 1e-6, 'Player dodge must cap strictly at 80% (0.80)');

  // 8c. Per-Wave Crate Drop Cap & Lower High-Tier Shop Roll Rates
  vm.runInContext(`
    selectedDiff = 1; startGame("allrounder");
    player.luck = 10;
    wave = 2; beginWave();
    for (let k = 0; k < 25; k++) {
      spawnTree();
      if (trees.length) hurtTree(trees[trees.length - 1], 9999);
      const el = createEnemy(player.x + 150, player.y, 'chaser');
      el.elite = true;
      hurtEnemy(el, 99999, true);
    }
  `, s);
  assert(vm.runInContext('waveCratesDropped', s) <= 1, 'Normal luck wave crate drops from trees + elites must obey per-wave cap of 1');

  // Wave 1 & Wave 2 shop should never roll T4 items, and Wave 1 should roll 100% T1
  let w1High = 0;
  vm.runInContext('wave = 1; player.luck = 0;', s);
  for (let k = 0; k < 40; k++) {
    vm.runInContext('shopOffers = []; rollOffers();', s);
    w1High += vm.runInContext('shopOffers.filter(o => o.tier >= 2).length', s);
  }
  assert.strictEqual(w1High, 0, 'Wave 1 shop with 0 luck must not flood T2/T3/T4 gear');

  // 8d. Monster Stat Differentiation + 4 New Monsters + High-Density 115-Enemy Stress Test + All FX Shapes
  vm.runInContext(`
    selectedDiff = 4; wave = 8; beginWave();
    enemies = [];
    createEnemy(200, 200, 'swarmer');
    const sw = enemies[0];
    const st = createEnemy(260, 200, 'stalker');
    const sn = createEnemy(320, 200, 'sniper_bug');
    const sp = createEnemy(380, 200, 'spinner');
    const jg = createEnemy(460, 200, 'juggernaut');
    globalThis.diffSpreadOk = (sw.r <= 11 && jg.r >= 36) && (jg.maxHp > sw.maxHp * 15) && (sw.spd > jg.spd * 2.5) && (jg.dmg > sw.dmg * 3);
  `, s);
  assert.strictEqual(vm.runInContext('diffSpreadOk', s), true, 'Monster size, HP, speed, and damage must have wide archetype differentiation');

  // Stress-test 115 active enemies including all 4 new monsters, sniper sightlines, charge lock lines, all slash modes & all eBullet shapes
  stats.radialGradients = 0;
  stats.shadowBlurs = 0;
  const newPool = ['chaser','swarmer','stalker','shooter','charger','bomber','sniper_bug','splitter','spinner','shielder','mortar','brute','summoner','healer','juggernaut'];
  vm.runInContext(`
    enemies = []; eBullets = []; slashes = [];
    const pool = ${JSON.stringify(newPool)};
    for (let i = 0; i < 105; i++) {
      const ang = (i / 105) * Math.PI * 2;
      const dist = 160 + (i % 6) * 45;
      createEnemy(player.x + Math.cos(ang) * dist, player.y + Math.sin(ang) * dist, pool[i % pool.length]);
    }
    player.weapons = [makeWeapon('stick', 2), makeWeapon('claws', 2), makeWeapon('knife', 2), makeWeapon('spear', 2), makeWeapon('katana', 2), makeWeapon('icicle', 2)];
    for (let step = 0; step < 35; step++) {
      player.hp = player.maxHp; player.invuln = 0.2;
      update(0.05);
      draw();
    }
  `, s);
  assert.strictEqual(stats.radialGradients, 0, 'High-density 105+ enemy wave with new FX must create zero radialGradients');
  assert.strictEqual(stats.shadowBlurs, 0, 'High-density 105+ enemy wave with new FX must use zero shadowBlur');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero errors in Suite 8 balance, new monsters & clean FX stress test');
}

// 9. UI Mode Selector (`uiPref`) + Single-Screen Zero-Scroll Mobile Layout (`100dvh`, `overflow: hidden`) + Thumb Buttons
{
  // 9a. CSS audit for single-screen zero-scroll mobile layout & decoupled pixel-aligned thumb button column
  assert(html.includes('height: 100%; max-height: 100vh; max-height: 100dvh; overflow: hidden;'), 'Mobile overlay must lock to 100vh/100dvh single screen with overflow: hidden');
  assert(html.includes('.card-main, .card-side { display: contents; }'), 'Desktop PC must preserve exact layout via display: contents on .card-main / .card-side');
  assert(html.includes('body.m-ui #shopCards .card-side') && html.includes('width: 112px; flex-shrink: 0;'), 'Mobile shop cards must use decoupled 112px right-side .card-side flex column');
  assert(html.includes('grid-auto-flow: column; grid-auto-columns: calc((100% - 25px) / 6);'), 'Mobile weapon arsenal must stay on 1 single 6-slot horizontal row');
  assert(html.includes('body.m-portrait .pause-btn') && html.includes('min-height: 46px; min-width: 98px;'), 'Mobile portrait pause button must be dedicated 98x46px button');
  assert(html.includes('body.m-ui .lock-pin') && html.includes('height: 31px; min-height: 31px;') && html.includes('border-width: 1.5px 1.5px 3px 1.5px;'), 'Mobile shop lock button and buy button must share identical 1.5px/3px bevel and centered axis');
  assert(html.includes('body.m-ui #shopMenu.drawer-open #shopCards'), 'Mobile stats drawer must toggle in-place inside single screen without page overflow');

  // 9b. Desktop browser (1440x900) switching manually to Mobile Mode & back
  const { sandbox: sDesk, els: dEls } = createEnv(false, 1440, 900, 2);
  const dBody = sDesk.document.body.classList;
  assert.strictEqual(vm.runInContext('uiPref', sDesk), 'auto', 'Default uiPref must be auto');
  assert.strictEqual(vm.runInContext('uiMode', sDesk), 'desktop', 'Desktop browser in auto mode must resolve to desktop');
  assert.strictEqual(dEls.uiModeTabs.children.length, 3, 'Start menu must render 3 UI mode selector buttons');

  // Click "📱 手机触控版" button on Start Menu
  dEls.uiModeTabs.children[1].onclick();
  assert.strictEqual(vm.runInContext('uiPref', sDesk), 'mobile', 'Clicking 2nd mode tab must set uiPref = mobile');
  assert.strictEqual(vm.runInContext('uiMode', sDesk), 'mobile-landscape', '1440x900 forced mobile mode must activate mobile-landscape');
  assert.strictEqual(dBody.contains('m-ui'), true, 'Forcing mobile mode on PC must enable body.m-ui');

  // Click back to "🔄 自动"
  dEls.uiModeTabs.children[0].onclick();
  assert.strictEqual(vm.runInContext('uiMode', sDesk), 'desktop', 'Returning to auto on PC must restore desktop UI');
  assert.strictEqual(dBody.contains('m-ui'), false, 'Returning to auto on PC must remove body.m-ui');

  // 9c. Mobile browser (390x844 & compact 375x667) switching UI modes, in-place drawer, and Lock button label toggle
  const { sandbox: sMob, els: mEls } = createEnv(true, 375, 667, 2);
  const mBody = sMob.document.body.classList;
  assert.strictEqual(vm.runInContext('uiMode', sMob), 'mobile-portrait', 'Mobile 375x667 in auto must resolve to mobile-portrait');
  assert.strictEqual(mBody.contains('m-ui') && mBody.contains('m-portrait'), true, 'Mobile auto must set m-ui and m-portrait');
  assert(vm.runInContext('camZoom', sMob) <= 0.64 && (375 / vm.runInContext('camZoom', sMob)) >= 680, 'Mobile portrait initial camZoom must be pulled higher (>=680px world width FOV)');

  const { sandbox: sMobLand } = createEnv(true, 844, 390, 2);
  assert(vm.runInContext('camZoom', sMobLand) <= 0.62 && (390 / vm.runInContext('camZoom', sMobLand)) >= 680, 'Mobile landscape initial camZoom must be pulled higher (>=680px world height FOV)');

  // Test Pause Menu UI switch (`cycleUIPref`)
  vm.runInContext('startGame("allrounder"); pauseGame();', sMob);
  assert(mEls.pauseUiBtn.textContent.includes('自动'), 'Pause UI button must show current auto status');
  vm.runInContext('cycleUIPref();', sMob); // auto -> mobile
  assert.strictEqual(vm.runInContext('uiPref', sMob), 'mobile', 'First cycleUIPref must switch to mobile');
  vm.runInContext('cycleUIPref();', sMob); // mobile -> desktop
  assert.strictEqual(vm.runInContext('uiPref', sMob), 'desktop', 'Second cycleUIPref must switch to desktop');
  assert.strictEqual(vm.runInContext('uiMode', sMob), 'desktop', 'Forced desktop mode on phone must switch uiMode to desktop');
  assert.strictEqual(mBody.contains('m-ui'), false, 'Forced desktop mode must remove m-ui');
  vm.runInContext('cycleUIPref();', sMob); // desktop -> auto
  assert.strictEqual(vm.runInContext('uiMode', sMob), 'mobile-portrait', 'Third cycleUIPref must restore auto mobile-portrait');

  // Test Shop Lock button + In-place drawer auto-closing on rerollShop()
  vm.runInContext('resumeGame(); player.mats = 50; finishWave(); openShop(true);', sMob);
  const firstCard = mEls.shopCards.children[0];
  assert(firstCard.innerHTML.includes('🔓') && firstCard.innerHTML.includes('锁定'), 'Unlocked shop card must display clear 🔓 锁定 text');
  firstCard.querySelector('.lock').onclick();
  const lockedCard = mEls.shopCards.children[0];
  assert(lockedCard.innerHTML.includes('🔒') && lockedCard.innerHTML.includes('已锁'), 'Locked shop card must display clear 🔒 已锁 text');
  assert(lockedCard.className.includes('is-locked'), 'Locked shop card must have .is-locked class');

  vm.runInContext('toggleMobDrawer();', sMob);
  assert.strictEqual(mEls.shopMenu.classList.contains('drawer-open'), true, 'toggleMobDrawer must open in-place stats view');
  vm.runInContext('rerollShop();', sMob);
  assert.strictEqual(mEls.shopMenu.classList.contains('drawer-open'), false, 'rerollShop must auto-close drawer back to shop cards');
  assert.strictEqual(vm.runInContext('logErrCount', sMob), 0, 'Zero runtime errors in Suite 9 single-screen mobile UI tests');
}


// 10. Modular Project Architecture, PWA Manifest & Extensible AudioBank Verification
{
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
  assert.strictEqual(manifest.display, "standalone", "PWA manifest must configure standalone fullscreen display");
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 1, "PWA manifest must declare app icon");
  const svg = fs.readFileSync(path.join(ROOT, "assets/icon.svg"), "utf8");
  assert(svg.includes("<svg") && svg.includes("</svg>"), "assets/icon.svg must be valid SVG");

  const { sandbox: sAudio, stats: aStats } = createEnv(false, 1280, 800, 2);
  assert.strictEqual(vm.runInContext("typeof AudioBank.registerSfx", sAudio), "function", "AudioBank.registerSfx must be available for external SFX");
  assert.strictEqual(vm.runInContext("typeof AudioBank.playBgm", sAudio), "function", "AudioBank.playBgm must be available for external BGM");
  // Unregistered key falls back cleanly to procedural WebAudio synth
  vm.runInContext("unlockAudio(); AudioBank.playSfx(\"laser_shot\", 660, 0.05, \"triangle\", 0.04);", sAudio);
  assert(aStats.oscStarted >= 1, "AudioBank.playSfx must fall back cleanly to procedural beep when external audio file is not registered");
}

// 11. v1.1.1 Loot Variety, Strict T4 Drop Caps, Move-Speed Floor & Versioned Date Diagnostic Logs
{
  const { sandbox: s, els, stats } = createEnv(false, 1440, 900, 2);
  vm.runInContext('startGame("engineer");', s);

  // 11a. Log Header + Entries + Export Filename must include Date & Code Version
  const curVer = vm.runInContext('APP_VERSION', s);
  assert.strictEqual(curVer, 'v1.3.4', 'APP_VERSION must be v1.3.4');
  const logTxt = vm.runInContext('getLogText()', s);
  assert(logTxt.includes(`Version: ${curVer} (BuildDate: 2026-11-12)`), 'Diagnostic log header must include Version & BuildDate');
  assert(new RegExp(`\\[\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2} \\+\\d+\\.\\d+s\\] \\[${curVer.replace(/\./g, '\\.')}\\]`).test(logTxt), 'Every log entry must carry YYYY-MM-DD HH:MM:SS date-time & code version');
  vm.runInContext('downloadLogs();', s);
  assert(stats.downloads.length >= 1 && stats.downloads[0].download.includes(curVer) && /\d{4}-\d{2}-\d{2}/.test(stats.downloads[0].download), 'Exported log filename must embed code version and date');

  // 11b. Strict High-Tier Probability Caps even at Wave 18 + 500 Luck (never flooding 100% T4!)
  const rates = vm.runInContext(`(() => {
    let crateT4 = 0, bossT4 = 0, shopT4 = 0;
    const N = 3000;
    for (let i = 0; i < N; i++) {
      if (rollCrateTier(18, 500, false) === 4) crateT4++;
      if (rollCrateTier(18, 500, true) === 4) bossT4++;
      if (rollShopTier(18, 500) === 4) shopT4++;
    }
    return { crateRate: crateT4 / N, bossRate: bossT4 / N, shopRate: shopT4 / N };
  })()`, s);
  assert(rates.crateRate <= 0.125, `Normal crate T4 rate must be strictly capped ~10% (got ${(rates.crateRate * 100).toFixed(1)}%)`);
  assert(rates.bossRate <= 0.175, `Boss crate T4 rate must be strictly capped ~14% (got ${(rates.bossRate * 100).toFixed(1)}%)`);
  assert(rates.shopRate <= 0.105, `Shop T4 rate must be strictly capped ~8% (got ${(rates.shopRate * 100).toFixed(1)}%)`);

  // 11c. Unique (`maxCount: 1`) & Limited (`maxCount: 2`) Items Never Repeat After Reaching Cap
  const neverRepeated = vm.runInContext(`(() => {
    wave = 12; player.luck = 100;
    player.items.anvil = 1;
    player.items.cornucopia = 1;
    player.items.reactor = 2;
    for (let i = 0; i < 200; i++) {
      const it = pickWeightedItem(4, new Set(), true);
      if (!it || it.id === 'anvil' || it.id === 'cornucopia' || it.id === 'reactor') return false;
      shopOffers = [];
      rollOffers();
      for (const o of shopOffers) {
        if (o.kind === 'item' && (o.item.id === 'anvil' || o.item.id === 'cornucopia' || o.item.id === 'reactor')) return false;
      }
    }
    return true;
  })()`, s);
  assert.strictEqual(neverRepeated, true, 'Capped T4 items already owned must NEVER appear again in crates or shop');

  // 11d. 2-Option Crate Pod & Per-Wave Crate Queue Hard Cap (<= 3, excess auto-converts to crystals + HP)
  vm.runInContext(`
    pendingCrates = 0;
    const matsBefore = player.mats;
    for (let k = 0; k < 6; k++) {
      drops.push({ x: player.x, y: player.y, kind: 'crate', isBoss: k === 0, bob: 0 });
    }
    update(0.05);
    globalThis.excessConverted = (pendingCrates === 3) && (player.mats > matsBefore);
    showCrateMenu();
  `, s);
  assert.strictEqual(vm.runInContext('excessConverted', s), true, 'Picking up >3 crates in a single wave must cap pendingCrates at 3 and convert excess to crystals');
  assert.strictEqual(els.crateBox.children.length, 2, 'Crate modal must offer 2 distinct tactical supply choices');

  // 11e. Movement Speed Penalty Floor (>= 72% even under heavy items + chill) & Hermes Wings Slow Immunity
  const spdCheck = vm.runInContext(`(() => {
    startGame('engineer');
    const bell = ITEMS.find(i => i.id === 'bell');
    const snail = ITEMS.find(i => i.id === 'snail');
    const anvil = ITEMS.find(i => i.id === 'anvil');
    for (let k = 0; k < 15; k++) { bell.apply(player); snail.apply(player); anvil.apply(player); }
    const baseEff = getEffectiveSpdMul();
    player.chillSlowT = 1.2;
    keys['d'] = true;
    const x0 = player.x;
    update(0.20);
    keys['d'] = false;
    const movedFloor = player.x - x0;
    const minExpected = player.spd * 0.72 * 0.20 - 0.5;

    // Now equip Hermes Wings -> immune to slow & >= 122% speed!
    const wings = ITEMS.find(i => i.id === 'hermes_wings');
    wings.apply(player);
    return { baseEff, movedFloor, minExpected, wingsEff: getEffectiveSpdMul(), noSlow: player.noSlow };
  })()`, s);
  assert(spdCheck.baseEff >= 0.72, `Player effective speed multiplier must never drop below 72% (got ${spdCheck.baseEff})`);
  assert(spdCheck.movedFloor >= spdCheck.minExpected, `Actual movement even while chilled must stay >= 72% base speed`);
  assert(spdCheck.noSlow && spdCheck.wingsEff >= 1.2, 'Hermes Wings must grant slow immunity and >= 120% move speed');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero errors in Suite 11 loot, speed & logging verification');
}

// 12. v1.1.2 Early-Wave Monster Count Smoothing & Ranged Enemy Spawn Ratio / Concurrent Cap
{
  const { sandbox: s } = createEnv(false, 1440, 900, 2);
  vm.runInContext('selectedDiff = 1; startGame("allrounder");', s);

  const spawnStats = vm.runInContext(`(() => {
    const checkWave = w => {
      wave = w; beginWave();
      enemies = []; spawns = [];
      let rangedPicks = 0;
      const N = 600;
      for (let i = 0; i < N; i++) {
        const t = pickWaveEnemyType(w);
        if (RANGED_ENEMY_TYPES.has(t)) rangedPicks++;
      }
      // Now verify concurrent ranged cap holds when spawning into spawns[]
      spawns = []; enemies = [];
      for (let i = 0; i < 40; i++) {
        const t = pickWaveEnemyType(w);
        spawnWarning(200, 200, t);
      }
      return { ratio: rangedPicks / N, cappedRanged: countActiveRangedEnemies(), maxAllowed: Math.min(10, 2 + Math.floor(w * 0.7)) };
    };
    return { w2: checkWave(2), w3: checkWave(3), w6: checkWave(6) };
  })()`, s);

  assert(spawnStats.w2.ratio <= 0.14, `Wave 2 ranged spawn ratio must be low <=14% (got ${(spawnStats.w2.ratio * 100).toFixed(1)}%)`);
  assert(spawnStats.w3.ratio <= 0.16, `Wave 3 ranged spawn ratio must be low <=16% (got ${(spawnStats.w3.ratio * 100).toFixed(1)}%)`);
  assert(spawnStats.w6.ratio <= 0.22, `Wave 6 ranged spawn ratio must stay controlled <=22% (got ${(spawnStats.w6.ratio * 100).toFixed(1)}%)`);
  assert(spawnStats.w2.cappedRanged <= spawnStats.w2.maxAllowed, 'Wave 2 concurrent ranged spawns must never exceed cap');
  assert(spawnStats.w3.cappedRanged <= spawnStats.w3.maxAllowed, 'Wave 3 concurrent ranged spawns must never exceed cap');
  assert(spawnStats.w6.cappedRanged <= spawnStats.w6.maxAllowed, 'Wave 6 concurrent ranged spawns must never exceed cap');

  // 12b. v1.1.3 Zero Map Shake on Attacking/Exploding/Killing Monsters; Gentle Shake ONLY on Player Hit
  const shakeCheck = vm.runInContext(`(() => {
    startGame('allrounder');
    wave = 12; beginWave();
    bossCutscene = null;
    shake = 0;
    player.weapons = [makeWeapon('hammer', 4), makeWeapon('rocket', 4)];
    player.weapons[0].cd = 0; player.weapons[1].cd = 0;
    const boss = createEnemy(player.x + 85, player.y, 'boss', 'butcher');
    boss.canPhase2 = false;
    update(0.05);
    triggerExplosion(boss.x, boss.y, 120, 500, false, 0, '#ff9f1c', true);
    hurtEnemy(boss, boss.maxHp + 99999, true);
    const attackShake = shake;

    // Now deal real HP damage to player -> gentle shake (<= 5)
    state = 'wave'; player.dodge = 0; player.shield = 0; player.invuln = 0; player.hp = 30;
    hurtPlayer(5);
    const hitShake = shake;
    return { attackShake, hitShake };
  })()`, s);
  assert.strictEqual(shakeCheck.attackShake, 0, 'Attacking, exploding, or killing monsters/bosses must NOT shake the map');
  assert(shakeCheck.hitShake > 0 && shakeCheck.hitShake <= 5, `Player taking HP damage should trigger gentle micro-shake (got ${shakeCheck.hitShake})`);
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero errors in Suite 12 spawn pacing, ranged cap & shake verification');
}

// 13. v1.1.4 Interactive Biome Terrains (Lava, Swamp, Chasm, Ice Sheet, Twin Portals) & Persistent Callouts/Banners
{
  const { sandbox: s, stats } = createEnv(false, 1440, 900, 2);
  vm.runInContext('selectedDiff = 2; startGame("allrounder");', s);

  const terrainCheck = vm.runInContext(`(() => {
    const kindsSeen = new Set();
    for (let idx = 0; idx < SCENES.length; idx++) {
      selectedScene = SCENES[idx].id;
      wave = 4;
      beginWave();
      for (const tr of terrains) kindsSeen.add(tr.kind);
      cam.x = terrains[0] ? terrains[0].x : WORLD.w * 0.5;
      cam.y = terrains[0] ? terrains[0].y : WORLD.h * 0.5;
      update(0.05);
      draw();
    }

    // Force deterministic wasteland setup on Wave 3 (guaranteed Twin Portals)
    selectedScene = 'wasteland'; wave = 3;
    beginWave();
    const hasPortals = portals.length === 2;
    const p0 = portals[0], p1 = portals[1];
    player.x = p0.x; player.y = p0.y;
    update(0.05);
    const warpedToB = Math.hypot(player.x - p1.x, player.y - p1.y) < 10 && portalPairCd > 4.0 && player.invuln >= 0.45;

    // Lava ignites enemies; Ice boosts player speed; Chasm pushes entities out
    terrains = [
      { kind: 'lava', x: 500, y: 500, r: 70, pulse: 0, seed: 1 },
      { kind: 'ice_sheet', x: 800, y: 500, r: 80, pulse: 0, seed: 2 },
      { kind: 'chasm', x: 1100, y: 500, x1: 1020, y1: 500, x2: 1180, y2: 500, ang: 0, halfLen: 80, r: 30, seed: 3 }
    ];
    const dummy = createEnemy(500, 500, 'grunt');
    player.x = 800; player.y = 500;
    update(0.05);
    const lavaIgnited = dummy.burnT > 0 && dummy.burnDmg > 0;
    const iceBoost = player.terrainSpdMul > 1.25;

    player.x = 1100; player.y = 500;
    pushOutOfChasms(player);
    const chasmClear = closestOnChasm(terrains[2], player.x, player.y);
    const pushedFromChasm = Math.hypot(player.x - 1100, player.y - 500) > 25 && chasmClear && chasmClear.gap >= player.r - 0.5;

    // Persistent callout & banner eviction protection under heavy bullet damage spam
    texts = []; banners = [];
    addText(player.x, player.y - 40, '✨ 关键奇遇提示!', '#ffd166', 18);
    const initDur = texts[0].t;
    for (let k = 0; k < 130; k++) addText(player.x, player.y, '24', '#fff', 14);
    const survivedSpam = texts.some(t => t.txt.includes('关键奇遇提示'));
    announce('🌀 顶部持久战术播报测试', '#e0aaff', 3.5);
    const bannerDur = banners[0] ? banners[0].t : 0;
    draw();

    return {
      kinds: Array.from(kindsSeen).sort(),
      hasPortals, warpedToB, lavaIgnited, iceBoost, pushedFromChasm,
      initDur, survivedSpam, bannerDur
    };
  })()`, s);

  assert.deepStrictEqual(terrainCheck.kinds, ['chasm', 'ice_sheet', 'lava', 'swamp'], 'All 4 interactive terrain kinds must spawn across the 5 biomes');
  assert.strictEqual(terrainCheck.hasPortals, true, 'Twin Void Portals must spawn on Wave 3 Wasteland');
  assert.strictEqual(terrainCheck.warpedToB, true, 'Stepping into Portal A must warp player to Portal B with invuln & cooldown');
  assert.strictEqual(terrainCheck.lavaIgnited, true, 'Lava pool must ignite enemies stepping inside');
  assert.strictEqual(terrainCheck.iceBoost, true, 'Ice sheet must grant +28% skating speed boost');
  assert.strictEqual(terrainCheck.pushedFromChasm, true, 'Chasm ravine must physically block ground entities from crossing');
  assert(terrainCheck.initDur >= 1.8, `Important overhead callout must last >= 1.8s (got ${terrainCheck.initDur}s)`);
  assert.strictEqual(terrainCheck.survivedSpam, true, 'Important overhead callout must NOT be evicted by 130 numeric damage hits');
  assert(terrainCheck.bannerDur >= 3.4, 'HUD event banner must stay visible >= 3.4s');
  assert.strictEqual(stats.radialGradients, 0, 'Terrain & banner rendering must create ZERO per-frame radial gradients');
  assert.strictEqual(stats.shadowBlurs, 0, 'Terrain & banner rendering must set ZERO shadowBlur');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero errors in Suite 13 interactive terrains & banners verification');
}

// 14. v1.2.0 Boss Portraits & Time-Stop Cutscenes, Hidden Mythic Phase 2 (+60s & Legendary Drop), Melee Fairness, CritDmg & Tri-Elements, Start Menu Version + Changelog Modal
{
  const { sandbox: s, els, stats } = createEnv(false, 1440, 900, 2);

  // 14a. Start Menu Live Version Pill + Interactive Changelog Modal
  s.document.getElementById('codexModal').classList.add('hidden');
  s.document.getElementById('logModal').classList.add('hidden');
  assert(els.startVersionPill.textContent.includes('v1.3.4'), '#startVersionPill must display live version v1.3.4 on start screen');
  vm.runInContext('openChangelogModal();', s);
  assert.strictEqual(els.changelogModal.classList.contains('hidden'), false, 'openChangelogModal() must unhide #changelogModal');
  assert(els.changelogList.children.length >= 7, 'Changelog modal must render >= 7 historical version cards');
  s.window.dispatch('keydown', { key: 'Escape' });
  assert.strictEqual(els.changelogModal.classList.contains('hidden'), true, 'Escape key must close #changelogModal');

  // 14b. Crit Damage Items (`critDmg`) + Burn / Freeze / Poison Elemental System & Plague Spread
  const elemCritCheck = vm.runInContext(`(() => {
    startGame('brawler');
    wave = 6; beginWave(); bossCutscene = null;
    const baseCritMul = getEffectiveCritMult(1.95);
    ITEMS.find(i => i.id === 'hawk_eye').apply(player);
    ITEMS.find(i => i.id === 'crit_gauntlet').apply(player);
    ITEMS.find(i => i.id === 'doom_edge').apply(player);
    const boostedCritMul = getEffectiveCritMult(1.95);

    // Freeze immobilizes normal enemy & Shatter Crit grants +25% bonus damage
    enemies = [];
    const m1 = createEnemy(600, 600, 'chaser');
    m1.hp = 5000; m1.maxHp = 5000;
    const hp0 = m1.hp;
    hurtEnemy(m1, 100, true, 0, true, { noProc: true });
    const normalCritHit = hp0 - m1.hp;

    applyFreeze(m1, 1.5);
    const xFrozen0 = m1.x;
    update(0.10);
    const stayedStill = Math.abs(m1.x - xFrozen0) < 0.01;
    const hpBeforeShatter = m1.hp;
    hurtEnemy(m1, 100, true, 0, true, { noProc: true });
    const shatterCritHit = hpBeforeShatter - m1.hp;

    // Poison stacks corrode (+3% vuln/stack) + DoT tick + Plague Flask spread on death
    ITEMS.find(i => i.id === 'plague_flask').apply(player);
    const pTarget = createEnemy(900, 600, 'shooter');
    const neighbor = createEnemy(940, 600, 'stalker');
    pTarget.hp = 1000; pTarget.maxHp = 1000;
    applyPoison(pTarget, 5);
    const hpBeforePoisonHit = pTarget.hp;
    hurtEnemy(pTarget, 100, false, 0, true, { noProc: true });
    const corrodedHit = hpBeforePoisonHit - pTarget.hp;
    // Kill poisoned target -> spreads poison to nearby neighbor!
    hurtEnemy(pTarget, 5000, false, 0, true, { noProc: true });
    const spreadStacks = neighbor.poisonStacks || 0;

    // Render frozen, poisoned, and burning sprites
    neighbor.burnT = 2.0; neighbor.freezeT = 1.0;
    cam.x = 920; cam.y = 600;
    draw();

    return { baseCritMul, boostedCritMul, stayedStill, normalCritHit, shatterCritHit, corrodedHit, spreadStacks };
  })()`, s);

  assert(elemCritCheck.boostedCritMul >= elemCritCheck.baseCritMul + 0.99, 'Crit Damage items must boost effective crit multiplier by >= +100%');
  assert.strictEqual(elemCritCheck.stayedStill, true, 'Frozen regular monster must be completely immobilized');
  assert(elemCritCheck.shatterCritHit > elemCritCheck.normalCritHit * 1.20, 'Critting a frozen target must trigger +25% Shatter bonus');
  assert(elemCritCheck.corrodedHit >= 114, `5 stacks of poison must amplify damage by +15% (got ${elemCritCheck.corrodedHit})`);
  assert(elemCritCheck.spreadStacks >= 2, 'Plague Flask must spread poison stacks to nearby enemies upon death');

  // 14c. Melee vs. Ranged Boss Fairness (Donut Safe Inner Eye, Melee +22% Boss-Breaker, Exposed Window, Close-Quarters Guard)
  const meleeFairCheck = vm.runInContext(`(() => {
    startGame('brawler');
    wave = 10; beginWave(); bossCutscene = null;
    enemies = []; hazards = [];
    const boss = createEnemy(700, 700, 'boss', 'mech_colossus');
    boss.canPhase2 = false;
    boss.hp = 50000; boss.maxHp = 50000;

    // Ranged hit vs Melee hit on Boss
    const h0 = boss.hp;
    hurtEnemy(boss, 100, false, 0, true, { noProc: true });
    const rangedDmg = h0 - boss.hp;
    const h1 = boss.hp;
    hurtEnemy(boss, 100, false, 0, true, { isMelee: true, noProc: true });
    const meleeDmg = h1 - boss.hp;
    boss.exposeT = 1.5;
    const h2 = boss.hp;
    hurtEnemy(boss, 100, false, 0, true, { isMelee: true, noProc: true });
    const exposedMeleeDmg = h2 - boss.hp;

    // Donut Outer-Ring Hazard: standing in melee range (74px < innerSafeR 112px, outside Boss 53px body contact) takes 0 dmg; standing far (165px) takes dmg!
    player.dodge = 0; player.armor = 0; player.shield = 0; player.invuln = 0;
    player.maxHp = 200; player.hp = 200;
    player.x = boss.x + 74; player.y = boss.y;
    spawnHazard(boss.x, boss.y, 238, 30, 0.04, { innerSafeR: 112, color: '#fb5607' });
    cam.x = boss.x; cam.y = boss.y;
    draw(); // Test Donut hazard rendering too!
    update(0.05);
    const hpAfterCloseEye = player.hp;

    player.invuln = 0;
    player.x = boss.x + 165; player.y = boss.y;
    spawnHazard(boss.x, boss.y, 238, 30, 0.04, { innerSafeR: 112, color: '#fb5607' });
    update(0.05);
    const hpAfterOuterBlast = player.hp;

    return { rangedDmg, meleeDmg, exposedMeleeDmg, hpAfterCloseEye, hpAfterOuterBlast };
  })()`, s);

  assert(meleeFairCheck.meleeDmg > meleeFairCheck.rangedDmg * 1.20, 'Melee hits must deal +22% Boss-Breaker damage vs Bosses');
  assert(meleeFairCheck.exposedMeleeDmg > meleeFairCheck.meleeDmg * 1.22, 'Exposed Boss window must grant an additional +25% melee vulnerability');
  assert.strictEqual(meleeFairCheck.hpAfterCloseEye, 200, 'Standing inside Boss Donut inner wind-eye (40px < 96px) must deal ZERO damage to melee player');
  assert(meleeFairCheck.hpAfterOuterBlast < 200, 'Standing in Boss Donut outer blast ring (150px) must hurt distant camper');

  // 14d. Rare Full-Screen Time-Stop Cutscene + All 7 Boss Portraits + Hidden Mythic Phase 2 (+60s & Guaranteed T4 Mythic Drop)
  const mythicCheck = vm.runInContext(`(() => {
    // Verify 33% per-Boss-variant rate & max 1 per Boss ID cap (not global 1-per-run cap):
    // Summoning the SAME Special Boss ('crimson_lord') 3 times in a single run must trigger <= 1 time,
    // while Wave 12 Final Boss (different Boss ID) CAN also trigger in the same run!
    let maxSameBossInSingleRun = 0;
    let runsWithBothEarlyAndFinal = 0;
    for (let r = 0; r < 160; r++) {
      startGame('allrounder');
      let crimsonCount = 0;
      for (let k = 0; k < 3; k++) {
        bossCutscene = null;
        const testRel = spawnSpecialRelic('blood_altar');
        summonSpecialBoss(testRel);
        if (bossCutscene) crimsonCount++;
      }
      if (crimsonCount > maxSameBossInSingleRun) maxSameBossInSingleRun = crimsonCount;
      bossCutscene = null;
      wave = 12; beginWave();
      const finalShown = !!bossCutscene;
      if (crimsonCount > 0 && finalShown) runsWithBothEarlyAndFinal++;
    }

    startGame('allrounder');
    wave = 8; beginWave();
    enemies = []; relics = []; drops = []; pendingCrates = 0;
    const rel = spawnSpecialRelic('blood_altar');
    summonSpecialBoss(rel, true);
    const summonCutsceneActive = !!(bossCutscene && bossCutscene.mode === 'summon' && bossCutscene.t > 1.0);
    const wtFrozen0 = waveTime;
    update(0.05); // During bossCutscene, waveTime stays frozen while boss spawn ticks!
    const timerStayedFrozen = Math.abs(waveTime - wtFrozen0) < 0.001;

    // Render all 7 Boss Portraits in both normal & Mythic Phase 2 modes
    const allVars = ['butcher', 'frost_queen', 'mech_colossus', 'void_weaver', 'crimson_lord', 'golden_golem', 'abyss_devourer'];
    for (const v of allVars) {
      bossCutscene = { t: 0.9, maxT: 1.3, mode: 'summon', variant: v, title: v, subtitle: 'TEST', extraTag: 'TAG', color: '#ff3b6b', accent: '#ffd166' };
      draw();
      bossCutscene.mode = 'mythic_phase2';
      draw();
    }
    bossCutscene = null;

    // Trigger Hidden Mythic Phase 2 on Boss lethal hit (and verify max 1 Mythic Phase 2 per run)!
    enemies = []; drops = [];
    const b = createEnemy(650, 650, 'boss', 'frost_queen');
    b.canPhase2 = true;
    waveTime = 18;
    hurtEnemy(b, b.maxHp + 99999, true);
    const awakened = !!b.mythicPhase2 && b.hp > 0 && waveTime >= 75 && !!(bossCutscene && bossCutscene.mode === 'mythic_phase2');
    draw(); // Render Mythic cutscene + Mythic Boss sprite!
    bossCutscene = null;

    // Second Boss in the same run must NOT awaken a second Mythic Phase 2
    const bTwin = createEnemy(700, 650, 'boss', 'butcher');
    bTwin.canPhase2 = true;
    hurtEnemy(bTwin, bTwin.maxHp + 99999, true);
    const secondMythicBlocked = !bTwin.mythicPhase2;

    // Let Boss execute Terrain Alteration & Minion Summon during Phase 2
    terrains = [];
    b.terrainCd = 0.02; b.sumT = 0.02;
    const terrainsBefore = terrains.length;
    update(0.05);
    const alteredTerrain = terrains.length > terrainsBefore;

    // Defeat Phase 2 -> drops Mythic Crate & grants permanent trophy buff
    const dmgBeforeKill = player.dmgMul;
    hurtEnemy(b, b.maxHp + 99999, true);
    const droppedMythic = drops.some(d => d.kind === 'crate' && d.isMythic);
    const gotTrophyBuff = player.dmgMul > dmgBeforeKill + 0.14 && (player.critDmg || 0) >= 0.24;

    // Pick up Mythic Crate and open Crate Menu -> guaranteed Tier 4 Legendary option!
    for (const d of drops) { d.x = player.x; d.y = player.y; }
    update(0.05);
    showCrateMenu();
    return { maxSameBossInSingleRun, runsWithBothEarlyAndFinal, summonCutsceneActive, timerStayedFrozen, awakened, secondMythicBlocked, alteredTerrain, droppedMythic, gotTrophyBuff };
  })()`, s);

  assert(mythicCheck.maxSameBossInSingleRun <= 1, `Same Boss variant must trigger at most 1 portrait cutscene per run (got ${mythicCheck.maxSameBossInSingleRun})`);
  assert(mythicCheck.runsWithBothEarlyAndFinal > 0, 'Early Boss portrait must NOT block late-game Wave 12 Boss from showing its own portrait');
  assert.strictEqual(mythicCheck.summonCutsceneActive, true, 'Rare/forced Special Boss summon must trigger full-screen time-stop cutscene');
  assert.strictEqual(mythicCheck.timerStayedFrozen, true, 'waveTime must pause during Boss entrance cutscene');
  assert.strictEqual(mythicCheck.awakened, true, 'Boss with canPhase2 must awaken Mythic Phase 2 on lethal hit, restoring HP, adding +60s, and playing hidden cutscene');
  assert.strictEqual(mythicCheck.secondMythicBlocked, true, 'At most 1 Mythic Phase 2 awakening may occur per run');
  assert.strictEqual(mythicCheck.alteredTerrain, true, 'Boss must actively alter battlefield terrain during combat');
  assert.strictEqual(mythicCheck.droppedMythic, true, 'Defeating Mythic Phase 2 Boss must drop a Mythic Legendary Crate');
  assert.strictEqual(mythicCheck.gotTrophyBuff, true, 'Defeating Mythic Phase 2 Boss must grant permanent +15% dmg & +25% critDmg trophy');
  assert(els.crateTitle.textContent.includes('神话'), 'Opening Mythic Crate must display Mythic title in #crateMenu');
  assert.strictEqual(stats.radialGradients, 0, 'Boss portraits, cutscenes & elemental overlays must create ZERO per-frame radial gradients');
  assert.strictEqual(stats.shadowBlurs, 0, 'Boss portraits, cutscenes & elemental overlays must set ZERO shadowBlur');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero runtime errors across Suite 14 v1.2.0 verification');
}

// 15. v1.3.0 One-Unique-Organic-Terrain-Per-Map, Wave 5 MINI_BOSS_DEFS Resilience, 32-Weapon / 68-Item Full Archetypes & All 10 Half-Body Portraits
{
  const { sandbox: s, stats } = createEnv(false, 1440, 900, 2);

  const v13Check = vm.runInContext(`(() => {
    startGame('engineer');

    // 15a. Verify balanced weapon counts across all 6 sets (each set >= 5 weapons!)
    const setCounts = {};
    for (const w of Object.values(WEAPONS)) {
      setCounts[w.set] = (setCounts[w.set] || 0) + 1;
    }

    // 15b. Verify strictly ONE signature terrain feature per biome & non-circular geometry
    const biomeReport = {};
    for (const sc of SCENES) {
      selectedScene = sc.id;
      wave = 4;
      beginWave();
      const tCount = terrains.length;
      const pCount = portals.length;
      let nonCircular = false;
      if (sc.id === 'wasteland') {
        nonCircular = (tCount === 0 && pCount === 2 && Array.isArray(portals[0].shards) && portals[0].shards.length >= 5);
      } else if (tCount === 1 && pCount === 0) {
        const tr = terrains[0];
        if (tr.kind === 'chasm') {
          nonCircular = Array.isArray(tr.spine) && tr.spine.length >= 6 && Array.isArray(tr.outerCliff) && tr.outerCliff.length >= 12;
        } else if (Array.isArray(tr.verts) && tr.verts.length >= 12) {
          const dists = tr.verts.map(v => Math.hypot(v.x - tr.x, v.y - tr.y));
          nonCircular = (Math.max(...dists) - Math.min(...dists)) > 12;
        }
      }
      biomeReport[sc.id] = { tCount, pCount, kind: terrains[0] ? terrains[0].kind : 'portals', nonCircular };
      draw();
    }

    // 15c. Regression test for Wave 5 Fungal Elite Wave & MINI_BOSS_DEFS resilience
    selectedScene = 'fungal';
    selectedDiff = 2; diff = DIFFS[2];
    wave = 5;
    beginWave();
    const savedMini = globalThis.MINI_BOSS_DEFS;
    globalThis.MINI_BOSS_DEFS = undefined;
    const pickedFallback = pickMiniBossVariant();
    const fallbackMini = createEnemy(600, 600, 'mini_boss', pickedFallback);
    globalThis.MINI_BOSS_DEFS = savedMini;
    const wave5Safe = !!(fallbackMini && fallbackMini.hp > 0);

    // 15d. Test new Engineering Landmines, Floating Laser Turrets, Bouncing Grenade, Revolver 6th-Crit, Melee Shockwave & Blood Nova
    player.weapons = [
      makeWeapon('screwdriver', 3),
      makeWeapon('drone_bay', 3),
      makeWeapon('revolver', 2),
      makeWeapon('grenade_launcher', 3),
      makeWeapon('spiked_shield', 3),
      makeWeapon('magma_blade', 4),
      makeWeapon('emp_cannon', 4)
    ];
    for (const id of ['landmine_pack', 'overseer_chip', 'omega_factory', 'whirlwind_belt', 'crimson_pact', 'titan_heart', 'fortress_plate', 'trinity_orb']) {
      player.items[id] = 1;
      ITEMS.find(i => i.id === id).apply(player);
    }
    wave = 7;
    beginWave();
    const hasLaserTurret = turrets.some(t => t.kind === 'laser');
    player.mineCd = 0.01;
    const targetE = createEnemy(player.x + 95, player.y, 'brute');
    targetE.hp = 20000; targetE.maxHp = 20000;
    createEnemy(player.x + 150, player.y + 30, 'charger');
    player.hp = Math.max(1, player.maxHp - 5);
    for (let step = 0; step < 30; step++) {
      for (const w of player.weapons) w.cd = 0;
      update(0.05);
      draw();
    }
    // Detonate a proximity mine directly
    player.mineCd = 0.01;
    update(0.05);
    const spawnedMine = mines.length >= 1;
    if (mines[0]) {
      mines[0].armT = 0;
      const victim = createEnemy(mines[0].x + 10, mines[0].y, 'chaser');
      victim.hp = 500; victim.maxHp = 500;
      update(0.05);
    }

    // 15e. Render all 10 Boss/SpecialBoss/Commander Half-Body Portraits (Normal + Mythic)
    const all10Portraits = ['butcher', 'frost_queen', 'mech_colossus', 'void_weaver', 'crimson_lord', 'golden_golem', 'abyss_devourer', 'vanguard', 'pyro_lord', 'shadow_stalker'];
    for (const v of all10Portraits) {
      drawBossPortrait(v, 400, 300, 1.0, false);
      drawBossPortrait(v, 400, 300, 1.0, true);
    }

    return { setCounts, biomeReport, wave5Safe, hasLaserTurret, spawnedMine };
  })()`, s);

  for (const [setKey, cnt] of Object.entries(v13Check.setCounts)) {
    assert(cnt >= 5, `Weapon set ${setKey} must have >= 5 weapons for balanced build variety (got ${cnt})`);
  }
  for (const [scId, rep] of Object.entries(v13Check.biomeReport)) {
    assert.strictEqual(rep.nonCircular, true, `Biome ${scId} must spawn strictly 1 non-circular signature terrain (got ${JSON.stringify(rep)})`);
  }
  assert.strictEqual(v13Check.wave5Safe, true, 'Wave 5 pickMiniBossVariant & createEnemy must never throw ReferenceError even if global MINI_BOSS_DEFS is stale');
  assert.strictEqual(v13Check.hasLaserTurret, true, 'Drone Bay / Omega Factory must deploy floating laser turrets');
  assert.strictEqual(v13Check.spawnedMine, true, 'Screwdriver / Landmine Pack must deploy proximity landmines');
  assert.strictEqual(stats.radialGradients, 0, 'v1.3.0 organic terrains, mines, laser turrets & 10 portraits must use ZERO radialGradients');
  assert.strictEqual(stats.shadowBlurs, 0, 'v1.3.0 organic terrains, mines, laser turrets & 10 portraits must use ZERO shadowBlurs');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero runtime errors across Suite 15 v1.3.0 verification');

  // 15f. Verify Standalone Out-of-Game Developer Portrait Showcase HTML exists & compiles cleanly
  const devShowcasePath = path.join(ROOT, 'tools/dev_portrait_showcase.html');
  assert(fs.existsSync(devShowcasePath), 'Developer portrait showcase HTML must exist in tools/dev_portrait_showcase.html');
  const devHtml = fs.readFileSync(devShowcasePath, 'utf8');
  const scriptMatch = devHtml.match(/<script>([\s\S]*?)<\/script>/);
  assert(scriptMatch && scriptMatch[1].length > 50000, 'Developer portrait showcase must inline full rendering script');
  new vm.Script(scriptMatch[1], { filename: 'dev_portrait_showcase.js' });
  assert(!indexHtml.includes('portraitModal'), 'Main game index.html must stay clean of developer-only portrait modal');
}

// 16. v1.3.2 25% Mythic Phase 2 Rate, Fast Monster '格挡' vs Long Hero Notices, Zero-Alloc Caches, Crash Guards & High-Load Perf Benchmark
{
  const { sandbox: s, els, stats } = createEnv(false, 1440, 900, 2);

  // 16a. KeyboardEvent with undefined `key` (IME / browser autofill edge case) must NEVER throw
  s.window.dispatch('keydown', {});
  s.window.dispatch('keyup', { key: undefined });

  const v132Check = vm.runInContext(`(() => {
    startGame('ranger');
    wave = 8; beginWave();

    // 1) Verify Mythic Phase 2 probability is 25% (~0.25 across 600 boss spawns)
    let phase2Rolls = 0;
    const totalRolls = 600;
    for (let i = 0; i < totalRolls; i++) {
      enemies = [];
      const b = createEnemy(600, 600, i % 2 === 0 ? 'boss' : 'special_boss', i % 2 === 0 ? 'butcher' : 'crimson_lord');
      if (b.canPhase2) phase2Rolls++;
    }
    const empiricalRate = phase2Rolls / totalRolls;

    // Verify per-wave reset allows subsequent Boss wave to awaken while blocking twin boss in same wave
    enemies = [];
    wave = 8; beginWave();
    const bWave8 = createEnemy(600, 600, 'special_boss', 'crimson_lord');
    bWave8.canPhase2 = true;
    hurtEnemy(bWave8, bWave8.maxHp + 99999, true);
    const wave8Awakened = !!bWave8.mythicPhase2;
    const bWave8Twin = createEnemy(660, 600, 'special_boss', 'golden_golem');
    bWave8Twin.canPhase2 = true;
    hurtEnemy(bWave8Twin, bWave8Twin.maxHp + 99999, true);
    const sameWaveTwinBlocked = !bWave8Twin.mythicPhase2;

    wave = 12; beginWave(); bossCutscene = null;
    const bWave12 = createEnemy(600, 600, 'boss', 'frost_queen');
    bWave12.canPhase2 = true;
    hurtEnemy(bWave12, bWave12.maxHp + 99999, true);
    const wave12AwakenedToo = !!bWave12.mythicPhase2;
    bossCutscene = null;

    // 2) Verify '格挡' & monster prompts vanish quickly without dark pill, while hero notices stay >= 1.5s with pill
    enemies = []; texts = [];
    const sh = createEnemy(700, 500, 'shielder');
    sh.hp = 5000; sh.maxHp = 5000; sh.faceA = 0;
    for (let k = 0; k < 12; k++) {
      // knockA = Math.PI hits shielder head-on (cos(pi - 0) = -1 < -0.25)
      hurtEnemy(sh, 15, false, Math.PI, false, { noProc: true });
    }
    const blockTexts = texts.filter(t => t.txt === '格挡');
    const blockFastAndClean = blockTexts.length === 1 && blockTexts[0].important === false && blockTexts[0].maxT <= 0.45;

    applyFreeze(sh, 1.2);
    const freezeTxt = texts.find(t => t.txt.includes('冰冻'));
    const freezeFast = !!(freezeTxt && freezeTxt.important === false && freezeTxt.maxT <= 0.55);

    const bmb = createEnemy(760, 500, 'bomber');
    primeBomber(bmb);
    const bombTxt = texts.find(t => t.txt.includes('自爆预警'));
    const bombFast = !!(bombTxt && bombTxt.important === false && bombTxt.maxT <= 0.75);

    // Major player notices stay long & important
    addText(player.x, player.y - 36, '🧊 寒冰疾滑 +28%移速!', '#72efdd', 15, 1.8);
    addText(player.x, player.y - 36, 'LEVEL UP!', '#ffd166', 22, 1.9, true);
    const iceTxt = texts.find(t => t.txt.includes('寒冰疾滑'));
    const lvTxt = texts.find(t => t.txt === 'LEVEL UP!');
    const heroNoticesLong = !!(iceTxt && iceTxt.important === true && iceTxt.maxT >= 1.75 && lvTxt && lvTxt.important === true && lvTxt.maxT >= 1.85);

    // 3) Verify getSetBonuses() zero-allocation object reuse & instant invalidation on weapon change
    const sbRef1 = getSetBonuses();
    const sbRef2 = getSetBonuses();
    const cacheReused = sbRef1 === sbRef2;
    const prevGuns = sbRef1.counts.gun;
    player.weapons.push(makeWeapon('smg', 2));
    const sbRef3 = getSetBonuses();
    const cacheUpdatedInPlace = sbRef3 === sbRef1 && sbRef3.counts.gun === prevGuns + 1;

    // 4) NaN damage guard & Exhausted-Item-Pool Crate fallback safety
    const hpBeforeNaN = sh.hp;
    hurtEnemy(sh, NaN, false, 0, true);
    const nanSafe = Number.isFinite(sh.hp) && sh.hp === hpBeforeNaN;

    const origFilter = ITEMS.filter;
    ITEMS.filter = () => [];
    pendingCrates = 1;
    showCrateMenu();
    ITEMS.filter = origFilter;

    // 5) High-density Wave 12 D5 combat stress benchmark (100 enemies + 6 rapid weapons + turrets + mines)
    selectedDiff = 4; diff = DIFFS[4];
    startGame('multitasker');
    player.weapons = [
      makeWeapon('minigun', 4), makeWeapon('shotgun', 4), makeWeapon('flamethrower', 4),
      makeWeapon('smg', 4), makeWeapon('katana', 4), makeWeapon('grenade_launcher', 4),
      makeWeapon('drone_bay', 3), makeWeapon('screwdriver', 3)
    ];
    player.maxHp = 99999; player.hp = 99999;
    wave = 12; beginWave(); bossCutscene = null;
    for (let m = 0; m < 85; m++) {
      const ang = (m / 85) * Math.PI * 2;
      createEnemy(player.x + Math.cos(ang) * (150 + (m % 5) * 45), player.y + Math.sin(ang) * (150 + (m % 5) * 45), m % 6 === 0 ? 'shielder' : (m % 5 === 0 ? 'splitter' : 'chaser'));
    }
    const t0 = Date.now();
    for (let f = 0; f < 180; f++) {
      update(0.016);
      if (f % 3 === 0) draw();
    }
    const benchMs = Date.now() - t0;

    return {
      empiricalRate, wave8Awakened, sameWaveTwinBlocked, wave12AwakenedToo,
      blockFastAndClean, freezeFast, bombFast, heroNoticesLong,
      cacheReused, cacheUpdatedInPlace, nanSafe, benchMs
    };
  })()`, s);

  assert(v132Check.empiricalRate >= 0.19 && v132Check.empiricalRate <= 0.31, `Mythic Phase 2 rate must be ~25% (got ${(v132Check.empiricalRate * 100).toFixed(1)}%)`);
  assert.strictEqual(v132Check.wave8Awakened, true, 'Wave 8 Special Boss with canPhase2 must awaken Mythic Phase 2');
  assert.strictEqual(v132Check.sameWaveTwinBlocked, true, 'Twin Boss in the same wave must NOT double-trigger Mythic Phase 2');
  assert.strictEqual(v132Check.wave12AwakenedToo, true, 'New Boss wave must reset waveMythicAwakened so Wave 12 Boss still gets its 25% Mythic roll');
  assert.strictEqual(v132Check.blockFastAndClean, true, 'Shielder 格挡 prompt must be non-important, <=0.45s fast-fading, and throttled against multi-pellet spam');
  assert.strictEqual(v132Check.freezeFast, true, 'Monster 冰冻 prompt must be non-important and fast-fading (<=0.55s)');
  assert.strictEqual(v132Check.bombFast, true, 'Bomber 自爆预警 prompt must be non-important and crisp (<=0.75s)');
  assert.strictEqual(v132Check.heroNoticesLong, true, 'Hero terrain & LEVEL UP notices must remain important with pill backdrop and >=1.75s duration');
  assert.strictEqual(v132Check.cacheReused, true, 'getSetBonuses() must reuse cached object with zero allocation when weapons are unchanged');
  assert.strictEqual(v132Check.cacheUpdatedInPlace, true, 'getSetBonuses() must auto-detect weapon array mutation and update set counts');
  assert.strictEqual(v132Check.nanSafe, true, 'hurtEnemy must safely ignore NaN damage without corrupting enemy HP');
  assert(els.crateBox.children.length >= 1, 'Exhausted item pool in #crateMenu must still render fallback supply card without soft-locking');
  assert(v132Check.benchMs < 2500, `180 frames of D5 Wave 12 85-mob bullet-hell stress test must run fast (took ${v132Check.benchMs}ms)`);
  assert.strictEqual(stats.radialGradients, 0, 'v1.3.2 stress benchmark must create ZERO per-frame radial gradients');
  assert.strictEqual(stats.shadowBlurs, 0, 'v1.3.2 stress benchmark must set ZERO shadowBlur');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero runtime errors across Suite 16 v1.3.2 verification');
}

// 17. v1.3.3 33% Per-Boss-Variant Portrait Unlock + Death Wave-Retry & Abandon-From-Scratch Mechanics
{
  const { sandbox: s, els, stats } = createEnv(false, 1440, 900, 2);

  const v133Check = vm.runInContext(`(() => {
    // 1) Verify ~33% empirical portrait probability on fresh Boss encounters (Regular Wave 12 Boss, Wave 5 Elite Commander, Special Boss)
    let regularHits = 0, eliteHits = 0, specialHits = 0;
    const N = 450;
    for (let i = 0; i < N; i++) {
      startGame('ranger');
      selectedDiff = 1; diff = DIFFS[1];
      bossCutscene = null;
      wave = 5; beginWave();
      if (bossCutscene && bossCutscene.mode === 'elite_boss') eliteHits++;

      bossCutscene = null;
      const rel = spawnSpecialRelic('void_cube');
      summonSpecialBoss(rel, false);
      if (bossCutscene && bossCutscene.mode === 'summon') specialHits++;

      bossCutscene = null;
      wave = 12; beginWave();
      if (bossCutscene && bossCutscene.mode === 'final_boss') regularHits++;
    }

    // 2) Verify per-Boss-ID cap = 1 & Endless mode unlock:
    // Force-showing vanguard, crimson_lord, and butcher must block repeats of THOSE 3, while still allowing frost_queen in Endless Wave 15!
    startGame('allrounder');
    shouldRollRareBossPortrait('vanguard', true);
    shouldRollRareBossPortrait('crimson_lord', true);
    shouldRollRareBossPortrait('butcher', true);
    let repeatBlocked = true;
    for (let k = 0; k < 30; k++) {
      if (shouldRollRareBossPortrait('vanguard', false) || shouldRollRareBossPortrait('crimson_lord', false) || shouldRollRareBossPortrait('butcher', false)) {
        repeatBlocked = false;
      }
    }
    let endlessFrostTriggered = false;
    endlessMode = true;
    for (let k = 0; k < 40; k++) {
      player.shownBossPortraits.frost_queen = false;
      bossCutscene = null;
      wave = 15;
      beginWave({ isRetry: true, sceneId: 'glacier', waveBossIds: ['frost_queen'] });
      if (bossCutscene && bossCutscene.variant === 'frost_queen') { endlessFrostTriggered = true; break; }
    }

    // 3) Verify Death Wave-Retry ('retryFailedWave') restores exact pre-wave checkpoint without leaking mid-wave drops/levels
    selectedScene = 'random';
    startGame('brawler');
    player.lv = 6;
    player.xp = 18;
    player.xpNeed = 55;
    player.mats = 92;
    player.kills = 110;
    player.maxHp = 58;
    player.weapons = [makeWeapon('katana', 3), makeWeapon('spiked_shield', 2)];
    player.items = { cyber_heart: 1, armor_plate: 2 };
    shopOffers = [{ kind: 'weapon', id: 'katana', tier: 3, price: 40, locked: true }];
    wave = 9;
    beginWave();
    bossCutscene = null;
    const preMaxHp = player.maxHp;
    const preSceneId = curScene.id;
    const preBossIds = waveCheckpoint && waveCheckpoint.waveBossIds ? waveCheckpoint.waveBossIds.slice() : [];
    player.shownBossPortraits.pyro_lord = true; // Simulate Boss portrait shown during Attempt 1

    // Mutate state mid-wave before dying
    player.mats += 44;
    player.kills += 19;
    player.lv = 8;
    player.maxHp += 12;
    pendingLevels = 2;
    pendingCrates = 1;
    player.bossCratesQueued = 1;
    player.dodge = 0; player.invuln = 0; player.shield = 0; player.armor = 0;
    hurtPlayer(99999);
    const deadState = state === 'end' && player.hp === 0;
    const retryBtnVisibleOnLoss = !document.getElementById('retryWaveBtn').classList.contains('hidden');
    const abandonBtnVisibleOnLoss = !document.getElementById('abandonRestartBtn').classList.contains('hidden');
    const retryLabel = document.getElementById('retryWaveBtn').textContent;

    // Trigger Retry Failed Wave!
    retryFailedWave();
    bossCutscene = null;
    const retryRestoredCleanly = (
      state === 'wave' &&
      wave === 9 &&
      player.hp === preMaxHp &&
      player.maxHp === preMaxHp &&
      player.lv === 6 &&
      player.xp === 18 &&
      player.mats === 92 &&
      player.kills === 110 &&
      pendingLevels === 0 &&
      pendingCrates === 0 &&
      player.bossCratesQueued === 0 &&
      player.weapons.length === 2 &&
      player.weapons[0].id === 'katana' &&
      player.items.armor_plate === 2 &&
      shopOffers.length === 1 && shopOffers[0].locked === true &&
      curScene.id === preSceneId &&
      JSON.stringify(waveCheckpoint.waveBossIds) === JSON.stringify(preBossIds) &&
      player.shownBossPortraits.pyro_lord === true &&
      player.retryCount === 1
    );

    // 4) Die again and choose 'abandonAndRestart' -> must start fresh from Wave 1!
    player.dodge = 0; player.invuln = 0;
    hurtPlayer(99999);
    const endDescHasRetry = document.getElementById('endDesc').innerHTML.includes('重试');
    abandonAndRestart();
    const restartedFromScratch = (
      state === 'wave' &&
      wave === 1 &&
      player.cls === 'brawler' &&
      player.lv === 1 &&
      player.kills === 0 &&
      player.retryCount === 0 &&
      Object.keys(player.shownBossPortraits).length === 0
    );

    // 5) Victory screen hides retry/abandon buttons and shows Endless button
    endGame(true);
    const winHidesRetry = document.getElementById('retryWaveBtn').classList.contains('hidden') &&
      document.getElementById('abandonRestartBtn').classList.contains('hidden') &&
      !document.getElementById('endlessBtn').classList.contains('hidden');

    return {
      regularRate: regularHits / N,
      eliteRate: eliteHits / N,
      specialRate: specialHits / N,
      repeatBlocked,
      endlessFrostTriggered,
      deadState,
      retryBtnVisibleOnLoss,
      abandonBtnVisibleOnLoss,
      retryLabel,
      retryRestoredCleanly,
      endDescHasRetry,
      restartedFromScratch,
      winHidesRetry
    };
  })()`, s);

  assert(v133Check.regularRate >= 0.25 && v133Check.regularRate <= 0.41, `Regular Wave 12 Boss portrait rate must be ~33% (got ${(v133Check.regularRate * 100).toFixed(1)}%)`);
  assert(v133Check.eliteRate >= 0.25 && v133Check.eliteRate <= 0.41, `Wave 5/9 Elite Boss portrait rate must be ~33% (got ${(v133Check.eliteRate * 100).toFixed(1)}%)`);
  assert(v133Check.specialRate >= 0.25 && v133Check.specialRate <= 0.41, `Special Boss portrait rate must be ~33% (got ${(v133Check.specialRate * 100).toFixed(1)}%)`);
  assert.strictEqual(v133Check.repeatBlocked, true, 'Each Boss variant must trigger portrait at most 1 time per run');
  assert.strictEqual(v133Check.endlessFrostTriggered, true, 'Unseen Boss variants in late-game / Endless waves must still be able to trigger their portrait');
  assert.strictEqual(v133Check.deadState, true, 'Lethal damage must enter end state');
  assert.strictEqual(v133Check.retryBtnVisibleOnLoss, true, '#retryWaveBtn must be visible upon defeat');
  assert.strictEqual(v133Check.abandonBtnVisibleOnLoss, true, '#abandonRestartBtn must be visible upon defeat');
  assert(v133Check.retryLabel.includes('第 9 波'), `Retry button must display exact failed wave label (got "${v133Check.retryLabel}")`);
  assert.strictEqual(v133Check.retryRestoredCleanly, true, 'retryFailedWave() must restore exact pre-wave stats, weapons, items, scene & boss without leaking mid-wave gains');
  assert.strictEqual(v133Check.endDescHasRetry, true, 'Defeat summary must display retry count after retrying');
  assert.strictEqual(v133Check.restartedFromScratch, true, 'abandonAndRestart() must discard progress and start fresh at Wave 1');
  assert.strictEqual(v133Check.winHidesRetry, true, 'Victory screen must hide retry/abandon buttons and show Endless button');
  assert.strictEqual(stats.radialGradients, 0, 'v1.3.3 suite must create ZERO per-frame radial gradients');
  assert.strictEqual(stats.shadowBlurs, 0, 'v1.3.3 suite must set ZERO shadowBlur');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero runtime errors across Suite 17 v1.3.3 verification');
}

// 18. v1.3.4 10 Boss Summer Anime Beauty Bust Portraits (Data Integrity, GPU Mask Composite & 33%/25% Cutscene Rendering)
{
  const { sandbox: s, stats } = createEnv(false, 1440, 900, 2);

  // Inject mock Image class into sandbox to exercise full RGB+Alpha offscreen composite & ctx.drawImage path
  let drawnPortraits = 0;
  const drawnImgRefs = [];
  const liveCtx = vm.runInContext('ctx', s);
  const origDrawImg = liveCtx.drawImage;
  liveCtx.drawImage = function (img, ...args) {
    if (img && img.width === 440 && img.height === 516) {
      drawnPortraits++;
      drawnImgRefs.push(img);
    }
    return origDrawImg.call(this, img, ...args);
  };

  s.Image = class MockImage {
    constructor() {
      this.naturalWidth = 440;
      this.naturalHeight = 516;
      this.width = 440;
      this.height = 516;
      this.onload = null;
    }
    set src(val) {
      this._src = val;
      if (typeof this.onload === 'function') this.onload();
    }
    get src() { return this._src; }
  };

  const v134Check = vm.runInContext(`(() => {
    const expectedVariants = [
      'butcher', 'frost_queen', 'mech_colossus', 'void_weaver',
      'crimson_lord', 'golden_golem', 'abyss_devourer',
      'vanguard', 'pyro_lord', 'shadow_stalker'
    ];
    const allPresent = expectedVariants.every(v => {
      const spec = BOSS_PORTRAIT_DATA[v];
      return spec &&
        spec.w === 440 &&
        spec.h === 516 &&
        typeof spec.personaName === 'string' && spec.personaName.length > 2 &&
        typeof spec.summerTitle === 'string' && spec.summerTitle.includes('夏装') &&
        typeof spec.mythicTitle === 'string' && spec.mythicTitle.length > 2 &&
        spec.mythicTitle !== spec.summerTitle &&
        typeof spec.rgb === 'string' && spec.rgb.startsWith('data:image/jpeg;base64,') && spec.rgb.length > 10000 &&
        typeof spec.mask === 'string' && spec.mask.startsWith('data:image/png;base64,') && spec.mask.length > 2000 &&
        typeof spec.mythicRgb === 'string' && spec.mythicRgb.startsWith('data:image/jpeg;base64,') && spec.mythicRgb.length > 10000 &&
        typeof spec.mythicMask === 'string' && spec.mythicMask.startsWith('data:image/png;base64,') && spec.mythicMask.length > 2000 &&
        spec.mythicRgb !== spec.rgb;
    });

    preloadAllBossPortraits();
    const allCompositedAndDistinct = expectedVariants.every(v => {
      const c1 = getBossAnimePortrait(v, false);
      const c2 = getBossAnimePortrait(v, true);
      return c1 && c2 && c1 !== c2 && c1.width === 440 && c1.height === 516 && c2.width === 440 && c2.height === 516;
    });

    startGame('ranger');
    wave = 12;
    beginWave();
    for (const v of expectedVariants) {
      startBossCutscene('final_boss', v, '测试首领', '✨ 稀有真身显圣', '测试标签', '#ff4d6d', '#ffd166', 1.15);
      draw();
      startBossCutscene('mythic_phase2', v, '测试神话二阶段', '🔥 神话觉醒', '测试神话标签', '#ff2a55', '#ffd166', 1.65);
      draw();
    }
    return { allPresent, allCompositedAndDistinct, count: Object.keys(BOSS_PORTRAIT_DATA).length };
  })()`, s);

  assert.strictEqual(v134Check.count, 10, 'BOSS_PORTRAIT_DATA must define all 10 Bosses');
  assert.strictEqual(v134Check.allPresent, true, 'All 10 Bosses must carry distinct Phase 1 summer & Hidden Phase 2 mythic costume data URIs');
  assert.strictEqual(v134Check.allCompositedAndDistinct, true, 'getBossAnimePortrait(v, false) and getBossAnimePortrait(v, true) must return distinct 440x516 canvases');
  assert(drawnPortraits >= 20, `Expected >= 20 anime Boss portrait drawImage calls across 10 Phase-1 + 10 Phase-2 cutscenes (got ${drawnPortraits})`);
  assert.strictEqual(new Set(drawnImgRefs).size, 20, 'Cutscenes must render 20 distinct canvas instances (10 Phase-1 + 10 Hidden Phase-2)');
  assert.strictEqual(stats.radialGradients, 0, 'v1.3.4 anime Boss cutscenes must create ZERO per-frame radial gradients');
  assert.strictEqual(stats.shadowBlurs, 0, 'v1.3.4 anime Boss cutscenes must set ZERO shadowBlur');
  assert.strictEqual(vm.runInContext('logErrCount', s), 0, 'Zero runtime errors across Suite 18 v1.3.4 verification');
}

console.log(`ALL 18 SUITES PASSED! Modular files: ${cssFiles.length} CSS + ${jsFiles.length} JS | Total JS: ${(code.length / 1024).toFixed(1)} KB`);
