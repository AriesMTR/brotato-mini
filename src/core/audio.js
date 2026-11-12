// WebAudio 合成音效（仅在 running 状态下发声 + 时间戳双保险防泄漏，彻底杜绝手机挂起/受击音效死锁或未捕获异常）
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

// 🔊 外部音频资源扩展接口（后续只需将 .mp3 / .ogg 放入 assets/audio/ 并注册即可播放真实音效与 BGM，缺失时自动回退合成音）
const AudioBank = {
  sfx: {},
  bgm: null,
  bgmMuted: false,
  registerSfx(key, url, volume = 0.55) {
    this.sfx[key] = { url, volume, pool: [], idx: 0 };
  },
  playSfx(key, fallbackFreq = 440, fallbackDur = 0.06, fallbackType = 'square', fallbackVol = 0.045) {
    const entry = this.sfx[key];
    if (entry && typeof Audio !== 'undefined') {
      try {
        if (entry.pool.length < 4) {
          const a = new Audio(entry.url);
          a.preload = 'auto';
          a.volume = entry.volume;
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
  playBgm(url, volume = 0.32) {
    if (typeof Audio === 'undefined') return;
    try {
      if (this.bgm && this.bgm.src && this.bgm.src.endsWith(url)) {
        if (this.bgm.paused && !this.bgmMuted) this.bgm.play().catch(() => {});
        return;
      }
      if (this.bgm) { this.bgm.pause(); }
      const a = new Audio(url);
      a.loop = true;
      a.volume = volume;
      this.bgm = a;
      if (!this.bgmMuted) a.play().catch(() => {});
    } catch (_) {}
  },
  stopBgm() {
    if (this.bgm) { try { this.bgm.pause(); } catch (_) {} }
  }
};
