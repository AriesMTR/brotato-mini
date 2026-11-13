// 60FPS 核心战术状态机主更新循环（移动、武器开火、投射物、怪物与首领 AI）
function compactAliveEnemies() {
  let w = 0;
  for (let r = 0; r < enemies.length; r++) {
    const e = enemies[r];
    if (e && e.hp > 0) enemies[w++] = e;
  }
  enemies.length = w;
}

function hasBulletHit(b, target) {
  if (b.lastHit === target) return true;
  return b.hit ? b.hit.has(target) : false;
}

function markBulletHit(b, target) {
  if (!b.lastHit) { b.lastHit = target; return; }
  if (b.lastHit === target) return;
  if (!b.hit) { b.hit = new Set(); b.hit.add(b.lastHit); }
  b.hit.add(target);
}

// 计算直线冲锋在地图边界内的真实可达预警长度（确保预警虚线终点 === 100% 实际冲刺落点）
function computeDashAllowedLen(x, y, ang, desiredLen, r) {
  const pad = (r || 20) + 6;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  let maxLen = desiredLen;
  if (ca > 1e-4) maxLen = Math.min(maxLen, (WORLD.w - pad - x) / ca);
  else if (ca < -1e-4) maxLen = Math.min(maxLen, (pad - x) / ca);
  if (sa > 1e-4) maxLen = Math.min(maxLen, (WORLD.h - pad - y) / sa);
  else if (sa < -1e-4) maxLen = Math.min(maxLen, (pad - y) / sa);
  return Math.max(48, Math.round(maxLen));
}

function lockLinearDash(e, ang, desiredLen, windupMax, dashColor = '') {
  e.lockedAim = ang;
  e.dashWindupMax = windupMax;
  e.dashWarnLen = computeDashAllowedLen(e.x, e.y, ang, desiredLen, e.r);
  e.dashWarnColor = dashColor || '';
}

function startLinearDash(e, fallbackAng, desiredLen, dashDur) {
  const ca = e.lockedAim !== undefined ? e.lockedAim : fallbackAng;
  const dist = e.dashWarnLen || computeDashAllowedLen(e.x, e.y, ca, desiredLen, e.r);
  e.dashing = true;
  e.dashAng = ca;
  e.dashWarnLen = dist;
  e.dashRem = dist;
  e.dashSpd = dist / Math.max(0.18, dashDur);
  e.vx = Math.cos(ca) * e.dashSpd;
  e.vy = Math.sin(ca) * e.dashSpd;
  return ca;
}

function advanceLinearDash(e, dt) {
  const step = Math.min(e.dashRem || 0, (e.dashSpd || 700) * dt);
  const ca = e.dashAng !== undefined ? e.dashAng : (e.lockedAim || 0);
  e.x += Math.cos(ca) * step;
  e.y += Math.sin(ca) * step;
  e.dashRem = (e.dashRem || 0) - step;
  return e.dashRem > 0.5;
}

function finishLinearDash(e, nextCd) {
  e.dashing = false;
  e.lockedAim = undefined;
  e.dashWarnLen = undefined;
  e.dashWindupMax = undefined;
  e.dashWarnColor = undefined;
  e.dashRem = 0;
  e.dashT = nextCd;
}

function update(dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  if (typeof SpireAudio !== 'undefined') SpireAudio.tick(dt);
  if (typeof SpireDirector !== 'undefined' && SpireDirector) {
    SpireDirector.update(dt);
    if (SpireDirector.isBlockingGameplay()) {
      if (state === 'wave' && player) {
        // 登场剧情播放期间预先将首领实体从传送预警法阵具象化至桥心，对话落幕瞬间即可无缝交锋
        for (let i = spawns.length - 1; i >= 0; i--) {
          const sp = spawns[i];
          if (sp.type === 'boss' || sp.type === 'special_boss' || sp.type === 'mini_boss') {
            sp.t -= dt;
            if (sp.t <= 0) {
              createEnemy(sp.x, sp.y, sp.type, sp.variant);
              spawns.splice(i, 1);
            }
          }
        }
      }
      return;
    }
    const ts = typeof SpireDirector.getTimeScale === 'function' ? SpireDirector.getTimeScale() : 1;
    if (ts <= 0.001) return;
    dt *= ts;
  }
  if (state !== 'wave' || !player) return;
  if (typeof isAudioModalOpen === 'function' && isAudioModalOpen()) return;
  if (shake > 0) shake = Math.max(0, shake - dt * 36);
  if (player._atkPoseT > 0) player._atkPoseT = Math.max(0, player._atkPoseT - dt);
  if (typeof pendingBossCutscene !== 'undefined' && pendingBossCutscene && !bossCutscene && typeof startBossCutscene === 'function') {
    const pc = pendingBossCutscene;
    pendingBossCutscene = null;
    startBossCutscene(pc.mode, pc.variant, pc.title, pc.subtitle, pc.extraTag, pc.color, pc.accent, pc.dur, { fadeDur: pc.fadeDur });
  }
  // 首领召唤 / 终局降临 / 隐藏神话二阶段全屏静止登场演出
  if (bossCutscene && bossCutscene.t > 0) {
    bossCutscene.t -= dt;
    for (let i = spawns.length - 1; i >= 0; i--) {
      const sp = spawns[i];
      if (sp.type === 'boss' || sp.type === 'special_boss' || sp.type === 'mini_boss') {
        sp.t -= dt;
        if (sp.t <= 0) {
          createEnemy(sp.x, sp.y, sp.type, sp.variant);
          spawns.splice(i, 1);
        }
      }
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t -= dt * 0.65;
      if (rings[i].t <= 0) rings.splice(i, 1);
    }
    for (let i = lightnings.length - 1; i >= 0; i--) {
      lightnings[i].t -= dt * 0.65;
      if (lightnings[i].t <= 0) lightnings.splice(i, 1);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt * 0.4;
      p.y += p.vy * dt * 0.4;
      p.t -= dt * 0.6;
      if (p.t <= 0) particles.splice(i, 1);
    }
    if (bossCutscene.t <= 0) bossCutscene = null;
    return;
  }
  if (player.bullCd > 0) player.bullCd -= dt;
  if (player._hsCd > 0) player._hsCd = Math.max(0, player._hsCd - dt);
  if (player.dashCd > 0) player.dashCd = Math.max(0, player.dashCd - dt);
  if (player.dashHasteT > 0) player.dashHasteT = Math.max(0, player.dashHasteT - dt);
  if (player.dashSurgeT > 0) player.dashSurgeT = Math.max(0, player.dashSurgeT - dt);
  if (player._salvoCd > 0) player._salvoCd = Math.max(0, player._salvoCd - dt);
  if (player.turretOverclockT > 0) player.turretOverclockT = Math.max(0, player.turretOverclockT - dt);
  const envDmgMul = (typeof MONSTER_DMG_MUL === 'number' ? MONSTER_DMG_MUL : 1.20) *
    (typeof getMidLateWaveDmgMul === 'function' ? getMidLateWaveDmgMul(wave) : 1.0);
  if (player.magnetPulseT > 0) player.magnetPulseT = Math.max(0, player.magnetPulseT - dt);
  if (player.shieldHitT > 0) player.shieldHitT -= dt;
  if (player.chillSlowT > 0) player.chillSlowT = Math.max(0, player.chillSlowT - dt);
  if (sandGustT > 0) sandGustT = Math.max(0, sandGustT - dt);
  if (player.terrainHintT > 0) player.terrainHintT = Math.max(0, player.terrainHintT - dt);
  if (portalPairCd > 0) portalPairCd = Math.max(0, portalPairCd - dt);
  for (let i = banners.length - 1; i >= 0; i--) {
    banners[i].t -= dt;
    if (banners[i].t <= 0) banners.splice(i, 1);
  }
  for (let i = 0; i < terrains.length; i++) {
    if (terrains[i].pulse !== undefined) terrains[i].pulse += dt * 2.4;
  }
  for (let i = 0; i < portals.length; i++) {
    portals[i].pulse += dt * 3.0;
  }

  // 战场异形地形判定（按真实不规则轮廓精确判定岩浆灼烧、毒泥沼阻滞、寒冰滑行加速）
  let onLava = false, onSwamp = false, onIce = false;
  for (let i = 0; i < terrains.length; i++) {
    const tr = terrains[i];
    if (tr.kind === 'chasm') continue;
    if (isPointInTerrain(tr, player.x, player.y, player.r * 0.35)) {
      if (tr.kind === 'lava') onLava = true;
      else if (tr.kind === 'swamp') onSwamp = true;
      else if (tr.kind === 'ice_sheet') onIce = true;
    }
  }
  player.terrainSpdMul = onIce ? 1.28 : ((onSwamp && !player.noSlow) ? 0.78 : 1);
  if (player.terrainHintT <= 0) {
    if (onIce) {
      player.terrainHintT = 2.8;
      addText(player.x, player.y - 36, '🧊 寒冰疾滑 +28%移速!', '#72efdd', 15, 1.8);
    } else if (onSwamp && !player.noSlow) {
      player.terrainHintT = 2.8;
      addText(player.x, player.y - 36, '🧪 毒沼阻滞 -22%移速', '#a3e635', 15, 1.8);
    }
  }
  if (onLava && !player.noSlow) {
    player.lavaExposure = (player.lavaExposure || 0) + dt;
    if (player.lavaExposure >= 0.35) {
      player.lavaTick = (player.lavaTick || 0) - dt;
      if (player.lavaTick <= 0) {
        player.lavaTick = 0.70;
        addText(player.x, player.y - 38, '🌋 岩浆灼烫!', '#ff6b35', 16, 1.6);
        hurtPlayer(Math.max(2, Math.round((2.5 + wave * 0.45) * envDmgMul)));
        if (state !== 'wave') return;
      }
    }
  } else {
    player.lavaExposure = Math.max(0, (player.lavaExposure || 0) - dt * 2.2);
    player.lavaTick = 0;
  }

  // 双生虚空传送门 A ↔ B 折跃判定
  if (portals.length >= 2 && portalPairCd <= 0) {
    for (let idx = 0; idx < 2; idx++) {
      const p = portals[idx];
      const hitR = (p.r || 34) + player.r * 0.42;
      const dxP = player.x - p.x, dyP = player.y - p.y;
      if (dxP * dxP + dyP * dyP < hitR * hitR) {
        const dest = portals[idx === 0 ? 1 : 0];
        portalPairCd = 4.5;
        if (rings.length < 40) rings.push({ x: p.x, y: p.y, r: 68, color: p.color, t: 0.28, maxT: 0.28, fill: true });
        player.x = dest.x;
        player.y = dest.y;
        player.invuln = 0;
        cam.x += (dest.x - cam.x) * 0.68;
        cam.y += (dest.y - cam.y) * 0.68;
        clampCam();
        beep(720, 0.12, 'sine', 0.06);
        if (rings.length < 40) rings.push({ x: dest.x, y: dest.y, r: 115, color: dest.color, t: 0.32, maxT: 0.32, fill: true });
        addBurst(dest.x, dest.y, dest.color, 12, 180);
        const warpDmg = (16 + wave * 3) * getEffectiveDmgMul();
        for (let k = 0; k < enemies.length; k++) {
          const ce = enemies[k];
          if (!ce || ce.hp <= 0 || ce.primed) continue;
          if (Math.hypot(ce.x - dest.x, ce.y - dest.y) <= 115 + ce.r) {
            hurtEnemy(ce, warpDmg, false, Math.atan2(ce.y - dest.y, ce.x - dest.x), true, { noProc: true, knockMult: 1.8 });
          }
        }
        addText(player.x, player.y - 42, '🌀 虚空跃迁！震退周身', '#e0aaff', 18, 2.0);
        announce(`🌀 虚空传送门 ${p.label} → ${dest.label} 跃迁成功！（充能冷却 4.5s）`, '#e0aaff', 2.8);
        break;
      }
    }
  }

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
    if (tr._flashCd > 0) tr._flashCd -= dt;
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
          addText(player.x, player.y - 26, `+${h} 🍄`, '#5ef29b', 13, 0.62, false);
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
        spawnHazard(mx, my, 82, (8 + wave * 1.1) * diff.dmgMul * envDmgMul, 1.35, { enemyDmg: (38 + wave * 7) * diff.hpMul, dropMat: 4, color: '#80ff72' });
        addText(mx, my - 30, '☄️ 晶簇陨落!', '#80ff72', 15, 2.0);
        announce('☄️ 辉晶陨石即将坠落！可重创灰塔傀儡并迸裂封魂晶石', '#80ff72', 2.8);
      } else if (activeSceneEvent === 'sandstorm') {
        sceneEventT = 8.0;
        sandGustT = 3.2;
        addText(player.x, player.y - 42, '🌪️ 苍岚顺风：移速+14% · 敌弹减速!', '#f4a261', 15, 2.1);
        announce('🌪️ 环境异象【苍岚顺风】：移速+14%，敌方弹幕减速 22%', '#f4a261', 3.0);
        if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: 95, color: '#f4a261', t: 0.35, maxT: 0.35 });
      } else if (activeSceneEvent === 'blizzard') {
        sceneEventT = 8.2;
        for (const e of enemies) {
          if (e && e.hp > 0) e.chillT = Math.max(e.chillT || 0, 2.5);
        }
        if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: 260, color: '#72efdd', t: 0.4, maxT: 0.4 });
        addText(player.x, player.y - 42, '❄️ 极寒霜潮：全场傀儡冻结减速!', '#72efdd', 15, 2.1);
        announce('❄️ 环境异象【极寒霜潮】：全场守塔傀儡集体冻结减速 2.5s！', '#72efdd', 3.0);
      } else if (activeSceneEvent === 'geysers') {
        sceneEventT = 6.8;
        for (let g = 0; g < 2; g++) {
          const gx = Math.max(110, Math.min(WORLD.w - 110, player.x + (Math.random() - 0.5) * 380));
          const gy = Math.max(110, Math.min(WORLD.h - 110, player.y + (Math.random() - 0.5) * 380));
          spawnHazard(gx, gy, 74, (9 + wave * 1.2) * diff.dmgMul * envDmgMul, 1.30, { enemyDmg: (45 + wave * 8) * diff.hpMul, color: '#ff6b35' });
        }
        announce('🔥 环境异象【熔炉余烬】：地面熔火柱即将喷涌（可重创敌群）', '#ff6b35', 2.8);
      } else if (activeSceneEvent === 'spore_tide') {
        sceneEventT = 8.5;
        if (sporeZones.length < 2) {
          const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 140;
          const sx = Math.max(110, Math.min(WORLD.w - 110, player.x + Math.cos(ang) * dist));
          const sy = Math.max(110, Math.min(WORLD.h - 110, player.y + Math.sin(ang) * dist));
          sporeZones.push({ x: sx, y: sy, r: 86, t: 6.5, maxT: 6.5, pulse: 0, healAcc: 0 });
          if (rings.length < 40) rings.push({ x: sx, y: sy, r: 92, color: '#5ef29b', t: 0.35, maxT: 0.35 });
          addText(sx, sy - 24, '🍄 治愈灵泉生成!', '#5ef29b', 15, 2.2);
          announce('🍄 环境异象【治愈灵泉】：站入翠绿孢子法阵可持续回血！', '#5ef29b', 3.2);
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
        addText(player.x, player.y - 54, '💀 超时死斗！首领全面狂暴！', '#ff3b6b', 22, 2.6);
        announce('💀 超时死斗开启！击败首领方可过关，小心天降熔星轰炸！', '#ff3b6b', 4.0);
      }
      overtimeMeteorT -= dt;
      if (overtimeMeteorT <= 0) {
        overtimeMeteorT = 1.75;
        spawnHazard(player.x + (Math.random() - 0.5) * 150, player.y + (Math.random() - 0.5) * 150, 78, 12 * diff.dmgMul * envDmgMul, 1.12);
      }
    } else {
      finishWave();
      return;
    }
  }

  // 能量护盾自动回充（7秒未受击恢复 50% 护盾，不朽神盾核缩短冷却）
  if (player.maxShield > 0 && player.shield < player.maxShield) {
    player.shieldRegenT -= dt;
    if (player.shieldRegenT <= 0) {
      player.shield = Math.min(player.maxShield, player.shield + Math.ceil(player.maxShield * 0.5));
      player.shieldRegenT = player.fastShield ? 3.2 : 5.0;
      if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: 34, color: '#4cc9f0', t: 0.22, maxT: 0.22 });
      addText(player.x, player.y - 28, '+护盾', '#72efdd', 13, 0.65, false);
      if (player.shieldPulseNova && typeof triggerShieldPulse === 'function') triggerShieldPulse();
    }
  }

  // 特斯拉线圈自动电弧攻击（享受攻击范围加成）
  const totalRange = getTotalRangeBonus();
  if (player.teslaCount > 0 && enemies.length > 0) {
    player.teslaCd -= dt;
    if (player.teslaCd <= 0) {
      player.teslaCd = Math.max(0.45, 1.7 / (1 + (player.teslaCount - 1) * 0.55));
      const maxTD = Math.max(120, 240 + Math.round(totalRange * 0.5));
      let near = null, nearDSq = maxTD * maxTD;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e || e.hp <= 0 || e.primed) continue;
        const dxT = e.x - player.x, dyT = e.y - player.y;
        const dSq = dxT * dxT + dyT * dyT;
        if (dSq < nearDSq) { nearDSq = dSq; near = e; }
      }
      if (near) {
        beep(680, 0.045, 'sine', 0.03);
        const tdmg = (12 + wave * 2.2) * getEffectiveDmgMul() * getElemMul();
        castChainLightning(player.x, player.y - 12, near, 2 + player.teslaCount, tdmg, getEffectiveCrit());
      }
    }
  }

  // 多样化灰塔残响按层数与难度平滑递进刷出（首领决战层大幅降低杂兵干扰，突出首领弹幕与身法博弈清晰度）
  spawnAcc -= dt;
  const onBossWave = (wave >= 4 && wave % 4 === 0);
  const hordeBoost = hordeWave ? (wave <= 4 ? 1.14 : 1.20) : 1;
  // 前期（第 1~6 层）刷怪总量与同屏上限平滑下调 20%，第 7 层起恢复满额压迫感
  const earlySpawnMul = wave <= 4 ? 0.80 : (wave === 5 ? 0.87 : (wave === 6 ? 0.94 : 1.0));
  const maxActiveEnemies = isTouch
    ? (onBossWave ? 24 : Math.min(64, Math.round((28 + wave * 2.8) * earlySpawnMul)))
    : (onBossWave ? 30 : Math.min(80, Math.round((34 + wave * 3.2) * earlySpawnMul)));
  if (!overtime && spawnAcc <= 0 && waveTime > 1.5 && (enemies.length + spawns.length) < maxActiveEnemies) {
    const baseCount = onBossWave ? 2.0 : (2.45 + Math.min(wave, 6) * 0.28 + Math.max(0, Math.min(16, wave) - 6) * 0.24);
    const exactCnt = baseCount * (onBossWave ? 1.0 : earlySpawnMul) * diff.spawnMul * hordeBoost;
    const rawCnt = Math.max(1, Math.floor(exactCnt) + (Math.random() < (exactCnt - Math.floor(exactCnt)) ? 1 : 0));
    const room = Math.max(1, maxActiveEnemies - (enemies.length + spawns.length));
    const count = Math.min(rawCnt, room);
    const early = selectedDiff >= 3 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 245 + Math.random() * 330;
      const x = Math.max(60, Math.min(WORLD.w - 60, player.x + Math.cos(ang) * dist));
      const y = Math.max(60, Math.min(WORLD.h - 60, player.y + Math.sin(ang) * dist));
      const type = pickWaveEnemyType(wave + early);
      spawnWarning(x, y, type);
    }
    spawnAcc = Math.max(onBossWave ? 0.58 : 0.48, (1.08 - Math.min(wave, 10) * 0.048) / Math.pow(diff.spawnMul * hordeBoost, 0.48));
  }

  // 地面红圈/外环环形/元素预警轰炸倒计时引爆
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.t -= dt;
    if (h.t <= 0) {
      triggerExplosion(h.x, h.y, h.r, h.enemyDmg || 0, true, h.dmg, h.color || '#ff3b6b', !h.innerSafeR, h.innerSafeR || 0);
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

  // 玩家移动（v2.5.0 丝滑微惯性响应 + 青焰瞬步极速斩弹位移 + 镜头前瞻平滑跟随）
  let kdx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  let kdy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
  let dx = kdx, dy = kdy, moveScale = 1;
  if (!dx && !dy && joy.active && joy.mag > 0) {
    dx = joy.dx; dy = joy.dy; moveScale = joy.mag;
  }
  const prevPx = player.x, prevPy = player.y;
  if ((player.dashT || 0) > 0) {
    player.dashT = Math.max(0, player.dashT - dt);
    player.moving = true;
    player.x += (player.dashVx || 0) * dt;
    player.y += (player.dashVy || 0) * dt;
    pushOutOfChasms(player);
    player.x = Math.max(player.r + 8, Math.min(WORLD.w - player.r - 8, player.x));
    player.y = Math.max(player.r + 8, Math.min(WORLD.h - player.r - 8, player.y));
    player.vx = (player.dashVx || 0) * 0.36;
    player.vy = (player.dashVy || 0) * 0.36;
    player._leanA = ((player.dashVx || 0) >= 0 ? 1 : -1) * 0.15;
    player.walkT += dt * 22;
    // 瞬步残影穿梭时自动斩碎擦身敌弹，提升极限穿弹爽感
    for (let bi = eBullets.length - 1; bi >= 0; bi--) {
      const eb = eBullets[bi];
      const bdx = eb.x - player.x, bdy = eb.y - player.y;
      if (bdx * bdx + bdy * bdy <= 44 * 44) {
        addSparks(eb.x, eb.y, Math.atan2(player.dashVy || 0, player.dashVx || 1), '#72efdd', 2);
        eBullets.splice(bi, 1);
      }
    }
    if (Math.random() < 0.75) {
      pushParticle({
        x: player.x + (Math.random() - 0.5) * 14,
        y: player.y + (Math.random() - 0.5) * 14,
        vx: -(player.dashVx || 0) * 0.12, vy: -(player.dashVy || 0) * 0.12,
        r: 3.8, color: '#72efdd', t: 0.20, maxT: 0.20
      });
    }
  } else {
    player.moving = !!(dx || dy);
    let tvx = 0, tvy = 0;
    if (player.moving) {
      if (Math.abs(dx) > 0.08) player.faceDir = dx > 0 ? 1 : -1;
      const len = Math.hypot(dx, dy) || 1;
      const chillMul = (player.chillSlowT > 0 && !player.noSlow) ? 0.85 : 1;
      const envSpdMul = (sandGustT > 0 ? 1.14 : 1) * chillMul * (player.terrainSpdMul || 1);
      const effSpd = Math.max(player.noSlow ? 1.0 : 0.72, getEffectiveSpdMul() * envSpdMul);
      const v = player.spd * effSpd * moveScale;
      tvx = (dx / len) * v;
      tvy = (dy / len) * v;
      player.walkT += dt * 13.5 * moveScale;
      player.dustT -= dt;
      if (player.dustT <= 0) {
        player.dustT = 0.1;
        pushParticle({ x: player.x + (Math.random() - 0.5) * 12, y: player.y + 18, vx: -(dx / len) * 25, vy: -10 - Math.random() * 14, r: 3.5 + Math.random() * 2.5, color: 'rgba(190,180,205,0.38)', t: 0.25, maxT: 0.25 });
      }
    }
    const accelRate = player.moving ? 26 : 32;
    const blend = Math.min(1, accelRate * dt);
    player.vx = (player.vx || 0) + (tvx - (player.vx || 0)) * blend;
    player.vy = (player.vy || 0) + (tvy - (player.vy || 0)) * blend;
    if (player.vx * player.vx + player.vy * player.vy > 4) {
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      pushOutOfChasms(player);
      player.x = Math.max(player.r + 8, Math.min(WORLD.w - player.r - 8, player.x));
      player.y = Math.max(player.r + 8, Math.min(WORLD.h - player.r - 8, player.y));
    } else {
      player.vx = 0;
      player.vy = 0;
      if (terrains.length > 0) pushOutOfChasms(player);
    }
    const targetLean = Math.max(-0.11, Math.min(0.11, (player.vx / Math.max(160, player.spd)) * 0.085));
    player._leanA = (player._leanA || 0) + (targetLean - (player._leanA || 0)) * Math.min(1, dt * 16);
  }
  const movedStep = Math.hypot(player.x - prevPx, player.y - prevPy);
  if (player.strideQuake && movedStep > 0.1) {
    player._strideDist = (player._strideDist || 0) + movedStep;
    if (player._strideDist >= 175) {
      player._strideDist -= 175;
      const qRad = 128 * getBlastScale();
      const qDmg = (20 + Math.max(0, getTotalArmor()) * 3.8 + player.maxHp * 0.35) * getEffectiveDmgMul();
      if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: qRad, color: '#fbbf24', t: 0.24, maxT: 0.24, fill: true });
      pushStain({ x: player.x, y: player.y, r: 24, color: '#14101c', kind: 'scorch' });
      beep(145, 0.06, 'triangle', 0.04);
      for (let qi = enemies.length - 1; qi >= 0; qi--) {
        const qe = enemies[qi];
        if (!qe || qe.hp <= 0 || qe.primed) continue;
        const qdx = qe.x - player.x, qdy = qe.y - player.y, qlim = qRad + qe.r;
        if (qdx * qdx + qdy * qdy <= qlim * qlim) {
          hurtEnemy(qe, qDmg, false, Math.atan2(qdy, qdx), true, { isMelee: true, knockMult: 1.4, noProc: true });
        }
      }
    }
  }
  const moveInvLen = (dx || dy) ? 1 / (Math.hypot(dx, dy) || 1) : 0;
  const targetCamX = player.x + (dx ? dx * moveInvLen * 36 : (player.vx || 0) * 0.08);
  const targetCamY = player.y + (dy ? dy * moveInvLen * 28 : (player.vy || 0) * 0.06);
  cam.x += (targetCamX - cam.x) * Math.min(1, dt * 9.2);
  cam.y += (targetCamY - cam.y) * Math.min(1, dt * 9.2);
  clampCam();

  player.invuln = 0;
  if (player.hurtFlashT > 0) player.hurtFlashT -= dt;
  if (player.regen > 0 && player.hp > 0 && player.hp < player.maxHp) {
    player.regenAcc += player.regen * dt;
    if (player.regenAcc >= 1) {
      const heal = Math.floor(player.regenAcc);
      player.regenAcc -= heal;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      addText(player.x, player.y - 26, '+' + heal, '#6ede8a', 14, 0.58, false);
    }
  }

  let nearestE = null, nearestDSq = 9999 * 9999;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e || e.hp <= 0) continue;
    const dxN = e.x - player.x, dyN = e.y - player.y;
    const dSq = dxN * dxN + dyN * dyN;
    if (dSq < nearestDSq) { nearestDSq = dSq; nearestE = e; }
  }
  if (nearestE) player.lookA = Math.atan2(nearestE.y - player.y, nearestE.x - player.x);

  // 32 把武器自动索敌、攻击范围加成与全流派差异化攻击表现（全面复用缓存，零临时数组分配）
  const setB = getSetBonuses();
  const stickCount = setB.sticks || 0;
  const effDmg = getEffectiveDmgMul(), effAspd = getEffectiveAtkSpd(), baseCrit = getEffectiveCrit(), elemMul = getElemMul(), techMul = getTechMul();
  const nW = player.weapons.length;
  let maxEquipRange = player.cls === 'bull' ? Math.round(165 * getBlastScale()) : 0;

  // 工程流自动布设感应地雷（螺丝刀武器 + 感应地雷匣 + 欧米茄机械母巢 + 5阶子母星雷针双生布雷）
  const totalMineLayers = (setB.screwdrivers || 0) + (player.mineLayers || 0);
  if (totalMineLayers > 0 && mines.length < 18) {
    player.mineCd = (player.mineCd === undefined ? 1.2 : player.mineCd) - dt;
    if (player.mineCd <= 0) {
      player.mineCd = Math.max(0.42, 2.30 / (1 + (totalMineLayers - 1) * 0.50) / Math.sqrt(techMul));
      let maxMineTier = setB.maxMineTier || 1;
      if ((player.mineLayers || 0) >= 2 && maxMineTier < 3) maxMineTier = 3;
      const layCount = (setB.doubleMines || 0) > 0 ? 2 : 1;
      for (let lk = 0; lk < layCount && mines.length < 18; lk++) {
        const ma = Math.random() * Math.PI * 2, md = 28 + Math.random() * 62;
        const dummy = {
          x: Math.max(68, Math.min(WORLD.w - 68, player.x + Math.cos(ma) * md)),
          y: Math.max(68, Math.min(WORLD.h - 68, player.y + Math.sin(ma) * md)),
          r: 15
        };
        pushOutOfChasms(dummy);
        mines.push({
          x: dummy.x, y: dummy.y, r: 15, triggerR: 56,
          blastR: (86 + (maxMineTier - 1) * 14) * getBlastScale(),
          dmg: (21 + wave * 3.8) * (1 + (maxMineTier - 1) * 0.48) * effDmg * techMul,
          armT: 0.24, pulse: Math.random() * 6.28, life: 22
        });
      }
      beep(540, 0.03, 'triangle', 0.02);
    }
  }
  for (let mIdx = mines.length - 1; mIdx >= 0; mIdx--) {
    const m = mines[mIdx];
    m.pulse += dt * 4.8;
    m.life -= dt;
    if (m.armT > 0) m.armT -= dt;
    if (m.life <= 0) { mines.splice(mIdx, 1); continue; }
    if (m.armT <= 0) {
      let triggered = false;
      for (let eIdx = 0; eIdx < enemies.length; eIdx++) {
        const e = enemies[eIdx];
        if (!e || e.hp <= 0 || e.primed) continue;
        const dxM = e.x - m.x, dyM = e.y - m.y, lim = m.triggerR + e.r;
        if (dxM * dxM + dyM * dyM <= lim * lim) {
          triggered = true; break;
        }
      }
      if (triggered) {
        const mCrit = player.turretCrit && Math.random() < baseCrit * 0.85;
        const mDmg = m.dmg * (mCrit ? getEffectiveCritMult(1.85) : 1);
        mines.splice(mIdx, 1);
        triggerExplosion(m.x, m.y, m.blastR, mDmg, false, 0, '#4cc9f0', true);
      }
    }
  }

  const nowOrbitBase = performance.now() * 0.0009;
  for (let idx = 0; idx < nW; idx++) {
    const w = player.weapons[idx];
    const tpl = w && WEAPONS[w.id];
    if (!tpl) continue;
    const orbitR = nW > 6 ? 44 : 38;
    const orbitA = (idx / Math.max(1, nW)) * Math.PI * 2 + nowOrbitBase;
    const baseWx = player.x + Math.cos(orbitA) * orbitR;
    const baseWy = player.y + Math.sin(orbitA) * (orbitR * 0.9);
    const evo = typeof getWeaponEvo === 'function' ? getWeaponEvo(w) : null;
    const rangeAdd = tpl.melee ? Math.round(totalRange * 0.78 + (player.meleeSweepBonus || 0) * 18) : totalRange;
    const maxR = Math.max(tpl.melee ? 74 : 54, tpl.range + rangeAdd + (evo ? (evo.rangeAdd || 0) : 0) + (w.tier - 1) * (tpl.melee ? 16 : 13));
    if (maxR > maxEquipRange) maxEquipRange = maxR;

    let best = null, bestD = maxR, bestIsTree = false;
    for (let ei = 0; ei < enemies.length; ei++) {
      const e = enemies[ei];
      if (!e || e.hp <= 0 || e.primed) continue;
      const dxE = e.x - baseWx, lim = bestD + e.r;
      if (dxE >= lim || dxE <= -lim) continue;
      const dyE = e.y - baseWy;
      if (dyE >= lim || dyE <= -lim) continue;
      const dSq = dxE * dxE + dyE * dyE;
      if (dSq >= lim * lim) continue;
      const d = Math.sqrt(dSq) - e.r;
      if (d < bestD) { bestD = d; best = e; bestIsTree = false; }
    }
    // 射程内无怪物时，武器也会智能索敌砍伐附近的异星晶树！
    if (!best && trees.length > 0) {
      for (let ti = 0; ti < trees.length; ti++) {
        const tr = trees[ti];
        if (!tr || tr.hp <= 0) continue;
        const dxT = tr.x - baseWx, dyT = tr.y - baseWy, limT = bestD + tr.r;
        const dSqT = dxT * dxT + dyT * dyT;
        if (dSqT >= limT * limT) continue;
        const d = Math.sqrt(dSqT) - tr.r;
        if (d < bestD) { bestD = d; best = tr; bestIsTree = true; }
      }
    }
    if (best) w.angle = Math.atan2(best.y - baseWy, best.x - baseWx);
    else w.angle = player.faceDir > 0 ? 0 : Math.PI;

    w.cd -= dt;
    if (w.thrust > 0) w.thrust = Math.max(0, w.thrust - dt * (w.id === 'spear' ? 4.8 : 5.8));
    if (w.recoil > 0) w.recoil = Math.max(0, w.recoil - dt * 8);

    if (best && w.cd <= 0) {
      const tierScale = (1 + (w.tier - 1) * 0.55) * (w.tier >= 5 ? 1.18 : 1);
      const aspdBonusDmg = tpl.aspdScale ? Math.max(0, effAspd - 1) * 9 : 0;
      const rangeBonusDmg = tpl.rangeScale ? Math.max(0, totalRange) * tpl.rangeScale : 0;
      const hpBonusDmg = tpl.hpScale ? Math.max(0, player.maxHp) * tpl.hpScale : 0;
      const armBonusDmg = tpl.armorScale ? Math.max(0, getTotalArmor()) * tpl.armorScale : 0;
      const base = ((tpl.dmg + aspdBonusDmg + rangeBonusDmg + hpBonusDmg + armBonusDmg) * tierScale + (w.id === 'stick' ? Math.max(0, stickCount - 1) * 3.5 : 0)) * (evo && evo.dmgMul ? evo.dmgMul : 1);
      const archetypeScale = tpl.set === 'elemental' ? elemMul : (tpl.techScale ? (1 + (techMul - 1) * (typeof tpl.techScale === 'number' ? tpl.techScale : 1)) : 1);
      const finalMul = (effDmg + (tpl.melee ? player.meleeBonus : (player.rangedBonus || 0))) * archetypeScale;
      const critChance = baseCrit + (tpl.critBonus || 0) + (w.tier - 1) * 0.03 + (evo && evo.critAdd ? evo.critAdd : 0);
      const critMult = getEffectiveCritMult((tpl.critMult || 1.95) + (evo && evo.critMultAdd ? evo.critMultAdd : 0));
      const evoCdMul = (evo && evo.cdMul) ? evo.cdMul : 1;
      w.cd = (tpl.cd * evoCdMul) / Math.max(0.18, effAspd * (1 + (w.tier - 1) * 0.08));
      player._atkPoseT = Math.max(player._atkPoseT || 0, tpl.melee ? 0.21 : 0.14);
      player._atkAimX = Math.cos(w.angle);
      player._atkAngle = w.angle;

      if (tpl.melee) {
        w.thrust = 1;
        beep(w.id === 'hammer' || w.id === 'rock' || w.id === 'spiked_shield' ? 130 : (w.id === 'katana' || w.id === 'magma_blade' ? 330 : (w.id === 'knife' || w.id === 'claws' ? 295 : 195)), 0.055, 'triangle', 0.045);
        const sColor = (evo && evo.color) ? evo.color : (TIER_COLORS[w.tier] === '#e2deec' ? tpl.arcColor : TIER_COLORS[w.tier]);
        const evoBurn = !!(tpl.burnSlash || (evo && evo.forceBurn));
        const evoFreezeChance = (evo && evo.forceFreeze) ? evo.forceFreeze : 0;
        const evoChains = (evo && evo.chainOnHit) ? evo.chainOnHit : 0;

        if (tpl.mode === 'spear') {
          // 长矛 / 5阶沧溟三叉戟 / 冈格尼尔超距雷霆枪
          const prongs = (evo && evo.tridentThrust) ? [-0.22, 0, 0.22] : [0];
          const hitEnemies = prongs.length > 1 ? new Set() : null;
          let chainFired = false;
          for (let pi = 0; pi < prongs.length; pi++) {
            const pAng = w.angle + prongs[pi];
            const ex = baseWx + Math.cos(pAng) * maxR, ey = baseWy + Math.sin(pAng) * maxR;
            if (slashes.length < 40) slashes.push({ x: baseWx, y: baseWy, angle: pAng, r: maxR, color: sColor, mode: 'spear', t: 0.16, maxT: 0.16 });
            const l2 = maxR * maxR;
            for (let i = enemies.length - 1; i >= 0; i--) {
              const e = enemies[i];
              if (e.hp <= 0 || (hitEnemies && hitEnemies.has(e))) continue;
              const proj = Math.max(0, Math.min(1, ((e.x - baseWx) * (ex - baseWx) + (e.y - baseWy) * (ey - baseWy)) / l2));
              const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
              if (Math.hypot(e.x - px, e.y - py) <= e.r + 22) {
                if (hitEnemies) hitEnemies.add(e);
                const isCrit = Math.random() < critChance;
                hurtEnemy(e, base * finalMul * (isCrit ? critMult : 1), isCrit, pAng, evoBurn, {
                  isMelee: true,
                  forceBurn: evoBurn,
                  forceFreeze: evoFreezeChance > 0 && Math.random() < evoFreezeChance
                });
                if (evoChains > 0 && !chainFired && e.hp > 0) {
                  chainFired = true;
                  castChainLightning(e.x, e.y, e, evoChains, base * finalMul * 0.62, critChance * 0.6);
                }
              }
            }
            for (let i = trees.length - 1; i >= 0; i--) {
              const tr = trees[i];
              if (tr.hp <= 0) continue;
              const proj = Math.max(0, Math.min(1, ((tr.x - baseWx) * (ex - baseWx) + (tr.y - baseWy) * (ey - baseWy)) / l2));
              const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
              if (Math.hypot(tr.x - px, tr.y - py) <= tr.r + 20) hurtTree(tr, base * finalMul);
            }
          }
          for (let bi = eBullets.length - 1; bi >= 0; bi--) {
            const eb = eBullets[bi];
            const ex0 = baseWx + Math.cos(w.angle) * maxR, ey0 = baseWy + Math.sin(w.angle) * maxR;
            const proj = Math.max(0, Math.min(1, ((eb.x - baseWx) * (ex0 - baseWx) + (eb.y - baseWy) * (ey0 - baseWy)) / (maxR * maxR)));
            const px = baseWx + proj * (ex0 - baseWx), py = baseWy + proj * (ey0 - baseWy);
            if (Math.hypot(eb.x - px, eb.y - py) <= (eb.r || 5) + (prongs.length > 1 ? 34 : 18)) {
              addSparks(eb.x, eb.y, w.angle, '#ffd166', 2);
              eBullets.splice(bi, 1);
              if (prongs.length === 1) break;
            }
          }
        } else {
          // 刀剑横扫 / 利爪撕裂 / 居合太刀 / 巨石钝击 / 裂地战锤 / 尖刺重盾 / 熔岩重刃 + 5阶神话进化
          const arcSpan = (tpl.mode === 'crescent' ? 1.18 : 0.90) + (player.meleeSweepBonus || 0) * 0.16 + (evo ? 0.14 : 0);
          if (slashes.length < 40) {
            slashes.push({
              x: baseWx + Math.cos(w.angle) * 24, y: baseWy + Math.sin(w.angle) * 24,
              angle: w.angle, r: maxR * (tpl.mode === 'crescent' ? 0.88 : 0.78), color: evo ? sColor : (tpl.burnSlash ? '#ff6b35' : sColor),
              mode: tpl.mode || 'arc', t: 0.16, maxT: 0.16
            });
          }
          let slicedCnt = 0;
          const sliceCap = evo ? 4 : 2;
          const sliceLimSq = Math.min(140, maxR * 0.80) * Math.min(140, maxR * 0.80);
          for (let bi = eBullets.length - 1; bi >= 0 && slicedCnt < sliceCap; bi--) {
            const eb = eBullets[bi];
            const dxB = eb.x - baseWx, dyB = eb.y - baseWy;
            if (dxB * dxB + dyB * dyB > sliceLimSq) continue;
            let daB = Math.abs(Math.atan2(dyB, dxB) - w.angle) % (Math.PI * 2);
            if (daB > Math.PI) daB = Math.PI * 2 - daB;
            if (daB < arcSpan) {
              addSparks(eb.x, eb.y, w.angle, '#ffd166', 2);
              eBullets.splice(bi, 1);
              slicedCnt++;
            }
          }
          let critChainTriggered = false;
          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (!e || e.hp <= 0) continue;
            const dxE = e.x - baseWx, dyE = e.y - baseWy, limE = maxR + e.r;
            if (dxE * dxE + dyE * dyE > limE * limE) continue;
            let da = Math.abs(Math.atan2(dyE, dxE) - w.angle) % (Math.PI * 2);
            if (da > Math.PI) da = Math.PI * 2 - da;
            if (da < arcSpan) {
              const isCrit = Math.random() < critChance;
              hurtEnemy(e, base * finalMul * (isCrit ? critMult : 1), isCrit, w.angle, evoBurn, {
                isMelee: true,
                knockMult: tpl.knockMult || 1,
                forceBurn: evoBurn,
                forceFreeze: evoFreezeChance > 0 && Math.random() < evoFreezeChance
              });
              const wantChains = evoChains > 0 ? evoChains : ((tpl.burnSlash && (isCrit || Math.random() < 0.35)) ? 3 : 0);
              if (wantChains > 0 && !critChainTriggered && e.hp > 0) {
                critChainTriggered = true;
                castChainLightning(e.x, e.y, e, wantChains, base * finalMul * 0.60, critChance * 0.55);
              }
            }
          }
          for (let i = trees.length - 1; i >= 0; i--) {
            const tr = trees[i];
            if (!tr || tr.hp <= 0) continue;
            const dxT = tr.x - baseWx, dyT = tr.y - baseWy, limT = maxR + tr.r;
            if (dxT * dxT + dyT * dyT > limT * limT) continue;
            let da = Math.abs(Math.atan2(dyT, dxT) - w.angle) % (Math.PI * 2);
            if (da > Math.PI) da = Math.PI * 2 - da;
            if (da < arcSpan) hurtTree(tr, base * finalMul);
          }
          if (tpl.slam || (evo && evo.slam)) {
            const hx = baseWx + Math.cos(w.angle) * (maxR * 0.68), hy = baseWy + Math.sin(w.angle) * (maxR * 0.68);
            const sr = 68 * ((evo && evo.slamScale) ? evo.slamScale : 1) * getBlastScale();
            const slamCol = (evo && evo.color) ? evo.color : (w.id === 'spiked_shield' ? '#94a3b8' : '#f4a261');
            if (rings.length < 42) rings.push({ x: hx, y: hy, r: sr, color: slamCol, t: 0.24, maxT: 0.24, fill: !!(evo && evo.slamScale >= 1.3) });
            pushStain({ x: hx, y: hy, r: 24, color: '#14101c', kind: 'scorch' });
            for (let i = enemies.length - 1; i >= 0; i--) {
              const e = enemies[i];
              if (!e || e.hp <= 0) continue;
              const dxS = e.x - hx, dyS = e.y - hy, limS = sr + e.r;
              if (dxS * dxS + dyS * dyS <= limS * limS) {
                hurtEnemy(e, base * finalMul * (evo && evo.slam ? 0.65 : 0.52), false, Math.atan2(dyS, dxS), true, {
                  isMelee: true,
                  knockMult: 1.5,
                  forceBurn: evoBurn,
                  forceFreeze: evoFreezeChance > 0 && Math.random() < evoFreezeChance,
                  noProc: !evo
                });
              }
            }
          }
        }
        // 近战剑气波（【绯红九百九十九斩】遗物 或 5 阶兵装进化 waveCount 多道扇形月轮剑波！）
        const evoWaves = (evo && evo.waveCount) ? evo.waveCount : 0;
        const totalWaves = evoWaves > 0 ? evoWaves : (player.meleeShockwave ? 1 : 0);
        if (totalWaves > 0 && bullets.length < (isTouch ? 180 : 260)) {
          const wSpd = 565;
          const waveCol = (evo && evo.color) ? evo.color : '#ffd166';
          for (let wk = 0; wk < totalWaves && bullets.length < (isTouch ? 180 : 260); wk++) {
            const wAng = w.angle + (totalWaves > 1 ? (wk - (totalWaves - 1) * 0.5) * 0.22 : 0);
            bullets.push({
              x: baseWx + Math.cos(wAng) * 20, y: baseWy + Math.sin(wAng) * 20,
              px: baseWx, py: baseWy,
              vx: Math.cos(wAng) * wSpd, vy: Math.sin(wAng) * wSpd,
              dmg: base * finalMul * (evoWaves > 0 ? 0.58 : 0.48), isCrit: false, angle: wAng,
              pierce: (evoWaves > 0 ? 3 : 2) + player.pierceBonus, bounces: 0, isWaveArc: true,
              isFlame: evoBurn,
              life: 0.46, maxLife: 0.46, color: waveCol, r: evoWaves > 0 ? 11 : 9.5, hit: null, lastHit: null
            });
          }
        }
      } else if (tpl.isChain) {
        // 电击枪：跳跃连锁闪电 + 5阶万雷天牢/超导雷暴星核
        w.recoil = 1;
        beep(640, 0.055, 'sawtooth', 0.036);
        const mx = baseWx + Math.cos(w.angle) * 16, my = baseWy + Math.sin(w.angle) * 16;
        if (bestIsTree) {
          lightnings.push({ pts: [{ x: mx, y: my }, { x: best.x, y: best.y }], color: (evo && evo.color) || '#72efdd', t: 0.14, maxT: 0.14 });
          hurtTree(best, base * finalMul);
        } else {
          const totalChains = tpl.chains + (w.tier >= 3 ? 1 : 0) + (w.tier >= 5 ? 1 : 0) + (evo && evo.chainsAdd ? evo.chainsAdd : 0);
          castChainLightning(mx, my, best, totalChains, base * finalMul, critChance);
          if (evo && evo.blastAdd) {
            triggerExplosion(best.x, best.y, evo.blastAdd * getBlastScale(), base * finalMul * 0.58, false, 0, evo.color || '#60a5fa', false);
            if (evo.forceFreeze && Math.random() < evo.forceFreeze && best.hp > 0) best.freezeT = Math.max(best.freezeT || 0, 1.35);
          }
        }
      } else if (tpl.isBeam || tpl.isSniper || tpl.isEmpBeam) {
        // 激光枪 / 狙击枪 / 电磁轨道炮 瞬发贯穿射线 + 5阶三棱镜多光束/耀斑核爆/时停磁轨
        w.recoil = 1;
        beep(tpl.isSniper ? 205 : (tpl.isEmpBeam ? 260 : 720), 0.075, 'sawtooth', tpl.isSniper || tpl.isEmpBeam ? 0.055 : 0.038);
        const beamCount = 1 + ((evo && evo.pelletsAdd) ? evo.pelletsAdd : 0);
        const beamCol = (evo && evo.color) ? evo.color : (tpl.isEmpBeam ? '#4cc9f0' : (tpl.isSniper ? '#ffe8a3' : TIER_COLORS[Math.max(2, w.tier)]));
        if (tpl.isSniper && shells.length < 60) {
          const sa = w.angle - Math.PI * 0.5;
          shells.push({ x: baseWx, y: baseWy, vx: Math.cos(sa) * 110, vy: Math.sin(sa) * 110 - 35, rot: 0, t: 0.5 });
        }
        const maxHits = (tpl.pierce || 3) + player.pierceBonus + ((evo && evo.pierceAdd) ? evo.pierceAdd : 0);
        const hitPad = (tpl.isEmpBeam ? 15 : 9) + (evo ? 3 : 0);
        for (let bIdx = 0; bIdx < beamCount; bIdx++) {
          const bAng = w.angle + (beamCount > 1 ? (bIdx - (beamCount - 1) * 0.5) * 0.16 : 0);
          const ex = baseWx + Math.cos(bAng) * maxR, ey = baseWy + Math.sin(bAng) * maxR;
          if (beams.length < 36) {
            beams.push({
              x1: baseWx + Math.cos(bAng) * 18, y1: baseWy + Math.sin(bAng) * 18, x2: ex, y2: ey,
              color: beamCol,
              thin: !!tpl.isSniper && !evo, t: tpl.isSniper || tpl.isEmpBeam ? 0.22 : 0.16, maxT: tpl.isSniper || tpl.isEmpBeam ? 0.22 : 0.16
            });
          }
          const l2 = maxR * maxR || 1;
          const cands = [];
          for (let ei = 0; ei < enemies.length; ei++) {
            const e = enemies[ei];
            if (!e || e.hp <= 0 || e.primed) continue;
            const proj = Math.max(0, Math.min(1, ((e.x - baseWx) * (ex - baseWx) + (e.y - baseWy) * (ey - baseWy)) / l2));
            const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
            const dxP = e.x - px, dyP = e.y - py, limP = e.r + hitPad;
            if (dxP * dxP + dyP * dyP <= limP * limP) cands.push({ e, proj });
          }
          cands.sort((a, b) => a.proj - b.proj);
          let lastHitE = null;
          for (let k = 0; k < Math.min(maxHits, cands.length); k++) {
            const isCrit = Math.random() < critChance;
            lastHitE = cands[k].e;
            hurtEnemy(lastHitE, base * finalMul * (isCrit ? critMult : 1), isCrit, bAng, !tpl.isSniper || !!evo, {
              knockMult: tpl.isSniper ? 1.8 : 1.2,
              forceBurn: !!(evo && evo.forceBurn),
              forceChill: !!tpl.isEmpBeam,
              forceFreeze: !!(evo && evo.forceFreeze && Math.random() < evo.forceFreeze)
            });
          }
          if (lastHitE && (tpl.isEmpBeam || (evo && (evo.blastAdd || evo.chainOnHit)))) {
            if (tpl.isEmpBeam) {
              const empR = (88 + (evo && evo.blastAdd ? evo.blastAdd * 0.45 : 0)) * getBlastScale();
              if (rings.length < 40) rings.push({ x: lastHitE.x, y: lastHitE.y, r: empR, color: beamCol, t: 0.26, maxT: 0.26 });
              for (let ei = 0; ei < enemies.length; ei++) {
                const nb = enemies[ei];
                if (!nb || nb.hp <= 0) continue;
                const dxN = nb.x - lastHitE.x, dyN = nb.y - lastHitE.y, limN = empR + nb.r;
                if (dxN * dxN + dyN * dyN <= limN * limN) {
                  nb.chillT = Math.max(nb.chillT || 0, 2.4);
                  if (evo && evo.forceFreeze && Math.random() < evo.forceFreeze * 0.7) nb.freezeT = Math.max(nb.freezeT || 0, 1.25);
                }
              }
            }
            if (evo && evo.blastAdd && bIdx === Math.floor(beamCount * 0.5)) {
              triggerExplosion(lastHitE.x, lastHitE.y, evo.blastAdd * getBlastScale(), base * finalMul * 0.62, false, 0, beamCol, !!(evo.forceBurn));
            }
            if (evo && evo.chainOnHit && bIdx === 0 && lastHitE.hp > 0) {
              castChainLightning(lastHitE.x, lastHitE.y, lastHitE, evo.chainOnHit, base * finalMul * 0.55, critChance * 0.5);
            }
          }
          for (let i = trees.length - 1; i >= 0; i--) {
            const tr = trees[i];
            if (tr.hp <= 0) continue;
            const proj = Math.max(0, Math.min(1, ((tr.x - baseWx) * (ex - baseWx) + (tr.y - baseWy) * (ey - baseWy)) / l2));
            const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
            const dxT = tr.x - px, dyT = tr.y - py, limT = tr.r + hitPad;
            if (dxT * dxT + dyT * dyT <= limT * limT) hurtTree(tr, base * finalMul);
          }
        }
      } else {
        // 投射物武器（含吹箭筒、左轮手枪、碎裂机炮、榴弹发射器、射钉枪、无人机舱 + 全5阶进化分支）
        w.recoil = tpl.isFlame ? 0.3 : (w.id === 'minigun' || w.id === 'nailgun' ? 0.55 : 1);
        w.shots = (w.shots || 0) + 1;
        const sixthShot = !!(tpl.sixthCrit && (w.shots % 6 === 0));
        if (sixthShot) addText(player.x, player.y - 32, '🎯 第六发必暴!', '#ffd166', 13, 0.72, false);
        const pellets = (tpl.pellets || 1) + ((evo && evo.pelletsAdd) ? evo.pelletsAdd : 0);
        if ((!tpl.isFlame && w.id !== 'minigun' && w.id !== 'nailgun') || Math.random() < 0.35) {
          beep(tpl.isRocket || tpl.isGrenade ? 145 : (tpl.isPlasma ? 310 : (tpl.isFlame ? 110 : (tpl.isStar || tpl.isIce || tpl.isDart ? 560 : (w.id === 'shotgun' ? 160 : 430)))), 0.04, tpl.isFlame ? 'sawtooth' : 'square', tpl.isFlame ? 0.018 : 0.03);
        }
        const mx = baseWx + Math.cos(w.angle) * 18, my = baseWy + Math.sin(w.angle) * 18;
        if (!tpl.isStar && !tpl.isFlame && !tpl.isPebble && !tpl.isIce && !tpl.isDart) {
          pushParticle({ x: mx, y: my, vx: 0, vy: 0, r: w.id === 'shotgun' || tpl.isRocket || tpl.isGrenade || tpl.isPlasma ? 12 : 8.5, color: (evo && evo.color) ? evo.color : (tpl.isPlasma ? '#c77dff' : (tpl.techScale ? '#72efdd' : '#ffd166')), t: 0.085, maxT: 0.085, muzzle: true, angle: w.angle });
        }
        if ((tpl.set === 'gun' || w.id === 'minigun' || w.id === 'revolver') && shells.length < 60 && (w.id !== 'minigun' || Math.random() < 0.45)) {
          const sa = w.angle - Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
          shells.push({ x: baseWx, y: baseWy, vx: Math.cos(sa) * 95, vy: Math.sin(sa) * 95 - 30, rot: Math.random() * 6, t: 0.45 });
        }
        for (let p = 0; p < pellets; p++) {
          if (bullets.length >= (isTouch ? 185 : 275)) break;
          let sp = 0;
          if (tpl.spread) {
            sp = (Math.random() - 0.5) * (tpl.spread + (pellets > (tpl.pellets || 1) ? 0.08 : 0));
          } else if (pellets > 1) {
            sp = (p - (pellets - 1) * 0.5) * 0.13;
          }
          const a = w.angle + sp;
          const isCrit = sixthShot || Math.random() < critChance;
          const bSpd = tpl.spd * (tpl.isFlame ? (0.85 + Math.random() * 0.3) : 1);
          const maxLife = maxR / bSpd + (tpl.isFlame ? 0.02 : 0.07);
          const extraCritPierce = ((w.id === 'crossbow' && isCrit) ? 2 : 0) + (sixthShot ? 2 : 0);
          const evoPierce = (evo && evo.pierceAdd) ? evo.pierceAdd : 0;
          const evoBounce = (evo && evo.bounceAdd) ? evo.bounceAdd : 0;
          const baseBlast = (tpl.blastR || 0) + ((evo && (tpl.blastR || tpl.isRocket || tpl.isGrenade || tpl.isPlasma)) ? (evo.blastAdd || 0) : 0);
          const evoImpactBlast = (evo && evo.blastAdd && !tpl.isRocket && !tpl.isGrenade && !tpl.isPlasma && !tpl.shredBlast) ? evo.blastAdd * getBlastScale() : 0;
          bullets.push({
            x: mx, y: my, px: mx, py: my,
            vx: Math.cos(a) * bSpd, vy: Math.sin(a) * bSpd,
            dmg: base * finalMul * (isCrit ? critMult : 1), isCrit, angle: a,
            pierce: (tpl.pierce || 0) + evoPierce + extraCritPierce + (tpl.isRocket || tpl.isGrenade ? 0 : player.pierceBonus),
            bounces: (tpl.bounce || 0) + evoBounce + (tpl.isRocket || tpl.isFlame || tpl.isPlasma ? 0 : player.bounceBonus) + (tpl.isStar && isCrit ? 1 : 0),
            isStar: !!tpl.isStar, isFlame: !!tpl.isFlame, isRocket: !!tpl.isRocket, isGrenade: !!tpl.isGrenade,
            isPebble: !!tpl.isPebble, isIce: !!tpl.isIce, isPlasma: !!tpl.isPlasma, isBolt: w.id === 'crossbow',
            isDart: !!tpl.isDart, isNail: !!tpl.isNail,
            shredBlast: tpl.shredBlast ? (evo ? 1.0 : tpl.shredBlast) : 0,
            evoBlastR: evoImpactBlast,
            evoChain: (evo && evo.chainOnHit) ? evo.chainOnHit : 0,
            forceEvoBurn: !!(evo && evo.forceBurn),
            freezeHit: Math.max(tpl.freezeHit || 0, (evo && evo.forceFreeze) ? evo.forceFreeze : 0),
            poisonHit: (evo && evo.forcePoison) ? 1.0 : (tpl.poisonHit || 0),
            blastR: baseBlast ? baseBlast * getBlastScale() : 0,
            spin: Math.random() * 6.28, smokeT: 0,
            life: maxLife, maxLife,
            color: (evo && evo.color) ? evo.color : (tpl.isFlame ? '#ff9f1c' : (tpl.isPlasma ? '#c77dff' : (tpl.isIce ? '#72efdd' : (tpl.isDart ? '#a3e635' : (tpl.isNail ? '#4cc9f0' : (tpl.isGrenade ? '#f97316' : (tpl.isPebble ? '#cbd5e1' : (tpl.isStar ? '#e0fbfc' : (isCrit ? '#ffd166' : '#fff3b0'))))))))),
            r: (tpl.isPlasma ? 8.5 : (tpl.isGrenade ? 6.8 : (tpl.isFlame ? 7 : (tpl.isRocket ? 6 : (tpl.isStar ? 6.5 : (tpl.isPebble ? 5.2 : (w.id === 'shotgun' ? 4.2 : 4.6))))))) * (evo ? 1.15 : 1),
            hit: null, lastHit: null
          });
        }
      }
    }
    const offset = w.thrust * (w.id === 'spear' ? 58 : 40) - w.recoil * 7;
    w.wx = baseWx + Math.cos(w.angle) * offset;
    w.wy = baseWy + Math.sin(w.angle) * offset;
  }
  player._displayRange = maxEquipRange > 0 ? maxEquipRange : Math.max(68, 104 + totalRange);

  // 自动机枪炮台与浮游激光塔索敌开火（享受工程套装、工程专精、超算芯片与攻击范围加成，射程同步 -20%、攻速同步 -30%）
  const turretMaxR = Math.max(148, 316 + Math.round(totalRange * 0.5));
  for (let ti = 0; ti < turrets.length; ti++) {
    const t = turrets[ti];
    t.cd -= dt;
    if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 8);
    let best = null, bestDSq = turretMaxR * turretMaxR;
    for (let ei = 0; ei < enemies.length; ei++) {
      const e = enemies[ei];
      if (!e || e.hp <= 0 || e.primed) continue;
      const dxE = e.x - t.x, dyE = e.y - t.y;
      const dSq = dxE * dxE + dyE * dyE;
      if (dSq < bestDSq) { bestDSq = dSq; best = e; }
    }
    if (best) {
      t.angle = Math.atan2(best.y - t.y, best.x - t.x);
      if (t.cd <= 0) {
        const isCrit = !!(player.turretCrit && Math.random() < baseCrit * 0.85);
        const cMul = isCrit ? getEffectiveCritMult(1.85) : 1;
        const overclockMul = (player.turretOverclockT || 0) > 0 ? 1.75 : 1;
        if (t.kind === 'laser') {
          t.cd = Math.max(0.18, 0.81 / (Math.sqrt(effAspd) * techMul * overclockMul)) / (1 + (t.tier - 1) * 0.14);
          t.recoil = 1;
          const ldmg = (14.5 + wave * 1.75) * (1 + (t.tier - 1) * 0.45) * effDmg * techMul * cMul;
          const ex = t.x + Math.cos(t.angle) * turretMaxR, ey = t.y + Math.sin(t.angle) * turretMaxR;
          if (beams.length < 30) {
            beams.push({ x1: t.x + Math.cos(t.angle) * 14, y1: t.y + Math.sin(t.angle) * 14, x2: ex, y2: ey, color: isCrit ? '#ffd166' : '#c77dff', thin: true, t: 0.14, maxT: 0.14 });
          }
          const l2 = turretMaxR * turretMaxR || 1;
          let hits = 0, maxH = 3 + (t.tier >= 3 ? 1 : 0);
          for (let ei = 0; ei < enemies.length; ei++) {
            const e = enemies[ei];
            if (!e || e.hp <= 0 || e.primed || hits >= maxH) continue;
            const proj = Math.max(0, Math.min(1, ((e.x - t.x) * (ex - t.x) + (e.y - t.y) * (ey - t.y)) / l2));
            const px = t.x + proj * (ex - t.x), py = t.y + proj * (ey - t.y);
            const dxP = e.x - px, dyP = e.y - py, limP = e.r + 9;
            if (dxP * dxP + dyP * dyP <= limP * limP) {
              hits++;
              hurtEnemy(e, ldmg, isCrit, t.angle, true, { noProc: !player.turretElem });
            }
          }
        } else if (bullets.length < (isTouch ? 180 : 260)) {
          t.cd = Math.max(0.12, 0.465 / (Math.sqrt(effAspd) * techMul * overclockMul)) / (1 + (t.tier - 1) * 0.15);
          t.recoil = 1;
          const tdmg = (9.5 + wave * 1.15) * (1 + (t.tier - 1) * 0.5) * effDmg * techMul * cMul;
          const bLife = turretMaxR / 690;
          bullets.push({
            x: t.x + Math.cos(t.angle) * 16, y: t.y + Math.sin(t.angle) * 16,
            px: t.x, py: t.y,
            vx: Math.cos(t.angle) * 690, vy: Math.sin(t.angle) * 690,
            dmg: tdmg, isCrit, angle: t.angle, pierce: (t.tier >= 2 ? 1 : 0) + (player.pierceBonus > 0 ? 1 : 0), bounces: 0,
            turretShot: true,
            life: bLife, maxLife: bLife, color: isCrit ? '#ffd166' : '#72efdd', r: 4.2, hit: null, lastHit: null
          });
        }
      }
    }
  }

  // 玩家投射物更新（支持火箭尾烟、榴弹弹跳爆破、电浆球脉冲爆、冰锥寒霜、吹箭剧毒、剑气波）
  let eEnvMinX = Infinity, eEnvMaxX = -Infinity, eEnvMinY = Infinity, eEnvMaxY = -Infinity;
  for (let ei = 0; ei < enemies.length; ei++) {
    const e = enemies[ei];
    if (!e || e.hp <= 0 || e.primed) continue;
    const er = e.r || 20;
    if (e.x - er < eEnvMinX) eEnvMinX = e.x - er;
    if (e.x + er > eEnvMaxX) eEnvMaxX = e.x + er;
    if (e.y - er < eEnvMinY) eEnvMinY = e.y - er;
    if (e.y + er > eEnvMaxY) eEnvMaxY = e.y + er;
  }
  const hasEnemyEnvelope = eEnvMinX <= eEnvMaxX;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.px = b.x; b.py = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.isStar || b.isGrenade) b.spin += dt * (b.isGrenade ? 14 : 22);
    if (b.isFlame) { b.vx *= (1 - dt * 1.6); b.vy *= (1 - dt * 1.6); b.r += dt * 20; }
    if (b.isRocket || b.isGrenade) {
      b.smokeT -= dt;
      if (b.smokeT <= 0) {
        b.smokeT = b.isGrenade ? 0.055 : 0.035;
        pushParticle({ x: b.x - Math.cos(b.angle) * 8, y: b.y - Math.sin(b.angle) * 8, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18, r: 3.2 + Math.random() * 2.2, color: 'rgba(205, 198, 218, 0.34)', t: 0.22, maxT: 0.22 });
      }
    }

    const outBounds = b.x < 0 || b.x > WORLD.w || b.y < 0 || b.y > WORLD.h;
    if (b.life <= 0 || outBounds) {
      if (b.isRocket || b.isGrenade) triggerExplosion(b.x, b.y, b.blastR || 76, b.dmg * (b.isGrenade ? 0.85 : elemMul), false, 0, '#ff9f1c', true);
      else if (b.isPlasma) triggerExplosion(b.x, b.y, b.blastR || 82, b.dmg * 0.85 * elemMul, false, 0, '#c77dff', false);
      bullets.splice(i, 1); continue;
    }

    // 子弹命中异星晶树
    for (let tIdx = trees.length - 1; tIdx >= 0; tIdx--) {
      const tr = trees[tIdx];
      if (!tr || tr.hp <= 0 || hasBulletHit(b, tr)) continue;
      const tdx = tr.x - b.x, tdy = tr.y - b.y, thit = tr.r + b.r;
      if (tdx * tdx + tdy * tdy < thit * thit) {
        markBulletHit(b, tr);
        hurtTree(tr, b.dmg);
        if (b.isRocket || (b.isGrenade && b.bounces <= 0)) {
          triggerExplosion(b.x, b.y, b.blastR || 76, b.dmg * (b.isGrenade ? 0.85 : elemMul), false, 0, '#ff9f1c', true);
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

    const br = b.r || 4;
    if (hasEnemyEnvelope && b.x + br >= eEnvMinX && b.x - br <= eEnvMaxX && b.y + br >= eEnvMinY && b.y - br <= eEnvMaxY) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e || e.hp <= 0 || e.primed) continue;
        const hitR = e.r + br;
        const bdx = e.x - b.x;
        if (bdx >= hitR || bdx <= -hitR) continue;
        const bdy = e.y - b.y;
        if (bdy >= hitR || bdy <= -hitR) continue;
        if (bdx * bdx + bdy * bdy < hitR * hitR && !hasBulletHit(b, e)) {
          markBulletHit(b, e);
          if (b.isRocket) {
            triggerExplosion(b.x, b.y, b.blastR, b.dmg * elemMul, false, 0, b.color || '#ff9f1c', true);
            if (b.evoChain > 0 && e.hp > 0) castChainLightning(b.x, b.y, e, b.evoChain, b.dmg * 0.55, 0.25);
            b.life = -1; break;
          }
          hurtEnemy(e, b.dmg, b.isCrit, b.angle, b.isFlame || b.isPlasma || b.isWaveArc || b.forceEvoBurn, {
            isMelee: !!b.isWaveArc,
            noProc: !!(b.turretShot && !player.turretElem),
            forceBurn: b.isFlame || b.forceEvoBurn,
            forceChill: b.isIce,
            forceFreeze: b.freezeHit > 0 && Math.random() < b.freezeHit,
            forcePoison: b.poisonHit > 0 && Math.random() < b.poisonHit,
            knockMult: b.isFlame ? 0.15 : (b.isBolt ? 1.35 : 1)
          });
          if (b.shredBlast > 0 && Math.random() < b.shredBlast) {
            triggerExplosion(b.x, b.y, (b.blastR || 64 * getBlastScale()), b.dmg * 0.65, false, 0, b.color || '#ff9f1c', true);
          } else if (b.evoBlastR > 0 && !b._evoBlasted) {
            b._evoBlasted = true;
            triggerExplosion(b.x, b.y, b.evoBlastR, b.dmg * 0.58, false, 0, b.color || '#ffd166', !!b.forceEvoBurn);
          }
          if (b.evoChain > 0 && !b._evoChained && e.hp > 0 && (!b.isFlame && Math.random() < 0.55)) {
            b._evoChained = true;
            castChainLightning(e.x, e.y, e, b.evoChain, b.dmg * 0.52, 0.20);
          }

          // 跳弹索敌判定（弹弓圆石 / 手里剑 / 榴弹弹跳连环爆 / 跳弹棱镜）
          if (b.bounces > 0) {
            if (b.isGrenade) {
              triggerExplosion(b.x, b.y, b.blastR || 76, b.dmg * 0.72, false, 0, '#ff9f1c', true);
            }
            let nextE = null, nextDSq = 275 * 275;
            for (let ci = 0; ci < enemies.length; ci++) {
              const cand = enemies[ci];
              if (cand && cand.hp > 0 && !cand.primed && !hasBulletHit(b, cand)) {
                const cdx = cand.x - b.x, cdy = cand.y - b.y;
                if (cdx >= 275 || cdx <= -275 || cdy >= 275 || cdy <= -275) continue;
                const cdSq = cdx * cdx + cdy * cdy;
                if (cdSq < nextDSq) { nextDSq = cdSq; nextE = cand; }
              }
            }
            if (nextE) {
              const spd = Math.hypot(b.vx, b.vy);
              const na = Math.atan2(nextE.y - b.y, nextE.x - b.x);
              b.vx = Math.cos(na) * spd; b.vy = Math.sin(na) * spd; b.angle = na;
              b.bounces--;
              b.dmg *= (0.9 + (player.bounceAmpDmg || 0));
              b.life = Math.max(b.life, 0.44);
              addSparks(b.x, b.y, na, b.isGrenade ? '#ff9f1c' : (b.isPebble ? '#e2e8f0' : '#72efdd'), 3);
              beep(b.isPebble ? 490 : 610, 0.025, 'triangle', 0.02);
              break;
            }
          }
          if (b.pierce <= 0) {
            if (b.isGrenade) triggerExplosion(b.x, b.y, b.blastR || 76, b.dmg * 0.85, false, 0, '#ff9f1c', true);
            b.life = -1; break;
          }
          b.pierce--;
          if (player.bounceAmpDmg > 0) b.dmg *= (1 + player.bounceAmpDmg);
        }
      }
    }
    if (b.life <= 0 && !b.isRocket && !b.isGrenade) {
      if (b.isPlasma) triggerExplosion(b.x, b.y, b.blastR || 82, b.dmg * 0.85 * elemMul, false, 0, '#c77dff', false);
      bullets.splice(i, 1);
    } else if (b.life <= 0) {
      bullets.splice(i, 1);
    }
  }
  compactAliveEnemies();

  // 怪物 AI 与三系元素异常（灼烧 DoT、冰冻禁锢/冻缓、剧毒叠层腐蚀）& 首领多维战术循环
  const globalSlow = Math.max(0.5, 1 - (player.enemySlow || 0));
  let activeFinalBosses = 0;
  for (let bi = 0; bi < enemies.length; bi++) {
    const be = enemies[bi];
    if (be && be.hp > 0 && be.type === 'boss') activeFinalBosses++;
  }
  const twinBossPace = activeFinalBosses > 1 ? 0.84 : 1;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e || e.hp <= 0) continue;
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e._flashCd > 0) e._flashCd -= dt;
    if (e._blkTxtCd > 0) e._blkTxtCd -= dt;
    if (e._reactCd > 0) e._reactCd -= dt;

    // 🔥 灼烧持续伤害（每 0.45 秒结算一次，数字干净不刷屏）
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.burnTick -= dt;
      if (e.burnTick <= 0) {
        e.burnTick = 0.45;
        hurtEnemy(e, e.burnDmg * 0.45, false, null, true, { isDot: true, dotColor: '#ff9f1c', noProc: true });
        if (e.hp <= 0) continue;
      }
    }
    // ☠️ 剧毒持续腐蚀伤害（叠层结算，并同步赋予怪物最高 +36% 易伤）
    if (e.poisonT > 0 && e.poisonStacks > 0) {
      e.poisonT -= dt;
      e.poisonTick = (e.poisonTick || 0.25) - dt;
      if (e.poisonTick <= 0) {
        e.poisonTick = 0.48;
        const pDmg = (2.3 + wave * 0.78) * e.poisonStacks * elemMul * effDmg * 0.48;
        hurtEnemy(e, pDmg, false, null, true, { isDot: true, dotColor: '#a3e635', noProc: true });
        if (e.hp <= 0) continue;
      }
      if (e.poisonT <= 0) e.poisonStacks = 0;
    }

    if (e.chillT > 0) e.chillT -= dt;
    if (e.freezeT > 0) e.freezeT = Math.max(0, e.freezeT - dt);
    if (e.exposeT > 0) e.exposeT = Math.max(0, e.exposeT - dt);
    if (e.sunderT > 0) e.sunderT = Math.max(0, e.sunderT - dt);
    if (e._touchCd > 0) e._touchCd = Math.max(0, e._touchCd - dt);

    const isBossUnit = e.type === 'boss' || e.type === 'special_boss';
    const isFrozenLocked = !isBossUnit && e.type !== 'mini_boss' && e.freezeT > 0;
    let eTerrainSpd = 1;
    for (let tIdx = 0; tIdx < terrains.length; tIdx++) {
      const tr = terrains[tIdx];
      if (tr.kind === 'chasm') continue;
      if (isPointInTerrain(tr, e.x, e.y, e.r * 0.38)) {
        if (tr.kind === 'lava') {
          eTerrainSpd = Math.min(eTerrainSpd, 0.82);
          if (!e.burnT || e.burnT < 0.9) {
            e.burnT = 1.35;
            e.burnDmg = Math.max(e.burnDmg || 0, (12 + wave * 2.8) * diff.hpMul);
            if (!e.burnTick || e.burnTick <= 0) e.burnTick = 0.25;
          }
        } else if (tr.kind === 'swamp') {
          eTerrainSpd = Math.min(eTerrainSpd, 0.62);
          if ((!e.poisonT || e.poisonT < 0.8) && !isBossUnit) {
            e.poisonStacks = Math.max(1, e.poisonStacks || 0);
            e.poisonT = 1.4;
          }
        } else if (tr.kind === 'ice_sheet') {
          eTerrainSpd = Math.min(eTerrainSpd, 0.85);
        }
      }
    }
    const terrainFactor = isBossUnit ? Math.max(0.82, eTerrainSpd) : eTerrainSpd;
    const freezeSlow = e.freezeT > 0 ? (isBossUnit ? 0.72 : 0.62) : 1;
    const exposeSlow = e.exposeT > 0 ? 0.68 : 1;
    const slowFactor = (e.chillT > 0 ? (isBossUnit ? 0.82 : 0.68) : 1) * freezeSlow * exposeSlow * globalSlow * terrainFactor;
    const curSpd = isFrozenLocked ? 0 : e.spd * slowFactor;

    if (!isFrozenLocked) {
      e.phase += dt * (e.type === 'swarmer' ? 18 : 7) * slowFactor;
    }
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    if (!isFrozenLocked) {
      e.faceA = e.dashing && e.dashAng !== undefined ? e.dashAng : (e.lockedAim !== undefined ? e.lockedAim : a);
    }
    const distP = Math.hypot(player.x - e.x, player.y - e.y);

    if (isFrozenLocked) {
      // ❄️ 冰封禁锢：普通与精英怪完全冻结停止移动与出招（引爆自爆虫仍保留物理位置）
    } else if (e.type === 'bomber') {
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
      const enraged = (e.hp < e.maxHp * 0.55) || overtime || !!e.mythicPhase2;
      const bossMult = (enraged ? 1.15 : 1) * (e.mythicPhase2 ? 1.12 : 1) * twinBossPace;

      // 首领地形灾变改写（按首领元素属性改变局部地貌，取消原先千篇一律的通用外环与通用红圈轰炸，改为六大首领完全独立的招牌技能组！）
      e.terrainCd = (e.terrainCd !== undefined ? e.terrainCd : 6.8) - dt * bossMult;
      if (e.terrainCd <= 0) {
        e.terrainCd = e.mythicPhase2 ? 7.0 : 8.6;
        const tKind = e.variant === 'frost_queen'
          ? 'ice_sheet'
          : ((e.variant === 'mech_colossus' || e.variant === 'solar_seraph')
            ? 'lava'
            : (e.variant === 'void_weaver' ? 'chasm' : 'swamp'));
        const ta = Math.random() * Math.PI * 2, td = 115 + Math.random() * 115;
        spawnBossTerrain(tKind, e.x + Math.cos(ta) * td, e.y + Math.sin(ta) * td, 64);
      }

      // 六大主宰专属咏唱终极奥义（高辨识度地面几何预警 + 专属形态弹幕/光炮 + 1.45s 破绽窗口）
      if (e.sigSkillT === undefined) e.sigSkillT = 3.4;
      if ((e.sigWindupT || 0) > 0) {
        e.sigWindupT -= dt;
        if (e.sigWindupT <= 0) {
          e.sigWindupT = 0;
          e.castEndT = 1.15;
          e.exposeT = Math.max(e.exposeT || 0, 1.45);
          beep(245, 0.14, 'sawtooth', 0.065);
          const baseA = Number.isFinite(e.sigBaseA) ? e.sigBaseA : a;
          if (e.sigKind === 'frost_prism') {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 162, color: '#7dd3fc', t: 0.34, maxT: 0.34 });
            for (let k = 0; k < 12 && eBullets.length < 170; k++) {
              const ba = baseA + (k / 12) * Math.PI * 2;
              const spd = k % 2 === 0 ? 172 : 122;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * spd, vy: Math.sin(ba) * spd, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 6.0, color: k % 2 === 0 ? '#7dd3fc' : '#e0f2fe', shape: k % 2 === 0 ? 'trident' : 'shard', chillPlayer: true });
            }
            for (let k = 0; k < 6; k++) {
              const ha = baseA + (k / 6) * Math.PI * 2;
              spawnHazard(e.x + Math.cos(ha) * 176, e.y + Math.sin(ha) * 176, 62, e.dmg * 1.08, 0.95, { color: '#38bdf8' });
            }
          } else if (e.sigKind === 'chrono_dial') {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 175, color: '#fde68a', t: 0.34, maxT: 0.34 });
            for (let k = 0; k < 12 && eBullets.length < 170; k++) {
              const ba = baseA + (k / 12) * Math.PI * 2;
              const spd = 128 + (k % 3) * 28;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * spd, vy: Math.sin(ba) * spd, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 5.8, color: k % 2 === 0 ? '#fde68a' : '#c084fc', shape: k % 3 === 0 ? 'crescent' : 'needle' });
            }
            for (let k = 0; k < 3 && lightnings.length < 35; k++) {
              const la = baseA + (k / 3) * Math.PI * 2;
              lightnings.push({ pts: [{ x: e.x, y: e.y }, { x: e.x + Math.cos(la) * 210, y: e.y + Math.sin(la) * 210 }], color: '#fde68a', t: 0.28, maxT: 0.28 });
            }
          } else if (e.sigKind === 'eclipse_lances') {
            const tx = Number.isFinite(e.sigTargetX) ? e.sigTargetX : player.x;
            const ty = Number.isFinite(e.sigTargetY) ? e.sigTargetY : player.y;
            if (rings.length < 40) rings.push({ x: tx, y: ty, r: 224, color: '#fde68a', t: 0.34, maxT: 0.34 });
            const lanceCnt = enraged ? 8 : 6;
            for (let k = 0; k < lanceCnt && eBullets.length < 170; k++) {
              const ba = baseA + (k / lanceCnt) * Math.PI * 2;
              const sx = Math.max(48, Math.min(WORLD.w - 48, tx + Math.cos(ba) * 232));
              const sy = Math.max(48, Math.min(WORLD.h - 48, ty + Math.sin(ba) * 232));
              const fireA = Math.atan2(ty - sy, tx - sx) + (k % 2 === 0 ? 0.20 : -0.20);
              addBurst(sx, sy, '#fde68a', 4, 90);
              eBullets.push({ x: sx, y: sy, vx: Math.cos(fireA) * 188, vy: Math.sin(fireA) * 188, dmg: Math.max(5, Math.round(e.dmg * 0.82)), r: 6.4, color: '#fde68a', shape: 'trident' });
            }
          } else if (e.sigKind === 'omega_cross_beam') {
            // 欧米茄：十字重型等离子歼灭主炮（4 向贯通激光炮轨 + 齿轮锯盘）
            const beamLen = 460;
            for (let k = 0; k < 4; k++) {
              const ba = baseA + k * (Math.PI * 0.5);
              const bx2 = e.x + Math.cos(ba) * beamLen, by2 = e.y + Math.sin(ba) * beamLen;
              if (beams.length < 24) beams.push({ x1: e.x, y1: e.y, x2: bx2, y2: by2, color: '#fb923c', t: 0.36, maxT: 0.36 });
              const proj = Math.max(0, Math.min(1, ((player.x - e.x) * (bx2 - e.x) + (player.y - e.y) * (by2 - e.y)) / (beamLen * beamLen)));
              const px = e.x + proj * (bx2 - e.x), py = e.y + proj * (by2 - e.y);
              if (Math.hypot(player.x - px, player.y - py) <= player.r + 18) {
                hurtPlayer(Math.round(e.dmg * 1.18));
                if (state !== 'wave') return;
              }
              const discA = ba + Math.PI * 0.25;
              if (eBullets.length < 170) {
                eBullets.push({ x: e.x, y: e.y, vx: Math.cos(discA) * 155, vy: Math.sin(discA) * 155, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 8.2, color: '#ffd166', shape: 'disc', rot: 0 });
              }
            }
            shake = Math.max(shake, 5.5);
          } else if (e.sigKind === 'venom_vortex') {
            // 苍岚毒皇：万蛊翠岚风刃三叉阵
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 168, color: '#6ee7b7', t: 0.32, maxT: 0.32 });
            for (let k = 0; k < 10 && eBullets.length < 170; k++) {
              const ba = baseA + (k / 10) * Math.PI * 2;
              const isTri = k % 2 === 0;
              const spd = isTri ? 174 : 132;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * spd, vy: Math.sin(ba) * spd, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: isTri ? 6.2 : 7.5, color: isTri ? '#a3e635' : '#6ee7b7', shape: isTri ? 'trident' : 'crescent' });
            }
          } else {
            // butcher · 断刃·千雨十字裂（巨型绯红弯月刀波穿透全场）
            const ways = enraged ? 8 : 4;
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 152, color: '#fb7185', t: 0.30, maxT: 0.30 });
            for (let k = 0; k < ways && eBullets.length < 170; k++) {
              const ba = baseA + (k / ways) * Math.PI * 2;
              if (slashes.length < 36 && k < 4) {
                slashes.push({ x: e.x + Math.cos(ba) * 46, y: e.y + Math.sin(ba) * 46, angle: ba, r: 118, color: '#fb7185', mode: 'crescent', t: 0.26, maxT: 0.26 });
              }
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 182, vy: Math.sin(ba) * 182, dmg: Math.max(4, Math.round(e.dmg * 0.82)), r: 8.6, color: '#fb7185', shape: 'crescent' });
            }
          }
        }
      } else if (!e.dashing) {
        if (e.castEndT > 0) {
          e.castEndT -= dt;
          if (e.castEndT <= 0) e.castLabel = '';
        }
        const vId = e.variant || 'butcher';
        e.sigSkillT -= dt * bossMult;
        if (e.sigSkillT <= 0) {
          e.sigSkillT = enraged ? 6.0 : 7.4;
          e.sigMaxW = 0.86;
          e.sigWindupT = 0.86;
          e.sigBaseA = a;
          e.sigTargetX = player.x;
          e.sigTargetY = player.y;
          if (vId === 'frost_queen') {
            e.sigKind = 'frost_prism';
            e.castLabel = '❄️ 碎冕·六棱极光阵';
          } else if (vId === 'void_weaver') {
            e.sigKind = 'chrono_dial';
            e.castLabel = '⚙️ 星晷·十二刻逆时针';
          } else if (vId === 'solar_seraph') {
            e.sigKind = 'eclipse_lances';
            e.castLabel = '🌑 终焉·黑日圣枪阵';
          } else if (vId === 'mech_colossus') {
            e.sigKind = 'omega_cross_beam';
            e.castLabel = '🔥 欧米茄·十字歼灭炮';
          } else if (vId === 'plague_empress') {
            e.sigKind = 'venom_vortex';
            e.castLabel = '🍃 万蛊·翠岚龙卷阵';
          } else {
            e.sigKind = 'crimson_cross';
            e.castLabel = '⚔️ 断刃·八荒血月斩';
          }
          beep(420, 0.085, 'triangle', 0.048);
          addText(e.x, e.y - e.r - 22, e.castLabel + '!', '#fde68a', 15, 1.35, true);
        }
      }

      if (e.variant === 'frost_queen') {
        // 【碎冕霜女皇 · 艾丝特莉亚】机制特征：旋转双翼极光冰束扫射 + 寒渊三叉冰戟扇射 + 六合冰牢封走位 + 霜雾瞬闪
        if ((e.beamSweepT || 0) > 0) {
          e.beamSweepT -= dt;
          e.beamSweepA = (e.beamSweepA || 0) + dt * (enraged ? 1.55 : 1.25);
          e._beamHitCd = Math.max(0, (e._beamHitCd || 0) - dt);
          const bLen = 350;
          for (let side = -1; side <= 1; side += 2) {
            const ba = e.beamSweepA + (side < 0 ? Math.PI : 0);
            const bx2 = e.x + Math.cos(ba) * bLen, by2 = e.y + Math.sin(ba) * bLen;
            const proj = Math.max(0, Math.min(1, ((player.x - e.x) * (bx2 - e.x) + (player.y - e.y) * (by2 - e.y)) / (bLen * bLen)));
            const px = e.x + proj * (bx2 - e.x), py = e.y + proj * (by2 - e.y);
            if (e._beamHitCd <= 0 && Math.hypot(player.x - px, player.y - py) <= player.r + 13) {
              e._beamHitCd = 0.32;
              if (!player.noSlow) player.chillSlowT = 1.4;
              hurtPlayer(Math.round(e.dmg * 0.92));
              if (state !== 'wave') return;
            }
          }
          if (e.beamSweepT <= 0) e.exposeT = Math.max(e.exposeT || 0, 1.15);
        } else if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            finishLinearDash(e, enraged ? 3.2 : 3.9);
            // 冲刺落地立即开启 1.65s 极光双翼冰束旋转扫射！
            e.beamSweepT = 1.65;
            e.beamSweepMaxT = 1.65;
            e.beamSweepA = a + 0.52;
            addText(e.x, e.y - e.r - 18, '❄️ 极光双翼冰束扫射!', '#7dd3fc', 14, 1.35);
            beep(520, 0.12, 'sine', 0.05);
          }
        } else {
          e.dashT -= dt * slowFactor * bossMult;
          if (e.dashT <= 0.50 && e.dashT > 0 && e.lockedAim === undefined) {
            lockLinearDash(e, a, 275, 0.50, '#72efdd');
          }
          if (e.dashT <= 0) {
            startLinearDash(e, a, 275, 0.36);
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 82, color: '#72efdd', t: 0.28, maxT: 0.28 });
            advanceLinearDash(e, dt);
          } else if (e.dashT > 0.50 && distP > 165) {
            e.x += Math.cos(a) * curSpd * bossMult * dt; e.y += Math.sin(a) * curSpd * bossMult * dt;
          }
        }
        // 专属弹幕：皇室寒渊三叉冰戟齐射（明显的三叉戟弹头！）
        e.shotT = (e.shotT || 1.7) - dt * bossMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 1.75 : 2.15;
          const fan = enraged ? 2 : 1;
          for (let k = -fan; k <= fan && eBullets.length < 170; k++) {
            const ba = a + k * 0.22;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 168, vy: Math.sin(ba) * 168, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 6.2, color: '#72efdd', shape: 'trident', chillPlayer: true });
          }
        }
        // 专属控场：围绕玩家构筑六边形寒冰牢笼（留有突围缺口，极具视觉辨识度）
        e.meteorT = (e.meteorT || 4.6) - dt * bossMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 4.4 : 5.4;
          const gapIdx = Math.floor(Math.random() * 6);
          addText(player.x, player.y - 44, '🧊 寒霜六合冰牢! 寻缺口突围', '#7dd3fc', 14, 1.3);
          for (let b = 0; b < 6; b++) {
            if (b === gapIdx) continue;
            const ba = (b / 6) * Math.PI * 2 + e.phase * 0.25;
            spawnHazard(player.x + Math.cos(ba) * 128, player.y + Math.sin(ba) * 128, 56, e.dmg * 1.06, 1.18, { color: '#38bdf8' });
          }
        }
        e.sumT = (e.sumT || 6.6) - dt * bossMult;
        if (e.sumT <= 0 && enemies.length < 70) {
          e.sumT = enraged ? 6.4 : 7.6;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 190)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 190)), 'frost_wisp');
        }
      } else if (e.variant === 'mech_colossus') {
        // 【熔核机械巨像 · 欧米茄】机制特征：扇形横扫加特林火舌 + 3×2 钢铁矩阵地毯轰炸 + 重装回旋锯盘阵
        e.x += Math.cos(a) * curSpd * bossMult * dt; e.y += Math.sin(a) * curSpd * bossMult * dt;
        e.shotT = (e.shotT || 2.0) - dt * bossMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 2.3 : 2.9;
          e.burstLeft = enraged ? 9 : 7;
          e.burstCd = 0.02;
          e._sweepBaseA = a - 0.48;
          addText(e.x, e.y - e.r - 16, '🔥 熔核加特林横扫!', '#ff9f1c', 13, 1.1);
        }
        if (e.burstLeft > 0) {
          e.burstCd -= dt;
          if (e.burstCd <= 0) {
            e.burstCd = 0.10;
            const idxShot = (enraged ? 9 : 7) - e.burstLeft;
            e.burstLeft--;
            if (eBullets.length < 170) {
              const sa = (e._sweepBaseA !== undefined ? e._sweepBaseA : a - 0.4) + idxShot * 0.13;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 184, vy: Math.sin(sa) * 184, dmg: Math.max(4, Math.round(e.dmg * 0.76)), r: 6.2, color: '#ff9f1c', shape: 'fire' });
            }
          }
        }
        // 重踏释放 6 枚重型自转锯盘
        e.dashT = (e.dashT || 3.4) - dt * bossMult;
        if (e.dashT <= 0) {
          e.dashT = enraged ? 3.2 : 4.0;
          e.exposeT = Math.max(e.exposeT || 0, 1.1);
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 126, color: '#fb5607', t: 0.3, maxT: 0.3 });
          const discCnt = enraged ? 8 : 6;
          for (let k = 0; k < discCnt && eBullets.length < 170; k++) {
            const ba = (k / discCnt) * Math.PI * 2 + e.phase * 0.35;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 145, vy: Math.sin(ba) * 145, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 8.4, color: '#ffd166', shape: 'disc', rot: 0 });
          }
        }
        // 3×2 钢铁矩阵排炮地毯轰炸（整齐列阵推进，绝非随机散点）
        e.meteorT = (e.meteorT || 4.2) - dt * bossMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 4.0 : 4.9;
          const axisA = a;
          const perpA = axisA + Math.PI * 0.5;
          addText(e.x, e.y - e.r - 18, '🚀 钢铁矩阵排炮轰炸!', '#fb5607', 14, 1.3);
          for (let row = -1; row <= 1; row++) {
            for (let col = -1; col <= 1; col += 2) {
              const hx = player.x + Math.cos(axisA) * (row * 112) + Math.cos(perpA) * (col * 64);
              const hy = player.y + Math.sin(axisA) * (row * 112) + Math.sin(perpA) * (col * 64);
              spawnHazard(hx, hy, 58, e.dmg * 1.12, 1.05 + (row + 1) * 0.16, { color: '#fb5607' });
            }
          }
        }
        e.sumT = (e.sumT || 6.8) - dt * bossMult;
        if (e.sumT <= 0 && enemies.length < 70) {
          e.sumT = enraged ? 6.4 : 7.8;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 200)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 200)), 'spinner');
        }
      } else if (e.variant === 'void_weaver') {
        // 【逆时星晷主宰 · 伽蓝】机制特征：十字/X形次元裁决激光网锁定 + 双生残影折跃交叉弯刃 + 刀锋刺客召唤
        if (distP > 155) { e.x += Math.cos(a) * curSpd * bossMult * dt; e.y += Math.sin(a) * curSpd * bossMult * dt; }
        if ((e.laserGridT || 0) > 0) {
          e.laserGridT -= dt;
          if (e.laserGridT <= 0) {
            e.laserGridT = 0;
            const gx = e.laserGridX, gy = e.laserGridY, ga = e.laserGridA || 0;
            const span = 560;
            beep(310, 0.16, 'sawtooth', 0.065);
            if (rings.length < 40) rings.push({ x: gx, y: gy, r: 95, color: '#e0aaff', t: 0.28, maxT: 0.28, fill: true });
            for (let k = 0; k < 2; k++) {
              const la = ga + k * (Math.PI * 0.5);
              const x1 = gx - Math.cos(la) * span, y1 = gy - Math.sin(la) * span;
              const x2 = gx + Math.cos(la) * span, y2 = gy + Math.sin(la) * span;
              if (beams.length < 24) beams.push({ x1, y1, x2, y2, color: '#c77dff', t: 0.34, maxT: 0.34 });
              const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
              const proj = Math.max(0, Math.min(1, ((player.x - x1) * (x2 - x1) + (player.y - y1) * (y2 - y1)) / l2));
              const px = x1 + proj * (x2 - x1), py = y1 + proj * (y2 - y1);
              if (Math.hypot(player.x - px, player.y - py) <= player.r + 15) {
                hurtPlayer(Math.round(e.dmg * 1.15));
                if (state !== 'wave') return;
              }
            }
          }
        }
        e.meteorT = (e.meteorT || 3.6) - dt * bossMult;
        if (e.meteorT <= 0 && !(e.laserGridT > 0)) {
          e.meteorT = enraged ? 3.8 : 4.7;
          e.laserGridMaxT = 0.85;
          e.laserGridT = 0.85;
          e.laserGridX = player.x;
          e.laserGridY = player.y;
          e.laserGridA = ((e._gridFlip = !e._gridFlip) ? 0 : Math.PI * 0.25);
          addText(player.x, player.y - 44, e._gridFlip ? '🌌 十字次元光轨锁定!' : '🌌 X字次元光轨锁定!', '#e0aaff', 14, 1.15);
          beep(620, 0.08, 'triangle', 0.045);
        }
        // 双生残影相位折跃：旧坐标残影与新坐标本体同时向玩家交叉斩出次元弯月刃！
        e.blinkT = (e.blinkT || 3.1) - dt * bossMult;
        if (e.blinkT <= 0) {
          e.blinkT = enraged ? 2.8 : 3.6;
          e.exposeT = Math.max(e.exposeT || 0, 1.15);
          const oldX = e.x, oldY = e.y;
          if (rings.length < 40) rings.push({ x: oldX, y: oldY, r: 78, color: '#fde68a', t: 0.30, maxT: 0.30 });
          const oldAim = Math.atan2(player.y - oldY, player.x - oldX);
          for (let k = -1; k <= 1 && eBullets.length < 170; k++) {
            const ba = oldAim + k * 0.22;
            eBullets.push({ x: oldX, y: oldY, vx: Math.cos(ba) * 165, vy: Math.sin(ba) * 165, dmg: Math.max(4, Math.round(e.dmg * 0.74)), r: 6.8, color: '#fde68a', shape: 'crescent' });
          }
          const ta = Math.random() * Math.PI * 2, td = 175 + Math.random() * 55;
          e.x = Math.max(100, Math.min(WORLD.w - 100, player.x + Math.cos(ta) * td));
          e.y = Math.max(100, Math.min(WORLD.h - 100, player.y + Math.sin(ta) * td));
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 86, color: '#c77dff', t: 0.32, maxT: 0.32, fill: true });
          const newAim = Math.atan2(player.y - e.y, player.x - e.x);
          for (let k = -2; k <= 2 && eBullets.length < 170; k++) {
            const ba = newAim + k * 0.20;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 165, vy: Math.sin(ba) * 165, dmg: Math.max(4, Math.round(e.dmg * 0.74)), r: 6.8, color: '#c77dff', shape: 'crescent' });
          }
        }
        e.sumT = (e.sumT || 6.4) - dt * bossMult;
        if (e.sumT <= 0 && enemies.length < 70) {
          e.sumT = enraged ? 6.0 : 7.2;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 200)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 200)), 'stalker');
        }
      } else if (e.variant === 'plague_empress') {
        // 【苍岚万蛊毒皇 · 青羽】机制特征：疾风掠影毒爆冲刺 + 五联剧毒三叉戟扇射 + 双螺旋毒液花瓣 + 分裂母体潮
        if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 92, color: '#6ee7b7', t: 0.26, maxT: 0.26 });
            spawnHazard(e.x, e.y, 72, e.dmg * 1.05, 1.05, { color: '#52b788' });
            finishLinearDash(e, enraged ? 3.0 : 3.7);
            e.exposeT = Math.max(e.exposeT || 0, 1.05);
          }
        } else {
          e.dashT = (e.dashT || 3.4) - dt * slowFactor * bossMult;
          if (e.dashT <= 0.46 && e.dashT > 0 && e.lockedAim === undefined) {
            lockLinearDash(e, a, 310, 0.46, '#6ee7b7');
          }
          if (e.dashT <= 0) {
            startLinearDash(e, a, 310, 0.34);
            spawnHazard(e.x, e.y, 66, e.dmg * 1.02, 1.05, { color: '#a3e635' });
            // 疾风起跳同步向玩家扇射 5 枚剧毒三叉戟！
            for (let k = -2; k <= 2 && eBullets.length < 170; k++) {
              const sa = a + k * 0.20;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 176, vy: Math.sin(sa) * 176, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 6.0, color: '#a3e635', shape: 'trident' });
            }
            advanceLinearDash(e, dt);
          } else if (e.dashT > 0.46 && distP > 150) {
            const weaveA = a + Math.sin(e.phase * 0.5) * 0.45;
            e.x += Math.cos(weaveA) * curSpd * bossMult * dt; e.y += Math.sin(weaveA) * curSpd * bossMult * dt;
          }
        }
        // 双螺旋逆旋万蛊酸液弹幕
        e.shotT = (e.shotT || 1.75) - dt * bossMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 1.65 : 2.05;
          const arms = enraged ? 6 : 4;
          for (let k = 0; k < arms && eBullets.length < 170; k++) {
            const ba1 = (k / arms) * Math.PI * 2 + e.phase * 0.85;
            const ba2 = (k / arms) * Math.PI * 2 - e.phase * 0.65;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba1) * 152, vy: Math.sin(ba1) * 152, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.6, color: '#52b788', shape: 'acid' });
            if (eBullets.length < 170) {
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba2) * 124, vy: Math.sin(ba2) * 124, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.8, color: '#80ed99', shape: 'trident' });
            }
          }
        }
        e.sumT = (e.sumT || 6.0) - dt * bossMult;
        if (e.sumT <= 0 && enemies.length < 70) {
          e.sumT = enraged ? 5.8 : 7.0;
          const sType = Math.random() < 0.50 ? 'splitter' : 'spore_mother';
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 200)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 200)), sType);
        }
      } else if (e.variant === 'solar_seraph') {
        // 【终焉日蚀圣女 · 曦】机制特征：阴阳双曜（先内圈耀斑远离 → 后外环黑日贴身）连携技 + 贯日冲锋黄金三叉戟 + 三连追猎天罚柱
        e.ringCd = (e.ringCd !== undefined ? e.ringCd : 4.5) - dt * bossMult;
        if (e.ringCd <= 0) {
          e.ringCd = e.mythicPhase2 ? 5.4 : 6.6;
          // 第一拍：内圈实心耀斑核爆（逼迫玩家远离）
          spawnHazard(e.x, e.y, 142, e.dmg * 1.18, 1.02, { color: '#ff9f1c' });
          e._eclipseFollowT = 1.06;
          addText(e.x, e.y - e.r - 20, '☀️ 阴阳双曜·先远离耀斑，再贴近黑日!', '#ffd166', 14, 1.8);
        }
        if ((e._eclipseFollowT || 0) > 0) {
          e._eclipseFollowT -= dt;
          if (e._eclipseFollowT <= 0) {
            // 第二拍：外环黑日蚀灭风暴（内圈 118px 安全，奖励回身贴脸输出！）
            spawnHazard(e.x, e.y, 262, e.dmg * 1.22, 1.08, { innerSafeR: 118, color: '#fde68a' });
            e.exposeT = 1.75;
            addText(e.x, e.y - e.r - 18, '🌑 黑日环蚀! 贴近内圈风眼反击!', '#fde68a', 14, 1.3);
          }
        }
        const seraphDist = enraged ? 380 : 350;
        if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 96, color: '#ffd166', t: 0.28, maxT: 0.28 });
            const fan = enraged ? 3 : 2;
            const aimNow = Math.atan2(player.y - e.y, player.x - e.x);
            for (let k = -fan; k <= fan && eBullets.length < 170; k++) {
              const ba = aimNow + k * 0.21;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 178, vy: Math.sin(ba) * 178, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 6.2, color: '#ffd166', shape: 'trident' });
            }
            finishLinearDash(e, enraged ? 2.45 : 2.95);
            e.exposeT = Math.max(e.exposeT || 0, 1.05);
          }
        } else {
          e.dashT -= dt * slowFactor * bossMult;
          if (e.dashT <= 0.54 && e.dashT > 0 && e.lockedAim === undefined) {
            lockLinearDash(e, a, seraphDist, 0.54, '#ffd166');
          }
          if (e.dashT <= 0) {
            startLinearDash(e, a, seraphDist, 0.40);
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 80, color: '#ff9f1c', t: 0.26, maxT: 0.26 });
            advanceLinearDash(e, dt);
          } else if (e.dashT > 0.54 && distP > 135) {
            e.x += Math.cos(a) * curSpd * bossMult * dt; e.y += Math.sin(a) * curSpd * bossMult * dt;
          }
        }
        // 三连渐进式追猎天罚圣柱（沿玩家移动前方依次降下，迫使折返变向）
        e.meteorT = (e.meteorT || 4.2) - dt * bossMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 3.8 : 4.8;
          const stepX = (dx || Math.cos(a)) * 78, stepY = (dy || Math.sin(a)) * 78;
          for (let b = 0; b < 3; b++) {
            spawnHazard(player.x + stepX * b, player.y + stepY * b, 66, e.dmg * 1.12, 0.92 + b * 0.24, { color: '#ffd166' });
          }
        }
        e.sumT = (e.sumT || 6.6) - dt * bossMult;
        if (e.sumT <= 0 && enemies.length < 70) {
          e.sumT = enraged ? 6.2 : 7.6;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 200)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 200)), 'magma_imp');
        }
      } else {
        // 【断刃守誓者 · 烬羽】机制特征：二/三段连环疾风居合冲刺 + 巨型绯红弯月剑气扇 + 贴身血眼环斩
        const butcherDist = enraged ? 365 : 335;
        if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 92, color: '#e63946', t: 0.26, maxT: 0.26 });
            const aimNow = Math.atan2(player.y - e.y, player.x - e.x);
            for (let k = -1; k <= 1 && eBullets.length < 170; k++) {
              const ba = aimNow + k * 0.28;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 176, vy: Math.sin(ba) * 176, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 8.2, color: '#fb7185', shape: 'crescent' });
            }
            if ((e.comboDashesLeft || 0) > 0) {
              e.comboDashesLeft--;
              finishLinearDash(e, 0.44);
              lockLinearDash(e, aimNow, butcherDist * 0.88, 0.44, '#fb7185');
            } else {
              finishLinearDash(e, enraged ? 2.55 : 3.15);
              e.exposeT = Math.max(e.exposeT || 0, 1.35);
            }
          }
        } else {
          e.dashT -= dt * slowFactor * bossMult;
          if (e.dashT <= 0.54 && e.dashT > 0 && e.lockedAim === undefined) {
            e.comboDashesLeft = enraged ? 2 : 1; // 二连 / 狂暴三连疾风居合斩！
            lockLinearDash(e, a, butcherDist, 0.54, '#ff2a55');
            addText(e.x, e.y - e.r - 16, enraged ? '⚔️ 三连疾风居合!' : '⚔️ 二连疾风居合!', '#fb7185', 14, 1.2);
          }
          if (e.dashT <= 0) {
            const ca = startLinearDash(e, a, butcherDist, 0.38);
            if (slashes.length < 36) slashes.push({ x: e.x + Math.cos(ca) * 36, y: e.y + Math.sin(ca) * 36, angle: ca, r: 108, color: '#fb7185', mode: 'crescent', t: 0.22, maxT: 0.22 });
            advanceLinearDash(e, dt);
          } else if (e.dashT > 0.54) {
            e.x += Math.cos(a) * curSpd * bossMult * dt; e.y += Math.sin(a) * curSpd * bossMult * dt;
          }
        }
        // 烬羽专属：血眼环斩（内圈 112px 风眼安全，鼓励近战拼刀！）
        e.ringCd = (e.ringCd !== undefined ? e.ringCd : 4.8) - dt * bossMult;
        if (e.ringCd <= 0) {
          e.ringCd = enraged ? 5.0 : 6.0;
          spawnHazard(e.x, e.y, 236, e.dmg * 1.15, 1.28, { innerSafeR: 112, color: '#fb7185' });
          e.exposeT = Math.max(e.exposeT || 0, 1.55);
          addText(e.x, e.y - e.r - 18, '🩸 血眼回天斩! 贴近内圈破招', '#fb7185', 14, 1.4);
        }
        e.sumT -= dt * bossMult;
        if (e.sumT <= 0 && enemies.length < 70) {
          e.sumT = enraged ? 6.0 : 7.4;
          const sType = Math.random() < 0.40 ? 'charger' : 'stalker';
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 220)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 220)), sType);
        }
      }
    } else if (e.type === 'mini_boss') {
      if (e.variant === 'pyro_lord') {
        // 炽焰重炮统领：四臂旋转烈焰风车喷射 + 十字熔火柱轰击
        if (distP > 170) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
        e.shotT = (e.shotT || 0.85) - dt * slowFactor;
        if (e.shotT <= 0) {
          e.shotT = 0.72;
          e._wheelA = (e._wheelA || 0) + 0.36;
          for (let k = 0; k < 4 && eBullets.length < 170; k++) {
            const sa = e._wheelA + k * (Math.PI * 0.5);
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 148, vy: Math.sin(sa) * 148, dmg: Math.max(4, Math.round(e.dmg * 0.70)), r: 5.8, color: '#ff6b35', shape: 'fire' });
          }
        }
        e.meteorT = (e.meteorT || 4.6) - dt;
        if (e.meteorT <= 0) {
          e.meteorT = 4.8;
          addText(e.x, e.y - e.r - 14, '🔥 十字熔火裂地!', '#ff9f1c', 13, 1.1);
          for (let b = 0; b < 4; b++) {
            const ha = a + b * (Math.PI * 0.5);
            spawnHazard(player.x + Math.cos(ha) * 78, player.y + Math.sin(ha) * 78, 56, e.dmg * 1.06, 1.18, { color: '#ff9f1c' });
          }
        }
      } else if (e.variant === 'shadow_stalker') {
        // 幽影雷刃统领：瞬影侧袭闪现 + X形双生弯月斩 + 高速雷刃突刺
        e.skillT = (e.skillT || 3.4) - dt * slowFactor;
        if (!e.dashing && e.skillT <= 0) {
          e.skillT = 4.2;
          const ba = a + (Math.random() < 0.5 ? 1.35 : -1.35);
          e.x = Math.max(90, Math.min(WORLD.w - 90, player.x + Math.cos(ba) * 165));
          e.y = Math.max(90, Math.min(WORLD.h - 90, player.y + Math.sin(ba) * 165));
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 68, color: '#72efdd', t: 0.24, maxT: 0.24, fill: true });
          const aimP = Math.atan2(player.y - e.y, player.x - e.x);
          for (let k = -1; k <= 1; k += 2) {
            if (eBullets.length < 170) {
              const sa = aimP + k * 0.16;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 182, vy: Math.sin(sa) * 182, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 7.4, color: '#72efdd', shape: 'crescent' });
            }
          }
          addText(e.x, e.y - e.r - 14, '⚡ 幽影侧袭斩!', '#72efdd', 13, 1.0);
        }
        if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 66, color: '#72efdd', t: 0.22, maxT: 0.22 });
            finishLinearDash(e, 2.35);
          }
        } else {
          e.dashT -= dt * slowFactor;
          if (e.dashT <= 0.46 && e.dashT > 0 && e.lockedAim === undefined) {
            lockLinearDash(e, a, 300, 0.46, '#72efdd');
          }
          if (e.dashT <= 0) {
            startLinearDash(e, a, 300, 0.34);
            for (let k = 0; k < 6 && eBullets.length < 170; k++) {
              const ba = (k / 6) * Math.PI * 2 + e.phase;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 158, vy: Math.sin(ba) * 158, dmg: Math.max(4, Math.round(e.dmg * 0.70)), r: 5.4, color: '#72efdd', shape: 'needle' });
            }
            advanceLinearDash(e, dt);
          } else if (e.dashT > 0.46) {
            e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
          }
        }
      } else if (e.variant === 'venom_matriarch') {
        // 碧鳞剧毒统领：三联剧毒三叉戟扇射 + 腐蚀毒沼连环圈 + 孵化分裂软泥
        if (distP > 160) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
        e.shotT = (e.shotT || 1.9) - dt * slowFactor;
        if (e.shotT <= 0) {
          e.shotT = 2.15;
          for (let k = -1; k <= 1 && eBullets.length < 170; k++) {
            const sa = a + k * 0.24;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 165, vy: Math.sin(sa) * 165, dmg: Math.max(4, Math.round(e.dmg * 0.76)), r: 6.0, color: '#80ed99', shape: 'trident' });
          }
        }
        e.meteorT = (e.meteorT || 4.4) - dt;
        if (e.meteorT <= 0) {
          e.meteorT = 4.7;
          for (let b = 0; b < 2; b++) {
            spawnHazard(player.x + (Math.random() - 0.5) * 170, player.y + (Math.random() - 0.5) * 170, 68, e.dmg * 1.05, 1.22, { color: '#52b788' });
          }
          if (enemies.length < 70) {
            spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 140)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 140)), 'splitter');
          }
        }
      } else if (e.variant === 'glacial_valkyrie') {
        // 凛霜圣枪统领：极北寒霜圣枪长距冲锋 + 落点三联寒霜三叉戟 + 直线冰川推进
        if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 74, color: '#48cae4', t: 0.24, maxT: 0.24 });
            const aimP = Math.atan2(player.y - e.y, player.x - e.x);
            for (let k = -1; k <= 1 && eBullets.length < 170; k++) {
              const ba = aimP + k * 0.22;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 168, vy: Math.sin(ba) * 168, dmg: Math.max(4, Math.round(e.dmg * 0.76)), r: 6.0, color: '#72efdd', shape: 'trident', chillPlayer: true });
            }
            finishLinearDash(e, 2.45);
          }
        } else {
          e.dashT -= dt * slowFactor;
          if (e.dashT <= 0.50 && e.dashT > 0 && e.lockedAim === undefined) {
            lockLinearDash(e, a, 305, 0.50, '#48cae4');
          }
          if (e.dashT <= 0) {
            startLinearDash(e, a, 305, 0.36);
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 62, color: '#48cae4', t: 0.24, maxT: 0.24 });
            advanceLinearDash(e, dt);
          } else if (e.dashT > 0.50) {
            e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
          }
        }
        e.meteorT = (e.meteorT || 4.6) - dt;
        if (e.meteorT <= 0) {
          e.meteorT = 4.9;
          for (let step = 1; step <= 3; step++) {
            spawnHazard(e.x + Math.cos(a) * (step * 95), e.y + Math.sin(a) * (step * 95), 54, e.dmg * 1.06, 0.85 + step * 0.20, { color: '#38bdf8' });
          }
        }
      } else if (e.variant === 'iron_warden') {
        // 曜铁圣盾统领：十字重型旋转金锯盘 + 三段直线裂地重锤波
        if (distP > 130) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
        e.shotT = (e.shotT || 2.1) - dt * slowFactor;
        if (e.shotT <= 0) {
          e.shotT = 2.45;
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 78, color: '#ffd166', t: 0.24, maxT: 0.24 });
          for (let k = 0; k < 4 && eBullets.length < 170; k++) {
            const sa = a + k * (Math.PI * 0.5);
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 148, vy: Math.sin(sa) * 148, dmg: Math.max(4, Math.round(e.dmg * 0.76)), r: 7.8, color: '#ffd166', shape: 'disc', rot: 0 });
          }
        }
        e.meteorT = (e.meteorT || 4.4) - dt;
        if (e.meteorT <= 0) {
          e.meteorT = 4.8;
          addText(e.x, e.y - e.r - 14, '🛡️ 重锤裂地三连击!', '#ffd166', 13, 1.1);
          for (let step = 1; step <= 3; step++) {
            spawnHazard(e.x + Math.cos(a) * (step * 88), e.y + Math.sin(a) * (step * 88), 60, e.dmg * 1.12, 0.82 + step * 0.22, { color: '#eab308' });
          }
        }
      } else if (e.variant === 'storm_siren') {
        // 苍雷风暴统领：雷光长距疾闪冲刺 + 五向苍雷三叉戟 + 三角电磁雷网
        if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 68, color: '#38bdf8', t: 0.22, maxT: 0.22 });
            finishLinearDash(e, 2.50);
          }
        } else {
          e.dashT -= dt * slowFactor;
          if (e.dashT <= 0.48 && e.dashT > 0 && e.lockedAim === undefined) {
            lockLinearDash(e, a, 295, 0.48, '#38bdf8');
          }
          if (e.dashT <= 0) {
            startLinearDash(e, a, 295, 0.35);
            for (let k = -2; k <= 2 && eBullets.length < 170; k++) {
              const sa = a + k * 0.20;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 166, vy: Math.sin(sa) * 166, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.8, color: '#38bdf8', shape: 'trident' });
            }
            advanceLinearDash(e, dt);
          } else if (e.dashT > 0.48 && distP > 140) {
            e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
          }
        }
        e.meteorT = (e.meteorT || 4.6) - dt;
        if (e.meteorT <= 0) {
          e.meteorT = 4.9;
          const pts = [];
          for (let b = 0; b < 3; b++) {
            const ba = (b / 3) * Math.PI * 2 + e.phase * 0.3;
            const lx = player.x + Math.cos(ba) * 96, ly = player.y + Math.sin(ba) * 96;
            pts.push({ x: lx, y: ly });
            spawnHazard(lx, ly, 60, e.dmg * 1.05, 1.20, { color: '#38bdf8' });
          }
          if (lightnings.length < 35 && pts.length === 3) {
            lightnings.push({ pts: [pts[0], pts[1], pts[2], pts[0]], color: '#38bdf8', t: 0.34, maxT: 0.34 });
          }
        }
      } else {
        // 狂厄裂地统领：二连重甲蛮牛折返冲撞 + 绯红弯月裂地斩
        if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 78, color: '#f72585', t: 0.25, maxT: 0.25 });
            if ((e._vanguardCombo || 0) > 0) {
              e._vanguardCombo--;
              const reAim = Math.atan2(player.y - e.y, player.x - e.x);
              finishLinearDash(e, 0.46);
              lockLinearDash(e, reAim, 285, 0.46, '#f72585');
            } else {
              finishLinearDash(e, 2.75);
            }
          }
        } else {
          e.dashT -= dt * slowFactor;
          if (e.dashT <= 0.56 && e.dashT > 0 && e.lockedAim === undefined) {
            e._vanguardCombo = 1;
            lockLinearDash(e, a, 310, 0.56, '#f72585');
          }
          if (e.dashT <= 0) {
            startLinearDash(e, a, 310, 0.38);
            for (let k = -1; k <= 1 && eBullets.length < 170; k++) {
              const ba = a + k * 0.30;
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 162, vy: Math.sin(ba) * 162, dmg: Math.max(4, Math.round(e.dmg * 0.74)), r: 7.2, color: '#f72585', shape: 'crescent' });
            }
            advanceLinearDash(e, dt);
          } else if (e.dashT > 0.56) {
            e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
          }
        }
      }
    } else if (e.type === 'special_boss') {
      // 地图奇遇三大隐藏首领：彻底差异化技能演出（猩红血月斩 / 黄金锯盘晶柱阵 / 噬界奇点黑洞牵引）
      const enraged = (e.hp < e.maxHp * 0.5) || overtime || !!e.mythicPhase2;
      const sbMult = (enraged ? 1.15 : 1) * (e.mythicPhase2 ? 1.12 : 1);

      e.terrainCd = (e.terrainCd !== undefined ? e.terrainCd : 6.8) - dt * sbMult;
      if (e.terrainCd <= 0) {
        e.terrainCd = e.mythicPhase2 ? 6.8 : 8.4;
        const tKind = e.variant === 'golden_golem' ? 'chasm' : (e.variant === 'crimson_lord' ? 'lava' : 'swamp');
        const ta = Math.random() * Math.PI * 2, td = 110 + Math.random() * 110;
        spawnBossTerrain(tKind, e.x + Math.cos(ta) * td, e.y + Math.sin(ta) * td, 60);
      }

      if (e.variant === 'crimson_lord') {
        // 猩红鲜血伯爵：疾速血影冲刺 + 五连猩红弯月血刃扇 + 贴身血环斩
        e.ringCd = (e.ringCd !== undefined ? e.ringCd : 4.8) - dt * sbMult;
        if (e.ringCd <= 0) {
          e.ringCd = 5.8;
          spawnHazard(e.x, e.y, 228, e.dmg * 1.14, 1.26, { innerSafeR: 108, color: '#ff4d6d' });
          e.exposeT = 1.65;
          addText(e.x, e.y - e.r - 16, '🩸 猩红血环! 贴近风眼', '#ff4d6d', 14, 1.3);
        }
        if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 80, color: '#ff4d6d', t: 0.24, maxT: 0.24 });
            finishLinearDash(e, enraged ? 2.25 : 2.75);
            e.exposeT = Math.max(e.exposeT || 0, 0.95);
          }
        } else {
          e.dashT -= dt * slowFactor * sbMult;
          if (e.dashT <= 0.48 && e.dashT > 0 && e.lockedAim === undefined) {
            lockLinearDash(e, a, 335, 0.48);
          }
          if (e.dashT <= 0) {
            startLinearDash(e, a, 335, 0.36);
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 72, color: '#ff4d6d', t: 0.25, maxT: 0.25 });
            advanceLinearDash(e, dt);
          } else if (e.dashT > 0.48) {
            e.x += Math.cos(a) * curSpd * sbMult * dt; e.y += Math.sin(a) * curSpd * sbMult * dt;
          }
        }
        e.shotT = (e.shotT || 1.9) - dt * sbMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 1.80 : 2.25;
          const cnt = enraged ? 7 : 5;
          const half = (cnt - 1) / 2;
          for (let k = 0; k < cnt && eBullets.length < 170; k++) {
            const sa = a + (k - half) * 0.19;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 168, vy: Math.sin(sa) * 168, dmg: Math.max(4, Math.round(e.dmg * 0.76)), r: 7.0, color: '#ff4d6d', shape: 'crescent' });
          }
        }
        e.sumT = (e.sumT || 6.0) - dt * sbMult;
        if (e.sumT <= 0 && enemies.length < 70) {
          e.sumT = 6.6;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 170)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 170)), 'swarmer');
        }
      } else if (e.variant === 'golden_golem') {
        // 黄金晶石巨神：重装黄金锯盘与晶矛交错环 + 八方晶柱十字阵
        e.x += Math.cos(a) * curSpd * sbMult * dt; e.y += Math.sin(a) * curSpd * sbMult * dt;
        e.shotT = (e.shotT || 2.1) - dt * sbMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 1.95 : 2.45;
          if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 98, color: '#ffd166', t: 0.28, maxT: 0.28 });
          const cnt = enraged ? 10 : 8;
          for (let k = 0; k < cnt && eBullets.length < 170; k++) {
            const ba = (k / cnt) * Math.PI * 2 + e.phase * 0.45;
            const isDisc = k % 2 === 0;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * (isDisc ? 140 : 165), vy: Math.sin(ba) * (isDisc ? 140 : 165), dmg: Math.max(4, Math.round(e.dmg * 0.76)), r: isDisc ? 7.8 : 6.0, color: '#ffd166', shape: isDisc ? 'disc' : 'trident', rot: 0 });
          }
        }
        e.meteorT = (e.meteorT || 4.2) - dt * sbMult;
        if (e.meteorT <= 0) {
          e.meteorT = enraged ? 3.8 : 4.6;
          for (let b = 0; b < 4; b++) {
            const ha = (e.phase * 0.2) + b * (Math.PI * 0.5);
            spawnHazard(player.x + Math.cos(ha) * 86, player.y + Math.sin(ha) * 86, 62, e.dmg * 1.10, 1.22, { color: '#ffd166' });
          }
        }
        e.sumT = (e.sumT || 6.6) - dt * sbMult;
        if (e.sumT <= 0 && enemies.length < 70) {
          e.sumT = 7.4;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 180)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 180)), 'shielder');
        }
      } else {
        // 深渊噬界者：黑洞引力牵引玩家 + 正反双旋虚空月刃弹幕 + 分裂泥召唤
        if (distP > 150) { e.x += Math.cos(a) * curSpd * sbMult * dt; e.y += Math.sin(a) * curSpd * sbMult * dt; }
        if (distP > 75 && distP < 360 && !(player.dashT > 0)) {
          const pull = 38 * sbMult * dt;
          player.x = Math.max(player.r + 8, Math.min(WORLD.w - player.r - 8, player.x - Math.cos(a) * pull));
          player.y = Math.max(player.r + 8, Math.min(WORLD.h - player.r - 8, player.y - Math.sin(a) * pull));
        }
        e.shotT = (e.shotT || 1.8) - dt * sbMult;
        if (e.shotT <= 0) {
          e.shotT = enraged ? 1.60 : 2.0;
          const cnt = enraged ? 8 : 6;
          for (let k = 0; k < cnt && eBullets.length < 170; k++) {
            const ba = (k / cnt) * Math.PI * 2 + e.phase * 0.85;
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 154, vy: Math.sin(ba) * 154, dmg: Math.max(4, Math.round(e.dmg * 0.76)), r: 6.8, color: '#c77dff', shape: 'crescent' });
          }
        }
        e.ringCd = (e.ringCd !== undefined ? e.ringCd : 4.6) - dt * sbMult;
        if (e.ringCd <= 0) {
          e.ringCd = 5.6;
          spawnHazard(e.x, e.y, 138, e.dmg * 1.15, 1.18, { color: '#9d4edd' });
          addText(e.x, e.y - e.r - 16, '🌌 奇点坍缩! 速撤离黑洞核心!', '#e0aaff', 14, 1.3);
        }
        e.sumT = (e.sumT || 6.4) - dt * sbMult;
        if (e.sumT <= 0 && enemies.length < 70) {
          e.sumT = 7.2;
          spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 180)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 180)), 'splitter');
        }
      }
    } else if (e.type === 'charger' || e.type === 'sand_worm') {
      // 犀角冲锋兽 & 荒漠潜沙虫（100% 冲满预警走廊 + 终段践踏冲击尘圈，压迫感拉满！）
      const isWorm = e.type === 'sand_worm';
      const chargeDist = isWorm ? 245 : 255;
      const windupSec = isWorm ? 0.52 : 0.55;
      if (e.dashing) {
        if (!advanceLinearDash(e, dt)) {
          if (rings.length < 40) {
            rings.push({ x: e.x, y: e.y, r: 58, color: isWorm ? '#f4a261' : '#fb5607', t: 0.22, maxT: 0.22 });
          }
          finishLinearDash(e, isWorm ? 2.20 : 2.60);
        }
      } else {
        e.dashT -= dt * slowFactor;
        if (e.dashT <= windupSec && e.dashT > 0 && e.lockedAim === undefined) {
          lockLinearDash(e, a, chargeDist, windupSec);
        }
        if (e.dashT <= 0) {
          const ca = startLinearDash(e, a, chargeDist, isWorm ? 0.35 : 0.36);
          if (isWorm) addSparks(e.x, e.y, ca + Math.PI, '#f4a261', 5);
          advanceLinearDash(e, dt);
        } else if (e.dashT > windupSec) {
          e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
        }
      }
    } else if (e.type === 'stalker') {
      // 刀锋疾行螳：凌厉 Z 字折线切角走位（每 0.42s 急折 ±50° 并迸射翠光火星） + 近身双镰十字斩
      e.zigT = (e.zigT === undefined ? 0.38 : e.zigT) - dt * slowFactor;
      if (e.zigT <= 0) {
        e.zigT = 0.38 + Math.random() * 0.14;
        e.zigDir = -(e.zigDir || 1);
        addSparks(e.x, e.y, a + Math.PI * 0.5 * e.zigDir, '#06d6a0', 2);
      }
      const zigAngle = distP < 58 ? a : (a + (e.zigDir || 1) * 0.88);
      const zigSpd = distP < 58 ? 1.25 : 1.32;
      e.faceA = zigAngle;
      e.x += Math.cos(zigAngle) * curSpd * zigSpd * dt;
      e.y += Math.sin(zigAngle) * curSpd * zigSpd * dt;
      e.slashCd = (e.slashCd || 0) - dt * slowFactor;
      if (distP < 68 && e.slashCd <= 0) {
        e.slashCd = 0.95;
        if (slashes.length < 36) slashes.push({ x: e.x + Math.cos(a) * 14, y: e.y + Math.sin(a) * 14, angle: a, r: 46, color: '#06d6a0', mode: 'claw', t: 0.16, maxT: 0.16 });
      }
    } else if (e.type === 'sniper_bug') {
      // 晶刺狙击虫：远距三脚驻守 + 0.55s 细红瞄准线锁定 + 高速猩红穿刺骨针
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
      // 旋刃飞盘虫：中距横向环绕游走 + 投掷旋转十字金刃飞盘
      if (distP > 245) {
        e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
      } else {
        const oa = a + (e.orbitDir || 1) * 1.18;
        e.x += Math.cos(oa) * curSpd * 0.85 * dt; e.y += Math.sin(oa) * curSpd * 0.85 * dt;
      }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.10 : 2.65;
        if (eBullets.length < 170) {
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 144, vy: Math.sin(a) * 144, dmg: e.dmg, r: 8.2, color: '#ffd166', shape: 'disc', rot: 0 });
        }
      }
    } else if (e.type === 'rad_scorpion') {
      // 晶化毒蝎：横向摆尾逼近 + 发射醒目的【三叉戟】三向毒刺扇（全场景第 2 层起解锁！）
      if (distP > 235) {
        const scorpA = a + Math.sin(e.phase * 0.7) * 0.36;
        e.x += Math.cos(scorpA) * curSpd * dt; e.y += Math.sin(scorpA) * curSpd * dt;
      } else if (distP < 140) {
        e.x -= Math.cos(a) * curSpd * 0.45 * dt; e.y -= Math.sin(a) * curSpd * 0.45 * dt;
      }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 1.95 : 2.45;
        for (let k = -1; k <= 1 && eBullets.length < 170; k++) {
          const sa = a + k * 0.25;
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa) * 162, vy: Math.sin(sa) * 162, dmg: Math.max(3, Math.round(e.dmg * 0.88)), r: 5.8, color: '#80ff72', shape: 'trident' });
        }
      }
    } else if (e.type === 'frost_wisp') {
      // 凛冬冰魄：环绕侧滑游走 + 发射寒霜三叉戟（命中附带短暂冻缓）
      if (distP > 235) {
        e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
      } else {
        const oa = a + (e.orbitDir || 1) * 1.15;
        e.x += Math.cos(oa) * curSpd * 0.72 * dt; e.y += Math.sin(oa) * curSpd * 0.72 * dt;
      }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 1.85 : 2.35;
        if (eBullets.length < 170) {
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 168, vy: Math.sin(a) * 168, dmg: e.dmg, r: 5.8, color: '#72efdd', shape: 'trident', chillPlayer: true });
        }
      }
    } else if (e.type === 'spore_mother') {
      // 剧毒孢子母体：抛射剧毒雾沼红圈 + 吐出紫晶毒戟 + 亡语分裂双子软泥
      if (distP > 240) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.5 : 3.1;
        spawnHazard(player.x + (Math.random() - 0.5) * 65, player.y + (Math.random() - 0.5) * 65, 64, e.dmg, 1.25, { color: '#a3e635' });
        if (eBullets.length < 170) {
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 145, vy: Math.sin(a) * 145, dmg: Math.max(3, Math.round(e.dmg * 0.85)), r: 5.8, color: '#c77dff', shape: 'trident' });
        }
      }
    } else if (e.type === 'shooter') {
      // 酸液喷毒虫：拉扯风筝走位 + 从第 1 层起即喷吐双联 V 字分叉碧绿毒液（精英/高波三联毒雾扇！）
      if (distP > 245) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      else if (distP < 145) { e.x -= Math.cos(a) * curSpd * 0.55 * dt; e.y -= Math.sin(a) * curSpd * 0.55 * dt; }
      else {
        const strafeA = a + Math.sin(e.phase * 0.45) * 1.25;
        e.x += Math.cos(strafeA) * curSpd * 0.52 * dt; e.y += Math.sin(strafeA) * curSpd * 0.52 * dt;
      }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 1.95 : 2.45;
        const leadX = player.x + (player.moving ? dx * 12 : 0);
        const leadY = player.y + (player.moving ? dy * 12 : 0);
        const sa = Math.atan2(leadY - e.y, leadX - e.x);
        addSparks(e.x + Math.cos(sa) * e.r, e.y + Math.sin(sa) * e.r, sa, '#00f5d4', 2);
        if ((wave >= 7 || e.elite) && eBullets.length < 167) {
          for (let k = -1; k <= 1; k++) {
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa + k * 0.18) * 165, vy: Math.sin(sa + k * 0.18) * 165, dmg: e.dmg, r: 5.4, color: '#00f5d4', shape: 'acid' });
          }
        } else if (eBullets.length < 168) {
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa - 0.15) * 164, vy: Math.sin(sa - 0.15) * 164, dmg: e.dmg, r: 5.3, color: '#00f5d4', shape: 'acid' });
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(sa + 0.15) * 164, vy: Math.sin(sa + 0.15) * 164, dmg: e.dmg, r: 5.3, color: '#00f5d4', shape: 'acid' });
        }
      }
    } else if (e.type === 'splitter') {
      // 分裂软泥怪：弹性一蹦一跳脉冲逼近 + 中距喷吐腐蚀粘液球 + 击杀分裂 3 只高速小软泥！
      if ((e.vx || e.vy) && (Math.abs(e.vx) > 4 || Math.abs(e.vy) > 4)) {
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.vx *= Math.max(0, 1 - dt * 6); e.vy *= Math.max(0, 1 - dt * 6);
      }
      e.hopT = (e.hopT === undefined ? 0.9 : e.hopT) - dt * slowFactor;
      if (e.hopT <= 0) {
        e.hopT = 1.05 + Math.random() * 0.25;
        e.hopBurstT = 0.28;
        if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: e.r + 12, color: '#74c69d', t: 0.18, maxT: 0.18 });
      }
      let hopMul = 0.55;
      if ((e.hopBurstT || 0) > 0) {
        e.hopBurstT -= dt;
        hopMul = 2.05;
      }
      const hopA = a + Math.sin(e.phase * 0.5) * 0.28;
      e.x += Math.cos(hopA) * curSpd * hopMul * dt;
      e.y += Math.sin(hopA) * curSpd * hopMul * dt;
      e.spitT = (e.spitT === undefined ? 2.4 : e.spitT) - dt * slowFactor;
      if (e.spitT <= 0 && distP < 270 && distP > 75 && eBullets.length < 170) {
        e.spitT = 2.85;
        eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 148, vy: Math.sin(a) * 148, dmg: Math.max(3, Math.round(e.dmg * 0.85)), r: 5.6, color: '#74c69d', shape: 'acid' });
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
      // 虫巢唤魔师：召唤迅捷虫群 + 吟唱释放双子暗紫追踪弯刃
      if (distP > 320) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      else if (distP < 180) { e.x -= Math.cos(a) * curSpd * 0.7 * dt; e.y -= Math.sin(a) * curSpd * 0.7 * dt; }
      e.sumT -= dt * slowFactor;
      if (e.sumT <= 0 && enemies.length < 44) {
        e.sumT = 5.4;
        if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 55, color: '#c77dff', t: 0.3, maxT: 0.3 });
        spawnWarning(Math.max(70, Math.min(WORLD.w - 70, e.x + (Math.random() - 0.5) * 130)), Math.max(70, Math.min(WORLD.h - 70, e.y + (Math.random() - 0.5) * 130)), 'swarmer');
      }
      e.boltT = (e.boltT || 2.5) - dt * slowFactor;
      if (e.boltT <= 0) {
        e.boltT = 3.0;
        for (const s of [-0.14, 0.14]) {
          if (eBullets.length < 170) {
            eBullets.push({ x: e.x, y: e.y, vx: Math.cos(a + s) * 132, vy: Math.sin(a + s) * 132, dmg: e.dmg, r: 6.2, color: '#c77dff', shape: 'crescent' });
          }
        }
      }
    } else if (e.type === 'healer') {
      if (distP > 210) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.healT -= dt * slowFactor;
      if (e.healT <= 0) {
        e.healT = 2.8;
        if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 190, color: '#52b788', t: 0.35, maxT: 0.35 });
        for (let ai = 0; ai < enemies.length; ai++) {
          const ally = enemies[ai];
          if (!ally || ally.hp <= 0 || ally.hp >= ally.maxHp) continue;
          const adx = ally.x - e.x, ady = ally.y - e.y;
          if (adx * adx + ady * ady <= 190 * 190) {
            const h = Math.round(ally.maxHp * 0.14 + 4);
            ally.hp = Math.min(ally.maxHp, ally.hp + h);
            addText(ally.x, ally.y - ally.r, '+' + h, '#52b788', 12, 0.45, false);
          }
        }
      }
    } else {
      // S形蛇行虫群 / 蓄力飞扑噬咬甲虫 / 重甲巨兽震地锤 / 巨神兵冲击波 等差异化近战生态
      let moveMul = 1;
      let moveA = a;
      if (e.type === 'swarmer' || e.type === 'mini_slime') {
        if ((e.vx || e.vy) && (Math.abs(e.vx) > 4 || Math.abs(e.vy) > 4)) {
          e.x += e.vx * dt; e.y += e.vy * dt;
          e.vx *= Math.max(0, 1 - dt * 7); e.vy *= Math.max(0, 1 - dt * 7);
        }
        moveA = a + Math.sin(e.phase * 0.45) * 0.62;
      } else if (e.type === 'magma_imp') {
        moveA = a + Math.sin(e.phase * 0.85) * 0.55;
        if (Math.random() < dt * 8) {
          pushParticle({ x: e.x + (Math.random() - 0.5) * 10, y: e.y + 4, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 20, r: 3, color: '#ff9f1c', t: 0.22, maxT: 0.22 });
        }
      } else if (e.type === 'chaser') {
        e.lungeCd = (e.lungeCd || 1.9) - dt * slowFactor;
        if (e.lungeCd <= 0 && distP < 125 && distP > 34) {
          e.lungeCd = 2.35;
          e.lungeBoostT = 0.26;
          e._lungeA = a;
          addSparks(e.x, e.y, a + Math.PI, '#ff758f', 3);
          if (slashes.length < 36) slashes.push({ x: e.x + Math.cos(a) * 16, y: e.y + Math.sin(a) * 16, angle: a, r: 36, color: '#ff758f', mode: 'spear', t: 0.18, maxT: 0.18 });
        }
        if (e.lungeBoostT > 0) {
          e.lungeBoostT -= dt;
          moveMul = 2.35;
          if (e._lungeA !== undefined) moveA = e._lungeA;
        } else {
          moveA = a + Math.sin(e.phase * 0.5) * 0.24;
        }
      } else if (e.type === 'brute' || e.type === 'juggernaut') {
        const isJug = e.type === 'juggernaut';
        if (e.slamWindup > 0) {
          e.slamWindup -= dt * slowFactor;
          moveMul = 0.15;
          if (e.slamWindup <= 0) {
            const slamR = isJug ? 108 : 88;
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: slamR, color: isJug ? '#94a3b8' : '#c77dff', t: 0.26, maxT: 0.26, fill: true });
            if (isJug) {
              for (let k = 0; k < 6 && eBullets.length < 170; k++) {
                const ba = (k / 6) * Math.PI * 2 + e.phase * 0.3;
                eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 135, vy: Math.sin(ba) * 135, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.6, color: '#cbd5e1', shape: 'shard' });
              }
            }
            if (distP < slamR - 4 + player.r) {
              hurtPlayer(Math.round(e.dmg * 1.15));
              if (state !== 'wave') return;
            }
          }
        } else {
          e.slamCd = (e.slamCd || 2.5) - dt * slowFactor;
          if (distP < (isJug ? 115 : 92) && e.slamCd <= 0) {
            e.slamCd = isJug ? 3.3 : 2.9;
            e.slamWindup = 0.44;
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: isJug ? 104 : 84, color: isJug ? '#cbd5e1' : '#e0aaff', t: 0.42, maxT: 0.42 });
          }
        }
      }
      e.faceA = moveA;
      e.x += Math.cos(moveA) * curSpd * moveMul * dt; e.y += Math.sin(moveA) * curSpd * moveMul * dt;
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
        // 正在高速直线冲锋的单位直接撞开普通小怪，绝不被杂兵软碰撞顶回吞掉冲刺距离！
        if (e.dashing && !o.dashing) {
          o.x += nx * push * 2; o.y += ny * push * 2;
        } else if (o.dashing && !e.dashing) {
          e.x -= nx * push * 2; e.y -= ny * push * 2;
        } else {
          e.x -= nx * push; e.y -= ny * push;
          o.x += nx * push; o.y += ny * push;
        }
      }
    }

    if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) { e.x = WORLD.w * 0.5; e.y = WORLD.h * 0.5; }
    if (!isBossUnit && terrains.length > 0) pushOutOfChasms(e);
    e.x = Math.max(e.r + 6, Math.min(WORLD.w - e.r - 6, e.x));
    e.y = Math.max(e.r + 6, Math.min(WORLD.h - e.r - 6, e.y));
    if (!e.primed) {
      const pdx = player.x - e.x, pdy = player.y - e.y, pHitR = player.r + e.r - 4;
      if (pdx * pdx + pdy * pdy < pHitR * pHitR && !(e._touchCd > 0)) {
        e._touchCd = e.dashing ? 0.36 : 0.50;
        if (player.cls === 'bull') triggerBullNova();
        hurtPlayer(e.dmg);
        if (state !== 'wave') return;
      }
    }
  }
  compactAliveEnemies();

  // 敌方弹幕（支持旋刃飞盘自转、沙暴减速、冰魄寒霜附着，擦弹容错判定友好）
  const ebSpdMul = sandGustT > 0 ? 0.78 : 1;
  for (let i = eBullets.length - 1; i >= 0; i--) {
    const b = eBullets[i];
    b.x += b.vx * ebSpdMul * dt; b.y += b.vy * ebSpdMul * dt;
    if (b.shape === 'disc') b.rot = (b.rot || 0) + dt * 14;
    if (b.x < 0 || b.x > WORLD.w || b.y < 0 || b.y > WORLD.h) { eBullets.splice(i, 1); continue; }
    const bdx = player.x - b.x, bdy = player.y - b.y, bHitR = Math.max(4, player.r + b.r - 5);
    if (bdx * bdx + bdy * bdy < bHitR * bHitR) {
      if (b.chillPlayer && !player.noSlow) player.chillSlowT = 1.25;
      hurtPlayer(b.dmg);
      eBullets.splice(i, 1);
      if (state !== 'wave') return;
    }
  }

  // 掉落晶石 / 血包果实 / 战利品宝箱散射弹跳与指数级魂灯磁吸结算
  const effMag = player.magnet + ((player.magnetPulseT || 0) > 0 ? 135 : 0);
  const magSq = effMag * effMag;
  const pickR = player.r + 14, pickSq = pickR * pickR;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.bob += dt * 5;
    if ((d.popT || 0) > 0) {
      d.popT -= dt;
      d.x = Math.max(22, Math.min(WORLD.w - 22, d.x + (d.vx || 0) * dt));
      d.y = Math.max(22, Math.min(WORLD.h - 22, d.y + (d.vy || 0) * dt));
      d.vx = (d.vx || 0) * Math.max(0, 1 - dt * 7.5);
      d.vy = (d.vy || 0) * Math.max(0, 1 - dt * 7.5);
    }
    const ddx = player.x - d.x, ddy = player.y - d.y;
    const distSq = ddx * ddx + ddy * ddy;
    if ((d.popT || 0) <= 0.04 && distSq < magSq && distSq > 0.01) {
      const dist = Math.sqrt(distSq);
      const pullSpd = 560 + (effMag - dist) * 2.5;
      d.x += (ddx / dist) * pullSpd * dt; d.y += (ddy / dist) * pullSpd * dt;
    }
    if (distSq < pickSq) {
      if (d.kind === 'mat') {
        const v = d.val || 1;
        const xpScale = wave === 1 ? 0.68 : (wave >= 7 ? 0.58 : 0.54);
        const rawXp = v * xpScale * player.harvest;
        const xpGain = Math.floor(rawXp) + (Math.random() < (rawXp % 1) ? 1 : 0);
        const matRate = typeof getWaveMatRate === 'function' ? getWaveMatRate(wave) : (0.92 / (1 + Math.min(5, Math.max(0, wave - 1)) * 0.14 + Math.max(0, wave - 6) * 0.075));
        const rawMat = v * player.harvest * matRate;
        const matGain = Math.floor(rawMat) + (Math.random() < (rawMat % 1) ? 1 : 0);
        player.mats += matGain; player.xp += xpGain;
        beep(780, 0.022, 'sine', 0.022);
        // 【幸运弹珠】拾取晶石概率落雷轰击场上随机怪物（零临时数组分配抽样）
        if (player.cyberball > 0 && enemies.length > 0 && Math.random() < Math.min(0.60, (0.16 + (player.luck || 0) * 0.005) * player.cyberball)) {
          const te = pickRandomAliveEnemy(null);
          if (te) {
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
          addText(player.x, player.y - 36, 'LEVEL UP!', '#ffd166', 22, 1.9, true);
          beep(920, 0.12, 'triangle', 0.06);
        }
      } else if (d.kind === 'crate') {
        if (d.isMythic || pendingCrates < 3) {
          pendingCrates++;
          if (d.isMythic) {
            player.mythicCratesQueued = (player.mythicCratesQueued || 0) + 1;
            addText(player.x, player.y - 36, '⚡ 神话传说秘宝 +1!', '#ffd166', 21, 2.2, true);
            announce('⚡ 拾取神话二阶段秘宝舱！波次结算时必出红色传说神装！', '#ffd166', 3.4);
          } else {
            if (d.isBoss) player.bossCratesQueued = (player.bossCratesQueued || 0) + 1;
            addText(player.x, player.y - 34, d.isBoss ? '👑 首领秘宝 +1' : '🎁 宝箱 +1', '#ffd166', 19, 2.0, true);
            announce(d.isBoss ? '👑 拾取首领秘宝箱！波次结算时可二选一开启' : '🎁 拾取异星战利品箱！波次结算时可二选一开启', '#ffd166', 2.8);
          }
          beep(880, 0.11, 'triangle', 0.06);
        } else {
          const yieldMul = typeof CRYSTAL_YIELD_MUL === 'number' ? CRYSTAL_YIELD_MUL : 0.70;
          const bonusMat = Math.max(8, Math.round((16 + wave * 3) * yieldMul));
          player.mats += bonusMat;
          player.hp = Math.min(player.maxHp, player.hp + 6);
          addText(player.x, player.y - 34, `🎁 满载折算 +${bonusMat}💎 +6HP`, '#ffd166', 17, 2.0, true);
          beep(780, 0.09, 'sine', 0.05);
        }
      } else {
        const healAmt = 5 + (player.healBonus || 0);
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        addText(player.x, player.y - 28, `+${healAmt} HP`, '#6ede8a', 17, 0.75, false);
        beep(640, 0.08, 'sine', 0.05);
      }
      drops.splice(i, 1);
    }
  }

  // 特效生命周期更新（高频粒子与火花采用原地紧缩，零 splice 位移开销）
  let pw = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.t -= dt;
    if (p.t > 0) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      particles[pw++] = p;
    }
  }
  particles.length = pw;

  let sw = 0;
  for (let i = 0; i < sparks.length; i++) {
    const sp = sparks[i];
    sp.t -= dt;
    if (sp.t > 0) {
      sp.x += sp.vx * dt; sp.y += sp.vy * dt;
      sparks[sw++] = sp;
    }
  }
  sparks.length = sw;

  for (let i = lightnings.length - 1; i >= 0; i--) { lightnings[i].t -= dt; if (lightnings[i].t <= 0) lightnings.splice(i, 1); }
  for (let i = rings.length - 1; i >= 0; i--) { rings[i].t -= dt; if (rings[i].t <= 0) rings.splice(i, 1); }
  for (let i = slashes.length - 1; i >= 0; i--) { slashes[i].t -= dt; if (slashes[i].t <= 0) slashes.splice(i, 1); }
  for (let i = beams.length - 1; i >= 0; i--) { beams[i].t -= dt; if (beams[i].t <= 0) beams.splice(i, 1); }
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; s.rot += 12 * dt; s.t -= dt;
    if (s.t <= 0) shells.splice(i, 1);
  }
  let tw = 0;
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    t.t -= dt;
    if (t.t > 0) {
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      if (t.important) t.vy *= Math.max(0, 1 - dt * 1.2);
      else t.vy += 240 * dt;
      texts[tw++] = t;
    }
  }
  texts.length = tw;

  // 更新高清 HUD（节流 + 脏值比对，避免每帧强制触发手机 DOM 重排）
  hudAcc += dt;
  if (hudAcc >= 0.08) {
    hudAcc = 0;
    const safeMaxHp = Math.max(1, player.maxHp || 1);
    const safeXpNeed = Math.max(1, player.xpNeed || 10);
    setHudWidth('hpFill', Math.max(0, Math.round((player.hp / safeMaxHp) * 1000) / 10) + '%');
    setHudWidth('shFill', player.maxShield > 0 ? Math.min(100, Math.round((player.shield / safeMaxHp) * 1000) / 10) + '%' : '0%');
    const shTxt = player.maxShield > 0 ? ` · 护盾 ${Math.ceil(player.shield)}` : '';
    setHudText('hpText', `${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp}${shTxt}`);
    setHudWidth('xpFill', Math.min(100, Math.round((player.xp / safeXpNeed) * 1000) / 10) + '%');
    setHudText('xpText', `Lv.${player.lv}${pendingLevels ? ' (+' + pendingLevels + ')' : ''}`);
    setHudText('hudKills', `净化 ${player.kills}`);
    const crateTxt = pendingCrates > 0 ? ` · 遗匣×${pendingCrates}` : '';
    setHudText('hudWeapons', player.maxSlots === 0 ? `铁卫形态${crateTxt}` : `兵装 ${player.weapons.length}/${player.maxSlots}${turrets.length ? ' · 机关×' + turrets.length : ''}${crateTxt}`);
    const isFixedBossFloor = (!endlessMode && wave <= MAX_WAVE && wave % 4 === 0);
    const waveTag = endlessMode
      ? `无尽第 ${wave} 层`
      : (wave === MAX_WAVE
          ? `第 ${wave} 层 · 终幕真我`
          : (isFixedBossFloor
              ? `第 ${wave} 层 · 守誓决战`
              : (hordeWave ? `潮涌 ${wave}/${MAX_WAVE} 层` : `第 ${wave} / ${MAX_WAVE} 层`)));
    setHudText('waveTitle', uiMode === 'desktop' ? `${diff.badge}  ·  ${curScene.name}  ·  ${waveTag}` : `${diff.badge}  ·  ${waveTag}`);
    setHudText('waveTimer', overtime ? '死斗' : String(Math.ceil(Math.max(0, waveTime))));
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
    setHudText('matText', `◇ ${player.mats}`);

    // 同步桌面端青焰瞬步充能条 & 移动端拇指瞬步键冷却状态
    const dCd = player.dashCd || 0;
    const dMax = Math.max(0.5, player.dashMaxCd || 3.2);
    const dashCooling = dCd > 0.02;
    const dashPct = dashCooling ? Math.max(0, Math.min(100, (1 - dCd / dMax) * 100)) : 100;
    setHudWidth('hudDashFill', dashPct.toFixed(1) + '%');
    setHudText('hudDashText', dashCooling ? `瞬步冷却 ${dCd.toFixed(1)}s` : '◆ 瞬步就绪 [Space]');
    setHudText('dashTouchLabel', dashCooling ? `${dCd.toFixed(1)}s` : '瞬步');
    if (hudCache.dashCooling !== dashCooling) {
      hudCache.dashCooling = dashCooling;
      const dwEl = hudEls.hudDashWrap || (hudEls.hudDashWrap = document.getElementById('hudDashWrap'));
      if (dwEl) dwEl.classList.toggle('cooling', dashCooling);
      const dtEl = hudEls.dashTouchBtn || (hudEls.dashTouchBtn = document.getElementById('dashTouchBtn'));
      if (dtEl) dtEl.classList.toggle('cooling', dashCooling);
    }

    let bossCnt = 0, bossCur = 0, bossTot = 0, anyMythicBoss = false, activeCastLabel = '';
    const bossTitles = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if ((e.type === 'boss' || e.type === 'mini_boss' || e.type === 'special_boss') && e.hp > 0) {
        bossCnt++;
        bossCur += Math.max(0, e.hp);
        bossTot += e.maxHp;
        if (e.mythicPhase2) anyMythicBoss = true;
        if (!activeCastLabel && e.castLabel && ((e.sigWindupT || 0) > 0 || (e.castEndT || 0) > 0)) {
          activeCastLabel = (e.sigWindupT || 0) > 0 ? `⚠️ 蓄力咏唱 · ${e.castLabel}` : `💥 释放杀招 · ${e.castLabel}`;
        }
        const bt = e.bossTitle || (e.type === 'mini_boss' ? '⚔️ 雨夜守桥重铠武者' : '👑 绯红断刃剑姬 · 烬羽');
        if (bossTitles.length < 2 && !bossTitles.includes(bt)) bossTitles.push(bt);
      }
    }
    const pendingBossSpawn = spawns.some(s => s.type === 'boss' || s.type === 'mini_boss' || s.type === 'special_boss');
    const bwEl = hudEls.bossBarWrap || (hudEls.bossBarWrap = document.getElementById('bossBarWrap'));
    const bcsEl = hudEls.bossCastSub || (hudEls.bossCastSub = document.getElementById('bossCastSub'));
    if (bossCnt > 0) {
      if (bwEl) {
        if (bwEl.classList.contains('hidden')) bwEl.classList.remove('hidden');
        bwEl.classList.toggle('mythic', anyMythicBoss);
      }
      if (bcsEl) {
        if (activeCastLabel) {
          if (bcsEl.classList.contains('hidden')) bcsEl.classList.remove('hidden');
          setHudText('bossCastSub', activeCastLabel);
        } else if (!bcsEl.classList.contains('hidden')) {
          bcsEl.classList.add('hidden');
        }
      }
      const bName = bossTitles.length > 1 ? bossTitles.join(' & ') : (bossCnt > 1 ? `${bossTitles[0]} ×${bossCnt}` : bossTitles[0]);
      if (hudCache.bossName !== bName) {
        hudCache.bossName = bName;
        const bnEl = hudEls.bossName || (hudEls.bossName = document.querySelector('.boss-name'));
        if (bnEl) bnEl.textContent = bName;
      }
      setHudWidth('bossFill', Math.round((bossCur / Math.max(1, bossTot)) * 1000) / 10 + '%');
    } else if (!pendingBossSpawn) {
      setHudWidth('bossFill', '0%');
      if (bcsEl && !bcsEl.classList.contains('hidden')) bcsEl.classList.add('hidden');
      if (bwEl) {
        bwEl.classList.remove('mythic');
        if (!bwEl.classList.contains('hidden')) bwEl.classList.add('hidden');
      }
    }
  }
}
