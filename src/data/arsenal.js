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
    traits: ['生命 +8', '护甲 +1', '再生 +1.1/s', '近战 +12%'], negTrait: '攻击范围 -10',
    bio: '守桥九百九十八世的狐面剑姬，挥刀之瞬可正面斩碎漫天弹幕。',
    perks: '<b>生命+8 · 护甲+1 · 再生+1.1/s · 近战+12%</b><br><em>攻击范围-10</em> · 守桥九百九十八世的狐面剑姬，刀光可斩碎弹幕'
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

// 6 大守誓兵装羁绊定义
const SET_DEFS = {
  primitive: { label: '🌿古誓', steps: [2, 4, 6], desc: '2/4/6把: 最大生命 +6/+14/+24' },
  precise:   { label: '🎯星芒', steps: [2, 3, 5], desc: '2/3/5把: 暴击率 +8%/+16%/+26%' },
  gun:       { label: '🔫封魂铳', steps: [2, 4, 6], desc: '2/4/6把: 攻击范围 +40/+85/+140 · 攻速 +6%/+14%/+22%' },
  heavy:     { label: '🛡️黑曜重装', steps: [2, 3, 5], desc: '2/3/5把: 护甲 +2/+5/+9 · 爆破范围 +15%' },
  elemental: { label: '🔥四象元素', steps: [2, 3, 5], desc: '2/3/5把: 元素与反应伤害 +15%/+32%/+55%' },
  tech:      { label: '⚙️发条机巧', steps: [2, 3, 5], desc: '2/3/5把: 发条机关攻速与伤害 +22%/+48%/+80%' }
};

// 32 把守誓兵装（严格保留全部内部 key 与平衡数值）
const WEAPONS = {
  // --- 🌿 古誓套装 (5 把) ---
  stick:     { name: '守誓残杖',   icon: '🪵', set: 'primitive', melee: true,  dmg: 12.0, cd: 0.69, range: 118, cost: 12, mode: 'blunt', arcColor: '#72efdd', desc: '刻有旧王城铭文的古木残杖，每多持一把基础伤害 +3（近战自带招架减伤与近身斩弹）' },
  rock:      { name: '镇塔碑石',   icon: '🪨', set: 'primitive', melee: true,  dmg: 20,   cd: 0.96, range: 114, cost: 14, knockMult: 2.0, mode: 'blunt', arcColor: '#cbd5e1', desc: '崩落的封印碑石重击，每装备 1 块被动提供 +1护甲 与 +3生命' },
  spear:     { name: '银月长枪',   icon: '🔱', set: 'primitive', melee: true,  dmg: 17.8, cd: 0.81, range: 192, cost: 16, mode: 'spear', arcColor: '#f6d379', desc: '王城守桥骑士长枪，超长直线突刺贯穿路径上所有目标' },
  slingshot: { name: '回响灵石索', icon: '🪃', set: 'primitive', melee: false, dmg: 15.0, cd: 0.58, range: 340, spd: 650, bounce: 2, isPebble: true, cost: 15, desc: '发射共鸣灵石，在怪物之间清脆连续弹射 2 次' },
  blowgun:   { name: '风语毒羽筒', icon: '🎋', set: 'primitive', melee: false, dmg: 13.2, cd: 0.44, range: 345, spd: 715, pierce: 1, poisonHit: 1.0, hpScale: 0.06, isDart: true, cost: 15, desc: '青羽秘传风毒吹箭！自带 1 穿透且命中必叠【风蚀剧毒】，受最大生命加成伤害' },

  // --- 🎯 星芒套装 (6 把) ---
  knife:     { name: '泣血短刃',   icon: '🗡️', set: 'precise',   melee: true,  dmg: 10.2, cd: 0.45, range: 112, cost: 14, critBonus: 0.18, critMult: 2.22, mode: 'stab', arcColor: '#72efdd', desc: '极速寒芒突刺，自带 +18% 暴击率与 222% 暴击伤害' },
  claws:     { name: '白狐裂影爪', icon: '🐾', set: 'precise',   melee: true,  dmg: 10.2, cd: 0.36, range: 118, cost: 18, critBonus: 0.18, critMult: 2.15, aspdScale: true, mode: 'claw', arcColor: '#fb7185', desc: '三道绯红撕裂爪痕，额外受攻击速度加成基础伤害' },
  katana:    { name: '绯红断刃太刀',icon: '⚔️', set: 'precise',   melee: true,  dmg: 22.0, cd: 0.72, range: 156, cost: 20, critBonus: 0.16, critMult: 2.25, mode: 'crescent', arcColor: '#fda4af', desc: '烬羽同款居合残刃，暴击伤害高达 225% 且挥砍月牙可斩碎近身弹幕' },
  crossbow:  { name: '观星猎魔弩', icon: '🏹', set: 'precise',   melee: false, dmg: 22.0, cd: 0.72, range: 415, spd: 780, pierce: 1, rangeScale: 0.05, critBonus: 0.15, cost: 17, desc: '攻击范围越高伤害越高！暴击时星矢穿透次数额外 +2' },
  shuriken:  { name: '苍翠旋风翎', icon: '💠', set: 'precise',   melee: false, dmg: 14.5, cd: 0.45, range: 330, spd: 660, bounce: 2, critBonus: 0.12, isStar: true, poisonHit: 0.30, cost: 17, desc: '高速旋转的魔女风翎，命中自动弹射 2 次（暴击+1次）并概率叠风毒' },
  sniper:    { name: '贯星裁决狙', icon: '🔭', set: 'precise',   melee: false, dmg: 50,   cd: 1.30, range: 560, isSniper: true, pierce: 3, rangeScale: 0.04, critBonus: 0.22, critMult: 2.35, cost: 23, desc: '超远程瞬发贯星圣弹，享受攻击范围增伤并贯穿 3 名敌人' },

  // --- 🔫 封魂铳套装 (5 把) ---
  pistol:    { name: '封魂短铳',   icon: '🔫', set: 'gun',     melee: false, dmg: 19.2, cd: 0.52, range: 365, spd: 720, pierce: 1, cost: 13, desc: '均衡青焰魂弹点射，自带 1 次穿透' },
  revolver:  { name: '六道断罪轮', icon: '🤠', set: 'gun',     melee: false, dmg: 26.0, cd: 0.67, range: 385, spd: 785, pierce: 1, critBonus: 0.12, critMult: 2.15, knockMult: 1.6, sixthCrit: true, cost: 17, desc: '暗金六连左轮！单发高伤强击退，每第 6 发魂弹必定暴击且穿透额外 +2' },
  smg:       { name: '疾风连发铳', icon: '💨', set: 'gun',     melee: false, dmg: 7.2,  cd: 0.155,range: 320, spd: 750, pierce: 1, spread: 0.15, cost: 16, desc: '倾泻高密度青蓝魂弹雨，自带 1 次轻穿透清理机关潮' },
  shotgun:   { name: '余烬散弹铳', icon: '💥', set: 'gun',     melee: false, dmg: 11.2, cd: 0.86, range: 280, spd: 660, pellets: 5, pierce: 1, spread: 0.34, cost: 18, desc: '一次轰出 5 颗穿透余烬散弹，中近距粉碎敌群' },
  shredder:  { name: '裂魂爆破铳', icon: '🧨', set: 'gun',     melee: false, dmg: 17.5, cd: 0.76, range: 375, spd: 690, pierce: 1, shredBlast: 0.62, blastR: 76, cost: 19, desc: '封魂铳与爆破跨界利器！贯穿弹头命中高概率引爆赤金冲击波' },

  // --- 🛡️ 黑曜重装套装 (5 把) ---
  hammer:           { name: '碎星重锤',     icon: '🔨', set: 'heavy', melee: true,  dmg: 33,  cd: 1.06, range: 142, cost: 19, knockMult: 2.4, slam: true, mode: 'blunt', arcColor: '#f6d379', desc: '重击震出暗金裂地冲击圈，强力击退并震伤成片敌人' },
  spiked_shield:    { name: '黑曜棱刺盾',   icon: '🛡️', set: 'heavy', melee: true,  dmg: 19,  cd: 0.82, range: 128, cost: 17, knockMult: 2.4, armorScale: 2.4, slam: true, mode: 'blunt', arcColor: '#94a3b8', desc: '攻防一体盾击震波！每拥有 1 点【护甲】直接额外提升 +2.4 基础伤害' },
  grenade_launcher: { name: '余烬榴弹炮',   icon: '💣', set: 'heavy', melee: false, dmg: 27,  cd: 1.08, range: 370, spd: 505, bounce: 1, isGrenade: true, blastR: 88, cost: 20, desc: '抛射弹跳余烬火雷，弹跳 1 次并在每次落点引发范围轰炸！' },
  minigun:          { name: '钟楼六管机炮', icon: '⚙️', set: 'heavy', melee: false, dmg: 5.8, cd: 0.108,range: 350, spd: 780, pierce: 1, spread: 0.18, minTier: 2, cost: 25, desc: '倒悬钟楼重装六管火神炮，狂暴倾泻穿甲魂弹幕' },
  rocket:           { name: '陨星重炮',     icon: '🚀', set: 'heavy', melee: false, dmg: 38,  cd: 1.38, range: 435, spd: 475, isRocket: true, blastR: 102, cost: 25, desc: '发射拖尾陨星重弹，命中引发大范围轰炸与焦痕' },

  // --- 🔥 四象元素套装 (6 把：炽火/极寒/紫电/蚀日共鸣) ---
  magma_blade: { name: '劫火紫电刃', icon: '🌋', set: 'elemental', melee: true,  dmg: 22,  cd: 0.67, range: 150, cost: 19, critBonus: 0.14, burnSlash: true, mode: 'crescent', arcColor: '#fb923c', desc: '火雷双象魔刃！享【近战+元素】双重增伤，挥砍必挂炽火且暴击劈出紫电超载' },
  icicle:      { name: '碎冕寒冰棱', icon: '🧊', set: 'elemental', melee: false, dmg: 19.5,cd: 0.69, range: 370, spd: 720, pierce: 2, critBonus: 0.14, critMult: 2.1, isIce: true, freezeHit: 0.24, cost: 18, desc: '艾丝特莉亚的极寒冰棱，必挂冰缓且 24% 概率直接冰冻定身敌人' },
  laser:       { name: '魂灯贯日束', icon: '⚡', set: 'elemental', melee: false, dmg: 30,  cd: 1.05, range: 455, pierce: 4, isBeam: true, cost: 22, desc: '提灯迸发青白贯日光束，无视正面盾牌瞬间穿透 4 名目标' },
  flamer:      { name: '红莲提灯火', icon: '🔥', set: 'elemental', melee: false, dmg: 5.2, cd: 0.145,range: 240, spd: 410, pierce: 4, spread: 0.26, isFlame: true, cost: 20, desc: '持续喷吐绯红魂焰火流，大范围引燃怪物触发持续灼烧' },
  taser:       { name: '伽蓝紫电弧', icon: '🌩️', set: 'elemental', melee: false, dmg: 19.5,cd: 0.68, range: 315, chains: 4, isChain: true, cost: 21, desc: '释放跳跃紫电弧连续劈向 4 名敌人，极易与火/冰触发元素反应' },
  plasma:      { name: '日蚀黑阳球', icon: '🔮', set: 'elemental', melee: false, dmg: 27,  cd: 1.15, range: 390, spd: 380, pierce: 5, isPlasma: true, blastR: 86, minTier: 2, cost: 25, desc: '发射高能日蚀暗耀法球，贯穿 5 敌并在终点引爆元素坍缩' },

  // --- ⚙️ 发条机巧套装 (5 把) ---
  wrench:      { name: '黄金发条扳手', icon: '🔧', set: 'tech', melee: true,  dmg: 16.5, cd: 0.78, range: 118, cost: 16, mode: 'blunt', arcColor: '#f6d379', desc: '重击敲击，每持一把在战场上额外部署 1 座自动发条机炮塔' },
  screwdriver: { name: '星晷磁暴针',   icon: '🪛', set: 'tech', melee: true,  dmg: 14.5, cd: 0.50, range: 114, cost: 15, critBonus: 0.12, spawnsMine: true, mode: 'stab', arcColor: '#56cfe1', desc: '极速星晷突刺，每把周期在战场自动布设高爆【发条感应地雷】！' },
  nailgun:     { name: '发条连射钉铳', icon: '🔩', set: 'tech', melee: false, dmg: 9.8,  cd: 0.22, range: 335, spd: 760, pierce: 1, spread: 0.10, techScale: 0.55, isNail: true, cost: 16, desc: '钟楼高速齿轮钉铳！自带 1 穿透，额外享受 55%【工程伤害】联动增伤' },
  drone_bay:   { name: '浮游魂灯枢',   icon: '🛸', set: 'tech', melee: false, dmg: 16.5, cd: 0.68, range: 360, spd: 700, bounce: 1, techScale: 0.50, deploysLaserTurret: true, cost: 21, desc: '发射弹射星芒弹，且每装备 1 具额外部署 1 座【浮游贯日激光塔】！' },
  emp_cannon:  { name: '逆钟磁轨炮',   icon: '📡', set: 'tech', melee: false, dmg: 34,   cd: 1.15, range: 470, pierce: 4, isBeam: true, isEmpBeam: true, techScale: 0.65, minTier: 2, cost: 24, desc: '倒悬钟楼重型磁轨炮！瞬发贯穿光束并在首目标处引爆【时滞脉冲】' }
};

// 68 件守誓圣遗物与被动装备（融入烬塔核心剧情遗物，严格保留全部 id、cost、tier、maxCount 与数值函数）
const ITEMS = [
  // --- T1 普通遗物 ---
  { id: 'worm',       name: '微光萤火蛹',   icon: '🪱', cost: 14, tier: 1, tags: ['tank'], desc: '最大生命 +6，生命再生 +1.2/秒',                  apply: p => { p.maxHp += 6; p.hp += 6; if (!p.noRegen) p.regen += 1.2; } },
  { id: 'glasses',    name: '观星单片镜',   icon: '👓', cost: 13, tier: 1, tags: ['ranged', 'crit'], desc: '攻击范围 +45，暴击率 +4%',             apply: p => { p.rangeBonus += 45; p.crit += 0.04; } },
  { id: 'coffee',     name: '雨夜甜红茶',   icon: '☕', cost: 14, tier: 1, tags: ['general'], desc: '烬羽曾为你煮过的热茶：攻速 +11%，全伤 -2%',     apply: p => { p.atkSpd += 0.11; p.dmgMul -= 0.02; } },
  { id: 'bell',       name: '断罪镇魂铅坠', icon: '🏋️', cost: 16, tier: 1, maxCount: 5, tags: ['general'], desc: '全体伤害 +16%，移速 -2%（最多叠 5 件）', apply: p => { p.dmgMul += 0.16; p.spdMul = Math.max(0.72, p.spdMul - 0.02); } },
  { id: 'fertilizer', name: '封魂晶尘瓶',   icon: '🌱', cost: 14, tier: 1, maxCount: 5, tags: ['econ'], desc: '收获 +8（波末结算出晶且递增8%），全伤 -4%', apply: p => { p.harvestFlat += 8; p.dmgMul -= 0.04; } },
  { id: 'hedgehog',   name: '白骨棘刺护腕', icon: '🦔', cost: 15, tier: 1, tags: ['melee', 'tank'], desc: '近战加成 +12%，全体伤害 +6%，护甲 +1，闪避 -4%', apply: p => { p.meleeBonus += 0.12; p.dmgMul += 0.06; p.armor += 1; p.dodge = Math.max(0, p.dodge - 0.04); } },
  { id: 'whetstone',  name: '守桥砺剑石',   icon: '🪓', cost: 15, tier: 1, maxCount: 4, tags: ['melee', 'crit'], desc: '近战伤害 +15%，暴击伤害 +15%，攻击范围 -15', apply: p => { p.meleeBonus += 0.15; p.critDmg = (p.critDmg || 0) + 0.15; p.rangeBonus -= 15; } },
  { id: 'toolbox',    name: '伽蓝发条匣',   icon: '🧰', cost: 15, tier: 1, maxCount: 4, tags: ['tech'], desc: '发条机巧（炮台与地雷）伤害 +18%，再生 +0.8/秒', apply: p => { p.techBonus = (p.techBonus || 0) + 0.18; if (!p.noRegen) p.regen += 0.8; } },
  { id: 'gunpowder',  name: '余烬火药瓮',   icon: '🛢️', cost: 15, tier: 1, maxCount: 4, tags: ['blast', 'elem'], desc: '爆炸范围 +16%，元素与爆炸伤害 +12%', apply: p => { p.explosionScale += 0.16; p.elemBonus += 0.12; } },
  { id: 'spiked_collar', name: '封魔黄金锁环', icon: '⛓️', cost: 15, tier: 1, maxCount: 4, tags: ['tank', 'melee'], desc: '最大生命 +8，护甲 +2，再生 +1.0/秒，移速 +4%', apply: p => { p.maxHp += 8; p.hp += 8; p.armor += 2; if (!p.noRegen) p.regen += 1.0; p.spdMul += 0.04; } },
  { id: 'leech_fang', name: '泣血红玉坠',   icon: '🩸', cost: 14, tier: 1, maxCount: 5, tags: ['vamp'], desc: '生命窃取 +5%，攻击速度 +6%，生命再生 -0.5/秒', apply: p => { p.lifesteal += 0.05; p.atkSpd += 0.06; p.regen = Math.max(0, p.regen - 0.5); } },
  { id: 'coupon',     name: '风语行商木牌', icon: '🏷️', cost: 16, tier: 1, maxCount: 4, tags: ['econ'], desc: '青羽行商价格永久 -7%（最多叠 4 枚），幸运 +3', apply: p => { p.shopDiscount = Math.min(0.28, p.shopDiscount + 0.07); p.luck += 3; } },
  { id: 'recycler',   name: '回溯沙漏坠',   icon: '♻️', cost: 15, tier: 1, maxCount: 3, tags: ['econ'], desc: '每波进入行商赠送 1 次免费刷新！收获 +3',      apply: p => { p.freeRerolls += 1; p.harvestFlat += 3; } },
  { id: 'lumber',     name: '守林人斗篷',   icon: '🪓', cost: 15, tier: 1, maxCount: 3, tags: ['econ'], desc: '每波战场额外生成 +1 座层域封魂器物，幸运 +4',  apply: p => { p.bonusTrees += 1; p.luck += 4; } },
  { id: 'magnet',     name: '引魂提灯芯',   icon: '🧲', cost: 14, tier: 1, maxCount: 4, tags: ['econ'], desc: '提灯拾取范围 +70，晶石爆率 +10%',             apply: p => { p.magnet += 70; p.harvest += 0.10; } },
  { id: 'plate',      name: '黑曜胸甲片',   icon: '🪨', cost: 15, tier: 1, tags: ['tank'], desc: '护甲 +3（减免受击伤害），最大生命 +3',            apply: p => { p.armor += 3; p.maxHp += 3; p.hp += 3; } },
  { id: 'clover',     name: '第998号铭牌',  icon: '🍀', cost: 14, tier: 1, maxCount: 5, tags: ['econ'], desc: '前代寻光者遗留的铭牌：幸运 +7，闪避 +2%',  apply: p => { p.luck += 7; p.healDropBonus += 0.018; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.02); } },
  { id: 'boots',      name: '巡夜轻羽靴',   icon: '🥾', cost: 15, tier: 1, tags: ['dodge'], desc: '移动速度 +10%，闪避率 +4%（上限80%）',            apply: p => { p.spdMul += 0.10; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.04); } },
  { id: 'hawk_eye',   name: '星瞳棱镜片',   icon: '🦅', cost: 15, tier: 1, maxCount: 4, tags: ['crit', 'ranged'], desc: '暴击伤害 +25%，暴击率 +5%',       apply: p => { p.critDmg = (p.critDmg || 0) + 0.25; p.crit += 0.05; } },
  { id: 'venom_gland',name: '苍翠蚀魂露',   icon: '🧪', cost: 15, tier: 1, maxCount: 4, tags: ['elem'], desc: '攻击 45% 概率叠【风蚀剧毒】（持续掉血且每层使怪物易伤+3%）', apply: p => { p.poisonChance = (p.poisonChance || 0) + 0.45; p.elemBonus += 0.08; } },

  // --- T2 精良遗物 ---
  { id: 'scope',      name: '星晷准星仪',   icon: '🎯', cost: 24, tier: 2, tags: ['ranged', 'crit'], desc: '攻击范围 +60，暴击率 +10%，攻速 -4%',   apply: p => { p.rangeBonus += 60; p.crit += 0.10; p.atkSpd -= 0.04; } },
  { id: 'crit_gauntlet', name: '断刃剑姬手甲', icon: '🥊', cost: 27, tier: 2, maxCount: 3, tags: ['crit', 'melee'], desc: '暴击伤害 +40%，暴击率 +6%，攻速 -3%', apply: p => { p.critDmg = (p.critDmg || 0) + 0.40; p.crit += 0.06; p.atkSpd -= 0.03; } },
  { id: 'brawler_pauldron', name: '守誓重肩铠', icon: '🛡️', cost: 26, tier: 2, maxCount: 3, tags: ['melee', 'tank'], desc: '近战伤害 +16%，护甲 +3；持近战兵装贴身抗首领伤 +12%', apply: p => { p.meleeBonus += 0.16; p.armor += 3; p.meleeBossGuard = (p.meleeBossGuard || 0) + 0.12; } },
  { id: 'landmine_pack', name: '发条星雷匣', icon: '💣', cost: 25, tier: 2, maxCount: 3, tags: ['tech', 'blast'], desc: '每 4.2 秒自动在身旁布设 1 枚高爆【发条星雷】（享工程与爆破加成）', apply: p => { p.mineLayers = (p.mineLayers || 0) + 1; p.techBonus = (p.techBonus || 0) + 0.10; } },
  { id: 'shrapnel_vest', name: '赤金火铳带', icon: '🧨', cost: 26, tier: 2, maxCount: 3, tags: ['blast', 'tank'], desc: '所有攻击 14% 概率触发微型爆破，爆炸范围 +15%，护甲 +2', apply: p => { p.blastChance += 0.14; p.explosionScale += 0.15; p.armor += 2; } },
  { id: 'crimson_pact',  name: '褪色的红剑穗', icon: '🥀', cost: 27, tier: 2, maxCount: 2, tags: ['vamp', 'melee'], desc: '烬羽遗物：生命窃取 +8%，全伤 +12%；汲血回生时迸发绯红剑气波！', apply: p => { p.lifesteal += 0.08; p.dmgMul += 0.12; p.bloodNova = true; } },
  { id: 'butterfly',  name: '苍翠记忆风翎', icon: '🦋', cost: 25, tier: 2, tags: ['dodge', 'elem'], desc: '青羽帽檐风翎：闪避率 +6%，元素伤害 +16%，范围 -20', apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.06); p.elemBonus += 0.16; p.rangeBonus -= 20; } },
  { id: 'snail',      name: '凝滞钟摆锤',   icon: '🐌', cost: 25, tier: 2, maxCount: 3, tags: ['tank'], desc: '全场敌人移速永久 -6%（最多叠 3 枚），自身移速 -2%', apply: p => { p.enemySlow = Math.min(0.18, p.enemySlow + 0.06); p.spdMul = Math.max(0.72, p.spdMul - 0.02); } },
  { id: 'jetpack',    name: '青岚风语披肩', icon: '🚀', cost: 26, tier: 2, maxCount: 3, tags: ['dodge'], desc: '移动速度 +12%，闪避率 +5%（上限80%），护甲 -1', apply: p => { p.spdMul += 0.12; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.05); p.armor -= 1; } },
  { id: 'thorns',     name: '黑棘断罪铠',   icon: '🌵', cost: 26, tier: 2, maxCount: 3, tags: ['tank'], desc: '护甲 +4；受击或闪避时向四周迸射护甲加成棱刺新星', apply: p => { p.armor += 4; p.thorns += 1; } },
  { id: 'cyberball',  name: '共鸣紫电珠',   icon: '🎱', cost: 26, tier: 2, maxCount: 3, tags: ['econ', 'elem'], desc: '幸运 +6；拾取封魂晶石有概率降下紫电轰击随机敌人', apply: p => { p.luck += 6; p.cyberball += 1; } },
  { id: 'bat',        name: '夜鸦暗羽披风', icon: '🦇', cost: 26, tier: 2, tags: ['vamp'], desc: '生命窃取 +7%，最大生命 +4，收获 -3',             apply: p => { p.lifesteal += 0.07; p.maxHp += 4; p.hp += 4; p.harvestFlat = Math.max(0, p.harvestFlat - 3); } },
  { id: 'medkit',     name: '魂灯温养瓶',   icon: '❤️‍🩹', cost: 26, tier: 2, tags: ['tank'], desc: '生命再生 +2.6/秒，最大生命 +5',                  apply: p => { if (!p.noRegen) p.regen += 2.6; p.maxHp += 5; p.hp += 5; } },
  { id: 'turret',     name: '自律发条塔枢', icon: '🛰️', cost: 29, tier: 2, maxCount: 4, tags: ['tech'], desc: '每波在战场上额外部署 1 座自律发条机炮塔',        apply: p => { p.bonusTurrets += 1; } },
  { id: 'adren',      name: '狂厄心音弦',   icon: '💉', cost: 28, tier: 2, tags: ['dodge', 'general'], desc: '闪避率 +6%（上限80%），攻击速度 +12%',   apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.06); p.atkSpd += 0.12; } },
  { id: 'napalm',     name: '不灭余烬灯油', icon: '🔥', cost: 27, tier: 2, maxCount: 3, tags: ['elem', 'blast'], desc: '所有攻击 35% 概率引燃敌人，元素伤害 +16%', apply: p => { p.burnChance += 0.35; p.elemBonus += 0.16; } },
  { id: 'cryo',       name: '眠冬霜泪瓶',   icon: '❄️', cost: 25, tier: 2, maxCount: 3, tags: ['elem', 'crit'], desc: '艾丝特莉亚的冰泪：攻击 40% 概率冰缓减速，暴击率 +6%', apply: p => { p.chillChance += 0.40; p.crit += 0.06; } },
  { id: 'barrier',    name: '青焰结界仪',   icon: '🛡️', cost: 28, tier: 2, tags: ['tank'], desc: '魂灯护盾上限 +10（自动回充），护甲 +2',          apply: p => { p.maxShield += 10; p.shield += 10; p.armor += 2; } },
  { id: 'crown',      name: '旧王城金冕残片',icon: '👑', cost: 28, tier: 2, maxCount: 2, tags: ['econ'], desc: '每波结算额外获得存留晶石 +12% 利息，收获 +5', apply: p => { p.interest += 0.12; p.harvestFlat += 5; } },

  // --- T3 史诗圣遗物 ---
  { id: 'bandana',       name: '绯红守桥额带',   icon: '🧣', cost: 40, tier: 3, maxCount: 2, weaponOnly: true, tags: ['ranged'], desc: '所有远程魂弹穿透 +1，全体伤害 +10%', apply: p => { p.pierceBonus += 1; p.dmgMul += 0.10; } },
  { id: 'prism',         name: '折光星冰棱镜',   icon: '🔷', cost: 41, tier: 3, maxCount: 2, weaponOnly: true, tags: ['ranged'], desc: '所有远程魂弹弹射次数 +1，攻击范围 +40', apply: p => { p.bounceBonus += 1; p.rangeBonus += 40; } },
  { id: 'tentacle',      name: '噬影汲魂触须',   icon: '🦑', cost: 41, tier: 3, maxCount: 2, tags: ['crit', 'vamp'], desc: '暴击率 +10%；攻击暴击时 22% 概率直接回复 1 生命', apply: p => { p.crit += 0.10; p.critHeal += 0.22; } },
  { id: 'sniper_cloak',  name: '永冻观星披风',   icon: '🦅', cost: 42, tier: 3, maxCount: 1, tags: ['ranged', 'crit'], desc: '【唯一】攻击范围 +90，暴击 +8%；每 15 范围转化 +1%全伤', apply: p => { p.rangeBonus += 90; p.crit += 0.08; p.rangeToDmg = true; } },
  { id: 'overseer_chip', name: '逆转黄金发条',   icon: '📡', cost: 42, tier: 3, maxCount: 2, tags: ['tech'], desc: '伽蓝核心遗物：部署 1 座【贯日激光塔】，所有炮台穿透+1且可暴击，工程+22%', apply: p => { p.laserTurrets = (p.laserTurrets || 0) + 1; p.turretCrit = true; p.techBonus = (p.techBonus || 0) + 0.22; } },
  { id: 'whirlwind_belt',name: '剑姬绯夜腰封',   icon: '🌪️', cost: 41, tier: 3, maxCount: 2, weaponOnly: true, tags: ['melee'], desc: '近战伤害 +24%，攻速 +10%；近战挥砍弧度与突刺范围扩大 +22%！', apply: p => { p.meleeBonus += 0.24; p.atkSpd += 0.10; p.meleeSweepBonus = (p.meleeSweepBonus || 0) + 0.22; } },
  { id: 'titan_heart',   name: '不灭熔炉魔心',   icon: '🫀', cost: 42, tier: 3, maxCount: 2, tags: ['tank', 'melee'], desc: '最大生命 +16，再生 +2.5/秒；每 5 点最大生命额外转化 +2% 全体伤害！', apply: p => { p.maxHp += 16; p.hp += 16; if (!p.noRegen) p.regen += 2.5; p.hpToDmg = (p.hpToDmg || 0) + 1; } },
  { id: 'fortress_plate',name: '断罪黑曜重铠',   icon: '🏰', cost: 41, tier: 3, maxCount: 2, tags: ['tank'], desc: '护甲 +6，棱刺反伤等级 +2；每拥有 1 点护甲额外转化 +1.5% 全体伤害！', apply: p => { p.armor += 6; p.thorns += 2; p.armorToDmg = (p.armorToDmg || 0) + 1; } },
  { id: 'tesla',         name: '弦月紫电音叉',   icon: '⚡', cost: 44, tier: 3, maxCount: 3, tags: ['elem', 'tech'], desc: '每 1.7 秒自动释放紫电连锁电弧劈向周围怪物',         apply: p => { p.teslaCount += 1; } },
  { id: 'warhead',       name: '赤金裂塔火核',   icon: '🧨', cost: 43, tier: 3, maxCount: 2, tags: ['blast'], desc: '攻击 22% 概率引发爆破，爆炸范围与伤害 +20%',      apply: p => { p.blastChance += 0.22; p.explosionScale += 0.20; } },
  { id: 'berserk',       name: '狂厄断刃契约',   icon: '🩸', cost: 39, tier: 3, maxCount: 2, tags: ['general', 'melee'], desc: '全体伤害 +26%，攻速 +11%，但护甲 -3',  apply: p => { p.dmgMul += 0.26; p.atkSpd += 0.11; p.armor -= 3; } },
  { id: 'blood_chalice', name: '灰烬圣餐杯',     icon: '🍷', cost: 42, tier: 3, maxCount: 2, tags: ['vamp'], desc: '生命窃取 +9%，最大生命 +8，魂血瓶治疗量 +2',       apply: p => { p.lifesteal += 0.09; p.maxHp += 8; p.hp += 8; p.healBonus += 2; } },
  { id: 'chrono_watch',  name: '冻停的银怀表',   icon: '⏱️', cost: 43, tier: 3, maxCount: 2, tags: ['dodge', 'general'], desc: '停在灾难夜的怀表：攻速 +14%，移速 +8%，受击无敌延长 +30%', apply: p => { p.atkSpd += 0.14; p.spdMul += 0.08; p.invulnBonus = (p.invulnBonus || 0) + 0.30; } },
  { id: 'overclock_core',name: '超频发条心核',   icon: '🔋', cost: 43, tier: 3, maxCount: 2, tags: ['elem', 'tech'], desc: '元素与工程伤害各 +24%，攻击范围 +45，护甲 -2', apply: p => { p.elemBonus += 0.24; p.techBonus = (p.techBonus || 0) + 0.24; p.rangeBonus += 45; p.armor -= 2; } },
  { id: 'frost_prism',   name: '碎冕冰封星核',   icon: '💎', cost: 42, tier: 3, maxCount: 2, tags: ['elem', 'crit'], desc: '攻击 24% 概率【冰冻】定身怪物 1.2s；碎冰暴击伤害额外 +25%', apply: p => { p.freezeChance = (p.freezeChance || 0) + 0.24; p.chillChance += 0.25; p.elemBonus += 0.16; } },
  { id: 'plague_flask',  name: '风蚀扩散圣瓶',   icon: '⚗️', cost: 43, tier: 3, maxCount: 2, tags: ['elem'], desc: '攻击必叠【风蚀剧毒】（上限12层），击杀时向四周扩散毒火风暴！', apply: p => { p.poisonChance = (p.poisonChance || 0) + 1.0; p.maxPoisonStacks = Math.max(p.maxPoisonStacks || 8, 12); p.plagueSpread = true; p.elemBonus += 0.20; } },
  { id: 'assassin_crest',name: '白狐守誓面具',   icon: '🗡️', cost: 42, tier: 3, maxCount: 2, tags: ['crit', 'melee'], desc: '暴击伤害 +55%，暴击率 +8%；近战暴击时 35% 概率回 1 生命', apply: p => { p.critDmg = (p.critDmg || 0) + 0.55; p.crit += 0.08; p.critMeleeHeal = true; } },

  // --- T4 传说终极圣遗物 ---
  { id: 'reactor',          name: '第一千道破晓核', icon: '☀️', cost: 68, tier: 4, maxCount: 2, tags: ['general', 'tank'], desc: '【传说】全伤 +24%，攻速 +16%，护盾 +14，再生 +2/s', apply: p => { p.dmgMul += 0.24; p.atkSpd += 0.16; p.maxShield += 14; p.shield += 14; if (!p.noRegen) p.regen += 2; } },
  { id: 'anvil',            name: '锻魂神砧',       icon: '⚒️', cost: 70, tier: 4, maxCount: 1, weaponOnly: true, tags: ['general'], desc: '【传说·唯一】每波进店免费升阶 1 把随机兵装！护甲 +4，移速 -3%', apply: p => { p.hasAnvil = true; p.armor += 4; p.spdMul = Math.max(0.72, p.spdMul - 0.03); } },
  { id: 'cornucopia',       name: '记忆丰饶圣爵',   icon: '🏺', cost: 66, tier: 4, maxCount: 1, tags: ['econ'], desc: '【传说·唯一】收获 +20，幸运 +12，治疗 +3，拾取范围 +60', apply: p => { p.harvestFlat += 20; p.luck += 12; p.healBonus += 3; p.magnet += 60; } },
  { id: 'soul_harvester',   name: '断罪冥魂镰',     icon: '💀', cost: 72, tier: 4, maxCount: 1, tags: ['general', 'crit'], desc: '【传说·唯一】全伤 +28%，暴击 +12%；击杀敌人 18% 概率迸射索敌魂雷', apply: p => { p.dmgMul += 0.28; p.crit += 0.12; p.soulBolt = true; } },
  { id: 'aegis_core',       name: '不灭魂灯圣匣',   icon: '💠', cost: 68, tier: 4, maxCount: 1, tags: ['tank'], desc: '【传说·唯一】魂灯护盾 +22，护甲 +5，护盾回充速度加快 35%', apply: p => { p.maxShield += 22; p.shield += 22; p.armor += 5; p.fastShield = true; } },
  { id: 'hermes_wings',     name: '青羽的苍翠风翼', icon: '🪽', cost: 68, tier: 4, maxCount: 1, tags: ['dodge'], desc: '【传说·唯一】移速 +22%，闪避上限升至 85%（闪避+8%），免疫移速惩罚与冰缓', apply: p => { p.noSlow = true; p.dodgeCap = Math.max(p.dodgeCap, 0.85); p.dodge = Math.min(p.dodgeCap, p.dodge + 0.08); p.spdMul = Math.max(1.0, p.spdMul) + 0.22; } },
  { id: 'star_crown',       name: '永冻星使王冠',   icon: '🌟', cost: 70, tier: 4, maxCount: 1, tags: ['general', 'econ'], desc: '【传说·唯一】全伤 +18%，攻击速度 +12%，拾取范围 +100，幸运 +10', apply: p => { p.dmgMul += 0.18; p.atkSpd += 0.12; p.magnet += 100; p.luck += 10; } },
  { id: 'doom_edge',        name: '弑神镜片·真我', icon: '☄️', cost: 72, tier: 4, maxCount: 1, tags: ['crit'], desc: '【传说·唯一】斩碎黑曜镜的残片：暴击伤害 +85%，暴击率 +12%，全伤 +18%', apply: p => { p.critDmg = (p.critDmg || 0) + 0.85; p.crit += 0.12; p.dmgMul += 0.18; } },
  { id: 'omega_factory',    name: '倒悬钟楼母枢',   icon: '🏭', cost: 70, tier: 4, maxCount: 1, tags: ['tech'], desc: '【传说·唯一】每波额外部署 2 座发条炮台，工程伤害 +45%，炮台附带灼烧与冰缓！', apply: p => { p.bonusTurrets += 2; p.techBonus = (p.techBonus || 0) + 0.45; p.turretElem = true; } },
  { id: 'doomsday_warhead', name: '日蚀黑炎核',     icon: '☢️', cost: 70, tier: 4, maxCount: 1, tags: ['blast', 'elem'], desc: '【传说·唯一】爆炸范围 +35%，攻击爆破率 +25%，所有爆炸引燃敌人造成高额灼烧！', apply: p => { p.explosionScale += 0.35; p.blastChance += 0.25; p.elemBonus += 0.22; p.napalmBlast = true; } },
  { id: 'titan_breaker',    name: '绯红九百九十九斩',icon: '⚔️', cost: 70, tier: 4, maxCount: 1, weaponOnly: true, tags: ['melee', 'tank'], desc: '【传说·唯一】近战伤害 +42%，生命 +14，护甲 +4；近战挥砍额外震出破军剑气波！', apply: p => { p.meleeBonus += 0.42; p.maxHp += 14; p.hp += 14; p.armor += 4; p.meleeShockwave = true; } },
  { id: 'trinity_orb',      name: '四象共鸣魂枢',   icon: '🔮', cost: 72, tier: 4, maxCount: 1, tags: ['elem'], desc: '【传说·唯一】元素伤害 +40%，火/冰/风毒触发率全面提升；目标每带1种异常易伤+12%！', apply: p => { p.elemBonus += 0.40; p.burnChance += 0.22; p.freezeChance = (p.freezeChance || 0) + 0.18; p.poisonChance = (p.poisonChance || 0) + 0.25; p.elemSynergy = true; } }
];

const CRATE_SUPPLIES = [
  { id: 'sup_titan', name: '守誓圣泉原液', icon: '🧬', tier: 2, cost: 28, desc: '最大生命永久 +9，并立即恢复全部损失生命值！', apply: p => { p.maxHp += 9; p.hp = p.maxHp; } },
  { id: 'sup_hyper', name: '疾风发条心弦', icon: '⚡', tier: 2, cost: 28, desc: '攻击速度永久 +10%，移动速度永久 +9%', apply: p => { p.atkSpd += 0.10; p.spdMul += 0.09; } },
  { id: 'sup_aegis', name: '黑曜结界镀层', icon: '🛡️', tier: 2, cost: 28, desc: '护甲永久 +3，魂灯护盾上限 +8', apply: p => { p.armor += 3; p.maxShield += 8; p.shield += 8; } },
  { id: 'sup_gems',  name: '高纯封魂母晶', icon: '💎', tier: 3, cost: 40, desc: '立即提炼一笔丰厚封魂晶石，且幸运永久 +6', apply: (p, w) => { const gain = Math.round(28 + w * 7); p.mats += gain; p.luck += 6; } }
];

const UPGRADES = [
  { name: '不灭体魄', icon: '❤️', desc: '最大生命 +7',                       apply: p => { p.maxHp += 7; p.hp += 7; } },
  { name: '提灯温养', icon: '🌿', desc: '每秒生命再生 +1.5',                 apply: p => { if (!p.noRegen) p.regen += 1.5; else p.lifesteal += 0.04; } },
  { name: '魂焰增幅', icon: '💪', desc: '全体伤害 +14%',                     apply: p => { p.dmgMul += 0.14; } },
  { name: '断刃剑意', icon: '⚔️', desc: '近战伤害 +18%，最大生命 +4',         apply: p => { p.meleeBonus += 0.18; p.maxHp += 4; p.hp += 4; } },
  { name: '发条专精', icon: '🔧', desc: '发条机巧（炮台/星雷）伤害 +22%，护甲 +2', apply: p => { p.techBonus = (p.techBonus || 0) + 0.22; p.armor += 2; } },
  { name: '疾速扣击', icon: '⚡', desc: '攻击速度 +11%',                     apply: p => { p.atkSpd += 0.11; } },
  { name: '星瞳扩距', icon: '📏', desc: '攻击范围 +50，暴击率 +4%',           apply: p => { p.rangeBonus += 50; p.crit += 0.04; } },
  { name: '黑曜铭甲', icon: '🪨', desc: '护甲 +3（稳定减伤）',               apply: p => { p.armor += 3; } },
  { name: '风翎轻步', icon: '👟', desc: '移动速度 +9%',                      apply: p => { p.spdMul += 0.09; } },
  { name: '破绽洞悉', icon: '🎯', desc: '暴击率 +8%',                        apply: p => { p.crit += 0.08; } },
  { name: '暗影闪避', icon: '💨', desc: '闪避率 +5%（上限80%）',             apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.05); } },
  { name: '四象过载', icon: '🔥', desc: '元素与反应伤害 +18%，暴击 +4%',     apply: p => { p.elemBonus += 0.18; p.crit += 0.04; } },
  { name: '裁决暴伤', icon: '💥', desc: '暴击伤害 +28%，暴击率 +4%',         apply: p => { p.critDmg = (p.critDmg || 0) + 0.28; p.crit += 0.04; } },
  { name: '火冰风淬', icon: '🧪', desc: '攻击附带灼烧/冰冻/风毒率各 +16%',   apply: p => { p.burnChance += 0.16; p.freezeChance = (p.freezeChance || 0) + 0.10; p.poisonChance = (p.poisonChance || 0) + 0.20; } },
  { name: '回响垂青', icon: '🍀', desc: '收获 +8（波末结晶且成长），幸运 +6', apply: p => { p.harvestFlat += 8; p.luck += 6; } },
  { id_alias: 'magnet', name: '引魂灯芯', icon: '🧲', desc: '拾取范围 +60，晶石爆率 +10%', apply: p => { p.magnet += 60; p.harvest += 0.10; } }
];
