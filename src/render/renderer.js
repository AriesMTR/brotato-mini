// 绘制单个异形地形（彻底告别规则圆形，支持主战场与开发者预览共用，0渐变0滤镜）
function tracePolygon(verts) {
  if (!verts || !verts.length) return;
  ctx.beginPath();
  for (let k = 0; k < verts.length; k++) {
    if (k === 0) ctx.moveTo(verts[k].x, verts[k].y);
    else ctx.lineTo(verts[k].x, verts[k].y);
  }
  ctx.closePath();
}

function traceSmoothLoop(verts, cx, cy, scale) {
  if (!verts || verts.length < 3) return;
  const n = verts.length;
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const p0 = verts[k];
    const p1 = verts[(k + 1) % n];
    const x0 = cx + (p0.x - cx) * scale, y0 = cy + (p0.y - cy) * scale;
    const x1 = cx + (p1.x - cx) * scale, y1 = cy + (p1.y - cy) * scale;
    const mx = (x0 + x1) * 0.5, my = (y0 + y1) * 0.5;
    if (k === 0) {
      const prev = verts[(n - 1)];
      const px = cx + (prev.x - cx) * scale, py = cy + (prev.y - cy) * scale;
      ctx.moveTo((px + x0) * 0.5, (py + y0) * 0.5);
    }
    ctx.quadraticCurveTo(x0, y0, mx, my);
  }
  ctx.closePath();
}

function drawSingleTerrain(tr, showLabel = false) {
  if (!tr) return;
  if (typeof ensureTerrainGeometry === 'function') ensureTerrainGeometry(tr);
  ctx.save();
  if (tr.kind === 'chasm') {
    // 锯齿折线断层大裂谷：三层断崖阶地 + 地壳横裂纹 + 紫晶虚空深渊微光（彻底告别胶囊圆肠形）
    if (tr.outerCliff && tr.outerCliff.length >= 6) {
      ctx.fillStyle = '#4a3859';
      tracePolygon(tr.outerCliff);
      ctx.fill();
      ctx.strokeStyle = '#23182e';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.fillStyle = '#22172f';
      tracePolygon(tr.midCliff);
      ctx.fill();

      ctx.fillStyle = '#07040d';
      tracePolygon(tr.abyssPoly);
      ctx.fill();

      if (tr.cracks) {
        ctx.strokeStyle = '#322442';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let c = 0; c < tr.cracks.length; c++) {
          const ck = tr.cracks[c];
          ctx.moveTo(ck.x1, ck.y1); ctx.lineTo(ck.mx, ck.my); ctx.lineTo(ck.x2, ck.y2);
        }
        ctx.stroke();
      }
      if (tr.spine && tr.spine.length >= 2) {
        ctx.strokeStyle = 'rgba(199, 125, 255, 0.48)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        for (let s = 0; s < tr.spine.length; s++) {
          if (s === 0) ctx.moveTo(tr.spine[s].x, tr.spine[s].y);
          else ctx.lineTo(tr.spine[s].x, tr.spine[s].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  } else if (tr.kind === 'lava') {
    // 多瓣裂地玄武熔岩火口：不规则焦黑玄武岩岸 + 三层律动熔流瓣 + 浮游黑曜石块
    const pls = Math.sin(tr.pulse || 0) * 0.035;
    const verts = tr.verts || [];
    ctx.fillStyle = '#240f0e';
    ctx.strokeStyle = '#120707';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k < verts.length; k++) {
      const vx = tr.x + (verts[k].x - tr.x) * 1.10;
      const vy = tr.y + (verts[k].y - tr.y) * 1.10;
      if (k === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#dc2626';
    tracePolygon(verts);
    ctx.fill();

    ctx.fillStyle = '#f97316';
    traceSmoothLoop(verts, tr.x, tr.y, 0.76 + pls);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    traceSmoothLoop(verts, tr.x + 5, tr.y - 3, 0.42 - pls);
    ctx.fill();

    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2;
    tracePolygon(verts);
    ctx.stroke();

    // 熔面漂浮焦黑玄武岩碎岛（多边形，零圆形）
    if (tr.crusts) {
      ctx.fillStyle = '#2b1410';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.4;
      for (let c = 0; c < tr.crusts.length; c++) {
        const cr = tr.crusts[c], sz = cr.sz;
        ctx.save();
        ctx.translate(cr.x + Math.sin((tr.pulse || 0) * 0.6 + c) * 2, cr.y);
        ctx.rotate(cr.rot);
        ctx.beginPath();
        ctx.moveTo(-sz, -sz * 0.5); ctx.lineTo(sz * 0.3, -sz * 0.85); ctx.lineTo(sz * 1.1, sz * 0.1);
        ctx.lineTo(sz * 0.2, sz * 0.75); ctx.lineTo(-sz * 0.85, sz * 0.45);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
  } else if (tr.kind === 'swamp') {
    // 曲岸阿米巴剧毒菌沼：平滑有机曲岸 + 离岸泥滩子池 + 岸边荧光毒蕈簇
    const verts = tr.verts || [];
    if (tr.shoals) {
      ctx.fillStyle = '#163528';
      for (let s = 0; s < tr.shoals.length; s++) {
        const sh = tr.shoals[s];
        ctx.save();
        ctx.translate(sh.x, sh.y); ctx.rotate(sh.rot);
        ctx.beginPath();
        ctx.moveTo(-sh.rx, 0); ctx.quadraticCurveTo(-sh.rx * 0.3, -sh.ry, sh.rx, -sh.ry * 0.2);
        ctx.quadraticCurveTo(sh.rx * 0.4, sh.ry, -sh.rx, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = '#12261e';
    traceSmoothLoop(verts, tr.x, tr.y, 1.07);
    ctx.fill();

    ctx.fillStyle = '#1e4635';
    traceSmoothLoop(verts, tr.x, tr.y, 0.99);
    ctx.fill();

    ctx.fillStyle = 'rgba(132, 204, 22, 0.34)';
    traceSmoothLoop(verts, tr.x - 4, tr.y + 3, 0.68 + Math.sin(tr.pulse || 0) * 0.03);
    ctx.fill();

    ctx.strokeStyle = 'rgba(163, 230, 53, 0.72)';
    ctx.lineWidth = 2.2;
    traceSmoothLoop(verts, tr.x, tr.y, 0.98);
    ctx.stroke();

    // 岸畔荧光小毒菇点缀
    if (verts.length >= 9) {
      for (let m = 0; m < 3; m++) {
        const vp = verts[m * 5];
        if (!vp) continue;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(vp.x - 1.5, vp.y - 2, 3, 5);
        ctx.fillStyle = m % 2 === 0 ? '#a3e635' : '#c77dff';
        ctx.beginPath();
        ctx.moveTo(vp.x - 6, vp.y - 2); ctx.quadraticCurveTo(vp.x, vp.y - 9, vp.x + 6, vp.y - 2);
        ctx.closePath(); ctx.fill();
      }
    }
  } else if (tr.kind === 'ice_sheet') {
    // 多棱碎晶寒霜冰镜：折角多面体冰湖 + 内部冰裂折纹 + 平行四边形镜面高光带
    const verts = tr.verts || [];
    ctx.fillStyle = 'rgba(114, 239, 221, 0.24)';
    tracePolygon(verts);
    ctx.fill();

    ctx.fillStyle = 'rgba(224, 242, 254, 0.20)';
    ctx.beginPath();
    for (let k = 0; k < verts.length; k++) {
      const vx = tr.x + (verts[k].x - tr.x) * 0.72 - 6;
      const vy = tr.y + (verts[k].y - tr.y) * 0.72 - 5;
      if (k === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
    }
    ctx.closePath(); ctx.fill();

    // 冰层内部折线冰脉与镜面反光带
    const ir = tr.r || 84;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.moveTo(tr.x - ir * 0.45, tr.y - ir * 0.12);
    ctx.lineTo(tr.x - ir * 0.05, tr.y - ir * 0.52);
    ctx.lineTo(tr.x + ir * 0.12, tr.y - ir * 0.44);
    ctx.lineTo(tr.x - ir * 0.28, tr.y - ir * 0.04);
    ctx.closePath(); ctx.fill();

    if (verts.length >= 12) {
      ctx.strokeStyle = 'rgba(224, 251, 252, 0.46)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(verts[1].x, verts[1].y); ctx.lineTo(tr.x - 8, tr.y + 4); ctx.lineTo(verts[9].x, verts[9].y);
      ctx.moveTo(tr.x - 8, tr.y + 4); ctx.lineTo(verts[5].x, verts[5].y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.88)';
    ctx.lineWidth = 2.6;
    tracePolygon(verts);
    ctx.stroke();
  }

  if (showLabel) {
    const tLabel = tr.kind === 'lava' ? '🌋 熔岩火口 (灼烧)' : (tr.kind === 'swamp' ? '🧪 剧毒菌沼 (减速)' : (tr.kind === 'ice_sheet' ? '🧊 寒霜冰镜 (加速)' : '🕳️ 断层裂谷 (阻挡)'));
    const ly = tr.kind === 'chasm' ? tr.y - 4 : tr.y - (tr.r || 68) + 14;
    ctx.font = '800 11.5px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(14, 10, 24, 0.76)';
    ctx.beginPath(); ctx.roundRect(tr.x - 58, ly - 11, 116, 16, 6); ctx.fill();
    ctx.fillStyle = '#f1ecff';
    ctx.fillText(tLabel, tr.x, ly + 1);
  }
  ctx.restore();
}

// 绘制单个菱晶次元裂隙传送门（星芒裂口 + 环绕浮游棱晶碎片，无规则圆环）
function drawSinglePortal(p, partner, cooling, cdRemain) {
  const pr = Math.max(18, p.r || 36);
  ctx.save();
  ctx.translate(p.x, p.y);

  // 底层交叉次元裂隙星芒
  ctx.save();
  ctx.rotate((p.pulse || 0) * (cooling ? 0.18 : 0.55));
  ctx.globalAlpha = cooling ? 0.34 : 0.88;
  ctx.fillStyle = '#130924';
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const rad = k % 2 === 0 ? pr * 1.18 : pr * 0.54;
    if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();

  // 内层旋转菱晶核心
  ctx.save();
  ctx.rotate(-(p.pulse || 0) * 0.8);
  ctx.globalAlpha = cooling ? 0.25 : 0.72;
  ctx.fillStyle = p.color;
  const inR = pr * (0.64 + Math.sin(p.pulse || 0) * 0.07);
  ctx.beginPath();
  ctx.moveTo(0, -inR * 1.15); ctx.lineTo(inR * 0.82, 0); ctx.lineTo(0, inR * 1.15); ctx.lineTo(-inR * 0.82, 0);
  ctx.closePath(); ctx.fill();
  if (!cooling) {
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -pr * 0.34); ctx.lineTo(pr * 0.24, 0); ctx.lineTo(0, pr * 0.34); ctx.lineTo(-pr * 0.24, 0);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // 外围环绕浮游棱晶残片
  const shards = Array.isArray(p.shards) ? p.shards.length : (p.shards || 5);
  ctx.globalAlpha = cooling ? 0.32 : 0.92;
  ctx.fillStyle = p.color;
  ctx.strokeStyle = '#140c24';
  ctx.lineWidth = 1.5;
  for (let s = 0; s < shards; s++) {
    const sa = (s / shards) * Math.PI * 2 + (p.pulse || 0) * 0.45;
    const sx = Math.cos(sa) * (pr + 7), sy = Math.sin(sa) * (pr + 7);
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(sa);
    ctx.beginPath();
    ctx.moveTo(6, 0); ctx.lineTo(0, -3.5); ctx.lineTo(-5, 0); ctx.lineTo(0, 3.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  if (partner) {
    const linkA = Math.atan2(partner.y - p.y, partner.x - p.x);
    ctx.save();
    ctx.rotate(linkA);
    ctx.globalAlpha = cooling ? 0.35 : 0.92;
    ctx.fillStyle = partner.color || '#ffd166';
    ctx.beginPath(); ctx.moveTo(pr + 16, 0); ctx.lineTo(pr + 7, -5.5); ctx.lineTo(pr + 7, 5.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.font = '800 12px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const pTxt = cooling ? `⏳ 充能 ${(cdRemain || 0).toFixed(1)}s` : `🌀 晶裂门 ${p.label}`;
  ctx.fillStyle = 'rgba(14, 10, 24, 0.80)';
  ctx.beginPath(); ctx.roundRect(-50, -pr - 26, 100, 17, 6); ctx.fill();
  ctx.fillStyle = cooling ? '#cbd5e1' : '#f8f5ff';
  ctx.fillText(pTxt, 0, -pr - 13);
  ctx.restore();
}

// 战场主相机裁剪渲染、首领预警提示、悬浮摇杆绘制与 RAF 主循环
function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = (curScene && curScene.voidBg) || '#110e17';
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  ctx.translate(viewW / 2 + sx, viewH / 2 + sy);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-cam.x, -cam.y);

  const halfW = (viewW / camZoom) * 0.5;
  const halfH = (viewH / camZoom) * 0.5;
  const vL = cam.x - halfW - 64, vR = cam.x + halfW + 64;
  const vT = cam.y - halfH - 64, vB = cam.y + halfH + 64;

  // 按缩放比例整数安全裁剪拷贝当前镜头可见区域的地面贴图（严格防受击震屏时浮点越界）
  const wx0 = Math.max(-FLOOR_PAD, Math.floor(cam.x - halfW - 16));
  const wy0 = Math.max(-FLOOR_PAD, Math.floor(cam.y - halfH - 16));
  const wx1 = Math.min(WORLD.w + FLOOR_PAD, Math.ceil(cam.x + halfW + 16));
  const wy1 = Math.min(WORLD.h + FLOOR_PAD, Math.ceil(cam.y + halfH + 16));
  if (wx1 > wx0 && wy1 > wy0 && floorCanvas.width > 2 && floorCanvas.height > 2) {
    const sc = curFloorScale || 0.8;
    const sx0 = Math.max(0, Math.min(floorCanvas.width - 1, Math.floor((wx0 + FLOOR_PAD) * sc)));
    const sy0 = Math.max(0, Math.min(floorCanvas.height - 1, Math.floor((wy0 + FLOOR_PAD) * sc)));
    const sw = Math.max(0, Math.min(floorCanvas.width - sx0, Math.floor((wx1 - wx0) * sc)));
    const sh = Math.max(0, Math.min(floorCanvas.height - sy0, Math.floor((wy1 - wy0) * sc)));
    if (sw > 0 && sh > 0) {
      ctx.drawImage(floorCanvas, sx0, sy0, sw, sh, wx0, wy0, wx1 - wx0, wy1 - wy0);
    }
  }

  if (state !== 'menu') {
    for (let i = 0; i < stains.length; i++) {
      const st = stains[i];
      if (st.x < vL || st.x > vR || st.y < vT || st.y > vB) continue;
      ctx.globalAlpha = st.kind === 'scorch' ? 0.34 : 0.22;
      ctx.fillStyle = st.color;
      ctx.beginPath(); ctx.arc(st.x, st.y, Math.max(1, st.r), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < shells.length; i++) {
      const s = shells[i];
      if (s.x < vL || s.x > vR || s.y < vT || s.y > vB) continue;
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
      ctx.fillStyle = '#f4a261'; ctx.fillRect(-3, -1.5, 6, 3);
      ctx.restore();
    }

    // 一图一异形生态地形渲染（熔岩火口、剧毒菌沼、寒霜冰镜、断层裂谷，纯矢量异形零圆形）
    for (let i = 0; i < terrains.length; i++) {
      const tr = terrains[i];
      const pad = (tr.halfLen || 0) + (tr.r || 68) + 38;
      if (tr.x + pad < vL || tr.x - pad > vR || tr.y + pad < vT || tr.y - pad > vB) continue;
      const showLbl = !!(player && Math.hypot(player.x - tr.x, player.y - tr.y) < (tr.halfLen || tr.r || 68) + 175);
      drawSingleTerrain(tr, showLbl);
    }

    // 双生菱晶裂隙传送门 A ↔ B 渲染
    for (let i = 0; i < portals.length; i++) {
      const p = portals[i];
      const pr = Math.max(18, p.r || 36);
      if (p.x + pr + 42 < vL || p.x - pr - 42 > vR || p.y + pr + 42 < vT || p.y - pr - 42 > vB) continue;
      const partner = portals[i === 0 ? 1 : 0];
      drawSinglePortal(p, partner, portalPairCd > 0, portalPairCd);
    }

    // 工程流感应地雷渲染（八角装甲雷体 + 脉冲索敌感应线 + 呼吸指示灯）
    if (typeof mines !== 'undefined' && mines.length > 0) {
      for (let i = 0; i < mines.length; i++) {
        const m = mines[i];
        if (m.x + 60 < vL || m.x - 60 > vR || m.y + 60 < vT || m.y - 60 > vB) continue;
        ctx.save();
        ctx.translate(m.x, m.y);
        if (m.armT <= 0) {
          ctx.strokeStyle = 'rgba(76, 201, 240, 0.26)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([7, 6]);
          ctx.beginPath(); ctx.arc(0, 0, m.triggerR || 54, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4 + Math.PI / 8;
          if (k === 0) ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11);
          else ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        const blink = Math.sin(m.pulse || 0) > 0;
        ctx.fillStyle = m.armT > 0 ? '#94a3b8' : (blink ? '#ff2a55' : '#4cc9f0');
        ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    // 幽光菌林专属异象：治愈孢子灵泉区域渲染
    for (let i = 0; i < sporeZones.length; i++) {
      const sz = sporeZones[i];
      const sr = Math.max(12, sz.r || 86);
      if (sz.x + sr + 16 < vL || sz.x - sr - 16 > vR || sz.y + sr + 16 < vT || sz.y - sr - 16 > vB) continue;
      const fade = Math.min(1, Math.max(0.15, sz.t / 1.2));
      ctx.save();
      ctx.globalAlpha = 0.16 * fade;
      ctx.fillStyle = '#5ef29b';
      ctx.beginPath(); ctx.arc(sz.x, sz.y, sr, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.68 * fade;
      ctx.strokeStyle = '#5ef29b';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.arc(sz.x, sz.y, sr, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#c77dff';
      for (let k = 0; k < 4; k++) {
        const sa = (sz.pulse || 0) * 0.7 + (k * Math.PI) / 2;
        ctx.beginPath(); ctx.arc(sz.x + Math.cos(sa) * (sr * 0.55), sz.y + Math.sin(sa) * (sr * 0.55), 3.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // 稀有地图奇遇召唤圣物（旋转秘法阵 + 圣物图腾 + 站立读条进度环）
    for (let i = 0; i < relics.length; i++) {
      const rel = relics[i];
      const rr = Math.max(20, rel.r || 44);
      const col = (rel.def && rel.def.color) || '#ffd166';
      const prog = Math.max(0, Math.min(1, (rel.charge || 0) / Math.max(0.1, rel.need || 1.1)));
      ctx.save();
      ctx.translate(rel.x, rel.y);
      ctx.globalAlpha = 0.18 + Math.sin(rel.pulse) * 0.05;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.4;
      ctx.save();
      ctx.rotate(rel.pulse * 0.35);
      ctx.setLineDash([10, 7]);
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      if (prog > 0.01) {
        ctx.strokeStyle = '#ffe8a3';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(0, 0, rr + 5, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
      }
      const bobY = Math.sin(rel.pulse * 1.5) * 4;
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#1b1429';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, -18 + bobY); ctx.lineTo(16, bobY); ctx.lineTo(0, 18 + bobY); ctx.lineTo(-16, bobY);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.font = '20px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((rel.def && rel.def.icon) || '✨', 0, bobY + 1);
      ctx.textBaseline = 'alphabetic';
      ctx.font = '800 13px -apple-system, sans-serif';
      ctx.fillStyle = '#120d18';
      const lbl = prog > 0.03 ? `⚡ 召唤共鸣 ${Math.round(prog * 100)}%` : `✨ ${rel.def ? rel.def.name : '奇遇圣物'} (站入召唤Boss)`;
      ctx.fillText(lbl, 1.5, -rr - 10 + 1.5);
      ctx.fillStyle = prog > 0.03 ? '#ffd166' : '#f8f5ff';
      ctx.fillText(lbl, 0, -rr - 10);
      ctx.restore();
    }

    // 地面高危红圈 / 首领外环风暴（内圈贴身安全风眼） / 元素轰炸预警
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      const hr = Math.max(4, h.r || 40);
      if (h.x + hr + 12 < vL || h.x - hr - 12 > vR || h.y + hr + 12 < vT || h.y - hr - 12 > vB) continue;
      const p = Math.max(0, Math.min(1, 1 - (h.t || 0) / Math.max(0.01, h.maxT || 1)));
      const hCol = h.color || '#ff3b6b';
      if (h.innerSafeR && h.innerSafeR > 8 && hr > h.innerSafeR + 6) {
        const inR = h.innerSafeR;
        const curOuter = inR + (hr - inR) * p;
        const bandW = Math.max(1.5, curOuter - inR);
        ctx.save();
        ctx.globalAlpha = 0.16 + p * 0.26;
        ctx.strokeStyle = hCol;
        ctx.lineWidth = bandW;
        ctx.beginPath(); ctx.arc(h.x, h.y, inR + bandW * 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.88;
        ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(h.x, h.y, hr, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#72efdd';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.arc(h.x, h.y, inR, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '800 12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#72efdd';
        ctx.fillText('✨内圈风眼安全', h.x, h.y + inR - 10);
        ctx.restore();
      } else {
        ctx.globalAlpha = 0.12 + p * 0.22;
        ctx.fillStyle = hCol;
        ctx.beginPath(); ctx.arc(h.x, h.y, Math.max(0.5, hr * p), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.82;
        ctx.strokeStyle = hCol;
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(h.x, h.y, hr, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.hp <= 0) continue;
      if (e.type === 'bomber' && e.primed) {
        const br = Math.max(12, e.blastR || 86);
        const p = Math.max(0, Math.min(1, 1 - e.fuseT / Math.max(0.05, e.maxFuseT || 1.25)));
        ctx.fillStyle = `rgba(255, 190, 11, ${0.12 + p * 0.24})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(0.5, br * p), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 77, 109, 0.88)';
        ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(e.x, e.y, br, 0, Math.PI * 2); ctx.stroke();
      } else if (e.aimA !== undefined) {
        // 晶刺狙击虫蓄力细红瞄准线（清晰利落不刺眼）
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 42, 85, 0.72)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.aimA) * 390, e.y + Math.sin(e.aimA) * 390);
        ctx.stroke();
        ctx.restore();
      } else if (e.lockedAim !== undefined && !e.dashing) {
        // 冲锋怪/统领/首领蓄力锁定预警走廊 + 蓄力推进条 + 精准落点箭头（预警多长就实打实冲多远！）
        const warnLen = Math.max(48, e.dashWarnLen || 255);
        const ca = Math.cos(e.lockedAim), sa = Math.sin(e.lockedAim);
        const endX = e.x + ca * warnLen, endY = e.y + sa * warnLen;
        const wMax = Math.max(0.1, e.dashWindupMax || 0.55);
        const prog = Math.max(0, Math.min(1, 1 - Math.max(0, e.dashT || 0) / wMax));
        const isIceDash = e.dashWarnColor === '#72efdd';
        const bandW = Math.max(14, e.r * 1.12);
        ctx.save();
        ctx.lineCap = 'round';
        // 1) 全长危险走廊底带
        ctx.strokeStyle = isIceDash ? `rgba(76, 201, 240, ${0.13 + prog * 0.12})` : `rgba(255, 77, 109, ${0.13 + prog * 0.14})`;
        ctx.lineWidth = bandW;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        // 2) 随蓄力填满的压迫感推进条
        if (prog > 0.03) {
          ctx.strokeStyle = isIceDash ? 'rgba(114, 239, 221, 0.34)' : 'rgba(255, 159, 28, 0.36)';
          ctx.lineWidth = Math.max(8, bandW * 0.62);
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + ca * warnLen * prog, e.y + sa * warnLen * prog);
          ctx.stroke();
        }
        // 3) 中轴锁定虚线
        ctx.strokeStyle = isIceDash ? 'rgba(114, 239, 221, 0.90)' : 'rgba(255, 190, 11, 0.90)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        // 4) 终点落点准星环与锐利箭头
        ctx.setLineDash([]);
        ctx.strokeStyle = isIceDash ? 'rgba(114, 239, 221, 0.95)' : 'rgba(255, 77, 109, 0.95)';
        ctx.lineWidth = 2.4;
        const tipR = Math.max(5, Math.min(13, e.r * 0.34));
        ctx.beginPath();
        ctx.arc(endX, endY, tipR, 0, Math.PI * 2);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - Math.cos(e.lockedAim - 0.52) * 14, endY - Math.sin(e.lockedAim - 0.52) * 14);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - Math.cos(e.lockedAim + 0.52) * 14, endY - Math.sin(e.lockedAim + 0.52) * 14);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 地面扩散冲击圈与爆破火球（支持中空环形外环爆裂与实心震波）
    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      if (rg.x + rg.r + 12 < vL || rg.x - rg.r - 12 > vR || rg.y + rg.r + 12 < vT || rg.y - rg.r - 12 > vB) continue;
      const p = Math.max(0, Math.min(1, 1 - rg.t / Math.max(0.01, rg.maxT)));
      const curR = Math.max(1, rg.r * (0.24 + p * 0.76));
      if (rg.innerR && rg.innerR > 4) {
        const band = Math.max(4, Math.max(rg.innerR + 6, curR) - rg.innerR);
        ctx.globalAlpha = Math.max(0.02, (1 - p) * 0.55);
        ctx.strokeStyle = rg.color;
        ctx.lineWidth = band;
        ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.innerR + band * 0.5, 0, Math.PI * 2); ctx.stroke();
      } else {
        if (rg.fill && p < 0.65) {
          ctx.globalAlpha = Math.max(0, (1 - p / 0.65) * 0.36);
          ctx.fillStyle = rg.color;
          ctx.beginPath(); ctx.arc(rg.x, rg.y, Math.max(0.5, curR * 0.88), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = Math.max(0, (1 - p / 0.65) * 0.45);
          ctx.fillStyle = '#fff3b0';
          ctx.beginPath(); ctx.arc(rg.x, rg.y, Math.max(0.5, curR * 0.42), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = Math.max(0.02, (1 - p) * 0.9);
        ctx.strokeStyle = rg.color;
        ctx.lineWidth = Math.max(1, 6.5 * (1 - p) + 1.8);
        ctx.beginPath(); ctx.arc(rg.x, rg.y, curR, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < spawns.length; i++) {
      const s = spawns[i];
      if (s.x < vL || s.x > vR || s.y < vT || s.y > vB) continue;
      const p = Math.max(0, Math.min(1, 1 - s.t / Math.max(0.01, s.maxT)));
      const isBig = s.type === 'boss' || s.type === 'mini_boss' || s.type === 'special_boss';
      const sz = Math.max(4, (isBig ? 26 : 13) * (0.8 + Math.sin(p * Math.PI * 4) * 0.15));
      const sCol = s.type === 'special_boss' ? '#ffd166' : '#ff3b6b';
      ctx.globalAlpha = 0.14 + p * 0.18;
      ctx.fillStyle = sCol;
      ctx.beginPath(); ctx.arc(s.x, s.y, sz * 1.45, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = sCol; ctx.lineWidth = isBig ? 5 : 3.5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x - sz, s.y - sz); ctx.lineTo(s.x + sz, s.y + sz);
      ctx.moveTo(s.x + sz, s.y - sz); ctx.lineTo(s.x - sz, s.y + sz);
      ctx.stroke();
    }

    // 晶石、血包与异星战利品箱绘制
    ctx.strokeStyle = '#14281d';
    ctx.lineWidth = 1.7;
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.x < vL || d.x > vR || d.y < vT || d.y > vB) continue;
      const by = Math.sin(d.bob) * 2.2;
      if (d.kind === 'mat') {
        const v = d.val || 1;
        const sz = v >= 5 ? 8.5 : (v >= 2 ? 7.4 : 6.5);
        const gx = d.x, gy = d.y + by;
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(gx - 4, d.y + 6, 8, 3);
        ctx.fillStyle = v >= 5 ? '#ffd166' : (v >= 2 ? '#4cc9f0' : '#52b788');
        ctx.beginPath();
        ctx.moveTo(gx, gy - sz); ctx.lineTo(gx + sz * 0.85, gy); ctx.lineTo(gx, gy + sz); ctx.lineTo(gx - sz * 0.85, gy);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      } else if (d.kind === 'crate') {
        ctx.save(); ctx.translate(d.x, d.y + by);
        if (d.isMythic) {
          ctx.strokeStyle = 'rgba(255, 77, 109, 0.85)'; ctx.lineWidth = 2.6;
          ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.strokeStyle = d.isMythic ? '#ffd166' : 'rgba(255, 209, 102, 0.55)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = d.isMythic ? '#d90429' : (d.isBoss ? '#9d4edd' : '#7209b7');
        ctx.strokeStyle = '#1d1128'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.roundRect(-9.5, -8.5, 19, 17, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-9.5, -2, 19, 4);
        ctx.fillRect(-2, -8.5, 4, 17);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = '#14281d'; ctx.lineWidth = 1.7;
      } else {
        ctx.save(); ctx.translate(d.x, d.y + by);
        ctx.fillStyle = '#ff4d6d'; ctx.strokeStyle = '#220910'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-8, -8, 16, 16, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillRect(-2, -5, 4, 10); ctx.fillRect(-5, -2, 10, 4);
        ctx.restore();
        ctx.strokeStyle = '#14281d'; ctx.lineWidth = 1.7;
      }
    }

    // 异星晶树、炮台、怪物、土豆英雄按 Y 轴深度排序渲染（零闭包分配 + 视锥剔除）
    renderList.length = 0;
    for (let i = 0; i < trees.length; i++) {
      const tr = trees[i];
      if (tr.hp <= 0 || tr.x + 40 < vL || tr.x - 40 > vR || tr.y + 40 < vT || tr.y - 40 > vB) continue;
      tr._rk = 3;
      renderList.push(tr);
    }
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const padR = e.r + 36;
      if (e.x + padR < vL || e.x - padR > vR || e.y + padR < vT || e.y - padR > vB) continue;
      e._rk = 0;
      renderList.push(e);
    }
    for (let i = 0; i < turrets.length; i++) {
      const t = turrets[i];
      if (t.x + 36 < vL || t.x - 36 > vR || t.y + 36 < vT || t.y - 36 > vB) continue;
      t._rk = 1;
      renderList.push(t);
    }
    if (player) {
      player._rk = 2;
      renderList.push(player);
    }
    renderList.sort((a, b) => a.y - b.y);
    for (let i = 0; i < renderList.length; i++) {
      const it = renderList[i];
      if (it._rk === 0) drawEnemySprite(it);
      else if (it._rk === 1) drawTurretSprite(it);
      else if (it._rk === 3) drawTreeSprite(it);
      else drawPotatoHero();
    }

    if (player) {
      for (const w of player.weapons) {
        if (w.wx !== undefined) drawWeaponSprite(w);
      }
    }

    // 近战差异化刀光（长矛突刺枪芒 / 匕首寒芒 / 利爪三连撕痕 / 重武器钝击波 / 太刀居合月牙，干净利落零滤镜）
    for (let si = 0; si < slashes.length; si++) {
      const sl = slashes[si];
      const slPad = (sl.r || 80) + 20;
      if (sl.x + slPad < vL || sl.x - slPad > vR || sl.y + slPad < vT || sl.y - slPad > vB) continue;
      const alpha = Math.max(0.05, sl.t / Math.max(0.01, sl.maxT));
      ctx.save();
      ctx.translate(sl.x, sl.y); ctx.rotate(sl.angle);
      ctx.globalAlpha = alpha;
      ctx.lineCap = 'round';
      if (sl.mode === 'spear') {
        ctx.fillStyle = sl.color;
        ctx.beginPath(); ctx.moveTo(6, -8 * alpha); ctx.lineTo(sl.r + 8, 0); ctx.lineTo(6, 8 * alpha); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(14, -3.2 * alpha); ctx.lineTo(sl.r + 4, 0); ctx.lineTo(14, 3.2 * alpha); ctx.closePath(); ctx.fill();
      } else if (sl.mode === 'stab') {
        ctx.fillStyle = sl.color;
        ctx.beginPath(); ctx.moveTo(-10, -6.5 * alpha); ctx.lineTo(sl.r * 0.92, 0); ctx.lineTo(-10, 6.5 * alpha); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4 * alpha;
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(sl.r * 0.86, 0); ctx.stroke();
      } else if (sl.mode === 'claw') {
        const rad = Math.max(14, sl.r * 0.72);
        for (let k = -1; k <= 1; k++) {
          const oy = k * 8.5;
          const rK = Math.max(8, rad - Math.abs(k) * 4);
          ctx.strokeStyle = sl.color;
          ctx.lineWidth = 3.2 * alpha;
          ctx.beginPath(); ctx.arc(-10, oy, rK, -0.58, 0.58); ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2 * alpha;
          ctx.beginPath(); ctx.arc(-9, oy, rK, -0.46, 0.46); ctx.stroke();
        }
      } else if (sl.mode === 'blunt') {
        const rad = Math.max(12, sl.r * 0.68);
        ctx.strokeStyle = sl.color;
        ctx.lineWidth = 9.5 * alpha;
        ctx.beginPath(); ctx.arc(-10, 0, rad, -0.72, 0.72); ctx.stroke();
        ctx.strokeStyle = '#fff3b0';
        ctx.lineWidth = 2.6 * alpha;
        ctx.beginPath(); ctx.arc(-10, 0, rad + 3.5 * alpha, -0.60, 0.60); ctx.stroke();
      } else {
        const span = sl.mode === 'crescent' ? 1.05 : 0.80;
        const rad = Math.max(12, sl.r * (sl.mode === 'crescent' ? 0.76 : 0.68));
        const inR = Math.max(6, rad - 8 * alpha);
        const outR = Math.max(inR + 2, rad + 8 * alpha);
        ctx.fillStyle = sl.color;
        ctx.beginPath();
        ctx.arc(-12, 0, outR, -span, span);
        ctx.arc(-4, 0, inR, span, -span, true);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = (sl.mode === 'crescent' ? 3.4 : 2.4) * alpha;
        ctx.beginPath(); ctx.arc(-11, 0, Math.max(8, rad + 4 * alpha), -span * 0.88, span * 0.88); ctx.stroke();
      }
      ctx.restore();
    }

    // 激光束与狙击枪高能贯穿轨迹（外层电浆辉光 + 白炽内芯 + 命中光斑）
    for (const bm of beams) {
      const alpha = Math.max(0.04, bm.t / Math.max(0.01, bm.maxT));
      ctx.save();
      ctx.lineCap = 'round';
      ctx.globalAlpha = alpha * 0.38;
      ctx.strokeStyle = bm.color;
      ctx.lineWidth = (bm.thin ? 9 : 18) * alpha;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = (bm.thin ? 4 : 9) * alpha;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = (bm.thin ? 1.8 : 3.5) * alpha;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
      ctx.restore();
    }

    // 连锁电弧（双层青紫电芒 + 白芯折线）
    for (const lt of lightnings) {
      const alpha = Math.max(0.04, lt.t / Math.max(0.01, lt.maxT));
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.globalAlpha = alpha * 0.42;
      ctx.strokeStyle = lt.color; ctx.lineWidth = 8 * alpha;
      ctx.beginPath();
      lt.pts.forEach((pt, idx) => idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3.5 * alpha;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 投射物绘制（火焰气流、电浆球、冰锥、弹弓圆石、旋转手里剑、火箭弹头、带辉光曳光弹）
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (b.x < vL || b.x > vR || b.y < vT || b.y > vB) continue;
      const br = Math.max(1.5, b.r || 4);
      if (b.isFlame) {
        const lifeP = Math.max(0, b.life / Math.max(0.01, b.maxLife));
        ctx.globalAlpha = lifeP * 0.58;
        ctx.fillStyle = lifeP > 0.55 ? '#ffd166' : (lifeP > 0.28 ? '#ff9f1c' : '#e63946');
        ctx.beginPath(); ctx.arc(b.x, b.y, br, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (b.isPlasma) {
        ctx.fillStyle = 'rgba(199, 125, 255, 0.34)';
        ctx.beginPath(); ctx.arc(b.x, b.y, br * 1.65, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c77dff'; ctx.strokeStyle = '#72efdd'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(b.x, b.y, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(b.x, b.y, br * 0.45, 0, Math.PI * 2); ctx.fill();
      } else if (b.isIce) {
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.angle);
        ctx.fillStyle = '#72efdd'; ctx.strokeStyle = '#03045e'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-1, -4.2); ctx.lineTo(10, 0); ctx.lineTo(-1, 4.2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else if (b.isPebble) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.42)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(b.px, b.py); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(b.x, b.y, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (b.isStar) {
        ctx.strokeStyle = 'rgba(114, 239, 221, 0.45)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(b.px, b.py); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.spin);
        ctx.fillStyle = '#e0fbfc'; ctx.strokeStyle = '#14101a'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const a = k * Math.PI * 0.5;
          ctx.lineTo(Math.cos(a) * 9.5, Math.sin(a) * 9.5);
          ctx.lineTo(Math.cos(a + 0.45) * 3.2, Math.sin(a + 0.45) * 3.2);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else if (b.isGrenade) {
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.spin || 0);
        ctx.fillStyle = '#334155'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.roundRect(-6.5, -5, 13, 10, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-2, -5, 4, 10);
        ctx.restore();
      } else if (b.isWaveArc) {
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.angle);
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4.2;
        ctx.beginPath(); ctx.arc(-6, 0, 14, -0.75, 0.75); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(-5, 0, 14, -0.58, 0.58); ctx.stroke();
        ctx.restore();
      } else if (b.isDart) {
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.angle);
        ctx.fillStyle = '#a3e635'; ctx.strokeStyle = '#14281d'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -3); ctx.lineTo(-3, 0); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else if (b.isRocket) {
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.angle);
        ctx.fillStyle = '#ff9f1c';
        ctx.beginPath(); ctx.arc(-8, 0, 4.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e5e5e5'; ctx.strokeStyle = '#14101a'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.roundRect(-6, -3.5, 11, 7, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ef233c';
        ctx.beginPath(); ctx.moveTo(5, -3.5); ctx.lineTo(10, 0); ctx.lineTo(5, 3.5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else {
        ctx.globalAlpha = 0.36;
        ctx.strokeStyle = b.color; ctx.lineWidth = br * 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(b.px, b.py); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = br * 1.35;
        ctx.beginPath(); ctx.moveTo(b.px, b.py); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(b.x, b.y, br * 0.72, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 敌方差异化投射物（腐蚀液滴 / 穿刺骨针 / 寒冰黄金棱晶 / 旋转十字飞盘 / 烈焰火球 / 能量圆弹，清爽高辨识度）
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
    for (let i = 0; i < eBullets.length; i++) {
      const b = eBullets[i];
      if (b.x < vL || b.x > vR || b.y < vT || b.y > vB) continue;
      const bCol = b.color || '#ff4d6d';
      const br = Math.max(1.5, b.r || 5);
      const shp = b.shape;
      if (shp === 'disc') {
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.rot || 0);
        ctx.fillStyle = bCol; ctx.strokeStyle = '#1d1422'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const a = k * Math.PI * 0.5;
          ctx.lineTo(Math.cos(a) * (br * 1.35), Math.sin(a) * (br * 1.35));
          ctx.lineTo(Math.cos(a + 0.45) * (br * 0.48), Math.sin(a + 0.45) * (br * 0.48));
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, Math.max(1.2, br * 0.28), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
      } else if (shp === 'needle') {
        const ang = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(ang);
        ctx.fillStyle = bCol;
        ctx.beginPath();
        ctx.moveTo(br * 2.1, 0); ctx.lineTo(-br * 1.4, -br * 0.65); ctx.lineTo(-br * 0.8, 0); ctx.lineTo(-br * 1.4, br * 0.65);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else if (shp === 'shard') {
        const ang = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(ang);
        ctx.fillStyle = bCol;
        ctx.beginPath();
        ctx.moveTo(br * 1.6, 0); ctx.lineTo(0, -br * 0.95); ctx.lineTo(-br * 1.4, 0); ctx.lineTo(0, br * 0.95);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else if (shp === 'acid' || shp === 'fire') {
        const ang = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(ang);
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = bCol;
        ctx.beginPath(); ctx.moveTo(-br * 2.2, 0); ctx.lineTo(0, -br * 0.9); ctx.lineTo(0, br * 0.9); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(br * 0.2, 0, br * 0.95, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else {
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = bCol;
        ctx.beginPath(); ctx.arc(b.x, b.y, br * 1.55, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = bCol;
        ctx.beginPath(); ctx.arc(b.x, b.y, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }

    // 枪口十字火舌、爆裂粒子与方向性白芯受击火花
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.x < vL || p.x > vR || p.y < vT || p.y > vB) continue;
      const life = Math.max(0, Math.min(1, p.t / Math.max(0.01, p.maxT)));
      ctx.globalAlpha = life;
      const pr = Math.max(1, p.r || 2);
      if (p.muzzle) {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.angle || 0);
        ctx.fillStyle = '#ff9f1c';
        ctx.beginPath();
        ctx.moveTo(pr * 1.5, 0); ctx.lineTo(0, -pr * 0.55); ctx.lineTo(-pr * 0.4, 0); ctx.lineTo(0, pr * 0.55);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(2, 0, Math.max(0.5, pr * 0.36), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, pr * (0.45 + life * 0.55)), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      if (sp.x < vL || sp.x > vR || sp.y < vT || sp.y > vB) continue;
      const life = Math.max(0, sp.t / sp.maxT);
      const spd = Math.hypot(sp.vx, sp.vy) || 1;
      const dx = (sp.vx / spd) * sp.len * life, dy = (sp.vy / spd) * sp.len * life;
      ctx.globalAlpha = life;
      ctx.strokeStyle = sp.color; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x - dx, sp.y - dy); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x - dx * 0.5, sp.y - dy * 0.5); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    let lastFontSize = -1;
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      if (t.x < vL || t.x > vR || t.y < vT || t.y > vB) continue;
      const life = Math.max(0, t.t / Math.max(0.01, t.maxT));
      const scale = t.important ? (life > 0.90 ? 1 + (1 - life) * 2.2 : 1) : (life > 0.8 ? 1 + (1 - life) * 1.7 : 1);
      ctx.globalAlpha = t.important ? Math.min(1, life / 0.22) : Math.min(1, life * 1.9);
      const fSize = Math.max(9, Math.round(t.size * scale));
      if (fSize !== lastFontSize) {
        lastFontSize = fSize;
        ctx.font = `900 ${fSize}px -apple-system, sans-serif`;
      }
      if (t.important) {
        const padX = 9, pillH = fSize + 9;
        if (!(t._baseW > 0)) {
          t._baseW = ctx.measureText(t.txt).width / Math.max(0.5, scale);
        }
        const tw = Math.min(340, Math.max(44, t._baseW * scale + padX * 2));
        ctx.fillStyle = 'rgba(15, 11, 26, 0.78)';
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(t.x - tw * 0.5, t.y - fSize + 1, tw, pillH, 7);
        ctx.fill();
        ctx.stroke();
      }
      if (isTouch) {
        ctx.fillStyle = '#120d18';
        ctx.fillText(t.txt, t.x - 1.5, t.y + 1.5);
        ctx.fillText(t.txt, t.x + 1.8, t.y + 1.8);
        ctx.fillStyle = t.color;
        ctx.fillText(t.txt, t.x, t.y);
      } else {
        ctx.lineWidth = 3.8; ctx.strokeStyle = '#120d18';
        ctx.strokeText(t.txt, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.txt, t.x, t.y);
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  ctx.restore();

  // 屏幕四周电影感暗角（复用离屏预烘焙贴图，零实时渐变开销）
  const lowHp = player && state === 'wave' && (player.hp / Math.max(1, player.maxHp) < 0.32);
  ctx.drawImage(lowHp ? vigLowHp : vigNormal, 0, 0, viewW, viewH);

  // 屏幕顶部战术事件持久播报横幅（停留 3~4 秒，带剩余时间条，确保玩家不错过任何奇遇/环境异象）
  if (state === 'wave' && typeof banners !== 'undefined' && banners.length > 0) {
    const baseY = uiMode === 'mobile-portrait' ? 148 : (uiMode === 'mobile-landscape' ? 68 : 98);
    const fSize = uiMode === 'desktop' ? 14 : 12.5;
    ctx.save();
    ctx.font = `800 ${fSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < banners.length; i++) {
      const b = banners[i];
      const maxT = Math.max(0.2, b.maxT || 3.2);
      const elapsed = maxT - b.t;
      const enterP = Math.min(1, elapsed / 0.16);
      const exitP = Math.min(1, Math.max(0, b.t / 0.45));
      const alpha = enterP * exitP;
      if (alpha <= 0.02) continue;
      const maxW = Math.max(200, viewW - 28);
      if (!b._tw || b._fSize !== fSize) {
        b._tw = ctx.measureText(b.txt).width;
        b._fSize = fSize;
      }
      const tw = Math.min(maxW, Math.max(190, b._tw + 34));
      const bh = uiMode === 'desktop' ? 32 : 28;
      const bx = viewW * 0.5 - tw * 0.5;
      const by = baseY + i * (bh + 7) - (1 - enterP) * 8;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(17, 13, 29, 0.90)';
      ctx.strokeStyle = b.color || '#ffd166';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(bx, by, tw, bh, 9);
      ctx.fill();
      ctx.stroke();
      const progW = Math.max(0, (tw - 14) * Math.max(0, Math.min(1, b.t / maxT)));
      if (progW > 1) {
        ctx.globalAlpha = alpha * 0.65;
        ctx.fillStyle = b.color || '#ffd166';
        ctx.fillRect(bx + 7, by + bh - 3.5, progW, 2);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f8f5ff';
      ctx.fillText(b.txt, viewW * 0.5, by + bh * 0.5 - 0.5, tw - 18);
    }
    ctx.restore();
  }

  // 地图奇遇圣物在视野外时，于屏幕边缘绘制醒目方向指引信标
  if (state === 'wave' && relics.length > 0) {
    const rel = relics[0];
    const rxScreen = (rel.x - cam.x) * camZoom + viewW * 0.5;
    const ryScreen = (rel.y - cam.y) * camZoom + viewH * 0.5;
    const pad = 42;
    if (rxScreen < pad || rxScreen > viewW - pad || ryScreen < 84 || ryScreen > viewH - pad) {
      const ang = Math.atan2(ryScreen - viewH * 0.5, rxScreen - viewW * 0.5);
      const px = Math.max(54, Math.min(viewW - 54, rxScreen));
      const py = Math.max(96, Math.min(viewH - 56, ryScreen));
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = 'rgba(24, 16, 36, 0.88)';
      ctx.strokeStyle = (rel.def && rel.def.color) || '#ffd166';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(19, -6); ctx.lineTo(19, 6); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.font = '16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((rel.def && rel.def.icon) || '✨', 0, 1);
      ctx.restore();
    }
  }

  // 触屏设备：全屏动态悬浮虚拟摇杆（竖屏常驻拇指托盘锚点 + 拖动跟随 + 清晰大字引导）
  if (state === 'wave' && (isTouch || uiMode !== 'desktop')) {
    ctx.save();
    if (joy.active) {
      ctx.fillStyle = 'rgba(18, 15, 26, 0.36)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(joy.ox, joy.oy, joy.maxR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(joy.ox, joy.oy); ctx.lineTo(joy.cx, joy.cy); ctx.stroke();

      ctx.fillStyle = 'rgba(255, 209, 102, 0.82)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(joy.cx, joy.cy, 23, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (uiMode === 'mobile-portrait') {
      const gx = viewW * 0.5, gy = viewH - Math.min(135, viewH * 0.18);
      ctx.globalAlpha = wave === 1 && waveTime > 15 ? 0.65 : 0.24;
      ctx.fillStyle = 'rgba(18, 15, 26, 0.35)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gx, gy, 44, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 209, 102, 0.72)';
      ctx.beginPath(); ctx.arc(gx, gy, 15, 0, Math.PI * 2); ctx.fill();
      if (wave === 1 && waveTime > 15) {
        ctx.fillStyle = '#f5f2eb';
        ctx.font = '800 14.5px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('按住屏幕任意位置滑动走位 · 双指缩放', gx, gy + 68);
        ctx.textAlign = 'left';
      }
    }
    ctx.restore();
  }

  // 首领召唤 / 终局降临 / 隐藏二阶段觉醒 全屏时停登场立绘演出（纯矢量无渐变零开销）
  if (state === 'wave' && typeof bossCutscene !== 'undefined' && bossCutscene && bossCutscene.t > 0) {
    const bc = bossCutscene;
    const maxT = Math.max(0.25, bc.maxT || 1.25);
    const elapsed = maxT - bc.t;
    const enterP = Math.min(1, elapsed / 0.18);
    const exitP = Math.min(1, Math.max(0, bc.t / 0.22));
    const alpha = enterP * exitP;
    const isMythic = bc.mode === 'mythic_phase2';
    const mainCol = bc.color || '#ff3b6b';
    const accCol = bc.accent || '#ffd166';
    const portraitPortrait = viewW < 620;

    ctx.save();
    // 1. 全屏戏剧暗化与银白瞬闪
    ctx.globalAlpha = 0.74 * alpha;
    ctx.fillStyle = isMythic ? '#14060d' : '#080512';
    ctx.fillRect(0, 0, viewW, viewH);
    if (elapsed < 0.09) {
      ctx.globalAlpha = (1 - elapsed / 0.09) * 0.42;
      ctx.fillStyle = isMythic ? '#ffd166' : '#ffffff';
      ctx.fillRect(0, 0, viewW, viewH);
    }

    // 2. 宽银幕上下黑边封幅
    const barH = Math.round(Math.min(54, viewH * 0.085) * enterP);
    ctx.globalAlpha = 0.95 * exitP;
    ctx.fillStyle = '#05030a';
    ctx.fillRect(0, 0, viewW, barH);
    ctx.fillRect(0, viewH - barH, viewW, barH);
    ctx.fillStyle = accCol;
    ctx.fillRect(0, barH - 2, viewW, 2);
    ctx.fillRect(0, viewH - barH, viewW, 2);

    // 3. 斜向贯穿动漫感战幕横幅 + 速度流线
    const cy = viewH * 0.5;
    const bandH = portraitPortrait ? 236 : 186;
    const slant = portraitPortrait ? 22 : 38;
    ctx.globalAlpha = 0.94 * alpha;
    ctx.fillStyle = '#120b22';
    ctx.beginPath();
    ctx.moveTo(-20, cy - bandH * 0.5 + slant);
    ctx.lineTo(viewW + 20, cy - bandH * 0.5 - slant);
    ctx.lineTo(viewW + 20, cy + bandH * 0.5 - slant);
    ctx.lineTo(-20, cy + bandH * 0.5 + slant);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = mainCol;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 横幅内高速电芒切线
    ctx.globalAlpha = 0.35 * alpha;
    ctx.strokeStyle = accCol;
    ctx.lineWidth = 2;
    for (let s = 0; s < 5; s++) {
      const sy = cy - bandH * 0.38 + s * (bandH * 0.19);
      const sxOff = ((elapsed * 420 + s * 130) % (viewW * 0.8));
      ctx.beginPath();
      ctx.moveTo(sxOff, sy);
      ctx.lineTo(sxOff + 140, sy - (slant / Math.max(1, viewW)) * 140);
      ctx.stroke();
    }

    // 4. 二次元美少女夏装半身立绘破框切入与称号排印
    ctx.globalAlpha = alpha;
    const slideOffset = (1 - enterP) * 56;
    const personaSpec = (typeof BOSS_PORTRAIT_DATA !== 'undefined' && BOSS_PORTRAIT_DATA) ? BOSS_PORTRAIT_DATA[bc.variant] : null;
    if (portraitPortrait) {
      const pScale = Math.min(0.86, viewW / 450);
      drawBossPortrait(bc.variant, viewW * 0.5 - slideOffset, cy - 42, pScale, isMythic);
      ctx.textAlign = 'center';
      ctx.font = '800 13px -apple-system, sans-serif';
      ctx.fillStyle = accCol;
      ctx.fillText(bc.subtitle || '⚠️ 强敌降临', viewW * 0.5, cy + 54, viewW - 32);
      ctx.font = '900 24px -apple-system, sans-serif';
      ctx.strokeStyle = '#090512';
      ctx.lineWidth = 5;
      ctx.strokeText(bc.title || '首领降临', viewW * 0.5, cy + 80, viewW - 28);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(bc.title || '首领降临', viewW * 0.5, cy + 80, viewW - 28);
      if (bc.extraTag) {
        ctx.font = '800 12px -apple-system, sans-serif';
        ctx.fillStyle = isMythic ? '#ffd166' : '#e0fbfc';
        ctx.fillText(bc.extraTag, viewW * 0.5, cy + 102, viewW - 28);
      }
    } else {
      const portX = Math.max(164, viewW * 0.285) - slideOffset;
      const textX = portX + 136 + slideOffset * 1.35;
      drawBossPortrait(bc.variant, portX, cy - 2, 1.24, isMythic);
      ctx.textAlign = 'left';
      ctx.font = '800 15px -apple-system, sans-serif';
      ctx.fillStyle = accCol;
      const skinLabel = personaSpec
        ? (isMythic
          ? `【🔥隐藏换装 · ${personaSpec.personaName.split(' · ')[0]}·${personaSpec.mythicTitle || personaSpec.summerTitle}】`
          : `【${personaSpec.personaName.split(' · ')[0]}·${personaSpec.summerTitle}】`)
        : '';
      const subTxt = skinLabel
        ? `${bc.subtitle || '⚠️ 强敌降临'} · ${skinLabel}`
        : (bc.subtitle || '⚠️ 强敌降临');
      ctx.fillText(subTxt, textX, cy - 32, Math.max(180, viewW - textX - 36));
      ctx.font = '900 34px -apple-system, sans-serif';
      ctx.strokeStyle = '#090512';
      ctx.lineWidth = 6;
      ctx.strokeText(bc.title || '首领降临', textX, cy + 10, Math.max(180, viewW - textX - 36));
      ctx.fillStyle = '#ffffff';
      ctx.fillText(bc.title || '首领降临', textX, cy + 10, Math.max(180, viewW - textX - 36));
      if (bc.extraTag) {
        if (!bc._tagW) bc._tagW = ctx.measureText(bc.extraTag).width;
        const tagW = Math.min(viewW - textX - 40, Math.max(210, bc._tagW * 0.45 + 28));
        ctx.fillStyle = isMythic ? 'rgba(217, 4, 41, 0.38)' : 'rgba(255, 255, 255, 0.10)';
        ctx.strokeStyle = accCol;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(textX, cy + 24, tagW, 28, 7);
        ctx.fill();
        ctx.stroke();
        ctx.font = '800 13.5px -apple-system, sans-serif';
        ctx.fillStyle = isMythic ? '#ffd166' : '#f8f5ff';
        ctx.fillText(bc.extraTag, textX + 12, cy + 43, Math.max(160, viewW - textX - 56));
      }
    }

    if (elapsed > 0.35) {
      ctx.globalAlpha = 0.65 * exitP;
      ctx.font = '700 12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('按 空格 / 点击屏幕 可跳过演出', viewW * 0.5, viewH - barH - 14);
    }
    ctx.restore();
  }
}

logInfo('BOOT', `引擎启动完成 · view=${viewW}x${viewH}(dpr=${dpr}) · ui=${uiMode} · world=${WORLD.w}x${WORLD.h}(scale=${curFloorScale})`);
last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const safeNow = Number.isFinite(now) ? now : performance.now();
  const rawMs = Math.max(0, safeNow - last);
  const dt = Math.min(0.05, rawMs / 1000);
  last = safeNow;

  if (state === 'wave' && !(typeof document !== 'undefined' && document.hidden) && rawMs > 180 && rawMs < 5000) {
    logSpikeCount++;
    logWarn('STALL', `帧耗时峰值 ${Math.round(rawMs)}ms · w=${wave} E=${enemies.length} B=${bullets.length} P=${particles.length}`);
  }

  const sampleMs = Math.min(250, rawMs);
  fpsFrames++;
  fpsAcc += sampleMs;
  if (rawMs < 5000 && rawMs > maxFrameMsWindow) maxFrameMsWindow = rawMs;
  if (fpsAcc >= 500) {
    fpsVal = Math.max(1, Math.min(240, Math.round((fpsFrames * 1000) / fpsAcc)));
    fpsFrames = 0;
    fpsAcc = 0;
  }

  if (state === 'wave') {
    perfLogAcc += dt;
    if (perfLogAcc >= 5.0) {
      perfLogAcc = 0;
      logInfo('PERF', `FPS=${fpsVal} maxFrame=${Math.round(maxFrameMsWindow)}ms w=${wave}(${Math.ceil(waveTime)}s) E=${enemies.length} B=${bullets.length} D=${drops.length}`);
      maxFrameMsWindow = 0;
    }
  }

  try {
    update(dt);
  } catch (err) {
    logError('UPDATE_ERR', err);
  }
  try {
    draw();
  } catch (err) {
    logError('DRAW_ERR', err);
    try { ctx.restore(); } catch (_) {}
  }
}
requestAnimationFrame(loop);
