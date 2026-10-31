/* =========================================================
   Туманный лабиринт: призрак с фонарём ищет дверь в тумане.
   Видно только то, что освещает фонарь (свет идёт по коридорам, а не сквозь стены); увиденное остаётся
   тёмной «памятью». Управление: коснись поля и веди пальцем в нужную сторону, пока палец прижат,
   призрак идёт сам и поворачивает, как только появляется проход. На ПК: стрелки или WASD.
   Масло в фонаре ограничено, но в тупиках лежат свечки, которые его добавляют.
   ========================================================= */
(function () {
  'use strict';

  /* направления: 0 вверх, 1 вправо, 2 вниз, 3 влево; биты проходов: N=1 E=2 S=4 W=8 */
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0], BIT = [1, 2, 4, 8];
  const STEP = 0.105;                       // секунд на клетку (≈ 9,5 клеток/с)
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function makeMaze(cols, rows, sc, sr) {
    const cells = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const st = [[sc, sr]];
    seen[sr][sc] = true;
    while (st.length) {
      const [c, r] = st[st.length - 1];
      const opts = [];
      for (let d = 0; d < 4; d++) {
        const nc = c + DX[d], nr = r + DY[d];
        if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !seen[nr][nc]) opts.push(d);
      }
      if (!opts.length) { st.pop(); continue; }
      const d = opts[G.rand(opts.length)];
      const nc = c + DX[d], nr = r + DY[d];
      cells[r][c] |= BIT[d];
      cells[nr][nc] |= BIT[(d + 2) % 4];
      seen[nr][nc] = true;
      st.push([nc, nr]);
    }
    return cells;
  }

  /* ---------- рисование лабиринта в большой холст (светлый и тёмный варианты) ---------- */
  function drawMaze(cv, D, cells, cols, rows, cs, M, exit, palette) {
    cv.width = Math.ceil((cols * cs + 2 * M) * D);
    cv.height = Math.ceil((rows * cs + 2 * M) * D);
    const c = cv.getContext('2d');
    c.setTransform(D, 0, 0, D, 0, 0);
    c.translate(M, M);
    const P = palette;
    /* пол: плитки двух тонов + редкие камушки */
    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) {
        c.fillStyle = (q + r) % 2 ? P.f1 : P.f2;
        c.fillRect(q * cs, r * cs, cs + 0.5, cs + 0.5);
        if (((q * 7 + r * 13) % 5) === 0) {
          c.fillStyle = P.pebble;
          c.beginPath(); c.ellipse(q * cs + cs * 0.3, r * cs + cs * 0.68, cs * 0.09, cs * 0.06, 0.4, 0, 7); c.fill();
        }
      }
    }
    /* стены одной ломаной: тёмная кромка, светлая стена, блик */
    const t = Math.max(3, Math.round(cs * 0.17));
    const path = () => {
      c.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
          const o = cells[r][q];
          const x = q * cs, y = r * cs;
          if (!(o & 1)) { c.moveTo(x, y); c.lineTo(x + cs, y); }
          if (!(o & 8)) { c.moveTo(x, y); c.lineTo(x, y + cs); }
          if (r === rows - 1 && !(o & 4)) { c.moveTo(x, y + cs); c.lineTo(x + cs, y + cs); }
          if (q === cols - 1 && !(o & 2)) { c.moveTo(x + cs, y); c.lineTo(x + cs, y + cs); }
        }
      }
    };
    c.lineCap = 'round';
    path(); c.lineWidth = t + 3; c.strokeStyle = P.edge; c.stroke();
    path(); c.lineWidth = t; c.strokeStyle = P.wall; c.stroke();
    c.save(); c.translate(-t * 0.18, -t * 0.18);
    path(); c.lineWidth = Math.max(1, t * 0.28); c.strokeStyle = P.hi; c.stroke();
    c.restore();
    /* дверь на выходе */
    const ex = exit.c * cs, ey = exit.r * cs;
    if (P.aura) {
      const g = c.createRadialGradient(ex + cs / 2, ey + cs / 2, 1, ex + cs / 2, ey + cs / 2, cs * 0.85);
      g.addColorStop(0, 'rgba(255,210,110,.55)'); g.addColorStop(1, 'rgba(255,210,110,0)');
      c.fillStyle = g; c.fillRect(ex - cs * 0.4, ey - cs * 0.4, cs * 1.8, cs * 1.8);
    }
    const dw = cs * 0.62, dh = cs * 0.76, dx = ex + (cs - dw) / 2, dy = ey + cs * 0.14;
    c.fillStyle = P.door; c.strokeStyle = P.doorEdge; c.lineWidth = Math.max(1.5, cs * 0.06);
    c.beginPath(); c.moveTo(dx, dy + dh); c.lineTo(dx, dy + dw / 2); c.arc(dx + dw / 2, dy + dw / 2, dw / 2, Math.PI, 0); c.lineTo(dx + dw, dy + dh); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = P.doorEdge; c.lineWidth = 1;
    c.beginPath(); c.moveTo(dx + dw / 3, dy + dw * 0.1); c.lineTo(dx + dw / 3, dy + dh); c.moveTo(dx + dw * 2 / 3, dy + dw * 0.1); c.lineTo(dx + dw * 2 / 3, dy + dh); c.stroke();
    c.fillStyle = P.knob; c.beginPath(); c.arc(dx + dw * 0.8, dy + dh * 0.58, Math.max(1.5, cs * 0.05), 0, 7); c.fill();
  }

  const BRIGHT = { f1: '#2d2350', f2: '#271f47', pebble: 'rgba(0,0,0,.22)', edge: '#120b26', wall: '#a998e8', hi: 'rgba(255,255,255,.4)', door: '#a8672a', doorEdge: '#4a2a0c', knob: '#ffd35a', aura: true };
  const DIM = { f1: '#16112d', f2: '#130f28', pebble: 'rgba(0,0,0,.2)', edge: '#07040f', wall: '#3b3466', hi: 'rgba(255,255,255,.06)', door: '#4a2e14', doorEdge: '#1d1006', knob: '#8a7430', aura: false };

  /* ---------- спрайты: призрак с фонарём, свеча, свет ---------- */
  const ghostSprite = cs => {
    const S = Math.round(cs * 1.15);
    return G.mg.sprite('mzg', S, S, (c, w) => {
      const cx = w / 2, top = w * 0.12, bot = w * 0.88, hw = w * 0.3;
      const g = c.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b9c4ff');
      c.fillStyle = g; c.strokeStyle = 'rgba(120,130,220,.9)'; c.lineWidth = Math.max(1, w * 0.04);
      c.beginPath();
      c.moveTo(cx - hw, bot);
      c.lineTo(cx - hw, top + hw);
      c.arc(cx, top + hw, hw, Math.PI, 0);
      c.lineTo(cx + hw, bot);
      const n = 3, seg = (hw * 2) / n;
      for (let i = 0; i < n; i++) {
        const x0 = cx + hw - i * seg;
        c.quadraticCurveTo(x0 - seg / 2, bot - w * 0.14 * (i % 2 ? -1 : 1) + w * 0.07, x0 - seg, bot);
      }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#25203f';
      c.beginPath(); c.ellipse(cx - hw * 0.42, top + hw * 0.95, w * 0.045, w * 0.07, 0, 0, 7); c.ellipse(cx + hw * 0.42, top + hw * 0.95, w * 0.045, w * 0.07, 0, 0, 7); c.fill();
      c.beginPath(); c.ellipse(cx, top + hw * 1.5, w * 0.04, w * 0.05, 0, 0, 7); c.fill();
      /* фонарь в руке */
      const lx = cx + hw + w * 0.02, ly = top + hw * 1.65;
      c.strokeStyle = '#4a3a20'; c.lineWidth = Math.max(1, w * 0.035);
      c.beginPath(); c.moveTo(lx - w * 0.06, ly - w * 0.1); c.lineTo(lx, ly - w * 0.05); c.stroke();
      c.fillStyle = '#ffd35a'; c.strokeStyle = '#6a4a14';
      c.beginPath(); c.rect(lx - w * 0.05, ly - w * 0.05, w * 0.1, w * 0.13); c.fill(); c.stroke();
    });
  };
  const candleSprite = cs => {
    const S = Math.round(cs * 0.8);
    return G.mg.sprite('mzc', S, S, (c, w) => {
      const cx = w / 2;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(cx, w * 0.9, w * 0.2, w * 0.05, 0, 0, 7); c.fill();
      const g = c.createLinearGradient(cx - w * 0.14, 0, cx + w * 0.14, 0);
      g.addColorStop(0, '#fff8e0'); g.addColorStop(1, '#d8c8a0');
      c.fillStyle = g; c.strokeStyle = '#8a7a50'; c.lineWidth = 1.2;
      c.beginPath(); c.rect(cx - w * 0.14, w * 0.42, w * 0.28, w * 0.46); c.fill(); c.stroke();
      c.strokeStyle = '#3a2a14'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, w * 0.42); c.lineTo(cx, w * 0.34); c.stroke();
      const f = c.createRadialGradient(cx, w * 0.24, 1, cx, w * 0.26, w * 0.16);
      f.addColorStop(0, '#fffbe0'); f.addColorStop(0.5, '#ffc24a'); f.addColorStop(1, 'rgba(255,120,20,0)');
      c.fillStyle = f; c.beginPath(); c.ellipse(cx, w * 0.25, w * 0.1, w * 0.17, 0, 0, 7); c.fill();
    });
  };
  const glowSprite = cs => {
    const S = Math.round(cs * 3);
    return G.mg.sprite('mzw', S, S, (c, w) => {
      const g = c.createRadialGradient(w / 2, w / 2, 1, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,200,110,.30)'); g.addColorStop(1, 'rgba(255,200,110,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, w);
    });
  };

  G.mg.register({
    id: 'maze',
    title: 'Туманный лабиринт',
    icon: '🌫',
    intro: 'В тумане легко заблудиться. Веди пальцем: призрак идёт в ту сторону, пока палец прижат. Найди дверь, пока в фонаре есть масло!',
    quest: 'Найди дверь в туманном лабиринте, пока не погас фонарь 🌫',
    doneTitle: 'Выход найден!',
    doneIcon: '🚪',
    doneText: 'Туман расступился, и призрак выбрался из лабиринта. Следующая остановка: <b class="hl">Часовня свечей</b>.',
    levels: [
      { label: '7×9', cols: 7, rows: 9, r: 2.6, time: 90, candles: 2, task: 'Коснись поля и веди пальцем: призрак идёт в ту сторону. Найди <b>дверь</b> 🚪, пока горит фонарь. Свечки в тупиках добавляют масло.' },
      { label: '9×11', cols: 9, rows: 11, r: 2.4, time: 100, candles: 3, task: 'Лабиринт побольше: <b>9×11</b>. Свет фонаря освещает только коридор рядом.' },
      { label: '11×14', cols: 11, rows: 14, r: 2.2, time: 120, candles: 3, task: 'Ещё больше: <b>11×14</b>. Запоминай, где уже был: пройденное остаётся в памяти.' },
      { label: '13×17', cols: 13, rows: 17, r: 2.0, time: 150, candles: 4, task: 'Самый большой лабиринт: <b>13×17</b>, свет совсем тусклый. Удачи!' }
    ],

    start(ctx, L, cfg) {
      const cols = cfg.cols, rows = cfg.rows;
      /* старт в углу, выход в противоположном */
      const sc = G.rand(2) ? cols - 1 : 0, sr = G.rand(2) ? rows - 1 : 0;
      const exit = { c: cols - 1 - sc, r: rows - 1 - sr };
      const cells = makeMaze(cols, rows, sc, sr);
      /* свечки в тупиках (не на старте и не на выходе) */
      const dead = [];
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const o = cells[r][q];
        const cnt = (o & 1 ? 1 : 0) + (o & 2 ? 1 : 0) + (o & 4 ? 1 : 0) + (o & 8 ? 1 : 0);
        if (cnt === 1 && !(q === sc && r === sr) && !(q === exit.c && r === exit.r)) dead.push({ c: q, r });
      }
      G.shuffle(dead);
      const candles = dead.slice(0, cfg.candles);

      const view = ctx.canvas(1.5);
      const cell = { c: sc, r: sr };
      let mv = null, heading = -1, want = -1, face = 1, finished = false, steps = 0;
      let cs = 24, M = 4, D = 1, mx = 0, my = 0, Rl = 60;
      const seen = new Uint8Array(cols * rows);
      let vis = [];
      const brightCv = document.createElement('canvas'), dimCv = document.createElement('canvas');
      const memCv = document.createElement('canvas'), litCv = document.createElement('canvas'), maskCv = document.createElement('canvas');
      let spG, spC, spW;

      /* клетки, освещённые из (c, r): идём по проходам не дальше радиуса света */
      function lightFrom(c, r, out) {
        const R = cfg.r, depth = Math.ceil(R);
        const q = [[c, r, 0]];
        const mark = new Set([c + r * cols]);
        for (let i = 0; i < q.length; i++) {
          const [cc, rr, d] = q[i];
          out.add(cc + rr * cols);
          if (d >= depth) continue;
          for (let k = 0; k < 4; k++) {
            if (!(cells[rr][cc] & BIT[k])) continue;
            const nc = cc + DX[k], nr = rr + DY[k], id = nc + nr * cols;
            if (mark.has(id)) continue;
            if (Math.hypot(nc - c, nr - r) > R + 0.35) continue;
            mark.add(id);
            q.push([nc, nr, d + 1]);
          }
        }
      }
      function setVis(a, b) {
        const s = new Set();
        lightFrom(a.c, a.r, s);
        if (b) lightFrom(b.c, b.r, s);
        vis = [...s];
        const mc = memCv.getContext('2d');
        for (const id of vis) if (!seen[id]) { seen[id] = 1; copyCell(mc, dimCv, id % cols, (id / cols) | 0, 0, 0, true); }
      }
      /* копия клетки (с полем M вокруг) из большого холста src в ctx2d холста dst */
      function copyCell(c2, src, q, r, ox, oy, toMem) {
        const sw = (cs + 2 * M);
        c2.drawImage(src, q * cs * D, r * cs * D, sw * D, sw * D, ox + q * cs, oy + r * cs, sw, sw);
      }

      function rebuild(w, h) {
        D = view.dpr;
        cs = Math.max(14, Math.floor(Math.min((w - 14) / cols, (h - 14) / rows)));
        M = Math.max(3, Math.round(cs * 0.17));
        mx = Math.round((w - cols * cs) / 2); my = Math.round((h - rows * cs) / 2);
        drawMaze(brightCv, D, cells, cols, rows, cs, M, exit, BRIGHT);
        drawMaze(dimCv, D, cells, cols, rows, cs, M, exit, DIM);
        /* память: тот же размер, что и лабиринт; перекопируем уже виденные клетки */
        memCv.width = brightCv.width; memCv.height = brightCv.height;
        const mc = memCv.getContext('2d');
        mc.setTransform(D, 0, 0, D, 0, 0);
        for (let id = 0; id < seen.length; id++) if (seen[id]) copyCell(mc, dimCv, id % cols, (id / cols) | 0, 0, 0, true);
        /* свет */
        Rl = (cfg.r + 0.55) * cs;
        litCv.width = litCv.height = Math.ceil(2 * Rl * D * 1.06);
        maskCv.width = maskCv.height = Math.ceil(2 * Rl * D);
        const k = maskCv.getContext('2d');
        k.setTransform(1, 0, 0, 1, 0, 0);
        const rr = maskCv.width / 2;
        const g = k.createRadialGradient(rr, rr, 1, rr, rr, rr);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,.96)'); g.addColorStop(0.8, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        k.fillStyle = g; k.fillRect(0, 0, maskCv.width, maskCv.height);
        spG = ghostSprite(cs); spC = candleSprite(cs); spW = glowSprite(cs);
      }
      ctx.onResize((w, h) => { rebuild(w, h); });
      setVis(cell, null);

      /* ---- счётчики и таймер масла ---- */
      const T = ctx.countdown(cfg.time, () => {
        if (finished) return;
        ctx.lose({ title: 'Масло кончилось!', icon: '🏮', text: 'Фонарь погас, и призрак заблудился в тумане. Попробуй ещё раз!' });
      }, { label: '🏮', warn: 8 });
      let lastGoal = -1;
      ctx.chip('cd', '🕯', cfg.candles);
      const goalNow = () => {
        const s = Math.ceil(T.left);
        if (s === lastGoal) return; lastGoal = s;
        ctx.goal(Math.min(T.left, cfg.time), cfg.time, 'Масла в фонаре: ' + s + ' с');
      };
      goalNow();
      ctx.say('Веди пальцем по полю: призрак идёт следом', 3200);

      /* ---- ввод: «плавающий джойстик» и клавиатура ---- */
      let touch = null;
      const held = [];
      ctx.listen(ctx.box, 'pointerdown', e => {
        if (ctx.over || ctx.paused || finished) return;
        e.preventDefault();
        touch = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
        try { ctx.box.setPointerCapture(e.pointerId); } catch (_) { /* не страшно */ }
      });
      ctx.listen(ctx.box, 'pointermove', e => {
        if (!touch || e.pointerId !== touch.id) return;
        let dx = e.clientX - touch.ox, dy = e.clientY - touch.oy;
        const m = Math.hypot(dx, dy);
        if (m > 46) { const k = (m - 46) / m; touch.ox += dx * k; touch.oy += dy * k; dx = e.clientX - touch.ox; dy = e.clientY - touch.oy; }
        const ax = Math.abs(dx), ay = Math.abs(dy);
        if (Math.max(ax, ay) < 18) { want = -1; return; }
        let nd = ax > ay ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
        if (want >= 0 && nd !== want && (nd % 2) !== (want % 2)) {
          const keep = want % 2 === 1 ? ax : ay, fresh = want % 2 === 1 ? ay : ax;
          if (fresh < keep * 1.3) nd = want;     // не дёргаемся на границе осей
        }
        want = nd;
      });
      const up = e => { if (touch && (!e || e.pointerId === touch.id)) { touch = null; want = -1; } };
      ctx.listen(ctx.box, 'pointerup', up);
      ctx.listen(ctx.box, 'pointercancel', up);
      ctx.listen(ctx.box, 'lostpointercapture', up);
      const KEYS = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, KeyW: 0, KeyD: 1, KeyS: 2, KeyA: 3 };
      ctx.listen(window, 'keydown', e => {
        const d = KEYS[e.code];
        if (d === undefined || e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.querySelector('.modal-back.in')) return;
        e.preventDefault();
        const i = held.indexOf(d); if (i >= 0) held.splice(i, 1);
        held.push(d); want = d;
      });
      ctx.listen(window, 'keyup', e => {
        const d = KEYS[e.code];
        if (d === undefined) return;
        const i = held.indexOf(d); if (i >= 0) held.splice(i, 1);
        if (!touch) want = held.length ? held[held.length - 1] : -1;
      });

      /* ---- движение ---- */
      function pick() {
        if (want < 0) { heading = -1; return -1; }
        const open = cells[cell.r][cell.c];
        if (open & BIT[want]) { heading = want; return want; }
        if (heading >= 0 && (open & BIT[heading]) && heading !== (want + 2) % 4) return heading;
        heading = -1;
        return -1;
      }
      function depart(d) {
        const to = { c: cell.c + DX[d], r: cell.r + DY[d] };
        mv = { fc: cell.c, fr: cell.r, tc: to.c, tr: to.r, t: 0, dir: d };
        if (DX[d]) face = DX[d];
        setVis(cell, to);
      }
      function arrive() {
        cell.c = mv.tc; cell.r = mv.tr; mv = null; steps++;
        setVis(cell, null);
        const ci = candles.findIndex(k => k.c === cell.c && k.r === cell.r);
        if (ci >= 0) {
          candles.splice(ci, 1);
          T.add(8);
          lastGoal = -1; goalNow();
          ctx.chip('cd', '🕯', candles.length, true);
          G.sfx('ding');
          ctx.float(mx + (cell.c + 0.5) * cs, my + (cell.r + 0.2) * cs, '+8 с', 'good');
        }
        if (cell.c === exit.c && cell.r === exit.r) {
          finished = true; want = -1;
          G.sfx('found');
          ctx.burst(mx + (cell.c + 0.5) * cs, my + (cell.r + 0.5) * cs, ['✨', '🚪', '⭐'], 12, 110);
          const frac = clamp(T.left / cfg.time, 0, 1);
          const stars = frac >= 0.5 ? 3 : frac >= 0.25 ? 2 : 1;
          const left = Math.round(T.left);
          ctx.after(450, () => ctx.win({ stars, score: left, text: 'Масла осталось: <b class="hl">' + left + ' с</b>' }));
        }
      }
      ctx.loop(dt => {
        if (finished) { render(); return; }
        let rem = dt;
        let guard = 0;
        while (rem > 0 && guard++ < 8 && !finished) {
          if (!mv) { const d = pick(); if (d < 0) break; depart(d); }
          else if (want >= 0 && want === (mv.dir + 2) % 4) {      // разворот на ходу
            const t = mv; [t.fc, t.tc] = [t.tc, t.fc]; [t.fr, t.tr] = [t.tr, t.fr]; t.t = 1 - t.t; t.dir = want; heading = want;
            if (DX[want]) face = DX[want];
          }
          const need = STEP * (1 - mv.t);
          if (rem >= need) { rem -= need; mv.t = 1; arrive(); }
          else { mv.t += rem / STEP; rem = 0; }
        }
        goalNow();
        render();
      });

      /* ---- кадр ---- */
      const litc = litCv.getContext('2d');
      function render() {
        const c = view.begin();
        const t = ctx.time;
        /* позиция призрака */
        let px, py;
        if (mv) { px = mv.fc + (mv.tc - mv.fc) * mv.t; py = mv.fr + (mv.tr - mv.fr) * mv.t; } else { px = cell.c; py = cell.r; }
        const gx = mx + (px + 0.5) * cs, gy = my + (py + 0.5) * cs;
        /* еле заметная рамка: видно, где кончается лабиринт */
        c.strokeStyle = 'rgba(160,150,230,.24)'; c.lineWidth = 2;
        c.strokeRect(mx - 1, my - 1, cols * cs + 2, rows * cs + 2);
        /* память */
        c.drawImage(memCv, mx - M, my - M, memCv.width / D, memCv.height / D);
        /* свет: клетки из vis, обрезанные мягкой маской вокруг призрака */
        const fl = Rl * (1 + 0.025 * Math.sin(t * 9) + 0.012 * Math.sin(t * 23));
        const Ld = litCv.width / D;                 // сторона холста света в CSS-пикселях
        litc.setTransform(1, 0, 0, 1, 0, 0);
        litc.globalCompositeOperation = 'source-over';
        litc.clearRect(0, 0, litCv.width, litCv.height);
        litc.setTransform(D, 0, 0, D, 0, 0);
        const ox = gx - Ld / 2 - mx, oy = gy - Ld / 2 - my;     // начало холста света в системе лабиринта
        for (let i = 0; i < vis.length; i++) {
          const id = vis[i], q = id % cols, r = (id / cols) | 0;
          copyCell(litc, brightCv, q, r, -ox - M, -oy - M, false);
        }
        litc.globalCompositeOperation = 'destination-in';
        litc.setTransform(1, 0, 0, 1, 0, 0);
        const mw = fl * 2 * D;
        litc.drawImage(maskCv, (litCv.width - mw) / 2, (litCv.height - mw) / 2, mw, mw);
        litc.globalCompositeOperation = 'source-over';
        c.drawImage(litCv, gx - Ld / 2, gy - Ld / 2, Ld, Ld);
        /* тёплое пятно света, свечки, призрак */
        const gs = spW.width / MGdpr();
        c.drawImage(spW, gx - gs / 2, gy - gs / 2, gs, gs);
        for (let i = 0; i < candles.length; i++) {
          const k = candles[i];
          if (!vis.includes(k.c + k.r * cols)) continue;
          const sz = spC.width / MGdpr(), s = 1 + 0.06 * Math.sin(t * 8 + i);
          c.drawImage(spC, mx + (k.c + 0.5) * cs - sz * s / 2, my + (k.r + 0.5) * cs - sz * s / 2, sz * s, sz * s);
        }
        const gz = spG.width / MGdpr(), bob = Math.sin(t * 5) * cs * 0.04;
        if (face < 0) {
          c.save(); c.translate(gx, gy + bob); c.scale(-1, 1);
          c.drawImage(spG, -gz / 2, -gz / 2, gz, gz);
          c.restore();
        } else c.drawImage(spG, gx - gz / 2, gy - gz / 2 + bob, gz, gz);
      }
      const MGdpr = () => G.mg.dpr;

      ctx.debug = {
        maze: () => ({ cols, rows, cells: cells.map(r => r.slice()) }),
        pos: () => ({ c: cell.c, r: cell.r, moving: !!mv, next: mv ? { c: mv.tc, r: mv.tr } : null, want, heading }),
        exit: () => ({ c: exit.c, r: exit.r }),
        candles: () => candles.map(k => ({ c: k.c, r: k.r })),
        cellPx: () => ({ x: mx, y: my, cs }),
        st: () => ({ left: T.left, steps, finished, cs, vis: vis.length }),
        tp: (c, r) => { cell.c = c; cell.r = r; mv = null; setVis(cell, null); },
        time: s => { if (s !== undefined) { T.left = s; lastGoal = -1; } return T.left; }
      };
    }
  });
})();
