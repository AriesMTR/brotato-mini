// WebAudio 合成音效 + 《烬塔残响》五大层域沉浸环境音景与过场音效引擎
let actx = null, activeVoices = 0;
const beepGate = {}, voiceExpiries = [];
function unlockAudio(e) {
  if (e && e.pointerType === 'touch' && !isTouch) {
    isTouch = true;
    syncArenaAndZoom();
    if (bootReady) clampCam();
  } else if (e && e.pointerType === 'mouse' && uiMode === 'desktop') {
    isTouch = false;
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
    const safeVol = Math.max(0.002, Math.min(0.2, vol || 0.04));
    const o = actx.createOscillator(), g = actx.createGain();
    activeVoices++;
    voiceExpiries.push(now + safeDur * 1000 + 80);
    o.type = type;
    o.frequency.setValueAtTime(safeFreq, actx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, safeFreq * 0.55), actx.currentTime + safeDur);
    g.gain.setValueAtTime(safeVol, actx.currentTime);
    g.gain.linearRampToValueAtTime(0.001, actx.currentTime + safeDur);
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

// 🔊 外部音频与场景音景扩展接口（加载 assets/audio/ 下合成的五大层域环境音景与过场特效音，缺失或受阻时无缝回退 WebAudio 旋律音景）
const AudioBank = {
  sfx: {},
  bgm: null,
  bgmMuted: false,
  currentBgmUrl: '',
  _resolveUrl(url) {
    if (!url) return '';
    const inlineMap = typeof window !== 'undefined' && window.__SPIRE_INLINE_ASSETS__;
    return (inlineMap && inlineMap[url]) ? inlineMap[url] : url;
  },
  registerSfx(key, url, volume = 0.55) {
    this.sfx[key] = { url, volume, pool: [], idx: 0, failed: false };
  },
  playSfx(key, fallbackFreq = 440, fallbackDur = 0.06, fallbackType = 'square', fallbackVol = 0.045) {
    if (this.bgmMuted && key && key.startsWith('cutscene_')) return;
    const entry = this.sfx[key];
    if (entry && !entry.failed && typeof Audio !== 'undefined') {
      try {
        if (entry.pool.length < 3) {
          const a = new Audio(this._resolveUrl(entry.url));
          a.preload = 'auto';
          a.volume = entry.volume;
          a.onerror = () => { entry.failed = true; };
          entry.pool.push(a);
        }
        const inst = entry.pool[entry.idx++ % entry.pool.length];
        inst.currentTime = 0;
        const p = inst.play();
        if (p && p.catch) p.catch(() => beep(fallbackFreq, fallbackDur, fallbackType, fallbackVol));
        return;
      } catch (_) {}
    }
    beep(fallbackFreq, fallbackDur, fallbackType, fallbackVol);
  },
  playBgm(url, volume = 0.34) {
    this.currentBgmUrl = url || '';
    if (typeof Audio === 'undefined' || !url) return false;
    try {
      if (this.bgm && this.bgm._relUrl === url) {
        this.bgm.volume = volume;
        if (this.bgm.paused && !this.bgmMuted) {
          const p = this.bgm.play();
          if (p && p.catch) p.catch(() => { SpireAudio.useSynthFallback = true; });
        }
        return true;
      }
      if (this.bgm) { try { this.bgm.pause(); } catch (_) {} }
      const a = new Audio(this._resolveUrl(url));
      a._relUrl = url;
      a.loop = true;
      a.volume = volume;
      a.onerror = () => { SpireAudio.useSynthFallback = true; };
      this.bgm = a;
      if (!this.bgmMuted) {
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

// 注册过场斩击与冰冕碎裂音效
AudioBank.registerSfx('cutscene_slash', 'assets/audio/cutscene_slash.wav', 0.52);
AudioBank.registerSfx('cutscene_shatter', 'assets/audio/cutscene_shatter.wav', 0.52);

const SCENE_AUDIO_MAP = {
  foundry:   { url: 'assets/audio/scene_foundry_rain.wav',   vol: 0.36, notes: [293.66, 349.23, 440.00, 329.63, 261.63, 220.00], waveType: 'triangle', step: 0.72 },
  glacier:   { url: 'assets/audio/scene_glacier_frost.wav',  vol: 0.34, notes: [523.25, 659.25, 880.00, 783.99, 659.25, 587.33], waveType: 'sine',     step: 0.64 },
  wasteland: { url: 'assets/audio/scene_wasteland_clock.wav',vol: 0.35, notes: [369.99, 440.00, 554.37, 523.25, 440.00, 329.63], waveType: 'triangle', step: 0.50 },
  desert:    { url: 'assets/audio/scene_desert_eclipse.wav', vol: 0.38, notes: [246.94, 293.66, 369.99, 440.00, 369.99, 293.66], waveType: 'sine',     step: 0.85 },
  fungal:    { url: 'assets/audio/scene_fungal_wind.wav',    vol: 0.34, notes: [329.63, 392.00, 493.88, 587.33, 493.88, 392.00], waveType: 'sine',     step: 0.68 }
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
    if (!AudioBank.bgmMuted) {
      const ok = AudioBank.playBgm(cfg.url, cfg.vol);
      if (!ok) this.useSynthFallback = true;
    }
    this.refreshButtons();
  },
  onUserUnlock() {
    if (AudioBank.bgmMuted) return;
    const cfg = SCENE_AUDIO_MAP[this.activeSceneId] || SCENE_AUDIO_MAP.foundry;
    if (AudioBank.bgm && AudioBank.bgm.paused) {
      const p = AudioBank.bgm.play();
      if (p && p.catch) p.catch(() => { this.useSynthFallback = true; });
    } else if (!AudioBank.bgm) {
      const ok = AudioBank.playBgm(cfg.url, cfg.vol);
      if (!ok) this.useSynthFallback = true;
    }
  },
  tick(dt) {
    if (AudioBank.bgmMuted) return;
    const bgmPlaying = !!(AudioBank.bgm && !AudioBank.bgm.paused && !AudioBank.bgm.ended);
    if (bgmPlaying && !this.useSynthFallback) return;
    if (!actx || actx.state !== 'running' || typeof actx.createBiquadFilter !== 'function') return;
    const cfg = SCENE_AUDIO_MAP[this.activeSceneId] || SCENE_AUDIO_MAP.foundry;
    this.acc += dt;
    if (this.acc < cfg.step) return;
    this.acc = 0;
    const f = cfg.notes[this.noteIdx++ % cfg.notes.length];
    try {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = cfg.waveType;
      o.frequency.setValueAtTime(f, actx.currentTime);
      g.gain.setValueAtTime(0.018, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + cfg.step * 0.88);
      o.connect(g); g.connect(actx.destination);
      o.onended = () => {
        try { o.disconnect(); g.disconnect(); } catch (_) {}
      };
      o.start(); o.stop(actx.currentTime + cfg.step * 0.90);
    } catch (_) {}
  },
  playCutsceneCue(variant, isMythic) {
    if (AudioBank.bgmMuted) return;
    if (variant === 'frost_queen' || variant === 'glacial_valkyrie') {
      AudioBank.playSfx('cutscene_shatter', 740, 0.18, 'sine', 0.06);
    } else {
      AudioBank.playSfx('cutscene_slash', isMythic ? 180 : 240, 0.20, 'sawtooth', 0.065);
    }
  },
  refreshButtons() {
    if (typeof document === 'undefined') return;
    const muted = AudioBank.bgmMuted;
    const mb = document.getElementById('menuBgmBtn');
    if (mb) mb.textContent = muted ? '音景 · 静音' : '音景 · 开启';
    const hb = document.getElementById('hudBgmBtn');
    if (hb) hb.textContent = muted ? '静音' : '音景';
  }
};

function toggleSpireAudio() {
  AudioBank.bgmMuted = !AudioBank.bgmMuted;
  if (AudioBank.bgmMuted) {
    AudioBank.stopBgm();
  } else {
    unlockAudio();
    SpireAudio.syncScene((typeof curScene !== 'undefined' && curScene && curScene.id) || SpireAudio.activeSceneId);
    beep(587.33, 0.07, 'triangle', 0.045);
  }
  SpireAudio.refreshButtons();
}
