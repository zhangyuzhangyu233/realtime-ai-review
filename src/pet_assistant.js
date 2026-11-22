/* ==========================================================================
   Context-Aware Animated Study Assistant Powered by dsh-pet (MIT Assets)
   - Transparent animated WebP + static RGBA offline PNG fallback
   - Zero-truncation complete-sentence hints across all 92 exam/drill items
   - Proactive wrong-answer auto-guidance & inactivity auto-hint watcher
   - Q-bounce elastic squash, drag positioning & hover-to-pause bubble
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

  const DEFAULT_IDLE_FIRST_MS = 22000;
  const DEFAULT_IDLE_SECOND_MS = 28000;

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureEndPunct(s) {
    const t = String(s || '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    const last = t.charAt(t.length - 1);
    if ('。！？!'.indexOf(last) !== -1) return t;
    if ('；;，,：:'.indexOf(last) !== -1) return t.slice(0, -1) + '。';
    return t + '。';
  }

  function splitSentences(raw) {
    const src = String(raw || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!src) return [];
    const out = [];
    let start = 0;
    const closers = '）)」』”"\'】]';
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch === '。' || ch === '！' || ch === '？' || ch === '!') {
        let end = i + 1;
        while (end < src.length && closers.indexOf(src[end]) !== -1) {
          end += 1;
        }
        const piece = src.slice(start, end).trim();
        if (piece) out.push(piece);
        start = end;
        i = end - 1;
      }
    }
    const tail = src.slice(start).trim();
    if (tail) out.push(ensureEndPunct(tail));
    return out;
  }

  // Always returns whole sentences (never cuts mid-sentence with ellipsis)
  function completeSentences(raw, maxSentences = 2, softMaxChars = 155) {
    const sentences = splitSentences(raw);
    if (!sentences.length) return '';
    const picked = [];
    let total = 0;
    for (const st of sentences) {
      if (picked.length >= maxSentences) break;
      if (picked.length > 0 && total + st.length > softMaxChars) break;
      picked.push(ensureEndPunct(st));
      total += st.length;
    }
    return picked.join('');
  }

  // Strip only verdict clauses so pre-answer hints remain fluent, natural, and non-spoiler
  function cleanNonSpoiler(raw, q) {
    let s = String(raw || '').replace(/\s+/g, ' ').trim();
    // Strip trailing TF / Single / Fill conclusion clauses cleanly at punctuation boundaries
    s = s.replace(/[，,；;。]?\s*(?:因此|所以|故|从而|于是)?\s*(?:题干|该说法|该描述|本题|上述描述|结果)?\s*(?:完全)?\s*(?:对应|选定|选择|锁定|匹配|答案为?|属|符合题意|描述不准确)?(?:正确|错误|匹配)?(?:选项)?\s*[ABCD]\s*(?:[（(][^）)]*[）)])?\s*[。！!]*$/g, '。');
    s = s.replace(/[，,；;。]?\s*(?:因此|所以|故|从而)?\s*(?:该说法|本题|题干|上述表述|此命题)?\s*(?:整体|均|可)?\s*(?:判(?:定|别)?为?|应判为?|记为|认定为?)?\s*【?\s*(?:对|错|正确|错误)\s*】?(?:\s*[（(][^）)]*[）)])?\s*[。！!]*$/g, '。');
    s = s.replace(/^[，,；;。]?\s*(?:正确|错误)[！!。]\s*/g, '');
    s = s.replace(/连缀得\s*[A-Z]{4,}[。！!]*$/g, '。');
    s = s.replace(/[（(]或\s*[A-Z]{4,}[）)]/g, '');

    if (q && q.type === 'single' && Array.isArray(q.options)) {
      const ansText = String(q.options[q.answer] || '').trim();
      if (ansText && ansText.length >= 2) {
        const escaped = ansText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Strip clause if it literally gives away "= <exact option>"
        s = s.replace(new RegExp('[，,；;]?\\s*(?:因此|所以|故|最终|结果|算得|得到|对应|为|选)\\s*(?:为|是|等于|选项)?\\s*' + escaped + '[^。！？!]*[。！!]?', 'g'), '。');
      }
    }

    s = s.replace(/。\s*。+/g, '。').replace(/^[，,；;。\s]+/, '').trim();
    return ensureEndPunct(s);
  }

  function containsBlankLiteral(text, q) {
    if (!q || !Array.isArray(q.blanks) || !text) return false;
    const normT = String(text).toLowerCase().replace(/\s+/g, '');
    return q.blanks.some(b =>
      (b.answers || []).some(a => {
        const cleanA = String(a || '').trim().toLowerCase().replace(/\s+/g, '');
        return cleanA.length >= 3 && normT.includes(cleanA);
      })
    );
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
      return '先在画板上添加全部状态圆圈，选中起始态点击「设为初始态」标出入口箭头，再用连线逐条标清触发条件，双击节点或箭头文字即可随时修改。';
    }
    if (q.board.kind === 'bt') {
      if (q.id === 'e7') {
        return '纯 Sequence 会一直续跑耗时动作而无法打断。请在画板顶层放置并行节点 Parallel，左路挂修饰节点 Until Failure 包裹「看到玩家」，右路挂 Sequence（移动、攻击）。';
      }
      return '画板顶层先放置选择节点 Selector，再按从高到低优先级从左向右依次挂接保命分支、战斗分支和兜底巡逻叶节点，并用箭头自上而下连接。';
    }
    if (q.board.kind === 'pathgrid') {
      return '用左侧「描绘路径」工具从起点拖到终点。计算时注意正交直走代价为 10、对角斜走代价为 14，且严格遵守题目对障碍物斜穿角点（Corner Cut）的限制。';
    }
    return '';
  }

  /* -------------------- Context Advice (All Zero-Truncation Complete Sentences) -------------------- */
  function getContextAdvice(ctx, stepIdx = 0) {
    const details = global.EXPLAIN_DETAILS || {};
    const summaries = (ctx && ctx.topicSummaries) || {};
    const view = (ctx && ctx.view) || 'knowledge';

    /* 1. KNOWLEDGE REVIEW */
    if (view === 'knowledge') {
      const sec = ctx.activeSectionObj || null;
      const sum = summaries[ctx.activeSection] || null;
      const pct = typeof ctx.activeSectionPct === 'number' ? ctx.activeSectionPct : 0;
      const secTitle = sec ? sec.short : '当前小节';

      const tips = [
        {
          mood: 'notes',
          tag: '本节精要 1/3',
          lines: [
            ensureEndPunct(`${secTitle}重点在于：${(sec && sec.tip) || '理解核心原理与工程实现步骤。'}`),
            sum && sum.formula ? ensureEndPunct(`核心公式速记：${sum.formula}`) : ''
          ].filter(Boolean)
        },
        {
          mood: 'think',
          tag: '高频避坑 2/3',
          lines: [
            sum && sum.trap
              ? ensureEndPunct(`${secTitle}高频避坑提醒：${sum.trap}`)
              : `复习 ${secTitle} 避坑建议：先结合 C# 代码沙盒改参数运行一遍，直观感受每帧状态变化。`,
            '遇到抽象算法时，点击上方动画画面即可全屏放大并单步追踪。'
          ]
        },
        {
          mood: 'search',
          tag: '复习建议 3/3',
          lines: [
            pct < 80
              ? `${secTitle}目前熟练度为 ${pct}%。建议先点击下方「本节刷题」，趁热把对应题型过一遍！`
              : `${secTitle}熟练度已达到 ${pct}%！建议打卡完本节后切换到下一小节继续推进。`
          ]
        }
      ];
      const chosen = tips[stepIdx % tips.length];
      return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
    }

    /* 2. MASTERY DIAGNOSTICS */
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
            tag: '薄弱项诊断 1/2',
            lines: [
              `你当前的综合知识熟练度是 ${overall}%。`,
              `建议优先补强「${w1.name}」（目前 ${w1.pct}%）${w2 ? `和「${w2.name}」（目前 ${w2.pct}%）` : ''}，直接点击对应卡片就能进入专项刷题！`
            ]
          },
          {
            mood: 'notes',
            tag: '高效提分策略 2/2',
            lines: [
              '熟练度由「小节精讲打卡、运行 C# 沙盒、刷题正确率」共同累计而成。',
              '如果备考时间紧张，优先攻克第 3 到第 5 章的 A* 寻路计算、状态机和行为树大题，性价比最高！'
            ]
          }
        ];
        const chosen = tips[stepIdx % tips.length];
        return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
      }
      const lines = [
        `太棒了，你的综合知识熟练度已达 ${overall}%！`,
        '建议去练习模式挑战一套 100 分全真模拟卷，按 90 分钟节奏做一次完整验收。'
      ];
      return { mood: 'celebrate', tag: '备考状态佳', lines, text: lines.join(' ') };
    }

    /* 3. MISTAKE NOTEBOOK & FAVORITES */
    if (view === 'notebook') {
      const nb = ctx.notebookSummary || {};
      const wrongCnt = nb.wrongCount || 0;
      const favCnt = nb.favCount || 0;
      if (wrongCnt > 0) {
        const topName = nb.topWrongTopicName || '重点考点';
        const tips = [
          {
            mood: 'oops',
            tag: '错题攻坚 1/2',
            lines: [
              `错题本里还有 ${wrongCnt} 道题需要重点攻克，其中「${topName}」错题最集中。`,
              '建议重做前先读一遍解析里的「为什么这么做」与「考场避坑」，做对后会自动移出错题本！'
            ]
          },
          {
            mood: 'think',
            tag: '清零规划 2/2',
            lines: [
              `你另外收藏了 ${favCnt} 道重点题，适合考前集中速览。`,
              '先把所有错题清零，再手写几道带 // 提示骨架的 C# 编程题，考场把握会大很多！'
            ]
          }
        ];
        const chosen = tips[stepIdx % tips.length];
        return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
      }
      const lines = [
        '漂亮！你的错题本目前已经清零。',
        `重点收藏夹里还存着 ${favCnt} 道精华题，抽空可以点进解析再回顾一遍关键步骤。`
      ];
      return { mood: 'celebrate', tag: '错题已清零', lines, text: lines.join(' ') };
    }

    /* 4. PRACTICE -> MOCK EXAM */
    if (view === 'practice' && ctx.practiceSub === 'mock') {
      const mq = ctx.mockQuestion;
      const curIdx = (ctx.mockIndex || 0) + 1;
      const total = ctx.mockTotal || 30;
      const done = ctx.mockDoneCount || 0;
      const remain = ctx.mockRemainText || '';
      const sum = mq ? summaries[mq.topic] : null;
      const det = mq ? details[mq.id] : null;

      if (ctx.mockSubmitted) {
        const lines = det
          ? [
              `模拟卷已批改完成！回顾第 ${curIdx} 题时重点盯住这个坑：${completeSentences(det.pitfall, 1, 140)}`,
              '点击上方智能采分卡片和深度分步解析，可以对照每条遗漏要点查漏补缺。'
            ]
          : ['模拟卷已交卷！点开上方答题卡的红色题号即可直达错题逐一复盘。'];
        return {
          mood: (ctx.mockScorePct || 0) >= 80 ? 'celebrate' : 'notes',
          tag: '模考复盘',
          lines,
          text: lines.join(' ')
        };
      }

      const tips = [
        {
          mood: 'deep_think',
          tag: `模考护航 ${curIdx}/${total}`,
          lines: [
            `当前是第 ${curIdx} / ${total} 题，你已经填写了 ${done} 题${remain ? `，还剩 ${remain} 作答时间` : ''}。`,
            '先把稳拿的客观题分数拿到手，遇到大题与编程题时先用要点法搭好框架再补充代码细节。'
          ]
        },
        {
          mood: 'think',
          tag: '考点公式速递',
          lines: [
            sum && sum.formula
              ? ensureEndPunct(`第 ${curIdx} 题关联的核心公式或规则：${sum.formula}`)
              : '审题时先圈出已知物理量、坐标方向与边界条件，再下笔推导。',
            sum && sum.trap
              ? ensureEndPunct(`审题提醒：${sum.trap}`)
              : '填完表达式别忘了再核对一遍正负号和单位换算！'
          ]
        }
      ];
      const chosen = tips[stepIdx % tips.length];
      return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
    }

    /* 5. PRACTICE -> RANDOM BANK & CODING DRILLS */
    if (view === 'practice' && ctx.practiceItem) {
      const item = ctx.practiceItem;

      // 5A. Hands-on C# Drill (d1..d9)
      if (item.kind === 'drill' && item.drill) {
        const d = item.drill;
        const det = details[d.id];
        if (item.answered) {
          if (item.correct) {
            const lines = [
              `太棒了，${d.file} 已经顺利通过自动检测！`,
              det && det.pitfall
                ? ensureEndPunct(`顺手再牢记一个实战细节：${completeSentences(det.pitfall, 1, 140)}`)
                : '点「下一题」继续挑战下一道高频编程实战题！'
            ];
            return { mood: 'celebrate', tag: '编码通关', lines, text: lines.join(' ') };
          }
          const wrongGuide = buildWrongAnswerGuide({ itemKind: 'drill', item: d, evalReport: item.evalReport, topicSummaries: summaries });
          return wrongGuide;
        }

        const chkLabels = Array.isArray(d.checks) && d.checks.length
          ? d.checks.slice(0, 3).map(c => String(c.label || '').trim()).filter(Boolean).join('、')
          : '';
        const tips = [
          {
            mood: 'code',
            tag: '写码思路 1/3',
            lines: [
              ensureEndPunct(det ? completeSentences(det.why, 1, 145) : d.desc),
              '可以先读代码编辑区里每条 // TODO (提示) 注释，我已经把每步需要的公式和 Unity API 标在里面了。'
            ]
          },
          {
            mood: 'think',
            tag: '评分标准 2/3',
            lines: [
              chkLabels
                ? `提交后智能判分器会重点验证这几件事：${chkLabels}。`
                : ensureEndPunct(`核心实现思路：${d.hint}`),
              '系统内置了等价写法和数值仿真判定，不必死背某一种变量命名，按自己顺手的 C# 风格写就行！'
            ]
          },
          {
            mood: 'search',
            tag: '防写错提醒 3/3',
            lines: [
              ensureEndPunct(det ? completeSentences(det.pitfall, 1, 145) : d.hint),
              '如果想先看完整思路示范，也可以直接点击下方「直接展开详细解析」对照学习。'
            ]
          }
        ];
        const chosen = tips[stepIdx % tips.length];
        return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
      }

      // 5B. Bank Question (s*, tf*, f*, e*, c*)
      if (item.kind === 'question' && item.question) {
        const q = item.question;
        const det = details[q.id];
        const sum = summaries[q.topic];

        if (item.answered) {
          if (item.correct) {
            const lines = [
              '答对啦，这道题稳稳拿下！',
              det && det.pitfall
                ? ensureEndPunct(`再顺带确认一遍避坑点：${completeSentences(det.pitfall, 1, 140)}`)
                : '对应知识点的熟练度已经同步提升了，继续点下一题保持好状态！'
            ];
            return { mood: 'happy', tag: '稳步巩固', lines, text: lines.join(' ') };
          }
          return buildWrongAnswerGuide({
            itemKind: 'question',
            item: q,
            userVal: item.userVal,
            evalReport: item.evalReport,
            topicSummaries: summaries
          });
        }

        // Pre-answer: code:fill (c1..c5)
        if (q.type === 'code' && q.subkind === 'fill') {
          const stepCue = sum && sum.formula
            ? `核心规律可以参考：${sum.formula}。`
            : '请按顺序追踪每个变量和分支条件的变化。';
          const trapText = det && det.pitfall && !containsBlankLiteral(det.pitfall, q)
            ? completeSentences(cleanNonSpoiler(det.pitfall, q), 1, 145)
            : (sum && sum.trap ? ensureEndPunct(`容易写错的地方：${sum.trap}`) : '提交前务必核对正负号、方法大小写以及取模边界。');
          const tips = [
            {
              mood: 'code',
              tag: '代码填空 1/3',
              lines: [
                ensureEndPunct(det ? cleanNonSpoiler(completeSentences(det.why, 1, 140), q) : '先通读代码上下文，弄清函数在游戏主循环里的职责。'),
                '代码模板每个空旁边都写好了 // 提示N 注释，顺着注释把公式或 Unity API 填进去就行。'
              ]
            },
            {
              mood: 'think',
              tag: '写法要点 2/3',
              lines: [
                ensureEndPunct(stepCue),
                '判题器支持乘除交换律、等价复合赋值（比如 +=）和多种写法，而且不需要多填末尾分号。'
              ]
            },
            {
              mood: 'search',
              tag: '避坑自查 3/3',
              lines: [
                ensureEndPunct(trapText),
                '还有拿不准的空，可以翻开右侧知识卡核对核心代码片段！'
              ]
            }
          ];
          const chosen = tips[stepIdx % tips.length];
          return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
        }

        // Pre-answer: code:write (c6..c9)
        if (q.type === 'code' && q.subkind === 'write') {
          const rubricPts = Array.isArray(q.rubric) && q.rubric.length
            ? q.rubric.slice(0, 2).join('；')
            : (sum ? sum.formula : '注意类与方法签名以及执行先后顺序');
          const tips = [
            {
              mood: 'code',
              tag: '手写思路 1/3',
              lines: [
                ensureEndPunct(det ? completeSentences(det.why, 1, 145) : '先把接口与主循环的骨架理清，再填核心逻辑。'),
                '代码编辑器里已经内置了 // 提示1~N 分步注释骨架，顺着注释逐段填空最不容易遗漏！'
              ]
            },
            {
              mood: 'think',
              tag: '关键采分点 2/3',
              lines: [
                ensureEndPunct(`这道题主要考察：${rubricPts}`),
                '只要语义和执行逻辑等价即可得分，系统不强求变量命名完全一致。'
              ]
            },
            {
              mood: 'search',
              tag: '高频 Bug 提醒 3/3',
              lines: [
                ensureEndPunct(det && det.pitfall ? completeSentences(det.pitfall, 1, 145) : '注意空引用判空保护，以及状态/父指针更新的先后顺序。'),
                '写完建议自己从头默跑一遍输入数据，确认没有漏掉边界条件。'
              ]
            }
          ];
          const chosen = tips[stepIdx % tips.length];
          return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
        }

        // Pre-answer: interactive board essays (e5, e6, e7, e9, e10)
        if (q.board) {
          const bHint = buildBoardReminder(q);
          const step0 = det && det.steps && det.steps[0]
            ? completeSentences(det.steps[0], 1, 150)
            : (q.rubric && q.rubric[0] ? ensureEndPunct(q.rubric[0]) : '先确定核心节点与初始条件，再按规则逐层连线。');
          const tips = [
            {
              mood: 'think',
              tag: '画图切入点 1/3',
              lines: [
                ensureEndPunct(bHint || completeSentences(det && det.why, 1, 145)),
                '画图和下方补充文字框会联合智能评分，两边互相照应拿高分很轻松！'
              ]
            },
            {
              mood: 'notes',
              tag: '构图步骤 2/3',
              lines: [
                ensureEndPunct(step0),
                q.board.kind !== 'pathgrid'
                  ? '双击画板里的节点或连线就能直接修改名字，点左侧按钮还可以全屏放大慢慢画。'
                  : '用「标 Open / Close」和双击写 f/g/h 可以把计算过程清清楚楚标在格子上。'
              ]
            },
            {
              mood: 'search',
              tag: '大题避坑 3/3',
              lines: [
                ensureEndPunct(det && det.pitfall ? completeSentences(det.pitfall, 1, 150) : '提交前检查一遍是否有漏连的跳转边或边界条件。'),
                '对照完这几点如果还拿不准，点右上「速记卡」或下方「直接展开解析与动画」能看清动画原理。'
              ]
            }
          ];
          const chosen = tips[stepIdx % tips.length];
          return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
        }

        // Pre-answer: fill (f1..f10)
        if (q.type === 'fill') {
          const blankCnt = Array.isArray(q.blanks) ? q.blanks.length : 1;
          const formulaLine = sum && sum.formula
            ? `关联核心结论：${sum.formula}。`
            : '请结合题目条件与课程约定的步骤顺序列出每一空。';
          const trapLine = det && det.pitfall && !containsBlankLiteral(det.pitfall, q)
            ? completeSentences(cleanNonSpoiler(det.pitfall, q), 1, 145)
            : (sum && sum.trap ? ensureEndPunct(`填表避坑：${sum.trap}`) : '提交前检查每一空的顺序、正负号和中心偏移不要漏写！');
          const tips = [
            {
              mood: 'think',
              tag: '填空思路 1/3',
              lines: [
                ensureEndPunct(det && det.why ? cleanNonSpoiler(completeSentences(det.why, 1, 145), q) : '先抓住这道题背后的核心算法规律。'),
                q.interactiveGrid
                  ? '这题配有同步 28 格手算画板！建议在格子里双指标记 f/g/h 并直接拖出路径，系统会自动回填最后一空。'
                  : `本题共有 ${blankCnt} 个空，先在脑中把完整流程串起来再逐空填写。`
              ]
            },
            {
              mood: 'notes',
              tag: '推导抓手 2/3',
              lines: [
                ensureEndPunct(formulaLine),
                '系统已经兼容常见同义术语和小数精度误差，按标准表述作答即可。'
              ]
            },
            {
              mood: 'search',
              tag: '避坑提醒 3/3',
              lines: [
                ensureEndPunct(trapLine),
                '实在卡住的时候，点击右侧「速记卡」能先瞄一眼核心口诀，不需要立刻翻答案！'
              ]
            }
          ];
          const chosen = tips[stepIdx % tips.length];
          return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
        }

        // Pre-answer: Single / TF / Essay (without board)
        const stepCandidate = det && det.steps && det.steps[0]
          ? cleanNonSpoiler(completeSentences(det.steps[0], 1, 130), q)
          : '';
        const stepSafe = (q.type === 'single' && stepCandidate && stepCandidate.length > 16)
          ? stepCandidate
          : (sum && sum.formula ? `结合公式或结论来推导：${sum.formula}。` : '先把题干里的已知量和限定条件一一列出来再推理。');
        const pitfallCandidate = det && det.pitfall
          ? cleanNonSpoiler(completeSentences(det.pitfall, 1, 140), q)
          : (sum && sum.trap ? cleanNonSpoiler(sum.trap, q) : '先排除明显不符合基本物理/算法直觉的干扰说法，再聚焦关键细节。');

        const tips = [
          {
            mood: 'think',
            tag: '解题思路 1/3',
            lines: [
              ensureEndPunct(det && det.why ? cleanNonSpoiler(completeSentences(det.why, 1, 145), q) : '先审清题目考的核心原理和已知条件。'),
              q.scratchBoard ? '想比划轨迹的话，可以点开题干下方的「寻路演草画板」自由打草稿，不计分放心用！' : ''
            ].filter(Boolean)
          },
          {
            mood: 'notes',
            tag: '怎么下手 2/3',
            lines: [
              ensureEndPunct(stepSafe),
              sum && sum.formula && !stepSafe.includes(sum.formula)
                ? ensureEndPunct(`核心速记：${sum.formula}`)
                : '理顺第一步之后再对照选项逐个排除或代入验算！'
            ]
          },
          {
            mood: 'search',
            tag: '避坑提醒 3/3',
            lines: [
              ensureEndPunct(pitfallCandidate),
              '想看可视化推演的话，右侧有速记卡，下方也能点「直接展开解析与动画」！'
            ]
          }
        ];
        const chosen = tips[stepIdx % tips.length];
        return { mood: chosen.mood, tag: chosen.tag, lines: chosen.lines, text: chosen.lines.join(' ') };
      }
    }

    const lines = [
      '点我可以获取当前页面或当前题目的专属思路提醒！',
      '做题卡住或者答错时我也会主动冒泡帮你梳理做法，按住我还可以把我拖到不挡视线的位置。'
    ];
    return { mood: 'wave', tag: '大肥鱼学习助手', lines, text: lines.join(' ') };
  }

  /* -------------------- Proactive Wrong-Answer Guidance Builder -------------------- */
  function buildWrongAnswerGuide({ itemKind, item, userVal, evalReport, topicSummaries = {} } = {}) {
    const details = global.EXPLAIN_DETAILS || {};
    const det = item ? details[item.id] : null;
    const sum = item && topicSummaries ? topicSummaries[item.topic] : null;

    if (!item) {
      const lines = ['这题有点遗憾没答对，建议点开下方解析核对关键步骤后再继续下一题！'];
      return { mood: 'oops', tag: '错题提醒', lines, text: lines.join(' ') };
    }

    // 1. Coding drill (d1..d9)
    if (itemKind === 'drill') {
      const checks = (evalReport && Array.isArray(evalReport.checks)) ? evalReport.checks : [];
      const failed = checks.filter(c => !c.ok);
      const firstMiss = failed[0];
      const lines = [];
      if (firstMiss) {
        lines.push(`别急，${item.file} 还有 ${failed.length} 项检查点没通过，先修最前面这一处：【${firstMiss.label}】。`);
        if (firstMiss.hint) {
          lines.push(ensureEndPunct(`具体改法：${firstMiss.hint}`));
        } else if (det && det.steps && det.steps[0]) {
          lines.push(ensureEndPunct(`参考步骤：${completeSentences(det.steps[0], 1, 130)}`));
        }
      } else {
        lines.push(`这题暂未达到 60% 及格线，对照下方诊断清单补全缺失的 C# 关键语句就行。`);
      }
      if (det && det.pitfall) {
        lines.push(ensureEndPunct(`重点避坑：${completeSentences(det.pitfall, 1, 130)}`));
      }
      return { mood: 'oops', tag: '代码错因定位', lines, text: lines.join(' ') };
    }

    const q = item;

    // 2. Essay / Board / Handwritten C# code (e1..e10, c6..c9)
    if (evalReport && Array.isArray(evalReport.details)) {
      if (evalReport.tooShort) {
        const lines = [
          q.board
            ? '提交内容太少还不够判分呢。建议先在画板里把主要节点和有向连线画出来，或者点左侧工具按步推进，并在文字框写上几句关键规则！'
            : (q.type === 'code'
              ? '目前编辑区还没写出有效 C# 实现语句。跟着里面的 // 提示1~N 注释先把函数主体填出来，支持各种等价写法！'
              : '这次写的内容太短啦，试着按「核心思想 → 关键步骤 → 优缺点/结论」分段写出关键采分点！')
        ];
        if (det && det.why) lines.push(ensureEndPunct(`本题切入点：${completeSentences(det.why, 1, 125)}`));
        return { mood: 'oops', tag: '如何下手提示', lines, text: lines.join(' ') };
      }

      const missedPts = evalReport.details.filter(d => d.status !== 'full');
      const firstPt = missedPts[0];
      const lines = [];
      if (firstPt) {
        lines.push(`智能评分是 ${evalReport.score}/${evalReport.maxScore} 分（需达 6 分），最值得先补上这一条：【${firstPt.label}】。`);
        if (firstPt.missHint) {
          lines.push(ensureEndPunct(`具体怎么做：${firstPt.missHint}`));
        }
      } else {
        lines.push(`目前差一点达到及格分，对照下方深度分步解析把漏掉的关键步骤补齐吧！`);
      }
      if (det && det.pitfall) {
        lines.push(ensureEndPunct(`考场避坑：${completeSentences(det.pitfall, 1, 130)}`));
      }
      return { mood: 'oops', tag: '大题纠错引导', lines, text: lines.join(' ') };
    }

    // 3. Fill / Code Fill (f1..f10, c1..c5)
    if (Array.isArray(q.blanks) && q.blanks.length) {
      const GRADER = global.SmartGrader;
      const vals = Array.isArray(userVal) ? userVal : [];
      const missedBlanks = [];
      q.blanks.forEach((b, i) => {
        const ok = (GRADER && typeof GRADER.matchFillBlank === 'function')
          ? GRADER.matchFillBlank(vals[i], b.answers)
          : String(vals[i] || '').trim() === String((b.answers && b.answers[0]) || '').trim();
        if (!ok) missedBlanks.push({ idx: i + 1, label: b.label });
      });
      const labelsList = missedBlanks.slice(0, 3).map(b => b.label).join('、');
      const moreStr = missedBlanks.length > 3 ? ` 等共 ${missedBlanks.length} 处` : '';
      const lines = [];
      if (missedBlanks.length) {
        lines.push(`这几个空填错或漏填啦：【${labelsList}】${moreStr}。`);
        if (q.codeTemplate) {
          const n = missedBlanks[0].idx;
          const m = q.codeTemplate.match(new RegExp('//\\s*提示' + n + '(?:（[^）]*）)?\\s*[：:]\\s*([^\\n]+)'));
          if (m && m[1]) {
            lines.push(ensureEndPunct(`先看第 ${n} 空怎么做：${m[1].trim()}`));
          }
        }
      } else {
        lines.push('有空位还没写对，已经收入错题本方便考前二次巩固。');
      }
      if (lines.length < 2 && det && det.steps && det.steps[0]) {
        lines.push(ensureEndPunct(`做法回顾：${completeSentences(det.steps[0], 1, 130)}`));
      } else if (lines.length < 2 && sum && sum.formula) {
        lines.push(ensureEndPunct(`核心依据：${sum.formula}`));
      }
      if (det && det.pitfall) {
        lines.push(ensureEndPunct(`注意避坑：${completeSentences(det.pitfall, 1, 130)}`));
      }
      return { mood: 'oops', tag: '逐空纠错引导', lines, text: lines.join(' ') };
    }

    // 4. Single / True-False (s1..s36, tf1..tf18)
    const lines = [];
    lines.push(
      det && det.steps && det.steps[0]
        ? ensureEndPunct(`这题做错没关系！正确的解题第一步应该是：${completeSentences(det.steps[0], 1, 130)}`)
        : (det && det.why ? ensureEndPunct(`这题考察的是：${completeSentences(det.why, 1, 130)}`) : '这题选错了，建议先把下方推导步骤看一遍理清思路。')
    );
    if (det && det.pitfall) {
      lines.push(ensureEndPunct(`下次避坑：${completeSentences(det.pitfall, 1, 135)}`));
    } else if (sum && sum.trap) {
      lines.push(ensureEndPunct(`易错提醒：${sum.trap}`));
    }
    return { mood: 'oops', tag: '错题思路引导', lines, text: lines.join(' ') };
  }

  /* -------------------- Proactive Inactivity Auto-Hint Builder -------------------- */
  function buildIdleHint(ctx, idleStage = 0) {
    if (!ctx || ctx.view !== 'practice') return null;

    // Only auto-hint while sitting idle on an UNANSWERED question / coding task / mock question
    if (ctx.practiceSub === 'mock') {
      if (!ctx.mockQuestion || ctx.mockSubmitted) return null;
      if (idleStage >= 2) return null;
      const advice = getContextAdvice(ctx, idleStage === 0 ? 1 : 0);
      const intro = idleStage === 0
        ? `看你在这道模拟题停留有一会儿啦，给你一条不剧透的公式与审题提示：`
        : `模拟考场继续提醒一下当前做题节奏：`;
      const lines = [intro, ...advice.lines];
      return { mood: advice.mood, tag: `模考主动提醒 ${idleStage + 1}/2`, lines, text: lines.join(' ') };
    }

    const item = ctx.practiceItem;
    if (!item || item.answered) return null;
    if (idleStage >= 2) return null;

    const advice = getContextAdvice(ctx, idleStage);
    let intro = '';
    if (idleStage === 0) {
      if (item.isCoding || item.kind === 'drill') {
        intro = '写代码有点卡壳别着急，可以先按这个核心方向动笔：';
      } else if (item.question && item.question.board) {
        intro = '画板题还不知道先拖哪个图形？给你个明确的切入顺序：';
      } else {
        intro = '看你停在这道题一会儿啦，给你一条解题切入思路：';
      }
    } else {
      intro = '再帮你把具体怎么下手梳理清楚一点：';
    }

    const lines = [intro, ...advice.lines];
    return {
      mood: advice.mood || 'think',
      tag: idleStage === 0 ? '主动思路提醒 1/2' : '进阶怎么下手 2/2',
      lines,
      text: lines.join(' ')
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
  let idleStage = 0;
  let lastCtxKey = '';
  let lastReactAt = 0;
  let lastActivityAt = Date.now();
  let idleWatchTimer = null;
  let isHoveringBubble = false;
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

  function scheduleBubbleHide(ms) {
    clearTimeout(hideBubbleTimer);
    if (ms > 0 && !isHoveringBubble) {
      hideBubbleTimer = setTimeout(() => {
        if (!isHoveringBubble && bubbleEl) bubbleEl.classList.add('hidden');
      }, ms);
    }
  }

  function showBubble({ mood = 'wave', tag = '大肥鱼助手', text = '', lines = null, foot = '' }, autoHideMs = 12000) {
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

    const lineArr = (Array.isArray(lines) && lines.length)
      ? lines.filter(Boolean)
      : (text ? String(text).split(/\n+/).map(s => s.trim()).filter(Boolean) : []);

    if (lineArr.length && bubbleEl && textEl) {
      if (tagEl) {
        tagEl.textContent = tag || '大肥鱼助手';
        tagEl.style.display = tag ? '' : 'none';
      }
      textEl.innerHTML = lineArr.map(ln => `<p class="dsh-bub-p">${escHtml(ln)}</p>`).join('');
      if (hintFootEl) {
        hintFootEl.textContent = foot || '';
        hintFootEl.style.display = foot ? 'block' : 'none';
      }
      bubbleEl.classList.remove('hidden');
      requestAnimationFrame(clampHostAndBubble);
      scheduleBubbleHide(autoHideMs);
    }
  }

  function handleAssistantTap() {
    lastActivityAt = Date.now();
    const ctx = opts.getContext ? opts.getContext() : null;
    const ctxKey = buildContextKey(ctx);
    if (ctxKey !== lastCtxKey) {
      lastCtxKey = ctxKey;
      stepIndex = 0;
      idleStage = 0;
    }
    const advice = getContextAdvice(ctx, stepIndex);
    stepIndex += 1;
    const isMobile = !!opts.isMobile;
    showBubble(
      {
        mood: advice.mood,
        tag: advice.tag,
        lines: advice.lines,
        text: advice.text,
        foot: isMobile ? '再点大肥鱼切换下一条提醒' : '再点大肥鱼切换下一条提醒 · 悬停气泡可暂停自动收起'
      },
      14000
    );
  }

  function startActivityAndIdleWatcher() {
    if (idleWatchTimer) clearInterval(idleWatchTimer);
    const markActive = () => {
      lastActivityAt = Date.now();
    };
    if (typeof document !== 'undefined' && !startActivityAndIdleWatcher._boundDoc) {
      startActivityAndIdleWatcher._boundDoc = true;
      document.addEventListener('keydown', markActive, { passive: true });
      document.addEventListener('input', markActive, { passive: true });
      document.addEventListener('pointerdown', e => {
        if (!e.target || !e.target.closest || !e.target.closest('#dsh-pet-dock')) {
          markActive();
        }
      }, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) lastActivityAt = Date.now();
      });
    }

    const firstWait = Number(opts.idleFirstMs) || DEFAULT_IDLE_FIRST_MS;
    const secondWait = Number(opts.idleSecondMs) || DEFAULT_IDLE_SECOND_MS;

    idleWatchTimer = setInterval(() => {
      if (collapsed || !hostEl || !bubbleEl) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!bubbleEl.classList.contains('hidden')) return;
      if (idleStage >= 2) return;

      const elapsed = Date.now() - lastActivityAt;
      const threshold = idleStage === 0 ? firstWait : secondWait;
      if (elapsed < threshold) return;

      const ctx = opts.getContext ? opts.getContext() : null;
      const hint = buildIdleHint(ctx, idleStage);
      if (!hint) {
        lastActivityAt = Date.now();
        return;
      }

      idleStage += 1;
      stepIndex = Math.max(stepIndex, idleStage);
      lastActivityAt = Date.now();
      showBubble(
        {
          mood: hint.mood,
          tag: hint.tag,
          lines: hint.lines,
          text: hint.text,
          foot: opts.isMobile ? '点击大肥鱼可继续看下一条提示' : '点击大肥鱼继续看下一步 · 悬停可停留阅读'
        },
        13500
      );
    }, 3000);
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

    if (bubbleEl) {
      bubbleEl.addEventListener('mouseenter', () => {
        isHoveringBubble = true;
        clearTimeout(hideBubbleTimer);
      });
      bubbleEl.addEventListener('mouseleave', () => {
        isHoveringBubble = false;
        if (!bubbleEl.classList.contains('hidden')) {
          scheduleBubbleHide(4800);
        }
      });
    }

    const closeBub = hostEl.querySelector('.dsh-bub-close');
    if (closeBub) {
      closeBub.onclick = e => {
        e.stopPropagation();
        isHoveringBubble = false;
        clearTimeout(hideBubbleTimer);
        bubbleEl && bubbleEl.classList.add('hidden');
      };
    }

    const minBtn = hostEl.querySelector('.dsh-pet-min-btn');
    if (minBtn) {
      minBtn.onclick = e => {
        e.stopPropagation();
        collapsed = true;
        isHoveringBubble = false;
        clearTimeout(hideBubbleTimer);
        bubbleEl && bubbleEl.classList.add('hidden');
        hostEl.classList.add('is-collapsed');
      };
    }

    const restoreBtn = hostEl.querySelector('.dsh-pet-restore-pill');
    if (restoreBtn) {
      restoreBtn.onclick = () => {
        collapsed = false;
        hostEl.classList.remove('is-collapsed');
        lastActivityAt = Date.now();
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

    stageEl.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAssistantTap();
      }
    };

    lastActivityAt = Date.now();
    wireInteractions();
    startActivityAndIdleWatcher();
    window.addEventListener('resize', clampHostAndBubble);
    applyImageClip(getBaselineClip());
  }

  function onContextChanged(optsParam = {}) {
    const ctx = opts.getContext ? opts.getContext() : null;
    const key = buildContextKey(ctx);
    const justReacted = (Date.now() - lastReactAt) < 750;
    if (key !== lastCtxKey) {
      lastCtxKey = key;
      stepIndex = 0;
      idleStage = 0;
      lastActivityAt = Date.now();
      if (!optsParam.keepBubble && !justReacted && bubbleEl) {
        isHoveringBubble = false;
        bubbleEl.classList.add('hidden');
      }
    }
    if (!justReacted) {
      clearTimeout(revertTimer);
      applyImageClip(getBaselineClip());
    }
  }

  function react(mood, text, autoHideMs = 5200) {
    if (!hostEl || collapsed) return;
    lastReactAt = Date.now();
    lastActivityAt = Date.now();
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

  function onWrongAnswer(payload = {}, autoHideMs = 15000) {
    if (!hostEl || collapsed) return;
    lastReactAt = Date.now();
    lastActivityAt = Date.now();
    const guide = buildWrongAnswerGuide(payload);
    showBubble(
      {
        mood: guide.mood,
        tag: guide.tag,
        lines: guide.lines,
        text: guide.text,
        foot: opts.isMobile
          ? '点下方解析动画可完整复盘每一步'
          : '点我可看更多复盘提醒 · 悬停气泡可停留阅读'
      },
      autoHideMs
    );
  }

  global.DshPetAssistant = {
    CLIP_MAP,
    DEFAULT_IDLE_FIRST_MS,
    DEFAULT_IDLE_SECOND_MS,
    mount,
    react,
    onWrongAnswer,
    onContextChanged,
    triggerTap: handleAssistantTap,
    getContextAdvice,
    buildWrongAnswerGuide,
    buildIdleHint,
    cleanNonSpoiler,
    completeSentences,
    resolveClipUrls
  };
})(typeof window !== 'undefined' ? window : globalThis);
