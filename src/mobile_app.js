/* ==========================================================================
   Realtime AI Mobile-First Edition Controller
   Shared Store (realtime_ai_exam_prep_v4), Drawers, Bottom Sheets, Fullscreen Studio
   Zero-Emoji Edition · Unified Font Stack · Touch Optimized
   ========================================================================== */
(function () {
  'use strict';

  const MASCOTS = window.MASCOT_SPRITES || {};
  const MODULES = window.KNOWLEDGE_MODULES || [];
  const SECTIONS = window.KNOWLEDGE_SECTIONS || [];
  const TOPICS = window.MASTERY_TOPICS || [];
  const BANK = window.QUESTION_BANK || [];
  const DEMOS = window.CSHARP_DEMOS || {};
  const DRILLS = window.CODE_DRILLS || [];
  const GRADER = window.SmartGrader || null;
  const BOARD = window.DiagramBoard || null;
  const hlCS = window.highlightCSharp || (s => s);

  const STORE_KEY = 'realtime_ai_exam_prep_v4';
  const MOD_SHORT = Object.fromEntries(MODULES.map(m => [m.id, m.short]));
  const TOPIC_NAME = Object.fromEntries(TOPICS.map(t => [t.id, t.name]));
  const TYPE_LABELS = { single: '单选题', tf: '判断题', fill: '填空题', essay: '按要求作答', code: '编程题' };

  function loadState() {
    const firstSec = SECTIONS[0]?.id || 't_unity';
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return {
        answers: raw.answers || {},
        favorites: raw.favorites || {},
        studiedMods: raw.studiedMods || {},
        studiedSections: raw.studiedSections || {},
        ranDemos: raw.ranDemos || {},
        passedDrills: raw.passedDrills || {},
        drillDrafts: raw.drillDrafts || {},
        theme: raw.theme || 'light',
        activeView: 'knowledge',
        activeSection: firstSec,
        kSubTab: 'notes',         // 'notes' | 'code' | 'anim'
        practiceSub: 'bank',      // 'bank' | 'mock'
        focusScope: null,
        practiceHistory: [],
        practiceIdx: 0,
        practiceSeq: 0,
        curveLevel: 1.4,
        cardFlipped: false,
        streak: 0,
        mockPageIdx: 0,
        mockExam: null,
        nbFilter: 'wrong',
        nbSearch: ''
      };
    } catch {
      return {
        answers: {}, favorites: {}, studiedMods: {}, studiedSections: {}, ranDemos: {},
        passedDrills: {}, drillDrafts: {}, theme: 'light', activeView: 'knowledge',
        activeSection: firstSec, kSubTab: 'notes', practiceSub: 'bank', focusScope: null,
        practiceHistory: [], practiceIdx: 0, practiceSeq: 0, curveLevel: 1.4,
        cardFlipped: false, streak: 0, mockPageIdx: 0, mockExam: null,
        nbFilter: 'wrong', nbSearch: ''
      };
    }
  }

  const state = loadState();
  let mockTimerId = null;

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        answers: state.answers,
        favorites: state.favorites,
        studiedMods: state.studiedMods,
        studiedSections: state.studiedSections,
        ranDemos: state.ranDemos,
        passedDrills: state.passedDrills,
        drillDrafts: state.drillDrafts,
        theme: state.theme
      }));
    } catch {}
  }

  function escapeHTML(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function normalizeAns(s) {
    return String(s || '').trim().replace(/\s+/g, '').replace(/；/g, ';').replace(/，/g, ',').replace(/（/g, '(').replace(/）/g, ')').toLowerCase();
  }

  const MANTRAS = [
    { mood: 'teach', text: '必背口诀：FSM 四要素严格按序 → 状态、初始状态、输入、转换。' },
    { mood: 'search', text: 'A* 格内记法：左上 f(总)、左下 g(实际)、右下 h(预估)；直走 10 斜走 14。' },
    { mood: 'cheer', text: '碰撞反射口诀：撞水平改 y，撞竖直墙改 x，斜面用 vi + 2(-vi·N)N。' },
    { mood: 'code', text: 'DoPattern 7 空：%360、+=360、(Cos,Sin)、pos+disp、%=Count、0、=pos。' },
    { mood: 'search', text: '八方向沿墙走：左手 (dir-2+8)%8 顺时针，右手 (dir+2)%8 逆时针。' },
    { mood: 'exam', text: '可采纳性 h(n) <= h*(n) 保证找到最优解；最小堆让 Open 表降为 O(log N)。' },
    { mood: 'happy', text: 'Boids 三规则：分离防碰撞、对齐同航向、聚集向质心。' }
  ];
  let mantraIdx = 0;

  const TOPIC_SUMMARIES = {
    t_unity: { formula: 'Transform -> pos/rot/scale | Input.mousePosition -> 屏幕像素', points: ['Unity 只有 Vector2 / Vector3，无泛称 Vector', '智能体闭环：感知 -> 行为选择 -> 操控 -> 移动'], trap: 'Update 按渲染帧执行受帧率影响，FixedUpdate 才用于固定步长物理。' },
    t_kinematics: { formula: 's = v0*t + 0.5*a*t^2 | Dot = a·b', points: ['a·b > 0 前方锐角，= 0 垂直，< 0 后方钝角', '抛物运动水平匀速、竖直匀加速相互独立'], trap: '竖直向上为正时重力加速度 g 取负值。' },
    t_mechanics: { formula: 'v_f = v_i + 2 * (-v_i · N) * N', points: ['做功 W = F * s * cos(theta)，垂直分力不做功', '斜面对称先归一化 N，再算点积反射'], trap: '先分清撞水平栏改 vy 还是撞竖直墙改 vx。' },
    t_steering: { formula: 'steering = desiredVel - curVel', points: ['Seek 满速靠近，Flee 反向远离', 'Arrive 在减速半径内按 (dist / R) 线性降速'], trap: 'Arrive 是连续减速不是瞬间刹停。' },
    t_intercept: { formula: 'Vr = Vt - Vp; tc = |Sr| / |Vr|; St = Pt + Vt * tc', points: ['预判拦截直奔预测点 St 而非当前点 Pt', 'Vr 极小时加下限防除零'], trap: '相对距离与相对速度别把被减数写反。' },
    t_pattern: { formula: 'angle %= 360; if (angle < 0) angle += 360;', points: ['控制指令法存距离+角度，模式指令法存偏移', '三角函数前角度必须乘 Mathf.Deg2Rad'], trap: 'DoPattern 循环队列索引要用 curIndex = (curIndex + 1) % array.Length。' },
    t_tilemap: { formula: 'pixelX = col * 64 + 32; pixelY = row * 64 + 32;', points: ['TileMap 行 row 对应 y，列 col 对应 x', '格子中心坐标务必加半格偏移'], trap: '八方向按顺时针 0=右 .. 7=右上统一编号。' },
    t_avoid: { formula: 'next = (dir + n) % 8; 记已访问防死循环', points: ['随机移动遇障随机转角走固定步长', '绕行障碍物需记录已访格子防 U 型震荡'], trap: '纯随机避障在复杂迷宫易死锁。' },
    t_follow_wall: { formula: '左手 (dir - 2 + 8) % 8 | 右手 (dir + 2) % 8', points: ['四方向左手定则：左 -> 前 -> 右 -> 后', '沿路径走两种赋权：先地形或先夹角'], trap: 'C# 负数取模为负，左手减 2 前务必 +8。' },
    t_dfs_bfs: { formula: 'DFS -> Stack(FILO) | BFS -> Queue(FIFO)', points: ['DFS 省内存但不保最短路', 'BFS 保无权图最少边，Dijkstra 保非负带权最短路'], trap: 'BFS 仅边权相等时保证最短路。' },
    t_astar_core: { formula: 'f(n) = g(n) + h(n) | h = 10*(|dx|+|dy|)', points: ['直走 +10，斜走 +14；不可斜穿障碍角点按题意判别', '邻格在 Open 表且新 g 更小时更新父与 g/f'], trap: '最终需从终点沿 parent 倒推反转生成路径。' },
    t_astar_opt: { formula: 'OpenList 查最小 f：数组 O(N) -> 最小堆 O(log N)', points: ['核心优化：最小堆、f同选h小、双向A*、路径平滑、影响力映射'], trap: '问如何加速 Open 取最小 f 必答「优先队列/最小堆」。' },
    t_fsm_std: { formula: '四要素(严格按序)：状态、初始状态、输入、转换', points: ['圆圈表状态，实心黑点箭头 ●→ 标初始态', '有向边标清触发事件，防漏边'], trap: '考题问四要素务必按标准顺序作答。' },
    t_fsm_pattern: { formula: 'ChangeState: current?.Exit(); current=next; current.Enter();', points: ['switch-case 状态多时成面条代码违背开闭原则', '状态模式用 IState 多态解耦各状态'], trap: '切换三步顺序必须是 Exit -> 换引用 -> Enter。' },
    t_bt: { formula: 'Selector(?): 遇Success停 | Sequence(→): 遇Failure停', points: ['叶节点只有条件与行为两类', 'Running 中断需求用 Parallel + Until Failure 持续检测'], trap: '同级子节点严格按从左到右优先级依次 Tick。' },
    t_boids: { formula: 'F_total = w1*F_sep + w2*F_ali + w3*F_coh', points: ['分离排斥防撞、对齐同速、聚集靠向质心', '局部简单规则即可涌现群体智能'], trap: 'Boids 无需全局中心指挥官。' }
  };

  /* -------------------- Fireworks Engine -------------------- */
  const FireworksFX = (() => {
    let cvs = null, ctx = null, rafId = null;
    let particles = [], rings = [];
    const PALETTE = ['#ff2d55', '#ff9500', '#facc15', '#10b981', '#0ea5e9', '#6366f1', '#d946ef'];

    function ensureCanvas() {
      if (!cvs) {
        cvs = document.getElementById('fx-fireworks-canvas');
        if (!cvs) return null;
        ctx = cvs.getContext('2d');
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      if (cvs.width !== Math.round(w * dpr) || cvs.height !== Math.round(h * dpr)) {
        cvs.width = Math.round(w * dpr);
        cvs.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return { w, h };
    }

    function launch(mult = 1, origin = null) {
      const sz = ensureCanvas();
      if (!sz || !ctx) return;
      const ox = origin?.x || sz.w * 0.5;
      const oy = origin?.y || sz.h * 0.45;
      const count = Math.round(40 * mult);
      const baseColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      rings.push({ x: ox, y: oy, r: 8, maxR: 74 * mult, life: 1, color: baseColor });
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2;
        const spd = (2.2 + Math.random() * 5.2) * mult;
        particles.push({
          x: ox, y: oy, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
          life: 1, decay: 0.018 + Math.random() * 0.014,
          size: 3 + Math.random() * 3, color: PALETTE[Math.floor(Math.random() * PALETTE.length)]
        });
      }
      if (!rafId) rafId = requestAnimationFrame(step);
    }

    function step() {
      const sz = ensureCanvas();
      if (!sz || !ctx) { rafId = null; return; }
      ctx.clearRect(0, 0, sz.w, sz.h);
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i];
        rg.life -= 0.04;
        if (rg.life <= 0) { rings.splice(i, 1); continue; }
        ctx.save();
        ctx.beginPath();
        ctx.arc(rg.x, rg.y, rg.r + (rg.maxR - rg.r) * (1 - rg.life), 0, Math.PI * 2);
        ctx.strokeStyle = rg.color;
        ctx.globalAlpha = rg.life;
        ctx.lineWidth = 3 * rg.life;
        ctx.stroke();
        ctx.restore();
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.vx *= 0.96; p.vy *= 0.96; p.vy += 0.14;
        p.x += p.vx; p.y += p.vy;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (particles.length || rings.length) rafId = requestAnimationFrame(step);
      else rafId = null;
    }

    return { launch };
  })();

  /* -------------------- Mastery Metrics -------------------- */
  function computeTopicMastery(topicId) {
    const tp = TOPICS.find(t => t.id === topicId);
    const sec = SECTIONS.find(s => s.id === topicId);
    const qs = BANK.filter(q => q.topic === topicId);
    const done = qs.filter(q => state.answers[q.id]?.checked);
    const right = done.filter(q => state.answers[q.id]?.correct);
    const secStudied = (state.studiedSections[topicId] || (tp && state.studiedMods[tp.mod])) ? 15 : 0;
    const demoBonus = ((sec?.demos || []).some(id => state.ranDemos[id]) || qs.some(q => state.ranDemos[q.demo])) ? 10 : 0;
    const drillBonus = DRILLS.some(d => d.topic === topicId && state.passedDrills[d.id]) ? 12 : 0;
    const pracScore = qs.length ? Math.round((right.length / qs.length) * 75) : 0;
    return {
      pct: Math.min(100, secStudied + demoBonus + drillBonus + pracScore),
      total: qs.length, done: done.length, right: right.length, wrong: done.length - right.length
    };
  }

  function computeModuleMastery(modId) {
    const qs = BANK.filter(q => q.module === modId);
    const done = qs.filter(q => state.answers[q.id]?.checked);
    const right = done.filter(q => state.answers[q.id]?.correct);
    const subSecs = SECTIONS.filter(s => s.mod === modId);
    const studiedSubCnt = subSecs.filter(s => state.studiedSections[s.id] || state.studiedMods[modId]).length;
    const studyPts = subSecs.length ? Math.round((studiedSubCnt / subSecs.length) * 15) : (state.studiedMods[modId] ? 15 : 0);
    const mod = MODULES.find(m => m.id === modId);
    const demoBonus = (mod?.demos || []).some(id => state.ranDemos[id]) ? 8 : 0;
    const drillBonus = DRILLS.some(d => d.module === modId && state.passedDrills[d.id]) ? 10 : 0;
    const pracPts = qs.length ? Math.round((right.length / qs.length) * 75) : 0;
    return {
      pct: Math.min(100, studyPts + demoBonus + drillBonus + pracPts),
      right: right.length, total: qs.length, wrong: done.length - right.length
    };
  }

  function computeOverallMastery() {
    const pcs = MODULES.map(m => computeModuleMastery(m.id).pct);
    const avg = Math.round(pcs.reduce((a, b) => a + b, 0) / Math.max(1, pcs.length));
    let rank = '新兵学徒';
    if (avg >= 85) rank = '满血战神 · 考场稳过';
    else if (avg >= 65) rank = '算法高手 · 稳拿高分';
    else if (avg >= 40) rank = '进阶能手 · 稳步提分';
    else if (avg >= 18) rank = '觉醒新锐 · 继续刷题';
    return { avg, rank };
  }

  function updateGlobalStats() {
    const doneIds = Object.keys(state.answers).filter(id => state.answers[id]?.checked);
    const wrongIds = doneIds.filter(id => !state.answers[id]?.correct);
    const ov = computeOverallMastery();
    const elPct = document.getElementById('m-tab-pct');
    const elWrong = document.getElementById('m-tab-wrong');
    if (elPct) elPct.textContent = `${ov.avg}%`;
    if (elWrong) elWrong.textContent = String(wrongIds.length);
  }

  function applyTheme(t) {
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('m-theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? '浅色' : '护眼';
    saveState();
  }

  /* -------------------- Lightbox Modal (Fullscreen Anim & Diagram Board) -------------------- */
  function openAnimLightbox({ engine, mode, params = {}, title = '交互动画全屏放大', modes = null }) {
    const overlay = document.getElementById('anim-lightbox');
    const body = document.getElementById('lightbox-body');
    const titleEl = document.getElementById('lightbox-title');
    if (!overlay || !body) return;
    if (titleEl) titleEl.textContent = title;
    const modePillsHTML = modes && modes.length
      ? `<div class="anim-mode-pills">${modes.map(m => `<button type="button" class="anim-pill ${m.key === mode ? 'active' : ''}" data-mode="${m.key}">${m.label}</button>`).join('')}</div>`
      : '';
    body.innerHTML = `
      <div class="lightbox-anim-host">
        ${modePillsHTML ? `<div style="padding:8px 12px;background:#13223f;border-bottom:1px solid rgba(148,163,184,0.2)">${modePillsHTML}</div>` : ''}
        <div class="anim-stage-wrap">
          <div class="anim-canvas-box"><canvas></canvas></div>
          <div class="anim-side-panel"></div>
        </div>
        <div class="anim-controls-bar">
          <div class="ctrl-group">
            <button type="button" class="ctrl-btn primary" data-act="play">暂停</button>
            <button type="button" class="ctrl-btn" data-act="step">单步</button>
            <button type="button" class="ctrl-btn" data-act="reset">重播</button>
            <label class="ctrl-slider">倍速 <input type="range" min="0.4" max="2.5" step="0.1" value="1" data-act="speed"></label>
          </div>
          <div class="anim-narrator">点击右上角 × 退出全屏视图</div>
        </div>
      </div>`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      const host = body.querySelector('.lightbox-anim-host');
      if (host) window.AnimEngine.mount(host, engine, { mode, params });
    });
  }

  function closeAnimLightbox() {
    const overlay = document.getElementById('anim-lightbox');
    const body = document.getElementById('lightbox-body');
    const dlg = overlay?.querySelector('.lightbox-dialog');
    if (!overlay) return;
    overlay.classList.remove('open');
    if (dlg) dlg.classList.remove('is-board-zoom');
    document.body.style.overflow = '';
    if (body) body.innerHTML = '';
  }

  function attachCanvasZoomBehavior(container, meta) {
    const box = container.querySelector('.anim-canvas-box') || container.querySelector('.cs-preview-wrap');
    const canvas = container.querySelector('canvas');
    if (!box || !canvas || box.dataset.zoomWired) return;
    box.dataset.zoomWired = '1';
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'canvas-zoom-hint';
    hint.textContent = '全屏查看';
    box.appendChild(hint);
    hint.onclick = (e) => {
      e.stopPropagation();
      const activeModeBtn = container.querySelector('.anim-pill.active');
      const curMode = activeModeBtn ? activeModeBtn.dataset.mode : meta.mode;
      openAnimLightbox({ engine: meta.engine, mode: curMode, params: meta.params || {}, title: meta.title || '动画全屏视图', modes: meta.modes || null });
    };
  }

  /* -------------------- Mobile IDE Editor + C# Symbol Helper Strip -------------------- */
  const CS_SYMS = [
    { lbl: ';', ins: ';' },
    { lbl: '{ }', ins: '{\n    \n}', back: 2 },
    { lbl: '( )', ins: '()', back: 1 },
    { lbl: 'Vector2', ins: 'Vector2 ' },
    { lbl: 'Mathf.', ins: 'Mathf.' },
    { lbl: 'Time.deltaTime', ins: 'Time.deltaTime' },
    { lbl: '+=', ins: ' += ' },
    { lbl: '!=', ins: ' != ' }
  ];

  function buildSymBarHTML() {
    return `<div class="m-code-symbar">${CS_SYMS.map((s, i) => `<button type="button" class="m-sym-btn" data-sym-idx="${i}">${escapeHTML(s.lbl)}</button>`).join('')}</div>`;
  }

  function buildIdeEditorHTML(initialCode, extraCls = '', height = 220, readOnly = false) {
    return `
      <div class="ide-shell ${extraCls}" style="height:${height}px" data-ide="1">
        <pre class="ide-pre">${hlCS(initialCode)}</pre>
        <textarea class="ide-textarea" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" ${readOnly ? 'disabled' : ''}>${escapeHTML(initialCode)}</textarea>
      </div>`;
  }

  function bindIdeEditors(rootEl, onCodeChange) {
    rootEl.querySelectorAll('.ide-shell[data-ide]').forEach(shell => {
      if (shell.dataset.ideBound) return;
      shell.dataset.ideBound = '1';
      const pre = shell.querySelector('.ide-pre');
      const ta = shell.querySelector('.ide-textarea');
      const sync = () => {
        pre.innerHTML = hlCS(ta.value);
        if (onCodeChange) onCodeChange(ta.value, shell);
      };
      ta.addEventListener('input', sync);
      ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; });
      shell._getCode = () => ta.value;
      shell._setCode = (val) => { ta.value = val; sync(); };

      // Attach symbol quick-insert bar if adjacent or in parent card
      const cardHost = shell.closest('.cs-runner-card') || shell.parentElement;
      cardHost?.querySelectorAll('.m-sym-btn').forEach(btn => {
        btn.onpointerdown = (e) => e.preventDefault();
        btn.onclick = () => {
          if (ta.disabled) return;
          const spec = CS_SYMS[Number(btn.dataset.symIdx)];
          if (!spec) return;
          const s = ta.selectionStart ?? ta.value.length;
          const en = ta.selectionEnd ?? ta.value.length;
          ta.value = ta.value.slice(0, s) + spec.ins + ta.value.slice(en);
          const pos = s + spec.ins.length - (spec.back || 0);
          ta.focus();
          ta.setSelectionRange(pos, pos);
          sync();
        };
      });
    });
  }

  function buildCodeRunnerHTML(demoIds, runnerUid, compact = false) {
    const list = (Array.isArray(demoIds) ? demoIds : [demoIds]).filter(id => DEMOS[id]);
    if (!list.length) return '';
    const first = DEMOS[list[0]];
    return `
      <div class="cs-runner-card" data-runner="${runnerUid}" data-cur-demo="${list[0]}">
        <div class="cs-runner-head">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="display:flex;align-items:center;gap:6px;min-width:0">
              <span class="cs-lang-pill">C#</span>
              <strong style="font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${first.file}</strong>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button type="button" class="ctrl-btn cs-reset-code-btn" style="padding:4px 9px;font-size:11px;background:rgba(255,255,255,0.1);color:#e2eeff;border-color:rgba(148,163,184,0.3)">还原</button>
              <button type="button" class="cs-run-btn" data-run-cs="${runnerUid}">▶ 运行代码</button>
            </div>
          </div>
          ${list.length > 1 ? `<div class="cs-tabs">${list.map((id, i) => `<button type="button" class="cs-tab-btn ${i === 0 ? 'active' : ''}" data-demo-tab="${id}">${DEMOS[id].file}</button>`).join('')}</div>` : ''}
        </div>
        <div class="cs-editor-bar"><span class="cs-file-caption">${first.title}</span><span>可改参运行</span></div>
        ${buildIdeEditorHTML(first.code, 'cs-ide-box', compact ? 200 : 235)}
        ${buildSymBarHTML()}
        <div class="cs-console-box"><div class="cs-console-line info">[就绪] 点击「▶ 运行代码」执行并预览动态效果</div></div>
        <div class="cs-preview-wrap">
          <canvas></canvas>
          <div class="cs-preview-placeholder"><span>点击「▶ 运行代码」查看动画运行效果</span></div>
        </div>
      </div>`;
  }

  function bindCodeRunners(rootEl) {
    bindIdeEditors(rootEl);
    rootEl.querySelectorAll('.cs-runner-card').forEach(card => {
      if (card.dataset.bound) return;
      card.dataset.bound = '1';
      const ide = card.querySelector('.ide-shell');
      const con = card.querySelector('.cs-console-box');
      const prevWrap = card.querySelector('.cs-preview-wrap');
      const ph = card.querySelector('.cs-preview-placeholder');
      const cap = card.querySelector('.cs-file-caption');

      const executeCode = () => {
        const demoId = card.dataset.curDemo;
        const d = DEMOS[demoId];
        if (!d || !ide) return;
        const res = d.run(ide._getCode());
        state.ranDemos[demoId] = true;
        saveState(); updateGlobalStats();
        con.innerHTML = '';
        res.logs.forEach((ln, idx) => {
          setTimeout(() => {
            const div = document.createElement('div');
            div.className = `cs-console-line ${ln.t || ''}`;
            div.textContent = `> ${ln.msg}`;
            con.appendChild(div);
            con.scrollTop = con.scrollHeight;
          }, idx * 55);
        });
        if (ph) ph.style.display = 'none';
        window.AnimEngine.mount(prevWrap, res.anim.engine, { mode: res.anim.mode, params: res.anim.params || {} });
        delete prevWrap.dataset.zoomWired;
        attachCanvasZoomBehavior(prevWrap, { engine: res.anim.engine, mode: res.anim.mode, params: res.anim.params || {}, title: `${d.file} — 全屏视图` });
      };

      card.querySelector('[data-run-cs]').onclick = executeCode;
      if (ph) ph.onclick = executeCode;
      card.querySelector('.cs-reset-code-btn').onclick = () => {
        const d = DEMOS[card.dataset.curDemo];
        if (d && ide) ide._setCode(d.code);
      };
      card.querySelectorAll('[data-demo-tab]').forEach(tab => {
        tab.onclick = () => {
          card.querySelectorAll('[data-demo-tab]').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const id = tab.dataset.demoTab;
          card.dataset.curDemo = id;
          if (ide) ide._setCode(DEMOS[id].code);
          if (cap) cap.textContent = DEMOS[id].title;
        };
      });
    });
  }

  /* ==================== KNOWLEDGE VIEW + LEFT DRAWER ==================== */
  function buildDrawerHTML() {
    return MODULES.map(m => {
      const mStat = computeModuleMastery(m.id);
      const children = SECTIONS.filter(s => s.mod === m.id);
      return `
        <div style="margin-bottom:10px">
          <div class="toc-chapter-btn">
            <span>${m.short}</span>
            <span class="exam-tag">${mStat.pct}%</span>
          </div>
          <div style="padding-left:10px;border-left:1.5px solid var(--border);display:flex;flex-direction:column;gap:3px">
            ${children.map(s => {
              const ss = computeTopicMastery(s.id);
              return `<button type="button" class="toc-sub-item ${s.id === state.activeSection ? 'active' : ''}" data-drawer-sec="${s.id}">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.short}</span>
                <span style="font-family:var(--font-mono);font-size:10.5px;flex-shrink:0">${ss.pct}%</span>
              </button>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  }

  function openSectionDrawer() {
    const mask = document.getElementById('m-drawer-mask');
    const body = document.getElementById('m-drawer-body');
    if (!mask || !body) return;
    body.innerHTML = buildDrawerHTML();
    body.querySelectorAll('[data-drawer-sec]').forEach(btn => {
      btn.onclick = () => {
        state.activeSection = btn.dataset.drawerSec;
        closeSectionDrawer();
        renderKnowledgeView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    });
    mask.classList.add('open');
  }

  function closeSectionDrawer() {
    document.getElementById('m-drawer-mask')?.classList.remove('open');
  }

  function renderKnowledgeView() {
    const host = document.getElementById('m-view-knowledge');
    if (!host) return;
    const secIdx = Math.max(0, SECTIONS.findIndex(s => s.id === state.activeSection));
    const sec = SECTIONS[secIdx] || SECTIONS[0];
    if (!sec) return;
    state.activeSection = sec.id;
    const mod = MODULES.find(m => m.id === sec.mod);
    const prevSec = secIdx > 0 ? SECTIONS[secIdx - 1] : null;
    const nextSec = secIdx < SECTIONS.length - 1 ? SECTIONS[secIdx + 1] : null;
    const isStudied = !!(state.studiedSections[sec.id] || state.studiedMods[sec.mod]);
    const mantra = MANTRAS[mantraIdx % MANTRAS.length];

    let bodyContent = '';
    if (state.kSubTab === 'notes') {
      bodyContent = `
        <div class="kp-card" style="margin-bottom:10px;padding:11px 13px;border-left:4px solid var(--primary)">
          <div style="font-size:13px;font-weight:800;color:var(--text)">${sec.tip}</div>
        </div>
        ${sec.html}
        <button type="button" class="submit-btn" id="m-btn-checkin" style="width:100%;margin-top:6px">
          ${isStudied ? '本小节已打卡学完 (+15%熟练度)' : '打卡本小节已学完 (+15%熟练度)'}
        </button>`;
    } else if (state.kSubTab === 'code') {
      bodyContent = buildCodeRunnerHTML(sec.demos, `mcs-${sec.id}`);
    } else {
      bodyContent = sec.labs.map(lab => `
        <div class="anim-lab-card" data-engine="${lab.engine}" data-default-mode="${lab.defaultMode}" data-lab-id="${lab.id}">
          <div class="anim-lab-bar">
            <strong style="font-size:12.5px">${lab.title}</strong>
            ${lab.modes.length > 1 ? `<div class="anim-mode-pills">${lab.modes.map((md, i) => `<button type="button" class="anim-pill ${i === 0 ? 'active' : ''}" data-mode="${md.key}">${md.label}</button>`).join('')}</div>` : ''}
          </div>
          <div class="anim-stage-wrap">
            <div class="anim-canvas-box"><canvas></canvas></div>
            <div class="anim-side-panel"></div>
          </div>
          <div class="anim-controls-bar">
            <div class="ctrl-group">
              <button type="button" class="ctrl-btn primary" data-act="play">暂停</button>
              <button type="button" class="ctrl-btn" data-act="step">单步</button>
              <button type="button" class="ctrl-btn" data-act="reset">重播</button>
              <label class="ctrl-slider">倍速 <input type="range" min="0.4" max="2.5" step="0.1" value="1" data-act="speed"></label>
            </div>
            <div class="anim-narrator">手机端可点击右上角「全屏查看」放大演示</div>
          </div>
        </div>`).join('');
    }

    host.innerHTML = `
      <div class="m-sec-bar">
        <div class="m-sec-info">
          <div class="m-sec-kicker">${mod ? mod.short : ''} · ${sec.lectures} · ${secIdx + 1}/${SECTIONS.length}</div>
          <div class="m-sec-title">${sec.title}</div>
        </div>
        <button type="button" class="m-drawer-trigger" id="m-open-toc">全部 16 节 ▾</button>
      </div>

      <div class="m-mantra-bar" id="m-mantra-bar" title="点击切换考前口诀">
        <img src="${MASCOTS[mantra.mood] || MASCOTS.teach || ''}" alt="伴学口诀">
        <div class="m-mantra-txt">${escapeHTML(mantra.text)}（点我换条口诀）</div>
      </div>

      <div class="m-seg">
        <button type="button" class="m-seg-btn ${state.kSubTab === 'notes' ? 'active' : ''}" data-ktab="notes">核心详解</button>
        <button type="button" class="m-seg-btn ${state.kSubTab === 'code' ? 'active' : ''}" data-ktab="code">C# 沙盒</button>
        <button type="button" class="m-seg-btn ${state.kSubTab === 'anim' ? 'active' : ''}" data-ktab="anim">交互动画</button>
      </div>

      <div>${bodyContent}</div>

      <div class="m-sec-pager">
        <button type="button" class="secondary-btn" id="m-sec-prev" ${!prevSec ? 'disabled' : ''}>← 上一节</button>
        <button type="button" class="submit-btn" id="m-sec-prac">本节刷题</button>
        <button type="button" class="secondary-btn" id="m-sec-next" ${!nextSec ? 'disabled' : ''}>下一节 →</button>
      </div>`;

    document.getElementById('m-open-toc')?.addEventListener('click', openSectionDrawer);
    document.getElementById('m-mantra-bar')?.addEventListener('click', () => {
      mantraIdx = (mantraIdx + 1) % MANTRAS.length;
      renderKnowledgeView();
    });
    host.querySelectorAll('[data-ktab]').forEach(btn => {
      btn.onclick = () => { state.kSubTab = btn.dataset.ktab; renderKnowledgeView(); };
    });

    if (state.kSubTab === 'notes') {
      host.querySelectorAll('.code-block').forEach(el => { el.innerHTML = hlCS(el.textContent); });
      document.getElementById('m-btn-checkin')?.addEventListener('click', () => {
        state.studiedSections[sec.id] = !state.studiedSections[sec.id];
        saveState(); updateGlobalStats(); renderKnowledgeView();
      });
    } else if (state.kSubTab === 'code') {
      bindCodeRunners(host);
    } else {
      host.querySelectorAll('.anim-lab-card').forEach(card => {
        const labCfg = sec.labs.find(l => l.id === card.dataset.labId);
        window.AnimEngine.mount(card, card.dataset.engine, { mode: card.dataset.defaultMode });
        attachCanvasZoomBehavior(card, { engine: card.dataset.engine, mode: card.dataset.defaultMode, title: labCfg ? labCfg.title : '动画预览', modes: labCfg ? labCfg.modes : null });
      });
    }

    document.getElementById('m-sec-prev')?.addEventListener('click', () => {
      if (prevSec) { state.activeSection = prevSec.id; renderKnowledgeView(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
    document.getElementById('m-sec-next')?.addEventListener('click', () => {
      if (nextSec) { state.activeSection = nextSec.id; renderKnowledgeView(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
    document.getElementById('m-sec-prac')?.addEventListener('click', () => {
      startRandomSession({ mod: sec.mod, topic: sec.id, label: sec.short });
      state.practiceSub = 'bank';
      switchView('practice');
    });
  }

  /* ==================== QUESTION EVALUATION & RENDERING ==================== */
  function evaluateQuestion(q, userVal) {
    if (q.type === 'single' || q.type === 'tf') {
      return { correct: userVal === q.answer, evalReport: null };
    }
    if (q.blanks) {
      if (!Array.isArray(userVal)) return { correct: false, evalReport: null };
      const ok = q.blanks.every((b, i) =>
        GRADER ? GRADER.matchFillBlank(userVal[i], b.answers)
               : b.answers.some(a => normalizeAns(a) === normalizeAns(userVal[i]))
      );
      return { correct: ok, evalReport: null };
    }
    if (GRADER) {
      const rep = GRADER.evaluateSubjective(q, userVal);
      return { correct: rep.pass, evalReport: rep };
    }
    return { correct: String(userVal || '').trim().length >= 12, evalReport: null };
  }

  function buildSubjectiveReportHTML(ev) {
    if (!ev) return '';
    const badgeMap = { full: '已命中', partial: '部分命中', miss: '待补充' };
    return `
      <div class="ai-grade-card">
        <div class="ai-grade-head">
          <strong style="font-size:12.5px">智能批改报告${ev.branchName ? `（${ev.branchName}）` : ''}</strong>
          <span class="ai-score-pill ${ev.pass ? 'pass' : 'fail'}">${ev.score}/${ev.maxScore} · ${ev.pass ? '判定正确' : '暂未达标'}</span>
        </div>
        <div class="ai-grade-summary">${ev.summary || ''}</div>
        <div class="ai-pt-list">
          ${(ev.details || []).map(pt => `
            <div class="ai-pt-row ${pt.status}">
              <div class="ai-pt-top">
                <span>${pt.label}</span>
                <span class="ai-pt-badge">${badgeMap[pt.status] || '未命中'} · ${pt.earned}/${pt.weight}</span>
              </div>
              ${pt.hits && pt.hits.length ? `<div class="ai-pt-hits">${pt.hits.map(h => `<span class="ai-hit-chip">${escapeHTML(h)}</span>`).join('')}</div>` : ''}
              ${pt.status !== 'full' && pt.missHint ? `<div class="ai-pt-hint">建议：${pt.missHint}</div>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  function buildExplainDetailHTML(itemId) {
    const d = window.EXPLAIN_DETAILS && window.EXPLAIN_DETAILS[itemId];
    if (!d) return '';
    return `
      <div class="explain-detail-card">
        <div class="ex-detail-head">
          <span class="ex-detail-badge">深度分步解析</span>
          <span class="ex-detail-sub">为什么这么做 &amp; 逐步实现 / 推导</span>
        </div>
        <div class="ex-why-box">
          <span class="ex-sec-tag why">为什么这么做</span>
          <p class="ex-why-text">${escapeHTML(d.why)}</p>
        </div>
        <div class="ex-steps-box">
          <span class="ex-sec-tag steps">逐步推导 / 实现流程</span>
          <ol class="ex-step-list">
            ${(d.steps || []).map((st, idx) => `<li class="ex-step-item"><span class="ex-step-num">${idx + 1}</span><span>${escapeHTML(st)}</span></li>`).join('')}
          </ol>
        </div>
        <div class="ex-pitfall-box">
          <span class="ex-sec-tag pitfall">考场避坑</span>
          <span>${escapeHTML(d.pitfall)}</span>
        </div>
      </div>`;
  }

  function buildExplainHTML(q, saved, opts = {}) {
    const isSubj = (q.type === 'essay' || (q.type === 'code' && q.subkind === 'write'));
    let subjReport = null;
    if (isSubj && saved && saved.checked) {
      subjReport = saved.evalReport || (GRADER ? GRADER.evaluateSubjective(q, saved.userVal) : null);
    }
    let mascot = 'teach', verdictCls = 'info', verdictTxt = '参考解析、C# 示例与动画';
    if (isSubj && subjReport) {
      verdictCls = subjReport.pass ? 'ok' : 'bad';
      mascot = subjReport.pass ? 'happy' : 'oops';
      verdictTxt = subjReport.pass ? `判定通过！${subjReport.score}/${subjReport.maxScore} 分` : `当前 ${subjReport.score}/${subjReport.maxScore} 分（需 >= 6 分达标）`;
    } else if (saved && saved.checked && q.type !== 'code') {
      verdictCls = saved.correct ? 'ok' : 'bad';
      mascot = saved.correct ? 'happy' : 'oops';
      verdictTxt = saved.correct ? '回答正确！对应熟练度已上升' : '回答有误，已收入错题本';
    }

    let answerBlock = '';
    if (q.type === 'single') answerBlock = `<div style="margin-bottom:6px"><strong>参考答案：</strong><span style="color:var(--success);font-weight:900">${['A', 'B', 'C', 'D'][q.answer]}. ${q.options[q.answer]}</span></div>`;
    else if (q.type === 'tf') answerBlock = `<div style="margin-bottom:6px"><strong>参考答案：</strong><span style="color:var(--success);font-weight:900">${q.answer ? '对' : '错'}</span></div>`;
    else if (q.blanks) answerBlock = `<div style="margin-bottom:6px;display:flex;flex-wrap:wrap;gap:5px">${q.blanks.map(b => `<span class="exam-tag">${b.label}: <b style="color:var(--success);margin-left:3px">${escapeHTML(b.answers[0])}</b></span>`).join('')}</div>`;

    let rubricHTML = subjReport ? buildSubjectiveReportHTML(subjReport) : '';
    if (q.rubric && !subjReport) {
      rubricHTML += `<div style="margin-top:8px"><strong style="font-size:12.5px">考场采分点清单：</strong><ul class="rubric-list">` +
        q.rubric.map(r => `<li class="rubric-item"><input type="checkbox"><span>${r}</span></li>`).join('') + `</ul></div>`;
    }
    const modelHTML = (q.modelAnswer ? `<div style="margin-top:8px"><strong>参考范本：</strong><div class="formula-box" style="white-space:pre-wrap;font-family:var(--font-sans)">${escapeHTML(q.modelAnswer)}</div></div>` : '')
      + (q.modelCode ? `<div style="margin-top:8px"><strong>参考 C# 代码：</strong><div class="code-block">${hlCS(q.modelCode)}</div></div>` : '');
    const anim = q.anim || { engine: 'astar', mode: 'ppt', caption: '交互动画演示' };

    return `
      <div class="explain-box">
        <div class="explain-head">
          <img class="explain-mascot" src="${MASCOTS[mascot] || ''}" alt="大肥鱼">
          <div style="flex:1;min-width:0">
            <div class="explain-verdict ${verdictCls}">${verdictTxt}</div>
            ${answerBlock}
            ${q.explain ? `<div class="explain-text">${q.explain}</div>` : ''}
          </div>
        </div>
        ${buildExplainDetailHTML(q.id)}
        ${opts.hasNext ? `<button type="button" class="submit-btn inline-next-q-btn" style="width:100%;margin-bottom:8px">进入下一题 →</button>` : ''}
        ${rubricHTML}
        ${modelHTML}
        <div class="explain-anim-wrap" data-ex-engine="${anim.engine}" data-ex-mode="${anim.mode}" data-ex-params='${JSON.stringify(anim.params || {})}' data-ex-title="${escapeHTML(anim.caption)}">
          <div class="explain-anim-bar">
            <span>动画：${anim.caption}</span>
            <div class="ctrl-group">
              <button type="button" class="ctrl-btn primary" data-act="play">暂停</button>
              <button type="button" class="ctrl-btn" data-act="step">单步</button>
              <button type="button" class="ctrl-btn" data-act="reset">重播</button>
            </div>
          </div>
          <div class="anim-stage-wrap">
            <div class="anim-canvas-box" style="min-height:220px"><canvas class="explain-anim-canvas"></canvas></div>
            <div class="anim-side-panel" style="max-height:175px"></div>
          </div>
        </div>
      </div>`;
  }

  function mountExplainWidgets(cardEl, onNextCb) {
    bindIdeEditors(cardEl);
    if (onNextCb) cardEl.querySelectorAll('.inline-next-q-btn').forEach(b => { b.onclick = onNextCb; });
    const wrap = cardEl.querySelector('.explain-anim-wrap');
    if (wrap && !wrap.dataset.mounted) {
      wrap.dataset.mounted = '1';
      let params = {};
      try { params = JSON.parse(wrap.dataset.exParams || '{}'); } catch {}
      window.AnimEngine.mount(wrap, wrap.dataset.exEngine, { mode: wrap.dataset.exMode, params });
      attachCanvasZoomBehavior(wrap, { engine: wrap.dataset.exEngine, mode: wrap.dataset.exMode, params, title: wrap.dataset.exTitle || '全屏动画预览' });
    }
  }

  function renderQuestionCard(q, displayIdx, opts = {}) {
    const isMock = !!opts.mockMode;
    const saved = isMock ? (opts.mockAns || null) : (opts.instance ? opts.instance.ans : (state.answers[q.id] || null));
    const isLocked = (!!opts.lockAfterAnswer && !!(saved && saved.checked)) || (isMock && !!state.mockExam?.submitted);
    const isFav = !!state.favorites[q.id];
    const cardCls = saved && saved.checked ? (saved.correct ? 'is-correct' : 'is-wrong') : '';
    const cardId = `${isMock ? 'mq' : 'q'}-${q.id}`;

    let bodyHTML = '';
    if (q.interactiveGrid && BOARD) {
      const ig = q.interactiveGrid;
      const valsArr = (saved && Array.isArray(saved.userVal)) ? saved.userVal : [];
      const curPathStr = String(valsArr[ig.syncBlankIdx ?? 5] || '').trim();
      const parsedIds = curPathStr ? curPathStr.split(/[-–—>,\s]+/).map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < ig.rows * ig.cols) : [];
      const gridUid = opts.instance ? `${opts.instance.uid}-ig` : `${cardId}-${displayIdx}-ig`;
      bodyHTML += `<div class="ig-board-host">${BOARD.createBoardHTML(ig, gridUid, { ...ig, path: parsedIds }, isLocked)}</div>`;
    } else if (q.customHtml) {
      bodyHTML += q.customHtml;
    }
    if (q.codeTemplate) bodyHTML += `<div class="code-block">${hlCS(q.codeTemplate)}</div>`;

    if (q.type === 'single') {
      const L = ['A', 'B', 'C', 'D'];
      bodyHTML += `<div class="options-grid">${q.options.map((opt, idx) => {
        let cls = '';
        if (saved && saved.checked) {
          if (idx === q.answer) cls = 'correct';
          else if (idx === saved.userVal) cls = 'wrong';
        } else if (saved && saved.userVal === idx) cls = 'selected';
        return `<button type="button" class="opt-btn ${cls}" data-opt="${idx}" ${isLocked ? 'disabled' : ''}><span class="opt-key">${L[idx]}</span><span>${opt}</span></button>`;
      }).join('')}</div>`;
    } else if (q.type === 'tf') {
      bodyHTML += `<div class="options-grid">${[[true, '对（正确）'], [false, '错（错误）']].map(([val, lbl], i) => {
        let cls = '';
        if (saved && saved.checked) {
          if (val === q.answer) cls = 'correct';
          else if (val === saved.userVal) cls = 'wrong';
        } else if (saved && saved.userVal === val) cls = 'selected';
        return `<button type="button" class="opt-btn ${cls}" data-tf="${val}" ${isLocked ? 'disabled' : ''}><span class="opt-key">${i === 0 ? 'T' : 'F'}</span><span>${lbl}</span></button>`;
      }).join('')}</div>`;
    } else if (q.blanks) {
      const vals = (saved && Array.isArray(saved.userVal)) ? saved.userVal : q.blanks.map(() => '');
      bodyHTML += `<div class="blanks-wrap">${q.blanks.map((b, i) => {
        let cls = '';
        if (saved && saved.checked) cls = (GRADER ? GRADER.matchFillBlank(vals[i], b.answers) : false) ? 'ok' : 'bad';
        return `<div class="blank-field"><label>${b.label}</label><input class="blank-input ${cls}" data-bidx="${i}" value="${escapeHTML(vals[i] || '')}" placeholder="输入答案..." ${isLocked ? 'disabled' : ''}></div>`;
      }).join('')}</div>`;
    } else if (q.type === 'code') {
      const fallbackStarter = q.starterCode || '// 在此手写 Unity C# 核心代码\n';
      const txtVal = (saved && typeof saved.userVal === 'string') ? saved.userVal : fallbackStarter;
      const ideH = q.starterCode ? 225 : 195;
      const starterBar = (q.starterCode && !isLocked)
        ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;background:#0f172a;border-bottom:1px solid #1e2d4a;font-size:11.5px;color:#94a3b8"><span>已内置逐行提示注释</span><button type="button" class="ctrl-btn q-reset-starter-btn" style="padding:3px 8px;font-size:11px;background:rgba(255,255,255,0.08);color:#e2eeff;border-color:rgba(148,163,184,0.3)">重置骨架</button></div>`
        : '';
      bodyHTML += `<div style="border-radius:12px;overflow:hidden;border:1px solid #1e2d4a;margin-bottom:10px">${starterBar}${buildIdeEditorHTML(txtVal, 'q-code-ide', ideH, isLocked)}${!isLocked ? buildSymBarHTML() : ''}</div>`;
    } else {
      const isHybrid = saved && saved.userVal && typeof saved.userVal === 'object' && !Array.isArray(saved.userVal);
      const txtVal = isHybrid ? (saved.userVal.text || '') : (typeof saved?.userVal === 'string' ? saved.userVal : '');
      const savedDia = isHybrid ? (saved.userVal.diagram || null) : null;
      if (q.board && BOARD) {
        const boardUid = opts.instance ? opts.instance.uid : `${cardId}-${displayIdx}`;
        bodyHTML += BOARD.createBoardHTML(q.board, boardUid, savedDia, isLocked);
        bodyHTML += `<div class="board-text-label">补充文字说明（可配合画板作答）：</div>`;
      } else if (q.scratchBoard && BOARD) {
        const scUid = opts.instance ? `${opts.instance.uid}-sc` : `${cardId}-${displayIdx}-sc`;
        bodyHTML += `
          <div class="scratch-board-wrap">
            <div class="scratch-bar">
              <span class="scratch-title">辅助草稿画板（不计分）</span>
              <button type="button" class="secondary-btn scratch-toggle-btn" style="padding:5px 10px;font-size:11.5px">展开寻路草稿板</button>
            </div>
            <div class="scratch-host hidden">${BOARD.createBoardHTML(q.scratchBoard, scUid, null, false)}</div>
          </div>`;
      }
      bodyHTML += `<textarea class="essay-textarea" placeholder="在此输入作答思路或结论，提交后进行智能语义判分..." ${isLocked ? 'disabled' : ''}>${escapeHTML(txtVal)}</textarea>`;
    }

    let footerHTML = '';
    if (!isMock) {
      if (isLocked) {
        footerHTML = `<div class="locked-notice-bar"><span>本题已作答并锁定，请查看解析后进入下一题</span>${opts.hasNext ? `<button type="button" class="submit-btn inline-next-q-btn">进入下一题 →</button>` : ''}</div>`;
      } else if (opts.lockAfterAnswer && (q.type === 'single' || q.type === 'tf')) {
        footerHTML = `<div class="q-footer-bar"><button type="button" class="secondary-btn" data-toggle-anim="${q.id}">直接查看解析与动画</button></div>`;
      } else {
        footerHTML = `<div class="q-footer-bar"><button type="button" class="submit-btn" data-check="${q.id}">${q.board ? '提交画板与作答并批改' : '提交作答并批改'}</button><button type="button" class="secondary-btn" data-toggle-anim="${q.id}">直接查看解析与动画</button></div>`;
      }
    }

    return `
      <div class="q-card ${cardCls}" id="${cardId}" data-qid="${q.id}">
        <div class="q-header">
          <div class="q-meta">
            <span class="q-num">${displayIdx}</span>
            <span class="q-type-badge">${TYPE_LABELS[q.type] || '题目'}</span>
            <span class="exam-tag blue">${TOPIC_NAME[q.topic] || MOD_SHORT[q.module] || ''}</span>
            ${opts.points ? `<span class="exam-tag hot">${opts.points}分</span>` : ''}
            ${isLocked ? `<span class="exam-tag locked-tag">已锁定</span>` : ''}
          </div>
          ${!isMock ? `<button type="button" class="fav-btn ${isFav ? 'active' : ''}" data-fav="${q.id}">${isFav ? '已收藏' : '收藏'}</button>` : ''}
        </div>
        <div class="q-stem">${q.stem}</div>
        ${bodyHTML}
        ${footerHTML}
        <div class="explain-slot">${saved && saved.checked ? buildExplainHTML(q, saved, opts) : ''}</div>
      </div>`;
  }

  function bindQuestionCardEvents(host, opts = {}) {
    const isMock = !!opts.mockMode;
    const onAfterCheck = opts.onAfterCheck || null;
    const onNext = opts.onNext || null;

    bindIdeEditors(host, (val, shell) => {
      if (isMock && shell.classList.contains('q-code-ide')) {
        const card = shell.closest('.q-card');
        if (card) state.mockExam.userAnswers[card.dataset.qid] = val;
      }
    });

    host.querySelectorAll('.q-card').forEach(card => {
      const qid = card.dataset.qid;
      const q = BANK.find(x => x.id === qid);
      if (!q) return;

      const curSaved = isMock
        ? (state.mockExam?.submitted ? { userVal: state.mockExam.userAnswers[qid], evalReport: evaluateQuestion(q, state.mockExam.userAnswers[qid]).evalReport, checked: true } : { userVal: state.mockExam?.userAnswers[qid], checked: false })
        : (opts.instance ? opts.instance.ans : (state.answers[qid] || null));
      const cardLocked = (!!opts.lockAfterAnswer && !!(curSaved && curSaved.checked)) || (isMock && !!state.mockExam?.submitted);

      const boardWrap = Array.from(card.querySelectorAll('.diagram-board-wrap')).find(el => !el.closest('.scratch-host') && !el.closest('.ig-board-host'));
      if (q.board && BOARD && boardWrap && !boardWrap.dataset.mounted) {
        boardWrap.dataset.mounted = '1';
        const initUv = curSaved?.userVal;
        const initDia = (initUv && typeof initUv === 'object' && !Array.isArray(initUv)) ? initUv.diagram : null;
        card._boardCtrl = BOARD.mountBoard(boardWrap, q.board, {
          initialData: initDia,
          isLocked: cardLocked,
          evalResult: curSaved?.evalReport?.diagramEval || null,
          onChange: (nextDia) => {
            if (isMock && state.mockExam && !state.mockExam.submitted) {
              const curTxt = card.querySelector('.essay-textarea')?.value || '';
              state.mockExam.userAnswers[qid] = { text: curTxt, diagram: nextDia };
            }
          }
        });
      }

      const scratchBtn = card.querySelector('.scratch-toggle-btn');
      const scratchHost = card.querySelector('.scratch-host');
      if (q.scratchBoard && BOARD && scratchBtn && scratchHost) {
        scratchBtn.onclick = () => {
          const isOpen = !scratchHost.classList.contains('hidden');
          scratchHost.classList.toggle('hidden', isOpen);
          scratchBtn.textContent = isOpen ? '展开寻路草稿板' : '收起草稿板';
          const scWrap = scratchHost.querySelector('.diagram-board-wrap');
          if (!isOpen && scWrap && !scWrap.dataset.mounted) {
            scWrap.dataset.mounted = '1';
            BOARD.mountBoard(scWrap, q.scratchBoard, { initialData: card._scratchData || null, isLocked: false, onChange: (next) => { card._scratchData = next; } });
          }
        };
      }

      const igWrap = card.querySelector('.ig-board-host .diagram-board-wrap');
      if (q.interactiveGrid && BOARD && igWrap && !igWrap.dataset.mounted) {
        igWrap.dataset.mounted = '1';
        const ig = q.interactiveGrid;
        const pathInput = card.querySelector(`.blank-input[data-bidx="${ig.syncBlankIdx ?? 5}"]`);
        const parsePath = (str) => String(str || '').split(/[-–—>,\s]+/).map(s => s.trim()).filter(Boolean).map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < ig.rows * ig.cols);
        let syncing = false;
        const igCtrl = BOARD.mountBoard(igWrap, ig, {
          initialData: { ...ig, path: parsePath(pathInput?.value) },
          isLocked: cardLocked,
          onChange: (nextDia) => {
            if (syncing || !pathInput || cardLocked) return;
            syncing = true;
            pathInput.value = (nextDia.path || []).join('-');
            pathInput.dispatchEvent(new Event('input', { bubbles: true }));
            syncing = false;
          }
        });
        if (pathInput && igCtrl) {
          pathInput.addEventListener('input', () => {
            if (syncing) return;
            syncing = true;
            const cur = igCtrl.getData();
            cur.path = parsePath(pathInput.value);
            igCtrl.setData(cur);
            syncing = false;
          });
        }
      }

      mountExplainWidgets(card, onNext);

      const favBtn = card.querySelector('[data-fav]');
      if (favBtn) favBtn.onclick = () => {
        state.favorites[qid] = !state.favorites[qid];
        saveState(); updateGlobalStats();
        favBtn.classList.toggle('active', !!state.favorites[qid]);
        favBtn.textContent = state.favorites[qid] ? '已收藏' : '收藏';
      };

      card.querySelectorAll('.opt-btn').forEach(btn => {
        btn.onclick = (e) => {
          const val = q.type === 'single' ? Number(btn.dataset.opt) : (btn.dataset.tf === 'true');
          if (isMock) {
            if (state.mockExam.submitted) return;
            state.mockExam.userAnswers[qid] = val;
            card.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
          } else {
            const sNow = opts.instance ? opts.instance.ans : state.answers[qid];
            if (opts.lockAfterAnswer && sNow?.checked) return;
            const correct = evaluateQuestion(q, val).correct;
            const rec = { userVal: val, correct, checked: true };
            if (opts.instance) opts.instance.ans = rec;
            state.answers[qid] = rec;
            saveState(); updateGlobalStats();
            if (correct) {
              state.streak++;
              FireworksFX.launch(state.streak >= 3 ? 1.8 : 1.1, { x: e.clientX || window.innerWidth * 0.5, y: e.clientY || window.innerHeight * 0.5 });
            } else {
              state.streak = 0;
            }
            if (opts.onAnswerResult) opts.onAnswerResult(correct);
            if (onAfterCheck) onAfterCheck();
          }
        };
      });

      if (isMock) {
        card.querySelectorAll('.blank-input').forEach(inp => {
          inp.oninput = () => {
            state.mockExam.userAnswers[qid] = Array.from(card.querySelectorAll('.blank-input')).map(x => x.value);
          };
        });
        const ta = card.querySelector('.essay-textarea');
        if (ta) ta.oninput = () => {
          state.mockExam.userAnswers[qid] = (q.board && card._boardCtrl)
            ? { text: ta.value, diagram: card._boardCtrl.getData() }
            : ta.value;
        };
      }

      const checkBtn = card.querySelector('[data-check]');
      if (checkBtn) checkBtn.onclick = (e) => {
        const sNow = opts.instance ? opts.instance.ans : state.answers[qid];
        if (opts.lockAfterAnswer && sNow?.checked) return;
        let userVal = null;
        if (q.type === 'single' || q.type === 'tf') userVal = sNow?.userVal ?? null;
        else if (q.blanks) userVal = Array.from(card.querySelectorAll('.blank-input')).map(x => x.value);
        else if (q.type === 'code') userVal = card.querySelector('.q-code-ide')?._getCode() || '';
        else if (q.board && card._boardCtrl) userVal = { text: card.querySelector('.essay-textarea')?.value || '', diagram: card._boardCtrl.getData() };
        else userVal = card.querySelector('.essay-textarea')?.value || '';

        const { correct, evalReport } = evaluateQuestion(q, userVal);
        const rec = { userVal, correct, checked: true, evalReport };
        if (opts.instance) opts.instance.ans = rec;
        state.answers[qid] = rec;
        saveState(); updateGlobalStats();
        if (correct) {
          state.streak++;
          FireworksFX.launch(1.3, { x: e.clientX || window.innerWidth * 0.5, y: e.clientY || window.innerHeight * 0.5 });
        } else {
          state.streak = 0;
        }
        if (opts.onAnswerResult) opts.onAnswerResult(correct);
        if (onAfterCheck) onAfterCheck();
      };

      const animBtn = card.querySelector('[data-toggle-anim]');
      if (animBtn) animBtn.onclick = () => {
        const slot = card.querySelector('.explain-slot');
        if (!slot) return;
        if (slot.innerHTML.trim()) { slot.innerHTML = ''; return; }
        slot.innerHTML = buildExplainHTML(q, curSaved || { checked: false }, opts);
        mountExplainWidgets(card, onNext);
      };

      const resetStarterBtn = card.querySelector('.q-reset-starter-btn');
      if (resetStarterBtn && q.starterCode) resetStarterBtn.onclick = () => {
        const ide = card.querySelector('.q-code-ide');
        if (ide) ide._setCode(q.starterCode);
        if (isMock && state.mockExam && !state.mockExam.submitted) {
          state.mockExam.userAnswers[qid] = q.starterCode;
        }
      };
    });
  }

  /* ==================== PRACTICE MODE (UNLIMITED RANDOM + CODING + MOCK) ==================== */
  function getItemDiff(entry) {
    if (entry.kind === 'drill') return (entry.item.id === 'd1' || entry.item.id === 'd4' || entry.item.id === 'd5') ? 3 : 4;
    const q = entry.item;
    if (q.type === 'essay' || q.type === 'code') return 4;
    if (q.type === 'fill') return 3;
    if (q.type === 'tf') return (q.module === 'm4' || q.module === 'm5' || q.module === 'm6') ? 2 : 1;
    return (q.module === 'm1' || q.module === 'm2') ? 1 : 2;
  }

  function drawNextPracticeItem() {
    const all = [
      ...BANK.map(q => ({ kind: 'question', refId: q.id, mod: q.module, topic: q.topic, isCoding: q.type === 'code', item: q })),
      ...DRILLS.map(d => ({ kind: 'drill', refId: d.id, mod: d.module, topic: d.topic, isCoding: true, item: d }))
    ];
    all.forEach(x => { x.diffLv = getItemDiff(x); });
    const filtered = state.focusScope ? all.filter(x => {
      if (state.focusScope.codingOnly) return x.isCoding;
      if (state.focusScope.topic) return x.topic === state.focusScope.topic;
      if (state.focusScope.mod) return x.mod === state.focusScope.mod;
      return true;
    }) : all;
    const pool = filtered.length ? filtered : all;
    const recentIds = new Set(state.practiceHistory.slice(-14).map(h => h.refId));
    let candidates = pool.filter(x => !recentIds.has(x.refId));
    if (!candidates.length) candidates = pool;

    const targetLv = Math.round(state.curveLevel);
    const weighted = candidates.map(c => {
      const d = Math.abs(c.diffLv - targetLv);
      let w = d === 0 ? 5 : (d === 1 ? 2.5 : 1);
      const mastered = c.kind === 'drill' ? !!state.passedDrills[c.refId] : !!(state.answers[c.refId]?.correct);
      if (!mastered) w *= 1.35;
      return { c, w };
    });
    let r = Math.random() * weighted.reduce((s, x) => s + x.w, 0);
    let chosen = weighted[weighted.length - 1].c;
    for (const x of weighted) { r -= x.w; if (r <= 0) { chosen = x.c; break; } }

    state.practiceSeq++;
    const inst = {
      uid: `mp_${state.practiceSeq}`,
      kind: chosen.kind, refId: chosen.refId, mod: chosen.mod, topic: chosen.topic,
      diffLv: chosen.diffLv, isCoding: chosen.isCoding, ans: null,
      draftCode: chosen.kind === 'drill' ? chosen.item.starter : null
    };
    state.practiceHistory.push(inst);
    return inst;
  }

  function startRandomSession(focusScope = null) {
    state.focusScope = focusScope;
    state.practiceHistory = [];
    state.practiceIdx = 0;
    state.curveLevel = 1.4;
    state.cardFlipped = false;
    drawNextPracticeItem();
  }

  function openMobileSummarySheet(topicId) {
    const mask = document.getElementById('m-sheet-mask');
    const title = document.getElementById('m-sheet-title');
    const body = document.getElementById('m-sheet-body');
    if (!mask || !title || !body) return;
    const sum = TOPIC_SUMMARIES[topicId] || TOPIC_SUMMARIES.t_unity;
    const tp = TOPICS.find(t => t.id === topicId);
    title.textContent = `速记知识卡 · ${tp ? tp.name : ''}`;
    body.innerHTML = `
      <div class="formula-box" style="margin-top:0">${escapeHTML(sum.formula)}</div>
      <ul class="kp-list" style="margin:10px 0">${sum.points.map(p => `<li>${p}</li>`).join('')}</ul>
      <div class="trap-callout"><strong>易错避坑：</strong>${sum.trap}</div>
      <button type="button" class="submit-btn" id="m-sheet-go-sec" style="width:100%;margin-top:12px">前往本小节详解与动画 →</button>`;
    document.getElementById('m-sheet-go-sec').onclick = () => {
      closeBottomSheet();
      state.activeSection = topicId;
      switchView('knowledge');
    };
    mask.classList.add('open');
  }

  function closeBottomSheet() {
    document.getElementById('m-sheet-mask')?.classList.remove('open');
  }

  function renderInlineDrillCard(inst, d, displayIdx, onNext) {
    const saved = inst.ans || null;
    const isLocked = !!(saved && saved.checked);
    const curCode = isLocked ? (saved.userVal || d.starter) : (inst.draftCode !== null ? inst.draftCode : d.starter);
    const ev = saved?.evalReport || null;
    return `
      <div class="q-card ${isLocked ? (saved.correct ? 'is-correct' : 'is-wrong') : ''}" id="drill-card-${inst.uid}">
        <div class="q-header">
          <div class="q-meta">
            <span class="q-num">${displayIdx}</span>
            <span class="q-type-badge">编程实战</span>
            <span class="exam-tag blue">${TOPIC_NAME[d.topic] || ''}</span>
            <span class="exam-tag hot">${d.file}</span>
            ${isLocked ? `<span class="exam-tag locked-tag">已锁定</span>` : ''}
          </div>
        </div>
        <div class="q-stem">
          <div style="font-weight:900;margin-bottom:4px">${d.title}</div>
          <div style="font-size:13px;color:var(--text-sec)">${d.desc}</div>
        </div>
        <div class="cs-runner-card">
          <div class="cs-runner-head">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <span class="cs-lang-pill">C# · ${d.file}</span>
              ${!isLocked ? `<div style="display:flex;gap:6px"><button type="button" class="ctrl-btn" id="m-drill-hint">提示</button><button type="button" class="ctrl-btn" id="m-drill-reset">重置</button></div>` : `<span style="font-size:11.5px;color:#7dd3fc;font-weight:700">已检测锁定</span>`}
            </div>
          </div>
          ${buildIdeEditorHTML(curCode, 'm-drill-ide', 215, isLocked)}
          ${!isLocked ? buildSymBarHTML() : ''}
          <div class="cs-console-box" id="m-drill-con">${ev ? `<div class="cs-console-line info">> 最终得分 ${ev.score}% (${ev.passCnt}/${ev.totalCnt})</div>` : `<div class="cs-console-line info">[等待提交] 补全代码后点击下方按钮自动检测</div>`}</div>
        </div>
        ${!isLocked ? `<div class="q-footer-bar" style="margin-top:8px"><button type="button" class="submit-btn" id="m-drill-check">▶ 提交代码并智能检测</button><button type="button" class="secondary-btn" id="m-drill-explain">直接展开详细解析</button></div>` : `<button type="button" class="submit-btn inline-next-q-btn" style="width:100%;margin-top:8px">进入下一题 →</button>`}
        <div id="m-drill-hint-slot"></div>
        <div id="m-drill-explain-slot"></div>
        ${isLocked && ev ? `
          <div class="explain-box">
            <div class="explain-verdict ${ev.pass ? 'ok' : 'bad'}">${ev.pass ? `判定通过 (${ev.score}%)` : `暂未达标 (${ev.score}%)`}</div>
            ${buildExplainDetailHTML(d.id)}
            <div class="drill-checklist">${ev.checks.map(r => `<div class="drill-chk-item ${r.status === 'full' ? 'pass' : 'fail'}"><span class="drill-chk-dot">${r.status === 'full' ? 'OK' : '!'}</span><div><div class="drill-chk-title">${escapeHTML(r.label)}</div>${r.matchNote ? `<div class="drill-chk-match">${escapeHTML(r.matchNote)}</div>` : ''}${r.hint ? `<div class="drill-chk-hint">${escapeHTML(r.hint)}</div>` : ''}</div></div>`).join('')}</div>
            <strong style="font-size:12.5px">参考 C# 代码：</strong>
            <div class="code-block">${hlCS(d.solution)}</div>
          </div>` : ''}
      </div>`;
  }

  function renderPracticeView() {
    const host = document.getElementById('m-view-practice');
    if (!host) return;
    if (state.practiceSub !== 'mock') state.practiceSub = 'bank';

    const topBarHTML = `
      <div class="m-seg">
        <button type="button" class="m-seg-btn ${state.practiceSub === 'bank' ? 'active' : ''}" data-psub="bank">无限随机刷题（含编程）</button>
        <button type="button" class="m-seg-btn ${state.practiceSub === 'mock' ? 'active' : ''}" data-psub="mock">100 分全真模拟</button>
      </div>`;

    if (state.practiceSub === 'bank') {
      if (!state.practiceHistory.length) startRandomSession(state.focusScope);
      const idx = Math.min(Math.max(0, state.practiceIdx), state.practiceHistory.length - 1);
      state.practiceIdx = idx;
      const inst = state.practiceHistory[idx];
      const diffCls = `diff-lv${inst.diffLv}`;
      const diffNames = { 1: 'Lv.1 入门', 2: 'Lv.2 核心', 3: 'Lv.3 进阶', 4: 'Lv.4 攻坚' };
      const qObj = inst.kind === 'question' ? (BANK.find(x => x.id === inst.refId) || BANK[0]) : null;
      const dObj = inst.kind === 'drill' ? (DRILLS.find(x => x.id === inst.refId) || DRILLS[0]) : null;

      host.innerHTML = `
        ${topBarHTML}
        <div class="m-prac-hud">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <strong style="font-size:13.5px">第 ${idx + 1} 题</strong>
            <span class="diff-tier-badge ${diffCls}">${diffNames[inst.diffLv] || 'Lv.2'}</span>
            ${state.streak > 0 ? `<span class="exam-tag hot">连对 ${state.streak}</span>` : ''}
            ${state.focusScope ? `<button type="button" class="exam-tag hot" id="m-clear-focus">${state.focusScope.label} ×</button>` : ''}
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" class="m-pill-btn primary" id="m-btn-card">速记卡</button>
            <button type="button" class="m-pill-btn" id="m-btn-reshuffle">换新题</button>
          </div>
        </div>
        <div id="m-prac-card-stage">
          ${dObj ? renderInlineDrillCard(inst, dObj, idx + 1) : renderQuestionCard(qObj, idx + 1, { hasNext: true, lockAfterAnswer: true, instance: inst })}
        </div>
        <div class="m-prac-pager">
          <button type="button" class="secondary-btn" id="m-q-prev" ${idx === 0 ? 'disabled' : ''}>← 上一题</button>
          <button type="button" class="submit-btn" id="m-q-next">下一题（随机） →</button>
        </div>`;

      const goNext = () => {
        if (state.practiceIdx < state.practiceHistory.length - 1) state.practiceIdx++;
        else { drawNextPracticeItem(); state.practiceIdx = state.practiceHistory.length - 1; }
        renderPracticeView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      const stage = document.getElementById('m-prac-card-stage');
      if (dObj) {
        bindIdeEditors(stage, val => { inst.draftCode = val; });
        stage.querySelectorAll('.inline-next-q-btn').forEach(b => { b.onclick = goNext; });
        document.getElementById('m-drill-hint')?.addEventListener('click', () => {
          const hs = document.getElementById('m-drill-hint-slot');
          if (hs) hs.innerHTML = `<div class="trap-callout" style="margin-top:8px"><strong>编写思路提示：</strong>${escapeHTML(dObj.hint)}</div>`;
        });
        document.getElementById('m-drill-explain')?.addEventListener('click', () => {
          const es = document.getElementById('m-drill-explain-slot');
          const eb = document.getElementById('m-drill-explain');
          if (!es || !eb) return;
          if (es.innerHTML.trim()) {
            es.innerHTML = '';
            eb.textContent = '直接展开详细解析';
            return;
          }
          es.innerHTML = `
            <div class="explain-box" style="margin-top:10px">
              <div class="explain-verdict info">详细步骤剖析与参考 C# 代码</div>
              ${buildExplainDetailHTML(dObj.id)}
              <strong style="font-size:12.5px">标准参考 Unity C# 代码：</strong>
              <div class="code-block" style="margin-top:6px">${hlCS(dObj.solution)}</div>
            </div>`;
          eb.textContent = '收起详细解析';
        });
        document.getElementById('m-drill-reset')?.addEventListener('click', () => {
          inst.draftCode = dObj.starter;
          stage.querySelector('.m-drill-ide')?._setCode(dObj.starter);
        });
        document.getElementById('m-drill-check')?.addEventListener('click', (e) => {
          const code = stage.querySelector('.m-drill-ide')?._getCode() || '';
          const ev = GRADER ? GRADER.evaluateCodeDrill(dObj, code) : { pass: false, score: 0, passCnt: 0, totalCnt: 1, checks: [] };
          inst.ans = { userVal: code, correct: ev.pass, checked: true, evalReport: ev };
          if (ev.pass) state.passedDrills[dObj.id] = true;
          saveState(); updateGlobalStats();
          state.curveLevel = ev.pass ? Math.min(4.0, state.curveLevel + 0.45) : Math.max(1.0, state.curveLevel - 0.55);
          if (ev.pass) { state.streak++; FireworksFX.launch(1.4, { x: e.clientX, y: e.clientY }); }
          else state.streak = 0;
          renderPracticeView();
        });
      } else {
        bindQuestionCardEvents(stage, {
          lockAfterAnswer: true, instance: inst, hasNext: true, onNext: goNext,
          onAnswerResult: (ok) => { state.curveLevel = ok ? Math.min(4.0, state.curveLevel + 0.45) : Math.max(1.0, state.curveLevel - 0.55); },
          onAfterCheck: () => renderPracticeView()
        });
      }

      document.getElementById('m-q-prev').onclick = () => { if (state.practiceIdx > 0) { state.practiceIdx--; renderPracticeView(); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
      document.getElementById('m-q-next').onclick = goNext;
      document.getElementById('m-btn-card').onclick = () => openMobileSummarySheet(inst.topic);
      document.getElementById('m-btn-reshuffle').onclick = () => { startRandomSession(state.focusScope); renderPracticeView(); };
      document.getElementById('m-clear-focus')?.addEventListener('click', () => { startRandomSession(null); renderPracticeView(); });
    } else {
      renderMockExamHTML(host, topBarHTML);
    }

    host.querySelectorAll('[data-psub]').forEach(b => {
      b.onclick = () => { state.practiceSub = b.dataset.psub; renderPracticeView(); };
    });
  }

  /* -------------------- 100-Point Mock Exam (Mobile) -------------------- */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function startNewMockExam() {
    const items = [
      ...shuffle(BANK.filter(q => q.type === 'single')).slice(0, 15).map(q => ({ q, pts: 2 })),
      ...shuffle(BANK.filter(q => q.type === 'tf')).slice(0, 5).map(q => ({ q, pts: 2 })),
      ...shuffle(BANK.filter(q => q.type === 'fill')).slice(0, 5).map(q => ({ q, pts: 2 })),
      ...shuffle(BANK.filter(q => q.type === 'essay')).slice(0, 3).map(q => ({ q, pts: 10 })),
      ...shuffle(BANK.filter(q => q.type === 'code' && q.subkind === 'fill')).slice(0, 1).map(q => ({ q, pts: 10 })),
      ...shuffle(BANK.filter(q => q.type === 'code' && q.subkind === 'write')).slice(0, 1).map(q => ({ q, pts: 10 }))
    ];
    state.mockExam = { items, userAnswers: {}, submitted: false, remainSec: 90 * 60 };
    state.mockPageIdx = 0;
    clearInterval(mockTimerId);
    mockTimerId = setInterval(() => {
      if (!state.mockExam || state.mockExam.submitted) return clearInterval(mockTimerId);
      state.mockExam.remainSec = Math.max(0, state.mockExam.remainSec - 1);
      const tEl = document.getElementById('m-mock-timer');
      if (tEl) {
        const mm = String(Math.floor(state.mockExam.remainSec / 60)).padStart(2, '0');
        const ss = String(state.mockExam.remainSec % 60).padStart(2, '0');
        tEl.textContent = `${mm}:${ss}`;
      }
      if (state.mockExam.remainSec === 0) submitMockExam();
    }, 1000);
    renderPracticeView();
  }

  function submitMockExam(e) {
    if (!state.mockExam || state.mockExam.submitted) return;
    state.mockExam.submitted = true;
    clearInterval(mockTimerId);
    let total = 0, grand = 0;
    state.mockExam.items.forEach(({ q, pts }) => {
      const uv = state.mockExam.userAnswers[q.id];
      const { correct, evalReport } = evaluateQuestion(q, uv);
      grand += pts;
      const isObj = (q.type === 'single' || q.type === 'tf' || q.type === 'fill' || q.subkind === 'fill');
      if (isObj) { if (correct) total += pts; }
      else if (evalReport) total += Math.round((evalReport.ratio * pts) * 2) / 2;
      if (uv !== undefined) state.answers[q.id] = { userVal: uv, correct, checked: true, evalReport };
    });
    state.mockExam.scoreSummary = { total: Number(total.toFixed(1)), grand };
    saveState(); updateGlobalStats();
    if (grand && total / grand >= 0.6) FireworksFX.launch(1.8, { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4 });
    renderPracticeView();
  }

  function openMockSheetModal() {
    const me = state.mockExam;
    const mask = document.getElementById('m-sheet-mask');
    const title = document.getElementById('m-sheet-title');
    const body = document.getElementById('m-sheet-body');
    if (!me || !mask || !title || !body) return;
    title.textContent = `模拟卷答题卡（第 ${state.mockPageIdx + 1}/${me.items.length} 题）`;
    body.innerHTML = `<div class="pager-dots">${me.items.map((it, i) => {
      const ans = me.userAnswers[it.q.id];
      const filled = Array.isArray(ans)
        ? ans.some(s => String(s).trim())
        : (ans && typeof ans === 'object' ? Boolean((ans.diagram?.nodes?.length > 0) || (ans.diagram?.path?.length > 1) || String(ans.text || '').trim()) : (ans !== undefined && ans !== null && String(ans).trim() !== ''));
      let cls = i === state.mockPageIdx ? 'current' : (me.submitted ? (evaluateQuestion(it.q, ans).correct ? 'ok' : 'bad') : (filled ? 'answered' : ''));
      return `<button type="button" class="pager-dot ${cls}" data-goto-mq="${i}">${i + 1}</button>`;
    }).join('')}</div>`;
    body.querySelectorAll('[data-goto-mq]').forEach(btn => {
      btn.onclick = () => { state.mockPageIdx = Number(btn.dataset.gotoMq); closeBottomSheet(); renderPracticeView(); };
    });
    mask.classList.add('open');
  }

  function renderMockExamHTML(host, topBarHTML) {
    if (!state.mockExam) {
      host.innerHTML = `
        ${topBarHTML}
        <div class="m-stat-card">
          <div style="font-size:11.5px;opacity:0.86;margin-bottom:4px">满分 100 分 · 90 分钟 · 手机单页作答</div>
          <h2 style="font-size:19px;font-weight:900;margin-bottom:8px">100 分全真模拟测试</h2>
          <p style="font-size:13px;opacity:0.92;margin-bottom:14px">严格抽取 30 题（单选15 + 判断5 + 填空5 + 作答3 + 编程2），随时打开底部答题卡跳题。</p>
          <button type="button" class="submit-btn" id="m-btn-start-mock" style="width:100%;background:#facc15;color:#0f172a">立即随机组卷开考</button>
        </div>`;
      document.getElementById('m-btn-start-mock').onclick = startNewMockExam;
      return;
    }

    const me = state.mockExam;
    const idx = Math.min(Math.max(0, state.mockPageIdx), me.items.length - 1);
    const { q, pts } = me.items[idx];
    const mm = String(Math.floor(me.remainSec / 60)).padStart(2, '0');
    const ss = String(me.remainSec % 60).padStart(2, '0');
    const uv = me.userAnswers[q.id];
    const mockEv = me.submitted ? evaluateQuestion(q, uv) : null;
    const mockAns = me.submitted ? { userVal: uv, correct: mockEv.correct, evalReport: mockEv.evalReport, checked: true } : { userVal: uv, checked: false };

    host.innerHTML = `
      ${topBarHTML}
      <div class="m-prac-hud">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="timer-pill" id="m-mock-timer">${mm}:${ss}</span>
          <strong style="font-size:12.5px">第 ${idx + 1}/${me.items.length} 题</strong>
        </div>
        <div style="display:flex;gap:6px">
          <button type="button" class="m-pill-btn primary" id="m-mock-sheet">答题卡</button>
          ${!me.submitted ? `<button type="button" class="m-pill-btn" id="m-mock-submit" style="background:var(--danger);color:#fff;border-color:var(--danger)">交卷</button>` : `<button type="button" class="m-pill-btn" id="m-mock-retry">重考</button>`}
        </div>
      </div>
      ${me.submitted && me.scoreSummary ? `<div class="kp-card" style="margin-bottom:10px;border-color:var(--primary)"><strong>全卷阅卷总分：<span style="color:var(--primary);font-size:18px">${me.scoreSummary.total} / ${me.scoreSummary.grand}</span> 分</strong></div>` : ''}
      <div id="m-mock-stage">${renderQuestionCard(q, idx + 1, { mockMode: true, mockAns, points: pts })}</div>
      <div class="m-prac-pager">
        <button type="button" class="secondary-btn" id="m-mq-prev" ${idx === 0 ? 'disabled' : ''}>← 上一题</button>
        ${idx < me.items.length - 1 ? `<button type="button" class="submit-btn" id="m-mq-next">下一题 →</button>` : (!me.submitted ? `<button type="button" class="submit-btn" id="m-mq-finish">提交全卷并评分</button>` : `<button type="button" class="secondary-btn" disabled>已是末题</button>`)}
      </div>`;

    bindQuestionCardEvents(document.getElementById('m-mock-stage'), { mockMode: true });
    document.getElementById('m-mock-sheet').onclick = openMockSheetModal;
    document.getElementById('m-mock-submit')?.addEventListener('click', submitMockExam);
    document.getElementById('m-mq-finish')?.addEventListener('click', submitMockExam);
    document.getElementById('m-mock-retry')?.addEventListener('click', startNewMockExam);
    document.getElementById('m-mq-prev').onclick = () => { if (state.mockPageIdx > 0) { state.mockPageIdx--; renderPracticeView(); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
    document.getElementById('m-mq-next')?.addEventListener('click', () => { if (state.mockPageIdx < me.items.length - 1) { state.mockPageIdx++; renderPracticeView(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
  }

  /* -------------------- MASTERY & NOTEBOOK VIEWS -------------------- */
  function renderMasteryView() {
    const host = document.getElementById('m-view-mastery');
    if (!host) return;
    const ov = computeOverallMastery();
    const total = BANK.length + DRILLS.length;
    const masteredCnt = Object.keys(state.answers).filter(id => state.answers[id]?.correct).length + Object.keys(state.passedDrills).filter(id => state.passedDrills[id]).length;

    host.innerHTML = `
      <div class="m-stat-card">
        <div style="font-size:11.5px;opacity:0.86">综合知识熟练度 · ${ov.rank}</div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin:6px 0 12px">
          <span style="font-size:32px;font-weight:900;font-family:var(--font-mono)">${ov.avg}%</span>
          <span style="font-size:12.5px;font-weight:800">已掌握 ${masteredCnt} / ${total}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button type="button" class="submit-btn" id="m-weak-go" style="font-size:12.5px;padding:9px">专攻最薄弱点</button>
          <button type="button" class="secondary-btn" id="m-code-go" style="font-size:12.5px;padding:9px;background:rgba(255,255,255,0.16);color:#fff;border-color:rgba(255,255,255,0.3)">专刷 C# 编程</button>
        </div>
      </div>
      <div style="font-size:13px;font-weight:900;margin:10px 0 8px">16 大考点实时熟练度</div>
      ${TOPICS.map(tp => {
        const st = computeTopicMastery(tp.id);
        return `
          <div class="m-topic-row">
            <div class="m-bar-head"><span>${tp.name}</span><span style="color:var(--primary);font-family:var(--font-mono)">${st.pct}% (${st.right}/${st.total})</span></div>
            <div class="m-bar-track"><div class="m-bar-fill" style="width:${st.pct}%"></div></div>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button type="button" class="m-pill-btn" data-m-sec="${tp.id}">看详解</button>
              <button type="button" class="m-pill-btn primary" data-m-prac="${tp.id}">专项刷题</button>
            </div>
          </div>`;
      }).join('')}`;

    document.getElementById('m-weak-go').onclick = () => {
      let weakest = TOPICS[0], minP = 999;
      TOPICS.forEach(tp => { const p = computeTopicMastery(tp.id).pct; if (p < minP) { minP = p; weakest = tp; } });
      startRandomSession({ mod: weakest.mod, topic: weakest.id, label: weakest.name });
      state.practiceSub = 'bank'; switchView('practice');
    };
    document.getElementById('m-code-go').onclick = () => {
      startRandomSession({ codingOnly: true, label: 'C# 编程专项' });
      state.practiceSub = 'bank'; switchView('practice');
    };
    host.querySelectorAll('[data-m-sec]').forEach(b => b.onclick = () => {
      state.activeSection = b.dataset.mSec; switchView('knowledge');
    });
    host.querySelectorAll('[data-m-prac]').forEach(b => b.onclick = () => {
      const tp = TOPICS.find(t => t.id === b.dataset.mPrac);
      startRandomSession({ mod: tp?.mod, topic: b.dataset.mPrac, label: tp?.name || '' });
      state.practiceSub = 'bank'; switchView('practice');
    });
  }

  function renderNotebookView() {
    const host = document.getElementById('m-view-notebook');
    if (!host) return;
    host.innerHTML = `
      <div class="m-seg">
        <button type="button" class="m-seg-btn ${state.nbFilter === 'wrong' ? 'active' : ''}" data-nbf="wrong">错题本</button>
        <button type="button" class="m-seg-btn ${state.nbFilter === 'fav' ? 'active' : ''}" data-nbf="fav">我的收藏</button>
        <button type="button" class="m-seg-btn ${state.nbFilter === 'done' ? 'active' : ''}" data-nbf="done">全部已做</button>
      </div>
      <input type="text" class="search-input" id="m-nb-search" value="${escapeHTML(state.nbSearch)}" placeholder="搜索题干或考点关键词..." style="margin-bottom:10px" />
      <div id="m-nb-list"></div>`;

    const paintList = () => {
      const listEl = document.getElementById('m-nb-list');
      if (!listEl) return;
      const kw = (state.nbSearch || '').trim().toLowerCase();
      const list = BANK.filter(q => {
        const ans = state.answers[q.id];
        const isWrong = ans?.checked && !ans.correct;
        const isFav = !!state.favorites[q.id];
        const matchTab = state.nbFilter === 'wrong' ? isWrong : (state.nbFilter === 'fav' ? isFav : !!ans?.checked);
        if (!matchTab) return false;
        if (!kw) return true;
        return (q.stem + ' ' + (q.explain || '')).toLowerCase().includes(kw);
      });
      listEl.innerHTML = list.length
        ? list.map((q, i) => renderQuestionCard(q, i + 1, {})).join('')
        : `<div class="kp-card" style="text-align:center;color:var(--text-muted);padding:28px 16px">当前分类暂无题目，去「刷题」挑战吧！</div>`;
      if (list.length) bindQuestionCardEvents(listEl, { onAfterCheck: paintList });
    };

    paintList();
    host.querySelectorAll('[data-nbf]').forEach(b => b.onclick = () => {
      state.nbFilter = b.dataset.nbf;
      host.querySelectorAll('[data-nbf]').forEach(x => x.classList.toggle('active', x.dataset.nbf === state.nbFilter));
      paintList();
    });
    document.getElementById('m-nb-search').oninput = (e) => {
      state.nbSearch = e.target.value;
      paintList();
    };
  }

  /* -------------------- VIEW SWITCHER & BOOTSTRAP -------------------- */
  function switchView(viewId) {
    state.activeView = viewId;
    document.querySelectorAll('.m-view').forEach(v => v.classList.toggle('active', v.id === `m-view-${viewId}`));
    document.querySelectorAll('.m-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
    if (viewId === 'knowledge') renderKnowledgeView();
    else if (viewId === 'practice') renderPracticeView();
    else if (viewId === 'mastery') renderMasteryView();
    else if (viewId === 'notebook') renderNotebookView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function init() {
    applyTheme(state.theme);
    const brandImg = document.getElementById('m-brand-img');
    if (brandImg && MASCOTS.happy) brandImg.src = MASCOTS.happy;

    document.getElementById('m-theme-toggle')?.addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
    document.getElementById('m-switch-pc')?.addEventListener('click', () => {
      try { sessionStorage.setItem('prefer_pc', '1'); } catch {}
      if (location.protocol === 'file:') location.href = './实时人工智能应用_期末复习与题库.html?view=pc';
      else location.href = 'index.html?view=pc';
    });

    document.querySelectorAll('.m-tab-btn').forEach(btn => {
      btn.onclick = () => switchView(btn.dataset.view);
    });

    document.getElementById('m-drawer-mask')?.addEventListener('click', e => {
      if (e.target.id === 'm-drawer-mask') closeSectionDrawer();
    });
    document.getElementById('m-drawer-close')?.addEventListener('click', closeSectionDrawer);
    document.getElementById('m-sheet-mask')?.addEventListener('click', e => {
      if (e.target.id === 'm-sheet-mask') closeBottomSheet();
    });
    document.getElementById('m-sheet-close')?.addEventListener('click', closeBottomSheet);
    document.getElementById('lightbox-close')?.addEventListener('click', closeAnimLightbox);
    document.getElementById('anim-lightbox')?.addEventListener('click', e => {
      if (e.target.id === 'anim-lightbox') closeAnimLightbox();
    });

    updateGlobalStats();
    switchView('knowledge');
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
