/* =========================================================
   «Башня ведьмы»: ловишь момент и кладёшь этаж ровно на нижний.
   Блок ездит над башней, касание бросает его. Что выступает за нижний этаж,
   отваливается. Попал точно: этаж целый, а серия точных попаданий даже
   возвращает башне ширину. Мимо нижнего этажа: башня рушится.
   Мир: ширина поля = 100 единиц, высота этажа H_BLOCK единиц, ось Y направлена вверх.
   ========================================================= */
(function () {
  'use strict';

  const H_BLOCK = 8;
  const LEVELS = [
    { name: 'Сторожка',     target: 8,  speed: 52, w: 56, tol: 3.8 },
    { name: 'Часовня',      target: 12, speed: 60, w: 55, tol: 3.6 },
    { name: 'Колокольня',   target: 15, speed: 67, w: 53, tol: 3.5 },
    { name: 'Замок',        target: 18, speed: 74, w: 51, tol: 3.3 },
    { name: 'Крепость',     target: 22, speed: 80, w: 49, tol: 3.2 },
    { name: 'Башня ведьмы', target: 26, speed: 88, w: 47, tol: 3.0 }
  ];
  const SPEED_GAIN = 0.007;          // скорость растёт с каждым этажом
  const GROUND_VIS = 9;               // сколько единиц земли видно под башней в начале
  const GROW = 2.6;                  // насколько расширяется этаж после серии точных попаданий
  const reward = L => 50 + 15 * L;

  const PAL = [
    ['#ffcf7a', '#ff8a1f', '#a84400'],   // тыквенный
    ['#d2b0ff', '#8a4fff', '#4a2299'],   // фиолетовый
    ['#d8ff8a', '#8fd021', '#477f00'],   // болотный
    ['#fff4d6', '#d9c58f', '#8f7a48'],   // костяной
    ['#ff9aa6', '#d62839', '#7a0c1a'],   // кровавый
    ['#a8e8ff', '#3aaee0', '#145f8a']    // лунный
  ];

  const speedAt = (cfg, floors) => cfg.speed * (1 + SPEED_GAIN * floors);

  /* Один бросок. top: верхний этаж {x,w}; p: левый край падающего блока; bw: его ширина.
     perfect: этаж целый; cut: часть отвалилась; miss: нет опоры. */
  function resolve(top, p, bw, tol, startW, combo) {
    const d = p - top.x;
    if (Math.abs(d) <= tol) {
      let nx = top.x, nw = top.w;
      const c2 = combo + 1;
      if (c2 >= 3) {
        const grow = Math.min(GROW, startW - nw);
        if (grow > 0) { nx -= grow / 2; nw += grow; }
      }
      nx = Math.max(0, Math.min(100 - nw, nx));
      return { kind: 'perfect', x: nx, w: nw, combo: c2 };
    }
    const lo = Math.max(p, top.x), hi = Math.min(p + bw, top.x + top.w), ov = hi - lo;
    if (ov < 0.5) return { kind: 'miss', combo: 0 };
    const cut = d < 0 ? { x: p, w: top.x - p } : { x: top.x + top.w, w: p + bw - (top.x + top.w) };
    return { kind: 'cut', x: lo, w: ov, cut, combo: 0 };
  }
  G.twLogic = { LEVELS, resolve, speedAt, H_BLOCK, GROW };

  /* ---------------- Игровой модуль ---------------- */
  let screenEl, stageEl, cv, cx, hintEl, fillEl, lblEl, perfEl, bestEl, titleEl, dropBtn;
  let level = null, cfg = null, tower = [], base = null, cur = null;
  let floors = 0, perfects = 0, combo = 0, bestCombo = 0, mode = 'idle';     // idle | ready | play | over
  let pieces = [], rings = [], camY = 0, camT = 0, raf = 0, last = 0, session = 0, lastDrop = 0, tNow = 0;
  let dpr = 1, cw = 0, ch = 0;
  const $ = sel => G.$(sel, screenEl);
  const topOf = () => tower.length ? tower[tower.length - 1] : base;

  const M = {
    LEVELS,
    _dbg: () => ({ level, floors, perfects, combo, mode, top: topOf() && { x: topOf().x, w: topOf().w }, cur: cur && { p: cur.p, bw: cur.bw, dir: cur.dir, v: cur.v },
      tol: cfg && cfg.tol, target: cfg && cfg.target, camY, pieces: pieces.length }),
    _load: L => startLevel(L),
    enter: function () {
      session++;
      screenEl = G.$('#screen-tw');
      screenEl.innerHTML = `
        <div class="game-col tws">
          <div class="game-head">
            <button class="btn btn-small btn-ghost" id="tw-levels" type="button">☰ Уровни</button>
            <div class="game-title" id="tw-title">Уровень 1</div>
            <div class="chip" title="Лучший результат">🏆 <b id="tw-best">0</b></div>
          </div>
          <div class="tw-info">
            <div class="bar bb-goalbar"><i id="tw-fill"></i><span class="bar-label" id="tw-lbl">Этаж 0 / 0</span></div>
            <div class="chip" title="Точных попаданий подряд">✨ <b id="tw-perf">0</b></div>
          </div>
          <div class="tw-stage" id="tw-stage">
            <canvas id="tw-cv"></canvas>
            <div class="tw-hint" id="tw-hint">Нажми, чтобы начать</div>
          </div>
          <button class="btn btn-big tw-drop" id="tw-drop" type="button">⬇ СТОП!</button>
        </div>`;
      stageEl = $('#tw-stage'); cv = $('#tw-cv'); cx = cv.getContext('2d');
      hintEl = $('#tw-hint'); fillEl = $('#tw-fill'); lblEl = $('#tw-lbl'); perfEl = $('#tw-perf'); bestEl = $('#tw-best'); titleEl = $('#tw-title'); dropBtn = $('#tw-drop');
      $('#tw-levels').addEventListener('click', () => { G.sfx('click'); showLevels(); });
      const press = e => { e.preventDefault(); drop(); };
      stageEl.addEventListener('pointerdown', press);
      dropBtn.addEventListener('pointerdown', press);
      level = null; cfg = null; tower = []; base = { x: 25, w: 50, idx: 0, base: true }; cur = null; pieces = []; rings = []; mode = 'idle'; floors = 0; camY = camT = -GROUND_VIS;
      hintEl.classList.add('off');
      resize();
      startLoop();
      showLevels();
    },
    leave: function () {
      session++;
      cancelAnimationFrame(raf); raf = 0;
    }
  };

  /* ---------- Выбор уровня ---------- */
  async function showLevels() {
    const unlocked = G.state.twUnlocked;
    const wrap = G.el('div', 'bb-levels tw-levels');
    LEVELS.forEach((lv, i) => {
      const L = i + 1, done = L < unlocked, open = G.levelOpen(L, unlocked);
      const b = G.el('button', 'bb-lvl' + (done ? ' done' : '') + (open ? '' : ' locked') + (L === unlocked && L <= LEVELS.length ? ' cur' : ''));
      b.type = 'button';
      b.innerHTML = `<span class="n">${open ? L : '🔒'}</span><small>${lv.target} эт.</small>${done ? '<i>✔</i>' : ''}`;
      b.disabled = !open;
      b.dataset.l = L;
      wrap.appendChild(b);
    });
    const my = session;
    const picked = await G.modal({
      title: 'Башня ведьмы', cls: 'wide',
      body: (() => {
        const d = G.el('div');
        d.innerHTML = `<p>Блок ездит туда-сюда. Нажми, когда он окажется <b class="hl">ровно над нижним этажом</b>: всё, что выступает, отвалится. Три точных попадания подряд возвращают башне ширину.</p>`;
        d.appendChild(wrap);
        d.insertAdjacentHTML('beforeend', `<p class="muted">Пройдено: <b class="hl">${Math.min(LEVELS.length, unlocked - 1)}/${LEVELS.length}</b>. Цифра под номером: сколько этажей нужно построить.</p>`);
        return d;
      })(),
      buttons: (level && mode === 'play')
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
    level = L; cfg = LEVELS[L - 1];
    tower = []; pieces = []; rings = [];
    floors = 0; perfects = 0; combo = 0; bestCombo = 0; camY = camT = -GROUND_VIS;
    base = { x: (100 - cfg.w) / 2, w: cfg.w, idx: 0, base: true };
    spawn();
    mode = 'ready';
    titleEl.textContent = L + '. ' + cfg.name;
    bestEl.textContent = G.state.twBest[L] || 0;
    hintEl.textContent = 'Нажми, чтобы начать';
    hintEl.classList.remove('off');
    updateHud();
    if (!raf) startLoop();
  }

  /* Новый движущийся блок: стартует с краёв по очереди */
  function spawn() {
    const t = topOf();
    const bw = t.w, v = speedAt(cfg, floors);
    const pmin = -bw * 0.35, pmax = 100 - bw * 0.65;
    const fromLeft = floors % 2 === 0;
    cur = { p: fromLeft ? pmin : pmax, bw, dir: fromLeft ? 1 : -1, v, pmin, pmax, idx: floors };
  }

  function updateHud() {
    fillEl.style.width = Math.min(100, floors / cfg.target * 100) + '%';
    lblEl.textContent = 'Этаж ' + floors + ' / ' + cfg.target;
    perfEl.textContent = combo;
    perfEl.parentNode.classList.toggle('hot', combo >= 2);
  }

  /* ---------- Бросок ---------- */
  function drop() {
    if (!level) return;
    const now = performance.now();
    if (mode === 'ready') { mode = 'play'; hintEl.classList.add('off'); lastDrop = now; G.sfx('pick'); return; }
    if (mode !== 'play' || now - lastDrop < 110) return;
    lastDrop = now;
    const t = topOf();
    const r = resolve(t, cur.p, cur.bw, cfg.tol, cfg.w, combo);
    const idx = floors + 1;
    if (r.kind === 'miss') { fail(); return; }
    combo = r.combo;
    bestCombo = Math.max(bestCombo, combo);
    const blk = { x: r.x, w: r.w, idx, land: 1 };
    tower.push(blk);
    floors++;
    if (r.kind === 'perfect') {
      perfects++;
      rings.push({ x: blk.x, y: (floors - 1) * H_BLOCK, w: blk.w, age: 0 });
      G.sfx('match', Math.min(combo + 1, 6));
      const p = toScreen(blk.x + blk.w / 2, floors * H_BLOCK);
      G.floatText(p.x, p.y - 8, combo >= 2 ? 'ИДЕАЛЬНО ×' + combo : 'ИДЕАЛЬНО!', 'green');
      if (combo >= 3) G.burst(p.x, p.y, ['✨', '🎃', '🦇'], 7, 90);
    } else {
      pieces.push({ x: r.cut.x, y: (floors - 1) * H_BLOCK, w: r.cut.w, idx, vx: (r.cut.x < t.x ? -1 : 1) * (10 + Math.random() * 16), vy: 10, rot: 0, vr: (r.cut.x < t.x ? -1 : 1) * (1.4 + Math.random() * 1.4), a: 1 });
      G.sfx('place');
    }
    camT = Math.max(-GROUND_VIS, (floors + 2) * H_BLOCK - viewH() * 0.52);
    updateHud();
    if (floors >= cfg.target) { win(); return; }
    spawn();
  }

  /* ---------- Падение башни ---------- */
  async function fail() {
    mode = 'over';
    const my = session;
    // промахнувшийся блок падает целиком, затем рушится вся башня сверху вниз
    pieces.push({ x: cur.p, y: floors * H_BLOCK, w: cur.bw, idx: floors + 1, vx: cur.dir * 14, vy: 6, rot: 0, vr: cur.dir * 1.8, a: 1 });
    const n = tower.length;
    tower.forEach((b, i) => {
      const d = (n - 1 - i) * 0.05;
      setTimeout(() => {
        if (my !== session) return;
        const k = tower.indexOf(b);
        if (k < 0) return;
        tower.splice(k, 1);
        pieces.push({ x: b.x, y: i * H_BLOCK, w: b.w, idx: b.idx, vx: (Math.random() - 0.5) * 50, vy: 8 + Math.random() * 14, rot: 0, vr: (Math.random() - 0.5) * 5, a: 1 });
      }, 700 + d * 1000);
    });
    G.sfx('boom');
    const prev = G.state.twBest[level] || 0;
    if (floors > prev) { G.state.twBest[level] = floors; G.save(); }
    await G.sleep(700 + n * 50 + 1100);
    if (my !== session) return;
    G.sfx('lose');
    const r = await G.modal({
      title: 'Башня рухнула!',
      body: `<p class="big">🏚️</p><p>Этажей: <b class="hl">${floors}</b> из <b class="hl">${cfg.target}</b>. Точных попаданий: ${perfects}.</p>
        <p class="muted">Совет: смотри на пунктирные линии. Нажимай, когда края блока совпадают с ними.</p>`,
      buttons: [{ text: 'Уровни', cls: 'btn-ghost btn-small', value: 'levels' }, { text: 'Ещё раз', cls: 'btn-primary', value: 'again' }]
    });
    if (my !== session) return;
    if (r === 'again') startLevel(level); else showLevels();
  }

  /* ---------- Победа ---------- */
  async function win() {
    mode = 'over';
    const my = session;
    G.sfx('win');
    G.confetti();
    const first = level >= G.state.twUnlocked;
    const tok = first ? reward(level) : 12;
    G.addTokens(tok);
    if (floors > (G.state.twBest[level] || 0)) G.state.twBest[level] = floors;
    let finished = false;
    if (first) {
      G.state.twUnlocked = Math.max(G.state.twUnlocked, Math.min(LEVELS.length + 1, level + 1));
      if (level === LEVELS.length && G.advanceStage(6)) finished = true;
    }
    G.save();
    await G.sleep(1100);
    if (my !== session) return;
    const ratio = perfects / cfg.target;
    const stars = ratio >= 0.5 ? '⭐⭐⭐' : ratio >= 0.25 ? '⭐⭐' : '⭐';
    if (finished) {
      const bonus = 150;
      G.addTokens(bonus);
      await G.modal({
        title: 'Король Хэллоуина!',
        body: `<p class="big">👑🎃🧙</p><p>Ты прошёл все испытания города: кладбище, комнату призраков, конфетное поле, законы, склеп и башню ведьмы. Ведьма дарит тебе награду.</p>
          <div class="reward">+${tok + bonus} ${G.coin()}</div>
          ${G.mg && G.mg.order.length
            ? '<p>Но вдали завыл волк: Король Тыкв зовёт тебя в <b class="hl">Тёмный лес</b>. Там тебя ждут новые мини-игры, он уже открыт на карте!</p>'
            : '<p class="muted">Загляни в лавку ведьмы и обставь свой дом!</p>'}`,
        buttons: [{ text: 'На карту', cls: 'btn-primary' }]
      });
      if (my !== session) return;
      G.go('map');
      return;
    }
    const r = await G.modal({
      title: 'Башня построена!',
      body: `<div class="stars">${stars}</div><p>Этажей: <b class="hl">${floors}</b>. Точных попаданий: <b class="hl">${perfects}</b>, лучшая серия: ${bestCombo}.</p>
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

  /* ---------- Цикл ---------- */
  function startLoop() {
    cancelAnimationFrame(raf);
    last = performance.now();
    const my = session;
    const loop = t => {
      if (!screenEl || G.current !== 'tw') { raf = 0; return; }
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      tNow += dt;
      update(dt);
      draw();
    };
    raf = requestAnimationFrame(loop);
    void my;
  }

  function update(dt) {
    if (mode === 'play' && cur) {
      cur.p += cur.dir * cur.v * dt;
      if (cur.p > cur.pmax) { cur.p = 2 * cur.pmax - cur.p; cur.dir = -1; }
      else if (cur.p < cur.pmin) { cur.p = 2 * cur.pmin - cur.p; cur.dir = 1; }
    }
    camY += (camT - camY) * Math.min(1, dt * 5);
    tower.forEach(b => { if (b.land > 0) b.land = Math.max(0, b.land - dt * 5); });
    for (let i = pieces.length - 1; i >= 0; i--) {
      const q = pieces[i];
      q.vy -= 190 * dt;
      q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
      if (q.y < camY - 40) pieces.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) { rings[i].age += dt; if (rings[i].age > 0.5) rings.splice(i, 1); }
  }

  /* ---------- Рисование ---------- */
  const viewH = () => (ch && cw ? 100 * ch / cw : 160);
  function resize() {
    if (!cv) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    cw = w; ch = h;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  /* мир → координаты страницы (для всплывающих надписей) */
  function toScreen(x, y) {
    const r = cv.getBoundingClientRect();
    const s = r.width / 100;
    return { x: r.left + x * s, y: r.top + r.height - (y - camY) * s };
  }

  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    cx.beginPath();
    cx.moveTo(x + r, y);
    cx.arcTo(x + w, y, x + w, y + h, r);
    cx.arcTo(x + w, y + h, x, y + h, r);
    cx.arcTo(x, y + h, x, y, r);
    cx.arcTo(x, y, x + w, y, r);
    cx.closePath();
  }

  /* Эмодзи рисуются один раз в маленький canvas и дальше только копируются: fillText каждый кадр слишком дорог */
  const emoCache = {};
  function emo(ch, px) {
    const size = Math.max(8, Math.round(px));
    const k = ch + '|' + size;
    let c = emoCache[k];
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = Math.round(size * 1.4);
      const g = c.getContext('2d');
      g.font = size + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(ch, c.width / 2, c.height / 2 + size * 0.05);
      emoCache[k] = c;
    }
    return c;
  }
  function drawEmo(ch, px, x, y) {      // x, y: центр
    const c = emo(ch, px);
    cx.drawImage(c, x - c.width / 2, y - c.height / 2);
  }

  /* Тело этажа: кирпич, блик, окно или тыква. c: контекст, (x, yTop): левый верх, hh: высота.
     Окна и тыквы привязаны к «мировым» координатам, поэтому при обрезке этажа они не прыгают. */
  function paintBody(c, b, x, yTop, w, hh, s, fancy) {
    const h = H_BLOCK * s, idx = b.idx || 0;
    const pal = PAL[idx % PAL.length];
    const g = c.createLinearGradient(0, yTop, 0, yTop + hh);
    g.addColorStop(0, pal[0]); g.addColorStop(0.2, pal[1]); g.addColorStop(1, pal[2]);
    const keep = cx; cx = c;
    rr(x, yTop, w, hh, h * 0.16);
    c.fillStyle = g; c.fill();
    c.save();
    c.clip();
    c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = Math.max(1, s * 0.22);
    c.beginPath();
    c.moveTo(x, yTop + hh * 0.5); c.lineTo(x + w, yTop + hh * 0.5);
    const off = (idx % 2) * 6;
    for (let wx = Math.floor((b.x - off) / 12) * 12 + off; wx < b.x + b.w; wx += 12) {
      const sx = x + (wx - b.x) * s;
      if (sx <= x || sx >= x + w) continue;
      const half = (Math.floor(wx / 12) + idx) % 2 === 0;
      c.moveTo(sx, half ? yTop : yTop + hh * 0.5); c.lineTo(sx, half ? yTop + hh * 0.5 : yTop + hh);
    }
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,.3)';
    c.fillRect(x, yTop, w, hh * 0.13);
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(x, yTop + hh * 0.88, w, hh * 0.12);
    if (!b.base) {
      if (idx % 3 === 1) {
        const wx = 14 + (idx * 37) % 70;
        if (wx - 3 > b.x && wx + 3 < b.x + b.w) {
          const ax = x + (wx - b.x) * s, aw = 4.6 * s, ay = yTop + hh * 0.2, ah = hh * 0.62;
          if (fancy) { c.shadowColor = '#ffd26a'; c.shadowBlur = s * 2.2; }
          c.fillStyle = '#ffe58a';
          c.beginPath();
          c.moveTo(ax - aw / 2, ay + ah); c.lineTo(ax - aw / 2, ay + aw / 2);
          c.arc(ax, ay + aw / 2, aw / 2, Math.PI, 0);
          c.lineTo(ax + aw / 2, ay + ah); c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(70,20,0,.75)';
          c.fillRect(ax - s * 0.2, ay + aw / 2, s * 0.4, ah - aw / 2);
        }
      } else if (idx % 5 === 2) {
        const wx = 18 + (idx * 29) % 64;
        if (wx - 4 > b.x && wx + 4 < b.x + b.w) {
          const px = x + (wx - b.x) * s;
          const sp = emo('🎃', hh * 0.74);
          c.drawImage(sp, px - sp.width / 2, yTop + hh * 0.54 - sp.height / 2);
        }
      }
    }
    c.restore();
    c.lineWidth = Math.max(1.2, s * 0.34); c.strokeStyle = 'rgba(18,5,28,.9)';
    rr(x, yTop, w, hh, h * 0.16); c.stroke();
    cx = keep;
  }

  /* Поставленные этажи не меняются, поэтому каждый рисуется один раз в свою «картинку» и дальше копируется */
  const PAD = 3;
  function blockSprite(b, s) {
    const key = (b.idx || 0) + '|' + b.x.toFixed(2) + '|' + b.w.toFixed(2) + '|' + s.toFixed(3);
    if (b._k === key) return b._spr;
    const h = H_BLOCK * s, w = b.w * s;
    const sp = document.createElement('canvas');
    sp.width = Math.ceil(w) + PAD * 2; sp.height = Math.ceil(h) + PAD * 2;
    paintBody(sp.getContext('2d'), b, PAD, PAD, w, h, s, true);
    b._k = key; b._spr = sp;
    return sp;
  }

  function drawBlock(b, yu, s, Y, cache) {
    const h = H_BLOCK * s, x = b.x * s, w = b.w * s;
    const yTop0 = Y(yu + H_BLOCK);
    if (cache && !b.land) {
      cx.drawImage(blockSprite(b, s), x - PAD, yTop0 - PAD);
      return;
    }
    const sq = b.land ? 1 - 0.13 * Math.sin(b.land * Math.PI) : 1;
    const hh = h * sq;
    paintBody(cx, b, x, yTop0 + (h - hh), w, hh, s, !!cache);
  }

  function draw() {
    if (!cv || !cx) return;
    if (cv.clientWidth !== cw || cv.clientHeight !== ch) resize();
    if (!cw || !ch) return;
    const W = cv.width, Hh = cv.height, s = W / 100;
    const Y = y => Hh - (y - camY) * s;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, W, Hh);

    // небо: звёзды с параллаксом
    for (let i = 0; i < 38; i++) {
      const sx = ((i * 53) % 100) * s;
      const base0 = ((i * 97) % 100) / 100;
      const sy = (((base0 * Hh + camY * s * 0.12 * (0.4 + (i % 3) * 0.3)) % Hh) + Hh) % Hh;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(tNow * 1.5 + i));
      cx.fillStyle = 'rgba(255,245,210,' + (0.5 * tw).toFixed(2) + ')';
      cx.fillRect(sx, Hh - sy, Math.max(1, s * 0.35), Math.max(1, s * 0.35));
    }
    // летучие мыши, плывут с параллаксом
    for (let i = 0; i < 3; i++) {
      const bx = ((tNow * (6 + i * 4) + i * 40) % 130) - 15;
      const by = 60 + i * 75 + Math.sin(tNow * 2 + i) * 4;
      const sy = Y(by) + camY * s * 0.5;
      cx.globalAlpha = 0.75;
      drawEmo('🦇', s * 5, bx * s, sy);
      cx.globalAlpha = 1;
    }

    // земля и кладбище
    const gy = Y(0);
    if (gy < Hh + 60 * s) {
      const gg = cx.createLinearGradient(0, gy, 0, gy + 30 * s);
      gg.addColorStop(0, '#34195a'); gg.addColorStop(1, '#10061f');
      cx.fillStyle = gg; cx.fillRect(0, gy, W, Hh - gy + 60 * s);
      cx.fillStyle = '#4b7a1f'; cx.fillRect(0, gy, W, Math.max(2, s * 0.9));
      cx.fillStyle = 'rgba(155,226,43,.35)'; cx.fillRect(0, gy, W, Math.max(1, s * 0.35));
      // надгробия
      [[7, 7], [91, 8.5], [18, 5]].forEach(([tx, th], i) => {
        cx.fillStyle = i === 2 ? '#6b6486' : '#8b84a8';
        const tw2 = 6 * s;
        rr(tx * s - tw2 / 2, gy - th * s, tw2, th * s + 2, tw2 / 2.2); cx.fill();
        cx.strokeStyle = 'rgba(20,6,30,.8)'; cx.lineWidth = Math.max(1, s * 0.3); cx.stroke();
        cx.fillStyle = 'rgba(20,6,30,.45)';
        cx.fillRect(tx * s - s * 0.3, gy - th * s * 0.75, s * 0.6, s * 2.2);
        cx.fillRect(tx * s - s * 1.2, gy - th * s * 0.6, s * 2.4, s * 0.6);
      });
      drawEmo('🎃', s * 6, 82 * s, gy - s * 2.4);
      drawEmo('🎃', s * 6, 12 * s, gy + s * 1.6);
      drawEmo('🕸️', s * 6, 96 * s, gy - s * 5.2);
      // пенёк-основание башни
      const bx = (base.x - 5) * s, bw = (base.w + 10) * s;
      const bg = cx.createLinearGradient(0, gy - 3.2 * s, 0, gy + 1);
      bg.addColorStop(0, '#8b84a8'); bg.addColorStop(1, '#3e3860');
      rr(bx, gy - 3.2 * s, bw, 3.6 * s, s * 1.2); cx.fillStyle = bg; cx.fill();
      cx.strokeStyle = 'rgba(20,6,30,.9)'; cx.lineWidth = Math.max(1.2, s * 0.34); cx.stroke();
    }

    // линия вершины
    if (cfg) {
      const ty = Y(cfg.target * H_BLOCK);
      if (ty > -20 && ty < Hh + 20) {
        cx.save();
        cx.setLineDash([s * 2, s * 1.6]);
        cx.strokeStyle = 'rgba(255,214,102,.85)'; cx.lineWidth = Math.max(1.5, s * 0.45);
        cx.beginPath(); cx.moveTo(0, ty); cx.lineTo(W, ty); cx.stroke();
        cx.restore();
        cx.font = '800 ' + Math.round(s * 3.4) + 'px "Trebuchet MS", sans-serif';
        cx.textAlign = 'left'; cx.textBaseline = 'bottom';
        cx.fillStyle = '#ffd666';
        cx.fillText('ВЕРШИНА', 2 * s, ty - s * 0.7);
        drawEmo('🧙', s * 5, W - 4.5 * s, ty - s * 3);
      }
    }

    // пунктиры-направляющие: края верхнего этажа
    const t = topOf();
    if (t && mode !== 'idle') {
      cx.save();
      cx.setLineDash([s * 1.4, s * 1.4]);
      cx.strokeStyle = mode === 'play' ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.18)';
      cx.lineWidth = Math.max(1, s * 0.3);
      const yTopT = Y(floors * H_BLOCK);
      [t.x, t.x + t.w].forEach(ex => { cx.beginPath(); cx.moveTo(ex * s, yTopT); cx.lineTo(ex * s, Math.max(0, yTopT - 30 * s)); cx.stroke(); });
      cx.restore();
    }

    // этажи
    tower.forEach((b, i) => {
      const yb = Y(i * H_BLOCK);
      if (yb < -H_BLOCK * s || Y((i + 1) * H_BLOCK) > Hh) return;      // за пределами экрана
      drawBlock(b, i * H_BLOCK, s, Y, true);
    });

    // кольца точного попадания
    rings.forEach(r => {
      const k = r.age / 0.5, grow = k * 3.4;
      cx.save();
      cx.globalAlpha = 1 - k;
      const rx = (r.x - grow) * s, ry = Y(r.y + H_BLOCK + grow), rw = (r.w + grow * 2) * s, rh = (H_BLOCK + grow * 2) * s;
      cx.strokeStyle = 'rgba(155,226,43,.45)'; cx.lineWidth = Math.max(4, s * 1.8);
      rr(rx, ry, rw, rh, s * 1.4); cx.stroke();
      cx.strokeStyle = '#d4ff8a'; cx.lineWidth = Math.max(2, s * 0.7);
      rr(rx, ry, rw, rh, s * 1.4); cx.stroke();
      cx.restore();
    });

    // движущийся блок
    if (cur && mode !== 'over') {
      const bob = { x: cur.p, w: cur.bw, idx: cur.idx + 1 };
      const gy2 = Y((floors + 1) * H_BLOCK);
      cx.fillStyle = 'rgba(255,170,60,.28)';
      rr(bob.x * s - s * 1.1, gy2 - s * 1.1, bob.w * s + s * 2.2, H_BLOCK * s + s * 2.2, s * 1.6); cx.fill();
      drawBlock(bob, floors * H_BLOCK, s, Y, false);
    }

    // осколки и падающие этажи
    pieces.forEach(q => {
      const w = q.w * s, h = H_BLOCK * s;
      cx.save();
      cx.translate((q.x + q.w / 2) * s, Y(q.y + H_BLOCK / 2));
      cx.rotate(q.rot);
      cx.translate(-(q.x + q.w / 2) * s, -Y(q.y + H_BLOCK / 2));
      drawBlock({ x: q.x, w: q.w, idx: q.idx }, q.y, s, Y);
      cx.restore();
      void w; void h;
    });

    // ведьма на вершине после победы
    if (mode === 'over' && cfg && floors >= cfg.target && tower.length) {
      const tp = tower[tower.length - 1];
      drawEmo('🧙', s * 12, (tp.x + tp.w / 2) * s, Y(floors * H_BLOCK) - s * 5.4 - Math.abs(Math.sin(tNow * 4)) * s * 2);
    }
  }

  /* ---------- Клавиатура ---------- */
  window.addEventListener('keydown', e => {
    if (G.current !== 'tw' || !level) return;
    if (G.$('#modal-root .modal-back:not(.out)')) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); if (!e.repeat) drop(); }
  });
  window.addEventListener('resize', () => { if (G.current === 'tw') resize(); });

  G.tw = M;
})();
