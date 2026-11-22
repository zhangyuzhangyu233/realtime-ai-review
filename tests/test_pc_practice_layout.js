const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const ctx = { window: {}, globalThis: null, console };
ctx.globalThis = ctx.window;
vm.createContext(ctx);

for (const f of ['code_drills.js', 'smart_grader.js', 'questions.js', 'explanations_detail.js', 'csharp_demos.js']) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx);
}

const BANK = ctx.window.QUESTION_BANK;
const DRILLS = ctx.window.CODE_DRILLS;
const DEMOS = ctx.window.CSHARP_DEMOS;
const hlCS = ctx.window.highlightCSharp;

let fails = 0;
function assert(cond, msg) {
  if (!cond) { console.error('[FAIL]', msg); fails++; }
  else { console.log('[PASS]', msg); }
}

function escapeHTML(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 1. Parse-check src/app.js directly
const appSrc = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
let appParseOk = true;
try { new vm.Script(appSrc); } catch (e) { appParseOk = false; console.error('[FAIL] src/app.js syntax error:', e.message); }
assert(appParseOk, 'src/app.js parses cleanly with zero syntax errors');

// 2. Verify code & animation availability across all 92 items (83 bank + 9 drills)
const missingDemoQs = BANK.filter(q => !q.demo || !DEMOS[q.demo]).map(q => q.id);
assert(missingDemoQs.length === 0, `All ${BANK.length} bank questions map to valid CSHARP_DEMOS for Tab 2 (missing=${missingDemoQs.length})`);

const incompleteDrills = DRILLS.filter(d => !d.solution || !d.anim).map(d => d.id);
assert(incompleteDrills.length === 0, `All ${DRILLS.length} coding drills have solution & anim for Tabs 2 & 3 (incomplete=${incompleteDrills.length})`);

// 3. Simulate buildFilledTemplateHTML / buildFilledTemplatePlain on c1..c5
for (const cid of ['c1', 'c2', 'c3', 'c4', 'c5']) {
  const q = BANK.find(x => x.id === cid);
  assert(Boolean(q && q.codeTemplate && q.blanks), `${cid} has codeTemplate & blanks`);
  let plain = String(q.codeTemplate || '');
  let html = hlCS(q.codeTemplate || '');
  q.blanks.forEach((b, i) => {
    const ans = (b.answers && b.answers[0]) || '';
    plain = plain.split(`[___空${i + 1}___]`).join(ans);
    html = html
      .split(`<span class="tok-blank">[___空${i + 1}___]</span>`)
      .join(`<span class="tok-filled" title="空${i + 1} 标准答案"><em class="tok-filled-idx">空${i + 1}</em>${escapeHTML(ans)}</span>`);
  });
  const filledCount = (html.match(/class="tok-filled"/g) || []).length;
  assert(
    !plain.includes('[___空') && !html.includes('tok-blank') && filledCount === q.blanks.length,
    `${cid} replaces all ${q.blanks.length} blanks cleanly with tok-filled chips (no raw tok-blank left)`
  );
}

// 4. Verify c6..c9 have modelCode + starterCode
for (const cid of ['c6', 'c7', 'c8', 'c9']) {
  const q = BANK.find(x => x.id === cid);
  assert(Boolean(q && q.modelCode && q.starterCode), `${cid} provides both starterCode & modelCode for Tab 2 ref/mine toggle`);
}

// 5. Inspect src/style.css and bundled index.html hooks & compiled scripts
const styleCss = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
for (const cls of [
  '.practice-split-layout.is-review-mode',
  '.post-card-tabs',
  '.post-tab-btn',
  '.rs-code-card',
  '.rs-gutter',
  '.tok-filled',
  '.review-explain-sidebar',
  '.re-subtabs',
  '.re-body'
]) {
  assert(styleCss.includes(cls), `src/style.css defines ${cls}`);
}
assert(/padding(?:-bottom)?:[^;]*84px/.test(styleCss), 'src/style.css gives .re-body 84px bottom clearance above dsh-pet');

for (const fnName of [
  'buildPostAnswerRightPanelHTML',
  'buildPostAnswerCodeTabHTML',
  'buildPostAnswerAnimTabHTML',
  'buildFilledTemplateHTML',
  'bindPostAnswerLayout',
  'captureCardDraft',
  'onTogglePeekExplain',
  'dsh-pet-dock'
]) {
  const inAppOrCss = appSrc.includes(fnName) || styleCss.includes(fnName);
  assert(inAppOrCss, `Source defines/references layout hook: ${fnName}`);
}

const indexPath = path.join(ROOT, 'index.html');
assert(fs.existsSync(indexPath), 'Bundled index.html exists');
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  for (const marker of [
    'practice-split-layout',
    'is-review-mode',
    'post-card-tabs',
    'review-explain-sidebar',
    'buildPostAnswerRightPanelHTML',
    'buildPostAnswerCodeTabHTML',
    'buildFilledTemplateHTML',
    'bindPostAnswerLayout',
    'tok-filled',
    'btn-drill-explain',
    'q-reset-starter-btn',
    'buildExplainDetailHTML',
    'dsh-pet-dock',
    'DshPetAssistant.onWrongAnswer',
    'buildIdleHint'
  ]) {
    assert(indexHtml.includes(marker), `index.html embeds marker: ${marker}`);
  }

  const scripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert(scripts.length >= 10, `index.html contains all embedded script bundles (${scripts.length})`);
  let compileOk = true;
  scripts.forEach((sc, i) => {
    try { new vm.Script(sc); } catch (e) { compileOk = false; console.error(`[FAIL] index.html script #${i} error:`, e.message); }
  });
  assert(compileOk, 'index.html all embedded <script> blocks compile without syntax error');
}

console.log(`\nSummary: ${fails === 0 ? 'ALL PC POST-ANSWER PRACTICE LAYOUT CHECKS PASSED!' : fails + ' FAILURES'}`);
process.exit(fails ? 1 : 0);
