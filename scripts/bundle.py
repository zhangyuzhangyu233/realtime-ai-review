import os, shutil, subprocess

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO_ROOT, "src")
ASSETS = os.path.join(REPO_ROOT, "assets")
OUT_HTML = os.path.join(REPO_ROOT, "index.html")
PARENT_OFFLINE = os.path.join(os.path.dirname(REPO_ROOT), "实时人工智能应用_期末复习与题库.html")

JS_FILES = [
    "code_drills.js",
    "code_intellisense.js",
    "smart_grader.js",
    "diagram_board.js",
    "csharp_demos.js",
    "animations.js",
    "knowledge.js",
    "questions.js",
    "explanations_detail.js",
    "pet_assistant.js",
    "app.js",
]

for jf in JS_FILES:
    p = os.path.join(SRC, jf)
    r = subprocess.run(["node", "--check", p], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Syntax error in {jf}:\n{r.stderr}")
    print(f"[OK] JS syntax check passed: {jf}")

with open(os.path.join(SRC, "style.css"), encoding="utf-8") as f:
    css = f.read()
with open(os.path.join(ASSETS, "mascots_b64.json"), encoding="utf-8") as f:
    mascots_json = f.read()
with open(os.path.join(ASSETS, "pet", "fallback_b64.json"), encoding="utf-8") as f:
    pet_fallback_json = f.read()

scripts_content = {}
for jf in JS_FILES:
    with open(os.path.join(SRC, jf), encoding="utf-8") as f:
        scripts_content[jf] = f.read()

html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#102a63">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>实时人工智能应用 · 期末冲刺复习与交互动画题库</title>
  <script>
  (function(){{
    if (location.protocol === 'file:') return;
    var q = location.search || '';
    if (q.indexOf('view=pc') !== -1) {{ try {{ sessionStorage.setItem('prefer_pc', '1'); }} catch (e) {{}} return; }}
    if (q.indexOf('view=mobile') !== -1) {{ location.replace('mobile.html'); return; }}
    try {{ if (sessionStorage.getItem('prefer_pc') === '1') return; }} catch (e) {{}}
    var isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent || '') || (window.innerWidth <= 760 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    if (isMob) location.replace('mobile.html');
  }})();
  </script>
  <style>
{css}
  </style>
</head>
<body>
  <div class="ocean-particles" aria-hidden="true"></div>

  <!-- Top Sticky Navigation (Zero-Emoji Minimalist Layout) -->
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand" id="brand-home">
        <div class="brand-avatar"><img id="brand-mascot-img" alt="蓝色大肥鱼"></div>
        <div>
          <div class="brand-title">实时人工智能应用 · 期末复习与题库</div>
          <div class="brand-sub">精细详解 · 可运行 C# 沙盒 · 非线性交互动画 · 熟练度追踪</div>
        </div>
      </div>

      <nav class="nav-tabs" aria-label="主导航">
        <button class="nav-tab active" data-view="knowledge">知识要点 &amp; 动画</button>
        <button class="nav-tab" data-view="mastery">知识熟练度 <span class="nav-badge" id="nav-mastery-pct">0%</span></button>
        <button class="nav-tab" data-view="practice">练习模式 <span class="nav-badge" id="nav-q-count">∞</span></button>
        <button class="nav-tab" data-view="notebook">错题 &amp; 收藏 <span class="nav-badge" id="nav-wrong-count">0</span></button>
      </nav>

      <div class="top-actions">
        <button class="icon-btn" id="go-mobile-ver" onclick="try{{sessionStorage.removeItem('prefer_pc');}}catch(e){{}}location.href=location.protocol==='file:'?'./实时人工智能应用_手机专属版.html':'mobile.html';">手机版</button>
        <button class="icon-btn" id="theme-toggle">深海护眼</button>
      </div>
    </div>
  </header>

  <main class="app-shell">
    <!-- ==================== VIEW 1: KNOWLEDGE REVIEW & ANIMATION LAB ==================== -->
    <section class="view-section active" id="view-knowledge">
      <div class="hero-card">
        <div style="position:relative;z-index:2">
          <div class="hero-eyebrow">紧扣《知识要点-考试题型.pptx》与 17 讲全套课件</div>
          <h1 class="hero-title">精细详解 + 可运行 C# 示例代码 +<br>点击即全屏放大的 60fps 非线性动画</h1>
          <p class="hero-desc">覆盖物理学、Unity 核心、追逐拦截、模式移动、四大基本寻路、DFS / BFS / Dijkstra、A* 手算与七大优化、有限状态机 (FSM)、行为树 (BT) 与 Boids 群组行为。共拆分为 16 个独立小节页面，每小节均配备「精细详解 → 专属 C# 沙盒 → 专属交互动画」三步闭环学习。</p>
          <div class="exam-blueprint">
            <span class="bp-chip">一、单选 <strong>15×2=30分</strong></span>
            <span class="bp-chip">二、填空 <strong>5×2=10分</strong></span>
            <span class="bp-chip">三、判断 <strong>5×2=10分</strong></span>
            <span class="bp-chip">四、按要求作答 <strong>3题30分</strong></span>
            <span class="bp-chip">五、编程题 <strong>2题20分</strong></span>
          </div>
          <div class="hero-cta-row">
            <button class="btn-primary" id="cta-start-learn">开始精细详解复习</button>
            <button class="btn-ghost-light" id="cta-start-mastery">查看知识熟练度卡片</button>
            <button class="btn-ghost-light" id="cta-start-practice">进入练习模式</button>
          </div>
        </div>
        <div class="hero-mascot-box">
          <div class="hero-speech" id="hero-speech">点我切换考前必背口诀，点击任意动画画面可弹出全屏放大预览。</div>
          <img class="hero-mascot-img" id="hero-mascot-img" alt="蓝色大肥鱼元气加油">
        </div>
      </div>

      <!-- Crisp Typographic Stats Strip -->
      <div class="stat-strip">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--primary-soft);color:var(--primary)">60Hz</div>
          <div><div class="stat-val">9 大引擎</div><div class="stat-lbl">非线性交互动画 · 点击放大</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--accent-soft);color:var(--accent)">C#</div>
          <div><div class="stat-val">18 个沙盒</div><div class="stat-lbl">16 小节与解析均可点击运行</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--gold-soft);color:var(--gold)">∞题</div>
          <div><div class="stat-val" id="stat-done">0 / 92</div><div class="stat-lbl">已掌握基础题 · 无限随机刷</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--success-soft);color:var(--success)">MAX</div>
          <div><div class="stat-val" id="stat-acc">0%</div><div class="stat-lbl">课程综合知识熟练度</div></div>
        </div>
      </div>

      <!-- 10-Variant Blue Whale-Fish Companion Strip -->
      <div class="kp-card" style="margin-bottom:26px;padding:16px 22px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">
          <strong style="font-size:14px;color:var(--text)">蓝色大肥鱼伴学图鉴（10 款专属差分全解锁 · 点击换装并切换考前必背口诀）</strong>
          <span style="font-size:12px;color:var(--text-muted)">刷题、运行代码、切换暗夜模式与查看熟练度时她都会实时切换差分陪你复习</span>
        </div>
        <div id="mascot-gallery-strip" style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px"></div>
      </div>

      <div class="knowledge-layout" id="knowledge-anchor">
        <aside class="toc-sidebar">
          <div class="toc-header">
            <img id="toc-mascot-img" alt="讲课大肥鱼">
            <div>
              <h3>知识要点目录</h3>
              <p>6 大章节 · 16 个独立小节</p>
            </div>
            <button type="button" class="toc-mobile-toggle" id="toc-mobile-toggle" aria-expanded="false">展开目录</button>
          </div>
          <div id="toc-list"></div>
        </aside>
        <div id="module-panels"></div>
      </div>
    </section>

    <!-- ==================== VIEW 2: KNOWLEDGE MASTERY (3D PARALLAX GLASS CARDS) ==================== -->
    <section class="view-section" id="view-mastery">
      <div id="mastery-host"></div>
    </section>

    <!-- ==================== VIEW 3: UNIFIED PRACTICE MODE (无限随机刷题·含编程实战 + 100分全真模拟测试) ==================== -->
    <section class="view-section" id="view-practice">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:18px">
        <div class="practice-mode-bar" style="margin-bottom:0">
          <span class="pm-dock-status"><span class="aero-led"></span>练习模式</span>
          <button class="pm-tab active" data-psub="bank">随机刷题练习（无限 · 含编程）</button>
          <button class="pm-tab" data-psub="mock">100 分全真模拟测试</button>
        </div>
        <span style="font-size:12.5px;color:var(--text-muted);font-weight:600">题目不限量随机抽取（含全部单选/判断/填空/简答/C#编程） · 选定锁定 · 答对绽放礼花</span>
      </div>

      <!-- Sub-pane A: Unlimited Adaptive Random Practice (All Types + Coding Drills) + 3D Flip Summary Card -->
      <div id="practice-pane-bank">
        <div id="bank-q-list"></div>
      </div>

      <!-- Sub-pane B: 100-Point Timed Mock Exam (Paged) -->
      <div id="practice-pane-mock" style="display:none">
        <div id="mock-exam-host"></div>
      </div>
    </section>

    <!-- ==================== VIEW 4: MISTAKE BOOK & FAVORITES ==================== -->
    <section class="view-section" id="view-notebook">
      <div id="notebook-host"></div>
    </section>
  </main>

  <!-- Photo-Style Dimmed & Blurred Lightbox Modal for Animation Zoom -->
  <div class="lightbox-overlay" id="anim-lightbox" role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
    <div class="lightbox-dialog">
      <div class="lightbox-header">
        <div class="anim-lab-title"><span class="live-dot"></span><span id="lightbox-title">动画全屏放大预览</span></div>
        <button class="lightbox-close-btn" id="lightbox-close" title="退出放大 (ESC)">×</button>
      </div>
      <div class="lightbox-body" id="lightbox-body"></div>
    </div>
  </div>

  <!-- Fullscreen Celebration Fireworks Canvas -->
  <canvas id="fx-fireworks-canvas" aria-hidden="true"></canvas>

  <!-- Floating Context-Aware Animated dsh-pet Study Companion -->
  <div class="dsh-pet-dock" id="dsh-pet-dock" aria-live="polite"></div>

  <script>
window.MASCOT_SPRITES = {mascots_json};
window.DSH_PET_FALLBACK = {pet_fallback_json};
  </script>
  <script>
{scripts_content["code_drills.js"]}
  </script>
  <script>
{scripts_content["code_intellisense.js"]}
  </script>
  <script>
{scripts_content["smart_grader.js"]}
  </script>
  <script>
{scripts_content["diagram_board.js"]}
  </script>
  <script>
{scripts_content["csharp_demos.js"]}
  </script>
  <script>
{scripts_content["animations.js"]}
  </script>
  <script>
{scripts_content["knowledge.js"]}
  </script>
  <script>
{scripts_content["questions.js"]}
  </script>
  <script>
{scripts_content["explanations_detail.js"]}
  </script>
  <script>
{scripts_content["pet_assistant.js"]}
  </script>
  <script>
{scripts_content["app.js"]}
  </script>
</body>
</html>
"""

with open(OUT_HTML, "w", encoding="utf-8") as f:
    f.write(html)

size_kb = os.path.getsize(OUT_HTML) / 1024
print(f"[SUCCESS] Built PC HTML: {OUT_HTML} ({size_kb:.1f} KB)")

if os.path.isdir(os.path.dirname(PARENT_OFFLINE)):
    shutil.copy2(OUT_HTML, PARENT_OFFLINE)
    print(f"[SYNC] Updated offline PC HTML: {PARENT_OFFLINE}")
