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

// 2. Load modules in Node vm
const ctx = { window: {}, globalThis: null, console };
ctx.globalThis = ctx.window;
vm.createContext(ctx);
for (const f of ['code_drills.js', 'questions.js', 'explanations_detail.js', 'pet_assistant.js']) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx);
}

const PET = ctx.window.DshPetAssistant;
const BANK = ctx.window.QUESTION_BANK;
const DRILLS = ctx.window.CODE_DRILLS;

assert(PET && typeof PET.getContextAdvice === 'function', 'DshPetAssistant.getContextAdvice exported');

const MOCK_SUMMARIES = {
  t_mechanics: { formula: 'W = F * s * cos(theta)', trap: '分清水平与垂直分力' },
  t_follow_wall: { formula: '左手 (dir-2+8)%8 | 右手 (dir+2)%8', trap: 'C#负数取模需+8' },
  t_astar_opt: { formula: 'f = g + h (最小堆 O(log N))', trap: '注意是否允许斜穿障碍角点' },
  t_fsm_std: { formula: '状态 · 初始状态 · 输入 · 转换', trap: '画图必标初始状态' }
};

// 3. Test Knowledge mode (3 clicks)
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
assert(k1.mood === 'notes' && k1.text.includes('W = F'), `knowledge click 1 returns formula tip: ${k1.text.slice(0, 48)}`);
assert(k2.mood === 'think' && k2.text.includes('避坑'), `knowledge click 2 returns trap tip`);
assert(k3.mood === 'search' && k3.text.includes('45%'), `knowledge click 3 reports live mastery 45%`);

// 4. Test Practice Single s10 non-spoiler 3 progressive clicks + post-answer wrong
const qS10 = BANK.find(x => x.id === 's10');
const pS10Ctx = {
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'p_1', refId: 's10', isCoding: false, question: qS10, answered: false, correct: false }
};
const s10_1 = PET.getContextAdvice(pS10Ctx, 0);
const s10_2 = PET.getContextAdvice(pS10Ctx, 1);
const s10_3 = PET.getContextAdvice(pS10Ctx, 2);
assert(!/选\s*A|2500/.test(s10_1.text), `s10 pre-answer hint 1 does NOT leak final answer A/2500`);
assert(!/选\s*A|2500/.test(s10_2.text), `s10 pre-answer hint 2 does NOT leak final answer A/2500`);
assert(!/选\s*A|2500/.test(s10_3.text), `s10 pre-answer hint 3 does NOT leak final answer A/2500`);

const pS10Wrong = { ...pS10Ctx, practiceItem: { ...pS10Ctx.practiceItem, answered: true, correct: false } };
const s10_w = PET.getContextAdvice(pS10Wrong, 0);
assert(s10_w.mood === 'oops' && s10_w.text.includes('cos60'), `s10 post-answer wrong highlights pitfall`);

// 5. Test Practice TF tf2 non-spoiler
const qTf2 = BANK.find(x => x.id === 'tf2');
const tf2_1 = PET.getContextAdvice({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'p_2', refId: 'tf2', isCoding: false, question: qTf2, answered: false, correct: false }
}, 0);
assert(!/【\s*错\s*】|判为【?错/.test(tf2_1.text), `tf2 pre-answer hint does NOT leak 【错】 verdict`);

// 6. Test Diagram boards e10 & e5
const qE10 = BANK.find(x => x.id === 'e10');
const e10_1 = PET.getContextAdvice({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'p_3', refId: 'e10', isCoding: false, question: qE10, answered: false, correct: false }
}, 0);
assert(e10_1.text.includes('Corner Cut') || e10_1.text.includes('切角'), `e10 diagram hint warns about Corner Cut`);

const qE5 = BANK.find(x => x.id === 'e5');
const e5_1 = PET.getContextAdvice({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'p_4', refId: 'e5', isCoding: false, question: qE5, answered: false, correct: false }
}, 0);
assert(e5_1.text.includes('初始态'), `e5 FSM diagram hint reminds setting initial state`);

// 7. Test Coding fill c3 & write c6 & drill d4
const qC3 = BANK.find(x => x.id === 'c3');
const c3_1 = PET.getContextAdvice({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'p_5', refId: 'c3', isCoding: true, question: qC3, answered: false, correct: false }
}, 0);
assert(c3_1.mood === 'code' && c3_1.text.includes('// 提示'), `c3 hint switches to code mood & points to inline comments`);

const qC6 = BANK.find(x => x.id === 'c6');
const c6_1 = PET.getContextAdvice({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'question', uid: 'p_6', refId: 'c6', isCoding: true, question: qC6, answered: false, correct: false }
}, 0);
assert(c6_1.mood === 'code' && c6_1.text.includes('// 提示'), `c6 code-write hint references guided starter comments`);

const dD4 = DRILLS.find(x => x.id === 'd4');
const d4Pre = PET.getContextAdvice({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: { kind: 'drill', uid: 'p_7', refId: 'd4', isCoding: true, drill: dD4, answered: false, correct: false }
}, 0);
assert(d4Pre.mood === 'code' && d4Pre.text.includes('TODO'), `d4 pre-submit hint references // TODO comments`);

const d4Fail = PET.getContextAdvice({
  view: 'practice', practiceSub: 'bank', topicSummaries: MOCK_SUMMARIES,
  practiceItem: {
    kind: 'drill', uid: 'p_7', refId: 'd4', isCoding: true, drill: dD4, answered: true, correct: false,
    evalReport: { pass: false, score: 50, checks: [{ label: '方向编号安全归一化至 0~7', ok: false, hint: '写 (i + 8) % 8' }] }
  }
}, 0);
assert(d4Fail.mood === 'oops' && d4Fail.text.includes('0~7') && d4Fail.text.includes('(i + 8) % 8'), `d4 post-submit failed check surfaces exact missed point`);

// 8. Test Mock, Mastery, and Notebook contexts
const mPre = PET.getContextAdvice({
  view: 'practice', practiceSub: 'mock', mockQuestion: qS10, mockIndex: 4, mockTotal: 30,
  mockDoneCount: 4, mockRemainText: '81:15', mockSubmitted: false, topicSummaries: MOCK_SUMMARIES
}, 0);
assert(mPre.mood === 'deep_think' && mPre.text.includes('4/30') && mPre.text.includes('81:15'), `mock pre-submit shows pacing & remaining time`);

const mas = PET.getContextAdvice({
  view: 'mastery',
  masterySummary: { overall: 54, weakest: [{ name: '4.3 A* 寻路核心', pct: 18 }, { name: '5.1 FSM 状态机', pct: 25 }] }
}, 0);
assert(mas.mood === 'search' && mas.text.includes('4.3 A* 寻路核心') && mas.text.includes('18%'), `mastery identifies weakest topic`);

const nbWrong = PET.getContextAdvice({
  view: 'notebook', notebookSummary: { wrongCount: 3, favCount: 5, topWrongTopicName: '1.3 碰撞与功' }
}, 0);
assert(nbWrong.mood === 'oops' && nbWrong.text.includes('3 道题') && nbWrong.text.includes('1.3 碰撞与功'), `notebook highlights count & top wrong topic`);

const nbZero = PET.getContextAdvice({
  view: 'notebook', notebookSummary: { wrongCount: 0, favCount: 5, topWrongTopicName: '' }
}, 0);
assert(nbZero.mood === 'celebrate' && nbZero.text.includes('清零'), `notebook congratulates zero mistakes`);

// 9. Verify bundled PC index.html & mobile.html embed DshPetAssistant & fallback cleanly
for (const htmlFile of ['index.html', 'mobile.html']) {
  const htmlPath = path.join(REPO, htmlFile);
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert(html.includes('id="dsh-pet-dock"'), `${htmlFile} renders dsh-pet-dock container`);
    assert(html.includes('window.DSH_PET_FALLBACK'), `${htmlFile} embeds offline fallback sprite`);
    assert(html.includes('window.DshPetAssistant'), `${htmlFile} embeds DshPetAssistant logic`);
    assert(!html.includes('id="companion-btn"'), `${htmlFile} removed old companion-btn placeholder`);
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
