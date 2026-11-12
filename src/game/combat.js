// 战斗数值结算、连锁闪电、范围爆炸、护甲闪避与战利品掉落
function addText(x, y, txt, color = '#fff', size = 16) {
  const cap = isTouch ? 45 : 75;
  if (texts.length >= cap) texts.shift();
  texts.push({
    x: x + (Math.random() - 0.5) * 16, y,
    vx: (Math.random() - 0.5) * 44, vy: -112 - Math.random() * 36,
    txt: String(txt), color, size, t: 0.62, maxT: 0.62
  });
}

function addBurst(x, y, color, n = 6, speed = 135) {
  const cnt = isTouch ? Math.max(4, Math.ceil(n * 0.78)) : n;
  const cap = isTouch ? 110 : 180;
  for (let i = 0; i < cnt; i++) {
    if (particles.length >= cap) particles.shift();
    const a = Math.random() * Math.PI * 2, s = 35 + Math.random() * speed;
    const dur = 0.26 + Math.random() * 0.18;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 2.6 + Math.random() * 3.2, color, t: dur, maxT: dur });
  }
}

// 利落明亮的方向性受击火花（白炽内芯 + 彩芒拖尾）
function addSparks(x, y, baseA, color = '#ffe8a3', n = 3) {
  const cnt = isTouch ? Math.max(2, Math.ceil(n * 0.8)) : n;
  const cap = isTouch ? 55 : 95;
  for (let i = 0; i < cnt; i++) {
    if (sparks.length >= cap) sparks.shift();
    const a = baseA + (Math.random() - 0.5) * 1.15;
    const spd = 165 + Math.random() * 210;
    sparks.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, len: 9 + Math.random() * 8, color, t: 0.19, maxT: 0.19 });
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
    hurtEnemy(target, rawDmg * falloff * (isCrit ? 1.85 : 1), isCrit, Math.atan2(target.y - curY, target.x - curX), true, { forceChill: true });
    curX = target.x; curY = target.y;

    let next = null, bestD = 195;
    for (const e of enemies) {
      if (e.hp > 0 && !e.primed && !visited.has(e)) {
        const d = Math.hypot(e.x - curX, e.y - curY);
        if (d < bestD) { bestD = d; next = e; }
      }
    }
    target = next;
  }
}

// 冲击波/爆炸逻辑（含炽热内爆火球、扩散冲击环、地面焦痕与飞溅火花，带递归深度熔断保护）
let blastDepth = 0;
function triggerExplosion(x, y, radius, enemyDmg, hurtPlayerToo = false, playerDmg = 0, ringColor = '#ff595e', leaveScorch = true) {
  if (blastDepth > 3) return;
  blastDepth++;
  try {
    radius = Math.max(8, radius || 40);
    if (rings.length < 40) rings.push({ x, y, r: radius, color: ringColor, t: 0.30, maxT: 0.30, fill: true });
    if (leaveScorch) {
      if (stains.length > (isTouch ? 55 : 100)) stains.shift();
      stains.push({ x, y, r: radius * 0.42, color: '#14101c', kind: 'scorch' });
    }
    shake = Math.max(shake, 7);
    beep(135, 0.13, 'sawtooth', 0.06);
    addBurst(x, y, ringColor, 14, 210);
    addSparks(x, y, Math.random() * 6.28, '#ffd166', 8);
    if (enemyDmg > 0) {
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e && e.hp > 0 && !e.primed && Math.hypot(e.x - x, e.y - y) <= radius + e.r) {
          hurtEnemy(e, enemyDmg, false, Math.atan2(e.y - y, e.x - x), true, { noProc: true, knockMult: 1.4 });
        }
      }
      for (let i = trees.length - 1; i >= 0; i--) {
        const tr = trees[i];
        if (tr && tr.hp > 0 && Math.hypot(tr.x - x, tr.y - y) <= radius + tr.r) {
          hurtTree(tr, enemyDmg * 0.6);
        }
      }
    }
    if (hurtPlayerToo && player && state === 'wave' && Math.hypot(player.x - x, player.y - y) <= radius + player.r - 6) {
      hurtPlayer(playerDmg);
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
  return Math.max(0.25, player.dmgMul - penalty + rangeConvert);
}
function getEffectiveAtkSpd() {
  if (!player) return 1;
  const missingBonus = player.cls === 'vampire' ? (1 - Math.max(0, player.hp) / Math.max(1, player.maxHp)) * 0.9 : 0;
  const sporeBonus = player.inSpore ? 0.14 : 0;
  return Math.max(0.3, player.atkSpd + getSetBonuses().aspd + missingBonus + sporeBonus);
}
function getEffectiveCrit() { return (player ? player.crit : 0) + getSetBonuses().crit; }
function getElemMul() { return 1 + (player ? player.elemBonus : 0) + getSetBonuses().elem; }
function getBlastScale() { return (player ? player.explosionScale : 1) + getSetBonuses().blast; }

function primeBomber(e) {
  if (!e || e.primed) return;
  e.primed = true;
  e.hp = 1;
  e.fuseT = 1.25;
  e.maxFuseT = 1.25;
  beep(520, 0.06, 'sawtooth', 0.032);
  addText(e.x, e.y - e.r - 10, '⚠️ 自爆预警!', '#ffbe0b', 14);
}

function hurtEnemy(e, rawDmg, isCrit, knockA = null, ignoreShield = false, opts = {}) {
  if (!e || e.hp <= 0 || e.primed) return;

  // 铁甲圣甲虫正面举盾减伤 45% + 金属格挡火星
  if (e.type === 'shielder' && !ignoreShield && knockA !== null && Math.cos(knockA - e.faceA) < -0.25) {
    rawDmg *= 0.55;
    beep(880, 0.025, 'triangle', 0.025);
    addSparks(e.x + Math.cos(e.faceA) * e.r, e.y + Math.sin(e.faceA) * e.r, e.faceA, '#90e0ef', 4);
    addText(e.x, e.y - e.r - 12, '格挡', '#90e0ef', 12);
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
    while (e.goldStage > 0 && Math.max(0, e.hp) / e.maxHp <= e.goldStage * 0.2) {
      e.goldStage--;
      dropCrystals(e.x, e.y, 6);
      addText(e.x, e.y - e.r - 14, '💎 黄金碎晶 +6!', '#ffd166', 15);
    }
  }

  if (opts.isDot) {
    addText(e.x, e.y - e.r - 2, dmg, '#ff9f1c', 12);
  } else {
    addSparks(e.x, e.y, knockA !== null ? knockA + Math.PI : Math.random() * 6.28, isCrit ? '#ffd166' : '#fff3b0', isCrit ? 4 : 2);
    addText(e.x, e.y - e.r - 4, isCrit ? dmg + '!' : dmg, isCrit ? '#ffd166' : '#ffffff', isCrit ? 21 : 15);
    beep(isCrit ? 360 : 240, 0.028, 'sawtooth', 0.025);

    // 攻击附带灼烧 / 冰缓 / 高爆弹头判定
    if (opts.forceBurn || (player.burnChance > 0 && Math.random() < player.burnChance)) {
      e.burnT = 3.0;
      e.burnDmg = Math.max(2, (3.5 + wave * 1.1) * getElemMul() * getEffectiveDmgMul());
    }
    if (opts.forceChill || (player.chillChance > 0 && Math.random() < player.chillChance)) {
      e.chillT = Math.max(e.chillT || 0, 2.1);
    }
    if (!opts.noProc && player.blastChance > 0 && Math.random() < player.blastChance) {
      triggerExplosion(e.x, e.y, 68 * getBlastScale(), dmg * 0.55 * getElemMul(), false, 0, '#ff9f1c', true);
    }

    // 生命窃取与【暴击触手】暴击回血判定
    if (player.lifesteal > 0 && player.hp > 0 && player.hp < player.maxHp && Math.random() < player.lifesteal) {
      player.hp = Math.min(player.maxHp, player.hp + 1);
      addText(player.x, player.y - 24, '+1 🩸', '#ff4d6d', 13);
    } else if (isCrit && player.critHeal > 0 && player.hp > 0 && player.hp < player.maxHp && Math.random() < player.critHeal) {
      player.hp = Math.min(player.maxHp, player.hp + 1);
      addText(player.x, player.y - 24, '+1 🦑', '#5ef29b', 13);
    }
  }

  if (e.hp <= 0) {
    if (e.type === 'bomber' && !e.primed) {
      primeBomber(e);
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
  const maxStains = isTouch ? 50 : 95;
  if (stains.length >= maxStains) stains.shift();
  stains.push({ x: e.x, y: e.y, r: e.r * (0.85 + Math.random() * 0.35), color: e.color, kind: 'blood' });
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

  if (e.type === 'splitter') {
    createEnemy(e.x - 15, e.y - 4, 'mini_slime');
    createEnemy(e.x + 15, e.y - 4, 'mini_slime');
    createEnemy(e.x, e.y + 14, 'mini_slime');
  } else if (e.type === 'spore_mother') {
    createEnemy(e.x - 14, e.y, 'mini_slime');
    createEnemy(e.x + 14, e.y, 'mini_slime');
  }
  if (e.type === 'magma_imp') {
    spawnHazard(e.x, e.y, 62, e.dmg * 1.05, 1.15, { enemyDmg: (22 + wave * 4) * diff.hpMul, color: '#fb5607' });
  }

  dropCrystals(e.x, e.y, e.mat);

  if (e.type === 'special_boss') {
    beep(840, 0.16, 'triangle', 0.07);
    if (e.variant === 'crimson_lord') {
      player.hp = player.maxHp;
      drops.push({ x: e.x, y: e.y, kind: 'crate', bob: 0 });
      addText(e.x, e.y - e.r - 22, '🩸 鲜血赐福：满血恢复 + 🎁×1！', '#ff4d6d', 18);
    } else if (e.variant === 'golden_golem') {
      drops.push({ x: e.x, y: e.y, kind: 'crate', bob: 0 });
      addText(e.x, e.y - e.r - 22, '🪙 黄金秘宝崩裂：巨量晶石 + 🎁×1！', '#ffd166', 18);
    } else {
      player.dmgMul += 0.12;
      drops.push({ x: e.x, y: e.y, kind: 'crate', bob: 0 });
      addText(e.x, e.y - e.r - 22, '🌌 虚空赐福：全伤永久+12% + 🎁×1！', '#c77dff', 18);
    }
    logInfo('SPECIAL_BOSS', `击杀特殊首领 ${e.bossTitle || e.variant}`);
  } else {
    const luck = player.luck || 0;
    const cratesOnMap = drops.filter(d => d.kind === 'crate').length;
    const maxWaveCrates = 1 + (luck >= 45 ? 1 : 0);
    if ((e.type === 'boss' || e.type === 'mini_boss') && cratesOnMap < 5) {
      drops.push({ x: e.x, y: e.y, kind: 'crate', bob: 0 });
      addText(e.x, e.y - e.r - 16, '🎁 战利品箱!', '#ffd166', 16);
    } else if (e.elite && waveCratesDropped < maxWaveCrates && cratesOnMap < 3 && Math.random() < Math.min(0.22, 0.08 + luck * 0.0022)) {
      waveCratesDropped++;
      drops.push({ x: e.x, y: e.y, kind: 'crate', bob: 0 });
      addText(e.x, e.y - e.r - 16, '🎁 战利品箱!', '#ffd166', 16);
    } else if (Math.random() < Math.min(0.22, 0.032 + player.healDropBonus + luck * 0.0006)) {
      drops.push({ x: e.x, y: e.y, kind: 'heal', bob: 0 });
    }
  }

  if (e.type === 'boss' || e.type === 'special_boss') {
    shake = 16;
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
    if (e && e.hp > 0 && !e.primed && Math.hypot(e.x - player.x, e.y - player.y) <= rad + e.r) {
      hurtEnemy(e, tdmg, false, Math.atan2(e.y - player.y, e.x - player.x), true, { noProc: true, knockMult: 1.2 });
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
    if (Math.random() < Math.min(0.80, player.dodge || 0)) {
      addText(player.x, player.y - 28, '闪避!', '#4cc9f0', 18);
      player.invuln = 0.16;
      if (player.thorns > 0) triggerThornsNova();
      if (player.cls === 'ghost') {
        triggerExplosion(player.x, player.y, 135 * getBlastScale(), (18 + player.lv * 4) * getEffectiveDmgMul() * getElemMul(), false, 0, '#72efdd', false);
      }
      return;
    }

    let dmg = Math.max(1, Math.round(rawDmg * (1 - getArmorMitigation())));
    player.shieldRegenT = 7.0;

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
        player.invuln = 0.30;
        addText(player.x, player.y - 28, `护盾 -${absorbed}`, '#72efdd', 16);
        if (player.thorns > 0) triggerThornsNova();
        triggerBullNova();
        return;
      }
    }

    player.hp -= dmg;
    player.invuln = 0.42;
    shake = 10;
    beep(115, 0.15, 'sawtooth', 0.08);
    addBurst(player.x, player.y, '#ff4d6d', 10, 175);
    addText(player.x, player.y - 30, '-' + dmg, '#ff4d6d', 20);
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
