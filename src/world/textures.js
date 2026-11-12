// 伪随机种子与离屏预烘焙贴图引擎（地面、暗角、3D 土豆材质）
function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSceneForWave(wNum) {
  if (selectedScene !== 'random') {
    curScene = SCENES.find(s => s.id === selectedScene) || SCENES[0];
  } else {
    const pool = wNum > 1 ? SCENES.filter(s => s.id !== curScene.id) : SCENES;
    curScene = pool[Math.floor(Math.random() * pool.length)];
  }
  sceneSeed = (wNum * 7919 + curScene.id.charCodeAt(0) * 313 + (Date.now() & 0xffff)) >>> 0;
}

// 离屏预渲染竞技场地面、暗角与 3D 立体土豆材质（支持缩放烘焙，显存占用降低 55%+ 杜绝手机闪退卡顿）
const floorCanvas = document.createElement('canvas');
const vigNormal = document.createElement('canvas');
const vigLowHp = document.createElement('canvas');
const potatoTex = { normal: document.createElement('canvas'), ghost: document.createElement('canvas'), hurt: document.createElement('canvas') };

function buildPotatoTextures() {
  const specs = [
    ['normal', ['#fae0b8', '#de9e5d', '#9e622b']],
    ['ghost',  ['#e8fdff', '#90c2db', '#3b597d']],
    ['hurt',   ['#ffffff', '#ffd6e0', '#ff758f']]
  ];
  for (const [key, stops] of specs) {
    const c = potatoTex[key];
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(24, 20, 4, 32, 34, 28);
    gr.addColorStop(0, stops[0]);
    gr.addColorStop(0.65, stops[1]);
    gr.addColorStop(1, stops[2]);
    g.fillStyle = gr;
    g.strokeStyle = '#26180d';
    g.lineWidth = 3.2;
    g.beginPath();
    g.ellipse(32, 32, 21, 24, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    if (key === 'normal') {
      g.fillStyle = 'rgba(105, 62, 24, 0.36)';
      g.beginPath();
      g.arc(21, 40, 2.2, 0, Math.PI * 2);
      g.arc(43, 42, 1.9, 0, Math.PI * 2);
      g.arc(23, 18, 1.7, 0, Math.PI * 2);
      g.fill();
    }
  }
}
buildPotatoTextures();

function buildVignettes() {
  [ [vigNormal, 'rgba(8, 6, 12, 0.50)'], [vigLowHp, 'rgba(165, 12, 38, 0.46)'] ].forEach(([c, edge]) => {
    c.width = 256; c.height = 256;
    const vg = c.getContext('2d');
    const gr = vg.createRadialGradient(128, 128, 52, 128, 128, 180);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, edge);
    vg.fillStyle = gr;
    vg.fillRect(0, 0, 256, 256);
  });
}
buildVignettes();

function buildFloorTexture() {
  const sc = curScene || SCENES[0];
  const pad = FLOOR_PAD;
  curFloorScale = (typeof uiMode !== 'undefined' && uiMode !== 'desktop') || isTouch ? 0.65 : 0.80;
  const fullW = WORLD.w + pad * 2, fullH = WORLD.h + pad * 2;
  floorCanvas.width = Math.round(fullW * curFloorScale);
  floorCanvas.height = Math.round(fullH * curFloorScale);
  bakedSceneKey = `${WORLD.w}x${WORLD.h}_${curFloorScale}_${sc.id}_${sceneSeed}`;

  const g = floorCanvas.getContext('2d');
  g.setTransform(curFloorScale, 0, 0, curFloorScale, 0, 0);
  const rnd = mulberry32(sceneSeed);

  g.fillStyle = sc.voidBg;
  g.fillRect(0, 0, fullW, fullH);

  const ox = pad, oy = pad;
  const maxDim = Math.max(WORLD.w, WORLD.h);
  const grad = g.createRadialGradient(ox + WORLD.w / 2, oy + WORLD.h / 2, 90, ox + WORLD.w / 2, oy + WORLD.h / 2, maxDim * 0.74);
  grad.addColorStop(0, sc.centerCol);
  grad.addColorStop(0.64, sc.midCol);
  grad.addColorStop(1, sc.edgeCol);
  g.fillStyle = grad;
  g.fillRect(ox, oy, WORLD.w, WORLD.h);

  const areaScale = Math.max(1, (WORLD.w * WORLD.h) / (1600 * 1100));
  const patchCnt = Math.round(105 * areaScale);
  for (let i = 0; i < patchCnt; i++) {
    const x = ox + 45 + rnd() * (WORLD.w - 90);
    const y = oy + 45 + rnd() * (WORLD.h - 90);
    const r = 20 + rnd() * 58;
    g.fillStyle = i % 2 === 0 ? sc.patchDark : sc.patchLight;
    g.beginPath();
    g.ellipse(x, y, r, r * (0.52 + rnd() * 0.42), rnd() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }

  // 战术坐标网格（熔炉甲板更清晰，自然荒原更克制）
  const step = sc.id === 'foundry' ? 96 : 90;
  g.strokeStyle = sc.gridCol;
  g.lineWidth = sc.id === 'foundry' ? 2 : 1.5;
  g.beginPath();
  for (let x = ox; x <= ox + WORLD.w; x += step) { g.moveTo(x, oy); g.lineTo(x, oy + WORLD.h); }
  for (let y = oy; y <= oy + WORLD.h; y += step) { g.moveTo(ox, y); g.lineTo(ox + WORLD.w, y); }
  g.stroke();

  // 5 大主题生态专属地貌景观绘制
  const featCnt = Math.round(28 * areaScale);
  for (let i = 0; i < featCnt; i++) {
    const fx = ox + 75 + rnd() * (WORLD.w - 150);
    const fy = oy + 75 + rnd() * (WORLD.h - 150);
    if (sc.id === 'wasteland') {
      if (i % 3 === 0) {
        // 紫晶矿簇
        g.fillStyle = sc.accent1; g.strokeStyle = '#1b1026'; g.lineWidth = 1.8;
        for (let k = -1; k <= 1; k++) {
          const ang = -Math.PI / 2 + k * 0.42 + (rnd() - 0.5) * 0.2;
          const len = 12 + rnd() * 10;
          g.beginPath();
          g.moveTo(fx + k * 4 - 3, fy + 3);
          g.lineTo(fx + k * 4 + Math.cos(ang) * len, fy + Math.sin(ang) * len);
          g.lineTo(fx + k * 4 + 3, fy + 3);
          g.closePath(); g.fill(); g.stroke();
        }
      } else {
        // 环形小陨坑
        const cr = 14 + rnd() * 18;
        g.strokeStyle = 'rgba(18,13,26,0.45)'; g.lineWidth = 3;
        g.beginPath(); g.ellipse(fx, fy, cr, cr * 0.68, 0, 0, Math.PI * 2); g.stroke();
      }
    } else if (sc.id === 'desert') {
      if (i % 3 === 0) {
        // 荒漠仙人掌球与白骨残骸
        if (i % 6 === 0) {
          g.strokeStyle = 'rgba(243, 229, 171, 0.42)'; g.lineWidth = 3.2;
          g.beginPath();
          for (let b = -2; b <= 2; b++) {
            g.moveTo(fx + b * 6, fy - 7); g.quadraticCurveTo(fx + b * 6 + 3, fy, fx + b * 6, fy + 7);
          }
          g.stroke();
        } else {
          g.fillStyle = '#3a6b4c'; g.strokeStyle = '#1b2e22'; g.lineWidth = 2;
          g.beginPath(); g.arc(fx, fy, 9 + rnd() * 4, 0, Math.PI * 2); g.fill(); g.stroke();
          g.fillStyle = '#ffd166'; g.beginPath(); g.arc(fx, fy - 2, 2.5, 0, Math.PI * 2); g.fill();
        }
      } else {
        // 风蚀沙丘弧线
        g.strokeStyle = 'rgba(255, 224, 178, 0.09)'; g.lineWidth = 2.5;
        g.beginPath(); g.arc(fx, fy, 28 + rnd() * 24, 0.2, Math.PI - 0.2); g.stroke();
      }
    } else if (sc.id === 'glacier') {
      if (i % 3 === 0) {
        // 六棱透亮冰晶簇
        g.fillStyle = 'rgba(144, 224, 239, 0.42)'; g.strokeStyle = 'rgba(224, 251, 252, 0.65)'; g.lineWidth = 1.6;
        const ir = 9 + rnd() * 7;
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          const px = fx + Math.cos(a) * ir, py = fy + Math.sin(a) * ir * 0.85;
          k === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
        }
        g.closePath(); g.fill(); g.stroke();
      } else {
        // 冰面折射裂纹
        g.strokeStyle = 'rgba(186, 230, 253, 0.22)'; g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(fx - 18, fy - 6); g.lineTo(fx, fy); g.lineTo(fx + 16, fy + 9);
        g.moveTo(fx, fy); g.lineTo(fx + 8, fy - 14);
        g.stroke();
      }
    } else if (sc.id === 'foundry') {
      if (i % 3 === 0) {
        // 工业熔岩散热格栅窗
        const gw = 34, gh = 20;
        g.fillStyle = 'rgba(249, 115, 22, 0.22)';
        g.fillRect(fx - gw / 2, fy - gh / 2, gw, gh);
        g.strokeStyle = '#18181f'; g.lineWidth = 2.4;
        g.strokeRect(fx - gw / 2, fy - gh / 2, gw, gh);
        for (let sx = -10; sx <= 10; sx += 10) {
          g.beginPath(); g.moveTo(fx + sx, fy - gh / 2); g.lineTo(fx + sx, fy + gh / 2); g.stroke();
        }
      } else {
        // 装甲板四角铆钉印
        g.fillStyle = 'rgba(255,255,255,0.10)';
        g.fillRect(fx - 16, fy - 16, 3, 3); g.fillRect(fx + 13, fy - 16, 3, 3);
        g.fillRect(fx - 16, fy + 13, 3, 3); g.fillRect(fx + 13, fy + 13, 3, 3);
      }
    } else if (sc.id === 'fungal') {
      if (i % 3 === 0) {
        // 荧光伞菌群落
        const cols = ['#52b788', '#72efdd', '#c77dff'];
        for (let m = 0; m < 3; m++) {
          const mx = fx + (m - 1) * 8, my = fy + (m % 2) * 5;
          g.fillStyle = 'rgba(114, 239, 221, 0.14)';
          g.beginPath(); g.arc(mx, my, 10, 0, Math.PI * 2); g.fill();
          g.fillStyle = cols[(i + m) % 3]; g.strokeStyle = '#0c1c15'; g.lineWidth = 1.6;
          g.beginPath(); g.arc(mx, my, 5.2, 0, Math.PI * 2); g.fill(); g.stroke();
        }
      } else {
        // 盘根暗藤与孢子环
        g.strokeStyle = 'rgba(82, 183, 136, 0.22)'; g.lineWidth = 2;
        g.beginPath(); g.arc(fx, fy, 16 + rnd() * 14, 0, Math.PI * 2); g.stroke();
      }
    }
  }

  // 散落细碎砾石与植被细节
  const pebbleCnt = Math.round(145 * areaScale);
  for (let i = 0; i < pebbleCnt; i++) {
    const x = ox + 24 + rnd() * (WORLD.w - 48);
    const y = oy + 24 + rnd() * (WORLD.h - 48);
    g.fillStyle = i % 3 === 0 ? sc.pebble1 : sc.pebble2;
    g.beginPath();
    g.ellipse(x, y, 2 + rnd() * 4.2, 1.5 + rnd() * 2.8, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }

  // 场地中央微弱战术阵环地标（帮助玩家在大地图中感知中心方位）
  const cx = ox + WORLD.w / 2, cy = oy + WORLD.h / 2;
  g.strokeStyle = sc.gridCol;
  g.lineWidth = 3;
  g.beginPath(); g.arc(cx, cy, 110, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, 18, 0, Math.PI * 2); g.stroke();

  // 竞技场厚重立体边界围墙与铆钉
  g.strokeStyle = 'rgba(0,0,0,0.46)';
  g.lineWidth = 26;
  g.strokeRect(ox + 13, oy + 13, WORLD.w - 26, WORLD.h - 26);

  g.strokeStyle = sc.wallMain;
  g.lineWidth = 15;
  g.strokeRect(ox - 7.5, oy - 7.5, WORLD.w + 15, WORLD.h + 15);
  g.strokeStyle = sc.wallDark;
  g.lineWidth = 3;
  g.strokeRect(ox, oy, WORLD.w, WORLD.h);
  g.strokeRect(ox - 15, oy - 15, WORLD.w + 30, WORLD.h + 30);

  g.fillStyle = sc.rivetCol;
  g.beginPath();
  for (let x = ox; x <= ox + WORLD.w; x += 68) {
    g.moveTo(x + 2.6, oy - 7.5); g.arc(x, oy - 7.5, 2.6, 0, Math.PI * 2);
    g.moveTo(x + 2.6, oy + WORLD.h + 7.5); g.arc(x, oy + WORLD.h + 7.5, 2.6, 0, Math.PI * 2);
  }
  for (let y = oy; y <= oy + WORLD.h; y += 68) {
    g.moveTo(ox - 4.9, y); g.arc(ox - 7.5, y, 2.6, 0, Math.PI * 2);
    g.moveTo(ox + WORLD.w + 10.1, y); g.arc(ox + WORLD.w + 7.5, y, 2.6, 0, Math.PI * 2);
  }
  g.fill();
}
