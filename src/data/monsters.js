// ============================================================================
// 👑 《烬塔残响：第999次救赎》守层主宰 Boss、守誓统领 & 分层域 Q 版怪物设定数据
// ============================================================================
const BOSS_DEFS = {
  butcher: {
    id: 'butcher', icon: '🦊', sprite: 'assets/spire/hero_jinyu.png', portrait: 'assets/spire/port_jinyu.jpg',
    name: '绯红断刃剑姬 · 烬羽', epithet: '一层守桥挚友 · 第998道残火', color: '#e63946', spd: 90,
    desc: '佩戴半截白狐假面、死守雨夜孤桥九百九十八世的昔日剑卫：拔刀锁定居合一闪斩线、释放【红莲外环剑域（贴身风眼安全）】、倾泻专属场景熔池并唤出浪人残偶；33% 概率燃尽魂火觉醒二阶段，必展二阶隐藏立绘并额外解锁专属终式【绯夜八荒剑狱】！'
  },
  frost_queen: {
    id: 'frost_queen', icon: '❄️', sprite: 'assets/spire/hero_astria.png', portrait: 'assets/spire/port_astria.jpg',
    name: '永冻星使 · 艾丝特莉亚', epithet: '二层冰封王城之主 · 碎冕星瞳', color: '#00bbf9', spd: 84,
    desc: '遵从你千年前遗愿冰封全城子民的挚友星使：架设双轨寒晶导轨掠袭、绽放螺旋霜星花瓣弹、吟唱【眠冬外环暴雪】并凝结专属寒冰台；33% 概率碎冕觉醒二阶段，必展二阶隐藏立绘并额外解锁专属终式【绝对零度四翼极光环】！'
  },
  mech_colossus: {
    id: 'mech_colossus', icon: '⚙️', sprite: 'assets/spire/boss_mech_colossus.png', portrait: 'assets/spire/port_jialan.jpg',
    name: '倒悬机神 · 伽蓝重装态', epithet: '三层逆转发条钟楼镇守者', color: '#f77f00', spd: 78,
    desc: '伽蓝操控的倒悬钟楼重装镇塔巨像：双肩发条火炮交叉齐射、改造本层专属地形、轰击星晷外环震波并投放齿轮陀螺偶；33% 概率超载觉醒二阶段，必展二阶隐藏立绘并额外解锁专属终式【末日熔核锯刃风暴】！'
  },
  void_weaver: {
    id: 'void_weaver', icon: '🕰️', sprite: 'assets/spire/hero_jialan.png', portrait: 'assets/spire/port_jialan.jpg',
    name: '紫电弦月人偶 · 伽蓝', epithet: '三层星晷断罪少主 · 逆命傀儡师', color: '#9d4edd', spd: 86,
    desc: '头插黄金骷髅发条的毒舌人偶少主：施展逆钟折跃与十字激光网、扫射高压【炼金秘毒龙息喷流】并操控双刃剑偶；觉醒二阶段后额外解锁专属终式【逆时米字次元断罪】！'
  },
  plague_empress: {
    id: 'plague_empress', icon: '🍃', sprite: 'assets/spire/hero_qingyu.png', portrait: 'assets/spire/port_qingyu.jpg',
    name: '残羽魔女 · 青羽试炼影', epithet: '风语守望者 · 最后的温柔锁', color: '#52b788', spd: 85,
    desc: '守望九百九十九次轮回的残羽魔女幻影：蓄力横扫高压扇形【万蛊剧毒吐息喷流】、旋舞双螺旋苍翠风翎弹幕并唤出灵体；觉醒二阶段额外解锁专属终式【双龙剧毒吐息狂潮】！'
  },
  solar_seraph: {
    id: 'solar_seraph', icon: '🌑', sprite: 'assets/spire/hero_eclipse.png', portrait: 'assets/spire/port_eclipse.jpg',
    name: '第999号 · 日蚀圣女', epithet: '终层镜中真我 · 蚀日天灾神骸', color: '#ff9f1c', spd: 88,
    desc: '端坐黑水圣所巨镜之中的你真正的神明本体：锁定黑金圣枪导轨贯日突刺、释放阴阳双曜并震塌黑曜断层；第 16 层终战必定揭下黑纱觉醒二阶段并解锁专属终式【黑日神罚天体崩落】！'
  }
};

const MINI_BOSS_DEFS = {
  vanguard: {
    id: 'vanguard', icon: '🏮', sprite: 'assets/spire/mb_vanguard.png',
    name: '雨夜守桥重铠武者', epithet: '一层孤桥铁卫统领', color: '#f72585', spd: 86,
    desc: '镇守雨夜长桥桥头的绯甲大太刀统领：架起攻城铁门冲车走廊破阵猛撞，落地劈出三向裂地刀波；二阶段额外解锁专属爆发终式。'
  },
  pyro_lord: {
    id: 'pyro_lord', icon: '🔥', sprite: 'assets/spire/mb_pyro_lord.png',
    name: '赤伞焚灯祭司', epithet: '一层余烬狂热督军', color: '#fb5607', spd: 80,
    desc: '执掌红莲魂火的狐面祭司统领：四臂烈焰风车旋射并引爆十字八芒熔火柱；二阶段额外解锁红莲火环终式。'
  },
  shadow_stalker: {
    id: 'shadow_stalker', icon: '⚡', sprite: 'assets/spire/mb_shadow_stalker.png',
    name: '紫电提线斩首偶', epithet: '三层发条暗杀统领', color: '#7209b7', spd: 96,
    desc: '伽蓝亲手打造的提线暗杀人偶：瞬影侧袭加居合十字一闪斩击，瞬发八方紫电飞针；二阶段额外解锁米字雷光剑狱。'
  },
  venom_matriarch: {
    id: 'venom_matriarch', icon: '🌿', sprite: 'assets/spire/mb_venom_matriarch.png',
    name: '苍翠荆棘守碑姬', epithet: '古桥风蚀督军', color: '#80ed99', spd: 84,
    desc: '守护古桥封印碑的荆棘战姬统领：蓄力横扫高压扇形【碧鳞剧毒喷流】腐蚀扇区，齐射三联毒刺并布设毒沼花苞；二阶段解锁双向毒息狂潮。'
  },
  glacial_valkyrie: {
    id: 'glacial_valkyrie', icon: '🧊', sprite: 'assets/spire/mb_glacial_valkyrie.png',
    name: '眠冬碎晶圣枪骑', epithet: '二层冰封王庭近卫长', color: '#48cae4', spd: 92,
    desc: '艾丝特莉亚麾下近卫女武神：架起寒霜枪骑走廊全额贯突，落点绽放六棱寒冰棱晶减速弹环。'
  },
  iron_warden: {
    id: 'iron_warden', icon: '🛡️', sprite: 'assets/spire/mb_iron_warden.png',
    name: '黑曜镇狱金锁卫', epithet: '终层圣所重盾统领', color: '#eab308', spd: 76,
    desc: '看守日蚀黑水圣所的重铠巨卫：稳步推进投掷双旋暗金圆刃，并挥动金锤重踏镜面引爆震荡轰击圈。'
  },
  storm_siren: {
    id: 'storm_siren', icon: '🕰️', sprite: 'assets/spire/mb_storm_siren.png',
    name: '逆钟星律奏鸣偶', epithet: '三层钟楼雷鸣歌姬', color: '#38bdf8', spd: 90,
    desc: '背负黄铜管风琴翼的钟楼报时统领：化作雷光走廊疾闪突袭，降下三联落雷轰炸圈与扇形星律音刃。'
  }
};

// 战场随机刷新的 3 座记忆共鸣祭坛
const SPECIAL_RELICS = [
  {
    id: 'blood_altar', icon: '🏮', name: '雨夜断刃祭坛', color: '#ff2a55',
    bossId: 'crimson_lord', bossIcon: '🦊', bossName: '烬羽 · 第998世残响', epithet: '不肯熄灭的绯红剑魂', bossColor: '#d90429',
    rewardDesc: '击败必爆：💎30 封魂晶石 + 🎁×1 守誓遗物匣 + 瞬间回满全部生命！（若觉醒二阶段必爆传说圣遗物）',
    bossDesc: '残留在孤桥石灯里的第998世剑魂：化作绯影瞬步斩击，展开红莲外环阵（内圈安全）并唤出赤伞纸偶助战。'
  },
  {
    id: 'golden_idol', icon: '🕰️', name: '黄金逆钟星盘', color: '#ffd166',
    bossId: 'golden_golem', bossIcon: '🏆', bossName: '黄金发条圣柜巨神', epithet: '封存千年晶尘的机神', bossColor: '#f59e0b',
    rewardDesc: '受击沿途狂掉封魂晶石！击败必爆：💎48 巨额晶石雨 + 🎁×1 守誓遗物匣！（若觉醒二阶段必爆传说圣遗物）',
    bossDesc: '铸满黄金齿轮的封魂巨像：每损血 20% 喷涌满地高纯晶石，重踏撕裂星晷断层并唤出重甲齿轮卫。'
  },
  {
    id: 'void_cube', icon: '🌑', name: '黑曜蚀日残镜', color: '#c77dff',
    bossId: 'abyss_devourer', bossIcon: '👁️', bossName: '零号容器 · 饥饿黑影', epithet: '提灯深处的天灾倒影', bossColor: '#7209b7',
    rewardDesc: '击败必爆：💎26 封魂晶石 + 🎁×1 守誓遗物匣 + 本局永久 +12% 全体伤害赐福！（若觉醒二阶段必爆传说圣遗物）',
    bossDesc: '从黑曜石残镜溢出的天灾本源黑影：横扫高压蚀日毒雾龙息、释放双螺旋蚀日弹幕、暗物质外环坍缩并分裂黑水蚀影眷属；觉醒二阶段额外解锁黑日神罚终式。'
  }
];

// 《烬塔残响》分场景 Q 版怪物与首领圣典图鉴（全 41 种单位 1:1 绑定专属无重复高清透明贴图）
const MONSTER_CODEX = [
  // 一层·雨夜长桥怪物组
  { id: 'chaser',       cat: 'normal', sprite: 'assets/spire/mob_s1_ronin.png',      icon: '⚔️', name: '断魂浪人残偶',     badge: '🌧️ 一层·雨夜长桥',   wave: '第 1 层起',       stats: '❤️厚实 · 📏中 · 👟长距跃斩 · 💥中',       desc: '披蓑戴笠、执残断黑刀阻拦登桥者的旧王城浪人木偶，逼近时会发起凌厉跃步突斩。' },
  { id: 'swarmer',      cat: 'normal', sprite: 'assets/spire/mob_swarmer.png',       icon: '🏮', name: '绯红纸翼灯眼灵',   badge: '🌧️ 一层·雨夜长桥',   wave: '第 1 层起',       stats: '❤️脆 · 📏小 · 👟极快成群 · 💥微',         desc: '张开折纸蝠翼趋向魂灯疾飞而来的独眼提灯纸灵，成群飘忽扑击，最适合弹射或范围扫荡。' },
  { id: 'stalker',      cat: 'normal', sprite: 'assets/spire/mob_stalker.png',       icon: '✂️', name: '折纸双镰影侍',     badge: '🌧️ 一层·雨夜长桥',   wave: '第 1 层起',       stats: '❤️中韧 · 📏小 · 👟高速折线 · 💥双镰斩',   desc: '反握青芒短镰、呈 Z 字折线闪身突进的暗影忍偶，贴近瞬间挥出十字双镰快斩。' },
  { id: 'iron_guard',   cat: 'normal', sprite: 'assets/spire/mob_s1_guard.png',      icon: '🪓', name: '重戟守桥铁卫',     badge: '🌧️ 一层·半月横扫',   wave: '第 2 层起',       stats: '❤️中厚甲 · 📏中大 · 👟稳步压迫 · 💥160°横扫戟', desc: '身披绯红重扎甲、双手抡动长柄战戟的守桥重卫，逼近后蓄力亮起 160° 宽幅半月斩区，一戟横扫近身扇面！' },
  { id: 'magma_imp',    cat: 'scene',  sprite: 'assets/spire/mob_s1_umbrella.png',   icon: '🏮', name: '断魂赤纸伞妖',     badge: '🌧️ 一层专属精英怪', wave: '第 2 层起高频出没', stats: '❤️中韧 · 📏小 · 👟高速飘忽 · 💥亡语火池', desc: '撑着红油纸伞在雨夜孤桥飘荡的火灵，被击碎时在原地留下一团 1.15 秒后引爆的余烬火池。' },
  { id: 'shielder',     cat: 'normal', sprite: 'assets/spire/mob_shielder.png',      icon: '🛡️', name: '重铠符盾守桥卫',   badge: '🌧️ 一层·正面弧盾',   wave: '第 2 层起',       stats: '❤️紧凑高甲 · 📏中坚 · 👟稳步架盾 · 💥近身盾猛击', desc: '中等紧凑体型的符文塔盾重卫，正面减免 55% 远程伤害，贴身瞬间发动短距震荡【重盾猛击】顶退猎物！' },

  // 二层·永冻冰窟怪物组
  { id: 'shooter',      cat: 'normal', sprite: 'assets/spire/mob_s2_prism.png',      icon: '❄️', name: '折光霜晶浮灵',     badge: '❄️ 二层·永冻冰窟',   wave: '第 1 层起',       stats: '❤️偏低 · 📏中 · 👟中距游弋 · 💥双轨弧钳弹', desc: '冰封王城中悬浮的六棱寒晶灵体，射出左右外扩包夹的双轨弧线冰棱弹（正中留空利好近战突进）。' },
  { id: 'frost_knight', cat: 'normal', sprite: 'assets/spire/mob_s2_knight.png',     icon: '🗡️', name: '寒鸦冰枪死骑',     badge: '❄️ 二层·极寒穿刺',   wave: '第 3 层起',       stats: '❤️中坚 · 📏修长 · 👟迅捷奔袭 · 💥寒枪直刺', desc: '披挂王城鸦羽披风、手持细长寒晶刺剑枪的迅捷近战骑士，中近距锁定窄长寒冰刺线并发起凌厉滑步穿刺！' },
  { id: 'charger',      cat: 'normal', sprite: 'assets/spire/mob_charger.png',       icon: '🧊', name: '眠冬寒枪破阵骑',   badge: '❄️ 二层·重甲猛冲',   wave: '第 2 层起',       stats: '❤️高韧重骑 · 📏健硕 · 👟快步蓄势 · 💥尖角楔阵突+挑击', desc: '健硕矫健的寒霜重骑，锁定多级尖角楔阵冲锋轨猛冲贯突，冲刺收招瞬间还会挥出前方新月挑击弧波！' },
  { id: 'sniper_bug',   cat: 'normal', sprite: 'assets/spire/mob_sniper_bug.png',    icon: '🎯', name: '寒晶织网狙击蛛',   badge: '❄️ 二层·远距狙击',   wave: '第 3 层起',       stats: '❤️偏脆 · 📏小 · 👟激光锁敌 · 💥加速贯日矛', desc: '外围架设高对比三层红外瞄准线蓄力的机械蛛，射出醒目的渐进加速猩红长矛弹，近战贴脸可打断其架枪！' },
  { id: 'frost_wisp',   cat: 'scene',  sprite: 'assets/spire/mob_frost_wisp.png',    icon: '❄️', name: '眠冬冰冠亡灵',     badge: '❄️ 二层专属精英怪', wave: '第 3 层起高频出没', stats: '❤️偏低 · 📏小 · 👟浮空环晶 · 💥S波双螺旋戟', desc: '头戴碎冰王冠的王城残魂，射出 S 形正弦交织的双螺旋寒霜戟，命中未闪避时短暂降低角色移速。' },

  // 三层·倒悬钟楼怪物组
  { id: 'blade_duelist',cat: 'normal', sprite: 'assets/spire/mob_s3_duelist.png',    icon: '⚔️', name: '发条双刃剑客',     badge: '🕰️ 三层·旋风剑舞',   wave: '第 3 层起',       stats: '❤️轻灵 · 📏精悍 · 👟极速绕行 · 💥双刃剑刃风暴', desc: '精悍轻敏的高速发条剑偶，绕侧游走后拧紧发条化作高速旋转的黄金双刃锯轮向玩家旋斩突进！' },
  { id: 'bomber',       cat: 'normal', sprite: 'assets/spire/mob_bomber.png',        icon: '💣', name: '裂魂发条自爆球',   badge: '🕰️ 三层·倒悬钟楼',   wave: '第 3 层起',       stats: '❤️中等 · 📏中 · 👟疾奔引信 · 💥敌我同爆', desc: '头插黄金发条与火花引信的球形炸弹偶，贴近或被击碎时亮起 1.25 秒红圈自爆，亦能炸伤周围傀儡！' },
  { id: 'spinner',      cat: 'normal', sprite: 'assets/spire/mob_spinner.png',       icon: '⚙️', name: '钟楼旋刃陀螺偶',   badge: '🕰️ 三层·双翼回旋轮', wave: '第 4 层起',       stats: '❤️中等 · 📏中大 · 👟环绕走位 · 💥双弧回旋轮', desc: '腰嵌高速黄铜锯齿飞轮的钟面机关偶，向两侧投掷大弧度回旋十字金刃包抄侧翼（正中可直冲切入）。' },
  { id: 'mortar',       cat: 'normal', sprite: 'assets/spire/mob_mortar.png',        icon: '☄️', name: '发条星陨四足臼炮', badge: '🕰️ 三层·步进排炮',   wave: '第 4 层起',       stats: '❤️中等 · 📏中大 · 👟四足驻射 · 💥双连步进炮', desc: '背负大口径攻城臼炮的四足机关座，高抛双连步进预判轰炸圈；拥有近身盲区，近战贴身可令其哑火！' },
  { id: 'rad_scorpion', cat: 'scene',  sprite: 'assets/spire/mob_rad_scorpion.png',  icon: '⚡', name: '逆转发条猎蝎',     badge: '🕰️ 三层专属精英怪', wave: '第 2 层起出没',   stats: '❤️较高 · 📏中大 · 👟钳甲巡弋 · 💥雁形三叉戟', desc: '巡弋于倒悬齿轮间的黄铜发条机械巨蝎，高举萃毒尾针齐射主快翼慢的雁形楔阵三叉戟。' },
  { id: 'spore_mother', cat: 'scene',  sprite: 'assets/spire/mob_s5_reliquary.png',  icon: '🕯️', name: '蚀忆魂灯龛',       badge: '🕯️ 潮涌层专属母巢', wave: '第 3/5 层起登场', stats: '❤️高 · 📏大型 · 👟浮空母巢 · 💥十字缓速星雷', desc: '封存前 998 次轮回残魂的浮空金纹灯龛，播撒十字旋转缓速脉冲星雷球封锁区域并孕育子嗣。' },

  // 终层·日蚀镜界怪物组
  { id: 'splitter',     cat: 'normal', sprite: 'assets/spire/mob_splitter.png',      icon: '🌑', name: '黑水三核裂影怪',   badge: '🌑 终层·弹性蛙跃',   wave: '第 1 层起',       stats: '❤️高韧软泥 · 📏宽大 · 👟蓄势蛙扑 · 💥亡语三分', desc: '体内悬浮三枚金面核心的弹性黑水蚀灵，呈“蓄蹲停顿—猛然蛙跃”的独特节奏逼近，被斩碎时分裂 3 只高速子嗣。' },
  { id: 'mini_slime',   cat: 'normal', sprite: 'assets/spire/mob_mini_slime.png',    icon: '👁️', name: '蚀水独眼子嗣',     badge: '🌑 终层·裂影衍生物', wave: '裂影怪/母巢衍生', stats: '❤️轻韧 · 📏微 · 👟极速扑咬 · 💥微',     desc: '自黑水三核裂影怪或蚀忆魂灯龛中迸出的竖瞳黑水滴影，体型虽小但扑击迅捷。' },
  { id: 'shadow_reaper',cat: 'normal', sprite: 'assets/spire/mob_s4_shade.png',      icon: '🌙', name: '蚀影勾魂镰卫',     badge: '🌑 终层·瞬步暗镰',   wave: '第 5 层起',       stats: '❤️中韧 · 📏修长 · 👟瞬影闪袭 · 💥暗月环斩', desc: '游荡于日蚀镜界的无面死神镰卫，锁定猎物侧翼发动暗影瞬步折跃，现身刹那挥出紫黑满月巨镰环斩！' },
  { id: 'summoner',     cat: 'normal', sprite: 'assets/spire/mob_summoner.png',      icon: '🔮', name: '蚀日六翼唤灵师',   badge: '🌑 终层·后排唤灵',   wave: '第 5 层起',       stats: '❤️中等 · 📏中 · 👟后排吟唱 · 💥交叉暗月镰', desc: '披紫黑六翼兜帽悬浮后排的日蚀秘术偶，唤出纸灵群并释放 X 形交叉弧线暗月镰波，建议优先斩首。' },
  { id: 'healer',       cat: 'normal', sprite: 'assets/spire/mob_healer.png',        icon: '💚', name: '圣所祈福翠灯偶',   badge: '🌑 终层·群体回血',   wave: '第 6 层起',       stats: '❤️中等 · 📏中 · 👟伴行护航 · 💥治疗脉冲', desc: '手提苍翠魂灯的金翎圣所偶，每 2.8 秒绽放生命脉冲修复周围守塔机关，混战中务必优先净化。' },
  { id: 'brute',        cat: 'normal', sprite: 'assets/spire/mob_brute.png',         icon: '🗿', name: '镇塔黑曜重锤卫',   badge: '🌑 终层·狂暴战锤',   wave: '第 3 层起',       stats: '❤️高大狂战士 · 📏高大 · 👟残血狂暴提速 · 💥前向扇形裂地锤', desc: '高大凶悍的紫曜战锤狂卫，生命低于 65% 进入红眼狂暴大幅提速，近身蓄力向前方 90° 扇形锥区猛砸裂地重锤！' },
  { id: 'juggernaut',   cat: 'normal', sprite: 'assets/spire/mob_juggernaut.png',    icon: '⛓️', name: '黑曜金锁镇狱像',   badge: '🌑 终层·超巨泰坦',   wave: '第 5 层起',       stats: '❤️超巨型泰坦 · 📏山岳巨像 · 👟极缓霸体推进 · 💥十字地裂震波', desc: '体型如山岳般巨大、移动极其沉缓的黑曜石泰坦巨像，超高血量与霸体抗退，重踏轰出远距十字四向地裂冲击与碎晶！' },
  { id: 'sand_worm',    cat: 'scene',  sprite: 'assets/spire/mob_sand_worm.png',     icon: '🕯️', name: '蚀影潜渊骨蛇',     badge: '🌑 终层·遁地破土',   wave: '第 3 层起出没',   stats: '❤️中韧奇袭 · 📏修长 · 👟遁地潜行减伤 · 💥破土骨刺震爆', desc: '钻入黑水镜面之下化作高速暗影地波潜行逼近（潜地期间减免擦伤），抵达脚下瞬间破土冲出并向斜十字迸射 4 枚骨刺！' },

  // 7 大守层先锋统领 & 6 位守誓主宰 Boss
  { id: 'mb_vanguard',  cat: 'boss',   sprite: 'assets/spire/mb_vanguard.png',          icon: '🏮', name: '雨夜守桥重铠武者',       badge: '一层先锋统领',   wave: '无尽深渊统领试炼', stats: '❤️高额统领级 · 🎁必掉遗物匣',     desc: MINI_BOSS_DEFS.vanguard.desc },
  { id: 'mb_pyro',      cat: 'boss',   sprite: 'assets/spire/mb_pyro_lord.png',         icon: '🔥', name: '赤伞焚灯祭司',           badge: '一层先锋统领',   wave: '无尽深渊统领试炼', stats: '❤️高额统领级 · 🎁必掉遗物匣',     desc: MINI_BOSS_DEFS.pyro_lord.desc },
  { id: 'mb_venom',     cat: 'boss',   sprite: 'assets/spire/mb_venom_matriarch.png',   icon: '🌿', name: '苍翠荆棘守碑姬',         badge: '古桥先锋统领',   wave: '无尽深渊统领试炼', stats: '❤️高额统领级 · 🎁必掉遗物匣',     desc: MINI_BOSS_DEFS.venom_matriarch.desc },
  { id: 'mb_glacial',   cat: 'boss',   sprite: 'assets/spire/mb_glacial_valkyrie.png',  icon: '🧊', name: '眠冬碎晶圣枪骑',         badge: '二层先锋统领',   wave: '第 6 层固定镇守',  stats: '❤️高额统领级 · 🎁必掉遗物匣',     desc: MINI_BOSS_DEFS.glacial_valkyrie.desc },
  { id: 'mb_shadow',    cat: 'boss',   sprite: 'assets/spire/mb_shadow_stalker.png',    icon: '⚡', name: '紫电提线斩首偶',         badge: '三层先锋统领',   wave: '第 10 层固定镇守', stats: '❤️高额统领级 · 🎁必掉遗物匣',     desc: MINI_BOSS_DEFS.shadow_stalker.desc },
  { id: 'mb_siren',     cat: 'boss',   sprite: 'assets/spire/mb_storm_siren.png',       icon: '🕰️', name: '逆钟星律奏鸣偶',         badge: '三层先锋统领',   wave: '第 10 层双统领协战', stats: '❤️高额统领级 · 🎁必掉遗物匣',   desc: MINI_BOSS_DEFS.storm_siren.desc },
  { id: 'mb_warden',    cat: 'boss',   sprite: 'assets/spire/mb_iron_warden.png',       icon: '🛡️', name: '黑曜镇狱金锁卫',         badge: '终层先锋统领',   wave: '第 14 层固定镇守', stats: '❤️高额统领级 · 🎁必掉遗物匣',     desc: MINI_BOSS_DEFS.iron_warden.desc },
  { id: 'b_butcher',    cat: 'boss',   sprite: 'assets/spire/hero_jinyu.png',           icon: '🦊', name: '绯红断刃剑姬 · 烬羽',    badge: '第一幕守誓主宰', wave: '第 4 层固定镇守',  stats: '❤️巨额主宰级 · 🎬专属剧场演出',   desc: BOSS_DEFS.butcher.desc },
  { id: 'b_frost',      cat: 'boss',   sprite: 'assets/spire/hero_astria.png',          icon: '❄️', name: '永冻星使 · 艾丝特莉亚',  badge: '第二幕守誓主宰', wave: '第 8 层固定镇守',  stats: '❤️巨额主宰级 · 🎬专属剧场演出',   desc: BOSS_DEFS.frost_queen.desc },
  { id: 'b_void',       cat: 'boss',   sprite: 'assets/spire/hero_jialan.png',          icon: '🕰️', name: '紫电弦月人偶 · 伽蓝',    badge: '第三幕守誓主宰', wave: '第 12 层固定镇守', stats: '❤️巨额主宰级 · 🎬专属剧场演出',   desc: BOSS_DEFS.void_weaver.desc },
  { id: 'b_mech',       cat: 'boss',   sprite: 'assets/spire/boss_mech_colossus.png',   icon: '⚙️', name: '倒悬机神 · 伽蓝重装态',  badge: '钟楼重装主宰',   wave: '无尽深渊双王镇守', stats: '❤️巨额主宰级 · 🔥双肩熔炮齐射',   desc: BOSS_DEFS.mech_colossus.desc },
  { id: 'b_plague',     cat: 'boss',   sprite: 'assets/spire/hero_qingyu.png',          icon: '🍃', name: '残羽魔女 · 青羽试炼影',  badge: '风语守誓主宰',   wave: '无尽深渊试炼幻影', stats: '❤️巨额主宰级 · 🎬专属剧场演出',   desc: BOSS_DEFS.plague_empress.desc },
  { id: 'b_solar',      cat: 'boss',   sprite: 'assets/spire/hero_eclipse.png',         icon: '🌑', name: '第999号 · 日蚀圣女',     badge: '终幕镜中真我',   wave: '第 16 层最终决战', stats: '❤️巨额主宰级 · 🎬必入神话二阶段', desc: BOSS_DEFS.solar_seraph.desc },

  // 3 大记忆祭坛召唤 Boss（无尽深渊奇遇）
  { id: 'sb_crimson',   cat: 'special', sprite: 'assets/spire/sb_crimson_lord.png',     icon: '🦊', name: '烬羽 · 第998世残响',     badge: '🏮 记忆祭坛首领', wave: '无尽深渊 · 激活雨夜断刃祭坛', stats: '🎁×1 遗物匣 + 💎30 + 满血恢复',     desc: `${SPECIAL_RELICS[0].bossDesc}<br><b>${SPECIAL_RELICS[0].rewardDesc}</b>` },
  { id: 'sb_golden',    cat: 'special', sprite: 'assets/spire/sb_golden_golem.png',     icon: '🏆', name: '黄金发条圣柜巨神',       badge: '🕰️ 记忆祭坛首领', wave: '无尽深渊 · 激活黄金逆钟星盘', stats: '💎48+ 晶石雨 + 🎁×1 遗物匣',       desc: `${SPECIAL_RELICS[1].bossDesc}<br><b>${SPECIAL_RELICS[1].rewardDesc}</b>` },
  { id: 'sb_abyss',     cat: 'special', sprite: 'assets/spire/sb_abyss_devourer.png',   icon: '👁️', name: '零号容器 · 饥饿黑影',    badge: '🌑 记忆祭坛首领', wave: '无尽深渊 · 激活黑曜蚀日残镜', stats: '🎁×1 遗物匣 + 💎26 + 永久+12%全伤', desc: `${SPECIAL_RELICS[2].bossDesc}<br><b>${SPECIAL_RELICS[2].rewardDesc}</b>` }
];

if (typeof globalThis !== 'undefined') {
  globalThis.BOSS_DEFS = BOSS_DEFS;
  globalThis.MINI_BOSS_DEFS = MINI_BOSS_DEFS;
  globalThis.SPECIAL_RELICS = SPECIAL_RELICS;
  globalThis.MONSTER_CODEX = MONSTER_CODEX;
}
