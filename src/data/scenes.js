// ============================================================================
// 🗺️ 5 大异星生态战场（随机轮换或手动指定，全部预烘焙至离屏贴图，0 实时渲染负担）
// ============================================================================
const SCENES = [
  {
    id: 'wasteland', icon: '🌑', name: '紫晶废土',
    exclMob: 'rad_scorpion', exclMobName: '🦂 辐射裂变蝎',
    eventId: 'rad_meteor', eventIcon: '☄️', eventName: '紫晶流星雨',
    eventDesc: '第 3 波起概率出现：间歇坠落紫晶辐射流星（无差别炸伤范围目标，并在坑内爆出额外晶石！）',
    voidBg: '#0e0b14', centerCol: '#383047', midCol: '#2b2538', edgeCol: '#201b2a',
    patchDark: 'rgba(18, 14, 26, 0.25)', patchLight: 'rgba(86, 72, 112, 0.16)',
    gridCol: 'rgba(216, 198, 255, 0.030)', wallMain: '#584b6e', wallDark: '#191423', rivetCol: '#9d8ec4',
    pebble1: '#4d4361', pebble2: '#1c1726', accent1: '#9d4edd', accent2: '#e0aaff'
  },
  {
    id: 'desert', icon: '🏜️', name: '赤砂荒原',
    exclMob: 'sand_worm', exclMobName: '🐍 沙暴钻地虫',
    eventId: 'sandstorm', eventIcon: '🌪️', eventName: '赤砂顺风热浪',
    eventDesc: '第 3 波起概率出现：周期刮起狂沙顺风（风场期间角色移速 +14%，并额外催生荒漠晶树）',
    voidBg: '#160f0a', centerCol: '#61432e', midCol: '#4d3423', edgeCol: '#382518',
    patchDark: 'rgba(38, 21, 11, 0.24)', patchLight: 'rgba(148, 102, 62, 0.17)',
    gridCol: 'rgba(255, 219, 168, 0.032)', wallMain: '#8c5a3b', wallDark: '#24150d', rivetCol: '#e9c46a',
    pebble1: '#7f5539', pebble2: '#2e1c12', accent1: '#f4a261', accent2: '#f3e5ab'
  },
  {
    id: 'glacier', icon: '❄️', name: '极寒冰窟',
    exclMob: 'frost_wisp', exclMobName: '🧊 霜晶冰魄灵',
    eventId: 'blizzard', eventIcon: '🌨️', eventName: '极光寒霜脉冲',
    eventDesc: '第 3 波起概率出现：极光寒潮冻结全场部分怪物减速，同时在地面凝结寒冰尖刺预警圈',
    voidBg: '#08121a', centerCol: '#26495c', midCol: '#1d394a', edgeCol: '#142936',
    patchDark: 'rgba(9, 24, 36, 0.25)', patchLight: 'rgba(114, 202, 232, 0.15)',
    gridCol: 'rgba(165, 243, 252, 0.042)', wallMain: '#467b99', wallDark: '#0b1b26', rivetCol: '#90e0ef',
    pebble1: '#5c95b5', pebble2: '#102533', accent1: '#38bdf8', accent2: '#e0fbfc'
  },
  {
    id: 'foundry', icon: '⚙️', name: '机械熔炉',
    exclMob: 'magma_imp', exclMobName: '🔥 熔岩火精',
    eventId: 'geysers', eventIcon: '🌋', eventName: '熔炉地热喷涌',
    eventDesc: '第 3 波起概率出现：地底熔铁泄压阀定时喷发烈焰火柱，对圈内怪物与贪刀玩家同时造成高额灼伤',
    voidBg: '#111013', centerCol: '#383a45', midCol: '#2b2d36', edgeCol: '#1f2027',
    patchDark: 'rgba(14, 14, 18, 0.28)', patchLight: 'rgba(92, 96, 114, 0.16)',
    gridCol: 'rgba(251, 191, 36, 0.042)', wallMain: '#6e5a47', wallDark: '#16161b', rivetCol: '#fbbf24',
    pebble1: '#525666', pebble2: '#181920', accent1: '#f97316', accent2: '#fde047'
  },
  {
    id: 'fungal', icon: '🍄', name: '荧光菌丛',
    exclMob: 'spore_mother', exclMobName: '🍄 剧毒孢子母体',
    eventId: 'spore_tide', eventIcon: '✨', eventName: '灵能治愈孢潮',
    eventDesc: '第 3 波起概率出现：地面绽放翠绿荧光灵能法阵，踏入阵内每秒回复生命并提升 +14% 攻速',
    voidBg: '#09130f', centerCol: '#213f33', midCol: '#193128', edgeCol: '#12241d',
    patchDark: 'rgba(8, 22, 16, 0.28)', patchLight: 'rgba(74, 158, 118, 0.16)',
    gridCol: 'rgba(110, 231, 183, 0.035)', wallMain: '#386652', wallDark: '#0c1a14', rivetCol: '#6ee7b7',
    pebble1: '#2f5947', pebble2: '#0e1f18', accent1: '#10b981', accent2: '#72efdd'
  }
];
let selectedScene = 'random', curScene = SCENES[0], sceneSeed = 1024, bakedSceneKey = '';
