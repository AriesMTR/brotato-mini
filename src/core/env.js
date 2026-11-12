// 核心画布环境、DPR 像素比与全局品质常量
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rad = Math.min(typeof r === 'number' ? r : 4, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}
const cv = document.getElementById('cv'), ctx = cv.getContext('2d', { alpha: false });
let viewW = window.innerWidth, viewH = window.innerHeight, dpr = 1, camZoom = 1.08, userZoomed = false;
let isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
let bootReady = false;
const APP_VERSION = 'v1.3.0';
const APP_BUILD_DATE = '2026-11-12';

// 游戏内置版本更新日志数据（供开局主界面「📜 更新日志」弹窗展示）
const CHANGELOG_HISTORY = [
  {
    ver: 'v1.3.0', date: '2026-11-12', tag: '当前版本 · 异形地形与全流派军械',
    title: '🗺️ 一图一异形地形重塑、32武器/68道具全流派均衡扩充与第5波异常修复',
    items: [
      '🗺️ 一图一专属异形地形：精简每张地图仅保留 1 处标志性生态地形，彻底告别规则圆形，重绘多瓣玄武熔岩火口、曲岸蘑菇毒泥沼、多棱碎晶寒霜冰镜、锯齿折线大裂谷与双生菱晶虚空裂隙门。',
      '⚔️ 全流派武器与装备均衡扩充：扩充至 32 把武器（原始5/精准6/枪械5/重型5/元素6/工程5，六大流派全面均衡）与 68 件被动装备、16 项基因强化，补齐工程地雷/浮游激光塔、护甲反伤盾击、弹跳榴弹、近战剑气波与鲜血新星等体系。',
      '🛠️ 修复线上第 5 波精英统领刷新偶发 MINI_BOSS_DEFS 未定义异常，并为全模块样式与脚本加入版本号防旧缓存机制。'
    ]
  },
  {
    ver: 'v1.2.0', date: '2026-11-12', tag: '神话觉醒',
    title: '👑 首领全屏登场立绘、隐藏二阶段神话觉醒、暴伤与冰火毒三系元素、怪物重塑',
    items: [
      '🎬 首领全屏定格立绘动画：奇遇祭坛召唤首领、第 12 波主宰降临与二阶段觉醒时触发全屏静止切入特写与专属精细立绘！',
      '👑 首领全面强化 & 远近战公平博弈：新增改变地形（倾泻岩浆/凝结冰湖/喷涌毒沼/撕裂裂谷）、召唤专属护卫、外环轰炸（贴身内圈安全区）与技能后【破绽暴露】窗口；近战武器对首领自带 +22% 破甲增伤与贴身减伤！',
      '⚡ 极低概率【隐藏二阶段·真红神话觉醒】：首领初死时有小概率逆天觉醒二阶段，立即补充 +60 秒时间、播放隐藏神话动画，击败必爆【传说神装秘宝舱】与永久神话赐福！',
      '🔥❄️☠️ 暴击伤害词条 + 灼烧/冰冻/剧毒三系元素：扩充至 52 件被动装备！新增暴击伤害成长、冰冻定身碎冰暴伤加成、剧毒叠层腐蚀易伤与亡语传染。',
      '👾 异虫造型与招式差异化重塑：重绘多类异虫剪影与元素受击特效，赋予甲虫扑击、螳螂闪步双斩、巨兽蓄力震地、飞盘环绕走位等鲜明AI。',
      '📜 主界面新增实时版本号铭牌与「更新日志」查阅面板。'
    ]
  },
  {
    ver: 'v1.1.4', date: '2026-11-12', tag: '地形与播报',
    title: '🌋 五大生态交互地形、双生虚空传送门与持久事件横幅',
    items: [
      '🗺️ 新增熔岩火池、剧毒泥沼、断层深渊裂谷、极滑寒霜冰面与 A↔B 双生虚空传送门，收录入战场奇遇图鉴。',
      '📢 头顶关键提示延长至 1.85~2.6 秒且防弹幕顶替，新增顶部 3~4 秒持久战术事件播报横幅。'
    ]
  },
  {
    ver: 'v1.1.3', date: '2026-11-12', tag: '视觉舒适度',
    title: '🎥 移除攻击与爆炸地图抖动，仅保留受击轻柔微震',
    items: [
      '🎯 移除武器轰炸、重锤震地与首领技能的镜头晃动，仅在角色真实扣血时保留短促微震反馈。'
    ]
  },
  {
    ver: 'v1.1.2', date: '2026-11-12', tag: '开荒平滑',
    title: '🪲 前期怪量平滑与远程怪刷出上限严控',
    items: [
      '⚖️ 重构独立刷怪权重表，大幅降低前期远程怪占比并设同屏远程怪上限，平滑第 1~4 波开荒曲线。'
    ]
  },
  {
    ver: 'v1.1.1', date: '2026-11-12', tag: '战利品重构',
    title: '🎁 二选一战术补给舱、T4 传说爆率封顶、72% 移速保底与版本化日志',
    items: [
      '🎁 战利品箱升级为二选一战术补给舱（防重复道具 / 空投合成武器 / 战术补给核），严格封顶 T4 传说爆率与唯一持有上限。',
      '👟 新增 72% 移速硬保底与悬浮飞翼免疫减速，诊断日志全面附带日期与代码版本。'
    ]
  },
  {
    ver: 'v1.1.0', date: '2026-11-12', tag: '架构重构',
    title: '🏗️ 模块化工程架构、PWA 离线支持与全息图鉴百科',
    items: [
      '📦 拆分为 16 个高内聚模块并提供单文件离线版同步构建，内置武器/道具/角色/怪物/奇遇全图鉴百科与移动端单屏适配。'
    ]
  }
];
const FLOOR_PAD = 160;
const WORLD = { w: 2200, h: 1500, pad: 90 };
let curFloorScale = 0.8;
const TIER_COLORS = ['', '#e2deec', '#4cc9f0', '#c77dff', '#ff4d6d'];
const TIER_GLOW   = ['', 'rgba(255,255,255,0)', 'rgba(76,201,240,0.45)', 'rgba(199,125,255,0.55)', 'rgba(255,77,109,0.65)'];
const TIER_NAMES  = ['', '普通', '精良', '史诗', '传说'];
