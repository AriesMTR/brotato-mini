// ============================================================================
// 🕯️ 《烬塔残响：第999次救赎》高清原画贴图缓存引擎（4帧动作精灵表 + 左侧半身对话立绘 + 宽银幕剧场CG）
// 性能优化核心：异步 Image 解码 + 一次性离屏预烘焙高分辨率透明贴图与纯白受击剪影，
// 局内单帧百怪仅需极速 ctx.drawImage 批绘（0 实时滤镜 / 0 radialGradient / 0 shadowBlur）！
// 同时兼容 window.__SPIRE_INLINE_ASSETS__（单文件离线版自动直连内存资源）。
// ============================================================================

const SPIRE_STORY_PACK = {
  arenaMaps: {
    foundry:   'assets/spire/scene_1_arena.jpg',
    glacier:   'assets/spire/scene_2_arena.jpg',
    wasteland: 'assets/spire/scene_3_arena.jpg',
    desert:    'assets/spire/scene_4_arena.jpg'
  },
  vistaMaps: {
    foundry:   'assets/spire/scene_1_vista.jpg',
    glacier:   'assets/spire/scene_2_vista.jpg',
    wasteland: 'assets/spire/scene_3_vista.jpg',
    desert:    'assets/spire/scene_4_vista.jpg'
  },
  cutscenes: {
    act1: {
      actKey: 'act1',
      chapter: '第一幕 · 雨夜长桥 · 断刃狐面之约',
      speaker: '绯红断刃剑姬 · 烬羽',
      frames: [
        'assets/spire/cut_act1_1.jpg',
        'assets/spire/cut_act1_2.jpg',
        'assets/spire/cut_act1_3.jpg'
      ],
      lines: [
        '「九百九十八次雨夜，你每次提着这盏青灯走上孤桥，都会忘记我的名字。」',
        '「既然立下守桥死誓——想踏过第一幕长桥，就先斩断我这柄残红太刀吧！」',
        '「狐面碎裂之时，愿这一缕余烬，能替你照亮通往永冻冰窟的路……」'
      ]
    },
    act2: {
      actKey: 'act2',
      chapter: '第二幕 · 永冻冰窟 · 碎冕星使的叹息',
      speaker: '永冻星使 · 艾丝特莉亚',
      frames: [
        'assets/spire/cut_act2_1.jpg',
        'assets/spire/cut_act2_2.jpg',
        'assets/spire/cut_act2_3.jpg'
      ],
      lines: [
        '「千年前黑日降临之夜，是你亲口求我冰封整座王城，连同你的罪与记忆。」',
        '「时间早已冻停在银怀表里……若你执意唤醒真相，便承受碎冕星霜的审判！」',
        '「原来冰泪融化时是温热的……去吧，伽蓝还在倒悬钟楼等你。」'
      ]
    },
    act3: {
      actKey: 'act3',
      chapter: '第三幕 · 倒悬钟楼 · 逆转黄金发条',
      speaker: '紫电弦月人偶 · 伽蓝',
      frames: [
        'assets/spire/cut_act3_1.jpg',
        'assets/spire/cut_act3_2.jpg',
        'assets/spire/cut_act3_3.jpg'
      ],
      lines: [
        '「嘀嗒、嘀嗒——第 999 号提灯容器，你比上一世早到了整整三秒钟。」',
        '「我把灵魂锻进这具发条躯壳，就是为了在钟摆停摆前，替你校准弑神的枪口！」',
        '「黄金发条拧断了……往上走吧，黑水巨镜里坐着的，正是你自己！」'
      ]
    },
    act4: {
      actKey: 'act4',
      chapter: '终幕 · 日蚀镜界 · 第999次救赎',
      speaker: '第999号 · 日蚀圣女（镜中真我）',
      frames: [
        'assets/spire/cut_act4_1.jpg',
        'assets/spire/cut_act4_2.jpg',
        'assets/spire/cut_act4_3.jpg'
      ],
      lines: [
        '「欢迎归来，我的第 999 具白衣分身。你一路收集的魂火，终于足够点燃黑日。」',
        '「九百九十八次轮回皆归灰烬——唯有斩碎镜中的我，第一千道破晓才会降临！」',
        '「黑纱坠落，宿命闭环……这一次，换你带着挚友们的残响活下去！」'
      ]
    }
  },
  // 适配 16 层四幕攀登的 15 段青羽行商层间私语（第 1→2 层 至 第 15→16 层逐层推进伏笔）
  witchWhispers: [
    '青羽轻拂帽檐风翎：「提灯少女，欢迎来到风语行商……哪怕失去了记忆，你的手指依然记得握铳的姿势呢。」',
    '青羽递来一杯温茶：「听见桥头的雨声了吗？第 4 层守桥的红衣剑姬叫烬羽，她戴着半截白狐面，只是怕你看见她哭红的眼眶。」',
    '青羽凝视魂灯青焰：「前方便是第一幕终战了。两把同名同阶的守誓兵装可以共鸣升阶，整备妥当再去赴她的约吧。」',
    '青羽将那枚滚烫的红绳系上你的灯柄：「烬羽终于能睡个好觉了……往上走吧，第二幕永冻冰窟的风雪会更冷一些。」',
    '青羽哈出一口白雾：「第 6 层有极北冰骑统领巡弋，多备些高穿甲或元素兵装，别被寒霜冻住了脚步。」',
    '青羽指尖掠过柜台古卷：「艾丝特莉亚胸前那块停在子夜的银怀表，其实是千年前你亲手托付给她的信物。」',
    '青羽轻叹一声：「第 8 层的冰晶王座就在眼前了……去敲碎那座冰棺吧，她已经独自在暴风雪里站了一千年。」',
    '青羽微笑着替你拂去肩头碎雪：「两把温柔的锁都化作了你的灯火。踏入第三幕倒悬钟楼后，小心空间裂隙机关。」',
    '青羽望向逆转的黄金齿轮：「第 10 层有暗雷统领设伏。伽蓝那孩子嘴硬心软，总把最好的发条核心偷偷塞进我的货箱里。」',
    '青羽整理着羽毛披肩：「伽蓝把自己改造成不会老去的人偶，只为在每一次轮回里亲手测量你的剑与铳够不够快。」',
    '青羽神色肃然：「前面第 12 层就是星晷断罪台了……接住伽蓝的最后一课吧，别让那孩子的漫长等待白费。」',
    '青羽仰望塔顶倒悬的黑日：「三把锁尽数解开，我们已踏入终幕·日蚀镜界。脚下的黑水，映出的全是过往九百九十八具白衣残影。」',
    '青羽将一枚青翠风翎别在你领口：「第 14 层的黑金重盾统领是镜界最后的卫戍。握紧提灯，别让黑日低语动摇心神。」',
    '青羽眼眶微红却笑着眨眼：「你知道吗？我们四个从来不是被困在塔里的怪物——而是自愿替你锁住黑日诅咒的四把钥匙呀。」',
    '青羽深深向你行了一礼：「推开第 16 层那扇黑曜石门吧，零号白衣！斩碎镜中的『日蚀圣女』，我们在第一千道破晓重逢！」'
  ]
};

const SpireAssets = (function () {
  const _imgCache = Object.create(null);
  const _spriteBank = Object.create(null);
  const _sheetBank = Object.create(null);

  // 角色单帧立绘兜底映射
  const HERO_MAP = {
    allrounder:  'assets/spire/hero_zero.png',
    brawler:     'assets/spire/hero_jinyu.png',
    ranger:      'assets/spire/hero_astria.png',
    engineer:    'assets/spire/hero_jialan.png',
    ghost:       'assets/spire/hero_qingyu.png',
    multitasker: 'assets/spire/hero_eclipse.png',
    vampire:     'assets/spire/hero_jinyu.png',
    bull:        'assets/spire/hero_jialan.png'
  };

  // 已做质心与脚底基线严密对齐的 1024×256 四帧横版透明精灵表（F0待机 / F1左迈步 / F2右迈步 / F3招牌挥击）
  const HERO_SHEET_MAP = {
    zero:          'assets/spire/hero_zero_sheet.png',
    allrounder:    'assets/spire/hero_zero_sheet.png',
    jinyu:         'assets/spire/hero_jinyu_sheet.png',
    brawler:       'assets/spire/hero_jinyu_sheet.png',
    vampire:       'assets/spire/hero_jinyu_sheet.png',
    butcher:       'assets/spire/hero_jinyu_sheet.png',
    crimson_lord:  'assets/spire/hero_jinyu_sheet.png',
    astria:        'assets/spire/hero_astria_sheet.png',
    ranger:        'assets/spire/hero_astria_sheet.png',
    frost_queen:   'assets/spire/hero_astria_sheet.png',
    jialan:        'assets/spire/hero_jialan_sheet.png',
    engineer:      'assets/spire/hero_jialan_sheet.png',
    bull:          'assets/spire/hero_jialan_sheet.png',
    void_weaver:   'assets/spire/hero_jialan_sheet.png',
    qingyu:        'assets/spire/hero_qingyu_sheet.png',
    ghost:         'assets/spire/hero_qingyu_sheet.png',
    plague_empress:'assets/spire/hero_qingyu_sheet.png',
    eclipse:       'assets/spire/hero_eclipse_sheet.png',
    multitasker:   'assets/spire/hero_eclipse_sheet.png',
    solar_seraph:  'assets/spire/hero_eclipse_sheet.png'
  };

  // 设定集【左栏二次元半身立绘】高清映射（兼容角色 ID 与首领 variant ID）
  const PORTRAIT_MAP = {
    zero:             'assets/spire/port_zero.jpg',
    allrounder:       'assets/spire/port_zero.jpg',
    jinyu:            'assets/spire/port_jinyu.jpg',
    brawler:          'assets/spire/port_jinyu.jpg',
    butcher:          'assets/spire/port_jinyu.jpg',
    crimson_lord:     'assets/spire/port_jinyu.jpg',
    pyro_lord:        'assets/spire/port_jinyu.jpg',
    vanguard:         'assets/spire/port_jinyu.jpg',
    astria:           'assets/spire/port_astria.jpg',
    ranger:           'assets/spire/port_astria.jpg',
    frost_queen:      'assets/spire/port_astria.jpg',
    glacial_valkyrie: 'assets/spire/port_astria.jpg',
    jialan:           'assets/spire/port_jialan.jpg',
    engineer:         'assets/spire/port_jialan.jpg',
    void_weaver:      'assets/spire/port_jialan.jpg',
    mech_colossus:    'assets/spire/port_jialan.jpg',
    shadow_stalker:   'assets/spire/port_jialan.jpg',
    storm_siren:      'assets/spire/port_jialan.jpg',
    golden_golem:     'assets/spire/port_jialan.jpg',
    qingyu:           'assets/spire/port_qingyu.jpg',
    ghost:            'assets/spire/port_qingyu.jpg',
    plague_empress:   'assets/spire/port_qingyu.jpg',
    venom_matriarch:  'assets/spire/port_qingyu.jpg',
    eclipse:          'assets/spire/port_eclipse.jpg',
    multitasker:      'assets/spire/port_eclipse.jpg',
    solar_seraph:     'assets/spire/port_eclipse.jpg',
    iron_warden:      'assets/spire/port_eclipse.jpg',
    abyss_devourer:   'assets/spire/port_eclipse.jpg'
  };

  const PROP_MAP = {
    foundry:   'assets/spire/prop_s1_lantern.png',
    glacier:   'assets/spire/prop_s2_crystal.png',
    wasteland: 'assets/spire/prop_s3_pillar.png',
    desert:    'assets/spire/prop_s4_monolith.png'
  };

  const SCENE_MOBS = {
    foundry:   { melee: 'assets/spire/mob_s1_ronin.png',   ranged: 'assets/spire/mob_s1_umbrella.png', heavy: 'assets/spire/mob_s1_guard.png' },
    glacier:   { melee: 'assets/spire/mob_s2_spider.png',  ranged: 'assets/spire/mob_s2_prism.png',    heavy: 'assets/spire/mob_s2_knight.png' },
    wasteland: { melee: 'assets/spire/mob_s3_duelist.png', ranged: 'assets/spire/mob_s3_gyro.png',     heavy: 'assets/spire/mob_s3_bomb.png' },
    desert:    { melee: 'assets/spire/mob_s4_shade.png',   ranged: 'assets/spire/mob_s4_seraph.png',   heavy: 'assets/spire/mob_s4_colossus.png' }
  };

  const BOSS_SPRITE_MAP = {
    butcher:          'assets/spire/hero_jinyu.png',
    crimson_lord:     'assets/spire/hero_jinyu.png',
    frost_queen:      'assets/spire/hero_astria.png',
    glacial_valkyrie: 'assets/spire/mob_s2_knight.png',
    void_weaver:      'assets/spire/hero_jialan.png',
    mech_colossus:    'assets/spire/mob_s4_colossus.png',
    plague_empress:   'assets/spire/hero_qingyu.png',
    solar_seraph:     'assets/spire/hero_eclipse.png',
    abyss_devourer:   'assets/spire/mob_s4_seraph.png',
    golden_golem:     'assets/spire/mob_s4_colossus.png',
    vanguard:         'assets/spire/mob_s1_guard.png',
    pyro_lord:        'assets/spire/mob_s1_umbrella.png',
    shadow_stalker:   'assets/spire/mob_s3_duelist.png',
    venom_matriarch:  'assets/spire/mob_s1_ronin.png',
    iron_warden:      'assets/spire/mob_s4_colossus.png',
    storm_siren:      'assets/spire/mob_s3_gyro.png'
  };

  function resolve(relPath) {
    if (!relPath) return '';
    if (typeof window !== 'undefined' && window.__SPIRE_INLINE_ASSETS__ && window.__SPIRE_INLINE_ASSETS__[relPath]) {
      return window.__SPIRE_INLINE_ASSETS__[relPath];
    }
    return relPath;
  }

  function loadImage(relPath, onReady) {
    if (!relPath || typeof Image === 'undefined') return null;
    let rec = _imgCache[relPath];
    if (rec) {
      if (rec.ready && onReady) onReady(rec.img);
      else if (onReady) rec.cbs.push(onReady);
      return rec.ready ? rec.img : null;
    }
    const img = new Image();
    rec = { img, ready: false, cbs: onReady ? [onReady] : [] };
    _imgCache[relPath] = rec;
    img.decoding = 'async';
    img.onload = function () {
      rec.ready = img.naturalWidth > 0;
      const list = rec.cbs.splice(0, rec.cbs.length);
      for (let i = 0; i < list.length; i++) {
        try { list[i](img); } catch (_) {}
      }
    };
    img.onerror = function () { rec.cbs.length = 0; };
    img.src = resolve(relPath);
    return rec.ready ? img : null;
  }

  // 高清 256px Retina 级单帧贴图与受击白影预烘焙
  function ensureSpriteEntry(relPath, maxPx) {
    if (!relPath || typeof document === 'undefined') return null;
    const cap = maxPx || 240;
    const cacheKey = relPath + '@' + cap;
    let entry = _spriteBank[cacheKey];
    if (entry) return entry.ready ? entry : null;
    entry = { ready: false, normal: null, flash: null, normalView: null, flashView: null, w: cap, h: cap };
    _spriteBank[cacheKey] = entry;
    loadImage(relPath, function (img) {
      const nw = img.naturalWidth || 256, nh = img.naturalHeight || 256;
      const scale = Math.min(1, cap / Math.max(nw, nh));
      const tw = Math.max(16, Math.round(nw * scale));
      const th = Math.max(16, Math.round(nh * scale));

      const cNorm = document.createElement('canvas');
      cNorm.width = tw; cNorm.height = th;
      const gn = cNorm.getContext('2d');
      gn.imageSmoothingEnabled = true;
      if ('imageSmoothingQuality' in gn) gn.imageSmoothingQuality = 'high';
      gn.drawImage(img, 0, 0, tw, th);

      const cFlash = document.createElement('canvas');
      cFlash.width = tw; cFlash.height = th;
      const gf = cFlash.getContext('2d');
      gf.drawImage(cNorm, 0, 0);
      gf.globalCompositeOperation = 'source-in';
      gf.fillStyle = '#ffffff';
      gf.fillRect(0, 0, tw, th);

      entry.normal = cNorm;
      entry.flash = cFlash;
      entry.w = tw;
      entry.h = th;
      // Stable views are shared by draw calls. Hundreds of sprites no longer
      // allocate a short-lived wrapper every frame while reading this cache.
      entry.normalView = { canvas: cNorm, w: tw, h: th };
      entry.flashView = { canvas: cFlash, w: tw, h: th };
      entry.ready = true;
    });
    return entry.ready ? entry : null;
  }

  // 原生 1024×256（单格 256×256）四帧精灵表与受击白影预烘焙
  function ensureSheetEntry(relPath) {
    if (!relPath || typeof document === 'undefined') return null;
    let entry = _sheetBank[relPath];
    if (entry) return entry.ready ? entry : null;
    entry = { ready: false, normal: null, flash: null, normalView: null, flashView: null, cellW: 256, cellH: 256, frames: 4 };
    _sheetBank[relPath] = entry;
    loadImage(relPath, function (img) {
      const nw = img.naturalWidth || 1024;
      const nh = img.naturalHeight || 256;
      const frames = nw >= nh * 3 ? 4 : 1;
      const cellW = Math.max(32, Math.floor(nw / frames));
      const cellH = Math.max(32, nh);

      const cNorm = document.createElement('canvas');
      cNorm.width = nw; cNorm.height = nh;
      const gn = cNorm.getContext('2d');
      gn.imageSmoothingEnabled = true;
      if ('imageSmoothingQuality' in gn) gn.imageSmoothingQuality = 'high';
      gn.drawImage(img, 0, 0, nw, nh);

      const cFlash = document.createElement('canvas');
      cFlash.width = nw; cFlash.height = nh;
      const gf = cFlash.getContext('2d');
      gf.drawImage(cNorm, 0, 0);
      gf.globalCompositeOperation = 'source-in';
      gf.fillStyle = '#ffffff';
      gf.fillRect(0, 0, nw, nh);

      entry.normal = cNorm;
      entry.flash = cFlash;
      entry.cellW = cellW;
      entry.cellH = cellH;
      entry.frames = frames;
      entry.normalView = { canvas: cNorm, cellW, cellH, frames };
      entry.flashView = { canvas: cFlash, cellW, cellH, frames };
      entry.ready = true;
    });
    return entry.ready ? entry : null;
  }

  function getHeroSheet(keyOrCls, flash) {
    const rel = HERO_SHEET_MAP[keyOrCls];
    if (!rel) return null;
    const ent = ensureSheetEntry(rel);
    if (!ent) return null;
    return flash ? ent.flashView : ent.normalView;
  }

  function getHeroSprite(cls, flash) {
    const rel = HERO_MAP[cls] || HERO_MAP.allrounder;
    const ent = ensureSpriteEntry(rel, 256);
    if (!ent) return null;
    return flash ? ent.flashView : ent.normalView;
  }

  function getPropSprite(sceneId, flash) {
    const rel = PROP_MAP[sceneId] || PROP_MAP.foundry;
    const ent = ensureSpriteEntry(rel, 224);
    if (!ent) return null;
    return flash ? ent.flashView : ent.normalView;
  }

  function pickMonsterPath(e) {
    if (!e) return 'assets/spire/mob_s1_ronin.png';
    if ((e.type === 'boss' || e.type === 'mini_boss' || e.type === 'special_boss') && e.variant && BOSS_SPRITE_MAP[e.variant]) {
      return BOSS_SPRITE_MAP[e.variant];
    }
    const scId = (typeof curScene !== 'undefined' && curScene && curScene.id) ? curScene.id : 'foundry';
    const pack = SCENE_MOBS[scId] || SCENE_MOBS.foundry;

    switch (e.type) {
      case 'magma_imp':    return 'assets/spire/mob_s1_umbrella.png';
      case 'frost_wisp':   return 'assets/spire/mob_s2_prism.png';
      case 'rad_scorpion': return 'assets/spire/mob_s3_duelist.png';
      case 'sand_worm':    return 'assets/spire/mob_s4_shade.png';
      case 'spore_mother': return 'assets/spire/mob_s4_seraph.png';
      case 'bomber':       return 'assets/spire/mob_s3_bomb.png';
      case 'spinner':      return 'assets/spire/mob_s3_gyro.png';
      case 'juggernaut':   return 'assets/spire/mob_s4_colossus.png';
      case 'summoner':
      case 'healer':       return scId === 'foundry' ? 'assets/spire/mob_s1_umbrella.png' : 'assets/spire/mob_s4_seraph.png';
      case 'shooter':
      case 'sniper_bug':
      case 'mortar':       return pack.ranged;
      case 'brute':
      case 'shielder':
      case 'charger':      return pack.heavy;
      default:             return pack.melee;
    }
  }

  function getMonsterSprite(e, flash) {
    const rel = pickMonsterPath(e);
    const isBig = e && (e.type === 'boss' || e.type === 'special_boss' || e.type === 'mini_boss' || e.type === 'juggernaut');
    const ent = ensureSpriteEntry(rel, isBig ? 256 : 208);
    if (!ent) return null;
    return flash ? ent.flashView : ent.normalView;
  }

  const _arenaHooked = Object.create(null);
  function getArenaBg(sceneId) {
    const rel = SPIRE_STORY_PACK.arenaMaps[sceneId] || SPIRE_STORY_PACK.arenaMaps.foundry;
    const cached = _imgCache[rel];
    if (cached && cached.ready) return cached.img;
    if (_arenaHooked[sceneId]) return loadImage(rel);
    _arenaHooked[sceneId] = true;
    return loadImage(rel, function () {
      if (typeof curScene !== 'undefined' && curScene && curScene.id === sceneId) {
        if (typeof bakedSceneKey !== 'undefined') bakedSceneKey = '';
        if (typeof bootReady !== 'undefined' && bootReady && typeof buildFloorTexture === 'function') {
          buildFloorTexture();
        }
      }
    });
  }

  function getPortrait(keyOrVariant) {
    const rel = PORTRAIT_MAP[keyOrVariant] || 'assets/spire/port_zero.jpg';
    return loadImage(rel);
  }

  function getPortraitSrc(keyOrVariant) {
    const rel = PORTRAIT_MAP[keyOrVariant] || 'assets/spire/port_zero.jpg';
    return resolve(rel);
  }

  function getCutscene(variant) {
    let actKey = 'act1';
    if (variant === 'frost_queen' || variant === 'glacial_valkyrie') actKey = 'act2';
    else if (variant === 'void_weaver' || variant === 'mech_colossus' || variant === 'shadow_stalker' || variant === 'storm_siren' || variant === 'golden_golem') actKey = 'act3';
    else if (variant === 'solar_seraph' || variant === 'iron_warden' || variant === 'abyss_devourer') actKey = 'act4';
    const pack = SPIRE_STORY_PACK.cutscenes[actKey];
    if (!pack) return null;
    const imgs = pack.frames.map(src => loadImage(src));
    return {
      actKey: pack.actKey,
      chapter: pack.chapter,
      speaker: pack.speaker,
      lines: pack.lines,
      imgs
    };
  }

  function warmup() {
    if (typeof Image === 'undefined') return;
    // Only the first playable area is warmed. Later scenes/sheets use the same
    // cached lazy getters; obsolete cutscenes are no longer decoded at startup.
    const jobs = [
      () => ensureSheetEntry(HERO_SHEET_MAP.zero),
      () => getArenaBg('foundry'),
      () => ensureSpriteEntry(PROP_MAP.foundry, 224),
      ...Object.values(SCENE_MOBS.foundry).map(p => () => ensureSpriteEntry(p, 208))
    ];
    const idle = typeof requestIdleCallback === 'function'
      ? cb => requestIdleCallback(cb, { timeout: 1500 })
      : cb => setTimeout(cb, 120);
    const next = () => { const job = jobs.shift(); if (job) { job(); if (jobs.length) idle(next); } };
    idle(next);
  }

  warmup();

  return {
    resolve,
    loadImage,
    getHeroSheet,
    getHeroSprite,
    getPropSprite,
    getMonsterSprite,
    getArenaBg,
    getPortrait,
    getPortraitSrc,
    getCutscene
  };
})();

function getSpireArenaBgImage(sceneId) {
  return SpireAssets.getArenaBg(sceneId);
}

function getBossAnimePortrait(variant, isMythic = false) {
  return SpireAssets.getPortrait(variant, isMythic);
}

function getSpireCutscenePack(variant) {
  return SpireAssets.getCutscene(variant);
}

if (typeof globalThis !== 'undefined') {
  globalThis.SPIRE_STORY_PACK = SPIRE_STORY_PACK;
  globalThis.SpireAssets = SpireAssets;
  globalThis.getSpireArenaBgImage = getSpireArenaBgImage;
  globalThis.getBossAnimePortrait = getBossAnimePortrait;
  globalThis.getSpireCutscenePack = getSpireCutscenePack;
}
