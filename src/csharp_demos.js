/* ==========================================================================
   Runnable Unity C# Code Demos (Live Parameter Parser + Console + Visual Sim)
   ========================================================================== */
window.CSHARP_DEMOS = {
  reflect_wall: {
    file: 'BasketballCollision.cs',
    title: '篮球碰撞反射（水平 / 竖直 / 非轴平行斜面）',
    code: `using UnityEngine;

public class BasketballCollision : MonoBehaviour {
    public Vector2 velocity = new Vector2(6f, 4f);
    public float slopeAngle = 0f; // 0=水平边栏, 90=竖直墙, 37=斜面三脚架

    void HandleCollision() {
        if (slopeAngle == 0f) {
            velocity.y = -velocity.y;          // 撞水平边栏：y 分量取反
        } else if (slopeAngle == 90f) {
            velocity.x = -velocity.x;          // 撞竖直墙面：x 分量取反
        } else {
            // 非轴平行斜面：先求单位法向量 N，再算 vf = vi + 2(-vi·N)N
            float rad = slopeAngle * Mathf.Deg2Rad;
            Vector2 N = new Vector2(-Mathf.Sin(rad), Mathf.Cos(rad)).normalized;
            float dot = Vector2.Dot(velocity, N);
            velocity = velocity + 2f * (-dot) * N;
        }
        Debug.Log("反射后速度 vf = " + velocity);
    }
}`,
    run(code) {
      const mV = code.match(/new\s+Vector2\s*\(\s*([-+]?\d*\.?\d+)f?\s*,\s*([-+]?\d*\.?\d+)f?\s*\)/);
      const mA = code.match(/slopeAngle\s*=\s*([-+]?\d*\.?\d+)f?/);
      const vx = mV ? parseFloat(mV[1]) : 6, vy = mV ? parseFloat(mV[2]) : 4;
      const ang = mA ? parseFloat(mA[1]) : 0;
      let rvx = vx, rvy = vy, kind = '斜面';
      if (Math.abs(ang) < 0.5) { rvy = -vy; kind = '水平边栏 (y反向)'; }
      else if (Math.abs(ang - 90) < 0.5) { rvx = -vx; kind = '竖直墙面 (x反向)'; }
      else {
        const rad = ang * Math.PI / 180;
        let nx = -Math.sin(rad), ny = Math.cos(rad);
        let dot = vx * nx + vy * ny;
        if (dot > 0) { nx = -nx; ny = -ny; dot = -dot; }
        rvx = vx + 2 * (-dot) * nx; rvy = vy + 2 * (-dot) * ny;
      }
      return {
        logs: [
          { t: 'info', msg: `[Unity] 启动 BasketballCollision.HandleCollision() — 碰撞面: ${kind}` },
          { t: 'ok', msg: `入射速度 vi = (${vx.toFixed(2)}, ${vy.toFixed(2)})` },
          { t: 'warn', msg: `计算完成 → 反射速度 vf = (${rvx.toFixed(2)}, ${rvy.toFixed(2)})` },
          { t: 'info', msg: `提示：尝试修改上方 velocity 或 slopeAngle (0 / 90 / 37) 后再次点击运行！` }
        ],
        anim: { engine: 'physics', mode: 'reflect', params: { slopeAngle: ang, vi: [vx, vy] } }
      };
    }
  },
  kinematics_parabola: {
    file: 'ProjectileMotion.cs',
    title: '抛物运动独立性分解与位移更新',
    code: `using UnityEngine;

public class ProjectileMotion : MonoBehaviour {
    public float v0 = 20f;       // 初速度 (m/s)
    public float angleDeg = 30f; // 发射仰角 (度)
    public float g = 10f;        // 重力加速度 (m/s^2)

    void Start() {
        float rad = angleDeg * Mathf.Deg2Rad;
        float vx = v0 * Mathf.Cos(rad);      // 水平匀速分量
        float vy = v0 * Mathf.Sin(rad);      // 竖直初速度分量
        float flightTime = (2f * vy) / g;    // 落地总飞行时间
        float rangeX = vx * flightTime;      // 水平射程 x = vx * t
        Debug.Log($"vx={vx:F2}, vy={vy:F2}, T={flightTime:F2}s, 射程={rangeX:F2}m");
    }
}`,
    run(code) {
      const v0 = parseFloat((code.match(/v0\s*=\s*([-+]?\d*\.?\d+)/) || [0, 20])[1]);
      const deg = parseFloat((code.match(/angleDeg\s*=\s*([-+]?\d*\.?\d+)/) || [0, 30])[1]);
      const g = parseFloat((code.match(/\bg\s*=\s*([-+]?\d*\.?\d+)/) || [0, 10])[1]);
      const rad = deg * Math.PI / 180;
      const vx = v0 * Math.cos(rad), vy = v0 * Math.sin(rad);
      const T = (2 * vy) / Math.max(0.1, g);
      const maxH = (vy * vy) / (2 * Math.max(0.1, g));
      return {
        logs: [
          { t: 'info', msg: `[Unity] ProjectileMotion.Start() 运行中...` },
          { t: 'ok', msg: `水平分量 vx = ${v0}*cos(${deg}°) = ${vx.toFixed(2)} m/s (匀速直线)` },
          { t: 'ok', msg: `竖直初速 vy = ${v0}*sin(${deg}°) = ${vy.toFixed(2)} m/s (匀减速 -g)` },
          { t: 'warn', msg: `飞行时间 T = ${T.toFixed(2)} s | 最大高度 H = ${maxH.toFixed(2)} m | 射程 X = ${(vx * T).toFixed(2)} m` }
        ],
        anim: { engine: 'physics', mode: 'parabola', params: { v0, deg } }
      };
    }
  },
  car_friction: {
    file: 'SmoothCarAccel.cs',
    title: '汽车平滑加速与摩擦力限速模型',
    code: `using UnityEngine;

public class SmoothCarAccel : MonoBehaviour {
    public float acceleration = 300f;   // 引擎加速度
    public float frictionFactor = 0.5f; // 阻力因子
    private float v = 0f;

    void Update() {
        float dt = Time.deltaTime;
        // 先按摩擦力衰减，再叠加引擎动力加速度
        v = v * (1f - frictionFactor * dt) + acceleration * dt;
        transform.position += transform.forward * v * dt;
    }
}`,
    run(code) {
      const a = parseFloat((code.match(/acceleration\s*=\s*([-+]?\d*\.?\d+)/) || [0, 300])[1]);
      const f = parseFloat((code.match(/frictionFactor\s*=\s*([-+]?\d*\.?\d+)/) || [0, 0.5])[1]);
      const vMax = f > 0.001 ? (a / f) : Infinity;
      return {
        logs: [
          { t: 'info', msg: `[Unity] SmoothCarAccel 模拟 6 秒加速过程 (dt = 0.016s)...` },
          { t: 'ok', msg: `t=1.0s: 有摩擦 v=${(vMax * (1 - Math.exp(-f * 1))).toFixed(1)} | 无摩擦 v=${(a * 1).toFixed(1)}` },
          { t: 'ok', msg: `t=3.0s: 有摩擦 v=${(vMax * (1 - Math.exp(-f * 3))).toFixed(1)} | 无摩擦 v=${(a * 3).toFixed(1)}` },
          { t: 'warn', msg: `收敛极速上限 v_max = a / μ = ${isFinite(vMax) ? vMax.toFixed(1) : '无限增长'}` }
        ],
        anim: { engine: 'physics', mode: 'friction' }
      };
    }
  },
  dot_work: {
    file: 'VectorDotAndWork.cs',
    title: '向量点积投影与斜推力做功计算',
    code: `using UnityEngine;

public class VectorDotAndWork : MonoBehaviour {
    public float pushForce = 1100f;  // 斜推力 (N)
    public float angleDeg = 60f;     // 推力倾角 (度)
    public float friction = 50f;     // 地面摩擦力 (N)
    public float distance = 5f;      // 推动距离 (m)

    void Start() {
        float fx = pushForce * Mathf.Cos(angleDeg * Mathf.Deg2Rad);
        float netForce = fx - friction;
        float work = netForce * distance;
        Debug.Log($"水平分力={fx}N, 合力={netForce}N, 外合力总功 W={work} J");
    }
}`,
    run(code) {
      const F = parseFloat((code.match(/pushForce\s*=\s*([-+]?\d*\.?\d+)/) || [0, 1100])[1]);
      const deg = parseFloat((code.match(/angleDeg\s*=\s*([-+]?\d*\.?\d+)/) || [0, 60])[1]);
      const f = parseFloat((code.match(/friction\s*=\s*([-+]?\d*\.?\d+)/) || [0, 50])[1]);
      const s = parseFloat((code.match(/distance\s*=\s*([-+]?\d*\.?\d+)/) || [0, 5])[1]);
      const fx = F * Math.cos(deg * Math.PI / 180);
      const net = fx - f, W = net * s;
      return {
        logs: [
          { t: 'info', msg: `[Unity] VectorDotAndWork.Start() 正交分解计算...` },
          { t: 'ok', msg: `水平推力分量 Fx = ${F} * cos(${deg}°) = ${fx.toFixed(1)} N` },
          { t: 'ok', msg: `水平合外力 F合 = ${fx.toFixed(1)} - ${f} = ${net.toFixed(1)} N` },
          { t: 'warn', msg: `所有外合力做功 W = F合 * s = ${W.toFixed(1)} 焦耳 (J)` }
        ],
        anim: { engine: 'physics', mode: 'work' }
      };
    }
  },
  steering_seek: {
    file: 'SteeringBehaviors.cs',
    title: '操控行为 Seek / Flee / Arrive 完整代码',
    code: `using UnityEngine;

public class SteeringBehaviors : MonoBehaviour {
    public float maxSpeed = 20f;
    public float slowingRadius = 100f;
    public Vector2 targetPos = new Vector2(100f, 200f);
    public Vector2 curPos = new Vector2(0f, 0f);
    public Vector2 curVel = new Vector2(0f, 0f);

    public Vector2 ComputeSeekForce() {
        Vector2 dir = (targetPos - curPos).normalized; // Flee 则为 (curPos - targetPos)
        Vector2 desiredVel = dir * maxSpeed;
        Vector2 steeringForce = desiredVel - curVel;   // 核心：操控力 = 期望速度 - 当前速度
        return steeringForce;
    }
}`,
    run(code) {
      const spd = parseFloat((code.match(/maxSpeed\s*=\s*([-+]?\d*\.?\d+)/) || [0, 20])[1]);
      const mT = code.match(/targetPos\s*=\s*new\s+Vector2\s*\(\s*([-+]?\d*\.?\d+)f?\s*,\s*([-+]?\d*\.?\d+)f?\s*\)/);
      const tx = mT ? parseFloat(mT[1]) : 100, ty = mT ? parseFloat(mT[2]) : 200;
      const len = Math.hypot(tx, ty) || 1;
      const ux = tx / len, uy = ty / len;
      return {
        logs: [
          { t: 'info', msg: `[Unity] SteeringBehaviors.ComputeSeekForce() 执行完毕` },
          { t: 'ok', msg: `1. 方向向量 dir = (${tx}, ${ty}), 归一化 = (${ux.toFixed(3)}, ${uy.toFixed(3)})` },
          { t: 'ok', msg: `2. 期望速度 desiredVel = (${(ux * spd).toFixed(2)}, ${(uy * spd).toFixed(2)})` },
          { t: 'warn', msg: `3. 操控力 steeringForce = desiredVel - curVel = (${(ux * spd).toFixed(2)}, ${(uy * spd).toFixed(2)})` }
        ],
        anim: { engine: 'steering', mode: 'seek' }
      };
    }
  },
  space_intercept: {
    file: 'SpaceInterception.cs',
    title: '太空拦截算法（6步向量预判 St）',
    code: `using UnityEngine;

public class SpaceInterception : MonoBehaviour {
    public Vector2 preyPos = new Vector2(80f, 220f);
    public Vector2 preyVel = new Vector2(6f, 5f);
    public Vector2 predPos = new Vector2(380f, 160f);
    public Vector2 predVel = new Vector2(0f, 0f);
    public float maxSpeed = 9f;

    void UpdateIntercept() {
        Vector2 Vr = preyVel - predVel;               // 1. 相对速度
        Vector2 Sr = preyPos - predPos;               // 2. 相对距离
        float tc = Sr.magnitude / Vr.magnitude;       // 3. 拦截时间 tc
        Vector2 St = preyPos + preyVel * tc;          // 4. 预测拦截点 St
        Vector2 desired = (St - predPos) / tc;        // 5. 期望速度
        Vector2 newVel = Vector2.ClampMagnitude(desired, maxSpeed);
        predPos += newVel * Time.deltaTime;
    }
}`,
    run(code) {
      const m1 = code.match(/preyPos\s*=\s*new\s+Vector2\s*\(\s*([-+]?\d*\.?\d+)f?\s*,\s*([-+]?\d*\.?\d+)f?/);
      const m2 = code.match(/preyVel\s*=\s*new\s+Vector2\s*\(\s*([-+]?\d*\.?\d+)f?\s*,\s*([-+]?\d*\.?\d+)f?/);
      const m3 = code.match(/predPos\s*=\s*new\s+Vector2\s*\(\s*([-+]?\d*\.?\d+)f?\s*,\s*([-+]?\d*\.?\d+)f?/);
      const px = m1 ? +m1[1] : 80, py = m1 ? +m1[2] : 220;
      const vx = m2 ? +m2[1] : 6, vy = m2 ? +m2[2] : 5;
      const mx = m3 ? +m3[1] : 380, my = m3 ? +m3[2] : 160;
      const vrMag = Math.hypot(vx, vy) || 1, srMag = Math.hypot(px - mx, py - my);
      const tc = srMag / vrMag;
      const stx = px + vx * tc, sty = py + vy * tc;
      return {
        logs: [
          { t: 'info', msg: `[Unity] SpaceInterception.UpdateIntercept() 实时测算：` },
          { t: 'ok', msg: `|Vr| = ${vrMag.toFixed(2)}, |Sr| = ${srMag.toFixed(2)} → 预测拦截时间 tc = ${tc.toFixed(2)}` },
          { t: 'warn', msg: `预测未来相遇拦截点 St = (${stx.toFixed(1)}, ${sty.toFixed(1)})` },
          { t: 'ok', msg: `期望速度 Vdesired = (${((stx - mx) / tc).toFixed(2)}, ${((sty - my) / tc).toFixed(2)})` }
        ],
        anim: { engine: 'steering', mode: 'intercept' }
      };
    }
  },
  pattern_move: {
    file: 'DoPatternController.cs',
    title: '控制指令法：矩形模式移动 DoPattern',
    code: `using UnityEngine;
using System.Collections;

public class DoPatternController : MonoBehaviour {
    public float MonsterSpeed = 120f;
    float monsterAngle = 0f, stepDistance = 0f;
    int curIndex = 0;

    void DoPattern(ArrayList patternArray, float dt) {
        ControlData data = (ControlData)patternArray[curIndex];
        monsterAngle = (monsterAngle + data.fLeftAngle - data.fRightAngle) % 360f;
        if (monsterAngle < 0f) monsterAngle += 360f;
        float rad = monsterAngle * Mathf.Deg2Rad;
        Vector2 v = new Vector2(Mathf.Cos(rad), Mathf.Sin(rad));
        Vector2 displacement = v * MonsterSpeed * dt;
        stepDistance += displacement.magnitude;
        Vector2 pos = monster.anchoredPosition + displacement;
        if (stepDistance >= data.fForwardDis - data.fBackwardDis) {
            curIndex = (curIndex + 1) % patternArray.Count;
            stepDistance = 0f;
        }
        monster.anchoredPosition = pos;
    }
}`,
    run() {
      return {
        logs: [
          { t: 'info', msg: `[Unity] 初始化矩形巡逻数组: 8 条 ControlData 指令` },
          { t: 'ok', msg: `指令[0]: 前进 180 → 角度 0° → v = (1.00, 0.00)` },
          { t: 'ok', msg: `指令[1]: 左转 90° → monsterAngle = 90° % 360 = 90°` },
          { t: 'warn', msg: `执行结束自动 curIndex = (curIndex + 1) % Count 形成闭合巡逻回路！` }
        ],
        anim: { engine: 'pattern', mode: 'rect' }
      };
    }
  },
  tilemap_coords: {
    file: 'TileMapConverter.cs',
    title: 'TileMap 二维网格与 64×64 像素双向换算',
    code: `using UnityEngine;

public class TileMapConverter {
    public const int TILE_SIZE = 64;
    public int pixelX = 128, pixelY = 192;

    // 像素坐标 -> 瓦片行列号
    public Vector2Int ToColRow(int x, int y) {
        return new Vector2Int(x / TILE_SIZE, y / TILE_SIZE); // (col, row)
    }
    // 瓦片行列号 -> 精灵像素中心坐标 (切记 +32!)
    public Vector2 ToXY(int col, int row) {
        return new Vector2(col * TILE_SIZE + 32, row * TILE_SIZE + 32);
    }
}`,
    run(code) {
      const px = parseInt((code.match(/pixelX\s*=\s*(\d+)/) || [0, 128])[1], 10);
      const py = parseInt((code.match(/pixelY\s*=\s*(\d+)/) || [0, 192])[1], 10);
      const col = Math.floor(px / 64), row = Math.floor(py / 64);
      return {
        logs: [
          { t: 'info', msg: `[Unity] TileMapConverter (瓦片尺寸 64×64) 运行结果：` },
          { t: 'ok', msg: `ToColRow(${px}, ${py}) → 列号 col = ${col}, 行号 row = ${row}` },
          { t: 'warn', msg: `ToXY(col=${col}, row=${row}) → 中心坐标 = (${col * 64 + 32}, ${row * 64 + 32}) [别忘+32]` }
        ],
        anim: { engine: 'basic_path', mode: 'tilemap' }
      };
    }
  },
  wall_tracing: {
    file: 'WallTracingAI.cs',
    title: '八方向沿墙走（右手优先 / 左手优先）',
    code: `// 8连通域：0右 1右下 2下 3左下 4左 5左上 6上 7右上
void doWallTracing(int curDirection) {
    Vector2 curPos = map.toColRow(sprite.anchoredPosition + Canvas.offset);
    // 右手优先：从 curDirection + 2 开始逆时针试探 8 个方向
    for (int i = curDirection + 2; i > curDirection - 6; --i) {
        int walkDir = (i + 8) % 8;         // 保证方向编号严格在 0~7
        Vector2 pt = curPos + dirs[walkDir];
        if (map.canPassWithRowCol(pt)) {
            target = map.toXY(pt);         // 转为像素中心坐标
            monsterState = RoleState.Chasing;
            curDirection = walkDir;
            break;
        }
    }
}`,
    run() {
      return {
        logs: [
          { t: 'info', msg: `[Unity] WallTracingAI.doWallTracing() 八方向试探启动：` },
          { t: 'ok', msg: `若当前朝右 (curDirection=0) → 右手起始 = (0+2)%8 = 2(下)，逆时针查 2→1→0→7→6→5→4→3` },
          { t: 'warn', msg: `对照记忆：左手优先起始 = (curDirection - 2 + 8) % 8 = 6(上)，顺时针扫描` }
        ],
        anim: { engine: 'basic_path', mode: 'wall', params: { hand: 'right' } }
      };
    }
  },
  path_following: {
    file: 'PathFollowingAI.cs',
    title: '沿路径走算法（8邻域动态权重分配）',
    code: `void doPathFollowing(int curDirection) {
    int[] weight = new int[8];
    weight[curDirection] = 10;
    weight[(curDirection + 1) % 8] = 9; weight[(curDirection + 7) % 8] = 9;
    weight[(curDirection + 2) % 8] = 8; weight[(curDirection + 6) % 8] = 8;
    weight[(curDirection + 3) % 8] = 7; weight[(curDirection + 5) % 8] = 7;
    weight[(curDirection + 4) % 8] = 6;
    for (int i = 0; i < 8; ++i) {
        Vector2 pnt = curPos + dirs[i];
        if (!map.canPassWithRowCol(pnt)) weight[i] -= 10; // 障碍物重罚减权
    }
    int maxWeight = -99;
    for (int i = 0; i < 8; ++i) {
        if (weight[i] > maxWeight) { maxWeight = weight[i]; curDirection = i; }
    }
    target = map.toXY(curPos + dirs[curDirection]);
}`,
    run() {
      return {
        logs: [
          { t: 'info', msg: `[Unity] PathFollowingAI 8邻域权重矩阵初始化: [10, 9, 8, 7, 6, 7, 8, 9]` },
          { t: 'ok', msg: `碰撞检测：所有障碍方向执行 weight[i] -= 10 变为负权，自动排除撞墙` },
          { t: 'warn', msg: `选出 maxWeight 对应方向更新 curDirection，沿走廊丝滑前进！` }
        ],
        anim: { engine: 'basic_path', mode: 'pathfollow' }
      };
    }
  },
  random_bypass: {
    file: 'RandomAndBypass.cs',
    title: '随机移动避障 & 绕行障碍物核心逻辑',
    code: `// 随机移动避障（RandomMoving 分支核心代码）
if (tileMap.canPass(pos)) {
    monster.anchoredPosition = pos;
    monsterMovedDis += displacement.magnitude;
    if (monsterMovedDis >= monsterNeedMoveDis) {
        monsterState = RoleState.Tracing;   // 走完固定步长，恢复追踪
        monsterMovedDis = 0; monsterNeedMoveDis = 0;
        Vector2 vr = (player.anchoredPosition - monster.anchoredPosition).normalized;
        monsterVelocity = vr * MonsterSpeed;
    }
} else {
    monsterNeedMoveDis = 0;                 // 途中再碰障，下帧重选随机角度
}`,
    run() {
      return {
        logs: [
          { t: 'info', msg: `[Unity] DoRandomPathFinding() 状态机监测启动...` },
          { t: 'ok', msg: `Tracing 遇障 → 切 RandomMoving，随机角 dir*45° 设定步长 50` },
          { t: 'warn', msg: `对比绕行避障：按 next=(dir+n)%8 选无障且未访问格子并记录路径防死锁！` }
        ],
        anim: { engine: 'basic_path', mode: 'bypass' }
      };
    }
  },
  dfs_bfs: {
    file: 'DFSAndBFSSearch.cs',
    title: 'DFS 递归/回溯 与 BFS 队列最短路代码',
    code: `// BFS 队列寻路（无权图保证边数最少的最短路径）
bool doBFSSearch(MapNode start, MapNode target) {
    Queue<MapNode> queue = new Queue<MapNode>();
    start.visited = true;
    queue.Enqueue(start);
    while (queue.Count > 0) {
        MapNode cur = queue.Dequeue();      // 先进先出 FIFO 逐层展开
        for (int i = 0; i < 8; ++i) {
            MapNode next = GetNeighbor(cur, i);
            if (next != null && next.walkable && !next.visited) {
                next.visited = true;
                next.parent = cur;          // 记录父节点供终点回溯
                if (next == target) { path = generatePath(target); return true; }
                queue.Enqueue(next);
            }
        }
    }
    return false;
}`,
    run() {
      return {
        logs: [
          { t: 'info', msg: `[Unity] doBFSSearch() 队列按层扩散: L0 → L1 → L2 → ...` },
          { t: 'ok', msg: `首次访问到目标点 target 时，立即沿 parent 倒推并 path.Reverse()` },
          { t: 'warn', msg: `若改为 Stack<MapNode> (FILO) 则变为非递归 DFS，不保证最短路但省内存！` }
        ],
        anim: { engine: 'graph_search', mode: 'bfs' }
      };
    }
  },
  astar_core: {
    file: 'AStarPathfinder.cs',
    title: 'A* 搜索核心循环 + 优先队列最小堆优化',
    code: `// A* 主循环（结合优先队列优化 + F值相同优先选H小）
PriorityQueue<MapNode, int> open = new PriorityQueue<MapNode, int>();
start.g = 0; start.h = Manhattan(start, goal) * 10; start.f = start.g + start.h;
open.Enqueue(start, start.f * 1000000 + start.h); // 复合键：f同选h小

while (open.Count > 0) {
    MapNode pNode = open.Dequeue();               // O(log n) 弹出最小 f 节点
    if (pNode == goal) return BacktrackPath(goal);
    closeList.Add(pNode);
    foreach (MapNode pAdj in Get8Neighbors(pNode)) {
        if (!pAdj.walkable || closeList.Contains(pAdj)) continue;
        int newG = pNode.g + (IsDiag(pNode, pAdj) ? 14 : 10) + pAdj.influenceCost;
        if (!inOpen(pAdj) || newG < pAdj.g) {     // 发现更短路径则松弛更新
            pAdj.g = newG; pAdj.h = Manhattan(pAdj, goal) * 10;
            pAdj.f = pAdj.g + pAdj.h; pAdj.parent = pNode;
            open.Enqueue(pAdj, pAdj.f * 1000000 + pAdj.h);
        }
    }
}`,
    run() {
      return {
        logs: [
          { t: 'info', msg: `[Unity] AStarPathfinder 启动：直走代价 10，斜走代价 14，曼哈顿启发 h(n)≤h*(n)` },
          { t: 'ok', msg: `Open List 采用 PriorityQueue 最小堆，查找复杂度从 O(n) 降至 O(log n)` },
          { t: 'warn', msg: `复合排序键 f*1000000+h 实现 f 相同时优先扩展 h 更小节点，加速向终点收敛！` }
        ],
        anim: { engine: 'astar', mode: 'ppt' }
      };
    }
  },
  fsm_state_pattern: {
    file: 'StatePatternFSM.cs',
    title: '有限状态机：标准状态设计模式 (Context + IState)',
    code: `public interface IState {
    void Enter(Monster m);     // 进入状态仅执行一次
    void Execute(Monster m);   // 每帧执行状态行为与转换检测
    void Exit(Monster m);      // 退出状态清理资源
}

public class Monster {         // Context 环境类
    private IState _curState;
    public void Update() => _curState?.Execute(this);
    public void ChangeState(IState next) {
        _curState?.Exit(this); // 1. 退出旧状态
        _curState = next;      // 2. 切换状态对象
        _curState.Enter(this); // 3. 进入新状态
    }
}

public class PatrolState : IState {
    public void Enter(Monster m)   => Debug.Log("[Enter] 进入巡逻状态");
    public void Execute(Monster m) { if (m.SeePlayer()) m.ChangeState(new ChaseState()); }
    public void Exit(Monster m)    => Debug.Log("[Exit] 离开巡逻，准备追逐");
}`,
    run() {
      return {
        logs: [
          { t: 'info', msg: `[Unity] Monster.ChangeState(new PatrolState())` },
          { t: 'ok', msg: `[Enter] 进入巡逻状态 -> Update() 每帧执行 PatrolState.Execute()` },
          { t: 'warn', msg: `触发事件【发现玩家】→ [Exit] 离开巡逻 → ChangeState → [Enter] 进入追逐状态！` },
          { t: 'info', msg: `优势：符合开闭原则与单一职责，彻底消除庞大的 switch-case 面条代码！` }
        ],
        anim: { engine: 'fsm', mode: 'guard' }
      };
    }
  },
  bt_tick: {
    file: 'BehaviorTreeNodes.cs',
    title: '行为树 Selector / Sequence / Parallel 节点实现',
    code: `public enum BTStatus { Success, Failure, Running }

// 选择节点 Selector (?): 遇 Success 或 Running 立即返回
public BTStatus TickSelector(List<BTNode> children) {
    foreach (var child in children) {
        BTStatus s = child.Tick();
        if (s == BTStatus.Success || s == BTStatus.Running) return s;
    }
    return BTStatus.Failure;
}

// 并行节点 Parallel (⇉): 同时执行，任一返 Failure 立即中断全部
public BTStatus TickParallel(List<BTNode> children) {
    bool allSuccess = true;
    foreach (var child in children) {
        BTStatus s = child.Tick();
        if (s == BTStatus.Failure) return BTStatus.Failure; // 立即中断！
        if (s != BTStatus.Success) allSuccess = false;
    }
    return allSuccess ? BTStatus.Success : BTStatus.Running;
}`,
    run() {
      return {
        logs: [
          { t: 'info', msg: `[Unity] BehaviorTree 每帧从 Root 发起 Tick 遍历...` },
          { t: 'ok', msg: `Selector(?) 检查分支1(低血量?) -> Failure，转入分支2(战斗序列)` },
          { t: 'warn', msg: `若用 Parallel + UntilFailure 监控【看到玩家?】，条件失效瞬间中断 Running 动作！` }
        ],
        anim: { engine: 'bt', mode: 'combat' }
      };
    }
  },
  boids_flocking: {
    file: 'BoidsFlocking.cs',
    title: 'Boids 群组行为：分离 + 对齐 + 聚集 三力加权合成',
    code: `using UnityEngine;
using System.Collections.Generic;

public class BoidsFlocking : MonoBehaviour {
    public float wSep = 1.4f, wAli = 1.4f, wCoh = 1.35f; // 三力权重

    Vector2 ComputeFlockForce(Boid self, List<Boid> neighbors) {
        Vector2 sep = Vector2.zero, avgVel = Vector2.zero, center = Vector2.zero;
        foreach (var n in neighbors) {
            Vector2 diff = self.pos - n.pos;
            sep += diff.normalized / Mathf.Max(0.1f, diff.magnitude); // 1. 分离(斥力与距离成反比)
            avgVel += n.vel;                                          // 2. 对齐(求平均速度)
            center += n.pos;                                          // 3. 聚集(求质心)
        }
        Vector2 ali = (avgVel / neighbors.Count) - self.vel;
        Vector2 coh = (center / neighbors.Count - self.pos) - self.vel;
        return sep * wSep + ali * wAli + coh * wCoh;                  // 加权合力驱动群体涌现
    }
}`,
    run(code) {
      const ws = parseFloat((code.match(/wSep\s*=\s*([-+]?\d*\.?\d+)/) || [0, 1.4])[1]);
      const wa = parseFloat((code.match(/wAli\s*=\s*([-+]?\d*\.?\d+)/) || [0, 1.4])[1]);
      const wc = parseFloat((code.match(/wCoh\s*=\s*([-+]?\d*\.?\d+)/) || [0, 1.35])[1]);
      const preset = ws > 2.5 ? 'panic' : (wa > 2.2 && wc < 0.7 ? 'align' : 'cruise');
      return {
        logs: [
          { t: 'info', msg: `[Unity] BoidsFlocking 三力加权运行中: 分离=${ws}, 对齐=${wa}, 聚集=${wc}` },
          { t: 'ok', msg: `群体呈现模式: ${preset === 'panic' ? '惊慌逃散 (极高分离斥力)' : (preset === 'align' ? '高度统一队列' : '自然紧密巡游')}` },
          { t: 'warn', msg: `提示：可在下方实时预览中按住鼠标拖动鱼群，或点击画面全屏放大体验！` }
        ],
        anim: { engine: 'boids', mode: preset }
      };
    }
  },
  unity_basics: {
    file: 'UnityBasicsDemo.cs',
    title: 'Unity 核心组件与工具类：Transform / Time.deltaTime / Vector / Input',
    code: `using UnityEngine;

public class UnityBasicsDemo : MonoBehaviour {
    public float moveSpeed = 6.0f;   // 移动速度 (m/s)
    public float inputX = 1.0f;      // 模拟 Input.GetAxis("Horizontal") ∈ [-1, 1]
    public float fps = 60f;          // 测试不同帧率 (30 / 60 / 144)

    void Update() {
        float dt = 1f / fps;         // 等价于 Time.deltaTime
        // 帧率无关平移：位移 = 方向 × 速度 × Time.deltaTime
        Vector3 delta = Vector3.right * inputX * moveSpeed * dt;
        transform.Translate(delta);
        // 点积判断目标是否在正前方 (v1·v2 > 0 为前方)
        float dot = Vector2.Dot(Vector2.right, new Vector2(0.8f, 0.6f));
        Debug.Log($"dt={dt:F4}s, 单帧位移={delta.x:F3}m, 1秒总位移={delta.x * fps:F2}m, dot={dot:F2}");
    }
}`,
    run(code) {
      const spd = parseFloat((code.match(/moveSpeed\s*=\s*([-+]?\d*\.?\d+)/) || [0, 6])[1]);
      const inp = parseFloat((code.match(/inputX\s*=\s*([-+]?\d*\.?\d+)/) || [0, 1])[1]);
      const fps = Math.max(10, parseFloat((code.match(/fps\s*=\s*([-+]?\d*\.?\d+)/) || [0, 60])[1]));
      const dt = 1 / fps;
      const frameDx = inp * spd * dt;
      const secDx = frameDx * fps;
      return {
        logs: [
          { t: 'info', msg: `[Unity] UnityBasicsDemo.Update() @ ${fps.toFixed(0)} FPS (Time.deltaTime = ${dt.toFixed(4)}s)` },
          { t: 'ok', msg: `Transform.Translate(Vector3.right * ${inp} * ${spd} * dt) → 单帧位移 ${frameDx.toFixed(4)} m` },
          { t: 'warn', msg: `1 秒累计位移 = ${secDx.toFixed(2)} m（修改 fps 为 30 或 144，1 秒位移依然恒定！）` },
          { t: 'info', msg: `牢记：Transform 管位置/旋转/缩放；Input.mousePosition 返回屏幕像素坐标而非世界坐标！` }
        ],
        anim: { engine: 'physics', mode: 'dot' }
      };
    }
  },
  astar_opt: {
    file: 'AStarOptimized.cs',
    title: 'A* 工程优化：优先队列复合键 (f同选h小) + 影响力映射代价',
    code: `using UnityEngine;
using System.Collections.Generic;

public class AStarOptimized {
    public float dangerWeight = 35f;   // 敌方火力区惩罚权重 (正值避让)
    public float resourceBonus = -12f; // 补给点吸引奖励 (负值吸引)
    public bool tieBreakByH = true;    // f 相同时是否优先扩展 h 更小节点

    int ComputePriorityKey(int g, int h) {
        int f = g + h;
        // 复合键：f 占高位，h 占低位 -> 最小堆 O(log n) 弹出且 f 同必先选 h 小！
        return tieBreakByH ? (f * 1000000 + h) : f;
    }

    float ComputeStepCost(bool isDiag, float dangerLevel, float resourceLevel) {
        float baseCost = isDiag ? 14f : 10f;
        return Mathf.Max(1f, baseCost + dangerLevel * dangerWeight + resourceLevel * resourceBonus);
    }
}`,
    run(code) {
      const dw = parseFloat((code.match(/dangerWeight\s*=\s*([-+]?\d*\.?\d+)/) || [0, 35])[1]);
      const rb = parseFloat((code.match(/resourceBonus\s*=\s*([-+]?\d*\.?\d+)/) || [0, -12])[1]);
      const tie = !/tieBreakByH\s*=\s*false/.test(code);
      return {
        logs: [
          { t: 'info', msg: `[Unity] AStarOptimized 启动：PriorityQueue 最小堆 O(log n) + 复合排序键=${tie ? 'f*1e6+h (开启)' : '仅f'}` },
          { t: 'ok', msg: `危险区直走格代价 = 10 + ${dw.toFixed(1)} = ${(10 + dw).toFixed(1)}（AI 自动绕开敌方火力圈）` },
          { t: 'ok', msg: `资源点直走格代价 = max(1, 10 + (${rb.toFixed(1)})) = ${Math.max(1, 10 + rb).toFixed(1)}（优先顺路拾取）` },
          { t: 'warn', msg: `七大优化已加载：最小堆、f同选h小、Close重开、双向A*、地形权、影响力映射、局部ORCA避障！` }
        ],
        anim: { engine: 'astar', mode: 'opt' }
      };
    }
  },
  fsm_switch: {
    file: 'GuardSwitchFSM.cs',
    title: 'FSM 四要素与守卫迁移逻辑（分支逻辑法示例）',
    code: `using UnityEngine;

public enum GuardState { Patrol, Chase, Attack, Dead }

public class GuardSwitchFSM : MonoBehaviour {
    public GuardState curState = GuardState.Patrol; // 初始状态 = Patrol
    public float playerDist = 4.5f;                 // 玩家距离 (<10发现, <5进入射程)
    public int hp = 100;                            // 生命值 (<=0 必转 Dead)

    void Update() {
        if (hp <= 0) { curState = GuardState.Dead; return; }
        switch (curState) {
            case GuardState.Patrol:
                if (playerDist < 10f) curState = GuardState.Chase;
                break;
            case GuardState.Chase:
                if (playerDist < 5f) curState = GuardState.Attack;
                else if (playerDist > 15f) curState = GuardState.Patrol;
                break;
            case GuardState.Attack:
                if (playerDist >= 5f) curState = GuardState.Chase;
                break;
        }
        Debug.Log($"当前状态: {curState} (dist={playerDist}, hp={hp})");
    }
}`,
    run(code) {
      const dist = parseFloat((code.match(/playerDist\s*=\s*([-+]?\d*\.?\d+)/) || [0, 4.5])[1]);
      const hp = parseFloat((code.match(/\bhp\s*=\s*([-+]?\d*\.?\d+)/) || [0, 100])[1]);
      let finalState = 'Patrol (巡逻)', trace = 'Patrol';
      if (hp <= 0) { finalState = 'Dead (死亡)'; trace = '任意态 --[HP<=0]--> Dead'; }
      else if (dist < 5) { finalState = 'Attack (攻击)'; trace = 'Patrol --[发现玩家]--> Chase --[进入射程]--> Attack'; }
      else if (dist < 10) { finalState = 'Chase (追逐)'; trace = 'Patrol --[发现玩家]--> Chase'; }
      return {
        logs: [
          { t: 'info', msg: `[Unity] GuardSwitchFSM 执行迁移判定 (playerDist=${dist}, hp=${hp})` },
          { t: 'ok', msg: `状态迁移路径：${trace}` },
          { t: 'warn', msg: `最终落入状态：${finalState}（修改上方 playerDist=12 或 hp=0 再次运行观察转换！）` },
          { t: 'info', msg: `四要素回顾：①状态 ②初始状态(Patrol) ③输入(距离/血量) ④转换` }
        ],
        anim: { engine: 'fsm', mode: 'guard' }
      };
    }
  }
};
