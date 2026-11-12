// 主菜单配置、键鼠/虚拟摇杆/双指缩放输入、运行时状态池与暂停控制
function initMenuUI() {
  refreshUIPrefControls();
  const vp = document.getElementById('startVersionPill');
  if (vp && typeof APP_VERSION !== 'undefined') {
    vp.textContent = `🥔 BROTATO MINI · 当前版本 ${APP_VERSION}`;
  }
  const dt = document.getElementById('diffTabs');
  if (dt) {
    dt.innerHTML = '';
    DIFFS.forEach(d => {
      const b = document.createElement('button');
      b.className = 'diff-btn' + (d.id === selectedDiff ? ' active' : '');
      b.textContent = d.badge;
      b.onclick = () => { selectedDiff = d.id; beep(480, 0.04, 'triangle'); initMenuUI(); };
      dt.appendChild(b);
    });
  }
  const dd = document.getElementById('diffDesc');
  if (dd) dd.textContent = DIFFS[selectedDiff].desc;

  const st = document.getElementById('sceneTabs');
  if (st) {
    st.innerHTML = '';
    const sceneOpts = [{ id: 'random', icon: '🎲', name: '随机轮换' }, ...SCENES];
    sceneOpts.forEach(sc => {
      const b = document.createElement('button');
      b.className = 'scene-btn' + (sc.id === selectedScene ? ' active' : '');
      b.textContent = `${sc.icon} ${sc.name}`;
      b.onclick = () => {
        selectedScene = sc.id;
        if (sc.id !== 'random') {
          curScene = SCENES.find(x => x.id === sc.id) || SCENES[0];
          sceneSeed = (1009 + sc.id.charCodeAt(0) * 271) >>> 0;
          if (bootReady) syncArenaAndZoom(true);
        }
        beep(510, 0.04, 'triangle');
        initMenuUI();
      };
      st.appendChild(b);
    });
  }

  const cg = document.getElementById('classGrid');
  if (cg && !cg.children.length) {
    CLASSES.forEach(c => {
      const el = document.createElement('div');
      el.className = 'cls-card';
      el.innerHTML = `
        <div class="cls-head">
          <div class="cls-avatar">${c.icon}</div>
          <div class="cls-title-wrap">
            <h3><span>${c.name}</span><span class="cls-role">${c.tag}</span></h3>
            <div class="cls-loadout">${c.loadout}</div>
          </div>
        </div>
        <div class="cls-perks">${c.perks}</div>
        <div class="cls-go">选择出战 ▸</div>`;
      el.onclick = () => startGame(c.id);
      cg.appendChild(el);
    });
  }
}
initMenuUI();

const keys = {};
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'escape') {
    const cm = document.getElementById('codexModal');
    if (cm && !cm.classList.contains('hidden')) { if (e.preventDefault) e.preventDefault(); closeCodex(); return; }
    const clm = document.getElementById('changelogModal');
    if (clm && !clm.classList.contains('hidden')) { if (e.preventDefault) e.preventDefault(); closeChangelogModal(); return; }
    const lm = document.getElementById('logModal');
    if (lm && !lm.classList.contains('hidden')) { if (e.preventDefault) e.preventDefault(); closeLogModal(); return; }
  }
  if ((k === ' ' || k === 'enter') && bossCutscene && bossCutscene.t < bossCutscene.maxT - 0.35) {
    bossCutscene.t = Math.min(bossCutscene.t, 0.08);
    return;
  }
  if (k === 'escape' || k === 'p') {
    if (state === 'wave' || state === 'paused') { if (e.preventDefault) e.preventDefault(); togglePause(); return; }
  } else if (k === ' ' && state === 'paused') {
    e.preventDefault(); resumeGame(); return;
  }
  keys[k] = true;
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; resetJoy(); });
if (document.addEventListener) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'wave') pauseGame();
  });
}

// 手机端全屏动态悬浮摇杆 + 双指捏合缩放视野
const joy = { id: null, ox: 0, oy: 0, cx: 0, cy: 0, dx: 0, dy: 0, mag: 0, active: false, maxR: 56 };
let pinchDist = 0, confirmSellIdx = -1;

function resetJoy() {
  joy.id = null; joy.active = false; joy.dx = 0; joy.dy = 0; joy.mag = 0; pinchDist = 0;
}

if (window.addEventListener) {
  window.addEventListener('touchstart', () => {
    if (!isTouch) {
      isTouch = true;
      if (uiPref === 'auto' && uiMode === 'desktop' && typeof bootReady !== 'undefined' && bootReady) resize();
    }
  }, { passive: true });
}

if (cv.addEventListener) {
  cv.addEventListener('mousedown', () => {
    if (bossCutscene && bossCutscene.t < bossCutscene.maxT - 0.35) {
      bossCutscene.t = Math.min(bossCutscene.t, 0.08);
    }
  });
  cv.addEventListener('touchstart', e => {
    isTouch = true;
    if (bossCutscene && bossCutscene.t < bossCutscene.maxT - 0.35) {
      bossCutscene.t = Math.min(bossCutscene.t, 0.08);
    }
    if (state !== 'wave') return;
    e.preventDefault();
    if (e.touches.length >= 2) {
      pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      return;
    }
    if (!joy.active && e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      joy.id = t.identifier;
      joy.ox = joy.cx = t.clientX;
      joy.oy = joy.cy = t.clientY;
      joy.dx = 0; joy.dy = 0; joy.mag = 0;
      joy.active = true;
    }
  }, { passive: false });

  cv.addEventListener('touchmove', e => {
    if (state !== 'wave') return;
    e.preventDefault();
    if (e.touches.length >= 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinchDist > 10) {
        userZoomed = true;
        camZoom = Math.max(0.38, Math.min(1.55, camZoom * (d / pinchDist)));
        if (bootReady) clampCam();
      }
      pinchDist = d;
    }
    if (joy.active) {
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if (t.identifier === joy.id) {
          const rx = t.clientX - joy.ox, ry = t.clientY - joy.oy;
          const dist = Math.hypot(rx, ry);
          const clamped = Math.min(joy.maxR, dist);
          const ang = Math.atan2(ry, rx);
          joy.cx = joy.ox + Math.cos(ang) * clamped;
          joy.cy = joy.oy + Math.sin(ang) * clamped;
          // 摇杆圆心若被拖出太远则柔和跟随拇指，转向更跟手
          if (dist > joy.maxR * 1.35) {
            joy.ox += (t.clientX - joy.cx) * 0.45;
            joy.oy += (t.clientY - joy.cy) * 0.45;
          }
          if (dist > 6) {
            joy.dx = rx / dist;
            joy.dy = ry / dist;
            joy.mag = Math.min(1, dist / (joy.maxR * 0.75));
          } else {
            joy.dx = 0; joy.dy = 0; joy.mag = 0;
          }
          break;
        }
      }
    }
  }, { passive: false });

  const endTouch = e => {
    if (e.touches.length < 2) pinchDist = 0;
    if (joy.active) {
      let stillDown = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joy.id) { stillDown = true; break; }
      }
      if (!stillDown) { joy.id = null; joy.active = false; joy.dx = 0; joy.dy = 0; joy.mag = 0; }
    }
  };
  cv.addEventListener('touchend', endTouch, { passive: true });
  cv.addEventListener('touchcancel', resetJoy, { passive: true });
}

let state = 'menu', wave = 1, waveTime = 20, waveMaxTime = 20, lastUrgentSec = -1, spawnAcc = 0, shake = 0, diff = DIFFS[1];
let endlessMode = false, overtime = false, overtimeMeteorT = 1.6, hordeWave = false;
let cam = { x: WORLD.w / 2, y: WORLD.h / 2 };
let player, enemies = [], bullets = [], eBullets = [], hazards = [], drops = [], spawns = [], turrets = [], rings = [], trees = [];
let relics = [], sporeZones = [], terrains = [], portals = [], portalPairCd = 0, banners = [], bossCutscene = null;
let relicSpawnT = -1, activeSceneEvent = null, sceneEventT = 0, sandGustT = 0, sceneMobEnabled = false;
let lastBossVariant = '', lastMiniBossVariant = '';
let texts = [], particles = [], sparks = [], lightnings = [], slashes = [], beams = [], stains = [], shells = [];
let pendingLevels = 0, pendingCrates = 0, treeSpawnT = 3.2, shopOffers = [];
let rerollCost = 2, rerollBase = 2, rerollStep = 1, freeRerollsLeft = 0, anvilUpgradedMsg = '', inHurtPlayer = false;
let hudAcc = 0, last = performance.now();
const hudCache = {}, hudEls = {}, renderList = [];
function setHudText(id, val) {
  if (hudCache[id] === val) return;
  hudCache[id] = val;
  const el = hudEls[id] || (hudEls[id] = document.getElementById(id));
  if (el) el.textContent = val;
}
function setHudWidth(id, val) {
  const k = id + '_w';
  if (hudCache[k] === val) return;
  hudCache[k] = val;
  const el = hudEls[id] || (hudEls[id] = document.getElementById(id));
  if (el) el.style.width = val;
}
bootReady = true;
resize();
cam.x = WORLD.w / 2; cam.y = WORLD.h / 2;
clampCam();

function makeWeapon(id, tier = 1) {
  return { id, tier, cd: Math.random() * 0.25, thrust: 0, recoil: 0, angle: 0 };
}

function getRockCount() {
  if (!player || !player.weapons) return 0;
  let c = 0;
  for (let i = 0; i < player.weapons.length; i++) if (player.weapons[i].id === 'rock') c++;
  return c;
}

// 计算当前武器套装数量与动态属性加成
function getSetBonuses() {
  const counts = { primitive: 0, precise: 0, gun: 0, heavy: 0, elemental: 0, tech: 0 };
  if (!player) return { counts, hp: 0, crit: 0, range: 0, aspd: 0, armor: 0, blast: 0, elem: 0, tech: 0 };
  for (const w of player.weapons) {
    const s = WEAPONS[w.id] && WEAPONS[w.id].set;
    if (s && counts[s] !== undefined) counts[s]++;
  }
  const tierOf = (c, steps) => c >= steps[2] ? 3 : (c >= steps[1] ? 2 : (c >= steps[0] ? 1 : 0));
  const tPrim = tierOf(counts.primitive, [2, 4, 6]);
  const tPrec = tierOf(counts.precise,   [2, 3, 5]);
  const tGun  = tierOf(counts.gun,       [2, 4, 6]);
  const tHvy  = tierOf(counts.heavy,     [2, 3, 5]);
  const tElem = tierOf(counts.elemental, [2, 3, 5]);
  const tTech = tierOf(counts.tech,      [2, 3, 5]);
  return {
    counts,
    hp:    [0, 6, 14, 24][tPrim],
    crit:  [0, 0.08, 0.16, 0.26][tPrec],
    range: [0, 40, 85, 140][tGun],
    aspd:  [0, 0.06, 0.14, 0.22][tGun],
    armor: [0, 2, 5, 9][tHvy],
    blast: tHvy > 0 ? 0.15 : 0,
    elem:  [0, 0.15, 0.32, 0.55][tElem],
    tech:  [0, 0.22, 0.48, 0.80][tTech]
  };
}

function syncSetHp() {
  if (!player) return;
  const sb = getSetBonuses();
  const targetBonusHp = sb.hp + getRockCount() * 3;
  const delta = targetBonusHp - (player._setHp || 0);
  if (delta !== 0) {
    player.maxHp = Math.max(1, player.maxHp + delta);
    player.hp = Math.min(player.maxHp, Math.max(1, player.hp + Math.max(0, delta)));
    player._setHp = targetBonusHp;
  }
}

let waveCratesDropped = 0;

function startGame(cls) {
  beep(520, 0.08, 'triangle');
  diff = DIFFS[selectedDiff];
  inHurtPlayer = false;
  player = {
    cls, x: WORLD.w / 2, y: WORLD.h / 2, r: 21, faceDir: 1, lookA: 0,
    hp: 30, maxHp: 30, _setHp: 0, regen: 0.5, regenAcc: 0, noRegen: false, lifesteal: 0,
    armor: 0, maxShield: 0, shield: 0, shieldRegenT: 0, shieldHitT: 0,
    spd: 182, spdMul: 1, dmgMul: 1, meleeBonus: 0, elemBonus: 0, atkSpd: 0.88, crit: 0.06, critDmg: 0,
    dodge: 0, dodgeCap: 0.80, maxSlots: 6, bonusTurrets: 0, bullCd: 0,
    magnet: 130, harvest: 1, harvestFlat: 0, luck: 0, rangeBonus: 0, _displayRange: 140,
    pierceBonus: 0, bounceBonus: 0, shopDiscount: 0, freeRerolls: 0, bonusTrees: 0,
    enemySlow: 0, thorns: 0, cyberball: 0, critHeal: 0, critMeleeHeal: false, rangeToDmg: false, hasAnvil: false, healBonus: 0,
    burnChance: 0, chillChance: 0, freezeChance: 0, poisonChance: 0, maxPoisonStacks: 8, plagueSpread: false,
    meleeBossGuard: 0, blastChance: 0, explosionScale: 1,
    interest: 0, teslaCount: 0, teslaCd: 1.0, healDropBonus: 0, chillSlowT: 0, inSpore: false,
    invulnBonus: 0, fastShield: false, soulBolt: false, noSlow: false, bossCratesQueued: 0, mythicCratesQueued: 0, recentCrateIds: [],
    lavaExposure: 0, lavaTick: 0, terrainHintT: 0, terrainSpdMul: 1,
    lv: 1, xp: 0, xpNeed: 10, mats: diff.matBonus, kills: 0, invuln: 0, walkT: 0, dustT: 0, moving: false,
    weapons: [], items: {}
  };
  if (cls === 'allrounder') {
    player.maxHp += 6; player.hp += 6; player.spdMul += 0.04; player.dmgMul += 0.08; player.harvestFlat += 4;
    player.weapons.push(makeWeapon('pistol', 1), makeWeapon('stick', 1));
  } else if (cls === 'ranger') {
    player.maxHp -= 4; player.hp -= 4; player.atkSpd += 0.18; player.crit += 0.10; player.rangeBonus += 65;
    player.weapons.push(makeWeapon('smg', 1));
  } else if (cls === 'brawler') {
    player.maxHp += 14; player.hp += 14; player.regen += 2.2; player.meleeBonus = 0.20; player.rangeBonus -= 30;
    player.weapons.push(makeWeapon('stick', 1), makeWeapon('stick', 1));
  } else if (cls === 'engineer') {
    player.regen += 1.2; player.bonusTurrets = 2;
    player.weapons.push(makeWeapon('wrench', 1), makeWeapon('pistol', 1));
  } else if (cls === 'vampire') {
    player.regen = 0; player.noRegen = true; player.lifesteal = 0.16;
    player.weapons.push(makeWeapon('knife', 1), makeWeapon('knife', 1));
  } else if (cls === 'multitasker') {
    player.maxSlots = 12;
    player.weapons.push(makeWeapon('stick', 1), makeWeapon('stick', 1), makeWeapon('pistol', 1));
  } else if (cls === 'bull') {
    player.maxSlots = 0; player.maxHp += 30; player.hp += 30; player.regen += 4.5; player.armor += 3; player.spdMul += 0.12; player.r = 24;
  } else if (cls === 'ghost') {
    player.maxHp -= 6; player.hp -= 6; player.dodgeCap = 0.80; player.dodge = 0.28; player.luck += 8;
    player.weapons.push(makeWeapon('knife', 1), makeWeapon('shuriken', 1));
  }
  syncSetHp();
  wave = 1; endlessMode = false; pendingLevels = 0; pendingCrates = 0; freeRerollsLeft = 0; anvilUpgradedMsg = ''; shopOffers = [];
  logInfo('GAME', `开局 ver=${typeof APP_VERSION !== 'undefined' ? APP_VERSION : '-'}, cls=${cls}, diff=${diff.badge}, sceneMode=${selectedScene}, ui=${uiMode}, world=${WORLD.w}x${WORLD.h}`);
  document.getElementById('startMenu').classList.add('hidden');
  document.getElementById('endMenu').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  const cm = document.getElementById('crateMenu');
  if (cm) cm.classList.add('hidden');
  beginWave();
}

function showStart() {
  state = 'menu';
  resetJoy();
  document.getElementById('endMenu').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('shopMenu').classList.add('hidden');
  document.getElementById('levelMenu').classList.add('hidden');
  const cm = document.getElementById('crateMenu');
  if (cm) cm.classList.add('hidden');
  const cdx = document.getElementById('codexModal');
  if (cdx) cdx.classList.add('hidden');
  const clm = document.getElementById('changelogModal');
  if (clm) clm.classList.add('hidden');
  bossCutscene = null;
  document.getElementById('hud').classList.add('hidden');
  const sm = document.getElementById('startMenu');
  sm.classList.remove('hidden');
  sm.scrollTop = 0;
}

function renderBuildSummary(statsId, setsId) {
  if (!player) return;
  syncSetHp();
  const setB = getSetBonuses();
  const arm = getTotalArmor(), mit = Math.round(getArmorMitigation() * 100);
  const dmgPct = Math.round(getEffectiveDmgMul() * 100);
  const aspdPct = Math.round((player.atkSpd + setB.aspd) * 100);
  const critPct = Math.round(getEffectiveCrit() * 100);
  const critDmgPct = Math.round((1.95 + (player.critDmg || 0)) * 100);
  const rng = getTotalRangeBonus();
  const rngTxt = rng >= 0 ? `+${rng}` : `${rng}`;
  const harv = Math.round(player.harvestFlat || 0);
  const stEl = document.getElementById(statsId);
  if (stEl) {
    stEl.innerHTML =
      `<span>❤️ 生命 <b>${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}</b>${player.maxShield ? ` <small style="color:#72efdd">(+${Math.ceil(player.shield)}/${player.maxShield}盾)</small>` : ''}</span>` +
      `<span>🪨 护甲 <b>${arm}</b> <small>(${mit >= 0 ? '-' : '+'}${Math.abs(mit)}%伤)</small></span>` +
      `<span>🌿 再生 <b>${player.regen.toFixed(1)}/s</b></span>` +
      `<span>🩸 吸血 <b>${Math.round(player.lifesteal * 100)}%</b></span>` +
      `<span>💪 伤害 <b>${dmgPct}%</b></span>` +
      `<span>⚡ 攻速 <b>${aspdPct}%</b></span>` +
      `<span>📏 范围 <b>${rngTxt}</b></span>` +
      `<span>🎯 暴击 <b>${critPct}%</b> <small style="color:#ffd166">(${critDmgPct}%伤)</small></span>` +
      `<span>💨 闪避 <b>${Math.round(Math.min(player.dodgeCap || 0.80, player.dodge) * 100)}%</b></span>` +
      `<span>👟 移速 <b>${Math.round(getEffectiveSpdMul() * 100)}%</b></span>` +
      `<span>🍀 幸运 <b>${player.luck || 0}</b></span>` +
      `<span>🌾 收获 <b>${harv}</b></span>`;
  }
  const mqEl = document.getElementById('mobQuickStats');
  if (mqEl) {
    mqEl.innerHTML =
      `<span>❤️<b>${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}</b></span>` +
      `<span>🪨<b>${arm}</b></span>` +
      `<span>💪<b>${dmgPct}%</b></span>` +
      `<span>⚡<b>${aspdPct}%</b></span>` +
      `<span>📏<b>${rngTxt}</b></span>` +
      `<span>🎯<b>${critPct}%</b></span>`;
  }
  const srEl = document.getElementById(setsId);
  if (srEl) {
    const setPills = [];
    for (const [key, def] of Object.entries(SET_DEFS)) {
      const c = setB.counts[key];
      if (c > 0) {
        const nextStep = def.steps.find(s => s > c) || def.steps[2];
        const active = c >= def.steps[0];
        setPills.push(`<span class="set-pill${active ? ' active' : ''}" title="${def.desc}">${def.label} ${c}/${nextStep} · ${def.desc}</span>`);
      }
    }
    if (player.items) {
      for (const [iid, cnt] of Object.entries(player.items)) {
        if (cnt > 0) {
          const meta = ITEMS.find(x => x.id === iid);
          if (meta) setPills.push(`<span class="set-pill" title="${meta.desc}">${meta.icon} ${meta.name}${cnt > 1 ? ' ×' + cnt : ''}</span>`);
        }
      }
    }
    srEl.innerHTML = setPills.join('');
  }
}

function pauseGame() {
  if (state !== 'wave' || !player) return;
  state = 'paused';
  for (const k in keys) keys[k] = false;
  resetJoy();
  beep(360, 0.05, 'triangle', 0.04);
  const clsObj = CLASSES.find(c => c.id === player.cls);
  const waveTag = endlessMode ? `无尽第 ${wave} 波` : `第 ${wave} / ${MAX_WAVE} 波`;
  const timeTxt = overtime ? '超时死斗' : `剩余 ${Math.ceil(waveTime)}s`;
  document.getElementById('pauseInfo').innerHTML =
    `<b>${diff.badge}</b> · 场景：<b>${curScene.icon} ${curScene.name}</b> · 角色：<b>${clsObj ? clsObj.name : ''}</b> · 进度：<b>${waveTag}（${timeTxt}）</b> · 等级：<b>Lv.${player.lv}</b> · 晶石：<b style="color:#5ef29b">💎 ${player.mats}</b>`;
  renderBuildSummary('pauseStats', 'pauseSets');
  refreshUIPrefControls();
  const pm = document.getElementById('pauseMenu');
  pm.classList.remove('hidden');
  pm.scrollTop = 0;
}

function resumeGame() {
  if (state !== 'paused') return;
  state = 'wave';
  for (const k in keys) keys[k] = false;
  resetJoy();
  last = performance.now();
  beep(540, 0.05, 'triangle', 0.04);
  document.getElementById('pauseMenu').classList.add('hidden');
}

function togglePause() {
  if (state === 'wave') pauseGame();
  else if (state === 'paused') resumeGame();
}

function restartRun() {
  document.getElementById('pauseMenu').classList.add('hidden');
  if (player && player.cls) startGame(player.cls);
  else showStart();
}

function quitToMenu() {
  beep(320, 0.06, 'triangle', 0.04);
  showStart();
}
