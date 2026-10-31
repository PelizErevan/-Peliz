/* =========================================================
   Block Blast: два прохождения по 10 уровней.
   «Кладбище» (испытание 1) и «Старый склеп» (испытание 5, фигуры хитрее).
   Перетаскивай фигуры на поле 8×8, собирай линии, набирай очки.
   ========================================================= */
(function () {
  'use strict';

  const N = 8;
  const REROLL_COST = 15;

  /* ---------- Настройки двух прохождений ---------- */
  const CAMPS = {
    bb: {
      key: 'bb', screen: 'screen-bb', name: 'Кладбище', stage: 1, unlock: 'bbUnlocked', best: 'bbBest',
      GOALS: [100, 160, 220, 290, 370, 450, 540, 630, 730, 850],   // очки для прохождения
      OBST: [0, 2, 3, 5, 6, 7, 8, 9, 10, 12],                      // «надгробия» на старте
      reward: L => 30 + 10 * L,
      diag: L => (L < 3 ? 0 : L < 6 ? 2 : 3),                       // вес диагональной фигуры по уровню
      rare: L => (L < 3 ? 0.4 : L < 6 ? 0.7 : 1),                   // множитель для редких фигур (T, плюс, подкова…)
      doneTitle: 'Кладбище пройдено!', doneIcon: '🏆🪦',
      doneText: 'Все 10 уровней позади! Открыта локация <b class="hl">Комната призраков</b>: там спрятан Золотой ключ.'
    },
    bb2: {
      key: 'bb2', screen: 'screen-bb2', name: 'Старый склеп', stage: 5, unlock: 'bb2Unlocked', best: 'bb2Best',
      GOALS: [170, 235, 305, 385, 470, 560, 660, 770, 890, 1020],
      OBST: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      reward: L => 70 + 15 * L,
      diag: () => 4,
      rare: () => 1,
      doneTitle: 'Склеп пройден!', doneIcon: '🏆⚰️',
      doneText: 'Все 10 уровней склепа позади! Открыта последняя локация: <b class="hl">Башня ведьмы</b>.'
    }
  };

  /* ---------- Фигуры ---------- */
  /* Здесь все фигуры «Block Blast»: каждая записана один раз, а повороты на 90° считаются сами.
     mirror: true добавляет и зеркальные копии (L и J, S и Z).
     w: вес выпадения (чем больше, тем чаще). Чтобы добавить свою фигуру, допиши строку сюда. */
  const BASES = [
    { s: ['#'], w: 1 },                           // точка
    { s: ['##'], w: 4 },                          // линии от 2 до 5: и горизонтально, и вертикально
    { s: ['###'], w: 4 },
    { s: ['####'], w: 3 },
    { s: ['#####'], w: 3 },
    { s: ['#.', '.#'], diag: true },              // два блока по диагонали (оба наклона)
    { s: ['##', '##'], w: 4 },                    // квадрат 2×2
    { s: ['###', '###', '###'], w: 2 },           // квадрат 3×3
    { s: ['###', '###'], w: 3 },                  // прямоугольник 2×3 (и 3×2)
    { s: ['#.', '##'], w: 4 },                    // малый уголок из 3 клеток
    { s: ['#..', '#..', '###'], w: 3 },           // большой уголок 3+3
    { s: ['#.', '#.', '##'], w: 4, mirror: true },// L и J из 4 клеток
    { s: ['###', '.#.'], w: 3 },                  // T из 4 клеток
    { s: ['##.', '.##'], w: 3, mirror: true },    // S и Z
    { s: ['##', '##', '#.'], w: 1, rare: true, mirror: true },// «P»: квадрат с хвостиком
    { s: ['###', '.#.', '.#.'], w: 1, rare: true },           // большая T из 5 клеток
    { s: ['.#.', '###', '.#.'], w: .6, rare: true },           // плюс
    { s: ['#.#', '###'], w: 1, rare: true },                  // «U»: подкова
    { s: ['##.', '.#.', '.##'], w: .6, rare: true, mirror: true }, // большая S и Z
    { s: ['#..', '##.', '.##'], w: .6, rare: true },           // лесенка
    { s: ['#.', '#.', '#.', '##'], w: .6, rare: true, mirror: true } // длинный L и J из 5 клеток
  ];
  function rot(m) {
    const h = m.length, w = m[0].length, out = [];
    for (let c = 0; c < w; c++) {
      let row = '';
      for (let r = h - 1; r >= 0; r--) row += m[r][c];
      out.push(row);
    }
    return out;
  }
  const mirror = m => m.map(r => r.split('').reverse().join(''));
  function variants(b) {
    const seen = new Set(), out = [];
    let m = b.s;
    const add = x => { const k = x.join('|'); if (!seen.has(k)) { seen.add(k); out.push(x); } };
    for (let i = 0; i < 4; i++) { add(m); if (b.mirror) add(mirror(m)); m = rot(m); }
    return out;
  }
  BASES.forEach(b => { b.v = variants(b); });
  function toPiece(m, color) {
    const cells = [];
    m.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === '#') cells.push([r, c]); });
    return { cells, h: m.length, w: m[0].length, color };
  }
  /* camp: настройки прохождения, level: номер уровня. Без аргументов даётся «средний» набор. */
  function randomPiece(camp, level) {
    const dw = camp ? camp.diag(level || 1) : 2;
    const rw = camp ? camp.rare(level || 1) : 1;
    const weights = BASES.map(b => (b.diag ? dw : b.rare ? b.w * rw : b.w));
    const total = weights.reduce((a, b) => a + b, 0);
    let x = Math.random() * total, b = BASES[0];
    for (let i = 0; i < BASES.length; i++) { if ((x -= weights[i]) < 0) { b = BASES[i]; break; } }
    return toPiece(G.pick(b.v), 1 + G.rand(6));
  }

  /* ---------- Логика (чистые функции, удобно тестировать) ---------- */
  const newBoard = () => Array.from({ length: N }, () => Array(N).fill(0));
  function canPlace(board, p, r0, c0) {
    for (const [r, c] of p.cells) {
      const rr = r0 + r, cc = c0 + c;
      if (rr < 0 || cc < 0 || rr >= N || cc >= N || board[rr][cc]) return false;
    }
    return true;
  }
  function anyFit(board, p) {
    for (let r = 0; r <= N - p.h; r++) for (let c = 0; c <= N - p.w; c++) if (canPlace(board, p, r, c)) return true;
    return false;
  }
  function putPiece(board, p, r0, c0) { for (const [r, c] of p.cells) board[r0 + r][c0 + c] = p.color; }
  function findFull(board) {
    const rows = [], cols = [];
    for (let r = 0; r < N; r++) if (board[r].every(v => v)) rows.push(r);
    for (let c = 0; c < N; c++) { let ok = true; for (let r = 0; r < N; r++) if (!board[r][c]) { ok = false; break; } if (ok) cols.push(c); }
    return { rows, cols };
  }
  function clearLines(board, rows, cols) {
    rows.forEach(r => { for (let c = 0; c < N; c++) board[r][c] = 0; });
    cols.forEach(c => { for (let r = 0; r < N; r++) board[r][c] = 0; });
  }
  const lineScore = (n, combo) => Math.round(10 * n * (n + 1) * (1 + (Math.min(combo, 6) - 1) * 0.5));
  /* Проверка: можно ли поставить все три фигуры по очереди (с учётом очищенных линий).
     Так игра честнее: набор фигур никогда не заводит в тупик «с первого хода». */
  function solvable(board, ps) {
    let budget = 6000;
    const dfs = (bd, list, k) => {
      if (k === list.length) return true;
      const p = list[k];
      for (let r = 0; r <= N - p.h; r++) for (let c = 0; c <= N - p.w; c++) {
        if (!canPlace(bd, p, r, c)) continue;
        if (--budget < 0) return false;
        const t = bd.map(row => row.slice());
        putPiece(t, p, r, c);
        const f = findFull(t);
        clearLines(t, f.rows, f.cols);
        if (dfs(t, list, k + 1)) return true;
      }
      return false;
    };
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    return perms.some(pm => dfs(board, pm.map(i => ps[i]), 0));
  }
  function newTray(board, camp, level) {
    let ps, fallback = null;
    for (let k = 0; k < 30; k++) {
      ps = [randomPiece(camp, level), randomPiece(camp, level), randomPiece(camp, level)];
      if (solvable(board, ps)) return ps;
      if (!fallback && ps.some(p => anyFit(board, p))) fallback = ps;
    }
    return fallback || ps;
  }
  function obstacles(board, n) {
    let placed = 0, guard = 0;
    while (placed < n && guard++ < 500) {
      const r = G.rand(N), c = G.rand(N);
      if (board[r][c]) continue;
      if (board[r].filter(v => v).length >= 4) continue;
      let colCount = 0; for (let i = 0; i < N; i++) if (board[i][c]) colCount++;
      if (colCount >= 4) continue;
      board[r][c] = 7;
      placed++;
    }
  }
  G.bbLogic = {
    N, newBoard, canPlace, anyFit, putPiece, findFull, clearLines, lineScore, newTray, randomPiece, obstacles,
    GOALS: CAMPS.bb.GOALS, OBST: CAMPS.bb.OBST, CAMPS, BASES
  };

  /* =======================================================
     Игровой модуль. Для каждого прохождения создаётся свой экземпляр.
     ======================================================= */
  function create(cfg) {
    let board, tray, score, combo, level, busy, over, session = 0, drag = null;
    let screenEl, boardEl, trayEl, cellEls = [];
    const $ = sel => G.$(sel, screenEl);
    const goal = L => cfg.GOALS[L - 1];

    const M = {
      _dbg: () => ({ board, tray, score, level, busy, over }),   // для автотестов
      _setScore: n => { score = n; },
      cfg,
      enter: function () {
        session++;
        screenEl = G.$('#' + cfg.screen);
        // второй экземпляр рисует то же самое: чистим «соседний» экран, чтобы не было двойных id
        Object.keys(CAMPS).forEach(k => { if (CAMPS[k].screen !== cfg.screen) G.$('#' + CAMPS[k].screen).innerHTML = ''; });
        screenEl.innerHTML = `
          <div class="game-col bb">
            <div class="game-head">
              <button class="btn btn-small btn-ghost" id="bb-levels" type="button">☰ Уровни</button>
              <div class="game-title" id="bb-title">Уровень 1</div>
              <button class="btn btn-small btn-purple" id="bb-reroll" type="button" title="Новые фигуры">🔄 ${REROLL_COST} ${G.coin('sm')}</button>
            </div>
            <div class="bb-info">
              <div class="chip">Очки <b id="bb-score">0</b></div>
              <div class="bar bb-goalbar"><i id="bb-goalfill"></i><span class="bar-label" id="bb-goaltxt">0 / 0</span></div>
              <div class="chip" title="Лучший счёт">🏆 <b id="bb-best">0</b></div>
            </div>
            <div class="bb-boardwrap"><div class="bb-board" id="bb-board"></div></div>
            <div class="bb-tray" id="bb-tray"></div>
          </div>`;
        boardEl = $('#bb-board');
        trayEl = $('#bb-tray');
        // клетки-препятствия: нарисованные кодом надгробия (5 видов), см. js/art.js
        if (G.art) for (let v = 0; v < G.art.TOMBS; v++) boardEl.style.setProperty('--tc' + v, 'url(' + G.art.cellUrl(v) + ')');
        cellEls = [];
        for (let i = 0; i < N * N; i++) {
          const d = G.el('div', 'bb-cell');
          boardEl.appendChild(d);
          cellEls.push(d);
        }
        $('#bb-levels').addEventListener('click', () => { G.sfx('click'); showLevels(); });
        $('#bb-reroll').addEventListener('click', reroll);
        level = null; board = newBoard(); tray = [null, null, null]; over = true; busy = false;
        renderBoard(); renderTray();
        showLevels();
      },
      leave: function () {
        session++;
        cancelDragEl();
      }
    };

    /* ---------- Выбор уровня ---------- */
    async function showLevels() {
      const wrap = G.el('div', 'bb-levels');
      const unlocked = G.state[cfg.unlock];
      for (let L = 1; L <= 10; L++) {
        const done = L < unlocked, open = G.levelOpen(L, unlocked);
        const b = G.el('button', 'bb-lvl' + (done ? ' done' : '') + (open ? '' : ' locked') + (L === unlocked && L <= 10 ? ' cur' : ''));
        b.type = 'button';
        b.innerHTML = `<span class="n">${open ? L : '🔒'}</span><small>${goal(L)}</small>${done ? '<i>✔</i>' : ''}`;
        b.disabled = !open;
        b.dataset.l = L;
        wrap.appendChild(b);
      }
      const my = session;
      const picked = await G.modal({
        title: cfg.name, cls: 'wide',
        body: (() => {
          const d = G.el('div');
          d.innerHTML = `<p>Выбери уровень. Цифра под номером: сколько очков нужно набрать.</p>`;
          d.appendChild(wrap);
          d.insertAdjacentHTML('beforeend', `<p class="muted">Пройдено: <b class="hl">${Math.min(10, unlocked - 1)}/10</b>. Награда за новый уровень растёт!</p>`);
          return d;
        })(),
        buttons: (level && !over)
          ? [{ text: 'Продолжить', cls: 'btn-primary', value: 0 }, { text: 'На карту', cls: 'btn-ghost btn-small', value: -1 }]
          : [{ text: 'На карту', cls: 'btn-ghost btn-small', value: -1 }],
        onMount: (box, close) => {
          G.$$('.bb-lvl', box).forEach(b => b.addEventListener('click', () => { if (!b.disabled) { G.sfx('click'); close(+b.dataset.l); } }));
        }
      });
      if (my !== session) return;
      if (picked > 0) startLevel(picked);
      else if (picked === -1) G.go('map');
    }

    /* ---------- Старт уровня ---------- */
    function startLevel(L) {
      session++;
      level = L; score = 0; combo = 0; busy = false; over = false;
      board = newBoard();
      obstacles(board, cfg.OBST[L - 1]);
      tray = newTray(board, cfg, L);
      $('#bb-title').textContent = 'Уровень ' + L;
      $('#bb-best').textContent = G.state[cfg.best][L] || 0;
      updateScore();
      renderBoard();
      renderTray();
    }

    /* ---------- Отрисовка ---------- */
    function renderBoard() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const v = board[r][c], d = cellEls[r * N + c];
        d.className = 'bb-cell' + (v ? ' f c' + v : '') + (v === 7 ? ' t' + ((r * 3 + c * 2) % 5) : '');
        d.style.removeProperty('--dl');
      }
    }
    function pieceEl(p) {
      const d = G.el('div', 'bb-piece');
      d.style.setProperty('--cols', p.w);
      d.style.setProperty('--rows', p.h);
      const set = new Set(p.cells.map(([r, c]) => r * 10 + c));
      for (let r = 0; r < p.h; r++) for (let c = 0; c < p.w; c++) {
        d.appendChild(G.el('div', set.has(r * 10 + c) ? 'bb-pc c' + p.color : 'bb-pe'));
      }
      return d;
    }
    function renderTray() {
      trayEl.innerHTML = '';
      tray.forEach((p, i) => {
        const slot = G.el('div', 'bb-slot');
        slot.dataset.i = i;
        if (p) {
          slot.appendChild(pieceEl(p));
          if (!anyFit(board, p)) slot.classList.add('nofit');
          slot.addEventListener('pointerdown', ev => startDrag(ev, i));
        }
        trayEl.appendChild(slot);
        // большие фигуры слегка уменьшаем, чтобы влезли в ячейку
        if (p) {
          const pe = slot.firstChild;
          const k = Math.min(1, (slot.clientWidth - 14) / pe.offsetWidth, (slot.clientHeight - 14) / pe.offsetHeight);
          if (k < 1) pe.style.transform = 'scale(' + k.toFixed(3) + ')';
        }
      });
    }
    function updateScore(bump) {
      const g = goal(level || 1);
      const s = $('#bb-score');
      s.textContent = score;
      $('#bb-goalfill').style.width = Math.min(100, score / g * 100) + '%';
      $('#bb-goaltxt').textContent = score + ' / ' + g;
      if (bump) { s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); }
    }

    /* ---------- Перетаскивание ---------- */
    function metrics() {
      const a = cellEls[0].getBoundingClientRect(), b = cellEls[1].getBoundingClientRect();
      return { left: a.left, top: a.top, size: a.width, pitch: b.left - a.left };
    }
    function startDrag(ev, i) {
      if (busy || over || !tray[i] || drag) return;
      ev.preventDefault();
      const slot = ev.currentTarget;
      try { slot.setPointerCapture(ev.pointerId); } catch (e) { /* не страшно */ }
      const m = metrics(), p = tray[i];
      const el = pieceEl(p);
      el.classList.add('bb-drag');
      el.style.setProperty('--tc', m.size + 'px');
      el.style.setProperty('--gap', (m.pitch - m.size) + 'px');
      document.body.appendChild(el);
      drag = { i, p, m, el, slot, r0: 0, c0: 0, valid: false, touch: ev.pointerType !== 'mouse' };
      slot.classList.add('lifted');
      G.sfx('pick');
      slot.onpointermove = moveDrag;
      slot.onpointerup = endDrag;
      slot.onpointercancel = () => { cancelDragEl(); };
      moveDrag(ev);
    }
    function moveDrag(ev) {
      if (!drag) return;
      const { m, p, el } = drag;
      const w = p.w * m.pitch - (m.pitch - m.size), h = p.h * m.pitch - (m.pitch - m.size);
      const lift = drag.touch ? 62 : 24;
      const left = ev.clientX - w / 2, top = ev.clientY - h - lift;
      el.style.transform = `translate(${left}px, ${top}px)`;
      const c0 = Math.round((left - m.left) / m.pitch), r0 = Math.round((top - m.top) / m.pitch);
      drag.r0 = r0; drag.c0 = c0;
      drag.valid = canPlace(board, p, r0, c0);
      showPreview();
    }
    function clearPreview() {
      cellEls.forEach(d => d.classList.remove('gh', 'gl', 'gc1', 'gc2', 'gc3', 'gc4', 'gc5', 'gc6'));
    }
    function showPreview() {
      clearPreview();
      if (!drag || !drag.valid) return;
      const { p, r0, c0 } = drag;
      const tmp = board.map(r => r.slice());
      putPiece(tmp, p, r0, c0);
      const { rows, cols } = findFull(tmp);
      rows.forEach(r => { for (let c = 0; c < N; c++) cellEls[r * N + c].classList.add('gl'); });
      cols.forEach(c => { for (let r = 0; r < N; r++) cellEls[r * N + c].classList.add('gl'); });
      p.cells.forEach(([r, c]) => cellEls[(r0 + r) * N + c0 + c].classList.add('gh', 'gc' + p.color));
    }
    function cancelDragEl() {
      if (!drag) return;
      drag.el.remove();
      drag.slot.classList.remove('lifted');
      drag.slot.onpointermove = drag.slot.onpointerup = drag.slot.onpointercancel = null;
      drag = null;
      clearPreview();
    }
    function endDrag() {
      if (!drag) return;
      const d = drag;
      const ok = d.valid;
      cancelDragEl();
      if (ok) doPlace(d.i, d.p, d.r0, d.c0);
      else G.sfx('bad');
    }

    /* ---------- Анимация убирания линий ---------- */
    function cellCenter(r, c) {
      const b = cellEls[r * N + c].getBoundingClientRect();
      return [b.left + b.width / 2, b.top + b.height / 2];
    }
    /* осколки: клетка «взрывается» цветными кусочками */
    function shards(k, delay) {
      const el = cellEls[k], b = el.getBoundingClientRect();
      const color = getComputedStyle(el).getPropertyValue('--cb').trim() || '#ff8a1f';
      const light = getComputedStyle(el).getPropertyValue('--ca').trim() || '#fff';
      const root = G.$('#fx-root');
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      for (let i = 0; i < 5; i++) {
        const s = G.el('i', 'shard');
        const sz = 5 + Math.random() * 7;
        s.style.cssText = `left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${i % 2 ? color : light};color:${color}`;
        root.appendChild(s);
        const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 70;
        const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
        const rt = (Math.random() - 0.5) * 540;
        s.animate([
          { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy - 14}px)) scale(.9) rotate(${rt / 2}deg)`, opacity: 1, offset: 0.45 },
          { transform: `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy + 60}px)) scale(.2) rotate(${rt}deg)`, opacity: 0 }
        ], { duration: 620 + Math.random() * 320, delay, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'both' }).onfinish = () => s.remove();
      }
    }
    /* яркая полоса света пробегает по очищаемой линии */
    function sweep(kind, idx) {
      const wrap = boardEl.parentElement, w = wrap.getBoundingClientRect();
      const a = cellEls[kind === 'row' ? idx * N : idx].getBoundingClientRect();
      const z = cellEls[kind === 'row' ? idx * N + N - 1 : (N - 1) * N + idx].getBoundingClientRect();
      const box = G.el('div', 'bb-sweep');
      box.style.left = (a.left - w.left) + 'px';
      box.style.top = (a.top - w.top) + 'px';
      box.style.width = (z.right - a.left) + 'px';
      box.style.height = (z.bottom - a.top) + 'px';
      const bar = G.el('i');
      box.appendChild(bar);
      wrap.appendChild(box);
      const horizontal = kind === 'row';
      bar.animate(horizontal
        ? [{ transform: 'translateX(-120%)' }, { transform: 'translateX(320%)' }]
        : [{ transform: 'translateY(-120%)' }, { transform: 'translateY(320%)' }],
      { duration: 520, easing: 'ease-in-out' }).onfinish = () => box.remove();
      if (!horizontal) bar.classList.add('v');
    }

    /* ---------- Ход ---------- */
    async function doPlace(idx, p, r0, c0) {
      busy = true;
      const my = session;
      putPiece(board, p, r0, c0);
      tray[idx] = null;
      score += p.cells.length;
      G.sfx('place');
      renderBoard();
      p.cells.forEach(([r, c]) => cellEls[(r0 + r) * N + c0 + c].classList.add('pop'));

      const { rows, cols } = findFull(board);
      const n = rows.length + cols.length;
      if (n) {
        combo++;
        const gain = lineScore(n, combo);
        score += gain;
        G.sfx('clear', n + combo);
        const set = new Set();
        rows.forEach(r => { for (let c = 0; c < N; c++) set.add(r * N + c); });
        cols.forEach(c => { for (let r = 0; r < N; r++) set.add(r * N + c); });
        const cr = r0 + p.h / 2, cc = c0 + p.w / 2;
        rows.forEach(r => sweep('row', r));
        cols.forEach(c => sweep('col', c));
        set.forEach(k => {
          const r = Math.floor(k / N), c = k % N, d = cellEls[k];
          const dl = Math.round((Math.abs(r - cr) + Math.abs(c - cc)) * 22);
          d.style.setProperty('--dl', dl + 'ms');
          d.classList.add('clearing');
          shards(k, dl + 150);
        });
        if (n >= 2 || combo >= 3) { boardEl.classList.remove('shake'); void boardEl.offsetWidth; boardEl.classList.add('shake'); }
        const mid = cellCenter(Math.min(N - 1, Math.max(0, Math.round(cr))), Math.min(N - 1, Math.max(0, Math.round(cc))));
        const words = ['', 'Бу!', 'Жутко!', 'Кошмар!', 'Ведьмин котёл!', 'Адская линия!'];
        G.floatText(mid[0], mid[1] - 20, words[Math.min(n, 5)] + ' +' + gain);
        if (combo > 1) setTimeout(() => G.floatText(mid[0], mid[1] + 30, '🔥 Комбо ×' + combo, 'red'), 160);
        G.burst(mid[0], mid[1], ['🎃', '🦇', '👻', '🕸️', '⭐'], Math.min(10 + n * 4, 30), 120 + n * 25);
        await G.sleep(700);
        if (my !== session) return;
        clearLines(board, rows, cols);
        renderBoard();
        if (board.every(r => r.every(v => !v))) {
          score += 100 + level * 10;
          G.floatText(mid[0], mid[1] - 70, 'Чистое поле! +' + (100 + level * 10), 'green');
          G.confetti();
        }
      } else {
        combo = 0;
      }
      updateScore(true);

      if (tray.every(t => !t)) tray = newTray(board, cfg, level);
      renderTray();
      G.state[cfg.best][level] = Math.max(G.state[cfg.best][level] || 0, score);
      $('#bb-best').textContent = G.state[cfg.best][level];

      if (score >= goal(level)) { over = true; busy = false; G.save(); return win(); }
      if (!tray.some(t => t && anyFit(board, t))) { over = true; busy = false; G.save(); return lose(); }
      G.save();
      busy = false;
    }

    /* ---------- Замена фигур ---------- */
    function reroll() {
      if (busy || over || !level) return;
      if (!G.spend(REROLL_COST)) return;
      G.sfx('swap');
      tray = newTray(board, cfg, level);
      renderTray();
    }

    /* ---------- Победа и поражение ---------- */
    async function win() {
      const my = session;
      G.sfx('win');
      G.confetti();
      const first = level >= G.state[cfg.unlock];
      const tok = first ? cfg.reward(level) : Math.round(cfg.reward(level) * 0.4);
      G.addTokens(tok);
      let unlockedStage = false;
      if (first) {
        G.state[cfg.unlock] = Math.max(G.state[cfg.unlock], Math.min(11, level + 1));
        if (level === 10 && G.advanceStage(cfg.stage)) unlockedStage = true;
      }
      G.save();
      await G.sleep(700);
      if (my !== session) return;
      const g = goal(level);
      const stars = score >= g * 1.6 ? '⭐⭐⭐' : score >= g * 1.25 ? '⭐⭐' : '⭐';
      if (unlockedStage) {
        await G.modal({
          title: cfg.doneTitle,
          body: `<p class="big">${cfg.doneIcon}</p><p>${cfg.doneText}</p>
            <div class="reward">+${tok} ${G.coin()}</div>`,
          buttons: [{ text: 'На карту', cls: 'btn-primary' }]
        });
        G.go('map');
        return;
      }
      const r = await G.modal({
        title: 'Уровень пройден!',
        body: `<div class="stars">${stars}</div><p>Очки: <b class="hl">${score}</b> (цель ${g})</p>
          <div class="reward">+${tok} ${G.coin()}</div>${first ? '' : '<p class="muted">Повторное прохождение: награда меньше</p>'}`,
        buttons: [
          { text: 'Уровни', cls: 'btn-ghost btn-small', value: 'levels' },
          ...(level < 10 ? [{ text: 'Дальше ▶', cls: 'btn-primary', value: 'next' }] : [{ text: 'Ещё раз', cls: 'btn-primary', value: 'again' }])
        ]
      });
      if (my !== session) return;
      if (r === 'next') startLevel(level + 1);
      else if (r === 'again') startLevel(level);
      else showLevels();
    }

    async function lose() {
      const my = session;
      G.sfx('lose');
      await G.sleep(450);
      if (my !== session) return;
      const r = await G.modal({
        title: 'Нет места!',
        body: `<p class="big">💀</p><p>Фигуры больше некуда поставить. Очки: <b class="hl">${score}</b> из <b class="hl">${goal(level)}</b>.</p>`,
        buttons: [{ text: 'Уровни', cls: 'btn-ghost btn-small', value: 'levels' }, { text: 'Заново', cls: 'btn-primary', value: 'again' }]
      });
      if (my !== session) return;
      if (r === 'again') startLevel(level); else showLevels();
    }

    return M;
  }

  G.bb = create(CAMPS.bb);
  G.bb2 = create(CAMPS.bb2);
})();
