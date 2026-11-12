// 波次结算流转、战利品宝箱、基因强化与军火商店交互
function advancePostWave() {
  const cm = document.getElementById('crateMenu');
  const lm = document.getElementById('levelMenu');
  if (pendingCrates > 0) {
    if (lm) lm.classList.add('hidden');
    showCrateMenu();
  } else if (pendingLevels > 0) {
    if (cm) cm.classList.add('hidden');
    showLevelUp();
  } else {
    if (cm) cm.classList.add('hidden');
    if (lm) lm.classList.add('hidden');
    openShop(true);
  }
}

function finishWave() {
  resetJoy();
  beep(660, 0.18, 'triangle', 0.07);
  let leftoverMats = 0;
  for (let i = 0; i < drops.length; i++) {
    if (drops[i].kind === 'mat') leftoverMats += (drops[i].val || 1);
  }
  const matRate = 0.82 / (1 + Math.max(0, wave - 1) * 0.19);
  // 自动回收地上 50% 未拾取晶石 + 适度通关津贴 + 【收获】成长分红 + 【理财冠】利息
  const leftover = Math.round(leftoverMats * matRate * 0.50);
  const interestCap = 24 + wave * 9;
  const interestGain = player.interest > 0 ? Math.min(interestCap, Math.round(player.mats * player.interest)) : 0;
  const clearBonus = 4 + Math.floor(wave * 1.5);
  const harvestGain = Math.max(0, Math.round(player.harvestFlat || 0));
  player.mats += leftover + clearBonus + interestGain + harvestGain;
  if (harvestGain > 0) {
    player.xp += Math.round(harvestGain * 0.70);
    let lvGuard = 0;
    while (player.xp >= player.xpNeed && lvGuard++ < 25) {
      player.xp -= player.xpNeed; player.lv++;
      player.xpNeed = Math.max(10, Math.round(player.xpNeed * 1.36 + 6));
      player.maxHp += 1; player.hp += 1;
      pendingLevels++;
    }
    // 复刻原版《土豆兄弟》收获复利：每波结算后收获值自动递增 +8%！
    player.harvestFlat = Math.round((player.harvestFlat || 0) * 1.08 * 10) / 10;
  }
  logInfo('WAVE_END', `第 ${wave} 波通关 · 结算晶石=${player.mats} (回收+${leftover}, 津贴+${clearBonus}, 收获+${harvestGain}, 利息+${interestGain}, 宝箱=${pendingCrates}) · 击杀=${player.kills}`);
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  if (!endlessMode && wave >= MAX_WAVE) { endGame(true); return; }
  advancePostWave();
}

function showCrateMenu() {
  state = 'crate';
  const cm = document.getElementById('crateMenu');
  if (!cm) { pendingCrates = 0; advancePostWave(); return; }
  cm.classList.remove('hidden');
  cm.scrollTop = 0;
  const ct = document.getElementById('crateTitle');
  if (ct) ct.textContent = `🎁 开启异星战利品箱！（剩余 ${pendingCrates} 个）`;

  const luck = player.luck || 0;
  const r = Math.random() + (wave - 1) * 0.036 + Math.min(0.28, luck * 0.0038);
  let tier = 1;
  if (wave >= 5 && r > 1.48) tier = 4;
  else if (wave >= 3 && r > 1.22) tier = 3;
  else if (wave >= 2 && r > 0.84) tier = 2;
  const tierPool = ITEMS.filter(it => it.tier === tier);
  const pickPool = tierPool.length ? tierPool : ITEMS;
  const it = pickPool[Math.floor(Math.random() * pickPool.length)];
  const recycleVal = Math.max(8, Math.round(it.cost * getShopScale() * 0.52));
  const ownedCnt = (player.items && player.items[it.id]) || 0;

  const box = document.getElementById('crateBox');
  box.innerHTML = '';
  const el = document.createElement('div');
  el.className = `card t${it.tier}`;
  el.innerHTML = `
    <div class="card-head" style="padding-right:0">
      <div class="item-emblem t${it.tier}">${it.icon}</div>
      <div class="card-meta">
        <div class="card-title">${it.name}</div>
        <div class="card-badges">
          <span class="tag t${it.tier}">${TIER_NAMES[it.tier]}战利品</span>
          ${ownedCnt > 0 ? `<span class="tag tag-owned">已拥有 ×${ownedCnt}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="card-desc">${it.desc}</div>
      <div class="crate-btns">
        <button class="btn take-btn" style="justify-content:center">🎁 免费收下</button>
        <button class="btn btn-sec recycle-btn" style="justify-content:center">♻️ 回收 (+${recycleVal}💎)</button>
      </div>
    </div>`;
  el.querySelector('.take-btn').onclick = () => {
    player.items[it.id] = (player.items[it.id] || 0) + 1;
    it.apply(player);
    syncSetHp();
    beep(660, 0.09, 'triangle');
    logInfo('CRATE', `收下战利品 ${it.name} (T${it.tier})`);
    pendingCrates--;
    advancePostWave();
  };
  el.querySelector('.recycle-btn').onclick = () => {
    player.mats += recycleVal;
    beep(480, 0.07, 'sine');
    logInfo('CRATE', `熔炼战利品 ${it.name} (+${recycleVal}💎)`);
    pendingCrates--;
    advancePostWave();
  };
  box.appendChild(el);
}

function showLevelUp() {
  state = 'levelup';
  const lm = document.getElementById('levelMenu');
  lm.classList.remove('hidden');
  lm.scrollTop = 0;
  document.getElementById('lvlTitle').textContent = `✨ 升级强化（剩余 ${pendingLevels} 次）`;
  const pool = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 4);
  const box = document.getElementById('lvlCards');
  box.innerHTML = '';
  pool.forEach(u => {
    const el = document.createElement('div');
    el.className = 'card t2';
    el.innerHTML = `
      <div class="card-head" style="padding-right:0">
        <div class="item-emblem t2">${u.icon}</div>
        <div class="card-meta">
          <div class="card-title">${u.name}</div>
          <div class="card-badges"><span class="tag t2">🧬 基因强化</span></div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-desc">${u.desc}</div>
        <div class="card-actions"><button class="btn" style="justify-content:center">⚡ 激活强化</button></div>
      </div>`;
    const pick = () => {
      u.apply(player); syncSetHp(); beep(580, 0.07, 'triangle');
      logInfo('LEVELUP', `选择强化 ${u.name} (Lv.${player.lv})`);
      pendingLevels--;
      advancePostWave();
    };
    el.querySelector('button').onclick = e => { if (e && e.stopPropagation) e.stopPropagation(); pick(); };
    if (uiMode !== 'desktop') el.onclick = pick;
    box.appendChild(el);
  });
}

// 商店波次通胀系数（严密对齐 20s→60s 波次晶石收益曲线，稳定每波可购 2.5~3.5 件装备）
function getShopScale() {
  const endlessMul = wave > MAX_WAVE ? Math.pow(1.18, wave - MAX_WAVE) : 1;
  return (1 + (wave - 1) * 0.22 + Math.pow(Math.max(0, wave - 1), 1.32) * 0.045) * endlessMul * (diff.shopTax || 1);
}

function rollOffers() {
  const locked = shopOffers.filter(o => o && o.locked);
  const wKeys = Object.keys(WEAPONS);
  const usedItems = new Set(locked.filter(o => o.kind === 'item').map(o => o.item.id));
  const shopScale = getShopScale();
  const discountMul = Math.max(0.60, 1 - (player.shopDiscount || 0));
  const luckBonus = Math.min(0.28, (player.luck || 0) * 0.0032);
  let guard = 0;
  while (locked.length < 4 && guard++ < 40) {
    const isWeapon = player.maxSlots > 0 && Math.random() < 0.54;
    let tier = 1;
    const r = Math.random() + (wave - 1) * 0.036 + luckBonus;
    if (wave >= 6 && r > 1.48) tier = 4;
    else if (wave >= 3 && r > 1.24) tier = 3;
    else if (wave >= 2 && r > 0.86) tier = 2;

    if (isWeapon) {
      const validW = wKeys.filter(k => (WEAPONS[k].minTier || 1) <= tier);
      if (!validW.length) continue;
      // 若已有某套装武器，轻微提升同系或同把刷出率便于合成与凑羁绊
      let id = validW[Math.floor(Math.random() * validW.length)];
      if (player.weapons.length && Math.random() < 0.28) {
        const owned = player.weapons[Math.floor(Math.random() * player.weapons.length)].id;
        const sameSet = validW.filter(k => WEAPONS[k].set === WEAPONS[owned].set);
        if (validW.includes(owned) && Math.random() < 0.5) id = owned;
        else if (sameSet.length) id = sameSet[Math.floor(Math.random() * sameSet.length)];
      }
      const tpl = WEAPONS[id];
      const effTier = Math.max(tier, tpl.minTier || 1);
      const tierMul = [0, 1, 1.9, 3.0, 4.4][effTier];
      const cost = Math.max(2, Math.round(tpl.cost * tierMul * shopScale * discountMul));
      locked.push({ kind: 'weapon', id, tier: effTier, cost, locked: false });
    } else {
      const avail = ITEMS.filter(it => !usedItems.has(it.id) && (it.tier < 4 || wave >= 5) && (it.tier < 3 || wave >= 3));
      if (!avail.length) continue;
      const pool = avail.filter(it => it.tier === tier);
      const pickPool = pool.length ? pool : avail;
      const it = pickPool[Math.floor(Math.random() * pickPool.length)];
      usedItems.add(it.id);
      const ownedCnt = (player.items && player.items[it.id]) || 0;
      const cost = Math.max(2, Math.round(it.cost * shopScale * (1 + ownedCnt * 0.20) * discountMul));
      locked.push({ kind: 'item', item: it, tier: it.tier, cost, locked: false });
    }
  }
  shopOffers = locked;
}

function openShop(fresh) {
  state = 'shop';
  confirmSellIdx = -1;
  syncSetHp();
  if (fresh) {
    // 亲民刷新定价（对齐原版《土豆兄弟》：第 1 波仅需 1💎 起刷、第 2 波 2💎，前期每次仅递增 +1💎）
    freeRerollsLeft = player.freeRerolls || 0;
    rerollBase = Math.max(1, Math.floor(wave * 0.75) + 1);
    rerollStep = Math.max(1, Math.floor(wave * 0.45) + 1);
    rerollCost = freeRerollsLeft > 0 ? 0 : rerollBase;
    anvilUpgradedMsg = '';
    if (player.hasAnvil && player.weapons.length > 0) {
      const upgradable = player.weapons.filter(w => w.tier < 4);
      if (upgradable.length > 0) {
        const uw = upgradable[Math.floor(Math.random() * upgradable.length)];
        uw.tier++;
        syncSetHp();
        anvilUpgradedMsg = ` · ⚒️ 神砧免费升阶【${WEAPONS[uw.id].name} Lv${uw.tier}】!`;
        logInfo('SHOP', `铁匠神砧自动升阶 ${WEAPONS[uw.id].name} -> Lv.${uw.tier}`);
      }
    }
    mobDrawerOpen = false;
    rollOffers();
  }
  const sm = document.getElementById('shopMenu');
  sm.classList.toggle('drawer-open', mobDrawerOpen);
  const arr = document.getElementById('mobDrawerArrow');
  if (arr) arr.textContent = mobDrawerOpen ? '收起 ▴' : '详情 ▾';
  sm.classList.remove('hidden');
  sm.scrollTop = 0;
  renderShop();
}

function canBuyWeapon(id, tier) {
  if (player.maxSlots <= 0) return false;
  if (player.weapons.length < player.maxSlots) return true;
  return player.weapons.some(w => w.id === id && w.tier === tier && w.tier < 4);
}

function addOrMergeWeapon(id, tier) {
  const matchIdx = player.weapons.findIndex(w => w.id === id && w.tier === tier && w.tier < 4);
  if (matchIdx !== -1 && player.weapons.length >= player.maxSlots) {
    player.weapons.splice(matchIdx, 1);
    addOrMergeWeapon(id, tier + 1);
    return;
  }
  player.weapons.push(makeWeapon(id, tier));
  syncSetHp();
}

function mergeSlot(idx) {
  const w = player.weapons[idx];
  if (!w || w.tier >= 4) return false;
  const other = player.weapons.findIndex((x, i) => i !== idx && x.id === w.id && x.tier === w.tier);
  if (other === -1) return false;
  w.tier++;
  player.weapons.splice(other, 1);
  syncSetHp();
  beep(760, 0.1, 'triangle');
  return true;
}

function renderShop() {
  renderBuildSummary('statsRow', 'setRow');
  document.getElementById('shopTitle').textContent = uiMode !== 'desktop'
    ? `🛒 第 ${wave} 波整备${anvilUpgradedMsg ? ' · ⚒️已升阶' : ''}`
    : `🛒 第 ${wave} 波完成 — 军火商店（${diff.badge}）`;
  const subEl = document.getElementById('shopSub');
  if (subEl) {
    subEl.textContent = `${diff.badge} · ${curScene.icon} ${curScene.name} · 同名同阶武器可合成${anvilUpgradedMsg}`;
  }
  document.getElementById('shopMat').textContent = `💎 ${player.mats}`;
  const actualReroll = freeRerollsLeft > 0 ? 0 : rerollCost;
  const rerollTxt = actualReroll === 0 ? `🎲 免费刷新 (${freeRerollsLeft})` : `🎲 刷新 (${actualReroll})`;
  const rb = document.getElementById('rerollBtn');
  rb.textContent = rerollTxt;
  rb.disabled = player.mats < actualReroll;
  const mrb = document.getElementById('mobRerollBtn');
  if (mrb) {
    mrb.textContent = rerollTxt;
    mrb.disabled = player.mats < actualReroll;
  }
  const mnb = document.getElementById('mobNextBtn');
  if (mnb) {
    mnb.textContent = `⚔️ 出发第 ${wave + 1} 波`;
  }

  const totalRange = getTotalRangeBonus();
  const box = document.getElementById('shopCards');
  box.innerHTML = '';
  shopOffers.forEach((o, i) => {
    const el = document.createElement('div');
    if (!o) {
      el.className = 'card sold-out';
      el.innerHTML = `<span class="sold-stamp">✓ 已收入囊中</span>`;
      box.appendChild(el); return;
    }
    el.className = `card t${o.tier}${o.locked ? ' is-locked' : ''}`;
    if (o.kind === 'weapon') {
      const tpl = WEAPONS[o.id];
      const sLabel = SET_DEFS[tpl.set] ? SET_DEFS[tpl.set].label : '';
      const scale = tpl.set === 'elemental' ? getElemMul() : 1;
      const aspdBonus = tpl.aspdScale ? Math.max(0, getEffectiveAtkSpd() - 1) * 9 : 0;
      const rngBonus = tpl.rangeScale ? Math.max(0, totalRange) * tpl.rangeScale : 0;
      const dmg = Math.round((tpl.dmg + aspdBonus + rngBonus) * (1 + (o.tier - 1) * 0.55) * (getEffectiveDmgMul() + (tpl.melee ? player.meleeBonus : 0)) * scale);
      const effRange = Math.max(68, tpl.range + (tpl.melee ? Math.round(totalRange * 0.55) : totalRange) + (o.tier - 1) * 16);
      const ok = player.mats >= o.cost && canBuyWeapon(o.id, o.tier);
      const hasMergePair = o.tier < 4 && player.weapons.some(w => w.id === o.id && w.tier === o.tier);
      const pelletsTxt = tpl.pellets ? `×${tpl.pellets}` : '';
      el.innerHTML = `
        <div class="card-main">
          <div class="card-head">
            <div class="item-emblem t${o.tier}">${tpl.icon}</div>
            <div class="card-meta">
              <div class="card-title">${tpl.name}</div>
              <div class="card-badges">
                <span class="tag t${o.tier}">${TIER_NAMES[o.tier]}武器</span>
                <span class="tag">${sLabel}</span>
                ${hasMergePair ? '<span class="tag tag-merge">⬆️ 可合成</span>' : ''}
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="card-desc">${tpl.desc}</div>
            <div class="stat-chips">
              <span class="stat-chip">⚔️ ${dmg}${pelletsTxt}</span>
              <span class="stat-chip">⏱️ ${tpl.cd}s</span>
              <span class="stat-chip">📏 ${effRange}</span>
            </div>
          </div>
        </div>
        <div class="card-side">
          <button class="lock-pin lock${o.locked ? ' is-locked' : ''}" title="${o.locked ? '点击解锁商品' : '锁定商品保留至下一波'}"><span>${o.locked ? '🔒' : '🔓'}</span><span>${o.locked ? '已锁' : '锁定'}</span></button>
          <div class="card-actions">
            <button class="btn buy${hasMergePair ? ' merge-ready' : ''}" ${ok ? '' : 'disabled'}>
              <span>${hasMergePair ? (uiMode !== 'desktop' ? '⬆️合成' : '⬆️ 购买合成') : '购买'}</span>
              <span class="buy-price">💎 ${o.cost}</span>
            </button>
          </div>
        </div>`;
      el.querySelector('.buy').onclick = () => {
        confirmSellIdx = -1;
        player.mats -= o.cost;
        addOrMergeWeapon(o.id, o.tier);
        logInfo('SHOP', `购入武器 ${tpl.name} Lv.${o.tier} (-${o.cost}💎, 剩余=${player.mats}💎)`);
        shopOffers[i] = null;
        beep(520, 0.07, 'triangle');
        renderShop();
      };
    } else {
      const it = o.item, ok = player.mats >= o.cost;
      const ownedCnt = (player.items && player.items[it.id]) || 0;
      el.innerHTML = `
        <div class="card-main">
          <div class="card-head">
            <div class="item-emblem t${o.tier}">${it.icon}</div>
            <div class="card-meta">
              <div class="card-title">${it.name}</div>
              <div class="card-badges">
                <span class="tag t${o.tier}">${TIER_NAMES[o.tier]}道具</span>
                ${ownedCnt > 0 ? `<span class="tag tag-owned">已拥有 ×${ownedCnt}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="card-desc">${it.desc}</div>
          </div>
        </div>
        <div class="card-side">
          <button class="lock-pin lock${o.locked ? ' is-locked' : ''}" title="${o.locked ? '点击解锁商品' : '锁定商品保留至下一波'}"><span>${o.locked ? '🔒' : '🔓'}</span><span>${o.locked ? '已锁' : '锁定'}</span></button>
          <div class="card-actions">
            <button class="btn buy" ${ok ? '' : 'disabled'}>
              <span>购买</span>
              <span class="buy-price">💎 ${o.cost}</span>
            </button>
          </div>
        </div>`;
      el.querySelector('.buy').onclick = () => {
        confirmSellIdx = -1;
        player.mats -= o.cost;
        player.items[it.id] = (player.items[it.id] || 0) + 1;
        it.apply(player);
        if (it.id === 'recycler') {
          freeRerollsLeft++;
          rerollCost = 0;
        }
        syncSetHp();
        logInfo('SHOP', `购入道具 ${it.name} (-${o.cost}💎, 剩余=${player.mats}💎)`);
        shopOffers[i] = null;
        beep(520, 0.07, 'triangle');
        renderShop();
      };
    }
    el.querySelector('.lock').onclick = e => {
      if (e && e.stopPropagation) e.stopPropagation();
      confirmSellIdx = -1; o.locked = !o.locked; renderShop();
    };
    box.appendChild(el);
  });

  const sBox = document.getElementById('weaponSlots');
  sBox.innerHTML = '';
  if (player.maxSlots === 0) {
    document.getElementById('slotHint').textContent = '🐂 蛮牛铁卫特性：不可携带武器，堆叠生命、护甲、护盾与元素装备即可强化碰撞烈焰震荡波！';
  } else {
    const sellTipText = isTouch ? '连点两下回收单把' : '点击单把回收';
    document.getElementById('slotHint').innerHTML = `⚔️ 随身军械库 (<b>${player.weapons.length}</b>/${player.maxSlots}) · 同名同阶点击合成，${sellTipText}`;
    player.weapons.forEach((w, idx) => {
      const tpl = WEAPONS[w.id];
      const hasPair = w.tier < 4 && player.weapons.some((x, j) => j !== idx && x.id === w.id && x.tier === w.tier);
      const tierMul = [0, 1, 1.9, 3.0, 4.4][w.tier];
      const refund = Math.max(4, Math.round(tpl.cost * tierMul * getShopScale() * 0.35));
      const confirming = !hasPair && confirmSellIdx === idx && player.weapons.length > 1;
      const d = document.createElement('div');
      d.className = `slot t${w.tier}${confirming ? ' confirming' : ''}`;
      const mobSub = hasPair ? '⬆️ 点此合成' : (player.weapons.length > 1 ? `💰 回收 +${refund}` : '主武器');
      d.innerHTML = `${hasPair ? '<span class="merge-badge">⬆️合成</span>' : ''}
        <div class="slot-icon">${tpl.icon}</div>
        <div class="slot-name" style="color:${TIER_COLORS[w.tier]}">${tpl.name} Lv${w.tier}</div>
        <div class="slot-sub m-only">${mobSub}</div>
        <div class="sell-tip">${hasPair ? '⬆️ 点击合成' : (confirming ? '确认回收 +' + refund : '💰 回收 +' + refund)}</div>`;
      d.onclick = () => {
        if (hasPair) {
          confirmSellIdx = -1;
          mergeSlot(idx);
        } else if (player.weapons.length > 1) {
          if (isTouch && confirmSellIdx !== idx) {
            confirmSellIdx = idx;
            beep(400, 0.03, 'triangle');
            renderShop();
            return;
          }
          confirmSellIdx = -1;
          player.mats += refund; player.weapons.splice(idx, 1); syncSetHp(); beep(320, 0.06);
          logInfo('SHOP', `回收武器 ${tpl.name} Lv.${w.tier} (+${refund}💎)`);
        }
        renderShop();
      };
      sBox.appendChild(d);
    });
    const showMax = Math.min(player.maxSlots, 6);
    for (let k = player.weapons.length; k < showMax; k++) {
      const emp = document.createElement('div');
      emp.className = 'slot-empty';
      emp.innerHTML = `<span>+ 空槽</span>`;
      sBox.appendChild(emp);
    }
  }
}

function rerollShop() {
  const actualCost = freeRerollsLeft > 0 ? 0 : rerollCost;
  if (player.mats < actualCost) return;
  confirmSellIdx = -1;
  if (mobDrawerOpen) {
    mobDrawerOpen = false;
    const sm = document.getElementById('shopMenu');
    if (sm) sm.classList.remove('drawer-open');
    const arr = document.getElementById('mobDrawerArrow');
    if (arr) arr.textContent = '详情 ▾';
  }
  player.mats -= actualCost;
  if (freeRerollsLeft > 0) {
    freeRerollsLeft--;
    rerollCost = freeRerollsLeft > 0 ? 0 : rerollBase;
  } else {
    rerollCost = rerollBase + Math.max(1, (rerollCost - rerollBase) + rerollStep);
  }
  shopOffers = shopOffers.map(o => (o && o.locked) ? o : null).filter(Boolean);
  rollOffers(); beep(440, 0.05); renderShop();
}

function nextWave() { wave++; beginWave(); }

function endGame(win) {
  state = 'end';
  resetJoy();
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  const cm = document.getElementById('crateMenu');
  if (cm) cm.classList.add('hidden');
  const em = document.getElementById('endMenu');
  em.classList.remove('hidden');
  em.scrollTop = 0;
  document.getElementById('endlessBtn').classList.toggle('hidden', !win);
  const clsObj = CLASSES.find(c => c.id === player.cls);
  logInfo('END', `${win ? '通关胜利' : '战败结束'} · 角色=${clsObj ? clsObj.name : player.cls} · 波次=${wave} · Lv=${player.lv} · 击杀=${player.kills}`);
  document.getElementById('endTitle').textContent = win ? '🏆 恭喜通关 12 波！异星土豆战神！' : '💀 土豆变成热腾腾的薯泥了…';
  document.getElementById('endDesc').innerHTML =
    `难度：<b>${diff.badge}</b> · 角色：<b>${clsObj ? clsObj.name : ''}</b> · 到达：<b>${endlessMode ? '无尽第 ' + wave + ' 波' : '第 ' + wave + ' 波'}</b> · 等级：<b>Lv.${player.lv}</b> · 击杀：<b>${player.kills}</b>`;
}

function continueEndless() {
  endlessMode = true;
  beep(620, 0.09, 'triangle');
  document.getElementById('endMenu').classList.add('hidden');
  advancePostWave();
}
