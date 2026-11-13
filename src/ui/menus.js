// 《烬塔残响：第999次救赎》黑曜镌金主殿、人物选择选项卡、档案/整备多维选项卡与输入控制
let menuStage = 'home'; // 'home' | 'story' | 'endless'
let selectedEndlessCls = 'brawler';
let heroDossierTab = 'traits'; // 'traits' | 'combat'
let endlessPrepTab = 'diff';   // 'diff' | 'scene'
let moreStoryDifficulties = false;

const HERO_SHORT_NAMES = {
  allrounder: '零号·白衣',
  brawler: '烬羽',
  ranger: '艾丝特莉亚',
  engineer: '伽蓝',
  ghost: '青羽',
  multitasker: '日蚀圣女'
};

function _menuAssetUrl(relPath) {
  if (!relPath) return '';
  if (typeof SpireAssets !== 'undefined' && typeof SpireAssets.resolve === 'function') {
    return SpireAssets.resolve(relPath);
  }
  return relPath;
}

function setHeroDossierTab(tab) {
  heroDossierTab = tab === 'combat' ? 'combat' : 'traits';
  beep(470, 0.03, 'triangle', 0.025);
  initMenuUI();
}

function setEndlessPrepTab(tab) {
  endlessPrepTab = tab === 'scene' ? 'scene' : 'diff';
  beep(490, 0.035, 'triangle', 0.028);
  initMenuUI();
}

function _renderDiffButtons(containerId, descId) {
  const dt = document.getElementById(containerId);
  if (dt) {
    dt.innerHTML = '';
    DIFFS.forEach(d => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `diff-btn tone-${d.tone || 'gold'}${d.id === selectedDiff ? ' active' : ''}`;
      if (containerId === 'storyDiffTabs' && d.id > 2 && !moreStoryDifficulties && selectedDiff <= 2) b.classList.add('hidden');
      b.setAttribute('aria-pressed', String(d.id === selectedDiff));
      b.innerHTML = `
        <span class="diff-btn-top">
          <span class="diff-dot"></span>
          <span class="diff-code">${d.code || ('D' + d.id)}</span>
          <span class="diff-roman">${d.roman || ''}</span>
        </span>
        <span class="diff-name">${d.short || d.name}</span>`;
      b.onclick = () => { selectedDiff = d.id; beep(480, 0.04, 'triangle'); initMenuUI(); };
      dt.appendChild(b);
    });
  }
  const dd = document.getElementById(descId);
  const activeDiff = DIFFS[selectedDiff] || DIFFS[1] || DIFFS[0];
  if (dd && activeDiff) {
    dd.innerHTML = `<span class="desc-title">${activeDiff.badge} · ${activeDiff.name}</span><span class="desc-body">${activeDiff.desc}</span>`;
  }
}

function _renderHeroSpotlight(containerId, clsObj, isStoryLocked) {
  const box = document.getElementById(containerId);
  if (!box || !clsObj) return;
  const portUrl = _menuAssetUrl(clsObj.portrait);
  if (isStoryLocked) {
    // The story hero never changes. Keep the decoded portrait when only the
    // difficulty selection changes instead of replacing the image element.
    if (box.dataset.heroId === clsObj.id) return;
    box.dataset.heroId = clsObj.id;
    box.innerHTML = `<img src="${portUrl}" alt="零，白衣提灯少女" class="prep-zero-portrait" decoding="async"><div class="prep-hero-caption"><span>提灯人</span><h2>零<span> · 白衣</span></h2><p>她忘记了自己的名字。<br>手中的灯，却仍为某个人亮着。</p></div>`;
    return;
  }
  const chibiUrl = _menuAssetUrl(clsObj.chibi);
  const roleTag = isStoryLocked ? '唯一主角 · 提灯人' : clsObj.tag;
  const traitsArr = Array.isArray(clsObj.traits) ? clsObj.traits : [];
  const negTxt = clsObj.negTrait || '';
  const bioTxt = isStoryLocked
    ? '第九百九十九次于塔底石棺苏醒的白衣提灯人。唯有亲自执灯登临十六层四幕高塔，方能依次唤醒并救赎昔日守誓挚友。'
    : (clsObj.bio || '');
  const weaponsArr = Array.isArray(clsObj.weaponsList) ? clsObj.weaponsList : [clsObj.loadout || ''];
  const isTraitsTab = heroDossierTab !== 'combat';

  const traitChipsHtml = traitsArr.map(t => `<span class="trait-chip pos">${t}</span>`).join('') +
    (negTxt ? `<span class="trait-chip neg">${negTxt}</span>` : '');
  const weaponChipsHtml = weaponsArr.map(w => `<span class="weapon-spec-pill">◆ ${w}</span>`).join('');

  box.innerHTML = `
    <div class="spotlight-art-col">
      <img src="${portUrl}" alt="${clsObj.name}" class="spotlight-portrait" loading="eager" decoding="async">
      <div class="spotlight-art-shade"></div>
      <div class="spotlight-chibi-frame" title="实机战斗精灵形态">
        <img src="${chibiUrl}" alt="${clsObj.name} 实机精灵" class="spotlight-chibi" loading="eager" decoding="async">
        <span class="chibi-cap">实机形态</span>
      </div>
    </div>
    <div class="spotlight-info-col">
      <div class="spotlight-header-block">
        <div class="spotlight-role-row">
          <span class="spotlight-en">${clsObj.enTitle || clsObj.code || ''}</span>
          <span class="spotlight-tag">${roleTag}</span>
        </div>
        <div class="spotlight-name">${clsObj.name}</div>
      </div>

      <div class="dossier-tabs" role="tablist" aria-label="角色档案选项卡">
        <button type="button" class="dossier-tab${isTraitsTab ? ' active' : ''}" onclick="setHeroDossierTab('traits')">契约特质</button>
        <button type="button" class="dossier-tab${!isTraitsTab ? ' active' : ''}" onclick="setHeroDossierTab('combat')">兵装与瞬步</button>
      </div>

      ${isTraitsTab ? `
        <div class="dossier-pane">
          <div class="trait-chip-grid">${traitChipsHtml}</div>
          <p class="spotlight-bio">${bioTxt}</p>
          <div class="spotlight-quick-strip">
            <span class="sq-item"><b>初始兵装</b> ${clsObj.loadout}</span>
            ${clsObj.dashName ? `<span class="sq-item"><b>主动战技</b> ${clsObj.dashName}</span>` : ''}
          </div>
        </div>
      ` : `
        <div class="dossier-pane">
          <div class="combat-spec-box">
            <div class="cs-label">STARTING ARMAMENTS  ·  初始随身兵装</div>
            <div class="weapon-spec-row">${weaponChipsHtml}</div>
          </div>
          ${clsObj.dashName ? `
          <div class="combat-spec-box dash-box">
            <div class="cs-label">SOUL DASH [SPACE / 右键]  ·  ${clsObj.dashName}</div>
            <div class="cs-desc">${clsObj.dashDesc || ''}</div>
          </div>` : ''}
        </div>
      `}
    </div>`;
}

function openMenuStage(stage) {
  menuStage = (stage === 'story' || stage === 'endless') ? stage : 'home';
  const sm = document.getElementById('startMenu');
  if (sm && sm.setAttribute) sm.setAttribute('data-stage', menuStage);
  const hv = document.getElementById('menuHomeView');
  const sv = document.getElementById('menuStoryView');
  const ev = document.getElementById('menuEndlessView');
  if (hv) hv.classList.toggle('hidden', menuStage !== 'home');
  if (sv) sv.classList.toggle('hidden', menuStage !== 'story');
  if (ev) ev.classList.toggle('hidden', menuStage !== 'endless');
  const keyArtEl = document.getElementById('heroKeyArtBg');
  if (keyArtEl) {
    const bgRel = menuStage === 'endless' ? 'assets/spire/scene_1_vista.jpg' : 'assets/spire/v2/title-clean.png';
    keyArtEl.style.backgroundImage = `url('${_menuAssetUrl(bgRel)}')`;
  }
  beep(menuStage === 'home' ? 420 : 520, 0.04, 'triangle', 0.035);
  initMenuUI();
}

function selectEndlessHero(clsId) {
  if (!CLASSES.some(c => c.id === clsId)) return;
  selectedEndlessCls = clsId;
  beep(500, 0.035, 'triangle', 0.03);
  initMenuUI();
}

function startStoryMode() {
  if (typeof SpireSave !== 'undefined' && SpireSave.load() && typeof confirmSpireNewRun === 'function') {
    confirmSpireNewRun();
    return;
  }
  selectedScene = 'random';
  startGame('allrounder', { mode: 'story' });
}

function toggleMoreStoryDifficulties() {
  moreStoryDifficulties = !moreStoryDifficulties;
  const b = document.getElementById('moreDifficultyBtn');
  if (b) { b.setAttribute('aria-expanded', String(moreStoryDifficulties)); b.textContent = moreStoryDifficulties ? '收起难度 −' : '更多难度 ＋'; }
  _renderDiffButtons('storyDiffTabs', 'storyDiffDesc');
}

function startEndlessMode(clsId) {
  const target = (clsId && CLASSES.some(c => c.id === clsId)) ? clsId : (selectedEndlessCls || 'brawler');
  startGame(target, { mode: 'endless' });
}

function initMenuUI() {
  refreshUIPrefControls();
  const vp = document.getElementById('startVersionPill');
  if (vp && typeof APP_VERSION !== 'undefined') {
    vp.textContent = `ECHOES OF THE ASHEN SPIRE  ·  ${APP_VERSION}`;
  }
  const appIconEl = document.getElementById('brandAppIcon');
  if (appIconEl) appIconEl.src = _menuAssetUrl('assets/spire/app_icon.jpg');
  const keyArtEl = document.getElementById('heroKeyArtBg');
  if (keyArtEl) {
    const bgRel = menuStage === 'endless' ? 'assets/spire/scene_1_vista.jpg' : 'assets/spire/v2/title-clean.png';
    keyArtEl.style.backgroundImage = `url('${_menuAssetUrl(bgRel)}')`;
  }

  if (typeof SpireAudio !== 'undefined') SpireAudio.refreshButtons();

  if (typeof refreshSpireHome === 'function') refreshSpireHome();
  // Build only the visible preparation screen. Opening the title/story menu
  // must not load six hidden portraits and rebuild every endless-mode card.
  if (menuStage === 'home') return;
  if (menuStage === 'story') {
    _renderDiffButtons('storyDiffTabs', 'storyDiffDesc');
    const zeroObj = CLASSES.find(c => c.id === 'allrounder') || CLASSES[0];
    _renderHeroSpotlight('storyHeroShowcase', zeroObj, true);
    return;
  }
  _renderDiffButtons('diffTabs', 'diffDesc');

  // 无尽模式：试炼整备双栏选项卡状态同步（轮回厄度 vs 起始层域）
  const diffTabBtn = document.getElementById('prepTabDiffBtn');
  const sceneTabBtn = document.getElementById('prepTabSceneBtn');
  const diffPane = document.getElementById('endlessDiffPane');
  const scenePane = document.getElementById('endlessScenePane');
  if (diffTabBtn) diffTabBtn.classList.toggle('active', endlessPrepTab !== 'scene');
  if (sceneTabBtn) sceneTabBtn.classList.toggle('active', endlessPrepTab === 'scene');
  if (diffPane) diffPane.classList.toggle('hidden', endlessPrepTab === 'scene');
  if (scenePane) scenePane.classList.toggle('hidden', endlessPrepTab !== 'scene');

  const activeDiffObj = DIFFS[selectedDiff] || DIFFS[1] || DIFFS[0];
  const prepDiffTag = document.getElementById('prepDiffSummaryTag');
  if (prepDiffTag && activeDiffObj) prepDiffTag.textContent = activeDiffObj.badge;

  // 无尽模式：层域生态 1 + 2×2 原画选项卡
  const sceneOpts = [
    { id: 'random', code: 'ALL ACTS', name: '四幕轮转', sub: '循序踏入四大层域生态演进', vistaImg: 'assets/spire/logo_banner.jpg', wide: true },
    ...SCENES.map((s, idx) => ({
      id: s.id,
      code: `ACT ${['I', 'II', 'III', 'IV'][idx] || (idx + 1)}`,
      name: s.name.replace(/^.+·/, ''),
      sub: s.terrainSummary ? s.terrainSummary.replace(/^[^\s]+\s*/, '') : s.bossHint,
      vistaImg: s.vistaImg,
      wide: false
    }))
  ];
  const activeSceneOpt = sceneOpts.find(x => x.id === selectedScene) || sceneOpts[0];
  const prepSceneTag = document.getElementById('prepSceneSummaryTag');
  if (prepSceneTag && activeSceneOpt) prepSceneTag.textContent = activeSceneOpt.name;

  const st = document.getElementById('sceneTabs');
  if (st) {
    st.innerHTML = '';
    sceneOpts.forEach(sc => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `scene-btn${sc.wide ? ' wide' : ''}${sc.id === selectedScene ? ' active' : ''}`;
      const bgUrl = _menuAssetUrl(sc.vistaImg);
      b.innerHTML = `
        <span class="scene-btn-bg" style="background-image:url('${bgUrl}')"></span>
        <span class="scene-btn-txt">
          <span class="scene-code">${sc.code}</span>
          <span class="scene-name">${sc.name}</span>
        </span>`;
      b.onclick = () => {
        selectedScene = sc.id;
        if (sc.id !== 'random') {
          curScene = SCENES.find(x => x.id === sc.id) || SCENES[0];
          sceneSeed = (1009 + sc.id.charCodeAt(0) * 271) >>> 0;
          if (bootReady) syncArenaAndZoom(true);
          if (typeof SpireAudio !== 'undefined') SpireAudio.syncScene(sc.id);
        } else {
          curScene = SCENES[0];
          sceneSeed = 1024;
          if (bootReady) syncArenaAndZoom(true);
          if (typeof SpireAudio !== 'undefined') SpireAudio.syncScene('foundry');
        }
        beep(510, 0.04, 'triangle');
        initMenuUI();
      };
      st.appendChild(b);
    });
  }
  const sd = document.getElementById('sceneDesc');
  if (sd && activeSceneOpt) {
    sd.innerHTML = `<span class="desc-title">${activeSceneOpt.code} · ${activeSceneOpt.name}</span><span class="desc-body">${activeSceneOpt.sub}</span>`;
  }

  // 无尽模式：6 位誓约者高定人物选择选项卡 + 角色档案舞台
  const cg = document.getElementById('classGrid');
  if (cg) {
    cg.innerHTML = '';
    CLASSES.forEach((c, idx) => {
      const isAct = c.id === selectedEndlessCls;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
      btn.className = 'roster-avatar' + (isAct ? ' active' : '');
      const portUrl = _menuAssetUrl(c.portrait);
      const shortLbl = HERO_SHORT_NAMES[c.id] || c.name;
      btn.innerHTML = `
        <span class="ctab-head">
          <span class="ctab-code">${c.code || ('0' + (idx + 1))}</span>
          <span class="ctab-role">${c.shortRole || c.tag}</span>
        </span>
        <span class="ctab-port-wrap">
          <img src="${portUrl}" alt="${c.name}" class="roster-avatar-img" loading="eager" decoding="async">
          <span class="ctab-shade"></span>
        </span>
        <span class="roster-avatar-name"><span class="ctab-gem">◆</span>${shortLbl}</span>`;
      btn.onclick = () => selectEndlessHero(c.id);
      cg.appendChild(btn);
    });
  }
  const activeEndlessHero = CLASSES.find(c => c.id === selectedEndlessCls) || CLASSES[1] || CLASSES[0];
  _renderHeroSpotlight('endlessHeroShowcase', activeEndlessHero, false);
  const shortHeroName = activeEndlessHero ? (HERO_SHORT_NAMES[activeEndlessHero.id] || activeEndlessHero.name) : '烬羽';
  const sumLine = document.getElementById('endlessSummaryLine');
  if (sumLine && activeDiffObj && activeSceneOpt) {
    sumLine.textContent = `出击契约：${shortHeroName}  ·  ${activeDiffObj.badge}  ·  ${activeSceneOpt.name}`;
  }
  const goBtn = document.getElementById('startEndlessBtn');
  if (goBtn) {
    goBtn.textContent = `◆  以「${shortHeroName}」开启无尽试炼  →`;
  }
}
initMenuUI();

const keys = {};
window.addEventListener('keydown', e => {
  const k = (e && typeof e.key === 'string') ? e.key.toLowerCase() : '';
  if (!k) return;
  if (typeof SpireDirector !== 'undefined' && SpireDirector.isBlockingGameplay()) return;
  const presentation = document.getElementById('presentationModal');
  if (presentation && !presentation.classList.contains('hidden')) return;
  if (k === 'escape') {
    const cm = document.getElementById('codexModal');
    if (cm && !cm.classList.contains('hidden')) { if (e.preventDefault) e.preventDefault(); closeCodex(); return; }
    const clm = document.getElementById('changelogModal');
    if (clm && !clm.classList.contains('hidden')) { if (e.preventDefault) e.preventDefault(); closeChangelogModal(); return; }
    const lm = document.getElementById('logModal');
    if (lm && !lm.classList.contains('hidden')) { if (e.preventDefault) e.preventDefault(); closeLogModal(); return; }
    if (state === 'menu' && menuStage !== 'home') { if (e.preventDefault) e.preventDefault(); openMenuStage('home'); return; }
  }
  // 无尽模式人物选择选项卡支持左右方向键与数字键 1-6 快速切换角色
  if (state === 'menu' && menuStage === 'endless') {
    const cm = document.getElementById('codexModal');
    const modalOpen = cm && !cm.classList.contains('hidden');
    if (!modalOpen) {
      if (k === 'arrowleft' || k === 'arrowright') {
        const curIdx = Math.max(0, CLASSES.findIndex(c => c.id === selectedEndlessCls));
        const nextIdx = (curIdx + (k === 'arrowright' ? 1 : -1) + CLASSES.length) % CLASSES.length;
        selectEndlessHero(CLASSES[nextIdx].id);
        return;
      }
      if (k >= '1' && k <= '6') {
        const idx = parseInt(k, 10) - 1;
        if (CLASSES[idx]) selectEndlessHero(CLASSES[idx].id);
        return;
      }
    }
  }
  if ((k === ' ' || k === 'enter') && bossCutscene && bossCutscene.t < bossCutscene.maxT - 0.35) {
    bossCutscene.t = Math.min(bossCutscene.t, 0.08);
    return;
  }
  if (k === 'escape' || k === 'p') {
    if (state === 'wave' || state === 'paused') { if (e.preventDefault) e.preventDefault(); togglePause(); return; }
  } else if (k === ' ' && state === 'paused') {
    if (e.preventDefault) e.preventDefault();
    resumeGame();
    return;
  }
  if ((k === ' ' || k === 'shift') && state === 'wave' && player && !bossCutscene &&
      !(typeof SpireDirector !== 'undefined' && SpireDirector && SpireDirector.isBlockingGameplay())) {
    if (e.preventDefault) e.preventDefault();
    if (typeof triggerSoulDash === 'function') triggerSoulDash();
    return;
  }
  keys[k] = true;
});
window.addEventListener('keyup', e => {
  const k = (e && typeof e.key === 'string') ? e.key.toLowerCase() : '';
  if (k) keys[k] = false;
});
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; resetJoy(); });
if (document.addEventListener) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'wave') pauseGame();
  });
}

// 手机端全屏动态悬浮摇杆 + 双指捏合缩放视野
const joy = { id: null, ox: 0, oy: 0, cx: 0, cy: 0, dx: 0, dy: 0, mag: 0, active: false, maxR: 56 };
let pinchDist = 0, confirmSellIdx = -1;

function resetJoy() {
  joy.id = null; joy.active = false; joy.dx = 0; joy.dy = 0; joy.mag = 0; pinchDist = 0;
}

if (window.addEventListener) {
  window.addEventListener('touchstart', () => {
    if (!isTouch) {
      isTouch = true;
      if (uiPref === 'auto' && uiMode === 'desktop' && typeof bootReady !== 'undefined' && bootReady) resize();
    }
  }, { passive: true });
}

if (cv.addEventListener) {
  const canvasTouches = list => Array.from(list || []).filter(t => !t.target || t.target === cv);
  const canTouchBattle = () => state === 'wave' && !bossCutscene &&
    !(typeof SpireDirector !== 'undefined' && SpireDirector.isBlockingGameplay());
  cv.addEventListener('mousedown', () => {
    if (bossCutscene && bossCutscene.t < bossCutscene.maxT - 0.35) {
      bossCutscene.t = Math.min(bossCutscene.t, 0.08);
    }
  });
  cv.addEventListener('contextmenu', e => {
    if (state === 'wave') {
      if (e.preventDefault) e.preventDefault();
      if (player && !bossCutscene && !(typeof SpireDirector !== 'undefined' && SpireDirector && SpireDirector.isBlockingGameplay()) && typeof triggerSoulDash === 'function') {
        triggerSoulDash();
      }
    }
  });
  cv.addEventListener('touchstart', e => {
    isTouch = true;
    if (bossCutscene && bossCutscene.t < bossCutscene.maxT - 0.35) {
      bossCutscene.t = Math.min(bossCutscene.t, 0.08);
    }
    if (!canTouchBattle()) { resetJoy(); return; }
    e.preventDefault();
    const touches = canvasTouches(e.touches);
    if (touches.length >= 2) {
      resetJoy();
      pinchDist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
      return;
    }
    const changed = canvasTouches(e.changedTouches);
    if (!joy.active && changed.length > 0) {
      const t = changed[0];
      joy.id = t.identifier;
      joy.ox = joy.cx = t.clientX;
      joy.oy = joy.cy = t.clientY;
      joy.dx = 0; joy.dy = 0; joy.mag = 0;
      joy.active = true;
    }
  }, { passive: false });

  cv.addEventListener('touchmove', e => {
    if (!canTouchBattle()) { resetJoy(); return; }
    e.preventDefault();
    const touches = canvasTouches(e.touches);
    if (touches.length >= 2) {
      const d = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
      if (pinchDist > 10) {
        userZoomed = true;
        camZoom = Math.max(0.38, Math.min(1.55, camZoom * (d / pinchDist)));
        if (bootReady) clampCam();
      }
      joy.id = null; joy.active = false; joy.dx = 0; joy.dy = 0; joy.mag = 0;
      pinchDist = d;
      return;
    }
    if (joy.active) {
      for (let i = 0; i < touches.length; i++) {
        const t = touches[i];
        if (t.identifier === joy.id) {
          const rx = t.clientX - joy.ox, ry = t.clientY - joy.oy;
          const dist = Math.hypot(rx, ry);
          const clamped = Math.min(joy.maxR, dist);
          const ang = Math.atan2(ry, rx);
          joy.cx = joy.ox + Math.cos(ang) * clamped;
          joy.cy = joy.oy + Math.sin(ang) * clamped;
          if (dist > joy.maxR * 1.35) {
            joy.ox += (t.clientX - joy.cx) * 0.45;
            joy.oy += (t.clientY - joy.cy) * 0.45;
          }
          if (dist > 6) {
            joy.dx = rx / dist;
            joy.dy = ry / dist;
            joy.mag = Math.min(1, dist / (joy.maxR * 0.75));
          } else {
            joy.dx = 0; joy.dy = 0; joy.mag = 0;
          }
          break;
        }
      }
    }
  }, { passive: false });

  const endTouch = e => {
    const touches = canvasTouches(e.touches);
    if (touches.length < 2) pinchDist = 0;
    if (joy.active) {
      let stillDown = false;
      for (let i = 0; i < touches.length; i++) {
        if (touches[i].identifier === joy.id) { stillDown = true; break; }
      }
      if (!stillDown) { joy.id = null; joy.active = false; joy.dx = 0; joy.dy = 0; joy.mag = 0; }
    }
  };
  cv.addEventListener('touchend', endTouch, { passive: true });
  cv.addEventListener('touchcancel', resetJoy, { passive: true });
}

let state = 'menu', wave = 1, waveTime = 20, waveMaxTime = 20, lastUrgentSec = -1, spawnAcc = 0, shake = 0, diff = DIFFS[1];
let endlessMode = false, overtime = false, overtimeMeteorT = 1.6, hordeWave = false;
let cam = { x: WORLD.w / 2, y: WORLD.h / 2 };
let player, enemies = [], bullets = [], eBullets = [], hazards = [], drops = [], spawns = [], turrets = [], mines = [], rings = [], trees = [];
let relics = [], sporeZones = [], terrains = [], portals = [], portalPairCd = 0, banners = [], bossCutscene = null;
let relicSpawnT = -1, activeSceneEvent = null, sceneEventT = 0, sandGustT = 0, sceneMobEnabled = false;
let lastBossVariant = '', lastMiniBossVariant = '';
let texts = [], particles = [], sparks = [], lightnings = [], slashes = [], beams = [], stains = [], shells = [];
let pendingLevels = 0, pendingCrates = 0, treeSpawnT = 3.2, shopOffers = [];
let rerollCost = 2, rerollBase = 2, rerollStep = 1, freeRerollsLeft = 0, anvilUpgradedMsg = '', inHurtPlayer = false;
let hudAcc = 0, last = performance.now();
const hudCache = {}, hudEls = {}, renderList = [];
function setHudText(id, val) {
  if (hudCache[id] === val) return;
  hudCache[id] = val;
  const el = hudEls[id] || (hudEls[id] = document.getElementById(id));
  if (el) el.textContent = val;
}
function setHudWidth(id, val) {
  const k = id + '_w';
  if (hudCache[k] === val) return;
  hudCache[k] = val;
  const el = hudEls[id] || (hudEls[id] = document.getElementById(id));
  if (el) el.style.width = val;
}
bootReady = true;
resize();
cam.x = WORLD.w / 2; cam.y = WORLD.h / 2;
clampCam();

function makeWeapon(id, tier = 1) {
  return { id, tier, cd: Math.random() * 0.25, thrust: 0, recoil: 0, angle: 0 };
}

const _EMPTY_SET_BONUSES = {
  counts: { primitive: 0, precise: 0, gun: 0, heavy: 0, elemental: 0, tech: 0 },
  hp: 0, crit: 0, range: 0, aspd: 0, armor: 0, blast: 0, elem: 0, tech: 0,
  rocks: 0, sticks: 0, meleeCnt: 0, screwdrivers: 0, maxMineTier: 1
};
const _PRIM_STEPS = [2, 4, 6], _PREC_STEPS = [2, 3, 5], _GUN_STEPS = [2, 4, 6];
const _HVY_STEPS = [2, 3, 5], _ELEM_STEPS = [2, 3, 5], _TECH_STEPS = [2, 3, 5];
const _HP_TIERS = [0, 6, 14, 24], _CRIT_TIERS = [0, 0.08, 0.16, 0.26], _RNG_TIERS = [0, 40, 85, 140];
const _ASPD_TIERS = [0, 0.06, 0.14, 0.22], _ARM_TIERS = [0, 2, 5, 9], _ELEM_TIERS = [0, 0.15, 0.32, 0.55], _TECH_TIERS = [0, 0.22, 0.48, 0.80];

function _tierOfSet(c, steps) {
  return c >= steps[2] ? 3 : (c >= steps[1] ? 2 : (c >= steps[0] ? 1 : 0));
}

function getSetBonuses() {
  if (!player || !Array.isArray(player.weapons)) return _EMPTY_SET_BONUSES;
  const ws = player.weapons;
  let cache = player._sbCache;
  if (cache && cache._len === ws.length) {
    let match = true;
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i];
      if (!w || cache._ids[i] !== w.id || cache._tiers[i] !== w.tier) { match = false; break; }
    }
    if (match) return cache;
  }
  if (!cache) {
    cache = {
      counts: { primitive: 0, precise: 0, gun: 0, heavy: 0, elemental: 0, tech: 0 },
      hp: 0, crit: 0, range: 0, aspd: 0, armor: 0, blast: 0, elem: 0, tech: 0,
      rocks: 0, sticks: 0, meleeCnt: 0, screwdrivers: 0, maxMineTier: 1,
      _len: 0, _ids: [], _tiers: []
    };
    player._sbCache = cache;
  }
  const counts = cache.counts;
  counts.primitive = 0; counts.precise = 0; counts.gun = 0; counts.heavy = 0; counts.elemental = 0; counts.tech = 0;
  let rocks = 0, sticks = 0, meleeCnt = 0, screwdrivers = 0, maxMineTier = 1;
  cache._len = ws.length;
  cache._ids.length = ws.length;
  cache._tiers.length = ws.length;
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i];
    if (!w) { cache._ids[i] = ''; cache._tiers[i] = 0; continue; }
    cache._ids[i] = w.id;
    cache._tiers[i] = w.tier;
    const tpl = WEAPONS[w.id];
    if (!tpl) continue;
    if (tpl.set && counts[tpl.set] !== undefined) counts[tpl.set]++;
    if (tpl.melee) meleeCnt++;
    if (w.id === 'rock') rocks++;
    else if (w.id === 'stick') sticks++;
    else if (w.id === 'screwdriver') {
      screwdrivers++;
      if (w.tier > maxMineTier) maxMineTier = w.tier;
    }
  }
  const tPrim = _tierOfSet(counts.primitive, _PRIM_STEPS);
  const tPrec = _tierOfSet(counts.precise,   _PREC_STEPS);
  const tGun  = _tierOfSet(counts.gun,       _GUN_STEPS);
  const tHvy  = _tierOfSet(counts.heavy,     _HVY_STEPS);
  const tElem = _tierOfSet(counts.elemental, _ELEM_STEPS);
  const tTech = _tierOfSet(counts.tech,      _TECH_STEPS);
  cache.hp    = _HP_TIERS[tPrim];
  cache.crit  = _CRIT_TIERS[tPrec];
  cache.range = _RNG_TIERS[tGun];
  cache.aspd  = _ASPD_TIERS[tGun];
  cache.armor = _ARM_TIERS[tHvy];
  cache.blast = tHvy > 0 ? 0.15 : 0;
  cache.elem  = _ELEM_TIERS[tElem];
  cache.tech  = _TECH_TIERS[tTech];
  cache.rocks = rocks;
  cache.sticks = sticks;
  cache.meleeCnt = meleeCnt;
  cache.screwdrivers = screwdrivers;
  cache.maxMineTier = maxMineTier;
  return cache;
}

function getRockCount() {
  return getSetBonuses().rocks;
}

function syncSetHp() {
  if (!player) return;
  const sb = getSetBonuses();
  const targetBonusHp = sb.hp + getRockCount() * 3;
  const delta = targetBonusHp - (player._setHp || 0);
  if (delta !== 0) {
    player.maxHp = Math.max(1, player.maxHp + delta);
    player.hp = Math.min(player.maxHp, Math.max(1, player.hp + Math.max(0, delta)));
    player._setHp = targetBonusHp;
  }
}

let waveCratesDropped = 0, waveCheckpoint = null;

function startGame(cls, opts) {
  const options = opts || {};
  const reqMode = options.mode ? options.mode : ((cls && cls !== 'allrounder') ? 'endless' : 'story');
  const runEndless = reqMode === 'endless' || !!options.endless;
  // 严格规则：剧情模式只能使用主角「零号·白衣」(allrounder)，无尽模式可自由选择其他角色及全员
  const resolvedCls = runEndless
    ? (CLASSES.some(c => c.id === cls) ? cls : (selectedEndlessCls || 'brawler'))
    : 'allrounder';
  if (!runEndless) selectedScene = 'random';
  cls = resolvedCls;

  beep(520, 0.08, 'triangle');
  diff = DIFFS[selectedDiff] || DIFFS[1] || DIFFS[0];
  inHurtPlayer = false;
  player = {
    cls, x: WORLD.w / 2, y: WORLD.h / 2, r: 21, faceDir: 1, lookA: 0,
    vx: 0, vy: 0, _leanA: 0, _hsCd: 0,
    dashCd: 0, dashMaxCd: cls === 'ghost' ? 2.5 : 3.2, dashT: 0, dashVx: 0, dashVy: 0,
    dashHasteT: 0, turretOverclockT: 0, magnetPulseT: 0,
    hp: 30, maxHp: 30, _setHp: 0, regen: 0.5, regenAcc: 0, noRegen: false, lifesteal: 0,
    armor: 0, maxShield: 0, shield: 0, shieldRegenT: 0, shieldHitT: 0,
    spd: 194, spdMul: 1, dmgMul: 1, meleeBonus: 0, elemBonus: 0, techBonus: 0, atkSpd: 0.90, crit: 0.06, critDmg: 0,
    dodge: 0, dodgeCap: 0.80, maxSlots: 6, bonusTurrets: 0, laserTurrets: 0, mineLayers: 0, mineCd: 1.4, turretCrit: false, turretElem: false, bullCd: 0,
    magnet: 130, harvest: 1, harvestFlat: 0, luck: 0, rangeBonus: 0, _displayRange: 140,
    pierceBonus: 0, bounceBonus: 0, shopDiscount: 0, freeRerolls: 0, bonusTrees: 0,
    enemySlow: 0, thorns: 0, cyberball: 0, critHeal: 0, critMeleeHeal: false, rangeToDmg: false, hpToDmg: 0, armorToDmg: 0, hasAnvil: false, healBonus: 0,
    burnChance: 0, chillChance: 0, freezeChance: 0, poisonChance: 0, maxPoisonStacks: 8, plagueSpread: false, elemSynergy: false,
    meleeBossGuard: 0, meleeSweepBonus: 0, meleeShockwave: false, blastChance: 0, explosionScale: 1, napalmBlast: false, bloodNova: false,
    interest: 0, teslaCount: 0, teslaCd: 1.0, healDropBonus: 0, chillSlowT: 0, inSpore: false,
    invulnBonus: 0, fastShield: false, soulBolt: false, noSlow: false, bossCratesQueued: 0, mythicCratesQueued: 0, recentCrateIds: [],
    rarePortraitShown: false, shownBossPortraits: {}, mythicAwakenedCount: 0, waveMythicAwakened: false, retryCount: 0,
    lavaExposure: 0, lavaTick: 0, terrainHintT: 0, terrainSpdMul: 1,
    lv: 1, xp: 0, xpNeed: 10, mats: diff.matBonus, kills: 0, invuln: 0, walkT: 0, dustT: 0, moving: false,
    weapons: [], items: {}
  };
  if (cls === 'allrounder') {
    player.maxHp += 6; player.hp += 6; player.spdMul += 0.04; player.dmgMul += 0.08; player.harvestFlat += 4;
    player.weapons.push(makeWeapon('pistol', 1), makeWeapon('stick', 1));
  } else if (cls === 'ranger') {
    player.spdMul += 0.08; player.dodge += 0.06; player.atkSpd += 0.20; player.crit += 0.12; player.rangeBonus += 65;
    player.weapons.push(makeWeapon('smg', 1), makeWeapon('icicle', 1));
  } else if (cls === 'brawler') {
    player.maxHp += 8; player.hp += 8; player.armor += 1; player.regen += 1.1; player.meleeBonus = 0.12; player.rangeBonus -= 10;
    player.weapons.push(makeWeapon('katana', 1), makeWeapon('stick', 1));
  } else if (cls === 'engineer') {
    player.armor += 2; player.regen += 1.8; player.techBonus = 0.15; player.bonusTurrets = 2;
    player.weapons.push(makeWeapon('wrench', 1), makeWeapon('pistol', 1));
  } else if (cls === 'multitasker') {
    player.maxSlots = 12;
    player.weapons.push(makeWeapon('stick', 1), makeWeapon('stick', 1), makeWeapon('pistol', 1));
  } else if (cls === 'ghost') {
    player.maxHp -= 6; player.hp -= 6; player.dodgeCap = 0.80; player.dodge = 0.28; player.luck += 8;
    player.weapons.push(makeWeapon('knife', 1), makeWeapon('shuriken', 1));
  } else {
    player.weapons.push(makeWeapon('pistol', 1), makeWeapon('stick', 1));
  }
  syncSetHp();
  wave = 1; endlessMode = runEndless; pendingLevels = 0; pendingCrates = 0; freeRerollsLeft = 0; anvilUpgradedMsg = ''; shopOffers = []; waveCheckpoint = null;
  logInfo('GAME', `开局 ver=${typeof APP_VERSION !== 'undefined' ? APP_VERSION : '-'}, mode=${runEndless ? 'endless' : 'story'}, cls=${cls}, diff=${diff.badge}, sceneMode=${selectedScene}, ui=${uiMode}, world=${WORLD.w}x${WORLD.h}`);
  document.getElementById('startMenu').classList.add('hidden');
  document.getElementById('endMenu').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  const cm = document.getElementById('crateMenu');
  if (cm) cm.classList.add('hidden');
  if (typeof SpireDirector !== 'undefined' && SpireDirector && typeof SpireDirector.resetForNewRun === 'function') {
    SpireDirector.resetForNewRun();
  }
  beginWave();
}

function replayOpeningCutscene() {
  if (typeof SpireDirector !== 'undefined' && SpireDirector && typeof SpireDirector.playOpeningSequence === 'function') {
    SpireDirector.playOpeningSequence(true);
  }
}

function showStart() {
  state = 'menu';
  resetJoy();
  if (typeof SpireDirector !== 'undefined' && SpireDirector && typeof SpireDirector.resetForNewRun === 'function') {
    SpireDirector.resetForNewRun();
  }
  document.getElementById('endMenu').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('shopMenu').classList.add('hidden');
  document.getElementById('levelMenu').classList.add('hidden');
  const cm = document.getElementById('crateMenu');
  if (cm) cm.classList.add('hidden');
  const cdx = document.getElementById('codexModal');
  if (cdx) cdx.classList.add('hidden');
  const clm = document.getElementById('changelogModal');
  if (clm) clm.classList.add('hidden');
  bossCutscene = null;
  waveCheckpoint = null;
  document.getElementById('hud').classList.add('hidden');
  const sm = document.getElementById('startMenu');
  sm.classList.remove('hidden');
  sm.scrollTop = 0;
  openMenuStage('home');
}

function renderBuildSummary(statsId, setsId) {
  if (!player) return;
  syncSetHp();
  const setB = getSetBonuses();
  const arm = getTotalArmor(), mit = Math.round(getArmorMitigation() * 100);
  const dmgPct = Math.round(getEffectiveDmgMul() * 100);
  const aspdPct = Math.round((player.atkSpd + setB.aspd) * 100);
  const critPct = Math.round(getEffectiveCrit() * 100);
  const critDmgPct = Math.round((1.95 + (player.critDmg || 0)) * 100);
  const rng = getTotalRangeBonus();
  const rngTxt = rng >= 0 ? `+${rng}` : `${rng}`;
  const harv = Math.round(player.harvestFlat || 0);
  const stEl = document.getElementById(statsId);
  if (stEl) {
    stEl.innerHTML =
      `<span>生命 <b>${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}</b>${player.maxShield ? ` <small style="color:#89c4d4">(+${Math.ceil(player.shield)}护盾)</small>` : ''}</span>` +
      `<span>护甲 <b>${arm}</b> <small>(${mit >= 0 ? '-' : '+'}${Math.abs(mit)}%伤)</small></span>` +
      `<span>再生 <b>${player.regen.toFixed(1)}/s</b></span>` +
      `<span>汲血 <b>${Math.round(player.lifesteal * 100)}%</b></span>` +
      `<span>伤害 <b>${dmgPct}%</b></span>` +
      `<span>攻速 <b>${aspdPct}%</b></span>` +
      `<span>范围 <b>${rngTxt}</b></span>` +
      `<span>暴击 <b>${critPct}%</b> <small style="color:#dfc084">(${critDmgPct}%)</small></span>` +
      `<span>闪避 <b>${Math.round(Math.min(player.dodgeCap || 0.80, player.dodge) * 100)}%</b></span>` +
      `<span>移速 <b>${Math.round(getEffectiveSpdMul() * 100)}%</b></span>` +
      `<span>幸运 <b>${player.luck || 0}</b></span>` +
      `<span>收获 <b>${harv}</b></span>`;
  }
  const mqEl = document.getElementById('mobQuickStats');
  if (mqEl) {
    mqEl.innerHTML =
      `<span>生命 <b>${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}</b></span>` +
      `<span>护甲 <b>${arm}</b></span>` +
      `<span>伤害 <b>${dmgPct}%</b></span>` +
      `<span>攻速 <b>${aspdPct}%</b></span>` +
      `<span>范围 <b>${rngTxt}</b></span>` +
      `<span>暴击 <b>${critPct}%</b></span>`;
  }
  const srEl = document.getElementById(setsId);
  if (srEl) {
    const setPills = [];
    for (const [key, def] of Object.entries(SET_DEFS)) {
      const c = setB.counts[key];
      if (c > 0) {
        const nextStep = def.steps.find(s => s > c) || def.steps[2];
        const active = c >= def.steps[0];
        setPills.push(`<span class="set-pill${active ? ' active' : ''}" title="${def.desc}">${def.label} ${c}/${nextStep} · ${def.desc}</span>`);
      }
    }
    if (player.items) {
      for (const [iid, cnt] of Object.entries(player.items)) {
        if (cnt > 0) {
          const meta = ITEMS.find(x => x.id === iid);
          if (meta) setPills.push(`<span class="set-pill" title="${meta.desc}">${meta.icon} ${meta.name}${cnt > 1 ? ' ×' + cnt : ''}</span>`);
        }
      }
    }
    srEl.innerHTML = setPills.join('');
  }
}

function pauseGame() {
  if (state !== 'wave' || !player) return;
  state = 'paused';
  for (const k in keys) keys[k] = false;
  resetJoy();
  beep(360, 0.05, 'triangle', 0.04);
  const clsObj = CLASSES.find(c => c.id === player.cls);
  const waveTag = endlessMode ? `无尽第 ${wave} 层` : `第 ${wave} / ${MAX_WAVE} 层`;
  const timeTxt = overtime ? '超时死斗' : `剩余 ${Math.ceil(waveTime)}s`;
  document.getElementById('pauseInfo').innerHTML =
    `<b>${diff.badge}</b>  ·  层域：<b>${curScene.name}</b>  ·  登塔者：<b>${clsObj ? clsObj.name : ''}</b>  ·  进度：<b>${waveTag}（${timeTxt}）</b>  ·  等级：<b>Lv.${player.lv}</b>  ·  晶石：<b style="color:#dfc084">◇ ${player.mats}</b>`;
  renderBuildSummary('pauseStats', 'pauseSets');
  refreshUIPrefControls();
  const pm = document.getElementById('pauseMenu');
  pm.classList.remove('hidden');
  pm.scrollTop = 0;
}

function resumeGame() {
  if (state !== 'paused') return;
  state = 'wave';
  for (const k in keys) keys[k] = false;
  resetJoy();
  last = performance.now();
  beep(540, 0.05, 'triangle', 0.04);
  document.getElementById('pauseMenu').classList.add('hidden');
}

function togglePause() {
  if (state === 'wave') pauseGame();
  else if (state === 'paused') resumeGame();
}

function restartRun() {
  document.getElementById('pauseMenu').classList.add('hidden');
  if (player && player.cls) startGame(player.cls, { mode: endlessMode ? 'endless' : 'story' });
  else showStart();
}

function quitToMenu() {
  beep(320, 0.06, 'triangle', 0.04);
  showStart();
}

function clonePlayerForCheckpoint(p) {
  if (!p) return null;
  const copy = Object.assign({}, p);
  copy.weapons = Array.isArray(p.weapons)
    ? p.weapons.map(w => Object.assign({}, w, { cd: Math.random() * 0.25, thrust: 0, recoil: 0 }))
    : [];
  copy.items = Object.assign({}, p.items || {});
  copy.recentCrateIds = Array.isArray(p.recentCrateIds) ? p.recentCrateIds.slice() : [];
  copy.shownBossPortraits = Object.assign({}, p.shownBossPortraits || {});
  copy.story = p.story ? JSON.parse(JSON.stringify(p.story)) : null;
  copy._sbCache = null;
  return copy;
}

function saveWaveCheckpoint(extraMeta = null) {
  if (!player) return;
  waveCheckpoint = Object.assign({
    wave,
    endlessMode,
    selectedDiff,
    selectedScene,
    sceneId: curScene ? curScene.id : 'foundry',
    lastBossVariant,
    lastMiniBossVariant,
    rerollCost,
    rerollBase,
    rerollStep,
    freeRerollsLeft,
    anvilUpgradedMsg,
    shopOffers: Array.isArray(shopOffers) ? shopOffers.map(o => o ? Object.assign({}, o) : null).filter(Boolean) : [],
    player: clonePlayerForCheckpoint(player)
  }, extraMeta || {});
  if (!endlessMode && typeof SpireSave !== 'undefined') SpireSave.write(waveCheckpoint);
}

function retryFailedWave(options) {
  const isResume = !!(options && options.resume);
  if (!waveCheckpoint || !waveCheckpoint.player) {
    if (player && player.cls) startGame(player.cls, { mode: endlessMode ? 'endless' : 'story' });
    else showStart();
    return;
  }
  beep(580, 0.09, 'triangle', 0.06);
  const mergedPortraits = Object.assign(
    {},
    waveCheckpoint.player.shownBossPortraits || {},
    (player && player.shownBossPortraits) || {}
  );
  const nextRetryCount = Math.max(
    (player && player.retryCount) || 0,
    (waveCheckpoint.player && waveCheckpoint.player.retryCount) || 0
  ) + (isResume ? 0 : 1);

  wave = waveCheckpoint.wave;
  endlessMode = !!waveCheckpoint.endlessMode;
  selectedDiff = waveCheckpoint.selectedDiff;
  diff = DIFFS[selectedDiff] || DIFFS[1] || DIFFS[0];
  selectedScene = waveCheckpoint.selectedScene;
  lastBossVariant = waveCheckpoint.lastBossVariant || '';
  lastMiniBossVariant = waveCheckpoint.lastMiniBossVariant || '';
  pendingLevels = 0;
  pendingCrates = 0;
  rerollCost = waveCheckpoint.rerollCost;
  rerollBase = waveCheckpoint.rerollBase;
  rerollStep = waveCheckpoint.rerollStep;
  freeRerollsLeft = waveCheckpoint.freeRerollsLeft || 0;
  anvilUpgradedMsg = waveCheckpoint.anvilUpgradedMsg || '';
  shopOffers = Array.isArray(waveCheckpoint.shopOffers)
    ? waveCheckpoint.shopOffers.map(o => Object.assign({}, o))
    : [];

  player = clonePlayerForCheckpoint(waveCheckpoint.player);
  player.shownBossPortraits = mergedPortraits;
  player.rarePortraitShown = Object.keys(mergedPortraits).length > 0;
  player.retryCount = nextRetryCount;
  player.invuln = 0;
  inHurtPlayer = false;

  for (const k in keys) keys[k] = false;
  resetJoy();
  last = performance.now();
  document.getElementById('endMenu').classList.add('hidden');
  document.getElementById('startMenu').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('shopMenu').classList.add('hidden');
  document.getElementById('levelMenu').classList.add('hidden');
  const cm = document.getElementById('crateMenu');
  if (cm) cm.classList.add('hidden');

  logInfo('RETRY', `战败回溯重开第 ${wave} 波 (累计重开 ${nextRetryCount} 次) · Lv=${player.lv} · 💎=${player.mats}`);
  beginWave({
    isRetry: !isResume,
    sceneId: waveCheckpoint.sceneId,
    waveBossIds: Array.isArray(waveCheckpoint.waveBossIds) ? waveCheckpoint.waveBossIds.slice() : null
  });
}

function abandonAndRestart() {
  beep(420, 0.08, 'triangle', 0.05);
  const targetCls = player && player.cls ? player.cls : null;
  waveCheckpoint = null;
  for (const k in keys) keys[k] = false;
  resetJoy();
  last = performance.now();
  document.getElementById('endMenu').classList.add('hidden');
  logInfo('RESTART', `放弃当前进度并从第 1 波重头开始 · cls=${targetCls || '-'}`);
  if (targetCls) startGame(targetCls, { mode: endlessMode ? 'endless' : 'story' });
  else showStart();
}
