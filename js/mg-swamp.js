/* =========================================================
   Болото призраков: «бей призраков». Образец для остальных мини-игр.
   Призраки высовываются из болотных нор. Тапни призрака, пока он не нырнул.
   Череп (💀) трогать нельзя, золотой призрак (🌟) даёт три очка.
   ========================================================= */
(function () {
  'use strict';

  const KIND = {
    g: { ch: '👻', pts: 1 },
    x: { ch: '🌟', pts: 3 },     // золотой призрак: быстрый и ценный
    s: { ch: '💀', pts: 0 }      // череп: ловушка
  };

  G.mg.register({
    id: 'swamp',
    title: 'Болото призраков',
    icon: '👻',
    intro: 'Призраки вылезают из болотных нор. Тапай их, пока они не нырнули обратно!',
    doneTitle: 'Болото очищено!',
    doneIcon: '👻',
    doneText: 'Призраки попрятались по норам, а над топью снова стало тихо. Дальше путь ведёт в пещеру летучих мышей!',
    levels: [
      { label: '12 👻', task: 'Тапай <b>призраков 👻</b>, пока они не нырнули. Поймай 12 за 30 секунд.',
        cols: 3, rows: 3, time: 30, goal: 12, up: 1.3, gap: 0.7, skull: 0, gold: 0, hp: 3 },
      { label: '16 👻', task: 'Среди призраков попадаются <b>черепа 💀</b>. Их трогать нельзя: три ошибки, и всё!',
        cols: 3, rows: 3, time: 30, goal: 16, up: 1.15, gap: 0.58, skull: 0.22, gold: 0, hp: 3 },
      { label: '22 очка', task: 'Нор стало больше. <b>Золотой призрак 🌟</b> быстрый, зато стоит 3 очка.',
        cols: 3, rows: 4, time: 35, goal: 22, up: 1.0, gap: 0.46, skull: 0.25, gold: 0.1, hp: 3 },
      { label: '30 очков', task: 'Ночь в разгаре! Призраки быстрые, черепов много. Набери 30 очков за 40 секунд.',
        cols: 3, rows: 4, time: 40, goal: 30, up: 0.85, gap: 0.38, skull: 0.3, gold: 0.12, hp: 3 }
    ],

    start(ctx, L, cfg) {
      const box = ctx.box;
      const n = cfg.cols * cfg.rows;
      const slots = new Array(n).fill(null);
      let score = 0, hp = cfg.hp, spawnIn = 0.4, missed = 0, mistakes = 0;

      /* разметка: сетка нор */
      box.insertAdjacentHTML('beforeend', '<i class="sw-fog"></i><i class="sw-reed r1">🌿</i><i class="sw-reed r2">🌿</i><i class="sw-reed r3">🍄</i>');
      const grid = G.el('div', 'sw-grid');
      grid.style.setProperty('--c', cfg.cols);
      const holes = [];
      for (let i = 0; i < n; i++) {
        const h = G.el('div', 'sw-hole');
        h.dataset.i = i;
        h.innerHTML = '<i class="sw-back"></i><div class="sw-pit"><b class="sw-g"></b></div><i class="sw-lip"></i>';
        grid.appendChild(h);
        holes.push({ el: h, g: h.querySelector('.sw-g') });
      }
      box.appendChild(grid);
      ctx.onResize((w, h) => {
        const cell = Math.floor(Math.min((w - 24) / cfg.cols, (h - 24) / cfg.rows));
        grid.style.setProperty('--cell', cell + 'px');
      });

      ctx.chip('hp', '❤️', hp);
      const timer = ctx.countdown(cfg.time, () => {
        ctx.lose({ title: 'Время вышло!', icon: '⏳', text: `Набрано ${score} из ${cfg.goal}. Призраки оказались шустрее!` });
      });
      ctx.goal(0, cfg.goal);

      function spawn() {
        const free = [];
        for (let i = 0; i < n; i++) if (!slots[i]) free.push(i);
        if (!free.length) return;
        const i = free[Math.floor(Math.random() * free.length)];
        const r = Math.random();
        const kind = r < cfg.skull ? 's' : r < cfg.skull + cfg.gold ? 'x' : 'g';
        const life = cfg.up * (kind === 'x' ? 0.7 : 1) * (0.8 + Math.random() * 0.4);
        slots[i] = { kind, ttl: life };
        const H = holes[i];
        H.g.textContent = KIND[kind].ch;
        H.el.classList.remove('hit', 'bad');
        H.el.classList.add('up');
        if (kind === 's') H.el.classList.add('skull');
        else H.el.classList.remove('skull');
      }

      function hide(i) {
        slots[i] = null;
        holes[i].el.classList.remove('up');
      }

      ctx.loop(dt => {
        spawnIn -= dt;
        if (spawnIn <= 0) { spawn(); spawnIn = cfg.gap * (0.6 + Math.random() * 0.8); }
        for (let i = 0; i < n; i++) {
          const s = slots[i];
          if (!s) continue;
          s.ttl -= dt;
          if (s.ttl <= 0) { if (s.kind !== 's') missed++; hide(i); }
        }
      });

      function tap(i) {
        const s = slots[i];
        if (!s || ctx.over || ctx.paused) return;
        const H = holes[i];
        const r = H.el.getBoundingClientRect(), b = box.getBoundingClientRect();
        const px = r.left - b.left + r.width / 2, py = r.top - b.top + r.height * 0.3;
        hide(i);
        if (s.kind === 's') {
          mistakes++;
          hp--;
          ctx.chip('hp', '❤️', Math.max(0, hp), true);
          G.sfx('scare');
          ctx.shake();
          ctx.float(px, py, '−❤', 'red');
          H.el.classList.add('bad');
          if (hp <= 0) ctx.lose({ title: 'Призраки победили!', icon: '💀', text: 'Слишком много черепов. Будь внимательнее: их трогать нельзя!' });
          return;
        }
        const pts = KIND[s.kind].pts;
        score += pts;
        G.sfx(s.kind === 'x' ? 'ding' : 'pop');
        H.el.classList.add('hit');
        ctx.float(px, py, '+' + pts, s.kind === 'x' ? '' : 'green');
        ctx.burst(px, py, s.kind === 'x' ? ['⭐', '✨'] : ['✨', '💨'], s.kind === 'x' ? 8 : 4, 60);
        ctx.goal(Math.min(score, cfg.goal), cfg.goal);
        if (score >= cfg.goal) {
          const frac = timer.left / cfg.time;
          let stars = frac >= 0.4 ? 3 : frac >= 0.2 ? 2 : 1;
          if (mistakes >= 2) stars = Math.max(1, stars - 1);
          ctx.win({ stars, score, text: `Очков: <b class="hl">${score}</b>, ошибок: ${mistakes}` });
        }
      }

      ctx.listen(grid, 'pointerdown', e => {
        const h = e.target.closest && e.target.closest('.sw-hole');
        if (h) tap(+h.dataset.i);
      });

      ctx.debug = {
        up: () => slots.map((s, i) => s ? { i, kind: s.kind } : null).filter(Boolean),
        score: () => score, hp: () => hp, missed: () => missed, goal: cfg.goal
      };
    }
  });
})();
