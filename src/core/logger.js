// ============================================================================
// 📋 环形缓冲运行与异常诊断日志系统（支持一键查看、复制剪贴板、导出 .txt 文件）
// ============================================================================
const LOG_MAX = 400;
const bootTs = Date.now(), bootPerf = performance.now();
const gameLogs = [];
let logErrCount = 0, logSpikeCount = 0, lastErrSig = '', lastErrTime = 0;
let fpsVal = 60, fpsFrames = 0, fpsAcc = 0, maxFrameMsWindow = 0, perfLogAcc = 0;

function pushLog(level, tag, msg) {
  const rel = ((performance.now() - bootPerf) / 1000).toFixed(2);
  const nowStr = new Date().toTimeString().slice(0, 8);
  const entry = `[${nowStr} +${rel}s] [${level}] [${tag}] ${msg}`;
  if (gameLogs.length >= LOG_MAX) gameLogs.shift();
  gameLogs.push(entry);
  const modal = document.getElementById('logModal');
  if (modal && !modal.classList.contains('hidden')) refreshLogModalUI();
}
function logInfo(tag, msg) { pushLog('INFO', tag, msg); }
function logWarn(tag, msg) { pushLog('WARN', tag, msg); }
function logError(tag, err) {
  const msg = err && err.stack ? `${err.message || err} | ${String(err.stack).split('\n').slice(0, 3).join(' <- ')}` : String(err);
  const now = performance.now();
  if (msg === lastErrSig && now - lastErrTime < 2000) return;
  lastErrSig = msg; lastErrTime = now;
  logErrCount++;
  const snap = `state=${typeof state !== 'undefined' ? state : '?'} w=${typeof wave !== 'undefined' ? wave : '?'} E=${typeof enemies !== 'undefined' ? enemies.length : 0} B=${typeof bullets !== 'undefined' ? bullets.length : 0}`;
  pushLog('ERROR', tag, `${msg} (${snap})`);
  const toast = document.getElementById('errToast');
  if (toast) {
    toast.textContent = `⚠️ 捕获异常(${logErrCount}) · 点此查看/导出日志`;
    toast.classList.remove('hidden');
  }
}
if (window.addEventListener) {
  window.addEventListener('error', e => {
    logError('WIN_ERR', e.error || `${e.message || 'Error'} @${e.filename || ''}:${e.lineno || 0}:${e.colno || 0}`);
  });
  window.addEventListener('unhandledrejection', e => {
    logError('PROMISE_ERR', e.reason || 'Unhandled Rejection');
  });
}

function getLogText() {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : 'unknown';
  const header = [
    '=== MINI BROTATO HD DIAGNOSTIC LOG ===',
    `ExportedAt: ${new Date().toISOString()}`,
    `UA: ${ua}`,
    `Viewport: ${viewW}x${viewH} (dpr=${dpr}, uiMode=${typeof uiMode !== 'undefined' ? uiMode : 'init'}, isTouch=${isTouch})`,
    `World: ${WORLD.w}x${WORLD.h} (floorCanvas=${floorCanvas ? floorCanvas.width + 'x' + floorCanvas.height : 'none'}, scale=${curFloorScale})`,
    `Scene: ${typeof curScene !== 'undefined' ? curScene.id : 'init'} (mode=${typeof selectedScene !== 'undefined' ? selectedScene : 'random'})`,
    `State: ${typeof state !== 'undefined' ? state : 'init'}, Wave=${typeof wave !== 'undefined' ? wave : 0}, FPS=${fpsVal}, Errors=${logErrCount}, FrameSpikes=${logSpikeCount}`,
    `Entities: enemies=${typeof enemies !== 'undefined' ? enemies.length : 0}, bullets=${typeof bullets !== 'undefined' ? bullets.length : 0}, eBullets=${typeof eBullets !== 'undefined' ? eBullets.length : 0}, drops=${typeof drops !== 'undefined' ? drops.length : 0}, particles=${typeof particles !== 'undefined' ? particles.length : 0}`,
    '======================================',
    ''
  ].join('\n');
  return header + gameLogs.join('\n');
}

function refreshLogModalUI() {
  const sum = document.getElementById('logSummary');
  if (sum) {
    sum.innerHTML =
      `<span>FPS: <b>${fpsVal}</b></span>` +
      `<span>模式: <b>${typeof uiMode !== 'undefined' ? uiMode : '-'}</b></span>` +
      `<span>地图: <b>${WORLD.w}×${WORLD.h}</b></span>` +
      `<span>场景: <b>${typeof curScene !== 'undefined' ? curScene.name : '-'}</b></span>` +
      `<span>日志条数: <b>${gameLogs.length}</b></span>` +
      `<span>异常: <b style="color:${logErrCount ? '#fb7185' : '#6ee7b7'}">${logErrCount}</b></span>` +
      `<span>卡顿峰值计数: <b>${logSpikeCount}</b></span>`;
  }
  const vw = document.getElementById('logView');
  if (vw) {
    vw.textContent = getLogText();
    vw.scrollTop = vw.scrollHeight;
  }
}

function openLogModal() {
  if (typeof state !== 'undefined' && state === 'wave') pauseGame();
  const toast = document.getElementById('errToast');
  if (toast) toast.classList.add('hidden');
  const modal = document.getElementById('logModal');
  if (modal) {
    modal.classList.remove('hidden');
    refreshLogModalUI();
  }
}
function closeLogModal() {
  const modal = document.getElementById('logModal');
  if (modal) modal.classList.add('hidden');
}
function clearLogs() {
  gameLogs.length = 0; logErrCount = 0; logSpikeCount = 0;
  logInfo('LOG', '日志已手动清空');
  refreshLogModalUI();
}
function copyLogs() {
  const txt = getLogText();
  const btn = document.getElementById('copyLogBtn');
  const done = ok => {
    if (btn) {
      const old = btn.textContent;
      btn.textContent = ok ? '✅ 已复制!' : '❌ 复制失败';
      if (typeof setTimeout !== 'undefined') setTimeout(() => { btn.textContent = old; }, 1600);
    }
  };
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => done(true)).catch(() => fallbackCopy(txt, done));
    } else {
      fallbackCopy(txt, done);
    }
  } catch (e) { fallbackCopy(txt, done); }
}
function fallbackCopy(txt, cb) {
  try {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    if (ta.select) ta.select();
    const ok = document.execCommand ? document.execCommand('copy') : false;
    if (ta.remove) ta.remove();
    cb(ok);
  } catch (e) { cb(false); }
}
function downloadLogs() {
  try {
    const txt = getLogText();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brotato_mini_log_${stamp}.txt`;
      document.body.appendChild(a);
      if (a.click) a.click();
      if (a.remove) a.remove();
      if (typeof setTimeout !== 'undefined') setTimeout(() => URL.revokeObjectURL(url), 1500);
      logInfo('LOG', `已导出日志文件 brotato_mini_log_${stamp}.txt`);
    } else {
      copyLogs();
    }
  } catch (err) {
    logError('EXPORT_ERR', err);
  }
}
