/* ==========================================================================
   Interactive SVG Diagram Board & Pathfinding Grid Board
   Draw.io-Inspired Free Arrows, Bend Handles, Snap Ports, Zoom/Pan, Grid Tracer
   Zero-Emoji Edition · Zero Bare Monospace · Precise viewBox Pointer Mapping
   ========================================================================== */
(function (global) {
  'use strict';

  const VB_W = 760;
  const VB_H_FSM = 360;
  const VB_H_BT = 390;
  const GRID_STEP = 12;
  const FONT_STACK = 'Cascadia Mono, Consolas, Microsoft YaHei UI, sans-serif';

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function snap12(v) {
    return Math.round(v / GRID_STEP) * GRID_STEP;
  }

  function cloneEdge(e) {
    if (!e || typeof e !== 'object') return e;
    const out = { ...e };
    if (e.fromPt) out.fromPt = { x: Number(e.fromPt.x), y: Number(e.fromPt.y) };
    if (e.toPt) out.toPt = { x: Number(e.toPt.x), y: Number(e.toPt.y) };
    return out;
  }

  function cloneData(d, spec) {
    if (spec?.kind === 'pathgrid' || d?.kind === 'pathgrid') {
      const rows = spec?.rows || d?.rows || 4;
      const cols = spec?.cols || d?.cols || 6;
      return {
        kind: 'pathgrid',
        start: Number.isInteger(d?.start) ? d.start : (Number.isInteger(spec?.start) ? spec.start : 0),
        end: Number.isInteger(d?.end) ? d.end : (Number.isInteger(spec?.end) ? spec.end : (rows * cols - 1)),
        obstacles: Array.isArray(d?.obstacles) ? [...d.obstacles] : (Array.isArray(spec?.obstacles) ? [...spec.obstacles] : []),
        path: Array.isArray(d?.path) ? [...d.path] : [],
        open: Array.isArray(d?.open) ? [...d.open] : [],
        closed: Array.isArray(d?.closed) ? [...d.closed] : [],
        notes: { ...(spec?.givenNotes || {}), ...(d?.notes && typeof d.notes === 'object' ? d.notes : {}) }
      };
    }
    return {
      nodes: Array.isArray(d?.nodes) ? d.nodes.map(n => ({ ...n })) : [],
      edges: Array.isArray(d?.edges) ? d.edges.map(cloneEdge) : []
    };
  }

  const BT_TYPE_META = {
    root:      { tag: 'Root 根',       badge: 'R',  fill: 'rgba(99, 102, 241, 0.28)',  stroke: '#818cf8', w: 92,  h: 34, rx: 17 },
    selector:  { tag: 'Selector ?',    badge: '?',  fill: 'rgba(245, 158, 11, 0.24)',  stroke: '#fbbf24', w: 112, h: 36, rx: 8  },
    sequence:  { tag: 'Sequence →',    badge: '→',  fill: 'rgba(14, 165, 233, 0.24)',  stroke: '#38bdf8', w: 112, h: 36, rx: 8  },
    parallel:  { tag: 'Parallel ⇉',    badge: '⇉',  fill: 'rgba(168, 85, 247, 0.26)',  stroke: '#c084fc', w: 118, h: 36, rx: 8  },
    decorator: { tag: 'Decorator ◇',   badge: '◇',  fill: 'rgba(244, 63, 94, 0.24)',   stroke: '#fb7185', w: 124, h: 36, rx: 18 },
    condition: { tag: '条件叶',        badge: 'IF', fill: 'rgba(16, 185, 129, 0.22)',  stroke: '#34d399', w: 110, h: 36, rx: 18 },
    action:    { tag: '行为叶',        badge: 'ACT',fill: 'rgba(6, 182, 212, 0.22)',   stroke: '#22d3ee', w: 110, h: 36, rx: 6  }
  };

  function charUnits(ch) {
    return /[\u2E80-\u9FFF]/.test(ch) ? 2 : 1;
  }

  function wrapLines(text, maxUnits, maxLines) {
    const raw = String(text || '').trim() || '未命名';
    const limit = maxUnits <= 8 ? maxUnits * 1.6 : maxUnits;
    if (maxLines >= 2 && /\s+/.test(raw)) {
      const parts = raw.split(/\s+/);
      if (parts.length === 2 && parts[0].length <= 8 && parts[1].length <= 10) return parts;
    }
    const lines = [];
    let cur = '', u = 0;
    for (const ch of raw) {
      const cu = charUnits(ch);
      if (u + cu > limit && cur) {
        lines.push(cur);
        cur = ch === ' ' ? '' : ch;
        u = ch === ' ' ? 0 : cu;
        if (lines.length >= maxLines) break;
      } else {
        cur += ch;
        u += cu;
      }
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    return lines;
  }

  function measureLabelWidth(text) {
    const raw = String(text || '');
    let sum = 0;
    for (const ch of raw) {
      sum += /[\u2E80-\u9FFF\uFF00-\uFFEF]/.test(ch) ? 12.5 : 7.2;
    }
    return Math.max(24, sum);
  }

  function getNodeBox(n, isBT) {
    if (!isBT) {
      const w = Math.min(300, Math.max(76, Math.ceil(measureLabelWidth(n.label) + 30)));
      return { shape: 'stadium', w, h: 56, hw: w / 2, hh: 28, rx: 28 };
    }
    const meta = BT_TYPE_META[n.nodeType] || BT_TYPE_META.action;
    const w = Math.min(320, Math.max(meta.w, Math.ceil(measureLabelWidth(n.label) + 32)));
    return { shape: 'rect', w, h: meta.h, hw: w / 2, hh: meta.h / 2, rx: meta.rx, meta };
  }

  function getNodePorts(n, isBT) {
    const b = getNodeBox(n, isBT);
    return {
      n: { x: n.x, y: n.y - b.hh },
      e: { x: n.x + b.hw, y: n.y },
      s: { x: n.x, y: n.y + b.hh },
      w: { x: n.x - b.hw, y: n.y }
    };
  }

  function getPortOutwardPt(node, portName, isBT, pad = 2) {
    const ports = getNodePorts(node, isBT);
    const p = ports[portName];
    if (!p) return { x: node.x, y: node.y };
    const off = { n: [0, -pad], e: [pad, 0], s: [0, pad], w: [-pad, 0] }[portName] || [0, 0];
    return { x: p.x + off[0], y: p.y + off[1] };
  }

  function clipToNodeBoundary(node, targetX, targetY, isBT, pad = 2) {
    const b = getNodeBox(node, isBT);
    const dx = targetX - node.x;
    const dy = targetY - node.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-3) return { x: node.x, y: node.y + b.hh + pad };
    if (b.shape === 'circle') {
      const r = b.r + pad;
      return { x: node.x + (dx / dist) * r, y: node.y + (dy / dist) * r };
    }
    if (b.shape === 'stadium') {
      const ry = b.hh + pad;
      const capCxOffset = Math.max(0, b.hw - b.hh);
      if (capCxOffset < 1) {
        return { x: node.x + (dx / dist) * ry, y: node.y + (dy / dist) * ry };
      }
      if (Math.abs(dx) < 1e-6) {
        return { x: node.x, y: node.y + (dy >= 0 ? ry : -ry) };
      }
      const tFlat = Math.abs(dy) > 1e-6 ? ry / Math.abs(dy) : Infinity;
      const xFlat = dx * tFlat;
      if (Math.abs(xFlat) <= capCxOffset) {
        return { x: node.x + xFlat, y: node.y + (dy >= 0 ? ry : -ry) };
      }
      const capCx = dx >= 0 ? capCxOffset : -capCxOffset;
      const aCoef = dx * dx + dy * dy;
      const bCoef = -2 * dx * capCx;
      const cCoef = capCx * capCx - ry * ry;
      const disc = Math.max(0, bCoef * bCoef - 4 * aCoef * cCoef);
      const tHit = (-bCoef + Math.sqrt(disc)) / (2 * aCoef);
      return { x: node.x + dx * tHit, y: node.y + dy * tHit };
    }
    const sx = dx === 0 ? Infinity : (b.hw + pad) / Math.abs(dx);
    const sy = dy === 0 ? Infinity : (b.hh + pad) / Math.abs(dy);
    const t = Math.min(sx, sy);
    return { x: node.x + dx * t, y: node.y + dy * t };
  }

  function findSnapTarget(pt, nodes, isBT, disallowNodeId = null) {
    let best = null;
    let bestDist = Infinity;
    for (const n of nodes) {
      if (n.id === disallowNodeId) continue;
      const b = getNodeBox(n, isBT);
      const hit = Math.abs(pt.x - n.x) <= b.hw + 18 && Math.abs(pt.y - n.y) <= b.hh + 18;
      if (!hit) continue;
      const ports = getNodePorts(n, isBT);
      let snapPort = null;
      let minPortD = 15;
      for (const pName of ['n', 'e', 's', 'w']) {
        const pd = Math.hypot(pt.x - ports[pName].x, pt.y - ports[pName].y);
        if (pd < minPortD) { minPortD = pd; snapPort = pName; }
      }
      const dCenter = Math.hypot(pt.x - n.x, pt.y - n.y);
      if (dCenter < bestDist) {
        bestDist = dCenter;
        best = { nodeId: n.id, node: n, port: snapPort };
      }
    }
    return best;
  }

  function nextSmartPos(nodes, vbW, vbH, isBT, nodeType) {
    if (isBT) {
      let y = 216;
      if (nodeType === 'root') y = 48;
      else if (nodeType === 'selector' || nodeType === 'parallel') y = 120;
      else if (nodeType === 'sequence' || nodeType === 'decorator') y = 204;
      else y = 300;
      const sameRow = nodes.filter(n => Math.abs(n.y - y) < 48);
      for (let slot = 0; slot < 8; slot++) {
        const x = snap12(Math.min(vbW - 84, Math.max(84, 120 + slot * 120)));
        if (!sameRow.some(n => Math.abs(n.x - x) < 76)) return { x, y };
      }
      return { x: snap12(Math.min(vbW - 84, 108 + ((nodes.length * 96) % (vbW - 220)))), y };
    }
    const cols = 4, dx = 168, dy = 120, ox = 132, oy = 108;
    for (let i = 0; i < 12; i++) {
      const x = ox + (i % cols) * dx;
      const y = oy + Math.floor(i / cols) * dy;
      if (y <= vbH - 48 && !nodes.some(n => Math.hypot(n.x - x, n.y - y) < 62)) {
        return { x, y };
      }
    }
    return { x: snap12(144 + ((nodes.length * 72) % (vbW - 240))), y: snap12(96 + ((nodes.length * 60) % (vbH - 180))) };
  }

  function computePathCost(seq, cols, obstacles, allowCornerCut) {
    if (!Array.isArray(seq) || seq.length < 2) return { valid: false, cost: 0, reason: '路径点少于 2 个' };
    const obsSet = new Set(obstacles || []);
    for (let i = 0; i < seq.length; i++) {
      if (obsSet.has(seq[i])) return { valid: false, cost: Infinity, reason: `经过了障碍格 #${seq[i]}` };
      if (i > 0) {
        const prev = seq[i - 1], cur = seq[i];
        const r1 = Math.floor(prev / cols), c1 = prev % cols;
        const r2 = Math.floor(cur / cols), c2 = cur % cols;
        const dr = Math.abs(r2 - r1), dc = Math.abs(c2 - c1);
        if ((dr === 0 && dc === 0) || dr > 1 || dc > 1) {
          return { valid: false, cost: Infinity, reason: `从 #${prev} 到 #${cur} 不相邻` };
        }
        if (!allowCornerCut && dr === 1 && dc === 1) {
          const o1 = r1 * cols + c2;
          const o2 = r2 * cols + c1;
          if (obsSet.has(o1) || obsSet.has(o2)) {
            return { valid: false, cost: Infinity, reason: `从 #${prev} 斜穿 #${cur} 触犯障碍墙角！` };
          }
        }
      }
    }
    let cost = 0;
    for (let i = 1; i < seq.length; i++) {
      const r1 = Math.floor(seq[i - 1] / cols), c1 = seq[i - 1] % cols;
      const r2 = Math.floor(seq[i] / cols), c2 = seq[i] % cols;
      cost += (r1 !== r2 && c1 !== c2) ? 14 : 10;
    }
    return { valid: true, cost, reason: '' };
  }

  function resolvePathDragHit(relX, relY, rows, cols, cellSz, gap, useCoreCircle = true) {
    if (!(cellSz > 0) || rows <= 0 || cols <= 0) return null;
    if (relX < 0 || relY < 0) return null;
    const step = cellSz + gap;
    const col = Math.floor(relX / step);
    const row = Math.floor(relY / step);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    const inCellX = relX - col * step;
    const inCellY = relY - row * step;
    if (inCellX > cellSz || inCellY > cellSz) return null;
    if (useCoreCircle) {
      const cx = cellSz / 2;
      const cy = cellSz / 2;
      if (Math.hypot(inCellX - cx, inCellY - cy) > cellSz * 0.40) return null;
    }
    return row * cols + col;
  }

  function interpolateGridSteps(fromCid, toCid, cols, maxSteps = 6) {
    if (fromCid == null || toCid == null || fromCid === toCid || !(cols > 0)) return [];
    let r = Math.floor(fromCid / cols), c = fromCid % cols;
    const r2 = Math.floor(toCid / cols), c2 = toCid % cols;
    const cheb = Math.max(Math.abs(r2 - r), Math.abs(c2 - c));
    if (cheb === 0 || cheb > maxSteps) return [];
    const steps = [];
    while (r !== r2 || c !== c2) {
      r += Math.sign(r2 - r);
      c += Math.sign(c2 - c);
      steps.push(r * cols + c);
    }
    return steps;
  }

  const ZOOM_IN_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
  const ZOOM_OUT_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

  function createBoardHTML(boardSpec, uid, initialData, isLocked, isZoomed = false) {
    if (boardSpec.kind === 'pathgrid') {
      return createPathGridHTML(boardSpec, uid, initialData, isLocked, isZoomed);
    }
    const isBT = boardSpec.kind === 'bt';
    const d0 = cloneData(initialData, boardSpec);
    const nodeCount = d0.nodes.length;
    const edgeCount = d0.edges.length;

    const sidebarHTML = isLocked ? `
      <aside class="db-sidebar db-sidebar-locked">
        <div class="db-sec-block">
          <div class="db-sec-lbl">画板状态</div>
          <span class="db-lock-pill">画板已锁定</span>
          <p class="db-tip-inline" style="margin-top:8px">已保存图形结构与语义标签（${nodeCount} 节点 / ${edgeCount} 箭头）</p>
        </div>
        ${!isZoomed ? `<button type="button" class="db-btn db-btn-zoom-side" data-act="zoom">${ZOOM_IN_SVG} 放大查看</button>` : `<button type="button" class="db-btn db-btn-zoom-side" data-act="zoom">${ZOOM_OUT_SVG} 完成并收起</button>`}
      </aside>` : (isBT ? `
      <aside class="db-sidebar">
        <div class="db-sec-block">
          <div class="db-sec-lbl">交互模式</div>
          <div class="db-col-stack">
            <button type="button" class="db-btn active" data-tool="select">选择 / 拖移调弧</button>
            <button type="button" class="db-btn" data-tool="connect">↓ 父→子连线</button>
          </div>
        </div>
        <div class="db-sec-block">
          <div class="db-sec-lbl">节点（可点或拖入画布）</div>
          <div class="db-mini-grid">
            <button type="button" class="db-btn db-btn-node" draggable="true" data-add-bt="root">+ Root</button>
            <button type="button" class="db-btn db-btn-node" draggable="true" data-add-bt="selector">+ Selector ?</button>
            <button type="button" class="db-btn db-btn-node" draggable="true" data-add-bt="sequence">+ Sequence →</button>
            <button type="button" class="db-btn db-btn-node" draggable="true" data-add-bt="parallel">+ Parallel ⇉</button>
            <button type="button" class="db-btn db-btn-node" draggable="true" data-add-bt="decorator">+ Decorator ◇</button>
            <button type="button" class="db-btn db-btn-node" draggable="true" data-add-bt="condition">+ 条件叶</button>
            <button type="button" class="db-btn db-btn-node" draggable="true" data-add-bt="action" style="grid-column:span 2">+ 行为叶</button>
          </div>
        </div>
        <div class="db-sec-block">
          <div class="db-sec-lbl">自由箭头与排版</div>
          <div class="db-mini-grid" style="margin-bottom:5px">
            <button type="button" class="db-btn db-btn-arrow" draggable="true" data-act="add-arrow">+ 自由箭头</button>
            <button type="button" class="db-btn" data-act="flip-edge">⇄ 反向</button>
            <button type="button" class="db-btn" data-act="reset-curve">重置弧度</button>
            <button type="button" class="db-btn" data-act="layout">⇅ 排版</button>
          </div>
        </div>
        <div class="db-sec-block">
          <div class="db-sec-lbl">编辑操作</div>
          <div class="db-mini-grid">
            <button type="button" class="db-btn" data-act="rename">重命名</button>
            <button type="button" class="db-btn" data-act="del">删除</button>
            <button type="button" class="db-btn" data-act="undo">↶ 撤销</button>
            <button type="button" class="db-btn" data-act="redo">↷ 重做</button>
            <button type="button" class="db-btn" data-act="clear" style="grid-column:span 2">清空画板</button>
          </div>
        </div>
      </aside>` : `
      <aside class="db-sidebar">
        <div class="db-sec-block">
          <div class="db-sec-lbl">交互模式</div>
          <div class="db-col-stack">
            <button type="button" class="db-btn active" data-tool="select">选择 / 拖移调弧</button>
            <button type="button" class="db-btn" data-tool="connect">↗ 连线(转换)</button>
          </div>
        </div>
        <div class="db-sec-block">
          <div class="db-sec-lbl">组件（可点或拖入画布）</div>
          <div class="db-col-stack">
            <button type="button" class="db-btn db-btn-node" draggable="true" data-act="add-fsm">+ 添加状态圆</button>
            <button type="button" class="db-btn db-btn-arrow" draggable="true" data-act="add-arrow">+ 添加自由箭头</button>
            <button type="button" class="db-btn" data-act="set-init">●→ 设为初始态</button>
          </div>
        </div>
        <div class="db-sec-block">
          <div class="db-sec-lbl">箭头调整与编辑</div>
          <div class="db-mini-grid">
            <button type="button" class="db-btn" data-act="flip-edge">⇄ 反向</button>
            <button type="button" class="db-btn" data-act="reset-curve">重置弧度</button>
            <button type="button" class="db-btn" data-act="rename">重命名</button>
            <button type="button" class="db-btn" data-act="del">删除</button>
            <button type="button" class="db-btn" data-act="undo">↶ 撤销</button>
            <button type="button" class="db-btn" data-act="redo">↷ 重做</button>
            <button type="button" class="db-btn" data-act="clear" style="grid-column:span 2">清空画板</button>
          </div>
        </div>
      </aside>`);

    return `
      <div class="diagram-board-wrap ${isZoomed ? 'is-zoomed' : ''}" id="db-${escHtml(uid)}" data-board-kind="${escHtml(boardSpec.kind)}" tabindex="-1">
        <div class="db-head">
          <div class="db-head-left">
            <span class="cs-lang-pill">${isBT ? 'BT 画板' : 'FSM 画板'}</span>
            <strong>${escHtml(boardSpec.title || '交互绘图画板')}</strong>
          </div>
          <div class="db-head-right">
            <span class="db-counts">节点 <b class="db-cnt-n">${nodeCount}</b> · 箭头 <b class="db-cnt-e">${edgeCount}</b></span>
            <button type="button" class="db-zoom-btn" data-act="zoom">${isZoomed ? `${ZOOM_OUT_SVG} 完成并收起` : `${ZOOM_IN_SVG} 放大画板`}</button>
          </div>
        </div>
        ${boardSpec.guide ? `<div class="db-guide">${escHtml(boardSpec.guide)}</div>` : ''}
        <div class="db-workspace">
          ${sidebarHTML}
          <div class="db-stage">
            <svg class="db-svg" viewBox="0 0 ${VB_W} ${isBT ? VB_H_BT : VB_H_FSM}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escHtml(boardSpec.title || '交互画板')}"></svg>
            <div class="db-vp-hud" aria-label="画布缩放导航">
              <button type="button" data-vp="out" title="缩小画布">-</button>
              <span class="db-vp-pct">100%</span>
              <button type="button" data-vp="in" title="放大画布">+</button>
              <button type="button" data-vp="reset" title="重置视图居中">居中</button>
            </div>
            <input type="text" class="db-inline-editor hidden" autocomplete="off" spellcheck="false" aria-label="直接在图元内部输入名称" />
          </div>
        </div>
        <div class="db-foot">
          <span class="db-status-msg">提示：创建节点后直接在形状内部输入名称（边框随字数自动伸缩）；双击任意节点、状态或箭头即可原位重命名！</span>
          <span class="db-legend"></span>
        </div>
      </div>`;
  }

  function createPathGridHTML(boardSpec, uid, initialData, isLocked, isZoomed) {
    const isScratch = boardSpec.role === 'scratch';
    const d0 = cloneData(initialData, boardSpec);
    const pillTxt = isScratch ? '寻路草稿板' : 'A* 寻路作答画板';
    const sidebarHTML = isLocked ? `
      <aside class="db-sidebar db-sidebar-locked">
        <div class="db-sec-block">
          <div class="db-sec-lbl">画板状态</div>
          <span class="db-lock-pill">画板已锁定</span>
          <p class="db-tip-inline" style="margin-top:8px">已保存路径格序列（${d0.path.length} 格）</p>
        </div>
        ${!isZoomed ? `<button type="button" class="db-btn db-btn-zoom-side" data-act="zoom">${ZOOM_IN_SVG} 放大查看</button>` : `<button type="button" class="db-btn db-btn-zoom-side" data-act="zoom">${ZOOM_OUT_SVG} 完成并收起</button>`}
      </aside>` : `
      <aside class="db-sidebar">
        <div class="db-sec-block">
          <div class="db-sec-lbl">网格画笔模式</div>
          <div class="db-col-stack">
            <button type="button" class="db-btn active" data-pgtool="path">描绘路径（拖/点）</button>
            ${isScratch ? `
              <button type="button" class="db-btn" data-pgtool="wall">画/擦障碍墙</button>
              <button type="button" class="db-btn" data-pgtool="start">重设起点 S</button>
              <button type="button" class="db-btn" data-pgtool="end">重设终点 G</button>
            ` : ''}
            <button type="button" class="db-btn" data-pgtool="open">标 Open 表</button>
            <button type="button" class="db-btn" data-pgtool="closed">标 Close 表</button>
            <button type="button" class="db-btn" data-pgtool="note">记 f/g/h 值</button>
          </div>
        </div>
        <div class="db-sec-block">
          <div class="db-sec-lbl">编辑与清理</div>
          <div class="db-mini-grid">
            <button type="button" class="db-btn" data-pgact="undo">↶ 退一步</button>
            <button type="button" class="db-btn" data-pgact="clear-path">清路径</button>
            ${isScratch ? `<button type="button" class="db-btn ${boardSpec.allowCornerCut ? 'active' : ''}" data-pgact="toggle-corner-cut" style="grid-column:span 2">斜穿墙角：${boardSpec.allowCornerCut ? '允许' : '禁止'}</button>` : ''}
            <button type="button" class="db-btn" data-pgact="reset" style="grid-column:span 2">${isScratch ? '重置草稿板' : '恢复初始网格'}</button>
          </div>
        </div>
      </aside>`;

    return `
      <div class="diagram-board-wrap pathgrid-board-wrap ${isZoomed ? 'is-zoomed' : ''}" id="db-${escHtml(uid)}" data-board-kind="pathgrid" tabindex="-1">
        <div class="db-head">
          <div class="db-head-left">
            <span class="cs-lang-pill">${pillTxt}</span>
            <strong>${escHtml(boardSpec.title || '寻路网格交互画板')}</strong>
          </div>
          <div class="db-head-right">
            <span class="db-counts">已连 <b class="pg-cnt-steps">${d0.path.length}</b> 格</span>
            <button type="button" class="db-zoom-btn" data-act="zoom">${isZoomed ? `${ZOOM_OUT_SVG} 完成并收起` : `${ZOOM_IN_SVG} 放大画板`}</button>
          </div>
        </div>
        ${boardSpec.guide ? `<div class="db-guide">${escHtml(boardSpec.guide)}</div>` : ''}
        <div class="db-workspace">
          ${sidebarHTML}
          <div class="db-stage pg-stage-host">
            <div class="pg-grid-stage">
              <div class="pg-grid"></div>
              <svg class="pg-svg" preserveAspectRatio="none"></svg>
            </div>
            <div class="db-popover hidden" role="dialog" aria-label="记录节点估值">
              <label class="db-pop-label">输入格内备注 / f=g+h 值（如 50|10/40 或 72）</label>
              <div class="db-pop-row">
                <input type="text" class="db-pop-input" placeholder="如 50|10/40 或 14" />
                <button type="button" class="db-pop-ok">确定</button>
                <button type="button" class="db-pop-cancel">取消</button>
              </div>
            </div>
          </div>
        </div>
        <div class="db-foot">
          <span class="db-status-msg">提示：按住鼠标沿横竖或斜向 8 方向拖动即可连续连线；点击末格回退；双击格子记录 f/g/h 估值。</span>
          <span class="db-legend">
            <span class="db-leg-dot" style="background:#38bdf8"></span>起点 S
            <span class="db-leg-dot" style="background:#f59e0b;margin-left:8px"></span>终点 G
            <span class="db-leg-dot" style="background:#10b981;margin-left:8px"></span>路径
          </span>
        </div>
      </div>`;
  }

  function wireZoomModal(containerEl, boardSpec, getDataFn, applyNextFn, getEvalFn, isLocked, isZoomed, onCloseZoom) {
    containerEl.querySelectorAll('[data-act="zoom"]').forEach(zoomBtn => {
      zoomBtn.onclick = () => {
        if (isZoomed) {
          if (onCloseZoom) onCloseZoom();
          return;
        }
        const overlay = document.getElementById('anim-lightbox');
        const body = document.getElementById('lightbox-body');
        const titleEl = document.getElementById('lightbox-title');
        const dlg = overlay?.querySelector('.lightbox-dialog');
        if (!overlay || !body) return;
        if (titleEl) titleEl.textContent = `${boardSpec.title || '交互画板'} — 全屏放大模式`;
        if (dlg) dlg.classList.add('is-board-zoom');

        const snap = getDataFn();
        body.innerHTML = createBoardHTML(boardSpec, `${containerEl.id || 'db'}-zoom`, snap, isLocked, true);
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        const closeZoomModal = () => {
          overlay.classList.remove('open');
          if (dlg) dlg.classList.remove('is-board-zoom');
          document.body.style.overflow = '';
          setTimeout(() => { if (!overlay.classList.contains('open')) body.innerHTML = ''; }, 340);
        };

        const zoomHost = body.querySelector('.diagram-board-wrap');
        mountBoard(zoomHost, boardSpec, {
          initialData: snap,
          isLocked,
          evalResult: getEvalFn(),
          isZoomed: true,
          onChange: (next) => applyNextFn(next),
          onCloseZoom: closeZoomModal
        });
      };
    });
  }

  function mountPathGridBoard(containerEl, boardSpec, opts = {}) {
    const rows = boardSpec.rows || 4;
    const cols = boardSpec.cols || 6;
    const isScratch = boardSpec.role === 'scratch';
    let allowCornerCut = !!boardSpec.allowCornerCut;
    let isLocked = !!opts.isLocked;
    const isZoomed = !!opts.isZoomed;
    let evalResult = opts.evalResult || null;
    const onChange = typeof opts.onChange === 'function' ? opts.onChange : null;
    const onCloseZoom = typeof opts.onCloseZoom === 'function' ? opts.onCloseZoom : null;

    let data = cloneData(opts.initialData, boardSpec);
    let pgTool = 'path';
    let undoStack = [];
    let dragInfo = null;
    let popCid = null;
    let layoutMetrics = { cellSz: 48, gap: 5, step: 53, gw: cols * 53 - 5, gh: rows * 53 - 5 };

    const stageHost = containerEl.querySelector('.pg-stage-host');
    const gridEl = containerEl.querySelector('.pg-grid');
    const svgEl = containerEl.querySelector('.pg-svg');
    const cntEl = containerEl.querySelector('.pg-cnt-steps');
    const statusMsg = containerEl.querySelector('.db-status-msg');
    const pop = containerEl.querySelector('.db-popover');
    const popInput = containerEl.querySelector('.db-pop-input');
    const popOk = containerEl.querySelector('.db-pop-ok');
    const popCancel = containerEl.querySelector('.db-pop-cancel');

    function setStatus(txt) {
      if (statusMsg) statusMsg.textContent = txt;
    }

    function pushUndo() {
      undoStack.push(cloneData(data, boardSpec));
      if (undoStack.length > 30) undoStack.shift();
    }

    function notifyChange() {
      if (cntEl) cntEl.textContent = String(data.path.length);
      if (onChange) onChange(cloneData(data, boardSpec));
    }

    function closePopover() {
      if (pop) pop.classList.add('hidden');
      popCid = null;
    }

    function openNotePopover(cid) {
      if (isLocked || !pop) return;
      popCid = cid;
      const r = Math.floor(cid / cols), c = cid % cols;
      pop.querySelector('.db-pop-label').textContent = `格 #${cid} 备注 / f=g+h（留空可清除）`;
      popInput.value = data.notes?.[cid] || '';
      const px = Math.min(Math.max(8, ((c + 0.5) / cols) * 72), 62);
      const py = Math.min(Math.max(8, ((r + 0.5) / rows) * 72), 66);
      pop.style.left = `${px}%`;
      pop.style.top = `${py}%`;
      pop.classList.remove('hidden');
      setTimeout(() => { popInput.focus(); popInput.select(); }, 20);
    }

    function commitNote() {
      if (popCid === null) return;
      pushUndo();
      const val = popInput.value.trim();
      if (!data.notes) data.notes = {};
      if (val) data.notes[popCid] = val;
      else delete data.notes[popCid];
      closePopover();
      render();
      notifyChange();
    }

    if (popOk) popOk.onclick = commitNote;
    if (popCancel) popCancel.onclick = closePopover;
    if (popInput) {
      popInput.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commitNote(); }
        else if (e.key === 'Escape') { e.preventDefault(); closePopover(); }
      };
    }

    function render() {
      const obsSet = new Set(data.obstacles);
      const openSet = new Set(data.open);
      const closedSet = new Set(data.closed);
      const pathSet = new Set(data.path);
      const cellStatuses = evalResult?.cellStatuses || {};
      const availW = Math.max(240, (stageHost?.clientWidth || containerEl.clientWidth || 360) - 22);
      const gap = availW < 340 ? 3 : 5;
      const maxDesired = isZoomed ? 66 : 54;
      const cellSz = Math.max(34, Math.min(maxDesired, Math.floor((availW - (cols - 1) * gap) / cols)));
      const gw = cols * cellSz + (cols - 1) * gap;
      const gh = rows * cellSz + (rows - 1) * gap;
      layoutMetrics = { cellSz, gap, step: cellSz + gap, gw, gh };

      if (gridEl) {
        gridEl.style.gap = `${gap}px`;
        gridEl.style.gridTemplateColumns = `repeat(${cols}, ${cellSz}px)`;
        gridEl.style.gridAutoRows = `${cellSz}px`;
        let html = '';
        for (let id = 0; id < rows * cols; id++) {
          const isS = id === data.start;
          const isG = id === data.end;
          const isObs = obsSet.has(id);
          const isPath = pathSet.has(id);
          const isOpen = openSet.has(id);
          const isClosed = closedSet.has(id);
          const stCls = cellStatuses[id] ? `eval-${cellStatuses[id]}` : '';
          const noteRaw = String(data.notes?.[id] || '');
          let noteHTML = '';
          if (noteRaw && !isObs) {
            const parts = noteRaw.split('|');
            if (parts.length === 2 && parts[1].includes('/')) {
              const [gTxt, hTxt] = parts[1].split('/');
              noteHTML = `<span class="pg-note-f">${escHtml(parts[0])}</span><span class="pg-note-gh">${escHtml(gTxt)}/${escHtml(hTxt)}</span>`;
            } else {
              noteHTML = `<span class="pg-note-tag">${escHtml(noteRaw)}</span>`;
            }
          }
          const badge = isOpen ? '<span class="pg-oc open">O</span>' : (isClosed ? '<span class="pg-oc closed">C</span>' : '');
          const lbl = isS ? `S(${id})` : (isG ? `G(${id})` : (isObs ? '墙' : String(id)));
          const cls = [
            'pg-cell',
            isS ? 'is-start' : '',
            isG ? 'is-end' : '',
            isObs ? 'is-obs' : '',
            isPath ? 'is-path' : '',
            isOpen ? 'is-open' : '',
            isClosed ? 'is-closed' : '',
            !isLocked ? 'clickable' : '',
            stCls
          ].filter(Boolean).join(' ');
          html += `<div class="${cls}" data-pgcell="${id}">${badge}${noteHTML}<span class="pg-cid">${lbl}</span></div>`;
        }
        gridEl.innerHTML = html;
      }

      if (svgEl && gridEl) {
        svgEl.setAttribute('viewBox', `0 0 ${gw} ${gh}`);
        const seq = data.path || [];
        if (seq.length) {
          const step = cellSz + gap;
          const pts = seq.map(id => {
            const r = Math.floor(id / cols), c = id % cols;
            return { x: c * step + cellSz / 2, y: r * step + cellSz / 2 };
          });
          const uid = containerEl.id || 'pg';
          let inner = `<defs><marker id="pg-arr-${uid}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M1,1.5 L8,4.5 L1,7.5 Z" fill="#10b981"/></marker></defs>`;
          if (pts.length >= 2) {
            const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
            inner += `<polyline points="${poly}" fill="none" stroke="#10b981" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#pg-arr-${uid})"/>`;
          }
          pts.forEach((p, idx) => {
            const r = idx === 0 || idx === pts.length - 1 ? 5.2 : 4;
            inner += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="#10b981" stroke="#0f172a" stroke-width="1.5"/>`;
          });
          svgEl.innerHTML = inner;
        } else {
          svgEl.innerHTML = '';
        }
        if (dragInfo?.mode === 'path' && dragInfo.pointerRel) {
          updateRubberLine(dragInfo.pointerRel.x, dragInfo.pointerRel.y);
        }
      }

      if (data.path.length >= 2) {
        const metric = computePathCost(data.path, cols, data.obstacles, allowCornerCut);
        if (isScratch) {
          setStatus(metric.valid
            ? `草稿路径：${data.path.join(' → ')}（${data.path.length} 格 · 代价 g = ${metric.cost}）`
            : `草稿提示：${metric.reason}`);
        } else {
          setStatus(`已选路径：${data.path.join(' - ')}（共 ${data.path.length} 格）`);
        }
      } else if (data.path.length === 1) {
        setStatus(`已从 S(${data.path[0]}) 起步：继续拖动或点击相邻格子连向 G(${data.end})`);
      }
      if (cntEl) cntEl.textContent = String(data.path.length);
    }

    function tryStepPath(cid, isDragStep = false) {
      const obsSet = new Set(data.obstacles);
      if (obsSet.has(cid)) return false;
      const seq = data.path;
      if (!seq.length) {
        if (cid === data.start) {
          pushUndo();
          data.path = [data.start];
          return true;
        }
        const sr = Math.floor(data.start / cols), sc = data.start % cols;
        const cr = Math.floor(cid / cols), cc = cid % cols;
        const dr = Math.abs(sr - cr), dc = Math.abs(sc - cc);
        if (dr <= 1 && dc <= 1) {
          if (!allowCornerCut && dr === 1 && dc === 1 && (obsSet.has(sr * cols + cc) || obsSet.has(cr * cols + sc))) {
            setStatus('禁止斜穿障碍物角点（Corner Cut）！请先走正交格绕过墙角');
            return false;
          }
          pushUndo();
          data.path = [data.start, cid];
          return true;
        }
        if (isScratch) {
          pushUndo();
          data.path = [cid];
          return true;
        }
        setStatus(`请先从起点 S(${data.start}) 或与起点相邻的格子开始连线`);
        return false;
      }

      const last = seq[seq.length - 1];
      if (cid === last) {
        if (!isDragStep) { pushUndo(); seq.pop(); return true; }
        return false;
      }
      if (seq.length >= 2 && cid === seq[seq.length - 2]) {
        pushUndo();
        seq.pop();
        return true;
      }
      if (seq.includes(cid)) return false;
      const r1 = Math.floor(last / cols), c1 = last % cols;
      const r2 = Math.floor(cid / cols), c2 = cid % cols;
      const dr = Math.abs(r1 - r2), dc = Math.abs(c1 - c2);
      if (dr > 1 || dc > 1) {
        if (!isDragStep) setStatus(`请点击与 #${last} 相邻的 8 连通格子！`);
        return false;
      }
      if (!allowCornerCut && dr === 1 && dc === 1) {
        if (obsSet.has(r1 * cols + c2) || obsSet.has(r2 * cols + c1)) {
          setStatus(`禁止从 #${last} 斜穿墙角进入 #${cid}！`);
          return false;
        }
      }
      pushUndo();
      seq.push(cid);
      return true;
    }

    function clearRubberLine() {
      if (!svgEl) return;
      const old = svgEl.querySelector('.pg-rubber');
      if (old) old.remove();
    }

    function updateRubberLine(relX, relY) {
      if (!svgEl || !data.path.length) {
        clearRubberLine();
        return;
      }
      const last = data.path[data.path.length - 1];
      const lr = Math.floor(last / cols), lc = last % cols;
      const sx = lc * layoutMetrics.step + layoutMetrics.cellSz / 2;
      const sy = lr * layoutMetrics.step + layoutMetrics.cellSz / 2;
      let line = svgEl.querySelector('.pg-rubber');
      if (!line) {
        line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'pg-rubber');
        line.setAttribute('stroke', 'rgba(52, 211, 153, 0.72)');
        line.setAttribute('stroke-width', '2.6');
        line.setAttribute('stroke-dasharray', '5 4');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('pointer-events', 'none');
        svgEl.appendChild(line);
      }
      line.setAttribute('x1', sx.toFixed(1));
      line.setAttribute('y1', sy.toFixed(1));
      line.setAttribute('x2', Number(relX).toFixed(1));
      line.setAttribute('y2', Number(relY).toFixed(1));
    }

    if (!isLocked) {
      containerEl.querySelectorAll('[data-pgtool]').forEach(btn => {
        btn.onclick = () => {
          pgTool = btn.dataset.pgtool;
          containerEl.querySelectorAll('[data-pgtool]').forEach(b => b.classList.toggle('active', b.dataset.pgtool === pgTool));
          const tips = {
            path: '描绘路径模式：拖动或点击相邻格（支持 8 方向与斜线）从起点连向终点',
            wall: '障碍画笔模式：点击或拖动即可放置/擦除不可通行墙体',
            start: '设起点模式：点击任意非墙格子将其设为新起点 S',
            end: '设终点模式：点击任意非墙格子将其设为新终点 G',
            open: '标 Open 表模式：点击格子标记/取消 Open 表（青色边）',
            closed: '标 Close 表模式：点击格子标记/取消 Close 表（紫灰边）',
            note: '记估值模式：点击任意非墙格子输入 f|g/h 数值备注'
          };
          setStatus(tips[pgTool] || '');
        };
      });

      containerEl.querySelectorAll('[data-pgact]').forEach(btn => {
        btn.onclick = () => {
          const act = btn.dataset.pgact;
          if (act === 'undo') {
            if (!undoStack.length) { setStatus('没有可撤销的操作'); return; }
            data = undoStack.pop();
            render();
            notifyChange();
          } else if (act === 'clear-path') {
            if (!data.path.length) return;
            pushUndo();
            data.path = [];
            render();
            notifyChange();
          } else if (act === 'toggle-corner-cut' && isScratch) {
            allowCornerCut = !allowCornerCut;
            btn.classList.toggle('active', allowCornerCut);
            btn.textContent = `斜穿墙角：${allowCornerCut ? '允许' : '禁止'}`;
            render();
            setStatus(allowCornerCut ? '已允许草稿板斜穿墙角' : '已禁止草稿板斜穿墙角');
          } else if (act === 'reset') {
            pushUndo();
            data = cloneData(null, boardSpec);
            render();
            notifyChange();
          }
        };
      });

      if (gridEl) {
        gridEl.addEventListener('pointerdown', (e) => {
          const cell = e.target.closest('[data-pgcell]');
          if (!cell) return;
          e.preventDefault();
          try { gridEl.setPointerCapture(e.pointerId); } catch (_) {}
          const cid = Number(cell.dataset.pgcell);
          if (pgTool === 'path') {
            const curTip = data.path.length > 0 ? data.path[data.path.length - 1] : null;
            if (curTip !== null && cid === curTip) {
              dragInfo = { mode: 'path', lastCid: cid, startedOnTip: true, movedDuringDrag: false };
              return;
            }
            const changed = tryStepPath(cid, false);
            dragInfo = { mode: 'path', lastCid: cid, startedOnTip: false, movedDuringDrag: false };
            if (changed) { render(); notifyChange(); }
          } else if (pgTool === 'wall' && isScratch) {
            if (cid === data.start || cid === data.end) { setStatus('不能直接把起点或终点刷成障碍墙'); return; }
            pushUndo();
            const has = data.obstacles.includes(cid);
            const wallAction = has ? 'remove' : 'add';
            if (has) data.obstacles = data.obstacles.filter(x => x !== cid);
            else data.obstacles.push(cid);
            data.path = data.path.filter(x => x !== cid);
            dragInfo = { mode: 'wall', wallAction, lastCid: cid };
            render();
            notifyChange();
          } else if (pgTool === 'start' && isScratch) {
            if (data.obstacles.includes(cid) || cid === data.end) return;
            pushUndo();
            data.start = cid;
            data.path = [];
            render();
            notifyChange();
          } else if (pgTool === 'end' && isScratch) {
            if (data.obstacles.includes(cid) || cid === data.start) return;
            pushUndo();
            data.end = cid;
            render();
            notifyChange();
          } else if (pgTool === 'open') {
            if (data.obstacles.includes(cid)) return;
            pushUndo();
            data.closed = data.closed.filter(x => x !== cid);
            data.open = data.open.includes(cid) ? data.open.filter(x => x !== cid) : [...data.open, cid];
            render();
            notifyChange();
          } else if (pgTool === 'closed') {
            if (data.obstacles.includes(cid)) return;
            pushUndo();
            data.open = data.open.filter(x => x !== cid);
            data.closed = data.closed.includes(cid) ? data.closed.filter(x => x !== cid) : [...data.closed, cid];
            render();
            notifyChange();
          } else if (pgTool === 'note') {
            if (!data.obstacles.includes(cid)) openNotePopover(cid);
          }
        });

        gridEl.addEventListener('dblclick', (e) => {
          const cell = e.target.closest('[data-pgcell]');
          if (!cell) return;
          const cid = Number(cell.dataset.pgcell);
          if (!data.obstacles.includes(cid)) openNotePopover(cid);
        });

        const handleDocMove = (e) => {
          if (!containerEl.isConnected) {
            window.removeEventListener('pointermove', handleDocMove);
            window.removeEventListener('pointerup', endDocDrag);
            window.removeEventListener('pointercancel', endDocDrag);
            return;
          }
          if (!dragInfo) return;
          const rect = gridEl.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const scaleX = layoutMetrics.gw / rect.width;
          const scaleY = layoutMetrics.gh / rect.height;
          const relX = (e.clientX - rect.left) * scaleX;
          const relY = (e.clientY - rect.top) * scaleY;

          if (dragInfo.mode === 'path') {
            dragInfo.pointerRel = {
              x: Math.max(0, Math.min(layoutMetrics.gw, relX)),
              y: Math.max(0, Math.min(layoutMetrics.gh, relY))
            };
            updateRubberLine(dragInfo.pointerRel.x, dragInfo.pointerRel.y);
            const cid = resolvePathDragHit(relX, relY, rows, cols, layoutMetrics.cellSz, layoutMetrics.gap, true);
            if (cid === null || cid === dragInfo.lastCid) return;
            dragInfo.lastCid = cid;

            let pathChanged = false;
            if (data.path.length > 0) {
              const last = data.path[data.path.length - 1];
              if (cid === last) return;
              if (data.path.length >= 2 && cid === data.path[data.path.length - 2]) {
                pathChanged = tryStepPath(cid, true);
              } else {
                const steps = interpolateGridSteps(last, cid, cols, 6);
                for (let i = 0; i < steps.length; i++) {
                  const ok = tryStepPath(steps[i], true);
                  if (ok) pathChanged = true;
                  else break;
                }
              }
            } else {
              pathChanged = tryStepPath(cid, true);
            }
            if (pathChanged) {
              dragInfo.movedDuringDrag = true;
              render();
              updateRubberLine(dragInfo.pointerRel.x, dragInfo.pointerRel.y);
              notifyChange();
            }
          } else if (dragInfo.mode === 'wall' && isScratch) {
            const cid = resolvePathDragHit(relX, relY, rows, cols, layoutMetrics.cellSz, layoutMetrics.gap, false);
            if (cid === null || cid === dragInfo.lastCid) return;
            dragInfo.lastCid = cid;
            if (cid === data.start || cid === data.end) return;
            const has = data.obstacles.includes(cid);
            if (dragInfo.wallAction === 'add' && !has) {
              data.obstacles.push(cid);
              data.path = data.path.filter(x => x !== cid);
              render();
              notifyChange();
            } else if (dragInfo.wallAction === 'remove' && has) {
              data.obstacles = data.obstacles.filter(x => x !== cid);
              render();
              notifyChange();
            }
          }
        };
        const endDocDrag = (e) => {
          if (!containerEl.isConnected) {
            window.removeEventListener('pointermove', handleDocMove);
            window.removeEventListener('pointerup', endDocDrag);
            window.removeEventListener('pointercancel', endDocDrag);
          }
          if (dragInfo?.mode === 'path' && dragInfo.startedOnTip && !dragInfo.movedDuringDrag && data.path.length > 0 && e?.type === 'pointerup') {
            pushUndo();
            data.path.pop();
            render();
            notifyChange();
          }
          dragInfo = null;
          clearRubberLine();
        };
        window.addEventListener('pointermove', handleDocMove);
        window.addEventListener('pointerup', endDocDrag);
        window.addEventListener('pointercancel', endDocDrag);
      }
    }

    wireZoomModal(
      containerEl, boardSpec,
      () => cloneData(data, boardSpec),
      (next) => { data = cloneData(next, boardSpec); render(); notifyChange(); },
      () => evalResult,
      isLocked, isZoomed, onCloseZoom
    );

    const handlePgResize = () => {
      if (!containerEl.isConnected) {
        window.removeEventListener('resize', handlePgResize);
        return;
      }
      render();
    };
    window.addEventListener('resize', handlePgResize);

    render();
    return {
      getData: () => cloneData(data, boardSpec),
      setData: (next) => { data = cloneData(next, boardSpec); render(); notifyChange(); },
      setEvalOverlay: (ev) => { evalResult = ev || null; render(); }
    };
  }

  function mountBoard(containerEl, boardSpec, opts = {}) {
    if (!containerEl) return null;
    if (boardSpec.kind === 'pathgrid') {
      return mountPathGridBoard(containerEl, boardSpec, opts);
    }

    const isBT = boardSpec.kind === 'bt';
    const VB_H = isBT ? VB_H_BT : VB_H_FSM;
    let isLocked = !!opts.isLocked;
    const isZoomed = !!opts.isZoomed;
    let evalResult = opts.evalResult || null;
    const onChange = typeof opts.onChange === 'function' ? opts.onChange : null;
    const onCloseZoom = typeof opts.onCloseZoom === 'function' ? opts.onCloseZoom : null;

    let data = cloneData(opts.initialData, boardSpec);
    let seq = 1;
    for (const n of data.nodes) {
      const m = String(n.id || '').match(/\d+$/);
      if (m) seq = Math.max(seq, Number(m[0]) + 1);
    }
    for (const e of data.edges) {
      const m = String(e.id || '').match(/\d+$/);
      if (m) seq = Math.max(seq, Number(m[0]) + 1);
    }

    let undoStack = [];
    let redoStack = [];
    let tool = 'select';       // 'select' | 'connect'
    let selected = null;       // { kind: 'node' | 'edge', id }
    let connectFrom = null;    // nodeId when first endpoint clicked
    let dragState = null;
    let snapHighlight = null;  // { nodeId, port }
    let alignGuides = [];      // [{ type: 'v'|'h', x, y, x1, y1, x2, y2 }]
    let vp = { zoom: 1, panX: 0, panY: 0 };
    let inlineEdit = null;     // { kind, id, origLabel, preUndoSnap, committed }
    let isComposing = false;
    let lastTap = null;        // { kind, id, time, x, y }
    const activePointers = new Map();
    let pinchState = null;     // { dist, midX, midY }

    const svg = containerEl.querySelector('.db-svg');
    const stageEl = containerEl.querySelector('.db-stage');
    const vpPctEl = containerEl.querySelector('.db-vp-pct');
    const inlineInput = containerEl.querySelector('.db-inline-editor');
    const cntN = containerEl.querySelector('.db-cnt-n');
    const cntE = containerEl.querySelector('.db-cnt-e');
    const statusMsg = containerEl.querySelector('.db-status-msg');
    const legendEl = containerEl.querySelector('.db-legend');

    function pushUndo() {
      undoStack.push(cloneData(data, boardSpec));
      if (undoStack.length > 35) undoStack.shift();
      redoStack = [];
    }

    function notifyChange() {
      if (cntN) cntN.textContent = String(data.nodes.length);
      if (cntE) cntE.textContent = String(data.edges.length);
      if (onChange) onChange(cloneData(data, boardSpec));
    }

    function setStatus(txt) {
      if (statusMsg) statusMsg.textContent = txt;
    }

    function applyViewBox() {
      const vw = VB_W / vp.zoom;
      const vh = VB_H / vp.zoom;
      svg.setAttribute('viewBox', `${vp.panX.toFixed(1)} ${vp.panY.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
      if (vpPctEl) vpPctEl.textContent = `${Math.round(vp.zoom * 100)}%`;
    }

    function zoomAt(factor, centerPt = null) {
      const oldZoom = vp.zoom;
      const nextZoom = Math.max(0.55, Math.min(2.2, Number((oldZoom * factor).toFixed(2))));
      if (nextZoom === oldZoom) return;
      const oldW = VB_W / oldZoom, oldH = VB_H / oldZoom;
      const newW = VB_W / nextZoom, newH = VB_H / nextZoom;
      const cx = centerPt ? centerPt.x : (vp.panX + oldW / 2);
      const cy = centerPt ? centerPt.y : (vp.panY + oldH / 2);
      const rx = (cx - vp.panX) / oldW;
      const ry = (cy - vp.panY) / oldH;
      vp.zoom = nextZoom;
      vp.panX = cx - rx * newW;
      vp.panY = cy - ry * newH;
      applyViewBox();
    }

    function toVB(clientX, clientY, clampToSafe = false) {
      const ctm = svg.getScreenCTM && svg.getScreenCTM();
      let locX = VB_W / 2, locY = VB_H / 2;
      if (ctm && typeof svg.createSVGPoint === 'function') {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const loc = pt.matrixTransform(ctm.inverse());
        locX = loc.x;
        locY = loc.y;
      } else {
        const r = svg.getBoundingClientRect();
        if (r.width && r.height) {
          locX = vp.panX + ((clientX - r.left) / r.width) * (VB_W / vp.zoom);
          locY = vp.panY + ((clientY - r.top) / r.height) * (VB_H / vp.zoom);
        }
      }
      if (clampToSafe) {
        return {
          x: Math.max(-240, Math.min(VB_W + 240, Math.round(locX))),
          y: Math.max(-160, Math.min(VB_H + 160, Math.round(locY)))
        };
      }
      return { x: Math.round(locX), y: Math.round(locY) };
    }

    function vbToStagePx(vbX, vbY) {
      const stageRect = stageEl ? stageEl.getBoundingClientRect() : null;
      const ctm = svg.getScreenCTM && svg.getScreenCTM();
      if (ctm && stageRect && typeof svg.createSVGPoint === 'function') {
        const pt = svg.createSVGPoint();
        pt.x = vbX;
        pt.y = vbY;
        const sc = pt.matrixTransform(ctm);
        return {
          x: sc.x - stageRect.left,
          y: sc.y - stageRect.top,
          scaleX: ctm.a || 1,
          scaleY: ctm.d || 1
        };
      }
      const r = svg.getBoundingClientRect();
      const vw = VB_W / vp.zoom, vh = VB_H / vp.zoom;
      const scaleX = r.width ? r.width / vw : 1;
      const scaleY = r.height ? r.height / vh : 1;
      return {
        x: (r.left - (stageRect?.left || r.left)) + (vbX - vp.panX) * scaleX,
        y: (r.top - (stageRect?.top || r.top)) + (vbY - vp.panY) * scaleY,
        scaleX,
        scaleY
      };
    }

    function positionInlineEditor() {
      if (!inlineEdit || !inlineInput) return;
      if (inlineEdit.kind === 'node') {
        const nd = data.nodes.find(n => n.id === inlineEdit.id);
        if (!nd) return;
        const box = getNodeBox(nd, isBT);
        const pos = vbToStagePx(nd.x, nd.y);
        const wPx = Math.max(64, (box.w - 6) * pos.scaleX);
        const hPx = Math.max(26, (box.h - 6) * pos.scaleY);
        inlineInput.style.left = `${pos.x.toFixed(1)}px`;
        inlineInput.style.top = `${pos.y.toFixed(1)}px`;
        inlineInput.style.width = `${wPx.toFixed(1)}px`;
        inlineInput.style.height = `${hPx.toFixed(1)}px`;
        inlineInput.style.fontSize = `${Math.max(11, Math.min(18, 12 * pos.scaleY)).toFixed(1)}px`;
        inlineInput.classList.toggle('is-bt', isBT);
        inlineInput.classList.remove('is-edge');
      } else {
        const ed = data.edges.find(e => e.id === inlineEdit.id);
        const g = ed ? edgeGeometry(ed) : null;
        if (!ed || !g) return;
        const pos = vbToStagePx(g.lx, g.ly);
        const pillW = Math.max(88, Math.ceil(measureLabelWidth(inlineInput.value || '触发事件') + 26));
        inlineInput.style.left = `${pos.x.toFixed(1)}px`;
        inlineInput.style.top = `${pos.y.toFixed(1)}px`;
        inlineInput.style.width = `${Math.max(78, pillW * pos.scaleX).toFixed(1)}px`;
        inlineInput.style.height = `${Math.max(24, 24 * pos.scaleY).toFixed(1)}px`;
        inlineInput.style.fontSize = `${Math.max(11, Math.min(16, 11.5 * pos.scaleY)).toFixed(1)}px`;
        inlineInput.classList.remove('is-bt');
        inlineInput.classList.add('is-edge');
      }
    }

    function commitInlineEdit() {
      if (!inlineEdit || inlineEdit.committed) return;
      const cur = inlineEdit;
      cur.committed = true;
      const trimmed = inlineInput ? String(inlineInput.value || '').trim() : cur.origLabel;
      const item = cur.kind === 'node'
        ? data.nodes.find(n => n.id === cur.id)
        : data.edges.find(e => e.id === cur.id);
      if (item) {
        if (cur.kind === 'node') item.label = trimmed || cur.origLabel || '未命名';
        else item.label = trimmed;
        if (cur.preUndoSnap && item.label !== cur.origLabel) {
          undoStack.push(cur.preUndoSnap);
          if (undoStack.length > 35) undoStack.shift();
          redoStack = [];
        }
      }
      inlineEdit = null;
      if (inlineInput) inlineInput.classList.add('hidden');
      render();
      notifyChange();
    }

    function cancelInlineEdit() {
      if (!inlineEdit || inlineEdit.committed) return;
      const cur = inlineEdit;
      cur.committed = true;
      const item = cur.kind === 'node'
        ? data.nodes.find(n => n.id === cur.id)
        : data.edges.find(e => e.id === cur.id);
      if (item) item.label = cur.origLabel;
      inlineEdit = null;
      if (inlineInput) inlineInput.classList.add('hidden');
      render();
    }

    function startInlineEdit(kind, id, editOpts = {}) {
      if (isLocked || !inlineInput) return;
      if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
      const item = kind === 'node'
        ? data.nodes.find(n => n.id === id)
        : data.edges.find(e => e.id === id);
      if (!item) return;
      const origLabel = item.label || '';
      const preUndoSnap = editOpts.preUndoSnap !== undefined ? editOpts.preUndoSnap : cloneData(data, boardSpec);
      inlineEdit = { kind, id, origLabel, preUndoSnap, committed: false };
      selected = { kind, id };
      inlineInput.value = origLabel;
      inlineInput.placeholder = editOpts.placeholder || (kind === 'node' ? '输入名称...' : '输入触发事件...');
      inlineInput.classList.remove('hidden');
      render();
      positionInlineEditor();
      inlineInput.focus();
      if (editOpts.selectAll !== false) inlineInput.select();
      setStatus(kind === 'node'
        ? '正在原位编辑：输入名称时形状随字数自动伸缩，回车确认 / Esc 取消'
        : '正在原位编辑连线事件名：回车确认 / Esc 取消');
    }

    if (inlineInput) {
      inlineInput.addEventListener('compositionstart', () => { isComposing = true; });
      inlineInput.addEventListener('compositionend', () => {
        isComposing = false;
        if (!inlineEdit || inlineEdit.committed) return;
        const item = inlineEdit.kind === 'node'
          ? data.nodes.find(n => n.id === inlineEdit.id)
          : data.edges.find(e => e.id === inlineEdit.id);
        if (item) {
          item.label = inlineInput.value;
          render();
          positionInlineEditor();
        }
      });
      inlineInput.addEventListener('input', () => {
        if (!inlineEdit || inlineEdit.committed) return;
        const item = inlineEdit.kind === 'node'
          ? data.nodes.find(n => n.id === inlineEdit.id)
          : data.edges.find(e => e.id === inlineEdit.id);
        if (item) {
          item.label = inlineInput.value;
          render();
          positionInlineEditor();
        }
      });
      inlineInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (isComposing || e.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          commitInlineEdit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelInlineEdit();
        }
      });
      inlineInput.addEventListener('blur', () => {
        if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
      });
    }

    function setTool(nextTool) {
      tool = nextTool;
      connectFrom = null;
      containerEl.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === nextTool));
      if (nextTool === 'connect') setStatus(isBT ? '连线模式：先点击父节点，再点击子节点建立父子边（或直接悬停节点边缘圆点拖连）' : '连线模式：先点击源状态，再点击目标状态建立有向转换（也可悬停状态圆点直接拖连）');
      else setStatus('选择/拖移调弧模式：拖动节点对齐；选中箭头可自由拖动头/尾端点、拖动金色菱形调弧度！');
      render();
    }

    function autoLayoutBT() {
      if (!data.nodes.length) return;
      pushUndo();
      const childrenOf = new Map();
      const hasParent = new Set();
      data.nodes.forEach(n => childrenOf.set(n.id, []));
      data.edges.forEach(e => {
        if (e.from && e.to && childrenOf.has(e.from) && e.from !== e.to) {
          childrenOf.get(e.from).push(e.to);
          hasParent.add(e.to);
        }
      });
      const roots = data.nodes.filter(n => !hasParent.has(n.id));
      if (!roots.length) roots.push(data.nodes[0]);

      const visited = new Set();
      const levels = [];
      let queue = roots.map(r => r.id);
      roots.forEach(r => visited.add(r.id));
      while (queue.length && levels.length < 8) {
        levels.push(queue);
        const nextQ = [];
        for (const nid of queue) {
          const chs = (childrenOf.get(nid) || [])
            .map(id => data.nodes.find(x => x.id === id))
            .filter(Boolean)
            .sort((a, b) => a.x - b.x);
          for (const ch of chs) {
            if (!visited.has(ch.id)) {
              visited.add(ch.id);
              nextQ.push(ch.id);
            }
          }
        }
        queue = nextQ;
      }
      const orphan = data.nodes.filter(n => !visited.has(n.id)).map(n => n.id);
      if (orphan.length) levels.push(orphan);

      const gapY = Math.max(76, Math.min(96, Math.floor((VB_H - 72) / Math.max(1, levels.length - 1))));
      levels.forEach((row, rIdx) => {
        const y = snap12(Math.min(VB_H - 36, 48 + rIdx * gapY));
        const span = VB_W - 110;
        row.forEach((nid, cIdx) => {
          const nd = data.nodes.find(x => x.id === nid);
          if (nd) {
            nd.x = snap12(55 + ((cIdx + 1) / (row.length + 1)) * span);
            nd.y = y;
          }
        });
      });
      render();
      notifyChange();
      setStatus('已按树状层级自动对齐全部节点');
    }

    function addFsmNodeAt(x, y, autoEdit = true) {
      if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
      pushUndo();
      const id = `n${seq++}`;
      const isFirst = data.nodes.length === 0;
      const sx = snap12(x), sy = snap12(y);
      data.nodes.push({
        id, x: sx, y: sy,
        label: isFirst ? '巡逻 Patrol' : `状态${data.nodes.length + 1}`,
        nodeType: 'state',
        isInitial: isFirst
      });
      selected = { kind: 'node', id };
      setTool('select');
      notifyChange();
      if (autoEdit) {
        startInlineEdit('node', id, {
          preUndoSnap: null,
          selectAll: true,
          placeholder: '输入状态名...'
        });
      }
    }

    function addBtNodeAt(nt, x, y, autoEdit = true) {
      if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
      const defaults = {
        root: 'Root 根',
        selector: 'Selector (?)',
        sequence: 'Sequence (→)',
        parallel: 'Parallel (⇉)',
        decorator: 'Until Failure',
        condition: '看到玩家？',
        action: '移动 / 攻击'
      };
      pushUndo();
      const id = `n${seq++}`;
      const sx = snap12(x), sy = snap12(y);
      data.nodes.push({
        id, x: sx, y: sy,
        label: defaults[nt] || nt,
        nodeType: nt,
        isInitial: false
      });
      selected = { kind: 'node', id };
      setTool('select');
      notifyChange();
      if (autoEdit) {
        startInlineEdit('node', id, {
          preUndoSnap: null,
          selectAll: true,
          placeholder: '输入节点名...'
        });
      }
    }

    function addFreeArrowAt(x, y) {
      if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
      pushUndo();
      const id = `e${seq++}`;
      const sx = snap12(x - 66), sy = snap12(y);
      const ex = snap12(x + 66), ey = snap12(y);
      data.edges.push({
        id,
        from: null,
        to: null,
        fromPt: { x: sx, y: sy },
        toPt: { x: ex, y: ey },
        label: ''
      });
      selected = { kind: 'edge', id };
      setTool('select');
      notifyChange();
      setStatus('已插入自由箭头！直接拖动尾端/箭头圆点吸附到节点，或双击箭头输入事件名。');
    }

    function deleteSelected() {
      if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
      if (!selected) { setStatus('请先点击选中要删除的节点或箭头'); return; }
      pushUndo();
      if (selected.kind === 'node') {
        data.nodes = data.nodes.filter(n => n.id !== selected.id);
        data.edges = data.edges.filter(e => e.from !== selected.id && e.to !== selected.id);
      } else {
        data.edges = data.edges.filter(e => e.id !== selected.id);
      }
      selected = null;
      render();
      notifyChange();
    }

    function doUndo() {
      if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
      if (!undoStack.length) { setStatus('没有可撤销的操作'); return; }
      redoStack.push(cloneData(data, boardSpec));
      data = undoStack.pop();
      selected = null;
      connectFrom = null;
      render();
      notifyChange();
      setStatus('已撤销上一步');
    }

    function doRedo() {
      if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
      if (!redoStack.length) { setStatus('没有可重做的操作'); return; }
      undoStack.push(cloneData(data, boardSpec));
      data = redoStack.pop();
      selected = null;
      connectFrom = null;
      render();
      notifyChange();
      setStatus('已重做操作');
    }

    wireZoomModal(
      containerEl, boardSpec,
      () => cloneData(data, boardSpec),
      (next) => { data = cloneData(next, boardSpec); render(); notifyChange(); },
      () => evalResult,
      isLocked, isZoomed, onCloseZoom
    );

    // Viewport HUD buttons & wheel zoom
    containerEl.querySelectorAll('[data-vp]').forEach(btn => {
      btn.onclick = () => {
        if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
        const act = btn.dataset.vp;
        if (act === 'in') zoomAt(1.2);
        else if (act === 'out') zoomAt(1 / 1.2);
        else if (act === 'reset') { vp = { zoom: 1, panX: 0, panY: 0 }; applyViewBox(); }
      };
    });

    if (stageEl) {
      stageEl.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey && !isZoomed) return;
        e.preventDefault();
        const pt = toVB(e.clientX, e.clientY, false);
        zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, pt);
        positionInlineEditor();
      }, { passive: false });
    }

    // Wire toolbar controls & HTML5 drag-drop palette
    if (!isLocked) {
      containerEl.querySelectorAll('[data-tool]').forEach(btn => {
        btn.onclick = () => setTool(btn.dataset.tool);
      });

      const addFsmBtn = containerEl.querySelector('[data-act="add-fsm"]');
      if (addFsmBtn) {
        addFsmBtn.onclick = () => {
          const pos = nextSmartPos(data.nodes, VB_W, VB_H, false);
          addFsmNodeAt(pos.x, pos.y, true);
        };
        addFsmBtn.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/plain', 'pal:fsm');
        });
      }

      containerEl.querySelectorAll('[data-add-bt]').forEach(btn => {
        btn.onclick = () => {
          const nt = btn.dataset.addBt;
          const pos = nextSmartPos(data.nodes, VB_W, VB_H, true, nt);
          addBtNodeAt(nt, pos.x, pos.y, true);
        };
        btn.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/plain', `pal:bt:${btn.dataset.addBt}`);
        });
      });

      const addArrowBtn = containerEl.querySelector('[data-act="add-arrow"]');
      if (addArrowBtn) {
        addArrowBtn.onclick = () => {
          const off = (data.edges.length * 24) % 96;
          addFreeArrowAt(vp.panX + (VB_W / vp.zoom) * 0.5, vp.panY + (VB_H / vp.zoom) * 0.45 + off);
        };
        addArrowBtn.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/plain', 'pal:arrow');
        });
      }

      svg.addEventListener('dragover', (e) => {
        if (e.dataTransfer) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
      });
      svg.addEventListener('drop', (e) => {
        const token = e.dataTransfer?.getData('text/plain') || '';
        if (!token.startsWith('pal:')) return;
        e.preventDefault();
        const pt = toVB(e.clientX, e.clientY, true);
        if (token === 'pal:fsm') addFsmNodeAt(pt.x, pt.y, true);
        else if (token === 'pal:arrow') addFreeArrowAt(pt.x, pt.y);
        else if (token.startsWith('pal:bt:')) addBtNodeAt(token.slice(7), pt.x, pt.y, true);
      });

      const actFlip = containerEl.querySelector('[data-act="flip-edge"]');
      if (actFlip) {
        actFlip.onclick = () => {
          if (!selected || selected.kind !== 'edge') {
            setStatus('请先点击选中一条连线/箭头，再点击「⇄ 反向」');
            return;
          }
          const ed = data.edges.find(e => e.id === selected.id);
          if (!ed) return;
          pushUndo();
          const tmpNode = ed.from, tmpPort = ed.fromPort, tmpPt = ed.fromPt ? { ...ed.fromPt } : null;
          ed.from = ed.to; ed.fromPort = ed.toPort || null; ed.fromPt = ed.toPt ? { ...ed.toPt } : null;
          ed.to = tmpNode; ed.toPort = tmpPort || null; ed.toPt = tmpPt;
          render();
          notifyChange();
          setStatus('已调换所选箭头方向！');
        };
      }

      const actResetCurve = containerEl.querySelector('[data-act="reset-curve"]');
      if (actResetCurve) {
        actResetCurve.onclick = () => {
          if (!selected || selected.kind !== 'edge') {
            setStatus('请先选中一条连线/箭头，再重置其弯曲弧度');
            return;
          }
          const ed = data.edges.find(e => e.id === selected.id);
          if (!ed) return;
          pushUndo();
          delete ed.cx;
          delete ed.cy;
          render();
          notifyChange();
          setStatus('已重置该连线弧度为默认直连');
        };
      }

      const actSetInit = containerEl.querySelector('[data-act="set-init"]');
      if (actSetInit) {
        actSetInit.onclick = () => {
          if (!selected || selected.kind !== 'node') {
            setStatus('请先点击选中一个状态圆，再点击「设为初始态 ●→」');
            return;
          }
          pushUndo();
          data.nodes.forEach(n => { n.isInitial = (n.id === selected.id); });
          render();
          notifyChange();
          setStatus('已设置实心初始箭头 ●→ 指向所选状态');
        };
      }

      const actLayout = containerEl.querySelector('[data-act="layout"]');
      if (actLayout) actLayout.onclick = autoLayoutBT;

      const actRename = containerEl.querySelector('[data-act="rename"]');
      if (actRename) {
        actRename.onclick = () => {
          if (!selected) { setStatus('请先点击选中要修改名称的节点或箭头（或直接双击）'); return; }
          startInlineEdit(selected.kind, selected.id, { selectAll: true });
        };
      }

      const actDel = containerEl.querySelector('[data-act="del"]');
      if (actDel) actDel.onclick = deleteSelected;

      const actUndo = containerEl.querySelector('[data-act="undo"]');
      if (actUndo) actUndo.onclick = doUndo;

      const actRedo = containerEl.querySelector('[data-act="redo"]');
      if (actRedo) actRedo.onclick = doRedo;

      const actClear = containerEl.querySelector('[data-act="clear"]');
      if (actClear) {
        actClear.onclick = () => {
          if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
          if (!data.nodes.length && !data.edges.length) return;
          pushUndo();
          data = { nodes: [], edges: [] };
          selected = null;
          connectFrom = null;
          render();
          notifyChange();
        };
      }

      containerEl.addEventListener('keydown', (e) => {
        if (isLocked) return;
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        if (e.key === 'F2' && selected) {
          e.preventDefault();
          startInlineEdit(selected.kind, selected.id, { selectAll: true });
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selected) { e.preventDefault(); deleteSelected(); }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) doRedo(); else doUndo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
          e.preventDefault();
          doRedo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          if (selected && selected.kind === 'node') {
            const src = data.nodes.find(n => n.id === selected.id);
            if (src) {
              e.preventDefault();
              pushUndo();
              const nid = `n${seq++}`;
              data.nodes.push({ ...src, id: nid, x: snap12(src.x + 36), y: snap12(src.y + 36), isInitial: false });
              selected = { kind: 'node', id: nid };
              render();
              notifyChange();
              setStatus('已复制选中节点');
            }
          }
        } else if (e.key === 'Escape') {
          connectFrom = null;
          selected = null;
          cancelInlineEdit();
          setTool('select');
        }
      });
    }

    function getStatusColor(status, fallback) {
      if (status === 'full') return '#10b981';
      if (status === 'partial') return '#f59e0b';
      if (status === 'miss') return '#f43f5e';
      return fallback;
    }

    function edgeGeometry(e) {
      const a = e.from ? data.nodes.find(n => n.id === e.from) : null;
      const b = e.to ? data.nodes.find(n => n.id === e.to) : null;
      if ((e.from && !a) || (e.to && !b)) return null;
      if (!a && !e.fromPt) return null;
      if (!b && !e.toPt) return null;

      // Self-loop on same node
      if (a && b && a.id === b.id) {
        const boxA = getNodeBox(a, isBT);
        const sx = a.x - 16, sy = a.y - boxA.hh + 2;
        const ex = a.x + 16, ey = a.y - boxA.hh + 2;
        const apexY = e.cy != null ? e.cy : (a.y - boxA.hh - 52);
        const mx = (sx + ex) / 2, my = apexY + 8;
        return {
          d: `M ${sx} ${sy} C ${a.x - 44} ${apexY}, ${a.x + 44} ${apexY}, ${ex} ${ey}`,
          sx, sy, ex, ey, mx, my, lx: a.x, ly: my - 4,
          isSelfLoop: true,
          isFloating: false
        };
      }

      const refA = a ? (e.fromPort ? getPortOutwardPt(a, e.fromPort, isBT, 2) : { x: a.x, y: a.y }) : e.fromPt;
      const refB = b ? (e.toPort ? getPortOutwardPt(b, e.toPort, isBT, 5) : { x: b.x, y: b.y }) : e.toPt;

      // Custom bend point explicitly dragged by user
      if (e.cx != null && e.cy != null) {
        const aim = { x: e.cx, y: e.cy };
        const pStart = a ? (e.fromPort ? getPortOutwardPt(a, e.fromPort, isBT, 2) : clipToNodeBoundary(a, aim.x, aim.y, isBT, 1)) : refA;
        const pEnd = b ? (e.toPort ? getPortOutwardPt(b, e.toPort, isBT, 5) : clipToNodeBoundary(b, aim.x, aim.y, isBT, 5)) : refB;
        const mx = 0.25 * pStart.x + 0.5 * e.cx + 0.25 * pEnd.x;
        const my = 0.25 * pStart.y + 0.5 * e.cy + 0.25 * pEnd.y;
        return {
          d: `M ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)} Q ${e.cx.toFixed(1)} ${e.cy.toFixed(1)} ${pEnd.x.toFixed(1)} ${pEnd.y.toFixed(1)}`,
          sx: pStart.x, sy: pStart.y, ex: pEnd.x, ey: pEnd.y, mx, my, lx: mx, ly: my,
          isSelfLoop: false, isFloating: !a && !b
        };
      }

      // Default smooth vertical hierarchy curve for un-ported BT parent -> child
      if (isBT && a && b && !e.fromPort && !e.toPort) {
        const ba = getNodeBox(a, true);
        const bb = getNodeBox(b, true);
        const sx = a.x, sy = a.y + ba.hh;
        const ex = b.x, ey = b.y - bb.hh - 4;
        const cy = (sy + ey) / 2;
        return {
          d: `M ${sx} ${sy} C ${sx} ${cy}, ${ex} ${cy}, ${ex} ${ey}`,
          sx, sy, ex, ey, mx: (sx + ex) / 2, my: cy, lx: (sx + ex) / 2, ly: cy,
          isSelfLoop: false, isFloating: false
        };
      }

      // Bidirectional FSM pair auto-separation
      const hasRev = !isBT && a && b && data.edges.some(o => o.id !== e.id && o.from === e.to && o.to === e.from && o.cx == null);
      if (hasRev && !e.fromPort && !e.toPort) {
        const dx = refB.x - refA.x, dy = refB.y - refA.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / dist, uy = dy / dist;
        const nx = -uy, ny = ux;
        const curveOffset = Math.min(48, Math.max(26, dist * 0.22));
        const mx0 = (refA.x + refB.x) / 2 + nx * curveOffset;
        const my0 = (refA.y + refB.y) / 2 + ny * curveOffset;
        const pStart = clipToNodeBoundary(a, mx0, my0, false, 1);
        const pEnd = clipToNodeBoundary(b, mx0, my0, false, 5);
        const ctrlX = mx0 + nx * (curveOffset * 0.45);
        const ctrlY = my0 + ny * (curveOffset * 0.45);
        const mx = 0.25 * pStart.x + 0.5 * ctrlX + 0.25 * pEnd.x;
        const my = 0.25 * pStart.y + 0.5 * ctrlY + 0.25 * pEnd.y;
        return {
          d: `M ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${pEnd.x.toFixed(1)} ${pEnd.y.toFixed(1)}`,
          sx: pStart.x, sy: pStart.y, ex: pEnd.x, ey: pEnd.y, mx, my, lx: mx, ly: my,
          isSelfLoop: false, isFloating: false
        };
      }

      const pStart = a ? (e.fromPort ? getPortOutwardPt(a, e.fromPort, isBT, 2) : clipToNodeBoundary(a, refB.x, refB.y, isBT, 1)) : refA;
      const pEnd = b ? (e.toPort ? getPortOutwardPt(b, e.toPort, isBT, 5) : clipToNodeBoundary(b, refA.x, refA.y, isBT, 5)) : refB;
      const mx = (pStart.x + pEnd.x) / 2;
      const my = (pStart.y + pEnd.y) / 2;
      return {
        d: `M ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)} L ${pEnd.x.toFixed(1)} ${pEnd.y.toFixed(1)}`,
        sx: pStart.x, sy: pStart.y, ex: pEnd.x, ey: pEnd.y, mx, my, lx: mx, ly: my - 9,
        isSelfLoop: false, isFloating: !a && !b
      };
    }

    function computeBtChildOrder() {
      const orderMap = new Map();
      if (!isBT) return orderMap;
      const byParent = new Map();
      data.edges.forEach(e => {
        if (!e.from || !e.to) return;
        if (!byParent.has(e.from)) byParent.set(e.from, []);
        byParent.get(e.from).push(e);
      });
      byParent.forEach(edges => {
        if (edges.length < 2) return;
        const sorted = [...edges].sort((ea, eb) => {
          const na = data.nodes.find(n => n.id === ea.to);
          const nb = data.nodes.find(n => n.id === eb.to);
          return (na ? na.x : 0) - (nb ? nb.x : 0);
        });
        sorted.forEach((ed, idx) => orderMap.set(ed.id, `#${idx + 1}`));
      });
      return orderMap;
    }

    function render() {
      applyViewBox();
      const ns = evalResult?.nodeStatuses || {};
      const es = evalResult?.edgeStatuses || {};
      const btOrder = computeBtChildOrder();

      if (legendEl) {
        if (evalResult) {
          legendEl.innerHTML = `
            <span class="db-leg-dot" style="background:#10b981"></span>匹配正确
            <span class="db-leg-dot" style="background:#f59e0b;margin-left:8px"></span>部分命中
            <span class="db-leg-dot" style="background:#64748b;margin-left:8px"></span>其余图元`;
        } else {
          legendEl.textContent = isBT ? '同级子节点从左到右按 #1 → #2 → #3 执行 · 金色菱形可调曲线' : '●→ 初始状态 · 悬停节点圆点可拖出自由箭头';
        }
      }

      const uid = containerEl.id || 'db';
      let svgHTML = `
        <defs>
          <pattern id="grid-${uid}" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.15" fill="rgba(148,163,184,0.22)"/>
          </pattern>
          <marker id="arr-${uid}-def" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M1,1.5 L8,4.5 L1,7.5 Z" fill="#7dd3fc"/>
          </marker>
          <marker id="arr-${uid}-sel" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M1,1.5 L8,4.5 L1,7.5 Z" fill="#fde047"/>
          </marker>
          <marker id="arr-${uid}-full" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M1,1.5 L8,4.5 L1,7.5 Z" fill="#10b981"/>
          </marker>
          <marker id="arr-${uid}-partial" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M1,1.5 L8,4.5 L1,7.5 Z" fill="#f59e0b"/>
          </marker>
          <marker id="arr-${uid}-init" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M1,1.5 L8,4.5 L1,7.5 Z" fill="#fde047"/>
          </marker>
        </defs>
        <rect x="-1200" y="-800" width="3200" height="2200" fill="url(#grid-${uid})"/>`;

      if (!data.nodes.length && !data.edges.length) {
        svgHTML += `<text x="${VB_W / 2}" y="${VB_H / 2 - 8}" text-anchor="middle" fill="#64748b" font-size="14" font-family="${FONT_STACK}" font-weight="700">${isBT ? '点击或拖入左侧「+ Selector ?」「+ Sequence →」等按钮绘制行为树' : '点击或拖入左侧「+ 添加状态圆」开始绘制状态迁移图'}</text>
                    <text x="${VB_W / 2}" y="${VB_H / 2 + 16}" text-anchor="middle" fill="#475569" font-size="12" font-family="${FONT_STACK}">悬停节点四向圆点可拉出箭头 · 选中箭头可自由拖拽首尾与金色弧度控点</text>`;
      }

      // Alignment guides while dragging nodes
      for (const g of alignGuides) {
        if (g.type === 'v') {
          svgHTML += `<line class="db-align-guide" x1="${g.x}" y1="${g.y1}" x2="${g.x}" y2="${g.y2}"/>`;
        } else {
          svgHTML += `<line class="db-align-guide" x1="${g.x1}" y1="${g.y}" x2="${g.x2}" y2="${g.y}"/>`;
        }
      }

      // Edges
      for (const e of data.edges) {
        const g = edgeGeometry(e);
        if (!g) continue;
        const st = es[e.id];
        const isSel = selected && selected.kind === 'edge' && selected.id === e.id;
        const isEditingEdge = inlineEdit && inlineEdit.kind === 'edge' && inlineEdit.id === e.id && !inlineEdit.committed;
        const stroke = isSel ? '#fde047' : getStatusColor(st, '#7dd3fc');
        const markKey = isSel ? 'sel' : (st === 'full' ? 'full' : (st === 'partial' ? 'partial' : 'def'));
        const orderBadge = btOrder.get(e.id) || '';
        const txt = [orderBadge, e.label || ''].filter(Boolean).join(' ');

        svgHTML += `<g class="db-edge ${isSel ? 'is-selected' : ''}" data-edge-id="${escHtml(e.id)}" style="cursor:${isLocked ? 'default' : 'pointer'}">
          <path d="${g.d}" fill="none" stroke="transparent" stroke-width="15"/>
          <path d="${g.d}" fill="none" stroke="${stroke}" stroke-width="${isSel ? 3.2 : 2.3}" stroke-linecap="round" marker-end="url(#arr-${uid}-${markKey})"/>`;
        if (txt && !isEditingEdge) {
          const pw = Math.max(42, Math.ceil(measureLabelWidth(txt) + 18));
          svgHTML += `
            <rect x="${g.lx - pw / 2}" y="${g.ly - 11}" width="${pw}" height="21" rx="10" fill="#0f172a" stroke="${stroke}" stroke-width="1.3"/>
            <text x="${g.lx}" y="${g.ly + 3.5}" text-anchor="middle" fill="#f8fafc" font-size="11" font-family="${FONT_STACK}" font-weight="700">${escHtml(txt)}</text>`;
        } else if (!isBT && !isSel && !isEditingEdge) {
          svgHTML += `<circle cx="${g.lx}" cy="${g.ly}" r="4.5" fill="#0f172a" stroke="${stroke}" stroke-width="1.3"/>`;
        }
        svgHTML += `</g>`;
      }

      // Live rubber-band preview when dragging out of a port
      if (dragState && dragState.type === 'port-connect') {
        const srcNode = data.nodes.find(n => n.id === dragState.fromId);
        if (srcNode) {
          const p0 = getPortOutwardPt(srcNode, dragState.fromPort, isBT, 2);
          svgHTML += `<line x1="${p0.x}" y1="${p0.y}" x2="${dragState.curX}" y2="${dragState.curY}" stroke="#38bdf8" stroke-width="2.4" stroke-dasharray="5 4" marker-end="url(#arr-${uid}-def)"/>`;
        }
      }

      // Nodes + Hover 4-way ports
      for (const n of data.nodes) {
        const st = ns[n.id];
        const isSel = selected && selected.kind === 'node' && selected.id === n.id;
        const isConnSrc = connectFrom === n.id;
        const isSnapHost = snapHighlight && snapHighlight.nodeId === n.id;
        const isEditingNode = inlineEdit && inlineEdit.kind === 'node' && inlineEdit.id === n.id && !inlineEdit.committed;
        const box = getNodeBox(n, isBT);
        const ports = getNodePorts(n, isBT);
        const displayLbl = String(n.label || '').trim() || '未命名';

        let bodySVG = '';
        if (!isBT) {
          const baseStroke = n.isInitial ? '#fde047' : '#38bdf8';
          const stroke = isConnSrc ? '#f472b6' : (isSnapHost ? '#10b981' : (isSel ? '#ffffff' : getStatusColor(st, baseStroke)));
          const fill = st === 'full' ? 'rgba(16, 185, 129, 0.24)' : (st === 'partial' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(56, 189, 248, 0.18)');

          if (n.isInitial) {
            svgHTML += `
              <circle cx="${n.x - box.hw - 30}" cy="${n.y}" r="5.5" fill="#fde047"/>
              <line x1="${n.x - box.hw - 25}" y1="${n.y}" x2="${n.x - box.hw - 5}" y2="${n.y}" stroke="#fde047" stroke-width="2.5" marker-end="url(#arr-${uid}-init)"/>`;
          }
          if (isSnapHost) {
            svgHTML += `<rect class="db-snap-ring" x="${n.x - box.hw - 7}" y="${n.y - box.hh - 7}" width="${box.w + 14}" height="${box.h + 14}" rx="${box.rx + 7}"/>`;
          }
          bodySVG = `
            <rect x="${n.x - box.hw}" y="${n.y - box.hh}" width="${box.w}" height="${box.h}" rx="${box.rx}" fill="${fill}" stroke="${stroke}" stroke-width="${isSel || isConnSrc ? 3.2 : 2.2}"/>
            ${!isEditingNode ? `<text x="${n.x}" y="${n.y + 4.5}" text-anchor="middle" fill="#f8fafc" font-size="11.5" font-family="${FONT_STACK}" font-weight="800">${escHtml(displayLbl)}</text>` : ''}`;
        } else {
          const meta = box.meta;
          const stroke = isConnSrc ? '#f472b6' : (isSnapHost ? '#10b981' : (isSel ? '#ffffff' : getStatusColor(st, meta.stroke)));
          const fill = st === 'full' ? 'rgba(16, 185, 129, 0.28)' : (st === 'partial' ? 'rgba(245, 158, 11, 0.24)' : meta.fill);
          if (isSnapHost) {
            svgHTML += `<rect class="db-snap-ring" x="${n.x - box.hw - 7}" y="${n.y - box.hh - 7}" width="${box.w + 14}" height="${box.h + 14}" rx="${box.rx + 4}"/>`;
          }
          bodySVG = `
            <rect x="${n.x - box.hw}" y="${n.y - box.hh}" width="${box.w}" height="${box.h}" rx="${box.rx}" fill="${fill}" stroke="${stroke}" stroke-width="${isSel || isConnSrc ? 3 : 2}"/>
            ${!isEditingNode ? `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="#f8fafc" font-size="11.5" font-family="${FONT_STACK}" font-weight="800">${escHtml(displayLbl)}</text>` : ''}`;
        }

        let portsSVG = '';
        if (!isLocked) {
          for (const pName of ['n', 'e', 's', 'w']) {
            const p = ports[pName];
            const portHot = isSnapHost && snapHighlight.port === pName;
            portsSVG += `
              <g class="db-port-wrap" data-port-node="${escHtml(n.id)}" data-port="${pName}">
                <circle cx="${p.x}" cy="${p.y}" r="14" fill="transparent"/>
                <circle class="db-port ${portHot ? 'is-hot' : ''}" cx="${p.x}" cy="${p.y}" r="${portHot ? 5.6 : 4.2}"/>
              </g>`;
          }
        }

        svgHTML += `<g class="db-node ${isSel ? 'is-selected' : ''} ${isSnapHost ? 'is-snap' : ''}" data-node-id="${escHtml(n.id)}" style="cursor:${isLocked ? 'default' : 'grab'}">${bodySVG}${portsSVG}</g>`;
      }

      // Draw.io-style 3 draggable handles for currently selected edge!
      if (!isLocked && selected && selected.kind === 'edge') {
        const selEdge = data.edges.find(e => e.id === selected.id);
        const sg = selEdge ? edgeGeometry(selEdge) : null;
        if (sg) {
          svgHTML += `
            <g class="db-handles-layer">
              ${!sg.isSelfLoop ? `
                <g data-edge-handle="start" style="cursor:crosshair">
                  <circle cx="${sg.sx}" cy="${sg.sy}" r="16" fill="transparent"/>
                  <circle class="db-edge-handle" cx="${sg.sx}" cy="${sg.sy}" r="5.5"/>
                </g>
                <g data-edge-handle="end" style="cursor:crosshair">
                  <circle cx="${sg.ex}" cy="${sg.ey}" r="16" fill="transparent"/>
                  <circle class="db-edge-handle is-end" cx="${sg.ex}" cy="${sg.ey}" r="5.5"/>
                </g>` : ''}
              <g data-edge-handle="mid" style="cursor:move">
                <circle cx="${sg.mx}" cy="${sg.my}" r="16" fill="transparent"/>
                <polygon class="db-edge-handle is-mid" points="${sg.mx},${sg.my - 6.5} ${sg.mx + 6.5},${sg.my} ${sg.mx},${sg.my + 6.5} ${sg.mx - 6.5},${sg.my}"/>
              </g>
            </g>`;
        }
      }

      svg.innerHTML = svgHTML;
    }

    // Unified SVG pointer interactions (Strict hit priority: pinch -> edge handle -> port -> node -> edge -> canvas pan)
    svg.addEventListener('pointerdown', (e) => {
      if (isLocked) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.max(10, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
        pinchState = { dist, midX: (pts[0].x + pts[1].x) / 2, midY: (pts[0].y + pts[1].y) / 2 };
        dragState = null;
        snapHighlight = null;
        alignGuides = [];
        render();
        return;
      }
      if (inlineEdit && !inlineEdit.committed) commitInlineEdit();
      const tapTol = e.pointerType === 'touch' ? 24 : 8;
      const tapDelay = e.pointerType === 'touch' ? 420 : 360;
      const handleEl = e.target.closest('[data-edge-handle]');
      const portEl = e.target.closest('[data-port-node]');
      const nodeEl = e.target.closest('[data-node-id]');
      const edgeEl = e.target.closest('[data-edge-id]');
      const pt = toVB(e.clientX, e.clientY, false);
      const now = Date.now();

      // 1. Selected Edge Handles (start, end, mid bend)
      if (handleEl && selected?.kind === 'edge') {
        e.stopPropagation();
        const role = handleEl.dataset.edgeHandle;
        const ed = data.edges.find(x => x.id === selected.id);
        if (!ed) return;
        dragState = { type: `edge-${role}`, edgeId: ed.id, startPt: pt, moved: false };
        svg.setPointerCapture?.(e.pointerId);
        return;
      }

      // 2. Node Hover Port -> Live Rubber-Band Arrow Drag
      if (portEl) {
        e.stopPropagation();
        const nid = portEl.dataset.portNode;
        const pname = portEl.dataset.port;
        dragState = {
          type: 'port-connect',
          fromId: nid,
          fromPort: pname,
          startPt: pt,
          curX: pt.x,
          curY: pt.y,
          moved: false
        };
        svg.setPointerCapture?.(e.pointerId);
        render();
        return;
      }

      // 3. Node Body (Connect click OR Double-Click Inline Rename OR Node Drag)
      if (nodeEl) {
        const nid = nodeEl.dataset.nodeId;
        if (tool === 'connect') {
          if (!connectFrom) {
            connectFrom = nid;
            selected = { kind: 'node', id: nid };
            setStatus(isBT ? '已选父节点，请点击子节点完成父→子连线' : '已选起始状态，请点击目标状态建立转换连线');
            render();
            return;
          }
          if (isBT && connectFrom === nid) {
            connectFrom = null;
            setStatus('行为树不允许节点连接自己，请选择另一个子节点');
            render();
            return;
          }
          pushUndo();
          const newId = `e${seq++}`;
          data.edges.push({ id: newId, from: connectFrom, to: nid, label: '' });
          connectFrom = null;
          selected = { kind: 'edge', id: newId };
          setTool('select');
          notifyChange();
          if (!isBT) {
            e.preventDefault();
            startInlineEdit('edge', newId, {
              preUndoSnap: null,
              selectAll: true,
              placeholder: '输入触发事件...'
            });
          }
          return;
        }
        if (lastTap && lastTap.kind === 'node' && lastTap.id === nid && (now - lastTap.time) < tapDelay && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < tapTol) {
          lastTap = null;
          dragState = null;
          e.preventDefault();
          startInlineEdit('node', nid, { selectAll: true });
          return;
        }
        lastTap = { kind: 'node', id: nid, time: now, x: e.clientX, y: e.clientY };
        containerEl.focus({ preventScroll: true });
        selected = { kind: 'node', id: nid };
        const nd = data.nodes.find(n => n.id === nid);
        if (nd) {
          dragState = { type: 'node', id: nid, ox: nd.x - pt.x, oy: nd.y - pt.y, moved: false };
          svg.setPointerCapture?.(e.pointerId);
        }
        render();
        return;
      }

      // 4. Edge Body -> Double-Click Inline Rename OR Select & Direct Move / Bend Curve
      if (edgeEl) {
        const eid = edgeEl.dataset.edgeId;
        if (lastTap && lastTap.kind === 'edge' && lastTap.id === eid && (now - lastTap.time) < tapDelay && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < tapTol) {
          lastTap = null;
          dragState = null;
          e.preventDefault();
          startInlineEdit('edge', eid, { selectAll: true });
          return;
        }
        lastTap = { kind: 'edge', id: eid, time: now, x: e.clientX, y: e.clientY };
        containerEl.focus({ preventScroll: true });
        selected = { kind: 'edge', id: eid };
        const ed = data.edges.find(x => x.id === eid);
        const g = ed ? edgeGeometry(ed) : null;
        if (ed && g) {
          dragState = {
            type: 'edge-body',
            edgeId: eid,
            startClientPt: pt,
            lastPt: pt,
            origFromPt: ed.fromPt ? { ...ed.fromPt } : null,
            origToPt: ed.toPt ? { ...ed.toPt } : null,
            origCx: ed.cx,
            origCy: ed.cy,
            sx0: g.sx, sy0: g.sy, ex0: g.ex, ey0: g.ey,
            moved: false
          };
          svg.setPointerCapture?.(e.pointerId);
        }
        render();
        return;
      }

      // 5. Empty Canvas -> Clear selection & Pan viewport
      lastTap = null;
      containerEl.focus({ preventScroll: true });
      selected = null;
      connectFrom = null;
      dragState = {
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        origPanX: vp.panX,
        origPanY: vp.panY,
        moved: false
      };
      svg.setPointerCapture?.(e.pointerId);
      render();
    });

    svg.addEventListener('pointermove', (e) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (pinchState && activePointers.size >= 2 && !isLocked) {
        const pts = Array.from(activePointers.values());
        const dist = Math.max(10, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const rect = svg.getBoundingClientRect();
        const scaleX = rect.width ? (VB_W / vp.zoom) / rect.width : 1;
        const scaleY = rect.height ? (VB_H / vp.zoom) / rect.height : 1;
        vp.panX = Math.max(-420, Math.min(VB_W * 0.65, vp.panX - (midX - pinchState.midX) * scaleX));
        vp.panY = Math.max(-260, Math.min(VB_H * 0.65, vp.panY - (midY - pinchState.midY) * scaleY));
        const vbMid = toVB(midX, midY, false);
        zoomAt(dist / pinchState.dist, vbMid);
        pinchState.dist = dist;
        pinchState.midX = midX;
        pinchState.midY = midY;
        return;
      }
      if (!dragState || isLocked) return;

      if (dragState.type === 'pan') {
        const dxPx = e.clientX - dragState.startX;
        const dyPx = e.clientY - dragState.startY;
        if (!dragState.moved && Math.hypot(dxPx, dyPx) < 4) return;
        dragState.moved = true;
        const rect = svg.getBoundingClientRect();
        const scaleX = rect.width ? (VB_W / vp.zoom) / rect.width : 1;
        const scaleY = rect.height ? (VB_H / vp.zoom) / rect.height : 1;
        vp.panX = Math.max(-420, Math.min(VB_W * 0.65, dragState.origPanX - dxPx * scaleX));
        vp.panY = Math.max(-260, Math.min(VB_H * 0.65, dragState.origPanY - dyPx * scaleY));
        applyViewBox();
        return;
      }

      const pt = toVB(e.clientX, e.clientY, false);

      if (dragState.type === 'node') {
        const nd = data.nodes.find(n => n.id === dragState.id);
        if (!nd) return;
        const rawX = pt.x + dragState.ox;
        const rawY = pt.y + dragState.oy;
        if (!dragState.moved && (Math.abs(rawX - nd.x) > 2 || Math.abs(rawY - nd.y) > 2)) {
          pushUndo();
          dragState.moved = true;
        }
        if (dragState.moved) {
          let nx = snap12(Math.max(-240, Math.min(VB_W + 240, rawX)));
          let ny = snap12(Math.max(-160, Math.min(VB_H + 160, rawY)));
          const guides = [];
          for (const o of data.nodes) {
            if (o.id === nd.id) continue;
            if (Math.abs(rawX - o.x) <= 7) {
              nx = o.x;
              guides.push({ type: 'v', x: o.x, y1: Math.min(ny, o.y) - 44, y2: Math.max(ny, o.y) + 44 });
            }
            if (Math.abs(rawY - o.y) <= 7) {
              ny = o.y;
              guides.push({ type: 'h', y: o.y, x1: Math.min(nx, o.x) - 44, x2: Math.max(nx, o.x) + 44 });
            }
          }
          nd.x = nx;
          nd.y = ny;
          alignGuides = guides;
          render();
        }
        return;
      }

      if (dragState.type === 'port-connect') {
        dragState.moved = dragState.moved || Math.hypot(pt.x - dragState.startPt.x, pt.y - dragState.startPt.y) > 6;
        const snap = findSnapTarget(pt, data.nodes, isBT, isBT ? dragState.fromId : null);
        snapHighlight = snap ? { nodeId: snap.nodeId, port: snap.port } : null;
        if (snap && snap.port) {
          const sp = getPortOutwardPt(snap.node, snap.port, isBT, 4);
          dragState.curX = sp.x;
          dragState.curY = sp.y;
        } else {
          dragState.curX = pt.x;
          dragState.curY = pt.y;
        }
        render();
        return;
      }

      const ed = data.edges.find(x => x.id === dragState.edgeId);
      if (!ed) return;

      if (dragState.type === 'edge-start' || dragState.type === 'edge-end') {
        const isStart = dragState.type === 'edge-start';
        if (!dragState.moved && Math.hypot(pt.x - dragState.startPt.x, pt.y - dragState.startPt.y) > 2) {
          pushUndo();
          dragState.moved = true;
        }
        if (dragState.moved) {
          const disallow = isBT ? (isStart ? ed.to : ed.from) : null;
          const snap = findSnapTarget(pt, data.nodes, isBT, disallow);
          snapHighlight = snap ? { nodeId: snap.nodeId, port: snap.port } : null;
          if (snap) {
            if (isStart) {
              ed.from = snap.nodeId; ed.fromPort = snap.port || null; ed.fromPt = null;
            } else {
              ed.to = snap.nodeId; ed.toPort = snap.port || null; ed.toPt = null;
            }
          } else {
            const snappedPt = { x: snap12(pt.x), y: snap12(pt.y) };
            if (isStart) {
              ed.from = null; ed.fromPort = null; ed.fromPt = snappedPt;
            } else {
              ed.to = null; ed.toPort = null; ed.toPt = snappedPt;
            }
          }
          render();
        }
        return;
      }

      if (dragState.type === 'edge-mid') {
        if (!dragState.moved && Math.hypot(pt.x - dragState.startPt.x, pt.y - dragState.startPt.y) > 2) {
          pushUndo();
          dragState.moved = true;
        }
        if (dragState.moved) {
          const g = edgeGeometry(ed);
          if (g && g.isSelfLoop) {
            ed.cy = Math.round(pt.y - 8);
          } else if (g) {
            ed.cx = Math.round(2 * pt.x - 0.5 * (g.sx + g.ex));
            ed.cy = Math.round(2 * pt.y - 0.5 * (g.sy + g.ey));
          }
          render();
        }
        return;
      }

      if (dragState.type === 'edge-body') {
        const dTotalX = pt.x - dragState.startClientPt.x;
        const dTotalY = pt.y - dragState.startClientPt.y;
        if (!dragState.moved && Math.hypot(dTotalX, dTotalY) < 4) return;
        if (!dragState.moved) {
          pushUndo();
          dragState.moved = true;
        }
        if (!ed.from && !ed.to && dragState.origFromPt && dragState.origToPt) {
          ed.fromPt = { x: snap12(dragState.origFromPt.x + dTotalX), y: snap12(dragState.origFromPt.y + dTotalY) };
          ed.toPt = { x: snap12(dragState.origToPt.x + dTotalX), y: snap12(dragState.origToPt.y + dTotalY) };
          if (dragState.origCx != null && dragState.origCy != null) {
            ed.cx = Math.round(dragState.origCx + dTotalX);
            ed.cy = Math.round(dragState.origCy + dTotalY);
          }
        } else {
          // Bending connected arrow directly from its midpoint formula
          ed.cx = Math.round(2 * pt.x - 0.5 * (dragState.sx0 + dragState.ex0));
          ed.cy = Math.round(2 * pt.y - 0.5 * (dragState.sy0 + dragState.ey0));
        }
        render();
      }
    });

    const endDrag = (e) => {
      if (e && e.pointerId != null) activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchState = null;
      if (!dragState) return;
      if (dragState.type === 'port-connect') {
        const pt = e ? toVB(e.clientX, e.clientY, false) : { x: dragState.curX, y: dragState.curY };
        const snap = findSnapTarget(pt, data.nodes, isBT, isBT ? dragState.fromId : null);
        const dist = Math.hypot(dragState.curX - dragState.startPt.x, dragState.curY - dragState.startPt.y);
        if (snap) {
          pushUndo();
          const newId = `e${seq++}`;
          data.edges.push({
            id: newId,
            from: dragState.fromId,
            fromPort: dragState.fromPort,
            to: snap.nodeId,
            toPort: snap.port || null,
            label: ''
          });
          selected = { kind: 'edge', id: newId };
          notifyChange();
          if (!isBT) {
            startInlineEdit('edge', newId, {
              preUndoSnap: null,
              selectAll: true,
              placeholder: '输入触发事件...'
            });
          }
        } else if (dist > 25) {
          pushUndo();
          const newId = `e${seq++}`;
          data.edges.push({
            id: newId,
            from: dragState.fromId,
            fromPort: dragState.fromPort,
            to: null,
            toPt: { x: snap12(pt.x), y: snap12(pt.y) },
            label: ''
          });
          selected = { kind: 'edge', id: newId };
          notifyChange();
          setStatus('已拖出自由箭头！可继续拖动箭头终点接入其他节点或调整弧度。');
        }
      } else if (dragState.moved && dragState.type !== 'pan') {
        notifyChange();
      }
      snapHighlight = null;
      alignGuides = [];
      dragState = null;
      render();
    };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    svg.addEventListener('dblclick', (e) => {
      if (isLocked) return;
      const handleEl = e.target.closest('[data-edge-handle]');
      if (handleEl && handleEl.dataset.edgeHandle === 'mid' && selected?.kind === 'edge') {
        const ed = data.edges.find(x => x.id === selected.id);
        if (ed && (ed.cx != null || ed.cy != null)) {
          pushUndo();
          delete ed.cx;
          delete ed.cy;
          render();
          notifyChange();
          setStatus('已双击重置该箭头弯曲弧度');
        }
        return;
      }
      const nodeEl = e.target.closest('[data-node-id]');
      const edgeEl = e.target.closest('[data-edge-id]');
      if (nodeEl) {
        const nid = nodeEl.dataset.nodeId;
        if (inlineEdit && inlineEdit.kind === 'node' && inlineEdit.id === nid && !inlineEdit.committed) return;
        startInlineEdit('node', nid, { selectAll: true });
      } else if (edgeEl) {
        const eid = edgeEl.dataset.edgeId;
        if (inlineEdit && inlineEdit.kind === 'edge' && inlineEdit.id === eid && !inlineEdit.committed) return;
        startInlineEdit('edge', eid, { selectAll: true });
      }
    });

    render();
    return {
      getData: () => cloneData(data, boardSpec),
      setData: (next) => { data = cloneData(next, boardSpec); render(); notifyChange(); },
      setEvalOverlay: (ev) => { evalResult = ev || null; render(); }
    };
  }

  global.DiagramBoard = {
    createBoardHTML,
    mountBoard,
    computePathCost,
    resolvePathDragHit,
    interpolateGridSteps
  };
})(window);
