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

// 22 把《土豆兄弟》经典特色武器（差异化干净刀光与投射轨迹：钝击/撕爪/突刺/枪芒/居合/弹射/贯穿）
const WEAPONS = {
  stick:     { name: '树枝',   icon: '🪵', set: 'primitive', melee: true,  dmg: 12,   cd: 0.68, range: 105, cost: 12, mode: 'blunt', arcColor: '#a3e635', desc: '横扫重拍，每多拿一把树枝基础伤害 +3' },
  rock:      { name: '巨石',   icon: '🪨', set: 'primitive', melee: true,  dmg: 20,   cd: 1.04, range: 96,  cost: 14, knockMult: 1.9, mode: 'blunt', arcColor: '#cbd5e1', desc: '沉重钝击，每装备 1 块巨石被动提供 +1护甲 与 +3生命' },
  spear:     { name: '长矛',   icon: '🔱', set: 'primitive', melee: true,  dmg: 16,   cd: 0.85, range: 172, cost: 16, mode: 'spear', arcColor: '#e9c46a', desc: '超长距离直线突刺，贯穿路径上所有怪物' },
  slingshot: { name: '弹弓',   icon: '🪃', set: 'primitive', melee: false, dmg: 10.5, cd: 0.64, range: 320, spd: 610, bounce: 3, isPebble: true, cost: 15, desc: '经典原始远程！发射弹力圆石在怪物间连续弹射 3 次' },
  knife:     { name: '匕首',   icon: '🗡️', set: 'precise',   melee: true,  dmg: 10,   cd: 0.43, range: 92,  cost: 14, critBonus: 0.16, mode: 'stab', arcColor: '#72efdd', desc: '极速寒光突刺，自带 +16% 暴击率' },
  claws:     { name: '利爪',   icon: '🐾', set: 'precise',   melee: true,  dmg: 9.5,  cd: 0.34, range: 100, cost: 18, critBonus: 0.18, critMult: 2.1, aspdScale: true, mode: 'claw', arcColor: '#f472b6', desc: '三道撕裂爪痕，额外受攻击速度加成基础伤害' },
  katana:    { name: '太刀',   icon: '⚔️', set: 'precise',   melee: true,  dmg: 19,   cd: 0.76, range: 132, cost: 20, critBonus: 0.14, critMult: 2.2, mode: 'crescent', arcColor: '#f8f9fa', desc: '大弧度凌厉居合斩，暴击伤害高达 220%' },
  crossbow:  { name: '十字弩', icon: '🏹', set: 'precise',   melee: false, dmg: 15,   cd: 0.88, range: 400, spd: 750, pierce: 1, rangeScale: 0.045, critBonus: 0.15, cost: 17, desc: '攻击范围越高伤害越高！暴击时箭矢穿透次数额外 +2' },
  shuriken:  { name: '手里剑', icon: '💠', set: 'precise',   melee: false, dmg: 10.5, cd: 0.50, range: 310, spd: 630, bounce: 2, critBonus: 0.12, isStar: true, cost: 17, desc: '高速旋转飞镖，命中自动弹射 2 次（暴击再+1次）' },
  sniper:    { name: '狙击枪', icon: '🔭', set: 'precise',   melee: false, dmg: 38,   cd: 1.44, range: 560, isSniper: true, pierce: 3, rangeScale: 0.035, critBonus: 0.22, critMult: 2.3, cost: 23, desc: '超远程瞬发穿甲弹，享受攻击范围增伤并穿透 3 怪' },
  hammer:    { name: '战锤',   icon: '🔨', set: 'heavy',     melee: true,  dmg: 26,   cd: 1.14, range: 115, cost: 19, knockMult: 2.3, slam: true, mode: 'blunt', arcColor: '#f4a261', desc: '重击震出裂地冲击圈，强力击退成片敌人' },
  wrench:    { name: '扳手',   icon: '🔧', set: 'tech',      melee: true,  dmg: 13,   cd: 0.80, range: 98,  cost: 16, mode: 'blunt', arcColor: '#ffd166', desc: '钝器重击，每把扳手在场上额外部署 1 座炮台' },
  pistol:    { name: '手枪',   icon: '🔫', set: 'gun',       melee: false, dmg: 13,   cd: 0.66, range: 350, spd: 680, pierce: 1, cost: 13, desc: '均衡大口径点射，自带 1 次穿透' },
  smg:       { name: '冲锋枪', icon: '💨', set: 'gun',       melee: false, dmg: 5.6,  cd: 0.17, range: 295, spd: 720, spread: 0.17, cost: 16, desc: '倾泻高密度弹雨，伴随黄铜抛壳与火舌' },
  shotgun:   { name: '霰弹枪', icon: '💥', set: 'gun',       melee: false, dmg: 8.4,  cd: 0.98, range: 260, spd: 640, pellets: 5, spread: 0.35, cost: 18, desc: '一次轰出 5 颗灼热霰弹丸，近身粉碎' },
  minigun:   { name: '加特林', icon: '⚙️', set: 'heavy',     melee: false, dmg: 5.2,  cd: 0.105,range: 340, spd: 760, pierce: 1, spread: 0.20, minTier: 2, cost: 25, desc: '重装六管火神炮，狂暴倾泻穿甲弹幕' },
  icicle:    { name: '寒冰锥', icon: '🧊', set: 'elemental', melee: false, dmg: 17,   cd: 0.72, range: 360, spd: 700, pierce: 2, critBonus: 0.14, critMult: 2.1, isIce: true, cost: 18, desc: '射出极寒穿透冰锥，100% 冰缓减速敌人并具高额暴伤' },
  laser:     { name: '激光枪', icon: '⚡', set: 'elemental', melee: false, dmg: 25,   cd: 1.16, range: 445, pierce: 4, isBeam: true, cost: 22, desc: '瞬发高能电浆光束，无视正面盾牌穿透 4 怪' },
  flamer:    { name: '喷火器', icon: '🔥', set: 'elemental', melee: false, dmg: 4.3,  cd: 0.15, range: 220, spd: 390, pierce: 4, spread: 0.26, isFlame: true, cost: 20, desc: '持续喷吐穿透火流，引燃怪物造成持续灼烧' },
  taser:     { name: '电击枪', icon: '🌩️', set: 'elemental', melee: false, dmg: 14,   cd: 0.80, range: 290, chains: 4, isChain: true, cost: 21, desc: '释放跳跃连锁闪电劈向 4 名敌人，并附带减速' },
  plasma:    { name: '电浆炮', icon: '🔮', set: 'elemental', melee: false, dmg: 22,   cd: 1.26, range: 380, spd: 360, pierce: 5, isPlasma: true, blastR: 82, minTier: 2, cost: 25, desc: '发射高能穿透电浆球，飞行终点引发元素脉冲震爆' },
  rocket:    { name: '火箭筒', icon: '🚀', set: 'heavy',     melee: false, dmg: 32,   cd: 1.50, range: 425, spd: 455, isRocket: true, blastR: 98, cost: 25, desc: '发射拖烟重型火箭，命中引发范围轰炸与焦痕' }
};

// 36 件《土豆兄弟》标志性被动装备（严控闪避 80% 上限与幸运膨胀，强化正负词条取舍）
const ITEMS = [
  // --- T1 普通装备 ---
  { id: 'worm',       name: '外星蠕虫',   icon: '🪱', cost: 14, tier: 1, desc: '最大生命 +6，生命再生 +1.2/秒',                  apply: p => { p.maxHp += 6; p.hp += 6; if (!p.noRegen) p.regen += 1.2; } },
  { id: 'glasses',    name: '瞄准眼镜',   icon: '👓', cost: 13, tier: 1, desc: '攻击范围 +45，暴击率 +4%',                       apply: p => { p.rangeBonus += 45; p.crit += 0.04; } },
  { id: 'coffee',     name: '浓缩咖啡',   icon: '☕', cost: 14, tier: 1, desc: '攻击速度 +11%，全体伤害 -2%',                    apply: p => { p.atkSpd += 0.11; p.dmgMul -= 0.02; } },
  { id: 'bell',       name: '重型哑铃',   icon: '🏋️', cost: 16, tier: 1, desc: '全体伤害 +16%，移速 -3%',                        apply: p => { p.dmgMul += 0.16; p.spdMul -= 0.03; } },
  { id: 'fertilizer', name: '基因化肥',   icon: '🌱', cost: 14, tier: 1, desc: '收获 +8（每波结算发晶石且每波递增8%），全伤 -4%',  apply: p => { p.harvestFlat += 8; p.dmgMul -= 0.04; } },
  { id: 'hedgehog',   name: '刺猬甲刺',   icon: '🦔', cost: 15, tier: 1, desc: '近战加成 +12%，全体伤害 +6%，护甲 +1，闪避 -4%',  apply: p => { p.meleeBonus += 0.12; p.dmgMul += 0.06; p.armor += 1; p.dodge = Math.max(0, p.dodge - 0.04); } },
  { id: 'coupon',     name: '会员折扣卡', icon: '🏷️', cost: 16, tier: 1, desc: '商店商品价格永久 -7%（最多叠 4 张），幸运 +3',    apply: p => { p.shopDiscount = Math.min(0.28, p.shopDiscount + 0.07); p.luck += 3; } },
  { id: 'recycler',   name: '刷新回收仪', icon: '♻️', cost: 15, tier: 1, desc: '每波进入商店赠送 1 次免费刷新！收获 +3',         apply: p => { p.freeRerolls += 1; p.harvestFlat += 3; } },
  { id: 'lumber',     name: '伐木工披肩', icon: '🪓', cost: 15, tier: 1, desc: '每波战场额外生长 +1 棵异星晶树，幸运 +4',        apply: p => { p.bonusTrees += 1; p.luck += 4; } },
  { id: 'magnet',     name: '超导磁铁',   icon: '🧲', cost: 14, tier: 1, desc: '拾取磁吸范围 +70，晶石爆率 +10%',                apply: p => { p.magnet += 70; p.harvest += 0.10; } },
  { id: 'plate',      name: '合金护板',   icon: '🪨', cost: 15, tier: 1, desc: '护甲 +3（减免受击伤害），最大生命 +3',            apply: p => { p.armor += 3; p.maxHp += 3; p.hp += 3; } },
  { id: 'clover',     name: '幸运四叶草', icon: '🍀', cost: 14, tier: 1, desc: '幸运 +7（提升高级装/血包/宝箱率），闪避 +2%',     apply: p => { p.luck += 7; p.healDropBonus += 0.018; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.02); } },
  { id: 'boots',      name: '战术军靴',   icon: '🥾', cost: 15, tier: 1, desc: '移动速度 +8%，闪避率 +4%（上限80%）',             apply: p => { p.spdMul += 0.08; p.dodge = Math.min(p.dodgeCap, p.dodge + 0.04); } },

  // --- T2 精良装备 ---
  { id: 'scope',      name: '战术瞄具',   icon: '🎯', cost: 24, tier: 2, desc: '攻击范围 +60，暴击率 +10%，攻速 -4%',            apply: p => { p.rangeBonus += 60; p.crit += 0.10; p.atkSpd -= 0.04; } },
  { id: 'butterfly',  name: '幻影蝴蝶',   icon: '🦋', cost: 25, tier: 2, desc: '闪避率 +6%，元素伤害 +16%，攻击范围 -20',        apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.06); p.elemBonus += 0.16; p.rangeBonus -= 20; } },
  { id: 'snail',      name: '重甲蜗牛',   icon: '🐌', cost: 25, tier: 2, desc: '全场敌人移速永久 -6%（最多叠3层），自身移速 -3%', apply: p => { p.enemySlow = Math.min(0.18, p.enemySlow + 0.06); p.spdMul -= 0.03; } },
  { id: 'thorns',     name: '荆棘铁甲',   icon: '🌵', cost: 26, tier: 2, desc: '护甲 +4；受击或闪避时向四周迸射护甲加成尖刺新星', apply: p => { p.armor += 4; p.thorns += 1; } },
  { id: 'cyberball',  name: '幸运弹珠',   icon: '🎱', cost: 26, tier: 2, desc: '幸运 +6；拾取晶石有概率触发雷弹轰击场上随机敌人', apply: p => { p.luck += 6; p.cyberball += 1; } },
  { id: 'bat',        name: '吸血蝠翼',   icon: '🦇', cost: 26, tier: 2, desc: '生命窃取 +7%，最大生命 +4，收获 -3',             apply: p => { p.lifesteal += 0.07; p.maxHp += 4; p.hp += 4; p.harvestFlat = Math.max(0, p.harvestFlat - 3); } },
  { id: 'medkit',     name: '纳米血包',   icon: '❤️‍🩹', cost: 26, tier: 2, desc: '生命再生 +2.6/秒，最大生命 +5',                  apply: p => { if (!p.noRegen) p.regen += 2.6; p.maxHp += 5; p.hp += 5; } },
  { id: 'turret',     name: '便携炮塔',   icon: '🛰️', cost: 29, tier: 2, desc: '每波额外空投 1 座自动防御炮台',                   apply: p => { p.bonusTurrets += 1; } },
  { id: 'adren',      name: '肾上腺素',   icon: '💉', cost: 28, tier: 2, desc: '闪避率 +6%（上限80%），攻击速度 +12%',            apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.06); p.atkSpd += 0.12; } },
  { id: 'napalm',     name: '凝固汽油桶', icon: '🔥', cost: 27, tier: 2, desc: '所有攻击 35% 概率引燃敌人，元素伤害 +16%',        apply: p => { p.burnChance += 0.35; p.elemBonus += 0.16; } },
  { id: 'cryo',       name: '液氮冷却罐', icon: '❄️', cost: 25, tier: 2, desc: '攻击 40% 概率冰缓敌人减速，暴击率 +6%',          apply: p => { p.chillChance += 0.40; p.crit += 0.06; } },
  { id: 'barrier',    name: '偏导力场仪', icon: '🛡️', cost: 28, tier: 2, desc: '能量护盾上限 +10（每7秒自动回充），护甲 +2',      apply: p => { p.maxShield += 10; p.shield += 10; p.armor += 2; } },
  { id: 'crown',      name: '黄金理财冠', icon: '👑', cost: 28, tier: 2, desc: '每波结算额外获得当前存留晶石 +12% 利息，收获 +5', apply: p => { p.interest += 0.12; p.harvestFlat += 5; } },

  // --- T3 史诗装备 ---
  { id: 'bandana',      name: '穿甲头巾', icon: '🧣', cost: 40, tier: 3, desc: '所有远程子弹穿透 +1，全体伤害 +10%',             apply: p => { p.pierceBonus += 1; p.dmgMul += 0.10; } },
  { id: 'prism',        name: '跳弹棱镜', icon: '🔷', cost: 41, tier: 3, desc: '所有远程子弹弹射次数 +1，攻击范围 +40',           apply: p => { p.bounceBonus += 1; p.rangeBonus += 40; } },
  { id: 'tentacle',     name: '暴击触手', icon: '🦑', cost: 41, tier: 3, desc: '暴击率 +10%；攻击暴击时 22% 概率直接回复 1 生命', apply: p => { p.crit += 0.10; p.critHeal += 0.22; } },
  { id: 'sniper_cloak', name: '鹰眼披风', icon: '🦅', cost: 42, tier: 3, desc: '攻击范围 +90，暴击 +8%；每 15 点范围额外转化 +1%全伤', apply: p => { p.rangeBonus += 90; p.crit += 0.08; p.rangeToDmg = true; } },
  { id: 'tesla',        name: '特斯拉线圈', icon: '⚡', cost: 44, tier: 3, desc: '每 1.7 秒自动释放连锁电弧劈向周围怪物',         apply: p => { p.teslaCount += 1; } },
  { id: 'warhead',      name: '高爆弹头', icon: '🧨', cost: 43, tier: 3, desc: '攻击 22% 概率引发爆破，爆炸范围与伤害 +20%',      apply: p => { p.blastChance += 0.22; p.explosionScale += 0.20; } },
  { id: 'berserk',      name: '狂战双刃斧', icon: '🩸', cost: 39, tier: 3, desc: '全体伤害 +26%，攻速 +11%，但护甲 -3',           apply: p => { p.dmgMul += 0.26; p.atkSpd += 0.11; p.armor -= 3; } },

  // --- T4 传说装备 ---
  { id: 'reactor',    name: '聚变反应堆', icon: '☀️', cost: 65, tier: 4, desc: '【传说】全伤 +24%，攻速 +16%，护盾 +14，再生 +2/s', apply: p => { p.dmgMul += 0.24; p.atkSpd += 0.16; p.maxShield += 14; p.shield += 14; if (!p.noRegen) p.regen += 2; } },
  { id: 'anvil',      name: '铁匠神砧',   icon: '⚒️', cost: 66, tier: 4, desc: '【传说】每波进商店自动免费升阶 1 把随机武器！护甲 +4，移速 -5%', apply: p => { p.hasAnvil = true; p.armor += 4; p.spdMul -= 0.05; } },
  { id: 'cornucopia', name: '丰饶圣杯',   icon: '🏺', cost: 62, tier: 4, desc: '【传说】收获 +20，幸运 +12，血包治疗量 +3，拾取范围 +60', apply: p => { p.harvestFlat += 20; p.luck += 12; p.healBonus += 3; p.magnet += 60; } }
];

const UPGRADES = [
  { name: '泰坦体魄', icon: '❤️', desc: '最大生命 +7',                     apply: p => { p.maxHp += 7; p.hp += 7; } },
  { name: '活性再生', icon: '🌿', desc: '每秒生命再生 +1.5',               apply: p => { if (!p.noRegen) p.regen += 1.5; else p.lifesteal += 0.04; } },
  { name: '高爆火药', icon: '💪', desc: '全体伤害 +14%',                   apply: p => { p.dmgMul += 0.14; } },
  { name: '极速扳机', icon: '⚡', desc: '攻击速度 +11%',                   apply: p => { p.atkSpd += 0.11; } },
  { name: '鹰眼扩距', icon: '📏', desc: '攻击范围 +50，暴击率 +4%',         apply: p => { p.rangeBonus += 50; p.crit += 0.04; } },
  { name: '钢铁甲壳', icon: '🪨', desc: '护甲 +3（稳定减伤）',             apply: p => { p.armor += 3; } },
  { name: '氮气推进', icon: '👟', desc: '移动速度 +7%',                    apply: p => { p.spdMul += 0.07; } },
  { name: '弱点洞悉', icon: '🎯', desc: '暴击率 +8%',                      apply: p => { p.crit += 0.08; } },
  { name: '暗影闪避', icon: '💨', desc: '闪避率 +5%（上限80%）',           apply: p => { p.dodge = Math.min(p.dodgeCap, p.dodge + 0.05); } },
  { name: '元素过载', icon: '🔥', desc: '元素与爆炸伤害 +18%，暴击 +4%',   apply: p => { p.elemBonus += 0.18; p.crit += 0.04; } },
  { name: '丰收幸运', icon: '🍀', desc: '收获 +8（波末发钻且成长），幸运 +6', apply: p => { p.harvestFlat += 8; p.luck += 6; } },
  { name: '引力晶核', icon: '🧲', desc: '拾取范围 +60，晶石爆率 +10%',     apply: p => { p.magnet += 60; p.harvest += 0.10; } }
];
