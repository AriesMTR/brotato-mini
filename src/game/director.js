// ============================================================================
// 🎬 《烬塔残响：第999次救赎》16层全流程剧情演出与丝滑转场导演引擎 (src/game/director.js · v2.5.0)
// - 独立高分屏剧场画布 #spireDirectorCv（位于 HUD 之上，闲置时 display:none 零开销）
// - 开局三镜宽银幕序章动画（主殿可重温）、四幕全景帷幕、首领登场、四首领专属二阶段觉醒与第16层终章破晓长卷
// - 全面采用设定集【左侧二次元半身立绘】高挑双人同台舞台，支持发言微跃、神态副标、哥特雕花框与 [▶自动推进]
// ============================================================================

const SpireDirector = (function () {
  let _cv = null;
  let _ctx = null;
  let _vw = 1280;
  let _vh = 720;
  let _dpr = 1;
  let _bound = false;

  const _queue = [];
  let _cur = null;
  let _fadeOut = null; // { t, maxT } 结束时柔顺淡出回实机画面
  let _hitstopT = 0;
  let _hitstopCd = 0;
  let _slowmoT = 0;
  let _timeT = 0;
  let _autoPlay = false;
  let _skipRect = null;
  let _autoRect = null;

  // 本局已播放记录（同层战败重试不重复弹窗打断节奏）
  let _seenIntro = false;
  let _seenActCurtain = Object.create(null);
  let _seenFloorDlg = Object.create(null);
  let _seenBossIntro = Object.create(null);
  let _seenBossP2 = Object.create(null);
  let _seenBossDefeat = Object.create(null);

  // 剧场环境微粒池（雨丝 / 霜晶 / 发条金屑 / 破晓余烬，固定长度零 GC）
  const _PARTICLE_COUNT = 52;
  const _motes = [];
  for (let i = 0; i < _PARTICLE_COUNT; i++) {
    _motes.push({
      x: Math.random(),
      y: Math.random(),
      spd: 0.08 + Math.random() * 0.22,
      drift: (Math.random() - 0.5) * 0.08,
      sz: 1.4 + Math.random() * 2.6,
      phase: Math.random() * Math.PI * 2
    });
  }

  // 设定集 6 位角色左侧半身立绘与主题色配置
  const CHAR_CAST = {
    zero: {
      id: 'zero',
      name: '失忆寻光少女 · 零号白衣',
      roleTag: 'LANTERN BEARER · NO.999',
      portrait: 'assets/spire/port_zero.jpg',
      accent: '#72efdd',
      glow: 'rgba(114, 239, 221, 0.44)',
      cropTop: 0.0
    },
    jinyu: {
      id: 'jinyu',
      name: '绯红断刃剑姬 · 烬羽',
      roleTag: 'ACT I WARDEN · CRIMSON BLADE',
      portrait: 'assets/spire/port_jinyu.jpg',
      accent: '#fb7185',
      glow: 'rgba(251, 113, 133, 0.46)',
      cropTop: 0.0
    },
    astria: {
      id: 'astria',
      name: '永冻星使 · 艾丝特莉亚',
      roleTag: 'ACT II WARDEN · FROZEN ASTRA',
      portrait: 'assets/spire/port_astria.jpg',
      accent: '#7dd3fc',
      glow: 'rgba(125, 211, 252, 0.46)',
      cropTop: 0.0
    },
    jialan: {
      id: 'jialan',
      name: '紫电弦月人偶 · 伽蓝',
      roleTag: 'ACT III WARDEN · CLOCKWORK DOLL',
      portrait: 'assets/spire/port_jialan.jpg',
      accent: '#c084fc',
      glow: 'rgba(192, 132, 252, 0.46)',
      cropTop: 0.0
    },
    qingyu: {
      id: 'qingyu',
      name: '残羽风语魔女 · 青羽',
      roleTag: 'WIND WHISPERER · WAYFARER',
      portrait: 'assets/spire/port_qingyu.jpg',
      accent: '#6ee7b7',
      glow: 'rgba(110, 231, 183, 0.46)',
      cropTop: 0.0
    },
    eclipse: {
      id: 'eclipse',
      name: '第999号 · 日蚀圣女',
      roleTag: 'FINAL ECLIPSE · MIRROR TRUE SELF',
      portrait: 'assets/spire/port_eclipse.jpg',
      accent: '#fcd34d',
      glow: 'rgba(252, 211, 77, 0.50)',
      cropTop: 0.0
    }
  };

  // 序章开场三镜宽银幕动画（黑雨石棺苏醒 -> 仰望十六层灰塔 -> 踏上绯红雨夜长桥）
  const OPENING_SHOTS = [
    {
      img: 'assets/spire/cut_intro_1.jpg',
      fallback: 'assets/spire/logo_banner.jpg',
      kicker: 'PROLOGUE · AWAKENING OF THE 999TH SHELL',
      chapter: '序幕 · 第九百九十九次苏醒',
      duration: 4.3,
      zoomFrom: 1.02, zoomTo: 1.075, panX: -12, panY: -6,
      mood: 'rain',
      text: '黑雨漫过冰冷的灰烬浅滩。第九百九十九次，你在崩裂的石棺旁睁开眼——记不起姓名，唯有眼角残留着一滴温热的泪。'
    },
    {
      img: 'assets/spire/cut_intro_2.jpg',
      fallback: 'assets/spire/scene_1_vista.jpg',
      kicker: 'ECHOES OF THE SIXTEEN-FLOOR SPIRE',
      chapter: '序幕 · 刺破黑日的十六层孤塔',
      duration: 4.4,
      zoomFrom: 1.06, zoomTo: 1.015, panX: 10, panY: -10,
      mood: 'ember',
      text: '掌心残缺的青铜魂灯摇曳着微弱青焰，照亮苍穹下倒悬黑日的十六层巨塔——那是囚禁着千年轮回的「烬塔」。'
    },
    {
      img: 'assets/spire/cut_intro_3.jpg',
      fallback: 'assets/spire/scene_1_vista.jpg',
      kicker: 'FOUR GENTLE LOCKS · ONE THOUSANDTH DAWN',
      chapter: '序幕 · 提灯入塔与四把温柔的锁',
      duration: 4.3,
      zoomFrom: 1.015, zoomTo: 1.07, panX: 0, panY: -8,
      mood: 'rain',
      text: '风中传来四位故人温柔而决绝的叹息。推开沉重的塔门吧——踏过十六层试炼，去解开你亲手系上的千年枷锁。'
    }
  ];

  // 四幕开启全景帷幕（第 1 / 5 / 9 / 13 层丝滑横移转场，零生硬印章）
  const ACT_CURTAINS = {
    1: {
      actLabel: 'ACT I · FLOORS 01 — 04',
      title: '第一幕 · 绯红雨夜长桥',
      sub: '断刃狐面守长夜 · 旧卫执戟拦故人',
      img: 'assets/spire/scene_1_vista.jpg',
      accent: '#fb7185',
      mood: 'rain',
      duration: 2.55
    },
    5: {
      actLabel: 'ACT II · FLOORS 05 — 08',
      title: '第二幕 · 永冻星霜冰窟',
      sub: '子夜银表凝旧雪 · 碎冕星使守寒棺',
      img: 'assets/spire/scene_2_vista.jpg',
      accent: '#7dd3fc',
      mood: 'snow',
      duration: 2.55
    },
    9: {
      actLabel: 'ACT III · FLOORS 09 — 12',
      title: '第三幕 · 倒悬发条钟楼',
      sub: '黄金齿轮逆时转 · 弦月人偶校弑神',
      img: 'assets/spire/scene_3_vista.jpg',
      accent: '#c084fc',
      mood: 'clock',
      duration: 2.55
    },
    13: {
      actLabel: 'FINAL ACT · FLOORS 13 — 16',
      title: '终幕 · 日蚀黑水镜界',
      sub: '九百九十八道倒影之上 · 直面镜中真我',
      img: 'assets/spire/scene_4_vista.jpg',
      accent: '#fcd34d',
      mood: 'dawn',
      duration: 2.75
    }
  };

  // 1~16 层深度打磨三拍起承转合双人半身立绘剧本（带神态情绪副标，细腻勾勒《提灯少女与四把温柔的锁》）
  const FLOOR_DIALOGUES = {
    1: {
      plaque: '第 1 / 16 层 · 雨夜长桥 · 初踏孤桥',
      mood: 'rain',
      lines: [
        { char: 'jinyu',  side: 'right', emotion: '隔雨低语', speaker: '绯红断刃剑姬 · 烬羽', text: '「停步吧，提灯的白衣人……脚下这座雨夜长桥的每一块青石，都浸着你前九百九十八次碎裂的魂火。」' },
        { char: 'zero',   side: 'left',  emotion: '紧握提灯', speaker: '失忆寻光少女 · 零号白衣', text: '「虽然我还记不起你的名字，可掌心的青焰一听到你的声音，就像重逢故人一样温暖地跳动起来。」' },
        { char: 'qingyu', side: 'right', emotion: '轻叹引路', speaker: '残羽风语魔女 · 青羽', text: '「若遇密集弹雨，记得按下【空格 / 瞬步】化作青焰穿空而过——我在每一层的风亭为你备好了行装。」' }
      ]
    },
    2: {
      plaque: '第 2 / 16 层 · 雨夜长桥 · 旧卫残影',
      mood: 'rain',
      lines: [
        { char: 'zero',  side: 'left',  emotion: '驻足凝视', speaker: '失忆寻光少女 · 零号白衣', text: '「桥面上巡弋的赤伞与披甲残偶……它们的刀势并无憎恨，倒像在笨拙地劝我回头。」' },
        { char: 'jinyu', side: 'right', emotion: '黯然垂眸', speaker: '绯红断刃剑姬 · 烬羽', text: '「那是千年前随我戍守王城的近卫遗魂。哪怕只剩空壳，它们也记得当初发誓要护住的那个傻瓜。」' },
        { char: 'zero',  side: 'left',  emotion: '轻声起誓', speaker: '失忆寻光少女 · 零号白衣', text: '「那就由我的灯火替它们解开漫长的夜哨吧——辛苦了，旧日的守卫们。」' }
      ]
    },
    3: {
      plaque: '第 3 / 16 层 · 雨夜长桥 · 狐面血誓',
      mood: 'rain',
      lines: [
        { char: 'qingyu', side: 'right', emotion: '神色忧切', speaker: '残羽风语魔女 · 青羽', text: '「雨势变急了！第四层桥尾便是烬羽的镇守之地——她总戴着那副裂痕累累的白狐面具，从不肯露脸。」' },
        { char: 'zero',   side: 'left',  emotion: '微微一怔', speaker: '失忆寻光少女 · 零号白衣', text: '「是因为……不想让我看见她挥刀时的眼神吗？」' },
        { char: 'qingyu', side: 'right', emotion: '低声苦笑', speaker: '残羽风语魔女 · 青羽', text: '「那孩子嘴硬心软了一千年。当心她的『千雨十字裂』，看准收刀破绽贴近风眼，别让她再独自哭泣了。」' }
      ]
    },
    4: {
      plaque: '第 4 / 16 层 · 第一幕决战 · 断刃守桥',
      mood: 'rain',
      lines: [
        { char: 'jinyu', side: 'right', emotion: '拔刀横桥', speaker: '绯红断刃剑姬 · 烬羽', text: '「终究还是走到了我面前……听好了零号，就算被你恨一辈子，我今天也绝不放你去塔顶当修补封印的柴薪！」' },
        { char: 'zero',  side: 'left',  emotion: '目光澄澈', speaker: '失忆寻光少女 · 零号白衣', text: '「你的断刃在悲鸣，烬羽。我不是去赴死的——我是来带你一起走出这场千年夜雨的！」' },
        { char: 'jinyu', side: 'right', emotion: '狐面燃焰', speaker: '绯红断刃剑姬 · 烬羽', text: '「少说大话了！想过去，就先接下我这九百九十九世磨出的绯红绝剑！」' }
      ]
    },
    5: {
      plaque: '第 5 / 16 层 · 永冻冰窟 · 霜风圣堂',
      mood: 'snow',
      lines: [
        { char: 'astria', side: 'right', emotion: '霜音轻叹', speaker: '永冻星使 · 艾丝特莉亚', text: '「连烬羽滚烫的赤红剑魂，最终也甘愿融进了你的提灯里……欢迎来到时间静止的永冻冰窟，我最挂念的挚友。」' },
        { char: 'zero',   side: 'left',  emotion: '轻抚魂灯', speaker: '失忆寻光少女 · 零号白衣', text: '「烬羽的余烬很暖，替我驱散了冰窟刺骨的寒气……艾丝特莉亚，你也在这里守了一千年吗？」' },
        { char: 'astria', side: 'right', emotion: '温柔低语', speaker: '永冻星使 · 艾丝特莉亚', text: '「留在这片纯白冰镜里吧。没有痛苦，没有离别，也不必再面对第十六层残酷的黎明。」' }
      ]
    },
    6: {
      plaque: '第 6 / 16 层 · 永冻冰窟 · 子夜银表',
      mood: 'snow',
      lines: [
        { char: 'astria', side: 'right', emotion: '凝望怀表', speaker: '永冻星使 · 艾丝特莉亚', text: '「还记得这枚停在子夜零点的银怀表吗？千年前你骗我说去去就回，把怀表塞进我手心，转身就锁上了高塔。」' },
        { char: 'zero',   side: 'left',  emotion: '心口微痛', speaker: '失忆寻光少女 · 零号白衣', text: '「所以你才冻结了整座王城的光阴……只为了让『失去挚友的明天』永远不要到来……」' },
        { char: 'astria', side: 'right', emotion: '冰晶流转', speaker: '永冻星使 · 艾丝特莉亚', text: '「若不肯停下脚步，我座下的眠冬铁骑与极光棱镜便会替我留住你。」' }
      ]
    },
    7: {
      plaque: '第 7 / 16 层 · 永冻冰窟 · 温柔寒锁',
      mood: 'snow',
      lines: [
        { char: 'qingyu', side: 'right', emotion: '拂去雪花', speaker: '残羽风语魔女 · 青羽', text: '「当年黑日天灾降临，是你流着血泪恳求我们四人从外侧设下四重封锁，绝不许任何人放塔底的善念上去送死。」' },
        { char: 'zero',   side: 'left',  emotion: '豁然怔住', speaker: '失忆寻光少女 · 零号白衣', text: '「原来拦路虎从来不是敌人……你们四个人，是我当年亲手托付的『四把温柔的锁』！」' },
        { char: 'qingyu', side: 'right', emotion: '展颜轻笑', speaker: '残羽风语魔女 · 青羽', text: '「终于想起来一点啦？前面第八层艾丝特莉亚会展开『六棱极光阵』，借冰面加速拉扯，去融化她的心结吧！」' }
      ]
    },
    8: {
      plaque: '第 8 / 16 层 · 第二幕决战 · 碎冕挽歌',
      mood: 'snow',
      lines: [
        { char: 'astria', side: 'right', emotion: '星冕高悬', speaker: '永冻星使 · 艾丝特莉亚', text: '「再往上走，等待你的便是血淋淋的真相了……若言语留不住你，便让我以极光冰棺将你拥入永恒安眠！」' },
        { char: 'zero',   side: 'left',  emotion: '高举青灯', speaker: '失忆寻光少女 · 零号白衣', text: '「停在零点的怀表换不回春天，艾丝特莉亚——今天我要亲手拨动指针，和你一起走向明天！」' },
        { char: 'astria', side: 'right', emotion: '冰泪微光', speaker: '永冻星使 · 艾丝特莉亚', text: '「那就用你的光芒，试着击碎我冠冕上的千年寒星吧！」' }
      ]
    },
    9: {
      plaque: '第 9 / 16 层 · 倒悬钟楼 · 逆时发条',
      mood: 'clock',
      lines: [
        { char: 'jialan', side: 'right', emotion: '发条轻响', speaker: '紫电弦月人偶 · 伽蓝', text: '「滴答、滴答——第 999 号白衣个体踏入倒悬钟楼，比第 998 次快了整整四点二秒，勉强算你有长进。」' },
        { char: 'zero',   side: 'left',  emotion: '仰望巨钟', speaker: '失忆寻光少女 · 零号白衣', text: '「漫天黄铜齿轮都在逆向轰鸣……伽蓝，你一直在钟楼顶层数着我每一次轮回的脚步声吗？」' },
        { char: 'jialan', side: 'right', emotion: '偏头轻哼', speaker: '紫电弦月人偶 · 伽蓝', text: '「哼，我只是在进行严谨的机关观测！善用场上的双生星晷裂隙门，被齿轮碾碎了我可不会替你收尸。」' }
      ]
    },
    10: {
      plaque: '第 10 / 16 层 · 倒悬钟楼 · 舍身铸偶',
      mood: 'clock',
      lines: [
        { char: 'qingyu', side: 'right', emotion: '心疼轻叹', speaker: '残羽风语魔女 · 青羽', text: '「别看伽蓝说话带刺——从前她连擦破手指都要掉眼泪，却为了熬过漫长千年，亲手舍弃血肉把灵魂封进了冰冷的发条人偶。」' },
        { char: 'jialan', side: 'right', emotion: '紫电微闪', speaker: '紫电弦月人偶 · 伽蓝', text: '「青羽你闭嘴啦！……血肉之躯怎熬得住九百九十九次绝望？唯有紫电与精钢，才能替这笨蛋算出一线弑神生机！」' },
        { char: 'zero',   side: 'left',  emotion: '眼眶微热', speaker: '失忆寻光少女 · 零号白衣', text: '「谢谢你，伽蓝……这一次，我绝不会再让你的演算白费。」' }
      ]
    },
    11: {
      plaque: '第 11 / 16 层 · 倒悬钟楼 · 灰烬演算',
      mood: 'clock',
      lines: [
        { char: 'zero',   side: 'left',  emotion: '认真追问', speaker: '失忆寻光少女 · 零号白衣', text: '「伽蓝，既然你也渴望破局，为什么前九百九十八个走到这里的我，最后仍然化作了灰烬？」' },
        { char: 'jialan', side: 'right', emotion: '金瞳凝重', speaker: '紫电弦月人偶 · 伽蓝', text: '「因为过去的你总想独自背负一切，推开同伴独自献祭！孤身一人的微光，永远斩不断第十六层的黑日神躯。」' },
        { char: 'jialan', side: 'right', emotion: '弦月充能', speaker: '紫电弦月人偶 · 伽蓝', text: '「来第十二层星晷断罪台吧——接下我的『十二刻逆时针』，向我证明这一世的你学会依靠伙伴了！」' }
      ]
    },
    12: {
      plaque: '第 12 / 16 层 · 第三幕决战 · 星晷校准',
      mood: 'clock',
      lines: [
        { char: 'jialan', side: 'right', emotion: '限制全解', speaker: '紫电弦月人偶 · 伽蓝', text: '「黄金发条心核过载解除！听好了大笨蛋——斩不断我这轮紫电弦月，我就算拼到齿轮崩碎也会把你留在钟楼！」' },
        { char: 'zero',   side: 'left',  emotion: '赤蓝辉映', speaker: '失忆寻光少女 · 零号白衣', text: '「烬羽的赤烬与艾丝特莉亚的星霜都在灯中回应你——伽蓝，看清我们共同的答案吧！」' },
        { char: 'jialan', side: 'right', emotion: '扬唇迎战', speaker: '紫电弦月人偶 · 伽蓝', text: '「那就放马过来——开始最终弑神校准！」' }
      ]
    },
    13: {
      plaque: '第 13 / 16 层 · 日蚀镜界 · 黑水倒影',
      mood: 'dawn',
      lines: [
        { char: 'eclipse', side: 'right', emotion: '镜渊回响', speaker: '第999号 · 日蚀圣女', text: '「终于踏上黑水圣所了吗，我渺小而天真的半身……低头看看脚下的黑水，那九百九十八道苍白倒影皆是你我。」' },
        { char: 'zero',    side: 'left',  emotion: '瞳孔震动', speaker: '失忆寻光少女 · 零号白衣', text: '「一模一样的容颜与心跳……原来囚禁在第十六层王座上吞咽黑日天灾的怪物，一直都是千年前的我！」' },
        { char: 'eclipse', side: 'right', emotion: '冷寂垂眸', speaker: '第999号 · 日蚀圣女', text: '「乖乖熄灭提灯融回我体内吧。唯有继续封闭神躯，人间才不会在黑日崩塌中毁灭。」' }
      ]
    },
    14: {
      plaque: '第 14 / 16 层 · 日蚀镜界 · 四把温柔的锁',
      mood: 'dawn',
      lines: [
        { char: 'qingyu', side: 'right', emotion: '泪光闪烁', speaker: '残羽风语魔女 · 青羽', text: '「千年前你独自吞下黑日天灾后神志受蚀，在彻底迷失前剥出最后一缕纯净善念抛下塔底，成了每一次苏醒的『零号』。」' },
        { char: 'zero',   side: 'left',  emotion: '温柔释然', speaker: '失忆寻光少女 · 零号白衣', text: '「而烬羽守桥、星使封冻、伽蓝铸偶、青羽化风行商……你们守望千年，只是不忍看我一次次烧尽善念修补牢笼。」' },
        { char: 'qingyu', side: 'right', emotion: '翠羽生辉', speaker: '残羽风语魔女 · 青羽', text: '「这一次不一样了！把我的苍翠风羽也收进魂灯里吧——四锁合一，去把塔顶那个孤单了千年的自己救出来！」' }
      ]
    },
    15: {
      plaque: '第 15 / 16 层 · 日蚀镜界 · 破晓前夜',
      mood: 'dawn',
      lines: [
        { char: 'eclipse', side: 'right', emotion: '金芒威压', speaker: '第999号 · 日蚀圣女', text: '「执迷不悟！你竟带着她们四人的魂火强闯至此……难道不怕封印破碎、万劫不复吗？！」' },
        { char: 'zero',    side: 'left',  emotion: '四色燃灯', speaker: '失忆寻光少女 · 零号白衣', text: '「靠牺牲一个人换来的虚假长夜，算不上真正的救世！这一次，我们要连同黑日天灾的根源一并斩碎！」' },
        { char: 'qingyu',  side: 'right', emotion: '并肩祝福', speaker: '残羽风语魔女 · 青羽', text: '「跨过最后这片黑曜裂谷就是第十六层王座了——去吧零号，我们在第一千道黎明等你！」' }
      ]
    },
    16: {
      plaque: '第 16 / 16 层 · 终幕真我决战 · 第999次救赎',
      mood: 'dawn',
      lines: [
        { char: 'eclipse', side: 'right', emotion: '荆棘王冠', speaker: '第999号 · 日蚀圣女', text: '「九百九十八次轮回皆归尘土，我早已在无边黑暗中替世人背负了一切！事到如今，谁也无法改写神罚的结局！」' },
        { char: 'zero',    side: 'left',  emotion: '破晓拔剑', speaker: '失忆寻光少女 · 零号白衣', text: '「抬起头看看这盏四色辉光的提灯吧，另一个我——烬羽、星使、伽蓝与青羽从未抛下我们！」' },
        { char: 'zero',    side: 'left',  emotion: '斩破长夜', speaker: '失忆寻光少女 · 零号白衣', text: '「漫长的独囚到此为止了——接招吧，随我一起轰开第一千道破晓！」' }
      ]
    }
  };

  // 四幕固定首领战前宽银幕 3 镜动画（纯净交叉溶解运镜，零生硬印章）
  const BOSS_ENTRANCES = {
    4: {
      chapter: 'ACT I CLIMAX · 绯红断刃剑姬 · 烬羽',
      mood: 'rain',
      accent: '#fb7185',
      shots: [
        { img: 'assets/spire/cut_act1_1.jpg', duration: 2.4, zoomFrom: 1.02, zoomTo: 1.07, panX: -10, panY: -4, text: '暴雨敲打着残破的白狐面具，红衣剑姬独自伫立在长桥尽头，指节因紧握刀柄而泛白。' },
        { img: 'assets/spire/cut_act1_2.jpg', duration: 2.4, zoomFrom: 1.06, zoomTo: 1.01, panX: 10, panY: -6, text: '「九百九十八个雨夜，每一次看你提灯走来，我的心都会再碎一次——」' },
        { img: 'assets/spire/cut_act1_3.jpg', duration: 2.6, zoomFrom: 1.01, zoomTo: 1.08, panX: 0, panY: -8, text: '「想踏过第一幕长桥，就用你的剑锋斩开我这柄绯红断刃吧！」' }
      ]
    },
    8: {
      chapter: 'ACT II CLIMAX · 永冻星使 · 艾丝特莉亚',
      mood: 'snow',
      accent: '#7dd3fc',
      shots: [
        { img: 'assets/spire/cut_act2_1.jpg', duration: 2.4, zoomFrom: 1.02, zoomTo: 1.07, panX: 10, panY: -5, text: '极光穿透冰封圣堂的穹顶，停滞在子夜零点的银怀表在星使胸前泛起微澜。' },
        { img: 'assets/spire/cut_act2_2.jpg', duration: 2.4, zoomFrom: 1.07, zoomTo: 1.02, panX: -10, panY: -6, text: '「这片寂静无痛的永冻冰原，是我能为你筑起的最后一座避风港——」' },
        { img: 'assets/spire/cut_act2_3.jpg', duration: 2.6, zoomFrom: 1.01, zoomTo: 1.08, panX: 0, panY: -8, text: '「若你执意迈向黎明，便先击碎我冠冕上的千年寒星吧！」' }
      ]
    },
    12: {
      chapter: 'ACT III CLIMAX · 紫电弦月人偶 · 伽蓝',
      mood: 'clock',
      accent: '#c084fc',
      shots: [
        { img: 'assets/spire/cut_act3_1.jpg', duration: 2.4, zoomFrom: 1.02, zoomTo: 1.07, panX: -10, panY: -6, text: '倒悬钟楼的万千黄铜齿轮轰然逆转，人偶少主眼底燃起刺破苍穹的紫电弧光。' },
        { img: 'assets/spire/cut_act3_2.jpg', duration: 2.4, zoomFrom: 1.06, zoomTo: 1.01, panX: 10, panY: -4, text: '「我把凡人的软弱连同心脏一起摘除，只为在今天替你完成最后一次弑神校准——」' },
        { img: 'assets/spire/cut_act3_3.jpg', duration: 2.6, zoomFrom: 1.01, zoomTo: 1.08, panX: 0, panY: -8, text: '「来吧第 999 号！让我看看你与伙伴们的羁绊，能否超越神的算计！」' }
      ]
    },
    16: {
      chapter: 'FINAL CLIMAX · 第999号 · 日蚀圣女',
      mood: 'dawn',
      accent: '#fcd34d',
      shots: [
        { img: 'assets/spire/cut_act4_1.jpg', duration: 2.5, zoomFrom: 1.02, zoomTo: 1.07, panX: 0, panY: -8, text: '黑水圣所寂静无声，高悬的黑曜石巨镜之中，头戴荆棘黑纱的神明缓缓睁开金瞳。' },
        { img: 'assets/spire/cut_act4_2.jpg', duration: 2.5, zoomFrom: 1.07, zoomTo: 1.02, panX: -8, panY: -5, text: '「九百九十八次轮回皆归灰烬，我早已习惯在永恒孤寂中独自吞咽天灾——」' },
        { img: 'assets/spire/cut_act4_3.jpg', duration: 2.7, zoomFrom: 1.01, zoomTo: 1.085, panX: 0, panY: -8, text: '「既然你不肯向宿命低头，那便在终幕日蚀之下与我决一死战吧！」' }
      ]
    }
  };

  // 四大固定首领专属二阶段【神话觉醒】对话（第 16 层日蚀圣女 100% 触发，第 4/8/12 层高厄度觉醒各有专属演出！）
  const BOSS_PHASE2_DIALOGUES = {
    butcher: {
      plaque: '第 4 层 · 断刃燃魂 · 绯红二阶段觉醒',
      mood: 'ember',
      lines: [
        { char: 'jinyu', side: 'right', emotion: '狐面碎裂', speaker: '绯红断刃剑姬 · 烬羽（燃魂真姿）', text: '「好锋利的剑意……既然普通刀势拦不住你，我便燃尽这身护城残血，看你能否接下真正的『千雨绯莲』！」' },
        { char: 'zero',  side: 'left',  emotion: '迎锋而上', speaker: '失忆寻光少女 · 零号白衣',         text: '「我看到了面具后你的泪水，烬羽——这一剑，我一定正面接下！」' }
      ]
    },
    frost_queen: {
      plaque: '第 8 层 · 怀表逆鸣 · 极光二阶段觉醒',
      mood: 'snow',
      lines: [
        { char: 'astria', side: 'right', emotion: '极光暴走', speaker: '永冻星使 · 艾丝特莉亚（碎冕真姿）', text: '「银怀表的指针……竟然在发烫颤动？！不，我还不能放你孤身走入深渊——极光星霜，全数解放！」' },
        { char: 'zero',   side: 'left',  emotion: '青焰炽盛', speaker: '失忆寻光少女 · 零号白衣',           text: '「别再独自承受寒冷了，艾丝特莉亚——穿过这场暴风雪，我来握住你的手！」' }
      ]
    },
    void_weaver: {
      plaque: '第 12 层 · 超限演算 · 紫电二阶段觉醒',
      mood: 'clock',
      lines: [
        { char: 'jialan', side: 'right', emotion: '金芯超载', speaker: '紫电弦月人偶 · 伽蓝（零式超载）', text: '「警报、警报——心核温度突破临界！哈哈，痛快！那就赌上我这具人偶的最后一根发条，陪你疯到底！」' },
        { char: 'zero',   side: 'left',  emotion: '目光如炬', speaker: '失忆寻光少女 · 零号白衣',         text: '「来吧伽蓝！让我们一起把胜率推向百分之百！」' }
      ]
    },
    solar_seraph: {
      plaque: '第 16 层 · 二阶段神话觉醒 · 黑镜崩裂',
      mood: 'dawn',
      lines: [
        { char: 'eclipse', side: 'right', emotion: '黑镜震裂', speaker: '第999号 · 日蚀圣女（真我破茧）', text: '「不可能……囚禁我千年的黑曜石神镜，竟被你们四人的魂火生生震裂了？！这股令人想落泪的暖意究竟是什么……！」' },
        { char: 'zero',    side: 'left',  emotion: '四锁共鸣', speaker: '失忆寻光少女 · 零号白衣',         text: '「这是烬羽、艾丝特莉亚、伽蓝与青羽跨越千年的爱与守望！醒来吧另一个我——斩断最后的黑日天灾！」' }
      ]
    },
    default: {
      plaque: '守誓共鸣 · 隐藏神话二阶段觉醒',
      mood: 'ember',
      lines: [
        { char: 'zero', side: 'left', emotion: '凝神破阵', speaker: '失忆寻光少女 · 零号白衣', text: '「守誓者的残响彻底沸腾了……稳住呼吸，善用瞬步穿过风暴中心斩断执念！」' }
      ]
    }
  };

  // 四幕固定首领击败救赎 CG + 左侧半身立绘温情告别对话（第 16 层升级为 4 镜破晓终章长卷 + 六人守誓群像大团圆谢幕！）
  const BOSS_DEFEATS = {
    4: {
      chapter: 'ACT I REDEMPTION · 断刃释然 · 赤烬托付',
      mood: 'ember',
      accent: '#fb7185',
      shots: [
        { img: 'assets/spire/cut_defeat_act1_1.jpg', duration: 2.7, zoomFrom: 1.04, zoomTo: 1.0, panX: -6, panY: -4, text: '残红太刀化作漫天流萤，半截白狐面具滑落雨洼，露出剑姬久违而释然的温柔笑颜。' },
        { img: 'assets/spire/cut_defeat_act1_2.jpg', duration: 2.7, zoomFrom: 1.0, zoomTo: 1.05, panX: 6, panY: -6, text: '一缕滚烫的绯红剑魂轻轻飘入你的青铜提灯，将冰冷的夜雨映照得温暖明亮。' }
      ],
      farewell: {
        plaque: '第一把锁解开 · 烬羽的赤烬托付',
        mood: 'ember',
        lines: [
          { char: 'jinyu', side: 'right', emotion: '释然浅笑', speaker: '绯红断刃剑姬 · 烬羽',     text: '「原来摘下面具面对你的感觉，这么轻松啊……这一世你的剑光既温柔又强大，我已经没有什么可担心的了。」' },
          { char: 'zero',  side: 'left',  emotion: '双手捧灯', speaker: '失忆寻光少女 · 零号白衣', text: '「谢谢你替我守了九百九十八个雨夜，烬羽。先在温暖的灯火里歇一歇吧，破晓时我一定带你去看晴空。」' },
          { char: 'jinyu', side: 'right', emotion: '化烬入灯', speaker: '绯红断刃剑姬 · 烬羽',     text: '「嗯，一言为定！带着我的赤烬往上走吧——替我向冰窟里死心眼的艾丝特莉亚问好。」' }
        ]
      }
    },
    8: {
      chapter: 'ACT II REDEMPTION · 怀表重鸣 · 冰冕化星',
      mood: 'snow',
      accent: '#7dd3fc',
      shots: [
        { img: 'assets/spire/cut_defeat_act2_1.jpg', duration: 2.7, zoomFrom: 1.04, zoomTo: 1.0, panX: 6, panY: -4, text: '停滞千年的银色怀表重新滴答跳动，漫天寒霜化作温润的极光星尘升入穹顶。' },
        { img: 'assets/spire/cut_defeat_act2_2.jpg', duration: 2.7, zoomFrom: 1.0, zoomTo: 1.05, panX: -6, panY: -6, text: '冰封王座悄然消融，澄澈的蔚蓝星辉汇入魂灯，与烬羽的绯红余烬交相辉映。' }
      ],
      farewell: {
        plaque: '第二把锁解开 · 艾丝特莉亚的星霜祈愿',
        mood: 'snow',
        lines: [
          { char: 'astria', side: 'right', emotion: '冰泪融化', speaker: '永冻星使 · 艾丝特莉亚',   text: '「听，怀表的秒针重新走动了……原来眼泪融化在脸颊上，是这么久违而温热的感觉。」' },
          { char: 'zero',   side: 'left',  emotion: '温柔拭泪', speaker: '失忆寻光少女 · 零号白衣', text: '「让你独自在零点的寒夜里等了这么久，对不起，艾丝特莉亚。从今往后，我们的时间一起向前走。」' },
          { char: 'astria', side: 'right', emotion: '星辉入灯', speaker: '永冻星使 · 艾丝特莉亚',   text: '「收下我的极光星冕吧，挚友。去倒悬钟楼唤醒伽蓝——那孩子嘴上不说，其实比谁都盼着你赢。」' }
        ]
      }
    },
    12: {
      chapter: 'ACT III REDEMPTION · 心核停摆 · 黄金校准',
      mood: 'clock',
      accent: '#c084fc',
      shots: [
        { img: 'assets/spire/cut_defeat_act3_1.jpg', duration: 2.7, zoomFrom: 1.04, zoomTo: 1.0, panX: -6, panY: -4, text: '狂暴的紫电弧光温柔敛去，倒悬钟楼千万齿轮齐声顺向鸣响，为你让开通往天顶的阶梯。' },
        { img: 'assets/spire/cut_defeat_act3_2.jpg', duration: 2.7, zoomFrom: 1.0, zoomTo: 1.05, panX: 6, panY: -6, text: '人偶少主微笑着抛出一枚滚烫的黄金发条心核，化作璀璨金芒融入你的提灯。' }
      ],
      farewell: {
        plaque: '第三把锁解开 · 伽蓝的满分答卷',
        mood: 'clock',
        lines: [
          { char: 'jialan', side: 'right', emotion: '欣慰展颜', speaker: '紫电弦月人偶 · 伽蓝',     text: '「最终弑神校准完毕……第 999 次破局胜率，百分之百！不愧是我等了一千年的大笨蛋。」' },
          { char: 'zero',   side: 'left',  emotion: '紧接金芯', speaker: '失忆寻光少女 · 零号白衣', text: '「这枚发条心核还带着你的温度……伽蓝，等斩碎黑日之后，我们去找青羽给你泡最甜的热红茶！」' },
          { char: 'jialan', side: 'right', emotion: '傲娇灿笑', speaker: '紫电弦月人偶 · 伽蓝',     text: '「这可是你说的，少放一块方糖我都不依！冲上去吧零号，把第十六层的黑日彻底轰成碎片！」' }
        ]
      }
    },
    16: {
      chapter: 'TRUE ENDING · 第1000道破晓 · 宿命圆满长卷',
      mood: 'dawn',
      accent: '#fcd34d',
      shots: [
        { img: 'assets/spire/cut_defeat_act4_1.jpg', duration: 2.9, zoomFrom: 1.04, zoomTo: 1.0, panX: 0, panY: -5, text: '黑曜石巨镜轰然化作亿万晶蝶，四色魂火贯穿千年天灾诅咒，镜中的日蚀圣女流下清泪，与你紧拥合一。' },
        { img: 'assets/spire/cut_defeat_act4_2.jpg', duration: 2.9, zoomFrom: 1.0, zoomTo: 1.05, panX: 0, panY: -8, text: '倒悬千年的黑日裂开万丈金霞——雨夜长桥的阴霾散尽，冰窟化作花海，钟楼敲响了清晨的第一声钟鸣。' },
        { img: 'assets/spire/scene_1_vista.jpg',    duration: 2.8, zoomFrom: 1.05, zoomTo: 1.01, panX: 10, panY: -4, text: '第 998 次以前的悲伤灰烬在晨风中化作漫天白羽，十六层孤塔终于卸下囚笼的使命，沐浴在金色朝阳之下。' },
        { img: 'assets/spire/logo_banner.jpg',      duration: 3.1, zoomFrom: 1.01, zoomTo: 1.06, panX: 0, panY: -6, text: '《烬塔残响》终章落幕——第九百九十九次救赎圆满达成，欢迎来到没有天灾的第一千个黎明！' }
      ],
      farewell: {
        plaque: '终章谢幕 · 第一千道黎明与故人重逢',
        mood: 'dawn',
        lines: [
          { char: 'eclipse', side: 'right', emotion: '含泪微笑', speaker: '日蚀圣女 · 归真之我',     text: '「原来不必独自毁灭，也能迎来如此灿烂的晨光……谢谢你穿过十六层风雨来拥抱我，第 999 次的我。」' },
          { char: 'jinyu',   side: 'right', emotion: '卸下面具', speaker: '绯红断刃剑姬 · 烬羽',     text: '「喂，零号！长桥上的雨真的停了——以后我的太刀不用再斩故人，只用来替大家劈柴生火啦！」' },
          { char: 'astria',  side: 'right', emotion: '怀表轻鸣', speaker: '永冻星使 · 艾丝特莉亚',   text: '「冰原上开出了第一朵雪绒花，怀表的指针正指向崭新的清晨……这一次，我们谁也不会再掉队了。」' },
          { char: 'jialan',  side: 'right', emotion: '紫电欢跃', speaker: '紫电弦月人偶 · 伽蓝',     text: '「哼哼，完美验证本少主的满分演算！说好的加倍方糖热红茶，现在立刻马上给我兑现！」' },
          { char: 'qingyu',  side: 'right', emotion: '翠风拂晓', speaker: '残羽风语魔女 · 青羽',     text: '「红茶和点心早就备好在塔外草坡上啦！走吧，我们五个人的千年长夜，终于天亮了——」' },
          { char: 'zero',    side: 'left',  emotion: '破晓展颜', speaker: '寻光少女 · 零号白衣',     text: '「嗯！再见了烬塔——走吧伙伴们，一起去迎接属于我们的第一千个黎明！」' }
        ]
      }
    }
  };

  function _easeOutCubic(x) {
    const t = Math.max(0, Math.min(1, x));
    return 1 - Math.pow(1 - t, 3);
  }

  function _easeInOutCubic(x) {
    const t = Math.max(0, Math.min(1, x));
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function _ensureCanvas() {
    if (typeof document === 'undefined') return null;
    if (!_cv) {
      _cv = document.getElementById('spireDirectorCv');
      if (!_cv) {
        const wrap = document.getElementById('wrap') || document.body;
        if (wrap) {
          _cv = document.createElement('canvas');
          _cv.id = 'spireDirectorCv';
          _cv.className = 'director-cv hidden';
          wrap.appendChild(_cv);
        }
      }
      if (_cv && _cv.getContext) {
        _ctx = _cv.getContext('2d');
      }
    }
    if (!_bound && typeof window !== 'undefined' && window.addEventListener) {
      _bound = true;
      _bindEvents();
    }
    return _ctx;
  }

  function onResize(w, h, deviceDpr) {
    _ensureCanvas();
    _vw = Math.max(320, w || (typeof window !== 'undefined' ? window.innerWidth : 1280));
    _vh = Math.max(240, h || (typeof window !== 'undefined' ? window.innerHeight : 720));
    _dpr = Math.min(2.0, Math.max(1, deviceDpr || (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1));
    if (_cv) {
      const pw = Math.round(_vw * _dpr);
      const ph = Math.round(_vh * _dpr);
      if (_cv.width !== pw || _cv.height !== ph) {
        _cv.width = pw;
        _cv.height = ph;
      }
    }
    if (_ctx) {
      _ctx.setTransform(_dpr, 0, 0, _dpr, 0, 0);
      _ctx.imageSmoothingEnabled = true;
      if ('imageSmoothingQuality' in _ctx) _ctx.imageSmoothingQuality = 'high';
    }
  }

  function _syncVisibility() {
    if (!_cv) _ensureCanvas();
    if (!_cv) return;
    const shouldShow = !!(_cur || _queue.length > 0 || _fadeOut);
    if (shouldShow) {
      if (_cv.classList.contains('hidden')) {
        onResize(
          typeof viewW !== 'undefined' ? viewW : window.innerWidth,
          typeof viewH !== 'undefined' ? viewH : window.innerHeight,
          typeof dpr !== 'undefined' ? dpr : window.devicePixelRatio
        );
        _cv.classList.remove('hidden');
      }
    } else if (!_cv.classList.contains('hidden')) {
      _cv.classList.add('hidden');
    }
  }

  function _loadImg(relPath) {
    if (!relPath || typeof SpireAssets === 'undefined' || !SpireAssets.loadImage) return null;
    return SpireAssets.loadImage(relPath);
  }

  function _isImgReady(img) {
    return !!(img && (img.naturalWidth > 0 || img.width > 0));
  }

  function _enqueue(step) {
    _queue.push(step);
    if (!_cur) {
      _popNext();
    }
    _syncVisibility();
  }

  function _popNext() {
    if (_queue.length === 0) {
      if (_cur) {
        _fadeOut = { t: 0.26, maxT: 0.26 };
      }
      _cur = null;
      if (typeof player !== 'undefined' && player) {
        player.invuln = Math.max(player.invuln || 0, 0.90);
      }
      _syncVisibility();
      return;
    }
    _fadeOut = null;
    _cur = _queue.shift();
    _cur.elapsed = 0;
    _cur.idx = 0;
    _cur.shotElapsed = 0;
    _cur.prevShot = null;
    _cur.crossT = 0;
    if (_cur.kind === 'dialogue') {
      _initDialogueStage(_cur);
    }
    if (typeof SpireAudio !== 'undefined' && SpireAudio.playCutsceneCue && (_cur.kind === 'shots' || _cur.kind === 'curtain')) {
      try { SpireAudio.playCutsceneCue(_cur.audioTag || 'butcher', !!_cur.isMythic); } catch (_) {}
    }
    _syncVisibility();
  }

  function _initDialogueStage(step) {
    step.leftCharId = 'zero';
    step.rightCharId = null;
    for (let i = 0; i < step.lines.length; i++) {
      const ln = step.lines[i];
      if (ln.side === 'left' && ln.char) { step.leftCharId = ln.char; break; }
    }
    for (let i = 0; i < step.lines.length; i++) {
      const ln = step.lines[i];
      if (ln.side === 'right' && ln.char) { step.rightCharId = ln.char; break; }
    }
    step.lineElapsed = 0;
    step.lineRevealed = false;
    step.autoWaitT = 0;
    step.speakPopT = 0.24;
    step.leftEnterT = 0;
    step.rightEnterT = 0;
  }

  function abortActive() {
    _queue.length = 0;
    _cur = null;
    _fadeOut = null;
    _hitstopT = 0;
    _hitstopCd = 0;
    _slowmoT = 0;
    _syncVisibility();
  }

  function resetForNewRun() {
    abortActive();
    _seenIntro = false;
    _seenActCurtain = Object.create(null);
    _seenFloorDlg = Object.create(null);
    _seenBossIntro = Object.create(null);
    _seenBossP2 = Object.create(null);
    _seenBossDefeat = Object.create(null);
    _syncVisibility();
  }

  // 供实机战斗重暴击 / 瞬步斩弹 / 破盾调用的微顿帧反馈（内置防连发节流，绝不卡手）
  function triggerHitstop(dur) {
    if (_hitstopCd > 0 || _cur) return;
    const d = Math.min(0.055, Math.max(0.012, Number(dur) || 0.022));
    _hitstopT = Math.max(_hitstopT, d);
    _hitstopCd = 0.14;
  }

  function toggleAutoPlay() {
    _autoPlay = !_autoPlay;
    if (typeof beep === 'function') {
      try { beep(_autoPlay ? 680 : 460, 0.035, 'triangle', 0.03); } catch (_) {}
    }
    return _autoPlay;
  }

  function setAutoPlay(val) {
    _autoPlay = !!val;
    return _autoPlay;
  }

  function isAutoPlay() {
    return !!_autoPlay;
  }

  // 主殿或新局随时主动播放《序幕 · 第999次苏醒》开场动画
  function playOpeningSequence(forceReplay) {
    if (!forceReplay && _seenIntro) return false;
    _seenIntro = true;
    _enqueue({
      kind: 'shots',
      shots: OPENING_SHOTS,
      flashT: 0.28,
      audioTag: 'frost_queen',
      skipLabel: '跳过序章 [ESC]'
    });
    return true;
  }

  // 每层开始时由 beginWave(wave, curScene, bossId, isRetry) 调用
  function onWaveStart(waveNum, sceneObj, bossVariant, isRetry) {
    const w = Math.floor(Number(waveNum) || 1);
    const isEnd = (typeof endlessMode !== 'undefined' && endlessMode) || w > 16;
    if (isRetry) {
      abortActive();
      const prefix = `${w}_`;
      for (const k in _seenBossP2) {
        if (k.indexOf(prefix) === 0) delete _seenBossP2[k];
      }
      delete _seenBossDefeat[w];
      return;
    }
    if (isEnd) return;

    // 1. 第 1 层新开局：首先播放宽银幕三镜开场动画！
    if (w === 1 && !_seenIntro) {
      playOpeningSequence(false);
    }

    // 2. 四幕起始层（第 1 / 5 / 9 / 13 层）：播放全景横移帷幕转场
    if (ACT_CURTAINS[w] && !_seenActCurtain[w]) {
      _seenActCurtain[w] = true;
      _enqueue({
        kind: 'curtain',
        cfg: ACT_CURTAINS[w],
        audioTag: bossVariant || 'butcher'
      });
    }

    // 3. 第 4 / 8 / 12 / 16 固定首领层：先播放宽银幕 3 镜登场 CG，再接双人半身立绘对峙台词！
    if (BOSS_ENTRANCES[w] && !_seenBossIntro[w]) {
      _seenBossIntro[w] = true;
      _enqueue({
        kind: 'shots',
        shots: BOSS_ENTRANCES[w].shots.map(s => Object.assign({
          kicker: BOSS_ENTRANCES[w].chapter,
          chapter: BOSS_ENTRANCES[w].chapter,
          mood: BOSS_ENTRANCES[w].mood,
          accent: BOSS_ENTRANCES[w].accent
        }, s)),
        flashT: 0.22,
        audioTag: bossVariant || 'butcher',
        skipLabel: '跳过登场 [ESC]'
      });
    }

    // 4. 1~16 层逐层左侧二次元半身立绘 AVG 剧情对话
    if (FLOOR_DIALOGUES[w] && !_seenFloorDlg[w]) {
      _seenFloorDlg[w] = true;
      const pack = FLOOR_DIALOGUES[w];
      _enqueue({
        kind: 'dialogue',
        plaque: pack.plaque,
        mood: pack.mood || 'rain',
        lines: pack.lines
      });
    }
  }

  // 二阶段觉醒（仅剧情模式主线触发；无尽模式保持纯粹战斗节奏不弹零号专属剧情）
  function onBossPhase2(waveNum, bossEnt) {
    if (typeof endlessMode !== 'undefined' && endlessMode) return;
    const key = (bossEnt && bossEnt.variant) || 'default';
    const tagKey = `${waveNum}_${key}`;
    _hitstopT = 0.20;
    _slowmoT = 0.42;
    if (_seenBossP2[tagKey]) return;
    _seenBossP2[tagKey] = true;

    const dlg = BOSS_PHASE2_DIALOGUES[key] || BOSS_PHASE2_DIALOGUES.default;
    _enqueue({
      kind: 'dialogue',
      plaque: dlg.plaque,
      mood: dlg.mood || 'dawn',
      flashT: 0.36,
      isMythic: true,
      lines: dlg.lines
    });
  }

  // 四幕固定首领击败救赎 CG + 左侧半身立绘告别台词（仅剧情模式第 4 / 8 / 12 / 16 层触发）
  function onBossDefeated(waveNum, bossVariant) {
    if (typeof endlessMode !== 'undefined' && endlessMode) return;
    const w = Math.floor(Number(waveNum) || 4);
    if (_seenBossDefeat[w] || !BOSS_DEFEATS[w]) return;
    _seenBossDefeat[w] = true;
    _slowmoT = 0.38;

    const def = BOSS_DEFEATS[w];
    _enqueue({
      kind: 'shots',
      shots: def.shots.map(s => Object.assign({
        kicker: def.chapter,
        chapter: def.chapter,
        mood: def.mood,
        accent: def.accent
      }, s)),
      flashT: 0.38,
      audioTag: bossVariant || 'solar_seraph',
      skipLabel: w === 16 ? '跳过终章画面 [ESC]' : '跳过救赎演出 [ESC]'
    });

    if (def.farewell && Array.isArray(def.farewell.lines)) {
      _enqueue({
        kind: 'dialogue',
        plaque: def.farewell.plaque,
        mood: def.farewell.mood || def.mood,
        lines: def.farewell.lines
      });
    }
  }

  function _advanceDialogueLine(dlgStep) {
    if (dlgStep.idx + 1 < dlgStep.lines.length) {
      dlgStep.idx++;
      dlgStep.lineElapsed = 0;
      dlgStep.lineRevealed = false;
      dlgStep.autoWaitT = 0;
      dlgStep.speakPopT = 0.24;
      const nextLn = dlgStep.lines[dlgStep.idx];
      if (nextLn) {
        if (nextLn.side === 'left' && nextLn.char && nextLn.char !== dlgStep.leftCharId) {
          dlgStep.leftCharId = nextLn.char;
          dlgStep.leftEnterT = 0;
        } else if (nextLn.side === 'right' && nextLn.char && nextLn.char !== dlgStep.rightCharId) {
          dlgStep.rightCharId = nextLn.char;
          dlgStep.rightEnterT = 0;
        }
      }
    } else {
      _popNext();
    }
  }

  function advanceOrSkip(skipCurrentStage) {
    if (!_cur) return false;
    if (typeof beep === 'function') {
      try { beep(skipCurrentStage ? 420 : 620, 0.035, 'triangle', 0.03); } catch (_) {}
    }

    if (skipCurrentStage) {
      _popNext();
      return true;
    }

    if (_cur.kind === 'curtain') {
      _popNext();
      return true;
    }

    if (_cur.kind === 'shots') {
      const shot = _cur.shots[_cur.idx];
      const fullLen = (shot && shot.text ? shot.text.length : 0);
      const shown = Math.floor(_cur.shotElapsed * 36);
      if (shown < fullLen && _cur.shotElapsed < 1.1) {
        _cur.shotElapsed = Math.max(_cur.shotElapsed, fullLen / 36 + 0.1);
        return true;
      }
      if (_cur.idx + 1 < _cur.shots.length) {
        _cur.prevShot = shot;
        _cur.crossT = 0.62;
        _cur.crossMaxT = 0.62;
        _cur.idx++;
        _cur.shotElapsed = 0;
      } else {
        _popNext();
      }
      return true;
    }

    if (_cur.kind === 'dialogue') {
      const ln = _cur.lines[_cur.idx];
      const fullLen = (ln && ln.text ? ln.text.length : 0);
      const shown = _cur.lineRevealed ? fullLen : Math.floor(_cur.lineElapsed * 44);
      if (shown < fullLen) {
        _cur.lineRevealed = true;
        _cur.autoWaitT = 0;
        return true;
      }
      _advanceDialogueLine(_cur);
      return true;
    }

    _popNext();
    return true;
  }

  function _bindEvents() {
    window.addEventListener('keydown', function (ev) {
      if (!_cur) return;
      const k = (ev.key || '').toLowerCase();
      if (k === 'escape') {
        ev.preventDefault();
        ev.stopPropagation();
        advanceOrSkip(true);
      } else if (k === 'a' && _cur.kind === 'dialogue') {
        ev.preventDefault();
        ev.stopPropagation();
        toggleAutoPlay();
      } else if (k === ' ' || k === 'enter' || ev.code === 'Space') {
        ev.preventDefault();
        ev.stopPropagation();
        advanceOrSkip(false);
      }
    }, true);

    const onPointer = function (ev) {
      if (!_cur) return;
      ev.preventDefault();
      ev.stopPropagation();
      const cx = ev.clientX !== undefined ? ev.clientX : (ev.touches && ev.touches[0] ? ev.touches[0].clientX : 0);
      const cy = ev.clientY !== undefined ? ev.clientY : (ev.touches && ev.touches[0] ? ev.touches[0].clientY : 0);
      // 精准匹配右上角跳过热区 & 自动推进热区（适配桌面与手机全分辨率）
      if (_skipRect && cx >= _skipRect.x && cx <= _skipRect.x + _skipRect.w && cy >= _skipRect.y && cy <= _skipRect.y + _skipRect.h) {
        advanceOrSkip(true);
      } else if (_cur.kind === 'dialogue' && _autoRect && cx >= _autoRect.x && cx <= _autoRect.x + _autoRect.w && cy >= _autoRect.y && cy <= _autoRect.y + _autoRect.h) {
        toggleAutoPlay();
      } else if (cx >= _vw - 110 && cy <= 54) {
        advanceOrSkip(true);
      } else {
        advanceOrSkip(false);
      }
    };

    if (_cv && _cv.addEventListener) {
      _cv.addEventListener('pointerdown', onPointer, { passive: false });
    } else {
      window.addEventListener('pointerdown', onPointer, true);
    }
  }

  function update(dt) {
    const stepDt = Math.min(0.05, Math.max(0.001, dt || 0.016));
    _timeT += stepDt;

    if (_hitstopT > 0) _hitstopT = Math.max(0, _hitstopT - stepDt);
    if (_hitstopCd > 0) _hitstopCd = Math.max(0, _hitstopCd - stepDt);
    if (_slowmoT > 0) _slowmoT = Math.max(0, _slowmoT - stepDt);

    for (let i = 0; i < _PARTICLE_COUNT; i++) {
      const m = _motes[i];
      m.y += m.spd * stepDt;
      m.x += m.drift * stepDt;
      if (m.y > 1.06) { m.y = -0.06; m.x = Math.random(); }
      if (m.x < -0.05) m.x = 1.05;
      else if (m.x > 1.05) m.x = -0.05;
    }

    if (_fadeOut) {
      _fadeOut.t -= stepDt;
      if (_fadeOut.t <= 0) {
        _fadeOut = null;
        _syncVisibility();
      }
    }

    if (!_cur) return;

    _cur.elapsed += stepDt;
    if (_cur.flashT > 0) _cur.flashT = Math.max(0, _cur.flashT - stepDt);
    if (_cur.crossT > 0) _cur.crossT = Math.max(0, _cur.crossT - stepDt);

    if (_cur.kind === 'curtain') {
      const dur = (_cur.cfg && _cur.cfg.duration) || 2.5;
      if (_cur.elapsed >= dur) {
        _popNext();
      }
      return;
    }

    if (_cur.kind === 'shots') {
      _cur.shotElapsed += stepDt;
      const shot = _cur.shots[_cur.idx];
      if (!shot) { _popNext(); return; }
      const dur = shot.duration || 3.4;
      if (_cur.shotElapsed >= dur) {
        if (_cur.idx + 1 < _cur.shots.length) {
          _cur.prevShot = shot;
          _cur.crossT = 0.62;
          _cur.crossMaxT = 0.62;
          _cur.idx++;
          _cur.shotElapsed = 0;
        } else {
          _popNext();
        }
      }
      return;
    }

    if (_cur.kind === 'dialogue') {
      _cur.lineElapsed += stepDt;
      if (_cur.speakPopT > 0) _cur.speakPopT = Math.max(0, _cur.speakPopT - stepDt);
      _cur.leftEnterT = Math.min(1, (_cur.leftEnterT || 0) + stepDt * 3.6);
      _cur.rightEnterT = Math.min(1, (_cur.rightEnterT || 0) + stepDt * 3.6);

      const ln = _cur.lines[_cur.idx];
      const fullLen = (ln && ln.text ? ln.text.length : 0);
      if (!_cur.lineRevealed && Math.floor(_cur.lineElapsed * 44) >= fullLen) {
        _cur.lineRevealed = true;
      }
      if (_autoPlay && _cur.lineRevealed) {
        _cur.autoWaitT = (_cur.autoWaitT || 0) + stepDt;
        if (_cur.autoWaitT >= 1.75) {
          _advanceDialogueLine(_cur);
        }
      }
    }
  }

  function _drawCoverImg(g, relPath, fallbackPath, x, y, w, h, zoom, panX, panY) {
    let img = _loadImg(relPath);
    if (!_isImgReady(img) && fallbackPath) img = _loadImg(fallbackPath);
    if (_isImgReady(img)) {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const sc = Math.max(w / iw, h / ih) * (zoom || 1.0);
      const dw = iw * sc;
      const dh = ih * sc;
      g.drawImage(img, x + (w - dw) * 0.5 + (panX || 0), y + (h - dh) * 0.5 + (panY || 0), dw, dh);
      return true;
    }
    g.fillStyle = '#090d18';
    g.fillRect(x, y, w, h);
    return false;
  }

  function _drawMoodParticles(g, mood, alphaMul) {
    g.save();
    for (let i = 0; i < _PARTICLE_COUNT; i++) {
      const m = _motes[i];
      const px = m.x * _vw;
      const py = m.y * _vh;
      if (mood === 'rain') {
        g.strokeStyle = `rgba(186, 230, 253, ${(0.24 * alphaMul).toFixed(3)})`;
        g.lineWidth = 1.25;
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(px - 6, py + 19 + m.sz * 3);
        g.stroke();
      } else if (mood === 'snow') {
        g.fillStyle = `rgba(224, 242, 254, ${(0.44 * alphaMul).toFixed(3)})`;
        g.beginPath();
        g.arc(px + Math.sin(_timeT * 1.8 + m.phase) * 8, py, m.sz * 0.95, 0, Math.PI * 2);
        g.fill();
      } else if (mood === 'clock') {
        g.fillStyle = `rgba(233, 213, 255, ${(0.36 * alphaMul).toFixed(3)})`;
        g.fillRect(px, _vh - py, m.sz * 1.15, m.sz * 1.15);
      } else {
        const col = (i % 2 === 0) ? `rgba(253, 224, 71, ${(0.38 * alphaMul).toFixed(3)})` : `rgba(114, 239, 221, ${(0.36 * alphaMul).toFixed(3)})`;
        g.fillStyle = col;
        g.beginPath();
        g.arc(px + Math.sin(_timeT * 1.4 + m.phase) * 6, _vh - py, m.sz, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  function _isTouchOrCompact() {
    return _vw < 720 || _vh < 520 ||
      (typeof uiMode !== 'undefined' && uiMode !== 'desktop') ||
      (typeof isTouch !== 'undefined' && isTouch);
  }

  function _drawTopControls(g, skipLabel, showAutoToggle) {
    const mob = _isTouchOrCompact();
    const txt = mob ? '跳过 ▸' : (skipLabel || '跳过演出 [ESC]');
    const pw = mob ? 86 : 148;
    const ph = mob ? 30 : 32;
    const px = _vw - pw - (mob ? 12 : 20);
    const py = mob ? 12 : 18;
    _skipRect = { x: px - 6, y: py - 6, w: pw + 12, h: ph + 14 };
    _autoRect = null;

    g.save();
    g.fillStyle = 'rgba(8, 12, 22, 0.86)';
    g.strokeStyle = 'rgba(229, 184, 105, 0.65)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.roundRect(px, py, pw, ph, 16);
    g.fill();
    g.stroke();
    g.fillStyle = '#f6e3ba';
    g.font = `700 ${mob ? 12 : 12.5}px -apple-system, "PingFang SC", sans-serif`;
    g.textAlign = 'center';
    g.fillText(txt, px + pw * 0.5, py + ph * 0.65);

    if (showAutoToggle) {
      const aw = mob ? 84 : 122;
      const ah = ph;
      const ax = px - aw - (mob ? 7 : 10);
      const ay = py;
      _autoRect = { x: ax - 6, y: ay - 6, w: aw + 12, h: ah + 14 };
      g.fillStyle = _autoPlay ? 'rgba(18, 56, 68, 0.92)' : 'rgba(8, 12, 22, 0.84)';
      g.strokeStyle = _autoPlay ? '#72efdd' : 'rgba(148, 163, 184, 0.44)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.roundRect(ax, ay, aw, ah, 16);
      g.fill();
      g.stroke();
      g.fillStyle = _autoPlay ? '#72efdd' : '#cbd5e1';
      const autoLbl = mob
        ? (_autoPlay ? '▶ 自动中' : '⏸ 自动')
        : (_autoPlay ? '▶ 自动: 开启 [A]' : '⏸ 自动: 关闭 [A]');
      g.fillText(autoLbl, ax + aw * 0.5, ay + ah * 0.65);
    }
    g.restore();
  }

  function _drawDiamondOrnament(g, cx, cy, r, color) {
    g.save();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy);
    g.lineTo(cx, cy + r);
    g.lineTo(cx - r, cy);
    g.closePath();
    g.fill();
    g.restore();
  }

  function _wrapLines(g, text, maxW) {
    const str = String(text || '');
    const out = [];
    let cur = '';
    for (let i = 0; i < str.length; i++) {
      const test = cur + str[i];
      if (cur.length > 0 && g.measureText(test).width > maxW) {
        out.push(cur);
        cur = str[i];
      } else {
        cur = test;
      }
    }
    if (cur) out.push(cur);
    return out;
  }

  function _renderCurtain(g, st) {
    const cfg = st.cfg;
    const dur = cfg.duration || 2.55;
    const p = Math.min(1, st.elapsed / dur);
    const fadeIn = _easeOutCubic(Math.min(1, st.elapsed / 0.42));
    const fadeOut = p > 0.78 ? (1 - _easeInOutCubic((p - 0.78) / 0.22)) : 1;
    const alpha = Math.max(0, Math.min(1, fadeIn * fadeOut));
    const isPortrait = _vh > _vw * 1.08;

    g.save();
    g.fillStyle = '#05070e';
    g.fillRect(0, 0, _vw, _vh);
    g.globalAlpha = alpha;

    if (isPortrait) {
      // 竖屏手机：底层柔暗氛围铺底 + 中央宽幅全景视窗，彻底解决 16:9 场景横画被左右裁切 70% 的问题
      g.save();
      g.globalAlpha = alpha * 0.28;
      _drawCoverImg(g, cfg.img, 'assets/spire/logo_banner.jpg', 0, 0, _vw, _vh, 1.08, 0, 0);
      g.restore();

      const bandH = Math.round(Math.min(_vh * 0.42, _vw * 0.72));
      const bandY = Math.round((_vh - bandH) * 0.44);
      g.save();
      g.beginPath();
      g.rect(0, bandY, _vw, bandH);
      g.clip();
      _drawCoverImg(g, cfg.img, 'assets/spire/logo_banner.jpg', 0, bandY, _vw, bandH, 1.04 - p * 0.03, (0.5 - p) * 16, 0);
      const bGrad = g.createLinearGradient(0, bandY, 0, bandY + bandH);
      bGrad.addColorStop(0, 'rgba(5, 7, 14, 0.85)');
      bGrad.addColorStop(0.22, 'rgba(5, 7, 14, 0.18)');
      bGrad.addColorStop(0.78, 'rgba(5, 7, 14, 0.28)');
      bGrad.addColorStop(1, 'rgba(5, 7, 14, 0.92)');
      g.fillStyle = bGrad;
      g.fillRect(0, bandY, _vw, bandH);
      g.restore();
    } else {
      _drawCoverImg(g, cfg.img, 'assets/spire/logo_banner.jpg', 0, 0, _vw, _vh, 1.05 - p * 0.035, (0.5 - p) * 24, 0);
      const grad = g.createLinearGradient(0, 0, 0, _vh);
      grad.addColorStop(0, 'rgba(5, 7, 14, 0.66)');
      grad.addColorStop(0.45, 'rgba(5, 7, 14, 0.30)');
      grad.addColorStop(1, 'rgba(5, 7, 14, 0.88)');
      g.fillStyle = grad;
      g.fillRect(0, 0, _vw, _vh);
    }

    _drawMoodParticles(g, cfg.mood || 'rain', 0.9);

    const cy = isPortrait ? _vh * 0.54 : _vh * 0.5;
    const lineSpan = Math.min(460, _vw * 0.72) * _easeOutCubic(Math.min(1, st.elapsed / 0.7));

    g.fillStyle = cfg.accent || '#f6d379';
    g.font = `800 ${isPortrait ? 12 : 13}px -apple-system, "PingFang SC", sans-serif`;
    g.textAlign = 'center';
    g.fillText(cfg.actLabel, _vw * 0.5, cy - (isPortrait ? 38 : 44));

    const titlePx = isPortrait ? Math.min(28, Math.max(21, Math.round(_vw * 0.068))) : Math.min(44, Math.max(24, Math.round(_vw * 0.035)));
    g.fillStyle = '#fbf6eb';
    g.font = `900 ${titlePx}px "Songti SC", "Noto Serif SC", "PingFang SC", serif`;
    g.fillText(cfg.title, _vw * 0.5, cy + 2);

    g.strokeStyle = cfg.accent || '#e5b869';
    g.lineWidth = 1.7;
    g.beginPath();
    g.moveTo(_vw * 0.5 - lineSpan * 0.5, cy + 21);
    g.lineTo(_vw * 0.5 + lineSpan * 0.5, cy + 21);
    g.stroke();
    _drawDiamondOrnament(g, _vw * 0.5, cy + 21, 4.2, cfg.accent || '#f6d379');

    // 自动折行渲染幕间副标题，杜绝手机窄屏左右截断
    const subPx = isPortrait ? 14 : 16;
    g.fillStyle = '#e2e8f0';
    g.font = `600 ${subPx}px "PingFang SC", "Songti SC", serif`;
    const subLines = _wrapLines(g, cfg.sub || '', Math.min(680, _vw - 36));
    for (let i = 0; i < subLines.length; i++) {
      g.fillText(subLines[i], _vw * 0.5, cy + 48 + i * (subPx + 7));
    }

    _drawTopControls(g, '跳过转场 [ESC]', false);
    g.restore();
  }

  function _renderShots(g, st) {
    const shot = st.shots[st.idx];
    if (!shot) return;
    const enterAlpha = st.idx === 0 ? _easeOutCubic(Math.min(1, st.elapsed / 0.35)) : 1;
    const isPortrait = _vh > _vw * 1.08;
    const isShortLand = !isPortrait && _vh < 500;
    const mob = _isTouchOrCompact();

    const dur = Math.max(0.8, shot.duration || 3.4);
    const prog = Math.min(1, st.shotElapsed / dur);
    const z0 = shot.zoomFrom || 1.02;
    const z1 = shot.zoomTo || 1.07;
    const curZoom = z0 + (z1 - z0) * prog;
    const curPanX = (shot.panX || 0) * prog;
    const curPanY = (shot.panY || 0) * prog;

    const fullText = shot.text || '';
    const shownLen = Math.min(fullText.length, Math.max(4, Math.floor(st.shotElapsed * 36)));
    const visibleText = fullText.slice(0, shownLen);

    g.save();
    g.fillStyle = '#05070e';
    g.fillRect(0, 0, _vw, _vh);
    g.globalAlpha = enterAlpha;

    if (isPortrait) {
      // ===== 📱 手机竖屏专属剧场构图：柔暗环境底 + 16:10 完整保真宽银幕画框 + 独立哥特字幕席 =====
      g.save();
      g.globalAlpha = enterAlpha * 0.22;
      _drawCoverImg(g, shot.img, shot.fallback || 'assets/spire/logo_banner.jpg', 0, 0, _vw, _vh, 1.12, 0, 0);
      g.restore();
      g.fillStyle = 'rgba(5, 7, 14, 0.72)';
      g.fillRect(0, 0, _vw, _vh);

      const sx = 14;
      const sw = _vw - 28;
      const sh = Math.round(Math.min(_vh * 0.37, sw * 0.625));
      const sy = Math.max(78, Math.round(_vh * 0.14));

      // 画框上方居中章节铭牌（避开右上角跳过按钮）
      g.fillStyle = shot.accent || '#f6d379';
      g.font = '800 12.5px -apple-system, "PingFang SC", sans-serif';
      g.textAlign = 'center';
      const chapStr = `🕯️ ${shot.chapter || shot.kicker || 'ECHOES OF THE ASHEN SPIRE'}`;
      const chapLines = _wrapLines(g, chapStr, sw - 8);
      g.fillText(chapLines[0] || chapStr, _vw * 0.5, sy - 14);

      // 宽银幕保真分镜画框（完整呈现左右构图，不裁切人物）
      g.save();
      g.beginPath();
      g.roundRect(sx, sy, sw, sh, 12);
      g.clip();
      if (st.prevShot && st.crossT > 0) {
        _drawCoverImg(g, st.prevShot.img, st.prevShot.fallback || 'assets/spire/logo_banner.jpg', sx, sy, sw, sh, st.prevShot.zoomTo || 1.05, (st.prevShot.panX || 0) * 0.55, (st.prevShot.panY || 0) * 0.55);
        const blend = 1 - _easeInOutCubic(st.crossT / Math.max(0.01, st.crossMaxT || 0.62));
        g.globalAlpha = enterAlpha * blend;
      }
      _drawCoverImg(g, shot.img, shot.fallback || 'assets/spire/logo_banner.jpg', sx, sy, sw, sh, curZoom, curPanX * 0.55, curPanY * 0.55);
      g.globalAlpha = enterAlpha;
      _drawMoodParticles(g, shot.mood || 'rain', 0.80);

      const frameVig = g.createLinearGradient(0, sy + sh * 0.72, 0, sy + sh);
      frameVig.addColorStop(0, 'rgba(5, 7, 14, 0)');
      frameVig.addColorStop(1, 'rgba(5, 7, 14, 0.55)');
      g.fillStyle = frameVig;
      g.fillRect(sx, sy + sh * 0.72, sw, sh * 0.28);
      g.restore();

      g.strokeStyle = 'rgba(229, 184, 105, 0.72)';
      g.lineWidth = 1.6;
      g.beginPath();
      g.roundRect(sx, sy, sw, sh, 12);
      g.stroke();
      _drawDiamondOrnament(g, _vw * 0.5, sy, 3.8, shot.accent || '#f6d379');
      _drawDiamondOrnament(g, _vw * 0.5, sy + sh, 3.8, shot.accent || '#f6d379');

      // 画框下方独立文学字幕席（按完整文本行数固定高度，绝不抖动、绝不溢出遮挡画框）
      const fontPx = 15;
      const lineH = 24.5;
      g.font = `600 ${fontPx}px "Songti SC", "Noto Serif SC", "PingFang SC", serif`;
      const fullWrapped = _wrapLines(g, fullText, sw - 32);
      const visWrapped = _wrapLines(g, visibleText, sw - 32);
      const totalRows = Math.max(2, fullWrapped.length);
      const cardH = Math.max(112, totalRows * lineH + 40);
      const cardY = sy + sh + 18;

      g.fillStyle = 'rgba(9, 14, 26, 0.90)';
      g.strokeStyle = 'rgba(229, 184, 105, 0.34)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.roundRect(sx, cardY, sw, cardH, 13);
      g.fill();
      g.stroke();

      g.fillStyle = '#fbf6eb';
      g.textAlign = 'center';
      const textStartY = cardY + Math.round((cardH - (totalRows - 1) * lineH) * 0.5) + 5;
      for (let i = 0; i < visWrapped.length; i++) {
        g.fillText(visWrapped[i], _vw * 0.5, textStartY + i * lineH);
      }

      // 底部分镜圆点与触控轻提示
      const dotCount = st.shots.length;
      const dotY = Math.min(_vh - 42, cardY + cardH + 26);
      for (let d = 0; d < dotCount; d++) {
        const dx = _vw * 0.5 + (d - (dotCount - 1) * 0.5) * 18;
        g.fillStyle = d === st.idx ? '#f6d379' : 'rgba(226, 232, 240, 0.32)';
        g.beginPath();
        g.arc(dx, dotY, d === st.idx ? 4.4 : 2.8, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = 'rgba(203, 213, 225, 0.76)';
      g.font = '600 12px -apple-system, "PingFang SC", sans-serif';
      g.textAlign = 'center';
      g.fillText('轻触屏幕继续 ▸', _vw * 0.5, dotY + 22);
    } else {
      // ===== 💻 桌面端与手机横屏宽银幕剧院 =====
      const barH = isShortLand
        ? 38
        : Math.max(24, Math.round((_vh - Math.min(_vh - 48, _vw * 9 / 16)) * 0.5));
      const sx = 0;
      const sy = barH;
      const sw = _vw;
      const sh = Math.max(180, _vh - barH * 2);

      g.save();
      g.beginPath();
      g.rect(sx, sy, sw, sh);
      g.clip();

      if (st.prevShot && st.crossT > 0) {
        _drawCoverImg(g, st.prevShot.img, st.prevShot.fallback || 'assets/spire/logo_banner.jpg', sx, sy, sw, sh, st.prevShot.zoomTo || 1.06, st.prevShot.panX || 0, st.prevShot.panY || 0);
        const blend = 1 - _easeInOutCubic(st.crossT / Math.max(0.01, st.crossMaxT || 0.62));
        g.globalAlpha = enterAlpha * blend;
      }
      _drawCoverImg(g, shot.img, shot.fallback || 'assets/spire/logo_banner.jpg', sx, sy, sw, sh, curZoom, curPanX, curPanY);
      g.globalAlpha = enterAlpha;

      _drawMoodParticles(g, shot.mood || 'rain', 0.85);

      const subGrad = g.createLinearGradient(0, sy + sh * 0.44, 0, sy + sh);
      subGrad.addColorStop(0, 'rgba(5, 7, 14, 0)');
      subGrad.addColorStop(0.50, 'rgba(5, 7, 14, 0.78)');
      subGrad.addColorStop(1, 'rgba(5, 7, 14, 0.96)');
      g.fillStyle = subGrad;
      g.fillRect(sx, sy + sh * 0.44, sw, sh * 0.56);
      g.restore();

      g.strokeStyle = 'rgba(229, 184, 105, 0.48)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(0, sy); g.lineTo(_vw, sy);
      g.moveTo(0, sy + sh); g.lineTo(_vw, sy + sh);
      g.stroke();
      _drawDiamondOrnament(g, _vw * 0.5, sy, 3.8, '#f6d379');

      // 左上角章节铭牌（横屏小高度时置于顶部黑边栏内，绝不撞右上跳过按钮）
      g.fillStyle = shot.accent || '#f6d379';
      g.font = `800 ${isShortLand ? 12 : 13}px -apple-system, "PingFang SC", sans-serif`;
      g.textAlign = 'left';
      g.fillText(`🕯️ ${shot.chapter || shot.kicker || 'ECHOES OF THE ASHEN SPIRE'}`, isShortLand ? 16 : 26, isShortLand ? 24 : Math.max(38, sy + 30));

      // 底部电影字幕打字机推进（按完整行数向上锚定，多行绝不溢出下边框）
      const fontPx = isShortLand ? 14.5 : (_vw < 760 ? 16.5 : 19.5);
      const lineH = fontPx + (isShortLand ? 7 : 9);
      g.fillStyle = '#fbf6eb';
      g.font = `700 ${fontPx}px "Songti SC", "Noto Serif SC", "PingFang SC", serif`;
      g.textAlign = 'center';
      const maxSubW = Math.min(900, _vw - (isShortLand ? 44 : 56));
      const fullLines = _wrapLines(g, fullText, maxSubW);
      const lines = _wrapLines(g, visibleText, maxSubW);
      const totalRows = Math.max(1, fullLines.length);
      const baseSubY = sy + sh - (isShortLand ? 16 : 24) - (totalRows - 1) * lineH;
      for (let i = 0; i < lines.length; i++) {
        g.fillText(lines[i], _vw * 0.5, baseSubY + i * lineH);
      }

      const dotCount = st.shots.length;
      const dotY = Math.min(_vh - 13, sy + sh + (isShortLand ? 19 : 18));
      for (let d = 0; d < dotCount; d++) {
        const dx = _vw * 0.5 + (d - (dotCount - 1) * 0.5) * 18;
        g.fillStyle = d === st.idx ? '#f6d379' : 'rgba(226, 232, 240, 0.32)';
        g.beginPath();
        g.arc(dx, dotY, d === st.idx ? 4.2 : 2.6, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = 'rgba(203, 213, 225, 0.76)';
      g.font = '600 12px -apple-system, "PingFang SC", sans-serif';
      g.textAlign = 'left';
      g.fillText(mob ? '轻触屏幕下一镜 ▸' : '点击屏幕 / 空格 下一镜', isShortLand ? 16 : 26, dotY + 4);
    }

    _drawTopControls(g, st.skipLabel || '跳过演出 [ESC]', false);

    if (st.flashT > 0) {
      g.fillStyle = `rgba(255, 250, 240, ${Math.min(0.88, st.flashT * 2.4).toFixed(3)})`;
      g.fillRect(0, 0, _vw, _vh);
    }
    g.restore();
  }

  // 绘制高挑完整的设定集【左侧二次元半身立绘】立牌（支持手机竖屏主次景双立绘、手机横屏防裁切与桌面端高挑立牌）
  function _drawHalfBodyStandee(g, charId, side, isActive, enterT, speakPopT, boxTopY) {
    if (!charId) return;
    const cast = CHAR_CAST[charId] || CHAR_CAST.zero;
    const img = _loadImg(cast.portrait);
    if (!_isImgReady(img)) return;

    const iw = img.naturalWidth || img.width || 548;
    const ih = img.naturalHeight || img.height || 768;
    const aspect = iw / Math.max(1, ih);

    const isPortraitMob = _vw < 680 && _vh > _vw;
    const isLandscapeMob = !isPortraitMob && _vh < 520;

    let dh, dw, dx, dy;
    const slideOffset = (1 - _easeOutCubic(enterT)) * (side === 'left' ? -40 : 40);
    const speakJump = isActive && speakPopT > 0 ? Math.sin((speakPopT / 0.24) * Math.PI) * -9 : 0;
    const breathY = isActive ? Math.sin(_timeT * 2.3) * 2.4 : 0;

    if (isPortraitMob) {
      // 手机竖屏：发言角色大尺寸高清前景展示，倾听角色以远景半透明侧立对衬，兼具双人戏剧感与清晰面部特写
      const availH = Math.max(200, boxTopY - 46);
      const baseH = Math.min(392, Math.max(210, availH * 0.90));
      dh = baseH * (isActive ? 1.0 : 0.76);
      dw = dh * aspect;
      if (dw > _vw * 0.66) {
        dw = _vw * 0.66;
        dh = dw / Math.max(0.4, aspect);
      }
      const margin = isActive ? 14 : 10;
      dx = side === 'left'
        ? (margin + slideOffset)
        : (_vw - margin - dw + slideOffset);
      const anchorBottom = boxTopY + (isActive ? 42 : 24);
      dy = Math.max(48, anchorBottom - dh) + breathY + speakJump;
    } else if (isLandscapeMob) {
      // 手机横屏：立绘严格收束于顶部按钮下方与紧凑对话框之间，绝不顶出屏幕或遮挡头部
      const availH = Math.max(155, boxTopY - 38);
      const baseH = Math.min(256, availH * 1.18);
      dh = baseH * (isActive ? 1.02 : 0.90);
      dw = dh * aspect;
      const stageMargin = Math.max(18, (_vw - Math.min(_vw - 36, 760)) * 0.5 + 4);
      dx = side === 'left'
        ? (stageMargin + slideOffset)
        : (_vw - stageMargin - dw + slideOffset);
      const anchorBottom = Math.min(_vh - 8, boxTopY + 56);
      dy = Math.max(44, anchorBottom - dh) + breathY + speakJump - (isActive ? 5 : 0);
    } else {
      // 桌面端高挑完整立绘（>=55% 视口高度）
      const maxStandeeH = Math.min(556, Math.max(305, _vh * 0.665));
      const focusScale = isActive ? 1.04 : 0.94;
      dh = maxStandeeH * focusScale;
      dw = dh * aspect;
      const stageMargin = Math.max(28, (_vw - Math.min(_vw - 44, 1000)) * 0.5 + 6);
      dx = side === 'left'
        ? (stageMargin + slideOffset)
        : (_vw - stageMargin - dw + slideOffset);
      const anchorBottom = Math.min(_vh - 16, boxTopY + 102);
      dy = Math.max(12, anchorBottom - dh) + breathY + speakJump - (isActive ? 9 : 0);
    }

    g.save();
    g.globalAlpha = isActive ? 1.0 : (isPortraitMob ? 0.34 : 0.45);

    const cardPad = isPortraitMob || isLandscapeMob ? 4.5 : 6;
    if (isActive) {
      g.strokeStyle = cast.glow;
      g.lineWidth = isPortraitMob ? 4.5 : 6;
      g.beginPath();
      g.roundRect(dx - cardPad - 2.5, dy - cardPad - 2.5, dw + (cardPad + 2.5) * 2, dh + (cardPad + 2.5) * 2, 15);
      g.stroke();
    }

    g.fillStyle = isActive ? 'rgba(9, 14, 26, 0.86)' : 'rgba(7, 10, 18, 0.62)';
    g.strokeStyle = isActive ? cast.accent : 'rgba(148, 163, 184, 0.26)';
    g.lineWidth = isActive ? 2.0 : 1.1;
    g.beginPath();
    g.roundRect(dx - cardPad, dy - cardPad, dw + cardPad * 2, dh + cardPad * 2, 13);
    g.fill();
    g.stroke();

    g.beginPath();
    g.roundRect(dx, dy, dw, dh, 10);
    g.clip();
    g.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);

    const footShade = g.createLinearGradient(0, dy + dh * 0.78, 0, dy + dh);
    footShade.addColorStop(0, 'rgba(7, 10, 20, 0)');
    footShade.addColorStop(1, 'rgba(7, 10, 20, 0.58)');
    g.fillStyle = footShade;
    g.fillRect(dx, dy + dh * 0.78, dw, dh * 0.22);

    if (!isActive) {
      g.fillStyle = 'rgba(6, 9, 18, 0.40)';
      g.fillRect(dx, dy, dw, dh);
    }
    g.restore();

    if (isActive) {
      _drawDiamondOrnament(g, dx + dw * 0.5, dy - cardPad, 4.0, cast.accent);
    }
  }

  function _renderDialogue(g, st) {
    const ln = st.lines[st.idx];
    if (!ln) return;
    const activeCast = CHAR_CAST[ln.char] || CHAR_CAST.zero;
    const isPortraitMob = _vw < 680 && _vh > _vw;
    const isLandscapeMob = !isPortraitMob && _vh < 520;
    const mob = _isTouchOrCompact();

    g.save();
    g.fillStyle = 'rgba(5, 8, 16, 0.60)';
    g.fillRect(0, 0, _vw, _vh);

    _drawMoodParticles(g, st.mood || 'rain', 0.68);

    // 预先按完整台词折行计算对话框自适应高度，彻底杜绝手机端 3~5 行长台词撑破底栏或与按钮重叠
    const boxW = isPortraitMob
      ? (_vw - 24)
      : (isLandscapeMob ? Math.min(_vw - 28, 760) : Math.min(_vw - 32, 1000));
    const textPadX = isPortraitMob ? 18 : (isLandscapeMob ? 22 : 36);
    const textMaxW = boxW - textPadX * 2;
    const fontPx = isPortraitMob ? 15 : (isLandscapeMob ? 14 : 19);
    const lineH = isPortraitMob ? 23.5 : (isLandscapeMob ? 20.5 : 29.5);

    const fullText = ln.text || '';
    const shownChars = st.lineRevealed ? fullText.length : Math.min(fullText.length, Math.max(2, Math.floor(st.lineElapsed * 44)));
    if (shownChars >= fullText.length) st.lineRevealed = true;
    const shownStr = fullText.slice(0, shownChars);

    g.font = `600 ${fontPx}px "Songti SC", "Noto Serif SC", "PingFang SC", serif`;
    const fullWrapped = _wrapLines(g, fullText, textMaxW);
    const wrapped = _wrapLines(g, shownStr, textMaxW);
    const rowCount = Math.max(2, fullWrapped.length);

    const topTextPad = isPortraitMob ? 42 : (isLandscapeMob ? 34 : 68);
    const botTextPad = isPortraitMob ? 34 : (isLandscapeMob ? 26 : 38);
    const minBoxH = isLandscapeMob ? 108 : (isPortraitMob ? 150 : 184);
    const boxH = Math.max(minBoxH, Math.round(topTextPad + rowCount * lineH + botTextPad));
    const bx = (_vw - boxW) * 0.5;
    const by = _vh - boxH - (isPortraitMob ? 14 : (isLandscapeMob ? 10 : 24));

    const leftActive = ln.side !== 'right';
    const rightActive = ln.side === 'right';

    if (leftActive) {
      _drawHalfBodyStandee(g, st.rightCharId, 'right', false, st.rightEnterT || 1, 0, by);
      _drawHalfBodyStandee(g, ln.char || st.leftCharId, 'left', true, st.leftEnterT || 1, st.speakPopT || 0, by);
    } else {
      _drawHalfBodyStandee(g, st.leftCharId, 'left', false, st.leftEnterT || 1, 0, by);
      _drawHalfBodyStandee(g, ln.char || st.rightCharId, 'right', true, st.rightEnterT || 1, st.speakPopT || 0, by);
    }

    // 手机竖屏：将层数铭牌独立置于左上角悬浮胶囊，绝不与对话框顶部的长角色名牌挤压碰撞
    if (isPortraitMob) {
      const plaqueStr = `🕯️ ${st.plaque || ''} (${st.idx + 1}/${st.lines.length})`;
      g.font = '700 11px -apple-system, "PingFang SC", sans-serif';
      const maxPlaqueW = Math.max(110, _vw - 206);
      const pLines = _wrapLines(g, plaqueStr, maxPlaqueW - 18);
      const pTxt = pLines[0] || plaqueStr;
      const pw = Math.min(maxPlaqueW, Math.round(g.measureText(pTxt).width + 20));
      g.fillStyle = 'rgba(8, 12, 22, 0.84)';
      g.strokeStyle = 'rgba(229, 184, 105, 0.42)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.roundRect(12, 12, pw, 30, 15);
      g.fill();
      g.stroke();
      g.fillStyle = '#fde68a';
      g.textAlign = 'left';
      g.fillText(pTxt, 22, 31);
    }

    // 哥特黑曜双层鎏金对话台词匣
    const boxGrad = g.createLinearGradient(0, by, 0, by + boxH);
    boxGrad.addColorStop(0, 'rgba(12, 18, 32, 0.96)');
    boxGrad.addColorStop(1, 'rgba(6, 9, 17, 0.99)');
    g.fillStyle = boxGrad;
    g.strokeStyle = 'rgba(229, 184, 105, 0.86)';
    g.lineWidth = 2.0;
    g.beginPath();
    g.roundRect(bx, by, boxW, boxH, 15);
    g.fill();
    g.stroke();

    // 内层暗金细丝线框 + 四角菱花雕饰
    g.strokeStyle = 'rgba(229, 184, 105, 0.22)';
    g.lineWidth = 1.0;
    g.beginPath();
    g.roundRect(bx + 6, by + 6, boxW - 12, boxH - 12, 11);
    g.stroke();
    _drawDiamondOrnament(g, bx + 12, by + 12, 3.0, 'rgba(246, 211, 121, 0.72)');
    _drawDiamondOrnament(g, bx + boxW - 12, by + 12, 3.0, 'rgba(246, 211, 121, 0.72)');
    _drawDiamondOrnament(g, bx + 12, by + boxH - 12, 3.0, 'rgba(246, 211, 121, 0.72)');
    _drawDiamondOrnament(g, bx + boxW - 12, by + boxH - 12, 3.0, 'rgba(246, 211, 121, 0.72)');

    // 顶部说话人专属色辉光细条
    g.fillStyle = activeCast.accent;
    g.beginPath();
    g.roundRect(bx + 22, by, boxW - 44, 3.0, 2);
    g.fill();

    // 说话人铭牌胶囊 + 神态情绪微标（自适应字号与最大宽度）
    const spkName = ln.speaker || activeCast.name;
    const emoTxt = ln.emotion ? ` · ${ln.emotion}` : '';
    const fullBadgeTxt = spkName + emoTxt;
    const badgeFontPx = isPortraitMob ? 13 : (isLandscapeMob ? 13 : 15);
    g.font = `800 ${badgeFontPx}px -apple-system, "PingFang SC", sans-serif`;
    const badgeMaxW = boxW - (isPortraitMob ? 28 : 40);
    const badgeW = Math.min(badgeMaxW, Math.max(isPortraitMob ? 156 : 210, Math.round(g.measureText(fullBadgeTxt).width + (isPortraitMob ? 28 : 42))));
    const badgeH = isPortraitMob || isLandscapeMob ? 30 : 35;
    const badgeMarginX = isPortraitMob ? 14 : 24;
    const badgeX = rightActive ? (bx + boxW - badgeW - badgeMarginX) : (bx + badgeMarginX);
    const badgeY = by - badgeH * 0.52;

    g.fillStyle = '#0e1526';
    g.strokeStyle = activeCast.accent;
    g.lineWidth = 1.8;
    g.beginPath();
    g.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH * 0.5);
    g.fill();
    g.stroke();

    g.fillStyle = activeCast.accent;
    g.textAlign = 'center';
    g.fillText(fullBadgeTxt, badgeX + badgeW * 0.5, badgeY + badgeH * 0.67, badgeW - 18);

    // 桌面端与横屏：在对话框非发言侧显示层数铭牌
    if (!isPortraitMob) {
      g.fillStyle = 'rgba(246, 211, 121, 0.90)';
      g.font = `700 ${isLandscapeMob ? 11.5 : 12.5}px -apple-system, "PingFang SC", sans-serif`;
      g.textAlign = rightActive ? 'left' : 'right';
      g.fillText(
        `🕯️ ${st.plaque || ''}  (${st.idx + 1}/${st.lines.length})`,
        rightActive ? (bx + 24) : (bx + boxW - 24),
        by + (isLandscapeMob ? 24 : 31)
      );
    }

    // 台词正文打字机渲染
    g.fillStyle = '#fbf6eb';
    g.font = `600 ${fontPx}px "Songti SC", "Noto Serif SC", "PingFang SC", serif`;
    g.textAlign = 'left';
    const firstLineY = by + topTextPad;
    for (let r = 0; r < wrapped.length; r++) {
      g.fillText(wrapped[r], bx + textPadX, firstLineY + r * lineH);
    }

    // 底部细金句序进度尺 + 右下角呼吸继续提示
    const lineProg = (st.idx + (st.lineRevealed ? 1 : shownChars / Math.max(1, fullText.length))) / Math.max(1, st.lines.length);
    const barW = Math.min(isPortraitMob ? 110 : 200, boxW * 0.28);
    const barY = by + boxH - (isLandscapeMob ? 15 : 19);
    g.fillStyle = 'rgba(148, 163, 184, 0.22)';
    g.fillRect(bx + textPadX, barY, barW, 3);
    g.fillStyle = activeCast.accent;
    g.fillRect(bx + textPadX, barY, barW * lineProg, 3);

    const pulse = 0.55 + Math.sin(_timeT * 6) * 0.35;
    g.fillStyle = `rgba(246, 211, 121, ${pulse.toFixed(3)})`;
    g.font = `700 ${isPortraitMob || isLandscapeMob ? 11.5 : 12.5}px -apple-system, "PingFang SC", sans-serif`;
    g.textAlign = 'right';
    const nextHint = mob
      ? (st.lineRevealed
          ? (_autoPlay ? '▶ 自动推进中 · 轻触下一句 ▸' : '轻触下一句 ▸')
          : '轻触显字 ▸')
      : (st.lineRevealed
          ? (_autoPlay ? '▶ 自动推进中 · 点击下一句 ▸' : '点击 / 空格 下一句 ▸')
          : '点击 / 空格 立即显字 ▸');
    g.fillText(nextHint, bx + boxW - textPadX, by + boxH - (isLandscapeMob ? 11 : 14));

    // 桌面端与手机端均开放 [▶ 自动] 与 [跳过 ▸] 快捷胶囊
    _drawTopControls(g, '跳过对话 [ESC]', true);

    if (st.flashT > 0) {
      g.fillStyle = `rgba(255, 250, 240, ${Math.min(0.85, st.flashT * 2.4).toFixed(3)})`;
      g.fillRect(0, 0, _vw, _vh);
    }
    g.restore();
  }

  function render() {
    if (!_cur && !_fadeOut) return;
    const g = _ensureCanvas();
    if (!g) return;
    g.save();
    g.setTransform(_dpr, 0, 0, _dpr, 0, 0);
    g.clearRect(0, 0, _vw, _vh);

    if (_cur) {
      if (_cur.kind === 'curtain') _renderCurtain(g, _cur);
      else if (_cur.kind === 'shots') _renderShots(g, _cur);
      else if (_cur.kind === 'dialogue') _renderDialogue(g, _cur);
    } else if (_fadeOut) {
      const a = Math.max(0, _fadeOut.t / Math.max(0.01, _fadeOut.maxT)) * 0.48;
      g.fillStyle = `rgba(5, 8, 16, ${a.toFixed(3)})`;
      g.fillRect(0, 0, _vw, _vh);
    }
    g.restore();
  }

  function isBlockingGameplay() {
    return !!_cur;
  }

  function isActive() {
    return !!(_cur || _queue.length > 0);
  }

  function getTimeScale() {
    if (_hitstopT > 0) return 0.04;
    if (_slowmoT > 0) return 0.38;
    return 1.0;
  }

  return {
    CHAR_CAST,
    onResize,
    abortActive,
    resetForNewRun,
    triggerHitstop,
    toggleAutoPlay,
    setAutoPlay,
    isAutoPlay,
    playOpeningSequence,
    onWaveStart,
    onBossPhase2,
    onBossDefeated,
    advanceOrSkip,
    update,
    render,
    isBlockingGameplay,
    isActive,
    getTimeScale
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.SpireDirector = SpireDirector;
}
