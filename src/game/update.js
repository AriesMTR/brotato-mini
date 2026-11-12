// 60FPS 核心战术状态机主更新循环（移动、武器开火、投射物、怪物与首领 AI）
function update(dt) {
  if (state !== 'wave' || !player) return;
  if (shake > 0) shake = Math.max(0, shake - dt * 32);
  if (player.bullCd > 0) player.bullCd -= dt;
  if (player.shieldHitT > 0) player.shieldHitT -= dt;
  if (player.chillSlowT > 0) player.chillSlowT = Math.max(0, player.chillSlowT - dt);
  if (sandGustT > 0) sandGustT = Math.max(0, sandGustT - dt);

  // 异星晶树随战斗定时生长（拉长生长间隔，配合单波宝箱上限防泛滥）
  if (!overtime && waveTime > 3 && trees.length < 4) {
    treeSpawnT -= dt;
    if (treeSpawnT <= 0) {
      treeSpawnT = Math.max(8.0, 14.5 - (player.bonusTrees || 0) * 2.2);
      spawnTree();
    }
  }
  for (let i = trees.length - 1; i >= 0; i--) {
    const tr = trees[i];
    if (tr.hp <= 0) { trees.splice(i, 1); continue; }
    if (tr.hitFlash > 0) tr.hitFlash -= dt;
    tr.sway += dt * 2.4;
  }

  // 稀有地图奇遇圣物刷出与读条共鸣召唤特殊 Boss
  if (!overtime && relicSpawnT > 0 && waveTime > 6) {
    relicSpawnT -= dt;
    if (relicSpawnT <= 0) {
      relicSpawnT = -1;
      spawnSpecialRelic();
    }
  }
  for (let i = relics.length - 1; i >= 0; i--) {
    const rel = relics[i];
    rel.pulse += dt * 3.2;
    const dRel = Math.hypot(player.x - rel.x, player.y - rel.y);
    if (dRel <= rel.r + player.r) {
      rel.charge += dt;
      if (rel.charge >= rel.need) {
        relics.splice(i, 1);
        summonSpecialBoss(rel);
        continue;
      }
    } else if (rel.charge > 0) {
      rel.charge = Math.max(0, rel.charge - dt * 0.65);
    }
  }

  // 场景专属环境异象（第 3 波起概率出现，随轮次逐步解锁）与菌林治愈灵泉更新
  player.inSpore = false;
  for (let i = sporeZones.length - 1; i >= 0; i--) {
    const sz = sporeZones[i];
    sz.t -= dt;
    sz.pulse = (sz.pulse || 0) + dt * 2.5;
    if (sz.t <= 0) { sporeZones.splice(i, 1); continue; }
    if (Math.hypot(player.x - sz.x, player.y - sz.y) <= sz.r + player.r) {
      player.inSpore = true;
      sz.healAcc = (sz.healAcc || 0) + dt * 2.0;
      if (sz.healAcc >= 1) {
        const h = Math.floor(sz.healAcc);
        sz.healAcc -= h;
        if (player.hp > 0 && player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + h);
          addText(player.x, player.y - 26, `+${h} 🍄`, '#5ef29b', 13);
        }
      }
    }
  }
  if (activeSceneEvent && !overtime && waveTime > 2.5) {
    sceneEventT -= dt;
    if (sceneEventT <= 0) {
      if (activeSceneEvent === 'rad_meteor') {
        sceneEventT = 7.2;
        const mx = Math.max(110, Math.min(WORLD.w - 110, player.x + (Math.random() - 0.5) * 340));
        const my = Math.max(110, Math.min(WORLD.h - 110, player.y + (Math.random() - 0.5) * 340));
        spawnHazard(mx, my, 82, (8 + wave * 1.1) * diff.dmgMul, 1.35, { enemyDmg: (38 + wave * 7) * diff.hpMul, dropMat: 4, color: '#80ff72' });
        addText(mx, my - 30, '☄️ 晶簇陨落!', '#80ff72', 14);
      } else if (activeSceneEvent === 'sandstorm') {
        sceneEventT = 8.0;
        sandGustT = 3.2;
        addText(player.x, player.y - 42, '🌪️ 狂沙顺风：移速+14% · 敌弹减速!', '#f4a261', 15);
        if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: 95, color: '#f4a261', t: 0.35, maxT: 0.35 });
      } else if (activeSceneEvent === 'blizzard') {
        sceneEventT = 8.2;
        for (const e of enemies) {
          if (e && e.hp > 0) e.chillT = Math.max(e.chillT || 0, 2.5);
        }
        if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: 260, color: '#72efdd', t: 0.4, maxT: 0.4 });
        addText(player.x, player.y - 42, '❄️ 极寒霜潮：全场异虫冻结减速!', '#72efdd', 15);
      } else if (activeSceneEvent === 'geysers') {
        sceneEventT = 6.8;
        for (let g = 0; g < 2; g++) {
          const gx = Math.max(110, Math.min(WORLD.w - 110, player.x + (Math.random() - 0.5) * 380));
          const gy = Math.max(110, Math.min(WORLD.h - 110, player.y + (Math.random() - 0.5) * 380));
          spawnHazard(gx, gy, 74, (9 + wave * 1.2) * diff.dmgMul, 1.30, { enemyDmg: (45 + wave * 8) * diff.hpMul, color: '#ff6b35' });
        }
      } else if (activeSceneEvent === 'spore_tide') {
        sceneEventT = 8.5;
        if (sporeZones.length < 2) {
          const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 140;
          const sx = Math.max(110, Math.min(WORLD.w - 110, player.x + Math.cos(ang) * dist));
          const sy = Math.max(110, Math.min(WORLD.h - 110, player.y + Math.sin(ang) * dist));
          sporeZones.push({ x: sx, y: sy, r: 86, t: 6.5, maxT: 6.5, pulse: 0, healAcc: 0 });
          if (rings.length < 40) rings.push({ x: sx, y: sy, r: 92, color: '#5ef29b', t: 0.35, maxT: 0.35 });
          addText(sx, sy - 24, '🍄 治愈灵泉生成!', '#5ef29b', 15);
        }
      }
    }
  }

  waveTime -= dt;
  if (!overtime && waveTime > 0 && waveTime <= 5) {
    const sec = Math.ceil(waveTime);
    if (sec !== lastUrgentSec) {
      lastUrgentSec = sec;
      beep(860, 0.035, 'sine', 0.028);
    }
  }
  if (waveTime <= 0) {
    const bossAlive = enemies.some(e => (e.type === 'boss' || e.type === 'special_boss') && e.hp > 0) || spawns.some(s => s.type === 'boss' || s.type === 'special_boss');
    if (bossAlive) {
      waveTime = 0;
      if (!overtime) {
        overtime = true;
        beep(210, 0.25, 'sawtooth', 0.08);
        addText(player.x, player.y - 54, '💀 超时死斗！首领全面狂暴！', '#ff3b6b', 22);
      }
      overtimeMeteorT -= dt;
      if (overtimeMeteorT <= 0) {
        overtimeMeteorT = 1.75;
        spawnHazard(player.x + (Math.random() - 0.5) * 150, player.y + (Math.random() - 0.5) * 150, 78, 12 * diff.dmgMul, 1.12);
      }
    } else {
      finishWave();
      return;
    }
  }

  // 能量护盾自动回充（7秒未受击恢复 50% 护盾）
  if (player.maxShield > 0 && player.shield < player.maxShield) {
    player.shieldRegenT -= dt;
    if (player.shieldRegenT <= 0) {
      player.shield = Math.min(player.maxShield, player.shield + Math.ceil(player.maxShield * 0.5));
      player.shieldRegenT = 5.0;
      rings.push({ x: player.x, y: player.y, r: 34, color: '#4cc9f0', t: 0.22, maxT: 0.22 });
      addText(player.x, player.y - 28, '+护盾', '#72efdd', 13);
    }
  }

  // 特斯拉线圈自动电弧攻击（享受攻击范围加成）
  const totalRange = getTotalRangeBonus();
  if (player.teslaCount > 0 && enemies.length > 0) {
    player.teslaCd -= dt;
    if (player.teslaCd <= 0) {
      player.teslaCd = Math.max(0.45, 1.7 / (1 + (player.teslaCount - 1) * 0.55));
      let near = null, nearD = Math.max(150, 300 + Math.round(totalRange * 0.5));
      for (const e of enemies) {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (e.hp > 0 && !e.primed && d < nearD) { nearD = d; near = e; }
      }
      if (near) {
        beep(680, 0.045, 'sine', 0.03);
        const tdmg = (12 + wave * 2.2) * getEffectiveDmgMul() * getElemMul();
        castChainLightning(player.x, player.y - 12, near, 2 + player.teslaCount, tdmg, getEffectiveCrit());
      }
    }
  }

  // 多样化异星虫潮按波次与难度递进刷出（随波数与难度显著增加怪物密度与物种丰富度）
  spawnAcc -= dt;
  const hordeBoost = hordeWave ? 1.20 : 1;
  const maxActiveEnemies = isTouch ? Math.min(92, 52 + wave * 4) : Math.min(120, 68 + wave * 5);
  if (!overtime && spawnAcc <= 0 && waveTime > 1.5 && enemies.length < maxActiveEnemies) {
    const count = Math.max(2, Math.round((1.75 + wave * 0.52 + Math.pow(Math.max(0, wave - 3), 1.25) * 0.18) * diff.spawnMul * hordeBoost));
    const early = selectedDiff >= 3 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 250 + Math.random() * 340;
      const x = Math.max(60, Math.min(WORLD.w - 60, player.x + Math.cos(ang) * dist));
      const y = Math.max(60, Math.min(WORLD.h - 60, player.y + Math.sin(ang) * dist));
      const wv = wave + early;
      let type = 'chaser', r = Math.random();
      if (sceneMobEnabled && curScene.exclMob && Math.random() < 0.18) {
        type = curScene.exclMob;
      } else if (wv >= 6 && r < 0.05) type = 'juggernaut';
      else if (wv >= 6 && r < 0.11) type = 'healer';
      else if (wv >= 5 && r < 0.17) type = 'summoner';
      else if (wv >= 5 && r < 0.25) type = 'brute';
      else if (wv >= 4 && r < 0.32) type = 'mortar';
      else if (wv >= 4 && r < 0.40) type = 'shielder';
      else if (wv >= 4 && r < 0.48) type = 'spinner';
      else if (wv >= 4 && r < 0.56) type = 'splitter';
      else if (wv >= 3 && r < 0.63) type = 'sniper_bug';
      else if (wv >= 3 && r < 0.70) type = 'bomber';
      else if (wv >= 3 && r < 0.78) type = 'charger';
      else if (wv >= 2 && r < 0.85) type = 'shooter';
      else if (wv >= 2 && r < 0.91) type = 'stalker';
      else if ((wv >= 2 && r < 0.97) || (wave === 1 && waveTime < 11 && r < 0.28)) type = 'swarmer';
      spawnWarning(x, y, type);
    }
    spawnAcc = Math.max(0.44, (1.42 - wave * 0.065) / Math.pow(diff.spawnMul * hordeBoost, 0.55));
  }

  // 地面红圈/元素预警轰炸倒计时引爆
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.t -= dt;
    if (h.t <= 0) {
      triggerExplosion(h.x, h.y, h.r, h.enemyDmg || 0, true, h.dmg, h.color || '#ff3b6b', true);
      if (h.dropMat > 0) dropCrystals(h.x, h.y, h.dropMat);
      hazards.splice(i, 1);
      if (state !== 'wave') return;
    }
  }

  for (let i = spawns.length - 1; i >= 0; i--) {
    spawns[i].t -= dt;
    if (spawns[i].t <= 0) {
      createEnemy(spawns[i].x, spawns[i].y, spawns[i].type, spawns[i].variant);
      spawns.splice(i, 1);
    }
  }

  // 玩家移动（兼容电脑 WASD/方向键 & 手机丝滑模拟量触屏摇杆）与镜头平滑跟随
  let kdx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  let kdy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
  let dx = kdx, dy = kdy, moveScale = 1;
  if (!dx && !dy && joy.active && joy.mag > 0) {
    dx = joy.dx; dy = joy.dy; moveScale = joy.mag;
  }
  player.moving = !!(dx || dy);
  if (player.moving) {
    if (Math.abs(dx) > 0.08) player.faceDir = dx > 0 ? 1 : -1;
    const len = Math.hypot(dx, dy) || 1;
    const envSpdMul = (sandGustT > 0 ? 1.14 : 1) * (player.chillSlowT > 0 ? 0.82 : 1);
    const v = player.spd * Math.max(0.5, player.spdMul) * envSpdMul * moveScale;
    player.x = Math.max(player.r + 8, Math.min(WORLD.w - player.r - 8, player.x + (dx / len) * v * dt));
    player.y = Math.max(player.r + 8, Math.min(WORLD.h - player.r - 8, player.y + (dy / len) * v * dt));
    player.walkT += dt * 13 * moveScale;
    player.dustT -= dt;
    if (player.dustT <= 0) {
      player.dustT = 0.1;
      particles.push({ x: player.x + (Math.random() - 0.5) * 12, y: player.y + 18, vx: -(dx / len) * 25, vy: -10 - Math.random() * 14, r: 3.5 + Math.random() * 2.5, color: 'rgba(190,180,205,0.38)', t: 0.25, maxT: 0.25 });
    }
  }
  const targetCamX = player.x + (dx ? (dx / (Math.hypot(dx, dy) || 1)) * 34 : 0);
  const targetCamY = player.y + (dy ? (dy / (Math.hypot(dx, dy) || 1)) * 28 : 0);
  cam.x += (targetCamX - cam.x) * Math.min(1, dt * 8.5);
  cam.y += (targetCamY - cam.y) * Math.min(1, dt * 8.5);
  clampCam();

  if (player.invuln > 0) player.invuln -= dt;
  if (player.regen > 0 && player.hp > 0 && player.hp < player.maxHp) {
    player.regenAcc += player.regen * dt;
    if (player.regenAcc >= 1) {
      const heal = Math.floor(player.regenAcc);
      player.regenAcc -= heal;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      addText(player.x, player.y - 26, '+' + heal, '#6ede8a', 14);
    }
  }

  let nearestE = null, nearestD = 9999;
  for (const e of enemies) {
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < nearestD) { nearestD = d; nearestE = e; }
  }
  if (nearestE) player.lookA = Math.atan2(nearestE.y - player.y, nearestE.x - player.x);

  // 22 把武器自动索敌、攻击范围加成与差异化攻击表现
  const setB = getSetBonuses();
  const stickCount = player.weapons.filter(w => w.id === 'stick').length;
  const effDmg = getEffectiveDmgMul(), effAspd = getEffectiveAtkSpd(), baseCrit = getEffectiveCrit(), elemMul = getElemMul();
  const nW = player.weapons.length;
  let maxEquipRange = player.cls === 'bull' ? Math.round(165 * getBlastScale()) : 0;

  player.weapons.forEach((w, idx) => {
    const tpl = WEAPONS[w.id];
    if (!tpl) return;
    const orbitR = nW > 6 ? 44 : 38;
    const orbitA = (idx / Math.max(1, nW)) * Math.PI * 2 + performance.now() * 0.0009;
    const baseWx = player.x + Math.cos(orbitA) * orbitR;
    const baseWy = player.y + Math.sin(orbitA) * (orbitR * 0.9);
    const rangeAdd = tpl.melee ? Math.round(totalRange * 0.55) : totalRange;
    const maxR = Math.max(68, tpl.range + rangeAdd + (w.tier - 1) * 16);
    if (maxR > maxEquipRange) maxEquipRange = maxR;

    let best = null, bestD = maxR, bestIsTree = false;
    for (const e of enemies) {
      if (e.hp <= 0 || e.primed) continue;
      const d = Math.hypot(e.x - baseWx, e.y - baseWy) - e.r;
      if (d < bestD) { bestD = d; best = e; bestIsTree = false; }
    }
    // 射程内无怪物时，武器也会智能索敌砍伐附近的异星晶树！
    if (!best && trees.length > 0) {
      for (const tr of trees) {
        if (tr.hp <= 0) continue;
        const d = Math.hypot(tr.x - baseWx, tr.y - baseWy) - tr.r;
        if (d < bestD) { bestD = d; best = tr; bestIsTree = true; }
      }
    }
    if (best) w.angle = Math.atan2(best.y - baseWy, best.x - baseWx);
    else w.angle = player.faceDir > 0 ? 0 : Math.PI;

    w.cd -= dt;
    if (w.thrust > 0) w.thrust = Math.max(0, w.thrust - dt * (w.id === 'spear' ? 4.8 : 5.8));
    if (w.recoil > 0) w.recoil = Math.max(0, w.recoil - dt * 8);

    if (best && w.cd <= 0) {
      const tierScale = 1 + (w.tier - 1) * 0.55;
      const aspdBonusDmg = tpl.aspdScale ? Math.max(0, effAspd - 1) * 9 : 0;
      const rangeBonusDmg = tpl.rangeScale ? Math.max(0, totalRange) * tpl.rangeScale : 0;
      const base = (tpl.dmg + aspdBonusDmg + rangeBonusDmg) * tierScale + (w.id === 'stick' ? Math.max(0, stickCount - 1) * 3 : 0);
      const elemScale = tpl.set === 'elemental' ? elemMul : 1;
      const finalMul = (effDmg + (tpl.melee ? player.meleeBonus : 0)) * elemScale;
      const critChance = baseCrit + (tpl.critBonus || 0) + (w.tier - 1) * 0.03;
      const critMult = tpl.critMult || 1.85;
      w.cd = tpl.cd / Math.max(0.3, effAspd * (1 + (w.tier - 1) * 0.08));

      if (tpl.melee) {
        w.thrust = 1;
        beep(w.id === 'hammer' || w.id === 'rock' ? 130 : (w.id === 'katana' ? 330 : (w.id === 'knife' || w.id === 'claws' ? 295 : 195)), 0.055, 'triangle', 0.045);
        const sColor = TIER_COLORS[w.tier] === '#e2deec' ? tpl.arcColor : TIER_COLORS[w.tier];

        if (tpl.mode === 'spear') {
          // 长矛：超长直线穿刺轨迹
          const ex = baseWx + Math.cos(w.angle) * maxR, ey = baseWy + Math.sin(w.angle) * maxR;
          if (slashes.length < 36) slashes.push({ x: baseWx, y: baseWy, angle: w.angle, r: maxR, color: sColor, mode: 'spear', t: 0.16, maxT: 0.16 });
          const l2 = maxR * maxR;
          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.hp <= 0) continue;
            const proj = Math.max(0, Math.min(1, ((e.x - baseWx) * (ex - baseWx) + (e.y - baseWy) * (ey - baseWy)) / l2));
            const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
            if (Math.hypot(e.x - px, e.y - py) <= e.r + 16) {
              const isCrit = Math.random() < critChance;
              hurtEnemy(e, base * finalMul * (isCrit ? critMult : 1), isCrit, w.angle);
            }
          }
          for (let i = trees.length - 1; i >= 0; i--) {
            const tr = trees[i];
            if (tr.hp <= 0) continue;
            const proj = Math.max(0, Math.min(1, ((tr.x - baseWx) * (ex - baseWx) + (tr.y - baseWy) * (ey - baseWy)) / l2));
            const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
            if (Math.hypot(tr.x - px, tr.y - py) <= tr.r + 16) hurtTree(tr, base * finalMul);
          }
        } else {
          // 刀剑横扫 / 利爪撕裂 / 居合太刀 / 巨石钝击 / 裂地战锤
          const arcSpan = tpl.mode === 'crescent' ? 1.06 : 0.78;
          if (slashes.length < 36) {
            slashes.push({
              x: baseWx + Math.cos(w.angle) * 24, y: baseWy + Math.sin(w.angle) * 24,
              angle: w.angle, r: maxR * (tpl.mode === 'crescent' ? 0.84 : 0.72), color: sColor,
              mode: tpl.mode || 'arc', t: 0.16, maxT: 0.16
            });
          }
          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.hp <= 0) continue;
            const d = Math.hypot(e.x - baseWx, e.y - baseWy);
            const da = Math.abs(Math.atan2(Math.sin(Math.atan2(e.y - baseWy, e.x - baseWx) - w.angle), Math.cos(Math.atan2(e.y - baseWy, e.x - baseWx) - w.angle)));
            if (d <= maxR + e.r && da < arcSpan) {
              const isCrit = Math.random() < critChance;
              hurtEnemy(e, base * finalMul * (isCrit ? critMult : 1), isCrit, w.angle, false, { knockMult: tpl.knockMult || 1 });
            }
          }
          for (let i = trees.length - 1; i >= 0; i--) {
            const tr = trees[i];
            if (tr.hp <= 0) continue;
            const d = Math.hypot(tr.x - baseWx, tr.y - baseWy);
            const da = Math.abs(Math.atan2(Math.sin(Math.atan2(tr.y - baseWy, tr.x - baseWx) - w.angle), Math.cos(Math.atan2(tr.y - baseWy, tr.x - baseWx) - w.angle)));
            if (d <= maxR + tr.r && da < arcSpan) hurtTree(tr, base * finalMul);
          }
          if (tpl.slam) {
            const hx = baseWx + Math.cos(w.angle) * (maxR * 0.68), hy = baseWy + Math.sin(w.angle) * (maxR * 0.68);
            const sr = 62 * getBlastScale();
            if (rings.length < 40) rings.push({ x: hx, y: hy, r: sr, color: '#f4a261', t: 0.22, maxT: 0.22 });
            if (stains.length > 100) stains.shift();
            stains.push({ x: hx, y: hy, r: 22, color: '#14101c', kind: 'scorch' });
            shake = Math.max(shake, 4.5);
            for (let i = enemies.length - 1; i >= 0; i--) {
              const e = enemies[i];
              if (e.hp > 0 && Math.hypot(e.x - hx, e.y - hy) <= sr + e.r) {
                hurtEnemy(e, base * finalMul * 0.45, false, Math.atan2(e.y - hy, e.x - hx), true, { knockMult: 1.5, noProc: true });
              }
            }
          }
        }
      } else if (tpl.isChain) {
        // 电击枪：跳跃连锁闪电
        w.recoil = 1;
        beep(640, 0.055, 'sawtooth', 0.036);
        const mx = baseWx + Math.cos(w.angle) * 16, my = baseWy + Math.sin(w.angle) * 16;
        if (bestIsTree) {
          lightnings.push({ pts: [{ x: mx, y: my }, { x: best.x, y: best.y }], color: '#72efdd', t: 0.14, maxT: 0.14 });
          hurtTree(best, base * finalMul);
        } else {
          castChainLightning(mx, my, best, tpl.chains + (w.tier >= 3 ? 1 : 0), base * finalMul, critChance);
        }
      } else if (tpl.isBeam || tpl.isSniper) {
        // 激光枪 / 狙击枪瞬发贯穿射线
        w.recoil = 1;
        beep(tpl.isSniper ? 205 : 720, 0.075, 'sawtooth', tpl.isSniper ? 0.055 : 0.038);
        const ex = baseWx + Math.cos(w.angle) * maxR, ey = baseWy + Math.sin(w.angle) * maxR;
        if (beams.length < 30) {
          beams.push({
            x1: baseWx + Math.cos(w.angle) * 18, y1: baseWy + Math.sin(w.angle) * 18, x2: ex, y2: ey,
            color: tpl.isSniper ? '#ffe8a3' : TIER_COLORS[Math.max(2, w.tier)],
            thin: !!tpl.isSniper, t: tpl.isSniper ? 0.19 : 0.15, maxT: tpl.isSniper ? 0.19 : 0.15
          });
        }
        if (tpl.isSniper && shells.length < 60) {
          const sa = w.angle - Math.PI * 0.5;
          shells.push({ x: baseWx, y: baseWy, vx: Math.cos(sa) * 110, vy: Math.sin(sa) * 110 - 35, rot: 0, t: 0.5 });
        }
        const l2 = maxR * maxR;
        const cands = [];
        for (const e of enemies) {
          if (e.hp <= 0 || e.primed) continue;
          const proj = Math.max(0, Math.min(1, ((e.x - baseWx) * (ex - baseWx) + (e.y - baseWy) * (ey - baseWy)) / l2));
          const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
          if (Math.hypot(e.x - px, e.y - py) <= e.r + 9) cands.push({ e, proj });
        }
        cands.sort((a, b) => a.proj - b.proj);
        const maxHits = (tpl.pierce || 3) + player.pierceBonus;
        for (let k = 0; k < Math.min(maxHits, cands.length); k++) {
          const isCrit = Math.random() < critChance;
          hurtEnemy(cands[k].e, base * finalMul * (isCrit ? critMult : 1), isCrit, w.angle, !tpl.isSniper, { knockMult: tpl.isSniper ? 1.8 : 1 });
        }
        for (let i = trees.length - 1; i >= 0; i--) {
          const tr = trees[i];
          if (tr.hp <= 0) continue;
          const proj = Math.max(0, Math.min(1, ((tr.x - baseWx) * (ex - baseWx) + (tr.y - baseWy) * (ey - baseWy)) / l2));
          const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
          if (Math.hypot(tr.x - px, tr.y - py) <= tr.r + 9) hurtTree(tr, base * finalMul);
        }
      } else {
        // 投射物武器（弹弓、十字弩、手枪、冲锋枪、霰弹枪、加特林、寒冰锥、手里剑、喷火器、电浆炮、火箭筒）
        w.recoil = tpl.isFlame ? 0.3 : (w.id === 'minigun' ? 0.55 : 1);
        const pellets = tpl.pellets || 1;
        if ((!tpl.isFlame && w.id !== 'minigun') || Math.random() < 0.35) {
          beep(tpl.isRocket ? 145 : (tpl.isPlasma ? 310 : (tpl.isFlame ? 110 : (tpl.isStar || tpl.isIce ? 560 : (w.id === 'shotgun' ? 160 : 430)))), 0.04, tpl.isFlame ? 'sawtooth' : 'square', tpl.isFlame ? 0.018 : 0.03);
        }
        const mx = baseWx + Math.cos(w.angle) * 18, my = baseWy + Math.sin(w.angle) * 18;
        if (!tpl.isStar && !tpl.isFlame && !tpl.isPebble && !tpl.isIce) {
          particles.push({ x: mx, y: my, vx: 0, vy: 0, r: w.id === 'shotgun' || tpl.isRocket || tpl.isPlasma ? 12 : 8.5, color: tpl.isPlasma ? '#c77dff' : '#ffd166', t: 0.085, maxT: 0.085, muzzle: true, angle: w.angle });
        }
        if ((tpl.set === 'gun' || w.id === 'minigun') && shells.length < 60 && (w.id !== 'minigun' || Math.random() < 0.45)) {
          const sa = w.angle - Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
          shells.push({ x: baseWx, y: baseWy, vx: Math.cos(sa) * 95, vy: Math.sin(sa) * 95 - 30, rot: Math.random() * 6, t: 0.45 });
        }
        for (let p = 0; p < pellets; p++) {
          if (bullets.length >= (isTouch ? 180 : 260)) break;
          const sp = tpl.spread ? (Math.random() - 0.5) * tpl.spread : 0;
          const a = w.angle + sp;
          const isCrit = Math.random() < critChance;
          const bSpd = tpl.spd * (tpl.isFlame ? (0.85 + Math.random() * 0.3) : 1);
          const maxLife = maxR / bSpd + (tpl.isFlame ? 0.02 : 0.07);
          const extraCritPierce = (w.id === 'crossbow' && isCrit) ? 2 : 0;
          bullets.push({
            x: mx, y: my, px: mx, py: my,
            vx: Math.cos(a) * bSpd, vy: Math.sin(a) * bSpd,
            dmg: base * finalMul * (isCrit ? critMult : 1), isCrit, angle: a,
            pierce: (tpl.pierce || 0) + extraCritPierce + (tpl.isRocket ? 0 : player.pierceBonus),
            bounces: (tpl.bounce || 0) + (tpl.isRocket || tpl.isFlame || tpl.isPlasma ? 0 : player.bounceBonus) + (tpl.isStar && isCrit ? 1 : 0),
            isStar: !!tpl.isStar, isFlame: !!tpl.isFlame, isRocket: !!tpl.isRocket,
            isPebble: !!tpl.isPebble, isIce: !!tpl.isIce, isPlasma: !!tpl.isPlasma, isBolt: w.id === 'crossbow',
            blastR: tpl.blastR ? tpl.blastR * getBlastScale() : 0,
            spin: Math.random() * 6.28, smokeT: 0,
            life: maxLife, maxLife,
            color: tpl.isFlame ? '#ff9f1c' : (tpl.isPlasma ? '#c77dff' : (tpl.isIce ? '#72efdd' : (tpl.isPebble ? '#cbd5e1' : (tpl.isStar ? '#e0fbfc' : (isCrit ? '#ffd166' : '#fff3b0'))))),
            r: tpl.isPlasma ? 8.5 : (tpl.isFlame ? 7 : (tpl.isRocket ? 6 : (tpl.isStar ? 6.5 : (tpl.isPebble ? 5.2 : (w.id === 'shotgun' ? 4.2 : 4.6))))),
            hit: new Set()
          });
        }
      }
    }
    const offset = w.thrust * (w.id === 'spear' ? 58 : 40) - w.recoil * 7;
    w.wx = baseWx + Math.cos(w.angle) * offset;
    w.wy = baseWy + Math.sin(w.angle) * offset;
  });
  player._displayRange = maxEquipRange > 0 ? maxEquipRange : Math.max(85, 130 + totalRange);

  // 自动机枪炮台索敌开火（享受工程套装与攻击范围加成）
  const techMul = 1 + setB.tech;
  const turretMaxR = Math.max(180, 390 + Math.round(totalRange * 0.5));
  for (const t of turrets) {
    t.cd -= dt;
    if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 8);
    let best = null, bestD = turretMaxR;
    for (const e of enemies) {
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (e.hp > 0 && !e.primed && d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      t.angle = Math.atan2(best.y - t.y, best.x - t.x);
      if (t.cd <= 0 && bullets.length < (isTouch ? 180 : 260)) {
        t.cd = Math.max(0.14, 0.42 / (Math.sqrt(effAspd) * techMul)) / (1 + (t.tier - 1) * 0.15);
        t.recoil = 1;
        const tdmg = (7 + wave * 0.85) * (1 + (t.tier - 1) * 0.5) * effDmg * techMul;
        const bLife = turretMaxR / 690;
        bullets.push({
          x: t.x + Math.cos(t.angle) * 16, y: t.y + Math.sin(t.angle) * 16,
          px: t.x, py: t.y,
          vx: Math.cos(t.angle) * 690, vy: Math.sin(t.angle) * 690,
          dmg: tdmg, isCrit: false, angle: t.angle, pierce: t.tier >= 3 ? 1 : 0, bounces: 0,
          life: bLife, maxLife: bLife, color: '#72efdd', r: 4.2, hit: new Set()
        });
      }
    }
  }

  // 玩家投射物更新（支持火箭尾烟、电浆球脉冲爆、冰锥寒霜、弹弓弹石、火焰扩散、飞镖旋转）
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.px = b.x; b.py = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.isStar) b.spin += dt * 22;
    if (b.isFlame) { b.vx *= (1 - dt * 1.6); b.vy *= (1 - dt * 1.6); b.r += dt * 20; }
    if (b.isRocket) {
      b.smokeT -= dt;
      if (b.smokeT <= 0) {
        b.smokeT = 0.035;
        if (particles.length < (isTouch ? 110 : 180)) {
          particles.push({ x: b.x - Math.cos(b.angle) * 8, y: b.y - Math.sin(b.angle) * 8, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18, r: 3.5 + Math.random() * 2.5, color: 'rgba(205, 198, 218, 0.34)', t: 0.24, maxT: 0.24 });
        }
      }
    }

    const outBounds = b.x < 0 || b.x > WORLD.w || b.y < 0 || b.y > WORLD.h;
    if (b.life <= 0 || outBounds) {
      if (b.isRocket) triggerExplosion(b.x, b.y, b.blastR, b.dmg * elemMul, false, 0, '#ff9f1c', true);
      else if (b.isPlasma) triggerExplosion(b.x, b.y, b.blastR || 82, b.dmg * 0.85 * elemMul, false, 0, '#c77dff', false);
      bullets.splice(i, 1); continue;
    }

    // 子弹命中异星晶树
    for (let tIdx = trees.length - 1; tIdx >= 0; tIdx--) {
      const tr = trees[tIdx];
      if (!tr || tr.hp <= 0 || b.hit.has(tr)) continue;
      const tdx = tr.x - b.x, tdy = tr.y - b.y, thit = tr.r + b.r;
      if (tdx * tdx + tdy * tdy < thit * thit) {
        b.hit.add(tr);
        hurtTree(tr, b.dmg);
        if (b.isRocket) {
          triggerExplosion(b.x, b.y, b.blastR, b.dmg * elemMul, false, 0, '#ff9f1c', true);
          b.life = -1; break;
        }
        if (b.pierce <= 0) { b.life = -1; break; }
        b.pierce--;
      }
    }
    if (b.life <= 0) {
      if (b.isPlasma) triggerExplosion(b.x, b.y, b.blastR || 82, b.dmg * 0.85 * elemMul, false, 0, '#c77dff', false);
      bullets.splice(i, 1); continue;
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (!e || e.hp <= 0 || e.primed) continue;
      const bdx = e.x - b.x, bdy = e.y - b.y, hitR = e.r + b.r;
      if (bdx * bdx + bdy * bdy < hitR * hitR && !b.hit.has(e)) {
        b.hit.add(e);
        if (b.isRocket) {
          triggerExplosion(b.x, b.y, b.blastR, b.dmg * elemMul, false, 0, '#ff9f1c', true);
          b.life = -1; break;
        }
        hurtEnemy(e, b.dmg, b.isCrit, b.angle, b.isFlame || b.isPlasma, {
          forceBurn: b.isFlame,
          forceChill: b.isIce,
          knockMult: b.isFlame ? 0.15 : (b.isBolt ? 1.35 : 1)
        });

        // 跳弹索敌判定（弹弓圆石 / 手里剑 / 跳弹棱镜）
        if (b.bounces > 0) {
          let nextE = null, nextD = 265;
          for (const cand of enemies) {
            if (cand.hp > 0 && !cand.primed && !b.hit.has(cand)) {
              const cd = Math.hypot(cand.x - b.x, cand.y - b.y);
              if (cd < nextD) { nextD = cd; nextE = cand; }
            }
          }
          if (nextE) {
            const spd = Math.hypot(b.vx, b.vy);
            const na = Math.atan2(nextE.y - b.y, nextE.x - b.x);
            b.vx = Math.cos(na) * spd; b.vy = Math.sin(na) * spd; b.angle = na;
            b.bounces--;
            b.dmg *= 0.9;
            b.life = Math.max(b.life, 0.44);
            addSparks(b.x, b.y, na, b.isPebble ? '#e2e8f0' : '#72efdd', 3);
            beep(b.isPebble ? 490 : 610, 0.025, 'triangle', 0.02);
            break;
          }
        }
        if (b.pierce <= 0) { b.life = -1; break; }
        b.pierce--;
      }
    }
    if (b.life <= 0 && !b.isRocket) {
      if (b.isPlasma) triggerExplosion(b.x, b.y, b.blastR || 82, b.dmg * 0.85 * elemMul, false, 0, '#c77dff', false);
      bullets.splice(i, 1);
    }
  }
  enemies = enemies.filter(e => e.hp > 0);

  // 怪物 AI 与元素异常状态（灼烧 DoT、冰缓减速 & 重甲蜗牛全局减速）
  const globalSlow = Math.max(0.5, 1 - (player.enemySlow || 0));
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e || e.hp <= 0) continue;
    if (e.hitFlash > 0) e.hitFlash -= dt;

    // 灼烧持续伤害（每 0.45 秒结算一次，数字干净不刷屏）
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.burnTick -= dt;
      if (e.burnTick <= 0) {
        e.burnTick = 0.45;
        hurtEnemy(e, e.burnDmg * 0.45, false, null, true, { isDot: true, noProc: true });
        if (e.hp <= 0) continue;
      }
    }
    if (e.chillT > 0) e.chillT -= dt;
    const isBossUnit = e.type === 'boss' || e.type === 'special_boss';
    const slowFactor = (e.chillT > 0 ? (isBossUnit ? 0.82 : 0.68) : 1) * globalSlow;
    const curSpd = e.spd * slowFactor;

    e.phase += dt * (e.type === 'swarmer' ? 18 : 7) * slowFactor;
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    e.faceA = a;
    const distP = Math.hypot(player.x - e.x, player.y - e.y);

    if (e.type === 'bomber') {
      if (!e.primed && distP < 58) primeBomber(e);
      if (e.primed) {
        e.fuseT -= dt;
        if (e.fuseT <= 0) {
          killEnemyRewards(e);
          triggerExplosion(e.x, e.y, e.blastR || 86, (34 + wave * 6) * diff.hpMul, true, e.dmg, '#ff4d6d');
          if (state !== 'wave') return;
          continue;
        }
      } else {
        e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
      }
    } else if (e.type === 'boss') {
      const enraged = (e.hp < e.maxHp * 0.55) || overtime;
      const bossMult = enraged ? 1.16 : 1;
      if (e.variant === 'frost_queen') {
        // 极寒霜晶女皇：冰霜螺旋新星（擦中减速） + 三重冰锥轰炸 + 寒雾滑步
        e.dashT -= dt * slowFactor * bossMult;
        if (e.dashT <= 0 && e.dashT > -0.36) {
          if (!e.dashing) {
            e.dashing = true;
            e.vx = Math.cos(a) * curSpd * 2.3; e.vy = Math.sin(a) * curSpd * 2.3;
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 78, color: '#72efdd', t: 0.28, maxT: 0.28 });
          }
          e.x += e.vx * dt; e.y += e.vy * dt;
        } else {
          if (e.dashT <= -0.36) { e.dashT = enraged ? 2.6 : 3.2; e.dashing = false; }
          if (distP > 175) { e.x += Math.cos(a) * curSpd * bossMult * dt; e.y += Math.sin(a) * curSpd * bossMult * dt; }
        }
        e.shotT = (e.shotT || 1.9) - dt * bossMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 1.75 : 2.25;
          const cnt = enraged ? 12 : 9;
          for (let k = 0; k < cnt && eBullets.length < 170; k++) {
            const ba = (k / cnt) * Math.PI * 2 + e.phase * 0.65;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 142, vy: Math.sin(ba) * 142, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.5, color: '#72efdd', shape: 'shard', chillPlayer: true });
          }
        }
        e.meteorT = (e.meteorT || 4.0) - dt * bossMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 3.3 : 4.2;
          const blasts = enraged ? 4 : 3;
          for (let b = 0; b < blasts; b++) {
            const ba = (b / blasts) * Math.PI * 2 + e.phase;
            const rad = b === 0 ? 30 : 125;
            spawnHazard(player.x + Math.cos(ba) * rad, player.y + Math.sin(ba) * rad, 74, e.dmg * 1.08, 1.25, { color: '#4cc9f0' });
          }
        }
      } else if (e.variant === 'mech_colossus') {
        // 熔核机械巨像：五连重型电浆点射 + 地毯式榴弹红圈 + 重踏震波弹环
        e.x += Math.cos(a) * curSpd * bossMult * dt; e.y += Math.sin(a) * curSpd * bossMult * dt;
        e.shotT = (e.shotT || 2.2) - dt * bossMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 2.4 : 3.0;
          e.burstLeft = enraged ? 6 : 4;
          e.burstCd = 0.02;
        }
        if (e.burstLeft > 0) {
          e.burstCd -= dt;
          if (e.burstCd <= 0) {
            e.burstCd = 0.14;
            e.burstLeft--;
            if (eBullets.length < 170) {
              const sa = a + (Math.random() - 0.5) * 0.24;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 168, vy: Math.sin(sa) * 168, dmg: Math.max(4, Math.round(e.dmg * 0.75)), r: 6.2, color: '#ff9f1c', shape: 'fire' });
            }
          }
        }
        e.dashT = (e.dashT || 3.4) - dt * bossMult;
        if (e.dashT <= 0) {
          e.dashT = enraged ? 3.1 : 3.9;
          shake = Math.max(shake, 8);
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 120, color: '#fb5607', t: 0.3, maxT: 0.3 });
          for (let k = 0; k < 8 && eBullets.length < 170; k++) {
            const ba = (k / 8) * Math.PI * 2 + e.phase * 0.4;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 138, vy: Math.sin(ba) * 138, dmg: Math.max(4, Math.round(e.dmg * 0.68)), r: 5.5, color: '#ff6b35', shape: 'fire' });
          }
        }
        e.meteorT = (e.meteorT || 4.0) - dt * bossMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 3.2 : 4.2;
          const blasts = enraged ? 4 : 3;
          for (let b = 0; b < blasts; b++) {
            spawnHazard(player.x + (Math.random() - 0.5) * 260, player.y + (Math.random() - 0.5) * 260, 80, e.dmg * 1.12, 1.3, { color: '#fb5607' });
          }
        }
      } else if (e.variant === 'void_weaver') {
        // 虚空织网主宰：次元相位折跃闪现 + 十字虚空法球阵 + 虫裔召唤
        if (distP > 170) { e.x += Math.cos(a) * curSpd * bossMult * dt; e.y += Math.sin(a) * curSpd * bossMult * dt; }
        e.blinkT = (e.blinkT || 3.2) - dt * bossMult;
        if (e.blinkT <= 0) {
          e.blinkT = enraged ? 2.7 : 3.5;
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 74, color: '#c77dff', t: 0.28, maxT: 0.28 });
          const ta = Math.random() * Math.PI * 2, td = 215 + Math.random() * 65;
          e.x = Math.max(100, Math.min(WORLD.w - 100, player.x + Math.cos(ta) * td));
          e.y = Math.max(100, Math.min(WORLD.h - 100, player.y + Math.sin(ta) * td));
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 86, color: '#c77dff', t: 0.32, maxT: 0.32, fill: true });
          const cnt = enraged ? 12 : 9;
          for (let k = 0; k < cnt && eBullets.length < 170; k++) {
            const ba = (k / cnt) * Math.PI * 2 + e.phase;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 148, vy: Math.sin(ba) * 148, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.8, color: '#c77dff' });
          }
        }
        e.meteorT = (e.meteorT || 4.3) - dt * bossMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 3.5 : 4.5;
          for (let b = 0; b < (enraged ? 3 : 2); b++) {
            spawnHazard(player.x + (Math.random() - 0.5) * 210, player.y + (Math.random() - 0.5) * 210, 80, e.dmg * 1.08, 1.25, { color: '#9d4edd' });
          }
        }
        e.sumT = (e.sumT || 6.0) - dt * bossMult;
        if (e.sumT <= 0 && enemies.length < 60) {
          e.sumT = enraged ? 5.2 : 6.5;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 200)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 200)), 'swarmer');
        }
      } else {
        // 深渊屠夫虫王（经典狂暴冲锋 + 环形毒液弹 + 陨石轰炸 + 虫群召唤）
        e.dashT -= dt * slowFactor * bossMult;
        if (e.dashT <= 0.58 && e.dashT > 0 && e.lockedAim === undefined) e.lockedAim = a;
        if (e.dashT <= 0 && e.dashT > -0.42) {
          if (!e.dashing) {
            e.dashing = true;
            const ca = e.lockedAim !== undefined ? e.lockedAim : a;
            e.vx = Math.cos(ca) * curSpd * 2.55; e.vy = Math.sin(ca) * curSpd * 2.55;
            const cnt = enraged ? 11 : 8;
            const bSpd = enraged ? 162 : 145;
            for (let k = 0; k < cnt && eBullets.length < 170; k++) {
              const ba = (k / cnt) * Math.PI * 2 + e.phase;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * bSpd, vy: Math.sin(ba) * bSpd, dmg: Math.max(4, Math.round(e.dmg * 0.70)), r: 5.5 });
            }
          }
          e.x += e.vx * dt; e.y += e.vy * dt;
        } else {
          if (e.dashT <= -0.42) { e.dashT = enraged ? 1.85 : 2.35; e.dashing = false; e.lockedAim = undefined; }
          if (e.dashT > 0.58) { e.x += Math.cos(a) * curSpd * bossMult * dt; e.y += Math.sin(a) * curSpd * bossMult * dt; }
        }
        e.meteorT = (e.meteorT || 4.4) - dt * bossMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 3.4 : 4.6;
          const blasts = enraged ? 3 : 2;
          for (let b = 0; b < blasts; b++) {
            const ox = b === 0 ? (dx * 24) : (Math.random() - 0.5) * 230;
            const oy = b === 0 ? (dy * 24) : (Math.random() - 0.5) * 230;
            spawnHazard(player.x + ox, player.y + oy, 80, e.dmg * 1.1, 1.25);
          }
        }
        e.sumT -= dt * bossMult;
        if (e.sumT <= 0 && enemies.length < 60) {
          e.sumT = enraged ? 5.8 : 7.2;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 220)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 220)), 'swarmer');
        }
      }
    } else if (e.type === 'mini_boss') {
      if (e.variant === 'pyro_lord') {
        // 炽焰重炮统领：扇形五联烈焰弹 + 烈焰轰炸红圈
        if (distP > 165) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
        e.shotT = (e.shotT || 2.1) - dt * slowFactor;
        if (e.shotT <= 0) {
          e.shotT = 2.35;
          for (let k = -2; k <= 2 && eBullets.length < 170; k++) {
            const sa = a + k * 0.20;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 156, vy: Math.sin(sa) * 156, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.5, color: '#ff6b35', shape: 'fire' });
          }
        }
        e.meteorT = (e.meteorT || 4.8) - dt;
        if (e.meteorT <= 0) {
          e.meteorT = 4.9;
          for (let b = 0; b < 2; b++) {
            spawnHazard(player.x + (Math.random() - 0.5) * 180, player.y + (Math.random() - 0.5) * 180, 68, e.dmg * 1.05, 1.25, { color: '#ff9f1c' });
          }
        }
      } else if (e.variant === 'shadow_stalker') {
        // 幽影雷刃统领：高频瞬步突刺 + 八向雷光飞镖
        e.dashT -= dt * slowFactor;
        if (e.dashT <= 0.45 && e.dashT > 0 && e.lockedAim === undefined) e.lockedAim = a;
        if (e.dashT <= 0 && e.dashT > -0.36) {
          if (!e.dashing) {
            e.dashing = true;
            const ca = e.lockedAim !== undefined ? e.lockedAim : a;
            e.vx = Math.cos(ca) * curSpd * 2.8; e.vy = Math.sin(ca) * curSpd * 2.8;
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 60, color: '#72efdd', t: 0.24, maxT: 0.24 });
            for (let k = 0; k < 8 && eBullets.length < 170; k++) {
              const ba = (k / 8) * Math.PI * 2 + e.phase;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 154, vy: Math.sin(ba) * 154, dmg: Math.max(4, Math.round(e.dmg * 0.68)), r: 5.2, color: '#72efdd', shape: 'needle' });
            }
          }
          e.x += e.vx * dt; e.y += e.vy * dt;
        } else {
          if (e.dashT <= -0.36) { e.dashT = 2.15; e.dashing = false; e.lockedAim = undefined; }
          if (e.dashT > 0.45) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
        }
      } else {
        // 狂厄裂地统领：经典重甲蓄力冲撞 + 裂地弹幕
        e.dashT -= dt * slowFactor;
        if (e.dashT <= 0.58 && e.dashT > 0 && e.lockedAim === undefined) e.lockedAim = a;
        if (e.dashT <= 0 && e.dashT > -0.42) {
          if (!e.dashing) {
            e.dashing = true;
            const ca = e.lockedAim !== undefined ? e.lockedAim : a;
            e.vx = Math.cos(ca) * curSpd * 2.65; e.vy = Math.sin(ca) * curSpd * 2.65;
            for (let k = 0; k < 6 && eBullets.length < 170; k++) {
              const ba = (k / 6) * Math.PI * 2 + e.phase;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 145, vy: Math.sin(ba) * 145, dmg: Math.max(4, Math.round(e.dmg * 0.70)), r: 5.5 });
            }
          }
          e.x += e.vx * dt; e.y += e.vy * dt;
        } else {
          if (e.dashT <= -0.42) { e.dashT = 2.6; e.dashing = false; e.lockedAim = undefined; }
          if (e.dashT > 0.58) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
        }
        e.meteorT = (e.meteorT || 4.8) - dt;
        if (e.meteorT <= 0) {
          e.meteorT = 5.3;
          spawnHazard(player.x + dx * 24, player.y + dy * 24, 68, e.dmg * 1.1, 1.25);
        }
      }
    } else if (e.type === 'special_boss') {
      // 地图奇遇召唤的三大隐藏特殊首领
      const enraged = (e.hp < e.maxHp * 0.5) || overtime;
      const sbMult = enraged ? 1.15 : 1;
      if (e.variant === 'crimson_lord') {
        // 猩红鲜血伯爵：疾速血影冲刺 + 弧月鲜血斩弹幕 + 召唤血蝠虫群
        e.dashT -= dt * slowFactor * sbMult;
        if (e.dashT <= 0.48 && e.dashT > 0 && e.lockedAim === undefined) e.lockedAim = a;
        if (e.dashT <= 0 && e.dashT > -0.38) {
          if (!e.dashing) {
            e.dashing = true;
            const ca = e.lockedAim !== undefined ? e.lockedAim : a;
            e.vx = Math.cos(ca) * curSpd * 2.6; e.vy = Math.sin(ca) * curSpd * 2.6;
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 72, color: '#ff4d6d', t: 0.25, maxT: 0.25 });
          }
          e.x += e.vx * dt; e.y += e.vy * dt;
        } else {
          if (e.dashT <= -0.38) { e.dashT = enraged ? 2.1 : 2.6; e.dashing = false; e.lockedAim = undefined; }
          if (e.dashT > 0.48) { e.x += Math.cos(a) * curSpd * sbMult * dt; e.y += Math.sin(a) * curSpd * sbMult * dt; }
        }
        e.shotT = (e.shotT || 2.0) - dt * sbMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 1.85 : 2.3;
          const cnt = enraged ? 7 : 5;
          const half = (cnt - 1) / 2;
          for (let k = 0; k < cnt && eBullets.length < 170; k++) {
            const sa = a + (k - half) * 0.17;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 162, vy: Math.sin(sa) * 162, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.6, color: '#ff4d6d', shape: 'needle' });
          }
        }
        e.sumT = (e.sumT || 5.8) - dt * sbMult;
        if (e.sumT <= 0 && enemies.length < 60) {
          e.sumT = 6.2;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 170)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 170)), 'swarmer');
        }
      } else if (e.variant === 'golden_golem') {
        // 黄金晶石巨神：重装黄金震地弹环 + 晶簇陨星轰炸
        e.x += Math.cos(a) * curSpd * sbMult * dt; e.y += Math.sin(a) * curSpd * sbMult * dt;
        e.shotT = (e.shotT || 2.2) - dt * sbMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 2.0 : 2.5;
          shake = Math.max(shake, 7);
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 96, color: '#ffd166', t: 0.28, maxT: 0.28 });
          const cnt = enraged ? 10 : 8;
          for (let k = 0; k < cnt && eBullets.length < 170; k++) {
            const ba = (k / cnt) * Math.PI * 2 + e.phase * 0.5;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 145, vy: Math.sin(ba) * 145, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.8, color: '#ffd166', shape: 'shard' });
          }
        }
        e.meteorT = (e.meteorT || 4.2) - dt * sbMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 3.4 : 4.3;
          for (let b = 0; b < 2; b++) {
            spawnHazard(player.x + (Math.random() - 0.5) * 200, player.y + (Math.random() - 0.5) * 200, 76, e.dmg * 1.08, 1.28, { color: '#ffd166' });
          }
        }
      } else {
        // 异次元吞噬者：双螺旋奇点弹幕 + 暗物质坍缩法阵
        if (distP > 155) { e.x += Math.cos(a) * curSpd * sbMult * dt; e.y += Math.sin(a) * curSpd * sbMult * dt; }
        e.shotT = (e.shotT || 1.9) - dt * sbMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 1.65 : 2.05;
          const cnt = enraged ? 10 : 8;
          for (let k = 0; k < cnt && eBullets.length < 170; k++) {
            const ba = (k / cnt) * Math.PI * 2 + e.phase * 0.8;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 148, vy: Math.sin(ba) * 148, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.8, color: '#c77dff' });
          }
        }
        e.meteorT = (e.meteorT || 3.9) - dt * sbMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 3.2 : 4.0;
          for (let b = 0; b < (enraged ? 3 : 2); b++) {
            spawnHazard(player.x + (Math.random() - 0.5) * 220, player.y + (Math.random() - 0.5) * 220, 78, e.dmg * 1.1, 1.25, { color: '#9d4edd' });
          }
        }
      }
    } else if (e.type === 'charger' || e.type === 'sand_worm') {
      // 犀角冲锋兽 & 荒漠潜沙虫（蓄力突进）
      e.dashT -= dt * slowFactor;
      if (e.dashT <= 0.55 && e.dashT > 0 && e.lockedAim === undefined) e.lockedAim = a;
      if (e.dashT <= 0 && e.dashT > -0.40) {
        if (!e.dashing) {
          e.dashing = true;
          const ca = e.lockedAim !== undefined ? e.lockedAim : a;
          const mult = e.type === 'sand_worm' ? 2.45 : 2.65;
          e.vx = Math.cos(ca) * curSpd * mult; e.vy = Math.sin(ca) * curSpd * mult;
          if (e.type === 'sand_worm') addSparks(e.x, e.y, ca + Math.PI, '#f4a261', 5);
        }
        e.x += e.vx * dt; e.y += e.vy * dt;
      } else {
        if (e.dashT <= -0.40) { e.dashT = e.type === 'sand_worm' ? 2.15 : 2.6; e.dashing = false; e.lockedAim = undefined; }
        if (e.dashT > 0.55) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      }
    } else if (e.type === 'stalker') {
      // 刀锋疾行螳：高速 Z 字折线机动 + 近身挥出干净青色镰爪斩光
      const wa = a + Math.sin(e.phase * 0.9) * 0.44;
      e.x += Math.cos(wa) * curSpd * dt; e.y += Math.sin(wa) * curSpd * dt;
      e.slashCd = (e.slashCd || 0) - dt * slowFactor;
      if (distP < 64 && e.slashCd <= 0) {
        e.slashCd = 1.05;
        if (slashes.length < 36) slashes.push({ x: e.x + Math.cos(a) * 14, y: e.y + Math.sin(a) * 14, angle: a, r: 42, color: '#06d6a0', mode: 'claw', t: 0.14, maxT: 0.14 });
      }
    } else if (e.type === 'sniper_bug') {
      // 晶刺狙击虫：远距驻守 + 0.55s 细红瞄准线锁定 + 高速猩红穿刺骨针
      if (e.aimA === undefined) {
        if (distP > 360) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
        else if (distP < 195) { e.x -= Math.cos(a) * curSpd * 0.65 * dt; e.y -= Math.sin(a) * curSpd * 0.65 * dt; }
      }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0.55 && e.shotT > 0 && e.aimA === undefined) {
        e.aimA = a;
      } else if (e.shotT <= 0) {
        const sa = e.aimA !== undefined ? e.aimA : a;
        e.aimA = undefined;
        e.shotT = e.elite ? 2.25 : 2.95;
        if (eBullets.length < 170) {
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 245, vy: Math.sin(sa) * 245, dmg: e.dmg, r: 4.8, color: '#ff2a55', shape: 'needle' });
        }
      }
    } else if (e.type === 'spinner') {
      // 旋刃飞盘虫：中距游走投掷旋转十字金刃飞盘
      if (distP > 240) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.15 : 2.75;
        if (eBullets.length < 170) {
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 135, vy: Math.sin(a) * 135, dmg: e.dmg, r: 8.2, color: '#ffd166', shape: 'disc', rot: 0 });
        }
      }
    } else if (e.type === 'rad_scorpion') {
      // 废土专属：晶化毒蝎（三连扇形辐射酸液弹）
      if (distP > 225) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.0 : 2.55;
        for (let k = -1; k <= 1 && eBullets.length < 170; k++) {
          const sa = a + k * 0.24;
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 155, vy: Math.sin(sa) * 155, dmg: Math.max(3, Math.round(e.dmg * 0.85)), r: 5.2, color: '#80ff72', shape: 'acid' });
        }
      }
    } else if (e.type === 'frost_wisp') {
      // 冻原专属：凛冬冰魄（悬浮菱形寒霜晶，命中附带短暂冻缓）
      if (distP > 235) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 1.9 : 2.45;
        if (eBullets.length < 170) {
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 162, vy: Math.sin(a) * 162, dmg: e.dmg, r: 5.4, color: '#72efdd', shape: 'shard', chillPlayer: true });
        }
      }
    } else if (e.type === 'spore_mother') {
      // 菌林专属：剧毒孢子母体（抛射毒雾红圈 + 死后分裂）
      if (distP > 240) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.6 : 3.3;
        spawnHazard(player.x + (Math.random() - 0.5) * 65, player.y + (Math.random() - 0.5) * 65, 64, e.dmg, 1.28, { color: '#a3e635' });
      }
    } else if (e.type === 'shooter') {
      if (distP > 250) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 1.95 : 2.55;
        const leadX = player.x + (player.moving ? dx * 10 : 0);
        const leadY = player.y + (player.moving ? dy * 10 : 0);
        const sa = Math.atan2(leadY - e.y, leadX - e.x);
        if (eBullets.length < 170) eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 168, vy: Math.sin(sa) * 168, dmg: e.dmg, r: 5.4, color: '#00f5d4', shape: 'acid' });
      }
    } else if (e.type === 'mortar') {
      if (distP > 360) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      else if (distP < 190) { e.x -= Math.cos(a) * curSpd * 0.65 * dt; e.y -= Math.sin(a) * curSpd * 0.65 * dt; }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.6 : 3.35;
        const tx = player.x + (player.moving ? dx * 25 : 0) + (Math.random() - 0.5) * 55;
        const ty = player.y + (player.moving ? dy * 25 : 0) + (Math.random() - 0.5) * 55;
        spawnHazard(tx, ty, e.elite ? 76 : 66, e.dmg, 1.25);
      }
    } else if (e.type === 'summoner') {
      if (distP > 320) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      else if (distP < 180) { e.x -= Math.cos(a) * curSpd * 0.7 * dt; e.y -= Math.sin(a) * curSpd * 0.7 * dt; }
      e.sumT -= dt * slowFactor;
      if (e.sumT <= 0 && enemies.length < 75) {
        e.sumT = 5.2;
        if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 55, color: '#c77dff', t: 0.3, maxT: 0.3 });
        spawnWarning(Math.max(70, Math.min(WORLD.w - 70, e.x + (Math.random() - 0.5) * 130)), Math.max(70, Math.min(WORLD.h - 70, e.y + (Math.random() - 0.5) * 130)), 'swarmer');
      }
    } else if (e.type === 'healer') {
      if (distP > 210) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.healT -= dt * slowFactor;
      if (e.healT <= 0) {
        e.healT = 2.8;
        if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 190, color: '#52b788', t: 0.35, maxT: 0.35 });
        for (const ally of enemies) {
          if (ally.hp > 0 && ally.hp < ally.maxHp && Math.hypot(ally.x - e.x, ally.y - e.y) <= 190) {
            const h = Math.round(ally.maxHp * 0.14 + 4);
            ally.hp = Math.min(ally.maxHp, ally.hp + h);
            addText(ally.x, ally.y - ally.r, '+' + h, '#52b788', 12);
          }
        }
      }
    } else {
      e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
      if (e.type === 'brute') {
        e.slamCd = (e.slamCd || 2.4) - dt * slowFactor;
        if (distP < 92 && e.slamCd <= 0) {
          e.slamCd = 2.8;
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 86, color: '#c77dff', t: 0.24, maxT: 0.24 });
        }
      } else if (e.type === 'magma_imp' && Math.random() < dt * 8 && particles.length < (isTouch ? 110 : 180)) {
        particles.push({ x: e.x + (Math.random() - 0.5) * 10, y: e.y + 4, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 20, r: 3, color: '#ff9f1c', t: 0.22, maxT: 0.22 });
      }
    }

    // 软碰撞排斥（包围盒快速剪枝 + 平方距离预筛，120 怪同屏亦零卡顿）
    for (let j = i - 1; j >= 0; j--) {
      const o = enemies[j];
      if (!o || o.hp <= 0) continue;
      const minD = (e.r + o.r) * 0.82;
      const dx2 = o.x - e.x;
      if (dx2 >= minD || dx2 <= -minD) continue;
      const dy2 = o.y - e.y;
      if (dy2 >= minD || dy2 <= -minD) continue;
      const dSq = dx2 * dx2 + dy2 * dy2;
      if (dSq > 0.01 && dSq < minD * minD) {
        const d2 = Math.sqrt(dSq);
        const push = (minD - d2) * 0.32;
        const nx = dx2 / d2, ny = dy2 / d2;
        e.x -= nx * push; e.y -= ny * push;
        o.x += nx * push; o.y += ny * push;
      }
    }

    e.x = Math.max(e.r + 6, Math.min(WORLD.w - e.r - 6, e.x));
    e.y = Math.max(e.r + 6, Math.min(WORLD.h - e.r - 6, e.y));
    if (!e.primed && Math.hypot(player.x - e.x, player.y - e.y) < player.r + e.r - 4) {
      if (player.cls === 'bull') triggerBullNova();
      hurtPlayer(e.dmg);
      if (state !== 'wave') return;
    }
  }
  enemies = enemies.filter(e => e.hp > 0);

  // 敌方弹幕（支持旋刃飞盘自转、沙暴减速、冰魄寒霜附着，擦弹容错判定友好）
  const ebSpdMul = sandGustT > 0 ? 0.78 : 1;
  for (let i = eBullets.length - 1; i >= 0; i--) {
    const b = eBullets[i];
    b.x += b.vx * ebSpdMul * dt; b.y += b.vy * ebSpdMul * dt;
    if (b.shape === 'disc') b.rot = (b.rot || 0) + dt * 14;
    if (b.x < 0 || b.x > WORLD.w || b.y < 0 || b.y > WORLD.h) { eBullets.splice(i, 1); continue; }
    if (Math.hypot(player.x - b.x, player.y - b.y) < player.r + b.r - 5) {
      if (b.chillPlayer && player.invuln <= 0) player.chillSlowT = 1.25;
      hurtPlayer(b.dmg);
      eBullets.splice(i, 1);
      if (state !== 'wave') return;
    }
  }

  // 掉落晶石 / 血包果实 / 战利品宝箱磁吸结算
  const magSq = player.magnet * player.magnet;
  const pickR = player.r + 13, pickSq = pickR * pickR;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.bob += dt * 5;
    const ddx = player.x - d.x, ddy = player.y - d.y;
    const distSq = ddx * ddx + ddy * ddy;
    if (distSq < magSq && distSq > 0.01) {
      const dist = Math.sqrt(distSq);
      const pullSpd = 520 + (player.magnet - dist) * 2;
      d.x += (ddx / dist) * pullSpd * dt; d.y += (ddy / dist) * pullSpd * dt;
    }
    if (distSq < pickSq) {
      if (d.kind === 'mat') {
        const v = d.val || 1;
        const xpScale = wave === 1 ? 0.68 : 0.52;
        const rawXp = v * xpScale * player.harvest;
        const xpGain = Math.floor(rawXp) + (Math.random() < (rawXp % 1) ? 1 : 0);
        // 适度收敛前期晶石产出并对齐怪量增长与商店通胀曲线，每波购物更有抉择感
        const matRate = 0.82 / (1 + Math.max(0, wave - 1) * 0.19);
        const rawMat = v * player.harvest * matRate;
        const matGain = Math.floor(rawMat) + (Math.random() < (rawMat % 1) ? 1 : 0);
        player.mats += matGain; player.xp += xpGain;
        beep(780, 0.022, 'sine', 0.022);
        // 【幸运弹珠】拾取晶石概率落雷轰击场上随机怪物
        if (player.cyberball > 0 && enemies.length > 0 && Math.random() < Math.min(0.60, (0.16 + (player.luck || 0) * 0.005) * player.cyberball)) {
          const alive = enemies.filter(e => e.hp > 0 && !e.primed);
          if (alive.length > 0) {
            const te = alive[Math.floor(Math.random() * alive.length)];
            const cbDmg = (12 + wave * 2.5 + (player.luck || 0) * 0.35) * effDmg;
            if (lightnings.length < 35) lightnings.push({ pts: [{ x: player.x, y: player.y - 10 }, { x: te.x, y: te.y }], color: '#ffd166', t: 0.14, maxT: 0.14 });
            hurtEnemy(te, cbDmg, false, null, true, { noProc: true });
          }
        }
        let lvGuard = 0;
        while (player.xp >= player.xpNeed && lvGuard++ < 25) {
          player.xp -= player.xpNeed; player.lv++;
          player.xpNeed = Math.max(10, Math.round(player.xpNeed * 1.36 + 6));
          player.maxHp += 1; player.hp += 1;
          pendingLevels++;
          addText(player.x, player.y - 36, 'LEVEL UP!', '#ffd166', 22);
          beep(920, 0.12, 'triangle', 0.06);
        }
      } else if (d.kind === 'crate') {
        pendingCrates++;
        addText(player.x, player.y - 34, `🎁 宝箱 +1`, '#ffd166', 19);
        beep(880, 0.11, 'triangle', 0.06);
      } else {
        const healAmt = 5 + (player.healBonus || 0);
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        addText(player.x, player.y - 28, `+${healAmt} HP`, '#6ede8a', 17);
        beep(640, 0.08, 'sine', 0.05);
      }
      drops.splice(i, 1);
    }
  }

  // 特效生命周期更新
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt;
    if (p.t <= 0) particles.splice(i, 1);
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const sp = sparks[i]; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.t -= dt;
    if (sp.t <= 0) sparks.splice(i, 1);
  }
  for (let i = lightnings.length - 1; i >= 0; i--) { lightnings[i].t -= dt; if (lightnings[i].t <= 0) lightnings.splice(i, 1); }
  for (let i = rings.length - 1; i >= 0; i--) { rings[i].t -= dt; if (rings[i].t <= 0) rings.splice(i, 1); }
  for (let i = slashes.length - 1; i >= 0; i--) { slashes[i].t -= dt; if (slashes[i].t <= 0) slashes.splice(i, 1); }
  for (let i = beams.length - 1; i >= 0; i--) { beams[i].t -= dt; if (beams[i].t <= 0) beams.splice(i, 1); }
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; s.rot += 12 * dt; s.t -= dt;
    if (s.t <= 0) shells.splice(i, 1);
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i]; t.x += t.vx * dt; t.y += t.vy * dt; t.vy += 240 * dt; t.t -= dt;
    if (t.t <= 0) texts.splice(i, 1);
  }

  // 更新高清 HUD（节流 + 脏值比对，避免每帧强制触发手机 DOM 重排）
  hudAcc += dt;
  if (hudAcc >= 0.08) {
    hudAcc = 0;
    setHudWidth('hpFill', Math.max(0, Math.round((player.hp / player.maxHp) * 1000) / 10) + '%');
    setHudWidth('shFill', player.maxShield > 0 ? Math.min(100, Math.round((player.shield / player.maxHp) * 1000) / 10) + '%' : '0%');
    const shTxt = player.maxShield > 0 ? ` · 🛡️${Math.ceil(player.shield)}` : '';
    setHudText('hpText', `${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp}${shTxt}`);
    setHudWidth('xpFill', Math.min(100, Math.round((player.xp / player.xpNeed) * 1000) / 10) + '%');
    setHudText('xpText', `Lv.${player.lv}${pendingLevels ? ' (+' + pendingLevels + ')' : ''}`);
    setHudText('hudKills', `💀 击杀 ${player.kills}`);
    const crateTxt = pendingCrates > 0 ? ` · 🎁${pendingCrates}` : '';
    setHudText('hudWeapons', player.maxSlots === 0 ? `🐂 震荡肉弹${crateTxt}` : `⚔️ 武器 ${player.weapons.length}/${player.maxSlots}${turrets.length ? ' · 🛰️' + turrets.length : ''}${crateTxt}`);
    const waveTag = endlessMode ? `♾️ 无尽第 ${wave} 波` : (wave === MAX_WAVE ? '👑 最终决战' : (hordeWave ? `⚠️ 突袭 ${wave}/${MAX_WAVE}` : `第 ${wave} / ${MAX_WAVE} 波`));
    setHudText('waveTitle', uiMode === 'desktop' ? `${diff.badge} · ${curScene.icon}${curScene.name} · ${waveTag}` : `${diff.badge} · ${curScene.icon}${waveTag}`);
    setHudText('waveTimer', overtime ? '死斗!' : String(Math.ceil(Math.max(0, waveTime))));
    const timerPct = overtime ? 100 : Math.max(0, Math.min(100, (waveTime / Math.max(1, waveMaxTime)) * 100));
    setHudWidth('timerFill', timerPct.toFixed(1) + '%');
    const tcEl = hudEls.timerCapsule || (hudEls.timerCapsule = document.getElementById('timerCapsule'));
    if (tcEl) {
      const isUrgent = overtime || waveTime <= 5;
      const isWarn = !isUrgent && waveTime <= 10;
      const timerState = isUrgent ? 'urgent' : (isWarn ? 'warn' : 'normal');
      if (hudCache.timerState !== timerState) {
        hudCache.timerState = timerState;
        tcEl.classList.toggle('warn', isWarn);
        tcEl.classList.toggle('urgent', isUrgent);
      }
    }
    setHudText('matText', `💎 ${player.mats}`);

    let bossCnt = 0, bossCur = 0, bossTot = 0;
    const bossTitles = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if ((e.type === 'boss' || e.type === 'mini_boss' || e.type === 'special_boss') && e.hp > 0) {
        bossCnt++;
        bossCur += Math.max(0, e.hp);
        bossTot += e.maxHp;
        const bt = e.bossTitle || (e.type === 'mini_boss' ? '⚔️ 狂厄裂地统领' : '👑 深渊屠夫虫王');
        if (bossTitles.length < 2 && !bossTitles.includes(bt)) bossTitles.push(bt);
      }
    }
    const pendingBossSpawn = spawns.some(s => s.type === 'boss' || s.type === 'mini_boss' || s.type === 'special_boss');
    const bwEl = hudEls.bossBarWrap || (hudEls.bossBarWrap = document.getElementById('bossBarWrap'));
    if (bossCnt > 0) {
      if (bwEl && bwEl.classList.contains('hidden')) bwEl.classList.remove('hidden');
      const bName = bossTitles.length > 1 ? bossTitles.join(' & ') : (bossCnt > 1 ? `${bossTitles[0]} ×${bossCnt}` : bossTitles[0]);
      if (hudCache.bossName !== bName) {
        hudCache.bossName = bName;
        const bnEl = hudEls.bossName || (hudEls.bossName = document.querySelector('.boss-name'));
        if (bnEl) bnEl.textContent = bName;
      }
      setHudWidth('bossFill', Math.round((bossCur / Math.max(1, bossTot)) * 1000) / 10 + '%');
    } else if (!pendingBossSpawn) {
      setHudWidth('bossFill', '0%');
      if (bwEl && !bwEl.classList.contains('hidden')) bwEl.classList.add('hidden');
    }
  }
}
