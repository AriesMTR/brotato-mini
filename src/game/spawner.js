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

// 正交嵌地石砌地形块轮廓偏置器（顺时针局部坐标系 +u 向右、+v 向下，支持任意正负边距与凹凸直角 100% 严丝合缝偏置）
function _offsetOrthoPoly(pts, d) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
    const l1 = Math.hypot(dx1, dy1) || 1;
    const nx1 = dy1 / l1, ny1 = -dx1 / l1;
    const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
    const l2 = Math.hypot(dx2, dy2) || 1;
    const nx2 = dy2 / l2, ny2 = -dx2 / l2;
    out.push({ x: curr.x + (nx1 + nx2) * d, y: curr.y + (ny1 + ny2) * d });
  }
  return out;
}

// 正交石块凸角 45° 切角倒棱并旋转至世界坐标（凹角保持利落 90° 咬合，彻底告别香肠曲线与烂泥团块）
function _chamferAndRotatePoly(localPts, chamfer, cx, cy, ca, sa) {
  const n = localPts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = localPts[(i - 1 + n) % n];
    const curr = localPts[i];
    const next = localPts[(i + 1) % n];
    const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
    const l1 = Math.hypot(dx1, dy1) || 1;
    const ux1 = dx1 / l1, uy1 = dy1 / l1;
    const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
    const l2 = Math.hypot(dx2, dy2) || 1;
    const ux2 = dx2 / l2, uy2 = dy2 / l2;
    const cross = ux1 * uy2 - uy1 * ux2;
    if (cross > 0.1 && chamfer > 0) {
      const c = Math.min(chamfer, l1 * 0.34, l2 * 0.34);
      const ax = curr.x - ux1 * c, ay = curr.y - uy1 * c;
      const bx = curr.x + ux2 * c, by = curr.y + uy2 * c;
      out.push(
        { x: cx + ca * ax - sa * ay, y: cy + sa * ax + ca * ay },
        { x: cx + ca * bx - sa * by, y: cy + sa * bx + ca * by }
      );
    } else {
      out.push({ x: cx + ca * curr.x - sa * curr.y, y: cy + sa * curr.x + ca * curr.y });
    }
  }
  return out;
}

// 生成五大嵌地石砌真地形块局部正交多边形与碰撞矩形盒组（细长矩石槽 rect_strip / 折角L型石槽 l_block / T型拼接槽 t_block / 错位阶梯双拼块 stepped_block / 重型方砖池 square_slab）
function _buildBlockLocalSpec(tr) {
  const form = tr.form || 'rect_strip';
  const s = tr.seed !== undefined ? tr.seed : 2.3;
  if (form === 'l_block') {
    const W = Math.max(176, tr.w || (196 + ((s * 23) % 48)));
    const H = Math.max(158, tr.h || (172 + ((s * 19) % 42)));
    const T = Math.max(70, Math.min(Math.min(W, H) * 0.48, tr.thick || (74 + ((s * 7) % 14))));
    const flipU = (Math.floor(s * 11) % 2 === 0) ? 1 : -1;
    // 以视觉重心微调局部原点，使旋转与外接圆更均衡
    const ox = -W * 0.34, oy = -H * 0.34;
    const rawPts = [
      { x: ox, y: oy },
      { x: ox + W, y: oy },
      { x: ox + W, y: oy + T },
      { x: ox + T, y: oy + T },
      { x: ox + T, y: oy + H },
      { x: ox, y: oy + H }
    ];
    const pts = flipU < 0
      ? rawPts.map(p => ({ x: -p.x, y: p.y })).reverse()
      : rawPts;
    const boxes = flipU < 0
      ? [
          { u0: -(ox + W), u1: -ox, v0: oy, v1: oy + T },
          { u0: -(ox + T), u1: -ox, v0: oy, v1: oy + H }
        ]
      : [
          { u0: ox, u1: ox + W, v0: oy, v1: oy + T },
          { u0: ox, u1: ox + T, v0: oy, v1: oy + H }
        ];
    return { pts, boxes, minThick: T };
  }
  if (form === 't_block') {
    const W = Math.max(186, tr.w || (206 + ((s * 29) % 48)));
    const H = Math.max(152, tr.h || (166 + ((s * 17) % 38)));
    const T = Math.max(70, Math.min(W * 0.44, tr.thick || (74 + ((s * 5) % 12))));
    const hw = W * 0.5, st = T * 0.5;
    const topY = -H * 0.42, botY = topY + H;
    const pts = [
      { x: -hw, y: topY },
      { x: hw, y: topY },
      { x: hw, y: topY + T },
      { x: st, y: topY + T },
      { x: st, y: botY },
      { x: -st, y: botY },
      { x: -st, y: topY + T },
      { x: -hw, y: topY + T }
    ];
    const boxes = [
      { u0: -hw, u1: hw, v0: topY, v1: topY + T },
      { u0: -st, u1: st, v0: topY, v1: botY }
    ];
    return { pts, boxes, minThick: T };
  }
  if (form === 'stepped_block') {
    const W = Math.max(210, tr.w || (228 + ((s * 31) % 52)));
    const T = Math.max(72, tr.thick || (74 + ((s * 9) % 12)));
    const overlapY = Math.round(T * 0.74);
    const H = T * 2 - overlapY;
    const hw = W * 0.5, hh = H * 0.5;
    const ox = Math.max(36, Math.min(hw - 42, Math.round(W * 0.21)));
    const flipU = (Math.floor(s * 13) % 2 === 0) ? 1 : -1;
    const rawPts = [
      { x: -hw, y: -hh },
      { x: ox, y: -hh },
      { x: ox, y: hh - T },
      { x: hw, y: hh - T },
      { x: hw, y: hh },
      { x: -ox, y: hh },
      { x: -ox, y: -hh + T },
      { x: -hw, y: -hh + T }
    ];
    const pts = flipU < 0
      ? rawPts.map(p => ({ x: -p.x, y: p.y })).reverse()
      : rawPts;
    const boxes = flipU < 0
      ? [
          { u0: -ox, u1: hw, v0: -hh, v1: -hh + T },
          { u0: -hw, u1: ox, v0: hh - T, v1: hh }
        ]
      : [
          { u0: -hw, u1: ox, v0: -hh, v1: -hh + T },
          { u0: -ox, u1: hw, v0: hh - T, v1: hh }
        ];
    return { pts, boxes, minThick: overlapY };
  }
  if (form === 'square_slab') {
    const W = Math.max(138, tr.w || (150 + ((s * 21) % 36)));
    const H = Math.max(122, tr.h || (130 + ((s * 15) % 32)));
    const hw = W * 0.5, hh = H * 0.5;
    return {
      pts: [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
      ],
      boxes: [{ u0: -hw, u1: hw, v0: -hh, v1: hh }],
      minThick: Math.min(W, H)
    };
  }
  // 默认 rect_strip：细长嵌地矩石长槽块（长宽比 ~3.0:1 ~ 4.2:1，横纵斜切皆极利落）
  const W = Math.max(196, tr.len || tr.w || (236 + ((s * 37) % 92)));
  const H = Math.max(70, tr.wid || (tr.r ? tr.r * 2.2 : 0) || (74 + ((s * 11) % 18)));
  const hw = W * 0.5, hh = H * 0.5;
  return {
    pts: [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh }
    ],
    boxes: [{ u0: -hw, u1: hw, v0: -hh, v1: hh }],
    minThick: H
  };
}

// 惰性烘焙嵌地石砌地形块几何（支持细长矩石槽 rect_strip、L型折角石块 l_block、T型石块 t_block、错位双拼块 stepped_block、重型方砖台 square_slab 与石砌断层深渊 chasm，零每帧分配，碰撞与像素 100% 对齐）
function ensureTerrainGeometry(tr) {
  if (!tr || (tr._geoReady && tr._geoX === tr.x && tr._geoY === tr.y)) return tr;
  const s = tr.seed !== undefined ? tr.seed : 2.3;
  tr.seed = s;
  if (tr.rot === undefined) tr.rot = 0;
  const ca0 = Math.cos(tr.rot), sa0 = Math.sin(tr.rot);
  tr._cosR = ca0; tr._sinR = sa0;

  if (tr.kind === 'chasm') {
    const halfL = Math.max(78, tr.halfLen || 108);
    const baseW = Math.max(24, tr.r || 30);
    const isElbow = tr.chasmElbow !== undefined ? tr.chasmElbow : (Math.floor(s * 7) % 5 >= 3);
    tr.chasmElbow = isElbow;
    let localOrtho, spine;
    if (isElbow) {
      const armA = halfL * 1.12, armB = halfL * 0.94;
      const T = baseW * 2;
      const ox = -armA * 0.36, oy = -armB * 0.36;
      localOrtho = [
        { x: ox, y: oy },
        { x: ox + armA, y: oy },
        { x: ox + armA, y: oy + T },
        { x: ox + T, y: oy + T },
        { x: ox + T, y: oy + armB },
        { x: ox, y: oy + armB }
      ];
      const p0u = ox + baseW, p0v = oy + armB - baseW * 0.65;
      const p1u = ox + baseW, p1v = oy + baseW;
      const p2u = ox + armA - baseW * 0.65, p2v = oy + baseW;
      spine = [
        { x: tr.x + ca0 * p0u - sa0 * p0v, y: tr.y + sa0 * p0u + ca0 * p0v, w: baseW },
        { x: tr.x + ca0 * p1u - sa0 * p1v, y: tr.y + sa0 * p1u + ca0 * p1v, w: baseW },
        { x: tr.x + ca0 * p2u - sa0 * p2v, y: tr.y + sa0 * p2u + ca0 * p2v, w: baseW }
      ];
    } else {
      const hw = halfL, hh = baseW;
      localOrtho = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
      ];
      const effL = Math.max(24, hw - baseW * 0.55);
      spine = [
        { x: tr.x - ca0 * effL, y: tr.y - sa0 * effL, w: baseW },
        { x: tr.x + ca0 * effL, y: tr.y + sa0 * effL, w: baseW }
      ];
      tr.x1 = spine[0].x; tr.y1 = spine[0].y;
      tr.x2 = spine[1].x; tr.y2 = spine[1].y;
    }
    tr.spine = spine;
    tr.outerCliff = _chamferAndRotatePoly(_offsetOrthoPoly(localOrtho, 12), 11, tr.x, tr.y, ca0, sa0);
    tr.midCliff = _chamferAndRotatePoly(_offsetOrthoPoly(localOrtho, 2), 8, tr.x, tr.y, ca0, sa0);
    tr.abyssPoly = _chamferAndRotatePoly(_offsetOrthoPoly(localOrtho, -7), 6, tr.x, tr.y, ca0, sa0);
    tr.voidCore = _chamferAndRotatePoly(_offsetOrthoPoly(localOrtho, -Math.min(16, baseW * 0.55)), 4, tr.x, tr.y, ca0, sa0);

    // 石砌路缘砖缝刻线与顶侧受光石棱
    tr.curbJoints = [];
    const outerO = _offsetOrthoPoly(localOrtho, 12);
    const innerO = _offsetOrthoPoly(localOrtho, 2);
    for (let i = 0; i < localOrtho.length; i++) {
      const a = innerO[i], b = innerO[(i + 1) % innerO.length];
      const edX = b.x - a.x, edY = b.y - a.y;
      const eLen = Math.hypot(edX, edY);
      if (eLen < 42) continue;
      const ux = edX / eLen, uy = edY / eLen;
      const nx = uy, ny = -ux;
      const cnt = Math.max(1, Math.floor((eLen - 24) / 42));
      for (let k = 1; k <= cnt; k++) {
        const dist = (eLen / (cnt + 1)) * k;
        const ix = a.x + ux * dist, iy = a.y + uy * dist;
        const ox2 = ix + nx * 10, oy2 = iy + ny * 10;
        tr.curbJoints.push({
          x1: tr.x + ca0 * ix - sa0 * iy, y1: tr.y + sa0 * ix + ca0 * iy,
          x2: tr.x + ca0 * ox2 - sa0 * oy2, y2: tr.y + sa0 * ox2 + ca0 * oy2
        });
      }
    }
    tr.litEdges = [];
    for (let i = 0; i < tr.outerCliff.length; i++) {
      const p0 = tr.outerCliff[i], p1 = tr.outerCliff[(i + 1) % tr.outerCliff.length];
      const edx = p1.x - p0.x, edy = p1.y - p0.y;
      const el = Math.hypot(edx, edy) || 1;
      const wnx = edy / el, wny = -edx / el;
      if (wnx * -0.55 + wny * -0.83 > 0.08) {
        tr.litEdges.push({ x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y });
      }
    }
    let maxReach = 64;
    for (let i = 0; i < outerO.length; i++) {
      const d = Math.hypot(outerO[i].x, outerO[i].y);
      if (d > maxReach) maxReach = d;
    }
    tr.boundR = maxReach + 18;
    tr.halfLen = Math.max(tr.halfLen || 0, tr.boundR);
    tr._geoX = tr.x; tr._geoY = tr.y;
    tr._geoReady = true;
    return tr;
  }

  // 遗留形态名自动映射至五大嵌地石砌方砖块形态
  const legacyMap = {
    slash_vein: 'rect_strip',
    meander_belt: 'l_block',
    oblique_slab: 'stepped_block',
    crescent_arc: 't_block',
    basin: 'square_slab'
  };
  if (legacyMap[tr.form]) tr.form = legacyMap[tr.form];
  if (!tr.form) tr.form = 'rect_strip';

  const spec = _buildBlockLocalSpec(tr);
  const localOrtho = spec.pts;
  tr.boxes = spec.boxes;

  const localOuter = _offsetOrthoPoly(localOrtho, 11);
  const localMid = _offsetOrthoPoly(localOrtho, 4);
  const maxIn1 = Math.min(8, spec.minThick * 0.16);
  const maxIn2 = Math.min(16, spec.minThick * 0.30);
  const maxIn3 = Math.min(23, spec.minThick * 0.41);

  tr.outerRim = _chamferAndRotatePoly(localOuter, 11, tr.x, tr.y, ca0, sa0);
  tr.midRim = _chamferAndRotatePoly(localMid, 9, tr.x, tr.y, ca0, sa0);
  tr.verts = _chamferAndRotatePoly(localOrtho, 7, tr.x, tr.y, ca0, sa0);
  tr.sunkenPoly = tr.verts.map(p => ({ x: p.x + 1.5, y: p.y + 6.5 }));
  tr.inner1 = _chamferAndRotatePoly(_offsetOrthoPoly(localOrtho, -maxIn1), 5, tr.x, tr.y, ca0, sa0);
  tr.inner2 = _chamferAndRotatePoly(_offsetOrthoPoly(localOrtho, -maxIn2), 4, tr.x, tr.y, ca0, sa0);
  tr.inner3 = _chamferAndRotatePoly(_offsetOrthoPoly(localOrtho, -maxIn3), 3, tr.x, tr.y, ca0, sa0);

  let maxR = 68;
  for (let i = 0; i < tr.outerRim.length; i++) {
    const d = Math.hypot(tr.outerRim[i].x - tr.x, tr.outerRim[i].y - tr.y);
    if (d > maxR) maxR = d;
  }
  tr.boundR = maxR + 18;
  tr.halfLen = Math.max(tr.halfLen || 0, tr.boundR);

  // 石砌外框切砖接缝与左上受光高光石棱
  tr.curbJoints = [];
  for (let i = 0; i < localOrtho.length; i++) {
    const a = localOrtho[i], b = localOrtho[(i + 1) % localOrtho.length];
    const edX = b.x - a.x, edY = b.y - a.y;
    const eLen = Math.hypot(edX, edY);
    if (eLen < 40) continue;
    const ux = edX / eLen, uy = edY / eLen;
    const nx = uy, ny = -ux;
    const cnt = Math.max(1, Math.floor((eLen - 22) / 44));
    for (let k = 1; k <= cnt; k++) {
      const dist = (eLen / (cnt + 1)) * k;
      const ix = a.x + ux * dist, iy = a.y + uy * dist;
      const ox2 = ix + nx * 11, oy2 = iy + ny * 11;
      tr.curbJoints.push({
        x1: tr.x + ca0 * ix - sa0 * iy, y1: tr.y + sa0 * ix + ca0 * iy,
        x2: tr.x + ca0 * ox2 - sa0 * oy2, y2: tr.y + sa0 * ox2 + ca0 * oy2
      });
    }
  }
  tr.litEdges = [];
  for (let i = 0; i < tr.outerRim.length; i++) {
    const p0 = tr.outerRim[i], p1 = tr.outerRim[(i + 1) % tr.outerRim.length];
    const edx = p1.x - p0.x, edy = p1.y - p0.y;
    const el = Math.hypot(edx, edy) || 1;
    const wnx = edy / el, wny = -edx / el;
    if (wnx * -0.55 + wny * -0.83 > 0.08) {
      tr.litEdges.push({ x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y });
    }
  }

  // 槽内几何砖格刻线与元素晶体/黑曜石板装饰（100% 几何块状，零烂泥边）
  tr.gridSegs = [];
  const stepG = tr.kind === 'ice_sheet' ? 42 : 48;
  let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
  for (let i = 0; i < tr.boxes.length; i++) {
    const bx = tr.boxes[i];
    if (bx.u0 < uMin) uMin = bx.u0;
    if (bx.u1 > uMax) uMax = bx.u1;
    if (bx.v0 < vMin) vMin = bx.v0;
    if (bx.v1 > vMax) vMax = bx.v1;
  }
  for (let u = Math.ceil((uMin + 18) / stepG) * stepG; u <= uMax - 18; u += stepG) {
    tr.gridSegs.push({
      x1: tr.x + ca0 * u - sa0 * (vMin - 4), y1: tr.y + sa0 * u + ca0 * (vMin - 4),
      x2: tr.x + ca0 * u - sa0 * (vMax + 4), y2: tr.y + sa0 * u + ca0 * (vMax + 4)
    });
  }
  for (let v = Math.ceil((vMin + 18) / stepG) * stepG; v <= vMax - 18; v += stepG) {
    tr.gridSegs.push({
      x1: tr.x + ca0 * (uMin - 4) - sa0 * v, y1: tr.y + sa0 * (uMin - 4) + ca0 * v,
      x2: tr.x + ca0 * (uMax + 4) - sa0 * v, y2: tr.y + sa0 * (uMax + 4) + ca0 * v
    });
  }

  tr.accents = [];
  for (let bIdx = 0; bIdx < tr.boxes.length; bIdx++) {
    const bx = tr.boxes[bIdx];
    const bw = bx.u1 - bx.u0, bh = bx.v1 - bx.v0;
    const majorHoriz = bw >= bh;
    const span = majorHoriz ? bw : bh;
    const cnt = Math.max(2, Math.min(4, Math.floor(span / 68)));
    for (let k = 0; k < cnt; k++) {
      const f = (k + 0.5) / cnt;
      const jit = ((k % 2 === 0 ? 1 : -1) * 0.16);
      const u = majorHoriz ? (bx.u0 + 24 + (bw - 48) * f) : ((bx.u0 + bx.u1) * 0.5 + bw * jit);
      const v = majorHoriz ? ((bx.v0 + bx.v1) * 0.5 + bh * jit) : (bx.v0 + 24 + (bh - 48) * f);
      tr.accents.push({
        x: tr.x + ca0 * u - sa0 * v,
        y: tr.y + sa0 * u + ca0 * v + 3,
        w: 14 + ((k + bIdx) % 2) * 6,
        h: 9 + (k % 2) * 4,
        rot: tr.rot + (tr.kind === 'ice_sheet' ? -0.58 : (k % 2 === 0 ? 0 : Math.PI * 0.25)),
        alt: ((k + bIdx) % 3 === 1)
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
  const maxB = (tr.boundR || 170) + Math.max(0, pad);
  if (dx * dx + dy * dy > maxB * maxB) return false;
  if (tr.boxes && tr.boxes.length) {
    const ca = tr._cosR !== undefined ? tr._cosR : Math.cos(tr.rot || 0);
    const sa = tr._sinR !== undefined ? tr._sinR : Math.sin(tr.rot || 0);
    const u = dx * ca + dy * sa;
    const v = -dx * sa + dy * ca;
    for (let i = 0; i < tr.boxes.length; i++) {
      const b = tr.boxes[i];
      if (u < b.u0 - pad || u > b.u1 + pad || v < b.v0 - pad || v > b.v1 + pad) continue;
      const cr = Math.min(7, (b.u1 - b.u0) * 0.25, (b.v1 - b.v0) * 0.25);
      const effR = Math.max(0, cr + pad);
      const qx = Math.max(0, Math.max(b.u0 + cr - u, u - (b.u1 - cr)));
      const qy = Math.max(0, Math.max(b.v0 + cr - v, v - (b.v1 - cr)));
      if (qx * qx + qy * qy <= effR * effR) return true;
    }
    return false;
  }
  return Math.hypot(dx, dy) < (tr.r || 68) + pad;
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
  if (tr.spine && tr.spine.length >= 2) {
    const out = [];
    for (let i = 0; i < tr.spine.length - 1; i++) {
      const a = tr.spine[i], b = tr.spine[i + 1];
      const segL = Math.hypot(b.x - a.x, b.y - a.y);
      const cnt = Math.max(2, Math.ceil(segL / 52));
      for (let k = 0; k <= cnt; k++) {
        const t = k / cnt;
        out.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          r: (a.w || 28) + 12
        });
      }
    }
    return out;
  }
  if (tr.boxes && tr.boxes.length) {
    const ca = tr._cosR !== undefined ? tr._cosR : Math.cos(tr.rot || 0);
    const sa = tr._sinR !== undefined ? tr._sinR : Math.sin(tr.rot || 0);
    const out = [];
    for (let i = 0; i < tr.boxes.length; i++) {
      const bx = tr.boxes[i];
      const bw = bx.u1 - bx.u0, bh = bx.v1 - bx.v0;
      const majorHoriz = bw >= bh;
      const halfMinor = (majorHoriz ? bh : bw) * 0.5;
      const span = majorHoriz ? bw : bh;
      const cnt = Math.max(2, Math.ceil(span / 58));
      for (let k = 0; k < cnt; k++) {
        const f = cnt === 1 ? 0.5 : (k / (cnt - 1));
        const u = majorHoriz ? (bx.u0 + halfMinor * 0.6 + Math.max(0, bw - halfMinor * 1.2) * f) : (bx.u0 + bx.u1) * 0.5;
        const v = majorHoriz ? (bx.v0 + bx.v1) * 0.5 : (bx.v0 + halfMinor * 0.6 + Math.max(0, bh - halfMinor * 1.2) * f);
        out.push({
          x: tr.x + ca * u - sa * v,
          y: tr.y + sa * u + ca * v,
          r: halfMinor + 11
        });
      }
    }
    return out;
  }
  return [{ x: tr.x, y: tr.y, r: (tr.r || 68) + 10 }];
}

function _canPlaceTerrainBlock(cand, cx, cy, minGap = 82) {
  ensureTerrainGeometry(cand);
  let poly = cand.outerCliff || cand.outerRim || cand.verts || [];
  const wallPad = 72;
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
    const reqGap = (cand.kind === 'chasm' && other.kind === 'chasm') ? 135 : minGap;
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

// 建筑石砌角度选择器：吸附哥特石砖地面的正交角 (0°/90°) 与利落切角 (±45°/±30°)，既有横纵方砖也有斜切长槽，严整高级不凌乱
const _BLOCK_ANGLES = [
  0, Math.PI * 0.5, 0, Math.PI * 0.5,
  Math.PI * 0.25, -Math.PI * 0.25,
  Math.PI / 6, -Math.PI / 6
];
function _pickObliqueAngle() {
  return _BLOCK_ANGLES[Math.floor(Math.random() * _BLOCK_ANGLES.length)];
}

// 全域随机嵌地石砌方砖地形块生成器（覆盖边角、侧翼与走廊，融合细长矩石槽、折角L型块、T型拼接块、错位双拼阶梯块、重型方砖台与石砌断层深渊）
function spawnArenaTerrains() {
  terrains = [];
  portals = [];
  portalPairCd = 0;
  const cx = WORLD.w * 0.5, cy = WORLD.h * 0.5;
  const scId = (curScene && curScene.id) || 'wasteland';
  const compactArena = Math.min(WORLD.w, WORLD.h) < 1260;

  if (scId === 'wasteland') {
    // 🕰️ 倒悬钟楼：随机斜跨或侧翼分布的双生裂隙门 A ↔ B
    const baseA = _pickObliqueAngle() + (Math.random() - 0.5) * 0.35;
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

  // 全场 3x3 九宫战区分区洗牌表（含四角、上下左右侧翼及偏置中场，绝不扎堆中心）
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
    let x = padX + (z.gx + 0.14 + Math.random() * 0.72) * cellW;
    let y = padY + (z.gy + 0.14 + Math.random() * 0.72) * cellH;
    if (z.gx === 1 && z.gy === 1 && Math.hypot(x - cx, y - cy) < 195) {
      const pushA = _pickObliqueAngle() + 0.35;
      x = cx + Math.cos(pushA) * (205 + Math.random() * 90);
      y = cy + Math.sin(pushA) * (185 + Math.random() * 75);
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
      const halfLen = (92 + Math.random() * 54) * lenScale * (compactArena ? 0.84 : 1.0);
      const r = 26 + Math.round(Math.random() * 7);
      const cand = {
        kind: 'chasm',
        x: pt.x, y: pt.y,
        ang, rot: ang, halfLen, r,
        chasmElbow: Math.random() < 0.38,
        seed: 1.1 + Math.random() * 80
      };
      if (_canPlaceTerrainBlock(cand, cx, cy, 90)) {
        terrains.push(cand);
        return true;
      }
    }
    return false;
  };

  const makeBlockSpec = (kind, form, pt, scale = 1.0) => {
    const rot = _pickObliqueAngle();
    const seed = 1.3 + Math.random() * 90;
    const sc = scale * (compactArena ? 0.86 : 1.0);
    if (form === 'rect_strip') {
      return {
        kind, form, x: pt.x, y: pt.y, rot, seed,
        len: Math.round((225 + Math.random() * 105) * sc),
        wid: Math.max(70, Math.round((74 + Math.random() * 20) * sc)),
        r: 42,
        pulse: Math.random() * 6.28
      };
    }
    if (form === 'l_block') {
      return {
        kind, form, x: pt.x, y: pt.y, rot, seed,
        w: Math.max(176, Math.round((192 + Math.random() * 54) * sc)),
        h: Math.max(158, Math.round((168 + Math.random() * 46) * sc)),
        thick: Math.max(70, Math.round((74 + Math.random() * 14) * sc)),
        r: 46,
        pulse: Math.random() * 6.28
      };
    }
    if (form === 't_block') {
      return {
        kind, form, x: pt.x, y: pt.y, rot, seed,
        w: Math.max(186, Math.round((202 + Math.random() * 52) * sc)),
        h: Math.max(152, Math.round((162 + Math.random() * 42) * sc)),
        thick: Math.max(70, Math.round((74 + Math.random() * 12) * sc)),
        r: 46,
        pulse: Math.random() * 6.28
      };
    }
    if (form === 'stepped_block') {
      return {
        kind, form, x: pt.x, y: pt.y, rot, seed,
        w: Math.max(210, Math.round((224 + Math.random() * 58) * sc)),
        thick: Math.max(72, Math.round((74 + Math.random() * 14) * sc)),
        r: 46,
        pulse: Math.random() * 6.28
      };
    }
    return {
      kind, form: 'square_slab', x: pt.x, y: pt.y, rot, seed,
      w: Math.max(138, Math.round((148 + Math.random() * 38) * sc)),
      h: Math.max(122, Math.round((128 + Math.random() * 34) * sc)),
      r: 52,
      pulse: Math.random() * 6.28
    };
  };

  const pushPool = (kind, preferredForm = '', seedHint = 0) => {
    const formPool = preferredForm
      ? [preferredForm, 'rect_strip', 'l_block', 'square_slab']
      : shuffleArr(['rect_strip', 'l_block', 'stepped_block', 't_block', 'square_slab']);
    for (let tries = 0; tries < 48; tries++) {
      const form = formPool[tries % formPool.length];
      const scale = tries > 30 ? 0.84 : 1.0;
      const pt = tries < 27
        ? sampleArenaPoint(148, 142)
        : { x: 140 + Math.random() * Math.max(120, WORLD.w - 280), y: 140 + Math.random() * Math.max(120, WORLD.h - 280) };
      const cand = makeBlockSpec(kind, form, pt, scale);
      if (seedHint) cand.seed += seedHint * 0.17;
      if (_canPlaceTerrainBlock(cand, cx, cy, tries > 34 ? 64 : 82)) {
        terrains.push(cand);
        return true;
      }
    }
    return false;
  };

  // 每张地图严格只生成【单一主题地形元素】（杜绝多种不同颜色地形混杂）：
  // 一层 foundry -> 仅嵌石熔火方槽 (lava) | 二层 glacier -> 仅碎冕寒晶方砖台 (ice_sheet)
  // 三层 wasteland -> 仅翡翠秘毒方渠 (swamp) + 双生门 | 终层 desert -> 仅石砌断层深渊槽 (chasm)
  const targetBlocks = compactArena ? (4 + Math.floor(Math.random() * 2)) : (5 + Math.floor(Math.random() * 3));
  const formsDeck = shuffleArr([
    'rect_strip', 'l_block', 'stepped_block', 't_block',
    'square_slab', 'rect_strip', 'l_block', 'stepped_block'
  ]);

  if (scId === 'desert') {
    const chasmTarget = compactArena ? 3 : 4;
    const scales = [1.04, 0.94, 0.86, 0.80];
    for (let idx = 0; idx < chasmTarget; idx++) {
      placeChasmBlock(scales[idx % scales.length]);
    }
  } else {
    const singleKind = scId === 'glacier' ? 'ice_sheet' : (scId === 'wasteland' ? 'swamp' : 'lava');
    let idx = 0;
    while (terrains.length < targetBlocks && idx < 9) {
      pushPool(singleKind, formsDeck[idx % formsDeck.length], idx + 1);
      idx++;
    }
  }
}

function getSceneSignatureTerrainKind() {
  const scId = (curScene && curScene.id) ? curScene.id : 'foundry';
  if (scId === 'desert') return 'chasm';
  if (scId === 'glacier') return 'ice_sheet';
  if (scId === 'wasteland') return 'swamp';
  return 'lava';
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
    const maxWaveCrates = 1 + (luck >= 72 ? 1 : 0);
    const crateChance = Math.min(0.11, 0.036 + luck * 0.0010);
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
const BOSS_CUTSCENE_SHOW_SEC = 4.0;
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

// 首领战斗中动态改造战场地形块（严格遵循当前地图单一地形主题，绝不跨生态混出杂色地形）
function spawnBossTerrain(kind, x, y, baseR = 74) {
  if (typeof terrains === 'undefined') return;
  const sceneKind = getSceneSignatureTerrainKind();
  while (terrains.length >= 10) {
    terrains.shift();
  }
  const cx = Math.max(210, Math.min(WORLD.w - 210, x));
  const cy = Math.max(210, Math.min(WORLD.h - 210, y));
  const ang = _pickObliqueAngle();
  if (sceneKind === 'chasm') {
    let tx = cx, ty = cy;
    if (player && Math.hypot(tx - player.x, ty - player.y) < 130) {
      const pushA = Math.atan2(ty - player.y, tx - player.x) || 0;
      tx = Math.max(210, Math.min(WORLD.w - 210, player.x + Math.cos(pushA) * 155));
      ty = Math.max(210, Math.min(WORLD.h - 210, player.y + Math.sin(pushA) * 155));
    }
    const halfLen = 88 + Math.random() * 34;
    terrains.push(ensureTerrainGeometry({
      kind: 'chasm', x: tx, y: ty,
      ang, rot: ang, halfLen, r: 28, chasmElbow: Math.random() < 0.35, seed: Math.random() * 100
    }));
    if (rings.length < 40) rings.push({ x: tx, y: ty, r: 95, color: '#c77dff', t: 0.35, maxT: 0.35, kind: 'hex' });
    announce('🕳️ 首领震塌石板！战场新增【石砌断层深渊】', '#c77dff', 2.6);
  } else {
    const col = sceneKind === 'lava' ? '#ff6b35' : (sceneKind === 'ice_sheet' ? '#72efdd' : '#34d399');
    const bossForms = ['rect_strip', 'l_block', 'stepped_block', 'square_slab'];
    const form = bossForms[Math.floor(Math.random() * bossForms.length)];
    const spec = form === 'rect_strip'
      ? { kind: sceneKind, form, x: cx, y: cy, rot: ang, len: 220 + Math.round(Math.random() * 75), wid: 76, r: 42, pulse: 0, seed: Math.random() * 100 }
      : (form === 'l_block'
        ? { kind: sceneKind, form, x: cx, y: cy, rot: ang, w: 196, h: 174, thick: 74, r: 46, pulse: 0, seed: Math.random() * 100 }
        : (form === 'stepped_block'
          ? { kind: sceneKind, form, x: cx, y: cy, rot: ang, w: 228, thick: 74, r: 46, pulse: 0, seed: Math.random() * 100 }
          : { kind: sceneKind, form: 'square_slab', x: cx, y: cy, rot: ang, w: 156, h: 138, r: 52, pulse: 0, seed: Math.random() * 100 }));
    terrains.push(ensureTerrainGeometry(spec));
    if (rings.length < 40) rings.push({ x: cx, y: cy, r: baseR + 24, color: col, t: 0.35, maxT: 0.35, kind: 'star' });
    const nameMap = { lava: '🌋 首领震裂石砖！新增【嵌石熔火槽】封锁走位！', swamp: '🧪 首领灌注秘毒！新增【翡翠秘毒方渠】污染地面！', ice_sheet: '🧊 首领凝结地砖！新增【寒晶方砖台】改造战场！' };
    if (nameMap[sceneKind]) announce(nameMap[sceneKind], col, 2.6);
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

function getWaveDuration(waveNum) {
  const wv = Math.max(1, Math.floor(Number(waveNum) || 1));
  return Math.min(60, 30 + (wv - 1) * 5);
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
  // 回合时长：从第 1 层 30 秒起步，每层递增 +5 秒，最高封顶 60 秒（第 7 层起恒为 60 秒；首领层提前击杀可续刷晶石，超时未杀则转入死战）
  waveTime = getWaveDuration(wave);
  waveMaxTime = waveTime;
  lastUrgentSec = -1;
  spawnAcc = 0.25;
  hudAcc = 1;
  player.x = WORLD.w / 2; player.y = WORLD.h / 2;
  player.chillSlowT = 0; player.inSpore = false;
  player.lavaExposure = 0; player.lavaTick = 0; player.terrainHintT = 0; player.terrainSpdMul = 1;
  player.frostGauge = 0; player.frostLeaveGrace = 0; player.iceFreezeT = 0; player.frostThawImmT = 0;
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
const NEEDLE_RANGED_TYPES = new Set(['frost_wisp', 'shooter', 'rad_scorpion', 'sniper_bug']);
const NEEDLE_RANGED_MUL = 0.70;
const YELLOW_ARROW_MOB_MUL = 0.80;
const ELITE_MOB_COUNT_MUL = 0.80;
const TANK_MELEE_TYPES = new Set(['shielder', 'brute', 'juggernaut', 'iron_guard', 'charger', 'splitter']);
const BASIC_FODDER_MELEE_TYPES = new Set(['chaser', 'stalker', 'swarmer', 'magma_imp']);
const EARLY_TANK_MELEE_MUL = 0.85;

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

// 生态多样化权重刷怪表（怪物总量保持 100% 不变；飞针/冰梭类远程怪刷新数量精准减少 30% 并 1:1 补充到近战怪上）
function pickWaveEnemyType(wv) {
  const rangedCountMul = typeof RANGED_ENEMY_COUNT_MUL === 'number' ? RANGED_ENEMY_COUNT_MUL : 0.80;
  const maxRanged = Math.max(2, Math.round(Math.min(12, 3 + Math.floor(wave * 0.85)) * rangedCountMul));
  const allowRanged = countActiveRangedEnemies() < maxRanged;

  const isExclRanged = !!(curScene.exclMob && RANGED_ENEMY_TYPES.has(curScene.exclMob));
  const isExclNeedle = !!(curScene.exclMob && NEEDLE_RANGED_TYPES.has(curScene.exclMob));
  const isExclWorm = curScene.exclMob === 'sand_worm';
  const exclProb = (isExclRanged ? (0.14 * rangedCountMul) : 0.20)
    * (isExclNeedle ? NEEDLE_RANGED_MUL : 1.0)
    * (isExclWorm ? YELLOW_ARROW_MOB_MUL : 1.0);
  if (sceneMobEnabled && curScene.exclMob && Math.random() < exclProb) {
    if (!isExclRanged || allowRanged) {
      return curScene.exclMob;
    }
  }

  const meleeTable = [
    ['chaser', 10.5],
    ['stalker', 8.8],
    ['swarmer', 6.5],
    ['splitter', 6.4]
  ];
  if (wv >= 2) {
    meleeTable.push(['charger', 8.8]);
    meleeTable.push(['shielder', 6.6]);
    meleeTable.push(['iron_guard', 7.4]);
  }
  if (wv >= 3) {
    meleeTable.push(['sand_worm', 7.2]);
    meleeTable.push(['bomber', 5.6]);
    meleeTable.push(['frost_knight', 6.8]);
    meleeTable.push(['blade_duelist', 6.8]);
  }
  if (wv >= 4) {
    meleeTable.push(['brute', wv === 4 ? 3.8 : 7.0]);
    meleeTable.push(['magma_imp', 4.6]);
  }
  if (wv >= 5) {
    meleeTable.push(['shadow_reaper', 6.2]);
  }
  if (wv >= 6) {
    meleeTable.push(['juggernaut', 5.2]);
    meleeTable.push(['healer', 4.0]);
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

  // 白芯针梭类远程怪数量减少 30% + 黄色小箭头怪（潜渊骨蛇 sand_worm）数量减少 20%，空出权重 1:1 等额补充至常规近战怪（怪物总量 100% 不变）
  let freedToAgileW = 0;
  for (let i = 0; i < rangedTable.length; i++) {
    if (NEEDLE_RANGED_TYPES.has(rangedTable[i][0])) {
      const cut = rangedTable[i][1] * (1 - NEEDLE_RANGED_MUL);
      rangedTable[i][1] -= cut;
      freedToAgileW += cut;
    }
  }
  for (let i = 0; i < meleeTable.length; i++) {
    if (meleeTable[i][0] === 'sand_worm') {
      const cut = meleeTable[i][1] * (1 - YELLOW_ARROW_MOB_MUL);
      meleeTable[i][1] -= cut;
      freedToAgileW += cut;
    }
  }
  if (freedToAgileW > 0) {
    let agileMeleeW = 0;
    for (let i = 0; i < meleeTable.length; i++) {
      const mType = meleeTable[i][0];
      if (!TANK_MELEE_TYPES.has(mType) && mType !== 'sand_worm' && mType !== 'healer') {
        agileMeleeW += meleeTable[i][1];
      }
    }
    if (agileMeleeW > 0) {
      for (let i = 0; i < meleeTable.length; i++) {
        const mType = meleeTable[i][0];
        if (!TANK_MELEE_TYPES.has(mType) && mType !== 'sand_worm' && mType !== 'healer') {
          meleeTable[i][1] += freedToAgileW * (meleeTable[i][1] / agileMeleeW);
        }
      }
    }
  }

  // 前 10 波肉盾怪数量精准减少 15%，减少的份额等量转化为普通近战小怪
  const curWaveNum = (typeof wave === 'number' && wave > 0) ? wave : wv;
  if (curWaveNum <= 10) {
    let freedTankW = 0;
    let fodderTotalW = 0;
    for (let i = 0; i < meleeTable.length; i++) {
      const mType = meleeTable[i][0];
      if (TANK_MELEE_TYPES.has(mType)) {
        const cut = meleeTable[i][1] * (1 - EARLY_TANK_MELEE_MUL);
        meleeTable[i][1] -= cut;
        freedTankW += cut;
      } else if (BASIC_FODDER_MELEE_TYPES.has(mType)) {
        fodderTotalW += meleeTable[i][1];
      }
    }
    if (freedTankW > 0 && fodderTotalW > 0) {
      for (let i = 0; i < meleeTable.length; i++) {
        if (BASIC_FODDER_MELEE_TYPES.has(meleeTable[i][0])) {
          meleeTable[i][1] += freedTankW * (meleeTable[i][1] / fodderTotalW);
        }
      }
    }
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
  const hpBaseMul = typeof MONSTER_HP_BASE_MUL === 'number' ? MONSTER_HP_BASE_MUL : 1.44;
  const hpLinearSlope = typeof MONSTER_HP_LINEAR_SLOPE === 'number' ? MONSTER_HP_LINEAR_SLOPE : 0.72;
  const bossHpMul = typeof BOSS_HP_MUL === 'number' ? BOSS_HP_MUL : 4.80;
  const lateBossMaxMul = typeof LATE_BOSS_HP_MUL === 'number' ? LATE_BOSS_HP_MUL : 9.60;
  // 后期首领血量阶梯：第 10 层及以后首领血量整体回调 -20%（6.72 / 8.96 / 9.60），前 8 层保持不变
  const lateBossScale = wave <= 4 ? 1.00 : (wave <= 6 ? 1.90 : (wave <= 8 ? 3.80 : (wave === 9 ? 5.60 : (wave === 10 ? 6.72 : (wave <= 12 ? 8.96 : lateBossMaxMul)))));
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
      const ox = x + (Math.random() - 0.5) * 54, oy = y + (Math.random() - 0.5) * 54;
      enemies.push({ ...base, x: ox, y: oy, r: 16, hp: 5.0 * s, maxHp: 5.0 * s, spd: (146 + wave * 2.0) * sm, dmg: Math.max(2, Math.round(2.2 * dm)), color: '#ffbe0b', type, mat: k === 0 ? 1 : (Math.random() < 0.55 ? 1 : 0) });
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
      ...base, r: 56, hp: bhp, maxHp: bhp, spd: bDef.spd * sm, dmg: Math.round(bossDmgBase * dm),
      color: bDef.color, type: 'boss', variant: bKey,
      bossTitle: `${bDef.icon} ${bDef.name}${isStoryBoss ? ' · 第一阶段' : ''}`,
      storyPhaseBoss: isStoryBoss, storyStage: isStoryBoss ? 1 : 0,
      dashT: 2.5, sumT: 5.8, meteorT: 4.1, skillT: 2.0, sigSkillT: 4.2, terrainCd: 6.2, ringCd: 4.9,
      venomCd: 4.4, p2SkillT: 2.8,
      burstLeft: 0, burstCd: 0, canPhase2: Math.random() < phase2Chance, mythicPhase2: false,
      mat: wave <= 4 ? 26 : (wave <= 8 ? 34 : (wave <= 12 ? 42 : 52))
    };
  } else if (type === 'mini_boss') {
    const mKey = (variant && miniBossDefs[variant]) ? variant : getFixedMiniBossForWave(wave, false);
    const mDef = miniBossDefs[mKey] || FALLBACK_MINI_BOSS_DEFS.vanguard;
    const twinMiniScale = (diff.dualElite && wave >= 10) ? 0.70 : 1;
    const mhp = Math.round((460 + wave * 95 + Math.pow(Math.max(0, Math.min(16, wave) - 3), 2.05) * 32) * bossHpMul * lateBossScale * midLateHpMul * endlessMul * diff.hpMul * twinMiniScale);
    ent = {
      ...base, r: 45, hp: mhp, maxHp: mhp, spd: mDef.spd * sm, dmg: Math.round(8.4 * dm),
      color: mDef.color, type: 'mini_boss', variant: mKey, bossTitle: `${mDef.icon} ${mDef.name}`,
      dashT: 2.3, meteorT: 4.4, skillT: 1.9, ringCd: 5.0, venomCd: 4.0, p2SkillT: 2.6,
      canPhase2: Math.random() < mythicRate, mythicPhase2: false, mat: 24
    };
  } else if (type === 'special_boss') {
    const relDef = specialRelics.find(r => r.bossId === variant) || specialRelics[0];
    const shp = Math.round((960 + wave * 240 + Math.pow(wave, 1.92) * 14) * bossHpMul * lateBossScale * midLateHpMul * endlessMul * diff.hpMul);
    const sSpd = relDef.bossId === 'crimson_lord' ? 98 : (relDef.bossId === 'golden_golem' ? 74 : 86);
    ent = {
      ...base, r: 52, hp: shp, maxHp: shp, spd: sSpd * sm, dmg: Math.round(9.0 * dm),
      color: relDef.bossColor, type: 'special_boss', variant: relDef.bossId, bossTitle: `${relDef.bossIcon} ${relDef.bossName}`,
      dashT: 2.1, skillT: 1.9, meteorT: 3.9, sumT: 5.8, terrainCd: 6.2, ringCd: 4.8,
      venomCd: 4.2, p2SkillT: 2.6,
      goldStage: 4, canPhase2: Math.random() < mythicRate, mythicPhase2: false,
      mat: relDef.bossId === 'golden_golem' ? 48 : (relDef.bossId === 'crimson_lord' ? 30 : 26)
    };
  } else if (type === 'stalker') {
    ent = { ...base, r: 21, hp: 20.0 * s, maxHp: 20.0 * s, spd: 138 * sm, dmg: Math.round(5.0 * dm), color: '#06d6a0', type, slashCd: 0.7, stepCd: 2.0 + Math.random(), zigT: 0.35 + Math.random() * 0.25, zigDir: Math.random() < 0.5 ? 1 : -1, mat: 2 };
  } else if (type === 'iron_guard') {
    ent = { ...base, r: 29, hp: 60 * s, maxHp: 60 * s, spd: 66 * sm, dmg: Math.round(6.6 * dm), color: '#e11d48', type, cleaveCd: 2.0 + Math.random() * 0.6, cleaveWindup: 0, mat: 3 };
  } else if (type === 'frost_knight') {
    ent = { ...base, r: 26, hp: 46 * s, maxHp: 46 * s, spd: 106 * sm, dmg: Math.round(6.2 * dm), color: '#38bdf8', type, thrustCd: 1.85 + Math.random() * 0.6, thrustWindup: 0, mat: 3 };
  } else if (type === 'blade_duelist') {
    ent = { ...base, r: 20, hp: 24 * s, maxHp: 24 * s, spd: 132 * sm, dmg: Math.round(5.4 * dm), color: '#f59e0b', type, whirlCd: 2.1 + Math.random() * 0.6, whirlT: 0, whirlSpin: 0, orbitDir: Math.random() < 0.5 ? 1 : -1, mat: 3 };
  } else if (type === 'shadow_reaper') {
    ent = { ...base, r: 25, hp: 38 * s, maxHp: 38 * s, spd: 94 * sm, dmg: Math.round(6.8 * dm), color: '#a855f7', type, blinkCd: 2.6 + Math.random() * 0.8, reapWindup: 0, mat: 4 };
  } else if (type === 'sniper_bug') {
    ent = { ...base, r: 22, hp: 13.0 * s, maxHp: 13.0 * s, spd: 54 * sm, dmg: Math.round(6.8 * dm), color: '#ef233c', type, shotT: 2.1 + Math.random() * 0.8, aimA: undefined, aimMaxT: 0.72, recoilT: 0, mat: 3 };
  } else if (type === 'spinner') {
    ent = { ...base, r: 26, hp: 28 * s, maxHp: 28 * s, spd: 74 * sm, dmg: Math.round(5.0 * dm), color: '#f59e0b', type, shotT: 2.1 + Math.random() * 0.8, orbitDir: Math.random() < 0.5 ? 1 : -1, mat: 3 };
  } else if (type === 'juggernaut') {
    // 泰坦超巨型血牛（r=54 山岳体型，极沉缓霸体推进 spd=34，十字四向地裂震波）
    ent = { ...base, r: 54, hp: 340 * s, maxHp: 340 * s, spd: 34 * sm, dmg: Math.round(11.6 * dm), color: '#475569', type, slamCd: 3.1, slamWindup: 0, mat: 7 };
  } else if (type === 'rad_scorpion') {
    ent = { ...base, r: 28, hp: 36 * s, maxHp: 36 * s, spd: 70 * sm, dmg: Math.round(5.5 * dm), color: '#a3e635', type, shotT: 2.0 + Math.random() * 0.8, mat: 3 };
  } else if (type === 'sand_worm') {
    // 潜渊遁地奇袭怪（钻入地底化作高速黑水潜影突进，破土震爆并迸射斜十字骨刺）
    ent = { ...base, r: 26, hp: 48 * s, maxHp: 48 * s, spd: 104 * sm, dmg: Math.round(6.0 * dm), color: '#f4a261', type, burrowCd: 2.0 + Math.random() * 0.7, burrowWindup: 0, burrowT: 0, mat: 3 };
  } else if (type === 'frost_wisp') {
    ent = { ...base, r: 22, hp: 17 * s, maxHp: 17 * s, spd: 82 * sm, dmg: Math.round(4.6 * dm), color: '#48cae4', type, shotT: 1.8 + Math.random() * 0.8, orbitDir: Math.random() < 0.5 ? 1 : -1, mat: 3 };
  } else if (type === 'magma_imp') {
    ent = { ...base, r: 21, hp: 20 * s, maxHp: 20 * s, spd: 118 * sm, dmg: Math.round(5.8 * dm), color: '#fb5607', type, mat: 3 };
  } else if (type === 'spore_mother') {
    ent = { ...base, r: 35, hp: 56 * s, maxHp: 56 * s, spd: 48 * sm, dmg: Math.round(5.8 * dm), color: '#c77dff', type, shotT: 2.4 + Math.random() * 0.9, mat: 4 };
  } else if (type === 'charger') {
    // 健硕重骑（r=31，快步 spd=92，尖角楔阵冲锋 + 收招前挑弧斩）
    ent = { ...base, r: 31, hp: 68 * s, maxHp: 68 * s, spd: 92 * sm, dmg: Math.round(6.8 * dm), color: '#f77f00', type, dashT: 1.85 + Math.random() * 0.75, mat: 3 };
  } else if (type === 'shooter') {
    ent = { ...base, r: 23, hp: 13.5 * s, maxHp: 13.5 * s, spd: 62 * sm, dmg: Math.round(4.2 * dm), color: '#00b4d8', type, shotT: 1.6 + Math.random() * 0.9, mat: 2 };
  } else if (type === 'mortar') {
    ent = { ...base, r: 27, hp: 24 * s, maxHp: 24 * s, spd: 52 * sm, dmg: Math.round(7.8 * dm), color: '#ff9f1c', type, shotT: 2.0 + Math.random() * 1.0, mat: 3 };
  } else if (type === 'bomber') {
    ent = { ...base, r: 22, hp: 18 * s, maxHp: 18 * s, spd: 114 * sm, dmg: Math.round(8.8 * dm), color: '#ff4d6d', type, primed: false, fuseT: 1.25, maxFuseT: 1.25, blastR: 86, mat: 2 };
  } else if (type === 'splitter') {
    // 宽大弹性软泥（r=34，蓄蹲停顿—猛然蛙跃逼近，纯近战不射子弹）
    ent = { ...base, r: 34, hp: 58 * s, maxHp: 58 * s, spd: 68 * sm, dmg: Math.round(5.0 * dm), color: '#52b788', type, hopT: 0.9 + Math.random() * 0.5, mat: 3 };
  } else if (type === 'mini_slime') {
    ent = { ...base, r: 17, hp: 9.0 * s, maxHp: 9.0 * s, spd: 140 * sm, dmg: Math.max(2, Math.round(2.6 * dm)), color: '#74c69d', type, mat: Math.random() < 0.35 ? 1 : 0 };
  } else if (type === 'shielder') {
    // 紧凑高甲塔盾卫（r=28，稳健 spd=54，近身发动重盾猛击震波）
    ent = { ...base, r: 28, hp: 94 * s, maxHp: 94 * s, spd: 54 * sm, dmg: Math.round(6.2 * dm), color: '#5c677d', type, bashCd: 2.1 + Math.random() * 0.5, bashWindup: 0, mat: 4 };
  } else if (type === 'summoner') {
    ent = { ...base, r: 25, hp: 22 * s, maxHp: 22 * s, spd: 54 * sm, dmg: Math.round(3.5 * dm), color: '#7209b7', type, sumT: 3.1 + Math.random(), boltT: 2.4, mat: 4 };
  } else if (type === 'healer') {
    ent = { ...base, r: 24, hp: 28 * s, maxHp: 28 * s, spd: 62 * sm, dmg: Math.round(3.0 * dm), color: '#2ec4b6', type, healT: 2.5, mat: 4 };
  } else if (type === 'brute') {
    // 高大狂暴重锤卫（r=39，残血 <65% 狂暴提速 + 前向 90° 扇形锥区裂地重锤）
    ent = { ...base, r: 39, hp: 190 * s, maxHp: 190 * s, spd: 64 * sm, dmg: Math.round(9.4 * dm), color: '#9d4edd', type, slamCd: 2.5, slamWindup: 0, bargeCd: 2.1 + Math.random() * 0.7, bargeT: 0, mat: 5 };
  } else {
    ent = { ...base, r: 22, hp: 25.0 * s, maxHp: 25.0 * s, spd: (88 + wave * 2.0) * sm, dmg: Math.max(2, Math.round(3.8 * dm)), color: '#d65db1', type: 'chaser', lungeCd: 1.65 + Math.random() * 0.8, lungeT: 0, mat: Math.random() < 0.65 ? 1 : 2 };
  }

  // 第 3 波起按难度刷出【狂化精英词缀怪】（前 5 层降低精英刷新率与压迫，第 10 轮及以后精英刷新率与狂化血伤倍率显著提升！）
  const isBossLike = type === 'boss' || type === 'mini_boss' || type === 'special_boss';
  const canElite = wave >= 3 && !isBossLike && type !== 'mini_slime' && type !== 'bomber' && (type !== 'juggernaut' || wave >= 8);
  const rawEChance = (diff.eliteRate || 0.05) + Math.min(0.12, (wave - 3) * 0.011);
  const lateEliteAdd = wave >= 10 ? (0.045 + Math.min(0.085, (wave - 10) * 0.013)) : 0;
  const baseEChance = wave === 3 ? rawEChance * 0.40 : (wave === 4 ? rawEChance * 0.55 : (wave === 5 ? rawEChance * 0.72 : (rawEChance + lateEliteAdd)));
  const eChance = baseEChance * ELITE_MOB_COUNT_MUL;
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
