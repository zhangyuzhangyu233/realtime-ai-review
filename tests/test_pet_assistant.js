const fs = require('fs');
const vm = require('vm');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const SRC = path.join(REPO, 'src');
const PET_ASSETS = path.join(REPO, 'assets', 'pet');

let fails = 0;
function assert(cond, msg) {
  if (!cond) { console.error('[FAIL]', msg); fails++; }
  else { console.log('[PASS]', msg); }
}

// 1. Verify all 11 WebP animations + fallback + LICENSE exist on disk
const CLIPS = ['idle', 'wave', 'think', 'deep_think', 'code', 'notes', 'happy', 'celebrate', 'oops', 'sleep', 'search'];
for (const c of CLIPS) {
  const p = path.join(PET_ASSETS, `${c}.webp`);
  assert(fs.existsSync(p) && fs.statSync(p).size > 20000, `assets/pet/${c}.webp exists and non-empty`);
}
assert(fs.existsSync(path.join(PET_ASSETS, 'fallback.png')), 'assets/pet/fallback.png exists');
assert(fs.existsSync(path.join(PET_ASSETS, 'fallback_b64.json')), 'assets/pet/fallback_b64.json exists');
assert(fs.existsSync(path.join(PET_ASSETS, 'LICENSE_DSH_PET.txt')), 'assets/pet/LICENSE_DSH_PET.txt (MIT) exists');

// 2. Load modules in Node vm (including SmartGrader for fill-blank wrong-answer diagnostics!)
const ctx = { window: {}, globalThis: null, console };
ctx.globalThis = ctx.window;
vm.createContext(ctx);
for (const f of ['code_drills.js', 'smart_grader.js', 'questions.js', 'explanations_detail.js', 'pet_assistant.js']) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx);
}

const PET = ctx.window.DshPetAssistant;
const BANK = ctx.window.QUESTION_BANK;
const DRILLS = ctx.window.CODE_DRILLS;

assert(PET && typeof PET.getContextAdvice === 'function', 'DshPetAssistant.getContextAdvice exported');
assert(typeof PET.buildWrongAnswerGuide === 'function', 'DshPetAssistant.buildWrongAnswerGuide exported');
assert(typeof PET.buildIdleHint === 'function', 'DshPetAssistant.buildIdleHint exported');
assert(PET.DEFAULT_IDLE_FIRST_MS === 22000 && PET.DEFAULT_IDLE_SECOND_MS === 28000, 'Idle hint thresholds configured (22s / 28s)');

const MOCK_SUMMARIES = {
  t_mechanics: { formula: 'W = F * s * cos(theta)', trap: '分清水平与垂直分力' },
  t_follow_wall: { formula: '左手 (dir-2+8)%8 | 右手 (dir+2)%8', trap: 'C# 负数取模必须先加 8' },
  t_astar_opt: { formula: 'f = g + h (最小堆 O(log N))', trap: '注意是否允许斜穿障碍角点' },
  t_fsm_std: { formula: '状态 · 初始状态 · 输入 · 转换', trap: '画图必标初始状态' }
};

// 3. Test Knowledge mode (3 clicks, zero cutoff)
const kCtx = {
  view: 'knowledge',
  activeSection: 't_mechanics',
  activeSectionObj: { id: 't_mechanics', short: '1.3 碰撞与功', tip: '撞水平墙改 y，撞竖直墙改 x，斜面用点积公式' },
  activeSectionPct: 45,
  topicSummaries: MOCK_SUMMARIES
};
const k1 = PET.getContextAdvice(kCtx, 0);
const k2 = PET.getContextAdvice(kCtx, 1);
const k3 = PET.getContextAdvice(kCtx, 2);
assert(k1.mood === 'notes' && k1.text.includes('W = F') && !k1.text.includes('…'), `knowledge click 1 returns complete formula tip`);
assert(k2.mood === 'think' && k2.text.includes('避坑') && !k2.text.includes('…'), `knowledge click 2 returns complete trap tip`);
assert(k3.mood === 'search' && k3.text.includes('45%') && !k3.text.includes('…'), `knowledge click 3 reports live mastery 45%`);

// 4. Exhaustive 92-item zero-truncation, zero-placeholder, clean-punctuation & anti-spoiler test!
let all92Clean = true;
for (const q of BANK) {
  for (let s = 0; s < 3; s++) {
    const res = PET.getContextAdvice({
      view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
      practiceItem: { kind: 'question', uid: 'u_' + q.id, refId: q.id, isCoding: q.type === 'code', question: q, answered: false, correct: false }
    }, s);
    if (!res || !res.text || res.text.length < 12) {
      console.error(`[FAIL] ${q.id} step ${s} empty/too short`); all92Clean = false;
    }
    if (res.text.includes('…') || /\.\.\.\s*$/.test(res.text)) {
      console.error(`[FAIL] ${q.id} step ${s} contains truncation ellipsis: ${res.text}`); all92Clean = false;
    }
    if (/\[空|待你代入验证|【对应正误】/.test(res.text)) {
      console.error(`[FAIL] ${q.id} step ${s} contains awkward placeholder: ${res.text}`); all92Clean = false;
    }
    if (!/[。！？!）)]$/.test(res.text.trim())) {
      console.error(`[FAIL] ${q.id} step ${s} does not end with complete punctuation: ${res.text}`); all92Clean = false;
    }
    if (q.type === 'single' && /(?:选|选项|对应|答案)[ABCD](?:$|[。！？!])/.test(res.text)) {
      console.error(`[FAIL] ${q.id} step ${s} leaks option letter: ${res.text}`); all92Clean = false;
    }
    if (q.type === 'tf' && /(?:判(?:定|别)?为?|应判为?|记为|属|为)\s*【?\s*(?:对|错)\s*】?/.test(res.text)) {
      console.error(`[FAIL] ${q.id} step ${s} leaks TF verdict: ${res.text}`); all92Clean = false;
    }
  }
}
for (const d of DRILLS) {
  for (let s = 0; s < 3; s++) {
    const res = PET.getContextAdvice({
      view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
      practiceItem: { kind: 'drill', uid: 'u_' + d.id, refId: d.id, isCoding: true, drill: d, answered: false, correct: false }
    }, s);
    if (!res || !res.text || res.text.includes('…') || !/[。！？!）)]$/.test(res.text.trim())) {
      console.error(`[FAIL] ${d.id} step ${s} truncated or incomplete: ${res && res.text}`); all92Clean = false;
    }
  }
}
assert(all92Clean, 'All 92 items x 3 progressive hints pass zero-truncation, clean punctuation & anti-spoiler checks');

// 5. Specific checks on diagrams & coding hints
const qE10 = BANK.find(x => x.id === 'e10');
const e10_1 = PET.getContextAdvice({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'p_3', refId: 'e10', isCoding: false, question: qE10, answered: false, correct: false }
}, 0);
assert(e10_1.text.includes('Corner Cut'), `e10 diagram hint warns about Corner Cut`);

const qE5 = BANK.find(x => x.id === 'e5');
const e5_1 = PET.getContextAdvice({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'p_4', refId: 'e5', isCoding: false, question: qE5, answered: false, correct: false }
}, 0);
assert(e5_1.text.includes('初始态'), `e5 FSM diagram hint reminds setting initial state`);

// 6. Test proactive buildWrongAnswerGuide across all 4 question categories
const qS10 = BANK.find(x => x.id === 's10');
const wgS10 = PET.buildWrongAnswerGuide({ itemKind: 'question', item: qS10, userVal: 1, topicSummaries: MOCK_SUMMARIES });
assert(wgS10.mood === 'oops' && wgS10.text.includes('cos') && !wgS10.text.includes('…'), `wrong guide for single s10 gives complete derivation & pitfall`);

const qC1 = BANK.find(x => x.id === 'c1');
const wgC1 = PET.buildWrongAnswerGuide({
  itemKind: 'question', item: qC1,
  userVal: ['velocity+acceleration*dt', 'ballpos+velocity*dt', 'velocity.y=-velocity.y', 'velocity.y=-velocity.y', 'velocity=-velocity', 'wrong'],
  topicSummaries: MOCK_SUMMARIES
});
assert(wgC1.mood === 'oops' && wgC1.text.includes('空3') && wgC1.text.includes('空6') && wgC1.text.includes('水平分量') && !wgC1.text.includes('…'),
  `wrong guide for code:fill c1 names exact missed blanks (空3, 空6) & targets 空3 hint: ${wgC1.text}`);

const wgE5Short = PET.buildWrongAnswerGuide({
  itemKind: 'question', item: qE5,
  evalReport: { tooShort: true, score: 0, maxScore: 10, details: [] },
  topicSummaries: MOCK_SUMMARIES
});
assert(wgE5Short.mood === 'oops' && wgE5Short.text.includes('画板'), `wrong guide for too-short board essay tells user how to start`);

const wgE5Rubric = PET.buildWrongAnswerGuide({
  itemKind: 'question', item: qE5,
  evalReport: {
    tooShort: false, score: 4.5, maxScore: 10,
    details: [
      { label: '四大组成', status: 'full', missHint: '' },
      { label: '状态迁移图初始态与死亡边', status: 'miss', missHint: '点击设为初始态并补齐3条死亡边' }
    ]
  },
  topicSummaries: MOCK_SUMMARIES
});
assert(wgE5Rubric.text.includes('状态迁移图初始态') && wgE5Rubric.text.includes('3条死亡边'),
  `wrong guide for rubric essay surfaces first missed rubric & concrete hint`);

const dD4 = DRILLS.find(x => x.id === 'd4');
const wgD4 = PET.buildWrongAnswerGuide({
  itemKind: 'drill', item: dD4,
  evalReport: {
    pass: false, score: 50,
    checks: [
      { label: '右手起始方向', ok: true, hint: '' },
      { label: '方向编号安全归一化至 0~7', ok: false, hint: '写 (i + 8) % 8' }
    ]
  },
  topicSummaries: MOCK_SUMMARIES
});
assert(wgD4.mood === 'oops' && wgD4.text.includes('0~7') && wgD4.text.includes('(i + 8) % 8') && !wgD4.text.includes('…'),
  `wrong guide for drill d4 names missed check & exact fix hint`);

// 7. Test proactive buildIdleHint across states
const idleS10Stage0 = PET.buildIdleHint({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'i_1', refId: 's10', isCoding: false, question: qS10, answered: false, correct: false }
}, 0);
const idleS10Stage1 = PET.buildIdleHint({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'i_1', refId: 's10', isCoding: false, question: qS10, answered: false, correct: false }
}, 1);
const idleS10Stage2 = PET.buildIdleHint({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'i_1', refId: 's10', isCoding: false, question: qS10, answered: false, correct: false }
}, 2);
const idleS10Answered = PET.buildIdleHint({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'i_1', refId: 's10', isCoding: false, question: qS10, answered: true, correct: true }
}, 0);
const idleKnowledge = PET.buildIdleHint(kCtx, 0);
assert(idleS10Stage0 && idleS10Stage0.lines.length >= 2 && !idleS10Stage0.text.includes('…'), 'idle stage 0 provides warm non-spoiler starter hint');
assert(idleS10Stage1 && idleS10Stage1.lines.length >= 2 && !idleS10Stage1.text.includes('…'), 'idle stage 1 provides deeper step hint');
assert(idleS10Stage2 === null, 'idle stage >= 2 returns null (capped cleanly at 2 auto-hints)');
assert(idleS10Answered === null && idleKnowledge === null, 'idle hint stays quiet on already-answered question and knowledge view');

const idleMock = PET.buildIdleHint({
  view: 'practice', practiceSub: 'mock', mockQuestion: qS10, mockIndex: 2, mockTotal: 30,
  mockDoneCount: 2, mockRemainText: '82:00', mockSubmitted: false, topicSummaries: MOCK_SUMMARIES
}, 0);
assert(idleMock && idleMock.text.includes('公式') && !idleMock.text.includes('…'), 'idle hint in mock exam gives non-spoiler formula nudge');

// 8. Test Mastery & Notebook contexts
const mas = PET.getContextAdvice({
  view: 'mastery',
  masterySummary: { overall: 54, weakest: [{ name: '4.3 A* 寻路核心', pct: 18 }, { name: '5.1 FSM 状态机', pct: 25 }] }
}, 0);
assert(mas.mood === 'search' && mas.text.includes('4.3 A* 寻路核心') && mas.text.includes('18%'), `mastery identifies weakest topic`);

const nbWrong = PET.getContextAdvice({
  view: 'notebook', notebookSummary: { wrongCount: 3, favCount: 5, topWrongTopicName: '1.3 碰撞与功' }
}, 0);
assert(nbWrong.mood === 'oops' && nbWrong.text.includes('3 道题') && nbWrong.text.includes('1.3 碰撞与功'), `notebook highlights count & top wrong topic`);

// 9. Verify bundled PC index.html & mobile.html embed upgraded assistant cleanly
for (const htmlFile of ['index.html', 'mobile.html']) {
  const htmlPath = path.join(REPO, htmlFile);
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert(html.includes('id="dsh-pet-dock"'), `${htmlFile} renders dsh-pet-dock container`);
    assert(html.includes('onWrongAnswer'), `${htmlFile} wires DshPetAssistant.onWrongAnswer`);
    assert(html.includes('buildIdleHint'), `${htmlFile} embeds proactive buildIdleHint`);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    let ok = true;
    scripts.forEach((sc, i) => {
      try { new vm.Script(sc); } catch (e) { ok = false; console.error(`[FAIL] ${htmlFile} script #${i}:`, e.message); }
    });
    assert(ok, `${htmlFile} all embedded <script> blocks compile without syntax error`);
  }
}

console.log(`\nSummary: ${fails === 0 ? 'ALL DSH-PET ASSISTANT CHECKS PASSED!' : fails + ' FAILURES'}`);
process.exit(fails ? 1 : 0);
