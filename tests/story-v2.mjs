import { createHash } from 'node:crypto';

export const V21_CINEMATIC_FILES = ['awakening-coffin', 'awakening-lantern', 'qingyu-rain',
  'jinyu-clash', 'jinyu-farewell', 'astria-wings', 'jialan-clock', 'eclipse-mirror', 'dawn']
  .map(name => `assets/spire/v3/${name}.png`);

export function runStoryV2Suite({ createEnv, vm, assert, ROOT, assetDimsMap }) {
  const evaluate = (env, script) => vm.runInContext(script, env.sandbox, { timeout: 20000 });
  const make = (mobile = false) => createEnv(mobile, mobile ? 390 : 1440, mobile ? 844 : 900, mobile ? 3 : 2);

  // Runtime text is the versioned story contract, with no omitted floor or ending.
  const dataEnv = make();
  const story = JSON.parse(evaluate(dataEnv, 'JSON.stringify(SpireStoryV2)'));
  assert.strictEqual(story.floors.length, 16, 'All sixteen floors must ship offline');
  // Fingerprint of the V2.1 sixteen-floor speaker/text contract. Keep the
  // test self-contained; the design book lives outside this repository.
  const dialogueContract = story.floors.map(f => [f.floor, f.before.map(r => [r.speaker, r.text]), f.after.map(r => [r.speaker, r.text])]);
  const fingerprint = createHash('sha256').update(JSON.stringify(dialogueContract)).digest('hex');
  assert.strictEqual(fingerprint, '16d8b5273d6e654f2a074f931b52a5e889004e8ba7f8fe2abc36573312096674',
    'Every versioned sixteen-floor dialogue line must reach the runtime data unchanged');
  for (let n = 1; n <= 16; n++) {
    const floor = story.floors.find(f => f.floor === n);
    assert(floor && floor.before.length && floor.after.length, 'Missing before/after script on floor ' + n);
  }
  assert.strictEqual(story.opening.shots.length, 6, 'Awakening must have six distinct shots');
  assert.strictEqual(story.opening.shots.reduce((sum, shot) => sum + shot.seconds, 0), 48, 'Opening timing must preserve the 48-second design');
  assert.strictEqual(story.qingyu_arc.stages.length, 6, 'Qingyu must have six progressive identity nodes');
  for (const key of ['jinyu', 'astria', 'jialan', 'eclipse']) {
    for (const stage of ['first_meeting', 'pre_battle', 'phase2', 'boss_defeated']) {
      assert(story.boss_stages[key][stage].dialogue.length, `Missing ${key}/${stage} dialogue`);
    }
  }
  const cinematicSections = [story.opening, ...story.qingyu_arc.stages, story.player_defeat, ...Object.values(story.endings),
    ...Object.values(story.boss_stages).flatMap(b => ['first_meeting', 'pre_battle', 'phase2', 'boss_defeated'].map(stage => b[stage]))];
  const cinematicContract = cinematicSections.map(section => [section.stageId,
    section.dialogue.map(row => [row.lineId, row.speaker, row.text]),
    section.shots.map(shot => [shot.shotId, shot.seconds, shot.line && [shot.line.speaker, shot.line.text]]), section.final_text || null]);
  assert.strictEqual(createHash('sha256').update(JSON.stringify(cinematicContract)).digest('hex'),
    'a7a3039460a59a6b76695b939fd2f2814d90c0ce693d82f8b7b57f144a128983',
    'The opening, Qingyu arc, boss stages, defeat and endings must preserve the V2.1 script/timing contract');
  const authoredIds = new Set();
  for (const section of cinematicSections) {
    for (const row of section.dialogue) {
      assert(row.lineId && !authoredIds.has(row.lineId), 'Cinematic dialogue requires a stable, unique line ID: ' + row.lineId);
      authoredIds.add(row.lineId);
    }
    for (const shot of section.shots) {
      assert(Number.isFinite(shot.seconds) && shot.seconds > 0, 'Each cinematic shot needs an intentional positive duration');
      if (!shot.line || shot.line.speaker === '界面提示') continue;
      assert(section.dialogue.some(row => row.speaker === shot.line.speaker && row.text === shot.line.text),
        'Polished shot text diverged from its own dialogue: ' + shot.shotId);
    }
  }
  for (const key of ['zero', 'jinyu', 'astria', 'jialan', 'qingyu', 'eclipse']) {
    const dims = assetDimsMap[`assets/spire/port_${key}.jpg`];
    assert(dims && dims.h === 768 && dims.w >= 500 && dims.w <= 640, `Original ${key} portrait must be preserved`);
  }
  for (const file of ['title-clean.png', 'wind-pavilion.png', 'player-defeat-clean.png', 'awakening-atlas.png',
    'qingyu-atlas.png', 'jinyu-atlas.png', 'astria-atlas.png', 'jialan-atlas.png', 'eclipse-atlas.png', 'endings-atlas.png']) {
    assert(assetDimsMap['assets/spire/v2/' + file], 'Missing production art: ' + file);
  }
  for (const path of V21_CINEMATIC_FILES) {
    const dims = assetDimsMap[path];
    assert(dims && dims.w >= 1672 && dims.h >= 941, 'Independent CG must preserve its native full-scene pixels: ' + path);
    assert(Math.abs(dims.w / dims.h - 16 / 9) < .025, 'Independent CG must use a landscape cinematic composition: ' + path);
  }

  // Actual director state and DOM agree about speakers and reading controls.
  const readerEnv = make(true);
  const reader = evaluate(readerEnv, `(() => {
    SpireDirector.replayEvent('opening.awakening');
    for (let i = 0; i < 3; i++) SpireDirector.advanceOrSkip(true);
    const voice = SpireDirector.getState();
    const root = document.getElementById('spireNarrative');
    const voiceIsUnseen = voice.speaker === '神秘女声' && voice.portraitId === null &&
      root.querySelector('.story-portrait-left').classList.contains('hidden') && root.querySelector('.story-portrait-right').classList.contains('hidden');
    SpireDirector.closeReplay();
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    wave = 2; beginWave();
    const first = SpireDirector.getState();
    SpireDirector.setSkipRead(true); SpireDirector.update(.001);
    const unreadStopsSkip = SpireDirector.getState().lineIndex === first.lineIndex && !SpireDirector.getState().skipRead;
    SpireDirector.advanceOrSkip(false);
    const revealed = SpireDirector.getState();
    const clickRevealsOnly = revealed.lineIndex === first.lineIndex && revealed.revealed && revealed.history.some(h => h.text === first.text);
    SpireDirector.setHidden(true); SpireDirector.advanceOrSkip(false);
    const hiddenClickRestoresOnly = !SpireDirector.getState().hiddenUi && SpireDirector.getState().lineIndex === first.lineIndex;
    SpireDirector.setAutoPlay(true); SpireDirector.toggleLog();
    const atLog = SpireDirector.getState(); SpireDirector.update(20);
    const logPauses = SpireDirector.getState().logOpen && SpireDirector.getState().lineIndex === atLog.lineIndex;
    SpireDirector.toggleLog(); SpireDirector.setAutoPlay(false);
    const logClosesAtSameLine = !SpireDirector.getState().logOpen && SpireDirector.getState().text === atLog.text;
    SpireDirector.setPreferences({ textScale: 1.3, instantText: true, reducedMotion: true });
    const preferences = SpireDirector.getPreferences();
    const prefsWork = preferences.textScale === 1.3 && preferences.instantText && preferences.reducedMotion &&
      root.style.getPropertyValue('--story-text-scale') === '1.3' && root.classList.contains('story-reduced-motion');
    SpireDirector.setPreferences({ instantText: false });
    SpireDirector.resetForNewRun();
    SpireDirector.replayEvent('floor.2.before');
    SpireDirector.setSkipRead(true); SpireDirector.update(.001);
    const readAdvances = SpireDirector.getState().lineIndex === 1;
    SpireDirector.update(.001);
    const nextUnreadStops = SpireDirector.getState().lineIndex === 1 && !SpireDirector.getState().skipRead;
    SpireDirector.closeReplay();
    return { voiceIsUnseen, unreadStopsSkip, clickRevealsOnly, hiddenClickRestoresOnly, logPauses,
      logClosesAtSameLine, prefsWork, readAdvances, nextUnreadStops };
  })()`);
  for (const [key, value] of Object.entries(reader)) assert.strictEqual(value, true, 'Reading invariant: ' + key);

  // A touch scroll is not a tap. Long paragraphs retain their reading time, and
  // phone viewport changes must not reset the current line or select an option.
  const touchReaderEnv = make(true);
  const touchReader = evaluate(touchReaderEnv, `(() => {
    SpireDirector.replayEvent('floor.2.before');
    const root = document.getElementById('spireNarrative');
    const paragraph = root.querySelector('.story-dialogue-text');
    paragraph.dispatch('pointerdown', { pointerId: 77, pointerType: 'touch', clientX: 100, clientY: 600 });
    document.hidden = true; document.dispatch('visibilitychange', {});
    document.hidden = false; document.dispatch('visibilitychange', {});
    SpireDirector.advanceOrSkip(false); SpireDirector.setAutoPlay(true);
    const beforeBackground = SpireDirector.getState().lineIndex; SpireDirector.update(10);
    const backgroundClearsHeldPointer = SpireDirector.getState().lineIndex === beforeBackground + 1;
    SpireDirector.closeReplay(); SpireDirector.replayEvent('floor.2.before');
    paragraph.clientHeight = 80; paragraph.scrollHeight = 300;
    SpireDirector.advanceOrSkip(false); SpireDirector.setAutoPlay(true);
    const first = SpireDirector.getState(); SpireDirector.update(20);
    const waitsForUnreadOverflow = SpireDirector.getState().lineIndex === first.lineIndex && SpireDirector.getState().awaitingScroll;
    paragraph.scrollTop = 220; paragraph.dispatch('scroll'); SpireDirector.update(.6);
    const givesReadingGrace = SpireDirector.getState().lineIndex === first.lineIndex && !SpireDirector.getState().awaitingScroll;
    SpireDirector.update(3);
    const advancesAfterReading = SpireDirector.getState().lineIndex === first.lineIndex + 1 && paragraph.scrollTop === 0;
    SpireDirector.setAutoPlay(false); paragraph.scrollHeight = paragraph.clientHeight;
    SpireDirector.advanceOrSkip(false);
    const beforeDrag = SpireDirector.getState().lineIndex;
    const pointer = (type, y) => paragraph.dispatch(type, { pointerId: 8, pointerType: 'touch', clientX: 120, clientY: y });
    pointer('pointerdown', 610); pointer('pointermove', 555); pointer('pointerup', 555);
    paragraph.dispatch('click', { detail: 1 });
    const dragDoesNotAdvance = SpireDirector.getState().lineIndex === beforeDrag;
    pointer('pointerdown', 600); pointer('pointerup', 600); paragraph.dispatch('click', { detail: 1 });
    const realTapAdvances = SpireDirector.getState().lineIndex === beforeDrag + 1;

    SpireDirector.toggleLog();
    const readingState = () => { const st = SpireDirector.getState(); return JSON.stringify({
      id: st.eventId, line: st.lineIndex, text: st.text, revealed: st.revealed, log: st.logOpen, auto: st.auto }); };
    const beforeRotate = readingState(); let rotationsPreserveReading = true;
    for (const size of [[844, 390], [320, 568], [390, 611]]) {
      window.innerWidth = size[0]; window.innerHeight = size[1]; window.dispatch('resize'); _flushAnimationFrame();
      rotationsPreserveReading = rotationsPreserveReading && readingState() === beforeRotate;
    }
    SpireDirector.toggleLog(); SpireDirector.closeReplay();
    SpireDirector.replayEvent('final.choice');
    const choice = root.querySelector('.story-choice-panel'); choice.scrollTop = 180;
    const beforeChoice = JSON.stringify(SpireDirector.getState().choices);
    window.innerWidth = 844; window.innerHeight = 390; window.dispatch('resize'); _flushAnimationFrame();
    SpireDirector.update(30);
    const rotateDoesNotChoose = SpireDirector.getState().eventId === 'final.choice' &&
      JSON.stringify(SpireDirector.getState().choices) === beforeChoice;
    SpireDirector.choose('memories');
    const newChoiceStartsAtTop = choice.scrollTop === 0;
    SpireDirector.closeReplay();
    return { backgroundClearsHeldPointer, waitsForUnreadOverflow, givesReadingGrace, advancesAfterReading, dragDoesNotAdvance,
      realTapAdvances, rotationsPreserveReading, rotateDoesNotChoose, newChoiceStartsAtTop };
  })()`);
  for (const [key, value] of Object.entries(touchReader)) assert.strictEqual(value, true, 'Mobile reading invariant: ' + key);

  // Observe real animation handles as well as director state. Narrative motion
  // must never survive into gameplay or continue behind another reading surface.
  for (const mobile of [false, true]) {
    const motionEnv = make(mobile);
    const activeAnimations = () => motionEnv.animations.filter(a => a.playState !== 'idle' && a.playState !== 'finished');
    assert.strictEqual(activeAnimations().length, 0, 'Title/menu must not start narrative animations');
    evaluate(motionEnv, `SpireDirector.replayEvent('opening.awakening')`);
    let motion = evaluate(motionEnv, 'SpireDirector.getState().motion');
    assert(motion.enabled && motion.running && !motion.paused, 'Foreground cinematic must start its motion');
    assert(activeAnimations().length > 0, 'Cinematic motion must produce actual animation handles');
    for (const animation of activeAnimations()) {
      assert(animation.target.closest('.spire-narrative'), 'Narrative animation escaped its own UI subtree');
      for (const keyframe of animation.keyframes) {
        assert(Object.keys(keyframe).every(property => ['transform', 'opacity', 'offset', 'easing', 'composite'].includes(property)),
          'Narrative motion must stay on compositor-friendly transform/opacity properties');
      }
    }
    const created = motionEnv.animations.length;
    evaluate(motionEnv, 'for (let i = 0; i < 5; i++) SpireDirector.update(.03)');
    assert.strictEqual(motionEnv.animations.length, created, 'Ordinary story ticks must not recreate animations');

    const freezeCases = [
      { name: 'hidden tab', enter: `document.hidden = true; document.dispatch('visibilitychange', {})`, leave: `document.hidden = false; document.dispatch('visibilitychange', {})` },
      { name: 'blurred window', enter: `window.dispatch('blur')`, leave: `window.dispatch('focus')` },
      { name: 'history', enter: 'SpireDirector.toggleLog()', leave: 'SpireDirector.toggleLog()' },
      { name: 'hidden reading UI', enter: 'SpireDirector.setHidden(true)', leave: 'SpireDirector.setHidden(false)' }
    ];
    for (const item of freezeCases) {
      const frozen = evaluate(motionEnv, `(() => {
        ${item.enter};
        const before = SpireDirector.getState();
        const caption = document.getElementById('spireNarrative').querySelector('.story-cinematic-caption').textContent;
        SpireDirector.update(30);
        const after = SpireDirector.getState();
        return { paused: after.motion.paused, running: after.motion.running,
          lineStable: before.eventId === after.eventId && before.lineIndex === after.lineIndex && before.revealed === after.revealed,
          captionStable: caption === document.getElementById('spireNarrative').querySelector('.story-cinematic-caption').textContent,
          cssPaused: document.getElementById('spireNarrative').classList.contains('story-motion-paused') };
      })()`);
      assert(frozen.paused && !frozen.running && frozen.lineStable && frozen.captionStable && frozen.cssPaused,
        `${item.name} must freeze both reading and cinematic motion`);
      assert(activeAnimations().every(a => a.playState === 'paused'), `${item.name} left an animation running`);
      evaluate(motionEnv, item.leave);
      motion = evaluate(motionEnv, 'SpireDirector.getState().motion');
      assert(motion.running && !motion.paused, `${item.name} failed to resume foreground motion`);
      assert(activeAnimations().every(a => a.playState === 'running'), `${item.name} failed to resume its handles`);
    }

    evaluate(motionEnv, 'SpireDirector.setPreferences({ reducedMotion: true })');
    motion = evaluate(motionEnv, 'SpireDirector.getState().motion');
    assert(!motion.enabled && !motion.running, 'Reduced motion must disable cinematic animation');
    assert.strictEqual(activeAnimations().length, 0, 'Reduced motion must cancel existing handles');
    assert(evaluate(motionEnv, 'document.getElementById("spireNarrative").classList.contains("story-reduced-motion")'),
      'Reduced motion must also disable CSS animation/transition effects');
    const reducedCreated = motionEnv.animations.length;
    evaluate(motionEnv, 'SpireDirector.advanceOrSkip(true); SpireDirector.update(.1)');
    assert.strictEqual(motionEnv.animations.length, reducedCreated, 'New shots must remain static under reduced motion');
    assert(evaluate(motionEnv, 'SpireDirector.getState().text.length > 0'), 'Reduced motion must retain readable story text');
    evaluate(motionEnv, 'SpireDirector.setPreferences({ reducedMotion: false }); SpireDirector.closeReplay()');
    motion = evaluate(motionEnv, 'SpireDirector.getState().motion');
    assert(!motion.running && motion.paused, 'Closing narrative must stop its motion');
    assert.strictEqual(activeAnimations().length, 0, 'Closing narrative must cancel all remaining handles');

    evaluate(motionEnv, `startGame('allrounder', { mode: 'story' }); __drainDirector()`);
    const battleCreated = motionEnv.animations.length;
    evaluate(motionEnv, 'for (let i = 0; i < 10; i++) { update(.02); draw(); }');
    assert.strictEqual(motionEnv.animations.length, battleCreated, 'Combat must not create narrative animations');
    assert.strictEqual(activeAnimations().length, 0, 'Combat must not inherit active narrative animation handles');
  }

  const systemReducedEnv = createEnv(false, 1440, 900, 2, 'running', { reducedMotion: true });
  evaluate(systemReducedEnv, `SpireDirector.replayEvent('opening.awakening')`);
  assert(evaluate(systemReducedEnv, 'SpireDirector.getPreferences().reducedMotion'), 'System reduced-motion preference must be respected at startup');
  assert.strictEqual(systemReducedEnv.animations.length, 0, 'System reduced motion must never create the first animation');
  const staticEnv = make();
  const staticFallback = evaluate(staticEnv, `(() => {
    const create = document.createElement.bind(document);
    document.createElement = tag => { const el = create(tag); el.animate = undefined; return el; };
    SpireDirector.replayEvent('opening.awakening');
    const before = SpireDirector.getState(); SpireDirector.advanceOrSkip(true);
    const after = SpireDirector.getState();
    return before.text.length > 0 && after.text.length > 0 && after.eventId !== before.eventId && !after.motion.running;
  })()`);
  assert(staticFallback, 'Browsers without Web Animations must preserve the static, navigable story');
  const missingImageEnv = make();
  const missingImage = evaluate(missingImageEnv, `(() => {
    SpireDirector.replayEvent('opening.awakening');
    const image = document.querySelector('.story-scene-image');
    image.dispatch('error');
    const fallback = SpireDirector.getState();
    image.dispatch('error');
    const stillReadable = SpireDirector.getState().text.length > 0 && document.querySelector('.story-film-frame').classList.contains('art-unavailable');
    SpireDirector.advanceOrSkip(true);
    return { fallbackPath: fallback.artPath, fallbackFormat: fallback.artFormat,
      fallbackScale: fallback.artScale, stillReadable, nextShotReadable: SpireDirector.getState().text.length > 0 };
  })()`);
  assert.strictEqual(missingImage.fallbackPath, 'assets/spire/v2/awakening-atlas.png', 'Missing independent CG must fall back to its authored scene');
  assert.strictEqual(missingImage.fallbackFormat, 'atlas');
  assert(missingImage.fallbackScale <= 1.25 && missingImage.stillReadable && missingImage.nextShotReadable,
    'Image failures must preserve both clarity limits and navigable dialogue');

  // Every after-combat passage is reachable through the runtime event flow.
  const afterEnv = make();
  const after = evaluate(afterEnv, `(() => {
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    let callbacks = 0; const missing = [];
    for (const floor of SpireStoryV2.floors) {
      SpireDirector.resetForNewRun();
      const texts = new Set(); SpireDirector.onFloorCleared(floor.floor, () => callbacks++);
      for (let guard = 0; guard < 150 && SpireDirector.isActive(); guard++) {
        const st = SpireDirector.getState(); if (st.text.trim()) texts.add(st.text);
        if (st.kind === 'choice') {
          const option = st.choices.find(c => /continue|ready|back|confirm/.test(c.id) && !c.disabled);
          if (!option) throw new Error('Unexpected after-floor choice: ' + st.eventId);
          SpireDirector.choose(option.id);
        } else if (st.kind === 'title') SpireDirector.advanceOrSkip(true);
        else SpireDirector.advanceOrSkip(false);
      }
      if (SpireDirector.isActive()) throw new Error('After-floor event never completed: ' + floor.floor);
      for (const row of floor.after) if (!texts.has(row.text)) missing.push({ floor: floor.floor, text: row.text });
    }
    return { callbacks, missing };
  })()`);
  assert.strictEqual(after.callbacks, 16, 'Every floor-after callback must execute once');
  assert.strictEqual(after.missing.length, 0, 'After-combat runtime omitted dialogue: ' + JSON.stringify(after.missing));

  const abortEnv = make();
  const aborted = evaluate(abortEnv, `(() => {
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    let callbacks = 0;
    SpireDirector.onFloorCleared(2, () => { callbacks++; player.mats += 999; });
    const before = JSON.stringify({ story: player.story, mats: player.mats, seen: SpireDirector.getRunState() });
    SpireDirector.abortActive(); SpireDirector.update(30);
    return !SpireDirector.isActive() && callbacks === 0 && before ===
      JSON.stringify({ story: player.story, mats: player.mats, seen: SpireDirector.getRunState() });
  })()`);
  assert(aborted, 'Aborting an unfinished narrative must cancel its callbacks while preserving run progress');

  // Story bosses always have exactly two phases, even on the lowest difficulty.
  // First-bar depletion is neither a reward event nor the death of a companion.
  const bossEnv = make();
  const bosses = evaluate(bossEnv, `(() => {
    selectedDiff = 0;
    const results = [];
    for (const floor of [4, 8, 12, 16]) {
      startGame('allrounder', { mode: 'story' }); __drainDirector();
      if (floor === 16) __primeTrueEnding();
      wave = floor; beginWave(); __drainDirector('refuse');
      const boss = __spawnPendingBoss();
      if (!boss) throw new Error('Boss failed to spawn on floor ' + floor);
      const key = ({ 4: 'jinyu', 8: 'astria', 12: 'jialan' })[floor];
      const before = { mats: player.mats, kills: player.kills, drops: drops.length, crates: pendingCrates };
      const guaranteed = boss.canPhase2 && boss.storyPhaseBoss && boss.storyStage === 1;
      hurtEnemy(boss, boss.maxHp + 99999, true);
      const firstPhase = boss.storyStage === 2 && boss.hp > 0 && !boss._rewarded &&
        player.mats === before.mats && player.kills === before.kills && pendingCrates === before.crates &&
        drops.length === before.drops && (!key || !getSpireStoryProgress().mementos[key]);
      const phaseCinematic = SpireDirector.isBlockingGameplay();
      const noLegacyPhaseBanner = bossCutscene === null;
      const jialanSelfDamagePanel = floor !== 12 || document.querySelector('.story-scene-image')._storyArt.panel === 2;
      const phaseEvents = __drainDirector();
      const phaseVisuals = floor !== 4 || (phaseEvents[0].eventId === 'boss.jinyu.phase2.wound' &&
        !phaseEvents[0].text.trim() && phaseEvents[0].artPath === 'assets/spire/v2/jinyu-atlas.png' &&
        phaseEvents.some(event => event.artPath === 'assets/spire/v3/jinyu-clash.png'));
      const jialanPhasePreserved = floor !== 12 || (jialanSelfDamagePanel && phaseEvents.every(event =>
        event.artPath === 'assets/spire/v2/jialan-atlas.png'));
      hurtEnemy(boss, boss.maxHp + 99999, true);
      let finalCinematic, rewardHandledCleanly;
      if (floor < 16) {
        // Early defeat on Floors 4/8/12 drops Boss rewards & crate immediately and keeps wave open to farm mobs!
        const waveContinues = state === 'wave' && !!spireFloorFlow.bossDefeated && !!boss._rewarded &&
          drops.some(d => d.kind === 'crate' && d.isBoss);
        finishWave();
        finalCinematic = waveContinues && SpireDirector.isBlockingGameplay();
        rewardHandledCleanly = waveContinues;
      } else {
        finalCinematic = SpireDirector.isBlockingGameplay();
        rewardHandledCleanly = !boss._rewarded && player.kills === before.kills;
      }
      const farewellEvents = __drainDirector();
      const jialanGiftAfterDefeat = floor !== 12 || (
        farewellEvents.some(event => event.eventId.startsWith('boss.jialan.boss_defeated') && event.artPath === 'assets/spire/v3/jialan-clock.png') &&
        farewellEvents.some(event => event.eventId === 'memento.jialan' && event.artPath === 'assets/spire/v3/jialan-clock.png'));
      const after = { mats: player.mats, kills: player.kills, crates: pendingCrates };
      hurtEnemy(boss, 999999, true); killEnemyRewards(boss);
      const idempotent = player.mats === after.mats && player.kills === after.kills && pendingCrates === after.crates;
      results.push({ floor, guaranteed, firstPhase, phaseCinematic, noLegacyPhaseBanner, phaseVisuals, jialanPhasePreserved, jialanGiftAfterDefeat,
        finalCinematic, rewardHandledCleanly,
        rewarded: !!boss._rewarded, idempotent,
        memento: !key || !!getSpireStoryProgress().mementos[key],
        finalEnding: floor !== 16 || (getSpireStoryProgress().ending === 'B' && state === 'end') });
    }
    return results;
  })()`);
  for (const result of bosses) {
    for (const [key, value] of Object.entries(result)) if (key !== 'floor') assert.strictEqual(!!value, true, `Floor ${result.floor}: ${key}`);
  }

  const commanderEnv = make();
  const commanders = evaluate(commanderEnv, `(() => {
    const results = [];
    for (const [floor, variant] of [[6, 'glacial_valkyrie'], [10, 'shadow_stalker'], [14, 'iron_warden']]) {
      startGame('allrounder', { mode: 'story' }); __drainDirector();
      wave = floor; beginWave(); __drainDirector();
      const commander = createEnemy(player.x + 150, player.y, 'mini_boss', variant);
      commander.canPhase2 = true; player.waveMythicAwakened = false;
      const before = JSON.stringify({ story: player.story, mats: player.mats, kills: player.kills });
      hurtEnemy(commander, commander.maxHp + 99999, true);
      results.push({ floor, awakened: commander.mythicPhase2 && commander.hp > 0 && !commander._rewarded,
        noWrongStory: !SpireDirector.isActive() && bossCutscene === null,
        noPrematureReward: before === JSON.stringify({ story: player.story, mats: player.mats, kills: player.kills }) });
    }
    return results;
  })()`);
  for (const result of commanders) assert(result.awakened && result.noWrongStory && result.noPrematureReward,
    'Floor ' + result.floor + ' commander awakening must not play a main boss\'s story or grant its reward');

  // A lethal player hit locks the result before a same-frame boss hit can grant rewards.
  const defeatEnv = make();
  const defeat = evaluate(defeatEnv, `(() => {
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    wave = 4; beginWave(); __drainDirector();
    const boss = __spawnPendingBoss(); hurtEnemy(boss, boss.maxHp + 99999, true); __drainDirector();
    boss.hp = 1; player.hp = 1; player.armor = player.dodge = player.shield = player.invuln = 0;
    const mats = player.mats, kills = player.kills;
    hurtPlayer(999999); hurtEnemy(boss, 999999, true); finishWave();
    const locked = spireFloorFlow.result === 'player-defeated' && !getSpireStoryProgress().mementos.jinyu && !boss._rewarded;
    __drainDirector();
    return { locked, result: document.getElementById('endMenu').getAttribute('data-result'),
      ended: state === 'end', noRewards: player.mats === mats && player.kills === kills,
      canRetry: !document.getElementById('retryWaveBtn').classList.contains('hidden') };
  })()`);
  assert.strictEqual(defeat.locked, true, 'Player defeat must win the same-frame outcome race');
  assert.strictEqual(defeat.result, 'defeat', 'Player failure must not display a victory ending');
  assert(defeat.ended && defeat.noRewards && defeat.canRetry, 'Player defeat must finish at an unrewarded retry screen');

  // Mementos and the memories they unlock are separate; a missing one blocks refusal.
  const gateEnv = make();
  const gate = evaluate(gateEnv, `(() => {
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    const empty = hasSpireTrueEnding();
    for (const key of SPIRE_MEMENTO_KEYS) grantSpireMemento(key);
    const objectsOnly = hasSpireTrueEnding();
    for (const key of SPIRE_MEMENTO_KEYS.slice(0, 3)) rememberSpireMemento(key);
    const missingMemory = hasSpireTrueEnding();
    rememberSpireMemento('qingyu');
    const complete = hasSpireTrueEnding();
    delete player.story.mementos.astria;
    const missingObject = hasSpireTrueEnding();
    wave = 16; beginWave();
    for (let i = 0; i < 60 && !SpireDirector.getState().choices.length; i++) SpireDirector.advanceOrSkip(true);
    const atChoice = SpireDirector.getState();
    SpireDirector.setAutoPlay(true);
    for (let i = 0; i < 100; i++) SpireDirector.update(0.2);
    SpireDirector.advanceOrSkip(true);
    const doesNotAutoChoose = SpireDirector.getState().eventId === atChoice.eventId && !player.story.finalChoice;
    const cannotRefuse = resolveSpireFinalChoice('refuse') === false;
    const accept = SpireDirector.getState().choices.find(c => /accept/.test(c.id));
    if (!accept || SpireDirector.choose(accept.id) === false) throw new Error('Missing accept-lamp option');
    __drainDirector();
    return { empty, objectsOnly, missingMemory, complete, missingObject, doesNotAutoChoose, cannotRefuse,
      endingA: player.story.ending === 'A' && state === 'end' && !waveCheckpoint,
      endingRecord: JSON.parse(localStorage.getItem('spire-endings-v2') || '{}').A === true };
  })()`);
  for (const key of ['empty', 'objectsOnly', 'missingMemory', 'missingObject']) assert.strictEqual(gate[key], false, 'True ending gate: ' + key);
  for (const key of ['complete', 'doesNotAutoChoose', 'cannotRefuse', 'endingA', 'endingRecord']) assert.strictEqual(gate[key], true, 'Ending choice invariant: ' + key);

  // Checkpoints own their nested story progress. Reloading is not a death retry.
  const saveEnv = make();
  const saved = evaluate(saveEnv, `(() => {
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    grantSpireMemento('jinyu'); rememberSpireMemento('jinyu');
    player.weapons = [makeWeapon('katana', 5), makeWeapon('pistol', 3)];
    applyWeaponEvolution(player.weapons[0], 1);
    const evolution = player.weapons[0].evo;
    player.mats = 71; player.retryCount = 2;
    wave = 8; beginWave(); __drainDirector();
    const checkpoint = waveCheckpoint;
    player.story.mementos.astria = true; player.story.memories.jinyu = false;
    player.weapons[0].evo = 'unsaved-local-change';
    const deepCopy = !checkpoint.player.story.mementos.astria && checkpoint.player.story.memories.jinyu === true;
    const weaponCopy = checkpoint.player.weapons[0].tier === 5 && checkpoint.player.weapons[0].evo === evolution;
    const wrote = SpireSave.write(checkpoint);
    showStart(); continueSpireStory(); __drainDirector();
    const resumed = wave === 8 && state === 'wave' && player.mats === 71 && player.retryCount === 2 &&
      player.story.mementos.jinyu && player.story.memories.jinyu && !player.story.mementos.astria;
    const evolutionResumed = player.weapons[0].tier === 5 && player.weapons[0].evo === evolution &&
      player.weapons[0].evoName === WEAPONS.katana.evos[1].name && player.weapons[1].tier === 3;
    const current = SpireSave.load();
    const corrupted = JSON.parse(JSON.stringify(current.checkpoint)); corrupted.wave = 1000;
    const rejectsInvalid = !SpireSave.valid(corrupted);
    const badTier = JSON.parse(JSON.stringify(current.checkpoint)); badTier.player.weapons[0].tier = MAX_WEAPON_TIER + 1;
    const rejectsInvalidTier = !SpireSave.valid(badTier);
    return { deepCopy, weaponCopy, wrote, resumed, evolutionResumed, rejectsInvalid, rejectsInvalidTier };
  })()`);
  for (const [key, value] of Object.entries(saved)) assert.strictEqual(value, true, 'Checkpoint invariant: ' + key);

  // Upstream T5 weapons may be saved before their branch has been chosen. A
  // resumed run must resolve that choice exactly once before starting combat.
  const pendingEvolutionEnv = make(true);
  const pendingEvolution = evaluate(pendingEvolutionEnv, `(() => {
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    const checkpoint = JSON.parse(JSON.stringify(waveCheckpoint));
    checkpoint.wave = 5; checkpoint.sceneId = 'glacier';
    checkpoint.player.weapons = [makeWeapon('katana', 5)];
    const saved = SpireSave.write(checkpoint);
    showStart(); continueSpireStory();
    const needsChoice = state === 'evolution' && !document.getElementById('evoModal').classList.contains('hidden');
    const buttons = document.getElementById('evoChoices').querySelectorAll('.evo-pick-btn');
    if (buttons.length !== 2) return { saved, needsChoice, twoBranches: false };
    buttons[0].click(); __drainDirector();
    const chosen = WEAPONS.katana.evos[0].id;
    const resumesAfterChoice = state === 'wave' && wave === 5 && player.weapons[0].evo === chosen &&
      SpireSave.load().checkpoint.player.weapons[0].evo === chosen;
    buttons[1].click(); buttons[0].click();
    const staleCannotReselect = player.weapons[0].evo === chosen && wave === 5;
    showStart(); startGame('allrounder', { mode: 'story' }); __drainDirector();
    const fresh = JSON.stringify({ weapons: player.weapons, wave, state });
    buttons[1].click();
    const staleCannotAffectNewRun = fresh === JSON.stringify({ weapons: player.weapons, wave, state });
    return { saved, needsChoice, twoBranches: true, resumesAfterChoice, staleCannotReselect, staleCannotAffectNewRun };
  })()`);
  for (const [key, value] of Object.entries(pendingEvolution)) assert.strictEqual(value, true, 'Pending evolution invariant: ' + key);

  const newRunEnv = make();
  const newRun = evaluate(newRunEnv, `(() => {
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    player.mats = 96; wave = 5; beginWave(); __drainDirector(); showStart();
    const savedBefore = localStorage.getItem('ashen-spire-checkpoint-v2');
    startStoryMode();
    const promptsBeforeReplacing = presentationKind === 'confirm' && state === 'menu' &&
      localStorage.getItem('ashen-spire-checkpoint-v2') === savedBefore;
    const cancel = document.getElementById('presentationBody').querySelectorAll('button').find(b => b.textContent.includes('继续原来的旅程'));
    cancel.click(); __drainDirector();
    const cancelResumes = wave === 5 && player.mats === 96;
    showStart(); startStoryMode();
    const confirm = document.getElementById('presentationBody').querySelectorAll('button').find(b => b.textContent.includes('确认'));
    confirm.click(); __drainDirector();
    return { promptsBeforeReplacing, cancelResumes, confirmedRestarts: wave === 1 && state === 'wave' };
  })()`);
  for (const [key, value] of Object.entries(newRun)) assert.strictEqual(value, true, 'New-run confirmation: ' + key);

  // The fifteenth-floor memory review can actually unlock the refusal route.
  const memoryEnv = make();
  const memory = evaluate(memoryEnv, `(() => {
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    for (const k of ['jinyu','astria','jialan']) grantSpireMemento(k);
    wave = 15; beginWave(); __drainDirector();
    const featherGranted = !!player.story.mementos.qingyu;
    finishWave();
    for (let i = 0; i < 40 && !SpireDirector.getState().choices.length; i++) SpireDirector.advanceOrSkip(true);
    const atPrepare = SpireDirector.getState().eventId === 'floor.15.prepare';
    SpireDirector.choose('memories');
    let jialanMemoryArt = false;
    for (const k of SPIRE_MEMENTO_KEYS) {
      if (!SpireDirector.choose(k)) throw new Error('Cannot inspect memento ' + k);
      if (k === 'jialan') jialanMemoryArt = SpireDirector.getState().artPath === 'assets/spire/v3/jialan-clock.png';
      SpireDirector.advanceOrSkip(true);
      if (!SpireDirector.choose('remember')) throw new Error('Cannot confirm memory ' + k);
    }
    const unlocked = hasSpireTrueEnding();
    SpireDirector.choose('back'); SpireDirector.choose('ready'); __drainDirector();
    return { featherGranted, atPrepare, unlocked, jialanMemoryArt, noForcedEnding: !player.story.ending && wave === 15 };
  })()`);
  for (const [key, value] of Object.entries(memory)) assert.strictEqual(value, true, 'Memory review invariant: ' + key);

  // Returning from a preview reopens the gallery. Its callback owns the final
  // focus, including when the director previously remembered a title button.
  const galleryEnv = make();
  const galleryFocus = evaluate(galleryEnv, `(() => {
    const titleButton = document.createElement('button'); document.body.appendChild(titleButton);
    const results = [];
    for (const exit of ['close', 'complete']) {
      closePresentationModal(); titleButton.focus(); openSpireGallery();
      document.querySelector('.gallery-event').click();
      const entered = SpireDirector.getState().preview && presentationKind === '';
      if (exit === 'close') SpireDirector.closeReplay(); else __drainDirector();
      const modal = document.getElementById('presentationModal');
      results.push({ exit, entered, galleryReopened: presentationKind === 'gallery' && !modal.classList.contains('hidden'),
        callbackKeepsFocus: document.activeElement === document.getElementById('presentationClose') && modal.contains(document.activeElement) });
    }
    return results;
  })()`);
  for (const result of galleryFocus) assert(result.entered && result.galleryReopened && result.callbackKeepsFocus,
    'Preview ' + result.exit + ' must preserve the reopened gallery callback\'s final focus');

  // Replay every published event, including endings; live progress and rewards stay unchanged.
  const previewEnv = make();
  const preview = evaluate(previewEnv, `(() => {
    startGame('allrounder', { mode: 'story' }); __drainDirector();
    grantSpireMemento('jinyu');
    saveWaveCheckpoint({ sceneId: curScene.id });
    showStart();
    const before = JSON.stringify({ story: player.story, mats: player.mats, kills: player.kills, wave,
      save: localStorage.getItem('ashen-spire-checkpoint-v2'), endings: localStorage.getItem('spire-endings-v2') });
    const events = SpireDirector.getReplayEvents();
    let callbacks = 0; const artSamples = [];
    for (const event of events) {
      if (SpireDirector.replayEvent(event.id, () => callbacks++) === false) throw new Error('Replay rejected: ' + event.id);
      if (!SpireDirector.getState().preview) throw new Error('Replay was not isolated: ' + event.id);
      artSamples.push(...__drainDirector());
    }
    const after = JSON.stringify({ story: player.story, mats: player.mats, kills: player.kills, wave,
      save: localStorage.getItem('ashen-spire-checkpoint-v2'), endings: localStorage.getItem('spire-endings-v2') });
    return { unchanged: before === after, count: events.length, callbacks, state, artSamples };
  })()`);
  assert(preview.count >= 30, 'The preview room must expose the full staged story, not only an opening sample');
  assert.strictEqual(preview.callbacks, preview.count, 'Every preview must return control exactly once');
  assert.strictEqual(preview.unchanged, true, 'Preview must not alter the run, save, mementos or ending records');
  assert.strictEqual(preview.state, 'menu', 'Preview must return to its original menu state');
  for (const artPath of V21_CINEMATIC_FILES) {
    assert(preview.artSamples.some(sample => sample.artPath === artPath), 'Production CG is shipped but never presented: ' + artPath);
  }
  for (const sample of preview.artSamples) {
    if (sample.artPath === 'assets/spire/v3/jialan-clock.png') assert(
      /^(boss\.jialan\.boss_defeated|memento\.jialan|memory\.jialan)(\.|$)/.test(sample.eventId),
      'Jialan must not hand over the winding key before her final defeat: ' + sample.eventId);
    assert(Number.isFinite(sample.artScale) && sample.artScale > 0, 'Narrative art must have a finite, positive display scale');
    const dims = assetDimsMap[sample.artPath];
    assert(dims && Math.abs(sample.renderedImageWidth / dims.w - sample.artScale) < .0001,
      'Reported art scale must match the image actually placed in the DOM: ' + sample.eventId);
    if (sample.artPath.includes('-atlas.png')) {
      assert.strictEqual(sample.artFormat, 'atlas');
      assert(sample.artScale <= 1.25, 'Legacy atlas cells must not be enlarged beyond the clarity cap: ' + sample.eventId);
      assert(sample.cameraMaxScale <= 1, 'Legacy atlas cells must not receive extra camera enlargement: ' + sample.eventId);
    } else if (V21_CINEMATIC_FILES.includes(sample.artPath)) {
      assert.strictEqual(sample.artFormat, 'cg');
      assert(sample.cameraMaxScale <= 1.08, 'Full-scene CG camera motion must stay within its subtle zoom budget: ' + sample.eventId);
    }
  }
}
