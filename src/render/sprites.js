// 22 把武器精细矢量造型绘制
function drawWeaponSprite(w) {
  const id = w.id, tc = TIER_COLORS[w.tier];
  ctx.save();
  ctx.translate(w.wx, w.wy);
  ctx.rotate(w.angle);
  if (Math.cos(w.angle) < 0) ctx.scale(1, -1);

  if (w.tier >= 2) {
    ctx.globalAlpha = 0.18 + w.tier * 0.05;
    ctx.fillStyle = tc;
    ctx.beginPath(); ctx.ellipse(6, 0, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = tc; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(6, 0, 22, 11.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 2.1;
  ctx.strokeStyle = '#14101a';

  if (id === 'stick') {
    ctx.fillStyle = '#9c6644';
    ctx.beginPath(); ctx.roundRect(-6, -4, 30, 8, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#52b788';
    ctx.beginPath(); ctx.ellipse(16, -7, 5, 3, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (id === 'rock') {
    ctx.fillStyle = w.tier > 1 ? tc : '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-8, -7); ctx.lineTo(5, -10); ctx.lineTo(17, -5);
    ctx.lineTo(15, 7); ctx.lineTo(2, 10); ctx.lineTo(-9, 5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(6, -7); ctx.lineTo(9, -2); ctx.closePath(); ctx.fill();
  } else if (id === 'spear') {
    ctx.fillStyle = '#7f5539';
    ctx.fillRect(-14, -2.5, 34, 5); ctx.strokeRect(-14, -2.5, 34, 5);
    ctx.fillStyle = '#d90429';
    ctx.fillRect(14, -4, 5, 8);
    ctx.fillStyle = w.tier > 1 ? tc : '#e5e5e5';
    ctx.beginPath(); ctx.moveTo(19, -5.5); ctx.lineTo(34, 0); ctx.lineTo(19, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'slingshot') {
    ctx.strokeStyle = '#14101a'; ctx.lineWidth = 4.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(2, 0); ctx.lineTo(11, -8); ctx.moveTo(2, 0); ctx.lineTo(11, 8); ctx.stroke();
    ctx.strokeStyle = '#9c6644'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(2, 0); ctx.lineTo(11, -8); ctx.moveTo(2, 0); ctx.lineTo(11, 8); ctx.stroke();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(11, -8); ctx.lineTo(5, 0); ctx.lineTo(11, 8); ctx.stroke();
  } else if (id === 'wrench') {
    ctx.fillStyle = w.tier > 1 ? tc : '#adb5bd';
    ctx.beginPath(); ctx.roundRect(-8, -3.5, 24, 7, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(18, 0, 7, 0.65, Math.PI * 2 - 0.65); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'knife') {
    ctx.fillStyle = '#6c584c';
    ctx.fillRect(-8, -3, 8, 6); ctx.strokeRect(-8, -3, 8, 6);
    ctx.fillStyle = w.tier > 1 ? tc : '#e5e5e5';
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(22, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'claws') {
    ctx.fillStyle = '#3b2848';
    ctx.beginPath(); ctx.roundRect(-7, -7, 8, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#f8f9fa';
    for (const cy of [-5, 0, 5]) {
      ctx.beginPath(); ctx.moveTo(1, cy - 2); ctx.quadraticCurveTo(13, cy - 3, 21, cy); ctx.lineTo(1, cy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else if (id === 'katana') {
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(-13, -2.8, 11, 5.6); ctx.strokeRect(-13, -2.8, 11, 5.6);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-2, -6, 3, 12);
    ctx.fillStyle = w.tier > 1 ? tc : '#f8f9fa';
    ctx.beginPath(); ctx.moveTo(1, -3.5); ctx.quadraticCurveTo(18, -5, 33, -1); ctx.lineTo(29, 3.2); ctx.lineTo(1, 2.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'crossbow') {
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(-10, -2.5, 25, 5); ctx.strokeRect(-10, -2.5, 25, 5);
    ctx.strokeStyle = w.tier > 1 ? tc : '#cbd5e1'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(7, 0, 12, -1.18, 1.18); ctx.stroke();
    ctx.strokeStyle = '#ffe8a3'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(11, -11); ctx.lineTo(-2, 0); ctx.lineTo(11, 11); ctx.stroke();
  } else if (id === 'hammer') {
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(-10, -2.8, 26, 5.6); ctx.strokeRect(-10, -2.8, 26, 5.6);
    ctx.fillStyle = w.tier > 1 ? tc : '#6c757d';
    ctx.beginPath(); ctx.roundRect(12, -11, 13, 22, 3); ctx.fill(); ctx.stroke();
  } else if (id === 'pistol') {
    ctx.fillStyle = '#4a4e69';
    ctx.beginPath(); ctx.roundRect(-5, 1, 7, 9, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#9a8c98';
    ctx.beginPath(); ctx.roundRect(-6, -5, 20, 8, 2); ctx.fill(); ctx.stroke();
  } else if (id === 'smg') {
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(2, 2, 5, 10); ctx.strokeRect(2, 2, 5, 10);
    ctx.fillStyle = w.tier > 1 ? tc : '#8d99ae';
    ctx.beginPath(); ctx.roundRect(-8, -5, 24, 8, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.fillRect(16, -3, 6, 4);
  } else if (id === 'shotgun') {
    ctx.fillStyle = '#7f4f24';
    ctx.beginPath(); ctx.roundRect(-11, -3, 12, 8, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#6c757d';
    ctx.fillRect(0, -5, 22, 7); ctx.strokeRect(0, -5, 22, 7);
  } else if (id === 'minigun') {
    ctx.fillStyle = '#2b2d42';
    ctx.beginPath(); ctx.roundRect(-12, -6.5, 14, 13, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#94a3b8';
    ctx.fillRect(2, -5.5, 22, 3); ctx.fillRect(2, -1.5, 22, 3); ctx.fillRect(2, 2.5, 22, 3);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(16, -6.5, 3.5, 13);
  } else if (id === 'sniper') {
    ctx.fillStyle = '#582f0e';
    ctx.beginPath(); ctx.roundRect(-14, -3, 14, 7, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#495057';
    ctx.fillRect(-1, -4, 31, 5.5); ctx.strokeRect(-1, -4, 31, 5.5);
    ctx.fillStyle = '#4cc9f0';
    ctx.beginPath(); ctx.roundRect(2, -9, 12, 4.5, 2); ctx.fill(); ctx.stroke();
  } else if (id === 'shuriken') {
    ctx.rotate(performance.now() * 0.008);
    ctx.fillStyle = w.tier > 1 ? tc : '#caf0f8';
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI * 0.5;
      ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
      ctx.lineTo(Math.cos(a + 0.4) * 4.5, Math.sin(a + 0.4) * 4.5);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#14101a';
    ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'icicle') {
    ctx.fillStyle = '#72efdd';
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(0, -6.5); ctx.lineTo(24, 0); ctx.lineTo(0, 6.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(2, -2.5); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill();
  } else if (id === 'laser') {
    ctx.fillStyle = '#3a0ca3';
    ctx.beginPath(); ctx.roundRect(-9, -6, 26, 11, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(-2, -3, 15, 5);
  } else if (id === 'flamer') {
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.roundRect(-10, 1, 11, 8, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#6c757d';
    ctx.beginPath(); ctx.roundRect(-8, -5.5, 25, 8, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9f1c';
    ctx.fillRect(17, -4, 5, 5);
  } else if (id === 'taser') {
    ctx.fillStyle = '#240046';
    ctx.beginPath(); ctx.roundRect(-8, -5.5, 20, 10, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#72efdd'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(19, -5); ctx.moveTo(12, 3); ctx.lineTo(19, 4); ctx.stroke();
  } else if (id === 'plasma') {
    ctx.fillStyle = '#3c096c';
    ctx.beginPath(); ctx.roundRect(-10, -6.5, 24, 13, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c77dff';
    ctx.beginPath(); ctx.arc(15, 0, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(15, 0, 2.4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'rocket') {
    ctx.fillStyle = w.tier > 1 ? tc : '#386641';
    ctx.beginPath(); ctx.roundRect(-14, -6.5, 32, 12, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath(); ctx.moveTo(18, -5); ctx.lineTo(25, -0.5); ctx.lineTo(18, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'blowgun') {
    ctx.fillStyle = '#52b788';
    ctx.beginPath(); ctx.roundRect(-12, -3, 34, 6, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-3, -4, 3, 8); ctx.fillRect(10, -4, 3, 8);
    ctx.fillStyle = '#a3e635';
    ctx.beginPath(); ctx.moveTo(22, -3.5); ctx.lineTo(29, 0); ctx.lineTo(22, 3.5); ctx.closePath(); ctx.fill();
  } else if (id === 'revolver') {
    ctx.fillStyle = '#582f0e';
    ctx.beginPath(); ctx.roundRect(-9, 1, 8, 9, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#cbd5e1';
    ctx.beginPath(); ctx.roundRect(-4, -5.5, 9, 8.5, 2); ctx.fill(); ctx.stroke();
    ctx.fillRect(5, -4.5, 17, 5); ctx.strokeRect(5, -4.5, 17, 5);
  } else if (id === 'shredder') {
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.roundRect(-10, -5.5, 24, 10, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9f1c';
    ctx.fillRect(2, -3.5, 9, 5);
    ctx.fillStyle = w.tier > 1 ? tc : '#94a3b8';
    ctx.beginPath(); ctx.moveTo(14, -6.5); ctx.lineTo(23, -3); ctx.lineTo(23, 3); ctx.lineTo(14, 6.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === 'spiked_shield') {
    ctx.fillStyle = w.tier > 1 ? tc : '#64748b';
    ctx.beginPath();
    ctx.moveTo(-4, -12); ctx.lineTo(12, -9); ctx.lineTo(17, 0); ctx.lineTo(12, 9); ctx.lineTo(-4, 12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    for (const sy of [-6, 0, 6]) {
      ctx.beginPath(); ctx.moveTo(13, sy - 2.5); ctx.lineTo(22, sy); ctx.lineTo(13, sy + 2.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else if (id === 'grenade_launcher') {
    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.roundRect(-12, -5, 14, 10, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.arc(3, 0, 6.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#64748b';
    ctx.fillRect(9, -5.5, 13, 11); ctx.strokeRect(9, -5.5, 13, 11);
  } else if (id === 'magma_blade') {
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(-13, -3, 10, 6); ctx.strokeRect(-13, -3, 10, 6);
    ctx.fillStyle = '#fb5607';
    ctx.beginPath();
    ctx.moveTo(-2, -6); ctx.lineTo(22, -7.5); ctx.lineTo(33, 0); ctx.lineTo(20, 7); ctx.lineTo(-2, 5.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(24, 0); ctx.lineTo(4, 2); ctx.closePath(); ctx.fill();
  } else if (id === 'screwdriver') {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.roundRect(-10, -4.5, 12, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#cbd5e1';
    ctx.fillRect(2, -1.8, 18, 3.6); ctx.strokeRect(2, -1.8, 18, 3.6);
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(19, -3, 5, 6);
  } else if (id === 'nailgun') {
    ctx.fillStyle = '#eab308';
    ctx.beginPath(); ctx.roundRect(-9, -6, 22, 10, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.fillRect(-2, 3, 8, 8); ctx.strokeRect(-2, 3, 8, 8);
    ctx.fillStyle = '#72efdd';
    ctx.fillRect(13, -3.5, 8, 5);
  } else if (id === 'drone_bay') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-8, -9); ctx.lineTo(10, -9); ctx.lineTo(17, 0); ctx.lineTo(10, 9); ctx.lineTo(-8, 9);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = w.tier > 1 ? tc : '#4cc9f0';
    ctx.beginPath(); ctx.arc(4, 0, 4.8, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'emp_cannon') {
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath(); ctx.roundRect(-12, -7, 24, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(10, -6.5, 16, 4); ctx.strokeRect(10, -6.5, 16, 4);
    ctx.fillRect(10, 2.5, 16, 4); ctx.strokeRect(10, 2.5, 16, 4);
    ctx.fillStyle = '#e0fbfc';
    ctx.fillRect(4, -2, 18, 4);
  }
  ctx.restore();
}

// 异星晶树绘制（荧光晶簇树冠 + 木质树干 + 受击闪白与血条）
function drawTreeSprite(tr) {
  const sw = Math.sin(tr.sway || 0) * 1.8;
  const flash = tr.hitFlash > 0;
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath(); ctx.ellipse(tr.x, tr.y + 16, 20, 8, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(tr.x, tr.y);
  ctx.strokeStyle = '#15111c'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
  // 树干
  ctx.fillStyle = flash ? '#fff' : '#6c462f';
  ctx.beginPath();
  ctx.moveTo(-6, 15); ctx.lineTo(-4 + sw * 0.3, -4); ctx.lineTo(4 + sw * 0.3, -4); ctx.lineTo(7, 15);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // 异星晶簇树冠（三层翠玉荧光晶叶 + 金果点缀）
  ctx.fillStyle = flash ? '#ffffff' : '#2ec4b6';
  ctx.beginPath(); ctx.arc(-9 + sw, -8, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(10 + sw, -7, 11.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash ? '#ffffff' : '#5ef29b';
  ctx.beginPath(); ctx.arc(0 + sw, -16, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (!flash) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(-5 + sw, -14, 3, 0, Math.PI * 2); ctx.arc(6 + sw, -9, 2.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  if (tr.hp < tr.maxHp) {
    const bw = 34;
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.fillRect(tr.x - bw / 2, tr.y - 38, bw, 5);
    ctx.fillStyle = '#5ef29b';
    ctx.fillRect(tr.x - bw / 2 + 1, tr.y - 37, (bw - 2) * Math.max(0, tr.hp / Math.max(1, tr.maxHp)), 3);
  }
}

// 自动机枪炮台与浮游激光塔绘制
function drawTurretSprite(t) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 14, 16, 7, 0, 0, Math.PI * 2); ctx.fill();

  if (t.kind === 'laser') {
    const bob = Math.sin(performance.now() * 0.006 + t.x) * 2.5;
    ctx.save();
    ctx.translate(t.x, t.y + bob);
    ctx.strokeStyle = '#14101a'; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      if (k === 0) ctx.moveTo(Math.cos(a) * 13, Math.sin(a) * 13);
      else ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(t.angle);
    ctx.fillStyle = '#c77dff';
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(4, -7); ctx.lineTo(-5, 0); ctx.lineTo(4, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#72efdd';
    ctx.beginPath(); ctx.arc(2, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }

  ctx.strokeStyle = '#1a1624'; ctx.lineWidth = 3;
  ctx.fillStyle = '#495057';
  ctx.beginPath(); ctx.arc(t.x, t.y + 6, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.save();
  ctx.translate(t.x - Math.cos(t.angle) * t.recoil * 4, t.y - Math.sin(t.angle) * t.recoil * 4);
  ctx.rotate(t.angle);
  ctx.fillStyle = '#2b2d42'; ctx.strokeStyle = '#14101a'; ctx.lineWidth = 2.4;
  ctx.fillRect(4, -4, 16, 8); ctx.strokeRect(4, -4, 16, 8);
  ctx.fillStyle = TIER_COLORS[t.tier] === '#e2deec' ? '#ffd166' : TIER_COLORS[t.tier];
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#72efdd';
  ctx.beginPath(); ctx.arc(2, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// 12 种异星怪物差异化非圆球剪影绘制（虫足、螯钳、炮管、尖刺、软泥波浪、法师长袍、巨兽双拳等）
function drawEnemySprite(e) {
  const now = performance.now();
  const pulse = e.primed ? (1 + Math.sin(now * 0.04) * 0.18) : 1;
  const wobX = (1 + Math.sin(e.phase) * 0.07) * pulse;
  const wobY = (1 - Math.sin(e.phase) * 0.07) * pulse;
  const r = Math.max(4, e.r || 14);

  if (e.mythicPhase2) {
    const mp = Math.sin(now * 0.016) * 4;
    ctx.save();
    ctx.translate(e.x, e.y);
    // 神话二阶段：金红交织八芒神环与炽翼残影
    ctx.fillStyle = 'rgba(255, 209, 102, 0.16)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.2);
      ctx.lineTo(s * (r * 1.95 + mp), -r * 1.05);
      ctx.lineTo(s * (r * 1.55), r * 0.15);
      ctx.lineTo(s * (r * 1.80 + mp * 0.5), r * 0.85);
      ctx.lineTo(0, r * 0.35);
      ctx.closePath();
      ctx.fill();
    }
    ctx.rotate(now * 0.0018);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = (k * Math.PI) / 8;
      const rad = k % 2 === 0 ? r + 17 + mp * 0.5 : r + 9;
      if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  } else if (e.elite) {
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.68)';
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(e.x, e.y + 2, r + 6, 0, Math.PI * 2); ctx.stroke();
  } else if ((e.type === 'boss' || e.type === 'special_boss') && (e.hp < e.maxHp * 0.55 || overtime)) {
    ctx.strokeStyle = 'rgba(255, 59, 107, 0.72)';
    ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.arc(e.x, e.y + 2, r + 9 + Math.sin(now * 0.015) * 3, 0, Math.PI * 2); ctx.stroke();
  }

  // 首领破绽暴露光圈（提示近战/远程此时输出享高额易伤加成！）
  if (e.exposeT > 0) {
    ctx.save();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.6;
    ctx.setLineDash([9, 6]);
    ctx.beginPath();
    ctx.arc(e.x, e.y, r + 13, now * 0.004, now * 0.004 + Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (e.type === 'summoner' || e.type === 'healer') {
    ctx.strokeStyle = e.type === 'summoner' ? 'rgba(199,125,255,0.40)' : 'rgba(82,183,136,0.40)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, e.y + 4, r * 1.42, 0, Math.PI * 2); ctx.stroke();
  }

  if ((e.type === 'charger' || e.type === 'boss' || e.type === 'mini_boss') && e.dashT > 0 && e.dashT <= 0.48 && e.lockedAim !== undefined) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 59, 107, 0.58)';
    ctx.lineWidth = e.type === 'boss' ? 14 : 7;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + Math.cos(e.lockedAim) * 265, e.y + Math.sin(e.lockedAim) * 265);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.92, r * 0.9, r * 0.36, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(wobX, wobY);
  const flash = e.hitFlash > 0 || (e.primed && Math.floor(now * 0.025) % 2);
  const fill = flash ? '#ffffff' : e.color;
  const strokeCol = e.freezeT > 0 ? '#e0fbfc' : (e.chillT > 0 ? '#72efdd' : ((e.poisonT > 0 && e.poisonStacks > 0) ? '#a3e635' : (e.elite || e.mythicPhase2 ? '#ffd166' : '#15111c')));
  ctx.lineWidth = (e.elite || e.mythicPhase2) ? 3.2 : 2.6;
  ctx.strokeStyle = strokeCol;
  ctx.lineJoin = 'round';

  // --- 按物种绘制高辨识度差异化剪影与攻击器官 ---
  if (e.type === 'chaser') {
    // 追踪噬咬甲虫：两侧 6 条疾走节肢 + 背部横纹重甲壳 + 扑咬开合象牙巨颚
    const legWig = Math.sin(e.phase * 1.6) * 3.4;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let k = -1; k <= 1; k++) {
      const ly = k * 5.5, off = (k % 2 === 0 ? legWig : -legWig);
      ctx.moveTo(-r * 0.7, ly); ctx.lineTo(-r - 6.5, ly + off - 2);
      ctx.moveTo(r * 0.7, ly);  ctx.lineTo(r + 6.5, ly - off - 2);
    }
    ctx.moveTo(-4, -r + 1); ctx.lineTo(-9, -r - 7);
    ctx.moveTo(4, -r + 1);  ctx.lineTo(9, -r - 7);
    ctx.stroke();
    ctx.lineWidth = e.elite ? 3.1 : 2.6;
    const jawOpen = e.lungeBoostT > 0 ? 3.5 : Math.abs(Math.sin(e.phase)) * 1.8;
    ctx.fillStyle = flash ? '#fff' : '#ffe8a3';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 4, r * 0.62); ctx.lineTo(s * (9 + jawOpen), r + 7); ctx.lineTo(s * 2, r + 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.92, r * 1.08, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (!flash) {
      ctx.strokeStyle = 'rgba(21,17,28,0.48)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 3, r * 0.68, Math.PI * 1.15, Math.PI * 1.85);
      ctx.moveTo(0, -r * 0.45); ctx.lineTo(0, r * 0.65);
      ctx.stroke();
      ctx.strokeStyle = strokeCol;
    }
  } else if (e.type === 'swarmer') {
    // 迅捷飞蝇：高频扇动双翼 + 尖尾黄黑条纹毒蜂躯干
    const wf = Math.sin(e.phase) * 0.55;
    ctx.fillStyle = 'rgba(235, 248, 255, 0.78)';
    ctx.beginPath(); ctx.ellipse(-11, -4, 9.5, 4.5, -0.45 + wf, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(11, -4, 9.5, 4.5, 0.45 - wf, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.05);
    ctx.quadraticCurveTo(r * 1.05, -2, 0, r * 1.35);
    ctx.quadraticCurveTo(-r * 1.05, -2, 0, -r * 1.05);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (e.type === 'shooter') {
    // 酸液喷射虫：鼓胀发光双颊毒液囊 + 背部尖鳍 + 朝向玩家的生物喷吐管
    const sacPulse = 1 + Math.sin(e.phase * 1.5) * 0.14;
    ctx.fillStyle = flash ? '#fff' : '#80ffdb';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.arc(s * (r * 0.88), 2, 5.4 * sacPulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = flash ? '#fff' : '#0077b6';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.62, -5); ctx.lineTo(s * (r + 7), -10); ctx.lineTo(s * r * 0.76, 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.12);
    ctx.bezierCurveTo(r * 1.08, -r * 0.6, r * 1.04, r * 0.85, 0, r * 0.98);
    ctx.bezierCurveTo(-r * 1.04, r * 0.85, -r * 1.08, -r * 0.6, 0, -r * 1.12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    const nx = Math.cos(e.faceA), ny = Math.sin(e.faceA);
    ctx.fillStyle = flash ? '#fff' : '#023e8a';
    ctx.beginPath(); ctx.arc(nx * (r * 0.82), ny * (r * 0.82), 6.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#90e0ef';
    ctx.beginPath(); ctx.arc(nx * (r * 0.92), ny * (r * 0.92), 3, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'mortar') {
    // 酸液迫击虫：四足重甲虫底盘 + 酸液储罐 + 粗口径迫击炮筒
    ctx.fillStyle = '#3d2c1e';
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        ctx.beginPath(); ctx.roundRect(sx * (r * 0.72) - 4, sy * (r * 0.52) - 3.5, 8, 7, 2); ctx.fill(); ctx.stroke();
      }
    }
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.roundRect(-r, -r * 0.86, r * 2, r * 1.72, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b2118';
    ctx.beginPath(); ctx.roundRect(-7, -r - 9, 14, 13, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath(); ctx.arc(0, -r - 7, 4.2, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'bomber') {
    // 自爆孢子怪：8 刺海雷星芒轮廓 + 点燃读秒膨胀高频闪白预警
    const fp = e.primed ? Math.max(0, Math.min(1, 1 - e.fuseT / (e.maxFuseT || 1.25))) : 0;
    const swell = e.primed ? 1 + fp * 0.28 + Math.sin(now * 0.04) * 0.08 : 1;
    ctx.fillStyle = e.primed ? (Math.floor(now * 0.022) % 2 ? '#ffd166' : '#ff2a55') : fill;
    ctx.beginPath();
    const spikes = 8;
    for (let k = 0; k < spikes * 2; k++) {
      const a = (k * Math.PI) / spikes + e.phase * 0.15;
      const rad = (k % 2 === 0 ? r * 1.24 : r * 0.78) * swell;
      if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d4a373'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, -r * swell); ctx.quadraticCurveTo(5, -r * swell - 9, 10, -r * swell - 7); ctx.stroke();
    ctx.fillStyle = Math.floor(now * 0.025) % 2 ? '#ffd166' : '#ff3b6b';
    ctx.beginPath(); ctx.arc(10, -r * swell - 7, e.primed ? 6.5 : 4.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = strokeCol;
  } else if (e.type === 'splitter' || e.type === 'mini_slime') {
    // 分裂软泥怪：不规则流动波浪史莱姆轮廓 + 内部透明气泡核
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = fill;
    ctx.beginPath();
    const lobes = 10;
    for (let k = 0; k <= lobes; k++) {
      const a = (k / lobes) * Math.PI * 2;
      const waveR = r * (0.94 + Math.sin(a * 3 + e.phase * 1.3) * 0.13 + Math.cos(a * 2 - e.phase) * 0.08);
      const px = Math.cos(a) * waveR, py = Math.sin(a) * waveR * 0.92 + (pyOffset(a, r));
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
    if (!flash) {
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.25, r * 0.22, 0, Math.PI * 2);
      ctx.arc(r * 0.35, r * 0.22, r * 0.14, 0, Math.PI * 2); ctx.fill();
    }
  } else if (e.type === 'shielder') {
    // 铁甲圣甲虫：八角铆钉重装甲壳
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const px = Math.cos(a) * r * 1.04, py = Math.sin(a) * r * 1.04;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!flash) {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.stroke();
      ctx.strokeStyle = strokeCol;
    }
  } else if (e.type === 'summoner') {
    // 虚空召唤师：下摆锯齿法师长袍 + 双袖 + 尖顶巫师帽 + 悬浮秘法球
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 1.12, r * 0.35);
    ctx.lineTo(r * 0.88, r * 1.08);
    ctx.lineTo(r * 0.3, r * 0.82);
    ctx.lineTo(0, r * 1.12);
    ctx.lineTo(-r * 0.3, r * 0.82);
    ctx.lineTo(-r * 0.88, r * 1.08);
    ctx.lineTo(-r * 1.12, r * 0.35);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#240046';
    ctx.beginPath(); ctx.arc(0, -2, r * 0.56, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3c096c'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-16, -r + 5); ctx.lineTo(0, -r - 17); ctx.lineTo(16, -r + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    const orbY = -4 + Math.sin(e.phase * 1.4) * 3;
    ctx.fillStyle = '#e0aaff';
    ctx.beginPath(); ctx.arc(r + 7, orbY, 4.2, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'healer') {
    // 共生医疗虫：浮空水母伞盖 + 4 条飘动触须 + 翠绿十字徽记
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let k = -1.5; k <= 1.5; k += 1) {
      const tx = k * 5.2, sw = Math.sin(e.phase * 1.5 + k) * 3.5;
      ctx.moveTo(tx, r * 0.35); ctx.quadraticCurveTo(tx + sw, r * 0.8, tx - sw * 0.5, r * 1.18);
    }
    ctx.stroke();
    ctx.lineWidth = e.elite ? 3.1 : 2.6;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 1, r, Math.PI, 0);
    ctx.quadraticCurveTo(r, r * 0.55, 0, r * 0.42);
    ctx.quadraticCurveTo(-r, r * 0.55, -r, 1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2.2, -r - 9, 4.4, 11); ctx.fillRect(-5.5, -r - 5.7, 11, 4.4);
  } else if (e.type === 'brute') {
    // 重甲巨兽：宽肩倒三角魁梧躯干 + 两侧摆动重拳 + 肩甲尖刺 + 獠牙独眼
    const swing = Math.sin(e.phase * 1.2) * 4.5;
    ctx.fillStyle = flash ? '#fff' : '#5a189a';
    ctx.beginPath(); ctx.arc(-r - 3, 4 + swing, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(r + 3, 4 - swing, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(-r * 1.08, -r * 0.35);
    ctx.quadraticCurveTo(0, -r * 1.18, r * 1.08, -r * 0.35);
    ctx.lineTo(r * 0.82, r * 0.92);
    ctx.quadraticCurveTo(0, r * 1.08, -r * 0.82, r * 0.92);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 肩刺与下颚双白獠牙
    ctx.fillStyle = '#ffd166';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * r * 0.72, -r * 0.55); ctx.lineTo(s * (r + 6), -r * 0.95); ctx.lineTo(s * r * 0.98, -r * 0.18); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 7, r * 0.55); ctx.lineTo(s * 9, r * 0.18); ctx.lineTo(s * 4, r * 0.52); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else if (e.type === 'stalker') {
    // 刀锋疾行螳：流线型青绿螳螂甲壳 + V 字战术额冠 + 双侧开合寒光大镰刃
    const scSw = Math.sin(e.phase * 1.9) * 0.28;
    ctx.fillStyle = flash ? '#fff' : '#72efdd';
    for (const s of [-1, 1]) {
      ctx.save(); ctx.rotate(s * scSw);
      ctx.beginPath();
      ctx.moveTo(s * r * 0.48, -3);
      ctx.lineTo(s * (r + 12), r * 0.36);
      ctx.lineTo(s * r * 0.38, r * 1.16);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.15); ctx.lineTo(r * 0.86, -2); ctx.lineTo(0, r * 1.04); ctx.lineTo(-r * 0.86, -2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!flash) {
      ctx.strokeStyle = '#e0fbfc'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-5, -r * 0.55); ctx.lineTo(0, -r * 0.15); ctx.lineTo(5, -r * 0.55); ctx.stroke();
      ctx.strokeStyle = strokeCol;
    }
  } else if (e.type === 'sniper_bug') {
    // 晶刺狙击虫：展开三脚稳定虫肢 + 修长赤晶背甲 + 精密长管骨刺狙击炮
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, -4); ctx.lineTo(-r - 7, -10);
    ctx.moveTo(r * 0.65, -4);  ctx.lineTo(r + 7, -10);
    ctx.moveTo(-r * 0.65, 5);  ctx.lineTo(-r - 7, 11);
    ctx.moveTo(r * 0.65, 5);   ctx.lineTo(r + 7, 11);
    ctx.stroke();
    ctx.lineWidth = e.elite ? 3.1 : 2.6;
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.ellipse(0, 1, r * 0.84, r * 1.06, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.save();
    ctx.rotate(e.faceA);
    ctx.fillStyle = flash ? '#fff' : '#2b2d42';
    ctx.beginPath(); ctx.roundRect(2, -3.6, r + 12, 7.2, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = e.aimA !== undefined ? '#ffd166' : '#ff4d6d';
    ctx.beginPath(); ctx.arc(r + 12, 0, 3.0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (e.type === 'spinner') {
    // 旋刃飞盘虫：高速自转六齿合金锯盘 + 重甲虫核
    ctx.save();
    ctx.rotate(e.phase * 0.7);
    ctx.fillStyle = flash ? '#fff' : '#ffd166';
    ctx.beginPath();
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6;
      const rad = k % 2 === 0 ? r * 1.22 : r * 0.78;
      if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (e.type === 'juggernaut') {
    // 黑曜重装泰坦：超巨型八角黑曜石堡垒重甲 + 熔岩裂隙胸核
    ctx.fillStyle = flash ? '#fff' : '#1e293b';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(s * r * 0.78 - 7, -r * 0.55, 14, r * 1.1, 4); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const px = Math.cos(a) * r * 1.04, py = Math.sin(a) * r * 0.98;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!flash) {
      ctx.strokeStyle = '#ff6b35'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(-r * 0.52, r * 0.28); ctx.lineTo(0, r * 0.48); ctx.lineTo(r * 0.52, r * 0.28); ctx.stroke();
      ctx.strokeStyle = strokeCol;
    }
  } else if (e.type === 'rad_scorpion') {
    // 废土专属：晶化毒蝎（双螯钳 + 节肢甲壳 + 高举荧光毒尾针）
    ctx.fillStyle = flash ? '#fff' : '#38b000';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.55, r * 0.35); ctx.quadraticCurveTo(s * r * 1.35, r * 0.85, s * r * 0.65, r * 1.25);
      ctx.lineTo(s * r * 0.38, r * 0.78); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.ellipse(0, 2, r * 0.92, r * 0.96, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const tailSw = Math.sin(e.phase * 1.4) * 3;
    ctx.strokeStyle = strokeCol; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.quadraticCurveTo(tailSw, -r - 12, tailSw * 0.5, -r - 4); ctx.stroke();
    ctx.fillStyle = '#ccff33';
    ctx.beginPath(); ctx.arc(tailSw * 0.6, -r - 8, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (e.type === 'sand_worm') {
    // 荒漠专属：潜沙虫（三段环纹沙虫躯体 + 旋转利齿口器）
    ctx.fillStyle = '#c97a3d';
    ctx.beginPath(); ctx.arc(0, r * 0.35, r * 0.78, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(0, -2, r * 0.98, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b1d12';
    ctx.beginPath(); ctx.arc(0, -3, r * 0.48, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    for (let k = 0; k < 6; k++) {
      const ta = (k / 6) * Math.PI * 2 + e.phase * 0.5;
      ctx.beginPath();
      ctx.arc(Math.cos(ta) * r * 0.45, -3 + Math.sin(ta) * r * 0.45, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (e.type === 'frost_wisp') {
    // 冻原专属：凛冬冰魄（旋转六芒冰晶棱体）
    ctx.save();
    ctx.rotate(e.phase * 0.25);
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6;
      const rad = k % 2 === 0 ? r * 1.22 : r * 0.58;
      if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (!flash) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2); ctx.fill();
    }
  } else if (e.type === 'magma_imp') {
    // 熔窟专属：熔火小鬼（恶魔尖角 + 跃动火焰发冠 + 熔岩裂纹躯干）
    const fl = Math.sin(e.phase * 2) * 3;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.4); ctx.lineTo(-r * 0.95, -r - 8); ctx.lineTo(-2, -r - 3 + fl);
    ctx.lineTo(3, -r - 11 - fl); ctx.lineTo(r * 0.95, -r - 8); ctx.lineTo(r * 0.6, -r * 0.4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(0, 2, r * 0.95, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (e.type === 'spore_mother') {
    // 菌林专属：剧毒孢子母体（巨型毒蕈伞盖 + 荧光绿孢子斑点）
    ctx.fillStyle = '#e0aaff';
    ctx.beginPath(); ctx.roundRect(-r * 0.45, 0, r * 0.9, r * 0.95, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 2, r * 1.08, Math.PI, 0);
    ctx.quadraticCurveTo(r * 1.15, r * 0.35, 0, r * 0.25);
    ctx.quadraticCurveTo(-r * 1.15, r * 0.35, -r * 1.08, 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!flash) {
      ctx.fillStyle = '#a3e635';
      ctx.beginPath();
      ctx.arc(-r * 0.45, -r * 0.35, 4.2, 0, Math.PI * 2);
      ctx.arc(r * 0.42, -r * 0.28, 3.6, 0, Math.PI * 2);
      ctx.arc(0, -r * 0.62, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (e.type === 'boss' && e.variant === 'frost_queen') {
    // 最终 Boss：极寒霜晶女皇（冰晶羽翼披肩 + 环绕冰凌 + 棱镜女皇躯干）
    ctx.fillStyle = flash ? '#fff' : '#90e0ef';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.3); ctx.lineTo(s * r * 1.42, -r * 0.85); ctx.lineTo(s * r * 1.18, r * 0.35);
      ctx.lineTo(s * r * 1.35, r * 0.85); ctx.lineTo(0, r * 0.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.12); ctx.lineTo(r * 0.88, 0); ctx.lineTo(0, r * 1.12); ctx.lineTo(-r * 0.88, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const oa = e.phase * 0.45 + (k * Math.PI) / 2;
      const ox = Math.cos(oa) * (r + 12), oy = Math.sin(oa) * (r + 12);
      ctx.fillStyle = '#e0fbfc';
      ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  } else if (e.type === 'boss' && e.variant === 'mech_colossus') {
    // 最终 Boss：熔核机械巨像（双肩重型电浆炮塔 + 八角重装甲壳 + 胸口熔炉核）
    ctx.fillStyle = '#334155';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(s * (r * 0.88) - 9, -r * 0.85, 18, 28, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath(); ctx.arc(s * (r * 0.88), -r * 0.85, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#334155';
    }
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.roundRect(-r * 0.96, -r * 0.92, r * 1.92, r * 1.84, 12); ctx.fill(); ctx.stroke();
    if (!flash) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(0, r * 0.25, r * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  } else if (e.type === 'boss' && e.variant === 'void_weaver') {
    // 最终 Boss：虚空织网主宰（六柄次元镰足 + 虚空光环 + 暗紫魔蛛主躯）
    ctx.strokeStyle = '#e0aaff'; ctx.lineWidth = 3.2;
    for (const s of [-1, 1]) {
      for (let k = -1; k <= 1; k++) {
        const sw = Math.sin(e.phase + k) * 4;
        ctx.beginPath();
        ctx.moveTo(s * r * 0.7, k * 11);
        ctx.lineTo(s * (r + 16), k * 15 + sw);
        ctx.lineTo(s * (r + 8), k * 24 + sw);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = strokeCol; ctx.lineWidth = 2.8;
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#72efdd'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.62, e.phase * 0.5, e.phase * 0.5 + Math.PI * 1.4); ctx.stroke();
    ctx.strokeStyle = strokeCol;
  } else if (e.type === 'mini_boss' && e.variant === 'pyro_lord') {
    // 炽焰重炮统领（双肩烈焰榴弹炮管 + 重装熔火铁躯）
    ctx.fillStyle = '#370617';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(s * r * 0.65 - 6, -r - 8, 12, 18, 3); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.roundRect(-r * 0.95, -r * 0.88, r * 1.9, r * 1.76, 10); ctx.fill(); ctx.stroke();
  } else if (e.type === 'mini_boss' && e.variant === 'shadow_stalker') {
    // 幽影雷刃统领（双臂青电螳螂刀刃 + 流线型暗影甲壳）
    const slashSw = Math.sin(e.phase * 1.8) * 0.22;
    ctx.fillStyle = flash ? '#fff' : '#72efdd';
    for (const s of [-1, 1]) {
      ctx.save(); ctx.rotate(s * slashSw);
      ctx.beginPath();
      ctx.moveTo(s * r * 0.65, -4); ctx.lineTo(s * (r + 16), r * 0.45); ctx.lineTo(s * r * 0.55, r * 1.15);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.12); ctx.lineTo(r * 0.92, 0); ctx.lineTo(0, r * 1.05); ctx.lineTo(-r * 0.92, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (e.type === 'special_boss') {
    // 三大奇遇召唤隐藏首领专属造型
    if (e.variant === 'crimson_lord') {
      // 猩红鲜血伯爵：巨型暗红蝠翼披风 + 伯爵高领魔躯
      const flap = Math.sin(e.phase * 1.4) * 0.2;
      ctx.fillStyle = flash ? '#fff' : '#590d22';
      for (const s of [-1, 1]) {
        ctx.save(); ctx.rotate(s * flap);
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.2); ctx.quadraticCurveTo(s * r * 1.55, -r * 0.95, s * r * 1.42, r * 0.25);
        ctx.lineTo(s * r * 0.85, r * 0.85); ctx.lineTo(0, r * 0.35);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (e.variant === 'golden_golem') {
      // 黄金晶石巨神：璀璨八面黄金巨岩 + 环绕晶石浮游核
      ctx.fillStyle = fill;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        const rad = k % 2 === 0 ? r * 1.08 : r * 0.92;
        if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!flash) {
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath(); ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.45, 0); ctx.lineTo(0, r * 0.55); ctx.lineTo(-r * 0.45, 0); ctx.closePath(); ctx.fill();
      }
    } else {
      // 异次元吞噬者：旋转奇点星环 + 锯齿黑洞巨口
      ctx.strokeStyle = '#72efdd'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.32, r * 0.52, e.phase * 0.3, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = strokeCol; ctx.lineWidth = 2.6;
      ctx.fillStyle = fill;
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = (k * Math.PI) / 8 - e.phase * 0.2;
        const rad = k % 2 === 0 ? r * 1.12 : r * 0.80;
        if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else if (e.type === 'charger') {
    // 犀角冲锋兽：三角破城撞角铲甲 + 前倾象牙犀牛独角 + 喷气背甲（显著区别于甲虫与首领）
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.02);
    ctx.lineTo(r * 1.12, r * 0.45);
    ctx.lineTo(0, r * 1.12);
    ctx.lineTo(-r * 1.12, r * 0.45);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#ffe8a3';
    ctx.beginPath();
    ctx.moveTo(-5, r * 0.55); ctx.lineTo(0, r + 10); ctx.lineTo(5, r * 0.55);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.55, -r * 0.25); ctx.lineTo(s * (r + 6), -r * 0.72); ctx.lineTo(s * r * 0.88, r * 0.12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else {
    // 深渊屠夫虫王 & 狂厄裂地统领：战神披风 + 白骨尖刺肩铠 + 巨颚锯齿螯钳 + 重装魔躯
    if (e.type === 'boss') {
      ctx.fillStyle = flash ? '#fff' : '#590d22';
      ctx.beginPath();
      ctx.moveTo(-r * 0.85, -r * 0.45);
      ctx.lineTo(-r * 1.32, r * 0.82);
      ctx.lineTo(0, r * 0.58);
      ctx.lineTo(r * 1.32, r * 0.82);
      ctx.lineTo(r * 0.85, -r * 0.45);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = flash ? '#fff' : '#ffd166';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.48, -r * 0.58);
      ctx.quadraticCurveTo(s * r * 1.44, -r * 1.30, s * r * 0.98, -r * 0.12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    const pinch = Math.sin(e.phase * 1.5) * 0.16;
    ctx.fillStyle = flash ? '#fff' : '#2b2d42';
    for (const s of [-1, 1]) {
      ctx.save(); ctx.rotate(s * pinch);
      ctx.beginPath();
      ctx.moveTo(s * r * 0.75, r * 0.15);
      ctx.quadraticCurveTo(s * r * 1.42, r * 0.68, s * r * 0.56, r * 1.24);
      ctx.lineTo(s * r * 0.42, r * 0.72);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.05);
    ctx.lineTo(r * 1.04, -r * 0.28);
    ctx.lineTo(r * 0.88, r * 0.88);
    ctx.lineTo(0, r * 1.06);
    ctx.lineTo(-r * 0.88, r * 0.88);
    ctx.lineTo(-r * 1.04, -r * 0.28);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * r * 0.38, r * 0.48); ctx.lineTo(s * r * 0.56, r * 0.92); ctx.lineTo(s * r * 0.18, r * 0.62); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  // ❄️ 冰冻禁锢状态：包裹怪物的半透明六角玄冰棱晶；普通冰缓则为清透霜层
  if (e.freezeT > 0 && !flash) {
    ctx.fillStyle = 'rgba(114, 239, 221, 0.40)';
    ctx.strokeStyle = '#e0fbfc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const ia = (k * Math.PI) / 3 - Math.PI / 6;
      const ir = r * 1.18;
      if (k === 0) ctx.moveTo(Math.cos(ia) * ir, Math.sin(ia) * ir);
      else ctx.lineTo(Math.cos(ia) * ir, Math.sin(ia) * ir);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.65); ctx.lineTo(r * 0.45, r * 0.55);
    ctx.stroke();
    ctx.strokeStyle = strokeCol;
  } else if (e.chillT > 0 && !flash) {
    ctx.fillStyle = 'rgba(114, 239, 221, 0.26)';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
  }

  // 五官：独眼巨兽 / 黑曜泰坦 / 异星竖瞳与怒眉
  if (e.type === 'brute' || e.type === 'juggernaut' || (e.type === 'special_boss' && e.variant === 'abyss_devourer')) {
    ctx.fillStyle = e.type === 'juggernaut' ? '#ff9f1c' : '#ffd166';
    ctx.beginPath(); ctx.arc(0, -3, e.type === 'special_boss' ? 11 : (e.type === 'juggernaut' ? 9.5 : 8.5), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d90429';
    ctx.beginPath(); ctx.arc(0, -3, e.type === 'special_boss' ? 5 : 4.0, 0, Math.PI * 2); ctx.fill();
  } else if (e.type !== 'sand_worm') {
    const eyeCol = e.mythicPhase2 ? '#ff2a55' : ((e.type === 'boss' || e.type === 'mini_boss' || e.type === 'special_boss' || e.type === 'summoner') ? '#ffd166' : (e.type === 'chaser' ? '#fff3b0' : '#15111c'));
    const er = Math.max(2.2, r * 0.17);
    ctx.fillStyle = eyeCol;
    ctx.beginPath();
    ctx.arc(-r * 0.33, -r * 0.12, er, 0, Math.PI * 2);
    ctx.arc(r * 0.33, -r * 0.12, er, 0, Math.PI * 2);
    ctx.fill();
    if (eyeCol !== '#15111c') {
      ctx.fillStyle = e.mythicPhase2 ? '#ffd166' : '#15111c';
      ctx.beginPath();
      ctx.arc(-r * 0.33, -r * 0.12, er * 0.48, 0, Math.PI * 2);
      ctx.arc(r * 0.33, -r * 0.12, er * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (e.type === 'boss' || e.type === 'special_boss') {
    ctx.fillStyle = e.mythicPhase2 ? '#ffd166' : (e.variant === 'frost_queen' ? '#e0fbfc' : (e.variant === 'crimson_lord' ? '#ff4d6d' : '#ffd166'));
    ctx.beginPath();
    ctx.moveTo(-16, -r + 3); ctx.lineTo(-22, -r - 17); ctx.lineTo(-7, -r - 6);
    ctx.lineTo(0, -r - 21); ctx.lineTo(7, -r - 6); ctx.lineTo(22, -r - 17); ctx.lineTo(16, -r + 3);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // 🔥 灼烧状态：头顶双色跳动烈焰火舌
  if (e.burnT > 0) {
    const flk = Math.sin(now * 0.028 + e.phase) * 2.8;
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.moveTo(-6, -r * 0.55); ctx.quadraticCurveTo(-2, -r - 12 + flk, 2, -r * 0.55);
    ctx.moveTo(1, -r * 0.45); ctx.quadraticCurveTo(6, -r - 10 - flk, 8, -r * 0.45);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-4, -r * 0.55); ctx.quadraticCurveTo(-2, -r - 7 + flk * 0.5, 0, -r * 0.55);
    ctx.fill();
  }

  // ☠️ 剧毒状态：升腾翠绿毒液气泡
  if (e.poisonT > 0 && e.poisonStacks > 0) {
    const pb1 = ((now * 0.03 + e.phase * 5) % 14);
    const pb2 = ((now * 0.03 + e.phase * 5 + 7) % 14);
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(-r * 0.42, -r * 0.35 - pb1, 3.0, 0, Math.PI * 2);
    ctx.arc(r * 0.44, -r * 0.20 - pb2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if (e.type === 'shielder') {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.strokeStyle = '#90e0ef'; ctx.lineWidth = 6.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r + 5, e.faceA - 0.88, e.faceA + 0.88); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(0, 0, r + 5, e.faceA - 0.76, e.faceA + 0.76); ctx.stroke();
    ctx.restore();
  }

  // 首领破绽角标 & 高层剧毒层数徽标
  if (e.exposeT > 0 && (e.type === 'boss' || e.type === 'special_boss')) {
    ctx.font = '800 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('💥破绽易伤', e.x, e.y + r + 20);
  }
  if (e.poisonT > 0 && e.poisonStacks >= 2 && (e.type === 'boss' || e.type === 'special_boss' || e.type === 'mini_boss' || e.elite)) {
    ctx.font = '800 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a3e635';
    ctx.fillText(`☠️×${e.poisonStacks}`, e.x, e.y - r - 22);
  }

  if (e.type !== 'boss' && e.type !== 'mini_boss' && e.type !== 'special_boss' && (e.type === 'brute' || e.type === 'juggernaut' || e.elite || e.hp < e.maxHp)) {
    const bw = Math.max(24, r * 1.8);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(e.x - bw / 2, e.y - r - 13, bw, 5);
    ctx.fillStyle = e.freezeT > 0 ? '#72efdd' : (e.poisonStacks > 0 ? '#a3e635' : (e.burnT > 0 ? '#ff9f1c' : (e.elite ? '#ffd166' : '#ff4d6d')));
    ctx.fillRect(e.x - bw / 2 + 1, e.y - r - 12, (bw - 2) * Math.max(0, e.hp / e.maxHp), 3);
  }
}

function pyOffset(a, r) {
  return Math.sin(a) > 0 ? Math.sin(a) * r * 0.08 : 0;
}

// 8 位土豆英雄专属造型 + 已购被动装备可视化饰品穿戴系统（皇冠、蝠翼、军靴、护甲、瞄具、头巾、聚变核、浮游元素球等）
function drawPotatoHero() {
  const p = player;
  const it = p.items || {};
  const now = performance.now();
  const bounce = p.moving ? Math.abs(Math.sin(p.walkT)) * 4 : Math.sin(now * 0.004) * 1.5;
  const tilt = p.moving ? Math.sin(p.walkT) * 0.09 : 0;

  // 战术攻击范围索敌圈（虚线光环实时呈现当前最大武器/震荡波射程边界）
  const dispR = Math.max(55, p._displayRange || 140);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 232, 163, 0.13)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([9, 9]);
  ctx.beginPath(); ctx.arc(p.x, p.y, dispR, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 拾取磁力圈（装备超导磁铁后呈淡蓝磁暴环）
  ctx.strokeStyle = it.magnet ? 'rgba(76, 201, 240, 0.13)' : 'rgba(122, 229, 130, 0.08)';
  ctx.lineWidth = it.magnet ? 1.8 : 1.5;
  ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(16, p.magnet || 100), 0, Math.PI * 2); ctx.stroke();

  // 狂战双刃斧猩红斗气底座
  if (it.berserk) {
    ctx.fillStyle = 'rgba(255, 59, 107, 0.16)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 18, 25 + Math.sin(now * 0.012) * 3, 10, 0, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 22, 18, 7, 0, 0, Math.PI * 2); ctx.fill();

  // 脚部（穿戴【战术军靴】后升级为红银疾风战靴！）
  const legSwing = p.moving ? Math.sin(p.walkT) * 6 : 0;
  if (it.boots) {
    ctx.fillStyle = '#e63946'; ctx.strokeStyle = '#1d1422'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x - 8, p.y + 19 + legSwing * 0.5, 5.8, 6.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(p.x + 8, p.y + 19 - legSwing * 0.5, 5.8, 6.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(p.x - 12, p.y + 16 + legSwing * 0.5, 4, 2.5);
    ctx.fillRect(p.x + 8, p.y + 16 - legSwing * 0.5, 4, 2.5);
  } else if (p.cls !== 'ghost') {
    ctx.fillStyle = '#4a3219';
    ctx.beginPath();
    ctx.ellipse(p.x - 8, p.y + 19 + legSwing * 0.5, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x + 8, p.y + 19 - legSwing * 0.5, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(p.x, p.y - bounce);
  ctx.rotate(tilt);
  if (p.cls === 'ghost') ctx.globalAlpha = 0.85;

  // 背部饰品：【吸血蝠翼】或【幻影蝴蝶】翅膀
  if (it.bat || it.butterfly) {
    const flap = Math.sin(now * 0.012) * 0.28;
    ctx.fillStyle = it.butterfly && !it.bat ? '#4cc9f0' : '#3c096c';
    ctx.strokeStyle = '#14081e'; ctx.lineWidth = 2.2;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 14, -2);
      ctx.rotate(s * flap);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 16, -14, s * 22, -2);
      ctx.quadraticCurveTo(s * 15, 2, s * 14, 9);
      ctx.quadraticCurveTo(s * 7, 4, 0, 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // 吸血伯爵红黑披风 / 鹰眼游侠翠金披风
  if (p.cls === 'vampire' || it.sniper_cloak) {
    ctx.fillStyle = p.cls === 'vampire' ? '#6a040f' : '#2d6a4f';
    ctx.strokeStyle = '#1b090c'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-19, -12); ctx.lineTo(-14, -19); ctx.lineTo(14, -19); ctx.lineTo(19, -12);
    ctx.lineTo(26, 19); ctx.lineTo(-26, 19); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  // 幽灵土豆灵体飘摆下摆
  if (p.cls === 'ghost') {
    const gw = Math.sin(now * 0.01) * 3;
    ctx.fillStyle = '#90c2db'; ctx.strokeStyle = '#26180d'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, 10); ctx.lineTo(-18 + gw, 25); ctx.lineTo(-6, 19);
    ctx.lineTo(0 + gw * 0.5, 26); ctx.lineTo(7, 19); ctx.lineTo(18 + gw, 25); ctx.lineTo(16, 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // 3D 预烘焙立体土豆本体贴图
  const hurtFlash = p.invuln > 0 && Math.floor(p.invuln * 22) % 2 === 0;
  const tex = hurtFlash ? potatoTex.hurt : (p.cls === 'ghost' ? potatoTex.ghost : potatoTex.normal);
  const bodyW = p.cls === 'bull' ? 72 : 64;
  ctx.drawImage(tex, -bodyW * 0.5, -32, bodyW, 64);

  // 【荆棘铁甲 / 刺猬甲刺】两侧反伤尖刺肩甲
  if (it.thorns || it.hedgehog) {
    ctx.fillStyle = it.thorns ? '#a3e635' : '#cbd5e1';
    ctx.strokeStyle = '#1d1e2c'; ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 16, -2); ctx.lineTo(s * 26, -8); ctx.lineTo(s * 18, 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  // 躯干装备饰品：【合金护板】装甲胸带 + 肩甲
  if (it.plate) {
    ctx.fillStyle = '#8d99ae'; ctx.strokeStyle = '#1d1e2c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-18, 9, 36, 7, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#edf2f4';
    ctx.beginPath(); ctx.arc(-10, 12.5, 1.6, 0, Math.PI * 2); ctx.arc(0, 12.5, 2.2, 0, Math.PI * 2); ctx.arc(10, 12.5, 1.6, 0, Math.PI * 2); ctx.fill();
  }

  // 【穿甲头巾】赤红战术围巾与飘带
  if (it.bandana) {
    const sw = Math.sin(now * 0.014) * 3;
    ctx.fillStyle = '#d90429'; ctx.strokeStyle = '#220910'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, 8); ctx.quadraticCurveTo(0, 15, 16, 8);
    ctx.lineTo(13, 14); ctx.quadraticCurveTo(0, 20, -13, 14); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(11, 11); ctx.lineTo(22, 16 + sw); ctx.lineTo(17, 21 + sw); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  // 【聚变反应堆】胸口璀璨金青反应炉核心
  if (it.reactor) {
    ctx.fillStyle = '#ffd166'; ctx.strokeStyle = '#26180d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 13, 6.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#72efdd';
    ctx.beginPath(); ctx.arc(0, 13, 3.2, 0, Math.PI * 2); ctx.fill();
  } else if (it.medkit || it.worm) {
    // 【纳米血包】胸前翠绿生命徽章
    ctx.fillStyle = '#52b788';
    ctx.fillRect(-1.8, 10, 3.6, 8); ctx.fillRect(-4, 12.2, 8, 3.6);
  }

  // 8 大职业标志性装扮
  ctx.strokeStyle = '#26180d'; ctx.lineWidth = 2.4;
  if (p.cls === 'allrounder') {
    ctx.fillStyle = '#ef233c';
    ctx.beginPath();
    ctx.moveTo(-17 * p.faceDir, -11);
    ctx.quadraticCurveTo(-30 * p.faceDir, -15 + Math.sin(now * 0.015) * 5, -36 * p.faceDir, -4);
    ctx.lineTo(-28 * p.faceDir, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(-19, -14, 38, 6); ctx.strokeRect(-19, -14, 38, 6);
  } else if (p.cls === 'ranger') {
    ctx.fillStyle = '#3a5a40';
    ctx.beginPath(); ctx.ellipse(2, -19, 17, 6.5, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b2d42'; ctx.fillRect(-19, -13, 38, 4.5);
    ctx.fillStyle = '#4cc9f0';
    ctx.beginPath(); ctx.roundRect(-14, -15, 12, 8.5, 3); ctx.roundRect(2, -15, 12, 8.5, 3); ctx.fill(); ctx.stroke();
  } else if (p.cls === 'brawler') {
    ctx.fillStyle = '#d90429';
    ctx.fillRect(-19, -15, 38, 5.5); ctx.strokeRect(-19, -15, 38, 5.5);
    ctx.strokeStyle = '#9b2226'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(7, -12); ctx.lineTo(12, -4); ctx.stroke();
    // 狂拳土豆标志性红色拳击手套！
    const jab = Math.sin(now * 0.014) * 3;
    ctx.fillStyle = '#e63946'; ctx.strokeStyle = '#26180d'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(-22, 4 + jab, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(22, 4 - jab, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (p.cls === 'engineer') {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, -11, 18.5, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(-21, -12, 42, 4.5); ctx.strokeRect(-21, -12, 42, 4.5);
    ctx.fillStyle = '#4cc9f0';
    ctx.beginPath(); ctx.roundRect(-11, -20, 9, 5.5, 2); ctx.roundRect(2, -20, 9, 5.5, 2); ctx.fill(); ctx.stroke();
  } else if (p.cls === 'multitasker') {
    ctx.strokeStyle = '#c77dff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-7, -21); ctx.lineTo(-13, -32); ctx.moveTo(7, -21); ctx.lineTo(13, -32); ctx.stroke();
    ctx.fillStyle = '#e0aaff'; ctx.strokeStyle = '#26180d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-13, -32, 4.5, 0, Math.PI * 2); ctx.arc(13, -32, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (p.cls === 'bull') {
    ctx.fillStyle = '#ffd166';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 14, -14); ctx.quadraticCurveTo(s * 31, -29, s * 25, -5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.arc(0, 9, 4.8, 0, Math.PI * 2); ctx.stroke();
  }

  // 眼神与表情
  const ex = Math.cos(p.lookA) * 2, ey = Math.sin(p.lookA) * 2;
  if (p.cls !== 'ranger') {
    ctx.fillStyle = p.cls === 'vampire' ? '#ffccd5' : '#fff';
    ctx.strokeStyle = '#26180d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-6.5, -2, 5, 0, Math.PI * 2); ctx.arc(6.5, -2, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = (p.cls === 'vampire' || it.berserk) ? '#d90429' : '#18110b';
    ctx.beginPath(); ctx.arc(-6.5 + ex, -2 + ey, 2.5, 0, Math.PI * 2); ctx.arc(6.5 + ex, -2 + ey, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // 【瞄准眼镜】金边双镜框
  if (it.glasses && p.cls !== 'ranger') {
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-6.5, -2, 6.2, 0, Math.PI * 2);
    ctx.moveTo(-0.3, -2); ctx.lineTo(0.3, -2);
    ctx.arc(6.5, -2, 6.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 【战术瞄具】右眼红点全息狙击单镜
  if (it.scope) {
    ctx.fillStyle = 'rgba(255, 59, 107, 0.48)';
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(6.5, -2, 6.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(3, -2); ctx.lineTo(10, -2); ctx.moveTo(6.5, -5.5); ctx.lineTo(6.5, 1.5); ctx.stroke();
  }

  // 狂战怒眉
  if (it.berserk) {
    ctx.strokeStyle = '#ef233c'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(-3, -5); ctx.moveTo(12, -8); ctx.lineTo(3, -5); ctx.stroke();
  }

  ctx.strokeStyle = '#26180d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-4, 7); ctx.quadraticCurveTo(0, 5, 4, 7); ctx.stroke();
  if (p.cls === 'vampire') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-4, 7); ctx.lineTo(-2.5, 11); ctx.lineTo(-1, 7); ctx.moveTo(1, 7); ctx.lineTo(2.5, 11); ctx.lineTo(4, 7); ctx.fill();
  }

  // 头顶饰品：【黄金理财冠】与【幸运四叶草】
  if (it.crown) {
    const cy = p.cls === 'engineer' ? -25 : -22;
    ctx.fillStyle = '#ffd166'; ctx.strokeStyle = '#26180d'; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-11, cy); ctx.lineTo(-13, cy - 11); ctx.lineTo(-5, cy - 5);
    ctx.lineTo(0, cy - 13); ctx.lineTo(5, cy - 5); ctx.lineTo(13, cy - 11); ctx.lineTo(11, cy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ef233c';
    ctx.beginPath(); ctx.arc(0, cy - 4, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  if (it.clover) {
    const lx = it.crown ? 14 : 0, ly = -24;
    ctx.strokeStyle = '#2d6a4f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, ly + 4); ctx.quadraticCurveTo(lx + 2, ly - 3, lx + 4, ly - 5); ctx.stroke();
    ctx.fillStyle = '#52b788';
    for (let k = 0; k < 4; k++) {
      const ca = k * Math.PI * 0.5 + 0.4;
      ctx.beginPath(); ctx.arc(lx + 4 + Math.cos(ca) * 3.4, ly - 5 + Math.sin(ca) * 3.4, 2.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();

  // 偏导能量护盾罩（半透明青色护盾泡 + 旋转能量弧片）
  if (p.shield > 0) {
    const sr = p.r + 10;
    ctx.fillStyle = p.shieldHitT > 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(114, 239, 221, 0.10)';
    ctx.beginPath(); ctx.arc(p.x, p.y - 2, sr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = p.shieldHitT > 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(114, 239, 221, 0.65)';
    ctx.lineWidth = p.shieldHitT > 0 ? 3.2 : 2.1;
    for (let k = 0; k < 3; k++) {
      const sa = now * 0.0025 + (k * Math.PI * 2) / 3;
      ctx.beginPath(); ctx.arc(p.x, p.y - 2, sr, sa, sa + 1.55); ctx.stroke();
    }
  }

  // 环绕浮游元素/科技球（特斯拉电球、烈焰汽油核、液氮/寒冰棱晶、剧毒腺体球、跳弹棱镜、幽灵魂火）
  const orbs = [];
  if (p.teslaCount > 0) orbs.push({ col: '#72efdd', kind: 'tesla' });
  if (it.napalm || it.warhead) orbs.push({ col: '#ff9f1c', kind: 'fire' });
  if (it.cryo || it.frost_prism) orbs.push({ col: '#4cc9f0', kind: 'ice' });
  if (it.venom_gland || it.plague_flask) orbs.push({ col: '#a3e635', kind: 'venom' });
  if (it.prism || it.cyberball || it.doom_edge) orbs.push({ col: '#c77dff', kind: 'prism' });
  if (p.cls === 'ghost') orbs.push({ col: '#e0fbfc', kind: 'wisp' });

  for (let i = 0; i < orbs.length; i++) {
    const ob = orbs[i];
    const oa = now * 0.0032 + (i * Math.PI * 2) / orbs.length;
    const ox = p.x + Math.cos(oa) * 31, oy = p.y - 6 + Math.sin(oa) * 22;
    ctx.fillStyle = ob.col; ctx.strokeStyle = '#14101a'; ctx.lineWidth = 1.8;
    if (ob.kind === 'ice' || ob.kind === 'prism') {
      ctx.beginPath();
      ctx.moveTo(ox, oy - 6); ctx.lineTo(ox + 5, oy); ctx.lineTo(ox, oy + 6); ctx.lineTo(ox - 5, oy);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(ox, oy, 5.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (ob.kind === 'tesla') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(ox - 6, oy - 3); ctx.lineTo(ox, oy - 7); ctx.lineTo(ox + 6, oy + 3); ctx.stroke();
      }
    }
  }

  // 最后 5 秒英雄头顶同步浮现醒目读秒徽标（手机盯屏幕中央走位时余光也能第一时间感知回合结束！）
  if (state === 'wave' && !overtime && waveTime > 0 && waveTime <= 5) {
    const sec = Math.ceil(waveTime);
    const pulse = 1 + Math.sin(now * 0.018) * 0.08;
    ctx.save();
    ctx.translate(p.x, p.y - 52);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(28, 10, 20, 0.82)';
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-26, -13, 52, 24, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe8a3';
    ctx.font = '900 15px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${sec}s`, 0, 4.5);
    ctx.restore();
  }
}

// 7 大首领（4 大终局魔王 + 3 大奇遇召唤霸主）全屏静止登场演出专属精细半身立绘
function drawBossPortrait(variant, cx, cy, scale, isMythic) {
  const now = performance.now();
  const s = scale || 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 神话二阶段背后的六翼金红神辉与旋转圣印（零渐变纯几何绘制）
  if (isMythic) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.22)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.4;
    for (const dir of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.moveTo(0, 6 - w * 10);
        ctx.lineTo(dir * (102 - w * 12), -56 + w * 26);
        ctx.lineTo(dir * (76 - w * 10), -18 + w * 28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  // 立绘底层徽章法阵底座
  const ringCol = isMythic ? '#ffd166' : (variant === 'frost_queen' ? '#72efdd' : (variant === 'mech_colossus' ? '#ff9f1c' : (variant === 'void_weaver' || variant === 'abyss_devourer' ? '#c77dff' : (variant === 'golden_golem' ? '#ffd166' : '#ff3b6b'))));
  ctx.fillStyle = 'rgba(14, 9, 26, 0.92)';
  ctx.strokeStyle = ringCol;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.rotate(now * 0.0012);
  ctx.strokeStyle = isMythic ? '#ff4d6d' : 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, 65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = '#120b1d';
  ctx.lineWidth = 3.2;

  if (variant === 'frost_queen') {
    // 极寒霜晶女皇半身立绘：六棱冰晶翼冠 + 优雅银白披肩 + 寒霜女皇面庞与冰蓝菱瞳
    ctx.fillStyle = '#48cae4';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(dir * 66, -30);
      ctx.lineTo(dir * 52, 18);
      ctx.lineTo(dir * 60, 48);
      ctx.lineTo(0, 56);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    // 礼裙高领披肩
    ctx.fillStyle = '#0077b6';
    ctx.beginPath();
    ctx.moveTo(-42, 62); ctx.lineTo(-26, 12); ctx.lineTo(0, 24); ctx.lineTo(26, 12); ctx.lineTo(42, 62);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 冰晶银发与面庞
    ctx.fillStyle = '#caf0f8';
    ctx.beginPath();
    ctx.moveTo(-30, -8); ctx.quadraticCurveTo(0, -44, 30, -8);
    ctx.lineTo(36, 36); ctx.lineTo(18, 22); ctx.lineTo(-18, 22); ctx.lineTo(-36, 36);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0fbfc';
    ctx.beginPath();
    ctx.moveTo(-20, -10); ctx.quadraticCurveTo(-20, 18, 0, 24); ctx.quadraticCurveTo(20, 18, 20, -10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 女皇冰冠
    ctx.fillStyle = isMythic ? '#ffd166' : '#72efdd';
    ctx.beginPath();
    ctx.moveTo(-24, -12); ctx.lineTo(-30, -42); ctx.lineTo(-11, -24);
    ctx.lineTo(0, -54); ctx.lineTo(11, -24); ctx.lineTo(30, -42); ctx.lineTo(24, -12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 双眸与额心冰钻
    ctx.fillStyle = isMythic ? '#ff2a55' : '#00b4d8';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 4, 2); ctx.lineTo(dir * 13, -1); ctx.lineTo(dir * 15, 4); ctx.lineTo(dir * 6, 6);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(4, -15); ctx.lineTo(0, -8); ctx.lineTo(-4, -15); ctx.closePath(); ctx.fill();
  } else if (variant === 'mech_colossus') {
    // 熔核机械巨像半身立绘：双肩重型火神炮舱 + 重装泰坦胸甲 + 炽热T型战术目镜 + 熔炉核心
    ctx.fillStyle = '#334155';
    for (const dir of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(dir * 38 - 16, -46, 32, 46, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath(); ctx.arc(dir * 38, -32, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(dir * 38, -14, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#334155';
    }
    // 巨像胸甲与头盔
    ctx.fillStyle = '#fb5607';
    ctx.beginPath();
    ctx.moveTo(-48, 56); ctx.lineTo(-54, 4); ctx.lineTo(-28, -22); ctx.lineTo(28, -22); ctx.lineTo(54, 4); ctx.lineTo(48, 56);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.roundRect(-26, -38, 52, 38, 8); ctx.fill(); ctx.stroke();
    // 炽热目镜与胸口聚变熔炉
    ctx.fillStyle = isMythic ? '#ff2a55' : '#ffd166';
    ctx.beginPath(); ctx.roundRect(-19, -24, 38, 9, 3); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, 24, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 24, 7, 0, Math.PI * 2); ctx.fill();
  } else if (variant === 'void_weaver') {
    // 虚空织网主宰半身立绘：六道次元裂空镰刃 + 暗影魔导师兜帽 + 深渊竖瞳群
    ctx.fillStyle = '#72efdd';
    for (const dir of [-1, 1]) {
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(dir * 22, k * 14);
        ctx.lineTo(dir * 72, k * 24 - 14);
        ctx.lineTo(dir * 52, k * 24 + 4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    ctx.fillStyle = '#3c096c';
    ctx.beginPath();
    ctx.moveTo(0, -52); ctx.quadraticCurveTo(46, -24, 44, 58); ctx.lineTo(-44, 58); ctx.quadraticCurveTo(-46, -24, 0, -52);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#10002b';
    ctx.beginPath(); ctx.arc(0, -2, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // 主竖瞳 + 四枚副魔眼
    ctx.fillStyle = isMythic ? '#ffd166' : '#e0aaff';
    ctx.beginPath(); ctx.ellipse(0, -4, 8, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2a55';
    ctx.beginPath(); ctx.ellipse(0, -4, 3, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#72efdd';
    for (const dir of [-1, 1]) {
      ctx.beginPath(); ctx.arc(dir * 14, -10, 3.5, 0, Math.PI * 2); ctx.arc(dir * 13, 5, 3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (variant === 'crimson_lord') {
    // 猩红鲜血伯爵半身立绘：暗红恶魔蝠翼 + 贵族高领礼装 + 银发血瞳与獠牙
    ctx.fillStyle = '#590d22';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 8); ctx.quadraticCurveTo(dir * 74, -46, dir * 68, 14);
      ctx.lineTo(dir * 42, 46); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#800f2f';
    ctx.beginPath();
    ctx.moveTo(-44, 58); ctx.lineTo(-34, -14); ctx.lineTo(0, 16); ctx.lineTo(34, -14); ctx.lineTo(44, 58);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8edeb';
    ctx.beginPath();
    ctx.moveTo(-21, -12); ctx.quadraticCurveTo(-20, 18, 0, 24); ctx.quadraticCurveTo(20, 18, 21, -12);
    ctx.quadraticCurveTo(0, -34, -21, -12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 银白伯爵长发与血冠
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-25, -8); ctx.quadraticCurveTo(0, -44, 25, -8); ctx.lineTo(18, -18); ctx.lineTo(0, -10); ctx.lineTo(-18, -18);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff2a55';
    for (const dir of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(dir * 9, 1, 5, 3.2, dir * 0.15, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-16, -24); ctx.lineTo(-20, -44); ctx.lineTo(-6, -32); ctx.lineTo(0, -48); ctx.lineTo(6, -32); ctx.lineTo(20, -44); ctx.lineTo(16, -24);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (variant === 'golden_golem') {
    // 黄金晶石巨神半身立绘：悬浮耀金浮游晶柱 + 八棱神圣巨岩躯干 + 璀璨金钻圣核
    ctx.fillStyle = '#ffd166';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 52, -36); ctx.lineTo(dir * 64, -12); ctx.lineTo(dir * 52, 16); ctx.lineTo(dir * 40, -12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-28, -42); ctx.lineTo(28, -42); ctx.lineTo(48, 0); ctx.lineTo(36, 56); ctx.lineTo(-36, 56); ctx.lineTo(-48, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.moveTo(0, -24); ctx.lineTo(20, 4); ctx.lineTo(0, 32); ctx.lineTo(-20, 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = isMythic ? '#ff2a55' : '#3a0ca3';
    ctx.beginPath(); ctx.roundRect(-20, -22, 40, 8, 3); ctx.fill();
  } else if (variant === 'abyss_devourer') {
    // 异次元吞噬者半身立绘：双交叉星环 + 锯齿黑洞深渊口器 + 奇点邪眼
    ctx.strokeStyle = '#72efdd'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 68, 24, 0.35, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.ellipse(0, 0, 68, 24, -0.35, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#120b1d'; ctx.lineWidth = 3.2;
    ctx.fillStyle = '#7b2cbf';
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = (k * Math.PI) / 8;
      const rad = k % 2 === 0 ? 52 : 35;
      if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d90429';
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 13, 0, 0, Math.PI * 2); ctx.fill();
  } else if (variant === 'vanguard') {
    // 狂厄裂地统领半身立绘：重型黑铁牛角肩甲 + 猩红十字战盔 + 破城战戟纹章
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-52, 56); ctx.lineTo(-46, -6); ctx.lineTo(46, -6); ctx.lineTo(52, 56);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f72585';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 20, -18); ctx.quadraticCurveTo(dir * 62, -52, dir * 48, 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-26, -36); ctx.lineTo(26, -36); ctx.lineTo(32, 24); ctx.lineTo(0, 40); ctx.lineTo(-32, 24);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = isMythic ? '#ffd166' : '#ff2a55';
    ctx.fillRect(-18, -14, 36, 8);
    ctx.fillRect(-4, -22, 8, 38);
  } else if (variant === 'pyro_lord') {
    // 灾厄熔火统领半身立绘：喷涌熔岩双肩火口 + 黑曜魔龙角冠 + 炽金熔核胸腔
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.moveTo(-50, 56); ctx.lineTo(-42, -8); ctx.lineTo(42, -8); ctx.lineTo(50, 56);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9f1c';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 24, -22); ctx.lineTo(dir * 46, -54); ctx.lineTo(dir * 38, -6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#fb5607';
    ctx.beginPath(); ctx.arc(0, -4, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    for (const dir of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(dir * 5, -6); ctx.lineTo(dir * 18, -12); ctx.lineTo(dir * 14, 2); ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 26, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (variant === 'shadow_stalker') {
    // 幽影瞬杀虫皇半身立绘：双柄翡翠斩舰镰刀 + 夜影刺客面甲 + 幽绿复眼
    ctx.fillStyle = '#06d6a0';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 20, 8); ctx.lineTo(dir * 68, -36); ctx.lineTo(dir * 54, 22);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, -46); ctx.lineTo(38, 54); ctx.lineTo(-38, 54);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.moveTo(-22, -24); ctx.lineTo(0, -38); ctx.lineTo(22, -24); ctx.lineTo(16, 18); ctx.lineTo(0, 28); ctx.lineTo(-16, 18);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = isMythic ? '#ffd166' : '#5ef29b';
    for (const dir of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(dir * 4, -4); ctx.lineTo(dir * 16, -10); ctx.lineTo(dir * 14, 0); ctx.closePath(); ctx.fill();
    }
  } else {
    // 深渊屠夫虫王半身立绘：狰狞双弯金角 + 白骨尖刺重肩甲 + 巨型锯齿捕食颚 + 猩红四魔眼
    ctx.fillStyle = '#590d22';
    ctx.beginPath();
    ctx.moveTo(-56, 56); ctx.lineTo(-48, -8); ctx.lineTo(48, -8); ctx.lineTo(56, 56);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 18, -22); ctx.quadraticCurveTo(dir * 68, -62, dir * 52, 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#ff3b6b';
    ctx.beginPath();
    ctx.moveTo(0, -40); ctx.lineTo(38, -10); ctx.lineTo(32, 38); ctx.lineTo(0, 48); ctx.lineTo(-32, 38); ctx.lineTo(-38, -10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 锯齿巨螯与獠牙
    ctx.fillStyle = '#f8f9fa';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 14, 18); ctx.lineTo(dir * 30, 52); ctx.lineTo(dir * 6, 34);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#ffd166';
    for (const dir of [-1, 1]) {
      ctx.beginPath(); ctx.arc(dir * 14, -4, 6.5, 0, Math.PI * 2); ctx.arc(dir * 22, -14, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#15111c';
      ctx.beginPath(); ctx.arc(dir * 14, -4, 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166';
    }
  }

  ctx.restore();
}
