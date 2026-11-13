// 伪随机种子与《烬塔残响》四大层域高清战场底图预烘焙引擎（彻底移除旧土豆贴图与工业铆钉墙）
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
    // 严格按《烬塔残响》四幕十六层爬塔叙事递进：1~4层雨夜长桥，5~8层永冻冰窟，9~12层倒悬钟楼，13~16层日蚀镜界
    if (wNum <= 4) curScene = SCENES.find(s => s.id === 'foundry') || SCENES[0];
    else if (wNum <= 8) curScene = SCENES.find(s => s.id === 'glacier') || SCENES[1];
    else if (wNum <= 12) curScene = SCENES.find(s => s.id === 'wasteland') || SCENES[2];
    else if (wNum <= 16) curScene = SCENES.find(s => s.id === 'desert') || SCENES[3];
    else {
      const idx = Math.floor((wNum - 17) / 2) % SCENES.length;
      curScene = SCENES[idx] || SCENES[0];
    }
  }
  sceneSeed = (wNum * 7919 + curScene.id.charCodeAt(0) * 313 + (Date.now() & 0xffff)) >>> 0;
}

const floorCanvas = document.createElement('canvas');
const vigNormal = document.createElement('canvas');
const vigLowHp = document.createElement('canvas');

function buildVignettes() {
  [ [vigNormal, 'rgba(6, 9, 16, 0.46)'], [vigLowHp, 'rgba(159, 18, 57, 0.44)'] ].forEach(([c, edge]) => {
    c.width = 256; c.height = 256;
    const vg = c.getContext('2d');
    const gr = vg.createRadialGradient(128, 128, 62, 128, 128, 182);
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
  curFloorScale = (typeof uiMode !== 'undefined' && uiMode !== 'desktop') || isTouch ? 0.78 : 1.0;
  const fullW = WORLD.w + pad * 2, fullH = WORLD.h + pad * 2;
  const targetCW = Math.round(fullW * curFloorScale);
  const targetCH = Math.round(fullH * curFloorScale);
  if (floorCanvas.width !== targetCW) floorCanvas.width = targetCW;
  if (floorCanvas.height !== targetCH) floorCanvas.height = targetCH;

  // 与 viewport.js 中 wantKey 100% 严格对齐，彻底根除每次校验反复分配大画布重绘的性能陷阱
  bakedSceneKey = `${WORLD.w}x${WORLD.h}_${curFloorScale}_${sc.id}_${sceneSeed}`;

  const bgArt = (typeof getSpireArenaBgImage === 'function') ? getSpireArenaBgImage(sc.id) : null;
  const g = floorCanvas.getContext('2d', { alpha: false });
  g.setTransform(curFloorScale, 0, 0, curFloorScale, 0, 0);
  g.imageSmoothingEnabled = true;
  try { g.imageSmoothingQuality = 'high'; } catch (_) {}
  const rnd = mulberry32(sceneSeed);

  g.fillStyle = sc.voidBg;
  g.fillRect(0, 0, fullW, fullH);

  const ox = pad, oy = pad;
  if (bgArt) {
    // 完整铺展设定集高清俯视层域地图（保留鲜明层域色彩与建筑环景，仅加极轻柔暗调保障弹幕高对比度）
    g.save();
    g.imageSmoothingEnabled = true;
    g.globalAlpha = 0.90;
    g.drawImage(bgArt, ox, oy, WORLD.w, WORLD.h);
    g.globalAlpha = 0.14;
    g.fillStyle = sc.midCol;
    g.fillRect(ox, oy, WORLD.w, WORLD.h);
    g.restore();
  } else {
    const maxDim = Math.max(WORLD.w, WORLD.h);
    const grad = g.createRadialGradient(ox + WORLD.w / 2, oy + WORLD.h / 2, 90, ox + WORLD.w / 2, oy + WORLD.h / 2, maxDim * 0.74);
    grad.addColorStop(0, sc.centerCol);
    grad.addColorStop(0.64, sc.midCol);
    grad.addColorStop(1, sc.edgeCol);
    g.fillStyle = grad;
    g.fillRect(ox, oy, WORLD.w, WORLD.h);

    for (let i = 0; i < 36; i++) {
      const x = ox + 60 + rnd() * (WORLD.w - 120);
      const y = oy + 60 + rnd() * (WORLD.h - 120);
      const r = 28 + rnd() * 54;
      g.fillStyle = i % 2 === 0 ? sc.patchDark : sc.patchLight;
      g.beginPath();
      g.ellipse(x, y, r, r * 0.7, rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  }

  // 极淡哥特星轨地砖暗纹与中心日蚀罗盘环
  const cx = ox + WORLD.w / 2, cy = oy + WORLD.h / 2;
  g.strokeStyle = sc.gridCol;
  g.lineWidth = 1.3;
  g.beginPath();
  for (let x = ox; x <= ox + WORLD.w; x += 120) { g.moveTo(x, oy); g.lineTo(x, oy + WORLD.h); }
  for (let y = oy; y <= oy + WORLD.h; y += 120) { g.moveTo(ox, y); g.lineTo(ox + WORLD.w, y); }
  g.stroke();

  g.strokeStyle = 'rgba(229, 184, 105, 0.12)';
  g.lineWidth = 2.0;
  g.beginPath(); g.arc(cx, cy, 136, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, 28, 0, Math.PI * 2); g.stroke();

  // 哥特暗金双线结界边框 + 四角菱星铭纹（取代原版粗糙工业铁板铆钉）
  g.strokeStyle = 'rgba(4, 6, 12, 0.68)';
  g.lineWidth = 24;
  g.strokeRect(ox + 12, oy + 12, WORLD.w - 24, WORLD.h - 24);

  g.strokeStyle = sc.wallMain;
  g.lineWidth = 10;
  g.strokeRect(ox - 5, oy - 5, WORLD.w + 10, WORLD.h + 10);

  g.strokeStyle = sc.rivetCol;
  g.lineWidth = 2.2;
  g.strokeRect(ox + 2, oy + 2, WORLD.w - 4, WORLD.h - 4);
  g.strokeRect(ox - 11, oy - 11, WORLD.w + 22, WORLD.h + 22);

  const corners = [
    [ox + 6, oy + 6],
    [ox + WORLD.w - 6, oy + 6],
    [ox + 6, oy + WORLD.h - 6],
    [ox + WORLD.w - 6, oy + WORLD.h - 6]
  ];
  g.fillStyle = sc.rivetCol;
  for (let i = 0; i < corners.length; i++) {
    const [kx, ky] = corners[i];
    g.beginPath();
    g.moveTo(kx, ky - 11); g.lineTo(kx + 11, ky); g.lineTo(kx, ky + 11); g.lineTo(kx - 11, ky);
    g.closePath();
    g.fill();
  }
}
