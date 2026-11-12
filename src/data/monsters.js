// ============================================================================
// 👑 4 大随机终局主宰 Boss、3 大精英先锋统领 & 3 大地图奇遇召唤首领定义
// ============================================================================
const BOSS_DEFS = {
  butcher: {
    id: 'butcher', icon: '👑', name: '深渊屠夫虫王', color: '#e63946', spd: 90,
    desc: '深渊母巢暴君：锁定红线狂暴冲锋迸射环形弹幕，周期召唤飞蝇虫群与天基陨石轰击。'
  },
  frost_queen: {
    id: 'frost_queen', icon: '❄️', name: '极寒霜晶女皇', color: '#00bbf9', spd: 84,
    desc: '冰封王座主宰：绽放螺旋霜星寒冰棱弹（命中附带减速），并在玩家四周凝结连环寒冰尖刺阵。'
  },
  mech_colossus: {
    id: 'mech_colossus', icon: '⚙️', name: '熔核机械巨像', color: '#f77f00', spd: 78,
    desc: '重装泰坦兵器：双肩火神炮连续点射高速烈焰弹链，搭配地毯式高爆迫击轰炸与震地冲击波。'
  },
  void_weaver: {
    id: 'void_weaver', icon: '👁️', name: '虚空织网主宰', color: '#9d4edd', spd: 86,
    desc: '异次元古神之眼：施展虚空折跃瞬移突袭，释放十字星环秘法弹幕并召唤虚空眷属助战。'
  }
};

const MINI_BOSS_DEFS = {
  vanguard: {
    id: 'vanguard', icon: '⚔️', name: '狂厄裂地统领', color: '#f72585', spd: 86,
    desc: '重甲先锋统领：擅长锁定蛮力冲锋震散弹幕，并召唤定点陨石封锁走位。'
  },
  pyro_lord: {
    id: 'pyro_lord', icon: '🔥', name: '炽焰重炮统领', color: '#fb5607', spd: 80,
    desc: '熔火狂热统领：朝前方扇形连射 5 枚烈焰火球，并在脚下引爆延迟火焰新星。'
  },
  shadow_stalker: {
    id: 'shadow_stalker', icon: '⚡', name: '幽影雷刃统领', color: '#7209b7', spd: 96,
    desc: '极速刺客统领：高频残影疾驰突进，瞬发八方电磁飞针环。'
  }
};

// 小概率随机刷新在战场上的 3 种特殊奇遇圣物（踏入法阵充能 1.1s 即可解封召唤隐藏特殊 Boss！）
const SPECIAL_RELICS = [
  {
    id: 'blood_altar', icon: '🩸', name: '绯红血契祭坛', color: '#ff2a55',
    bossId: 'crimson_lord', bossIcon: '🦇', bossName: '猩红鲜血伯爵', bossColor: '#d90429',
    rewardDesc: '击败必爆：💎30 晶石 + 🎁×1 战利品宝箱 + 瞬间回满全部生命！',
    bossDesc: '血族古堡宗主：化作血影高频瞬步斩击，挥洒新月血针弹幕并召唤嗜血蝠群。'
  },
  {
    id: 'golden_idol', icon: '🪙', name: '黄金贪婪神像', color: '#ffd166',
    bossId: 'golden_golem', bossIcon: '🏆', bossName: '黄金晶石巨神', bossColor: '#f59e0b',
    rewardDesc: '受击沿途狂掉晶石！击败必爆：💎48 巨额晶石雨 + 🎁×1 战利品宝箱！',
    bossDesc: '纯金秘宝构装体：身披厚重黄金晶甲，每损失 20% 生命便喷涌满地晶石，重踏释放黄金棱晶环。'
  },
  {
    id: 'void_cube', icon: '🌌', name: '虚空裂隙魔方', color: '#c77dff',
    bossId: 'abyss_devourer', bossIcon: '👾', bossName: '异次元吞噬者', bossColor: '#7209b7',
    rewardDesc: '击败必爆：💎26 晶石 + 🎁×1 战利品宝箱 + 本局永久 +12% 全体伤害赐福！',
    bossDesc: '裂隙深渊异兽：释放双螺旋奇点弹幕与虚空坍缩预警圈，压迫感极强但回报丰厚。'
  }
];

// 全怪物与首领图鉴百科数据库（涵盖 16 类常规异虫、5 大场景专属怪、精英统领、终局主宰与奇遇首领，共 31 项）
const MONSTER_CODEX = [
  // 常规异虫（体型、血量、移速、伤害与攻击表现全面差异化）
  { id: 'chaser',     cat: 'normal', icon: '🪲', name: '追踪紫甲虫',   badge: '常规异虫', wave: '第 1 波起', stats: '❤️标准 · 📏中 · 👟常速 · 💥中', desc: '成群结队朝猎物爬行的基础甲虫，走位拉扯即可稳定收割。' },
  { id: 'swarmer',    cat: 'normal', icon: '🐝', name: '迅捷毒飞蝇',   badge: '常规异虫', wave: '第 1 波末起', stats: '❤️极脆 · 📏微 · 👟极快 · 💥微', desc: '成群结队刷出的超小体型极速飞蝇，单次擦伤较低但数量极密，适合范围或弹射清理。' },
  { id: 'stalker',    cat: 'normal', icon: '🦗', name: '刀锋疾行螳',   badge: '常规异虫', wave: '第 2 波起', stats: '❤️偏脆 · 📏偏小 · 👟高速折线 · 💥中高', desc: '挥舞青色双镰呈 Z 字折线突进的敏捷猎手，贴近时会挥出凌厉镰爪斩光。' },
  { id: 'shooter',    cat: 'normal', icon: '💧', name: '毒液喷射虫',   badge: '常规异虫', wave: '第 2 波起', stats: '❤️偏低 · 📏中 · 👟较慢 · 💥中等', desc: '保持中距离预判发射碧青腐蚀液滴弹，保持横向移动即可轻松规避。' },
  { id: 'charger',    cat: 'normal', icon: '🐗', name: '狂暴冲锋兽',   badge: '常规异虫', wave: '第 3 波起', stats: '❤️较高 · 📏偏大 · 👟蓄力猛冲 · 💥较高', desc: '锁定方向浮现短促预警虚线后直线猛冲，切勿停留在冲锋轴线上。' },
  { id: 'bomber',     cat: 'normal', icon: '💣', name: '自爆孢子怪',   badge: '常规异虫', wave: '第 3 波起', stats: '❤️偏脆 · 📏中 · 👟较快 · 💥高爆', desc: '贴近或被击杀时点燃 1.25 秒引信并亮起范围圈，倒计时结束剧烈自爆（也能炸伤周围异虫！）。' },
  { id: 'sniper_bug', cat: 'normal', icon: '🎯', name: '晶刺狙击虫',   badge: '常规异虫', wave: '第 3 波起', stats: '❤️偏脆 · 📏偏小 · 👟远距驻射 · 💥高伤', desc: '在远处架设细红瞄准线短暂蓄力，随后射出一枚高速猩红穿刺骨针，看到瞄准线请及时横移！' },
  { id: 'splitter',   cat: 'normal', icon: '🟢', name: '分裂软泥怪',   badge: '常规异虫', wave: '第 4 波起', stats: '❤️较高 · 📏大 · 👟偏慢 · 💥中低', desc: '体型肥硕的大型史莱姆，阵亡瞬间分裂为 3 只超高速迷你小软泥怪扑向猎物。' },
  { id: 'spinner',    cat: 'normal', icon: '⚙️', name: '旋刃飞盘虫',   badge: '常规异虫', wave: '第 4 波起', stats: '❤️中等 · 📏中大 · 👟常速 · 💥中等', desc: '背部搭载锯齿甲盘，周期投掷一枚中速旋转的十字金刃飞盘封锁走位。' },
  { id: 'shielder',   cat: 'normal', icon: '🛡️', name: '铁甲圣甲虫',   badge: '常规异虫', wave: '第 4 波起', stats: '❤️高 · 📏大 · 👟慢速 · 💥中高', desc: '正面张开能量弧盾减免 45% 伤害；火焰、激光、电浆与绕侧近战可无视护盾。' },
  { id: 'mortar',     cat: 'normal', icon: '☄️', name: '酸液迫击虫',   badge: '常规异虫', wave: '第 4 波起', stats: '❤️中等 · 📏中大 · 👟慢速 · 💥高伤', desc: '远程抛射高危地面红圈轰炸，看到脚下红圈及时迈出即可无伤。' },
  { id: 'brute',      cat: 'normal', icon: '👹', name: '重甲独眼巨兽', badge: '常规异虫', wave: '第 5 波起', stats: '❤️极高 · 📏巨型 · 👟沉重 · 💥重击', desc: '体型魁梧、强抗击退的巨型肉盾，贴近玩家时会周期重踏地面震出暗紫震波。' },
  { id: 'summoner',   cat: 'normal', icon: '🔮', name: '虚空召唤师',   badge: '常规异虫', wave: '第 5 波起', stats: '❤️中等 · 📏中 · 👟偏慢 · 💥偏低', desc: '躲在后排周期吟唱法阵源源不断召唤毒飞蝇群，建议优先突进斩首。' },
  { id: 'healer',     cat: 'normal', icon: '💚', name: '共生医疗虫',   badge: '常规异虫', wave: '第 6 波起', stats: '❤️中等 · 📏中 · 👟偏慢 · 💥低', desc: '每 2.8 秒释放翠绿脉冲为周围异虫恢复生命，混战中务必优先击杀。' },
  { id: 'juggernaut', cat: 'normal', icon: '🗿', name: '黑曜重装泰坦', badge: '重装巨兽', wave: '第 6 波起', stats: '❤️超巨额 · 📏超巨型 · 👟极慢 · 💥毁灭', desc: '身披黑曜石重甲的移动堡垒，移速极慢但单次碰撞伤害极高且几乎免疫击退，需集中火力融化。' },
  { id: 'elite_mod',  cat: 'normal', icon: '✨', name: '狂化金色精英', badge: '精英词缀', wave: '第 3 波起概率附着', stats: '❤️2.45倍 · 💎双倍 + 小概率掉箱', desc: '周身环绕金光的高危变异个体，死亡向四周迸射 6 枚慢速亡语毒刺弹，有概率掉落战利品箱。' },

  // 5 大场景专属怪物（第 3 波起概率随对应生态逐步出没）
  { id: 'rad_scorpion', cat: 'scene', icon: '🦂', name: '辐射裂变蝎', badge: '🌑 紫晶废土专属', wave: '第 3 波起概率出没', stats: '❤️较高 · 📏偏大 · 👟常速 · 💥中高', desc: '盘踞在紫晶矿脉的变异巨蝎，尾针蓄力向玩家扇形齐射 3 枚荧光辐射液滴弹。' },
  { id: 'sand_worm',    cat: 'scene', icon: '🐍', name: '沙暴钻地虫', badge: '🏜️ 赤砂荒原专属', wave: '第 3 波起概率出没', stats: '❤️中等 · 📏中 · 👟疾行突刺 · 💥中高', desc: '潜行于滚烫赤沙的节肢沙虫，周期掀起沙尘暴短距加速突袭猎物。' },
  { id: 'frost_wisp',   cat: 'scene', icon: '🧊', name: '霜晶冰魄灵', badge: '❄️ 极寒冰窟专属', wave: '第 3 波起概率出没', stats: '❤️偏低 · 📏偏小 · 👟浮空 · 💥中等', desc: '极寒冰窟凝结的元素灵体，发射菱形寒冰棱晶，命中未闪避时短暂降低角色 18% 移速。' },
  { id: 'magma_imp',    cat: 'scene', icon: '🔥', name: '熔岩火精',   badge: '⚙️ 机械熔炉专属', wave: '第 3 波起概率出没', stats: '❤️偏脆 · 📏偏小 · 👟高速 · 💥中高', desc: '熔炉核心溢出的狂躁火灵，被击碎时在原地留下一团 1.15 秒后引爆的熔岩火池。' },
  { id: 'spore_mother', cat: 'scene', icon: '🍄', name: '剧毒孢子母体', badge: '🍄 荧光菌丛专属', wave: '第 3 波起概率出没', stats: '❤️高 · 📏大 · 👟慢速 · 💥中高', desc: '膨大的荧光母菌，远程抛投剧毒孢子轰炸圈，阵亡时还会迸裂出 2 只小软泥怪。' },

  // 3 大精英先锋 & 4 大随机终局主宰 Boss
  { id: 'mb_vanguard', cat: 'boss', icon: '⚔️', name: '狂厄裂地统领', badge: '精英先锋统领', wave: '第 5 / 9 波随机刷新', stats: '❤️高额首领级 · 🎁必掉宝箱', desc: MINI_BOSS_DEFS.vanguard.desc },
  { id: 'mb_pyro',     cat: 'boss', icon: '🔥', name: '炽焰重炮统领', badge: '精英先锋统领', wave: '第 5 / 9 波随机刷新', stats: '❤️高额首领级 · 🎁必掉宝箱', desc: MINI_BOSS_DEFS.pyro_lord.desc },
  { id: 'mb_shadow',   cat: 'boss', icon: '⚡', name: '幽影雷刃统领', badge: '精英先锋统领', wave: '第 5 / 9 波随机刷新', stats: '❤️高额首领级 · 🎁必掉宝箱', desc: MINI_BOSS_DEFS.shadow_stalker.desc },
  { id: 'b_butcher',   cat: 'boss', icon: '👑', name: '深渊屠夫虫王', badge: '终局主宰 Boss', wave: '第 12 波 / 无尽随机降临', stats: '❤️巨额主宰级 · 💎45 + 🎁宝箱', desc: BOSS_DEFS.butcher.desc },
  { id: 'b_frost',     cat: 'boss', icon: '❄️', name: '极寒霜晶女皇', badge: '终局主宰 Boss', wave: '第 12 波 / 无尽随机降临', stats: '❤️巨额主宰级 · 💎45 + 🎁宝箱', desc: BOSS_DEFS.frost_queen.desc },
  { id: 'b_mech',      cat: 'boss', icon: '⚙️', name: '熔核机械巨像', badge: '终局主宰 Boss', wave: '第 12 波 / 无尽随机降临', stats: '❤️巨额主宰级 · 💎45 + 🎁宝箱', desc: BOSS_DEFS.mech_colossus.desc },
  { id: 'b_void',      cat: 'boss', icon: '👁️', name: '虚空织网主宰', badge: '终局主宰 Boss', wave: '第 12 波 / 无尽随机降临', stats: '❤️巨额主宰级 · 💎45 + 🎁宝箱', desc: BOSS_DEFS.void_weaver.desc },

  // 3 大奇遇隐藏召唤 Boss
  { id: 'sb_crimson',  cat: 'special', icon: '🦇', name: '猩红鲜血伯爵', badge: '🩸 奇遇召唤首领', wave: '第 3 波起 · 激活绯红血契祭坛', stats: '🎁×1 宝箱 + 💎30 + 满血恢复', desc: `${SPECIAL_RELICS[0].bossDesc}<br><b>${SPECIAL_RELICS[0].rewardDesc}</b>` },
  { id: 'sb_golden',   cat: 'special', icon: '🏆', name: '黄金晶石巨神', badge: '🪙 奇遇召唤首领', wave: '第 3 波起 · 激活黄金贪婪神像', stats: '💎48+ 暴富晶石雨 + 🎁×1 宝箱', desc: `${SPECIAL_RELICS[1].bossDesc}<br><b>${SPECIAL_RELICS[1].rewardDesc}</b>` },
  { id: 'sb_abyss',    cat: 'special', icon: '👾', name: '异次元吞噬者', badge: '🌌 奇遇召唤首领', wave: '第 3 波起 · 激活虚空裂隙魔方', stats: '🎁×1 宝箱 + 💎26 + 永久+12%全伤', desc: `${SPECIAL_RELICS[2].bossDesc}<br><b>${SPECIAL_RELICS[2].rewardDesc}</b>` }
];
