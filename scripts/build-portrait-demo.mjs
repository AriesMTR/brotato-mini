#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const readSrc = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8').trim();

// Extract pure data + rendering slices from the live v1.3.0 game codebase so developer preview stays 100% in sync
const envCode = readSrc('src/core/env.js').replace(
  /const cv = document\.getElementById\('cv'\),\s*ctx = cv\.getContext\('2d', \{ alpha: false \}\);/,
  "const cv = document.createElement('canvas'); let ctx = cv.getContext('2d');"
);
const scenesCode = readSrc('src/data/scenes.js');
const texturesCode = readSrc('src/world/textures.js');
const arsenalCode = readSrc('src/data/arsenal.js');
const monstersCode = readSrc('src/data/monsters.js');
const bossPortraitsCode = readSrc('src/data/boss_portraits.js');

// Extract terrain geometry + portal generator from spawner.js (up to spawnArenaTerrains end)
const spawnerFull = readSrc('src/game/spawner.js');
const spawnerEndIdx = spawnerFull.indexOf('// 异星晶树刷新');
const spawnerGeoCode = spawnerEndIdx !== -1 ? spawnerFull.slice(0, spawnerEndIdx).trim() : spawnerFull;

const spritesCode = readSrc('src/render/sprites.js');

// Extract tracePolygon, traceSmoothLoop, drawSingleTerrain, drawSinglePortal from renderer.js
const rendererFull = readSrc('src/render/renderer.js');
const drawFnIdx = rendererFull.indexOf('function draw()');
const rendererTerrainCode = drawFnIdx !== -1 ? rendererFull.slice(0, drawFnIdx).trim() : '';

const svgRaw = readSrc('assets/icon.svg');
const svgDataUri = `data:image/svg+xml,${encodeURIComponent(svgRaw)}`;

function buildHtml(preferredAnimeBase) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>土豆兄弟 Mini · 开发者半身立绘与多状态实时检视台 (Out-of-Game Dev Studio)</title>
  <link rel="icon" type="image/svg+xml" href="${svgDataUri}">
  <style>
    :root {
      --bg: #0d0b14;
      --panel: #171324;
      --panel-2: #211b34;
      --border: #352b52;
      --accent: #ffd166;
      --pink: #ff4d6d;
      --cyan: #72efdd;
      --purple: #c77dff;
      --text: #f5f2ff;
      --muted: #a39bb8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at 20% 0%, #1d1533 0%, #0d0b14 60%);
      color: var(--text);
      font: 14px/1.5 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      min-height: 100vh;
    }
    header.top-bar {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(16, 12, 26, 0.92);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
      padding: 12px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-badge {
      background: linear-gradient(135deg, #ff4d6d, #9d4edd);
      color: #fff;
      font-weight: 900;
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 999px;
      letter-spacing: 0.06em;
    }
    .brand h1 { margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 0.02em; }
    .brand small { color: var(--muted); font-size: 12px; display: block; }
    .nav-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .tab-btn {
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      padding: 7px 14px;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 800;
      font-size: 13px;
      transition: 0.15s ease;
    }
    .tab-btn:hover { border-color: var(--purple); transform: translateY(-1px); }
    .tab-btn.active {
      background: linear-gradient(135deg, #ffd166, #ff9f1c);
      color: #191124;
      border-color: #ffd166;
    }
    main { max-width: 1560px; margin: 0 auto; padding: 20px 22px 60px; }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin: 18px 0 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .section-head h2 { margin: 0; font-size: 17px; display: flex; align-items: center; gap: 8px; }
    .pill-bar { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .pill {
      border: 1px solid var(--border);
      background: var(--panel-2);
      color: #e2dcf5;
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      user-select: none;
    }
    .pill:hover { border-color: var(--cyan); }
    .pill.on {
      background: rgba(114, 239, 221, 0.2);
      border-color: var(--cyan);
      color: var(--cyan);
    }
    .pill.mythic.on {
      background: rgba(255, 77, 109, 0.25);
      border-color: var(--pink);
      color: #ffd166;
    }

    /* Cards & Grids */
    .grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .grid-5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
    .grid-8 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    @media (max-width: 1200px) {
      .grid-5 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .grid-4, .grid-8 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 680px) {
      .grid-5, .grid-4, .grid-8 { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .card:hover { border-color: #6d59a8; }
    .card-stage {
      position: relative;
      background: radial-gradient(circle at 50% 38%, #2a2045, #120e1d 76%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .card-stage.checker {
      background-color: #1f1b2c;
      background-image: linear-gradient(45deg, #2b263d 25%, transparent 25%),
        linear-gradient(-45deg, #2b263d 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #2b263d 75%),
        linear-gradient(-45deg, transparent 75%, #2b263d 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0;
    }
    .card-stage.light {
      background: radial-gradient(circle at 50% 38%, #ffffff, #dfe4f2 80%);
    }
    .card-body { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 6px; }
    .card-title { font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .card-sub { color: var(--muted); font-size: 12px; }
    .tag {
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 6px;
      background: rgba(255, 209, 102, 0.14);
      color: var(--accent);
      border: 1px solid rgba(255, 209, 102, 0.3);
      white-space: nowrap;
    }
    .mini-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .mini-btn {
      flex: 1;
      border: 1px solid var(--border);
      background: var(--panel-2);
      color: var(--text);
      border-radius: 8px;
      padding: 5px 8px;
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
    }
    .mini-btn:hover { border-color: var(--accent); color: var(--accent); }

    /* Heroine Bust Framing */
    .bust-frame {
      width: 100%;
      aspect-ratio: 4 / 3.5;
      position: relative;
      overflow: hidden;
    }
    .bust-frame img, .bust-frame canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .bust-frame.crop-bust img {
      object-fit: cover;
      object-position: 50% 10%;
      transform: scale(1.34);
      transform-origin: 50% 16%;
      transition: filter 0.2s ease, transform 0.25s ease, opacity 0.2s ease;
    }
    .bust-frame.crop-face img {
      object-fit: cover;
      object-position: 50% 8%;
      transform: scale(2.05);
      transform-origin: 50% 13%;
      transition: filter 0.2s ease, transform 0.25s ease, opacity 0.2s ease;
    }
    .bust-frame.crop-full { aspect-ratio: 2 / 3; }
    .bust-frame.crop-full img {
      object-fit: contain;
      object-position: 50% 50%;
      transform: scale(1);
    }
    /* VN Mood states */
    .mood-speaking img, .mood-speaking canvas { filter: drop-shadow(0 6px 18px rgba(255, 209, 102, 0.28)); }
    .mood-dim img, .mood-dim canvas { filter: brightness(0.48) saturate(0.72); transform: scale(1.26) translateY(6px) !important; }
    .mood-blush::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 34%, rgba(255, 92, 148, 0.26), transparent 62%);
      pointer-events: none;
    }
    .mood-comm img, .mood-comm canvas {
      filter: hue-rotate(155deg) saturate(1.45) contrast(1.1) brightness(1.06);
    }
    .mood-comm::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(0deg, rgba(114, 239, 221, 0.16) 0px, rgba(114, 239, 221, 0.16) 2px, transparent 2px, transparent 5px);
      pointer-events: none;
    }
    .vn-caption-overlay {
      position: absolute;
      left: 8px; right: 8px; bottom: 8px;
      background: rgba(12, 9, 22, 0.86);
      border: 1px solid rgba(255, 209, 102, 0.45);
      border-radius: 9px;
      padding: 6px 9px;
      font-size: 11.5px;
      color: #f8f5ff;
      pointer-events: none;
    }
    .vn-caption-overlay b { color: var(--accent); margin-right: 6px; }

    /* Studio Two-Column Layout */
    .studio-layout {
      display: grid;
      grid-template-columns: 350px minmax(0, 1fr);
      gap: 18px;
      align-items: start;
    }
    @media (max-width: 980px) { .studio-layout { grid-template-columns: 1fr; } }
    .side-panel {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .side-panel h3 { margin: 0; font-size: 14px; color: var(--accent); }
    .roster-list { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .roster-item {
      border: 1px solid var(--border);
      background: var(--panel-2);
      color: var(--text);
      padding: 7px 9px;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .roster-item.active {
      border-color: var(--accent);
      background: rgba(255, 209, 102, 0.16);
      color: var(--accent);
    }
    .stage-box {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .dual-canvas-wrap {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 14px;
    }
    @media (max-width: 820px) { .dual-canvas-wrap { grid-template-columns: 1fr; } }
    .canvas-card {
      background: #110d1c;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .canvas-card canvas {
      width: 100%;
      max-width: 520px;
      height: auto;
      border-radius: 10px;
      background: radial-gradient(circle at 50% 42%, #261c42, #0e0a18 75%);
    }
    .vn-stage {
      position: relative;
      min-height: 460px;
      border-radius: 14px;
      border: 1px solid var(--border);
      overflow: hidden;
      background: radial-gradient(circle at 50% 30%, #2d2149 0%, #110d1e 75%);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 18px 24px 128px;
      gap: 24px;
    }
    .vn-actor {
      width: min(360px, 44%);
      height: 360px;
      position: relative;
      overflow: hidden;
      transition: 0.25s ease;
    }
    .vn-actor img, .vn-actor canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 50% 9%;
      transform: scale(1.26);
      transform-origin: 50% 14%;
    }
    .vn-actor.dim { filter: brightness(0.45) saturate(0.75); transform: translateY(10px) scale(0.95); }
    .vn-dialog-box {
      position: absolute;
      left: 20px; right: 20px; bottom: 16px;
      background: rgba(11, 8, 20, 0.92);
      border: 2px solid var(--accent);
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
    }
    .vn-speaker-tag {
      display: inline-block;
      background: var(--accent);
      color: #161021;
      font-weight: 900;
      font-size: 12.5px;
      padding: 2px 10px;
      border-radius: 6px;
      margin-bottom: 5px;
    }
    .status-banner {
      background: rgba(114, 239, 221, 0.1);
      border: 1px solid rgba(114, 239, 221, 0.35);
      color: #d8fbf6;
      padding: 8px 13px;
      border-radius: 10px;
      font-size: 12.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .status-banner.warn {
      background: rgba(255, 209, 102, 0.12);
      border-color: rgba(255, 209, 102, 0.4);
      color: #ffe8a3;
    }
    /* Fullscreen Cutscene Overlay */
    #cutsceneOverlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: none;
      cursor: pointer;
    }
    #cutsceneOverlay.show { display: block; }
    #cutsceneCanvas { width: 100%; height: 100%; display: block; }
    .weapon-strip {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
      gap: 8px;
      max-height: 310px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .wep-chip {
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 9px;
      padding: 6px;
      text-align: center;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
    }
    .wep-chip.active { border-color: var(--accent); background: rgba(255, 209, 102, 0.16); }
    .wep-chip canvas { width: 76px; height: 48px; display: block; margin: 0 auto 3px; }
  </style>
</head>
<body>
  <header class="top-bar">
    <div class="brand">
      <span class="brand-badge">DEV ONLY · 开发者工具</span>
      <div>
        <h1>🎨 半身立绘与多状态实时检视台 · <span id="verBadge">v1.3.0</span></h1>
        <small>无需进入游戏 · 直接检视 4 位剧情女主 / 10 位首领与统领 / 8 位土豆英雄 / 32 把武器 / 5 大异形地形全部状态</small>
      </div>
    </div>
    <nav class="nav-tabs" id="mainTabs">
      <button class="tab-btn active" data-tab="overview">🧩 全立绘状态总览墙</button>
      <button class="tab-btn" data-tab="heroines">✨ 4位剧情女主半身/对话态</button>
      <button class="tab-btn" data-tab="bosses">👑 10位首领半身/狂暴/异常态</button>
      <button class="tab-btn" data-tab="potatoes">🥔 8位英雄穿戴/护盾/32武器</button>
      <button class="tab-btn" data-tab="terrains">🗺️ 5大非圆异形地形网格</button>
    </nav>
  </header>

  <main>
    <div id="assetStatusBanner" class="status-banner">
      <span>⚡ 正在同步游戏内矢量立绘引擎与本地角色立绘资源...</span>
      <span id="fpsReadout">60 FPS · 0 渐变 / 0 阴影滤镜</span>
    </div>

    <!-- TAB 1: ALL-AT-ONCE OVERVIEW MATRIX -->
    <section id="tab-overview" class="tab-pane active">
      <div class="section-head">
        <h2>✨ 剧情女主半身立绘 · 一键全局状态对照 (4 名角色)</h2>
        <div class="pill-bar" id="ovHeroineBar">
          <span class="pill on" data-hmode="formal">正装半身 (.png)</span>
          <span class="pill" data-hmode="summer">夏装半身 (summer_base)</span>
          <span class="pill" data-hmode="blink">闭眼差分帧 (blink)</span>
          <span class="pill" data-hmode="live_canvas">Canvas 实时呼吸+眨眼合成</span>
          <span class="pill" data-hmode="apng">4s循环动态 (.apng)</span>
          <span class="pill" data-hmood="speaking">💬 发言高亮</span>
          <span class="pill" data-hmood="dim">👂 倾听半暗</span>
          <span class="pill" data-hmood="blush">💗 好感微醺</span>
          <span class="pill" data-hmood="comm">⚡ 全息通讯</span>
        </div>
      </div>
      <div class="grid-4" id="ovHeroineGrid"></div>

      <div class="section-head">
        <h2>👑 10 位终局魔王 / 奇遇召唤霸主 / 精英统领 · 一阶夏装 &amp; 二阶段隐藏换装立绘墙</h2>
        <div class="pill-bar" id="ovBossBar">
          <span class="pill on" data-bview="bust_only">🏖️ 半身立绘大图</span>
          <span class="pill" data-bview="compare">✨ 一阶 vs 二阶换装同框对比</span>
          <span class="pill" data-bview="dual">⚔️ 立绘 + 战场实体同屏</span>
          <span class="pill mythic" data-bflag="mythic">🔥 切换二阶段隐藏换装</span>
          <span class="pill" data-bflag="expose">🎯 破绽暴露金圈</span>
          <span class="pill" data-bflag="burn">🔥 灼烧火舌</span>
          <span class="pill" data-bflag="freeze">🧊 六角玄冰禁锢</span>
          <span class="pill" data-bflag="poison">☠️ 剧毒气泡</span>
          <span class="pill" data-bflag="flash">⚡ 受击闪白</span>
        </div>
      </div>
      <div class="grid-5" id="ovBossGrid"></div>

      <div class="section-head">
        <h2>🥔 8 位土豆英雄半身特写 · 职业装扮与饰品穿戴状态墙</h2>
        <div class="pill-bar" id="ovPotatoBar">
          <span class="pill on" data-ppreset="equipped">✨ 满配饰品+元素球</span>
          <span class="pill" data-ppreset="base">🥔 裸装初始态</span>
          <span class="pill" data-ppreset="shield">🛡️ 偏导护盾+疾跑</span>
          <span class="pill" data-ppreset="hurt">💥 受击无敌闪白+5s读秒</span>
        </div>
      </div>
      <div class="grid-8" id="ovPotatoGrid"></div>
    </section>

    <!-- TAB 2: HEROINE BUST & VN CUT-IN STUDIO -->
    <section id="tab-heroines" class="tab-pane">
      <div class="studio-layout">
        <aside class="side-panel">
          <h3>1. 选择主讲角色</h3>
          <div class="roster-list" id="heroineRoster"></div>

          <h3>2. 构图裁切模式</h3>
          <div class="pill-bar" id="heroineCropBar">
            <span class="pill on" data-crop="vn">🎭 关底双人对话实机模拟</span>
            <span class="pill" data-crop="crop-bust">🖼️ 半身立绘框</span>
            <span class="pill" data-crop="crop-face">🔍 面部表情特写</span>
            <span class="pill" data-crop="crop-full">🧍 2:3 全身原画</span>
          </div>

          <h3>3. 立绘差分 / 动态源</h3>
          <div class="pill-bar" id="heroineSrcBar">
            <span class="pill on" data-src="live_canvas">⚡ Canvas 呼吸+眨眼合成</span>
            <span class="pill" data-src="formal">👗 正装原画 (.png)</span>
            <span class="pill" data-src="summer">🏖️ 夏装静帧 (base.png)</span>
            <span class="pill" data-src="blink">😌 闭眼帧 (blink.png)</span>
            <span class="pill" data-src="apng">🎞️ 4s 动态 (.apng)</span>
            <span class="pill" data-src="gif">🎞️ 动图 (.gif)</span>
          </div>

          <h3>4. 情绪光效 / 对话状态</h3>
          <div class="pill-bar" id="heroineMoodBar">
            <span class="pill on" data-mood="speaking">💬 发言高亮</span>
            <span class="pill" data-mood="dim">👂 倾听半暗</span>
            <span class="pill" data-mood="blush">💗 好感微醺</span>
            <span class="pill" data-mood="comm">⚡ 紧急通讯</span>
            <span class="pill" id="forceBlinkBtn">👁️ 立即手动眨眼一次</span>
          </div>

          <h3>5. 画布底色 & 搭档角色</h3>
          <div class="pill-bar" id="heroineBgBar">
            <span class="pill on" data-bg="dark">🌌 星渊深色</span>
            <span class="pill" data-bg="checker">🏁 透明棋盘格</span>
            <span class="pill" data-bg="light">☀️ 纯白亮底</span>
          </div>
          <div class="pill-bar" id="partnerSelectBar"></div>
        </aside>

        <div class="stage-box">
          <div id="heroineStageContainer"></div>
          <div id="heroineMetaInfo" class="card-sub"></div>
        </div>
      </div>
    </section>

    <!-- TAB 3: 10 BOSS / COMMANDER PORTRAIT & BATTLE STATE STUDIO -->
    <section id="tab-bosses" class="tab-pane">
      <div class="studio-layout">
        <aside class="side-panel">
          <h3>1. 选择首领 / 奇遇Boss / 统领 (共10位)</h3>
          <div class="roster-list" id="bossRoster"></div>

          <h3>2. 阶段与战场异常状态叠加</h3>
          <div class="pill-bar" id="bossStateBar">
            <span class="pill mythic" data-st="mythicPhase2">🔥 真红二阶段觉醒</span>
            <span class="pill" data-st="lowHp">💢 残血狂暴 (&lt;45%)</span>
            <span class="pill" data-st="expose">🎯 破绽暴露 (×1.35伤)</span>
            <span class="pill" data-st="burn">🔥 灼烧火舌</span>
            <span class="pill" data-st="chill">❄️ 冰缓霜雾</span>
            <span class="pill" data-st="freeze">🧊 六角玄冰禁锢</span>
            <span class="pill" data-st="poison">☠️ 剧毒气泡 (6层)</span>
            <span class="pill" data-st="hitFlash">⚡ 受击闪白</span>
            <span class="pill" data-st="lockedAim">🚨 冲锋红线锁定</span>
          </div>

          <h3>3. 全屏定格登场横幅演出测试</h3>
          <div class="mini-actions">
            <button class="mini-btn" id="playBossIntroBtn">🎬 播放登场定格动画</button>
            <button class="mini-btn" id="playBossMythicBtn" style="border-color:#ff4d6d;color:#ffd166;">🔥 播放二阶段狂暴觉醒</button>
          </div>
          <div id="bossSkillDesc" class="card-sub" style="line-height:1.65;"></div>
        </aside>

        <div class="stage-box">
          <div class="dual-canvas-wrap">
            <div class="canvas-card">
              <div class="card-title" style="width:100%">
                <span id="bossPortraitTitle">👑 夏装半身立绘特写 (drawBossPortrait)</span>
                <span class="tag" id="bossCategoryTag">终局魔王</span>
              </div>
              <canvas id="studioBossPortraitCanvas" width="520" height="460"></canvas>
            </div>
            <div class="canvas-card">
              <div class="card-title" style="width:100%">
                <span>⚔️ 战场实时受击/异常态实体 (drawEnemySprite)</span>
                <span class="tag">60 FPS 同步</span>
              </div>
              <canvas id="studioBossEntityCanvas" width="400" height="400"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 4: 8 POTATO HEROES + WEARABLES + 32 WEAPONS -->
    <section id="tab-potatoes" class="tab-pane">
      <div class="studio-layout">
        <aside class="side-panel">
          <h3>1. 选择土豆职业 (8位)</h3>
          <div class="roster-list" id="potatoRoster"></div>

          <h3>2. 角色运动与战斗状态</h3>
          <div class="pill-bar" id="potatoMotionBar">
            <span class="pill on" data-pm="moving">🏃 疾跑摆腿</span>
            <span class="pill on" data-pm="shield">🛡️ 偏导能量护盾</span>
            <span class="pill" data-pm="shieldHit">⚡ 护盾受击高亮</span>
            <span class="pill" data-pm="hurt">💥 受击无敌闪白</span>
            <span class="pill" data-pm="countdown">⏱️ 终局5秒读秒标</span>
          </div>

          <h3>3. 可视化穿戴饰品开关 (实时上身)</h3>
          <div class="pill-bar" id="potatoGearBar"></div>

          <h3>4. 武器品阶与炮台类型</h3>
          <div class="pill-bar" id="wepTierBar">
            <span class="pill" data-tier="1">Lv.1 白色</span>
            <span class="pill" data-tier="2">Lv.2 蓝色</span>
            <span class="pill" data-tier="3">Lv.3 紫色</span>
            <span class="pill on" data-tier="4">Lv.4 传说金</span>
          </div>
        </aside>

        <div class="stage-box">
          <div class="dual-canvas-wrap">
            <div class="canvas-card">
              <div class="card-title" style="width:100%">
                <span id="potatoStageTitle">🥔 英雄半身特写与穿戴实装预览</span>
                <span class="tag" id="potatoWeaponTag">当前主武器</span>
              </div>
              <canvas id="studioPotatoCanvas" width="480" height="360"></canvas>
            </div>
            <div class="canvas-card">
              <div class="card-title" style="width:100%">
                <span>🛠️ 工程炮台三形态 (机枪 / 烈焰 / 悬浮激光)</span>
                <span class="tag">v1.3.0 科技流</span>
              </div>
              <canvas id="studioTurretCanvas" width="380" height="360"></canvas>
            </div>
          </div>

          <div class="card-title">🔫 全流派 32 把武器矢量立绘检视 (点击可装配到上方土豆手中)</div>
          <div class="weapon-strip" id="weaponStrip"></div>
        </div>
      </div>
    </section>

    <!-- TAB 5: 5 SIGNATURE NON-CIRCULAR TERRAINS -->
    <section id="tab-terrains" class="tab-pane">
      <div class="section-head">
        <h2>🗺️ 一图一专属 · 非圆形异形地形与多边形碰撞检视</h2>
        <div class="pill-bar">
          <span class="pill on" id="toggleWireframeBtn">📐 显示碰撞多边形顶点 / 断层脊线网格</span>
          <span class="pill" id="rerollTerrainSeedBtn">🎲 随机重掷异形种子 (Seed)</span>
        </div>
      </div>
      <div class="grid-5" id="terrainGrid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));"></div>
    </section>
  </main>

  <!-- Fullscreen Cutscene Player Overlay -->
  <div id="cutsceneOverlay" title="点击任意处关闭演出">
    <canvas id="cutsceneCanvas"></canvas>
  </div>

  <script>
    // Minimal globals expected by shared rendering modules (env.js & scenes.js declare cv, ctx, viewW, viewH, dpr, curScene, etc.)
    let uiMode = 'desktop', state = 'menu', overtime = false, waveTime = 30, wave = 1;
    let player = {
      x: 0, y: 0, r: 18, cls: 'allrounder', faceDir: 1, lookA: 0,
      moving: false, walkT: 0, invuln: 0, shield: 0, maxShield: 0, shieldHitT: 0,
      magnet: 90, _displayRange: 130, teslaCount: 0, items: {}, weapons: []
    };
    function logInfo() {}
    function logWarn() {}
    function logError() {}

${envCode}
    dpr = Math.min(2, window.devicePixelRatio || 1);

${scenesCode}

${texturesCode}

${arsenalCode}

${monstersCode}

${bossPortraitsCode}

${spawnerGeoCode}

${spritesCode}

${rendererTerrainCode}

    // ================= DEVELOPER SHOWCASE CONTROLLER =================
    document.getElementById('verBadge').textContent = APP_VERSION;

    const PREFERRED_ANIME_BASE = ${JSON.stringify(preferredAnimeBase)};
    const ANIME_BASE_CANDIDATES = [
      PREFERRED_ANIME_BASE,
      './anime_character_art/',
      '../../anime_character_art/',
      '../anime_character_art/',
      './brotato_web/assets/characters/',
      '../assets/characters/'
    ];
    let resolvedAnimeBase = PREFERRED_ANIME_BASE;

    const HEROINES = [
      {
        id: '01_silver_swordswoman',
        name: '艾莉丝 · 银发剑姬',
        role: '苍银骑士团长 · 精准/剑术流导师',
        palette: '#4cc9f0',
        formalDesc: '靛蓝金纹骑士礼装 · 细剑',
        summerDesc: '靛蓝露肩夏日轻装',
        lines: {
          speaking: '“呼吸别乱——看准首领破绽金圈亮起的那一刻，一剑贯穿！”',
          dim: '（静静握住剑柄，目光追随着你的走位……）',
          blush: '“咳……这身夏装只是为了方便挥剑散热而已，别一直盯着看啦。”',
          comm: '【加密通讯】检测到第 5 波精英统领跃迁反应，注意规避裂地冲锋线！'
        }
      },
      {
        id: '02_crimson_qipao',
        name: '绯烟 · 黑发旗袍御姐',
        role: '绯红商会执掌者 · 暴击/理财流导师',
        palette: '#ff4d6d',
        formalDesc: '绛红暗金绣纹旗袍 · 折扇',
        summerDesc: '绛红夏日轻纱旗袍',
        lines: {
          speaking: '“呵呵，战利品与命运都讲究筹码——这一波想赌一把血契祭坛吗？”',
          dim: '（轻摇折扇，微笑着倾听同伴的分析……）',
          blush: '“难得休整一回，陪我喝杯冰饮如何？给你打个内部专属折扣~”',
          comm: '【商会急电】奇遇遗迹已刷新！互动可召唤秘宝首领，风险与收益并存哦。'
        }
      },
      {
        id: '03_violet_mage',
        name: '星萝 · 粉发星月法师',
        role: '星穹秘法塔占星师 · 元素异常流导师',
        palette: '#c77dff',
        formalDesc: '紫晶星月层叠法袍 · 月杖',
        summerDesc: '浅紫星纱夏日短裙',
        lines: {
          speaking: '“灼烧、寒霜与剧毒同时共鸣时，星月之力会让伤害彻底失控哦！”',
          dim: '（指尖绕着微光星尘，认真记录元素反应数据……）',
          blush: '“占星水晶说今天会遇到命定之人……唔，水晶球怎么突然这么烫！”',
          comm: '【星象预警】高浓度菌沼孢子潮来袭，小心毒泥减速区域！'
        }
      },
      {
        id: '04_azure_cyber_ranger',
        name: '零 · 蓝发未来游侠',
        role: '天穹轨道特勤游侠 · 科技/枪械流导师',
        palette: '#72efdd',
        formalDesc: '白灰青光战术装甲服',
        summerDesc: '冰蓝机能运动夏装',
        lines: {
          speaking: '“浮游激光无人机与感应地雷已就位，火力网覆盖率 100%。”',
          dim: '（战术目镜微闪，实时同步战场地形扫描网格……）',
          blush: '“心率上升 18%……奇怪，明明没有进入超载模式，一定是天气太热了。”',
          comm: '【战术链路】锁定熔核机械巨像！建议利用菱晶裂隙门拉开距离！'
        }
      }
    ];

    const ALL_BOSS_ENTRIES = [
      { variant: 'butcher', enemyType: 'boss', cat: '终局魔王', name: '深渊屠夫虫王', epithet: '腐血母巢暴君', color: '#e63946', skills: '三段狂暴连冲 + 腐血弹幕扇射 + 虫群孵化' },
      { variant: 'frost_queen', enemyType: 'boss', cat: '终局魔王', name: '极寒霜晶女皇', epithet: '永冻凛冬神姬', color: '#00bbf9', skills: '冰晶新星环射 + 极寒霜径封锁 + 寒冰护卫召唤' },
      { variant: 'mech_colossus', enemyType: 'boss', cat: '终局魔王', name: '熔核机械巨像', epithet: '歼星重装泰坦', color: '#f77f00', skills: '歼星交叉激光炮 + 重装震地冲击 + 熔岩火口改写' },
      { variant: 'void_weaver', enemyType: 'boss', cat: '终局魔王', name: '虚空织网主宰', epithet: '次元裂隙古神', color: '#9d4edd', skills: '次元瞬移突袭 + 虚空螺旋弹幕 + 裂隙触须召唤' },
      { variant: 'crimson_lord', enemyType: 'special_boss', cat: '奇遇霸主', name: '猩红鲜血伯爵', epithet: '绯红血契祭坛召唤', color: '#d90429', skills: '鲜血蝙蝠风暴 + 猩红镰刃突刺 + 极小概率真红神话二阶段' },
      { variant: 'golden_golem', enemyType: 'special_boss', cat: '奇遇霸主', name: '黄金晶石巨神', epithet: '黄金贪婪神像召唤', color: '#f59e0b', skills: '黄金陨石震击 + 晶石折射弹幕 + 击败必爆高阶秘宝箱' },
      { variant: 'abyss_devourer', enemyType: 'special_boss', cat: '奇遇霸主', name: '异次元吞噬者', epithet: '虚空裂隙魔方召唤', color: '#7209b7', skills: '奇点引力牵引 + 吞星暗物质球 + 狂暴二阶段(+60s)' },
      { variant: 'vanguard', enemyType: 'mini_boss', cat: '精英统领', name: '狂厄裂地统领', epithet: '第 5 波起登场先锋', color: '#f72585', skills: '重甲蓄力裂地猛冲 + 破阵环形震波' },
      { variant: 'pyro_lord', enemyType: 'mini_boss', cat: '精英统领', name: '炽焰重炮统领', epithet: '第 5 波起登场重炮', color: '#fb5607', skills: '高爆熔火臼炮连射 + 十字烈焰弹幕' },
      { variant: 'shadow_stalker', enemyType: 'mini_boss', cat: '精英统领', name: '幽影雷刃统领', epithet: '第 5 波起登场刺客', color: '#7209b7', skills: '高频雷光瞬步斩 + 三连紫电弧刃' }
    ];

    const GEAR_TOGGLES = [
      ['crown', '👑 黄金皇冠'],
      ['clover', '🍀 幸运四叶草'],
      ['bat', '🦇 吸血蝠翼'],
      ['butterfly', '🦋 幻影蝶翼'],
      ['sniper_cloak', '🧥 鹰眼披风'],
      ['boots', '👢 战术军靴'],
      ['thorns', '🌵 荆棘肩刺'],
      ['plate', '🛡️ 合金胸板'],
      ['bandana', '🧣 赤红头巾'],
      ['reactor', '☢️ 聚变胸核'],
      ['glasses', '👓 金边眼镜'],
      ['scope', '🎯 全息单镜'],
      ['berserk', '💢 狂战怒眉'],
      ['napalm', '🔥 烈焰浮游核'],
      ['cryo', '❄️ 寒霜棱晶球'],
      ['venom_gland', '☠️ 剧毒腺体球'],
      ['prism', '🔮 赛博棱镜球'],
      ['tesla', '⚡ 特斯拉电球']
    ];

    // Image preload & auto-base detection for 4 heroines
    const heroineImages = {};
    let loadedImgCount = 0;
    let manualBlinkUntil = 0;

    function resolveUrl(base, relPath) {
      return base + relPath;
    }

    function probeAndLoadHeroines() {
      let candidateIdx = 0;
      function tryNextBase() {
        if (candidateIdx >= ANIME_BASE_CANDIDATES.length) {
          const banner = document.getElementById('assetStatusBanner');
          banner.classList.add('warn');
          banner.firstElementChild.textContent = '⚠️ 未在相对路径下检测到 anime_character_art 原画目录（游戏内 10 首领 / 8 英雄 / 32 武器 / 5 地形矢量立绘均已 100% 离线就绪）。请确保在 JAX 目录或 brotato_web/tools 目录打开本页以加载女主 PNG/APNG。';
          return;
        }
        const testBase = ANIME_BASE_CANDIDATES[candidateIdx++];
        const probe = new Image();
        probe.onload = () => {
          resolvedAnimeBase = testBase;
          loadAllHeroineFrames(testBase);
        };
        probe.onerror = tryNextBase;
        probe.src = testBase + '01_silver_swordswoman.png';
      }
      tryNextBase();
    }

    function loadAllHeroineFrames(base) {
      for (const h of HEROINES) {
        const entry = {
          formal: new Image(),
          summer: new Image(),
          blink: new Image(),
          formalUrl: resolveUrl(base, h.id + '.png'),
          summerUrl: resolveUrl(base, 'summer_animated/sources/' + h.id + '_summer_base.png'),
          blinkUrl: resolveUrl(base, 'summer_animated/sources/' + h.id + '_blink.png'),
          apngUrl: resolveUrl(base, 'summer_animated/' + h.id + '_summer.apng'),
          gifUrl: resolveUrl(base, 'summer_animated/' + h.id + '_summer.gif')
        };
        const onLoaded = () => {
          loadedImgCount++;
          const banner = document.getElementById('assetStatusBanner');
          banner.classList.remove('warn');
          banner.firstElementChild.textContent = '✅ 全立绘资源就绪：10 首领/统领 + 8 土豆英雄 + 32 武器 + 5 异形地形 + 4 位剧情女主 (' + loadedImgCount + '/12 静帧 & APNG/GIF 路径: ' + base + ')';
          syncOverviewHeroines();
          renderHeroineStudioStage();
        };
        entry.formal.onload = onLoaded;
        entry.summer.onload = onLoaded;
        entry.blink.onload = onLoaded;
        entry.formal.src = entry.formalUrl;
        entry.summer.src = entry.summerUrl;
        entry.blink.src = entry.blinkUrl;
        heroineImages[h.id] = entry;
      }
    }

    // Helper: Draw animated breathing + periodic blinking half-body bust onto a 2D canvas
    function drawHeroineLiveBust(targetCanvas, heroineId, cropMode, nowMs, phaseOffset) {
      const g = targetCanvas.getContext('2d');
      const w = targetCanvas.width, h = targetCanvas.height;
      g.clearRect(0, 0, w, h);
      const imgs = heroineImages[heroineId];
      const baseImg = imgs && (imgs.summer.complete && imgs.summer.naturalWidth > 0 ? imgs.summer : (imgs.formal.complete && imgs.formal.naturalWidth > 0 ? imgs.formal : null));
      if (!baseImg) {
        g.fillStyle = '#a39bb8';
        g.font = '700 14px -apple-system, sans-serif';
        g.textAlign = 'center';
        g.fillText('正在读取本地立绘 PNG...', w * 0.5, h * 0.5);
        return;
      }
      // Natural blink every 3.8s (130ms closed) or manual trigger
      const cyc = (nowMs * 0.001 + phaseOffset * 1.13) % 3.8;
      const isBlinking = (nowMs < manualBlinkUntil) || (cyc > 3.52 && cyc < 3.66) || (phaseOffset === 0 && cyc > 1.72 && cyc < 1.83);
      const activeImg = (isBlinking && imgs.blink.complete && imgs.blink.naturalWidth > 0) ? imgs.blink : baseImg;

      const breath = Math.sin(nowMs * 0.0024 + phaseOffset) * 3.2;
      const sway = Math.cos(nowMs * 0.0015 + phaseOffset) * 1.6;

      const iw = activeImg.naturalWidth || 1024;
      const ih = activeImg.naturalHeight || 1536;

      if (cropMode === 'crop-full') {
        const sc = Math.min(w / iw, h / ih) * 0.96;
        const dw = iw * sc, dh = ih * sc;
        g.drawImage(activeImg, (w - dw) * 0.5 + sway, (h - dh) * 0.5 + breath * 0.6, dw, dh);
      } else if (cropMode === 'crop-face') {
        // Close-up head & shoulders
        const sx = iw * 0.22, sy = ih * 0.03, sw = iw * 0.56, sh = ih * 0.36;
        const sc = Math.max(w / sw, h / sh);
        const dw = sw * sc, dh = sh * sc;
        g.drawImage(activeImg, sx, sy, sw, sh, (w - dw) * 0.5 + sway * 0.6, (h - dh) * 0.5 + breath * 0.8, dw, dh);
      } else {
        // Default Half-Body Bust (head + upper torso + hands)
        const sx = iw * 0.10, sy = ih * 0.02, sw = iw * 0.80, sh = ih * 0.56;
        const sc = Math.max(w / sw, h / sh);
        const dw = sw * sc, dh = sh * sc;
        g.drawImage(activeImg, sx, sy, sw, sh, (w - dw) * 0.5 + sway, (h - dh) * 0.35 + breath, dw, dh);
      }
    }

    // ================= TAB NAVIGATION =================
    let activeTab = 'overview';
    document.querySelectorAll('#mainTabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        document.querySelectorAll('#mainTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'tab-' + activeTab));
        if (activeTab === 'heroines') renderHeroineStudioStage();
      });
    });

    // ================= SECTION 1: OVERVIEW MATRIX SETUP =================
    let ovHeroineMode = 'formal';
    let ovHeroineMood = 'speaking';
    const ovLiveHeroineCanvases = [];

    function buildOverviewHeroines() {
      const grid = document.getElementById('ovHeroineGrid');
      grid.innerHTML = '';
      ovLiveHeroineCanvases.length = 0;
      HEROINES.forEach((h, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = \`
          <div class="card-stage bust-frame crop-bust mood-\${ovHeroineMood}" data-hid="\${h.id}">
            <img alt="\${h.name}" data-role="img">
            <canvas width="420" height="368" data-role="canvas" style="display:none"></canvas>
            <div class="vn-caption-overlay"><b>\${h.name.split(' · ')[0]}</b><span>\${h.lines[ovHeroineMood]}</span></div>
          </div>
          <div class="card-body">
            <div class="card-title">
              <span>\${h.name}</span>
              <span class="tag" data-role="modeTag">正装半身</span>
            </div>
            <div class="card-sub">\${h.role}</div>
            <div class="mini-actions">
              <button class="mini-btn" data-jump-heroine="\${idx}">🔍 进入对话/差分检视台</button>
            </div>
          </div>
        \`;
        grid.appendChild(card);
        ovLiveHeroineCanvases.push({ id: h.id, canvas: card.querySelector('canvas'), idx });
        card.querySelector('[data-jump-heroine]').onclick = () => {
          studioHeroineIdx = idx;
          document.querySelector('[data-tab="heroines"]').click();
          syncHeroineRosterUI();
          renderHeroineStudioStage();
        };
      });
      syncOverviewHeroines();
    }

    function syncOverviewHeroines() {
      const modeLabels = {
        formal: '正装半身',
        summer: '夏装半身',
        blink: '闭眼差分',
        live_canvas: '实时呼吸眨眼',
        apng: '4s APNG动态'
      };
      document.querySelectorAll('#ovHeroineGrid .card').forEach((card, idx) => {
        const h = HEROINES[idx];
        const stage = card.querySelector('.bust-frame');
        stage.className = 'card-stage bust-frame crop-bust mood-' + ovHeroineMood;
        const imgEl = card.querySelector('img');
        const cvsEl = card.querySelector('canvas');
        const imgs = heroineImages[h.id];
        card.querySelector('[data-role="modeTag"]').textContent = modeLabels[ovHeroineMode] || ovHeroineMode;
        card.querySelector('.vn-caption-overlay span').textContent = h.lines[ovHeroineMood];

        if (ovHeroineMode === 'live_canvas') {
          imgEl.style.display = 'none';
          cvsEl.style.display = 'block';
        } else {
          cvsEl.style.display = 'none';
          imgEl.style.display = 'block';
          if (imgs) {
            if (ovHeroineMode === 'formal') imgEl.src = imgs.formalUrl;
            else if (ovHeroineMode === 'summer') imgEl.src = imgs.summerUrl;
            else if (ovHeroineMode === 'blink') imgEl.src = imgs.blinkUrl;
            else if (ovHeroineMode === 'apng') imgEl.src = imgs.apngUrl;
          }
        }
      });
    }

    document.getElementById('ovHeroineBar').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      if (pill.dataset.hmode) {
        ovHeroineMode = pill.dataset.hmode;
        document.querySelectorAll('#ovHeroineBar [data-hmode]').forEach(p => p.classList.toggle('on', p === pill));
      } else if (pill.dataset.hmood) {
        ovHeroineMood = pill.dataset.hmood;
        document.querySelectorAll('#ovHeroineBar [data-hmood]').forEach(p => p.classList.toggle('on', p === pill));
      }
      syncOverviewHeroines();
    });

    // Overview Boss Cards (10 Anime Summer Bust Portraits + optional dual battle entity)
    let ovBossViewMode = 'bust_only';
    const ovBossFlags = { mythic: false, expose: false, burn: false, freeze: false, poison: false, flash: false };
    const ovBossCanvases = [];

    function buildOverviewBosses() {
      const grid = document.getElementById('ovBossGrid');
      grid.innerHTML = '';
      ovBossCanvases.length = 0;
      ALL_BOSS_ENTRIES.forEach((b, idx) => {
        const spec = (typeof BOSS_PORTRAIT_DATA !== 'undefined' && BOSS_PORTRAIT_DATA[b.variant]) || null;
        const shortName = spec ? spec.personaName.split(' · ')[0] : b.name;
        const p1Label = spec ? (shortName + ' · ' + spec.summerTitle) : b.epithet;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = \`
          <div class="card-stage" style="padding:4px">
            <canvas width="420" height="360" style="width:100%;height:auto;display:block;"></canvas>
            <div class="vn-caption-overlay"><b data-role="bpersona">\${p1Label}</b><span data-role="bphase">33% 一阶登场立绘</span></div>
          </div>
          <div class="card-body">
            <div class="card-title">
              <span>\${b.name}</span>
              <span class="tag">\${b.cat}</span>
            </div>
            <div class="card-sub">\${b.epithet}</div>
            <div class="mini-actions">
              <button class="mini-btn" data-cutscene-boss="\${idx}">🎬 一阶登场</button>
              <button class="mini-btn" data-mythic-boss="\${idx}" style="border-color:#ff4d6d;color:#ffd166;">🔥 二阶换装</button>
              <button class="mini-btn" data-jump-boss="\${idx}">🔍 检视台</button>
            </div>
          </div>
        \`;
        grid.appendChild(card);
        ovBossCanvases.push({
          def: b,
          spec,
          canvas: card.querySelector('canvas'),
          personaEl: card.querySelector('[data-role="bpersona"]'),
          phaseEl: card.querySelector('[data-role="bphase"]'),
          idx
        });
        card.querySelector('[data-jump-boss]').onclick = () => {
          selectedBossIdx = idx;
          document.querySelector('[data-tab="bosses"]').click();
          syncBossRosterUI();
        };
        card.querySelector('[data-cutscene-boss]').onclick = () => {
          triggerFullscreenCutscene(b, false);
        };
        card.querySelector('[data-mythic-boss]').onclick = () => {
          triggerFullscreenCutscene(b, true);
        };
      });
    }

    document.getElementById('ovBossBar').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      if (pill.dataset.bview) {
        ovBossViewMode = pill.dataset.bview;
        document.querySelectorAll('#ovBossBar [data-bview]').forEach(p => p.classList.toggle('on', p === pill));
        return;
      }
      if (!pill.dataset.bflag) return;
      const k = pill.dataset.bflag;
      ovBossFlags[k] = !ovBossFlags[k];
      pill.classList.toggle('on', ovBossFlags[k]);
    });

    // Overview Potato Cards
    let ovPotatoPreset = 'equipped';
    const ovPotatoCanvases = [];
    const CLASS_START_WEP = {
      allrounder: 'pistol',
      ranger: 'smg',
      brawler: 'stick',
      engineer: 'wrench',
      vampire: 'knife',
      multitasker: 'pistol',
      bull: '',
      ghost: 'shuriken'
    };

    function buildOverviewPotatoes() {
      const grid = document.getElementById('ovPotatoGrid');
      grid.innerHTML = '';
      ovPotatoCanvases.length = 0;
      CLASSES.forEach((cls, idx) => {
        const startWep = CLASS_START_WEP[cls.id] || '';
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = \`
          <div class="card-stage" style="padding:6px">
            <canvas width="280" height="185" style="width:100%;height:auto;display:block;"></canvas>
          </div>
          <div class="card-body">
            <div class="card-title">
              <span>\${cls.icon} \${cls.name}</span>
              <span class="tag">\${cls.tag} · \${cls.loadout}</span>
            </div>
            <div class="card-sub">\${cls.perks}</div>
            <div class="mini-actions">
              <button class="mini-btn" data-jump-potato="\${idx}">🛠️ 自定义饰品与武器</button>
            </div>
          </div>
        \`;
        grid.appendChild(card);
        ovPotatoCanvases.push({ cls, startWep, canvas: card.querySelector('canvas'), idx });
        card.querySelector('[data-jump-potato]').onclick = () => {
          selectedPotatoIdx = idx;
          if (startWep) selectedWeaponId = startWep;
          document.querySelector('[data-tab="potatoes"]').click();
          syncPotatoStudioUI();
        };
      });
    }

    document.getElementById('ovPotatoBar').addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill || !pill.dataset.ppreset) return;
      ovPotatoPreset = pill.dataset.ppreset;
      document.querySelectorAll('#ovPotatoBar .pill').forEach(p => p.classList.toggle('on', p === pill));
    });

    // ================= TAB 2: HEROINE STUDIO =================
    let studioHeroineIdx = 0;
    let studioPartnerIdx = 1;
    let studioCrop = 'vn';
    let studioSrc = 'live_canvas';
    let studioMood = 'speaking';
    let studioBg = 'dark';
    let studioLiveCanvases = [];

    function buildHeroineStudioControls() {
      const roster = document.getElementById('heroineRoster');
      const partnerBar = document.getElementById('partnerSelectBar');
      roster.innerHTML = '';
      partnerBar.innerHTML = '<span class="card-sub">同屏搭档：</span>';
      HEROINES.forEach((h, idx) => {
        const b = document.createElement('button');
        b.className = 'roster-item' + (idx === studioHeroineIdx ? ' active' : '');
        b.textContent = h.name.split(' · ')[1];
        b.onclick = () => {
          studioHeroineIdx = idx;
          if (studioPartnerIdx === idx) studioPartnerIdx = (idx + 1) % HEROINES.length;
          syncHeroineRosterUI();
          renderHeroineStudioStage();
        };
        roster.appendChild(b);

        const p = document.createElement('span');
        p.className = 'pill' + (idx === studioPartnerIdx ? ' on' : '');
        p.textContent = h.name.split(' · ')[0];
        p.onclick = () => {
          studioPartnerIdx = idx;
          syncHeroineRosterUI();
          renderHeroineStudioStage();
        };
        partnerBar.appendChild(p);
      });

      document.getElementById('heroineCropBar').onclick = e => {
        const p = e.target.closest('.pill');
        if (!p) return;
        studioCrop = p.dataset.crop;
        document.querySelectorAll('#heroineCropBar .pill').forEach(x => x.classList.toggle('on', x === p));
        renderHeroineStudioStage();
      };
      document.getElementById('heroineSrcBar').onclick = e => {
        const p = e.target.closest('.pill');
        if (!p) return;
        studioSrc = p.dataset.src;
        document.querySelectorAll('#heroineSrcBar .pill').forEach(x => x.classList.toggle('on', x === p));
        renderHeroineStudioStage();
      };
      document.getElementById('heroineMoodBar').onclick = e => {
        const p = e.target.closest('.pill');
        if (!p) return;
        if (p.id === 'forceBlinkBtn') {
          manualBlinkUntil = performance.now() + 200;
          return;
        }
        studioMood = p.dataset.mood;
        document.querySelectorAll('#heroineMoodBar [data-mood]').forEach(x => x.classList.toggle('on', x === p));
        renderHeroineStudioStage();
      };
      document.getElementById('heroineBgBar').onclick = e => {
        const p = e.target.closest('.pill');
        if (!p) return;
        studioBg = p.dataset.bg;
        document.querySelectorAll('#heroineBgBar .pill').forEach(x => x.classList.toggle('on', x === p));
        renderHeroineStudioStage();
      };
    }

    function syncHeroineRosterUI() {
      document.querySelectorAll('#heroineRoster .roster-item').forEach((b, i) => b.classList.toggle('active', i === studioHeroineIdx));
      document.querySelectorAll('#partnerSelectBar .pill').forEach((b, i) => b.classList.toggle('on', i === studioPartnerIdx));
    }

    function getHeroineSrcUrl(hId, srcKey) {
      const imgs = heroineImages[hId];
      if (!imgs) return '';
      if (srcKey === 'formal') return imgs.formalUrl;
      if (srcKey === 'summer') return imgs.summerUrl;
      if (srcKey === 'blink') return imgs.blinkUrl;
      if (srcKey === 'apng') return imgs.apngUrl;
      if (srcKey === 'gif') return imgs.gifUrl;
      return imgs.formalUrl;
    }

    function renderHeroineStudioStage() {
      const container = document.getElementById('heroineStageContainer');
      const h = HEROINES[studioHeroineIdx];
      const partner = HEROINES[studioPartnerIdx];
      studioLiveCanvases = [];
      const bgCls = studioBg === 'checker' ? 'checker' : (studioBg === 'light' ? 'light' : '');

      if (studioCrop === 'vn') {
        container.innerHTML = \`
          <div class="vn-stage card-stage \${bgCls}">
            <div class="vn-actor mood-\${studioMood}" id="vnLeftActor"></div>
            <div class="vn-actor dim" id="vnRightActor" title="点击切换主讲人"></div>
            <div class="vn-dialog-box">
              <span class="vn-speaker-tag">\${h.name} · \${h.role.split(' · ')[0]}</span>
              <div style="font-size:15px;font-weight:700;color:#f8f5ff;">\${h.lines[studioMood]}</div>
              <div style="font-size:11.5px;color:#a39bb8;margin-top:4px;">💡 提示：点击右侧半暗倾听角色可立即互换主讲焦点；支持上方切换正装 / 夏装 / 闭眼帧 / APNG 动态。</div>
            </div>
          </div>
        \`;
        const leftBox = document.getElementById('vnLeftActor');
        const rightBox = document.getElementById('vnRightActor');
        rightBox.style.cursor = 'pointer';
        rightBox.onclick = () => {
          const tmp = studioHeroineIdx;
          studioHeroineIdx = studioPartnerIdx;
          studioPartnerIdx = tmp;
          syncHeroineRosterUI();
          renderHeroineStudioStage();
        };
        if (studioSrc === 'live_canvas') {
          const c1 = document.createElement('canvas'); c1.width = 520; c1.height = 520;
          const c2 = document.createElement('canvas'); c2.width = 520; c2.height = 520;
          leftBox.appendChild(c1); rightBox.appendChild(c2);
          studioLiveCanvases.push({ id: h.id, canvas: c1, crop: 'crop-bust', phase: 0 });
          studioLiveCanvases.push({ id: partner.id, canvas: c2, crop: 'crop-bust', phase: 2.1 });
        } else {
          const i1 = document.createElement('img'); i1.src = getHeroineSrcUrl(h.id, studioSrc);
          const i2 = document.createElement('img'); i2.src = getHeroineSrcUrl(partner.id, studioSrc === 'blink' ? 'summer' : studioSrc);
          leftBox.appendChild(i1); rightBox.appendChild(i2);
        }
      } else {
        container.innerHTML = \`
          <div class="card-stage bust-frame \${studioCrop} mood-\${studioMood} \${bgCls}" style="max-width:560px;margin:0 auto;border-radius:14px;border:1px solid var(--border);">
            \${studioSrc === 'live_canvas'
              ? '<canvas id="singleHeroineLiveCanvas" width="640" height="580"></canvas>'
              : \`<img src="\${getHeroineSrcUrl(h.id, studioSrc)}" alt="\${h.name}">\`
            }
          </div>
        \`;
        if (studioSrc === 'live_canvas') {
          studioLiveCanvases.push({
            id: h.id,
            canvas: document.getElementById('singleHeroineLiveCanvas'),
            crop: studioCrop,
            phase: 0
          });
        }
      }
      document.getElementById('heroineMetaInfo').textContent =
        \`当前检视：\${h.name} (\${h.id}) · 正装设定：\${h.formalDesc} · 夏装设定：\${h.summerDesc} · 原画规格：1024×1536 RGBA PNG\`;
    }

    // ================= TAB 3: BOSS STUDIO =================
    let selectedBossIdx = 0;
    const bossStudioState = {
      mythicPhase2: false,
      lowHp: false,
      expose: false,
      burn: false,
      chill: false,
      freeze: false,
      poison: false,
      hitFlash: false,
      lockedAim: false
    };

    function buildBossStudioControls() {
      const roster = document.getElementById('bossRoster');
      roster.innerHTML = '';
      ALL_BOSS_ENTRIES.forEach((b, idx) => {
        const btn = document.createElement('button');
        btn.className = 'roster-item' + (idx === selectedBossIdx ? ' active' : '');
        btn.textContent = b.name;
        btn.onclick = () => {
          selectedBossIdx = idx;
          syncBossRosterUI();
        };
        roster.appendChild(btn);
      });

      document.getElementById('bossStateBar').onclick = e => {
        const p = e.target.closest('.pill');
        if (!p || !p.dataset.st) return;
        const k = p.dataset.st;
        bossStudioState[k] = !bossStudioState[k];
        p.classList.toggle('on', bossStudioState[k]);
        if (k === 'mythicPhase2') syncBossRosterUI();
      };

      document.getElementById('playBossIntroBtn').onclick = () => {
        triggerFullscreenCutscene(ALL_BOSS_ENTRIES[selectedBossIdx], false);
      };
      document.getElementById('playBossMythicBtn').onclick = () => {
        triggerFullscreenCutscene(ALL_BOSS_ENTRIES[selectedBossIdx], true);
      };
      syncBossRosterUI();
    }

    function syncBossRosterUI() {
      const b = ALL_BOSS_ENTRIES[selectedBossIdx];
      const spec = (typeof BOSS_PORTRAIT_DATA !== 'undefined' && BOSS_PORTRAIT_DATA[b.variant]) || null;
      const isM = !!bossStudioState.mythicPhase2;
      const activeSkin = spec ? (isM ? ('🔥隐藏换装：' + spec.mythicTitle) : spec.summerTitle) : '';
      const personaNote = spec ? (' · ' + spec.personaName.split(' · ')[0] + '（' + activeSkin + '）') : '';
      document.querySelectorAll('#bossRoster .roster-item').forEach((btn, i) => btn.classList.toggle('active', i === selectedBossIdx));
      document.getElementById('bossPortraitTitle').textContent = '👑 ' + b.name + personaNote;
      document.getElementById('bossCategoryTag').textContent = b.cat + ' · ' + b.epithet;
      document.getElementById('bossSkillDesc').innerHTML =
        \`<b>一阶段夏装（33% 登场）：</b>\${spec ? (spec.personaName + ' · ' + spec.summerTitle) : b.name}<br><b>二阶段隐藏换装（25% 觉醒）：</b><span style="color:#ffd166">\${spec ? (spec.personaName.split(' · ')[0] + ' · ' + spec.mythicTitle) : '真红觉醒形态'}</span><br><b>招式机制：</b>\${b.skills}<br><b>近战友好窗口：</b>释放大招后进入 <b>破绽暴露金圈 (exposeT)</b>，移动放缓且承受全流派伤害 ×1.35！\`;
    }

    function makeDummyBossEntity(b, flags, nowMs, cx, cy) {
      const r = b.enemyType === 'mini_boss' ? 31 : 40;
      return {
        x: cx,
        y: cy,
        r,
        type: b.enemyType,
        variant: b.variant,
        color: b.color,
        hp: (flags.lowHp || flags.mythicPhase2) ? 380 : 1000,
        maxHp: 1000,
        elite: true,
        phase: nowMs * 0.004,
        hitFlash: flags.hitFlash ? 0.12 : 0,
        mythicPhase2: !!flags.mythicPhase2,
        exposeT: flags.expose ? 1.5 : 0,
        burnT: flags.burn ? 2.5 : 0,
        chillT: flags.chill ? 2.5 : 0,
        freezeT: flags.freeze ? 2.0 : 0,
        poisonT: flags.poison ? 3.0 : 0,
        poisonStacks: flags.poison ? 6 : 0,
        dashWindup: flags.lockedAim ? 0.45 : 0,
        lockedAim: flags.lockedAim ? 0.25 : null,
        dashVx: Math.cos(0.25) * 420,
        dashVy: Math.sin(0.25) * 420
      };
    }

    // Fullscreen Boss Cutscene Player
    let activeCutscene = null;
    const cutsceneOverlay = document.getElementById('cutsceneOverlay');
    const cutsceneCanvas = document.getElementById('cutsceneCanvas');
    cutsceneOverlay.onclick = () => {
      activeCutscene = null;
      cutsceneOverlay.classList.remove('show');
    };

    function triggerFullscreenCutscene(b, isMythic) {
      activeCutscene = {
        variant: b.variant,
        mode: isMythic ? 'mythic_phase2' : 'intro',
        title: isMythic ? (b.name + ' · 真红神格') : b.name,
        subtitle: isMythic ? '🔥 极小概率隐藏二阶段狂暴觉醒 · 回合延长 +60s！' : ('⚠️ ' + b.cat + '降临 · ' + b.epithet),
        extraTag: isMythic ? '全屏弹幕狂化 · 击败必掉传说神话秘宝箱！' : b.skills,
        color: isMythic ? '#ff2a55' : b.color,
        accent: '#ffd166',
        t: 2.3,
        maxT: 2.3,
        lastTs: performance.now()
      };
      cutsceneOverlay.classList.add('show');
    }

    // ================= TAB 4: POTATO HEROES + 32 WEAPONS STUDIO =================
    let selectedPotatoIdx = 0;
    let selectedWeaponId = 'katana';
    let selectedWeaponTier = 4;
    const potatoMotion = { moving: true, shield: true, shieldHit: false, hurt: false, countdown: false };
    const potatoGear = { crown: true, boots: true, bat: true, scope: true, reactor: true, napalm: true, prism: true };

    function buildPotatoStudioControls() {
      const roster = document.getElementById('potatoRoster');
      roster.innerHTML = '';
      CLASSES.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.className = 'roster-item' + (idx === selectedPotatoIdx ? ' active' : '');
        btn.textContent = c.icon + ' ' + c.name;
        btn.onclick = () => {
          selectedPotatoIdx = idx;
          if (CLASS_START_WEP[c.id]) selectedWeaponId = CLASS_START_WEP[c.id];
          syncPotatoStudioUI();
        };
        roster.appendChild(btn);
      });

      const gearBar = document.getElementById('potatoGearBar');
      gearBar.innerHTML = '';
      GEAR_TOGGLES.forEach(([key, label]) => {
        const p = document.createElement('span');
        p.className = 'pill' + (potatoGear[key] ? ' on' : '');
        p.textContent = label;
        p.onclick = () => {
          potatoGear[key] = !potatoGear[key];
          p.classList.toggle('on', potatoGear[key]);
        };
        gearBar.appendChild(p);
      });

      document.getElementById('potatoMotionBar').onclick = e => {
        const p = e.target.closest('.pill');
        if (!p || !p.dataset.pm) return;
        const k = p.dataset.pm;
        potatoMotion[k] = !potatoMotion[k];
        p.classList.toggle('on', potatoMotion[k]);
      };

      document.getElementById('wepTierBar').onclick = e => {
        const p = e.target.closest('.pill');
        if (!p || !p.dataset.tier) return;
        selectedWeaponTier = Number(p.dataset.tier);
        document.querySelectorAll('#wepTierBar .pill').forEach(x => x.classList.toggle('on', x === p));
        renderWeaponStrip();
        syncPotatoStudioUI();
      };

      renderWeaponStrip();
      syncPotatoStudioUI();
    }

    function renderWeaponStrip() {
      const strip = document.getElementById('weaponStrip');
      strip.innerHTML = '';
      Object.entries(WEAPONS).forEach(([id, def]) => {
        const chip = document.createElement('div');
        chip.className = 'wep-chip' + (id === selectedWeaponId ? ' active' : '');
        const c = document.createElement('canvas');
        c.width = 110; c.height = 68;
        chip.appendChild(c);
        const lbl = document.createElement('div');
        lbl.textContent = def.name;
        const setSpan = document.createElement('div');
        setSpan.style.color = '#a39bb8';
        setSpan.style.fontSize = '10px';
        setSpan.textContent = (SET_DEFS[def.set] ? SET_DEFS[def.set].label : def.set);
        chip.appendChild(lbl);
        chip.appendChild(setSpan);

        const prevCtx = ctx;
        ctx = c.getContext('2d');
        ctx.save();
        ctx.translate(55, 34);
        ctx.scale(1.45, 1.45);
        drawWeaponSprite({ id, tier: selectedWeaponTier, wx: -6, wy: 0, angle: -0.18 });
        ctx.restore();
        ctx = prevCtx;

        chip.onclick = () => {
          selectedWeaponId = id;
          document.querySelectorAll('#weaponStrip .wep-chip').forEach(x => x.classList.remove('active'));
          chip.classList.add('active');
          syncPotatoStudioUI();
        };
        strip.appendChild(chip);
      });
    }

    function syncPotatoStudioUI() {
      const cls = CLASSES[selectedPotatoIdx];
      document.querySelectorAll('#potatoRoster .roster-item').forEach((b, i) => b.classList.toggle('active', i === selectedPotatoIdx));
      const wDef = WEAPONS[selectedWeaponId];
      document.getElementById('potatoStageTitle').textContent = \`🥔 \${cls.icon} \${cls.name} · 半身特写与饰品穿戴预览\`;
      document.getElementById('potatoWeaponTag').textContent = \`装配：\${wDef ? wDef.name : selectedWeaponId} (Lv.\${selectedWeaponTier})\`;
    }

    function renderPotatoOnto(targetCanvas, clsId, gearMap, motionMap, wepId, wepTier, nowMs, scaleMul) {
      const g = targetCanvas.getContext('2d');
      const w = targetCanvas.width, h = targetCanvas.height;
      g.clearRect(0, 0, w, h);
      const prevCtx = ctx;
      ctx = g;

      state = motionMap.countdown ? 'wave' : 'menu';
      overtime = false;
      waveTime = motionMap.countdown ? (3.2 + Math.sin(nowMs * 0.002)) : 30;

      player = {
        x: 0,
        y: 6,
        r: 18,
        cls: clsId,
        faceDir: 1,
        lookA: Math.sin(nowMs * 0.002) * 0.35,
        moving: !!motionMap.moving,
        walkT: nowMs * 0.012,
        invuln: motionMap.hurt ? 0.45 : 0,
        shield: motionMap.shield ? 30 : 0,
        maxShield: 30,
        shieldHitT: motionMap.shieldHit ? 0.2 : 0,
        magnet: 58,
        _displayRange: 68,
        teslaCount: gearMap.tesla ? 1 : 0,
        items: Object.assign({}, gearMap)
      };

      ctx.save();
      ctx.translate(w * 0.5, h * 0.54);
      ctx.scale(scaleMul, scaleMul);
      drawPotatoHero();
      if (wepId && WEAPONS[wepId]) {
        drawWeaponSprite({
          id: wepId,
          tier: wepTier || 3,
          wx: 28,
          wy: 4 + Math.sin(nowMs * 0.005) * 2.5,
          angle: Math.sin(nowMs * 0.003) * 0.16
        });
      }
      ctx.restore();

      state = 'menu';
      ctx = prevCtx;
    }

    // ================= TAB 5: 5 NON-CIRCULAR TERRAINS =================
    let showTerrainWireframe = true;
    let terrainSeedOffset = 0;
    const terrainCards = [];

    function buildTerrainInspector() {
      const grid = document.getElementById('terrainGrid');
      grid.innerHTML = '';
      terrainCards.length = 0;
      const specs = [
        { sceneId: 'wasteland', title: '荒芜废土 · 菱晶虚空裂隙门 (A↔B)', kind: 'portals', desc: '成对八芒星裂口 + 旋转浮游棱晶残片，彻底告别圆环传送阵' },
        { sceneId: 'desert', title: '赤砂荒漠 · 锯齿折线大裂谷', kind: 'chasm', desc: '6段折线主脊 + 三层犬牙断崖阶地，阻挡地面冲锋但允许远程飞跃' },
        { sceneId: 'glacier', title: '极寒冰原 · 16棱碎晶寒霜冰镜', kind: 'ice_sheet', desc: '不对称尖角多面体冰湖 + 内部冰裂折纹，踏入享极速滑行加成' },
        { sceneId: 'foundry', title: '熔火锻炉 · 多瓣玄武熔岩火口', kind: 'lava', desc: '22顶点犬牙玄武岩岸 + 三层律动熔流瓣 + 漂浮黑曜石碎岛' },
        { sceneId: 'fungal', title: '荧光菌丛 · 曲岸阿米巴剧毒菌沼', kind: 'swamp', desc: '有机平滑曲岸泥沼 + 离岸浅滩子池 + 荧光毒蕈簇' }
      ];
      specs.forEach((sp, idx) => {
        const sc = SCENES.find(s => s.id === sp.sceneId) || SCENES[0];
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = \`
          <div class="card-stage" style="padding:8px;background:\${sc.midCol || '#181424'}">
            <canvas width="360" height="260" style="width:100%;height:auto;display:block;border-radius:10px;"></canvas>
          </div>
          <div class="card-body">
            <div class="card-title">
              <span>\${sc.icon} \${sp.title}</span>
              <span class="tag">1图1专属地形</span>
            </div>
            <div class="card-sub">\${sp.desc}</div>
          </div>
        \`;
        grid.appendChild(card);
        terrainCards.push({ spec: sp, sc, canvas: card.querySelector('canvas'), idx });
      });

      document.getElementById('toggleWireframeBtn').onclick = function () {
        showTerrainWireframe = !showTerrainWireframe;
        this.classList.toggle('on', showTerrainWireframe);
      };
      document.getElementById('rerollTerrainSeedBtn').onclick = () => {
        terrainSeedOffset += 3.71;
      };
    }

    // ================= MASTER 60FPS ANIMATION LOOP =================
    let frames = 0, lastFpsT = performance.now();

    function tick(now) {
      frames++;
      if (now - lastFpsT >= 600) {
        const fps = Math.round((frames * 1000) / (now - lastFpsT));
        document.getElementById('fpsReadout').textContent = fps + ' FPS · 实时矢量无损渲染';
        frames = 0;
        lastFpsT = now;
      }

      if (activeTab === 'overview') {
        if (ovHeroineMode === 'live_canvas') {
          for (const item of ovLiveHeroineCanvases) {
            drawHeroineLiveBust(item.canvas, item.id, 'crop-bust', now, item.idx);
          }
        }
        // Render all 10 Boss cards (Summer Anime Half-Body Bust + status effects / optional live entity)
        for (const item of ovBossCanvases) {
          const c = item.canvas;
          const g = c.getContext('2d');
          g.clearRect(0, 0, c.width, c.height);
          const prevCtx = ctx;
          ctx = g;

          if (item.spec) {
            const shortN = item.spec.personaName.split(' · ')[0];
            if (ovBossViewMode === 'compare') {
              item.personaEl.textContent = shortN + ' · 双形态换装对比';
              item.phaseEl.textContent = '左：一阶夏装 ｜ 右：二阶隐藏换装';
            } else if (ovBossFlags.mythic) {
              item.personaEl.textContent = '🔥 ' + shortN + ' · ' + (item.spec.mythicTitle || item.spec.summerTitle);
              item.phaseEl.textContent = '25% 二阶段隐藏换装';
            } else {
              item.personaEl.textContent = shortN + ' · ' + item.spec.summerTitle;
              item.phaseEl.textContent = '33% 一阶登场立绘';
            }
          }

          if (ovBossViewMode === 'compare') {
            // Side-by-side Phase 1 Summer Outfit vs Hidden Phase 2 Awakened Swimwear Outfit!
            const p1Canvas = typeof getBossAnimePortrait === 'function' ? getBossAnimePortrait(item.def.variant, false) : null;
            const p2Canvas = typeof getBossAnimePortrait === 'function' ? getBossAnimePortrait(item.def.variant, true) : null;
            const breath = Math.sin(now * 0.0025 + item.idx * 0.7) * 2.2;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            if (p1Canvas) {
              const sc = 0.52;
              const dw = p1Canvas.width * sc, dh = p1Canvas.height * sc;
              ctx.drawImage(p1Canvas, 105 - dw * 0.5, 22 + breath, dw, dh);
            } else {
              drawBossPortrait(item.def.variant, 105, 160, 0.95, false);
            }
            ctx.strokeStyle = 'rgba(255, 209, 102, 0.32)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(210, 18); ctx.lineTo(210, 310); ctx.stroke();
            if (p2Canvas) {
              ctx.fillStyle = 'rgba(255, 42, 85, 0.16)';
              ctx.strokeStyle = '#ffd166';
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(315, 148, 76, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
              const sc = 0.52;
              const dw = p2Canvas.width * sc, dh = p2Canvas.height * sc;
              ctx.drawImage(p2Canvas, 315 - dw * 0.5, 22 - breath, dw, dh);
            } else {
              drawBossPortrait(item.def.variant, 315, 160, 0.95, true);
            }
          } else if (ovBossViewMode === 'bust_only') {
            // Heroine-style full Half-Body Bust showcase (swaps between Phase 1 Summer & Phase 2 Hidden Costume!)
            const animeCanvas = typeof getBossAnimePortrait === 'function' ? getBossAnimePortrait(item.def.variant, ovBossFlags.mythic) : null;
            if (ovBossFlags.mythic) {
              drawBossPortrait(item.def.variant, c.width * 0.5, c.height * 0.47, 1.58, true);
            } else if (animeCanvas) {
              ctx.save();
              ctx.strokeStyle = item.def.color;
              ctx.globalAlpha = 0.45;
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.arc(c.width * 0.5, c.height * 0.44, 112, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();

              const breath = Math.sin(now * 0.0025 + item.idx * 0.7) * 2.8;
              const sway = Math.cos(now * 0.0015 + item.idx * 0.7) * 1.4;
              const sc = 0.66;
              const dw = animeCanvas.width * sc, dh = animeCanvas.height * sc;
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(animeCanvas, (c.width - dw) * 0.5 + sway, 6 + breath, dw, dh);
            } else {
              drawBossPortrait(item.def.variant, c.width * 0.5, c.height * 0.46, 1.45, false);
            }

            // Status effect overlays directly on the portrait stage when toggled
            if (ovBossFlags.expose) {
              ctx.save();
              ctx.strokeStyle = '#ffd166';
              ctx.lineWidth = 3;
              ctx.setLineDash([10, 7]);
              ctx.beginPath();
              ctx.arc(c.width * 0.5, c.height * 0.44, 128, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
            if (ovBossFlags.burn) {
              ctx.fillStyle = 'rgba(255, 107, 53, 0.22)';
              ctx.fillRect(0, 0, c.width, c.height);
            }
            if (ovBossFlags.freeze) {
              ctx.strokeStyle = '#72efdd';
              ctx.lineWidth = 3.5;
              ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
            }
            if (ovBossFlags.poison) {
              ctx.fillStyle = '#a3e635';
              for (let p = 0; p < 5; p++) {
                const px = 65 + p * 72 + Math.sin(now * 0.003 + p) * 10;
                const py = 270 - ((now * 0.05 + p * 44) % 180);
                ctx.beginPath();
                ctx.arc(px, py, 5 + (p % 2) * 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            if (ovBossFlags.flash && (Math.floor(now / 180) % 2 === 0)) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
              ctx.fillRect(0, 0, c.width, c.height);
            }
          } else {
            drawBossPortrait(item.def.variant, 136, 166, 1.28, ovBossFlags.mythic);
            const dummy = makeDummyBossEntity(item.def, {
              mythicPhase2: ovBossFlags.mythic,
              expose: ovBossFlags.expose,
              burn: ovBossFlags.burn,
              freeze: ovBossFlags.freeze,
              poison: ovBossFlags.poison,
              hitFlash: ovBossFlags.flash && (Math.floor(now / 180) % 2 === 0)
            }, now, 326, 164);
            ctx.save();
            ctx.translate(326, 164);
            ctx.scale(1.22, 1.22);
            dummy.x = 0; dummy.y = 0;
            drawEnemySprite(dummy);
            ctx.restore();
          }
          ctx = prevCtx;
        }
        // Render all 8 Potato Hero cards
        const presetGear = ovPotatoPreset === 'base'
          ? {}
          : { crown: true, boots: true, bat: true, scope: true, reactor: true, napalm: true, prism: true };
        const presetMotion = {
          moving: ovPotatoPreset === 'shield' || ovPotatoPreset === 'equipped',
          shield: ovPotatoPreset === 'shield',
          shieldHit: false,
          hurt: ovPotatoPreset === 'hurt',
          countdown: ovPotatoPreset === 'hurt'
        };
        for (const item of ovPotatoCanvases) {
          renderPotatoOnto(item.canvas, item.cls.id, presetGear, presetMotion, item.startWep, 4, now + item.idx * 210, 1.85);
        }
      } else if (activeTab === 'heroines') {
        for (const item of studioLiveCanvases) {
          drawHeroineLiveBust(item.canvas, item.id, item.crop, now, item.phase);
        }
      } else if (activeTab === 'bosses') {
        const b = ALL_BOSS_ENTRIES[selectedBossIdx];
        const pCanvas = document.getElementById('studioBossPortraitCanvas');
        const eCanvas = document.getElementById('studioBossEntityCanvas');
        const prevCtx = ctx;

        ctx = pCanvas.getContext('2d');
        ctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        drawBossPortrait(b.variant, pCanvas.width * 0.5, pCanvas.height * 0.50, 1.92, bossStudioState.mythicPhase2);

        ctx = eCanvas.getContext('2d');
        ctx.clearRect(0, 0, eCanvas.width, eCanvas.height);
        ctx.save();
        ctx.translate(eCanvas.width * 0.5, eCanvas.height * 0.52);
        ctx.scale(1.85, 1.85);
        const dummy = makeDummyBossEntity(b, {
          ...bossStudioState,
          hitFlash: bossStudioState.hitFlash && (Math.floor(now / 160) % 2 === 0)
        }, now, 0, 0);
        if (dummy.lockedAim !== null) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 42, 85, 0.78)';
          ctx.lineWidth = 2.4;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(dummy.lockedAim) * 95, Math.sin(dummy.lockedAim) * 95);
          ctx.stroke();
          ctx.restore();
        }
        drawEnemySprite(dummy);
        ctx.restore();
        ctx = prevCtx;
      } else if (activeTab === 'potatoes') {
        const cls = CLASSES[selectedPotatoIdx];
        renderPotatoOnto(
          document.getElementById('studioPotatoCanvas'),
          cls.id,
          potatoGear,
          potatoMotion,
          selectedWeaponId,
          selectedWeaponTier,
          now,
          2.65
        );
        // Render 3 turret variants
        const tc = document.getElementById('studioTurretCanvas');
        const prevCtx = ctx;
        ctx = tc.getContext('2d');
        ctx.clearRect(0, 0, tc.width, tc.height);
        const turretSpecs = [
          { kind: 'standard', flame: false, label: '🛠️ 标准机枪炮台', y: 72 },
          { kind: 'flame', flame: true, label: '🔥 烈焰喷射炮台', y: 184 },
          { kind: 'laser', flame: false, label: '🛸 悬浮激光无人机塔', y: 296 }
        ];
        for (const ts of turretSpecs) {
          ctx.save();
          ctx.translate(115, ts.y);
          ctx.scale(1.65, 1.65);
          drawTurretSprite({ x: 0, y: 0, kind: ts.kind, flame: ts.flame, angle: Math.sin(now * 0.0025) * 0.45, fireAnim: 0 });
          ctx.restore();
          ctx.fillStyle = '#f5f2ff';
          ctx.font = '800 13px -apple-system, sans-serif';
          ctx.fillText(ts.label, 185, ts.y + 5);
        }
        ctx = prevCtx;
      } else if (activeTab === 'terrains') {
        const prevCtx = ctx;
        for (const item of terrainCards) {
          const c = item.canvas;
          ctx = c.getContext('2d');
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.fillStyle = item.sc.midCol || '#1b1628';
          ctx.fillRect(0, 0, c.width, c.height);

          if (item.spec.kind === 'portals') {
            const pA = makeRiftPortal(105, 136, 'A', '#c77dff', 1.2 + terrainSeedOffset);
            const pB = makeRiftPortal(255, 130, 'B', '#4cc9f0', 3.9 + terrainSeedOffset);
            pA.pulse = now * 0.003;
            pB.pulse = now * 0.003 + 1.5;
            ctx.save();
            ctx.strokeStyle = 'rgba(199, 125, 255, 0.35)';
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.stroke();
            ctx.restore();
            drawSinglePortal(pA, pB, false, 0);
            drawSinglePortal(pB, pA, false, 0);
          } else {
            const tr = item.spec.kind === 'chasm'
              ? { kind: 'chasm', x: 180, y: 132, x1: 62, y1: 148, x2: 298, y2: 116, r: 28, seed: 2.1 + terrainSeedOffset, pulse: now * 0.003 }
              : { kind: item.spec.kind, x: 180, y: 134, r: 76, seed: 1.7 + item.idx * 1.3 + terrainSeedOffset, pulse: now * 0.003 };
            ensureTerrainGeometry(tr);
            drawSingleTerrain(tr, true);
            if (showTerrainWireframe) {
              ctx.save();
              ctx.strokeStyle = '#ffd166';
              ctx.fillStyle = '#ff4d6d';
              ctx.lineWidth = 1.3;
              ctx.setLineDash([4, 3]);
              const poly = tr.kind === 'chasm' ? tr.outerCliff : tr.verts;
              if (poly && poly.length) {
                tracePolygon(poly);
                ctx.stroke();
                ctx.setLineDash([]);
                for (const v of poly) {
                  ctx.fillRect(v.x - 2.2, v.y - 2.2, 4.4, 4.4);
                }
              }
              ctx.restore();
            }
          }
        }
        ctx = prevCtx;
      }

      // Render Fullscreen Boss Entrance / Mythic Phase 2 Cutscene if active
      if (activeCutscene) {
        const dt = Math.min(0.05, (now - activeCutscene.lastTs) / 1000);
        activeCutscene.lastTs = now;
        activeCutscene.t -= dt;
        if (activeCutscene.t <= 0) {
          activeCutscene = null;
          cutsceneOverlay.classList.remove('show');
        } else {
          const vw = window.innerWidth, vh = window.innerHeight;
          if (cutsceneCanvas.width !== vw * dpr || cutsceneCanvas.height !== vh * dpr) {
            cutsceneCanvas.width = vw * dpr;
            cutsceneCanvas.height = vh * dpr;
          }
          const prevCtx = ctx;
          ctx = cutsceneCanvas.getContext('2d');
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, vw, vh);

          const bc = activeCutscene;
          const elapsed = bc.maxT - bc.t;
          const enterP = Math.min(1, elapsed / 0.18);
          const exitP = Math.min(1, Math.max(0, bc.t / 0.22));
          const alpha = enterP * exitP;
          const isMythic = bc.mode === 'mythic_phase2';
          const cy = vh * 0.5, bandH = 182, slant = 38;

          ctx.save();
          ctx.globalAlpha = 0.80 * alpha;
          ctx.fillStyle = isMythic ? '#16050d' : '#080512';
          ctx.fillRect(0, 0, vw, vh);

          const barH = Math.round(54 * enterP);
          ctx.globalAlpha = 0.96 * exitP;
          ctx.fillStyle = '#05030a';
          ctx.fillRect(0, 0, vw, barH);
          ctx.fillRect(0, vh - barH, vw, barH);
          ctx.fillStyle = bc.accent;
          ctx.fillRect(0, barH - 2, vw, 2);
          ctx.fillRect(0, vh - barH, vw, 2);

          ctx.globalAlpha = 0.95 * alpha;
          ctx.fillStyle = '#120b22';
          ctx.beginPath();
          ctx.moveTo(-20, cy - bandH * 0.5 + slant);
          ctx.lineTo(vw + 20, cy - bandH * 0.5 - slant);
          ctx.lineTo(vw + 20, cy + bandH * 0.5 - slant);
          ctx.lineTo(-20, cy + bandH * 0.5 + slant);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = bc.color;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          const slideOffset = (1 - enterP) * 56;
          const portX = Math.max(165, vw * 0.285) - slideOffset;
          const textX = portX + 138 + slideOffset * 1.3;
          const pSpec = (typeof BOSS_PORTRAIT_DATA !== 'undefined' && BOSS_PORTRAIT_DATA[bc.variant]) || null;
          drawBossPortrait(bc.variant, portX, cy - 2, 1.28, isMythic);

          ctx.textAlign = 'left';
          ctx.font = '800 16px -apple-system, sans-serif';
          ctx.fillStyle = bc.accent;
          const skinBadge = pSpec
            ? (isMythic
              ? ('【🔥隐藏换装 · ' + pSpec.personaName.split(' · ')[0] + '·' + (pSpec.mythicTitle || pSpec.summerTitle) + '】')
              : ('【' + pSpec.personaName.split(' · ')[0] + '·' + pSpec.summerTitle + '】'))
            : '';
          const fullSub = skinBadge ? (bc.subtitle + ' · ' + skinBadge) : bc.subtitle;
          ctx.fillText(fullSub, textX, cy - 32, Math.max(200, vw - textX - 40));

          ctx.font = '900 36px -apple-system, sans-serif';
          ctx.strokeStyle = '#090512';
          ctx.lineWidth = 6;
          ctx.strokeText(bc.title, textX, cy + 10, Math.max(200, vw - textX - 40));
          ctx.fillStyle = '#ffffff';
          ctx.fillText(bc.title, textX, cy + 10, Math.max(200, vw - textX - 40));

          ctx.font = '800 14px -apple-system, sans-serif';
          ctx.fillStyle = isMythic ? '#ffd166' : '#e0fbfc';
          ctx.fillText(bc.extraTag, textX, cy + 42, Math.max(200, vw - textX - 40));

          ctx.textAlign = 'center';
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '700 12.5px -apple-system, sans-serif';
          ctx.fillText('点击任意位置可立即关闭演出预览', vw * 0.5, vh - barH - 16);
          ctx.restore();
          ctx = prevCtx;
        }
      }

      requestAnimationFrame(tick);
    }

    // Boot all studio views
    buildOverviewHeroines();
    buildOverviewBosses();
    buildOverviewPotatoes();
    buildHeroineStudioControls();
    buildBossStudioControls();
    buildPotatoStudioControls();
    buildTerrainInspector();
    probeAndLoadHeroines();
    requestAnimationFrame(tick);
  </script>
</body>
</html>
`;
}

const outWorkspace = path.resolve(ROOT, '../brotato_portrait_dev_demo.html');
const outToolsDir = path.join(ROOT, 'tools');
const outToolsFile = path.join(outToolsDir, 'dev_portrait_showcase.html');

fs.mkdirSync(outToolsDir, { recursive: true });
const htmlWorkspace = buildHtml('./anime_character_art/');
const htmlTools = buildHtml('../../anime_character_art/');

fs.writeFileSync(outWorkspace, htmlWorkspace, 'utf8');
fs.writeFileSync(outToolsFile, htmlTools, 'utf8');

console.log(`Built developer portrait showcase -> ${outWorkspace} (${(htmlWorkspace.length / 1024).toFixed(1)} KB)`);
console.log(`Built developer portrait showcase -> ${outToolsFile} (${(htmlTools.length / 1024).toFixed(1)} KB)`);
