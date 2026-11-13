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

  // 全 21 种普通怪与层域专属精英怪 1:1 独立高清贴图映射（零复用、造型与攻击机制严密对应）
  const MONSTER_SPRITE_MAP = {
    chaser:       'assets/spire/mob_s1_ronin.png',
    swarmer:      'assets/spire/mob_swarmer.png',
    stalker:      'assets/spire/mob_stalker.png',
    magma_imp:    'assets/spire/mob_s1_umbrella.png',
    shielder:     'assets/spire/mob_shielder.png',
    shooter:      'assets/spire/mob_s2_prism.png',
    charger:      'assets/spire/mob_charger.png',
    sniper_bug:   'assets/spire/mob_sniper_bug.png',
    frost_wisp:   'assets/spire/mob_frost_wisp.png',
    bomber:       'assets/spire/mob_bomber.png',
    spinner:      'assets/spire/mob_spinner.png',
    mortar:       'assets/spire/mob_mortar.png',
    rad_scorpion: 'assets/spire/mob_rad_scorpion.png',
    splitter:     'assets/spire/mob_splitter.png',
    mini_slime:   'assets/spire/mob_mini_slime.png',
    summoner:     'assets/spire/mob_summoner.png',
    healer:       'assets/spire/mob_healer.png',
    brute:        'assets/spire/mob_brute.png',
    juggernaut:   'assets/spire/mob_juggernaut.png',
    sand_worm:    'assets/spire/mob_sand_worm.png',
    spore_mother: 'assets/spire/mob_s5_reliquary.png'
  };

  // 全 16 位守誓主宰、先锋统领与无尽祭坛首领 1:1 独立贴图映射（零复用）
  const BOSS_SPRITE_MAP = {
    butcher:          'assets/spire/hero_jinyu.png',
    frost_queen:      'assets/spire/hero_astria.png',
    void_weaver:      'assets/spire/hero_jialan.png',
    mech_colossus:    'assets/spire/boss_mech_colossus.png',
    plague_empress:   'assets/spire/hero_qingyu.png',
    solar_seraph:     'assets/spire/hero_eclipse.png',
    crimson_lord:     'assets/spire/sb_crimson_lord.png',
    golden_golem:     'assets/spire/sb_golden_golem.png',
    abyss_devourer:   'assets/spire/sb_abyss_devourer.png',
    vanguard:         'assets/spire/mb_vanguard.png',
    pyro_lord:        'assets/spire/mb_pyro_lord.png',
    glacial_valkyrie: 'assets/spire/mb_glacial_valkyrie.png',
    shadow_stalker:   'assets/spire/mb_shadow_stalker.png',
    storm_siren:      'assets/spire/mb_storm_siren.png',
    venom_matriarch:  'assets/spire/mb_venom_matriarch.png',
    iron_warden:      'assets/spire/mb_iron_warden.png'
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

  // 高清 256~300px Retina 级单帧贴图与柔和受击高光预烘焙
  function ensureSpriteEntry(relPath, maxPx) {
    if (!relPath || typeof document === 'undefined') return null;
    const cap = maxPx || 256;
    const cacheKey = relPath + '@' + cap;
    let entry = _spriteBank[cacheKey];
    if (entry) return entry.ready ? entry : null;
    entry = { ready: false, normal: null, flash: null, w: cap, h: cap };
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
      gf.globalCompositeOperation = 'source-atop';
      gf.fillStyle = 'rgba(255, 250, 240, 0.32)';
      gf.fillRect(0, 0, tw, th);

      entry.normal = cNorm;
      entry.flash = cFlash;
      entry.w = tw;
      entry.h = th;
      entry.ready = true;
    });
    return entry.ready ? entry : null;
  }

  // 原生 1024×256（单格 256×256）四帧精灵表与柔和受击高光预烘焙
  function ensureSheetEntry(relPath) {
    if (!relPath || typeof document === 'undefined') return null;
    let entry = _sheetBank[relPath];
    if (entry) return entry.ready ? entry : null;
    entry = { ready: false, normal: null, flash: null, cellW: 256, cellH: 256, frames: 4 };
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
      gf.globalCompositeOperation = 'source-atop';
      gf.fillStyle = 'rgba(255, 250, 240, 0.32)';
      gf.fillRect(0, 0, nw, nh);

      entry.normal = cNorm;
      entry.flash = cFlash;
      entry.cellW = cellW;
      entry.cellH = cellH;
      entry.frames = frames;
      entry.ready = true;
    });
    return entry.ready ? entry : null;
  }

  function getHeroSheet(keyOrCls, flash) {
    const rel = HERO_SHEET_MAP[keyOrCls];
    if (!rel) return null;
    const ent = ensureSheetEntry(rel);
    if (!ent) return null;
    return {
      canvas: flash ? ent.flash : ent.normal,
      cellW: ent.cellW,
      cellH: ent.cellH,
      frames: ent.frames
    };
  }

  function getHeroSprite(cls, flash) {
    const rel = HERO_MAP[cls] || HERO_MAP.allrounder;
    const ent = ensureSpriteEntry(rel, 256);
    if (!ent) return null;
    return { canvas: flash ? ent.flash : ent.normal, w: ent.w, h: ent.h };
  }

  function getPropSprite(sceneId, flash) {
    const rel = PROP_MAP[sceneId] || PROP_MAP.foundry;
    const ent = ensureSpriteEntry(rel, 224);
    if (!ent) return null;
    return { canvas: flash ? ent.flash : ent.normal, w: ent.w, h: ent.h };
  }

  function pickMonsterPath(e) {
    if (!e) return MONSTER_SPRITE_MAP.chaser;
    if ((e.type === 'boss' || e.type === 'mini_boss' || e.type === 'special_boss') && e.variant && BOSS_SPRITE_MAP[e.variant]) {
      return BOSS_SPRITE_MAP[e.variant];
    }
    if (e.type && MONSTER_SPRITE_MAP[e.type]) {
      return MONSTER_SPRITE_MAP[e.type];
    }
    return MONSTER_SPRITE_MAP.chaser;
  }

  function getMonsterSprite(e, flash) {
    const rel = pickMonsterPath(e);
    const isBig = e && (e.type === 'boss' || e.type === 'special_boss' || e.type === 'mini_boss' || e.type === 'juggernaut');
    const ent = ensureSpriteEntry(rel, isBig ? 300 : 256);
    if (!ent) return null;
    return { canvas: flash ? ent.flash : ent.normal, w: ent.w, h: ent.h };
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
    // 第一优先级：开场动画 3 镜 + 第一幕远景/地面 + 全部 6 位主角左侧半身立绘与 4 帧动作表！
    ['assets/spire/cut_intro_1.jpg', 'assets/spire/cut_intro_2.jpg', 'assets/spire/cut_intro_3.jpg'].forEach(f => loadImage(f));
    loadImage(SPIRE_STORY_PACK.vistaMaps.foundry);
    getArenaBg('foundry');
    const uniqueSheets = new Set(Object.values(HERO_SHEET_MAP));
    uniqueSheets.forEach(s => ensureSheetEntry(s));
    const uniquePortraits = new Set(Object.values(PORTRAIT_MAP));
    uniquePortraits.forEach(p => loadImage(p));
    Object.values(HERO_MAP).forEach(p => ensureSpriteEntry(p, 256));
    ensureSpriteEntry(PROP_MAP.foundry, 224);
    ['chaser', 'swarmer', 'stalker', 'magma_imp', 'shielder', 'shooter'].forEach(k => {
      ensureSpriteEntry(MONSTER_SPRITE_MAP[k], 256);
    });

    const idle = (typeof requestIdleCallback === 'function')
      ? cb => requestIdleCallback(cb, { timeout: 1000 })
      : cb => setTimeout(cb, 160);

    idle(function () {
      ['glacier', 'wasteland', 'desert'].forEach(sc => {
        getArenaBg(sc);
        loadImage(SPIRE_STORY_PACK.vistaMaps[sc]);
        ensureSpriteEntry(PROP_MAP[sc], 224);
      });
      Object.entries(MONSTER_SPRITE_MAP).forEach(([k, p]) => {
        ensureSpriteEntry(p, k === 'juggernaut' ? 300 : 256);
      });
      Object.values(BOSS_SPRITE_MAP).forEach(p => ensureSpriteEntry(p, 300));
    });

    setTimeout(function () {
      Object.values(SPIRE_STORY_PACK.cutscenes).forEach(pk => pk.frames.forEach(f => loadImage(f)));
      [
        'assets/spire/cut_defeat_act1_1.jpg', 'assets/spire/cut_defeat_act1_2.jpg',
        'assets/spire/cut_defeat_act2_1.jpg', 'assets/spire/cut_defeat_act2_2.jpg',
        'assets/spire/cut_defeat_act3_1.jpg', 'assets/spire/cut_defeat_act3_2.jpg',
        'assets/spire/cut_defeat_act4_1.jpg', 'assets/spire/cut_defeat_act4_2.jpg'
      ].forEach(f => loadImage(f));
    }, 650);
  }

  warmup();

  return {
    resolve,
    loadImage,
    getHeroSheet,
    getHeroSprite,
    getPropSprite,
    pickMonsterPath,
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

// ============================================================================
// 👑 全 16 大首领（6 守誓主宰 + 7 先锋统领 + 3 记忆祭坛首领）专属一阶段/二阶段破框半身立绘库
// 一阶段：33% 概率触发登场横幅展示夏装半身立绘（440×516 高清无锯齿透明抠图）
// 二阶段：33% 概率觉醒神话二阶段，且觉醒时 100% 必出二阶段专属隐藏换装立绘横幅！
// ============================================================================
const BOSS_PORTRAIT_DATA = {
  butcher: {
    w: 440, h: 516,
    personaName: '烬羽 · 绯红断刃剑姬',
    summerTitle: '绯红魔角夏装',
    mythicTitle: '真红魅魔纱裙泳装'
  },
  frost_queen: {
    w: 440, h: 516,
    personaName: '艾丝特莉亚 · 永冻星使',
    summerTitle: '冰晶碎冕夏装',
    mythicTitle: '凛冬冰晶轻纱泳装'
  },
  mech_colossus: {
    w: 440, h: 516,
    personaName: '泰娅 · 倒悬重装机神',
    summerTitle: '炽橙机能夏装',
    mythicTitle: '超载炽金度假泳装'
  },
  void_weaver: {
    w: 440, h: 516,
    personaName: '伽蓝 · 紫电弦月少主',
    summerTitle: '紫晶蝶翼夏装',
    mythicTitle: '星渊蝶纱魅影泳装'
  },
  plague_empress: {
    w: 440, h: 516,
    personaName: '青羽 · 残羽风语魔女',
    summerTitle: '翠蝶流金夏装',
    mythicTitle: '万蛊翠纱魅影泳装'
  },
  solar_seraph: {
    w: 440, h: 516,
    personaName: '日蚀圣女 · 镜中真我',
    summerTitle: '圣羽绯阳夏装',
    mythicTitle: '破晓流金绯纱泳装'
  },
  crimson_lord: {
    w: 440, h: 516,
    personaName: '瑟琳娜 · 第998世绯影',
    summerTitle: '永夜蝠翼夏装',
    mythicTitle: '绯夜蔷薇蕾丝泳装'
  },
  golden_golem: {
    w: 440, h: 516,
    personaName: '奥蕾莉亚 · 黄金圣柜机神',
    summerTitle: '曜金翠玉夏装',
    mythicTitle: '曜金女神流金泳装'
  },
  abyss_devourer: {
    w: 440, h: 516,
    personaName: '冥月 · 蚀日饥饿黑影',
    summerTitle: '星月暗夜夏装',
    mythicTitle: '噬星夜纱度假泳装'
  },
  vanguard: {
    w: 440, h: 516,
    personaName: '凛音 · 守桥重铠统领',
    summerTitle: '狂厄双角夏装',
    mythicTitle: '狂厄绯红竞速泳装'
  },
  pyro_lord: {
    w: 440, h: 516,
    personaName: '煌焱 · 赤伞焚灯督军',
    summerTitle: '熔火龙角夏装',
    mythicTitle: '业火流金热带泳装'
  },
  shadow_stalker: {
    w: 440, h: 516,
    personaName: '影凪 · 紫电斩首统领',
    summerTitle: '暗雷翠眸夏装',
    mythicTitle: '夜樱暗雷轻纱泳装'
  },
  venom_matriarch: {
    w: 440, h: 516,
    personaName: '琉璃 · 苍翠荆棘守碑姬',
    summerTitle: '翠蛇金簪夏装',
    mythicTitle: '碧鳞金环薄纱泳装'
  },
  glacial_valkyrie: {
    w: 440, h: 516,
    personaName: '塞蕾丝 · 眠冬圣枪近卫',
    summerTitle: '苍羽冰骑夏装',
    mythicTitle: '极北银辉霜纱泳装'
  },
  iron_warden: {
    w: 440, h: 516,
    personaName: '瓦伦蒂娜 · 黑曜镇狱统领',
    summerTitle: '黑金盾徽夏装',
    mythicTitle: '曜铁金链暗纱泳装'
  },
  storm_siren: {
    w: 440, h: 516,
    personaName: '岚音 · 逆钟星律歌姬',
    summerTitle: '苍雷双马尾夏装',
    mythicTitle: '雷鸣晴空流纱泳装'
  }
};

const _bossCutoutCache = Object.create(null);

function _compositeBossCutoutSlot(cacheKey, w, h, rgbRel, maskRel) {
  let rec = _bossCutoutCache[cacheKey];
  if (rec) return rec.ready ? rec.canvas : null;
  if (typeof document === 'undefined' || !rgbRel || !maskRel) return null;

  rec = { ready: false, canvas: null, rgbImg: null, maskImg: null };
  _bossCutoutCache[cacheKey] = rec;

  const tryFinish = function () {
    if (rec.ready || !rec.rgbImg || !rec.maskImg) return;
    if (!(rec.rgbImg.naturalWidth > 0) || !(rec.maskImg.naturalWidth > 0)) return;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in g) g.imageSmoothingQuality = 'high';
    g.clearRect(0, 0, w, h);
    g.drawImage(rec.rgbImg, 0, 0, w, h);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(rec.maskImg, 0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    rec.canvas = c;
    rec.ready = true;
    rec.rgbImg = null;
    rec.maskImg = null;
  };

  SpireAssets.loadImage(rgbRel, function (img) {
    rec.rgbImg = img;
    tryFinish();
  });
  SpireAssets.loadImage(maskRel, function (img) {
    rec.maskImg = img;
    tryFinish();
  });

  return rec.ready ? rec.canvas : null;
}

function getBossAnimePortrait(variant, isMythic = false) {
  const key = variant && BOSS_PORTRAIT_DATA[variant] ? variant : 'butcher';
  const spec = BOSS_PORTRAIT_DATA[key];
  if (spec) {
    if (isMythic) {
      const p2 = _compositeBossCutoutSlot(
        key + '__p2',
        spec.w,
        spec.h,
        `assets/spire/bp_${key}_p2_rgb.jpg`,
        `assets/spire/bp_${key}_p2_mask.png`
      );
      if (p2) return p2;
    }
    const p1 = _compositeBossCutoutSlot(
      key + '__p1',
      spec.w,
      spec.h,
      `assets/spire/bp_${key}_p1_rgb.jpg`,
      `assets/spire/bp_${key}_p1_mask.png`
    );
    if (p1) return p1;
  }
  return SpireAssets.getPortrait(key);
}

function preloadAllBossCutoutPortraits() {
  if (typeof Image === 'undefined' || typeof document === 'undefined') return;
  const keys = Object.keys(BOSS_PORTRAIT_DATA);
  const schedule = (typeof requestIdleCallback === 'function')
    ? cb => requestIdleCallback(cb, { timeout: 1400 })
    : cb => setTimeout(cb, 320);
  schedule(function () {
    for (let i = 0; i < keys.length; i++) {
      getBossAnimePortrait(keys[i], false);
      getBossAnimePortrait(keys[i], true);
    }
  });
}
preloadAllBossCutoutPortraits();

function getSpireCutscenePack(variant) {
  return SpireAssets.getCutscene(variant);
}

if (typeof globalThis !== 'undefined') {
  globalThis.SPIRE_STORY_PACK = SPIRE_STORY_PACK;
  globalThis.BOSS_PORTRAIT_DATA = BOSS_PORTRAIT_DATA;
  globalThis.SpireAssets = SpireAssets;
  globalThis.getSpireArenaBgImage = getSpireArenaBgImage;
  globalThis.getBossAnimePortrait = getBossAnimePortrait;
  globalThis.getSpireCutscenePack = getSpireCutscenePack;
}
