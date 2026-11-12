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

    // 交互式生态地形渲染（熔岩池、剧毒泥沼、寒霜滑冰面、断层裂谷，纯矢量分层零渐变开销）
    for (let i = 0; i < terrains.length; i++) {
      const tr = terrains[i];
      const pad = (tr.halfLen || 0) + (tr.r || 68) + 28;
      if (tr.x + pad < vL || tr.x - pad > vR || tr.y + pad < vT || tr.y - pad > vB) continue;
      ctx.save();
      if (tr.kind === 'chasm') {
        const cr = Math.max(14, tr.r || 30);
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#453654';
        ctx.lineWidth = cr * 2 + 10;
        ctx.beginPath(); ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); ctx.stroke();
        ctx.strokeStyle = '#1d1528';
        ctx.lineWidth = cr * 2 + 2;
        ctx.beginPath(); ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); ctx.stroke();
        ctx.strokeStyle = '#07050c';
        ctx.lineWidth = Math.max(8, cr * 2 - 10);
        ctx.beginPath(); ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); ctx.stroke();
        ctx.strokeStyle = 'rgba(199, 125, 255, 0.34)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 10]);
        ctx.beginPath(); ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); ctx.stroke();
        ctx.setLineDash([]);
      } else if (tr.kind === 'lava') {
        const lr = Math.max(20, tr.r || 66);
        const pls = Math.sin(tr.pulse || 0);
        ctx.fillStyle = '#2a100d';
        ctx.beginPath(); ctx.arc(tr.x, tr.y, lr + 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(tr.x, tr.y, lr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(tr.x, tr.y, Math.max(8, lr * (0.75 + pls * 0.04)), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(tr.x, tr.y, Math.max(5, lr * (0.40 - pls * 0.04)), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([10, 7]);
        ctx.beginPath(); ctx.arc(tr.x, tr.y, lr - 1, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#fef08a';
        for (let b = 0; b < 3; b++) {
          const ba = (tr.seed || 0) + b * 2.1 + (tr.pulse || 0) * 0.45;
          const bd = lr * (0.35 + ((b * 0.23) % 0.4));
          const br = Math.max(1.5, 3.2 + Math.sin((tr.pulse || 0) * 1.8 + b * 2) * 1.6);
          ctx.beginPath(); ctx.arc(tr.x + Math.cos(ba) * bd, tr.y + Math.sin(ba) * bd, br, 0, Math.PI * 2); ctx.fill();
        }
      } else if (tr.kind === 'swamp') {
        const sr = Math.max(20, tr.r || 72);
        ctx.fillStyle = '#13261e';
        ctx.beginPath(); ctx.arc(tr.x, tr.y, sr + 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1e4635';
        ctx.beginPath(); ctx.arc(tr.x, tr.y, sr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(132, 204, 22, 0.32)';
        ctx.beginPath(); ctx.arc(tr.x, tr.y, Math.max(8, sr * 0.72), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(163, 230, 53, 0.68)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([9, 7]);
        ctx.beginPath(); ctx.arc(tr.x, tr.y, sr - 1, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#bef264';
        ctx.lineWidth = 1.6;
        for (let b = 0; b < 3; b++) {
          const ba = (tr.seed || 0) + b * 2.09;
          const bd = sr * (0.28 + b * 0.18);
          const cyc = ((tr.pulse || 0) * 0.6 + b * 0.33) % 1;
          ctx.globalAlpha = Math.max(0.1, 1 - cyc);
          ctx.beginPath(); ctx.arc(tr.x + Math.cos(ba) * bd, tr.y + Math.sin(ba) * bd, Math.max(1.5, 2.5 + cyc * 6.5), 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (tr.kind === 'ice_sheet') {
        const ir = Math.max(22, tr.r || 82);
        ctx.fillStyle = 'rgba(114, 239, 221, 0.22)';
        ctx.beginPath(); ctx.arc(tr.x, tr.y, ir, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(224, 242, 254, 0.18)';
        ctx.beginPath(); ctx.arc(tr.x - ir * 0.12, tr.y - ir * 0.12, Math.max(8, ir * 0.68), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.82)';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(tr.x, tr.y, ir, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tr.x - ir * 0.42, tr.y - ir * 0.18); ctx.lineTo(tr.x - ir * 0.08, tr.y - ir * 0.52);
        ctx.moveTo(tr.x - ir * 0.12, tr.y + ir * 0.34); ctx.lineTo(tr.x + ir * 0.38, tr.y - ir * 0.16);
        ctx.stroke();
      }
      if (player && Math.hypot(player.x - tr.x, player.y - tr.y) < (tr.halfLen || tr.r || 68) + 165) {
        const tLabel = tr.kind === 'lava' ? '🌋 熔岩池 (灼烧)' : (tr.kind === 'swamp' ? '🧪 毒泥沼 (减速)' : (tr.kind === 'ice_sheet' ? '🧊 寒冰面 (加速)' : '🕳️ 断层裂谷 (阻挡)'));
        const ly = tr.kind === 'chasm' ? tr.y - 4 : tr.y - (tr.r || 64) + 16;
        ctx.font = '800 11.5px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(14, 10, 24, 0.72)';
        ctx.beginPath(); ctx.roundRect(tr.x - 54, ly - 11, 108, 16, 6); ctx.fill();
        ctx.fillStyle = '#f1ecff';
        ctx.fillText(tLabel, tr.x, ly + 1);
      }
      ctx.restore();
    }

    // 双生虚空传送门 A ↔ B 渲染（附带对向门方位角标与充能冷却环）
    for (let i = 0; i < portals.length; i++) {
      const p = portals[i];
      const pr = Math.max(18, p.r || 34);
      if (p.x + pr + 36 < vL || p.x - pr - 36 > vR || p.y + pr + 36 < vT || p.y - pr - 36 > vB) continue;
      const partner = portals[i === 0 ? 1 : 0];
      const cooling = portalPairCd > 0;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = cooling ? 0.35 : 0.85;
      ctx.fillStyle = '#140c24';
      ctx.beginPath(); ctx.arc(0, 0, pr, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = cooling ? 0.22 : 0.34;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, 0, Math.max(6, pr * (0.72 + Math.sin(p.pulse) * 0.08)), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = cooling ? 0.42 : 0.95;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.8;
      ctx.save();
      ctx.rotate(p.pulse * (cooling ? 0.25 : 0.75));
      ctx.setLineDash([9, 6]);
      ctx.beginPath(); ctx.arc(0, 0, pr, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      if (!cooling) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, Math.max(4, pr * 0.26), 0, Math.PI * 2); ctx.fill();
      } else {
        const cdProg = Math.max(0, Math.min(1, 1 - portalPairCd / 4.5));
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(0, 0, pr + 5, -Math.PI / 2, -Math.PI / 2 + cdProg * Math.PI * 2); ctx.stroke();
      }
      if (partner) {
        const linkA = Math.atan2(partner.y - p.y, partner.x - p.x);
        ctx.save();
        ctx.rotate(linkA);
        ctx.globalAlpha = cooling ? 0.35 : 0.9;
        ctx.fillStyle = partner.color || '#ffd166';
        ctx.beginPath(); ctx.moveTo(pr + 12, 0); ctx.lineTo(pr + 4, -5); ctx.lineTo(pr + 4, 5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.font = '800 12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const pTxt = cooling ? `⏳ 充能 ${portalPairCd.toFixed(1)}s` : `🌀 传送门 ${p.label}`;
      ctx.fillStyle = 'rgba(14, 10, 24, 0.78)';
      ctx.beginPath(); ctx.roundRect(-48, -pr - 24, 96, 17, 6); ctx.fill();
      ctx.fillStyle = cooling ? '#cbd5e1' : '#f8f5ff';
      ctx.fillText(pTxt, 0, -pr - 11);
      ctx.restore();
    }

    // 幽光菌林专属异象：治愈孢子灵泉区域渲染
    for (let i = 0; i < sporeZones.length; i++) {
      const sz = sporeZones[i];
      const sr = Math.max(12, sz.r || 86);
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

    // 地面高危红圈/元素轰炸预警 + 自爆怪引信读秒范围红圈（外框恒定半径 + 内圈蓄满即炸，所有半径严格防负）
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      const hr = Math.max(4, h.r || 40);
      const p = Math.max(0, Math.min(1, 1 - (h.t || 0) / Math.max(0.01, h.maxT || 1)));
      const hCol = h.color || '#ff3b6b';
      ctx.globalAlpha = 0.12 + p * 0.22;
      ctx.fillStyle = hCol;
      ctx.beginPath(); ctx.arc(h.x, h.y, Math.max(0.5, hr * p), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.82;
      ctx.strokeStyle = hCol;
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(h.x, h.y, hr, 0, Math.PI * 2); ctx.stroke();
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
        // 冲锋怪/首领蓄力锁定轨迹虚线
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 159, 28, 0.62)';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([9, 6]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.lockedAim) * 215, e.y + Math.sin(e.lockedAim) * 215);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 地面扩散冲击圈与爆破火球（外圈柔和消散 + 炽白内闪）
    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const p = Math.max(0, Math.min(1, 1 - rg.t / Math.max(0.01, rg.maxT)));
      const curR = Math.max(1, rg.r * (0.24 + p * 0.76));
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
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#7209b7'; ctx.strokeStyle = '#1d1128'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.roundRect(-9.5, -8.5, 19, 17, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-9.5, -2, 19, 4);
        ctx.fillRect(-2, -8.5, 4, 17);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
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
    for (const sl of slashes) {
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
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      if (t.x < vL || t.x > vR || t.y < vT || t.y > vB) continue;
      const life = Math.max(0, t.t / Math.max(0.01, t.maxT));
      const scale = t.important ? (life > 0.90 ? 1 + (1 - life) * 2.2 : 1) : (life > 0.8 ? 1 + (1 - life) * 1.7 : 1);
      ctx.globalAlpha = t.important ? Math.min(1, life / 0.22) : Math.min(1, life * 1.9);
      const fSize = Math.round(t.size * scale);
      ctx.font = `900 ${fSize}px -apple-system, sans-serif`;
      if (t.important) {
        const padX = 9, pillH = fSize + 9;
        const tw = Math.min(340, Math.max(44, ctx.measureText(t.txt).width + padX * 2));
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
  const lowHp = player && state === 'wave' && (player.hp / player.maxHp < 0.32);
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
      const tw = Math.min(maxW, Math.max(190, ctx.measureText(b.txt).width + 34));
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
}

logInfo('BOOT', `引擎启动完成 · view=${viewW}x${viewH}(dpr=${dpr}) · ui=${uiMode} · world=${WORLD.w}x${WORLD.h}(scale=${curFloorScale})`);
last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const rawMs = Math.max(0, now - last);
  const dt = Math.min(0.05, rawMs / 1000);
  last = now;

  if (state === 'wave' && !(typeof document !== 'undefined' && document.hidden) && rawMs > 180 && rawMs < 5000) {
    logSpikeCount++;
    logWarn('STALL', `帧耗时峰值 ${Math.round(rawMs)}ms · w=${wave} E=${enemies.length} B=${bullets.length} P=${particles.length}`);
  }

  fpsFrames++;
  fpsAcc += rawMs;
  if (rawMs > maxFrameMsWindow) maxFrameMsWindow = rawMs;
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
