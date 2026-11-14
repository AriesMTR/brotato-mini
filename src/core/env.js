// 核心画布环境、DPR 像素比与全局品质常量（v2.1.7 立绘展示缩短至4秒 & 近战挥砍斩弹几率下调50%）
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
let viewW = window.innerWidth, viewH = window.innerHeight, dpr = 1, camZoom = 1.06, userZoomed = false;
let isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
let bootReady = false;
let bootIntegrityPassed = false;
const APP_VERSION = 'v2.1.7';
const APP_BUILD_DATE = '2026-11-14';

// 游戏内置版本更新日志数据（供开局主界面「纪元志」弹窗展示）
const CHANGELOG_HISTORY = [
  {
    ver: 'v2.1.7', date: '2026-11-14', tag: '当前版本 · 立绘缩短至4秒 · 近战砍弹道几率-50% · 黄色小箭头怪-20%且弹道伤/体+10%',
    title: '🎬 首领立绘展示缩短（5s → 4s） + ⚔️ 近战挥击斩弹几率下调 50% + 🏹 后期黄色小箭头怪数目 -20%（对应弹道伤害与大小 +10%）',
    items: [
      '🎬 首领破框立绘展示时长紧凑化（BOSS_CUTSCENE_SHOW_SEC: 5.0s → 4.0s）：将一阶段登场特写与二阶段神话觉醒换装立绘横幅的停留展示时间由 5 秒缩短为 4 秒（配 0.85 秒丝滑上浮消逝），减少对高速战斗心流的打断！',
      '⚔️ 近战砍弹道概率整体削减 50%：将 T4 唯一饰品【断刃狐月鞘】斩弹概率由 35% 下调至 17.5%、T5 神话近战武器觉醒斩弹概率由 40% 下调至 20%，两者叠加软上限同步由 60% 下调至 30%！',
      '🏹 后期黄色小箭头弹道调优：将发射黄色小箭头的【蚀影潜渊骨蛇】与【狂化精英词缀怪】刷出数目统一减少 20%（总刷怪量保持不变），并相应将其黄色箭头弹道的伤害与弹体大小各提升 +10%，降低满屏碎箭杂乱感、提升单发辨识度与博弈感！'
    ]
  },
  {
    ver: 'v2.1.6', date: '2026-11-14', tag: '回合时长30s起逐层+5s至60s封顶 · 旋转十字光束近战友好化 · 白针怪-30%转补近战',
    title: '⏱️ 回合时长 30s 起逐层 +5s（60s 封顶） + ❄️ 首领/统领旋转十字激光与横扫近战友好化 + 🎯 白芯针梭怪减少 30% 并 1:1 补充至近战怪',
    items: [
      '⏱️ 统一全流程回合战斗时长阶梯（getWaveDuration）：第 1 层固定 30 秒开局，之后每攀登 1 层稳定增加 +5 秒（第 1~7 层依次为 30s / 35s / 40s / 45s / 50s / 55s / 60s），自第 7 层起全程封顶最多 60 秒（含首领层与无尽层，提前击败首领保留剩余时间刷晶石，超时未击破转入死战）！',
      '❄️ 冰窟首领与同类旋转十字/横扫招式全面近战友好化：大幅降低霜女皇与凛霜统领双翼/四翼十字冰束旋转角速度（降幅超 54%，近战可轻松在安全象限伴行挥砍），新增冲刺落地 0.55s 冰晶导轨前摇预警、发射口外移留空并令首领在引导十字光炮/喷毒/大招蓄力期间驻足不贴脸；同步放缓毒息转头角速度、炽焰风车射频、魂灯旋转十字棱镜及双刃旋斩节奏，确保近战流派皆可清晰预判与无伤走位闪避！',
      '🎯 白芯细针/冰梭类远程怪（眠冬冰冠亡灵、折光霜晶浮灵、逆转发条猎蝎、寒晶狙击蛛）刷出数量降低 30%，空出权重 1:1 等额补充至常规近战怪（每波刷怪总数 100% 不变），并同步削减约 30% 冰针/骨针/晶针与精英亡语飞针散射密度！'
    ]
  },
  {
    ver: 'v2.1.5', date: '2026-11-14', tag: '单图唯一石砌地形与寒霜5秒冰封 · 首领喷毒与二阶段专属大招 · 冲刺/近战血牛扩编 · 修复误弹设置与异常',
    title: '🧱 单图唯一石砌方砖地形 & ❄️ 寒霜5秒渐冻重做 + 🐍 首领高压喷毒与隐藏二阶段专属奥义 + ⚔️ 冲刺招式/近战血牛差异化扩编 + 🛠️ 修复误弹设置页与崩溃',
    items: [
      '🧱 单图唯一嵌地石砌方砖地形 & ❄️ 寒霜地形 5 秒渐冻重做：重构 5 大正交切角石砌方砖地形块，且每张地图严格只刷出 1 种专属地形元素（绝不多色混杂）；寒霜地形改为玩家累计 5 秒渐进减速（最多减速 20%）直至冰封冻住 1 秒后破冰（离开地形 1 秒后开始消退），小怪仅减速 20% 且不会被冻住！',
      '🐍 首领高压扇形喷毒特效 + 👑 隐藏二阶段专属大招：毒系首领新增高压雾化毒息扫射与飞溅酸珠特效；全首领进入二阶段后额外解锁专属奥义（八方血狱剑牢、绝对零度四极冰柱扫射、时之八芒光轮、回旋锯轮风暴、双龙广角毒息、六芒日冕天柱）！',
      '⚔️ 冲刺预警招式全重绘 + 重装血牛差异化 & 新增 4 类近战魔物（前 10 波肉盾怪 -15% 转为普通小怪，远程怪不变）：定制楔形兽角波+新月挑斩、居合刀线+十字裂斩、双轨冰棱、攻城枕木与沙虫潜地突袭；拉开盾卫/狂暴重锤卫（半血狂化+扇形砸地）/超巨型泰坦像（十字震裂）体型移速与招式差距，新增玄铁斩马卫、凛冬寒枪骑、疾风双刃客、暗月镰影使，全系怪物高清放大（保底 60px）！',
      '🛠️ 修复 Shift+WASD 输入法抢焦点误弹设置页面及首领击破瞬间子弹循环异常；全流程小怪血量降低 20%、第 10 层及以后首领血量降低 20%，并适度微调降低紫/红稀有装备爆率。'
    ]
  },
  {
    ver: 'v2.1.4', date: '2026-11-14', tag: '网页端全链路资源完整性校验门禁 · 防半加载黑屏/报错 · 异常缓存一键重拉',
    title: '🛡️ 网页端全链路资源完整性自检与首屏门禁（SpireBootGate）：彻底根治弱网半加载提前刷出主界面导致的运行 Bug',
    items: [
      '🛡️ 首屏 0ms 防误触门禁幕布：网页端打开瞬间由零依赖内联门禁层接管视口，在全部 20 个 JS 模块、4 张样式表与首屏核心原画（标题背景、主角精灵表、零/青羽立绘、首幕地面贴图）全部校验通过前严格锁定开局入口，彻底杜绝「脚本/贴图还没下完就刷出初始界面点击报错」的问题！',
      '🔍 20 大模块契约 + HTML/JS 跨版本缓存一致性逐项核验：逐一校验环境、日志、生态、贴图总管、视口、声景、32把兵装库、魔物设定、圣典、十六层剧本、演出导演、菜单、存档、刷怪器、战斗结算、帧循环、行商、精灵烘焙与渲染器共 20 项模块符号及 HTML/JS 版本号，缺一不可！',
      '🔄 弱网自动重试与一键清缓存重拉：首屏关键贴图下载抖动时自动附加防缓存参数静默重试 2 次；若遇断网或 CDN 残缺缓存导致脚本/样式缺失，精准列出缺失模块并提供「清理残缺缓存并重拉」一键自愈恢复！'
    ]
  },
  {
    ver: 'v2.1.3', date: '2026-11-13', tag: '首领续刷保收益 · 弹幕与远程异形特效重绘 · 巨型召唤阵与细长/斜向真地形块 · 全怪血量-20%回调、前5层减压及10层后高压',
    title: '🔥 全怪整体血量下调20%与前5层舒适减压 + 第10层后硬核升维 + 巨型Boss召唤阵与细长/斜向多形态地形块 + 远程怪异形特效大重做 + 首领续刷保收益 & T4/T5概率斩弹',
    items: [
      '🔮 奇遇召唤 Boss 法阵翻倍扩容 + 全域随机细长/斜向多形态真地形块（对怪减益减半、主针对玩家）：召唤圣物法阵半径扩至 88（面积扩大 4 倍）；彻底重做战场地形生成引擎——每波在全图九宫侧翼与边角随机铺设 4~7 块【斜向细长裂脉、蜿蜒S/折角沟壑、斜切多边形岩台块、月牙弧带与折弯裂谷】，不再扎堆中心或呈单调圆滩；同时将地形对怪物的伤害与减速严格减半，强化熔岩灼足减速与泥沼深陷腐蚀对玩家走位的压迫感！',
      '🌱 怪物整体血量下调 20% + 前 5 层强度温和减压 + 第 10 层及以后难度全面升维：全局怪物与首领基础血量倍率统一回调 -20%（MONSTER_HP 2.25→1.80，BOSS_HP 6.00→4.80）；针对前 5 层额外下调血量与伤害曲线（0.64x~0.95x）、放缓前 5 层刷怪节奏与精英率并降低第 4 层首领基础血伤；而第 10 层起仍陡峭拉升终局高压（第 16 层达 3.00x 血 / 2.45x 攻，无尽指数攀升）与高密度尸潮！',
      '⚡ 告别重复红圈！远程施法怪与场景轰炸全面升级异形几何特效：魂灯龛改放【旋转紫晶十字裂变棱镜光轨】、发条臼炮改射【可见高抛飞行榴弹 + 八角机械火控准星 + 四向破片】、六翼唤灵师改放【六芒唤灵阵 + 次元裂空斜斩痕】、翠羽祝祷师改放【翡翠十字圣辉脉冲 + 实体翠绿治愈光链】，冰/火/雷/毒预警亦各自拥有独立六棱冰晶、烈阳八芒星、天雷菱印与腐殖花瓣特效！',
      '💰 首领击破续刷小怪保满晶石收益 + 流光弹道重绘 + 近战概率斩弹收敛至 T4 唯一饰品【断刃狐月鞘】(35%) 与 T5 神话近战武器 (40%)！'
    ]
  },
  {
    ver: 'v2.1.2', date: '2026-11-13', tag: '电影演出与硬核死战全面融合 · 原生Retina超清不糊 · 前期难度微降 · 近战基础伤害再加强',
    title: '✨ 电影级全剧情与硬核战斗大融合：锁死原生 Retina 超清地面栏杆不模糊 + 前期 1~5 层难度温和减压 + 近战基础伤害再提升 + 首领纯死战 & 零卡顿架构',
    items: [
      '💎 原生 Retina 超清画质锁死保证（绝不变糊）：解除战场画布过低的像素预算与 0.65x 动态降采样模糊策略，恢复桌面端最高 2.25x、移动端最高 1.75x 原生 Retina 高清光栅与高质量采样，触控笔记本不再误降画质；同时保留菜单/剧情遮挡期停绘后台战场与 60~144Hz 精准帧步进，兼顾极致清晰度与满帧流畅！',
      '🌱 前期开荒难度适度温和下调：下调第 1~5 层怪物血量与攻击力曲线（第 1~4 层降至 0.72x / 0.78x / 0.84x / 0.94x），下调第 4 层主线双阶段首领一阶段基础血量与伤害，放缓前 4 层开场与持续刷怪密度并将狂暴蛮牛/镇狱巨像解锁波次顺延 1 层，前期发育更顺滑，第 14~16 层仍精准回归 2.0x 终局高压！',
      '⚔️ 近战全系基础伤害进一步加强：全部 11 把近战兵装（守誓残杖、镇塔碑石、银月长枪、泣血短刃、白狐裂影爪、绯红断刃太刀、碎星重锤、黑曜棱刺盾、劫火紫电刃、黄金发条扳手、星晷磁暴针）基础伤害再上调约 15%~17%，残杖多持共鸣加成同步提升至每把 +4.8，配合智能分流索敌与斩弹减伤，近战贴身博弈爽感拉满！',
      '🎬 完整融合 v2.1.1 电影级十六层叙事、九张独立横幅原画、手机安全区触控修复，以及 v1.4.1~v1.4.3 远程「先弹射后穿透」、8 类远程小怪差异化弹道、超高辨识度敌弹重绘、首领纯「死战」（无 +60s/+25s 冗余加时）、后期首领 +300% 血量（二阶段 +50% 血 / +30% 攻）与元素/吸血/冲刺零卡顿优化！'
    ]
  },
  {
    ver: 'v2.1.1', date: '2026-11-13', tag: '手机触控与小屏修复',
    title: '掌心里的灯：让阅读与操作更稳',
    items: [
      '小屏和大字号下，剧情文本单独滚动，继续操作保持可见；修复滑动阅读误翻页。',
      '调整手机商店、弹窗和横屏战斗栏，补齐刘海与底部手势区留白。',
      '摇杆与瞬步触点分开处理，旋转屏幕清理旧输入；旋转只调整视野，不移动战场实体。',
      '适配内置浏览器可用高度变化，保留旧存档与现有剧情、战斗性能设置。'
    ]
  },
  {
    ver: 'v2.1.0', date: '2026-11-13', tag: '独立原画与动态分镜',
    title: '灯还温着：把话藏进动作里',
    items: [
      '新增九张独立横幅剧情原画：苏醒、拾灯、雨亭初见、长桥开战与告别、冰翼、钟楼、镜前与破晓。保留的人物造型与旧物线索融入场景。',
      '关键画面不再从四格设计稿裁切放大；旧图册以完整安全画框呈现，保留构图和细节。',
      '剧情加入分情绪运镜、细雨、雪尘、微光与转场，立绘轻入场；回看、隐藏和后台暂停，减动设置可关闭。',
      '润色十六层、四位首领与青羽身份线，通过茶杯、剑穗、怀表和发条表达关系；剧情时序、两阶段战斗与双结局门槛保持一致。'
    ]
  },
  {
    ver: 'v2.0.0', date: '2026-11-13', tag: '电影式演出与叙事界面',
    title: '雨中的第一步：完整苏醒、十六层对白与双结局',
    items: [
      '标题入口采用雨桥与远塔构图，新增本层起点存档、继续登塔和独立演出预览。',
      '六镜苏醒与青羽六段身份线，重写十六层战前、战后对白；前期不提前揭示镜中女声身份。',
      '四位主线首领固定两阶段：第一条生命归零进入二阶，最终战败演出后再结算奖励；玩家败北使用独立重试界面。',
      '对话支持回看、自动、隐藏、仅跳过已读、130%字号、即时显字与减少动态；关键选择必须亲自确认。',
      '战斗性能修正：高刷新率限帧余量保留、精灵缓存复用与遮挡期后台停绘。'
    ]
  },
  {
    ver: 'v1.4.3', date: '2026-11-13', tag: '首领纯死战不加额外时间 · 后期Boss血量+300% & 二阶段+50%血/+30%攻 · 远程怪全差异化弹道 · 血牛&冲刺近战怪强化 · 弹幕超清高亮重绘',
    title: '⚔️ 终局死战与怪物生态大升级：首领纯「死战」不加冗余时间 + 后期首领血量再提 300%（二阶段血量+50%·攻击+30%） + 8 类远程怪差异化轨迹 + 血牛/冲刺近战怪压迫感翻倍 + 敌方弹幕超高辨识度重绘',
    items: [
      '💀 首领改为纯「死战」机制，彻底取消二阶段 +60 秒与召唤首领 +25 秒冗余加时：首领决战层全程显示「死战」且无倒计时干扰，击败首领瞬间即刻结算过关；幕中统领与祭坛首领若常规时间归零仍存活则无缝切入「死战」，一旦斩杀首领立即结束回合，秒杀首领绝不再干等额外时间！',
      '👑 后期首领血量再提升 300%（达 12.0x 终局强度），进入隐藏二阶段生命值再提 50%、攻击力提 30%：中后期首领血量阶梯大幅拉升（第 13~16 层及无尽轮回完整提升 +300% 即旧版 4 倍血量），且触发二阶段觉醒时最大生命值在原一阶段基础上再提高 +50% 并回满、攻击力提高 +30%！',
      '🎯 8 大远程小怪攻击方式深度差异化（兼顾近战流派体验）：彻底告别单一路径直线弹道——霜晶浮灵双轨外弧钳形弹、旋刃陀螺双翼回旋金轮、冰冠亡灵 S 形双螺旋冰戟、发条猎蝎雁形楔阵三叉戟、狙击蛛三层红外锁定重型贯日矛、臼炮双连步进预判轰炸、母巢十字脉冲星雷球、唤灵师 X 形交叉暗月镰；同时提升近战斩弹上限与远程弹幕刀风减伤！',
      '🗿 大幅加强近战「血牛怪」与「冲刺怪」压迫感：泰坦镇狱像、狂暴重锤卫（新增中距肩撞猛冲）、符盾守桥卫（正面盾减伤 55%）、寒枪破阵骑与潜渊骨蛇全面强化！',
      '✨ 敌方弹道清晰度与辨识度质变升级：保留公平擦弹碰撞半径的同时放大全部敌弹视觉尺寸，新增流光彗尾、高对比警示外环、2.8px 深曜黑描边与纯白炽核，重绘细针弹为宽翼【重型流光菱矛弹】！'
    ]
  },
  {
    ver: 'v1.4.2', date: '2026-11-13', tag: '远程严格先弹射后穿透 · 近战智能索敌防漏怪 · 彻底根除后期元素反应/吸血/冲刺/怪死出圈卡顿',
    title: '🚀 战斗逻辑与中后期帧率大革新：远程全系严格「先弹射、后穿透」+ 近战零盲区智能分流索敌 + 彻底根除元素连锁、吸血、冲刺与群怪阵亡卡顿',
    items: [
      '🎯 远程武器严格改为「先弹射、后穿透」：重构全系投射物、瞬发光束（激光/狙击/磁轨炮）、电浆球、剑气波与炮台的命中优先级——只要剩余弹射次数 bounces > 0，命中敌人或晶树时必定优先折射向 410px 内邻近目标且绝不消耗穿透次数；弹射次数全部耗尽后才进入直线穿透结算！',
      '⚔️ 近战武器智能索敌与零盲区刀光校准：消除武器环绕半径盲区，新增多近战武器防鞭尸自动分流机制，补齐匕首/螺丝刀独立前刺走廊判定与真实刀光半径对齐。',
      '🔥 彻底根除元素爆炸反应与「怪死原地出圈」卡顿：移除普通小怪阵亡时的地面血圈残留与重复绿圈堆叠，为聚变炉心、高爆弹头与冰爆星核增加同帧预算与内置冷却保护，根治 O(N²) 连锁爆炸雪崩。',
      '🩸 彻底修复后期「吸血卡顿」与「冲刺卡顿」：清除战斗画布飘字彩色 Emoji，高频吸血飘字改为聚合节流显示，鲜血新星加入 0.36s 冷却，后期百怪同屏依然丝滑满帧！'
    ]
  },
  {
    ver: 'v1.4.1', date: '2026-11-13', tag: '怪量不变且远程怪-20% · 怪物移速-20% · 近战流派&残杖射程加强 · 前期减压',
    title: '⚖️ 怪潮与流派手感精调：怪物总量不变 & 远程怪数量降低 20% + 怪物移速降低 20% + 近战流派加强 + 守誓残杖范围大幅扩展',
    items: [
      '🎯 怪物总量保持 100% 不变，远程怪数量精准下调 20%：远程怪刷新概率与同屏远程上限统一乘以 0.80（-20%），空出的 20% 份额 1:1 转化为同波近战魔物。',
      '🐢 全场怪物移动速度降低 20%：常规魔物、狂化精英、先锋统领、四幕主宰及记忆首领的基础移速与冲锋速度统一乘以 0.80（-20%）。',
      '🪵 大幅加强【守誓残杖】攻击范围与横扫手感：基础攻击范围由 96 提升至 132（+37.5%），五阶进化范围加成同步上调至 +38 / +22。',
      '⚔️ 加强近战武器流派：近战属性射程继承率提升至 88%，近战常驻招架减伤提升至每把 3%（上限 18%）、对首领破甲倍率提升至 1.28x。'
    ]
  },
  {
    ver: 'v1.4.0', date: '2026-11-13', tag: '全32把兵装5阶上限与二选一神话进化 · 兵装贴图去像素化超清重绘 · 中后期怪血&攻击力再翻倍 · 最大视野超清栏杆与石砖',
    title: '✨ 全 32 兵装解锁 5 阶神话超限 & 64 种二选一进化分支 + 游戏内超清非像素兵装贴图重绘 + 中后期怪物血量与攻击力随波再翻倍 + 极限放大超清石雕栏杆与错缝石板',
    items: [
      '⚔️ 全 32 把兵装开放 5 阶（神话超限）与 64 种二选一进化：所有兵装可通过商店购入共鸣、行囊槽位合成、守誓遗物匣或锻魂神砧一路升至 5 阶！晋升 5 阶瞬间弹出「神话超限 · 二选一进化」仪式面板，每把兵装均拥有截然不同的双分支进化形态（如三道月轮剑气 vs 断空重斩、双联重炮塔 vs 紫电超导塔、三束棱镜贯日束 vs 聚变耀斑炮等），圣典图鉴同步收录全部进化图谱。',
      '🎨 游戏内兵装贴图彻底告别像素色块风：重制 160×160 Retina 2.5x 离屏超采样哥特二次元军械立绘烘焙管线，为全部 32 把兵装逐一精绘金属斜面光泽、血槽刃口、护手铭文、左轮转轮、瞄准镜、元素晶核与 5 阶专属进化羽翼/魂环，同步实装至战斗角色周身、行商卡片、装备栏与圣典图鉴。',
      '🔥 中后期怪物血量与攻击力随波数再翻一倍（2.0x）：新增随波数平滑攀升的中后期硬核成长曲线——第 1~2 层维持开荒基准，第 3 层起怪物、精英、先锋统领与守层主宰的生命值与攻击力（含场地灾害伤害）随波数逐层递增，至第 14~16 层完整再提升 100%（血量翻倍、攻击力翻倍），无尽轮回继续向上突破！',
      '🏛️ 修复屏幕闪烁与地面栏杆模糊：移除画布非同步单缓冲扫描并将离屏地坪严格收束于 4096px 硬件纹理上限内，彻底消除战斗与走位时的闪屏撕裂；采用超清错缝倒角石砖与实时视口裁剪哥特石雕栏杆，缩放视野全程稳定锐利；新增角色脚底浅淡的收集范围圈（保留清爽视野不展示攻击范围圈）；同步大幅下调初始背景音乐与战斗音效音量，并在主殿、战斗 HUD、驻留菜单与行商内实装独立音量调节面板！'
    ]
  },
  {
    ver: 'v1.3.9', date: '2026-11-13', tag: '当前版本 · 取消主角无敌帧 · 怪伤+20% / 后期Boss血量+200% · 首领&小怪技能深度差异化 · 流派去暴击膨胀与经济紧缩',
    title: '⚔️ 硬核战斗与流派生态大重铸：取消无敌帧 + 怪伤提升20% + 后期首领血量提升200% + 首领&小怪多维技能重塑 + 74件圣遗物去暴击化平衡 + 金币产出下调30% + 四幕超清围栏地貌',
    items: [
      '🩸 取消主角全局无敌帧 & 怪伤提升 20% & 后期首领血量提升 200%：彻底移除受击、闪避、护盾吸收、灵魂瞬步与传送门等一切全局无敌帧（多怪合围与密集弹幕每击均真实结算，单怪贴身采用独立挥击冷却防瞬融）；全怪物、精英、首领与场地灾害伤害统一 +20%；中后期首领血量逐幕跃升，第 12~16 层及无尽轮回首领血量额外提升 +200%（3.0 倍终局攻坚）！',
      '👑 16 位首领/统领技能彻底去同质化重做：移除旧版千篇一律的通用外环与随机陨石复读；烬羽新增二/三段连环疾风居合冲刺与八荒弯月血刃波，艾丝特莉亚新增旋转双翼极光冰束扫射、寒渊三叉冰戟与六合冰牢，伽蓝新增十字/X形次元锁定激光网与残影交叉弯刃，日蚀圣女新增「先内圈耀斑远离→后外环黑日贴身」双拍连携与黄金三叉圣戟，欧米茄新增十字等离子歼灭主炮与 3×2 排炮矩阵，苍岚毒皇新增万蛊龙卷阵与五联剧毒三叉戟！',
      '👾 全层小怪走位与攻击高度差异化回归（前期 1~6 层刷怪密度下调 20%）：第 1 层起全面开放凌厉 Z 字折线切角螳螂、S 形蛇行虫群、弹性跳跃喷酸分裂泥（亡语分裂×3）、双联 V 字喷毒虫；第 2~3 层起全场景解锁发射醒目【三叉戟】扇形弹幕的晶化毒蝎与凛冬冰魄、锁定走廊蛮牛冲锋兽与潜沙虫！',
      '⚖️ 全流派武器装备去暴击膨胀重构 & 金币产出下调 30% & 4 张超清石雕围栏地貌：大幅削减羁绊、武器、圣遗物与升级卡中泛滥的暴击率占比，重做 8 件旧暴击/无敌帧装备并新增【动能弹射梭芯】【圣盾脉冲电容】【残影疾风战靴】【蜂群火控中枢】【四象反应炉心】【重装震地肩铠】6 件流派核心遗物（共 74 件）；晶石掉落、通关赏金、收获与补给箱金币产出统一下调 30%；重绘四幕 1376×768 超清哥特石雕围栏竞技场贴图并以 1.60x Retina 精度烘焙。'
    ]
  },
  {
    ver: 'v1.3.8', date: '2026-11-13', tag: '首领破框立绘横幅回归 · 战斗渲染性能优化 · 离线音景与回溯修复',
    title: '👑 16 首领黑曜镌金破框立绘横幅回归（满 5 秒展示消逝 / 一阶&二阶双 33%）+ 热路径性能优化与潜在 Bug 清零',
    items: [
      '👑 首领登场与二阶段破框立绘横幅重塑回归：完整恢复 16 位首领（6 位终局主宰 + 7 位先锋统领 + 3 位祭坛首领）共 32 套 440×516 高清半身立绘（一阶夏装 & 二阶神话换装）；升级「黑曜镌金」斜切画匣、双旋星盘法阵、立绘左置破框与底部流光计时进度条，满 5.0 秒展示后 0.85 秒丝滑上浮消逝；一阶段 33% 概率触发，二阶段 33% 概率觉醒且觉醒必弹二阶段专属立绘（自动衔接宽银幕 AVG 剧场不重叠）。',
      '🚀 战斗碰撞与渲染热路径深度提速：消除每帧百怪无元素异常时的冗余 ctx.save/translate/restore 状态栈切换；新增存活怪物全局 AABB 包络盒 O(1) 预筛与轴向差值剪枝，大幅压降密集弹幕 × 怪群碰撞开销；预存受击火花单位向量免除逐帧 hypot 开方，并为光束与连锁电弧补充视口裁剪。',
      '🔊 单文件离线版音频全量内联与 WebAudio 防泄漏：打包脚本新增内联全部 7 首环境音景与过场 .wav 音频，修复离线版移出目录后音频报 ERR_FILE_NOT_FOUND 的问题；修复 SpireAudio.tick 合成器节点未 disconnect 的内存泄漏。',
      '🛠️ 逻辑与演出细节修复：修复第三幕「倒悬钟楼」发条金尘粒子因场景 ID 误判未渲染的问题；修复战败重开本层或返回主殿时剧场慢动作/二阶段状态残留；将无尽深渊 17 层+ 主首领轮转池补齐为完整 6 位终极 Boss，并清理残留废弃补丁代码。'
    ]
  },
  {
    ver: 'v1.3.7', date: '2026-11-13', tag: '全37种单位专属超清贴图 · 硬核难度重构 · 受击微光与战场纯净优化',
    title: '🎨 全 37 种战斗单位 1:1 专属超清贴图实装 + 硬核数值重构（首层加密 / 射程-20% / 攻速-30% / 怪血+50%线性成长 / 首领血量+300%）+ 受击微光与场地净化',
    items: [
      '👾 全 37 种怪物/统领/首领专属超清贴图（新增 28 张 256~300px Retina 哥特 Q 版透明 PNG，0 贴图复用）：从蚀忆灯蛾、裂纹骨盾卫、窥视单眼狙偶、旋刃发条陀螺、腐钟迫击炮手、黑曜巨神卫，到 7 位先锋统领、旧塔机甲神兵与 3 位记忆祭坛首领全部配备 1:1 专属贴图，武器外观与攻击机制严密呼应；烬塔圣典怪物图鉴扩容至 37 项全收录。',
      '⚔️ 硬核战斗难度全面上调：第 1 层起开场即刷出合围怪群并加密刷怪节奏（第 2 层起解锁当幕层域精英怪、潮涌层实装蚀忆魂灯龛）；主角攻击范围整体下调 20%、攻击速度下调 30%；常规怪物血量增加 50% 并随波数严格线性递增，四幕首领、先锋统领与祭坛首领血量统一提高 300%（4 倍血量持久攻坚）！',
      '✨ 受击闪白柔化与无敌态剥离：离屏受击缓存升级为 32% 暖白微光叠层（source-atop，保留原画线稿与色彩细节且维持 0 滤镜开销），单次时长收敛至 0.042s 并加入 0.095s 连射节流；独立拆分玩家受击计时 hurtFlashT，杜绝灵魂瞬步、闪避与传送门无敌态误闪白。',
      '🧹 战场地面与角色周身视觉纯净度修复：移除四大场景中央烘焙的固定大圆环，并清理角色周身常驻的武器射程虚线圈与磁吸圈干扰。'
    ]
  },
  {
    ver: 'v1.3.6', date: '2026-11-13', tag: '《烬塔残响》16层固定首领剧情/无尽双模式 · 黑曜镌金多维选项卡 UI',
    title: '🕯️ 实装《烬塔残响：第999次救赎》全设定原画、16层四幕固定首领与宽银幕立绘剧场、剧情/无尽双模式分流及「黑曜镌金」高定选项卡 UI',
    items: [
      '🏛️ 极简主殿与「黑曜镌金」多维对称选项卡 UI：重绘 1px 黑曜细金线镶边、香槟暗金金属铭牌按钮与衬线书卷排版，彻底去除廉价页游感；分离【剧情模式（唯一主角「零号·白衣」限定）】与【无尽模式（六角色开放）】，实装六等分人物选择选项卡（手机竖屏 2×3 对称矩阵，支持键盘 1-6 / 方向键切换）、角色「契约特质 / 兵装与瞬步」档案选项卡及「轮回厄度（3×2） / 起始层域（1+2×2）」整备选项卡。',
      '🗼 严格 16 层四幕攀登与四大固定首领署名大招：第 1~4 层雨夜长桥（第 4 层固定镇守：绯红断刃剑姬·烬羽）、第 5~8 层永冻冰窟（第 8 层固定镇守：永冻星使·艾丝特莉亚）、第 9~12 层倒悬钟楼（第 12 层固定镇守：紫电弦月人偶·伽蓝）、第 13~16 层日蚀镜界（第 16 层终战：日蚀圣女，必进二阶段真我破茧），搭载首领专属咏唱大招，全程 0 随机首领顶替。',
      '🎬 宽银幕开场/终章过场与双端自适应 AVG 立绘演出：恢复《序幕·第999次石棺苏醒》宽银幕交叉溶解动画与第 16 层《终章·第一千道黎明》破晓群像结局；全 16 层对白与青羽行商全面采用设定集左侧二次元半身立绘，并针对手机竖/横屏重构保真宽银幕画框、动态高度对话框与双立绘远近景排布。',
      '⚡ 六角色专属【灵魂瞬步】与 60/120FPS 超清动作管线：实装空格/Shift/右键/触屏拇指一键发动的无敌灵魂瞬步与六角色差异化残响战技；校准 1024×256 四帧精灵动作表质心基线、Retina 2.0x 超清渲染与离屏零滤镜受击剪影缓存（全程 0 每帧径向渐变、0 shadowBlur 满帧运行）。'
    ]
  },
  {
    ver: 'v1.3.5', date: '2026-11-12', tag: '16首领池扩充 + 直线冲锋修复 + 全难度平衡',
    title: '👑 首领阵容扩充至 16 位 (32套立绘) + 直线冲锋 100% 满程贯通修复 + 远近战/D0~D5 深度平衡',
    items: [
      '👑 首领池重磅扩充（终局 Boss 4➔6 位，精英统领 3➔7 位，共 16 位首领 / 32 套二次元立绘）：新增终局主宰【🦋碧落腐生毒皇·萝莎莉亚】与【☀️炽阳裁决圣女·赫利俄丝】，以及第 5/9 波精英统领【🐍碧鳞剧毒统领·琉璃】、【🧊凛霜圣枪统领·塞蕾丝】、【🛡️曜铁圣盾统领·瓦伦蒂娜】、【🌪️苍雷风暴统领·岚音】；每位新首领均配备专属招式、夏装立绘与隐藏二阶段泳装换装立绘！',
      '⚡ 直线预警怪 100% 满程冲锋压迫感重构：修复全部 10 类直线蓄力单位冲刺距离仅约预警线 1/4 的问题，现精准贯通 100% 蓄力预警走廊（245~380px）并霸体推开沿途杂兵，落点准星所见即所得！',
      '⚔️ 近战与远程全流派深度平衡：强化 11 把近战武器挥砍触及与基础伤害，新增挥砍斩碎近身敌弹、每把近战常驻 2.5% 招架减伤（最高 15%）与对首领 +28% 破甲增伤；同步升级废土游侠起手双武器（冲锋枪+弹弓）与远程轻穿透清潮手感。',
      '🌊 前中后期节奏平滑 & D0~D5 进阶挑战梯度重塑：中后期与首领波同屏活跃怪物上限统一收口于 <=80 只（移动端 <=64 只），兼具尸潮压迫感与走位空间并动态校准晶石/经验转化；上调并平滑 D0~D5 倍率阶梯，让整体更具硬核挑战性且确保 D5 远近战均可凭操作与构筑公平通关！'
    ]
  },
  {
    ver: 'v1.3.4', date: '2026-11-12', tag: '10首领双形态夏装&隐藏换装立绘',
    title: '👑 10 位首领专属二次元夏装立绘 + 隐藏二阶段专属性感换装立绘全面实装',
    items: [
      '🏖️ 10 位首领专属一阶段夏装半身立绘：为 4 大终局魔王、3 大奇遇霸主与 3 大精英统领逐一绘制了与剧情女主同画风的高清二次元美少女夏装立绘，33% 登场特写（每种首领单局上限 1 次）实时展示。',
      '🔥 隐藏二阶段专属换装立绘（共 20 套立绘）：当触发 25%【隐藏神话二阶段】觉醒时，首领立绘立即切换为更加惊艳迷人的二阶段限定泳装/轻纱换装立绘，并叠加六翼金红神辉与专属换装铭牌！',
      '🎨 开发者立绘检视台同步升级：新增「✨ 一阶 vs 二阶换装同框对比」与「🔥 二阶换装演出」一键预览。'
    ]
  },
  {
    ver: 'v1.3.3', date: '2026-11-12', tag: '首领立绘按种解锁 & 战败重开本波',
    title: '🎬 首领登场立绘上调至 33%（按每种首领上限 1 次）与战败重开本回合机制',
    items: [
      '🎬 常规与奇遇首领立绘上调至 33%：第 5/9 波精英统领、第 12 波与无尽终局主宰以及奇遇召唤首领登场立绘触发率统一调整为 33%。',
      '👑 每种首领独立上限 1 次：取消「单局全局最多 1 次」的限制，改为每种首领单局独立上限 1 次——同一首领不重复刷屏，且前期首领触发绝不再阻断后期终局/无尽新首领立绘演出。',
      '⏪ 阵亡回合回溯机制：战败结算界面新增「⏪ 重新开始本回合」与「🔄 放弃并从头开始」双路线选择，可完整回溯至本波开战前状态重战，也可直接放弃从第 1 波重头再来。'
    ]
  },
  {
    ver: 'v1.3.2', date: '2026-11-12', tag: '性能深优与提示调优',
    title: '⚡ 隐藏二阶段觉醒上调至 25%、怪物体感轻提示快隐与底层性能/防崩深度加固',
    items: [
      '⚡ 隐藏神话二阶段概率上调至 25%：首领与奇遇首领初死时触发【隐藏神话二阶段】的概率提升至 25%（每波独立判定，同波双王防连环叠加），触发必播神话立绘特写、延长 +60 秒并掉落传说秘宝舱。',
      '💬 角色与怪物头顶提示双轨分级：保留角色关键状态/奇遇/地形/升级提示的充裕阅读时长（1.5~2.8s），同时大幅缩短怪物「格挡」（0.38s+防刷屏节流）、「冰冻」、「自爆预警」与高频微回血飘字时长，告别遮挡视野。',
      '🚀 60FPS 深度性能优化：新增武器羁绊/属性零分配缓存、子弹命中集合惰性分配、怪物数组原地紧缩、距离平方预筛、飘字/横幅文本宽度缓存与离屏视锥剔除，高密虫潮波帧耗时大幅下降。',
      '🛡️ 全链路防崩溃加固：修复输入法/特殊按键 key 未定义潜在报错、深无尽全道具满配开箱空池兜底、非有限数值防不死怪保护及 WebAudio 并发语音池回收。'
    ]
  },
  {
    ver: 'v1.3.1', date: '2026-11-12', tag: '首领立绘稀有化',
    title: '✨ 首领全屏登场立绘调整为稀有触发机制（大幅减少打断、提升惊喜感）',
    items: [
      '✨ 首领登场立绘稀有化：取消每次奇遇召唤首领与第 12 波/无尽波主宰现身必播全屏定格立绘的设定，改为 10% 低概率稀有触发「真身显圣」立绘特写，且单局最多触发 1 次登场立绘，保障战斗节奏丝滑连贯。',
      '⚡ 隐藏神话二阶段稀有度收紧：首领初死逆天觉醒【隐藏神话二阶段】的概率收紧至 7%~13% 且单局最多觉醒 1 次，触发时必定播放真红神话觉醒立绘动画并延长 +60 秒。'
    ]
  },
  {
    ver: 'v1.3.0', date: '2026-11-12', tag: '异形地形与全流派军械',
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
const FLOOR_PAD = 64;
const WORLD = { w: 2200, h: 1500, pad: 90 };
let curFloorScale = 1.0;
let floorBakeScale = 1.64;
const MAX_WEAPON_TIER = 5;
const TIER_COLORS = ['', '#e2deec', '#4cc9f0', '#c77dff', '#ffd166', '#ff3b6b'];
const TIER_GLOW   = ['', 'rgba(255,255,255,0)', 'rgba(76,201,240,0.45)', 'rgba(199,125,255,0.55)', 'rgba(255,209,102,0.68)', 'rgba(255,59,107,0.84)'];
const TIER_NAMES  = ['', '普通', '精良', '史诗', '传说', '神话'];

// ============================================================================
// 🛡️ 网页端全链路资源完整性自检与启动门禁系统 (SpireBootGate)
// 防止弱网/丢包/跨版本残缺缓存导致「内容没下载全但初始界面已刷出」引发运行 Bug
// ============================================================================
const SpireBootGate = (function () {
  const failedNetTags = [];
  let finished = false;
  let codeAllVerified = false;
  let checkingImages = false;

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('error', function (ev) {
      const t = ev && ev.target;
      if (t && t !== window && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
        const rawUrl = String(t.src || t.href || t.tagName);
        const shortName = rawUrl.split('/').slice(-2).join('/') || rawUrl;
        if (failedNetTags.indexOf(shortName) === -1) failedNetTags.push(shortName);
      }
    }, true);
  }

  function forceReloadClean() {
    const go = function () {
      try {
        const base = (typeof location !== 'undefined' && location.pathname) ? location.pathname : './';
        const hash = (typeof location !== 'undefined' && location.hash) ? location.hash : '';
        location.replace(base + '?_reload=' + Date.now() + hash);
      } catch (_) {}
    };
    try {
      const tasks = [];
      if (typeof navigator !== 'undefined' && navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        tasks.push(navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister()))));
      }
      if (typeof window !== 'undefined' && window.caches && window.caches.keys) {
        tasks.push(window.caches.keys().then(ks => Promise.all(ks.map(k => window.caches.delete(k)))));
      }
      if (tasks.length) {
        Promise.all(tasks).then(go, go);
        return;
      }
    } catch (_) {}
    go();
  }

  if (typeof window !== 'undefined') {
    window.__spireForceReload = forceReloadClean;
    window.__spireAllowBypass = function () {
      if (!codeAllVerified) return false;
      unlockGate('manual_image_bypass');
      return true;
    };
  }

  function setStep(pct, stepTxt) {
    if (finished) return;
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    const fillEl = document.getElementById('bootGateFill');
    const pctEl = document.getElementById('bootGatePct');
    const stepEl = document.getElementById('bootGateStep');
    if (fillEl) fillEl.style.width = clamped + '%';
    if (pctEl) pctEl.textContent = clamped + '%';
    if (stepEl && stepTxt) stepEl.textContent = stepTxt;
  }

  function showFailure(failures, allowImageBypass) {
    bootIntegrityPassed = false;
    const gate = document.getElementById('bootGate');
    if (gate) {
      gate.classList.remove('hidden');
      gate.hidden = false;
      gate.style.display = 'flex';
    }
    const errBox = document.getElementById('bootGateErrBox');
    const errList = document.getElementById('bootGateErrList');
    const bypassBtn = document.getElementById('bootGateBypassBtn');
    const slowWrap = document.getElementById('bootGateSlowWrap');
    if (slowWrap) slowWrap.style.display = 'none';
    if (errList) {
      errList.innerHTML = failures.map(msg => `<div>• ${String(msg).replace(/</g, '&lt;')}</div>`).join('');
    }
    if (bypassBtn) {
      bypassBtn.style.display = allowImageBypass ? 'inline-block' : 'none';
    }
    if (errBox) errBox.style.display = 'block';
    setStep(allowImageBypass ? 88 : 42, allowImageBypass ? '核心代码已就绪，部分首屏贴图下载超时' : '资源完整性校验未通过 · 已拦截残缺启动');
    if (typeof logWarn === 'function') {
      logWarn('BOOT_GATE', `完整性拦截 (${failures.length}项): ${failures.join(' | ')}`);
    }
  }

  function unlockGate(reason) {
    finished = true;
    bootIntegrityPassed = true;
    setStep(100, '全量模块与首屏资源校验通过');
    const gate = document.getElementById('bootGate');
    if (gate) {
      gate.classList.add('hidden');
      gate.hidden = true;
      gate.style.display = 'none';
    }
    if (typeof refreshSpireHome === 'function') refreshSpireHome();
    if (typeof logInfo === 'function') {
      logInfo('BOOT_OK', `全链路资源完整性校验通过 (${reason}) · ver=${APP_VERSION}`);
    }
  }

  function verifyModules() {
    const failures = [];
    const gate = document.getElementById('bootGate');
    const htmlVer = gate && gate.getAttribute ? gate.getAttribute('data-html-version') : null;
    if (htmlVer && htmlVer !== APP_VERSION) {
      failures.push(`HTML 入口版本 (${htmlVer}) 与脚本版本 (${APP_VERSION}) 不一致（旧缓存残留）`);
    }
    for (let i = 0; i < failedNetTags.length; i++) {
      failures.push(`网络加载失败: ${failedNetTags[i]}`);
    }

    const checks = [
      ['01/env', () => typeof APP_VERSION === 'string' && Array.isArray(CHANGELOG_HISTORY)],
      ['02/logger', () => typeof logInfo === 'function' && typeof logError === 'function'],
      ['03/scenes', () => typeof SCENES !== 'undefined' && Array.isArray(SCENES) && SCENES.length >= 4],
      ['04/boss_portraits', () => typeof SpireAssets === 'object' && SpireAssets !== null && typeof BOSS_PORTRAIT_DATA === 'object'],
      ['05/textures', () => typeof buildFloorTexture === 'function'],
      ['06/viewport', () => typeof resize === 'function' && typeof clampCam === 'function'],
      ['07/audio', () => typeof SpireAudio === 'object' && typeof beep === 'function'],
      ['08/arsenal', () => typeof WEAPONS === 'object' && WEAPONS !== null && Object.keys(WEAPONS).length === 32 && Array.isArray(ITEMS) && ITEMS.length >= 20 && Array.isArray(CLASSES) && CLASSES.length >= 6],
      ['09/monsters', () => typeof BOSS_DEFS === 'object' && BOSS_DEFS !== null && Object.keys(BOSS_DEFS).length >= 6],
      ['10/codex', () => typeof openCodex === 'function'],
      ['11/story-v2', () => typeof SpireStoryV2 === 'object' && SpireStoryV2 !== null && !!SpireStoryV2.opening],
      ['12/director', () => typeof SpireDirector === 'object' && SpireDirector !== null && typeof SpireDirector.render === 'function'],
      ['13/menus', () => typeof startGame === 'function' && typeof showStart === 'function' && typeof initMenuUI === 'function'],
      ['14/presentation', () => typeof SpireSave === 'object' && typeof continueSpireStory === 'function'],
      ['15/spawner', () => typeof beginWave === 'function' && typeof createEnemy === 'function' && typeof spawnArenaTerrains === 'function'],
      ['16/combat', () => typeof hurtEnemy === 'function' && typeof hurtPlayer === 'function'],
      ['17/update', () => typeof update === 'function' && typeof triggerSoulDash === 'function'],
      ['18/shop', () => typeof openShop === 'function' && typeof finishWave === 'function'],
      ['19/sprites', () => typeof getBakedWeaponSprite === 'function'],
      ['20/renderer', () => typeof draw === 'function' && typeof loop === 'function']
    ];

    for (let i = 0; i < checks.length; i++) {
      let ok = false;
      try { ok = !!checks[i][1](); } catch (_) { ok = false; }
      if (!ok) failures.push(`模块未就绪或下载残缺: ${checks[i][0]}`);
    }

    const codeOk = failures.length === 0;
    let cssPending = false;
    if (typeof document !== 'undefined' && document.styleSheets && typeof document.styleSheets.length === 'number' && document.querySelectorAll) {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      for (let i = 0; i < links.length; i++) {
        const lnk = links[i];
        if (!lnk.sheet) {
          if (document.readyState !== 'complete') {
            cssPending = true;
          } else {
            const href = (lnk.getAttribute && lnk.getAttribute('href')) || lnk.href || ('stylesheet#' + (i + 1));
            failures.push(`样式表未下载完整: ${href.split('?')[0]}`);
          }
        }
      }
    }

    return { ok: failures.length === 0 && !cssPending, codeOk, cssPending, failures };
  }

  function verifyCriticalAssets() {
    if (finished || checkingImages) return;
    const isInlineBundle = typeof window !== 'undefined' && window.__SPIRE_INLINE_ASSETS__ && typeof window.__SPIRE_INLINE_ASSETS__ === 'object';
    if (isInlineBundle || typeof Image === 'undefined') {
      unlockGate('inline_or_headless');
      return;
    }

    checkingImages = true;
    const criticalList = [
      ['主殿背景原画', 'assets/spire/v2/title-clean.png'],
      ['主角立绘档案', 'assets/spire/port_zero.jpg'],
      ['风语行商立绘', 'assets/spire/port_qingyu.jpg'],
      ['主角战斗精灵表', 'assets/spire/hero_zero_sheet.png'],
      ['首幕地面石板贴图', 'assets/spire/arena_1_foundry.jpg']
    ];
    const total = criticalList.length;
    let doneCount = 0;
    let pending = total;
    const imgFailures = [];
    const startedAt = Date.now();

    const finishOne = function (label, ok, relPath) {
      if (finished) return;
      doneCount++;
      pending--;
      if (!ok) imgFailures.push(`${label} (${relPath}) 下载或解码失败`);
      const pct = 66 + Math.round((doneCount / total) * 34);
      setStep(pct, `正在核验首屏核心原画 (${doneCount}/${total})…`);
      if (pending <= 0) {
        checkingImages = false;
        if (imgFailures.length === 0) {
          unlockGate('web_full_verified');
        } else {
          showFailure(imgFailures, true);
        }
      }
    };

    for (let i = 0; i < total; i++) {
      const label = criticalList[i][0];
      const rel = criticalList[i][1];
      const baseResolved = (typeof SpireAssets !== 'undefined' && SpireAssets && typeof SpireAssets.resolve === 'function')
        ? SpireAssets.resolve(rel)
        : rel;

      const tryLoad = function (attempt) {
        let settled = false;
        const img = new Image();
        img.onload = function () {
          if (settled) return;
          settled = true;
          const validDim = (img.naturalWidth || img.width || 0) > 0 && (img.naturalHeight || img.height || 0) > 0;
          if (validDim) finishOne(label, true, rel);
          else if (attempt < 2 && !/^data:/i.test(baseResolved)) tryLoad(attempt + 1);
          else finishOne(label, false, rel);
        };
        img.onerror = function () {
          if (settled) return;
          settled = true;
          if (attempt < 2 && !/^data:/i.test(baseResolved)) {
            tryLoad(attempt + 1);
          } else {
            finishOne(label, false, rel);
          }
        };
        if (attempt === 0 || /^data:/i.test(baseResolved)) {
          img.src = baseResolved + (/^data:|\?/.test(baseResolved) ? '' : ('?v=' + APP_VERSION));
        } else {
          const clean = baseResolved.split('?')[0];
          img.src = clean + '?_retry=' + attempt + '&_t=' + Date.now();
        }
      };

      tryLoad(0);
    }

    if (!finished && pending > 0 && typeof setTimeout === 'function') {
      setTimeout(function () {
        if (!finished && pending > 0 && (Date.now() - startedAt) >= 10000) {
          checkingImages = false;
          showFailure(['首屏核心原画响应超时（当前网络较慢或连接受阻）'], true);
        }
      }, 11000);
    }
  }

  function runFullCheck(source) {
    if (finished) return true;
    const res = verifyModules();
    if (!res.codeOk) {
      if (source === 'window_load' || source === 'renderer_tail' || source === 'user_guard') {
        showFailure(res.failures, false);
      }
      return false;
    }
    if (res.cssPending) {
      setStep(60, '核心脚本已就绪 · 正在等待样式表完成加载…');
      return false;
    }
    if (!res.ok) {
      showFailure(res.failures, false);
      return false;
    }
    codeAllVerified = true;
    setStep(66, '20/20 核心模块校验通过 · 正在核验首屏原画…');
    verifyCriticalAssets();
    return bootIntegrityPassed;
  }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('load', function () {
      if (!finished) runFullCheck('window_load');
    });
  }

  setStep(14, '基础环境就绪 · 正在加载数据与战斗模块…');
  return { setStep, verifyModules, runFullCheck, forceReloadClean };
})();
