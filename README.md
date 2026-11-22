# 《实时人工智能应用》期末冲刺复习与交互动画题库

纯静态单文件开源学习平台，覆盖 Unity 物理运动、追逐与拦截、模式移动、四大基本寻路、DFS / BFS / Dijkstra、A* 手算与优化、有限状态机 (FSM)、行为树 (BT) 与 Boids 群组行为，集成 **60fps 交互式动画**、**可编辑 Unity C# 沙盒**、**Draw.io 风格状态机/行为树与 A* 网格画板**、**全 92 题深度分步解析** 与 **智能代码/拓扑/等价路径判分引擎**。

## 在线访问（GitHub Pages）

- 电脑端 / 自动分流入口：https://zhangyuzhangyu233.github.io/realtime-ai-review/
- 手机专属交互版：https://zhangyuzhangyu233.github.io/realtime-ai-review/mobile.html

> 访问根路径时会自动识别移动设备并跳转 `mobile.html`；电脑端与手机端共用同一份 `localStorage` 刷题进度与错题本，随时互相切换。

## 仓库目录结构

- `src/`：核心前端源码（模块化原生 JS + CSS，无外部 CDN 依赖）
  - `knowledge.js`：6 大章节、16 个独立小节的知识点精讲
  - `questions.js`：83 道全题型题库（单选 36 + 判断 18 + 填空 10 + 综合大题 10 + 编程填空/手写 9）
  - `code_drills.js`：9 道实战 C# 手写编程训练与行内思路提示注释
  - `explanations_detail.js`：全 92 道题（83 题库 + 9 实战）的结构化深度分步解析（核心原理 / 逐步实现 / 考场避坑）
  - `pet_assistant.js`：基于开源桌宠 `dsh-pet` 动图素材封装的右下角上下文智能学习助手（可随知识讲解、随机刷题、手写代码、模拟考试、熟练度与错题本实时给出渐进式思路提醒）
  - `smart_grader.js`：灵活智能判分引擎（支持 C# 等价表达式/数值仿真、FSM/BT 拓扑同构、A* 多解与主观语义采分）
  - `diagram_board.js`：Draw.io 风格矢量画板（自由弯折箭头、节点内直编自动扩宽、双指缩放与路径网格画板）
  - `animations.js` & `csharp_demos.js`：9 大交互动画引擎与 18 个 C# 演示沙盒
  - `app.js` / `style.css`：桌面端应用逻辑与样式
  - `mobile_app.js` / `mobile.css`：手机专属底部导航、抽屉目录与全屏画板工作区
- `assets/`：伴学静态资源（`mascots_b64.json`）与 `assets/pet/` 透明动态大肥鱼素材（基于 [PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet) MIT 协议转换）
- `scripts/`：单文件离线打包与发布审计脚本
  - `bundle.py` -> 生成 `index.html`
  - `bundle_mobile.py` -> 生成 `mobile.html`
  - `audit_release.py` -> 静态安全与排版规范检查
- `tests/`：Node.js 自动化单元测试（C# 代码评分、画板拓扑/Dijkstra 等价判分、92 题分步解析与编程提示完整性校验）

## 本地构建与测试

在仓库根目录执行（需安装 Python 3 与 Node.js）：

```bash
python scripts/bundle.py
python scripts/bundle_mobile.py
python scripts/audit_release.py
node tests/test_smart_code_grader.js
node tests/test_diagram_grader.js
node tests/test_explanations.js
```
