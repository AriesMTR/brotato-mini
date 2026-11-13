// ============================================================================
// 🗼 《烬塔残响：第999次救赎》四大核心层域战场配置（100% 对应设定集原画底图与环境音景）
// ============================================================================
const SCENES = [
  {
    id: 'foundry', icon: '🌧️', name: '一层·雨夜长桥', subTitle: 'LAYER I · CRIMSON RAIN BRIDGE',
    vistaImg: 'assets/spire/scene_1_vista.jpg', arenaImg: 'assets/spire/scene_1_arena.jpg', propKey: 'prop_s1_lantern',
    bossHint: '守层主宰：绯红断刃剑姬 · 烬羽',
    exclMob: 'magma_imp', exclMobName: '🏮 断魂赤纸伞妖',
    terrainSummary: '🔥 专属地形：余烬残火裂池（引怪灼烧） · 可破坏物：青苔石灯笼',
    eventId: 'geysers', eventIcon: '🏮', eventName: '孤桥魂灯喷涌',
    eventDesc: '第 3 波起概率出现：长桥地脉余烬定时喷发绯红火柱，引燃圈内守塔傀儡与贪刀目标（配乐：凄雨残响钢琴）',
    voidBg: '#080c14', centerCol: '#1b2636', midCol: '#141d2a', edgeCol: '#0d141e',
    patchDark: 'rgba(8, 13, 22, 0.24)', patchLight: 'rgba(225, 29, 72, 0.10)',
    gridCol: 'rgba(229, 184, 105, 0.032)', wallMain: '#7c2d3e', wallDark: '#090d16', rivetCol: '#f6d379',
    pebble1: '#334155', pebble2: '#0f172a', accent1: '#fb7185', accent2: '#f6d379'
  },
  {
    id: 'glacier', icon: '❄️', name: '二层·永冻冰窟', subTitle: 'LAYER II · FROZEN CROWN CAVERN',
    vistaImg: 'assets/spire/scene_2_vista.jpg', arenaImg: 'assets/spire/scene_2_arena.jpg', propKey: 'prop_s2_crystal',
    bossHint: '守层主宰：永冻星使 · 艾丝特莉亚',
    exclMob: 'frost_wisp', exclMobName: '❄️ 眠冬冰冠亡灵',
    terrainSummary: '🧊 专属地形：碎冕多棱寒冰镜（+28%疾滑） · 可破坏物：极寒冰晶簇',
    eventId: 'blizzard', eventIcon: '🌨️', eventName: '碎冕寒霜脉冲',
    eventDesc: '第 3 波起概率出现：艾丝特莉亚的极寒叹息席卷冰窟，冻结减速部分机关并凝结冰刺预警圈（配乐：寒风八音盒圆舞曲）',
    voidBg: '#061019', centerCol: '#193547', midCol: '#122736', edgeCol: '#0b1924',
    patchDark: 'rgba(7, 20, 32, 0.24)', patchLight: 'rgba(114, 239, 221, 0.12)',
    gridCol: 'rgba(165, 243, 252, 0.036)', wallMain: '#2d6a87', wallDark: '#08131d', rivetCol: '#72efdd',
    pebble1: '#4882a3', pebble2: '#0d1f2d', accent1: '#38bdf8', accent2: '#e0fbfc'
  },
  {
    id: 'wasteland', icon: '🕰️', name: '三层·倒悬钟楼', subTitle: 'LAYER III · INVERTED CLOCKWORK SPIRE',
    vistaImg: 'assets/spire/scene_3_vista.jpg', arenaImg: 'assets/spire/scene_3_arena.jpg', propKey: 'prop_s3_pillar',
    bossHint: '守层主宰：紫电弦月人偶 · 伽蓝',
    exclMob: 'rad_scorpion', exclMobName: '⚙️ 逆转发条猎蝎',
    terrainSummary: '🌀 专属地形：双生星晷裂隙门（A ↔ B 跃迁） · 可破坏物：黄铜齿轮断柱',
    eventId: 'rad_meteor', eventIcon: '⚡', eventName: '星晷紫电坠星',
    eventDesc: '第 3 波起概率出现：倒悬钟楼坠落紫电星晷碎块，无差别轰击范围目标并迸出额外封魂晶石（配乐：钟摆羽管键琴）',
    voidBg: '#090913', centerCol: '#242038', midCol: '#1b182b', edgeCol: '#110f1d',
    patchDark: 'rgba(12, 10, 24, 0.24)', patchLight: 'rgba(168, 85, 247, 0.12)',
    gridCol: 'rgba(229, 184, 105, 0.035)', wallMain: '#8a6d3b', wallDark: '#0e0c1a', rivetCol: '#f6d379',
    pebble1: '#463f66', pebble2: '#161326', accent1: '#c084fc', accent2: '#f6d379'
  },
  {
    id: 'desert', icon: '🌑', name: '终层·日蚀镜界', subTitle: 'FINAL LAYER · ECLIPSE MIRROR SANCTUM',
    vistaImg: 'assets/spire/scene_4_vista.jpg', arenaImg: 'assets/spire/scene_4_arena.jpg', propKey: 'prop_s4_monolith',
    bossHint: '终幕真我：第999号 · 日蚀圣女',
    exclMob: 'sand_worm', exclMobName: '🕯️ 蚀影潜渊骨蛇',
    terrainSummary: '🕳️ 专属地形：黑曜镜界断层裂谷（隔渊掩体） · 可破坏物：黑曜裂纹方碑',
    eventId: 'sandstorm', eventIcon: '🌑', eventName: '黑日引力潮汐',
    eventDesc: '第 3 波起概率出现：黑水圣所掀起日蚀引力暗潮，期间角色移速 +14%，并催生黑曜封魂方碑（配乐：黑水圣咏大提琴）',
    voidBg: '#06070d', centerCol: '#1a1c2b', midCol: '#121420', edgeCol: '#0a0c14',
    patchDark: 'rgba(5, 6, 12, 0.30)', patchLight: 'rgba(229, 184, 105, 0.11)',
    gridCol: 'rgba(246, 211, 121, 0.034)', wallMain: '#9a7b3e', wallDark: '#080910', rivetCol: '#fde68a',
    pebble1: '#3b3e54', pebble2: '#10121c', accent1: '#f59e0b', accent2: '#fef08a'
  }
];

const TERRAIN_CODEX = [
  {
    id: 'lava', icon: '🔥', name: '余烬残火裂池', badge: '一层·雨夜长桥专属', scenes: '🌧️ 一层·雨夜长桥（标志机关）',
    desc: '烬羽九百九十八次挥剑残留在长桥石板上的不灭余烬池。<b>守塔傀儡踏入会持续挂上高频灼烧并减速 -18%</b>（可绕着火池边缘引怪触发融毁/超载！）；角色持续踩入超过 0.35 秒也会受灼伤（苍翠风翼可免疫）。'
  },
  {
    id: 'ice_sheet', icon: '🧊', name: '碎冕多棱寒冰镜', badge: '二层·永冻冰窟专属', scenes: '❄️ 二层·永冻冰窟（标志机关）',
    desc: '艾丝特莉亚冰封王城时凝结的天然多面体寒冰镜湖。<b>角色踏上冰镜立即获得 +28% 疾滑移速加成</b>，而守塔怪物在冰面上打滑移速降低 -15%，身法拉扯极其飘逸！'
  },
  {
    id: 'portal', icon: '🌀', name: '双生星晷裂隙门', badge: '三层·倒悬钟楼专属', scenes: '🕰️ 三层·倒悬钟楼（标志机关）',
    desc: '伽蓝以逆转发条撕开的空间星晷裂隙（<b>A ↔ B 双向连通</b>，浮空紫电棱晶环绕）。踏入就绪的裂隙门可<b>瞬间跃迁至另一端</b>，赋予<b>短暂无敌并在落点震退杀伤周遭傀儡</b>（共享 4.5 秒充能冷却）！'
  },
  {
    id: 'chasm', icon: '🕳️', name: '黑曜镜界大裂谷', badge: '终层·日蚀镜界专属', scenes: '🌑 终层·日蚀镜界（标志机关）',
    desc: '横亘黑水镜界的折线锯齿黑曜石深渊。<b>阻挡角色与地面怪物通行</b>（沿断崖自动顺滑绕行，绝不卡位），但<b>所有远程魂弹、圣枪光束与爆破均可直接飞越裂谷</b>，是隔渊风筝的绝佳掩体！'
  }
];
let selectedScene = 'random', curScene = SCENES[0], sceneSeed = 1024, bakedSceneKey = '';
