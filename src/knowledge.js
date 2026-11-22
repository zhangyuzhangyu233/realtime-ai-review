/* ==========================================================================
   16 Dedicated Sub-Section Knowledge Pages & 6 Chapter Groups (Zero-Emoji Edition)
   Every single sub-section has its own dedicated page:
   Step 1: Deep-Dive Notes & Worked Examples -> Step 2: Runnable C# Sandbox -> Step 3: 60fps Interactive Animation
   ========================================================================== */
window.MASTERY_TOPICS = [
  { id: 't_unity',       mod: 'm1', name: 'Unity 组件与工具类',      sub: 'Transform / Input / Time / Vector',       grad: 'grad-ocean' },
  { id: 't_kinematics',  mod: 'm1', name: '向量点积与运动学抛物',     sub: '5大方程 / 摩擦力 / 抛物线独立性',         grad: 'grad-mint' },
  { id: 't_mechanics',   mod: 'm1', name: '力学做功、动量与碰撞反射', sub: 'F=ma / W=F·s / 轴平行与斜面反射',        grad: 'grad-lagoon' },
  { id: 't_steering',    mod: 'm2', name: '智能体与 Seek/Flee/Arrive', sub: '五大特性 / 操控力公式 / 减速半径',       grad: 'grad-sunset' },
  { id: 't_intercept',   mod: 'm2', name: '追逐与拦截算法',          sub: '基本/视线追逐 / 拦截 6 步推导 St',        grad: 'grad-amber' },
  { id: 't_pattern',     mod: 'm2', name: '模式移动与随机化',        sub: '控制指令法 DoPattern vs 模式指令法',       grad: 'grad-berry' },
  { id: 't_tilemap',     mod: 'm3', name: 'TileMap 与八连通域',      sub: '二维数组 / 64×64 像素中心 +32 / 0~7方位', grad: 'grad-forest' },
  { id: 't_avoid',       mod: 'm3', name: '随机避障与绕行障碍物',     sub: 'RandomMoving 状态切换 / 防死锁访问记录',  grad: 'grad-mint' },
  { id: 't_follow_wall', mod: 'm3', name: '沿路径走、沿墙走与路点',   sub: '8邻域权重 / 左右手公式 / 路点与面包屑',   grad: 'grad-ocean' },
  { id: 't_dfs_bfs',     mod: 'm4', name: 'DFS / BFS 与 Dijkstra',  sub: '栈(FILO) / 队列(FIFO) / 最小堆松弛',     grad: 'grad-aurora' },
  { id: 't_astar_core',  mod: 'm4', name: 'A* 原理、可采纳与手算',    sub: 'f=g+h / h≤h* / 28格与42格推演',          grad: 'grad-lagoon' },
  { id: 't_astar_opt',   mod: 'm4', name: 'A* 流程与七大优化策略',    sub: '10步主循环 / 优先队列 / 影响力映射',     grad: 'grad-berry' },
  { id: 't_fsm_std',     mod: 'm5', name: 'FSM 四要素与迁移图/表',    sub: '状态/初始/输入/转换 · 守卫/Blinky/蚂蚁',  grad: 'grad-berry' },
  { id: 't_fsm_pattern', mod: 'm5', name: '分支逻辑法 vs 状态模式',   sub: 'switch-case 弊端 / Context + IState',     grad: 'grad-aurora' },
  { id: 't_bt',          mod: 'm6', name: '行为树体系与并行中断',     sub: '叶/组合/修饰节点 / Parallel+UntilFailure', grad: 'grad-sunset' },
  { id: 't_boids',       mod: 'm6', name: 'Boids 群组三大法则',       sub: '分离 / 对齐(队列) / 聚集 与调参实战',     grad: 'grad-forest' }
];

window.KNOWLEDGE_MODULES = [
  {
    id: 'm1',
    short: '一、物理与 Unity 基础',
    tag: '单选 / 计算必考',
    lectures: '第 1–4 讲',
    grad: 'grad-ocean',
    title: '模块一：AI 基础、Unity 核心组件与游戏物理学',
    mascot: 'teach',
    demos: ['unity_basics', 'kinematics_parabola', 'car_friction', 'reflect_wall', 'dot_work'],
    sections: ['t_unity', 't_kinematics', 't_mechanics']
  },
  {
    id: 'm2',
    short: '二、基本移动算法',
    tag: '编程高频',
    lectures: '第 5–6 讲',
    grad: 'grad-sunset',
    title: '模块二：追逐、闪躲、拦截与模式移动精讲',
    mascot: 'cheer',
    demos: ['steering_seek', 'space_intercept', 'pattern_move'],
    sections: ['t_steering', 't_intercept', 't_pattern']
  },
  {
    id: 'm3',
    short: '三、基本路径寻找',
    tag: '作答 + 编程必考',
    lectures: '第 7–9 讲',
    grad: 'grad-forest',
    title: '模块三：TileMap 与四大基本路径寻找算法精讲',
    mascot: 'search',
    demos: ['tilemap_coords', 'random_bypass', 'path_following', 'wall_tracing'],
    sections: ['t_tilemap', 't_avoid', 't_follow_wall']
  },
  {
    id: 'm4',
    short: '四、图搜索与 A* 算法',
    tag: '绝对重头戏',
    lectures: '第 10–13 讲',
    grad: 'grad-aurora',
    title: '模块四：DFS、BFS、Dijkstra 与 A* 搜索算法深度精讲',
    mascot: 'search',
    demos: ['dfs_bfs', 'astar_core', 'astar_opt'],
    sections: ['t_dfs_bfs', 't_astar_core', 't_astar_opt']
  },
  {
    id: 'm5',
    short: '五、有限状态机 FSM',
    tag: '画图 + 代码必考',
    lectures: '第 14–15 讲',
    grad: 'grad-berry',
    title: '模块五：有限状态机 (FSM) 与状态设计模式精讲',
    mascot: 'code',
    demos: ['fsm_switch', 'fsm_state_pattern'],
    sections: ['t_fsm_std', 't_fsm_pattern']
  },
  {
    id: 'm6',
    short: '六、行为树与群组行为',
    tag: '高频核心考点',
    lectures: '第 16–17 讲',
    grad: 'grad-lagoon',
    title: '模块六：行为树 (Behavior Tree) 与 群组行为 (Boids) 精讲',
    mascot: 'trophy',
    demos: ['bt_tick', 'boids_flocking'],
    sections: ['t_bt', 't_boids']
  }
];

/* ==================== 16 DEDICATED SUB-SECTION PAGES ==================== */
window.KNOWLEDGE_SECTIONS = [
  /* ---------- 模块一 (1.1, 1.2, 1.3) ---------- */
  {
    id: 't_unity',
    mod: 'm1',
    num: '1.1',
    short: '1.1 Unity 组件与工具类',
    title: '1.1 人工智能基础与 Unity 核心组件工具类',
    tag: '单选 / 判断高频',
    lectures: '第 1–2 讲',
    mascot: 'teach',
    tip: '大肥鱼划重点：牢记 Transform 同时管位置/旋转/缩放、Unity 只有 Vector2/Vector3 无泛称 Vector 类、Input.mousePosition 返回屏幕像素坐标！',
    demos: ['unity_basics'],
    labs: [
      {
        id: 'lab-t-unity',
        engine: 'physics',
        title: '向量朝向与点积交互演示（点击画面全屏放大）',
        defaultMode: 'dot',
        modes: [
          { key: 'dot', label: '向量点积与视野朝向' },
          { key: 'parabola', label: '粒子抛物轨迹预览' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>AI 基础概念与智能体 (Agent)</h3>
            <span class="exam-tag blue">单选 / 判断</span>
          </div>
          <ul class="kp-list">
            <li><strong>AI 三级分类</strong>：<strong>弱人工智能 (Narrow AI)</strong> 专注单一任务（语音助手、推荐、游戏 AI，当前主流）；<strong>强人工智能 (AGI)</strong> 具备跨领域通用推理能力；<strong>超级人工智能 (ASI)</strong> 远超人类智能的理论阶段。</li>
            <li><strong>图灵测试标准</strong>：通过纯文本对话，人类若无法分辨对方是人还是机器，则判定该机器具备人类水平智能。</li>
            <li><strong>对象 (Object) vs 智能体 (Agent)</strong>：对象是<strong>被动</strong>封装的数据与方法，只能等外部调用；智能体是<strong>主动</strong>计算实体，能独立执行标准闭环：<strong>① 感知环境 → ② 行为选择 → ③ 操控计算 → ④ 移动执行</strong>。</li>
            <li><strong>智能体五大核心特性</strong>：<strong>自治性</strong>（独立运行无需持续干预）、<strong>反应性</strong>（感知并快速响应环境变化）、<strong>主动性</strong>（为目标主动采取行动）、<strong>社会性</strong>（协作或竞争）、<strong>进化性</strong>（从经验中学习优化）。</li>
            <li><strong>随机算法辨析</strong>：蒙特卡罗、拉斯维加斯、舍伍德属于经典随机算法；<strong>动态规划算法不是随机算法</strong>。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>Unity 核心组件与常用工具类精讲</h3>
            <span class="exam-tag hot">高频陷阱</span>
          </div>
          <ul class="kp-list">
            <li><strong>Transform 组件</strong>：场景中<strong>每一个游戏对象必有</strong>，同时负责<strong>位置 (Position)、旋转 (Rotation)、缩放 (Scale)</strong> 三大变换；常用成员方法：<code>Translate()</code> 平移、<code>Rotate()</code> 旋转、<code>LookAt()</code> 朝向目标。</li>
            <li><strong>Rigidbody 刚体 &amp; Collider 碰撞体</strong>：刚体使对象受物理引擎与重力控制（<code>Mass</code>、<code>Use Gravity</code>、<code>Is Kinematic</code>、<code>AddForce()</code>），需与 Collider 配合触发 <code>OnCollisionEnter</code>；勾选 <code>Is Trigger</code> 则仅触发 <code>OnTriggerEnter</code> 区域事件，不产生物理弹开。</li>
            <li><strong>Vector2 / Vector3 类</strong>：Unity 严格区分 2D 向量 <code>Vector2</code> 与 3D 向量 <code>Vector3</code>（<strong>不存在</strong>泛称的 <code>Vector</code> 类表示 3D 点）。标准方向常量：<code>right=(1,0,0)</code> 沿 X 轴、<code>up=(0,1,0)</code> 沿 Y 轴、<code>forward=(0,0,1)</code> 沿 Z 轴、<code>zero=(0,0,0)</code>、<code>one=(1,1,1)</code>。</li>
            <li><strong>Time 类</strong>：<code>Time.deltaTime</code> 获取上一帧到当前帧耗时（秒），在 <code>Update()</code> 中位移乘以它可实现<strong>帧率无关的平滑运动</strong>；<code>Time.timeScale=0</code> 暂停，<code>0.5</code> 慢动作。</li>
            <li><strong>Input 类</strong>：<code>GetKeyDown</code> 仅按下当帧返回 true，<code>GetKey</code> 按住持续返回 true；<code>GetAxis("Horizontal")</code> 返回 <code>[-1, 1]</code>；<code>GetMouseButton(0)</code> 检左键；<strong>Input.mousePosition 返回屏幕像素坐标，而非世界坐标</strong>。</li>
            <li><strong>粒子系统</strong>：由粒子、发射器与独立模块构成；瀑布、烟花等特效利用<strong>抛物线</strong>轨迹叠加重力驱动粒子运动。</li>
          </ul>
          <div class="trap-callout">考场避坑：凡是看到“Transform 主要负责位置控制”“Unity 用 Vector 类表示 3D 向量”“Input.mousePosition 返回世界坐标”均为经典干扰错误项。</div>
        </div>
      </div>
    `
  },

  {
    id: 't_kinematics',
    mod: 'm1',
    num: '1.2',
    short: '1.2 向量点积与运动学抛物',
    title: '1.2 向量点积投影、运动学五大方程与抛物线分解',
    tag: '必考推导 + 计算',
    lectures: '第 3 讲',
    mascot: 'think',
    tip: '大肥鱼划重点：单位向量 v₁·v₂ 是 v₂ 在 v₁ 上的投影长度！抛物运动记住“水平匀速 + 竖直匀变速”完全独立分解。',
    demos: ['kinematics_parabola', 'car_friction'],
    labs: [
      {
        id: 'lab-t-kinematics',
        engine: 'physics',
        title: '运动学抛物分解 / 摩擦力 / 点积投影实验室（点击画面放大）',
        defaultMode: 'parabola',
        modes: [
          { key: 'parabola', label: '抛物运动分解' },
          { key: 'friction', label: '有无摩擦力加速' },
          { key: 'dot', label: '向量点积与投影' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>向量运算与点积 (Dot Product) 几何详解</h3>
            <span class="exam-tag hot">必考推导</span>
          </div>
          <div class="formula-box">
模长 (长度):      ||v|| = √(x² + y² + z²)
归一化 (单位化):  v̂ = v / ||v||       (方向不变，长度变为 1)
点积代数式:       v₁ · v₂ = x₁x₂ + y₁y₂ (+ z₁z₂)      [结果为标量]
点积几何式:       v₁ · v₂ = ||v₁|| · ||v₂|| · cosθ
          </div>
          <ul class="kp-list">
            <li><strong>向量加减几何意义</strong>：加法首尾相连；减法 <code>B - A</code> 得到<strong>从起点 A 指向终点 B</strong> 的位移/方向向量（寻路与追逐的基石）。</li>
            <li><strong>点积判定朝向关系</strong>：<code>v₁·v₂ &gt; 0</code> ⇒ 夹角 θ &lt; 90°（同向，如目标在视野前方）；<code>v₁·v₂ = 0</code> ⇒ 垂直（θ = 90°）；<code>v₁·v₂ &lt; 0</code> ⇒ 夹角 θ &gt; 90°（反向，在背后）。</li>
            <li><strong>单位向量投影定理（真题原话）</strong>：当 <code>v₁</code> 为<strong>单位向量</strong>（<code>||v₁|| = 1</code>）时，<code>v₁ · v₂ = ||v₂||·cosθ</code>，其几何意义严格为 <strong>v₂ 在 v₁ 上的投影长度</strong>（切勿选反成 v₁ 在 v₂ 上）。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>运动学五大方程、摩擦力与抛物运动分解</h3>
            <span class="exam-tag hot">必考计算</span>
          </div>
          <div class="formula-box">
① v = v₀ + a·t          ② s = v₀·t + ½·a·t²         ③ v² = v₀² + 2a·s
④ v̄ = ½(v₀ + v)         ⑤ s = ½(v₀ + v)·t
向量形式: Δr = v₀·t + ½·a·t²   (x、y、z 三个分量完全独立运算)
          </div>
          <ul class="kp-list">
            <li><strong>摩擦力与真实平滑加速</strong>：静摩擦 <code>Ff_max = μs·N</code>，动摩擦 <code>Ffk = μk·N</code>，核心规律 <strong>μk &lt; μs</strong>。汽车代码引入阻力因子：<code>v = v*(1 - friction*dt) + a*dt</code>，当动力与阻力平衡时速度自然收敛至上限，避免无限加速 Bug。</li>
            <li><strong>抛物运动独立性原理</strong>：将初速度 <code>v₀</code> 正交分解为水平 <code>v₀x = v₀cosθ</code> 与竖直 <code>v₀y = v₀sinθ</code>。忽略空气阻力时，<strong>水平方向做匀速直线运动 (x = v₀x·t)</strong>，<strong>竖直方向做匀减速/自由落体 (y = v₀y·t - ½gt²)</strong>，二者互不干扰。</li>
          </ul>
          <div class="worked-example">
            <div class="worked-example-title">课件原题演练：平台跳跃求水平位移</div>
            已知平台高 <code>h = 8m</code>，初速 <code>v₀ = 10 m/s</code>，仰角 <code>θ = 30°</code>，<code>g = 10 m/s²</code>：<br>
            Step 1 分解初速：<code>v₀x = 10·cos30° ≈ 8.66 m/s</code>，<code>v₀y = 10·sin30° = 5 m/s</code>；<br>
            Step 2 竖直求时间：落点低于起跳点 8m 即 <code>y = -8 = 5t - 5t²</code> ⇒ 解得 <code>t ≈ 1.86 s</code>；<br>
            Step 3 水平求距离：<code>x = 8.66 × 1.86 ≈ 16.1 m</code>。
          </div>
        </div>
      </div>
    `
  },

  {
    id: 't_mechanics',
    mod: 'm1',
    num: '1.3',
    short: '1.3 力学做功与碰撞反射',
    title: '1.3 力学做功、动量守恒与轴平行 / 非轴平行斜面碰撞反射',
    tag: '计算 + 编程填空必考',
    lectures: '第 4 讲',
    mascot: 'code',
    tip: '大肥鱼划重点：马车斜推力做功 (2500J) 与篮球碰撞反射（竖直墙改 x、水平板改 y、篮筐点全反、斜面用点积投影）几乎年年必考！',
    demos: ['reflect_wall', 'dot_work'],
    labs: [
      {
        id: 'lab-t-mechanics',
        engine: 'physics',
        title: '碰撞反射 (水平/竖直/斜面) 与斜推力做功实验室',
        defaultMode: 'reflect',
        modes: [
          { key: 'reflect', label: '碰撞反射 (水平/竖直/斜面)' },
          { key: 'work', label: '斜推力做功 (考题同款)' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card span-2">
          <div class="kp-card-head">
            <h3>力学原理、能量动量守恒与四种碰撞反射全表</h3>
            <span class="exam-tag code">计算 + 编程填空双料核心</span>
          </div>
          <table class="compare-table">
            <thead>
              <tr><th style="width:20%">核心原理</th><th style="width:32%">标准公式与定义</th><th>详细解题思路与真题演算</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>重力与牛顿三定律</strong></td>
                <td><code>w = mg</code>（竖直向下，单位 N）<br><code>F = ma</code>，<code>F₁ = -F₂</code></td>
                <td>① 第一定律（惯性）：无外力保持静止或匀速直线；② 第二定律：2N 推 1kg 冰块 ⇒ <code>a=2 m/s²</code>，3秒位移 <code>s = ½×2×3² = 9m</code>；10N 拉 2kg ⇒ <code>a=5 m/s²</code>。</td>
              </tr>
              <tr>
                <td><strong>功、动能、势能、功能原理</strong></td>
                <td><code>W = F·Δs·cosθ</code><br><code>KE = ½mv²</code>，<code>GPE = mgh</code><br><code>W = ΔKE = KEf - KEi</code></td>
                <td><strong>真题马车做功</strong>：右上 60° 推力 1100N，摩擦 50N，推 5m：<br>水平分力 <code>Fx = 1100×cos60° = 550N</code> ⇒ 水平合力 <code>F合 = 550 - 50 = 500N</code> ⇒ <code>W = 500×5 = 2500J</code>。</td>
              </tr>
              <tr>
                <td><strong>动量、冲量与动量守恒</strong></td>
                <td><code>p = mv</code>，<code>J = Ft = Δp</code><br><code>m₁v₁ᵢ + m₂v₂ᵢ = m₁v₁f + m₂v₂f</code></td>
                <td>无外力作用下系统总动量守恒。例：8g(0.008kg)子弹 400m/s 射出，动量 <code>p = 3.2 kg·m/s</code>，80kg 角色反冲速度 <code>3.2/80 = 0.04 m/s</code>。</td>
              </tr>
              <tr>
                <td><strong>轴平行碰撞反射</strong></td>
                <td>水平边界：<code>velocity.y = -velocity.y</code><br>竖直墙面：<code>velocity.x = -velocity.x</code><br>撞篮筐点：<code>velocity = -velocity</code></td>
                <td>只反转<strong>垂直于碰撞面</strong>的速度分量，平行分量不变：<br>• <code>[6, 4]</code> 撞水平边栏 ⇒ <code>[6, -4]</code><br>• <code>[5, -3]</code> 撞垂直墙面 ⇒ <code>[-5, -3]</code>（y 不变！）</td>
              </tr>
              <tr>
                <td><strong>非轴平行斜面反射（4步法）</strong></td>
                <td>1. 求边界法向量 <code>N</code><br>2. 单位化 <code>N' = N / |N|</code><br>3. 投影 <code>P = (-vi · N') · N'</code><br>4. 反射 <code>vf = vi + 2P</code></td>
                <td><strong>课件足球撞斜广告牌</strong>：<code>P(50,200)→Q(250,350)</code>，<code>PQ=(200,150)</code> ⇒ 法向量 <code>N=(-150,200)</code>，<code>|N|=250</code> ⇒ <code>N'=(-0.6, 0.8)</code>。<br>入射 <code>vi=[8,-10]</code> ⇒ <code>-vi·N' = 12.8</code> ⇒ <code>P=(-7.68, 10.24)</code> ⇒ <code>vf = vi+2P = (-7.36, 10.48)</code>。<br>Unity 填空：<code>velocity = 2*N*(-Vector2.Dot(velocity, N)) + velocity</code></td>
              </tr>
            </tbody>
          </table>
          <div class="trap-callout">考场编程避坑：斜面公式等价写法 <code>velocity - 2 * Vector2.Dot(velocity, N) * N</code> 或 <code>Vector2.Reflect(velocity, N)</code> 数学上完全一致，但务必确认法向量 N 已归一化且符号为减号（或负点积相加）！</div>
        </div>
      </div>
    `
  },

  /* ---------- 模块二 (2.1, 2.2, 2.3) ---------- */
  {
    id: 't_steering',
    mod: 'm2',
    num: '2.1',
    short: '2.1 智能体与 Seek/Flee/Arrive',
    title: '2.1 智能体操控框架与 Seek / Flee / Arrive 核心公式',
    tag: '单选 / 判断高频',
    lectures: '第 5 讲',
    mascot: 'cheer',
    tip: '大肥鱼划重点：区分 Seek(目标-当前) 与 Flee(当前-目标) 的减法顺序，以及 Arrive 通过减速半径平滑降速消除到达震荡！',
    demos: ['steering_seek'],
    labs: [
      {
        id: 'lab-t-steering',
        engine: 'steering',
        title: 'Seek / Arrive / Flee 三大操控行为实时舞台',
        defaultMode: 'seek',
        modes: [
          { key: 'seek', label: 'Seek (靠近)' },
          { key: 'arrive', label: 'Arrive (减速抵达)' },
          { key: 'flee', label: 'Flee (闪躲远离)' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>三大基础操控行为：Seek / Flee / Arrive 详解</h3>
            <span class="exam-tag hot">单选 / 判断高频</span>
          </div>
          <div class="formula-box">
Seek (靠近):  期望速度 = (目标位置 - 当前位置).normalized × 最大速度
Flee (离开):  期望速度 = (当前位置 - 目标位置).normalized × 最大速度
操控力:       SteeringForce = 期望速度 - 当前速度
          </div>
          <ul class="kp-list">
            <li><strong>Seek（靠近）</strong>：每帧指向目标计算期望速度，再减去当前速度得出操控力，产生圆滑转向轨迹，避免僵硬折线。</li>
            <li><strong>Flee（离开 / 闪躲）</strong>：Seek 的严格逆过程。核心方向向量是<strong>当前位置 - 目标位置</strong>（从威胁源指向智能体），使智能体背离危险加速撤离。</li>
            <li><strong>Arrive（抵达）</strong>：解决 Seek 到达目标因惯性冲过头反复震荡的缺陷。设定<strong>减速半径 (Slowing Radius)</strong>，一旦进入该半径，期望速度按 <code>最大速度 × (剩余距离 / 减速半径)</code> 平滑衰减至 0，精准停靠。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>课件数值例题：向量追逐操控力演练</h3>
            <span class="exam-tag blue">手算范例</span>
          </div>
          <div class="worked-example">
            <div class="worked-example-title">课件例题：敌人向量追逐新速度计算</div>
            敌人 A(10,10) 当前速度 (2,0)，玩家 B(30,20) 静止，最大速度 5，Δt=1：<br>
            ① 指向目标方向 <code>B - A = (20, 10)</code>，模长 <code>√500 ≈ 22.36</code> ⇒ 单位向量 <code>(0.894, 0.447)</code>；<br>
            ② 期望速度 <code>(4.47, 2.235)</code> ⇒ 操控力 <code>(4.47 - 2, 2.235 - 0) = (2.47, 2.235)</code>；<br>
            ③ 新速度 <code>(2, 0) + (2.47, 2.235) = (4.47, 2.235)</code>，新位置 <code>(14.47, 12.235)</code>。
          </div>
          <div class="trap-callout">考场易错点：操控力 <code>SteeringForce = 期望速度 - 当前速度</code> 才是转向加速度来源；工程中常使用 <code>Vector2.ClampMagnitude(steering, maxForce)</code> 限制最大转向力，防止急转弯穿模。</div>
        </div>
      </div>
    `
  },

  {
    id: 't_intercept',
    mod: 'm2',
    num: '2.2',
    short: '2.2 追逐与拦截算法 (6步)',
    title: '2.2 追逐算法演进与拦截算法 (Interception) 完整 6 步推导',
    tag: '简答 + 编程必考',
    lectures: '第 5 讲',
    mascot: 'search',
    tip: '大肥鱼划重点：拦截算法不仅考概念和 6 步手算数值（火箭 (80,220) 拦截点 St ≈ (315.0, 415.9)），更是手写 C# 代码的必练大题！',
    demos: ['space_intercept'],
    labs: [
      {
        id: 'lab-t-intercept',
        engine: 'steering',
        title: '拦截算法 vs 视线追逐 vs 基本追逐对比舞台',
        defaultMode: 'intercept',
        modes: [
          { key: 'intercept', label: '拦截 vs 视线追逐 vs 基本追逐' },
          { key: 'seek', label: '单智能体 Seek 轨迹' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>基本追逐 vs 视线追逐 vs 预判拦截</h3>
            <span class="exam-tag blue">概念辨析</span>
          </div>
          <ul class="kp-list">
            <li><strong>① 基本追逐（乒乓式追逐）</strong>：分别单独比较 X 和 Y 坐标大小做 <code>++ / --</code>，实现极简但路径呈机械阶梯 / L 形折线。</li>
            <li><strong>② 视线追逐（向量追逐）</strong>：每帧将 Seek 目标设为猎物当前实时坐标，路径平滑自然，但<strong>只会死追猎物屁股后面</strong>，且<strong>若目标速度 &gt; 追逐者最大速度则永远追不上</strong>。</li>
            <li><strong>③ 拦截算法（Interception）</strong>：本质仍是<strong>追踪算法</strong>，但不再盲目跟跑目标当前位置，而是结合双方相对速度预判<strong>双方能同时到达的未来交汇点（拦截点 St）</strong>，直线抢点效率最高！</li>
          </ul>
          <div class="trap-callout">考场判断题高频陷阱：“拦截点是目标移动路径上距离追踪者最近的垂足点” → <strong>错误！</strong>拦截点是双方同时抵达的未来相遇点 <code>St = Sprey + Vprey * tc</code>。</div>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>拦截算法完整 6 步推导与太空数值演练</h3>
            <span class="exam-tag code">简答 + 编码核心</span>
          </div>
          <div class="formula-box">
Step 1 测目标速度: Vprey = (pos_now - pos_prev) / dt
Step 2 相对速度:   Vr = Vprey - Vpredator
Step 3 相对距离:   Sr = Sprey - Spredator
Step 4 闭合时间:   tc = Sr.magnitude / Vr.magnitude
Step 5 预测交汇点: St = Sprey + Vprey * tc
Step 6 限幅移动:   Vnew = ClampMagnitude((St - Spredator)/tc, maxSpeed)
          </div>
          <div class="worked-example">
            <div class="worked-example-title">课件太空拦截数值演练（大题高频原题）</div>
            火箭 <code>(80, 220)</code> 速度 <code>(6, 5)</code>，怪兽 <code>(380, 160)</code> 速度 <code>(0, 0)</code>：<br>
            ① <code>Vr = (6, 5) ⇒ |Vr| = √61 ≈ 7.81</code>；<br>
            ② <code>Sr = (-300, 60) ⇒ |Sr| = √93600 ≈ 305.94</code>；<br>
            ③ <code>tc = 305.94 / 7.81 ≈ 39.17</code>；<br>
            ④ 预测拦截点 <code>St = (80 + 6×39.17, 220 + 5×39.17) ≈ (315.0, 415.9)</code>。
          </div>
        </div>
      </div>
    `
  },

  {
    id: 't_pattern',
    mod: 'm2',
    num: '2.3',
    short: '2.3 模式移动与随机化',
    title: '2.3 模式移动 (Pattern Movement)、DoPattern 7 空与随机化',
    tag: '概念对比 + 7空默写',
    lectures: '第 6 讲',
    mascot: 'code',
    tip: '大肥鱼划重点：DoPattern 7 空考前必默写：%360、+=360、(Cos,Sin)、pos+displacement、%=patternArray.Count、0、monster.anchoredPosition=pos！',
    demos: ['pattern_move'],
    labs: [
      {
        id: 'lab-t-pattern',
        engine: 'pattern',
        title: '模式移动轨迹剧场（矩形 / 六边形 / 五角星 / 锯齿 / 随机参数）',
        defaultMode: 'rect',
        modes: [
          { key: 'rect', label: '矩形巡逻 (控制指令法)' },
          { key: 'hex', label: '正六边形' },
          { key: 'star', label: '五角星 (右转144°)' },
          { key: 'zigzag', label: '锯齿形 (模式指令法)' },
          { key: 'random', label: '随机参数模式' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card span-2">
          <div class="kp-card-head">
            <h3>模式移动两种实现机制深度对比与随机化辨析</h3>
            <span class="exam-tag code">概念对比 + 7空默写</span>
          </div>
          <p style="font-size:13.5px;color:var(--text-sec);margin-bottom:10px"><strong>定义与特点</strong>：角色按开发者预先设计好的路径或指令序列循环移动（预设性、循环性、简易性、“伪智能”）。相比动态寻路/状态机/行为树，<strong>实现更简单、计算开销极小</strong>，广泛用于 RPG 守卫巡逻、塔防敌人与 STG 弹幕轨迹。</p>
          <table class="compare-table">
            <thead>
              <tr><th>对比维度</th><th>方法一：控制指令法 (ControlData)</th><th>方法二：模式指令法 (InstructionData)</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>数据封装</strong></td><td>单个类同时存储 4 属性：<strong>前进距离、后退距离、左转角度、右转角度</strong>（可复合动作）</td><td>模拟汇编指令：<strong>InstructionType 枚举类型 + float 操作数</strong>（单一原子动作）</td></tr>
              <tr><td><strong>执行机制</strong></td><td>每帧统一公式算角度、位置，累加 <code>stepDistance</code> 达标即切下一条指令</td><td>在游戏主循环中通过 <code>switch (current.type)</code> 分发执行不同指令</td></tr>
              <tr><td><strong>优缺点与场景</strong></td><td>执行逻辑统一简洁、适合矩形/六边形/圆形等连续几何路径；扩展新动作需改类</td><td>指令语义极清晰、易扩展暂停/攻击等多样动作；分支结构稍分散</td></tr>
              <tr><td><strong>引入随机因素</strong></td><td colspan="2"><strong>① 参数随机化</strong>：用 <code>Random.Range(100f, 200f)</code> 随机距离或角度；<strong>② 模式库随机选择</strong>：预置多套模式数组运行时随机抽取。<br>考场辨析：加入随机因素后行为更具多样性，但<strong>依然严格运行在预设框架规则内</strong>，并非完全失控不可预测。</td></tr>
            </tbody>
          </table>
          <div class="formula-box" style="margin-top:12px">
DoPattern 真题 7 空速记：
① monsterAngle = monsterAngle % 360;            ② if (monsterAngle &lt; 0) monsterAngle += 360;
③ Vector2 v = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));   (angle = monsterAngle * Mathf.Deg2Rad)
④ pos = pos + displacement;                     ⑤ curIndex %= patternArray.Count;
⑥ stepDistance = 0;                             ⑦ monster.anchoredPosition = pos;
          </div>
        </div>
      </div>
    `
  },

  /* ---------- 模块三 (3.1, 3.2, 3.3) ---------- */
  {
    id: 't_tilemap',
    mod: 'm3',
    num: '3.1',
    short: '3.1 TileMap 与八连通域',
    title: '3.1 TileMap 瓦片地图数据结构、像素换算与八连通域编号',
    tag: '计算 + 填空必考',
    lectures: '第 7 讲',
    mascot: 'search',
    tip: '大肥鱼划重点：行列转像素中心千万别漏掉 +32（半格偏移）！八方向 0~7 从正右方开始顺时针递增！',
    demos: ['tilemap_coords'],
    labs: [
      {
        id: 'lab-t-tilemap',
        engine: 'basic_path',
        title: 'TileMap 瓦片坐标与八连通域交互演示（点击网格改障碍）',
        defaultMode: 'tilemap',
        modes: [
          { key: 'tilemap', label: 'TileMap 坐标转换' },
          { key: 'wall', label: '八方向方位实战' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>TileMap 瓦片地图与坐标双向换算</h3>
            <span class="exam-tag hot">计算 + 填空必考</span>
          </div>
          <div class="formula-box">
二维数组映射: map[row, col]   (0 = 空地可通行, 1 = 墙壁障碍, 2/3 = 草地/水域)
像素 → 行列:  col = (int)x / 64,        row = (int)y / 64
行列 → 中心:  x = col * 64 + 32,        y = row * 64 + 32    [千万别漏 +32 !]
          </div>
          <ul class="kp-list">
            <li><strong>核心思想</strong>：将连续的 2D 游戏世界离散化为等大小瓦片网格，通过查二维数组 <code>map[row, col]</code> 在 O(1) 时间内判断碰撞与地形属性。</li>
            <li><strong>坐标转换易错例题</strong>：瓦片尺寸 64×64，角色像素坐标 <code>(128, 192)</code> ⇒ <code>col = 128/64 = 2</code>，<code>row = 192/64 = 3</code>，即<strong>行号=3，列号=2</strong>（牢记 col 对应 x、row 对应 y！）。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>八连通域偏移与 0~7 顺时针方位编号</h3>
            <span class="exam-tag blue">寻路代码地基</span>
          </div>
          <ul class="kp-list">
            <li><strong>四连通 vs 八连通</strong>：四连通只允许上下左右 4 邻格；<strong>八连通</strong>允许加上 4 个对角方向，共 8 个邻格。</li>
            <li><strong>坐标系方向注意</strong>：课程采用 X 向右增、Y 向上增的坐标系，故当前格 <code>(10, 10)</code> 的左下角邻格坐标为 <code>(9, 9)</code>，右上角为 <code>(11, 11)</code>。</li>
            <li><strong>八方向顺时针编号 (0~7)</strong>：以面朝正右方为 0 号正前方，顺时针依次为：
              <br><code>0(右) → 1(右下) → 2(下/右手) → 3(左下) → 4(左/后) → 5(左上) → 6(上/左手) → 7(右上)</code>。</li>
          </ul>
          <div class="trap-callout">考场速记：后续「绕行障碍物」「沿路径走」「沿墙走」的 <code>dirs[0..7]</code> 与 <code>(dir ± 2 + 8) % 8</code> 全都依赖这套 0~7 顺时针编码！</div>
        </div>
      </div>
    `
  },

  {
    id: 't_avoid',
    mod: 'm3',
    num: '3.2',
    short: '3.2 随机避障与绕行障碍物',
    title: '3.2 随机移动避障 (RandomMoving) 与绕行障碍物深度对比',
    tag: '作答 + 编程原题',
    lectures: '第 7–8 讲',
    mascot: 'think',
    tip: '大肥鱼划重点：简答题极爱考“随机避障 vs 绕行障碍物”！核心差异是绕行必须记录【已访问格子】防死循环，而随机避障不记路！',
    demos: ['random_bypass'],
    labs: [
      {
        id: 'lab-t-avoid',
        engine: 'basic_path',
        title: '绕行障碍物 vs 随机移动避障实时对比（点击网格可设障碍）',
        defaultMode: 'bypass',
        modes: [
          { key: 'bypass', label: '绕行障碍物 (防死循环)' },
          { key: 'random', label: '随机移动避障' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>算法一：随机移动避障 (Tracing ↔ RandomMoving)</h3>
            <span class="exam-tag code">编程填空原题</span>
          </div>
          <ul class="kp-list">
            <li><strong>两态闭环流程</strong>：初始为追踪状态 <code>Tracing</code>；沿直线朝目标试探下一位置 <code>pos</code>，可通行则更新位置并判终点，<strong>碰撞则切换为 RandomMoving</strong>。</li>
            <li><strong>随机状态执行</strong>：若需行走步长 <code>monsterNeedMoveDis == 0</code>，则随机选一个无障角度并设定固定步长（如 50）；每帧前进并累加 <code>monsterMovedDis += displacement.magnitude</code>；走满步长则切回 <code>Tracing</code> 并重算指向玩家的归一化速度；<strong>若随机行走中途再次撞障，则将 monsterNeedMoveDis 清零，下帧重选随机角</strong>。</li>
            <li><strong>特点与适用</strong>：代码最简、几乎零额外内存；<strong>适用开阔少障碍场景（城镇漫游）</strong>，在狭窄复杂迷宫极易反复震荡或卡死。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>算法二：绕行障碍物（边绕边寻 + 访问记录防死锁）</h3>
            <span class="exam-tag hot">按要求作答核心</span>
          </div>
          <ul class="kp-list">
            <li><strong>核心思想</strong>：朝目标直行，遇障碍获取障碍物相对方位 <code>dir</code>，按顺时针或逆时针顺序检查 <code>next = (dir + n) % 8 (n = 0..7)</code>，选择<strong>无障碍且未访问过</strong>的邻格移动。</li>
            <li><strong>防死循环关键机制</strong>：必须维护<strong>已访问格子集合 (visited)</strong>，避免在障碍边缘左右横跳陷入原地死循环；同时每步持续检测目标方向是否已通畅以尽快脱离绕行回归直奔目标。</li>
          </ul>
          <table class="compare-table" style="margin-top:8px">
            <thead>
              <tr><th>对比维度</th><th>随机移动避障</th><th>绕行障碍物</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>防死循环</strong></td><td>不记录历史路径，靠随机跳出</td><td><strong>必须记录已访问格子</strong>防重复震荡</td></tr>
              <tr><td><strong>内存/复杂度</strong></td><td>实现最简单、内存开销极低</td><td>实现较复杂、需存储访问记录</td></tr>
              <tr><td><strong>局限与场景</strong></td><td>开阔少障；复杂迷宫易盲目打转</td><td>多障/中等迷宫稳定，但<strong>遇深死胡同仍可能卡死</strong></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `
  },

  {
    id: 't_follow_wall',
    mod: 'm3',
    num: '3.3',
    short: '3.3 沿路径走、沿墙走与路点',
    title: '3.3 沿路径走权重算法、八方向沿墙走与路点 / 面包屑导航',
    tag: '真题重考 + 编程必背',
    lectures: '第 8–9 讲',
    mascot: 'code',
    tip: '大肥鱼划重点：八方向左手 (curDir-2+8)%8 顺时针、右手 (curDir+2)%8 逆时针！doWallTracing 与 doPathFollowing 都是真题原题！',
    demos: ['wall_tracing', 'path_following'],
    labs: [
      {
        id: 'lab-t-follow',
        engine: 'basic_path',
        title: '沿墙走 (左/右手优先) 与沿路径走 (8邻域权重) 实验室',
        defaultMode: 'wall',
        modes: [
          { key: 'wall', label: '沿墙走 (左/右手优先)' },
          { key: 'pathfollow', label: '沿路径走 (8邻域权重)' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>沿路径走 (Path Following) 两种动态赋权法</h3>
            <span class="exam-tag code">实验 + 编程填空</span>
          </div>
          <ul class="kp-list">
            <li><strong>方法一（先地形后方向）</strong>：先判 8 邻格可通行性（通行赋 +10、障碍赋 -10），再根据邻格与当前前进方向的远近微调权重。</li>
            <li><strong>方法二（先夹角后碰撞，代码标准版）</strong>：先按与当前朝向的夹角对 8 个方向赋初始权值 <code>10, 9, 8, 7, 6, 7, 8, 9</code>（正前方最大为 10，正后方最小为 6），再遍历 8 方向对不可通行的障碍格执行 <code>weight[i] -= 10</code>，最后选取 <strong>maxWeight</strong> 最大方向前进。</li>
            <li><strong>局限性</strong>：无全局回溯栈，面对封闭死胡同时仍易原地来回或卡死。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>沿墙走 (Wall Tracing) + 路点导航与面包屑</h3>
            <span class="exam-tag hot">真题重考两次</span>
          </div>
          <div class="formula-box">
四方向左手定则优先级:  左 → 前 → 右 → 后
八方向左手优先起始:    (curDir - 2 + 8) % 8   [顺时针试探 8 格，+8防负数取模!]
八方向右手优先起始:    (curDir + 2) % 8       [逆时针试探 8 格: i = dir+2 递减]
          </div>
          <ul class="kp-list">
            <li><strong>沿墙走优势与缺陷</strong>：非常适合未知结构迷宫贴墙遍历；但在<strong>空旷无墙区域会因摸不到墙而持续原地打转绕圈</strong>，改进方案是结合随机/直线探索直至重新遇墙。</li>
            <li><strong>路点导航 (Waypoint)</strong>：在地图关键转折处预置路点图，最大优势是<strong>性能极高、路线精准可控、极少死循环</strong>（现代 3D 游戏进一步演化为导航网格 NavMesh）。</li>
            <li><strong>面包屑寻路 (Breadcrumb)</strong>：玩家移动时按时间戳不断掉落隐形路标，AI 沿最新时间戳追踪；<strong>极度依赖目标移动轨迹，不适合单独使用，常与 A* 组合</strong>。</li>
          </ul>
        </div>
      </div>
    `
  },

  /* ---------- 模块四 (4.1, 4.2, 4.3) ---------- */
  {
    id: 't_dfs_bfs',
    mod: 'm4',
    num: '4.1',
    short: '4.1 DFS / BFS 与 Dijkstra',
    title: '4.1 深度优先 (DFS)、广度优先 (BFS) 与 Dijkstra 带权寻路',
    tag: '简答 + 编码双必考',
    lectures: '第 10–11 讲',
    mascot: 'search',
    tip: '大肥鱼划重点：DFS 用栈(FILO)不保证最短路；BFS 用队列(FIFO)保证无权图最短路；Dijkstra 用最小堆保证非负带权最短路（BFS 是其特例）！',
    demos: ['dfs_bfs'],
    labs: [
      {
        id: 'lab-t-graph',
        engine: 'graph_search',
        title: '图搜索三巨头对比舞台（实时查看 栈 / 队列 / 优先队列）',
        defaultMode: 'bfs',
        modes: [
          { key: 'bfs', label: 'BFS 广度优先 (队列 FIFO)' },
          { key: 'dfs', label: 'DFS 深度优先 (栈 FILO)' },
          { key: 'dijkstra', label: 'Dijkstra 带权图 (最小堆)' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>深度优先搜索 (DFS)：递归 vs 非递归</h3>
            <span class="exam-tag code">简答 + 编码必考</span>
          </div>
          <ul class="kp-list">
            <li><strong>核心隐喻</strong>：阿里阿德涅线团——“一路走到黑，不通就回头”（纵深探索 + 回溯），依赖<strong>栈 (Stack, FILO)</strong> 与 <code>visited</code> 防重数组。</li>
            <li><strong>递归实现</strong>：隐式使用系统函数调用栈，代码极简直观；缺点是搜索极深时可能<strong>栈溢出 (Stack Overflow)</strong> 且有函数调用开销。</li>
            <li><strong>非递归实现</strong>：手动建栈，步骤为 <code>建栈压入起点 → 栈非空弹栈顶判终点 → 标已访 → 可通未访邻接点记父入栈</code>；无栈溢出风险、效率更高。</li>
            <li><strong>路径回溯生成</strong>：搜索访问过的格子并非全在最终路径上，抵达终点后需沿 <code>node.parent</code> 倒推至起点再 <code>path.Reverse()</code> 反转输出。</li>
            <li><strong>核心局限</strong>：DFS <strong>不保证找到最短路径</strong>；适合迷宫生成、连通性检测、内存受限场景。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>广度优先搜索 (BFS) 与 Dijkstra 带权寻路</h3>
            <span class="exam-tag hot">填空 + 对比高频</span>
          </div>
          <ul class="kp-list">
            <li><strong>BFS 标准定义（填空原句）</strong>：是一种<strong>分层（分级）</strong>的搜索过程，按<strong>先访问的节点先展开</strong>的方式扩展，借助<strong>队列 (Queue, FIFO)</strong> 记录先后顺序。</li>
            <li><strong>BFS 优缺点</strong>：在<strong>无权图（等权图）</strong>中首次到达终点即<strong>严格保证找到边数最少的最短路径</strong>；缺点是需同时保存整层待扩节点，内存占用较大。</li>
            <li><strong>Dijkstra 算法（非负带权图）</strong>：当不同地形移动耗费不同（草地 10、沼泽 35）时，BFS 只看步数会失效。Dijkstra 借助<strong>贪心 + 优先队列（最小堆）+ 松弛操作</strong>（若 <code>新总代价 &lt; 原代价</code> 则更新代价与父节点并入队），确保总权重最小。</li>
            <li><strong>黄金特例结论</strong>：<strong>BFS 是 Dijkstra 算法在所有边权重相等时的特例</strong>（同时 Dijkstra 也是 A* 中 <code>h(n)=0</code> 时的特例）。</li>
          </ul>
        </div>
      </div>
    `
  },

  {
    id: 't_astar_core',
    mod: 'm4',
    num: '4.2',
    short: '4.2 A* 原理、可采纳与手算',
    title: '4.2 A* 启发式搜索原理、可采纳性证明与经典 28/42 格手算',
    tag: '期末压轴必考',
    lectures: '第 12 讲',
    mascot: 'search',
    tip: '大肥鱼划重点：牢记格内三数位「左上 f、左下 g、右下 h」、直走 10 斜走 14、可采纳条件 h(n) ≤ h*(n) 绝不高估真实代价！',
    demos: ['astar_core'],
    labs: [
      {
        id: 'lab-t-astar-core',
        engine: 'astar',
        title: 'A* 透视单步手算推演引擎（切换 42 格课件题 / 28 格真题）',
        defaultMode: 'exam',
        modes: [
          { key: 'exam', label: '真题填空28格 (A8→B19)' },
          { key: 'ppt', label: '课件经典42格 (M15→P19)' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>A* 数学估价函数与可采纳性 (Admissibility)</h3>
            <span class="exam-tag hot">绝对必考公式</span>
          </div>
          <div class="formula-box">
核心估价函数:  f(n) = g(n) + h(n)   【格内记法：左上 = f(n)，左下 = g(n)，右下 = h(n)】
• g(n) = 起点到节点 n 的已走实际代价（正交直走 +10，对角斜走 +14）
• h(n) = 节点 n 到终点的启发预估代价：
    - 曼哈顿距离: (|x₂ - x₁| + |y₂ - y₁|) × 10
    - 欧氏距离:   √((x₂ - x₁)² + (y₂ - y₁)²) × 10
• 最优解前提 — 可采纳性: h(n) ≤ h*(n)  （估算值绝不高估真实最短代价！）
          </div>
          <ul class="kp-list">
            <li><strong>h(n) 极端退化辨析</strong>：当 <code>h(n) = 0</code> 时 A* 退化为盲目扩散的 <strong>Dijkstra 算法</strong>（保证最优但慢）；当 <code>h(n) &gt; h*(n)</code> 过高估时退化为贪婪最佳优先搜索（极快但<strong>不保证最优</strong>）。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>Open / Close 双列表辨析与考场手算规范</h3>
            <span class="exam-tag code">手算 28/42 格必读</span>
          </div>
          <ul class="kp-list">
            <li><strong>Open List（开放列表）</strong>：存放已生成、<strong>待考察</strong>的候选节点，每轮从中取出 <code>f(n)</code> 最小的节点进行扩展。</li>
            <li><strong>Close List（关闭列表）</strong>：存放<strong>已处理完成</strong>的节点，通常不再重复扩展。</li>
            <li><strong>高频判断题陷阱</strong>：最终最优路径上的所有节点<strong>必然都在 Close 表中</strong>，但 Close 表中的节点<strong>不一定都在最终路径上</strong>；当存在多条等长最优路径或 8 邻域遍历方向不同时，<strong>A* 找到的最优路径可以不唯一</strong>。</li>
          </ul>
          <div class="worked-example">
            <div class="worked-example-title">考场手算三步防错法（务必配合下方单步动画演练！）</div>
            1. 每次从 Open 选 <strong>f 最小</strong>的格移入 Close；<br>
            2. 展开其可通行且不在 Close 的邻格：新格算 g/h/f 并标父箭头；<strong>已在 Open 的格必须比较 newG 与旧 g，仅当 newG 更小时才更新 g/f 并改指父指针！</strong><br>
            3. 终点进入 Open/Close 后，从终点沿父指针逆推并反转写出完整路径编号。
          </div>
        </div>
      </div>
    `
  },

  {
    id: 't_astar_opt',
    mod: 'm4',
    num: '4.3',
    short: '4.3 A* 流程与七大优化策略',
    title: '4.3 A* 标准 10 步主循环（真题排序）与七大工程优化策略',
    tag: '排序 + 简答必考',
    lectures: '第 13 讲',
    mascot: 'exam',
    tip: '大肥鱼划重点：熟记 A* 10 步主循环真题排序口诀 CBADEGFHMN，以及七大工程优化（优先队列最小堆、f同选h小、影响力映射等）！',
    demos: ['astar_opt'],
    labs: [
      {
        id: 'lab-t-astar-opt',
        engine: 'astar',
        title: 'A* 优化引擎演示（F 同选 H 小 + 敌方火力影响力映射避让）',
        defaultMode: 'opt',
        modes: [
          { key: 'opt', label: '优化版: F同选H小 + 影响力映射' },
          { key: 'ppt', label: '对比基础版 42 格' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>A* 标准 10 步主循环与三大性能瓶颈</h3>
            <span class="exam-tag hot">真题排序 CBADEGFHMN</span>
          </div>
          <ul class="kp-list">
            <li><strong>标准 10 步执行顺序</strong>：
              <br>① 起点入 Open → ② 循环判 Open 非空（空则寻路失败）→ ③ 取 Open 中 <code>f</code> 最小节点 <code>pNode</code> → ④ 若 <code>pNode == 终点</code> 则沿父回溯反转保存路径结束 → ⑤ 将 <code>pNode</code> 移出 Open 放入 Close → ⑥ 遍历 <code>pNode</code> 的 8 邻接点 <code>pAdj</code> → ⑦ 若不可通或已在 Close 则忽略 → ⑧ 若不在 Open 则计算 g/h/f 设父节点并入 Open → ⑨ 若已在 Open，计算经 <code>pNode</code> 到达的新 <code>newG</code>，<strong>若 newG 更小则更新 g/f 并改父为 pNode</strong> → ⑩ 回到循环头部继续。</li>
            <li><strong>基础 A* 三大性能瓶颈</strong>：① 线性扫描 Open 表查找最小 f 耗时 <code>O(n)</code>；② 大地图最坏时空复杂度指数级 <code>O(b^d)</code>；③ 高度依赖启发函数质量与动态地形变化。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>A* 七大工程级优化策略全解</h3>
            <span class="exam-tag code">简答大题高分点</span>
          </div>
          <ul class="kp-list">
            <li><strong>① 优先队列 / 二叉最小堆 (Min-Heap)</strong>：将 Open 表查找最小 f 从 O(n) 降至 <strong>O(log n)</strong>。</li>
            <li><strong>② F 值相同时优先选 H 更小 (Tie-Breaking)</strong>：复合优先级键 <code>f * 1000000 + h</code>，减少同层冗余扩展，直扑终点。</li>
            <li><strong>③ Close 列表动态重开</strong>：非一致启发函数或动态权变时，若发现更短路径允许节点重新移回 Open。</li>
            <li><strong>④ 双向 A* (Bidirectional A*)</strong>：从起点与终点同时相向搜索，相遇即拼接，大幅缩小搜索面积。</li>
            <li><strong>⑤ 多样化地形代价</strong>：将泥沼/山地/道路成本叠加至 <code>g(n)</code>，选耗时最短而非仅物理距离最短路径。</li>
            <li><strong>⑥ 影响力映射 (Influence Map)</strong>：将敌方火力危险区量化为<strong>正惩罚</strong>、掩体/补给点量化为<strong>负奖励</strong>融入 g 值，实现智能趋利避害。</li>
            <li><strong>⑦ 分层寻路与局部避障</strong>：宏观用分层 HPA* / 路点 / NavMesh，微观用局部 <strong>ORCA</strong> 躲避动态人群 + 路径拉直平滑。</li>
          </ul>
        </div>
      </div>
    `
  },

  /* ---------- 模块五 (5.1, 5.2) ---------- */
  {
    id: 't_fsm_std',
    mod: 'm5',
    num: '5.1',
    short: '5.1 FSM 四要素与迁移图/表',
    title: '5.1 有限状态机 (FSM) 四要素、画图规范与三大经典案例',
    tag: '填空 + 画图必考',
    lectures: '第 14 讲',
    mascot: 'teach',
    tip: '大肥鱼划重点：FSM 四要素严格按序背诵「状态、初始状态、输入、转换」！状态迁移图必须画出实心黑点初始入口 ●→ 与每条边上的触发事件！',
    demos: ['fsm_switch'],
    labs: [
      {
        id: 'lab-t-fsm-std',
        engine: 'fsm',
        title: '三大经典有限状态机交互迁移舞台（点击事件按钮观察光束流转）',
        defaultMode: 'guard',
        modes: [
          { key: 'guard', label: '游戏守卫 AI (4态)' },
          { key: 'blinky', label: '吃豆人 Blinky (5态经典)' },
          { key: 'ant', label: '蚂蚁世界 (4态闭环)' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>FSM 数学模型、四要素与规范画图标准</h3>
            <span class="exam-tag hot">填空 + 画图必考</span>
          </div>
          <div class="formula-box">
课件严格四要素顺序：① 状态  ② 初始状态  ③ 输入（输入事件）  ④ 转换（转换函数）
（可选第 5 要素：动作）  核心运转公式：(初始)状态 + 输入事件 → 转换 + 动作
          </div>
          <ul class="kp-list">
            <li><strong>四大数学特性</strong>：<strong>有限性</strong>（状态数量有限可数）、<strong>互斥性</strong>（任一时刻只能处于唯一一种状态）、<strong>确定性</strong>（当前状态与输入唯一决定下态）、<strong>完整性</strong>。</li>
            <li><strong>状态迁移图 (STD) 画图采分规范</strong>：① 圆圈 <code>○</code> 表示离散状态；② <strong>实心圆点带箭头 ●→ 指向初始状态</strong>（漏画必扣分！）；③ 有向箭头 <code>→</code> 表示状态转换；④ 每条箭头旁必须标明触发<strong>输入事件名</strong>。</li>
            <li><strong>状态迁移表 (STT)</strong>：二维表格列出「当前状态 × 输入事件 → 下一状态」，结构清晰，可直接映射为代码跳转表。</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>三大考场经典 FSM 案例速背（大题直接默画）</h3>
            <span class="exam-tag blue">简答画图原题</span>
          </div>
          <ul class="kp-list">
            <li><strong>案例 1：游戏守卫 (4 态)</strong>：<strong>●→ 巡逻 (Patrol)</strong> —[发现玩家]→ <strong>追逐 (Chase)</strong> —[进入射程]→ <strong>攻击 (Attack)</strong>；脱离射程回追逐，玩家很远/丢失回巡逻；前 3 态任意时刻 [HP=0] → <strong>死亡 (Dead)</strong>。</li>
            <li><strong>案例 2：吃豆人 Blinky (5 态)</strong>：<strong>●→ 上升 (初始)</strong> —[走出迷宫中央]→ <strong>追逐玩家</strong>；[玩家死/再生] ↔ <strong>随机移动</strong>；[吃能量球/能量用尽] ↔ <strong>逃离玩家</strong>；逃离中被吃 → <strong>死亡(眼珠)</strong> —[回到中央]→ 上升。</li>
            <li><strong>案例 3：蚂蚁世界 (4 态)</strong>：<strong>●→ 饥饿(找食物)</strong> —[找到食物]→ <strong>回家</strong> —[回巢放下食物]→ <strong>口渴(找水)</strong> —[找到水源]→ <strong>饥饿</strong>；前 3 态碰到毒物 → <strong>死亡</strong>。</li>
          </ul>
        </div>
      </div>
    `
  },

  {
    id: 't_fsm_pattern',
    mod: 'm5',
    num: '5.2',
    short: '5.2 分支逻辑法 vs 状态模式',
    title: '5.2 分支逻辑法弊端与标准状态设计模式 (State Pattern) 编码',
    tag: '单选 / 简答 / 编码',
    lectures: '第 15 讲',
    mascot: 'code',
    tip: '大肥鱼划重点：ChangeState 严格三步「_currentState?.Exit(this) → _currentState = newState → _currentState.Enter(this)」考场默写一字不能错序！',
    demos: ['fsm_state_pattern', 'fsm_switch'],
    labs: [
      {
        id: 'lab-t-fsm-pat',
        engine: 'fsm',
        title: '状态设计模式 Exit → ChangeState → Enter 同步执行演示',
        defaultMode: 'guard',
        modes: [
          { key: 'guard', label: '守卫 Context + IState 切换' },
          { key: 'blinky', label: 'Blinky 多状态解耦演示' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>分支逻辑法 vs 状态设计模式核心对比</h3>
            <span class="exam-tag code">简答 + 架构必考</span>
          </div>
          <table class="compare-table">
            <thead>
              <tr><th>对比维度</th><th>分支逻辑法 (switch / if-else)</th><th>状态设计模式 (State Pattern)</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>代码组织</strong></td><td>全塞在角色的 <code>Update()</code> 一个庞大 <code>switch</code> 中</td><td>拆分为 <strong>Context + 抽象接口 IState + 独立具体状态类</strong></td></tr>
              <tr><td><strong>扩展性/维护</strong></td><td>状态增多后沦为高耦合“面条代码”，<strong>违背开闭原则</strong></td><td>新增状态只需加新类，<strong>符合单一职责与开闭原则</strong></td></tr>
              <tr><td><strong>局限与取舍</strong></td><td>仅 2~3 个极简状态时轻量快捷</td><td>状态过多时易出现<strong>类数量激增</strong>（可结合 HFSM 解耦）</td></tr>
            </tbody>
          </table>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>状态设计模式三大角色与生命周期三步曲</h3>
            <span class="exam-tag hot">编码大题模板</span>
          </div>
          <ul class="kp-list">
            <li><strong>1. IState（抽象状态接口）</strong>：统一声明 <code>Enter(Monster m)</code>、<code>Execute(Monster m)</code>、<code>Exit(Monster m)</code> 三个生命周期方法。</li>
            <li><strong>2. Context（环境上下文类，如 Monster）</strong>：持有 <code>private IState _currentState</code>，<code>Update()</code> 委托执行 <code>_currentState?.Execute(this)</code>，并提供 <code>ChangeState(IState newState)</code>。</li>
            <li><strong>3. ConcreteState（具体状态类，如 Patrol / RunAway）</strong>：封装各自状态行为，并将转换条件判断分散到对应状态类的 <code>Execute()</code> 中。</li>
            <li><strong>复杂状态机解耦策略</strong>：状态机分解、<strong>层次化状态机 (HFSM)</strong>、模块化设计。</li>
          </ul>
          <div class="formula-box">
ChangeState 标准三步曲（顺序绝对不可颠倒！）:
1. _currentState?.Exit(this);    // 退出旧状态，清理资源/停止动画
2. _currentState = newState;     // 切换状态对象引用
3. _currentState.Enter(this);    // 进入新状态，初始化状态变量
          </div>
        </div>
      </div>
    `
  },

  /* ---------- 模块六 (6.1, 6.2) ---------- */
  {
    id: 't_bt',
    mod: 'm6',
    num: '6.1',
    short: '6.1 行为树体系与并行中断',
    title: '6.1 行为树 (Behavior Tree) 节点体系、并行中断与 FSM 对比',
    tag: '单选 / 判断 / 压轴简答',
    lectures: '第 16 讲',
    mascot: 'exam',
    tip: '大肥鱼划重点：叶节点 = 条件 + 行为；顺序节点遇 Running 会下帧续跑无法中断，必须用【Parallel 并行节点 + Until Failure 修饰节点】解决！',
    demos: ['bt_tick'],
    labs: [
      {
        id: 'lab-t-bt',
        engine: 'bt',
        title: '行为树 Tick 决策与 Parallel 中断实时引擎（勾选条件看改道）',
        defaultMode: 'interrupt',
        modes: [
          { key: 'interrupt', label: '顺序中断难题 → Parallel + UntilFailure' },
          { key: 'combat', label: '战斗决策树 (Selector + Sequence)' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card">
          <div class="kp-card-head">
            <h3>行为树 (BT) 节点体系与 Tick 执行机制详解</h3>
            <span class="exam-tag hot">单选 / 判断 / 简答</span>
          </div>
          <ul class="kp-list">
            <li><strong>整体架构</strong>：<strong>树状</strong>数据结构，每帧 (Tick) 从<strong>根节点 (Root)</strong> 遍历，子节点向上返回 <code>Success / Failure / Running</code>。根节点仅有唯一子节点，<strong>绝不能是叶节点</strong>，真正的判断与动作都在<strong>叶节点</strong>上。</li>
            <li><strong>叶节点（执行单元，2 类）</strong>：
              <br>• <strong>条件节点 (Condition)</strong>：类似 <code>if</code> 判断（如“看到玩家？”），不改变游戏状态，只返回 <code>Success / Failure</code>，<strong>不执行移动或攻击</strong>。
              <br>• <strong>行为节点 (Action)</strong>：执行具体动作（移动、攻击、播动画），可一帧完成或多帧持续执行并返回 <code>Running</code>。</li>
            <li><strong>组合节点（控制流，4 类）</strong>：
              <br>• <strong>选择节点 Selector (?)</strong>：从左到右试探，遇 <code>Success / Running</code> 立即返回；全失败才返 Failure。
              <br>• <strong>顺序节点 Sequence (→)</strong>：从左到右依次执行，遇 <code>Failure</code> 立即失败；遇 <code>Running</code> <strong>记住该节点并在下次迭代继续执行</strong>（故不具备中断能力）。
              <br>• <strong>并行节点 Parallel (⇉)</strong>：同时执行所有子节点，<strong>任一返 Failure 立即终止全部</strong>，全 Success 才返 Success。
              <br>• <strong>随机选择节点</strong>：每次随机排列子节点访问顺序。</li>
            <li><strong>修饰节点 Decorator (◇)</strong>：仅含 1 个子节点，修改其执行方式，如 <code>Until Failure</code>（循环执行直到失败）、<code>Until Success</code>。搭配 Parallel 实现<strong>持续条件监控与实时抢占中断</strong>！</li>
          </ul>
        </div>

        <div class="kp-card">
          <div class="kp-card-head">
            <h3>顺序中断压轴题 + 行为树 vs FSM 深度对比</h3>
            <span class="exam-tag blue">高频压轴题</span>
          </div>
          <div class="worked-example" style="margin-top:0;margin-bottom:10px">
            <div class="worked-example-title">期末大题满分链条：如何中断正在 Running 的移动攻击？</div>
            <strong>痛点</strong>：Sequence 记住正在 <code>Running</code> 的“移动到玩家”，下帧直接续跑并跳过前置条件“看到玩家？”，玩家消失也无法打断。<br>
            <strong>解法</strong>：用 <strong>Parallel 并行节点</strong> 同时驱动两路：① <code>Until Failure</code> 修饰节点包裹“看到玩家？”持续监测；② <code>Sequence(移动→攻击)</code>。<br>
            <strong>原理</strong>：玩家一旦消失 → 条件返 Failure → <code>Until Failure</code> 结束返 Failure → <strong>Parallel 立刻终止全部子节点</strong>！
          </div>
          <table class="compare-table">
            <thead>
              <tr><th>对比维度</th><th>有限状态机 (FSM)</th><th>行为树 (BT)</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>数据结构</strong></td><td>图状结构（节点 + 有向转换边）</td><td>分层树状结构（Root → 组合 → 叶）</td></tr>
              <tr><td><strong>模块化与扩展</strong></td><td>状态间易耦合，复杂时发生<strong>状态爆炸</strong></td><td>节点高度解耦、<strong>子树可直接复用</strong>、极易扩展</td></tr>
              <tr><td><strong>并发与中断</strong></td><td>单时刻单状态，并行与中断实现困难</td><td><strong>原生支持并行 (Parallel)</strong>，每帧遍历抢占强</td></tr>
              <tr><td><strong>工程最佳实践</strong></td><td colspan="2"><strong>FSM + BT 混用</strong>：FSM 管理宏观大状态（战斗 / 非战斗），BT 管理微观具体战术决策。</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `
  },

  {
    id: 't_boids',
    mod: 'm6',
    num: '6.2',
    short: '6.2 Boids 群组三大法则',
    title: '6.2 群组行为 (Boids 模型) 三大法则、调参实战与群智能算法',
    tag: '考纲核心',
    lectures: '第 17 讲',
    mascot: 'trophy',
    tip: '大肥鱼划重点：1986 Craig Reynolds 提出 Boids！背熟三大法则（分离避碰撞、对齐跟均速、聚集向质心）与“正常巡游 vs 惊慌逃散”调参组合！',
    demos: ['boids_flocking'],
    labs: [
      {
        id: 'lab-t-boids',
        engine: 'boids',
        title: 'Boids 群组行为 60fps 物理沙盒（支持鼠标拖动吸引/驱散 + 点击放大）',
        defaultMode: 'cruise',
        modes: [
          { key: 'cruise', label: '正常巡游 (高聚集+高对齐)' },
          { key: 'panic', label: '惊慌逃散 (极高分离)' },
          { key: 'align', label: '纯队列演示 (高对齐)' }
        ]
      }
    ],
    html: `
      <div class="kp-grid">
        <div class="kp-card span-2">
          <div class="kp-card-head">
            <h3>群组行为 (Boids 模型) 三大法则与参数调优实战</h3>
            <span class="exam-tag hot">考纲核心</span>
          </div>
          <div class="formula-box">
1986 年 Craig Reynolds 提出 Boids 模型 · 四大特征：去中心化、自组织、鲁棒性、灵活性（局部简单规则涌现全局智慧）
加权合成公式：最终速度 = separation × w₁ + alignment × w₂ + cohesion × w₃
          </div>
          <table class="compare-table">
            <thead>
              <tr><th>核心规则</th><th>准确定义</th><th>三步实现逻辑</th><th>权重调优效果与实战应用</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>1. 分离 (Separation)</strong></td><td>避免与邻近个体过于拥挤或碰撞，保持安全间距</td><td>感知分离半径内邻居 → 计算排斥向量（<strong>距离越近斥力越强，成反比</strong>）→ 叠加合力</td><td>调高 → 极度分散（<strong>惊慌逃散</strong>配置：分离极高、聚集/对齐极低）</td></tr>
              <tr><td><strong>2. 对齐 / 队列 (Alignment)</strong></td><td><strong>朝着同伴的平均速度方向移动</strong>，使群体形成有序流动</td><td>感知对齐半径内邻居 → 求邻居平均速度向量 → <code>平均速度 - 当前速度</code> 产生转向力</td><td>调高 → 航向高度统一（鸟群迁徙、《全面战争》方阵推进）</td></tr>
              <tr><td><strong>3. 聚集 (Cohesion)</strong></td><td>朝着附近同伴的平均位置（<strong>质心</strong>）移动，防止群体分裂</td><td>感知聚集半径内邻居 → 求邻居坐标平均值(质心) → 指向质心求转向力</td><td>调高 → 紧密抱团（<strong>海洋鱼群正常巡游</strong>：高聚集 + 高对齐 + 中分离）</td></tr>
            </tbody>
          </table>
          <div class="worked-example">
            <div class="worked-example-title">拓展群智能优化算法速览（了解概念）</div>
            <strong>蚁群算法 (ACO)</strong>：模拟蚂蚁释放信息素正反馈寻找最短路径；<strong>粒子群优化 (PSO)</strong>：模拟鸟群觅食，结合个体历史最优 <code>pBest</code> 与群体全局最优 <code>gBest</code> 更新速度；<strong>鱼群算法 (FSA)</strong>：模拟觅食、聚群、追尾行为。
          </div>
        </div>
      </div>
    `
  }
];
