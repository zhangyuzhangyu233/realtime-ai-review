import os, shutil, subprocess

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO_ROOT, "src")
ASSETS = os.path.join(REPO_ROOT, "assets")
OUT_HTML = os.path.join(REPO_ROOT, "mobile.html")
PARENT_OFFLINE = os.path.join(os.path.dirname(REPO_ROOT), "实时人工智能应用_手机专属版.html")

JS_FILES = [
    "code_drills.js",
    "smart_grader.js",
    "diagram_board.js",
    "csharp_demos.js",
    "animations.js",
    "knowledge.js",
    "questions.js",
    "explanations_detail.js",
    "mobile_app.js",
]

for jf in JS_FILES:
    p = os.path.join(SRC, jf)
    r = subprocess.run(["node", "--check", p], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Syntax error in {jf}:\n{r.stderr}")
    print(f"[OK] JS syntax check passed: {jf}")

with open(os.path.join(SRC, "mobile.css"), encoding="utf-8") as f:
    css = f.read()
with open(os.path.join(ASSETS, "mascots_b64.json"), encoding="utf-8") as f:
    mascots_json = f.read()

scripts_content = {}
for jf in JS_FILES:
    with open(os.path.join(SRC, jf), encoding="utf-8") as f:
        scripts_content[jf] = f.read()

html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#102a63">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>实时人工智能应用 · 手机专属复习版</title>
  <style>
{css}
  </style>
</head>
<body>
  <header class="m-topbar">
    <div class="m-topbar-inner">
      <div class="m-brand">
        <img id="m-brand-img" alt="大肥鱼伴学">
        <div class="m-brand-text">
          <div class="m-brand-title">实时 AI 复习与题库</div>
          <div class="m-brand-sub">手机专属交互版 · 92 题全库</div>
        </div>
      </div>
      <div class="m-top-actions">
        <button type="button" class="m-pill-btn" id="m-switch-pc">电脑版</button>
        <button type="button" class="m-pill-btn primary" id="m-theme-toggle">护眼</button>
      </div>
    </div>
  </header>

  <main class="m-shell">
    <section class="m-view active" id="m-view-knowledge"></section>
    <section class="m-view" id="m-view-practice"></section>
    <section class="m-view" id="m-view-mastery"></section>
    <section class="m-view" id="m-view-notebook"></section>
  </main>

  <nav class="m-tabbar" aria-label="手机端底部导航">
    <div class="m-tabbar-inner">
      <button type="button" class="m-tab-btn active" data-view="knowledge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        <span>知识</span>
      </button>
      <button type="button" class="m-tab-btn" data-view="practice">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <span class="m-tab-badge">∞</span>
        <span>刷题</span>
      </button>
      <button type="button" class="m-tab-btn" data-view="mastery">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span class="m-tab-badge" id="m-tab-pct">0%</span>
        <span>熟练度</span>
      </button>
      <button type="button" class="m-tab-btn" data-view="notebook">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
        <span class="m-tab-badge" id="m-tab-wrong">0</span>
        <span>错题</span>
      </button>
    </div>
  </nav>

  <!-- Slide-in Chapter/Sub-Section Drawer -->
  <div class="m-drawer-mask" id="m-drawer-mask" role="dialog" aria-modal="true" aria-label="16 小节目录">
    <aside class="m-drawer">
      <div class="m-drawer-head">
        <strong style="font-size:14.5px">6 章 · 16 独立小节目录</strong>
        <button type="button" class="m-pill-btn" id="m-drawer-close">关闭</button>
      </div>
      <div class="m-drawer-body" id="m-drawer-body"></div>
    </aside>
  </div>

  <!-- Bottom Sheet (速记知识卡 & 模拟卷答题卡) -->
  <div class="m-sheet-mask" id="m-sheet-mask" role="dialog" aria-modal="true">
    <div class="m-sheet">
      <div class="m-sheet-head">
        <strong id="m-sheet-title" style="font-size:14px">详情</strong>
        <button type="button" class="m-pill-btn" id="m-sheet-close">收起</button>
      </div>
      <div class="m-sheet-body" id="m-sheet-body"></div>
    </div>
  </div>

  <!-- Fullscreen Studio Lightbox (Interactive Diagram Board + Animations) -->
  <div class="lightbox-overlay" id="anim-lightbox" role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
    <div class="lightbox-dialog">
      <div class="lightbox-header">
        <div class="anim-lab-title"><span class="live-dot"></span><span id="lightbox-title">全屏工作区</span></div>
        <button type="button" class="lightbox-close-btn" id="lightbox-close" title="关闭">×</button>
      </div>
      <div class="lightbox-body" id="lightbox-body"></div>
    </div>
  </div>

  <canvas id="fx-fireworks-canvas" aria-hidden="true"></canvas>

  <script>
window.MASCOT_SPRITES = {mascots_json};
  </script>
  <script>
{scripts_content["code_drills.js"]}
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
{scripts_content["mobile_app.js"]}
  </script>
</body>
</html>
"""

with open(OUT_HTML, "w", encoding="utf-8") as f:
    f.write(html)

size_kb = os.path.getsize(OUT_HTML) / 1024
print(f"[SUCCESS] Built Mobile HTML: {OUT_HTML} ({size_kb:.1f} KB)")

if os.path.isdir(os.path.dirname(PARENT_OFFLINE)):
    shutil.copy2(OUT_HTML, PARENT_OFFLINE)
    print(f"[SYNC] Updated offline Mobile HTML: {PARENT_OFFLINE}")
