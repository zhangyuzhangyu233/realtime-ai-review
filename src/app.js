/* ==========================================================================
   Realtime AI Study Platform Controller
   Features: Semantic C# Syntax Highlighting (Static + Live Editable Editor),
             Hands-On Manual C# Coding Drills, Single-Question Pagination,
             Modern Spotlight 3D Parallax Mastery Cards, Photo-Lightbox Zoom
   ========================================================================== */
(function() {
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
  const normCS = window.normCSharpCode || (s => s);

  const STORE_KEY = 'realtime_ai_exam_prep_v4';
  const state = loadState();

  function loadState() {
    const defaultExpanded = Object.fromEntries((MODULES || []).map(m => [m.id, true]));
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
        activeModule: 'm1',
        activeSection: firstSec,
        expandedMods: defaultExpanded,
        practiceSub: 'bank',      // 'bank' (无限随机刷题·含编程) | 'mock' (100分模拟)
        focusScope: null,         // optional { mod, topic, codingOnly, label }
        practiceHistory: [],      // unbounded infinite stream of drawn question/drill instances
        practiceIdx: 0,           // current index in practiceHistory
        practiceSeq: 0,           // monotonic counter for unique instance IDs
        curveLevel: 1.4,          // live adaptive difficulty target (1.0 .. 4.0)
        cardFlipped: false,       // 3D flip summary card state
        mockPageIdx: 0,           // 1 mock question per page index
        streak: 0,
        mockExam: null
      };
    } catch {
      return {
        answers: {}, favorites: {}, studiedMods: {}, studiedSections: {}, ranDemos: {}, passedDrills: {}, drillDrafts: {},
        theme: 'light', activeView: 'knowledge', activeModule: 'm1', activeSection: firstSec, expandedMods: defaultExpanded,
        practiceSub: 'bank', focusScope: null, practiceHistory: [], practiceIdx: 0, practiceSeq: 0,
        curveLevel: 1.4, cardFlipped: false,
        mockPageIdx: 0, streak: 0, mockExam: null
      };
    }
  }

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

  const MANTRAS = [
    { mood: 'teach', text: '必背口诀：FSM 四要素严格按序 → 状态、初始状态、输入、转换。' },
    { mood: 'search', text: 'A* 格内记法：左上 f(总)、左下 g(实际)、右下 h(预估)；直走 10 斜走 14。' },
    { mood: 'cheer', text: '碰撞反射秒杀：撞水平边栏改 y，撞竖直墙改 x，撞斜面用 vi + 2(-vi·N\')N\'。' },
    { mood: 'code', text: 'DoPattern 7 空必背：%360、+=360、(Cos,Sin)、pos+disp、%=Count、0、=pos。' },
    { mood: 'search', text: '八方向沿墙走：左手 (dir-2+8)%8 顺时针，右手 (dir+2)%8 逆时针。' },
    { mood: 'teach', text: 'BFS 逐层扩散用【队列】，无权图必最短；DFS 一路走到黑用【栈】。' },
    { mood: 'think', text: '易错预警：TileMap 像素中心别忘了 +32！x = col*64+32, y = row*64+32。' },
    { mood: 'trophy', text: 'Boids 三大法则：分离避碰撞、对齐(队列)跟均速、聚集向质心。' },
    { mood: 'exam', text: '行为树秒杀：叶节点=条件+行为，顺序节点遇 Running 续跑不中断，并行才可中断。' },
    { mood: 'sleepy', text: '熬夜刷题记得开启深海暗夜模式保护眼睛，大肥鱼陪你稳拿高分。' }
  ];
  let mantraIdx = 0;

  function escapeHTML(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* -------------------- Layered Syntax-Colored Code Editor Helper -------------------- */
  function buildLineNumbers(code) {
    const cnt = Math.max(1, String(code || '').split('\n').length);
    return Array.from({ length: cnt }, (_, i) => i + 1).join('\n');
  }

  function buildIdeEditorHTML(code, extraCls = '', heightPx = 280, isDisabled = false) {
    return `
      <div class="ide-shell ${extraCls}" style="height:${heightPx}px">
        <div class="ide-gutter" aria-hidden="true">${buildLineNumbers(code)}</div>
        <div class="ide-layers">
          <pre class="ide-pre"><code>${hlCS(code)}</code></pre>
          <textarea class="ide-ta" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" ${isDisabled ? 'disabled readonly' : ''}>${escapeHTML(code)}</textarea>
        </div>
      </div>`;
  }

  function bindIdeEditors(rootEl, onChangeCb) {
    rootEl.querySelectorAll('.ide-shell').forEach(shell => {
      if (shell.dataset.ideBound) return;
      shell.dataset.ideBound = '1';
      const gutter = shell.querySelector('.ide-gutter');
      const pre = shell.querySelector('.ide-pre');
      const codeEl = pre.querySelector('code');
      const ta = shell.querySelector('.ide-ta');

      const sync = () => {
        codeEl.innerHTML = hlCS(ta.value);
        gutter.textContent = buildLineNumbers(ta.value);
        pre.scrollTop = ta.scrollTop;
        pre.scrollLeft = ta.scrollLeft;
        gutter.scrollTop = ta.scrollTop;
        if (onChangeCb) onChangeCb(ta.value, shell);
      };

      ta.addEventListener('input', sync);
      ta.addEventListener('scroll', () => {
        pre.scrollTop = ta.scrollTop;
        pre.scrollLeft = ta.scrollLeft;
        gutter.scrollTop = ta.scrollTop;
      });
      ta.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const s = ta.selectionStart, end = ta.selectionEnd;
          ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(end);
          ta.selectionStart = ta.selectionEnd = s + 4;
          sync();
        }
      });
      shell._setCode = (val) => { ta.value = val; sync(); };
      shell._getCode = () => ta.value;
    });
  }

  /* -------------------- Context-Aware dsh-pet Companion -------------------- */
  function buildPetContext() {
    const view = state.activeView || 'knowledge';
    const sec = SECTIONS.find(s => s.id === state.activeSection) || SECTIONS[0];
    const activeSectionPct = sec ? computeTopicMastery(sec.id).pct : 0;

    let practiceItem = null;
    if (view === 'practice' && state.practiceSub !== 'mock' && state.practiceHistory.length) {
      const inst = state.practiceHistory[Math.min(Math.max(0, state.practiceIdx), state.practiceHistory.length - 1)];
      if (inst) {
        if (inst.kind === 'drill') {
          const drill = DRILLS.find(x => x.id === inst.refId) || null;
          practiceItem = {
            kind: 'drill', uid: inst.uid, refId: inst.refId, isCoding: true, drill,
            answered: !!(inst.ans && inst.ans.checked),
            correct: !!(inst.ans && inst.ans.correct),
            evalReport: inst.ans ? inst.ans.evalReport : null
          };
        } else {
          const question = BANK.find(x => x.id === inst.refId) || null;
          practiceItem = {
            kind: 'question', uid: inst.uid, refId: inst.refId, isCoding: question ? question.type === 'code' : false, question,
            answered: !!(inst.ans && inst.ans.checked),
            correct: !!(inst.ans && inst.ans.correct),
            userVal: inst.ans ? inst.ans.userVal : null,
            evalReport: inst.ans ? inst.ans.evalReport : null
          };
        }
      }
    }

    let mockQuestion = null, mockIndex = 0, mockTotal = 0, mockDoneCount = 0, mockSubmitted = false, mockRemainText = '', mockScorePct = 0;
    if (state.mockExam && Array.isArray(state.mockExam.items) && state.mockExam.items.length) {
      const me = state.mockExam;
      mockTotal = me.items.length;
      mockIndex = Math.min(Math.max(0, state.mockPageIdx || 0), me.items.length - 1);
      mockQuestion = me.items[mockIndex] ? me.items[mockIndex].q : null;
      mockSubmitted = !!me.submitted;
      const mm = String(Math.floor((me.remainSec || 0) / 60)).padStart(2, '0');
      const ss = String((me.remainSec || 0) % 60).padStart(2, '0');
      mockRemainText = `${mm}:${ss}`;
      mockDoneCount = Object.keys(me.userAnswers || {}).filter(k => {
        const v = me.userAnswers[k];
        if (Array.isArray(v)) return v.some(s => String(s).trim().length > 0);
        if (v && typeof v === 'object') return Boolean((v.diagram?.nodes?.length > 0) || (v.diagram?.path?.length > 1) || String(v.text || '').trim().length > 0);
        return v !== undefined && v !== null && String(v).trim().length > 0;
      }).length;
      if (me.submitted && typeof computeMockScore === 'function') {
        const sc = computeMockScore(me);
        mockScorePct = sc.grandTotal ? Math.round((sc.totalScore / sc.grandTotal) * 100) : 0;
      }
    }

    const topicRanks = TOPICS.map(tp => ({ id: tp.id, name: tp.name, pct: computeTopicMastery(tp.id).pct })).sort((a, b) => a.pct - b.pct);
    const ov = computeOverallMastery();

    const wrongQs = BANK.filter(q => state.answers[q.id]?.checked && !state.answers[q.id]?.correct);
    const wrongByTopic = {};
    wrongQs.forEach(q => { wrongByTopic[q.topic] = (wrongByTopic[q.topic] || 0) + 1; });
    const topWrongEntry = Object.entries(wrongByTopic).sort((a, b) => b[1] - a[1])[0] || null;
    const topWrongTopicName = topWrongEntry ? (TOPIC_NAME[topWrongEntry[0]] || topWrongEntry[0]) : '';
    const favCount = Object.keys(state.favorites).filter(id => state.favorites[id]).length;

    return {
      view,
      practiceSub: state.practiceSub || 'bank',
      activeSection: state.activeSection,
      activeSectionObj: sec,
      activeSectionPct,
      practiceItem,
      mockQuestion,
      mockIndex,
      mockTotal,
      mockDoneCount,
      mockSubmitted,
      mockRemainText,
      mockScorePct,
      topicSummaries: TOPIC_SUMMARIES,
      masterySummary: { overall: ov.avg, weakest: topicRanks.slice(0, 2) },
      notebookSummary: { wrongCount: wrongQs.length, favCount, topWrongTopicName }
    };
  }

  function setCompanion(mood, text, autoHideMs = 4800) {
    if (window.DshPetAssistant && typeof window.DshPetAssistant.react === 'function') {
      window.DshPetAssistant.react(mood, text, autoHideMs);
    }
  }

  /* -------------------- Theme & Ocean Particles -------------------- */
  function applyTheme(t) {
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? '冰海浅色' : '深海护眼';
    saveState();
    if (window.DshPetAssistant) window.DshPetAssistant.onContextChanged({ keepBubble: true });
  }

  function spawnOceanBubbles() {
    const host = document.querySelector('.ocean-particles');
    if (!host) return;
    host.innerHTML = '';
    for (let i = 0; i < 14; i++) {
      const el = document.createElement('span');
      el.className = 'ocean-bubble';
      const sz = 10 + Math.random() * 24;
      el.style.width = sz + 'px'; el.style.height = sz + 'px';
      el.style.left = (Math.random() * 98) + '%';
      el.style.animationDuration = (12 + Math.random() * 14) + 's';
      el.style.animationDelay = (-Math.random() * 18) + 's';
      host.appendChild(el);
    }
  }

  /* ========================================================================
     60FPS CURSOR-ANCHORED HIGH-IMPACT FIREWORKS CELEBRATION ENGINE (礼花绽放)
     ======================================================================== */
  function getEventOrigin(e, fallbackEl) {
    if (e && typeof e.clientX === 'number' && (e.clientX > 0 || e.clientY > 0)) {
      return { x: e.clientX, y: e.clientY };
    }
    if (fallbackEl && fallbackEl.getBoundingClientRect) {
      const r = fallbackEl.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return { x: window.innerWidth * 0.45, y: window.innerHeight * 0.42 };
  }

  const FireworksFX = (() => {
    let cvs = null, ctx = null, rafId = null;
    let particles = [], rockets = [], rings = [], flashes = [];
    const PALETTE = [
      '#ff2d55', '#ff9500', '#facc15', '#10b981',
      '#0ea5e9', '#6366f1', '#d946ef', '#06b6d4', '#f43f5e', '#2563eb'
    ];

    function ensureCanvas() {
      if (!cvs) {
        cvs = document.getElementById('fx-fireworks-canvas');
        if (!cvs) {
          cvs = document.createElement('canvas');
          cvs.id = 'fx-fireworks-canvas';
          document.body.appendChild(cvs);
        }
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

    function drawFourPointStar(c, x, y, r, rot) {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r : r * 0.34;
        const a = (i * Math.PI) / 4;
        if (i === 0) c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    function spawnBurst(cx, cy, scale = 1) {
      const mainColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const accentColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const goldColor = '#facc15';

      // Instant radial core flash at burst point
      flashes.push({ x: cx, y: cy, maxR: 105 * scale, color: mainColor, life: 1 });

      // Triple concentric shockwave rings for punchy visual clarity
      rings.push({ x: cx, y: cy, r: 8, maxR: 158 * scale, color: mainColor, lw: 5.4, life: 1 });
      rings.push({ x: cx, y: cy, r: 4, maxR: 108 * scale, color: goldColor, lw: 3.8, life: 1 });
      rings.push({ x: cx, y: cy, r: 2, maxR: 66 * scale,  color: accentColor, lw: 2.8, life: 1 });

      // Dense two-ring radial chrysanthemum comet sparks with multi-point trails
      const sparkCnt = Math.round(68 * scale);
      for (let i = 0; i < sparkCnt; i++) {
        const isOuter = i % 2 === 0;
        const angle = (Math.PI * 2 * i) / sparkCnt + (Math.random() - 0.5) * 0.12;
        const speed = (isOuter ? (8.2 + Math.random() * 7.8) : (4.0 + Math.random() * 4.4)) * scale;
        const col = i % 3 === 0 ? accentColor : (i % 4 === 0 ? goldColor : mainColor);
        particles.push({
          kind: 'spark',
          x: cx, y: cy,
          trail: [{ x: cx, y: cy }],
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (isOuter ? 2.2 : 1.0),
          drag: isOuter ? 0.928 : 0.942,
          grav: 0.14 + Math.random() * 0.05,
          size: (isOuter ? 4.4 : 3.4) + Math.random() * 2.2,
          color: col,
          life: 1,
          decay: 0.011 + Math.random() * 0.008,
          twinkle: Math.random() * Math.PI * 2
        });
      }

      // Bold spinning 4-point sparkle stars
      const starCnt = Math.round(18 * scale);
      for (let i = 0; i < starCnt; i++) {
        const angle = (Math.PI * 2 * i) / starCnt + Math.random() * 0.3;
        const speed = (5.2 + Math.random() * 7.5) * scale;
        particles.push({
          kind: 'star',
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.6,
          drag: 0.945,
          grav: 0.12,
          size: (8.5 + Math.random() * 6.0) * scale,
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.24,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          life: 1,
          decay: 0.012 + Math.random() * 0.007
        });
      }

      // Large, vivid, high-contrast fluttering confetti streamers erupting upward
      const ribCnt = Math.round(42 * scale);
      for (let i = 0; i < ribCnt; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.65;
        const speed = (5.0 + Math.random() * 10.5) * scale;
        particles.push({
          kind: 'ribbon',
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.8,
          drag: 0.962,
          grav: 0.18 + Math.random() * 0.06,
          w: 11 + Math.random() * 6,
          h: 6 + Math.random() * 3.5,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.30,
          tilt: Math.random() * Math.PI * 2,
          vTilt: 0.16 + Math.random() * 0.16,
          sway: Math.random() * Math.PI * 2,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          life: 1,
          decay: 0.0072 + Math.random() * 0.0045
        });
      }
    }

    function launchRocket(startX, startY, targetX, targetY, scale = 1) {
      const frames = 15 + Math.floor(Math.random() * 7);
      rockets.push({
        x: startX, y: startY,
        sx: startX, sy: startY,
        tx: targetX, ty: targetY,
        t: 0, dur: frames,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        scale,
        trail: []
      });
    }

    function tick() {
      const { w, h } = ensureCanvas();
      ctx.clearRect(0, 0, w, h);

      // 0. Core impact radial flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const fl = flashes[i];
        fl.life -= 0.072;
        if (fl.life <= 0) { flashes.splice(i, 1); continue; }
        const rad = fl.maxR * (1 - Math.pow(fl.life, 2) * 0.65);
        const grad = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, rad);
        grad.addColorStop(0, `rgba(255, 255, 255, ${(fl.life * 0.92).toFixed(3)})`);
        grad.addColorStop(0.35, `rgba(250, 204, 21, ${(fl.life * 0.55).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 1. Rising secondary firework shells shooting outward from the click origin
      for (let i = rockets.length - 1; i >= 0; i--) {
        const rk = rockets[i];
        rk.t++;
        const u = Math.min(1, rk.t / rk.dur);
        const ease = 1 - Math.pow(1 - u, 3);
        rk.x = rk.sx + (rk.tx - rk.sx) * ease;
        rk.y = rk.sy + (rk.ty - rk.sy) * ease - Math.sin(u * Math.PI) * 32;
        rk.trail.push({ x: rk.x, y: rk.y });
        if (rk.trail.length > 10) rk.trail.shift();

        ctx.save();
        for (let k = 1; k < rk.trail.length; k++) {
          ctx.beginPath();
          ctx.moveTo(rk.trail[k - 1].x, rk.trail[k - 1].y);
          ctx.lineTo(rk.trail[k].x, rk.trail[k].y);
          ctx.strokeStyle = rk.color;
          ctx.globalAlpha = (k / rk.trail.length) * 0.9;
          ctx.lineWidth = (k / rk.trail.length) * 5.2;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = rk.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rk.x, rk.y, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (u >= 1) {
          spawnBurst(rk.tx, rk.ty, rk.scale);
          rockets.splice(i, 1);
        }
      }

      // 2. Bold expanding shockwave rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i];
        rg.life -= 0.036;
        if (rg.life <= 0) { rings.splice(i, 1); continue; }
        const ease = 1 - Math.pow(rg.life, 3);
        const rad = rg.r + (rg.maxR - rg.r) * ease;
        ctx.save();
        ctx.beginPath();
        ctx.arc(rg.x, rg.y, rad, 0, Math.PI * 2);
        ctx.strokeStyle = rg.color;
        ctx.globalAlpha = Math.min(1, rg.life * 0.88);
        ctx.lineWidth = Math.max(0.8, (rg.lw || 4) * rg.life);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Comet Sparks, Spinning 4-Point Stars & Bold Confetti Streamers
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        if (p.kind === 'spark') {
          p.vx *= p.drag; p.vy *= p.drag; p.vy += p.grav;
          p.x += p.vx; p.y += p.vy;
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 6) p.trail.shift();
          p.twinkle += 0.38;
          const alpha = Math.max(0, Math.min(1, p.life * 1.15 * (0.78 + 0.22 * Math.sin(p.twinkle))));

          ctx.save();
          ctx.lineCap = 'round';
          for (let k = 1; k < p.trail.length; k++) {
            const frac = k / p.trail.length;
            ctx.globalAlpha = alpha * frac * 0.92;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * frac * (0.55 + 0.55 * p.life);
            ctx.beginPath();
            ctx.moveTo(p.trail[k - 1].x, p.trail[k - 1].y);
            ctx.lineTo(p.trail[k].x, p.trail[k].y);
            ctx.stroke();
          }
          // Bright luminous head
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.2, p.size * 0.52 * p.life), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else if (p.kind === 'star') {
          p.vx *= p.drag; p.vy *= p.drag; p.vy += p.grav;
          p.x += p.vx; p.y += p.vy;
          p.rot += p.vRot;
          ctx.save();
          ctx.globalAlpha = Math.min(1, p.life * 1.25);
          ctx.fillStyle = p.color;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.lineWidth = 1.3;
          drawFourPointStar(ctx, p.x, p.y, p.size * (0.45 + 0.55 * p.life), p.rot);
          ctx.restore();
        } else {
          p.vx *= p.drag; p.vy *= p.drag; p.vy += p.grav;
          p.sway += 0.13;
          p.x += p.vx + Math.sin(p.sway) * 0.9;
          p.y += p.vy;
          p.rot += p.vRot;
          p.tilt += p.vTilt;
          ctx.save();
          ctx.globalAlpha = Math.min(1, p.life * 1.4);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.tilt));
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.lineWidth = 0.9;
          ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (particles.length || rockets.length || rings.length || flashes.length) {
        rafId = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, w, h);
        rafId = null;
      }
    }

    function launch(intensity = 1, origin = null) {
      const { w, h } = ensureCanvas();
      const clampX = x => Math.max(70, Math.min(w - 70, x));
      const clampY = y => Math.max(70, Math.min(h - 70, y));
      const ox = origin && typeof origin.x === 'number' ? clampX(origin.x) : w * 0.44;
      const oy = origin && typeof origin.y === 'number' ? clampY(origin.y) : h * 0.42;

      // 1. IMMEDIATE massive signature firework burst directly at the mouse click coordinate!
      spawnBurst(ox, oy, intensity >= 2 ? 1.25 : 1.08);

      // 2. Clustered secondary mini-shells shooting out from the click point into surrounding sky
      const offsets = intensity >= 2
        ? [[-165, -125], [175, -115], [-90, -185], [115, -175]]
        : [[-145, -115], [155, -105]];
      offsets.forEach(([dx, dy], i) => {
        setTimeout(() => {
          const tx = clampX(ox + dx + (Math.random() - 0.5) * 44);
          const ty = clampY(oy + dy + (Math.random() - 0.5) * 36);
          launchRocket(ox, oy, tx, ty, intensity >= 2 ? 0.95 : 0.82);
          if (!rafId) rafId = requestAnimationFrame(tick);
        }, 105 + i * 145);
      });

      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    return { launch };
  })();

  function launchFireworks(intensity = 1, origin = null) {
    FireworksFX.launch(intensity, origin);
  }

  /* ========================================================================
     16-TOPIC KNOWLEDGE SUMMARY DECK FOR THE 3D FLIP CARD
     ======================================================================== */
  const TOPIC_SUMMARIES = {
    t_unity: {
      mascot: 'teach',
      keywords: ['左手坐标系', 'Transform', 'DeltaTime', 'Vector3'],
      formula: 'pos += dir.normalized * speed * Time.deltaTime;',
      points: [
        '<strong>Unity 坐标系</strong>：左手坐标系（+X右、+Y上、+Z前），旋转顺时针为正。',
        '<strong>四大常用类</strong>：Transform(位姿层级)、Input(输入)、Time(deltaTime 帧率无关)、Mathf/Vector。',
        '<strong>Update vs FixedUpdate</strong>：输入与渲染逻辑放 Update；刚体物理力计算放 FixedUpdate。'
      ],
      trap: '漏乘 Time.deltaTime 会导致不同帧率电脑上角色移动速度不一致！',
      snippet: 'float h = Input.GetAxis("Horizontal");\ntransform.Translate(Vector3.right * h * speed * Time.deltaTime);'
    },
    t_kinematics: {
      mascot: 'think',
      keywords: ['向量点积', '运动学5方程', '抛物线独立性', '摩擦力'],
      formula: 's = v0*t + 0.5*a*t^2  |  v^2 - v0^2 = 2*a*s',
      points: [
        '<strong>点积判断夹角</strong>：a·b > 0 锐角(前方)，= 0 垂直，< 0 钝角(后方)；投影长度 = a·b/|b|。',
        '<strong>抛物运动分解</strong>：水平匀速 x=v0x*t，竖直匀变速 y=v0y*t - 0.5*g*t²，两方向互不干扰。',
        '<strong>静/动摩擦力</strong>：F_f = μN，始终与相对运动趋势方向相反。'
      ],
      trap: '求速度改变量或高度时，切勿把初速度与加速度正负号写反（竖直向上为正时 g 取负）。',
      snippet: 'float dot = Vector2.Dot(a, b);\nfloat s = v0 * t + 0.5f * a * t * t;'
    },
    t_mechanics: {
      mascot: 'code',
      keywords: ['F=ma', '斜推力做功', '动量守恒', '斜面碰撞反射'],
      formula: "v_f = v_i + 2 * (-v_i · N') * N'",
      points: [
        '<strong>斜推力做功</strong>：W = F · s · cos(θ)，只有沿位移方向的分力做功（垂直分力做功为 0）。',
        '<strong>轴平行碰撞</strong>：撞水平边栏改 vy = -vy；撞竖直墙改 vx = -vx。',
        '<strong>非轴平行斜面</strong>：先将法向量归一化得 N\'，再用反射公式计算反弹速度。'
      ],
      trap: '斜推马车或篮球撞墙编程题，先确认撞的是水平边界(改y)还是竖直边界(改x)！',
      snippet: 'Vector2 n = wallNormal.normalized;\nvel = vel + 2f * Vector2.Dot(-vel, n) * n;'
    },
    t_steering: {
      mascot: 'cheer',
      keywords: ['智能体闭环', 'Seek/Flee', 'Arrive减速', '操控力'],
      formula: 'steering = desiredVel - curVel;  // 截断至 maxForce',
      points: [
        '<strong>智能体 vs 对象</strong>：对象被动等待调用；智能体主动执行「感知→行为选择→操控→移动」。',
        '<strong>Seek / Flee</strong>：期望速度指向(或远离)目标并取满速，操控力 = 期望速度 - 当前速度。',
        '<strong>Arrive 抵达</strong>：进入减速半径 R 后，目标速率按 (dist / R) * maxSpeed 线性衰减至 0。'
      ],
      trap: 'Arrive 不是瞬间刹车，而是距离小于 slowingRadius 时按比例缩小期望速度。',
      snippet: 'Vector2 desired = (target - pos).normalized * maxSpeed;\nVector2 steer = Vector2.ClampMagnitude(desired - vel, maxForce);'
    },
    t_intercept: {
      mascot: 'search',
      keywords: ['基本追逐', '视线追逐', '预判拦截', '闭合速度Vc'],
      formula: 'Vr = Vt - Vp;  tc = |Sr| / |Vr|;  St = Pt + Vt * tc',
      points: [
        '<strong>追逐局限</strong>：基本追逐/视线追逐永远朝猎物当前位置走，容易被甩在身后形成弧线。',
        '<strong>拦截 6 步法</strong>：①相对速度 Vr → ②相对距离 Sr → ③闭合时间 tc → ④预测点 St → ⑤求方向 → ⑥施力。',
        '<strong>核心优势</strong>：拦截器直奔猎物未来会到达的预测点 St，路径最短且无追尾滞后。'
      ],
      trap: '当相对速度 |Vr| ≈ 0 时要防止除以 0；tc 应合理上限截断避免预测点飞太远。',
      snippet: 'Vector2 vr = targetVel - myVel;\nfloat tc = (targetPos - myPos).magnitude / Mathf.Max(vr.magnitude, 0.01f);\nVector2 st = targetPos + targetVel * tc;'
    },
    t_pattern: {
      mascot: 'code',
      keywords: ['控制指令法', '模式指令法', 'DoPattern 7空', '随机微扰'],
      formula: 'heading %= 360;  if(heading < 0) heading += 360;',
      points: [
        '<strong>两种实现</strong>：控制指令法(距离/步长+角度，如 DoPattern)；模式指令法(存具体偏移/坐标序列)。',
        '<strong>DoPattern 必背 7 空</strong>：%360、+=360、(Cos,Sin)、pos+disp、%=Count、0、=pos。',
        '<strong>随机化技巧</strong>：在步长或转向角加入小幅 Random.Range 扰动，打破僵硬机械感。'
      ],
      trap: 'Mathf.Cos / Mathf.Sin 接收的是【弧度】，角度必须乘 Mathf.Deg2Rad！',
      snippet: 'float rad = heading * Mathf.Deg2Rad;\nVector2 disp = new Vector2(Mathf.Cos(rad), Mathf.Sin(rad)) * step;\nnextPos = pos + disp;'
    },
    t_tilemap: {
      mascot: 'search',
      keywords: ['二维数组', '64×64 像素中心', '+32 偏移', '八方向 0~7'],
      formula: 'pixelX = col * 64 + 32;  pixelY = row * 64 + 32;',
      points: [
        '<strong>TileMap 本质</strong>：用二维数组 map[row, col] 离散化连续地图，0=通路、1=障碍。',
        '<strong>八方向顺时针编码</strong>：0=右, 1=右下, 2=下, 3=左下, 4=左, 5=左上, 6=上, 7=右上。',
        '<strong>网格↔像素转换</strong>：格子左上角乘以格宽(如64)后，求中心坐标千万别忘加半格(+32)！'
      ],
      trap: '行(row)对应 y 坐标，列(col)对应 x 坐标，千万别把 row 和 col 写颠倒！',
      snippet: 'int col = Mathf.FloorToInt(pos.x / 64f);\nint row = Mathf.FloorToInt(pos.y / 64f);\nVector2 center = new Vector2(col * 64 + 32, row * 64 + 32);'
    },
    t_avoid: {
      mascot: 'think',
      keywords: ['RandomMoving', '绕行障碍物', '死锁/震荡', '访问记录'],
      formula: '遇阻 → 切换绕障状态 → 记录已访格防死循环',
      points: [
        '<strong>随机移动寻路</strong>：无障碍时直奔目标，撞障后随机选可行邻格尝试绕出。',
        '<strong>典型缺陷</strong>：面对深凹形(U型)障碍物时极易来回震荡或陷入局部死锁。',
        '<strong>改进要点</strong>：结合已访问标记/步数回退，或直接升级为沿墙走 / A* 全局搜索。'
      ],
      trap: '单靠局部随机避障无法保证找到全局最短路径，甚至可能绕不出 U 型陷阱。',
      snippet: 'if (IsBlocked(nextCell)) {\n  dir = PickRandomWalkableDir(curCell);\n}'
    },
    t_follow_wall: {
      mascot: 'code',
      keywords: ['沿路径走', '沿墙走左右手', '路点导航', '面包屑'],
      formula: '左手顺时针: (dir-2+8)%8  |  右手逆时针: (dir+2)%8',
      points: [
        '<strong>沿路径走</strong>：在 8 邻域中计算贴合路径权重，始终选择权值最大/匹配路径的邻格前进。',
        '<strong>沿墙走法则</strong>：贴墙探测顺序决定顺/逆时针；+8 再 %8 可彻底避免负数取模 bug。',
        '<strong>路点 & 面包屑</strong>：路点靠人工预置关键转折点；面包屑由玩家走过时动态掉落供 AI 追踪。'
      ],
      trap: 'C# 中负数取模会得负值！左手公式必须写 (curDir - 2 + 8) % 8 而非 (curDir - 2) % 8。',
      snippet: 'int leftHand  = (curDir - 2 + 8) % 8;\nint rightHand = (curDir + 2) % 8;'
    },
    t_dfs_bfs: {
      mascot: 'teach',
      keywords: ['DFS 栈(FILO)', 'BFS 队列(FIFO)', 'Dijkstra', '无权最短路'],
      formula: 'DFS → Stack(后进先出)  |  BFS → Queue(先进先出)',
      points: [
        '<strong>DFS 深度优先</strong>：一条路走到黑再回溯，用栈/递归实现，内存省但【不保证最短路】。',
        '<strong>BFS 广度优先</strong>：逐层水波扩散，用队列实现，在【无权图】中首次到达终点必为最短路。',
        '<strong>Dijkstra 算法</strong>：带非负边权的最短路，每次选当前累计代价 g 最小节点扩展(等价 A* 中 h=0)。'
      ],
      trap: 'BFS 仅在边权相等(无权图)时保证最优；有不同地形代价(沼泽/山丘)必须用 Dijkstra 或 A*！',
      snippet: 'Queue<MapNode> q = new Queue<MapNode>();\nq.Enqueue(start);\nwhile (q.Count > 0) { var cur = q.Dequeue(); /* 扩展邻格 */ }'
    },
    t_astar_core: {
      mascot: 'search',
      keywords: ['f=g+h', '可采纳性 h≤h*', '直10斜14', 'Open/Close表'],
      formula: 'f(n) = g(n) + h(n)  |  曼哈顿 h = 10*(|dx|+|dy|)',
      points: [
        '<strong>格内三数记法</strong>：左上 f(总估价)、左下 g(起点已走实际代价)、右下 h(到终点启发估算)。',
        '<strong>可采纳条件</strong>：若启发函数始终满足 h(n) ≤ h*(n)(不高估真实代价)，A* 必找到最优路径。',
        '<strong>考场手算规范</strong>：直走代价 10、斜走 14；若某邻格已在 Open 表且新 g 更小，须更新其 g/f 与父指针！'
      ],
      trap: '手算 28 格/42 格时，注意题目是否允许贴墙角斜走，并务必从终点沿 Parent 逆推写出路径！',
      snippet: 'int newG = cur.g + (isDiag ? 14 : 10);\nif (newG < nb.g) { nb.g = newG; nb.f = newG + nb.h; nb.parent = cur; }'
    },
    t_astar_opt: {
      mascot: 'exam',
      keywords: ['优先队列/最小堆', '七大优化', '路径平滑', '影响力映射'],
      formula: 'OpenList 查最小 f：数组 O(N) → 二叉最小堆 O(log N)',
      points: [
        '<strong>七大经典优化</strong>：优先队列(堆)、预计算/缓存、分层寻路(HPA*)、路点/NavMesh 降维、路径平滑、分帧预算、双向搜索。',
        '<strong>影响力映射</strong>：给格子叠加敌方火力/地形危险权重到代价 g，让 AI 自动走安全掩体路线。',
        '<strong>h 权重权衡</strong>：h=0 退化为 Dijkstra(最慢最优)；h 过大退化为贪婪最佳优先(极快但不一定最优)。'
      ],
      trap: '考问「如何加速 Open 表查找最小 f 节点」→ 必答【优先队列 / 二叉最小堆】！',
      snippet: 'float cost = baseTerrainCost + enemyInfluenceMap[r, c] * dangerWeight;'
    },
    t_fsm_std: {
      mascot: 'teach',
      keywords: ['FSM四要素', '状态迁移图', '守卫/Blinky', '蚂蚁觅食'],
      formula: 'FSM 四要素(严格按序)：状态 · 初始状态 · 输入 · 转换',
      points: [
        '<strong>四要素口诀</strong>：状态集合(圆圈)、初始状态(黑点箭头)、输入条件(边上标注)、转换函数(有向边)。',
        '<strong>经典考例</strong>：守卫(巡逻/追逐/攻击/逃跑)、吃豆人 Blinky(散开/追逐/惊恐/回家)、蚂蚁(寻食/搬运/避障)。',
        '<strong>画图采分点</strong>：必须标出初始状态入口、双向转换条件，并确保状态完备无遗漏。'
      ],
      trap: '填空题考 FSM 四要素时，严格写出「状态、初始状态、输入、转换」！',
      snippet: '// 守卫状态：Patrol -> (发现玩家) -> Chase -> (进入射程) -> Attack'
    },
    t_fsm_pattern: {
      mascot: 'code',
      keywords: ['分支逻辑法', '状态模式', 'IState接口', '开闭原则'],
      formula: 'Context 持有 IState currentState;  ChangeState(newState)',
      points: [
        '<strong>分支逻辑法(switch-case)</strong>：状态少时直观简单；状态一多导致 Update 臃肿、违背开闭原则、难维护。',
        '<strong>状态模式(State Pattern)</strong>：将每个状态封装为实现 IState(Enter/Execute/Exit) 的独立类。',
        '<strong>核心优势</strong>：新增状态只需新建类，无需修改旧状态判断分支，高内聚低耦合。'
      ],
      trap: '切换状态的标准三步：① currentState?.Exit() → ② currentState = next → ③ currentState.Enter()！',
      snippet: 'public void ChangeState(IState next) {\n  current?.Exit(this); current = next; current.Enter(this);\n}'
    },
    t_bt: {
      mascot: 'exam',
      keywords: ['叶/组合/修饰节点', 'Selector/Sequence', 'Running态', 'Parallel中断'],
      formula: 'Selector(?): 遇Success停 | Sequence(→): 遇Failure停',
      points: [
        '<strong>三类节点</strong>：叶节点(条件+行为)、组合节点(选择/顺序/并行)、修饰节点(反转/重复/UntilFailure)。',
        '<strong>三大返回值</strong>：Success(成功)、Failure(失败)、Running(运行中，下帧继续)。',
        '<strong>中断机制</strong>：普通 Sequence 遇 Running 会续跑不打断；需实时条件打断时用 Parallel + 条件检测或带条件中止。'
      ],
      trap: '行为树叶节点只包含「条件节点」与「行为节点」，组合与修饰属于非叶内部节点！',
      snippet: '// Sequence: 全部 Success 才返回 Success；任一 Failure 立即返回 Failure'
    },
    t_boids: {
      mascot: 'cheer',
      keywords: ['分离 Separation', '对齐 Alignment', '聚集 Cohesion', '涌现行为'],
      formula: 'F_total = w1*F_sep + w2*F_ali + w3*F_coh',
      points: [
        '<strong>分离 (Separation)</strong>：与过近邻居产生排斥力，避免个体互相重叠碰撞。',
        '<strong>对齐 / 队列 (Alignment)</strong>：朝感知半径内邻居的平均速度方向靠拢，保持队形一致。',
        '<strong>聚集 (Cohesion)</strong>：向周边邻居的几何质心靠拢，防止群体走散，从而涌现宏大鸟群/鱼群效果。'
      ],
      trap: '三大局部简单规则无需中心指挥官即可涌现复杂群体智能；调大分离权重散开、调大聚集权重抱团！',
      snippet: 'Vector2 steer = wSep * sepForce + wAli * aliForce + wCoh * cohForce;'
    }
  };

  /* ========================================================================
     PHOTO-LIGHTBOX ZOOM MODAL FOR ALL ANIMATIONS
     ======================================================================== */
  function openAnimLightbox({ engine, mode, params = {}, title = '交互动画放大预览', modes = null }) {
    const overlay = document.getElementById('anim-lightbox');
    const body = document.getElementById('lightbox-body');
    const titleEl = document.getElementById('lightbox-title');
    if (!overlay || !body) return;
    titleEl.textContent = title;

    const modePillsHTML = modes && modes.length
      ? `<div class="anim-mode-pills">${modes.map(m => `<button class="anim-pill ${m.key === mode ? 'active' : ''}" data-mode="${m.key}">${m.label}</button>`).join('')}</div>`
      : '';

    body.innerHTML = `
      <div class="lightbox-anim-host">
        ${modePillsHTML ? `<div style="padding:10px 18px;background:var(--bg-subtle);border-bottom:1px solid var(--border)">${modePillsHTML}</div>` : ''}
        <div class="anim-stage-wrap">
          <div class="anim-canvas-box"><canvas></canvas></div>
          <div class="anim-side-panel"></div>
        </div>
        <div class="anim-controls-bar">
          <div class="ctrl-group">
            <button class="ctrl-btn primary" data-act="play">暂停</button>
            <button class="ctrl-btn" data-act="step">单步推演</button>
            <button class="ctrl-btn" data-act="reset">重置</button>
            <label class="ctrl-slider">倍速 <input type="range" min="0.4" max="2.5" step="0.1" value="1" data-act="speed"></label>
          </div>
          <div class="anim-narrator">按 ESC 或点击外部暗化区域退出放大视图</div>
        </div>
      </div>`;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      const host = body.querySelector('.lightbox-anim-host');
      window.AnimEngine.mount(host, engine, { mode, params });
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
    setTimeout(() => { if (!overlay.classList.contains('open') && body) body.innerHTML = ''; }, 340);
  }

  function attachCanvasZoomBehavior(container, meta) {
    const box = container.querySelector('.anim-canvas-box') || container.querySelector('.cs-preview-wrap');
    const canvas = container.querySelector('canvas');
    if (!box || !canvas || box.dataset.zoomWired) return;
    box.dataset.zoomWired = '1';

    let hint = box.querySelector('.canvas-zoom-hint');
    if (!hint) {
      hint = document.createElement('button');
      hint.type = 'button';
      hint.className = 'canvas-zoom-hint';
      hint.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg> 点击放大';
      box.appendChild(hint);
    }

    const triggerZoom = () => {
      const activeModeBtn = container.querySelector('.anim-pill.active');
      const curMode = activeModeBtn ? activeModeBtn.dataset.mode : meta.mode;
      openAnimLightbox({
        engine: meta.engine, mode: curMode, params: meta.params || {},
        title: meta.title || '动画全屏放大预览', modes: meta.modes || null
      });
    };

    hint.onclick = (e) => { e.stopPropagation(); triggerZoom(); };
    let downX = 0, downY = 0, downTs = 0;
    canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      downX = e.clientX; downY = e.clientY; downTs = performance.now();
    });
    canvas.addEventListener('pointerup', e => {
      if (e.button !== 0) return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6 && performance.now() - downTs < 360) triggerZoom();
    });
  }

  /* ========================================================================
     INTERACTIVE SYNTAX-COLORED UNITY C# CODE RUNNER SANDBOX
     ======================================================================== */
  function buildCodeRunnerHTML(demoIds, runnerUid, compact = false) {
    const list = (Array.isArray(demoIds) ? demoIds : [demoIds]).filter(id => DEMOS[id]);
    if (!list.length) return '';
    const first = DEMOS[list[0]];
    return `
      <div class="cs-runner-card" data-runner="${runnerUid}" data-cur-demo="${list[0]}">
        <div class="cs-runner-head">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="cs-lang-pill">C#</span>
            <strong style="font-size:13px">${compact ? 'Unity C# 示例代码运行区' : 'Unity C# 示例代码运行沙盒（语法着色 · 可改参运行）'}</strong>
            ${list.length > 1 ? `<div class="cs-tabs" style="margin-left:6px">${list.map((id, i) => `<button class="cs-tab-btn ${i === 0 ? 'active' : ''}" data-demo-tab="${id}">${DEMOS[id].file}</button>`).join('')}</div>` : `<span style="font-family:var(--font-mono);font-size:11.5px;color:#34d399;margin-left:4px">${first.file}</span>`}
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            <button class="ctrl-btn cs-reset-code-btn" style="padding:4px 10px;font-size:11.5px;background:rgba(255,255,255,0.08);color:#e2eeff;border-color:rgba(148,163,184,0.3)">还原代码</button>
            <button class="cs-run-btn" data-run-cs="${runnerUid}">▶ 运行 C# 代码查看效果</button>
          </div>
        </div>
        <div class="cs-runner-grid">
          <div class="cs-editor-pane">
            <div class="cs-editor-bar"><span class="cs-file-caption">${first.title}</span><span>Unity C# · 语法着色可编辑</span></div>
            ${buildIdeEditorHTML(first.code, 'cs-ide-box', compact ? 240 : 285)}
          </div>
          <div class="cs-output-pane">
            <div class="cs-editor-bar"><span>运行控制台输出 &amp; 实时视觉效果</span><span>点击右侧预览画面可全屏放大</span></div>
            <div class="cs-console-box"><div class="cs-console-line info">[就绪] 点击上方「运行 C# 代码查看效果」立即执行并同步渲染动态效果。</div></div>
            <div class="cs-preview-wrap">
              <canvas></canvas>
              <div class="cs-preview-placeholder">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                <span>点击运行 C# 代码，实时查看 Unity 运行效果</span>
              </div>
            </div>
          </div>
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
        saveState(); updateGlobalStats(); refreshTocMasteryTags();

        con.innerHTML = '';
        res.logs.forEach((ln, idx) => {
          setTimeout(() => {
            const div = document.createElement('div');
            div.className = `cs-console-line ${ln.t || ''}`;
            div.textContent = `> ${ln.msg}`;
            con.appendChild(div);
            con.scrollTop = con.scrollHeight;
          }, idx * 70);
        });

        if (ph) ph.style.display = 'none';
        window.AnimEngine.mount(prevWrap, res.anim.engine, { mode: res.anim.mode, params: res.anim.params || {} });
        delete prevWrap.dataset.zoomWired;
        attachCanvasZoomBehavior(prevWrap, {
          engine: res.anim.engine, mode: res.anim.mode, params: res.anim.params || {},
          title: `${d.file} — 运行效果放大视图`
        });
        setCompanion('code', `已运行 ${d.file}！可直接在左侧高亮编辑器中修改参数再次运行。`, 4500);
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
          executeCode();
        };
      });
    });
  }

  /* ========================================================================
     MODERN SPOTLIGHT 3D PARALLAX KNOWLEDGE MASTERY SYSTEM
     ======================================================================== */
  const CARD_SVGS = {
    // 6 Chapter Vivid Multi-Color Technical Diagrams (viewBox 260x120)
    m1: `<svg viewBox="0 0 260 120" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <line x1="16" y1="102" x2="244" y2="102" stroke="rgba(148,163,184,0.45)" stroke-width="1.5"/>
      <path d="M24 102 Q105 8 188 102" stroke="#38bdf8" stroke-width="2.4" stroke-dasharray="6 4"/>
      <circle cx="105" cy="55" r="8" fill="#0ea5e9" fill-opacity="0.38" stroke="#7dd3fc" stroke-width="2"/>
      <line x1="105" y1="55" x2="152" y2="55" stroke="#34d399" stroke-width="2.4"/>
      <polygon points="154,55 145,51 145,59" fill="#34d399"/>
      <line x1="105" y1="55" x2="105" y2="90" stroke="#fb7185" stroke-width="2.4"/>
      <polygon points="105,92 101,83 109,83" fill="#fb7185"/>
      <line x1="196" y1="90" x2="242" y2="58" stroke="#cbd5e1" stroke-width="3"/>
      <path d="M180 28 L218 74 L240 28" stroke="#fde047" stroke-width="2.4"/>
      <line x1="218" y1="74" x2="200" y2="48" stroke="#c084fc" stroke-width="1.8" stroke-dasharray="3 3"/>
      <text x="156" y="59" fill="#34d399" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">vx</text>
      <text x="110" y="92" fill="#fb7185" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">g</text>
      <text x="192" y="23" fill="#fde047" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">vf</text>
    </svg>`,
    m2: `<svg viewBox="0 0 260 120" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <line x1="20" y1="94" x2="196" y2="30" stroke="#fde047" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="M156 102 Q158 64 196 30" stroke="#fb923c" stroke-width="2.8"/>
      <circle cx="196" cy="30" r="14" stroke="#f43f5e" stroke-width="1.8" stroke-dasharray="3 3"/>
      <circle cx="196" cy="30" r="4.5" fill="#fb7185"/>
      <circle cx="38" cy="88" r="6" fill="#fde047"/>
      <polygon points="164,95 150,104 155,90" fill="#fb923c"/>
      <rect x="26" y="16" width="68" height="36" rx="6" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="4 3" fill="rgba(56,189,248,0.08)"/>
      <polyline points="26,34 26,16 54,16" stroke="#38bdf8" stroke-width="2.8"/>
      <text x="214" y="34" fill="#fda4af" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">St</text>
      <text x="34" y="38" fill="#7dd3fc" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Pattern</text>
    </svg>`,
    m3: `<svg viewBox="0 0 260 120" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="rgba(148,163,184,0.38)" stroke-width="1.2">
        <rect x="26" y="14" width="28" height="28" rx="4"/><rect x="58" y="14" width="28" height="28" rx="4"/>
        <rect x="90" y="14" width="28" height="28" rx="4" fill="rgba(244,63,94,0.34)" stroke="#fb7185"/>
        <rect x="122" y="14" width="28" height="28" rx="4"/><rect x="154" y="14" width="28" height="28" rx="4"/>
        <rect x="26" y="46" width="28" height="28" rx="4"/>
        <rect x="58" y="46" width="28" height="28" rx="4" fill="rgba(244,63,94,0.34)" stroke="#fb7185"/>
        <rect x="90" y="46" width="28" height="28" rx="4" fill="rgba(244,63,94,0.34)" stroke="#fb7185"/>
        <rect x="122" y="46" width="28" height="28" rx="4"/><rect x="154" y="46" width="28" height="28" rx="4"/>
        <rect x="26" y="78" width="28" height="28" rx="4"/><rect x="58" y="78" width="28" height="28" rx="4"/>
        <rect x="90" y="78" width="28" height="28" rx="4"/><rect x="122" y="78" width="28" height="28" rx="4"/>
        <rect x="154" y="78" width="28" height="28" rx="4"/>
      </g>
      <path d="M40 92 L40 28 L72 28 L72 92 L136 92 L136 28 L168 28" stroke="#34d399" stroke-width="3"/>
      <circle cx="40" cy="92" r="5" fill="#38bdf8"/>
      <circle cx="168" cy="28" r="5.5" fill="#fde047"/>
      <circle cx="222" cy="60" r="24" stroke="#22d3ee" stroke-width="1.6" stroke-dasharray="3 3"/>
      <line x1="222" y1="60" x2="244" y2="60" stroke="#fde047" stroke-width="2.4"/>
      <line x1="222" y1="60" x2="222" y2="82" stroke="#34d399" stroke-width="2.2"/>
      <text x="206" y="26" fill="#67e8f9" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">8-Dir</text>
    </svg>`,
    m4: `<svg viewBox="0 0 260 120" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <rect x="18" y="18" width="54" height="40" rx="7" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" stroke-width="1.8"/>
      <rect x="82" y="18" width="54" height="40" rx="7" fill="rgba(16,185,129,0.22)" stroke="#34d399" stroke-width="2"/>
      <rect x="146" y="18" width="54" height="40" rx="7" fill="rgba(244,63,94,0.24)" stroke="#fb7185" stroke-width="1.6"/>
      <rect x="82" y="66" width="54" height="40" rx="7" fill="rgba(192,132,252,0.22)" stroke="#c084fc" stroke-width="2"/>
      <rect x="146" y="66" width="54" height="40" rx="7" fill="rgba(250,204,21,0.22)" stroke="#fde047" stroke-width="2.2"/>
      <path d="M45 38 L109 38 L109 86 L173 86" stroke="#fde047" stroke-width="3"/>
      <circle cx="173" cy="86" r="5" fill="#fde047"/>
      <text x="24" y="34" fill="#7dd3fc" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Start</text>
      <text x="88" y="32" fill="#fde047" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">f=44</text>
      <text x="88" y="52" fill="#67e8f9" font-size="9" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif">14  30</text>
      <text x="152" y="80" fill="#fde047" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">f=52</text>
      <text x="152" y="100" fill="#a7f3d0" font-size="9" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif">Goal</text>
      <text x="208" y="42" fill="#c084fc" font-size="11" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">A*</text>
      <text x="206" y="58" fill="#94a3b8" font-size="9" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif">f=g+h</text>
    </svg>`,
    m5: `<svg viewBox="0 0 260 120" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="22" cy="54" r="5" fill="#fde047"/>
      <line x1="27" y1="54" x2="48" y2="54" stroke="#fde047" stroke-width="2.2"/>
      <circle cx="76" cy="54" r="24" fill="rgba(56,189,248,0.20)" stroke="#38bdf8" stroke-width="2.2"/>
      <circle cx="176" cy="36" r="22" fill="rgba(251,113,133,0.22)" stroke="#fb7185" stroke-width="2.2"/>
      <circle cx="176" cy="90" r="21" fill="rgba(52,211,153,0.20)" stroke="#34d399" stroke-width="2.2"/>
      <path d="M98 42 Q126 20 152 30" stroke="#fb7185" stroke-width="2.2"/>
      <path d="M154 46 Q128 58 100 54" stroke="#7dd3fc" stroke-width="1.8" stroke-dasharray="4 3"/>
      <path d="M176 58 L176 68" stroke="#fde047" stroke-width="2.2"/>
      <path d="M154 90 Q114 96 86 76" stroke="#34d399" stroke-width="2"/>
      <text x="58" y="58" fill="#e0f2fe" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Patrol</text>
      <text x="159" y="40" fill="#ffe4e6" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Chase</text>
      <text x="160" y="94" fill="#d1fae5" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Flee</text>
    </svg>`,
    m6: `<svg viewBox="0 0 260 120" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <rect x="64" y="10" width="54" height="22" rx="6" fill="rgba(56,189,248,0.24)" stroke="#38bdf8" stroke-width="2"/>
      <rect x="18" y="48" width="50" height="22" rx="6" fill="rgba(251,191,36,0.22)" stroke="#fbbf24" stroke-width="2"/>
      <rect x="108" y="48" width="50" height="22" rx="6" fill="rgba(192,132,252,0.22)" stroke="#c084fc" stroke-width="2"/>
      <rect x="10" y="88" width="42" height="20" rx="10" fill="rgba(52,211,153,0.24)" stroke="#34d399" stroke-width="1.8"/>
      <rect x="60" y="88" width="42" height="20" rx="5" fill="rgba(251,113,133,0.24)" stroke="#fb7185" stroke-width="1.8"/>
      <line x1="91" y1="32" x2="43" y2="48" stroke="#94a3b8" stroke-width="1.8"/>
      <line x1="91" y1="32" x2="133" y2="48" stroke="#94a3b8" stroke-width="1.8"/>
      <line x1="43" y1="70" x2="31" y2="88" stroke="#34d399" stroke-width="1.8"/>
      <line x1="43" y1="70" x2="81" y2="88" stroke="#fb7185" stroke-width="1.8"/>
      <text x="77" y="25" fill="#e0f2fe" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Root</text>
      <text x="27" y="63" fill="#fef08a" font-size="9" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Seq →</text>
      <text x="119" y="63" fill="#e9d5ff" font-size="9" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Sel ?</text>
      <circle cx="212" cy="60" r="34" stroke="rgba(56,189,248,0.45)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <polygon points="222,56 204,48 208,56 204,64" fill="#38bdf8"/>
      <polygon points="238,38 223,32 226,38 223,44" fill="#34d399"/>
      <polygon points="204,80 189,74 192,80 189,86" fill="#fde047"/>
      <polygon points="236,76 221,70 224,76 221,82" fill="#f472b6"/>
    </svg>`,

    // 16 Sub-Section Vivid Multi-Color Technical Diagrams (viewBox 220x100)
    t_unity: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <line x1="82" y1="74" x2="162" y2="74" stroke="#fb7185" stroke-width="2.6"/><polygon points="165,74 155,69 155,79" fill="#fb7185"/>
      <line x1="82" y1="74" x2="82" y2="14" stroke="#34d399" stroke-width="2.6"/><polygon points="82,11 77,21 87,21" fill="#34d399"/>
      <line x1="82" y1="74" x2="42" y2="92" stroke="#38bdf8" stroke-width="2.6"/><polygon points="39,93 48,84 51,92" fill="#38bdf8"/>
      <rect x="108" y="24" width="38" height="34" rx="6" fill="rgba(56,189,248,0.22)" stroke="#7dd3fc" stroke-width="2" transform="rotate(10 127 41)"/>
      <text x="169" y="78" fill="#fb7185" font-size="11" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">+X</text>
      <text x="90" y="20" fill="#34d399" font-size="11" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">+Y</text>
      <text x="20" y="94" fill="#38bdf8" font-size="11" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">+Z</text>
    </svg>`,
    t_kinematics: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <line x1="18" y1="86" x2="202" y2="86" stroke="rgba(148,163,184,0.45)" stroke-width="1.5"/>
      <path d="M26 86 Q110 2 194 86" stroke="#22d3ee" stroke-width="2.6" stroke-dasharray="5 4"/>
      <circle cx="110" cy="44" r="8" fill="#06b6d4" fill-opacity="0.4" stroke="#67e8f9" stroke-width="2"/>
      <line x1="110" y1="44" x2="158" y2="44" stroke="#34d399" stroke-width="2.6"/><polygon points="161,44 152,40 152,48" fill="#34d399"/>
      <line x1="110" y1="44" x2="110" y2="78" stroke="#fb7185" stroke-width="2.4"/><polygon points="110,81 106,72 114,72" fill="#fb7185"/>
      <text x="164" y="48" fill="#34d399" font-size="10.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">vx</text>
      <text x="116" y="78" fill="#fb7185" font-size="10.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">g</text>
    </svg>`,
    t_mechanics: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <line x1="22" y1="86" x2="198" y2="54" stroke="#94a3b8" stroke-width="3.4"/>
      <line x1="110" y1="70" x2="98" y2="18" stroke="#c084fc" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M44 22 L110 70 L176 22" stroke="#60a5fa" stroke-width="2.8"/>
      <polygon points="178,20 167,22 173,30" fill="#fde047"/>
      <circle cx="110" cy="70" r="6" fill="#fde047"/>
      <text x="46" y="18" fill="#93c5fd" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">vi</text>
      <text x="104" y="20" fill="#d8b4fe" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">N'</text>
      <text x="180" y="26" fill="#fde047" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">vf</text>
    </svg>`,
    t_steering: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <circle cx="164" cy="40" r="28" stroke="#fb923c" stroke-width="1.8" stroke-dasharray="4 3" fill="rgba(251,146,60,0.1)"/>
      <circle cx="164" cy="40" r="6" fill="#fde047"/>
      <path d="M28 84 Q88 80 156 44" stroke="#38bdf8" stroke-width="2.8"/>
      <line x1="76" y1="74" x2="128" y2="50" stroke="#34d399" stroke-width="2.4"/>
      <polygon points="131,48 121,48 125,56" fill="#34d399"/>
      <text x="136" y="84" fill="#fdba74" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Arrive R</text>
      <text x="30" y="34" fill="#7dd3fc" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Seek/Flee</text>
    </svg>`,
    t_intercept: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <line x1="24" y1="84" x2="164" y2="26" stroke="#fde047" stroke-width="2.2" stroke-dasharray="5 4"/>
      <line x1="158" y1="88" x2="164" y2="26" stroke="#fb923c" stroke-width="2.8"/>
      <circle cx="164" cy="26" r="12" stroke="#f43f5e" stroke-width="2"/>
      <line x1="148" y1="26" x2="180" y2="26" stroke="#fb7185" stroke-width="1.6"/>
      <line x1="164" y1="10" x2="164" y2="42" stroke="#fb7185" stroke-width="1.6"/>
      <circle cx="30" cy="82" r="5" fill="#fde047"/>
      <text x="182" y="30" fill="#fda4af" font-size="11" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">St</text>
      <text x="58" y="42" fill="#fde047" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">tc=|Sr|/|Vr|</text>
    </svg>`,
    t_pattern: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="74,12 90,62 42,32 106,32 58,62" fill="rgba(251,113,133,0.22)" stroke="#fb7185" stroke-width="2.2"/>
      <rect x="122" y="18" width="76" height="58" rx="8" fill="rgba(56,189,248,0.14)" stroke="#38bdf8" stroke-width="1.8"/>
      <text x="130" y="38" fill="#fde047" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">heading%360</text>
      <text x="130" y="54" fill="#7dd3fc" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif">(Cos, Sin)</text>
      <text x="130" y="69" fill="#34d399" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif">pos + disp</text>
      <text x="42" y="88" fill="#fda4af" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">DoPattern()</text>
    </svg>`,
    t_tilemap: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <g stroke="rgba(148,163,184,0.45)" stroke-width="1.4">
        <rect x="24" y="12" width="26" height="26" rx="4"/><rect x="54" y="12" width="26" height="26" rx="4" fill="rgba(251,113,133,0.34)" stroke="#fb7185"/>
        <rect x="84" y="12" width="26" height="26" rx="4"/><rect x="24" y="42" width="26" height="26" rx="4"/>
        <rect x="54" y="42" width="26" height="26" rx="4" fill="rgba(52,211,153,0.28)" stroke="#34d399"/>
        <rect x="84" y="42" width="26" height="26" rx="4" fill="rgba(251,113,133,0.34)" stroke="#fb7185"/>
        <rect x="54" y="72" width="26" height="20" rx="4"/>
      </g>
      <circle cx="67" cy="55" r="4.5" fill="#fde047"/>
      <text x="122" y="34" fill="#34d399" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">64x64 Grid</text>
      <text x="122" y="52" fill="#fde047" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">x = c*64+32</text>
      <text x="122" y="70" fill="#7dd3fc" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">y = r*64+32</text>
    </svg>`,
    t_avoid: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <rect x="88" y="30" width="44" height="52" rx="7" fill="rgba(244,63,94,0.30)" stroke="#fb7185" stroke-width="2"/>
      <path d="M22 58 L72 58 L72 16 L148 16 L148 58 L194 58" stroke="#22d3ee" stroke-width="2.8"/>
      <circle cx="22" cy="58" r="5" fill="#34d399"/>
      <circle cx="194" cy="58" r="5.5" fill="#fde047"/>
      <text x="95" y="60" fill="#ffe4e6" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">WALL</text>
    </svg>`,
    t_follow_wall: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <circle cx="72" cy="50" r="34" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="4 3"/>
      <line x1="72" y1="50" x2="112" y2="50" stroke="#fde047" stroke-width="2.8"/>
      <line x1="72" y1="50" x2="72" y2="86" stroke="#34d399" stroke-width="2.4"/>
      <line x1="72" y1="50" x2="72" y2="14" stroke="#fb7185" stroke-width="2.4"/>
      <circle cx="72" cy="50" r="5.5" fill="#ffffff"/>
      <text x="120" y="34" fill="#fb7185" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">L:(d-2+8)%8</text>
      <text x="120" y="54" fill="#fde047" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">dir 0..7</text>
      <text x="120" y="74" fill="#34d399" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">R:(d+2)%8</text>
    </svg>`,
    t_dfs_bfs: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <circle cx="72" cy="50" r="12" fill="rgba(192,132,252,0.28)" stroke="#c084fc" stroke-width="2"/>
      <circle cx="72" cy="50" r="25" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="4 3"/>
      <circle cx="72" cy="50" r="39" stroke="#34d399" stroke-width="1.6" stroke-dasharray="5 4"/>
      <circle cx="72" cy="50" r="4.5" fill="#fde047"/>
      <text x="124" y="34" fill="#c084fc" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">DFS: Stack</text>
      <text x="124" y="54" fill="#38bdf8" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">BFS: Queue</text>
      <text x="124" y="74" fill="#34d399" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Dijkstra</text>
    </svg>`,
    t_astar_core: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <rect x="24" y="14" width="90" height="72" rx="10" fill="rgba(96,165,250,0.22)" stroke="#60a5fa" stroke-width="2.2"/>
      <text x="34" y="34" fill="#fde047" font-size="13" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">f = 44</text>
      <text x="34" y="74" fill="#38bdf8" font-size="11" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">g=14</text>
      <text x="74" y="74" fill="#fb7185" font-size="11" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">h=30</text>
      <text x="128" y="34" fill="#34d399" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">h &lt;= h*</text>
      <text x="128" y="54" fill="#e0f2fe" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif">直 10 / 斜 14</text>
      <text x="128" y="74" fill="#fde047" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Open / Close</text>
    </svg>`,
    t_astar_opt: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <polygon points="74,12 120,86 28,86" fill="rgba(251,113,133,0.16)" stroke="#fb7185" stroke-width="1.8"/>
      <circle cx="74" cy="30" r="8" fill="#fde047"/>
      <circle cx="54" cy="64" r="7" fill="#38bdf8"/>
      <circle cx="94" cy="64" r="7" fill="#34d399"/>
      <line x1="74" y1="38" x2="54" y2="57" stroke="#e2e8f0" stroke-width="2"/>
      <line x1="74" y1="38" x2="94" y2="57" stroke="#e2e8f0" stroke-width="2"/>
      <text x="128" y="34" fill="#fde047" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Min-Heap</text>
      <text x="128" y="54" fill="#7dd3fc" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">O(log N)</text>
      <text x="128" y="74" fill="#fda4af" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">InfluenceMap</text>
    </svg>`,
    t_fsm_std: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <circle cx="22" cy="50" r="4.5" fill="#fde047"/><line x1="27" y1="50" x2="46" y2="50" stroke="#fde047" stroke-width="2"/>
      <circle cx="70" cy="50" r="22" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" stroke-width="2.2"/>
      <circle cx="166" cy="50" r="22" fill="rgba(251,113,133,0.22)" stroke="#fb7185" stroke-width="2.2"/>
      <path d="M90 36 Q118 14 146 36" stroke="#fde047" stroke-width="2.2"/>
      <path d="M146 64 Q118 86 90 64" stroke="#34d399" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="58" y="54" fill="#e0f2fe" font-size="10.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">S0</text>
      <text x="155" y="54" fill="#ffe4e6" font-size="10.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">S1</text>
    </svg>`,
    t_fsm_pattern: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <rect x="64" y="10" width="92" height="24" rx="6" fill="rgba(192,132,252,0.24)" stroke="#c084fc" stroke-width="2"/>
      <rect x="20" y="64" width="76" height="26" rx="6" fill="rgba(56,189,248,0.20)" stroke="#38bdf8" stroke-width="1.8"/>
      <rect x="124" y="64" width="76" height="26" rx="6" fill="rgba(52,211,153,0.20)" stroke="#34d399" stroke-width="1.8"/>
      <line x1="110" y1="34" x2="58" y2="64" stroke="#cbd5e1" stroke-width="1.8"/>
      <line x1="110" y1="34" x2="162" y2="64" stroke="#cbd5e1" stroke-width="1.8"/>
      <text x="86" y="26" fill="#f3e8ff" font-size="10" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">IState</text>
      <text x="34" y="81" fill="#bae6fd" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Patrol</text>
      <text x="142" y="81" fill="#a7f3d0" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Chase</text>
    </svg>`,
    t_bt: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <rect x="80" y="8" width="60" height="20" rx="6" fill="rgba(251,146,60,0.26)" stroke="#fb923c" stroke-width="2"/>
      <polygon points="110,36 142,52 110,68 78,52" fill="rgba(250,204,21,0.20)" stroke="#fde047" stroke-width="2"/>
      <rect x="26" y="74" width="56" height="20" rx="10" fill="rgba(52,211,153,0.24)" stroke="#34d399" stroke-width="1.8"/>
      <rect x="138" y="74" width="56" height="20" rx="5" fill="rgba(56,189,248,0.24)" stroke="#38bdf8" stroke-width="1.8"/>
      <line x1="110" y1="28" x2="110" y2="36" stroke="#cbd5e1" stroke-width="1.8"/>
      <line x1="90" y1="60" x2="54" y2="74" stroke="#34d399" stroke-width="1.8"/>
      <line x1="130" y1="60" x2="166" y2="74" stroke="#38bdf8" stroke-width="1.8"/>
      <text x="95" y="21" fill="#ffedd5" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Root</text>
      <text x="95" y="55" fill="#fef08a" font-size="9" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Seq →</text>
      <text x="38" y="87" fill="#d1fae5" font-size="9" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif">Cond</text>
      <text x="150" y="87" fill="#e0f2fe" font-size="9" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif">Act</text>
    </svg>`,
    t_boids: `<svg viewBox="0 0 220 100" fill="none" stroke-linecap="round">
      <circle cx="96" cy="50" r="36" stroke="#34d399" stroke-width="1.8" stroke-dasharray="4 4"/>
      <polygon points="108,50 86,40 91,50 86,60" fill="#38bdf8"/>
      <polygon points="146,32 126,24 130,32 126,40" fill="#34d399"/>
      <polygon points="62,36 42,28 46,36 42,44" fill="#fde047"/>
      <polygon points="134,74 114,66 118,74 114,82" fill="#f472b6"/>
      <polygon points="74,76 54,68 58,76 54,84" fill="#c084fc"/>
      <text x="152" y="56" fill="#a7f3d0" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">Sep/Ali</text>
      <text x="152" y="72" fill="#7dd3fc" font-size="9.5" font-family="Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif" font-weight="bold">+ Coh</text>
    </svg>`
  };

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
    return { pct: Math.min(100, secStudied + demoBonus + drillBonus + pracScore), total: qs.length, done: done.length, right: right.length, wrong: done.length - right.length };
  }

  function computeModuleMastery(modId) {
    const qs = BANK.filter(q => q.module === modId);
    const done = qs.filter(q => state.answers[q.id]?.checked);
    const right = done.filter(q => state.answers[q.id]?.correct);
    const mod = MODULES.find(m => m.id === modId);
    const subSecs = SECTIONS.filter(s => s.mod === modId);
    const studiedSubCnt = subSecs.filter(s => state.studiedSections[s.id] || state.studiedMods[modId]).length;
    const studyPts = subSecs.length ? Math.round((studiedSubCnt / subSecs.length) * 15) : (state.studiedMods[modId] ? 15 : 0);
    const demoPts = (mod?.demos || []).some(id => state.ranDemos[id]) ? 10 : 0;
    const drillPts = DRILLS.some(d => d.module === modId && state.passedDrills[d.id]) ? 10 : 0;
    const pracPts = qs.length ? Math.round((right.length / qs.length) * 75) : 0;
    return { pct: Math.min(100, studyPts + demoPts + drillPts + pracPts), total: qs.length, done: done.length, right: right.length, wrong: done.length - right.length };
  }

  function computeOverallMastery() {
    const mods = MODULES.map(m => computeModuleMastery(m.id));
    const avg = mods.length ? Math.round(mods.reduce((s, x) => s + x.pct, 0) / mods.length) : 0;
    let rank = '启航新手鲸', mood = 'cheer', desc = '开始阅读精细详解、手写运行 C# 代码并逐题刷题，看着你的熟练度条步步飙升！';
    if (avg >= 85) { rank = '期末满分大架构师'; mood = 'trophy'; desc = '全课程知识点均已高度掌握，期末考稳拿高分！'; }
    else if (avg >= 60) { rank = '进阶算法能手'; mood = 'happy'; desc = '核心模块已掌握大半，继续攻克低熟练度薄弱卡片即可冲刺 90+！'; }
    else if (avg >= 30) { rank = '深海成长学徒'; mood = 'teach'; desc = '基础扎实起步，点击下方薄弱章节与小节卡片进行针对性提分！'; }
    return { avg, rank, mood, desc };
  }

  function tierLabel(pct) { return pct >= 85 ? '已精通' : (pct >= 55 ? '较熟练' : (pct >= 25 ? '巩固中' : '待攻克')); }

  function bindParallaxCards(rootEl) {
    rootEl.querySelectorAll('.parallax-card').forEach(card => {
      let tx = 0, ty = 0, cx = 0, cy = 0, sc = 1, tsc = 1, animId = null;
      function animate() {
        cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14; sc += (tsc - sc) * 0.14;
        card.style.transform = `perspective(900px) rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg) scale3d(${sc.toFixed(4)}, ${sc.toFixed(4)}, 1)`;
        if (Math.abs(tx - cx) > 0.04 || Math.abs(ty - cy) > 0.04 || Math.abs(tsc - sc) > 0.001) animId = requestAnimationFrame(animate);
        else { animId = null; if (tsc === 1) card.style.transform = ''; }
      }
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        tx = (0.5 - py) * 9; ty = (px - 0.5) * 11; tsc = 1.025;
        if (!animId) animId = requestAnimationFrame(animate);
      });
      card.addEventListener('pointerleave', () => { tx = 0; ty = 0; tsc = 1; if (!animId) animId = requestAnimationFrame(animate); });
    });
  }

  function renderMasteryView() {
    const host = document.getElementById('mastery-host');
    if (!host) return;
    const ov = computeOverallMastery();
    const circ = 2 * Math.PI * 52, offset = circ * (1 - ov.avg / 100);

    const chapterCardsHTML = MODULES.map((m, idx) => {
      const st = computeModuleMastery(m.id);
      const subTopics = TOPICS.filter(t => t.mod === m.id);
      const subBarsHTML = subTopics.map(tp => {
        const ts = computeTopicMastery(tp.id);
        return `
          <div class="m-sub-row">
            <div class="m-sub-row-head"><span>${tp.name}</span><span>${ts.pct}%</span></div>
            <div class="m-sub-bar-track"><div class="m-sub-bar-fill" style="width:${ts.pct}%"></div></div>
          </div>`;
      }).join('');

      const ledCls = st.pct >= 70 ? '' : (st.pct >= 25 ? 'cyan' : 'amber');
      return `
        <div class="parallax-card ${m.grad}" data-jump-mod="${m.id}">
          <div class="m-card-top">
            <div class="m-card-icon">CH 0${idx + 1}</div>
            <span class="m-tier-pill"><span class="aero-led ${ledCls}"></span>${tierLabel(st.pct)} · ${st.pct}%</span>
          </div>
          <div class="p-svg-window" aria-hidden="true">${CARD_SVGS[m.id] || ''}</div>
          <div class="p-glass-plate">
            <div class="m-card-title">${m.short}</div>
            <div class="m-card-sub">${m.lectures} · ${m.tag}</div>
            <div class="m-bar-wrap">
              <div class="m-bar-head"><span>章节综合熟练度</span><span>${st.right}/${st.total} 题 · ${st.pct}%</span></div>
              <div class="m-bar-track"><div class="m-bar-fill" style="width:${st.pct}%"></div></div>
            </div>
          </div>
          <div class="m-subtopics-glass">${subBarsHTML}</div>
          <div class="m-card-actions">
            <button class="m-card-btn" data-go-learn="${m.id}">精细详解</button>
            <button class="m-card-btn primary-aero" data-go-prac-mod="${m.id}">逐题练习</button>
          </div>
        </div>`;
    }).join('');

    const topicCardsHTML = TOPICS.map((tp, idx) => {
      const st = computeTopicMastery(tp.id);
      const ledCls = st.pct >= 70 ? '' : (st.pct >= 25 ? 'cyan' : 'amber');
      return `
        <div class="parallax-card topic-card ${tp.grad}">
          <div class="m-card-top">
            <div class="m-card-icon">K${String(idx + 1).padStart(2, '0')}</div>
            <span class="m-tier-pill"><span class="aero-led ${ledCls}"></span>${tierLabel(st.pct)} · ${st.pct}%</span>
          </div>
          <div class="p-svg-window compact" aria-hidden="true">${CARD_SVGS[tp.id] || ''}</div>
          <div class="p-glass-plate">
            <div class="m-card-title" style="font-size:14.5px">${tp.name}</div>
            <div class="m-card-sub" style="font-size:11.5px">${tp.sub}</div>
            <div class="m-bar-wrap">
              <div class="m-bar-head" style="font-size:11px"><span>小节熟练度</span><span>${st.right}/${st.total} 正确 · 错 ${st.wrong}</span></div>
              <div class="m-bar-track"><div class="m-bar-fill" style="width:${st.pct}%"></div></div>
            </div>
          </div>
          <div class="m-card-actions">
            <button class="m-card-btn" data-go-section="${tp.id}">小节详解与动画</button>
            <button class="m-card-btn primary-aero" data-go-prac-topic="${tp.id}">针对刷题</button>
          </div>
        </div>`;
    }).join('');

    host.innerHTML = `
      <div class="mastery-hero">
        <div class="mastery-ring-box">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="10"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#fde047" stroke-width="10" stroke-linecap="round"
              stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" style="transition:stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)"/>
          </svg>
          <div class="mastery-ring-center">
            <div class="mastery-ring-pct">${ov.avg}%</div>
            <div class="mastery-ring-sub">综合熟练度</div>
          </div>
        </div>
        <div>
          <div class="hero-eyebrow">实时人工智能应用 · 知识掌握度系统</div>
          <h2 style="font-size:24px;font-weight:900;margin-bottom:6px">当前段位：${ov.rank}</h2>
          <p style="font-size:13.5px;opacity:0.92;margin-bottom:14px">${ov.desc}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn-primary" id="btn-mastery-weak">攻克最薄弱知识点</button>
            <button class="btn-ghost-light" id="btn-mastery-coding">专项无限随机刷编程题</button>
          </div>
        </div>
        <div style="text-align:center">
          <img src="${MASCOTS[ov.mood] || MASCOTS.cheer}" style="width:144px;height:144px;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(0,0,0,0.3))">
        </div>
      </div>

      <div class="mastery-section-title">
        <span>六大考试章节熟练度（悬停 3D 视差 · 光晕跟随鼠标）</span>
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">熟练度 = 详解打卡 + 运行/手写 C# 代码 + 刷题正确率</span>
      </div>
      <div class="parallax-grid">${chapterCardsHTML}</div>

      <div class="mastery-section-title" style="margin-top:32px">
        <span>十六大细分小节熟练度卡片</span>
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">每张卡片附定制算法 SVG 图解与独立熟练度条</span>
      </div>
      <div class="parallax-grid topics">${topicCardsHTML}</div>`;

    bindParallaxCards(host);

    host.querySelectorAll('[data-go-learn]').forEach(b => b.onclick = e => {
      e.stopPropagation(); switchView('knowledge'); selectModule(b.dataset.goLearn, true);
    });
    host.querySelectorAll('[data-go-section]').forEach(b => b.onclick = e => {
      e.stopPropagation(); switchView('knowledge'); selectSection(b.dataset.goSection, true);
    });
    host.querySelectorAll('[data-go-prac-mod]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const m = MODULES.find(x => x.id === b.dataset.goPracMod);
      startRandomSession({ mod: b.dataset.goPracMod, topic: null, label: m ? m.short : b.dataset.goPracMod });
      state.practiceSub = 'bank'; switchView('practice');
    });
    host.querySelectorAll('[data-go-prac-topic]').forEach(b => b.onclick = e => {
      e.stopPropagation(); const tp = TOPICS.find(x => x.id === b.dataset.goPracTopic);
      startRandomSession({ mod: tp ? tp.mod : null, topic: b.dataset.goPracTopic, label: tp ? tp.name : b.dataset.goPracTopic });
      state.practiceSub = 'bank'; switchView('practice');
    });
    document.getElementById('btn-mastery-weak').onclick = () => {
      let weakest = TOPICS[0], minP = 999;
      TOPICS.forEach(tp => { const p = computeTopicMastery(tp.id).pct; if (p < minP) { minP = p; weakest = tp; } });
      startRandomSession({ mod: weakest.mod, topic: weakest.id, label: `薄弱小节：${weakest.name}` });
      state.practiceSub = 'bank';
      switchView('practice');
      setCompanion('exam', `已优先排布最薄弱小节【${weakest.name}】（熟练度 ${minP}%），按难度曲线随机刷题！`, 5000);
    };
    document.getElementById('btn-mastery-coding').onclick = () => {
      startRandomSession({ codingOnly: true, label: 'C# 编程与代码实战（无限随机）' });
      state.practiceSub = 'bank';
      switchView('practice');
    };
  }

  /* -------------------- Global Stats & Navigation -------------------- */
  function updateGlobalStats() {
    const total = BANK.length + DRILLS.length;
    const doneIds = Object.keys(state.answers).filter(id => state.answers[id]?.checked);
    const passedDrillCnt = Object.keys(state.passedDrills).filter(id => state.passedDrills[id]).length;
    const wrongIds = doneIds.filter(id => !state.answers[id]?.correct);
    const favCount = Object.keys(state.favorites).filter(id => state.favorites[id]).length;
    const ov = computeOverallMastery();

    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setTxt('stat-done', `${doneIds.length + passedDrillCnt} / ${total}`);
    setTxt('stat-acc', `${ov.avg}%`);
    setTxt('nav-mastery-pct', `${ov.avg}%`);
    setTxt('nav-wrong-count', wrongIds.length + favCount);
    setTxt('nav-q-count', '∞');
  }

  function switchView(viewName) {
    state.activeView = viewName;
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.view === viewName));
    document.querySelectorAll('.view-section').forEach(s => s.classList.toggle('active', s.id === `view-${viewName}`));
    if (viewName === 'knowledge') { mountSectionLabs(state.activeSection); refreshTocMasteryTags(); }
    else if (viewName === 'mastery') { renderMasteryView(); }
    else if (viewName === 'practice') { renderPracticeView(); }
    else if (viewName === 'notebook') { renderNotebookView(); }
    if (window.DshPetAssistant) window.DshPetAssistant.onContextChanged();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ========================================================================
     VIEW 1: 16 DEDICATED SUB-SECTION KNOWLEDGE PAGES + 2-LEVEL NESTED TOC TREE
     Each Sub-Section Page: 1. Detailed Notes -> 2. C# Sandbox -> 3. Animation
     ======================================================================== */
  function buildLabHTML(lab) {
    return `
      <div class="anim-lab-card" data-lab-id="${lab.id}" data-engine="${lab.engine}" data-default-mode="${lab.defaultMode}">
        <div class="anim-lab-header">
          <div class="anim-lab-title"><span class="live-dot"></span>${lab.title}</div>
          <div class="anim-mode-pills">
            ${lab.modes.map((m, idx) => `<button class="anim-pill ${idx === 0 ? 'active' : ''}" data-mode="${m.key}">${m.label}</button>`).join('')}
          </div>
        </div>
        <div class="anim-stage-wrap">
          <div class="anim-canvas-box"><canvas></canvas></div>
          <div class="anim-side-panel"></div>
        </div>
        <div class="anim-controls-bar">
          <div class="ctrl-group">
            <button class="ctrl-btn primary" data-act="play">暂停</button>
            <button class="ctrl-btn" data-act="step">单步推演</button>
            <button class="ctrl-btn" data-act="reset">重置</button>
            <label class="ctrl-slider">倍速 <input type="range" min="0.4" max="2.5" step="0.1" value="1" data-act="speed"></label>
          </div>
          <div class="anim-narrator">点击画面任意处即可弹出全屏放大预览</div>
        </div>
      </div>`;
  }

  function refreshTocMasteryTags() {
    const tocList = document.getElementById('toc-list');
    if (!tocList) return;
    MODULES.forEach(m => {
      const tag = tocList.querySelector(`[data-toc-mod="${m.id}"] .toc-tag`);
      if (tag) tag.textContent = `${computeModuleMastery(m.id).pct}%`;
    });
    SECTIONS.forEach(sec => {
      const subBtn = tocList.querySelector(`[data-sec="${sec.id}"]`);
      if (subBtn) {
        subBtn.classList.toggle('studied', !!(state.studiedSections[sec.id] || state.studiedMods[sec.mod]));
        const pEl = subBtn.querySelector('.toc-sub-pct');
        if (pEl) pEl.textContent = `${computeTopicMastery(sec.id).pct}%`;
      }
    });
  }

  function renderKnowledgeSection() {
    const tocList = document.getElementById('toc-list');
    const modHost = document.getElementById('module-panels');
    if (!tocList || !modHost || !SECTIONS.length) return;

    const activeSecObj = SECTIONS.find(s => s.id === state.activeSection) || SECTIONS[0];
    state.activeSection = activeSecObj.id;
    state.activeModule = activeSecObj.mod;
    state.expandedMods[activeSecObj.mod] = true;

    // 2-level hierarchical collapsible TOC tree: 6 Chapter Groups -> 16 Indented Sub-Section Children
    const chevSVG = `<svg class="toc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
    tocList.innerHTML = MODULES.map(m => {
      const mPct = computeModuleMastery(m.id).pct;
      const children = SECTIONS.filter(s => s.mod === m.id);
      const isOpen = !!state.expandedMods[m.id];
      const hasActive = children.some(c => c.id === state.activeSection);
      return `
        <div class="toc-group ${isOpen ? 'open' : ''}" data-toc-group="${m.id}">
          <button type="button" class="toc-chapter-btn ${hasActive ? 'has-active' : ''}" data-toc-mod="${m.id}" aria-expanded="${isOpen}">
            <span class="toc-ch-left">${chevSVG}<span class="toc-ch-title">${m.short}</span></span>
            <span class="toc-tag">${mPct}%</span>
          </button>
          <div class="toc-sublist">
            ${children.map(sec => {
              const sPct = computeTopicMastery(sec.id).pct;
              const isStudied = !!(state.studiedSections[sec.id] || state.studiedMods[sec.mod]);
              return `
                <button type="button" class="toc-sub-item ${sec.id === state.activeSection ? 'active' : ''} ${isStudied ? 'studied' : ''}" data-sec="${sec.id}" title="${sec.title}">
                  <span class="toc-sub-left"><span class="toc-sub-dot"></span><span class="toc-sub-label">${sec.short}</span></span>
                  <span class="toc-sub-pct">${sPct}%</span>
                </button>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    // 16 Dedicated Sub-Section Pages (each with Notes + Dedicated C# Sandbox + Dedicated Animation + Sub-Section Pager)
    modHost.innerHTML = SECTIONS.map((sec, idx) => {
      const parentMod = MODULES.find(m => m.id === sec.mod);
      const studied = !!(state.studiedSections[sec.id] || state.studiedMods[sec.mod]);
      const prevSec = idx > 0 ? SECTIONS[idx - 1] : null;
      const nextSec = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
      return `
        <div class="module-panel ${sec.id === state.activeSection ? 'active' : ''}" id="panel-${sec.id}">
          <div class="module-banner">
            <div class="module-banner-left">
              <div class="module-kicker">${parentMod ? parentMod.short : ''} · ${sec.lectures} · ${sec.tag} · 第 ${idx + 1} / ${SECTIONS.length} 小节</div>
              <h2>${sec.title}</h2>
              <div class="mascot-tip-line">${sec.tip}</div>
            </div>
            <img class="module-banner-mascot" src="${MASCOTS[sec.mascot] || ''}" alt="蓝色大肥鱼">
          </div>

          <div class="module-part-divider">
            <h3><span class="part-step-num">1</span> 本小节精细详解与例题推导</h3>
            <button class="secondary-btn mark-studied-btn" data-mark-sec="${sec.id}">${studied ? '本小节已打卡 (+15%熟练度)' : '打卡本小节已学完 (+15%熟练度)'}</button>
          </div>
          ${sec.html}

          <div class="module-part-divider">
            <h3><span class="part-step-num">2</span> 本小节专属 Unity C# 代码运行沙盒（语法着色）</h3>
            <span style="font-size:12px;color:var(--text-muted);font-weight:600">支持实时着色编辑参数并点击运行查看效果</span>
          </div>
          ${buildCodeRunnerHTML(sec.demos, `sec-${sec.id}`)}

          <div class="module-part-divider">
            <h3><span class="part-step-num">3</span> 本小节专属 60fps 非线性交互动画演示（点击画面全屏放大）</h3>
            <span style="font-size:12px;color:var(--text-muted);font-weight:600">支持单步推演、变速调节与照片级暗化模糊弹出放大</span>
          </div>
          ${sec.labs.map(buildLabHTML).join('')}

          <div class="section-pager-bar">
            ${prevSec
              ? `<button class="secondary-btn go-sec-nav" data-nav-sec="${prevSec.id}">← 上一小节：${prevSec.short}</button>`
              : `<button class="secondary-btn" disabled style="opacity:0.45;cursor:not-allowed">← 已是第 1 小节</button>`}
            <button class="submit-btn go-practice-sec" data-sec-id="${sec.id}" data-sec-mod="${sec.mod}" data-sec-label="${sec.short}">针对本小节刷题</button>
            ${nextSec
              ? `<button class="secondary-btn go-sec-nav" data-nav-sec="${nextSec.id}">下一小节：${nextSec.short} →</button>`
              : `<button class="secondary-btn go-mastery-btn">查看全部熟练度卡片 →</button>`}
          </div>
        </div>`;
    }).join('');

    // Syntax-highlight any static .code-block inside knowledge HTML
    modHost.querySelectorAll('.code-block').forEach(el => { el.innerHTML = hlCS(el.textContent); });

    // Toggle chapter accordion expand/collapse on chapter header click
    tocList.querySelectorAll('.toc-chapter-btn').forEach(btn => {
      btn.onclick = () => {
        const mid = btn.dataset.tocMod;
        const grp = tocList.querySelector(`[data-toc-group="${mid}"]`);
        const nextOpen = !state.expandedMods[mid];
        state.expandedMods[mid] = nextOpen;
        if (grp) grp.classList.toggle('open', nextOpen);
        btn.setAttribute('aria-expanded', String(nextOpen));
      };
    });

    // Switch dedicated sub-section page on child item click
    tocList.querySelectorAll('.toc-sub-item').forEach(btn => {
      btn.onclick = () => selectSection(btn.dataset.sec, true);
    });

    const tocSidebar = document.querySelector('.toc-sidebar');
    const tocMobileBtn = document.getElementById('toc-mobile-toggle');
    if (tocMobileBtn && tocSidebar) {
      tocMobileBtn.onclick = () => {
        const nextOpen = !tocSidebar.classList.contains('mobile-open');
        tocSidebar.classList.toggle('mobile-open', nextOpen);
        tocMobileBtn.setAttribute('aria-expanded', String(nextOpen));
        tocMobileBtn.textContent = nextOpen ? '收起目录' : '展开目录';
      };
    }

    // Bottom sub-section prev/next navigation
    modHost.querySelectorAll('.go-sec-nav').forEach(btn => {
      btn.onclick = () => selectSection(btn.dataset.navSec, true);
    });

    modHost.querySelectorAll('.go-practice-sec').forEach(btn => btn.onclick = () => {
      startRandomSession({ mod: btn.dataset.secMod, topic: btn.dataset.secId, label: btn.dataset.secLabel });
      state.practiceSub = 'bank';
      switchView('practice');
    });
    modHost.querySelectorAll('.go-mastery-btn').forEach(b => b.onclick = () => switchView('mastery'));

    modHost.querySelectorAll('.mark-studied-btn').forEach(b => b.onclick = () => {
      const sid = b.dataset.markSec;
      state.studiedSections[sid] = !state.studiedSections[sid];
      saveState(); updateGlobalStats(); refreshTocMasteryTags();
      b.textContent = state.studiedSections[sid] ? '本小节已打卡 (+15%熟练度)' : '打卡本小节已学完 (+15%熟练度)';
      if (state.studiedSections[sid]) setCompanion('happy', '本小节详解已打卡！小节与所属章节熟练度均已同步上升。', 4200);
    });

    bindCodeRunners(modHost);
    mountSectionLabs(state.activeSection);
  }

  function selectSection(secId, scrollToTop = false) {
    const sec = SECTIONS.find(s => s.id === secId) || SECTIONS[0];
    if (!sec) return;
    state.activeSection = sec.id;
    state.activeModule = sec.mod;
    state.expandedMods[sec.mod] = true;

    const tocList = document.getElementById('toc-list');
    if (tocList) {
      const grp = tocList.querySelector(`[data-toc-group="${sec.mod}"]`);
      if (grp) {
        grp.classList.add('open');
        grp.querySelector('.toc-chapter-btn')?.setAttribute('aria-expanded', 'true');
      }
      tocList.querySelectorAll('.toc-chapter-btn').forEach(b => b.classList.toggle('has-active', b.dataset.tocMod === sec.mod));
      tocList.querySelectorAll('.toc-sub-item').forEach(b => b.classList.toggle('active', b.dataset.sec === sec.id));
    }

    document.querySelectorAll('.module-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${sec.id}`));
    mountSectionLabs(sec.id);
    refreshTocMasteryTags();
    setCompanion(sec.mascot, sec.tip, 4500);
    if (window.DshPetAssistant) window.DshPetAssistant.onContextChanged({ keepBubble: true });
    if (window.innerWidth <= 960) {
      const tocSidebar = document.querySelector('.toc-sidebar');
      const tocMobileBtn = document.getElementById('toc-mobile-toggle');
      if (tocSidebar) tocSidebar.classList.remove('mobile-open');
      if (tocMobileBtn) {
        tocMobileBtn.setAttribute('aria-expanded', 'false');
        tocMobileBtn.textContent = '展开目录';
      }
    }
    if (scrollToTop) {
      const targetEl = window.innerWidth <= 960
        ? (document.getElementById('module-panels') || document.getElementById('knowledge-anchor'))
        : document.getElementById('knowledge-anchor');
      targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function selectModule(modId, scrollToTop = false) {
    const firstChild = SECTIONS.find(s => s.mod === modId);
    if (firstChild) selectSection(firstChild.id, scrollToTop);
  }

  function mountSectionLabs(secId) {
    const panel = document.getElementById(`panel-${secId}`);
    const sec = SECTIONS.find(s => s.id === secId);
    if (!panel || !sec) return;
    panel.querySelectorAll('.anim-lab-card').forEach(card => {
      const labCfg = sec.labs.find(l => l.id === card.dataset.labId);
      if (!card.dataset.mounted) {
        card.dataset.mounted = '1';
        window.AnimEngine.mount(card, card.dataset.engine, { mode: card.dataset.defaultMode });
        attachCanvasZoomBehavior(card, {
          engine: card.dataset.engine, mode: card.dataset.defaultMode,
          title: labCfg ? labCfg.title : '交互动画预览', modes: labCfg ? labCfg.modes : null
        });
      }
    });
  }

  /* ========================================================================
     SHARED QUESTION CARD (Syntax-Colored Code + Lock-After-Answer + Next CTA)
     ======================================================================== */
  const TYPE_LABELS = { single: ['一、单选题', ''], tf: ['二、判断题', 'tf'], fill: ['三、填空题', 'fill'], essay: ['四、按要求作答', 'essay'], code: ['五、编程题', 'code'] };
  const MOD_SHORT = Object.fromEntries(MODULES.map(m => [m.id, m.short]));
  const TOPIC_NAME = Object.fromEntries(TOPICS.map(t => [t.id, t.name]));

  function normalizeAns(s) {
    return String(s || '').trim().replace(/\s+/g, '').replace(/；/g, ';').replace(/，/g, ',').replace(/（/g, '(').replace(/）/g, ')').toLowerCase();
  }

  function renderQuestionCard(q, displayIdx, opts = {}) {
    const isMock = !!opts.mockMode;
    const saved = isMock
      ? (opts.mockAns || null)
      : (opts.instance ? opts.instance.ans : (state.answers[q.id] || null));
    const isLocked = (!!opts.lockAfterAnswer && !!(saved && saved.checked)) || (isMock && !!state.mockExam?.submitted);
    const isSplitReview = !!opts.splitReview;
    const activeLeftTab = opts.activeLeftTab || 'question';
    const draftVal = (!saved?.checked && opts.instance && opts.instance.draftVal !== undefined)
      ? opts.instance.draftVal
      : undefined;
    const isFav = !!state.favorites[q.id];
    const [tLabel, tCls] = TYPE_LABELS[q.type] || ['题目', ''];
    const cardCls = saved && saved.checked ? (saved.correct ? 'is-correct' : 'is-wrong') : '';
    const cardId = `${isMock ? 'mq' : 'q'}-${q.id}`;

    let bodyHTML = '';
    if (q.interactiveGrid && BOARD) {
      const ig = q.interactiveGrid;
      const valsArr = (saved && Array.isArray(saved.userVal))
        ? saved.userVal
        : (Array.isArray(draftVal) ? draftVal : []);
      const curPathStr = String(valsArr[ig.syncBlankIdx ?? 5] || '').trim();
      const parsedIds = curPathStr ? curPathStr.split(/[-–—>,\s]+/).map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < ig.rows * ig.cols) : [];
      const gridUid = opts.instance ? `${opts.instance.uid}-ig` : `${cardId}-${displayIdx}-ig`;
      bodyHTML += `<div class="ig-board-host">${BOARD.createBoardHTML(ig, gridUid, { ...ig, path: parsedIds }, isLocked)}</div>`;
    } else if (q.customHtml) {
      bodyHTML += q.customHtml;
    }
    if (q.codeTemplate) bodyHTML += `<div class="code-block">${hlCS(q.codeTemplate)}</div>`;

    if (q.type === 'single') {
      const letters = ['A', 'B', 'C', 'D'];
      bodyHTML += `<div class="options-grid ${q.options.some(o => o.length > 26) ? 'single-col' : ''}">` +
        q.options.map((opt, idx) => {
          let cls = '';
          if (saved && saved.checked) {
            if (idx === q.answer) cls = 'correct';
            else if (idx === saved.userVal) cls = 'wrong';
          } else if (saved && saved.userVal === idx) cls = 'selected';
          if (isLocked) cls += ' locked';
          return `<button class="opt-btn ${cls.trim()}" data-opt="${idx}" ${isLocked ? 'disabled' : ''}><span class="opt-key">${letters[idx]}</span><span>${opt}</span></button>`;
        }).join('') + `</div>`;
    } else if (q.type === 'tf') {
      bodyHTML += `<div class="options-grid">` +
        [[true, '对（正确）'], [false, '错（错误）']].map(([val, lbl], i) => {
          let cls = '';
          if (saved && saved.checked) {
            if (val === q.answer) cls = 'correct';
            else if (val === saved.userVal) cls = 'wrong';
          } else if (saved && saved.userVal === val) cls = 'selected';
          if (isLocked) cls += ' locked';
          return `<button class="opt-btn ${cls.trim()}" data-tf="${val}" ${isLocked ? 'disabled' : ''}><span class="opt-key">${i === 0 ? 'T' : 'F'}</span><span>${lbl}</span></button>`;
        }).join('') + `</div>`;
    } else if (q.type === 'fill' || (q.type === 'code' && q.subkind === 'fill')) {
      const vals = (saved && Array.isArray(saved.userVal))
        ? saved.userVal
        : (Array.isArray(draftVal) ? draftVal : q.blanks.map(() => ''));
      bodyHTML += `<div class="blanks-wrap">` +
        q.blanks.map((b, i) => {
          let cls = '';
          if (saved && saved.checked) {
            const ok = GRADER ? GRADER.matchFillBlank(vals[i], b.answers) : b.answers.some(a => normalizeAns(a) === normalizeAns(vals[i]));
            cls = ok ? 'ok' : 'bad';
          }
          return `<div class="blank-field"><label>${b.label}</label><input class="blank-input ${cls}" data-bidx="${i}" value="${escapeHTML(vals[i] || '')}" placeholder="请输入答案..." ${isLocked ? 'disabled' : ''}></div>`;
        }).join('') + `</div>`;
    } else if (q.type === 'code') {
      const fallbackStarter = q.starterCode || '// 在此手写 Unity C# 核心代码（支持 Tab 缩进与实时语法着色）\n';
      const txtVal = (saved && typeof saved.userVal === 'string')
        ? saved.userVal
        : (typeof draftVal === 'string' ? draftVal : fallbackStarter);
      const ideH = q.starterCode ? 265 : 210;
      const starterBar = (q.starterCode && !isLocked)
        ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 12px;background:#0f172a;border-bottom:1px solid #1e2d4a;font-size:12px;color:#94a3b8"><span>代码编写区（已内置逐行提示注释，支持等价写法智能判分）</span><button type="button" class="ctrl-btn q-reset-starter-btn" style="padding:3px 9px;font-size:11px;background:rgba(255,255,255,0.08);color:#e2eeff;border-color:rgba(148,163,184,0.3)">重置提示骨架</button></div>`
        : '';
      bodyHTML += `<div style="border-radius:12px;overflow:hidden;border:1px solid #1e2d4a;margin-bottom:12px">${starterBar}${buildIdeEditorHTML(txtVal, 'q-code-ide', ideH, isLocked)}</div>`;
    } else {
      const srcUv = (saved && saved.userVal !== undefined) ? saved.userVal : draftVal;
      const isHybrid = srcUv && typeof srcUv === 'object' && !Array.isArray(srcUv);
      const txtVal = isHybrid ? (srcUv.text || '') : (typeof srcUv === 'string' ? srcUv : '');
      const savedDia = isHybrid ? (srcUv.diagram || null) : null;
      if (q.board && BOARD) {
        const boardUid = opts.instance ? opts.instance.uid : `${cardId}-${displayIdx}`;
        bodyHTML += BOARD.createBoardHTML(q.board, boardUid, savedDia, isLocked);
        bodyHTML += `<div class="board-text-label">补充文字说明（可结合上方画板作答）：</div>`;
      } else if (q.scratchBoard && BOARD) {
        const scratchUid = opts.instance ? `${opts.instance.uid}-sc` : `${cardId}-${displayIdx}-sc`;
        bodyHTML += `
          <div class="scratch-board-wrap">
            <div class="scratch-bar">
              <span class="scratch-title">辅助演草区（纯草稿工具，不参与评分）</span>
              <button type="button" class="secondary-btn scratch-toggle-btn" style="padding:4px 11px;font-size:12px">展开寻路演草画板（草稿 · 不计分）</button>
            </div>
            <div class="scratch-host hidden">${BOARD.createBoardHTML(q.scratchBoard, scratchUid, null, false)}</div>
          </div>`;
      }
      bodyHTML += `<textarea class="essay-textarea" placeholder="在此整理答题思路（核心思想 / 算法步骤 / 规则说明），提交后核对采分点与动画解析..." ${isLocked ? 'disabled' : ''}>${escapeHTML(txtVal)}</textarea>`;
    }

    const showExplain = !isSplitReview && saved && saved.checked;
    const scoreTag = opts.points ? `<span class="exam-tag hot">${opts.points}分</span>` : '';
    const lockTag = isLocked ? `<span class="exam-tag locked-tag">已锁定 · 不可修改</span>` : '';
    const checkBtnLabel = q.board
      ? (opts.lockAfterAnswer ? '提交画板与作答（提交后锁定）' : '提交画板与作答并批改')
      : (q.type === 'essay' || q.subkind === 'write'
        ? (opts.lockAfterAnswer ? '提交作答（提交后锁定）' : '提交并查看参考代码 + 动画解析')
        : (opts.lockAfterAnswer ? '提交作答（提交后锁定）' : '提交核对答案'));
    const peekBtnLabel = (!isLocked && isSplitReview && opts.peekExplain)
      ? '收起解析面板'
      : ((opts.lockAfterAnswer && (q.type === 'single' || q.type === 'tf')) ? '展开解析与动画' : '直接展开解析与动画');

    let footerHTML = '';
    if (!isMock) {
      if (isLocked) {
        footerHTML = `
          <div class="locked-notice-bar">
            <span>本题已作答锁定（无论对错不可改选），右侧可同步浏览详解与关联知识点</span>
            <div class="post-quick-actions">
              ${isSplitReview ? `<button type="button" class="secondary-btn" data-jump-lpanel="code" style="padding:7px 13px;font-size:12.5px">切到代码与运行 →</button>` : ''}
              ${opts.hasNext ? `<button class="submit-btn inline-next-q-btn" style="padding:7px 14px;font-size:12.5px">进入下一题 →</button>` : ''}
            </div>
          </div>`;
      } else if (opts.lockAfterAnswer && (q.type === 'single' || q.type === 'tf')) {
        footerHTML = `
          <div class="q-footer-bar">
            <span style="font-size:12.5px;font-weight:700;color:var(--text-muted)">点选上方选项即提交锁定（无论对错不可更改）</span>
            <button class="secondary-btn" data-toggle-anim="${q.id}">${peekBtnLabel}</button>
          </div>`;
      } else {
        footerHTML = `
          <div class="q-footer-bar">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="submit-btn" data-check="${q.id}">${checkBtnLabel}</button>
              <button class="secondary-btn" data-toggle-anim="${q.id}">${peekBtnLabel}</button>
            </div>
            ${!opts.lockAfterAnswer && saved && saved.checked ? `<button class="secondary-btn" data-redo="${q.id}">重做巩固</button>` : ''}
          </div>`;
      }
    } else if (isSplitReview) {
      footerHTML = `
        <div class="post-quick-bar">
          <span class="post-quick-status ${saved?.correct ? 'ok' : 'bad'}">${saved?.correct ? '本题智能判定已达标' : '本题仍需巩固（详见右侧分步解析）'}</span>
          <div class="post-quick-actions">
            <button type="button" class="secondary-btn" data-jump-lpanel="code" style="padding:6px 12px;font-size:12px">切到代码与运行 →</button>
            ${opts.hasNext ? `<button type="button" class="submit-btn inline-next-q-btn" style="padding:6px 13px;font-size:12px">下一题 →</button>` : ''}
          </div>
        </div>`;
    }

    let contentAreaHTML = '';
    if (isSplitReview) {
      const qTabLabel = (q.type === 'code' && q.subkind === 'write') ? '题目与编码' : '题目与作答';
      const codeTabLabel = (q.codeTemplate && q.blanks)
        ? '完整代码与运行'
        : (q.modelCode ? '参考代码与运行' : 'C# 示例代码与运行');
      const codeTabPill = (q.codeTemplate || q.modelCode) ? 'C#' : '沙盒';
      contentAreaHTML = `
        <div class="post-card-tabs" role="tablist" aria-label="作答后视图切换">
          <button type="button" class="post-tab-btn ${activeLeftTab === 'question' ? 'active' : ''}" data-lpanel="question">${qTabLabel}</button>
          <button type="button" class="post-tab-btn ${activeLeftTab === 'code' ? 'active' : ''}" data-lpanel="code">${codeTabLabel} <span class="post-tab-pill">${codeTabPill}</span></button>
          <button type="button" class="post-tab-btn ${activeLeftTab === 'anim' ? 'active' : ''}" data-lpanel="anim">交互动画演示 <span class="post-tab-pill">动画</span></button>
        </div>
        <div class="post-tab-pane ${activeLeftTab === 'question' ? '' : 'hidden'}" data-lpanel-body="question">
          <div class="q-stem">${q.stem}</div>
          ${bodyHTML}
          ${footerHTML}
          <div class="explain-slot"></div>
        </div>
        <div class="post-tab-pane ${activeLeftTab === 'code' ? '' : 'hidden'}" data-lpanel-body="code">
          ${buildPostAnswerCodeTabHTML('question', q, saved, opts.instance)}
        </div>
        <div class="post-tab-pane ${activeLeftTab === 'anim' ? '' : 'hidden'}" data-lpanel-body="anim">
          ${buildPostAnswerAnimTabHTML('question', q)}
        </div>`;
    } else {
      contentAreaHTML = `
        <div class="q-stem">${q.stem}</div>
        ${bodyHTML}
        ${footerHTML}
        <div class="explain-slot">${showExplain ? buildExplainHTML(q, saved, opts) : ''}</div>`;
    }

    return `
      <div class="q-card ${cardCls}" id="${cardId}" data-qid="${q.id}">
        <div class="q-header">
          <div class="q-meta">
            <span class="q-num">${displayIdx}</span>
            <span class="q-type-badge ${tCls}">${tLabel}</span>
            <span class="exam-tag blue">${TOPIC_NAME[q.topic] || MOD_SHORT[q.module] || ''}</span>
            <span class="exam-tag">${q.tag || '核心考点'}</span>
            ${scoreTag}
            ${lockTag}
          </div>
          <div class="q-actions">
            ${!isMock ? `<button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${q.id}">${isFav ? '已收藏' : '收藏'}</button>` : ''}
          </div>
        </div>
        ${contentAreaHTML}
      </div>`;
  }

  function buildSubjectiveReportHTML(ev) {
    if (!ev) return '';
    const passCls = ev.pass ? 'pass' : 'fail';
    const badgeMap = { full: '已命中', partial: '部分命中', miss: '待补充' };
    const rowsHTML = (ev.details || []).map(pt => `
      <div class="ai-pt-row ${pt.status}">
        <div class="ai-pt-top">
          <span class="ai-pt-title">${pt.label}</span>
          <span class="ai-pt-badge ${pt.status}">${badgeMap[pt.status] || '未命中'} · ${pt.earned}/${pt.weight}分</span>
        </div>
        ${pt.hits && pt.hits.length ? `<div class="ai-pt-hits"><span>识别要点：</span>${pt.hits.map(h => `<span class="ai-hit-chip">${escapeHTML(h)}</span>`).join('')}</div>` : ''}
        ${pt.status !== 'full' && pt.missHint ? `<div class="ai-pt-hint"><strong>提分建议：</strong>${pt.missHint}</div>` : ''}
      </div>`).join('');

    return `
      <div class="ai-grade-card">
        <div class="ai-grade-head">
          <strong style="font-size:13.5px;color:var(--text)">智能语义批改报告${ev.branchName ? `（已自动识别：${ev.branchName}）` : ''}</strong>
          <span class="ai-score-pill ${passCls}">${ev.score} / ${ev.maxScore} 分 · ${ev.pass ? '判定正确' : '暂未达标'}</span>
        </div>
        <div class="ai-grade-summary">${ev.summary || ''}</div>
        <div class="ai-pt-list">${rowsHTML}</div>
      </div>`;
  }

  function buildExplainDetailHTML(itemId) {
    const d = window.EXPLAIN_DETAILS && window.EXPLAIN_DETAILS[itemId];
    if (!d) return '';
    return `
      <div class="explain-detail-card">
        <div class="ex-detail-head">
          <span class="ex-detail-badge">深度分步解析</span>
          <span class="ex-detail-sub">为什么这么做 &amp; 一步步怎么实现 / 推导</span>
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

    let mascot = 'teach', verdictCls = 'info', verdictTxt = '参考解析、彩色 C# 示例与交互动画';
    if (isSubj && subjReport) {
      if (subjReport.pass) {
        mascot = subjReport.ratio >= 0.85 ? 'trophy' : 'happy';
        verdictCls = 'ok';
        verdictTxt = `智能语义判定通过！得分 ${subjReport.score} / ${subjReport.maxScore} 分，对应熟练度已上升`;
      } else {
        mascot = 'oops';
        verdictCls = 'bad';
        verdictTxt = `智能评分 ${subjReport.score} / ${subjReport.maxScore} 分（需 ≥ 6 分达标），已加入错题本，请补齐缺失要点`;
      }
    } else if (q.type === 'single' || q.type === 'tf' || q.type === 'fill' || q.subkind === 'fill') {
      if (saved && saved.correct) { mascot = 'happy'; verdictCls = 'ok'; verdictTxt = '回答完全正确！对应小节熟练度已实时上升'; }
      else if (saved && saved.checked && saved.userVal !== undefined && saved.userVal !== null) {
        mascot = 'oops'; verdictCls = 'bad'; verdictTxt = '差一点点，已加入错题本！下方可直接运行 C# 示例与放大观看动画';
      }
    } else if (q.type === 'code') { mascot = 'code'; verdictTxt = '标准 Unity C# 参考代码 + 实时运行沙盒 + 交互动画'; }

    let answerBlock = '';
    if (q.type === 'single') {
      const L = ['A', 'B', 'C', 'D'][q.answer];
      answerBlock = `<div style="margin-bottom:8px"><strong>参考答案：</strong><span style="color:var(--success);font-weight:900">${L}. ${q.options[q.answer]}</span></div>`;
    } else if (q.type === 'tf') {
      answerBlock = `<div style="margin-bottom:8px"><strong>参考答案：</strong><span style="color:var(--success);font-weight:900">${q.answer ? '对（正确）' : '错（错误）'}</span></div>`;
    } else if (q.blanks) {
      answerBlock = `<div style="margin-bottom:8px"><strong>标准答案：</strong>` +
        q.blanks.map(b => `<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;border-radius:6px;background:var(--bg-elevated);border:1px solid var(--border);font-family:var(--font-mono);font-size:12px"><b>${b.label}:</b> <span style="color:var(--success)">${escapeHTML(b.answers[0])}</span></span>`).join('') + `</div>`;
    }

    let rubricHTML = subjReport ? buildSubjectiveReportHTML(subjReport) : '';
    if (q.rubric && !subjReport) {
      rubricHTML += `<div style="margin-top:10px"><strong>考场采分点自查清单：</strong><ul class="rubric-list">` +
        q.rubric.map(r => `<li class="rubric-item"><input type="checkbox"><span>${r}</span></li>`).join('') + `</ul></div>`;
    }
    if (q.modelAnswer) {
      rubricHTML += `<div style="margin-top:8px"><strong>标准参考作答范本：</strong><div class="formula-box" style="white-space:pre-wrap;font-family:var(--font-sans);font-weight:600;line-height:1.7">${escapeHTML(q.modelAnswer)}</div></div>`;
    }
    if (q.modelCode) {
      rubricHTML += `<div style="margin-top:8px"><strong>标准参考 Unity C# 代码（语法着色）：</strong><div class="code-block">${hlCS(q.modelCode)}</div></div>`;
    }

    const demoHTML = q.demo ? buildCodeRunnerHTML([q.demo], `qcs-${q.id}-${Math.random().toString(36).slice(2, 6)}`, true) : '';
    const anim = q.anim || { engine: 'astar', mode: 'ppt', caption: '交互动画演示' };

    const nextCtaHTML = opts.hasNext ? `
      <div class="next-q-cta">
        <span style="font-size:13.5px;font-weight:800;color:var(--text)">本题已作答完毕，看完解析后继续下一题吧！</span>
        <button class="submit-btn inline-next-q-btn">进入下一题 →</button>
      </div>` : '';

    return `
      <div class="explain-box">
        <div class="explain-head">
          <img class="explain-mascot" src="${MASCOTS[mascot] || ''}" alt="大肥鱼">
          <div>
            <div class="explain-verdict ${verdictCls}">${verdictTxt}</div>
            ${answerBlock}
            ${q.explain ? `<div class="explain-text">${q.explain}</div>` : ''}
          </div>
        </div>
        ${nextCtaHTML}
        ${buildExplainDetailHTML(q.id)}
        ${rubricHTML}
        ${demoHTML}
        <div class="explain-anim-wrap" data-ex-engine="${anim.engine}" data-ex-mode="${anim.mode}" data-ex-params='${JSON.stringify(anim.params || {})}' data-ex-title="${escapeHTML(anim.caption)}">
          <div class="explain-anim-bar">
            <span>动画解析：${anim.caption}（点击画面全屏放大）</span>
            <div class="ctrl-group">
              <button class="ctrl-btn primary" style="padding:3px 9px;font-size:11.5px" data-act="play">暂停</button>
              <button class="ctrl-btn" style="padding:3px 9px;font-size:11.5px" data-act="step">单步</button>
              <button class="ctrl-btn" style="padding:3px 9px;font-size:11.5px" data-act="reset">重播</button>
            </div>
          </div>
          <div class="anim-stage-wrap">
            <div class="anim-canvas-box" style="min-height:265px"><canvas class="explain-anim-canvas"></canvas></div>
            <div class="anim-side-panel" style="max-height:265px"></div>
          </div>
        </div>
      </div>`;
  }

  function copyTextWithFallback(text, btnEl) {
    const str = String(text || '');
    const flash = () => {
      if (!btnEl) return;
      const orig = btnEl.dataset.origLabel || btnEl.textContent;
      btnEl.dataset.origLabel = orig;
      btnEl.textContent = '已复制';
      btnEl.classList.add('copied');
      clearTimeout(btnEl._copyTimer);
      btnEl._copyTimer = setTimeout(() => {
        btnEl.textContent = orig;
        btnEl.classList.remove('copied');
      }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str).then(flash).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = str;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
        flash();
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = str;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      ta.remove();
      flash();
    }
  }

  function buildLineNumberedCodeHTML(rawCode, preHighlightedHTML = null) {
    const codeStr = String(rawCode || '');
    const htmlBody = preHighlightedHTML !== null ? preHighlightedHTML : hlCS(codeStr);
    return `
      <div class="rs-code-scroll">
        <div class="rs-gutter" aria-hidden="true">${buildLineNumbers(codeStr)}</div>
        <pre class="rs-code-pre"><code>${htmlBody}</code></pre>
      </div>`;
  }

  function buildFilledTemplatePlain(q) {
    let out = String(q.codeTemplate || '');
    (q.blanks || []).forEach((b, i) => {
      const ans = (b.answers && b.answers[0]) || '';
      out = out.split(`[___空${i + 1}___]`).join(ans);
    });
    return out;
  }

  function buildFilledTemplateHTML(q) {
    let html = hlCS(q.codeTemplate || '');
    (q.blanks || []).forEach((b, i) => {
      const ans = (b.answers && b.answers[0]) || '';
      const rawTok = `<span class="tok-blank">[___空${i + 1}___]</span>`;
      const repTok = `<span class="tok-filled" title="空${i + 1} 标准答案"><em class="tok-filled-idx">空${i + 1}</em>${escapeHTML(ans)}</span>`;
      html = html.split(rawTok).join(repTok);
    });
    return html;
  }

  function captureCardDraft(card, q) {
    if (!card || !q) return undefined;
    if (q.blanks) {
      return Array.from(card.querySelectorAll('.blank-input')).map(x => x.value);
    }
    if (q.type === 'code') {
      const ide = card.querySelector('.q-code-ide');
      return ide ? ide._getCode() : undefined;
    }
    const ta = card.querySelector('.essay-textarea');
    if (q.board && card._boardCtrl) {
      return { text: ta ? ta.value : '', diagram: card._boardCtrl.getData() };
    }
    return ta ? ta.value : undefined;
  }

  function buildPostAnswerCodeTabHTML(itemKind, item, saved, inst) {
    const uidTail = Math.random().toString(36).slice(2, 6);
    if (itemKind === 'drill') {
      const refCode = item.solution || '';
      const mineCode = (saved && typeof saved.userVal === 'string')
        ? saved.userVal
        : ((inst && typeof inst.draftCode === 'string') ? inst.draftCode : (item.starter || ''));
      return `
        <div class="rs-code-card">
          <div class="rs-code-head">
            <div class="rs-code-title">
              <span class="cs-lang-pill">C#</span>
              <span>标准参考 Unity C# 代码</span>
              <span style="font-family:var(--font-mono);font-size:11.5px;color:#34d399">${escapeHTML(item.file || '')}</span>
            </div>
            <div class="rs-code-actions">
              <div class="rs-subtoggle">
                <button type="button" class="rs-subtoggle-btn active" data-code-view="ref">标准参考代码</button>
                <button type="button" class="rs-subtoggle-btn" data-code-view="mine">我的作答代码</button>
              </div>
              <button type="button" class="rs-copy-btn" data-copy-code>复制代码</button>
            </div>
          </div>
          <div class="rs-code-pane" data-code-pane="ref">
            <textarea class="rs-copy-src" hidden readonly>${escapeHTML(refCode)}</textarea>
            ${buildLineNumberedCodeHTML(refCode)}
          </div>
          <div class="rs-code-pane hidden" data-code-pane="mine">
            <textarea class="rs-copy-src" hidden readonly>${escapeHTML(mineCode)}</textarea>
            ${buildLineNumberedCodeHTML(mineCode)}
          </div>
        </div>
        ${item.hint ? `<div class="re-summary-note"><strong>核心实现思路：</strong>${escapeHTML(item.hint)}</div>` : ''}`;
    }

    const demoHTML = (item.demo && DEMOS[item.demo])
      ? buildCodeRunnerHTML([item.demo], `qcs-tab-${item.id}-${uidTail}`, true)
      : '';

    if (item.modelCode) {
      const refCode = item.modelCode;
      const mineCode = (saved && typeof saved.userVal === 'string')
        ? saved.userVal
        : ((inst && typeof inst.draftVal === 'string') ? inst.draftVal : (item.starterCode || ''));
      return `
        <div class="rs-code-card">
          <div class="rs-code-head">
            <div class="rs-code-title">
              <span class="cs-lang-pill">C#</span>
              <span>标准参考 Unity C# 代码（语法着色）</span>
            </div>
            <div class="rs-code-actions">
              ${mineCode ? `
                <div class="rs-subtoggle">
                  <button type="button" class="rs-subtoggle-btn active" data-code-view="ref">标准参考代码</button>
                  <button type="button" class="rs-subtoggle-btn" data-code-view="mine">我的作答代码</button>
                </div>` : ''}
              <button type="button" class="rs-copy-btn" data-copy-code>复制代码</button>
            </div>
          </div>
          <div class="rs-code-pane" data-code-pane="ref">
            <textarea class="rs-copy-src" hidden readonly>${escapeHTML(refCode)}</textarea>
            ${buildLineNumberedCodeHTML(refCode)}
          </div>
          ${mineCode ? `
            <div class="rs-code-pane hidden" data-code-pane="mine">
              <textarea class="rs-copy-src" hidden readonly>${escapeHTML(mineCode)}</textarea>
              ${buildLineNumberedCodeHTML(mineCode)}
            </div>` : ''}
        </div>
        ${demoHTML}`;
    }

    if (item.codeTemplate && item.blanks) {
      const filledPlain = buildFilledTemplatePlain(item);
      const filledHTML = buildFilledTemplateHTML(item);
      const tplPlain = item.codeTemplate;
      const userVals = (saved && Array.isArray(saved.userVal))
        ? saved.userVal
        : ((inst && Array.isArray(inst.draftVal)) ? inst.draftVal : []);
      const compareHTML = item.blanks.map((b, i) => {
        const uv = String(userVals[i] || '').trim();
        let chipCls = '';
        let ok = false;
        if (saved && saved.checked) {
          ok = GRADER
            ? GRADER.matchFillBlank(uv, b.answers)
            : b.answers.some(a => normalizeAns(a) === normalizeAns(uv));
          chipCls = ok ? 'ok' : 'bad';
        }
        return `
          <span class="rs-blank-chip ${chipCls}">
            <strong>${escapeHTML(b.label)}：</strong>
            <span class="rs-blank-ans">${escapeHTML(b.answers[0])}</span>
            ${(saved && saved.checked && !ok) ? `<span class="rs-blank-user">（你填：${escapeHTML(uv || '未填')}）</span>` : ''}
          </span>`;
      }).join('');
      return `
        <div class="rs-code-card">
          <div class="rs-code-head">
            <div class="rs-code-title">
              <span class="cs-lang-pill">C#</span>
              <span>完整填入版参考代码（可直接运行验证）</span>
            </div>
            <div class="rs-code-actions">
              <div class="rs-subtoggle">
                <button type="button" class="rs-subtoggle-btn active" data-code-view="filled">完整填入代码</button>
                <button type="button" class="rs-subtoggle-btn" data-code-view="template">带提示原题模板</button>
              </div>
              <button type="button" class="rs-copy-btn" data-copy-code>复制代码</button>
            </div>
          </div>
          <div class="rs-code-pane" data-code-pane="filled">
            <textarea class="rs-copy-src" hidden readonly>${escapeHTML(filledPlain)}</textarea>
            ${buildLineNumberedCodeHTML(filledPlain, filledHTML)}
          </div>
          <div class="rs-code-pane hidden" data-code-pane="template">
            <textarea class="rs-copy-src" hidden readonly>${escapeHTML(tplPlain)}</textarea>
            ${buildLineNumberedCodeHTML(tplPlain)}
          </div>
          <div class="rs-blanks-compare">${compareHTML}</div>
        </div>
        ${demoHTML}`;
    }

    if (demoHTML) return demoHTML;
    return `<div class="trap-callout">本题暂无配套 C# 示例代码，可切回「题目与作答」或查看「交互动画演示」。</div>`;
  }

  function buildPostAnswerAnimTabHTML(itemKind, item) {
    const anim = itemKind === 'drill'
      ? (item.anim ? { ...item.anim, caption: `${item.file} 实时算法动画演示` } : { engine: 'astar', mode: 'ppt', caption: '交互动画演示' })
      : (item.anim || { engine: 'astar', mode: 'ppt', caption: '交互动画演示' });
    return `
      <div class="explain-anim-wrap" style="margin-top:4px" data-ex-engine="${anim.engine}" data-ex-mode="${anim.mode}" data-ex-params='${JSON.stringify(anim.params || {})}' data-ex-title="${escapeHTML(anim.caption)}">
        <div class="explain-anim-bar">
          <span>动画解析：${escapeHTML(anim.caption)}（点击画面全屏放大）</span>
          <div class="ctrl-group">
            <button type="button" class="ctrl-btn primary" style="padding:3px 9px;font-size:11.5px" data-act="play">暂停</button>
            <button type="button" class="ctrl-btn" style="padding:3px 9px;font-size:11.5px" data-act="step">单步</button>
            <button type="button" class="ctrl-btn" style="padding:3px 9px;font-size:11.5px" data-act="reset">重播</button>
          </div>
        </div>
        <div class="anim-stage-wrap">
          <div class="anim-canvas-box" style="min-height:295px"><canvas class="explain-anim-canvas"></canvas></div>
          <div class="anim-side-panel" style="max-height:295px"></div>
        </div>
      </div>`;
  }

  function buildPostAnswerRightPanelHTML({ itemKind, item, saved, flipMeta, diffInfo, hasNext, activeRightTab = 'explain' }) {
    const topicId = (flipMeta && flipMeta.topic) || item.topic;
    const modId = (flipMeta && flipMeta.module) || item.module;
    const tp = TOPICS.find(t => t.id === topicId) || TOPICS[0];
    const mod = MODULES.find(m => m.id === modId) || MODULES[0];
    const sum = TOPIC_SUMMARIES[tp.id] || TOPIC_SUMMARIES.t_unity;
    const grad = tp ? tp.grad : (mod ? mod.grad : 'grad-ocean');
    const tpMastery = computeTopicMastery(tp.id).pct;
    const diffLabel = (diffInfo && diffInfo.name) ? diffInfo.name : '核心考点';

    let mascot = 'teach', verdictCls = 'info', verdictTxt = '详解与相关知识点已就绪（可直接对照左侧题目或代码）';
    let answerBlock = '';
    let summaryNoteHTML = '';
    let extraExplainHTML = '';

    if (itemKind === 'drill') {
      const ev = saved && saved.evalReport ? saved.evalReport : null;
      if (saved && saved.checked && ev) {
        verdictCls = ev.pass ? 'ok' : 'bad';
        mascot = ev.allOk ? 'trophy' : (ev.pass ? 'happy' : 'oops');
        verdictTxt = ev.allOk
          ? `智能校验全部通过（${ev.passCnt}/${ev.totalCnt} · 100%）！`
          : (ev.pass
            ? `代码检测达标（${ev.score}% · 通过 ${ev.passCnt}/${ev.totalCnt} 项）`
            : `暂未达标（${ev.score}% · 需 ≥ 60%），对照下方分步剖析完善`);
      } else {
        mascot = 'code';
        verdictTxt = '详细步骤剖析与标准参考 C# 实现思路';
      }
      if (item.hint) {
        summaryNoteHTML = `<div class="re-summary-note"><strong>核心思路：</strong>${escapeHTML(item.hint)}</div>`;
      }
      if (saved && saved.checked && ev) {
        extraExplainHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:12px 0 8px">
            <strong style="font-size:13.5px">智能考点诊断（${ev.passCnt}/${ev.totalCnt} · ${ev.score}%）</strong>
            <span class="drill-smart-badge">等价写法 · 数值仿真</span>
          </div>
          <div class="drill-checklist">
            ${ev.checks.map(r => {
              const cls = r.status === 'full' ? 'pass' : (r.status === 'partial' ? 'partial' : 'fail');
              const dot = r.status === 'full' ? 'OK' : (r.status === 'partial' ? '~' : '!');
              return `
                <div class="drill-chk-item ${cls}">
                  <span class="drill-chk-dot">${dot}</span>
                  <div class="drill-chk-body">
                    <div class="drill-chk-title">${escapeHTML(r.label)}</div>
                    ${r.matchNote ? `<div class="drill-chk-match">识别依据：${escapeHTML(r.matchNote)}</div>` : ''}
                    ${r.hint ? `<div class="drill-chk-hint">完善建议：${escapeHTML(r.hint)}</div>` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>`;
      }
    } else {
      const q = item;
      const isSubj = (q.type === 'essay' || (q.type === 'code' && q.subkind === 'write'));
      const subjReport = (isSubj && saved && saved.checked)
        ? (saved.evalReport || (GRADER ? GRADER.evaluateSubjective(q, saved.userVal) : null))
        : null;
      if (isSubj && subjReport) {
        verdictCls = subjReport.pass ? 'ok' : 'bad';
        mascot = subjReport.ratio >= 0.85 ? 'trophy' : (subjReport.pass ? 'happy' : 'oops');
        verdictTxt = subjReport.pass
          ? `智能判定通过（${subjReport.score}/${subjReport.maxScore} 分），熟练度已上升`
          : `智能评分 ${subjReport.score}/${subjReport.maxScore} 分（需 ≥ 6 分），建议补齐缺失要点`;
      } else if (q.type === 'single' || q.type === 'tf' || q.type === 'fill' || q.subkind === 'fill') {
        if (saved && saved.checked) {
          if (saved.correct) { mascot = 'happy'; verdictCls = 'ok'; verdictTxt = '回答完全正确！对应考点熟练度已上升'; }
          else { mascot = 'oops'; verdictCls = 'bad'; verdictTxt = '回答有误，已收入错题本；可对照分步解析巩固'; }
        }
      } else if (q.type === 'code') {
        mascot = 'code';
      }

      if (q.type === 'single') {
        const L = ['A', 'B', 'C', 'D'][q.answer];
        answerBlock = `<div style="margin-bottom:8px;font-size:13px"><strong>参考答案：</strong><span style="color:var(--success);font-weight:900">${L}. ${q.options[q.answer]}</span></div>`;
      } else if (q.type === 'tf') {
        answerBlock = `<div style="margin-bottom:8px;font-size:13px"><strong>参考答案：</strong><span style="color:var(--success);font-weight:900">${q.answer ? '对（正确）' : '错（错误）'}</span></div>`;
      } else if (q.blanks) {
        answerBlock = `<div style="margin-bottom:8px;display:flex;flex-wrap:wrap;gap:5px"><strong style="width:100%;font-size:13px">标准答案：</strong>` +
          q.blanks.map(b => `<span style="display:inline-block;padding:2px 8px;border-radius:6px;background:var(--bg-elevated);border:1px solid var(--border);font-family:var(--font-mono);font-size:11.8px"><b>${b.label}:</b> <span style="color:var(--success)">${escapeHTML(b.answers[0])}</span></span>`).join('') + `</div>`;
      }
      if (q.explain) {
        summaryNoteHTML = `<div class="re-summary-note">${q.explain}</div>`;
      }
      extraExplainHTML = subjReport ? buildSubjectiveReportHTML(subjReport) : '';
      if (q.rubric && !subjReport) {
        extraExplainHTML += `<div style="margin-top:10px"><strong style="font-size:13px">考场采分点自查清单：</strong><ul class="rubric-list">` +
          q.rubric.map(r => `<li class="rubric-item"><input type="checkbox"><span>${r}</span></li>`).join('') + `</ul></div>`;
      }
      if (q.modelAnswer) {
        extraExplainHTML += `<div style="margin-top:10px"><strong style="font-size:13px">标准参考作答范本：</strong><div class="formula-box" style="white-space:pre-wrap;font-family:var(--font-sans);font-weight:600;line-height:1.7">${escapeHTML(q.modelAnswer)}</div></div>`;
      }
    }

    return `
      <aside class="review-explain-sidebar" id="review-explain-sidebar" aria-label="本题解析与关联知识点">
        <div class="re-head">
          <div class="re-head-top">
            <img class="re-mascot" src="${MASCOTS[mascot] || MASCOTS.teach || ''}" alt="大肥鱼">
            <div class="re-head-meta">
              <div class="re-verdict ${verdictCls}">${verdictTxt}</div>
              <div class="re-topic-row">
                <span class="exam-tag blue">${tp.name}</span>
                <span class="exam-tag">熟练度 ${tpMastery}%</span>
              </div>
            </div>
          </div>
          <div class="re-subtabs" role="tablist" aria-label="右侧解析与知识点切换">
            <button type="button" class="re-subtab-btn ${activeRightTab === 'explain' ? 'active' : ''}" data-rpanel="explain">本题详细解析</button>
            <button type="button" class="re-subtab-btn ${activeRightTab === 'knowledge' ? 'active' : ''}" data-rpanel="knowledge">相关知识点</button>
          </div>
        </div>

        <div class="re-body">
          <div class="re-pane ${activeRightTab === 'explain' ? '' : 'hidden'}" data-rpanel-body="explain">
            ${answerBlock}
            ${summaryNoteHTML}
            ${buildExplainDetailHTML(item.id)}
            ${extraExplainHTML}
            <div class="re-rel-preview">
              <div class="re-rel-head">
                <strong style="font-size:13px;color:var(--text)">关联知识点速览</strong>
                <span class="exam-tag blue">${tp.name}</span>
              </div>
              <div class="flip-formula-pill">${escapeHTML(sum.formula)}</div>
              <div class="flip-trap-box"><strong>易错提醒：</strong>${sum.trap}</div>
              <div class="re-rel-actions">
                <button type="button" class="secondary-btn" data-open-rpanel="knowledge" style="padding:5px 11px;font-size:12px">展开完整知识点卡片</button>
                <button type="button" class="submit-btn" data-jump-sec="${tp.id}" style="padding:5px 12px;font-size:12px">去本小节详解 →</button>
              </div>
            </div>
          </div>

          <div class="re-pane ${activeRightTab === 'knowledge' ? '' : 'hidden'}" data-rpanel-body="knowledge">
            <div class="re-kp-card ${grad}">
              <div class="re-kp-banner ${grad}">
                <div>
                  <div style="font-size:11px;opacity:0.9;font-weight:700">${mod.short} · ${mod.lectures}</div>
                  <div style="font-size:15px;font-weight:900">${tp.name}</div>
                </div>
                <span class="m-tier-pill" style="background:rgba(255,255,255,0.2);border-color:rgba(255,255,255,0.34);color:#fff">${diffLabel}</span>
              </div>

              <div class="m-bar-wrap" style="margin:2px 0">
                <div class="m-bar-head" style="font-size:12px"><span>本考点当前熟练度</span><span>${tpMastery}%</span></div>
                <div class="m-bar-track"><div class="m-bar-fill" style="width:${tpMastery}%"></div></div>
              </div>

              <div class="flip-kw-row" style="margin-top:0">
                ${sum.keywords.map(kw => `<span class="flip-kw-pill">${kw}</span>`).join('')}
              </div>

              <div class="flip-formula-pill">${escapeHTML(sum.formula)}</div>
              <ul class="flip-points">
                ${sum.points.map(pt => `<li>${pt}</li>`).join('')}
              </ul>
              <div class="flip-trap-box"><strong>高频易错提醒：</strong>${sum.trap}</div>
              <div class="flip-mini-code">${hlCS(sum.snippet)}</div>
              <button type="button" class="submit-btn" data-jump-sec="${tp.id}" style="width:100%;justify-content:center">去知识回顾查看本小节完整讲义与交互动画 →</button>
            </div>
          </div>
        </div>

        <div class="re-foot">
          <button type="button" class="secondary-btn" id="btn-re-toggle-left" style="flex:1">在左侧查看代码 →</button>
          ${hasNext ? `<button type="button" class="submit-btn inline-next-q-btn" style="flex:1">进入下一题 →</button>` : ''}
        </div>
      </aside>`;
  }

  function prefersReducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch { return false; }
  }

  // 作答完成瞬间：右侧知识摘要卡（正面）3D 翻转到「本题详细解析」面板（背面），动画结束后移除正面残影
  function wrapReviewFlipScene(panelHTML, frontHTML, animate) {
    return `
      <div class="review-flip-scene ${animate ? 'is-animating' : 'is-settled'}" id="review-flip-scene">
        <div class="review-flip-card" id="review-flip-card">
          ${animate ? `<div class="rf-face rf-front" aria-hidden="true">${frontHTML}</div>` : ''}
          <div class="rf-face rf-back">${panelHTML}</div>
        </div>
      </div>`;
  }

  function runReviewFlipIn(rootEl) {
    const scene = rootEl ? rootEl.querySelector('#review-flip-scene') : null;
    const card = scene ? scene.querySelector('#review-flip-card') : null;
    if (!scene || !card) return;
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      const front = scene.querySelector('.rf-front');
      if (front) front.remove();
      scene.classList.remove('is-animating');
      scene.classList.add('is-settled');
      card.classList.remove('flipped');
    };
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('flipped')));
    card.addEventListener('transitionend', (e) => {
      if (e.target === card && e.propertyName === 'transform') settle();
    });
    setTimeout(settle, 1150);
  }

  function bindPostAnswerLayout(rootEl, opts = {}) {
    if (!rootEl) return;
    const onNext = opts.onNext || null;
    const stateHolder = opts.stateHolder || null;
    let curLeftTab = opts.initialLeftTab || (stateHolder && stateHolder.reviewLeftTab) || 'question';

    const syncReFootBtn = () => {
      const footBtn = rootEl.querySelector('#btn-re-toggle-left');
      if (!footBtn) return;
      if (curLeftTab === 'code') {
        footBtn.textContent = '左侧切回题目与作答';
        footBtn.dataset.nextTab = 'question';
      } else {
        footBtn.textContent = '在左侧查看代码 →';
        footBtn.dataset.nextTab = 'code';
      }
    };

    const activateLeftTab = (tabKey) => {
      if (!tabKey) return;
      curLeftTab = tabKey;
      if (stateHolder) stateHolder.reviewLeftTab = tabKey;
      if (opts.onLeftTabChange) opts.onLeftTabChange(tabKey);

      rootEl.querySelectorAll('.post-tab-btn[data-lpanel]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lpanel === tabKey);
      });
      rootEl.querySelectorAll('.post-tab-pane[data-lpanel-body]').forEach(pane => {
        const isTarget = pane.dataset.lpanelBody === tabKey;
        pane.classList.toggle('hidden', !isTarget);
        if (isTarget) {
          if (tabKey === 'code') {
            bindCodeRunners(pane);
            bindIdeEditors(pane);
          } else if (tabKey === 'anim') {
            requestAnimationFrame(() => mountExplainWidgets(pane, onNext));
          }
        }
      });
      syncReFootBtn();
    };

    let curRightTab = (stateHolder && stateHolder.reviewRightTab) || 'explain';
    const applyRightPanes = (rKey) => {
      rootEl.querySelectorAll('.re-subtab-btn[data-rpanel]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.rpanel === rKey);
      });
      rootEl.querySelectorAll('.re-pane[data-rpanel-body]').forEach(pane => {
        pane.classList.toggle('hidden', pane.dataset.rpanelBody !== rKey);
      });
      const bodyEl = rootEl.querySelector('.review-explain-sidebar .re-body');
      if (bodyEl) bodyEl.scrollTop = 0;
    };
    // 右侧「本题详细解析 / 相关知识点」切换：整张卡片 3D 翻面（前半程翻到侧面 → 换内容 → 后半程翻回正面）
    const activateRightTab = (rKey, animate = false) => {
      if (!rKey || rKey === curRightTab) return;
      curRightTab = rKey;
      if (stateHolder) stateHolder.reviewRightTab = rKey;
      if (opts.onRightTabChange) opts.onRightTabChange(rKey);

      const sidebar = rootEl.querySelector('.review-explain-sidebar');
      if (!animate || !sidebar || prefersReducedMotion()) {
        applyRightPanes(rKey);
        return;
      }
      clearTimeout(sidebar._flipT1);
      clearTimeout(sidebar._flipT2);
      sidebar.classList.remove('re-flip-in');
      sidebar.classList.add('re-flip-out');
      sidebar._flipT1 = setTimeout(() => {
        applyRightPanes(curRightTab);
        sidebar.classList.remove('re-flip-out');
        sidebar.classList.add('re-flip-in');
        sidebar._flipT2 = setTimeout(() => sidebar.classList.remove('re-flip-in'), 300);
      }, 220);
    };

    rootEl.querySelectorAll('.post-tab-btn[data-lpanel]').forEach(btn => {
      btn.onclick = () => activateLeftTab(btn.dataset.lpanel);
    });
    rootEl.querySelectorAll('[data-jump-lpanel]').forEach(btn => {
      btn.onclick = () => activateLeftTab(btn.dataset.jumpLpanel);
    });
    const reFootBtn = rootEl.querySelector('#btn-re-toggle-left');
    if (reFootBtn) {
      reFootBtn.onclick = () => activateLeftTab(reFootBtn.dataset.nextTab || (curLeftTab === 'code' ? 'question' : 'code'));
    }

    rootEl.querySelectorAll('.re-subtab-btn[data-rpanel]').forEach(btn => {
      btn.onclick = () => activateRightTab(btn.dataset.rpanel, true);
    });
    rootEl.querySelectorAll('[data-open-rpanel]').forEach(btn => {
      btn.onclick = () => activateRightTab(btn.dataset.openRpanel, true);
    });

    rootEl.querySelectorAll('[data-jump-sec]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        switchView('knowledge');
        selectSection(btn.dataset.jumpSec, true);
      };
    });

    rootEl.querySelectorAll('.rs-code-card').forEach(card => {
      card.querySelectorAll('.rs-subtoggle-btn[data-code-view]').forEach(btn => {
        btn.onclick = () => {
          const viewKey = btn.dataset.codeView;
          card.querySelectorAll('.rs-subtoggle-btn[data-code-view]').forEach(b => b.classList.toggle('active', b === btn));
          card.querySelectorAll('.rs-code-pane[data-code-pane]').forEach(p => {
            p.classList.toggle('hidden', p.dataset.codePane !== viewKey);
          });
        };
      });
      const copyBtn = card.querySelector('[data-copy-code]');
      if (copyBtn) {
        copyBtn.onclick = () => {
          const activePane = card.querySelector('.rs-code-pane:not(.hidden)') || card.querySelector('.rs-code-pane');
          const rawSrc = activePane ? activePane.querySelector('.rs-copy-src') : null;
          const text = rawSrc ? rawSrc.value : (activePane?.querySelector('.rs-code-pre')?.textContent || '');
          copyTextWithFallback(text, copyBtn);
        };
      }
    });

    if (onNext) {
      rootEl.querySelectorAll('.inline-next-q-btn').forEach(btn => { btn.onclick = onNext; });
    }

    activateLeftTab(curLeftTab);
  }

  function mountExplainWidgets(cardEl, onNextCb) {
    bindIdeEditors(cardEl);
    bindCodeRunners(cardEl);
    if (onNextCb) {
      cardEl.querySelectorAll('.inline-next-q-btn').forEach(btn => { btn.onclick = onNextCb; });
    }

    cardEl.querySelectorAll('.explain-anim-wrap').forEach(wrap => {
      if (wrap.dataset.mounted || wrap.closest('.hidden')) return;
      wrap.dataset.mounted = '1';
      let params = {};
      try { params = JSON.parse(wrap.dataset.exParams || '{}'); } catch {}
      window.AnimEngine.mount(wrap, wrap.dataset.exEngine, { mode: wrap.dataset.exMode, params });
      attachCanvasZoomBehavior(wrap, {
        engine: wrap.dataset.exEngine, mode: wrap.dataset.exMode, params,
        title: wrap.dataset.exTitle || '题目解析动画全屏预览'
      });
    });
  }

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

  function gradeQuestion(q, userVal) {
    return evaluateQuestion(q, userVal).correct;
  }

  function bindQuestionCardEvents(host, opts = {}) {
    const isMock = !!opts.mockMode;
    const onAfterCheck = opts.onAfterCheck || null;
    const onNext = opts.onNext || null;

    bindIdeEditors(host, (val, shell) => {
      if (isMock && shell.classList.contains('q-code-ide')) {
        const card = shell.closest('.q-card');
        if (card) { state.mockExam.userAnswers[card.dataset.qid] = val; updateMockSheetStatus(); }
      } else if (!isMock && opts.instance && shell.classList.contains('q-code-ide')) {
        opts.instance.draftVal = val;
      }
    });

    host.querySelectorAll('.q-card').forEach(card => {
      const qid = card.dataset.qid;
      const q = BANK.find(x => x.id === qid);
      if (!q) return;

      const curSavedAtMount = isMock
        ? (state.mockExam?.submitted ? { userVal: state.mockExam.userAnswers[qid], evalReport: evaluateQuestion(q, state.mockExam.userAnswers[qid]).evalReport, checked: true } : { userVal: state.mockExam?.userAnswers[qid], checked: false })
        : (opts.instance ? opts.instance.ans : (state.answers[qid] || null));
      const cardLocked = (!!opts.lockAfterAnswer && !!(curSavedAtMount && curSavedAtMount.checked)) || (isMock && !!state.mockExam?.submitted);

      // Mount Graded Diagram Board (FSM / BT / PathGrid) if present
      let boardCtrl = null;
      const boardWrap = Array.from(card.querySelectorAll('.diagram-board-wrap')).find(el => !el.closest('.scratch-host') && !el.closest('.ig-board-host'));
      if (q.board && BOARD && boardWrap && !boardWrap.dataset.mounted) {
        boardWrap.dataset.mounted = '1';
        const initUv = (curSavedAtMount && curSavedAtMount.userVal !== undefined)
          ? curSavedAtMount.userVal
          : (opts.instance ? opts.instance.draftVal : undefined);
        const initDia = (initUv && typeof initUv === 'object' && !Array.isArray(initUv)) ? initUv.diagram : null;
        boardCtrl = BOARD.mountBoard(boardWrap, q.board, {
          initialData: initDia,
          isLocked: cardLocked,
          evalResult: curSavedAtMount?.evalReport?.diagramEval || null,
          onChange: (nextDia) => {
            if (isMock && state.mockExam && !state.mockExam.submitted) {
              const curTxt = card.querySelector('.essay-textarea')?.value || '';
              state.mockExam.userAnswers[qid] = { text: curTxt, diagram: nextDia };
              updateMockSheetStatus();
            } else if (!isMock && opts.instance && !cardLocked) {
              const curTxt = card.querySelector('.essay-textarea')?.value || '';
              opts.instance.draftVal = { text: curTxt, diagram: nextDia };
            }
          }
        });
        card._boardCtrl = boardCtrl;
      }

      // Mount Optional Non-Graded Scratchpad Pathfinding Board (e1..e4) if present
      const scratchBtn = card.querySelector('.scratch-toggle-btn');
      const scratchHost = card.querySelector('.scratch-host');
      if (q.scratchBoard && BOARD && scratchBtn && scratchHost) {
        scratchBtn.onclick = () => {
          const isOpen = !scratchHost.classList.contains('hidden');
          scratchHost.classList.toggle('hidden', isOpen);
          scratchBtn.textContent = isOpen ? '展开寻路演草画板（草稿 · 不计分）' : '收起寻路演草画板';
          const scWrap = scratchHost.querySelector('.diagram-board-wrap');
          if (!isOpen && scWrap && !scWrap.dataset.mounted) {
            scWrap.dataset.mounted = '1';
            BOARD.mountBoard(scWrap, q.scratchBoard, {
              initialData: card._scratchData || null,
              isLocked: false,
              onChange: (next) => { card._scratchData = next; }
            });
          }
        };
      }

      // Mount Interactive Graded A* 28-Grid PathBoard (f6) synced with Blank Input
      const igWrap = card.querySelector('.ig-board-host .diagram-board-wrap');
      if (q.interactiveGrid && BOARD && igWrap && !igWrap.dataset.mounted) {
        igWrap.dataset.mounted = '1';
        const ig = q.interactiveGrid;
        const bIdx = ig.syncBlankIdx ?? 5;
        const pathInput = card.querySelector(`.blank-input[data-bidx="${bIdx}"]`);
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
          const clickOrigin = getEventOrigin(e, btn);
          const val = q.type === 'single' ? Number(btn.dataset.opt) : (btn.dataset.tf === 'true');
          if (isMock) {
            if (state.mockExam.submitted) return;
            state.mockExam.userAnswers[qid] = val;
            card.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            updateMockSheetStatus();
          } else {
            const curSaved = opts.instance ? opts.instance.ans : state.answers[qid];
            if (opts.lockAfterAnswer && curSaved?.checked) return;
            const correct = gradeQuestion(q, val);
            const rec = { userVal: val, correct, checked: true };
            if (opts.instance) {
              opts.instance.ans = rec;
              opts.instance.peekExplain = false;
              opts.instance.reviewLeftTab = 'question';
            }
            state.answers[qid] = rec;
            saveState(); updateGlobalStats();
            if (correct) {
              state.streak++;
              launchFireworks(state.streak >= 3 ? 2 : 1, clickOrigin);
              setCompanion(state.streak >= 3 ? 'trophy' : 'happy', state.streak >= 3 ? `礼花绽放！已经连对 ${state.streak} 题，难度曲线正在自动爬升！` : '回答正确！礼花为你绽放，看完解析点击进入下一题。', 3600);
            } else {
              state.streak = 0;
              if (window.DshPetAssistant && typeof window.DshPetAssistant.onWrongAnswer === 'function') {
                window.DshPetAssistant.onWrongAnswer({ itemKind: 'question', item: q, userVal: val, evalReport: null, topicSummaries: TOPIC_SUMMARIES });
              } else {
                setCompanion('oops', '差一点点，本题已锁定并收入错题本，翻开右侧知识卡速记后继续下一题吧！', 4000);
              }
            }
            if (opts.onAnswerResult) opts.onAnswerResult(correct);
            if (onAfterCheck) onAfterCheck();
            else rerenderSingleCard(card, q, opts);
          }
        };
      });

      if (isMock) {
        card.querySelectorAll('.blank-input').forEach(inp => {
          inp.oninput = () => {
            state.mockExam.userAnswers[qid] = Array.from(card.querySelectorAll('.blank-input')).map(x => x.value);
            updateMockSheetStatus();
          };
        });
        const ta = card.querySelector('.essay-textarea');
        if (ta) ta.oninput = () => {
          if (q.board && card._boardCtrl) {
            state.mockExam.userAnswers[qid] = { text: ta.value, diagram: card._boardCtrl.getData() };
          } else {
            state.mockExam.userAnswers[qid] = ta.value;
          }
          updateMockSheetStatus();
        };
      } else if (opts.instance && !cardLocked) {
        card.querySelectorAll('.blank-input').forEach(inp => {
          inp.oninput = () => {
            opts.instance.draftVal = Array.from(card.querySelectorAll('.blank-input')).map(x => x.value);
          };
        });
        const ta = card.querySelector('.essay-textarea');
        if (ta) ta.oninput = () => {
          opts.instance.draftVal = (q.board && card._boardCtrl)
            ? { text: ta.value, diagram: card._boardCtrl.getData() }
            : ta.value;
        };
      }

      const checkBtn = card.querySelector('[data-check]');
      if (checkBtn) checkBtn.onclick = (e) => {
        const curSaved = opts.instance ? opts.instance.ans : state.answers[qid];
        if (opts.lockAfterAnswer && curSaved?.checked) return;
        const clickOrigin = getEventOrigin(e, checkBtn);
        let userVal = null;
        if (q.type === 'single' || q.type === 'tf') userVal = curSaved?.userVal ?? null;
        else if (q.blanks) userVal = Array.from(card.querySelectorAll('.blank-input')).map(x => x.value);
        else if (q.type === 'code') userVal = card.querySelector('.q-code-ide')?._getCode() || '';
        else if (q.board && card._boardCtrl) userVal = { text: card.querySelector('.essay-textarea')?.value || '', diagram: card._boardCtrl.getData() };
        else userVal = card.querySelector('.essay-textarea')?.value || '';
        const isObj = (q.type === 'single' || q.type === 'tf' || q.type === 'fill' || q.subkind === 'fill');
        const { correct, evalReport } = evaluateQuestion(q, userVal);
        const rec = { userVal, correct, checked: true, evalReport };
        if (opts.instance) {
          opts.instance.ans = rec;
          opts.instance.peekExplain = false;
          opts.instance.reviewLeftTab = 'question';
        }
        state.answers[qid] = rec;
        saveState(); updateGlobalStats();
        if (correct) {
          state.streak++;
          const boost = (evalReport && evalReport.ratio >= 0.85) || state.streak >= 3 ? 2 : 1;
          launchFireworks(boost, clickOrigin);
          if (isObj) {
            setCompanion(state.streak >= 3 ? 'trophy' : 'happy', state.streak >= 3 ? `太强啦！已连对 ${state.streak} 题，礼花绽放！` : '全部答对！礼花庆祝，对应小节熟练度已上升！', 3800);
          } else {
            setCompanion(evalReport && evalReport.ratio >= 0.85 ? 'trophy' : 'happy', `智能评分 ${evalReport ? evalReport.score : 8}/${evalReport ? evalReport.maxScore : 10} 分！思路达标，礼花绽放！`, 4000);
          }
        } else {
          state.streak = 0;
          if (window.DshPetAssistant && typeof window.DshPetAssistant.onWrongAnswer === 'function') {
            window.DshPetAssistant.onWrongAnswer({ itemKind: 'question', item: q, userVal, evalReport, topicSummaries: TOPIC_SUMMARIES });
          } else if (isObj) {
            setCompanion('oops', '有空填错了，已自动收入错题本！对照解析和右侧翻牌卡片立刻巩固。', 4200);
          } else {
            setCompanion('oops', `智能评分 ${evalReport ? evalReport.score : 0}/${evalReport ? evalReport.maxScore : 10} 分（需 ≥ 6 分），已精准标出缺失要点！`, 4500);
          }
        }
        if (opts.onAnswerResult) opts.onAnswerResult(correct);
        if (onAfterCheck) onAfterCheck();
        else rerenderSingleCard(card, q, opts);
      };

      const animBtn = card.querySelector('[data-toggle-anim]');
      if (animBtn) animBtn.onclick = () => {
        if (typeof opts.onTogglePeekExplain === 'function') {
          if (opts.instance) opts.instance.draftVal = captureCardDraft(card, q);
          opts.onTogglePeekExplain();
          return;
        }
        const slot = card.querySelector('.explain-slot');
        if (slot.innerHTML.trim()) { slot.innerHTML = ''; return; }
        const curSaved = opts.instance ? opts.instance.ans : state.answers[qid];
        slot.innerHTML = buildExplainHTML(q, curSaved || { checked: false }, opts);
        mountExplainWidgets(card, onNext);
      };

      const redoBtn = card.querySelector('[data-redo]');
      if (redoBtn) redoBtn.onclick = () => {
        delete state.answers[qid]; saveState(); updateGlobalStats();
        if (onAfterCheck) onAfterCheck();
        else rerenderSingleCard(card, q, opts);
      };

      const resetStarterBtn = card.querySelector('.q-reset-starter-btn');
      if (resetStarterBtn && q.starterCode) resetStarterBtn.onclick = () => {
        const ide = card.querySelector('.q-code-ide');
        if (ide) ide._setCode(q.starterCode);
        if (opts.instance) opts.instance.draftVal = q.starterCode;
        if (isMock && state.mockExam && !state.mockExam.submitted) {
          state.mockExam.userAnswers[qid] = q.starterCode;
          updateMockSheetStatus();
        }
      };
    });
  }

  function rerenderSingleCard(oldCard, q, opts = {}) {
    const idx = oldCard.querySelector('.q-num')?.textContent || '1';
    const tmp = document.createElement('div');
    tmp.innerHTML = renderQuestionCard(q, idx, opts);
    const newCard = tmp.firstElementChild;
    oldCard.replaceWith(newCard);
    bindQuestionCardEvents(newCard.parentElement || newCard, opts);
    mountExplainWidgets(newCard, opts.onNext);
  }

  /* ========================================================================
     VIEW 3: PRACTICE MODE (随机刷题练习+难度曲线+3D翻牌 | 手动代码 | 100分模拟)
     STRICT ONE-QUESTION-PER-PAGE PAGINATION!
     ======================================================================== */
  let mockTimerId = null;

  function buildDiffPipsSVG(n) {
    let s = '<span style="display:inline-flex;gap:3px;vertical-align:middle" aria-hidden="true">';
    for (let i = 1; i <= 4; i++) {
      s += `<span style="width:7px;height:7px;border-radius:50%;display:inline-block;background:${i <= n ? 'currentColor' : 'rgba(148,163,184,0.35)'}"></span>`;
    }
    return s + '</span>';
  }

  const DIFF_META = {
    1: { lv: 1, name: 'Lv.1 入门热身', cls: 'diff-lv1', stars: buildDiffPipsSVG(1), desc: '基础概念唤醒，建立手感' },
    2: { lv: 2, name: 'Lv.2 核心巩固', cls: 'diff-lv2', stars: buildDiffPipsSVG(2), desc: '核心机制与公式运用' },
    3: { lv: 3, name: 'Lv.3 进阶推演', cls: 'diff-lv3', stars: buildDiffPipsSVG(3), desc: '高频填空、A*与综合计算' },
    4: { lv: 4, name: 'Lv.4 期末攻坚', cls: 'diff-lv4', stars: buildDiffPipsSVG(4), desc: '压轴作答与 C# 编程实战' }
  };

  function getQuestionDifficulty(q) {
    if (!q) return 1;
    if (q.type === 'code' && q.subkind === 'fill') {
      return (q.id === 'c1' || q.id === 'c3') ? 2 : 3;
    }
    if (q.type === 'essay' || q.type === 'code') return 4;
    if (q.type === 'fill') return 3;
    if (q.type === 'tf') {
      return (q.module === 'm4' || q.module === 'm5' || q.module === 'm6') ? 2 : 1;
    }
    const hasCalc = /[=+\-*/×÷√]|f\(|g\(|h\(|cos|sin|Deg2Rad|Dot|%|时间|距离|速度|像素|坐标|向量/.test(q.stem || '');
    if (q.module === 'm4' || q.module === 'm6') return hasCalc ? 3 : 2;
    if (hasCalc) return 2;
    if (q.module === 'm1' || q.module === 'm2') return 1;
    return 2;
  }

  function getDrillDifficulty(d) {
    if (!d) return 3;
    return (d.id === 'd1' || d.id === 'd4' || d.id === 'd5') ? 3 : 4;
  }

  // Unified Unlimited Pool: ALL 81 Question Bank items + ALL 9 Hands-On C# Coding Drills merged!
  function getPracticePool(focusScope = null) {
    const unified = [
      ...BANK.map(q => ({
        kind: 'question',
        refId: q.id,
        item: q,
        mod: q.module,
        topic: q.topic,
        diffLv: getQuestionDifficulty(q),
        isCoding: q.type === 'code'
      })),
      ...DRILLS.map(d => ({
        kind: 'drill',
        refId: d.id,
        item: d,
        mod: d.module,
        topic: d.topic,
        diffLv: getDrillDifficulty(d),
        isCoding: true
      }))
    ];

    if (!focusScope) return unified;
    const filtered = unified.filter(entry => {
      if (focusScope.codingOnly) return entry.isCoding;
      if (focusScope.topic) return entry.topic === focusScope.topic;
      if (focusScope.mod) return entry.mod === focusScope.mod;
      return true;
    });
    return filtered.length ? filtered : unified;
  }

  // Truly unlimited random draw: adaptive behind-the-scenes difficulty curve + anti-repeat window + coding mix
  function drawNextPracticeItem() {
    const pool = getPracticePool(state.focusScope);
    if (!pool.length) return null;

    const cooldown = Math.min(Math.max(1, pool.length - 1), 16);
    const recentIds = new Set(state.practiceHistory.slice(-cooldown).map(h => h.refId));
    let candidates = pool.filter(e => !recentIds.has(e.refId));
    if (!candidates.length) candidates = pool;

    // Anti-starvation coding boost: if none of the last 4 drawn items was a coding question, boost coding probability
    const last4 = state.practiceHistory.slice(-4);
    const needsCodingMix = last4.length >= 3 && !last4.some(h => h.isCoding);

    const targetLv = Math.round(state.curveLevel);
    const weighted = candidates.map(c => {
      const dist = Math.abs(c.diffLv - targetLv);
      let w = dist === 0 ? 5.2 : (dist === 1 ? 2.8 : (dist === 2 ? 1.2 : 0.55));
      // Mild priority for not-yet-mastered or previously wrong items
      const mastered = c.kind === 'drill'
        ? !!state.passedDrills[c.refId]
        : Boolean(state.answers[c.refId]?.checked && state.answers[c.refId]?.correct);
      if (!mastered) w *= 1.35;
      if (needsCodingMix && c.isCoding) w *= 3.4;
      return { c, w };
    });

    const sumW = weighted.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * sumW;
    let chosen = weighted[weighted.length - 1].c;
    for (const x of weighted) {
      r -= x.w;
      if (r <= 0) { chosen = x.c; break; }
    }

    state.practiceSeq = (state.practiceSeq || 0) + 1;
    const inst = {
      uid: `p_${state.practiceSeq}`,
      kind: chosen.kind,
      refId: chosen.refId,
      mod: chosen.mod,
      topic: chosen.topic,
      diffLv: chosen.diffLv,
      isCoding: chosen.isCoding,
      ans: null,
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

  function adaptDifficultyCurve(correct) {
    if (correct) state.curveLevel = Math.min(4.0, state.curveLevel + 0.45);
    else state.curveLevel = Math.max(1.0, state.curveLevel - 0.55);
  }

  function buildFlipSummaryCardHTML(meta, diffInfo) {
    const tp = TOPICS.find(t => t.id === meta.topic) || TOPICS[0];
    const mod = MODULES.find(m => m.id === meta.module) || MODULES[0];
    const sum = TOPIC_SUMMARIES[meta.topic] || TOPIC_SUMMARIES.t_unity;
    const svgBg = CARD_SVGS[meta.topic] || CARD_SVGS[meta.module] || '';
    const grad = tp ? tp.grad : (mod ? mod.grad : 'grad-ocean');
    const tpMastery = computeTopicMastery(meta.topic).pct;

    return `
      <aside class="flip-sidebar">
        <div class="flip-scene">
          <div class="flip-card ${state.cardFlipped ? 'flipped' : 'dealing'}" id="summary-flip-card" role="button" tabindex="0" aria-label="翻转查看本题知识点摘要">
            <!-- FRONT FACE -->
            <div class="flip-face flip-front ${grad}">
              <div class="flip-front-inner">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                  <span class="m-tier-pill"><span class="aero-led"></span>知识点摘要卡 · 正面</span>
                  <span class="m-tier-pill">${diffInfo.stars}</span>
                </div>

                <div class="flip-svg-hero" aria-hidden="true">
                  ${svgBg}
                  <img class="flip-front-mascot-badge" src="${MASCOTS[sum.mascot] || MASCOTS.teach}" alt="大肥鱼提示">
                </div>

                <div class="flip-front-plate">
                  <div style="font-size:11.5px;color:var(--text-muted);font-weight:700;margin-bottom:3px">${mod.short} · ${mod.lectures}</div>
                  <div style="font-size:16px;font-weight:900;line-height:1.35;margin-bottom:8px;color:var(--text)">${tp.name}</div>
                  <div class="m-bar-wrap" style="margin:6px 0 8px">
                    <div class="m-bar-head" style="font-size:11px"><span>本考点当前熟练度</span><span>${tpMastery}%</span></div>
                    <div class="m-bar-track"><div class="m-bar-fill" style="width:${tpMastery}%"></div></div>
                  </div>
                  <div class="flip-kw-row">
                    ${sum.keywords.map(kw => `<span class="flip-kw-pill">${kw}</span>`).join('')}
                  </div>
                </div>

                <div>
                  <button type="button" class="flip-cta-btn" id="btn-flip-front">点击翻牌 · 查看本考点核心摘要 ↻</button>
                  <div class="flip-front-hint" style="margin-top:8px">卡壳时点卡片任意处即可 3D 翻转查看公式与避坑要点</div>
                </div>
              </div>
            </div>

            <!-- BACK FACE -->
            <div class="flip-face flip-back">
              <div class="flip-back-head ${grad}">
                <div>
                  <div style="font-size:10.5px;opacity:0.88;font-weight:700">知识点速记摘要 · 背面</div>
                  <div style="font-size:14.5px;font-weight:900">${tp.name}</div>
                </div>
                <span class="m-tier-pill">${diffInfo.name}</span>
              </div>

              <div class="flip-back-body">
                <div class="flip-formula-pill">${escapeHTML(sum.formula)}</div>
                <ul class="flip-points">
                  ${sum.points.map(pt => `<li>${pt}</li>`).join('')}
                </ul>
                <div class="flip-trap-box"><strong>易错提醒：</strong>${sum.trap}</div>
                <div class="flip-mini-code">${hlCS(sum.snippet)}</div>
              </div>

              <div class="flip-back-foot">
                <button type="button" class="secondary-btn" id="btn-flip-back">翻回正面 ↻</button>
                <button type="button" class="submit-btn" id="btn-flip-jump" data-jump-sec="${meta.topic}">去本小节详解 →</button>
              </div>
            </div>
          </div>
        </div>
      </aside>`;
  }

  /* ========================================================================
     INLINE HANDS-ON C# CODING DRILL CARD (Merged inside Unlimited Practice!)
     ======================================================================== */
  function renderInlineDrillCard(inst, d, displayIdx, opts = {}) {
    const saved = inst.ans || null;
    const isLocked = !!(saved && saved.checked);
    const isSplitReview = !!opts.splitReview;
    const activeLeftTab = opts.activeLeftTab || 'question';
    const curCode = isLocked ? (saved.userVal || d.starter) : (inst.draftCode !== null ? inst.draftCode : d.starter);
    const cardCls = isLocked ? (saved.correct ? 'is-correct' : 'is-wrong') : '';
    const ev = saved?.evalReport || null;

    let reportHTML = '';
    if (isLocked && ev && !isSplitReview) {
      const verdictCls = ev.pass ? 'ok' : 'bad';
      const mascotKey = ev.allOk ? 'trophy' : (ev.pass ? 'happy' : 'oops');
      const verdictTxt = ev.allOk
        ? `智能语义与数值仿真全部通过（${ev.passCnt}/${ev.totalCnt} · 100%）！对应小节熟练度已提升`
        : (ev.pass
          ? `智能检测判定达标（${ev.score}%，通过 ${ev.passCnt}/${ev.totalCnt} 项），可对照下方参考代码完善至满分`
          : `暂未达标（${ev.score}%，需 ≥ 60%），本题已锁定，请对照诊断清单与参考代码巩固！`);
      reportHTML = `
        <div class="locked-notice-bar" style="margin-top:12px">
          <span>本题已作答锁定（无论对错不可改选），查看智能诊断与参考代码后请继续下一题</span>
          <button class="submit-btn inline-next-q-btn" style="padding:7px 14px;font-size:12.5px">进入下一题 →</button>
        </div>
        <div class="explain-box" style="margin-top:14px">
          <div class="explain-head">
            <img class="explain-mascot" src="${MASCOTS[mascotKey] || ''}" alt="大肥鱼">
            <div>
              <div class="explain-verdict ${verdictCls}">${verdictTxt}</div>
              <div class="explain-text"><strong>核心思路：</strong>${escapeHTML(d.hint)}</div>
            </div>
          </div>
          ${buildExplainDetailHTML(d.id)}
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:10px 0 8px">
            <strong style="font-size:14px">智能代码考点诊断清单（${ev.passCnt} / ${ev.totalCnt} 通过 · ${ev.score}%）</strong>
            <span class="drill-smart-badge">支持等价写法 · 数值仿真校验</span>
          </div>
          <div class="drill-checklist">
            ${ev.checks.map(r => {
              const cls = r.status === 'full' ? 'pass' : (r.status === 'partial' ? 'partial' : 'fail');
              const dot = r.status === 'full' ? 'OK' : (r.status === 'partial' ? '~' : '!');
              return `
                <div class="drill-chk-item ${cls}">
                  <span class="drill-chk-dot">${dot}</span>
                  <div class="drill-chk-body">
                    <div class="drill-chk-title">${escapeHTML(r.label)}</div>
                    ${r.matchNote ? `<div class="drill-chk-match">识别依据：${escapeHTML(r.matchNote)}</div>` : ''}
                    ${r.hint ? `<div class="drill-chk-hint">完善建议：${escapeHTML(r.hint)}</div>` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>
          <div style="margin-top:14px">
            <strong>标准参考 Unity C# 代码（语法着色）：</strong>
            <div class="code-block" style="margin-top:6px">${hlCS(d.solution)}</div>
          </div>
        </div>`;
    } else if (isLocked && isSplitReview) {
      reportHTML = `
        <div class="locked-notice-bar" style="margin-top:12px">
          <span>本题已作答锁定，右侧可同步查看分步剖析与考点诊断清单</span>
          <div class="post-quick-actions">
            <button type="button" class="secondary-btn" data-jump-lpanel="code" style="padding:7px 13px;font-size:12.5px">切看标准参考代码 →</button>
            <button class="submit-btn inline-next-q-btn" style="padding:7px 14px;font-size:12.5px">进入下一题 →</button>
          </div>
        </div>`;
    }

    const consoleInitHTML = isLocked && ev
      ? `<div class="cs-console-line info">> [智能代码引擎] ${d.file} 语义解析与多用例仿真完成</div>` +
        ev.checks.map(r => {
          const tag = r.status === 'full' ? 'PASS' : (r.status === 'partial' ? 'PART' : 'MISS');
          const detail = r.status === 'full' && r.matchNote ? ` (${r.matchNote})` : '';
          return `<div class="cs-console-line ${r.status === 'full' ? '' : 'warn'}">> [${tag}] ${escapeHTML(r.label)}${escapeHTML(detail)}</div>`;
        }).join('') +
        `<div class="cs-console-line info">> 最终得分：${ev.score}%（${ev.passCnt}/${ev.totalCnt} 项通过）</div>`
      : `<div class="cs-console-line info">[等待提交] 补全上方 // TODO 后点击「提交代码并智能检测」——支持变量重命名、交换律与任意等价 C# 写法。</div>`;

    const explainBtnLabel = (!isLocked && isSplitReview && opts.peekExplain) ? '收起解析面板' : '直接展开详细解析';
    const editorH = (isLocked && isSplitReview) ? 245 : 320;
    const outputPaneHTML = (isLocked && isSplitReview)
      ? `<div class="cs-output-pane" style="grid-template-columns:1fr">
           <div class="cs-editor-bar"><span>智能语义与数值仿真检测控制台</span><span>自动评分</span></div>
           <div class="cs-console-box" id="drill-console" style="border-right:none">${consoleInitHTML}</div>
         </div>`
      : `<div class="cs-output-pane">
           <div class="cs-editor-bar"><span>智能语义与数值仿真检测台 &amp; 动画效果（点击画面放大）</span><span>自动评分</span></div>
           <div class="cs-console-box" id="drill-console">${consoleInitHTML}</div>
           <div class="cs-preview-wrap" id="drill-preview">
             <canvas></canvas>
             ${!isLocked ? `
               <div class="cs-preview-placeholder" id="drill-ph">
                 <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                 <span>提交代码即可查看智能诊断与实时运行动画</span>
               </div>` : ''}
           </div>
         </div>`;

    const mainBodyHTML = `
      <div class="q-stem" style="margin-bottom:12px">
        <div style="font-weight:900;margin-bottom:4px">${d.title}</div>
        <div style="font-size:13.5px;color:var(--text-sec);font-weight:600">${d.desc}</div>
      </div>

      <div class="cs-runner-card" style="margin-bottom:0">
        <div class="cs-runner-head">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="cs-lang-pill">C#</span>
            <strong style="font-family:var(--font-mono);font-size:12.5px">${d.file}</strong>
          </div>
          <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
            ${!isLocked ? `
              <button class="ctrl-btn" id="btn-drill-hint" style="padding:5px 10px;font-size:11.5px;background:rgba(255,255,255,0.08);color:#fde047;border-color:rgba(253,224,71,0.35)">提示思路</button>
              <button class="ctrl-btn" id="btn-drill-explain" style="padding:5px 10px;font-size:11.5px;background:rgba(56,189,248,0.16);color:#bae6fd;border-color:rgba(56,189,248,0.45)">${explainBtnLabel}</button>
              <button class="ctrl-btn" id="btn-drill-reset" style="padding:5px 10px;font-size:11.5px;background:rgba(255,255,255,0.08);color:#e2eeff;border-color:rgba(148,163,184,0.3)">重置骨架</button>
              <button class="cs-run-btn" id="btn-drill-check">▶ 提交代码并智能检测（提交后锁定）</button>
            ` : `<span style="font-size:12px;color:#7dd3fc;font-weight:700">已完成智能检测并锁定</span>`}
          </div>
        </div>
        <div class="cs-runner-grid">
          <div class="cs-editor-pane">
            <div class="cs-editor-bar"><span>手写编码区（Tab 缩进 · 支持等价写法与数值仿真自动判定）</span><span>Unity C#</span></div>
            ${buildIdeEditorHTML(curCode, 'drill-ide-box', editorH, isLocked)}
          </div>
          ${outputPaneHTML}
        </div>
      </div>

      <div id="drill-hint-slot"></div>
      <div id="drill-explain-slot"></div>
      ${reportHTML}`;

    let drillContentHTML = mainBodyHTML;
    if (isSplitReview) {
      drillContentHTML = `
        <div class="post-card-tabs" role="tablist" aria-label="编程题作答后视图切换">
          <button type="button" class="post-tab-btn ${activeLeftTab === 'question' ? 'active' : ''}" data-lpanel="question">题目与编码</button>
          <button type="button" class="post-tab-btn ${activeLeftTab === 'code' ? 'active' : ''}" data-lpanel="code">标准参考代码 <span class="post-tab-pill">C#</span></button>
          <button type="button" class="post-tab-btn ${activeLeftTab === 'anim' ? 'active' : ''}" data-lpanel="anim">运行动画效果 <span class="post-tab-pill">动画</span></button>
        </div>
        <div class="post-tab-pane ${activeLeftTab === 'question' ? '' : 'hidden'}" data-lpanel-body="question">
          ${mainBodyHTML}
        </div>
        <div class="post-tab-pane ${activeLeftTab === 'code' ? '' : 'hidden'}" data-lpanel-body="code">
          ${buildPostAnswerCodeTabHTML('drill', d, saved, inst)}
        </div>
        <div class="post-tab-pane ${activeLeftTab === 'anim' ? '' : 'hidden'}" data-lpanel-body="anim">
          ${buildPostAnswerAnimTabHTML('drill', d)}
        </div>`;
    }

    return `
      <div class="q-card ${cardCls}" id="drill-card-${inst.uid}" data-drill-uid="${inst.uid}">
        <div class="q-header">
          <div class="q-meta">
            <span class="q-num">${displayIdx}</span>
            <span class="q-type-badge code">五、编程实战</span>
            <span class="exam-tag blue">${TOPIC_NAME[d.topic] || MOD_SHORT[d.module] || ''}</span>
            <span class="exam-tag hot">${d.difficulty}</span>
            <span class="exam-tag" style="font-family:var(--font-mono)">${d.file}</span>
            ${isLocked ? `<span class="exam-tag locked-tag">已锁定 · 不可修改</span>` : ''}
          </div>
        </div>
        ${drillContentHTML}
      </div>`;
  }

  function bindInlineDrillCard(host, inst, d, goNext, opts = {}) {
    const isLocked = !!(inst.ans && inst.ans.checked);
    bindIdeEditors(host, (val) => {
      if (!isLocked) {
        inst.draftCode = val;
        state.drillDrafts[d.id] = val;
      }
    });

    host.querySelectorAll('.inline-next-q-btn').forEach(btn => { btn.onclick = goNext; });

    const prevWrap = document.getElementById('drill-preview');
    const mountPreview = () => {
      if (!prevWrap || !d.anim || prevWrap.closest('.hidden')) return;
      window.AnimEngine.mount(prevWrap, d.anim.engine, { mode: d.anim.mode, params: d.anim.params || {} });
      delete prevWrap.dataset.zoomWired;
      attachCanvasZoomBehavior(prevWrap, {
        engine: d.anim.engine, mode: d.anim.mode, params: d.anim.params || {},
        title: `${d.file} — 运行效果放大视图`
      });
    };

    if (isLocked) {
      mountPreview();
      return;
    }

    const ide = host.querySelector('.drill-ide-box');
    const hintSlot = document.getElementById('drill-hint-slot');
    const hintBtn = document.getElementById('btn-drill-hint');
    if (hintBtn) hintBtn.onclick = () => {
      if (hintSlot) hintSlot.innerHTML = `<div class="trap-callout" style="margin-top:12px"><strong>编写思路提示：</strong>${escapeHTML(d.hint)}</div>`;
    };
    const exSlot = document.getElementById('drill-explain-slot');
    const exBtn = document.getElementById('btn-drill-explain');
    if (exBtn && exSlot) exBtn.onclick = () => {
      if (typeof opts.onTogglePeekExplain === 'function') {
        if (ide) {
          const val = ide._getCode();
          inst.draftCode = val;
          state.drillDrafts[d.id] = val;
        }
        opts.onTogglePeekExplain();
        return;
      }
      if (exSlot.innerHTML.trim()) {
        exSlot.innerHTML = '';
        exBtn.textContent = '直接展开详细解析';
        return;
      }
      exSlot.innerHTML = `
        <div class="explain-box" style="margin-top:14px">
          <div class="explain-head">
            <img class="explain-mascot" src="${MASCOTS.code || MASCOTS.teach || ''}" alt="大肥鱼">
            <div>
              <div class="explain-verdict info">详细步骤剖析与标准参考 C# 代码</div>
              <div class="explain-text"><strong>核心思路：</strong>${escapeHTML(d.hint)}</div>
            </div>
          </div>
          ${buildExplainDetailHTML(d.id)}
          <div style="margin-top:12px">
            <strong>标准参考 Unity C# 代码（语法着色）：</strong>
            <div class="code-block" style="margin-top:6px">${hlCS(d.solution)}</div>
          </div>
        </div>`;
      exBtn.textContent = '收起详细解析';
      const phEl = document.getElementById('drill-ph');
      if (phEl) phEl.style.display = 'none';
      mountPreview();
    };
    const resetBtn = document.getElementById('btn-drill-reset');
    if (resetBtn) resetBtn.onclick = () => {
      if (ide) ide._setCode(d.starter);
      inst.draftCode = d.starter;
    };

    const submitDrill = (e) => {
      if (inst.ans && inst.ans.checked) return;
      const clickOrigin = getEventOrigin(e, document.getElementById('btn-drill-check'));
      const code = ide ? ide._getCode() : '';
      const ev = GRADER && GRADER.evaluateCodeDrill
        ? GRADER.evaluateCodeDrill(d, code)
        : (() => {
            const nc = normCS(code);
            const chks = d.checks.map(chk => {
              const ok = chk.test(nc);
              return { label: chk.label, ok, status: ok ? 'full' : 'miss', matchNote: ok ? '规则匹配通过' : '', hint: ok ? '' : d.hint };
            });
            const passCnt = chks.filter(x => x.ok).length;
            const score = chks.length ? Math.round((passCnt / chks.length) * 100) : 0;
            return { allOk: passCnt === chks.length, pass: score >= 60, score, passCnt, partialCnt: 0, totalCnt: chks.length, checks: chks };
          })();

      inst.ans = { checked: true, correct: ev.pass, userVal: code, evalReport: ev };
      inst.peekExplain = false;
      inst.reviewLeftTab = 'question';
      if (ev.pass) state.passedDrills[d.id] = true;
      state.drillDrafts[d.id] = code;
      saveState();
      updateGlobalStats();

      if (ev.pass) {
        state.streak++;
        launchFireworks(ev.allOk || state.streak >= 3 ? 2 : 1, clickOrigin);
        setCompanion(ev.allOk ? 'trophy' : 'happy',
          ev.allOk ? `礼花绽放！${d.file} 全部 ${ev.passCnt} 项考点智能校验通过（100%）！` : `代码检测达标（${ev.score}%），礼花庆祝！`, 4800);
      } else {
        state.streak = 0;
        if (window.DshPetAssistant && typeof window.DshPetAssistant.onWrongAnswer === 'function') {
          window.DshPetAssistant.onWrongAnswer({ itemKind: 'drill', item: d, userVal: code, evalReport: ev, topicSummaries: TOPIC_SUMMARIES });
        } else {
          setCompanion('oops', `智能检测得分 ${ev.score}%（需 ≥ 60%），本题已锁定，对照诊断与参考代码查漏补缺！`, 4800);
        }
      }
      adaptDifficultyCurve(ev.pass);
      renderRandomPracticePaged();
    };

    const checkBtn = document.getElementById('btn-drill-check');
    if (checkBtn) checkBtn.onclick = submitDrill;
    const ph = document.getElementById('drill-ph');
    if (ph) ph.onclick = submitDrill;
  }

  function renderPracticeView() {
    if (state.practiceSub !== 'mock') state.practiceSub = 'bank';
    document.querySelectorAll('[data-psub]').forEach(b => b.classList.toggle('active', b.dataset.psub === state.practiceSub));
    document.getElementById('practice-pane-bank').style.display = state.practiceSub === 'bank' ? 'block' : 'none';
    document.getElementById('practice-pane-mock').style.display = state.practiceSub === 'mock' ? 'block' : 'none';

    if (state.practiceSub === 'bank') {
      if (!state.practiceHistory.length) startRandomSession(state.focusScope);
      renderRandomPracticePaged();
      setCompanion('think', '无限随机刷题已开启：所有题型（含 C# 编程填空与实验手写题）均会随机抽到，选定即锁定，答对绽放礼花！', 4000);
    } else {
      renderMockExamView();
      setCompanion('exam', '100 分模拟测试：一题一页沉浸作答，交卷自动阅卷并同步熟练度！', 3800);
    }
  }

  function renderRandomPracticePaged() {
    const listEl = document.getElementById('bank-q-list');
    if (!listEl) return;

    if (!state.practiceHistory.length) startRandomSession(state.focusScope);
    if (state.practiceIdx < 0) state.practiceIdx = 0;
    if (state.practiceIdx >= state.practiceHistory.length) state.practiceIdx = state.practiceHistory.length - 1;

    const idx = state.practiceIdx;
    const inst = state.practiceHistory[idx];
    const hasPrev = idx > 0;
    const diffInfo = DIFF_META[inst.diffLv] || DIFF_META[2];

    const sessAnswered = state.practiceHistory.filter(h => h.ans?.checked).length;
    const sessRight = state.practiceHistory.filter(h => h.ans?.checked && h.ans?.correct).length;
    const sessAcc = sessAnswered ? Math.round((sessRight / sessAnswered) * 100) : 0;

    const focusChipHTML = state.focusScope
      ? `<span class="exam-tag hot" style="display:inline-flex;align-items:center;gap:5px">聚焦：${state.focusScope.label} <button id="btn-clear-focus" style="border:none;background:none;color:inherit;font-weight:900;cursor:pointer" title="恢复全题型无限随机">× 全题型无限随机</button></span>`
      : '';

    const isAnswered = Boolean(inst.ans && inst.ans.checked);
    const isReviewMode = Boolean(isAnswered || inst.peekExplain);
    const activeLeftTab = inst.reviewLeftTab || 'question';
    const activeRightTab = inst.reviewRightTab || 'explain';

    let mainCardHTML = '';
    let flipMeta = { topic: inst.topic, module: inst.mod };
    let qObj = null, dObj = null;

    if (inst.kind === 'drill') {
      dObj = DRILLS.find(x => x.id === inst.refId) || DRILLS[0];
      flipMeta = { topic: dObj.topic, module: dObj.module };
      mainCardHTML = renderInlineDrillCard(inst, dObj, idx + 1, {
        splitReview: isReviewMode,
        peekExplain: !!inst.peekExplain,
        activeLeftTab
      });
    } else {
      qObj = BANK.find(x => x.id === inst.refId) || BANK[0];
      flipMeta = { topic: qObj.topic, module: qObj.module };
      mainCardHTML = renderQuestionCard(qObj, idx + 1, {
        hasNext: true,
        lockAfterAnswer: true,
        instance: inst,
        splitReview: isReviewMode,
        peekExplain: !!inst.peekExplain,
        activeLeftTab
      });
    }

    const animateFlipIn = isReviewMode && !inst._reviewFlipShown && !prefersReducedMotion();
    if (isReviewMode) inst._reviewFlipShown = true;

    const rightSidebarHTML = isReviewMode
      ? wrapReviewFlipScene(
          buildPostAnswerRightPanelHTML({
            itemKind: inst.kind,
            item: dObj || qObj,
            saved: inst.ans || { checked: false },
            flipMeta,
            diffInfo,
            hasNext: true,
            activeRightTab
          }),
          animateFlipIn ? buildFlipSummaryCardHTML(flipMeta, diffInfo) : '',
          animateFlipIn
        )
      : buildFlipSummaryCardHTML(flipMeta, diffInfo);

    listEl.innerHTML = `
      <div class="practice-split-layout ${isReviewMode ? 'is-review-mode' : ''}">
        <div class="practice-main-col">
          <div class="pager-bar" style="margin-bottom:18px">
            <div class="diff-curve-top">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <strong style="font-size:15px">无限随机刷题 · 第 <span style="color:var(--primary)">${idx + 1}</span> 题</strong>
                <span class="diff-tier-badge ${diffInfo.cls}">${diffInfo.name} · ${diffInfo.stars}</span>
                <span class="exam-tag blue">不限量 · 含编程实战</span>
                ${focusChipHTML}
              </div>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                <span style="font-size:12px;color:var(--text-muted);font-weight:700">本轮已答 ${sessAnswered} 题${sessAnswered ? ` · 正确率 ${sessAcc}%` : ''}</span>
                ${state.streak > 0 ? `<span class="exam-tag hot">连对 ${state.streak} 题</span>` : ''}
                <button class="secondary-btn" id="btn-reshuffle-deck" style="padding:5px 12px;font-size:12px">换一批新题</button>
              </div>
            </div>
          </div>

          ${mainCardHTML}

          <div class="pager-footer">
            <button class="secondary-btn" id="btn-q-prev" ${!hasPrev ? 'disabled style="opacity:0.45;cursor:not-allowed"' : ''}>← 上一题</button>
            <span style="font-size:13px;font-weight:700;color:var(--text-muted)">第 ${idx + 1} 题 · 无限随机（题库含全部编程题）</span>
            <button class="submit-btn" id="btn-q-next">下一题（无限随机抽取） →</button>
          </div>
        </div>

        ${rightSidebarHTML}
      </div>`;

    const goNext = () => {
      state.cardFlipped = false;
      if (state.practiceIdx < state.practiceHistory.length - 1) {
        state.practiceIdx++;
      } else {
        drawNextPracticeItem();
        state.practiceIdx = state.practiceHistory.length - 1;
      }
      renderRandomPracticePaged();
      window.scrollTo({ top: 110, behavior: 'smooth' });
    };
    const goPrev = () => {
      if (state.practiceIdx > 0) {
        state.cardFlipped = false;
        state.practiceIdx--;
        renderRandomPracticePaged();
        window.scrollTo({ top: 110, behavior: 'smooth' });
      }
    };
    const togglePeekExplain = () => {
      inst.peekExplain = !inst.peekExplain;
      if (!inst.peekExplain) inst._reviewFlipShown = false;
      if (inst.peekExplain) {
        if (inst.kind === 'drill' || (qObj && qObj.type === 'code' && qObj.subkind === 'write')) {
          inst.reviewLeftTab = 'code';
        } else {
          inst.reviewLeftTab = 'question';
        }
        inst.reviewRightTab = 'explain';
      }
      renderRandomPracticePaged();
    };

    document.getElementById('btn-q-prev').onclick = goPrev;
    document.getElementById('btn-q-next').onclick = goNext;
    document.getElementById('btn-reshuffle-deck').onclick = () => {
      startRandomSession(state.focusScope);
      renderRandomPracticePaged();
      setCompanion('cheer', '已开启新一轮无限随机抽取，所有题型（含编程题）随时待命！', 3800);
    };
    const clearFocusBtn = document.getElementById('btn-clear-focus');
    if (clearFocusBtn) clearFocusBtn.onclick = () => {
      startRandomSession(null);
      renderRandomPracticePaged();
    };

    if (!isReviewMode) {
      // Wire 3D Flip Knowledge Summary Card (Answering Phase)
      const flipCard = document.getElementById('summary-flip-card');
      const toggleFlip = (e) => {
        if (e && e.target.closest('#btn-flip-jump')) return;
        state.cardFlipped = !state.cardFlipped;
        flipCard.classList.remove('dealing');
        flipCard.classList.toggle('flipped', state.cardFlipped);
      };
      if (flipCard) {
        flipCard.onclick = toggleFlip;
        flipCard.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlip(e); } };
      }
      const jumpSecBtn = document.getElementById('btn-flip-jump');
      if (jumpSecBtn) {
        jumpSecBtn.onclick = e => {
          e.stopPropagation();
          switchView('knowledge');
          selectSection(jumpSecBtn.dataset.jumpSec, true);
        };
      }
    }

    if (inst.kind === 'drill' && dObj) {
      bindInlineDrillCard(listEl, inst, dObj, goNext, { onTogglePeekExplain: togglePeekExplain });
    } else {
      bindQuestionCardEvents(listEl, {
        mockMode: false,
        hasNext: true,
        lockAfterAnswer: true,
        instance: inst,
        onAnswerResult: (correct) => adaptDifficultyCurve(correct),
        onAfterCheck: () => renderRandomPracticePaged(),
        onTogglePeekExplain: togglePeekExplain,
        onNext: goNext
      });
    }

    if (isReviewMode) {
      bindPostAnswerLayout(listEl, {
        stateHolder: inst,
        initialLeftTab: activeLeftTab,
        onNext: goNext
      });
      if (animateFlipIn) runReviewFlipIn(listEl);
    }
    if (window.DshPetAssistant) window.DshPetAssistant.onContextChanged();
  }

  /* ========================================================================
     100-POINT TIMED MOCK EXAM (ONE QUESTION PER PAGE!)
     ======================================================================== */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function startNewMockExam() {
    const singles = shuffle(BANK.filter(q => q.type === 'single')).slice(0, 15).map(q => ({ q, pts: 2 }));
    const tfs     = shuffle(BANK.filter(q => q.type === 'tf')).slice(0, 5).map(q => ({ q, pts: 2 }));
    const fills   = shuffle(BANK.filter(q => q.type === 'fill')).slice(0, 5).map(q => ({ q, pts: 2 }));
    const essays  = shuffle(BANK.filter(q => q.type === 'essay')).slice(0, 3).map(q => ({ q, pts: 10 }));
    const codeF   = shuffle(BANK.filter(q => q.type === 'code' && q.subkind === 'fill')).slice(0, 1).map(q => ({ q, pts: 10 }));
    const codeW   = shuffle(BANK.filter(q => q.type === 'code' && q.subkind === 'write')).slice(0, 1).map(q => ({ q, pts: 10 }));

    state.mockExam = {
      items: [...singles, ...tfs, ...fills, ...essays, ...codeF, ...codeW],
      userAnswers: {}, submitted: false, remainSec: 90 * 60
    };
    state.mockPageIdx = 0;
    clearInterval(mockTimerId);
    mockTimerId = setInterval(() => {
      if (!state.mockExam || state.mockExam.submitted) return clearInterval(mockTimerId);
      state.mockExam.remainSec = Math.max(0, state.mockExam.remainSec - 1);
      const tEl = document.getElementById('mock-timer');
      if (tEl) {
        const mm = String(Math.floor(state.mockExam.remainSec / 60)).padStart(2, '0');
        const ss = String(state.mockExam.remainSec % 60).padStart(2, '0');
        tEl.textContent = `${mm}:${ss}`;
      }
      if (state.mockExam.remainSec === 0) submitMockExam();
    }, 1000);
    renderMockExamView();
  }

  function computeMockScore(me) {
    let objScore = 0, objTotal = 0, subjScore = 0, subjTotal = 0;
    me.items.forEach(({ q, pts }) => {
      const uv = me.userAnswers[q.id];
      const isObj = (q.type === 'single' || q.type === 'tf' || q.type === 'fill' || q.subkind === 'fill');
      const { correct, evalReport } = evaluateQuestion(q, uv);
      if (isObj) {
        objTotal += pts;
        if (correct) objScore += pts;
      } else {
        subjTotal += pts;
        if (evalReport) subjScore += Math.round((evalReport.ratio * pts) * 2) / 2;
      }
    });
    const totalScore = Number((objScore + subjScore).toFixed(1));
    const grandTotal = objTotal + subjTotal;
    return { objScore, objTotal, subjScore: Number(subjScore.toFixed(1)), subjTotal, totalScore, grandTotal };
  }

  function submitMockExam(e) {
    if (!state.mockExam || state.mockExam.submitted) return;
    const clickOrigin = getEventOrigin(e, null);
    state.mockExam.submitted = true;
    clearInterval(mockTimerId);
    state.mockExam.items.forEach(({ q }) => {
      const uv = state.mockExam.userAnswers[q.id];
      const { correct, evalReport } = evaluateQuestion(q, uv);
      if (uv !== undefined) state.answers[q.id] = { userVal: uv, correct, checked: true, evalReport };
    });
    const sc = computeMockScore(state.mockExam);
    saveState(); updateGlobalStats();
    renderMockExamView();
    const ratio = sc.grandTotal ? sc.totalScore / sc.grandTotal : 0;
    if (ratio >= 0.6) launchFireworks(ratio >= 0.85 ? 2.5 : 1.2, clickOrigin);
    setCompanion(ratio >= 0.85 ? 'trophy' : (ratio >= 0.6 ? 'happy' : 'oops'),
      `模拟卷智能阅卷总分 ${sc.totalScore}/${sc.grandTotal} 分（客观 ${sc.objScore}/${sc.objTotal} + 主观 ${sc.subjScore}/${sc.subjTotal}）！`, 5500);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateMockSheetStatus() {
    if (!state.mockExam) return;
    const done = Object.keys(state.mockExam.userAnswers).filter(k => {
      const v = state.mockExam.userAnswers[k];
      if (Array.isArray(v)) return v.some(s => String(s).trim().length > 0);
      if (v && typeof v === 'object') return Boolean((v.diagram?.nodes?.length > 0) || (v.diagram?.path?.length > 1) || String(v.text || '').trim().length > 0);
      return v !== undefined && v !== null && String(v).trim().length > 0;
    }).length;
    const el = document.getElementById('mock-progress-txt');
    if (el) el.textContent = `已作答 ${done} / ${state.mockExam.items.length} 题`;
  }

  function renderMockExamView() {
    const host = document.getElementById('mock-exam-host');
    if (!host) return;
    if (!state.mockExam) {
      host.innerHTML = `
        <div class="mock-header-card">
          <div style="flex:1">
            <div class="hero-eyebrow">严格遵循《知识要点-考试题型.pptx》满分 100 分结构 · 单题分页</div>
            <h2 style="font-size:24px;margin-bottom:8px">100 分全真模拟测试</h2>
            <p style="font-size:13.5px;opacity:0.92;margin-bottom:16px">随机组卷 30 题（单选15 + 判断5 + 填空5 + 作答3 + 编程2），每页一题沉浸作答，可随时通过答题卡跳题。交卷自动阅卷并同步「知识熟练度」！</p>
            <button class="btn-primary" id="btn-start-mock">立即随机组卷开考（90 分钟）</button>
          </div>
          <img src="${MASCOTS.exam}" style="width:146px;height:146px;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.28))">
        </div>`;
      document.getElementById('btn-start-mock').onclick = startNewMockExam;
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

    let scoreBanner = '';
    if (me.submitted) {
      const sc = computeMockScore(me);
      const ratio = sc.grandTotal ? sc.totalScore / sc.grandTotal : 0;
      scoreBanner = `
        <div class="mock-score-banner">
          <img src="${MASCOTS[ratio >= 0.85 ? 'trophy' : (ratio >= 0.6 ? 'happy' : 'oops')]}" style="width:108px;height:108px;object-fit:contain">
          <div style="flex:1">
            <h3 style="font-size:20px;font-weight:900;margin-bottom:4px">全卷智能批改估分：<span style="color:var(--primary)">${sc.totalScore} / ${sc.grandTotal} 分</span></h3>
            <p style="font-size:13.5px;color:var(--text-sec)">客观题 ${sc.objScore}/${sc.objTotal} 分 + 简答与编程智能语义估分 ${sc.subjScore}/${sc.subjTotal} 分；点击答题卡可逐题查看采分报告与解析。</p>
          </div>
          <button class="submit-btn" id="btn-retry-mock">重新随机组卷</button>
        </div>`;
    }

    const sheetDots = me.items.map((it, i) => {
      const ans = me.userAnswers[it.q.id];
      const filled = Array.isArray(ans)
        ? ans.some(s => String(s).trim())
        : (ans && typeof ans === 'object'
          ? Boolean((ans.diagram?.nodes?.length > 0) || (ans.diagram?.path?.length > 1) || String(ans.text || '').trim())
          : (ans !== undefined && ans !== null && String(ans).trim() !== ''));
      let cls = '';
      if (i === idx) cls = 'current';
      else if (me.submitted) cls = gradeQuestion(it.q, ans) ? 'ok' : 'bad';
      else if (filled) cls = 'answered';
      return `<button class="pager-dot ${cls}" data-goto-mq="${i}">${i + 1}</button>`;
    }).join('');

    if (me.submitted) {
      me.reviewTabByQid = me.reviewTabByQid || {};
      me.reviewRightByQid = me.reviewRightByQid || {};
    }
    const curLeftTab = me.submitted ? (me.reviewTabByQid[q.id] || 'question') : 'question';
    const curRightTab = me.submitted ? (me.reviewRightByQid[q.id] || 'explain') : 'explain';
    const footerNavHTML = `
      <div class="pager-footer">
        <button class="secondary-btn" id="btn-mq-prev" ${idx === 0 ? 'disabled style="opacity:0.45;cursor:not-allowed"' : ''}>← 上一题</button>
        <span style="font-size:13px;font-weight:700;color:var(--text-muted)">模拟卷 第 ${idx + 1} / ${me.items.length} 题</span>
        ${idx < me.items.length - 1
          ? `<button class="submit-btn" id="btn-mq-next">下一页（下一题） →</button>`
          : (!me.submitted ? `<button class="submit-btn" id="btn-mq-finish">完成全部作答 · 交卷阅卷</button>` : `<button class="secondary-btn" disabled>已是最后一题</button>`)}
      </div>`;

    const mockStageBlock = me.submitted
      ? `<div class="practice-split-layout is-review-mode" id="mock-review-split">
           <div class="practice-main-col">
             <div id="mock-single-stage">${renderQuestionCard(q, idx + 1, { mockMode: true, mockAns, points: pts, hasNext: idx < me.items.length - 1, splitReview: true, activeLeftTab: curLeftTab })}</div>
             ${footerNavHTML}
           </div>
           ${buildPostAnswerRightPanelHTML({
             itemKind: 'question',
             item: q,
             saved: mockAns,
             flipMeta: { topic: q.topic, module: q.module },
             diffInfo: DIFF_META[2],
             hasNext: idx < me.items.length - 1,
             activeRightTab: curRightTab
           })}
         </div>`
      : `<div id="mock-single-stage">${renderQuestionCard(q, idx + 1, { mockMode: true, mockAns, points: pts, hasNext: idx < me.items.length - 1 })}</div>
         ${footerNavHTML}`;

    host.innerHTML = `
      <div class="mock-header-card">
        <div>
          <h2 style="font-size:20px;font-weight:900">全真期末模拟卷（满分 100 分 · 第 ${idx + 1} / ${me.items.length} 题）</h2>
          <div id="mock-progress-txt" style="font-size:13px;opacity:0.9;margin-top:4px"></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div class="timer-pill" id="mock-timer">${mm}:${ss}</div>
          ${!me.submitted ? `<button class="btn-primary" id="btn-submit-mock">交卷并自动阅卷</button>` : `<button class="btn-ghost-light" id="btn-new-mock">再抽一套新卷</button>`}
        </div>
      </div>
      ${scoreBanner}
      <div class="pager-bar">
        <div class="pager-top-row"><strong style="font-size:13.5px">答题卡快速跳题</strong><span style="font-size:12px;color:var(--text-muted)">第 ${idx + 1} / ${me.items.length} 题</span></div>
        <div class="pager-dots">${sheetDots}</div>
      </div>
      ${mockStageBlock}`;

    updateMockSheetStatus();
    const goMNext = () => { if (state.mockPageIdx < me.items.length - 1) { state.mockPageIdx++; renderMockExamView(); window.scrollTo({ top: 120, behavior: 'smooth' }); } };
    document.getElementById('btn-mq-prev').onclick = () => { if (state.mockPageIdx > 0) { state.mockPageIdx--; renderMockExamView(); window.scrollTo({ top: 120, behavior: 'smooth' }); } };
    const mn = document.getElementById('btn-mq-next'); if (mn) mn.onclick = goMNext;
    const mf = document.getElementById('btn-mq-finish'); if (mf) mf.onclick = submitMockExam;
    const subBtn = document.getElementById('btn-submit-mock'); if (subBtn) subBtn.onclick = submitMockExam;
    const rBtn = document.getElementById('btn-retry-mock') || document.getElementById('btn-new-mock'); if (rBtn) rBtn.onclick = startNewMockExam;
    host.querySelectorAll('[data-goto-mq]').forEach(b => b.onclick = () => { state.mockPageIdx = Number(b.dataset.gotoMq); renderMockExamView(); });

    bindQuestionCardEvents(document.getElementById('mock-single-stage'), { mockMode: true, hasNext: idx < me.items.length - 1, onNext: goMNext });
    if (me.submitted) {
      bindPostAnswerLayout(document.getElementById('mock-review-split'), {
        initialLeftTab: curLeftTab,
        onLeftTabChange: (t) => { me.reviewTabByQid[q.id] = t; },
        onRightTabChange: (rt) => { me.reviewRightByQid[q.id] = rt; },
        onNext: idx < me.items.length - 1 ? goMNext : null
      });
    }
    if (window.DshPetAssistant) window.DshPetAssistant.onContextChanged();
  }

  /* -------------------- View 4: Mistake Book & Favorites -------------------- */
  function renderNotebookView() {
    const host = document.getElementById('notebook-host');
    if (!host) return;
    const wrongQs = BANK.filter(q => state.answers[q.id]?.checked && !state.answers[q.id]?.correct);
    const favQs = BANK.filter(q => state.favorites[q.id]);

    let html = `
      <div class="kp-card" style="display:flex;align-items:center;gap:22px;padding:24px 28px;margin-bottom:22px">
        <img src="${MASCOTS[wrongQs.length ? 'oops' : 'trophy']}" style="width:104px;height:104px;object-fit:contain">
        <div>
          <h3 style="font-size:19px;font-weight:900;margin-bottom:6px">${wrongQs.length ? `错题攻坚营（待消灭 ${wrongQs.length} 道错题）` : '目前保持零错题记录'}</h3>
          <p style="font-size:13.5px;color:var(--text-sec)">${wrongQs.length ? '重做答对后将自动移出错题本并实时提升对应小节熟练度。' : '去练习模式逐题刷题、手写代码或挑战 100 分全真模拟，全面检验你的知识点熟练度。'}</p>
        </div>
      </div>`;
    if (wrongQs.length) html += `<h3 style="margin:14px 0 12px;font-size:16px;font-weight:900">错题本 (${wrongQs.length})</h3><div class="q-list">${wrongQs.map((q, i) => renderQuestionCard(q, i + 1)).join('')}</div>`;
    html += `<h3 style="margin:26px 0 12px;font-size:16px;font-weight:900">重点收藏夹 (${favQs.length})</h3>`;
    html += favQs.length
      ? `<div class="q-list">${favQs.map((q, i) => renderQuestionCard(q, i + 1)).join('')}</div>`
      : `<div class="kp-card" style="text-align:center;padding:26px;color:var(--text-muted);font-weight:600">暂无收藏题目，刷题时点击右上角「收藏」即可加入重点夹。</div>`;
    host.innerHTML = html;
    bindQuestionCardEvents(host, { mockMode: false });
  }

  /* -------------------- 10-Variant Mascot Strip -------------------- */
  function buildMascotStickerStrip() {
    const strip = document.getElementById('mascot-gallery-strip');
    if (!strip) return;
    const items = [
      ['cheer', '元气加油'], ['teach', '眼镜讲课'], ['think', '歪头思考'], ['happy', '星星庆祝'], ['oops', '抱拳鼓励'],
      ['code', '写码大肥鱼'], ['exam', '满分考官'], ['search', '寻路探险'], ['sleepy', '熬夜护眼'], ['trophy', '冠军奖杯']
    ];
    strip.innerHTML = items.map(([k, lbl]) => `
      <button class="icon-btn mascot-pick-btn" data-mkey="${k}" style="height:auto;padding:7px 11px;flex-direction:column;gap:4px">
        <img src="${MASCOTS[k]}" style="width:46px;height:46px;object-fit:contain">
        <span style="font-size:11px">${lbl}</span>
      </button>`).join('');
    strip.querySelectorAll('.mascot-pick-btn').forEach(b => {
      b.onclick = () => {
        const k = b.dataset.mkey;
        const heroImg = document.getElementById('hero-mascot-img');
        if (heroImg) { heroImg.src = MASCOTS[k]; heroImg.classList.remove('mascot-pop-anim'); void heroImg.offsetWidth; heroImg.classList.add('mascot-pop-anim'); }
        const m = MANTRAS.find(x => x.mood === k) || MANTRAS[0];
        setCompanion(k, m.text, 5000);
        const hs = document.getElementById('hero-speech');
        if (hs) hs.textContent = m.text;
      };
    });
  }

  /* -------------------- Bootstrap -------------------- */
  function init() {
    applyTheme(state.theme);
    spawnOceanBubbles();

    const setImg = (id, key) => { const el = document.getElementById(id); if (el && MASCOTS[key]) el.src = MASCOTS[key]; };
    setImg('brand-mascot-img', 'cheer'); setImg('hero-mascot-img', 'cheer');
    setImg('toc-mascot-img', 'teach');

    buildMascotStickerStrip();
    renderKnowledgeSection();
    updateGlobalStats();
    if (window.DshPetAssistant) {
      window.DshPetAssistant.mount({
        hostId: 'dsh-pet-dock',
        isMobile: false,
        getContext: buildPetContext,
        isDark: () => state.theme === 'dark'
      });
      window.DshPetAssistant.react('cheer', '点我可根据当前浏览或刷题进度给你思路提醒，按住还能拖动位置！', 5200);
    }

    document.querySelectorAll('.nav-tab').forEach(b => b.onclick = () => switchView(b.dataset.view));
    document.getElementById('brand-home').onclick = () => switchView('knowledge');
    document.getElementById('cta-start-learn').onclick = () => { switchView('knowledge'); document.getElementById('knowledge-anchor')?.scrollIntoView({ behavior: 'smooth' }); };
    document.getElementById('cta-start-mastery').onclick = () => switchView('mastery');
    document.getElementById('cta-start-practice').onclick = () => { state.practiceSub = 'bank'; switchView('practice'); };

    document.querySelectorAll('[data-psub]').forEach(b => b.onclick = () => { state.practiceSub = b.dataset.psub; renderPracticeView(); if (window.DshPetAssistant) window.DshPetAssistant.onContextChanged(); });

    document.getElementById('theme-toggle').onclick = () => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      setCompanion(next === 'dark' ? 'sleepy' : 'cheer', next === 'dark' ? '已开启深海护眼暗夜模式，深夜复习也要注意休息。' : '回到冰海浅色模式，精神满满继续冲刺高分。', 4500);
    };

    const lbOverlay = document.getElementById('anim-lightbox');
    if (lbOverlay) lbOverlay.onclick = e => { if (e.target === lbOverlay) closeAnimLightbox(); };
    document.getElementById('lightbox-close')?.addEventListener('click', closeAnimLightbox);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAnimLightbox(); });

    const cycleMantra = () => {
      mantraIdx = (mantraIdx + 1) % MANTRAS.length;
      const m = MANTRAS[mantraIdx];
      const hs = document.getElementById('hero-speech'); if (hs) hs.textContent = m.text;
      const hi = document.getElementById('hero-mascot-img'); if (hi) hi.src = MASCOTS[m.mood];
      setCompanion(m.mood, m.text, 5000);
    };
    document.getElementById('hero-mascot-img').onclick = cycleMantra;
    document.getElementById('hero-speech').onclick = cycleMantra;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
