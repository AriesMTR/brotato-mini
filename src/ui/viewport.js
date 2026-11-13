// 独立判定手机竖屏 / 手机横屏 / 电脑网页端 UI 模式 + Retina 高帧率填充率调优
let uiMode = 'desktop', mobDrawerOpen = false, uiPref = 'auto';
try {
  const savedPref = typeof localStorage !== 'undefined' ? localStorage.getItem('brotato_mini_ui_pref') : null;
  if (savedPref === 'auto' || savedPref === 'mobile' || savedPref === 'desktop') uiPref = savedPref;
} catch (_) {}

function isMobileEnv() {
  if (isTouch) return true;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|MicroMessenger/i.test(ua);
}

function detectUIMode() {
  if (uiPref === 'desktop') return 'desktop';
  if (uiPref === 'mobile') {
    return viewH >= viewW * 0.92 ? 'mobile-portrait' : 'mobile-landscape';
  }
  const mob = isMobileEnv();
  if (viewH > viewW * 1.02 && (mob || viewW <= 680)) return 'mobile-portrait';
  if (mob && Math.min(viewW, viewH) <= 920) {
    return viewH >= viewW * 0.96 ? 'mobile-portrait' : 'mobile-landscape';
  }
  return 'desktop';
}

function refreshUIPrefControls() {
  const mt = document.getElementById('uiModeTabs');
  if (mt) {
    const autoSub = uiMode === 'desktop' ? '桌面' : '触控';
    const opts = [
      { id: 'auto', label: `自动 (${autoSub})` },
      { id: 'mobile', label: '触控视界' },
      { id: 'desktop', label: '桌面视界' }
    ];
    mt.innerHTML = '';
    opts.forEach(op => {
      const b = document.createElement('button');
      b.className = 'mode-btn' + (uiPref === op.id ? ' active' : '');
      b.textContent = op.label;
      b.onclick = () => setUIPref(op.id);
      mt.appendChild(b);
    });
  }
  const pb = document.getElementById('pauseUiBtn');
  if (pb) {
    const modeTxt = uiPref === 'mobile'
      ? '触控视界'
      : (uiPref === 'desktop' ? '桌面视界' : `自动 (${uiMode === 'desktop' ? '桌面' : '触控'})`);
    pb.textContent = `视界模式 · ${modeTxt}`;
  }
  const hb = document.getElementById('homeUiBtn');
  if (hb) {
    const shortTxt = uiPref === 'mobile'
      ? '视界 · 触控'
      : (uiPref === 'desktop' ? '视界 · 桌面' : `视界 · 自动 (${uiMode === 'desktop' ? '桌面' : '触控'})`);
    hb.textContent = shortTxt;
  }
}

function syncUIMode() {
  uiMode = detectUIMode();
  if (document.body && document.body.classList) {
    document.body.classList.toggle('m-ui', uiMode !== 'desktop');
    document.body.classList.toggle('m-portrait', uiMode === 'mobile-portrait');
    document.body.classList.toggle('m-landscape', uiMode === 'mobile-landscape');
  }
  refreshUIPrefControls();
}

function setUIPref(pref) {
  if (pref !== 'auto' && pref !== 'mobile' && pref !== 'desktop') return;
  uiPref = pref;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem('brotato_mini_ui_pref', pref);
  } catch (_) {}
  userZoomed = false;
  if (typeof bootReady !== 'undefined' && bootReady) {
    resize();
    if (typeof state !== 'undefined' && state === 'shop' && typeof renderShop === 'function') renderShop();
  } else {
    syncUIMode();
  }
  beep(520, 0.045, 'triangle', 0.035);
  logInfo('UI_MODE', `切换界面模式偏好 pref=${uiPref} -> active=${uiMode} (${viewW}x${viewH})`);
}

function cycleUIPref() {
  const order = ['auto', 'mobile', 'desktop'];
  const next = order[(order.indexOf(uiPref) + 1) % order.length];
  setUIPref(next);
}

function toggleMobDrawer() {
  mobDrawerOpen = !mobDrawerOpen;
  const sm = document.getElementById('shopMenu');
  if (sm) sm.classList.toggle('drawer-open', mobDrawerOpen);
  const arr = document.getElementById('mobDrawerArrow');
  if (arr) arr.textContent = mobDrawerOpen ? '收起 ▴' : '详情 ▾';
  beep(460, 0.035, 'triangle', 0.03);
}

// 竞技场尺寸与地面贴图精准缓存同步（消除 bakedSceneKey 与 wantKey 不一致导致的重复重烘焙）
function syncArenaAndZoom(forceBake = false) {
  syncUIMode();
  const portraitPhone = uiMode === 'mobile-portrait';
  const landscapePhone = uiMode === 'mobile-landscape';
  const targetW = portraitPhone ? 1180 : (landscapePhone ? 1920 : 2200);
  const targetH = portraitPhone ? 1960 : (landscapePhone ? 1220 : 1500);
  const nextScale = (uiMode !== 'desktop' || isTouch) ? 0.78 : 1.0;
  const activeSceneId = (curScene && curScene.id) ? curScene.id : 'foundry';
  const wantKey = `${targetW}x${targetH}_${nextScale}_${activeSceneId}_${sceneSeed}`;

  if (forceBake || WORLD.w !== targetW || WORLD.h !== targetH || bakedSceneKey !== wantKey) {
    const prevW = Math.max(1, WORLD.w || targetW), prevH = Math.max(1, WORLD.h || targetH);
    const sx = targetW / prevW, sy = targetH / prevH;
    const sizeChanged = WORLD.w !== targetW || WORLD.h !== targetH;
    WORLD.w = targetW;
    WORLD.h = targetH;
    buildFloorTexture();
    if (bootReady && player && sizeChanged) {
      player.x *= sx; player.y *= sy;
      cam.x *= sx; cam.y *= sy;
      for (const e of enemies) { e.x *= sx; e.y *= sy; }
      for (const t of turrets) { t.x *= sx; t.y *= sy; }
      for (const tr of trees) { tr.x *= sx; tr.y *= sy; }
      for (const rl of relics) { rl.x *= sx; rl.y *= sy; }
      for (const sz of sporeZones) { sz.x *= sx; sz.y *= sy; }
      for (const d of drops) { d.x *= sx; d.y *= sy; }
      for (const s of spawns) { s.x *= sx; s.y *= sy; }
      for (const h of hazards) { h.x *= sx; h.y *= sy; }
    }
  }

  if (!userZoomed) {
    if (portraitPhone) {
      camZoom = Math.max(0.50, Math.min(0.64, viewW / 700));
    } else if (landscapePhone) {
      camZoom = Math.max(0.48, Math.min(0.62, viewH / 700));
    } else {
      camZoom = Math.min(viewW, viewH) < 820 ? 0.96 : 1.06;
    }
  }
}

function clampCam() {
  const halfW = (viewW / camZoom) * 0.5;
  const halfH = (viewH / camZoom) * 0.5;
  const pad = 28;
  if (WORLD.w + pad * 2 > halfW * 2) {
    cam.x = Math.max(-pad + halfW, Math.min(WORLD.w + pad - halfW, cam.x));
  } else {
    cam.x = WORLD.w * 0.5;
  }
  if (WORLD.h + pad * 2 > halfH * 2) {
    cam.y = Math.max(-pad + halfH, Math.min(WORLD.h + pad - halfH, cam.y));
  } else {
    cam.y = WORLD.h * 0.5;
  }
}

function resize() {
  viewW = window.innerWidth || 390;
  viewH = window.innerHeight || 844;
  syncUIMode();
  const mobilePerf = uiMode !== 'desktop' || isTouch;
  // Retina 高清渲染：桌面端完整解锁 2.0x DPR 锐利立绘与动作精灵，移动端提升至 1.50x
  dpr = Math.min(window.devicePixelRatio || 1, mobilePerf ? 1.50 : 2.0);
  const cw = Math.max(1, Math.round(viewW * dpr));
  const ch = Math.max(1, Math.round(viewH * dpr));
  if (cv.width !== cw || cv.height !== ch) {
    cv.width = cw;
    cv.height = ch;
  }
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = 'high'; } catch (_) {}
  }
  syncArenaAndZoom();
  if (bootReady) clampCam();
  if (typeof SpireDirector !== 'undefined' && SpireDirector && typeof SpireDirector.onResize === 'function') {
    SpireDirector.onResize(viewW, viewH, dpr);
  }
}
window.addEventListener('resize', resize);
window.addEventListener('wheel', e => {
  userZoomed = true;
  camZoom = Math.max(0.38, Math.min(1.55, camZoom - e.deltaY * 0.0005));
  if (bootReady) clampCam();
}, { passive: true });
