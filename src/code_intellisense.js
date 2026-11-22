/* ==========================================================================
   Deterministic Classic IDE IntelliSense & Selection Completion (Zero AI)
   Provides VS Code / Rider style prefix + CamelCase symbol completion,
   dot member inference, selection wrapping, auto-closing pairs & indentation.
   ========================================================================== */
(function(global) {
  'use strict';

  const KEYWORDS = [
    'if', 'else', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'break',
    'continue', 'default', 'return', 'new', 'this', 'base', 'true', 'false',
    'null', 'void', 'public', 'private', 'protected', 'internal', 'static',
    'readonly', 'const', 'class', 'struct', 'interface', 'enum', 'override',
    'virtual', 'abstract', 'var', 'int', 'float', 'double', 'bool', 'string',
    'char', 'in', 'out', 'ref', 'using', 'yield'
  ];

  const TYPES = [
    'Vector2', 'Vector3', 'Vector2Int', 'Mathf', 'Time', 'Input', 'Random',
    'Debug', 'Quaternion', 'Color', 'KeyCode', 'Transform', 'RectTransform',
    'GameObject', 'MonoBehaviour', 'Rigidbody', 'Collider', 'ArrayList',
    'List', 'Queue', 'Stack', 'HashSet', 'Dictionary', 'PriorityQueue',
    'MapNode', 'TileMap', 'ControlData', 'InstructionData', 'InstructionType',
    'RoleState', 'IState', 'Monster', 'Patrol', 'RunAway', 'Attack',
    'PatrolState', 'ChaseState', 'BTNode', 'BTStatus', 'Boid', 'Canvas',
    'Math', 'Array', 'String'
  ];

  const TYPE_SET = new Set(TYPES);
  const KEYWORD_SET = new Set(KEYWORDS);

  const MONO_MEMBERS = [
    { label: 'transform', kind: 'prop', insertText: 'transform', detail: 'Transform', doc: '当前对象的 Transform 组件', returnType: 'Transform' },
    { label: 'gameObject', kind: 'prop', insertText: 'gameObject', detail: 'GameObject', doc: '当前脚本挂载的 GameObject' },
    { label: 'GetComponent', kind: 'method', insertText: 'GetComponent()', cursorBack: 1, detail: 'T GetComponent<T>()', doc: '获取挂载组件' },
    { label: 'Start', kind: 'method', insertText: 'Start()', cursorBack: 0, detail: 'void Start()', doc: 'MonoBehaviour 初始化回调' },
    { label: 'Update', kind: 'method', insertText: 'Update()', cursorBack: 0, detail: 'void Update()', doc: 'MonoBehaviour 每帧更新回调' },
    { label: 'FixedUpdate', kind: 'method', insertText: 'FixedUpdate()', cursorBack: 0, detail: 'void FixedUpdate()', doc: '固定物理帧回调' }
  ];

  const SNIPPETS = [
    { label: 'if', kind: 'snip', insertText: 'if ($0) {\n    \n}', detail: 'snippet', doc: 'if 条件分支' },
    { label: 'ifelse', kind: 'snip', insertText: 'if ($0) {\n    \n} else {\n    \n}', detail: 'snippet', doc: 'if / else 双分支' },
    { label: 'for', kind: 'snip', insertText: 'for (int i = 0; i < $0; ++i) {\n    \n}', detail: 'snippet', doc: 'for 计数循环' },
    { label: 'foreach', kind: 'snip', insertText: 'foreach (var item in $0) {\n    \n}', detail: 'snippet', doc: 'foreach 集合遍历' },
    { label: 'while', kind: 'snip', insertText: 'while ($0) {\n    \n}', detail: 'snippet', doc: 'while 条件循环' },
    { label: 'switch', kind: 'snip', insertText: 'switch ($0) {\n    case :\n        break;\n}', detail: 'snippet', doc: 'switch 多分支' }
  ];

  function mArg(name, sig, doc, returnType) {
    return { label: name, kind: 'method', insertText: name + '()', cursorBack: 1, detail: sig, doc: doc || sig, returnType: returnType || null };
  }
  function mZero(name, sig, doc, returnType) {
    return { label: name, kind: 'method', insertText: name + '()', cursorBack: 0, detail: sig, doc: doc || sig, returnType: returnType || null };
  }
  function prop(name, typeStr, doc, returnType) {
    return { label: name, kind: 'prop', insertText: name, cursorBack: 0, detail: typeStr, doc: doc || name, returnType: returnType || null };
  }
  function enumMem(enumName, name, doc) {
    return { label: name, kind: 'enum', insertText: name, cursorBack: 0, detail: enumName, doc: doc || `${enumName}.${name}` };
  }

  const TYPE_MEMBERS = {
    Vector2: [
      mArg('Dot', 'float Dot(Vector2 a, Vector2 b)', '二维向量点积'),
      mArg('Reflect', 'Vector2 Reflect(Vector2 inDir, Vector2 inNormal)', '二维向量反射', 'Vector2_inst'),
      mArg('Distance', 'float Distance(Vector2 a, Vector2 b)', '两点间欧氏距离'),
      mArg('Lerp', 'Vector2 Lerp(Vector2 a, Vector2 b, float t)', '线性插值', 'Vector2_inst'),
      mArg('ClampMagnitude', 'Vector2 ClampMagnitude(Vector2 vec, float maxLength)', '限制向量最大模长', 'Vector2_inst'),
      mArg('Angle', 'float Angle(Vector2 from, Vector2 to)', '两向量夹角（度）'),
      mArg('MoveTowards', 'Vector2 MoveTowards(Vector2 cur, Vector2 target, float maxDelta)', '匀速趋近目标点', 'Vector2_inst'),
      prop('zero', 'Vector2', 'Vector2(0, 0)', 'Vector2_inst'),
      prop('one', 'Vector2', 'Vector2(1, 1)', 'Vector2_inst'),
      prop('up', 'Vector2', 'Vector2(0, 1)', 'Vector2_inst'),
      prop('down', 'Vector2', 'Vector2(0, -1)', 'Vector2_inst'),
      prop('left', 'Vector2', 'Vector2(-1, 0)', 'Vector2_inst'),
      prop('right', 'Vector2', 'Vector2(1, 0)', 'Vector2_inst')
    ],
    Vector2_inst: [
      prop('x', 'float', 'X 分量'),
      prop('y', 'float', 'Y 分量'),
      prop('magnitude', 'float', '向量模长（只读）'),
      prop('sqrMagnitude', 'float', '模长平方（免开方）'),
      prop('normalized', 'Vector2', '返回单位方向向量', 'Vector2_inst'),
      mZero('Normalize', 'void Normalize()', '原地将向量归一化为单位长度'),
      mArg('Set', 'void Set(float newX, float newY)', '设置 x 与 y 分量')
    ],
    Vector3: [
      mArg('ClampMagnitude', 'Vector3 ClampMagnitude(Vector3 vec, float maxLength)', '限制向量最大模长', 'Vector3_inst'),
      mArg('Dot', 'float Dot(Vector3 a, Vector3 b)', '三维向量点积'),
      mArg('Cross', 'Vector3 Cross(Vector3 a, Vector3 b)', '三维向量叉积', 'Vector3_inst'),
      mArg('Distance', 'float Distance(Vector3 a, Vector3 b)', '三维两点间距离'),
      mArg('Reflect', 'Vector3 Reflect(Vector3 inDir, Vector3 inNormal)', '三维向量反射', 'Vector3_inst'),
      mArg('Lerp', 'Vector3 Lerp(Vector3 a, Vector3 b, float t)', '三维线性插值', 'Vector3_inst'),
      mArg('Angle', 'float Angle(Vector3 from, Vector3 to)', '两向量夹角（度）'),
      mArg('MoveTowards', 'Vector3 MoveTowards(Vector3 cur, Vector3 target, float maxDelta)', '匀速趋近目标点', 'Vector3_inst'),
      prop('zero', 'Vector3', 'Vector3(0, 0, 0)', 'Vector3_inst'),
      prop('one', 'Vector3', 'Vector3(1, 1, 1)', 'Vector3_inst'),
      prop('up', 'Vector3', 'Vector3(0, 1, 0)', 'Vector3_inst'),
      prop('down', 'Vector3', 'Vector3(0, -1, 0)', 'Vector3_inst'),
      prop('left', 'Vector3', 'Vector3(-1, 0, 0)', 'Vector3_inst'),
      prop('right', 'Vector3', 'Vector3(1, 0, 0)', 'Vector3_inst'),
      prop('forward', 'Vector3', 'Vector3(0, 0, 1)', 'Vector3_inst'),
      prop('back', 'Vector3', 'Vector3(0, 0, -1)', 'Vector3_inst')
    ],
    Vector3_inst: [
      prop('x', 'float', 'X 分量'),
      prop('y', 'float', 'Y 分量'),
      prop('z', 'float', 'Z 分量'),
      prop('magnitude', 'float', '向量模长（只读）'),
      prop('sqrMagnitude', 'float', '模长平方'),
      prop('normalized', 'Vector3', '返回单位方向向量', 'Vector3_inst'),
      mZero('Normalize', 'void Normalize()', '原地将向量归一化'),
      mArg('Set', 'void Set(float newX, float newY, float newZ)', '设置三维分量')
    ],
    Vector2Int: [
      prop('zero', 'Vector2Int', 'Vector2Int(0, 0)', 'Vector2Int_inst'),
      prop('one', 'Vector2Int', 'Vector2Int(1, 1)', 'Vector2Int_inst'),
      prop('up', 'Vector2Int', 'Vector2Int(0, 1)', 'Vector2Int_inst'),
      prop('down', 'Vector2Int', 'Vector2Int(0, -1)', 'Vector2Int_inst'),
      prop('left', 'Vector2Int', 'Vector2Int(-1, 0)', 'Vector2Int_inst'),
      prop('right', 'Vector2Int', 'Vector2Int(1, 0)', 'Vector2Int_inst'),
      mArg('Distance', 'float Distance(Vector2Int a, Vector2Int b)', '网格整数坐标距离')
    ],
    Vector2Int_inst: [
      prop('x', 'int', '整型 X 坐标'),
      prop('y', 'int', '整型 Y 坐标'),
      prop('magnitude', 'float', '整数向量模长'),
      prop('sqrMagnitude', 'int', '整数模长平方')
    ],
    Mathf: [
      mArg('Cos', 'float Cos(float f)', '余弦函数（弧度）'),
      mArg('Sin', 'float Sin(float f)', '正弦函数（弧度）'),
      mArg('Tan', 'float Tan(float f)', '正切函数（弧度）'),
      mArg('Atan2', 'float Atan2(float y, float x)', '反正切（返回弧度）'),
      mArg('Acos', 'float Acos(float f)', '反余弦（返回弧度）'),
      mArg('Abs', 'float Abs(float f)', '绝对值'),
      mArg('Sqrt', 'float Sqrt(float f)', '平方根'),
      mArg('Pow', 'float Pow(float f, float p)', '幂运算'),
      mArg('Clamp', 'float Clamp(float value, float min, float max)', '区间限幅'),
      mArg('Clamp01', 'float Clamp01(float value)', '限幅到 [0, 1]'),
      mArg('Min', 'float Min(float a, float b)', '最小值'),
      mArg('Max', 'float Max(float a, float b)', '最大值'),
      mArg('Lerp', 'float Lerp(float a, float b, float t)', '线性插值'),
      mArg('Round', 'float Round(float f)', '四舍五入'),
      mArg('Floor', 'float Floor(float f)', '向下取整'),
      mArg('Ceil', 'float Ceil(float f)', '向上取整'),
      mArg('Sign', 'float Sign(float f)', '符号函数 (+1 / -1)'),
      mArg('Approximately', 'bool Approximately(float a, float b)', '浮点近似相等判断'),
      prop('Deg2Rad', 'float', '角度转弧度常量 (PI / 180)'),
      prop('Rad2Deg', 'float', '弧度转角度常量 (180 / PI)'),
      prop('PI', 'float', '圆周率 3.1415927f'),
      prop('Infinity', 'float', '正无穷大'),
      prop('Epsilon', 'float', '最小正浮点数精度常量')
    ],
    Time: [
      prop('deltaTime', 'float', '上一帧到当前帧耗时（秒）'),
      prop('fixedDeltaTime', 'float', '固定物理步长（秒）'),
      prop('time', 'float', '游戏运行累计时间（秒）'),
      prop('timeScale', 'float', '时间缩放倍率'),
      prop('frameCount', 'int', '已运行总帧数')
    ],
    Debug: [
      mArg('Log', 'void Log(object message)', '输出普通日志到控制台'),
      mArg('LogWarning', 'void LogWarning(object message)', '输出警告日志'),
      mArg('LogError', 'void LogError(object message)', '输出错误日志'),
      mArg('DrawLine', 'void DrawLine(Vector3 start, Vector3 end)', '在 Scene 视图绘制调试线段'),
      mArg('DrawRay', 'void DrawRay(Vector3 start, Vector3 dir)', '绘制调试射线')
    ],
    Random: [
      mArg('Range', 'float Range(float min, float max)', '生成区间随机数'),
      prop('value', 'float', '返回 [0.0, 1.0] 随机数'),
      prop('insideUnitCircle', 'Vector2', '单位圆内随机二维点', 'Vector2_inst'),
      prop('insideUnitSphere', 'Vector3', '单位球内随机三维点', 'Vector3_inst')
    ],
    Input: [
      mArg('GetKey', 'bool GetKey(KeyCode key)', '持续按下指定按键'),
      mArg('GetKeyDown', 'bool GetKeyDown(KeyCode key)', '当前帧按下按键'),
      mArg('GetKeyUp', 'bool GetKeyUp(KeyCode key)', '当前帧松开按键'),
      mArg('GetAxis', 'float GetAxis(string axisName)', '读取平滑虚拟轴'),
      mArg('GetAxisRaw', 'float GetAxisRaw(string axisName)', '读取原始虚拟轴'),
      prop('mousePosition', 'Vector3', '当前鼠标屏幕像素坐标', 'Vector3_inst')
    ],
    Math: [
      mArg('Abs', 'double Abs(double value)', 'System.Math 绝对值'),
      mArg('Sqrt', 'double Sqrt(double d)', '平方根'),
      mArg('Pow', 'double Pow(double x, double y)', '幂运算'),
      mArg('Min', 'double Min(double a, double b)', '最小值'),
      mArg('Max', 'double Max(double a, double b)', '最大值'),
      mArg('Cos', 'double Cos(double d)', '余弦'),
      mArg('Sin', 'double Sin(double a)', '正弦'),
      mArg('Round', 'double Round(double a)', '四舍五入'),
      mArg('Floor', 'double Floor(double d)', '向下取整'),
      mArg('Ceiling', 'double Ceiling(double a)', '向上取整'),
      prop('PI', 'double', '圆周率常量')
    ],
    Canvas: [
      prop('offset', 'Vector2', '地图画布坐标偏移量', 'Vector2_inst')
    ],
    TileMap: [
      mArg('canPass', 'bool canPass(Vector2 pos)', '像素坐标可通行检查'),
      mArg('canPassWithRowCol', 'bool canPassWithRowCol(Vector2 pt)', '行列网格坐标可通行检查'),
      mArg('toXY', 'Vector2 toXY(Vector2 pt)', '网格行列转中心像素坐标', 'Vector2_inst'),
      mArg('toColRow', 'Vector2 toColRow(Vector2 pos)', '像素坐标转网格行列', 'Vector2_inst'),
      mArg('getNode', 'MapNode getNode(Vector2Int pos)', '获取对应网格 MapNode 对象', 'MapNode'),
      prop('width', 'int', '地图网格列数'),
      prop('height', 'int', '地图网格行数'),
      prop('tileSize', 'float', '单个瓦片边长像素')
    ],
    Transform: [
      prop('position', 'Vector3', '世界空间位置坐标', 'Vector3_inst'),
      prop('anchoredPosition', 'Vector2', 'UI RectTransform 锚点二维位置', 'Vector2_inst'),
      prop('localPosition', 'Vector3', '相对父节点局部坐标', 'Vector3_inst'),
      prop('rotation', 'Quaternion', '世界旋转四元数'),
      prop('eulerAngles', 'Vector3', '欧拉角旋转', 'Vector3_inst'),
      prop('forward', 'Vector3', '前方向单位向量', 'Vector3_inst'),
      prop('right', 'Vector3', '右方向单位向量', 'Vector3_inst'),
      prop('up', 'Vector3', '上方向单位向量', 'Vector3_inst'),
      mArg('Translate', 'void Translate(Vector3 translation)', '沿位移向量平移'),
      mArg('Rotate', 'void Rotate(Vector3 eulers)', '按欧拉角旋转'),
      mArg('LookAt', 'void LookAt(Transform target)', '朝向目标变换')
    ],
    Queue: [
      mArg('Enqueue', 'void Enqueue(T item)', '将节点加入队尾'),
      mZero('Dequeue', 'T Dequeue()', '移除并返回队头元素', 'MapNode'),
      mZero('Peek', 'T Peek()', '查看队头但不出队', 'MapNode'),
      mArg('Contains', 'bool Contains(T item)', '判断是否已在队列中'),
      mZero('Clear', 'void Clear()', '清空队列'),
      prop('Count', 'int', '队列当前元素个数')
    ],
    Stack: [
      mArg('Push', 'void Push(T item)', '压入栈顶'),
      mZero('Pop', 'T Pop()', '弹出并返回栈顶元素', 'MapNode'),
      mZero('Peek', 'T Peek()', '查看栈顶但不弹出', 'MapNode'),
      mArg('Contains', 'bool Contains(T item)', '判断元素是否在栈内'),
      mZero('Clear', 'void Clear()', '清空栈'),
      prop('Count', 'int', '栈中元素个数')
    ],
    List: [
      mArg('Add', 'void Add(T item)', '向列表末尾添加元素'),
      mArg('Remove', 'bool Remove(T item)', '移除指定元素'),
      mArg('RemoveAt', 'void RemoveAt(int index)', '按索引移除元素'),
      mArg('Insert', 'void Insert(int index, T item)', '在指定位置插入元素'),
      mArg('Contains', 'bool Contains(T item)', '判断是否存在该元素'),
      mZero('Reverse', 'void Reverse()', '原地反转列表顺序'),
      mZero('Sort', 'void Sort()', '对列表排序'),
      mZero('Clear', 'void Clear()', '清空列表'),
      mArg('IndexOf', 'int IndexOf(T item)', '查找元素首次出现索引'),
      prop('Count', 'int', '列表元素总数')
    ],
    ArrayList: [
      mArg('Add', 'int Add(object value)', '追加元素到 ArrayList 末尾'),
      mArg('Remove', 'void Remove(object obj)', '移除指定对象'),
      mArg('RemoveAt', 'void RemoveAt(int index)', '按索引删除元素'),
      mArg('Insert', 'void Insert(int index, object value)', '在指定位置插入'),
      mArg('Contains', 'bool Contains(object item)', '判断是否包含对象'),
      mZero('Reverse', 'void Reverse()', '原地反转 ArrayList 元素顺序'),
      mZero('Clear', 'void Clear()', '清空集合'),
      prop('Count', 'int', '集合元素个数')
    ],
    HashSet: [
      mArg('Add', 'bool Add(T item)', '添加元素至集合'),
      mArg('Remove', 'bool Remove(T item)', '移除元素'),
      mArg('Contains', 'bool Contains(T item)', 'O(1) 判重包含检查'),
      mZero('Clear', 'void Clear()', '清空集合'),
      prop('Count', 'int', '集合基数')
    ],
    PriorityQueue: [
      mArg('Enqueue', 'void Enqueue(TElement elem, TPriority priority)', '按优先级入队'),
      mZero('Dequeue', 'TElement Dequeue()', '弹出最小优先级元素'),
      mZero('Peek', 'TElement Peek()', '查看队首元素'),
      mZero('Clear', 'void Clear()', '清空队列'),
      prop('Count', 'int', '元素数量')
    ],
    Array: [
      prop('Length', 'int', '数组固定长度'),
      mZero('Clone', 'object Clone()', '浅拷贝数组')
    ],
    MapNode: [
      prop('visited', 'bool', '是否已被搜索访问标记'),
      prop('parent', 'MapNode', '回溯父节点指针', 'MapNode'),
      prop('pos', 'Vector2Int', '节点网格坐标', 'Vector2Int_inst'),
      prop('g', 'float', '起点到当前实际代价 g(n)'),
      prop('h', 'float', '当前到终点启发估计代价 h(n)'),
      prop('f', 'float', 'A* 综合估价 f(n) = g + h'),
      prop('walkable', 'bool', '节点是否可通行'),
      prop('neighbors', 'List<MapNode>', '邻接节点列表', 'List'),
      prop('cost', 'float', '地形通行权重代价'),
      prop('x', 'int', '网格列号 x'),
      prop('y', 'int', '网格行号 y')
    ],
    ControlData: [
      prop('fLeftAngle', 'float', '左转指令角度（度）'),
      prop('fRightAngle', 'float', '右转指令角度（度）'),
      prop('fForwardDis', 'float', '前进步长距离'),
      prop('fBackwardDis', 'float', '后退步长距离'),
      prop('type', 'InstructionType', '指令类型'),
      prop('duration', 'float', '持续时间（秒）')
    ],
    InstructionData: [
      prop('type', 'InstructionType', '模式移动指令类型'),
      prop('value', 'float', '指令参数值（距离或角度）')
    ],
    IState: [
      mArg('Enter', 'void Enter(Monster m)', '进入该状态时执行一次'),
      mArg('Execute', 'void Execute(Monster m)', '状态激活期间每帧执行'),
      mArg('Exit', 'void Exit(Monster m)', '离开该状态切换前执行一次')
    ],
    Monster: [
      mZero('IsSafe', 'bool IsSafe()', '检测是否已远离威胁进入安全范围'),
      mZero('LeaveEnemy', 'void LeaveEnemy()', '继续远离敌人逃跑行为'),
      mArg('ChangeState', 'void ChangeState(IState newState)', '触发状态模式切换'),
      mZero('Update', 'void Update()', '每帧驱动当前状态逻辑'),
      prop('anchoredPosition', 'Vector2', 'Monster UI 锚点坐标', 'Vector2_inst'),
      prop('position', 'Vector3', 'Monster 世界坐标', 'Vector3_inst'),
      prop('velocity', 'Vector2', '当前速度向量', 'Vector2_inst'),
      prop('speed', 'float', '移动速率'),
      prop('hp', 'float', '当前生命值')
    ],
    Boid: [
      prop('position', 'Vector2', '群体智能体位置', 'Vector2_inst'),
      prop('velocity', 'Vector2', '当前速度向量', 'Vector2_inst'),
      prop('acceleration', 'Vector2', '合力加速度', 'Vector2_inst'),
      prop('maxSpeed', 'float', '最大巡航速度'),
      prop('maxForce', 'float', '最大转向合力')
    ],
    BTNode: [
      mZero('Evaluate', 'BTStatus Evaluate()', '评估行为树节点并返回状态'),
      prop('children', 'List<BTNode>', '子节点列表', 'List'),
      prop('state', 'BTStatus', '节点最近一次运行状态')
    ],
    RoleState: [
      enumMem('RoleState', 'Tracing', '追踪玩家状态'),
      enumMem('RoleState', 'Chasing', '沿墙/寻路追击状态'),
      enumMem('RoleState', 'RandomMoving', '随机避障移动状态'),
      enumMem('RoleState', 'ReachTarget', '抵达中间目标格状态'),
      enumMem('RoleState', 'Patrol', '巡逻状态'),
      enumMem('RoleState', 'Idle', '待机状态'),
      enumMem('RoleState', 'Attack', '攻击状态'),
      enumMem('RoleState', 'RunAway', '逃跑状态')
    ],
    InstructionType: [
      enumMem('InstructionType', 'MoveForward', '向前直行指令'),
      enumMem('InstructionType', 'TurnLeft', '向左转向指令'),
      enumMem('InstructionType', 'TurnRight', '向右转向指令'),
      enumMem('InstructionType', 'Wait', '原地等待指令'),
      enumMem('InstructionType', 'Stop', '停止运动指令')
    ],
    BTStatus: [
      enumMem('BTStatus', 'Success', '节点执行成功'),
      enumMem('BTStatus', 'Failure', '节点执行失败'),
      enumMem('BTStatus', 'Running', '节点正在执行（跨帧延续）')
    ],
    KeyCode: [
      enumMem('KeyCode', 'W', 'W 键'),
      enumMem('KeyCode', 'A', 'A 键'),
      enumMem('KeyCode', 'S', 'S 键'),
      enumMem('KeyCode', 'D', 'D 键'),
      enumMem('KeyCode', 'Space', '空格键'),
      enumMem('KeyCode', 'UpArrow', '上方向键'),
      enumMem('KeyCode', 'DownArrow', '下方向键'),
      enumMem('KeyCode', 'LeftArrow', '左方向键'),
      enumMem('KeyCode', 'RightArrow', '右方向键'),
      enumMem('KeyCode', 'Escape', 'ESC 键')
    ],
    Color: [
      prop('red', 'Color', '红色 RGBA(1,0,0,1)'),
      prop('green', 'Color', '绿色 RGBA(0,1,0,1)'),
      prop('blue', 'Color', '蓝色 RGBA(0,0,1,1)'),
      prop('white', 'Color', '白色 RGBA(1,1,1,1)'),
      prop('black', 'Color', '黑色 RGBA(0,0,0,1)'),
      prop('yellow', 'Color', '黄色 RGBA(1,0.92,0.016,1)'),
      prop('cyan', 'Color', '青色 RGBA(0,1,1,1)'),
      prop('gray', 'Color', '灰色'),
      prop('clear', 'Color', '全透明 RGBA(0,0,0,0)'),
      mArg('Lerp', 'Color Lerp(Color a, Color b, float t)', '颜色线性插值')
    ],
    Quaternion: [
      prop('identity', 'Quaternion', '无旋转单位四元数'),
      mArg('Euler', 'Quaternion Euler(float x, float y, float z)', '欧拉角转四元数'),
      mArg('LookRotation', 'Quaternion LookRotation(Vector3 forward)', '由朝向生成旋转'),
      mArg('Slerp', 'Quaternion Slerp(Quaternion a, Quaternion b, float t)', '球面插值旋转')
    ]
  };
  TYPE_MEMBERS.RectTransform = TYPE_MEMBERS.Transform;

  const PROP_RETURN_TYPE = {
    position: 'Vector3_inst',
    anchoredPosition: 'Vector2_inst',
    localPosition: 'Vector3_inst',
    forward: 'Vector3_inst',
    right: 'Vector3_inst',
    up: 'Vector3_inst',
    parent: 'MapNode',
    pos: 'Vector2Int_inst',
    transform: 'Transform',
    neighbors: 'List'
  };

  // Fallback types for common class fields in Unity AI course exercises
  const KNOWN_VAR_TYPES = {
    velocity: 'Vector2_inst',
    acceleration: 'Vector2_inst',
    N: 'Vector2_inst',
    displacement: 'Vector2_inst',
    vr: 'Vector2_inst',
    monsterVelocity: 'Vector2_inst',
    curPos: 'Vector2_inst',
    pt: 'Vector2_inst',
    pnt: 'Vector2_inst',
    target: 'Vector2_inst',
    ballpos: 'Vector2_inst',
    pos: 'Vector2_inst',
    v: 'Vector2_inst',
    preyVelocity: 'Vector3_inst',
    predatorVelocity: 'Vector3_inst',
    relativeVelocity: 'Vector3_inst',
    relativeDistance: 'Vector3_inst',
    desiredVelocity: 'Vector3_inst',
    newVelocity: 'Vector3_inst',
    interceptPoint: 'Vector3_inst',
    nextPos: 'Vector2Int_inst',
    ball: 'Transform',
    monster: 'Transform',
    player: 'Transform',
    sprite: 'Transform',
    prey: 'Transform',
    predator: 'Transform',
    transform: 'Transform',
    map: 'TileMap',
    tileMap: 'TileMap',
    patternArray: 'ArrayList',
    path: 'ArrayList',
    openList: 'ArrayList',
    closedList: 'ArrayList',
    queue: 'Queue',
    q: 'Queue',
    stack: 'Stack',
    st: 'Stack',
    data: 'ControlData',
    from: 'MapNode',
    to: 'MapNode',
    start: 'MapNode',
    node: 'MapNode',
    cur: 'MapNode',
    next: 'MapNode',
    targetNode: 'MapNode',
    current: 'MapNode',
    neighbor: 'MapNode',
    _currentState: 'IState',
    currentState: 'IState',
    newState: 'IState',
    state: 'IState',
    m: 'Monster',
    dirs: 'Array',
    weight: 'Array',
    weights: 'Array'
  };

  const TYPE_NORMALIZE_INST = {
    Vector2: 'Vector2_inst',
    Vector3: 'Vector3_inst',
    Vector2Int: 'Vector2Int_inst',
    RectTransform: 'Transform'
  };

  const FALLBACK_INSTANCE_POOL = [
    prop('x', 'float', 'X 分量'),
    prop('y', 'float', 'Y 分量'),
    prop('z', 'float', 'Z 分量'),
    prop('magnitude', 'float', '向量模长'),
    prop('normalized', 'Vector', '单位方向向量'),
    prop('position', 'Vector3', '世界坐标'),
    prop('anchoredPosition', 'Vector2', 'UI 锚点坐标'),
    prop('Count', 'int', '集合元素个数'),
    prop('Length', 'int', '数组长度'),
    prop('visited', 'bool', '访问标记'),
    prop('parent', 'MapNode', '父节点'),
    prop('pos', 'Vector2Int', '节点网格坐标'),
    mArg('Add', 'void Add(item)', '添加元素'),
    mArg('Remove', 'bool Remove(item)', '移除元素'),
    mArg('Contains', 'bool Contains(item)', '包含检查'),
    mZero('Clear', 'void Clear()', '清空'),
    mZero('Reverse', 'void Reverse()', '反转顺序'),
    mArg('Enqueue', 'void Enqueue(item)', '入队'),
    mZero('Dequeue', 'T Dequeue()', '出队'),
    mArg('Push', 'void Push(item)', '入栈'),
    mZero('Pop', 'T Pop()', '出栈'),
    mZero('Normalize', 'void Normalize()', '原地归一化')
  ];

  const KIND_BADGE = {
    kw: 'K',
    type: 'T',
    method: 'M',
    prop: 'P',
    enum: 'E',
    var: 'V',
    snip: 'S'
  };

  function toInstType(typeName) {
    return TYPE_NORMALIZE_INST[typeName] || typeName;
  }

  function displayTypeLabel(typeKey) {
    if (!typeKey) return '';
    return typeKey.replace(/_inst$/, '');
  }

  /* -------------------- Lexical Stripping & Guard Helpers -------------------- */
  function stripNonCode(code) {
    const src = String(code || '');
    return src.replace(
      /\/\/[^\n]*|\/\*[\s\S]*?\*\/|\$?"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\[___[^\]\n]+___\]/g,
      m => m.replace(/[^\n]/g, ' ')
    );
  }

  function isInsideCommentOrString(code, cursorPos) {
    const src = String(code || '');
    const limit = Math.max(0, Math.min(cursorPos ?? 0, src.length));
    let inLine = false;
    let inBlock = false;
    let inStr = false;
    let inChar = false;
    for (let i = 0; i < limit; i++) {
      const ch = src[i];
      const next = src[i + 1];
      if (inLine) {
        if (ch === '\n') inLine = false;
        continue;
      }
      if (inBlock) {
        if (ch === '*' && next === '/') {
          inBlock = false;
          i++;
        }
        continue;
      }
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === '"') inStr = false;
        continue;
      }
      if (inChar) {
        if (ch === '\\') { i++; continue; }
        if (ch === "'") inChar = false;
        continue;
      }
      if (ch === '/' && next === '/') { inLine = true; i++; continue; }
      if (ch === '/' && next === '*') { inBlock = true; i++; continue; }
      if (ch === '"') { inStr = true; continue; }
      if (ch === "'") { inChar = true; continue; }
    }
    return inLine || inBlock || inStr || inChar;
  }

  function inferVarTypes(code) {
    const cleaned = stripNonCode(code);
    const map = Object.create(null);

    const genericRe = /\b(Queue|Stack|List|HashSet|PriorityQueue)\s*<[^>\n]+>\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
    let m;
    while ((m = genericRe.exec(cleaned)) !== null) {
      map[m[2]] = m[1];
    }

    const arrRe = /\b(?:int|float|double|bool|string|Vector2|Vector3|Vector2Int|MapNode)\s*\[\s*\]\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
    while ((m = arrRe.exec(cleaned)) !== null) {
      map[m[1]] = 'Array';
    }

    const varDeclRe = /\b(?:(?:public|private|protected|internal|static|readonly|const|ref|out|in)\s+)*(Vector2Int|Vector2|Vector3|Transform|RectTransform|MapNode|TileMap|ArrayList|ControlData|InstructionData|IState|Monster|Boid|RoleState|BTStatus|BTNode)\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
    while ((m = varDeclRe.exec(cleaned)) !== null) {
      map[m[2]] = toInstType(m[1]);
    }

    const varNewRe = /\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*new\s+(Vector2Int|Vector2|Vector3|Queue|Stack|List|ArrayList|HashSet|MapNode|Monster|ControlData)\b/g;
    while ((m = varNewRe.exec(cleaned)) !== null) {
      map[m[1]] = toInstType(m[2]);
    }

    return map;
  }

  function extractLocalSymbols(code, cursorPos, extraContext) {
    const combined = extraContext ? (String(code || '') + '\n' + String(extraContext)) : String(code || '');
    const cleaned = stripNonCode(combined);
    const cleanedMain = stripNonCode(code);
    const activeTokenMatch = String(code || '').slice(0, cursorPos).match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    const activeToken = activeTokenMatch ? activeTokenMatch[1] : null;
    const activeStart = activeToken ? cursorPos - activeToken.length : -1;

    const counts = new Map();
    const isFnMap = new Map();
    const idRe = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
    let m;
    while ((m = idRe.exec(cleaned)) !== null) {
      const tok = m[1];
      if (tok.length < 2 || KEYWORD_SET.has(tok) || TYPE_SET.has(tok)) continue;
      // Ignore the single in-progress token directly at the cursor
      if (activeToken && tok === activeToken && m.index === activeStart && m.index < cleanedMain.length) {
        if (!counts.has(tok)) counts.set(tok, 0);
        continue;
      }
      counts.set(tok, (counts.get(tok) || 0) + 1);
      const afterSlice = cleaned.slice(m.index + tok.length, m.index + tok.length + 8);
      if (/^\s*\(/.test(afterSlice)) {
        // Distinguish declaration/call vs `if (` already excluded by KEYWORD_SET
        const beforeSlice = cleaned.slice(Math.max(0, m.index - 24), m.index);
        if (!/\.\s*$/.test(beforeSlice)) {
          isFnMap.set(tok, true);
        }
      }
    }

    const inferred = inferVarTypes(combined);
    const out = [];
    counts.forEach((cnt, name) => {
      if (cnt <= 0) return;
      const isFn = !!isFnMap.get(name);
      const tLabel = displayTypeLabel(inferred[name] || KNOWN_VAR_TYPES[name] || '');
      out.push({
        label: name,
        kind: isFn ? 'method' : 'var',
        insertText: isFn ? (name + '()') : name,
        cursorBack: isFn ? 1 : 0,
        detail: isFn ? `${name}(...)` : (tLabel || '局部变量 / 字段'),
        doc: isFn ? `当前代码中的方法 ${name}` : `本地标识符${tLabel ? ` (${tLabel})` : ''}`
      });
    });
    return out;
  }

  /* -------------------- Scoring & Highlight Indices -------------------- */
  function isBoundary(label, idx) {
    if (idx === 0) return true;
    const prev = label[idx - 1];
    const ch = label[idx];
    if (prev === '_') return true;
    if (/[a-z0-9]/.test(prev) && /[A-Z]/.test(ch)) return true;
    if (/[a-zA-Z]/.test(prev) && /[0-9]/.test(ch)) return true;
    return false;
  }

  function matchCamelOrSubseq(qLow, label, requireBoundaryOrConsec) {
    const lLow = label.toLowerCase();
    const indices = [];
    let li = 0;
    let boundaryHits = 0;
    let prevMatch = -2;
    for (let qi = 0; qi < qLow.length; qi++) {
      const qc = qLow[qi];
      let found = -1;
      for (let j = li; j < lLow.length; j++) {
        if (lLow[j] !== qc) continue;
        if (requireBoundaryOrConsec) {
          const ok = isBoundary(label, j) || j === prevMatch + 1;
          if (!ok) continue;
        }
        found = j;
        break;
      }
      // If greedy previous jump missed an upcoming boundary char, retry preferring boundaries
      if (found === -1) return null;
      if (isBoundary(label, found)) boundaryHits++;
      indices.push(found);
      prevMatch = found;
      li = found + 1;
    }
    return { indices, boundaryHits };
  }

  function scoreMatch(query, label) {
    const q = String(query || '');
    const lbl = String(label || '');
    if (!q) return { score: 10, indices: [] };
    if (q.length > lbl.length) return null;
    const qLow = q.toLowerCase();
    const lLow = lbl.toLowerCase();

    if (lLow.startsWith(qLow)) {
      const exactCase = lbl.startsWith(q) ? 15 : 0;
      const exactLen = lbl.length === q.length ? 10 : 0;
      const indices = [];
      for (let i = 0; i < q.length; i++) indices.push(i);
      return {
        score: 100 + exactCase + exactLen - (lbl.length - q.length) * 0.05,
        indices
      };
    }

    const camel = matchCamelOrSubseq(qLow, lbl, true);
    if (camel) {
      const span = camel.indices[camel.indices.length - 1] - camel.indices[0];
      return {
        score: 70 + camel.boundaryHits * 4 - span * 0.25 - lbl.length * 0.03,
        indices: camel.indices
      };
    }

    const sub = matchCamelOrSubseq(qLow, lbl, false);
    if (sub) {
      const span = sub.indices[sub.indices.length - 1] - sub.indices[0];
      return {
        score: 40 - Math.min(25, span * 0.4) - lbl.length * 0.03,
        indices: sub.indices
      };
    }

    return null;
  }

  /* -------------------- Receiver & Completion Resolution -------------------- */
  function resolveMemberChainType(parts, inferred) {
    if (!parts.length) return null;
    const head = parts[0];
    let curType = null;
    if (TYPE_MEMBERS[head]) {
      curType = head;
    } else if (inferred[head]) {
      curType = inferred[head];
    } else if (KNOWN_VAR_TYPES[head]) {
      curType = KNOWN_VAR_TYPES[head];
    }
    if (!curType) return null;

    for (let i = 1; i < parts.length; i++) {
      const seg = parts[i];
      const members = TYPE_MEMBERS[curType] || [];
      const found = members.find(m => m.label === seg && m.returnType);
      if (found && found.returnType) {
        curType = found.returnType;
      } else if (PROP_RETURN_TYPE[seg]) {
        curType = PROP_RETURN_TYPE[seg];
      } else {
        return null;
      }
    }
    return curType;
  }

  function getCompletions(code, cursorPos, opts) {
    const cfg = opts || {};
    const src = String(code || '');
    const pos = Math.max(0, Math.min(cursorPos ?? src.length, src.length));

    if (isInsideCommentOrString(src, pos)) {
      return { items: [], replaceStart: pos, replaceEnd: pos, prefix: '', isMember: false };
    }

    const before = src.slice(0, pos);
    const inferred = inferVarTypes(cfg.extraContext ? (src + '\n' + cfg.extraContext) : src);

    const memberMatch = before.match(/([A-Za-z_][A-Za-z0-9_]*(?:\s*\??\.\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*\??\.\s*([A-Za-z_][A-Za-z0-9_]*)?$/);
    if (memberMatch) {
      const chainRaw = memberMatch[1];
      const prefix = memberMatch[2] || '';
      const replaceStart = pos - prefix.length;
      const chainParts = chainRaw.split(/\s*\??\.\s*/).filter(Boolean);
      const targetType = resolveMemberChainType(chainParts, inferred);

      let pool = targetType && TYPE_MEMBERS[targetType] ? TYPE_MEMBERS[targetType] : null;
      if (!pool && (cfg.manual || prefix.length >= 1)) {
        pool = FALLBACK_INSTANCE_POOL;
      }
      if (!pool) {
        return { items: [], replaceStart, replaceEnd: pos, prefix, isMember: true };
      }

      const scored = [];
      for (let i = 0; i < pool.length; i++) {
        const entry = pool[i];
        const m = scoreMatch(prefix, entry.label);
        if (!m) continue;
        scored.push({
          ...entry,
          score: m.score + (entry.kind === 'prop' ? 2 : 0),
          indices: m.indices
        });
      }
      if (prefix) {
        scored.sort((a, b) => (b.score - a.score) || a.label.localeCompare(b.label));
      }
      return {
        items: scored.slice(0, prefix ? 14 : 40),
        replaceStart,
        replaceEnd: pos,
        prefix,
        isMember: true,
        receiverType: displayTypeLabel(targetType)
      };
    }

    const idMatch = before.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    if (!idMatch && !cfg.manual) {
      return { items: [], replaceStart: pos, replaceEnd: pos, prefix: '', isMember: false };
    }

    const prefix = idMatch ? idMatch[1] : '';
    const replaceStart = pos - prefix.length;

    const candidates = [];
    const seen = new Set();
    const pushUnique = (item, priorityBoost) => {
      const key = `${item.kind}:${item.label}`;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ item, priorityBoost });
    };

    const locals = extractLocalSymbols(src, pos, cfg.extraContext);
    for (let i = 0; i < locals.length; i++) {
      pushUnique(locals[i], 28);
    }
    for (let i = 0; i < MONO_MEMBERS.length; i++) {
      pushUnique(MONO_MEMBERS[i], 14);
    }
    for (let i = 0; i < TYPES.length; i++) {
      const t = TYPES[i];
      pushUnique({ label: t, kind: 'type', insertText: t, cursorBack: 0, detail: 'Unity / C# Type', doc: `类型 ${t}` }, 20);
    }
    if (!cfg.singleLine && (cfg.manual || prefix.length >= 2)) {
      for (let i = 0; i < SNIPPETS.length; i++) {
        pushUnique(SNIPPETS[i], 16);
      }
    }
    for (let i = 0; i < KEYWORDS.length; i++) {
      const k = KEYWORDS[i];
      pushUnique({ label: k, kind: 'kw', insertText: k, cursorBack: 0, detail: 'C# keyword', doc: `关键字 ${k}` }, 8);
    }

    const scored = [];
    for (let i = 0; i < candidates.length; i++) {
      const { item, priorityBoost } = candidates[i];
      const m = scoreMatch(prefix, item.label);
      if (!m) continue;
      scored.push({
        ...item,
        score: m.score + priorityBoost,
        indices: m.indices
      });
    }

    scored.sort((a, b) => (b.score - a.score) || a.label.localeCompare(b.label));
    return {
      items: scored.slice(0, 14),
      replaceStart,
      replaceEnd: pos,
      prefix,
      isMember: false
    };
  }

  /* -------------------- Pure Editing Transforms -------------------- */
  function getLineIndentAt(code, pos) {
    const lineStart = code.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
    const prefix = code.slice(lineStart, pos);
    const m = prefix.match(/^[ \t]*/);
    return m ? m[0] : '';
  }

  function applyCompletion(code, cursorPos, item, replaceStart) {
    const src = String(code || '');
    const end = Math.max(0, Math.min(cursorPos ?? src.length, src.length));
    const start = Math.max(0, Math.min(replaceStart ?? end, end));
    const before = src.slice(0, start);
    const after = src.slice(end);

    if (item.kind === 'snip') {
      const indent = getLineIndentAt(src, start);
      const indented = String(item.insertText || '').replace(/\n/g, '\n' + indent);
      const markerIdx = indented.indexOf('$0');
      const finalText = markerIdx >= 0
        ? indented.slice(0, markerIdx) + indented.slice(markerIdx + 2)
        : indented;
      const nextPos = start + (markerIdx >= 0 ? markerIdx : finalText.length);
      return { value: before + finalText + after, cursorPos: nextPos };
    }

    if (item.kind === 'method') {
      let ins = String(item.insertText || item.label);
      let back = Number(item.cursorBack || 0);
      if (ins.endsWith('()') && /^\s*\(/.test(after)) {
        ins = ins.slice(0, -2);
        back = 0;
      }
      const nextPos = start + ins.length - back;
      return { value: before + ins + after, cursorPos: nextPos };
    }

    const ins = String(item.insertText || item.label);
    return { value: before + ins + after, cursorPos: start + ins.length };
  }

  const PAIR_MAP = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };

  function applySelectionWrap(code, selStart, selEnd, openChar) {
    const closeChar = PAIR_MAP[openChar];
    if (!closeChar || selStart == null || selEnd == null || selStart >= selEnd) return null;
    const src = String(code || '');
    return {
      value: src.slice(0, selStart) + openChar + src.slice(selStart, selEnd) + closeChar + src.slice(selEnd),
      selStart: selStart + 1,
      selEnd: selEnd + 1
    };
  }

  function applySmartEnter(code, selStart, selEnd) {
    const src = String(code || '');
    const s = Math.max(0, Math.min(selStart ?? src.length, src.length));
    const e = Math.max(s, Math.min(selEnd ?? s, src.length));
    const lineStart = src.lastIndexOf('\n', Math.max(0, s - 1)) + 1;
    const linePrefix = src.slice(lineStart, s);
    const indentMatch = linePrefix.match(/^[ \t]*/);
    const indent = indentMatch ? indentMatch[0] : '';
    const before = src.slice(0, s);
    const after = src.slice(e);
    const openBraceBefore = /\{\s*$/.test(linePrefix);
    const closeBraceAfter = /^[ \t]*\}/.test(after);

    if (openBraceBefore && closeBraceAfter) {
      const afterTrimmed = after.replace(/^[ \t]+/, '');
      const ins = `\n${indent}    \n${indent}`;
      return {
        value: before + ins + afterTrimmed,
        cursorPos: s + 1 + indent.length + 4
      };
    }

    if (openBraceBefore) {
      const ins = `\n${indent}    `;
      return {
        value: before + ins + after,
        cursorPos: s + ins.length
      };
    }

    const ins = `\n${indent}`;
    return {
      value: before + ins + after,
      cursorPos: s + ins.length
    };
  }

  function applyTabIndent(code, selStart, selEnd, isShift) {
    const src = String(code || '');
    const s = Math.max(0, Math.min(selStart ?? 0, src.length));
    const e = Math.max(s, Math.min(selEnd ?? s, src.length));

    if (s === e && !isShift) {
      return {
        value: src.slice(0, s) + '    ' + src.slice(e),
        selStart: s + 4,
        selEnd: s + 4
      };
    }

    const blockStart = src.lastIndexOf('\n', Math.max(0, s - 1)) + 1;
    let effectiveEnd = e;
    if (effectiveEnd > s && src[effectiveEnd - 1] === '\n') {
      effectiveEnd -= 1;
    }
    const nextNl = src.indexOf('\n', effectiveEnd);
    const blockEnd = nextNl === -1 ? src.length : nextNl;
    const block = src.slice(blockStart, blockEnd);
    const lines = block.split('\n');

    let firstDelta = 0;
    let totalDelta = 0;
    const updatedLines = lines.map((ln, idx) => {
      if (!isShift) {
        if (idx === 0) firstDelta = 4;
        totalDelta += 4;
        return '    ' + ln;
      }
      const m = ln.match(/^(?: {1,4}|\t)/);
      const removed = m ? m[0].length : 0;
      if (idx === 0) firstDelta = -removed;
      totalDelta -= removed;
      return ln.slice(removed);
    });

    const newValue = src.slice(0, blockStart) + updatedLines.join('\n') + src.slice(blockEnd);
    if (s === e) {
      const nextPos = Math.max(blockStart, s + firstDelta);
      return { value: newValue, selStart: nextPos, selEnd: nextPos };
    }
    const nextStart = Math.max(blockStart, s + firstDelta);
    const nextEnd = Math.max(nextStart, e + totalDelta);
    return { value: newValue, selStart: nextStart, selEnd: nextEnd };
  }

  /* -------------------- Singleton DOM Popup & Caret Mirror -------------------- */
  let popupEl = null;
  let mirrorEl = null;
  let activeCtx = null;
  let currentItems = [];
  let currentReplaceStart = 0;
  let selectedIdx = 0;
  let blurTimer = null;
  let interactingPopup = false;

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightLabelHTML(label, indices) {
    if (!indices || !indices.length) return escHtml(label);
    const idxSet = new Set(indices);
    let out = '';
    for (let i = 0; i < label.length; i++) {
      const ch = escHtml(label[i]);
      out += idxSet.has(i) ? `<span class="ide-ac-hl">${ch}</span>` : ch;
    }
    return out;
  }

  function ensurePopup() {
    if (typeof document === 'undefined') return null;
    if (popupEl) return popupEl;

    popupEl = document.createElement('div');
    popupEl.className = 'ide-ac-popup';
    popupEl.setAttribute('role', 'listbox');
    popupEl.setAttribute('aria-label', '代码补全候选');
    popupEl.hidden = true;
    document.body.appendChild(popupEl);

    popupEl.addEventListener('pointerdown', e => {
      interactingPopup = true;
      if (e.pointerType === 'mouse') e.preventDefault();
    });
    popupEl.addEventListener('mousedown', e => {
      interactingPopup = true;
      e.preventDefault();
    });
    popupEl.addEventListener('click', e => {
      const row = e.target.closest('.ide-ac-item');
      interactingPopup = false;
      if (!row || !activeCtx) return;
      const idx = Number(row.dataset.acIdx);
      if (Number.isInteger(idx)) acceptAt(idx);
    });

    mirrorEl = document.createElement('div');
    mirrorEl.setAttribute('aria-hidden', 'true');
    mirrorEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden;pointer-events:none;overflow:hidden;';
    document.body.appendChild(mirrorEl);
    return popupEl;
  }

  function measureCaretRect(ta, charOffset) {
    ensurePopup();
    const cs = global.getComputedStyle(ta);
    const isInput = ta.tagName === 'INPUT';
    const props = [
      'boxSizing', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
      'letterSpacing', 'textTransform', 'wordSpacing', 'tabSize',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'
    ];
    for (let i = 0; i < props.length; i++) {
      const k = props[i];
      mirrorEl.style[k] = cs[k];
    }
    mirrorEl.style.lineHeight = cs.lineHeight === 'normal'
      ? (Math.round(parseFloat(cs.fontSize || '13') * 1.4) + 'px')
      : cs.lineHeight;
    mirrorEl.style.whiteSpace = isInput ? 'pre' : (cs.whiteSpace || 'pre');
    mirrorEl.style.wordBreak = cs.wordBreak || 'normal';
    mirrorEl.style.overflowWrap = cs.overflowWrap || 'normal';
    mirrorEl.style.width = isInput ? 'auto' : cs.width;

    const textBefore = ta.value.slice(0, charOffset);
    mirrorEl.textContent = textBefore;
    const marker = document.createElement('span');
    marker.textContent = ta.value.slice(charOffset, charOffset + 1) || '.';
    mirrorEl.appendChild(marker);

    const taRect = ta.getBoundingClientRect();
    const spanLeft = marker.offsetLeft - ta.scrollLeft;
    const spanTop = isInput ? 0 : (marker.offsetTop - ta.scrollTop);
    const lineH = parseFloat(mirrorEl.style.lineHeight) || marker.offsetHeight || 20;

    return {
      left: taRect.left + spanLeft,
      top: isInput ? taRect.top : (taRect.top + spanTop),
      bottom: isInput ? taRect.bottom : (taRect.top + spanTop + lineH),
      lineH,
      taRect
    };
  }

  function positionPopup(ctx, replaceStart) {
    if (!popupEl) return;
    const m = measureCaretRect(ctx.ta, replaceStart);
    const taR = m.taRect;
    if (taR.width === 0 || taR.height === 0) {
      closePopup();
      return;
    }

    popupEl.hidden = false;
    popupEl.style.visibility = 'hidden';
    popupEl.style.left = '0px';
    popupEl.style.top = '0px';

    const popupW = popupEl.offsetWidth || 260;
    const popupH = popupEl.offsetHeight || 180;
    const vv = global.visualViewport || null;
    const vpLeft = vv ? vv.offsetLeft : 0;
    const vpTop = vv ? vv.offsetTop : 0;
    const vpW = vv ? vv.width : global.innerWidth;
    const vpH = vv ? vv.height : global.innerHeight;

    let left = m.left;
    if (left + popupW > vpLeft + vpW - 8) {
      left = vpLeft + vpW - popupW - 8;
    }
    if (left < vpLeft + 8) {
      left = vpLeft + 8;
    }

    let top = m.bottom + 4;
    if (top + popupH > vpTop + vpH - 8) {
      const aboveTop = m.top - popupH - 4;
      if (aboveTop >= vpTop + 8) {
        top = aboveTop;
      } else {
        top = Math.max(vpTop + 8, vpTop + vpH - popupH - 8);
      }
    }

    popupEl.style.left = `${Math.round(left)}px`;
    popupEl.style.top = `${Math.round(top)}px`;
    popupEl.style.visibility = 'visible';
  }

  function renderPopup(ctx) {
    const pop = ensurePopup();
    if (!pop || !currentItems.length) {
      closePopup();
      return;
    }

    const active = currentItems[selectedIdx] || currentItems[0];
    const rowsHtml = currentItems.map((it, idx) => {
      const badge = KIND_BADGE[it.kind] || 'V';
      const activeCls = idx === selectedIdx ? ' active' : '';
      return `
        <div class="ide-ac-item${activeCls}" role="option" aria-selected="${idx === selectedIdx}" data-ac-idx="${idx}">
          <span class="ide-ac-kind kind-${it.kind}">${badge}</span>
          <span class="ide-ac-label">${highlightLabelHTML(it.label, it.indices)}</span>
          <span class="ide-ac-detail">${escHtml(it.detail || '')}</span>
        </div>`;
    }).join('');

    const footKeys = ctx.opts && ctx.opts.isMobile ? '点按选择补全' : 'Tab / Enter 补全 · Esc 关闭';
    pop.innerHTML = `
      <div class="ide-ac-list">${rowsHtml}</div>
      <div class="ide-ac-foot">
        <span class="ide-ac-doc">${escHtml(active.doc || active.detail || '')}</span>
        <span class="ide-ac-keys">${footKeys}</span>
      </div>`;

    positionPopup(ctx, currentReplaceStart);

    const activeRow = pop.querySelector('.ide-ac-item.active');
    if (activeRow && typeof activeRow.scrollIntoView === 'function') {
      activeRow.scrollIntoView({ block: 'nearest' });
    }
  }

  function updateActiveRow(delta) {
    if (!popupEl || !currentItems.length || !activeCtx) return;
    const len = currentItems.length;
    selectedIdx = ((selectedIdx + delta) % len + len) % len;
    const rows = popupEl.querySelectorAll('.ide-ac-item');
    rows.forEach((r, i) => {
      const isAct = i === selectedIdx;
      r.classList.toggle('active', isAct);
      r.setAttribute('aria-selected', String(isAct));
    });
    const active = currentItems[selectedIdx];
    const docEl = popupEl.querySelector('.ide-ac-doc');
    if (docEl && active) docEl.textContent = active.doc || active.detail || '';
    const activeRow = rows[selectedIdx];
    if (activeRow && typeof activeRow.scrollIntoView === 'function') {
      activeRow.scrollIntoView({ block: 'nearest' });
    }
  }

  function closePopup() {
    activeCtx = null;
    currentItems = [];
    selectedIdx = 0;
    if (popupEl) {
      popupEl.hidden = true;
      popupEl.innerHTML = '';
    }
  }

  function refresh(ctx, manual) {
    const ta = ctx.ta;
    if (!ta || ta.disabled || ta.readOnly || ctx.isComposing) {
      closePopup();
      return;
    }
    if (ta.selectionStart !== ta.selectionEnd) {
      closePopup();
      return;
    }
    const cursorPos = ta.selectionStart ?? ta.value.length;
    const res = getCompletions(ta.value, cursorPos, {
      manual: !!manual,
      singleLine: !!(ctx.opts && ctx.opts.singleLine),
      extraContext: (ta._acExtraContext || (ctx.opts && ctx.opts.extraContext) || '')
    });
    if (!res.items.length) {
      closePopup();
      return;
    }
    activeCtx = ctx;
    currentItems = res.items;
    currentReplaceStart = res.replaceStart;
    selectedIdx = 0;
    renderPopup(ctx);
  }

  function acceptAt(idx) {
    if (!activeCtx || !currentItems[idx]) return;
    const ctx = activeCtx;
    const ta = ctx.ta;
    const item = currentItems[idx];
    if (ta.disabled || ta.readOnly) {
      closePopup();
      return;
    }
    const cursorPos = ta.selectionStart ?? ta.value.length;
    const applied = applyCompletion(ta.value, cursorPos, item, currentReplaceStart);
    ta.value = applied.value;
    ta.focus();
    ta.setSelectionRange(applied.cursorPos, applied.cursorPos);
    closePopup();
    if (typeof ctx.syncFn === 'function') ctx.syncFn();
  }

  function attach(hostEl, ta, syncFn, opts) {
    if (!ta || ta.dataset.acBound) return;
    ta.dataset.acBound = '1';
    ensurePopup();

    const cfg = opts || {};
    const ctx = {
      hostEl: hostEl || ta,
      ta,
      syncFn,
      opts: cfg,
      isComposing: false
    };

    ta.addEventListener('compositionstart', () => {
      ctx.isComposing = true;
      if (activeCtx === ctx) closePopup();
    });
    ta.addEventListener('compositionend', () => {
      ctx.isComposing = false;
      refresh(ctx, false);
    });

    ta.addEventListener('input', () => {
      if (ctx.isComposing || ta.disabled || ta.readOnly) return;
      refresh(ctx, false);
    });

    ta.addEventListener('keydown', e => {
      if (ctx.isComposing || ta.disabled || ta.readOnly) return;

      const isManualTrigger = (e.code === 'Space' && e.ctrlKey && !e.altKey && !e.metaKey)
        || (e.key === '/' && e.altKey && !e.ctrlKey && !e.metaKey);
      if (isManualTrigger) {
        e.preventDefault();
        refresh(ctx, true);
        return;
      }

      const isPopupOpen = activeCtx === ctx && popupEl && !popupEl.hidden && currentItems.length > 0;
      if (isPopupOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          updateActiveRow(1);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          updateActiveRow(-1);
          return;
        }
        if ((e.key === 'Tab' && !e.shiftKey) || (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey)) {
          e.preventDefault();
          acceptAt(selectedIdx);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          closePopup();
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
          closePopup();
        }
      }

      const hasMod = e.ctrlKey || e.metaKey || e.altKey;
      const selStart = ta.selectionStart ?? 0;
      const selEnd = ta.selectionEnd ?? 0;

      // Selection wrap: pressing (, [, {, ", ' with active selection wraps selected text
      if (!hasMod && selStart < selEnd && PAIR_MAP[e.key]) {
        const wrapped = applySelectionWrap(ta.value, selStart, selEnd, e.key);
        if (wrapped) {
          e.preventDefault();
          ta.value = wrapped.value;
          ta.setSelectionRange(wrapped.selStart, wrapped.selEnd);
          closePopup();
          if (typeof syncFn === 'function') syncFn();
          return;
        }
      }

      // Skip-over existing closing delimiter when caret sits directly before it
      if (!hasMod && selStart === selEnd && (e.key === ')' || e.key === ']' || e.key === '}' || e.key === '"')) {
        if (ta.value[selStart] === e.key) {
          e.preventDefault();
          ta.setSelectionRange(selStart + 1, selStart + 1);
          if (typeof syncFn === 'function') syncFn();
          return;
        }
      }

      // Auto-close pair (, [, {, "
      if (!hasMod && selStart === selEnd && (e.key === '(' || e.key === '[' || e.key === '{' || e.key === '"')) {
        const nextCh = ta.value[selStart] || '';
        const nextAllowed = nextCh === '' || /[\s)\]},;.:]/.test(nextCh);
        const canPair = e.key !== '"' || !isInsideCommentOrString(ta.value, selStart);
        if (nextAllowed && canPair) {
          e.preventDefault();
          const closeCh = PAIR_MAP[e.key];
          ta.value = ta.value.slice(0, selStart) + e.key + closeCh + ta.value.slice(selEnd);
          ta.setSelectionRange(selStart + 1, selStart + 1);
          if (typeof syncFn === 'function') syncFn();
          return;
        }
      }

      // Backspace removes matching empty pair: (), [], {}, "", ''
      if (!hasMod && e.key === 'Backspace' && selStart === selEnd && selStart > 0) {
        const prevCh = ta.value[selStart - 1];
        const nextCh = ta.value[selStart];
        if (PAIR_MAP[prevCh] && PAIR_MAP[prevCh] === nextCh) {
          e.preventDefault();
          ta.value = ta.value.slice(0, selStart - 1) + ta.value.slice(selStart + 1);
          ta.setSelectionRange(selStart - 1, selStart - 1);
          closePopup();
          if (typeof syncFn === 'function') syncFn();
          return;
        }
      }

      // Multi-line or single-line Tab / Shift+Tab indent & outdent
      if (!cfg.singleLine && e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const res = applyTabIndent(ta.value, selStart, selEnd, e.shiftKey);
        ta.value = res.value;
        ta.setSelectionRange(res.selStart, res.selEnd);
        closePopup();
        if (typeof syncFn === 'function') syncFn();
        return;
      }

      // Smart Enter auto-indent when popup is closed
      if (!cfg.singleLine && e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        const res = applySmartEnter(ta.value, selStart, selEnd);
        ta.value = res.value;
        ta.setSelectionRange(res.cursorPos, res.cursorPos);
        closePopup();
        if (typeof syncFn === 'function') syncFn();
      }
    });

    ta.addEventListener('blur', () => {
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!interactingPopup && activeCtx === ctx) {
          closePopup();
        }
        interactingPopup = false;
      }, 140);
    });

    ta.addEventListener('scroll', () => {
      if (activeCtx === ctx) closePopup();
    });

    ta.addEventListener('click', () => {
      if (activeCtx === ctx) closePopup();
    });

    if (hostEl && hostEl !== ta) {
      hostEl._triggerIntelliSense = () => {
        if (ta.disabled || ta.readOnly) return;
        ta.focus();
        refresh(ctx, true);
      };
      hostEl._refreshIntelliSense = () => {
        if (ta.disabled || ta.readOnly) return;
        refresh(ctx, false);
      };
      hostEl._closeIntelliSense = () => {
        if (activeCtx === ctx) closePopup();
      };
    }
  }

  global.CodeIntelliSense = {
    VERSION: '1.0.0',
    attach,
    closePopup,
    getCompletions,
    applyCompletion,
    applySelectionWrap,
    applySmartEnter,
    applyTabIndent,
    inferVarTypes,
    extractLocalSymbols,
    isInsideCommentOrString,
    scoreMatch
  };
})(typeof window !== 'undefined' ? window : globalThis);
