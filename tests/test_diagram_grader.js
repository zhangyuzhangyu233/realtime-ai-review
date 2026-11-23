const fs = require('fs');
const vm = require('vm');
const path = require('path');

const BUILD = path.resolve(__dirname, '../src');
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ['code_drills.js', 'smart_grader.js', 'diagram_board.js', 'questions.js']) {
  vm.runInContext(fs.readFileSync(path.join(BUILD, f), 'utf8'), ctx);
}

const G = ctx.window.SmartGrader;
const BANK = ctx.window.QUESTION_BANK;

let fails = 0;
function assert(cond, msg) {
  if (!cond) { console.error('[FAIL]', msg); fails++; }
  else { console.log('[PASS]', msg); }
}

const qE5 = BANK.find(x => x.id === 'e5');
const qE6 = BANK.find(x => x.id === 'e6');
const qE7 = BANK.find(x => x.id === 'e7');
const qE9 = BANK.find(x => x.id === 'e9');
const qF6 = BANK.find(x => x.id === 'f6');

// 1. Empty board & text must fail cleanly
for (const q of [qE5, qE6, qE7, qE9]) {
  const rep = G.evaluateSubjective(q, { text: '', diagram: { nodes: [], edges: [] } });
  assert(!rep.pass && rep.score === 0, `${q.id} empty board & text fails cleanly (0/10)`);
}

// 2. e5 Guard FSM: English + casual labels + separate "Start" node pointing to Patrol -> PASS!
const guardDiaOk = {
  nodes: [
    { id: 'st', x: 60, y: 120, label: '开始', nodeType: 'state', isInitial: false },
    { id: 'n1', x: 160, y: 120, label: 'Patrol', nodeType: 'state', isInitial: false },
    { id: 'n2', x: 340, y: 120, label: '追击敌人', nodeType: 'state', isInitial: false },
    { id: 'n3', x: 520, y: 120, label: 'Attack', nodeType: 'state', isInitial: false },
    { id: 'n4', x: 340, y: 260, label: '阵亡 Dead', nodeType: 'state', isInitial: false }
  ],
  edges: [
    { id: 'e0', from: 'st', to: 'n1', label: '' },
    { id: 'e1', from: 'n1', to: 'n2', label: '看到玩家' },
    { id: 'e2', from: 'n2', to: 'n1', label: '丢失目标' },
    { id: 'e3', from: 'n2', to: 'n3', label: '够近进入射程' },
    { id: 'e4', from: 'n3', to: 'n2', label: '超出射程' },
    { id: 'e5', from: 'n3', to: 'n1', label: '玩家很远' },
    { id: 'e6', from: 'n1', to: 'n4', label: '血量归零' },
    { id: 'e7', from: 'n2', to: 'n4', label: 'HP==0' },
    { id: 'e8', from: 'n3', to: 'n4', label: 'hp=0' }
  ]
};
const repE5DiaOnly = G.evaluateSubjective(qE5, { text: '', diagram: guardDiaOk });
assert(repE5DiaOnly.pass && repE5DiaOnly.diagramEval.initOk && repE5DiaOnly.diagramEval.totalRatio >= 0.9,
  `e5 flexible English/Start-node FSM diagram passes (${repE5DiaOnly.score}/10, ratio=${repE5DiaOnly.diagramEval.totalRatio.toFixed(2)})`);

const repE5Hybrid = G.evaluateSubjective(qE5, {
  text: 'FSM四要素：状态、初始状态、输入、转换。不用switch-case是因为状态多变面条代码高耦合，状态模式用IState接口解耦易扩展符合开闭原则。',
  diagram: guardDiaOk
});
assert(repE5Hybrid.pass && repE5Hybrid.score === 10, `e5 hybrid (diagram + text elements/pattern) -> ${repE5Hybrid.score}/10`);

// Buggy e5 (missing initial marker & reversed patrol<-chase)
const guardDiaBad = {
  nodes: [
    { id: 'n1', x: 160, y: 120, label: '巡逻', isInitial: false },
    { id: 'n2', x: 340, y: 120, label: '追逐', isInitial: false }
  ],
  edges: [{ id: 'e1', from: 'n2', to: 'n1', label: '发现玩家' }]
};
const repE5Bad = G.evaluateSubjective(qE5, { text: '', diagram: guardDiaBad });
assert(!repE5Bad.pass && !repE5Bad.diagramEval.initOk, `e5 incomplete/no-init FSM fails cleanly (${repE5Bad.score}/10)`);

// 3. e6 Blinky vs Ant World auto-branch detection from diagram!
const antDiaOk = {
  nodes: [
    { id: 'a1', x: 140, y: 120, label: '饥饿觅食', isInitial: true },
    { id: 'a2', x: 340, y: 120, label: '回巢', isInitial: false },
    { id: 'a3', x: 540, y: 120, label: '口渴找水', isInitial: false },
    { id: 'a4', x: 340, y: 260, label: '死亡', isInitial: false }
  ],
  edges: [
    { id: 'ea1', from: 'a1', to: 'a2', label: '拿到食物' },
    { id: 'ea2', from: 'a2', to: 'a3', label: '回巢放下食物' },
    { id: 'ea3', from: 'a3', to: 'a1', label: '喝水' },
    { id: 'ea4', from: 'a1', to: 'a4', label: '碰到毒物' },
    { id: 'ea5', from: 'a2', to: 'a4', label: '中毒' },
    { id: 'ea6', from: 'a3', to: 'a4', label: '有毒' }
  ]
};
const repE6Ant = G.evaluateSubjective(qE6, { text: '', diagram: antDiaOk });
assert(repE6Ant.pass && repE6Ant.score >= 9.0 && repE6Ant.branchName.includes('蚂蚁'),
  `e6 auto-detects Ant World diagram (${repE6Ant.branchName}, ${repE6Ant.score}/10)`);

const blinkyDiaOk = {
  nodes: [
    { id: 'b1', x: 120, y: 140, label: '上升', isInitial: true },
    { id: 'b2', x: 260, y: 140, label: '追逐', isInitial: false },
    { id: 'b3', x: 400, y: 60, label: '漫游散开', isInitial: false },
    { id: 'b4', x: 400, y: 220, label: '惊恐逃离', isInitial: false },
    { id: 'b5', x: 260, y: 280, label: '眼珠回家', isInitial: false }
  ],
  edges: [
    { id: 'eb1', from: 'b1', to: 'b2', label: '走出中央' },
    { id: 'eb2', from: 'b2', to: 'b3', label: '玩家死亡' },
    { id: 'eb3', from: 'b3', to: 'b2', label: '重生' },
    { id: 'eb4', from: 'b2', to: 'b4', label: '吃大力丸' },
    { id: 'eb5', from: 'b4', to: 'b2', label: '时间用尽' },
    { id: 'eb6', from: 'b4', to: 'b5', label: '被吃掉' },
    { id: 'eb7', from: 'b5', to: 'b1', label: '回到中心' }
  ]
};
const repE6Blinky = G.evaluateSubjective(qE6, { text: '', diagram: blinkyDiaOk });
assert(repE6Blinky.pass && repE6Blinky.score >= 9.0 && repE6Blinky.branchName.includes('Blinky'),
  `e6 auto-detects Blinky 5-state diagram (${repE6Blinky.branchName}, ${repE6Blinky.score}/10)`);

// 4. e7 Parallel + Until Failure BT diagram (without explicit Root node, flexible names!)
const btE7Ok = {
  nodes: [
    { id: 'p', x: 380, y: 80, label: '并行', nodeType: 'parallel' },
    { id: 'd', x: 220, y: 170, label: 'Until Failure', nodeType: 'decorator' },
    { id: 'c', x: 220, y: 270, label: '能看见玩家吗', nodeType: 'condition' },
    { id: 's', x: 520, y: 170, label: '顺序节点', nodeType: 'sequence' },
    { id: 'a1', x: 450, y: 270, label: '向玩家移动', nodeType: 'action' },
    { id: 'a2', x: 590, y: 270, label: '攻击', nodeType: 'action' }
  ],
  edges: [
    { id: 'e1', from: 'p', to: 'd', label: '' },
    { id: 'e2', from: 'p', to: 's', label: '' },
    { id: 'e3', from: 'd', to: 'c', label: '' },
    { id: 'e4', from: 's', to: 'a1', label: '' },
    { id: 'e5', from: 's', to: 'a2', label: '' }
  ]
};
const repE7Hybrid = G.evaluateSubjective(qE7, {
  text: 'Sequence记住Running节点下帧不重检看到玩家所以无法中断；BT是树状可复用，FSM是图状易状态爆炸。',
  diagram: btE7Ok
});
assert(repE7Hybrid.pass && repE7Hybrid.score >= 9.0, `e7 Parallel+UntilFailure diagram + text -> ${repE7Hybrid.score}/10`);

// Buggy e7: omits Parallel, only draws Sequence -> Move -> Attack
const btE7Bad = {
  nodes: [
    { id: 's', x: 380, y: 100, label: 'Sequence', nodeType: 'sequence' },
    { id: 'c', x: 240, y: 220, label: '看到玩家？', nodeType: 'condition' },
    { id: 'a1', x: 380, y: 220, label: '移动', nodeType: 'action' },
    { id: 'a2', x: 520, y: 220, label: '攻击', nodeType: 'action' }
  ],
  edges: [
    { id: 'e1', from: 's', to: 'c', label: '' },
    { id: 'e2', from: 's', to: 'a1', label: '' },
    { id: 'e3', from: 's', to: 'a2', label: '' }
  ]
};
const repE7Bad = G.evaluateSubjective(qE7, { text: '', diagram: btE7Bad });
assert(!repE7Bad.pass, `e7 plain Sequence without Parallel/Decorator rejected (${repE7Bad.score}/10)`);

// 5. e9 Combat Decision BT: left-to-right Selector -> [Sequence(LowHP->Flee), Sequence(SeeEnemy->Attack), Patrol]
const btE9Ok = {
  nodes: [
    { id: 'sel', x: 380, y: 80, label: 'Selector ?', nodeType: 'selector' },
    { id: 'sq1', x: 160, y: 170, label: 'Seq1', nodeType: 'sequence' },
    { id: 'sq2', x: 400, y: 170, label: 'Seq2', nodeType: 'sequence' },
    { id: 'pat', x: 610, y: 170, label: '默认巡逻', nodeType: 'action' },
    { id: 'c1', x: 100, y: 270, label: '残血？', nodeType: 'condition' },
    { id: 'a1', x: 220, y: 270, label: '回血治疗', nodeType: 'action' },
    { id: 'c2', x: 340, y: 270, label: '发现敌人？', nodeType: 'condition' },
    { id: 'a2', x: 460, y: 270, label: '追击攻击', nodeType: 'action' }
  ],
  edges: [
    { id: 'e1', from: 'sel', to: 'sq1', label: '' },
    { id: 'e2', from: 'sel', to: 'sq2', label: '' },
    { id: 'e3', from: 'sel', to: 'pat', label: '' },
    { id: 'e4', from: 'sq1', to: 'c1', label: '' },
    { id: 'e5', from: 'sq1', to: 'a1', label: '' },
    { id: 'e6', from: 'sq2', to: 'c2', label: '' },
    { id: 'e7', from: 'sq2', to: 'a2', label: '' }
  ]
};
const repE9Dia = G.evaluateSubjective(qE9, { text: '', diagram: btE9Ok });
assert(repE9Dia.pass && repE9Dia.score >= 8.0, `e9 3-branch priority BT diagram alone passes (${repE9Dia.score}/10)`);

// Reversed priority X positions (Patrol on left of LowHP) should dock priority score & warn
const btE9Rev = JSON.parse(JSON.stringify(btE9Ok));
btE9Rev.nodes.find(n => n.id === 'pat').x = 80;
const diaE9Rev = G.evaluateDiagram(qE9, btE9Rev);
assert(diaE9Rev.missedHints.some(h => h.includes('从左到右')), `e9 reversed X priority emits targeted order hint`);

// 6. f6 optimal path variants
assert(G.matchFillBlank('8-16-24-18-19', qF6.blanks[5].answers), 'f6 accepts 8-16-24-18-19');
assert(G.matchFillBlank('8-16-24-25-19', qF6.blanks[5].answers), 'f6 accepts optimal alt 8-16-24-25-19');

// 7. Loose free arrows (proximity-resolved fromPt/toPt) on e5 & e7
const looseGuard = JSON.parse(JSON.stringify(guardDiaOk));
looseGuard.edges[1] = { id: 'el1', from: null, to: null, fromPt: { x: 185, y: 122 }, toPt: { x: 315, y: 118 }, label: '发现敌人' };
looseGuard.edges[2] = { id: 'el2', from: 'n2', to: null, toPt: { x: 162, y: 128 }, label: '丢失目标' };
const repLooseE5 = G.evaluateSubjective(qE5, { text: '', diagram: looseGuard });
assert(repLooseE5.pass && repLooseE5.diagramEval.totalRatio >= 0.9,
  `e5 resolves loose free-arrow endpoints near nodes cleanly (${repLooseE5.score}/10)`);

// Wide FSM capsule loose edge near far right edge
const wideBlinky = JSON.parse(JSON.stringify(blinkyDiaOk));
wideBlinky.nodes[0].label = '回到迷宫中央重新上升';
wideBlinky.nodes[0].x = 160;
// Width ~ 10*12.5+30 = 155 -> hw ~ 78, right edge ~ 238; point at x=250 is within 28px borderDist
wideBlinky.edges[0] = { id: 'eb1', from: null, to: 'b2', fromPt: { x: 250, y: 140 }, label: '走出中央' };
const repWideFsm = G.evaluateSubjective(qE6, { text: '', diagram: wideBlinky });
assert(repWideFsm.pass && repWideFsm.score >= 9.0,
  `e6 resolves free arrow dropped near wide FSM capsule edge (${repWideFsm.score}/10)`);

const looseBtE7 = JSON.parse(JSON.stringify(btE7Ok));
// Wide BT port test: drop near right edge of Decorator (x:220, hw=82 -> 302) & top of Condition
looseBtE7.edges[2] = { id: 'elb3', from: null, to: null, fromPt: { x: 295, y: 170 }, toPt: { x: 218, y: 266 }, label: '' };
const repLooseE7Brief = G.evaluateSubjective(qE7, { text: 'Parallel每帧同时执行', diagram: looseBtE7 });
assert(repLooseE7Brief.pass && repLooseE7Brief.score >= 6.0 && repLooseE7Brief.diagramEval.totalRatio === 1,
  `e7 resolves wide-box free arrows & honors diagram pass floor with brief text (${repLooseE7Brief.score}/10)`);

const repLooseE7Full = G.evaluateSubjective(qE7, {
  text: 'Sequence会记住Running节点下一帧继续执行无法每帧重检看到玩家，所以用Parallel+Until Failure实时监听并在看到玩家时中止巡逻。BT是树状结构通过子节点返回状态组合复用，FSM是图状状态多时转移线易爆炸。',
  diagram: looseBtE7
});
assert(repLooseE7Full.pass && repLooseE7Full.score >= 9.0,
  `e7 loose free-arrow hybrid + full text scores >= 9.0 (${repLooseE7Full.score}/10)`);

// 8. e10 A* Graded PathGrid (equal-cost optimal paths = 72, suboptimal = 78, corner-cut fail, obstacle fail)
const qE10 = BANK.find(x => x.id === 'e10');
assert(Boolean(qE10 && qE10.board && qE10.board.kind === 'pathgrid'), 'e10 exists with pathgrid spec');

const repE10OptA = G.evaluateSubjective(qE10, {
  text: '',
  diagram: { kind: 'pathgrid', path: [12, 7, 1, 2, 3, 10, 17] }
});
assert(repE10OptA.pass && repE10OptA.diagramEval.isOptimal && repE10OptA.diagramEval.optimalCost === 72 && repE10OptA.score >= 7.5,
  `e10 optimal path A [12-7-1-2-3-10-17] (cost=72) passes automatically (${repE10OptA.score}/10)`);

const repE10OptB = G.evaluateSubjective(qE10, {
  text: '曼哈顿距离估算，直走10斜走14，最优总代价 g*=72',
  diagram: { kind: 'pathgrid', path: [12, 6, 1, 2, 3, 10, 17] }
});
assert(repE10OptB.pass && repE10OptB.diagramEval.isOptimal && repE10OptB.score === 10,
  `e10 equal-cost optimal alt path B [12-6-1-2-3-10-17] + formula explanation gets 10/10`);

const repE10Sub = G.evaluateSubjective(qE10, {
  text: '',
  diagram: { kind: 'pathgrid', path: [12, 19, 25, 26, 27, 28, 22, 17] }
});
assert(!repE10Sub.diagramEval.isOptimal && repE10Sub.diagramEval.isLegalRoute && repE10Sub.diagramEval.userCost === 78,
  `e10 bottom suboptimal route gives userCost=78 & diagnostic (score=${repE10Sub.score}/10)`);

const repE10Cut = G.evaluateSubjective(qE10, {
  text: '72',
  diagram: { kind: 'pathgrid', path: [12, 7, 2, 3, 10, 17] }
});
assert(!repE10Cut.pass && !repE10Cut.diagramEval.isLegalRoute && repE10Cut.diagramEval.missedHints.some(h => h.includes('斜穿')),
  `e10 illegal diagonal corner-cut (7->2 past wall #8) rejected with diagnostic`);

const repE10Wall = G.evaluateSubjective(qE10, {
  text: '',
  diagram: { kind: 'pathgrid', path: [12, 8, 3, 10, 17] }
});
assert(!repE10Wall.pass && repE10Wall.diagramEval.cellStatuses[8] === 'bad',
  `e10 obstacle collision #8 rejected & cell flagged red`);

// 9. Verify e1..e4 have non-graded scratchBoard (not graded q.board) with default allowCornerCut=true
for (const eid of ['e1', 'e2', 'e3', 'e4']) {
  const qx = BANK.find(x => x.id === eid);
  assert(
    Boolean(qx && !qx.board && qx.scratchBoard && qx.scratchBoard.role === 'scratch' && qx.scratchBoard.allowCornerCut === true),
    `${eid} has optional non-graded scratchBoard with allowCornerCut=true`
  );
}

// 10. Diagonal path drag core-circle hit detection & Chebyshev fast-drag interpolation (PC + Mobile)
const DB = ctx.window.DiagramBoard;
assert(Boolean(DB && typeof DB.resolvePathDragHit === 'function' && typeof DB.interpolateGridSteps === 'function'),
  'DiagramBoard exports resolvePathDragHit & interpolateGridSteps');

function sampleDragHits(pts, rows, cols, cellSz, gap, useCoreCircle = true) {
  const hits = [];
  for (const [x, y] of pts) {
    const cid = DB.resolvePathDragHit(x, y, rows, cols, cellSz, gap, useCoreCircle);
    if (cid !== null && hits[hits.length - 1] !== cid) hits.push(cid);
  }
  return hits;
}

for (const cfg of [
  { name: 'Desktop f6 (54px)', rows: 4, cols: 7, cellSz: 54, gap: 5, offsets: [0, -10, 10] },
  { name: 'Mobile e10 (34px)', rows: 5, cols: 6, cellSz: 34, gap: 3, offsets: [0, -6, 6] }
]) {
  const step = cfg.cellSz + cfg.gap;
  const x0 = 1 * step + cfg.cellSz / 2;
  const y0 = 1 * step + cfg.cellSz / 2;
  const x1 = 2 * step + cfg.cellSz / 2;
  const y1 = 2 * step + cfg.cellSz / 2;
  const startId = 1 * cfg.cols + 1;
  const diagId = 2 * cfg.cols + 2;

  for (const off of cfg.offsets) {
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const clampX = Math.max(startId === 0 ? 0 : step, x0 + (x1 - x0) * t + (t > 0.05 && t < 0.95 ? off : 0));
      const clampY = y0 + (y1 - y0) * t - (t > 0.05 && t < 0.95 ? off : 0);
      pts.push([clampX, clampY]);
    }
    const seq = sampleDragHits(pts, cfg.rows, cfg.cols, cfg.cellSz, cfg.gap, true);
    assert(
      seq.length === 2 && seq[0] === startId && seq[1] === diagId,
      `${cfg.name} diagonal drag (offset=${off}px) resolves directly [${startId}, ${diagId}] without grazing orthogonal corners (got [${seq.join(', ')}])`
    );
  }

  // Intentional L-turn through cell centers: (1,1) -> (1,2) -> (2,2)
  const midX = x1, midY = y0;
  const lPts = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12;
    lPts.push([x0 + (midX - x0) * t, y0 + (midY - y0) * t]);
  }
  for (let k = 1; k <= 12; k++) {
    const t = k / 12;
    lPts.push([midX + (x1 - midX) * t, midY + (y1 - midY) * t]);
  }
  const orthId = 1 * cfg.cols + 2;
  const lSeq = sampleDragHits(lPts, cfg.rows, cfg.cols, cfg.cellSz, cfg.gap, true);
  assert(
    lSeq.length === 3 && lSeq[0] === startId && lSeq[1] === orthId && lSeq[2] === diagId,
    `${cfg.name} intentional L-turn hits all 3 centers [${startId}, ${orthId}, ${diagId}]`
  );

  // Corner of cell (1,2): missed in core-circle mode (path), hit in full-cell mode (wall brush)
  const cornerX = 2 * step + 2;
  const cornerY = 1 * step + cfg.cellSz - 2;
  assert(DB.resolvePathDragHit(cornerX, cornerY, cfg.rows, cfg.cols, cfg.cellSz, cfg.gap, true) === null,
    `${cfg.name} core-circle filter ignores grazed cell corner (${cornerX.toFixed(1)}, ${cornerY.toFixed(1)})`);
  assert(DB.resolvePathDragHit(cornerX, cornerY, cfg.rows, cfg.cols, cfg.cellSz, cfg.gap, false) === orthId,
    `${cfg.name} full-cell mode (wall brush) still hits cell corner #${orthId}`);
}

const interpF6 = DB.interpolateGridSteps(8, 24, 7);
assert(interpF6.length === 2 && interpF6[0] === 16 && interpF6[1] === 24, `interpolateGridSteps(8, 24, 7) -> [${interpF6.join(', ')}]`);

const interpE10 = DB.interpolateGridSteps(3, 17, 6);
assert(interpE10.length === 2 && interpE10[0] === 10 && interpE10[1] === 17, `interpolateGridSteps(3, 17, 6) -> [${interpE10.join(', ')}]`);

const interpSame = DB.interpolateGridSteps(12, 12, 6);
assert(interpSame.length === 0, 'interpolateGridSteps(12, 12, 6) -> []');

// Verify scratch board HTML exposes toggle-corner-cut while graded e10 board does not
const scratchHtml = DB.createBoardHTML(BANK.find(x => x.id === 'e1').scratchBoard, 'sc1', null, false);
const gradedHtml = DB.createBoardHTML(qE10.board, 'gr1', null, false);
assert(scratchHtml.includes('data-pgact="toggle-corner-cut"'), 'Scratch board renders toggle-corner-cut button');
assert(!gradedHtml.includes('data-pgact="toggle-corner-cut"'), 'Graded e10 board does not expose toggle-corner-cut cheat button');

console.log(`\nSummary: ${fails === 0 ? 'ALL DIAGRAM GRADER TESTS PASSED!' : fails + ' FAILURES'}`);
process.exit(fails ? 1 : 0);
