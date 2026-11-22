/* ==========================================================================
   Context-Aware Animated Study Assistant Powered by dsh-pet (MIT Assets)
   - Transparent animated WebP + static RGBA offline PNG fallback
   - Q-bounce bottom-anchored elastic squash, pointer drag & edge clamping
   - Context-aware progressive hints (Knowledge / Practice / Coding / Mock / Mastery / Notebook)
   ========================================================================== */
(function (global) {
  'use strict';

  const CLIP_MAP = {
    idle: 'idle',
    cheer: 'wave',
    wave: 'wave',
    think: 'think',
    exam: 'deep_think',
    deep_think: 'deep_think',
    code: 'code',
    teach: 'notes',
    notes: 'notes',
    happy: 'happy',
    trophy: 'celebrate',
    celebrate: 'celebrate',
    oops: 'oops',
    sleepy: 'sleep',
    sleep: 'sleep',
    search: 'search'
  };

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function trimText(s, maxLen = 118) {
    const clean = String(s || '').replace(/\s+/g, ' ').trim();
    if (!clean || clean.length <= maxLen) return clean;
    return clean.slice(0, maxLen - 1).replace(/[，、；：,\s]+$/, '') + '…';
  }

  // Sanitize pre-answer explanations so hints guide thinking without directly spoiling options/verdicts
  function sanitizeNonSpoiler(raw, q) {
    let s = String(raw || '').replace(/\s+/g, ' ').trim();
    // Remove direct option letter conclusions & TF verdicts
    s = s.replace(/[，,；;。]?\s*(?:因此|所以|故|从而)?\s*(?:对应|选定|选择|答案|锁定|可排除[^，。]*选)?(?:选项)?\s*[ABCD](?:\s*[（(][^）)]*[）)])?\s*[。！!]*$/g, '。');
    s = s.replace(/(?:因此|所以|故|只有|只有选项)?\s*[ABCD]\s*(?:选项)?(?:正确|错误|描述不准确|符合题意|完全匹配)/g, '该方向');
    s = s.replace(/[，,；;。]?\s*(?:因此|所以|故)?\s*判(?:定|别)?为?\s*【?\s*(?:对|错|正确|错误)\s*】?\s*[。！!]*$/g, '。');
    s = s.replace(/【\s*(?:对|错)\s*】/g, '【对应正误】');

    if (q) {
      if (q.type === 'single' && Array.isArray(q.options)) {
        const ansOpt = String(q.options[q.answer] || '').trim();
        if (ansOpt && ansOpt.length >= 2 && ansOpt.length <= 24) {
          const escaped = ansOpt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          s = s.replace(new RegExp('(?:为|是|等于|对应|选|得)\\s*' + escaped, 'g'), '（待你代入验证）');
        }
      }
      if (q.blanks && Array.isArray(q.blanks)) {
        q.blanks.forEach((b, idx) => {
          const a0 = String((b.answers && b.answers[0]) || '').trim();
          if (a0 && a0.length >= 3) {
            const escaped = a0.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            s = s.replace(new RegExp(escaped, 'gi'), `[空${idx + 1}目标]`);
          }
        });
      }
    }
    return s.replace(/。\s*。+/g, '。').trim();
  }

  function extractFirstSentence(text, maxLen = 108) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    const idx = clean.search(/[。！？!]/);
    const first = idx > 14 ? clean.slice(0, idx + 1) : clean;
    return trimText(first, maxLen);
  }

  function buildContextKey(ctx) {
    if (!ctx) return 'none';
    const view = ctx.view || 'knowledge';
    if (view === 'knowledge') return `k:${ctx.activeSection || ''}`;
    if (view === 'practice') {
      if (ctx.practiceSub === 'mock' && ctx.mockQuestion) {
        return `m:${ctx.mockQuestion.id}:${ctx.mockSubmitted ? '1' : '0'}`;
      }
      const p = ctx.practiceItem;
      if (p) {
        return `p:${p.uid || p.refId}:${p.answered ? '1' : '0'}:${p.correct ? 'ok' : 'bad'}`;
      }
      return 'p:idle';
    }
    return `v:${view}`;
  }

  function buildBoardReminder(q) {
    if (!q || !q.board) return '';
    if (q.board.kind === 'fsm') {
      return '画板提示：先拖出所有状态圆圈，选中初始状态点击「设为初始态」标出 ●→ 入口，再用连线箭头标注触发事件（双击文字可改名）。';
    }
    if (q.board.kind === 'bt') {
      if (q.id === 'e7') {
        return '画板提示：只用 Sequence 无法打断正在执行的 Running 动作！试着放 Parallel (⇉) 并发两路：左路 Decorator(Until Failure) 监控「看到玩家？」，右路 Sequence(移动→攻击)。';
      }
      return '画板提示：顶层先放 Selector (?)，子节点按从左到右优先级排序（保命 → 战斗 → 巡逻），用线段自上而下连接各层节点。';
    }
    if (q.board.kind === 'pathgrid') {
      return '画板提示：用「描绘路径」从起点一路拖向终点；注意本题是否禁止斜穿障碍物角点（Corner Cut），直走 +10、斜走 +14，算清两条绕行路线的总代价再作答。';
    }
    return '';
  }

  function getContextAdvice(ctx, stepIdx = 0) {
    const details = global.EXPLAIN_DETAILS || {};
    const summaries = (ctx && ctx.topicSummaries) || {};
    const view = (ctx && ctx.view) || 'knowledge';

    /* -------------------- 1. KNOWLEDGE REVIEW VIEW -------------------- */
    if (view === 'knowledge') {
      const sec = ctx.activeSectionObj || null;
      const sum = summaries[ctx.activeSection] || null;
      const pct = typeof ctx.activeSectionPct === 'number' ? ctx.activeSectionPct : 0;
      const secTitle = sec ? sec.short : '当前小节';

      const tips = [
        {
          mood: 'notes',
          tag: '本节精要 1/3',
          text: `${secTitle}：${(sec && sec.tip) || ''}${sum && sum.formula ? ` 核心公式：${trimText(sum.formula, 64)}` : ''}`
        },
        {
          mood: 'think',
          tag: '高频避坑 2/3',
          text: sum && sum.trap
            ? `${secTitle}避坑提醒：${trimText(sum.trap, 110)}`
            : `学习 ${secTitle} 时，建议先看懂 C# 沙盒里的核心参数，再点击动画画面放大观察每帧变化。`
        },
        {
          mood: 'search',
          tag: '复习建议 3/3',
          text: pct < 80
            ? `${secTitle}当前熟练度 ${pct}%，建议先点「本节刷题」巩固一下，遇到动画可以点击放大拖动参数！`
            : `${secTitle}熟练度已达 ${pct}%！点击下方目录切换到下一小节，或运行一次 C# 沙盒加深代码印象。`
        }
      ];
      return tips[stepIdx % tips.length];
    }

    /* -------------------- 2. MASTERY DIAGNOSTICS VIEW -------------------- */
    if (view === 'mastery') {
      const m = ctx.masterySummary || {};
      const overall = typeof m.overall === 'number' ? m.overall : 0;
      const weak = Array.isArray(m.weakest) ? m.weakest : [];
      if (weak.length && overall < 90) {
        const w1 = weak[0];
        const w2 = weak[1];
        const tips = [
          {
            mood: 'search',
            tag: '薄弱项雷达 1/2',
            text: `当前课程综合熟练度 ${overall}%。最需要优先补强的是「${w1.name}」（${w1.pct}%）${w2 ? `和「${w2.name}」（${w2.pct}%）` : ''}，点对应卡片即可直达专项刷题！`
          },
          {
            mood: 'notes',
            tag: '提分策略 2/2',
            text: `熟练度由「小节打卡 + 沙盒运行 + 刷题正确率」共同计算。如果时间紧，优先刷第 3~5 章的 A* 手算与 FSM/BT 大题提分最快！`
          }
        ];
        return tips[stepIdx % tips.length];
      }
      return {
        mood: 'celebrate',
        tag: '考前状态佳',
        text: `综合熟练度已达 ${overall}%！建议抽空挑战一次「100 分全真模拟测试」，检验整套试卷 90 分钟内的节奏与手感。`
      };
    }

    /* -------------------- 3. MISTAKE NOTEBOOK & FAVORITES -------------------- */
    if (view === 'notebook') {
      const nb = ctx.notebookSummary || {};
      const wrongCnt = nb.wrongCount || 0;
      const favCnt = nb.favCount || 0;
      if (wrongCnt > 0) {
        const topName = nb.topWrongTopicName || '重点难点';
        const tips = [
          {
            mood: 'oops',
            tag: '错题攻坚 1/2',
            text: `错题本还有 ${wrongCnt} 道题待消灭，其中「${topName}」错得最多。先点开解析里的「为什么这么做」与「考场避坑」，再重做答对即可自动移出！`
          },
          {
            mood: 'think',
            tag: '复习技巧 2/2',
            text: `已收藏 ${favCnt} 道重点题。考前把错题本清零 + 重点再敲一遍 C# 编程题的 // 提示骨架，上考场基本稳稳拿捏！`
          }
        ];
        return tips[stepIdx % tips.length];
      }
      return {
        mood: 'celebrate',
        tag: '零错题达成',
        text: `太棒了，错题本目前清零！收藏夹里有 ${favCnt} 道重点题，可以去「练习模式」抽几道编程题或模拟卷保持手感。`
      };
    }

    /* -------------------- 4. PRACTICE -> MOCK EXAM VIEW -------------------- */
    if (view === 'practice' && ctx.practiceSub === 'mock') {
      const mq = ctx.mockQuestion;
      const curIdx = (ctx.mockIndex || 0) + 1;
      const total = ctx.mockTotal || 30;
      const done = ctx.mockDoneCount || 0;
      const remain = ctx.mockRemainText || '';
      const sum = mq ? summaries[mq.topic] : null;
      const det = mq ? details[mq.id] : null;

      if (ctx.mockSubmitted) {
        return {
          mood: (ctx.mockScorePct || 0) >= 80 ? 'celebrate' : 'notes',
          tag: '模考复盘',
          text: det
            ? `已交卷！第 ${curIdx} 题考场避坑：${trimText(det.pitfall, 108)} 展开上方解析可看详细分步推导与智能采分报告。`
            : `已交卷！点顶部答题卡红色编号即可逐题定位错题，对照步骤解析查漏补缺。`
        };
      }

      const tips = [
        {
          mood: 'deep_think',
          tag: `考场助教 ${curIdx}/${total}`,
          text: `模拟考试中保持节奏：已作答 ${done}/${total} 题${remain ? `，剩余时间 ${remain}` : ''}。先稳拿客观题分，简答画板题注意先标核心要素再展开细节！`
        },
        {
          mood: 'think',
          tag: '考点公式速递',
          text: sum
            ? `第 ${curIdx} 题属于「${sum.formula ? trimText(sum.formula, 58) : '核心考点'}」。提醒：${trimText(sum.trap || '先看清题干条件与坐标系定义再下笔。', 76)}`
            : `做题前先确认题干里的已知量、单位和坐标轴方向，写完记得再核对一遍正负号。`
        }
      ];
      return tips[stepIdx % tips.length];
    }

    /* -------------------- 5. PRACTICE -> RANDOM BANK & CODING DRILLS -------------------- */
    if (view === 'practice' && ctx.practiceItem) {
      const item = ctx.practiceItem;

      // 5A. Hands-on C# coding drill (d1..d9)
      if (item.kind === 'drill' && item.drill) {
        const d = item.drill;
        const det = details[d.id];
        if (item.answered) {
          const ev = item.evalReport;
          if (item.correct) {
            return {
              mood: 'celebrate',
              tag: '编码通关',
              text: `干得漂亮，${d.file} 已顺利通过（${ev ? ev.score + '%' : '达标'}）！记住工程坑：${trimText((det && det.pitfall) || d.hint, 88)}`
            };
          }
          const missed = ev && Array.isArray(ev.checks) ? ev.checks.find(c => !c.ok) : null;
          return {
            mood: 'oops',
            tag: '调试定位',
            text: missed
              ? `差一点点！未通过项「${trimText(missed.label, 34)}」→ 建议：${trimText(missed.hint || (det && det.pitfall) || d.hint, 84)}`
              : `暂未达标，对照下方「智能代码诊断清单」补全缺失逻辑即可，实在卡住可点「直接展开详细解析」！`
          };
        }

        const chkStr = Array.isArray(d.checks) && d.checks.length
          ? d.checks.slice(0, 3).map(c => trimText(c.label, 22)).join('；')
          : '';
        const tips = [
          {
            mood: 'code',
            tag: '写码思路 1/3',
            text: `${det ? trimText(det.why, 108) : trimText(d.desc, 100)} 先看编辑区每条 // TODO (提示) 注释！`
          },
          {
            mood: 'think',
            tag: '得分检查点 2/3',
            text: chkStr
              ? `提交后会检测这些核心逻辑：${chkStr}…（支持变量改名与等价 C# 写法，不用死背变量名！）`
              : `思路提示：${trimText(d.hint, 108)}`
          },
          {
            mood: 'search',
            tag: '防写错提醒 3/3',
            text: `${det ? trimText(det.pitfall, 108) : trimText(d.hint, 100)} 若需要完整示范可点「直接展开详细解析」。`
          }
        ];
        return tips[stepIdx % tips.length];
      }

      // 5B. Bank Question (s*, tf*, f*, e*, c*)
      if (item.kind === 'question' && item.question) {
        const q = item.question;
        const det = details[q.id];
        const sum = summaries[q.topic];

        if (item.answered) {
          if (item.correct) {
            return {
              mood: 'happy',
              tag: '巩固一下',
              text: det && det.pitfall
                ? `答对啦！再顺手记牢这个坑：${trimText(det.pitfall, 102)}`
                : `回答正确！对应小节熟练度已提升，继续点「下一题」保持连胜吧！`
            };
          }
          return {
            mood: 'oops',
            tag: '复盘纠错',
            text: det && det.pitfall
              ? `别灰心，本题易错点：${trimText(det.pitfall, 108)} 下方「深度分步解析」已拆解每一步怎么推！`
              : `本题已收入错题本，先看解析里的核心推导步骤与动画演示再进下一题！`
          };
        }

        // Pre-answer progressive non-spoiler hints tailored by question type
        if (q.type === 'code' && q.subkind === 'fill') {
          const tips = [
            {
              mood: 'code',
              tag: '代码填空 1/3',
              text: `${det ? sanitizeNonSpoiler(extractFirstSentence(det.why, 96), q) : ''} 先读代码模板里每个空前面的 // 提示N 注释再作答！`
            },
            {
              mood: 'think',
              tag: '算法拆解 2/3',
              text: `${det && det.steps && det.steps[0] ? sanitizeNonSpoiler(extractFirstSentence(det.steps[0], 100), q) : (sum ? sum.formula : '')} 系统支持等价表达式与末尾省略分号。`
            },
            {
              mood: 'search',
              tag: '常见漏点 3/3',
              text: det && det.pitfall ? sanitizeNonSpoiler(trimText(det.pitfall, 114), q) : '填完检查正负号、括号匹配及变量大小写。'
            }
          ];
          return tips[stepIdx % tips.length];
        }

        if (q.type === 'code' && q.subkind === 'write') {
          const tips = [
            {
              mood: 'code',
              tag: '手写思路 1/3',
              text: `编辑区已经为你准备好了带 // 提示1~N 的骨架！核心目标：${det ? extractFirstSentence(det.why, 96) : '按注释步骤逐段补齐关键逻辑。'}`
            },
            {
              mood: 'think',
              tag: '采分核心 2/3',
              text: q.rubric && q.rubric.length
                ? `判分看重这几步：${trimText(q.rubric.slice(0, 2).join('；'), 108)}（支持等价写法）`
                : `关键公式：${sum ? trimText(sum.formula, 90) : '注意方法签名与执行先后顺序。'}`
            },
            {
              mood: 'search',
              tag: '编码避坑 3/3',
              text: det && det.pitfall ? trimText(det.pitfall, 112) : '注意空指针保护与状态切换先后顺序。'
            }
          ];
          return tips[stepIdx % tips.length];
        }

        if (q.board) {
          const bHint = buildBoardReminder(q);
          const tips = [
            {
              mood: 'think',
              tag: '画图切入点 1/3',
              text: bHint || (det ? extractFirstSentence(det.why, 108) : '先看清画板说明与左侧工具栏按钮，再补充文字要点。')
            },
            {
              mood: 'notes',
              tag: '关键规则 2/3',
              text: det && det.steps && det.steps[0]
                ? extractFirstSentence(det.steps[0], 112)
                : (q.rubric ? trimText(q.rubric[0], 112) : '按步骤依次补全节点、方向边或最优路径。')
            },
            {
              mood: 'search',
              tag: '大题避坑 3/3',
              text: det && det.pitfall ? trimText(det.pitfall, 112) : '提交前对照采分点检查是否有状态、初始态或事件漏连。'
            }
          ];
          return tips[stepIdx % tips.length];
        }

        // Single / TF / Fill / Essay (without graded board)
        const whyHint = det && det.why
          ? sanitizeNonSpoiler(extractFirstSentence(det.why, 106), q)
          : (sum ? trimText(sum.formula, 100) : '仔细审题，先从核心概念和已知条件入手。');
        const stepHint = det && det.steps && det.steps[0]
          ? sanitizeNonSpoiler(extractFirstSentence(det.steps[0], 98), q) + (sum && sum.formula ? `（口诀/公式：${trimText(sum.formula, 44)}）` : '')
          : (sum ? `核心参考：${trimText(sum.formula, 96)}` : '列出已知量与目标量逐步推演。');
        const trapHint = det && det.pitfall
          ? sanitizeNonSpoiler(trimText(det.pitfall, 112), q)
          : (sum && sum.trap ? sanitizeNonSpoiler(trimText(sum.trap, 112), q) : '拿不准的话，先点右侧「速记卡」或直接点「展开解析与动画」看看演示！');

        const tips = [
          { mood: 'think', tag: '解题思路 1/3', text: whyHint },
          { mood: 'notes', tag: '起步推导 2/3', text: stepHint },
          { mood: 'search', tag: '防踩坑提醒 3/3', text: trapHint }
        ];
        return tips[stepIdx % tips.length];
      }
    }

    return {
      mood: 'wave',
      tag: '大肥鱼助手',
      text: '点我可以获取当前页面或当前题目的专属思路提醒；按住我还可以把我拖到不挡视线的位置哦！'
    };
  }

  /* -------------------- Floating Widget Controller -------------------- */
  let hostEl = null;
  let stageEl = null;
  let imgEl = null;
  let bubbleEl = null;
  let tagEl = null;
  let textEl = null;
  let hintFootEl = null;
  let opts = {};
  let currentClip = 'idle';
  let revertTimer = null;
  let hideBubbleTimer = null;
  let squashFrame = null;
  let squashToken = 0;
  let stepIndex = 0;
  let lastCtxKey = '';
  let lastReactAt = 0;
  let offsetX = 0;
  let offsetY = 0;
  let collapsed = false;

  function resolveClipUrls(clipKey) {
    const key = CLIP_MAP[clipKey] || 'idle';
    const fb = global.DSH_PET_FALLBACK || '';
    const urls = [
      `./assets/pet/${key}.webp`,
      `./realtime-ai-review/assets/pet/${key}.webp`
    ];
    if (fb) urls.push(fb);
    return { key, urls };
  }

  function applyImageClip(clipKey) {
    if (!imgEl) return;
    const { key, urls } = resolveClipUrls(clipKey);
    if (imgEl.dataset.clip === key && imgEl.dataset.loaded === '1') return;
    currentClip = key;
    imgEl.dataset.clip = key;
    imgEl.dataset.loaded = '0';
    let idx = 0;
    imgEl.onerror = () => {
      idx += 1;
      if (idx < urls.length) {
        imgEl.src = urls[idx];
      }
    };
    imgEl.onload = () => {
      imgEl.dataset.loaded = '1';
    };
    imgEl.src = urls[0];
  }

  function getBaselineClip() {
    const ctx = opts.getContext ? opts.getContext() : null;
    const isDark = typeof opts.isDark === 'function' ? opts.isDark() : false;
    if (ctx && ctx.view === 'practice') {
      const p = ctx.practiceItem;
      if (ctx.practiceSub !== 'mock' && p && (p.isCoding || p.kind === 'drill')) return 'code';
      if (ctx.practiceSub === 'mock' && ctx.mockQuestion && ctx.mockQuestion.type === 'code') return 'code';
    }
    if (isDark) return 'sleep';
    return 'idle';
  }

  function triggerSquash(depth = 0.14) {
    if (!imgEl || !global.matchMedia) return;
    if (global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    squashToken += 1;
    const tok = squashToken;
    if (squashFrame !== null) cancelAnimationFrame(squashFrame);
    imgEl.style.transformOrigin = '50% 94%';
    const t0 = performance.now();
    const DUR = 360;
    const step = () => {
      if (tok !== squashToken) return;
      const u = Math.min((performance.now() - t0) / DUR, 1);
      // Elastic compress -> rebound curve inspired by dsh-pet squashScale
      const sy = u < 1 ? 1 - depth * Math.sin(u * Math.PI * 2.2) * (1 - u) : 1;
      const sx = u < 1 ? 1 + (depth * 0.55) * Math.sin(u * Math.PI * 2.2) * (1 - u) : 1;
      imgEl.style.transform = u < 1 ? `scaleX(${sx.toFixed(4)}) scaleY(${sy.toFixed(4)})` : '';
      if (u < 1) {
        squashFrame = requestAnimationFrame(step);
      } else {
        squashFrame = null;
      }
    };
    squashFrame = requestAnimationFrame(step);
  }

  function clampHostAndBubble() {
    if (!hostEl) return;
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    const rect = stageEl ? stageEl.getBoundingClientRect() : { width: 120, height: 120 };
    const maxLeftShift = Math.max(0, vw - rect.width - 24);
    const maxUpShift = Math.max(0, vh - rect.height - 96);
    offsetX = Math.max(-maxLeftShift, Math.min(0, offsetX));
    offsetY = Math.max(-maxUpShift, Math.min(0, offsetY));
    hostEl.style.transform = `translate3d(${Math.round(offsetX)}px, ${Math.round(offsetY)}px, 0)`;

    if (bubbleEl && !bubbleEl.classList.contains('hidden')) {
      bubbleEl.style.setProperty('--bub-shift', '0px');
      const br = bubbleEl.getBoundingClientRect();
      let shift = 0;
      if (br.right > vw - 10) shift = (vw - 10) - br.right;
      if (br.left + shift < 10) shift = 10 - br.left;
      bubbleEl.style.setProperty('--bub-shift', `${Math.round(shift)}px`);
      const sr = stageEl ? stageEl.getBoundingClientRect() : null;
      if (sr) {
        const tailRight = Math.max(20, Math.round((sr.width / 2) - shift));
        bubbleEl.style.setProperty('--tail-right', `${tailRight}px`);
      }
    }
  }

  function showBubble({ mood = 'wave', tag = '大肥鱼助手', text = '', foot = '' }, autoHideMs = 7000) {
    if (!hostEl) return;
    if (collapsed) {
      collapsed = false;
      hostEl.classList.remove('is-collapsed');
    }
    const targetClip = CLIP_MAP[mood] || 'wave';
    applyImageClip(targetClip);
    triggerSquash(0.14);

    clearTimeout(revertTimer);
    if (targetClip !== getBaselineClip()) {
      revertTimer = setTimeout(() => applyImageClip(getBaselineClip()), 5400);
    }

    if (text && bubbleEl && textEl) {
      if (tagEl) {
        tagEl.textContent = tag || '大肥鱼助手';
        tagEl.style.display = tag ? '' : 'none';
      }
      textEl.innerHTML = escHtml(text);
      if (hintFootEl) {
        hintFootEl.textContent = foot || '';
        hintFootEl.style.display = foot ? 'block' : 'none';
      }
      bubbleEl.classList.remove('hidden');
      requestAnimationFrame(clampHostAndBubble);
      clearTimeout(hideBubbleTimer);
      if (autoHideMs > 0) {
        hideBubbleTimer = setTimeout(() => {
          bubbleEl && bubbleEl.classList.add('hidden');
        }, autoHideMs);
      }
    }
  }

  function handleAssistantTap() {
    const ctx = opts.getContext ? opts.getContext() : null;
    const ctxKey = buildContextKey(ctx);
    if (ctxKey !== lastCtxKey) {
      lastCtxKey = ctxKey;
      stepIndex = 0;
    }
    const advice = getContextAdvice(ctx, stepIndex);
    stepIndex += 1;
    const isMobile = !!opts.isMobile;
    showBubble(
      {
        mood: advice.mood,
        tag: advice.tag,
        text: advice.text,
        foot: isMobile ? '再点大肥鱼切换下一条提醒' : '再点大肥鱼切换下一条提醒 · 按住可拖动位置'
      },
      11000
    );
  }

  function wireInteractions() {
    if (!stageEl || !hostEl) return;
    let dragging = false;
    let moved = false;
    let pId = null;
    let startX = 0, startY = 0;
    let baseOX = 0, baseOY = 0;

    stageEl.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('.dsh-pet-min-btn')) return;
      dragging = true;
      moved = false;
      pId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      baseOX = offsetX;
      baseOY = offsetY;
      stageEl.setPointerCapture && stageEl.setPointerCapture(pId);
    });

    stageEl.addEventListener('pointermove', e => {
      if (!dragging || e.pointerId !== pId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) >= 8) {
        moved = true;
        stageEl.classList.add('is-dragging');
      }
      if (moved) {
        offsetX = baseOX + dx;
        offsetY = baseOY + dy;
        clampHostAndBubble();
      }
    });

    const endDrag = e => {
      if (!dragging || e.pointerId !== pId) return;
      dragging = false;
      stageEl.classList.remove('is-dragging');
      try { stageEl.releasePointerCapture && stageEl.releasePointerCapture(pId); } catch {}
      if (!moved) {
        handleAssistantTap();
      }
    };
    stageEl.addEventListener('pointerup', endDrag);
    stageEl.addEventListener('pointercancel', endDrag);

    const closeBub = hostEl.querySelector('.dsh-bub-close');
    if (closeBub) {
      closeBub.onclick = e => {
        e.stopPropagation();
        bubbleEl && bubbleEl.classList.add('hidden');
      };
    }

    const minBtn = hostEl.querySelector('.dsh-pet-min-btn');
    if (minBtn) {
      minBtn.onclick = e => {
        e.stopPropagation();
        collapsed = true;
        bubbleEl && bubbleEl.classList.add('hidden');
        hostEl.classList.add('is-collapsed');
      };
    }

    const restoreBtn = hostEl.querySelector('.dsh-pet-restore-pill');
    if (restoreBtn) {
      restoreBtn.onclick = () => {
        collapsed = false;
        hostEl.classList.remove('is-collapsed');
        applyImageClip('wave');
        triggerSquash(0.15);
        clearTimeout(revertTimer);
        revertTimer = setTimeout(() => applyImageClip(getBaselineClip()), 3600);
      };
    }
  }

  function mount(config = {}) {
    opts = config;
    hostEl = document.getElementById(opts.hostId || 'dsh-pet-dock');
    if (!hostEl) return;

    const welcomeUrl = resolveClipUrls('idle').urls[0];
    hostEl.innerHTML = `
      <div class="dsh-pet-bubble hidden" id="dsh-pet-bubble" role="status">
        <div class="dsh-bub-top">
          <span class="dsh-bub-tag" id="dsh-bub-tag">大肥鱼助手</span>
          <button type="button" class="dsh-bub-close" aria-label="关闭气泡" title="关闭">×</button>
        </div>
        <div class="dsh-bub-body" id="dsh-bub-body"></div>
        <div class="dsh-bub-foot" id="dsh-bub-foot"></div>
      </div>
      <div class="dsh-pet-stage" id="dsh-pet-stage" role="button" tabindex="0" aria-label="大肥鱼学习助手：点击查看当前页或题目思路提醒">
        <img class="dsh-pet-sprite" id="dsh-pet-sprite" src="${welcomeUrl}" alt="大肥鱼桌宠助手" draggable="false">
        <button type="button" class="dsh-pet-min-btn" title="收起大肥鱼">收起</button>
      </div>
      <button type="button" class="dsh-pet-restore-pill" id="dsh-pet-restore-pill" title="召唤大肥鱼助手">召唤大肥鱼</button>
    `;

    bubbleEl = document.getElementById('dsh-pet-bubble');
    tagEl = document.getElementById('dsh-bub-tag');
    textEl = document.getElementById('dsh-bub-body');
    hintFootEl = document.getElementById('dsh-bub-foot');
    stageEl = document.getElementById('dsh-pet-stage');
    imgEl = document.getElementById('dsh-pet-sprite');

    // Keyboard accessibility for Enter / Space on stage
    stageEl.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAssistantTap();
      }
    };

    wireInteractions();
    window.addEventListener('resize', clampHostAndBubble);
    applyImageClip(getBaselineClip());
  }

  function onContextChanged(optsParam = {}) {
    const ctx = opts.getContext ? opts.getContext() : null;
    const key = buildContextKey(ctx);
    const justReacted = (Date.now() - lastReactAt) < 700;
    if (key !== lastCtxKey) {
      lastCtxKey = key;
      stepIndex = 0;
      if (!optsParam.keepBubble && !justReacted && bubbleEl) {
        bubbleEl.classList.add('hidden');
      }
    }
    if (!justReacted) {
      clearTimeout(revertTimer);
      applyImageClip(getBaselineClip());
    }
  }

  function react(mood, text, autoHideMs = 4800) {
    if (!hostEl) return;
    if (collapsed) {
      // Gently animate without forcibly popping up if user explicitly minimized her
      return;
    }
    lastReactAt = Date.now();
    const labelMap = {
      cheer: '元气加油',
      teach: '重点讲解',
      think: '思考提示',
      happy: '回答漂亮',
      oops: '错题提醒',
      code: '写码调试',
      exam: '模拟考场',
      search: '寻路要点',
      sleepy: '深海护眼',
      trophy: '高分成就',
      celebrate: '满分庆祝'
    };
    showBubble(
      {
        mood: mood || 'wave',
        tag: labelMap[mood] || '大肥鱼助手',
        text: text || '',
        foot: ''
      },
      autoHideMs
    );
  }

  global.DshPetAssistant = {
    CLIP_MAP,
    mount,
    react,
    onContextChanged,
    triggerTap: handleAssistantTap,
    getContextAdvice,
    sanitizeNonSpoiler,
    resolveClipUrls
  };
})(typeof window !== 'undefined' ? window : globalThis);
