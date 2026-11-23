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
  '.post-unified-media',
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

// Anti page-shift guards when flipping right panel sub-tabs
assert(styleCss.includes('scrollbar-gutter: stable'), 'src/style.css reserves scrollbar-gutter: stable to stop horizontal shift');
assert(/\.review-explain-sidebar\s*\{[\s\S]*?height:\s*calc\(100vh - 96px\)/.test(styleCss), 'src/style.css locks desktop .review-explain-sidebar height to stop vertical jump');
assert(/\.review-flip-scene\s*\{[\s\S]*?overflow:\s*hidden/.test(styleCss), 'src/style.css clips 3D flip scene projection inside column bounds');

// 3D flip transitions: knowledge card -> explanation panel, and between right sub-tabs
for (const sel of ['.review-flip-scene', '.review-flip-card.flipped', '.rf-back', '@keyframes reFlipOut', '@keyframes reFlipIn', 'prefers-reduced-motion']) {
  assert(styleCss.includes(sel), `src/style.css defines flip transition rule: ${sel}`);
}
for (const fn of ['wrapReviewFlipScene', 'runReviewFlipIn', 'prefersReducedMotion', '_reviewFlipShown', "classList.add('re-flip-out')", 'opts.initialRightTab', 'initialRightTab: curRightTab']) {
  assert(appSrc.includes(fn), `src/app.js implements flip transition hook: ${fn}`);
}

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

assert(!appSrc.includes('post-card-tabs'), 'src/app.js puts question, animation, and C# code in a single card without left tabs');
assert(
  appSrc.includes("${buildPostAnswerAnimTabHTML('question', q)}\n          ${buildPostAnswerCodeTabHTML('question', q, saved, opts.instance)}") ||
  appSrc.includes("${buildPostAnswerAnimTabHTML('question', q)}\r\n          ${buildPostAnswerCodeTabHTML('question', q, saved, opts.instance)}"),
  'renderQuestionCard renders animation ABOVE C# code inside the same card'
);
assert(
  appSrc.includes("${buildPostAnswerAnimTabHTML('drill', d)}\n          ${buildPostAnswerCodeTabHTML('drill', d, saved, inst)}") ||
  appSrc.includes("${buildPostAnswerAnimTabHTML('drill', d)}\r\n          ${buildPostAnswerCodeTabHTML('drill', d, saved, inst)}"),
  'renderInlineDrillCard renders animation ABOVE reference C# code inside the same card'
);

// PC non-maximized stacking order & half-screen single-row topbar
assert(styleCss.includes('@media (max-width: 1100px) and (min-width: 761px)'), 'src/style.css keeps half-screen topbar on a single compact row');
assert(
  /\.flip-sidebar\s*\{[\s\S]*?order:\s*-1;[\s\S]*?\}/.test(styleCss) &&
  /\.review-flip-scene\s*\{[\s\S]*?order:\s*-1;[\s\S]*?\}/.test(styleCss),
  'src/style.css places knowledge/explanation card ABOVE question/code on non-maximized viewports (order: -1)'
);
assert(
  appSrc.indexOf('<div class="pager-bar" style="margin-bottom:16px">') < appSrc.indexOf('<div class="practice-split-layout ${isReviewMode ? \'is-review-mode\' : \'\'}">'),
  'src/app.js renders top HUD pager-bar above .practice-split-layout so cards align flush on wide view and stack cleanly below HUD on narrow view'
);

// 6. Verify Mobile layout optimization (src/mobile_app.js, src/mobile.css, mobile.html)
const mobileSrc = fs.readFileSync(path.join(SRC, 'mobile_app.js'), 'utf8');
let mobileParseOk = true;
try { new vm.Script(mobileSrc); } catch (e) { mobileParseOk = false; console.error('[FAIL] src/mobile_app.js syntax error:', e.message); }
assert(mobileParseOk, 'src/mobile_app.js parses cleanly with zero syntax errors');

const mobileCss = fs.readFileSync(path.join(SRC, 'mobile.css'), 'utf8');
for (const mCls of [
  'scrollbar-gutter: stable',
  'calc(118px + env(safe-area-inset-bottom))',
  '.m-kp-collapse',
  '.m-review-panel',
  '.m-unified-media',
  '.m-code-card',
  '.tok-filled',
  '@keyframes mReFlipOut',
  '@keyframes mReFlipIn'
]) {
  assert(mobileCss.includes(mCls), `src/mobile.css defines ${mCls}`);
}

// Multi-keyframe slow-start -> swift-flip curves with strict zero-overshoot & synced JS timers
function checkBlockCurvesZeroOvershoot(cssText, blockRe, label) {
  const blockMatch = cssText.match(blockRe);
  assert(Boolean(blockMatch), `${label} rule/keyframe block exists`);
  if (!blockMatch) return;
  const curves = [...blockMatch[0].matchAll(/cubic-bezier\(([^)]+)\)/g)].map(m => m[1]);
  assert(curves.length > 0, `${label} defines at least one cubic-bezier curve`);
  curves.forEach(cStr => {
    const nums = cStr.split(',').map(x => Number(x.trim()));
    const [x1, y1, x2, y2] = nums;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const u = i / 100, mu = 1 - u;
      const y = 3 * mu * mu * u * y1 + 3 * mu * u * u * y2 + u * u * u;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    assert(
      nums.length === 4 && minY >= -0.0001 && maxY <= 1.0001,
      `${label} curve (${cStr}) has zero bounce/overshoot (minY=${minY.toFixed(3)}, maxY=${maxY.toFixed(3)})`
    );
  });
}

for (const kf of ['@keyframes cardFlipToBack', '@keyframes cardFlipToFront', '@keyframes reviewCardFlip']) {
  assert(styleCss.includes(kf) && styleCss.includes('28%') && styleCss.includes('54%'), `src/style.css defines multi-stop ${kf} (28%/54%)`);
}
assert(/@keyframes reFlipOut\s*\{[\s\S]*?52%[\s\S]*?\}/.test(styleCss), 'src/style.css defines 52% mid-stop in @keyframes reFlipOut');
assert(/@keyframes mReFlipOut\s*\{[\s\S]*?52%[\s\S]*?\}/.test(mobileCss), 'src/mobile.css defines 52% mid-stop in @keyframes mReFlipOut');

checkBlockCurvesZeroOvershoot(styleCss, /\.flip-card\s*\{[^}]*\}/, 'PC .flip-card');
checkBlockCurvesZeroOvershoot(styleCss, /@keyframes cardFlipToBack\s*\{[\s\S]*?100%\s*\{[^}]*\}\s*\}/, 'PC @keyframes cardFlipToBack');
checkBlockCurvesZeroOvershoot(styleCss, /@keyframes cardFlipToFront\s*\{[\s\S]*?100%\s*\{[^}]*\}\s*\}/, 'PC @keyframes cardFlipToFront');
checkBlockCurvesZeroOvershoot(styleCss, /\.review-flip-card\s*\{[^}]*\}/, 'PC .review-flip-card');
checkBlockCurvesZeroOvershoot(styleCss, /@keyframes reviewCardFlip\s*\{[\s\S]*?100%\s*\{[^}]*\}\s*\}/, 'PC @keyframes reviewCardFlip');
checkBlockCurvesZeroOvershoot(styleCss, /@keyframes reFlipOut\s*\{[\s\S]*?100%\s*\{[^}]*\}\s*\}/, 'PC @keyframes reFlipOut');
checkBlockCurvesZeroOvershoot(styleCss, /\.review-explain-sidebar\.re-flip-in\s*\{[^}]*\}/, 'PC .re-flip-in');
checkBlockCurvesZeroOvershoot(mobileCss, /@keyframes mReFlipOut\s*\{[\s\S]*?100%\s*\{[^}]*\}\s*\}/, 'Mobile @keyframes mReFlipOut');
checkBlockCurvesZeroOvershoot(mobileCss, /\.m-review-panel\.m-flip-in\s*\{[^}]*\}/, 'Mobile .m-flip-in');

assert(
  appSrc.includes('flip-to-back') && appSrc.includes("addEventListener('animationend'") && appSrc.includes('320)') && appSrc.includes('360)'),
  'src/app.js wires flip-to-back/animationend and syncs PC right-panel timers (360ms/320ms)'
);
assert(
  mobileSrc.includes('300);') && mobileSrc.includes('340);') && mobileSrc.includes('void panel.offsetWidth'),
  'src/mobile_app.js syncs Mobile review-panel flip timers (340ms/300ms) with reflow restart'
);

assert(
  mobileSrc.includes("${topContextHTML}\n        <div id=\"m-prac-card-stage\">") ||
  mobileSrc.includes("${topContextHTML}\r\n        <div id=\"m-prac-card-stage\">"),
  'mobile_app.js renders collapsible knowledge card / review explanation panel ABOVE #m-prac-card-stage'
);
assert(
  mobileSrc.includes("${buildMobileAnimHTML('question', q)}\n           ${buildMobileCodeSectionHTML('question', q, saved, opts.instance)}") ||
  mobileSrc.includes("${buildMobileAnimHTML('question', q)}\r\n           ${buildMobileCodeSectionHTML('question', q, saved, opts.instance)}"),
  'Mobile renderQuestionCard renders animation ABOVE C# code inside .m-unified-media'
);
assert(
  mobileSrc.includes("${buildMobileAnimHTML('drill', d)}\n           ${buildMobileCodeSectionHTML('drill', d, saved, inst)}") ||
  mobileSrc.includes("${buildMobileAnimHTML('drill', d)}\r\n           ${buildMobileCodeSectionHTML('drill', d, saved, inst)}"),
  'Mobile renderInlineDrillCard renders animation ABOVE C# reference code inside .m-unified-media'
);
assert(mobileSrc.includes('m-drill-explain'), 'Mobile preserves m-drill-explain hook');

const indexPath = path.join(ROOT, 'index.html');
assert(fs.existsSync(indexPath), 'Bundled index.html exists');
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  for (const marker of [
    'practice-split-layout',
    'is-review-mode',
    'post-unified-media',
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

const mobilePath = path.join(ROOT, 'mobile.html');
assert(fs.existsSync(mobilePath), 'Bundled mobile.html exists');
if (fs.existsSync(mobilePath)) {
  const mobileHtml = fs.readFileSync(mobilePath, 'utf8');
  for (const marker of [
    'm-kp-collapse',
    'm-review-panel',
    'm-unified-media',
    'm-code-card',
    'm-drill-explain',
    'q-reset-starter-btn',
    'buildExplainDetailHTML',
    'dsh-pet-dock',
    'DshPetAssistant.onWrongAnswer',
    'buildIdleHint'
  ]) {
    assert(mobileHtml.includes(marker), `mobile.html embeds marker: ${marker}`);
  }

  const mScripts = [...mobileHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert(mScripts.length >= 10, `mobile.html contains all embedded script bundles (${mScripts.length})`);
  let mCompileOk = true;
  mScripts.forEach((sc, i) => {
    try { new vm.Script(sc); } catch (e) { mCompileOk = false; console.error(`[FAIL] mobile.html script #${i} error:`, e.message); }
  });
  assert(mCompileOk, 'mobile.html all embedded <script> blocks compile without syntax error');
}

console.log(`\nSummary: ${fails === 0 ? 'ALL PC & MOBILE PRACTICE LAYOUT CHECKS PASSED!' : fails + ' FAILURES'}`);
process.exit(fails ? 1 : 0);
