/* =========================================================
   Уровень 3 — «Конфетное поле»: три в ряд
   Меняй соседние конфеты. 3 в ряд — убрать, 4 — полосатая конфета,
   5 — котёл-бомба, Г/Т-фигура — тыквенный взрыв.
   ========================================================= */
(function () {
  'use strict';

  const R = 8, C = 8, NT = 6;
  const NAMES = ['конфета-кукуруза', 'тыква', 'леденец-фантик', 'лизун-леденец', 'шоколадка', 'глазик'];
  const SHORT = ['Candy corn', 'Тыквы', 'Фантики', 'Леденцы', 'Шоколад', 'Глазики'];

  /* ---------- Рисунки конфет (SVG без внешних файлов) ---------- */
  const ART = [
    // 0: candy corn
    `<svg class="art" viewBox="0 0 100 100"><g stroke="#5a2a00" stroke-width="4" stroke-linejoin="round">
      <polygon points="50,8 63.3,38 36.7,38" fill="#fff6e0"/><polygon points="36.7,38 63.3,38 76.1,66 23.9,66" fill="#ff9a1f"/>
      <polygon points="23.9,66 76.1,66 89,93 11,93" fill="#ffd93a"/></g>
      <path d="M45 20 q-3 8 -3 14" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".75"/></svg>`,
    // 1: тыква
    `<svg class="art" viewBox="0 0 100 100"><g stroke="#6a2400" stroke-width="3.5">
      <ellipse cx="31" cy="58" rx="22" ry="28" fill="#ff8a1f"/><ellipse cx="69" cy="58" rx="22" ry="28" fill="#ff8a1f"/><ellipse cx="50" cy="58" rx="19" ry="30" fill="#ffa233"/></g>
      <path d="M45 30 Q47 16 58 14 L62 22 Q54 24 55 31Z" fill="#5a8a1f" stroke="#2c4a0a" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="30,52 42,52 36,41" fill="#3a1200"/><polygon points="70,52 58,52 64,41" fill="#3a1200"/>
      <path d="M28 66 L38 61 L45 70 L50 61 L56 70 L62 61 L72 66 L68 80 L59 74 L50 82 L41 74 L32 80Z" fill="#3a1200"/>
      <path d="M32 54 q2 -6 5 -9" stroke="#ffe08a" stroke-width="2.5" fill="none" opacity=".7"/></svg>`,
    // 2: леденец в фантике
    `<svg class="art" viewBox="0 0 100 100"><g stroke="#5a1458" stroke-width="3.5" stroke-linejoin="round">
      <polygon points="4,30 30,50 4,70" fill="#ff7ac8"/><polygon points="96,30 70,50 96,70" fill="#ff7ac8"/>
      <circle cx="50" cy="50" r="28" fill="#8a4fff"/></g>
      <path d="M26 58 L74 42" stroke="#ffd93a" stroke-width="7" stroke-linecap="round"/><path d="M30 38 Q50 26 72 36" stroke="#e6d4ff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>
      <circle cx="50" cy="50" r="28" fill="none" stroke="#3a1a80" stroke-width="3.5"/></svg>`,
    // 3: лизун-леденец
    `<svg class="art" viewBox="0 0 100 100"><rect x="46" y="60" width="8" height="34" rx="3" fill="#f3e6cc" stroke="#5a3a20" stroke-width="3"/>
      <circle cx="50" cy="40" r="32" fill="#9be22b" stroke="#2a5a00" stroke-width="4"/>
      <path d="M50 40 m0 0 a5 5 0 1 1 6 6 a11 11 0 1 1 -14 -12 a17 17 0 1 1 22 22 a23 23 0 1 1 -29 -28" fill="none" stroke="#2a0d44" stroke-width="5" stroke-linecap="round"/>
      <path d="M30 22 q4 -6 11 -8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,
    // 4: плитка шоколада в рваной обёртке
    `<svg class="art" viewBox="0 0 100 100"><g transform="rotate(-10 50 50)">
      <rect x="15" y="12" width="70" height="76" rx="8" fill="#6b3a1a" stroke="#2a1406" stroke-width="4"/>
      <g fill="#93562b" stroke="#47230d" stroke-width="2.2"><rect x="21" y="18" width="27" height="17" rx="4"/><rect x="52" y="18" width="27" height="17" rx="4"/>
      <rect x="21" y="39" width="27" height="17" rx="4"/><rect x="52" y="39" width="27" height="17" rx="4"/></g>
      <path d="M11 62 L21 55 L31 62 L41 55 L51 62 L61 55 L71 62 L81 55 L89 62 V90 Q50 98 11 90Z" fill="#ff8a1f" stroke="#2a1406" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M22 72 H78" stroke="#fff3c0" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="M30 80 H66" stroke="#b34a00" stroke-width="3" stroke-linecap="round"/>
      <path d="M26 24 h12" stroke="#c88a58" stroke-width="3" stroke-linecap="round" opacity=".8"/></g></svg>`,
    // 5: глазик
    `<svg class="art" viewBox="0 0 100 100"><circle cx="50" cy="52" r="36" fill="#fff8ef" stroke="#4a0a14" stroke-width="4"/>
      <g stroke="#d62839" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M18 40 Q30 44 34 52 M16 62 Q28 58 32 54 M82 42 Q70 46 66 52 M84 62 Q72 58 68 54 M50 18 Q48 28 50 34 M36 84 Q40 74 44 70"/></g>
      <circle cx="50" cy="52" r="19" fill="#4fd06a" stroke="#14582a" stroke-width="3.5"/><circle cx="50" cy="52" r="10" fill="#0e0e14"/>
      <ellipse cx="50" cy="52" rx="3" ry="9" fill="#0e0e14"/><circle cx="44" cy="46" r="4" fill="#fff"/></svg>`
  ];
  const ART_BOMB = `<svg class="art" viewBox="0 0 100 100"><circle cx="50" cy="54" r="34" fill="#1a0a33" stroke="#e6b8ff" stroke-width="4"/>
    <circle cx="50" cy="54" r="28" fill="#3a1a6e"/><path d="M28 54 Q50 30 72 54 Q50 78 28 54Z" fill="#9b5cff" opacity=".6"/>
    <g fill="#fff"><polygon points="38,40 40,46 46,46 41,50 43,56 38,52 33,56 35,50 30,46 36,46" transform="scale(.8) translate(10,14)"/><circle cx="64" cy="40" r="3"/><circle cx="60" cy="70" r="2.4"/><circle cx="36" cy="66" r="2"/></g>
    <path d="M30 26 Q50 14 70 26 L74 34 Q50 24 26 34Z" fill="#ff7a1a" stroke="#4a1700" stroke-width="3" stroke-linejoin="round"/></svg>`;
  const OV_ROW = `<svg class="ov" viewBox="0 0 100 100"><g fill="#fff" stroke="#2a0d44" stroke-width="3" stroke-linejoin="round"><polygon points="6,50 28,32 28,68"/><polygon points="94,50 72,32 72,68"/><rect x="30" y="43" width="40" height="14" rx="6"/></g></svg>`;
  const OV_COL = `<svg class="ov" viewBox="0 0 100 100"><g fill="#fff" stroke="#2a0d44" stroke-width="3" stroke-linejoin="round"><polygon points="50,6 32,28 68,28"/><polygon points="50,94 32,72 68,72"/><rect x="43" y="30" width="14" height="40" rx="6"/></g></svg>`;
  const OV_BLAST = `<svg class="ov" viewBox="0 0 100 100"><polygon points="50,2 58,28 84,16 72,42 98,50 72,58 84,84 58,72 50,98 42,72 16,84 28,58 2,50 28,42 16,16 42,28" fill="#ffe06a" opacity=".5" stroke="#ff8a1f" stroke-width="2"/></svg>`;

  function tileHTML(t) {
    if (t.s === 'bomb') return ART_BOMB;
    return ART[t.t] + (t.s === 'row' ? OV_ROW : t.s === 'col' ? OV_COL : t.s === 'blast' ? OV_BLAST : '');
  }

  /* ---------- Логика (чистые функции, без DOM) ---------- */
  let uidc = 1;
  const mk = (t, s) => ({ t, s: s || null, id: uidc++ });
  const inb = (r, c) => r >= 0 && c >= 0 && r < R && c < C;
  const K = (r, c) => r * C + c;

  function makeGrid() {
    const g = Array.from({ length: R }, () => Array(C).fill(null));
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      let t;
      do { t = G.rand(NT); } while ((c >= 2 && g[r][c - 1].t === t && g[r][c - 2].t === t) || (r >= 2 && g[r - 1][c].t === t && g[r - 2][c].t === t));
      g[r][c] = mk(t);
    }
    return g;
  }
  function findRuns(g) {
    const runs = [];
    for (let r = 0; r < R; r++) {
      let c = 0;
      while (c < C) {
        const a = g[r][c];
        if (!a || a.t < 0) { c++; continue; }
        let e = c + 1;
        while (e < C && g[r][e] && g[r][e].t === a.t) e++;
        if (e - c >= 3) runs.push({ dir: 'h', r, c, len: e - c, t: a.t });
        c = e;
      }
    }
    for (let c = 0; c < C; c++) {
      let r = 0;
      while (r < R) {
        const a = g[r][c];
        if (!a || a.t < 0) { r++; continue; }
        let e = r + 1;
        while (e < R && g[e][c] && g[e][c].t === a.t) e++;
        if (e - r >= 3) runs.push({ dir: 'v', r, c, len: e - r, t: a.t });
        r = e;
      }
    }
    return runs;
  }
  const cellsOf = run => {
    const a = [];
    for (let i = 0; i < run.len; i++) a.push(run.dir === 'h' ? [run.r, run.c + i] : [run.r + i, run.c]);
    return a;
  };

  /* Находит совпадения и решает, какие особые конфеты родятся */
  function analyze(g, hint) {
    const runs = findRuns(g);
    const cells = new Set(), creates = [];
    if (!runs.length) return { cells, creates, runs };
    runs.forEach(run => cellsOf(run).forEach(([r, c]) => cells.add(K(r, c))));
    const used = new Set();
    const hintSet = new Set((hint || []).map(([r, c]) => K(r, c)));
    const taken = new Set();
    const pickPivot = arr => {
      const ok = arr.filter(([r, c]) => !g[r][c].s && !taken.has(K(r, c)));
      if (!ok.length) return null;
      return ok.find(([r, c]) => hintSet.has(K(r, c))) || ok[Math.floor(ok.length / 2)];
    };
    const add = (p, s) => { creates.push({ r: p[0], c: p[1], s }); taken.add(K(p[0], p[1])); };
    // 5 и больше -> котёл-бомба
    runs.forEach((run, i) => {
      if (run.len >= 5) { const p = pickPivot(cellsOf(run)); if (p) add(p, 'bomb'); used.add(i); }
    });
    // Г / Т -> тыквенный взрыв
    for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) {
      const a = runs[i], b = runs[j];
      if (used.has(i) || used.has(j) || a.dir === b.dir || a.t !== b.t) continue;
      const h = a.dir === 'h' ? a : b, v = a.dir === 'h' ? b : a;
      if (v.c >= h.c && v.c < h.c + h.len && h.r >= v.r && h.r < v.r + v.len) {
        const g0 = g[h.r][v.c];
        if (!g0.s && !taken.has(K(h.r, v.c))) add([h.r, v.c], 'blast');
        used.add(i); used.add(j);
      }
    }
    // 4 -> полосатая конфета
    runs.forEach((run, i) => {
      if (!used.has(i) && run.len === 4) {
        const p = pickPivot(cellsOf(run));
        if (p) add(p, run.dir === 'h' ? 'row' : 'col');
        used.add(i);
      }
    });
    creates.forEach(cr => cells.delete(K(cr.r, cr.c)));
    return { cells, creates, runs };
  }

  /* Цепная реакция особых конфет */
  function expand(g, set, protect) {
    const queue = [...set];
    const seen = new Set(set);
    const add = (r, c) => {
      if (!inb(r, c)) return;
      const k = K(r, c);
      if (protect.has(k) || seen.has(k) || !g[r][c]) return;
      seen.add(k); set.add(k); queue.push(k);
    };
    while (queue.length) {
      const k = queue.pop();
      const r = Math.floor(k / C), c = k % C, t = g[r][c];
      if (!t || !t.s) continue;
      if (t.s === 'row') for (let cc = 0; cc < C; cc++) add(r, cc);
      else if (t.s === 'col') for (let rr = 0; rr < R; rr++) add(rr, c);
      else if (t.s === 'blast') { for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (Math.abs(dr) + Math.abs(dc) <= 2) add(r + dr, c + dc); }
      else if (t.s === 'bomb') {
        const cnt = Array(NT).fill(0);
        for (let rr = 0; rr < R; rr++) for (let cc = 0; cc < C; cc++) { const x = g[rr][cc]; if (x && x.t >= 0) cnt[x.t]++; }
        let best = 0; for (let i = 1; i < NT; i++) if (cnt[i] > cnt[best]) best = i;
        for (let rr = 0; rr < R; rr++) for (let cc = 0; cc < C; cc++) { const x = g[rr][cc]; if (x && x.t === best) add(rr, cc); }
      }
    }
    return set;
  }

  /* Что происходит, если поменять местами особые конфеты (позиции уже обменяны) */
  function specialSwapSet(g, r1, c1, r2, c2) {
    const a = g[r1][c1], b = g[r2][c2];
    if (!a || !b || (!a.s && !b.s)) return null;
    const set = new Set();
    const all = pred => { for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] && pred(g[r][c])) set.add(K(r, c)); };
    if (a.s === 'bomb' && b.s === 'bomb') { all(() => true); return set; }
    if (a.s === 'bomb' || b.s === 'bomb') {
      const bomb = a.s === 'bomb' ? a : b, other = bomb === a ? b : a;
      const bp = bomb === a ? [r1, c1] : [r2, c2];
      set.add(K(bp[0], bp[1]));
      all(t => t.t === other.t);
      if (other.s) {
        set.forEach(k => {
          const t = g[Math.floor(k / C)][k % C];
          if (t !== bomb && t.t === other.t && !t.s) t.s = other.s === 'blast' ? 'blast' : (Math.random() < 0.5 ? 'row' : 'col');
        });
      }
      return set;
    }
    set.add(K(r1, c1)); set.add(K(r2, c2));
    for (let cc = 0; cc < C; cc++) set.add(K(r2, cc));
    for (let rr = 0; rr < R; rr++) set.add(K(rr, c2));
    return set;
  }

  function collapse(g) {
    const moves = [], spawns = [];
    for (let c = 0; c < C; c++) {
      let w = R - 1;
      for (let r = R - 1; r >= 0; r--) {
        const t = g[r][c];
        if (t) { if (r !== w) { g[w][c] = t; g[r][c] = null; moves.push({ tile: t, r: w, c }); } w--; }
      }
      const n = w + 1;
      for (let k = w; k >= 0; k--) { const t = mk(G.rand(NT)); g[k][c] = t; spawns.push({ tile: t, r: k, c, from: k - n }); }
    }
    return { moves, spawns };
  }

  function isValidSwap(g, r1, c1, r2, c2) {
    const a = g[r1][c1], b = g[r2][c2];
    if (!a || !b) return false;
    if (a.s === 'bomb' || b.s === 'bomb' || (a.s && b.s)) return true;
    g[r1][c1] = b; g[r2][c2] = a;
    const ok = findRuns(g).length > 0;
    g[r1][c1] = a; g[r2][c2] = b;
    return ok;
  }
  function findMoves(g) {
    const m = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (c + 1 < C && isValidSwap(g, r, c, r, c + 1)) m.push([r, c, r, c + 1]);
      if (r + 1 < R && isValidSwap(g, r, c, r + 1, c)) m.push([r, c, r + 1, c]);
    }
    return m;
  }

  /* Полный разбор хода без анимации (для тестов баланса) */
  function resolveData(g, goals, initial, hint) {
    let cascade = 0, score = 0, first = true;
    for (;;) {
      let set, creates = [];
      if (initial) { set = initial; initial = null; }
      else { const an = analyze(g, first ? hint : null); if (!an.cells.size) break; set = an.cells; creates = an.creates; }
      first = false; cascade++;
      expand(g, set, new Set(creates.map(cr => K(cr.r, cr.c))));
      set.forEach(k => {
        const r = Math.floor(k / C), c = k % C, t = g[r][c];
        if (t.t >= 0) { const gl = goals.find(x => x.t === t.t); if (gl) gl.got = Math.min(gl.need, gl.got + 1); }
        score += 10 * cascade;
        g[r][c] = null;
      });
      creates.forEach(cr => { const t = g[cr.r][cr.c]; t.s = cr.s; if (cr.s === 'bomb') t.t = -1; });
      collapse(g);
    }
    return { score, cascade };
  }
  G.m3Logic = { R, C, NT, makeGrid, findRuns, analyze, expand, specialSwapSet, collapse, isValidSwap, findMoves, resolveData, mk, K };

  /* ---------- Настройка раундов ---------- */
  const STORY = { moves: 24, goals: [{ t: 0, need: 22 }, { t: 1, need: 18 }, { t: 2, need: 18 }] };
  function replayConfig() {
    const types = G.shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3);
    if (!types.includes(0) && Math.random() < 0.6) types[0] = 0;
    return { moves: 24, goals: types.map(t => ({ t, need: 16 + G.rand(6) })) };
  }

  /* ---------- Экран игры ---------- */
  let grid, goals, moves, score, busy, session = 0, selected = null, idleTimer = null, boardEl, tilesEl, story;
  const M = G.m3 = {
    _dbg: () => ({ grid, goals, moves, score, busy, refresh }),   // для автотестов
    enter: function () {
      session++;
      const sc = G.$('#screen-m3');
      sc.innerHTML = `
        <div class="game-col m3">
          <div class="game-head">
            <div class="chip">Очки <b id="m3-score">0</b></div>
            <div class="game-title">Собери конфеты!</div>
            <div class="chip movechip">Ходы <b id="m3-moves">0</b></div>
          </div>
          <div class="m3-goals panel" id="m3-goals"></div>
          <div class="m3-boardwrap">
            <div class="m3-board" id="m3-board"><div class="m3-bg"></div><div class="m3-tiles" id="m3-tiles"></div></div>
          </div>
          <div class="m3-foot muted">Меняй соседние конфеты: 4 в ряд даёт полосатую, 5 в ряд котёл-бомбу, Г или Т — взрыв.</div>
        </div>`;
      boardEl = G.$('#m3-board');
      tilesEl = G.$('#m3-tiles');
      boardEl.addEventListener('pointerdown', onDown);
      start();
    },
    leave: function () { session++; clearTimeout(idleTimer); }
  };

  function start() {
    session++;
    story = !G.state.m3Done;
    const cfg = story ? STORY : replayConfig();
    goals = cfg.goals.map(g => ({ t: g.t, need: g.need, got: 0 }));
    moves = cfg.moves; score = 0; busy = false; selected = null;
    grid = makeGrid();
    let guard = 0;
    while (!findMoves(grid).length && guard++ < 50) grid = makeGrid();
    tilesEl.innerHTML = '';
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const t = grid[r][c];
      const el = makeEl(t);
      tilesEl.appendChild(el);
      setPos(t, r, c, true);
      el.classList.add('drop');
      el.style.animationDelay = (c * 25 + r * 12) + 'ms';
    }
    updateUI();
    armIdle();
    if (story) G.toast('🍬 Собери конфеты за ограниченное число ходов', 2800);
  }

  function makeEl(t) {
    const d = G.el('div', 't');
    d.innerHTML = `<div class="ti ${t.s === 'bomb' ? 'tbomb' : 'tt' + t.t} ${t.s ? 'sp sp-' + t.s : ''}">${tileHTML(t)}</div>`;
    d._tile = t; t.el = d;
    return d;
  }
  function refresh(t) {
    const ti = t.el.firstChild;
    ti.className = 'ti ' + (t.s === 'bomb' ? 'tbomb' : 'tt' + t.t) + (t.s ? ' sp sp-' + t.s : '');
    ti.innerHTML = tileHTML(t);
  }
  function setPos(t, r, c, instant) {
    t.r = r; t.c = c;
    const el = t.el;
    if (instant) el.style.transition = 'none';
    el.style.transform = `translate(${c * 100}%,${r * 100}%)`;
    if (instant) { void el.offsetWidth; el.style.transition = ''; }
  }

  function updateUI() {
    G.$('#m3-score').textContent = score;
    const mv = G.$('#m3-moves'); mv.textContent = moves;
    mv.parentElement.classList.toggle('low', moves <= 5);
    G.$('#m3-goals').innerHTML = goals.map(g => {
      const left = g.need - g.got, done = left <= 0;
      return `<div class="goal ${done ? 'done' : ''}"><div class="gi tt${g.t}">${ART[g.t]}</div><b>${done ? '✔' : left}</b><small>${SHORT[g.t]}</small></div>`;
    }).join('');
  }

  /* ---------- Ввод ---------- */
  let press = null;
  function onDown(ev) {
    if (busy) return;
    const el = ev.target.closest('.t');
    if (!el) return;
    ev.preventDefault();
    const t = el._tile;
    disarmIdle();
    press = { t, x: ev.clientX, y: ev.clientY, done: false };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }
  function onMove(ev) {
    if (!press || press.done || busy) return;
    const size = tilesEl.getBoundingClientRect().width / C;
    const dx = ev.clientX - press.x, dy = ev.clientY - press.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < size * 0.4) return;
    press.done = true;
    let r = press.t.r, c = press.t.c;
    if (Math.abs(dx) > Math.abs(dy)) c += dx > 0 ? 1 : -1; else r += dy > 0 ? 1 : -1;
    deselect();
    if (inb(r, c)) attempt(press.t.r, press.t.c, r, c);
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (!press) return;
    const p = press; press = null;
    if (p.done || busy) return;
    // обычный клик: выбрать / поменять с выбранной
    const t = p.t;
    if (selected && selected !== t) {
      const d = Math.abs(selected.r - t.r) + Math.abs(selected.c - t.c);
      if (d === 1) { const a = selected; deselect(); attempt(a.r, a.c, t.r, t.c); return; }
    }
    if (selected === t) { deselect(); G.sfx('click'); armIdle(); return; }
    deselect();
    selected = t; t.el.classList.add('sel');
    G.sfx('pick');
    armIdle();
  }
  function deselect() { if (selected) selected.el.classList.remove('sel'); selected = null; }

  /* ---------- Подсказка при простое ---------- */
  function clearHint() { G.$$('.t.hint', tilesEl).forEach(e => e.classList.remove('hint')); }
  function armIdle() {
    clearTimeout(idleTimer); clearHint();
    const my = session;
    idleTimer = setTimeout(() => {
      if (my !== session || busy) return;
      const mv = findMoves(grid);
      if (!mv.length) return;
      const m = G.pick(mv);
      grid[m[0]][m[1]].el.classList.add('hint');
      grid[m[2]][m[3]].el.classList.add('hint');
    }, 7000);
  }
  function disarmIdle() { clearTimeout(idleTimer); clearHint(); }

  /* ---------- Ход ---------- */
  function swapData(r1, c1, r2, c2) {
    const a = grid[r1][c1], b = grid[r2][c2];
    grid[r1][c1] = b; grid[r2][c2] = a;
    setPos(b, r1, c1); setPos(a, r2, c2);
  }

  async function attempt(r1, c1, r2, c2) {
    if (busy) return;
    busy = true; disarmIdle();
    const my = session;
    if (!isValidSwap(grid, r1, c1, r2, c2)) {
      G.sfx('swap');
      swapData(r1, c1, r2, c2);
      await G.sleep(190);
      swapData(r1, c1, r2, c2);
      G.sfx('bad');
      grid[r1][c1].el.classList.add('shake'); grid[r2][c2].el.classList.add('shake');
      await G.sleep(260);
      if (my !== session) return;
      G.$$('.t.shake', tilesEl).forEach(e => e.classList.remove('shake'));
      busy = false; armIdle();
      return;
    }
    G.sfx('swap');
    swapData(r1, c1, r2, c2);
    await G.sleep(230);
    if (my !== session) return;
    moves--; updateUI();
    const initial = specialSwapSet(grid, r1, c1, r2, c2);
    if (initial) { initial.forEach(k => { const t = grid[Math.floor(k / C)][k % C]; if (t && t.s) refresh(t); }); }
    await resolve(initial, [[r1, c1], [r2, c2]], my);
    if (my !== session) return;
    await afterMove(my);
  }

  async function resolve(initial, hint, my) {
    let cascade = 0, first = true;
    for (;;) {
      let set, creates = [];
      if (initial) { set = initial; initial = null; }
      else { const an = analyze(grid, first ? hint : null); if (!an.cells.size) break; set = an.cells; creates = an.creates; }
      first = false; cascade++;
      const protect = new Set(creates.map(cr => K(cr.r, cr.c)));
      expand(grid, set, protect);
      const list = [...set];
      let special = false, count = 0;
      list.forEach(k => {
        const t = grid[Math.floor(k / C)][k % C];
        if (!t) return;
        if (t.s) special = true;
        count++;
        if (t.t >= 0) { const gl = goals.find(x => x.t === t.t); if (gl) gl.got = Math.min(gl.need, gl.got + 1); }
      });
      score += count * 10 * cascade + creates.length * 25;
      G.sfx(special ? 'boom' : 'match', count);
      // всплывающие слова
      const center = boardCenter();
      if (creates.some(c => c.s === 'bomb')) G.floatText(center[0], center[1] - 20, 'Конфетная буря!');
      else if (creates.some(c => c.s === 'blast')) G.floatText(center[0], center[1] - 20, 'Тыквенный взрыв!');
      else if (creates.length) G.floatText(center[0], center[1] - 20, 'Сладко! 4 в ряд');
      else if (special) G.floatText(center[0], center[1] - 20, 'Бабах!');
      if (cascade > 1) G.floatText(center[0], center[1] + 30, 'Каскад ×' + cascade, 'green');
      // анимация
      list.forEach(k => { const t = grid[Math.floor(k / C)][k % C]; if (t) t.el.classList.add('clearing'); });
      creates.forEach(cr => {
        const t = grid[cr.r][cr.c];
        t.s = cr.s; if (cr.s === 'bomb') t.t = -1;
        refresh(t); t.el.classList.add('born');
      });
      if (count > 5) { const p0 = list[Math.floor(list.length / 2)]; const rc = tileCenter(Math.floor(p0 / C), p0 % C); G.burst(rc[0], rc[1], ['🍬', '🍭', '🎃', '⭐', '🦇'], Math.min(6 + count, 18), 110); }
      updateUI();
      await G.sleep(270);
      if (my !== session) return;
      list.forEach(k => { const r = Math.floor(k / C), c = k % C, t = grid[r][c]; if (t) { t.el.remove(); grid[r][c] = null; } });
      const { moves: mv, spawns } = collapse(grid);
      mv.forEach(m => setPos(m.tile, m.r, m.c));
      spawns.forEach(s => { const el = makeEl(s.tile); tilesEl.appendChild(el); setPos(s.tile, s.from, s.c, true); });
      void tilesEl.offsetWidth;
      spawns.forEach(s => setPos(s.tile, s.r, s.c));
      await G.sleep(340);
      if (my !== session) return;
      G.$$('.t.born', tilesEl).forEach(e => e.classList.remove('born'));
    }
  }

  function boardCenter() { const b = boardEl.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }
  function tileCenter(r, c) { const b = tilesEl.getBoundingClientRect(), s = b.width / C; return [b.left + (c + 0.5) * s, b.top + (r + 0.5) * s]; }

  async function afterMove(my) {
    updateUI();
    if (goals.every(g => g.got >= g.need)) return win(my);
    if (moves <= 0) return lose(my);
    if (!findMoves(grid).length) {
      G.toast('Ходов нет — конфеты перемешиваются 🔀', 2400);
      let guard = 0, tiles = [];
      grid.forEach(row => row.forEach(t => tiles.push(t)));
      do {
        G.shuffle(tiles);
        let i = 0;
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) grid[r][c] = tiles[i++];
      } while ((findRuns(grid).length || !findMoves(grid).length) && guard++ < 80);
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) setPos(grid[r][c], r, c);
      await G.sleep(450);
      if (my !== session) return;
    }
    busy = false;
    armIdle();
  }

  /* ---------- Итоги ---------- */
  async function win(my) {
    G.sfx('win'); G.confetti();
    const bonus = moves;
    const first = story;
    const tok = first ? 150 + bonus * 6 : 40 + bonus * 3;
    G.addTokens(tok);
    G.state.m3Best = Math.max(G.state.m3Best || 0, score);
    let finished = false;
    if (first) { G.state.m3Done = true; if (G.advanceStage(3)) finished = true; }
    G.save();
    await G.sleep(900);
    if (my !== session) return;
    if (finished) {
      await G.modal({
        title: 'Конфетное поле пройдено!', cls: 'wide',
        body: `<p class="big">👑🎃🎉</p><p>Ты собрал все конфеты! Открыта новая локация: <b class="hl">Хранитель правил</b>. Там призраку нужно дойти до двери, а законы мира написаны на карточках.</p>
          <div class="reward">+${tok} ${G.coin()}</div>
          <p>Жетоны можно потратить в <b>Лавке ведьмы</b> на мебель и украшения для <b>своего дома</b>.</p>`,
        buttons: [{ text: 'На карту', cls: 'btn-ghost btn-small', value: 'map' }, { text: 'В лавку ведьмы', cls: 'btn-primary', value: 'shop' }]
      }).then(v => { if (my === session) G.go(v === 'shop' ? 'shop' : 'map'); });
      return;
    }
    const r = await G.modal({
      title: 'Уровень пройден!',
      body: `<p class="big">🍬🌽🎃</p><p>Очки: <b class="hl">${score}</b>${bonus ? `, ходов в запасе: <b class="hl">${bonus}</b>` : ''}</p>
        <div class="reward">+${tok} ${G.coin()}</div>${first ? '' : '<p class="muted">Повторная игра: награда меньше</p>'}`,
      buttons: [{ text: 'На карту', cls: 'btn-ghost btn-small', value: 'map' }, { text: 'Играть ещё', cls: 'btn-primary', value: 'again' }]
    });
    if (my !== session) return;
    if (r === 'again') start(); else G.go('map');
  }
  async function lose(my) {
    G.sfx('lose');
    await G.sleep(500);
    if (my !== session) return;
    const left = goals.filter(g => g.got < g.need).map(g => `${SHORT[g.t]}: ещё ${g.need - g.got}`).join(', ');
    const r = await G.modal({
      title: 'Ходы закончились',
      body: `<p class="big">💀</p><p>Не хватило: <b class="hl">${left}</b>.</p><p class="muted">Подсказка: из 4 в ряд и Г/Т-фигур получаются мощные конфеты.</p>`,
      buttons: [{ text: 'На карту', cls: 'btn-ghost btn-small', value: 'map' }, { text: 'Ещё раз', cls: 'btn-primary', value: 'again' }]
    });
    if (my !== session) return;
    if (r === 'again') start(); else G.go('map');
  }
})();
