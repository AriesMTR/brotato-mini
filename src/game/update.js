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

function unmarkBulletHitForBounce(b, nextTarget, curHit) {
  if (b.hit) b.hit.delete(nextTarget);
  if (curHit) {
    if (b.lastHit && b.lastHit !== curHit) {
      if (!b.hit) b.hit = new Set();
      b.hit.add(b.lastHit);
    }
    b.lastHit = curHit;
    if (b.hit) b.hit.add(curHit);
  }
}

function _lerpAngle(cur, target, t) {
  if (!Number.isFinite(cur)) return target;
  let diffA = (target - cur) % (Math.PI * 2);
  if (diffA > Math.PI) diffA -= Math.PI * 2;
  else if (diffA < -Math.PI) diffA += Math.PI * 2;
  return cur + diffA * t;
}

const _meleeTargets = [];
const _activePoolTerrains = [];

// 远程投射物严格「先弹射、后穿透」核心索敌器：优先消耗 bounces 折向邻近敌人（不扣 pierce），耗尽弹射次数后才进入穿透阶段
function bounceBulletToNearest(b, curEnemy) {
  if (!(b.bounces > 0)) return false;
  let nextE = null, nextDSq = 410 * 410, reusedHit = false;
  for (let ci = 0; ci < enemies.length; ci++) {
    const cand = enemies[ci];
    if (cand && cand !== curEnemy && cand.hp > 0 && !cand.primed && !hasBulletHit(b, cand)) {
      const cdx = cand.x - b.x, cdy = cand.y - b.y;
      if (cdx >= 410 || cdx <= -410 || cdy >= 410 || cdy <= -410) continue;
      const cdSq = cdx * cdx + cdy * cdy;
      if (cdSq < nextDSq) { nextDSq = cdSq; nextE = cand; }
    }
  }
  // 场上仅存双目标（双王 / 首领+单精英）时允许往返乒乓弹射，杜绝弹射次数闲置直接穿透飞走
  if (!nextE && curEnemy) {
    nextDSq = 385 * 385;
    for (let ci = 0; ci < enemies.length; ci++) {
      const cand = enemies[ci];
      if (cand && cand !== curEnemy && cand.hp > 0 && !cand.primed) {
        const cdx = cand.x - b.x, cdy = cand.y - b.y;
        if (cdx >= 385 || cdx <= -385 || cdy >= 385 || cdy <= -385) continue;
        const cdSq = cdx * cdx + cdy * cdy;
        if (cdSq < nextDSq) { nextDSq = cdSq; nextE = cand; reusedHit = true; }
      }
    }
  }
  if (!nextE) return false;
  if (reusedHit) unmarkBulletHitForBounce(b, nextE, curEnemy);
  if (b.isGrenade) {
    triggerExplosion(b.x, b.y, b.blastR || 76, b.dmg * 0.72, false, 0, '#ff9f1c', false);
  }
  const spd = Math.max(240, Math.hypot(b.vx, b.vy));
  const na = Math.atan2(nextE.y - b.y, nextE.x - b.x);
  b.vx = Math.cos(na) * spd;
  b.vy = Math.sin(na) * spd;
  b.angle = na;
  b.x += Math.cos(na) * 4;
  b.y += Math.sin(na) * 4;
  b.bounces--;
  b.dmg *= (0.92 + (player.bounceAmpDmg || 0));
  const flightNeed = (Math.sqrt(nextDSq) + 135) / spd;
  b.life = Math.max(b.life, Math.min(1.35, Math.max(0.52, flightNeed)));
  b.maxLife = Math.max(b.maxLife || b.life, b.life);
  if (typeof _frameSparks !== 'undefined' && _frameSparks < 14) {
    _frameSparks++;
    addSparks(b.x, b.y, na, b.isGrenade ? '#ff9f1c' : (b.isPebble ? '#e2e8f0' : '#72efdd'), 2);
  }
  if (typeof _frameHitBeeps !== 'undefined' && _frameHitBeeps < 2) {
    _frameHitBeeps++;
    beep(b.isPebble ? 490 : 610, 0.022, 'triangle', 0.018);
  }
  return true;
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

function lockLinearDash(e, ang, desiredLen, windupMax, dashColor = '', dashStyle = 'corridor') {
  e.lockedAim = ang;
  e.dashWindupMax = windupMax;
  e.dashWarnLen = computeDashAllowedLen(e.x, e.y, ang, desiredLen, e.r);
  e.dashWarnColor = dashColor || '';
  e.dashStyle = dashStyle || 'corridor';
}

function startLinearDash(e, fallbackAng, desiredLen, dashDur) {
  const ca = e.lockedAim !== undefined ? e.lockedAim : fallbackAng;
  const dist = e.dashWarnLen || computeDashAllowedLen(e.x, e.y, ca, desiredLen, e.r);
  const dashSpdMul = typeof MONSTER_SPD_MUL === 'number' ? MONSTER_SPD_MUL : 0.80;
  e.dashing = true;
  e.dashAng = ca;
  e.dashWarnLen = dist;
  e.dashRem = dist;
  e.dashSpd = (dist / Math.max(0.18, dashDur)) * dashSpdMul;
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
  e.dashStyle = undefined;
  e.dashRem = 0;
  e.dashT = nextCd;
}

// 首领高压扇形喷毒吐息状态机（扇面预警 -> 持续偏转横扫毒雾喷流 + 酸液飞沫 + 扇区腐蚀判定）
function tickBossVenomBreath(e, dt, aimToPlayer, paceMult) {
  const canVenom = (
    e.variant === 'plague_empress' ||
    e.variant === 'void_weaver' ||
    e.variant === 'venom_matriarch' ||
    (e.type === 'special_boss' && e.variant === 'abyss_devourer')
  );
  if (!canVenom && !(e.venomWindupT > 0) && !(e.venomBreathT > 0)) return false;

  if ((e.venomWindupT || 0) > 0) {
    e.venomWindupT -= dt;
    e.venomAimA = _lerpAngle(e.venomAimA, aimToPlayer, Math.min(1, dt * 2.2));
    if (e.venomWindupT <= 0) {
      e.venomWindupT = 0;
      e.venomBreathMax = e.venomTwin ? 1.80 : 1.55;
      e.venomBreathT = e.venomBreathMax;
      e._venomPulseCd = 0;
      e._venomHitCd = 0;
      beep(195, 0.16, 'sawtooth', 0.06);
      addText(e.x, e.y - e.r - 20, e.venomTwin ? '☠️ 双龙万蛊毒息横扫!' : '☠️ 剧毒龙息喷流!', '#a3e635', 14, 1.35, true);
    }
    return false;
  }

  if ((e.venomBreathT || 0) > 0) {
    e.venomBreathT -= dt;
    e.venomAimA = _lerpAngle(e.venomAimA, aimToPlayer, Math.min(1, dt * (e.venomTwin ? 1.15 : 0.92)));
    const vLen = e.venomLen || 278;
    const vSpan = e.venomSpan || 0.46;
    const nozzles = e.venomTwin ? [0, Math.PI] : [0];

    e._venomPulseCd = (e._venomPulseCd || 0) - dt;
    if (e._venomPulseCd <= 0) {
      e._venomPulseCd = 0.16;
      for (let ni = 0; ni < nozzles.length; ni++) {
        const na = (e.venomAimA || 0) + nozzles[ni];
        for (let pk = 0; pk < 3; pk++) {
          const pa = na + (Math.random() - 0.5) * vSpan * 1.75;
          const pSpd = 190 + Math.random() * 145;
          pushParticle({
            x: e.x + Math.cos(na) * (e.r * 0.65),
            y: e.y + Math.sin(na) * (e.r * 0.65),
            vx: Math.cos(pa) * pSpd,
            vy: Math.sin(pa) * pSpd,
            r: 4.2 + Math.random() * 3.4,
            color: pk === 0 ? '#a3e635' : (pk === 1 ? '#10b981' : '#d9f99d'),
            t: 0.34, maxT: 0.34
          });
        }
        if (eBullets.length < 168) {
          const ba = na + (Math.random() - 0.5) * vSpan * 1.35;
          const bSpd = 152 + Math.random() * 36;
          eBullets.push({
            x: e.x + Math.cos(na) * (e.r * 0.62),
            y: e.y + Math.sin(na) * (e.r * 0.62),
            px: e.x, py: e.y,
            vx: Math.cos(ba) * bSpd, vy: Math.sin(ba) * bSpd,
            life: 1.55,
            dmg: Math.max(4, Math.round(e.dmg * 0.72)),
            r: 5.8, hitR: 5.0,
            color: ni === 0 ? '#84cc16' : '#34d399',
            shape: 'acid',
            chillPlayer: true
          });
        }
      }
    }

    e._venomHitCd = Math.max(0, (e._venomHitCd || 0) - dt);
    if (player && state === 'wave' && e._venomHitCd <= 0) {
      const dxP = player.x - e.x, dyP = player.y - e.y;
      const dP = Math.hypot(dxP, dyP);
      if (dP <= vLen + player.r - 4 && dP > 6) {
        const angP = Math.atan2(dyP, dxP);
        for (let ni = 0; ni < nozzles.length; ni++) {
          const na = (e.venomAimA || 0) + nozzles[ni];
          let da = Math.abs(angP - na) % (Math.PI * 2);
          if (da > Math.PI) da = Math.PI * 2 - da;
          if (da <= vSpan) {
            e._venomHitCd = 0.34;
            if (!player.noSlow) player.chillSlowT = Math.max(player.chillSlowT || 0, 0.95);
            addText(player.x, player.y - 36, '剧毒喷流腐蚀!', '#a3e635', 14, 0.9);
            hurtPlayer(Math.max(4, Math.round(e.dmg * 0.86)));
            if (state !== 'wave') return true;
            break;
          }
        }
      }
    }

    if (e.venomBreathT <= 0) {
      e.venomBreathT = 0;
      const endA = e.venomAimA || aimToPlayer;
      spawnHazard(e.x + Math.cos(endA) * (vLen * 0.76), e.y + Math.sin(endA) * (vLen * 0.76), 64, e.dmg * 1.02, 1.15, { color: '#52b788', style: 'venom_mire' });
      e.venomTwin = false;
      e.exposeT = Math.max(e.exposeT || 0, 1.15);
    }
    return false;
  }

  if (!e.dashing && !(e.sigWindupT > 0) && !(e.p2WindupT > 0)) {
    e.venomCd = (e.venomCd !== undefined ? e.venomCd : 4.5) - dt * paceMult;
    if (e.venomCd <= 0) {
      e.venomCd = e.variant === 'plague_empress' ? 5.6 : (e.variant === 'venom_matriarch' ? 5.8 : 6.6);
      e.venomWindupMax = 0.56;
      e.venomWindupT = 0.56;
      e.venomAimA = aimToPlayer;
      e.venomSpan = 0.46;
      e.venomLen = e.type === 'mini_boss' ? 252 : 282;
      e.venomTwin = false;
      beep(330, 0.08, 'triangle', 0.048);
      addText(e.x, e.y - e.r - 18, '☠️ 高压剧毒喷流蓄力!', '#a3e635', 14, 1.1, true);
    }
  }
  return false;
}

// 隐藏神话二阶段 / 终幕二阶段【专属额外终极技能】状态机（突出二阶段首领压迫感与独立能力）
function tickBossPhase2Skill(e, dt, aimToPlayer, paceMult) {
  if (!e.mythicPhase2) return false;
  if ((e.p2WindupT || 0) > 0) {
    e.p2WindupT -= dt;
    if (e.p2WindupT <= 0) {
      e.p2WindupT = 0;
      e.castEndT = 1.15;
      e.exposeT = Math.max(e.exposeT || 0, 1.35);
      const baseA = Number.isFinite(e.p2BaseA) ? e.p2BaseA : aimToPlayer;
      beep(215, 0.18, 'sawtooth', 0.07);
      if (e.p2Kind === 'p2_absolute_zero') {
        e.beamSweepQuad = true;
        e.beamSweepMaxT = 1.90;
        e.beamSweepT = 1.90;
        e.beamSweepA = baseA;
        if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 175, color: '#72efdd', t: 0.34, maxT: 0.34, kind: 'hex' });
        for (let k = 0; k < 8 && eBullets.length < 170; k++) {
          const ba = baseA + (k / 8) * Math.PI * 2 + 0.39;
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 166, vy: Math.sin(ba) * 166, dmg: Math.max(4, Math.round(e.dmg * 0.80)), r: 6.2, color: '#7dd3fc', shape: 'trident', chillPlayer: true });
        }
      } else if (e.p2Kind === 'p2_chrono_octa') {
        const gx = Number.isFinite(e.p2TargetX) ? e.p2TargetX : player.x;
        const gy = Number.isFinite(e.p2TargetY) ? e.p2TargetY : player.y;
        const span = 540;
        if (rings.length < 40) rings.push({ x: gx, y: gy, r: 120, color: '#fde68a', t: 0.32, maxT: 0.32, kind: 'star' });
        for (let k = 0; k < 4; k++) {
          const la = baseA + k * (Math.PI * 0.25);
          const x1 = gx - Math.cos(la) * span, y1 = gy - Math.sin(la) * span;
          const x2 = gx + Math.cos(la) * span, y2 = gy + Math.sin(la) * span;
          if (beams.length < 32) beams.push({ x1, y1, x2, y2, color: k % 2 === 0 ? '#fde68a' : '#c084fc', t: 0.34, maxT: 0.34 });
          if (player && state === 'wave') {
            const seg = pointSegClosest(player.x, player.y, x1, y1, x2, y2);
            if (seg.dSq <= (14 + player.r - 2) * (14 + player.r - 2)) {
              hurtPlayer(Math.round(e.dmg * 1.16));
              if (state !== 'wave') return true;
            }
          }
        }
      } else if (e.p2Kind === 'p2_omega_storm') {
        if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 165, color: '#fb923c', t: 0.32, maxT: 0.32, kind: 'star' });
        for (let k = 0; k < 8 && eBullets.length < 170; k++) {
          const ba = baseA + (k / 8) * Math.PI * 2;
          const side = k % 2 === 0 ? 1 : -1;
          eBullets.push({
            x: e.x, y: e.y, px: e.x, py: e.y,
            vx: Math.cos(ba) * 148, vy: Math.sin(ba) * 148,
            curve: side * 0.44, life: 2.8,
            dmg: Math.max(4, Math.round(e.dmg * 0.82)), r: 8.4, color: '#ffd166', shape: 'disc', rot: 0
          });
        }
        for (let k = 0; k < 4; k++) {
          const ha = baseA + k * (Math.PI * 0.5) + 0.39;
          spawnHazard(e.x + Math.cos(ha) * 170, e.y + Math.sin(ha) * 170, 62, e.dmg * 1.12, 1.05, { color: '#fb5607', style: 'flame_pillar' });
        }
      } else if (e.p2Kind === 'p2_twin_venom') {
        e.venomTwin = true;
        e.venomAimA = baseA;
        e.venomSpan = 0.44;
        e.venomLen = 288;
        e.venomBreathMax = 1.85;
        e.venomBreathT = 1.85;
        e._venomPulseCd = 0;
        e._venomHitCd = 0;
        if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 158, color: '#a3e635', t: 0.32, maxT: 0.32, kind: 'hex' });
      } else if (e.p2Kind === 'p2_eclipse_apocalypse') {
        const tx = Number.isFinite(e.p2TargetX) ? e.p2TargetX : player.x;
        const ty = Number.isFinite(e.p2TargetY) ? e.p2TargetY : player.y;
        if (rings.length < 40) rings.push({ x: tx, y: ty, r: 195, color: '#fde68a', t: 0.36, maxT: 0.36, kind: 'hex' });
        for (let k = 0; k < 6; k++) {
          const ha = baseA + (k / 6) * Math.PI * 2;
          spawnHazard(tx + Math.cos(ha) * 135, ty + Math.sin(ha) * 135, 62, e.dmg * 1.15, 0.98, { color: '#ffd166', style: 'thunder_sigil' });
        }
        for (let k = 0; k < 10 && eBullets.length < 170; k++) {
          const ba = baseA + (k / 10) * Math.PI * 2;
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 172, vy: Math.sin(ba) * 172, dmg: Math.max(5, Math.round(e.dmg * 0.82)), r: 6.4, color: k % 2 === 0 ? '#ffd166' : '#c084fc', shape: 'lance' });
        }
      } else {
        // p2_crimson_prison：绯夜八荒剑狱（双十字裂空剑隙 + 八方绯月回旋斩）
        const tx = Number.isFinite(e.p2TargetX) ? e.p2TargetX : player.x;
        const ty = Number.isFinite(e.p2TargetY) ? e.p2TargetY : player.y;
        for (let k = 0; k < 2; k++) {
          spawnHazard(tx, ty, 30, e.dmg * 1.12, 0.85, {
            color: '#fb7185', style: 'void_slash',
            angle: baseA + k * (Math.PI * 0.5) + 0.39, halfLen: 138, halfW: 15
          });
        }
        for (let k = 0; k < 8 && eBullets.length < 170; k++) {
          const ba = baseA + (k / 8) * Math.PI * 2;
          eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 178, vy: Math.sin(ba) * 178, dmg: Math.max(4, Math.round(e.dmg * 0.82)), r: 8.2, color: '#ff4d6d', shape: 'crescent' });
        }
      }
    }
    return false;
  }

  if (!e.dashing && !(e.sigWindupT > 0) && !(e.venomWindupT > 0) && !(e.venomBreathT > 0)) {
    e.p2SkillT = (e.p2SkillT !== undefined ? e.p2SkillT : 3.2) - dt * paceMult;
    if (e.p2SkillT <= 0) {
      e.p2SkillT = 6.2;
      e.p2WindupMax = 0.78;
      e.p2WindupT = 0.78;
      e.p2BaseA = aimToPlayer;
      e.p2TargetX = player.x;
      e.p2TargetY = player.y;
      const v = e.variant || 'butcher';
      if (v === 'frost_queen' || v === 'glacial_valkyrie') {
        e.p2Kind = 'p2_absolute_zero';
        e.p2Label = '⚡ 二阶终式·绝对零度四翼星环';
      } else if (v === 'void_weaver' || v === 'shadow_stalker' || v === 'storm_siren') {
        e.p2Kind = 'p2_chrono_octa';
        e.p2Label = '⚡ 二阶终式·逆时米字断罪光网';
      } else if (v === 'mech_colossus' || v === 'pyro_lord' || v === 'golden_golem' || v === 'iron_warden') {
        e.p2Kind = 'p2_omega_storm';
        e.p2Label = '⚡ 二阶终式·末日熔核锯刃风暴';
      } else if (v === 'plague_empress' || v === 'venom_matriarch') {
        e.p2Kind = 'p2_twin_venom';
        e.p2Label = '⚡ 二阶终式·双龙万蛊毒息';
      } else if (v === 'solar_seraph' || v === 'abyss_devourer') {
        e.p2Kind = 'p2_eclipse_apocalypse';
        e.p2Label = '⚡ 二阶终式·黑日神罚天体崩落';
      } else {
        e.p2Kind = 'p2_crimson_prison';
        e.p2Label = '⚡ 二阶终式·绯夜八荒剑狱';
      }
      e.castLabel = e.p2Label;
      beep(480, 0.10, 'triangle', 0.055);
      addText(e.x, e.y - e.r - 24, e.p2Label + '!', '#ffd166', 15, 1.45, true);
    }
  }
  return false;
}

function update(dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  if (typeof SpireAudio !== 'undefined') SpireAudio.tick(dt);
  if (typeof SpireDirector !== 'undefined' && SpireDirector) {
    SpireDirector.update(dt);
    if (SpireDirector.isBlockingGameplay()) {
      // 剧情、选项与回看期间连刷怪预警也冻结，镜前作决定时不提前启动战斗。
      return;
    }
    const ts = typeof SpireDirector.getTimeScale === 'function' ? SpireDirector.getTimeScale() : 1;
    if (ts <= 0.001) return;
    dt *= ts;
  }
  if (state !== 'wave' || !player) return;
  if (typeof isSpireCombatSuspended === 'function' && isSpireCombatSuspended()) return;
  if (typeof isAudioModalOpen === 'function' && isAudioModalOpen()) return;
  if (typeof resetCombatFrameBudgets === 'function') resetCombatFrameBudgets();
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
  if (player._procBlastCd > 0) player._procBlastCd = Math.max(0, player._procBlastCd - dt);
  if (player._bloodNovaCd > 0) player._bloodNovaCd = Math.max(0, player._bloodNovaCd - dt);
  if (player._iceNovaCd > 0) player._iceNovaCd = Math.max(0, player._iceNovaCd - dt);
  if (player._plagueRingCd > 0) player._plagueRingCd = Math.max(0, player._plagueRingCd - dt);
  if (player._healTxtCd > 0) {
    player._healTxtCd = Math.max(0, player._healTxtCd - dt);
    if (player._healTxtCd <= 0 && (player._healTxtAcc || 0) > 0) {
      addText(player.x, player.y - 24, '+' + player._healTxtAcc, '#ff4d6d', 14, 0.50, false);
      player._healTxtAcc = 0;
    }
  }
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

  // 战场单一主题地形块判定（岩浆灼烫减速、毒泥沼阻滞腐蚀、寒冰台 5秒渐进减速累计至冰封 1秒 · 离冰 1秒后开始消退）
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

  // 碎冕寒晶方砖台状态机：站立 5.0s 渐进冰缓 -> 满 5.0s 冰封 1.0s 后解冻清零；离开冰面 1.0s 后开始消退恢复
  if ((player.frostThawImmT || 0) > 0) player.frostThawImmT = Math.max(0, player.frostThawImmT - dt);
  if ((player.iceFreezeT || 0) > 0) {
    player.iceFreezeT -= dt;
    if (player.iceFreezeT <= 0) {
      player.iceFreezeT = 0;
      player.frostGauge = 0;
      player.frostLeaveGrace = 0;
      player.frostThawImmT = 0.35;
      addBurst(player.x, player.y, '#bae6fd', 8, 125);
      addText(player.x, player.y - 38, '破冰解冻!', '#e0f2fe', 15, 1.1);
    }
  } else if (player.noSlow) {
    player.frostGauge = 0;
    player.frostLeaveGrace = 0;
  } else if (onIce && !(player.frostThawImmT > 0)) {
    player.frostLeaveGrace = 1.0;
    const prevGauge = player.frostGauge || 0;
    player.frostGauge = Math.min(5.0, prevGauge + dt);
    if (prevGauge <= 0.05 && player.terrainHintT <= 0) {
      player.terrainHintT = 2.4;
      addText(player.x, player.y - 36, '寒霜侵蚀 · 渐进冰缓!', '#7dd3fc', 15, 1.6);
    }
    if (player.frostGauge >= 5.0) {
      player.frostGauge = 0;
      player.frostLeaveGrace = 0;
      player.iceFreezeT = 1.0;
      player.dashT = 0;
      beep(620, 0.14, 'triangle', 0.055);
      if (rings.length < 34) rings.push({ x: player.x, y: player.y, r: 54, color: '#7dd3fc', t: 0.30, maxT: 0.30, kind: 'hex' });
      addText(player.x, player.y - 42, '❄️ 寒霜满溢 · 冰封1秒!', '#7dd3fc', 17, 1.5, true);
    }
  } else if ((player.frostGauge || 0) > 0) {
    if ((player.frostLeaveGrace || 0) > 0) {
      player.frostLeaveGrace = Math.max(0, player.frostLeaveGrace - dt);
    } else {
      player.frostGauge = Math.max(0, player.frostGauge - dt * 1.65);
    }
  }

  const frostRatio = (!player.noSlow && (player.frostGauge || 0) > 0) ? Math.min(1, player.frostGauge / 5.0) : 0;
  const frostSpdMul = frostRatio > 0 ? Math.max(0.80, 1 - frostRatio * 0.20) : 1;
  player.terrainSpdMul = (player.iceFreezeT || 0) > 0
    ? 0
    : (frostRatio > 0
      ? frostSpdMul
      : ((onSwamp && !player.noSlow) ? 0.70 : ((onLava && !player.noSlow) ? 0.85 : 1)));
  if (player.terrainHintT <= 0) {
    if (onSwamp && !player.noSlow) {
      player.terrainHintT = 2.8;
      addText(player.x, player.y - 36, '毒沼深陷 -30%移速', '#a3e635', 15, 1.8);
    } else if (onLava && !player.noSlow) {
      player.terrainHintT = 2.8;
      addText(player.x, player.y - 36, '熔岩灼足 -15%移速', '#ff6b35', 15, 1.8);
    }
  }
  if (onLava && !player.noSlow) {
    player.lavaExposure = (player.lavaExposure || 0) + dt;
    if (player.lavaExposure >= 0.26) {
      player.lavaTick = (player.lavaTick || 0) - dt;
      if (player.lavaTick <= 0) {
        player.lavaTick = 0.62;
        addText(player.x, player.y - 38, '岩浆灼烫!', '#ff6b35', 16, 1.6);
        hurtPlayer(Math.max(3, Math.round((3.0 + wave * 0.50) * envDmgMul)));
        if (state !== 'wave') return;
      }
    }
  } else {
    player.lavaExposure = Math.max(0, (player.lavaExposure || 0) - dt * 2.2);
    player.lavaTick = 0;
  }
  if (onSwamp && !player.noSlow) {
    player.swampExposure = (player.swampExposure || 0) + dt;
    if (player.swampExposure >= 0.55) {
      player.swampTick = (player.swampTick || 0) - dt;
      if (player.swampTick <= 0) {
        player.swampTick = 0.85;
        addText(player.x, player.y - 38, '毒沼腐蚀!', '#a3e635', 15, 1.5);
        hurtPlayer(Math.max(2, Math.round((2.0 + wave * 0.35) * envDmgMul)));
        if (state !== 'wave') return;
      }
    }
  } else {
    player.swampExposure = Math.max(0, (player.swampExposure || 0) - dt * 2.0);
    player.swampTick = 0;
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
        if (rings.length < 30) rings.push({ x: p.x, y: p.y, r: 68, color: p.color, t: 0.26, maxT: 0.26, fill: false });
        player.x = dest.x;
        player.y = dest.y;
        player.invuln = 0;
        cam.x += (dest.x - cam.x) * 0.68;
        cam.y += (dest.y - cam.y) * 0.68;
        clampCam();
        beep(720, 0.12, 'sine', 0.06);
        if (rings.length < 30) rings.push({ x: dest.x, y: dest.y, r: 115, color: dest.color, t: 0.28, maxT: 0.28, fill: false });
        addBurst(dest.x, dest.y, dest.color, 10, 180);
        const warpDmg = (16 + wave * 3) * getEffectiveDmgMul();
        for (let k = 0; k < enemies.length; k++) {
          const ce = enemies[k];
          if (!ce || ce.hp <= 0 || ce.primed) continue;
          if (Math.hypot(ce.x - dest.x, ce.y - dest.y) <= 115 + ce.r) {
            hurtEnemy(ce, warpDmg, false, Math.atan2(ce.y - dest.y, ce.x - dest.x), true, { noProc: true, silentHit: true, knockMult: 1.8 });
          }
        }
        addText(player.x, player.y - 42, '◆ 虚空跃迁！震退周身', '#e0aaff', 18, 2.0);
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
        sceneEventT = 7.0;
        const mx = Math.max(110, Math.min(WORLD.w - 110, player.x + (Math.random() - 0.5) * 340));
        const my = Math.max(110, Math.min(WORLD.h - 110, player.y + (Math.random() - 0.5) * 340));
        spawnHazard(mx, my, 82, (8 + wave * 1.1) * diff.dmgMul * envDmgMul, 1.35, { enemyDmg: (38 + wave * 7) * diff.hpMul, dropMat: 4, color: '#c084fc', style: 'thunder_sigil' });
        addText(mx, my - 30, '星晷紫雷坠落!', '#e9d5ff', 15, 2.0);
        announce('⚡ 紫电星晷碎块即将轰落！可重创灰塔傀儡并迸裂封魂晶石', '#e9d5ff', 2.8);
      } else if (activeSceneEvent === 'sandstorm') {
        sceneEventT = 8.0;
        sandGustT = 3.2;
        addText(player.x, player.y - 42, '苍岚顺风：移速+14% · 敌弹减速!', '#f4a261', 15, 2.1);
        announce('🌪️ 环境异象【苍岚顺风】：移速+14%，敌方弹幕减速 22%', '#f4a261', 3.0);
        if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: 95, color: '#f4a261', t: 0.35, maxT: 0.35, kind: 'hex' });
      } else if (activeSceneEvent === 'blizzard') {
        sceneEventT = 8.0;
        for (const e of enemies) {
          if (e && e.hp > 0) e.chillT = Math.max(e.chillT || 0, 2.5);
        }
        const bx = Math.max(110, Math.min(WORLD.w - 110, player.x + (Math.random() - 0.5) * 300));
        const by = Math.max(110, Math.min(WORLD.h - 110, player.y + (Math.random() - 0.5) * 300));
        spawnHazard(bx, by, 72, (7 + wave * 1.0) * diff.dmgMul * envDmgMul, 1.30, { enemyDmg: (32 + wave * 6) * diff.hpMul, color: '#38bdf8', style: 'frost_hex' });
        if (rings.length < 40) rings.push({ x: player.x, y: player.y, r: 260, color: '#72efdd', t: 0.4, maxT: 0.4, kind: 'hex' });
        addText(player.x, player.y - 42, '极寒霜潮：全场傀儡冻结减速!', '#72efdd', 15, 2.1);
        announce('❄️ 环境异象【极寒霜潮】：全场守塔傀儡集体冻结减速并凝结六棱冰晶！', '#72efdd', 3.0);
      } else if (activeSceneEvent === 'geysers') {
        sceneEventT = 6.6;
        for (let g = 0; g < 2; g++) {
          const gx = Math.max(110, Math.min(WORLD.w - 110, player.x + (Math.random() - 0.5) * 380));
          const gy = Math.max(110, Math.min(WORLD.h - 110, player.y + (Math.random() - 0.5) * 380));
          spawnHazard(gx, gy, 74, (9 + wave * 1.2) * diff.dmgMul * envDmgMul, 1.30, { enemyDmg: (45 + wave * 8) * diff.hpMul, color: '#ff6b35', style: 'flame_pillar' });
        }
        announce('🔥 环境异象【熔炉余烬】：地面八芒熔火柱即将喷涌（可重创敌群）', '#ff6b35', 2.8);
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

  // 首领层与普通层统一正常倒计时：提前击败首领保留剩余时间刷满小怪收割晶石，倒计时归零若首领未死则转入超时死战！
  waveTime -= dt;
  if (!overtime && waveTime > 0 && waveTime <= 5) {
    const sec = Math.ceil(waveTime);
    if (sec !== lastUrgentSec) {
      lastUrgentSec = sec;
      beep(860, 0.035, 'sine', 0.028);
    }
  }
  if (waveTime <= 0) {
    const bossAlive = enemies.some(e => (e.type === 'boss' || e.type === 'special_boss' || e.type === 'mini_boss') && e.hp > 0) ||
      spawns.some(s => s.type === 'boss' || s.type === 'special_boss' || s.type === 'mini_boss');
    if (bossAlive) {
      waveTime = 0;
      if (!overtime) {
        overtime = true;
        beep(210, 0.25, 'sawtooth', 0.08);
        addText(player.x, player.y - 54, '◆ 超时死战开启！击败首领即刻过关！', '#ff3b6b', 21, 2.6);
        announce('◆ 超时死战开启！不加冗余时间，击败首领即刻决出胜负！', '#ff3b6b', 4.0);
      }
      overtimeMeteorT -= dt;
      if (overtimeMeteorT <= 0) {
        overtimeMeteorT = 3.6;
        spawnHazard(player.x + (Math.random() - 0.5) * 210, player.y + (Math.random() - 0.5) * 210, 74, 11 * diff.dmgMul * envDmgMul, 1.25);
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
        if (state !== 'wave') return;
      }
    }
  }

  // 多样化灰塔残响按层数与难度递进刷出（第 10 轮及以后大幅加密同屏上限、单批涌出量与刷新速率；提前击杀首领立即解锁满额小怪收割晶石！）
  spawnAcc -= dt;
  const onBossWave = (wave >= 4 && wave % 4 === 0);
  const bossDuelActive = onBossWave && (
    enemies.some(e => (e.type === 'boss' || e.type === 'special_boss') && e.hp > 0) ||
    spawns.some(s => s.type === 'boss' || s.type === 'special_boss')
  );
  const hordeBoost = hordeWave ? (wave <= 4 ? 1.14 : (wave >= 10 ? 1.28 : 1.20)) : 1;
  // 前期（第 1~5 层）刷怪密度与同屏上限进一步温和下调，第 10 层起显著拉升终局尸潮压迫感！
  const earlySpawnMul = wave <= 2 ? 0.66 : (wave <= 4 ? 0.72 : (wave === 5 ? 0.80 : (wave === 6 ? 0.94 : 1.0)));
  const lateSurgeMul = wave >= 10 ? (1.16 + Math.min(0.32, (wave - 10) * 0.042)) : 1.0;
  const maxActiveEnemies = isTouch
    ? (bossDuelActive ? (wave >= 12 ? 28 : (wave <= 4 ? 20 : 24)) : Math.min(wave >= 10 ? 76 : 64, Math.round((28 + wave * 2.8) * earlySpawnMul * lateSurgeMul)))
    : (bossDuelActive ? (wave >= 12 ? 36 : (wave <= 4 ? 26 : 30)) : Math.min(wave >= 10 ? 98 : 80, Math.round((34 + wave * 3.2) * earlySpawnMul * lateSurgeMul)));
  if (!overtime && spawnAcc <= 0 && waveTime > 1.5 && (enemies.length + spawns.length) < maxActiveEnemies) {
    const baseCount = bossDuelActive ? (wave >= 12 ? 2.4 : (wave <= 4 ? 1.8 : 2.0)) : (2.45 + Math.min(wave, 6) * 0.28 + Math.max(0, Math.min(16, wave) - 6) * 0.26);
    const exactCnt = baseCount * (bossDuelActive ? 1.0 : earlySpawnMul * lateSurgeMul) * diff.spawnMul * hordeBoost;
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
    const minInterval = bossDuelActive ? 0.56 : (wave <= 5 ? 0.54 : (wave >= 10 ? 0.37 : 0.48));
    const paceScale = wave <= 5 ? 0.90 : (wave >= 10 ? 1.16 : 1);
    spawnAcc = Math.max(minInterval, (1.08 - Math.min(wave, 12) * 0.050) / Math.pow(diff.spawnMul * hordeBoost * paceScale, 0.48));
  }

  // 多形态地面与空间预警机关倒计时引爆（彻底告别千篇一律圆圈爆炸：十字棱镜激光、次元裂空斩、高抛子母榴弹、落雷星印、六棱碎冰、八芒熔火柱）
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    if (!h) continue;
    h.t -= dt;
    if (h.rotSpd) h.angle = (h.angle || 0) + h.rotSpd * dt;
    if (h.t <= 0) {
      const hCol = h.color || '#ff3b6b';
      const st = h.style || 'circle';
      if (st === 'cross_beam') {
        // 蚀忆魂灯龛专属：紫晶十字裂变棱镜迸发双向交叉光轨（非圆形判定，四角象限完全安全！）
        const span = h.halfLen || 130;
        const hw = h.halfW || 14;
        beep(590, 0.08, 'sawtooth', 0.04);
        addBurst(h.x, h.y, hCol, 7, 135);
        let hitCross = false;
        for (let k = 0; k < 2; k++) {
          const la = (h.angle || 0) + k * (Math.PI * 0.5);
          const x1 = h.x - Math.cos(la) * span, y1 = h.y - Math.sin(la) * span;
          const x2 = h.x + Math.cos(la) * span, y2 = h.y + Math.sin(la) * span;
          if (beams.length < 34) beams.push({ x1, y1, x2, y2, color: hCol, thin: true, t: 0.26, maxT: 0.26 });
          if (!hitCross && player && state === 'wave') {
            const seg = pointSegClosest(player.x, player.y, x1, y1, x2, y2);
            if (seg.dSq <= (hw + player.r - 3) * (hw + player.r - 3)) hitCross = true;
          }
        }
        if (hitCross) hurtPlayer(h.dmg, true);
      } else if (st === 'void_slash') {
        // 蚀日唤灵师专属：次元裂空斩痕撕开紫金雷电剑隙（线性走廊判定，侧移一步即可潇洒闪避！）
        const span = h.halfLen || 94;
        const hw = h.halfW || 14;
        const la = h.angle || 0;
        const x1 = h.x - Math.cos(la) * span, y1 = h.y - Math.sin(la) * span;
        const x2 = h.x + Math.cos(la) * span, y2 = h.y + Math.sin(la) * span;
        beep(360, 0.09, 'sawtooth', 0.042);
        if (beams.length < 34) beams.push({ x1, y1, x2, y2, color: hCol, thin: false, t: 0.24, maxT: 0.24 });
        if (slashes.length < 34) slashes.push({ x: h.x, y: h.y, angle: la, r: span, color: '#fde68a', mode: 'stab', t: 0.20, maxT: 0.20 });
        if (lightnings.length < 34) {
          const nx = -Math.sin(la), ny = Math.cos(la);
          lightnings.push({
            pts: [
              { x: x1, y: y1 },
              { x: h.x - Math.cos(la) * span * 0.35 + nx * 10, y: h.y - Math.sin(la) * span * 0.35 + ny * 10 },
              { x: h.x + Math.cos(la) * span * 0.35 - nx * 10, y: h.y + Math.sin(la) * span * 0.35 - ny * 10 },
              { x: x2, y: y2 }
            ],
            color: '#e9d5ff', t: 0.22, maxT: 0.22
          });
        }
        if (player && state === 'wave') {
          const seg = pointSegClosest(player.x, player.y, x1, y1, x2, y2);
          if (seg.dSq <= (hw + player.r - 3) * (hw + player.r - 3)) hurtPlayer(h.dmg, true);
        }
      } else {
        if (st === 'thunder_sigil' && lightnings.length < 34) {
          lightnings.push({
            pts: [
              { x: h.x + (Math.random() - 0.5) * 24, y: Math.max(16, h.y - 230) },
              { x: h.x - 14, y: h.y - 115 },
              { x: h.x + 12, y: h.y - 48 },
              { x: h.x, y: h.y }
            ],
            color: hCol, t: 0.24, maxT: 0.24
          });
          if (rings.length < 34) rings.push({ x: h.x, y: h.y, r: h.r * 1.08, color: '#fef08a', t: 0.24, maxT: 0.24, kind: 'hex' });
        } else if (st === 'frost_hex') {
          if (rings.length < 34) rings.push({ x: h.x, y: h.y, r: h.r * 1.06, color: '#bae6fd', t: 0.26, maxT: 0.26, kind: 'hex' });
          addSparks(h.x, h.y, 0, '#e0f2fe', 5);
        } else if (st === 'flame_pillar' || st === 'mortar_shell') {
          if (rings.length < 34) rings.push({ x: h.x, y: h.y, r: h.r * 1.08, color: '#fde047', t: 0.25, maxT: 0.25, kind: 'star' });
        }
        triggerExplosion(h.x, h.y, h.r, h.enemyDmg || 0, true, h.dmg, hCol, !h.innerSafeR, h.innerSafeR || 0);
        if (h.shrapnel > 0 && eBullets.length < 168) {
          const baseS = (h.angle || 0) + Math.PI * 0.25;
          for (let sk = 0; sk < h.shrapnel && eBullets.length < 170; sk++) {
            const sa = baseS + (sk / h.shrapnel) * Math.PI * 2;
            eBullets.push({
              x: h.x, y: h.y, px: h.x, py: h.y,
              vx: Math.cos(sa) * 132, vy: Math.sin(sa) * 132,
              life: 0.56,
              dmg: Math.max(3, Math.round(h.dmg * 0.68)), r: 5.2, hitR: 4.5, color: '#fb923c', shape: 'fire'
            });
          }
        }
      }
      if (h.dropMat > 0) dropCrystals(h.x, h.y, h.dropMat);
      hazards.splice(i, 1);
      if (state !== 'wave') return;
    }
  }

  for (let i = spawns.length - 1; i >= 0; i--) {
    const sp = spawns[i];
    if (!sp) continue;
    sp.t -= dt;
    if (sp.t <= 0) {
      createEnemy(sp.x, sp.y, sp.type, sp.variant);
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
  if ((player.iceFreezeT || 0) > 0) {
    player.dashT = 0;
    player.moving = false;
    player.vx = 0;
    player.vy = 0;
    player._leanA = (player._leanA || 0) * Math.max(0, 1 - dt * 14);
    if (terrains.length > 0) pushOutOfChasms(player);
  } else if ((player.dashT || 0) > 0) {
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
      const envSpdMul = (sandGustT > 0 ? 1.14 : 1) * chillMul * (player.terrainSpdMul !== undefined ? player.terrainSpdMul : 1);
      const minSpdFloor = player.noSlow ? 1.0 : 0.68;
      const effSpd = Math.max(minSpdFloor, getEffectiveSpdMul() * envSpdMul);
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
  if (player.strideQuake && movedStep > 0.1 && !(player.dashT > 0)) {
    player._strideDist = (player._strideDist || 0) + movedStep;
    if (player._strideDist >= 175) {
      player._strideDist -= 175;
      const qRad = 128 * getBlastScale();
      const qDmg = (20 + Math.max(0, getTotalArmor()) * 3.8 + player.maxHp * 0.35) * getEffectiveDmgMul();
      if (rings.length < 28) rings.push({ x: player.x, y: player.y, r: qRad, color: '#fbbf24', t: 0.22, maxT: 0.22, fill: false });
      beep(145, 0.055, 'triangle', 0.036);
      for (let qi = enemies.length - 1; qi >= 0; qi--) {
        const qe = enemies[qi];
        if (!qe || qe.hp <= 0 || qe.primed) continue;
        const qdx = qe.x - player.x, qdy = qe.y - player.y, qlim = qRad + qe.r;
        if (qdx * qdx + qdy * qdy <= qlim * qlim) {
          hurtEnemy(qe, qDmg, false, Math.atan2(qdy, qdx), true, { isMelee: true, knockMult: 1.4, noProc: true, silentHit: true });
          if (state !== 'wave') return;
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
    if (!m) continue;
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
        if (state !== 'wave') return;
      }
    }
  }

  const nowOrbitBase = performance.now() * 0.0009;
  _meleeTargets.length = 0;
  for (let idx = 0; idx < nW; idx++) {
    const w = player.weapons[idx];
    const tpl = w && WEAPONS[w.id];
    if (!tpl) continue;
    const orbitR = nW > 6 ? 44 : 38;
    const orbitA = (idx / Math.max(1, nW)) * Math.PI * 2 + nowOrbitBase;
    const cosOrbit = Math.cos(orbitA), sinOrbit = Math.sin(orbitA);
    const baseWx = player.x + cosOrbit * orbitR;
    const baseWy = player.y + sinOrbit * (orbitR * 0.9);
    const evo = typeof getWeaponEvo === 'function' ? getWeaponEvo(w) : null;
    const rangeAdd = tpl.melee ? Math.round(totalRange * 0.88 + (player.meleeSweepBonus || 0) * 22) : totalRange;
    const maxR = Math.max(tpl.melee ? 78 : 54, tpl.range + rangeAdd + (evo ? (evo.rangeAdd || 0) : 0) + (w.tier - 1) * (tpl.melee ? 18 : 13));
    if (maxR > maxEquipRange) maxEquipRange = maxR;

    let best = null, bestScore = Infinity, bestIsTree = false;
    if (tpl.melee) {
      // 近战智能索敌：消除武器环绕半径盲区（兼顾玩家本体距离与武器挂点距离）+ 威胁优先 + 多武器侧翼自动分流防鞭尸
      const pReach = Math.max(64, maxR - 4);
      const checkSpread = w.cd <= 0.08 && _meleeTargets.length > 0;
      for (let ei = 0; ei < enemies.length; ei++) {
        const e = enemies[ei];
        if (!e || e.hp <= 0 || e.primed) continue;
        const er = e.r || 15;
        const dxW = e.x - baseWx, dyW = e.y - baseWy;
        const dxP = e.x - player.x, dyP = e.y - player.y;
        const limW = maxR + er, limP = pReach + er;
        const inW = dxW > -limW && dxW < limW && dyW > -limW && dyW < limW && (dxW * dxW + dyW * dyW <= limW * limW);
        const dSqP = dxP * dxP + dyP * dyP;
        const inP = dSqP <= limP * limP;
        if (!inW && !inP) continue;
        const rawDP = Math.sqrt(dSqP);
        const edgeDP = rawDP - er;
        const flankDot = (dxP * cosOrbit + dyP * sinOrbit) / Math.max(14, rawDP);
        let score = edgeDP - flankDot * 16;
        if (checkSpread && e.type !== 'boss' && e.type !== 'special_boss' && e.type !== 'mini_boss') {
          let assigned = 0;
          for (let mi = 0; mi < _meleeTargets.length; mi++) {
            if (_meleeTargets[mi] === e) assigned++;
          }
          if (assigned > 0) score += assigned * 48;
        }
        if (score < bestScore) { bestScore = score; best = e; bestIsTree = false; }
      }
      if (best && w.cd <= 0.08) _meleeTargets.push(best);
    } else {
      let bestD = maxR;
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
    }
    // 射程内无怪物时，武器也会智能索敌砍伐附近的异星晶树！
    if (!best && trees.length > 0) {
      let bestTD = maxR;
      for (let ti = 0; ti < trees.length; ti++) {
        const tr = trees[ti];
        if (!tr || tr.hp <= 0) continue;
        const dxT = tr.x - baseWx, dyT = tr.y - baseWy, limT = bestTD + tr.r;
        const dSqT = dxT * dxT + dyT * dyT;
        if (dSqT >= limT * limT) continue;
        const d = Math.sqrt(dSqT) - tr.r;
        if (d < bestTD) { bestTD = d; best = tr; bestIsTree = true; }
      }
    }
    if (best) {
      const targetA = Math.atan2(best.y - baseWy, best.x - baseWx);
      w.angle = (!tpl.melee || w.cd <= dt * 1.5) ? targetA : _lerpAngle(w.angle, targetA, Math.min(1, dt * 26));
    } else if (tpl.melee) {
      const preAimLim = maxR * 1.75 + 75;
      const idleTargetA = (nearestE && nearestDSq <= preAimLim * preAimLim)
        ? Math.atan2(nearestE.y - baseWy, nearestE.x - baseWx)
        : (Number.isFinite(player.lookA) ? player.lookA : (player.faceDir > 0 ? 0 : Math.PI));
      w.angle = _lerpAngle(w.angle, idleTargetA, Math.min(1, dt * 12));
    } else {
      w.angle = player.faceDir > 0 ? 0 : Math.PI;
    }

    w.cd -= dt;
    if (w.thrust > 0) w.thrust = Math.max(0, w.thrust - dt * (w.id === 'spear' ? 4.8 : 5.8));
    if (w.recoil > 0) w.recoil = Math.max(0, w.recoil - dt * 8);

    if (best && w.cd <= 0) {
      w.angle = Math.atan2(best.y - baseWy, best.x - baseWx);
      const tierScale = (1 + (w.tier - 1) * 0.55) * (w.tier >= 5 ? 1.18 : 1);
      const aspdBonusDmg = tpl.aspdScale ? Math.max(0, effAspd - 1) * 9 : 0;
      const rangeBonusDmg = tpl.rangeScale ? Math.max(0, totalRange) * tpl.rangeScale : 0;
      const hpBonusDmg = tpl.hpScale ? Math.max(0, player.maxHp) * tpl.hpScale : 0;
      const armBonusDmg = tpl.armorScale ? Math.max(0, getTotalArmor()) * tpl.armorScale : 0;
      const base = ((tpl.dmg + aspdBonusDmg + rangeBonusDmg + hpBonusDmg + armBonusDmg) * tierScale + (w.id === 'stick' ? Math.max(0, stickCount - 1) * 4.8 : 0)) * (evo && evo.dmgMul ? evo.dmgMul : 1);
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
        // 动态补偿武器环绕偏移，确保索敌锁定的近身目标 100% 落入真实刀光与碰撞盒
        const effReach = Math.max(maxR, Math.min(maxR + orbitR * 0.95, Math.hypot(best.x - baseWx, best.y - baseWy) + 14));
        // 近战斩弹收敛：T1~T4 普通近战无法直接抹除弹道；仅佩戴 T4 唯一饰品【断刃狐月鞘】(35%) 或晋升 T5 神话近战武器 (40%，叠加软上限 60%) 时按概率斩碎敌弹！
        const cutChance = Math.min(0.60, (w.tier >= 5 ? 0.40 : 0) + (player.meleeBulletCutChance || 0));

        if (tpl.mode === 'spear') {
          // 长矛 / 5阶沧溟三叉戟 / 冈格尼尔超距雷霆枪
          const prongs = (evo && evo.tridentThrust) ? [-0.22, 0, 0.22] : [0];
          const hitEnemies = prongs.length > 1 ? new Set() : null;
          let chainFired = false;
          for (let pi = 0; pi < prongs.length; pi++) {
            const pAng = w.angle + prongs[pi];
            const ex = baseWx + Math.cos(pAng) * effReach, ey = baseWy + Math.sin(pAng) * effReach;
            if (slashes.length < 36) slashes.push({ x: baseWx, y: baseWy, angle: pAng, r: effReach, color: sColor, mode: 'spear', t: 0.16, maxT: 0.16 });
            const l2 = effReach * effReach;
            for (let i = enemies.length - 1; i >= 0; i--) {
              const e = enemies[i];
              if (e.hp <= 0 || (hitEnemies && hitEnemies.has(e))) continue;
              const proj = Math.max(0, Math.min(1, ((e.x - baseWx) * (ex - baseWx) + (e.y - baseWy) * (ey - baseWy)) / l2));
              const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
              if (Math.hypot(e.x - px, e.y - py) <= e.r + 24) {
                if (hitEnemies) hitEnemies.add(e);
                const isCrit = Math.random() < critChance;
                hurtEnemy(e, base * finalMul * (isCrit ? critMult : 1), isCrit, pAng, evoBurn, {
                  isMelee: true,
                  forceBurn: evoBurn,
                  forceFreeze: evoFreezeChance > 0 && Math.random() < evoFreezeChance
                });
                if (state !== 'wave') return;
                if (evoChains > 0 && !chainFired && e.hp > 0) {
                  chainFired = true;
                  castChainLightning(e.x, e.y, e, evoChains, base * finalMul * 0.62, critChance * 0.6);
                  if (state !== 'wave') return;
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
          if (cutChance > 0 && eBullets.length > 0) {
            let slicedSpear = 0;
            const spearCap = prongs.length > 1 ? 3 : 2;
            const ex0 = baseWx + Math.cos(w.angle) * effReach, ey0 = baseWy + Math.sin(w.angle) * effReach;
            for (let bi = eBullets.length - 1; bi >= 0 && slicedSpear < spearCap; bi--) {
              const eb = eBullets[bi];
              const proj = Math.max(0, Math.min(1, ((eb.x - baseWx) * (ex0 - baseWx) + (eb.y - baseWy) * (ey0 - baseWy)) / (effReach * effReach)));
              const px = baseWx + proj * (ex0 - baseWx), py = baseWy + proj * (ey0 - baseWy);
              if (Math.hypot(eb.x - px, eb.y - py) <= (eb.r || 5) + (prongs.length > 1 ? 30 : 18) && Math.random() < cutChance) {
                addSparks(eb.x, eb.y, w.angle, '#ffd166', 2);
                eBullets.splice(bi, 1);
                slicedSpear++;
              }
            }
          }
        } else if (tpl.mode === 'stab') {
          // 匕首 / 螺丝刀：精准高速前刺寒芒走廊 + 贴身护卫弧度判定（解决旧版刀光与扇形判定错位）
          const ex = baseWx + Math.cos(w.angle) * effReach, ey = baseWy + Math.sin(w.angle) * effReach;
          const l2 = effReach * effReach;
          if (slashes.length < 36) {
            slashes.push({
              x: baseWx + Math.cos(w.angle) * 12, y: baseWy + Math.sin(w.angle) * 12,
              angle: w.angle, r: effReach, color: evo ? sColor : (tpl.burnSlash ? '#ff6b35' : sColor),
              mode: 'stab', t: 0.15, maxT: 0.15
            });
          }
          if (cutChance > 0 && eBullets.length > 0) {
            let slicedCnt = 0;
            const sliceCap = w.tier >= 5 ? 2 : 1;
            for (let bi = eBullets.length - 1; bi >= 0 && slicedCnt < sliceCap; bi--) {
              const eb = eBullets[bi];
              const proj = Math.max(0, Math.min(1, ((eb.x - baseWx) * (ex - baseWx) + (eb.y - baseWy) * (ey - baseWy)) / l2));
              const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
              if (Math.hypot(eb.x - px, eb.y - py) <= (eb.r || 5) + 22 && Math.random() < cutChance) {
                addSparks(eb.x, eb.y, w.angle, '#ffd166', 2);
                eBullets.splice(bi, 1);
                slicedCnt++;
              }
            }
          }
          let stabChainFired = false;
          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (!e || e.hp <= 0) continue;
            const proj = Math.max(0, Math.min(1, ((e.x - baseWx) * (ex - baseWx) + (e.y - baseWy) * (ey - baseWy)) / l2));
            const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
            let hitStab = Math.hypot(e.x - px, e.y - py) <= e.r + 26;
            if (!hitStab) {
              const dxE = e.x - baseWx, dyE = e.y - baseWy, closeLim = effReach * 0.56 + e.r;
              if (dxE * dxE + dyE * dyE <= closeLim * closeLim) {
                let da = Math.abs(Math.atan2(dyE, dxE) - w.angle) % (Math.PI * 2);
                if (da > Math.PI) da = Math.PI * 2 - da;
                if (da < 0.78) hitStab = true;
              }
            }
            if (hitStab) {
              const isCrit = Math.random() < critChance;
              hurtEnemy(e, base * finalMul * (isCrit ? critMult : 1), isCrit, w.angle, evoBurn, {
                isMelee: true,
                knockMult: tpl.knockMult || 1,
                forceBurn: evoBurn,
                forceFreeze: evoFreezeChance > 0 && Math.random() < evoFreezeChance
              });
              if (state !== 'wave') return;
              if (evoChains > 0 && !stabChainFired && e.hp > 0) {
                stabChainFired = true;
                castChainLightning(e.x, e.y, e, evoChains, base * finalMul * 0.60, critChance * 0.55);
                if (state !== 'wave') return;
              }
            }
          }
          for (let i = trees.length - 1; i >= 0; i--) {
            const tr = trees[i];
            if (!tr || tr.hp <= 0) continue;
            const proj = Math.max(0, Math.min(1, ((tr.x - baseWx) * (ex - baseWx) + (tr.y - baseWy) * (ey - baseWy)) / l2));
            const px = baseWx + proj * (ex - baseWx), py = baseWy + proj * (ey - baseWy);
            if (Math.hypot(tr.x - px, tr.y - py) <= tr.r + 22) hurtTree(tr, base * finalMul);
          }
        } else {
          // 刀剑横扫 / 守誓残杖阔扫 / 利爪撕裂 / 居合太刀 / 巨石钝击 / 裂地战锤 / 尖刺重盾 / 熔岩重刃 + 5阶神话进化
          const arcSpan = (tpl.mode === 'crescent' ? 1.18 : (w.id === 'stick' ? 1.08 : 0.96)) + (player.meleeSweepBonus || 0) * 0.16 + (evo ? 0.14 : 0);
          if (slashes.length < 36) {
            slashes.push({
              x: baseWx + Math.cos(w.angle) * 18, y: baseWy + Math.sin(w.angle) * 18,
              angle: w.angle, r: effReach, color: evo ? sColor : (tpl.burnSlash ? '#ff6b35' : sColor),
              mode: tpl.mode || 'arc', t: 0.16, maxT: 0.16
            });
          }
          if (cutChance > 0 && eBullets.length > 0) {
            let slicedCnt = 0;
            const sliceCap = w.tier >= 5 ? 3 : 2;
            const sliceLim = Math.min(176, effReach * 0.94);
            const sliceLimSq = sliceLim * sliceLim;
            for (let bi = eBullets.length - 1; bi >= 0 && slicedCnt < sliceCap; bi--) {
              const eb = eBullets[bi];
              const dxB = eb.x - baseWx, dyB = eb.y - baseWy;
              if (dxB * dxB + dyB * dyB > sliceLimSq) continue;
              let daB = Math.abs(Math.atan2(dyB, dxB) - w.angle) % (Math.PI * 2);
              if (daB > Math.PI) daB = Math.PI * 2 - daB;
              if (daB < arcSpan && Math.random() < cutChance) {
                addSparks(eb.x, eb.y, w.angle, '#ffd166', 2);
                eBullets.splice(bi, 1);
                slicedCnt++;
              }
            }
          }
          let critChainTriggered = false;
          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (!e || e.hp <= 0) continue;
            const dxE = e.x - baseWx, dyE = e.y - baseWy, limE = effReach + e.r;
            const dSqE = dxE * dxE + dyE * dyE;
            if (dSqE > limE * limE) continue;
            let da = Math.abs(Math.atan2(dyE, dxE) - w.angle) % (Math.PI * 2);
            if (da > Math.PI) da = Math.PI * 2 - da;
            const closeGuardSq = (46 + e.r) * (46 + e.r);
            if (da < arcSpan || (dSqE <= closeGuardSq && da < arcSpan + 0.34)) {
              const isCrit = Math.random() < critChance;
              hurtEnemy(e, base * finalMul * (isCrit ? critMult : 1), isCrit, w.angle, evoBurn, {
                isMelee: true,
                knockMult: tpl.knockMult || 1,
                forceBurn: evoBurn,
                forceFreeze: evoFreezeChance > 0 && Math.random() < evoFreezeChance
              });
              if (state !== 'wave') return;
              const wantChains = evoChains > 0 ? evoChains : ((tpl.burnSlash && (isCrit || Math.random() < 0.35)) ? 3 : 0);
              if (wantChains > 0 && !critChainTriggered && e.hp > 0) {
                critChainTriggered = true;
                castChainLightning(e.x, e.y, e, wantChains, base * finalMul * 0.60, critChance * 0.55);
                if (state !== 'wave') return;
              }
            }
          }
          for (let i = trees.length - 1; i >= 0; i--) {
            const tr = trees[i];
            if (!tr || tr.hp <= 0) continue;
            const dxT = tr.x - baseWx, dyT = tr.y - baseWy, limT = effReach + tr.r;
            if (dxT * dxT + dyT * dyT > limT * limT) continue;
            let da = Math.abs(Math.atan2(dyT, dxT) - w.angle) % (Math.PI * 2);
            if (da > Math.PI) da = Math.PI * 2 - da;
            if (da < arcSpan) hurtTree(tr, base * finalMul);
          }
          if (tpl.slam || (evo && evo.slam)) {
            const hx = baseWx + Math.cos(w.angle) * (effReach * 0.68), hy = baseWy + Math.sin(w.angle) * (effReach * 0.68);
            const sr = 68 * ((evo && evo.slamScale) ? evo.slamScale : 1) * getBlastScale();
            const slamCol = (evo && evo.color) ? evo.color : (w.id === 'spiked_shield' ? '#94a3b8' : '#f4a261');
            if (rings.length < 30) rings.push({ x: hx, y: hy, r: sr, color: slamCol, t: 0.22, maxT: 0.22, fill: false });
            if (enemies.length <= 28 && stains.length < 12) pushStain({ x: hx, y: hy, r: 22, color: '#14101c', kind: 'scorch' });
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
                  noProc: !evo,
                  silentHit: true
                });
                if (state !== 'wave') return;
              }
            }
          }
        }
        // 近战剑气波（【绯红九百九十九斩】遗物 或 5 阶兵装进化 waveCount 多道扇形月轮剑波，同步享受先弹射后穿透！）
        const evoWaves = (evo && evo.waveCount) ? evo.waveCount : 0;
        const totalWaves = evoWaves > 0 ? evoWaves : (player.meleeShockwave ? 1 : 0);
        if (totalWaves > 0 && bullets.length < (isTouch ? 180 : 250)) {
          const wSpd = 565;
          const waveCol = (evo && evo.color) ? evo.color : '#ffd166';
          for (let wk = 0; wk < totalWaves && bullets.length < (isTouch ? 180 : 250); wk++) {
            const wAng = w.angle + (totalWaves > 1 ? (wk - (totalWaves - 1) * 0.5) * 0.22 : 0);
            bullets.push({
              x: baseWx + Math.cos(wAng) * 20, y: baseWy + Math.sin(wAng) * 20,
              px: baseWx, py: baseWy,
              vx: Math.cos(wAng) * wSpd, vy: Math.sin(wAng) * wSpd,
              dmg: base * finalMul * (evoWaves > 0 ? 0.58 : 0.48), isCrit: false, angle: wAng,
              pierce: (evoWaves > 0 ? 3 : 2) + player.pierceBonus, bounces: player.bounceBonus || 0, isWaveArc: true,
              isFlame: evoBurn,
              life: 0.48, maxLife: 0.48, color: waveCol, r: evoWaves > 0 ? 11 : 9.5, hit: null, lastHit: null
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
          const totalChains = tpl.chains + (w.tier >= 3 ? 1 : 0) + (w.tier >= 5 ? 1 : 0) + (evo && evo.chainsAdd ? evo.chainsAdd : 0) + (player.bounceBonus || 0);
          castChainLightning(mx, my, best, totalChains, base * finalMul, critChance);
          if (state !== 'wave') return;
          if (evo && evo.blastAdd) {
            triggerExplosion(best.x, best.y, evo.blastAdd * getBlastScale(), base * finalMul * 0.58, false, 0, evo.color || '#60a5fa', false);
            if (state !== 'wave') return;
            if (evo.forceFreeze && Math.random() < evo.forceFreeze && best.hp > 0) best.freezeT = Math.max(best.freezeT || 0, 1.35);
          }
        }
      } else if (tpl.isBeam || tpl.isSniper || tpl.isEmpBeam) {
        // 激光枪 / 狙击枪 / 电磁轨道炮 瞬发射线（严格遵循「先弹射折射、耗尽弹射后再直线贯穿」！）
        w.recoil = 1;
        beep(tpl.isSniper ? 205 : (tpl.isEmpBeam ? 260 : 720), 0.075, 'sawtooth', tpl.isSniper || tpl.isEmpBeam ? 0.055 : 0.038);
        const beamCount = 1 + ((evo && evo.pelletsAdd) ? evo.pelletsAdd : 0);
        const beamCol = (evo && evo.color) ? evo.color : (tpl.isEmpBeam ? '#4cc9f0' : (tpl.isSniper ? '#ffe8a3' : TIER_COLORS[Math.max(2, w.tier)]));
        const beamDur = tpl.isSniper || tpl.isEmpBeam ? 0.22 : 0.16;
        const beamThin = !!tpl.isSniper && !evo;
        if (tpl.isSniper && shells.length < 60) {
          const sa = w.angle - Math.PI * 0.5;
          shells.push({ x: baseWx, y: baseWy, vx: Math.cos(sa) * 110, vy: Math.sin(sa) * 110 - 35, rot: 0, t: 0.5 });
        }
        const maxPierceHits = (tpl.pierce || 3) + player.pierceBonus + ((evo && evo.pierceAdd) ? evo.pierceAdd : 0);
        const rayBounces = (tpl.bounce || 0) + (player.bounceBonus || 0) + ((evo && evo.bounceAdd) ? evo.bounceAdd : 0);
        const hitPad = (tpl.isEmpBeam ? 15 : 9) + (evo ? 3 : 0);
        for (let bIdx = 0; bIdx < beamCount; bIdx++) {
          const bAng = w.angle + (beamCount > 1 ? (bIdx - (beamCount - 1) * 0.5) * 0.16 : 0);
          const ex = baseWx + Math.cos(bAng) * maxR, ey = baseWy + Math.sin(bAng) * maxR;
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

          if (rayBounces > 0 && cands.length > 0 && !bestIsTree) {
            // 先弹射折射、后直线贯穿：命中首个目标即折向邻近敌人，全部弹射次数打完后末段射线再执行剩余贯穿！
            let curE = cands[0].e;
            let curAng = bAng;
            let rayDmg = base * finalMul;
            const rayVisited = new Set([curE]);
            if (beams.length < 36) {
              beams.push({ x1: baseWx + Math.cos(bAng) * 18, y1: baseWy + Math.sin(bAng) * 18, x2: curE.x, y2: curE.y, color: beamCol, thin: beamThin, t: beamDur, maxT: beamDur });
            }
            const firstCrit = Math.random() < critChance;
            lastHitE = curE;
            hurtEnemy(curE, rayDmg * (firstCrit ? critMult : 1), firstCrit, bAng, !tpl.isSniper || !!evo, {
              knockMult: tpl.isSniper ? 1.8 : 1.2,
              forceBurn: !!(evo && evo.forceBurn),
              forceChill: !!tpl.isEmpBeam,
              forceFreeze: !!(evo && evo.forceFreeze && Math.random() < evo.forceFreeze)
            });
            if (state !== 'wave') return;

            let bouncedCount = 0;
            for (let rb = 0; rb < rayBounces; rb++) {
              let nextRayE = null, nextRayDSq = 410 * 410;
              for (let ci = 0; ci < enemies.length; ci++) {
                const cand = enemies[ci];
                if (cand && cand !== curE && cand.hp > 0 && !cand.primed && !rayVisited.has(cand)) {
                  const cdx = cand.x - curE.x, cdy = cand.y - curE.y;
                  if (cdx * cdx + cdy * cdy < nextRayDSq) { nextRayDSq = cdx * cdx + cdy * cdy; nextRayE = cand; }
                }
              }
              if (!nextRayE) {
                nextRayDSq = 385 * 385;
                for (let ci = 0; ci < enemies.length; ci++) {
                  const cand = enemies[ci];
                  if (cand && cand !== curE && cand.hp > 0 && !cand.primed) {
                    const cdx = cand.x - curE.x, cdy = cand.y - curE.y;
                    if (cdx * cdx + cdy * cdy < nextRayDSq) { nextRayDSq = cdx * cdx + cdy * cdy; nextRayE = cand; }
                  }
                }
              }
              if (!nextRayE) break;
              bouncedCount++;
              curAng = Math.atan2(nextRayE.y - curE.y, nextRayE.x - curE.x);
              rayDmg *= (0.92 + (player.bounceAmpDmg || 0));
              if (beams.length < 36) {
                beams.push({ x1: curE.x, y1: curE.y, x2: nextRayE.x, y2: nextRayE.y, color: beamCol, thin: beamThin, t: beamDur, maxT: beamDur });
              }
              const bCrit = Math.random() < critChance;
              lastHitE = nextRayE;
              rayVisited.add(nextRayE);
              hurtEnemy(nextRayE, rayDmg * (bCrit ? critMult : 1), bCrit, curAng, !tpl.isSniper || !!evo, {
                knockMult: tpl.isSniper ? 1.6 : 1.1,
                forceBurn: !!(evo && evo.forceBurn),
                forceChill: !!tpl.isEmpBeam,
                forceFreeze: !!(evo && evo.forceFreeze && Math.random() < evo.forceFreeze)
              });
              if (state !== 'wave') return;
              curE = nextRayE;
            }

            // 弹射次数结算完毕后，沿末段方向释放剩余贯穿（pierce）！
            const remPierce = Math.max(0, maxPierceHits - 1);
            if (remPierce > 0 && curE) {
              const tailLen = bouncedCount > 0 ? maxR * 0.78 : maxR;
              const tx2 = curE.x + Math.cos(curAng) * tailLen, ty2 = curE.y + Math.sin(curAng) * tailLen;
              const tl2 = tailLen * tailLen || 1;
              const tailCands = [];
              for (let ei = 0; ei < enemies.length; ei++) {
                const te = enemies[ei];
                if (!te || te === curE || te.hp <= 0 || te.primed || rayVisited.has(te)) continue;
                const proj = ((te.x - curE.x) * (tx2 - curE.x) + (te.y - curE.y) * (ty2 - curE.y)) / tl2;
                if (proj <= 0 || proj > 1) continue;
                const px = curE.x + proj * (tx2 - curE.x), py = curE.y + proj * (ty2 - curE.y);
                const dxP = te.x - px, dyP = te.y - py, limP = te.r + hitPad;
                if (dxP * dxP + dyP * dyP <= limP * limP) tailCands.push({ e: te, proj });
              }
              tailCands.sort((a, b) => a.proj - b.proj);
              if (tailCands.length > 0 || bouncedCount === 0) {
                if (beams.length < 36) {
                  beams.push({ x1: curE.x, y1: curE.y, x2: tx2, y2: ty2, color: beamCol, thin: beamThin, t: beamDur, maxT: beamDur });
                }
                for (let k = 0; k < Math.min(remPierce, tailCands.length); k++) {
                  const pCrit = Math.random() < critChance;
                  lastHitE = tailCands[k].e;
                  hurtEnemy(lastHitE, rayDmg * (pCrit ? critMult : 1), pCrit, curAng, !tpl.isSniper || !!evo, {
                    knockMult: tpl.isSniper ? 1.6 : 1.1,
                    forceBurn: !!(evo && evo.forceBurn),
                    forceChill: !!tpl.isEmpBeam,
                    forceFreeze: !!(evo && evo.forceFreeze && Math.random() < evo.forceFreeze)
                  });
                  if (state !== 'wave') return;
                }
              }
            }
          } else {
            if (beams.length < 36) {
              beams.push({
                x1: baseWx + Math.cos(bAng) * 18, y1: baseWy + Math.sin(bAng) * 18, x2: ex, y2: ey,
                color: beamCol, thin: beamThin, t: beamDur, maxT: beamDur
              });
            }
            for (let k = 0; k < Math.min(maxPierceHits, cands.length); k++) {
              const isCrit = Math.random() < critChance;
              lastHitE = cands[k].e;
              hurtEnemy(lastHitE, base * finalMul * (isCrit ? critMult : 1), isCrit, bAng, !tpl.isSniper || !!evo, {
                knockMult: tpl.isSniper ? 1.8 : 1.2,
                forceBurn: !!(evo && evo.forceBurn),
                forceChill: !!tpl.isEmpBeam,
                forceFreeze: !!(evo && evo.forceFreeze && Math.random() < evo.forceFreeze)
              });
              if (state !== 'wave') return;
            }
          }

          if (lastHitE && (tpl.isEmpBeam || (evo && (evo.blastAdd || evo.chainOnHit)))) {
            if (tpl.isEmpBeam) {
              const empR = (88 + (evo && evo.blastAdd ? evo.blastAdd * 0.45 : 0)) * getBlastScale();
              if (rings.length < 30) rings.push({ x: lastHitE.x, y: lastHitE.y, r: empR, color: beamCol, t: 0.24, maxT: 0.24 });
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
              if (state !== 'wave') return;
            }
            if (evo && evo.chainOnHit && bIdx === 0 && lastHitE.hp > 0) {
              castChainLightning(lastHitE.x, lastHitE.y, lastHitE, evo.chainOnHit, base * finalMul * 0.55, critChance * 0.5);
              if (state !== 'wave') return;
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
        if (sixthShot) addText(player.x, player.y - 32, '第六发必暴!', '#ffd166', 13, 0.62, false);
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
            bounces: (tpl.bounce || 0) + evoBounce + (tpl.isRocket || tpl.isFlame ? 0 : player.bounceBonus) + (tpl.isStar && isCrit ? 1 : 0),
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
    const offset = w.thrust * (w.id === 'spear' ? 58 : (w.id === 'stick' ? 48 : 40)) - w.recoil * 7;
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
          if ((player.bounceBonus || 0) > 0) {
            // 浮游激光塔在持有弹射加成时同样先折射再贯穿
            if (beams.length < 30) {
              beams.push({ x1: t.x + Math.cos(t.angle) * 14, y1: t.y + Math.sin(t.angle) * 14, x2: best.x, y2: best.y, color: isCrit ? '#ffd166' : '#c77dff', thin: true, t: 0.14, maxT: 0.14 });
            }
            hurtEnemy(best, ldmg, isCrit, t.angle, true, { noProc: !player.turretElem, silentHit: enemies.length > 24 });
            if (state !== 'wave') return;
            let bNext = null, bDSq = 360 * 360;
            for (let ei = 0; ei < enemies.length; ei++) {
              const cand = enemies[ei];
              if (cand && cand !== best && cand.hp > 0 && !cand.primed) {
                const cdx = cand.x - best.x, cdy = cand.y - best.y;
                if (cdx * cdx + cdy * cdy < bDSq) { bDSq = cdx * cdx + cdy * cdy; bNext = cand; }
              }
            }
            if (bNext) {
              const ba2 = Math.atan2(bNext.y - best.y, bNext.x - best.x);
              if (beams.length < 30) beams.push({ x1: best.x, y1: best.y, x2: bNext.x, y2: bNext.y, color: isCrit ? '#ffd166' : '#c77dff', thin: true, t: 0.14, maxT: 0.14 });
              hurtEnemy(bNext, ldmg * (0.92 + (player.bounceAmpDmg || 0)), isCrit, ba2, true, { noProc: !player.turretElem, silentHit: enemies.length > 24 });
              if (state !== 'wave') return;
            }
          } else {
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
                hurtEnemy(e, ldmg, isCrit, t.angle, true, { noProc: !player.turretElem, silentHit: enemies.length > 24 });
                if (state !== 'wave') return;
              }
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
            dmg: tdmg, isCrit, angle: t.angle,
            pierce: (t.tier >= 2 ? 1 : 0) + (player.pierceBonus > 0 ? 1 : 0),
            bounces: (player.bounceBonus || 0) > 0 ? 1 : 0,
            turretShot: true,
            life: bLife, maxLife: bLife, color: isCrit ? '#ffd166' : '#72efdd', r: 4.2, hit: null, lastHit: null
          });
        }
      }
    }
  }

  // 玩家投射物更新（严格遵循「先弹射 bounces、耗尽弹射后再穿透 pierce」）
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
    if (state !== 'wave') return;
    const b = bullets[i];
    if (!b) continue;
    b.px = b.x; b.py = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.isStar || b.isGrenade) b.spin += dt * (b.isGrenade ? 14 : 22);
    if (b.isFlame) { b.vx *= (1 - dt * 1.6); b.vy *= (1 - dt * 1.6); b.r += dt * 20; }
    if (b.isRocket || b.isGrenade) {
      b.smokeT -= dt;
      if (b.smokeT <= 0) {
        b.smokeT = b.isGrenade ? 0.065 : 0.045;
        pushParticle({ x: b.x - Math.cos(b.angle) * 8, y: b.y - Math.sin(b.angle) * 8, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18, r: 3.0 + Math.random() * 2.0, color: 'rgba(205, 198, 218, 0.32)', t: 0.20, maxT: 0.20 });
      }
    }

    const outBounds = b.x < 0 || b.x > WORLD.w || b.y < 0 || b.y > WORLD.h;
    if (b.life <= 0 || outBounds) {
      if (b.isRocket || b.isGrenade) triggerExplosion(b.x, b.y, b.blastR || 76, b.dmg * (b.isGrenade ? 0.85 : elemMul), false, 0, '#ff9f1c', true);
      else if (b.isPlasma) triggerExplosion(b.x, b.y, b.blastR || 82, b.dmg * 0.85 * elemMul, false, 0, '#c77dff', false);
      if (state !== 'wave') return;
      bullets.splice(i, 1); continue;
    }

    // 子弹命中异星晶树（同样严格先弹射向附近敌人，无弹射时再消耗穿透）
    for (let tIdx = trees.length - 1; tIdx >= 0; tIdx--) {
      const tr = trees[tIdx];
      if (!tr || tr.hp <= 0 || hasBulletHit(b, tr)) continue;
      const tdx = tr.x - b.x, tdy = tr.y - b.y, thit = tr.r + b.r;
      if (tdx * tdx + tdy * tdy < thit * thit) {
        markBulletHit(b, tr);
        hurtTree(tr, b.dmg);
        if (b.isRocket) {
          triggerExplosion(b.x, b.y, b.blastR || 76, b.dmg * elemMul, false, 0, '#ff9f1c', true);
          if (state !== 'wave') return;
          b.life = -1; break;
        }
        if (b.bounces > 0 && bounceBulletToNearest(b, null)) {
          if (state !== 'wave') return;
          break;
        }
        if (b.isGrenade) {
          triggerExplosion(b.x, b.y, b.blastR || 76, b.dmg * 0.85, false, 0, '#ff9f1c', true);
          if (state !== 'wave') return;
          b.life = -1; break;
        }
        if (b.pierce <= 0) { b.life = -1; break; }
        b.pierce--;
      }
    }
    if (b.life <= 0) {
      if (b.isPlasma) triggerExplosion(b.x, b.y, b.blastR || 82, b.dmg * 0.85 * elemMul, false, 0, '#c77dff', false);
      if (state !== 'wave') return;
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
            if (state !== 'wave') return;
            if (b.evoChain > 0 && e.hp > 0) {
              castChainLightning(b.x, b.y, e, b.evoChain, b.dmg * 0.55, 0.25);
              if (state !== 'wave') return;
            }
            b.life = -1; break;
          }
          hurtEnemy(e, b.dmg, b.isCrit, b.angle, b.isFlame || b.isPlasma || b.isWaveArc || b.forceEvoBurn, {
            isMelee: !!b.isWaveArc,
            noProc: !!(b.noProc || (b.turretShot && !player.turretElem)),
            silentHit: !!(b.noProc || (b.turretShot && enemies.length > 26)),
            forceBurn: b.isFlame || b.forceEvoBurn,
            forceChill: b.isIce,
            forceFreeze: b.freezeHit > 0 && Math.random() < b.freezeHit,
            forcePoison: b.poisonHit > 0 && Math.random() < b.poisonHit,
            knockMult: b.isFlame ? 0.15 : (b.isBolt ? 1.35 : 1)
          });
          if (state !== 'wave') return;
          if (b.shredBlast > 0 && Math.random() < b.shredBlast) {
            triggerExplosion(b.x, b.y, (b.blastR || 64 * getBlastScale()), b.dmg * 0.65, false, 0, b.color || '#ff9f1c', false);
            if (state !== 'wave') return;
          } else if (b.evoBlastR > 0 && !b._evoBlasted) {
            b._evoBlasted = true;
            triggerExplosion(b.x, b.y, b.evoBlastR, b.dmg * 0.58, false, 0, b.color || '#ffd166', false);
            if (state !== 'wave') return;
          }
          if (b.evoChain > 0 && !b._evoChained && e.hp > 0 && (!b.isFlame && Math.random() < 0.55)) {
            b._evoChained = true;
            castChainLightning(e.x, e.y, e, b.evoChain, b.dmg * 0.52, 0.20);
            if (state !== 'wave') return;
          }

          // 第一优先级：弹射（bounces > 0 时优先折射至邻近敌人，不扣除 pierce！）
          if (b.bounces > 0 && bounceBulletToNearest(b, e)) {
            if (state !== 'wave') return;
            break;
          }
          // 第二优先级：弹射耗尽（或场上仅剩唯一目标无处可弹）后，再结算穿透（pierce）！
          if (b.pierce <= 0) {
            if (b.isGrenade) {
              triggerExplosion(b.x, b.y, b.blastR || 76, b.dmg * 0.85, false, 0, '#ff9f1c', true);
              if (state !== 'wave') return;
            }
            b.life = -1; break;
          }
          b.pierce--;
          if (player.bounceAmpDmg > 0) b.dmg *= (1 + player.bounceAmpDmg);
        }
      }
    }
    if (b.life <= 0 && !b.isRocket && !b.isGrenade) {
      if (b.isPlasma) {
        triggerExplosion(b.x, b.y, b.blastR || 82, b.dmg * 0.85 * elemMul, false, 0, '#c77dff', false);
        if (state !== 'wave') return;
      }
      bullets.splice(i, 1);
    } else if (b.life <= 0) {
      bullets.splice(i, 1);
    }
  }
  compactAliveEnemies();

  // 预筛有效地面池沼地形（无地面池沼时百怪循环 0 地形遍历开销）
  _activePoolTerrains.length = 0;
  for (let tIdx = 0; tIdx < terrains.length; tIdx++) {
    const tr = terrains[tIdx];
    if (tr && tr.kind !== 'chasm') _activePoolTerrains.push(tr);
  }
  const poolTerrainCnt = _activePoolTerrains.length;

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

    // 灼烧持续伤害（每 0.45 秒结算一次，数字干净不刷屏）
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.burnTick -= dt;
      if (e.burnTick <= 0) {
        e.burnTick = 0.45;
        hurtEnemy(e, e.burnDmg * 0.45, false, null, true, { isDot: true, dotColor: '#ff9f1c', noProc: true });
        if (state !== 'wave') return;
        if (e.hp <= 0) continue;
      }
    }
    // 剧毒持续腐蚀伤害（叠层结算，并同步赋予怪物最高 +36% 易伤）
    if (e.poisonT > 0 && e.poisonStacks > 0) {
      e.poisonT -= dt;
      e.poisonTick = (e.poisonTick || 0.25) - dt;
      if (e.poisonTick <= 0) {
        e.poisonTick = 0.48;
        const pDmg = (2.3 + wave * 0.78) * e.poisonStacks * elemMul * effDmg * 0.48;
        hurtEnemy(e, pDmg, false, null, true, { isDot: true, dotColor: '#a3e635', noProc: true });
        if (state !== 'wave') return;
        if (e.hp <= 0) continue;
      }
      if (e.poisonT <= 0) e.poisonStacks = 0;
    }
    // 泥沼地形对怪物的轻微毒蚀（伤害与易伤均严格减半，主要针对玩家）
    if ((e.swampDotT || 0) > 0) {
      e.swampDotT -= dt;
      if (!(e.poisonT > 0 && e.poisonStacks > 0)) {
        e.swampDotTick = (e.swampDotTick || 0.25) - dt;
        if (e.swampDotTick <= 0) {
          e.swampDotTick = 0.48;
          const sDmg = (1.15 + wave * 0.39) * elemMul * effDmg * 0.48;
          hurtEnemy(e, sDmg, false, null, true, { isDot: true, dotColor: '#a3e635', noProc: true });
          if (state !== 'wave') return;
          if (e.hp <= 0) continue;
        }
      }
    }

    if (e.chillT > 0) e.chillT -= dt;
    if (e.freezeT > 0) e.freezeT = Math.max(0, e.freezeT - dt);
    if (e.exposeT > 0) e.exposeT = Math.max(0, e.exposeT - dt);
    if (e.sunderT > 0) e.sunderT = Math.max(0, e.sunderT - dt);
    if (e._touchCd > 0) e._touchCd = Math.max(0, e._touchCd - dt);

    const isBossUnit = e.type === 'boss' || e.type === 'special_boss';
    const isFrozenLocked = !isBossUnit && e.type !== 'mini_boss' && e.freezeT > 0;
    // 战场地形对怪物的伤害与减速减益严格减半（熔岩减速 -18%→-9% 且灼烧减半；泥沼减速 -38%→-19% 且毒蚀减半；冰面减速 -15%→-7.5%）
    let eTerrainSpd = 1;
    for (let tIdx = 0; tIdx < poolTerrainCnt; tIdx++) {
      const tr = _activePoolTerrains[tIdx];
      if (isPointInTerrain(tr, e.x, e.y, e.r * 0.38)) {
        if (tr.kind === 'lava') {
          eTerrainSpd = Math.min(eTerrainSpd, 0.91);
          if (!e.burnT || e.burnT < 0.45) {
            e.burnT = 0.70;
            e.burnDmg = Math.max(e.burnDmg || 0, (6 + wave * 1.4) * diff.hpMul);
            if (!e.burnTick || e.burnTick <= 0) e.burnTick = 0.25;
          }
        } else if (tr.kind === 'swamp') {
          eTerrainSpd = Math.min(eTerrainSpd, 0.81);
          if ((!e.swampDotT || e.swampDotT < 0.40) && !isBossUnit) {
            e.swampDotT = 0.75;
          }
        } else if (tr.kind === 'ice_sheet') {
          // 小怪踏入冷冻地形仅承受 20% 减速，绝不会被冰封禁锢
          eTerrainSpd = Math.min(eTerrainSpd, 0.80);
        }
      }
    }
    const terrainFactor = isBossUnit ? Math.max(0.91, eTerrainSpd) : eTerrainSpd;
    e._terrainSpdMul = terrainFactor;
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

      if (tickBossVenomBreath(e, dt, a, bossMult)) return;
      if (tickBossPhase2Skill(e, dt, a, bossMult)) return;

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
              spawnHazard(e.x + Math.cos(ha) * 176, e.y + Math.sin(ha) * 176, 62, e.dmg * 1.08, 0.95, { color: '#38bdf8', style: 'frost_hex' });
            }
          } else if (e.sigKind === 'chrono_dial') {
            if (rings.length < 40) rings.push({ x: e.x, y: e.y, r: 175, color: '#fde68a', t: 0.34, maxT: 0.34 });
            for (let k = 0; k < 12 && eBullets.length < 170; k++) {
              const ba = baseA + (k / 12) * Math.PI * 2;
              const spd = 128 + (k % 3) * 28;
              eBullets.push({ x: e.x, y: e.y, px: e.x, py: e.y, vx: Math.cos(ba) * spd, vy: Math.sin(ba) * spd, dmg: Math.max(4, Math.round(e.dmg * 0.78)), r: 6.2, color: k % 2 === 0 ? '#fde68a' : '#c084fc', shape: k % 3 === 0 ? 'crescent' : 'lance' });
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
        // 【碎冕霜女皇 · 艾丝特莉亚】机制特征：旋转双翼/二阶四翼极光冰束扫射 + 寒渊三叉冰戟扇射 + 六合冰牢封走位 + 寒晶双轨突进
        if ((e.beamSweepT || 0) > 0) {
          e.beamSweepT -= dt;
          e.beamSweepA = (e.beamSweepA || 0) + dt * (enraged ? 1.55 : 1.25);
          e._beamHitCd = Math.max(0, (e._beamHitCd || 0) - dt);
          const bLen = e.beamSweepQuad ? 385 : 350;
          const beamCnt = e.beamSweepQuad ? 4 : 2;
          for (let bi = 0; bi < beamCnt; bi++) {
            const ba = e.beamSweepA + (bi / beamCnt) * Math.PI * 2;
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
          if (e.beamSweepT <= 0) {
            e.beamSweepQuad = false;
            e.exposeT = Math.max(e.exposeT || 0, 1.15);
          }
        } else if (e.dashing) {
          if (!advanceLinearDash(e, dt)) {
            finishLinearDash(e, enraged ? 3.2 : 3.9);
            // 冲刺落地立即开启 1.65s 极光双翼冰束旋转扫射！
            e.beamSweepQuad = false;
            e.beamSweepT = 1.65;
            e.beamSweepMaxT = 1.65;
            e.beamSweepA = a + 0.52;
            addText(e.x, e.y - e.r - 18, '❄️ 极光双翼冰束扫射!', '#7dd3fc', 14, 1.35);
            beep(520, 0.12, 'sine', 0.05);
          }
        } else {
          e.dashT -= dt * slowFactor * bossMult;
          if (e.dashT <= 0.50 && e.dashT > 0 && e.lockedAim === undefined) {
            lockLinearDash(e, a, 275, 0.50, '#72efdd', 'frost_rail');
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
            spawnHazard(player.x + Math.cos(ba) * 128, player.y + Math.sin(ba) * 128, 56, e.dmg * 1.06, 1.18, { color: '#38bdf8', style: 'frost_hex' });
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
              spawnHazard(hx, hy, 58, e.dmg * 1.12, 1.05 + (row + 1) * 0.16, { color: '#fb5607', style: 'flame_pillar' });
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
            lockLinearDash(e, a, 310, 0.46, '#6ee7b7', 'frost_rail');
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
              eBullets.push({ x: e.x, y: e.y, vx: Math.cos(ba2) * 124, vy: Math.sin(ba2) * 124, dmg: Math.max(4, Math.round(e.dmg * 0.72)), r: 5.8, color: '#80ed99', shape: 'stinger' });
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
            lockLinearDash(e, a, seraphDist, 0.54, '#ffd166', 'spear_conduit');
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
            spawnHazard(player.x + stepX * b, player.y + stepY * b, 66, e.dmg * 1.12, 0.92 + b * 0.24, { color: '#ffd166', style: 'thunder_sigil' });
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
              lockLinearDash(e, aimNow, butcherDist * 0.88, 0.44, '#fb7185', 'iai_slash');
            } else {
              finishLinearDash(e, enraged ? 2.55 : 3.15);
              e.exposeT = Math.max(e.exposeT || 0, 1.35);
            }
          }
        } else {
          e.dashT -= dt * slowFactor * bossMult;
          if (e.dashT <= 0.54 && e.dashT > 0 && e.lockedAim === undefined) {
            e.comboDashesLeft = enraged ? 2 : 1; // 二连 / 狂暴三连疾风居合斩！
            lockLinearDash(e, a, butcherDist, 0.54, '#ff2a55', 'iai_slash');
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
      const mbPace = e.mythicPhase2 ? 1.12 : 1.0;
      if (tickBossVenomBreath(e, dt, a, mbPace)) return;
      if (tickBossPhase2Skill(e, dt, a, mbPace)) return;
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
            spawnHazard(player.x + Math.cos(ha) * 78, player.y + Math.sin(ha) * 78, 56, e.dmg * 1.06, 1.18, { color: '#ff9f1c', style: 'flame_pillar' });
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
            lockLinearDash(e, a, 300, 0.46, '#72efdd', 'iai_slash');
          }
          if (e.dashT <= 0) {
            startLinearDash(e, a, 300, 0.34);
            for (let k = 0; k < 6 && eBullets.length < 170; k++) {
              const ba = (k / 6) * Math.PI * 2 + e.phase;
              eBullets.push({ x: e.x, y: e.y, px: e.x, py: e.y, vx: Math.cos(ba) * 156, vy: Math.sin(ba) * 156, dmg: Math.max(4, Math.round(e.dmg * 0.70)), r: 6.2, color: '#72efdd', shape: 'lance' });
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
            spawnHazard(player.x + (Math.random() - 0.5) * 170, player.y + (Math.random() - 0.5) * 170, 68, e.dmg * 1.05, 1.22, { color: '#52b788', style: 'venom_mire' });
          }
          if (enemies.length < 70) {
            spawnWarning(Math.max(80, Math.min(WORLD.w - 80, e.x + (Math.random() - 0.5) * 140)), Math.max(80, Math.min(WORLD.h - 80, e.y + (Math.random() - 0.5) * 140)), 'splitter');
          }
        }
      } else if (e.variant === 'glacial_valkyrie') {
        // 凛霜圣枪统领：极北寒霜圣枪双轨导轨冲锋 + 落点三联寒霜三叉戟 + 直线冰川推进（二阶段支援四翼极光束）
        if ((e.beamSweepT || 0) > 0) {
          e.beamSweepT -= dt;
          e.beamSweepA = (e.beamSweepA || 0) + dt * 1.35;
          e._beamHitCd = Math.max(0, (e._beamHitCd || 0) - dt);
          const bLen = 330;
          const beamCnt = e.beamSweepQuad ? 4 : 2;
          for (let bi = 0; bi < beamCnt; bi++) {
            const ba = e.beamSweepA + (bi / beamCnt) * Math.PI * 2;
            const bx2 = e.x + Math.cos(ba) * bLen, by2 = e.y + Math.sin(ba) * bLen;
            const proj = Math.max(0, Math.min(1, ((player.x - e.x) * (bx2 - e.x) + (player.y - e.y) * (by2 - e.y)) / (bLen * bLen)));
            const px = e.x + proj * (bx2 - e.x), py = e.y + proj * (by2 - e.y);
            if (e._beamHitCd <= 0 && Math.hypot(player.x - px, player.y - py) <= player.r + 12) {
              e._beamHitCd = 0.34;
              hurtPlayer(Math.round(e.dmg * 0.90));
              if (state !== 'wave') return;
            }
          }
          if (e.beamSweepT <= 0) e.beamSweepQuad = false;
        }
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
            lockLinearDash(e, a, 305, 0.50, '#48cae4', 'frost_rail');
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
            spawnHazard(e.x + Math.cos(a) * (step * 95), e.y + Math.sin(a) * (step * 95), 54, e.dmg * 1.06, 0.85 + step * 0.20, { color: '#38bdf8', style: 'frost_hex' });
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
            spawnHazard(e.x + Math.cos(a) * (step * 88), e.y + Math.sin(a) * (step * 88), 60, e.dmg * 1.12, 0.82 + step * 0.22, { color: '#eab308', style: 'thunder_sigil' });
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
            lockLinearDash(e, a, 295, 0.48, '#38bdf8', 'spear_conduit');
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
            spawnHazard(lx, ly, 60, e.dmg * 1.05, 1.20, { color: '#38bdf8', style: 'thunder_sigil' });
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
              lockLinearDash(e, reAim, 285, 0.46, '#f72585', 'battering_ram');
            } else {
              finishLinearDash(e, 2.75);
            }
          }
        } else {
          e.dashT -= dt * slowFactor;
          if (e.dashT <= 0.56 && e.dashT > 0 && e.lockedAim === undefined) {
            e._vanguardCombo = 1;
            lockLinearDash(e, a, 310, 0.56, '#f72585', 'battering_ram');
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
      // 地图奇遇三大隐藏首领：彻底差异化技能演出（猩红居合一闪斩 / 黄金锯盘晶柱阵 / 噬界奇点黑洞牵引+剧毒龙息）
      const enraged = (e.hp < e.maxHp * 0.5) || overtime || !!e.mythicPhase2;
      const sbMult = (enraged ? 1.15 : 1) * (e.mythicPhase2 ? 1.12 : 1);

      if (tickBossVenomBreath(e, dt, a, sbMult)) return;
      if (tickBossPhase2Skill(e, dt, a, sbMult)) return;

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
            lockLinearDash(e, a, 335, 0.48, '#ff4d6d', 'iai_slash');
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
    } else if (e.type === 'charger') {
      // 眠冬寒枪破阵骑：尖角多级楔阵冲锋轨 + 冲刺收招前挑新月斩（告别单调不同颜色方框预警！）
      const chargeDist = 295;
      const windupSec = 0.54;
      if (e.dashing) {
        if (!advanceLinearDash(e, dt)) {
          const finA = e.dashAng !== undefined ? e.dashAng : a;
          if (rings.length < 36) rings.push({ x: e.x, y: e.y, r: 68, color: '#fb923c', t: 0.22, maxT: 0.22 });
          if (slashes.length < 36) {
            slashes.push({ x: e.x + Math.cos(finA) * 26, y: e.y + Math.sin(finA) * 26, angle: finA, r: 66, color: '#fdba74', mode: 'crescent', t: 0.22, maxT: 0.22 });
          }
          const dxC = player.x - e.x, dyC = player.y - e.y, dC = Math.hypot(dxC, dyC);
          if (dC <= 76 + player.r) {
            let daC = Math.abs(Math.atan2(dyC, dxC) - finA) % (Math.PI * 2);
            if (daC > Math.PI) daC = Math.PI * 2 - daC;
            if (daC < 1.05) {
              hurtPlayer(Math.round(e.dmg * 0.92));
              if (state !== 'wave') return;
            }
          }
          finishLinearDash(e, 2.25);
        }
      } else {
        e.dashT -= dt * slowFactor;
        if (e.dashT <= windupSec && e.dashT > 0 && e.lockedAim === undefined) {
          lockLinearDash(e, a, chargeDist, windupSec, '#fb923c', 'horn_wedge');
        }
        if (e.dashT <= 0) {
          const ca = startLinearDash(e, a, chargeDist, 0.33);
          addSparks(e.x, e.y, ca + Math.PI, '#fdba74', 4);
          advanceLinearDash(e, dt);
        } else if (e.dashT > windupSec) {
          e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
        }
      }
    } else if (e.type === 'sand_worm') {
      // 蚀影潜渊骨蛇：彻底重做为【遁地潜行破土奇袭】（不再复用直线冲刺走廊！潜地黑影游走 -> 脚下八角裂纹破土冲出 + 斜十字骨刺迸射）
      if ((e.burrowWindup || 0) > 0) {
        e.burrowWindup -= dt * slowFactor;
        if (e.burrowWindup <= 0) {
          e.burrowWindup = 0;
          e.burrowT = 0.62;
          e.burrowMaxT = 0.62;
          e._burrowA = a;
          if (rings.length < 36) rings.push({ x: e.x, y: e.y, r: 44, color: '#f59e0b', t: 0.22, maxT: 0.22, kind: 'hex' });
          addBurst(e.x, e.y, '#78350f', 6, 95);
        }
      } else if ((e.burrowT || 0) > 0) {
        e.burrowT -= dt;
        e._burrowA = _lerpAngle(e._burrowA !== undefined ? e._burrowA : a, a, Math.min(1, dt * 3.8));
        const bSpd = curSpd * 2.38;
        e.x += Math.cos(e._burrowA) * bSpd * dt;
        e.y += Math.sin(e._burrowA) * bSpd * dt;
        if (Math.random() < dt * 18) {
          pushParticle({ x: e.x + (Math.random() - 0.5) * 18, y: e.y + (Math.random() - 0.5) * 18, vx: 0, vy: -14, r: 4.5, color: '#fbbf24', t: 0.24, maxT: 0.24 });
        }
        if (e.burrowT <= 0) {
          e.burrowT = 0;
          e.burrowCd = 2.35 + Math.random() * 0.45;
          beep(175, 0.09, 'sawtooth', 0.042);
          if (rings.length < 36) rings.push({ x: e.x, y: e.y, r: 72, color: '#fbbf24', t: 0.28, maxT: 0.28, kind: 'hex' });
          addBurst(e.x, e.y, '#f59e0b', 9, 135);
          for (let k = 0; k < 4 && eBullets.length < 170; k++) {
            const ba = (k + 0.5) * (Math.PI * 0.5);
            eBullets.push({
              x: e.x, y: e.y, px: e.x, py: e.y,
              vx: Math.cos(ba) * 145, vy: Math.sin(ba) * 145,
              life: 0.68,
              dmg: Math.max(3, Math.round(e.dmg * 0.78)), r: 5.4, hitR: 4.8, color: '#fde68a', shape: 'stinger'
            });
          }
          if (Math.hypot(player.x - e.x, player.y - e.y) <= 66 + player.r) {
            hurtPlayer(Math.round(e.dmg * 1.05));
            if (state !== 'wave') return;
          }
        }
      } else {
        e.burrowCd = (e.burrowCd === undefined ? 2.1 : e.burrowCd) - dt * slowFactor;
        if (e.burrowCd <= 0 && distP < 310 && distP > 64) {
          e.burrowWindup = 0.38;
          e._burrowA = a;
        } else {
          const slitherA = a + Math.sin(e.phase * 0.9) * 0.42;
          e.x += Math.cos(slitherA) * curSpd * dt; e.y += Math.sin(slitherA) * curSpd * dt;
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
      const zigSpd = distP < 58 ? 1.28 : 1.35;
      e.faceA = zigAngle;
      e.x += Math.cos(zigAngle) * curSpd * zigSpd * dt;
      e.y += Math.sin(zigAngle) * curSpd * zigSpd * dt;
      e.slashCd = (e.slashCd || 0) - dt * slowFactor;
      if (distP < 68 && e.slashCd <= 0) {
        e.slashCd = 0.92;
        if (slashes.length < 36) slashes.push({ x: e.x + Math.cos(a) * 14, y: e.y + Math.sin(a) * 14, angle: a, r: 46, color: '#06d6a0', mode: 'claw', t: 0.16, maxT: 0.16 });
      }
    } else if (e.type === 'sniper_bug') {
      // 【差异化远程 1 · 寒晶狙击蛛】：0.72s 高对比双层红外激光锁定 -> 射出渐进加速的醒目重型猩红贯日长矛（绝非看不清的小细针；近身被贴脸时后撤且开火后硬直，利好近战突袭）
      if ((e.recoilT || 0) > 0) e.recoilT -= dt;
      if (e.aimA === undefined && !(e.recoilT > 0)) {
        if (distP > 365) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
        else if (distP < 185) { e.x -= Math.cos(a) * curSpd * 0.82 * dt; e.y -= Math.sin(a) * curSpd * 0.82 * dt; }
      }
      e.shotT -= dt * slowFactor;
      const aimWin = e.aimMaxT || 0.72;
      if (e.shotT <= aimWin && e.shotT > 0 && e.aimA === undefined) {
        if (distP < 95) {
          // 被近战贴脸压制时被迫重架枪口，给近战输出空间
          e.shotT = 0.95;
        } else {
          e.aimA = a;
        }
      } else if (e.shotT <= 0) {
        const sa = e.aimA !== undefined ? e.aimA : a;
        e.aimA = undefined;
        e.recoilT = 0.52;
        e.shotT = e.elite ? 2.40 : 3.05;
        addSparks(e.x + Math.cos(sa) * e.r, e.y + Math.sin(sa) * e.r, sa, '#ffd166', 4);
        if (eBullets.length < 170) {
          eBullets.push({
            x: e.x, y: e.y, px: e.x, py: e.y,
            vx: Math.cos(sa) * 158, vy: Math.sin(sa) * 158,
            accel: 190, maxSpd: 286,
            dmg: e.dmg, r: 6.0, hitR: 5.2, color: '#ff3366', shape: 'lance'
          });
        }
      }
    } else if (e.type === 'spinner') {
      // 【差异化远程 2 · 旋刃陀螺偶】：投掷双翼大弧度六刃鎏金涡轮盘（两侧外扩包抄，正中留出宽敞近战突脸走廊！）
      if (distP > 250) {
        e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
      } else {
        const oa = a + (e.orbitDir || 1) * 1.18;
        e.x += Math.cos(oa) * curSpd * 0.85 * dt; e.y += Math.sin(oa) * curSpd * 0.85 * dt;
      }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.25 : 2.80;
        for (const side of [-1, 1]) {
          if (eBullets.length >= 170) break;
          const la = a + side * 0.54;
          eBullets.push({
            x: e.x, y: e.y, px: e.x, py: e.y,
            vx: Math.cos(la) * 148, vy: Math.sin(la) * 148,
            curve: -side * 0.76, life: 2.55,
            dmg: Math.max(3, Math.round(e.dmg * 0.90)), r: 7.8, hitR: 7.0, color: '#fbbf24', shape: 'disc', rot: 0
          });
        }
      }
    } else if (e.type === 'rad_scorpion') {
      // 【差异化远程 3 · 发条毒蝎】：尾针蓄芒迸射【雁形楔阵翠毒弯钩刺】（主锋快、两翼慢形成立体楔形毒芒，流线精致）
      if (distP > 235) {
        const scorpA = a + Math.sin(e.phase * 0.7) * 0.36;
        e.x += Math.cos(scorpA) * curSpd * dt; e.y += Math.sin(scorpA) * curSpd * dt;
      } else if (distP < 140) {
        e.x -= Math.cos(a) * curSpd * 0.45 * dt; e.y -= Math.sin(a) * curSpd * 0.45 * dt;
      }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.05 : 2.55;
        addSparks(e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, a, '#4ade80', 3);
        for (let k = -1; k <= 1 && eBullets.length < 170; k++) {
          const sa = a + k * 0.30;
          const spd = k === 0 ? 174 : 144;
          eBullets.push({
            x: e.x, y: e.y, px: e.x, py: e.y,
            vx: Math.cos(sa) * spd, vy: Math.sin(sa) * spd,
            dmg: Math.max(3, Math.round(e.dmg * 0.88)), r: 5.8, hitR: 5.2, color: '#4ade80', shape: 'stinger'
          });
        }
      }
    } else if (e.type === 'frost_wisp') {
      // 【差异化远程 4 · 眠冬冰冠亡灵】：双生反向正弦交织 S 波【寒霜六棱冰魄梭】（双螺旋蛇行轨迹，晶莹剔透易预判）
      if (distP > 235) {
        e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt;
      } else {
        const oa = a + (e.orbitDir || 1) * 1.15;
        e.x += Math.cos(oa) * curSpd * 0.72 * dt; e.y += Math.sin(oa) * curSpd * 0.72 * dt;
      }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.05 : 2.55;
        const cnt = (e.elite || wave >= 8) ? 2 : 1;
        for (let k = 0; k < cnt && eBullets.length < 170; k++) {
          const wSign = k === 0 ? 1 : -1;
          eBullets.push({
            x: e.x, y: e.y, px: e.x, py: e.y,
            baseAng: a, baseSpd: 148,
            vx: Math.cos(a) * 148, vy: Math.sin(a) * 148,
            waveAmp: 46, waveFreq: 6.4, waveSign: wSign, life: 3.1,
            dmg: e.dmg, r: 5.8, hitR: 5.2, color: '#38bdf8', shape: 'frost_bolt', chillPlayer: true
          });
        }
      }
    } else if (e.type === 'spore_mother') {
      // 【差异化远程 5 · 蚀忆魂灯龛】：取消同质化地面圆圈！改为架设旋转【紫晶十字裂变棱镜光轨】（四角象限留白安全）+ 4 向悬停星芒宝珠
      if (distP > 240) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.65 : 3.25;
        if (distP > 92 && hazards.length < 28) {
          spawnHazard(player.x + (Math.random() - 0.5) * 56, player.y + (Math.random() - 0.5) * 56, 32, e.dmg, 1.22, {
            color: '#c084fc',
            style: 'cross_beam',
            angle: (e.phase || 0) * 0.4 + Math.PI * 0.25,
            rotSpd: 0.42,
            halfLen: e.elite ? 142 : 124,
            halfW: 14
          });
        }
        const rot0 = e.phase * 0.5;
        for (let k = 0; k < 4 && eBullets.length < 170; k++) {
          const ba = rot0 + k * (Math.PI * 0.5);
          eBullets.push({
            x: e.x, y: e.y, px: e.x, py: e.y,
            vx: Math.cos(ba) * 102, vy: Math.sin(ba) * 102,
            accel: -14, minSpd: 54, curve: 0.28, life: 3.3,
            dmg: Math.max(3, Math.round(e.dmg * 0.84)), r: 7.4, hitR: 6.2, color: '#e0aaff', shape: 'orb'
          });
        }
      }
    } else if (e.type === 'shooter') {
      // 【差异化远程 6 · 折光霜晶浮灵】：双轨外弧钳形弹（左右张开 ±20° 弧形包夹，正面 135px 中路完全留空，近战直线冲脸绝不被糊脸！）
      if (distP > 245) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      else if (distP < 145) { e.x -= Math.cos(a) * curSpd * 0.55 * dt; e.y -= Math.sin(a) * curSpd * 0.55 * dt; }
      else {
        const strafeA = a + Math.sin(e.phase * 0.45) * 1.25;
        e.x += Math.cos(strafeA) * curSpd * 0.52 * dt; e.y += Math.sin(strafeA) * curSpd * 0.52 * dt;
      }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0) {
        e.shotT = e.elite ? 2.05 : 2.50;
        const leadX = player.x + (player.moving ? dx * 10 : 0);
        const leadY = player.y + (player.moving ? dy * 10 : 0);
        const sa = Math.atan2(leadY - e.y, leadX - e.x);
        addSparks(e.x + Math.cos(sa) * e.r, e.y + Math.sin(sa) * e.r, sa, '#00f5d4', 2);
        for (const side of [-1, 1]) {
          if (eBullets.length >= 169) break;
          const la = sa + side * 0.34;
          eBullets.push({
            x: e.x, y: e.y, px: e.x, py: e.y,
            vx: Math.cos(la) * 162, vy: Math.sin(la) * 162,
            curve: -side * 0.46, life: 2.7,
            dmg: e.dmg, r: 6.2, hitR: 5.3, color: '#00f5d4', shape: 'acid'
          });
        }
        if ((wave >= 8 || e.elite) && eBullets.length < 169) {
          // 高波/精英追加一枚慢速重型尾随凝晶球，形成快慢双层节奏而非无脑散弹糊脸
          eBullets.push({
            x: e.x, y: e.y, px: e.x, py: e.y,
            vx: Math.cos(sa) * 112, vy: Math.sin(sa) * 112,
            life: 2.8,
            dmg: e.dmg, r: 6.8, hitR: 5.6, color: '#38bdf8', shape: 'orb'
          });
        }
      }
    } else if (e.type === 'splitter') {
      // 黑水三核裂影怪：纯近战“蓄蹲停顿—猛然蛙跃”脉冲逼近 + 击杀分裂 3 只高速子嗣（不再发射粘液弹，严控场上远程密度）
      if ((e.vx || e.vy) && (Math.abs(e.vx) > 4 || Math.abs(e.vy) > 4)) {
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.vx *= Math.max(0, 1 - dt * 6); e.vy *= Math.max(0, 1 - dt * 6);
      }
      e.hopT = (e.hopT === undefined ? 0.9 : e.hopT) - dt * slowFactor;
      if (e.hopT <= 0) {
        e.hopT = 1.05 + Math.random() * 0.22;
        e.hopBurstT = 0.32;
        if (rings.length < 36) rings.push({ x: e.x, y: e.y, r: e.r + 14, color: '#74c69d', t: 0.18, maxT: 0.18 });
      }
      let hopMul = 0.34;
      if ((e.hopBurstT || 0) > 0) {
        e.hopBurstT -= dt;
        hopMul = 2.48;
      }
      const hopA = a + Math.sin(e.phase * 0.5) * 0.24;
      e.x += Math.cos(hopA) * curSpd * hopMul * dt;
      e.y += Math.sin(hopA) * curSpd * hopMul * dt;
    } else if (e.type === 'mortar') {
      // 【差异化远程 7 · 发条星陨臼炮】：可见高抛榴弹升空弧线 + 八角机械火控准星 + 落地迸裂四向余烬霰片（告别凭空刷两个重复红圈！）
      if (distP > 360) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      else if (distP < 190) { e.x -= Math.cos(a) * curSpd * 0.65 * dt; e.y -= Math.sin(a) * curSpd * 0.65 * dt; }
      e.shotT -= dt * slowFactor;
      if (e.shotT <= 0 && distP > 112) {
        e.shotT = e.elite ? 2.75 : 3.40;
        if (rings.length < 34) rings.push({ x: e.x, y: e.y, r: 34, color: '#ff9f1c', t: 0.22, maxT: 0.22, kind: 'star' });
        addSparks(e.x, e.y - 10, -Math.PI * 0.5, '#ffd166', 4);
        const leadX = player.moving ? dx * 44 : (Math.random() - 0.5) * 26;
        const leadY = player.moving ? dy * 44 : (Math.random() - 0.5) * 26;
        const rHaz = e.elite ? 74 : 64;
        spawnHazard(player.x + leadX, player.y + leadY, rHaz, e.dmg, 1.28, {
          color: '#ff9f1c',
          style: 'mortar_shell',
          srcX: e.x,
          srcY: e.y - 10,
          angle: a,
          shrapnel: (e.elite || wave >= 8) ? 4 : 0
        });
      }
    } else if (e.type === 'summoner') {
      // 【差异化远程 8 · 蚀日六翼唤灵师】：六芒唤灵法阵 + 次元裂空斜斩痕（线性裂缝，非圆圈！） + X 形双弧暗月镰
      if (distP > 320) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      else if (distP < 180) { e.x -= Math.cos(a) * curSpd * 0.7 * dt; e.y -= Math.sin(a) * curSpd * 0.7 * dt; }
      e.sumT -= dt * slowFactor;
      if (e.sumT <= 0 && enemies.length < 48) {
        e.sumT = 5.4;
        if (rings.length < 36) rings.push({ x: e.x, y: e.y, r: 62, color: '#c77dff', t: 0.36, maxT: 0.36, kind: 'hex' });
        spawnWarning(Math.max(70, Math.min(WORLD.w - 70, e.x + (Math.random() - 0.5) * 130)), Math.max(70, Math.min(WORLD.h - 70, e.y + (Math.random() - 0.5) * 130)), 'swarmer');
      }
      e.boltT = (e.boltT || 2.5) - dt * slowFactor;
      if (e.boltT <= 0) {
        e.boltT = 3.05;
        e._castFlip = !e._castFlip;
        if (e._castFlip && distP > 88 && hazards.length < 28) {
          spawnHazard(player.x + (Math.random() - 0.5) * 40, player.y + (Math.random() - 0.5) * 40, 28, e.dmg, 1.08, {
            color: '#d8b4fe',
            style: 'void_slash',
            angle: a + (Math.random() < 0.5 ? 0.68 : -0.68),
            halfLen: e.elite ? 108 : 92,
            halfW: 14
          });
        }
        for (const side of [-1, 1]) {
          if (eBullets.length < 170) {
            const la = a + side * 0.36;
            eBullets.push({
              x: e.x, y: e.y, px: e.x, py: e.y,
              vx: Math.cos(la) * 136, vy: Math.sin(la) * 136,
              curve: -side * 0.48, life: 2.9,
              dmg: e.dmg, r: 7.0, hitR: 6.0, color: '#e0aaff', shape: 'crescent'
            });
          }
        }
      }
    } else if (e.type === 'healer') {
      // 【翠羽祝祷师】：告别单调绿圆圈，改为翡翠十字圣辉脉冲 + 可见实体翠绿治愈光链直连受伤友军！
      if (distP > 210) { e.x += Math.cos(a) * curSpd * dt; e.y += Math.sin(a) * curSpd * dt; }
      e.healT -= dt * slowFactor;
      if (e.healT <= 0) {
        e.healT = 2.8;
        if (rings.length < 36) rings.push({ x: e.x, y: e.y, r: 175, color: '#34d399', t: 0.36, maxT: 0.36, kind: 'cross_pulse' });
        let beamLinked = 0;
        for (let ai = 0; ai < enemies.length; ai++) {
          const ally = enemies[ai];
          if (!ally || ally === e || ally.hp <= 0 || ally.hp >= ally.maxHp) continue;
          const adx = ally.x - e.x, ady = ally.y - e.y;
          if (adx * adx + ady * ady <= 190 * 190) {
            const h = Math.round(ally.maxHp * 0.14 + 4);
            ally.hp = Math.min(ally.maxHp, ally.hp + h);
            if (beamLinked < 4 && beams.length < 34) {
              beams.push({ x1: e.x, y1: e.y - 6, x2: ally.x, y2: ally.y - 4, color: '#5ef29b', thin: true, t: 0.28, maxT: 0.28 });
              beamLinked++;
            }
            addText(ally.x, ally.y - ally.r, '+' + h, '#52b788', 12, 0.45, false);
          }
        }
      }
    } else {
      // 丰富近战生态：铁卫 160°半月横扫戟 / 冰骑寒枪直刺 / 双刃剑客旋风剑舞 / 勾魂镰卫瞬步暗镰 / 塔盾卫重盾猛击 / 重锤卫残血狂暴+90°扇形裂地锤 / 泰坦巨像十字地裂震波
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
        e.lungeCd = (e.lungeCd || 1.7) - dt * slowFactor;
        if (e.lungeCd <= 0 && distP < 148 && distP > 34) {
          e.lungeCd = 2.10;
          e.lungeBoostT = 0.28;
          e._lungeA = a;
          addSparks(e.x, e.y, a + Math.PI, '#ff758f', 3);
          if (slashes.length < 36) slashes.push({ x: e.x + Math.cos(a) * 16, y: e.y + Math.sin(a) * 16, angle: a, r: 38, color: '#ff758f', mode: 'spear', t: 0.18, maxT: 0.18 });
        }
        if (e.lungeBoostT > 0) {
          e.lungeBoostT -= dt;
          moveMul = 2.45;
          if (e._lungeA !== undefined) moveA = e._lungeA;
        } else {
          moveA = a + Math.sin(e.phase * 0.5) * 0.24;
        }
      } else if (e.type === 'iron_guard') {
        // 重戟守桥铁卫：稳步压迫 -> 近身亮起 160° 宽幅半月斩区横扫长戟
        if ((e.cleaveWindup || 0) > 0) {
          e.cleaveWindup -= dt * slowFactor;
          moveMul = 0.12;
          moveA = e._cleaveA !== undefined ? e._cleaveA : a;
          if (e.cleaveWindup <= 0) {
            e.cleaveWindup = 0;
            const ca = e._cleaveA !== undefined ? e._cleaveA : a;
            const reach = 104;
            beep(180, 0.06, 'sawtooth', 0.036);
            if (slashes.length < 36) slashes.push({ x: e.x + Math.cos(ca) * 18, y: e.y + Math.sin(ca) * 18, angle: ca, r: reach, color: '#fb7185', mode: 'crescent', t: 0.22, maxT: 0.22 });
            if (distP <= reach + player.r - 4) {
              let da = Math.abs(Math.atan2(player.y - e.y, player.x - e.x) - ca) % (Math.PI * 2);
              if (da > Math.PI) da = Math.PI * 2 - da;
              if (da <= 1.38) {
                hurtPlayer(Math.round(e.dmg * 1.08));
                if (state !== 'wave') return;
              }
            }
          }
        } else {
          e.cleaveCd = (e.cleaveCd || 2.1) - dt * slowFactor;
          if (distP < 102 && e.cleaveCd <= 0) {
            e.cleaveCd = 2.45;
            e.cleaveWindup = 0.46;
            e.cleaveWindupMax = 0.46;
            e._cleaveA = a;
          }
        }
      } else if (e.type === 'frost_knight') {
        // 寒鸦冰枪死骑：中近距锁定细长寒冰刺线 -> 凌厉滑步直刺穿刺！
        if ((e.thrustWindup || 0) > 0) {
          e.thrustWindup -= dt * slowFactor;
          moveMul = 0.10;
          moveA = e._thrustA !== undefined ? e._thrustA : a;
          if (e.thrustWindup <= 0) {
            e.thrustWindup = 0;
            const ta = e._thrustA !== undefined ? e._thrustA : a;
            const reach = 132;
            e._lungeThrustT = 0.20;
            beep(460, 0.06, 'triangle', 0.036);
            if (slashes.length < 36) slashes.push({ x: e.x + Math.cos(ta) * 18, y: e.y + Math.sin(ta) * 18, angle: ta, r: reach, color: '#7dd3fc', mode: 'spear', t: 0.20, maxT: 0.20 });
            const ex = e.x + Math.cos(ta) * reach, ey = e.y + Math.sin(ta) * reach;
            const seg = pointSegClosest(player.x, player.y, e.x, e.y, ex, ey);
            if (seg.dSq <= (16 + player.r - 3) * (16 + player.r - 3)) {
              if (!player.noSlow) player.chillSlowT = Math.max(player.chillSlowT || 0, 1.1);
              hurtPlayer(Math.round(e.dmg * 1.05));
              if (state !== 'wave') return;
            }
          }
        } else if ((e._lungeThrustT || 0) > 0) {
          e._lungeThrustT -= dt;
          moveMul = 2.65;
          moveA = e._thrustA !== undefined ? e._thrustA : a;
        } else {
          e.thrustCd = (e.thrustCd || 1.9) - dt * slowFactor;
          if (distP < 142 && distP > 36 && e.thrustCd <= 0) {
            e.thrustCd = 2.25;
            e.thrustWindup = 0.42;
            e.thrustWindupMax = 0.42;
            e._thrustA = a;
          }
        }
      } else if (e.type === 'blade_duelist') {
        // 发条双刃剑客：高速绕侧逼近 -> 开启黄金双刃剑刃风暴旋斩追击！
        if ((e.whirlT || 0) > 0) {
          e.whirlT -= dt;
          e.whirlSpin = (e.whirlSpin || 0) + dt * 22;
          moveMul = 1.62;
          e._whirlHitCd = Math.max(0, (e._whirlHitCd || 0) - dt);
          if (e._whirlHitCd <= 0 && distP <= e.r + player.r + 22) {
            e._whirlHitCd = 0.42;
            hurtPlayer(Math.round(e.dmg * 0.95));
            if (state !== 'wave') return;
          }
        } else {
          e.whirlCd = (e.whirlCd || 2.1) - dt * slowFactor;
          if (distP < 185 && e.whirlCd <= 0) {
            e.whirlCd = 2.65;
            e.whirlT = 0.90;
            e.whirlSpin = e.whirlSpin || 0;
            e._whirlHitCd = 0;
            addSparks(e.x, e.y, a, '#fde68a', 4);
          } else if (distP > 95) {
            moveA = a + (e.orbitDir || 1) * 0.48;
          }
        }
      } else if (e.type === 'shadow_reaper') {
        // 蚀影勾魂镰卫：锁定玩家侧翼暗影瞬步折跃 -> 现身刹那挥出紫黑暗月环斩！
        if ((e.reapWindup || 0) > 0) {
          e.reapWindup -= dt * slowFactor;
          moveMul = 0.08;
          if (e.reapWindup <= 0) {
            e.reapWindup = 0;
            if (rings.length < 36) rings.push({ x: e.x, y: e.y, r: 36, color: '#a855f7', t: 0.20, maxT: 0.20 });
            e.x = Math.max(e.r + 12, Math.min(WORLD.w - e.r - 12, e._reapX || e.x));
            e.y = Math.max(e.r + 12, Math.min(WORLD.h - e.r - 12, e._reapY || e.y));
            pushOutOfChasms(e);
            const reapR = 72;
            beep(290, 0.07, 'sawtooth', 0.038);
            if (rings.length < 36) rings.push({ x: e.x, y: e.y, r: reapR, color: '#c084fc', t: 0.24, maxT: 0.24, kind: 'hex' });
            if (slashes.length < 36) slashes.push({ x: e.x, y: e.y, angle: Math.atan2(player.y - e.y, player.x - e.x), r: reapR, color: '#d8b4fe', mode: 'crescent', t: 0.22, maxT: 0.22 });
            if (Math.hypot(player.x - e.x, player.y - e.y) <= reapR + player.r - 5) {
              hurtPlayer(Math.round(e.dmg * 1.05));
              if (state !== 'wave') return;
            }
          }
        } else {
          e.blinkCd = (e.blinkCd || 2.6) - dt * slowFactor;
          if (distP < 255 && distP > 75 && e.blinkCd <= 0) {
            e.blinkCd = 3.25;
            e.reapWindup = 0.42;
            e.reapWindupMax = 0.42;
            const flankA = a + (Math.random() < 0.5 ? 0.95 : -0.95);
            e._reapX = Math.max(64, Math.min(WORLD.w - 64, player.x - Math.cos(flankA) * 58));
            e._reapY = Math.max(64, Math.min(WORLD.h - 64, player.y - Math.sin(flankA) * 58));
          }
        }
      } else if (e.type === 'shielder') {
        // 重铠符盾守桥卫（紧凑高甲体型 r=28）：近身发动短距【重盾猛击】钝击震退！
        if ((e.bashWindup || 0) > 0) {
          e.bashWindup -= dt * slowFactor;
          moveMul = 0.15;
          if (e.bashWindup <= 0) {
            e.bashWindup = 0;
            const bashA = e._bashA !== undefined ? e._bashA : a;
            e.x += Math.cos(bashA) * 22;
            e.y += Math.sin(bashA) * 22;
            if (rings.length < 36) rings.push({ x: e.x + Math.cos(bashA) * 16, y: e.y + Math.sin(bashA) * 16, r: 58, color: '#90e0ef', t: 0.22, maxT: 0.22 });
            if (Math.hypot(player.x - (e.x + Math.cos(bashA) * 14), player.y - (e.y + Math.sin(bashA) * 14)) <= 56 + player.r) {
              hurtPlayer(Math.round(e.dmg * 1.02));
              if (state !== 'wave') return;
            }
          }
        } else {
          e.bashCd = (e.bashCd || 2.2) - dt * slowFactor;
          if (distP < 78 && e.bashCd <= 0) {
            e.bashCd = 2.65;
            e.bashWindup = 0.36;
            e._bashA = a;
          }
        }
      } else if (e.type === 'brute') {
        // 镇塔黑曜重锤卫（r=39 高大狂战士）：生命低于 65% 红眼狂暴提速 1.36x + 前向 90° 扇形锥区裂地重锤（告别普通圆圈！）
        const berserk = e.hp < e.maxHp * 0.65;
        if (berserk) {
          moveMul = 1.36;
          if (Math.random() < dt * 7) pushParticle({ x: e.x + (Math.random() - 0.5) * 16, y: e.y - 8, vx: 0, vy: -22, r: 3.2, color: '#f43f5e', t: 0.22, maxT: 0.22 });
        }
        if (e.slamWindup > 0) {
          e.slamWindup -= dt * slowFactor;
          moveMul = 0.12;
          moveA = e._slamA !== undefined ? e._slamA : a;
          if (e.slamWindup <= 0) {
            e.slamWindup = 0;
            const sa = e._slamA !== undefined ? e._slamA : a;
            const coneLen = 132;
            beep(140, 0.09, 'sawtooth', 0.045);
            if (slashes.length < 36) slashes.push({ x: e.x + Math.cos(sa) * 26, y: e.y + Math.sin(sa) * 26, angle: sa, r: coneLen * 0.92, color: '#c084fc', mode: 'crescent', t: 0.24, maxT: 0.24 });
            if (rings.length < 36) rings.push({ x: e.x + Math.cos(sa) * 58, y: e.y + Math.sin(sa) * 58, r: 68, color: '#c77dff', t: 0.24, maxT: 0.24, kind: 'star' });
            const dxB = player.x - e.x, dyB = player.y - e.y, dB = Math.hypot(dxB, dyB);
            if (dB <= coneLen + player.r - 4) {
              let daB = Math.abs(Math.atan2(dyB, dxB) - sa) % (Math.PI * 2);
              if (daB > Math.PI) daB = Math.PI * 2 - daB;
              if (daB <= 0.78 || dB <= 44 + player.r) {
                hurtPlayer(Math.round(e.dmg * 1.16));
                if (state !== 'wave') return;
              }
            }
          }
        } else {
          e.bargeCd = (e.bargeCd === undefined ? 2.1 : e.bargeCd) - dt * slowFactor;
          if ((e.bargeT || 0) <= 0 && e.bargeCd <= 0 && distP < 210 && distP > 92) {
            e.bargeCd = berserk ? 2.5 : 3.2;
            e.bargeT = 0.34;
            e._bargeA = a;
            addSparks(e.x, e.y, a + Math.PI, '#c77dff', 4);
          }
          if ((e.bargeT || 0) > 0) {
            e.bargeT -= dt;
            moveMul = 2.20;
            if (e._bargeA !== undefined) moveA = e._bargeA;
          }
          e.slamCd = (e.slamCd || 2.5) - dt * slowFactor;
          if (distP < 112 && e.slamCd <= 0) {
            e.slamCd = berserk ? 2.25 : 2.75;
            e.slamWindup = 0.48;
            e.slamWindupMax = 0.48;
            e._slamA = a;
          }
        }
      } else if (e.type === 'juggernaut') {
        // 黑曜金锁镇狱像（r=54 山岳泰坦巨像，极沉缓 spd=34）：重踏轰出十字四向地裂冲击光轨 + 六方碎晶！
        if (e.slamWindup > 0) {
          e.slamWindup -= dt * slowFactor;
          moveMul = 0.08;
          moveA = e._slamA !== undefined ? e._slamA : a;
          if (e.slamWindup <= 0) {
            e.slamWindup = 0;
            const sa = e._slamA !== undefined ? e._slamA : a;
            const armLen = 168;
            beep(115, 0.12, 'sawtooth', 0.05);
            if (rings.length < 36) rings.push({ x: e.x, y: e.y, r: 96, color: '#e2e8f0', t: 0.28, maxT: 0.28, kind: 'hex' });
            for (let k = 0; k < 4; k++) {
              const ba = sa + k * (Math.PI * 0.5);
              const bx2 = e.x + Math.cos(ba) * armLen, by2 = e.y + Math.sin(ba) * armLen;
              if (beams.length < 32) beams.push({ x1: e.x, y1: e.y, x2: bx2, y2: by2, color: '#f8fafc', t: 0.28, maxT: 0.28 });
              const seg = pointSegClosest(player.x, player.y, e.x, e.y, bx2, by2);
              if (seg.dSq <= (18 + player.r - 3) * (18 + player.r - 3)) {
                hurtPlayer(Math.round(e.dmg * 1.18));
                if (state !== 'wave') return;
              }
            }
            for (let k = 0; k < 6 && eBullets.length < 170; k++) {
              const ba = (k / 6) * Math.PI * 2 + sa + 0.35;
              eBullets.push({ x: e.x, y: e.y, px: e.x, py: e.y, vx: Math.cos(ba) * 134, vy: Math.sin(ba) * 134, dmg: Math.max(4, Math.round(e.dmg * 0.75)), r: 6.4, hitR: 5.6, color: '#f8fafc', shape: 'shard' });
            }
          }
        } else {
          e.slamCd = (e.slamCd || 3.1) - dt * slowFactor;
          if (distP < 146 && e.slamCd <= 0) {
            e.slamCd = 3.35;
            e.slamWindup = 0.56;
            e.slamWindupMax = 0.56;
            e._slamA = a;
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
    if (!e.primed && !(e.burrowT > 0)) {
      const pdx = player.x - e.x, pdy = player.y - e.y, pHitR = player.r + e.r * 0.85 - 3;
      if (pdx * pdx + pdy * pdy < pHitR * pHitR && !(e._touchCd > 0)) {
        e._touchCd = e.dashing ? 0.36 : 0.50;
        if (player.cls === 'bull') triggerBullNova();
        hurtPlayer(e.dmg);
        if (state !== 'wave') return;
      }
    }
  }
  compactAliveEnemies();

  // 敌方差异化轨迹弹幕引擎（支持弧线包抄 curve、加减速长矛/星雷球 accel、S形双螺旋交织波 waveAmp、飞盘自转与友好擦弹判定）
  const ebSpdMul = sandGustT > 0 ? 0.78 : 1;
  for (let i = eBullets.length - 1; i >= 0; i--) {
    if (state !== 'wave') return;
    const b = eBullets[i];
    if (!b) continue;
    if (b.life !== undefined) {
      b.life -= dt;
      if (b.life <= 0) { eBullets.splice(i, 1); continue; }
    }
    b.px = b.x; b.py = b.y;
    b.age = (b.age || 0) + dt * ebSpdMul;
    if (b.waveAmp && b.baseAng !== undefined) {
      const fSpd = b.baseSpd || 148;
      const latSpd = Math.cos(b.age * (b.waveFreq || 6.4)) * b.waveAmp * (b.waveSign || 1);
      const ca = Math.cos(b.baseAng), sa = Math.sin(b.baseAng);
      b.vx = ca * fSpd - sa * latSpd;
      b.vy = sa * fSpd + ca * latSpd;
    } else {
      if (b.curve) {
        const dAng = b.curve * ebSpdMul * dt;
        const c = Math.cos(dAng), s = Math.sin(dAng);
        const nvx = b.vx * c - b.vy * s, nvy = b.vx * s + b.vy * c;
        b.vx = nvx; b.vy = nvy;
      }
      if (b.accel) {
        const curSpd = Math.hypot(b.vx, b.vy) || 1;
        const nextSpd = Math.max(b.minSpd || 42, Math.min(b.maxSpd || 320, curSpd + b.accel * ebSpdMul * dt));
        const ratio = nextSpd / curSpd;
        b.vx *= ratio; b.vy *= ratio;
      }
    }
    b.x += b.vx * ebSpdMul * dt; b.y += b.vy * ebSpdMul * dt;
    if (b.shape === 'disc' || b.shape === 'orb') b.rot = (b.rot || 0) + dt * (b.shape === 'disc' ? 14 : 5);
    if (b.x < -16 || b.x > WORLD.w + 16 || b.y < -16 || b.y > WORLD.h + 16) { eBullets.splice(i, 1); continue; }
    const effHitR = b.hitR || b.r || 5.2;
    const bdx = player.x - b.x, bdy = player.y - b.y, bHitR = Math.max(4, player.r + effHitR - 5.2);
    if (bdx * bdx + bdy * bdy < bHitR * bHitR) {
      if (b.chillPlayer && !player.noSlow) player.chillSlowT = 1.25;
      hurtPlayer(b.dmg, true);
      eBullets.splice(i, 1);
      if (state !== 'wave') return;
    }
  }

  // 掉落晶石 / 血包果实 / 战利品宝箱散射弹跳与指数级魂灯磁吸结算
  const effMag = player.magnet + ((player.magnetPulseT || 0) > 0 ? 135 : 0);
  const magSq = effMag * effMag;
  const pickR = player.r + 14, pickSq = pickR * pickR;
  for (let i = drops.length - 1; i >= 0; i--) {
    if (state !== 'wave') return;
    const d = drops[i];
    if (!d) continue;
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
        if (typeof _frameHitBeeps === 'undefined' || _frameHitBeeps < 2) {
          if (typeof _frameHitBeeps !== 'undefined') _frameHitBeeps++;
          beep(780, 0.020, 'sine', 0.020);
        }
        // 【幸运弹珠】拾取晶石概率落雷轰击场上随机怪物（零临时数组分配 + 瞬步真空吸钻时同帧节流防卡顿）
        if (player.cyberball > 0 && enemies.length > 0 && (typeof _frameCyberBolts === 'undefined' || _frameCyberBolts < 2) && Math.random() < Math.min(0.60, (0.16 + (player.luck || 0) * 0.005) * player.cyberball)) {
          const te = pickRandomAliveEnemy(null);
          if (te) {
            if (typeof _frameCyberBolts !== 'undefined') _frameCyberBolts++;
            const cbDmg = (12 + wave * 2.5 + (player.luck || 0) * 0.35) * effDmg;
            if (lightnings.length < 30) lightnings.push({ pts: [{ x: player.x, y: player.y - 10 }, { x: te.x, y: te.y }], color: '#ffd166', t: 0.14, maxT: 0.14 });
            hurtEnemy(te, cbDmg, false, null, true, { noProc: true, silentHit: true });
            if (state !== 'wave') return;
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
            addText(player.x, player.y - 36, '◆ 神话传说秘宝 +1!', '#ffd166', 21, 2.2, true);
            announce('◆ 拾取神话二阶段秘宝舱！波次结算时必出红色传说神装！', '#ffd166', 3.4);
          } else {
            if (d.isBoss) player.bossCratesQueued = (player.bossCratesQueued || 0) + 1;
            addText(player.x, player.y - 34, d.isBoss ? '◆ 首领秘宝 +1' : '◆ 宝箱 +1', '#ffd166', 19, 2.0, true);
            announce(d.isBoss ? '◆ 拾取首领秘宝箱！波次结算时可二选一开启' : '◆ 拾取异星战利品箱！波次结算时可二选一开启', '#ffd166', 2.8);
          }
          beep(880, 0.11, 'triangle', 0.06);
        } else {
          const yieldMul = typeof CRYSTAL_YIELD_MUL === 'number' ? CRYSTAL_YIELD_MUL : 0.70;
          const bonusMat = Math.max(8, Math.round((16 + wave * 3) * yieldMul));
          player.mats += bonusMat;
          player.hp = Math.min(player.maxHp, player.hp + 6);
          addText(player.x, player.y - 34, `满载折算 +${bonusMat}晶石 +6HP`, '#ffd166', 17, 2.0, true);
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
    const isDeathmatchHud = overtime;
    setHudText('waveTimer', isDeathmatchHud ? '死战' : String(Math.ceil(Math.max(0, waveTime))));
    const timerPct = isDeathmatchHud ? 100 : Math.max(0, Math.min(100, (waveTime / Math.max(1, waveMaxTime)) * 100));
    setHudWidth('timerFill', timerPct.toFixed(1) + '%');
    const tcEl = hudEls.timerCapsule || (hudEls.timerCapsule = document.getElementById('timerCapsule'));
    if (tcEl) {
      const isUrgent = isDeathmatchHud || waveTime <= 5;
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
        if (!activeCastLabel) {
          if ((e.p2WindupT || 0) > 0 && e.p2Label) {
            activeCastLabel = `⚠️ 二阶终式蓄力 · ${e.p2Label}`;
          } else if ((e.venomBreathT || 0) > 0) {
            activeCastLabel = e.venomTwin ? '☠️ 释放二阶终式 · 双龙万蛊毒息' : '☠️ 高压横扫 · 剧毒龙息喷流';
          } else if (e.castLabel && ((e.sigWindupT || 0) > 0 || (e.castEndT || 0) > 0)) {
            activeCastLabel = (e.sigWindupT || 0) > 0 ? `⚠️ 蓄力咏唱 · ${e.castLabel}` : `💥 释放杀招 · ${e.castLabel}`;
          }
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
