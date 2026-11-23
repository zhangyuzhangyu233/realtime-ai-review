/* ==========================================================================
   Comprehensive Exam Question Bank (Aligned with 知识要点-考试题型.pptx & Word Bank)
   Types: 'single' (单选), 'tf' (判断), 'fill' (填空), 'essay' (按要求作答), 'code' (编程题)
   EVERY question includes an interactive animation spec (`anim`) in its explanation!
   ========================================================================== */
window.QUESTION_BANK = [
  /* ==================== 一、单项选择题 (36题，覆盖全部真题+考纲核心) ==================== */
  {
    id: 's1', topic: 't_mechanics', demo: 'car_friction', type: 'single', module: 'm1', tag: '真题原题',
    stem: '以 2 牛顿的力去推一个 1 公斤的冰块，冰块获得了瞬间加速度，3 秒之后，冰块移动了多远？（不考虑摩擦力）',
    options: ['1 米', '4.5 米', '3 米', '9 米'], answer: 3,
    explain: '由牛顿第二定律 F = ma 得加速度 a = 2 / 1 = 2 m/s²；静止出发初速度 v₀ = 0，由位移公式 s = v₀t + ½at² = 0 + 0.5 × 2 × 3² = 9 米。',
    anim: { engine: 'physics', mode: 'friction', caption: '动态演示：无摩擦力下的匀加速位移增长过程' }
  },
  {
    id: 's2', topic: 't_unity', demo: 'dot_work', type: 'single', module: 'm1', tag: '真题原题',
    stem: '以下 Unity 中的向量，表示沿 X 轴正方向的向量是（ ）。',
    options: ['Vector3.up', 'Vector3.one', 'Vector3.zero', 'Vector3.right'], answer: 3,
    explain: 'Unity 中：Vector3.right = (1,0,0) 沿 X 轴；Vector3.up = (0,1,0) 沿 Y 轴；Vector3.forward = (0,0,1) 沿 Z 轴；one = (1,1,1)，zero = (0,0,0)。',
    anim: { engine: 'physics', mode: 'dot', params: { dotAngle: 0 }, caption: '动态演示：单位方向向量与坐标投影关系' }
  },
  {
    id: 's3', topic: 't_kinematics', demo: 'kinematics_parabola', type: 'single', module: 'm1', tag: '真题原题',
    stem: '瀑布特效也是一种简单的粒子系统，它利用（ ）的运动轨迹来驱动粒子运动。',
    options: ['余弦函数曲线', '以上都不是', '直线', '抛物线'], answer: 3,
    explain: '瀑布水流离开崖边时具有水平初速度且受竖直向下重力作用，符合标准抛物运动（平抛）轨迹。',
    anim: { engine: 'physics', mode: 'parabola', params: { v0: 18, deg: 25 }, caption: '动态演示：重力作用下的抛物线运动轨迹分解' }
  },
  {
    id: 's4', topic: 't_kinematics', demo: 'car_friction', type: 'single', module: 'm1', tag: '真题原题',
    stem: '赛车游戏中，一辆赛车正等待出发（v₀ = 0）。它的加速度向量是 [5, 0, -3]，不考虑摩擦力，出发 4 秒后，它的位移是多少？',
    options: ['[20, 0, -12]', '[40, 0, -24]', '[10, 0, -6]', '[748, 0, -32]'], answer: 1,
    explain: '向量位移公式 Δr = v₀t + ½at² = 0 + 0.5 × 4² × [5, 0, -3] = 8 × [5, 0, -3] = [40, 0, -24]。各分量独立运算即可！',
    anim: { engine: 'physics', mode: 'friction', caption: '动态演示：恒定加速度下的无摩擦加速运动' }
  },
  {
    id: 's5', topic: 't_unity', demo: 'dot_work', type: 'single', module: 'm1', tag: '真题易错',
    stem: '以下关于 Unity 游戏开发中常用工具类描述不正确的是（ ）。',
    options: [
      'Input Manager 用于管理游戏中的所有输入，包括键盘、鼠标和控制器。',
      'Random 类是 Unity 中用于产生随机数的类，不可以实例化，只有静态属性和静态方法。',
      'Time 类用于管理游戏中的计时器，如游戏时限、计分、倒计时等。',
      'Unity 中用 Vector 类来表示 3D 向量和点。'
    ], answer: 3,
    explain: 'Unity 中分别使用 Vector2 表示 2D 向量、Vector3 表示 3D 向量和点，并没有名为“Vector”的类表示 3D 向量。',
    anim: { engine: 'physics', mode: 'dot', caption: '动态演示：Unity Vector2 / Vector3 点积与方向计算' }
  },
  {
    id: 's6', topic: 't_mechanics', demo: 'reflect_wall', type: 'single', module: 'm1', tag: '真题高频',
    stem: '投篮游戏中，若篮球与水平边栏碰撞时的速度向量为 [6, 4]，则碰撞后篮球的速度向量为（ ）。',
    options: ['[6, -4]', '[4, 6]', '[-6, 4]', '[-6, -4]'], answer: 0,
    explain: '轴平行碰撞反射规律：与水平边界碰撞时，平行于边界的 x 分量不变，垂直于边界的 y 分量取反 → [6, -4]。',
    anim: { engine: 'physics', mode: 'reflect', params: { wallType: 'horizontal', slopeAngle: 0, vi: [6, 4] }, caption: '动态演示：[6, 4] 撞击水平边栏 → y分量反转为 [6, -4]！' }
  },
  {
    id: 's7', topic: 't_mechanics', demo: 'reflect_wall', type: 'single', module: 'm1', tag: '真题高频',
    stem: '一个物体与垂直墙面发生完全弹性碰撞，速度矢量为 [5, -3] m/s，反射后的速度是？（ ）',
    options: ['[5, 3]', '[5, -3]', '[-5, 3]', '[-5, -3]'], answer: 3,
    explain: '注意：超高频易错题！撞击垂直墙面时，只有垂直于墙面的 x 分量反向（5 → -5），平行于墙面的 y 分量保持不变（仍为 -3）→ [-5, -3]！',
    anim: { engine: 'physics', mode: 'reflect', params: { wallType: 'vertical', slopeAngle: 90, vi: [5, -3] }, caption: '动态演示：[5, -3] 撞击垂直墙面 → x反转、y不变 → [-5, -3]！' }
  },
  {
    id: 's8', topic: 't_unity', demo: 'pattern_move', type: 'single', module: 'm1', tag: '真题原题',
    stem: '以下关于 Transform 组件的作用描述不正确的是（ ）。',
    options: [
      '通过 Transform 组件，开发者可以轻松地调整游戏对象的位置、旋转和缩放。',
      'Rotate 函数是 Transform 组件的成员。',
      '场景中的每个对象都有一个 Transform 组件。',
      'Transform 组件在 Unity 中主要负责游戏对象的位置控制。'
    ], answer: 3,
    explain: 'Transform 同时负责位置 (Position)、旋转 (Rotation) 和缩放 (Scale) 三大核心变换，说“主要负责位置控制”过于片面，故 D 错误。',
    anim: { engine: 'pattern', mode: 'rect', caption: '动态演示：Transform 同时驱动角色的位置平移与朝向旋转' }
  },
  {
    id: 's9', topic: 't_kinematics', demo: 'dot_work', type: 'single', module: 'm1', tag: '真题原题',
    stem: '有两向量 v₁ 和 v₂，如果点积 v₁ · v₂ > 0，其中 v₁ 为单位向量，两向量夹角为 θ，则下面描述正确的是（ ）。',
    options: ['θ > 90°', 'v₁ · v₂ 为 v₁ 在 v₂ 上的投影', 'v₁ ⊥ v₂', 'v₁ · v₂ 为 v₂ 在 v₁ 上的投影'], answer: 3,
    explain: '因为 |v₁| = 1，所以 v₁ · v₂ = |v₁||v₂|cosθ = |v₂|cosθ，正是向量 v₂ 在单位向量 v₁ 上的投影长度！且点积 > 0 表示 θ < 90°。',
    anim: { engine: 'physics', mode: 'dot', params: { dotAngle: 35 }, caption: '动态演示：拖动夹角 θ 观察 v₂ 在单位向量 v₁ 上的绿色投影线段！' }
  },
  {
    id: 's10', topic: 't_mechanics', demo: 'dot_work', type: 'single', module: 'm1', tag: '真题必考',
    stem: '给马车一个斜向右上 60° 的推力，大小为 1100N，摩擦力为 50N，将马车在地面推动 5m，所有外合力所做的功是多少？',
    options: ['2500 焦耳', '5250 焦耳', '250 焦耳', '5500 焦耳'], answer: 0,
    explain: '先求水平方向有效分力：Fx = 1100 × cos60° = 1100 × 0.5 = 550N；水平合外力 F合 = 550 - 50 = 500N；合力做功 W = F合 × s = 500 × 5 = 2500 焦耳！',
    anim: { engine: 'physics', mode: 'work', caption: '动态演示：1100N 斜推力正交分解为 550N，扣去 50N 摩擦做功 2500J' }
  },
  {
    id: 's11', topic: 't_unity', demo: 'car_friction', type: 'single', module: 'm1', tag: '真题原题',
    stem: '游戏开发中为实现帧率无关的平滑运动，会使用哪个参数获取帧间时间？（ ）',
    options: ['Time.fixedDeltaTime', 'Time.deltaTime', 'transform.position', 'Vector3.distance'], answer: 1,
    explain: 'Update() 中所有位移与速度增量都应乘以 Time.deltaTime，确保 30fps 与 144fps 设备上物体实际移动速度一致。',
    anim: { engine: 'physics', mode: 'friction', caption: '动态演示：基于 dt 帧间时间的平滑物理更新' }
  },
  {
    id: 's12', topic: 't_unity', demo: 'tilemap_coords', type: 'single', module: 'm1', tag: '真题原题',
    stem: '关于 Input 类的描述，下列哪一项是错误的？（ ）',
    options: [
      'Input.GetKeyDown(KeyCode.Space) 在按下空格键的当前帧返回 true',
      'Input.GetAxis("Horizontal") 返回的值范围是 -1 到 1',
      'Input.mousePosition 返回的是鼠标在世界坐标系中的位置',
      'Input.GetMouseButton(0) 检测鼠标左键是否被按住'
    ], answer: 2,
    explain: 'Input.mousePosition 返回的是鼠标在【屏幕坐标系】中的像素位置，而非世界坐标系（需用 Camera.ScreenToWorldPoint 转换）。',
    anim: { engine: 'basic_path', mode: 'tilemap', caption: '动态演示：屏幕像素坐标与网格逻辑坐标的转换区别' }
  },
  {
    id: 's13', topic: 't_mechanics', demo: 'car_friction', type: 'single', module: 'm1', tag: '真题原题',
    stem: '一个质量为 2 kg 的物体，在光滑水平面上受到 10 N 的水平拉力，物体的加速度是多少？',
    options: ['0.2 m/s²', '5 m/s²', '10 m/s²', '20 m/s²'], answer: 1,
    explain: '根据牛顿第二定律 F = ma，可得 a = F / m = 10 / 2 = 5 m/s²。',
    anim: { engine: 'physics', mode: 'friction', caption: '动态演示：牛顿第二定律 F=ma 驱动加速过程' }
  },
  {
    id: 's14', topic: 't_kinematics', demo: 'kinematics_parabola', type: 'single', module: 'm1', tag: '真题原题',
    stem: '在抛物运动中，水平方向的运动属于（ ）。',
    options: ['匀加速直线运动', '自由落体运动', '匀速直线运动', '变加速运动'], answer: 2,
    explain: '忽略空气阻力时，抛物运动水平方向不受力 (a_x = 0)，做匀速直线运动 x = v₀cosθ · t。',
    anim: { engine: 'physics', mode: 'parabola', caption: '动态演示：观察地面绿色投影点做严格匀速直线运动！' }
  },
  {
    id: 's15', topic: 't_mechanics', demo: 'reflect_wall', type: 'single', module: 'm1', tag: '真题原题',
    stem: '在无外力作用下，系统总动量保持不变，这是哪个定律的内容？',
    options: ['牛顿第一定律', '动量守恒定律', '能量守恒定律', '功能原理'], answer: 1,
    explain: '动量守恒定律：若系统不受外力或合外力为零，系统总动量保持不变（m₁v₁ᵢ + m₂v₂ᵢ = m₁v₁f + m₂v₂f）。',
    anim: { engine: 'physics', mode: 'reflect', params: { slopeAngle: 90, vi: [5, -3] }, caption: '动态演示：碰撞过程中的动量与反射速度变化' }
  },
  {
    id: 's16', topic: 't_mechanics', demo: 'kinematics_parabola', type: 'single', module: 'm1', tag: '真题原题',
    stem: '关于重力的描述，下列说法正确的是？（ ）',
    options: ['重力是物体之间的电磁作用', '重力方向总是竖直向上', '重力的计算公式为 w = mg，其中 g 是重力加速度', '重力的单位是千克（kg）'], answer: 2,
    explain: '重力是地球引力产生、方向竖直向下、单位是牛顿(N)，公式为 w = mg (g ≈ 9.8 m/s²)。',
    anim: { engine: 'physics', mode: 'parabola', caption: '动态演示：竖直向下重力加速度 g 弯曲飞行轨迹' }
  },
  {
    id: 's17', topic: 't_unity', demo: 'random_bypass', type: 'single', module: 'm1', tag: '真题原题',
    stem: '下列哪一种算法不是随机算法？（ ）',
    options: ['蒙特卡罗算法', '拉斯维加斯算法', '动态规划算法', '舍伍德算法'], answer: 2,
    explain: '经典随机算法包括蒙特卡罗、拉斯维加斯、舍伍德和数值概率算法；动态规划是确定性最优化算法，不属于随机算法。',
    anim: { engine: 'basic_path', mode: 'random', caption: '动态演示：游戏中最直观的随机算法——随机移动避障' }
  },
  {
    id: 's18', topic: 't_steering', demo: 'steering_seek', type: 'single', module: 'm2', tag: '真题原题',
    stem: '关于“智能体”与“对象”的区别，下列描述正确的是（ ）。',
    options: [
      '智能体具备自治性、反应性、主动性等特性，能够自主决策',
      '对象具备感知环境的能力，智能体不具备',
      '智能体只能被动响应外部调用，对象可以主动决策',
      '对象和智能体在游戏开发中没有本质区别'
    ], answer: 0,
    explain: '对象是被动的封装模块，智能体是具备感知环境、自主决策和执行动作的主动实体，拥有自治/反应/主动/社会/进化五大特性。',
    anim: { engine: 'steering', mode: 'seek', caption: '动态演示：自治智能体实时感知目标并主动计算操控力' }
  },
  {
    id: 's19', topic: 't_steering', demo: 'steering_seek', type: 'single', module: 'm2', tag: '真题高频',
    stem: '在 Seek 行为中，操控力（Steering Force）的计算公式为（ ）。',
    options: ['当前速度 - 期望速度', '期望速度 × 当前速度', '期望速度 + 当前速度', '期望速度 - 当前速度'], answer: 3,
    explain: '操控力 = 期望速度 - 当前速度，用来将当前速度向量平滑“拉向”指向目标的期望速度向量。',
    anim: { engine: 'steering', mode: 'seek', caption: '动态演示：图中粉色矢量 = 绿色期望速度 - 蓝色当前速度！' }
  },
  {
    id: 's20', topic: 't_intercept', demo: 'space_intercept', type: 'single', module: 'm2', tag: '真题高频',
    stem: '在向量追逐算法中，若目标速度大于追逐者最大速度，可能导致的结果是（ ）。',
    options: ['追逐者始终无法追上目标', '追逐者一定能追上目标', '追逐者会提前预判拦截点', '追逐者会随机移动'], answer: 0,
    explain: '向量追逐只是每帧朝目标当前位置直线尾随，目标跑得比追逐者更快时距离只会越拉越远，永远追不上。',
    anim: { engine: 'steering', mode: 'intercept', caption: '动态演示：对比尾随视线追逐(紫)与提前预判拦截(蓝鲸)的差距' }
  },
  {
    id: 's21', topic: 't_intercept', demo: 'space_intercept', type: 'single', module: 'm2', tag: '真题高频',
    stem: '关于拦截算法的核心思想与本质，下列说法正确的是（ ）。',
    options: [
      '追逐者始终朝向目标当前位置移动',
      '本质是一种追踪算法，追逐者计算目标未来相遇点并提前到达该点',
      '拦截算法与 Flee 行为完全相同',
      '拦截算法不需要考虑目标的速度'
    ], answer: 1,
    explain: '拦截算法本质上是一种高级追踪算法，通过相对速度 Vr 与相对距离 Sr 估算拦截时间 tc，进而预判未来相遇点 St = Sprey + Vprey*tc。',
    anim: { engine: 'steering', mode: 'intercept', caption: '动态演示：实时测算 tc 与黄色十字预测拦截点 St' }
  },
  {
    id: 's22', topic: 't_pattern', demo: 'pattern_move', type: 'single', module: 'm2', tag: '真题原题',
    stem: '关于“模式移动”的描述，以下哪项是正确的？（ ）',
    options: ['完全由 AI 动态决策', '仅适用于敌人角色', '移动路径是随机生成的', '按照开发者预设的指令或路径移动'], answer: 3,
    explain: '模式移动是指角色严格按照开发者预先设计好的路径或控制指令序列循环移动，实现简单、计算开销极小。',
    anim: { engine: 'pattern', mode: 'rect', caption: '动态演示：按预设指令数组循环执行的矩形模式移动' }
  },
  {
    id: 's23', topic: 't_pattern', demo: 'pattern_move', type: 'single', module: 'm2', tag: '真题高频',
    stem: '在“控制指令法”中，用于存储单一移动指令的类（ControlData）通常包含哪些属性？（ ）',
    options: ['速度、加速度、时间', '前进距离、后退距离、左转角度、右转角度', '指令类型、操作数', '起始点、终点、路径点'], answer: 1,
    explain: '注意：区分两种方法！控制指令法 (ControlData) 包含【前进距离、后退距离、左转角度、右转角度】；而【指令类型、操作数】是“模式指令法 (InstructionData)”！',
    anim: { engine: 'pattern', mode: 'rect', caption: '动态演示：右侧指令列表清晰展示 ControlData 4参数序列' }
  },
  {
    id: 's24', topic: 't_pattern', demo: 'pattern_move', type: 'single', module: 'm2', tag: '真题高频',
    stem: '使用控制指令 ConData(float leftAngle, float rightAngle, float forward, float backward) 实现矩形模式移动，想让角色左转 90 度的同时前进 50 步，应设计为（ ）。',
    options: ['(0, 90, 50, 0)', '(90, 0, 0, 50)', '(0, 90, 0, -50)', '(90, 0, 50, 0)'], answer: 3,
    explain: '严格对照形参顺序：(leftAngle=90, rightAngle=0, forward=50, backward=0) → (90, 0, 50, 0)！',
    anim: { engine: 'pattern', mode: 'rect', caption: '动态演示：左转90° + 前进指令组合走出闭合矩形！' }
  },
  {
    id: 's25', topic: 't_tilemap', demo: 'tilemap_coords', type: 'single', module: 'm3', tag: '真题必考',
    stem: '在 TileMap 中，若瓦片尺寸为 64×64 像素，角色像素坐标为 (128, 192)，则其所在的瓦片行列坐标是多少？',
    options: ['行号=2, 列号=3', '行号=3, 列号=2', '行号=2, 列号=2', '行号=3, 列号=3'], answer: 1,
    explain: '注意：易反陷阱！x 对应列号 col = 128 / 64 = 2，y 对应行号 row = 192 / 64 = 3，因此是【行号=3, 列号=2】！',
    anim: { engine: 'basic_path', mode: 'tilemap', caption: '动态演示：点击 TileMap 瓦片实时查看 (行,列) 与像素坐标换算' }
  },
  {
    id: 's26', topic: 't_tilemap', demo: 'wall_tracing', type: 'single', module: 'm3', tag: '真题原题',
    stem: '在 8 连通域坐标系下，如果当前坐标是 (10, 10)，并且下一步打算试探左下这个位置，则该位置的坐标是（ ）。',
    options: ['(11, 11)', '(9, 9)', '(9, 11)', '(11, 9)'], answer: 1,
    explain: '课程的 8 连通域坐标系采用标准数学直角坐标系（X向右增大、Y向上增大），向左 x-1=9，向下 y-1=9，故左下为 (9, 9)。',
    anim: { engine: 'basic_path', mode: 'wall', caption: '动态演示：8连通域八方向偏移关系与实时寻路' }
  },
  {
    id: 's27', topic: 't_follow_wall', demo: 'path_following', type: 'single', module: 'm3', tag: '真题高频',
    stem: '沿路径行走算法的核心思想是什么？（ ）',
    options: [
      '随机选择移动方向',
      '综合评估前进方向与地形可通行性，为每个方向赋予权重，优先选择权重最高的方向',
      '始终向右手边方向移动',
      '仅根据当前方向前进，不考虑障碍物'
    ], answer: 1,
    explain: '沿路径走算法根据当前方向夹角及障碍物通过性为 8 邻域动态赋权，每步选取权重最大的单元格前进。',
    anim: { engine: 'basic_path', mode: 'pathfollow', caption: '动态演示：实时显示8邻域权重数字，AI自动选最高权重格沿走廊前行！' }
  },
  {
    id: 's28', topic: 't_avoid', demo: 'random_bypass', type: 'single', module: 'm3', tag: '真题高频',
    stem: '在“绕行障碍物算法”中，防止 NPC 陷入死循环的关键机制及特性描述正确的是（ ）。',
    options: [
      '随机旋转角度；且遇到障碍物时算法直接结束',
      '记录已访问的格子；碰到障碍物时绕行的同时寻路可提高查找效率',
      '每次移动前增加移动速度',
      '不记录路径，但一定能找到目标'
    ], answer: 1,
    explain: '绕行障碍物算法通过记录已走过的瓦片格子防止重复兜圈，并且在绕行过程中持续尝试朝目标前进（边绕行边寻路），提高寻路效率。',
    anim: { engine: 'basic_path', mode: 'bypass', caption: '动态演示：蓝色 标记已访问格子，遇障碍顺时针绕行并寻机脱离！' }
  },
  {
    id: 's29', topic: 't_follow_wall', demo: 'pattern_move', type: 'single', module: 'm3', tag: '真题原题',
    stem: '路点导航算法（Waypoint Navigation）的最大优势是？（ ）',
    options: ['能动态适应随机生成的地图', '性能高、路线可控、极少出现寻路死循环', '不需要人工设置路径点', '适合用于动态目标追踪'], answer: 1,
    explain: '路点导航由设计师预置路径点序列，运行时计算开销极低、路线精确可控且极少死循环（缺点是人工成本高、不适应动态地图）。',
    anim: { engine: 'pattern', mode: 'hex', caption: '动态演示：预设节点/模式序列带来极高稳定性与极低算力消耗' }
  },
  {
    id: 's30', topic: 't_astar_core', demo: 'astar_core', type: 'single', module: 'm4', tag: '真题必考',
    stem: 'A* 算法的核心评估函数为 f(n) = g(n) + h(n)，其中 h(n) 必须满足以下哪个条件才能保证找到最优解？',
    options: ['h(n) ≥ h*(n)', 'h(n) ≤ h*(n)', 'h(n) = h*(n)', 'h(n) 必须为欧几里得距离'], answer: 1,
    explain: '启发函数必须满足【可采纳性 (Admissible)】：h(n) ≤ h*(n)，即预估代价绝不能高估到终点的真实最短代价。',
    anim: { engine: 'astar', mode: 'ppt', caption: '动态演示：A* 结合实际代价 g 与可采纳启发 h 精准收敛到最短路径！' }
  },
  {
    id: 's31', topic: 't_astar_opt', demo: 'astar_core', type: 'single', module: 'm4', tag: '真题高频',
    stem: '在 A* 算法优化中：① 优化“查找最小 f(n) 节点”效率最直接的数据结构改进；② 多个节点 f 值相同时的优选策略，分别是（ ）。',
    options: [
      '数组线性扫描；随机选一个节点',
      '优先队列（最小堆）；选择 h 值最小的节点',
      '哈希表；选择 g 值最小的节点',
      '双向链表；直接忽略相同 f 的节点'
    ], answer: 1,
    explain: '优先队列（最小堆）将查找最小 f(n) 从 O(n) 降至 O(log n)；f 相同时优先选 h 更小的节点意味着离目标更近，能加速向终点收敛！',
    anim: { engine: 'astar', mode: 'opt', caption: '动态演示：优先队列 + f相同选h最小 + 影响力映射避开红色危险区！' }
  },
  {
    id: 's32', topic: 't_fsm_pattern', demo: 'fsm_state_pattern', type: 'single', module: 'm5', tag: '真题高频',
    stem: '以下关于状态模式（State Pattern）的优点与适用场景描述正确的是（ ）。',
    options: [
      '将所有状态代码集中在一个抽象类中，无需子类',
      '把各种状态转移逻辑分布到 State 的子类以减少依赖，适用于行为依赖状态且包含庞大分支结构的场景',
      '新增状态时必须修改所有已有状态类，违反开闭原则',
      '主要用于数据库连接池的高性能计算'
    ], answer: 1,
    explain: '状态模式将每个状态独立封装为 ConcreteState 子类，把转移逻辑分布到各子类消除庞大 switch-case，遵循单一职责与开闭原则。',
    anim: { engine: 'fsm', mode: 'guard', caption: '动态演示：右侧同步展示状态模式 Exit → ChangeState → Enter 执行流程' }
  },
  {
    id: 's33', topic: 't_bt', demo: 'bt_tick', type: 'single', module: 'm6', tag: '真题高频',
    stem: '行为树的叶节点包含哪两种类型？关于行为树的说法错误的是？（ ）',
    options: [
      '条件节点和行为节点；错误说法是“行为树真正的行为是在根节点上”',
      '条件节点和修饰节点；错误说法是“行为树耦合度低”',
      '顺序节点和并行节点；错误说法是“从根节点开始遍历”',
      '根节点和中间节点；错误说法是“行为可独立复用”'
    ], answer: 0,
    explain: '行为树叶节点 = 条件节点 (Condition) + 行为节点 (Action)。真正的行为在【叶节点】上执行，根节点只是遍历入口！',
    anim: { engine: 'bt', mode: 'combat', caption: '动态演示：Tick 从根节点向下遍历，真正在底端叶节点执行条件与动作' }
  },
  {
    id: 's34', topic: 't_bt', demo: 'bt_tick', type: 'single', module: 'm6', tag: '真题必考',
    stem: '行为树中“选择节点 (Selector)”与“并行节点 (Parallel)”的执行逻辑分别是（ ）。',
    options: [
      'Selector 遇 failure 停；Parallel 随机执行子节点',
      'Selector 依次执行直到有子节点返回 success 或 running；Parallel 同时执行所有子节点，直到其一返 failure 或全部 success',
      'Selector 同时执行；Parallel 循环直到失败',
      '两者完全相同'
    ], answer: 1,
    explain: '选择节点 (?) 类似“或逻辑”，找到第一个可执行的 (Success/Running) 即返回；并行节点 (⇉) 并发执行，任一失败立即终止全部。',
    anim: { engine: 'bt', mode: 'interrupt', caption: '动态演示：Parallel 并发监测“看到玩家?”，取消勾选瞬间中断移动！' }
  },
  {
    id: 's35', topic: 't_bt', demo: 'bt_tick', type: 'single', module: 'm6', tag: '真题高频',
    stem: '以下哪项是行为树（BT）与有限状态机（FSM）的主要区别？（ ）',
    options: ['行为树使用树形结构，而 FSM 使用图结构', '行为树无法处理并发执行', 'FSM 的可扩展性优于行为树', '行为树比 FSM 更容易产生状态爆炸'], answer: 0,
    explain: 'BT 采用分层树状结构，模块化强、原生支持并行与中断；FSM 采用图状结构（节点+转换边），状态增多易出现“状态爆炸”。',
    anim: { engine: 'bt', mode: 'combat', caption: '动态演示：分层树形结构让复杂 AI 逻辑清晰解耦、易于扩展' }
  },
  {
    id: 's36', topic: 't_boids', demo: 'boids_flocking', type: 'single', module: 'm6', tag: '真题必考',
    stem: '群组行为（Boids 模型）中，（ ）就是朝着同伴的平均速度方向移动。',
    options: ['追踪', '分离', '聚集', '队列（对齐）'], answer: 3,
    explain: '群组行为三大规则：分离(避碰间距)、对齐/队列(朝同伴平均速度方向移动)、聚集(朝同伴平均位置/质心移动)。',
    anim: { engine: 'boids', mode: 'align', caption: '动态演示：高对齐/队列权重下，整个蓝色鲸群统一航向有序游动！' }
  },

  /* ==================== 二、判断题 (18题，全部覆盖真题易错点) ==================== */
  {
    id: 'tf1', topic: 't_follow_wall', demo: 'wall_tracing', type: 'tf', module: 'm3', tag: '真题原题',
    stem: '沿墙行走算法不适合空旷环境，空旷环境下易绕圈，路径可能冗余。',
    answer: true,
    explain: '正确！沿墙走算法依赖墙壁边缘作为导航参考，进入空旷区域“摸不到墙”时会不断左转/右转原地打转。',
    anim: { engine: 'basic_path', mode: 'wall', caption: '动态演示：点击清掉中间墙壁观察沿墙走在空旷区的行为特征' }
  },
  {
    id: 'tf2', topic: 't_follow_wall', demo: 'wall_tracing', type: 'tf', module: 'm3', tag: '真题高频',
    stem: '在八方向沿墙走算法中，左手方向的编号计算公式为：(当前方向编号 + 2) % 8。',
    answer: false,
    explain: '错误！顺时针编号 0~7 下，【左手方向】= (当前方向编号 - 2 + 8) % 8，而 (当前方向编号 + 2) % 8 是【右手方向】！',
    anim: { engine: 'basic_path', mode: 'wall', params: { hand: 'left' }, caption: '动态演示：右侧 HUD 实时对照左手 (dir-2+8)%8 与右手 (dir+2)%8！' }
  },
  {
    id: 'tf3', topic: 't_steering', demo: 'steering_seek', type: 'tf', module: 'm2', tag: '真题高频',
    stem: '在 Flee 行为中，期望速度的计算方向是从智能体指向目标位置。',
    answer: false,
    explain: '错误！Flee 是远离目标，方向向量为【当前位置 - 目标位置】（从目标指向智能体）；从智能体指向目标是 Seek！',
    anim: { engine: 'steering', mode: 'flee', caption: '动态演示：Flee 绿色期望速度向量严格背离红色威胁源！' }
  },
  {
    id: 'tf4', topic: 't_pattern', demo: 'pattern_move', type: 'tf', module: 'm2', tag: '真题易错',
    stem: '模式移动的实现通常比动态 AI 决策更复杂、计算开销更大。',
    answer: false,
    explain: '错误！模式移动基于预设指令/固定路径，逻辑简单、计算开销极小；动态 AI（寻路/FSM/BT）需实时感知决策，开销大得多。',
    anim: { engine: 'pattern', mode: 'rect', caption: '动态演示：模式移动只需顺序读取数组指令，零搜索开销' }
  },
  {
    id: 'tf5', topic: 't_pattern', demo: 'pattern_move', type: 'tf', module: 'm2', tag: '真题原题',
    stem: '引入随机因素后，模式移动的行为将完全不可预测，无法再基于预设规则执行。',
    answer: false,
    explain: '错误！引入随机参数（如距离 100~200 随机）或随机选模式库，只是增加多样性，整体依然运行在预设框架规则内。',
    anim: { engine: 'pattern', mode: 'random', caption: '动态演示：随机参数模式移动——细节随机变化但仍遵循前进+转向框架' }
  },
  {
    id: 'tf6', topic: 't_intercept', demo: 'space_intercept', type: 'tf', module: 'm2', tag: '真题高频',
    stem: '拦截点是被追踪者路径上距追踪者最近的点。',
    answer: false,
    explain: '错误！拦截点不是空间上距离最近的点，而是【追逐者与目标能够同时到达的未来相遇点】St = Sprey + Vprey * tc！',
    anim: { engine: 'steering', mode: 'intercept', caption: '动态演示：观察黄色拦截点 St 位于目标前方而非当前最近垂足！' }
  },
  {
    id: 'tf7', topic: 't_avoid', demo: 'random_bypass', type: 'tf', module: 'm3', tag: '真题高频',
    stem: '随机移动避障算法适合在障碍物密集、地形复杂的迷宫类游戏中作为主路径规划算法。',
    answer: false,
    explain: '错误！随机移动避障只适合开阔少障碍场景，在复杂迷宫中极易反复碰壁陷入死循环。',
    anim: { engine: 'basic_path', mode: 'random', caption: '动态演示：观察随机避障在障碍物周围的盲目试探特征' }
  },
  {
    id: 'tf8', topic: 't_tilemap', demo: 'tilemap_coords', type: 'tf', module: 'm3', tag: '真题原题',
    stem: 'TileMap 通过二维数组存储地图数据，数值通常表示瓦片类型（如 0 表示空地，1 表示墙壁）。',
    answer: true,
    explain: '正确！二维数组 map[row][col] 直观映射网格地形与通过性，天然适配各类网格寻路算法。',
    anim: { engine: 'basic_path', mode: 'tilemap', caption: '动态演示：TileMap 二维网格与坐标映射演示' }
  },
  {
    id: 'tf9', topic: 't_avoid', demo: 'astar_core', type: 'tf', module: 'm3', tag: '真题原题',
    stem: '寻路就是记下智能体走过的路径。',
    answer: false,
    explain: '错误！寻路是在环境中规划并找出一条从起点到目标位置的可行（或最优）路径的过程，不只是事后记录。',
    anim: { engine: 'astar', mode: 'ppt', caption: '动态演示：A* 先全局搜索规划路径，再沿父节点回溯行走' }
  },
  {
    id: 'tf10', topic: 't_avoid', demo: 'random_bypass', type: 'tf', module: 'm3', tag: '真题易错',
    stem: '绕行避障算法和沿路径走算法遇到死胡同都能继续寻路走出死胡同。',
    answer: false,
    explain: '错误！两者缺乏全局回溯栈机制，进入死胡同后（绕行因四周均已访问或被堵，沿路径因权重折返）都会卡住无法脱困。',
    anim: { engine: 'basic_path', mode: 'bypass', caption: '动态演示：绕行避障仅靠局部规则，点击围成死胡同可见其无法回溯' }
  },
  {
    id: 'tf11', topic: 't_dfs_bfs', demo: 'dfs_bfs', type: 'tf', module: 'm4', tag: '真题高频',
    stem: '递归实现 DFS 不需要显式使用栈结构，因为系统调用栈会自动管理。',
    answer: true,
    explain: '正确！递归隐式借助编程语言的系统函数调用栈自动压栈和回溯，代码简洁但深度过大有栈溢出风险。',
    anim: { engine: 'graph_search', mode: 'dfs', caption: '动态演示：DFS 的后进先出 (FILO) 栈状态演进' }
  },
  {
    id: 'tf12', topic: 't_dfs_bfs', demo: 'dfs_bfs', type: 'tf', module: 'm4', tag: '真题原题',
    stem: '图的深度优先搜索的特点是尽可能先对横宽方向进行搜索。',
    answer: false,
    explain: '错误！先横宽逐层扩散是【广度优先搜索 BFS】的特点；DFS 是尽可能先沿纵深方向“一路走到黑”！',
    anim: { engine: 'graph_search', mode: 'bfs', caption: '动态演示：BFS 才是横宽方向逐层向外扩散（L1→L2→L3）' }
  },
  {
    id: 'tf13', topic: 't_astar_core', demo: 'astar_core', type: 'tf', module: 'm4', tag: '真题高频',
    stem: 'A* 算法中 close 列表中的节点是待处理节点。',
    answer: false,
    explain: '错误！Open List 存放已生成、待处理的节点；Close List 存放【已处理完毕】、无需再重复考察的节点。',
    anim: { engine: 'astar', mode: 'ppt', caption: '动态演示：右侧实时区分黄色 Open(待处理) 与绿色 Close(已处理)' }
  },
  {
    id: 'tf14', topic: 't_fsm_pattern', demo: 'fsm_state_pattern', type: 'tf', module: 'm5', tag: '真题高频',
    stem: '使用逻辑分支法（if-else / switch-case）实现有限状态机时，代码的可读性和可维护性较好。',
    answer: false,
    explain: '错误！状态数量增多时逻辑分支法会迅速膨胀成高耦合的“面条代码”，可读性和可维护性很差，应改用状态设计模式。',
    anim: { engine: 'fsm', mode: 'guard', caption: '动态演示：状态模式将每个状态封装成独立类，解耦维护' }
  },
  {
    id: 'tf15', topic: 't_fsm_pattern', demo: 'fsm_state_pattern', type: 'tf', module: 'm5', tag: '真题原题',
    stem: '常见的有限状态机的实现方法有 switch-case 简单实现和使用状态设计模式实现。',
    answer: true,
    explain: '正确！课程第14–15讲重点讲解了分支逻辑法（switch-case）和面向对象状态设计模式两种主流实现。',
    anim: { engine: 'fsm', mode: 'blinky', caption: '动态演示：经典 5 状态 Blinky 状态机迁移过程' }
  },
  {
    id: 'tf16', topic: 't_bt', demo: 'bt_tick', type: 'tf', module: 'm6', tag: '真题原题',
    stem: '在行为树中，根节点可以是叶节点的一种类型；行为树的行为节点是叶节点。',
    answer: false,
    explain: '前半句错误（根节点只是执行入口，绝不能是叶节点）！注意拆考时：“根节点可以是叶节点”为【错】，“行为节点是叶节点”为【对】。',
    anim: { engine: 'bt', mode: 'combat', caption: '动态演示：Root 位于顶端入口，叶节点位于最底层执行条件/动作' }
  },
  {
    id: 'tf17', topic: 't_bt', demo: 'bt_tick', type: 'tf', module: 'm6', tag: '真题原题',
    stem: '顺序节点（Sequence）会记住返回“running”状态的子节点，并在下次迭代中继续执行该节点。',
    answer: true,
    explain: '正确！Sequence 遇到 Running 子节点会记住它并在下一帧直接续跑（也正因如此它不具备中断前置条件的能力，需用 Parallel 解决）。',
    anim: { engine: 'bt', mode: 'interrupt', caption: '动态演示：对比 Sequence 续跑机制与 Parallel 可中断机制' }
  },
  {
    id: 'tf18', topic: 't_bt', demo: 'bt_tick', type: 'tf', module: 'm6', tag: '真题原题',
    stem: '条件节点（Condition）在行为树中用于执行具体行为，例如移动或攻击。',
    answer: false,
    explain: '错误！条件节点只做 if 条件判断且不改变游戏状态（返回 Success/Failure）；执行移动或攻击的是【行为节点 Action】！',
    anim: { engine: 'bt', mode: 'combat', caption: '动态演示：椭圆为条件判断节点，矩形为具体动作执行节点' }
  },

  /* ==================== 三、填空题 (10题，覆盖全部真题填空与核心排序) ==================== */
  {
    id: 'f1', topic: 't_fsm_std', demo: 'fsm_state_pattern', type: 'fill', module: 'm5', tag: '真题原题·严格按序',
    stem: '有限状态机由【空1】、【空2】、【空3】和【空4】组成。（按课件严格顺序填写）',
    blanks: [
      { label: '空1', answers: ['状态'] },
      { label: '空2', answers: ['初始状态'] },
      { label: '空3', answers: ['输入', '输入事件', '输入(事件)'] },
      { label: '空4', answers: ['转换', '转换函数'] }
    ],
    explain: '注意：超高频严格按序填空！第14讲 Slide 7 明确顺序：① 状态 → ② 初始状态 → ③ 输入(输入事件) → ④ 转换(转换函数)（第5项动作可选）。',
    anim: { engine: 'fsm', mode: 'guard', caption: '动态演示：蓝点=初始状态，圆圈=状态，线上文字=输入事件，箭头=转换' }
  },
  {
    id: 'f2', topic: 't_dfs_bfs', demo: 'dfs_bfs', type: 'fill', module: 'm4', tag: '真题原题',
    stem: '广度优先搜索（BFS）是一种【空1】的搜索过程，为了实现 BFS 中节点的访问，需要按访问顺序展开节点，即需要按【空2】的方式进行搜索，使用【空3】记录需要访问的节点的先后顺序。',
    blanks: [
      { label: '空1', answers: ['分层', '分级', '逐层'] },
      { label: '空2', answers: ['先访问的节点先展开', '先访问的节点先访问', '先进先出'] },
      { label: '空3', answers: ['队列', 'Queue'] }
    ],
    explain: '课件标准填空答案：① 分层（或分级）；② 先访问的节点先展开（先访问的节点先访问）；③ 队列。',
    anim: { engine: 'graph_search', mode: 'bfs', caption: '动态演示：BFS 按 L0→L1→L2 逐层扩散与 FIFO 队列出队展开！' }
  },
  {
    id: 'f3', topic: 't_bt', demo: 'bt_tick', type: 'fill', module: 'm6', tag: '真题原题',
    stem: '行为树是一种【空1】的数据结构，每次调用会从【空2】开始遍历。',
    blanks: [
      { label: '空1', answers: ['树状', '树形'] },
      { label: '空2', answers: ['根节点', '根'] }
    ],
    explain: '行为树是一种树状（树形）数据结构，每帧（Tick）调用从根节点开始自顶向下遍历执行。',
    anim: { engine: 'bt', mode: 'combat', caption: '动态演示：Tick 脉冲每次从 Root 根节点出发向下遍历整棵树' }
  },
  {
    id: 'f4', topic: 't_tilemap', demo: 'tilemap_coords', type: 'fill', module: 'm3', tag: '真题易错',
    stem: '已知 TileMap 地图格子大小为 64×64，要获取第 row 行第 col 列位置上精灵中心坐标 pos(x, y)，则 x =【空1】，y =【空2】。',
    blanks: [
      { label: '空1 (x)', answers: ['col*64+32', '32+col*64', 'col64+32', '64*col+32'] },
      { label: '空2 (y)', answers: ['row*64+32', '32+row*64', 'row64+32', '64*row+32'] }
    ],
    explain: '注意：千万别漏掉 +32！第7讲 toXY() 为了定位到 64×64 瓦片的【中心点】，必须加上半个瓦片尺寸 32 → col*64+32, row*64+32！',
    anim: { engine: 'basic_path', mode: 'tilemap', caption: '动态演示：点击任意瓦片实时核对 (col*64+32, row*64+32) 中心坐标' }
  },
  {
    id: 'f5', topic: 't_astar_core', demo: 'astar_core', type: 'fill', module: 'm4', tag: '真题原题',
    stem: '理解 A* 估价函数 f(n) = g(n) + h(n)，选出各部分对应的字母编号：<br>A. 从起始搜索点到当前点的代价 &nbsp; B. 当前点到目标点的估值 &nbsp; C. 每个可能试探点的估值<br>则 f(n) 表示【空1】，g(n) 表示【空2】，h(n) 表示【空3】。',
    blanks: [
      { label: '空1 f(n)', answers: ['C'] },
      { label: '空2 g(n)', answers: ['A'] },
      { label: '空3 h(n)', answers: ['B'] }
    ],
    explain: 'f(n) = 总估值(C)，g(n) = 起点到当前点实际代价(A)，h(n) = 当前点到目标点的启发式预估代价(B)。',
    anim: { engine: 'astar', mode: 'ppt', caption: '动态演示：每个方格左上f、左下g、右下h 直观展示三者求和关系' }
  },
  {
    id: 'f6', topic: 't_astar_core', demo: 'astar_core', type: 'fill', module: 'm4', tag: '真题压轴手算',
    stem: '【真题 28 格 A* 手算还原】下图为 4×7 网格，起点 A=8，终点 B=19，蓝色 10、17、23 为障碍物（直走 g+10，斜走 g+14，h 为曼哈顿距离 ×10，节点 9 已给出 f=50, g=10, h=40）。请按顺时针 A* 计算出 3号、14号、16号、18号、22号节点的总估值 f(n) 及最终路径 5 个节点编号！',
    customHtml: `<div class="astar-q-grid">${
      Array.from({ length: 28 }, (_, id) => {
        const cls = id === 8 ? 'start' : (id === 19 ? 'end' : ([10, 17, 23].includes(id) ? 'obs' : (id === 9 ? 'given' : '')));
        const lbl = id === 8 ? 'A(8)' : (id === 19 ? 'B(19)' : String(id));
        const extra = id === 9 ? '<span class="mini-f">50</span><span class="mini-g">10</span><span class="mini-h">40</span>' : '';
        return `<div class="astar-q-cell ${cls}">${extra}${lbl}</div>`;
      }).join('')
    }</div>`,
    blanks: [
      { label: '3号 f值', answers: ['64'] },
      { label: '14号 f值', answers: ['64'] },
      { label: '16号 f值', answers: ['44'] },
      { label: '18号 f值', answers: ['52'] },
      { label: '22号 f值', answers: ['70'] },
      { label: '最终路径(用-连)', answers: ['8-16-24-18-19', '8->16->24->18->19', '8-16-24-25-19', '8->16->24->25->19'] }
    ],
    interactiveGrid: {
      kind: 'pathgrid',
      role: 'graded',
      rows: 4, cols: 7, start: 8, end: 19, obstacles: [10, 17, 23],
      givenNotes: { 9: '50|10/40' },
      allowCornerCut: true,
      syncBlankIdx: 5,
      title: '真题 28 格 A* 手算与路径画板（支持全屏放大 & 记 f/g/h）',
      guide: '按住拖动或依次点击相邻格绘制路径（自动回填下方路径空），亦可在左侧切换「标 Open / 标 Close / 记 f/g/h」辅助手算！'
    },
    explain: '逐格验算：① 3号(0,3)由9号(1,2)斜走得 g=10+14=24, h=(|0-2|+|3-5|)×10=40 → <b>f=64</b>；② 14号(2,0)由8号(1,1)斜走 g=14, h=50 → <b>f=64</b>；③ 16号(2,2)由8号斜走 g=14, h=30 → <b>f=44</b>；④ 24号(3,3)由16号斜走 g=28, h=30 → f=58；⑤ 18号(2,4)由24号斜走 g=42, h=10 → <b>f=52</b>；⑥ 22号(3,1)由15号(g=10)直走 g=20, h=50 → <b>f=70</b>；最终路径：<b>8 → 16 → 24 → 18 → 19</b>！（下方动画完整逐帧演示！）',
    anim: { engine: 'astar', mode: 'exam', caption: '真题原图一比一还原！点击【单步】逐格验证 64/64/44/52/70 与路径 8→16→24→18→19！' }
  },
  {
    id: 'f7', topic: 't_astar_opt', demo: 'astar_core', type: 'fill', module: 'm4', tag: '真题原题',
    stem: 'A* 算法步骤排序（选字母连续输入，无空格）：<br>A.若open非空取f最小节点pNode &nbsp; B.重复判断open若空则失败 &nbsp; C.起点入open &nbsp; D.若pNode为目标则成功 &nbsp; E.移pNode到close &nbsp; F.若pAdj不在open则加入算fgh设父 &nbsp; G.循环8邻接点不可达或在close忽略 &nbsp; H.若pAdj已在open且经pNode的g更小则更新 &nbsp; M.转步骤B &nbsp; N.反向迭代保存路径。',
    blanks: [
      { label: '正确字母序列', answers: ['CBADEGFHMN', 'CBADEGHFMN'] }
    ],
    explain: '标准主循环记忆口诀：C(起点入open) → B(判空循环) → A(选f最小) → D(判终点) → E(入close) → G(扫8邻) → F/H(入open或更新更优g) → M(回循环B) → N(倒推保存路径)！',
    anim: { engine: 'astar', mode: 'ppt', caption: '动态演示：严格对照 CBADEGFHMN 10 步流程执行 A* 搜索' }
  },
  {
    id: 'f8', topic: 't_dfs_bfs', demo: 'dfs_bfs', type: 'fill', module: 'm4', tag: '真题原题',
    stem: 'DFS 递归与非递归思想步骤排序（字母连续输入）：<br>[非递归] A.新建栈压入起点from &nbsp; B.设from已访问，未访问邻接点记父入栈 &nbsp; C.栈非空重复 &nbsp; D.取栈顶判终点<br>[递归] E.定义doDFSRec &nbsp; F.算i号方向节点 &nbsp; G.不可通或已访则算下方向 &nbsp; H.可通未访则设父为新起点 &nbsp; J.起点即终点结束 &nbsp; K.递归调doDFSRec &nbsp; L.8方向判完失败结束',
    blanks: [
      { label: '递归序列', answers: ['EJFHKGL', 'EJFGHKL'] },
      { label: '非递归序列', answers: ['ACDB'] }
    ],
    explain: '递归：E(定义函数)→J(判终止)→F(算邻接)→H/G(判通行与设父)→K(递归深入)→L(回溯/失败)。非递归：A(建栈入起点)→C(栈非空循环)→D(出栈判终点)→B(标已访并压入邻接点)。',
    anim: { engine: 'graph_search', mode: 'dfs', caption: '动态演示：右侧实时查看非递归栈 Stack 的入栈/出栈回溯全过程' }
  },
  {
    id: 'f9', topic: 't_follow_wall', demo: 'path_following', type: 'fill', module: 'm3', tag: '真题原题',
    stem: '基本寻路算法步骤排序：<br>A.按原方向为8邻域赋权 &nbsp; B.选权重最大格为下一步 &nbsp; C.重复直到目标 &nbsp; D.向目标走遇障绕行 &nbsp; E.不能通给低权能通给高权 &nbsp; F.结合碰撞调权 &nbsp; G.夹角越小权重越大 &nbsp; H.按当前方向调权 &nbsp; I.优先左手/右手定序 &nbsp; J.查next=(dir+n)%8无障未走 &nbsp; K.向next走一步 &nbsp; L.更新当前方向 &nbsp; M.按优先序找首个可通格移动。<br>求：绕行避障【空1】；沿路径走【空2】；沿墙走【空3】；两种赋权法【空4】和【空5】。',
    blanks: [
      { label: '空1 绕行避障', answers: ['DJKC'] },
      { label: '空2 沿路径走', answers: ['ABC'] },
      { label: '空3 沿墙走', answers: ['IMLC'] },
      { label: '空4 赋权法1', answers: ['EH', 'GF'] },
      { label: '空5 赋权法2', answers: ['GF', 'EH'] }
    ],
    explain: '① 绕行避障 = D→J→K→C；② 沿路径走 = A→B→C；③ 沿墙走 = I→M→L→C；④ 两种赋权法分别为【先地形后方向 E→H】与【先夹角后碰撞 G→F】！',
    anim: { engine: 'basic_path', mode: 'pathfollow', caption: '动态演示：切换顶部模式一次性对照绕行(DJKC)、沿路径(ABC)、沿墙(IMLC)！' }
  },
  {
    id: 'f10', topic: 't_boids', demo: 'boids_flocking', type: 'fill', module: 'm6', tag: '考纲核心',
    stem: '群组行为（Boids 模型）由三条局部核心规则加权合成：避免与邻居碰撞的【空1】规则、朝同伴平均速度方向移动的【空2】规则、向同伴平均位置（质心）靠拢的【空3】规则。',
    blanks: [
      { label: '空1', answers: ['分离', 'Separation'] },
      { label: '空2', answers: ['对齐', '队列', 'Alignment'] },
      { label: '空3', answers: ['聚集', '聚合', 'Cohesion'] }
    ],
    explain: 'Craig Reynolds Boids 三大法则：分离 (Separation)、对齐/队列 (Alignment)、聚集 (Cohesion)，加权合成实现群体智能涌现。',
    anim: { engine: 'boids', mode: 'cruise', caption: '动态演示：拖动三力滑块直观观察分离、对齐、聚集各自对鲸群的影响' }
  },

  /* ==================== 四、按要求作答题 (8题，严格紧扣考纲Slide 8 3×10=30分) ==================== */
  {
    id: 'e1', topic: 't_avoid', demo: 'random_bypass', type: 'essay', module: 'm3', tag: '大题必考·第7周',
    stem: '请分别简述【随机移动避障算法】与【绕行障碍物算法】的核心思想、实现步骤，并从实现难度、内存开销、路径效率及适用场景四个维度对比两者的优缺点。',
    scratchBoard: {
      kind: 'pathgrid', role: 'scratch',
      rows: 5, cols: 7, start: 14, end: 20, obstacles: [9, 16, 23], allowCornerCut: true,
      title: '避障推演草稿画板（不计分 · 辅助打草稿）',
      guide: '可选草稿区：可自由绘制障碍墙、起点 S、终点 G 与绕行路线，仅辅助理清算法步骤，不参与评分。'
    },
    rubric: [
      '随机移动避障：朝目标直线追踪，碰撞后切换随机移动状态，随机旋转选可通行角度前进固定步长（如50），走完或再碰障后重新决策。',
      '绕行障碍物：朝目标移动，遇障获取障碍物方位 dir，按顺/逆时针检查 next = (dir+n)%8，找首个无障碍且【未访问过】的格子移动并记录路径，同时持续尝试回归目标方向。',
      '防死循环核心：绕行算法必须记录已访问格子；随机避障无需记录，内存开销低但在复杂迷宫易死循环。',
      '适用场景：随机避障适合开阔、障碍少的城镇漫游；绕行避障适合障碍多、结构较复杂的迷宫场景（但遇死胡同仍会卡住）。'
    ],
    modelAnswer: '【一、随机移动避障算法】\n1. 核心思想：朝目标追踪，遇障随机转向走一段距离后再重寻目标。\n2. 实现步骤：① 初始化状态为 Tracing、需行走位移为0；② Tracing 状态下朝目标试探，无碰撞则移动并判终点，碰撞则切 RandomMoving；③ RandomMoving 下若需走位移为0则随机选无碰撞角度并设步长(如50)，否则沿当前方向前进，走完则恢复 Tracing，途中再碰则位移清零重选角度。\n\n【二、绕行障碍物算法】\n1. 核心思想：直线优先、遇阻沿边缘顺/逆时针绕行、记录路径防死锁、寻机脱离。\n2. 实现步骤：① 朝目标方向移动；② 遇障确定障碍物相对方向 dir；③ 依次检查 next=(dir+n)%8 (n=0..7)，找到无障且未访问过的格子；④ 向该方向走一步并标记已访问；⑤ 重复直至到达目标。\n\n【三、对比】实现难度(简 vs 较复杂)、路径效率(低不稳定 vs 较稳)、内存开销(低不记路 vs 较高需记已访格)、适用场景(开阔少障 vs 复杂多障)。',
    anim: { engine: 'basic_path', mode: 'bypass', caption: '动态演示：对比绕行避障（带蓝色已访问标记防死循环）与随机移动避障！' }
  },
  {
    id: 'e2', topic: 't_follow_wall', demo: 'wall_tracing', type: 'essay', module: 'm3', tag: '大题必考·第8周',
    stem: '请阐述【沿路径走算法】的两种权重分配方法，以及【沿墙走算法】在四方向（左手定则）和八方向（左/右手优先）下的核心实现步骤，并说明沿墙走算法在空旷环境中的局限及改进思路。',
    scratchBoard: {
      kind: 'pathgrid', role: 'scratch',
      rows: 5, cols: 7, start: 14, end: 20, obstacles: [2, 9, 16, 17, 23], allowCornerCut: true,
      title: '沿墙/沿路径草稿画板（不计分 · 辅助左/右手定则推演）',
      guide: '可选草稿区：可自由增删墙体，沿边界模拟四/八方向左手定则移动或空旷区域打转现象，不参与评分。'
    },
    rubric: [
      '沿路径走赋权法①：先判8邻域通/障（通行+10，障碍-10），再根据距当前方向远近增减权重。',
      '沿路径走赋权法②：先按与当前方向夹角赋初始权（如 10,9,8,7,6,7,8,9），再遇障碍统一减权（如 -=10），最后选最大权重格移动。',
      '沿墙走四方向左手优先顺序：左 → 前 → 右 → 后。',
      '沿墙走八方向公式：左手起始 = (curDir - 2 + 8) % 8（顺时针扫8格）；右手起始 = (curDir + 2) % 8（逆时针扫8格），找到首个可通格立即移动并更新 curDir。',
      '空旷环境局限与改进：摸不到墙会原地打转导致路径冗余，可结合随机探索算法在脱离墙壁时寻找新边界。'
    ],
    modelAnswer: '【一、沿路径走两种赋权法】\n方法1（先地形后方向）：遍历8邻域，可通行赋10、障碍赋-10；再按与当前前进方向的距离加减权重（正前方+2，左右前+1，正后-2）。\n方法2（先夹角后碰撞）：先按当前方向夹角赋权（正前10、±45°为9、±90°为8、±135°为7、正后6），再遍历8邻域若遇障碍则 weight[i] -= 10。选最大权重格为下一步目标。\n\n【二、沿墙走算法步骤】\n• 四方向左手定则：按【左 → 前 → 右 → 后】优先级找首个无障碍格并更新方向。\n• 八方向实现：① 计算起始方向：左手 (curDir-2+8)%8（顺时针查），右手 (curDir+2)%8（逆时针查）；② 依次判 8 方向通过性，找到首个可通行格立即移动并更新 curDir；③ 循环直至到达终点或判定死循环。\n\n【三、空旷区局限与改进】空旷环境因无墙依托会不断朝优先侧转向而原地绕圈；改进：检测到连续多步未接触墙时切换随机移动/直线探索直至重新遇墙。',
    anim: { engine: 'basic_path', mode: 'wall', caption: '动态演示：八方向沿墙走实时切换左/右手优先，一目了然！' }
  },
  {
    id: 'e3', topic: 't_dfs_bfs', demo: 'dfs_bfs', type: 'essay', module: 'm4', tag: '大题必考·第10/11周',
    stem: '请分别写出【广度优先搜索 (BFS)】与【深度优先搜索 (DFS 非递归)】的完整寻路步骤，并从数据结构、最优性（最短路径）、空间开销和适用场景四个方面比较 DFS、BFS 与 Dijkstra 算法。',
    scratchBoard: {
      kind: 'pathgrid', role: 'scratch',
      rows: 5, cols: 7, start: 14, end: 20, obstacles: [9, 10, 16, 23, 24], allowCornerCut: true,
      title: 'BFS / DFS / Dijkstra 推演草稿板（不计分）',
      guide: '可选草稿区：用「标 Open 表 / Close 表」模拟队列(BFS)、栈(DFS) 与松弛扩散序列，不参与评分。'
    },
    rubric: [
      'BFS步骤：起点即终点结束 → 建队列起点入队并标已访 → 队非空循环：队头出队，遍历8邻接点，可通且未访则标已访、记父节点、入队；若为终点则沿父回溯反转生成路径 → 队空失败。',
      'DFS非递归步骤：建栈压入起点 → 栈非空循环：弹栈顶判终点 → 标已访问 → 遍历可通未访邻接点记父入栈 → 栈空失败。',
      '最优性：DFS 不保证最短路；BFS 保证无权图边数最少最短路；Dijkstra 保证非负带权图总代价最小最短路。',
      '关系结论：BFS 是 Dijkstra 算法在所有边权重相等时的特例。'
    ],
    modelAnswer: '【一、BFS 寻路步骤】\n(1) 确定起终点，若重合则结束；\n(2) 定义队列，将起点入队并标记已访问；\n(3) 当队列非空时循环：① 队头出队；② 遍历其 8 个邻接点：若可通行且未访问，则标记已访问、记录其父节点为当前节点并入队；若该邻接点为终点，则沿父节点倒推并反转生成路径，算法结束；\n(4) 队列为空则寻路失败。\n\n【二、DFS 非递归步骤】\n(1) 建栈，将起点入栈；\n(2) 栈非空循环：① 取栈顶元素 top，若为终点则回溯路径结束；② 将 top 标记已访问；③ 查找 top 所有可通行且未访问的邻接点，记录父节点并依次入栈；\n(3) 栈空则寻路失败。\n\n【三、三者对比】\n• DFS：栈(FILO)，内存小，不保证最短路，适用于迷宫生成/连通性检测；\n• BFS：队列(FIFO)，逐层扩散内存大，保证无权图最短路；\n• Dijkstra：优先队列(最小堆)+松弛，保证非负带权图最短路，BFS 是其等权特例。',
    anim: { engine: 'graph_search', mode: 'bfs', caption: '动态演示：切换 BFS(队列) / DFS(栈) / Dijkstra(最小堆) 直观对比！' }
  },
  {
    id: 'e4', topic: 't_astar_opt', demo: 'astar_core', type: 'essay', module: 'm4', tag: '压轴必考·A*原理',
    stem: '请完整阐述 A* 搜索算法的核心估价函数 f(n)=g(n)+h(n) 各分量含义、启发函数的可采纳性要求、Open/Close 双列表的作用及完整实现步骤，并列举至少 4 种 A* 优化策略。',
    scratchBoard: {
      kind: 'pathgrid', role: 'scratch',
      rows: 5, cols: 7, start: 14, end: 20, obstacles: [8, 15, 16, 22, 23], givenNotes: { 14: '60|0/60' }, allowCornerCut: true,
      title: 'A* 手算演草画板（不计分 · 辅助标注 Open/Close 与 f/g/h）',
      guide: '可选草稿区：手动标记 Open/Close 节点并双击格子记录 f|g/h（如 50|10/40），仅用于理顺算法步骤，不参与评分。'
    },
    rubric: [
      'f(n)=g(n)+h(n)：g(n)起点到当前实际代价(直10/斜14)，h(n)当前到终点估计代价(曼哈顿/欧氏)，f(n)总估值。',
      '可采纳性：h(n) ≤ h*(n)，绝不高估真实代价，是找到最优解的前提。',
      'Open(待处理节点) / Close(已处理节点) + 完整循环步骤（取最小f → 判终点 → 移入Close → 扩8邻：不可达/Close忽略、不在Open则算fgh设父入Open、已在Open若新g更小则更新父与g/f）。',
      '优化策略（答出4条+）：① 优先队列(最小堆)优化查找；② f相同时选h更小节点；③ Close动态重开；④ 双向A*；⑤ 多样地形叠加成本；⑥ 影响力映射趋利避害；⑦ 分层避障(A*+ORCA)。'
    ],
    modelAnswer: '【1. 估价函数与可采纳性】\nf(n) = g(n) + h(n)。g(n) 为起点到 n 的实际代价（直10、斜14）；h(n) 为 n 到终点的启发预估（如曼哈顿距离）；h(n) 必须满足可采纳性 h(n) ≤ h*(n)（不高估）才能保证最优解。\n\n【2. 双列表与实现步骤】\nOpen List 存待考察节点，Close List 存已考察节点。\n① 起点算 g/h/f 入 Open；\n② 若 Open 为空则失败；否则选 Open 中 f 最小节点 pNode；\n③ 若 pNode 是终点，沿父节点回溯并反转得最终路径；\n④ 移 pNode 到 Close，遍历其 8 邻接点 pAdj：\n  • 不可通或在 Close 中 → 忽略；\n  • 不在 Open 中 → 算 g/h/f、设父为 pNode、入 Open；\n  • 已在 Open 中且经 pNode 的新 g 更小 → 更新父节点及 g/f 值；\n⑤ 重复步骤 ②。\n\n【3. 主要优化策略】\n① Open List 改用优先队列(最小堆)降至 O(log n)；② f 相同时选 h 更小的节点加速收敛；③ Close 动态重开；④ 双向 A* 减少搜索空间；⑤ 多样地形成本 & 影响力映射叠加至 g 值。',
    anim: { engine: 'astar', mode: 'ppt', caption: '动态演示：A* 经典42格完整演示 + Open/Close 列表同步演化' }
  },
  {
    id: 'e5', topic: 't_fsm_std', demo: 'fsm_state_pattern', type: 'essay', module: 'm5', tag: '大题必考·FSM画图',
    stem: '某游戏 AI 守卫逻辑如下：① 初始为巡逻 (Patrol)，发现玩家进入追逐 (Chase)；② 追逐中玩家进入射程则攻击 (Attack)，玩家离开则回巡逻；③ 攻击中玩家脱离射程则回追逐，玩家很远则回巡逻；④ 前三种任意状态下生命值归 0 均进入死亡 (Dead)。请写出 FSM 四大组成要素、在下方画板画出状态迁移图、列出状态迁移表思路，并说明为何复杂 FSM 需从分支逻辑法重构为状态设计模式。',
    board: {
      kind: 'fsm',
      preset: 'guard',
      title: '有限状态机画板：绘制游戏守卫状态迁移图',
      guide: '点击「+ 添加状态」创建状态圆，选中初始态【巡逻 Patrol】点「●→ 设为初始态」，用「↗ 连线(转换)」连接并标注触发事件（双击节点或边随时改名）。'
    },
    rubric: [
      '四大组成（按序）：状态、初始状态、输入(事件)、转换(转换函数)（动作可选）。',
      '状态迁移图规范：圆圈表4个状态(Patrol/Chase/Attack/Dead)，实心黑点箭头指向初始状态 Patrol，8条有向边标清触发事件（发现玩家/玩家离开/进入射程/脱离射程/玩家很远/HP=0）。',
      '状态迁移表清晰列出各状态下对应事件的下一状态。',
      '重构原因：分支逻辑法 (switch-case) 状态多时成“面条代码”、高耦合、违背开闭原则；状态模式通过 Context + IState + ConcreteState 解耦，易扩展维护。'
    ],
    modelAnswer: '【1. FSM 四大组成】状态、初始状态、输入（事件）、转换（转换函数）。\n\n【2. 状态迁移图要素】\n• 初始标志（●→）指向【巡逻 Patrol】；\n• 巡逻 --发现玩家--> 追逐；追逐 --玩家离开--> 巡逻；\n• 追逐 --进入射程--> 攻击；攻击 --脱离射程--> 追逐；攻击 --玩家很远--> 巡逻；\n• 巡逻/追逐/攻击 --HP=0--> 死亡 Dead（终止态）。\n\n【3. 状态迁移表摘要】\n| 当前状态 | 发现玩家 | 进入射程 | 脱离射程 | 玩家离开/很远 | HP=0 |\n| Patrol | Chase | - | - | - | Dead |\n| Chase | - | Attack | - | Patrol | Dead |\n| Attack | - | - | Chase | Patrol | Dead |\n\n【4. 为何采用状态模式】消除庞大的 switch-case 臃肿代码，每个状态独立成类（Enter/Execute/Exit），新增状态只需加子类无需改 Context，符合单一职责和开闭原则。',
    anim: { engine: 'fsm', mode: 'guard', caption: '交互状态迁移图：点击右侧事件按钮亲手演示每一条状态迁移边！' }
  },
  {
    id: 'e6', topic: 't_fsm_std', demo: 'fsm_state_pattern', type: 'essay', module: 'm5', tag: '经典考题·画图',
    stem: '请从以下两个经典 AI 状态机场景中<b>任选其一</b>，写出其状态迁移关系并使用下方画板画出完整状态迁移图（标注初始态 ●→ 与触发事件）：<br><b>【场景 A · 吃豆人红幽灵 Blinky】</b>初始先上升离开迷宫中央，走出中央后进入追逐玩家；追逐中若玩家死亡则随机移动（玩家再生后恢复追逐），若玩家吃下能量球则逃离玩家（能量用尽恢复追逐）；逃离时被玩家吃掉则进入死亡（眼珠）并回到迷宫中央重新上升。<br><b>【场景 B · 蚂蚁世界】</b>蚂蚁初始为饥饿（找食物）状态；找到食物后进入回家（搬运）状态；回巢放下食物后变为口渴（找水源）状态；找到水源喝水后重新回到饥饿状态；前三种任意状态下碰到毒物均直接进入死亡状态。',
    board: {
      kind: 'fsm',
      preset: 'blinky_or_ant',
      title: '有限状态机画板：绘制吃豆人 Blinky (5态) 或 蚂蚁世界 (4态) 状态迁移图',
      guide: '任选 Blinky 或蚂蚁世界绘制完整闭环状态迁移图，系统智能识别你画的是哪套方案！别忘了标注初始态 ●→ 与各边触发事件。'
    },
    rubric: [
      'Blinky 5个状态：上升(初始态)、追逐玩家、随机移动、逃离玩家、死亡(眼珠)。',
      'Blinky 核心转移：上升(出中央)→追逐；追逐(玩家死)→随机(玩家再生)→追逐；追逐(吃能量球)→逃离(能量用尽)→追逐；逃离(被吃)→死亡(回中央)→上升。',
      '或蚂蚁世界4个状态：饥饿找食物(初始)→找到食物→回家→回到巢穴→口渴找水→找到水源→饥饿；任意前三态碰到毒物→死亡。'
    ],
    modelAnswer: '【方案A：吃豆人 Blinky 状态迁移（5态）】\n●→ 上升 (初始态) --退出迷宫中央--> 追逐玩家；\n追逐玩家 --玩家死亡--> 随机移动 --玩家再生--> 追逐玩家；\n追逐玩家 --玩家吃能量球--> 逃离玩家 --能量球用尽--> 追逐玩家；\n逃离玩家 --被玩家吃掉--> 死亡(变眼珠) --回到迷宫中央--> 上升。\n\n【方案B：蚂蚁世界状态迁移（4态）】\n●→ 饥饿(找食物) --找到食物--> 回家 --回到巢穴放食物--> 口渴(找水源) --找到水源--> 饥饿；\n饥饿 / 回家 / 口渴 --碰到毒物--> 死亡。',
    anim: { engine: 'fsm', mode: 'blinky', caption: '实时交互：点击体验 Blinky 5 态完整闭环迁移（也可切蚂蚁世界）！' }
  },
  {
    id: 'e7', topic: 't_bt', demo: 'bt_tick', type: 'essay', module: 'm6', tag: '大题高频·行为树画图',
    stem: '行为树中用顺序节点 (Sequence) 实现“看到玩家 → 向玩家移动 → 攻击”时，若移动途中玩家突然消失会出现什么问题？请使用下方行为树画板绘出并行节点 (Parallel) + 修饰节点 (Decorator) 的中断解决方案，并从 4 个维度对比行为树与 FSM。',
    board: {
      kind: 'bt',
      preset: 'interrupt',
      title: '行为树画板：绘制 Parallel + Until Failure 可中断行为树',
      guide: '添加 Parallel (⇉) 并发驱动两路：① Decorator (◇ Until Failure) → 条件叶(看到玩家？)；② Sequence (→) → 行为叶(向玩家移动、攻击)。可点击「自动排版」整理树形。'
    },
    rubric: [
      '问题剖析：顺序节点会记住返回 Running 的“向玩家移动”节点，下一帧直接续跑而不重新检查前置条件“看到玩家？”，导致无法及时中断。',
      '解决方案：使用【并行节点 (Parallel)】同时执行【Until Failure 修饰节点包裹“看到玩家？”】与【顺序节点(移动→攻击)】。',
      '中断原理：玩家一旦消失，“看到玩家？”返回 Failure → Until Failure 结束并返回 Failure → Parallel 任一子失败立即终止所有子节点！',
      'BT vs FSM 对比：树状 vs 图状、高模块化复用 vs 易状态爆炸、原生并行中断强 vs 并发困难、适合复杂动态 AI vs 适合简单固定状态。'
    ],
    modelAnswer: '【1. 顺序节点的痛点】\n“向玩家移动”需多帧完成并返回 Running。Sequence 会记住该 Running 子节点，下帧直接从该节点继续执行，跳过前置条件“看到玩家？”，导致玩家消失后 AI 依然傻跑，不具备中断能力。\n\n【2. Parallel + Until Failure 解决方案】\n用 Parallel 作为父节点并发驱动两个分支：\n• 左分支：◇ Until Failure 修饰节点 → 条件节点“看到玩家？”（持续监控）；\n• 右分支：→ Sequence 顺序节点 → “向玩家移动” → “攻击”。\n当玩家突然消失，左分支立刻返回 Failure，Parallel 规则规定任一子节点失败即刻终止全部子节点，从而瞬间中断移动！\n\n【3. BT vs FSM 对比】① 结构：树状 vs 图状；② 扩展性：子树复用防状态爆炸 vs 状态多易爆炸；③ 并行与中断：原生强支持 vs 需手动实现；④ 适用场景：复杂动态 AI vs 简单固定逻辑（常混用：FSM 管宏观、BT 管微观）。',
    anim: { engine: 'bt', mode: 'interrupt', caption: '取消勾选右侧【看到玩家】，亲眼见证 Parallel + Until Failure 瞬间中断！' }
  },
  {
    id: 'e8', topic: 't_intercept', demo: 'space_intercept', type: 'essay', module: 'm2', tag: '大题高频·拦截推导',
    stem: '请完整写出【拦截算法 (Interception)】的六个实现步骤及核心向量公式，并计算：火箭位置 (80, 220)、速度 (6, 5)；怪兽位置 (380, 160)、初速度 (0, 0)，求第一帧预测拦截点 St 的坐标。',
    rubric: [
      '写出完整6步：测 Vprey → 算相对速度 Vr=Vprey-Vpred → 算相对距离 Sr=Sprey-Spred → 算拦截时间 tc=|Sr|/|Vr| → 算拦截点 St=Sprey+Vprey*tc → 期望速度 (St-Spred)/tc 限幅移动。',
      '代入计算：Vr=(6,5), |Vr|≈7.81；Sr=(-300,60), |Sr|≈305.94。',
      'tc = 305.94 / 7.81 ≈ 39.17。',
      'St = (80 + 6×39.17, 220 + 5×39.17) ≈ (315.0, 415.9)。'
    ],
    modelAnswer: '【一、拦截算法 6 步法】\n① 测量目标速度 Vprey；\n② 相对速度 Vr = Vprey - Vpredator；\n③ 相对距离 Sr = Sprey - Spredator；\n④ 拦截时间 tc = |Sr| / |Vr|；\n⑤ 拦截点 St = Sprey + Vprey × tc；\n⑥ 用 Seek 朝拦截点移动：Vdesired = (St - Spredator) / tc，限幅 maxSpeed 更新位置。\n\n【二、太空拦截计算】\n• Vr = (6, 5) - (0, 0) = (6, 5)，|Vr| = √(36+25) ≈ 7.81；\n• Sr = (80-380, 220-160) = (-300, 60)，|Sr| = √(90000+3600) ≈ 305.94；\n• tc = 305.94 / 7.81 ≈ 39.17；\n• St = (80 + 6×39.17, 220 + 5×39.17) ≈ (315.0, 415.9)。',
    anim: { engine: 'steering', mode: 'intercept', caption: '拦截算法动态对比：实时显示 |Sr|、|Vr|、tc 与预测截击点 St！' }
  },
  {
    id: 'e9', topic: 't_bt', demo: 'bt_tick', type: 'essay', module: 'm6', tag: '画图必练·行为树设计',
    stem: '【行为树设计与画图】请设计经典游戏 AI 战斗决策行为树：优先级从高到低依次为 ① 若低血量则撤退/回血；② 若发现敌人则移动并攻击；③ 否则默认巡逻。请使用下方行为树画板绘出完整树状结构（体现 Selector、Sequence、条件/行为叶节点及从左到右优先级），并简述 Selector 与 Sequence 的返回值执行规则。',
    board: {
      kind: 'bt',
      preset: 'combat',
      title: '行为树画板：绘制战斗决策行为树（Selector + Sequence + 叶节点）',
      guide: '顶层放置 Selector (?)，按从左到右优先级依次挂接：① 低血量保命 Sequence(低血量？ → 撤退/回血)；② 发现敌人战斗 Sequence(发现敌人？ → 追踪/攻击)；③ 默认巡逻动作叶节点。'
    },
    rubric: [
      '顶层采用选择节点 Selector (?) 按优先级从左到右依次尝试三条分支',
      '高优先保命分支：Sequence (→) 包含条件节点【低血量？】与行为节点【撤退 / 治疗】',
      '中优先战斗分支：Sequence (→) 包含条件节点【发现敌人？】与行为节点【追击 / 攻击】；低优先兜底动作【巡逻】',
      '执行规则：Selector 遇子节点返 Success/Running 即停止返回，全失败才返 Failure；Sequence 遇 Failure 即返 Failure，全 Success 才返 Success'
    ],
    modelAnswer: '【1. 行为树树形结构】\nRoot → Selector (?)\n  ├── #1 Sequence (→) [最高优先级]：条件叶(低血量？) → 行为叶(撤退/回血)\n  ├── #2 Sequence (→) [中优先级]：条件叶(发现敌人？) → 行为叶(追踪) → 行为叶(攻击)\n  └── #3 Action [兜底默认]：行为叶(巡逻)\n\n【2. 执行与返回值规则】\n• Selector (?) 从左到右依次 Tick 子节点：任一子节点返回 Success 或 Running 立即向上返回该状态；全部返回 Failure 才返回 Failure。\n• Sequence (→) 从左到右依次 Tick 子节点：任一子节点返回 Failure 立即中止并返回 Failure；全部返回 Success 才返回 Success。',
    anim: { engine: 'bt', mode: 'combat', caption: '标准战斗决策行为树：勾选右侧状态切换条件，观察 Selector 从左到右三分支决策流转！' }
  },
  {
    id: 'e10', topic: 't_astar_opt', demo: 'astar_core', type: 'essay', module: 'm4', tag: '压轴必考·A*画图计算',
    stem: '【A* 寻路画板作答】如图所示 5×6 网格（列宽 col=6，格号 0~29），起点为 <b>S(12)</b>，终点为 <b>G(17)</b>，深色墙格为 [8, 14, 20, 21]。规则：① 八方向移动，正交直走代价 10、对角斜走代价 14；② <b>禁止斜穿障碍物角点（Corner Cut）</b>；③ 启发函数采用曼哈顿距离 h=(|Δrow|+|Δcol|)×10。请直接在下方画板绘出从 S(12) 到 G(17) 的<b>最优路径</b>（任一条等代价最优路径均可），并在文字框写出最短总代价 g* 及关键转折格 f/g/h 算式。',
    board: {
      kind: 'pathgrid',
      role: 'graded',
      rows: 5,
      cols: 6,
      start: 12,
      end: 17,
      obstacles: [8, 14, 20, 21],
      givenNotes: { 12: '50|0/50' },
      allowCornerCut: false,
      title: 'A* 寻路作答画板：绕障求 S(12) → G(17) 最短路径（禁止切角）',
      guide: '使用「描绘路径」沿 8 邻域格子拖出从 S(12) 到 G(17) 的最优合法路径（系统禁止切障碍角点），支持等价多解自动判对！'
    },
    rubric: [
      '路径起点为 S(12)、终点为 G(17)，且全程避开障碍格 [8,14,20,21] 与禁止对角切角 (如 7→2 非法)',
      '最优总代价 g* = 72（顶部绕行序列如 12-7-1-2-3-10-17 或 12-6-1-2-3-10-17；底部绕行 78 非最优）',
      '算式验算清晰：12→7(+14)→1(+10)→2(+10)→3(+10)→10(+14)→17(+14) = 72，结合 h=(|Δr|+|Δc|)×10 说明 Open 选取依据'
    ],
    modelAnswer: '【1. 等价最优路径（多解任一均可）】\n路径 A：12 → 7 → 1 → 2 → 3 → 10 → 17（斜14 + 直10 + 直10 + 直10 + 斜14 + 斜14 = 72）\n路径 B：12 → 6 → 1 → 2 → 3 → 10 → 17（直10 + 斜14 + 直10 + 直10 + 斜14 + 斜14 = 72）\n\n【2. 最短总代价与避坑说明】\n• 最小总代价 g* = 72。\n• 注意：7(1,1) 不能直接斜走到 2(0,2)，因为 (1,2)=8 是障碍物，禁止斜穿墙角 (Corner Cut)！\n• 从下方绕过障碍 20、21（如 12→19→25→26→27→28→23→17）虽然合法但总代价为 78 > 72，不是最优解。',
    anim: { engine: 'astar', mode: 'ppt', caption: '结合 A* 经典搜索动画复盘 Open/Close 与禁止切角规则' }
  },

  /* ==================== 五、编程题 (9题：5大真题程序填空 + 4大核心算法编码) ==================== */
  {
    id: 'c1', topic: 't_mechanics', demo: 'reflect_wall', type: 'code', subkind: 'fill', module: 'm1', tag: '真题编程填空·6空',
    stem: '【编程填空】篮球运动更新与四周墙壁、篮筐点、斜面三脚架碰撞处理（不写末尾分号）：',
    codeTemplate: `void Update() {
    float dt = Time.deltaTime;
    if (isShoot) {
        Vector2 ballpos = ball.anchoredPosition;
        // 提示1：由 v = v0 + a * dt 计算本帧最新速度（利用 velocity 与 acceleration）
        velocity = [___空1___];
        // 提示2：由位置 = 原位置 + 速度 * 帧间时间 dt 更新 UI 坐标
        ball.anchoredPosition = [___空2___];
        HandleCollision();
    }
}
void HandleCollision() {
    // 提示3：撞右竖直墙（法线沿 X 轴），仅使速度水平分量 x 取反，y 保持不变
    if (碰到右竖直墙壁) { [___空3___]; }
    // 提示4：撞上水平板（法线沿 Y 轴），仅使速度竖直分量 y 取反，x 保持不变
    if (碰到上水平天花板) { [___空4___]; }
    // 提示5：撞击篮筐边缘点，速度沿来向原路全向量取反
    if (碰到篮筐上的某个点) { [___空5___]; }
    if (碰到地面的三脚架) {                       // 已知斜面单位法向量为 N
        // 提示6：向量反射公式 v' = 2 * N * (-Vector2.Dot(velocity, N)) + velocity（或 Vector2.Reflect）
        [___空6___];
    }
}`,
    blanks: [
      { label: '空1 (速度更新)', answers: ['velocity+acceleration*dt'] },
      { label: '空2 (位置更新)', answers: ['ballpos+velocity*dt'] },
      { label: '空3 (右竖直墙)', answers: ['velocity.x=-velocity.x'] },
      { label: '空4 (上水平板)', answers: ['velocity.y=-velocity.y'] },
      { label: '空5 (篮筐点)', answers: ['velocity=-velocity'] },
      { label: '空6 (斜面三脚架)', answers: ['velocity=2*N*(-Vector2.Dot(velocity,N))+velocity', 'velocity=N*2*(-Vector2.Dot(velocity,N))+velocity', 'velocity=2*N*(-Vector2.Dot(N,velocity))+velocity', 'velocity=N*2*(-Vector2.Dot(N,velocity))+velocity', 'velocity=Vector2.Reflect(velocity,N)'] }
    ],
    explain: '注意：超高频真题原题！记住四种碰撞差异：① 竖直墙改 x：<code>velocity.x = -velocity.x</code>；② 水平板改 y：<code>velocity.y = -velocity.y</code>；③ 撞篮筐点全反：<code>velocity = -velocity</code>；④ 斜面用点积投影公式：<code>velocity = 2 * N * (-Vector2.Dot(velocity, N)) + velocity</code>！',
    anim: { engine: 'physics', mode: 'reflect', params: { slopeAngle: 37, vi: [8, -10] }, caption: '拖动右侧倾角滑块：0°水平板、90°竖直墙、37°斜面三脚架一键演示！' }
  },
  {
    id: 'c2', topic: 't_pattern', demo: 'pattern_move', type: 'code', subkind: 'fill', module: 'm2', tag: '真题编程填空·7空',
    stem: '【编程填空】Monster 矩形模式移动核心方法 <code>DoPattern</code>（不写末尾分号）：',
    codeTemplate: `void DoPattern(ArrayList patternArray, float dt) {
    ControlData data = (ControlData)patternArray[curIndex];
    monsterAngle += data.fLeftAngle - data.fRightAngle;
    // 提示1：对一圈 360° 取模（% 360），防止多圈累加溢出
    monsterAngle = [___空1___];
    if (monsterAngle < 0) {
        // 提示2：C# 中负角度取模仍为负值，小于 0 时需加上 360 转为 [0, 360)
        [___空2___];
    }
    float angle = monsterAngle * Mathf.Deg2Rad;
    // 提示3：极坐标转二维单位方向向量 new Vector2(Mathf.Cos(弧度), Mathf.Sin(弧度))
    Vector2 v = [___空3___];
    Vector2 pos = monster.anchoredPosition;
    Vector2 displacement = v * MonsterSpeed * dt;
    stepDistance += displacement.magnitude;
    // 提示4：将本帧位移向量 displacement 累加到当前位置 pos
    pos = [___空4___];
    if (stepDistance >= data.fForwardDis - data.fBackwardDis) {
        ++curIndex;
        // 提示5：对指令集合长度 patternArray.Count 取模（%=），实现循环巡逻
        [___空5___];
        // 提示6：当前段距离已走完，累计步长 stepDistance 重置归零
        stepDistance = [___空6___];
    }
    // 提示7：将算好的新位置 pos 写回怪物 UI 组件属性 monster.anchoredPosition
    [___空7___];
    SetMonsterDirection(monsterAngle);
}`,
    blanks: [
      { label: '空1', answers: ['monsterAngle%360'] },
      { label: '空2', answers: ['monsterAngle+=360', 'monsterAngle=monsterAngle+360'] },
      { label: '空3', answers: ['new Vector2(Mathf.Cos(angle),Mathf.Sin(angle))'] },
      { label: '空4', answers: ['pos+displacement'] },
      { label: '空5', answers: ['curIndex%=patternArray.Count', 'curIndex=curIndex%patternArray.Count'] },
      { label: '空6', answers: ['0'] },
      { label: '空7', answers: ['monster.anchoredPosition=pos'] }
    ],
    explain: '核心 7 空一口气拿下：① <code>monsterAngle % 360</code>；② <code>monsterAngle += 360</code>；③ <code>new Vector2(Mathf.Cos(angle), Mathf.Sin(angle))</code>；④ <code>pos + displacement</code>；⑤ <code>curIndex %= patternArray.Count</code>；⑥ <code>0</code>；⑦ <code>monster.anchoredPosition = pos</code>！',
    anim: { engine: 'pattern', mode: 'rect', caption: 'DoPattern 实时动画：同步查看角度归一化、stepDistance 与 curIndex 循环！' }
  },
  {
    id: 'c3', topic: 't_follow_wall', demo: 'wall_tracing', type: 'code', subkind: 'fill', module: 'm3', tag: '真题编程填空·4空',
    stem: '【编程填空】Monster 八方向【右手优先】沿墙走算法 <code>doWallTracing</code>（不写末尾分号）：',
    codeTemplate: `void doWallTracing(float dt) {
    case RoleState.ReachTarget:
        Vector2 curPos = map.toColRow(sprite.anchoredPosition + Canvas.offset);
        // 提示1：8方向顺时针编号时，右手方向(+90°)为 curDirection + 2（随 --i 逆时针扫 8 格）
        for (int i = [___空1___]; i > curDirection - 6; --i) {
            // 提示2：防止负数下标，先加周期 8 再对 8 取模：(i + 8) % 8
            int walkDir = [___空2___];
            Vector2 pt = curPos + dirs[walkDir];
            // 提示3：调用地图接口 map.canPassWithRowCol(pt) 检查探测格是否无障碍
            if ([___空3___]) {
                // 提示4：调用地图接口 map.toXY(pt) 将行列格转为中心像素坐标
                target = [___空4___];
                monsterState = RoleState.Chasing;
                curDirection = walkDir;
                break;
            }
        }
        break;
}`,
    blanks: [
      { label: '空1 (右手起始)', answers: ['curDirection+2'] },
      { label: '空2 (0~7归一化)', answers: ['(i+8)%8'] },
      { label: '空3 (可通行判断)', answers: ['map.canPassWithRowCol(pt)'] },
      { label: '空4 (转像素坐标)', answers: ['map.toXY(pt)'] }
    ],
    explain: '注意：真题重考两次的超重点！① 右手优先从 <code>curDirection + 2</code> 开始（逆时针递减 8 次）；② 负数取模必加 8：<code>(i + 8) % 8</code>；③ <code>map.canPassWithRowCol(pt)</code>；④ <code>map.toXY(pt)</code>！',
    anim: { engine: 'basic_path', mode: 'wall', params: { hand: 'right' }, caption: '八方向右手优先沿墙走：黄色箭头标示每次试探的右手起点 (dir+2)%8！' }
  },
  {
    id: 'c4', topic: 't_follow_wall', demo: 'path_following', type: 'code', subkind: 'fill', module: 'm3', tag: '真题编程填空·3段',
    stem: '【编程填空】沿路径走算法 <code>doPathFollowing</code>，从给定代码片选项中拼接 3 处逻辑（直接输入字母序列，如 AMDBCN）：<br>A. <code>for(int i=0;i&lt;8;++i)</code> &nbsp; B. <code>if(!map.canPassWithRowCol(pnt))</code> &nbsp; C. <code>weight[i]-=10;</code> &nbsp; D. <code>Vector2 pnt=curPos+dirs[i];</code> &nbsp; E. <code>if(weight[i]&gt;maxWeight)</code> &nbsp; F. <code>for(int i=0;i&lt;8;++i)</code> &nbsp; G. <code>maxWeight=weight[i];</code> &nbsp; H. <code>curDirection=i;</code> &nbsp; I. <code>Vector2 pt=curPos+dirs[curDirection];</code> &nbsp; J. <code>target=map.toXY(pt);</code> &nbsp; M. <code>{</code> &nbsp; N. <code>}</code>',
    codeTemplate: `// 已按当前方向初始化 weight[0..7] = 10,9,8,7,6,7,8,9
Vector2 curPos = map.toColRow(sprite.anchoredPosition + Canvas.offset);
// 提示1（代码拼接）：for(8格) { 求邻格 pnt; 若 !canPass(pnt) 执行减权 weight[i]-=10; }（注意大括号 M/N）
[___空1___]
// 提示2（代码拼接）：for(8格) { if(weight[i]>maxWeight) { 更新 maxWeight; 记录 curDirection=i; } }
[___空2___]
// 提示3（代码拼接）：先按最佳方向算出行列坐标 pt，再调用 map.toXY(pt) 赋给像素目标 target
[___空3___]
monsterState = RoleState.Chasing;`,
    blanks: [
      { label: '空1 (障碍减权)', answers: ['AMDBCN'] },
      { label: '空2 (找最大权重)', answers: ['FMEMGHNN'] },
      { label: '空3 (算目标target)', answers: ['IJ'] }
    ],
    explain: '展开还原超清晰：\n• 空1 (AMDBCN)：<code>for(int i=0;i&lt;8;++i) { Vector2 pnt=curPos+dirs[i]; if(!map.canPassWithRowCol(pnt)) weight[i]-=10; }</code>\n• 空2 (FMEMGHNN)：<code>for(int i=0;i&lt;8;++i) { if(weight[i]&gt;maxWeight) { maxWeight=weight[i]; curDirection=i; } }</code>\n• 空3 (IJ)：<code>Vector2 pt=curPos+dirs[curDirection]; target=map.toXY(pt);</code>',
    anim: { engine: 'basic_path', mode: 'pathfollow', caption: '沿路径走实时权重动画：障碍物变红减10，AI每步选最高分方向！' }
  },
  {
    id: 'c5', topic: 't_avoid', demo: 'random_bypass', type: 'code', subkind: 'fill', module: 'm3', tag: '真题编程填空·核心',
    stem: '【编程填空】随机移动避障 <code>DoRandomPathFinding</code>（RandomMoving 分支，填写核心 C# 表达式，不写分号）：',
    codeTemplate: `// 随机移动状态：已算出下一步位置 pos = pos + displacement
// 提示1：调用 TileMap.canPass(pos)（或 tileMap.canPass(pos)）检测试探位置是否无障碍
if ([___空1___]) {
    // 提示2：位置合法，直接把试探点 pos 赋给 monster.anchoredPosition
    monster.anchoredPosition = [___空2___];
    // 提示3：在原累计距离 monsterMovedDis 上累加本次位移模长 displacement.magnitude
    monsterMovedDis = [___空3___];
    // 提示4：判断是否已走完随机步长（monsterMovedDis >= monsterNeedMoveDis）
    if ([___空4___]) {
        // 提示5：随机段完成，切回追踪玩家状态 RoleState.Tracing（或 Tracing）
        monsterState = [___空5___];
        monsterMovedDis = 0; monsterNeedMoveDis = 0;
        // 提示6：向量相减口诀“终点减起点”：player.anchoredPosition - monster.anchoredPosition
        Vector2 vr = [___空6___];
        vr.Normalize();
        // 提示7：归一化方向向量 vr 乘以移动速率 MonsterSpeed 得到速度向量
        monsterVelocity = [___空7___];
    }
} else {
    // 提示8：遇障无法前进，立即将需行走步长 monsterNeedMoveDis 清 0，触发下帧重新随机旋转
    [___空8___];
}`,
    blanks: [
      { label: '空1 (可通行判断)', answers: ['TileMap.canPass(pos)', 'tileMap.canPass(pos)'] },
      { label: '空2 (赋值新位置)', answers: ['pos'] },
      { label: '空3 (累加距离)', answers: ['monsterMovedDis+displacement.magnitude'] },
      { label: '空4 (判走完步长)', answers: ['monsterMovedDis>=monsterNeedMoveDis'] },
      { label: '空5 (切换状态)', answers: ['Tracing', 'RoleState.Tracing'] },
      { label: '空6 (指向玩家)', answers: ['player.anchoredPosition-monster.anchoredPosition'] },
      { label: '空7 (速度向量)', answers: ['vr*MonsterSpeed'] },
      { label: '空8 (碰障归零)', answers: ['monsterNeedMoveDis=0'] }
    ],
    explain: '逻辑闭环超顺滑：能走 → 移至 pos 并累加位移 → 走满需走距离就切回 Tracing 并重算朝向 player 的归一化速度；若随机行走中途又撞墙 → <code>monsterNeedMoveDis = 0</code> 触发下一帧重新随机旋转！',
    anim: { engine: 'basic_path', mode: 'random', caption: '实时演示 Tracing ↔ RandomMoving 状态切换与碰障清零重转！' }
  },
  {
    id: 'c6', topic: 't_intercept', demo: 'space_intercept', type: 'code', subkind: 'write', module: 'm2', tag: '程序编码·必练',
    stem: '【程序编码】请编写 Unity C# 拦截算法核心代码片段：已知目标位置 <code>prey.position</code>、目标速度 <code>preyVelocity</code>、追逐者位置 <code>predator.position</code>、追逐者当前速度 <code>predatorVelocity</code> 与最大速度 <code>maxSpeed</code>，请计算拦截时间、拦截点、限幅期望速度并更新本帧位置。',
    starterCode: `void UpdateIntercept() {
    // 提示1：分别计算相对速度 (preyVelocity - predatorVelocity) 与相对距离 (prey.position - predator.position)

    // 提示2：拦截时间 interceptTime = 相对距离.magnitude / 相对速度.magnitude（可加极小值防除零）

    // 提示3：预测未来交汇点 interceptPoint = 目标当前位置 + 目标速度 * interceptTime

    // 提示4：期望速度 = (拦截点 - 追逐者位置) / interceptTime，并用 Vector3.ClampMagnitude(..., maxSpeed) 限幅

    // 提示5：使用 newVelocity * Time.deltaTime 实现帧率无关位置更新（更新 predator.position）

}`,
    rubric: [
      '计算相对速度 relativeVelocity = preyVelocity - predatorVelocity 与相对距离 relativeDistance = prey.position - predator.position',
      '计算拦截时间 interceptTime = relativeDistance.magnitude / relativeVelocity.magnitude（可加除零保护）',
      '预测拦截点 interceptPoint = prey.position + preyVelocity * interceptTime',
      '计算期望速度 (interceptPoint - predator.position) / interceptTime 并使用 Vector3.ClampMagnitude(..., maxSpeed) 限幅',
      '使用 transform.position += newVelocity * Time.deltaTime 更新本帧位移'
    ],
    modelCode: `void UpdateIntercept() {
    // 1. 计算相对速度与相对距离
    Vector3 relativeVelocity = preyVelocity - predatorVelocity;
    Vector3 relativeDistance = prey.position - predator.position;

    // 2. 计算预测拦截时间 tc (防除零)
    float speedMag = relativeVelocity.magnitude;
    if (speedMag < 0.001f) return;
    float interceptTime = relativeDistance.magnitude / speedMag;

    // 3. 预测未来拦截点 St
    Vector3 interceptPoint = prey.position + preyVelocity * interceptTime;

    // 4. 计算期望速度并限制最大速度
    Vector3 desiredVelocity = (interceptPoint - predator.position) / interceptTime;
    Vector3 newVelocity = Vector3.ClampMagnitude(desiredVelocity, maxSpeed);

    // 5. 帧率无关更新位置
    predator.position += newVelocity * Time.deltaTime;
}`,
    anim: { engine: 'steering', mode: 'intercept', caption: '太空拦截代码实时运行效果：蓝色鲸鱼直扑未来交汇点 St！' }
  },
  {
    id: 'c7', topic: 't_dfs_bfs', demo: 'dfs_bfs', type: 'code', subkind: 'write', module: 'm4', tag: '程序编码·高频',
    stem: '【程序编码】请写出实验课框架下的【DFS 递归寻路函数 <code>doDFSRecursionSearch(MapNode from, MapNode to)</code>】及【父节点路径回溯生成函数 <code>generatePath(MapNode targetNode)</code>】完整 Unity C# 核心代码。',
    starterCode: `bool doDFSRecursionSearch(MapNode from, MapNode to) {
    // 提示1：先设 from.visited = true 防死循环；若抵达终点 (from == to) 直接 return true

    for (int i = 0; i < 8; ++i) {
        Vector2Int nextPos = from.pos + dirs[i];
        // 提示2：若 map.canPassWithRowCol(nextPos) 为真，取节点 MapNode next = map.getNode(nextPos)
        //       当 !next.visited 时：记录 next.parent = from，再递归调用 doDFSRecursionSearch(next, to)

    }
    return false;
}

ArrayList generatePath(MapNode targetNode) {
    ArrayList path = new ArrayList();
    MapNode node = targetNode;
    path.Add(node);
    // 提示3：while (node.parent != null) 沿父指针倒推加入 path 并更新 node = node.parent

    // 提示4：此时 path 为「终点 -> 起点」，需调用 path.Reverse() 反转为正向路径！
    return path;
}`,
    rubric: [
      '标记 from.visited = true，判断递归基 if (from == to) return true',
      'for (int i = 0; i < 8; ++i) 计算邻接点坐标，判断是否可通行且 !next.visited',
      '设置 next.parent = from，递归调用 if (doDFSRecursionSearch(next, to)) return true',
      'generatePath 从 targetNode 开始 while (node.parent != null) 沿 parent 倒推加入列表，最后调用 path.Reverse() 反转返回！'
    ],
    modelCode: `bool doDFSRecursionSearch(MapNode from, MapNode to) {
    from.visited = true;                     // 1. 标记已访问
    if (from == to) return true;             // 2. 找到终点，递归终止

    for (int i = 0; i < 8; ++i) {            // 3. 遍历八方向邻接点
        Vector2Int nextPos = from.pos + dirs[i];
        if (map.canPassWithRowCol(nextPos)) {
            MapNode next = map.getNode(nextPos);
            if (!next.visited) {
                next.parent = from;          // 记录父节点用于回溯
                if (doDFSRecursionSearch(next, to))
                    return true;             // 找到目标逐层向上返回 true
            }
        }
    }
    return false;                            // 8方向均无解，自动回溯
}

ArrayList generatePath(MapNode targetNode) {
    ArrayList path = new ArrayList();
    MapNode node = targetNode;
    path.Add(node);
    while (node.parent != null) {            // 沿 parent 倒推至起点
        path.Add(node.parent);
        node = node.parent;
    }
    path.Reverse();                          // 反转得到 起点 -> 终点 路径
    return path;
}`,
    anim: { engine: 'graph_search', mode: 'dfs', caption: 'DFS 深入探索 + 遇障回溯 + 终点父节点反转生成绿色路径！' }
  },
  {
    id: 'c8', topic: 't_dfs_bfs', demo: 'dfs_bfs', type: 'code', subkind: 'write', module: 'm4', tag: '程序编码·高频',
    stem: '【程序编码】请使用队列 <code>Queue&lt;MapNode&gt;</code> 编写【广度优先搜索 (BFS) 网格寻路函数 <code>doBFSSearch(MapNode start, MapNode target)</code>】核心 C# 代码片段。',
    starterCode: `bool doBFSSearch(MapNode start, MapNode target) {
    if (start == target) return true;
    // 提示1：初始化 Queue<MapNode>，必须先标 start.visited = true 再 Enqueue(start) 入队（防重复入队！）

    // 提示2：while (queue.Count > 0) 循环，每次 Dequeue() 取出队头节点 cur

        // 提示3：遍历 8 方向 dirs[i]，检查 map.canPassWithRowCol(nextPos) 且 !next.visited

            // 提示4：邻接格在【入队前】设 visited = true 与 next.parent = cur；若 next == target 生成路径返回 true，否则 Enqueue(next)

    return false;
}`,
    rubric: [
      '判起点即终点；初始化 Queue<MapNode>，起点标记 visited=true 并 Enqueue 入队',
      'while (queue.Count > 0) 循环，MapNode cur = queue.Dequeue() 出队',
      '遍历 8 方向邻接点：判断可通行且 !next.visited',
      '设置 next.visited = true，next.parent = cur，queue.Enqueue(next)',
      '若 next == target 则调用 generatePath(target) 返回成功'
    ],
    modelCode: `bool doBFSSearch(MapNode start, MapNode target) {
    if (start == target) return true;

    Queue<MapNode> queue = new Queue<MapNode>();
    start.visited = true;
    queue.Enqueue(start);                    // 起点入队并标记已访问

    while (queue.Count > 0) {
        MapNode cur = queue.Dequeue();       // 队头出队
        for (int i = 0; i < 8; ++i) {
            Vector2Int nextPos = cur.pos + dirs[i];
            if (!map.canPassWithRowCol(nextPos)) continue;
            MapNode next = map.getNode(nextPos);
            if (!next.visited) {
                next.visited = true;
                next.parent = cur;           // 记录父节点
                if (next == target) {
                    path = generatePath(target);
                    return true;             // 首次到达必为无权图最短路！
                }
                queue.Enqueue(next);
            }
        }
    }
    return false;                            // 队空仍未找到，寻路失败
}`,
    anim: { engine: 'graph_search', mode: 'bfs', caption: 'BFS 队列逐层波纹扩散，首次抵达终点即生成最短路径！' }
  },
  {
    id: 'c9', topic: 't_fsm_pattern', demo: 'fsm_state_pattern', type: 'code', subkind: 'write', module: 'm5', tag: '程序编码·状态模式',
    stem: '【程序编码】请使用【标准状态设计模式】编写游戏怪物 AI 框架（包含 <code>IState</code> 接口的 Enter/Execute/Exit、<code>Monster</code> 上下文类的 Update 与 ChangeState，以及 <code>RunAway</code> 具体状态类：安全则切 Patrol，否则执行 LeaveEnemy）。',
    starterCode: `// 提示1：在 IState 接口中声明三生命周期方法（无返回值 void，参数均为 Monster）
public interface IState {
    // Enter / Execute / Exit
}

public class Monster {
    private IState _currentState;
    public void Update(float dt) {
        // 提示2：每帧委托当前状态执行逻辑（使用 _currentState?.Execute(this)）
    }

    public void ChangeState(IState newState) {
        // 提示3：状态切换严格三步顺序：先 Exit(this) 退出旧态 -> 再赋值给 _currentState -> 最后 Enter(this) 进入新态！
    }
}

public class RunAway : IState {
    public void Enter(Monster m) { }
    public void Execute(Monster m) {
        // 提示4：调用 m.IsSafe() 判断，安全则 m.ChangeState(new Patrol())，否则执行 m.LeaveEnemy()
    }
    public void Exit(Monster m) { }
}`,
    rubric: [
      '定义 public interface IState，包含 Enter(Monster m)、Execute(Monster m)、Exit(Monster m) 三个方法',
      'Monster 类持有 private IState _currentState；Update 调用 _currentState?.Execute(this)',
      'ChangeState(IState newState) 按严格顺序执行：_currentState?.Exit(this) → _currentState = newState → _currentState.Enter(this)',
      'RunAway 实现 IState，在 Execute 中判断 monster.IsSafe() 切换 new Patrol()，否则调用 monster.LeaveEnemy()'
    ],
    modelCode: `// Step 1: 抽象状态接口
public interface IState {
    void Enter(Monster monster);    // 进入状态执行一次
    void Execute(Monster monster);  // 每帧执行
    void Exit(Monster monster);     // 退出状态执行一次
}

// Step 2: 上下文 Context (Monster)
public class Monster {
    private IState _currentState;

    public void Update(float dt) {
        _currentState?.Execute(this);
    }

    public void ChangeState(IState newState) {
        _currentState?.Exit(this);  // 1. 退出旧状态
        _currentState = newState;   // 2. 切换状态引用
        _currentState.Enter(this);  // 3. 进入新状态
    }
}

// Step 3: 具体状态类 RunAway
public class RunAway : IState {
    public void Enter(Monster m)   { /* 播放逃跑动画 */ }
    public void Execute(Monster m) {
        if (m.IsSafe()) m.ChangeState(new Patrol());
        else m.LeaveEnemy();
    }
    public void Exit(Monster m)    { /* 清理逃跑状态 */ }
}`,
    anim: { engine: 'fsm', mode: 'guard', caption: '状态模式实时演示：点击事件看右侧 Exit → ChangeState → Enter 同步执行！' }
  }
];
