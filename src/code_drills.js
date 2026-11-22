/* ==========================================================================
   C# Semantic Syntax Highlighter + 9 Hands-On Manual Coding Drills
   ========================================================================== */
(function(global) {
  'use strict';

  const CTRL_KW = new Set(['if', 'else', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'break', 'continue', 'default', 'return', 'yield', 'try', 'catch']);
  const DECL_KW = new Set(['using', 'namespace', 'public', 'private', 'protected', 'internal', 'static', 'readonly', 'const', 'class', 'struct', 'interface', 'enum', 'void', 'abstract', 'virtual', 'override', 'new', 'this', 'base', 'in', 'out', 'ref', 'var', 'true', 'false', 'null', 'int', 'float', 'double', 'bool', 'string', 'char', 'byte']);
  const UNITY_TYPES = new Set([
    'Vector2', 'Vector3', 'Vector2Int', 'MonoBehaviour', 'Transform', 'Rigidbody', 'Collider', 'Collision',
    'GameObject', 'Mathf', 'Time', 'Input', 'Random', 'Debug', 'KeyCode', 'Color', 'Quaternion', 'Resources',
    'IEnumerator', 'WaitForSeconds', 'ArrayList', 'List', 'Queue', 'Stack', 'PriorityQueue', 'HashSet',
    'MapNode', 'ControlData', 'InstructionData', 'InstructionType', 'RoleState', 'IState', 'State',
    'Context', 'Monster', 'Patrol', 'RunAway', 'Attack', 'PatrolState', 'ChaseState', 'BTNode', 'BTStatus',
    'Boid', 'TileMap', 'Canvas', 'EnemyState', 'StateType'
  ]);

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Single-pass lexical tokenizer so strings/comments NEVER interfere with keywords!
  const TOKEN_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|\$?"(?:\\.|[^"\\])*"|\[___[^\]\n]+___\]|\b\d+(?:\.\d+)?[fFdDmM]?\b|\b[A-Za-z_][A-Za-z0-9_]*\b(?=\s*\()|\b[A-Za-z_][A-Za-z0-9_]*\b)/g;

  function highlightCSharp(rawCode) {
    const src = String(rawCode || '');
    let out = '';
    let last = 0;
    TOKEN_RE.lastIndex = 0;
    let m;
    while ((m = TOKEN_RE.exec(src)) !== null) {
      if (m.index > last) out += escHtml(src.slice(last, m.index));
      const tok = m[0];
      last = m.index + tok.length;
      if (tok.startsWith('//') || tok.startsWith('/*')) {
        out += `<span class="tok-cm">${escHtml(tok)}</span>`;
      } else if (tok.startsWith('"') || tok.startsWith('$"')) {
        out += `<span class="tok-str">${escHtml(tok)}</span>`;
      } else if (tok.startsWith('[___')) {
        out += `<span class="tok-blank">${escHtml(tok)}</span>`;
      } else if (/^\d/.test(tok)) {
        out += `<span class="tok-num">${escHtml(tok)}</span>`;
      } else if (CTRL_KW.has(tok)) {
        out += `<span class="tok-ctrl">${escHtml(tok)}</span>`;
      } else if (DECL_KW.has(tok)) {
        out += `<span class="tok-kw">${escHtml(tok)}</span>`;
      } else if (UNITY_TYPES.has(tok)) {
        out += `<span class="tok-type">${escHtml(tok)}</span>`;
      } else if (src[last] === '(' || /^\s*\(/.test(src.slice(last, last + 6))) {
        out += `<span class="tok-fn">${escHtml(tok)}</span>`;
      } else {
        out += escHtml(tok);
      }
    }
    if (last < src.length) out += escHtml(src.slice(last));
    // Trailing newline keeps layered textarea height aligned 1:1
    if (src.endsWith('\n')) out += ' ';
    return out;
  }

  function normCode(s) {
    return String(s || '').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
  }

  /* ==================== 9 Hands-On Manual C# Coding Drills ==================== */
  const CODE_DRILLS = [
    {
      id: 'd1', module: 'm1', topic: 't_mechanics', file: 'BasketballCollision.cs',
      title: '实战 1：篮球运动更新与四种碰撞反射（实验核心）',
      difficulty: '必考基础',
      desc: '补全 Update() 中的速度/位置更新公式，以及 HandleCollision() 中右竖直墙、上水平天花板、篮筐点、斜面三脚架（单位法向量 N）的碰撞反射语句。',
      hint: '速度更新 velocity += acceleration * dt；竖直墙反转 x，水平板反转 y，撞篮筐点整向量取反；斜面用 velocity = 2 * N * (-Vector2.Dot(velocity, N)) + velocity。',
      starter: `void Update() {
    float dt = Time.deltaTime;
    if (isShoot) {
        Vector2 ballpos = ball.anchoredPosition;
        // TODO 1 (提示): 匀加速公式 v = v + a * dt，利用当前 velocity 与 acceleration
        velocity = ;
        // TODO 2 (提示): 位置更新 公式为 原位置 ballpos + 本帧速度 velocity * 帧间时间 dt
        ball.anchoredPosition = ;
        HandleCollision();
    }
}

void HandleCollision() {
    if (hitRightWall) {
        // TODO 3 (提示): 右竖直墙法线在 X 轴方向，反射时仅对 velocity.x 取反，y 不变
        
    }
    if (hitCeiling) {
        // TODO 4 (提示): 上水平板法线在 Y 轴方向，反射时仅对 velocity.y 取反，x 不变
        
    }
    if (hitHoopPoint) {
        // TODO 5 (提示): 撞击篮筐点需沿来向原路反弹，将 velocity 整个向量取反
        
    }
    if (hitSlope) {
        // TODO 6 (提示): 已知斜面单位法向量 N，代点积公式 2 * N * (-Vector2.Dot(velocity, N)) + velocity
        
    }
}`,
      solution: `void Update() {
    float dt = Time.deltaTime;
    if (isShoot) {
        Vector2 ballpos = ball.anchoredPosition;
        velocity = velocity + acceleration * dt;
        ball.anchoredPosition = ballpos + velocity * dt;
        HandleCollision();
    }
}

void HandleCollision() {
    if (hitRightWall) {
        velocity.x = -velocity.x;
    }
    if (hitCeiling) {
        velocity.y = -velocity.y;
    }
    if (hitHoopPoint) {
        velocity = -velocity;
    }
    if (hitSlope) {
        velocity = 2 * N * (-Vector2.Dot(velocity, N)) + velocity;
    }
}`,
      checks: [
        { label: '速度更新：velocity + acceleration * dt (或 +=)', test: c => /velocity(\+=|=velocity\+)acceleration\*dt/.test(c) },
        { label: '位置更新：ballpos + velocity * dt', test: c => /anchoredPosition=(ballpos|ball\.anchoredPosition)\+velocity\*dt/.test(c) },
        { label: '竖直墙反射：velocity.x = -velocity.x', test: c => /velocity\.x=-velocity\.x/.test(c) },
        { label: '水平板反射：velocity.y = -velocity.y', test: c => /velocity\.y=-velocity\.y/.test(c) },
        { label: '篮筐点反弹：velocity = -velocity', test: c => /velocity=-velocity[;}]/.test(c) },
        { label: '斜面公式：Vector2.Dot 反射或 Vector2.Reflect', test: c => /(Vector2\.Dot\((velocity,N|N,velocity)\)|Vector2\.Reflect\(velocity,N\))/.test(c) }
      ],
      anim: { engine: 'physics', mode: 'reflect', params: { slopeAngle: 37, vi: [8, -10] } }
    },
    {
      id: 'd2', module: 'm2', topic: 't_intercept', file: 'SpaceInterception.cs',
      title: '实战 2：拦截算法核心代码手写（6 步向量预判）',
      difficulty: '高频编码',
      desc: '已知 prey.position、preyVelocity、predator.position、predatorVelocity、maxSpeed，请手写拦截时间 tc、拦截点 interceptPoint、限幅期望速度及本帧位移更新。',
      hint: 'relativeVelocity = preyVelocity - predatorVelocity；relativeDistance = prey.position - predator.position；tc = dist.magnitude / vel.magnitude；St = prey.position + preyVelocity * tc；ClampMagnitude 限幅。',
      starter: `void UpdateIntercept() {
    // TODO 1 (提示): “相对目标=目标-自身”：relativeVelocity = preyVelocity - predatorVelocity，位置同理
    Vector3 relativeVelocity = ;
    Vector3 relativeDistance = ;

    // TODO 2 (提示): 拦截时间 tc = 距离模长(.magnitude) / 相对速度模长(.magnitude)
    float interceptTime = ;

    // TODO 3 (提示): 预测目标未来相遇点 = prey.position + 目标速度 * interceptTime
    Vector3 interceptPoint = ;

    // TODO 4 (提示): 期望速度 (interceptPoint - predator.position) / interceptTime，并用 Vector3.ClampMagnitude 限幅至 maxSpeed
    Vector3 desiredVelocity = ;
    Vector3 newVelocity = ;

    // TODO 5 (提示): 帧率无关更新 transform.position += newVelocity * Time.deltaTime
    
}`,
      solution: `void UpdateIntercept() {
    Vector3 relativeVelocity = preyVelocity - predatorVelocity;
    Vector3 relativeDistance = prey.position - predator.position;
    float interceptTime = relativeDistance.magnitude / relativeVelocity.magnitude;
    Vector3 interceptPoint = prey.position + preyVelocity * interceptTime;
    Vector3 desiredVelocity = (interceptPoint - predator.position) / interceptTime;
    Vector3 newVelocity = Vector3.ClampMagnitude(desiredVelocity, maxSpeed);
    transform.position += newVelocity * Time.deltaTime;
}`,
      checks: [
        { label: '相对速度 preyVelocity - predatorVelocity', test: c => /preyVelocity-predatorVelocity/.test(c) },
        { label: '相对距离 prey.position - predator.position', test: c => /prey\.position-predator\.position/.test(c) },
        { label: '拦截时间 .magnitude / .magnitude', test: c => /\.magnitude\/.*\.magnitude/.test(c) },
        { label: '拦截点 prey.position + preyVelocity * interceptTime', test: c => /prey\.position\+preyVelocity\*interceptTime/.test(c) },
        { label: '期望速度与 ClampMagnitude 限幅', test: c => /ClampMagnitude\(.*,maxSpeed\)/.test(c) },
        { label: '帧率无关位移更新 Time.deltaTime', test: c => /position\+=.*Time\.deltaTime/.test(c) }
      ],
      anim: { engine: 'steering', mode: 'intercept' }
    },
    {
      id: 'd3', module: 'm2', topic: 't_pattern', file: 'DoPattern.cs',
      title: '实战 3：矩形模式移动 DoPattern（真题 7 空手写）',
      difficulty: '真题必考',
      desc: '手动编写控制指令法 DoPattern：实现角度 0~360° 归一化与负数修正、角度转方向向量 (Cos, Sin)、位移累加、达标后循环切换 curIndex 并重置 stepDistance。',
      hint: 'monsterAngle = monsterAngle % 360; if (monsterAngle < 0) monsterAngle += 360; v = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)); curIndex %= patternArray.Count; stepDistance = 0;',
      starter: `void DoPattern(ArrayList patternArray, float dt) {
    ControlData data = (ControlData)patternArray[curIndex];
    monsterAngle += data.fLeftAngle - data.fRightAngle;
    // TODO 1 (提示): 先用 % 360 限制在一圈内；若 < 0（负角度取模在C#仍为负）则 += 360 转正
    monsterAngle = ;
    if (monsterAngle < 0) {
        
    }
    float angle = monsterAngle * Mathf.Deg2Rad;
    // TODO 2 (提示): 极坐标转二维方向向量 new Vector2(Mathf.Cos(angle), Mathf.Sin(angle))
    Vector2 v = ;
    Vector2 pos = monster.anchoredPosition;
    Vector2 displacement = v * MonsterSpeed * dt;
    stepDistance += displacement.magnitude;
    // TODO 3 (提示): 将本帧位移 displacement 加到原坐标 pos 上
    pos = ;
    if (stepDistance >= data.fForwardDis - data.fBackwardDis) {
        ++curIndex;
        // TODO 4 (提示): curIndex 对 patternArray.Count 取模（%=）实现循环，并重置 stepDistance 为 0
        
        stepDistance = ;
    }
    // TODO 5 (提示): 最终把更新好的坐标写回 UI 属性 monster.anchoredPosition = pos;
    
}`,
      solution: `void DoPattern(ArrayList patternArray, float dt) {
    ControlData data = (ControlData)patternArray[curIndex];
    monsterAngle += data.fLeftAngle - data.fRightAngle;
    monsterAngle = monsterAngle % 360;
    if (monsterAngle < 0) {
        monsterAngle += 360;
    }
    float angle = monsterAngle * Mathf.Deg2Rad;
    Vector2 v = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
    Vector2 pos = monster.anchoredPosition;
    Vector2 displacement = v * MonsterSpeed * dt;
    stepDistance += displacement.magnitude;
    pos = pos + displacement;
    if (stepDistance >= data.fForwardDis - data.fBackwardDis) {
        ++curIndex;
        curIndex %= patternArray.Count;
        stepDistance = 0;
    }
    monster.anchoredPosition = pos;
}`,
      checks: [
        { label: '角度取模 % 360', test: c => /monsterAngle(%360|%=360)/.test(c) },
        { label: '负角度修正 += 360', test: c => /monsterAngle(\+=360|=monsterAngle\+360)/.test(c) },
        { label: '方向向量 new Vector2(Mathf.Cos(angle), Mathf.Sin(angle))', test: c => /newVector2\(Mathf\.Cos\(angle\),Mathf\.Sin\(angle\)\)/.test(c) },
        { label: '新位置 pos + displacement', test: c => /pos(\+=|=pos\+)displacement/.test(c) },
        { label: '索引取模 curIndex %= patternArray.Count', test: c => /curIndex(%=patternArray\.Count|=curIndex%patternArray\.Count)/.test(c) },
        { label: '重置步长 0 并赋值 anchoredPosition = pos', test: c => /stepDistance=0/.test(c) && /monster\.anchoredPosition=pos/.test(c) }
      ],
      anim: { engine: 'pattern', mode: 'rect' }
    },
    {
      id: 'd4', module: 'm3', topic: 't_follow_wall', file: 'doWallTracing.cs',
      title: '实战 4：八方向右手优先沿墙走 doWallTracing',
      difficulty: '真题重考',
      desc: '补全八方向右手优先沿墙走循环：从右手方向 curDirection + 2 开始逆时针试探 8 个方向，保证 walkDir 在 0~7 之间，判断可通行并设置像素目标 target。',
      hint: 'for (int i = curDirection + 2; i > curDirection - 6; --i)，walkDir = (i + 8) % 8，if (map.canPassWithRowCol(pt))，target = map.toXY(pt)。',
      starter: `void doWallTracing(float dt) {
    Vector2 curPos = map.toColRow(sprite.anchoredPosition + Canvas.offset);
    // TODO 1 (提示): 0~7 顺时针编码下，右手方向为当前方向顺时针转 90° 即 curDirection + 2，随后 --i 逆时针扫 8 个方向
    for (int i = ; i > curDirection - 6; --i) {
        // TODO 2 (提示): 避坑负数取模！C# 中 -1 % 8 = -1，必须写成 (i + 8) % 8 才稳落在 0~7
        int walkDir = ;
        Vector2 pt = curPos + dirs[walkDir];
        // TODO 3 (提示): 条件用 map.canPassWithRowCol(pt) 判无障碍，进入后用 target = map.toXY(pt) 转回像素中心
        if () {
            target = ;
            monsterState = RoleState.Chasing;
            curDirection = walkDir;
            break;
        }
    }
}`,
      solution: `void doWallTracing(float dt) {
    Vector2 curPos = map.toColRow(sprite.anchoredPosition + Canvas.offset);
    for (int i = curDirection + 2; i > curDirection - 6; --i) {
        int walkDir = (i + 8) % 8;
        Vector2 pt = curPos + dirs[walkDir];
        if (map.canPassWithRowCol(pt)) {
            target = map.toXY(pt);
            monsterState = RoleState.Chasing;
            curDirection = walkDir;
            break;
        }
    }
}`,
      checks: [
        { label: '右手起始方向 curDirection + 2', test: c => /i=curDirection\+2/.test(c) },
        { label: '方向取模归一化 (i + 8) % 8', test: c => /\(i\+8\)%8/.test(c) },
        { label: '可通行检测 map.canPassWithRowCol(pt)', test: c => /map\.canPassWithRowCol\(pt\)/.test(c) },
        { label: '转像素目标 map.toXY(pt)', test: c => /target=map\.toXY\(pt\)/.test(c) }
      ],
      anim: { engine: 'basic_path', mode: 'wall', params: { hand: 'right' } }
    },
    {
      id: 'd5', module: 'm3', topic: 't_follow_wall', file: 'doPathFollowing.cs',
      title: '实战 5：沿路径走算法 8 邻域权重调整与选优',
      difficulty: '实验核心',
      desc: '已按当前方向初始化 weight[0..7]（10,9,8,7,6,7,8,9）。请编写：1) 遍历 8 方向，障碍物 weight[i] -= 10；2) 找最大权重并更新 curDirection；3) 算像素目标 target。',
      hint: '第一个 for 检查 !map.canPassWithRowCol(pnt) 则 weight[i] -= 10；第二个 for 判断 weight[i] > maxWeight 更新 maxWeight 与 curDirection；最后 target = map.toXY(curPos + dirs[curDirection])。',
      starter: `// 已知 weight[0..7] 已按当前方向夹角初始化，maxWeight = 0
Vector2 curPos = map.toColRow(sprite.anchoredPosition + Canvas.offset);

// TODO 1 (提示): 算出第 i 个邻格 pnt = curPos + dirs[i]；若 !map.canPassWithRowCol(pnt)，则惩罚 weight[i] -= 10
for (int i = 0; i < 8; ++i) {
    
}

// TODO 2 (提示): 比较 weight[i] > maxWeight，若更大则同步更新 maxWeight = weight[i] 与 curDirection = i
for (int i = 0; i < 8; ++i) {
    
}

// TODO 3 (提示): 算出最佳格 pt = curPos + dirs[curDirection]，再用 map.toXY(pt) 赋给 target
`,
      solution: `Vector2 curPos = map.toColRow(sprite.anchoredPosition + Canvas.offset);

for (int i = 0; i < 8; ++i) {
    Vector2 pnt = curPos + dirs[i];
    if (!map.canPassWithRowCol(pnt)) {
        weight[i] -= 10;
    }
}

for (int i = 0; i < 8; ++i) {
    if (weight[i] > maxWeight) {
        maxWeight = weight[i];
        curDirection = i;
    }
}

Vector2 pt = curPos + dirs[curDirection];
target = map.toXY(pt);`,
      checks: [
        { label: '计算邻格偏移 curPos + dirs[i]', test: c => /curPos\+dirs\[i\]/.test(c) },
        { label: '障碍判断 !map.canPassWithRowCol(...)', test: c => /!map\.canPassWithRowCol\(/.test(c) },
        { label: '障碍惩罚 weight[i] -= 10', test: c => /weight\[i\](-=10|=weight\[i\]-10)/.test(c) },
        { label: '更新最大权重与 curDirection', test: c => /weight\[i\]>maxWeight/.test(c) && /curDirection=i/.test(c) },
        { label: '转换最终目标 map.toXY(...)', test: c => /target=map\.toXY\(/.test(c) }
      ],
      anim: { engine: 'basic_path', mode: 'pathfollow' }
    },
    {
      id: 'd6', module: 'm3', topic: 't_avoid', file: 'DoRandomPathFinding.cs',
      title: '实战 6：随机移动避障 RandomMoving 分支手写',
      difficulty: '真题原题',
      desc: '补全随机移动状态下检测 pos 可通行后的逻辑：移动位置、累加位移、走完步长后恢复 Tracing 状态并重算指向玩家的单位速度；若不可通行则清零需行走步长。',
      hint: 'TileMap.canPass(pos) → anchoredPosition = pos → monsterMovedDis += displacement.magnitude → >= monsterNeedMoveDis → state = Tracing, vr = player - monster, vr.Normalize(), vel = vr * MonsterSpeed; else monsterNeedMoveDis = 0;',
      starter: `Vector2 pos = monster.anchoredPosition + displacement;
// TODO 1 (提示): 用 tileMap.canPass(pos)（或 TileMap.canPass(pos)）检测试探坐标，能走则移到 pos 并累加 displacement.magnitude
if () {
    monster.anchoredPosition = ;
    monsterMovedDis = ;
    // TODO 2 (提示): 当已走距离 monsterMovedDis >= monsterNeedMoveDis，切回 RoleState.Tracing
    if () {
        monsterState = ;
        monsterMovedDis = 0;
        monsterNeedMoveDis = 0;
        // TODO 3 (提示): 方向口诀“目标减自身”：player.anchoredPosition - monster.anchoredPosition，归一化后乘 MonsterSpeed
        Vector2 vr = ;
        vr.Normalize();
        monsterVelocity = ;
    }
} else {
    // TODO 4 (提示): 碰壁清零需行走距离 monsterNeedMoveDis = 0，触发下一帧重新选随机方向
    
}`,
      solution: `Vector2 pos = monster.anchoredPosition + displacement;
if (tileMap.canPass(pos)) {
    monster.anchoredPosition = pos;
    monsterMovedDis = monsterMovedDis + displacement.magnitude;
    if (monsterMovedDis >= monsterNeedMoveDis) {
        monsterState = RoleState.Tracing;
        monsterMovedDis = 0;
        monsterNeedMoveDis = 0;
        Vector2 vr = player.anchoredPosition - monster.anchoredPosition;
        vr.Normalize();
        monsterVelocity = vr * MonsterSpeed;
    }
} else {
    monsterNeedMoveDis = 0;
}`,
      checks: [
        { label: '可通行检测 canPass(pos)', test: c => /canPass\(pos\)/.test(c) },
        { label: '更新位置并累加位移 magnitude', test: c => /anchoredPosition=pos/.test(c) && /displacement\.magnitude/.test(c) },
        { label: '判断步长达成 >= monsterNeedMoveDis', test: c => /monsterMovedDis>=monsterNeedMoveDis/.test(c) },
        { label: '切换回 Tracing 状态', test: c => /Tracing/.test(c) },
        { label: '指向玩家向量 player - monster 与速度', test: c => /player\.anchoredPosition-monster\.anchoredPosition/.test(c) && /vr\*MonsterSpeed/.test(c) },
        { label: '遇障重置 monsterNeedMoveDis = 0', test: c => /else\{monsterNeedMoveDis=0;?\}/.test(c) }
      ],
      anim: { engine: 'basic_path', mode: 'random' }
    },
    {
      id: 'd7', module: 'm4', topic: 't_dfs_bfs', file: 'DFSAndBacktrack.cs',
      title: '实战 7：DFS 递归寻路 + 父节点回溯反转路径',
      difficulty: '高频压轴',
      desc: '手写递归深度优先搜索 doDFSRecursionSearch(MapNode from, MapNode to) 与终点倒推路径 generatePath(MapNode targetNode)。',
      hint: 'from.visited = true; if (from == to) return true; 8方向循环设 next.parent = from 并递归；generatePath 沿 while (node.parent != null) 加入列表最后 path.Reverse()！',
      starter: `bool doDFSRecursionSearch(MapNode from, MapNode to) {
    // TODO 1 (提示): 先置 from.visited = true 防死循环；若抵达终点 (from == to) 直接 return true
    
    for (int i = 0; i < 8; ++i) {
        Vector2Int nextPos = from.pos + dirs[i];
        if (map.canPassWithRowCol(nextPos)) {
            MapNode next = map.getNode(nextPos);
            // TODO 2 (提示): 当 !next.visited 时：记录 next.parent = from，递归调用 if (doDFSRecursionSearch(next, to)) return true;
            if () {
                
            }
        }
    }
    return false;
}

ArrayList generatePath(MapNode targetNode) {
    ArrayList path = new ArrayList();
    MapNode node = targetNode;
    path.Add(node);
    // TODO 3 (提示): 用 while (node.parent != null) 将 node.parent 加入 path 并 node = node.parent；循环后别忘 path.Reverse() 反转！
    
    return path;
}`,
      solution: `bool doDFSRecursionSearch(MapNode from, MapNode to) {
    from.visited = true;
    if (from == to) return true;
    for (int i = 0; i < 8; ++i) {
        Vector2Int nextPos = from.pos + dirs[i];
        if (map.canPassWithRowCol(nextPos)) {
            MapNode next = map.getNode(nextPos);
            if (!next.visited) {
                next.parent = from;
                if (doDFSRecursionSearch(next, to)) return true;
            }
        }
    }
    return false;
}

ArrayList generatePath(MapNode targetNode) {
    ArrayList path = new ArrayList();
    MapNode node = targetNode;
    path.Add(node);
    while (node.parent != null) {
        path.Add(node.parent);
        node = node.parent;
    }
    path.Reverse();
    return path;
}`,
      checks: [
        { label: '标记 from.visited = true 与终点判停 from == to', test: c => /from\.visited=true/.test(c) && /from==to/.test(c) },
        { label: '判断未访问 !next.visited 并记录 next.parent = from', test: c => /!next\.visited/.test(c) && /next\.parent=from/.test(c) },
        { label: '递归调用 doDFSRecursionSearch(next, to)', test: c => /doDFSRecursionSearch\(next,to\)/.test(c) },
        { label: '沿 while (node.parent != null) 倒推并 path.Reverse()', test: c => /while\(node\.parent!=null\)/.test(c) && /path\.Reverse\(\)/.test(c) }
      ],
      anim: { engine: 'graph_search', mode: 'dfs' }
    },
    {
      id: 'd8', module: 'm4', topic: 't_dfs_bfs', file: 'BFSQueueSearch.cs',
      title: '实战 8：BFS 广度优先搜索（队列 FIFO 最短路）',
      difficulty: '高频压轴',
      desc: '使用 C# Queue<MapNode> 手写 BFS 网格寻路，保证在无权图中首次到达 target 时生成边数最少的最短路径。',
      hint: '创建 Queue<MapNode>；start.visited = true; queue.Enqueue(start); while (queue.Count > 0) 出队 Dequeue()，遍历 8 邻接点标已访、记 parent、判终点或入队。',
      starter: `bool doBFSSearch(MapNode start, MapNode target) {
    if (start == target) return true;
    // TODO 1 (提示): new Queue<MapNode>() 创建队列；切记先标 start.visited = true 再 queue.Enqueue(start)（防重复入队）
    Queue<MapNode> queue = ;
    
    // TODO 2 (提示): 队列非空循环 while (queue.Count > 0)，队头出队 MapNode cur = queue.Dequeue()
    while () {
        MapNode cur = ;
        for (int i = 0; i < 8; ++i) {
            Vector2Int nextPos = cur.pos + dirs[i];
            if (!map.canPassWithRowCol(nextPos)) continue;
            MapNode next = map.getNode(nextPos);
            // TODO 3 (提示): 当 !next.visited 时：设 visited=true 与 next.parent=cur；若 next==target 生成路径返回 true，否则 Enqueue(next)
            if () {
                
            }
        }
    }
    return false;
}`,
      solution: `bool doBFSSearch(MapNode start, MapNode target) {
    if (start == target) return true;
    Queue<MapNode> queue = new Queue<MapNode>();
    start.visited = true;
    queue.Enqueue(start);
    while (queue.Count > 0) {
        MapNode cur = queue.Dequeue();
        for (int i = 0; i < 8; ++i) {
            Vector2Int nextPos = cur.pos + dirs[i];
            if (!map.canPassWithRowCol(nextPos)) continue;
            MapNode next = map.getNode(nextPos);
            if (!next.visited) {
                next.visited = true;
                next.parent = cur;
                if (next == target) {
                    path = generatePath(target);
                    return true;
                }
                queue.Enqueue(next);
            }
        }
    }
    return false;
}`,
      checks: [
        { label: '实例化 Queue<MapNode> 并将 start 标已访入队', test: c => /newQueue<MapNode>\(\)/.test(c) && /start\.visited=true/.test(c) && /Enqueue\(start\)/.test(c) },
        { label: '循环 queue.Count > 0 并执行 queue.Dequeue()', test: c => /queue\.Count>0/.test(c) && /queue\.Dequeue\(\)/.test(c) },
        { label: '邻接点判 !next.visited、设已访与 parent = cur', test: c => /!next\.visited/.test(c) && /next\.visited=true/.test(c) && /next\.parent=cur/.test(c) },
        { label: '判终点 next == target 并将未达节点 Enqueue(next)', test: c => /next==target/.test(c) && /Enqueue\(next\)/.test(c) }
      ],
      anim: { engine: 'graph_search', mode: 'bfs' }
    },
    {
      id: 'd9', module: 'm5', topic: 't_fsm_pattern', file: 'StatePatternFSM.cs',
      title: '实战 9：有限状态机 — 标准状态设计模式手写',
      difficulty: '大题必练',
      desc: '编写标准状态模式三要素：IState 接口（Enter/Execute/Exit）、Monster 上下文类的 ChangeState（旧退出 → 切换 → 新进入）以及 RunAway 具体状态类。',
      hint: 'ChangeState 严格按三步：_currentState?.Exit(this); _currentState = newState; _currentState.Enter(this); RunAway.Execute 判断 IsSafe() 切 new Patrol() 否则 LeaveEnemy()。',
      starter: `// TODO 1 (提示): 在 IState 中声明 Enter(Monster m)、Execute(Monster m)、Exit(Monster m) 三个无返回值方法
public interface IState {
    
}

public class Monster {
    private IState _currentState;
    public void Update() { _currentState?.Execute(this); }

    // TODO 2 (提示): 严格按顺序编写三步：① _currentState?.Exit(this); ② _currentState = newState; ③ _currentState.Enter(this);
    public void ChangeState(IState newState) {
        
    }
}

// TODO 3 (提示): Execute 中用 if (m.IsSafe()) m.ChangeState(new Patrol()); 否则执行 else m.LeaveEnemy();
public class RunAway : IState {
    public void Enter(Monster m) { }
    public void Execute(Monster m) {
        
    }
    public void Exit(Monster m) { }
}`,
      solution: `public interface IState {
    void Enter(Monster m);
    void Execute(Monster m);
    void Exit(Monster m);
}

public class Monster {
    private IState _currentState;
    public void Update() { _currentState?.Execute(this); }

    public void ChangeState(IState newState) {
        _currentState?.Exit(this);
        _currentState = newState;
        _currentState.Enter(this);
    }
}

public class RunAway : IState {
    public void Enter(Monster m) { }
    public void Execute(Monster m) {
        if (m.IsSafe()) m.ChangeState(new Patrol());
        else m.LeaveEnemy();
    }
    public void Exit(Monster m) { }
}`,
      checks: [
        { label: 'IState 声明 Enter / Execute / Exit 三方法', test: c => /voidEnter\(Monster/.test(c) && /voidExecute\(Monster/.test(c) && /voidExit\(Monster/.test(c) },
        { label: 'ChangeState 严格调用 Exit → 赋值 → Enter', test: c => /Exit\(this\);_currentState=newState;_currentState\.Enter\(this\)/.test(c) },
        { label: 'RunAway.Execute 判 IsSafe() 切 Patrol 或 LeaveEnemy()', test: c => /IsSafe\(\)/.test(c) && /ChangeState\(newPatrol\(\)\)/.test(c) && /LeaveEnemy\(\)/.test(c) }
      ],
      anim: { engine: 'fsm', mode: 'guard' }
    }
  ];

  global.highlightCSharp = highlightCSharp;
  global.normCSharpCode = normCode;
  global.CODE_DRILLS = CODE_DRILLS;
})(window);
