const fs = require('fs');
const vm = require('vm');
const path = require('path');

const BUILD = path.resolve(__dirname, '../src');
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ['code_drills.js', 'smart_grader.js', 'questions.js']) {
  vm.runInContext(fs.readFileSync(path.join(BUILD, f), 'utf8'), ctx);
}

const G = ctx.window.SmartGrader;
const DRILLS = ctx.window.CODE_DRILLS;
const BANK = ctx.window.QUESTION_BANK;

let fails = 0;
function assert(cond, msg) {
  if (!cond) { console.error('[FAIL]', msg); fails++; }
  else { console.log('[PASS]', msg); }
}

// 1. Starter must fail, Solution must pass 100% for all d1..d9
for (const d of DRILLS) {
  const rStart = G.evaluateCodeDrill(d, d.starter);
  const rSol = G.evaluateCodeDrill(d, d.solution);
  assert(!rStart.allOk && rStart.passCnt === 0, `${d.id} starter fails cleanly (${rStart.passCnt}/${rStart.totalCnt})`);
  assert(rSol.allOk && rSol.passCnt === rSol.totalCnt, `${d.id} official solution passes (${rSol.passCnt}/${rSol.totalCnt})`);
}

// 2. Alternative valid C# solutions for d1..d9!
const altD1 = `
void Update() {
    float dt = Time.deltaTime;
    if (isShoot) {
        Vector2 ballpos = ball.anchoredPosition;
        velocity += dt * acceleration;
        ball.anchoredPosition += Time.deltaTime * velocity;
        HandleCollision();
    }
}
void HandleCollision() {
    if (hitRightWall) { velocity.x *= -1f; }
    if (hitCeiling) { velocity = new Vector2(velocity.x, -velocity.y); }
    if (hitHoopPoint) { velocity *= -1.0f; }
    if (hitSlope) {
        float d = velocity.x * N.x + velocity.y * N.y;
        velocity -= 2f * d * N;
    }
}`;
const rAlt1 = G.evaluateCodeDrill(DRILLS[0], altD1);
assert(rAlt1.allOk, `d1 alt solution (commutative, *= -1f, new Vector2, manual dot -=) -> ${rAlt1.passCnt}/${rAlt1.totalCnt}`);

const badD1 = `
void Update() {
    float dt = Time.deltaTime;
    if (isShoot) {
        Vector2 ballpos = ball.anchoredPosition;
        velocity -= acceleration * dt;
        ball.anchoredPosition = ballpos + velocity * dt;
    }
}
void HandleCollision() {
    if (hitRightWall) { velocity.y = -velocity.y; }
    if (hitCeiling) { velocity.x = -velocity.x; }
    if (hitHoopPoint) { velocity = velocity; }
    if (hitSlope) { velocity = velocity + 2 * Vector2.Dot(velocity, N) * N; }
}`;
const rBad1 = G.evaluateCodeDrill(DRILLS[0], badD1);
assert(!rBad1.checks[0].ok && !rBad1.checks[2].ok && !rBad1.checks[3].ok && !rBad1.checks[4].ok && !rBad1.checks[5].ok,
  `d1 buggy code rejected accurately (${rBad1.passCnt}/${rBad1.totalCnt})`);

const altD2 = `
void UpdateIntercept() {
    var vr = preyVelocity - predatorVelocity;
    var sr = prey.position - predator.position;
    float tc = sr.magnitude / vr.magnitude;
    var st = tc * preyVelocity + prey.position;
    var vDes = (st - predator.position) / tc;
    var vClamp = Vector3.ClampMagnitude(vDes, maxSpeed);
    predator.position = predator.position + Time.deltaTime * vClamp;
}`;
const rAlt2 = G.evaluateCodeDrill(DRILLS[1], altD2);
assert(rAlt2.allOk, `d2 alt solution (renamed vr/sr/tc/st + commutative + predator.position) -> ${rAlt2.passCnt}/${rAlt2.totalCnt}`);

const altD3 = `
void DoPattern(ArrayList patternArray, float dt) {
    ControlData data = (ControlData)patternArray[curIndex];
    monsterAngle += data.fLeftAngle - data.fRightAngle;
    monsterAngle %= 360f;
    while (monsterAngle < 0f) { monsterAngle = monsterAngle + 360f; }
    Vector2 v = new Vector2(Mathf.Cos(monsterAngle * Mathf.PI / 180f), Mathf.Sin(monsterAngle * Mathf.PI / 180f));
    Vector2 pos = monster.anchoredPosition;
    Vector2 displacement = dt * MonsterSpeed * v;
    stepDistance += displacement.magnitude;
    pos += displacement;
    if (stepDistance >= data.fForwardDis - data.fBackwardDis) {
        curIndex = (curIndex + 1) % patternArray.Count;
        stepDistance = 0f;
    }
    monster.anchoredPosition = pos;
}`;
const rAlt3 = G.evaluateCodeDrill(DRILLS[2], altD3);
assert(rAlt3.allOk, `d3 alt solution (%= 360f, while<0, PI/180f, combined curIndex wrap, 0f) -> ${rAlt3.passCnt}/${rAlt3.totalCnt}`);

const altD4 = `
void doWallTracing(float dt) {
    Vector2 curPos = map.toColRow(sprite.anchoredPosition + Canvas.offset);
    for (int i = 2 + curDirection; i > curDirection - 6; i--) {
        int walkDir = ((i % 8) + 8) % 8;
        Vector2 pt = curPos + dirs[walkDir];
        if (map.canPassWithRowCol(pt) == true) {
            target = map.toXY(pt);
            curDirection = walkDir;
            break;
        }
    }
}`;
const rAlt4 = G.evaluateCodeDrill(DRILLS[3], altD4);
assert(rAlt4.allOk, `d4 alt solution (2+curDirection, ((i%8)+8)%8, ==true) -> ${rAlt4.passCnt}/${rAlt4.totalCnt}`);

const badD4 = `
void doWallTracing(float dt) {
    for (int i = curDirection + 2; i > curDirection - 6; --i) {
        int walkDir = i % 8;
        Vector2 pt = curPos + dirs[walkDir];
        if (map.canPassWithRowCol(pt)) target = map.toXY(pt);
    }
}`;
const rBad4 = G.evaluateCodeDrill(DRILLS[3], badD4);
assert(!rBad4.checks[1].ok, `d4 buggy (i % 8 without +8) accurately rejected!`);

const altD5 = `
Vector2 curPos = map.toColRow(sprite.anchoredPosition + Canvas.offset);
for (int k = 0; k < 8; k++) {
    Vector2 pnt = dirs[k] + curPos;
    if (map.canPassWithRowCol(pnt) == false) weight[k] = weight[k] - 10;
}
for (int k = 0; k < 8; k++) {
    if (maxWeight < weight[k]) { maxWeight = weight[k]; curDirection = k; }
}
target = map.toXY(dirs[curDirection] + curPos);`;
const rAlt5 = G.evaluateCodeDrill(DRILLS[4], altD5);
assert(rAlt5.allOk, `d5 alt solution (loop var k, ==false, maxWeight<weight[k], inline toXY) -> ${rAlt5.passCnt}/${rAlt5.totalCnt}`);

const altD6 = `
Vector2 pos = monster.anchoredPosition + displacement;
if (TileMap.canPass(pos)) {
    monster.anchoredPosition += displacement;
    monsterMovedDis += displacement.magnitude;
    if (monsterNeedMoveDis <= monsterMovedDis) {
        monsterState = Tracing;
        monsterMovedDis = 0f;
        monsterNeedMoveDis = 0f;
        Vector2 vr = (player.anchoredPosition - monster.anchoredPosition).normalized;
        monsterVelocity = MonsterSpeed * vr;
    }
} else monsterNeedMoveDis = 0f;`;
const rAlt6 = G.evaluateCodeDrill(DRILLS[5], altD6);
assert(rAlt6.allOk, `d6 alt solution (+= displacement, <=, .normalized, MonsterSpeed*vr, braceless else) -> ${rAlt6.passCnt}/${rAlt6.totalCnt}`);

const altD7 = `
bool doDFSRecursionSearch(MapNode from, MapNode to) {
    from.visited = true;
    if (to == from) return true;
    for (int i = 0; i < 8; i++) {
        Vector2Int nextPos = from.pos + dirs[i];
        if (map.canPassWithRowCol(nextPos)) {
            MapNode next = map.getNode(nextPos);
            if (next.visited == false) {
                next.parent = from;
                if (doDFSRecursionSearch(next, to)) return true;
            }
        }
    }
    return false;
}
ArrayList generatePath(MapNode targetNode) {
    ArrayList path = new ArrayList();
    for (MapNode n = targetNode; n != null; n = n.parent) {
        path.Insert(0, n);
    }
    return path;
}`;
const rAlt7 = G.evaluateCodeDrill(DRILLS[6], altD7);
assert(rAlt7.allOk, `d7 alt solution (to==from, ==false, for-loop + Insert(0)) -> ${rAlt7.passCnt}/${rAlt7.totalCnt}`);

const altD8 = `
bool doBFSSearch(MapNode start, MapNode target) {
    if (start == target) return true;
    var q = new Queue<MapNode>();
    start.visited = true;
    q.Enqueue(start);
    while (q.Count != 0) {
        var cur = q.Dequeue();
        for (int i = 0; i < 8; i++) {
            Vector2Int nextPos = cur.pos + dirs[i];
            if (!map.canPassWithRowCol(nextPos)) continue;
            var next = map.getNode(nextPos);
            if (next.visited == false) {
                next.visited = true;
                next.parent = cur;
                if (target == next) { path = generatePath(target); return true; }
                q.Enqueue(next);
            }
        }
    }
    return false;
}`;
const rAlt8 = G.evaluateCodeDrill(DRILLS[7], altD8);
assert(rAlt8.allOk, `d8 alt solution (var q, Count!=0, ==false, target==next) -> ${rAlt8.passCnt}/${rAlt8.totalCnt}`);

const altD9 = `
public interface IState {
    void Enter(Monster owner);
    void Execute(Monster owner);
    void Exit(Monster owner);
}
public class Monster {
    private IState _currentState;
    public void ChangeState(IState newState) {
        if (_currentState != null) { _currentState.Exit(this); }
        _currentState = newState;
        if (_currentState != null) { _currentState.Enter(this); }
    }
}
public class RunAway : IState {
    public void Enter(Monster m) {}
    public void Execute(Monster m) {
        if (!m.IsSafe()) {
            m.LeaveEnemy();
        } else {
            m.ChangeState(new Patrol());
        }
    }
    public void Exit(Monster m) {}
}`;
const rAlt9 = G.evaluateCodeDrill(DRILLS[8], altD9);
assert(rAlt9.allOk, `d9 alt solution (if!=null Exit/Enter + negated if(!IsSafe) LeaveEnemy else Patrol) -> ${rAlt9.passCnt}/${rAlt9.totalCnt}`);

const badD9 = `
public interface IState { void Enter(Monster m); void Execute(Monster m); void Exit(Monster m); }
public class Monster {
    private IState _currentState;
    public void ChangeState(IState newState) {
        _currentState = newState;
        _currentState?.Exit(this);
        _currentState.Enter(this);
    }
}
public class RunAway : IState {
    public void Execute(Monster m) {
        if (m.IsSafe()) m.LeaveEnemy();
        else m.ChangeState(new Patrol());
    }
}`;
const rBad9 = G.evaluateCodeDrill(DRILLS[8], badD9);
assert(!rBad9.checks[1].ok && !rBad9.checks[2].ok, `d9 wrong order + inverted IsSafe accurately rejected!`);

// 3. Code Fill-in-the-blank equivalence (c1, c2, c3, c5)
const qC1 = BANK.find(x => x.id === 'c1');
const qC2 = BANK.find(x => x.id === 'c2');
const qC3 = BANK.find(x => x.id === 'c3');
const qC5 = BANK.find(x => x.id === 'c5');
assert(G.matchFillBlank('dt * acceleration + velocity;', qC1.blanks[0].answers), 'c1 blank1 commutative + trailing ;');
assert(G.matchFillBlank('velocity += acceleration * Time.deltaTime', qC1.blanks[0].answers), 'c1 blank1 += Time.deltaTime');
assert(G.matchFillBlank('velocity.x *= -1f;', qC1.blanks[2].answers), 'c1 blank3 *= -1f');
assert(G.matchFillBlank('velocity = new Vector2(-velocity.x, velocity.y)', qC1.blanks[2].answers), 'c1 blank3 new Vector2');
assert(!G.matchFillBlank('velocity.y = -velocity.y', qC1.blanks[2].answers), 'c1 blank3 wrong axis rejected');
assert(G.matchFillBlank('velocity = velocity - 2f * Vector2.Dot(N, velocity) * N;', qC1.blanks[5].answers), 'c1 blank6 velocity - 2f*Dot*N');
assert(G.matchFillBlank('velocity -= 2 * (velocity.x * N.x + velocity.y * N.y) * N', qC1.blanks[5].answers), 'c1 blank6 manual dot -=');
assert(!G.matchFillBlank('velocity = velocity + 2 * Vector2.Dot(velocity, N) * N', qC1.blanks[5].answers), 'c1 blank6 wrong sign rejected');
assert(G.matchFillBlank('new Vector2(Mathf.Cos(monsterAngle * Mathf.PI / 180f), Mathf.Sin(monsterAngle * Mathf.PI / 180f))', qC2.blanks[2].answers), 'c2 blank3 inline PI/180f');
assert(G.matchFillBlank('((i % 8) + 8) % 8', qC3.blanks[1].answers), 'c3 blank2 ((i%8)+8)%8');
assert(G.matchFillBlank('i < 0 ? i + 8 : i % 8', qC3.blanks[1].answers), 'c3 blank2 ternary wrap');
assert(!G.matchFillBlank('i % 8', qC3.blanks[1].answers), 'c3 blank2 unsafe i%8 rejected');
assert(G.matchFillBlank('monsterNeedMoveDis <= monsterMovedDis', qC5.blanks[3].answers), 'c5 blank4 reversed <= comparison');
assert(G.matchFillBlank('MonsterSpeed * vr', qC5.blanks[6].answers), 'c5 blank7 commutative MonsterSpeed*vr');

// 4. Handwritten code questions c6..c9 via evaluateSubjective
for (const [qid, code] of [['c6', altD2], ['c7', altD7], ['c8', altD8], ['c9', altD9]]) {
  const q = BANK.find(x => x.id === qid);
  const rep = G.evaluateSubjective(q, code);
  assert(rep.pass && rep.score === 10, `${qid} alt C# code -> ${rep.score}/10 PASS`);
}

console.log(`\nSummary: ${fails === 0 ? 'ALL TESTS PASSED!' : fails + ' FAILURES'}`);
process.exit(fails ? 1 : 0);
