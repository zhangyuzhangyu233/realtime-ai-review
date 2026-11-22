const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const ctx = { window: {}, globalThis: null, console };
ctx.globalThis = ctx.window;
vm.createContext(ctx);

for (const f of ['code_drills.js', 'code_intellisense.js', 'questions.js']) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx);
}

const CIS = ctx.window.CodeIntelliSense;
const DRILLS = ctx.window.CODE_DRILLS;
const BANK = ctx.window.QUESTION_BANK;

let fails = 0;
function assert(cond, msg) {
  if (!cond) { console.error('[FAIL]', msg); fails++; }
  else { console.log('[PASS]', msg); }
}

function labelsOf(res) {
  return (res && Array.isArray(res.items)) ? res.items.map(x => x.label) : [];
}

assert(Boolean(CIS && typeof CIS.getCompletions === 'function'), 'CodeIntelliSense exports core completion API');

// 1. Static & Enum Member Completion
const staticChecks = [
  ['Vector2.', ['Dot', 'Reflect', 'Distance', 'ClampMagnitude', 'zero']],
  ['Vector3.', ['ClampMagnitude', 'Dot', 'Cross', 'Distance', 'forward']],
  ['Mathf.', ['Cos', 'Sin', 'Clamp', 'Deg2Rad', 'Rad2Deg', 'PI']],
  ['Time.', ['deltaTime', 'fixedDeltaTime', 'time']],
  ['RoleState.', ['Tracing', 'Chasing', 'RandomMoving', 'ReachTarget']],
  ['BTStatus.', ['Success', 'Failure', 'Running']],
  ['InstructionType.', ['MoveForward', 'TurnLeft', 'TurnRight']],
  ['TileMap.', ['canPass', 'canPassWithRowCol', 'toXY', 'toColRow']],
  ['Canvas.', ['offset']]
];
for (const [snippet, expected] of staticChecks) {
  const res = CIS.getCompletions(snippet, snippet.length);
  const lbls = labelsOf(res);
  const missing = expected.filter(e => !lbls.includes(e));
  assert(res.isMember && missing.length === 0, `Static/Enum "${snippet}" includes [${expected.join(', ')}]`);
}

// 2. Local Type Inference, Null-Conditional `?.`, and Chained Member Completion
const localTypeCases = [
  ['Queue<MapNode> queue = new Queue<MapNode>();\nqueue.', ['Enqueue', 'Dequeue', 'Peek', 'Count'], 'Queue<MapNode>'],
  ['ArrayList path = new ArrayList();\npath.', ['Add', 'Reverse', 'Count'], 'ArrayList'],
  ['MapNode next = map.getNode(nextPos);\nnext.', ['visited', 'parent', 'pos'], 'MapNode'],
  ['private IState _currentState;\n_currentState?.', ['Enter', 'Execute', 'Exit'], 'IState null-conditional ?.'],
  ['public void Execute(Monster m) {\n    m.', ['IsSafe', 'ChangeState', 'LeaveEnemy'], 'Monster param'],
  ['float[] weight = new float[8];\nweight.', ['Length', 'Clone'], 'float[] array'],
  ['prey.position.', ['x', 'y', 'z', 'magnitude'], 'Chained prey.position.'],
  ['node.parent.', ['visited', 'parent', 'pos'], 'Chained node.parent.']
];
for (const [src, expected, tag] of localTypeCases) {
  const res = CIS.getCompletions(src, src.length);
  const lbls = labelsOf(res);
  const missing = expected.filter(e => !lbls.includes(e));
  assert(res.isMember && missing.length === 0, `Member inference (${tag}) includes [${expected.join(', ')}]`);
}

// 3. Local Symbol Extraction from d1..d9 starter code & Non-Spoiler Isolation
const drillSymbols = [
  ['d1', 'bal', 'ballpos'],
  ['d3', 'monA', 'monsterAngle'],
  ['d4', 'curD', 'curDirection'],
  ['d7', 'doDF', 'doDFSRecursionSearch'],
  ['d7', 'genP', 'generatePath'],
  ['d9', '_cur', '_currentState']
];
for (const [did, query, expectLbl] of drillSymbols) {
  const drill = DRILLS.find(d => d.id === did);
  assert(Boolean(drill && drill.starter), `Found drill ${did} starter code`);
  const probe = drill.starter + '\n' + query;
  const res = CIS.getCompletions(probe, probe.length);
  const lbls = labelsOf(res);
  assert(lbls.includes(expectLbl), `Drill ${did} extracts local symbol "${expectLbl}" for prefix "${query}"`);
}
const d1CommentLeak = CIS.getCompletions(DRILLS[0].starter + '\nTOD', DRILLS[0].starter.length + 4);
assert(!labelsOf(d1CommentLeak).includes('TODO'), 'Comment-only token "TODO" is excluded from completions');

const c1 = BANK.find(q => q.id === 'c1');
const blankCtxRes = CIS.getCompletions('vel', 3, { singleLine: true, extraContext: c1.codeTemplate });
assert(
  labelsOf(blankCtxRes).includes('velocity') && !labelsOf(blankCtxRes).some(l => l.includes('[___')),
  'Single-line fill blank extracts real vars from codeTemplate while excluding [___blank___] placeholders'
);

// 4. Prefix & CamelCase Fuzzy Ranking + Valid Highlight Indices
const fuzzyChecks = [
  ['v2', 'Vector2', 'Vector2'],
  ['Vector2.clm', 'ClampMagnitude', 'ClampMagnitude'],
  ['map.cpw', 'canPassWithRowCol', 'canPassWithRowCol'],
  ['Queue<MapNode> queue;\nqueue.enq', 'Enqueue', 'Enqueue']
];
for (const [src, target, tag] of fuzzyChecks) {
  const res = CIS.getCompletions(src, src.length, { extraContext: 'map' });
  const item = res.items.find(it => it.label === target);
  assert(Boolean(item), `Fuzzy/Prefix "${src.split('\n').pop()}" finds "${tag}"`);
  if (item) {
    const q = res.prefix.toLowerCase();
    const idxs = item.indices || [];
    const strictInc = idxs.every((v, i) => i === 0 || v > idxs[i - 1]);
    const charsMatch = idxs.length === q.length && idxs.every((idx, i) => item.label[idx].toLowerCase() === q[i]);
    assert(strictInc && charsMatch, `Highlight indices for "${tag}" strictly increase and match query "${q}"`);
  }
}
const exactOrder = CIS.getCompletions('Vector2', 7);
assert(exactOrder.items[0] && exactOrder.items[0].label === 'Vector2', 'Exact length match "Vector2" outranks "Vector2Int"');

// 5. Comment & String Literal Suppression
const suppressedCases = [
  '// Vector2.',
  '/* Mathf.\n   Cos */',
  'string msg = "Time.',
  "char c = 'M"
];
for (const sc of suppressedCases) {
  const res = CIS.getCompletions(sc, sc.length);
  assert(res.items.length === 0, `Comment/String suppression blocks completion inside: ${JSON.stringify(sc)}`);
}

// 6. applyCompletion Caret Placement, Existing-Paren Guard & Snippet Indentation
{
  const qSrc = 'Queue<MapNode> queue;\nqueue.Deq';
  const r = CIS.getCompletions(qSrc, qSrc.length);
  const deq = r.items.find(i => i.label === 'Dequeue');
  const app = CIS.applyCompletion(qSrc, qSrc.length, deq, r.replaceStart);
  assert(
    app.value === 'Queue<MapNode> queue;\nqueue.Dequeue()' && app.cursorPos === app.value.length,
    'Zero-arg method Dequeue() places caret after closing paren'
  );
}
{
  const vSrc = 'float d = Vector2.Do';
  const r = CIS.getCompletions(vSrc, vSrc.length);
  const dot = r.items.find(i => i.label === 'Dot');
  const app = CIS.applyCompletion(vSrc, vSrc.length, dot, r.replaceStart);
  assert(
    app.value === 'float d = Vector2.Dot()' && app.value[app.cursorPos - 1] === '(' && app.value[app.cursorPos] === ')',
    'Arg method Vector2.Dot() places caret strictly inside parentheses'
  );
}
{
  const existingParen = 'float c = Mathf.Si(angle);';
  const cur = 'float c = Mathf.Si'.length;
  const r = CIS.getCompletions(existingParen, cur);
  const sinItem = r.items.find(i => i.label === 'Sin');
  const app = CIS.applyCompletion(existingParen, cur, sinItem, r.replaceStart);
  assert(
    app.value === 'float c = Mathf.Sin(angle);' && !app.value.includes('()('),
    'Existing-paren guard avoids double parentheses when "(" already follows caret'
  );
}
{
  const snipSrc = '    for';
  const r = CIS.getCompletions(snipSrc, snipSrc.length);
  const forItem = r.items.find(i => i.kind === 'snip' && i.label === 'for');
  assert(Boolean(forItem), '"for" snippet returned for multi-line editor');
  const app = CIS.applyCompletion(snipSrc, snipSrc.length, forItem, r.replaceStart);
  assert(
    app.value === '    for (int i = 0; i < ; ++i) {\n        \n    }' &&
    app.value.slice(app.cursorPos - 4, app.cursorPos + 1) === 'i < ;',
    'Indented "    for" snippet preserves 4-space indentation and places caret inside condition'
  );
  const sl = CIS.getCompletions('for', 3, { singleLine: true });
  assert(!sl.items.some(i => i.kind === 'snip'), 'singleLine: true excludes multi-line block snippets');
}

// 7. Selection Wrap, Smart Enter & Tab Indent/Outdent
for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}'], ['"', '"'], ["'", "'"]]) {
  const w = CIS.applySelectionWrap('velocity', 0, 8, open);
  assert(
    w && w.value === `${open}velocity${close}` && w.selStart === 1 && w.selEnd === 9,
    `Selection wrap ${open}...${close} encloses "velocity" and keeps inner range selected`
  );
}
assert(CIS.applySelectionWrap('velocity', 3, 3, '(') === null, 'Selection wrap returns null when no range is selected');

{
  const se1 = CIS.applySmartEnter('    int a = 1;', 14, 14);
  assert(se1.value === '    int a = 1;\n    ' && se1.cursorPos === se1.value.length, 'Smart Enter preserves 4-space indent');
  const se2 = CIS.applySmartEnter('    if (ok) {}', 13, 13);
  assert(
    se2.value === '    if (ok) {\n        \n    }' && se2.cursorPos === '    if (ok) {\n        '.length,
    'Smart Enter between "{}" expands into 3 indented lines with caret on inner line'
  );
}
{
  const t1 = CIS.applyTabIndent('abc', 1, 1, false);
  assert(t1.value === 'a    bc' && t1.selStart === 5, 'Single-caret Tab inserts 4 spaces');
  const multi = 'line1\nline2';
  const t2 = CIS.applyTabIndent(multi, 0, multi.length, false);
  assert(t2.value === '    line1\n    line2', 'Multi-line Tab indents both selected lines by 4 spaces');
  const t3 = CIS.applyTabIndent(t2.value, t2.selStart, t2.selEnd, true);
  assert(t3.value === 'line1\nline2', 'Multi-line Shift+Tab outdents both selected lines cleanly');
}

// 8. Bundled HTML Integration Checks (index.html & mobile.html)
for (const [htmlFile, isMobile] of [['index.html', false], ['mobile.html', true]]) {
  const htmlPath = path.join(ROOT, htmlFile);
  assert(fs.existsSync(htmlPath), `${htmlFile} exists after bundling`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert(html.includes('.ide-ac-popup'), `${htmlFile} includes .ide-ac-popup styles`);
  assert(html.includes('CodeIntelliSense'), `${htmlFile} includes CodeIntelliSense module`);
  assert(html.includes('code-blank-input'), `${htmlFile} wires code-blank-input fill-blank completion`);
  if (isMobile) {
    assert(html.includes('data-sym-ac'), 'mobile.html includes data-sym-ac toolbar trigger button');
  }

  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert(scripts.length >= 11, `${htmlFile} embeds at least 11 scripts including code_intellisense.js (${scripts.length})`);
  let allParsed = true;
  scripts.forEach((sc, idx) => {
    try { new vm.Script(sc); }
    catch (e) { allParsed = false; console.error(`[FAIL] ${htmlFile} script #${idx} parse error:`, e.message); }
  });
  assert(allParsed, `All ${scripts.length} scripts inside ${htmlFile} parse cleanly`);
}

console.log(`\nSummary: ${fails === 0 ? 'ALL PASSED' : `${fails} FAILED`}`);
process.exit(fails > 0 ? 1 : 0);
