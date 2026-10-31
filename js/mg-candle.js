/* =========================================================
   Часовня свечей: головоломка «Лампочки» (Lights Out) со свечами.
   Тап по свече переключает её и четыре соседние (вверх, вниз, влево, вправо). Нужно зажечь все свечи.
   Поле всегда решаемо: оно получено из «всё горит» случайными нажатиями. Минимум нажатий («пар»)
   считается методом Гаусса над GF(2), он же даёт подсказку.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- решатель Lights Out над GF(2) ---------- */
  function solve(n, lit) {
    const N = n * n, rows = [];
    for (let i = 0; i < N; i++) {
      const r = new Uint8Array(N + 1);
      const x = i % n, y = (i / n) | 0;
      r[i] = 1;
      if (x > 0) r[i - 1] = 1;
      if (x < n - 1) r[i + 1] = 1;
      if (y > 0) r[i - n] = 1;
      if (y < n - 1) r[i + n] = 1;
      r[N] = lit[i] ? 0 : 1;
      rows.push(r);
    }
    const piv = [];
    let rr = 0;
    for (let c = 0; c < N && rr < N; c++) {
      let p = -1;
      for (let i = rr; i < N; i++) if (rows[i][c]) { p = i; break; }
      if (p < 0) continue;
      const t = rows[rr]; rows[rr] = rows[p]; rows[p] = t;
      for (let i = 0; i < N; i++) if (i !== rr && rows[i][c]) for (let k = c; k <= N; k++) rows[i][k] ^= rows[rr][k];
      piv.push(c); rr++;
    }
    for (let i = rr; i < N; i++) if (rows[i][N]) return null;
    const isPiv = new Uint8Array(N);
    piv.forEach(c => { isPiv[c] = 1; });
    const free = [];
    for (let c = 0; c < N; c++) if (!isPiv[c]) free.push(c);
    const base = new Uint8Array(N);
    piv.forEach((c, i) => { base[c] = rows[i][N]; });
    const basis = free.map(f => {
      const v = new Uint8Array(N);
      v[f] = 1;
      piv.forEach((c, i) => { if (rows[i][f]) v[c] = 1; });
      return v;
    });
    let best = null, bw = 1e9;
    for (let m = 0; m < (1 << basis.length); m++) {
      const v = base.slice();
      basis.forEach((b, j) => { if ((m >> j) & 1) for (let k = 0; k < N; k++) v[k] ^= b[k]; });
      let w = 0;
      for (let k = 0; k < N; k++) w += v[k];
      if (w < bw) { bw = w; best = v; }
    }
    const sol = [];
    for (let k = 0; k < N; k++) if (best[k]) sol.push(k);
    return { sol, par: bw };
  }
  function press(n, lit, i) {
    const x = i % n, y = (i / n) | 0;
    lit[i] ^= 1;
    if (x > 0) lit[i - 1] ^= 1;
    if (x < n - 1) lit[i + 1] ^= 1;
    if (y > 0) lit[i - n] ^= 1;
    if (y < n - 1) lit[i + n] ^= 1;
  }

  /* ---------- спрайты ---------- */
  const WAX = [['#fff6dc', '#d8c79a', '#8a7a4c'], ['#ff8a7a', '#d8473a', '#7a1a14'], ['#cdb4ff', '#8f6fe0', '#41208a']];
  const candle = (cs, k, on) => G.mg.sprite('cdl' + k + (on ? 'a' : 'b'), cs, cs, (c, w) => {
    const [hi, mid, dk] = WAX[k];
    const cx = w / 2, bw = w * 0.26, top = w * 0.4, bot = w * 0.8;
    /* блюдце */
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.beginPath(); c.ellipse(cx, bot + w * 0.045, w * 0.3, w * 0.075, 0, 0, 7); c.fill();
    const dish = c.createLinearGradient(0, bot - w * 0.02, 0, bot + w * 0.1);
    dish.addColorStop(0, '#d9b45a'); dish.addColorStop(1, '#6a4a14');
    c.fillStyle = dish; c.strokeStyle = '#3a280a'; c.lineWidth = Math.max(1, w * 0.02);
    c.beginPath(); c.ellipse(cx, bot + w * 0.02, w * 0.3, w * 0.08, 0, 0, 7); c.fill(); c.stroke();
    /* воск */
    const g = c.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
    if (on) { g.addColorStop(0, hi); g.addColorStop(0.55, mid); g.addColorStop(1, dk); }
    else { g.addColorStop(0, '#6e6a7a'); g.addColorStop(0.55, '#4a475a'); g.addColorStop(1, '#2a2838'); }
    c.fillStyle = g; c.strokeStyle = on ? dk : '#1a1826'; c.lineWidth = Math.max(1, w * 0.02);
    c.beginPath();
    c.moveTo(cx - bw / 2, bot); c.lineTo(cx - bw / 2, top + w * 0.03);
    c.quadraticCurveTo(cx - bw / 2, top - w * 0.03, cx, top - w * 0.03);
    c.quadraticCurveTo(cx + bw / 2, top - w * 0.03, cx + bw / 2, top + w * 0.03);
    c.lineTo(cx + bw / 2, bot); c.closePath(); c.fill(); c.stroke();
    /* подтёки и блик */
    c.fillStyle = on ? hi : '#7e7a8e';
    c.beginPath(); c.ellipse(cx - bw * 0.2, top + w * 0.1, w * 0.025, w * 0.07, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(cx + bw * 0.22, top + w * 0.07, w * 0.02, w * 0.045, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,' + (on ? '.35' : '.12') + ')';
    c.fillRect(cx - bw * 0.36, top + w * 0.16, w * 0.025, bot - top - w * 0.2);
    /* фитиль */
    c.strokeStyle = on ? '#2a1c0a' : '#14121c'; c.lineWidth = Math.max(1.2, w * 0.03);
    c.beginPath(); c.moveTo(cx, top - w * 0.02); c.lineTo(cx + w * 0.01, top - w * 0.1); c.stroke();
  });
  /* пламя: лист из 6 кадров мерцания (запечены наклон и высота), потом рисуем без поворотов:
     повороты и дробные масштабы на каждом кадре очень дорогие для слабых телефонов */
  const FRAMES = 6;
  const flame = cs => G.mg.sprite('cdf', cs * FRAMES, cs, (c, W, h) => {
    for (let k = 0; k < FRAMES; k++) {
      const a = (k / FRAMES) * Math.PI * 2;
      const sy = 1 + 0.12 * Math.sin(a) + 0.04 * Math.sin(a * 3), sx = 1 - 0.07 * Math.sin(a), lean = 0.09 * Math.sin(a * 2 + 1);
      c.save();
      c.translate(k * cs + cs / 2, cs * 0.36);
      c.rotate(lean); c.scale(sx, sy);
      const w = cs, by = 0;
      const g = c.createRadialGradient(0, by - w * 0.1, 1, 0, by - w * 0.08, w * 0.26);
      g.addColorStop(0, '#fffbe6'); g.addColorStop(0.35, '#ffd24a'); g.addColorStop(0.75, '#ff8a1a'); g.addColorStop(1, 'rgba(255,60,10,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, by - w * 0.3);
      c.quadraticCurveTo(w * 0.17, by - w * 0.1, w * 0.1, by);
      c.quadraticCurveTo(0, by + w * 0.07, -w * 0.1, by);
      c.quadraticCurveTo(-w * 0.17, by - w * 0.1, 0, by - w * 0.3);
      c.fill();
      c.fillStyle = 'rgba(80,120,255,.55)';
      c.beginPath(); c.ellipse(0, by - w * 0.02, w * 0.045, w * 0.06, 0, 0, 7); c.fill();
      c.restore();
    }
  });
  const glow = cs => G.mg.sprite('cdg', Math.round(cs * 1.7), Math.round(cs * 1.7), (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 1, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,190,90,.55)'); g.addColorStop(0.5, 'rgba(255,150,50,.2)'); g.addColorStop(1, 'rgba(255,120,30,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  });
  const board = (side, n, cs) => G.mg.sprite('cdb' + n, side, side, (c, w) => {
    const rr = (x, y, ww, hh, r) => {
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + ww, y, x + ww, y + hh, r); c.arcTo(x + ww, y + hh, x, y + hh, r);
      c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + ww, y, r); c.closePath();
    };
    const g = c.createLinearGradient(0, 0, 0, w);
    g.addColorStop(0, '#2b2540'); g.addColorStop(1, '#1b1730');
    c.fillStyle = g; rr(0.5, 0.5, w - 1, w - 1, w * 0.04); c.fill();
    c.lineWidth = 2; c.strokeStyle = '#6f5fa8'; c.stroke();
    let seed = n * 31 + 5;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let r = 0; r < n; r++) {
      for (let q = 0; q < n; q++) {
        const x = q * cs + 3, y = r * cs + 3, s = cs - 6;
        const sg = c.createLinearGradient(x, y, x, y + s);
        sg.addColorStop(0, '#463e66'); sg.addColorStop(1, '#2d2748');
        c.fillStyle = sg; rr(x, y, s, s, cs * 0.12); c.fill();
        c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,.1)'; rr(x + 0.5, y + 0.5, s - 1, s - 1, cs * 0.12); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1;
        if (rnd() > 0.45) {
          const sx = x + rnd() * s, sy = y + rnd() * s * 0.5;
          c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (rnd() - 0.5) * s * 0.4, sy + rnd() * s * 0.35); c.stroke();
        }
      }
    }
  });

  G.mg.register({
    id: 'candle',
    title: 'Часовня свечей',
    icon: '🕯',
    intro: 'В часовне погасли свечи. Тап по свече переключает её и четыре соседние. Зажги их все!',
    quest: 'Зажги все свечи в часовне: нажатие меняет и соседние свечи 🕯',
    doneTitle: 'Часовня сияет!',
    doneIcon: '🕯',
    doneText: 'Свечи горят ровным светом, а в часовне стало тепло и тихо. Следующая остановка: <b class="hl">Гробовщик</b>.',
    levels: [
      { label: '3×3', n: 3, k: 4, task: 'Тап по свече переключает её и соседние (вверх, вниз, влево, вправо). Зажги <b>все</b> свечи на поле 3×3.' },
      { label: '4×4', n: 4, k: 7, task: 'Поле побольше: <b>4×4</b>. Подумай, какое нажатие поменяет нужные свечи. Подсказка 💡 всегда рядом.' },
      { label: '5×5', n: 5, k: 11, task: 'Поле <b>5×5</b>. Совет: зажигай ряд за рядом сверху вниз.' },
      { label: '6×6', n: 6, k: 16, task: 'Главная часовня: <b>6×6</b> свечей. Нужно терпение!' }
    ],

    start(ctx, L, cfg) {
      const n = cfg.n, N = n * n;
      /* поле: всё горит + K случайных нажатий; пар = минимальное решение */
      let lit, info;
      for (let tries = 0; tries < 200; tries++) {
        lit = new Array(N).fill(1);
        const cellsAll = G.shuffle(Array.from({ length: N }, (_, i) => i)).slice(0, cfg.k);
        cellsAll.forEach(i => press(n, lit, i));
        const dark = lit.filter(v => !v).length;
        info = solve(n, lit);
        if (info && dark >= 2 && info.par >= Math.max(2, Math.round(cfg.k * 0.6))) break;
      }
      let par = info.par;
      const kind = lit.map((_, i) => (i * 5 + L) % 3);
      const fl = lit.map(v => v);            // «яркость» пламени 0..1 (плавно догоняет состояние)
      const pr = new Array(N).fill(0);       // кольцо от нажатия
      const smoke = [];
      let moves = 0, hintUsed = false, hintCell = -1, hintT = 0, won = false, litChanged = true;

      /* холст только под поле (а не во всю область): меньше пикселей, меньше работы на каждом кадре */
      const cv = document.createElement('canvas');
      cv.className = 'mg-cv';
      ctx.box.appendChild(cv);
      const view = { cv, c: cv.getContext('2d'), dpr: 1 };
      view.fit = () => {
        const d = Math.min(1.25, window.devicePixelRatio || 1);
        const pw = Math.max(1, Math.round(side * d));
        if (cv.width !== pw) { cv.width = pw; cv.height = pw; }
        cv.style.left = ox + 'px'; cv.style.top = oy + 'px';
        cv.style.width = side + 'px'; cv.style.height = side + 'px';
        view.dpr = pw / side;
      };
      view.begin = () => {
        const c = view.c;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, cv.width, cv.height);
        c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
        return c;
      };
      const bar = G.el('div', 'cd-bar');
      bar.innerHTML = '<button class="btn btn-small btn-ghost" type="button" data-r="hint">💡 Подсказка</button>';
      ctx.box.appendChild(bar);
      let ox = 0, oy = 0, cs = 60, side = 180;
      ctx.onResize((w, h) => {
        const area = h - 58;
        cs = Math.max(30, Math.min(96, Math.floor(Math.min(w - 16, area - 6) / n)));
        side = cs * n;
        ox = Math.round((w - side) / 2);
        oy = Math.max(2, Math.round((area - side) / 2) + 2);
        view.fit();
      });
      ctx.chip('mv', '👆', 0);
      ctx.chip('par', '🎯', par);
      const upd = () => {
        const on = lit.reduce((a, b) => a + b, 0);
        ctx.goal(on, N, 'Горит: ' + on + ' из ' + N);
        ctx.chip('mv', '👆', moves, true);
      };
      upd();

      function tap(i, real) {
        if (ctx.over || ctx.paused || won) return;
        const before = lit.slice();
        press(n, lit, i);
        litChanged = true;
        moves++;
        pr[i] = 1;
        if (hintCell === i) hintCell = -1;
        let off = 0, on = 0;
        for (let k = 0; k < N; k++) {
          if (before[k] && !lit[k]) { off++; const x = k % n, y = (k / n) | 0; for (let s = 0; s < 3; s++) smoke.push({ x: (x + 0.5) * cs + (s - 1) * cs * 0.05, y: (y + 0.3) * cs, t: -s * 0.12 }); }
          if (!before[k] && lit[k]) on++;
        }
        G.sfx(on >= off ? 'good' : 'swap');
        upd();
        if (lit.every(v => v)) {
          won = true;
          G.sfx('found');
          ctx.burst(ctx.size().w / 2, oy + side / 2, ['✨', '🕯', '⭐'], 14, 130);
          const stars = !hintUsed && moves <= par + 1 ? 3 : moves <= Math.ceil(par * 1.7) ? 2 : 1;
          ctx.after(800, () => ctx.win({ stars, score: moves, text: 'Нажатий: <b class="hl">' + moves + '</b> (минимум: ' + par + ')' }));
        }
      }
      ctx.listen(ctx.box, 'pointerdown', e => {
        if (e.target.closest && e.target.closest('button')) return;
        const r = ctx.rel(e);
        const q = Math.floor((r.x - ox) / cs), y = Math.floor((r.y - oy) / cs);
        if (q < 0 || y < 0 || q >= n || y >= n) return;
        e.preventDefault();
        tap(y * n + q, true);
      });
      ctx.listen(G.$('[data-r="hint"]', bar), 'click', () => {
        if (ctx.over || ctx.paused || won) return;
        const s = solve(n, lit);
        if (!s || !s.sol.length) return;
        hintCell = s.sol[G.rand(s.sol.length)];
        hintT = ctx.time;
        hintUsed = true;
        G.sfx('click');
        ctx.say('Нажми на подсвеченную свечу', 2200);
      });

      /* ---- кадр ----
         Неподвижную часть (плитки и свечи) держим в отдельном холсте и обновляем только при нажатии или смене размера.
         Каждый кадр рисуем лишь пламя, кольца и дымок. */
      const stat = document.createElement('canvas');
      let statDirty = true;
      function renderStatic() {
        const D = view.dpr;
        const w = Math.ceil(side * D);
        if (stat.width !== w) { stat.width = w; stat.height = w; }
        const sc = stat.getContext('2d');
        sc.setTransform(D, 0, 0, D, 0, 0);
        sc.clearRect(0, 0, side, side);
        sc.drawImage(board(side, n, cs), 0, 0, side, side);
        const sg = glow(cs), gs = Math.round(cs * 1.7);
        sc.globalAlpha = 0.55;
        for (let i = 0; i < N; i++) if (lit[i]) sc.drawImage(sg, (i % n) * cs + cs / 2 - gs / 2, Math.floor(i / n) * cs + cs * 0.38 - gs / 2, gs, gs);
        sc.globalAlpha = 1;
        for (let i = 0; i < N; i++) sc.drawImage(candle(cs, kind[i], lit[i] === 1), (i % n) * cs, ((i / n) | 0) * cs, cs, cs);
      }
      ctx.onResize(() => { statDirty = true; });
      let lastFi = -1, lastHint = -1, lastDraw = -1;
      ctx.loop((dt, t) => {
        const D = view.dpr;
        let moving = false, ring = false;
        for (let i = 0; i < N; i++) {
          const target = lit[i] ? 1 : 0;
          if (fl[i] !== target) {
            fl[i] += (target - fl[i]) * Math.min(1, dt * 9);
            if (Math.abs(target - fl[i]) < 0.01) fl[i] = target;
            moving = true;
          }
          if (pr[i] > 0) { pr[i] = Math.max(0, pr[i] - dt * 3); ring = true; }
        }
        const fi = Math.floor(t * 11);                   // кадр мерцания пламени (≈11 в секунду)
        const hintDue = hintCell >= 0 && t - lastHint > 0.033;
        /* ничего не изменилось: холст не трогаем; анимацию перерисовываем не чаще ~30 раз в секунду
           (пламя меняет кадр всего ~11 раз в секунду). На слабых телефонах это главная экономия. */
        const urgent = statDirty || litChanged;
        if (!urgent && t - lastDraw < 0.029) return;
        if (!(urgent || moving || ring || smoke.length || hintDue || fi !== lastFi)) return;
        lastFi = fi; lastDraw = t;
        if (hintDue) lastHint = t;
        if (statDirty || litChanged) { renderStatic(); statDirty = false; litChanged = false; }
        const c = view.begin();
        c.drawImage(stat, 0, 0, side, side);
        const sf = flame(cs), sd = G.mg.dpr;
        for (let i = 0; i < N; i++) {
          const f = fl[i];
          if (f <= 0.02) continue;
          const k = (fi + i * 5) % FRAMES;
          const x = (i % n) * cs, y = ((i / n) | 0) * cs;
          if (f >= 0.995) c.drawImage(sf, k * cs * sd, 0, cs * sd, cs * sd, x, y, cs, cs);
          else {   // разгорается или гаснет: только масштаб по прямоугольнику, без поворота
            const w = cs * f, hh = cs * f;
            c.drawImage(sf, k * cs * sd, 0, cs * sd, cs * sd, x + cs / 2 - w / 2, y + cs * 0.36 - hh * 0.36, w, hh);
          }
        }
        c.setTransform(D, 0, 0, D, 0, 0);
        for (let i = 0; i < N; i++) {
          if (pr[i] <= 0) continue;
          const cx = (i % n) * cs, cy = ((i / n) | 0) * cs;
          c.strokeStyle = 'rgba(255,220,150,' + (pr[i] * 0.8).toFixed(2) + ')';
          c.lineWidth = 2.5;
          c.beginPath(); c.arc(cx + cs / 2, cy + cs / 2, cs * (0.3 + 0.35 * (1 - pr[i])), 0, 7); c.stroke();
        }
        /* дымок от погасших свечей */
        for (let i = smoke.length - 1; i >= 0; i--) {
          const s = smoke[i];
          s.t += dt;
          if (s.t > 0.9) { smoke.splice(i, 1); continue; }
          if (s.t < 0) continue;
          c.fillStyle = 'rgba(205,198,224,' + (0.38 * (1 - s.t / 0.9)).toFixed(2) + ')';
          c.beginPath(); c.arc(s.x + Math.sin(s.t * 8 + i) * 4, s.y - s.t * cs * 0.7, 2.5 + s.t * 5, 0, 7); c.fill();
        }
        /* подсказка: пульсирующее кольцо */
        if (hintCell >= 0) {
          const x = hintCell % n, y = (hintCell / n) | 0;
          const k = 0.5 + 0.5 * Math.sin((t - hintT) * 7);
          c.strokeStyle = 'rgba(120,255,160,' + (0.5 + 0.5 * k).toFixed(2) + ')';
          c.lineWidth = 3;
          c.beginPath(); c.arc((x + 0.5) * cs, (y + 0.5) * cs, cs * (0.42 + 0.06 * k), 0, 7); c.stroke();
        }
      });

      ctx.debug = {
        board: () => lit.slice(),
        solution: () => solve(n, lit).sol,
        moves: () => moves,
        par: () => par,
        cell: i => ({ x: ox + (i % n + 0.5) * cs, y: oy + (((i / n) | 0) + 0.5) * cs }),
        st: () => ({ n, moves, par, hintUsed, won, cs }),
        set: arr => { litChanged = true; for (let i = 0; i < N; i++) lit[i] = arr[i] ? 1 : 0; const s = solve(n, lit); par = s ? s.par : par; upd(); },
        solve, press,
        draw: () => { litChanged = true; }
      };
    }
  });
})();
