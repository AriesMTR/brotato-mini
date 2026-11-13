// 波次结算流转、战利品宝箱、记忆信物与风亭整备。
// 一个楼层只接受一种最终结果，异步演出回调也必须属于同一个玩家/楼层实例。
let spireFloorFlow = null;
let spireFloorSerial = 0;
const SPIRE_MEMENTO_KEYS = ['jinyu', 'astria', 'jialan', 'qingyu'];

function getSpireStoryProgress() {
  if (!player) return null;
  if (!player.story || typeof player.story !== 'object') player.story = {};
  const story = player.story;
  if (!story.mementos || typeof story.mementos !== 'object') story.mementos = {};
  if (!story.memories || typeof story.memories !== 'object') story.memories = {};
  if (!story.clearedFloors || typeof story.clearedFloors !== 'object') story.clearedFloors = {};
  return story;
}

function grantSpireMemento(key) {
  if (endlessMode || !SPIRE_MEMENTO_KEYS.includes(key)) return false;
  const story = getSpireStoryProgress();
  if (!story) return false;
  story.mementos[key] = true;
  return true;
}

function rememberSpireMemento(key) {
  const story = getSpireStoryProgress();
  if (endlessMode || !story || !SPIRE_MEMENTO_KEYS.includes(key) || !story.mementos[key]) return false;
  story.memories[key] = true;
  return true;
}

function hasSpireTrueEnding() {
  const story = getSpireStoryProgress();
  return !!story && SPIRE_MEMENTO_KEYS.every(key => story.mementos[key] && story.memories[key]);
}

function beginSpireFloor(floor, isRetry) {
  spireFloorFlow = {
    serial: ++spireFloorSerial, floor, player, result: 'active', rewardsGranted: false,
    awaitingChoice: !endlessMode && floor === MAX_WAVE
  };
  if (!endlessMode) {
    const story = getSpireStoryProgress();
    story.ending = null;
    if (floor === 15 && isRetry) grantSpireMemento('qingyu');
    if (floor === MAX_WAVE) {
      const canResumeFight = isRetry && story.finalChoice === 'refuse' && hasSpireTrueEnding();
      spireFloorFlow.awaitingChoice = !canResumeFight;
      if (!canResumeFight) story.finalChoice = null;
    }
  }
}

function isCurrentSpireFlow(flow) {
  return !!flow && flow === spireFloorFlow && flow.player === player && flow.floor === wave;
}

function isSpireCombatSuspended() {
  return !!spireFloorFlow && isCurrentSpireFlow(spireFloorFlow) &&
    (spireFloorFlow.result !== 'active' || spireFloorFlow.awaitingChoice);
}

function stopSpireCombat(flow, result) {
  if (!isCurrentSpireFlow(flow) || flow.result !== 'active') return false;
  flow.result = result;
  flow.awaitingChoice = false;
  state = 'story';
  resetJoy();
  for (const key in keys) keys[key] = false;
  eBullets.length = 0;
  bullets.length = 0;
  hazards.length = 0;
  spawns.length = 0;
  bossCutscene = null;
  if (typeof pendingBossCutscene !== 'undefined') pendingBossCutscene = null;
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  return true;
}

function resolveSpireBossDefeat(enemy) {
  const flow = spireFloorFlow;
  if (!player || player.hp <= 0 || !isCurrentSpireFlow(flow) || flow.result !== 'active') return;
  // 一阶绝不能从这里通过：护栏也覆盖调试/外部伤害入口。
  if (enemy.storyPhaseBoss && enemy.storyStage !== 2) {
    enemy._storyDefeatQueued = false;
    triggerBossMythicPhase2(enemy);
    return;
  }
  // 第 4 / 8 / 12 层主线首领若在波次倒计时结束前被提前击败：
  // 立即爆出首领晶石与秘宝箱，清空残留首领弹幕，保留剩余波次时间继续刷小怪攒钱，待倒计时归零再进告别演出与商店！
  if (wave < MAX_WAVE && !overtime && waveTime > 0.6) {
    flow.bossDefeated = true;
    flow.defeatedBossVariant = enemy.variant;
    eBullets.length = 0;
    hazards.length = 0;
    bossCutscene = null;
    if (typeof pendingBossCutscene !== 'undefined') pendingBossCutscene = null;
    player.invuln = 0;
    awardEnemyRewards(enemy);
    return;
  }
  if (!stopSpireCombat(flow, 'boss-defeated')) return;
  flow.bossDefeated = true;
  enemies.forEach(other => { if (other !== enemy) other.hp = 0; });
  player.invuln = 0;
  const memento = ({ 4: 'jinyu', 8: 'astria', 12: 'jialan' })[wave];
  if (memento) grantSpireMemento(memento);
  const finish = () => {
    if (!isCurrentSpireFlow(flow) || flow.result !== 'boss-defeated' || flow.rewardsGranted || player.hp <= 0) return;
    if (wave < MAX_WAVE) awardEnemyRewards(enemy);
    else if (!enemy._rewarded) { enemy._rewarded = true; player.kills++; }
    settleSpireFloor(flow);
  };
  if (typeof SpireDirector !== 'undefined' && typeof SpireDirector.onBossDefeated === 'function') {
    SpireDirector.onBossDefeated(wave, enemy.variant, finish);
  } else finish();
}

function resolveSpireFinalChoice(choice) {
  const flow = spireFloorFlow;
  if (endlessMode || wave !== MAX_WAVE || !isCurrentSpireFlow(flow) || flow.result !== 'active' ||
      !flow.awaitingChoice || !player || player.hp <= 0) return false;
  if (choice === 'refuse') {
    if (!hasSpireTrueEnding()) return false;
    getSpireStoryProgress().finalChoice = 'refuse';
    // 镜前补完的记忆与选择进入同层检查点；重试不会丢失刚亲自确认的约定。
    if (waveCheckpoint && waveCheckpoint.wave === wave && waveCheckpoint.player) {
      waveCheckpoint.player.story = JSON.parse(JSON.stringify(getSpireStoryProgress()));
      if (typeof SpireSave !== 'undefined' && SpireSave) SpireSave.write(waveCheckpoint);
    }
    flow.awaitingChoice = false;
    state = 'wave';
    document.getElementById('hud').classList.remove('hidden');
    return true;
  }
  if (choice === 'accept') {
    getSpireStoryProgress().finalChoice = 'accept';
    if (!stopSpireCombat(flow, 'ending')) return false;
    playSpireEnding('A', flow);
    return true;
  }
  return false;
}

function playSpireEnding(ending, flow) {
  if (!isCurrentSpireFlow(flow) || flow.endingStarted) return;
  if (ending === 'B' && (!flow.bossDefeated || !hasSpireTrueEnding() || getSpireStoryProgress().finalChoice !== 'refuse')) return;
  flow.endingStarted = true;
  flow.result = 'ending';
  state = 'story';
  const story = getSpireStoryProgress();
  story.ending = ending;
  const done = () => {
    if (!isCurrentSpireFlow(flow) || flow.result !== 'ending') return;
    flow.result = 'ended';
    try {
      const records = JSON.parse(localStorage.getItem('spire-endings-v2') || '{}');
      records[ending] = true;
      localStorage.setItem('spire-endings-v2', JSON.stringify(records));
    } catch (_) { /* Private browsing may disallow storage; the ending still completes. */ }
    if (typeof SpireSave !== 'undefined' && SpireSave) SpireSave.clear();
    waveCheckpoint = null;
    showSpireEndMenu(true, ending);
  };
  if (typeof SpireDirector !== 'undefined' && typeof SpireDirector.playEnding === 'function') {
    SpireDirector.playEnding(ending, done);
  } else done();
}

function settleSpireFloor(flow) {
  if (!isCurrentSpireFlow(flow) || flow.rewardsGranted || !player || player.hp <= 0) return;
  flow.rewardsGranted = true;
  const story = !endlessMode ? getSpireStoryProgress() : null;
  if (story) story.clearedFloors[wave] = true;
  if (!endlessMode && wave === MAX_WAVE) {
    if (story.finalChoice === 'refuse' && hasSpireTrueEnding()) playSpireEnding('B', flow);
    return;
  }
  // 剧场关闭后再回收战利品，避免箱子/奖励卡压在告别台词上。
  if (!endlessMode) {
    for (const drop of drops) {
      if (drop.kind !== 'crate') continue;
      if (drop.isMythic || pendingCrates < 3) {
        pendingCrates++;
        if (drop.isMythic) player.mythicCratesQueued = (player.mythicCratesQueued || 0) + 1;
        else if (drop.isBoss) player.bossCratesQueued = (player.bossCratesQueued || 0) + 1;
      } else player.mats += 16 + wave * 3;
    }
  }
  settleWaveRewards();
  flow.result = 'settled';
  drops.length = 0;
  advancePostWave();
}

// 波次结算流转、战利品宝箱、基因强化、五阶神话二选一进化与军火商店交互
const WEAPON_TIER_COST_MUL = [0, 1, 1.9, 3.0, 4.4, 6.4];
let _evoResumeCb = null;
let _evoUiSerial = 0;

function resetWeaponEvolutionUI() {
  _evoUiSerial++;
  _evoResumeCb = null;
  const modal = typeof document !== 'undefined' ? document.getElementById('evoModal') : null;
  if (modal) modal.classList.add('hidden');
}

function _wpnEmblem(id, tier, evoId, fallbackIcon) {
  if (typeof renderWeaponEmblemHtml === 'function') {
    return renderWeaponEmblemHtml(id, tier, evoId || '', fallbackIcon);
  }
  return fallbackIcon || '⚔️';
}

function getPendingEvoWeapon() {
  if (!player || !Array.isArray(player.weapons)) return null;
  for (let i = 0; i < player.weapons.length; i++) {
    const w = player.weapons[i];
    const tpl = w && WEAPONS[w.id];
    if (w && w.tier >= 5 && !w.evo && tpl && Array.isArray(tpl.evos) && tpl.evos.length >= 2) {
      return w;
    }
  }
  return null;
}

function applyWeaponEvolution(w, evoIdx) {
  if (!w) return null;
  const tpl = WEAPONS[w.id];
  if (!tpl || !Array.isArray(tpl.evos) || !tpl.evos.length) return null;
  const opt = tpl.evos[evoIdx] || tpl.evos[0];
  w.tier = 5;
  w.evo = opt.id;
  w.evoName = opt.name;
  w.evoColor = opt.color || '#ff5c8a';
  w.evoTag = opt.tag || '神话进化';
  if (player) player._sbCache = null;
  syncSetHp();
  logInfo('EVO', `兵装五阶神话进化：${tpl.name} -> 【${opt.name}】(${opt.tag})`);
  return opt;
}

function checkPendingWeaponEvolutions(onAllResolved) {
  if (typeof onAllResolved === 'function') _evoResumeCb = onAllResolved;
  const serial = ++_evoUiSerial;
  const owner = player;
  const ownerWave = wave;
  const targetW = getPendingEvoWeapon();
  const modal = typeof document !== 'undefined' ? document.getElementById('evoModal') : null;
  if (!targetW) {
    if (modal) modal.classList.add('hidden');
    const cb = _evoResumeCb;
    _evoResumeCb = null;
    if (typeof cb === 'function') cb();
    return false;
  }
  if (!modal) {
    // 无弹窗节点兜底自动觉醒第一分支，防止任何环境下流程阻塞
    applyWeaponEvolution(targetW, 0);
    return checkPendingWeaponEvolutions();
  }

  const tpl = WEAPONS[targetW.id];
  const titleEl = document.getElementById('evoTitle');
  const subEl = document.getElementById('evoSub');
  const box = document.getElementById('evoChoices');
  if (titleEl) titleEl.textContent = `【${tpl.name}】晋升五阶神话 · 二选一终极进化`;
  if (subEl) subEl.textContent = tpl.melee
    ? '择定唯一神话觉醒方向，永久重塑兵装圣徽并额外觉醒 40% 概率斩碎敌弹！'
    : '择定唯一神话觉醒方向，永久重塑兵装圣徽外观与专属战斗机制';
  if (box) {
    box.innerHTML = '';
    const sLabel = SET_DEFS[tpl.set] ? SET_DEFS[tpl.set].label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '') : '';
    tpl.evos.slice(0, 2).forEach((opt, idx) => {
      const card = document.createElement('div');
      card.className = 'card t5 evo-choice-card';
      card.style.borderColor = opt.color || '#ff5c8a';
      if (card.style && typeof card.style.setProperty === 'function') {
        card.style.setProperty('--evo-accent', opt.color || '#ff5c8a');
      }
      const artHtml = _wpnEmblem(targetW.id, 5, opt.id, tpl.icon);
      card.innerHTML = `
        <div class="evo-branch-ribbon">BRANCH ${idx === 0 ? 'I' : 'II'} · 二选一神话分支</div>
        <div class="evo-art-stage">
          <div class="item-emblem t5 evo-emblem" style="border-color:${opt.color || '#ff5c8a'}">${artHtml}</div>
          <div class="evo-meta">
            <div class="evo-name" style="color:${opt.color || '#ffd6e5'}">${opt.name}</div>
            <div class="card-badges">
              <span class="tag t5">${opt.tag || '神话进化'}</span>
              ${sLabel ? `<span class="tag">${sLabel}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-desc evo-desc">${opt.desc}</div>
          <div class="card-actions">
            <button type="button" class="btn btn-go evo-pick-btn">◆ 觉醒「${opt.name}」</button>
          </div>
        </div>`;
      const pick = () => {
        // 已销毁的卡片与双击均不能修改新一局或覆盖已经选定的分支。
        if (serial !== _evoUiSerial || player !== owner || wave !== ownerWave ||
            targetW !== getPendingEvoWeapon()) return;
        applyWeaponEvolution(targetW, idx);
        beep(880, 0.14, 'triangle', 0.08);
        if (state === 'shop') renderShop();
        checkPendingWeaponEvolutions();
      };
      const btn = card.querySelector('.evo-pick-btn');
      if (btn) btn.onclick = e => { if (e && e.stopPropagation) e.stopPropagation(); pick(); };
      if (uiMode !== 'desktop') card.onclick = pick;
      box.appendChild(card);
    });
  }
  modal.classList.remove('hidden');
  modal.scrollTop = 0;
  return true;
}

function advancePostWave() {
  if (getPendingEvoWeapon()) {
    const flow = spireFloorFlow;
    checkPendingWeaponEvolutions(() => {
      if (isCurrentSpireFlow(flow) && flow.result === 'settled') advancePostWave();
    });
    return;
  }
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
  if (!player || player.hp <= 0 || state !== 'wave') return;
  const flow = spireFloorFlow;
  if (!isCurrentSpireFlow(flow) || flow.result !== 'active' || flow.rewardsGranted || flow.awaitingChoice) return;
  // 首领层必须先完成首领第二阶段讨伐，绝不能靠计时归零绕过首领；击败首领后刷完剩余小怪计时归零即可正常结算！
  if (!endlessMode && wave % 4 === 0 && !flow.bossDefeated) return;
  if (!stopSpireCombat(flow, 'floor-cleared')) return;
  if (!endlessMode && wave < MAX_WAVE && wave % 4 === 0 && flow.bossDefeated) {
    const memento = ({ 4: 'jinyu', 8: 'astria', 12: 'jialan' })[wave];
    if (memento) grantSpireMemento(memento);
  }
  const done = () => {
    if (!isCurrentSpireFlow(flow) || flow.result !== 'floor-cleared') return;
    settleSpireFloor(flow);
  };
  if (!endlessMode && typeof SpireDirector !== 'undefined') {
    if (wave < MAX_WAVE && wave % 4 === 0 && flow.bossDefeated && typeof SpireDirector.onBossDefeated === 'function') {
      SpireDirector.onBossDefeated(wave, flow.defeatedBossVariant || null, done);
      return;
    }
    if (typeof SpireDirector.onFloorCleared === 'function') {
      SpireDirector.onFloorCleared(wave, done);
      return;
    }
  }
  done();
}

function settleWaveRewards() {
  resetJoy();
  beep(660, 0.18, 'triangle', 0.07);
  let leftoverMats = 0;
  for (let i = 0; i < drops.length; i++) {
    if (drops[i].kind === 'mat') leftoverMats += (drops[i].val || 1);
  }
  const crystalMul = typeof CRYSTAL_YIELD_MUL === 'number' ? CRYSTAL_YIELD_MUL : 0.70;
  const matRate = typeof getWaveMatRate === 'function' ? getWaveMatRate(wave) : (0.92 * crystalMul / (1 + Math.min(5, Math.max(0, wave - 1)) * 0.14 + Math.max(0, wave - 6) * 0.075));
  // 自动回收地上 50% 未拾取晶石 + 适度通关津贴 + 【收获】成长分红 + 【理财冠】利息（整体晶石产出下调 30%）
  const leftover = Math.round(leftoverMats * matRate * 0.50);
  const interestCap = Math.round((24 + wave * 9) * crystalMul);
  const interestGain = player.interest > 0 ? Math.min(interestCap, Math.round(player.mats * player.interest)) : 0;
  const clearBonus = Math.max(2, Math.round((4 + Math.floor(wave * 1.5)) * crystalMul));
  const harvestGain = Math.max(0, Math.round((player.harvestFlat || 0) * crystalMul));
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
}

// 严格受控的战利品与商店品质概率曲线（兼顾五阶神话兵装合成节奏与幸运递减软上限）
function rollShopTier(waveNum, luck) {
  const luckF = Math.min(1, Math.max(0, luck || 0) / 90);
  const p4 = waveNum < 5 ? 0 : Math.min(0.13, 0.012 + (waveNum - 5) * 0.0095 + luckF * 0.032);
  const p3 = waveNum < 3 ? 0 : Math.min(0.30, 0.042 + (waveNum - 3) * 0.021 + luckF * 0.050);
  const p2 = waveNum < 2 ? 0 : Math.min(0.44, 0.19 + (waveNum - 2) * 0.032 + luckF * 0.04);
  const u = Math.random();
  if (u < p4) return 4;
  if (u < p4 + p3) return 3;
  if (u < p4 + p3 + p2) return 2;
  return 1;
}

function rollCrateTier(waveNum, luck, isBossCrate = false) {
  const luckF = Math.min(1, Math.max(0, luck || 0) / 90);
  const p4 = waveNum < 5 ? 0 : Math.min(isBossCrate ? 0.22 : 0.15, (isBossCrate ? 0.048 : 0.016) + (waveNum - 5) * 0.010 + luckF * 0.035);
  const p3 = waveNum < 3 ? 0 : Math.min(isBossCrate ? 0.38 : 0.31, (isBossCrate ? 0.16 : 0.065) + (waveNum - 3) * 0.022 + luckF * 0.055);
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
  if (player.cls === 'ranger' || (player.rangedBonus || 0) >= 0.10 || (player.bounceBonus || 0) > 0 || (player.pierceBonus || 0) > 0) tags.add('ranged');
  if (player.cls === 'ghost' || (player.dodge || 0) >= 0.14 || player.dashSurge) tags.add('dodge');
  if (player.cls === 'vampire' || (player.lifesteal || 0) >= 0.08) tags.add('vampire');
  if (player.cls === 'bull' || (player.armor || 0) >= 4 || (player.maxHp || 30) >= 48 || (player.maxShield || 0) >= 8) tags.add('tank');
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
  if (player.weapons.length && Math.random() < 0.52) {
    const mergeCands = wKeys.filter(k => {
      const effT = Math.max(wTier, WEAPONS[k].minTier || 1);
      return player.weapons.some(w => w.id === k && w.tier === effT && w.tier < 5);
    });
    if (mergeCands.length && Math.random() < 0.70) {
      pickedId = mergeCands[Math.floor(Math.random() * mergeCands.length)];
    } else {
      const upgradableOwned = player.weapons.filter(w => w.tier < 5);
      const refW = upgradableOwned.length
        ? upgradableOwned[Math.floor(Math.random() * upgradableOwned.length)]
        : player.weapons[Math.floor(Math.random() * player.weapons.length)];
      const owned = refW.id;
      const ownedTpl = WEAPONS[owned];
      const sameSet = ownedTpl ? wKeys.filter(k => WEAPONS[k] && WEAPONS[k].set === ownedTpl.set) : [];
      if (wKeys.includes(owned) && Math.random() < 0.55) pickedId = owned;
      else if (sameSet.length) pickedId = sameSet[Math.floor(Math.random() * sameSet.length)];
    }
  }

  const tpl = WEAPONS[pickedId];
  const effTier = Math.min(4, Math.max(wTier, tpl.minTier || 1));
  const tierMul = WEAPON_TIER_COST_MUL[effTier] || 4.4;
  const crystalMul = typeof CRYSTAL_YIELD_MUL === 'number' ? CRYSTAL_YIELD_MUL : 0.70;
  const recycleVal = Math.max(6, Math.round(tpl.cost * tierMul * getShopScale() * 0.48 * crystalMul));
  const canMergeNow = player.weapons.some(w => w.id === pickedId && w.tier === effTier && w.tier < 5);
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
    ct.textContent = `${isMythicCrate ? '开启神骸二阶段秘匣 · 必得传说' : (isBossCrate ? '开启守誓主宰秘匣' : '开启守誓遗物匣')}（剩余 ${pendingCrates}）`;
  }

  const luck = player.luck || 0;
  const crystalMul = typeof CRYSTAL_YIELD_MUL === 'number' ? CRYSTAL_YIELD_MUL : 0.70;
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
      recycleVal: Math.max(6, Math.round(item1.cost * getShopScale() * 0.52 * crystalMul))
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
        recycleVal: Math.max(12, Math.round(item2.cost * getShopScale() * 0.55 * crystalMul))
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
        recycleVal: Math.max(16, Math.round(42 * getShopScale() * crystalMul))
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
      recycleVal: Math.max(7, Math.round((sup.cost || 28) * getShopScale() * 0.50 * crystalMul))
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
        recycleVal: Math.max(6, Math.round(item2.cost * getShopScale() * 0.52 * crystalMul))
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
      recycleVal: Math.max(10, Math.round((fbSup.cost || 32) * getShopScale() * 0.55 * crystalMul))
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
    let icon = '🏮', title = '', badgesHtml = '', descHtml = '';
    if (isMythicCrate) badgesHtml += `<span class="tag t4">神骸二阶段</span>`;
    else if (isBossCrate) badgesHtml += `<span class="tag tag-merge">主宰秘宝</span>`;

    if (c.kind === 'item') {
      const it = c.item;
      const ownedCnt = (player.items && player.items[it.id]) || 0;
      icon = it.icon;
      title = it.name;
      badgesHtml += `<span class="tag t${it.tier}">${TIER_NAMES[it.tier]}遗物</span>`;
      if (it.maxCount) badgesHtml += `<span class="tag">${it.maxCount === 1 ? '唯一' : '上限×' + it.maxCount}</span>`;
      if (ownedCnt > 0) badgesHtml += `<span class="tag tag-owned">已持有 ×${ownedCnt}</span>`;
      descHtml = `<div class="card-desc">${it.desc}</div>`;
    } else if (c.kind === 'weapon') {
      const tpl = c.tpl;
      const setLabel = ((SET_DEFS[tpl.set] && SET_DEFS[tpl.set].label) || '').replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '');
      icon = _wpnEmblem(c.id, c.tier, '', tpl.icon);
      title = `${tpl.name} · 阶${c.tier}`;
      badgesHtml += `<span class="tag t${c.tier}">${TIER_NAMES[c.tier]}兵装</span>`;
      if (setLabel) badgesHtml += `<span class="tag">${setLabel}</span>`;
      if (c.canMergeNow) badgesHtml += c.tier === 4 ? `<span class="tag t5">可觉醒5阶神话</span>` : `<span class="tag tag-merge">可共鸣升阶</span>`;
      descHtml = `<div class="card-desc">${tpl.desc}</div>`;
    } else if (c.kind === 'supply') {
      const sup = c.supply;
      icon = sup.icon;
      title = sup.name;
      badgesHtml += `<span class="tag t${c.tier}">魂灯秘髓</span>`;
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
          <button class="btn take-btn" style="justify-content:center">◆ 收归行囊</button>
          <button class="btn btn-sec recycle-btn" style="justify-content:center">熔炼 (+◇${c.recycleVal})</button>
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
  document.getElementById('lvlTitle').textContent = `魂灯共鸣 · 择定记忆刻印（余 ${pendingLevels} 次）`;
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
          <div class="card-badges"><span class="tag t2">记忆刻印</span></div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-desc">${u.desc}</div>
        <div class="card-actions"><button class="btn" style="justify-content:center">◆ 铭刻共鸣</button></div>
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

// 商店波次通胀系数（严密对齐精简后期怪量后的单波晶石收益，保证 D0~D5 每波稳定购置与合成装备）
function getShopScale() {
  const endlessMul = wave > MAX_WAVE ? Math.pow(1.16, wave - MAX_WAVE) : 1;
  return (1 + (wave - 1) * 0.18 + Math.pow(Math.max(0, wave - 1), 1.22) * 0.028) * endlessMul * (diff.shopTax || 1);
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
      // 若已有某套装武器，提升同把或同系刷出率，保障中后期顺畅合成五阶神话兵装
      let id = validW[Math.floor(Math.random() * validW.length)];
      if (player.weapons.length && Math.random() < 0.40) {
        const upgradable = player.weapons.filter(w => w.tier < 5 && validW.includes(w.id));
        if (upgradable.length && Math.random() < 0.58) {
          id = upgradable[Math.floor(Math.random() * upgradable.length)].id;
        } else {
          const owned = player.weapons[Math.floor(Math.random() * player.weapons.length)].id;
          const ownedTpl = WEAPONS[owned];
          const sameSet = ownedTpl ? validW.filter(k => WEAPONS[k] && WEAPONS[k].set === ownedTpl.set) : [];
          if (validW.includes(owned) && Math.random() < 0.52) id = owned;
          else if (sameSet.length) id = sameSet[Math.floor(Math.random() * sameSet.length)];
        }
      }
      const tpl = WEAPONS[id];
      const effTier = Math.max(tier, tpl.minTier || 1);
      const tierMul = WEAPON_TIER_COST_MUL[effTier] || 4.4;
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
      const upgradable = player.weapons.filter(w => w.tier < 5);
      if (upgradable.length > 0) {
        const uw = upgradable[Math.floor(Math.random() * upgradable.length)];
        uw.tier++;
        if (player) player._sbCache = null;
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
  checkPendingWeaponEvolutions();
}

function canBuyWeapon(id, tier) {
  if (player.maxSlots <= 0) return false;
  if (player.weapons.length < player.maxSlots) return true;
  return player.weapons.some(w => w.id === id && w.tier === tier && w.tier < 5);
}

function addOrMergeWeapon(id, tier) {
  const safeT = Math.min(5, Math.max(1, tier | 0));
  const matchIdx = safeT < 5 ? player.weapons.findIndex(w => w.id === id && w.tier === safeT && w.tier < 5) : -1;
  if (matchIdx !== -1 && player.weapons.length >= player.maxSlots) {
    player.weapons.splice(matchIdx, 1);
    addOrMergeWeapon(id, safeT + 1);
    return;
  }
  player.weapons.push(makeWeapon(id, safeT));
  if (player) player._sbCache = null;
  syncSetHp();
}

function mergeSlot(idx) {
  const w = player.weapons[idx];
  if (!w || w.tier >= 5) return false;
  const other = player.weapons.findIndex((x, i) => i !== idx && x.id === w.id && x.tier === w.tier);
  if (other === -1) return false;
  w.tier++;
  player.weapons.splice(other, 1);
  if (player) player._sbCache = null;
  syncSetHp();
  beep(w.tier >= 5 ? 860 : 760, 0.11, 'triangle');
  checkPendingWeaponEvolutions();
  return true;
}

function renderShop() {
  renderBuildSummary('statsRow', 'setRow');
  const witchImgEl = document.getElementById('shopMerchantPortrait');
  if (witchImgEl) {
    witchImgEl.alt = !endlessMode && wave < 15 ? '青羽 · 风亭行商' : '青羽 · 记忆的守望者';
    witchImgEl.title = '与青羽交谈';
    if (typeof SpireAssets !== 'undefined' && typeof SpireAssets.resolve === 'function') {
      const resolvedSrc = SpireAssets.resolve('assets/spire/port_qingyu.jpg');
      if (witchImgEl._resolvedSrc !== resolvedSrc) {
        witchImgEl.src = resolvedSrc;
        witchImgEl._resolvedSrc = resolvedSrc;
      }
    }
    if (!witchImgEl._chatBound) {
      witchImgEl._chatBound = true;
      witchImgEl.style.cursor = 'pointer';
      const bonusTalks = [
        '雨还没停。先暖暖手，再看看缺什么。',
        '看见地上的预警就先让开。瞬步可以穿过弹雨，但要留一点余地。',
        '同名、同阶的兵装能合在一起。带得趁手，比带得多更要紧。',
        '想留的东西，替它扣上小锁。下次来，我还给你留着。'
      ];
      let talkIdx = 0;
      witchImgEl.onclick = () => {
        beep(640, 0.05, 'triangle', 0.035);
        const sEl = document.getElementById('shopSub');
        if (sEl) {
          sEl.textContent = bonusTalks[talkIdx % bonusTalks.length];
          talkIdx++;
        }
      };
    }
  }
  const nextFloorNum = wave + 1;
  const nextIsBoss = (nextFloorNum >= 4 && nextFloorNum % 4 === 0);
  const floorBadgeTxt = endlessMode ? `无尽第 ${wave} 层` : `第 ${wave} / ${MAX_WAVE} 层`;
  document.getElementById('shopTitle').textContent = uiMode !== 'desktop'
    ? `${floorBadgeTxt}整备${anvilUpgradedMsg ? ' · 已升阶' : ''}`
    : `${floorBadgeTxt}整备  —  青羽的风语行商（${diff.badge}）`;
  const subEl = document.getElementById('shopSub');
  if (subEl) {
    const storyWhispers = [
      '我叫青羽。做些补给生意，也替人认认遗失的东西。',
      '桥上的雨太凉。带一块干布，灯别淋灭了。',
      '旧编号，不是名字。那块铭牌先收好。',
      '烬羽的剑穗，还是你以前系的样子。别弄丢了。',
      '冰里的人还在呼吸。灯举低一些。',
      '有些声音会让灯自己亮起来。你要留意它照向哪里。',
      '那段曲子还没弹完。见到她，再听一听。',
      '画像是证据。你仔细看她的手，她也怕弄疼你。',
      '这里的钟总往回走。你脚下的路却可以往前。',
      '她不肯让你看手上的裂缝。你看到了，就替她记着。',
      '有些事记不起了，手还会记得。',
      '那道“阻止我”的指令，是你留下的。现在你亲自听见了。',
      '先看清脚下，再去听镜里的声音。',
      '我在这里。门后的话，你可以慢慢想。',
      '四件旧物都在了。进门之前，把我们的约定想完整。',
      '茶快凉了。'
    ];
    const whisper = endlessMode ? '' : storyWhispers[Math.max(0, Math.min(15, wave - 1))];
    subEl.textContent = whisper
      ? `${whisper}${anvilUpgradedMsg}`
      : `${diff.badge}  ·  ${curScene.name}  ·  同名同阶兵装可共鸣升阶${anvilUpgradedMsg}`;
  }
  document.getElementById('shopMat').textContent = `◇ ${player.mats}`;
  const actualReroll = freeRerollsLeft > 0 ? 0 : rerollCost;
  const rerollTxt = actualReroll === 0 ? `免费刷新 (${freeRerollsLeft})` : `刷新 (${actualReroll})`;
  const rb = document.getElementById('rerollBtn');
  rb.textContent = rerollTxt;
  rb.disabled = player.mats < actualReroll;
  const mrb = document.getElementById('mobRerollBtn');
  if (mrb) {
    mrb.textContent = rerollTxt;
    mrb.disabled = player.mats < actualReroll;
  }
  const nextLabel = !endlessMode && nextFloorNum === 16 ? '准备好了，推开终门 →' : nextIsBoss
    ? `◆ 迎战第 ${nextFloorNum} 层守誓首领 →`
    : `◆ 登往第 ${nextFloorNum} 层 →`;
  const dnb = document.getElementById('deskNextBtn');
  if (dnb) dnb.textContent = nextLabel;
  const mnb = document.getElementById('mobNextBtn');
  if (mnb) {
    mnb.textContent = nextLabel;
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
      const sLabel = SET_DEFS[tpl.set] ? SET_DEFS[tpl.set].label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '') : '';
      const scale = tpl.set === 'elemental' ? getElemMul() : (tpl.techScale ? getTechMul() : 1);
      const aspdBonus = tpl.aspdScale ? Math.max(0, getEffectiveAtkSpd() - 1) * 9 : 0;
      const rngBonus = tpl.rangeScale ? Math.max(0, totalRange) * tpl.rangeScale : 0;
      const hpBonus = tpl.hpScale ? Math.max(0, player.maxHp) * tpl.hpScale : 0;
      const armBonus = tpl.armorScale ? Math.max(0, getTotalArmor()) * tpl.armorScale : 0;
      const stickBonus = o.id === 'stick' ? Math.max(0, (getSetBonuses().sticks || 0)) * 4.8 : 0;
      const dmg = Math.round(((tpl.dmg + aspdBonus + rngBonus + hpBonus + armBonus) * (1 + (o.tier - 1) * 0.55) + stickBonus) * (getEffectiveDmgMul() + (tpl.melee ? player.meleeBonus : 0)) * scale);
      const effRange = Math.max(tpl.melee ? 78 : 54, tpl.range + (tpl.melee ? Math.round(totalRange * 0.88 + (player.meleeSweepBonus || 0) * 22) : totalRange) + (o.tier - 1) * (tpl.melee ? 18 : 13));
      const effCd = (tpl.cd / Math.max(0.18, getEffectiveAtkSpd() * (1 + (o.tier - 1) * 0.08))).toFixed(2);
      const ok = player.mats >= o.cost && canBuyWeapon(o.id, o.tier);
      const hasMergePair = o.tier < 5 && player.weapons.some(w => w.id === o.id && w.tier === o.tier);
      const willAwakenT5 = hasMergePair && o.tier === 4;
      const pelletsTxt = tpl.pellets ? `×${tpl.pellets}` : '';
      el.innerHTML = `
        <div class="card-main">
          <div class="card-head">
            <div class="item-emblem t${o.tier}">${_wpnEmblem(o.id, o.tier, '', tpl.icon)}</div>
            <div class="card-meta">
              <div class="card-title">${tpl.name}</div>
              <div class="card-badges">
                <span class="tag t${o.tier}">${TIER_NAMES[o.tier]}兵装</span>
                <span class="tag">${sLabel}</span>
                ${willAwakenT5 ? '<span class="tag t5">合成觉醒5阶!</span>' : (hasMergePair ? '<span class="tag tag-merge">可升阶</span>' : '')}
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="card-desc">${tpl.desc}</div>
            <div class="stat-chips">
              <span class="stat-chip">伤害 ${dmg}${pelletsTxt}</span>
              <span class="stat-chip">间隔 ${effCd}s</span>
              <span class="stat-chip">射程 ${effRange}</span>
            </div>
          </div>
        </div>
        <div class="card-side">
          <button class="lock-pin lock${o.locked ? ' is-locked' : ''}" title="${o.locked ? '点击解锁商品' : '锁定保留至下一层'}"><span>${o.locked ? '已锁定' : '保留'}</span></button>
          <div class="card-actions">
            <button class="btn buy${hasMergePair ? ' merge-ready' : ''}" ${ok ? '' : 'disabled'}>
              <span>${willAwakenT5 ? '觉醒五阶' : (hasMergePair ? (uiMode !== 'desktop' ? '共鸣升阶' : '购入升阶') : '购入')}</span>
              <span class="buy-price">◇ ${o.cost}</span>
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
        checkPendingWeaponEvolutions();
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
                <span class="tag t${o.tier}">${TIER_NAMES[o.tier]}遗物</span>
                ${ownedCnt > 0 ? `<span class="tag tag-owned">已持有 ×${ownedCnt}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="card-desc">${it.desc}</div>
          </div>
        </div>
        <div class="card-side">
          <button class="lock-pin lock${o.locked ? ' is-locked' : ''}" title="${o.locked ? '点击解锁商品' : '锁定保留至下一层'}"><span>${o.locked ? '已锁定' : '保留'}</span></button>
          <div class="card-actions">
            <button class="btn buy" ${ok ? '' : 'disabled'}>
              <span>购入</span>
              <span class="buy-price">◇ ${o.cost}</span>
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
    const sellTipText = isTouch ? '双击单把可熔炼回收' : '点击单把可熔炼回收';
    document.getElementById('slotHint').innerHTML = `随身守誓兵装席 (<b>${player.weapons.length}</b>/${player.maxSlots})  ·  最高<b>5阶神话二选一进化</b>，同名同阶点击升阶，${sellTipText}`;
    player.weapons.forEach((w, idx) => {
      const tpl = WEAPONS[w.id];
      if (!tpl) return;
      const hasPair = w.tier < 5 && player.weapons.some((x, j) => j !== idx && x.id === w.id && x.tier === w.tier);
      const needsEvo = w.tier >= 5 && !w.evo && Array.isArray(tpl.evos) && tpl.evos.length >= 2;
      const tierMul = WEAPON_TIER_COST_MUL[w.tier] || 6.4;
      const refund = Math.max(4, Math.round(tpl.cost * tierMul * getShopScale() * 0.35));
      const confirming = !hasPair && !needsEvo && confirmSellIdx === idx && player.weapons.length > 1;
      const d = document.createElement('div');
      d.className = `slot t${w.tier}${confirming ? ' confirming' : ''}`;
      const isEvoDone = w.tier >= 5 && !!w.evoName;
      const dispName = isEvoDone ? w.evoName : `${tpl.name} · 阶${w.tier}`;
      const nameColor = isEvoDone ? (w.evoColor || TIER_COLORS[5]) : TIER_COLORS[w.tier];
      const badgeHtml = needsEvo
        ? '<span class="merge-badge evo-badge">觉醒!</span>'
        : (hasPair
          ? `<span class="merge-badge${w.tier === 4 ? ' evo-badge' : ''}">${w.tier === 4 ? '升5阶' : '升阶'}</span>`
          : (isEvoDone ? '<span class="merge-badge evo-badge">★神话</span>' : ''));
      const mobSub = needsEvo ? '点此二选一进化' : (hasPair ? (w.tier === 4 ? '点此觉醒5阶' : '点此升阶') : (player.weapons.length > 1 ? `回收 +◇${refund}` : '主兵装'));
      const tipTxt = needsEvo ? '点击择定进化' : (hasPair ? (w.tier === 4 ? '点击觉醒5阶神话' : '点击升阶') : (confirming ? '确认回收 +◇' + refund : '回收 +◇' + refund));
      d.innerHTML = `${badgeHtml}
        <div class="slot-icon">${_wpnEmblem(w.id, w.tier, w.evo || '', tpl.icon)}</div>
        <div class="slot-name" style="color:${nameColor}" title="${dispName}">${dispName}</div>
        <div class="slot-sub m-only">${mobSub}</div>
        <div class="sell-tip">${tipTxt}</div>`;
      d.onclick = () => {
        if (needsEvo) {
          confirmSellIdx = -1;
          checkPendingWeaponEvolutions();
          return;
        }
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
          player.mats += refund; player.weapons.splice(idx, 1);
          if (player) player._sbCache = null;
          syncSetHp(); beep(320, 0.06);
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

function nextWave() {
  if (state !== 'shop' || !player) return;
  if (typeof SpireDirector !== 'undefined' && SpireDirector.isBlockingGameplay()) return;
  if (getPendingEvoWeapon()) {
    const currentPlayer = player, currentWave = wave;
    checkPendingWeaponEvolutions(() => {
      if (player === currentPlayer && wave === currentWave) nextWave();
    });
    return;
  }
  resetWeaponEvolutionUI();
  wave++;
  beginWave();
}

function endGame(win) {
  if (!player || state === 'end') return;
  const flow = spireFloorFlow;
  if (!isCurrentSpireFlow(flow)) return;
  if (win) {
    if (!endlessMode && wave === MAX_WAVE && flow.bossDefeated && getSpireStoryProgress().finalChoice === 'refuse' && hasSpireTrueEnding()) {
      playSpireEnding('B', flow);
    }
    return;
  }
  if (!stopSpireCombat(flow, 'player-defeated')) return;
  const done = () => {
    if (!isCurrentSpireFlow(flow) || flow.result !== 'player-defeated') return;
    flow.result = 'ended';
    showSpireEndMenu(false);
  };
  if (!endlessMode && typeof SpireDirector !== 'undefined' && typeof SpireDirector.onPlayerDefeated === 'function') {
    SpireDirector.onPlayerDefeated(wave, done);
  } else done();
}

function showSpireEndMenu(win, ending = '') {
  state = 'end';
  resetJoy();
  resetWeaponEvolutionUI();
  if (!win) {
    bossCutscene = null;
    if (typeof pendingBossCutscene !== 'undefined') pendingBossCutscene = null;
    if (typeof SpireDirector !== 'undefined' && SpireDirector && typeof SpireDirector.abortActive === 'function') {
      SpireDirector.abortActive();
    }
  }
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  const cm = document.getElementById('crateMenu');
  if (cm) cm.classList.add('hidden');
  const em = document.getElementById('endMenu');
  if (typeof em.setAttribute === 'function') em.setAttribute('data-result', win ? `ending-${ending}` : 'defeat');
  const actIndex = Math.max(1, Math.min(4, Math.ceil(wave / 4)));
  const background = !win && wave === 4
    ? 'assets/spire/v2/player-defeat-clean.png'
    : `assets/spire/scene_${actIndex}_vista.jpg`;
  const imageUrl = typeof resolveSpireAssetUrl === 'function' ? resolveSpireAssetUrl(background) :
    ((typeof window !== 'undefined' && window.__SPIRE_INLINE_ASSETS__ && window.__SPIRE_INLINE_ASSETS__[background]) || background);
  if (em.style && typeof em.style.setProperty === 'function') em.style.setProperty('--ending-art', `url("${imageUrl}")`);
  em.classList.remove('hidden');
  em.scrollTop = 0;
  document.getElementById('endlessBtn').classList.toggle('hidden', !win || ending !== 'B');
  const waveLabel = endlessMode ? `无尽第 ${wave} 层` : `第 ${wave} / ${MAX_WAVE} 层`;
  const retryBtn = document.getElementById('retryWaveBtn');
  if (retryBtn) {
    const canRetry = !win && typeof waveCheckpoint !== 'undefined' && !!(waveCheckpoint && waveCheckpoint.player);
    retryBtn.classList.toggle('hidden', !canRetry);
    retryBtn.textContent = '重试本层';
  }
  const abandonBtn = document.getElementById('abandonRestartBtn');
  if (abandonBtn) {
    abandonBtn.classList.add('hidden');
    abandonBtn.textContent = '放弃并从头开始';
  }
  const mainBtn = document.getElementById('endMainMenuBtn');
  if (mainBtn) {
    mainBtn.className = win ? 'btn btn-go' : 'btn btn-sec';
    mainBtn.textContent = win && ending === 'A' ? '再次提灯启程' : '返回主殿';
  }
  const clsObj = CLASSES.find(c => c.id === player.cls);
  const retries = (player && player.retryCount) || 0;
  logInfo('END', `${win ? (ending === 'A' ? '神座加冕' : '守誓者的破晓') : '本层败北'} · 角色=${clsObj ? clsObj.name : player.cls} · 波次=${wave} · Lv=${player.lv} · 击杀=${player.kills} · 重开=${retries}`);
  document.getElementById('endTitle').textContent = win ? (ending === 'A' ? '神座加冕' : '第一千道黎明') : '魂灯未熄';
  const storyNote = win
    ? (ending === 'A'
      ? '<br><span class="ending-story-note">你与镜中圣女合一，黑日吞没了世界。无边的孤寂中，记忆再次崩散。第一千次轮回开始了。</span>'
      : '<br><span class="ending-story-note">四位同伴的温暖残影与你斩碎了黑镜。长桥雨停，冰城苏醒，钟声终于向前。她们留在旧物、晨光与你的记忆里。</span>')
    : `<br><span class="ending-story-note">你倒在了${['雨夜长桥', '永冻冰窟', '倒悬钟楼', '日蚀镜界'][actIndex - 1]}。可以从第 ${wave} 层起点重新握紧提灯。</span>`;
  document.getElementById('endDesc').innerHTML =
    `厄度：<b>${diff.badge}</b>  ·  登塔者：<b>${clsObj ? clsObj.name : ''}</b>  ·  抵达：<b>${waveLabel}</b>  ·  共鸣：<b>Lv.${player.lv}</b>  ·  净化：<b>${player.kills}</b>` +
    (retries > 0 ? `  ·  回溯：<b>${retries} 次</b>` : '') + storyNote;
}

function continueEndless() {
  if (state !== 'end' || !player || getSpireStoryProgress().ending !== 'B') return;
  endlessMode = true;
  beep(620, 0.09, 'triangle');
  document.getElementById('endMenu').classList.add('hidden');
  // 真结局后由第 17 层继续；没有把结局演出当成普通宝箱结算。
  pendingCrates = 0;
  pendingLevels = 0;
  wave = MAX_WAVE + 1;
  beginWave();
}
