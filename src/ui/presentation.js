// V2 title entry, local checkpoint, presentation gallery and reading settings.
// var keeps the concatenated offline build safe when menus initializes first.
var SpireSave = (function () {
  const KEY = 'ashen-spire-checkpoint-v2';
  let storageError = '';
  function valid(c) {
    if (!c || !Number.isInteger(c.wave) || c.wave < 1 || c.wave > MAX_WAVE || c.endlessMode) return false;
    const p = c.player;
    if (!p || p.cls !== 'allrounder' || !DIFFS[c.selectedDiff]) return false;
    if (!Number.isFinite(p.hp) || !Number.isFinite(p.maxHp) || p.maxHp <= 0 || p.hp <= 0) return false;
    if (!Array.isArray(p.weapons) || !p.weapons.length || p.weapons.length > 12) return false;
    if (!p.weapons.every(w => {
      const tpl = w && WEAPONS[w.id];
      if (!tpl || !Number.isInteger(w.tier) || w.tier < 1 || w.tier > MAX_WEAPON_TIER) return false;
      // 未选择分支的五阶检查点允许恢复；有分支时必须属于这把五阶武器。
      return !w.evo || (w.tier === MAX_WEAPON_TIER && Array.isArray(tpl.evos) && tpl.evos.some(e => e.id === w.evo));
    })) return false;
    return Number.isFinite(p.lv) && Number.isFinite(p.mats) && SCENES.some(s => s.id === c.sceneId);
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw || raw.length > 1500000) return null;
      const data = JSON.parse(raw);
      return data.schema === 2 && valid(data.checkpoint) ? data : null;
    } catch (_) { return null; }
  }
  function write(checkpoint) {
    if (!valid(checkpoint)) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify({ schema: 2, savedAt: Date.now(), checkpoint }));
      storageError = '';
      return true;
    } catch (_) {
      storageError = '浏览器暂不能保存，关闭页面后进度将丢失。';
      const hint = document.getElementById('saveStatus');
      if (hint) hint.textContent = storageError;
      return false;
    }
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (_) {} }
  return { load, write, clear, valid, getError: () => storageError };
})();

var presentationReturnFocus = null;
var presentationKind = '';
var presentationGalleryScrollTop = 0;

function refreshSpireHome() {
  if (typeof SpireSave === 'undefined' || !SpireSave) return;
  const saved = SpireSave.load();
  const btn = document.getElementById('continueStoryBtn');
  const fresh = document.getElementById('portalStoryBtn');
  const label = document.getElementById('newStoryLabel');
  const hint = document.getElementById('continueStoryHint');
  if (btn) btn.classList.toggle('hidden', !saved);
  if (fresh) fresh.classList.toggle('primary', !saved);
  if (label) label.textContent = saved ? '新的轮回' : '提灯启程';
  if (hint && saved) {
    const n = saved.checkpoint.wave;
    const names = ['雨夜长桥', '永冻冰窟', '倒悬钟楼', '日蚀镜界'];
    hint.textContent = `${names[Math.min(3, Math.floor((n - 1) / 4))]} · 第 ${n} 层起点`;
  }
  const status = document.getElementById('saveStatus');
  if (status) status.textContent = SpireSave.getError();
}

function continueSpireStory() {
  if (typeof bootIntegrityPassed !== 'undefined' && !bootIntegrityPassed) {
    if (typeof SpireBootGate !== 'undefined' && SpireBootGate) SpireBootGate.runFullCheck('user_guard');
    return;
  }
  const saved = SpireSave.load();
  if (!saved) { refreshSpireHome(); openMenuStage('story'); return; }
  closePresentationModal();
  SpireDirector.resetForNewRun();
  player = null; // Do not merge another session's portraits/retry count into this save.
  waveCheckpoint = saved.checkpoint;
  retryFailedWave({ resume: true });
}

function showPresentationModal(title, overline, kind) {
  const modal = document.getElementById('presentationModal');
  // Rebuilding settings after a UI-mode change must not remember a button
  // that is about to be removed as the destination for closing the dialog.
  if (modal.classList.contains('hidden')) presentationReturnFocus = document.activeElement;
  presentationKind = kind;
  document.getElementById('presentationTitle').textContent = title;
  document.getElementById('presentationOverline').textContent = overline;
  const body = document.getElementById('presentationBody');
  body.innerHTML = '';
  body.scrollTop = 0;
  modal.classList.remove('hidden');
  modal.setAttribute('data-kind', kind);
  for (const k in keys) keys[k] = false;
  resetJoy();
  document.getElementById('presentationClose').focus({ preventScroll: true });
  return body;
}

function closePresentationModal() {
  const modal = document.getElementById('presentationModal');
  if (!modal) return;
  modal.classList.add('hidden');
  presentationKind = '';
  if (presentationReturnFocus && presentationReturnFocus.focus) presentationReturnFocus.focus({ preventScroll: true });
}

function confirmSpireNewRun() {
  const body = showPresentationModal('开启新的轮回？', 'A NEW JOURNEY', 'confirm');
  const p = document.createElement('p');
  const saved = SpireSave.load();
  p.className = 'modal-explanation';
  p.textContent = `开始后将替换第 ${saved ? saved.checkpoint.wave : 1} 层的登塔记录。已读对白与阅读设置会保留。`;
  body.appendChild(p);
  const row = document.createElement('div'); row.className = 'modal-actions';
  const cancel = document.createElement('button'); cancel.className = 'quiet-button'; cancel.textContent = '继续原来的旅程';
  cancel.onclick = continueSpireStory;
  const confirm = document.createElement('button'); confirm.className = 'cinema-button'; confirm.textContent = '确认，提灯启程';
  confirm.onclick = () => { SpireSave.clear(); closePresentationModal(); selectedScene = 'random'; startGame('allrounder', { mode: 'story' }); };
  row.appendChild(cancel); row.appendChild(confirm); body.appendChild(row);
}

function openSpireSettings() {
  if (state === 'wave') pauseGame();
  const body = showPresentationModal('声音与阅读', 'SETTINGS', 'settings');
  const pref = SpireDirector.getPreferences();
  const rows = [
    { key: 'instantText', title: '即时显字', desc: '整句显示，关闭逐字出现。', checked: !!pref.instantText },
    { key: 'textScale', title: '大号对白', desc: '正文放大至 130%，保持按钮与立绘位置。', checked: pref.textScale > 1 },
    { key: 'reducedMotion', title: '减少动态', desc: '停用推镜、飘动和演出闪光。', checked: !!pref.reducedMotion },
    { key: 'typeSound', title: '文字音效', desc: '逐字出现时播放轻微提示音。', checked: !!pref.typeSound }
  ];
  rows.forEach(r => {
    const row = document.createElement('label'); row.className = 'setting-row';
    const words = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = r.title;
    const desc = document.createElement('small'); desc.textContent = r.desc;
    words.appendChild(title); words.appendChild(desc);
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = r.checked; input.setAttribute('aria-label', r.title);
    input.onchange = () => {
      const v = r.key === 'textScale' ? (input.checked ? 1.3 : 1) : input.checked;
      SpireDirector.setPreferences({ [r.key]: v });
      syncPresentationPreferences();
    };
    row.appendChild(words); row.appendChild(input); body.appendChild(row);
  });
  const actions = document.createElement('div'); actions.className = 'settings-links';
  [
    ['切换环境音景', () => toggleSpireAudio()],
    ['视界模式', () => { cycleUIPref(); openSpireSettings(); }],
    ['版本记录', () => { closePresentationModal(); openChangelogModal(); }],
    ['运行诊断', () => { closePresentationModal(); openLogModal(); }]
  ].forEach(([text, fn]) => { const b = document.createElement('button'); b.className = 'quiet-button'; b.textContent = text; b.onclick = fn; actions.appendChild(b); });
  body.appendChild(actions);
  const hint = document.createElement('p'); hint.className = 'settings-footnote';
  hint.textContent = uiMode !== 'desktop'
    ? '按住战场并拖动来移动；右下角「瞬步」可同时点击。双指在战场捏合可缩放，松开后重新按下继续移动。点击「驻留」暂停。对白中轻点先显字，再推进。'
    : '移动：WASD / 方向键　 瞬步：空格 / Shift / 右键　 暂停：Esc。对白中点击先显字，再推进。';
  body.appendChild(hint);
}

function syncPresentationPreferences() {
  const pref = SpireDirector.getPreferences();
  document.body.classList.toggle('reduce-motion', !!pref.reducedMotion);
}

function openSpireGallery(options) {
  if (state !== 'menu' && state !== 'end') return;
  const body = showPresentationModal('回响放映室', 'STORY PREVIEW · V2.1', 'gallery');
  const note = document.createElement('p'); note.className = 'gallery-note';
  note.textContent = '建议先看「苏醒」「桥头初遇」「烬羽最终败北」，体验新版画面与动态分镜。其余包含后期剧情与双结局；预览不会改变登塔进度，也不会发放信物。'; body.appendChild(note);
  const events = SpireDirector.getReplayEvents();
  let lastSection = '';
  events.forEach(event => {
    const section = event.section || '剧情演出';
    if (section !== lastSection) {
      const heading = document.createElement('h3'); heading.className = 'gallery-section'; heading.textContent = section; body.appendChild(heading); lastSection = section;
    }
    const b = document.createElement('button'); b.className = 'gallery-event';
    const title = document.createElement('span'); title.textContent = event.title;
    const arrow = document.createElement('span'); arrow.textContent = '播放 →'; arrow.className = 'gallery-play';
    b.appendChild(title); b.appendChild(arrow);
    b.onclick = () => {
      presentationGalleryScrollTop = body.scrollTop;
      closePresentationModal();
      SpireDirector.replayEvent(event.id, () => { if (state === 'menu' || state === 'end') openSpireGallery({ restoreScroll: true }); });
    };
    body.appendChild(b);
  });
  if (options && options.restoreScroll) body.scrollTop = presentationGalleryScrollTop;
}

window.addEventListener('keydown', event => {
  const modal = document.getElementById('presentationModal');
  if (!modal || modal.classList.contains('hidden')) return;
  if (event.key === 'Escape') { event.preventDefault(); closePresentationModal(); }
  if (event.key === 'Tab' && modal.querySelectorAll) {
    const focusables = Array.from(modal.querySelectorAll('button, input, [tabindex="0"]')).filter(el => !el.disabled);
    if (focusables.length) {
      const first = focusables[0], lastEl = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); lastEl.focus(); }
      else if (!event.shiftKey && document.activeElement === lastEl) { event.preventDefault(); first.focus(); }
    }
  }
  event.stopPropagation();
}, true);

window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  resetJoy();
  // 仅清空残留按键与摇杆，不再在 window.blur 时强制弹开驻留设置页（避免 Windows 中文输入法 Shift+WASD 切状态或系统弹窗失焦导致战斗中途误进设置页；真正切后台由 visibilitychange -> document.hidden 托管）
});

refreshSpireHome();
syncPresentationPreferences();
