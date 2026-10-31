/* =========================================================
   «Хранитель правил»: интерфейс игры.
   Законы написаны на поле карточками: слово-предмет, «ЭТО» и слово-свойство.
   Слова можно толкать, так законы ломаются и складываются заново.
   Логика (движок и уровни) лежит в rk-engine.js.
   ========================================================= */
(function () {
  'use strict';
  const E = G.rkEngine;
  if (!E) { console.error('Нет движка «Хранителя правил»'); return; }

  const NAME = { ghost: 'ПРИЗРАК', door: 'ДВЕРЬ', coffin: 'ГРОБ', fire: 'ОГОНЬ', pumpkin: 'ТЫКВА' };
  const EMO = { ghost: '👻', door: '🚪', coffin: '⚰️', fire: '🔥', pumpkin: '🎃' };
  const PROP = { you: ['ТЫ', '🕹️'], win: ['ПОБЕДА', '🏆'], stop: ['СТОП', '⛔'], deadly: ['ОПАСНО', '☠️'], push: ['ТОЛКАЙ', '👉'] };
  const ARROW = { U: '⬆️', D: '⬇️', L: '⬅️', R: '➡️' };
  const KEYS = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R',
    'ц': 'U', 'ы': 'D', 'ф': 'L', 'в': 'R' };
  const PAR = [7, 10, 10, 19, 13, 21, 8, 16, 17, 19, 20, 28]; // ходов в самом коротком решении (проверяется автотестом)
  const HINT_COST = 10;
  const LEVELS = E.LEVELS;
  const STORY_END = E.STORY_END;                      // после этого уровня открывается следующая локация, дальше идут тайные
  const reward = L => 40 + 10 * L;

  let screenEl, gridEl, lawsEl, tipEl, movesEl, undoBtn;
  let level = null, st = null, history = [], moves = 0, finished = false, session = 0;
  let els = new Map();
  let prevKeys = new Set();
  let tipTimer = 0;
  const $ = sel => G.$(sel, screenEl);

  const M = {
    _dbg: () => ({ level, st, moves, finished, history: history.length, rules: st ? E.rulesOf(st) : [] }),
    _load: L => startLevel(L),
    PAR,
    enter: function () {
      session++;
      screenEl = G.$('#screen-rk');
      screenEl.innerHTML = `
        <div class="game-col rk">
          <div class="game-head">
            <button class="btn btn-small btn-ghost" id="rk-levels" type="button">☰ Уровни</button>
            <div class="game-title" id="rk-title">Уровень 1</div>
            <button class="btn btn-small btn-purple" id="rk-hint" type="button" title="Подсказка">💡 ${HINT_COST} ${G.coin('sm')}</button>
          </div>
          <div class="rk-laws panel" id="rk-laws"></div>
          <div class="rk-tip" id="rk-tip"></div>
          <div class="rk-boardwrap">
            <div class="rk-board" id="rk-board"><div class="rk-grid" id="rk-grid"></div></div>
          </div>
          <div class="rk-ctrl">
            <button class="rk-key side" id="rk-undo" type="button" title="Отменить ход">↶</button>
            <button class="rk-key" data-dir="U" type="button" aria-label="Вверх">▲</button>
            <button class="rk-key side" id="rk-restart" type="button" title="Начать уровень заново">⟲</button>
            <button class="rk-key" data-dir="L" type="button" aria-label="Влево">◀</button>
            <button class="rk-key" data-dir="D" type="button" aria-label="Вниз">▼</button>
            <button class="rk-key" data-dir="R" type="button" aria-label="Вправо">▶</button>
          </div>
          <div class="rk-count">Ходов: <b id="rk-moves">0</b></div>
        </div>`;
      gridEl = $('#rk-grid'); lawsEl = $('#rk-laws'); tipEl = $('#rk-tip'); movesEl = $('#rk-moves'); undoBtn = $('#rk-undo');
      $('#rk-levels').addEventListener('click', () => { G.sfx('click'); showLevels(); });
      $('#rk-hint').addEventListener('click', hint);
      undoBtn.addEventListener('click', undo);
      $('#rk-restart').addEventListener('click', () => { if (level) { G.sfx('click'); startLevel(level); } });
      G.$$('.rk-key[data-dir]', screenEl).forEach(b => b.addEventListener('click', () => move(b.dataset.dir)));
      bindSwipe($('#rk-board'));
      level = null; st = null; history = []; finished = true; els = new Map(); prevKeys = new Set();
      lawsEl.innerHTML = '<span class="muted">Выбери уровень</span>';
      showLevels();
    },
    leave: function () {
      session++;
      clearTimeout(tipTimer);
    }
  };

  /* ---------- Выбор уровня ---------- */
  async function showLevels() {
    const unlocked = G.state.rkUnlocked;
    const wrap = G.el('div', 'bb-levels rk-levels');
    LEVELS.forEach((lv, i) => {
      const L = i + 1, done = L < unlocked, open = G.levelOpen(L, unlocked);
      const b = G.el('button', 'bb-lvl' + (L > STORY_END ? ' secret' : '') + (done ? ' done' : '') + (open ? '' : ' locked') + (L === unlocked && L <= LEVELS.length ? ' cur' : ''));
      b.type = 'button';
      const best = G.state.rkBest[L];
      b.innerHTML = `<span class="n">${open ? L : '🔒'}</span><small>${open && best ? best + ' ход.' : ''}</small>${done ? '<i>✔</i>' : ''}`;
      b.disabled = !open;
      b.dataset.l = L;
      wrap.appendChild(b);
    });
    const my = session;
    const picked = await G.modal({
      title: 'Хранитель правил', cls: 'wide',
      body: (() => {
        const d = G.el('div');
        d.innerHTML = `<p>Законы лежат на поле карточками. Двигай их, чтобы сломать чужие законы и сложить свои: <b class="hl">ПРЕДМЕТ · ЭТО · СВОЙСТВО</b> в ряд или в столбик.</p>`;
        d.appendChild(wrap);
        d.insertAdjacentHTML('beforeend', `<p class="muted">Пройдено: <b class="hl">${Math.min(LEVELS.length, unlocked - 1)}/${LEVELS.length}</b>. Уровни ${STORY_END + 1}–${LEVELS.length} тайные: там новое слово <b class="hl">ТОЛКАЙ</b>.</p>`);
        return d;
      })(),
      buttons: (level && !finished)
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
    level = L;
    st = E.parse(LEVELS[L - 1].map);
    history = []; moves = 0; finished = false;
    els.forEach(e => e.remove()); els = new Map();
    prevKeys = new Set();
    screenEl.firstElementChild.style.setProperty('--cols', st.w);
    screenEl.firstElementChild.style.setProperty('--rows', st.h);
    $('#rk-title').textContent = 'Уровень ' + L;
    setTip(LEVELS[L - 1].name + '. ' + LEVELS[L - 1].tip);
    sync(st, [], true);
    refresh(true);
  }

  function setTip(text, hint) {
    clearTimeout(tipTimer);
    tipEl.classList.toggle('hint', !!hint);
    tipEl.innerHTML = (hint ? '💡 ' : '📜 ') + text;
  }

  /* ---------- Отрисовка ---------- */
  function mk(o) {
    const el = G.el('div', 'rk-e ' + (o.t === 'o' ? 'rk-o' : 'rk-w t-' + o.t) + ' k-' + o.k);
    el.dataset.id = o.id;
    if (o.t === 'o') el.innerHTML = `<i class="ic">${EMO[o.k]}</i>`;
    else if (o.t === 'n') el.innerHTML = `<div class="card"><i class="ic">${EMO[o.k]}</i><span>${NAME[o.k]}</span></div>`;
    else if (o.t === 'i') el.innerHTML = '<div class="card"><span class="eq">ЭТО</span></div>';
    else el.innerHTML = `<div class="card"><i class="ic">${PROP[o.k][1]}</i><span>${PROP[o.k][0]}</span></div>`;
    return el;
  }
  const place = (el, o) => { el.style.transform = `translate(calc(${o.x} * var(--cell)), calc(${o.y} * var(--cell)))`; };

  /* Привести элементы на поле в соответствие с состоянием. died: id погибших (они исчезают красиво). */
  function sync(state, died, quiet) {
    const seen = new Set();
    state.e.forEach(o => {
      seen.add(o.id);
      let el = els.get(o.id);
      if (!el) {
        el = mk(o);
        place(el, o);
        gridEl.appendChild(el);
        els.set(o.id, el);
        if (!quiet) { el.classList.add('spawn'); setTimeout(() => el.classList.remove('spawn'), 400); }
      } else place(el, o);
    });
    els.forEach((el, id) => {
      if (seen.has(id)) return;
      els.delete(id);
      if (died && died.includes(id)) { el.classList.add('dying'); setTimeout(() => el.remove(), 520); } else el.remove();
    });
  }

  function refresh(quiet) {
    const rules = E.rulesOf(st);
    const P = E.propsOf(rules);
    const onIds = new Set();
    rules.forEach(r => r.ids.forEach(i => onIds.add(i)));
    state_classes(P, onIds);
    renderLaws(rules, quiet);
    movesEl.textContent = moves;
    undoBtn.disabled = !history.length;
    return rules;
  }

  function state_classes(P, onIds) {
    st.e.forEach(o => {
      const el = els.get(o.id);
      if (!el) return;
      if (o.t === 'o') {
        Object.keys(PROP).forEach(p => el.classList.toggle('p-' + p, !!(P[o.k] && P[o.k][p])));
      } else el.classList.toggle('on', onIds.has(o.id));
    });
  }

  function lawHtml(r, extra) {
    return `<span class="rk-law ${extra || ''}" data-k="${r.noun}-${r.prop}">` +
      `<b class="w n">${EMO[r.noun]} ${NAME[r.noun]}</b><b class="w v">ЭТО</b>` +
      `<b class="w p p-${r.prop}">${PROP[r.prop][1]} ${PROP[r.prop][0]}</b></span>`;
  }

  function renderLaws(rules, quiet) {
    const keys = new Set(rules.map(r => r.noun + '-' + r.prop));
    let html = '<div class="rk-laws-h">📜 Законы уровня</div><div class="rk-laws-l">';
    if (!rules.length) html += '<span class="muted">Законов нет. Сложи слова в ряд!</span>';
    const seen = new Set();
    rules.forEach(r => {
      const k = r.noun + '-' + r.prop;
      if (seen.has(k)) return;
      seen.add(k);
      html += lawHtml(r, !quiet && !prevKeys.has(k) ? 'new' : '');
    });
    const gone = [];
    if (!quiet) prevKeys.forEach(k => {
      if (keys.has(k)) return;
      const [noun, prop] = k.split('-');
      gone.push(k);
      html += lawHtml({ noun, prop }, 'gone');
    });
    html += '</div>';
    lawsEl.innerHTML = html;
    if (gone.length) setTimeout(() => G.$$('.rk-law.gone', lawsEl).forEach(e => e.remove()), 900);
    if (!quiet) {
      const added = [...keys].filter(k => !prevKeys.has(k)).length;
      if (added) G.sfx('match', 2);
      else if (gone.length) G.sfx('swap');
    }
    prevKeys = keys;
  }

  /* ---------- Ходы ---------- */
  function move(dir) {
    if (!level || finished || !st) return;
    const r = E.step(st, dir);
    if (!r.moved) {
      if (r.noYou) {
        G.sfx('bad');
        G.toast('Некому ходить: нет закона «… ЭТО ТЫ». Отмени ход ↶');
        undoBtn.classList.remove('nudge'); void undoBtn.offsetWidth; undoBtn.classList.add('nudge');
      } else G.sfx('bad');
      shake();
      return;
    }
    history.push(st);
    const before = st;
    st = r.st;
    moves++;
    const P0 = E.propsOf(E.rulesOf(before));
    const pushed = st.e.some(o => {
      if (o.t === 'o' && P0[o.k] && P0[o.k].you) return false;        // сам герой не считается
      const b = before.e.find(q => q.id === o.id);
      return b && (b.x !== o.x || b.y !== o.y);
    });
    sync(st, r.died);
    refresh(false);
    G.sfx(pushed ? 'place' : 'pick');
    if (r.died && r.died.length) {
      G.sfx('bad');
      G.toast('Герой погиб. Отмени ход ↶ или измени закон!');
    }
    if (r.won) { win(); return; }
    if (r.noYou && !(r.died && r.died.length)) {
      G.toast('Закон «… ЭТО ТЫ» сломан: ходить некому. Отмени ход ↶');
    }
    if (r.noYou) { undoBtn.classList.remove('nudge'); void undoBtn.offsetWidth; undoBtn.classList.add('nudge'); }
  }

  function undo() {
    if (!history.length || !level) return;
    if (finished) return;
    G.sfx('swap');
    st = history.pop();
    moves = Math.max(0, moves - 1);
    sync(st, []);
    refresh(true);
    undoBtn.classList.remove('nudge');
  }

  function shake() {
    const b = $('#rk-board');
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
  }

  /* ---------- Подсказка (поиск в ширину от текущего положения) ---------- */
  let hinting = false;
  async function hint() {
    if (!level || finished) { G.toast('Сначала выбери уровень'); return; }
    if (hinting) return;
    if (G.state.tokens < HINT_COST) { G.sfx('bad'); G.toast('Для подсказки нужно ' + HINT_COST + ' жетонов 🎃'); return; }
    G.toast('👻 Ищу путь…', 1500);
    const my = session, snap = st;
    hinting = true;
    let sol;
    try {
      // поиск идёт кусочками и не замораживает игру; бросаем его, если игрок ушёл с уровня или сходил
      sol = await E.solveAsync(snap, 250000, 8, () => my !== session || st !== snap);
    } finally { hinting = false; }
    if (sol === undefined || my !== session || st !== snap) return;
    if (sol === null) { G.toast('Отсюда пути нет. Отмени несколько ходов ↶ или начни заново ⟲'); return; }
    if (!G.spend(HINT_COST)) return;
    const first = sol.slice(0, 3).split('').map(d => ARROW[d]).join(' ');
    setTip(`${first}${sol.length > 3 ? ' …' : ''} <small>(до победы ${sol.length} ход.)</small>`, true);
    const btn = G.$(`.rk-key[data-dir="${sol[0]}"]`, screenEl);
    if (btn) { btn.classList.add('flash'); setTimeout(() => btn.classList.remove('flash'), 2400); }
    tipTimer = setTimeout(() => setTip(LEVELS[level - 1].name + '. ' + LEVELS[level - 1].tip), 7000);
  }

  /* ---------- Жесты и клавиатура ---------- */
  function bindSwipe(board) {
    let sx = 0, sy = 0, id = null;
    board.addEventListener('pointerdown', e => {
      id = e.pointerId; sx = e.clientX; sy = e.clientY;
      try { board.setPointerCapture(id); } catch (err) { /* ок */ }
    });
    board.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
      sx = e.clientX; sy = e.clientY;          // длинный свайп = несколько ходов подряд
    });
    const end = e => { if (e.pointerId === id) id = null; };
    board.addEventListener('pointerup', end);
    board.addEventListener('pointercancel', end);
  }

  window.addEventListener('keydown', e => {
    if (G.current !== 'rk' || !level) return;
    if (G.$('#modal-root .modal-back:not(.out)')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const d = KEYS[e.key];
    if (d) { e.preventDefault(); move(d); return; }
    if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { e.preventDefault(); undo(); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); startLevel(level); }
  });

  /* ---------- Победа ---------- */
  async function win() {
    finished = true;
    const my = session;
    G.sfx('win');
    G.confetti();
    const el = G.$$('.rk-o.p-you', gridEl)[0];
    if (el) { const b = el.getBoundingClientRect(); G.burst(b.left + b.width / 2, b.top + b.height / 2, ['✨', '⭐', '🎃', '👻'], 14, 140); }
    const first = level >= G.state.rkUnlocked;
    const tok = first ? reward(level) : 12;
    G.addTokens(tok);
    let unlockedStage = false;
    const prevBest = G.state.rkBest[level];
    if (!prevBest || moves < prevBest) G.state.rkBest[level] = moves;
    if (first) G.state.rkUnlocked = Math.max(G.state.rkUnlocked, Math.min(LEVELS.length + 1, level + 1));
    // испытание засчитывается, когда пройден последний основной уровень (даже если до него прыгнули в свободном режиме)
    if (level === STORY_END && G.advanceStage(4)) unlockedStage = true;
    G.save();
    await G.sleep(750);
    if (my !== session) return;
    const par = PAR[level - 1];
    const stars = moves <= par ? '⭐⭐⭐' : moves <= Math.ceil(par * 1.6) ? '⭐⭐' : '⭐';
    if (unlockedStage) {
      await G.modal({
        title: 'Законы теперь твои!',
        body: `<p class="big">📜</p><p>Ты стал настоящим Хранителем правил. На карте открылся <b class="hl">Старый склеп</b>: там снова ждёт Block Blast, но потруднее.</p>
          <p class="muted">А в «Хранителе правил» открылись тайные уровни с новым словом ТОЛКАЙ.</p>
          <div class="reward">+${tok} ${G.coin()}</div>`,
        buttons: [{ text: 'На карту', cls: 'btn-primary' }]
      });
      if (my !== session) return;
      G.go('map');
      return;
    }
    const r = await G.modal({
      title: 'Закон исполнен!',
      body: `<div class="stars">${stars}</div><p>Ходов: <b class="hl">${moves}</b> (лучшее решение: ${par})</p>
        <div class="reward">+${tok} ${G.coin()}</div>${first ? '' : '<p class="muted">Повторное прохождение: награда меньше</p>'}`,
      buttons: [
        { text: 'Уровни', cls: 'btn-ghost btn-small', value: 'levels' },
        ...(level < LEVELS.length ? [{ text: 'Дальше ▶', cls: 'btn-primary', value: 'next' }] : [{ text: 'Ещё раз', cls: 'btn-primary', value: 'again' }])
      ]
    });
    if (my !== session) return;
    if (r === 'next') startLevel(level + 1);
    else if (r === 'again') startLevel(level);
    else showLevels();
  }

  G.rk = M;
})();
