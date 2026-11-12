// 6 档危险等级配置（平滑前中后期与各难度梯度，高难同步提升虫群规模与血量压迫感）
const MAX_WAVE = 12;
const DIFFS = [
  { id: 0, badge: '🟢 D0 休闲', name: '新手休闲', hpMul: 0.88, dmgMul: 0.85, spdMul: 0.90, spawnMul: 0.92, eliteRate: 0.02, shopTax: 0.94, matBonus: 12, midElite: false, dualElite: false, doubleBoss: false, desc: '怪血量 -12% · 怪量 -8% · 商店 94 折 · 开局赠 12 晶石，稳步熟悉构筑' },
  { id: 1, badge: '🟡 D1 标准', name: '标准挑战', hpMul: 1.12, dmgMul: 1.06, spdMul: 0.95, spawnMul: 1.08, eliteRate: 0.05, shopTax: 1.00, matBonus: 0,  midElite: true,  dualElite: false, doubleBoss: false, desc: '均衡标准局：怪血量 +12% · 虫潮 +8% · 第 5/9 波刷新先锋统领与精英怪' },
  { id: 2, badge: '🟠 D2 老兵', name: '老兵危机', hpMul: 1.38, dmgMul: 1.22, spdMul: 0.99, spawnMul: 1.22, eliteRate: 0.08, shopTax: 1.05, matBonus: 0,  midElite: true,  dualElite: false, doubleBoss: false, desc: '怪血量 +38% · 虫潮 +22% · 伤害 +22% · 考验走位拉扯与羁绊构筑' },
  { id: 3, badge: '🔴 D3 狂厄', name: '狂厄异变', hpMul: 1.70, dmgMul: 1.40, spdMul: 1.02, spawnMul: 1.36, eliteRate: 0.11, shopTax: 1.10, matBonus: 0,  midElite: true,  dualElite: true,  doubleBoss: false, desc: '怪血量 +70% · 虫潮 +36% · 特种怪提前解锁，第 9 波双统领夹击！' },
  { id: 4, badge: '🟣 D4 深渊', name: '深渊死神', hpMul: 2.10, dmgMul: 1.60, spdMul: 1.05, spawnMul: 1.52, eliteRate: 0.15, shopTax: 1.15, matBonus: 0,  midElite: true,  dualElite: true,  doubleBoss: true,  desc: '怪血量 +110% · 虫潮 +52% · 高频精英 · 第 12 波双生主宰同台降临！' },
  { id: 5, badge: '💀 D5 绝境', name: '绝境神罚', hpMul: 2.60, dmgMul: 1.82, spdMul: 1.08, spawnMul: 1.70, eliteRate: 0.20, shopTax: 1.20, matBonus: 0,  midElite: true,  dualElite: true,  doubleBoss: true,  desc: '【最高难度】怪血量 +160% · 虫潮 +70% · 物价 +20% · 双狂暴虫王！' }
];
let selectedDiff = 1;

// 8 位特色土豆角色（结构化起手装备与正负词条展示）
const CLASSES = [
  { id: 'allrounder', icon: '🧣', name: '全能战士', tag: '均衡', loadout: '🔫 手枪 + 🪵 树枝', perks: '<b>生命+6 · 全伤+8% · 收获+4</b><br>远近兼备，最稳开荒推荐' },
  { id: 'ranger',     icon: '🤠', name: '废土游侠', tag: '远程', loadout: '💨 冲锋枪 ×1',       perks: '<b>攻击范围+65 · 攻速+18% · 暴击+10%</b><br><em>生命-4</em> · 超远距枪林弹雨风筝' },
  { id: 'brawler',    icon: '🥊', name: '狂暴拳手', tag: '近战', loadout: '🪵 树枝 ×2',         perks: '<b>生命+14 · 再生+2.2/s · 近战+20%</b><br><em>攻击范围-30</em> · 贴脸横扫硬刚虫群' },
  { id: 'engineer',   icon: '🔧', name: '机械师',   tag: '炮台', loadout: '🔧 扳手 + 🔫 手枪', perks: '<b>开局自带 2 座炮台 · 再生+1.2/s</b><br>每把扳手额外部署 1 座高能炮台' },
  { id: 'vampire',    icon: '🧛', name: '嗜血公爵', tag: '吸血', loadout: '🗡️ 匕首 ×2',         perks: '<b>生命窃取+16% · 残血攻速暴涨</b><br><em>自然再生归零</em> · 刀刀吸血续航' },
  { id: 'multitasker',icon: '🐙', name: '多臂怪杰', tag: '12槽', loadout: '🪵 树枝×2 + 🔫 手枪',perks: '<b>武器槽上限翻倍至 12 把！</b><br><em>每把武器全伤-4%</em> · 火力铺满屏' },
  { id: 'bull',       icon: '🐂', name: '蛮牛铁卫', tag: '肉弹', loadout: '💥 肉身冲撞震荡波',  perks: '<b>生命+30 · 再生+4.5/s · 护甲+3</b><br><em>禁持武器</em> · 撞怪/受击引爆烈焰环' },
  { id: 'ghost',      icon: '👻', name: '幽灵刺客', tag: '闪避', loadout: '🗡️ 匕首 + 💠 手里剑',perks: '<b>闪避+28%(全局上限80%) · 幸运+8</b><br><em>生命-6</em> · 闪避触发雷暴反杀' }
];

// 6 大武器套装羁绊定义
const SET_DEFS = {
  primitive: { label: '🌿原始', steps: [2, 4, 6], desc: '2/4/6把: 最大生命 +6/+14/+24' },
  precise:   { label: '🎯精准', steps: [2, 3, 5], desc: '2/3/5把: 暴击率 +8%/+16%/+26%' },
  gun:       { label: '🔫枪械', steps: [2, 4, 6], desc: '2/4/6把: 攻击范围 +40/+85/+140 · 攻速 +6%/+14%/+22%' },
  heavy:     { label: '🛡️重装', steps: [2, 3, 5], desc: '2/3/5把: 护甲 +2/+5/+9 · 爆破范围 +15%' },
  elemental: { label: '🔥元素', steps: [2, 3, 5], desc: '2/3/5把: 元素与技能伤害 +15%/+32%/+55%' },
  tech:      { label: '⚙️工程', steps: [2, 3, 5], desc: '2/3/5把: 炮台攻速与伤害 +22%/+48%/+80%' }
};

// 32 把《土豆兄弟》经典特色武器（6 大套装全流派均衡覆盖：原始5 / 精准6 / 枪械5 / 重装5 / 元素6 / 工程5）
const WEAPONS = {
  // --- 🌿 原始套装 (5 把：近战钝击/突刺 + 远程弹石/淬毒吹箭) ---
  stick:     { name: '树枝',     icon: '🪵', set: 'primitive', melee: true,  dmg: 12,   cd: 0.68, range: 105, cost: 12, mode: 'blunt', arcColor: '#a3e635', desc: '横扫重拍，每多拿一把树枝基础伤害 +3' },
  rock:      { name: '巨石',     icon: '🪨', set: 'primitive', melee: true,  dmg: 20,   cd: 1.04, range: 96,  cost: 14, knockMult: 1.9, mode: 'blunt', arcColor: '#cbd5e1', desc: '沉重钝击，每装备 1 块巨石被动提供 +1护甲 与 +3生命' },
  spear:     { name: '长矛',     icon: '🔱', set: 'primitive', melee: true,  dmg: 16,   cd: 0.85, range: 172, cost: 16, mode: 'spear', arcColor: '#e9c46a', desc: '超长距离直线突刺，贯穿路径上所有怪物' },
  slingshot: { name: '弹弓',     icon: '🪃', set: 'primitive', melee: false, dmg: 10.5, cd: 0.64, range: 320, spd: 610, bounce: 3, isPebble: true, cost: 15, desc: '经典原始远程！发射弹力圆石在怪物间连续弹射 3 次' },
  blowgun:   { name: '吹毒箭筒', icon: '🎋', set: 'primitive', melee: false, dmg: 11.5, cd: 0.46, range: 335, spd: 690, pierce: 1, poisonHit: 1.0, hpScale: 0.08, isDart: true, cost: 15, desc: '原始部族淬毒吹箭！自带 1 穿透且命中必叠【剧毒】，额外受最大生命加成伤害' },

  // --- 🎯 精准套装 (6 把：近战刺客高暴伤 + 远程穿刺弹射狙击) ---
  knife:     { name: '匕首',     icon: '🗡️', set: 'precise',   melee: true,  dmg: 10,   cd: 0.43, range: 92,  cost: 14, critBonus: 0.16, mode: 'stab', arcColor: '#72efdd', desc: '极速寒光突刺，自带 +16% 暴击率' },
  claws:     { name: '利爪',     icon: '🐾', set: 'precise',   melee: true,  dmg: 9.5,  cd: 0.34, range: 100, cost: 18, critBonus: 0.18, critMult: 2.1, aspdScale: true, mode: 'claw', arcColor: '#f472b6', desc: '三道撕裂爪痕，额外受攻击速度加成基础伤害' },
  katana:    { name: '太刀',     icon: '⚔️', set: 'precise',   melee: true,  dmg: 19,   cd: 0.76, range: 132, cost: 20, critBonus: 0.14, critMult: 2.2, mode: 'crescent', arcColor: '#f8f9fa', desc: '大弧度凌厉居合斩，暴击伤害高达 220%' },
  crossbow:  { name: '十字弩',   icon: '🏹', set: 'precise',   melee: false, dmg: 15,   cd: 0.88, range: 400, spd: 750, pierce: 1, rangeScale: 0.045, critBonus: 0.15, cost: 17, desc: '攻击范围越高伤害越高！暴击时箭矢穿透次数额外 +2' },
  shuriken:  { name: '手里剑',   icon: '💠', set: 'precise',   melee: false, dmg: 10.5, cd: 0.50, range: 310, spd: 630, bounce: 2, critBonus: 0.12, isStar: true, poisonHit: 0.30, cost: 17, desc: '高速旋转淬毒飞镖，命中自动弹射 2 次（暴击+1次）并概率叠毒' },
  sniper:    { name: '狙击枪',   icon: '🔭', set: 'precise',   melee: false, dmg: 38,   cd: 1.44, range: 560, isSniper: true, pierce: 3, rangeScale: 0.035, critBonus: 0.22, critMult: 2.3, cost: 23, desc: '超远程瞬发穿甲弹，享受攻击范围增伤并穿透 3 怪' },

  // --- 🔫 枪械套装 (5 把：点射/左轮决斗/弹雨/霰弹/火铳爆破) ---
  pistol:    { name: '手枪',       icon: '🔫', set: 'gun',     melee: false, dmg: 13,   cd: 0.66, range: 350, spd: 680, pierce: 1, cost: 13, desc: '均衡大口径点射，自带 1 次穿透' },
  revolver:  { name: '左轮手枪',   icon: '🤠', set: 'gun',     melee: false, dmg: 22,   cd: 0.74, range: 375, spd: 760, pierce: 1, critBonus: 0.12, critMult: 2.15, knockMult: 1.6, sixthCrit: true, cost: 17, desc: '西部重型左轮！单发高伤强击退，每第 6 发子弹必定暴击且穿透额外 +2' },
  smg:       { name: '冲锋枪',     icon: '💨', set: 'gun',     melee: false, dmg: 5.6,  cd: 0.17, range: 295, spd: 720, spread: 0.17, cost: 16, desc: '倾泻高密度弹雨，伴随黄铜抛壳与火舌' },
  shotgun:   { name: '霰弹枪',     icon: '💥', set: 'gun',     melee: false, dmg: 8.4,  cd: 0.98, range: 260, spd: 640, pellets: 5, spread: 0.35, cost: 18, desc: '一次轰出 5 颗灼热霰弹丸，近身粉碎' },
  shredder:  { name: '碎纸机火铳', icon: '🧨', set: 'gun',     melee: false, dmg: 15,   cd: 0.84, range: 365, spd: 670, pierce: 1, shredBlast: 0.58, blastR: 72, cost: 19, desc: '枪械与爆破跨界利器！贯穿弹头命中时高概率直接引爆火药冲击波' },

  // --- 🛡️ 重装套装 (5 把：震地重锤/护甲盾击/弹跳榴弹/加特林/重型火箭) ---
  hammer:           { name: '战锤',       icon: '🔨', set: 'heavy', melee: true,  dmg: 26,  cd: 1.14, range: 115, cost: 19, knockMult: 2.3, slam: true, mode: 'blunt', arcColor: '#f4a261', desc: '重击震出裂地冲击圈，强力击退成片敌人' },
  spiked_shield:    { name: '尖刺重盾',   icon: '🛡️', set: 'heavy', melee: true,  dmg: 16,  cd: 0.86, range: 106, cost: 17, knockMult: 2.4, armorScale: 2.2, slam: true, mode: 'blunt', arcColor: '#94a3b8', desc: '攻防一体盾击震波！每拥有 1 点【护甲】直接额外提升 +2.2 基础伤害' },
  grenade_launcher: { name: '榴弹发射器', icon: '💣', set: 'heavy', melee: false, dmg: 23,  cd: 1.18, range: 360, spd: 485, bounce: 1, isGrenade: true, blastR: 84, cost: 20, desc: '抛射弹跳高爆榴弹，弹跳 1 次并在每次落点引发范围轰炸！' },
  minigun:          { name: '加特林',     icon: '⚙️', set: 'heavy', melee: false, dmg: 5.2, cd: 0.105,range: 340, spd: 760, pierce: 1, spread: 0.20, minTier: 2, cost: 25, desc: '重装六管火神炮，狂暴倾泻穿甲弹幕' },
  rocket:           { name: '火箭筒',     icon: '🚀', set: 'heavy', melee: false, dmg: 32,  cd: 1.50, range: 425, spd: 455, isRocket: true, blastR: 98, cost: 25, desc: '发射拖烟重型火箭，命中引发范围轰炸与焦痕' },

  // --- 🔥 元素套装 (6 把：近战熔火雷刃 + 寒冰/激光/烈焰/雷电/电浆) ---
  magma_blade: { name: '熔火雷刃', icon: '🌋', set: 'elemental', melee: true,  dmg: 18,  cd: 0.68, range: 126, cost: 19, critBonus: 0.12, burnSlash: true, mode: 'crescent', arcColor: '#ff9f1c', desc: '近战元素魔刃！同时享受【近战+元素】双重增伤，挥砍必灼烧且暴击劈出连锁闪电' },
  icicle:      { name: '寒冰锥',   icon: '🧊', set: 'elemental', melee: false, dmg: 17,  cd: 0.72, range: 360, spd: 700, pierce: 2, critBonus: 0.14, critMult: 2.1, isIce: true, freezeHit: 0.28, cost: 18, desc: '射出极寒穿透冰锥，必冰缓且 28% 概率直接冰冻定身敌人' },
  laser:       { name: '激光枪',   icon: '⚡', set: 'elemental', melee: false, dmg: 25,  cd: 1.16, range: 445, pierce: 4, isBeam: true, cost: 22, desc: '瞬发高能电浆光束，无视正面盾牌穿透 4 怪' },
  flamer:      { name: '喷火器',   icon: '🔥', set: 'elemental', melee: false, dmg: 4.3, cd: 0.15, range: 220, spd: 390, pierce: 4, spread: 0.26, isFlame: true, cost: 20, desc: '持续喷吐穿透火流，引燃怪物造成持续灼烧' },
  taser:       { name: '电击枪',   icon: '🌩️', set: 'elemental', melee: false, dmg: 14,  cd: 0.80, range: 290, chains: 4, isChain: true, cost: 21, desc: '释放跳跃连锁闪电劈向 4 名敌人，并附带减速' },
  plasma:      { name: '电浆炮',   icon: '🔮', set: 'elemental', melee: false, dmg: 22,  cd: 1.26, range: 380, spd: 360, pierce: 5, isPlasma: true, blastR: 82, minTier: 2, cost: 25, desc: '发射高能穿透电浆球，飞行终点引发元素脉冲震爆' },

  // --- ⚙️ 工程套装 (5 把：机枪炮台扳手/感应地雷螺丝刀/射钉枪/激光炮台舱/磁轨炮) ---
  wrench:      { name: '扳手',         icon: '🔧', set: 'tech', melee: true,  dmg: 13,   cd: 0.80, range: 98,  cost: 16, mode: 'blunt', arcColor: '#ffd166', desc: '钝器重击，每把扳手在场上额外部署 1 座自动机枪炮台' },
  screwdriver: { name: '磁暴螺丝刀',   icon: '🪛', set: 'tech', melee: true,  dmg: 12.5, cd: 0.52, range: 96,  cost: 15, critBonus: 0.10, spawnsMine: true, mode: 'stab', arcColor: '#4cc9f0', desc: '极速电磁突刺，每把螺丝刀周期在战场自动布设高爆【感应地雷】！' },
  nailgun:     { name: '高压射钉枪',   icon: '🔩', set: 'tech', melee: false, dmg: 8.2,  cd: 0.25, range: 320, spd: 740, pierce: 1, spread: 0.10, techScale: 0.55, isNail: true, cost: 16, desc: '工程高速连发钉枪！自带 1 穿透，额外享受 55%【工程伤害】联动增伤' },
  drone_bay:   { name: '激光无人机舱', icon: '🛸', set: 'tech', melee: false, dmg: 14,   cd: 0.72, range: 350, spd: 680, bounce: 1, techScale: 0.50, deploysLaserTurret: true, cost: 21, desc: '发射弹射脉冲弹，且每装备 1 具额外部署 1 座【贯穿激光炮台】！' },
  emp_cannon:  { name: '磁轨电磁炮',   icon: '📡', set: 'tech', melee: false, dmg: 29,   cd: 1.24, range: 460, pierce: 4, isBeam: true, isEmpBeam: true, techScale: 0.65, minTier: 2, cost: 24, desc: '重型工程磁轨炮！瞬发贯穿光束并在首目标处引爆【电磁减速脉冲】' }
};

// 68 件《土豆兄弟》标志性被动装备（全面覆盖工程/爆破/近战狂战/重装反伤/嗜血/元素/暴击/收获八大流派，严控上限与移速保底）
const ITEMS = [
  // --- T1 普通装备 ---
  { id: 'worm',       name: '外星蠕虫',   icon: '🪱', cost: 14, tier: 1, tags: ['tank'], desc: '最大生命 +6，生命再生 +1.2/秒',                  apply: p => { p.maxHp += 6; p.hp += 6; if (!p.noRegen) p.regen += 1.2; } },
  { id: 'glasses',    name: '瞄准眼镜',   icon: '👓', cost: 13, tier: 1, tags: ['ranged', 'crit'], desc: '攻击范围 +45，暴击率 +4%',             apply: p => { p.rangeBonus += 45; p.crit += 0.04; } },
  { id: 'coffee',     name: '浓缩咖啡',   icon: '☕', cost: 14, tier: 1, tags: ['general'], desc: '攻击速度 +11%，全体伤害 -2%',                  apply: p => { p.atkSpd += 0.11; p.dmgMul -= 0.02; } },
  { id: 'bell',       name: '重型哑铃',   icon: '🏋️', cost: 16, tier: 1, maxCount: 5, tags: ['general'], desc: '全体伤害 +16%，移速 -2%（最多叠 5 件）', apply: p => { p.dmgMul += 0.16; p.spdMul = Math.max(0.72, p.spdMul - 0.02); } },
  { id: 'fertilizer', name: '基因化肥',   icon: '🌱', cost: 14, tier: 1, maxCount: 5, tags: ['econ'], desc: '收获 +8（波末发晶石且递增8%），全伤 -4%', apply: p => { p.harvestFlat += 8; p.dmgMul -= 0.04; } },
  { id: 'hedgehog',   name: '刺猬甲刺',   icon: '🦔', cost: 15, tier: 1, tags: ['melee', 'tank'], desc: '近战加成 +12%，全体伤害 +6%，护甲 +1，闪避 -4%', apply: p => { p.meleeBonus += 0.12; p.dmgMul += 0.06; p.armor += 1; p.dodge = Math.max(0, p.dodge - 0.04); } },
  { id: 'whetstone',  name: '狂战磨刀石', icon: '🪓', cost: 15, tier: 1, maxCount: 4, tags: ['melee', 'crit'], desc: '近战伤害 +15%，暴击伤害 +15%，攻击范围 -15', apply: p => { p.meleeBonus += 0.15; p.critDmg = (p.critDmg || 0) + 0.15; p.rangeBonus -= 15; } },
  { id: 'toolbox',    name: '机械工具箱', icon: '🧰', cost: 15, tier: 1, maxCount: 4, tags: ['tech'], desc: '工程（炮台与地雷）伤害 +18%，生命再生 +0.8/秒', apply: p => { p.techBonus = (p.techBonus || 0) + 0.18; if (!p.noRegen) p.regen += 0.8; } },
  { id: 'gunpowder',  name: '黑火药桶',   icon: '🛢️', cost: 15, tier: 1, maxCount: 4, tags: ['blast', 'elem'], desc: '爆炸范围 +16%，元素与爆炸伤害 +12%', apply: p => { p.explosionScale += 0.16; p.elemBonus += 0.12; } },
  { id: 'spiked_collar', name: '蛮牛重铁环', icon: '⛓️', cost: 15, tier: 1, maxCount: 4, tags: ['tank', 'melee'], desc: '最大生命 +8，护甲 +2，再生 +1.0/秒，移速 +4%', apply: p => { p.maxHp += 8; p.hp += 8; p.armor += 2; if (!p.noRegen) p.regen += 1.0; p.spdMul += 0.04; } },
  { id: 'leech_fang', name: '嗜血水蛭牙', icon: '🩸', cost: 14, tier: 1, maxCount: 5, tags: ['vamp'], desc: '生命窃取 +5%，攻击速度 +6%，生命再生 -0.5/秒', apply: p => { p.lifesteal += 0.05; p.atkSpd += 0.06; p.regen = Math.max(0, p.regen - 0.5); } },
  { id: 'coupon',     name: '会员折扣卡', icon: '🏷️', cost: 16, tier: 1, maxCount: 4, tags: ['econ'], desc: '商店商品价格永久 -7%（最多叠 4 张），幸运 +3', apply: p => { p.shopDiscount = Math.min(0.28, p.shopDiscount + 0.07); p.luck += 3; } },
  { id: 'recycler',   name: '刷新回收仪', icon: '♻️', cost: 15, tier: 1, maxCount: 3, tags: ['econ'], desc: '每波进入商店赠送 1 次免费刷新！收获 +3',      apply: p => { p.freeRerolls += 1; p.harvestFlat += 3; } },
  { id: 'lumber',     name: '伐木工披肩', icon: '🪓', cost: 15, tier: 1, maxCount: 3, tags: ['econ'], desc: '每波战场额外生长 +1 棵异星晶树，幸运 +4',     apply: p => { p.bonusTrees += 1; p.luck += 4; } },
  { id: 'magnet',     name: '超导磁铁',   icon: '🧲', cost: 14, tier: 1, maxCount: 4, tags: ['econ'], desc: '拾取磁吸范围 +70，晶石爆率 +10%',             apply: p => { p.magnet += 70; p.harvest += 0.10; } },
  { id: 'plate',      name: '合金护板',   icon: '🪨', cost: 15, tier: 1, tags: ['tank'], desc: '护甲 +3（减免受击伤害），最大生命 +3',            apply: p => { p.armor += 3; p.maxHp += 3; p.hp += 3; } },
  { id: 'clover',     name: '幸运四叶草', icon: '🍀', cost: 14, tier: 1, maxCount: 5, tags: ['econ'], desc: '幸运 +7（提升高级装/血包/宝箱率），闪避 +2%',  apply: p => { p.luck += 7; p.healDropBonus += 0.018; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.02); } },
  { id: 'boots',      name: '战术军靴',   icon: '🥾', cost: 15, tier: 1, tags: ['dodge'], desc: '移动速度 +10%，闪避率 +4%（上限80%）',            apply: p => { p.spdMul += 0.10; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.04); } },
  { id: 'hawk_eye',   name: '鹰眼瞄准镜', icon: '🦅', cost: 15, tier: 1, maxCount: 4, tags: ['crit', 'ranged'], desc: '暴击伤害 +25%，暴击率 +5%',       apply: p => { p.critDmg = (p.critDmg || 0) + 0.25; p.crit += 0.05; } },
  { id: 'venom_gland',name: '剧毒曼陀罗腺',icon: '🧪', cost: 15, tier: 1, maxCount: 4, tags: ['elem'], desc: '攻击 45% 概率叠【剧毒】（持续掉血且每层使怪物易伤+3%）', apply: p => { p.poisonChance = (p.poisonChance || 0) + 0.45; p.elemBonus += 0.08; } },

  // --- T2 精良装备 ---
  { id: 'scope',      name: '战术瞄具',   icon: '🎯', cost: 24, tier: 2, tags: ['ranged', 'crit'], desc: '攻击范围 +60，暴击率 +10%，攻速 -4%',   apply: p => { p.rangeBonus += 60; p.crit += 0.10; p.atkSpd -= 0.04; } },
  { id: 'crit_gauntlet', name: '裂魂暴击拳套', icon: '🥊', cost: 27, tier: 2, maxCount: 3, tags: ['crit', 'melee'], desc: '暴击伤害 +40%，暴击率 +6%，攻速 -3%', apply: p => { p.critDmg = (p.critDmg || 0) + 0.40; p.crit += 0.06; p.atkSpd -= 0.03; } },
  { id: 'brawler_pauldron', name: '破城重肩甲', icon: '🛡️', cost: 26, tier: 2, maxCount: 3, tags: ['melee', 'tank'], desc: '近战伤害 +16%，护甲 +3；持近战武器贴身抗首领伤 +12%', apply: p => { p.meleeBonus += 0.16; p.armor += 3; p.meleeBossGuard = (p.meleeBossGuard || 0) + 0.12; } },
  { id: 'landmine_pack', name: '感应地雷包', icon: '💣', cost: 25, tier: 2, maxCount: 3, tags: ['tech', 'blast'], desc: '每 4.2 秒自动在身旁布设 1 枚高爆【感应地雷】（享工程与爆破加成）', apply: p => { p.mineLayers = (p.mineLayers || 0) + 1; p.techBonus = (p.techBonus || 0) + 0.10; } },
  { id: 'shrapnel_vest', name: '破片榴弹带', icon: '🧨', cost: 26, tier: 2, maxCount: 3, tags: ['blast', 'tank'], desc: '所有攻击 14% 概率触发微型爆破，爆炸范围 +15%，护甲 +2', apply: p => { p.blastChance += 0.14; p.explosionScale += 0.15; p.armor += 2; } },
  { id: 'crimson_pact',  name: '鲜血狂热契约', icon: '🥀', cost: 27, tier: 2, maxCount: 2, tags: ['vamp', 'melee'], desc: '生命窃取 +8%，全伤 +12%；触发吸血回血时迸发鲜血震波！', apply: p => { p.lifesteal += 0.08; p.dmgMul += 0.12; p.bloodNova = true; } },
  { id: 'butterfly',  name: '幻影蝴蝶',   icon: '🦋', cost: 25, tier: 2, tags: ['dodge', 'elem'], desc: '闪避率 +6%，元素伤害 +16%，攻击范围 -20', apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.06); p.elemBonus += 0.16; p.rangeBonus -= 20; } },
  { id: 'snail',      name: '重甲蜗牛',   icon: '🐌', cost: 25, tier: 2, maxCount: 3, tags: ['tank'], desc: '全场敌人移速永久 -6%（最多叠 3 只），自身移速 -2%', apply: p => { p.enemySlow = Math.min(0.18, p.enemySlow + 0.06); p.spdMul = Math.max(0.72, p.spdMul - 0.02); } },
  { id: 'jetpack',    name: '喷气推进包', icon: '🚀', cost: 26, tier: 2, maxCount: 3, tags: ['dodge'], desc: '移动速度 +12%，闪避率 +5%（上限80%），护甲 -1', apply: p => { p.spdMul += 0.12; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.05); p.armor -= 1; } },
  { id: 'thorns',     name: '荆棘铁甲',   icon: '🌵', cost: 26, tier: 2, maxCount: 3, tags: ['tank'], desc: '护甲 +4；受击或闪避时向四周迸射护甲加成尖刺新星', apply: p => { p.armor += 4; p.thorns += 1; } },
  { id: 'cyberball',  name: '幸运弹珠',   icon: '🎱', cost: 26, tier: 2, maxCount: 3, tags: ['econ', 'elem'], desc: '幸运 +6；拾取晶石有概率触发雷弹轰击场上随机敌人', apply: p => { p.luck += 6; p.cyberball += 1; } },
  { id: 'bat',        name: '吸血蝠翼',   icon: '🦇', cost: 26, tier: 2, tags: ['vamp'], desc: '生命窃取 +7%，最大生命 +4，收获 -3',             apply: p => { p.lifesteal += 0.07; p.maxHp += 4; p.hp += 4; p.harvestFlat = Math.max(0, p.harvestFlat - 3); } },
  { id: 'medkit',     name: '纳米血包',   icon: '❤️‍🩹', cost: 26, tier: 2, tags: ['tank'], desc: '生命再生 +2.6/秒，最大生命 +5',                  apply: p => { if (!p.noRegen) p.regen += 2.6; p.maxHp += 5; p.hp += 5; } },
  { id: 'turret',     name: '便携炮塔',   icon: '🛰️', cost: 29, tier: 2, maxCount: 4, tags: ['tech'], desc: '每波额外空投 1 座自动防御炮台',                apply: p => { p.bonusTurrets += 1; } },
  { id: 'adren',      name: '肾上腺素',   icon: '💉', cost: 28, tier: 2, tags: ['dodge', 'general'], desc: '闪避率 +6%（上限80%），攻击速度 +12%',   apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.06); p.atkSpd += 0.12; } },
  { id: 'napalm',     name: '凝固汽油桶', icon: '🔥', cost: 27, tier: 2, maxCount: 3, tags: ['elem', 'blast'], desc: '所有攻击 35% 概率引燃敌人，元素伤害 +16%', apply: p => { p.burnChance += 0.35; p.elemBonus += 0.16; } },
  { id: 'cryo',       name: '液氮冷却罐', icon: '❄️', cost: 25, tier: 2, maxCount: 3, tags: ['elem', 'crit'], desc: '攻击 40% 概率冰缓敌人减速，暴击率 +6%', apply: p => { p.chillChance += 0.40; p.crit += 0.06; } },
  { id: 'barrier',    name: '偏导力场仪', icon: '🛡️', cost: 28, tier: 2, tags: ['tank'], desc: '能量护盾上限 +10（自动回充），护甲 +2',          apply: p => { p.maxShield += 10; p.shield += 10; p.armor += 2; } },
  { id: 'crown',      name: '黄金理财冠', icon: '👑', cost: 28, tier: 2, maxCount: 2, tags: ['econ'], desc: '每波结算额外获得存留晶石 +12% 利息，收获 +5', apply: p => { p.interest += 0.12; p.harvestFlat += 5; } },

  // --- T3 史诗装备 ---
  { id: 'bandana',       name: '穿甲头巾',   icon: '🧣', cost: 40, tier: 3, maxCount: 2, weaponOnly: true, tags: ['ranged'], desc: '所有远程子弹穿透 +1，全体伤害 +10%', apply: p => { p.pierceBonus += 1; p.dmgMul += 0.10; } },
  { id: 'prism',         name: '跳弹棱镜',   icon: '🔷', cost: 41, tier: 3, maxCount: 2, weaponOnly: true, tags: ['ranged'], desc: '所有远程子弹弹射次数 +1，攻击范围 +40', apply: p => { p.bounceBonus += 1; p.rangeBonus += 40; } },
  { id: 'tentacle',      name: '暴击触手',   icon: '🦑', cost: 41, tier: 3, maxCount: 2, tags: ['crit', 'vamp'], desc: '暴击率 +10%；攻击暴击时 22% 概率直接回复 1 生命', apply: p => { p.crit += 0.10; p.critHeal += 0.22; } },
  { id: 'sniper_cloak',  name: '鹰眼披风',   icon: '🦅', cost: 42, tier: 3, maxCount: 1, tags: ['ranged', 'crit'], desc: '【唯一】攻击范围 +90，暴击 +8%；每 15 范围转化 +1%全伤', apply: p => { p.rangeBonus += 90; p.crit += 0.08; p.rangeToDmg = true; } },
  { id: 'overseer_chip', name: '矩阵火控芯片', icon: '📡', cost: 42, tier: 3, maxCount: 2, tags: ['tech'], desc: '空投 1 座【贯穿激光炮台】！所有炮台穿透+1且可暴击，工程伤害 +22%', apply: p => { p.laserTurrets = (p.laserTurrets || 0) + 1; p.turretCrit = true; p.techBonus = (p.techBonus || 0) + 0.22; } },
  { id: 'whirlwind_belt',name: '旋风斩腰带', icon: '🌪️', cost: 41, tier: 3, maxCount: 2, weaponOnly: true, tags: ['melee'], desc: '近战伤害 +24%，攻击速度 +10%；近战挥砍弧度与突刺范围扩大 +22%！', apply: p => { p.meleeBonus += 0.24; p.atkSpd += 0.10; p.meleeSweepBonus = (p.meleeSweepBonus || 0) + 0.22; } },
  { id: 'titan_heart',   name: '巨兽熔炉之心', icon: '🫀', cost: 42, tier: 3, maxCount: 2, tags: ['tank', 'melee'], desc: '最大生命 +16，再生 +2.5/秒；每 5 点最大生命额外转化 +2% 全体伤害！', apply: p => { p.maxHp += 16; p.hp += 16; if (!p.noRegen) p.regen += 2.5; p.hpToDmg = (p.hpToDmg || 0) + 1; } },
  { id: 'fortress_plate',name: '堡垒反击重甲', icon: '🏰', cost: 41, tier: 3, maxCount: 2, tags: ['tank'], desc: '护甲 +6，尖刺反伤等级 +2；每拥有 1 点护甲额外转化 +1.5% 全体伤害！', apply: p => { p.armor += 6; p.thorns += 2; p.armorToDmg = (p.armorToDmg || 0) + 1; } },
  { id: 'tesla',         name: '特斯拉线圈', icon: '⚡', cost: 44, tier: 3, maxCount: 3, tags: ['elem', 'tech'], desc: '每 1.7 秒自动释放连锁电弧劈向周围怪物',         apply: p => { p.teslaCount += 1; } },
  { id: 'warhead',       name: '高爆弹头',   icon: '🧨', cost: 43, tier: 3, maxCount: 2, tags: ['blast'], desc: '攻击 22% 概率引发爆破，爆炸范围与伤害 +20%',      apply: p => { p.blastChance += 0.22; p.explosionScale += 0.20; } },
  { id: 'berserk',       name: '狂战双刃斧', icon: '🩸', cost: 39, tier: 3, maxCount: 2, tags: ['general', 'melee'], desc: '全体伤害 +26%，攻速 +11%，但护甲 -3',  apply: p => { p.dmgMul += 0.26; p.atkSpd += 0.11; p.armor -= 3; } },
  { id: 'blood_chalice', name: '猩红圣餐杯', icon: '🍷', cost: 42, tier: 3, maxCount: 2, tags: ['vamp'], desc: '生命窃取 +9%，最大生命 +8，血包治疗量 +2',       apply: p => { p.lifesteal += 0.09; p.maxHp += 8; p.hp += 8; p.healBonus += 2; } },
  { id: 'chrono_watch',  name: '时停怀表',   icon: '⏱️', cost: 43, tier: 3, maxCount: 2, tags: ['dodge', 'general'], desc: '攻击速度 +14%，移速 +8%，受击无敌时间延长 +30%', apply: p => { p.atkSpd += 0.14; p.spdMul += 0.08; p.invulnBonus = (p.invulnBonus || 0) + 0.30; } },
  { id: 'overclock_core',name: '超频能量核', icon: '🔋', cost: 43, tier: 3, maxCount: 2, tags: ['elem', 'tech'], desc: '元素与工程伤害各 +24%，攻击范围 +45，护甲 -2', apply: p => { p.elemBonus += 0.24; p.techBonus = (p.techBonus || 0) + 0.24; p.rangeBonus += 45; p.armor -= 2; } },
  { id: 'frost_prism',   name: '绝对零度棱镜', icon: '💎', cost: 42, tier: 3, maxCount: 2, tags: ['elem', 'crit'], desc: '攻击 24% 概率【冰冻】定身怪物 1.2s；碎冰暴击伤害额外 +25%', apply: p => { p.freezeChance = (p.freezeChance || 0) + 0.24; p.chillChance += 0.25; p.elemBonus += 0.16; } },
  { id: 'plague_flask',  name: '瘟疫炼金瓶', icon: '⚗️', cost: 43, tier: 3, maxCount: 2, tags: ['elem'], desc: '攻击必叠【剧毒】（上限升至 12 层），毒杀敌人向四周传染毒火爆发！', apply: p => { p.poisonChance = (p.poisonChance || 0) + 1.0; p.maxPoisonStacks = Math.max(p.maxPoisonStacks || 8, 12); p.plagueSpread = true; p.elemBonus += 0.20; } },
  { id: 'assassin_crest',name: '暗影处决徽章', icon: '🗡️', cost: 42, tier: 3, maxCount: 2, tags: ['crit', 'melee'], desc: '暴击伤害 +55%，暴击率 +8%；近战武器暴击时 35% 概率回 1 生命', apply: p => { p.critDmg = (p.critDmg || 0) + 0.55; p.crit += 0.08; p.critMeleeHeal = true; } },

  // --- T4 传说装备（严格低爆率且设唯一/上限，覆盖全流派终极神装） ---
  { id: 'reactor',          name: '聚变反应堆',     icon: '☀️', cost: 68, tier: 4, maxCount: 2, tags: ['general', 'tank'], desc: '【传说】全伤 +24%，攻速 +16%，护盾 +14，再生 +2/s', apply: p => { p.dmgMul += 0.24; p.atkSpd += 0.16; p.maxShield += 14; p.shield += 14; if (!p.noRegen) p.regen += 2; } },
  { id: 'anvil',            name: '铁匠神砧',       icon: '⚒️', cost: 70, tier: 4, maxCount: 1, weaponOnly: true, tags: ['general'], desc: '【传说·唯一】每波进店免费升阶 1 把随机武器！护甲 +4，移速 -3%', apply: p => { p.hasAnvil = true; p.armor += 4; p.spdMul = Math.max(0.72, p.spdMul - 0.03); } },
  { id: 'cornucopia',       name: '丰饶圣杯',       icon: '🏺', cost: 66, tier: 4, maxCount: 1, tags: ['econ'], desc: '【传说·唯一】收获 +20，幸运 +12，血包治疗 +3，拾取范围 +60', apply: p => { p.harvestFlat += 20; p.luck += 12; p.healBonus += 3; p.magnet += 60; } },
  { id: 'soul_harvester',   name: '噬魂死神镰',     icon: '💀', cost: 72, tier: 4, maxCount: 1, tags: ['general', 'crit'], desc: '【传说·唯一】全伤 +28%，暴击 +12%；击杀敌人 18% 概率迸射索敌魂雷', apply: p => { p.dmgMul += 0.28; p.crit += 0.12; p.soulBolt = true; } },
  { id: 'aegis_core',       name: '不朽神盾核',     icon: '💠', cost: 68, tier: 4, maxCount: 1, tags: ['tank'], desc: '【传说·唯一】能量护盾 +22，护甲 +5，护盾破碎回充速度加快 35%', apply: p => { p.maxShield += 22; p.shield += 22; p.armor += 5; p.fastShield = true; } },
  { id: 'hermes_wings',     name: '赫尔墨斯飞翼',   icon: '🪽', cost: 68, tier: 4, maxCount: 1, tags: ['dodge'], desc: '【传说·唯一】移速 +22%，闪避上限升至 85%（闪避+8%），免疫移速惩罚与冰缓', apply: p => { p.noSlow = true; p.dodgeCap = Math.max(p.dodgeCap, 0.85); p.dodge = Math.min(p.dodgeCap, p.dodge + 0.08); p.spdMul = Math.max(1.0, p.spdMul) + 0.22; } },
  { id: 'star_crown',       name: '星界帝王冠',     icon: '🌟', cost: 70, tier: 4, maxCount: 1, tags: ['general', 'econ'], desc: '【传说·唯一】全伤 +18%，攻击速度 +12%，拾取范围 +100，幸运 +10', apply: p => { p.dmgMul += 0.18; p.atkSpd += 0.12; p.magnet += 100; p.luck += 10; } },
  { id: 'doom_edge',        name: '毁灭裁决神石',   icon: '☄️', cost: 72, tier: 4, maxCount: 1, tags: ['crit'], desc: '【传说·唯一】暴击伤害 +85%，暴击率 +12%，全体伤害 +18%', apply: p => { p.critDmg = (p.critDmg || 0) + 0.85; p.crit += 0.12; p.dmgMul += 0.18; } },
  { id: 'omega_factory',    name: '欧米茄母巢核心', icon: '🏭', cost: 70, tier: 4, maxCount: 1, tags: ['tech'], desc: '【传说·唯一】每波额外部署 2 座炮台，工程伤害 +45%，炮台攻击附带灼烧与减速！', apply: p => { p.bonusTurrets += 2; p.techBonus = (p.techBonus || 0) + 0.45; p.turretElem = true; } },
  { id: 'doomsday_warhead', name: '末日聚变弹头',   icon: '☢️', cost: 70, tier: 4, maxCount: 1, tags: ['blast', 'elem'], desc: '【传说·唯一】爆炸范围 +35%，攻击爆破率 +25%，所有爆炸引燃敌人造成高额灼烧！', apply: p => { p.explosionScale += 0.35; p.blastChance += 0.25; p.elemBonus += 0.22; p.napalmBlast = true; } },
  { id: 'titan_breaker',    name: '泰坦破军战铠',   icon: '⚔️', cost: 70, tier: 4, maxCount: 1, weaponOnly: true, tags: ['melee', 'tank'], desc: '【传说·唯一】近战伤害 +42%，生命 +14，护甲 +4；近战攻击额外震出破军冲击波！', apply: p => { p.meleeBonus += 0.42; p.maxHp += 14; p.hp += 14; p.armor += 4; p.meleeShockwave = true; } },
  { id: 'trinity_orb',      name: '三相元素神枢',   icon: '🔮', cost: 72, tier: 4, maxCount: 1, tags: ['elem'], desc: '【传说·唯一】元素伤害 +40%，火/冰/毒概率全面提升；目标每带 1 种元素异常易伤 +12%！', apply: p => { p.elemBonus += 0.40; p.burnChance += 0.22; p.freezeChance = (p.freezeChance || 0) + 0.18; p.poisonChance = (p.poisonChance || 0) + 0.25; p.elemSynergy = true; } }
];

// 异星战利品箱专属即时补给核心（丰富开箱池，提供属性原液/急救满血/高纯晶簇等多元收益）
const CRATE_SUPPLIES = [
  { id: 'sup_titan', name: '泰坦活性原液', icon: '🧬', tier: 2, cost: 28, desc: '最大生命永久 +9，并立即恢复全部损失生命值！', apply: p => { p.maxHp += 9; p.hp = p.maxHp; } },
  { id: 'sup_hyper', name: '超导机动核心', icon: '⚡', tier: 2, cost: 28, desc: '攻击速度永久 +10%，移动速度永久 +9%', apply: p => { p.atkSpd += 0.10; p.spdMul += 0.09; } },
  { id: 'sup_aegis', name: '重装纳米镀层', icon: '🛡️', tier: 2, cost: 28, desc: '护甲永久 +3，能量护盾上限 +8', apply: p => { p.armor += 3; p.maxShield += 8; p.shield += 8; } },
  { id: 'sup_gems',  name: '高纯紫晶母矿', icon: '💎', tier: 3, cost: 40, desc: '立即提炼一笔丰厚晶石资金，且幸运永久 +6', apply: (p, w) => { const gain = Math.round(28 + w * 7); p.mats += gain; p.luck += 6; } }
];

const UPGRADES = [
  { name: '泰坦体魄', icon: '❤️', desc: '最大生命 +7',                       apply: p => { p.maxHp += 7; p.hp += 7; } },
  { name: '活性再生', icon: '🌿', desc: '每秒生命再生 +1.5',                 apply: p => { if (!p.noRegen) p.regen += 1.5; else p.lifesteal += 0.04; } },
  { name: '高爆火药', icon: '💪', desc: '全体伤害 +14%',                     apply: p => { p.dmgMul += 0.14; } },
  { name: '重刃狂战', icon: '⚔️', desc: '近战伤害 +18%，最大生命 +4',         apply: p => { p.meleeBonus += 0.18; p.maxHp += 4; p.hp += 4; } },
  { name: '机械专精', icon: '🔧', desc: '工程（炮台/地雷）伤害 +22%，护甲 +2', apply: p => { p.techBonus = (p.techBonus || 0) + 0.22; p.armor += 2; } },
  { name: '极速扳机', icon: '⚡', desc: '攻击速度 +11%',                     apply: p => { p.atkSpd += 0.11; } },
  { name: '鹰眼扩距', icon: '📏', desc: '攻击范围 +50，暴击率 +4%',           apply: p => { p.rangeBonus += 50; p.crit += 0.04; } },
  { name: '钢铁甲壳', icon: '🪨', desc: '护甲 +3（稳定减伤）',               apply: p => { p.armor += 3; } },
  { name: '氮气推进', icon: '👟', desc: '移动速度 +9%',                      apply: p => { p.spdMul += 0.09; } },
  { name: '弱点洞悉', icon: '🎯', desc: '暴击率 +8%',                        apply: p => { p.crit += 0.08; } },
  { name: '暗影闪避', icon: '💨', desc: '闪避率 +5%（上限80%）',             apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.05); } },
  { name: '元素过载', icon: '🔥', desc: '元素与爆炸伤害 +18%，暴击 +4%',     apply: p => { p.elemBonus += 0.18; p.crit += 0.04; } },
  { name: '致命暴伤', icon: '💥', desc: '暴击伤害 +28%，暴击率 +4%',         apply: p => { p.critDmg = (p.critDmg || 0) + 0.28; p.crit += 0.04; } },
  { name: '冰火毒淬', icon: '🧪', desc: '攻击附带灼烧/冰冻/剧毒率各 +16%',   apply: p => { p.burnChance += 0.16; p.freezeChance = (p.freezeChance || 0) + 0.10; p.poisonChance = (p.poisonChance || 0) + 0.20; } },
  { name: '丰收幸运', icon: '🍀', desc: '收获 +8（波末发钻且成长），幸运 +6', apply: p => { p.harvestFlat += 8; p.luck += 6; } },
  { name: '引力晶核', icon: '🧲', desc: '拾取范围 +60，晶石爆率 +10%',       apply: p => { p.magnet += 60; p.harvest += 0.10; } }
];
