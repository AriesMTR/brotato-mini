// 📖 全息图鉴百科交互与渲染引擎
let codexTab = 'weapons', codexFilter = 'all', codexPrevState = 'menu';
function openCodex(initialTab) {
  if (state === 'wave') pauseGame();
  if (state !== 'codex') codexPrevState = state;
  if (initialTab) { codexTab = initialTab; codexFilter = 'all'; }
  beep(520, 0.05, 'triangle', 0.04);
  renderCodex();
  const modal = document.getElementById('codexModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.scrollTop = 0;
  }
}

function closeCodex() {
  const modal = document.getElementById('codexModal');
  if (modal) modal.classList.add('hidden');
  beep(380, 0.04, 'triangle', 0.035);
}

function setCodexTab(tab) {
  codexTab = tab;
  codexFilter = 'all';
  beep(490, 0.035, 'triangle', 0.03);
  renderCodex();
  const sc = document.getElementById('codexScroll');
  if (sc) sc.scrollTop = 0;
}

function setCodexFilter(f) {
  codexFilter = f;
  beep(460, 0.03, 'triangle', 0.025);
  renderCodex();
  const sc = document.getElementById('codexScroll');
  if (sc) sc.scrollTop = 0;
}

function renderCodex() {
  const tabsEl = document.getElementById('codexTabs');
  const filtersEl = document.getElementById('codexFilters');
  const bannerEl = document.getElementById('codexBanner');
  const gridEl = document.getElementById('codexGrid');
  if (!tabsEl || !gridEl) return;

  const tabs = [
    { id: 'weapons',  label: `⚔️ 武器 (${Object.keys(WEAPONS).length})` },
    { id: 'items',    label: `🎒 装备 (${ITEMS.length})` },
    { id: 'heroes',   label: `🥔 角色 (${CLASSES.length})` },
    { id: 'monsters', label: `👾 怪物与Boss (${MONSTER_CODEX.length})` },
    { id: 'world',    label: `🌍 场景与奇遇 (${SCENES.length + SPECIAL_RELICS.length})` }
  ];
  tabsEl.innerHTML = '';
  tabs.forEach(t => {
    const b = document.createElement('button');
    b.className = 'codex-tab' + (codexTab === t.id ? ' active' : '');
    b.textContent = t.label;
    b.onclick = () => setCodexTab(t.id);
    tabsEl.appendChild(b);
  });

  filtersEl.innerHTML = '';
  bannerEl.innerHTML = '';
  gridEl.innerHTML = '';
  gridEl.classList.toggle('wide', codexTab === 'heroes' || codexTab === 'monsters' || codexTab === 'world');

  const buildFilterBar = opts => {
    opts.forEach(o => {
      const fb = document.createElement('button');
      fb.className = 'codex-filter' + (codexFilter === o.id ? ' active' : '');
      fb.textContent = o.label;
      fb.onclick = () => setCodexFilter(o.id);
      filtersEl.appendChild(fb);
    });
  };

  if (codexTab === 'weapons') {
    buildFilterBar([
      { id: 'all', label: '全部武器' },
      { id: 'melee', label: '🗡️ 近战' },
      { id: 'ranged', label: '🔫 远程' },
      ...Object.entries(SET_DEFS).map(([k, v]) => ({ id: k, label: v.label }))
    ]);
    bannerEl.innerHTML = Object.values(SET_DEFS)
      .map(s => `<span class="set-pill"><b>${s.label}</b> ${s.desc}</span>`).join('');
    Object.entries(WEAPONS).forEach(([id, w]) => {
      if (codexFilter === 'melee' && !w.melee) return;
      if (codexFilter === 'ranged' && w.melee) return;
      if (SET_DEFS[codexFilter] && w.set !== codexFilter) return;
      const minT = w.minTier || 1;
      const card = document.createElement('div');
      card.className = `codex-card t${minT}`;
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="item-emblem t${minT}">${w.icon}</div>
          <div class="card-meta">
            <div class="codex-card-title">${w.name}</div>
            <div class="card-badges">
              <span class="tag">${SET_DEFS[w.set].label}</span>
              <span class="tag">${w.melee ? '近战挥砍' : '远程射击'}</span>
              ${minT > 1 ? `<span class="tag t${minT}">最低${['','白','蓝','紫','红'][minT]}品</span>` : ''}
            </div>
          </div>
        </div>
        <div class="stat-chips">
          <span class="stat-chip">⚔️ 伤害 ${w.dmg}${w.pellets ? '×' + w.pellets : ''}</span>
          <span class="stat-chip">⚡ 冷却 ${w.cd}s</span>
          <span class="stat-chip">📏 范围 ${w.range}</span>
          <span class="stat-chip">💎 基准 ${w.cost}</span>
        </div>
        <div class="codex-card-desc">${w.desc}</div>`;
      gridEl.appendChild(card);
    });
  } else if (codexTab === 'items') {
    buildFilterBar([
      { id: 'all', label: '全部品质' },
      { id: '1', label: '⬜ T1 普通' },
      { id: '2', label: '🟦 T2 精良' },
      { id: '3', label: '🟪 T3 史诗' },
      { id: '4', label: '🟥 T4 传说' }
    ]);
    bannerEl.innerHTML = `<span>💡 提示：击碎战场上的 <b>🌳 异星晶树</b> 或击败 <b>✨ 金色精英 / 首领</b> 可掉落免费战利品宝箱！</span>`;
    ITEMS.forEach(it => {
      if (codexFilter !== 'all' && String(it.tier) !== codexFilter) return;
      const tNames = ['', '普通 T1', '精良 T2', '史诗 T3', '传说 T4'];
      const card = document.createElement('div');
      card.className = `codex-card t${it.tier}`;
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="item-emblem t${it.tier}">${it.icon}</div>
          <div class="card-meta">
            <div class="codex-card-title">${it.name}</div>
            <div class="card-badges">
              <span class="tag t${it.tier}">${tNames[it.tier]}</span>
              <span class="tag">💎 基准售价 ${it.cost}</span>
            </div>
          </div>
        </div>
        <div class="codex-card-desc">${it.desc}</div>`;
      gridEl.appendChild(card);
    });
  } else if (codexTab === 'heroes') {
    bannerEl.innerHTML = `<span>🥔 每位土豆战士拥有独特的起手武器与专属战斗机制，合理搭配套装羁绊威力倍增！</span>`;
    CLASSES.forEach(c => {
      const card = document.createElement('div');
      card.className = 'codex-card t2';
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="cls-avatar">${c.icon}</div>
          <div class="card-meta">
            <div class="codex-card-title">${c.name}</div>
            <div class="card-badges">
              <span class="tag tag-merge">${c.tag}流派</span>
              <span class="tag">起手: ${c.loadout}</span>
            </div>
          </div>
        </div>
        <div class="codex-card-desc">${c.perks}</div>`;
      gridEl.appendChild(card);
    });
  } else if (codexTab === 'monsters') {
    buildFilterBar([
      { id: 'all', label: '全部图鉴' },
      { id: 'normal', label: '🪲 常规异虫' },
      { id: 'scene', label: '🗺️ 场景专属怪' },
      { id: 'boss', label: '👑 随机统领&主宰' },
      { id: 'special', label: '🔮 奇遇召唤Boss' }
    ]);
    bannerEl.innerHTML = `<span>👑 终局主宰与精英统领每局<b>随机轮换登场</b>；场景专属怪自第 3 波起按轮次概率出没（非必出）。</span>`;
    MONSTER_CODEX.forEach(m => {
      if (codexFilter !== 'all' && m.cat !== codexFilter) return;
      const tierCls = m.cat === 'special' ? 't4' : (m.cat === 'boss' ? 't3' : (m.cat === 'scene' ? 't2' : 't1'));
      const card = document.createElement('div');
      card.className = `codex-card ${tierCls}`;
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="item-emblem ${tierCls}">${m.icon}</div>
          <div class="card-meta">
            <div class="codex-card-title">${m.name}</div>
            <div class="card-badges">
              <span class="tag ${tierCls}">${m.badge}</span>
              <span class="tag">⏱ ${m.wave}</span>
            </div>
          </div>
        </div>
        <div class="stat-chips"><span class="stat-chip">${m.stats}</span></div>
        <div class="codex-card-desc">${m.desc}</div>`;
      gridEl.appendChild(card);
    });
  } else if (codexTab === 'world') {
    bannerEl.innerHTML = `<span>🌍 第 3 波起：各生态战场有概率触发<b>专属环境异象</b>或<b>专属怪物</b>；地图还可能小概率刷出<b>奇遇召唤圣物</b>！</span>`;
    SCENES.forEach(sc => {
      const card = document.createElement('div');
      card.className = 'codex-card t2';
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="item-emblem t2">${sc.icon}</div>
          <div class="card-meta">
            <div class="codex-card-title">${sc.name}</div>
            <div class="card-badges">
              <span class="tag t2">${sc.eventIcon} 异象: ${sc.eventName}</span>
              <span class="tag">专属怪: ${sc.exclMobName}</span>
            </div>
          </div>
        </div>
        <div class="codex-card-desc">${sc.eventDesc}<br><b>专属生态怪：</b>${sc.exclMobName}（第 3 波起随波次概率刷出，非强制出现）</div>`;
      gridEl.appendChild(card);
    });
    SPECIAL_RELICS.forEach(rel => {
      const card = document.createElement('div');
      card.className = 'codex-card t4';
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="item-emblem t4">${rel.icon}</div>
          <div class="card-meta">
            <div class="codex-card-title">【奇遇圣物】${rel.name}</div>
            <div class="card-badges">
              <span class="tag t4">小概率刷出</span>
              <span class="tag tag-merge">召唤 ${rel.bossIcon} ${rel.bossName}</span>
            </div>
          </div>
        </div>
        <div class="codex-card-desc">第 3 波起小概率在地图上现世（屏幕边缘会有方向指引）。<b>踏入圣物法阵驻留 1.1 秒</b>即可解封召唤特殊首领进入 Boss 战（回合时间自动延长 +25s）！<br><b>${rel.rewardDesc}</b></div>`;
      gridEl.appendChild(card);
    });
  }
}
