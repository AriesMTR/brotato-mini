// 异星晶树机制与一图一专属【非规则异形战场地形引擎】（多瓣熔岩池、曲岸毒泥沼、多棱碎晶冰湖、折线大裂谷、菱晶虚空门）
const FALLBACK_BOSS_DEFS = {
  butcher: { id: 'butcher', icon: '🦊', name: '绯红断刃剑姬 · 烬羽', epithet: '一层守桥挚友', color: '#e63946', spd: 90, desc: '一层守桥挚友' },
  frost_queen: { id: 'frost_queen', icon: '❄️', name: '永冻星使 · 艾丝特莉亚', epithet: '二层冰封王城之主', color: '#00bbf9', spd: 84, desc: '二层冰封之主' },
  mech_colossus: { id: 'mech_colossus', icon: '⚙️', name: '倒悬机神 · 伽蓝重装态', epithet: '三层钟楼镇守者', color: '#f77f00', spd: 78, desc: '三层重装机神' },
  void_weaver: { id: 'void_weaver', icon: '🕰️', name: '紫电弦月人偶 · 伽蓝', epithet: '三层星晷断罪少主', color: '#9d4edd', spd: 86, desc: '三层人偶少主' },
  plague_empress: { id: 'plague_empress', icon: '🍃', name: '残羽魔女 · 青羽试炼影', epithet: '秘境风语守望者', color: '#52b788', spd: 85, desc: '秘境风语魔女' },
  solar_seraph: { id: 'solar_seraph', icon: '🌑', name: '第999号 · 日蚀圣女', epithet: '终层镜中真我', color: '#ff9f1c', spd: 88, desc: '终层镜中真我' }
};
const FALLBACK_MINI_BOSS_DEFS = {
  vanguard: { id: 'vanguard', icon: '⚔️', name: '狂厄裂地统领', epithet: '重甲裂地战狂', color: '#f72585', spd: 86, desc: '重甲先锋统领' },
  pyro_lord: { id: 'pyro_lord', icon: '🔥', name: '炽焰重炮统领', epithet: '熔火轰炸督军', color: '#fb5607', spd: 80, desc: '熔火狂热统领' },
  shadow_stalker: { id: 'shadow_stalker', icon: '⚡', name: '幽影雷刃统领', epithet: '暗雷瞬刃死神', color: '#7209b7', spd: 96, desc: '极速刺客统领' },
  venom_matriarch: { id: 'venom_matriarch', icon: '🐍', name: '碧鳞剧毒统领', epithet: '翠影蛇姬督军', color: '#80ed99', spd: 84, desc: '剧毒蛇姬统领' },
  glacial_valkyrie: { id: 'glacial_valkyrie', icon: '🧊', name: '凛霜圣枪统领', epithet: '极北冰骑战姬', color: '#48cae4', spd: 92, desc: '极北冰骑统领' },
  iron_warden: { id: 'iron_warden', icon: '🛡️', name: '曜铁圣盾统领', epithet: '黑金重盾战姬', color: '#eab308', spd: 76, desc: '黑金重装统领' },
  storm_siren: { id: 'storm_siren', icon: '🌪️', name: '苍雷风暴统领', epithet: '雷鸣律动歌姬', color: '#38bdf8', spd: 90, desc: '苍雷风暴统领' }
};
const FALLBACK_SPECIAL_RELICS = [
  { id: 'blood_altar', icon: '🩸', name: '绯红血契祭坛', color: '#ff2a55', bossId: 'crimson_lord', bossIcon: '🦇', bossName: '猩红鲜血伯爵', epithet: '永夜血族真祖', bossColor: '#d90429' },
  { id: 'golden_idol', icon: '🪙', name: '黄金贪婪神像', color: '#ffd166', bossId: 'golden_golem', bossIcon: '🏆', bossName: '黄金晶石巨神', epithet: '秘宝黄金神躯', bossColor: '#f59e0b' },
  { id: 'void_cube', icon: '🌌', name: '虚空裂隙魔方', color: '#c77dff', bossId: 'abyss_devourer', bossIcon: '👾', bossName: '异次元吞噬者', epithet: '吞星奇点魔神', bossColor: '#7209b7' }
];

function getBossDefs() {
  return (typeof BOSS_DEFS !== 'undefined' && BOSS_DEFS) ? BOSS_DEFS : (globalThis.BOSS_DEFS || FALLBACK_BOSS_DEFS);
}
function getMiniBossDefs() {
  return (typeof MINI_BOSS_DEFS !== 'undefined' && MINI_BOSS_DEFS) ? MINI_BOSS_DEFS : (globalThis.MINI_BOSS_DEFS || FALLBACK_MINI_BOSS_DEFS);
}
function getSpecialRelics() {
  return (typeof SPECIAL_RELICS !== 'undefined' && Array.isArray(SPECIAL_RELICS) && SPECIAL_RELICS.length)
    ? SPECIAL_RELICS
    : (globalThis.SPECIAL_RELICS || FALLBACK_SPECIAL_RELICS);
}

function pointSegClosest(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1, vy = y2 - y1;
  const lenSq = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / lenSq));
  const cx = x1 + vx * t, cy = y1 + vy * t;
  const dx = px - cx, dy = py - cy;
  return { cx, cy, dx, dy, dSq: dx * dx + dy * dy, t };
}

// 非规则异形地形极坐标轮廓函数（熔岩三瓣裂口 / 毒沼花生曲岸 / 冰湖多棱晶湾，彻底告别正圆）
function terrainRadiusAt(tr, ang) {
  const baseR = Math.max(24, tr.r || 78);
  const s = tr.seed !== undefined ? tr.seed : 1.7;
  const rot = tr.rot !== undefined ? tr.rot : (s % 6.28);
  const a = ang - rot;
  let mod = 1;
  if (tr.kind === 'lava') {
    mod = 1 + 0.25 * Math.sin(2 * a + s * 0.7) + 0.17 * Math.cos(3 * a - s * 1.3) + 0.09 * Math.sin(5 * a + s * 2.1);
  } else if (tr.kind === 'swamp') {
    mod = 1 + 0.29 * Math.cos(2 * a + s * 0.9) + 0.16 * Math.sin(3 * a + s * 1.6) - 0.08 * Math.cos(4 * a - s * 0.5);
  } else if (tr.kind === 'ice_sheet') {
    mod = 1 + 0.22 * Math.sin(2 * a - s * 0.8) + 0.16 * Math.cos(3 * a + s * 1.4) + 0.11 * Math.cos(5 * a - s * 1.9);
  }
  return baseR * Math.max(0.56, Math.min(1.36, mod));
}

// 惰性烘焙不规则地形几何顶点与岸线装饰细节（零每帧分配，渲染与碰撞 100% 对齐）
function ensureTerrainGeometry(tr) {
  if (!tr || (tr._geoReady && tr._geoX === tr.x && tr._geoY === tr.y)) return tr;
  const s = tr.seed !== undefined ? tr.seed : 2.3;
  tr.seed = s;
  if (tr.rot === undefined) tr.rot = (s * 1.37) % (Math.PI * 2);

  if (tr.kind === 'chasm') {
    const x1 = tr.x1 !== undefined ? tr.x1 : tr.x - 95;
    const y1 = tr.y1 !== undefined ? tr.y1 : tr.y;
    const x2 = tr.x2 !== undefined ? tr.x2 : tr.x + 95;
    const y2 = tr.y2 !== undefined ? tr.y2 : tr.y;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 160;
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux;
    const baseW = Math.max(18, tr.r || 30);
    // 6 段折线锯齿断层主脊（两端尖削收窄如大地撕裂口，中段犬牙交错）
    const steps = 6;
    const spine = [];
    for (let k = 0; k <= steps; k++) {
      const f = k / steps;
      const midEnvelope = Math.sin(f * Math.PI);
      const kink = (k === 0 || k === steps) ? 0 : Math.sin(s * 2.3 + k * 2.15) * (baseW * 0.62) * midEnvelope;
      const wScale = (k === 0 || k === steps) ? 0.18 : (0.58 + 0.56 * midEnvelope + 0.14 * Math.cos(s + k * 1.9));
      spine.push({
        x: x1 + dx * f + nx * kink,
        y: y1 + dy * f + ny * kink,
        w: baseW * wScale
      });
    }
    tr.spine = spine;
    tr.halfLen = Math.max(tr.halfLen || 0, len * 0.55 + baseW);
    const buildRim = (widthMul, jitterAmp) => {
      const pts = [];
      for (let k = 0; k <= steps; k++) {
        const p = spine[k];
        const jit = (k === 0 || k === steps) ? 0 : Math.sin(s * 3.1 + k * 2.7) * jitterAmp;
        pts.push({ x: p.x + nx * (p.w * widthMul + jit), y: p.y + ny * (p.w * widthMul + jit) });
      }
      for (let k = steps; k >= 0; k--) {
        const p = spine[k];
        const jit = (k === 0 || k === steps) ? 0 : Math.cos(s * 2.7 + k * 2.3) * jitterAmp;
        pts.push({ x: p.x - nx * (p.w * widthMul + jit), y: p.y - ny * (p.w * widthMul + jit) });
      }
      return pts;
    };
    tr.outerCliff = buildRim(1.36, 6.5);
    tr.midCliff = buildRim(1.06, 4.2);
    tr.abyssPoly = buildRim(0.74, 3.4);
    // 裂谷边缘延伸的地表细碎裂纹分支
    tr.cracks = [];
    for (let c = 1; c < steps; c += 2) {
      const sp = spine[c];
      const side = (c % 4 === 1) ? 1 : -1;
      const ca = Math.atan2(ny * side, nx * side) + Math.sin(s + c) * 0.45;
      const cl = baseW * (1.45 + (c % 2) * 0.3);
      const sx0 = sp.x + nx * side * sp.w * 0.9;
      const sy0 = sp.y + ny * side * sp.w * 0.9;
      const mx = sp.x + Math.cos(ca + 0.22) * (cl * 0.58);
      const my = sp.y + Math.sin(ca + 0.22) * (cl * 0.58);
      const ex = sp.x + Math.cos(ca - 0.18) * cl;
      const ey = sp.y + Math.sin(ca - 0.18) * cl;
      tr.cracks.push({ x0: sx0, y0: sy0, x1: sx0, y1: sy0, mx, my, xm: mx, ym: my, x2: ex, y2: ey });
    }
    tr._geoX = tr.x; tr._geoY = tr.y;
    tr._geoReady = true;
    return tr;
  }

  // 不规则池沼/冰湖轮廓点集
  const n = tr.kind === 'ice_sheet' ? 16 : (tr.kind === 'lava' ? 22 : 20);
  const verts = [];
  let maxR = tr.r || 78;
  for (let k = 0; k < n; k++) {
    const ang = (k / n) * Math.PI * 2;
    let rad = terrainRadiusAt(tr, ang);
    if (tr.kind === 'lava') {
      // 熔岩池增加犬牙交错的玄武岩裂齿感
      rad *= (k % 2 === 0 ? 1.06 : 0.92);
    } else if (tr.kind === 'ice_sheet') {
      // 冰湖呈现棱晶折角尖角切面
      rad *= (k % 4 === 0 ? 1.14 : (k % 2 === 0 ? 0.88 : 0.97));
    }
    if (rad > maxR) maxR = rad;
    const ux = Math.cos(ang), uy = Math.sin(ang);
    verts.push({ ang, rad, ux, uy, x: tr.x + ux * rad, y: tr.y + uy * rad });
  }
  tr.verts = verts;
  tr.boundR = maxR + 18;
  if (tr.kind === 'lava') {
    tr.crusts = [];
    for (let c = 0; c < 4; c++) {
      const ca = tr.rot + c * 1.57 + 0.42;
      const crd = (tr.r || 80) * (0.28 + (c % 2) * 0.22);
      tr.crusts.push({
        x: tr.x + Math.cos(ca) * crd,
        y: tr.y + Math.sin(ca) * crd,
        sz: 7 + (c % 3) * 3.5,
        rot: ca * 0.7 + s
      });
    }
  } else if (tr.kind === 'swamp') {
    tr.shoals = [];
    for (let sh = 0; sh < 3; sh++) {
      const sa = tr.rot + sh * 2.09 + 0.55;
      const er = terrainRadiusAt(tr, sa);
      tr.shoals.push({
        x: tr.x + Math.cos(sa) * (er * 1.06),
        y: tr.y + Math.sin(sa) * (er * 1.06),
        rx: 18 + sh * 5,
        ry: 11 + (sh % 2) * 4,
        rot: sa + 1.25
      });
    }
  }
  tr._geoX = tr.x; tr._geoY = tr.y;
  tr._geoReady = true;
  return tr;
}

function isPointInTerrain(tr, px, py, pad = 0) {
  if (!tr || tr.kind === 'chasm') return false;
  ensureTerrainGeometry(tr);
  const dx = px - tr.x, dy = py - tr.y;
  const maxB = (tr.boundR || (tr.r || 78) * 1.4) + pad;
  if (dx * dx + dy * dy > maxB * maxB) return false;
  const d = Math.hypot(dx, dy);
  if (d <= (tr.r || 70) * 0.50 + pad) return true;
  const ang = Math.atan2(dy, dx);
  return d < terrainRadiusAt(tr, ang) + pad;
}

function closestOnChasm(tr, px, py) {
  ensureTerrainGeometry(tr);
  if (tr.spine && tr.spine.length >= 2) {
    let best = null;
    for (let s = 0; s < tr.spine.length - 1; s++) {
      const a = tr.spine[s], b = tr.spine[s + 1];
      const seg = pointSegClosest(px, py, a.x, a.y, b.x, b.y);
      const localW = a.w + (b.w - a.w) * seg.t;
      const gap = Math.sqrt(seg.dSq) - localW;
      if (!best || gap < best.gap) {
        best = { ...seg, localW, gap };
      }
    }
    return best;
  }
  const seg = pointSegClosest(px, py, tr.x1, tr.y1, tr.x2, tr.y2);
  const localW = tr.r || 30;
  return { ...seg, localW, gap: Math.sqrt(seg.dSq) - localW };
}

function isBlockedByTerrain(x, y, pad = 28) {
  if (typeof terrains !== 'undefined') {
    for (let i = 0; i < terrains.length; i++) {
      const tr = terrains[i];
      if (tr.kind === 'chasm') {
        const hit = closestOnChasm(tr, x, y);
        if (hit && hit.gap < pad) return true;
      } else if (tr.kind === 'lava') {
        if (isPointInTerrain(tr, x, y, pad * 0.7)) return true;
      }
    }
  }
  if (typeof portals !== 'undefined') {
    for (let i = 0; i < portals.length; i++) {
      const p = portals[i];
      const minR = (p.r || 36) + pad;
      if ((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) < minR * minR) return true;
    }
  }
  return false;
}

function pushOutOfChasms(ent) {
  if (!ent || typeof terrains === 'undefined' || !terrains.length) return;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < terrains.length; i++) {
      const tr = terrains[i];
      if (tr.kind !== 'chasm') continue;
      const hit = closestOnChasm(tr, ent.x, ent.y);
      if (!hit) continue;
      const minD = hit.localW + (ent.r || 16);
      if (hit.dSq < minD * minD) {
        const d = Math.sqrt(hit.dSq) || 0.01;
        const nx = d > 0.05 ? hit.dx / d : 0;
        const ny = d > 0.05 ? hit.dy / d : -1;
        ent.x = hit.cx + nx * minD;
        ent.y = hit.cy + ny * minD;
      }
    }
  }
}

function makeRiftPortal(id, label, x, y, color, phaseOffset = 0) {
  const shards = [];
  for (let k = 0; k < 5; k++) {
    shards.push({
      ang: phaseOffset + k * ((Math.PI * 2) / 5) + 0.25,
      dist: 36 + (k % 2) * 7,
      len: 10 + (k % 3) * 3,
      tilt: (k % 2 === 0 ? 0.35 : -0.35)
    });
  }
  return { id, label, x, y, r: 36, pulse: phaseOffset, color, shards };
}

// 一图一专属异形地形生成（每张地图仅刷出 1 处符合生态气质的不规则标志地形，视觉清爽且战术鲜明）
function spawnArenaTerrains() {
  terrains = [];
  portals = [];
  portalPairCd = 0;
  const cx = WORLD.w * 0.5, cy = WORLD.h * 0.5;
  const scId = (curScene && curScene.id) || 'wasteland';

  const pickSingleLandmarkSpot = (minCenter = 235, wallPad = 235) => {
    for (let tries = 0; tries < 28; tries++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = minCenter + 35 + Math.random() * 145;
      const x = Math.max(wallPad, Math.min(WORLD.w - wallPad, cx + Math.cos(ang) * dist));
      const y = Math.max(wallPad, Math.min(WORLD.h - wallPad, cy + Math.sin(ang) * dist));
      if (Math.hypot(x - cx, y - cy) >= minCenter * 0.85) return { x, y };
    }
    return { x: Math.min(WORLD.w - wallPad, cx + 260), y: cy };
  };

  if (scId === 'wasteland') {
    // 🌑 紫晶废土唯一专属地形：A ↔ B 菱晶撕裂虚空传送门（成对连通，1 套空间机关）
    const diag = Math.random() < 0.5 ? 1 : -1;
    const ox = Math.min(440, WORLD.w * 0.24) + (Math.random() - 0.5) * 70;
    const oy = Math.min(285, WORLD.h * 0.22) + (Math.random() - 0.5) * 60;
    const p1x = Math.max(165, Math.min(WORLD.w - 165, cx - ox));
    const p1y = Math.max(165, Math.min(WORLD.h - 165, cy - oy * diag));
    const p2x = Math.max(165, Math.min(WORLD.w - 165, cx + ox));
    const p2y = Math.max(165, Math.min(WORLD.h - 165, cy + oy * diag));
    portals.push(
      makeRiftPortal(0, 'A', p1x, p1y, '#c77dff', 0),
      makeRiftPortal(1, 'B', p2x, p2y, '#4cc9f0', Math.PI)
    );
  } else if (scId === 'desert') {
    // 🏜️ 赤砂荒原唯一专属地形：1 道折线锯齿断层大裂谷
    const sp = pickSingleLandmarkSpot(250, 260);
    const ang = Math.random() * Math.PI;
    const halfLen = 112 + Math.random() * 26;
    terrains.push(ensureTerrainGeometry({
      kind: 'chasm',
      x: sp.x, y: sp.y,
      x1: sp.x - Math.cos(ang) * halfLen, y1: sp.y - Math.sin(ang) * halfLen,
      x2: sp.x + Math.cos(ang) * halfLen, y2: sp.y + Math.sin(ang) * halfLen,
      ang, halfLen, r: 32, seed: 1.2 + Math.random() * 60
    }));
  } else if (scId === 'glacier') {
    // ❄️ 极寒冰窟唯一专属地形：1 片多棱碎晶寒霜冰湖
    const sp = pickSingleLandmarkSpot(230, 240);
    terrains.push(ensureTerrainGeometry({
      kind: 'ice_sheet', x: sp.x, y: sp.y,
      r: 102 + Math.round(Math.random() * 14),
      pulse: Math.random() * 6.28, seed: 1.5 + Math.random() * 60
    }));
  } else if (scId === 'foundry') {
    // ⚙️ 机械熔炉唯一专属地形：1 处多瓣玄武岩裂地熔岩火池
    const sp = pickSingleLandmarkSpot(240, 235);
    terrains.push(ensureTerrainGeometry({
      kind: 'lava', x: sp.x, y: sp.y,
      r: 86 + Math.round(Math.random() * 12),
      pulse: Math.random() * 6.28, seed: 1.8 + Math.random() * 60
    }));
  } else {
    // 🍄 荧光菌丛唯一专属地形：1 片曲岸荧光毒菇腐殖泥沼
    const sp = pickSingleLandmarkSpot(235, 240);
    terrains.push(ensureTerrainGeometry({
      kind: 'swamp', x: sp.x, y: sp.y,
      r: 94 + Math.round(Math.random() * 12),
      pulse: Math.random() * 6.28, seed: 2.1 + Math.random() * 60
    }));
  }
}

function spawnTree() {
  if (trees.length >= 4) return;
  let tx = WORLD.w * 0.5, ty = WORLD.h * 0.5;
  for (let tries = 0; tries < 14; tries++) {
    tx = 115 + Math.random() * Math.max(120, WORLD.w - 230);
    ty = 115 + Math.random() * Math.max(120, WORLD.h - 230);
    if ((!player || Math.hypot(tx - player.x, ty - player.y) > 155) && !isBlockedByTerrain(tx, ty, 32)) break;
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
    let cratesOnMap = 0;
    for (let di = 0; di < drops.length; di++) if (drops[di].kind === 'crate') cratesOnMap++;
    const maxWaveCrates = 1 + (luck >= 60 ? 1 : 0);
    const crateChance = Math.min(0.16, 0.05 + luck * 0.0014);
    if (waveCratesDropped < maxWaveCrates && cratesOnMap < 2 && Math.random() < crateChance) {
      waveCratesDropped++;
      drops.push({ x: tr.x, y: tr.y, kind: 'crate', bob: 0 });
      addText(tr.x, tr.y - 34, '🎁 战利品箱!', '#ffd166', 16, 1.65, true);
    } else if (Math.random() < Math.min(0.80, 0.52 + luck * 0.004)) {
      drops.push({ x: tr.x, y: tr.y, kind: 'heal', bob: 0 });
    }
  }
}

// 16 层固定幕守誓首领映射：第 4 / 8 / 12 / 16 层严格固定，绝不随机；无尽模式 (17层+) 按四幕轮转
const FIXED_ACT_BOSS_BY_WAVE = {
  4: 'butcher',       // 第一幕终战（第 4 层）：绯红断刃剑姬 · 烬羽
  8: 'frost_queen',   // 第二幕终战（第 8 层）：永冻星使 · 艾丝特莉亚
  12: 'void_weaver',  // 第三幕终战（第 12 层）：紫电弦月人偶 · 伽蓝
  16: 'solar_seraph'  // 第四幕终局（第 16 层）：第999号 · 日蚀圣女
};
const ENDLESS_ACT_BOSS_ROTATION = ['butcher', 'frost_queen', 'void_weaver', 'solar_seraph'];

function getFixedActBossForWave(w) {
  const wn = Math.max(1, Math.floor(w || 1));
  if (FIXED_ACT_BOSS_BY_WAVE[wn]) return FIXED_ACT_BOSS_BY_WAVE[wn];
  const cycleIdx = Math.max(0, Math.floor(wn / 4) - 1) % ENDLESS_ACT_BOSS_ROTATION.length;
  return ENDLESS_ACT_BOSS_ROTATION[cycleIdx];
}

// 幕中固定先锋统领（第 6 / 10 / 14 层各幕中段试炼固定守备，绝不乱入主线 Boss）
function getFixedMiniBossForWave(w, secondSlot = false) {
  const wn = Math.max(1, Math.floor(w || 1));
  if (wn <= 8) return secondSlot ? 'pyro_lord' : 'glacial_valkyrie';
  if (wn <= 12) return secondSlot ? 'storm_siren' : 'shadow_stalker';
  if (wn <= 16) return secondSlot ? 'vanguard' : 'iron_warden';
  return pickMiniBossVariant(secondSlot ? lastMiniBossVariant : '');
}
globalThis.getFixedActBossForWave = getFixedActBossForWave;
globalThis.getFixedMiniBossForWave = getFixedMiniBossForWave;

function pickBossVariant(exclude = '') {
  const defs = getBossDefs();
  const keys = Object.keys(defs);
  const pool = keys.filter(k => k !== exclude && k !== lastBossVariant);
  const use = pool.length ? pool : keys.filter(k => k !== exclude);
  return use[Math.floor(Math.random() * use.length)] || keys[0] || 'butcher';
}

function pickMiniBossVariant(exclude = '') {
  const defs = getMiniBossDefs();
  const keys = Object.keys(defs);
  const pool = keys.filter(k => k !== exclude && k !== lastMiniBossVariant);
  const use = pool.length ? pool : keys.filter(k => k !== exclude);
  return use[Math.floor(Math.random() * use.length)] || keys[0] || 'vanguard';
}

// 地图稀有奇遇圣物生成与特殊 Boss 召唤逻辑
function spawnSpecialRelic(forceId = null) {
  if (relics.length >= 1) return null;
  const relPool = getSpecialRelics();
  const def = forceId ? (relPool.find(r => r.id === forceId) || relPool[0]) : relPool[Math.floor(Math.random() * relPool.length)];
  let rx = WORLD.w * 0.5, ry = WORLD.h * 0.5;
  for (let tries = 0; tries < 16; tries++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 230 + Math.random() * 160;
    rx = Math.max(120, Math.min(WORLD.w - 120, (player ? player.x : WORLD.w * 0.5) + Math.cos(ang) * dist));
    ry = Math.max(120, Math.min(WORLD.h - 120, (player ? player.y : WORLD.h * 0.5) + Math.sin(ang) * dist));
    if ((!player || Math.hypot(rx - player.x, ry - player.y) > 175) && !isBlockedByTerrain(rx, ry, 52)) break;
  }
  const rel = { x: rx, y: ry, r: 44, def, charge: 0, need: 1.1, pulse: 0 };
  relics.push(rel);
  if (rings.length < 40) rings.push({ x: rx, y: ry, r: 85, color: def.color, t: 0.45, maxT: 0.45 });
  beep(740, 0.12, 'triangle', 0.06);
  if (player) addText(player.x, player.y - 54, `✨ 奇遇现世：${def.icon}${def.name}！`, '#ffd166', 18, 2.6);
  announce(`✨ 地图刷新奇遇【${def.icon}${def.name}】！跟随边缘箭头站入可召唤首领`, '#ffd166', 4.2);
  logInfo('RELIC', `刷新地图奇遇圣物 ${def.name}(${def.id}) at (${Math.round(rx)},${Math.round(ry)})`);
  return rel;
}

// 全屏首领登场 / 隐藏二阶段觉醒切入特写触发器（33% 概率触发，每种首领单局独立上限 1 次，绝不阻塞后期/无尽新首领立绘）
const RARE_PORTRAIT_RATE = 0.33;
function shouldRollRareBossPortrait(variantKey = '', forceCutscene = false) {
  if (typeof variantKey === 'boolean') {
    forceCutscene = variantKey;
    variantKey = '';
  }
  const vKey = String(variantKey || 'default_boss');
  if (forceCutscene) {
    if (player) {
      if (!player.shownBossPortraits) player.shownBossPortraits = {};
      player.shownBossPortraits[vKey] = true;
      player.rarePortraitShown = true;
    }
    return true;
  }
  if (!player) return false;
  if (!player.shownBossPortraits) player.shownBossPortraits = {};
  if (player.shownBossPortraits[vKey]) return false;
  if (Math.random() < RARE_PORTRAIT_RATE) {
    player.shownBossPortraits[vKey] = true;
    player.rarePortraitShown = true;
    return true;
  }
  return false;
}

function startBossCutscene(mode, variant, title, subtitle, extraTag = '', color = '#ff4d6d', accent = '#ffd166', dur = 3.8, extra = null) {
  bossCutscene = Object.assign({ t: dur, maxT: dur, mode, variant, title, subtitle, extraTag, color, accent }, extra || {});
  if (player) player.invuln = Math.max(player.invuln || 0, dur + 0.35);
  if (typeof SpireAudio !== 'undefined') SpireAudio.playCutsceneCue(variant, mode === 'mythic_phase2');
}

// 首领战斗中动态改造战场地形（严格上限 ≤2 处异形地形，不拥挤不圆形）
function spawnBossTerrain(kind, x, y, baseR = 68) {
  if (typeof terrains === 'undefined') return;
  while (terrains.length >= 2) {
    terrains.pop();
  }
  const cx = Math.max(185, Math.min(WORLD.w - 185, x));
  const cy = Math.max(185, Math.min(WORLD.h - 185, y));
  if (kind === 'chasm') {
    let tx = cx, ty = cy;
    if (player && Math.hypot(tx - player.x, ty - player.y) < 120) {
      const pushA = Math.atan2(ty - player.y, tx - player.x) || 0;
      tx = Math.max(195, Math.min(WORLD.w - 195, player.x + Math.cos(pushA) * 145));
      ty = Math.max(195, Math.min(WORLD.h - 195, player.y + Math.sin(pushA) * 145));
    }
    const ang = Math.random() * Math.PI;
    const halfLen = 84 + Math.random() * 24;
    terrains.push(ensureTerrainGeometry({
      kind: 'chasm', x: tx, y: ty,
      x1: tx - Math.cos(ang) * halfLen, y1: ty - Math.sin(ang) * halfLen,
      x2: tx + Math.cos(ang) * halfLen, y2: ty + Math.sin(ang) * halfLen,
      ang, halfLen, r: 30, seed: Math.random() * 100
    }));
    if (rings.length < 40) rings.push({ x: tx, y: ty, r: 95, color: '#c77dff', t: 0.35, maxT: 0.35, fill: true });
    announce('🕳️ 首领撕裂大地！战场新增异形【断层裂谷】', '#c77dff', 2.6);
  } else {
    const col = kind === 'lava' ? '#ff6b35' : (kind === 'ice_sheet' ? '#72efdd' : '#a3e635');
    terrains.push(ensureTerrainGeometry({ kind, x: cx, y: cy, r: baseR, pulse: 0, seed: Math.random() * 100 }));
    if (rings.length < 40) rings.push({ x: cx, y: cy, r: baseR + 20, color: col, t: 0.35, maxT: 0.35, fill: true });
    const nameMap = { lava: '🌋 首领倾泻异形【熔岩火口】改造地形！', swamp: '🧪 首领喷涌异形【剧毒菌沼】污染地面！', ice_sheet: '🧊 首领凝结多棱【寒霜冰镜】冰封战场！' };
    if (nameMap[kind]) announce(nameMap[kind], col, 2.6);
  }
}

function summonSpecialBoss(rel, forceCutscene = false) {
  if (!rel || !rel.def) return;
  const def = rel.def;
  beep(185, 0.26, 'sawtooth', 0.085);
  if (rings.length < 40) rings.push({ x: rel.x, y: rel.y, r: 165, color: def.bossColor, t: 0.42, maxT: 0.42, fill: true });
  if (lightnings.length < 35) {
    lightnings.push({ pts: [{ x: rel.x, y: Math.max(20, rel.y - 280) }, { x: rel.x - 18, y: rel.y - 130 }, { x: rel.x + 14, y: rel.y - 55 }, { x: rel.x, y: rel.y }], color: def.color, t: 0.32, maxT: 0.32 });
  }
  waveTime = Math.min(95, waveTime + 25);
  waveMaxTime = Math.max(waveMaxTime, waveTime);
  spawnWarning(rel.x, rel.y, 'special_boss', def.bossId);
  const bw = document.getElementById('bossBarWrap');
  if (bw) { bw.classList.remove('hidden', 'mythic'); }
  if (player) {
    player.invuln = Math.max(player.invuln || 0, 0.75);
    addText(player.x, player.y - 54, `${def.bossIcon} 特殊首领【${def.bossName}】降临！`, '#ffd166', 20, 2.6);
  }
  const showRarePortrait = shouldRollRareBossPortrait(def.bossId, forceCutscene);
  if (showRarePortrait) {
    startBossCutscene(
      'summon',
      def.bossId,
      def.bossName,
      `🏮 记忆祭坛共鸣 · ${def.icon}${def.name}唤醒`,
      '⏱️ 轮回延长 +25s · 贴近风眼可躲外环斩 · 击败必掉守誓遗物匣！',
      def.bossColor,
      def.color,
      4.2
    );
  }
  announce(`${def.bossIcon} 特殊首领【${def.bossName}】已唤醒！本波时间延长 +25s`, '#ffd166', 4.0);
  logInfo('SPECIAL_BOSS', `召唤特殊首领 ${def.bossName}(${def.bossId}) · 立绘特写=${showRarePortrait} · 延长回合至 ${Math.ceil(waveTime)}s`);
}

function beginWave(retryMeta = null) {
  state = 'wave';
  if (typeof beginSpireFloor === 'function') beginSpireFloor(wave, !!(retryMeta && retryMeta.isRetry));
  inHurtPlayer = false;
  shake = 0;
  resetJoy();
  confirmSellIdx = -1;
  overtime = false;
  overtimeMeteorT = 1.6;
  syncSetHp();

  const isRetry = !!(retryMeta && retryMeta.isRetry);
  const isStoryClimb = !endlessMode && wave <= MAX_WAVE;
  // 严格每 4 层固定首领战（第 4 / 8 / 12 / 16 层，以及无尽模式 4 / 8 / 12 / 16 / 20... 层）
  const isBossWave = (wave >= 4 && wave % 4 === 0);
  const isEliteWave = !isBossWave && diff.midElite && (
    (isStoryClimb && (wave === 6 || wave === 10 || wave === 14)) ||
    (endlessMode && wave >= 6 && wave % 4 === 2)
  );
  hordeWave = !isBossWave && !isEliteWave && (
    (isStoryClimb && (wave === 3 || wave === 7 || wave === 11 || wave === 15)) ||
    (endlessMode && wave >= 3 && wave % 4 === 3)
  );

  // 按四幕固定锁定异星灰塔生态并烘焙离屏大地图贴图（战败重开本回合时保持同一生态场景）
  if (isRetry && retryMeta.sceneId) {
    curScene = SCENES.find(s => s.id === retryMeta.sceneId) || SCENES[0];
    sceneSeed = (wave * 7919 + curScene.id.charCodeAt(0) * 313 + (Date.now() & 0xffff)) >>> 0;
  } else {
    pickSceneForWave(wave);
  }
  if (typeof SpireAudio !== 'undefined') SpireAudio.syncScene(curScene.id);
  syncArenaAndZoom(true);
  // 16 层平滑回合时长：第 1 层 20s 起步，逐层递增至 58s，第 4/8/12 层首领战 90s，第 16 层终局决战 95s
  waveTime = isBossWave ? (wave === MAX_WAVE ? 95 : 90) : Math.min(58, 18 + Math.round(wave * 2.6));
  waveMaxTime = waveTime;
  lastUrgentSec = -1;
  spawnAcc = 0.25;
  hudAcc = 1;
  player.x = WORLD.w / 2; player.y = WORLD.h / 2;
  player.chillSlowT = 0; player.inSpore = false;
  player.lavaExposure = 0; player.lavaTick = 0; player.terrainHintT = 0; player.terrainSpdMul = 1;
  player.waveMythicAwakened = false;
  cam.x = player.x; cam.y = player.y;
  clampCam();
  player.hp = player.maxHp;
  player.shield = player.maxShield;
  player.shieldRegenT = 7;
  player.mineCd = 1.25;
  enemies = []; bullets = []; eBullets = []; hazards = []; drops = []; spawns = []; turrets = []; mines = []; rings = []; trees = [];
  relics = []; sporeZones = []; banners = []; bossCutscene = null; sandGustT = 0;
  texts = []; particles = []; sparks = []; lightnings = []; slashes = []; beams = []; stains = []; shells = [];

  // 保存本回合开战前快照（供阵亡后「重新开始本回合」无损回溯使用）
  if (typeof saveWaveCheckpoint === 'function') {
    saveWaveCheckpoint({ sceneId: curScene ? curScene.id : 'wasteland' });
  }

  // 生成当前生态唯一专属异形地形（一图仅一处异形特殊地形）
  spawnArenaTerrains();

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

  // 1~16 层主线剧情攀登期间禁用随机奇遇首领祭坛（确保首领 100% 仅在第 4/8/12/16 层固定登场，无尽模式开放奇遇祭坛）
  const relicChance = (endlessMode && wave >= 3 && !isBossWave) ? Math.min(0.36, 0.20 + (player.luck || 0) * 0.0025) : 0;
  relicSpawnT = Math.random() < relicChance ? (3.5 + Math.random() * 3.5) : -1;

  const portalNote = portals.length >= 2 ? ' · 🌀双生晶裂门已开启' : '';
  const waveIntro = `${curScene.icon} 第 ${wave} 层：${curScene.name}${activeSceneEvent ? ' · ' + curScene.eventIcon + curScene.eventName : ''}${portalNote}`;
  logInfo('WAVE', `进入第 ${wave} 层 (${waveTime}s) · 场景=${curScene.name}(${curScene.id}) · 首领层=${isBossWave} · 地形=${terrains.length}处+传送门=${portals.length} · 专属怪=${sceneMobEnabled} · 异象=${activeSceneEvent || '无'} · 地图=${WORLD.w}x${WORLD.h}`);
  announce(waveIntro, curScene.accent2 || '#ffd166', 3.4);

  // 部署自动防御炮台与浮游激光塔（机械师天赋 + 扳手 + 无人机舱 + 工程装备）
  const wrenches = player.weapons.filter(w => w.id === 'wrench');
  const droneBays = player.weapons.filter(w => w.id === 'drone_bay');
  const bulletTurrets = (player.bonusTurrets || 0) + wrenches.length;
  const laserTurrets = (player.laserTurrets || 0) + droneBays.length;
  const totalT = bulletTurrets + laserTurrets;
  for (let i = 0; i < totalT; i++) {
    const a = (i / Math.max(1, totalT)) * Math.PI * 2;
    const dist = 115 + (i % 2) * 52;
    const isLaser = i >= bulletTurrets;
    const laserIdx = i - bulletTurrets;
    const tier = isLaser
      ? (laserIdx < droneBays.length ? droneBays[laserIdx].tier : 2)
      : (i < wrenches.length ? wrenches[i].tier : 1);
    turrets.push({
      x: WORLD.w / 2 + Math.cos(a) * dist, y: WORLD.h / 2 + Math.sin(a) * dist,
      kind: isLaser ? 'laser' : 'bullet',
      tier, cd: 0.25 + Math.random() * 0.3, angle: 0, recoil: 0
    });
  }

  // 16 层固定四幕首领（第 4/8/12/16 层非随机单挑守誓之战）与无尽轮回多王挑战
  const bossDefs = getBossDefs();
  const miniBossDefs = getMiniBossDefs();
  const bossY = Math.max(190, player.y - 320);
  const bossSpread = Math.min(220, WORLD.w * 0.23);
  const savedIds = (isRetry && Array.isArray(retryMeta.waveBossIds) && retryMeta.waveBossIds.length > 0) ? retryMeta.waveBossIds : null;
  const hasDirector = (typeof SpireDirector !== 'undefined' && SpireDirector && typeof SpireDirector.onWaveStart === 'function');
  let spawnedPrimaryBossId = '';

  if (isBossWave) {
    const fixedBossId = getFixedActBossForWave(wave);
    const v1 = isStoryClimb
      ? fixedBossId
      : ((savedIds && bossDefs[savedIds[0]]) ? savedIds[0] : fixedBossId);
    spawnedPrimaryBossId = v1;
    lastBossVariant = v1;
    const b1 = bossDefs[v1] || FALLBACK_BOSS_DEFS.butcher;
    const allowEndlessTwinBoss = !isStoryClimb && (diff.doubleBoss || (endlessMode && wave >= 20));
    if (allowEndlessTwinBoss) {
      const v2 = (savedIds && savedIds[1] && bossDefs[savedIds[1]]) ? savedIds[1] : pickBossVariant(v1);
      const b2 = bossDefs[v2] || FALLBACK_BOSS_DEFS.frost_queen;
      if (typeof waveCheckpoint !== 'undefined' && waveCheckpoint) waveCheckpoint.waveBossIds = [v1, v2];
      spawnWarning(WORLD.w / 2 - bossSpread, bossY, 'boss', v1);
      spawnWarning(WORLD.w / 2 + bossSpread, bossY, 'boss', v2);
      if (!hasDirector) {
        let shownVar = '';
        if (shouldRollRareBossPortrait(v1, false)) shownVar = v1;
        else if (shouldRollRareBossPortrait(v2, false)) shownVar = v2;
        if (shownVar) {
          const bShown = shownVar === v2 ? b2 : b1;
          startBossCutscene('final_boss', shownVar, `${b1.name} & ${b2.name}`, `🕯️ 守誓主宰降临 · ${bShown.epithet || '无尽双主宰同台'}`, '⚔️ 贴近风眼可躲避外环大招 · 抓住破绽窗口斩破封印！', bShown.color, '#ffd166', 4.2);
        }
      }
      announce(`👑 无尽双主宰降临：${b1.name} & ${b2.name}！`, '#ff4d6d', 4.0);
    } else {
      if (typeof waveCheckpoint !== 'undefined' && waveCheckpoint) waveCheckpoint.waveBossIds = [v1];
      spawnWarning(WORLD.w / 2, bossY, 'boss', v1);
      if (!hasDirector && shouldRollRareBossPortrait(v1, isStoryClimb)) {
        startBossCutscene('final_boss', v1, b1.name, `🕯️ 第 ${wave} 层守誓之主 · ${b1.epithet || '守层主宰降临'}`, '⚔️ 贴近风眼可躲避外环大招 · 抓住破绽窗口斩破封印！', b1.color, '#ffd166', 4.2);
      }
      announce(`👑 第 ${wave} 层守誓之主【${b1.icon}${b1.name}】降临！`, '#ff4d6d', 4.0);
    }
  } else if (isEliteWave) {
    const m1 = isStoryClimb
      ? getFixedMiniBossForWave(wave, false)
      : ((savedIds && miniBossDefs[savedIds[0]]) ? savedIds[0] : pickMiniBossVariant());
    lastMiniBossVariant = m1;
    const mb1 = miniBossDefs[m1] || FALLBACK_MINI_BOSS_DEFS.vanguard;
    if (diff.dualElite && wave >= 10) {
      const m2 = isStoryClimb
        ? getFixedMiniBossForWave(wave, true)
        : ((savedIds && savedIds[1] && miniBossDefs[savedIds[1]]) ? savedIds[1] : pickMiniBossVariant(m1));
      const mb2 = miniBossDefs[m2] || FALLBACK_MINI_BOSS_DEFS.pyro_lord;
      if (typeof waveCheckpoint !== 'undefined' && waveCheckpoint) waveCheckpoint.waveBossIds = [m1, m2];
      spawnWarning(WORLD.w / 2 - bossSpread * 0.88, bossY, 'mini_boss', m1);
      spawnWarning(WORLD.w / 2 + bossSpread * 0.88, bossY, 'mini_boss', m2);
      announce(`⚔️ 幕中双统领镇守：${mb1.name} & ${mb2.name}！`, '#f72585', 3.6);
    } else {
      if (typeof waveCheckpoint !== 'undefined' && waveCheckpoint) waveCheckpoint.waveBossIds = [m1];
      spawnWarning(WORLD.w / 2, bossY, 'mini_boss', m1);
      announce(`⚔️ 幕中先锋统领【${mb1.icon}${mb1.name}】现身！`, '#f72585', 3.6);
    }
  } else if (hordeWave) {
    announce('⚠️ 幕末高密残响潮涌！注意拉扯走位', '#ff9f1c', 3.4);
  }
  if (isRetry && player) {
    addText(player.x, player.y - 46, `⏪ 已回溯至第 ${wave} 层起点！`, '#72efdd', 16, 1.9, true);
  }

  document.getElementById('shopMenu').classList.add('hidden');
  document.getElementById('levelMenu').classList.add('hidden');
  const cm = document.getElementById('crateMenu');
  if (cm) cm.classList.add('hidden');
  const cxm = document.getElementById('codexModal');
  if (cxm) cxm.classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  const bwWrap = document.getElementById('bossBarWrap');
  if (bwWrap) {
    bwWrap.classList.remove('mythic');
    bwWrap.classList.toggle('hidden', !(isBossWave || isEliteWave));
  }

  // 触发《烬塔残响》剧情演出导演：幕间转场 / 首领登场 CG / 左侧半身立绘 AVG 对话
  if (hasDirector) {
    SpireDirector.onWaveStart(wave, curScene, spawnedPrimaryBossId, isRetry);
  }
}

function spawnWarning(x, y, type, variant = '') {
  let sx = x, sy = y;
  if (type !== 'boss' && type !== 'mini_boss' && type !== 'special_boss' && typeof terrains !== 'undefined') {
    const dummy = { x: sx, y: sy, r: 18 };
    pushOutOfChasms(dummy);
    sx = Math.max(60, Math.min(WORLD.w - 60, dummy.x));
    sy = Math.max(60, Math.min(WORLD.h - 60, dummy.y));
  }
  spawns.push({ x: sx, y: sy, type, variant, t: 0.90, maxT: 0.90 });
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

  const exclProb = (curScene.exclMob && RANGED_ENEMY_TYPES.has(curScene.exclMob)) ? 0.055 : 0.11;
  if (sceneMobEnabled && curScene.exclMob && Math.random() < exclProb) {
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

// 地面高危轰炸预警圈（支持迫击虫、主宰陨石、外环内圈安全风眼轰炸 innerSafeR 与紫晶流星）
function spawnHazard(x, y, r, dmg, delay = 1.22, extra = {}) {
  const cx = Math.max(r + 12, Math.min(WORLD.w - r - 12, x));
  const cy = Math.max(r + 12, Math.min(WORLD.h - r - 12, y));
  hazards.push({
    x: cx, y: cy, r,
    innerSafeR: extra.innerSafeR || 0,
    dmg: Math.max(3, Math.round(dmg)),
    enemyDmg: extra.enemyDmg || 0,
    dropMat: extra.dropMat || 0,
    color: extra.color || '#ff3b6b',
    t: delay, maxT: delay
  });
}

// 全异星怪物、4 大新增特异兵种、5 大场景专属怪、随机精英统领、4 大主宰 Boss 与 3 大奇遇首领生成
// （全面拉开不同怪物在体型 r、血量 hp、移速 spd 与伤害 dmg 上的生态差异，增强首领压迫感并兼顾近战博弈）
function createEnemy(x, y, type, variant = '') {
  const endlessMul = wave > MAX_WAVE ? Math.pow(1.22, wave - MAX_WAVE) : 1;
  const wIdx = Math.max(0, wave - 1);
  // 适配 1~16 层四幕成长曲线：前期顺畅破敌，中后期第 8/12/16 层稳步递进，不膨胀卡关
  const clampedStoryIdx = Math.min(15, wIdx);
  const s = (1 + clampedStoryIdx * 0.165 + Math.pow(Math.max(0, clampedStoryIdx - 2), 1.66) * 0.115) * endlessMul * diff.hpMul;
  const dm = (1 + clampedStoryIdx * 0.105 + Math.max(0, Math.min(16, wave) - 7) * 0.048) * (wave > MAX_WAVE ? Math.pow(1.10, wave - MAX_WAVE) : 1) * diff.dmgMul;
  const sm = (1 + Math.min(0.18, wIdx * 0.012)) * diff.spdMul;
  const base = {
    x, y, hitFlash: 0, phase: Math.random() * 6.28, vx: 0, vy: 0, faceA: 0,
    burnT: 0, burnTick: 0, burnDmg: 0, chillT: 0, freezeT: 0,
    poisonT: 0, poisonTick: 0, poisonStacks: 0, exposeT: 0, _blkTxtCd: 0, elite: false
  };

  if (type === 'swarmer') {
    const softCap = isTouch ? 64 : 80;
    const swCnt = Math.max(1, Math.min(wave >= 6 ? 3 : 2, softCap - (enemies.length + Math.max(0, spawns.length - 1))));
    for (let k = 0; k < swCnt; k++) {
      const ox = x + (Math.random() - 0.5) * 40, oy = y + (Math.random() - 0.5) * 40;
      enemies.push({ ...base, x: ox, y: oy, r: 9, hp: 5.0 * s, maxHp: 5.0 * s, spd: (146 + wave * 2.0) * sm, dmg: Math.max(2, Math.round(2.2 * dm)), color: '#ffbe0b', type, mat: k === 0 ? 1 : (Math.random() < 0.55 ? 1 : 0) });
    }
    addBurst(x, y, '#ff4d6d', 5, 85);
    return;
  }

  let ent;
  const mythicRate = 0.25;
  const bossDefs = getBossDefs();
  const miniBossDefs = getMiniBossDefs();
  const specialRelics = getSpecialRelics();
  if (type === 'boss') {
    const bKey = (variant && bossDefs[variant]) ? variant : getFixedActBossForWave(wave);
    const bDef = bossDefs[bKey] || FALLBACK_BOSS_DEFS.butcher;
    const isStoryBoss = (!endlessMode && wave <= MAX_WAVE);
    const twinScale = (!isStoryBoss && (diff.doubleBoss || (endlessMode && wave >= 20))) ? 0.68 : 1;
    // 四幕固定首领精调血量梯度：第4层烬羽(1150) -> 第8层星使(3400) -> 第12层伽蓝(7600) -> 第16层日蚀圣女(12600 + 必进二阶段真我觉醒)
    let baseBossHp = 13600;
    if (wave <= 4) baseBossHp = 1150;
    else if (wave <= 8) baseBossHp = 3400;
    else if (wave <= 12) baseBossHp = 7600;
    else if (wave <= 16) baseBossHp = 12600;
    else baseBossHp = 14800 + Math.max(0, wave - MAX_WAVE) * 3600;
    const bhp = Math.round(baseBossHp * endlessMul * diff.hpMul * twinScale);
    const bossDmgBase = wave <= 4 ? 7.8 : (wave <= 8 ? 9.6 : (wave <= 12 ? 11.2 : 12.6));
    // 主线以稳定的两阶段讲清每位守誓者的坚持与败北；无尽保留随机神话觉醒。
    const phase2Chance = isStoryBoss ? 1 : mythicRate;
    ent = {
      ...base, r: 48, hp: bhp, maxHp: bhp, spd: bDef.spd * sm, dmg: Math.round(bossDmgBase * dm),
      color: bDef.color, type: 'boss', variant: bKey,
      bossTitle: `${bDef.icon} ${bDef.name}${isStoryBoss ? ' · 第一阶段' : ''}`,
      storyPhaseBoss: isStoryBoss, storyStage: isStoryBoss ? 1 : 0,
      dashT: 2.5, sumT: 5.8, meteorT: 4.1, skillT: 2.2, terrainCd: 6.0, ringCd: 4.9,
      burstLeft: 0, burstCd: 0, canPhase2: Math.random() < phase2Chance, mythicPhase2: false,
      mat: wave <= 4 ? 26 : (wave <= 8 ? 34 : (wave <= 12 ? 42 : 52))
    };
  } else if (type === 'mini_boss') {
    const mKey = (variant && miniBossDefs[variant]) ? variant : getFixedMiniBossForWave(wave, false);
    const mDef = miniBossDefs[mKey] || FALLBACK_MINI_BOSS_DEFS.vanguard;
    const twinMiniScale = (diff.dualElite && wave >= 10) ? 0.70 : 1;
    const mhp = Math.round((460 + wave * 95 + Math.pow(Math.max(0, Math.min(16, wave) - 3), 2.05) * 32) * endlessMul * diff.hpMul * twinMiniScale);
    ent = {
      ...base, r: 36, hp: mhp, maxHp: mhp, spd: mDef.spd * sm, dmg: Math.round(8.4 * dm),
      color: mDef.color, type: 'mini_boss', variant: mKey, bossTitle: `${mDef.icon} ${mDef.name}`,
      dashT: 2.3, meteorT: 4.6, skillT: 2.1, ringCd: 5.4, mat: 24
    };
  } else if (type === 'special_boss') {
    const relDef = specialRelics.find(r => r.bossId === variant) || specialRelics[0];
    const shp = Math.round((960 + wave * 240 + Math.pow(wave, 1.92) * 14) * endlessMul * diff.hpMul);
    const sSpd = relDef.bossId === 'crimson_lord' ? 98 : (relDef.bossId === 'golden_golem' ? 74 : 86);
    ent = {
      ...base, r: 43, hp: shp, maxHp: shp, spd: sSpd * sm, dmg: Math.round(9.0 * dm),
      color: relDef.bossColor, type: 'special_boss', variant: relDef.bossId, bossTitle: `${relDef.bossIcon} ${relDef.bossName}`,
      dashT: 2.1, skillT: 2.0, meteorT: 4.0, sumT: 5.8, terrainCd: 6.2, ringCd: 4.9,
      goldStage: 4, canPhase2: Math.random() < mythicRate, mythicPhase2: false,
      mat: relDef.bossId === 'golden_golem' ? 48 : (relDef.bossId === 'crimson_lord' ? 30 : 26)
    };
  } else if (type === 'stalker') {
    ent = { ...base, r: 13, hp: 11.0 * s, maxHp: 11.0 * s, spd: 124 * sm, dmg: Math.round(4.8 * dm), color: '#06d6a0', type, slashCd: 0.7, stepCd: 2.2 + Math.random(), mat: 2 };
  } else if (type === 'sniper_bug') {
    ent = { ...base, r: 15, hp: 11.5 * s, maxHp: 11.5 * s, spd: 54 * sm, dmg: Math.round(6.8 * dm), color: '#ef233c', type, shotT: 2.1 + Math.random() * 0.8, aimA: undefined, mat: 3 };
  } else if (type === 'spinner') {
    ent = { ...base, r: 19, hp: 26 * s, maxHp: 26 * s, spd: 74 * sm, dmg: Math.round(5.0 * dm), color: '#f59e0b', type, shotT: 2.1 + Math.random() * 0.8, orbitDir: Math.random() < 0.5 ? 1 : -1, mat: 3 };
  } else if (type === 'juggernaut') {
    ent = { ...base, r: 36, hp: 135 * s, maxHp: 135 * s, spd: 40 * sm, dmg: Math.round(10.5 * dm), color: '#475569', type, slamCd: 3.2, mat: 7 };
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
    ent = { ...base, r: 18, hp: 20 * s, maxHp: 20 * s, spd: 54 * sm, dmg: Math.round(3.5 * dm), color: '#7209b7', type, sumT: 3.1 + Math.random(), boltT: 2.4, mat: 4 };
  } else if (type === 'healer') {
    ent = { ...base, r: 17, hp: 22 * s, maxHp: 22 * s, spd: 62 * sm, dmg: Math.round(3.0 * dm), color: '#2ec4b6', type, healT: 2.5, mat: 4 };
  } else if (type === 'brute') {
    ent = { ...base, r: 32, hp: 96 * s, maxHp: 96 * s, spd: 50 * sm, dmg: Math.round(8.5 * dm), color: '#9d4edd', type, slamCd: 2.6, slamWindup: 0, mat: 5 };
  } else {
    ent = { ...base, r: 15, hp: 15.5 * s, maxHp: 15.5 * s, spd: (86 + wave * 2.0) * sm, dmg: Math.max(2, Math.round(3.4 * dm)), color: '#d65db1', type: 'chaser', lungeCd: 1.8 + Math.random(), lungeT: 0, mat: Math.random() < 0.65 ? 1 : 2 };
  }

  // 第 3 波起按难度刷出【狂化精英词缀怪】（金色描边光环，高血高速，亡语慢速毒刺环，双倍赏金）
  const isBossLike = type === 'boss' || type === 'mini_boss' || type === 'special_boss';
  const canElite = wave >= 3 && !isBossLike && type !== 'mini_slime' && type !== 'bomber' && (type !== 'juggernaut' || wave >= 8);
  const eChance = (diff.eliteRate || 0.05) + Math.min(0.10, (wave - 3) * 0.01);
  if (canElite && Math.random() < eChance) {
    ent.elite = true;
    ent.r = Math.round(ent.r * 1.20);
    ent.hp = Math.round(ent.hp * 2.15);
    ent.maxHp = ent.hp;
    ent.spd *= 1.05;
    ent.dmg = Math.round(ent.dmg * 1.22);
    ent.mat = Math.max(2, Math.round(ent.mat * 2));
  }

  enemies.push(ent);
  addBurst(x, y, ent.elite ? '#ffd166' : ent.color, isBossLike ? 16 : (ent.elite ? 8 : 5), isBossLike ? 150 : 85);
  return ent;
}
