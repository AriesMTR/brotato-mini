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
  vanguard: { id: 'vanguard', icon: '⚔️', name: '雨夜守桥重铠武者', epithet: '一层孤桥铁卫统领', color: '#f72585', spd: 86, desc: '一层孤桥铁卫统领' },
  pyro_lord: { id: 'pyro_lord', icon: '🔥', name: '赤伞焚灯祭司', epithet: '一层余烬狂热督军', color: '#fb5607', spd: 80, desc: '一层余烬狂热督军' },
  shadow_stalker: { id: 'shadow_stalker', icon: '⚡', name: '紫电提线斩首偶', epithet: '三层发条暗杀统领', color: '#7209b7', spd: 96, desc: '三层发条暗杀统领' },
  venom_matriarch: { id: 'venom_matriarch', icon: '🌿', name: '苍翠荆棘守碑姬', epithet: '古桥风蚀督军', color: '#80ed99', spd: 84, desc: '古桥风蚀督军' },
  glacial_valkyrie: { id: 'glacial_valkyrie', icon: '🧊', name: '眠冬碎晶圣枪骑', epithet: '二层冰封王庭近卫长', color: '#48cae4', spd: 92, desc: '二层冰封王庭近卫长' },
  iron_warden: { id: 'iron_warden', icon: '🛡️', name: '黑曜镇狱金锁卫', epithet: '终层圣所重盾统领', color: '#eab308', spd: 76, desc: '终层圣所重盾统领' },
  storm_siren: { id: 'storm_siren', icon: '🕰️', name: '逆钟星律奏鸣偶', epithet: '三层钟楼雷鸣歌姬', color: '#38bdf8', spd: 90, desc: '三层钟楼雷鸣歌姬' }
};
const FALLBACK_SPECIAL_RELICS = [
  { id: 'blood_altar', icon: '🏮', name: '雨夜断刃祭坛', color: '#ff2a55', bossId: 'crimson_lord', bossIcon: '🦊', bossName: '烬羽 · 第998世残响', epithet: '不肯熄灭的绯红剑魂', bossColor: '#d90429' },
  { id: 'golden_idol', icon: '🕰️', name: '黄金逆钟星盘', color: '#ffd166', bossId: 'golden_golem', bossIcon: '🏆', bossName: '黄金发条圣柜巨神', epithet: '封存千年晶尘的机神', bossColor: '#f59e0b' },
  { id: 'void_cube', icon: '🌑', name: '黑曜蚀日残镜', color: '#c77dff', bossId: 'abyss_devourer', bossIcon: '👁️', bossName: '零号容器 · 饥饿黑影', epithet: '提灯深处的天灾倒影', bossColor: '#7209b7' }
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

// 非规则异形地形极坐标轮廓函数（用于 basin 洼地块，配合长短轴拉伸与斜向旋转生成非对称地形块）
function terrainRadiusAt(tr, ang) {
  const baseR = Math.max(24, tr.r || 72);
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

// 惰性烘焙多形态真地形块几何（支持细长斜脉 slash_vein、蜿蜒S/折角沟壑 meander_belt、斜切多边形岩台块 oblique_slab、月牙弧带 crescent_arc、拉伸洼地 basin 与折弯大裂谷 chasm，零每帧分配，渲染与碰撞 100% 对齐）
function ensureTerrainGeometry(tr) {
  if (!tr || (tr._geoReady && tr._geoX === tr.x && tr._geoY === tr.y)) return tr;
  const s = tr.seed !== undefined ? tr.seed : 2.3;
  tr.seed = s;
  if (tr.rot === undefined) tr.rot = (s * 1.37) % (Math.PI * 2);

  if (tr.kind === 'chasm') {
    const x1 = tr.x1 !== undefined ? tr.x1 : tr.x - Math.cos(tr.rot) * 105;
    const y1 = tr.y1 !== undefined ? tr.y1 : tr.y - Math.sin(tr.rot) * 105;
    const x2 = tr.x2 !== undefined ? tr.x2 : tr.x + Math.cos(tr.rot) * 105;
    const y2 = tr.y2 !== undefined ? tr.y2 : tr.y + Math.sin(tr.rot) * 105;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 160;
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux;
    const baseW = Math.max(18, tr.r || 28);
    const bendAmp = tr.bendAmp !== undefined ? tr.bendAmp : (Math.sin(s * 1.73) * baseW * 1.15);
    // 6 段折线/弧弯锯齿断层主脊（支持斜向细长断层与折角大裂谷）
    const steps = 6;
    const spine = [];
    let maxDistSq = 0;
    for (let k = 0; k <= steps; k++) {
      const f = k / steps;
      const midEnvelope = Math.sin(f * Math.PI);
      const kink = (k === 0 || k === steps)
        ? 0
        : (bendAmp * midEnvelope + Math.sin(s * 2.3 + k * 2.15) * (baseW * 0.54) * midEnvelope);
      const wScale = (k === 0 || k === steps) ? 0.20 : (0.58 + 0.54 * midEnvelope + 0.14 * Math.cos(s + k * 1.9));
      const sx = x1 + dx * f + nx * kink;
      const sy = y1 + dy * f + ny * kink;
      const sw = baseW * wScale;
      spine.push({ x: sx, y: sy, w: sw });
      const ddx = sx - tr.x, ddy = sy - tr.y;
      const reach = Math.hypot(ddx, ddy) + sw * 1.5;
      if (reach * reach > maxDistSq) maxDistSq = reach * reach;
    }
    tr.spine = spine;
    tr.boundR = Math.sqrt(maxDistSq) + 18;
    tr.halfLen = Math.max(tr.halfLen || 0, tr.boundR);
    // 计算每节主脊的局部切向法线，确保大幅弯曲时断崖两侧依然严丝合缝
    const norms = [];
    for (let k = 0; k <= steps; k++) {
      const pPrev = spine[Math.max(0, k - 1)];
      const pNext = spine[Math.min(steps, k + 1)];
      const tdx = pNext.x - pPrev.x, tdy = tdyVal(pNext.y - pPrev.y, tdx);
      const tLen = Math.hypot(tdx, tdy) || 1;
      norms.push({ nx: -tdy / tLen, ny: tdx / tLen });
    }
    function tdyVal(v, vx) { return (v === 0 && vx === 0) ? 1 : v; }
    const buildRim = (widthMul, jitterAmp) => {
      const pts = [];
      for (let k = 0; k <= steps; k++) {
        const p = spine[k], nm = norms[k];
        const jit = (k === 0 || k === steps) ? 0 : Math.sin(s * 3.1 + k * 2.7) * jitterAmp;
        pts.push({ x: p.x + nm.nx * (p.w * widthMul + jit), y: p.y + nm.ny * (p.w * widthMul + jit) });
      }
      for (let k = steps; k >= 0; k--) {
        const p = spine[k], nm = norms[k];
        const jit = (k === 0 || k === steps) ? 0 : Math.cos(s * 2.7 + k * 2.3) * jitterAmp;
        pts.push({ x: p.x - nm.nx * (p.w * widthMul + jit), y: p.y - nm.ny * (p.w * widthMul + jit) });
      }
      return pts;
    };
    tr.outerCliff = buildRim(1.36, 6.2);
    tr.midCliff = buildRim(1.06, 4.0);
    tr.abyssPoly = buildRim(0.74, 3.2);
    tr.cracks = [];
    for (let c = 1; c < steps; c += 2) {
      const sp = spine[c], nm = norms[c];
      const side = (c % 4 === 1) ? 1 : -1;
      const ca = Math.atan2(nm.ny * side, nm.nx * side) + Math.sin(s + c) * 0.45;
      const cl = baseW * (1.42 + (c % 2) * 0.28);
      const sx0 = sp.x + nm.nx * side * sp.w * 0.9;
      const sy0 = sp.y + nm.ny * side * sp.w * 0.9;
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

  const form = tr.form || 'basin';
  tr.form = form;
  const ca0 = Math.cos(tr.rot), sa0 = Math.sin(tr.rot);
  const nx0 = -sa0, ny0 = ca0;

  // 形态一至四：基于多节点主脊的真地形块（斜向细长裂脉 slash_vein / 蜿蜒S或折角沟壑 meander_belt / 斜切多边形岩台块 oblique_slab / 月牙弧带 crescent_arc）
  if (form === 'slash_vein' || form === 'meander_belt' || form === 'oblique_slab' || form === 'crescent_arc') {
    const isSlab = form === 'oblique_slab';
    const steps = isSlab ? 4 : (form === 'slash_vein' ? 6 : 7);
    const spine = [];
    if (form === 'crescent_arc') {
      const arcR = tr.arcR || (138 + ((s * 17) % 48));
      const span = tr.arcSpan || (1.35 + ((s * 0.41) % 0.52));
      const baseW = Math.max(22, tr.r || 33);
      const midSag = arcR * (1 - Math.cos(span * 0.34));
      const arcCx = tr.x - ca0 * (arcR - midSag);
      const arcCy = tr.y - sa0 * (arcR - midSag);
      for (let k = 0; k <= steps; k++) {
        const f = k / steps;
        const ak = tr.rot + (f - 0.5) * span;
        const env = Math.sin(f * Math.PI);
        const wScale = (k === 0 || k === steps) ? 0.48 : (0.78 + 0.34 * env + 0.08 * Math.sin(s * 2.1 + k * 1.6));
        spine.push({
          x: arcCx + Math.cos(ak) * arcR,
          y: arcCy + Math.sin(ak) * arcR,
          w: baseW * wScale
        });
      }
    } else if (isSlab) {
      // 斜切多边形岩台地形块（宽厚斜向断层块 / 楔形梯形块）
      const halfL = (tr.len || (175 + ((s * 23) % 75))) * 0.5;
      const baseW = Math.max(36, tr.r || 48);
      const taper = (((Math.floor(s * 7) % 3) - 1) * 0.17);
      const shear = (((Math.floor(s * 11) % 3) - 1) * baseW * 0.24);
      for (let k = 0; k <= steps; k++) {
        const f = k / steps;
        const u = (f - 0.5) * 2;
        const along = u * halfL;
        const off = u * shear + Math.sin(f * Math.PI) * Math.sin(s * 1.9) * (baseW * 0.16);
        const wScale = (1 + u * taper) * ((k === 0 || k === steps) ? 0.84 : (0.98 + 0.08 * Math.cos(s + k * 2.1)));
        spine.push({
          x: tr.x + ca0 * along + nx0 * off,
          y: tr.y + sa0 * along + ny0 * off,
          w: baseW * wScale
        });
      }
    } else if (form === 'meander_belt') {
      // 蜿蜒 S 弯河床或折角 L 型沟壑长带
      const halfL = (tr.len || (285 + ((s * 29) % 125))) * 0.5;
      const baseW = Math.max(22, tr.r || 33);
      const bendSign = (Math.floor(s * 13) % 2 === 0) ? 1 : -1;
      const isElbow = (Math.floor(s * 9) % 3 === 0);
      for (let k = 0; k <= steps; k++) {
        const f = k / steps;
        const u = (f - 0.5) * 2;
        const along = u * halfL;
        const off = isElbow
          ? ((0.55 - Math.abs(u) * 0.85) * (halfL * 0.44) * bendSign)
          : (Math.sin(u * Math.PI * 0.92) * (halfL * 0.30) * bendSign);
        const wScale = (k === 0 || k === steps) ? 0.54 : (0.86 + 0.24 * Math.sin(f * Math.PI) + 0.10 * Math.cos(s * 1.7 + k * 1.9));
        spine.push({
          x: tr.x + ca0 * along + nx0 * off,
          y: tr.y + sa0 * along + ny0 * off,
          w: baseW * wScale
        });
      }
    } else {
      // slash_vein：斜向细长裂脉条带（长宽比 4.5:1 ~ 6.5:1）
      const halfL = (tr.len || (265 + ((s * 31) % 145))) * 0.5;
      const baseW = Math.max(20, tr.r || 30);
      for (let k = 0; k <= steps; k++) {
        const f = k / steps;
        const u = (f - 0.5) * 2;
        const along = u * halfL;
        const off = Math.sin(f * Math.PI) * Math.sin(s * 1.8 + u * 2.2) * (baseW * 0.42);
        const wScale = (k === 0 || k === steps) ? 0.50 : (0.84 + 0.26 * Math.sin(f * Math.PI) + 0.11 * Math.sin(s * 2.3 + k * 1.8));
        spine.push({
          x: tr.x + ca0 * along + nx0 * off,
          y: tr.y + sa0 * along + ny0 * off,
          w: baseW * wScale
        });
      }
    }

    tr.spine = spine;
    const tangs = [];
    let maxReach = 48;
    for (let k = 0; k <= steps; k++) {
      const pPrev = spine[Math.max(0, k - 1)];
      const pNext = spine[Math.min(steps, k + 1)];
      let tdx = pNext.x - pPrev.x, tdy = pNext.y - pPrev.y;
      const tL = Math.hypot(tdx, tdy) || 1;
      tdx /= tL; tdy /= tL;
      tangs.push({ tx: tdx, ty: tdy, nx: -tdy, ny: tdx });
      const dCenter = Math.hypot(spine[k].x - tr.x, spine[k].y - tr.y) + spine[k].w * 1.35;
      if (dCenter > maxReach) maxReach = dCenter;
    }
    tr.boundR = maxReach + 20;
    tr.halfLen = Math.max(tr.halfLen || 0, tr.boundR);

    const buildSpinePoly = (wMul, capMul, jitAmp) => {
      const pts = [];
      const p0 = spine[0], t0 = tangs[0];
      const pm = spine[steps], tm = tangs[steps];
      if (isSlab) {
        // 斜切岩台两端采用利落的折角切面
        pts.push({
          x: p0.x - t0.tx * (p0.w * capMul * 0.58) + t0.nx * (p0.w * wMul * 0.56),
          y: p0.y - t0.ty * (p0.w * capMul * 0.58) + t0.ny * (p0.w * wMul * 0.56)
        });
      } else {
        pts.push({
          x: p0.x - t0.tx * (p0.w * capMul * 0.85) + t0.nx * (p0.w * wMul * 0.34),
          y: p0.y - t0.ty * (p0.w * capMul * 0.85) + t0.ny * (p0.w * wMul * 0.34)
        });
      }
      for (let k = 0; k <= steps; k++) {
        const p = spine[k], tg = tangs[k];
        const tooth = tr.kind === 'lava' ? (k % 2 === 0 ? 1.05 : 0.94) : (tr.kind === 'ice_sheet' ? (k % 2 === 0 ? 1.08 : 0.92) : 1);
        const jit = Math.sin(s * 2.9 + k * 2.3) * jitAmp;
        const w = p.w * wMul * tooth + jit;
        pts.push({ x: p.x + tg.nx * w, y: p.y + tg.ny * w });
      }
      if (isSlab) {
        pts.push({
          x: pm.x + tm.tx * (pm.w * capMul * 0.58) + tm.nx * (pm.w * wMul * 0.56),
          y: pm.y + tm.ty * (pm.w * capMul * 0.58) + tm.ny * (pm.w * wMul * 0.56)
        });
        pts.push({
          x: pm.x + tm.tx * (pm.w * capMul * 0.58) - tm.nx * (pm.w * wMul * 0.56),
          y: pm.y + tm.ty * (pm.w * capMul * 0.58) - tm.ny * (pm.w * wMul * 0.56)
        });
      } else {
        pts.push({
          x: pm.x + tm.tx * (pm.w * capMul * 0.85) + tm.nx * (pm.w * wMul * 0.34),
          y: pm.y + tm.ty * (pm.w * capMul * 0.85) + tm.ny * (pm.w * wMul * 0.34)
        });
        pts.push({
          x: pm.x + tm.tx * (pm.w * capMul * 0.96),
          y: pm.y + tm.ty * (pm.w * capMul * 0.96)
        });
        pts.push({
          x: pm.x + tm.tx * (pm.w * capMul * 0.85) - tm.nx * (pm.w * wMul * 0.34),
          y: pm.y + tm.ty * (pm.w * capMul * 0.85) - tm.ny * (pm.w * wMul * 0.34)
        });
      }
      for (let k = steps; k >= 0; k--) {
        const p = spine[k], tg = tangs[k];
        const tooth = tr.kind === 'lava' ? (k % 2 === 1 ? 1.05 : 0.94) : (tr.kind === 'ice_sheet' ? (k % 2 === 1 ? 1.08 : 0.92) : 1);
        const jit = Math.cos(s * 2.5 + k * 2.1) * jitAmp;
        const w = p.w * wMul * tooth + jit;
        pts.push({ x: p.x - tg.nx * w, y: p.y - tg.ny * w });
      }
      if (isSlab) {
        pts.push({
          x: p0.x - t0.tx * (p0.w * capMul * 0.58) - t0.nx * (p0.w * wMul * 0.56),
          y: p0.y - t0.ty * (p0.w * capMul * 0.58) - t0.ny * (p0.w * wMul * 0.56)
        });
      } else {
        pts.push({
          x: p0.x - t0.tx * (p0.w * capMul * 0.85) - t0.nx * (p0.w * wMul * 0.34),
          y: p0.y - t0.ty * (p0.w * capMul * 0.85) - t0.ny * (p0.w * wMul * 0.34)
        });
        pts.push({
          x: p0.x - t0.tx * (p0.w * capMul * 0.96),
          y: p0.y - t0.ty * (p0.w * capMul * 0.96)
        });
      }
      return pts;
    };

    tr.outerRim = buildSpinePoly(1.20, 0.92, tr.kind === 'lava' ? 3.4 : 2.0);
    tr.midRim = buildSpinePoly(1.08, 0.82, 1.8);
    tr.verts = buildSpinePoly(1.00, 0.72, 1.5);
    tr.inner1 = buildSpinePoly(0.74, 0.52, 1.1);
    tr.inner2 = buildSpinePoly(0.46, 0.32, 0.7);
    tr.inner3 = buildSpinePoly(0.22, 0.16, 0.4);

    if (tr.kind === 'lava') {
      tr.crusts = [];
      tr.veinSegs = [];
      for (let k = 1; k < steps; k += 2) {
        const sp = spine[k], tg = tangs[k];
        const side = (k % 4 === 1) ? 1 : -1;
        tr.crusts.push({
          x: sp.x + tg.nx * side * sp.w * 0.28,
          y: sp.y + tg.ny * side * sp.w * 0.28,
          sz: 6.5 + (k % 3) * 2.8,
          rot: Math.atan2(tg.ty, tg.tx) + side * 0.4
        });
      }
      for (let k = 1; k < steps; k++) {
        const sp = spine[k], tg = tangs[k];
        const side = (k % 2 === 0) ? 1 : -1;
        const sx = sp.x + tg.nx * side * sp.w * 0.18, sy = sp.y + tg.ny * side * sp.w * 0.18;
        const ex = sp.x + tg.nx * side * sp.w * 0.86 + tg.tx * 8, ey = sp.y + tg.ny * side * sp.w * 0.86 + tg.ty * 8;
        tr.veinSegs.push({ x1: sx, y1: sy, mx: (sx + ex) * 0.5 + tg.tx * 5, my: (sy + ey) * 0.5 + tg.ty * 5, x2: ex, y2: ey });
      }
    } else if (tr.kind === 'swamp') {
      tr.shoals = [];
      tr.mushrooms = [];
      for (let k = 1; k < steps; k += 2) {
        const sp = spine[k], tg = tangs[k];
        const side = (k % 4 === 1) ? 1 : -1;
        tr.shoals.push({
          x: sp.x + tg.nx * side * sp.w * 1.06,
          y: sp.y + tg.ny * side * sp.w * 1.06,
          rx: 17 + (k % 3) * 5,
          ry: 9 + (k % 2) * 3.5,
          rot: Math.atan2(tg.ty, tg.tx)
        });
      }
      for (let k = 1; k <= steps - 1; k += 2) {
        const sp = spine[k], tg = tangs[k];
        const side = (k % 4 === 1) ? -1 : 1;
        tr.mushrooms.push({
          x: sp.x + tg.nx * side * sp.w * 0.94,
          y: sp.y + tg.ny * side * sp.w * 0.94,
          alt: (k % 3 === 0)
        });
      }
    } else if (tr.kind === 'ice_sheet') {
      tr.iceGlints = [];
      tr.iceCracks = [];
      for (let k = 1; k < steps; k += 2) {
        const sp = spine[k], tg = tangs[k];
        const gw = sp.w * 0.52;
        tr.iceGlints.push({
          x: sp.x, y: sp.y, gw,
          ang: Math.atan2(tg.ty, tg.tx) - 0.55
        });
      }
      for (let k = 0; k < steps; k++) {
        const a = spine[k], b = spine[k + 1], tg = tangs[k];
        const off = ((k % 2 === 0) ? 1 : -1) * a.w * 0.30;
        tr.iceCracks.push({
          x1: a.x + tg.nx * off * 0.5, y1: a.y + tg.ny * off * 0.5,
          x2: b.x - tg.nx * off * 0.7, y2: b.y - tg.ny * off * 0.7
        });
      }
    }

    tr._geoX = tr.x; tr._geoY = tr.y;
    tr._geoReady = true;
    return tr;
  }

  // 形态五：斜向拉伸非对称洼地块（basin，长短轴比 1.28~1.82，绝非正圆）
  const stretch = tr.stretch || (1.30 + ((s * 0.31) % 0.48));
  tr.stretch = stretch;
  const n = tr.kind === 'ice_sheet' ? 16 : (tr.kind === 'lava' ? 22 : 20);
  const buildBasinPoly = (scaleMul) => {
    const out = [];
    for (let k = 0; k < n; k++) {
      const localA = (k / n) * Math.PI * 2;
      let rad = terrainRadiusAt(tr, localA + tr.rot) * scaleMul;
      if (tr.kind === 'lava') {
        rad *= (k % 2 === 0 ? 1.06 : 0.92);
      } else if (tr.kind === 'ice_sheet') {
        rad *= (k % 4 === 0 ? 1.14 : (k % 2 === 0 ? 0.88 : 0.97));
      }
      const lx = Math.cos(localA) * rad * stretch;
      const ly = Math.sin(localA) * rad;
      out.push({
        x: tr.x + ca0 * lx - sa0 * ly,
        y: tr.y + sa0 * lx + ca0 * ly
      });
    }
    return out;
  };
  const verts = buildBasinPoly(1.0);
  let maxR = (tr.r || 72) * stretch;
  for (let k = 0; k < verts.length; k++) {
    const d = Math.hypot(verts[k].x - tr.x, verts[k].y - tr.y);
    if (d > maxR) maxR = d;
  }
  tr.verts = verts;
  tr.outerRim = buildBasinPoly(1.14);
  tr.midRim = buildBasinPoly(1.06);
  tr.inner1 = buildBasinPoly(0.80);
  tr.inner2 = buildBasinPoly(0.56);
  tr.inner3 = buildBasinPoly(0.32);
  tr.boundR = maxR + 20;
  tr.halfLen = Math.max(tr.halfLen || 0, tr.boundR);

  if (tr.kind === 'lava') {
    tr.crusts = [];
    tr.veinSegs = [];
    for (let c = 0; c < 4; c++) {
      const la = c * 1.57 + 0.42;
      const crd = (tr.r || 72) * (0.26 + (c % 2) * 0.22);
      const lx = Math.cos(la) * crd * stretch, ly = Math.sin(la) * crd;
      tr.crusts.push({
        x: tr.x + ca0 * lx - sa0 * ly,
        y: tr.y + sa0 * lx + ca0 * ly,
        sz: 7 + (c % 3) * 3.2,
        rot: tr.rot + la * 0.7
      });
    }
    for (let k = 0; k < verts.length; k += 3) {
      const vp = verts[k];
      const sx = tr.x + (vp.x - tr.x) * 0.42, sy = tr.y + (vp.y - tr.y) * 0.42;
      const ex = tr.x + (vp.x - tr.x) * 0.90, ey = tr.y + (vp.y - tr.y) * 0.90;
      tr.veinSegs.push({ x1: sx, y1: sy, mx: (sx + ex) * 0.5 + 4, my: (sy + ey) * 0.5 - 3, x2: ex, y2: ey });
    }
  } else if (tr.kind === 'swamp') {
    tr.shoals = [];
    tr.mushrooms = [];
    for (let sh = 0; sh < 3; sh++) {
      const vp = verts[(sh * 6) % verts.length];
      tr.shoals.push({
        x: tr.x + (vp.x - tr.x) * 1.05,
        y: tr.y + (vp.y - tr.y) * 1.05,
        rx: 18 + sh * 5,
        ry: 10 + (sh % 2) * 4,
        rot: tr.rot + sh * 1.05
      });
    }
    for (let m = 0; m < 3; m++) {
      const vp = verts[(m * 5 + 2) % verts.length];
      if (vp) tr.mushrooms.push({ x: vp.x, y: vp.y, alt: m % 2 === 1 });
    }
  } else if (tr.kind === 'ice_sheet') {
    tr.iceGlints = [
      { x: tr.x - ca0 * (tr.r || 72) * 0.24, y: tr.y - sa0 * (tr.r || 72) * 0.24, gw: (tr.r || 72) * 0.46, ang: tr.rot - 0.52 },
      { x: tr.x + ca0 * (tr.r || 72) * 0.22, y: tr.y + sa0 * (tr.r || 72) * 0.22, gw: (tr.r || 72) * 0.34, ang: tr.rot - 0.52 }
    ];
    tr.iceCracks = [];
    if (verts.length >= 12) {
      tr.iceCracks.push(
        { x1: verts[1].x, y1: verts[1].y, x2: tr.x - 6, y2: tr.y + 4 },
        { x1: tr.x - 6, y1: tr.y + 4, x2: verts[9].x, y2: verts[9].y },
        { x1: verts[3].x, y1: verts[3].y, x2: verts[11].x, y2: verts[11].y }
      );
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
  const maxB = (tr.boundR || (tr.r || 78) * 1.8) + pad;
  if (dx * dx + dy * dy > maxB * maxB) return false;
  if (tr.spine && tr.spine.length >= 2) {
    for (let s = 0; s < tr.spine.length - 1; s++) {
      const a = tr.spine[s], b = tr.spine[s + 1];
      const seg = pointSegClosest(px, py, a.x, a.y, b.x, b.y);
      const localW = a.w + (b.w - a.w) * seg.t + pad;
      if (seg.dSq <= localW * localW) return true;
    }
    return false;
  }
  const ca = Math.cos(tr.rot || 0), sa = Math.sin(tr.rot || 0);
  const stretch = tr.stretch || 1;
  const lx = (dx * ca + dy * sa) / stretch;
  const ly = -dx * sa + dy * ca;
  const d = Math.hypot(lx, ly);
  if (d <= (tr.r || 68) * 0.50 + pad) return true;
  const localAng = Math.atan2(ly, lx);
  return d < terrainRadiusAt(tr, localAng + (tr.rot || 0)) + pad;
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

function _terrainSampleDiscs(tr) {
  ensureTerrainGeometry(tr);
  if (tr.spine && tr.spine.length) {
    const out = [];
    for (let i = 0; i < tr.spine.length; i++) {
      out.push({ x: tr.spine[i].x, y: tr.spine[i].y, r: (tr.spine[i].w || 28) * 1.15 });
    }
    return out;
  }
  const r = tr.r || 68;
  const st = tr.stretch || 1.35;
  const ca = Math.cos(tr.rot || 0), sa = Math.sin(tr.rot || 0);
  const off = r * (st - 0.35) * 0.55;
  return [
    { x: tr.x - ca * off, y: tr.y - sa * off, r: r * 0.92 },
    { x: tr.x, y: tr.y, r: r * 1.05 },
    { x: tr.x + ca * off, y: tr.y + sa * off, r: r * 0.92 }
  ];
}

function _canPlaceTerrainBlock(cand, cx, cy, minGap = 84) {
  ensureTerrainGeometry(cand);
  let poly = cand.outerCliff || cand.outerRim || cand.verts || [];
  const wallPad = 70;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  let dxShift = 0, dyShift = 0;
  if (minX < wallPad) dxShift = wallPad - minX + 4;
  else if (maxX > WORLD.w - wallPad) dxShift = (WORLD.w - wallPad) - maxX - 4;
  if (minY < wallPad) dyShift = wallPad - minY + 4;
  else if (maxY > WORLD.h - wallPad) dyShift = (WORLD.h - wallPad) - maxY - 4;
  if (dxShift !== 0 || dyShift !== 0) {
    cand.x += dxShift; cand.y += dyShift;
    if (cand.x1 !== undefined) {
      cand.x1 += dxShift; cand.x2 += dxShift;
      cand.y1 += dyShift; cand.y2 += dyShift;
    }
    cand._geoReady = false;
    ensureTerrainGeometry(cand);
    poly = cand.outerCliff || cand.outerRim || cand.verts || [];
  }
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    if (p.x < wallPad - 2 || p.x > WORLD.w - wallPad + 2 || p.y < wallPad - 2 || p.y > WORLD.h - wallPad + 2) return false;
  }
  const discs = _terrainSampleDiscs(cand);
  const centerClear = cand.kind === 'chasm' ? 205 : 138;
  for (let i = 0; i < discs.length; i++) {
    const d = discs[i];
    if (Math.hypot(d.x - cx, d.y - cy) < d.r + centerClear) return false;
    if (cand.kind === 'chasm' && Math.hypot(d.x - (cx + 120), d.y - cy) < d.r + 75) return false;
    for (let pIdx = 0; pIdx < portals.length; pIdx++) {
      const pt = portals[pIdx];
      if (Math.hypot(d.x - pt.x, d.y - pt.y) < d.r + (pt.r || 36) + 95) return false;
    }
  }
  for (let tIdx = 0; tIdx < terrains.length; tIdx++) {
    const other = terrains[tIdx];
    const oDiscs = other._sampleDiscs || (other._sampleDiscs = _terrainSampleDiscs(other));
    const reqGap = (cand.kind === 'chasm' && other.kind === 'chasm') ? 140 : minGap;
    for (let i = 0; i < discs.length; i++) {
      const a = discs[i];
      for (let j = 0; j < oDiscs.length; j++) {
        const b = oDiscs[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + reqGap) return false;
      }
    }
  }
  cand._sampleDiscs = discs;
  return true;
}

// 随机斜角偏置生成器：优先产出极具战术切割感的斜向角度（如 25°~70°、110°~155°），兼顾少量横纵与任意角
function _pickObliqueAngle() {
  const r = Math.random();
  if (r < 0.72) {
    const quad = Math.floor(Math.random() * 4);
    return quad * (Math.PI * 0.5) + 0.36 + Math.random() * 0.85;
  }
  return Math.random() * Math.PI * 2;
}

// 全域随机多形态真地形块生成器（覆盖边角、侧翼、走廊与中腹，融合斜向细长裂脉、蜿蜒S沟壑、斜切岩台块、月牙弧带、断层裂谷与异形洼地）
function spawnArenaTerrains() {
  terrains = [];
  portals = [];
  portalPairCd = 0;
  const cx = WORLD.w * 0.5, cy = WORLD.h * 0.5;
  const scId = (curScene && curScene.id) || 'wasteland';
  const compactArena = Math.min(WORLD.w, WORLD.h) < 1260;

  if (scId === 'wasteland') {
    // 🕰️ 倒悬钟楼：随机斜跨或侧翼分布的双生裂隙门 A ↔ B（不再死板对称）
    const baseA = _pickObliqueAngle();
    const spanX = Math.min(540, WORLD.w * 0.30) * (0.78 + Math.random() * 0.36);
    const spanY = Math.min(360, WORLD.h * 0.28) * (0.78 + Math.random() * 0.36);
    const shiftX = (Math.random() - 0.5) * Math.min(180, WORLD.w * 0.10);
    const shiftY = (Math.random() - 0.5) * Math.min(130, WORLD.h * 0.10);
    const p1x = Math.max(155, Math.min(WORLD.w - 155, cx + shiftX + Math.cos(baseA) * spanX));
    const p1y = Math.max(155, Math.min(WORLD.h - 155, cy + shiftY + Math.sin(baseA) * spanY));
    const p2x = Math.max(155, Math.min(WORLD.w - 155, cx + shiftX - Math.cos(baseA) * spanX));
    const p2y = Math.max(155, Math.min(WORLD.h - 155, cy + shiftY - Math.sin(baseA) * spanY));
    portals.push(
      makeRiftPortal(0, 'A', p1x, p1y, '#c77dff', 0),
      makeRiftPortal(1, 'B', p2x, p2y, '#4cc9f0', Math.PI)
    );
  }

  // 构建全场 3x3 九宫战区分区洗牌表（含四角、上下左右侧翼及偏置中场，彻底告别扎堆中心）
  const zones = [];
  for (let gx = 0; gx < 3; gx++) {
    for (let gy = 0; gy < 3; gy++) {
      zones.push({ gx, gy });
    }
  }
  const shuffleArr = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  };
  shuffleArr(zones);

  let zoneCursor = 0;
  const sampleArenaPoint = (padX, padY) => {
    const z = zones[(zoneCursor++) % zones.length];
    const usableW = Math.max(240, WORLD.w - padX * 2);
    const usableH = Math.max(240, WORLD.h - padY * 2);
    const cellW = usableW / 3, cellH = usableH / 3;
    let x = padX + (z.gx + 0.12 + Math.random() * 0.76) * cellW;
    let y = padY + (z.gy + 0.12 + Math.random() * 0.76) * cellH;
    // 若落在正中格，则随机推向中场侧翼走廊，避免压住出生点
    if (z.gx === 1 && z.gy === 1 && Math.hypot(x - cx, y - cy) < 195) {
      const pushA = _pickObliqueAngle();
      x = cx + Math.cos(pushA) * (205 + Math.random() * 95);
      y = cy + Math.sin(pushA) * (185 + Math.random() * 80);
    }
    return {
      x: Math.max(padX, Math.min(WORLD.w - padX, x)),
      y: Math.max(padY, Math.min(WORLD.h - padY, y))
    };
  };

  const placeChasmBlock = (lenScale = 1.0) => {
    for (let tries = 0; tries < 44; tries++) {
      const pt = tries < 28
        ? sampleArenaPoint(185, 175)
        : { x: 185 + Math.random() * Math.max(120, WORLD.w - 370), y: 175 + Math.random() * Math.max(120, WORLD.h - 350) };
      const ang = _pickObliqueAngle();
      const halfLen = (88 + Math.random() * 68) * lenScale * (compactArena ? 0.82 : 1.0);
      const r = 22 + Math.round(Math.random() * 11);
      const bendAmp = (Math.random() - 0.5) * (halfLen * 0.46);
      const cand = {
        kind: 'chasm',
        x: pt.x, y: pt.y,
        x1: pt.x - Math.cos(ang) * halfLen, y1: pt.y - Math.sin(ang) * halfLen,
        x2: pt.x + Math.cos(ang) * halfLen, y2: pt.y + Math.sin(ang) * halfLen,
        ang, rot: ang, halfLen, r, bendAmp,
        seed: 1.1 + Math.random() * 80
      };
      if (_canPlaceTerrainBlock(cand, cx, cy, 92)) {
        terrains.push(cand);
        return true;
      }
    }
    return false;
  };

  const makeBlockSpec = (kind, form, pt, scale = 1.0) => {
    const rot = _pickObliqueAngle();
    const seed = 1.3 + Math.random() * 90;
    const sc = scale * (compactArena ? 0.84 : 1.0);
    if (form === 'slash_vein') {
      return {
        kind, form, x: pt.x, y: pt.y, rot, seed,
        len: Math.round((255 + Math.random() * 175) * sc),
        r: Math.round((24 + Math.random() * 13) * sc),
        pulse: Math.random() * 6.28
      };
    }
    if (form === 'meander_belt') {
      return {
        kind, form, x: pt.x, y: pt.y, rot, seed,
        len: Math.round((275 + Math.random() * 165) * sc),
        r: Math.round((26 + Math.random() * 13) * sc),
        pulse: Math.random() * 6.28
      };
    }
    if (form === 'oblique_slab') {
      return {
        kind, form, x: pt.x, y: pt.y, rot, seed,
        len: Math.round((175 + Math.random() * 95) * sc),
        r: Math.round((40 + Math.random() * 16) * sc),
        pulse: Math.random() * 6.28
      };
    }
    if (form === 'crescent_arc') {
      return {
        kind, form, x: pt.x, y: pt.y, rot, seed,
        arcR: Math.round((128 + Math.random() * 58) * sc),
        arcSpan: 1.28 + Math.random() * 0.62,
        r: Math.round((25 + Math.random() * 12) * sc),
        pulse: Math.random() * 6.28
      };
    }
    return {
      kind, form: 'basin', x: pt.x, y: pt.y, rot, seed,
      r: Math.round((56 + Math.random() * 22) * sc),
      stretch: 1.32 + Math.random() * 0.52,
      pulse: Math.random() * 6.28
    };
  };

  const pushPool = (kind, preferredForm = '', seedHint = 0) => {
    const formPool = preferredForm
      ? [preferredForm, 'slash_vein', 'oblique_slab', 'basin']
      : shuffleArr(['slash_vein', 'meander_belt', 'oblique_slab', 'crescent_arc', 'basin']);
    for (let tries = 0; tries < 48; tries++) {
      const form = formPool[tries % formPool.length];
      const scale = tries > 30 ? 0.78 : 1.0;
      const pt = tries < 27
        ? sampleArenaPoint(145, 140)
        : { x: 135 + Math.random() * Math.max(120, WORLD.w - 270), y: 135 + Math.random() * Math.max(120, WORLD.h - 270) };
      const cand = makeBlockSpec(kind, form, pt, scale);
      if (seedHint) cand.seed += seedHint * 0.17;
      if (_canPlaceTerrainBlock(cand, cx, cy, tries > 34 ? 64 : 84)) {
        terrains.push(cand);
        return true;
      }
    }
    return false;
  };

  // 每波随机数量（桌面 5~7 块，竖屏 4~5 块）与随机造型牌组（确保细长斜带、蜿蜒沟壑、斜向岩台块占主导）
  const targetBlocks = compactArena ? (4 + Math.floor(Math.random() * 2)) : (5 + Math.floor(Math.random() * 3));
  const formsDeck = shuffleArr([
    'slash_vein', 'meander_belt', 'oblique_slab', 'crescent_arc',
    'slash_vein', 'oblique_slab', 'meander_belt', 'basin'
  ]);

  if (scId === 'desert') {
    // 🌑 日蚀镜界：1~2 道随机斜向/弯折断层裂谷 + 多块斜长熔岩裂脉与腐殖毒沼块
    placeChasmBlock(1.05);
    if (!compactArena && Math.random() < 0.55) placeChasmBlock(0.82);
    const kinds = shuffleArr(['lava', 'swamp', 'lava', 'swamp', Math.random() < 0.55 ? 'lava' : 'swamp', 'ice_sheet']);
    let idx = 0;
    while (terrains.length < targetBlocks && idx < 8) {
      const k = idx < 2 ? (idx === 0 ? 'lava' : 'swamp') : kinds[idx % kinds.length];
      pushPool(k, formsDeck[idx % formsDeck.length], idx + 1);
      idx++;
    }
  } else if (scId === 'glacier') {
    // ❄️ 永冻冰窟：斜向寒霜冰带/冰岩台 + 细长地脉熔火裂口 + 冻土毒泥沟壑（小概率冰裂断崖）
    if (Math.random() < 0.35) placeChasmBlock(0.78);
    const kinds = ['ice_sheet', 'lava', 'swamp', 'ice_sheet', Math.random() < 0.55 ? 'swamp' : 'lava', 'ice_sheet', 'lava'];
    let idx = 0;
    while (terrains.length < targetBlocks && idx < 8) {
      pushPool(kinds[idx % kinds.length], formsDeck[idx % formsDeck.length], idx + 1);
      idx++;
    }
  } else if (scId === 'wasteland') {
    // 🕰️ 倒悬钟楼：非对称双生裂隙门 + 细长熔炉火沟、斜向毒油泥沼块与偶发断层裂口
    if (Math.random() < 0.38) placeChasmBlock(0.80);
    const kinds = ['lava', 'swamp', Math.random() < 0.5 ? 'lava' : 'swamp', 'lava', 'swamp', Math.random() < 0.35 ? 'ice_sheet' : 'lava'];
    let idx = 0;
    while (terrains.length < targetBlocks && idx < 8) {
      pushPool(kinds[idx % kinds.length], formsDeck[idx % formsDeck.length], idx + 1);
      idx++;
    }
  } else {
    // 🌧️ 雨夜长桥（foundry 等）：斜向熔岩裂脉、蜿蜒腐殖泥沼沟、斜切岩块与偶发古桥断口/寒水冰面
    if (wave >= 2 && Math.random() < 0.36) placeChasmBlock(0.78);
    const kinds = ['lava', 'swamp', 'lava', 'swamp', Math.random() < 0.5 ? 'lava' : 'swamp', Math.random() < 0.30 ? 'ice_sheet' : 'swamp', 'lava'];
    let idx = 0;
    while (terrains.length < targetBlocks && idx < 8) {
      pushPool(kinds[idx % kinds.length], formsDeck[idx % formsDeck.length], idx + 1);
      idx++;
    }
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
  if (!(tr._flashCd > 0)) {
    tr.hitFlash = 0.042;
    tr._flashCd = 0.095;
  }
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

// 16 层固定幕守誓首领映射：第 4 / 8 / 12 / 16 层严格固定，绝不随机；无尽深渊 (17层+) 完整轮转全部 6 位终极首领
const FIXED_ACT_BOSS_BY_WAVE = {
  4: 'butcher',       // 第一幕终战（第 4 层）：绯红断刃剑姬 · 烬羽
  8: 'frost_queen',   // 第二幕终战（第 8 层）：永冻星使 · 艾丝特莉亚
  12: 'void_weaver',  // 第三幕终战（第 12 层）：紫电弦月人偶 · 伽蓝
  16: 'solar_seraph'  // 第四幕终局（第 16 层）：第999号 · 日蚀圣女
};
const ENDLESS_ACT_BOSS_ROTATION = ['mech_colossus', 'plague_empress', 'butcher', 'frost_queen', 'void_weaver', 'solar_seraph'];

function getFixedActBossForWave(w) {
  const wn = Math.max(1, Math.floor(w || 1));
  if (FIXED_ACT_BOSS_BY_WAVE[wn]) return FIXED_ACT_BOSS_BY_WAVE[wn];
  const cycleIdx = Math.max(0, Math.floor((wn - 20) / 4)) % ENDLESS_ACT_BOSS_ROTATION.length;
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

// 地图稀有奇遇圣物生成与特殊 Boss 召唤逻辑（大幅扩展召唤事件法阵半径 r=88，走位读条更宽敞醒目）
function spawnSpecialRelic(forceId = null) {
  if (relics.length >= 1) return null;
  const relPool = getSpecialRelics();
  const def = forceId ? (relPool.find(r => r.id === forceId) || relPool[0]) : relPool[Math.floor(Math.random() * relPool.length)];
  let rx = WORLD.w * 0.5, ry = WORLD.h * 0.5;
  for (let tries = 0; tries < 36; tries++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 225 + Math.random() * 265;
    rx = Math.max(145, Math.min(WORLD.w - 145, (player ? player.x : WORLD.w * 0.5) + Math.cos(ang) * dist));
    ry = Math.max(145, Math.min(WORLD.h - 145, (player ? player.y : WORLD.h * 0.5) + Math.sin(ang) * dist));
    if ((!player || Math.hypot(rx - player.x, ry - player.y) > 190) && !isBlockedByTerrain(rx, ry, tries > 22 ? 42 : 70)) break;
  }
  const rel = { x: rx, y: ry, r: 88, def, charge: 0, need: 1.15, pulse: 0 };
  relics.push(rel);
  if (rings.length < 40) rings.push({ x: rx, y: ry, r: 142, color: def.color, t: 0.48, maxT: 0.48, kind: 'hex' });
  beep(740, 0.12, 'triangle', 0.06);
  if (player) addText(player.x, player.y - 54, `奇遇现世：${def.name}！`, '#ffd166', 18, 2.6);
  announce(`✨ 地图刷新大型召唤法阵【${def.icon}${def.name}】！跟随边缘箭头踏入圈内即可召唤首领`, '#ffd166', 4.2);
  logInfo('RELIC', `刷新地图奇遇圣物 ${def.name}(${def.id}) r=${rel.r} at (${Math.round(rx)},${Math.round(ry)})`);
  return rel;
}

// 全屏首领登场（一阶段 33% 概率）与神话二阶段觉醒（二阶段 33% 概率觉醒且 100% 必出立绘）破框横幅触发器
const RARE_PORTRAIT_RATE = 0.33;
const PHASE2_AWAKEN_RATE = 0.33;
const BOSS_CUTSCENE_SHOW_SEC = 5.0;
const BOSS_CUTSCENE_FADE_SEC = 0.85;
const BOSS_CUTSCENE_TOTAL_SEC = BOSS_CUTSCENE_SHOW_SEC + BOSS_CUTSCENE_FADE_SEC;
let pendingBossCutscene = null;

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
  if (Math.random() < RARE_PORTRAIT_RATE) {
    if (!player.shownBossPortraits) player.shownBossPortraits = {};
    player.shownBossPortraits[vKey] = true;
    player.rarePortraitShown = true;
    return true;
  }
  return false;
}

function startBossCutscene(mode, variant, title, subtitle, extraTag = '', color = '#ff4d6d', accent = '#ffd166', dur = BOSS_CUTSCENE_TOTAL_SEC, extra = null) {
  if (!endlessMode) return;
  const fadeDur = (extra && extra.fadeDur) || BOSS_CUTSCENE_FADE_SEC;
  const totalDur = Math.max(fadeDur + 0.5, dur || BOSS_CUTSCENE_TOTAL_SEC);
  bossCutscene = Object.assign({
    t: totalDur,
    maxT: totalDur,
    fadeDur,
    mode,
    variant,
    title,
    subtitle,
    extraTag,
    color,
    accent
  }, extra || {});
  pendingBossCutscene = null;
  if (player) player.invuln = 0;
  if (typeof SpireAudio !== 'undefined') SpireAudio.playCutsceneCue(variant, mode === 'mythic_phase2');
}

function queueBossCutscene(mode, variant, title, subtitle, extraTag = '', color = '#ff4d6d', accent = '#ffd166', dur = BOSS_CUTSCENE_TOTAL_SEC, extra = null) {
  if (!endlessMode) return;
  const fadeDur = (extra && extra.fadeDur) || BOSS_CUTSCENE_FADE_SEC;
  const totalDur = Math.max(fadeDur + 0.5, dur || BOSS_CUTSCENE_TOTAL_SEC);
  pendingBossCutscene = Object.assign({
    dur: totalDur,
    fadeDur,
    mode,
    variant,
    title,
    subtitle,
    extraTag,
    color,
    accent
  }, extra || {});
}

// 首领战斗中动态改造战场地形块（上限扩充至 <=10 块，随机生成细长斜脉、斜切岩块或弧形沟壑）
function spawnBossTerrain(kind, x, y, baseR = 74) {
  if (typeof terrains === 'undefined') return;
  while (terrains.length >= 10) {
    terrains.shift();
  }
  const cx = Math.max(210, Math.min(WORLD.w - 210, x));
  const cy = Math.max(210, Math.min(WORLD.h - 210, y));
  const ang = _pickObliqueAngle();
  if (kind === 'chasm') {
    let tx = cx, ty = cy;
    if (player && Math.hypot(tx - player.x, ty - player.y) < 130) {
      const pushA = Math.atan2(ty - player.y, tx - player.x) || 0;
      tx = Math.max(210, Math.min(WORLD.w - 210, player.x + Math.cos(pushA) * 155));
      ty = Math.max(210, Math.min(WORLD.h - 210, player.y + Math.sin(pushA) * 155));
    }
    const halfLen = 82 + Math.random() * 34;
    terrains.push(ensureTerrainGeometry({
      kind: 'chasm', x: tx, y: ty,
      x1: tx - Math.cos(ang) * halfLen, y1: ty - Math.sin(ang) * halfLen,
      x2: tx + Math.cos(ang) * halfLen, y2: ty + Math.sin(ang) * halfLen,
      ang, rot: ang, halfLen, r: 26, bendAmp: (Math.random() - 0.5) * 32, seed: Math.random() * 100
    }));
    if (rings.length < 40) rings.push({ x: tx, y: ty, r: 95, color: '#c77dff', t: 0.35, maxT: 0.35, kind: 'hex' });
    announce('🕳️ 首领撕裂大地！战场新增斜向【断层裂谷】', '#c77dff', 2.6);
  } else {
    const col = kind === 'lava' ? '#ff6b35' : (kind === 'ice_sheet' ? '#72efdd' : '#a3e635');
    const bossForms = ['slash_vein', 'oblique_slab', 'crescent_arc', 'basin'];
    const form = bossForms[Math.floor(Math.random() * bossForms.length)];
    const spec = form === 'slash_vein'
      ? { kind, form, x: cx, y: cy, rot: ang, len: 220 + Math.round(Math.random() * 85), r: 28, pulse: 0, seed: Math.random() * 100 }
      : (form === 'oblique_slab'
        ? { kind, form, x: cx, y: cy, rot: ang, len: 165 + Math.round(Math.random() * 55), r: 42, pulse: 0, seed: Math.random() * 100 }
        : (form === 'crescent_arc'
          ? { kind, form, x: cx, y: cy, rot: ang, arcR: 120 + Math.round(Math.random() * 35), arcSpan: 1.35, r: 28, pulse: 0, seed: Math.random() * 100 }
          : { kind, form: 'basin', x: cx, y: cy, rot: ang, r: Math.round(baseR * 0.88), stretch: 1.42, pulse: 0, seed: Math.random() * 100 }));
    terrains.push(ensureTerrainGeometry(spec));
    if (rings.length < 40) rings.push({ x: cx, y: cy, r: baseR + 24, color: col, t: 0.35, maxT: 0.35, kind: 'star' });
    const nameMap = { lava: '🌋 首领劈开斜向【熔岩裂脉】封锁走位！', swamp: '🧪 首领倾泻异形【剧毒泥沼沟】污染地面！', ice_sheet: '🧊 首领凝结斜切【寒霜冰岩带】改造战场！' };
    if (nameMap[kind]) announce(nameMap[kind], col, 2.6);
  }
}

function summonSpecialBoss(rel, forceCutscene = false) {
  if (!rel || !rel.def) return;
  const def = rel.def;
  beep(185, 0.26, 'sawtooth', 0.085);
  if (rings.length < 36) rings.push({ x: rel.x, y: rel.y, r: 165, color: def.bossColor, t: 0.42, maxT: 0.42, fill: false });
  if (lightnings.length < 35) {
    lightnings.push({ pts: [{ x: rel.x, y: Math.max(20, rel.y - 280) }, { x: rel.x - 18, y: rel.y - 130 }, { x: rel.x + 14, y: rel.y - 55 }, { x: rel.x, y: rel.y }], color: def.color, t: 0.32, maxT: 0.32 });
  }
  // 首领纯死战机制：不再额外增加冗余倒计时，若常规时间耗尽未分胜负自动转入死战，击败即刻通关领赏！
  spawnWarning(rel.x, rel.y, 'special_boss', def.bossId);
  const bw = document.getElementById('bossBarWrap');
  if (bw) { bw.classList.remove('hidden', 'mythic'); }
  if (player) {
    player.invuln = 0;
    addText(player.x, player.y - 54, `◆ 特殊首领【${def.bossName}】降临！`, '#ffd166', 20, 2.6);
  }
  const showRarePortrait = shouldRollRareBossPortrait(def.bossId, forceCutscene);
  if (showRarePortrait) {
    startBossCutscene(
      'summon',
      def.bossId,
      def.bossName,
      `🏮 记忆祭坛共鸣 · ${def.icon}${def.name}唤醒`,
      '⚔️ 宿命死战到底（不加冗余时间） · 贴近风眼躲外环斩 · 击败必掉守誓遗物匣！',
      def.bossColor,
      def.color,
      BOSS_CUTSCENE_TOTAL_SEC
    );
  }
  announce(`${def.bossIcon} 特殊首领【${def.bossName}】已唤醒！宿命死战开启，击败必掉首领秘宝箱`, '#ffd166', 4.0);
  logInfo('SPECIAL_BOSS', `召唤特殊首领 ${def.bossName}(${def.bossId}) · 立绘特写=${showRarePortrait} · 纯死战模式`);
}

function beginWave(retryMeta = null) {
  // 旧检查点也可能含尚未择定分支的五阶武器；先完成选择，再建立本层起点。
  if (typeof resetWeaponEvolutionUI === 'function') resetWeaponEvolutionUI();
  if (typeof getPendingEvoWeapon === 'function' && getPendingEvoWeapon()) {
    state = 'evolution';
    resetJoy();
    for (const key in keys) keys[key] = false;
    const currentPlayer = player, currentWave = wave;
    checkPendingWeaponEvolutions(() => {
      if (player === currentPlayer && wave === currentWave && state === 'evolution') beginWave(retryMeta);
    });
    return;
  }
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
  // 16 层平滑回合时长：第 1 层 27s 起步，逐层递增至 60s；首领层采用 45s~65s 紧凑回合时长（提前击杀首领可继续刷满小怪晶石，超时未杀则转入死战）
  waveTime = isBossWave ? Math.min(65, 39 + Math.round(wave * 1.6)) : Math.min(60, 25 + Math.round(wave * 2.3));
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
  relics = []; sporeZones = []; banners = []; bossCutscene = null; pendingBossCutscene = null; sandGustT = 0;
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

  // 第 2 层起解锁【场景专属怪物】，第 5 层起概率触发【场景专属环境异象】（前 5 层降低复合压力，中后期异象概率补偿）
  if (wave >= 2) {
    sceneMobEnabled = hordeWave || Math.random() < Math.min(0.88, (wave <= 5 ? 0.42 : 0.54) + (wave - 1) * 0.05);
    const sceneEvtProb = wave === 5 ? 0.18 : Math.min(0.68, 0.34 + (wave - 5) * 0.065);
    activeSceneEvent = (wave >= 5 && !isBossWave && Math.random() < sceneEvtProb) ? curScene.eventId : null;
    sceneEventT = activeSceneEvent ? 4.2 : 999;
  } else {
    sceneMobEnabled = false;
    activeSceneEvent = null;
    sceneEventT = 999;
  }

  // 非首领层开场立即刷出合围前锋群（前 5 层开场合围数量与距离适度放宽，降低前期开荒贴脸压迫）
  if (!isBossWave) {
    const earlyOpenMul = wave <= 2 ? 0.62 : (wave <= 4 ? 0.70 : (wave === 5 ? 0.80 : (wave === 6 ? 0.94 : 1.0)));
    const openCnt = Math.max(2, Math.round((wave === 1 ? 5 : 4) * earlyOpenMul * diff.spawnMul));
    for (let oi = 0; oi < openCnt; oi++) {
      const oa = (oi / openCnt) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const od = (wave <= 5 ? 325 : 265) + Math.random() * 125;
      const ox = Math.max(60, Math.min(WORLD.w - 60, player.x + Math.cos(oa) * od));
      const oy = Math.max(60, Math.min(WORLD.h - 60, player.y + Math.sin(oa) * od));
      spawnWarning(ox, oy, pickWaveEnemyType(wave));
    }
  }

  // 1~16 层主线剧情攀登期间禁用随机奇遇首领祭坛（确保首领 100% 仅在第 4/8/12/16 层固定登场，无尽模式提高大型召唤法阵刷新率）
  const relicChance = (endlessMode && wave >= 2 && !isBossWave) ? Math.min(0.45, 0.25 + (player.luck || 0) * 0.0025) : 0;
  relicSpawnT = Math.random() < relicChance ? (3.2 + Math.random() * 3.0) : -1;

  const portalNote = portals.length >= 2 ? ' · 🌀双生晶裂门已开启' : '';
  const waveIntro = `${curScene.icon} 第 ${wave} 层：${curScene.name}${activeSceneEvent ? ' · ' + curScene.eventIcon + curScene.eventName : ''}${portalNote}`;
  logInfo('WAVE', `进入第 ${wave} 层 (${waveTime}s) · 场景=${curScene.name}(${curScene.id}) · 首领层=${isBossWave} · 地形=${terrains.length}处+传送门=${portals.length} · 专属怪=${sceneMobEnabled} · 异象=${activeSceneEvent || '无'} · 地图=${WORLD.w}x${WORLD.h}`);
  announce(waveIntro, curScene.accent2 || '#ffd166', 3.4);

  // 部署自动防御炮台与浮游激光塔（机械师天赋 + 扳手 + 无人机舱 + 工程装备 + 5阶进化额外炮台！）
  const bulletTurretTiers = [];
  const laserTurretTiers = [];
  for (let i = 0; i < (player.bonusTurrets || 0); i++) bulletTurretTiers.push(2);
  for (let i = 0; i < (player.laserTurrets || 0); i++) laserTurretTiers.push(2);
  for (let wi = 0; wi < player.weapons.length; wi++) {
    const w = player.weapons[wi];
    if (!w) continue;
    const ev = typeof getWeaponEvo === 'function' ? getWeaponEvo(w) : null;
    if (w.id === 'wrench') {
      bulletTurretTiers.push(w.tier);
      if (ev && ev.extraTurret) {
        for (let k = 0; k < ev.extraTurret; k++) bulletTurretTiers.push(w.tier);
      }
      if (ev && ev.extraLaserTurret) {
        for (let k = 0; k < ev.extraLaserTurret; k++) laserTurretTiers.push(w.tier);
      }
    } else if (w.id === 'drone_bay') {
      laserTurretTiers.push(w.tier);
      if (ev && ev.extraLaserTurret) {
        for (let k = 0; k < ev.extraLaserTurret; k++) laserTurretTiers.push(w.tier);
      }
    }
  }
  const bulletTurrets = bulletTurretTiers.length;
  const laserTurrets = laserTurretTiers.length;
  const totalT = bulletTurrets + laserTurrets;
  for (let i = 0; i < totalT; i++) {
    const a = (i / Math.max(1, totalT)) * Math.PI * 2;
    const dist = 115 + (i % 2) * 52;
    const isLaser = i >= bulletTurrets;
    const tier = isLaser ? laserTurretTiers[i - bulletTurrets] : bulletTurretTiers[i];
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
      const pickTwinVar = Math.random() < 0.5 ? v1 : v2;
      if (shouldRollRareBossPortrait(pickTwinVar, false)) {
        const bShown = pickTwinVar === v2 ? b2 : b1;
        queueBossCutscene('final_boss', pickTwinVar, `${b1.name} & ${b2.name}`, `🕯️ 守誓主宰降临 · ${bShown.epithet || '无尽双主宰同台'}`, '⚔️ 贴近风眼可躲避外环大招 · 抓住破绽窗口斩破封印！', bShown.color, '#ffd166', BOSS_CUTSCENE_TOTAL_SEC);
      }
      announce(`👑 无尽双主宰降临：${b1.name} & ${b2.name}！`, '#ff4d6d', 4.0);
    } else {
      if (typeof waveCheckpoint !== 'undefined' && waveCheckpoint) waveCheckpoint.waveBossIds = [v1];
      spawnWarning(WORLD.w / 2, bossY, 'boss', v1);
      if (shouldRollRareBossPortrait(v1, false)) {
        queueBossCutscene('final_boss', v1, b1.name, `🕯️ 第 ${wave} 层守誓之主 · ${b1.epithet || '守层主宰降临'}`, '⚔️ 贴近风眼可躲避外环大招 · 抓住破绽窗口斩破封印！', b1.color, '#ffd166', BOSS_CUTSCENE_TOTAL_SEC);
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
      const pickDualMini = Math.random() < 0.5 ? m1 : m2;
      if (shouldRollRareBossPortrait(pickDualMini, false)) {
        const mbShown = pickDualMini === m2 ? mb2 : mb1;
        queueBossCutscene('elite_boss', pickDualMini, `${mb1.name} & ${mb2.name}`, `⚔️ 幕中双统领镇守 · ${mbShown.epithet || '双统领夹击'}`, '💡 留意冲锋轴线与地面预警 · 击败必掉守誓遗物匣！', mbShown.color, '#ffd166', BOSS_CUTSCENE_TOTAL_SEC);
      }
      announce(`⚔️ 幕中双统领镇守：${mb1.name} & ${mb2.name}！`, '#f72585', 3.6);
    } else {
      if (typeof waveCheckpoint !== 'undefined' && waveCheckpoint) waveCheckpoint.waveBossIds = [m1];
      spawnWarning(WORLD.w / 2, bossY, 'mini_boss', m1);
      if (shouldRollRareBossPortrait(m1, false)) {
        queueBossCutscene('elite_boss', m1, mb1.name, `⚔️ 幕中先锋统领 · ${mb1.epithet || '守桥重甲先锋'}`, '💡 留意冲锋轴线与地面预警 · 击败必掉守誓遗物匣！', mb1.color, '#ffd166', BOSS_CUTSCENE_TOTAL_SEC);
      }
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

const RANGED_ENEMY_TYPES = new Set(['shooter', 'sniper_bug', 'mortar', 'spinner', 'rad_scorpion', 'frost_wisp', 'spore_mother', 'summoner']);

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

// 生态多样化权重刷怪表（怪物总量保持 100% 不变；远程怪刷新占比与同屏上限精准降低 20%，空出份额 1:1 转为同波近战怪）
function pickWaveEnemyType(wv) {
  const rangedCountMul = typeof RANGED_ENEMY_COUNT_MUL === 'number' ? RANGED_ENEMY_COUNT_MUL : 0.80;
  const maxRanged = Math.max(2, Math.round(Math.min(12, 3 + Math.floor(wave * 0.85)) * rangedCountMul));
  const allowRanged = countActiveRangedEnemies() < maxRanged;

  const isExclRanged = !!(curScene.exclMob && RANGED_ENEMY_TYPES.has(curScene.exclMob));
  const exclProb = isExclRanged ? (0.14 * rangedCountMul) : 0.20;
  if (sceneMobEnabled && curScene.exclMob && Math.random() < exclProb) {
    if (!isExclRanged || allowRanged) {
      return curScene.exclMob;
    }
  }

  const meleeTable = [
    ['chaser', 12.5],
    ['stalker', 10.5],
    ['swarmer', 7.2],
    ['splitter', 7.2]
  ];
  if (wv >= 2) {
    meleeTable.push(['charger', 11.8]);
    meleeTable.push(['shielder', 7.8]);
  }
  if (wv >= 3) {
    meleeTable.push(['sand_worm', 9.0]);
    meleeTable.push(['bomber', 6.4]);
  }
  if (wv >= 4) {
    meleeTable.push(['brute', wv === 4 ? 4.2 : 8.6]);
    meleeTable.push(['magma_imp', 5.2]);
  }
  if (wv >= 6) {
    meleeTable.push(['juggernaut', 6.2]);
    meleeTable.push(['healer', 4.6]);
  }

  const rangedTable = [
    ['shooter', wv === 1 ? 5.5 : 7.0]
  ];
  if (wv >= 2) {
    rangedTable.push(['rad_scorpion', 6.8]);
  }
  if (wv >= 3) {
    rangedTable.push(['frost_wisp', 5.6]);
    rangedTable.push(['sniper_bug', 5.2]);
  }
  if (wv >= 4) {
    rangedTable.push(['spinner', 5.2]);
    rangedTable.push(['mortar', 5.0]);
  }
  if (wv >= 5) {
    rangedTable.push(['summoner', 5.3]);
  }
  if (wv >= 5 || hordeWave || (endlessMode && wv >= 7)) {
    rangedTable.push(['spore_mother', 4.3]);
  }

  let meleeW = 0;
  for (let i = 0; i < meleeTable.length; i++) meleeW += meleeTable[i][1];
  let rangedW = 0;
  for (let i = 0; i < rangedTable.length; i++) rangedW += rangedTable[i][1];

  const baseRangedShare = (meleeW + rangedW) > 0 ? (rangedW / (meleeW + rangedW)) : 0;
  const pickRanged = allowRanged && rangedW > 0 && Math.random() < (baseRangedShare * rangedCountMul);
  const chosenTable = pickRanged ? rangedTable : meleeTable;
  const chosenTotalW = pickRanged ? rangedW : meleeW;

  let r = Math.random() * chosenTotalW;
  for (let i = 0; i < chosenTable.length; i++) {
    r -= chosenTable[i][1];
    if (r <= 0) return chosenTable[i][0];
  }
  return 'chaser';
}

// 多形态地面与空间高危预警机关（支持十字棱镜光轨 cross_beam、次元裂空斩痕 void_slash、高抛榴弹准星 mortar_shell、六棱冰晶 frost_hex、熔火曜轮 flame_pillar、落雷星印 thunder_sigil、毒沼花苞 venom_mire 及外环风眼 innerSafeR）
function spawnHazard(x, y, r, dmg, delay = 1.22, extra = {}) {
  if (hazards.length >= 34 && !extra.innerSafeR) return;
  const pad = extra.style === 'cross_beam' || extra.style === 'void_slash' ? 56 : (r + 12);
  const cx = Math.max(pad, Math.min(WORLD.w - pad, x));
  const cy = Math.max(pad, Math.min(WORLD.h - pad, y));
  hazards.push({
    x: cx, y: cy, r,
    style: extra.style || 'circle',
    angle: extra.angle || 0,
    rotSpd: extra.rotSpd || 0,
    halfLen: extra.halfLen || 0,
    halfW: extra.halfW || 0,
    srcX: extra.srcX,
    srcY: extra.srcY,
    shrapnel: extra.shrapnel || 0,
    innerSafeR: extra.innerSafeR || 0,
    dmg: Math.max(3, Math.round(dmg)),
    enemyDmg: extra.enemyDmg || 0,
    dropMat: extra.dropMat || 0,
    color: extra.color || '#ff3b6b',
    t: delay, maxT: delay
  });
}

// 全异星怪物、4 大新增特异兵种、5 大场景专属怪、随机精英统领、4 大主宰 Boss 与 3 大奇遇首领生成
// （整体怪物与首领血量下调 -20%，前 5 层进一步温和减压，第 10 轮及以后保持陡峭高压！）
function createEnemy(x, y, type, variant = '') {
  const hpBaseMul = typeof MONSTER_HP_BASE_MUL === 'number' ? MONSTER_HP_BASE_MUL : 1.80;
  const hpLinearSlope = typeof MONSTER_HP_LINEAR_SLOPE === 'number' ? MONSTER_HP_LINEAR_SLOPE : 0.72;
  const bossHpMul = typeof BOSS_HP_MUL === 'number' ? BOSS_HP_MUL : 4.80;
  const lateBossMaxMul = typeof LATE_BOSS_HP_MUL === 'number' ? LATE_BOSS_HP_MUL : 12.00;
  // 后期首领血量阶梯：第 10 层及以后进一步陡峭拉升
  const lateBossScale = wave <= 4 ? 1.00 : (wave <= 6 ? 1.90 : (wave <= 8 ? 3.80 : (wave <= 10 ? 8.40 : (wave <= 12 ? 11.20 : lateBossMaxMul))));
  const monsterDmgMul = typeof MONSTER_DMG_MUL === 'number' ? MONSTER_DMG_MUL : 1.20;
  const midLateHpMul = typeof getMidLateWaveHpMul === 'function' ? getMidLateWaveHpMul(wave) : 1.0;
  const midLateDmgMul = typeof getMidLateWaveDmgMul === 'function' ? getMidLateWaveDmgMul(wave) : 1.0;
  const endlessMul = wave > MAX_WAVE ? Math.pow(1.20, wave - MAX_WAVE) : 1;
  const wIdx = Math.max(0, wave - 1);
  // 常规魔物与首领生命值、攻击力随波数进一步成长：中后期血量再翻一倍（2.0x）、攻击力再翻一倍（2.0x）！
  const clampedStoryIdx = Math.min(15, wIdx);
  const s = hpBaseMul * (1 + wIdx * hpLinearSlope) * midLateHpMul * endlessMul * diff.hpMul;
  const dm = (1 + clampedStoryIdx * 0.105 + Math.max(0, Math.min(16, wave) - 7) * 0.048) * midLateDmgMul * (wave > MAX_WAVE ? Math.pow(1.10, wave - MAX_WAVE) : 1) * diff.dmgMul * monsterDmgMul;
  const monsterSpdMul = typeof MONSTER_SPD_MUL === 'number' ? MONSTER_SPD_MUL : 0.80;
  const sm = (1 + Math.min(0.18, wIdx * 0.012)) * diff.spdMul * monsterSpdMul;
  const base = {
    x, y, hitFlash: 0, phase: Math.random() * 6.28, vx: 0, vy: 0, faceA: 0,
    burnT: 0, burnTick: 0, burnDmg: 0, chillT: 0, freezeT: 0, sunderT: 0, _touchCd: 0,
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
  const mythicRate = PHASE2_AWAKEN_RATE;
  const bossDefs = getBossDefs();
  const miniBossDefs = getMiniBossDefs();
  const specialRelics = getSpecialRelics();
  if (type === 'boss') {
    const bKey = (variant && bossDefs[variant]) ? variant : getFixedActBossForWave(wave);
    const bDef = bossDefs[bKey] || FALLBACK_BOSS_DEFS.butcher;
    const isStoryBoss = (!endlessMode && wave <= MAX_WAVE);
    const twinScale = (!isStoryBoss && (diff.doubleBoss || (endlessMode && wave >= 20))) ? 0.68 : 1;
    // 四幕固定首领血量提高 300%，且中后期首领血量再额外提升最高 +200%（第 12~16 层及无尽轮回达 3.0x 终局强度）
    let baseBossHp = 13600;
    if (wave <= 4) baseBossHp = 800;
    else if (wave <= 8) baseBossHp = 3400;
    else if (wave <= 12) baseBossHp = 7600;
    else if (wave <= 16) baseBossHp = 12600;
    else baseBossHp = 14800 + Math.max(0, wave - MAX_WAVE) * 3600;
    const bhp = Math.round(baseBossHp * bossHpMul * lateBossScale * midLateHpMul * endlessMul * diff.hpMul * twinScale);
    const bossDmgBase = wave <= 4 ? 6.2 : (wave <= 8 ? 9.6 : (wave <= 12 ? 11.2 : 12.6));
    // 主线以稳定的两阶段讲清每位守誓者的坚持与败北；无尽保留随机神话觉醒。
    const phase2Chance = isStoryBoss ? 1 : mythicRate;
    ent = {
      ...base, r: 48, hp: bhp, maxHp: bhp, spd: bDef.spd * sm, dmg: Math.round(bossDmgBase * dm),
      color: bDef.color, type: 'boss', variant: bKey,
      bossTitle: `${bDef.icon} ${bDef.name}${isStoryBoss ? ' · 第一阶段' : ''}`,
      storyPhaseBoss: isStoryBoss, storyStage: isStoryBoss ? 1 : 0,
      dashT: 2.5, sumT: 5.8, meteorT: 4.1, skillT: 2.0, sigSkillT: 4.2, terrainCd: 6.2, ringCd: 4.9,
      burstLeft: 0, burstCd: 0, canPhase2: Math.random() < phase2Chance, mythicPhase2: false,
      mat: wave <= 4 ? 26 : (wave <= 8 ? 34 : (wave <= 12 ? 42 : 52))
    };
  } else if (type === 'mini_boss') {
    const mKey = (variant && miniBossDefs[variant]) ? variant : getFixedMiniBossForWave(wave, false);
    const mDef = miniBossDefs[mKey] || FALLBACK_MINI_BOSS_DEFS.vanguard;
    const twinMiniScale = (diff.dualElite && wave >= 10) ? 0.70 : 1;
    const mhp = Math.round((460 + wave * 95 + Math.pow(Math.max(0, Math.min(16, wave) - 3), 2.05) * 32) * bossHpMul * lateBossScale * midLateHpMul * endlessMul * diff.hpMul * twinMiniScale);
    ent = {
      ...base, r: 36, hp: mhp, maxHp: mhp, spd: mDef.spd * sm, dmg: Math.round(8.4 * dm),
      color: mDef.color, type: 'mini_boss', variant: mKey, bossTitle: `${mDef.icon} ${mDef.name}`,
      dashT: 2.3, meteorT: 4.4, skillT: 1.9, ringCd: 5.0,
      canPhase2: Math.random() < mythicRate, mythicPhase2: false, mat: 24
    };
  } else if (type === 'special_boss') {
    const relDef = specialRelics.find(r => r.bossId === variant) || specialRelics[0];
    const shp = Math.round((960 + wave * 240 + Math.pow(wave, 1.92) * 14) * bossHpMul * lateBossScale * midLateHpMul * endlessMul * diff.hpMul);
    const sSpd = relDef.bossId === 'crimson_lord' ? 98 : (relDef.bossId === 'golden_golem' ? 74 : 86);
    ent = {
      ...base, r: 43, hp: shp, maxHp: shp, spd: sSpd * sm, dmg: Math.round(9.0 * dm),
      color: relDef.bossColor, type: 'special_boss', variant: relDef.bossId, bossTitle: `${relDef.bossIcon} ${relDef.bossName}`,
      dashT: 2.1, skillT: 1.9, meteorT: 3.9, sumT: 5.8, terrainCd: 6.2, ringCd: 4.8,
      goldStage: 4, canPhase2: Math.random() < mythicRate, mythicPhase2: false,
      mat: relDef.bossId === 'golden_golem' ? 48 : (relDef.bossId === 'crimson_lord' ? 30 : 26)
    };
  } else if (type === 'stalker') {
    ent = { ...base, r: 14, hp: 20.0 * s, maxHp: 20.0 * s, spd: 138 * sm, dmg: Math.round(5.0 * dm), color: '#06d6a0', type, slashCd: 0.7, stepCd: 2.0 + Math.random(), zigT: 0.35 + Math.random() * 0.25, zigDir: Math.random() < 0.5 ? 1 : -1, mat: 2 };
  } else if (type === 'sniper_bug') {
    ent = { ...base, r: 15, hp: 13.0 * s, maxHp: 13.0 * s, spd: 54 * sm, dmg: Math.round(6.8 * dm), color: '#ef233c', type, shotT: 2.1 + Math.random() * 0.8, aimA: undefined, aimMaxT: 0.72, recoilT: 0, mat: 3 };
  } else if (type === 'spinner') {
    ent = { ...base, r: 19, hp: 28 * s, maxHp: 28 * s, spd: 74 * sm, dmg: Math.round(5.0 * dm), color: '#f59e0b', type, shotT: 2.1 + Math.random() * 0.8, orbitDir: Math.random() < 0.5 ? 1 : -1, mat: 3 };
  } else if (type === 'juggernaut') {
    ent = { ...base, r: 38, hp: 310 * s, maxHp: 310 * s, spd: 45 * sm, dmg: Math.round(11.2 * dm), color: '#475569', type, slamCd: 3.0, mat: 7 };
  } else if (type === 'rad_scorpion') {
    ent = { ...base, r: 21, hp: 36 * s, maxHp: 36 * s, spd: 70 * sm, dmg: Math.round(5.5 * dm), color: '#a3e635', type, shotT: 2.0 + Math.random() * 0.8, mat: 3 };
  } else if (type === 'sand_worm') {
    ent = { ...base, r: 18, hp: 48 * s, maxHp: 48 * s, spd: 108 * sm, dmg: Math.round(5.8 * dm), color: '#f4a261', type, dashT: 1.65 + Math.random() * 0.7, mat: 3 };
  } else if (type === 'frost_wisp') {
    ent = { ...base, r: 15, hp: 17 * s, maxHp: 17 * s, spd: 82 * sm, dmg: Math.round(4.6 * dm), color: '#48cae4', type, shotT: 1.8 + Math.random() * 0.8, orbitDir: Math.random() < 0.5 ? 1 : -1, mat: 3 };
  } else if (type === 'magma_imp') {
    ent = { ...base, r: 14, hp: 20 * s, maxHp: 20 * s, spd: 118 * sm, dmg: Math.round(5.8 * dm), color: '#fb5607', type, mat: 3 };
  } else if (type === 'spore_mother') {
    ent = { ...base, r: 26, hp: 56 * s, maxHp: 56 * s, spd: 48 * sm, dmg: Math.round(5.8 * dm), color: '#c77dff', type, shotT: 2.4 + Math.random() * 0.9, mat: 4 };
  } else if (type === 'charger') {
    ent = { ...base, r: 23, hp: 68 * s, maxHp: 68 * s, spd: 84 * sm, dmg: Math.round(6.8 * dm), color: '#f77f00', type, dashT: 1.75 + Math.random() * 0.75, mat: 3 };
  } else if (type === 'shooter') {
    ent = { ...base, r: 16, hp: 13.5 * s, maxHp: 13.5 * s, spd: 62 * sm, dmg: Math.round(4.2 * dm), color: '#00b4d8', type, shotT: 1.6 + Math.random() * 0.9, mat: 2 };
  } else if (type === 'mortar') {
    ent = { ...base, r: 20, hp: 24 * s, maxHp: 24 * s, spd: 52 * sm, dmg: Math.round(7.8 * dm), color: '#ff9f1c', type, shotT: 2.0 + Math.random() * 1.0, mat: 3 };
  } else if (type === 'bomber') {
    ent = { ...base, r: 15, hp: 18 * s, maxHp: 18 * s, spd: 114 * sm, dmg: Math.round(8.8 * dm), color: '#ff4d6d', type, primed: false, fuseT: 1.25, maxFuseT: 1.25, blastR: 86, mat: 2 };
  } else if (type === 'splitter') {
    ent = { ...base, r: 25, hp: 54 * s, maxHp: 54 * s, spd: 70 * sm, dmg: Math.round(4.8 * dm), color: '#52b788', type, hopT: 0.8 + Math.random() * 0.6, spitT: 2.1 + Math.random() * 0.9, mat: 3 };
  } else if (type === 'mini_slime') {
    ent = { ...base, r: 10, hp: 9.0 * s, maxHp: 9.0 * s, spd: 140 * sm, dmg: Math.max(2, Math.round(2.6 * dm)), color: '#74c69d', type, mat: Math.random() < 0.35 ? 1 : 0 };
  } else if (type === 'shielder') {
    ent = { ...base, r: 24, hp: 96 * s, maxHp: 96 * s, spd: 62 * sm, dmg: Math.round(6.0 * dm), color: '#5c677d', type, mat: 4 };
  } else if (type === 'summoner') {
    ent = { ...base, r: 18, hp: 22 * s, maxHp: 22 * s, spd: 54 * sm, dmg: Math.round(3.5 * dm), color: '#7209b7', type, sumT: 3.1 + Math.random(), boltT: 2.4, mat: 4 };
  } else if (type === 'healer') {
    ent = { ...base, r: 17, hp: 28 * s, maxHp: 28 * s, spd: 62 * sm, dmg: Math.round(3.0 * dm), color: '#2ec4b6', type, healT: 2.5, mat: 4 };
  } else if (type === 'brute') {
    ent = { ...base, r: 33, hp: 195 * s, maxHp: 195 * s, spd: 56 * sm, dmg: Math.round(9.2 * dm), color: '#9d4edd', type, slamCd: 2.4, slamWindup: 0, bargeCd: 1.9 + Math.random() * 0.7, bargeT: 0, mat: 5 };
  } else {
    ent = { ...base, r: 15, hp: 25.0 * s, maxHp: 25.0 * s, spd: (88 + wave * 2.0) * sm, dmg: Math.max(2, Math.round(3.8 * dm)), color: '#d65db1', type: 'chaser', lungeCd: 1.65 + Math.random() * 0.8, lungeT: 0, mat: Math.random() < 0.65 ? 1 : 2 };
  }

  // 第 3 波起按难度刷出【狂化精英词缀怪】（前 5 层降低精英刷新率与压迫，第 10 轮及以后精英刷新率与狂化血伤倍率显著提升！）
  const isBossLike = type === 'boss' || type === 'mini_boss' || type === 'special_boss';
  const canElite = wave >= 3 && !isBossLike && type !== 'mini_slime' && type !== 'bomber' && (type !== 'juggernaut' || wave >= 8);
  const rawEChance = (diff.eliteRate || 0.05) + Math.min(0.12, (wave - 3) * 0.011);
  const lateEliteAdd = wave >= 10 ? (0.045 + Math.min(0.085, (wave - 10) * 0.013)) : 0;
  const eChance = wave === 3 ? rawEChance * 0.40 : (wave === 4 ? rawEChance * 0.55 : (wave === 5 ? rawEChance * 0.72 : (rawEChance + lateEliteAdd)));
  if (canElite && Math.random() < eChance) {
    ent.elite = true;
    ent.r = Math.round(ent.r * 1.20);
    ent.hp = Math.round(ent.hp * (wave >= 10 ? 2.45 : (wave <= 5 ? 1.90 : 2.15)));
    ent.maxHp = ent.hp;
    ent.spd *= (wave >= 10 ? 1.09 : 1.05);
    ent.dmg = Math.round(ent.dmg * (wave >= 10 ? 1.32 : (wave <= 5 ? 1.15 : 1.22)));
    ent.mat = Math.max(2, Math.round(ent.mat * 2));
  }

  enemies.push(ent);
  addBurst(x, y, ent.elite ? '#ffd166' : ent.color, isBossLike ? 16 : (ent.elite ? 8 : 5), isBossLike ? 150 : 85);
  return ent;
}
if (typeof SpireBootGate !== 'undefined' && SpireBootGate) {
  SpireBootGate.setStep(52, '波次与地形引擎就绪 · 正在装载渲染管线…');
}
