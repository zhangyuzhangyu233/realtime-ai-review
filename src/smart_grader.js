/* ==========================================================================
   Intelligent Flexible Subjective, Fill-in-the-Blank & C# Code Grader
   (Offline Semantic + Safe Symbolic/Numeric Vector-Math Simulation Engine)
   - Essays (e1..e8): synonym clusters, numeric tolerance, multi-branch OR
   - Fill-in-the-blank & Code Fill (c1..c5): synonym + unit + safe C# vector/
     scalar expression equivalence verifier (commutative, compound ops, Reflect,
     manual dot product, Deg2Rad vs PI/180, negative-safe modulo, etc.)
   - Hands-On C# Drills (d1..d9) & Code Write (c6..c9): safe C# block simulator
     + variable-name-agnostic structural analyzer + clear diagnostic feedback
   ========================================================================== */
(function () {
  'use strict';

  function normText(raw) {
    return String(raw || '')
      .toLowerCase()
      .replace(/[（【［]/g, '(')
      .replace(/[）】］]/g, ')')
      .replace(/[，、]/g, ',')
      .replace(/[；]/g, ';')
      .replace(/[：]/g, ':')
      .replace(/[。．]/g, '.')
      .replace(/[＝]/g, '=')
      .replace(/[＋]/g, '+')
      .replace(/[－—–]/g, '-')
      .replace(/[×·＊]/g, '*')
      .replace(/[÷／]/g, '/')
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/→|⇒|=>|->|——>/g, '->')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactText(raw) {
    return normText(raw).replace(/\s+/g, '');
  }

  function stripCSharpComments(code) {
    return String(code || '')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ');
  }

  function normalizeCSharpPunct(code) {
    return stripCSharpComments(code)
      .replace(/[（【]/g, '(')
      .replace(/[）】]/g, ')')
      .replace(/[，]/g, ',')
      .replace(/[；]/g, ';')
      .replace(/[＝]/g, '=')
      .replace(/[＋]/g, '+')
      .replace(/[－—–]/g, '-')
      .replace(/[×＊]/g, '*')
      .replace(/[÷／]/g, '/')
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/！/g, '!');
  }

  function extractNumbers(raw) {
    const t = normText(raw);
    const matches = t.match(/-?\d+(?:\.\d+)?/g) || [];
    return matches.map(Number).filter(n => !Number.isNaN(n));
  }

  function hasNumberNear(nums, target, tol) {
    return nums.some(n => Math.abs(n - target) <= tol);
  }

  function matchGroup(text, compact, group) {
    for (const pat of group) {
      if (pat instanceof RegExp) {
        const m = text.match(pat) || compact.match(pat);
        if (m) return m[0];
      } else {
        const p = String(pat).toLowerCase();
        if (text.includes(p) || compact.includes(p.replace(/\s+/g, ''))) {
          return pat;
        }
      }
    }
    return null;
  }

  /* ========================================================================
     SAFE SANDBOXED C# VECTOR / SCALAR EXPRESSION & BLOCK SIMULATOR (NO eval)
     ======================================================================== */
  function makeVec(x, y, z = 0, dim = 2) {
    return { __vec: true, x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0, dim };
  }
  function isVec(v) { return Boolean(v && typeof v === 'object' && v.__vec); }
  function cloneVal(v) {
    if (isVec(v)) return makeVec(v.x, v.y, v.z, v.dim);
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v)) o[k] = cloneVal(v[k]);
      return o;
    }
    return v;
  }
  function vecMag(v) { return Math.hypot(v.x, v.y, v.dim === 3 ? v.z : 0); }
  function vecNorm(v) {
    const m = vecMag(v);
    if (m < 1e-9) return makeVec(0, 0, 0, v.dim);
    return makeVec(v.x / m, v.y / m, v.dim === 3 ? v.z / m : 0, v.dim);
  }
  function vecDot(a, b) { return a.x * b.x + a.y * b.y + ((a.dim === 3 || b.dim === 3) ? a.z * b.z : 0); }
  function vecAdd(a, b) { return makeVec(a.x + b.x, a.y + b.y, a.z + b.z, Math.max(a.dim, b.dim)); }
  function vecSub(a, b) { return makeVec(a.x - b.x, a.y - b.y, a.z - b.z, Math.max(a.dim, b.dim)); }
  function vecScale(v, s) { return makeVec(v.x * s, v.y * s, v.z * s, v.dim); }
  function vecClamp(v, maxLen) {
    const m = vecMag(v);
    if (m <= maxLen || m < 1e-9) return cloneVal(v);
    return vecScale(v, maxLen / m);
  }

  function valsClose(a, b, tol = 1e-2) {
    if (a === undefined || b === undefined || a === null || b === null) return false;
    if (typeof a === 'boolean' && typeof b === 'boolean') return a === b;
    if (typeof a === 'number' && typeof b === 'number') {
      if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
      return Math.abs(a - b) <= Math.max(tol, Math.abs(b) * 1e-3);
    }
    if (isVec(a) && isVec(b)) {
      return valsClose(a.x, b.x, tol) && valsClose(a.y, b.y, tol) &&
        ((a.dim === 3 && b.dim === 3) ? valsClose(a.z, b.z, tol) : true);
    }
    return false;
  }

  const CS_TWO_OPS = new Set(['+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '?.']);
  function tokenizeCS(src) {
    const s = normalizeCSharpPunct(src);
    const toks = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '"' || ch === "'") {
        const q = ch; i++;
        let val = '';
        while (i < s.length && s[i] !== q) {
          if (s[i] === '\\' && i + 1 < s.length) { val += s[i + 1]; i += 2; }
          else { val += s[i++]; }
        }
        i++;
        toks.push({ t: 'str', v: val });
        continue;
      }
      if (/\d/.test(ch) || (ch === '.' && /\d/.test(s[i + 1] || ''))) {
        let j = i;
        while (j < s.length && /[\d.]/.test(s[j])) j++;
        const num = parseFloat(s.slice(i, j));
        if (j < s.length && /[fFdDmM]/.test(s[j])) j++;
        toks.push({ t: 'num', v: num });
        i = j;
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        let j = i;
        while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
        toks.push({ t: 'id', v: s.slice(i, j) });
        i = j;
        continue;
      }
      const two = s.slice(i, i + 2);
      if (CS_TWO_OPS.has(two)) { toks.push({ t: 'op', v: two }); i += 2; continue; }
      toks.push({ t: 'op', v: ch });
      i++;
    }
    return toks;
  }

  function createCSParser(tokens, env) {
    let pos = 0;
    const peek = (k = 0) => tokens[pos + k] || null;
    const eat = () => tokens[pos++] || null;
    const isOp = (v, k = 0) => { const tk = peek(k); return tk && tk.t === 'op' && tk.v === v; };
    const isId = (v, k = 0) => { const tk = peek(k); return tk && tk.t === 'id' && tk.v === v; };

    function getProp(obj, prop) {
      if (obj === undefined || obj === null) return undefined;
      if (isVec(obj)) {
        if (prop === 'x') return obj.x;
        if (prop === 'y') return obj.y;
        if (prop === 'z') return obj.z;
        if (prop === 'magnitude') return vecMag(obj);
        if (prop === 'sqrMagnitude') return obj.x * obj.x + obj.y * obj.y + obj.z * obj.z;
        if (prop === 'normalized') return vecNorm(obj);
      }
      if (typeof obj === 'object' && prop in obj) return obj[prop];
      return undefined;
    }

    function callStaticOrMethod(chain, args) {
      const last = chain[chain.length - 1];
      const base = chain.slice(0, -1).join('.');
      if (base === 'Mathf' || base === 'Math') {
        if (last === 'Cos') return Math.cos(args[0]);
        if (last === 'Sin') return Math.sin(args[0]);
        if (last === 'Tan') return Math.tan(args[0]);
        if (last === 'Sqrt') return Math.sqrt(Math.max(0, args[0]));
        if (last === 'Abs') return Math.abs(args[0]);
        if (last === 'Max') return Math.max(...args);
        if (last === 'Min') return Math.min(...args);
        if (last === 'Clamp') return Math.min(args[2], Math.max(args[1], args[0]));
        if (last === 'FloorToInt' || last === 'Floor') return Math.floor(args[0]);
        if (last === 'RoundToInt' || last === 'Round') return Math.round(args[0]);
      }
      if (base === 'Vector2' || base === 'Vector3') {
        if (last === 'Dot' && isVec(args[0]) && isVec(args[1])) return vecDot(args[0], args[1]);
        if (last === 'Reflect' && isVec(args[0]) && isVec(args[1])) {
          const n = vecNorm(args[1]);
          return vecSub(args[0], vecScale(n, 2 * vecDot(args[0], n)));
        }
        if (last === 'Distance' && isVec(args[0]) && isVec(args[1])) return vecMag(vecSub(args[0], args[1]));
        if (last === 'ClampMagnitude' && isVec(args[0]) && typeof args[1] === 'number') return vecClamp(args[0], args[1]);
      }
      // Instance method on a vector variable e.g. vr.Normalize()
      if (chain.length === 2 && last === 'Normalize') {
        const target = env[chain[0]];
        if (isVec(target)) {
          const n = vecNorm(target);
          env[chain[0]] = n;
          return n;
        }
      }
      return undefined;
    }

    function parseExpr() { return parseTernary(); }

    function parseTernary() {
      const cond = parseOr();
      if (isOp('?')) {
        eat();
        const a = parseExpr();
        if (!isOp(':')) throw new Error('missing :');
        eat();
        const b = parseExpr();
        return cond ? a : b;
      }
      return cond;
    }

    function parseOr() {
      let left = parseAnd();
      while (isOp('||')) { eat(); const r = parseAnd(); left = Boolean(left || r); }
      return left;
    }

    function parseAnd() {
      let left = parseEq();
      while (isOp('&&')) { eat(); const r = parseEq(); left = Boolean(left && r); }
      return left;
    }

    function parseEq() {
      let left = parseRel();
      while (isOp('==') || isOp('!=')) {
        const op = eat().v;
        const r = parseRel();
        const eq = (isVec(left) && isVec(r)) ? valsClose(left, r, 1e-4) : (left === r);
        left = op === '==' ? eq : !eq;
      }
      return left;
    }

    function parseRel() {
      let left = parseAdd();
      while (isOp('<') || isOp('<=') || isOp('>') || isOp('>=')) {
        const op = eat().v;
        const r = parseAdd();
        if (op === '<') left = left < r;
        else if (op === '<=') left = left <= r;
        else if (op === '>') left = left > r;
        else left = left >= r;
      }
      return left;
    }

    function parseAdd() {
      let left = parseMul();
      while (isOp('+') || isOp('-')) {
        const op = eat().v;
        const r = parseMul();
        if (left === undefined || r === undefined) return undefined;
        if (isVec(left) && isVec(r)) left = op === '+' ? vecAdd(left, r) : vecSub(left, r);
        else if (typeof left === 'number' && typeof r === 'number') left = op === '+' ? left + r : left - r;
        else return undefined;
      }
      return left;
    }

    function parseMul() {
      let left = parseUnary();
      while (isOp('*') || isOp('/') || isOp('%')) {
        const op = eat().v;
        const r = parseUnary();
        if (left === undefined || r === undefined) return undefined;
        if (op === '*') {
          if (typeof left === 'number' && typeof r === 'number') left = left * r;
          else if (isVec(left) && typeof r === 'number') left = vecScale(left, r);
          else if (typeof left === 'number' && isVec(r)) left = vecScale(r, left);
          else return undefined;
        } else if (op === '/') {
          if (typeof r !== 'number' || Math.abs(r) < 1e-9) return undefined;
          if (typeof left === 'number') left = left / r;
          else if (isVec(left)) left = vecScale(left, 1 / r);
          else return undefined;
        } else {
          if (typeof left === 'number' && typeof r === 'number' && r !== 0) left = left % r;
          else return undefined;
        }
      }
      return left;
    }

    function parseUnary() {
      if (isOp('-')) {
        eat();
        const v = parseUnary();
        if (typeof v === 'number') return -v;
        if (isVec(v)) return vecScale(v, -1);
        return undefined;
      }
      if (isOp('+')) { eat(); return parseUnary(); }
      if (isOp('!')) { eat(); const v = parseUnary(); return !v; }
      return parsePrimary();
    }

    function parseArgs() {
      const args = [];
      if (!isOp('(')) return args;
      eat();
      while (peek() && !isOp(')')) {
        args.push(parseExpr());
        if (isOp(',')) eat();
        else break;
      }
      if (isOp(')')) eat();
      return args;
    }

    function parsePrimary() {
      const tk = peek();
      if (!tk) return undefined;
      if (tk.t === 'num') { eat(); return tk.v; }
      if (tk.t === 'id' && (tk.v === 'true' || tk.v === 'false')) { eat(); return tk.v === 'true'; }
      if (isOp('(')) {
        // Handle C-style cast like (float)x or (int)x
        if (peek(1)?.t === 'id' && ['float', 'int', 'double'].includes(peek(1).v) && isOp(')', 2)) {
          const castType = peek(1).v;
          eat(); eat(); eat();
          const v = parseUnary();
          return castType === 'int' && typeof v === 'number' ? Math.trunc(v) : v;
        }
        eat();
        const v = parseExpr();
        if (isOp(')')) eat();
        return parsePostfix(v, []);
      }
      if (isId('new')) {
        eat();
        const cls = eat()?.v;
        const args = parseArgs();
        let val;
        if (cls === 'Vector2') val = makeVec(args[0] || 0, args[1] || 0, 0, 2);
        else if (cls === 'Vector3') val = makeVec(args[0] || 0, args[1] || 0, args[2] || 0, 3);
        return parsePostfix(val, [cls]);
      }
      if (tk.t === 'id') {
        const chain = [eat().v];
        // Handle built-in static namespaces
        if (chain[0] === 'Mathf' || chain[0] === 'Math') {
          if (isOp('.')) {
            eat();
            const mem = eat()?.v;
            chain.push(mem);
            if (isOp('(')) return parsePostfix(callStaticOrMethod(chain, parseArgs()), chain);
            if (mem === 'Deg2Rad') return Math.PI / 180;
            if (mem === 'Rad2Deg') return 180 / Math.PI;
            if (mem === 'PI') return Math.PI;
          }
        }
        if (chain[0] === 'Vector2' || chain[0] === 'Vector3') {
          if (isOp('.')) {
            eat();
            const mem = eat()?.v;
            chain.push(mem);
            if (isOp('(')) return parsePostfix(callStaticOrMethod(chain, parseArgs()), chain);
            const d = chain[0] === 'Vector3' ? 3 : 2;
            if (mem === 'zero') return makeVec(0, 0, 0, d);
            if (mem === 'one') return makeVec(1, 1, 1, d);
            if (mem === 'right') return makeVec(1, 0, 0, d);
            if (mem === 'up') return makeVec(0, 1, 0, d);
            if (mem === 'forward') return makeVec(0, 0, 1, 3);
          }
        }
        let val = env[chain[0]];
        return parsePostfix(val, chain);
      }
      return undefined;
    }

    function parsePostfix(val, chain) {
      while (isOp('.') || isOp('?.') || isOp('(')) {
        if (isOp('(')) {
          const args = parseArgs();
          val = callStaticOrMethod(chain, args);
          continue;
        }
        eat();
        const mem = eat()?.v;
        if (!mem) break;
        chain.push(mem);
        if (isOp('(')) {
          const args = parseArgs();
          val = callStaticOrMethod(chain, args);
        } else {
          val = getProp(val, mem);
        }
      }
      return val;
    }

    return {
      evalExpression() {
        try {
          const v = parseExpr();
          return pos === tokens.length ? v : undefined;
        } catch {
          return undefined;
        }
      }
    };
  }

  function evalCSExpression(exprStr, env) {
    const clean = String(exprStr || '').trim().replace(/;+\s*$/, '');
    if (!clean) return undefined;
    const toks = tokenizeCS(clean);
    if (!toks.length) return undefined;
    return createCSParser(toks, env).evalExpression();
  }

  // Execute a sequence of simple C# statements (declarations, assignments, if/else, bounded while)
  const TYPE_PREFIX_RE = /^(?:(?:public|private|protected|readonly|const|static)\s+)*(?:var|float|double|int|bool|Vector2|Vector3|Vector2Int)\s+/;

  function splitTopLevelStatements(blockStr) {
    const src = normalizeCSharpPunct(blockStr);
    const out = [];
    let cur = '', depthParen = 0, depthBrace = 0;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch === '(') depthParen++;
      else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
      else if (ch === '{') depthBrace++;
      else if (ch === '}') {
        depthBrace = Math.max(0, depthBrace - 1);
        cur += ch;
        if (depthBrace === 0 && depthParen === 0) {
          // Check if followed by "else"
          const rest = src.slice(i + 1).trimStart();
          if (!/^else\b/.test(rest)) {
            if (cur.trim()) out.push(cur.trim());
            cur = '';
          }
        }
        continue;
      }
      if (ch === ';' && depthParen === 0 && depthBrace === 0) {
        if (cur.trim()) out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  function readBalanced(src, startIdx, openCh, closeCh) {
    let depth = 0;
    for (let i = startIdx; i < src.length; i++) {
      if (src[i] === openCh) depth++;
      else if (src[i] === closeCh) {
        depth--;
        if (depth === 0) return { inner: src.slice(startIdx + 1, i), end: i + 1 };
      }
    }
    return null;
  }

  function setEnvTarget(env, lhs, val) {
    if (val === undefined) return;
    const parts = lhs.trim().split('.');
    if (parts.length === 1) {
      env[parts[0]] = cloneVal(val);
    } else if (parts.length === 2) {
      const obj = env[parts[0]];
      if (obj && typeof obj === 'object') {
        obj[parts[1]] = cloneVal(val);
      }
    }
    env.__assigned.push({ lhs: lhs.trim(), val: cloneVal(val) });
  }

  function getEnvTarget(env, lhs) {
    const parts = lhs.trim().split('.');
    if (parts.length === 1) return env[parts[0]];
    if (parts.length === 2 && env[parts[0]]) return env[parts[0]][parts[1]];
    return undefined;
  }

  function execCSBlock(blockStr, rawEnv, depth = 0) {
    if (depth > 6) return rawEnv;
    const env = rawEnv;
    if (!env.__assigned) env.__assigned = [];
    const stmts = splitTopLevelStatements(blockStr);

    for (const rawStmt of stmts) {
      let s = rawStmt.trim();
      if (!s) continue;

      // if (cond) { ... } [else { ... }]
      if (/^if\s*\(/.test(s)) {
        const pIdx = s.indexOf('(');
        const condObj = readBalanced(s, pIdx, '(', ')');
        if (!condObj) continue;
        const condVal = evalCSExpression(condObj.inner, env);
        let rest = s.slice(condObj.end).trim();
        let thenBody = '', elseBody = '';
        if (rest.startsWith('{')) {
          const bObj = readBalanced(rest, 0, '{', '}');
          if (bObj) {
            thenBody = bObj.inner;
            rest = rest.slice(bObj.end).trim();
          }
        } else {
          const eMatch = rest.match(/\belse\b/);
          if (eMatch) {
            thenBody = rest.slice(0, eMatch.index).trim();
            rest = rest.slice(eMatch.index).trim();
          } else {
            thenBody = rest;
            rest = '';
          }
        }
        if (/^else\b/.test(rest)) {
          rest = rest.replace(/^else\b/, '').trim();
          if (rest.startsWith('{')) {
            const eb = readBalanced(rest, 0, '{', '}');
            if (eb) elseBody = eb.inner;
          } else {
            elseBody = rest;
          }
        }
        if (condVal) execCSBlock(thenBody, env, depth + 1);
        else if (elseBody) execCSBlock(elseBody, env, depth + 1);
        continue;
      }

      // bounded while (cond) { ... }
      if (/^while\s*\(/.test(s)) {
        const pIdx = s.indexOf('(');
        const condObj = readBalanced(s, pIdx, '(', ')');
        if (!condObj) continue;
        const rest = s.slice(condObj.end).trim();
        const body = rest.startsWith('{') ? (readBalanced(rest, 0, '{', '}')?.inner || '') : rest;
        let guard = 0;
        while (guard < 32 && evalCSExpression(condObj.inner, env)) {
          execCSBlock(body, env, depth + 1);
          guard++;
        }
        continue;
      }

      // Strip declaration prefix like "Vector3 " or "float " or "var "
      s = s.replace(TYPE_PREFIX_RE, '').trim();

      // ++x / x++ / --x / x--
      let mInc = s.match(/^(?:\+\+([A-Za-z_][A-Za-z0-9_.]*)|([A-Za-z_][A-Za-z0-9_.]*)\+\+)$/);
      if (mInc) {
        const name = mInc[1] || mInc[2];
        const cur = getEnvTarget(env, name);
        if (typeof cur === 'number') setEnvTarget(env, name, cur + 1);
        continue;
      }
      let mDec = s.match(/^(?:--([A-Za-z_][A-Za-z0-9_.]*)|([A-Za-z_][A-Za-z0-9_.]*)--)$/);
      if (mDec) {
        const name = mDec[1] || mDec[2];
        const cur = getEnvTarget(env, name);
        if (typeof cur === 'number') setEnvTarget(env, name, cur - 1);
        continue;
      }

      // v.Normalize()
      const mNorm = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\.Normalize\s*\(\s*\)$/);
      if (mNorm && isVec(env[mNorm[1]])) {
        setEnvTarget(env, mNorm[1], vecNorm(env[mNorm[1]]));
        continue;
      }

      // Assignment or compound assignment: lhs (+=|-=|*=|/=|%=|=) rhs
      const mAss = s.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*(\+=|-=|\*=|\/=|%=|=)\s*([\s\S]+)$/);
      if (mAss) {
        const lhs = mAss[1], op = mAss[2], rhsStr = mAss[3].trim();
        if (!rhsStr) continue;
        const rhsVal = evalCSExpression(rhsStr, env);
        if (rhsVal === undefined) continue;
        if (op === '=') {
          setEnvTarget(env, lhs, rhsVal);
        } else {
          const curVal = getEnvTarget(env, lhs);
          if (curVal === undefined) continue;
          let res;
          if (op === '+=') res = (isVec(curVal) && isVec(rhsVal)) ? vecAdd(curVal, rhsVal) : curVal + rhsVal;
          else if (op === '-=') res = (isVec(curVal) && isVec(rhsVal)) ? vecSub(curVal, rhsVal) : curVal - rhsVal;
          else if (op === '*=') res = isVec(curVal) ? vecScale(curVal, rhsVal) : curVal * rhsVal;
          else if (op === '/=') res = isVec(curVal) ? vecScale(curVal, 1 / rhsVal) : curVal / rhsVal;
          else if (op === '%=') res = curVal % rhsVal;
          setEnvTarget(env, lhs, res);
        }
      }
    }
    return env;
  }

  // Extract the inner body of a named block like `if (hitRightWall) { ... }` or `void Update() { ... }`
  function extractNamedBlock(code, headerRegex) {
    const src = normalizeCSharpPunct(code);
    const m = src.match(headerRegex);
    if (!m) return null;
    const after = m.index + m[0].length;
    const braceIdx = src.indexOf('{', after);
    if (braceIdx === -1) return null;
    // Make sure there's no semicolon before '{' (unless single-statement if)
    const between = src.slice(after, braceIdx).trim();
    if (between.includes(';')) {
      // Single-line statement without braces
      const semi = src.indexOf(';', after);
      return src.slice(after, semi + 1).trim();
    }
    const bal = readBalanced(src, braceIdx, '{', '}');
    return bal ? bal.inner : null;
  }

  // Build deterministic non-degenerate test environments for C# expression equivalence
  function buildFillTestEnvs() {
    const makeEnv = (seed) => {
      const s = seed === 1 ? 1 : 2;
      const dt = s === 1 ? 0.2 : 0.35;
      const monsterAngle = s === 1 ? 415 : -135;
      const angle = monsterAngle * Math.PI / 180;
      const ballPos = s === 1 ? makeVec(12, 25) : makeVec(-8, 42);
      const monsterPos = s === 1 ? makeVec(30, 50) : makeVec(110, 75);
      const playerPos = s === 1 ? makeVec(150, 140) : makeVec(24, 180);
      const preyPos = s === 1 ? makeVec(80, 220, 0, 3) : makeVec(140, 60, 20, 3);
      const predPos = s === 1 ? makeVec(380, 160, 0, 3) : makeVec(20, 190, -10, 3);
      return {
        dt,
        Time: { deltaTime: dt, fixedDeltaTime: dt },
        velocity: s === 1 ? makeVec(8, -10) : makeVec(5, 12),
        acceleration: s === 1 ? makeVec(1.5, -9.8) : makeVec(-2.2, -6.5),
        ballpos: cloneVal(ballPos),
        ball: { anchoredPosition: cloneVal(ballPos) },
        N: s === 1 ? makeVec(-0.6, 0.8) : makeVec(0.8, -0.6),
        monsterAngle,
        angle,
        pos: cloneVal(monsterPos),
        displacement: s === 1 ? makeVec(4.5, -3.2) : makeVec(-6.1, 7.3),
        curIndex: s === 1 ? 3 : 5,
        patternArray: { Count: s === 1 ? 4 : 6 },
        stepDistance: s === 1 ? 42 : 18,
        monster: { anchoredPosition: cloneVal(monsterPos) },
        player: { anchoredPosition: cloneVal(playerPos) },
        curDirection: s === 1 ? 1 : 6,
        i: s === 1 ? -1 : 9,
        monsterMovedDis: s === 1 ? 52.5 : 30.0,
        monsterNeedMoveDis: s === 1 ? 50.0 : 45.0,
        MonsterSpeed: s === 1 ? 120 : 85,
        vr: s === 1 ? makeVec(0.6, 0.8) : makeVec(-0.8, 0.6),
        preyVelocity: s === 1 ? makeVec(6, 5, 0, 3) : makeVec(-4, 7, 2, 3),
        predatorVelocity: s === 1 ? makeVec(1, -2, 0, 3) : makeVec(3, 1, -1, 3),
        prey: { position: cloneVal(preyPos) },
        predator: { position: cloneVal(predPos) },
        interceptTime: s === 1 ? 12.5 : 7.4,
        maxSpeed: s === 1 ? 10 : 6
      };
    };
    return [makeEnv(1), makeEnv(2)];
  }

  // Test if two C# expressions OR two C# assignment statements are mathematically equivalent!
  function areCSharpBlanksEquivalent(userRaw, ansRaw) {
    const uClean = normalizeCSharpPunct(userRaw).trim().replace(/;+\s*$/, '');
    const aClean = normalizeCSharpPunct(ansRaw).trim().replace(/;+\s*$/, '');
    if (!uClean || !aClean) return false;

    // 1. Direct normalized token match (ignores whitespace, float f suffix, Math vs Mathf, trailing ;)
    const normSig = s => s
      .replace(/\b(\d+(?:\.\d+)?)[fFdDmM]\b/g, '$1')
      .replace(/\bMath\./g, 'Mathf.')
      .replace(/\bTime\.fixedDeltaTime\b/g, 'dt')
      .replace(/\bTime\.deltaTime\b/g, 'dt')
      .replace(/==\s*true\b/g, '')
      .replace(/\s+/g, '');
    if (normSig(uClean).toLowerCase() === normSig(aClean).toLowerCase()) return true;

    // 2. Special check for modulo-8 wrap expressions over integer i in [-5..9]
    if (/\bi\b/.test(aClean) && /%/.test(aClean)) {
      let okAll = true;
      for (const testI of [-5, -3, -1, 0, 1, 4, 7, 8, 9, 10]) {
        const e1 = { i: testI, curDirection: 1 };
        const vA = evalCSExpression(aClean, e1);
        const vU = evalCSExpression(uClean, e1);
        if (typeof vA !== 'number' || typeof vU !== 'number' || Math.abs(vA - vU) > 1e-4) {
          okAll = false;
          break;
        }
      }
      if (okAll) return true;
    }

    // 3. Check whether expected answer is an assignment (has single `=` or `+=`/`-=`/`*=`/`%=`)
    const assRe = /^([A-Za-z_][A-Za-z0-9_.]*)\s*(\+=|-=|\*=|\/=|%=|=)(?!=)\s*([\s\S]+)$/;
    const aAss = aClean.match(assRe);
    const uAss = uClean.match(assRe);
    const envs = buildFillTestEnvs();

    if (aAss) {
      // Expected is an assignment statement (e.g., velocity.x = -velocity.x or velocity = 2*N*(-Dot)+velocity)
      if (!uAss) return false;
      const rootVar = aAss[1].split('.')[0];
      const uRootVar = uAss[1].split('.')[0];
      if (rootVar !== uRootVar) return false;
      let allMatch = true;
      for (const baseEnv of envs) {
        const eA = cloneVal(baseEnv);
        const eU = cloneVal(baseEnv);
        execCSBlock(aClean + ';', eA);
        execCSBlock(uClean + ';', eU);
        if (!valsClose(eA[rootVar], eU[rootVar], 1e-2)) { allMatch = false; break; }
      }
      return allMatch;
    }

    // 4. Expected is a pure expression (e.g. velocity+acceleration*dt, new Vector2(Cos,Sin), monsterMovedDis>=monsterNeedMoveDis)
    // Also gracefully allow if student wrote full assignment matching the obvious LHS (e.g. `velocity += acceleration * dt` for `velocity + acceleration * dt`)
    let uExprToEval = uClean;
    if (uAss) {
      // Expand `x += y` -> `x + y`, `x = y` -> `y`
      const lhs = uAss[1], op = uAss[2], rhs = uAss[3];
      if (op === '=') uExprToEval = rhs;
      else uExprToEval = `(${lhs}) ${op[0]} (${rhs})`;
    }

    let okExpr = true;
    for (const baseEnv of envs) {
      const vA = evalCSExpression(aClean, cloneVal(baseEnv));
      const vU = evalCSExpression(uExprToEval, cloneVal(baseEnv));
      if (vA === undefined || vU === undefined || !valsClose(vA, vU, 1e-2)) {
        okExpr = false;
        break;
      }
    }
    if (okExpr) return true;

    // 5. Boolean comparison equivalence over extra boundary env (for >=, <=, >, <)
    if (/(>=|<=|>|<)/.test(aClean) && /(>=|<=|>|<)/.test(uExprToEval)) {
      const testCases = [
        { monsterMovedDis: 40, monsterNeedMoveDis: 50 },
        { monsterMovedDis: 50, monsterNeedMoveDis: 50 },
        { monsterMovedDis: 60, monsterNeedMoveDis: 50 }
      ];
      if (testCases.every(tc => {
        const vA = evalCSExpression(aClean, tc);
        const vU = evalCSExpression(uExprToEval, tc);
        return typeof vA === 'boolean' && vA === vU;
      })) return true;
    }

    return false;
  }

  /* ========================================================================
     FLEXIBLE INTELLIGENT EVALUATORS FOR ALL 9 HANDS-ON CODING DRILLS (d1..d9)
     & HANDWRITTEN CODE QUESTIONS (c6..c9)
     ======================================================================== */
  function findMatchSnippet(rawCode, regexes) {
    const clean = stripCSharpComments(rawCode);
    for (const rx of regexes) {
      const m = clean.match(rx);
      if (m) return m[0].trim().replace(/\s+/g, ' ').slice(0, 56);
    }
    return null;
  }

  function makeChk(label, ok, matchNote, hint, partial = false) {
    return {
      label,
      ok: Boolean(ok),
      status: ok ? 'full' : (partial ? 'partial' : 'miss'),
      matchNote: ok ? (matchNote || '逻辑验证通过') : (partial ? (matchNote || '思路接近') : ''),
      hint: ok ? '' : (hint || '')
    };
  }

  function evalDrillD1(code) {
    const updBody = extractNamedBlock(code, /void\s+Update\s*\([^)]*\)/) || stripCSharpComments(code);
    const rwBody = extractNamedBlock(code, /if\s*\(\s*hitRightWall\s*\)/);
    const ceilBody = extractNamedBlock(code, /if\s*\(\s*hitCeiling\s*\)/);
    const hoopBody = extractNamedBlock(code, /if\s*\(\s*hitHoopPoint\s*\)/);
    const slopeBody = extractNamedBlock(code, /if\s*\(\s*hitSlope\s*\)/);

    // Simulate Update() on 2 test environments
    const simUpd = (v0, acc, dt, bPos) => {
      const env = {
        dt, Time: { deltaTime: dt, fixedDeltaTime: dt },
        isShoot: true,
        velocity: cloneVal(v0),
        acceleration: cloneVal(acc),
        ballpos: cloneVal(bPos),
        ball: { anchoredPosition: cloneVal(bPos) }
      };
      execCSBlock(updBody, env);
      return env;
    };
    const u1 = simUpd(makeVec(6, 4), makeVec(0, -10), 0.2, makeVec(10, 20));
    const u2 = simUpd(makeVec(-3, 9), makeVec(2, -8), 0.5, makeVec(4, 15));
    const okVel = valsClose(u1.velocity, makeVec(6, 2)) && valsClose(u2.velocity, makeVec(-2, 5));
    const okPos = (
      (valsClose(u1.ball.anchoredPosition, makeVec(11.2, 20.4)) && valsClose(u2.ball.anchoredPosition, makeVec(3, 17.5))) ||
      // Also accept if student used pre-update velocity (v0*dt) explicitly
      (valsClose(u1.ball.anchoredPosition, makeVec(11.2, 20.8)) && valsClose(u2.ball.anchoredPosition, makeVec(2.5, 19.5)))
    );

    const simBounce = (body, v0, nVec) => {
      if (!body) return null;
      const env = { velocity: cloneVal(v0), N: cloneVal(nVec) };
      execCSBlock(body, env);
      return env.velocity;
    };
    const okRW = rwBody &&
      valsClose(simBounce(rwBody, makeVec(8, -10), makeVec(-1, 0)), makeVec(-8, -10)) &&
      valsClose(simBounce(rwBody, makeVec(-5, 7), makeVec(-1, 0)), makeVec(5, 7));
    const okCeil = ceilBody &&
      valsClose(simBounce(ceilBody, makeVec(8, -10), makeVec(0, -1)), makeVec(8, 10)) &&
      valsClose(simBounce(ceilBody, makeVec(-5, 7), makeVec(0, -1)), makeVec(-5, -7));
    const okHoop = hoopBody &&
      valsClose(simBounce(hoopBody, makeVec(8, -10), makeVec(0, 1)), makeVec(-8, 10)) &&
      valsClose(simBounce(hoopBody, makeVec(-5, 7), makeVec(0, 1)), makeVec(5, -7));
    const okSlope = slopeBody &&
      valsClose(simBounce(slopeBody, makeVec(8, -10), makeVec(-0.6, 0.8)), makeVec(-7.36, 10.48), 0.05) &&
      valsClose(simBounce(slopeBody, makeVec(5, 12), makeVec(0.8, -0.6)), makeVec(10.12, 8.16), 0.05);

    return [
      makeChk('速度更新：velocity += acceleration * dt（支持任意等价交换/写法）', okVel,
        '数值仿真验证通过（两组向量用例均精准匹配）',
        '在 Update 中根据加速度更新速度：velocity = velocity + acceleration * dt; 或 velocity += acceleration * dt;'),
      makeChk('位置更新：ball.anchoredPosition = ballpos + velocity * dt', okPos,
        '数值仿真验证通过（支持 ballpos + / += 等价写法）',
        '用速度乘以 dt 更新位置：ball.anchoredPosition = ballpos + velocity * dt; 或 ball.anchoredPosition += velocity * dt;'),
      makeChk('竖直墙反射：反转 x 分量、保持 y 不变', okRW,
        findMatchSnippet(rwBody || '', [/velocity[^;\n]+/]) || '数值仿真验证通过',
        '撞竖直墙只反转水平分量：velocity.x = -velocity.x;（或 velocity.x *= -1f; / new Vector2(-velocity.x, velocity.y)）'),
      makeChk('水平天花板反射：反转 y 分量、保持 x 不变', okCeil,
        findMatchSnippet(ceilBody || '', [/velocity[^;\n]+/]) || '数值仿真验证通过',
        '撞水平板只反转竖直分量：velocity.y = -velocity.y;（或 velocity.y *= -1f;）'),
      makeChk('篮筐点反弹：速度整向量反向', okHoop,
        findMatchSnippet(hoopBody || '', [/velocity[^;\n]+/]) || '数值仿真验证通过',
        '撞篮筐点沿原路反弹：velocity = -velocity;（或 velocity *= -1f;）'),
      makeChk('斜面三脚架反射：点积投影公式或 Vector2.Reflect', okSlope,
        findMatchSnippet(slopeBody || '', [/Vector2\.(?:Reflect|Dot)[^;\n]+/, /velocity[^;\n]+/]) || '双组斜面向量仿真验证通过',
        '斜面反射公式：velocity = 2 * N * (-Vector2.Dot(velocity, N)) + velocity;（亦支持 velocity -= 2f * Vector2.Dot(velocity, N) * N 或 Vector2.Reflect(velocity, N)）')
    ];
  }

  function evalDrillD2(code) {
    const body = extractNamedBlock(code, /void\s+\w+\s*\([^)]*\)/) || stripCSharpComments(code);
    const runSim = (preyPos, preyVel, predPos, predVel, maxSpeed, dt) => {
      const env = {
        prey: { position: cloneVal(preyPos) },
        preyVelocity: cloneVal(preyVel),
        predator: { position: cloneVal(predPos) },
        predatorVelocity: cloneVal(predVel),
        transform: { position: cloneVal(predPos) },
        maxSpeed, dt,
        Time: { deltaTime: dt, fixedDeltaTime: dt }
      };
      execCSBlock(body, env);
      return env;
    };

    const e1 = runSim(makeVec(80, 220, 0, 3), makeVec(6, 5, 0, 3), makeVec(380, 160, 0, 3), makeVec(0, 0, 0, 3), 12, 0.5);
    const e2 = runSim(makeVec(20, 40, 0, 3), makeVec(4, 3, 0, 3), makeVec(100, 100, 0, 3), makeVec(1, -1, 0, 3), 4, 0.25);

    const hasVal = (env, target, tol = 0.08) => env.__assigned.some(a => valsClose(a.val, target, tol));
    const vr1 = makeVec(6, 5, 0, 3), vr2 = makeVec(3, 4, 0, 3);
    const sr1 = makeVec(-300, 60, 0, 3), sr2 = makeVec(-80, -60, 0, 3);
    const tc1 = vecMag(sr1) / vecMag(vr1); // 39.173
    const tc2 = vecMag(sr2) / vecMag(vr2); // 20.0
    const st1 = vecAdd(makeVec(80, 220, 0, 3), vecScale(makeVec(6, 5, 0, 3), tc1));
    const st2 = vecAdd(makeVec(20, 40, 0, 3), vecScale(makeVec(4, 3, 0, 3), tc2));
    const des1 = vecScale(vecSub(st1, makeVec(380, 160, 0, 3)), 1 / tc1);
    const des2 = vecScale(vecSub(st2, makeVec(100, 100, 0, 3)), 1 / tc2);
    const clp1 = vecClamp(des1, 12);
    const clp2 = vecClamp(des2, 4);
    const seek1 = vecScale(vecNorm(vecSub(st1, makeVec(380, 160, 0, 3))), 12);
    const seek2 = vecScale(vecNorm(vecSub(st2, makeVec(100, 100, 0, 3))), 4);

    const okVr = (hasVal(e1, vr1) || hasVal(e1, vecScale(vr1, -1))) && (hasVal(e2, vr2) || hasVal(e2, vecScale(vr2, -1)));
    const okSr = (hasVal(e1, sr1) || hasVal(e1, vecScale(sr1, -1)) || hasVal(e1, vecMag(sr1))) &&
                 (hasVal(e2, sr2) || hasVal(e2, vecScale(sr2, -1)) || hasVal(e2, vecMag(sr2)));
    const okTc = hasVal(e1, tc1, 0.15) && hasVal(e2, tc2, 0.15);
    const okSt = hasVal(e1, st1, 0.5) && hasVal(e2, st2, 0.5);
    const okClamp = (hasVal(e1, clp1, 0.1) && hasVal(e2, clp2, 0.1)) ||
                    (hasVal(e1, seek1, 0.1) && hasVal(e2, seek2, 0.1));

    const endPos1A = vecAdd(makeVec(380, 160, 0, 3), vecScale(clp1, 0.5));
    const endPos2A = vecAdd(makeVec(100, 100, 0, 3), vecScale(clp2, 0.25));
    const endPos1B = vecAdd(makeVec(380, 160, 0, 3), vecScale(seek1, 0.5));
    const endPos2B = vecAdd(makeVec(100, 100, 0, 3), vecScale(seek2, 0.25));
    const okMove = (
      (valsClose(e1.transform.position, endPos1A, 0.2) && valsClose(e2.transform.position, endPos2A, 0.2)) ||
      (valsClose(e1.predator.position, endPos1A, 0.2) && valsClose(e2.predator.position, endPos2A, 0.2)) ||
      (valsClose(e1.transform.position, endPos1B, 0.2) && valsClose(e2.transform.position, endPos2B, 0.2)) ||
      (valsClose(e1.predator.position, endPos1B, 0.2) && valsClose(e2.predator.position, endPos2B, 0.2))
    );

    return [
      makeChk('相对速度计算 Vr = preyVelocity - predatorVelocity（不限变量名）', okVr,
        '数值仿真通过（已识别相对速度向量）', '计算相对速度：Vector3 vr = preyVelocity - predatorVelocity;'),
      makeChk('相对距离计算 Sr = prey.position - predator.position（支持 Distance）', okSr,
        '数值仿真通过（已识别相对距离）', '计算相对距离：Vector3 sr = prey.position - predator.position;'),
      makeChk('拦截时间计算 tc = |Sr| / |Vr|', okTc,
        '数值仿真通过（tc 两组用例精准匹配）', '计算闭合时间：float interceptTime = relativeDistance.magnitude / relativeVelocity.magnitude;'),
      makeChk('预测拦截点 St = prey.position + preyVelocity * tc', okSt,
        '数值仿真通过（预测交汇点 St 精准匹配）', '计算预测点：Vector3 interceptPoint = prey.position + preyVelocity * interceptTime;'),
      makeChk('期望速度与最大速度限幅（ClampMagnitude 或归一化乘 maxSpeed）', okClamp,
        '数值仿真通过（已验证超速时限幅至 maxSpeed）', 'Vector3 desired = (interceptPoint - predator.position) / interceptTime; Vector3 newVel = Vector3.ClampMagnitude(desired, maxSpeed);'),
      makeChk('帧率无关位置更新（transform/predator.position += newVelocity * Time.deltaTime）', okMove,
        '数值仿真通过（已验证位移随 Time.deltaTime 更新）', 'transform.position += newVelocity * Time.deltaTime;（或 predator.position += ...）')
    ];
  }

  function evalDrillD3(code) {
    const body = extractNamedBlock(code, /void\s+DoPattern\s*\([^)]*\)/) || stripCSharpComments(code);
    const runSim = (initAngle, leftA, rightA, fwdDis, curIdx, count, stepDis, speed, dt) => {
      const env = {
        monsterAngle: initAngle,
        data: { fLeftAngle: leftA, fRightAngle: rightA, fForwardDis: fwdDis, fBackwardDis: 0 },
        curIndex: curIdx,
        patternArray: { Count: count },
        stepDistance: stepDis,
        MonsterSpeed: speed,
        dt, Time: { deltaTime: dt },
        monster: { anchoredPosition: makeVec(10, 20) }
      };
      // Strip the C# cast line `(ControlData)patternArray[curIndex]` so simulator uses preset `data`
      const cleanBody = body.replace(/ControlData\s+data\s*=[^;]+;/g, '');
      execCSBlock(cleanBody, env);
      return env;
    };

    // Case 1: positive overflow (400 + 90 = 490 -> 130°), completes step (95 + 10 >= 100) & wraps curIndex 3 -> 0
    const e1 = runSim(400, 90, 0, 100, 3, 4, 95, 100, 0.1);
    // Case 2: negative angle (-120 - 90 = -210 -> 150°), does NOT complete step
    const e2 = runSim(-120, 0, 90, 200, 1, 4, 10, 50, 0.2);

    const okMod360 = valsClose(e1.monsterAngle, 130, 0.05);
    const okNegFix = valsClose(e2.monsterAngle, 150, 0.05);

    const rad1 = 130 * Math.PI / 180;
    const rad2 = 150 * Math.PI / 180;
    const expV1 = makeVec(Math.cos(rad1), Math.sin(rad1));
    const expV2 = makeVec(Math.cos(rad2), Math.sin(rad2));
    const okDirVec = e1.__assigned.some(a => valsClose(a.val, expV1, 0.02)) &&
                     e2.__assigned.some(a => valsClose(a.val, expV2, 0.02));

    const expPos1 = makeVec(10 + expV1.x * 10, 20 + expV1.y * 10);
    const expPos2 = makeVec(10 + expV2.x * 10, 20 + expV2.y * 10);
    const okPos = e1.__assigned.some(a => valsClose(a.val, expPos1, 0.08)) &&
                  e2.__assigned.some(a => valsClose(a.val, expPos2, 0.08));
    const okWriteBack = valsClose(e1.monster.anchoredPosition, expPos1, 0.08) &&
                        valsClose(e2.monster.anchoredPosition, expPos2, 0.08);
    const okIdxWrap = e1.curIndex === 0 && e2.curIndex === 1;
    const okStepReset = valsClose(e1.stepDistance, 0, 1e-4) && valsClose(e2.stepDistance, 20, 0.2);

    return [
      makeChk('角度一圈归一化（monsterAngle %= 360 或等价修正）', okMod360,
        '数值仿真通过（490° → 130°）', '将角度限制在 360° 内：monsterAngle = monsterAngle % 360; 或 monsterAngle %= 360f;'),
      makeChk('负角度修正为正角（< 0 时 + 360）', okNegFix,
        '数值仿真通过（-210° → 150°）', '负角度需加 360°：if (monsterAngle < 0) monsterAngle += 360;'),
      makeChk('弧度转单位方向向量 (Cos, Sin)', okDirVec,
        '数值仿真通过（方向向量模长与角度匹配）', 'Vector2 v = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));'),
      makeChk('位置累加 pos + displacement', okPos,
        '数值仿真通过（位置位移累加准确）', 'pos = pos + displacement; 或 pos += displacement;'),
      makeChk('指令索引循环取模 curIndex %= patternArray.Count', okIdxWrap,
        '数值仿真通过（末尾索引 3 正确回绕至 0）', '完成当前指令后循环：curIndex %= patternArray.Count;（或 curIndex = (curIndex + 1) % patternArray.Count;）'),
      makeChk('重置 stepDistance = 0 并写回 monster.anchoredPosition', okStepReset && okWriteBack,
        '数值仿真通过（步长归零且位置已写回 UI 坐标）', '重置 stepDistance = 0; 并在方法末更新 monster.anchoredPosition = pos;',
        okStepReset || okWriteBack)
    ];
  }

  function evalDrillD4(code) {
    const clean = normalizeCSharpPunct(code);
    const compact = clean.replace(/\s+/g, '');

    // 1. Right-hand start direction: curDirection + 2 (or 2 + curDirection)
    const startHit = findMatchSnippet(clean, [
      /curDirection\s*\+\s*2\b/,
      /\b2\s*\+\s*curDirection\b/
    ]);

    // 2. Wrap into 0..7 safely for negative values: extract walkDir RHS or check expression numerically
    let wrapOk = false, wrapNote = '';
    const mWalk = clean.match(/walkDir\s*=\s*([^;]+);/);
    if (mWalk) {
      const expr = mWalk[1].trim();
      const testInts = [-5, -3, -1, 0, 2, 7, 8, 9];
      if (testInts.every(v => {
        const out = evalCSExpression(expr, { i: v, curDirection: 1 });
        return typeof out === 'number' && Math.abs(out - ((v + 8) % 8)) < 1e-4;
      })) {
        wrapOk = true;
        wrapNote = `等价表达式验证通过: ${expr}`;
      }
    }
    if (!wrapOk && /\((?:i\+8|8\+i|\(i%8\)\+8|8\+\(i%8\))\)%8/.test(compact)) {
      wrapOk = true;
      wrapNote = '负数安全取模公式识别通过';
    }

    // 3. Passability check
    const passHit = findMatchSnippet(clean, [
      /map\.canPassWithRowCol\s*\(\s*(?:pt|curPos\s*\+\s*dirs\[walkDir\]|dirs\[walkDir\]\s*\+\s*curPos)\s*\)/
    ]);

    // 4. Pixel target conversion
    const targetHit = findMatchSnippet(clean, [
      /target\s*=\s*map\.toXY\s*\(\s*(?:pt|curPos\s*\+\s*dirs\[walkDir\]|dirs\[walkDir\]\s*\+\s*curPos)\s*\)/
    ]);

    return [
      makeChk('右手起始方向：从 curDirection + 2 开始逆时针探测', Boolean(startHit),
        startHit ? `已识别: ${startHit}` : '', '右手优先从当前方向顺时针 +2 开始：for (int i = curDirection + 2; i > curDirection - 6; --i)'),
      makeChk('方向编号安全归一化至 0~7（兼容负数取模）', wrapOk,
        wrapNote, '防止 C# 负数取模得负值：int walkDir = (i + 8) % 8;（亦支持 ((i % 8) + 8) % 8 或三目运算）'),
      makeChk('可通行检测：map.canPassWithRowCol(pt)', Boolean(passHit),
        passHit ? `已识别: ${passHit}` : '', '判断探测格是否可通行：if (map.canPassWithRowCol(pt))'),
      makeChk('格子坐标转像素目标：target = map.toXY(pt)', Boolean(targetHit),
        targetHit ? `已识别: ${targetHit}` : '', '将可通行格转换为像素坐标：target = map.toXY(pt);')
    ];
  }

  function evalDrillD5(code) {
    const clean = normalizeCSharpPunct(code);

    const nbHit = findMatchSnippet(clean, [
      /curPos\s*\+\s*dirs\s*\[\s*[a-zA-Z_]\w*\s*\]/,
      /dirs\s*\[\s*[a-zA-Z_]\w*\s*\]\s*\+\s*curPos/
    ]);
    const obsHit = findMatchSnippet(clean, [
      /!\s*map\.canPassWithRowCol\s*\([^)]+\)/,
      /map\.canPassWithRowCol\s*\([^)]+\)\s*==\s*false\b/,
      /\bfalse\s*==\s*map\.canPassWithRowCol\s*\([^)]+\)/
    ]);
    const penHit = findMatchSnippet(clean, [
      /weight\s*\[\s*[a-zA-Z_]\w*\s*\]\s*-=\s*10(?:\.0)?f?/,
      /weight\s*\[\s*[a-zA-Z_]\w*\s*\]\s*=\s*weight\s*\[\s*[a-zA-Z_]\w*\s*\]\s*-\s*10(?:\.0)?f?/,
      /weight\s*\[\s*[a-zA-Z_]\w*\s*\]\s*=\s*-10(?:\.0)?f?\s*\+\s*weight\s*\[\s*[a-zA-Z_]\w*\s*\]/
    ]);
    const cmpHit = findMatchSnippet(clean, [
      /weight\s*\[\s*[a-zA-Z_]\w*\s*\]\s*>=?\s*maxWeight\b/,
      /\bmaxWeight\s*<=?\s*weight\s*\[\s*[a-zA-Z_]\w*\s*\]/
    ]);
    const updMax = /maxWeight\s*=\s*weight\s*\[\s*[a-zA-Z_]\w*\s*\]/.test(clean);
    const updDir = /curDirection\s*=\s*[a-zA-Z_]\w*/.test(clean);
    const okMax = Boolean(cmpHit && updMax && updDir);

    const targetHit = findMatchSnippet(clean, [
      /target\s*=\s*map\.toXY\s*\([^)]+\)/
    ]);
    const hasCurDirOffset = /(?:curPos\s*\+\s*dirs\s*\[\s*curDirection\s*\]|dirs\s*\[\s*curDirection\s*\]\s*\+\s*curPos)/.test(clean);

    return [
      makeChk('计算 8 邻域格子偏移 curPos + dirs[i]', Boolean(nbHit),
        nbHit ? `已识别: ${nbHit}` : '', '在循环中求第 i 个邻格坐标：Vector2 pnt = curPos + dirs[i];'),
      makeChk('障碍物不可通行判断（!map.canPassWithRowCol 或 == false）', Boolean(obsHit),
        obsHit ? `已识别: ${obsHit}` : '', '检查障碍：if (!map.canPassWithRowCol(pnt)) 或 == false'),
      makeChk('障碍物权重减 10 惩罚（weight[i] -= 10 等价写法）', Boolean(penHit),
        penHit ? `已识别: ${penHit}` : '', '障碍物扣权：weight[i] -= 10; 或 weight[i] = weight[i] - 10;'),
      makeChk('寻找最大权重并同步更新 maxWeight 与 curDirection', okMax,
        okMax ? `已识别: ${cmpHit}` : '', '若 weight[i] > maxWeight，则同步更新 maxWeight = weight[i]; 和 curDirection = i;',
        Boolean(cmpHit && (updMax || updDir))),
      makeChk('用最终 curDirection 计算下一步并 map.toXY 赋给 target', Boolean(targetHit && hasCurDirOffset),
        targetHit ? `已识别: ${targetHit}` : '', '计算目标像素：target = map.toXY(curPos + dirs[curDirection]);',
        Boolean(targetHit))
    ];
  }

  function evalDrillD6(code) {
    const clean = normalizeCSharpPunct(code);

    const canPassHit = findMatchSnippet(clean, [
      /(?:tileMap|TileMap|map)\.canPass\s*\(\s*pos\s*\)/i
    ]);
    const posHit = findMatchSnippet(clean, [
      /monster\.anchoredPosition\s*=\s*pos\b/,
      /monster\.anchoredPosition\s*\+=\s*displacement\b/
    ]);
    const distHit = findMatchSnippet(clean, [
      /monsterMovedDis\s*\+=\s*displacement\.magnitude\b/,
      /monsterMovedDis\s*=\s*(?:monsterMovedDis\s*\+\s*displacement\.magnitude|displacement\.magnitude\s*\+\s*monsterMovedDis)\b/
    ]);
    const cmpHit = findMatchSnippet(clean, [
      /monsterMovedDis\s*>=?\s*monsterNeedMoveDis\b/,
      /monsterNeedMoveDis\s*<=?\s*monsterMovedDis\b/
    ]);
    const stateHit = findMatchSnippet(clean, [
      /monsterState\s*=\s*(?:RoleState\.)?Tracing\b/
    ]);
    const dirHit = findMatchSnippet(clean, [
      /player\.anchoredPosition\s*-\s*monster\.anchoredPosition/
    ]);
    const normOk = /\.Normalize\s*\(\s*\)|\.normalized\b/.test(clean);
    const velHit = findMatchSnippet(clean, [
      /monsterVelocity\s*=\s*(?:[A-Za-z_]\w*(?:\.normalized)?\s*\*\s*MonsterSpeed|MonsterSpeed\s*\*\s*[A-Za-z_]\w*(?:\.normalized)?)/,
      /monsterVelocity\s*=\s*\(\s*player\.anchoredPosition\s*-\s*monster\.anchoredPosition\s*\)\.normalized\s*\*\s*MonsterSpeed/,
      /monsterVelocity\s*=\s*MonsterSpeed\s*\*\s*\(\s*player\.anchoredPosition\s*-\s*monster\.anchoredPosition\s*\)\.normalized/
    ]);
    const elseHit = findMatchSnippet(clean, [
      /else\s*\{?\s*monsterNeedMoveDis\s*=\s*0(?:\.0)?f?\s*;?\s*\}?/
    ]);

    return [
      makeChk('可通行检测：tileMap.canPass(pos)', Boolean(canPassHit),
        canPassHit ? `已识别: ${canPassHit}` : '', '判断下一步 pos 是否可通行：if (tileMap.canPass(pos))'),
      makeChk('更新角色位置并累加 displacement.magnitude', Boolean(posHit && distHit),
        distHit ? `已识别: ${distHit}` : '', '更新位置 monster.anchoredPosition = pos; 并累加 monsterMovedDis += displacement.magnitude;',
        Boolean(posHit || distHit)),
      makeChk('判断已走距离达到设定步长（>= monsterNeedMoveDis）', Boolean(cmpHit),
        cmpHit ? `已识别: ${cmpHit}` : '', '判断走完随机步长：if (monsterMovedDis >= monsterNeedMoveDis)'),
      makeChk('步长走完后切回追踪状态 RoleState.Tracing', Boolean(stateHit),
        stateHit ? `已识别: ${stateHit}` : '', '恢复追踪态：monsterState = RoleState.Tracing;'),
      makeChk('重算指向玩家的归一化向量与速度（vr * MonsterSpeed）', Boolean(dirHit && normOk && velHit),
        velHit ? `已识别: ${velHit}` : '', 'Vector2 vr = (player.anchoredPosition - monster.anchoredPosition).normalized; monsterVelocity = vr * MonsterSpeed;',
        Boolean(dirHit || velHit)),
      makeChk('else 遇障分支重置 monsterNeedMoveDis = 0', Boolean(elseHit),
        elseHit ? `已识别: ${elseHit}` : '', '不可通行时清零需走步长：else { monsterNeedMoveDis = 0; }')
    ];
  }

  function evalDrillD7(code) {
    const clean = normalizeCSharpPunct(code);

    const visHit = findMatchSnippet(clean, [/\b[A-Za-z_]\w*\.visited\s*=\s*true\b/]);
    const baseHit = findMatchSnippet(clean, [
      /\bif\s*\(\s*(?:from\s*==\s*to|to\s*==\s*from|from\.Equals\s*\(\s*to\s*\)|[A-Za-z_]\w*\s*==\s*(?:to|target|end))\s*\)[^{;]*return\s+true/
    ]);
    const unvisHit = findMatchSnippet(clean, [
      /!\s*[A-Za-z_]\w*\.visited\b/,
      /\b[A-Za-z_]\w*\.visited\s*==\s*false\b/,
      /\bfalse\s*==\s*[A-Za-z_]\w*\.visited\b/
    ]);
    const parentHit = findMatchSnippet(clean, [/\b[A-Za-z_]\w*\.parent\s*=\s*(?:from|cur|current|node)\b/]);
    const recHit = findMatchSnippet(clean, [
      /\b(?:doDFSRecursionSearch|doDFS|DFS|dfs)\s*\(\s*[A-Za-z_]\w*\s*,\s*(?:to|target|end)\s*\)/
    ]);
    // Backtrack: accept while(node.parent!=null)+Reverse, while(node!=null)+Reverse, for(...;n!=null;n=n.parent)+Reverse, OR Insert(0,...)
    const loopBackHit = findMatchSnippet(clean, [
      /while\s*\(\s*[A-Za-z_]\w*(?:\.parent)?\s*!=\s*null\s*\)/,
      /for\s*\([^;]*;\s*[A-Za-z_]\w*(?:\.parent)?\s*!=\s*null\s*;[^)]*\.parent[^)]*\)/
    ]);
    const stepParent = /[A-Za-z_]\w*\s*=\s*[A-Za-z_]\w*\.parent\b/.test(clean);
    const revOrInsert = findMatchSnippet(clean, [
      /\.Reverse\s*\(\s*\)/,
      /\.Insert\s*\(\s*0\s*,/
    ]);

    return [
      makeChk('标记当前节点 visited = true 与到达终点递归基 (from == to)', Boolean(visHit && baseHit),
        baseHit ? `已识别: ${baseHit}` : '', '递归入口先标记 from.visited = true; 并判停 if (from == to) return true;',
        Boolean(visHit || baseHit)),
      makeChk('判断邻接点未访问 (!next.visited) 并记录父节点 parent = from', Boolean(unvisHit && parentHit),
        parentHit ? `已识别: ${unvisHit} && ${parentHit}` : '', '判断 if (!next.visited) 后记录 next.parent = from;',
        Boolean(unvisHit || parentHit)),
      makeChk('递归搜索子节点并在找到时逐层返回 true', Boolean(recHit),
        recHit ? `已识别: ${recHit}` : '', '递归深入：if (doDFSRecursionSearch(next, to)) return true;'),
      makeChk('generatePath 沿 parent 链倒推并 Reverse() 反转（或头插 Insert(0)）', Boolean(loopBackHit && stepParent && revOrInsert),
        revOrInsert ? `已识别: ${loopBackHit} + ${revOrInsert}` : '', '沿 while (node.parent != null) 不断 node = node.parent 加入 path，最后 path.Reverse();',
        Boolean(loopBackHit || revOrInsert))
    ];
  }

  function evalDrillD8(code) {
    const clean = normalizeCSharpPunct(code);

    const qInitHit = findMatchSnippet(clean, [/new\s+Queue(?:<\s*MapNode\s*>)?\s*\(\s*\)/]);
    const startVis = /\b(?:start|from)\w*\.visited\s*=\s*true\b/.test(clean);
    const startEnq = /\.Enqueue\s*\(\s*(?:start|from)\w*\s*\)/.test(clean);

    const loopHit = findMatchSnippet(clean, [
      /while\s*\(\s*[A-Za-z_]\w*\.Count\s*(?:>\s*0|!=\s*0|>=\s*1)\s*\)/,
      /while\s*\(\s*0\s*(?:<|!=)\s*[A-Za-z_]\w*\.Count\s*\)/
    ]);
    const deqHit = findMatchSnippet(clean, [/[A-Za-z_]\w*\.Dequeue\s*\(\s*\)/]);

    const unvisHit = findMatchSnippet(clean, [
      /!\s*[A-Za-z_]\w*\.visited\b/,
      /\b[A-Za-z_]\w*\.visited\s*==\s*false\b/
    ]);
    const nbVis = /\b(?:next|adj|nb|neighbor)\w*\.visited\s*=\s*true\b/.test(clean);
    const nbPar = /\b(?:next|adj|nb|neighbor)\w*\.parent\s*=\s*(?:cur|current|node)\w*\b/.test(clean);

    const goalHit = findMatchSnippet(clean, [
      /\b(?:next|cur|current|adj|nb)\w*\s*==\s*(?:target|to|goal|end)\w*/,
      /\b(?:target|to|goal|end)\w*\s*==\s*(?:next|cur|current|adj|nb)\w*/
    ]);
    const nbEnq = findMatchSnippet(clean, [/\.Enqueue\s*\(\s*(?:next|adj|nb|neighbor)\w*\s*\)/]);

    return [
      makeChk('初始化 Queue<MapNode> 并将起点标记已访问、Enqueue 入队', Boolean(qInitHit && startVis && startEnq),
        qInitHit ? `已识别: ${qInitHit} + Enqueue(start)` : '', 'Queue<MapNode> queue = new Queue<MapNode>(); start.visited = true; queue.Enqueue(start);',
        Boolean(qInitHit || startEnq)),
      makeChk('队列非空循环（Count > 0 / != 0）并出队 Dequeue()', Boolean(loopHit && deqHit),
        loopHit ? `已识别: ${loopHit} + ${deqHit}` : '', 'while (queue.Count > 0) { MapNode cur = queue.Dequeue(); ... }',
        Boolean(loopHit || deqHit)),
      makeChk('邻接点判未访问 (!next.visited)、标已访并设 parent = cur', Boolean(unvisHit && nbVis && nbPar),
        unvisHit ? `已识别: ${unvisHit} + visited=true + parent=cur` : '', 'if (!next.visited) { next.visited = true; next.parent = cur; ... }',
        Boolean(unvisHit && (nbVis || nbPar))),
      makeChk('判定到达终点 (next/cur == target) 且将邻接点 Enqueue(next)', Boolean(goalHit && nbEnq),
        goalHit ? `已识别: ${goalHit} + ${nbEnq}` : '', '判终点 if (next == target) { path = generatePath(target); return true; } 否则 queue.Enqueue(next);',
        Boolean(goalHit || nbEnq))
    ];
  }

  function evalDrillD9(code) {
    const clean = normalizeCSharpPunct(code);

    // 1. IState interface declares Enter / Execute / Exit
    const ifaceBody = extractNamedBlock(clean, /interface\s+IState\b/) || clean;
    const hasEnter = /\bvoid\s+Enter\s*\(\s*Monster\b/.test(ifaceBody);
    const hasExec = /\bvoid\s+Execute\s*\(\s*Monster\b/.test(ifaceBody);
    const hasExit = /\bvoid\s+Exit\s*\(\s*Monster\b/.test(ifaceBody);
    const okIface = hasEnter && hasExec && hasExit;

    // 2. ChangeState strict chronological order: Exit -> assign newState -> Enter
    const chgBody = extractNamedBlock(clean, /void\s+ChangeState\s*\([^)]*\)/) || '';
    const exitIdx = chgBody.search(/\.?Exit\s*\(\s*this\s*\)/);
    const assignIdx = chgBody.search(/[A-Za-z_]\w*\s*=\s*(?:newState|next|state)\b/);
    const enterIdx = chgBody.search(/\.?Enter\s*\(\s*this\s*\)/);
    const okOrder = exitIdx !== -1 && assignIdx !== -1 && enterIdx !== -1 && exitIdx < assignIdx && assignIdx < enterIdx;
    const partialOrder = exitIdx !== -1 && enterIdx !== -1 && !okOrder;

    // 3. RunAway.Execute: checks IsSafe() -> ChangeState(new Patrol()) vs LeaveEnemy() (supports negated if/else & early return!)
    const runAwayBlock = extractNamedBlock(clean, /class\s+RunAway\b[^{]*/) || clean;
    const execBody = extractNamedBlock(runAwayBlock, /void\s+Execute\s*\([^)]*\)/) || runAwayBlock;
    const hasSafe = /\bIsSafe\s*\(\s*\)/.test(execBody);
    const hasPatrol = /ChangeState\s*\(\s*(?:new\s+Patrol\s*\(\s*\)|[A-Za-z_]*[Pp]atrol\w*)\s*\)/.test(execBody);
    const hasLeave = /\bLeaveEnemy\s*\(\s*\)/.test(execBody);
    // Guard against inverted logic: if (!m.IsSafe()) should lead to LeaveEnemy first, while if (m.IsSafe()) leads to Patrol first
    let logicConsistent = hasSafe && hasPatrol && hasLeave;
    if (logicConsistent) {
      const negSafe = /if\s*\(\s*!\s*[A-Za-z_]\w*\.IsSafe\s*\(\s*\)\s*\)/.test(execBody);
      const posPatrol = execBody.search(/ChangeState\s*\(/);
      const posLeave = execBody.search(/LeaveEnemy\s*\(/);
      if (negSafe && posPatrol < posLeave) logicConsistent = false;
      if (!negSafe && posLeave < posPatrol) logicConsistent = false;
    }

    return [
      makeChk('IState 接口声明 Enter / Execute / Exit 三大生命周期方法', okIface,
        '已识别 Enter / Execute / Exit 全部接口方法（不限参数名）',
        '在 interface IState 中声明：void Enter(Monster m); void Execute(Monster m); void Exit(Monster m);',
        (hasEnter || hasExec || hasExit) && !okIface),
      makeChk('ChangeState 严格按「旧.Exit → 切换赋值 → 新.Enter」顺序执行', okOrder,
        '调用时序验证通过（兼容 ?. 或 if (!= null) 判空写法）',
        partialOrder
          ? '注意顺序错误！必须严格先退出旧状态 Exit(this)，再 _currentState = newState，最后进入新状态 Enter(this)！'
          : '在 ChangeState 中按顺序写：_currentState?.Exit(this); _currentState = newState; _currentState.Enter(this);',
        partialOrder),
      makeChk('RunAway.Execute 判 IsSafe() 切 Patrol，否则执行 LeaveEnemy()', logicConsistent,
        '逻辑分支验证通过（支持正/反 if-else 与早返回写法）',
        'if (m.IsSafe()) m.ChangeState(new Patrol()); else m.LeaveEnemy();',
        hasSafe && (hasPatrol || hasLeave) && !logicConsistent)
    ];
  }

  const DRILL_EVALUATORS = {
    d1: evalDrillD1,
    d2: evalDrillD2,
    d3: evalDrillD3,
    d4: evalDrillD4,
    d5: evalDrillD5,
    d6: evalDrillD6,
    d7: evalDrillD7,
    d8: evalDrillD8,
    d9: evalDrillD9
  };

  function evaluateCodeDrill(drill, userCode) {
    const fn = DRILL_EVALUATORS[drill.id];
    let checks;
    if (fn) {
      checks = fn(userCode);
    } else {
      const nc = normalizeCSharpPunct(userCode).replace(/\s+/g, '');
      checks = (drill.checks || []).map(chk => makeChk(chk.label, chk.test(nc), '静态规则通过', drill.hint));
    }
    const totalCnt = checks.length;
    const passCnt = checks.filter(c => c.ok).length;
    const partialCnt = checks.filter(c => c.status === 'partial').length;
    const score = totalCnt ? Math.round(((passCnt + partialCnt * 0.5) / totalCnt) * 100) : 0;
    const allOk = passCnt === totalCnt && totalCnt > 0;
    const pass = score >= 60 && totalCnt > 0;
    return {
      allOk,
      pass,
      score,
      passCnt,
      partialCnt,
      totalCnt,
      checks
    };
  }

  // Convert a code drill evaluator into the 10-point subjective report schema for c6..c9!
  function evaluateCodeWriteWithEngine(drillId, rawCode) {
    const fn = DRILL_EVALUATORS[drillId];
    const checks = fn(rawCode);
    const weight = Number((10 / checks.length).toFixed(2));
    let earned = 0;
    const details = checks.map(c => {
      const e = c.status === 'full' ? weight : (c.status === 'partial' ? weight * 0.5 : 0);
      earned += e;
      return {
        label: c.label,
        weight,
        earned: Number(e.toFixed(1)),
        status: c.status,
        hits: c.matchNote ? [c.matchNote] : [],
        missHint: c.hint || ''
      };
    });
    const score = Math.min(10, Number(earned.toFixed(1)));
    const ratio = score / 10;
    const pass = ratio >= 0.6;
    const fullCnt = details.filter(d => d.status === 'full').length;
    const partCnt = details.filter(d => d.status === 'partial').length;
    let summary = '';
    if (ratio >= 0.85) summary = `代码逻辑非常扎实！智能语义/仿真检测通过 ${fullCnt}/${details.length} 项核心考点！`;
    else if (pass) summary = `代码判定达标！完整通过 ${fullCnt} 项${partCnt ? `、部分命中 ${partCnt} 项` : ''}，可参考下方细节优化至满分。`;
    else summary = `暂未达标（需 ≥ 6 分），当前通过 ${fullCnt}/${details.length} 项，已精准定位缺失或错误逻辑。`;

    return { score, maxScore: 10, pass, ratio, branchName: '智能 C# 代码语义与仿真批改', summary, details };
  }

  /* ------------------------------------------------------------------------
     Structured Rubric Definitions for e1..e8 (Essay)
     Each question sums to 10 points. Passing threshold: >= 6.0 / 10 (60%).
     ------------------------------------------------------------------------ */
  const ESSAY_RUBRICS = {
    e1: {
      points: [
        {
          label: '随机移动避障思路（直线追踪 + 遇障随机转向定步长）',
          weight: 2.5, minFull: 2,
          groups: [
            ['随机', 'random', '任意角度', '随机方向', '随机选'],
            ['碰撞', '遇障', '撞墙', '碰到障碍', '受阻', '阻挡', '障碍'],
            ['转向', '旋转', '步长', '固定距离', '一定距离', '50', '重寻', '恢复追踪', 'tracing', '直线']
          ],
          missHint: '补充说明「朝目标直线追踪，碰障后切换随机移动并按随机角度走一定步长再恢复追踪」'
        },
        {
          label: '绕行障碍物思路（沿障碍边缘顺/逆时针探测可行格）',
          weight: 2.5, minFull: 2,
          groups: [
            ['绕行', '绕开', '沿边缘', '贴着障碍', '绕过'],
            ['顺时针', '逆时针', 'dir+n', '%8', '8方向', '八方向', '8邻', '八邻', '相邻格', '邻格', '方向'],
            ['无障碍', '可通行', '可通', '可走', '空地', '能通', '脱离', '回归目标']
          ],
          missHint: '补充说明「遇障后按顺/逆时针检查 (dir+n)%8 寻找无障碍邻格绕行，并持续尝试回归目标」'
        },
        {
          label: '防死循环核心机制（绕行需记录已访问格 vs 随机不记路）',
          weight: 2.5, minFull: 1,
          groups: [
            ['已访问', '访问过', '访问记录', 'visited', '记录路径', '标记', '记路', '不走回头', '防死循环', '防止死循环', '避免死循环', '死锁', '重复走']
          ],
          missHint: '点明关键差异：绕行算法必须记录「已访问格子」防止原地死循环，而随机避障无需记录'
        },
        {
          label: '多维度对比与适用场景（难度 / 内存 / 路径效率 / 场景）',
          weight: 2.5, minFull: 2,
          groups: [
            ['简单', '容易', '实现难度', '复杂'],
            ['内存', '空间', '开销', '存储'],
            ['效率', '稳定', '路径', '震荡', '死胡同', '卡住', '盲目'],
            ['开阔', '障碍少', '城镇', '漫游', '迷宫', '复杂场景', '障碍多', '适用']
          ],
          missHint: '从实现难度、内存开销、路径效率、适用场景（开阔少障 vs 复杂多障）中至少对比两项'
        }
      ]
    },

    e2: {
      points: [
        {
          label: '沿路径走两种权重分配方法（先地形后方向 / 先夹角后碰撞）',
          weight: 2.5, minFull: 2,
          groups: [
            ['权重', '赋权', '加权', '权值', '打分', '10', '-10', '最大权'],
            ['地形', '通行', '可通', '障碍', '碰撞', '减权', '-=10'],
            ['夹角', '方向', '角度', '正前', '远近', '9', '8', '7', '6']
          ],
          missHint: '补充说明两种赋权法：①先判通/障再按方向调权；②先按夹角赋权(10..6)再对障碍减权，选最大权格'
        },
        {
          label: '四方向左手定则优先级（左 → 前 → 右 → 后）',
          weight: 2.0, minFull: 1,
          groups: [[/左.{0,4}前.{0,4}右.{0,4}后/, '左手定则', '左前右后', '优先向左']],
          missHint: '写明四方向左手定则优先级顺序：左 → 前 → 右 → 后'
        },
        {
          label: '八方向沿墙走起始方向公式与探测逻辑',
          weight: 3.0, minFull: 2,
          groups: [
            ['-2+8', 'dir-2', 'direction-2', '左手', '顺时针'],
            ['+2', 'dir+2', 'direction+2', '右手', '逆时针'],
            ['%8', '8方向', '八方向', '首个可通', '第一个可通', '更新方向', 'curdir', 'curdirection']
          ],
          missHint: '写出八方向公式：左手 (curDir-2+8)%8 顺时针、右手 (curDir+2)%8 逆时针，遇首个可通格即移动并更新方向'
        },
        {
          label: '空旷环境局限及改进思路（无墙绕圈 → 结合随机/直线探索）',
          weight: 2.5, minFull: 2,
          groups: [
            ['空旷', '开阔', '无墙', '没有墙', '摸不到墙', '找不到墙', '打转', '绕圈', '原地转', '冗余'],
            ['随机', '探索', '直线', '切换', '结合', '找墙', '新边界', '脱离']
          ],
          missHint: '说明空旷区域因无墙依托会原地打转绕圈，改进思路是结合随机/直线探索直至重新遇墙'
        }
      ]
    },

    e3: {
      points: [
        {
          label: 'BFS 完整寻路流程（队列 FIFO + 标记已访 + 记父回溯）',
          weight: 3.0, minFull: 2,
          groups: [
            ['队列', 'queue', 'fifo', '先进先出', '入队', '出队', '队头', '逐层', '层次'],
            ['已访问', 'visited', '标记', '邻接', '8方向', '邻居'],
            ['父节点', 'parent', '回溯', '倒推', '反转', 'reverse', '队空']
          ],
          missHint: '补全 BFS 流程：使用队列(FIFO)起点入队并标已访，出队扩展邻接点、记父节点，达终点沿父回溯反转'
        },
        {
          label: 'DFS 非递归完整步骤（栈 FILO + 压栈弹栈 + 回溯）',
          weight: 3.0, minFull: 2,
          groups: [
            ['栈', 'stack', 'filo', 'lifo', '后进先出', '先进后出', '入栈', '出栈', '压栈', '弹栈', '栈顶'],
            ['已访问', 'visited', '标记', '邻接', '深度', '一路到底', '一条路'],
            ['父节点', 'parent', '回溯', '栈空', '起点入栈']
          ],
          missHint: '补全 DFS 非递归步骤：使用栈(FILO)压入起点，循环弹栈顶判终点、标已访并将未访邻接点记父入栈'
        },
        {
          label: '最优性对比（DFS 不保最短 / BFS 无权最短 / Dijkstra 带权最短）',
          weight: 2.5, minFull: 2,
          groups: [
            ['不保证最短', '不一定最短', '不能保证最短', '非最优', '不最优', '不一定最优'],
            ['无权', '等权', '边数最少', /bfs.{0,12}最短/],
            ['dijkstra', '迪杰斯特拉', '带权', '非负权', '权重', '优先队列', '最小堆', '松弛', '总代价']
          ],
          missHint: '对比三者最优性：DFS 不保证最短路；BFS 保证无权图最短路；Dijkstra 保证非负带权图最短路'
        },
        {
          label: '空间开销、适用场景及 BFS 与 Dijkstra 的特例关系',
          weight: 1.5, minFull: 1,
          groups: [
            ['特例', '权值相等', '权重相等', '边权相同', '权为1', '权重为1', '内存小', '内存大', '空间开销', '迷宫生成', '连通性']
          ],
          missHint: '可补充空间开销差异（DFS 省内存、BFS 队列占内存大）及「BFS 是 Dijkstra 边权相等时的特例」'
        }
      ]
    },

    e4: {
      points: [
        {
          label: 'A* 估价函数 f(n)=g(n)+h(n) 及三项含义',
          weight: 2.5, minFull: 2,
          groups: [
            ['f=g+h', 'f(n)=g(n)+h(n)', 'g(n)+h(n)', 'g+h'],
            ['实际代价', '已走', '起点到当前', '起点到n', '直10', '斜14', '真实距离'],
            ['估计', '预估', '启发', '当前到终点', '到目标', '曼哈顿', '欧氏', '欧几里得']
          ],
          missHint: '写清 f(n)=g(n)+h(n)，其中 g(n) 为起点到当前实际代价(直10/斜14)，h(n) 为到目标启发预估代价'
        },
        {
          label: '启发函数可采纳性要求（h(n) ≤ h*(n)，绝不高估）',
          weight: 2.0, minFull: 1,
          groups: [
            ['可采纳', '不高估', '不能高估', '不超过真实', '小于等于真实', 'h<=h*', 'h(n)<=h*(n)', 'h<=真实', '最优解的前提', '保证最优']
          ],
          missHint: '明确可采纳性条件：h(n) ≤ h*(n)（估算值绝不高估到终点的真实代价），才能保证找到最优路径'
        },
        {
          label: 'Open / Close 双列表作用与主循环核心步骤',
          weight: 3.0, minFull: 2,
          groups: [
            ['open', '开放列表', '待考察', '待处理', '待扩展'],
            ['close', '关闭列表', '已考察', '已处理', '已扩展'],
            ['f最小', '最小f', '最小估值', '更新g', '更小', '父节点', 'parent', '回溯', '8邻', '八邻']
          ],
          missHint: '说明 Open(待处理)与 Close(已处理)表，及循环取最小 f 节点、移入 Close、扩展邻格并更新更优 g 与父节点'
        },
        {
          label: 'A* 优化策略（答出多项：优先队列/最小堆、双向、分层、影响力映射等）',
          weight: 2.5, minFull: 3,
          groups: [
            ['优先队列', '最小堆', '二叉堆', 'heap', 'ologn', 'o(logn)'],
            ['f相同', 'h更小', 'tie', '打破平局', '权重h', '加权a*'],
            ['双向', 'bidirectional'],
            ['分层', 'hpa', '路点', 'navmesh', '导航网格', '跳点', 'jps', '抽象'],
            ['平滑', '拉直', '拐点', '贝塞尔', '缓存', '预计算', '分帧', '预算'],
            ['影响力', '地形', '代价', '危险', '动态重开', 'close重开', 'orca', '避障']
          ],
          missHint: '列举至少 3~4 种优化（如优先队列/最小堆、f相同时选h小、双向A*、分层寻路/路点、路径平滑、影响力映射等）'
        }
      ]
    },

    e5: {
      points: [
        {
          label: 'FSM 四大组成要素（状态、初始状态、输入、转换）',
          weight: 2.5, minFull: 3,
          groups: [['状态'], ['初始状态', '初态', '起始状态'], ['输入', '事件', '触发条件', '条件'], ['转换', '转移', '迁移']],
          missHint: '按序完整写出 FSM 四大要素：状态、初始状态、输入（事件）、转换（转换函数）'
        },
        {
          label: '守卫 4 个状态及初始状态标注（Patrol / Chase / Attack / Dead）',
          weight: 2.5, minFull: 3,
          groups: [['巡逻', 'patrol'], ['追逐', '追击', 'chase'], ['攻击', 'attack'], ['死亡', 'dead', '终止']],
          missHint: '列出全部 4 个状态（巡逻 Patrol 为初始态、追逐 Chase、攻击 Attack、死亡 Dead）'
        },
        {
          label: '核心状态迁移关系与触发事件（迁移图/迁移表要点）',
          weight: 2.5, minFull: 3,
          groups: [
            ['发现玩家', '看到玩家', '发现敌人'],
            ['射程', '攻击范围', '足够近'],
            ['脱离', '离开', '很远', '丢失', '超出'],
            ['hp=0', 'hp==0', '血量归0', '生命值归0', '生命归0', '生命为0', '血量为0', '归零', '血量0', '生命0']
          ],
          missHint: '写清各边触发条件：发现玩家、进入/脱离射程、玩家离开/很远，以及前三态 HP=0 均转死亡'
        },
        {
          label: '为何从分支逻辑法重构为状态设计模式',
          weight: 2.5, minFull: 2,
          groups: [
            ['switch', 'if-else', 'ifelse', '分支', '面条代码', '臃肿', '耦合', '难维护', '难以维护'],
            ['状态模式', 'statepattern', 'istate', '独立类', '封装成类', '封装为类', '解耦', '开闭原则', '易扩展', 'enter', 'execute', 'exit', 'context']
          ],
          missHint: '对比说明分支逻辑法(switch-case)状态多时臃肿高耦合，状态模式(Context+IState)解耦且符合开闭原则'
        }
      ]
    },

    e6: {
      branchSets: [
        {
          branchName: '吃豆人 Blinky 方案',
          points: [
            {
              label: 'Blinky 核心状态集合（上升/追逐/随机/逃离/死亡）',
              weight: 4.5, minFull: 4,
              groups: [
                ['上升', '出中央', '出发', '出生'],
                ['追逐', '追击', '追玩家', 'chase'],
                ['随机', '漫游', '散开', 'wander', 'scatter'],
                ['逃离', '逃跑', '惊恐', '害怕', 'flee', 'frightened'],
                ['死亡', '眼珠', '回家', 'dead']
              ],
              missHint: '完整列出 Blinky 5 个状态：上升(初始)、追逐玩家、随机移动、逃离玩家、死亡(眼珠)'
            },
            {
              label: 'Blinky 状态迁移触发事件闭环',
              weight: 5.5, minFull: 3,
              groups: [
                ['中央', '迷宫中央', '退出中央', '走出'],
                ['玩家死', '玩家挂', '再生', '复活', '重生'],
                ['能量球', '大力丸', '能量豆', '用尽', '失效', '时间到'],
                ['被吃', '被玩家吃', '回到中央', '回中央']
              ],
              missHint: '补齐迁移边：出中央→追逐；玩家死/再生↔随机；吃能量球/用尽↔逃离；被吃→死亡→回中央→上升'
            }
          ]
        },
        {
          branchName: '蚂蚁世界方案',
          points: [
            {
              label: '蚂蚁世界核心状态集合（饥饿找食物/回家/口渴找水/死亡）',
              weight: 4.5, minFull: 3,
              groups: [['饥饿', '找食物', '觅食', '寻食'], ['回家', '回巢', '搬运', '送食物', '返巢'], ['口渴', '找水', '水源', '喝水'], ['死亡', '死']],
              missHint: '完整列出蚂蚁世界 4 个状态：饥饿(找食物，初始态)、回家、口渴(找水源)、死亡'
            },
            {
              label: '蚂蚁世界状态迁移闭环与毒物致死边',
              weight: 5.5, minFull: 3,
              groups: [
                ['找到食物', '发现食物', '拿到食物', '吃到食物'],
                ['回到巢穴', '回巢', '放下食物', '放食物', '到家'],
                ['找到水', '发现水', '喝到水', '喝水'],
                ['毒物', '毒药', '中毒', '有毒', '碰到毒']
              ],
              missHint: '补齐迁移条件：找到食物→回家→回巢放食物→口渴→找到水源→饥饿；前三态碰毒物→死亡'
            }
          ]
        }
      ]
    },

    e7: {
      points: [
        {
          label: '顺序节点 (Sequence) 无法及时中断的原因剖析',
          weight: 2.5, minFull: 2,
          groups: [
            ['running', '运行中', '多帧', '持续执行', '未完成'],
            ['记住', '续跑', '继续执行', '直接执行', '跳过', '不重新检查', '不重检', '不会检查', '无法中断', '不能中断', '不能打断', '傻跑']
          ],
          missHint: '点明痛点：Sequence 会记住返回 Running 的移动节点，下帧直接续跑并跳过前置条件「看到玩家？」，无法中断'
        },
        {
          label: 'Parallel 并行节点 + Until Failure 修饰节点解决方案',
          weight: 3.0, minFull: 2,
          groups: [
            ['并行', 'parallel', '同时执行', '并发'],
            ['修饰', 'decorator', 'untilfailure', 'until failure', '直到失败', '持续监控', '持续检测', '循环检测']
          ],
          missHint: '使用【并行节点 (Parallel)】同时驱动【Until Failure 修饰节点包裹“看到玩家？”】与【顺序节点(移动→攻击)】'
        },
        {
          label: '中断触发的精确执行原理',
          weight: 2.0, minFull: 2,
          groups: [
            ['消失', '看不到', '离开视野', '丢失'],
            ['failure', '失败', '返回假', 'false'],
            ['终止', '中断', '打断', '停止', '取消']
          ],
          missHint: '说明中断链路：玩家消失 → 条件返 Failure → Until Failure 结束返 Failure → Parallel 立即终止全部子节点'
        },
        {
          label: '行为树 (BT) 与有限状态机 (FSM) 多维度对比',
          weight: 2.5, minFull: 2,
          groups: [
            ['树状', '树形', '层级', '图状', '网状'],
            ['复用', '模块', '状态爆炸', '扩展', '维护'],
            ['并行', '并发', '中断'],
            ['复杂', '动态', '简单', '固定', '混用', '结合']
          ],
          missHint: '从结构(树 vs 图)、复用与防状态爆炸、并行/中断支持、适用场景至少对比 2 个维度'
        }
      ]
    },

    e8: {
      points: [
        {
          label: '拦截算法核心步骤与公式（Vr、Sr、tc、St、Seek 限幅）',
          weight: 3.0, minFull: 3,
          groups: [
            ['相对速度', 'vr', 'vprey-vpred', 'vt-vp'],
            ['相对距离', 'sr', 'sprey-spred', 'pt-pp'],
            ['拦截时间', '闭合时间', 'tc', '|sr|/|vr|', 'sr/vr'],
            ['拦截点', '预测点', '交汇点', 'st', 'vprey*tc', 'vt*tc']
          ],
          missHint: '完整写出 6 步公式：Vr=Vprey-Vpred、Sr=Sprey-Spred、tc=|Sr|/|Vr|、St=Sprey+Vprey*tc、限幅移动'
        },
        {
          label: '中间量 Vr=(6,5), |Vr|≈7.81 与 Sr=(-300,60), |Sr|≈305.94',
          weight: 2.5,
          customEval: (text, compact, nums) => {
            const okVr = hasNumberNear(nums, 7.81, 0.16) || compact.includes('√61') || compact.includes('sqrt(61)');
            const okSr = hasNumberNear(nums, 305.94, 2.5) || hasNumberNear(nums, -300, 0.5) || compact.includes('93600');
            if (okVr && okSr) return { status: 'full', hits: ['|Vr|≈7.81', '|Sr|≈305.94'] };
            if (okVr || okSr) return { status: 'partial', hits: [okVr ? '|Vr|≈7.81' : '|Sr|≈305.94'] };
            return { status: 'miss', hits: [] };
          },
          missHint: '代入数值计算 Vr=(6,5), |Vr|=√61≈7.81；Sr=(-300,60), |Sr|=√93600≈305.94'
        },
        {
          label: '闭合拦截时间 tc = |Sr| / |Vr| ≈ 39.17',
          weight: 2.0,
          customEval: (text, compact, nums) => (hasNumberNear(nums, 39.17, 0.8) ? { status: 'full', hits: ['tc≈39.17'] } : { status: 'miss', hits: [] }),
          missHint: '计算拦截时间 tc = 305.94 / 7.81 ≈ 39.17'
        },
        {
          label: '最终预测拦截点 St ≈ (315.0, 415.9)',
          weight: 2.5,
          customEval: (text, compact, nums) => {
            const okX = hasNumberNear(nums, 315.0, 4.5);
            const okY = hasNumberNear(nums, 415.9, 4.5);
            if (okX && okY) return { status: 'full', hits: ['St≈(315.0, 415.9)'] };
            if (okX || okY) return { status: 'partial', hits: [okX ? 'St.x≈315' : 'St.y≈416'] };
            return { status: 'miss', hits: [] };
          },
          missHint: '计算预测坐标 St = (80 + 6×39.17, 220 + 5×39.17) ≈ (315.0, 415.9)'
        }
      ]
    },

    e9: {
      points: [
        {
          label: '顶层选择节点 Selector (?) 及从左到右优先级结构',
          weight: 3.0, minFull: 2,
          groups: [
            ['selector', '选择节点', '?', '或逻辑'],
            ['优先级', '从左到右', '高到低', '保命优先']
          ],
          missHint: '在画板顶层使用 Selector (?)，并按「保命 → 战斗 → 巡逻」从左到右排列子节点'
        },
        {
          label: '最高优先级：低血量撤退/回血分支（Sequence → 条件 + 行为）',
          weight: 2.5, minFull: 2,
          groups: [
            ['低血量', '血量低', '残血', '血少', 'hp', 'lowhp', 'lowhealth'],
            ['撤退', '逃跑', '回血', '治疗', '加血', '躲避', 'retreat', 'heal', 'flee']
          ],
          missHint: '最左侧挂接 Sequence：条件叶【低血量？】 + 行为叶【撤退/回血】'
        },
        {
          label: '中/低优先级：发现敌人战斗分支（移动+攻击）与默认巡逻兜底',
          weight: 2.5, minFull: 2,
          groups: [
            ['发现敌人', '看到敌人', '发现玩家', '看到玩家', 'enemy', 'player'],
            ['攻击', '打', '移动', '追击', '追踪', 'attack', 'move', 'chase'],
            ['巡逻', '待机', '默认', 'patrol', 'idle']
          ],
          missHint: '中间挂接 Sequence(发现敌人？ → 移动 → 攻击)，最右侧挂接默认行为【巡逻】'
        },
        {
          label: 'Selector 与 Sequence 节点返回值执行规则',
          weight: 2.0, minFull: 2,
          groups: [
            ['success', '成功', 'running', '运行中'],
            ['failure', '失败', '全部失败', '任一失败', '终止']
          ],
          missHint: '补充说明规则：Selector 遇 Success/Running 即返回，全败返 Failure；Sequence 遇 Failure 即返 Failure，全成返 Success'
        }
      ]
    },

    e10: {
      points: [
        {
          label: '起点 S(12)→终点 G(17) 合法路径与禁止切角 (Corner Cut) 规则',
          weight: 4.0, minFull: 2,
          groups: [
            ['12', '7', '1', '2', '3', '10', '17', '6'],
            ['切角', '角点', 'cornercut', '斜穿', '障碍', '绕过', '8', '14']
          ],
          missHint: '在下方网格画板绘制 S(12)→G(17) 的无障且不斜穿障碍角的路径（顶部绕开 8 号壁）'
        },
        {
          label: '最优最短路径总代价 g* = 72',
          weight: 3.5, minFull: 1,
          groups: [
            ['72', '72分', '最优72', '代价72', 'g=72', 'g*=72']
          ],
          missHint: '最优路径需从上方绕过 [8,14]（如 12-7-1-2-3-10-17 或 12-6-1-2-3-10-17），总代价 g*=72'
        },
        {
          label: 'A* 估价 f(n)=g(n)+h(n)（直10/斜14）与曼哈顿距离算式说明',
          weight: 2.5, minFull: 2,
          groups: [
            ['曼哈顿', 'manhattan', '(|r1-r2|+|c1-c2|)', 'h='],
            ['10', '14', '直10', '斜14', 'f=', 'g=', 'open', 'close']
          ],
          missHint: '可补充直走+10、斜走+14 及关键转折格 f=g+h（曼哈顿 h）的选取说明'
        }
      ]
    }
  };

  /* ========================================================================
     FLEXIBLE INTELLIGENT DIAGRAM GRADER (FSM & BEHAVIOR TREE TOPOLOGY ENGINE)
     ======================================================================== */
  function normDiaStr(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[（【［\[\]】）?？!！:：,，。.\s_\-—/]/g, '')
      .trim();
  }

  function matchSemSynonyms(rawStr, syns) {
    const rawLow = String(rawStr || '').toLowerCase();
    const clean = normDiaStr(rawStr);
    if (!clean) return false;
    for (const tok of syns) {
      const tLow = String(tok).toLowerCase();
      const tClean = normDiaStr(tok);
      if (!tClean) continue;
      // Avoid accidental substring match for 1-char Latin symbols unless whole label equals it
      if (/^[a-z0-9?→⇉◇]$/.test(tClean)) {
        if (clean === tClean || rawLow.includes(tLow)) return true;
        continue;
      }
      if (/^[a-z0-9]+$/.test(tClean) && tClean.length <= 3) {
        const re = new RegExp(`(?:^|[^a-z0-9])${tClean}(?:$|[^a-z0-9])`, 'i');
        if (re.test(rawLow) || clean === tClean) return true;
        continue;
      }
      if (clean.includes(tClean) || rawLow.includes(tLow)) return true;
    }
    return false;
  }

  function matchNodeRoleAndSem(node, syns, acceptedTypes = null) {
    if (!node) return false;
    const typeOk = !acceptedTypes || acceptedTypes.includes(node.nodeType);
    const semOk = matchSemSynonyms(node.label, syns);
    if (acceptedTypes && acceptedTypes.includes(node.nodeType) && !syns.length) return true;
    if (semOk) return true;
    // If user drew a specific BT shape (e.g. Parallel) and left default label, type alone is enough when syns are type names
    if (typeOk && acceptedTypes && acceptedTypes.some(t => normDiaStr(node.label).includes(t))) return true;
    return false;
  }

  function setStatusMax(map, key, val) {
    if (!key) return;
    const rank = { miss: 0, partial: 1, full: 2 };
    if (!map[key] || rank[val] > rank[map[key]]) map[key] = val;
  }

  const FSM_GRAPH_SPECS = {
    guard: {
      branchName: '守卫 AI (4态)',
      initialKey: 'patrol',
      states: [
        { key: 'patrol', name: '巡逻 (Patrol)', syns: ['巡逻', 'patrol', '警戒', '待机'] },
        { key: 'chase',  name: '追逐 (Chase)',  syns: ['追逐', '追击', '追踪', 'chase', 'pursue'] },
        { key: 'attack', name: '攻击 (Attack)', syns: ['攻击', '战斗', '开火', 'attack', 'fight'] },
        { key: 'dead',   name: '死亡 (Dead)',   syns: ['死亡', '阵亡', '死', 'dead', 'die', 'death'] }
      ],
      edges: [
        { from: 'patrol', to: 'chase',  label: '发现玩家 → 追逐', evSyns: ['发现玩家', '看到玩家', '发现敌人', '看见玩家', '发现', '看见', 'see', 'detect', 'spot'], req: true },
        { from: 'chase',  to: 'attack', label: '进入射程 → 攻击', evSyns: ['射程', '攻击范围', '足够近', '靠近', 'range', 'close', 'near'], req: true },
        { from: 'chase',  to: 'patrol', label: '玩家离开 → 巡逻', evSyns: ['离开', '丢失', '脱离', '找不到', '远离', '超出', 'lost', 'leave', 'far'], req: true },
        { from: 'attack', to: 'chase',  label: '脱离射程 → 追逐', evSyns: ['脱离', '超出', '离开射程', '跑出', '远离', 'out', 'leave', 'range'], req: true },
        { from: 'attack', to: 'patrol', label: '玩家很远 → 巡逻', evSyns: ['很远', '离开', '脱离', '丢失', 'far', 'lost', 'leave'], req: false },
        { from: 'patrol', to: 'dead',   label: 'HP=0 → 死亡', evSyns: ['hp=0', 'hp==0', 'hp<=0', 'hp0', '血量', '生命', '归0', '为0', '归零', 'die', 'kill', '死亡'], group: 'die' },
        { from: 'chase',  to: 'dead',   label: 'HP=0 → 死亡', evSyns: ['hp=0', 'hp==0', 'hp<=0', 'hp0', '血量', '生命', '归0', '为0', '归零', 'die', 'kill', '死亡'], group: 'die' },
        { from: 'attack', to: 'dead',   label: 'HP=0 → 死亡', evSyns: ['hp=0', 'hp==0', 'hp<=0', 'hp0', '血量', '生命', '归0', '为0', '归零', 'die', 'kill', '死亡'], group: 'die' }
      ]
    },
    blinky: {
      branchName: '吃豆人 Blinky 方案',
      initialKey: 'rise',
      states: [
        { key: 'rise',   name: '上升 (初始)',   syns: ['上升', '出中央', '出生', '离开中央', 'rise', 'spawn'] },
        { key: 'chase',  name: '追逐玩家',      syns: ['追逐', '追击', '追玩家', 'chase'] },
        { key: 'random', name: '随机移动',      syns: ['随机', '漫游', '散开', 'random', 'scatter', 'wander'] },
        { key: 'flee',   name: '逃离玩家',      syns: ['逃离', '逃跑', '惊恐', '害怕', 'flee', 'frightened', 'runaway'] },
        { key: 'dead',   name: '死亡 (眼珠)',   syns: ['死亡', '眼珠', '回家', 'dead', 'eyes'] }
      ],
      edges: [
        { from: 'rise',   to: 'chase',  label: '出中央 → 追逐', evSyns: ['中央', '走出', '退出', '离开', 'exit', 'out'], req: true },
        { from: 'chase',  to: 'random', label: '玩家死亡 → 随机', evSyns: ['玩家死', '死', '挂', 'die', 'killed'], req: true },
        { from: 'random', to: 'chase',  label: '玩家再生 → 追逐', evSyns: ['再生', '复活', '重生', 'respawn', 'revive'], req: true },
        { from: 'chase',  to: 'flee',   label: '吃能量球 → 逃离', evSyns: ['能量', '大力丸', '豆', '吃球', 'power', 'pellet', 'energizer'], req: true },
        { from: 'flee',   to: 'chase',  label: '能量用尽 → 追逐', evSyns: ['用尽', '失效', '时间', '结束', '恢复', 'expire', 'timeout', 'over'], req: true },
        { from: 'flee',   to: 'dead',   label: '被吃 → 死亡', evSyns: ['被吃', '吃掉', '抓', 'eaten', 'caught'], req: true },
        { from: 'dead',   to: 'rise',   label: '回到中央 → 上升', evSyns: ['中央', '回', '复活', 'center', 'home'], altTo: 'chase', req: true }
      ]
    },
    ant: {
      branchName: '蚂蚁世界方案',
      initialKey: 'hungry',
      states: [
        { key: 'hungry',  name: '饥饿 (找食物)', syns: ['饥饿', '饿', '找食物', '觅食', '寻食', 'hungry', 'food', 'forage'] },
        { key: 'home',    name: '回家 (搬运)',   syns: ['回家', '回巢', '搬运', '送食物', '返巢', 'home', 'nest', 'return'] },
        { key: 'thirsty', name: '口渴 (找水源)', syns: ['口渴', '渴', '找水', '水源', '喝水', 'thirsty', 'water', 'drink'] },
        { key: 'dead',    name: '死亡',          syns: ['死亡', '死', '中毒', 'dead', 'die'] }
      ],
      edges: [
        { from: 'hungry',  to: 'home',    label: '找到食物 → 回家', evSyns: ['食物', '找到', '拿到', 'food'], req: true },
        { from: 'home',    to: 'thirsty', label: '回巢放食物 → 口渴', evSyns: ['巢', '家', '放下', '回', 'nest', 'home', 'drop'], req: true },
        { from: 'thirsty', to: 'hungry',  label: '找到水源 → 饥饿', evSyns: ['水', '喝', 'water', 'drink'], req: true },
        { from: 'hungry',  to: 'dead',    label: '毒物 → 死亡', evSyns: ['毒', 'poison', 'toxic'], group: 'die' },
        { from: 'home',    to: 'dead',    label: '毒物 → 死亡', evSyns: ['毒', 'poison', 'toxic'], group: 'die' },
        { from: 'thirsty', to: 'dead',    label: '毒物 → 死亡', evSyns: ['毒', 'poison', 'toxic'], group: 'die' }
      ]
    }
  };

  function measureNodeLabelPx(label) {
    let sum = 0;
    for (const ch of String(label || '')) {
      sum += /[\u2E80-\u9FFF\uFF00-\uFFEF]/.test(ch) ? 12.5 : 7.2;
    }
    return Math.max(24, sum);
  }

  function resolveLooseEdges(nodes, rawEdges) {
    const edges = Array.isArray(rawEdges) ? rawEdges : [];
    const findNearNode = (pt) => {
      if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return null;
      let bestId = null, bestD = 28;
      for (const n of nodes) {
        const isBtNode = Boolean(n.nodeType && n.nodeType !== 'state');
        const tw = measureNodeLabelPx(n.label);
        const hw = isBtNode
          ? Math.min(160, Math.max(56, Math.ceil(tw / 2 + 16)))
          : Math.min(150, Math.max(38, Math.ceil(tw / 2 + 15)));
        const hh = isBtNode ? 18 : 28;
        const dx = Math.max(0, Math.abs(pt.x - n.x) - hw);
        const dy = Math.max(0, Math.abs(pt.y - n.y) - hh);
        const borderDist = Math.hypot(dx, dy);
        if (borderDist <= bestD) { bestD = borderDist; bestId = n.id; }
      }
      return bestId;
    };
    return edges.map(e => {
      const from = e.from || findNearNode(e.fromPt);
      const to = e.to || findNearNode(e.toPt);
      return { ...e, from, to };
    });
  }

  function evalFSMDiagramSpec(diagram, spec) {
    const nodes = Array.isArray(diagram?.nodes) ? diagram.nodes : [];
    const edges = resolveLooseEdges(nodes, diagram?.edges);
    const nodeStatuses = {};
    const edgeStatuses = {};

    // Map each spec state key -> matched node ids (support multiple or 1-to-1)
    const stateMap = {};
    const matchedStates = [];
    const missedStates = [];
    for (const st of spec.states) {
      const hits = nodes.filter(n => matchSemSynonyms(n.label, st.syns));
      stateMap[st.key] = hits.map(n => n.id);
      if (hits.length) {
        matchedStates.push(st.name);
        hits.forEach(n => setStatusMax(nodeStatuses, n.id, 'full'));
      } else {
        missedStates.push(st.name);
      }
    }

    // Check initial state marker (isInitial flag OR separate Start/初始 node pointing to it)
    const initTargetIds = new Set(stateMap[spec.initialKey] || []);
    const markedInitNodes = nodes.filter(n => n.isInitial);
    const startPseudoNodes = nodes.filter(n => matchSemSynonyms(n.label, ['开始', '初始', '起点', 'start', 'init']));
    let initOk = false;
    if (markedInitNodes.some(n => initTargetIds.has(n.id))) {
      initOk = true;
    } else if (startPseudoNodes.length) {
      for (const sn of startPseudoNodes) {
        if (edges.some(e => e.from === sn.id && initTargetIds.has(e.to))) {
          initOk = true;
          setStatusMax(nodeStatuses, sn.id, 'full');
        }
      }
    }

    // Check directed transitions
    let reqEdgeScore = 0, reqEdgeMax = 0;
    const matchedEdges = [];
    const missedEdges = [];
    let dieEdgesHit = 0;
    const dieEdgesTotal = spec.edges.filter(e => e.group === 'die').length;

    for (const r of spec.edges) {
      const fromIds = new Set(stateMap[r.from] || []);
      const toIds = new Set(stateMap[r.to] || []);
      const altToIds = r.altTo ? new Set(stateMap[r.altTo] || []) : null;

      let bestEd = null, bestRank = 0;
      for (const e of edges) {
        if (!fromIds.has(e.from)) continue;
        const hitDirect = toIds.has(e.to);
        const hitAlt = altToIds && altToIds.has(e.to);
        if (!hitDirect && !hitAlt) continue;
        const evOk = matchSemSynonyms(e.label, r.evSyns);
        const rank = hitDirect ? (evOk ? 3 : 2) : (evOk ? 2 : 1);
        if (rank > bestRank) { bestRank = rank; bestEd = e; }
      }

      if (bestEd) {
        if (r.group === 'die') dieEdgesHit++;
        else {
          reqEdgeMax += 1;
          reqEdgeScore += bestRank === 3 ? 1 : (bestRank === 2 ? 0.7 : 0.5);
        }
        setStatusMax(edgeStatuses, bestEd.id, bestRank === 3 ? 'full' : 'partial');
        matchedEdges.push(r.label);
      } else {
        if (r.group !== 'die' && r.req) reqEdgeMax += 1;
        if (r.req) missedEdges.push(r.label);
      }
    }

    // Also credit shared death transition node if present
    const dieRatio = dieEdgesTotal ? Math.min(1, dieEdgesHit / Math.max(1, dieEdgesTotal)) : 1;
    if (dieEdgesTotal > 0) {
      reqEdgeMax += 1;
      reqEdgeScore += dieRatio;
      if (dieEdgesHit === 0) missedEdges.push('前三态 → 死亡');
    }

    const stateRatio = spec.states.length ? matchedStates.length / spec.states.length : 0;
    const edgeRatio = reqEdgeMax ? reqEdgeScore / reqEdgeMax : 0;
    const totalRatio = stateRatio * 0.4 + (initOk ? 0.12 : 0) + edgeRatio * 0.48;

    return {
      kind: 'fsm',
      branchName: spec.branchName,
      totalRatio,
      stateRatio,
      initOk,
      edgeRatio,
      matchedStates,
      missedStates,
      matchedEdges,
      missedEdges,
      nodeStatuses,
      edgeStatuses
    };
  }

  function evalBTE7Diagram(diagram) {
    const nodes = Array.isArray(diagram?.nodes) ? diagram.nodes : [];
    const edges = resolveLooseEdges(nodes, diagram?.edges);
    const nodeStatuses = {};
    const edgeStatuses = {};

    const childrenOf = (nid) => edges.filter(e => e.from === nid).map(e => ({ edge: e, node: nodes.find(n => n.id === e.to) })).filter(x => x.node);
    const descendants = (startId, seen = new Set()) => {
      if (seen.has(startId)) return seen;
      seen.add(startId);
      for (const ch of childrenOf(startId)) descendants(ch.node.id, seen);
      return seen;
    };

    const parallels = nodes.filter(n => n.nodeType === 'parallel' || matchSemSynonyms(n.label, ['并行', 'parallel', '⇉']));
    const decorators = nodes.filter(n => n.nodeType === 'decorator' || matchSemSynonyms(n.label, ['修饰', 'decorator', 'untilfailure', '直到失败', '持续监控', '循环检测', '◇']));
    const sequences = nodes.filter(n => n.nodeType === 'sequence' || matchSemSynonyms(n.label, ['顺序', 'sequence', '→']));
    const seeConds = nodes.filter(n => matchSemSynonyms(n.label, ['看到玩家', '发现玩家', '视野', '看见', 'seeplayer', 'cansee']));
    const moveActs = nodes.filter(n => matchSemSynonyms(n.label, ['移动', '走', '追', '靠近', 'move', 'chase']));
    const atkActs = nodes.filter(n => matchSemSynonyms(n.label, ['攻击', '打', 'attack']));

    let score = 0;
    const matchedParts = [];
    const missedHints = [];

    // 1. Parallel composite present (weight 3.0)
    const par = parallels[0] || null;
    if (par) {
      setStatusMax(nodeStatuses, par.id, 'full');
      const parCh = childrenOf(par.id);
      if (parCh.length >= 2) {
        score += 3.0;
        matchedParts.push('Parallel 并行节点 (双分支)');
      } else {
        score += 1.5;
        matchedParts.push('Parallel 并行节点');
        missedHints.push('Parallel 节点下需同时连出至少两个分支（监控分支 + 移动攻击分支）');
      }
    } else {
      missedHints.push('顶层（或 Root 下）缺少核心【Parallel 并行节点】');
    }

    // 2. Monitoring branch: Parallel -> Decorator(Until Failure) -> Condition(看到玩家？) (weight 3.5)
    let monOk = false, monPartial = false;
    for (const dec of decorators) {
      const underPar = !par || childrenOf(par.id).some(c => c.node.id === dec.id);
      const decCh = childrenOf(dec.id);
      const hasSee = decCh.some(c => seeConds.some(s => s.id === c.node.id));
      if (underPar && hasSee) {
        monOk = true;
        setStatusMax(nodeStatuses, dec.id, 'full');
        decCh.filter(c => seeConds.some(s => s.id === c.node.id)).forEach(c => {
          setStatusMax(nodeStatuses, c.node.id, 'full');
          setStatusMax(nodeStatuses, dec.id, 'full');
          setStatusMax(edgeStatuses, c.edge.id, 'full');
        });
        if (par) childrenOf(par.id).filter(c => c.node.id === dec.id).forEach(c => setStatusMax(edgeStatuses, c.edge.id, 'full'));
      }
    }
    if (!monOk && par && seeConds.length) {
      // Check if Parallel connects directly to Condition without Decorator
      const directSee = childrenOf(par.id).find(c => seeConds.some(s => s.id === c.node.id));
      if (directSee) {
        monPartial = true;
        setStatusMax(nodeStatuses, directSee.node.id, 'partial');
        setStatusMax(edgeStatuses, directSee.edge.id, 'partial');
      }
    }
    if (monOk) { score += 3.5; matchedParts.push('Decorator (Until Failure) → 条件(看到玩家？)'); }
    else if (monPartial) { score += 2.0; matchedParts.push('Parallel → 看到玩家？(缺修饰节点)'); missedHints.push('建议在 Parallel 与「看到玩家？」之间加上【Decorator (Until Failure)】修饰节点实现持续监控'); }
    else if (decorators.length || seeConds.length) {
      score += 1.0;
      decorators.forEach(n => setStatusMax(nodeStatuses, n.id, 'partial'));
      seeConds.forEach(n => setStatusMax(nodeStatuses, n.id, 'partial'));
      missedHints.push('将 Parallel 连向 Decorator (Until Failure)，再由 Decorator 连向条件叶「看到玩家？」');
    } else {
      missedHints.push('缺少监控分支：Decorator (Until Failure) → 条件节点「看到玩家？」');
    }

    // 3. Action branch: Parallel -> Sequence -> Move -> Attack (left to right) (weight 3.5)
    let actScore = 0;
    const matchedSeq = sequences.find(sq => !par || descendants(par.id).has(sq.id)) || sequences[0];
    if (matchedSeq) {
      const sqCh = childrenOf(matchedSeq.id).sort((a, b) => a.node.x - b.node.x);
      const hasMove = sqCh.find(c => moveActs.some(m => m.id === c.node.id));
      const hasAtk = sqCh.find(c => atkActs.some(a => a.id === c.node.id));
      if (hasMove && hasAtk) {
        const orderOk = hasMove.node.x <= hasAtk.node.x;
        actScore = orderOk ? 3.5 : 2.8;
        setStatusMax(nodeStatuses, matchedSeq.id, 'full');
        setStatusMax(nodeStatuses, hasMove.node.id, orderOk ? 'full' : 'partial');
        setStatusMax(nodeStatuses, hasAtk.node.id, orderOk ? 'full' : 'partial');
        setStatusMax(edgeStatuses, hasMove.edge.id, 'full');
        setStatusMax(edgeStatuses, hasAtk.edge.id, 'full');
        if (par) childrenOf(par.id).filter(c => c.node.id === matchedSeq.id).forEach(c => setStatusMax(edgeStatuses, c.edge.id, 'full'));
        if (orderOk) matchedParts.push('Sequence → 向玩家移动 → 攻击');
        else { matchedParts.push('Sequence 含移动与攻击（左右次序可互换优化）'); missedHints.push('行为树子节点从左到右执行：建议把「向玩家移动」放在「攻击」左侧'); }
      } else if (hasMove || hasAtk) {
        actScore = 2.0;
        setStatusMax(nodeStatuses, matchedSeq.id, 'partial');
        (hasMove ? [hasMove] : [hasAtk]).forEach(c => { setStatusMax(nodeStatuses, c.node.id, 'full'); setStatusMax(edgeStatuses, c.edge.id, 'full'); });
        missedHints.push('顺序分支 Sequence 下需同时包含【移动】与【攻击】两个行为节点');
      } else {
        actScore = 1.0;
        setStatusMax(nodeStatuses, matchedSeq.id, 'partial');
        missedHints.push('请把 Sequence 连接到「向玩家移动」和「攻击」行为叶节点');
      }
    } else if (moveActs.length || atkActs.length) {
      actScore = 1.0;
      missedHints.push('行为分支需用【Sequence 顺序节点】按序连接「向玩家移动」与「攻击」');
    } else {
      missedHints.push('缺少行为分支：Sequence → 向玩家移动 → 攻击');
    }
    score += actScore;

    // Optional root bonus if connected cleanly to parallel
    if (par) {
      const roots = nodes.filter(n => n.nodeType === 'root');
      roots.forEach(r => {
        if (childrenOf(r.id).some(c => c.node.id === par.id)) {
          setStatusMax(nodeStatuses, r.id, 'full');
          childrenOf(r.id).filter(c => c.node.id === par.id).forEach(c => setStatusMax(edgeStatuses, c.edge.id, 'full'));
        }
      });
    }

    return {
      kind: 'bt',
      score: Number(Math.min(10, score).toFixed(1)),
      maxScore: 10,
      totalRatio: Math.min(1, score / 10),
      matchedParts,
      missedHints,
      nodeStatuses,
      edgeStatuses
    };
  }

  function evalBTE9Diagram(diagram) {
    const nodes = Array.isArray(diagram?.nodes) ? diagram.nodes : [];
    const edges = resolveLooseEdges(nodes, diagram?.edges);
    const nodeStatuses = {};
    const edgeStatuses = {};

    const childrenOf = (nid) => edges.filter(e => e.from === nid).map(e => ({ edge: e, node: nodes.find(n => n.id === e.to) })).filter(x => x.node);
    const descendants = (startId, seen = new Set()) => {
      if (seen.has(startId)) return seen;
      seen.add(startId);
      for (const ch of childrenOf(startId)) descendants(ch.node.id, seen);
      return seen;
    };

    const selectors = nodes.filter(n => n.nodeType === 'selector' || matchSemSynonyms(n.label, ['选择', 'selector', '?']));
    const sequences = nodes.filter(n => n.nodeType === 'sequence' || matchSemSynonyms(n.label, ['顺序', 'sequence', '→']));
    const lowHpConds = nodes.filter(n => matchSemSynonyms(n.label, ['低血量', '血量低', '残血', '血少', 'hp', 'lowhp', 'lowhealth']));
    const fleeActs = nodes.filter(n => matchSemSynonyms(n.label, ['撤退', '逃跑', '逃离', '回血', '治疗', '加血', 'retreat', 'heal', 'flee']));
    const seeConds = nodes.filter(n => matchSemSynonyms(n.label, ['发现敌人', '看到敌人', '发现玩家', '看到玩家', '见敌', 'see', 'detect', 'enemy']));
    const atkActs = nodes.filter(n => matchSemSynonyms(n.label, ['攻击', '打', '移动', '追击', '追踪', 'attack', 'chase', 'move']));
    const patrolActs = nodes.filter(n => matchSemSynonyms(n.label, ['巡逻', '待机', '默认', '空闲', 'patrol', 'idle']));

    let score = 0;
    const matchedParts = [];
    const missedHints = [];

    const sel = selectors[0] || null;
    if (sel) {
      setStatusMax(nodeStatuses, sel.id, 'full');
      const selCh = childrenOf(sel.id);
      if (selCh.length >= 3) { score += 2.5; matchedParts.push('Selector (?) 含 3 条分支'); }
      else if (selCh.length >= 2) { score += 1.5; matchedParts.push('Selector (?)'); missedHints.push('Selector 下应挂接 3 条优先分支（保命 / 战斗 / 默认巡逻）'); }
      else { score += 0.8; missedHints.push('请将 Selector (?) 分别连接至各条优先级分支'); }
    } else {
      missedHints.push('顶层应放置【Selector (?) 选择节点】来按优先级挑选分支');
    }

    // Evaluate Branch 1 (Low HP -> Retreat)
    let b1X = null, b2X = null, b3X = null;
    let b1Score = 0;
    for (const sq of sequences) {
      const sub = descendants(sq.id);
      const hasLH = lowHpConds.some(n => sub.has(n.id));
      const hasFl = fleeActs.some(n => sub.has(n.id));
      if (hasLH && hasFl) {
        b1Score = 2.5; b1X = sq.x;
        setStatusMax(nodeStatuses, sq.id, 'full');
        lowHpConds.filter(n => sub.has(n.id)).forEach(n => setStatusMax(nodeStatuses, n.id, 'full'));
        fleeActs.filter(n => sub.has(n.id)).forEach(n => setStatusMax(nodeStatuses, n.id, 'full'));
        edges.filter(e => sub.has(e.from) && sub.has(e.to)).forEach(e => setStatusMax(edgeStatuses, e.id, 'full'));
        matchedParts.push('保命分支：低血量？→ 撤退/回血');
        break;
      }
    }
    if (b1Score === 0 && (lowHpConds.length || fleeActs.length)) {
      b1Score = 1.0;
      lowHpConds.forEach(n => setStatusMax(nodeStatuses, n.id, 'partial'));
      fleeActs.forEach(n => setStatusMax(nodeStatuses, n.id, 'partial'));
      missedHints.push('请用【Sequence (→)】组合条件「低血量？」与行为「撤退/回血」');
    } else if (b1Score === 0) {
      missedHints.push('缺少最高优先级分支：Sequence(低血量？ → 撤退/回血)');
    }
    score += b1Score;

    // Evaluate Branch 2 (See Enemy -> Move/Attack)
    let b2Score = 0;
    for (const sq of sequences) {
      const sub = descendants(sq.id);
      const hasSee = seeConds.some(n => sub.has(n.id));
      const hasAtk = atkActs.some(n => sub.has(n.id));
      if (hasSee && hasAtk) {
        b2Score = 2.5; b2X = sq.x;
        setStatusMax(nodeStatuses, sq.id, 'full');
        seeConds.filter(n => sub.has(n.id)).forEach(n => setStatusMax(nodeStatuses, n.id, 'full'));
        atkActs.filter(n => sub.has(n.id)).forEach(n => setStatusMax(nodeStatuses, n.id, 'full'));
        edges.filter(e => sub.has(e.from) && sub.has(e.to)).forEach(e => setStatusMax(edgeStatuses, e.id, 'full'));
        matchedParts.push('战斗分支：发现敌人？→ 移动/攻击');
        break;
      }
    }
    if (b2Score === 0 && (seeConds.length || atkActs.length)) {
      b2Score = 1.0;
      seeConds.forEach(n => setStatusMax(nodeStatuses, n.id, 'partial'));
      atkActs.forEach(n => setStatusMax(nodeStatuses, n.id, 'partial'));
      missedHints.push('请用【Sequence (→)】组合条件「发现敌人？」与行为「移动/攻击」');
    } else if (b2Score === 0) {
      missedHints.push('缺少中优先级分支：Sequence(发现敌人？ → 移动/攻击)');
    }
    score += b2Score;

    // Evaluate Branch 3 (Default Patrol under Selector)
    let b3Score = 0;
    const pat = patrolActs.find(p => !sel || descendants(sel.id).has(p.id)) || patrolActs[0];
    if (pat) {
      b3Score = 1.5; b3X = pat.x;
      setStatusMax(nodeStatuses, pat.id, 'full');
      edges.filter(e => e.to === pat.id).forEach(e => setStatusMax(edgeStatuses, e.id, 'full'));
      matchedParts.push('兜底默认行为：巡逻');
    } else {
      missedHints.push('缺少最右侧兜底动作叶节点「巡逻」');
    }
    score += b3Score;

    // Priority left-to-right X-order verification (1.0 pt)
    if (b1X !== null && b2X !== null && b3X !== null) {
      if (b1X < b2X && b2X < b3X) {
        score += 1.0;
        matchedParts.push('优先级从左到右正确 (#1保命 → #2战斗 → #3巡逻)');
      } else {
        score += 0.3;
        missedHints.push('注意 Selector 按【从左到右】优先级尝试：请拖动使「低血量保命」在最左，「战斗」居中，「巡逻」在最右');
      }
    } else if ((b1X !== null && b2X !== null && b1X < b2X) || (b2X !== null && b3X !== null && b2X < b3X)) {
      score += 0.5;
    }

    if (sel) {
      nodes.filter(n => n.nodeType === 'root').forEach(r => {
        if (childrenOf(r.id).some(c => c.node.id === sel.id)) {
          setStatusMax(nodeStatuses, r.id, 'full');
          childrenOf(r.id).filter(c => c.node.id === sel.id).forEach(c => setStatusMax(edgeStatuses, c.edge.id, 'full'));
        }
      });
      childrenOf(sel.id).forEach(c => {
        if (c.node.x === b1X || c.node.x === b2X || c.node.x === b3X) setStatusMax(edgeStatuses, c.edge.id, 'full');
      });
    }

    return {
      kind: 'bt',
      score: Number(Math.min(10, score).toFixed(1)),
      maxScore: 10,
      totalRatio: Math.min(1, score / 10),
      matchedParts,
      missedHints,
      nodeStatuses,
      edgeStatuses
    };
  }

  function computeOptimalGridCost(rows, cols, start, end, obstacles, allowCornerCut) {
    const n = rows * cols;
    const obsSet = new Set(obstacles || []);
    const dist = Array(n).fill(Infinity);
    const vis = Array(n).fill(false);
    dist[start] = 0;

    for (let iter = 0; iter < n; iter++) {
      let u = -1, best = Infinity;
      for (let i = 0; i < n; i++) {
        if (!vis[i] && dist[i] < best) { best = dist[i]; u = i; }
      }
      if (u === -1 || u === end) break;
      vis[u] = true;
      const r1 = Math.floor(u / cols), c1 = u % cols;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r2 = r1 + dr, c2 = c1 + dc;
          if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= cols) continue;
          const v = r2 * cols + c2;
          if (obsSet.has(v)) continue;
          if (!allowCornerCut && dr !== 0 && dc !== 0) {
            if (obsSet.has(r1 * cols + c2) || obsSet.has(r2 * cols + c1)) continue;
          }
          const stepCost = (dr !== 0 && dc !== 0) ? 14 : 10;
          if (dist[u] + stepCost < dist[v]) dist[v] = dist[u] + stepCost;
        }
      }
    }
    return dist[end];
  }

  function evalPathGridDiagram(diagram, spec) {
    const rows = spec.rows || 5;
    const cols = spec.cols || 6;
    const start = Number.isInteger(diagram.start) ? diagram.start : spec.start;
    const end = Number.isInteger(diagram.end) ? diagram.end : spec.end;
    const obstacles = Array.isArray(spec.obstacles) ? spec.obstacles : [];
    const obsSet = new Set(obstacles);
    const allowCornerCut = !!spec.allowCornerCut;
    const path = Array.isArray(diagram?.path) ? diagram.path.map(Number) : [];
    const optimalCost = computeOptimalGridCost(rows, cols, start, end, obstacles, allowCornerCut);
    const cellStatuses = {};
    const matchedParts = [];
    const missedHints = [];

    if (path.length < 2) return null;

    let startsOk = path[0] === start;
    let endsOk = path[path.length - 1] === end;
    let hitWall = false;
    let nonAdjacent = false;
    let cornerCut = false;
    let userCost = 0;

    for (let i = 0; i < path.length; i++) {
      const cid = path[i];
      if (!Number.isInteger(cid) || cid < 0 || cid >= rows * cols || obsSet.has(cid)) {
        hitWall = true;
        cellStatuses[cid] = 'bad';
        continue;
      }
      if (i > 0) {
        const prev = path[i - 1];
        const r1 = Math.floor(prev / cols), c1 = prev % cols;
        const r2 = Math.floor(cid / cols), c2 = cid % cols;
        const dr = Math.abs(r2 - r1), dc = Math.abs(c2 - c1);
        if ((dr === 0 && dc === 0) || dr > 1 || dc > 1) {
          nonAdjacent = true;
          cellStatuses[cid] = 'bad';
          continue;
        }
        if (!allowCornerCut && dr === 1 && dc === 1) {
          if (obsSet.has(r1 * cols + c2) || obsSet.has(r2 * cols + c1)) {
            cornerCut = true;
            cellStatuses[prev] = 'bad';
            cellStatuses[cid] = 'bad';
            missedHints.push(`违规斜穿墙角：#${prev} → #${cid} 触及相邻障碍格 corner`);
            continue;
          }
        }
        userCost += (dr === 1 && dc === 1) ? 14 : 10;
      }
    }

    if (!startsOk) missedHints.push(`路径需从起点 S(${start}) 出发`);
    if (!endsOk) missedHints.push(`路径尚未连抵终点 G(${end})`);
    if (hitWall) missedHints.push('路径中不得经过深色障碍墙格');
    if (nonAdjacent) missedHints.push('相邻路径点必须在 8 连通邻域内');

    const isLegalRoute = startsOk && endsOk && !hitWall && !nonAdjacent && !cornerCut;
    const isOptimal = isLegalRoute && Math.abs(userCost - optimalCost) < 1e-6;

    for (const cid of path) {
      if (!cellStatuses[cid]) {
        cellStatuses[cid] = isOptimal ? 'ok' : (isLegalRoute ? 'warn' : 'ok');
      }
    }

    let validScore = 0;
    let optScore = 0;
    if (isOptimal) {
      validScore = 4.0;
      optScore = 3.5;
      matchedParts.push(`合法连通路径 (${path.join('→')})`, `达到全局最优最短代价 g*=${optimalCost}`);
    } else if (isLegalRoute) {
      validScore = 3.6;
      const diff = Math.max(0, userCost - optimalCost);
      optScore = Number(Math.max(1.0, 2.8 - diff * 0.16).toFixed(1));
      matchedParts.push(`成功避障到达 G(${end})（路径代价 ${userCost}）`);
      missedHints.push(`当前路径代价 g=${userCost} 高于最优代价 g*=${optimalCost}，试试从上方 [12→7→1→2→3→10→17] 或 [12→6→1→2→3→10→17] 绕行！`);
    } else {
      if (startsOk) validScore += 0.8;
      if (endsOk && !hitWall) validScore += 0.8;
      if (cornerCut) validScore = Math.min(validScore, 1.5);
    }

    const totalRatio = Math.min(1, (validScore + optScore) / 7.5);
    return {
      kind: 'pathgrid',
      branchName: 'A* 网格路径数学等价判别器',
      isLegalRoute,
      isOptimal,
      userCost,
      optimalCost,
      validScore,
      optScore,
      totalRatio,
      matchedParts,
      missedHints,
      cellStatuses
    };
  }

  function evaluateDiagram(q, diagram) {
    if (!q || !q.board || !diagram) return null;
    if (q.board.kind === 'pathgrid') {
      if (!Array.isArray(diagram.path) || diagram.path.length < 2) return null;
      return evalPathGridDiagram(diagram, q.board);
    }
    if (!Array.isArray(diagram.nodes) || !diagram.nodes.length) return null;
    if (q.id === 'e5') return evalFSMDiagramSpec(diagram, FSM_GRAPH_SPECS.guard);
    if (q.id === 'e6') {
      const bRes = evalFSMDiagramSpec(diagram, FSM_GRAPH_SPECS.blinky);
      const aRes = evalFSMDiagramSpec(diagram, FSM_GRAPH_SPECS.ant);
      return bRes.totalRatio >= aRes.totalRatio ? bRes : aRes;
    }
    if (q.id === 'e7') return evalBTE7Diagram(diagram);
    if (q.id === 'e9') return evalBTE9Diagram(diagram);
    return null;
  }

  const CODE_WRITE_MAP = { c6: 'd2', c7: 'd7', c8: 'd8', c9: 'd9' };

  function evalPointList(points, text, compact, nums) {
    let earned = 0, maxScore = 0;
    const details = [];

    for (const pt of points) {
      maxScore += pt.weight;
      let status = 'miss', hits = [];

      if (typeof pt.customEval === 'function') {
        const r = pt.customEval(text, compact, nums);
        status = r.status;
        hits = r.hits || [];
      } else {
        const matched = [];
        for (const grp of pt.groups) {
          const hit = matchGroup(text, compact, grp);
          if (hit) matched.push(hit);
        }
        hits = matched;
        const fullReq = pt.minFull || pt.groups.length;
        if (matched.length >= fullReq) status = 'full';
        else if (matched.length >= 1) status = 'partial';
      }

      const ptEarned = status === 'full' ? pt.weight : (status === 'partial' ? pt.weight * 0.5 : 0);
      earned += ptEarned;
      details.push({
        label: pt.label,
        weight: pt.weight,
        earned: Number(ptEarned.toFixed(1)),
        status,
        hits: hits.slice(0, 4),
        missHint: pt.missHint || ''
      });
    }
    return { earned: Number(earned.toFixed(1)), maxScore: Number(maxScore.toFixed(1)), details };
  }

  function evalGenericFallback(q, rawText) {
    const text = normText(rawText);
    const compact = compactText(rawText);
    const refList = q.rubric || [];
    if (!refList.length) {
      const ok = compact.length >= 16;
      return { score: ok ? 8 : 0, maxScore: 10, pass: ok, ratio: ok ? 0.8 : 0, details: [], summary: ok ? '已提交有效作答' : '作答内容过短' };
    }
    const perW = Number((10 / refList.length).toFixed(2));
    let earned = 0;
    const details = refList.map(r => {
      const kws = (normText(r).match(/[a-z][a-z0-9_]{2,}|[\u4e00-\u9fa5]{2,4}/g) || [])
        .filter(w => !['以及', '或者', '然后', '如果', '需要', '必须', '进行', '使用', '可以', '通过', '一个', '最后', '同时'].includes(w));
      const unique = [...new Set(kws)].slice(0, 10);
      const hits = unique.filter(w => text.includes(w) || compact.includes(w));
      const ratio = unique.length ? hits.length / Math.min(unique.length, 4) : 0;
      const status = ratio >= 0.6 ? 'full' : (hits.length >= 1 ? 'partial' : 'miss');
      const e = status === 'full' ? perW : (status === 'partial' ? perW * 0.5 : 0);
      earned += e;
      return { label: r, weight: perW, earned: Number(e.toFixed(1)), status, hits: hits.slice(0, 4), missHint: r };
    });
    const score = Math.min(10, Number(earned.toFixed(1)));
    return { score, maxScore: 10, pass: score >= 6.0, ratio: score / 10, details };
  }

  function buildHybridBoardDetails(q, dia, textBest, hasText) {
    if (!dia) return textBest;

    // Combine visual diagram evidence with text rubric evidence intelligently per question
    if (q.id === 'e5') {
      const td = textBest.details;
      const dStatesEarned = Number((dia.stateRatio * 2.0 + (dia.initOk ? 0.5 : 0)).toFixed(1));
      const dEdgesEarned = Number((dia.edgeRatio * 2.5).toFixed(1));
      const pts = [
        td[0], // FSM 四要素 (text)
        {
          label: '画板 + 文字：守卫 4 状态与初始态标记 (●→ Patrol)',
          weight: 2.5,
          earned: Math.min(2.5, Math.max(td[1].earned, dStatesEarned)),
          status: Math.max(td[1].earned, dStatesEarned) >= 2.2 ? 'full' : (Math.max(td[1].earned, dStatesEarned) >= 0.8 ? 'partial' : 'miss'),
          hits: [...new Set([...(td[1].hits || []), ...dia.matchedStates, ...(dia.initOk ? ['初始态 ●→ 已标'] : [])])].slice(0, 5),
          missHint: (!dia.initOk ? '别忘了选中 Patrol 点击「●→ 设为初始态」；' : '') + (dia.missedStates.length ? `画板缺少状态：${dia.missedStates.join('、')}` : td[1].missHint)
        },
        {
          label: '画板 + 文字：核心状态迁移连线与触发事件',
          weight: 2.5,
          earned: Math.min(2.5, Math.max(td[2].earned, dEdgesEarned)),
          status: Math.max(td[2].earned, dEdgesEarned) >= 2.0 ? 'full' : (Math.max(td[2].earned, dEdgesEarned) >= 0.6 ? 'partial' : 'miss'),
          hits: [...new Set([...(td[2].hits || []), ...dia.matchedEdges])].slice(0, 5),
          missHint: dia.missedEdges.length ? `画板建议补齐转换连线：${dia.missedEdges.slice(0, 4).join('、')}` : td[2].missHint
        },
        td[3]  // 状态设计模式对比 (text)
      ];
      // Ensure a super-accurate diagram alone (>= 85% topology accuracy) gets at least 6.0 pass even if optional brief text hits partial keywords
      let earned = Number(pts.reduce((s, p) => s + p.earned, 0).toFixed(1));
      if (dia.totalRatio >= 0.85 && earned < 6.0) {
        pts[2].earned = Number((pts[2].earned + (6.0 - earned)).toFixed(1));
        earned = 6.0;
      }
      return { earned, maxScore: 10, branchName: '画板拓扑 + 文字混合智能批改', details: pts };
    }

    if (q.id === 'e6') {
      const sEarn = Number((dia.stateRatio * 4.0 + (dia.initOk ? 0.5 : 0)).toFixed(1));
      const eEarn = Number((dia.edgeRatio * 5.5).toFixed(1));
      const td = textBest.details;
      const p0Earned = hasText ? Math.max(td[0].earned, sEarn) : sEarn;
      const p1Earned = hasText ? Math.max(td[1].earned, eEarn) : eEarn;
      const pts = [
        {
          label: `${dia.branchName} · 核心状态与初始态 (画板 + 文字)`,
          weight: 4.5,
          earned: Math.min(4.5, p0Earned),
          status: p0Earned >= 3.8 ? 'full' : (p0Earned >= 1.5 ? 'partial' : 'miss'),
          hits: [...new Set([...(hasText ? td[0].hits : []), ...dia.matchedStates, ...(dia.initOk ? ['初始态 ●→'] : [])])].slice(0, 5),
          missHint: (!dia.initOk ? '别忘了标注初始态 ●→；' : '') + (dia.missedStates.length ? `画板缺少状态：${dia.missedStates.join('、')}` : td[0].missHint)
        },
        {
          label: `${dia.branchName} · 状态迁移闭环连线 (画板 + 文字)`,
          weight: 5.5,
          earned: Math.min(5.5, p1Earned),
          status: p1Earned >= 4.4 ? 'full' : (p1Earned >= 1.5 ? 'partial' : 'miss'),
          hits: [...new Set([...(hasText ? td[1].hits : []), ...dia.matchedEdges])].slice(0, 6),
          missHint: dia.missedEdges.length ? `画板建议补全转换边：${dia.missedEdges.slice(0, 4).join('、')}` : td[1].missHint
        }
      ];
      const earned = Number(pts.reduce((s, p) => s + p.earned, 0).toFixed(1));
      return { earned, maxScore: 10, branchName: `${dia.branchName}（画板智能识别）`, details: pts };
    }

    if (q.id === 'e7') {
      const td = textBest.details;
      const dSolEarned = Number(Math.min(3.0, (dia.totalRatio * 3.0)).toFixed(1));
      const dPrinEarned = Number(Math.min(2.0, (dia.totalRatio * 2.0)).toFixed(1));
      const pts = [
        td[0],
        {
          label: '画板 + 文字：Parallel + Until Failure 行为树拓扑结构',
          weight: 3.0,
          earned: Math.max(td[1].earned, dSolEarned),
          status: Math.max(td[1].earned, dSolEarned) >= 2.5 ? 'full' : (Math.max(td[1].earned, dSolEarned) >= 1.0 ? 'partial' : 'miss'),
          hits: [...new Set([...(hasText ? td[1].hits : []), ...dia.matchedParts])].slice(0, 5),
          missHint: dia.missedHints.length ? dia.missedHints.join('；') : td[1].missHint
        },
        {
          label: '中断触发执行原理（画板树结构 + 文字说明）',
          weight: 2.0,
          earned: Math.max(td[2].earned, dPrinEarned),
          status: Math.max(td[2].earned, dPrinEarned) >= 1.7 ? 'full' : (Math.max(td[2].earned, dPrinEarned) >= 0.8 ? 'partial' : 'miss'),
          hits: [...new Set([...(hasText ? td[2].hits : []), ...(dia.totalRatio >= 0.7 ? ['Parallel 并发中断树结构完备'] : [])])].slice(0, 4),
          missHint: td[2].missHint
        },
        td[3]
      ];
      let earned = Number(pts.reduce((s, p) => s + p.earned, 0).toFixed(1));
      if (dia.totalRatio >= 0.9 && earned < 6.0) {
        pts[1].earned = Number((pts[1].earned + (6.0 - earned)).toFixed(1));
        earned = 6.0;
      }
      return { earned, maxScore: 10, branchName: '行为树画板 + 文字混合智能批改', details: pts };
    }

    if (q.id === 'e9') {
      const td = textBest.details;
      const p0D = Math.min(3.0, Number((dia.score >= 8 ? 3.0 : dia.score * 0.35).toFixed(1)));
      const p1D = dia.matchedParts.some(s => s.includes('保命')) ? 2.5 : (dia.missedHints.some(h => h.includes('Sequence')) ? 1.0 : 0);
      const p2D = (dia.matchedParts.some(s => s.includes('战斗')) ? 1.8 : 0) + (dia.matchedParts.some(s => s.includes('巡逻')) ? 0.7 : 0);
      const pts = [
        {
          label: '画板 + 文字：顶层 Selector (?) 与从左到右优先级结构',
          weight: 3.0,
          earned: Math.min(3.0, Math.max(td[0].earned, p0D)),
          status: Math.max(td[0].earned, p0D) >= 2.4 ? 'full' : (Math.max(td[0].earned, p0D) >= 1.0 ? 'partial' : 'miss'),
          hits: [...new Set([...(hasText ? td[0].hits : []), ...dia.matchedParts])].slice(0, 5),
          missHint: dia.missedHints.length ? dia.missedHints.join('；') : td[0].missHint
        },
        {
          label: '画板 + 文字：#1 低血量保命分支 (Sequence → 条件 + 撤退/回血)',
          weight: 2.5,
          earned: Math.min(2.5, Math.max(td[1].earned, p1D)),
          status: Math.max(td[1].earned, p1D) >= 2.2 ? 'full' : (Math.max(td[1].earned, p1D) >= 0.8 ? 'partial' : 'miss'),
          hits: [...new Set([...(hasText ? td[1].hits : []), ...dia.matchedParts.filter(s => s.includes('保命'))])].slice(0, 4),
          missHint: td[1].missHint
        },
        {
          label: '画板 + 文字：#2 战斗分支 (发现敌人 → 移动攻击) + #3 默认巡逻',
          weight: 2.5,
          earned: Math.min(2.5, Math.max(td[2].earned, p2D)),
          status: Math.max(td[2].earned, p2D) >= 2.2 ? 'full' : (Math.max(td[2].earned, p2D) >= 0.8 ? 'partial' : 'miss'),
          hits: [...new Set([...(hasText ? td[2].hits : []), ...dia.matchedParts.filter(s => s.includes('战斗') || s.includes('巡逻'))])].slice(0, 4),
          missHint: td[2].missHint
        },
        td[3]
      ];
      const earned = Number(pts.reduce((s, p) => s + p.earned, 0).toFixed(1));
      return { earned, maxScore: 10, branchName: '行为树画板 + 文字混合智能批改', details: pts };
    }

    if (q.id === 'e10') {
      const td = textBest.details;
      const p0Earned = Number(dia.validScore.toFixed(1));
      const p1TextEarned = td[1]?.earned || 0;
      const p1Earned = Math.min(3.5, Math.max(dia.optScore, p1TextEarned >= 3.0 && dia.isLegalRoute ? Math.max(dia.optScore, 2.5) : dia.optScore));
      const p2Earned = td[2]?.earned || 0;
      const pts = [
        {
          label: '画板：S(12)→G(17) 合法路径与禁止切角 (Corner Cut) 规则',
          weight: 4.0,
          earned: p0Earned,
          status: p0Earned >= 3.5 ? 'full' : (p0Earned >= 1.5 ? 'partial' : 'miss'),
          hits: [...new Set([...(hasText ? (td[0]?.hits || []) : []), ...dia.matchedParts])].slice(0, 5),
          missHint: dia.missedHints.filter(h => !h.includes('总代价')).join('；') || (td[0]?.missHint || '')
        },
        {
          label: `画板 + 算式：等价最优最短代价 (g* = ${dia.optimalCost})`,
          weight: 3.5,
          earned: p1Earned,
          status: dia.isOptimal ? 'full' : (p1Earned >= 1.5 ? 'partial' : 'miss'),
          hits: dia.isOptimal ? [`画板最优代价 g*=${dia.optimalCost}`] : (hasText ? (td[1]?.hits || []) : [`画板代价 g=${dia.userCost}`]),
          missHint: dia.missedHints.find(h => h.includes('最优代价')) || (td[1]?.missHint || '')
        },
        td[2]
      ];
      const earned = Number(pts.reduce((s, p) => s + p.earned, 0).toFixed(1));
      return { earned, maxScore: 10, branchName: 'A* 寻路画板最优性数学校验', details: pts };
    }

    return textBest;
  }

  function evaluateSubjective(q, rawInput) {
    const isHybridObj = rawInput && typeof rawInput === 'object' && !Array.isArray(rawInput);
    const rawText = isHybridObj ? (rawInput.text || '') : String(rawInput || '');
    const diagram = isHybridObj ? (rawInput.diagram || null) : null;

    const cleaned = rawText.replace(/\/\/\s*在此手写[^\n]*/g, '').trim();
    const compact = CODE_WRITE_MAP[q.id] ? compactText(stripCSharpComments(cleaned)) : compactText(cleaned);
    const hasText = compact.length >= 6;
    const diaEval = evaluateDiagram(q, diagram);

    if (!hasText && !diaEval) {
      const spec = ESSAY_RUBRICS[q.id];
      const basePts = spec ? (spec.branchSets ? spec.branchSets[0].points : spec.points) : [];
      const cwPts = CODE_WRITE_MAP[q.id] ? DRILL_EVALUATORS[CODE_WRITE_MAP[q.id]]('') : [];
      const usePts = CODE_WRITE_MAP[q.id]
        ? cwPts.map(c => ({ label: c.label, weight: Number((10 / cwPts.length).toFixed(2)), earned: 0, status: 'miss', hits: [], missHint: c.hint || '' }))
        : basePts.map(p => ({ label: p.label, weight: p.weight, earned: 0, status: 'miss', hits: [], missHint: p.missHint || '' }));
      return {
        score: 0, maxScore: 10, pass: false, ratio: 0, tooShort: true,
        diagramEval: null,
        summary: q.board
          ? '画板与文字作答均为空或过短，未能命中采分要点，请使用画板绘制状态/树结构并补充要点！'
          : '作答内容为空或过短，未能命中采分要点，请对照下方逐项解析学习后再攻克同类题！',
        details: usePts
      };
    }

    // Route handwritten C# code questions (c6..c9) through the intelligent C# code semantic & simulation engine!
    if (CODE_WRITE_MAP[q.id]) {
      return evaluateCodeWriteWithEngine(CODE_WRITE_MAP[q.id], cleaned);
    }

    const text = normText(cleaned);
    const nums = extractNumbers(cleaned);
    const spec = ESSAY_RUBRICS[q.id];
    if (!spec) return evalGenericFallback(q, cleaned);

    let best;
    if (spec.branchSets) {
      let bestBranch = null;
      for (const br of spec.branchSets) {
        const res = evalPointList(br.points, text, compact, nums);
        if (!bestBranch || res.earned > bestBranch.earned) {
          bestBranch = { ...res, branchName: br.branchName };
        }
      }
      best = bestBranch;
    } else {
      best = evalPointList(spec.points, text, compact, nums);
    }

    if (diaEval) {
      best = buildHybridBoardDetails(q, diaEval, best, hasText);
    }

    const score = Math.min(best.maxScore, best.earned);
    const ratio = best.maxScore > 0 ? score / best.maxScore : 0;
    const pass = ratio >= 0.6;
    const fullCnt = best.details.filter(d => d.status === 'full').length;
    const partCnt = best.details.filter(d => d.status === 'partial').length;
    const totalCnt = best.details.length;

    let summary = '';
    if (ratio >= 0.85) summary = `思路与结构非常完整！命中 ${fullCnt}/${totalCnt} 项核心采分点，达到高分作答水准！`;
    else if (pass) summary = `回答正确（达标）！完整命中 ${fullCnt} 项${partCnt ? `、部分命中 ${partCnt} 项` : ''}，可参考下方查漏补缺冲刺满分。`;
    else summary = `暂未达标（需 ≥ 6 分），当前完整命中 ${fullCnt} 项${partCnt ? `、部分命中 ${partCnt} 项` : ''}，已收入错题本，重点补齐下方红色缺失点！`;

    return {
      score, maxScore: best.maxScore, pass, ratio,
      branchName: best.branchName || null,
      diagramEval: diaEval,
      summary, details: best.details
    };
  }

  /* ------------------------------------------------------------------------
     Flexible Fill-in-the-Blank Matcher (natural language + C# code blanks!)
     ------------------------------------------------------------------------ */
  const FILL_SYNONYMS = [
    ['队列', 'queue', 'fifo'],
    ['栈', 'stack', 'filo', 'lifo'],
    ['分离', 'separation'],
    ['对齐', '队列', 'alignment'],
    ['聚集', '聚合', 'cohesion'],
    ['开放列表', 'open表', 'openlist', 'open'],
    ['关闭列表', 'close表', 'closelist', 'closedlist', 'close'],
    ['优先队列', '最小堆', '二叉堆', '二叉最小堆', 'minheap'],
    ['曼哈顿距离', '曼哈顿', 'manhattan'],
    ['欧氏距离', '欧几里得距离', '欧式距离', 'euclidean'],
    ['可采纳', '可采纳性', 'admissible', '不高估']
  ];

  function normFillToken(s) {
    return String(s || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[；;]+$/g, '')
      .replace(/[（【]/g, '(')
      .replace(/[）】]/g, ')')
      .replace(/[，、]/g, ',')
      .replace(/→|=>|->|—>/g, '-')
      .replace(/[×·]/g, '*')
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=');
  }

  function matchFillBlank(userInput, acceptedList) {
    const u = normFillToken(userInput);
    if (!u) return false;
    const uStripUnit = u.replace(/(米|m|焦耳|j|秒|s|度|°|格|像素|px|f)$/i, '');

    for (const rawAns of acceptedList) {
      const a = normFillToken(rawAns);
      if (u === a) return true;
      const aStripUnit = a.replace(/(米|m|焦耳|j|秒|s|度|°|格|像素|px|f)$/i, '');
      if (uStripUnit && aStripUnit && uStripUnit === aStripUnit) return true;
      // Numeric tolerance for pure numeric blanks (e.g. 7.8 vs 7.81, 0f vs 0)
      if (/^-?\d+(\.\d+)?$/.test(uStripUnit) && /^-?\d+(\.\d+)?$/.test(aStripUnit)) {
        if (Math.abs(parseFloat(uStripUnit) - parseFloat(aStripUnit)) <= Math.max(0.05, Math.abs(parseFloat(aStripUnit)) * 0.015)) {
          return true;
        }
      }
      // Synonym group check
      for (const grp of FILL_SYNONYMS) {
        if (grp.includes(a) && grp.includes(u)) return true;
      }
      // Flexible C# code expression & statement equivalence check!
      if (/[a-zA-Z_]/.test(rawAns) && /[=+\-*/%().<>]/.test(rawAns)) {
        if (areCSharpBlanksEquivalent(userInput, rawAns)) return true;
      }
    }
    return false;
  }

  window.SmartGrader = {
    evaluateSubjective,
    evaluateDiagram,
    matchFillBlank,
    evaluateCodeDrill,
    areCSharpBlanksEquivalent
  };
})();
