/* =========================================================
   Дом сладостей: ловим конфеты ведёрком-тыквой.
   С крыши пряничного дома сыплются сладости. Водим пальцем влево-вправо: ведёрко плавно едет следом
   (на ПК: мышь или стрелки). 🍬 🍭 🍫 дают очко, редкая 🎃 — три. 🕷️ и 🧪 нельзя ловить: каждый стоит жизни.
   Хорошие конфеты, которые упали мимо, ничего не стоят. Цель — набрать очки до конца времени.
   Всё на DOM: предметы двигаются только через transform, элементы берутся из готового пула.
   ========================================================= */
(function () {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const GOOD = ['🍬', '🍭', '🍫'];
  const BAD = ['🕷️', '🧪'];
  const POOL = 18;
  const BW = 84, BH = 74;                   // размер ведёрка (CSS px)
  const OPEN = 70;                          // ширина «горловины»: в неё попадают конфеты
  const GAIN = 1.3;                         // во сколько раз ведёрко едет быстрее пальца

  /* ведёрко-тыква (SVG): задняя часть, лицо, передний обод */
  const BUCKET = `<svg viewBox="0 0 84 74" width="${BW}" height="${BH}" aria-hidden="true">
    <defs>
      <radialGradient id="cyg" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#ffb347"/><stop offset=".6" stop-color="#f07b12"/><stop offset="1" stop-color="#b94a05"/></radialGradient>
      <linearGradient id="cyi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1004"/><stop offset="1" stop-color="#5a2808"/></linearGradient>
    </defs>
    <path d="M9 24 Q42 -10 75 24" fill="none" stroke="#2c1f12" stroke-width="5" stroke-linecap="round"/>
    <path d="M9 24 Q42 -10 75 24" fill="none" stroke="#8a6a44" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="42" cy="22" rx="35" ry="9" fill="url(#cyi)" stroke="#3a1a04" stroke-width="2"/>
    <path d="M6 24 C-2 42 10 68 42 70 C74 68 86 42 78 24 C62 32 22 32 6 24Z" fill="url(#cyg)" stroke="#5a2704" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M27 31 C20 44 24 60 32 68 M57 31 C64 44 60 60 52 68 M42 33 V70" fill="none" stroke="#a63f03" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
    <path d="M24 44 l6 -8 l6 8z M48 44 l6 -8 l6 8z" fill="#ffe27a" stroke="#6a3205" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M25 54 q17 13 34 0 l-5 2 l-3 4 l-5 -3 l-4 4 l-4 -4 l-5 3 l-3 -4z" fill="#ffe27a" stroke="#6a3205" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M6 24 Q42 38 78 24" fill="none" stroke="#ffa94a" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M12 26 Q42 36 72 26" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;

  /* пряничный домик на заднем плане: просто декорация */
  const HOUSE = `<svg class="cy-house" viewBox="0 0 345 190" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <g opacity=".62">
      <path d="M32 190 V128 Q46 108 60 128 V190Z" fill="#3a1d4a"/>
      <rect x="86" y="96" width="172" height="94" rx="4" fill="#6b3a2c"/>
      <path d="M72 100 L172 38 L272 100Z" fill="#4a2a66" stroke="#2a1440" stroke-width="3" stroke-linejoin="round"/>
      <path d="M72 100 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 4 0z" fill="#fff4f8"/>
      <rect x="156" y="130" width="34" height="60" rx="17" fill="#3a1f12"/>
      <circle cx="182" cy="162" r="2.4" fill="#ffd45a"/>
      <rect x="104" y="124" width="30" height="28" rx="4" fill="#ffd96a"/><path d="M119 124 V152 M104 138 H134" stroke="#6b3a2c" stroke-width="2.4"/>
      <rect x="214" y="124" width="30" height="28" rx="4" fill="#ffd96a"/><path d="M229 124 V152 M214 138 H244" stroke="#6b3a2c" stroke-width="2.4"/>
      <rect x="226" y="52" width="16" height="30" fill="#7a4a3a"/><rect x="222" y="48" width="24" height="8" rx="2" fill="#fff4f8"/>
      <circle cx="104" cy="106" r="4.5" fill="#ff5a8a"/><circle cx="132" cy="108" r="4.5" fill="#5ad0ff"/><circle cx="160" cy="106" r="4.5" fill="#ffd45a"/><circle cx="188" cy="108" r="4.5" fill="#6aff9a"/><circle cx="216" cy="106" r="4.5" fill="#ff5a8a"/><circle cx="244" cy="108" r="4.5" fill="#5ad0ff"/>
      <g stroke-linecap="round" fill="none"><path d="M292 190 V150 q0 -18 -16 -18" stroke="#fff" stroke-width="8"/><path d="M292 190 V150 q0 -18 -16 -18" stroke="#e8325a" stroke-width="8" stroke-dasharray="7 8"/></g>
      <g stroke-linecap="round" fill="none"><path d="M316 190 V160 q0 -14 -12 -14" stroke="#fff" stroke-width="7"/><path d="M316 190 V160 q0 -14 -12 -14" stroke="#e8325a" stroke-width="7" stroke-dasharray="6 7"/></g>
      <rect x="0" y="178" width="345" height="12" fill="#2a0f3a"/>
    </g>
  </svg>`;

  G.mg.register({
    id: 'candy',
    title: 'Дом сладостей',
    icon: '🍬',
    intro: 'Со сладкой крыши сыплются конфеты! Води пальцем: ведёрко-тыква поедет следом. Лови сладости, а пауков и зелья обходи.',
    quest: 'Лови конфеты тыквенным ведёрком, а пауков и зелья обходи 🍬',
    doneTitle: 'Ведёрко полно!',
    doneIcon: '🎃',
    doneText: 'Сладостей хватит на всю Хэллоуинскую ночь. Следующая остановка: <b class="hl">Совиная библиотека</b>.',
    levels: [
      { label: '15 очков', goal: 15, time: 40, bad: 0.12, sway: 0, task: 'Води пальцем влево-вправо: ведёрко едет следом. Набери <b>15 очков</b> за 40 секунд. 🍬🍭🍫 дают очко, 🎃 сразу три. Пауков 🕷️ и зелья 🧪 не лови: каждый стоит жизни.' },
      { label: '22 очка', goal: 22, time: 45, bad: 0.18, sway: 0, task: 'Набери <b>22 очка</b> за 45 секунд. Ловушек стало больше, а сладости падают быстрее.' },
      { label: '30 очков', goal: 30, time: 50, bad: 0.24, sway: 1, task: 'Нужно <b>30 очков</b> за 50 секунд. Некоторые конфеты покачиваются из стороны в сторону, будь внимателен!' },
      { label: '40 очков', goal: 40, time: 55, bad: 0.28, sway: 1, task: 'Главный сладкий дождь: <b>40 очков</b> за 55 секунд. Пауков много, жизней всего три.' }
    ],

    start(ctx, L, cfg) {
      const box = ctx.box;
      const fld = G.el('div', 'cy-field');
      fld.innerHTML = HOUSE;
      box.appendChild(fld);
      const hurt = G.el('div', 'cy-hurt');
      fld.appendChild(hurt);

      /* пул предметов */
      const pool = [];
      for (let i = 0; i < POOL; i++) {
        const el = G.el('div', 'cy-it');
        const sp = G.el('span', 'cy-sp');
        el.appendChild(sp);
        fld.appendChild(el);
        pool.push({ el, sp, on: false, ch: '', bad: false });
      }
      const bucket = G.el('div', 'cy-basket');
      bucket.innerHTML = BUCKET;
      fld.appendChild(bucket);

      let W = 345, H = 500, by = 400;
      const act = [];                    // летящие предметы
      let bx = 172, target = 172;
      let score = 0, lives = 3, finished = false, warp = 1, elapsed = 0, spawnT = 0.5, caught = 0, missed = 0;
      let kl = false, kr = false;
      const minX = () => BW / 2 + 2, maxX = () => W - BW / 2 - 2;
      const setTarget = x => { target = clamp(x, minX(), maxX()); };

      ctx.onResize((w, h) => {
        const kx = w / W, ky = h / H;
        W = w; H = h;
        by = H - BH - 10;
        act.forEach(it => { it.x *= kx; it.bx *= kx; it.y *= ky; it.py *= ky; });
        bx = clamp(bx * kx, minX(), maxX()); target = clamp(target * kx, minX(), maxX());
      });
      bx = target = W / 2;

      /* ---- счётчики ---- */
      ctx.chip('hp', '❤️', lives);
      const T = ctx.countdown(cfg.time, () => {
        if (finished) return;
        finished = true;
        ctx.lose({ title: 'Время вышло!', icon: '⏱', text: 'Не хватило очков: <b>' + score + '</b> из ' + cfg.goal + '. Попробуй ещё раз!' });
      }, { label: '⏱', warn: 8 });
      const upd = () => ctx.goal(Math.min(score, cfg.goal), cfg.goal, 'Очки: ' + score + ' / ' + cfg.goal);
      upd();
      ctx.say('Води пальцем влево-вправо', 2400);

      /* ---- ввод: касание ведёт ведёрко за собой, мышь ведёт его сразу ---- */
      let drag = null;
      ctx.listen(box, 'pointerdown', e => {
        if (ctx.over || ctx.paused || finished) return;
        e.preventDefault();
        if (e.pointerType === 'mouse') { setTarget(ctx.rel(e).x); return; }
        drag = { id: e.pointerId, sx: e.clientX, b0: target };
        try { box.setPointerCapture(e.pointerId); } catch (_) { /* не страшно */ }
      });
      ctx.listen(box, 'pointermove', e => {
        if (ctx.over || ctx.paused || finished) return;
        if (e.pointerType === 'mouse') { setTarget(ctx.rel(e).x); return; }
        if (!drag || e.pointerId !== drag.id) return;
        setTarget(drag.b0 + (e.clientX - drag.sx) * GAIN);
      });
      const up = e => { if (drag && (!e || e.pointerId === drag.id)) drag = null; };
      ctx.listen(box, 'pointerup', up);
      ctx.listen(box, 'pointercancel', up);
      ctx.listen(box, 'lostpointercapture', up);
      ctx.listen(window, 'keydown', e => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { kl = true; e.preventDefault(); }
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') { kr = true; e.preventDefault(); }
      });
      ctx.listen(window, 'keyup', e => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') kl = false;
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') kr = false;
      });

      /* ---- предметы ---- */
      const progress = () => clamp(elapsed / cfg.time, 0, 1);
      const rate = () => (1.15 + 0.15 * L) + (0.95 + 0.25 * L) * progress();          // предметов в секунду
      const speed = () => H * (0.34 + 0.12 * (L - 1) / 3 + 0.3 * progress());         // px/с
      function spawn() {
        const o = pool.find(p => !p.on);
        if (!o) return;
        const bad = Math.random() < cfg.bad;
        let ch, kind;
        if (bad) { ch = BAD[G.rand(BAD.length)]; kind = 'bad'; }
        else if (Math.random() < 0.07) { ch = '🎃'; kind = 'gold'; }
        else { ch = GOOD[G.rand(GOOD.length)]; kind = 'good'; }
        const x = rnd(26, W - 26);
        const sway = !bad && cfg.sway && Math.random() < 0.45 ? rnd(18, 34) : 0;
        if (o.ch !== ch) { o.sp.textContent = ch; o.ch = ch; }
        if (o.bad !== bad) { o.el.classList.toggle('bad', bad); o.bad = bad; }
        o.el.classList.toggle('gold', kind === 'gold');
        o.on = true;
        const v = speed() * rnd(0.92, 1.1);
        const it = { o, ch, kind, bad, bx: x, x, y: -24, py: -24, v, sway, ph: rnd(0, 6.28), age: 0 };
        act.push(it);
        place(it);
      }
      function place(it) { it.o.el.style.transform = 'translate3d(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px,0)'; }
      function free(i) {
        const it = act[i];
        it.o.on = false;
        it.o.el.style.transform = 'translate3d(-200px,-200px,0)';
        act.splice(i, 1);
      }
      function bump() {
        bucket.classList.remove('bump'); void bucket.offsetWidth; bucket.classList.add('bump');
      }
      function onCatch(it) {
        const px = it.x, py = by + 8;
        if (it.bad) {
          lives--;
          ctx.chip('hp', '❤️', lives, true);
          G.sfx('scare');
          ctx.shake();
          hurt.classList.remove('on'); void hurt.offsetWidth; hurt.classList.add('on');
          ctx.float(px, py - 10, '−❤️', 'red');
          ctx.burst(px, py, ['💥'], 3, 70);
          if (lives <= 0 && !finished) {
            finished = true;
            ctx.lose({ title: it.ch === '🧪' ? 'Зелье взорвалось!' : 'Паук укусил!', icon: it.ch, text: 'Жизни кончились. Лови только сладкое! Набрано очков: <b>' + score + '</b> из ' + cfg.goal + '.' });
          }
          return;
        }
        addScore(it.kind === 'gold' ? 3 : 1, px, py, true);
      }
      /* очки: общий путь для пойманной конфеты (и для тестов) */
      function addScore(pts, px, py, fx) {
        score += pts; caught++;
        if (fx) {
          G.sfx(pts > 1 ? 'ding' : 'pop');
          bump();
          ctx.float(px, py - 14, '+' + pts, 'green');
          if (pts > 1) ctx.burst(px, py - 10, ['✨', '🎃'], 5, 80);
        }
        upd();
        if (score >= cfg.goal && !finished) {
          finished = true;
          G.sfx('found');
          ctx.burst(bx, by, ['🍬', '🍭', '⭐'], 12, 150);
          const left = Math.round(T.left);
          ctx.after(600, () => ctx.win({ stars: clamp(lives, 1, 3), score: left, text: 'Жизней: <b class="hl">' + '❤️'.repeat(lives) + '</b>, осталось времени: <b class="hl">' + left + ' с</b>' }));
        }
      }

      ctx.loop(real => {
        const dt = real * warp;
        if (warp !== 1) T.left -= real * (warp - 1);
        /* ведёрко: плавно догоняет цель */
        if (kl) setTarget(target - 640 * dt);
        if (kr) setTarget(target + 640 * dt);
        bx += (target - bx) * (1 - Math.exp(-dt * 16));
        bucket.style.transform = 'translate3d(' + (bx - BW / 2).toFixed(1) + 'px,' + by.toFixed(1) + 'px,0)';
        if (finished) {
          /* после конца уровня предметы просто допадают */
          for (let i = act.length - 1; i >= 0; i--) { const it = act[i]; it.y += it.v * dt; place(it); if (it.y > H + 30) free(i); }
          return;
        }
        elapsed += dt;
        spawnT -= dt;
        let guard = 0;
        while (spawnT <= 0 && guard++ < 4) { spawn(); spawnT += (1 / rate()) * rnd(0.55, 1.45); }
        const line = by + 12;                       // горловина ведёрка
        for (let i = act.length - 1; i >= 0; i--) {
          const it = act[i];
          it.age += dt;
          it.py = it.y;
          it.y += it.v * dt;
          it.x = it.sway ? clamp(it.bx + Math.sin(it.ph + it.age * 3.2) * it.sway, 18, W - 18) : it.bx;
          if (it.py + 16 < line && it.y + 16 >= line && Math.abs(it.x - bx) <= OPEN / 2 + 6) {
            onCatch(it);
            free(i);
            if (finished && lives <= 0) return;
            continue;
          }
          if (it.y > H + 30) { if (!it.bad) missed++; free(i); continue; }
          place(it);
        }
      });

      ctx.debug = {
        items: () => act.map(it => ({ x: it.x, y: it.y, v: it.v, ch: it.ch, kind: it.kind, bad: it.bad, sway: it.sway })),
        basket: () => ({ x: bx, target, w: BW, open: OPEN, y: by, line: by + 12, minX: minX(), maxX: maxX() }),
        st: () => ({ score, lives, goal: cfg.goal, left: T.left, finished, W, H, caught, missed, elapsed, rate: rate(), speed: speed(), n: act.length }),
        warp: k => { if (k !== undefined) warp = k; return warp; },
        setTarget,
        gain: GAIN,
        give: n => addScore(n, bx, by, false),
        lives: n => { if (n !== undefined) { lives = n; ctx.chip('hp', '❤️', lives); } return lives; },
        time: sec => { if (sec !== undefined) T.left = sec; return T.left; }
      };
    }
  });
})();
