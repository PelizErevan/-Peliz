/* =========================================================
   Зельеварня: дедукция в духе Mastermind.
   Зельевар загадал рецепт из флаконов. Собери пробу, нажми «Проверить»:
   ● (салатовая бусина) — флакон на своём месте, ○ (кольцо) — цвет есть, но место другое.
   ========================================================= */
(function () {
  'use strict';

  const COLORS = [
    { n: 'красное', c: '#e8283c', d: '#7a0c1a' },
    { n: 'зелёное', c: '#7ee022', d: '#2f6a06' },
    { n: 'синее', c: '#3aaee0', d: '#0f4f78' },
    { n: 'жёлтое', c: '#ffd93a', d: '#8a6c00' },
    { n: 'фиолетовое', c: '#b27bff', d: '#4a1c9a' },
    { n: 'оранжевое', c: '#ff8a1f', d: '#8a3c00' }
  ];
  /* значки на флаконах: чтобы цвета различались и без цвета */
  const SYM = [
    '<circle cx="20" cy="34" r="5.5"/>',
    '<path d="M20 28 L26 39 H14Z"/>',
    '<rect x="15" y="29" width="10" height="10" rx="1"/>',
    '<path d="M20 27.5 l2.2 4.8 5.2 .6 -3.9 3.5 1.1 5.2 -4.6 -2.7 -4.6 2.7 1.1 -5.2 -3.9 -3.5 5.2 -.6z"/>',
    '<path d="M20 27 L26 34 L20 41 L14 34Z"/>',
    '<path d="M18 28 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4z"/>'
  ];
  const FL = COLORS.map((k, i) => `<svg viewBox="0 0 40 48" class="po-fl" aria-hidden="true">
    <rect x="14" y="1" width="12" height="6" rx="2" fill="#a07a44" stroke="#2a1608" stroke-width="1.6"/>
    <path d="M15 6 H25 V19 Q37 23 37 35 Q37 46 26 46 H14 Q3 46 3 35 Q3 23 15 19 Z" fill="${k.c}" stroke="${k.d}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M6 33 Q6 44 14 44 H26 Q34 44 34 33 Z" fill="${k.d}" opacity=".28"/>
    <ellipse cx="11.5" cy="30" rx="3" ry="6" fill="#fff" opacity=".4" transform="rotate(14 11.5 30)"/>
    <g fill="#fff" opacity=".85">${SYM[i]}</g></svg>`);

  /* сравнение пробы с рецептом: [на месте, не на месте] */
  function score(secret, guess) {
    const K = secret.length;
    let b = 0;
    const cs = new Array(6).fill(0), cg = new Array(6).fill(0);
    for (let i = 0; i < K; i++) {
      if (secret[i] === guess[i]) b++;
      else { cs[secret[i]]++; cg[guess[i]]++; }
    }
    let w = 0;
    for (let c = 0; c < 6; c++) w += Math.min(cs[c], cg[c]);
    return [b, w];
  }

  G.mg.register({
    id: 'potion',
    title: 'Зельеварня',
    icon: '🧪',
    intro: 'Зельевар загадал рецепт из цветных флаконов. Подбирай пробы и по подсказкам угадай, какой флакон где стоит.',
    quest: 'Разгадай рецепты зельевара: подбирай флаконы по подсказкам 🧪',
    doneTitle: 'Рецепты разгаданы!',
    doneIcon: '🧪',
    doneText: 'Зельевар поклонился: такого сообразительного гостя у него ещё не было. Следующая остановка: <b class="hl">Тыквенная грядка</b>.',
    levels: [
      { label: '3 флакона', task: 'Угадай рецепт: <b>3 флакона</b> из 4 цветов, цвета не повторяются.<br>● на своём месте, ○ цвет верный, место другое. Попыток: 7.', k: 3, c: 4, rep: false, tries: 7 },
      { label: '4 флакона', task: 'Рецепт из <b>4 флаконов</b>, цветов уже 5. Цвета не повторяются. Попыток: 8.', k: 4, c: 5, rep: false, tries: 8 },
      { label: 'повторы', task: 'Рецепт из <b>4 флаконов</b>, цветов 6, и они <b>могут повторяться</b>. Попыток: 9.', k: 4, c: 6, rep: true, tries: 9 },
      { label: '5 флаконов', task: 'Самый хитрый рецепт: <b>5 флаконов</b>, 6 цветов, повторы возможны. Попыток: 10.', k: 5, c: 6, rep: true, tries: 10 }
    ],

    start(ctx, L, cfg) {
      const K = cfg.k, C = cfg.c;
      const secret = [];
      if (cfg.rep) for (let i = 0; i < K; i++) secret.push(G.rand(C));
      else G.shuffle(Array.from({ length: C }, (_, i) => i)).slice(0, K).forEach(v => secret.push(v));
      const rows = [];
      let cur = new Array(K).fill(-1), sel = 0;

      const wrap = G.el('div', 'po-wrap');
      wrap.innerHTML = `
        <i class="po-bub b1"></i><i class="po-bub b2"></i><i class="po-bub b3"></i>
        <div class="po-legend"><i class="peg b"></i> на месте &nbsp;&nbsp; <i class="peg w"></i> цвет есть, место другое</div>
        <div class="po-rows"></div>
        <div class="po-pal"></div>
        <div class="po-act"><button class="btn btn-small btn-ghost" type="button" data-r="clear">Очистить</button>
          <button class="btn btn-green" type="button" data-r="check" disabled>Проверить</button></div>`;
      ctx.box.appendChild(wrap);
      const rowsEl = G.$('.po-rows', wrap), palEl = G.$('.po-pal', wrap);
      const btnCheck = G.$('[data-r="check"]', wrap), btnClear = G.$('[data-r="clear"]', wrap);
      for (let i = 0; i < C; i++) palEl.insertAdjacentHTML('beforeend', `<button class="po-pb" type="button" data-i="${i}" aria-label="${COLORS[i].n}">${FL[i]}</button>`);

      ctx.onResize(w => {
        const slot = Math.max(26, Math.min(44, Math.floor((w - 28 - 80 - (K - 1) * 6) / K)));
        const pal = Math.max(36, Math.min(52, Math.floor((w - 24 - (C - 1) * 8) / C)));
        wrap.style.setProperty('--s', slot + 'px');
        wrap.style.setProperty('--p', pal + 'px');
      });

      const pegs = (b, w) => {
        let h = '';
        for (let i = 0; i < K; i++) h += `<i class="peg ${i < b ? 'b' : i < b + w ? 'w' : ''}"></i>`;
        return h;
      };
      const newRow = () => {
        const r = G.el('div', 'po-row cur');
        r.innerHTML = '<div class="po-slots">' + '<i class="po-slot"></i>'.repeat(K) + '</div><div class="po-pegs" style="--pc:' + Math.ceil(K / 2) + '">' + pegs(0, 0) + '</div>';
        rowsEl.appendChild(r);
        rowsEl.scrollTop = rowsEl.scrollHeight;
        return r;
      };
      let curRow = newRow();
      const slotEls = () => G.$$('.po-slot', curRow);
      function renderCur() {
        slotEls().forEach((el, i) => {
          el.innerHTML = cur[i] >= 0 ? FL[cur[i]] : '';
          el.classList.toggle('empty', cur[i] < 0);
          el.classList.toggle('sel', i === sel);
        });
        btnCheck.disabled = cur.some(v => v < 0);
      }
      renderCur();
      ctx.chip('try', '🧪', cfg.tries);

      function place(i) {
        if (ctx.over || ctx.paused) return;
        let at = sel;
        if (cur[at] >= 0 && cur.some(v => v < 0)) at = cur.findIndex(v => v < 0);
        cur[at] = i;
        const nx = cur.findIndex((v, j) => v < 0 && j > at);
        sel = nx >= 0 ? nx : cur.findIndex(v => v < 0);
        if (sel < 0) sel = at;
        G.sfx('pick');
        renderCur();
      }
      function submit() {
        if (ctx.over || cur.some(v => v < 0)) return;
        const [b, w] = score(secret, cur);
        rows.push({ g: cur.slice(), b, w });
        curRow.classList.remove('cur');
        curRow.classList.add('done');
        G.$$('.po-slot', curRow).forEach(el => el.classList.remove('sel', 'empty'));
        G.$('.po-pegs', curRow).innerHTML = pegs(b, w);
        G.$$('.po-pegs .peg', curRow).forEach((p, i) => { p.style.animationDelay = (i * 70) + 'ms'; });
        ctx.chip('try', '🧪', cfg.tries - rows.length, true);
        if (b === K) {
          G.sfx('found');
          ctx.burst(ctx.size().w / 2, ctx.size().h * 0.4, ['✨', '🧪', '⭐'], 14, 130);
          const frac = rows.length / cfg.tries;
          ctx.win({ stars: frac <= 0.4 ? 3 : frac <= 0.7 ? 2 : 1, score: rows.length, text: `Попыток: <b class="hl">${rows.length}</b> из ${cfg.tries}` });
          return;
        }
        G.sfx(b + w > 0 ? 'good' : 'swap');
        if (rows.length >= cfg.tries) {
          const dots = secret.map(i => `<i class="po-dot" style="background:${COLORS[i].c}"></i>`).join('');
          ctx.lose({ title: 'Зелье не удалось!', icon: '🧪', text: `Попытки кончились. Рецепт был такой:<br><span class="po-reveal">${dots}</span>` });
          return;
        }
        cur = new Array(K).fill(-1); sel = 0;
        curRow = newRow();
        renderCur();
      }
      ctx.listen(wrap, 'pointerdown', e => {
        const pb = e.target.closest && e.target.closest('.po-pb');
        if (pb) { e.preventDefault(); place(+pb.dataset.i); return; }
        const sl = e.target.closest && e.target.closest('.po-slot');
        if (sl && curRow.contains(sl) && !ctx.over && !ctx.paused) {
          const i = slotEls().indexOf(sl);
          if (i >= 0) { cur[i] = -1; sel = i; G.sfx('click'); renderCur(); }
        }
      });
      ctx.listen(btnCheck, 'click', submit);
      ctx.listen(btnClear, 'click', () => { if (ctx.over || ctx.paused) return; cur = new Array(K).fill(-1); sel = 0; G.sfx('click'); renderCur(); });

      ctx.debug = {
        secret: () => secret.slice(),
        rows: () => rows.map(r => ({ g: r.g.slice(), b: r.b, w: r.w })),
        guess: arr => { cur = arr.slice(); renderCur(); submit(); },
        score
      };
    }
  });
})();
