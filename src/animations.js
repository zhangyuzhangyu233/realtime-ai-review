/* ==========================================================================
   Realtime AI Non-Linear Interactive Animation Engine (60fps HiDPI Canvas)
   True Spring Physics, Cubic-Bezier/Expo/Back Easing, Sub-Cell Gliding & Trails
   ========================================================================== */
(function(global) {
  'use strict';

  const activeInstances = new Map();

  /* -------------------- Non-Linear Easing & Spring Suite -------------------- */
  const clamp01 = t => t < 0 ? 0 : (t > 1 ? 1 : t);
  const Ease = {
    outExpo: t => { t = clamp01(t); return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    outQuint: t => { t = clamp01(t); return 1 - Math.pow(1 - t, 5); },
    inOutCubic: t => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    inOutQuint: t => { t = clamp01(t); return t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2; },
    outBack: t => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: t => {
      t = clamp01(t);
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    },
    expDamp: (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt)),
    dampAngle: (cur, target, lambda, dt) => {
      let diff = ((target - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      return cur + diff * (1 - Math.exp(-lambda * dt));
    }
  };

  function setupHiDPI(canvas, logicalW, logicalH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width || logicalW || 680));
    const h = Math.max(220, Math.round(rect.height || logicalH || 360));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, width = 2.4, headLen = 9) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(ang - 0.42), y2 - headLen * Math.sin(ang - 0.42));
    ctx.lineTo(x2 - headLen * Math.cos(ang + 0.42), y2 - headLen * Math.sin(ang + 0.42));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawTaperedTrail(ctx, pts, rgb, maxW = 4.2) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const n = pts.length;
    for (let i = 1; i < n; i++) {
      const ratio = i / n;
      const eased = ratio * ratio; // non-linear fade
      ctx.strokeStyle = `rgba(${rgb}, ${(0.08 + 0.85 * eased).toFixed(3)})`;
      ctx.lineWidth = Math.max(0.8, maxW * eased);
      ctx.beginPath();
      ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
      ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWhaleAgent(ctx, x, y, angle = 0, r = 13, color = '#38bdf8', wag = 0, squash = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(squash, 2 - squash); // organic squash & stretch
    ctx.shadowColor = color; ctx.shadowBlur = 14;
    // Undulating tail fin
    const tw = Math.sin(wag) * r * 0.34;
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(-r * 0.68, 0);
    ctx.quadraticCurveTo(-r * 1.15, tw * 0.6 - r * 0.4, -r * 1.48, tw - r * 0.56);
    ctx.lineTo(-r * 1.16, tw * 0.5);
    ctx.lineTo(-r * 1.48, tw + r * 0.56);
    ctx.quadraticCurveTo(-r * 1.15, tw * 0.6 + r * 0.4, -r * 0.68, 0);
    ctx.closePath();
    ctx.fill();
    // Chubby whale body
    const grad = ctx.createRadialGradient(r * 0.24, -r * 0.22, 2, 0, 0, r * 1.12);
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(0.52, color);
    grad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Belly sheen
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.beginPath(); ctx.ellipse(r * 0.14, r * 0.34, r * 0.54, r * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    // Sparkling chibi eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(r * 0.42, -r * 0.16, r * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r * 0.46, -r * 0.21, r * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawGridBg(ctx, w, h, step = 28) {
    ctx.fillStyle = '#0a1428';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.065)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }

  function drawBadge(ctx, x, y, text, bg = 'rgba(12,22,44,0.88)', fg = '#e2e8f0') {
    ctx.save();
    ctx.font = 'bold 11.5px "Microsoft YaHei UI", sans-serif';
    const m = ctx.measureText(text);
    const pw = m.width + 14, ph = 22;
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(x, y, pw, ph, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(125,211,252,0.28)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = fg; ctx.fillText(text, x + 7, y + 15);
    ctx.restore();
  }

  /* ========================================================================
     1. PHYSICS ENGINE (Non-linear squash bounce, shockwave rings, smooth vectors)
     ======================================================================== */
  function createPhysicsAnim(container, opts = {}) {
    let mode = opts.mode || 'reflect';
    let playing = true, speed = 1, t = 0;
    const p = opts.params || {};
    let targetSlope = p.slopeAngle !== undefined ? p.slopeAngle : (p.wallType === 'vertical' ? 90 : (p.wallType === 'horizontal' ? 0 : 37));
    let slopeAngle = targetSlope;
    let dotAngleDeg = p.dotAngle !== undefined ? p.dotAngle : 42;
    let manualDot = false;
    let ballTrail = [];

    const canvas = container.querySelector('canvas');
    const side = container.querySelector('.anim-side-panel');
    const narrator = container.querySelector('.anim-narrator');
    let lastSideTime = 0;

    function updateSide(rows, tip) {
      if (narrator && tip) narrator.textContent = tip;
      if (!side) return;
      side.innerHTML = `<h4>实时物理遥测 HUD</h4><div class="hud-box">${rows.map(r => `<div class="hud-row"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div>` +
        (mode === 'reflect' ? `<div class="hud-box"><div style="color:#7dd3fc;font-weight:700;margin-bottom:6px">拖动碰撞面倾角 (${Math.round(targetSlope)}°)</div><input type="range" min="0" max="90" value="${targetSlope}" class="phys-angle-slider" style="width:100%;accent-color:#38bdf8"><div style="font-size:11px;color:#94a3b8;margin-top:4px">0°=水平边栏 | 90°=竖直墙面 | 37°=斜面反射</div></div>` : '') +
        (mode === 'dot' ? `<div class="hud-box"><div style="color:#7dd3fc;font-weight:700;margin-bottom:6px">拖动向量夹角 θ (${Math.round(dotAngleDeg)}°)</div><input type="range" min="0" max="180" value="${dotAngleDeg}" class="phys-dot-slider" style="width:100%;accent-color:#38bdf8"><div style="font-size:11px;color:#94a3b8;margin-top:4px">&lt;90°点积&gt;0 | 90°垂直(=0) | &gt;90°点积&lt;0</div></div>` : '');
      const s1 = side.querySelector('.phys-angle-slider');
      if (s1) s1.oninput = e => { targetSlope = Number(e.target.value); ballTrail = []; };
      const s2 = side.querySelector('.phys-dot-slider');
      if (s2) s2.oninput = e => { manualDot = true; dotAngleDeg = Number(e.target.value); };
    }

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      drawGridBg(ctx, w, h);
      if (playing) t += dt * speed;
      slopeAngle = Ease.expDamp(slopeAngle, targetSlope, 10, dt);

      if (mode === 'parabola') {
        const v0 = p.v0 || 20, deg = p.deg || 38, g = 10;
        const rad = deg * Math.PI / 180;
        const vx = v0 * Math.cos(rad), vy = v0 * Math.sin(rad);
        const T = (2 * vy) / g;
        const curT = t % (T + 0.95);
        const ct = Math.min(curT, T);
        const landPhase = curT > T ? clamp01((curT - T) / 0.95) : 0;
        const groundY = h - 42, startX = 65;
        const scaleX = (w - 130) / Math.max(1, vx * T);
        const maxH = (vy * vy) / (2 * g);
        const scaleY = (h - 105) / Math.max(1, maxH);

        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(30, groundY); ctx.lineTo(w - 30, groundY); ctx.stroke();

        // Full dotted parabola
        ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let k = 0; k <= 54; k++) {
          const tt = (T * k) / 54;
          const px = startX + vx * tt * scaleX;
          const py = groundY - (vy * tt - 0.5 * g * tt * tt) * scaleY;
          k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke(); ctx.setLineDash([]);

        // Glowing tapered comet trail
        const pts = [];
        for (let k = 0; k <= 34; k++) {
          const tt = (ct * k) / 34;
          pts.push([startX + vx * tt * scaleX, groundY - (vy * tt - 0.5 * g * tt * tt) * scaleY]);
        }
        drawTaperedTrail(ctx, pts, '56, 189, 248', 5);

        const bx = startX + vx * ct * scaleX;
        const by = groundY - (vy * ct - 0.5 * g * ct * ct) * scaleY;
        const curVy = vy - g * ct;

        ctx.fillStyle = '#34d399'; ctx.beginPath(); ctx.arc(bx, groundY, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(startX, by, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, groundY); ctx.moveTo(bx, by); ctx.lineTo(startX, by); ctx.stroke();
        ctx.setLineDash([]);

        drawArrow(ctx, bx, by, bx + vx * 2.5, by, '#34d399', 2.4);
        drawArrow(ctx, bx, by, bx, by - curVy * 2.5, '#fbbf24', 2.4);
        drawArrow(ctx, bx, by, bx + vx * 2.5, by - curVy * 2.5, '#f472b6', 2.8);

        // Elastic landing ripple
        if (landPhase > 0) {
          const rp = Ease.outExpo(landPhase);
          ctx.strokeStyle = `rgba(249,115,22,${(1 - rp) * 0.85})`; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.ellipse(bx, groundY, 10 + rp * 42, 4 + rp * 12, 0, 0, Math.PI * 2); ctx.stroke();
        }
        const squash = landPhase > 0 ? 1 + Math.sin(landPhase * Math.PI * 3) * 0.25 * (1 - landPhase) : 1;
        ctx.save(); ctx.translate(bx, by); ctx.scale(squash, 2 - squash);
        ctx.fillStyle = '#f97316'; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();

        drawBadge(ctx, 14, 14, '绿=水平匀速 vx (a=0) | 黄=竖直匀减速 vy (-g) | 粉=合速度 v', 'rgba(12,22,44,0.88)', '#bae6fd');
        if (performance.now() - lastSideTime > 120) {
          lastSideTime = performance.now();
          updateSide([
            ['运动时间 t', ct.toFixed(2) + ' s'],
            ['水平速度 vx (恒定)', vx.toFixed(1) + ' m/s'],
            ['竖直速度 vy(t)', curVy.toFixed(1) + ' m/s'],
            ['水平位移 x = vx·t', (vx * ct).toFixed(1) + ' m'],
            ['竖直高度 y', Math.max(0, vy * ct - 0.5 * g * ct * ct).toFixed(1) + ' m'],
            ['总飞行时间 T', T.toFixed(2) + ' s']
          ], '抛物运动独立性原理：水平方向匀速直线，竖直方向只受重力做匀变速运动！');
        }
      } else if (mode === 'reflect') {
        const cx = w * 0.5, cy = h * 0.54;
        const rad = slopeAngle * Math.PI / 180;
        const tx = Math.cos(rad), ty = -Math.sin(rad);
        let nx = -ty, ny = tx;
        if (ny > 0.01 && slopeAngle < 85) { nx = -nx; ny = -ny; }
        if (slopeAngle >= 85) { nx = -1; ny = 0; }

        let viMath = p.vi ? [...p.vi] : (targetSlope === 0 ? [6, -4] : (targetSlope === 90 ? [5, -3] : [8, -10]));
        let nMath = [nx, -ny];
        let dotVN = viMath[0] * nMath[0] + viMath[1] * nMath[1];
        if (dotVN > 0) { nMath = [-nMath[0], -nMath[1]]; nx = -nx; ny = -ny; dotVN = -dotVN; }
        const proj = [-dotVN * nMath[0], -dotVN * nMath[1]];
        const vfMath = [viMath[0] + 2 * proj[0], viMath[1] + 2 * proj[1]];

        // Wall
        ctx.save();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(cx - tx * 155, cy - ty * 155); ctx.lineTo(cx + tx * 155, cy + ty * 155); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(56,189,248,0.24)'; ctx.lineWidth = 1.5;
        for (let k = -135; k <= 135; k += 18) {
          const hx = cx + tx * k, hy = cy + ty * k;
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - nx * 14, hy - ny * 14); ctx.stroke();
        }
        ctx.restore();

        const mag = Math.hypot(viMath[0], viMath[1]) || 1;
        const sc = 96 / mag;
        const viC = [viMath[0] * sc, -viMath[1] * sc];
        const vfC = [vfMath[0] * sc, -vfMath[1] * sc];
        const pC  = [proj[0] * sc, -proj[1] * sc];

        drawArrow(ctx, cx, cy, cx + nx * 74, cy + ny * 74, '#a78bfa', 2.4);
        ctx.fillStyle = '#c4b5fd'; ctx.font = 'bold 12px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
        ctx.fillText("N'", cx + nx * 82 - 6, cy + ny * 82 + 4);

        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(251,191,36,0.38)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - viC[0] * 1.25, cy - viC[1] * 1.25); ctx.lineTo(cx, cy); ctx.stroke();
        ctx.strokeStyle = 'rgba(52,211,153,0.38)';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + vfC[0] * 1.25, cy + vfC[1] * 1.25); ctx.stroke();
        ctx.setLineDash([]);

        drawArrow(ctx, cx - viC[0], cy - viC[1], cx, cy, '#fbbf24', 2.8);

        // Non-linear approach (easeInQuad accelerating slightly into wall) + easeOutQuint rebound!
        const cycle = (t * 0.62) % 2.1;
        let bx, by, squash = 1, bounceAng = Math.atan2(viC[1], viC[0]);
        if (cycle < 1) {
          const e = cycle * cycle * 0.35 + cycle * 0.65;
          bx = cx - viC[0] * 1.25 * (1 - e);
          by = cy - viC[1] * 1.25 * (1 - e);
          if (cycle < 0.04) ballTrail = [];
        } else {
          const u = clamp01((cycle - 1) / 1.1);
          const eu = Ease.outQuint(u);
          bx = cx + vfC[0] * 1.28 * eu;
          by = cy + vfC[1] * 1.28 * eu;
          bounceAng = Math.atan2(vfC[1], vfC[0]);
          // Smoothly reveal reflected vector & 2P projection with outBack
          const vReveal = Ease.outExpo(Math.min(1, u * 2.4));
          drawArrow(ctx, cx, cy, cx + vfC[0] * vReveal, cy + vfC[1] * vReveal, '#34d399', 3.0);
          ctx.setLineDash([3, 3]);
          drawArrow(ctx, cx + viC[0] * 0.68, cy + viC[1] * 0.68, cx + viC[0] * 0.68 + 2 * pC[0] * 0.68 * vReveal, cy + viC[1] * 0.68 + 2 * pC[1] * 0.68 * vReveal, '#f472b6', 2);
          ctx.setLineDash([]);

          // Dual expanding non-linear shockwave rings on impact!
          if (u < 0.55) {
            const r1 = Ease.outExpo(u / 0.55);
            const r2 = Ease.outQuint(clamp01((u - 0.06) / 0.49));
            ctx.strokeStyle = `rgba(253,224,71,${(1 - r1) * 0.9})`; ctx.lineWidth = 3 * (1 - r1) + 0.6;
            ctx.beginPath(); ctx.arc(cx, cy, 8 + r1 * 68, 0, Math.PI * 2); ctx.stroke();
            if (r2 > 0) {
              ctx.strokeStyle = `rgba(52,211,153,${(1 - r2) * 0.7})`; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(cx, cy, 6 + r2 * 46, 0, Math.PI * 2); ctx.stroke();
            }
          }
          // Elastic squash-stretch right after bounce
          squash = 1 + Math.sin(u * Math.PI * 5) * 0.3 * Math.exp(-u * 6);
        }

        ballTrail.push([bx, by]);
        if (ballTrail.length > 26) ballTrail.shift();
        drawTaperedTrail(ctx, ballTrail, cycle < 1 ? '251, 191, 36' : '52, 211, 153', 7);

        ctx.save(); ctx.translate(bx, by); ctx.rotate(bounceAng); ctx.scale(squash, 2 - squash);
        ctx.fillStyle = cycle < 1 ? '#fbbf24' : '#34d399';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(0, 0, 10.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();

        drawBadge(ctx, 12, 12, `入射 vi=[${viMath[0]}, ${viMath[1]}]  →  反射 vf=[${vfMath[0].toFixed(2)}, ${vfMath[1].toFixed(2)}]`, 'rgba(12,22,44,0.9)', '#fef08a');
        if (performance.now() - lastSideTime > 150) {
          lastSideTime = performance.now();
          updateSide([
            ['入射速度 vi', `[${viMath[0]}, ${viMath[1]}]`],
            ['单位法线 N\'', `[${nMath[0].toFixed(2)}, ${nMath[1].toFixed(2)}]`],
            ['投影 P=(-vi·N\')N\'', `[${proj[0].toFixed(2)}, ${proj[1].toFixed(2)}]`],
            ['反射速度 vf=vi+2P', `[${vfMath[0].toFixed(2)}, ${vfMath[1].toFixed(2)}]`],
            ['规律口诀', Math.round(targetSlope) === 0 ? '水平撞墙：y反向' : (Math.round(targetSlope) === 90 ? '垂直撞墙：x反向' : '任意斜面：vf = vi + 2P')]
          ], '碰撞反射：轴平行反转垂直分量；非轴平行求单位法向量 N\' 后用 vf = vi + 2(-vi·N\')N\'！');
        }
      } else if (mode === 'friction') {
        const simT = t % 6.2;
        const a = 40, mu = 0.7;
        const vNoFric = a * simT;
        const vFric = (a / mu) * (1 - Math.exp(-mu * simT));
        const xNoFric = Math.min(w - 60, 60 + 0.5 * a * simT * simT * 0.7);
        const xFric = Math.min(w - 60, 60 + ((a / mu) * simT - (a / (mu * mu)) * (1 - Math.exp(-mu * simT))) * 1.4);

        ctx.fillStyle = 'rgba(255,255,255,0.045)';
        ctx.beginPath(); ctx.roundRect(32, 34, w - 64, 44, 10); ctx.fill();
        ctx.beginPath(); ctx.roundRect(32, 90, w - 64, 44, 10); ctx.fill();
        ctx.fillStyle = '#fb7185'; ctx.font = 'bold 11.5px "Microsoft YaHei UI", sans-serif';
        ctx.fillText('无摩擦力 (无限二次方加速)', 42, 50);
        ctx.fillStyle = '#34d399';
        ctx.fillText('有摩擦力 v=v*(1-μdt)+a*dt (非线性指数收敛至稳定极速)', 42, 106);

        drawWhaleAgent(ctx, xNoFric, 64, 0, 11, '#fb7185', t * 14);
        drawWhaleAgent(ctx, xFric, 120, 0, 11, '#34d399', t * 10);

        const gx = 55, gy = h - 30, gw = w - 95, gh = h - 182;
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(gx, gy - gh); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = '11px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
        ctx.fillText('速度 v', gx - 42, gy - gh + 8); ctx.fillText('时间 t', gx + gw - 28, gy + 16);

        const drawCurve = (col, fn) => {
          ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.shadowColor = col; ctx.shadowBlur = 8;
          ctx.beginPath();
          for (let k = 0; k <= 44; k++) {
            const tt = (simT * k) / 44;
            const px = gx + (tt / 6.2) * gw;
            const py = gy - Math.min(gh, (fn(tt) / 180) * gh);
            k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.stroke(); ctx.shadowBlur = 0;
        };
        drawCurve('#fb7185', tt => a * tt);
        drawCurve('#34d399', tt => (a / mu) * (1 - Math.exp(-mu * tt)));

        const vMaxY = gy - ((a / mu) / 180) * gh;
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(52,211,153,0.45)';
        ctx.beginPath(); ctx.moveTo(gx, vMaxY); ctx.lineTo(gx + gw, vMaxY); ctx.stroke();
        ctx.setLineDash([]);

        if (performance.now() - lastSideTime > 120) {
          lastSideTime = performance.now();
          updateSide([
            ['时间 t', simT.toFixed(2) + ' s'],
            ['无摩擦速度', vNoFric.toFixed(1) + ' (无限增大)'],
            ['有摩擦速度', vFric.toFixed(1) + ' (平衡上限 ' + (a / mu).toFixed(1) + ')'],
            ['动静摩擦系数', 'μk < μs'],
            ['Unity帧更新', 'Time.deltaTime']
          ], '加入阻力因子后：v = v*(1 - friction*dt) + a*dt，呈经典非线性指数曲线平滑收敛！');
        }
      } else if (mode === 'dot') {
        if (playing && !manualDot) {
          // Smooth harmonic sine swing 10° <-> 170° instead of abrupt modulo jump!
          dotAngleDeg = 90 - 80 * Math.cos(t * 0.85);
        }
        const cx = w * 0.44, cy = h * 0.62;
        const len1 = 108, len2 = 148;
        const rad = dotAngleDeg * Math.PI / 180;
        const v2x = Math.cos(rad) * len2, v2y = -Math.sin(rad) * len2;
        const projLen = len2 * Math.cos(rad);
        const dotVal = (len2 / 100) * Math.cos(rad);

        ctx.fillStyle = 'rgba(251,191,36,0.12)';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 42, -rad, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(251,191,36,0.7)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, 42, -rad, 0); ctx.stroke();
        ctx.fillStyle = '#fde047'; ctx.font = 'bold 12px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
        ctx.fillText(`θ=${Math.round(dotAngleDeg)}°`, cx + 46, cy - 14);

        ctx.setLineDash([4, 4]); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx + v2x, cy + v2y); ctx.lineTo(cx + projLen, cy); ctx.stroke();
        ctx.setLineDash([]);

        const pColor = dotVal > 0.05 ? '#34d399' : (dotVal < -0.05 ? '#fb7185' : '#fbbf24');
        ctx.strokeStyle = pColor; ctx.shadowColor = pColor; ctx.shadowBlur = 12;
        ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + projLen, cy); ctx.stroke();
        ctx.shadowBlur = 0;

        drawArrow(ctx, cx, cy, cx + len1, cy, '#38bdf8', 3);
        drawArrow(ctx, cx, cy, cx + v2x, cy + v2y, '#f472b6', 3);
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 13px "Microsoft YaHei UI", sans-serif';
        ctx.fillText('v₁ (单位向量 |v₁|=1)', cx + len1 + 6, cy + 5);
        ctx.fillStyle = '#f472b6'; ctx.fillText('v₂', cx + v2x + 8, cy + v2y);

        const relation = Math.abs(dotAngleDeg - 90) < 3 ? 'v₁ ⊥ v₂ (垂直, 点积=0)' : (dotAngleDeg < 90 ? 'θ < 90° 同向, v₁·v₂ > 0' : 'θ > 90° 反向, v₁·v₂ < 0');
        drawBadge(ctx, 14, 14, `v₁ · v₂ = |v₂|cosθ = ${dotVal.toFixed(2)}  →  ${relation}`, 'rgba(12,22,44,0.9)', pColor);
        if (performance.now() - lastSideTime > 120) {
          lastSideTime = performance.now();
          updateSide([
            ['夹角 θ', Math.round(dotAngleDeg) + '°'],
            ['点积 v₁·v₂', dotVal.toFixed(2)],
            ['几何意义', 'v₂ 在单位向量 v₁ 上的投影'],
            ['方向判定', relation]
          ], '核心考点：当 v₁ 为单位向量时，v₁·v₂ 表示 v₂ 在 v₁ 上的投影长度！');
        }
      } else if (mode === 'work') {
        const sTotal = 5, F = 1100, f = 50, deg = 60;
        const Fx = F * Math.cos(deg * Math.PI / 180);
        const Fnet = Fx - f;
        const rawU = clamp01(((t * 0.34) % 1.35) / 1.0);
        const u = Ease.inOutCubic(rawU); // smooth nonlinear start & gentle stop!
        const curS = u * sTotal;
        const groundY = h - 55, startX = 95, endX = w - 110;
        const cx = startX + (endX - startX) * u;

        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(30, groundY); ctx.lineTo(w - 30, groundY); ctx.stroke();

        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(startX, groundY + 18); ctx.lineTo(cx, groundY + 18); ctx.stroke();
        ctx.fillStyle = '#fde047'; ctx.font = 'bold 12px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
        ctx.fillText(`位移 s = ${curS.toFixed(1)}m / 5m`, (startX + cx) / 2 - 42, groundY + 34);

        // Cart with smoothly rotating wheels
        ctx.fillStyle = '#2563eb'; ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(cx - 32, groundY - 46, 64, 34, 8); ctx.fill(); ctx.stroke();
        [cx - 18, cx + 18].forEach(wx => {
          ctx.save(); ctx.translate(wx, groundY - 8); ctx.rotate(u * Math.PI * 5);
          ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.stroke();
          ctx.restore();
        });

        drawArrow(ctx, cx, groundY - 30, cx + 65, groundY - 30 - 112, '#f472b6', 3);
        drawArrow(ctx, cx, groundY - 30, cx + 65, groundY - 30, '#34d399', 2.8);
        drawArrow(ctx, cx - 32, groundY - 14, cx - 72, groundY - 14, '#fb7185', 2.6);
        ctx.fillStyle = '#f472b6'; ctx.font = 'bold 11.5px "Microsoft YaHei UI", sans-serif'; ctx.fillText('推力 F=1100N (60°)', cx + 68, groundY - 135);
        ctx.fillStyle = '#34d399'; ctx.fillText('水平分力 Fx=550N', cx + 70, groundY - 26);
        ctx.fillStyle = '#fb7185'; ctx.fillText('阻力 f=50N', cx - 102, groundY - 22);

        drawBadge(ctx, 14, 14, `F合 = 1100×cos60° - 50 = 500N  |  W = 500 × ${curS.toFixed(1)} = ${Math.round(Fnet * curS)} J`, 'rgba(12,22,44,0.9)', '#fef08a');
        if (performance.now() - lastSideTime > 120) {
          lastSideTime = performance.now();
          updateSide([
            ['斜推力 F', '1100 N (60°)'],
            ['水平分力 Fx', '1100 × 0.5 = 550 N'],
            ['地面摩擦力 f', '50 N (反方向)'],
            ['水平合外力', '550 - 50 = 500 N'],
            ['总功 W=F合·s', Math.round(Fnet * curS) + ' / 2500 J']
          ], '功的计算口诀：先将力沿位移方向正交分解 (cos60°=0.5)，扣除阻力后再乘位移！');
        }
      }
    }

    return {
      render,
      setMode(m) { mode = m; t = 0; manualDot = false; ballTrail = []; lastSideTime = 0; },
      togglePlay() { playing = !playing; return playing; },
      reset() { t = 0; manualDot = false; ballTrail = []; },
      step() { playing = false; t += 0.25; },
      setSpeed(s) { speed = s; }
    };
  }

  /* ========================================================================
     2. STEERING & INTERCEPTION ENGINE (Damped heading, tapered comet trails, shockwaves)
     ======================================================================== */
  function createSteeringAnim(container, opts = {}) {
    let mode = opts.mode || 'intercept';
    let playing = true, speed = 1;
    const canvas = container.querySelector('canvas');
    const side = container.querySelector('.anim-side-panel');
    const narrator = container.querySelector('.anim-narrator');

    let st = {};
    function resetState(w = 620, h = 360) {
      st = {
        w, h, wag: 0, hitAnim: 0,
        prey: { x: 85, y: h * 0.72, vx: 68, vy: -34, trail: [] },
        inter: { x: w * 0.76, y: h * 0.65, vx: 0, vy: 0, ang: Math.PI, maxV: 98, trail: [], hit: false },
        loser: { x: w * 0.76, y: h * 0.65, vx: 0, vy: 0, maxV: 98, trail: [] },
        basic: { x: w * 0.76, y: h * 0.65, trail: [] },
        target: { x: w * 0.75, y: h * 0.35, pop: 1 },
        agent: { x: w * 0.22, y: h * 0.68, vx: 90, vy: 20, ang: 0, trail: [] },
        timer: 0
      };
    }
    resetState();

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      st.target.x = e.clientX - rect.left;
      st.target.y = e.clientY - rect.top;
      st.target.pop = 0;
    });

    let lastSide = 0;
    function updateSide(rows, tip) {
      if (narrator && tip) narrator.textContent = tip;
      if (!side) return;
      side.innerHTML = `<h4>操控与拦截实时数据</h4><div class="hud-box">${rows.map(r => `<div class="hud-row"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div>` +
        `<div class="hud-box" style="font-size:11.5px;color:#93c5fd">提示：在 Seek/Arrive/Flee 模式下，<strong>点击画布任意位置</strong>可实时移动目标点！</div>`;
    }

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      if (Math.abs(w - st.w) > 40) resetState(w, h);
      drawGridBg(ctx, w, h);
      const stepDt = playing ? Math.min(dt, 0.05) * speed : 0;
      st.wag += stepDt * 12;

      if (mode === 'intercept') {
        st.timer += stepDt;
        const pr = st.prey, ic = st.inter, ls = st.loser, bs = st.basic;

        const vrx = pr.vx - ic.vx, vry = pr.vy - ic.vy;
        const srx = pr.x - ic.x, sry = pr.y - ic.y;
        const srMag = Math.hypot(srx, sry);
        const vrMag = Math.max(12, Math.hypot(vrx, vry));
        const tc = Math.min(4.2, srMag / vrMag);
        const stX = pr.x + pr.vx * tc;
        const stY = pr.y + pr.vy * tc;

        if (stepDt > 0 && !ic.hit) {
          pr.x += pr.vx * stepDt; pr.y += pr.vy * stepDt;
          pr.trail.push([pr.x, pr.y]);

          const dx = stX - ic.x, dy = stY - ic.y;
          const d = Math.hypot(dx, dy) || 1;
          // Smooth exponential velocity damping for silky curved launch!
          ic.vx = Ease.expDamp(ic.vx, (dx / d) * ic.maxV, 8, stepDt);
          ic.vy = Ease.expDamp(ic.vy, (dy / d) * ic.maxV, 8, stepDt);
          ic.ang = Ease.dampAngle(ic.ang, Math.atan2(ic.vy, ic.vx), 12, stepDt);
          ic.x += ic.vx * stepDt; ic.y += ic.vy * stepDt;
          ic.trail.push([ic.x, ic.y]);

          const ldx = pr.x - ls.x, ldy = pr.y - ls.y;
          const ld = Math.hypot(ldx, ldy) || 1;
          ls.vx = Ease.expDamp(ls.vx, (ldx / ld) * ls.maxV, 8, stepDt);
          ls.vy = Ease.expDamp(ls.vy, (ldy / ld) * ls.maxV, 8, stepDt);
          ls.x += ls.vx * stepDt; ls.y += ls.vy * stepDt;
          ls.trail.push([ls.x, ls.y]);

          const bStep = 65 * stepDt;
          if (Math.abs(pr.x - bs.x) > 3) bs.x += Math.sign(pr.x - bs.x) * bStep;
          if (Math.abs(pr.y - bs.y) > 3) bs.y += Math.sign(pr.y - bs.y) * bStep;
          bs.trail.push([bs.x, bs.y]);

          if (Math.hypot(pr.x - ic.x, pr.y - ic.y) < 16 || pr.x > w - 25 || pr.y < 25) {
            ic.hit = true; st.timer = 0; st.hitAnim = 0;
          }
        } else if (ic.hit && stepDt > 0) {
          st.hitAnim = Math.min(1, st.hitAnim + stepDt * 1.1);
          if (st.timer > 1.8) resetState(w, h);
        }

        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(251,191,36,0.42)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(pr.x, pr.y); ctx.lineTo(stX, stY); ctx.stroke();
        ctx.strokeStyle = 'rgba(56,189,248,0.42)';
        ctx.beginPath(); ctx.moveTo(ic.x, ic.y); ctx.lineTo(stX, stY); ctx.stroke();
        ctx.setLineDash([]);

        // Breathing St crosshair
        const pulseR = 10 + Math.sin(performance.now() / 190) * 2.5;
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(stX, stY, pulseR, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(stX - 15, stY); ctx.lineTo(stX + 15, stY); ctx.moveTo(stX, stY - 15); ctx.lineTo(stX, stY + 15); ctx.stroke();
        ctx.fillStyle = '#fde047'; ctx.font = 'bold 11.5px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
        ctx.fillText('预测拦截点 St', stX + 14, stY - 6);

        drawTaperedTrail(ctx, bs.trail, '148, 163, 184', 2.4);
        drawTaperedTrail(ctx, ls.trail, '192, 132, 252', 3.4);
        drawTaperedTrail(ctx, pr.trail, '251, 146, 60', 4.0);
        drawTaperedTrail(ctx, ic.trail, '56, 189, 248', 5.0);

        drawWhaleAgent(ctx, ic.x, ic.y, ic.ang, 13, '#38bdf8', st.wag);
        ctx.fillStyle = '#c084fc'; ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(ls.x, ls.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(bs.x - 5, bs.y - 5, 10, 10);
        ctx.fillStyle = '#fb923c'; ctx.shadowColor = '#fb923c'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(pr.x, pr.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

        if (ic.hit) {
          const e = Ease.outExpo(st.hitAnim);
          ctx.strokeStyle = `rgba(52, 211, 153, ${1 - e * 0.8})`; ctx.lineWidth = 3.5 * (1 - e) + 1;
          ctx.beginPath(); ctx.arc(ic.x, ic.y, 12 + e * 54, 0, Math.PI * 2); ctx.stroke();
          drawBadge(ctx, ic.x - 48, ic.y - 38, '精准截击成功!', '#059669', '#fff');
        }

        drawBadge(ctx, 12, 12, '蓝鲸=拦截(提前预判St) | 紫点=视线追逐(弧线尾随) | 灰方=基本追逐(阶梯)', 'rgba(12,22,44,0.9)', '#bae6fd');
        if (performance.now() - lastSide > 120) {
          lastSide = performance.now();
          updateSide([
            ['相对距离 |Sr|', srMag.toFixed(1) + ' px'],
            ['相对速度 |Vr|', vrMag.toFixed(1) + ' px/s'],
            ['预计拦截时间 tc', tc.toFixed(2) + ' s'],
            ['拦截点 St', `(${Math.round(stX)}, ${Math.round(stY)})`],
            ['核心公式', 'St = Sprey + Vprey * tc']
          ], '对比一目了然：拦截算法主动计算未来相遇点 St，比尾随视线追逐更早精准命中！');
        }
      } else {
        const ag = st.agent, tg = st.target;
        tg.pop = Math.min(1, tg.pop + dt * 3.2);
        const maxSpeed = 135, slowRadius = 110;
        let dx = mode === 'flee' ? (ag.x - tg.x) : (tg.x - ag.x);
        let dy = mode === 'flee' ? (ag.y - tg.y) : (tg.y - ag.y);
        const dist = Math.hypot(dx, dy) || 1;
        let desiredSpeed = maxSpeed;
        if (mode === 'arrive' && dist < slowRadius) desiredSpeed = maxSpeed * Ease.inOutCubic(dist / slowRadius);
        const desVx = (dx / dist) * desiredSpeed;
        const desVy = (dy / dist) * desiredSpeed;

        if (stepDt > 0) {
          // Smooth exponential steering spring
          ag.vx = Ease.expDamp(ag.vx, desVx, 4.2, stepDt);
          ag.vy = Ease.expDamp(ag.vy, desVy, 4.2, stepDt);
          ag.ang = Ease.dampAngle(ag.ang, Math.atan2(ag.vy, ag.vx), 11, stepDt);
          ag.x += ag.vx * stepDt; ag.y += ag.vy * stepDt;
          if (mode === 'flee') {
            if (ag.x < 35 || ag.x > w - 35 || ag.y < 35 || ag.y > h - 35) {
              ag.x = tg.x + (Math.random() - 0.5) * 90;
              ag.y = tg.y + (Math.random() - 0.5) * 90;
              ag.trail = [];
            }
          } else if (dist < 14 && mode === 'seek') {
            tg.x = 75 + Math.random() * (w - 150); tg.y = 65 + Math.random() * (h - 130); tg.pop = 0;
          } else if (dist < 6 && mode === 'arrive') {
            st.timer += stepDt;
            if (st.timer > 1.1) { st.timer = 0; tg.x = 80 + Math.random() * (w - 160); tg.y = 70 + Math.random() * (h - 140); tg.pop = 0; }
          }
          ag.trail.push([ag.x, ag.y]);
          if (ag.trail.length > 75) ag.trail.shift();
        }

        if (mode === 'arrive') {
          ctx.fillStyle = 'rgba(56,189,248,0.09)';
          ctx.strokeStyle = 'rgba(56,189,248,0.5)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(tg.x, tg.y, slowRadius * Ease.outBack(tg.pop), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#7dd3fc'; ctx.font = '11px "Microsoft YaHei UI", sans-serif';
          ctx.fillText('减速半径 Slowing Radius', tg.x - 58, tg.y - slowRadius - 6);
        }

        drawTaperedTrail(ctx, ag.trail, '56, 189, 248', 5);

        const tgScale = Ease.outBack(tg.pop);
        ctx.fillStyle = mode === 'flee' ? '#f43f5e' : '#fbbf24';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(tg.x, tg.y, 10 * tgScale, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "Microsoft YaHei UI", sans-serif';
        ctx.fillText(mode === 'flee' ? '威胁源' : '目标点', tg.x + 14, tg.y + 4);

        const vScale = 0.52;
        drawArrow(ctx, ag.x, ag.y, ag.x + desVx * vScale, ag.y + desVy * vScale, '#34d399', 2.4);
        drawArrow(ctx, ag.x, ag.y, ag.x + ag.vx * vScale, ag.y + ag.vy * vScale, '#38bdf8', 2.4);
        drawArrow(ctx, ag.x + ag.vx * vScale, ag.y + ag.vy * vScale, ag.x + desVx * vScale, ag.y + desVy * vScale, '#f472b6', 2.4);

        drawWhaleAgent(ctx, ag.x, ag.y, ag.ang, 14, '#38bdf8', st.wag);
        drawBadge(ctx, 12, 12, '绿=期望速度 Desired | 蓝=当前速度 Current | 粉=操控力 (Desired - Current)', 'rgba(12,22,44,0.9)', '#bae6fd');

        if (performance.now() - lastSide > 120) {
          lastSide = performance.now();
          const curSpd = Math.hypot(ag.vx, ag.vy);
          updateSide([
            ['当前模式', mode === 'seek' ? 'Seek (靠近)' : (mode === 'arrive' ? 'Arrive (抵达减速)' : 'Flee (闪躲远离)')],
            ['方向向量', mode === 'flee' ? '当前位置 - 目标位置' : '目标位置 - 当前位置'],
            ['距目标距离', dist.toFixed(1) + ' px'],
            ['当前速度大小', curSpd.toFixed(1) + ' / ' + maxSpeed],
            ['操控力公式', 'Desired - Current']
          ], mode === 'flee' ? 'Flee 闪躲易错点：方向向量是【当前位置 - 目标位置】，从目标指向智能体！' :
             (mode === 'arrive' ? 'Arrive 抵达：进入减速半径后平滑非线性减速至 0，丝滑精准停靠！' : 'Seek 靠近：操控力 = 期望速度 - 当前速度，每帧平滑转向目标！'));
        }
      }
    }

    return {
      render,
      setMode(m) { mode = m; resetState(st.w, st.h); },
      togglePlay() { playing = !playing; return playing; },
      reset() { resetState(st.w, st.h); },
      step() { playing = false; render(0.08); },
      setSpeed(s) { speed = s; }
    };
  }

  /* ========================================================================
     3. PATTERN MOVEMENT ENGINE (Smooth Eased Corner Turning + Velocity Shaping)
     ======================================================================== */
  function createPatternAnim(container, opts = {}) {
    let mode = opts.mode || 'rect';
    let playing = true, speed = 1;
    const canvas = container.querySelector('canvas');
    const side = container.querySelector('.anim-side-panel');
    const narrator = container.querySelector('.anim-narrator');

    function buildCommands(m) {
      if (m === 'rect') return [
        { lbl: 'ControlData(180, 0, 0, 0) 前进180', fwd: 180, turn: 0 },
        { lbl: 'ControlData(0, 0, 90, 0) 左转90°', fwd: 0, turn: 90 },
        { lbl: 'ControlData(120, 0, 0, 0) 前进120', fwd: 120, turn: 0 },
        { lbl: 'ControlData(0, 0, 90, 0) 左转90°', fwd: 0, turn: 90 },
        { lbl: 'ControlData(180, 0, 0, 0) 前进180', fwd: 180, turn: 0 },
        { lbl: 'ControlData(0, 0, 90, 0) 左转90°', fwd: 0, turn: 90 },
        { lbl: 'ControlData(120, 0, 0, 0) 前进120', fwd: 120, turn: 0 },
        { lbl: 'ControlData(0, 0, 90, 0) 左转90°', fwd: 0, turn: 90 }
      ];
      if (m === 'hex') return Array.from({ length: 6 }, (_, i) => ([
        { lbl: `边${i+1}: 前进 95`, fwd: 95, turn: 0 },
        { lbl: `角${i+1}: 左转 60°`, fwd: 0, turn: 60 }
      ])).flat();
      if (m === 'star') return Array.from({ length: 5 }, (_, i) => ([
        { lbl: `星臂${i+1}: 前进 175`, fwd: 175, turn: 0 },
        { lbl: `星角${i+1}: 右转 144°`, fwd: 0, turn: -144 }
      ])).flat();
      if (m === 'zigzag') return [
        { lbl: 'FORWARD 110 (模式指令)', fwd: 110, turn: 0 },
        { lbl: 'TURNRIGHT 35°', fwd: 0, turn: -35 },
        { lbl: 'FORWARD 95', fwd: 95, turn: 0 },
        { lbl: 'TURNLEFT 70°', fwd: 0, turn: 70 },
        { lbl: 'FORWARD 110', fwd: 110, turn: 0 },
        { lbl: 'TURNLEFT 145° (折返)', fwd: 0, turn: 145 }
      ];
      return Array.from({ length: 6 }, (_, i) => {
        const d = Math.round(70 + Math.random() * 85);
        const a = Math.round(45 + Math.random() * 65);
        return { lbl: `Random #${i+1}: 前进${d}, 左转${a}°`, fwd: d, turn: a };
      });
    }

    let cmds = buildCommands(mode);
    let idx = 0, angle = 0, turnStartAng = 0, turnProg = 1, moveProg = 0;
    let segStartX = 220, segStartY = 230, x = 220, y = 230, trail = [], wag = 0, lastSide = 0;

    function reset(w = 620, h = 360) {
      cmds = buildCommands(mode);
      idx = 0; angle = 0; turnStartAng = 0; turnProg = 1; moveProg = 0; trail = [];
      if (mode === 'rect') { x = w * 0.32; y = h * 0.68; }
      else if (mode === 'hex') { x = w * 0.40; y = h * 0.78; }
      else if (mode === 'star') { x = w * 0.34; y = h * 0.42; }
      else if (mode === 'zigzag') { x = w * 0.16; y = h * 0.56; }
      else { x = w * 0.48; y = h * 0.56; }
      segStartX = x; segStartY = y;
      trail.push([x, y]);
    }
    reset();

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      drawGridBg(ctx, w, h);
      const cur = cmds[idx];
      let dispAngle = angle;

      if (playing) {
        const sDt = Math.min(dt, 0.05) * speed;
        wag += sDt * 13;
        if (cur.fwd === 0) {
          // Non-linear smooth corner rotation with easeInOutCubic!
          if (turnProg >= 1) { turnStartAng = angle; turnProg = 0; }
          turnProg = Math.min(1, turnProg + sDt * 2.6);
          dispAngle = turnStartAng + cur.turn * Ease.inOutCubic(turnProg);
          if (turnProg >= 1) {
            angle = (turnStartAng + cur.turn + 720) % 360;
            dispAngle = angle;
            idx = (idx + 1) % cmds.length;
            segStartX = x; segStartY = y; moveProg = 0;
          }
        } else {
          // Non-linear easeInOutCubic glide along segment!
          const segDur = Math.max(0.45, cur.fwd / 145);
          moveProg = Math.min(1, moveProg + sDt / segDur);
          const e = Ease.inOutCubic(moveProg);
          const rad = angle * Math.PI / 180;
          x = segStartX + Math.cos(rad) * cur.fwd * e;
          y = segStartY - Math.sin(rad) * cur.fwd * e;
          if (x < 30 || x > w - 30 || y < 35 || y > h - 35) {
            angle = (angle + 140) % 360;
            x = Math.max(35, Math.min(w - 35, x)); y = Math.max(40, Math.min(h - 40, y));
            segStartX = x; segStartY = y; moveProg = 0;
          }
          trail.push([x, y]);
          if (trail.length > 260) trail.shift();
          if (moveProg >= 1) {
            if (cur.turn !== 0) angle = (angle + cur.turn + 720) % 360;
            idx = (idx + 1) % cmds.length;
            segStartX = x; segStartY = y; moveProg = 0; turnProg = 1;
          }
        }
      }

      drawTaperedTrail(ctx, trail, '56, 189, 248', 4.6);

      const rad = dispAngle * Math.PI / 180;
      drawArrow(ctx, x, y, x + Math.cos(rad) * 34, y - Math.sin(rad) * 34, '#fde047', 2.4);
      drawWhaleAgent(ctx, x, y, -rad, 14, '#38bdf8', wag);
      const stepDis = cur.fwd > 0 ? Math.round(cur.fwd * Ease.inOutCubic(moveProg)) : 0;
      drawBadge(ctx, 12, 12, `curIndex=${idx} | monsterAngle=${Math.round((dispAngle + 360) % 360)}° | stepDistance=${stepDis}/${cur.fwd}`, 'rgba(12,22,44,0.9)', '#fef08a');

      if (performance.now() - lastSide > 110) {
        lastSide = performance.now();
        if (narrator) narrator.textContent = mode === 'zigzag' ? '模式指令法：每条指令为【指令类型 + 操作数】，在 switch-case 中分发执行！' : '控制指令法 DoPattern：丝滑非线性加减速前行 + 转角缓动旋转，实时同步右侧指令队列！';
        if (side) {
          side.innerHTML = `<h4>指令队列 patternArray</h4><div class="hud-box">` +
            cmds.map((c, i) => `<div style="padding:4px 7px;border-radius:6px;margin-bottom:3px;font-family:var(--font-mono);font-size:11px;transition:all 0.2s;${i === idx ? 'background:#1d5cff;color:#fff;font-weight:700;transform:translateX(3px)' : 'color:#94a3b8'}">${i === idx ? '' : '  '}[${i}] ${c.lbl}</div>`).join('') +
            `</div><div class="hud-box"><div class="hud-row"><span>角度归一化</span><span>angle % 360</span></div><div class="hud-row"><span>负数修正</span><span>if(&lt;0) += 360</span></div><div class="hud-row"><span>方向向量</span><span>(cos θ, sin θ)</span></div></div>`;
        }
      }
    }

    return {
      render,
      setMode(m) { mode = m; reset(canvas.clientWidth || 620, canvas.clientHeight || 360); },
      togglePlay() { playing = !playing; return playing; },
      reset() { reset(canvas.clientWidth || 620, canvas.clientHeight || 360); },
      step() { playing = false; const cur = cmds[idx]; angle = (angle + cur.turn + 720) % 360; const rad = angle * Math.PI / 180; x += Math.cos(rad) * Math.min(cur.fwd || 0, 50); y -= Math.sin(rad) * Math.min(cur.fwd || 0, 50); segStartX = x; segStartY = y; trail.push([x, y]); idx = (idx + 1) % cmds.length; },
      setSpeed(s) { speed = s; }
    };
  }

  /* ========================================================================
     4. BASIC PATHFINDING ENGINE (Sub-Cell EaseInOutCubic Gliding + Elastic Pop)
     ======================================================================== */
  const DIRS8 = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];
  const DIR_NAMES = ['0:右', '1:右下', '2:下', '3:左下', '4:左', '5:左上', '6:上', '7:右上'];

  function createBasicPathAnim(container, opts = {}) {
    let mode = opts.mode || 'wall';
    let playing = true, speed = 1;
    const p = opts.params || {};
    const canvas = container.querySelector('canvas');
    const side = container.querySelector('.anim-side-panel');
    const narrator = container.querySelector('.anim-narrator');

    const ROWS = 8, COLS = 12;
    let grid = [];
    let agent = { r: 6, c: 1, prevR: 6, prevC: 1, dir: 0, visAng: 0, moveT: 1, state: 'Tracing', needSteps: 0, moved: 0, randDir: 0 };
    let goal = { r: 1, c: 10 };
    let visited = new Map(); // key -> born timestamp for pop animation!
    let trail = [], lastWeights = null, weightPop = 1, scanInfo = '', wag = 0, wallHand = p.hand || 'right';

    function buildMap(m) {
      grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      for (let r = 0; r < ROWS; r++) { grid[r][0] = 1; grid[r][COLS - 1] = 1; }
      for (let c = 0; c < COLS; c++) { grid[0][c] = 1; grid[ROWS - 1][c] = 1; }
      if (m === 'pathfollow') {
        for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) grid[r][c] = 1;
        [[6,1],[6,2],[6,3],[5,3],[4,3],[3,3],[2,3],[2,4],[2,5],[2,6],[3,6],[4,6],[5,6],[5,7],[5,8],[4,8],[3,8],[2,8],[1,8],[1,9],[1,10]].forEach(([r, c]) => grid[r][c] = 0);
        agent = { r: 6, c: 1, prevR: 6, prevC: 1, dir: 0, visAng: 0, moveT: 1, state: 'PathFollow', needSteps: 0, moved: 0, randDir: 0 };
        goal = { r: 1, c: 10 };
      } else if (m === 'wall') {
        [[2,2],[2,3],[2,4],[3,4],[4,4],[5,4],[5,5],[5,6],[3,7],[4,7],[2,7],[2,8],[5,9],[4,9]].forEach(([r, c]) => grid[r][c] = 1);
        agent = { r: 6, c: 2, prevR: 6, prevC: 2, dir: 0, visAng: 0, moveT: 1, state: 'WallTrace', needSteps: 0, moved: 0, randDir: 0 };
        goal = { r: 1, c: 10 };
      } else if (m === 'bypass' || m === 'random') {
        [[2,5],[3,5],[4,5],[5,5],[3,6],[4,6],[2,8],[3,8]].forEach(([r, c]) => grid[r][c] = 1);
        agent = { r: 5, c: 2, prevR: 5, prevC: 2, dir: 0, visAng: 0, moveT: 1, state: 'Tracing', needSteps: 0, moved: 0, randDir: 0 };
        goal = { r: 2, c: 10 };
      } else {
        [[2,4],[3,4],[4,4],[2,7]].forEach(([r, c]) => grid[r][c] = 1);
        agent = { r: 3, c: 2, prevR: 3, prevC: 2, dir: 0, visAng: 0, moveT: 1, state: 'TileMap', needSteps: 0, moved: 0, randDir: 0 };
        goal = { r: 2, c: 9 };
      }
      visited = new Map([[`${agent.r},${agent.c}`, performance.now()]]);
      trail = [[agent.r, agent.c]]; lastWeights = null; weightPop = 1; scanInfo = '准备就绪';
    }
    buildMap(mode);

    function canPass(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c] === 0; }

    function moveTo(nr, nc) {
      agent.prevR = agent.r; agent.prevC = agent.c;
      agent.r = nr; agent.c = nc; agent.moveT = 0;
      trail.push([nr, nc]);
      if (trail.length > 80) trail.shift();
    }

    function stepLogic() {
      if (mode === 'tilemap') return;
      if (agent.r === goal.r && agent.c === goal.c) { buildMap(mode); return; }

      if (mode === 'random') {
        if (agent.state === 'Tracing') {
          const dr = Math.sign(goal.r - agent.r), dc = Math.sign(goal.c - agent.c);
          const nr = agent.r + dr, nc = agent.c + dc;
          if (canPass(nr, nc)) {
            const dIdx = DIRS8.findIndex(([x, y]) => x === dc && y === dr);
            if (dIdx >= 0) agent.dir = dIdx;
            moveTo(nr, nc); scanInfo = `Tracing: 直线追踪至 (${nc}, ${nr})`;
          } else {
            agent.state = 'RandomMoving'; agent.needSteps = 0; agent.moved = 0;
            scanInfo = '碰撞障碍！切换状态 → RandomMoving';
          }
        } else {
          if (agent.needSteps === 0) {
            const cands = [];
            for (let d = 0; d < 8; d++) if (canPass(agent.r + DIRS8[d][1], agent.c + DIRS8[d][0])) cands.push(d);
            agent.randDir = cands.length ? cands[Math.floor(Math.random() * cands.length)] : 0;
            agent.dir = agent.randDir;
            agent.needSteps = 2 + Math.floor(Math.random() * 2); agent.moved = 0;
            scanInfo = `随机旋转至方向 ${DIR_NAMES[agent.randDir]}，设定步数 ${agent.needSteps}`;
          } else {
            const nr = agent.r + DIRS8[agent.randDir][1], nc = agent.c + DIRS8[agent.randDir][0];
            if (canPass(nr, nc)) {
              moveTo(nr, nc); agent.moved++;
              if (agent.moved >= agent.needSteps) {
                agent.state = 'Tracing'; agent.needSteps = 0; agent.moved = 0;
                scanInfo = '走完随机步长 → 恢复 Tracing 追踪目标！';
              } else scanInfo = `RandomMoving 步进 (${agent.moved}/${agent.needSteps})`;
            } else {
              agent.needSteps = 0; scanInfo = '随机行走再遇障 → 步长归0，重新旋转！';
            }
          }
        }
      } else if (mode === 'bypass') {
        const dr = Math.sign(goal.r - agent.r), dc = Math.sign(goal.c - agent.c);
        const nr = agent.r + dr, nc = agent.c + dc;
        if (canPass(nr, nc) && !visited.has(`${nr},${nc}`)) {
          const dIdx = DIRS8.findIndex(([x, y]) => x === dc && y === dr);
          if (dIdx >= 0) agent.dir = dIdx;
          visited.set(`${nr},${nc}`, performance.now()); moveTo(nr, nc);
          scanInfo = `直线无障且未访问 → 前进至 (${nc},${nr})`;
        } else {
          let obsDir = DIRS8.findIndex(([x, y]) => x === dc && y === dr);
          if (obsDir < 0) obsDir = 0;
          let moved = false;
          for (let n = 1; n <= 7; n++) {
            const next = (obsDir + n) % 8;
            const tr = agent.r + DIRS8[next][1], tc = agent.c + DIRS8[next][0];
            if (canPass(tr, tc) && !visited.has(`${tr},${tc}`)) {
              agent.dir = next; visited.set(`${tr},${tc}`, performance.now()); moveTo(tr, tc);
              scanInfo = `遇障 dir=${obsDir}，顺时针 next=(dir+${n})%8=${next} 可通且未访问！`;
              moved = true; break;
            }
          }
          if (!moved) { scanInfo = '死胡同/周围均已访问，重置演示'; buildMap(mode); }
        }
      } else if (mode === 'pathfollow') {
        const w8 = new Array(8).fill(0);
        const cur = agent.dir;
        w8[cur] = 10; w8[(cur + 1) % 8] = 9; w8[(cur + 7) % 8] = 9;
        w8[(cur + 2) % 8] = 8; w8[(cur + 6) % 8] = 8;
        w8[(cur + 3) % 8] = 7; w8[(cur + 5) % 8] = 7; w8[(cur + 4) % 8] = 6;
        for (let i = 0; i < 8; i++) {
          if (!canPass(agent.r + DIRS8[i][1], agent.c + DIRS8[i][0])) w8[i] -= 10;
        }
        let bestDir = 0, bestW = -999;
        for (let i = 0; i < 8; i++) if (w8[i] > bestW) { bestW = w8[i]; bestDir = i; }
        lastWeights = w8; weightPop = 0;
        agent.dir = bestDir;
        moveTo(agent.r + DIRS8[bestDir][1], agent.c + DIRS8[bestDir][0]);
        scanInfo = `最大权重 ${bestW} → 选择方向 ${DIR_NAMES[bestDir]}`;
      } else if (mode === 'wall') {
        let chosen = -1;
        if (wallHand === 'right') {
          for (let i = agent.dir + 2; i > agent.dir - 6; i--) {
            const wd = ((i % 8) + 8) % 8;
            if (canPass(agent.r + DIRS8[wd][1], agent.c + DIRS8[wd][0])) { chosen = wd; break; }
          }
        } else {
          const startDir = (agent.dir - 2 + 8) % 8;
          for (let i = 0; i < 8; i++) {
            const wd = (startDir + i) % 8;
            if (canPass(agent.r + DIRS8[wd][1], agent.c + DIRS8[wd][0])) { chosen = wd; break; }
          }
        }
        if (chosen >= 0) {
          agent.dir = chosen;
          moveTo(agent.r + DIRS8[chosen][1], agent.c + DIRS8[chosen][0]);
          scanInfo = `${wallHand === 'right' ? '右手优先 (dir+2)%8 逆时针' : '左手优先 (dir-2+8)%8 顺时针'} → 选 ${DIR_NAMES[chosen]}`;
        }
      }
    }

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const padX = 22, padY = 44;
      const cellW = (rect.width - padX * 2) / COLS, cellH = (rect.height - padY - 18) / ROWS;
      const c = Math.floor((e.clientX - rect.left - padX) / cellW);
      const r = Math.floor((e.clientY - rect.top - padY) / cellH);
      if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1 && !(r === agent.r && c === agent.c) && !(r === goal.r && c === goal.c)) {
        if (mode === 'tilemap') { moveTo(r, c); }
        else { grid[r][c] = grid[r][c] ? 0 : 1; }
      }
    });

    let lastSide = 0;
    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      drawGridBg(ctx, w, h);
      const now = performance.now();
      wag += dt * speed * 12;
      weightPop = Math.min(1, weightPop + dt * 4.2);

      // Continuous sub-cell non-linear glide!
      if (agent.moveT < 1) {
        agent.moveT = Math.min(1, agent.moveT + dt * speed * 2.55);
      } else if (playing && mode !== 'tilemap') {
        stepLogic();
      }

      const targetAng = Math.atan2(DIRS8[agent.dir][1], DIRS8[agent.dir][0]);
      agent.visAng = Ease.dampAngle(agent.visAng, targetAng, 14, dt);

      const padX = 22, padY = 44;
      const cellW = (w - padX * 2) / COLS, cellH = (h - padY - 18) / ROWS;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = padX + c * cellW, y = padY + r * cellH;
          const isObs = grid[r][c] === 1;
          const visBorn = visited.get(`${r},${c}`);
          ctx.fillStyle = isObs ? '#1d4ed8' : (visBorn && mode === 'bypass' ? 'rgba(56,189,248,0.18)' : 'rgba(26,38,62,0.78)');
          ctx.beginPath(); ctx.roundRect(x + 1.5, y + 1.5, cellW - 3, cellH - 3, 4); ctx.fill();
          ctx.strokeStyle = isObs ? '#60a5fa' : 'rgba(148,163,184,0.14)';
          ctx.lineWidth = 1; ctx.stroke();
          if (mode === 'tilemap') {
            ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
            ctx.fillText(`${r},${c}`, x + 4, y + 13);
          }
          if (visBorn && mode === 'bypass' && !isObs) {
            const pScale = Ease.outBack(clamp01((now - visBorn) / 340));
            ctx.save(); ctx.translate(x + cellW - 10, y + 11); ctx.scale(pScale, pScale);
            ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 11px "Microsoft YaHei UI", sans-serif'; ctx.fillText('', -4, 4); ctx.restore();
          }
        }
      }

      // Smoothly interpolated current agent pixel pos!
      const me = Ease.inOutCubic(agent.moveT);
      const curR = agent.prevR + (agent.r - agent.prevR) * me;
      const curC = agent.prevC + (agent.c - agent.prevC) * me;
      const ax = padX + (curC + 0.5) * cellW, ay = padY + (curR + 0.5) * cellH;

      // Glowing trail ending smoothly at current interpolated position
      if (trail.length > 1) {
        const tPts = trail.slice(0, -1).map(([r, c]) => [padX + (c + 0.5) * cellW, padY + (r + 0.5) * cellH]);
        tPts.push([ax, ay]);
        drawTaperedTrail(ctx, tPts, '56, 189, 248', 4.5);
      }

      // Elastic pop-in 8-neighbor weights for PathFollowing
      if (mode === 'pathfollow' && lastWeights) {
        const ws = Ease.outBack(weightPop);
        for (let i = 0; i < 8; i++) {
          const tr = agent.prevR + DIRS8[i][1], tc = agent.prevC + DIRS8[i][0];
          if (tr >= 0 && tr < ROWS && tc >= 0 && tc < COLS) {
            const px = padX + (tc + 0.5) * cellW, py = padY + (tr + 0.5) * cellH;
            ctx.save(); ctx.translate(px, py); ctx.scale(ws, ws);
            ctx.fillStyle = lastWeights[i] > 0 ? '#fde047' : '#fb7185';
            ctx.font = 'bold 11.5px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(String(lastWeights[i]), 0, 4); ctx.restore();
          }
        }
      }

      if (mode === 'wall') {
        const startD = wallHand === 'right' ? (agent.dir + 2) % 8 : (agent.dir - 2 + 8) % 8;
        drawArrow(ctx, ax, ay, ax + DIRS8[startD][0] * cellW * 0.85, ay + DIRS8[startD][1] * cellH * 0.85, '#fde047', 2.4);
      }

      if (mode !== 'tilemap') {
        const gx = padX + (goal.c + 0.5) * cellW, gy = padY + (goal.r + 0.5) * cellH;
        const gr = 10 + Math.sin(now / 260) * 1.6;
        ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "Microsoft YaHei UI", sans-serif'; ctx.fillText('P', gx - 4, gy + 4);
      } else {
        // Elastic selection reticle on active tile
        const rx = padX + curC * cellW, ry = padY + curR * cellH;
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(rx + 2, ry + 2, cellW - 4, cellH - 4, 6); ctx.stroke();
      }

      drawWhaleAgent(ctx, ax, ay, agent.visAng, 11.5, '#38bdf8', wag);

      if (mode === 'tilemap') {
        const pxCenter = agent.c * 64 + 32, pyCenter = agent.r * 64 + 32;
        drawBadge(ctx, 14, 10, `Tile[${agent.r}行, ${agent.c}列] ↔ 像素中心 (${pxCenter}, ${pyCenter})  [col*64+32, row*64+32]`, 'rgba(12,22,44,0.92)', '#fef08a');
      } else {
        drawBadge(ctx, 14, 10, scanInfo, 'rgba(12,22,44,0.92)', '#bae6fd');
      }

      if (now - lastSide > 160) {
        lastSide = now;
        if (narrator) narrator.textContent = mode === 'tilemap' ? '点击任意瓦片，蓝色鲸鱼丝滑滑行并实时换算 64×64 像素中心坐标！' : '可点击网格自定义障碍物！观察非线性丝滑跨格移动与 8 连通域编号 0~7。';
        if (side) {
          side.innerHTML = `<h4>八连通域与状态 HUD</h4>
            <div class="hud-box">
              <div class="hud-row"><span>当前格 (行,列)</span><span>(${agent.r}, ${agent.c})</span></div>
              <div class="hud-row"><span>当前朝向 dir</span><span>${DIR_NAMES[agent.dir]}</span></div>
              <div class="hud-row"><span>左手方向公式</span><span>(dir-2+8)%8 = ${(agent.dir+6)%8}</span></div>
              <div class="hud-row"><span>右手方向公式</span><span>(dir+2)%8 = ${(agent.dir+2)%8}</span></div>
            </div>
            ${mode === 'wall' ? `<div class="hud-box"><button class="ctrl-btn wall-hand-toggle" style="width:100%;justify-content:center">切换：当前【${wallHand === 'right' ? '右手优先' : '左手优先'}】</button></div>` : ''}
            <div class="hud-box" style="font-size:11px;color:#cbd5e1;line-height:1.55">
              <div style="color:#7dd3fc;font-weight:700;margin-bottom:4px">8方向编号速记（面朝右=0）</div>
              5(左上) &nbsp; 6(上/左) &nbsp; 7(右上)<br>
              4(后/左) &nbsp; ● &nbsp; 0(正前/右)<br>
              3(左下) &nbsp; 2(下/右) &nbsp; 1(右下)
            </div>`;
          const btn = side.querySelector('.wall-hand-toggle');
          if (btn) btn.onclick = () => { wallHand = wallHand === 'right' ? 'left' : 'right'; buildMap('wall'); };
        }
      }
    }

    return {
      render,
      setMode(m) { mode = m; buildMap(m); },
      togglePlay() { playing = !playing; return playing; },
      reset() { buildMap(mode); },
      step() { playing = false; stepLogic(); },
      setSpeed(s) { speed = s; }
    };
  }

  /* ========================================================================
     5. GRAPH SEARCH ENGINE (Elastic Cell Pop-In + Smooth Explorer + Progressive Ribbon)
     ======================================================================== */
  function createGraphSearchAnim(container, opts = {}) {
    let mode = opts.mode || 'bfs';
    let playing = true, speed = 1;
    const canvas = container.querySelector('canvas');
    const side = container.querySelector('.anim-side-panel');
    const narrator = container.querySelector('.anim-narrator');

    const ROWS = 6, COLS = 9;
    let grid = [], start = { r: 3, c: 1 }, goal = { r: 2, c: 7 };
    let containerDS = [], visited = new Map(), distMap = new Map(), parentMap = new Map();
    let order = [], path = [], curNode = null, prevNode = null, orbT = 1, pathReveal = 0, done = false, tickAcc = 0, lastSide = 0;

    const key = (r, c) => `${r},${c}`;
    const idOf = (r, c) => r * COLS + c;

    function init() {
      grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      [[1,4],[2,4],[3,4],[4,4]].forEach(([r, c]) => grid[r][c] = 1);
      if (mode === 'dijkstra') {
        grid[0][4] = 2; grid[0][5] = 2; grid[1][5] = 2;
        start = { r: 1, c: 2 }; goal = { r: 1, c: 7 };
      } else { start = { r: 3, c: 1 }; goal = { r: 2, c: 7 }; }
      visited = new Map(); distMap = new Map(); parentMap = new Map();
      order = []; path = []; curNode = start; prevNode = start; orbT = 1; pathReveal = 0; done = false;
      const sk = key(start.r, start.c);
      if (mode === 'dfs') containerDS = [{ r: start.r, c: start.c, d: 0 }];
      else if (mode === 'bfs') { visited.set(sk, performance.now()); distMap.set(sk, 0); containerDS = [{ r: start.r, c: start.c, d: 0 }]; }
      else { distMap.set(sk, 0); containerDS = [{ r: start.r, c: start.c, d: 0 }]; }
    }
    init();

    function tracePath(r, c) {
      path = []; let k = key(r, c);
      while (k) { const [rr, cc] = k.split(',').map(Number); path.push([rr, cc]); k = parentMap.get(k); }
      path.reverse(); pathReveal = 0;
    }

    function stepOnce() {
      if (done) { init(); return; }
      if (containerDS.length === 0) { done = true; return; }
      const D4 = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      const now = performance.now();

      if (mode === 'dfs') {
        const cur = containerDS.pop();
        const ck = key(cur.r, cur.c);
        if (visited.has(ck)) return;
        visited.set(ck, now); prevNode = curNode || cur; curNode = cur; orbT = 0; order.push(idOf(cur.r, cur.c));
        if (cur.r === goal.r && cur.c === goal.c) { tracePath(cur.r, cur.c); done = true; return; }
        for (let i = D4.length - 1; i >= 0; i--) {
          const nr = cur.r + D4[i][0], nc = cur.c + D4[i][1], nk = key(nr, nc);
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] !== 1 && !visited.has(nk)) {
            if (!parentMap.has(nk)) parentMap.set(nk, ck);
            containerDS.push({ r: nr, c: nc, d: cur.d + 1 });
          }
        }
      } else if (mode === 'bfs') {
        const cur = containerDS.shift();
        const ck = key(cur.r, cur.c);
        prevNode = curNode || cur; curNode = cur; orbT = 0; order.push(idOf(cur.r, cur.c));
        if (cur.r === goal.r && cur.c === goal.c) { tracePath(cur.r, cur.c); done = true; return; }
        for (const [dr, dc] of D4) {
          const nr = cur.r + dr, nc = cur.c + dc, nk = key(nr, nc);
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] !== 1 && !visited.has(nk)) {
            visited.set(nk, now); distMap.set(nk, cur.d + 1); parentMap.set(nk, ck);
            containerDS.push({ r: nr, c: nc, d: cur.d + 1 });
          }
        }
      } else {
        containerDS.sort((a, b) => a.d - b.d);
        const cur = containerDS.shift();
        const ck = key(cur.r, cur.c);
        if (visited.has(ck)) return;
        visited.set(ck, now); prevNode = curNode || cur; curNode = cur; orbT = 0; order.push(idOf(cur.r, cur.c));
        if (cur.r === goal.r && cur.c === goal.c) { tracePath(cur.r, cur.c); done = true; return; }
        for (const [dr, dc] of D4) {
          const nr = cur.r + dr, nc = cur.c + dc, nk = key(nr, nc);
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] !== 1 && !visited.has(nk)) {
            const nd = cur.d + (grid[nr][nc] === 2 ? 35 : 10);
            if (!distMap.has(nk) || nd < distMap.get(nk)) {
              distMap.set(nk, nd); parentMap.set(nk, ck);
              containerDS.push({ r: nr, c: nc, d: nd });
            }
          }
        }
      }
    }

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const padX = 24, padY = 42;
      const cw = (rect.width - padX * 2) / COLS, ch = (rect.height - padY - 18) / ROWS;
      const c = Math.floor((e.clientX - rect.left - padX) / cw), r = Math.floor((e.clientY - rect.top - padY) / ch);
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !(r === start.r && c === start.c) && !(r === goal.r && c === goal.c)) {
        grid[r][c] = (grid[r][c] + 1) % (mode === 'dijkstra' ? 3 : 2);
        const saved = grid.map(row => [...row]); init(); grid = saved;
      }
    });

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      drawGridBg(ctx, w, h);
      const now = performance.now();
      orbT = Math.min(1, orbT + dt * speed * 4.2);
      if (done && path.length > 1) pathReveal = Math.min(1, pathReveal + dt * speed * 1.15);

      if (playing) {
        tickAcc += dt * speed;
        if (tickAcc >= (done ? 2.6 : 0.28)) { tickAcc = 0; stepOnce(); }
      }

      const padX = 24, padY = 42;
      const cw = (w - padX * 2) / COLS, ch = (h - padY - 18) / ROWS;
      const pathSet = new Set(path.map(([r, c]) => key(r, c)));

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = padX + c * cw, y = padY + r * ch, k = key(r, c);
          const isStart = r === start.r && c === start.c, isGoal = r === goal.r && c === goal.c;
          const born = visited.get(k);
          let fill = 'rgba(26,38,62,0.75)', pop = 1;
          if (grid[r][c] === 1) fill = '#1d4ed8';
          else if (grid[r][c] === 2) fill = 'rgba(133, 77, 14, 0.72)';
          else if (pathSet.has(k) && pathReveal > 0.25) fill = 'rgba(16, 185, 129, 0.42)';
          else if (born) {
            pop = 0.72 + 0.28 * Ease.outBack(clamp01((now - born) / 360));
            fill = mode === 'bfs' ? `hsla(${195 + (distMap.get(k) || 0) * 14}, 82%, 46%, 0.36)` : 'rgba(56, 189, 248, 0.28)';
          }
          if (isStart) fill = '#059669';
          if (isGoal) fill = '#e11d48';

          ctx.save();
          ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(pop, pop);
          ctx.fillStyle = fill;
          ctx.beginPath(); ctx.roundRect(-cw / 2 + 2, -ch / 2 + 2, cw - 4, ch - 4, 6); ctx.fill();
          ctx.strokeStyle = curNode && curNode.r === r && curNode.c === c ? '#fde047' : 'rgba(148,163,184,0.2)';
          ctx.lineWidth = curNode && curNode.r === r && curNode.c === c ? 2.6 : 1; ctx.stroke();
          ctx.restore();

          ctx.fillStyle = 'rgba(226,232,240,0.88)'; ctx.font = 'bold 11px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
          const lbl = isStart ? 'M' : (isGoal ? 'P' : (grid[r][c] === 2 ? '沼35' : String(idOf(r, c))));
          ctx.fillText(lbl, x + 6, y + 16);
          if (distMap.has(k) && !isStart && grid[r][c] !== 1) {
            ctx.fillStyle = '#fde047'; ctx.font = 'bold 10.5px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
            ctx.fillText(mode === 'dijkstra' ? `d=${distMap.get(k)}` : `L${distMap.get(k)}`, x + 6, y + ch - 7);
          }
        }
      }

      // Smoothly gliding luminous search orb
      if (curNode && prevNode && !done) {
        const eo = Ease.outQuint(orbT);
        const ox = padX + (prevNode.c + (curNode.c - prevNode.c) * eo + 0.5) * cw;
        const oy = padY + (prevNode.r + (curNode.r - prevNode.r) * eo + 0.5) * ch;
        ctx.fillStyle = '#fde047'; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }

      // Progressive non-linear glowing path ribbon + whale gliding along it!
      if (path.length > 1) {
        const ep = Ease.inOutCubic(pathReveal);
        const totalSeg = path.length - 1;
        const fIdx = ep * totalSeg;
        const whole = Math.floor(fIdx), frac = fIdx - whole;
        const drawPts = [];
        for (let i = 0; i <= Math.min(whole, totalSeg); i++) {
          drawPts.push([padX + (path[i][1] + 0.5) * cw, padY + (path[i][0] + 0.5) * ch]);
        }
        if (whole < totalSeg) {
          const [r1, c1] = path[whole], [r2, c2] = path[whole + 1];
          drawPts.push([padX + (c1 + (c2 - c1) * frac + 0.5) * cw, padY + (r1 + (r2 - r1) * frac + 0.5) * ch]);
        }
        drawTaperedTrail(ctx, drawPts, '52, 211, 153', 5.5);
        const head = drawPts[drawPts.length - 1];
        const prev = drawPts[Math.max(0, drawPts.length - 2)];
        drawWhaleAgent(ctx, head[0], head[1], Math.atan2(head[1] - prev[1], head[0] - prev[0]), 10, '#34d399', now / 90);
      }

      const modeTitle = mode === 'dfs' ? 'DFS 深度优先 (栈 FILO · 不保证最短)' : (mode === 'bfs' ? 'BFS 广度优先 (队列 FIFO · 无权图必最短!)' : 'Dijkstra (优先队列 · 绕开高代价沼泽35!)');
      drawBadge(ctx, 14, 10, `${modeTitle} | 已扩展: ${order.length} 格${done && path.length ? ` | 路径长: ${path.length - 1}步` : ''}`, 'rgba(12,22,44,0.92)', '#fef08a');

      if (now - lastSide > 140) {
        lastSide = now;
        if (narrator) narrator.textContent = mode === 'dfs' ? 'DFS 使用【栈】一路走到黑再回溯，弹性弹出动画清晰展现访问顺序！' :
          (mode === 'bfs' ? 'BFS 使用【队列】按层波纹扩散（L1→L2→L3…），首次到达终点即为最短路径！' : 'Dijkstra 使用【优先队列/最小堆】松弛代价最小节点，自动绕过棕色高代价沼泽！');
        if (side) {
          const dsLabel = mode === 'dfs' ? '栈 Stack (顶→底)' : (mode === 'bfs' ? '队列 Queue (队头→队尾)' : '优先队列 MinHeap (按代价)');
          const items = (mode === 'dfs' ? [...containerDS].reverse() : containerDS).slice(0, 10);
          side.innerHTML = `<h4>${dsLabel}</h4>
            <div class="hud-box" style="display:flex;flex-wrap:wrap;gap:5px">${items.length ? items.map((n, i) => `<span style="padding:3px 7px;border-radius:6px;font-family:var(--font-mono);font-size:11px;background:${i === 0 ? '#1d5cff' : 'rgba(255,255,255,0.08)'};color:#fff">#${idOf(n.r, n.c)}${mode === 'dijkstra' ? '(' + n.d + ')' : ''}</span>`).join('') : '<span style="color:#64748b">空</span>'}</div>
            <div class="hud-box"><div class="hud-row"><span>已访问节点数</span><span>${order.length}</span></div><div class="hud-row"><span>路径步数</span><span>${path.length ? path.length - 1 : '搜索中...'}</span></div></div>`;
        }
      }
    }

    return {
      render,
      setMode(m) { mode = m; init(); },
      togglePlay() { playing = !playing; return playing; },
      reset() { init(); },
      step() { playing = false; stepOnce(); },
      setSpeed(s) { speed = s; }
    };
  }

  /* ========================================================================
     6. A* PATHFINDING ENGINE (Elastic Cell Pop + Shooting Sparks + Progressive Path!)
     ======================================================================== */
  function createAStarAnim(container, opts = {}) {
    let mode = opts.mode || 'ppt';
    let playing = true, speed = 1;
    const canvas = container.querySelector('canvas');
    const side = container.querySelector('.anim-side-panel');
    const narrator = container.querySelector('.anim-narrator');

    let ROWS = 6, COLS = 7;
    let obstacles = new Set(), influence = new Map();
    let start = { r: 2, c: 1 }, goal = { r: 2, c: 5 };
    let open = [], close = new Set(), nodes = new Map();
    let curKey = null, path = [], done = false, tickAcc = 0, stepCount = 0, stepLog = '';
    let tieBreakH = true;
    let sparks = []; // [{fromR,fromC,toR,toC,born,col}]
    let ripples = []; // [{r,c,born,col}]
    let pathReveal = 0;

    const kOf = (r, c) => `${r},${c}`;
    const idOf = (r, c) => r * COLS + c;

    function loadPreset(m) {
      obstacles = new Set(); influence = new Map();
      if (m === 'exam') {
        ROWS = 4; COLS = 7; start = { r: 1, c: 1 }; goal = { r: 2, c: 5 };
        [10, 17, 23].forEach(id => obstacles.add(kOf(Math.floor(id / 7), id % 7)));
        tieBreakH = false;
      } else if (m === 'opt') {
        ROWS = 6; COLS = 8; start = { r: 3, c: 1 }; goal = { r: 2, c: 6 };
        [[1,4],[4,4]].forEach(([r, c]) => obstacles.add(kOf(r, c)));
        [[2,3,18],[2,4,35],[2,5,18],[3,3,18],[3,4,35],[3,5,18]].forEach(([r, c, val]) => influence.set(kOf(r, c), val));
        tieBreakH = true;
      } else {
        ROWS = 6; COLS = 7; start = { r: 2, c: 1 }; goal = { r: 2, c: 5 };
        [10, 17, 24].forEach(id => obstacles.add(kOf(Math.floor(id / 7), id % 7)));
        tieBreakH = true;
      }
      resetSearch();
    }

    function hVal(r, c) { return (Math.abs(r - goal.r) + Math.abs(c - goal.c)) * 10; }

    function resetSearch() {
      open = []; close = new Set(); nodes = new Map();
      curKey = null; path = []; done = false; stepCount = 0; sparks = []; ripples = []; pathReveal = 0;
      const now = performance.now();
      const sk = kOf(start.r, start.c), h0 = hVal(start.r, start.c);
      nodes.set(sk, { r: start.r, c: start.c, g: 0, h: h0, f: h0, parent: null, born: now });
      open.push(sk);
      ripples.push({ r: start.r, c: start.c, born: now, col: '56,189,248' });
      stepLog = `Step 0: 起点 #${idOf(start.r, start.c)} 入 Open List (g=0, h=${h0}, f=${h0})`;
    }
    loadPreset(mode);

    const CW8 = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];

    function stepOnce() {
      if (done) { resetSearch(); return; }
      if (open.length === 0) { done = true; stepLog = 'Open List 为空，寻路失败！'; return; }

      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        const a = nodes.get(open[i]), b = nodes.get(open[bestIdx]);
        if (a.f < b.f || (a.f === b.f && tieBreakH && a.h < b.h)) bestIdx = i;
      }
      const ck = open.splice(bestIdx, 1)[0];
      const cur = nodes.get(ck);
      const now = performance.now();
      curKey = ck; close.add(ck); stepCount++;
      ripples.push({ r: cur.r, c: cur.c, born: now, col: '52,211,153' });

      if (cur.r === goal.r && cur.c === goal.c) {
        done = true; path = []; pathReveal = 0;
        let tk = ck;
        while (tk) { const nd = nodes.get(tk); path.push([nd.r, nd.c, idOf(nd.r, nd.c)]); tk = nd.parent; }
        path.reverse();
        ripples.push({ r: goal.r, c: goal.c, born: now, col: '253,224,71' });
        stepLog = `找到终点 #${idOf(goal.r, goal.c)}！倒推路径: ${path.map(x => x[2]).join(' → ')}`;
        return;
      }

      let updated = [];
      for (const [dr, dc] of CW8) {
        const nr = cur.r + dr, nc = cur.c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const nk = kOf(nr, nc);
        if (obstacles.has(nk) || close.has(nk)) continue;
        const ng = cur.g + ((dr !== 0 && dc !== 0) ? 14 : 10) + (influence.get(nk) || 0);
        const nh = hVal(nr, nc), nf = ng + nh;
        if (!nodes.has(nk)) {
          nodes.set(nk, { r: nr, c: nc, g: ng, h: nh, f: nf, parent: ck, born: now });
          open.push(nk);
          sparks.push({ fromR: cur.r, fromC: cur.c, toR: nr, toC: nc, born: now, col: '#fbbf24' });
          updated.push(`#${idOf(nr, nc)}`);
        } else {
          const ex = nodes.get(nk);
          if (ng < ex.g) {
            ex.g = ng; ex.f = nf; ex.parent = ck; ex.born = now;
            sparks.push({ fromR: cur.r, fromC: cur.c, toR: nr, toC: nc, born: now, col: '#34d399' });
            updated.push(`更新#${idOf(nr, nc)}`);
          }
        }
      }
      stepLog = `Step ${stepCount}: 选最小 f 节点 #${idOf(cur.r, cur.c)}(f=${cur.f}) 入 Close，扩展 ${updated.length} 邻接点`;
    }

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const padX = 18, padY = 42;
      const cw = (rect.width - padX * 2) / COLS, ch = (rect.height - padY - 14) / ROWS;
      const c = Math.floor((e.clientX - rect.left - padX) / cw), r = Math.floor((e.clientY - rect.top - padY) / ch);
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !(r === start.r && c === start.c) && !(r === goal.r && c === goal.c)) {
        const k = kOf(r, c);
        if (obstacles.has(k)) obstacles.delete(k); else obstacles.add(k);
        resetSearch();
      }
    });

    let lastSide = 0;
    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      drawGridBg(ctx, w, h);
      const now = performance.now();
      if (done && path.length > 1) pathReveal = Math.min(1, pathReveal + dt * speed * 0.95);
      if (playing) {
        tickAcc += dt * speed;
        if (tickAcc >= (done ? 3.5 : 0.72)) { tickAcc = 0; stepOnce(); }
      }

      const padX = 18, padY = 42;
      const cw = (w - padX * 2) / COLS, ch = (h - padY - 14) / ROWS;
      const pathSet = new Set(path.map(([r, c]) => kOf(r, c)));
      const openSet = new Set(open);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = padX + c * cw, y = padY + r * ch, k = kOf(r, c);
          const isStart = r === start.r && c === start.c, isGoal = r === goal.r && c === goal.c;
          const isObs = obstacles.has(k), inf = influence.get(k) || 0;
          const nd = nodes.get(k);

          let fill = 'rgba(20, 34, 62, 0.85)', sc = 1;
          if (nd && !isObs) sc = 0.78 + 0.22 * Ease.outBack(clamp01((now - nd.born) / 360));
          if (isObs) fill = '#2563eb';
          else if (isStart) fill = '#059669';
          else if (isGoal) fill = '#e11d48';
          else if (pathSet.has(k) && pathReveal > 0.2) fill = 'rgba(14, 165, 233, 0.45)';
          else if (close.has(k)) fill = 'rgba(16, 185, 129, 0.25)';
          else if (openSet.has(k)) fill = 'rgba(245, 158, 11, 0.24)';
          else if (inf > 0) fill = `rgba(239, 68, 68, ${Math.min(0.45, inf / 75)})`;

          ctx.save();
          ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(sc, sc);
          ctx.fillStyle = fill;
          ctx.beginPath(); ctx.roundRect(-cw / 2 + 2, -ch / 2 + 2, cw - 4, ch - 4, 6); ctx.fill();
          ctx.strokeStyle = k === curKey ? '#38bdf8' : (isObs ? '#93c5fd' : (openSet.has(k) ? '#fbbf24' : (close.has(k) ? '#34d399' : 'rgba(148,163,184,0.2)')));
          ctx.lineWidth = k === curKey ? 2.8 : 1.2; ctx.stroke();
          ctx.restore();

          ctx.fillStyle = isStart || isGoal || isObs ? '#fff' : 'rgba(226,232,240,0.82)';
          ctx.font = 'bold 12px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
          const centerTxt = isStart ? `A(${idOf(r, c)})` : (isGoal ? `B(${idOf(r, c)})` : `${idOf(r, c)}`);
          ctx.fillText(centerTxt, x + cw * 0.5 - ctx.measureText(centerTxt).width / 2, y + ch * 0.54);

          if (inf > 0 && !nd) {
            ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 10px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif'; ctx.fillText(`危险+${inf}`, x + 5, y + ch - 6);
          }
          if (nd && !isObs) {
            ctx.font = 'bold 10.5px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif';
            ctx.fillStyle = '#fde047'; ctx.fillText(String(nd.f), x + 6, y + 14);
            ctx.fillStyle = '#67e8f9'; ctx.fillText(String(nd.g), x + 6, y + ch - 6);
            ctx.fillStyle = '#fda4af';
            const hs = String(nd.h);
            ctx.fillText(hs, x + cw - ctx.measureText(hs).width - 6, y + ch - 6);

            if (nd.parent) {
              const pn = nodes.get(nd.parent);
              const px = x + cw * 0.5, py = y + ch * 0.5;
              const adx = pn.c - nd.c, ady = pn.r - nd.r, d = Math.hypot(adx, ady) || 1;
              drawArrow(ctx, px + (adx / d) * 11, py + (ady / d) * 11, px + (adx / d) * (cw * 0.42), py + (ady / d) * (ch * 0.42), 'rgba(255,255,255,0.55)', 1.5, 5);
            }
          }
        }
      }

      // Draw expanding Close/Goal shockwave ripples
      ripples = ripples.filter(rp => now - rp.born < 650);
      ripples.forEach(rp => {
        const u = Ease.outExpo((now - rp.born) / 650);
        const rx = padX + (rp.c + 0.5) * cw, ry = padY + (rp.r + 0.5) * ch;
        ctx.strokeStyle = `rgba(${rp.col}, ${(1 - u) * 0.85})`; ctx.lineWidth = 2.5 * (1 - u) + 0.6;
        ctx.beginPath(); ctx.arc(rx, ry, 8 + u * cw * 0.65, 0, Math.PI * 2); ctx.stroke();
      });

      // Draw shooting neighbor-expansion energy sparks!
      sparks = sparks.filter(sp => now - sp.born < 480);
      sparks.forEach(sp => {
        const u = Ease.outExpo((now - sp.born) / 480);
        const x1 = padX + (sp.fromC + 0.5) * cw, y1 = padY + (sp.fromR + 0.5) * ch;
        const x2 = padX + (sp.toC + 0.5) * cw, y2 = padY + (sp.toR + 0.5) * ch;
        const sx = x1 + (x2 - x1) * u, sy = y1 + (y2 - y1) * u;
        ctx.fillStyle = sp.col; ctx.shadowColor = sp.col; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(sx, sy, 4.2 * (1 - u * 0.5), 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      });

      // Progressive non-linear glowing final path + whale swimming along it!
      if (path.length > 1) {
        const ep = Ease.inOutQuint(pathReveal);
        const totalSeg = path.length - 1, fIdx = ep * totalSeg;
        const whole = Math.floor(fIdx), frac = fIdx - whole;
        const pts = [];
        for (let i = 0; i <= Math.min(whole, totalSeg); i++) pts.push([padX + (path[i][1] + 0.5) * cw, padY + (path[i][0] + 0.5) * ch]);
        if (whole < totalSeg) {
          const [r1, c1] = path[whole], [r2, c2] = path[whole + 1];
          pts.push([padX + (c1 + (c2 - c1) * frac + 0.5) * cw, padY + (r1 + (r2 - r1) * frac + 0.5) * ch]);
        }
        drawTaperedTrail(ctx, pts, '56, 189, 248', 6);
        const head = pts[pts.length - 1], prev = pts[Math.max(0, pts.length - 2)];
        drawWhaleAgent(ctx, head[0], head[1], Math.atan2(head[1] - prev[1], head[0] - prev[0]), 11, '#38bdf8', now / 80);
      }

      drawBadge(ctx, 12, 9, stepLog, 'rgba(12,22,44,0.92)', '#fef08a');

      if (now - lastSide > 140) {
        lastSide = now;
        if (narrator) narrator.textContent = '左上=f(黄) · 左下=g(青) · 右下=h(粉) · 能量粒子呈现实时扩展，点击格子可动态增删障碍！';
        if (side) {
          const openSorted = [...open].map(k => nodes.get(k)).sort((a, b) => a.f - b.f || a.h - b.h);
          const closeIds = [...close].map(k => { const n = nodes.get(k); return `#${idOf(n.r, n.c)}(${n.f})`; });
          side.innerHTML = `<h4>Open List 待考察 (${open.length})</h4>
            <div class="hud-box" style="display:flex;flex-wrap:wrap;gap:4px;max-height:110px;overflow-y:auto">
              ${openSorted.map((n, i) => `<span style="padding:2px 6px;border-radius:6px;font-family:var(--font-mono);font-size:11px;background:${i === 0 ? '#d97706' : 'rgba(245,158,11,0.22)'};color:#fef3c7">#${idOf(n.r, n.c)} f=${n.f}(h=${n.h})</span>`).join('') || '<span style="color:#64748b">空</span>'}
            </div>
            <h4>Close List 已考察 (${close.size})</h4>
            <div class="hud-box" style="display:flex;flex-wrap:wrap;gap:4px;max-height:85px;overflow-y:auto">
              ${closeIds.map(s => `<span style="padding:2px 6px;border-radius:6px;font-family:var(--font-mono);font-size:11px;background:rgba(16,185,129,0.24);color:#a7f3d0">${s}</span>`).join('')}
            </div>
            <div class="hud-box" style="font-size:11px;color:#93c5fd">直走 g+10 | 斜走 g+14 | 曼哈顿 h=(|Δx|+|Δy|)×10</div>`;
        }
      }
    }

    return {
      render,
      setMode(m) { mode = m; loadPreset(m); },
      togglePlay() { playing = !playing; return playing; },
      reset() { loadPreset(mode); },
      step() { playing = false; stepOnce(); },
      setSpeed(s) { speed = s; }
    };
  }

  /* ========================================================================
     7. FSM ENGINE (Elastic State Bounce + Curved Bezier Energy Comet + Ripple)
     ======================================================================== */
  function createFSMAnim(container, opts = {}) {
    let mode = opts.mode || 'guard';
    let playing = true, speed = 1;
    const canvas = container.querySelector('canvas');
    const side = container.querySelector('.anim-side-panel');
    const narrator = container.querySelector('.anim-narrator');

    const PRESETS = {
      guard: {
        title: '游戏守卫 AI 状态机', init: 'Patrol',
        nodes: [
          { id: 'Patrol', label: '巡逻\nPatrol', x: 0.22, y: 0.34, col: '#38bdf8' },
          { id: 'Chase',  label: '追逐\nChase',  x: 0.56, y: 0.34, col: '#f59e0b' },
          { id: 'Attack', label: '攻击\nAttack', x: 0.84, y: 0.55, col: '#ef4444' },
          { id: 'Dead',   label: '死亡\nDead',   x: 0.44, y: 0.78, col: '#94a3b8' }
        ],
        edges: [
          { from: 'Patrol', to: 'Chase',  ev: '发现玩家', curve: -24 },
          { from: 'Chase',  to: 'Patrol', ev: '玩家离开', curve: -24 },
          { from: 'Chase',  to: 'Attack', ev: '进入射程', curve: -22 },
          { from: 'Attack', to: 'Chase',  ev: '脱离射程', curve: -22 },
          { from: 'Attack', to: 'Patrol', ev: '玩家很远', curve: 58 },
          { from: 'Patrol', to: 'Dead',   ev: 'HP=0', curve: 15 },
          { from: 'Chase',  to: 'Dead',   ev: 'HP=0', curve: 0 },
          { from: 'Attack', to: 'Dead',   ev: 'HP=0', curve: -15 }
        ],
        autoSeq: ['发现玩家', '进入射程', '脱离射程', '玩家离开', '发现玩家', 'HP=0']
      },
      blinky: {
        title: '吃豆人红幽灵 Blinky', init: 'Rise',
        nodes: [
          { id: 'Rise',   label: '上升\nRise',   x: 0.16, y: 0.76, col: '#38bdf8' },
          { id: 'Chase',  label: '追逐玩家\nChase', x: 0.42, y: 0.25, col: '#ef4444' },
          { id: 'Random', label: '随机移动\nWander', x: 0.82, y: 0.25, col: '#a78bfa' },
          { id: 'Flee',   label: '逃离玩家\nFlee',  x: 0.48, y: 0.66, col: '#60a5fa' },
          { id: 'Dead',   label: '死亡(眼珠)\nDead', x: 0.82, y: 0.76, col: '#94a3b8' }
        ],
        edges: [
          { from: 'Rise',   to: 'Chase',  ev: '退出迷宫中央', curve: -22 },
          { from: 'Chase',  to: 'Random', ev: '玩家死亡', curve: -20 },
          { from: 'Random', to: 'Chase',  ev: '玩家再生', curve: -20 },
          { from: 'Chase',  to: 'Flee',   ev: '吃能量球', curve: -24 },
          { from: 'Flee',   to: 'Chase',  ev: '能量用尽', curve: -24 },
          { from: 'Flee',   to: 'Dead',   ev: '被玩家吃掉', curve: -14 },
          { from: 'Dead',   to: 'Rise',   ev: '回到迷宫中央', curve: 32 }
        ],
        autoSeq: ['退出迷宫中央', '吃能量球', '能量用尽', '玩家死亡', '玩家再生', '吃能量球', '被玩家吃掉', '回到迷宫中央']
      },
      ant: {
        title: '蚂蚁世界 Ant World', init: 'Hungry',
        nodes: [
          { id: 'Hungry', label: '饥饿\n找食物', x: 0.22, y: 0.30, col: '#f59e0b' },
          { id: 'Home',   label: '回家\n搬食物', x: 0.68, y: 0.28, col: '#10b981' },
          { id: 'Thirsty',label: '口渴\n找水源', x: 0.68, y: 0.74, col: '#38bdf8' },
          { id: 'Dead',   label: '死亡\n中毒',   x: 0.22, y: 0.76, col: '#ef4444' }
        ],
        edges: [
          { from: 'Hungry',  to: 'Home',    ev: '找到食物', curve: -18 },
          { from: 'Home',    to: 'Thirsty', ev: '回到巢穴', curve: -18 },
          { from: 'Thirsty', to: 'Hungry',  ev: '找到水源', curve: -18 },
          { from: 'Hungry',  to: 'Dead',    ev: '碰到毒物', curve: 0 },
          { from: 'Home',    to: 'Dead',    ev: '碰到毒物', curve: 18 },
          { from: 'Thirsty', to: 'Dead',    ev: '碰到毒物', curve: 12 }
        ],
        autoSeq: ['找到食物', '回到巢穴', '找到水源', '找到食物', '碰到毒物']
      }
    };

    let curState = PRESETS[mode].init, activeEdge = null, edgeAnim = 1, enterBounce = 1, autoIdx = 0, timer = 0;

    function triggerEvent(evName) {
      const pre = PRESETS[mode];
      const ed = pre.edges.find(e => e.from === curState && e.ev === evName);
      if (ed) { activeEdge = ed; edgeAnim = 0; enterBounce = 0; curState = ed.to; renderSide(); }
      else if (curState === 'Dead') { curState = pre.init; activeEdge = null; edgeAnim = 1; enterBounce = 0; renderSide(); }
    }

    function renderSide() {
      const pre = PRESETS[mode];
      const avail = pre.edges.filter(e => e.from === curState);
      if (narrator) narrator.textContent = '状态模式核心：Context.ChangeState() 自动执行 旧.Exit() → 切换 → 新.Enter()，点击右侧触发非线性光束迁移！';
      if (!side) return;
      side.innerHTML = `<h4>交互事件触发器</h4>
        <div class="hud-box">
          <div class="hud-row"><span>当前激活状态</span><span style="color:#34d399">${curState}</span></div>
          <div class="hud-row"><span>四要素</span><span>状态/初始/输入/转换</span></div>
        </div>
        <div class="hud-box">
          <div style="color:#7dd3fc;font-weight:700;margin-bottom:6px">点击触发事件：</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${avail.length ? avail.map(e => `<button class="ctrl-btn fsm-ev-btn" data-ev="${e.ev}" style="font-size:11.5px;padding:4px 9px">${e.ev} → ${e.to}</button>`).join('') : `<button class="ctrl-btn primary fsm-reset-btn" style="width:100%;justify-content:center">重置到初始状态 (${pre.init})</button>`}
          </div>
        </div>
        <div class="hud-box" style="font-family:var(--font-mono);font-size:10.8px;line-height:1.5;color:#cbd5e1">
          <div style="color:#7dd3fc;font-weight:700;margin-bottom:3px">同步执行伪代码 (State模式)</div>
          _curState?.Exit(this);<br>
          _curState = <span style="color:#fde047">new ${curState}State()</span>;<br>
          _curState.Enter(this);<br>
          <span style="color:#34d399">// Update(): _curState.Execute(this);</span>
        </div>`;
      side.querySelectorAll('.fsm-ev-btn').forEach(b => b.onclick = () => { playing = false; triggerEvent(b.dataset.ev); });
      const rb = side.querySelector('.fsm-reset-btn');
      if (rb) rb.onclick = () => { curState = pre.init; activeEdge = null; enterBounce = 0; renderSide(); };
    }
    renderSide();

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      drawGridBg(ctx, w, h);
      const pre = PRESETS[mode];

      if (edgeAnim < 1) edgeAnim = Math.min(1, edgeAnim + dt * 1.85 * speed);
      else if (enterBounce < 1) enterBounce = Math.min(1, enterBounce + dt * 2.2 * speed);

      if (playing) {
        timer += dt * speed;
        if (timer > 1.95) {
          timer = 0;
          if (curState === 'Dead') { curState = pre.init; activeEdge = null; enterBounce = 0; autoIdx = 0; renderSide(); }
          else {
            const ev = pre.autoSeq[autoIdx % pre.autoSeq.length]; autoIdx++;
            const match = pre.edges.find(e => e.from === curState && e.ev === ev) || pre.edges.find(e => e.from === curState);
            if (match) triggerEvent(match.ev);
          }
        }
      }

      const posOf = id => { const n = pre.nodes.find(x => x.id === id); return { x: n.x * w, y: n.y * h, n }; };

      pre.edges.forEach(ed => {
        const a = posOf(ed.from), b = posOf(ed.to);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const cpx = mx - (dy / len) * ed.curve, cpy = my + (dx / len) * ed.curve;
        const isAct = activeEdge === ed;

        const qt = t => ({
          x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cpx + t * t * b.x,
          y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cpy + t * t * b.y
        });

        ctx.save();
        ctx.strokeStyle = isAct ? '#fde047' : 'rgba(148,163,184,0.42)';
        ctx.lineWidth = isAct ? 3.2 : 1.7;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cpx, cpy, b.x, b.y); ctx.stroke();

        const p1 = qt(0.72), p2 = qt(0.79);
        drawArrow(ctx, p1.x, p1.y, p2.x, p2.y, isAct ? '#fde047' : '#94a3b8', isAct ? 3 : 1.8, 8);

        const mid = qt(0.5);
        ctx.font = 'bold 11px "Microsoft YaHei UI", sans-serif';
        const tw = ctx.measureText(ed.ev).width;
        ctx.fillStyle = isAct ? 'rgba(217,119,6,0.94)' : 'rgba(12,22,44,0.86)';
        ctx.beginPath(); ctx.roundRect(mid.x - tw / 2 - 5, mid.y - 9, tw + 10, 18, 5); ctx.fill();
        ctx.fillStyle = isAct ? '#fff' : '#cbd5e1'; ctx.fillText(ed.ev, mid.x - tw / 2, mid.y + 4);

        // Multi-bead non-linear glowing comet travelling along curved Bezier edge!
        if (isAct && edgeAnim < 1) {
          const headT = Ease.inOutCubic(edgeAnim);
          const cometPts = [];
          for (let k = 8; k >= 0; k--) {
            const st = clamp01(headT - k * 0.025);
            const pt = qt(st);
            cometPts.push([pt.x, pt.y]);
          }
          drawTaperedTrail(ctx, cometPts, '253, 224, 71', 7);
          const hp = qt(headT);
          ctx.fillStyle = '#fff'; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.arc(hp.x, hp.y, 6.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      });

      const initP = posOf(pre.init);
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(initP.x - 56, initP.y - 26, 7, 0, Math.PI * 2); ctx.fill();
      drawArrow(ctx, initP.x - 48, initP.y - 22, initP.x - 28, initP.y - 12, '#38bdf8', 2.2, 7);

      pre.nodes.forEach(n => {
        const x = n.x * w, y = n.y * h;
        const active = n.id === curState && edgeAnim >= 0.92;
        const R = 34;
        ctx.save();
        // Elastic shockwave ring & spring bounce on state entry!
        let sc = 1;
        if (active) {
          sc = 0.92 + 0.14 * Ease.outElastic(enterBounce);
          const rip = Ease.outExpo(enterBounce);
          if (enterBounce < 1) {
            ctx.strokeStyle = n.col; ctx.globalAlpha = (1 - rip) * 0.85; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(x, y, R + rip * 26, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.strokeStyle = n.col; ctx.lineWidth = 2.6;
          ctx.globalAlpha = 0.35 + 0.25 * Math.sin(performance.now() / 220);
          ctx.beginPath(); ctx.arc(x, y, R + 8, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.translate(x, y); ctx.scale(sc, sc);
        ctx.fillStyle = active ? n.col : '#162747';
        ctx.strokeStyle = active ? '#fff' : n.col; ctx.lineWidth = active ? 3 : 2;
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.fillStyle = active ? '#071122' : '#e2e8f0';
        ctx.font = 'bold 12px "Microsoft YaHei UI", sans-serif'; ctx.textAlign = 'center';
        n.label.split('\n').forEach((ln, idx) => ctx.fillText(ln, 0, idx === 0 ? -2 : 13));
        ctx.restore();
      });

      drawBadge(ctx, 12, 10, `${pre.title} | 当前状态: ${curState} (蓝点=初始状态)`, 'rgba(12,22,44,0.92)', '#7dd3fc');
    }

    return {
      render,
      setMode(m) { mode = m; curState = PRESETS[m].init; activeEdge = null; edgeAnim = 1; enterBounce = 0; autoIdx = 0; timer = 0; renderSide(); },
      togglePlay() { playing = !playing; return playing; },
      reset() { curState = PRESETS[mode].init; activeEdge = null; edgeAnim = 1; enterBounce = 0; autoIdx = 0; timer = 0; renderSide(); },
      step() {
        playing = false;
        const pre = PRESETS[mode];
        if (curState === 'Dead') { curState = pre.init; activeEdge = null; enterBounce = 0; renderSide(); return; }
        const ev = pre.autoSeq[autoIdx % pre.autoSeq.length]; autoIdx++;
        const match = pre.edges.find(e => e.from === curState && e.ev === ev) || pre.edges.find(e => e.from === curState);
        if (match) triggerEvent(match.ev);
      },
      setSpeed(s) { speed = s; }
    };
  }

  /* ========================================================================
     8. BEHAVIOR TREE ENGINE (Gliding Luminous Tick Pulse + Elastic Node Pop!)
     ======================================================================== */
  function createBTAnim(container, opts = {}) {
    let mode = opts.mode || 'combat';
    let playing = true, speed = 1;
    const canvas = container.querySelector('canvas');
    const side = container.querySelector('.anim-side-panel');
    const narrator = container.querySelector('.anim-narrator');

    let conds = { lowHP: false, seePlayer: true, inRange: false };
    let pulsePhase = 0; // continuous float index along evaluation hops!

    function buildTree() {
      if (mode === 'interrupt') {
        return [
          { id: 'root', lbl: 'Root 根', kind: 'root', x: 0.5, y: 0.12, ch: ['par'] },
          { id: 'par',  lbl: '⇉ Parallel\n并行节点', kind: 'comp', x: 0.5, y: 0.36, ch: ['dec', 'seq'] },
          { id: 'dec',  lbl: '◇ Until Failure\n修饰节点', kind: 'dec', x: 0.25, y: 0.62, ch: ['c_see'] },
          { id: 'c_see',lbl: '看到玩家?\nCondition', kind: 'cond', x: 0.25, y: 0.86, ch: [], eval: () => conds.seePlayer ? 'S' : 'F' },
          { id: 'seq',  lbl: '→ Sequence\n顺序节点', kind: 'comp', x: 0.72, y: 0.62, ch: ['a_move', 'a_atk'] },
          { id: 'a_move', lbl: '向玩家移动\nAction', kind: 'act', x: 0.58, y: 0.86, ch: [], eval: () => conds.inRange ? 'S' : 'R' },
          { id: 'a_atk',  lbl: '发动攻击\nAction', kind: 'act', x: 0.85, y: 0.86, ch: [], eval: () => 'S' }
        ];
      }
      return [
        { id: 'root', lbl: 'Root 根', kind: 'root', x: 0.5, y: 0.10, ch: ['sel'] },
        { id: 'sel',  lbl: '? Selector\n选择节点', kind: 'comp', x: 0.5, y: 0.30, ch: ['seq_flee', 'seq_fight', 'a_pat'] },
        { id: 'seq_flee', lbl: '→ Sequence', kind: 'comp', x: 0.18, y: 0.54, ch: ['c_hp', 'a_flee'] },
        { id: 'c_hp', lbl: 'HP<30%?', kind: 'cond', x: 0.09, y: 0.82, ch: [], eval: () => conds.lowHP ? 'S' : 'F' },
        { id: 'a_flee', lbl: '逃跑', kind: 'act', x: 0.26, y: 0.82, ch: [], eval: () => 'R' },
        { id: 'seq_fight', lbl: '→ Sequence', kind: 'comp', x: 0.56, y: 0.54, ch: ['c_see', 'a_chase', 'a_atk'] },
        { id: 'c_see', lbl: '看到玩家?', kind: 'cond', x: 0.41, y: 0.82, ch: [], eval: () => conds.seePlayer ? 'S' : 'F' },
        { id: 'a_chase', lbl: '追逐移动', kind: 'act', x: 0.56, y: 0.82, ch: [], eval: () => conds.inRange ? 'S' : 'R' },
        { id: 'a_atk', lbl: '攻击玩家', kind: 'act', x: 0.71, y: 0.82, ch: [], eval: () => 'S' },
        { id: 'a_pat', lbl: '巡逻\nAction', kind: 'act', x: 0.88, y: 0.54, ch: [], eval: () => 'R' }
      ];
    }

    function evaluateTree(nodes) {
      const map = new Map(nodes.map(n => [n.id, n]));
      const hops = []; // [{from, to, revealId, st}]
      function run(id, parentId) {
        if (parentId) hops.push({ from: parentId, to: id, revealId: null, st: null });
        const n = map.get(id);
        let st = 'S';
        if (n.kind === 'cond' || n.kind === 'act') st = n.eval();
        else if (n.kind === 'root') st = run(n.ch[0], id);
        else if (n.kind === 'dec') { const cs = run(n.ch[0], id); st = cs === 'F' ? 'F' : 'R'; }
        else if (n.lbl.includes('Selector')) {
          st = 'F';
          for (const cid of n.ch) { const cs = run(cid, id); if (cs === 'S' || cs === 'R') { st = cs; break; } }
        } else if (n.lbl.includes('Sequence')) {
          st = 'S';
          for (const cid of n.ch) { const cs = run(cid, id); if (cs === 'F' || cs === 'R') { st = cs; break; } }
        } else if (n.lbl.includes('Parallel')) {
          let allS = true, anyF = false;
          for (const cid of n.ch) { const cs = run(cid, id); if (cs === 'F') anyF = true; if (cs !== 'S') allS = false; }
          st = anyF ? 'F' : (allS ? 'S' : 'R');
        }
        hops.push({ from: id, to: parentId || id, revealId: id, st });
        return st;
      }
      run('root', null);
      return hops;
    }

    function renderSide() {
      if (narrator) narrator.textContent = mode === 'interrupt'
        ? '点击右侧取消勾选【看到玩家】，看 Tick 光球如何沿着 Parallel 瞬间触发中断！'
        : '勾选/取消右侧条件，观察发光 Tick 脉冲丝滑穿梭整棵行为树并实时回传 S/F/R！';
      if (!side) return;
      side.innerHTML = `<h4>实时游戏条件开关</h4>
        <div class="hud-box" style="display:flex;flex-direction:column;gap:8px">
          ${mode !== 'interrupt' ? `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" class="bt-chk" data-k="lowHP" ${conds.lowHP ? 'checked' : ''}> 血量低于 30% (最高优先)</label>` : ''}
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" class="bt-chk" data-k="seePlayer" ${conds.seePlayer ? 'checked' : ''}> 看到玩家 (Condition)</label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" class="bt-chk" data-k="inRange" ${conds.inRange ? 'checked' : ''}> 玩家在攻击范围内</label>
        </div>
        <div class="hud-box" style="font-size:11.5px;line-height:1.6">
          <div style="color:#7dd3fc;font-weight:700;margin-bottom:4px">节点返回状态图例</div>
          <div><span style="color:#34d399;font-weight:800">● S (Success)</span>：成功</div>
          <div><span style="color:#fb7185;font-weight:800">● F (Failure)</span>：失败</div>
          <div><span style="color:#38bdf8;font-weight:800">● R (Running)</span>：多帧执行中</div>
        </div>
        <div class="hud-box" style="font-size:11px;color:#cbd5e1">
          <b>? Selector</b>：遇 S/R 即停<br><b>→ Sequence</b>：遇 F/R 即停<br><b>⇉ Parallel</b>：并发，任一 F 即中断
        </div>`;
      side.querySelectorAll('.bt-chk').forEach(chk => {
        chk.onchange = () => { conds[chk.dataset.k] = chk.checked; pulsePhase = 0; };
      });
    }
    renderSide();

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      drawGridBg(ctx, w, h);
      const nodes = buildTree();
      const hops = evaluateTree(nodes);
      const map = new Map(nodes.map(n => [n.id, n]));

      if (playing) {
        pulsePhase = (pulsePhase + dt * speed * 2.4) % (hops.length + 2.5);
      }

      const curHopIdx = Math.min(Math.floor(pulsePhase), hops.length - 1);
      const hopFrac = pulsePhase < hops.length ? (pulsePhase - curHopIdx) : 1;
      const shown = new Map();
      const popMap = new Map();
      for (let i = 0; i <= curHopIdx; i++) {
        if (hops[i].revealId) {
          shown.set(hops[i].revealId, hops[i].st);
          const age = clamp01((pulsePhase - i) / 0.85);
          popMap.set(hops[i].revealId, 0.86 + 0.14 * Ease.outBack(age));
        }
      }

      const stCol = st => st === 'S' ? '#10b981' : (st === 'F' ? '#ef4444' : '#38bdf8');

      // Draw edges
      nodes.forEach(n => {
        n.ch.forEach(cid => {
          const c = map.get(cid);
          const x1 = n.x * w, y1 = n.y * h + 18, x2 = c.x * w, y2 = c.y * h - 18;
          const cst = shown.get(cid);
          ctx.strokeStyle = cst ? stCol(cst) : 'rgba(148,163,184,0.3)';
          ctx.lineWidth = cst ? 2.8 : 1.5;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        });
      });

      // Draw nodes with elastic pop on reveal!
      nodes.forEach(n => {
        const x = n.x * w, y = n.y * h;
        const st = shown.get(n.id);
        const sc = popMap.get(n.id) || 1;
        const bw = n.kind === 'root' ? 76 : (n.kind === 'comp' ? 92 : 84), bh = 36;
        ctx.save();
        ctx.translate(x, y); ctx.scale(sc, sc);
        ctx.fillStyle = st ? (st === 'S' ? 'rgba(16,185,129,0.22)' : (st === 'F' ? 'rgba(239,68,68,0.22)' : 'rgba(56,189,248,0.25)')) : '#162747';
        ctx.strokeStyle = st ? stCol(st) : '#475569'; ctx.lineWidth = st ? 2.2 : 1.6;
        if (n.kind === 'dec') {
          ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(56, 0); ctx.lineTo(0, 24); ctx.lineTo(-56, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        } else if (n.kind === 'cond') {
          ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 18); ctx.fill(); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 8); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 11px "Microsoft YaHei UI", sans-serif'; ctx.textAlign = 'center';
        const lns = n.lbl.split('\n');
        if (lns.length === 1) ctx.fillText(lns[0], 0, 4);
        else { ctx.fillText(lns[0], 0, -2); ctx.fillText(lns[1], 0, 12); }

        if (st) {
          ctx.fillStyle = stCol(st); ctx.beginPath(); ctx.arc(bw / 2 - 2, -bh / 2 + 2, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#071122'; ctx.font = 'bold 10px "Cascadia Mono", "Consolas", "Microsoft YaHei UI", sans-serif'; ctx.fillText(st, bw / 2 - 2, -bh / 2 + 5.5);
        }
        ctx.restore();
      });

      // Smoothly gliding luminous Tick orb travelling along active edge!
      if (pulsePhase < hops.length) {
        const hItem = hops[curHopIdx];
        const a = map.get(hItem.from), b = map.get(hItem.to);
        const e = Ease.inOutCubic(hopFrac);
        const ox = (a.x + (b.x - a.x) * e) * w, oy = (a.y + (b.y - a.y) * e) * h;
        const orbCol = hItem.st ? stCol(hItem.st) : '#fde047';
        ctx.save();
        ctx.fillStyle = orbCol; ctx.shadowColor = orbCol; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox, oy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      drawBadge(ctx, 12, 8, `Tick 实时决策 | 当前结果: ${conds.lowHP && mode !== 'interrupt' ? '低血量逃跑' : (conds.seePlayer ? (conds.inRange ? '攻击玩家' : '追逐玩家') : (mode === 'interrupt' ? '条件失效 → 立即中断!' : '默认巡逻'))}`, 'rgba(12,22,44,0.92)', '#bae6fd');
    }

    return {
      render,
      setMode(m) { mode = m; pulsePhase = 0; renderSide(); },
      togglePlay() { playing = !playing; return playing; },
      reset() { pulsePhase = 0; },
      step() { playing = false; pulsePhase = Math.floor(pulsePhase) + 1; },
      setSpeed(s) { speed = s; }
    };
  }

  /* ========================================================================
     9. BOIDS FLOCKING ENGINE (Smooth Damped Turns, Undulating Tails, Wake Trails!)
     ======================================================================== */
  function createBoidsAnim(container, opts = {}) {
    let mode = opts.mode || 'cruise';
    let playing = true, speed = 1;
    const canvas = container.querySelector('canvas');
    const side = container.querySelector('.anim-side-panel');
    const narrator = container.querySelector('.anim-narrator');

    let weights = { sep: 1.5, ali: 1.3, coh: 1.2, rad: 68 };
    let boids = [];
    let dragMode = 'attract'; // 'attract' or 'repel'
    let pointer = { active: false, x: 0, y: 0, sx: 0, sy: 0, mode: 'attract', rip: 0 };

    function applyPreset(m) {
      mode = m;
      if (m === 'panic') { weights = { sep: 3.4, ali: 0.2, coh: 0.15, rad: 88 }; dragMode = 'repel'; }
      else if (m === 'align') { weights = { sep: 0.8, ali: 2.8, coh: 0.4, rad: 85 }; dragMode = 'attract'; }
      else { weights = { sep: 1.4, ali: 1.4, coh: 1.35, rad: 72 }; dragMode = 'attract'; }
      renderSide();
    }

    function initBoids(w = 620, h = 360) {
      boids = Array.from({ length: 36 }, () => {
        const a = Math.random() * Math.PI * 2;
        const x = 60 + Math.random() * (w - 120), y = 60 + Math.random() * (h - 120);
        return { x, y, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, ang: a, wag: Math.random() * 6, trail: [[x, y]], sepF: [0, 0], aliF: [0, 0], cohF: [0, 0] };
      });
    }
    initBoids();

    // Pointer / Mouse Drag interaction (Left drag = selected mode, Right drag = Repel!)
    canvas.style.touchAction = 'none';
    const getPos = e => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('pointerdown', e => {
      const pos = getPos(e);
      pointer.active = true;
      pointer.x = pointer.sx = pos.x;
      pointer.y = pointer.sy = pos.y;
      pointer.mode = e.button === 2 ? 'repel' : dragMode;
      pointer.rip = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    });
    canvas.addEventListener('pointermove', e => {
      if (!pointer.active) return;
      const pos = getPos(e);
      pointer.x = pos.x; pointer.y = pos.y;
    });
    const endDrag = () => { pointer.active = false; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    function renderSide() {
      if (narrator) narrator.textContent = '支持鼠标/触屏按住拖动鱼群！左键拖动引导(或驱散)，右键拖动直接触发天敌驱散波！';
      if (!side) return;
      side.innerHTML = `<h4>Boids 交互与权重调参</h4>
        <div class="hud-box">
          <div style="color:#7dd3fc;font-weight:700;margin-bottom:6px">鼠标按住拖动模式</div>
          <div style="display:flex;gap:6px">
            <button class="ctrl-btn boid-drag-btn ${dragMode === 'attract' ? 'primary' : ''}" data-dm="attract" style="flex:1;justify-content:center;font-size:11.5px;padding:5px">吸引聚群</button>
            <button class="ctrl-btn boid-drag-btn ${dragMode === 'repel' ? 'primary' : ''}" data-dm="repel" style="flex:1;justify-content:center;font-size:11.5px;padding:5px">天敌驱散</button>
          </div>
          <div style="font-size:10.5px;color:#94a3b8;margin-top:5px">在画布按住左键拖动即可引导/驱散鱼群，右键随时驱散！</div>
        </div>
        <div class="hud-box" style="display:flex;flex-direction:column;gap:8px">
          <div><div class="hud-row"><span>分离 Separation</span><span id="bv-sep">${weights.sep.toFixed(1)}</span></div>
          <input type="range" min="0" max="4" step="0.1" value="${weights.sep}" data-k="sep" class="boid-sl" style="width:100%;accent-color:#fb7185"></div>
          <div><div class="hud-row"><span>对齐 Alignment</span><span id="bv-ali">${weights.ali.toFixed(1)}</span></div>
          <input type="range" min="0" max="3.5" step="0.1" value="${weights.ali}" data-k="ali" class="boid-sl" style="width:100%;accent-color:#38bdf8"></div>
          <div><div class="hud-row"><span>聚集 Cohesion</span><span id="bv-coh">${weights.coh.toFixed(1)}</span></div>
          <input type="range" min="0" max="3.5" step="0.1" value="${weights.coh}" data-k="coh" class="boid-sl" style="width:100%;accent-color:#fde047"></div>
          <div><div class="hud-row"><span>感知半径</span><span id="bv-rad">${weights.rad}px</span></div>
          <input type="range" min="35" max="130" step="5" value="${weights.rad}" data-k="rad" class="boid-sl" style="width:100%;accent-color:#a78bfa"></div>
        </div>`;
      side.querySelectorAll('.boid-drag-btn').forEach(btn => {
        btn.onclick = () => { dragMode = btn.dataset.dm; renderSide(); };
      });
      side.querySelectorAll('.boid-sl').forEach(sl => {
        sl.oninput = () => {
          weights[sl.dataset.k] = Number(sl.value);
          const sp = side.querySelector(`#bv-${sl.dataset.k}`);
          if (sp) sp.textContent = sl.dataset.k === 'rad' ? sl.value + 'px' : Number(sl.value).toFixed(1);
        };
      });
    }
    applyPreset(mode);

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      drawGridBg(ctx, w, h);
      const stepDt = playing ? Math.min(dt, 0.04) * speed : 0;
      const maxSpd = pointer.active ? 175 : 132, sepDist = weights.rad * 0.48;

      if (pointer.active) {
        pointer.sx = Ease.expDamp(pointer.sx, pointer.x, 16, dt);
        pointer.sy = Ease.expDamp(pointer.sy, pointer.y, 16, dt);
        pointer.rip = (pointer.rip + dt * 1.4) % 1;
      }

      if (stepDt > 0) {
        for (let i = 0; i < boids.length; i++) {
          const b = boids[i];
          let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, cnt = 0, sepCnt = 0;
          for (let j = 0; j < boids.length; j++) {
            if (i === j) continue;
            const o = boids[j], dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy);
            if (d > 0 && d < weights.rad) {
              ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; cnt++;
              if (d < sepDist) { sx += (dx / d) * (sepDist - d); sy += (dy / d) * (sepDist - d); sepCnt++; }
            }
          }
          let fx = 0, fy = 0;
          b.sepF = [0, 0]; b.aliF = [0, 0]; b.cohF = [0, 0];
          if (sepCnt > 0) { b.sepF = [sx * 4.2, sy * 4.2]; fx += b.sepF[0] * weights.sep; fy += b.sepF[1] * weights.sep; }
          if (cnt > 0) {
            b.aliF = [(ax / cnt - b.vx) * 1.4, (ay / cnt - b.vy) * 1.4];
            b.cohF = [((cx / cnt) - b.x) * 1.8, ((cy / cnt) - b.y) * 1.8];
            fx += b.aliF[0] * weights.ali + b.cohF[0] * weights.coh;
            fy += b.aliF[1] * weights.ali + b.cohF[1] * weights.coh;
          }

          // Interactive mouse drag attraction or repulsion force!
          if (pointer.active) {
            const pdx = pointer.sx - b.x, pdy = pointer.sy - b.y;
            const pd = Math.hypot(pdx, pdy) || 1;
            if (pointer.mode === 'attract') {
              // Smooth swirl-attract force toward dragged cursor!
              const pull = Math.min(460, 140 + pd * 1.45);
              fx += (pdx / pd) * pull;
              fy += (pdy / pd) * pull;
            } else if (pd < 175) {
              // Non-linear quadratic shock repulsion when repelling!
              const rep = Math.pow(1 - pd / 175, 2) * 1450;
              fx -= (pdx / pd) * rep;
              fy -= (pdy / pd) * rep;
            }
          }

          const m = 44;
          if (b.x < m) fx += 260; if (b.x > w - m) fx -= 260;
          if (b.y < m) fy += 260; if (b.y > h - m) fy -= 260;

          b.vx += fx * stepDt; b.vy += fy * stepDt;
          const spd = Math.hypot(b.vx, b.vy) || 1;
          const clamped = Math.max(68, Math.min(maxSpd, spd));
          b.vx = (b.vx / spd) * clamped; b.vy = (b.vy / spd) * clamped;
          b.ang = Ease.dampAngle(b.ang, Math.atan2(b.vy, b.vx), 11, stepDt);
          b.wag += stepDt * (clamped * 0.13);
          b.x += b.vx * stepDt; b.y += b.vy * stepDt;
          b.trail.push([b.x, b.y]);
          if (b.trail.length > 16) b.trail.shift();
        }
      }

      // Draw luminous water ripple vortex when dragging!
      if (pointer.active) {
        const isRep = pointer.mode === 'repel';
        const rgb = isRep ? '251, 113, 133' : '56, 189, 248';
        [0, 0.5].forEach(off => {
          const u = Ease.outExpo((pointer.rip + off) % 1);
          const radR = isRep ? (14 + u * 135) : (120 * (1 - u) + 12);
          ctx.strokeStyle = `rgba(${rgb}, ${(1 - u) * 0.72})`; ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.arc(pointer.sx, pointer.sy, radR, 0, Math.PI * 2); ctx.stroke();
        });
        ctx.fillStyle = isRep ? '#fb7185' : '#fde047';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(pointer.sx, pointer.sy, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "Microsoft YaHei UI", sans-serif';
        ctx.fillText(isRep ? '天敌驱散中' : '鱼群跟随中', pointer.sx + 13, pointer.sy + 4);
      }

      if (boids.length) {
        const f0 = boids[0];
        const breathe = 1 + Math.sin(performance.now() / 420) * 0.04;
        ctx.save();
        ctx.fillStyle = 'rgba(56,189,248,0.08)';
        ctx.strokeStyle = 'rgba(56,189,248,0.45)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(f0.x, f0.y, weights.rad * breathe, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]);
        drawArrow(ctx, f0.x, f0.y, f0.x + f0.sepF[0] * 0.45, f0.y + f0.sepF[1] * 0.45, '#fb7185', 2.4);
        drawArrow(ctx, f0.x, f0.y, f0.x + f0.aliF[0] * 0.55, f0.y + f0.aliF[1] * 0.55, '#38bdf8', 2.4);
        drawArrow(ctx, f0.x, f0.y, f0.x + f0.cohF[0] * 0.55, f0.y + f0.cohF[1] * 0.55, '#fde047', 2.4);
        ctx.restore();
      }

      boids.forEach((b, i) => {
        drawTaperedTrail(ctx, b.trail, i === 0 ? '253, 224, 71' : '56, 189, 248', i === 0 ? 3.5 : 2.1);
        drawWhaleAgent(ctx, b.x, b.y, b.ang, i === 0 ? 11.5 : 7.5, i === 0 ? '#fde047' : '#38bdf8', b.wag);
      });

      drawBadge(ctx, 12, 10, '按住鼠标拖动吸引/驱散鱼群！领航金鲸展示：红=分离 | 蓝=对齐 | 黄=聚集', 'rgba(12,22,44,0.9)', '#bae6fd');
    }

    return {
      render,
      setMode(m) { applyPreset(m); },
      togglePlay() { playing = !playing; return playing; },
      reset() { initBoids(canvas.clientWidth || 620, canvas.clientHeight || 360); },
      step() { playing = false; render(0.06); },
      setSpeed(s) { speed = s; }
    };
  }

  /* ========================================================================
     GLOBAL LIFECYCLE MANAGER & SINGLE RAF LOOP
     ======================================================================== */
  const FACTORIES = {
    physics: createPhysicsAnim, steering: createSteeringAnim, pattern: createPatternAnim,
    basic_path: createBasicPathAnim, graph_search: createGraphSearchAnim, astar: createAStarAnim,
    fsm: createFSMAnim, bt: createBTAnim, boids: createBoidsAnim
  };

  let rafId = null, lastTs = 0;

  function tickLoop(ts) {
    const dt = lastTs ? Math.min(0.06, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts;
    activeInstances.forEach((inst, el) => {
      if (!document.body.contains(el)) { activeInstances.delete(el); return; }
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.bottom > -60 && rect.top < window.innerHeight + 60) {
        try { inst.render(dt); } catch (err) { console.error('Anim error:', err); }
      }
    });
    rafId = requestAnimationFrame(tickLoop);
  }

  function mount(container, engineName, opts = {}) {
    if (!container || !FACTORIES[engineName]) return null;
    if (activeInstances.has(container)) activeInstances.delete(container);
    const inst = FACTORIES[engineName](container, opts);
    activeInstances.set(container, inst);

    container.querySelectorAll('.anim-pill[data-mode]').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('.anim-pill[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        inst.setMode(btn.dataset.mode);
      };
    });
    const playBtn = container.querySelector('[data-act="play"]');
    if (playBtn) playBtn.onclick = () => {
      const p = inst.togglePlay();
      playBtn.textContent = p ? '暂停' : '播放';
    };
    const stepBtn = container.querySelector('[data-act="step"]');
    if (stepBtn) stepBtn.onclick = () => {
      inst.step();
      if (playBtn) playBtn.textContent = '播放';
    };
    const resetBtn = container.querySelector('[data-act="reset"]');
    if (resetBtn) resetBtn.onclick = () => inst.reset();
    const speedSl = container.querySelector('[data-act="speed"]');
    if (speedSl) speedSl.oninput = e => inst.setSpeed(Number(e.target.value));

    if (!rafId) rafId = requestAnimationFrame(tickLoop);
    inst.render(0.016);
    return inst;
  }

  global.AnimEngine = { mount, activeInstances };
})(window);
