// 📖 《烬塔残响》圣典全图鉴交互与原画展示引擎（全面接入角色立绘、分层域 Q 版怪物贴图与层域全景图）
let codexTab = 'weapons', codexFilter = 'all', codexPrevState = 'menu';

function _spireImgUrl(relPath) {
  if (!relPath) return '';
  if (typeof SpireAssets !== 'undefined' && typeof SpireAssets.resolve === 'function') {
    return SpireAssets.resolve(relPath);
  }
  return relPath;
}

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
    { id: 'weapons',  roman: 'I',   title: '守誓兵装', count: Object.keys(WEAPONS).length },
    { id: 'items',    roman: 'II',  title: '记忆遗物', count: ITEMS.length },
    { id: 'heroes',   roman: 'III', title: '誓约角色', count: CLASSES.length },
    { id: 'monsters', roman: 'IV',  title: '层域魔物', count: MONSTER_CODEX.length },
    { id: 'world',    roman: 'V',   title: '世界生态', count: SCENES.length + (typeof TERRAIN_CODEX !== 'undefined' ? TERRAIN_CODEX.length : 0) + SPECIAL_RELICS.length }
  ];
  tabsEl.innerHTML = '';
  tabs.forEach(t => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.className = 'codex-tab' + (codexTab === t.id ? ' active' : '');
    b.innerHTML = `<span class="ct-roman">${t.roman}</span><span class="ct-title">${t.title}</span><span class="ct-count">${t.count}</span>`;
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
      fb.type = 'button';
      fb.className = 'codex-filter' + (codexFilter === o.id ? ' active' : '');
      fb.textContent = o.label;
      fb.onclick = () => setCodexFilter(o.id);
      filtersEl.appendChild(fb);
    });
  };

  if (codexTab === 'weapons') {
    buildFilterBar([
      { id: 'all', label: '全部兵装' },
      { id: 'melee', label: '近战斩击' },
      { id: 'ranged', label: '远程魂弹' },
      ...Object.entries(SET_DEFS).map(([k, v]) => ({ id: k, label: v.label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '') }))
    ]);
    bannerEl.innerHTML = Object.values(SET_DEFS)
      .map(s => `<span class="set-pill"><b>${s.label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '')}</b> ${s.desc}</span>`).join('');
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
              <span class="tag">${SET_DEFS[w.set].label.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '')}</span>
              <span class="tag">${w.melee ? '近战挥砍' : '远程射击'}</span>
              ${minT > 1 ? `<span class="tag t${minT}">最低${['','普通','精良','史诗','传说'][minT]}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="stat-chips">
          <span class="stat-chip">伤害 ${w.dmg}${w.pellets ? '×' + w.pellets : ''}</span>
          <span class="stat-chip">冷却 ${w.cd}s</span>
          <span class="stat-chip">范围 ${w.range}</span>
          <span class="stat-chip">基准 ◇${w.cost}</span>
        </div>
        <div class="codex-card-desc">${w.desc}</div>`;
      gridEl.appendChild(card);
    });
  } else if (codexTab === 'items') {
    buildFilterBar([
      { id: 'all', label: '全部品质' },
      { id: '1', label: 'T1 · 普通' },
      { id: '2', label: 'T2 · 精良' },
      { id: '3', label: 'T3 · 史诗' },
      { id: '4', label: 'T4 · 传说' }
    ]);
    bannerEl.innerHTML = `<span>◆ 击碎层域中的<b>石灯笼 / 寒冰晶簇 / 齿轮断柱 / 黑曜方碑</b>或击败<b>蚀日精英 / 守层主宰</b>，均可获赠免费守誓遗物匣。</span>`;
    ITEMS.forEach(it => {
      if (codexFilter !== 'all' && String(it.tier) !== codexFilter) return;
      const tNames = ['', 'T1 普通', 'T2 精良', 'T3 史诗', 'T4 传说'];
      const card = document.createElement('div');
      card.className = `codex-card t${it.tier}`;
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="item-emblem t${it.tier}">${it.icon}</div>
          <div class="card-meta">
            <div class="codex-card-title">${it.name}</div>
            <div class="card-badges">
              <span class="tag t${it.tier}">${tNames[it.tier]}</span>
              ${it.maxCount ? `<span class="tag tag-merge">${it.maxCount === 1 ? '唯一' : '上限 ×' + it.maxCount}</span>` : ''}
              <span class="tag">基准 ◇${it.cost}</span>
            </div>
          </div>
        </div>
        <div class="codex-card-desc">${it.desc}</div>`;
      gridEl.appendChild(card);
    });
  } else if (codexTab === 'heroes') {
    bannerEl.innerHTML = `<span>◆ 六位誓约者均配备设定集高清半身立绘与实机四帧动态精灵，并拥有各自独立的【青焰瞬步】主动残响战技。</span>`;
    CLASSES.forEach(c => {
      const portSrc = _spireImgUrl(c.portrait);
      const chibiSrc = _spireImgUrl(c.chibi);
      const card = document.createElement('div');
      card.className = 'codex-card t2';
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="codex-thumb-wrap">
            ${portSrc ? `<img src="${portSrc}" alt="${c.name}" class="codex-thumb-img">` : c.icon}
          </div>
          <div class="card-meta" style="flex:1">
            <div class="codex-card-title">${c.name}</div>
            <div class="card-badges">
              <span class="tag tag-merge">${c.tag}</span>
              <span class="tag">起手 · ${c.loadout}</span>
              ${c.dashName ? `<span class="tag t2">${c.dashName}</span>` : ''}
            </div>
          </div>
          ${chibiSrc ? `<img src="${chibiSrc}" alt="${c.name} 实机精灵" class="codex-chibi-mini">` : ''}
        </div>
        <div class="codex-card-desc">${c.perks}${c.dashDesc ? `<br><span style="color:#dfc084;font-weight:700">${c.dashName}：</span><span style="color:#cbd5e1">${c.dashDesc}</span>` : ''}</div>`;
      gridEl.appendChild(card);
    });
  } else if (codexTab === 'monsters') {
    buildFilterBar([
      { id: 'all', label: '全部魔物' },
      { id: 'normal', label: '层域傀儡' },
      { id: 'scene', label: '层域精英' },
      { id: 'boss', label: '统领与守誓主宰' },
      { id: 'special', label: '无尽祭坛首领' }
    ]);
    bannerEl.innerHTML = `<span>◆ 第 6 / 10 / 14 层固定刷新先锋统领，第 4 / 8 / 12 / 16 层固定迎战四幕守誓主宰并触发宽银幕过场与救赎谢幕。</span>`;
    MONSTER_CODEX.forEach(m => {
      if (codexFilter !== 'all' && m.cat !== codexFilter) return;
      const tierCls = m.cat === 'special' ? 't4' : (m.cat === 'boss' ? 't3' : (m.cat === 'scene' ? 't2' : 't1'));
      const sprUrl = _spireImgUrl(m.sprite);
      const card = document.createElement('div');
      card.className = `codex-card ${tierCls}`;
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="item-emblem ${tierCls}" style="overflow:hidden;padding:2px">
            ${sprUrl ? `<img src="${sprUrl}" alt="${m.name}" style="width:100%;height:100%;object-fit:contain">` : m.icon}
          </div>
          <div class="card-meta">
            <div class="codex-card-title">${m.name}</div>
            <div class="card-badges">
              <span class="tag ${tierCls}">${m.badge}</span>
              <span class="tag">${m.wave}</span>
            </div>
          </div>
        </div>
        <div class="stat-chips"><span class="stat-chip">${m.stats}</span></div>
        <div class="codex-card-desc">${m.desc}</div>`;
      gridEl.appendChild(card);
    });
  } else if (codexTab === 'world') {
    buildFilterBar([
      { id: 'all', label: '全部奇观' },
      { id: 'scene', label: '四大烬塔层域' },
      { id: 'terrain', label: '层域标志机关' },
      { id: 'relic', label: '无尽共鸣祭坛' }
    ]);
    bannerEl.innerHTML = `<span>◆ 随登塔进度依次穿越<b>雨夜长桥 → 永冻冰窟 → 倒悬钟楼 → 日蚀镜界</b>，每层均配备独立机关、环境音景与可破坏封魂器物。</span>`;
    if (codexFilter === 'all' || codexFilter === 'scene') {
      SCENES.forEach(sc => {
        const vistaUrl = _spireImgUrl(sc.vistaImg);
        const card = document.createElement('div');
        card.className = 'codex-card t2';
        card.innerHTML = `
          ${vistaUrl ? `<div class="codex-scene-banner"><img src="${vistaUrl}" alt="${sc.name}"></div>` : ''}
          <div class="codex-card-top">
            <div class="item-emblem t2">${sc.icon}</div>
            <div class="card-meta">
              <div class="codex-card-title">${sc.name}</div>
              <div class="card-badges">
                <span class="tag t2">${sc.eventIcon} ${sc.eventName}</span>
                <span class="tag">${sc.exclMobName}</span>
              </div>
            </div>
          </div>
          <div class="stat-chips"><span class="stat-chip">${sc.terrainSummary || ''}</span></div>
          <div class="codex-card-desc">${sc.eventDesc}</div>`;
        gridEl.appendChild(card);
      });
    }
    if ((codexFilter === 'all' || codexFilter === 'terrain') && typeof TERRAIN_CODEX !== 'undefined') {
      TERRAIN_CODEX.forEach(tr => {
        const card = document.createElement('div');
        card.className = `codex-card t3`;
        card.innerHTML = `
          <div class="codex-card-top">
            <div class="item-emblem t3">${tr.icon}</div>
            <div class="card-meta">
              <div class="codex-card-title">【层域机关】${tr.name}</div>
              <div class="card-badges">
                <span class="tag t3">${tr.badge}</span>
                <span class="tag">${tr.scenes}</span>
              </div>
            </div>
          </div>
          <div class="codex-card-desc">${tr.desc}</div>`;
        gridEl.appendChild(card);
      });
    }
    if (codexFilter === 'all' || codexFilter === 'relic') {
      SPECIAL_RELICS.forEach(rel => {
        const card = document.createElement('div');
        card.className = 'codex-card t4';
        card.innerHTML = `
          <div class="codex-card-top">
            <div class="item-emblem t4">${rel.icon}</div>
            <div class="card-meta">
              <div class="codex-card-title">【记忆祭坛】${rel.name}</div>
              <div class="card-badges">
                <span class="tag t4">小概率现世</span>
                <span class="tag tag-merge">唤醒 ${rel.bossIcon} ${rel.bossName}</span>
              </div>
            </div>
          </div>
          <div class="codex-card-desc">第 17 层无尽试炼起概率在层域中现世（屏幕边缘显示方位信标，主线 1~16 层绝不乱入）。<b>踏入祭坛驻留 1.1 秒</b>即可唤醒记忆首领（回合延长 +25s）！<br><b>${rel.rewardDesc}</b></div>`;
        gridEl.appendChild(card);
      });
    }
  }
}

function openChangelogModal() {
  if (state === 'wave') pauseGame();
  beep(510, 0.045, 'triangle', 0.04);
  const titleEl = document.getElementById('changelogTitle');
  if (titleEl && typeof APP_VERSION !== 'undefined') {
    titleEl.textContent = `烬塔纪元志  ·  ${APP_VERSION}`;
  }
  const listEl = document.getElementById('changelogList');
  if (listEl && typeof CHANGELOG_HISTORY !== 'undefined') {
    listEl.innerHTML = '';
    CHANGELOG_HISTORY.forEach((entry, idx) => {
      const card = document.createElement('div');
      card.className = 'cl-card' + (idx === 0 ? ' latest' : '');
      card.innerHTML = `
        <div class="cl-head">
          <span class="cl-ver">${entry.ver}</span>
          <span class="cl-tag">${entry.tag || '版本更新'}</span>
          <span class="cl-date">${entry.date}</span>
        </div>
        <div class="cl-title">${entry.title}</div>
        <ul class="cl-items">${(entry.items || []).map(line => `<li>${line}</li>`).join('')}</ul>`;
      listEl.appendChild(card);
    });
    listEl.scrollTop = 0;
  }
  const modal = document.getElementById('changelogModal');
  if (modal) modal.classList.remove('hidden');
}

function closeChangelogModal() {
  const modal = document.getElementById('changelogModal');
  if (modal) modal.classList.add('hidden');
  beep(380, 0.04, 'triangle', 0.035);
}

(function bindChangelogBackdrop() {
  const modal = document.getElementById('changelogModal');
  if (modal && modal.addEventListener) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeChangelogModal();
    });
  }
})();
