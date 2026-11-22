const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = path.resolve(__dirname, '../src');
const ctx = { window: {}, globalThis: null, console };
ctx.globalThis = ctx.window;
vm.createContext(ctx);

for (const f of ['code_drills.js', 'smart_grader.js', 'questions.js', 'explanations_detail.js']) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx);
}

const G = ctx.window.SmartGrader;
const DRILLS = ctx.window.CODE_DRILLS;
const BANK = ctx.window.QUESTION_BANK;
const DETAILS = ctx.window.EXPLAIN_DETAILS;

let fails = 0;
function assert(cond, msg) {
  if (!cond) { console.error('[FAIL]', msg); fails++; }
  else { console.log('[PASS]', msg); }
}

assert(BANK.length === 83, `QUESTION_BANK contains 83 items (got ${BANK.length})`);
assert(DRILLS.length === 9, `CODE_DRILLS contains 9 items (got ${DRILLS.length})`);

const allIds = [...BANK.map(q => q.id), ...DRILLS.map(d => d.id)];
assert(allIds.length === 92, `Total unique exam/drill items = 92 (got ${allIds.length})`);

let missingCount = 0;
let shortCount = 0;
for (const id of allIds) {
  const det = DETAILS[id];
  if (!det) {
    console.error(`[FAIL] Missing EXPLAIN_DETAILS entry for: ${id}`);
    missingCount++;
    fails++;
    continue;
  }
  const hasWhy = typeof det.why === 'string' && det.why.trim().length >= 35;
  const hasSteps = Array.isArray(det.steps) && det.steps.length >= 3 && det.steps.every(s => typeof s === 'string' && s.trim().length >= 18);
  const hasPitfall = typeof det.pitfall === 'string' && det.pitfall.trim().length >= 18;
  const totalLen = (det.why || '').length + (det.steps || []).join('').length + (det.pitfall || '').length;
  if (!hasWhy || !hasSteps || !hasPitfall || totalLen < 120) {
    console.error(`[FAIL] Weak EXPLAIN_DETAILS for ${id}: why=${hasWhy}, steps=${hasSteps}, pitfall=${hasPitfall}, totalLen=${totalLen}`);
    shortCount++;
    fails++;
  }
}
assert(missingCount === 0, `All 92 items have EXPLAIN_DETAILS entries (missing=${missingCount})`);
assert(shortCount === 0, `All 92 items satisfy rich step-by-step quality bar (>=3 steps, totalLen>=120)`);

// Check coding fill questions c1..c5 have explicit hint comments in codeTemplate
for (const cid of ['c1', 'c2', 'c3', 'c4', 'c5']) {
  const q = BANK.find(x => x.id === cid);
  const hintCount = (q.codeTemplate.match(/\/\/\s*提示\d+/g) || []).length;
  assert(hintCount >= q.blanks.length, `${cid} codeTemplate has >= ${q.blanks.length} hint comments (got ${hintCount})`);
}

// Check coding write questions c6..c9 have tailored starterCode with hint comments AND fail untouched while modelCode passes 10/10
for (const cid of ['c6', 'c7', 'c8', 'c9']) {
  const q = BANK.find(x => x.id === cid);
  assert(typeof q.starterCode === 'string' && q.starterCode.includes('// 提示'), `${cid} has tailored starterCode with // 提示 comments`);
  const repStarter = G.evaluateSubjective(q, q.starterCode);
  assert(!repStarter.pass && repStarter.score === 0, `${cid} untouched starterCode scores 0/10 (${repStarter.score}/10)`);
  const repModel = G.evaluateSubjective(q, q.modelCode);
  assert(repModel.pass && repModel.score === 10, `${cid} modelCode scores 10/10 (${repModel.score}/10)`);
}

// Check coding drills d1..d9 starter code has // TODO (提示): comments AND fails cleanly while solution passes
for (const d of DRILLS) {
  assert(d.starter.includes('(提示)'), `${d.id} starter contains (提示) comments`);
  const rStart = G.evaluateCodeDrill(d, d.starter);
  const rSol = G.evaluateCodeDrill(d, d.solution);
  assert(!rStart.allOk && rStart.passCnt === 0, `${d.id} starter with hints still fails cleanly (${rStart.passCnt}/${rStart.totalCnt})`);
  assert(rSol.allOk && rSol.passCnt === rSol.totalCnt, `${d.id} solution passes cleanly (${rSol.passCnt}/${rSol.totalCnt})`);
}

// Verify bundled index.html & mobile.html parse cleanly across every embedded <script> block and expose UI hooks
for (const [htmlFile, expectedBtns] of [
  ['index.html', ['btn-drill-explain', 'q-reset-starter-btn', 'buildExplainDetailHTML']],
  ['mobile.html', ['m-drill-explain', 'q-reset-starter-btn', 'buildExplainDetailHTML']]
]) {
  const htmlPath = path.resolve(__dirname, '..', htmlFile);
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    assert(scripts.length >= 9, `${htmlFile} contains all embedded script bundles (${scripts.length})`);
    let parseOk = true;
    scripts.forEach((sc, i) => {
      try { new vm.Script(sc); } catch (err) { parseOk = false; console.error(`[FAIL] ${htmlFile} script #${i} parse error:`, err.message); }
    });
    assert(parseOk, `${htmlFile} all embedded JS scripts compile with zero syntax errors`);
    for (const marker of expectedBtns) {
      assert(html.includes(marker), `${htmlFile} includes wired UI hook: ${marker}`);
    }
  }
}

console.log(`\nSummary: ${fails === 0 ? 'ALL 92-ITEM EXPLANATION & CODING-HINT CHECKS PASSED!' : fails + ' FAILURES'}`);
process.exit(fails ? 1 : 0);
