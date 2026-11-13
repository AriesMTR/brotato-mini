// WebAudio 合成音效 + 《烬塔残响》五大层域沉浸环境音景与独立双轨音量控制系统（低初始音量柔化版）
let actx = null, activeVoices = 0;
const beepGate = {}, voiceExpiries = [];
const AUDIO_PREF_KEY = 'spire_audio_prefs_v2';
const DEFAULT_BGM_VOL = 0.28; // 默认背景音乐 28%（大幅降低初始背景音量，温润不吵闹）
const DEFAULT_SFX_VOL = 0.32; // 默认战斗音效 32%（大幅降低初始射击/受击音效，清脆不刺耳）

function _clamp01(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, Math.round(n * 100) / 100)) : fallback;
}

function unlockAudio(e) {
  // 仅记录触控能力，绝不在点击/触摸事件中反复重建竞技场画布或切换视界（杜绝混合触控屏闪屏抖动）
  if (e && e.pointerType === 'touch' && !isTouch) {
    isTouch = true;
  }
  try {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state !== 'running' && actx.resume) {
      const p = actx.resume();
      if (p && p.catch) p.catch(() => {});
    }
    if (typeof SpireAudio !== 'undefined') {
      SpireAudio.onUserUnlock();
    }
  } catch (err) {}
}
window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('touchstart', unlockAudio, { passive: true });
window.addEventListener('touchend', unlockAudio, { passive: true });
window.addEventListener('click', unlockAudio, { passive: true });
if (document.addEventListener) {
  document.addEventListener('WeixinJSBridgeReady', unlockAudio, false);
}

function beep(freq = 440, dur = 0.06, type = 'square', vol = 0.045) {
  if (AudioBank.bgmMuted || AudioBank.sfxVol <= 0.005) return;
  if (!actx || actx.state !== 'running') return;
  if (!Number.isFinite(freq) || !Number.isFinite(dur) || dur <= 0) return;
  const now = performance.now();
  if (voiceExpiries.length > 0 && voiceExpiries[0] <= now) {
    let w = 0;
    for (let i = 0; i < voiceExpiries.length; i++) {
      if (voiceExpiries[i] > now) voiceExpiries[w++] = voiceExpiries[i];
    }
    voiceExpiries.length = w;
  }
  activeVoices = Math.min(activeVoices, voiceExpiries.length);
  const bucket = Math.round(freq / 60);
  if (now - (beepGate[bucket] || 0) < 52) return;
  const maxVoices = isTouch ? 9 : 16;
  if (activeVoices >= maxVoices) return;
  beepGate[bucket] = now;
  try {
    const safeFreq = Math.max(45, Math.min(4000, freq));
    const safeDur = Math.max(0.015, Math.min(0.4, dur));
    const scaledVol = (vol || 0.04) * AudioBank.sfxVol * 0.68;
    if (scaledVol <= 0.0004) return;
    const safeVol = Math.max(0.0006, Math.min(0.15, scaledVol));
    const o = actx.createOscillator(), g = actx.createGain();
    activeVoices++;
    voiceExpiries.push(now + safeDur * 1000 + 80);
    o.type = type;
    o.frequency.setValueAtTime(safeFreq, actx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, safeFreq * 0.55), actx.currentTime + safeDur);
    g.gain.setValueAtTime(safeVol, actx.currentTime);
    g.gain.linearRampToValueAtTime(0.0005, actx.currentTime + safeDur);
    o.connect(g); g.connect(actx.destination);
    let cleaned = false;
    o.onended = () => {
      if (cleaned) return;
      cleaned = true;
      activeVoices = Math.max(0, activeVoices - 1);
      try { o.disconnect(); g.disconnect(); } catch (_) {}
    };
    o.start(); o.stop(actx.currentTime + safeDur + 0.01);
  } catch (e) {
    activeVoices = Math.max(0, activeVoices - 1);
  }
}

// 🔊 外部音频、双轨音量持久化与场景音景引擎（缺失或受阻时无缝回退低增益 WebAudio 旋律音景）
const AudioBank = {
  sfx: {},
  bgm: null,
  bgmMuted: false,
  bgmVol: DEFAULT_BGM_VOL,
  sfxVol: DEFAULT_SFX_VOL,
  baseBgmVol: 0.28,
  currentBgmUrl: '',
  loadPrefs() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(AUDIO_PREF_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p && typeof p === 'object') {
        if (typeof p.muted === 'boolean') this.bgmMuted = p.muted;
        this.bgmVol = _clamp01(p.bgmVol, DEFAULT_BGM_VOL);
        this.sfxVol = _clamp01(p.sfxVol, DEFAULT_SFX_VOL);
      }
    } catch (_) {}
  },
  savePrefs() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(AUDIO_PREF_KEY, JSON.stringify({
        muted: !!this.bgmMuted,
        bgmVol: this.bgmVol,
        sfxVol: this.sfxVol
      }));
    } catch (_) {}
  },
  _resolveUrl(url) {
    if (!url) return '';
    const inlineMap = typeof window !== 'undefined' && window.__SPIRE_INLINE_ASSETS__;
    return (inlineMap && inlineMap[url]) ? inlineMap[url] : url;
  },
  _effectiveBgmGain(baseVol) {
    if (this.bgmMuted || this.bgmVol <= 0.005) return 0;
    return Math.max(0, Math.min(1, (baseVol || 0.28) * this.bgmVol));
  },
  syncBgmVolume() {
    if (!this.bgm) return;
    const target = this._effectiveBgmGain(this.baseBgmVol);
    this.bgm.volume = target;
    if (target <= 0) {
      if (!this.bgm.paused) {
        try { this.bgm.pause(); } catch (_) {}
      }
    } else if (this.bgm.paused && !this.bgmMuted) {
      try {
        const p = this.bgm.play();
        if (p && p.catch) p.catch(() => { SpireAudio.useSynthFallback = true; });
      } catch (_) {}
    }
  },
  registerSfx(key, url, volume = 0.42) {
    this.sfx[key] = { url, volume, pool: [], idx: 0, failed: false };
  },
  playSfx(key, fallbackFreq = 440, fallbackDur = 0.06, fallbackType = 'square', fallbackVol = 0.04) {
    if (this.bgmMuted || this.sfxVol <= 0.005) return;
    const entry = this.sfx[key];
    if (entry && !entry.failed && typeof Audio !== 'undefined') {
      try {
        if (entry.pool.length < 3) {
          const a = new Audio(this._resolveUrl(entry.url));
          a.preload = 'auto';
          a.onerror = () => { entry.failed = true; };
          entry.pool.push(a);
        }
        const inst = entry.pool[entry.idx++ % entry.pool.length];
        inst.volume = Math.max(0, Math.min(1, entry.volume * this.sfxVol * 0.78));
        inst.currentTime = 0;
        const p = inst.play();
        if (p && p.catch) p.catch(() => beep(fallbackFreq, fallbackDur, fallbackType, fallbackVol));
        return;
      } catch (_) {}
    }
    beep(fallbackFreq, fallbackDur, fallbackType, fallbackVol);
  },
  playBgm(url, volume = 0.28) {
    this.currentBgmUrl = url || '';
    this.baseBgmVol = volume;
    if (typeof Audio === 'undefined' || !url) return false;
    const effVol = this._effectiveBgmGain(volume);
    try {
      if (this.bgm && this.bgm._relUrl === url) {
        this.bgm.volume = effVol;
        if (effVol > 0 && this.bgm.paused && !this.bgmMuted) {
          const p = this.bgm.play();
          if (p && p.catch) p.catch(() => { SpireAudio.useSynthFallback = true; });
        }
        return true;
      }
      if (this.bgm) { try { this.bgm.pause(); } catch (_) {} }
      const a = new Audio(this._resolveUrl(url));
      a._relUrl = url;
      a.loop = true;
      a.volume = effVol;
      a.onerror = () => { SpireAudio.useSynthFallback = true; };
      this.bgm = a;
      if (!this.bgmMuted && effVol > 0) {
        const p = a.play();
        if (p && p.catch) p.catch(() => { SpireAudio.useSynthFallback = true; });
      }
      return true;
    } catch (_) {
      return false;
    }
  },
  stopBgm() {
    if (this.bgm) { try { this.bgm.pause(); } catch (_) {} }
  }
};

AudioBank.loadPrefs();

// 注册过场斩击与冰冕碎裂音效（基础增益已温和下调，再乘以用户 sfxVol）
AudioBank.registerSfx('cutscene_slash', 'assets/audio/cutscene_slash.wav', 0.40);
AudioBank.registerSfx('cutscene_shatter', 'assets/audio/cutscene_shatter.wav', 0.40);

const SCENE_AUDIO_MAP = {
  foundry:   { url: 'assets/audio/scene_foundry_rain.wav',   vol: 0.28, notes: [293.66, 349.23, 440.00, 329.63, 261.63, 220.00], waveType: 'triangle', step: 0.72 },
  glacier:   { url: 'assets/audio/scene_glacier_frost.wav',  vol: 0.26, notes: [523.25, 659.25, 880.00, 783.99, 659.25, 587.33], waveType: 'sine',     step: 0.64 },
  wasteland: { url: 'assets/audio/scene_wasteland_clock.wav',vol: 0.27, notes: [369.99, 440.00, 554.37, 523.25, 440.00, 329.63], waveType: 'triangle', step: 0.50 },
  desert:    { url: 'assets/audio/scene_desert_eclipse.wav', vol: 0.30, notes: [246.94, 293.66, 369.99, 440.00, 369.99, 293.66], waveType: 'sine',     step: 0.85 },
  fungal:    { url: 'assets/audio/scene_fungal_wind.wav',    vol: 0.26, notes: [329.63, 392.00, 493.88, 587.33, 493.88, 392.00], waveType: 'sine',     step: 0.68 }
};

const SpireAudio = {
  activeSceneId: 'foundry',
  useSynthFallback: typeof Audio === 'undefined',
  noteIdx: 0,
  acc: 0,
  syncScene(sceneId) {
    const sid = SCENE_AUDIO_MAP[sceneId] ? sceneId : 'foundry';
    this.activeSceneId = sid;
    const cfg = SCENE_AUDIO_MAP[sid];
    if (!AudioBank.bgmMuted && AudioBank.bgmVol > 0.005) {
      const ok = AudioBank.playBgm(cfg.url, cfg.vol);
      if (!ok) this.useSynthFallback = true;
    } else {
      AudioBank.baseBgmVol = cfg.vol;
      AudioBank.syncBgmVolume();
    }
    this.refreshButtons();
  },
  onUserUnlock() {
    if (AudioBank.bgmMuted || AudioBank.bgmVol <= 0.005) return;
    const cfg = SCENE_AUDIO_MAP[this.activeSceneId] || SCENE_AUDIO_MAP.foundry;
    if (AudioBank.bgm && AudioBank.bgm.paused) {
      AudioBank.bgm.volume = AudioBank._effectiveBgmGain(cfg.vol);
      const p = AudioBank.bgm.play();
      if (p && p.catch) p.catch(() => { this.useSynthFallback = true; });
    } else if (!AudioBank.bgm) {
      const ok = AudioBank.playBgm(cfg.url, cfg.vol);
      if (!ok) this.useSynthFallback = true;
    }
  },
  tick(dt) {
    if (AudioBank.bgmMuted || AudioBank.bgmVol <= 0.005) return;
    const bgmPlaying = !!(AudioBank.bgm && !AudioBank.bgm.paused && !AudioBank.bgm.ended);
    if (bgmPlaying && !this.useSynthFallback) return;
    if (!actx || actx.state !== 'running' || typeof actx.createBiquadFilter !== 'function') return;
    const cfg = SCENE_AUDIO_MAP[this.activeSceneId] || SCENE_AUDIO_MAP.foundry;
    this.acc += dt;
    if (this.acc < cfg.step) return;
    this.acc = 0;
    const f = cfg.notes[this.noteIdx++ % cfg.notes.length];
    try {
      const synthGain = Math.max(0.0008, 0.012 * AudioBank.bgmVol);
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = cfg.waveType;
      o.frequency.setValueAtTime(f, actx.currentTime);
      g.gain.setValueAtTime(synthGain, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0004, actx.currentTime + cfg.step * 0.88);
      o.connect(g); g.connect(actx.destination);
      o.onended = () => {
        try { o.disconnect(); g.disconnect(); } catch (_) {}
      };
      o.start(); o.stop(actx.currentTime + cfg.step * 0.90);
    } catch (_) {}
  },
  playCutsceneCue(variant, isMythic) {
    if (AudioBank.bgmMuted || AudioBank.sfxVol <= 0.005) return;
    if (variant === 'frost_queen' || variant === 'glacial_valkyrie') {
      AudioBank.playSfx('cutscene_shatter', 740, 0.18, 'sine', 0.05);
    } else {
      AudioBank.playSfx('cutscene_slash', isMythic ? 180 : 240, 0.20, 'sawtooth', 0.052);
    }
  },
  refreshButtons() {
    if (typeof document === 'undefined') return;
    const muted = !!AudioBank.bgmMuted;
    const bgmPct = Math.round(AudioBank.bgmVol * 100);
    const sfxPct = Math.round(AudioBank.sfxVol * 100);

    const mb = document.getElementById('menuBgmBtn');
    if (mb) mb.textContent = muted ? '音景 · 静音' : '音景 · 开启';
    const mab = document.getElementById('menuAudioBtn');
    if (mab) mab.textContent = muted ? '🔇 音量 · 静音' : `🔊 音量 · ${bgmPct}%`;

    const hb = document.getElementById('hudBgmBtn');
    if (hb) hb.textContent = muted ? '静音' : '音景';
    const hab = document.getElementById('hudAudioBtn');
    if (hab) hab.textContent = muted ? '🔇' : `🔊 ${bgmPct}%`;

    const sab = document.getElementById('shopAudioBtn');
    if (sab) sab.textContent = muted ? '🔇 音量' : `🔊 ${bgmPct}%`;

    const pMute = document.getElementById('pauseMuteBtn');
    if (pMute) pMute.textContent = muted ? '🔇 已静音（点此恢复）' : '🔊 一键静音';
    const mMute = document.getElementById('audioModalMuteBtn');
    if (mMute) mMute.textContent = muted ? '🔇 当前静音 · 点击恢复声音' : '🔊 一键全部静音';

    const bgmTxt = muted ? `静音 (${bgmPct}%)` : `${bgmPct}%`;
    const sfxTxt = muted ? `静音 (${sfxPct}%)` : `${sfxPct}%`;
    ['bgmVolVal', 'pauseBgmVal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = bgmTxt;
    });
    ['sfxVolVal', 'pauseSfxVal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = sfxTxt;
    });

    const bs = document.getElementById('bgmVolSlider');
    if (bs && String(bs.value) !== String(bgmPct)) bs.value = String(bgmPct);
    const ss = document.getElementById('sfxVolSlider');
    if (ss && String(ss.value) !== String(sfxPct)) ss.value = String(sfxPct);
  }
};

function setBgmVolumePct(pct) {
  const cleanPct = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  AudioBank.bgmVol = cleanPct / 100;
  if (cleanPct > 0 && AudioBank.bgmMuted) {
    AudioBank.bgmMuted = false;
  }
  unlockAudio();
  const sid = (typeof curScene !== 'undefined' && curScene && curScene.id) || SpireAudio.activeSceneId;
  if (!AudioBank.bgm && cleanPct > 0) {
    SpireAudio.syncScene(sid);
  } else {
    AudioBank.syncBgmVolume();
  }
  AudioBank.savePrefs();
  SpireAudio.refreshButtons();
}

function adjustBgmVolume(deltaPct) {
  const cur = Math.round(AudioBank.bgmVol * 100);
  setBgmVolumePct(cur + (Number(deltaPct) || 0));
}

function previewSfxVolume() {
  if (!AudioBank.bgmMuted && AudioBank.sfxVol > 0.005) {
    beep(587.33, 0.055, 'triangle', 0.05);
  }
}

function setSfxVolumePct(pct, preview = true) {
  const cleanPct = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  AudioBank.sfxVol = cleanPct / 100;
  if (cleanPct > 0 && AudioBank.bgmMuted) {
    AudioBank.bgmMuted = false;
    AudioBank.syncBgmVolume();
  }
  unlockAudio();
  AudioBank.savePrefs();
  SpireAudio.refreshButtons();
  if (preview) previewSfxVolume();
}

function adjustSfxVolume(deltaPct) {
  const cur = Math.round(AudioBank.sfxVol * 100);
  setSfxVolumePct(cur + (Number(deltaPct) || 0), true);
}

function resetAudioDefaults() {
  AudioBank.bgmMuted = false;
  AudioBank.bgmVol = DEFAULT_BGM_VOL;
  AudioBank.sfxVol = DEFAULT_SFX_VOL;
  unlockAudio();
  SpireAudio.syncScene((typeof curScene !== 'undefined' && curScene && curScene.id) || SpireAudio.activeSceneId);
  AudioBank.savePrefs();
  SpireAudio.refreshButtons();
  previewSfxVolume();
}

function toggleSpireAudio() {
  AudioBank.bgmMuted = !AudioBank.bgmMuted;
  if (AudioBank.bgmMuted) {
    AudioBank.stopBgm();
  } else {
    if (AudioBank.bgmVol <= 0.005 && AudioBank.sfxVol <= 0.005) {
      AudioBank.bgmVol = DEFAULT_BGM_VOL;
      AudioBank.sfxVol = DEFAULT_SFX_VOL;
    }
    unlockAudio();
    SpireAudio.syncScene((typeof curScene !== 'undefined' && curScene && curScene.id) || SpireAudio.activeSceneId);
    beep(587.33, 0.06, 'triangle', 0.045);
  }
  AudioBank.savePrefs();
  SpireAudio.refreshButtons();
}

function isAudioModalOpen() {
  if (typeof document === 'undefined') return false;
  const am = document.getElementById('audioModal');
  return !!(am && !am.classList.contains('hidden'));
}

function openAudioModal() {
  if (typeof document === 'undefined') return;
  unlockAudio();
  SpireAudio.refreshButtons();
  const am = document.getElementById('audioModal');
  if (am) am.classList.remove('hidden');
}

function closeAudioModal() {
  if (typeof document === 'undefined') return;
  const am = document.getElementById('audioModal');
  if (am) am.classList.add('hidden');
  if (typeof last !== 'undefined' && typeof performance !== 'undefined') {
    last = performance.now();
  }
}

if (typeof document !== 'undefined') {
  SpireAudio.refreshButtons();
}
