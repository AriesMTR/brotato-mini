// ============================================================================
// 🎨 《烬塔残响：第999次救赎》极速精灵渲染管线（角色 / 分层域怪物 / 场景器物 / 兵装 / 立绘特写）
// 彻底删除原版土豆椭圆躯干、异星甲虫矢量与蘑菇树，100% 替换为预烘焙高清透明 Q 版贴图！
// ============================================================================

let _frameNow = 0;
function _syncNow() {
  return _frameNow || performance.now();
}

// 32 把守誓兵装精细矢量造型绘制
function drawWeaponSprite(w) {
  const id = w.id, tc = TIER_COLORS[w.tier];
  const now = _syncNow();
  ctx.save();
  ctx.translate(w.wx, w.wy);
  ctx.rotate(w.angle);
  if (Math.cos(w.angle) < 0) ctx.scale(1, -1);

  if (w.tier >= 2) {
    ctx.globalAlpha = 0.16 + w.tier * 0.05;
    ctx.fillStyle = tc;
    ctx.beginPath(); ctx.ellipse(6, 0, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = '#14101a';

  if (id === 'stick') {
    ctx.fillStyle = '#9c6644';
    ctx.beginPath(); ctx.roundRect(-6, -4, 30, 8, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#72efdd';
    ctx.beginPath(); ctx.ellipse(16, -7, 5, 3, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (id === 'rock') {
    ctx.fillStyle = w.tier > 1 ? tc : '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-8, -7); ctx.lineTo(5, -10); ctx.lineTo(17, -5);
    ctx.lineTo(15, 7); ctx.lineTo(2, 10); ctx.lineTo(-9, 5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'spear') {
    ctx.fillStyle = '#7f5539';
    ctx.fillRect(-14, -2.5, 34, 5); ctx.strokeRect(-14, -2.5, 34, 5);
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(14, -4, 5, 8);
    ctx.fillStyle = w.tier > 1 ? tc : '#f8fafc';
    ctx.beginPath(); ctx.moveTo(19, -5.5); ctx.lineTo(34, 0); ctx.lineTo(19, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'slingshot') {
    ctx.strokeStyle = '#14101a'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(2, 0); ctx.lineTo(11, -8); ctx.moveTo(2, 0); ctx.lineTo(11, 8); ctx.stroke();
    ctx.strokeStyle = '#9c6644'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(2, 0); ctx.lineTo(11, -8); ctx.moveTo(2, 0); ctx.lineTo(11, 8); ctx.stroke();
  } else if (id === 'wrench') {
    ctx.fillStyle = w.tier > 1 ? tc : '#f6d379';
    ctx.beginPath(); ctx.roundRect(-8, -3.5, 24, 7, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(18, 0, 7, 0.65, Math.PI * 2 - 0.65); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'knife') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(-8, -3, 8, 6); ctx.strokeRect(-8, -3, 8, 6);
    ctx.fillStyle = w.tier > 1 ? tc : '#e2e8f0';
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(22, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'claws') {
    ctx.fillStyle = '#3b2848';
    ctx.beginPath(); ctx.roundRect(-7, -7, 8, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#fda4af';
    for (const cy of [-5, 0, 5]) {
      ctx.beginPath(); ctx.moveTo(1, cy - 2); ctx.quadraticCurveTo(13, cy - 3, 21, cy); ctx.lineTo(1, cy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else if (id === 'katana') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-13, -2.8, 11, 5.6); ctx.strokeRect(-13, -2.8, 11, 5.6);
    ctx.fillStyle = '#f6d379';
    ctx.fillRect(-2, -6, 3, 12);
    ctx.fillStyle = w.tier > 1 ? tc : '#fda4af';
    ctx.beginPath(); ctx.moveTo(1, -3.5); ctx.quadraticCurveTo(18, -5, 33, -1); ctx.lineTo(29, 3.2); ctx.lineTo(1, 2.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'crossbow') {
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(-10, -2.5, 25, 5); ctx.strokeRect(-10, -2.5, 25, 5);
    ctx.strokeStyle = w.tier > 1 ? tc : '#cbd5e1'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(7, 0, 12, -1.18, 1.18); ctx.stroke();
  } else if (id === 'hammer') {
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(-10, -2.8, 26, 5.6); ctx.strokeRect(-10, -2.8, 26, 5.6);
    ctx.fillStyle = w.tier > 1 ? tc : '#64748b';
    ctx.beginPath(); ctx.roundRect(12, -11, 13, 22, 3); ctx.fill(); ctx.stroke();
  } else if (id === 'pistol') {
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.roundRect(-5, 1, 7, 9, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#94a3b8';
    ctx.beginPath(); ctx.roundRect(-6, -5, 20, 8, 2); ctx.fill(); ctx.stroke();
  } else if (id === 'smg') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, 2, 5, 10); ctx.strokeRect(2, 2, 5, 10);
    ctx.fillStyle = w.tier > 1 ? tc : '#64748b';
    ctx.beginPath(); ctx.roundRect(-8, -5, 24, 8, 2); ctx.fill(); ctx.stroke();
  } else if (id === 'shotgun') {
    ctx.fillStyle = '#7f4f24';
    ctx.beginPath(); ctx.roundRect(-11, -3, 12, 8, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#64748b';
    ctx.fillRect(0, -5, 22, 7); ctx.strokeRect(0, -5, 22, 7);
  } else if (id === 'minigun') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.roundRect(-12, -6.5, 14, 13, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#94a3b8';
    ctx.fillRect(2, -5.5, 22, 3); ctx.fillRect(2, -1.5, 22, 3); ctx.fillRect(2, 2.5, 22, 3);
    ctx.fillStyle = '#f6d379';
    ctx.fillRect(16, -6.5, 3.5, 13);
  } else if (id === 'sniper') {
    ctx.fillStyle = '#582f0e';
    ctx.beginPath(); ctx.roundRect(-14, -3, 14, 7, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#475569';
    ctx.fillRect(-1, -4, 31, 5.5); ctx.strokeRect(-1, -4, 31, 5.5);
    ctx.fillStyle = '#72efdd';
    ctx.beginPath(); ctx.roundRect(2, -9, 12, 4.5, 2); ctx.fill(); ctx.stroke();
  } else if (id === 'shuriken') {
    ctx.rotate(now * 0.008);
    ctx.fillStyle = w.tier > 1 ? tc : '#72efdd';
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI * 0.5;
      ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
      ctx.lineTo(Math.cos(a + 0.4) * 4.5, Math.sin(a + 0.4) * 4.5);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'icicle') {
    ctx.fillStyle = '#72efdd';
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(0, -6.5); ctx.lineTo(24, 0); ctx.lineTo(0, 6.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'laser') {
    ctx.fillStyle = '#312e81';
    ctx.beginPath(); ctx.roundRect(-9, -6, 26, 11, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#72efdd';
    ctx.fillRect(-2, -3, 15, 5);
  } else if (id === 'flamer') {
    ctx.fillStyle = '#e11d48';
    ctx.beginPath(); ctx.roundRect(-10, 1, 11, 8, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#64748b';
    ctx.beginPath(); ctx.roundRect(-8, -5.5, 25, 8, 2); ctx.fill(); ctx.stroke();
  } else if (id === 'taser') {
    ctx.fillStyle = '#3b0764';
    ctx.beginPath(); ctx.roundRect(-8, -5.5, 20, 10, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#72efdd'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(19, -5); ctx.moveTo(12, 3); ctx.lineTo(19, 4); ctx.stroke();
  } else if (id === 'plasma') {
    ctx.fillStyle = '#3b0764';
    ctx.beginPath(); ctx.roundRect(-10, -6.5, 24, 13, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c084fc';
    ctx.beginPath(); ctx.arc(15, 0, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (id === 'rocket') {
    ctx.fillStyle = w.tier > 1 ? tc : '#475569';
    ctx.beginPath(); ctx.roundRect(-14, -6.5, 32, 12, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fb7185';
    ctx.beginPath(); ctx.moveTo(18, -5); ctx.lineTo(25, -0.5); ctx.lineTo(18, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'blowgun') {
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.roundRect(-12, -3, 34, 6, 3); ctx.fill(); ctx.stroke();
  } else if (id === 'revolver') {
    ctx.fillStyle = '#582f0e';
    ctx.beginPath(); ctx.roundRect(-9, 1, 8, 9, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#f6d379';
    ctx.fillRect(-3, -4.5, 24, 5.5); ctx.strokeRect(-3, -4.5, 24, 5.5);
  } else if (id === 'shredder') {
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.roundRect(-10, -5.5, 24, 10, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(2, -3.5, 11, 5);
  } else if (id === 'spiked_shield') {
    ctx.fillStyle = w.tier > 1 ? tc : '#475569';
    ctx.beginPath();
    ctx.moveTo(-4, -12); ctx.lineTo(12, -9); ctx.lineTo(17, 0); ctx.lineTo(12, 9); ctx.lineTo(-4, 12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'grenade_launcher') {
    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.roundRect(-12, -5, 28, 10, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.arc(3, 0, 6.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (id === 'magma_blade') {
    ctx.fillStyle = '#fb5607';
    ctx.beginPath();
    ctx.moveTo(-2, -6); ctx.lineTo(22, -7.5); ctx.lineTo(33, 0); ctx.lineTo(20, 7); ctx.lineTo(-2, 5.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'screwdriver') {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.roundRect(-10, -4.5, 12, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#cbd5e1';
    ctx.fillRect(2, -2, 19, 4); ctx.strokeRect(2, -2, 19, 4);
  } else if (id === 'nailgun') {
    ctx.fillStyle = '#eab308';
    ctx.beginPath(); ctx.roundRect(-9, -6, 22, 10, 3); ctx.fill(); ctx.stroke();
  } else if (id === 'drone_bay') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-8, -9); ctx.lineTo(10, -9); ctx.lineTo(17, 0); ctx.lineTo(10, 9); ctx.lineTo(-8, 9);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#72efdd';
    ctx.beginPath(); ctx.arc(4, 0, 4.5, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'emp_cannon') {
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath(); ctx.roundRect(-12, -7, 24, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#72efdd';
    ctx.fillRect(10, -6.5, 16, 4); ctx.fillRect(10, 2.5, 16, 4);
  }
  ctx.restore();
}

// 🗼 四大层域专属可破坏封魂器物（石灯笼 / 极寒冰晶簇 / 齿轮断柱 / 黑曜裂纹方碑，彻底删除旧蘑菇树！）
function drawTreeSprite(tr) {
  const sw = Math.sin(tr.sway || 0) * 0.04;
  const flash = tr.hitFlash > 0;
  const scId = (typeof curScene !== 'undefined' && curScene && curScene.id) ? curScene.id : 'foundry';

  ctx.fillStyle = 'rgba(0,0,0,0.44)';
  ctx.beginPath(); ctx.ellipse(tr.x, tr.y + 18, 22, 8.5, 0, 0, Math.PI * 2); ctx.fill();

  const spr = (typeof SpireAssets !== 'undefined') ? SpireAssets.getPropSprite(scId, flash) : null;
  if (spr && spr.canvas) {
    const targetH = 68;
    const scale = targetH / Math.max(16, spr.h);
    const dw = spr.w * scale, dh = spr.h * scale;
    ctx.save();
    ctx.translate(tr.x, tr.y + 18);
    if (sw) ctx.rotate(sw);
    ctx.drawImage(spr.canvas, -dw * 0.5, -dh, dw, dh);
    ctx.restore();
  } else {
    // 首帧贴图未就绪时的哥特封魂晶碑极简兜底
    ctx.save();
    ctx.translate(tr.x, tr.y);
    ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
    ctx.strokeStyle = '#f6d379';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -28); ctx.lineTo(14, -10); ctx.lineTo(11, 18); ctx.lineTo(-11, 18); ctx.lineTo(-14, -10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  if (tr.hp < tr.maxHp) {
    const bw = 36;
    ctx.fillStyle = 'rgba(6,9,16,0.82)';
    ctx.fillRect(tr.x - bw / 2, tr.y - 46, bw, 5);
    ctx.fillStyle = '#72efdd';
    ctx.fillRect(tr.x - bw / 2 + 1, tr.y - 45, (bw - 2) * Math.max(0, tr.hp / Math.max(1, tr.maxHp)), 3);
  }
}

// 发条机炮塔与浮游贯日激光塔绘制
function drawTurretSprite(t) {
  const now = _syncNow();
  const overclocked = !!(typeof player !== 'undefined' && player && (player.turretOverclockT || 0) > 0);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 14, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
  if (overclocked) {
    ctx.save();
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.78)';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(t.x, t.y + 4, 20, now * 0.006, now * 0.006 + Math.PI * 1.8); ctx.stroke();
    ctx.restore();
  }

  if (t.kind === 'laser') {
    const bob = Math.sin(now * 0.006 + t.x) * 2.5;
    ctx.save();
    ctx.translate(t.x, t.y + bob);
    ctx.strokeStyle = '#14101a'; ctx.lineWidth = 2.4;
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      k === 0 ? ctx.moveTo(Math.cos(a) * 13, Math.sin(a) * 13) : ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(t.angle);
    ctx.fillStyle = '#c084fc';
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(4, -7); ctx.lineTo(-5, 0); ctx.lineTo(4, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#72efdd';
    ctx.beginPath(); ctx.arc(2, 0, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }

  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.6;
  ctx.fillStyle = '#475569';
  ctx.beginPath(); ctx.arc(t.x, t.y + 6, 11.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.save();
  ctx.translate(t.x - Math.cos(t.angle) * t.recoil * 4, t.y - Math.sin(t.angle) * t.recoil * 4);
  ctx.rotate(t.angle);
  ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.2;
  ctx.fillRect(4, -4, 16, 8); ctx.strokeRect(4, -4, 16, 8);
  ctx.fillStyle = TIER_COLORS[t.tier] === '#e2deec' ? '#f6d379' : TIER_COLORS[t.tier];
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#72efdd';
  ctx.beginPath(); ctx.arc(2, 0, 3.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// 4 拍丝滑步态帧序列：左迈步(F1) -> 中立过渡(F0) -> 右迈步(F2) -> 中立过渡(F0)
const _HERO_STRIDE_SEQ = [1, 0, 2, 0];

function _stepEntityAnim(ent, now, isMoving, targetFace, forceAttackPose) {
  const dt = Math.min(0.05, Math.max(0.001, (now - (ent._animMs || now)) * 0.001));
  ent._animMs = now;

  const prevX = ent._animPrevX !== undefined ? ent._animPrevX : ent.x;
  const prevY = ent._animPrevY !== undefined ? ent._animPrevY : ent.y;
  const disp = Math.hypot(ent.x - prevX, ent.y - prevY);
  ent._animPrevX = ent.x;
  ent._animPrevY = ent.y;
  const instSpd = Math.min(900, disp / dt);
  ent._smoothSpd = (ent._smoothSpd || 0) + (instSpd - (ent._smoothSpd || 0)) * Math.min(1, dt * 15);

  const desiredFlip = targetFace < 0 ? -1 : 1;
  if (ent._visFlip === undefined) ent._visFlip = desiredFlip;
  ent._visFlip += (desiredFlip - ent._visFlip) * Math.min(1, dt * 18);

  const movingNow = isMoving || ent._smoothSpd > 22;
  if (movingNow) {
    const rate = Math.max(5.8, Math.min(14.5, ent._smoothSpd * 0.042));
    ent._strideT = ((ent._strideT || 0) + dt * rate) % 4;
    ent._moveBlend = Math.min(1, (ent._moveBlend || 0) + dt * 12);
  } else {
    ent._moveBlend = Math.max(0, (ent._moveBlend || 0) - dt * 10);
  }

  let frameIdx = 0;
  if (forceAttackPose) {
    frameIdx = 3;
  } else if (ent._moveBlend > 0.18) {
    frameIdx = _HERO_STRIDE_SEQ[((ent._strideT || 0) | 0) & 3];
  }
  ent._curFrameIdx = frameIdx;
  return dt;
}

function _pushGhostTrail(ent, now, frameIdx, flipSign, intervalMs, startAlpha) {
  if (!ent._ghostRing) {
    ent._ghostRing = [
      { x: 0, y: 0, f: 0, dir: 1, a: 0 },
      { x: 0, y: 0, f: 0, dir: 1, a: 0 },
      { x: 0, y: 0, f: 0, dir: 1, a: 0 },
      { x: 0, y: 0, f: 0, dir: 1, a: 0 }
    ];
    ent._ghostHead = 0;
    ent._ghostLastMs = 0;
  }
  if (now - ent._ghostLastMs >= intervalMs) {
    ent._ghostLastMs = now;
    const slot = ent._ghostRing[ent._ghostHead];
    slot.x = ent.x;
    slot.y = ent.y;
    slot.f = frameIdx;
    slot.dir = flipSign;
    slot.a = startAlpha || 0.36;
    ent._ghostHead = (ent._ghostHead + 1) % 4;
  }
}

function _decayAndDrawGhostTrail(ent, dt, sheet, drawSize, yAnchorOffset) {
  const ring = ent._ghostRing;
  if (!ring || !sheet || !sheet.canvas) return;
  const cw = sheet.cellW, ch = sheet.cellH;
  for (let i = 0; i < ring.length; i++) {
    const g = ring[i];
    if (g.a <= 0.02) continue;
    g.a = Math.max(0, g.a - dt * 1.85);
    if (g.a <= 0.02) continue;
    ctx.save();
    ctx.globalAlpha = g.a;
    ctx.translate(g.x, g.y + yAnchorOffset);
    ctx.scale(g.dir < 0 ? -1 : 1, 1);
    const sx = Math.min(sheet.frames - 1, Math.max(0, g.f)) * cw;
    ctx.drawImage(sheet.canvas, sx, 0, cw, ch, -drawSize * 0.5, -drawSize * 0.93, drawSize, drawSize);
    ctx.restore();
  }
}

// 👾 12 种《烬塔残响》分层域 Q 版怪物 & 四幕守誓首领 4 帧动作精灵渲染
function drawEnemySprite(e) {
  const now = _syncNow();
  const r = Math.max(6, e.r || 15);
  const isBoss = e.type === 'boss' || e.type === 'special_boss';
  const isMini = e.type === 'mini_boss';
  const flash = e.hitFlash > 0 || (e.primed && ((now * 0.025) | 0) % 2 === 1);

  // 1. 地面接触阴影与首领/精英/神话二阶段清晰气场底环
  ctx.fillStyle = 'rgba(0,0,0,0.44)';
  ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.88, r * 0.96, r * 0.38, 0, 0, Math.PI * 2); ctx.fill();

  if (e.mythicPhase2) {
    ctx.strokeStyle = 'rgba(246, 211, 121, 0.90)';
    ctx.lineWidth = 3.0;
    ctx.beginPath(); ctx.arc(e.x, e.y + 2, r + 14 + Math.sin(now * 0.014) * 3, 0, Math.PI * 2); ctx.stroke();
  } else if (e.elite) {
    ctx.strokeStyle = 'rgba(246, 211, 121, 0.72)';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(e.x, e.y + 3, r + 5, 0, Math.PI * 2); ctx.stroke();
  } else if (isBoss) {
    ctx.strokeStyle = (e.hp < e.maxHp * 0.55 || overtime) ? 'rgba(251, 113, 133, 0.85)' : 'rgba(229, 184, 105, 0.58)';
    ctx.lineWidth = 3.0;
    ctx.beginPath(); ctx.arc(e.x, e.y + 4, r + 9, 0, Math.PI * 2); ctx.stroke();
  }

  // 首领直线突进蓄力聚气环（提前给玩家清晰的起手视觉信号）
  const isWindingUp = e.lockedAim !== undefined && !e.dashing;
  if (isWindingUp) {
    ctx.strokeStyle = e.dashWarnColor || '#ffd166';
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(e.x, e.y, r + 8 + Math.sin(now * 0.03) * 3, 0, Math.PI * 2); ctx.stroke();
  }

  if (e.exposeT > 0) {
    ctx.save();
    ctx.strokeStyle = '#f6d379';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.arc(e.x, e.y, r + 12, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // 2. 四幕首领优先驱动 1024×256 四帧角色动作表，普通怪采用 256px 高清预烘焙精灵
  const bossSheet = (isBoss && e.variant && typeof SpireAssets !== 'undefined' && SpireAssets.getHeroSheet)
    ? SpireAssets.getHeroSheet(e.variant, flash)
    : null;
  const targetFace = isWindingUp
    ? (Math.cos(e.lockedAim) < 0 ? -1 : 1)
    : ((player && player.x < e.x - 4) ? -1 : 1);

  if (bossSheet && bossSheet.canvas) {
    const bossAttacking = !!(e.dashing || isWindingUp || (e.burstLeft && e.burstLeft > 0));
    const dt = _stepEntityAnim(e, now, !isWindingUp && (e.spd > 10), targetFace, bossAttacking);
    const drawSize = r * 3.05;
    const footOffset = r * 0.86;
    const visFlip = Math.abs(e._visFlip) < 0.24 ? (e._visFlip < 0 ? -0.24 : 0.24) : e._visFlip;

    if (e.dashing || e.mythicPhase2) {
      _pushGhostTrail(e, now, e._curFrameIdx, visFlip < 0 ? -1 : 1, e.dashing ? 34 : 78);
    }
    _decayAndDrawGhostTrail(e, dt, SpireAssets.getHeroSheet(e.variant, false) || bossSheet, drawSize, footOffset);

    const strideBob = e._moveBlend * Math.abs(Math.sin((e._strideT || 0) * Math.PI * 0.5)) * 4.2;
    const turnHop = (1 - Math.min(1, Math.abs(e._visFlip))) * 3.0;
    const crouchY = isWindingUp ? 4.0 : 0;
    const sxScale = isWindingUp ? 1.07 : (e.dashing ? 1.08 : 1);
    const syScale = isWindingUp ? 0.91 : (e.dashing ? 0.95 : (1 + Math.sin(now * 0.005 + e.phase) * 0.022));

    ctx.save();
    ctx.translate(e.x, e.y + footOffset - strideBob - turnHop + crouchY);
    ctx.scale(visFlip * sxScale, syScale);
    const cw = bossSheet.cellW, ch = bossSheet.cellH;
    const cellX = Math.min(bossSheet.frames - 1, Math.max(0, e._curFrameIdx || 0)) * cw;
    ctx.drawImage(bossSheet.canvas, cellX, 0, cw, ch, -drawSize * 0.5, -drawSize * 0.93, drawSize, drawSize);
    ctx.restore();
  } else {
    const pulse = e.primed ? (1 + Math.sin(now * 0.036) * 0.14) : 1;
    const bob = Math.abs(Math.sin(e.phase * 0.9)) * (isBoss ? 3.5 : 2.4);
    const tilt = (!isBoss && !isMini) ? Math.sin(e.phase * 0.9) * 0.048 : 0;
    const spr = (typeof SpireAssets !== 'undefined') ? SpireAssets.getMonsterSprite(e, flash) : null;

    ctx.save();
    ctx.translate(e.x, e.y - bob);
    if (tilt) ctx.rotate(tilt);
    ctx.scale(targetFace * pulse, pulse);

    if (spr && spr.canvas) {
      const targetSize = isBoss ? r * 2.95 : (isMini ? r * 2.75 : r * 2.62);
      const sc = targetSize / Math.max(16, Math.max(spr.w, spr.h));
      const dw = spr.w * sc, dh = spr.h * sc;
      ctx.drawImage(spr.canvas, -dw * 0.5, -dh * 0.56, dw, dh);
    } else {
      ctx.fillStyle = flash ? '#ffffff' : (e.color || '#be123c');
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // 3. 四象元素异常状态高辨识度清爽叠层
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.freezeT > 0 && !flash) {
    ctx.fillStyle = 'rgba(114, 239, 221, 0.34)';
    ctx.strokeStyle = '#e0fbfc';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const ia = (k * Math.PI) / 3 - Math.PI / 6;
      const ir = r * 1.12;
      k === 0 ? ctx.moveTo(Math.cos(ia) * ir, Math.sin(ia) * ir) : ctx.lineTo(Math.cos(ia) * ir, Math.sin(ia) * ir);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (e.chillT > 0 && !flash) {
    ctx.fillStyle = 'rgba(114, 239, 221, 0.20)';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2); ctx.fill();
  }

  if (e.burnT > 0) {
    const flk = Math.sin(now * 0.026 + e.phase) * 2.5;
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(-5, -r * 0.7); ctx.quadraticCurveTo(0, -r - 13 + flk, 5, -r * 0.7);
    ctx.fill();
  }
  ctx.restore();

  if (e.type === 'shielder') {
    ctx.strokeStyle = '#72efdd'; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(e.x, e.y, r + 5, e.faceA - 0.85, e.faceA + 0.85); ctx.stroke();
  }

  if ((e.sigWindupT || 0) > 0 && e.castLabel && isBoss) {
    const wProg = Math.max(0, Math.min(1, 1 - e.sigWindupT / Math.max(0.1, e.sigMaxW || 0.88)));
    ctx.save();
    ctx.font = '900 12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const cw = Math.max(128, Math.min(220, e.castLabel.length * 13 + 22));
    const cy = e.y - r - 34;
    ctx.fillStyle = 'rgba(12, 9, 22, 0.88)';
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.roundRect(e.x - cw * 0.5, cy - 12, cw, 20, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
    ctx.fillRect(e.x - cw * 0.5 + 3, cy + 4, Math.max(2, (cw - 6) * wProg), 2.5);
    ctx.fillStyle = '#fef08a';
    ctx.fillText(e.castLabel, e.x, cy + 2);
    ctx.restore();
  } else if (e.exposeT > 0 && isBoss) {
    ctx.font = '800 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6d379';
    ctx.fillText('💥破绽易伤', e.x, e.y + r + 20);
  }
  if (e.poisonT > 0 && e.poisonStacks >= 2 && (isBoss || isMini || e.elite)) {
    ctx.font = '800 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a3e635';
    ctx.fillText(`☠️×${e.poisonStacks}`, e.x, e.y - r - 20);
  }

  if (!isBoss && !isMini && (e.type === 'brute' || e.type === 'juggernaut' || e.elite || e.hp < e.maxHp)) {
    const bw = Math.max(24, r * 1.8);
    ctx.fillStyle = 'rgba(6,9,16,0.80)';
    ctx.fillRect(e.x - bw / 2, e.y - r - 15, bw, 5);
    ctx.fillStyle = e.freezeT > 0 ? '#72efdd' : (e.poisonStacks > 0 ? '#a3e635' : (e.burnT > 0 ? '#fb923c' : (e.elite ? '#f6d379' : '#fb7185')));
    ctx.fillRect(e.x - bw / 2 + 1, e.y - r - 14, (bw - 2) * Math.max(0, e.hp / e.maxHp), 3);
  }
}

// 🕯️ 6 位《烬塔残响》登塔角色 1024×256 四帧丝滑动作渲染（速度同步步频 + 柔顺转身 + 招牌出招帧 + 清晰受击判定光圈）
function drawPotatoHero() {
  const p = player;
  if (!p) return;
  const it = p.items || {};
  const now = _syncNow();

  // 1. 索敌射程圈与青焰拾取磁环
  const dispR = Math.max(55, p._displayRange || 140);
  ctx.save();
  ctx.strokeStyle = 'rgba(246, 211, 121, 0.12)';
  ctx.lineWidth = 1.3;
  ctx.setLineDash([9, 9]);
  ctx.beginPath(); ctx.arc(p.x, p.y, dispR, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = it.magnet ? 'rgba(114, 239, 221, 0.14)' : 'rgba(229, 184, 105, 0.08)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(16, p.magnet || 100), 0, Math.PI * 2); ctx.stroke();

  // 2. 地面阴影 + 高辨识度角色受击判定心核环（密集弹幕中一眼看清精确走位判定点！）
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 22, 20, 7.5, 0, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = it.berserk ? 'rgba(251, 113, 133, 0.56)' : 'rgba(114, 239, 221, 0.48)';
  ctx.lineWidth = 2.0;
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 21, 22, 8.2, 0, 0, Math.PI * 2); ctx.stroke();

  ctx.strokeStyle = 'rgba(246, 211, 121, 0.34)';
  ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(10, (p.r || 15) - 2), 0, Math.PI * 2); ctx.stroke();

  // 3. 4 帧动作精灵表状态机与柔顺插值绘制
  const hurtFlash = p.invuln > 0 && (((p.invuln * 22) | 0) % 2 === 0);
  const inAtkPose = (p._atkPoseT || 0) > 0;
  const desiredFace = (inAtkPose && p._atkAimX !== undefined && Math.abs(p._atkAimX) > 0.16)
    ? (p._atkAimX < 0 ? -1 : 1)
    : (p.faceDir || 1);
  const dt = _stepEntityAnim(p, now, !!p.moving, desiredFace, inAtkPose);

  const heroSheet = (typeof SpireAssets !== 'undefined' && SpireAssets.getHeroSheet)
    ? SpireAssets.getHeroSheet(p.cls, hurtFlash)
    : null;

  const drawSize = 82;
  const footAnchorY = 23;
  const visFlip = Math.abs(p._visFlip) < 0.24 ? (p._visFlip < 0 ? -0.24 : 0.24) : p._visFlip;

  if (heroSheet && heroSheet.canvas) {
    // 青焰瞬步 / 苍岚疾风 / 狂沙顺风 / 残羽魔女闪避态触发丝滑残影拖尾
    const inDash = (p.dashT || 0) > 0;
    const fastRun = inDash || (p.dashHasteT || 0) > 0 || (p.moving && ((p.spdMul || 1) >= 1.18 || (typeof sandGustT !== 'undefined' && sandGustT > 0) || p.cls === 'ghost'));
    if (fastRun) {
      _pushGhostTrail(p, now, inDash ? 3 : p._curFrameIdx, visFlip < 0 ? -1 : 1, inDash ? 24 : 50, inDash ? 0.48 : 0.32);
    }
    _decayAndDrawGhostTrail(p, dt, SpireAssets.getHeroSheet(p.cls, false) || heroSheet, drawSize, footAnchorY);

    if (inDash || (p.dashHasteT || 0) > 0) {
      ctx.save();
      ctx.strokeStyle = inDash ? 'rgba(114, 239, 221, 0.85)' : 'rgba(110, 231, 183, 0.52)';
      ctx.lineWidth = inDash ? 2.8 : 1.8;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 19, inDash ? 28 : 24, inDash ? 10.5 : 9, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    const strideBob = p._moveBlend * Math.abs(Math.sin((p._strideT || 0) * Math.PI * 0.5)) * 4.0
      + (1 - p._moveBlend) * Math.sin(now * 0.0042) * 1.4;
    const turnHop = (1 - Math.min(1, Math.abs(p._visFlip))) * 2.8;
    const tilt = (p._leanA || 0) + p._moveBlend * Math.sin((p._strideT || 0) * Math.PI * 0.5) * 0.048;
    const lungeP = inAtkPose ? Math.min(1, (p._atkPoseT || 0) * 6.0) : 0;
    const lungeX = lungeP ? Math.cos(p._atkAngle || 0) * 3.8 * lungeP : 0;
    const lungeY = lungeP ? Math.sin(p._atkAngle || 0) * 2.4 * lungeP : 0;
    const sxScale = inDash ? 1.07 : (inAtkPose ? (1 + 0.045 * lungeP) : 1);
    const syScale = inDash ? 0.93 : (inAtkPose ? (1 - 0.032 * lungeP) : (1 + (1 - p._moveBlend) * Math.sin(now * 0.0042) * 0.018));

    ctx.save();
    ctx.translate(p.x + lungeX, p.y + footAnchorY + lungeY - strideBob - turnHop);
    if (tilt) ctx.rotate(tilt);
    ctx.scale(visFlip * sxScale, syScale);
    if (p.cls === 'ghost') ctx.globalAlpha = 0.93;
    const cw = heroSheet.cellW, ch = heroSheet.cellH;
    const sx = Math.min(heroSheet.frames - 1, Math.max(0, p._curFrameIdx || 0)) * cw;
    ctx.drawImage(heroSheet.canvas, sx, 0, cw, ch, -drawSize * 0.5, -drawSize * 0.93, drawSize, drawSize);
    ctx.restore();
  } else {
    const bounce = p.moving ? Math.abs(Math.sin(p.walkT)) * 4.2 : Math.sin(now * 0.004) * 1.6;
    const tilt = p.moving ? Math.sin(p.walkT) * 0.06 : 0;
    const spr = (typeof SpireAssets !== 'undefined') ? SpireAssets.getHeroSprite(p.cls, hurtFlash) : null;

    ctx.save();
    ctx.translate(p.x, p.y + 22 - bounce);
    ctx.rotate(tilt);
    ctx.scale(visFlip, 1);
    if (p.cls === 'ghost') ctx.globalAlpha = 0.92;

    if (spr && spr.canvas) {
      const targetH = 76;
      const sc = targetH / Math.max(16, spr.h);
      const dw = spr.w * sc, dh = spr.h * sc;
      ctx.drawImage(spr.canvas, -dw * 0.5, -dh, dw, dh);
    } else {
      ctx.fillStyle = hurtFlash ? '#ffffff' : '#f1efe7';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-16, 0); ctx.lineTo(-12, -44); ctx.quadraticCurveTo(0, -58, 12, -44); ctx.lineTo(16, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // 4. 魂灯能量护盾罩与环绕四象元素法球
  if (p.shield > 0) {
    const sr = p.r + 12;
    ctx.fillStyle = p.shieldHitT > 0 ? 'rgba(255, 255, 255, 0.24)' : 'rgba(114, 239, 221, 0.10)';
    ctx.beginPath(); ctx.arc(p.x, p.y - 4, sr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = p.shieldHitT > 0 ? '#ffffff' : 'rgba(114, 239, 221, 0.68)';
    ctx.lineWidth = 2.1;
    for (let k = 0; k < 3; k++) {
      const sa = now * 0.0025 + (k * Math.PI * 2) / 3;
      ctx.beginPath(); ctx.arc(p.x, p.y - 4, sr, sa, sa + 1.5); ctx.stroke();
    }
  }

  let orbMask = 0;
  if (p.teslaCount > 0) orbMask |= 1;
  if (it.napalm || it.warhead) orbMask |= 2;
  if (it.cryo || it.frost_prism) orbMask |= 4;
  if (it.venom_gland || it.plague_flask) orbMask |= 8;
  if (it.prism || it.cyberball || it.doom_edge) orbMask |= 16;

  if (orbMask !== 0) {
    const orbCols = [];
    if (orbMask & 1) orbCols.push('#72efdd');
    if (orbMask & 2) orbCols.push('#fb923c');
    if (orbMask & 4) orbCols.push('#38bdf8');
    if (orbMask & 8) orbCols.push('#a3e635');
    if (orbMask & 16) orbCols.push('#c084fc');
    for (let i = 0; i < orbCols.length; i++) {
      const oa = now * 0.0032 + (i * Math.PI * 2) / orbCols.length;
      const ox = p.x + Math.cos(oa) * 32, oy = p.y - 6 + Math.sin(oa) * 20;
      ctx.fillStyle = orbCols[i]; ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(ox, oy, 4.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  // 最后 5 秒倒计时徽标
  if (state === 'wave' && !overtime && waveTime > 0 && waveTime <= 5) {
    const sec = Math.ceil(waveTime);
    ctx.save();
    ctx.translate(p.x, p.y - 60);
    ctx.fillStyle = 'rgba(28, 10, 20, 0.88)';
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-26, -13, 52, 24, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.font = '900 15px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${sec}s`, 0, 4.5);
    ctx.restore();
  }
}

// 👑 守誓主宰全屏登场 & 剧场字幕栏角色半身原画徽章（暗金哥特圆章裁剪）
function drawBossPortrait(variant, cx, cy, scale, isMythic) {
  const now = _syncNow();
  const s = scale || 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  const ringCol = isMythic ? '#fde68a' : '#e5b869';
  if (isMythic) {
    ctx.fillStyle = 'rgba(225, 29, 72, 0.24)';
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2.2;
    for (const dir of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.moveTo(0, 4 - w * 10);
        ctx.lineTo(dir * (108 - w * 12), -58 + w * 26);
        ctx.lineTo(dir * (78 - w * 10), -18 + w * 28);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
  }

  ctx.fillStyle = '#0b101d';
  ctx.strokeStyle = ringCol;
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(0, 0, 68, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  const animeImg = typeof getBossAnimePortrait === 'function' ? getBossAnimePortrait(variant, !!isMythic) : null;
  if (animeImg) {
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, 64, 0, Math.PI * 2); ctx.clip();
    const iw = animeImg.naturalWidth || 420, ih = animeImg.naturalHeight || 420;
    const sc = 136 / Math.min(iw, ih);
    const dw = iw * sc, dh = ih * sc;
    ctx.drawImage(animeImg, -dw * 0.5, -dh * 0.46, dw, dh);
    ctx.restore();
  }

  ctx.strokeStyle = isMythic ? '#fb7185' : '#72efdd';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, 0, 74, now * 0.001, now * 0.001 + Math.PI * 1.4); ctx.stroke();
  ctx.restore();
}
