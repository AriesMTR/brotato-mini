// 6 档轮回厄度配置（16 层四幕主线 · 第 4/8/12/16 层固定镇守四幕守誓主宰）
const MAX_WAVE = 16;
if (typeof globalThis !== 'undefined') globalThis.MAX_WAVE = MAX_WAVE;
const DIFFS = [
  { id: 0, code: 'D0', roman: 'I',   short: '寻光', tone: 'jade',    badge: 'D0 · 寻光', name: '寻光序章', hpMul: 0.88, dmgMul: 0.86, spdMul: 0.92, spawnMul: 0.90, eliteRate: 0.03, shopTax: 0.92, matBonus: 15, midElite: false, dualElite: false, doubleBoss: false, desc: '怪血量 -12%  ·  怪量 -10%  ·  行商 92 折  ·  开局赠 15 晶石，从容体验十六层四幕救赎剧情' },
  { id: 1, code: 'D1', roman: 'II',  short: '守誓', tone: 'gold',    badge: 'D1 · 守誓', name: '守誓试炼', hpMul: 1.14, dmgMul: 1.15, spdMul: 0.98, spawnMul: 1.05, eliteRate: 0.05, shopTax: 1.00, matBonus: 4,  midElite: true,  dualElite: false, doubleBoss: false, desc: '标准基准试炼：怪血量 +14%  ·  伤害 +15%  ·  第 4 / 8 / 12 / 16 层迎战四幕固定守誓主宰' },
  { id: 2, code: 'D2', roman: 'III', short: '残响', tone: 'amber',   badge: 'D2 · 残响', name: '残响危局', hpMul: 1.35, dmgMul: 1.32, spdMul: 1.01, spawnMul: 1.13, eliteRate: 0.08, shopTax: 1.04, matBonus: 0,  midElite: true,  dualElite: false, doubleBoss: false, desc: '怪血量 +35%  ·  伤害 +32%  ·  怪量 +13%  ·  第 6 / 10 / 14 层增派守誓先锋统领镇守' },
  { id: 3, code: 'D3', roman: 'IV',  short: '蚀月', tone: 'rose',    badge: 'D3 · 蚀月', name: '蚀月狂厄', hpMul: 1.56, dmgMul: 1.48, spdMul: 1.04, spawnMul: 1.20, eliteRate: 0.11, shopTax: 1.08, matBonus: 0,  midElite: true,  dualElite: true,  doubleBoss: false, desc: '怪血量 +56%  ·  伤害 +48%  ·  高阶机关苏醒，第 10 / 14 层双先锋统领同台夹击' },
  { id: 4, code: 'D4', roman: 'V',   short: '逆钟', tone: 'violet',  badge: 'D4 · 逆钟', name: '逆钟深渊', hpMul: 1.78, dmgMul: 1.63, spdMul: 1.07, spawnMul: 1.27, eliteRate: 0.14, shopTax: 1.11, matBonus: 0,  midElite: true,  dualElite: true,  doubleBoss: true,  desc: '怪血量 +78%  ·  伤害 +63%  ·  主线首领固定双阶段，无尽层域解锁双王同临' },
  { id: 5, code: 'D5', roman: 'VI',  short: '蚀日', tone: 'crimson', badge: 'D5 · 蚀日', name: '第999次神罚', hpMul: 2.04, dmgMul: 1.78, spdMul: 1.10, spawnMul: 1.34, eliteRate: 0.18, shopTax: 1.14, matBonus: 0,  midElite: true,  dualElite: true,  doubleBoss: true,  desc: '最高厄度：怪血量 +104%  ·  伤害 +78%  ·  行商物价 +14%  ·  十六层终局弑神试炼' }
];
let selectedDiff = 1;

// 6 位《烬塔残响：第999次救赎》设定集正统登塔角色（配备设定集左侧半身立绘 + Q版二头身实机精灵 + 专属【青焰瞬步】主动残响战技）
const CLASSES = [
  {
    id: 'allrounder', code: 'NO.00', shortRole: '均衡', icon: '🕯️', name: '零号白衣 · 寻光少女', enTitle: 'NO.000 · LANTERN SEEKER',
    tag: '均衡提灯', portrait: 'assets/spire/port_zero.jpg', chibi: 'assets/spire/hero_zero.png',
    loadout: '封魂短铳  ·  守誓残杖',
    weaponsList: ['封魂短铳', '守誓残杖'],
    dashName: '瞬步 · 青焰净魂', dashDesc: '起落双环青焰震退敌群，并牵引全场封魂晶石归拢',
    traits: ['生命 +6', '全伤 +8%', '移速 +4%', '收获 +4'], negTrait: '',
    bio: '提青焰魂灯于石棺苏醒的失忆白衣少女，远近兼修、稳健登塔。',
    perks: '<b>生命+6 · 全伤+8% · 移速+4% · 收获+4</b><br>提青焰魂灯于塔底苏醒的失忆白衣少女，远近均衡稳健登塔'
  },
  {
    id: 'brawler', code: 'ACT.I', shortRole: '斩弹', icon: '🦊', name: '烬羽 · 绯红断刃剑姬', enTitle: 'JINYU · CRIMSON FOX BLADE',
    tag: '近战斩弹', portrait: 'assets/spire/port_jinyu.jpg', chibi: 'assets/spire/hero_jinyu.png',
    loadout: '绯红断刃太刀  ·  守誓残杖',
    weaponsList: ['绯红断刃太刀', '守誓残杖'],
    dashName: '瞬步 · 断刃一闪', dashDesc: '拉出绯红居合十字斩暴击沿途目标并切碎敌弹，短暂提振攻速',
    traits: ['生命 +8', '护甲 +1', '再生 +1.1/s', '近战 +16%'], negTrait: '攻击范围 -10',
    bio: '守桥九百九十八世的狐面剑姬，施放断刃瞬步可正面斩碎沿途弹幕。',
    perks: '<b>生命+8 · 护甲+1 · 再生+1.1/s · 近战+16%</b><br><em>攻击范围-10</em> · 守桥九百九十八世的狐面剑姬，瞬步居合可切碎敌弹'
  },
  {
    id: 'ranger', code: 'ACT.II', shortRole: '冰星', icon: '❄️', name: '艾丝特莉亚 · 永冻星使', enTitle: 'ASTRIA · ETERNAL FROST',
    tag: '超远冰星', portrait: 'assets/spire/port_astria.jpg', chibi: 'assets/spire/hero_astria.png',
    loadout: '疾风连发铳  ·  碎冕寒冰棱',
    weaponsList: ['疾风连发铳', '碎冕寒冰棱'],
    dashName: '瞬步 · 碎冕霜步', dashDesc: '原地凝结寒霜冰封近身追兵，并向强敌齐射 5 枚穿透冰晶棱刺',
    traits: ['范围 +65', '攻速 +20%', '暴击 +12%', '移速 +8%'], negTrait: '',
    bio: '冰封旧王城的昔日星使挚友，以超远射程与极寒贯穿主宰距离。',
    perks: '<b>范围+65 · 攻速+20% · 暴击+12% · 移速+8%</b><br>冰封旧王城的昔日星使挚友，超远距暴击贯穿风筝全场'
  },
  {
    id: 'engineer', code: 'ACT.III', shortRole: '机巧', icon: '⚙️', name: '伽蓝 · 紫电弦月人偶', enTitle: 'JIALAN · CLOCKWORK PUPPETEER',
    tag: '发条机巧', portrait: 'assets/spire/port_jialan.jpg', chibi: 'assets/spire/hero_jialan.png',
    loadout: '黄金发条扳手  ·  封魂短铳',
    weaponsList: ['黄金发条扳手', '封魂短铳'],
    dashName: '瞬步 · 逆时超频', dashDesc: '布下瞬爆紫电星晷雷，并令全场炮台与浮游塔攻速超频 2.6 秒',
    traits: ['自带 2 座发条炮台', '护甲 +2', '工程 +15%', '再生 +1.8/s'], negTrait: '',
    bio: '倒悬钟楼的机关人偶少主，展开自律齿轮炮阵编织交叉火力网。',
    perks: '<b>开局自带 2 座发条炮台 · 护甲+2 · 工程+15% · 再生+1.8/s</b><br>倒悬钟楼的机关人偶少主，构筑自律齿轮火力矩阵'
  },
  {
    id: 'ghost', code: 'WITCH', shortRole: '闪避', icon: '🍃', name: '青羽 · 残羽风语魔女', enTitle: 'QINGYU · WINDWHISPER WITCH',
    tag: '风语闪避', portrait: 'assets/spire/port_qingyu.jpg', chibi: 'assets/spire/hero_qingyu.png',
    loadout: '泣血短刃  ·  苍翠旋风翎',
    weaponsList: ['泣血短刃', '苍翠旋风翎'],
    dashName: '瞬步 · 苍岚风羽', dashDesc: '极短冷却，洒出 4 枚弹射风翎并获得 2.2 秒疾风移速与攻速加成',
    traits: ['闪避 +28% (上限80%)', '幸运 +8'], negTrait: '最大生命 -6',
    bio: '守望轮回的风语行商魔女，凭轻盈残羽在高危弹雨间翩然穿行。',
    perks: '<b>闪避+28%(上限80%) · 幸运+8</b><br><em>生命-6</em> · 守望轮回的行商魔女，极高闪避游走弹雨间'
  },
  {
    id: 'multitasker', code: 'NO.999', shortRole: '神权', icon: '🌑', name: '第999号 · 日蚀圣女', enTitle: 'NO.999 · ECLIPSE SAINT',
    tag: '十二神槽', portrait: 'assets/spire/port_eclipse.jpg', chibi: 'assets/spire/hero_eclipse.png',
    loadout: '守誓残杖 ×2  ·  封魂短铳',
    weaponsList: ['守誓残杖 ×2', '封魂短铳'],
    dashName: '瞬步 · 黑日天罚', dashDesc: '在落点降下曜金贯日圣枪轰击，并撕开首领易伤破绽',
    traits: ['兵装槽上限翻倍至 12 把'], negTrait: '每持 1 把兵装全伤 -4%',
    bio: '黑水圣所镜中真我，展开日蚀金环同时驾驭十二柄守誓神兵。',
    perks: '<b>悬浮守誓兵装槽翻倍至 12 把！</b><br><em>每把兵装全伤-4%</em> · 黑水圣所镜中真我，日蚀金环万刃齐发'
  }
];

// 6 大守誓兵装羁绊定义（压降暴击羁绊独大占比，全面抬升古誓/重装/封魂铳/元素/机巧五大流派强度）
const SET_DEFS = {
  primitive: { label: '🌿古誓', steps: [2, 4, 6], desc: '2/4/6把: 最大生命 +8/+18/+30' },
  precise:   { label: '🎯星芒', steps: [2, 3, 5], desc: '2/3/5把: 暴击率 +6%/+12%/+20%' },
  gun:       { label: '🔫封魂铳', steps: [2, 4, 6], desc: '2/4/6把: 攻击范围 +45/+95/+155 · 攻速 +8%/+16%/+25%' },
  heavy:     { label: '🛡️黑曜重装', steps: [2, 3, 5], desc: '2/3/5把: 护甲 +3/+6/+10 · 爆破范围 +20%' },
  elemental: { label: '🔥四象元素', steps: [2, 3, 5], desc: '2/3/5把: 元素与反应伤害 +18%/+38%/+62%' },
  tech:      { label: '⚙️发条机巧', steps: [2, 3, 5], desc: '2/3/5把: 发条机关攻速与伤害 +25%/+52%/+85%' }
};

// 全局硬核平衡常量（无主角无敌帧；整体怪物与首领血量在此前基础上回调 -20%；前 5 层强度温和下调、第 10 轮及以后难度陡峭加压；怪物移速 -20%；远程怪数量 -20% 且怪物总量不变）
const PLAYER_RANGE_SCALE = 0.80;
const PLAYER_ASPD_SCALE = 0.70;
const MONSTER_HP_BASE_MUL = 1.80;
const MONSTER_HP_LINEAR_SLOPE = 0.72;
const MONSTER_DMG_MUL = 1.20;
const MONSTER_SPD_MUL = 0.80;
const RANGED_ENEMY_COUNT_MUL = 0.80;
const CRYSTAL_YIELD_MUL = 0.70;
const BOSS_HP_MUL = 4.80;
const LATE_BOSS_HP_MUL = 12.00;
const MID_LATE_HP_MAX_MUL = 3.00;
const MID_LATE_DMG_MAX_MUL = 2.45;

// 随波数递增的压力曲线：前 5 层进一步温和减压，第 6~9 波稳步攀升，第 10 波起大幅拉升终局高压（第 16 波达 3.00x 血量 / 2.45x 伤害，无尽继续指数突破！）
function getMidLateWaveHpMul(w) {
  const wv = Math.max(1, Number(w) || 1);
  if (wv === 1) return 0.64;
  if (wv === 2) return 0.70;
  if (wv === 3) return 0.76;
  if (wv === 4) return 0.85;
  if (wv === 5) return 0.95;
  if (wv <= 9) {
    const t = Math.max(0, (wv - 6) / 3);
    return 1.18 + (1.58 - 1.18) * t;
  }
  if (wv <= MAX_WAVE) {
    const t10 = Math.max(0, (wv - 10) / 6);
    return 1.92 + (MID_LATE_HP_MAX_MUL - 1.92) * Math.pow(t10, 0.88);
  }
  return MID_LATE_HP_MAX_MUL * Math.pow(1.13, wv - MAX_WAVE);
}

function getMidLateWaveDmgMul(w) {
  const wv = Math.max(1, Number(w) || 1);
  if (wv === 1) return 0.65;
  if (wv === 2) return 0.70;
  if (wv === 3) return 0.76;
  if (wv === 4) return 0.84;
  if (wv === 5) return 0.94;
  if (wv <= 9) {
    const t = Math.max(0, (wv - 6) / 3);
    return 1.18 + (1.48 - 1.18) * t;
  }
  if (wv <= MAX_WAVE) {
    const t10 = Math.max(0, (wv - 10) / 6);
    return 1.72 + (MID_LATE_DMG_MAX_MUL - 1.72) * Math.pow(t10, 0.90);
  }
  return MID_LATE_DMG_MAX_MUL * (1 + (wv - MAX_WAVE) * 0.095);
}

function getWeaponEvo(w) {
  if (!w || !w.evo || !WEAPONS[w.id] || !Array.isArray(WEAPONS[w.id].evos)) return null;
  const evs = WEAPONS[w.id].evos;
  for (let i = 0; i < evs.length; i++) {
    if (evs[i].id === w.evo) return evs[i];
  }
  return null;
}

// 32 把守誓兵装（全部开放 5 阶神话超限 + 64 种专属二选一进化形态；全系近战基础伤害进一步加强）
const WEAPONS = {
  // --- 🌿 古誓套装 (5 把) ---
  stick: {
    name: '守誓残杖', icon: '🪵', set: 'primitive', melee: true, dmg: 18.0, cd: 0.67, range: 132, cost: 12, mode: 'blunt', arcColor: '#72efdd',
    desc: '刻有旧王城铭文的修长古木残杖，大范围横扫，每多持一把基础伤害 +4.8（晋升 5 阶神话可觉醒 40% 概率斩弹）',
    evos: [
      { id: 'stick_worldtree', name: '世界树镇魂神木', tag: '巨木震地 · 刚猛群伤', color: '#4ade80', dmgMul: 1.42, rangeAdd: 38, slam: true, slamScale: 1.25, desc: '伤害 +42%、挥击范围 +38，每次挥杖额外引发大范围【世界树震地波】！' },
      { id: 'stick_banner',    name: '百誓共鸣灵幡',   tag: '疾速连舞 · 苍岚剑波', color: '#72efdd', dmgMul: 1.20, cdMul: 0.72, rangeAdd: 22, waveCount: 2, desc: '间隔 -28%、挥击范围 +22、伤害 +20%，每次挥击向前斩出 2 道穿透苍岚灵波！' }
    ]
  },
  rock: {
    name: '镇塔碑石', icon: '🪨', set: 'primitive', melee: true, dmg: 28.5, cd: 0.94, range: 102, cost: 14, knockMult: 2.2, armorScale: 1.8, mode: 'blunt', arcColor: '#cbd5e1',
    desc: '崩落的封印碑石重击，受护甲额外增伤，且每装备 1 块被动提供 +1护甲 与 +3生命',
    evos: [
      { id: 'rock_monolith', name: '不朽黑曜镇界碑', tag: '山崩裂地 · 护甲倍增', color: '#fbbf24', dmgMul: 1.50, rangeAdd: 24, slam: true, slamScale: 1.40, desc: '伤害 +50%、范围 +24，重砸地面引发超大范围【镇界崩岩震波】并强力击退！' },
      { id: 'rock_meteor',   name: '星陨碎空魔岩',   tag: '炽火崩裂 · 陨星飞石', color: '#fb7185', dmgMul: 1.28, cdMul: 0.76, forceBurn: true, waveCount: 3, desc: '间隔 -24%、伤害 +28%，挥砸必挂炽火并向扇形迸射 3 枚穿透星陨飞石！' }
    ]
  },
  spear: {
    name: '银月长枪', icon: '🔱', set: 'primitive', melee: true, dmg: 25.0, cd: 0.79, range: 168, cost: 16, mode: 'spear', arcColor: '#f6d379',
    desc: '王城守桥骑士长枪，超长直线突刺贯穿路径上所有目标（晋升 5 阶神话觉醒 40% 概率刺碎敌弹）',
    evos: [
      { id: 'spear_trident',  name: '沧溟破浪三叉戟', tag: '三戟齐刺 · 扇面清潮', color: '#38bdf8', dmgMul: 1.28, rangeAdd: 26, tridentThrust: true, forceFreeze: 0.35, desc: '化为寒渊三叉圣戟：每次突刺同时刺出【左中右三道超长枪芒】，35% 概率冰封目标！' },
      { id: 'spear_gungnir',  name: '贯日神枪·冈格尼尔', tag: '超距雷霆 · 必暴神罚', color: '#fde047', dmgMul: 1.52, rangeAdd: 68, critAdd: 0.20, chainOnHit: 4, desc: '突刺射程暴增 +68、伤害 +52%、暴击率 +20%，枪尖贯穿触发 4 跳黄金雷霆！' }
    ]
  },
  slingshot: {
    name: '回响灵石索', icon: '🪃', set: 'primitive', melee: false, dmg: 16.5, cd: 0.56, range: 276, spd: 660, bounce: 2, isPebble: true, cost: 15,
    desc: '发射共鸣灵石，在怪物之间清脆连续弹射 2 次（配合弹射增伤遗物威力倍增）',
    evos: [
      { id: 'sling_star',    name: '群星回响弹弓',   tag: '双发星石 · 六连弹射', color: '#67e8f9', dmgMul: 1.22, pelletsAdd: 1, bounceAdd: 3, desc: '单次齐射 2 颗星辰灵石，弹射次数额外 +3（满屏清脆连锁弹射），伤害 +22%！' },
      { id: 'sling_thunder', name: '轰雷震爆重索',   tag: '落点爆破 · 雷鸣重击', color: '#f59e0b', dmgMul: 1.45, bounceAdd: 1, blastAdd: 68, desc: '伤害 +45%、弹射 +1，灵石每次命中或耗尽时引爆【轰雷震荡波】炸伤周围敌群！' }
    ]
  },
  blowgun: {
    name: '风语毒羽筒', icon: '🎋', set: 'primitive', melee: false, dmg: 14.5, cd: 0.43, range: 280, spd: 725, pierce: 2, poisonHit: 1.0, hpScale: 0.08, isDart: true, cost: 15,
    desc: '青羽秘传风毒吹箭！自带 2 穿透且命中必叠【风蚀剧毒】，受最大生命加成伤害',
    evos: [
      { id: 'blow_hydra',   name: '万蛊千羽暴雨筒', tag: '三矢齐发 · 剧毒暴雨', color: '#84cc16', dmgMul: 1.18, cdMul: 0.82, pelletsAdd: 2, pierceAdd: 1, forcePoison: true, desc: '间隔 -18%，每次扇形齐射 3 枚穿刺毒羽（穿透+1），瞬间叠满全场风蚀剧毒！' },
      { id: 'blow_miasma',  name: '腐生瘴魂断命箫', tag: '剧毒蚀爆 · 贯穿重创', color: '#34d399', dmgMul: 1.48, rangeAdd: 50, pierceAdd: 3, blastAdd: 62, forcePoison: true, desc: '伤害 +48%、穿透 +3、射程 +50，毒箭命中引爆翠绿腐生毒雾扩散四周！' }
    ]
  },

  // --- 🎯 星芒套装 (6 把) ---
  knife: {
    name: '泣血短刃', icon: '🗡️', set: 'precise', melee: true, dmg: 14.2, cd: 0.45, range: 100, cost: 14, critBonus: 0.14, critMult: 2.20, mode: 'stab', arcColor: '#72efdd',
    desc: '极速寒芒突刺，自带 +14% 暴击率与 220% 暴击伤害',
    evos: [
      { id: 'knife_phantom', name: '千影幻杀双短刃', tag: '超速乱舞 · 残影飞刀', color: '#67e8f9', dmgMul: 1.24, cdMul: 0.64, waveCount: 2, desc: '攻击间隔锐减 -36%、伤害 +24%，每次突刺同步射出 2 枚穿透幻影飞刀！' },
      { id: 'knife_reaper',  name: '猩红断魂处决匕', tag: '致命暴伤 · 鲜血爆裂', color: '#f43f5e', dmgMul: 1.46, critAdd: 0.22, critMultAdd: 0.65, slam: true, slamScale: 0.95, desc: '伤害 +46%、暴击率 +22%、暴伤 +65%，突刺绽放猩红血莲震爆近身敌群！' }
    ]
  },
  claws: {
    name: '白狐裂影爪', icon: '🐾', set: 'precise', melee: true, dmg: 14.2, cd: 0.36, range: 104, cost: 18, critBonus: 0.14, critMult: 2.12, aspdScale: true, mode: 'claw', arcColor: '#fb7185',
    desc: '三道绯红撕裂爪痕，额外受攻击速度加成基础伤害',
    evos: [
      { id: 'claws_ninetail', name: '九尾天狐绯炎爪', tag: '三道狐火 · 炽焰撕裂', color: '#fb7185', dmgMul: 1.30, cdMul: 0.78, forceBurn: true, waveCount: 3, desc: '间隔 -22%、伤害 +30%，挥爪必燃绯红狐火并向前扇形斩出 3 道穿透爪芒！' },
      { id: 'claws_fenrir',   name: '霜狼王裂空凶爪', tag: '极寒扩域 · 碎冰暴杀', color: '#38bdf8', dmgMul: 1.48, rangeAdd: 36, critMultAdd: 0.50, forceFreeze: 0.38, desc: '撕裂范围 +36、伤害 +48%、暴伤 +50%，38% 概率直接冰封猎物触发碎冰暴杀！' }
    ]
  },
  katana: {
    name: '绯红断刃太刀', icon: '⚔️', set: 'precise', melee: true, dmg: 30.0, cd: 0.72, range: 134, cost: 20, critBonus: 0.12, critMult: 2.22, mode: 'crescent', arcColor: '#fda4af',
    desc: '烬羽同款居合残刃，暴击伤害高达 222%（晋升 5 阶神话或佩戴【断刃狐月鞘】可概率斩碎敌弹）',
    evos: [
      { id: 'katana_sakura',    name: '千本绯樱·妖刀村正', tag: '三连月轮 · 居合剑岚', color: '#ff4d6d', dmgMul: 1.28, cdMul: 0.78, waveCount: 3, desc: '间隔 -22%、伤害 +28%，每次拔刀向前扇形斩出【3 道绯樱穿透月轮剑气】！' },
      { id: 'katana_dimension', name: '断空次元·阎魔真打', tag: '次元大斩 · 紫电崩界', color: '#c084fc', dmgMul: 1.58, rangeAdd: 48, critAdd: 0.18, slam: true, chainOnHit: 4, desc: '刀域扩大 +48、伤害 +58%、暴击 +18%，挥刀引发次元震爆并迸发 4 跳紫电斩！' }
    ]
  },
  crossbow: {
    name: '观星猎魔弩', icon: '🏹', set: 'precise', melee: false, dmg: 23.0, cd: 0.72, range: 332, spd: 780, pierce: 1, rangeScale: 0.055, critBonus: 0.12, cost: 17,
    desc: '攻击范围越高伤害越高！暴击时星矢穿透次数额外 +2',
    evos: [
      { id: 'xbow_astral',  name: '万象星轨连发神弩', tag: '三星齐射 · 弹射星矢', color: '#60a5fa', dmgMul: 1.24, cdMul: 0.80, pelletsAdd: 2, bounceAdd: 1, desc: '间隔 -20%、伤害 +24%，每次齐射 3 支观星圣矢并自带 +1 次自动星轨弹射！' },
      { id: 'xbow_ballista',name: '弑龙破城巨神弩',   tag: '超距重矢 · 贯通爆破', color: '#fbbf24', dmgMul: 1.62, rangeAdd: 90, pierceAdd: 4, critMultAdd: 0.55, blastAdd: 66, desc: '射程 +90、伤害 +62%、穿透 +4、暴伤 +55%，重矢贯穿沿途引发破城爆破！' }
    ]
  },
  shuriken: {
    name: '苍翠旋风翎', icon: '💠', set: 'precise', melee: false, dmg: 15.5, cd: 0.45, range: 266, spd: 665, bounce: 2, critBonus: 0.10, isStar: true, poisonHit: 0.35, cost: 17,
    desc: '高速旋转的魔女风翎，命中自动弹射 2 次（暴击+1次）并概率叠风毒',
    evos: [
      { id: 'shuri_tempest', name: '青岚万刃风魔手里剑', tag: '三枚齐掷 · 无尽弹射', color: '#2dd4bf', dmgMul: 1.20, pelletsAdd: 2, bounceAdd: 2, desc: '每次同时掷出 3 枚巨型风魔轮，弹射次数 +2，在怪群中掀起青岚刃暴！' },
      { id: 'shuri_eclipse', name: '紫电雷影斩魄飞轮',   tag: '极速紫电 · 雷火双蚀', color: '#a855f7', dmgMul: 1.44, cdMul: 0.74, bounceAdd: 2, forcePoison: true, chainOnHit: 3, desc: '间隔 -26%、伤害 +44%、弹射 +2，必叠风毒且命中迸射 3 跳紫电弧！' }
    ]
  },
  sniper: {
    name: '贯星裁决狙', icon: '🔭', set: 'precise', melee: false, dmg: 52.0, cd: 1.28, range: 452, isSniper: true, pierce: 3, rangeScale: 0.045, critBonus: 0.16, critMult: 2.30, cost: 23,
    desc: '超远程瞬发贯星圣弹，享受攻击范围增伤并贯穿 3 名敌人',
    evos: [
      { id: 'sniper_thanatos', name: '弑神星陨反器材重狙', tag: '十敌贯通 · 星陨轰爆', color: '#ffd166', dmgMul: 1.68, rangeAdd: 110, pierceAdd: 6, critMultAdd: 0.70, blastAdd: 92, desc: '伤害 +68%、穿透 +6、暴伤 +70%，轨线终点引爆大范围【弑神星陨核爆】！' },
      { id: 'sniper_gemini',   name: '双子极光连发狙击铳', tag: '高速连狙 · 寒星双轨', color: '#38bdf8', dmgMul: 1.28, cdMul: 0.62, pierceAdd: 2, forceFreeze: 0.50, desc: '装填间隔大幅缩短 -38%、伤害 +28%、穿透 +2，命中 50% 概率直接冰封强敌！' }
    ]
  },

  // --- 🔫 封魂铳套装 (5 把) ---
  pistol: {
    name: '封魂短铳', icon: '🔫', set: 'gun', melee: false, dmg: 20.5, cd: 0.51, range: 294, spd: 725, pierce: 1, cost: 13,
    desc: '均衡青焰魂弹点射，自带 1 次穿透，受远程增伤全面强化',
    evos: [
      { id: 'pistol_twins',   name: '双生白鸦青焰双铳', tag: '双弹齐发 · 灵巧弹射', color: '#4cc9f0', dmgMul: 1.22, cdMul: 0.78, pelletsAdd: 1, bounceAdd: 1, desc: '化为黑白双生魂铳：间隔 -22%、每次齐射 2 枚青焰弹并附带 +1 弹射！' },
      { id: 'pistol_requiem', name: '葬魂大口径圣银铳', tag: '圣银重弹 · 贯通爆裂', color: '#f472b6', dmgMul: 1.54, pierceAdd: 2, blastAdd: 64, forceBurn: true, desc: '伤害 +54%、穿透 +2，发射大口径圣银爆裂弹，引燃并炸伤沿途所有魔物！' }
    ]
  },
  revolver: {
    name: '六道断罪轮', icon: '🤠', set: 'gun', melee: false, dmg: 28.5, cd: 0.65, range: 310, spd: 790, pierce: 1, critMult: 2.15, knockMult: 1.7, sixthCrit: true, cost: 17,
    desc: '暗金六连左轮！单发重创强击退，每第 6 发魂弹必定暴击且穿透额外 +2',
    evos: [
      { id: 'rev_highnoon',  name: '午时断罪·黄金双轮', tag: '扇射速射 · 高频必暴', color: '#fbbf24', dmgMul: 1.26, cdMul: 0.70, pelletsAdd: 1, pierceAdd: 1, desc: '间隔 -30%、每次连扣 2 发黄金魂弹，极速触发第六发必暴裁决！' },
      { id: 'rev_hellfire',  name: '炼狱死神·焦土左轮', tag: '炼狱炎爆 · 巨额暴伤', color: '#ef4444', dmgMul: 1.55, critMultAdd: 0.65, pierceAdd: 2, blastAdd: 74, forceBurn: true, desc: '伤害 +55%、暴伤 +65%、穿透 +2，每发魂弹命中引发炼狱红莲爆破！' }
    ]
  },
  smg: {
    name: '疾风连发铳', icon: '💨', set: 'gun', melee: false, dmg: 7.8, cd: 0.152, range: 258, spd: 755, pierce: 1, spread: 0.15, cost: 16,
    desc: '倾泻高密度青蓝魂弹雨，高频触发命中特效与元素附着',
    evos: [
      { id: 'smg_typhoon', name: '苍岚幻影风暴双冲锋', tag: '双倍弹幕 · 极速倾泻', color: '#38bdf8', dmgMul: 1.18, cdMul: 0.76, pelletsAdd: 1, pierceAdd: 1, desc: '射速再提 -24%、单发双弹头（弹幕量翻倍！）且穿透 +1，织就密不透风弹雨！' },
      { id: 'smg_voltaic', name: '紫电超导脉冲冲锋铳', tag: '弹射电弧 · 元素超载', color: '#a855f7', dmgMul: 1.38, bounceAdd: 1, chainOnHit: 2, desc: '伤害 +38%、自带 +1 弹射，密集弹雨命中概率跳跃 2 段紫电脉冲电弧！' }
    ]
  },
  shotgun: {
    name: '余烬散弹铳', icon: '💥', set: 'gun', melee: false, dmg: 12.2, cd: 0.84, range: 226, spd: 665, pellets: 5, pierce: 1, spread: 0.34, cost: 18,
    desc: '一次轰出 5 颗穿透余烬散弹，中近距粉碎成片敌群',
    evos: [
      { id: 'shot_dragon',   name: '红莲龙息十联重喷', tag: '九颗龙息 · 烈焰焚城', color: '#fb923c', dmgMul: 1.28, pelletsAdd: 4, pierceAdd: 1, forceBurn: true, desc: '单次轰出 9 颗炽热龙息铁砂（穿透+1，伤害+28%），瞬间引燃整片扇面敌潮！' },
      { id: 'shot_cerberus', name: '冥府三头犬破甲重铳', tag: '高密速射 · 跳弹粉碎', color: '#f43f5e', dmgMul: 1.42, cdMul: 0.72, pelletsAdd: 2, bounceAdd: 1, desc: '间隔 -28%、伤害 +42%、弹丸 +2 且每颗散弹获得 +1 弹射，贴脸贴墙毁天灭地！' }
    ]
  },
  shredder: {
    name: '裂魂爆破铳', icon: '🧨', set: 'gun', melee: false, dmg: 19.0, cd: 0.74, range: 302, spd: 695, pierce: 1, shredBlast: 0.65, blastR: 80, cost: 19,
    desc: '封魂铳与爆破跨界利器！贯穿弹头命中 65% 概率引爆赤金冲击波',
    evos: [
      { id: 'shred_cataclysm', name: '赤金天罚连环爆裂铳', tag: '双发必爆 · 连锁轰炸', color: '#f97316', dmgMul: 1.32, pelletsAdd: 1, pierceAdd: 1, blastAdd: 28, forceBurn: true, desc: '每次齐射 2 枚高爆裂魂弹，穿透 +1、爆炸半径扩大且引燃全场！' },
      { id: 'shred_rail',      name: '碎星穿甲电磁爆破铳', tag: '极速贯穿 · 雷火共振', color: '#38bdf8', dmgMul: 1.48, cdMul: 0.74, rangeAdd: 65, pierceAdd: 2, chainOnHit: 3, desc: '间隔 -26%、射程 +65、穿透 +2，每次爆破同步释放 3 跳碎星电弧！' }
    ]
  },

  // --- 🛡️ 黑曜重装套装 (5 把) ---
  hammer: {
    name: '碎星重锤', icon: '🔨', set: 'heavy', melee: true, dmg: 46, cd: 1.04, range: 124, cost: 19, knockMult: 2.5, hpScale: 0.08, slam: true, mode: 'blunt', arcColor: '#f6d379',
    desc: '重击震出暗金裂地冲击圈，受最大生命加成伤害并震伤成片敌人',
    evos: [
      { id: 'hammer_titan',   name: '诸神黄昏·陨星巨神锤', tag: '超大震波 · 毁天灭地', color: '#fbbf24', dmgMul: 1.56, rangeAdd: 34, slam: true, slamScale: 1.55, forceBurn: true, desc: '伤害 +56%、锤域 +34，重锤砸落掀起 155% 巨型熔金裂地波并引燃全场！' },
      { id: 'hammer_mjolnir', name: '苍雷神锤·妙尔尼尔',   tag: '雷霆风暴 · 剑波迸射', color: '#60a5fa', dmgMul: 1.32, cdMul: 0.74, chainOnHit: 5, waveCount: 3, desc: '攻速提升（间隔 -26%），重击释放 5 跳苍雷闪电并震出 3 道雷霆冲击波！' }
    ]
  },
  spiked_shield: {
    name: '黑曜棱刺盾', icon: '🛡️', set: 'heavy', melee: true, dmg: 27.5, cd: 0.80, range: 112, cost: 17, knockMult: 2.5, armorScale: 3.5, slam: true, mode: 'blunt', arcColor: '#94a3b8',
    desc: '攻防一体盾击震波！每拥有 1 点【护甲】直接额外提升 +3.5 基础伤害',
    evos: [
      { id: 'shield_bastion', name: '不动明王·黑曜神盾壁', tag: '巨型盾震 · 极寒壁垒', color: '#38bdf8', dmgMul: 1.48, rangeAdd: 30, slam: true, slamScale: 1.50, forceFreeze: 0.42, desc: '伤害 +48%、盾域 +30，盾击震波扩大 50% 且 42% 概率直接冰封周围怪物！' },
      { id: 'shield_saw',     name: '断罪齿轮·旋刃重装盾', tag: '高速盾击 · 飞刃迸射', color: '#f59e0b', dmgMul: 1.28, cdMul: 0.72, waveCount: 3, desc: '间隔 -28%、伤害 +28%，每次猛击向前方扇面飞射 3 枚穿透黑曜旋刃！' }
    ]
  },
  grenade_launcher: {
    name: '余烬榴弹炮', icon: '💣', set: 'heavy', melee: false, dmg: 30, cd: 1.05, range: 298, spd: 515, bounce: 1, isGrenade: true, blastR: 92, cost: 20,
    desc: '抛射弹跳余烬火雷，弹跳 1 次并在每次落点引发大范围轰炸！',
    evos: [
      { id: 'gren_carpet',  name: '焦土轰炸·三联集束炮', tag: '三发齐抛 · 地毯轰炸', color: '#fb923c', dmgMul: 1.24, pelletsAdd: 2, bounceAdd: 1, forceBurn: true, desc: '单次扇形抛射 3 枚集束火雷且弹跳次数 +1，每次弹跳皆引发烈焰地毯轰炸！' },
      { id: 'gren_hellorb', name: '湮灭黑日·重型臼炮',   tag: '超大核爆 · 连环弹跳', color: '#e879f9', dmgMul: 1.55, bounceAdd: 2, blastAdd: 42, desc: '伤害 +55%、弹跳次数 +2、爆炸半径巨幅扩张 +42，单发清屏毁灭重炮！' }
    ]
  },
  minigun: {
    name: '钟楼六管机炮', icon: '⚙️', set: 'heavy', melee: false, dmg: 6.4, cd: 0.106, range: 282, spd: 785, pierce: 1, spread: 0.18, minTier: 2, cost: 25,
    desc: '倒悬钟楼重装六管火神炮，狂暴倾泻穿甲魂弹幕',
    evos: [
      { id: 'mini_vulcan',  name: '炼狱火神·十二管机炮', tag: '双流金属风暴 · 炽火穿甲', color: '#f97316', dmgMul: 1.25, cdMul: 0.82, pelletsAdd: 1, pierceAdd: 1, forceBurn: true, desc: '升级双联十二管：射速再提、单次双发穿甲炎弹，化身移动金属火海！' },
      { id: 'mini_gauss',   name: '天穹高斯·超导电磁炮', tag: '跳弹磁轨 · 紫电风暴',   color: '#38bdf8', dmgMul: 1.45, rangeAdd: 65, pierceAdd: 2, bounceAdd: 1, desc: '伤害 +45%、射程 +65、穿透 +2 且每发高速机炮弹获得 +1 自动弹射！' }
    ]
  },
  rocket: {
    name: '陨星重炮', icon: '🚀', set: 'heavy', melee: false, dmg: 42, cd: 1.34, range: 352, spd: 485, isRocket: true, blastR: 106, cost: 25,
    desc: '发射拖尾陨星重弹，命中引发毁灭级范围轰炸与焦痕',
    evos: [
      { id: 'rocket_salvo', name: '苍穹蜂群·三联导弹巢', tag: '三枚齐射 · 饱和覆盖', color: '#fb7185', dmgMul: 1.22, cdMul: 0.84, pelletsAdd: 2, forceBurn: true, desc: '间隔 -16%，每次齐射 3 枚拖尾陨星飞弹，饱和火力覆盖整片战场！' },
      { id: 'rocket_nuke',  name: '破晓神罚·战略核融炮', tag: '全屏级核爆 · 毁天灭地', color: '#fde047', dmgMul: 1.72, blastAdd: 68, forceBurn: true, chainOnHit: 5, desc: '伤害暴涨 +72%、爆炸半径 +68，引爆耀金神罚核融波并劈出 5 道天雷！' }
    ]
  },

  // --- 🔥 四象元素套装 (6 把) ---
  magma_blade: {
    name: '劫火紫电刃', icon: '🌋', set: 'elemental', melee: true, dmg: 33.0, cd: 0.66, range: 130, cost: 19, burnSlash: true, slam: true, mode: 'crescent', arcColor: '#fb923c',
    desc: '火雷双象魔刃！享【近战+元素】双增伤，挥砍必挂炽火并震出熔火冲击圈',
    evos: [
      { id: 'magma_surtr',   name: '焚世炎魔剑·苏尔特尔', tag: '三道炎浪 · 熔岩崩界', color: '#ff6b35', dmgMul: 1.38, rangeAdd: 30, slam: true, slamScale: 1.35, waveCount: 3, forceBurn: true, desc: '挥砍震出超大熔火圈，并向前扇形斩出 3 道高伤穿透红莲炎浪！' },
      { id: 'magma_indra',   name: '雷火神裁·帝释天魔刃', tag: '极速雷火 · 七重紫电', color: '#c084fc', dmgMul: 1.36, cdMul: 0.72, chainOnHit: 6, forceBurn: true, desc: '间隔 -28%、伤害 +36%，每刀必迸发 6 跳超导紫电链引爆雷火融毁！' }
    ]
  },
  icicle: {
    name: '碎冕寒冰棱', icon: '🧊', set: 'elemental', melee: false, dmg: 22.0, cd: 0.66, range: 300, spd: 730, pierce: 2, isIce: true, freezeHit: 0.32, cost: 18,
    desc: '艾丝特莉亚的极寒冰棱，贯穿 2 敌必挂冰缓且 32% 概率直接冰冻定身！',
    evos: [
      { id: 'ice_blizzard', name: '永冻王冠·五联冰星刺', tag: '三棱齐发 · 弹射冰封', color: '#72efdd', dmgMul: 1.24, pelletsAdd: 2, bounceAdd: 1, forceFreeze: 0.45, desc: '每次扇形齐射 3 枚碎冕冰枪且附带 +1 弹射，45% 概率直接冻结敌群！' },
      { id: 'ice_zero',     name: '绝对零度·贯世冰晶炮', tag: '极寒霜爆 · 百发百冻', color: '#38bdf8', dmgMul: 1.54, pierceAdd: 3, blastAdd: 74, forceFreeze: 0.85, desc: '伤害 +54%、穿透 +3，高达 85% 概率冰封目标并在命中点引爆寒霜新星！' }
    ]
  },
  laser: {
    name: '魂灯贯日束', icon: '⚡', set: 'elemental', melee: false, dmg: 33, cd: 1.02, range: 368, pierce: 4, isBeam: true, cost: 22,
    desc: '提灯迸发青白贯日光束，无视正面盾牌瞬间穿透 4 名目标',
    evos: [
      { id: 'laser_prism',  name: '破晓三棱镜·极光圣束', tag: '三束齐发 · 极光扫荡', color: '#72efdd', dmgMul: 1.24, cdMul: 0.82, pelletsAdd: 2, pierceAdd: 2, desc: '折射出左中右【3 道破晓贯日光束】同时横扫战场，间隔 -18%、穿透 +2！' },
      { id: 'laser_sol',    name: '第一千道黎明·耀斑炮', tag: '超距神罚 · 耀斑核爆', color: '#fde047', dmgMul: 1.65, rangeAdd: 100, pierceAdd: 5, blastAdd: 90, forceBurn: true, desc: '伤害 +65%、射程 +100、穿透 +5，光束贯穿引爆炽热耀斑灼烧成片敌人！' }
    ]
  },
  flamer: {
    name: '红莲提灯火', icon: '🔥', set: 'elemental', melee: false, dmg: 6.2, cd: 0.142, range: 196, spd: 420, pierce: 4, spread: 0.26, isFlame: true, cost: 20,
    desc: '持续喷吐绯红魂焰火流，大范围引燃怪物触发高频灼烧与融毁反应',
    evos: [
      { id: 'flame_hell',   name: '业火红莲·双龙焚天炬', tag: '双倍火流 · 远距火海', color: '#ff6b35', dmgMul: 1.32, rangeAdd: 56, pelletsAdd: 1, pierceAdd: 2, forceBurn: true, desc: '火流射程 +56、双喷口双倍烈焰吐息、伤害 +32%，化作焚尽长夜的火海！' },
      { id: 'flame_frost',  name: '冥蓝幽焰·冰火融毁灯', tag: '冰火同源 · 自带融毁', color: '#38bdf8', dmgMul: 1.46, rangeAdd: 38, forceBurn: true, forceFreeze: 0.22, forcePoison: true, desc: '伤害 +46%，喷吐幽蓝冥火同时施加灼烧、风毒与寒霜，单武器疯狂自触发四象反应！' }
    ]
  },
  taser: {
    name: '伽蓝紫电弧', icon: '🌩️', set: 'elemental', melee: false, dmg: 21.5, cd: 0.66, range: 256, chains: 4, isChain: true, cost: 21,
    desc: '释放跳跃紫电弧连续劈向 4 名敌人，必附冰缓极易触发四象元素反应',
    evos: [
      { id: 'taser_storm',  name: '万雷天牢·紫电神罚网', tag: '十连跳跃 · 高频雷网', color: '#c77dff', dmgMul: 1.34, cdMul: 0.72, chainsAdd: 5, desc: '间隔 -28%、伤害 +34%，闪电链跳跃次数暴增 +5（高达 10 连跳全屏电疗）！' },
      { id: 'taser_overload',name: '超导崩坏·雷暴星核枢', tag: '雷火冰爆 · 巨额单跳', color: '#60a5fa', dmgMul: 1.62, rangeAdd: 60, chainsAdd: 2, blastAdd: 76, forceFreeze: 0.35, desc: '伤害 +62%、射程 +60、跳数 +2，首目标处引爆超导雷暴圈并概率冰封！' }
    ]
  },
  plasma: {
    name: '日蚀黑阳球', icon: '🔮', set: 'elemental', melee: false, dmg: 31, cd: 1.12, range: 316, spd: 390, pierce: 5, isPlasma: true, blastR: 90, minTier: 2, cost: 25,
    desc: '发射高能日蚀暗耀法球，贯穿 5 敌并在终点引爆大范围元素坍缩',
    evos: [
      { id: 'plasma_binary', name: '双生黑日·蚀月星云球', tag: '双球齐发 · 连环坍缩', color: '#c084fc', dmgMul: 1.28, cdMul: 0.84, pelletsAdd: 1, pierceAdd: 2, desc: '间隔 -16%，每次同时推出 2 颗高能日蚀黑阳球，双重元素坍缩清扫全场！' },
      { id: 'plasma_quasar', name: '创世奇点·超新星法球', tag: '奇点巨爆 · 四象雷暴', color: '#fbbf24', dmgMul: 1.68, pierceAdd: 4, blastAdd: 58, forceBurn: true, chainOnHit: 4, desc: '伤害 +68%、爆炸半径 +58，沿途劈出 4 跳紫电并在终点引爆超新星坍缩！' }
    ]
  },

  // --- ⚙️ 发条机巧套装 (5 把) ---
  wrench: {
    name: '黄金发条扳手', icon: '🔧', set: 'tech', melee: true, dmg: 24.0, cd: 0.76, range: 106, cost: 16, techScale: 0.45, mode: 'blunt', arcColor: '#f6d379',
    desc: '享受工程增伤重击，每持一把在战场上额外部署 1 座自动发条机炮塔',
    evos: [
      { id: 'wrench_fortress', name: '钟楼巨匠·双联机炮神扳', tag: '双座重炮塔 · 裂地重击', color: '#fbbf24', dmgMul: 1.40, slam: true, extraTurret: 1, desc: '重击附带齿轮震地波，且该武器部署的【自律发条机炮塔数量翻倍（+1座高阶塔）】！' },
      { id: 'wrench_tesla',    name: '逆钟超频·紫电激光神扳', tag: '增设激光塔 · 电弧重锤', color: '#38bdf8', dmgMul: 1.32, cdMul: 0.76, extraLaserTurret: 1, chainOnHit: 3, desc: '挥击迸发 3 跳电弧，且每波额外部署 1 座高阶【浮游贯日激光塔】协同作战！' }
    ]
  },
  screwdriver: {
    name: '星晷磁暴针', icon: '🪛', set: 'tech', melee: true, dmg: 22.0, cd: 0.48, range: 103, cost: 15, techScale: 0.45, spawnsMine: true, mode: 'stab', arcColor: '#56cfe1',
    desc: '极速星晷突刺（享工程增伤），每把周期在战场自动布设高爆【发条感应地雷】！',
    evos: [
      { id: 'screw_minefield', name: '万象星盘·子母星雷针', tag: '双倍布雷 · 极速磁刺', color: '#4cc9f0', dmgMul: 1.34, cdMul: 0.72, doubleMine: true, desc: '突刺间隔 -28%，且布雷时一次性投下【双生高爆星雷】迅速铺满雷区！' },
      { id: 'screw_lance',     name: '次元探针·超导雷霆刺', tag: '超距雷刺 · 剑波连射', color: '#a855f7', dmgMul: 1.45, rangeAdd: 36, chainOnHit: 4, waveCount: 2, desc: '突刺距离 +36、伤害 +45%，每次出针射出 2 道磁暴刃波并释放 4 跳闪电！' }
    ]
  },
  nailgun: {
    name: '发条连射钉铳', icon: '🔩', set: 'tech', melee: false, dmg: 10.8, cd: 0.21, range: 270, spd: 765, pierce: 1, spread: 0.10, techScale: 0.65, isNail: true, cost: 16,
    desc: '钟楼高速齿轮钉铳！自带 1 穿透，额外享受 65%【工程伤害】联动增伤',
    evos: [
      { id: 'nail_storm',   name: '暴雨梨花·双轨穿甲钉铳', tag: '双钉齐射 · 弹射钢雨', color: '#38bdf8', dmgMul: 1.22, cdMul: 0.80, pelletsAdd: 1, bounceAdd: 1, desc: '射速提升 -20%，单次齐射 2 枚高速齿轮钢钉且每枚钢钉附带 +1 弹射！' },
      { id: 'nail_rail',    name: '磁暴超导·重型爆破钉炮', tag: '高爆钢桩 · 电弧贯穿', color: '#fbbf24', dmgMul: 1.48, pierceAdd: 2, blastAdd: 56, chainOnHit: 2, desc: '伤害 +48%、穿透 +2，发射超导爆破钢桩，命中引发磁暴轰炸与跳跃电弧！' }
    ]
  },
  drone_bay: {
    name: '浮游魂灯枢', icon: '🛸', set: 'tech', melee: false, dmg: 18.0, cd: 0.66, range: 290, spd: 705, bounce: 1, techScale: 0.55, deploysLaserTurret: true, cost: 21,
    desc: '发射弹射星芒弹，且每装备 1 具额外部署 1 座【浮游贯日激光塔】！',
    evos: [
      { id: 'drone_armada', name: '天穹母舰·双生浮游灯枢', tag: '双座激光塔 · 双星弹射', color: '#c77dff', dmgMul: 1.28, pelletsAdd: 1, bounceAdd: 1, extraLaserTurret: 1, desc: '本体齐射 2 枚弹射星芒弹，且额外部署 +1 座高阶【浮游贯日激光塔】（共 2 座）！' },
      { id: 'drone_seraph', name: '炽天使之翼·棱光歼灭枢', tag: '三弹连锁 · 极寒星爆',   color: '#72efdd', dmgMul: 1.42, cdMul: 0.75, pelletsAdd: 2, bounceAdd: 2, forceFreeze: 0.30, desc: '间隔 -25%、齐射 3 枚星芒弹且弹射 +2，满屏星光折跃并 30% 概率冰封敌人！' }
    ]
  },
  emp_cannon: {
    name: '逆钟磁轨炮', icon: '📡', set: 'tech', melee: false, dmg: 38, cd: 1.12, range: 380, pierce: 4, isBeam: true, isEmpBeam: true, techScale: 0.70, minTier: 2, cost: 24,
    desc: '倒悬钟楼重型磁轨炮！瞬发贯穿光束并在首目标处引爆【时滞脉冲】',
    evos: [
      { id: 'emp_chrono',   name: '时停星晷·三轨磁暴主炮', tag: '三束磁轨 · 全场冰封', color: '#38bdf8', dmgMul: 1.30, cdMul: 0.82, pelletsAdd: 2, forceFreeze: 0.65, desc: '同时轰出 3 道磁轨贯穿光束，时滞脉冲升级为 65% 概率【绝对时停冰封】！' },
      { id: 'emp_omega',    name: '欧米茄·终焉歼星轨道炮', tag: '巨型电磁爆 · 万钧雷霆', color: '#f472b6', dmgMul: 1.70, rangeAdd: 110, pierceAdd: 5, blastAdd: 96, chainOnHit: 6, desc: '伤害 +70%、射程 +110、穿透 +5，引爆超大歼星电磁震波并劈出 6 跳紫电！' }
    ]
  }
};

// 74 件守誓圣遗物与被动装备（大幅压降暴击率词条泛滥，重做无敌帧遗物并新增远程弹射/护盾脉冲/瞬步残影/机关齐射/元素聚变/重装裂地六大流派核心遗物）
const ITEMS = [
  // --- T1 普通遗物 ---
  { id: 'worm',       name: '微光萤火蛹',   icon: '🪱', cost: 14, tier: 1, tags: ['tank'], desc: '最大生命 +6，生命再生 +1.2/秒',                  apply: p => { p.maxHp += 6; p.hp += 6; if (!p.noRegen) p.regen += 1.2; } },
  { id: 'glasses',    name: '观星单片镜',   icon: '👓', cost: 13, tier: 1, tags: ['ranged'], desc: '攻击范围 +45，远程兵装伤害 +10%',             apply: p => { p.rangeBonus += 45; p.rangedBonus = (p.rangedBonus || 0) + 0.10; } },
  { id: 'coffee',     name: '雨夜甜红茶',   icon: '☕', cost: 14, tier: 1, tags: ['general'], desc: '烬羽曾为你煮过的热茶：攻速 +11%，全伤 -2%',     apply: p => { p.atkSpd += 0.11; p.dmgMul -= 0.02; } },
  { id: 'bell',       name: '断罪镇魂铅坠', icon: '🏋️', cost: 16, tier: 1, maxCount: 5, tags: ['general'], desc: '全体伤害 +16%，移速 -2%（最多叠 5 件）', apply: p => { p.dmgMul += 0.16; p.spdMul = Math.max(0.72, p.spdMul - 0.02); } },
  { id: 'fertilizer', name: '封魂晶尘瓶',   icon: '🌱', cost: 14, tier: 1, maxCount: 5, tags: ['econ'], desc: '收获 +8（波末结算出晶且递增8%），全伤 -4%', apply: p => { p.harvestFlat += 8; p.dmgMul -= 0.04; } },
  { id: 'hedgehog',   name: '白骨棘刺护腕', icon: '🦔', cost: 15, tier: 1, tags: ['melee', 'tank'], desc: '近战加成 +15%，全体伤害 +6%，护甲 +1，闪避 -4%', apply: p => { p.meleeBonus += 0.15; p.dmgMul += 0.06; p.armor += 1; p.dodge = Math.max(0, p.dodge - 0.04); } },
  { id: 'whetstone',  name: '守桥砺剑石',   icon: '🪓', cost: 15, tier: 1, maxCount: 4, tags: ['melee'], desc: '近战伤害 +18%；近战命中撕裂护甲使目标易伤 +12%（持续3.2s）', apply: p => { p.meleeBonus += 0.18; p.meleeSunder = true; } },
  { id: 'toolbox',    name: '伽蓝发条匣',   icon: '🧰', cost: 15, tier: 1, maxCount: 4, tags: ['tech'], desc: '发条机巧（炮台与地雷）伤害 +18%，再生 +0.8/秒', apply: p => { p.techBonus = (p.techBonus || 0) + 0.18; if (!p.noRegen) p.regen += 0.8; } },
  { id: 'gunpowder',  name: '余烬火药瓮',   icon: '🛢️', cost: 15, tier: 1, maxCount: 4, tags: ['explosive', 'elemental'], desc: '爆炸范围 +16%，元素与爆炸伤害 +12%', apply: p => { p.explosionScale += 0.16; p.elemBonus += 0.12; } },
  { id: 'spiked_collar', name: '封魔黄金锁环', icon: '⛓️', cost: 15, tier: 1, maxCount: 4, tags: ['tank', 'melee'], desc: '最大生命 +8，护甲 +2，再生 +1.0/秒，移速 +4%', apply: p => { p.maxHp += 8; p.hp += 8; p.armor += 2; if (!p.noRegen) p.regen += 1.0; p.spdMul += 0.04; } },
  { id: 'leech_fang', name: '泣血红玉坠',   icon: '🩸', cost: 14, tier: 1, maxCount: 5, tags: ['vampire'], desc: '生命窃取 +5%，攻击速度 +6%，生命再生 -0.5/秒', apply: p => { p.lifesteal += 0.05; p.atkSpd += 0.06; p.regen = Math.max(0, p.regen - 0.5); } },
  { id: 'coupon',     name: '风语行商木牌', icon: '🏷️', cost: 16, tier: 1, maxCount: 4, tags: ['econ'], desc: '青羽行商价格永久 -7%（最多叠 4 枚），幸运 +3', apply: p => { p.shopDiscount = Math.min(0.28, p.shopDiscount + 0.07); p.luck += 3; } },
  { id: 'recycler',   name: '回溯沙漏坠',   icon: '♻️', cost: 15, tier: 1, maxCount: 3, tags: ['econ'], desc: '每波进入行商赠送 1 次免费刷新！收获 +3',      apply: p => { p.freeRerolls += 1; p.harvestFlat += 3; } },
  { id: 'lumber',     name: '守林人斗篷',   icon: '🪓', cost: 15, tier: 1, maxCount: 3, tags: ['econ'], desc: '每波战场额外生成 +1 座层域封魂器物，幸运 +4',  apply: p => { p.bonusTrees += 1; p.luck += 4; } },
  { id: 'magnet',     name: '引魂提灯芯',   icon: '🧲', cost: 14, tier: 1, maxCount: 4, tags: ['econ'], desc: '提灯拾取范围 +70，晶石采集效率 +10%',         apply: p => { p.magnet += 70; p.harvest += 0.10; } },
  { id: 'plate',      name: '黑曜胸甲片',   icon: '🪨', cost: 15, tier: 1, tags: ['tank'], desc: '护甲 +3（减免受击伤害），最大生命 +3',            apply: p => { p.armor += 3; p.maxHp += 3; p.hp += 3; } },
  { id: 'clover',     name: '第998号铭牌',  icon: '🍀', cost: 14, tier: 1, maxCount: 5, tags: ['econ'], desc: '前代寻光者遗留的铭牌：幸运 +7，闪避 +2%',  apply: p => { p.luck += 7; p.healDropBonus += 0.018; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.02); } },
  { id: 'boots',      name: '巡夜轻羽靴',   icon: '🥾', cost: 15, tier: 1, tags: ['dodge'], desc: '移动速度 +10%，闪避率 +4%（上限80%）',            apply: p => { p.spdMul += 0.10; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.04); } },
  { id: 'hawk_eye',   name: '星瞳棱镜片',   icon: '🦅', cost: 15, tier: 1, maxCount: 3, tags: ['crit'], desc: '暴击伤害 +26%，暴击率 +4%',               apply: p => { p.critDmg = (p.critDmg || 0) + 0.26; p.crit += 0.04; } },
  { id: 'venom_gland',name: '苍翠蚀魂露',   icon: '🧪', cost: 15, tier: 1, maxCount: 4, tags: ['elemental'], desc: '攻击 45% 概率叠【风蚀剧毒】（持续掉血且每层使怪物易伤+3%）', apply: p => { p.poisonChance = (p.poisonChance || 0) + 0.45; p.elemBonus += 0.08; } },

  // --- T2 精良遗物 ---
  { id: 'scope',      name: '星晷准星仪',   icon: '🎯', cost: 24, tier: 2, maxCount: 3, tags: ['ranged', 'crit'], desc: '攻击范围 +60，暴击率 +7%，攻速 -4%',   apply: p => { p.rangeBonus += 60; p.crit += 0.07; p.atkSpd -= 0.04; } },
  { id: 'crit_gauntlet', name: '断刃剑姬手甲', icon: '🥊', cost: 27, tier: 2, maxCount: 2, tags: ['crit', 'melee'], desc: '暴击伤害 +42%，暴击率 +5%，攻速 -3%', apply: p => { p.critDmg = (p.critDmg || 0) + 0.42; p.crit += 0.05; p.atkSpd -= 0.03; } },
  { id: 'brawler_pauldron', name: '守誓重肩铠', icon: '🛡️', cost: 26, tier: 2, maxCount: 3, tags: ['melee', 'tank'], desc: '近战伤害 +19%，护甲 +3；持近战兵装贴身抗首领伤 +12%', apply: p => { p.meleeBonus += 0.19; p.armor += 3; p.meleeBossGuard = (p.meleeBossGuard || 0) + 0.12; } },
  { id: 'landmine_pack', name: '发条星雷匣', icon: '💣', cost: 25, tier: 2, maxCount: 3, tags: ['tech', 'explosive'], desc: '每 4.0 秒自动在身旁布设 1 枚高爆【发条星雷】（享工程与爆破加成）', apply: p => { p.mineLayers = (p.mineLayers || 0) + 1; p.techBonus = (p.techBonus || 0) + 0.12; } },
  { id: 'shrapnel_vest', name: '赤金火铳带', icon: '🧨', cost: 26, tier: 2, maxCount: 3, tags: ['explosive', 'tank'], desc: '所有攻击 15% 概率触发微型爆破，爆炸范围 +16%，护甲 +2', apply: p => { p.blastChance += 0.15; p.explosionScale += 0.16; p.armor += 2; } },
  { id: 'crimson_pact',  name: '褪色的红剑穗', icon: '🥀', cost: 27, tier: 2, maxCount: 2, tags: ['vampire', 'melee'], desc: '烬羽遗物：生命窃取 +8%，全伤 +12%；汲血回生时迸发绯红剑气波！', apply: p => { p.lifesteal += 0.08; p.dmgMul += 0.12; p.bloodNova = true; } },
  { id: 'butterfly',  name: '苍翠记忆风翎', icon: '🦋', cost: 25, tier: 2, tags: ['dodge', 'elemental'], desc: '青羽帽檐风翎：闪避率 +6%，元素伤害 +18%，范围 -20', apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.06); p.elemBonus += 0.18; p.rangeBonus -= 20; } },
  { id: 'snail',      name: '凝滞钟摆锤',   icon: '🐌', cost: 25, tier: 2, maxCount: 3, tags: ['tank'], desc: '全场敌人移速永久 -6%（最多叠 3 枚），自身移速 -2%', apply: p => { p.enemySlow = Math.min(0.18, p.enemySlow + 0.06); p.spdMul = Math.max(0.72, p.spdMul - 0.02); } },
  { id: 'jetpack',    name: '青岚风语披肩', icon: '🚀', cost: 26, tier: 2, maxCount: 3, tags: ['dodge'], desc: '移动速度 +12%，闪避率 +5%（上限80%），护甲 -1', apply: p => { p.spdMul += 0.12; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.05); p.armor -= 1; } },
  { id: 'thorns',     name: '黑棘断罪铠',   icon: '🌵', cost: 26, tier: 2, maxCount: 3, tags: ['tank'], desc: '护甲 +4；受击或闪避时向四周迸射护甲加成棱刺新星', apply: p => { p.armor += 4; p.thorns += 1; } },
  { id: 'cyberball',  name: '共鸣紫电珠',   icon: '🎱', cost: 26, tier: 2, maxCount: 3, tags: ['econ', 'elemental'], desc: '幸运 +6；拾取封魂晶石有概率降下紫电轰击随机敌人', apply: p => { p.luck += 6; p.cyberball += 1; } },
  { id: 'bat',        name: '夜鸦暗羽披风', icon: '🦇', cost: 26, tier: 2, tags: ['vampire'], desc: '生命窃取 +7%，最大生命 +4，收获 -3',             apply: p => { p.lifesteal += 0.07; p.maxHp += 4; p.hp += 4; p.harvestFlat = Math.max(0, p.harvestFlat - 3); } },
  { id: 'medkit',     name: '魂灯温养瓶',   icon: '❤️‍🩹', cost: 26, tier: 2, tags: ['tank'], desc: '生命再生 +2.6/秒，最大生命 +5',                  apply: p => { if (!p.noRegen) p.regen += 2.6; p.maxHp += 5; p.hp += 5; } },
  { id: 'turret',     name: '自律发条塔枢', icon: '🛰️', cost: 29, tier: 2, maxCount: 4, tags: ['tech'], desc: '每波在战场上额外部署 1 座自律发条机炮塔',        apply: p => { p.bonusTurrets += 1; } },
  { id: 'adren',      name: '狂厄心音弦',   icon: '💉', cost: 28, tier: 2, tags: ['dodge', 'general'], desc: '闪避率 +6%（上限80%），攻击速度 +12%',   apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.06); p.atkSpd += 0.12; } },
  { id: 'napalm',     name: '不灭余烬灯油', icon: '🔥', cost: 27, tier: 2, maxCount: 3, tags: ['elemental', 'explosive'], desc: '所有攻击 38% 概率引燃敌人，元素伤害 +18%', apply: p => { p.burnChance += 0.38; p.elemBonus += 0.18; } },
  { id: 'cryo',       name: '眠冬霜泪瓶',   icon: '❄️', cost: 25, tier: 2, maxCount: 3, tags: ['elemental'], desc: '艾丝特莉亚的冰泪：攻击 42% 概率冰缓减速，且对冰缓/冰冻目标增伤 +16%！', apply: p => { p.chillChance += 0.42; p.chillDmgBonus = (p.chillDmgBonus || 0) + 0.16; } },
  { id: 'barrier',    name: '青焰结界仪',   icon: '🛡️', cost: 28, tier: 2, tags: ['tank'], desc: '魂灯护盾上限 +10（自动回充），护甲 +2',          apply: p => { p.maxShield += 10; p.shield += 10; p.armor += 2; } },
  { id: 'crown',      name: '旧王城金冕残片',icon: '👑', cost: 28, tier: 2, maxCount: 2, tags: ['econ'], desc: '每波结算额外获得存留晶石 +12% 利息，收获 +5', apply: p => { p.interest += 0.12; p.harvestFlat += 5; } },
  { id: 'kinetic_ricochet', name: '回响弹射棱核', icon: '🪃', cost: 28, tier: 2, maxCount: 3, weaponOnly: true, tags: ['ranged'], desc: '远程魂弹弹射 +1；投射物每次穿透或弹射后伤害递增 +18%！', apply: p => { p.bounceBonus += 1; p.bounceAmpDmg = (p.bounceAmpDmg || 0) + 0.18; } },
  { id: 'aegis_capacitor',  name: '青焰震波电容', icon: '⚡', cost: 27, tier: 2, maxCount: 2, tags: ['tank', 'elemental'], desc: '魂灯护盾上限 +12；护盾受击或回充时释放雷磁脉冲震退并冰缓周围敌群！', apply: p => { p.maxShield += 12; p.shield += 12; p.shieldPulseNova = true; } },
  { id: 'afterimage_boots', name: '瞬步残影战靴', icon: '👟', cost: 27, tier: 2, maxCount: 2, tags: ['dodge', 'general'], desc: '移速 +9%，闪避 +5%；每次施放【青焰瞬步】后 2.6 秒内全伤 +22%、攻速 +18%！', apply: p => { p.spdMul += 0.09; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.05); p.dashSurge = true; } },

  // --- T3 史诗圣遗物 ---
  { id: 'bandana',       name: '绯红守桥额带',   icon: '🧣', cost: 40, tier: 3, maxCount: 2, weaponOnly: true, tags: ['ranged'], desc: '所有远程魂弹穿透 +1，远程兵装伤害 +16%', apply: p => { p.pierceBonus += 1; p.rangedBonus = (p.rangedBonus || 0) + 0.16; } },
  { id: 'prism',         name: '折光星冰棱镜',   icon: '🔷', cost: 41, tier: 3, maxCount: 2, weaponOnly: true, tags: ['ranged'], desc: '所有远程魂弹弹射次数 +1，攻击范围 +45，远程伤害 +10%', apply: p => { p.bounceBonus += 1; p.rangeBonus += 45; p.rangedBonus = (p.rangedBonus || 0) + 0.10; } },
  { id: 'tentacle',      name: '噬影汲魂触须',   icon: '🦑', cost: 41, tier: 3, maxCount: 2, tags: ['vampire', 'elemental'], desc: '生命窃取 +9%；攻击命中灼烧/冰缓/剧毒状态的敌人时额外 +14% 概率回 1 生命！', apply: p => { p.lifesteal += 0.09; p.ailmentLeech = (p.ailmentLeech || 0) + 0.14; } },
  { id: 'sniper_cloak',  name: '永冻观星披风',   icon: '🦅', cost: 42, tier: 3, maxCount: 1, tags: ['ranged'], desc: '【唯一】攻击范围 +95，远程伤害 +15%；每 12 范围转化 +1% 全体伤害！', apply: p => { p.rangeBonus += 95; p.rangedBonus = (p.rangedBonus || 0) + 0.15; p.rangeToDmg = true; } },
  { id: 'overseer_chip', name: '逆转黄金发条',   icon: '📡', cost: 42, tier: 3, maxCount: 2, tags: ['tech'], desc: '伽蓝核心遗物：部署 1 座【贯日激光塔】，所有炮台穿透+1且可暴击，工程+24%', apply: p => { p.laserTurrets = (p.laserTurrets || 0) + 1; p.turretCrit = true; p.techBonus = (p.techBonus || 0) + 0.24; } },
  { id: 'whirlwind_belt',name: '剑姬绯夜腰封',   icon: '🌪️', cost: 41, tier: 3, maxCount: 2, weaponOnly: true, tags: ['melee'], desc: '近战伤害 +24%，攻速 +10%；近战挥砍弧度与突刺范围扩大 +22%！', apply: p => { p.meleeBonus += 0.24; p.atkSpd += 0.10; p.meleeSweepBonus = (p.meleeSweepBonus || 0) + 0.22; } },
  { id: 'titan_heart',   name: '不灭熔炉魔心',   icon: '🫀', cost: 42, tier: 3, maxCount: 2, tags: ['tank', 'melee'], desc: '最大生命 +16，再生 +2.5/秒；每 5 点最大生命额外转化 +2% 全体伤害！', apply: p => { p.maxHp += 16; p.hp += 16; if (!p.noRegen) p.regen += 2.5; p.hpToDmg = (p.hpToDmg || 0) + 1; } },
  { id: 'fortress_plate',name: '断罪黑曜重铠',   icon: '🏰', cost: 41, tier: 3, maxCount: 2, tags: ['tank'], desc: '护甲 +6，棱刺反伤等级 +2；每拥有 1 点护甲额外转化 +1.5% 全体伤害！', apply: p => { p.armor += 6; p.thorns += 2; p.armorToDmg = (p.armorToDmg || 0) + 1; } },
  { id: 'tesla',         name: '弦月紫电音叉',   icon: '⚡', cost: 44, tier: 3, maxCount: 3, tags: ['elemental', 'tech'], desc: '每 1.6 秒自动释放紫电连锁电弧劈向周围怪物',         apply: p => { p.teslaCount += 1; } },
  { id: 'warhead',       name: '赤金裂塔火核',   icon: '🧨', cost: 43, tier: 3, maxCount: 2, tags: ['explosive'], desc: '攻击 22% 概率引发爆破，爆炸范围与伤害 +20%',      apply: p => { p.blastChance += 0.22; p.explosionScale += 0.20; } },
  { id: 'berserk',       name: '狂厄断刃契约',   icon: '🩸', cost: 39, tier: 3, maxCount: 2, tags: ['general', 'melee'], desc: '全体伤害 +26%，攻速 +11%，但护甲 -3',  apply: p => { p.dmgMul += 0.26; p.atkSpd += 0.11; p.armor -= 3; } },
  { id: 'blood_chalice', name: '灰烬圣餐杯',     icon: '🍷', cost: 42, tier: 3, maxCount: 2, tags: ['vampire'], desc: '生命窃取 +9%，最大生命 +8，魂血瓶治疗量 +2',       apply: p => { p.lifesteal += 0.09; p.maxHp += 8; p.hp += 8; p.healBonus += 2; } },
  { id: 'chrono_watch',  name: '冻停的银怀表',   icon: '⏱️', cost: 43, tier: 3, maxCount: 2, tags: ['dodge', 'elemental'], desc: '停在灾难夜的怀表：【青焰瞬步】冷却缩短 22%，移速 +10%，瞬步起跳瞬间冰封近身追兵！', apply: p => { p.dashCdMul = (p.dashCdMul || 1) * 0.78; p.spdMul += 0.10; p.dashFreezeNova = true; } },
  { id: 'overclock_core',name: '超频发条心核',   icon: '🔋', cost: 43, tier: 3, maxCount: 2, tags: ['elemental', 'tech'], desc: '元素与工程伤害各 +24%，攻击范围 +45，护甲 -2', apply: p => { p.elemBonus += 0.24; p.techBonus = (p.techBonus || 0) + 0.24; p.rangeBonus += 45; p.armor -= 2; } },
  { id: 'frost_prism',   name: '碎冕冰封星核',   icon: '💎', cost: 42, tier: 3, maxCount: 2, tags: ['elemental'], desc: '攻击 25% 概率【冰冻】定身怪物 1.2s，元素伤害 +22%；冰冻/冰缓怪阵亡时炸裂 6 枚寒霜冰刺！', apply: p => { p.freezeChance = (p.freezeChance || 0) + 0.25; p.chillChance += 0.25; p.elemBonus += 0.22; p.freezeDeathNova = true; } },
  { id: 'plague_flask',  name: '风蚀扩散圣瓶',   icon: '⚗️', cost: 43, tier: 3, maxCount: 2, tags: ['elemental'], desc: '攻击必叠【风蚀剧毒】（上限12层），击杀时向四周扩散毒火风暴！', apply: p => { p.poisonChance = (p.poisonChance || 0) + 1.0; p.maxPoisonStacks = Math.max(p.maxPoisonStacks || 8, 12); p.plagueSpread = true; p.elemBonus += 0.20; } },
  { id: 'assassin_crest',name: '白狐守誓面具',   icon: '🗡️', cost: 42, tier: 3, maxCount: 2, tags: ['crit', 'melee'], desc: '暴击伤害 +55%，暴击率 +7%；近战暴击时 35% 概率回 1 生命', apply: p => { p.critDmg = (p.critDmg || 0) + 0.55; p.crit += 0.07; p.critMeleeHeal = true; } },
  { id: 'turret_link_core', name: '钟楼蜂群矩阵', icon: '🛸', cost: 43, tier: 3, maxCount: 2, tags: ['tech'], desc: '部署 1 座发条机炮塔，工程伤害 +24%；每次施放瞬步或触发元素反应时全场机关齐射超载飞弹！', apply: p => { p.bonusTurrets += 1; p.techBonus = (p.techBonus || 0) + 0.24; p.turretSalvo = true; } },
  { id: 'alchemist_reactor',name: '四象聚变炉心', icon: '⚛️', cost: 43, tier: 3, maxCount: 2, tags: ['elemental', 'explosive'], desc: '元素伤害 +24%；触发【融毁/超导/扩散】元素反应时在目标处引爆高伤四象聚变新星！', apply: p => { p.elemBonus += 0.24; p.reactionBlast = true; } },
  { id: 'juggernaut_pauldron', name: '黑曜裂地重铠', icon: '🪨', cost: 42, tier: 3, maxCount: 2, tags: ['tank', 'melee'], desc: '护甲 +5，最大生命 +12；每累计移动 175 距离自动踏出【黑曜裂地波】（受护甲与最大生命加成）！', apply: p => { p.armor += 5; p.maxHp += 12; p.hp += 12; p.strideQuake = true; } },

  // --- T4 传说终极圣遗物 ---
  { id: 'reactor',          name: '第一千道破晓核', icon: '☀️', cost: 68, tier: 4, maxCount: 2, tags: ['general', 'tank'], desc: '【传说】全伤 +24%，攻速 +16%，护盾 +14，再生 +2/s', apply: p => { p.dmgMul += 0.24; p.atkSpd += 0.16; p.maxShield += 14; p.shield += 14; if (!p.noRegen) p.regen += 2; } },
  { id: 'anvil',            name: '锻魂神砧',       icon: '⚒️', cost: 70, tier: 4, maxCount: 1, weaponOnly: true, tags: ['general'], desc: '【传说·唯一】每波进店免费升阶 1 把随机兵装！护甲 +4，移速 -3%', apply: p => { p.hasAnvil = true; p.armor += 4; p.spdMul = Math.max(0.72, p.spdMul - 0.03); } },
  { id: 'cornucopia',       name: '记忆丰饶圣爵',   icon: '🏺', cost: 66, tier: 4, maxCount: 1, tags: ['econ'], desc: '【传说·唯一】收获 +20，幸运 +12，治疗 +3，拾取范围 +60', apply: p => { p.harvestFlat += 20; p.luck += 12; p.healBonus += 3; p.magnet += 60; } },
  { id: 'soul_harvester',   name: '断罪冥魂镰',     icon: '💀', cost: 72, tier: 4, maxCount: 1, tags: ['general'], desc: '【传说·唯一】全伤 +26%；直接斩杀生命低于 12% 的非首领魔物，且击杀 28% 概率迸射连锁冥魂雷！', apply: p => { p.dmgMul += 0.26; p.executeLowHp = 0.12; p.soulBolt = true; } },
  { id: 'aegis_core',       name: '不灭魂灯圣匣',   icon: '💠', cost: 68, tier: 4, maxCount: 1, tags: ['tank'], desc: '【传说·唯一】魂灯护盾 +22，护甲 +5，护盾回充速度加快 35%', apply: p => { p.maxShield += 22; p.shield += 22; p.armor += 5; p.fastShield = true; } },
  { id: 'hermes_wings',     name: '青羽的苍翠风翼', icon: '🪽', cost: 68, tier: 4, maxCount: 1, tags: ['dodge'], desc: '【传说·唯一】移速 +22%，闪避上限升至 85%（闪避+8%），免疫移速惩罚与冰缓', apply: p => { p.noSlow = true; p.dodgeCap = Math.max(p.dodgeCap, 0.85); p.dodge = Math.min(p.dodgeCap, p.dodge + 0.08); p.spdMul = Math.max(1.0, p.spdMul) + 0.22; } },
  { id: 'star_crown',       name: '永冻星使王冠',   icon: '🌟', cost: 70, tier: 4, maxCount: 1, tags: ['general', 'econ'], desc: '【传说·唯一】全伤 +18%，攻击速度 +12%，拾取范围 +100，幸运 +10', apply: p => { p.dmgMul += 0.18; p.atkSpd += 0.12; p.magnet += 100; p.luck += 10; } },
  { id: 'doom_edge',        name: '弑神镜片·真我', icon: '☄️', cost: 72, tier: 4, maxCount: 1, tags: ['crit'], desc: '【传说·唯一】斩碎黑曜镜的残片：暴击伤害 +85%，暴击率 +10%，全伤 +18%', apply: p => { p.critDmg = (p.critDmg || 0) + 0.85; p.crit += 0.10; p.dmgMul += 0.18; } },
  { id: 'omega_factory',    name: '倒悬钟楼母枢',   icon: '🏭', cost: 70, tier: 4, maxCount: 1, tags: ['tech'], desc: '【传说·唯一】每波额外部署 2 座发条炮台，工程伤害 +45%，炮台附带灼烧与冰缓！', apply: p => { p.bonusTurrets += 2; p.techBonus = (p.techBonus || 0) + 0.45; p.turretElem = true; } },
  { id: 'doomsday_warhead', name: '日蚀黑炎核',     icon: '☢️', cost: 70, tier: 4, maxCount: 1, tags: ['explosive', 'elemental'], desc: '【传说·唯一】爆炸范围 +35%，攻击爆破率 +25%，所有爆炸引燃敌人造成高额灼烧！', apply: p => { p.explosionScale += 0.35; p.blastChance += 0.25; p.elemBonus += 0.22; p.napalmBlast = true; } },
  { id: 'titan_breaker',    name: '绯红九百九十九斩',icon: '⚔️', cost: 70, tier: 4, maxCount: 1, weaponOnly: true, tags: ['melee', 'tank'], desc: '【传说·唯一】近战伤害 +42%，生命 +14，护甲 +4；近战挥砍额外震出破军剑气波！', apply: p => { p.meleeBonus += 0.42; p.maxHp += 14; p.hp += 14; p.armor += 4; p.meleeShockwave = true; } },
  { id: 'fox_parry_sheath', name: '断刃狐月鞘',     icon: '🦊', cost: 70, tier: 4, maxCount: 1, weaponOnly: true, tags: ['melee', 'dodge'], desc: '【传说·唯一】近战伤害 +28%，攻速 +12%，闪避 +6%；近战挥击获得 35% 概率斩碎触及的敌方弹道！', apply: p => { p.meleeBonus += 0.28; p.atkSpd += 0.12; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.06); p.meleeBulletCutChance = Math.max(p.meleeBulletCutChance || 0, 0.35); } },
  { id: 'trinity_orb',      name: '四象共鸣魂枢',   icon: '🔮', cost: 72, tier: 4, maxCount: 1, tags: ['elemental'], desc: '【传说·唯一】元素伤害 +40%，火/冰/风毒触发率全面提升；目标每带1种异常易伤+12%！', apply: p => { p.elemBonus += 0.40; p.burnChance += 0.22; p.freezeChance = (p.freezeChance || 0) + 0.18; p.poisonChance = (p.poisonChance || 0) + 0.25; p.elemSynergy = true; } }
];

const CRATE_SUPPLIES = [
  { id: 'sup_titan', name: '守誓圣泉原液', icon: '🧬', tier: 2, cost: 28, desc: '最大生命永久 +9，并立即恢复全部损失生命值！', apply: p => { p.maxHp += 9; p.hp = p.maxHp; } },
  { id: 'sup_hyper', name: '疾风发条心弦', icon: '⚡', tier: 2, cost: 28, desc: '攻击速度永久 +10%，移动速度永久 +9%', apply: p => { p.atkSpd += 0.10; p.spdMul += 0.09; } },
  { id: 'sup_aegis', name: '黑曜结界镀层', icon: '🛡️', tier: 2, cost: 28, desc: '护甲永久 +3，魂灯护盾上限 +8', apply: p => { p.armor += 3; p.maxShield += 8; p.shield += 8; } },
  { id: 'sup_gems',  name: '高纯封魂母晶', icon: '💎', tier: 3, cost: 40, desc: '立即提炼一笔封魂晶石，且幸运永久 +6', apply: (p, w) => { const gain = Math.max(12, Math.round((28 + w * 7) * CRYSTAL_YIELD_MUL)); p.mats += gain; p.luck += 6; } }
];

const UPGRADES = [
  { name: '不灭体魄', icon: '❤️', desc: '最大生命 +8',                       apply: p => { p.maxHp += 8; p.hp += 8; } },
  { name: '提灯温养', icon: '🌿', desc: '每秒生命再生 +1.6',                 apply: p => { if (!p.noRegen) p.regen += 1.6; else p.lifesteal += 0.04; } },
  { name: '魂焰增幅', icon: '💪', desc: '全体伤害 +14%',                     apply: p => { p.dmgMul += 0.14; } },
  { name: '断刃剑意', icon: '⚔️', desc: '近战伤害 +21%，最大生命 +5',         apply: p => { p.meleeBonus += 0.21; p.maxHp += 5; p.hp += 5; } },
  { name: '鹰眼强铳', icon: '🔫', desc: '远程兵装伤害 +18%，攻击范围 +32',   apply: p => { p.rangedBonus = (p.rangedBonus || 0) + 0.18; p.rangeBonus += 32; } },
  { name: '发条专精', icon: '🔧', desc: '发条机巧（炮台/星雷）伤害 +24%，护甲 +2', apply: p => { p.techBonus = (p.techBonus || 0) + 0.24; p.armor += 2; } },
  { name: '疾速扣击', icon: '⚡', desc: '攻击速度 +12%',                     apply: p => { p.atkSpd += 0.12; } },
  { name: '星瞳扩距', icon: '📏', desc: '攻击范围 +55，全体伤害 +6%',         apply: p => { p.rangeBonus += 55; p.dmgMul += 0.06; } },
  { name: '黑曜铭甲', icon: '🪨', desc: '护甲 +3，最大生命 +4',               apply: p => { p.armor += 3; p.maxHp += 4; p.hp += 4; } },
  { name: '铁壁反震', icon: '🌵', desc: '护甲 +2，棱刺反伤等级 +1',           apply: p => { p.armor += 2; p.thorns += 1; } },
  { name: '风翎轻步', icon: '👟', desc: '移动速度 +9%，瞬步冷却缩短 10%',     apply: p => { p.spdMul += 0.09; p.dashCdMul = (p.dashCdMul || 1) * 0.90; } },
  { name: '破绽洞悉', icon: '🎯', desc: '暴击率 +6%',                        apply: p => { p.crit += 0.06; } },
  { name: '暗影闪避', icon: '💨', desc: '闪避率 +5%（上限80%）',             apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.05); } },
  { name: '四象过载', icon: '🔥', desc: '元素与反应伤害 +22%',               apply: p => { p.elemBonus += 0.22; } },
  { name: '裁决暴伤', icon: '💥', desc: '暴击伤害 +32%（需配合星芒暴击触发）', apply: p => { p.critDmg = (p.critDmg || 0) + 0.32; } },
  { name: '火冰风淬', icon: '🧪', desc: '攻击附带灼烧/冰冻/风毒率各 +16%',   apply: p => { p.burnChance += 0.16; p.freezeChance = (p.freezeChance || 0) + 0.10; p.poisonChance = (p.poisonChance || 0) + 0.20; } },
  { name: '回响垂青', icon: '🍀', desc: '收获 +6（波末结晶且成长），幸运 +6', apply: p => { p.harvestFlat += 6; p.luck += 6; } },
  { id_alias: 'magnet', name: '引魂灯芯', icon: '🧲', desc: '拾取范围 +65，经验与采集效率 +10%', apply: p => { p.magnet += 65; p.harvest += 0.10; } }
];
