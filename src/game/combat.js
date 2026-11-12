// 战斗数值结算、连锁闪电、范围爆炸、护甲闪避、战利品掉落与双轨清晰提示系统
// 双轨飘字分级：只有本体关键状态/奇遇/地形/首领/升级提示（important=true 或 customDur>=1.25）才带深色胶囊底并持久停留；
// 怪物普通反馈（如格挡、冰冻、自爆预警）与高频微回血飘字（important=false）轻快上浮并迅速消隐，不遮挡视野亦零测量开销。
function addText(x, y, txt, color = '#fff', size = 16, customDur = 0, forceImportant = null) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const s = String(txt);
  const isNumericHit = /^[+-]?\d+!?$/.test(s);
  const important = forceImportant !== null
    ? !!forceImportant
    : (customDur > 0 ? customDur >= 1.25 : !isNumericHit);
  const dur = customDur > 0 ? customDur : (important ? 1.85 : 0.62);
  const cap = isTouch ? 58 : 95;
  if (texts.length >= cap) {
    // 优先淘汰普通伤害/轻提示，绝不让高频弹幕把角色头顶的关键状态/奇遇提示挤掉
    let dropIdx = -1;
    for (let i = 0; i < texts.length; i++) {
      if (!texts[i].important) { dropIdx = i; break; }
    }
    if (dropIdx === -1) dropIdx = 0;
    texts.splice(dropIdx, 1);
  }
  texts.push({
    x: x + (Math.random() - 0.5) * (important ? 10 : 16), y,
    vx: (Math.random() - 0.5) * (important ? 12 : 44),
    vy: important ? (-30 - Math.random() * 8) : (-114 - Math.random() * 36),
    txt: s, color, size, t: dur, maxT: dur, important, _baseW: -1
  });
}

// 屏幕上方战术事件持久横幅播报（停留 3.2~4.2 秒，清晰易读不挡操作）
function announce(txt, color = '#ffd166', dur = 3.4) {
  if (typeof banners === 'undefined') return;
  const s = String(txt);
  const existing = banners.find(b => b.txt === s);
  if (existing) {
    existing.t = Math.max(existing.t, dur);
    existing.maxT = Math.max(existing.maxT, dur);
    existing.color = color;
    return;
  }
  if (banners.length >= 2) banners.shift();
  banners.push({ txt: s, color, t: dur, maxT: dur, _tw: 0, _fSize: 0 });
}

let _partWriteIdx = 0, _sparkWriteIdx = 0;
function pushParticle(p) {
  const cap = isTouch ? 110 : 180;
  if (particles.length < cap) {
    particles.push(p);
  } else {
    particles[_partWriteIdx++ % cap] = p;
  }
}

function pushSpark(sp) {
  const cap = isTouch ? 55 : 95;
  if (sparks.length < cap) {
    sparks.push(sp);
  } else {
    sparks[_sparkWriteIdx++ % cap] = sp;
  }
}

function pushStain(st) {
  const maxStains = isTouch ? 55 : 100;
  if (stains.length >= maxStains) stains.splice(0, 14);
  stains.push(st);
}

function pickRandomAliveEnemy(exclude = null) {
  let count = 0, chosen = null;
  for (let i = 0; i < enemies.length; i++) {
    const o = enemies[i];
    if (o && o !== exclude && o.hp > 0 && !o.primed) {
      count++;
      if (Math.random() * count < 1) chosen = o;
    }
  }
  return chosen;
}

function addBurst(x, y, color, n = 6, speed = 135) {
  const cnt = isTouch ? Math.max(4, Math.ceil(n * 0.78)) : n;
  for (let i = 0; i < cnt; i++) {
    const a = Math.random() * Math.PI * 2, s = 35 + Math.random() * speed;
    const dur = 0.26 + Math.random() * 0.18;
    pushParticle({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 2.6 + Math.random() * 3.2, color, t: dur, maxT: dur });
  }
}

// 利落明亮的方向性受击火花（白炽内芯 + 彩芒拖尾）
function addSparks(x, y, baseA, color = '#ffe8a3', n = 3) {
  const cnt = isTouch ? Math.max(2, Math.ceil(n * 0.8)) : n;
  for (let i = 0; i < cnt; i++) {
    const a = baseA + (Math.random() - 0.5) * 1.15;
    const spd = 165 + Math.random() * 210;
    pushSpark({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, len: 9 + Math.random() * 8, color, t: 0.19, maxT: 0.19 });
  }
}

// 连锁闪电弹跳逻辑（电击枪 & 特斯拉线圈共用）
function castChainLightning(sx, sy, firstTarget, jumps, rawDmg, critChance) {
  const visited = new Set();
  let curX = sx, curY = sy, target = firstTarget;
  for (let step = 0; step < jumps && target; step++) {
    visited.add(target);
    const pts = [{ x: curX, y: curY }];
    const segs = 4;
    for (let s = 1; s < segs; s++) {
      const f = s / segs;
      const jx = (Math.random() - 0.5) * 18, jy = (Math.random() - 0.5) * 18;
      pts.push({ x: curX + (target.x - curX) * f + jx, y: curY + (target.y - curY) * f + jy });
    }
    pts.push({ x: target.x, y: target.y });
    if (lightnings.length < 35) {
      lightnings.push({ pts, color: step === 0 ? '#72efdd' : '#4cc9f0', t: 0.14, maxT: 0.14 });
    }

    const isCrit = Math.random() < critChance;
    const falloff = Math.pow(0.88, step);
    const cmul = getEffectiveCritMult(1.85);
    hurtEnemy(target, rawDmg * falloff * (isCrit ? cmul : 1), isCrit, Math.atan2(target.y - curY, target.x - curX), true, { forceChill: true });
    curX = target.x; curY = target.y;

    let next = null, bestDSq = 195 * 195;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e && e.hp > 0 && !e.primed && !visited.has(e)) {
        const dx = e.x - curX, dy = e.y - curY;
        const dSq = dx * dx + dy * dy;
        if (dSq < bestDSq) { bestDSq = dSq; next = e; }
      }
    }
    target = next;
  }
}

// 冲击波/爆炸逻辑（支持常规实心爆破与 innerSafeR > 0 的「贴身内圈安全外环震波」，带递归深度熔断保护）
let blastDepth = 0;
function triggerExplosion(x, y, radius, enemyDmg, hurtPlayerToo = false, playerDmg = 0, ringColor = '#ff595e', leaveScorch = true, innerSafeR = 0) {
  if (blastDepth > 3 || !Number.isFinite(x) || !Number.isFinite(y)) return;
  blastDepth++;
  try {
    radius = Math.max(8, radius || 40);
    if (rings.length < 40) rings.push({ x, y, r: radius, innerR: innerSafeR || 0, color: ringColor, t: 0.32, maxT: 0.32, fill: !innerSafeR });
    if (leaveScorch && !innerSafeR) {
      pushStain({ x, y, r: radius * 0.42, color: '#14101c', kind: 'scorch' });
    }
    beep(135, 0.13, 'sawtooth', 0.06);
    addBurst(x, y, ringColor, 14, 210);
    addSparks(x, y, Math.random() * 6.28, '#ffd166', 8);
    if (enemyDmg > 0) {
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e || e.hp <= 0 || e.primed) continue;
        const dx = e.x - x, dy = e.y - y;
        const outerR = radius + e.r;
        const dSq = dx * dx + dy * dy;
        if (dSq <= outerR * outerR && (!innerSafeR || dSq >= Math.max(0, innerSafeR - e.r) * Math.max(0, innerSafeR - e.r))) {
          const applyNapalm = !hurtPlayerToo && player && player.napalmBlast;
          hurtEnemy(e, enemyDmg, false, Math.atan2(dy, dx), true, { noProc: true, knockMult: 1.4, forceBurn: applyNapalm });
        }
      }
      for (let i = trees.length - 1; i >= 0; i--) {
        const tr = trees[i];
        if (!tr || tr.hp <= 0) continue;
        const dx = tr.x - x, dy = tr.y - y, lim = radius + tr.r;
        if (dx * dx + dy * dy <= lim * lim) {
          hurtTree(tr, enemyDmg * 0.6);
        }
      }
    }
    if (hurtPlayerToo && player && state === 'wave') {
      const dP = Math.hypot(player.x - x, player.y - y);
      if (innerSafeR > 0 && dP < innerSafeR - 4) {
        if (player.terrainHintT <= 0) {
          player.terrainHintT = 1.6;
          addText(player.x, player.y - 38, '✨ 贴身风眼无伤规避!', '#72efdd', 15, 1.5);
        }
      } else if (dP <= radius + player.r - 6) {
        hurtPlayer(playerDmg);
      }
    }
  } finally {
    blastDepth--;
  }
}

function getTotalArmor() { return (player ? player.armor : 0) + getSetBonuses().armor + getRockCount(); }
function getTotalRangeBonus() { return (player ? player.rangeBonus : 0) + getSetBonuses().range; }
function getArmorMitigation() {
  const a = getTotalArmor();
  return a >= 0 ? Math.min(0.70, a / (a + 18)) : Math.max(-0.6, a * 0.06);
}
function getEffectiveDmgMul() {
  if (!player) return 1;
  const penalty = player.cls === 'multitasker' ? player.weapons.length * 0.04 : 0;
  const rangeConvert = player.rangeToDmg ? Math.max(0, Math.floor(getTotalRangeBonus() / 15)) * 0.01 : 0;
  const hpConvert = (player.hpToDmg || 0) > 0 ? Math.max(0, Math.floor(player.maxHp / 5)) * 0.02 * player.hpToDmg : 0;
  const armorConvert = (player.armorToDmg || 0) > 0 ? Math.max(0, getTotalArmor()) * 0.015 * player.armorToDmg : 0;
  return Math.max(0.25, player.dmgMul - penalty + rangeConvert + hpConvert + armorConvert);
}
function getEffectiveAtkSpd() {
  if (!player) return 1;
  const missingBonus = player.cls === 'vampire' ? (1 - Math.max(0, player.hp) / Math.max(1, player.maxHp)) * 0.9 : 0;
  const sporeBonus = player.inSpore ? 0.14 : 0;
  return Math.max(0.3, player.atkSpd + getSetBonuses().aspd + missingBonus + sporeBonus);
}
function getEffectiveCrit() { return (player ? player.crit : 0) + getSetBonuses().crit; }
function getEffectiveCritMult(baseMult = 1.95) { return baseMult + (player ? (player.critDmg || 0) : 0); }
function getElemMul() { return 1 + (player ? player.elemBonus : 0) + getSetBonuses().elem; }
function getTechMul() { return 1 + (player ? (player.techBonus || 0) : 0) + getSetBonuses().tech; }
function getBlastScale() { return (player ? player.explosionScale : 1) + getSetBonuses().blast; }
function getEffectiveSpdMul() {
  if (!player) return 1;
  return player.noSlow ? Math.max(1.0, player.spdMul) : Math.max(0.72, player.spdMul);
}

// 冰冻与剧毒元素状态施加函数
function applyFreeze(e, dur = 1.2) {
  if (!e || e.hp <= 0 || e.primed) return;
  const isBossLike = e.type === 'boss' || e.type === 'special_boss' || e.type === 'mini_boss';
  const actualDur = isBossLike ? 0.55 : dur;
  const wasFrozen = (e.freezeT || 0) > 0.1;
  e.freezeT = Math.max(e.freezeT || 0, actualDur);
  e.chillT = Math.max(e.chillT || 0, actualDur + 1.4);
  if (!wasFrozen && !isBossLike) {
    addText(e.x, e.y - e.r - 8, '❄️冰冻!', '#72efdd', 13, 0.48, false);
  }
}

function applyPoison(e, addStacks = 1) {
  if (!e || e.hp <= 0 || e.primed) return;
  const maxS = (player && player.maxPoisonStacks) || 8;
  e.poisonStacks = Math.min(maxS, (e.poisonStacks || 0) + addStacks);
  e.poisonT = 4.2;
  if (!e.poisonTick || e.poisonTick <= 0) e.poisonTick = 0.46;
}

// 首领 25% 概率触发的【隐藏二阶段 · 真红神话觉醒】（回血狂暴 + 补充 60 秒 + 播放隐藏动画 + 必爆传说神装，同波防双王叠加）
function triggerBossMythicPhase2(e) {
  if (!e || e.mythicPhase2) return false;
  if (player && player.waveMythicAwakened) {
    e.canPhase2 = false;
    return false;
  }
  if (player) {
    player.waveMythicAwakened = true;
    player.mythicAwakenedCount = (player.mythicAwakenedCount || 0) + 1;
  }
  e.mythicPhase2 = true;
  e.canPhase2 = false;
  e.maxHp = Math.max(300, Math.round(e.maxHp * 0.74));
  e.hp = e.maxHp;
  e.r = Math.round(e.r * 1.14);
  e.dmg = Math.round(e.dmg * 1.16);
  e.spd *= 1.10;
  e.exposeT = 0;
  if (!String(e.bossTitle || '').includes('神话')) {
    e.bossTitle = `⚡ ${e.bossTitle || '深渊首领'} · 神话二阶段`;
  }
  overtime = false;
  waveTime = Math.min(135, waveTime + 60);
  waveMaxTime = Math.max(waveMaxTime, waveTime);

  // 清空玩家身边密集敌弹并给予无敌帧保护，保证二阶段转场公平且充满史诗仪式感
  if (player) {
    player.invuln = Math.max(player.invuln || 0, 1.85);
    for (let i = eBullets.length - 1; i >= 0; i--) {
      if (Math.hypot(eBullets[i].x - player.x, eBullets[i].y - player.y) < 260) eBullets.splice(i, 1);
    }
  }
  beep(155, 0.32, 'sawtooth', 0.09);
  if (rings.length < 40) {
    rings.push({ x: e.x, y: e.y, r: 240, color: '#ffd166', t: 0.45, maxT: 0.45, fill: true });
    rings.push({ x: e.x, y: e.y, r: 165, color: '#ff2a55', t: 0.36, maxT: 0.36 });
  }
  addBurst(e.x, e.y, '#ffd166', 28, 260);
  if (lightnings.length < 35) {
    for (let k = -1; k <= 1; k++) {
      lightnings.push({ pts: [{ x: e.x + k * 42, y: Math.max(10, e.y - 320) }, { x: e.x + k * 18, y: e.y - 140 }, { x: e.x, y: e.y }], color: k === 0 ? '#ffd166' : '#ff2a55', t: 0.35, maxT: 0.35 });
    }
  }
  const bw = document.getElementById('bossBarWrap');
  if (bw) { bw.classList.remove('hidden'); bw.classList.add('mythic'); }
  if (typeof startBossCutscene === 'function') {
    startBossCutscene(
      'mythic_phase2',
      e.variant,
      (e.bossTitle || '神话首领').replace(/^⚡\s*/, ''),
      '⚡ 隐藏二阶段觉醒 · 真红神话狂暴形态！',
      '⏱️ 决战时间补充 +60秒 · 击败必爆【传说神装秘宝舱】与永久赐福！',
      '#ff2a55',
      '#ffd166',
      1.45
    );
  }
  if (player) addText(player.x, player.y - 52, '⚡ 隐藏二阶段觉醒！时间 +60s！', '#ffd166', 21, 2.8);
  announce('⚡ 逆天异变！首领觉醒【隐藏神话二阶段】，补充 +60 秒，击败必掉传说神装！', '#ffd166', 4.5);
  logInfo('MYTHIC_PHASE2', `首领触发隐藏二阶段觉醒 ${e.bossTitle} · HP=${e.maxHp} · 延长回合至 ${Math.ceil(waveTime)}s`);
  return true;
}

function primeBomber(e) {
  if (!e || e.primed) return;
  e.primed = true;
  e.hp = 1;
  e.fuseT = 1.25;
  e.maxFuseT = 1.25;
  beep(520, 0.06, 'sawtooth', 0.032);
  addText(e.x, e.y - e.r - 10, '⚠️ 自爆预警!', '#ffbe0b', 13, 0.68, false);
}

function hurtEnemy(e, rawDmg, isCrit, knockA = null, ignoreShield = false, opts = {}) {
  if (!e || e.hp <= 0 || e.primed || !Number.isFinite(rawDmg)) return;
  if (!Number.isFinite(e.hp)) { e.hp = 0; return; }

  // 铁甲圣甲虫正面举盾减伤 45% + 金属格挡火星（格挡轻提示 0.38s 快隐 + 0.28s 节流防刷屏）
  const faceA = Number.isFinite(e.faceA) ? e.faceA : 0;
  if (e.type === 'shielder' && !ignoreShield && knockA !== null && Math.cos(knockA - faceA) < -0.25) {
    rawDmg *= 0.55;
    beep(880, 0.025, 'triangle', 0.025);
    addSparks(e.x + Math.cos(faceA) * e.r, e.y + Math.sin(faceA) * e.r, faceA, '#90e0ef', 4);
    if (!e._blkTxtCd || e._blkTxtCd <= 0) {
      e._blkTxtCd = 0.28;
      addText(e.x, e.y - e.r - 12, '格挡', '#90e0ef', 12, 0.38, false);
    }
  }

  // 远近战公平性与三系元素联动增伤：
  // 1) 近战武器对首领/统领自带 +22% 破甲加成，杜绝近战打首领吃亏
  const isBossTarget = e.type === 'boss' || e.type === 'special_boss' || e.type === 'mini_boss';
  if (opts.isMelee && isBossTarget) rawDmg *= 1.22;
  // 2) 首领大招后的【破绽暴露】窗口期承受额外高额伤害（近战 +25%，远程 +15%）
  if (e.exposeT > 0) rawDmg *= (opts.isMelee ? 1.25 : 1.15);
  // 3) 【剧毒】叠层腐蚀易伤：每层使目标承受伤害 +3%
  if (e.poisonT > 0 && e.poisonStacks > 0) rawDmg *= (1 + e.poisonStacks * 0.03);
  // 4) 【冰冻碎裂】：对冰冻态（或持有绝对零度棱镜时的冰缓态）敌人暴击额外 +25% 伤害
  const shatterCrit = isCrit && ((e.freezeT || 0) > 0 || (player && player.freezeChance > 0 && (e.chillT || 0) > 0));
  if (shatterCrit) rawDmg *= 1.25;
  // 5) 【三象元素秘典】元素共鸣：目标身上每存在 1 种元素异常（灼烧/冰缓或冰冻/剧毒），额外承受 +12% 伤害
  if (player && player.elemSynergy) {
    const ailCnt = ((e.burnT || 0) > 0 ? 1 : 0) + (((e.chillT || 0) > 0 || (e.freezeT || 0) > 0) ? 1 : 0) + ((e.poisonT || 0) > 0 ? 1 : 0);
    if (ailCnt > 0) rawDmg *= (1 + ailCnt * 0.12);
  }

  const dmg = Math.max(1, Math.round(rawDmg));
  e.hp -= dmg;
  if (!opts.isDot) e.hitFlash = 0.09;

  if (knockA !== null && e.type !== 'boss' && e.type !== 'mini_boss' && e.type !== 'special_boss') {
    const baseKb = e.type === 'juggernaut' ? 1.2 : ((e.type === 'brute' || e.type === 'shielder') ? 3 : 10);
    const kb = baseKb * (opts.knockMult || 1);
    e.x += Math.cos(knockA) * kb; e.y += Math.sin(knockA) * kb;
  }

  // 黄金晶石巨神受击阶段掉钻特性（每损耗 20% 血量喷发一波高能晶石，超量斩杀亦全额结算）
  if (e.variant === 'golden_golem' && e.goldStage > 0) {
    const safeMax = Math.max(1, e.maxHp || 1);
    while (e.goldStage > 0 && Math.max(0, e.hp) / safeMax <= e.goldStage * 0.2) {
      e.goldStage--;
      dropCrystals(e.x, e.y, 6);
      addText(e.x, e.y - e.r - 14, '💎 黄金碎晶 +6!', '#ffd166', 15, 1.5, true);
    }
  }

  if (opts.isDot) {
    addText(e.x, e.y - e.r - 2, dmg, opts.dotColor || '#ff9f1c', 12, 0.52, false);
  } else {
    const hitCol = shatterCrit ? '#72efdd' : (isCrit ? '#ffd166' : '#ffffff');
    addSparks(e.x, e.y, knockA !== null ? knockA + Math.PI : Math.random() * 6.28, isCrit ? '#ffd166' : '#fff3b0', isCrit ? 4 : 2);
    addText(e.x, e.y - e.r - 4, isCrit ? dmg + '!' : dmg, hitCol, isCrit ? 21 : 15, 0.62, false);
    beep(isCrit ? 360 : 240, 0.028, 'sawtooth', 0.025);

    // 攻击附带【🔥灼烧 / ❄️冰冻与冰缓 / ☠️剧毒 / 💥高爆弹头】判定
    if (opts.forceBurn || (player.burnChance > 0 && Math.random() < player.burnChance)) {
      e.burnT = 3.0;
      e.burnDmg = Math.max(e.burnDmg || 0, Math.max(2, (4.0 + wave * 1.25) * getElemMul() * getEffectiveDmgMul()));
      if (!e.burnTick || e.burnTick <= 0) e.burnTick = 0.42;
    }
    if (opts.forceFreeze || (player.freezeChance > 0 && Math.random() < player.freezeChance)) {
      applyFreeze(e, 1.2);
    } else if (opts.forceChill || (player.chillChance > 0 && Math.random() < player.chillChance)) {
      e.chillT = Math.max(e.chillT || 0, 2.1);
    }
    if (opts.forcePoison || (player.poisonChance > 0 && Math.random() < player.poisonChance)) {
      applyPoison(e, 1);
    }
    if (!opts.noProc && player.blastChance > 0 && Math.random() < player.blastChance) {
      triggerExplosion(e.x, e.y, 68 * getBlastScale(), dmg * 0.55 * getElemMul(), false, 0, '#ff9f1c', true);
    }

    // 生命窃取、【暴击触手】与【暗影处决徽章】近战暴击回血判定（含【猩红血契】鲜血新星联动）
    let healedByHit = false;
    if (player.lifesteal > 0 && player.hp > 0 && player.hp < player.maxHp && Math.random() < player.lifesteal) {
      player.hp = Math.min(player.maxHp, player.hp + 1);
      addText(player.x, player.y - 24, '+1 🩸', '#ff4d6d', 13, 0.58, false);
      healedByHit = true;
    } else if (isCrit && player.critHeal > 0 && player.hp > 0 && player.hp < player.maxHp && Math.random() < player.critHeal) {
      player.hp = Math.min(player.maxHp, player.hp + 1);
      addText(player.x, player.y - 24, '+1 🦑', '#5ef29b', 13, 0.58, false);
      healedByHit = true;
    } else if (isCrit && opts.isMelee && player.critMeleeHeal && player.hp > 0 && player.hp < player.maxHp && Math.random() < 0.35) {
      player.hp = Math.min(player.maxHp, player.hp + 1);
      addText(player.x, player.y - 24, '+1 🗡️', '#ffd166', 13, 0.58, false);
      healedByHit = true;
    }
    if (healedByHit && !opts.noProc && player.bloodNova && Math.random() < 0.48) {
      const novaR = 96 * getBlastScale();
      const novaDmg = (11 + wave * 2.2) * getEffectiveDmgMul();
      if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: novaR, color: '#ff2a55', t: 0.24, maxT: 0.24, fill: true });
      for (let k = enemies.length - 1; k >= 0; k--) {
        const nb = enemies[k];
        if (!nb || nb.hp <= 0 || nb.primed) continue;
        const dx = nb.x - player.x, dy = nb.y - player.y, lim = novaR + nb.r;
        if (dx * dx + dy * dy <= lim * lim) {
          hurtEnemy(nb, novaDmg, false, Math.atan2(dy, dx), true, { noProc: true });
        }
      }
    }
  }

  if (e.hp <= 0) {
    if (e.type === 'bomber' && !e.primed) {
      primeBomber(e);
      return;
    }
    if ((e.type === 'boss' || e.type === 'special_boss') && e.canPhase2 && !e.mythicPhase2) {
      triggerBossMythicPhase2(e);
      return;
    }
    killEnemyRewards(e);
  }
}

// 晶石智能聚拢掉落（高额怪合成为高能大晶石，场地上限时自动并入邻近晶石，0 掉帧且收益 100% 一致）
function dropCrystals(x, y, totalMat) {
  let rem = Math.min(500, Math.max(0, Math.round(totalMat || 0)));
  const chunk = rem >= 15 ? 5 : (rem >= 4 ? 2 : 1);
  let guard = 0;
  while (rem > 0 && guard++ < 120) {
    const val = Math.min(rem, chunk);
    rem -= val;
    if (drops.length >= 56) {
      let merged = false;
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (d.kind === 'mat') {
          d.val = (d.val || 1) + val;
          merged = true;
          break;
        }
      }
      if (merged) continue;
    }
    const a = Math.random() * Math.PI * 2, dist = Math.random() * 20;
    drops.push({ x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist, kind: 'mat', val, bob: Math.random() * 6.28 });
  }
}

function killEnemyRewards(e) {
  e.hp = 0;
  player.kills++;
  pushStain({ x: e.x, y: e.y, r: e.r * (0.85 + Math.random() * 0.35), color: e.color, kind: 'blood' });
  if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: e.r * 1.85, color: e.elite ? '#ffd166' : e.color, t: 0.20, maxT: 0.20 });
  const isBigBoss = e.type === 'boss' || e.type === 'special_boss';
  addBurst(e.x, e.y, e.elite ? '#ffd166' : e.color, isBigBoss ? 32 : 10, isBigBoss ? 260 : 165);

  // 狂化精英亡语：向四周迸射 6 枚慢速毒刺弹（135px/s 留足走位空隙，防无脑贴脸）
  if (e.elite) {
    const baseA = Math.random() * Math.PI * 2;
    for (let k = 0; k < 6 && eBullets.length < 170; k++) {
      const ba = baseA + (k / 6) * Math.PI * 2;
      eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 135, vy: Math.sin(ba) * 135, dmg: Math.max(3, Math.round(e.dmg * 0.72)), r: 5, color: '#ffd166', shape: 'needle' });
    }
  }

  if (enemies.length < 155) {
    if (e.type === 'splitter') {
      createEnemy(e.x - 15, e.y - 4, 'mini_slime');
      createEnemy(e.x + 15, e.y - 4, 'mini_slime');
      createEnemy(e.x, e.y + 14, 'mini_slime');
    } else if (e.type === 'spore_mother') {
      createEnemy(e.x - 14, e.y, 'mini_slime');
      createEnemy(e.x + 14, e.y, 'mini_slime');
    }
  }
  if (e.type === 'magma_imp') {
    spawnHazard(e.x, e.y, 62, e.dmg * 1.05, 1.15, { enemyDmg: (22 + wave * 4) * diff.hpMul, color: '#fb5607' });
  }

  dropCrystals(e.x, e.y, e.mat);

  // 【瘟疫炼金瓶】毒杀/灼烧亡语传染：向周围怪物扩散剧毒与烈焰！
  if (player.plagueSpread && ((e.poisonStacks || 0) > 0 || (e.burnT || 0) > 0)) {
    if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 112, color: '#a3e635', t: 0.24, maxT: 0.24 });
    for (let k = 0; k < enemies.length; k++) {
      const nb = enemies[k];
      if (!nb || nb === e || nb.hp <= 0 || nb.primed) continue;
      const dx = nb.x - e.x, dy = nb.y - e.y, lim = 112 + nb.r;
      if (dx * dx + dy * dy <= lim * lim) {
        applyPoison(nb, 2);
        nb.burnT = Math.max(nb.burnT || 0, 2.2);
        nb.burnDmg = Math.max(nb.burnDmg || 0, (5 + wave * 1.4) * getElemMul() * getEffectiveDmgMul());
        if (!nb.burnTick || nb.burnTick <= 0) nb.burnTick = 0.42;
      }
    }
  }

  // 【噬魂死神镰】击杀敌人概率降下噬魂雷击（零数组分配随机抽样）
  if (player.soulBolt && enemies.length > 0 && Math.random() < 0.18) {
    const te = pickRandomAliveEnemy(e);
    if (te) {
      const sbDmg = (18 + wave * 3.5) * getEffectiveDmgMul();
      if (lightnings.length < 35) lightnings.push({ pts: [{ x: e.x, y: e.y }, { x: te.x, y: te.y }], color: '#c77dff', t: 0.16, maxT: 0.16 });
      hurtEnemy(te, sbDmg, false, null, true, { noProc: true });
    }
  }

  // 若击败的是【隐藏二阶段·真红神话形态】首领，额外爆出必出传说装的【神话秘宝舱】与永久弑神赐福！
  if (e.mythicPhase2) {
    dropCrystals(e.x, e.y, 36);
    player.dmgMul += 0.15;
    player.critDmg = (player.critDmg || 0) + 0.25;
    drops.push({ x: e.x + 14, y: e.y, kind: 'crate', isBoss: true, isMythic: true, bob: 0 });
    addText(e.x, e.y - e.r - 36, '⚡ 弑神秘宝！全伤+15% 暴伤+25% + 传说舱!', '#ffd166', 19, 2.8);
    announce('⚡ 成功讨伐隐藏二阶段首领！获永久弑神赐福并掉落【传说秘宝舱】！', '#ffd166', 4.5);
  }

  if (e.type === 'special_boss') {
    beep(840, 0.16, 'triangle', 0.07);
    if (e.variant === 'crimson_lord') {
      player.hp = player.maxHp;
      drops.push({ x: e.x, y: e.y, kind: 'crate', isBoss: true, bob: 0 });
      addText(e.x, e.y - e.r - 22, '🩸 鲜血赐福：满血恢复 + 🎁×1！', '#ff4d6d', 18, 2.5);
      announce('🩸 击败猩红血主！已恢复满生命并掉落首领秘宝箱', '#ff758f', 3.8);
    } else if (e.variant === 'golden_golem') {
      drops.push({ x: e.x, y: e.y, kind: 'crate', isBoss: true, bob: 0 });
      addText(e.x, e.y - e.r - 22, '🪙 黄金秘宝崩裂：巨量晶石 + 🎁×1！', '#ffd166', 18, 2.5);
      announce('🪙 击败黄金巨神！爆出海量晶石与首领秘宝箱', '#ffd166', 3.8);
    } else {
      player.dmgMul += 0.12;
      drops.push({ x: e.x, y: e.y, kind: 'crate', isBoss: true, bob: 0 });
      addText(e.x, e.y - e.r - 22, '🌌 虚空赐福：全伤永久+12% + 🎁×1！', '#c77dff', 18, 2.5);
      announce('🌌 击败深渊噬界者！全体伤害永久 +12% 并掉首领秘宝箱', '#e0aaff', 3.8);
    }
    logInfo('SPECIAL_BOSS', `击杀特殊首领 ${e.bossTitle || e.variant}`);
  } else {
    const luck = Math.min(90, Math.max(0, player.luck || 0));
    let cratesOnMap = 0;
    for (let di = 0; di < drops.length; di++) if (drops[di].kind === 'crate') cratesOnMap++;
    const maxWaveCrates = 1 + (luck >= 60 ? 1 : 0);
    if ((e.type === 'boss' || e.type === 'mini_boss') && cratesOnMap < 4) {
      drops.push({ x: e.x, y: e.y, kind: 'crate', isBoss: true, bob: 0 });
      addText(e.x, e.y - e.r - 16, '🎁 首领秘宝箱!', '#ffd166', 16, 1.65, true);
    } else if (e.elite && waveCratesDropped < maxWaveCrates && cratesOnMap < 2 && Math.random() < Math.min(0.16, 0.06 + luck * 0.0014)) {
      waveCratesDropped++;
      drops.push({ x: e.x, y: e.y, kind: 'crate', bob: 0 });
      addText(e.x, e.y - e.r - 16, '🎁 战利品箱!', '#ffd166', 16, 1.65, true);
    } else if (Math.random() < Math.min(0.22, 0.032 + player.healDropBonus + luck * 0.0006)) {
      drops.push({ x: e.x, y: e.y, kind: 'heal', bob: 0 });
    }
  }

  if (e.type === 'boss' || e.type === 'special_boss') {
    const otherBoss = enemies.some(o => o !== e && (o.type === 'boss' || o.type === 'special_boss') && o.hp > 0);
    if (!otherBoss && !spawns.some(s => s.type === 'boss' || s.type === 'special_boss')) {
      if (overtime) {
        overtime = false;
        waveTime = Math.min(waveTime, 0.8);
      } else if (e.type === 'boss') {
        waveTime = Math.min(waveTime, 0.7);
      }
    }
  }
}

function triggerThornsNova() {
  if (!player || !player.thorns) return;
  const rad = 140 * getBlastScale();
  const tdmg = (14 + Math.max(0, getTotalArmor()) * 4) * player.thorns * getEffectiveDmgMul();
  if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: rad, color: '#a3e635', t: 0.22, maxT: 0.22 });
  addSparks(player.x, player.y, Math.random() * 6.28, '#a3e635', 6);
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e || e.hp <= 0 || e.primed) continue;
    const dx = e.x - player.x, dy = e.y - player.y, lim = rad + e.r;
    if (dx * dx + dy * dy <= lim * lim) {
      hurtEnemy(e, tdmg, false, Math.atan2(dy, dx), true, { noProc: true, knockMult: 1.2 });
    }
  }
}

function triggerBullNova() {
  if (!player || player.cls !== 'bull' || player.bullCd > 0) return;
  player.bullCd = 0.34;
  const novaDmg = (26 + player.maxHp * 0.65 + player.regen * 4) * getEffectiveDmgMul() * getElemMul();
  triggerExplosion(player.x, player.y, 165 * getBlastScale(), novaDmg, false, 0, '#ff9f1c');
}

// 全面加固受击结算（防重入锁 + 状态校验 + 阵亡即时熔断，彻底根治受击瞬间卡死或二次爆炸异常）
function hurtPlayer(rawDmg) {
  if (!player || state !== 'wave' || player.hp <= 0 || player.invuln > 0 || inHurtPlayer) return;
  if (!Number.isFinite(rawDmg) || rawDmg <= 0) return;
  inHurtPlayer = true;
  try {
    const invScale = 1 + Math.min(0.60, player.invulnBonus || 0);
    if (Math.random() < Math.min(player.dodgeCap || 0.80, player.dodge || 0)) {
      addText(player.x, player.y - 28, '闪避!', '#4cc9f0', 17, 0.65, false);
      player.invuln = 0.16 * invScale;
      if (player.thorns > 0) triggerThornsNova();
      if (player.cls === 'ghost') {
        triggerExplosion(player.x, player.y, 135 * getBlastScale(), (18 + player.lv * 4) * getEffectiveDmgMul() * getElemMul(), false, 0, '#72efdd', false);
      }
      return;
    }

    // 近战流派贴身抗首领保护：持 >=2 把近战武器（或拳手/蛮牛/装备破城肩甲）且首领在近身范围时，额外获得最高 36% 贴身减伤！
    let closeGuard = 0;
    const meleeCnt = getSetBonuses().meleeCnt || 0;
    if (meleeCnt >= 2 || player.cls === 'brawler' || player.cls === 'bull' || (player.meleeBossGuard || 0) > 0) {
      let bossNear = false;
      for (let bi = 0; bi < enemies.length; bi++) {
        const be = enemies[bi];
        if (be && be.hp > 0 && (be.type === 'boss' || be.type === 'special_boss' || be.type === 'mini_boss')) {
          const bdx = be.x - player.x, bdy = be.y - player.y;
          if (bdx * bdx + bdy * bdy < 165 * 165) { bossNear = true; break; }
        }
      }
      if (bossNear) {
        closeGuard = Math.min(0.36, (meleeCnt >= 2 || player.cls === 'brawler' || player.cls === 'bull' ? 0.16 : 0) + (player.meleeBossGuard || 0));
      }
    }
    let dmg = Math.max(1, Math.round(rawDmg * (1 - getArmorMitigation()) * (1 - closeGuard)));
    player.shieldRegenT = player.fastShield ? 4.5 : 7.0;

    // 能量护盾优先吸收伤害
    if (player.shield > 0) {
      const absorbed = Math.min(player.shield, dmg);
      player.shield -= absorbed;
      dmg -= absorbed;
      player.shieldHitT = 0.25;
      if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: 42, color: '#72efdd', t: 0.2, maxT: 0.2 });
      addSparks(player.x, player.y, Math.random() * 6.28, '#72efdd', 5);
      beep(540, 0.06, 'sine', 0.05);
      if (dmg <= 0) {
        player.invuln = 0.30 * invScale;
        addText(player.x, player.y - 28, `护盾 -${absorbed}`, '#72efdd', 15, 0.72, false);
        if (player.thorns > 0) triggerThornsNova();
        triggerBullNova();
        return;
      }
    }

    player.hp -= dmg;
    player.invuln = 0.42 * invScale;
    shake = 4.5;
    beep(115, 0.15, 'sawtooth', 0.08);
    addBurst(player.x, player.y, '#ff4d6d', 10, 175);
    addText(player.x, player.y - 30, '-' + dmg, '#ff4d6d', 20, 0.72, false);
    if (player.hp <= 0) {
      player.hp = 0;
      endGame(false);
      return;
    }
    if (player.thorns > 0) triggerThornsNova();
    triggerBullNova();
  } finally {
    inHurtPlayer = false;
  }
}
