// ============================================================================
// 👑 《烬塔残响：第999次救赎》守层主宰 Boss、守誓统领 & 分层域 Q 版怪物设定数据
// ============================================================================
const BOSS_DEFS = {
  butcher: {
    id: 'butcher', icon: '🦊', sprite: 'assets/spire/hero_jinyu.png', portrait: 'assets/spire/port_jinyu.jpg',
    name: '绯红断刃剑姬 · 烬羽', epithet: '一层守桥挚友 · 第998道残火', color: '#e63946', spd: 90,
    desc: '佩戴半截白狐假面、死守雨夜孤桥九百九十八世的昔日剑卫：蓄力绯夜一闪、释放【红莲外环剑域（贴身风眼安全）】、倾泻余烬火池并唤出浪人残偶；大招后短暂喘息暴露破绽，25% 概率燃尽魂火觉醒二阶段！'
  },
  frost_queen: {
    id: 'frost_queen', icon: '❄️', sprite: 'assets/spire/hero_astria.png', portrait: 'assets/spire/port_astria.jpg',
    name: '永冻星使 · 艾丝特莉亚', epithet: '二层冰封王城之主 · 碎冕星瞳', color: '#00bbf9', spd: 84,
    desc: '遵从你千年前遗愿冰封全城子民的挚友星使：绽放螺旋霜星花瓣弹、吟唱【眠冬外环暴雪（近身风眼安全）】、凝结碎冕寒冰镜并唤出冰冠亡灵；25% 概率碎冕觉醒二阶段！'
  },
  mech_colossus: {
    id: 'mech_colossus', icon: '⚙️', sprite: 'assets/spire/mob_s4_colossus.png', portrait: 'assets/spire/port_jialan.jpg',
    name: '倒悬机神 · 伽蓝重装态', epithet: '三层逆转发条钟楼镇守者', color: '#f77f00', spd: 78,
    desc: '伽蓝操控的倒悬钟楼重装镇塔巨像：双肩发条火炮交叉齐射、倾泻滚烫【余烬熔池】改造地形、轰击星晷外环震波并投放齿轮陀螺偶；散热期暴露破绽，25% 概率超载觉醒二阶段！'
  },
  void_weaver: {
    id: 'void_weaver', icon: '🕰️', sprite: 'assets/spire/hero_jialan.png', portrait: 'assets/spire/port_jialan.jpg',
    name: '紫电弦月人偶 · 伽蓝', epithet: '三层星晷断罪少主 · 逆命傀儡师', color: '#9d4edd', spd: 86,
    desc: '头插黄金骷髅发条的毒舌人偶少主：施展逆钟折跃与紫电十字星璇、撕裂【星晷断层裂谷】重塑地形、发动虚空外环坍缩并操控紫电剑偶；25% 概率拧碎发条觉醒二阶段！'
  },
  plague_empress: {
    id: 'plague_empress', icon: '🍃', sprite: 'assets/spire/hero_qingyu.png', portrait: 'assets/spire/port_qingyu.jpg',
    name: '残羽魔女 · 青羽试炼影', epithet: '风语守望者 · 最后的温柔锁', color: '#52b788', spd: 85,
    desc: '守望九百九十九次轮回的残羽魔女幻影：旋舞双螺旋苍翠风翎弹幕、降下风蚀花雨并唤出风语灵体试炼你的决心；25% 概率展翼觉醒二阶段！'
  },
  solar_seraph: {
    id: 'solar_seraph', icon: '🌑', sprite: 'assets/spire/hero_eclipse.png', portrait: 'assets/spire/port_eclipse.jpg',
    name: '第999号 · 日蚀圣女', epithet: '终层镜中真我 · 蚀日天灾神骸', color: '#ff9f1c', spd: 88,
    desc: '端坐黑水圣所巨镜之中的你真正的神明本体：锁定黑金圣枪走廊高速贯日突刺、迸射十方日蚀裁决矛环并倾泻黑炎火池重塑镜界；第 16 层终战必定揭下黑纱觉醒【真红蚀日二阶段】！'
  }
};

const MINI_BOSS_DEFS = {
  vanguard: {
    id: 'vanguard', icon: '🏮', sprite: 'assets/spire/mob_s1_guard.png',
    name: '雨夜守桥重铠武者', epithet: '一层孤桥铁卫统领', color: '#f72585', spd: 86,
    desc: '镇守雨夜长桥桥头的重铠武者：擅长长距锁定破阵冲锋震散弹幕，并召唤坠落石灯封锁走位。'
  },
  pyro_lord: {
    id: 'pyro_lord', icon: '🔥', sprite: 'assets/spire/mob_s1_umbrella.png',
    name: '赤伞焚灯祭司', epithet: '一层余烬狂热督军', color: '#fb5607', spd: 80,
    desc: '执掌红莲魂火的祭司统领：朝前方扇形连射 5 枚绯红火球，并在脚下引爆延迟红莲新星。'
  },
  shadow_stalker: {
    id: 'shadow_stalker', icon: '⚡', sprite: 'assets/spire/mob_s3_duelist.png',
    name: '紫电提线斩首偶', epithet: '三层发条暗杀统领', color: '#7209b7', spd: 96,
    desc: '伽蓝亲手打造的极速暗杀人偶：高频长距残影疾驰突进，瞬发八方紫电飞针环。'
  },
  venom_matriarch: {
    id: 'venom_matriarch', icon: '🌿', sprite: 'assets/spire/mob_s1_ronin.png',
    name: '苍翠荆棘守碑姬', epithet: '古桥风蚀督军', color: '#80ed99', spd: 84,
    desc: '守护古桥封印碑的战姬统领：齐射三联苍翠风毒刺，布设双生风蚀预警圈并唤出残偶护卫。'
  },
  glacial_valkyrie: {
    id: 'glacial_valkyrie', icon: '🧊', sprite: 'assets/spire/mob_s2_knight.png',
    name: '眠冬碎晶圣枪骑', epithet: '二层冰封王庭近卫长', color: '#48cae4', spd: 92,
    desc: '艾丝特莉亚麾下近卫统领：架起寒霜枪骑走廊全额贯突，落点绽放六棱寒冰棱晶减速弹环。'
  },
  iron_warden: {
    id: 'iron_warden', icon: '🛡️', sprite: 'assets/spire/mob_s4_colossus.png',
    name: '黑曜镇狱金锁卫', epithet: '终层圣所重盾统领', color: '#eab308', spd: 76,
    desc: '看守日蚀黑水圣所的重盾巨卫：稳步推进投掷双旋暗金圆刃，并重踏镜面引爆震荡轰击圈。'
  },
  storm_siren: {
    id: 'storm_siren', icon: '🕰️', sprite: 'assets/spire/mob_s3_gyro.png',
    name: '逆钟星律奏鸣偶', epithet: '三层钟楼雷鸣歌姬', color: '#38bdf8', spd: 90,
    desc: '倒悬钟楼报时机关统领：化作雷光走廊疾闪突袭，降下三联落雷轰炸圈与扇形星律音刃。'
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
    bossDesc: '从黑曜石残镜溢出的天灾本源黑影：释放双螺旋蚀日弹幕、暗物质外环坍缩并分裂黑水蚀影眷属。'
  }
];

// 《烬塔残响》分场景 Q 版怪物与首领圣典图鉴（全部绑定高清透明贴图预览）
const MONSTER_CODEX = [
  // 一层·雨夜长桥怪物组
  { id: 'chaser',     cat: 'normal', sprite: 'assets/spire/mob_s1_ronin.png',    icon: '⚔️', name: '断魂浪人残偶',   badge: '🌧️ 一层·雨夜长桥', wave: '第 1 波起', stats: '❤️标准 · 📏中 · 👟常速 · 💥中', desc: '披蓑戴笠、执残断黑刀阻拦登桥者的旧王城浪人木偶。' },
  { id: 'swarmer',    cat: 'normal', sprite: 'assets/spire/mob_s1_umbrella.png', icon: '🏮', name: '绯红赤伞纸灵',   badge: '🌧️ 一层·雨夜长桥', wave: '第 1 波末起', stats: '❤️极脆 · 📏小 · 👟极快 · 💥微', desc: '趋向青焰魂灯疾飞而来的独眼赤油纸伞灵，成群飘忽，适合弹射或范围扫荡。' },
  { id: 'stalker',    cat: 'normal', sprite: 'assets/spire/mob_s1_ronin.png',    icon: '✂️', name: '折纸双刃影侍',   badge: '🌧️ 一层·雨夜长桥', wave: '第 2 波起', stats: '❤️偏脆 · 📏小 · 👟高速折线 · 💥中高', desc: '呈 Z 字折线突进的守桥影侍，贴近时会挥出凌厉双斩。' },
  { id: 'magma_imp',  cat: 'scene',  sprite: 'assets/spire/mob_s1_umbrella.png', icon: '🏮', name: '断魂赤纸伞妖',   badge: '🌧️ 一层专属精英怪', wave: '第 3 波起概率出没', stats: '❤️偏脆 · 📏小 · 👟高速 · 💥亡语火池', desc: '撑着红油纸伞在雨夜孤桥飘荡的火灵，被击碎时在原地留下一团 1.15 秒后引爆的余烬火池。' },
  { id: 'shielder',   cat: 'normal', sprite: 'assets/spire/mob_s1_guard.png',    icon: '🛡️', name: '重铠提灯守桥卫', badge: '🌧️ 一层·正面弧盾', wave: '第 4 波起', stats: '❤️高 · 📏大 · 👟沉稳 · 💥中高', desc: '正面张开结界弧盾减免 45% 伤害；火焰、贯日光束与绕侧近战可无视护盾。' },

  // 二层·永冻冰窟怪物组
  { id: 'shooter',    cat: 'normal', sprite: 'assets/spire/mob_s2_prism.png',    icon: '❄️', name: '折光霜晶浮灵',   badge: '❄️ 二层·永冻冰窟', wave: '第 2 波起', stats: '❤️偏低 · 📏中 · 👟较慢 · 💥远射', desc: '冰封王城中悬浮的六棱寒晶灵体，保持中距点射高对比寒冰棱弹。' },
  { id: 'charger',    cat: 'normal', sprite: 'assets/spire/mob_s2_knight.png',   icon: '🧊', name: '眠冬破阵冰骑',   badge: '❄️ 二层·直线冲锋', wave: '第 3 波起', stats: '❤️较高 · 📏偏大 · 👟蓄力猛冲 · 💥较高', desc: '亮起清晰寒霜冲锋走廊后 100% 满程直线贯突的重铠冰骑，切勿停留在预警轴线上。' },
  { id: 'sniper_bug', cat: 'normal', sprite: 'assets/spire/mob_s2_spider.png',   icon: '🎯', name: '寒晶织网狙偶',   badge: '❄️ 二层·远距狙击', wave: '第 3 波起', stats: '❤️偏脆 · 📏小 · 👟远距驻射 · 💥高伤', desc: '盘踞冰窟外围架设细红瞄准线短暂蓄力，射出一枚高速穿刺冰针，看到红线请及时横移！' },
  { id: 'frost_wisp', cat: 'scene',  sprite: 'assets/spire/mob_s2_prism.png',    icon: '❄️', name: '眠冬冰冠亡灵',   badge: '❄️ 二层专属精英怪', wave: '第 3 波起概率出没', stats: '❤️偏低 · 📏小 · 👟浮空 · 💥冰缓弹', desc: '凝结王城叹息的冰冠残魂，发射菱形寒冰棱晶，命中未闪避时短暂降低角色 18% 移速。' },

  // 三层·倒悬钟楼怪物组
  { id: 'bomber',     cat: 'normal', sprite: 'assets/spire/mob_s3_bomb.png',     icon: '💣', name: '裂魂发条钟摆弹', badge: '🕰️ 三层·倒悬钟楼', wave: '第 3 波起', stats: '❤️偏脆 · 📏中 · 👟较快 · 💥高爆', desc: '贴近或被击碎时点燃 1.25 秒引信并亮起红圈，剧烈自爆时也能炸伤周围发条傀儡！' },
  { id: 'spinner',    cat: 'normal', sprite: 'assets/spire/mob_s3_gyro.png',     icon: '⚙️', name: '钟楼旋刃齿轮偶', badge: '🕰️ 三层·飞轮封走位', wave: '第 4 波起', stats: '❤️中等 · 📏中大 · 👟常速 · 💥飞轮', desc: '搭载高速黄铜锯齿陀螺，周期投掷一枚旋转十字金刃飞盘封锁走位。' },
  { id: 'mortar',     cat: 'normal', sprite: 'assets/spire/mob_s3_gyro.png',     icon: '☄️', name: '发条星陨臼炮偶', badge: '🕰️ 三层·高抛红圈', wave: '第 4 波起', stats: '❤️中等 · 📏中大 · 👟慢速 · 💥红圈轰炸', desc: '远程抛射地面红圈轰炸，看到脚下红圈从容迈出即可无伤。' },
  { id: 'rad_scorpion',cat:'scene',  sprite: 'assets/spire/mob_s3_duelist.png',  icon: '⚡', name: '逆转发条剑偶',   badge: '🕰️ 三层专属精英怪', wave: '第 3 波起概率出没', stats: '❤️较高 · 📏中大 · 👟常速 · 💥三联电弹', desc: '巡弋于倒悬齿轮间的西洋刺剑发条偶，蓄力扇形齐射 3 枚高对比紫电弹。' },

  // 终层·日蚀镜界怪物组
  { id: 'splitter',   cat: 'normal', sprite: 'assets/spire/mob_s4_shade.png',    icon: '🌑', name: '黑水镜影蚀灵',   badge: '🌑 终层·日蚀镜界', wave: '第 4 波起', stats: '❤️较高 · 📏大 · 👟偏慢 · 💥分裂', desc: '日蚀黑水凝聚的镜影蚀灵，被斩碎瞬间分裂为 3 只超高速迷你黑水暗影。' },
  { id: 'summoner',   cat: 'normal', sprite: 'assets/spire/mob_s4_seraph.png',   icon: '🔮', name: '蚀日六翼唤灵偶', badge: '🌑 终层·后排唤灵', wave: '第 5 波起', stats: '❤️中等 · 📏中 · 👟偏慢 · 💥唤灵', desc: '悬浮在后排吟唱金黑日蚀法阵唤出纸灵群，建议优先突进斩首。' },
  { id: 'healer',     cat: 'normal', sprite: 'assets/spire/mob_s4_seraph.png',   icon: '💚', name: '圣所祈福炽偶',   badge: '🌑 终层·群体回血', wave: '第 6 波起', stats: '❤️中等 · 📏中 · 👟偏慢 · 💥治疗脉冲', desc: '每 2.8 秒释放圣光脉冲为周围守塔机关修复伤势，混战中务必优先净化。' },
  { id: 'brute',      cat: 'normal', sprite: 'assets/spire/mob_s4_colossus.png', icon: '🗿', name: '镇塔黑曜重卫',   badge: '🌑 终层·震地重卫', wave: '第 5 波起', stats: '❤️极高 · 📏巨型 · 👟沉重 · 💥震地波', desc: '身披黑曜金纹重甲的巨卫，贴近角色时会蓄力重踏地面震出暗金冲击波。' },
  { id: 'juggernaut', cat: 'normal', sprite: 'assets/spire/mob_s4_colossus.png', icon: '⛓️', name: '黑曜金锁镇狱像', badge: '🌑 终层·超重堡垒', wave: '第 6 波起', stats: '❤️超巨额 · 📏超巨型 · 👟极慢 · 💥毁灭', desc: '缠满黄金封魔锁链的黑曜石移动堡垒，移速极慢但压迫感极强，需集中火力融化。' },
  { id: 'sand_worm',  cat: 'scene',  sprite: 'assets/spire/mob_s4_shade.png',    icon: '🕯️', name: '蚀影潜渊暗灵',   badge: '🌑 终层专属精英怪', wave: '第 3 波起概率出没', stats: '❤️中等 · 📏中 · 👟疾行突刺 · 💥中高', desc: '潜行于黑水镜面之下的蚀影暗灵，周期亮起冲刺轴线向猎物发起满程突袭。' },

  // 7 大守层先锋统领 & 四幕固定守誓主宰 Boss
  { id: 'mb_vanguard', cat: 'boss', sprite: 'assets/spire/mob_s1_guard.png',    icon: '🏮', name: '雨夜守桥重铠武者', badge: '一层先锋统领', wave: '无尽深渊统领试炼', stats: '❤️高额统领级 · 🎁必掉遗物匣', desc: MINI_BOSS_DEFS.vanguard.desc },
  { id: 'mb_pyro',     cat: 'boss', sprite: 'assets/spire/mob_s1_umbrella.png', icon: '🔥', name: '赤伞焚灯祭司',     badge: '一层先锋统领', wave: '无尽深渊统领试炼', stats: '❤️高额统领级 · 🎁必掉遗物匣', desc: MINI_BOSS_DEFS.pyro_lord.desc },
  { id: 'mb_glacial',  cat: 'boss', sprite: 'assets/spire/mob_s2_knight.png',   icon: '🧊', name: '眠冬碎晶圣枪骑',   badge: '二层先锋统领', wave: '第 6 层固定镇守', stats: '❤️高额统领级 · 🎁必掉遗物匣', desc: MINI_BOSS_DEFS.glacial_valkyrie.desc },
  { id: 'mb_shadow',   cat: 'boss', sprite: 'assets/spire/mob_s3_duelist.png',  icon: '⚡', name: '紫电提线斩首偶',   badge: '三层先锋统领', wave: '第 10 层固定镇守', stats: '❤️高额统领级 · 🎁必掉遗物匣', desc: MINI_BOSS_DEFS.shadow_stalker.desc },
  { id: 'mb_siren',    cat: 'boss', sprite: 'assets/spire/mob_s3_gyro.png',     icon: '🕰️', name: '逆钟星律奏鸣偶',   badge: '三层先锋统领', wave: '第 10 层双统领协战', stats: '❤️高额统领级 · 🎁必掉遗物匣', desc: MINI_BOSS_DEFS.storm_siren.desc },
  { id: 'mb_warden',   cat: 'boss', sprite: 'assets/spire/mob_s4_colossus.png', icon: '🛡️', name: '黑曜镇狱金锁卫',   badge: '终层先锋统领', wave: '第 14 层固定镇守', stats: '❤️高额统领级 · 🎁必掉遗物匣', desc: MINI_BOSS_DEFS.iron_warden.desc },
  { id: 'b_butcher',   cat: 'boss', sprite: 'assets/spire/port_jinyu.jpg',      icon: '🦊', name: '绯红断刃剑姬 · 烬羽',     badge: '第一幕守誓主宰', wave: '第 4 层固定镇守', stats: '❤️巨额主宰级 · 🎬专属剧场演出', desc: BOSS_DEFS.butcher.desc },
  { id: 'b_frost',     cat: 'boss', sprite: 'assets/spire/port_astria.jpg',     icon: '❄️', name: '永冻星使 · 艾丝特莉亚',   badge: '第二幕守誓主宰', wave: '第 8 层固定镇守', stats: '❤️巨额主宰级 · 🎬专属剧场演出', desc: BOSS_DEFS.frost_queen.desc },
  { id: 'b_void',      cat: 'boss', sprite: 'assets/spire/port_jialan.jpg',     icon: '🕰️', name: '紫电弦月人偶 · 伽蓝',     badge: '第三幕守誓主宰', wave: '第 12 层固定镇守', stats: '❤️巨额主宰级 · 🎬专属剧场演出', desc: BOSS_DEFS.void_weaver.desc },
  { id: 'b_plague',    cat: 'boss', sprite: 'assets/spire/port_qingyu.jpg',     icon: '🍃', name: '残羽魔女 · 青羽试炼影',   badge: '风语守誓主宰',   wave: '无尽深渊试炼幻影', stats: '❤️巨额主宰级 · 🎬专属剧场演出', desc: BOSS_DEFS.plague_empress.desc },
  { id: 'b_solar',     cat: 'boss', sprite: 'assets/spire/port_eclipse.jpg',    icon: '🌑', name: '第999号 · 日蚀圣女',      badge: '终幕镜中真我',   wave: '第 16 层最终决战', stats: '❤️巨额主宰级 · 🎬必入神话二阶段', desc: BOSS_DEFS.solar_seraph.desc },

  // 3 大记忆祭坛召唤 Boss（无尽深渊奇遇）
  { id: 'sb_crimson',  cat: 'special', sprite: 'assets/spire/port_jinyu.jpg',   icon: '🦊', name: '烬羽 · 第998世残响',   badge: '🏮 记忆祭坛首领', wave: '无尽深渊 · 激活雨夜断刃祭坛', stats: '🎁×1 遗物匣 + 💎30 + 满血恢复', desc: `${SPECIAL_RELICS[0].bossDesc}<br><b>${SPECIAL_RELICS[0].rewardDesc}</b>` },
  { id: 'sb_golden',   cat: 'special', sprite: 'assets/spire/mob_s4_colossus.png',icon:'🏆',name: '黄金发条圣柜巨神',     badge: '🕰️ 记忆祭坛首领', wave: '无尽深渊 · 激活黄金逆钟星盘', stats: '💎48+ 晶石雨 + 🎁×1 遗物匣', desc: `${SPECIAL_RELICS[1].bossDesc}<br><b>${SPECIAL_RELICS[1].rewardDesc}</b>` },
  { id: 'sb_abyss',    cat: 'special', sprite: 'assets/spire/port_eclipse.jpg', icon: '👁️', name: '零号容器 · 饥饿黑影',  badge: '🌑 记忆祭坛首领', wave: '无尽深渊 · 激活黑曜蚀日残镜', stats: '🎁×1 遗物匣 + 💎26 + 永久+12%全伤', desc: `${SPECIAL_RELICS[2].bossDesc}<br><b>${SPECIAL_RELICS[2].rewardDesc}</b>` }
];

if (typeof globalThis !== 'undefined') {
  globalThis.BOSS_DEFS = BOSS_DEFS;
  globalThis.MINI_BOSS_DEFS = MINI_BOSS_DEFS;
  globalThis.SPECIAL_RELICS = SPECIAL_RELICS;
  globalThis.MONSTER_CODEX = MONSTER_CODEX;
}


/* SPIRE_V2_3_1_MONSTERS_START */
(function(global) {
  var bossSpecsV231 = {
    butcher:      { name: '绯红断刃剑姬 · 烬羽',   baseHp: 680,  dmgMul: 0.78, telegraphBonusSec: 0.12 },
    frost_queen:  { name: '永冻星使 · 艾丝特莉亚', baseHp: 1600, dmgMul: 1.00 },
    void_weaver:  { name: '紫电弦月人偶 · 伽蓝',   baseHp: 3000, dmgMul: 1.22, cooldownAccelerate: 0.12 },
    solar_seraph: { name: '第999号 · 日蚀圣女',    baseHp: 4900, effectiveTotalHp: 8085, dmgMul: 1.30, phase2DmgMul: 1.45 }
  };
  var pools = [global.BOSS_VARIANTS, global.BOSSES, global.MONSTER_TYPES, global.ENEMY_TYPES, global.MONSTERS];
  pools.forEach(function(pool) {
    if (!pool) return;
    if (Array.isArray(pool)) {
      pool.forEach(function(it) {
        if (!it) return;
        var k = it.id || it.variant || it.type || it.key;
        if (k && bossSpecsV231[k]) {
          it.name = bossSpecsV231[k].name;
          it.title = bossSpecsV231[k].name;
          it.v231Curve = bossSpecsV231[k];
        }
        if (k === 'spore_mother') {
          it.name = '蚀忆魂灯龛';
          it.desc = '封存前998次轮回残魂的浮空灯龛，播撒残响灵泉并召唤蚀忆子嗣（第3/7/11/15层与无尽深渊登场）。';
          it.sprite = 'assets/spire/mob_s5_reliquary.png';
          it.disabled = false;
          it.hidden = false;
        }
      });
    } else if (typeof pool === 'object') {
      Object.keys(bossSpecsV231).forEach(function(k) {
        if (pool[k]) {
          pool[k].name = bossSpecsV231[k].name;
          pool[k].title = bossSpecsV231[k].name;
          pool[k].v231Curve = bossSpecsV231[k];
        }
      });
      if (pool.spore_mother) {
        pool.spore_mother.name = '蚀忆魂灯龛';
        pool.spore_mother.desc = '封存前998次轮回残魂的浮空灯龛，播撒残响灵泉并召唤蚀忆子嗣（第3/7/11/15层与无尽深渊登场）。';
        pool.spore_mother.sprite = 'assets/spire/mob_s5_reliquary.png';
        pool.spore_mother.disabled = false;
        pool.spore_mother.hidden = false;
      }
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
/* SPIRE_V2_3_1_MONSTERS_END */
