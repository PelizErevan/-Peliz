/* =========================================================
   Тыквенная грядка: «2048» с тыквами.
   Свайп двигает все тыквы. Две одинаковые сливаются в одну покрупнее. Вырасти тыкву-великаншу.
   Есть три отмены хода. Если ходов нет, а отмены остались, игра подскажет вернуть ход.
   ========================================================= */
(function () {
  'use strict';

  const N = 4;
  /* цвета тыкв по значению: светлый, основной, тёмный */
  const PAL = {
    2: ['#d9f58e', '#a6d84e', '#4f8418'],
    4: ['#fff58a', '#eadc3e', '#8c7d08'],
    8: ['#ffe27a', '#ffc02c', '#a26a06'],
    16: ['#ffc060', '#ff9a1c', '#a84a00'],
    32: ['#ff9a58', '#ff7412', '#9c3000'],
    64: ['#ff8068', '#ec4c1c', '#8a1800'],
    128: ['#f0708c', '#d02e4c', '#74101e'],
    256: ['#d29af0', '#a244d6', '#481480'],
    512: ['#9ff0e6', '#44ccc0', '#0e665e'],
    1024: ['#fff2a0', '#ffd23a', '#9a7000']
  };
  const pal = v => PAL[v] || PAL[1024];

  /* спрайт одной тыквы с числом */
  function pumpkin(v, s) {
    return G.mg.sprite('pk' + v, s, s, (c, w) => {
      const [lt, bs, dk] = pal(v);
      const cx = w / 2, cy = w * 0.585, rx = w * 0.43, ry = w * 0.32;
      if (v >= 512) {
        const hg = c.createRadialGradient(cx, cy, w * 0.1, cx, cy, w * 0.55);
        hg.addColorStop(0, 'rgba(255,255,255,.0)');
        hg.addColorStop(0.7, v >= 1024 ? 'rgba(255,230,120,.45)' : 'rgba(120,255,240,.4)');
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = hg;
        c.fillRect(0, 0, w, w);
      }
      c.fillStyle = 'rgba(0,0,0,.3)';
      c.beginPath(); c.ellipse(cx, w * 0.92, rx * 0.86, w * 0.045, 0, 0, 7); c.fill();
      const lobes = [[-0.58, 0.46, 0.9], [0.58, 0.46, 0.9], [-0.3, 0.52, 0.97], [0.3, 0.52, 0.97], [0, 0.52, 1]];
      c.lineWidth = Math.max(1, w * 0.02);
      c.strokeStyle = dk;
      for (const [ox, hw, hh] of lobes) {
        const x = cx + ox * rx, ew = hw * rx, eh = hh * ry;
        const g = c.createRadialGradient(x - ew * 0.3, cy - eh * 0.45, 1, x, cy, Math.max(ew, eh) * 1.15);
        g.addColorStop(0, lt); g.addColorStop(0.5, bs); g.addColorStop(1, dk);
        c.fillStyle = g;
        c.beginPath(); c.ellipse(x, cy, ew, eh, 0, 0, 7); c.fill(); c.stroke();
      }
      /* стебель и листик */
      c.fillStyle = '#6a8a28'; c.strokeStyle = '#2c4510'; c.lineWidth = Math.max(1, w * 0.02);
      c.beginPath();
      c.moveTo(cx - w * 0.055, cy - ry * 0.9);
      c.quadraticCurveTo(cx - w * 0.05, cy - ry - w * 0.1, cx + w * 0.05, cy - ry - w * 0.12);
      c.lineTo(cx + w * 0.085, cy - ry - w * 0.07);
      c.quadraticCurveTo(cx + w * 0.02, cy - ry - w * 0.05, cx + w * 0.055, cy - ry * 0.88);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#7cbc34';
      c.beginPath(); c.ellipse(cx - w * 0.17, cy - ry - w * 0.015, w * 0.1, w * 0.04, -0.5, 0, 7); c.fill(); c.stroke();
      /* блик */
      c.fillStyle = 'rgba(255,255,255,.42)';
      c.beginPath(); c.ellipse(cx - rx * 0.52, cy - ry * 0.42, w * 0.045, w * 0.085, 0.5, 0, 7); c.fill();
      /* число */
      const txt = String(v);
      const fs = Math.round(w * (txt.length <= 2 ? 0.3 : txt.length === 3 ? 0.25 : 0.2));
      c.font = '900 ' + fs + 'px "Trebuchet MS", system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineJoin = 'round'; c.lineWidth = Math.max(2, w * 0.07); c.strokeStyle = dk;
      c.strokeText(txt, cx, cy + ry * 0.12);
      c.fillStyle = '#fff';
      c.fillText(txt, cx, cy + ry * 0.12);
    });
  }

  /* фон грядки: земля, ячейки-лунки, деревянная рамка */
  function bed(side, cs, pad, gap) {
    return G.mg.sprite('pkbed', side, side, (c, w) => {
      const rr = (x, y, ww, hh, r) => {
        c.beginPath();
        c.moveTo(x + r, y); c.arcTo(x + ww, y, x + ww, y + hh, r); c.arcTo(x + ww, y + hh, x, y + hh, r);
        c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + ww, y, r); c.closePath();
      };
      const g = c.createLinearGradient(0, 0, 0, w);
      g.addColorStop(0, '#5e3d1f'); g.addColorStop(1, '#3a2411');
      c.fillStyle = g; rr(1.5, 1.5, w - 3, w - 3, w * 0.07); c.fill();
      c.lineWidth = Math.max(3, w * 0.014); c.strokeStyle = '#9a6a30'; c.stroke();
      c.lineWidth = 1; c.strokeStyle = '#1f1208'; rr(w * 0.014 + 2, w * 0.014 + 2, w - w * 0.028 - 4, w - w * 0.028 - 4, w * 0.06); c.stroke();
      /* камешки и травинки: псевдослучайно, но одинаково */
      let seed = 7;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < 26; i++) {
        const x = pad + rnd() * (w - pad * 2), y = pad + rnd() * (w - pad * 2);
        c.fillStyle = rnd() > 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(255,200,120,.08)';
        c.beginPath(); c.ellipse(x, y, 2 + rnd() * 3, 1.5 + rnd() * 2, rnd() * 3, 0, 7); c.fill();
      }
      for (let r = 0; r < N; r++) {
        for (let q = 0; q < N; q++) {
          const x = pad + q * (cs + gap), y = pad + r * (cs + gap);
          const hg = c.createRadialGradient(x + cs / 2, y + cs * 0.6, 2, x + cs / 2, y + cs / 2, cs * 0.75);
          hg.addColorStop(0, '#2a180b'); hg.addColorStop(1, '#1a0e06');
          c.fillStyle = hg; rr(x, y, cs, cs, cs * 0.2); c.fill();
          c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,210,150,.12)'; rr(x + 1, y + 1, cs - 2, cs - 2, cs * 0.2); c.stroke();
        }
      }
    });
  }

  /* сдвиг линий. dir: L R U D. Возвращает новую сетку, прибавку очков, след для анимации и список слияний */
  function slide(grid, dir) {
    const out = grid.map(r => r.slice());
    const trace = [], merges = [];
    let moved = false, gain = 0;
    for (let i = 0; i < N; i++) {
      const cells = [];
      for (let j = 0; j < N; j++) cells.push(dir === 'L' ? [i, j] : dir === 'R' ? [i, N - 1 - j] : dir === 'U' ? [j, i] : [N - 1 - j, i]);
      const res = [];
      for (let j = 0; j < N; j++) {
        const [r, q] = cells[j], v = grid[r][q];
        if (!v) continue;
        const last = res[res.length - 1];
        if (last && last.v === v && !last.m) {
          last.v *= 2; last.m = true;
          gain += last.v;
          const [tr, tq] = cells[res.length - 1];
          trace.push({ r0: r, c0: q, r1: tr, c1: tq, v });
          merges.push({ r: tr, c: tq, v: last.v });
          moved = true;
        } else {
          const k = res.length;
          res.push({ v, m: false });
          const [tr, tq] = cells[k];
          trace.push({ r0: r, c0: q, r1: tr, c1: tq, v });
          if (tr !== r || tq !== q) moved = true;
        }
      }
      for (let j = 0; j < N; j++) {
        const [r, q] = cells[j];
        out[r][q] = res[j] ? res[j].v : 0;
      }
    }
    return { grid: out, moved, gain, trace, merges };
  }
  const canMove = g => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (!g[r][c]) return true;
      if (c + 1 < N && g[r][c] === g[r][c + 1]) return true;
      if (r + 1 < N && g[r][c] === g[r + 1][c]) return true;
    }
    return false;
  };
  const maxOf = g => { let m = 0; g.forEach(r => r.forEach(v => { if (v > m) m = v; })); return m; };
  const copy = g => g.map(r => r.slice());
  const lg = v => Math.log2(Math.max(2, v));

  G.mg.register({
    id: 'pumpkin',
    title: 'Тыквенная грядка',
    icon: '🎃',
    intro: 'Свайпай по грядке: все тыквы едут в ту сторону, а две одинаковые сливаются в одну покрупнее. Вырасти тыкву-великаншу!',
    quest: 'Вырасти тыкву-великаншу: сливай одинаковые тыквы на грядке 🎃',
    doneTitle: 'Великанша выросла!',
    doneIcon: '🎃',
    doneText: 'Такой огромной тыквы лес ещё не видел. Следующая остановка: <b class="hl">Паучья роща</b>.',
    levels: [
      { label: '32', target: 32, task: 'Свайпай по грядке: одинаковые тыквы сливаются в одну покрупнее. Вырасти тыкву <b>32</b>. Отмен хода: 3.' },
      { label: '64', target: 64, task: 'Вырасти тыкву <b>64</b>. Большие тыквы удобно держать в углу грядки. Отмен хода: 3.' },
      { label: '128', target: 128, task: 'Вырасти тыкву <b>128</b>. Не давай грядке зарасти! Отмен хода: 3.' },
      { label: '256', target: 256, task: 'Главное испытание: вырасти тыкву-великаншу <b>256</b>. Отмен хода: 3.' }
    ],

    start(ctx, L, cfg) {
      const target = cfg.target;
      let grid = [], score = 0, moves = 0, undoLeft = 3, undoUsed = 0;
      let hist = [], anim = null, effects = [], won = false, stuck = false, dirty = true;
      for (let r = 0; r < N; r++) grid.push(new Array(N).fill(0));

      const view = ctx.canvas(1.25);
      const bar = G.el('div', 'pk-bar');
      bar.innerHTML = '<button class="btn btn-small btn-ghost pk-undo" type="button" data-r="undo">↩ Отмена <b>3</b></button><span class="pk-hint">Свайпай по грядке</span>';
      ctx.box.appendChild(bar);
      const undoBtn = G.$('[data-r="undo"]', bar), undoNum = G.$('b', undoBtn);

      let ox = 0, oy = 0, side = 280, cs = 60, pad = 10, gap = 8, bg = null;
      ctx.onResize((w, h) => {
        const area = h - 58;
        side = Math.max(160, Math.floor(Math.min(w - 16, area - 8)));
        ox = Math.round((w - side) / 2);
        oy = Math.max(2, Math.round((area - side) / 2) + 2);
        pad = Math.round(side * 0.04); gap = Math.round(side * 0.03);
        cs = Math.floor((side - pad * 2 - gap * (N - 1)) / N);
        bg = bed(side, cs, pad, gap);
        dirty = true;
      });
      const cx = c => ox + pad + c * (cs + gap);
      const cy = r => oy + pad + r * (cs + gap);

      function spawn() {
        const e = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!grid[r][c]) e.push([r, c]);
        if (!e.length) return null;
        const [r, c] = e[G.rand(e.length)];
        const v = Math.random() < 0.9 ? 2 : 4;
        grid[r][c] = v;
        return { r, c, v };
      }
      function status() {
        const m = maxOf(grid);
        ctx.chip('max', '🎃', m);
        ctx.chip('undo', '↩', undoLeft);
        ctx.goal(lg(m), lg(target), 'Цель: ' + target + ' · сейчас ' + m);
        undoNum.textContent = undoLeft;
        undoBtn.disabled = !(undoLeft > 0 && hist.length > 0) || ctx.over;
        undoBtn.classList.toggle('pulse', stuck);
      }

      function endAnim() {
        if (!anim) return;
        const a = anim; anim = null;
        const t = ctx.time;
        a.merges.forEach(m => effects.push({ r: m.r, c: m.c, t0: t, k: 'pop' }));
        if (a.spawn) effects.push({ r: a.spawn.r, c: a.spawn.c, t0: t, k: 'in' });
        dirty = true;
        afterMove();
      }
      function afterMove() {
        if (won || ctx.over) return;
        if (maxOf(grid) >= target) {
          won = true;
          G.sfx('found');
          const stars = undoUsed === 0 ? 3 : undoUsed === 1 ? 2 : 1;
          ctx.after(450, () => ctx.win({ stars, score, text: 'Ходов: <b class="hl">' + moves + '</b>, отмен: ' + undoUsed }));
          status();
          return;
        }
        if (!canMove(grid)) {
          if (undoLeft > 0 && hist.length) {
            stuck = true;
            ctx.say('Ходов нет! Нажми «Отмена» ↩', 2800);
            G.sfx('scare');
          } else {
            ctx.lose({ title: 'Грядка заросла!', icon: '🥀', text: 'Тыквам некуда сливаться. Попробуй держать самую большую в углу.' });
          }
        }
        status();
      }

      function move(dir) {
        if (ctx.over || ctx.paused || won) return false;
        if (anim) endAnim();
        if (won || ctx.over) return false;
        const r = slide(grid, dir);
        if (!r.moved) return false;
        hist.push({ grid: copy(grid), score });
        if (hist.length > 40) hist.shift();
        grid = r.grid; score += r.gain; moves++; stuck = false;
        const sp = spawn();
        anim = { t0: ctx.time, trace: r.trace, merges: r.merges, spawn: sp, dir };
        if (r.merges.length) {
          let best = r.merges[0];
          r.merges.forEach(m => { if (m.v > best.v) best = m; });
          G.sfx(best.v >= 32 ? 'ding' : 'pop');
          if (best.v >= 16) {
            const bx = cx(best.c) + cs / 2, by = cy(best.r) + cs / 2;
            ctx.burst(bx, by, ['✨', '🎃'], best.v >= 64 ? 8 : 5, 70);
            ctx.float(bx, by - cs * 0.3, '+' + best.v);
          }
        } else G.sfx('swap');
        dirty = true;
        status();
        return true;
      }
      function undo() {
        if (ctx.over || ctx.paused || won) return;
        if (!(undoLeft > 0 && hist.length)) return;
        anim = null; effects = [];
        const h = hist.pop();
        grid = h.grid; score = h.score;
        undoLeft--; undoUsed++; stuck = false;
        G.sfx('whoosh');
        dirty = true;
        status();
      }

      /* ввод: свайп, стрелки, WASD */
      let tr = null;
      ctx.listen(ctx.box, 'pointerdown', e => {
        if (e.target.closest && e.target.closest('button')) return;
        tr = { id: e.pointerId, x: e.clientX, y: e.clientY };
      });
      ctx.listen(ctx.box, 'pointermove', e => {
        if (!tr || e.pointerId !== tr.id) return;
        const dx = e.clientX - tr.x, dy = e.clientY - tr.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        tr = null;
        move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
      });
      const stop = () => { tr = null; };
      ctx.listen(window, 'pointerup', stop);
      ctx.listen(window, 'pointercancel', stop);
      const KEYS = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', KeyA: 'L', KeyD: 'R', KeyW: 'U', KeyS: 'D' };
      ctx.listen(window, 'keydown', e => {
        const d = KEYS[e.code];
        if (!d || e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.querySelector('.modal-back.in')) return;
        e.preventDefault();
        move(d);
      });
      ctx.listen(undoBtn, 'click', () => { G.sfx('click'); undo(); });

      /* кадр */
      const SLIDE = 0.11;
      const ease = k => 1 - (1 - k) * (1 - k);
      function tile(c, v, x, y, sc) {
        const sp = pumpkin(v, cs);
        if (sc === 1) c.drawImage(sp, x, y, cs, cs);
        else { const d = cs * sc; c.drawImage(sp, x + (cs - d) / 2, y + (cs - d) / 2, d, d); }
      }
      function render() {
        const c = view.begin();
        if (bg) c.drawImage(bg, ox, oy, side, side);
        if (anim) {
          const k = Math.min(1, (ctx.time - anim.t0) / SLIDE), e = ease(k);
          for (const m of anim.trace) tile(c, m.v, cx(m.c0 + (m.c1 - m.c0) * e), cy(m.r0 + (m.r1 - m.r0) * e), 1);
          if (k >= 1) endAnim();
          return;
        }
        const now = ctx.time;
        for (let r = 0; r < N; r++) {
          for (let q = 0; q < N; q++) {
            const v = grid[r][q];
            if (!v) continue;
            let sc = 1;
            for (let i = 0; i < effects.length; i++) {
              const f = effects[i];
              if (f.r !== r || f.c !== q) continue;
              const k = Math.min(1, (now - f.t0) / (f.k === 'pop' ? 0.22 : 0.18));
              sc = f.k === 'pop' ? 1 + 0.17 * Math.sin(Math.PI * k) : Math.max(0.05, 1 - Math.pow(1 - k, 3) + 0.0) * (1 + 0.08 * Math.sin(Math.PI * k));
            }
            tile(c, v, cx(q), cy(r), sc);
          }
        }
        for (let i = effects.length - 1; i >= 0; i--) {
          if (now - effects[i].t0 > (effects[i].k === 'pop' ? 0.22 : 0.18)) effects.splice(i, 1);
        }
        dirty = effects.length > 0;
      }
      ctx.loop(() => { if (dirty || anim) render(); });

      /* старт: две тыквы */
      spawn(); spawn();
      status();

      ctx.debug = {
        grid: () => copy(grid),
        set: g => { anim = null; effects = []; grid = copy(g); hist = []; stuck = false; dirty = true; status(); afterMove(); },
        move: d => move(d),
        undo,
        st: () => ({ max: maxOf(grid), undoLeft, undoUsed, moves, score, won, stuck }),
        slide, canMove
      };
    }
  });
})();
