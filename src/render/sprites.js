// ============================================================================
// 🎨 《烬塔残响：第999次救赎》极速精灵渲染管线（角色 / 分层域怪物 / 场景器物 / 兵装 / 立绘特写）
// 彻底删除原版土豆椭圆躯干、异星甲虫矢量与蘑菇树，100% 替换为预烘焙高清透明 Q 版贴图！
// ============================================================================

let _frameNow = 0;
function _syncNow() {
  return _frameNow || performance.now();
}

// 32 把守誓兵装高精矢量原画离线烘焙管线（192×192 超采样金属渐变 + 墨线描边 + 血槽/铭文/瞄具 + 5阶神话进化圣徽，彻底告别像素/色块感）
const _weaponSpriteCache = new Map();
const _weaponDataUrlCache = new Map();

function _wpnGrad(g, x0, y0, x1, y1, c0, c1, c2) {
  const grd = g.createLinearGradient(x0, y0, x1, y1);
  grd.addColorStop(0, c0);
  if (c2) {
    grd.addColorStop(0.5, c1);
    grd.addColorStop(1, c2);
  } else {
    grd.addColorStop(1, c1);
  }
  return grd;
}

function _wpnSpark(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x, y - r);
  g.lineTo(x + r * 0.28, y - r * 0.28);
  g.lineTo(x + r, y);
  g.lineTo(x + r * 0.28, y + r * 0.28);
  g.lineTo(x, y + r);
  g.lineTo(x - r * 0.28, y + r * 0.28);
  g.lineTo(x - r, y);
  g.lineTo(x - r * 0.28, y - r * 0.28);
  g.closePath();
  g.fill();
}

function _wpnWrapGrip(g, x, y, w, h, baseDark, baseLight, bandCol) {
  g.fillStyle = _wpnGrad(g, x, y, x, y + h, baseLight, baseDark);
  g.beginPath(); g.roundRect(x, y, w, h, Math.min(3, h * 0.42)); g.fill(); g.stroke();
  g.strokeStyle = bandCol || 'rgba(246,211,121,0.55)';
  g.lineWidth = 1.05;
  const step = Math.max(3.2, w / 4.2);
  for (let gx = x + 2.2; gx < x + w - 1.8; gx += step) {
    g.beginPath(); g.moveTo(gx, y + 0.8); g.lineTo(gx + 1.8, y + h - 0.8); g.stroke();
  }
  g.strokeStyle = '#090710';
  g.lineWidth = 1.65;
}

function _resolveEvoColor(id, tier, evoId) {
  if (evoId && typeof WEAPONS !== 'undefined' && WEAPONS[id] && Array.isArray(WEAPONS[id].evos)) {
    for (let i = 0; i < WEAPONS[id].evos.length; i++) {
      if (WEAPONS[id].evos[i].id === evoId) return WEAPONS[id].evos[i].color || '#ff5c8a';
    }
  }
  if (tier >= 5) return '#ff5c8a';
  return (typeof TIER_COLORS !== 'undefined' && TIER_COLORS[tier]) ? TIER_COLORS[tier] : '#cbd5e1';
}

function _drawMythicCrest(g, accent, isEvo) {
  g.save();
  // 外层黑曜圣环与双翼残响纹章（纯线性渐变与多边形，0 radialGradient / 0 shadowBlur）
  g.globalAlpha = isEvo ? 0.26 : 0.18;
  g.fillStyle = accent;
  g.beginPath(); g.ellipse(3, 0, 30, 17, 0, 0, Math.PI * 2); g.fill();
  g.globalAlpha = isEvo ? 0.72 : 0.48;
  g.strokeStyle = accent;
  g.lineWidth = 1.25;
  g.beginPath(); g.arc(2, 0, 21, -Math.PI * 0.78, Math.PI * 0.78); g.stroke();
  g.strokeStyle = '#fff3c4';
  g.lineWidth = 0.8;
  g.beginPath(); g.arc(2, 0, 17.5, -Math.PI * 0.55, Math.PI * 0.55); g.stroke();
  if (isEvo) {
    g.fillStyle = _wpnGrad(g, -18, -16, 12, 16, '#fff8dc', accent, '#3b0764');
    for (const sy of [-1, 1]) {
      g.beginPath();
      g.moveTo(-6, sy * 4);
      g.quadraticCurveTo(-18, sy * 15, -27, sy * 11);
      g.quadraticCurveTo(-17, sy * 8, -12, sy * 2.5);
      g.closePath();
      g.fill();
    }
    _wpnSpark(g, 24, -11, 4.2, '#fff9db');
    _wpnSpark(g, -16, -12, 3.2, accent);
  }
  g.restore();
}

function _paintWeaponArt(g, id, tier, evoId) {
  const accent = _resolveEvoColor(id, tier, evoId);
  const hiTier = tier >= 3;
  const isMythic = tier >= 5 || !!evoId;
  const trimGold = isMythic ? '#fff0b3' : (tier >= 4 ? '#f6d379' : (tier === 3 ? '#d8b4fe' : '#94a3b8'));
  const bladeHi = isMythic ? '#ffffff' : '#f8fafc';
  const bladeMid = tier >= 2 ? accent : '#cbd5e1';
  const bladeDark = '#334155';

  if (isMythic) {
    _drawMythicCrest(g, accent, !!evoId);
  } else if (tier >= 2) {
    g.save();
    g.globalAlpha = 0.12 + tier * 0.04;
    g.fillStyle = accent;
    g.beginPath(); g.ellipse(4, 0, 23, 11.5, 0, 0, Math.PI * 2); g.fill();
    if (tier === 4) {
      g.globalAlpha = 0.45;
      g.strokeStyle = '#f6d379';
      g.lineWidth = 1.0;
      g.beginPath(); g.arc(3, 0, 18, -1.2, 1.2); g.stroke();
    }
    g.restore();
  }

  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = 1.65;
  g.strokeStyle = '#090710';

  if (id === 'stick') {
    // 守夜灵木法杖：盘虬古木杖身 + 金箍束环 + 悬浮青焰魂晶
    g.fillStyle = _wpnGrad(g, -20, -5, 18, 6, '#b07d52', '#6f4528', '#3d2314');
    g.beginPath();
    g.moveTo(-22, -2.6); g.quadraticCurveTo(-4, -4.4, 14, -3.2);
    g.lineTo(19, -5.8); g.lineTo(20, -1.5); g.lineTo(15, 2.8);
    g.quadraticCurveTo(-3, 4.2, -22, 2.8); g.closePath();
    g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,235,200,0.35)'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-18, -1.2); g.quadraticCurveTo(-2, -2.5, 13, -1.4); g.stroke();
    g.strokeStyle = '#090710'; g.lineWidth = 1.5;
    g.fillStyle = trimGold;
    g.fillRect(-5, -3.8, 4.5, 7.6); g.strokeRect(-5, -3.8, 4.5, 7.6);
    const gemCol = isMythic ? accent : '#72efdd';
    g.fillStyle = _wpnGrad(g, 15, -8, 27, 5, '#ffffff', gemCol, '#0f766e');
    g.beginPath(); g.moveTo(16, 0); g.lineTo(21.5, -6.8); g.lineTo(28.5, 0); g.lineTo(21.5, 6.8); g.closePath();
    g.fill(); g.stroke();
    _wpnSpark(g, 22, -2, 3.2, '#ffffff');
  } else if (id === 'rock') {
    // 棱面符文陨星核：多切面黑曜晶石 + 内嵌发光裂隙铭文
    const coreCol = tier >= 2 ? accent : '#38bdf8';
    g.fillStyle = _wpnGrad(g, -14, -13, 16, 13, '#94a3b8', '#475569', '#1e293b');
    g.beginPath();
    g.moveTo(-13, -5); g.lineTo(-3, -13.5); g.lineTo(11, -11);
    g.lineTo(18, -1.5); g.lineTo(12, 11.5); g.lineTo(-4, 13); g.lineTo(-15, 4.5);
    g.closePath(); g.fill(); g.stroke();
    // 棱面受光切面
    g.fillStyle = 'rgba(248,250,252,0.28)';
    g.beginPath(); g.moveTo(-11, -4.5); g.lineTo(-3, -12); g.lineTo(8, -9.5); g.lineTo(1, -1); g.closePath(); g.fill();
    // 裂隙能量脉络
    g.strokeStyle = coreCol; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(-7, -2); g.lineTo(1, -4); g.lineTo(9, 2); g.moveTo(1, -4); g.lineTo(-1, 6); g.stroke();
    _wpnSpark(g, 2, -3, 3.5, '#ffffff');
  } else if (id === 'spear') {
    // 红缨破阵龙枪：乌木金属长杆 + 绯红流苏枪缨 + 双血槽菱形银枪尖
    g.fillStyle = _wpnGrad(g, -26, -3, -26, 3, '#a47148', '#582f0e');
    g.beginPath(); g.roundRect(-27, -2.3, 38, 4.6, 2); g.fill(); g.stroke();
    g.fillStyle = trimGold;
    g.fillRect(8, -3.6, 5, 7.2); g.strokeRect(8, -3.6, 5, 7.2);
    // 飘逸红缨
    g.fillStyle = isMythic ? accent : '#e11d48';
    g.beginPath();
    g.moveTo(10, -3.2); g.quadraticCurveTo(3, -10.5, -3, -8.2); g.quadraticCurveTo(4, -5, 9, -2.5);
    g.moveTo(10, 3.2); g.quadraticCurveTo(3, 10.5, -2, 8.0); g.quadraticCurveTo(4, 5, 9, 2.5);
    g.fill(); g.stroke();
    // 双切面枪刃
    g.fillStyle = _wpnGrad(g, 13, -7, 34, 7, bladeHi, bladeMid, bladeDark);
    g.beginPath();
    g.moveTo(13, 0); g.lineTo(17, -6.5); g.lineTo(34, 0); g.lineTo(17, 6.5); g.closePath();
    g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.82)'; g.lineWidth = 1.0;
    g.beginPath(); g.moveTo(15, 0); g.lineTo(30, 0); g.stroke();
  } else if (id === 'slingshot') {
    // 猎魔复合弹弓：精雕胡桃木护手 + 鎏金分叉臂 + 紧绷晶弦与弹丸
    _wpnWrapGrip(g, -18, -3.2, 14, 6.4, '#4a2c11', '#9c6644', trimGold);
    g.fillStyle = _wpnGrad(g, -5, -12, 14, 12, trimGold, '#7f4f24', '#3b210c');
    g.beginPath();
    g.moveTo(-5, -3.2); g.quadraticCurveTo(4, -4, 13, -12); g.lineTo(16, -9.2);
    g.quadraticCurveTo(7, -1.5, 2, 0);
    g.quadraticCurveTo(7, 1.5, 16, 9.2); g.lineTo(13, 12);
    g.quadraticCurveTo(4, 4, -5, 3.2); g.closePath();
    g.fill(); g.stroke();
    g.strokeStyle = isMythic ? accent : '#72efdd'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(14.5, -10.2); g.lineTo(-1, 0); g.lineTo(14.5, 10.2); g.stroke();
    g.strokeStyle = '#090710'; g.lineWidth = 1.4;
    g.fillStyle = _wpnGrad(g, -4, -3, 3, 3, '#ffffff', accent);
    g.beginPath(); g.arc(0.5, 0, 3.4, 0, Math.PI * 2); g.fill(); g.stroke();
  } else if (id === 'blowgun') {
    // 淬毒翠竹吹箭筒：节竹金箍长管 + 羽饰瞄准环 + 幽绿剧毒吹针
    g.fillStyle = _wpnGrad(g, -22, -3.5, 20, 3.5, '#34d399', '#059669', '#064e3b');
    g.beginPath(); g.roundRect(-23, -3.2, 42, 6.4, 3); g.fill(); g.stroke();
    for (const bx of [-12, 0, 11]) {
      g.fillStyle = trimGold;
      g.fillRect(bx, -3.9, 2.8, 7.8); g.strokeRect(bx, -3.9, 2.8, 7.8);
    }
    // 毒芒针尖
    const pCol = isMythic ? accent : '#a7f3d0';
    g.fillStyle = pCol;
    g.beginPath(); g.moveTo(19, -2.0); g.lineTo(31, 0); g.lineTo(19, 2.0); g.closePath(); g.fill(); g.stroke();
    _wpnSpark(g, 28, 0, 2.8, '#ecfdf5');
  } else if (id === 'knife') {
    // 暗影刺客短匕：宝石尾锤 + 缠柄护手 + 曲刃反光开血槽匕身
    _wpnWrapGrip(g, -18, -2.8, 11, 5.6, '#1e293b', '#475569', trimGold);
    g.fillStyle = trimGold;
    g.beginPath(); g.arc(-19.5, 0, 2.8, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-7, -7.8); g.lineTo(-3.5, -5.5); g.lineTo(-3.5, 5.5); g.lineTo(-7, 7.8); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = _wpnGrad(g, -3, -6, 26, 6, bladeHi, bladeMid, '#1e293b');
    g.beginPath();
    g.moveTo(-3.5, -4.8); g.lineTo(13, -5.2); g.quadraticCurveTo(22, -3.2, 27, 0.5);
    g.quadraticCurveTo(17, 5.8, -3.5, 4.6); g.closePath();
    g.fill(); g.stroke();
    g.strokeStyle = isMythic ? accent : '#f43f5e'; g.lineWidth = 1.15;
    g.beginPath(); g.moveTo(0, -0.5); g.lineTo(16, -0.2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-2, -3.6); g.lineTo(22, -0.5); g.stroke();
  } else if (id === 'claws') {
    // 猩红猎魔钩爪：暗金护拳甲 + 三道新月弧光利刃
    g.fillStyle = _wpnGrad(g, -16, -10, -3, 10, '#4c1d95', '#1e1b4b');
    g.beginPath(); g.roundRect(-16, -9.5, 11, 19, 4); g.fill(); g.stroke();
    g.fillStyle = trimGold;
    for (const ky of [-5.5, 0, 5.5]) {
      g.beginPath(); g.arc(-5.5, ky, 2.1, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    const clawGrad = _wpnGrad(g, -4, -9, 26, 9, '#ffffff', tier >= 2 ? accent : '#fb7185', '#881337');
    for (const cy of [-6.2, 0, 6.2]) {
      g.fillStyle = clawGrad;
      g.strokeStyle = '#090710'; g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(-4, cy - 2.1);
      g.quadraticCurveTo(12, cy - 4.4, 26 - Math.abs(cy) * 0.45, cy + 0.6);
      g.quadraticCurveTo(11, cy + 0.8, -4, cy + 1.9);
      g.closePath();
      g.fill(); g.stroke();
    }
  } else if (id === 'katana') {
    // 绯樱居合太刀：菱纹缠柄 + 镂空金锷 + 沸腾刃纹弧形长刀
    _wpnWrapGrip(g, -26, -2.6, 14, 5.2, '#0f172a', '#334155', '#f43f5e');
    g.fillStyle = trimGold;
    g.beginPath(); g.roundRect(-12.5, -7.2, 3.6, 14.4, 1.5); g.fill(); g.stroke();
    g.fillStyle = _wpnGrad(g, -9, -5, 34, 4, '#ffffff', tier >= 2 ? accent : '#fda4af', '#475569');
    g.beginPath();
    g.moveTo(-9, -3.2);
    g.quadraticCurveTo(13, -5.2, 35, -1.6);
    g.lineTo(31.5, 2.8);
    g.quadraticCurveTo(12, 1.8, -9, 2.6);
    g.closePath();
    g.fill(); g.stroke();
    // 居合沸腾刃纹 (Hamon)
    g.strokeStyle = 'rgba(255,255,255,0.86)'; g.lineWidth = 0.95;
    g.beginPath(); g.moveTo(-7, 0.4); g.quadraticCurveTo(4, -1.5, 14, 0.3); g.quadraticCurveTo(23, -1.2, 31, 0.6); g.stroke();
  } else if (id === 'crossbow') {
    // 猎魔机械连弩：精钢滑轨枪托 + 双翼反曲钢弓 + 蓄势发光弩箭
    g.fillStyle = _wpnGrad(g, -20, -4, 16, 5, '#9c6644', '#582f0e');
    g.beginPath(); g.roundRect(-21, -3.2, 33, 6.4, 2.2); g.fill(); g.stroke();
    // 反曲双翼弓臂
    g.strokeStyle = '#090710'; g.lineWidth = 4.6;
    g.beginPath(); g.moveTo(6, -2); g.quadraticCurveTo(13, -13, 2, -17); g.moveTo(6, 2); g.quadraticCurveTo(13, 13, 2, 17); g.stroke();
    g.strokeStyle = tier >= 2 ? accent : '#e2e8f0'; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(6, -2); g.quadraticCurveTo(13, -13, 2, -17); g.moveTo(6, 2); g.quadraticCurveTo(13, 13, 2, 17); g.stroke();
    // 弓弦与上膛弩矢
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(2, -16.5); g.lineTo(-9, 0); g.lineTo(2, 16.5); g.stroke();
    g.strokeStyle = '#090710'; g.lineWidth = 1.4;
    g.fillStyle = isMythic ? accent : '#72efdd';
    g.beginPath(); g.moveTo(15, -3.5); g.lineTo(27, 0); g.lineTo(15, 3.5); g.lineTo(17.5, 0); g.closePath(); g.fill(); g.stroke();
  } else if (id === 'shuriken') {
    // 四方风魔手里剑：中心镂空咒印环 + 四枚弧形切风钢刃
    const shCol = tier >= 2 ? accent : '#72efdd';
    g.fillStyle = _wpnGrad(g, -16, -16, 16, 16, '#ffffff', shCol, '#1e293b');
    g.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI * 0.5;
      const aMid = a + 0.42;
      const ox = Math.cos(a) * 16.5, oy = Math.sin(a) * 16.5;
      const ix = Math.cos(aMid) * 5.6, iy = Math.sin(aMid) * 5.6;
      if (k === 0) g.moveTo(ox, oy); else g.lineTo(ox, oy);
      g.quadraticCurveTo(Math.cos(a + 0.18) * 10.5, Math.sin(a + 0.18) * 10.5, ix, iy);
    }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#090710';
    g.beginPath(); g.arc(0, 0, 3.8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = trimGold; g.lineWidth = 1.3;
    g.beginPath(); g.arc(0, 0, 4.2, 0, Math.PI * 2); g.stroke();
  } else if (id === 'sniper') {
    // 苍穹反器材狙击步枪：镂空战术枪托 + 超长浮置凹槽枪管 + 双镜片高倍光学镜 + 制退器
    g.fillStyle = _wpnGrad(g, -26, -3, -8, 8, '#7f4f24', '#3b210c');
    g.beginPath();
    g.moveTo(-26, -3.5); g.lineTo(-9, -3.5); g.lineTo(-6, 4.5); g.lineTo(-12, 4.5); g.lineTo(-15, 1.5); g.lineTo(-26, 3.5);
    g.closePath(); g.fill(); g.stroke();
    // 机匣与超长枪管
    g.fillStyle = _wpnGrad(g, -10, -5, 30, 4, bladeHi, bladeMid, '#1e293b');
    g.beginPath(); g.roundRect(-10, -4.6, 20, 6.8, 1.8); g.fill(); g.stroke();
    g.fillRect(10, -3.0, 21, 3.6); g.strokeRect(10, -3.0, 21, 3.6);
    // 枪口制退器
    g.fillStyle = trimGold;
    g.beginPath(); g.roundRect(30, -4.4, 5.5, 6.4, 1.2); g.fill(); g.stroke();
    // 高倍瞄准镜
    g.fillStyle = '#1e293b';
    g.beginPath(); g.roundRect(-5, -10.5, 16, 4.6, 1.8); g.fill(); g.stroke();
    g.fillStyle = isMythic ? accent : '#72efdd';
    g.fillRect(9, -10, 2.2, 3.6); g.fillRect(-4.6, -10, 1.8, 3.6);
  } else if (id === 'pistol') {
    // 守誓制式战术手枪：防滑斜纹握把 + 双色切削套筒 + 荧光准星
    _wpnWrapGrip(g, -12, 1, 7.5, 10.5, '#1e293b', '#475569', trimGold);
    g.strokeStyle = '#334155'; g.lineWidth = 1.3;
    g.beginPath(); g.strokeRect(-4.8, 1.5, 5.2, 4.2);
    g.strokeStyle = '#090710'; g.lineWidth = 1.65;
    g.fillStyle = _wpnGrad(g, -14, -6.5, 18, 2, bladeHi, bladeMid, '#1e293b');
    g.beginPath(); g.roundRect(-14, -6.2, 31, 7.8, 2.2); g.fill(); g.stroke();
    // 抛壳窗与散热斜槽
    g.fillStyle = '#0f172a'; g.fillRect(-2, -4.8, 6.5, 2.6);
    g.strokeStyle = 'rgba(15,23,42,0.75)'; g.lineWidth = 1.1;
    for (const sx of [-11, -9, -7]) { g.beginPath(); g.moveTo(sx, -5.0); g.lineTo(sx - 1, -0.5); g.stroke(); }
    g.fillStyle = isMythic ? accent : '#72efdd';
    g.fillRect(14, -7.8, 2.4, 1.8);
  } else if (id === 'revolver') {
    // 审判者左轮手枪：雕花胡桃木弯柄 + 六发黄金转轮弹巢 + 长肋条重型枪管
    _wpnWrapGrip(g, -17, 0.5, 8.5, 11, '#431407', '#9a3412', trimGold);
    g.fillStyle = _wpnGrad(g, -9, -6, 26, 3, '#fff8dc', tier >= 2 ? accent : '#f6d379', '#78350f');
    g.beginPath(); g.roundRect(-9, -5.8, 34, 6.4, 1.8); g.fill(); g.stroke();
    // 转轮弹巢
    g.fillStyle = _wpnGrad(g, -8, -4.5, 2, 4.5, '#fef08a', '#b45309');
    g.beginPath(); g.roundRect(-7.5, -4.6, 9.5, 7.4, 2); g.fill(); g.stroke();
    g.fillStyle = '#1c1917';
    for (const cy of [-2.4, 0.8]) { g.fillRect(-5.8, cy, 6, 1.5); }
    _wpnSpark(g, 24, -2.8, 2.8, '#ffffff');
  } else if (id === 'smg') {
    // 疾风战术冲锋枪：加长弧形弹匣 + 紧凑折叠托机匣 + 全息红点镜 + 消焰枪口
    g.fillStyle = '#1e293b';
    g.beginPath();
    g.moveTo(1, 2); g.quadraticCurveTo(3, 10, 6.5, 14.5); g.lineTo(11, 13.2); g.quadraticCurveTo(7.5, 8.5, 6, 2);
    g.closePath(); g.fill(); g.stroke();
    _wpnWrapGrip(g, -11, 2, 6.5, 9, '#0f172a', '#334155', trimGold);
    g.fillStyle = _wpnGrad(g, -16, -6.5, 20, 3, bladeHi, bladeMid, '#1e293b');
    g.beginPath(); g.roundRect(-16, -6.2, 34, 8.6, 2.5); g.fill(); g.stroke();
    g.fillStyle = '#0f172a';
    for (const vx of [4, 8, 12]) g.fillRect(vx, -3.8, 2.2, 2.8);
    // 全息瞄具与枪口
    g.fillStyle = isMythic ? accent : '#fb7185';
    g.beginPath(); g.roundRect(-6, -10.2, 7.5, 4, 1.2); g.fill(); g.stroke();
    g.fillStyle = '#334155';
    g.fillRect(18, -4.2, 6.5, 4.4); g.strokeRect(18, -4.2, 6.5, 4.4);
  } else if (id === 'shotgun') {
    // 雷霆泵动式重霰弹：核桃木枪托 + 上下双联重管 + 金色护木滑块
    g.fillStyle = _wpnGrad(g, -24, -3, -8, 7, '#9c6644', '#431407');
    g.beginPath();
    g.moveTo(-24, -2); g.lineTo(-9, -4); g.lineTo(-7, 3.5); g.lineTo(-23, 6.5); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = _wpnGrad(g, -9, -6.5, 25, 3, bladeHi, bladeMid, '#1e293b');
    g.beginPath(); g.roundRect(-9, -6.0, 33, 5.2, 1.6); g.fill(); g.stroke();
    g.fillStyle = '#334155';
    g.beginPath(); g.roundRect(-4, -0.8, 24, 3.8, 1.4); g.fill(); g.stroke();
    // 泵动护木
    g.fillStyle = _wpnGrad(g, 2, -1.5, 15, 4.5, trimGold, '#92400e');
    g.beginPath(); g.roundRect(2, -1.4, 13, 5.2, 1.8); g.fill(); g.stroke();
  } else if (id === 'shredder') {
    // 爆裂碎甲发射器：厚重装甲机匣 + 炽热熔炉核心窗 + 锯齿破片膛口
    g.fillStyle = _wpnGrad(g, -18, -7, 20, 7, '#64748b', '#1e293b');
    g.beginPath(); g.roundRect(-18, -7, 36, 13, 3); g.fill(); g.stroke();
    const coreC = isMythic ? accent : '#fb923c';
    g.fillStyle = _wpnGrad(g, -4, -4, 12, 4, '#fff7ed', coreC, '#9a3412');
    g.beginPath(); g.roundRect(-4, -4.2, 15, 7.2, 2); g.fill(); g.stroke();
    g.fillStyle = trimGold;
    g.beginPath();
    g.moveTo(18, -7.5); g.lineTo(25, -5); g.lineTo(21, -2); g.lineTo(25, 0); g.lineTo(21, 2); g.lineTo(25, 5); g.lineTo(18, 7.5);
    g.closePath(); g.fill(); g.stroke();
  } else if (id === 'hammer') {
    // 碎星重装战锤：镌金长柄 + 双面斜面破甲锤头 + 核心符文晶石
    _wpnWrapGrip(g, -26, -2.6, 34, 5.2, '#431407', '#9c6644', trimGold);
    g.fillStyle = _wpnGrad(g, 4, -15, 22, 15, bladeHi, bladeMid, '#1e293b');
    g.beginPath();
    g.moveTo(5, -13.5); g.lineTo(20, -15.5); g.lineTo(23.5, -9); g.lineTo(23.5, 9); g.lineTo(20, 15.5); g.lineTo(5, 13.5); g.lineTo(3, 0);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = trimGold;
    g.fillRect(10, -14.2, 5.5, 28.4); g.strokeRect(10, -14.2, 5.5, 28.4);
    _wpnSpark(g, 12.8, 0, 4.2, isMythic ? '#ffffff' : accent);
  } else if (id === 'spiked_shield') {
    // 荆棘壁垒鸢盾：哥特弧面重甲盾 + 鎏金十字脊 + 三枚破阵钢刺
    g.fillStyle = _wpnGrad(g, -12, -15, 18, 15, bladeHi, bladeMid, '#1e293b');
    g.beginPath();
    g.moveTo(-9, -14.5); g.quadraticCurveTo(9, -14, 19, 0); g.quadraticCurveTo(9, 14, -9, 14.5);
    g.quadraticCurveTo(-5, 0, -9, -14.5);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = trimGold; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-5, 0); g.lineTo(15, 0); g.moveTo(3, -11); g.lineTo(3, 11); g.stroke();
    g.strokeStyle = '#090710'; g.lineWidth = 1.4;
    g.fillStyle = trimGold;
    for (const sy of [-9, 0, 9]) {
      const sx = sy === 0 ? 18 : 13;
      g.beginPath(); g.moveTo(sx, sy - 2.6); g.lineTo(sx + 7.5, sy); g.lineTo(sx, sy + 2.6); g.closePath(); g.fill(); g.stroke();
    }
  } else if (id === 'grenade_launcher') {
    // 六连发转轮榴弹炮：重型大口径炮管 + 橙焰转轮弹鼓 + 战术提把
    _wpnWrapGrip(g, -20, 1, 8, 9.5, '#1e293b', '#475569', trimGold);
    g.fillStyle = _wpnGrad(g, -18, -6.5, 26, 5, '#94a3b8', '#334155');
    g.beginPath(); g.roundRect(-18, -6.2, 42, 9.2, 2.5); g.fill(); g.stroke();
    const drumC = isMythic ? accent : '#f97316';
    g.fillStyle = _wpnGrad(g, -6, -8, 10, 8, '#ffedd5', drumC, '#9a3412');
    g.beginPath(); g.roundRect(-5.5, -7.8, 14, 13.6, 3.5); g.fill(); g.stroke();
    g.strokeStyle = '#090710'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-5, -1); g.lineTo(8, -1); g.moveTo(-5, 3); g.lineTo(8, 3); g.stroke();
  } else if (id === 'minigun') {
    // 毁灭六管加特林：重装电机机匣 + 四根平行旋转钢制枪管 + 双金箍束环
    g.fillStyle = _wpnGrad(g, -22, -9, -2, 9, '#475569', '#0f172a');
    g.beginPath(); g.roundRect(-22, -8.5, 18, 17, 3.5); g.fill(); g.stroke();
    for (const by of [-6, -2, 2, 6]) {
      g.fillStyle = _wpnGrad(g, -4, by - 1.4, 26, by + 1.4, bladeHi, bladeMid, '#334155');
      g.fillRect(-4, by - 1.35, 30, 2.7); g.strokeRect(-4, by - 1.35, 30, 2.7);
    }
    g.fillStyle = trimGold;
    for (const rx of [9, 20]) {
      g.fillRect(rx, -7.8, 3.4, 15.6); g.strokeRect(rx, -7.8, 3.4, 15.6);
    }
  } else if (id === 'rocket') {
    // 咆哮重型火箭筒：军绿/黑曜发射筒 + 尾焰喷口护罩 + 探出绯红弹头
    g.fillStyle = _wpnGrad(g, -25, -7.5, 20, 7.5, bladeMid, '#334155', '#0f172a');
    g.beginPath(); g.roundRect(-24, -6.8, 40, 13.6, 3); g.fill(); g.stroke();
    g.fillStyle = trimGold;
    g.fillRect(-26, -8.2, 4.5, 16.4); g.strokeRect(-26, -8.2, 4.5, 16.4);
    g.fillRect(12, -7.8, 4, 15.6); g.strokeRect(12, -7.8, 4, 15.6);
    const whCol = isMythic ? accent : '#f43f5e';
    g.fillStyle = _wpnGrad(g, 16, -6, 31, 6, '#ffe4e6', whCol, '#881337');
    g.beginPath(); g.moveTo(16, -5.8); g.quadraticCurveTo(25, -5.2, 32, 0); g.quadraticCurveTo(25, 5.2, 16, 5.8); g.closePath();
    g.fill(); g.stroke();
  } else if (id === 'magma_blade') {
    // 熔岩裂地巨剑：黑曜锯齿宽刃 + 炽白岩浆核心裂纹 + 恶魔角护手
    _wpnWrapGrip(g, -25, -3, 12, 6, '#1c1917', '#44403c', trimGold);
    g.fillStyle = trimGold;
    g.beginPath(); g.moveTo(-13, -10); g.lineTo(-8, -5); g.lineTo(-8, 5); g.lineTo(-13, 10); g.lineTo(-10, 0); g.closePath(); g.fill(); g.stroke();
    const magC = isMythic ? accent : '#fb5607';
    g.fillStyle = _wpnGrad(g, -8, -9, 34, 9, '#292524', magC, '#fff7ed');
    g.beginPath();
    g.moveTo(-8, -6.8); g.lineTo(8, -8.8); g.lineTo(6, -6.2); g.lineTo(22, -8.2); g.lineTo(35, 0);
    g.lineTo(21, 8.2); g.lineTo(-8, 6.8); g.closePath();
    g.fill(); g.stroke();
    g.strokeStyle = '#fef08a'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-5, 0); g.lineTo(6, -1.8); g.lineTo(16, 1.5); g.lineTo(28, 0); g.stroke();
  } else if (id === 'icicle') {
    // 极寒冰魄棱枪：多面折射永恒冰晶 + 星霜护手翼
    const iceC = isMythic ? accent : '#72efdd';
    g.fillStyle = _wpnGrad(g, -18, -9, 32, 9, '#ffffff', iceC, '#0284c7');
    g.beginPath();
    g.moveTo(-18, 0); g.lineTo(-7, -8.8); g.lineTo(-2, -4.5); g.lineTo(33, 0);
    g.lineTo(-2, 4.5); g.lineTo(-7, 8.8); g.closePath();
    g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.88)'; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(-12, 0); g.lineTo(28, 0); g.moveTo(-6, -6); g.lineTo(10, 0); g.stroke();
    _wpnSpark(g, 8, -2, 3.4, '#ffffff');
  } else if (id === 'laser') {
    // 棱镜聚焦激光枪：靛蓝科幻枪身 + 透明充能导光腔 + 聚焦晶状体膛口
    _wpnWrapGrip(g, -16, 1.5, 7, 9, '#1e1b4b', '#312e81', trimGold);
    g.fillStyle = _wpnGrad(g, -18, -7, 22, 6, '#6366f1', '#1e1b4b');
    g.beginPath(); g.roundRect(-18, -6.8, 36, 11.2, 3); g.fill(); g.stroke();
    const lCol = isMythic ? accent : '#72efdd';
    g.fillStyle = _wpnGrad(g, -10, -3.5, 16, 2.5, '#ffffff', lCol);
    g.beginPath(); g.roundRect(-10, -3.4, 24, 4.6, 2); g.fill();
    g.fillStyle = lCol;
    g.beginPath(); g.moveTo(18, -5.2); g.lineTo(27, 0); g.lineTo(18, 5.2); g.closePath(); g.fill(); g.stroke();
  } else if (id === 'flamer') {
    // 炼狱龙息喷火器：下挂高压红燃料罐 + 散热孔防烫罩 + 点火引燃嘴
    g.fillStyle = _wpnGrad(g, -16, 2, -1, 12, '#fb7185', '#9f1239');
    g.beginPath(); g.roundRect(-16, 2.2, 15, 8.8, 4); g.fill(); g.stroke();
    g.fillStyle = _wpnGrad(g, -18, -6.5, 22, 4, bladeHi, bladeMid, '#1e293b');
    g.beginPath(); g.roundRect(-18, -6.2, 38, 8.8, 2.5); g.fill(); g.stroke();
    g.fillStyle = '#0f172a';
    for (const hx of [2, 7, 12]) { g.beginPath(); g.arc(hx, -1.8, 1.4, 0, Math.PI * 2); g.fill(); }
    const flC = isMythic ? accent : '#fb923c';
    g.fillStyle = _wpnGrad(g, 20, -4, 30, 4, '#fef08a', flC);
    g.beginPath(); g.moveTo(20, -3.2); g.quadraticCurveTo(28, -4, 30, 0); g.quadraticCurveTo(27, 4, 20, 3.2); g.closePath(); g.fill(); g.stroke();
  } else if (id === 'taser') {
    // 雷神电弧脉冲器：紫晶电容腔 + 双极金属放电叉 + 跃动闪电链
    g.fillStyle = _wpnGrad(g, -16, -6.5, 14, 6.5, '#7e22ce', '#2e1065');
    g.beginPath(); g.roundRect(-16, -6.5, 28, 13, 3.5); g.fill(); g.stroke();
    g.fillStyle = trimGold;
    g.fillRect(12, -5.8, 9, 2.8); g.strokeRect(12, -5.8, 9, 2.8);
    g.fillRect(12, 3.0, 9, 2.8); g.strokeRect(12, 3.0, 9, 2.8);
    g.strokeStyle = isMythic ? accent : '#72efdd'; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(20, -4.4); g.lineTo(25, -1.5); g.lineTo(21, 1.2); g.lineTo(25, 4.4); g.stroke();
  } else if (id === 'plasma') {
    // 虚空等离子重炮：分体悬浮导轨翼 + 中央超新星等离子球
    g.fillStyle = _wpnGrad(g, -18, -8, 16, 8, '#581c87', '#1e1b4b');
    g.beginPath();
    g.moveTo(-18, -6); g.lineTo(16, -8.5); g.lineTo(14, -3.5); g.lineTo(-6, -3);
    g.lineTo(-6, 3); g.lineTo(14, 3.5); g.lineTo(16, 8.5); g.lineTo(-18, 6); g.closePath();
    g.fill(); g.stroke();
    const plC = isMythic ? accent : '#c084fc';
    g.fillStyle = _wpnGrad(g, 8, -6, 23, 6, '#ffffff', plC, '#4c1d95');
    g.beginPath(); g.arc(16, 0, 6.2, 0, Math.PI * 2); g.fill(); g.stroke();
    _wpnSpark(g, 14.5, -2, 3.2, '#ffffff');
  } else if (id === 'wrench') {
    // 枢机齿轮重扳手：黄铜液压握柄 + 精密咬合开口钳头 + 齿轮铆钉
    _wpnWrapGrip(g, -22, -3.5, 26, 7, '#78350f', tier >= 2 ? accent : '#f6d379', '#fef08a');
    g.fillStyle = _wpnGrad(g, 4, -10, 25, 10, '#fffbeb', tier >= 2 ? accent : '#f59e0b', '#78350f');
    g.beginPath();
    g.arc(15, 0, 9.8, 0.58, Math.PI * 2 - 0.58);
    g.lineTo(11, -3.8); g.lineTo(11, 3.8); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#1e293b';
    g.beginPath(); g.arc(6, 0, 2.3, 0, Math.PI * 2); g.fill();
  } else if (id === 'screwdriver') {
    // 爆破工程改锥：琥珀绝缘棱纹手柄 + 铬钒合金长杆 + 磁化一字刃尖
    g.fillStyle = _wpnGrad(g, -22, -5.5, -4, 5.5, '#fde047', '#d97706', '#78350f');
    g.beginPath(); g.roundRect(-22, -5.4, 18, 10.8, 4); g.fill(); g.stroke();
    g.fillStyle = '#1e293b';
    g.fillRect(-18, -3.4, 10, 2); g.fillRect(-18, 1.4, 10, 2);
    g.fillStyle = _wpnGrad(g, -4, -2.5, 26, 2.5, '#ffffff', bladeMid, '#475569');
    g.beginPath(); g.moveTo(-4, -2.2); g.lineTo(21, -2.0); g.lineTo(27, -3.2); g.lineTo(27, 3.2); g.lineTo(21, 2.0); g.lineTo(-4, 2.2); g.closePath();
    g.fill(); g.stroke();
  } else if (id === 'nailgun') {
    // 高压气动射钉枪：工程黄工业机身 + 倾斜排钉弹匣 + 安全顶针枪嘴
    g.fillStyle = '#334155';
    g.beginPath(); g.moveTo(0, 3); g.lineTo(6, 13.5); g.lineTo(12, 12); g.lineTo(7, 3); g.closePath(); g.fill(); g.stroke();
    _wpnWrapGrip(g, -15, 2.5, 7, 9.5, '#1e293b', '#475569', trimGold);
    g.fillStyle = _wpnGrad(g, -17, -7, 18, 5, '#fef08a', tier >= 2 ? accent : '#eab308', '#854d0e');
    g.beginPath(); g.roundRect(-17, -6.8, 33, 10.5, 3); g.fill(); g.stroke();
    g.fillStyle = '#cbd5e1';
    g.fillRect(16, -3.5, 8, 4.2); g.strokeRect(16, -3.5, 8, 4.2);
  } else if (id === 'drone_bay') {
    // 浮游蜂巢母舰舱：双翼战术挂架 + 六角能量核心 + 环绕发光无人机光点
    g.fillStyle = _wpnGrad(g, -16, -12, 18, 12, '#475569', '#0f172a');
    g.beginPath();
    g.moveTo(-15, -11); g.lineTo(11, -11); g.lineTo(21, -3.5); g.lineTo(12, -2);
    g.lineTo(12, 2); g.lineTo(21, 3.5); g.lineTo(11, 11); g.lineTo(-15, 11); g.lineTo(-11, 0);
    g.closePath(); g.fill(); g.stroke();
    const drC = isMythic ? accent : '#72efdd';
    g.fillStyle = _wpnGrad(g, -4, -6, 10, 6, '#ffffff', drC, '#0e7490');
    g.beginPath(); g.arc(3, 0, 5.6, 0, Math.PI * 2); g.fill(); g.stroke();
    _wpnSpark(g, 24, 0, 4.0, drC);
  } else if (id === 'emp_cannon') {
    // 天基电磁轨道炮：上下对称磁轨导臂 + 蓝白充能等离子狭缝
    g.fillStyle = _wpnGrad(g, -20, -9, 6, 9, '#312e81', '#0f172a');
    g.beginPath(); g.roundRect(-20, -8.5, 22, 17, 3.5); g.fill(); g.stroke();
    const empC = isMythic ? accent : '#72efdd';
    g.fillStyle = _wpnGrad(g, 0, -2, 28, 2, '#ffffff', empC);
    g.fillRect(0, -2.2, 27, 4.4);
    for (const ry of [-7.5, 3.2]) {
      g.fillStyle = _wpnGrad(g, 2, ry, 28, ry + 4.3, bladeHi, bladeMid, '#1e293b');
      g.beginPath(); g.roundRect(2, ry, 26, 4.3, 1.4); g.fill(); g.stroke();
    }
    _wpnSpark(g, 28, 0, 3.8, '#ffffff');
  } else {
    g.fillStyle = _wpnGrad(g, -14, -5, 22, 5, bladeHi, bladeMid, '#1e293b');
    g.beginPath(); g.roundRect(-14, -4.5, 34, 9, 3); g.fill(); g.stroke();
  }
}

function getBakedWeaponSprite(id, tier = 1, evoId = '') {
  const safeTier = Math.max(1, Math.min(5, tier | 0));
  const key = `${id}|${safeTier}|${evoId || ''}`;
  let cvCached = _weaponSpriteCache.get(key);
  if (cvCached) return cvCached;
  if (typeof document === 'undefined') return null;

  const off = document.createElement('canvas');
  off.width = 192;
  off.height = 192;
  const g = off.getContext('2d');
  if (g) {
    g.save();
    g.translate(96, 96);
    g.scale(2.55, 2.55);
    _paintWeaponArt(g, id, safeTier, evoId || '');
    g.restore();
  }
  if (_weaponSpriteCache.size >= 110) {
    const oldestKey = _weaponSpriteCache.keys().next().value;
    _weaponSpriteCache.delete(oldestKey);
  }
  _weaponSpriteCache.set(key, off);
  return off;
}

function getWeaponArtDataUrl(id, tier = 1, evoId = '') {
  const safeTier = Math.max(1, Math.min(5, tier | 0));
  const key = `${id}|${safeTier}|${evoId || ''}`;
  if (_weaponDataUrlCache.has(key)) return _weaponDataUrlCache.get(key);
  const off = getBakedWeaponSprite(id, safeTier, evoId || '');
  let url = '';
  if (off && typeof off.toDataURL === 'function') {
    try { url = off.toDataURL(); } catch (e) { url = ''; }
  }
  if (url && url.indexOf('data:image/') === 0) {
    if (_weaponDataUrlCache.size >= 110) {
      const oldestKey = _weaponDataUrlCache.keys().next().value;
      _weaponDataUrlCache.delete(oldestKey);
    }
    _weaponDataUrlCache.set(key, url);
  }
  return url;
}

function renderWeaponEmblemHtml(id, tier = 1, evoId = '', fallbackIcon = '⚔️') {
  const url = getWeaponArtDataUrl(id, tier, evoId);
  if (url && url.indexOf('data:image/') === 0) {
    return `<img src="${url}" alt="" class="wpn-art-ico" decoding="async">`;
  }
  return fallbackIcon || '⚔️';
}

function drawWeaponSprite(w) {
  const id = w.id;
  const now = _syncNow();
  ctx.save();
  ctx.translate(w.wx, w.wy);
  ctx.rotate(w.angle);
  if (Math.cos(w.angle) < 0) ctx.scale(1, -1);
  if (id === 'shuriken') ctx.rotate(now * 0.0085);

  const baked = getBakedWeaponSprite(id, w.tier || 1, w.evo || '');
  if (baked) {
    ctx.drawImage(baked, -37.5, -37.5, 75, 75);
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
    ctx.fillStyle = flash ? '#475569' : '#1e293b';
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
    ent._ghostHead = (ent._ghostHead + 1) % 2;
  }
}

function _decayAndDrawGhostTrail(ent, dt, sheet, drawSize, yAnchorOffset) {
  const ring = ent._ghostRing;
  if (!ring || !sheet || !sheet.canvas) return;
  const cw = sheet.cellW, ch = sheet.cellH;
  for (let i = 0; i < ring.length; i++) {
    const g = ring[i];
    if (g.a <= 0.02) continue;
    g.a = Math.max(0, g.a - dt * 2.5);
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
  const flash = e.hitFlash > 0 || (e.primed && ((now * 0.014) | 0) % 2 === 1);

  // 潜渊骨蛇遁地期间隐藏地面躯体，仅渲染黑水暗金潜行地波裂痕
  if (e.type === 'sand_worm' && (e.burrowT || 0) > 0) {
    ctx.save();
    ctx.translate(e.x, e.y + 4);
    ctx.fillStyle = 'rgba(8, 10, 18, 0.76)';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.15, r * 0.52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, -2); ctx.lineTo(-r * 0.25, 5); ctx.lineTo(r * 0.3, -4); ctx.lineTo(r * 0.95, 3);
    ctx.stroke();
    ctx.restore();
    return;
  }

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
    const drawSize = Math.max(174, r * 3.20);
    const footOffset = r * 0.90;
    const visFlip = Math.abs(e._visFlip) < 0.24 ? (e._visFlip < 0 ? -0.24 : 0.24) : e._visFlip;

    if (e.dashing) {
      _pushGhostTrail(e, now, e._curFrameIdx, visFlip < 0 ? -1 : 1, 38);
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
      const targetSize = isBoss
        ? Math.max(166, r * 3.20)
        : (isMini ? Math.max(134, r * 3.08) : Math.max(60, r * 3.22));
      const sc = targetSize / Math.max(16, Math.max(spr.w, spr.h));
      const dw = spr.w * sc, dh = spr.h * sc;
      ctx.drawImage(spr.canvas, -dw * 0.5, -dh * 0.56, dw, dh);
    } else {
      ctx.fillStyle = flash ? '#f8d7da' : (e.color || '#be123c');
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // 3. 四象元素异常状态高辨识度清爽叠层（仅在存在元素异常时开启画布状态栈，节省高频 save/restore）
  if (((e.freezeT > 0 || e.chillT > 0) && !flash) || e.burnT > 0) {
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
  }

  if (e.type === 'shielder') {
    ctx.strokeStyle = '#72efdd'; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(e.x, e.y, r + 5, e.faceA - 0.85, e.faceA + 0.85); ctx.stroke();
  }

  const activeWindup = (e.p2WindupT || 0) > 0 ? e.p2WindupT : (e.sigWindupT || 0);
  const activeMaxW = (e.p2WindupT || 0) > 0 ? (e.p2WindupMax || 0.78) : (e.sigMaxW || 0.88);
  const activeBadgeTxt = (e.p2WindupT || 0) > 0 ? (e.p2Label || e.castLabel) : e.castLabel;
  if (activeWindup > 0 && activeBadgeTxt && (isBoss || isMini)) {
    const wProg = Math.max(0, Math.min(1, 1 - activeWindup / Math.max(0.1, activeMaxW)));
    ctx.save();
    ctx.font = '900 12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const cw = Math.max(132, Math.min(238, activeBadgeTxt.length * 13 + 24));
    const cy = e.y - r - 34;
    ctx.fillStyle = (e.p2WindupT || 0) > 0 ? 'rgba(34, 8, 20, 0.92)' : 'rgba(12, 9, 22, 0.88)';
    ctx.strokeStyle = (e.p2WindupT || 0) > 0 ? '#ffd166' : '#fde68a';
    ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.roundRect(e.x - cw * 0.5, cy - 12, cw, 20, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(251, 113, 133, 0.50)';
    ctx.fillRect(e.x - cw * 0.5 + 3, cy + 4, Math.max(2, (cw - 6) * wProg), 2.5);
    ctx.fillStyle = '#fef08a';
    ctx.fillText(activeBadgeTxt, e.x, cy + 2);
    ctx.restore();
  } else if (e.exposeT > 0 && isBoss) {
    ctx.font = '800 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6d379';
    ctx.fillText('破绽易伤', e.x, e.y + r + 20);
  }
  if (e.poisonT > 0 && e.poisonStacks >= 2 && (isBoss || isMini || e.elite)) {
    ctx.font = '800 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a3e635';
    ctx.fillText(`毒×${e.poisonStacks}`, e.x, e.y - r - 20);
  }

  if (!isBoss && !isMini && (e.type === 'brute' || e.type === 'juggernaut' || e.type === 'iron_guard' || e.elite || e.hp < e.maxHp)) {
    const bw = Math.max(30, r * 1.85);
    const barY = e.y - Math.max(r + 16, r * 1.48);
    ctx.fillStyle = 'rgba(6,9,16,0.82)';
    ctx.fillRect(e.x - bw / 2, barY, bw, 5.5);
    ctx.fillStyle = e.freezeT > 0 ? '#72efdd' : (e.poisonStacks > 0 ? '#a3e635' : (e.burnT > 0 ? '#fb923c' : (e.elite ? '#f6d379' : '#fb7185')));
    ctx.fillRect(e.x - bw / 2 + 1, barY + 1, (bw - 2) * Math.max(0, e.hp / e.maxHp), 3.5);
  }
}

// 🕯️ 6 位《烬塔残响》登塔角色 1024×256 四帧丝滑动作渲染（速度同步步频 + 柔顺转身 + 招牌出招帧 + 清晰受击判定光圈）
function drawPotatoHero() {
  const p = player;
  if (!p) return;
  const it = p.items || {};
  const now = _syncNow();

  // 1. 地面接触阴影与脚底轻量站位底椭圆（移除攻击射程圈；收集范围由地面层淡光圈呈现）
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 22, 20, 7.5, 0, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = it.berserk ? 'rgba(251, 113, 133, 0.50)' : 'rgba(114, 239, 221, 0.42)';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 21, 21, 7.8, 0, 0, Math.PI * 2); ctx.stroke();

  // 2. 4 帧动作精灵表状态机与柔顺插值绘制（仅真实扣血受击时柔和微闪，瞬步/过场无敌态不闪白）
  const hurtFlash = (p.hurtFlashT || 0) > 0 && (((p.hurtFlashT * 16) | 0) % 2 === 0);
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
    // 仅在主动灵魂瞬步（inDash）期间绘制精简残影，移除后期高移速常驻精灵表重绘开销
    const inDash = (p.dashT || 0) > 0;
    if (inDash) {
      _pushGhostTrail(p, now, 3, visFlip < 0 ? -1 : 1, 32, 0.42);
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
      ctx.fillStyle = hurtFlash ? '#fff7ed' : '#f1efe7';
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

  // 5. 寒冰地形渐进冰封状态视觉反馈（5秒寒霜进度条 + 冰封 1秒蓝宝石冰晶棱罩）
  if ((p.iceFreezeT || 0) > 0) {
    ctx.save();
    ctx.translate(p.x, p.y - 6);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.36)';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(22, -14);
    ctx.lineTo(18, 22);
    ctx.lineTo(0, 30);
    ctx.lineTo(-18, 22);
    ctx.lineTo(-22, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = '900 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText(`❄️ 冰封 ${p.iceFreezeT.toFixed(1)}s`, 0, -40);
    ctx.restore();
  } else if ((p.frostGauge || 0) > 0.05) {
    const fPct = Math.max(0, Math.min(1, p.frostGauge / 5.0));
    const inGrace = (p.frostLeaveGrace || 0) > 0 && fPct > 0;
    const bw = 44, barY = p.y - 46;
    ctx.save();
    ctx.fillStyle = 'rgba(6, 14, 24, 0.85)';
    ctx.strokeStyle = fPct >= 0.75 ? '#38bdf8' : 'rgba(125, 211, 252, 0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(p.x - bw * 0.5, barY, bw, 6, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fPct >= 0.78 ? '#7dd3fc' : (inGrace ? '#38bdf8' : '#93c5fd');
    ctx.fillRect(p.x - bw * 0.5 + 1.5, barY + 1.5, Math.max(2, (bw - 3) * fPct), 3);
    ctx.restore();
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
    ctx.fillText(`${sec}s`, 0, 4.5);
    ctx.restore();
  }
}

// 👑 首领登场 & 神话二阶段觉醒破框半身立绘系统（440×516 透明抠图 + 双旋星盘法阵 + 二阶六翼神辉，0 radialGradient / 0 shadowBlur）
function drawBossPortrait(variant, cx, cy, scale, isMythic) {
  const now = _syncNow();
  const s = scale || 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const RING_COLORS = {
    butcher: '#ff4d6d',
    frost_queen: '#72efdd',
    mech_colossus: '#ff9f1c',
    void_weaver: '#c77dff',
    plague_empress: '#52b788',
    solar_seraph: '#ffd166',
    crimson_lord: '#fb7185',
    golden_golem: '#ffd166',
    abyss_devourer: '#c77dff',
    vanguard: '#f72585',
    pyro_lord: '#fb5607',
    shadow_stalker: '#06d6a0',
    venom_matriarch: '#80ed99',
    glacial_valkyrie: '#48cae4',
    iron_warden: '#eab308',
    storm_siren: '#38bdf8'
  };
  const ringCol = isMythic ? '#ffd166' : (RING_COLORS[variant] || '#ff4d6d');
  const subCol = isMythic ? '#ff3b6b' : '#f6d379';

  // 神话二阶段专属：背后六翼炽金神辉羽刃 + 圣芒背环
  if (isMythic) {
    const wingPulse = Math.sin(now * 0.0042) * 3.5;
    ctx.fillStyle = 'rgba(255, 42, 85, 0.28)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.2;
    for (const dir of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.moveTo(dir * 10, 2 - w * 12);
        ctx.lineTo(dir * (132 - w * 14), -74 + w * 30 + wingPulse * (w === 0 ? -1 : 0.5));
        ctx.lineTo(dir * (96 - w * 11), -24 + w * 32);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -10, 96, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 背后曜黑星芒法阵圆盘（角色头冠、长发与裙摆自然上下破框突出）
  ctx.fillStyle = isMythic ? 'rgba(34, 7, 19, 0.90)' : 'rgba(11, 14, 28, 0.88)';
  ctx.strokeStyle = ringCol;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.arc(0, -8, 82, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 外环顺时针断续星轨 + 内环逆时针符文刻线
  ctx.save();
  ctx.translate(0, -8);
  ctx.rotate(now * 0.0009);
  ctx.strokeStyle = subCol;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([18, 9, 4, 9]);
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(-now * 0.0021);
  ctx.strokeStyle = isMythic ? 'rgba(255, 209, 102, 0.52)' : 'rgba(255, 255, 255, 0.34)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 左右悬浮四角星芒点缀
  ctx.fillStyle = isMythic ? '#ffd166' : ringCol;
  for (const dir of [-1, 1]) {
    const sx = dir * 94, sy = -42 + Math.sin(now * 0.003 + dir) * 3.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 7);
    ctx.lineTo(sx + 2.4, sy - 2.4);
    ctx.lineTo(sx + 7, sy);
    ctx.lineTo(sx + 2.4, sy + 2.4);
    ctx.lineTo(sx, sy + 7);
    ctx.lineTo(sx - 2.4, sy + 2.4);
    ctx.lineTo(sx - 7, sy);
    ctx.lineTo(sx - 2.4, sy - 2.4);
    ctx.closePath();
    ctx.fill();
  }

  // 绘制高清半身破框立绘（440×516 黄金半身比例：一阶段专属夏装 / 二阶段专属隐藏泳装换装）
  const animeImg = typeof getBossAnimePortrait === 'function' ? getBossAnimePortrait(variant, !!isMythic) : null;
  if (animeImg) {
    const iw = animeImg.width || animeImg.naturalWidth || 440;
    const ih = animeImg.height || animeImg.naturalHeight || 516;
    const isTallFallback = ih > iw * 1.3;
    const breath = Math.sin(now * 0.0024) * 2.2;
    const sway = Math.cos(now * 0.0015) * 1.0;
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    if (isTallFallback) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, -8, 78, 0, Math.PI * 2);
      ctx.clip();
      const sc = 166 / Math.min(iw, ih);
      const dw = iw * sc, dh = ih * sc;
      ctx.drawImage(animeImg, -dw * 0.5, -dh * 0.44, dw, dh);
      ctx.restore();
    } else {
      const dw = 192, dh = 225;
      ctx.drawImage(animeImg, -dw * 0.5 + sway, -dh * 0.52 + breath, dw, dh);
    }

    // 底部双层鎏金棱钻托座铭纹（优雅承接半身立绘柔化下缘）
    ctx.strokeStyle = ringCol;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-58, 96);
    ctx.lineTo(0, 104);
    ctx.lineTo(58, 96);
    ctx.stroke();
    ctx.fillStyle = subCol;
    ctx.beginPath();
    ctx.moveTo(0, 99);
    ctx.lineTo(5.5, 104);
    ctx.lineTo(0, 109);
    ctx.lineTo(-5.5, 104);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
