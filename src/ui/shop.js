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
  const matRate = 0.94 / (1 + Math.max(0, wave - 1) * 0.19);
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

// 严格受控的战利品与商店品质概率曲线（幸运收益递减软上限，杜绝后期满屏传说刷屏）
function rollShopTier(waveNum, luck) {
  const luckF = Math.min(1, Math.max(0, luck || 0) / 90);
  const p4 = waveNum < 6 ? 0 : Math.min(0.08, 0.010 + (waveNum - 6) * 0.0065 + luckF * 0.025);
  const p3 = waveNum < 3 ? 0 : Math.min(0.25, 0.035 + (waveNum - 3) * 0.018 + luckF * 0.045);
  const p2 = waveNum < 2 ? 0 : Math.min(0.42, 0.18 + (waveNum - 2) * 0.032 + luckF * 0.04);
  const u = Math.random();
  if (u < p4) return 4;
  if (u < p4 + p3) return 3;
  if (u < p4 + p3 + p2) return 2;
  return 1;
}

function rollCrateTier(waveNum, luck, isBossCrate = false) {
  const luckF = Math.min(1, Math.max(0, luck || 0) / 90);
  const p4 = waveNum < 5 ? 0 : Math.min(isBossCrate ? 0.14 : 0.10, (isBossCrate ? 0.035 : 0.012) + (waveNum - 5) * 0.0075 + luckF * 0.028);
  const p3 = waveNum < 3 ? 0 : Math.min(isBossCrate ? 0.34 : 0.28, (isBossCrate ? 0.14 : 0.055) + (waveNum - 3) * 0.020 + luckF * 0.055);
  const p2 = waveNum < 2 ? (isBossCrate ? 0.45 : 0.22) : Math.min(0.46, 0.28 + (waveNum - 2) * 0.024);
  const u = Math.random();
  if (u < p4) return 4;
  if (u < p4 + p3) return 3;
  if (u < p4 + p3 + p2) return 2;
  return (isBossCrate && waveNum >= 4) ? 2 : 1;
}

function isItemAvailable(it, excludeSet = null, checkWaveMin = false) {
  if (!it || (excludeSet && excludeSet.has(it.id))) return false;
  if (checkWaveMin && ((it.tier >= 4 && wave < 5) || (it.tier >= 3 && wave < 3))) return false;
  const ownedCnt = (player && player.items && player.items[it.id]) || 0;
  if (it.maxCount && ownedCnt >= it.maxCount) return false;
  return true;
}

function getPlayerBuildAffinities() {
  const tags = new Set();
  if (!player) return tags;
  if (player.cls === 'engineer' || (player.bonusTurrets || 0) > 0 || (player.laserTurrets || 0) > 0 || (player.mineLayers || 0) > 0 || (player.techBonus || 0) > 0) tags.add('tech');
  if (player.cls === 'brawler' || (player.meleeBonus || 0) >= 0.12) tags.add('melee');
  if (player.cls === 'vampire' || (player.lifesteal || 0) >= 0.08) tags.add('vampire');
  if (player.cls === 'bull' || (player.armor || 0) >= 4 || (player.maxHp || 30) >= 48) tags.add('tank');
  if ((player.elemBonus || 0) >= 0.10 || (player.burnChance || 0) + (player.chillChance || 0) + (player.poisonChance || 0) >= 0.18) tags.add('elemental');
  if ((player.blastChance || 0) > 0 || (player.explosionScale || 1) > 1.05) tags.add('explosive');
  for (const w of (player.weapons || [])) {
    const tpl = WEAPONS[w.id];
    if (!tpl) continue;
    if (tpl.melee) tags.add('melee');
    else tags.add('ranged');
    if (tpl.set === 'tech') tags.add('tech');
    if (tpl.set === 'elemental') tags.add('elemental');
    if (tpl.set === 'heavy') { tags.add('tank'); tags.add('explosive'); }
    if (tpl.set === 'precise') tags.add('crit');
  }
  return tags;
}

function pickWeightedItem(targetTier, excludeSet = new Set(), checkWaveMin = false) {
  const tierOrder = [];
  for (let t = targetTier; t >= 1; t--) tierOrder.push(t);
  for (let t = targetTier + 1; t <= 4; t++) tierOrder.push(t);

  const isWeaponless = player && player.maxSlots === 0;
  let pool = [];
  for (const t of tierOrder) {
    pool = ITEMS.filter(it => it.tier === t && (!isWeaponless || !it.weaponOnly) && isItemAvailable(it, excludeSet, checkWaveMin));
    if (pool.length > 0) break;
  }
  if (!pool.length) {
    pool = ITEMS.filter(it => (!isWeaponless || !it.weaponOnly) && isItemAvailable(it, excludeSet, false));
  }
  if (!pool.length) {
    pool = ITEMS.filter(it => isItemAvailable(it, excludeSet, false));
  }
  if (!pool.length) return null;

  const recent = (player && player.recentCrateIds) || [];
  const affinities = getPlayerBuildAffinities();
  let totalW = 0;
  const weights = pool.map(it => {
    const ownedCnt = (player && player.items && player.items[it.id]) || 0;
    const recentPenalty = recent.includes(it.id) ? 2.6 : 0;
    let affinityMul = 1.0;
    if (Array.isArray(it.tags) && it.tags.some(tg => affinities.has(tg))) {
      affinityMul = 1.32;
    }
    const w = affinityMul / (1 + ownedCnt * 1.15 + recentPenalty);
    totalW += w;
    return w;
  });

  let r = Math.random() * totalW;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function recordCrateHistory(itemId) {
  if (!player || !itemId) return;
  if (!Array.isArray(player.recentCrateIds)) player.recentCrateIds = [];
  player.recentCrateIds.push(itemId);
  if (player.recentCrateIds.length > 6) player.recentCrateIds.shift();
}

function buildCrateWeaponChoice(isBossCrate) {
  if (!player || player.maxSlots <= 0) return null;
  const wTier = Math.max(1, rollCrateTier(wave, player.luck || 0, isBossCrate));
  const wKeys = Object.keys(WEAPONS).filter(k => {
    const effT = Math.max(wTier, WEAPONS[k].minTier || 1);
    return effT <= 4 && (WEAPONS[k].minTier || 1) <= wTier && canBuyWeapon(k, effT);
  });
  if (!wKeys.length) return null;

  let pickedId = wKeys[Math.floor(Math.random() * wKeys.length)];
  if (player.weapons.length && Math.random() < 0.45) {
    const mergeCands = wKeys.filter(k => {
      const effT = Math.max(wTier, WEAPONS[k].minTier || 1);
      return player.weapons.some(w => w.id === k && w.tier === effT && w.tier < 4);
    });
    if (mergeCands.length && Math.random() < 0.65) {
      pickedId = mergeCands[Math.floor(Math.random() * mergeCands.length)];
    } else {
      const owned = player.weapons[Math.floor(Math.random() * player.weapons.length)].id;
      const ownedTpl = WEAPONS[owned];
      const sameSet = ownedTpl ? wKeys.filter(k => WEAPONS[k] && WEAPONS[k].set === ownedTpl.set) : [];
      if (sameSet.length) pickedId = sameSet[Math.floor(Math.random() * sameSet.length)];
    }
  }

  const tpl = WEAPONS[pickedId];
  const effTier = Math.min(4, Math.max(wTier, tpl.minTier || 1));
  const tierMul = [0, 1, 1.9, 3.0, 4.4][effTier];
  const recycleVal = Math.max(8, Math.round(tpl.cost * tierMul * getShopScale() * 0.48));
  const canMergeNow = player.weapons.some(w => w.id === pickedId && w.tier === effTier && w.tier < 4);
  return { kind: 'weapon', id: pickedId, tpl, tier: effTier, recycleVal, canMergeNow };
}

function showCrateMenu() {
  state = 'crate';
  const cm = document.getElementById('crateMenu');
  if (!cm) { pendingCrates = 0; advancePostWave(); return; }
  cm.classList.remove('hidden');
  cm.scrollTop = 0;

  const isMythicCrate = (player.mythicCratesQueued || 0) > 0;
  const isBossCrate = isMythicCrate || (player.bossCratesQueued || 0) > 0;
  const ct = document.getElementById('crateTitle');
  if (ct) {
    ct.textContent = `${isMythicCrate ? '⚡ 开启神话二阶段秘宝舱！（必出传说）' : (isBossCrate ? '👑 开启首领秘宝舱！' : '🎁 开启异星战术补给箱！')}（剩余 ${pendingCrates} 个）`;
  }

  const luck = player.luck || 0;
  const excludeIds = new Set();
  const choices = [];

  // 选项 1：防重复加权战利品道具（神话二阶段宝箱保底必出 T4 传说！）
  const t1 = isMythicCrate ? 4 : rollCrateTier(wave, luck, isBossCrate);
  const item1 = pickWeightedItem(t1, excludeIds, !isMythicCrate);
  if (item1) {
    excludeIds.add(item1.id);
    recordCrateHistory(item1.id);
    choices.push({
      kind: 'item',
      item: item1,
      tier: item1.tier,
      recycleVal: Math.max(8, Math.round(item1.cost * getShopScale() * 0.52))
    });
  }

  // 选项 2：动态提供【武器空投】、【异星战术补给核】或【第二件不重复道具】（神话宝箱提供神话龙血神髓或第二件传说！）
  const modeR = Math.random();
  let secondChoice = null;
  if (isMythicCrate) {
    const item2 = pickWeightedItem(4, excludeIds, false);
    if (item2 && item2.tier === 4 && Math.random() < 0.65) {
      excludeIds.add(item2.id);
      recordCrateHistory(item2.id);
      secondChoice = {
        kind: 'item',
        item: item2,
        tier: 4,
        recycleVal: Math.max(18, Math.round(item2.cost * getShopScale() * 0.55))
      };
    } else {
      secondChoice = {
        kind: 'supply',
        supply: {
          id: 'sup_mythic_dragon', name: '神话真红神髓', icon: '🐉', tier: 4, cost: 72,
          desc: '【二阶段神话秘宝】全体伤害永久 +22%，暴击伤害 +45%，并立即回满全部生命！',
          apply: p => { p.dmgMul += 0.22; p.critDmg = (p.critDmg || 0) + 0.45; p.hp = p.maxHp; }
        },
        tier: 4,
        recycleVal: Math.max(24, Math.round(42 * getShopScale()))
      };
    }
  } else if (player.maxSlots > 0 && modeR < 0.42) {
    secondChoice = buildCrateWeaponChoice(isBossCrate);
  } else if (modeR < 0.76 && typeof CRATE_SUPPLIES !== 'undefined' && CRATE_SUPPLIES.length > 0) {
    const sup = CRATE_SUPPLIES[Math.floor(Math.random() * CRATE_SUPPLIES.length)];
    secondChoice = {
      kind: 'supply',
      supply: sup,
      tier: sup.tier || 2,
      recycleVal: Math.max(10, Math.round((sup.cost || 28) * getShopScale() * 0.50))
    };
  }
  if (!secondChoice) {
    const t2 = rollCrateTier(wave, luck, isBossCrate);
    const item2 = pickWeightedItem(t2, excludeIds, true);
    if (item2) {
      excludeIds.add(item2.id);
      recordCrateHistory(item2.id);
      secondChoice = {
        kind: 'item',
        item: item2,
        tier: item2.tier,
        recycleVal: Math.max(8, Math.round(item2.cost * getShopScale() * 0.52))
      };
    }
  }
  if (secondChoice) choices.push(secondChoice);
  if (!choices.length) {
    // 极端深无尽全唯一道具拿满时的兜底补给核，彻底杜绝开箱界面无选项卡死
    const fbSup = (typeof CRATE_SUPPLIES !== 'undefined' && CRATE_SUPPLIES.length > 0)
      ? CRATE_SUPPLIES[Math.floor(Math.random() * CRATE_SUPPLIES.length)]
      : { id: 'sup_fallback_core', name: '超载能量晶核', icon: '⚡', tier: 3, cost: 36, desc: '全体伤害永久 +10%，最大生命 +6，并恢复满状态！', apply: p => { p.dmgMul += 0.10; p.maxHp += 6; p.hp = p.maxHp; } };
    choices.push({
      kind: 'supply',
      supply: fbSup,
      tier: fbSup.tier || 3,
      recycleVal: Math.max(14, Math.round((fbSup.cost || 32) * getShopScale() * 0.55))
    });
  }

  const consumeCrate = () => {
    if (isMythicCrate && player.mythicCratesQueued > 0) player.mythicCratesQueued--;
    else if (isBossCrate && player.bossCratesQueued > 0) player.bossCratesQueued--;
    pendingCrates--;
    advancePostWave();
  };

  const box = document.getElementById('crateBox');
  box.innerHTML = '';
  box.classList.toggle('single', choices.length <= 1);

  choices.forEach(c => {
    const el = document.createElement('div');
    el.className = `card t${c.tier}`;
    let icon = '🎁', title = '', badgesHtml = '', descHtml = '';
    if (isMythicCrate) badgesHtml += `<span class="tag t4">⚡ 神话二阶段</span>`;
    else if (isBossCrate) badgesHtml += `<span class="tag tag-merge">👑 首领秘宝</span>`;

    if (c.kind === 'item') {
      const it = c.item;
      const ownedCnt = (player.items && player.items[it.id]) || 0;
      icon = it.icon;
      title = it.name;
      badgesHtml += `<span class="tag t${it.tier}">${TIER_NAMES[it.tier]}道具</span>`;
      if (it.maxCount) badgesHtml += `<span class="tag">${it.maxCount === 1 ? '唯一' : '限×' + it.maxCount}</span>`;
      if (ownedCnt > 0) badgesHtml += `<span class="tag tag-owned">已拥有 ×${ownedCnt}</span>`;
      descHtml = `<div class="card-desc">${it.desc}</div>`;
    } else if (c.kind === 'weapon') {
      const tpl = c.tpl;
      const setLabel = (SET_DEFS[tpl.set] && SET_DEFS[tpl.set].label) || '';
      icon = tpl.icon;
      title = `${tpl.name} Lv${c.tier}`;
      badgesHtml += `<span class="tag t${c.tier}">⚔️ ${TIER_NAMES[c.tier]}空投</span>`;
      if (setLabel) badgesHtml += `<span class="tag">${setLabel}</span>`;
      if (c.canMergeNow) badgesHtml += `<span class="tag tag-merge">⬆️ 可直接合成</span>`;
      descHtml = `<div class="card-desc">${tpl.desc}</div>`;
    } else if (c.kind === 'supply') {
      const sup = c.supply;
      icon = sup.icon;
      title = sup.name;
      badgesHtml += `<span class="tag t${c.tier}">⚡ 战术补给核</span>`;
      descHtml = `<div class="card-desc">${sup.desc}</div>`;
    }

    el.innerHTML = `
      <div class="card-head" style="padding-right:0">
        <div class="item-emblem t${c.tier}">${icon}</div>
        <div class="card-meta">
          <div class="card-title">${title}</div>
          <div class="card-badges">${badgesHtml}</div>
        </div>
      </div>
      <div class="card-body">
        ${descHtml}
        <div class="crate-btns">
          <button class="btn take-btn" style="justify-content:center">🎁 选此补给</button>
          <button class="btn btn-sec recycle-btn" style="justify-content:center">♻️ 熔炼 (+${c.recycleVal}💎)</button>
        </div>
      </div>`;

    el.querySelector('.take-btn').onclick = () => {
      if (c.kind === 'item') {
        player.items[c.item.id] = (player.items[c.item.id] || 0) + 1;
        c.item.apply(player);
        logInfo('CRATE', `收下战利品道具 ${c.item.name} (T${c.tier}${isBossCrate ? ', 首领箱' : ''})`);
      } else if (c.kind === 'weapon') {
        addOrMergeWeapon(c.id, c.tier);
        logInfo('CRATE', `收下空投武器 ${c.tpl.name} Lv.${c.tier}`);
      } else if (c.kind === 'supply') {
        c.supply.apply(player, wave);
        logInfo('CRATE', `激活战术补给 ${c.supply.name}`);
      }
      syncSetHp();
      beep(660, 0.09, 'triangle');
      consumeCrate();
    };
    el.querySelector('.recycle-btn').onclick = () => {
      player.mats += c.recycleVal;
      beep(480, 0.07, 'sine');
      logInfo('CRATE', `熔炼补给 ${title} (+${c.recycleVal}💎)`);
      consumeCrate();
    };
    box.appendChild(el);
  });
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
  const luck = player.luck || 0;
  let guard = 0;
  while (locked.length < 4 && guard++ < 40) {
    const isWeapon = player.maxSlots > 0 && Math.random() < 0.54;
    const tier = rollShopTier(wave, luck);

    if (isWeapon) {
      const validW = wKeys.filter(k => (WEAPONS[k].minTier || 1) <= tier);
      if (!validW.length) continue;
      // 若已有某套装武器，轻微提升同系或同把刷出率便于合成与凑羁绊
      let id = validW[Math.floor(Math.random() * validW.length)];
      if (player.weapons.length && Math.random() < 0.28) {
        const owned = player.weapons[Math.floor(Math.random() * player.weapons.length)].id;
        const ownedTpl = WEAPONS[owned];
        const sameSet = ownedTpl ? validW.filter(k => WEAPONS[k] && WEAPONS[k].set === ownedTpl.set) : [];
        if (validW.includes(owned) && Math.random() < 0.5) id = owned;
        else if (sameSet.length) id = sameSet[Math.floor(Math.random() * sameSet.length)];
      }
      const tpl = WEAPONS[id];
      const effTier = Math.max(tier, tpl.minTier || 1);
      const tierMul = [0, 1, 1.9, 3.0, 4.4][effTier];
      const cost = Math.max(2, Math.round(tpl.cost * tierMul * shopScale * discountMul));
      locked.push({ kind: 'weapon', id, tier: effTier, cost, locked: false });
    } else {
      const it = pickWeightedItem(tier, usedItems, true);
      if (!it) continue;
      usedItems.add(it.id);
      const ownedCnt = (player.items && player.items[it.id]) || 0;
      const cost = Math.max(2, Math.round(it.cost * shopScale * (1 + ownedCnt * 0.22) * discountMul));
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
        const uwName = (WEAPONS[uw.id] && WEAPONS[uw.id].name) || uw.id;
        anvilUpgradedMsg = ` · ⚒️ 神砧免费升阶【${uwName} Lv${uw.tier}】!`;
        logInfo('SHOP', `铁匠神砧自动升阶 ${uwName} -> Lv.${uw.tier}`);
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
      if (!tpl) return;
      const sLabel = SET_DEFS[tpl.set] ? SET_DEFS[tpl.set].label : '';
      const scale = tpl.set === 'elemental' ? getElemMul() : (tpl.techScale ? getTechMul() : 1);
      const aspdBonus = tpl.aspdScale ? Math.max(0, getEffectiveAtkSpd() - 1) * 9 : 0;
      const rngBonus = tpl.rangeScale ? Math.max(0, totalRange) * tpl.rangeScale : 0;
      const hpBonus = tpl.hpScale ? Math.max(0, player.maxHp) * tpl.hpScale : 0;
      const armBonus = tpl.armorScale ? Math.max(0, getTotalArmor()) * tpl.armorScale : 0;
      const dmg = Math.round((tpl.dmg + aspdBonus + rngBonus + hpBonus + armBonus) * (1 + (o.tier - 1) * 0.55) * (getEffectiveDmgMul() + (tpl.melee ? player.meleeBonus : 0)) * scale);
      const effRange = Math.max(68, tpl.range + (tpl.melee ? Math.round(totalRange * 0.55 + (player.meleeSweepBonus || 0) * 18) : totalRange) + (o.tier - 1) * 16);
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
      const it = o.item;
      if (!it) return;
      const ok = player.mats >= o.cost;
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
      if (!tpl) return;
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
