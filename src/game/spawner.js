// 异星晶树机制（原版《土豆兄弟》标志性战场资源点：砍倒爆出晶石、血包果实或战利品宝箱！）
function spawnTree() {
  if (trees.length >= 4) return;
  let tx = WORLD.w * 0.5, ty = WORLD.h * 0.5;
  for (let tries = 0; tries < 10; tries++) {
    tx = 115 + Math.random() * Math.max(120, WORLD.w - 230);
    ty = 115 + Math.random() * Math.max(120, WORLD.h - 230);
    if (!player || Math.hypot(tx - player.x, ty - player.y) > 155) break;
  }
  const thp = Math.round((16 + wave * 7) * diff.hpMul);
  trees.push({ x: tx, y: ty, r: 21, hp: thp, maxHp: thp, hitFlash: 0, sway: Math.random() * 6.28 });
  rings.push({ x: tx, y: ty, r: 32, color: '#5ef29b', t: 0.24, maxT: 0.24 });
}

function hurtTree(tr, rawDmg) {
  if (!tr || tr.hp <= 0) return;
  const dmg = Math.max(1, Math.round(rawDmg));
  tr.hp -= dmg;
  tr.hitFlash = 0.09;
  addText(tr.x, tr.y - 26, dmg, '#a3e635', 14);
  addSparks(tr.x, tr.y - 8, Math.random() * 6.28, '#5ef29b', 2);
  if (tr.hp <= 0) {
    tr.hp = 0;
    beep(580, 0.08, 'triangle', 0.05);
    addBurst(tr.x, tr.y - 6, '#5ef29b', 10, 145);
    dropCrystals(tr.x, tr.y, 2 + Math.floor(wave * 0.45));
    const luck = Math.min(90, Math.max(0, (player && player.luck) || 0));
    const cratesOnMap = drops.filter(d => d.kind === 'crate').length;
    const maxWaveCrates = 1 + (luck >= 60 ? 1 : 0);
    const crateChance = Math.min(0.16, 0.05 + luck * 0.0014);
    if (waveCratesDropped < maxWaveCrates && cratesOnMap < 2 && Math.random() < crateChance) {
      waveCratesDropped++;
      drops.push({ x: tr.x, y: tr.y, kind: 'crate', bob: 0 });
      addText(tr.x, tr.y - 34, '🎁 战利品箱!', '#ffd166', 16);
    } else if (Math.random() < Math.min(0.80, 0.52 + luck * 0.004)) {
      drops.push({ x: tr.x, y: tr.y, kind: 'heal', bob: 0 });
    }
  }
}

function pickBossVariant(exclude = '') {
  const keys = Object.keys(BOSS_DEFS);
  const pool = keys.filter(k => k !== exclude && k !== lastBossVariant);
  const use = pool.length ? pool : keys.filter(k => k !== exclude);
  return use[Math.floor(Math.random() * use.length)] || 'butcher';
}

function pickMiniBossVariant(exclude = '') {
  const keys = Object.keys(MINI_BOSS_DEFS);
  const pool = keys.filter(k => k !== exclude && k !== lastMiniBossVariant);
  const use = pool.length ? pool : keys.filter(k => k !== exclude);
  return use[Math.floor(Math.random() * use.length)] || 'vanguard';
}

// 地图稀有奇遇圣物生成与特殊 Boss 召唤逻辑
function spawnSpecialRelic(forceId = null) {
  if (relics.length >= 1) return null;
  const def = forceId ? (SPECIAL_RELICS.find(r => r.id === forceId) || SPECIAL_RELICS[0]) : SPECIAL_RELICS[Math.floor(Math.random() * SPECIAL_RELICS.length)];
  let rx = WORLD.w * 0.5, ry = WORLD.h * 0.5;
  for (let tries = 0; tries < 12; tries++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 230 + Math.random() * 160;
    rx = Math.max(120, Math.min(WORLD.w - 120, (player ? player.x : WORLD.w * 0.5) + Math.cos(ang) * dist));
    ry = Math.max(120, Math.min(WORLD.h - 120, (player ? player.y : WORLD.h * 0.5) + Math.sin(ang) * dist));
    if (!player || Math.hypot(rx - player.x, ry - player.y) > 175) break;
  }
  const rel = { x: rx, y: ry, r: 44, def, charge: 0, need: 1.1, pulse: 0 };
  relics.push(rel);
  if (rings.length < 40) rings.push({ x: rx, y: ry, r: 85, color: def.color, t: 0.45, maxT: 0.45 });
  beep(740, 0.12, 'triangle', 0.06);
  if (player) addText(player.x, player.y - 68, `✨ 奇遇现世：${def.icon}${def.name}！靠近可召唤特殊首领！`, '#ffd166', 18);
  logInfo('RELIC', `刷新地图奇遇圣物 ${def.name}(${def.id}) at (${Math.round(rx)},${Math.round(ry)})`);
  return rel;
}

function summonSpecialBoss(rel) {
  if (!rel || !rel.def) return;
  const def = rel.def;
  beep(185, 0.26, 'sawtooth', 0.085);
  shake = Math.max(shake, 12);
  if (rings.length < 40) rings.push({ x: rel.x, y: rel.y, r: 150, color: def.bossColor, t: 0.38, maxT: 0.38, fill: true });
  if (lightnings.length < 35) {
    lightnings.push({ pts: [{ x: rel.x, y: Math.max(20, rel.y - 260) }, { x: rel.x - 16, y: rel.y - 120 }, { x: rel.x + 12, y: rel.y - 50 }, { x: rel.x, y: rel.y }], color: def.color, t: 0.28, maxT: 0.28 });
  }
  waveTime = Math.min(95, waveTime + 25);
  waveMaxTime = Math.max(waveMaxTime, waveTime);
  spawnWarning(rel.x, rel.y, 'special_boss', def.bossId);
  const bw = document.getElementById('bossBarWrap');
  if (bw) bw.classList.remove('hidden');
  if (player) {
    addText(player.x, player.y - 64, `${def.bossIcon} 特殊Boss【${def.bossName}】降临！回合 +25s！`, '#ffd166', 20);
  }
  logInfo('SPECIAL_BOSS', `召唤特殊首领 ${def.bossName}(${def.bossId}) · 延长回合至 ${Math.ceil(waveTime)}s`);
}

function beginWave() {
  state = 'wave';
  inHurtPlayer = false;
  resetJoy();
  confirmSellIdx = -1;
  overtime = false;
  overtimeMeteorT = 1.6;
  syncSetHp();

  const isBossWave = (wave === MAX_WAVE) || (endlessMode && wave > MAX_WAVE && wave % 3 === 0);
  const isEliteWave = !isBossWave && diff.midElite && (wave === 5 || wave === 9 || (endlessMode && wave > MAX_WAVE && wave % 3 === 2));
  hordeWave = !isBossWave && !isEliteWave && (wave === 4 || wave === 8 || (selectedDiff >= 4 && wave === 11) || (endlessMode && wave % 3 === 1));

  // 每波轮换/锁定异星战场生态并烘焙离屏大地图贴图
  pickSceneForWave(wave);
  syncArenaAndZoom(true);
  // 完全同步原版《土豆兄弟》回合时长：第 1 波 20s，每波 +5s 直至 60s 封顶，最终 Boss 波 90s
  waveTime = isBossWave ? 90 : Math.min(60, 15 + wave * 5);
  waveMaxTime = waveTime;
  lastUrgentSec = -1;
  spawnAcc = 0.25;
  hudAcc = 1;
  player.x = WORLD.w / 2; player.y = WORLD.h / 2;
  player.chillSlowT = 0; player.inSpore = false;
  cam.x = player.x; cam.y = player.y;
  clampCam();
  player.hp = player.maxHp;
  player.shield = player.maxShield;
  player.shieldRegenT = 7;
  enemies = []; bullets = []; eBullets = []; hazards = []; drops = []; spawns = []; turrets = []; rings = []; trees = [];
  relics = []; sporeZones = []; sandGustT = 0;
  texts = []; particles = []; sparks = []; lightnings = []; slashes = []; beams = []; stains = []; shells = [];

  const tc = document.getElementById('timerCapsule');
  if (tc) { tc.classList.remove('warn', 'urgent'); }
  hudCache.timerState = 'normal';
  setHudWidth('timerFill', '100%');

  // 开场生长异星晶树（单波战利品箱设有全局上限，晶树生长节奏更平滑）
  waveCratesDropped = 0;
  treeSpawnT = Math.max(7.5, 14.0 - (player.bonusTrees || 0) * 2.2);
  const initTrees = 1 + Math.min(2, player.bonusTrees || 0);
  for (let i = 0; i < initTrees; i++) spawnTree();

  // 第 3 波起按轮次逐步解锁【场景专属怪物】与【场景专属环境异象】（概率触发，非每波必出）
  if (wave >= 3) {
    sceneMobEnabled = Math.random() < Math.min(0.72, 0.30 + (wave - 2) * 0.07);
    activeSceneEvent = (!isBossWave && Math.random() < Math.min(0.65, 0.25 + (wave - 2) * 0.06)) ? curScene.eventId : null;
    sceneEventT = activeSceneEvent ? 4.2 : 999;
  } else {
    sceneMobEnabled = false;
    activeSceneEvent = null;
    sceneEventT = 999;
  }

  // 第 3 波起小概率在地图上刷出【奇遇召唤圣物】（激活进入特殊 Boss 战）
  const relicChance = (wave >= 3 && !isBossWave) ? Math.min(0.36, 0.20 + (player.luck || 0) * 0.0025) : 0;
  relicSpawnT = Math.random() < relicChance ? (3.5 + Math.random() * 3.5) : -1;

  logInfo('WAVE', `进入第 ${wave} 波 (${waveTime}s) · 场景=${curScene.name}(${curScene.id}) · 专属怪=${sceneMobEnabled} · 异象=${activeSceneEvent || '无'} · 地图=${WORLD.w}x${WORLD.h}`);
  addText(player.x, player.y - 86, `${curScene.icon} ${curScene.name}${activeSceneEvent ? ' · ' + curScene.eventIcon + curScene.eventName : ''}`, curScene.accent2, 16);

  // 部署自动防御炮台（机械师天赋 + 便携炮塔道具 + 扳手武器）
  const wrenches = player.weapons.filter(w => w.id === 'wrench');
  const totalT = player.bonusTurrets + wrenches.length;
  for (let i = 0; i < totalT; i++) {
    const a = (i / Math.max(1, totalT)) * Math.PI * 2;
    const dist = 115 + (i % 2) * 50;
    const tier = i < wrenches.length ? wrenches[i].tier : 1;
    turrets.push({
      x: WORLD.w / 2 + Math.cos(a) * dist, y: WORLD.h / 2 + Math.sin(a) * dist,
      tier, cd: 0.3 + Math.random() * 0.3, angle: 0, recoil: 0
    });
  }

  // 多样化随机精英统领、虫潮突袭与第 12 波随机主宰 Boss / 异名双王同台降临
  const bossY = Math.max(190, player.y - 320);
  const bossSpread = Math.min(220, WORLD.w * 0.23);
  if (isBossWave) {
    const v1 = pickBossVariant();
    lastBossVariant = v1;
    const b1 = BOSS_DEFS[v1];
    if (diff.doubleBoss || (endlessMode && wave >= 18)) {
      const v2 = pickBossVariant(v1);
      const b2 = BOSS_DEFS[v2];
      spawnWarning(WORLD.w / 2 - bossSpread, bossY, 'boss', v1);
      spawnWarning(WORLD.w / 2 + bossSpread, bossY, 'boss', v2);
      addText(player.x, player.y - 54, `👑 双王降临：${b1.name} & ${b2.name}！`, '#ff3b6b', 20);
    } else {
      spawnWarning(WORLD.w / 2, bossY, 'boss', v1);
      addText(player.x, player.y - 54, `${b1.icon} ${b1.name}降临！`, '#ff3b6b', 21);
    }
  } else if (isEliteWave) {
    const m1 = pickMiniBossVariant();
    lastMiniBossVariant = m1;
    const mb1 = MINI_BOSS_DEFS[m1];
    if ((diff.dualElite && wave >= 9) || (selectedDiff >= 5 && wave >= 5)) {
      const m2 = pickMiniBossVariant(m1);
      const mb2 = MINI_BOSS_DEFS[m2];
      spawnWarning(WORLD.w / 2 - bossSpread * 0.88, bossY, 'mini_boss', m1);
      spawnWarning(WORLD.w / 2 + bossSpread * 0.88, bossY, 'mini_boss', m2);
      addText(player.x, player.y - 52, `⚔️ 双统领夹击：${mb1.name} & ${mb2.name}！`, '#f72585', 19);
    } else {
      spawnWarning(WORLD.w / 2, bossY, 'mini_boss', m1);
      addText(player.x, player.y - 52, `${mb1.icon} ${mb1.name}来袭！`, '#f72585', 20);
    }
  } else if (hordeWave) {
    addText(player.x, player.y - 52, '⚠️ 高密虫潮突袭波！', '#ff9f1c', 20);
  }

  document.getElementById('shopMenu').classList.add('hidden');
  document.getElementById('levelMenu').classList.add('hidden');
  const cm = document.getElementById('crateMenu');
  if (cm) cm.classList.add('hidden');
  const cxm = document.getElementById('codexModal');
  if (cxm) cxm.classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('bossBarWrap').classList.toggle('hidden', !(isBossWave || isEliteWave));
}

function spawnWarning(x, y, type, variant = '') {
  spawns.push({ x, y, type, variant, t: 0.90, maxT: 0.90 });
}

const RANGED_ENEMY_TYPES = new Set(['shooter', 'sniper_bug', 'mortar', 'spinner', 'rad_scorpion', 'frost_wisp', 'spore_mother']);

function countActiveRangedEnemies() {
  let c = 0;
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i] && enemies[i].hp > 0 && RANGED_ENEMY_TYPES.has(enemies[i].type)) c++;
  }
  for (let i = 0; i < spawns.length; i++) {
    if (spawns[i] && RANGED_ENEMY_TYPES.has(spawns[i].type)) c++;
  }
  return c;
}

// 独立权重刷怪表（近战追击虫群占 85%+ 绝对主力，严格限制远程怪占比与同屏并发上限，彻底解决前期满屏弹幕）
function pickWaveEnemyType(wv) {
  const maxRanged = Math.min(10, 2 + Math.floor(wave * 0.7));
  const allowRanged = countActiveRangedEnemies() < maxRanged;

  if (sceneMobEnabled && curScene.exclMob && Math.random() < 0.11) {
    if (!RANGED_ENEMY_TYPES.has(curScene.exclMob) || allowRanged) {
      return curScene.exclMob;
    }
  }

  const table = [
    ['chaser', 54]
  ];
  if (wv >= 2 || (wave === 1 && waveTime < 10)) table.push(['swarmer', wave === 1 ? 12 : 14]);
  if (wv >= 2) table.push(['stalker', 11]);
  if (wv >= 3) {
    table.push(['charger', 8]);
    table.push(['bomber', 5]);
  }
  if (wv >= 4) {
    table.push(['splitter', 7]);
    table.push(['shielder', 6]);
  }
  if (wv >= 5) {
    table.push(['brute', 6]);
    table.push(['summoner', 3.5]);
  }
  if (wv >= 6) {
    table.push(['healer', 3.5]);
    table.push(['juggernaut', 3]);
  }

  if (allowRanged) {
    if (wv >= 2) table.push(['shooter', 5.5]);
    if (wv >= 3) table.push(['sniper_bug', 3.0]);
    if (wv >= 4) table.push(['mortar', 3.0]);
    if (wv >= 5) table.push(['spinner', 2.8]);
  }

  let totalW = 0;
  for (let i = 0; i < table.length; i++) totalW += table[i][1];
  let r = Math.random() * totalW;
  for (let i = 0; i < table.length; i++) {
    r -= table[i][1];
    if (r <= 0) return table[i][0];
  }
  return 'chaser';
}

// 地面高危轰炸预警圈（支持迫击虫、主宰陨石、熔炉地热火柱与紫晶流星）
function spawnHazard(x, y, r, dmg, delay = 1.22, extra = {}) {
  const cx = Math.max(r + 12, Math.min(WORLD.w - r - 12, x));
  const cy = Math.max(r + 12, Math.min(WORLD.h - r - 12, y));
  hazards.push({
    x: cx, y: cy, r,
    dmg: Math.max(3, Math.round(dmg)),
    enemyDmg: extra.enemyDmg || 0,
    dropMat: extra.dropMat || 0,
    color: extra.color || '#ff3b6b',
    t: delay, maxT: delay
  });
}

// 全异星怪物、4 大新增特异兵种、5 大场景专属怪、随机精英统领、4 大主宰 Boss 与 3 大奇遇首领生成
// （全面拉开不同怪物在体型 r、血量 hp、移速 spd 与伤害 dmg 上的生态差异，平滑前中后期成长曲线）
function createEnemy(x, y, type, variant = '') {
  const endlessMul = wave > MAX_WAVE ? Math.pow(1.25, wave - MAX_WAVE) : 1;
  const wIdx = Math.max(0, wave - 1);
  const s = (1 + wIdx * 0.38 + Math.pow(wIdx, 1.68) * 0.145) * endlessMul * diff.hpMul;
  const dm = (1 + wIdx * 0.16 + Math.max(0, wave - 6) * 0.08) * (wave > MAX_WAVE ? Math.pow(1.12, wave - MAX_WAVE) : 1) * diff.dmgMul;
  const sm = (1 + Math.min(0.22, wIdx * 0.016)) * diff.spdMul;
  const base = { x, y, hitFlash: 0, phase: Math.random() * 6.28, vx: 0, vy: 0, faceA: 0, burnT: 0, burnTick: 0, burnDmg: 0, chillT: 0, elite: false };

  if (type === 'swarmer') {
    const swCnt = wave >= 8 ? 4 : (wave >= 5 ? 3 : 2);
    for (let k = 0; k < swCnt; k++) {
      const ox = x + (Math.random() - 0.5) * 40, oy = y + (Math.random() - 0.5) * 40;
      enemies.push({ ...base, x: ox, y: oy, r: 9, hp: 5.0 * s, maxHp: 5.0 * s, spd: (146 + wave * 2.2) * sm, dmg: Math.max(2, Math.round(2.2 * dm)), color: '#ffbe0b', type, mat: k === 0 ? 1 : (Math.random() < 0.45 ? 1 : 0) });
    }
    addBurst(x, y, '#ff4d6d', 5, 85);
    return;
  }

  let ent;
  if (type === 'boss') {
    const bKey = (variant && BOSS_DEFS[variant]) ? variant : pickBossVariant();
    const bDef = BOSS_DEFS[bKey];
    const twinScale = (diff.doubleBoss || (endlessMode && wave >= 18)) ? 0.78 : 1;
    const bhp = Math.round((5600 + Math.max(0, wave - MAX_WAVE) * 2600) * endlessMul * diff.hpMul * twinScale);
    ent = {
      ...base, r: 46, hp: bhp, maxHp: bhp, spd: bDef.spd * sm, dmg: Math.round(11.0 * dm),
      color: bDef.color, type: 'boss', variant: bKey, bossTitle: `${bDef.icon} ${bDef.name}`,
      dashT: 2.5, sumT: 6.2, meteorT: 4.2, skillT: 2.2, burstLeft: 0, burstCd: 0, mat: 45
    };
  } else if (type === 'mini_boss') {
    const mKey = (variant && MINI_BOSS_DEFS[variant]) ? variant : pickMiniBossVariant();
    const mDef = MINI_BOSS_DEFS[mKey];
    const mhp = Math.round((640 + wave * 185 + Math.pow(wave, 2.15) * 14) * endlessMul * diff.hpMul);
    ent = {
      ...base, r: 35, hp: mhp, maxHp: mhp, spd: mDef.spd * sm, dmg: Math.round(8.4 * dm),
      color: mDef.color, type: 'mini_boss', variant: mKey, bossTitle: `${mDef.icon} ${mDef.name}`,
      dashT: 2.3, meteorT: 4.8, skillT: 2.1, mat: 22
    };
  } else if (type === 'special_boss') {
    const relDef = SPECIAL_RELICS.find(r => r.bossId === variant) || SPECIAL_RELICS[0];
    const shp = Math.round((980 + wave * 300 + Math.pow(wave, 2.22) * 21) * endlessMul * diff.hpMul);
    const sSpd = relDef.bossId === 'crimson_lord' ? 98 : (relDef.bossId === 'golden_golem' ? 72 : 86);
    ent = {
      ...base, r: 41, hp: shp, maxHp: shp, spd: sSpd * sm, dmg: Math.round(9.2 * dm),
      color: relDef.bossColor, type: 'special_boss', variant: relDef.bossId, bossTitle: `${relDef.bossIcon} ${relDef.bossName}`,
      dashT: 2.1, skillT: 2.0, meteorT: 4.2, goldStage: 4, mat: relDef.bossId === 'golden_golem' ? 48 : (relDef.bossId === 'crimson_lord' ? 30 : 26)
    };
  } else if (type === 'stalker') {
    ent = { ...base, r: 13, hp: 11.0 * s, maxHp: 11.0 * s, spd: 124 * sm, dmg: Math.round(4.8 * dm), color: '#06d6a0', type, slashCd: 0.7, mat: 2 };
  } else if (type === 'sniper_bug') {
    ent = { ...base, r: 15, hp: 11.5 * s, maxHp: 11.5 * s, spd: 54 * sm, dmg: Math.round(6.8 * dm), color: '#ef233c', type, shotT: 2.1 + Math.random() * 0.8, aimA: undefined, mat: 3 };
  } else if (type === 'spinner') {
    ent = { ...base, r: 19, hp: 26 * s, maxHp: 26 * s, spd: 72 * sm, dmg: Math.round(5.0 * dm), color: '#f59e0b', type, shotT: 2.1 + Math.random() * 0.8, mat: 3 };
  } else if (type === 'juggernaut') {
    ent = { ...base, r: 36, hp: 135 * s, maxHp: 135 * s, spd: 40 * sm, dmg: Math.round(10.5 * dm), color: '#475569', type, mat: 7 };
  } else if (type === 'rad_scorpion') {
    ent = { ...base, r: 21, hp: 34 * s, maxHp: 34 * s, spd: 70 * sm, dmg: Math.round(5.5 * dm), color: '#a3e635', type, shotT: 2.0 + Math.random() * 0.8, mat: 3 };
  } else if (type === 'sand_worm') {
    ent = { ...base, r: 17, hp: 22 * s, maxHp: 22 * s, spd: 102 * sm, dmg: Math.round(5.4 * dm), color: '#f4a261', type, dashT: 1.9 + Math.random() * 0.8, mat: 3 };
  } else if (type === 'frost_wisp') {
    ent = { ...base, r: 15, hp: 16 * s, maxHp: 16 * s, spd: 82 * sm, dmg: Math.round(4.6 * dm), color: '#48cae4', type, shotT: 1.8 + Math.random() * 0.8, mat: 3 };
  } else if (type === 'magma_imp') {
    ent = { ...base, r: 14, hp: 14 * s, maxHp: 14 * s, spd: 118 * sm, dmg: Math.round(5.6 * dm), color: '#fb5607', type, mat: 3 };
  } else if (type === 'spore_mother') {
    ent = { ...base, r: 26, hp: 52 * s, maxHp: 52 * s, spd: 48 * sm, dmg: Math.round(5.8 * dm), color: '#c77dff', type, shotT: 2.4 + Math.random() * 0.9, mat: 4 };
  } else if (type === 'charger') {
    ent = { ...base, r: 22, hp: 32 * s, maxHp: 32 * s, spd: 78 * sm, dmg: Math.round(6.2 * dm), color: '#f77f00', type, dashT: 2.0 + Math.random() * 0.9, mat: 3 };
  } else if (type === 'shooter') {
    ent = { ...base, r: 16, hp: 12.5 * s, maxHp: 12.5 * s, spd: 62 * sm, dmg: Math.round(4.2 * dm), color: '#00b4d8', type, shotT: 1.6 + Math.random() * 0.9, mat: 2 };
  } else if (type === 'mortar') {
    ent = { ...base, r: 20, hp: 22 * s, maxHp: 22 * s, spd: 52 * sm, dmg: Math.round(7.8 * dm), color: '#ff9f1c', type, shotT: 2.0 + Math.random() * 1.0, mat: 3 };
  } else if (type === 'bomber') {
    ent = { ...base, r: 15, hp: 12 * s, maxHp: 12 * s, spd: 112 * sm, dmg: Math.round(8.8 * dm), color: '#ff4d6d', type, primed: false, fuseT: 1.25, maxFuseT: 1.25, blastR: 86, mat: 2 };
  } else if (type === 'splitter') {
    ent = { ...base, r: 24, hp: 36 * s, maxHp: 36 * s, spd: 64 * sm, dmg: Math.round(4.4 * dm), color: '#52b788', type, mat: 3 };
  } else if (type === 'mini_slime') {
    ent = { ...base, r: 10, hp: 5.5 * s, maxHp: 5.5 * s, spd: 128 * sm, dmg: Math.max(2, Math.round(2.2 * dm)), color: '#74c69d', type, mat: Math.random() < 0.35 ? 1 : 0 };
  } else if (type === 'shielder') {
    ent = { ...base, r: 23, hp: 46 * s, maxHp: 46 * s, spd: 58 * sm, dmg: Math.round(5.5 * dm), color: '#5c677d', type, mat: 4 };
  } else if (type === 'summoner') {
    ent = { ...base, r: 18, hp: 20 * s, maxHp: 20 * s, spd: 54 * sm, dmg: Math.round(3.5 * dm), color: '#7209b7', type, sumT: 3.1 + Math.random(), mat: 4 };
  } else if (type === 'healer') {
    ent = { ...base, r: 17, hp: 22 * s, maxHp: 22 * s, spd: 62 * sm, dmg: Math.round(3.0 * dm), color: '#2ec4b6', type, healT: 2.5, mat: 4 };
  } else if (type === 'brute') {
    ent = { ...base, r: 32, hp: 96 * s, maxHp: 96 * s, spd: 50 * sm, dmg: Math.round(8.5 * dm), color: '#9d4edd', type, slamCd: 2.5, mat: 5 };
  } else {
    ent = { ...base, r: 15, hp: 15.5 * s, maxHp: 15.5 * s, spd: (86 + wave * 2.0) * sm, dmg: Math.max(2, Math.round(3.4 * dm)), color: '#d65db1', type: 'chaser', mat: Math.random() < 0.65 ? 1 : 2 };
  }

  // 第 3 波起按难度刷出【狂化精英词缀怪】（金色描边光环，高血高速，亡语慢速毒刺环，双倍赏金）
  const isBossLike = type === 'boss' || type === 'mini_boss' || type === 'special_boss';
  const canElite = wave >= 3 && !isBossLike && type !== 'mini_slime' && type !== 'bomber' && (type !== 'juggernaut' || wave >= 8);
  const eChance = (diff.eliteRate || 0.05) + Math.min(0.10, (wave - 3) * 0.01);
  if (canElite && Math.random() < eChance) {
    ent.elite = true;
    ent.r = Math.round(ent.r * 1.22);
    ent.hp = Math.round(ent.hp * 2.45);
    ent.maxHp = ent.hp;
    ent.spd *= 1.06;
    ent.dmg = Math.round(ent.dmg * 1.28);
    ent.mat = Math.max(2, Math.round(ent.mat * 2));
  }

  enemies.push(ent);
  addBurst(x, y, ent.elite ? '#ffd166' : ent.color, isBossLike ? 16 : (ent.elite ? 8 : 5), isBossLike ? 150 : 85);
  return ent;
}
