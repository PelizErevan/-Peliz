/* =========================================================
   Пещера летучих мышей: «флэппи». Тап = взмах крыльев, нужно
   пролетать между сталактитами и сталагмитами. Три жизни.
   Весь мир считается в «юнитах» u = высота поля / 10, поэтому
   игра одинаково играется на любом экране и при смене размера.
   ========================================================= */
(function () {
  'use strict';

  const GRAV = 27;        // ускорение вниз, u/с²
  const FLAP = 8.9;       // скорость вверх после взмаха, u/с
  const VMAX = 12;        // предел скорости падения
  const R = 0.4;          // радиус мыши
  const GW = 1.5;         // ширина колонны

  G.mg.register({
    id: 'bats',
    title: 'Пещера летучих мышей',
    icon: '🦇',
    intro: 'Тапай, чтобы взмахнуть крыльями, и лети между сталактитами и сталагмитами. Разбиться можно трижды.',
    quest: 'Пролети через ворота пещеры, не разбившись о камни 🦇',
    doneTitle: 'Пещера пройдена!',
    doneIcon: '🦇',
    doneText: 'Летучие мыши признали в тебе вожака стаи. Дальше ждёт <b class="hl">Зельеварня</b>: ведьма что-то задумала.',
    levels: [
      { label: '8 ворот', task: 'Тапай по экрану, чтобы взмахнуть крыльями. Пролети <b>8 ворот</b> между камнями.',
        goal: 8, gap: 4.0, speed: 3.3, every: 1.95, swing: 0 },
      { label: '12 ворот', task: 'Проёмы уже, мышь быстрее. Пролети <b>12 ворот</b>.',
        goal: 12, gap: 3.6, speed: 3.8, every: 1.8, swing: 0 },
      { label: '16 ворот', task: 'Часть камней <b>качается</b>: следи за проёмом! Пролети <b>16 ворот</b>.',
        goal: 16, gap: 3.4, speed: 4.2, every: 1.7, swing: 0.55 },
      { label: '20 ворот', task: 'Самая тёмная часть пещеры: узко, быстро, всё качается. Пролети <b>20 ворот</b>!',
        goal: 20, gap: 3.2, speed: 4.6, every: 1.6, swing: 0.7 }
    ],

    start(ctx, L, cfg) {
      const view = ctx.canvas(1.25);
      let W = 0, H = 0, u = 1, Wu = 10;
      const S = { y: 5, vy: 0, started: false, passed: 0, lives: 3, inv: 0, log: [] };
      const gates = [];
      let nextX = 0, lastCy = 5, scroll = 0, flapAnim = 0;
      const BX = () => Wu * 0.28;                    // x мыши в юнитах

      ctx.onResize((w, h) => { W = w; H = h; u = h / 10; Wu = w / u; });
      ctx.chip('hp', '❤️', S.lives);
      ctx.goal(0, cfg.goal);
      ctx.say('Тапай, чтобы взмахнуть!', 5000);

      /* ---- фон: градиент рисует CSS, а два слоя силуэтов (сверху и снизу) рисуются в спрайты один раз на размер.
         Спрайты — только полосы у потолка и пола: так за кадр заливается в разы меньше пикселей ---- */
      const BAND = 0.26;
      const layerSprite = (key, col, seed, hMax, count, top) => {
        const bh0 = Math.round(H * BAND);
        return G.mg.sprite(key + (top ? 't' : 'b'), Math.round(W), bh0, (c, w, h) => {
          let s = seed + (top ? 0 : 99);
          const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
          c.fillStyle = col;
          const seg = w / count;
          for (let i = 0; i < count; i++) {
            const x = i * seg + seg * (0.2 + rnd() * 0.6), bw = seg * (0.35 + rnd() * 0.3), bh = H * (0.05 + rnd() * hMax);
            c.beginPath();
            if (top) { c.moveTo(x - bw / 2, 0); c.lineTo(x + bw / 2, 0); c.lineTo(x + rnd() * 6 - 3, Math.min(h, bh)); }
            else { c.moveTo(x - bw / 2, h); c.lineTo(x + bw / 2, h); c.lineTo(x + rnd() * 6 - 3, h - Math.min(h, bh)); }
            c.closePath(); c.fill();
          }
        });
      };

      /* ---- ворота ---- */
      function spawnGate(x) {
        const g = cfg.gap, A = cfg.swing;
        const lo = g / 2 + 1.0 + A, hi = 10 - g / 2 - 1.0 - A;
        let cy = lo + Math.random() * (hi - lo);
        cy = G.clamp(cy, lastCy - 3.2, lastCy + 3.2);
        cy = G.clamp(cy, lo, hi);
        lastCy = cy;
        const sw = cfg.swing && Math.random() < (L === 3 ? 0.55 : 0.8);
        gates.push({ x, base: cy, cy, amp: sw ? A : 0, ph: Math.random() * 6.28, passed: false });
      }

      function hit() {
        if (S.inv > 0 || ctx.over) return;
        S.log.push({ t: +ctx.time.toFixed(2), y: +S.y.toFixed(2), vy: +S.vy.toFixed(1), g: gates.slice(0, 3).map(q => [+q.x.toFixed(2), +q.cy.toFixed(2)]) });
        S.lives--;
        ctx.chip('hp', '❤️', Math.max(0, S.lives), true);
        G.sfx('thud');
        ctx.shake();
        if (S.lives <= 0) {
          ctx.lose({ title: 'Крылья сломаны!', icon: '🦇', text: `Пролетено ворот: ${S.passed} из ${cfg.goal}. Попробуй ещё!` });
          return;
        }
        S.inv = 1.5;
        const g = gates.find(q => q.x + GW / 2 > BX() - R - 0.1);
        S.y = g ? g.cy : 5; S.vy = 0;
        ctx.say('Ой! Осталось жизней: ' + S.lives, 1600);
      }

      function flap() {
        if (ctx.over || ctx.paused) return;
        if (!S.started) { S.started = true; nextX = Wu + 2; }
        S.vy = -FLAP;
        flapAnim = 0.18;
        G.sfx('flap');
      }

      ctx.loop((dt, t) => {
        if (S.started) {
          S.vy = Math.min(VMAX, S.vy + GRAV * dt);
          S.y += S.vy * dt;
          scroll += cfg.speed * dt;
          while (nextX < Wu + 2) { spawnGate(nextX); nextX += cfg.speed * cfg.every; }
          nextX -= cfg.speed * dt;
          for (let i = gates.length - 1; i >= 0; i--) {
            const g = gates[i];
            g.x -= cfg.speed * dt;
            if (g.amp) g.cy = g.base + Math.sin(t * 1.7 + g.ph) * g.amp;
            if (g.x < -2.5) gates.splice(i, 1);
          }
          if (S.y < R + 0.2) { S.y = R + 0.2; if (S.vy < 0) S.vy = 0; }
          if (S.y + R > 9.65) { hit(); if (!ctx.over) { S.y = Math.min(S.y, 9.65 - R); } }
          if (S.inv > 0) S.inv -= dt;
          const bx = BX();
          for (const g of gates) {
            const half = cfg.gap / 2;
            if (!ctx.over && Math.abs(g.x - bx) < GW * 0.4 + R * 0.8 && (S.y - R < g.cy - half + 0.05 || S.y + R > g.cy + half - 0.05)) hit();
            if (!g.passed && g.x + GW / 2 < bx - R) {
              g.passed = true; S.passed++;
              ctx.goal(S.passed, cfg.goal);
              G.sfx('ding');
              ctx.float(bx * u + 40, S.y * u - 30, '+1', 'green');
              if (S.passed >= cfg.goal && !ctx.over) {
                ctx.win({ stars: S.lives >= 3 ? 3 : S.lives === 2 ? 2 : 1, score: S.passed, text: `Жизней осталось: <b class="hl">${S.lives}</b> из 3` });
              }
            }
          }
        } else {
          S.y = 5 + Math.sin(t * 3) * 0.3;
        }
        if (flapAnim > 0) flapAnim -= dt;
        draw();
      });

      /* ---- рисование ---- */
      function drawGate(c, g) {
        const x = g.x * u, w = GW * u, half = cfg.gap / 2 * u;
        const top = g.cy * u - half, bot = g.cy * u + half;
        c.fillStyle = '#4a4468'; c.strokeStyle = '#08030f'; c.lineWidth = 2.5; c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(x - w / 2, -4); c.lineTo(x + w / 2, -4); c.lineTo(x + w * 0.34, top - 0.7 * u);
        c.quadraticCurveTo(x + w * 0.1, top - 0.1 * u, x, top); c.quadraticCurveTo(x - w * 0.1, top - 0.1 * u, x - w * 0.34, top - 0.7 * u);
        c.closePath(); c.fill(); c.stroke();
        c.beginPath();
        c.moveTo(x - w / 2, H + 4); c.lineTo(x + w / 2, H + 4); c.lineTo(x + w * 0.34, bot + 0.7 * u);
        c.quadraticCurveTo(x + w * 0.1, bot + 0.1 * u, x, bot); c.quadraticCurveTo(x - w * 0.1, bot + 0.1 * u, x - w * 0.34, bot + 0.7 * u);
        c.closePath(); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.10)';
        c.fillRect(x - w / 2 + w * 0.12, 0, w * 0.16, Math.max(0, top - 0.9 * u));
        c.fillRect(x - w / 2 + w * 0.12, bot + 0.9 * u, w * 0.16, Math.max(0, H - bot - 0.9 * u));
        c.fillStyle = '#ffd45a'; c.globalAlpha = 0.5;              // светящиеся «глаза» в камне
        c.fillRect(x - 2, top - 1.3 * u, 3, 3); c.fillRect(x - 2, bot + 1.1 * u, 3, 3);
        c.globalAlpha = 1;
      }
      function draw() {
        if (!W) return;
        const c = view.begin();
        const bh = Math.round(H * BAND), Wr = Math.round(W);
        const o1 = (scroll * 0.35 * u) % Wr, o2 = (scroll * 0.7 * u) % Wr;
        const t1 = layerSprite('bt-l1', 'rgba(8,4,20,.55)', 7, 0.2, 7, true), b1 = layerSprite('bt-l1', 'rgba(8,4,20,.55)', 7, 0.2, 7, false);
        const t2 = layerSprite('bt-l2', 'rgba(8,4,20,.85)', 31, 0.14, 5, true), b2 = layerSprite('bt-l2', 'rgba(8,4,20,.85)', 31, 0.14, 5, false);
        c.drawImage(t1, -o1, 0, Wr, bh); c.drawImage(t1, Wr - o1, 0, Wr, bh); c.drawImage(b1, -o1, H - bh, Wr, bh); c.drawImage(b1, Wr - o1, H - bh, Wr, bh);
        c.drawImage(t2, -o2, 0, Wr, bh); c.drawImage(t2, Wr - o2, 0, Wr, bh); c.drawImage(b2, -o2, H - bh, Wr, bh); c.drawImage(b2, Wr - o2, H - bh, Wr, bh);
        for (const g of gates) if (g.x * u > -3 * u && g.x * u < W + 3 * u) drawGate(c, g);
        // мышь
        if (S.inv <= 0 || (Math.floor(S.inv * 12) % 2 === 0)) {
          const sz = Math.round(u * 1.25);
          const sp = G.mg.emoji('🦇', sz);
          const tilt = G.clamp(S.vy / VMAX, -0.8, 1) * 0.55;
          const sc = flapAnim > 0 ? 1.12 : 1;
          c.save();
          c.translate(BX() * u, S.y * u);
          c.rotate(tilt);
          c.scale(sc, sc * (flapAnim > 0 ? 0.88 : 1));
          c.drawImage(sp, -sz / 2, -sz / 2, sz, sz);
          c.restore();
        }
      }

      ctx.listen(view.cv, 'pointerdown', e => { e.preventDefault(); flap(); });
      ctx.listen(window, 'keydown', e => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } });

      ctx.debug = {
        flap, log: S.log,
        st: () => ({
          y: S.y, vy: S.vy, started: S.started, passed: S.passed, lives: S.lives, inv: S.inv, bx: BX(), goal: cfg.goal, gap: cfg.gap,
          gates: gates.filter(g => g.x + GW / 2 > BX() - R).slice(0, 2).map(g => ({ x: g.x, cy: g.cy }))
        })
      };
    }
  });
})();
