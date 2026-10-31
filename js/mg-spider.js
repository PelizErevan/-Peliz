/* =========================================================
   Паучья роща: распутай паутину (как головоломка Planarity).
   Узлы паутины (капли росы и мухи в коконах) соединены нитями. Перетаскивай узлы так,
   чтобы ни одна нить не пересекала другую. Красные дрожащие нити — те, что ещё пересекаются.
   Раскладка всегда решаема: сначала строим плоский граф, потом раскидываем узлы по кругу.
   ========================================================= */
(function () {
  'use strict';

  const CW = 300, CH = 440;                    // «чертёжный» размер поля для генерации
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const side = (a, b, c) => (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
  /* пересекаются ли отрезки ab и cd (общие концы не считаем) */
  function segCross(a, b, c, d) {
    const d1 = side(a, b, c), d2 = side(a, b, d), d3 = side(c, d, a), d4 = side(c, d, b);
    return d1 * d2 < 0 && d3 * d4 < 0;
  }
  function distSeg(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    let t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }
  function countCross(P, edges) {
    let n = 0;
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const [a, b] = edges[i], [c, d] = edges[j];
        if (a === c || a === d || b === c || b === d) continue;
        if (segCross(P[a], P[b], P[c], P[d])) n++;
      }
    }
    return n;
  }

  /* ---------- генерация ---------- */
  function gen(N, E, minC) {
    const rnd = Math.random;
    let D = N <= 8 ? 98 : N <= 10 ? 84 : 72;
    for (let outer = 0; outer < 500; outer++) {
      if (outer && outer % 50 === 0) D -= 4;
      const pts = [];
      let guard = 0;
      while (pts.length < N && guard++ < 2500) {
        const p = { x: 30 + rnd() * (CW - 60), y: 30 + rnd() * (CH - 60) };
        if (pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) >= D)) pts.push(p);
      }
      if (pts.length < N) continue;
      const pairs = [];
      for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) pairs.push([a, b, Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y)]);
      pairs.sort((p, q) => p[2] - q[2]);
      const edges = [];
      const comp = pts.map((_, i) => i);
      const find = x => (comp[x] === x ? x : (comp[x] = find(comp[x])));
      const okEdge = (a, b) => {
        for (const [c, d] of edges) {
          if (c === a || c === b || d === a || d === b) continue;
          if (segCross(pts[a], pts[b], pts[c], pts[d])) return false;
        }
        for (let k = 0; k < N; k++) if (k !== a && k !== b && distSeg(pts[k], pts[a], pts[b]) < 32) return false;
        return true;
      };
      for (const [a, b] of pairs) {
        if (find(a) !== find(b) && okEdge(a, b)) { edges.push([a, b]); comp[find(a)] = find(b); }
      }
      let conn = true;
      for (let i = 1; i < N; i++) if (find(i) !== find(0)) conn = false;
      if (!conn) continue;
      for (const [a, b] of pairs) {
        if (edges.length >= E) break;
        if (edges.some(([c, d]) => (c === a && d === b) || (c === b && d === a))) continue;
        if (okEdge(a, b)) edges.push([a, b]);
      }
      if (edges.length < Math.max(N + 1, E - 2)) continue;
      /* раскладка по эллипсу в случайном порядке: пересечений должно быть не меньше minC,
         но и не гора: берём вариант, ближайший к цели (≈1.6·minC) */
      let best = null, bestC = -1, bestGap = 1e9;
      const target = Math.round(minC * 1.6);
      const ord = pts.map((_, i) => i);
      for (let t = 0; t < 700; t++) {
        G.shuffle(ord);
        const st = new Array(N);
        for (let k = 0; k < N; k++) {
          const a = -Math.PI / 2 + (2 * Math.PI * k) / N;
          st[ord[k]] = { x: CW / 2 + (CW / 2 - 36) * Math.cos(a), y: CH / 2 + (CH / 2 - 36) * Math.sin(a) };
        }
        const c = countCross(st, edges);
        if (c < minC) continue;
        const gap = Math.abs(c - target);
        if (gap < bestGap) { bestGap = gap; bestC = c; best = st; }
        if (gap <= 1) break;
      }
      if (!best) continue;
      return { edges, sol: pts, start: best, c0: bestC };
    }
    throw new Error('spider: не удалось построить паутину');
  }

  /* ---------- спрайты ---------- */
  const dropSprite = R => G.mg.sprite('spd', 2 * R + 10, 2 * R + 10, (c, w) => {
    const cx = w / 2, cy = w / 2;
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.beginPath(); c.ellipse(cx + 1, cy + R * 0.2 + 2, R * 0.95, R * 0.88, 0, 0, 7); c.fill();
    const g = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, '#f4ffff'); g.addColorStop(0.42, '#9be8ff'); g.addColorStop(1, '#2c86c4');
    c.fillStyle = g;
    c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    c.lineWidth = 2; c.strokeStyle = 'rgba(215,248,255,.9)'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.88)';
    c.beginPath(); c.ellipse(cx - R * 0.38, cy - R * 0.42, R * 0.25, R * 0.14, -0.7, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)';
    c.beginPath(); c.ellipse(cx + R * 0.15, cy + R * 0.52, R * 0.46, R * 0.2, 0.3, 0, 7); c.fill();
  });
  const cocoonSprite = R => G.mg.sprite('spc', 2 * R + 10, 2 * R + 10, (c, w) => {
    const cx = w / 2, cy = w / 2;
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.beginPath(); c.ellipse(cx + 1, cy + R * 0.2 + 2, R * 0.85, R * 0.92, -0.5, 0, 7); c.fill();
    c.save(); c.translate(cx, cy); c.rotate(-0.5);
    const g = c.createLinearGradient(-R, 0, R, 0);
    g.addColorStop(0, '#fffaf0'); g.addColorStop(0.55, '#ece4d2'); g.addColorStop(1, '#bdb29a');
    c.fillStyle = g; c.strokeStyle = '#8a7f66'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 0, R * 0.8, R, 0, 0, 7); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(110,100,80,.55)'; c.lineWidth = 1.3;
    for (let k = -2; k <= 2; k++) {
      const yy = k * R * 0.36, rr = R * 0.8 * Math.sqrt(Math.max(0.02, 1 - (yy / R) * (yy / R)));
      c.beginPath(); c.ellipse(0, yy, rr, R * 0.16, 0, 0.1, Math.PI - 0.1); c.stroke();
    }
    c.strokeStyle = '#2a1f35'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-R * 0.2, -R * 0.96); c.lineTo(-R * 0.35, -R * 1.08); c.moveTo(R * 0.15, -R * 0.97); c.lineTo(R * 0.3, -R * 1.1); c.stroke();
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.6)';
    c.beginPath(); c.ellipse(cx - R * 0.42, cy - R * 0.38, R * 0.12, R * 0.22, 0.6, 0, 7); c.fill();
  });
  const spiderSprite = R => G.mg.sprite('sps', Math.round(R * 3.4), Math.round(R * 3.4), (c, w) => {
    const cx = w / 2, cy = w / 2, u = R * 0.92;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#150a22'; c.lineWidth = Math.max(2, u * 0.16);
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const yo = (i - 1.5) * u * 0.34;
        c.beginPath();
        c.moveTo(cx + sd * u * 0.3, cy + yo * 0.5);
        c.quadraticCurveTo(cx + sd * u * (1.0 + (i === 1 || i === 2 ? 0.2 : 0)), cy + yo * 1.3 - u * 0.7, cx + sd * u * (1.45 - Math.abs(i - 1.5) * 0.12), cy + yo * 1.9 + u * 0.35);
        c.stroke();
      }
    }
    const ag = c.createRadialGradient(cx - u * 0.15, cy + u * 0.1, 1, cx, cy + u * 0.25, u * 0.62);
    ag.addColorStop(0, '#5a3a86'); ag.addColorStop(1, '#1a0d2c');
    c.fillStyle = ag; c.strokeStyle = '#0c0614'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(cx, cy + u * 0.26, u * 0.44, u * 0.52, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#e8283c';
    c.beginPath(); c.moveTo(cx - u * 0.12, cy + u * 0.12); c.lineTo(cx + u * 0.12, cy + u * 0.12); c.lineTo(cx, cy + u * 0.28); c.lineTo(cx + u * 0.12, cy + u * 0.44); c.lineTo(cx - u * 0.12, cy + u * 0.44); c.lineTo(cx, cy + u * 0.28); c.closePath(); c.fill();
    c.fillStyle = '#2a1646'; c.strokeStyle = '#0c0614';
    c.beginPath(); c.arc(cx, cy - u * 0.3, u * 0.3, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(cx - u * 0.12, cy - u * 0.34, u * 0.1, 0, 7); c.arc(cx + u * 0.12, cy - u * 0.34, u * 0.1, 0, 7); c.fill();
    c.fillStyle = '#150a22';
    c.beginPath(); c.arc(cx - u * 0.11, cy - u * 0.33, u * 0.045, 0, 7); c.arc(cx + u * 0.13, cy - u * 0.33, u * 0.045, 0, 7); c.fill();
  });

  G.mg.register({
    id: 'spider',
    _gen: gen,                      // для автотестов
    title: 'Паучья роща',
    icon: '🕷',
    intro: 'Паутина спуталась! Перетаскивай узлы пальцем, пока ни одна нить не будет пересекать другую.',
    quest: 'Распутай паутину: расставь узлы так, чтобы нити не пересекались 🕷',
    doneTitle: 'Паутина распутана!',
    doneIcon: '🕷',
    doneText: 'Паук расправил нити и благодарно кивнул восемью лапами. Следующая остановка: <b class="hl">Туманный лабиринт</b>.',
    levels: [
      { label: '6 узлов', n: 6, e: 8, minC: 2, task: 'Перетаскивай узлы паутины, чтобы нити не пересекались. Красные нити ещё пересекаются. Узлов: <b>6</b>.' },
      { label: '8 узлов', n: 8, e: 12, minC: 4, task: 'Паутина покрупнее: <b>8 узлов</b>. Подумай, какой узел можно вынести наружу.' },
      { label: '10 узлов', n: 10, e: 15, minC: 6, task: 'Ещё хитрее: <b>10 узлов</b>. Распутывай по одному узлу, начиная с самых запутанных.' },
      { label: '13 узлов', n: 13, e: 20, minC: 9, task: 'Самая запутанная паутина: <b>13 узлов</b>. Паук верит в тебя!' }
    ],

    start(ctx, L, cfg) {
      const N = cfg.n;
      const g = gen(N, cfg.e, cfg.minC);
      const edges = g.edges, sol = g.sol, c0 = g.c0;
      const pos = g.start.map(p => ({ u: p.x / CW, v: p.y / CH }));
      const kind = pos.map((_, i) => ((i * 7 + L) % 5 < 3 ? 0 : 1));
      const deg = new Array(N).fill(0);
      edges.forEach(([a, b]) => { deg[a]++; deg[b]++; });
      let spiderAt = 0;
      deg.forEach((d, i) => { if (d > deg[spiderAt]) spiderAt = i; });

      const view = ctx.canvas(1.5);
      let W = 300, H = 440, R = 18, pad = 30, dirty = true, won = false, drags = 0, confl = c0;
      let drag = null, spD, spC, spS, SZ = 46, SS = 61, lastT = -1;
      const bad = new Array(edges.length).fill(false);
      const X = u => pad + u * (W - 2 * pad), Y = v => pad + v * (H - 2 * pad);
      const U = x => (x - pad) / (W - 2 * pad), V = y => (y - pad) / (H - 2 * pad);
      const P = pos.map(() => ({ x: 0, y: 0 }));
      const refreshP = () => { for (let i = 0; i < N; i++) { P[i].x = X(pos[i].u); P[i].y = Y(pos[i].v); } };

      /* фон: четыре уголка паутины в статичном SVG (не перерисовывается каждый кадр) */
      const bgEl = G.el('div', 'sp-bg');
      ctx.box.insertBefore(bgEl, ctx.box.firstChild);
      function drawBg() {
        const web = (ox, oy, sx, sy, rad) => {
          const spokes = 6;
          let d = '';
          for (let i = 0; i <= spokes; i++) {
            const a = (i / spokes) * Math.PI / 2;
            d += 'M' + ox + ' ' + oy + 'L' + (ox + sx * Math.cos(a) * rad).toFixed(1) + ' ' + (oy + sy * Math.sin(a) * rad).toFixed(1);
          }
          for (let r = 1; r <= 5; r++) {
            const rr = rad * r / 5;
            for (let i = 0; i <= spokes; i++) {
              const a = (i / spokes) * Math.PI / 2;
              const px = ox + sx * Math.cos(a) * rr, py = oy + sy * Math.sin(a) * rr;
              if (i === 0) d += 'M' + px.toFixed(1) + ' ' + py.toFixed(1);
              else {
                const a0 = ((i - 0.5) / spokes) * Math.PI / 2, k = rr * 0.9;
                d += 'Q' + (ox + sx * Math.cos(a0) * k).toFixed(1) + ' ' + (oy + sy * Math.sin(a0) * k).toFixed(1) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1);
              }
            }
          }
          return d;
        };
        const big = Math.min(W, H) * 0.62;
        const d = web(0, 0, 1, 1, big) + web(W, 0, -1, 1, big * 0.8) + web(0, H, 1, -1, big * 0.7) + web(W, H, -1, -1, big * 0.9);
        bgEl.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="rgba(200,190,255,.17)" stroke-width="1.2" stroke-linecap="round"/></svg>';
      }

      ctx.onResize((w, h) => {
        W = w; H = h;
        R = clamp(Math.round(Math.min(w, h) * 0.056), 17, 22);
        pad = R + 12;
        spD = dropSprite(R); spC = cocoonSprite(R); spS = spiderSprite(R);
        SZ = 2 * R + 10; SS = Math.round(R * 3.4);
        drawBg();
        refreshP();
        recount(true);
        dirty = true;
      });

      function recount(silent) {
        refreshP();
        bad.fill(false);
        let n = 0;
        for (let i = 0; i < edges.length; i++) {
          const [a, b] = edges[i];
          for (let j = i + 1; j < edges.length; j++) {
            const [c, d] = edges[j];
            if (a === c || a === d || b === c || b === d) continue;
            if (segCross(P[a], P[b], P[c], P[d])) { bad[i] = bad[j] = true; n++; }
          }
          for (let k = 0; k < N; k++) {
            if (k === a || k === b) continue;
            if (distSeg(P[k], P[a], P[b]) < R * 0.85) { bad[i] = true; n++; }
          }
        }
        confl = n;
        ctx.chip('cr', '✂', n, !silent);
        ctx.goal(Math.max(0, c0 - n), c0, n ? 'Пересечений: ' + n : 'Паутина распутана!');
      }
      ctx.chip('dr', '✋', 0);
      recount(true);

      /* ----- ввод ----- */
      ctx.listen(ctx.box, 'pointerdown', e => {
        if (ctx.over || ctx.paused || won || drag) return;
        const r = ctx.rel(e);
        let best = -1, bd = 1e9;
        for (let i = 0; i < N; i++) {
          const d = Math.hypot(P[i].x - r.x, P[i].y - r.y);
          if (d < bd) { bd = d; best = i; }
        }
        if (best < 0 || bd > R + 16) return;
        e.preventDefault();
        try { ctx.box.setPointerCapture(e.pointerId); } catch (_) { /* не страшно */ }
        drag = { i: best, id: e.pointerId, dx: P[best].x - r.x, dy: P[best].y - r.y, sx: P[best].x, sy: P[best].y, moved: false };
        G.sfx('pick');
        dirty = true;
      });
      ctx.listen(ctx.box, 'pointermove', e => {
        if (!drag || e.pointerId !== drag.id || ctx.over || ctx.paused) return;
        const r = ctx.rel(e);
        let x = clamp(r.x + drag.dx, pad, W - pad), y = clamp(r.y + drag.dy, pad, H - pad);
        const m = R * 2.15;
        for (let k = 0; k < N; k++) {
          if (k === drag.i) continue;
          let ddx = x - P[k].x, ddy = y - P[k].y;
          const d = Math.hypot(ddx, ddy);
          if (d < m) {
            if (d < 0.001) { ddx = 1; ddy = 0; } else { ddx /= d; ddy /= d; }
            x = P[k].x + ddx * m; y = P[k].y + ddy * m;
          }
        }
        x = clamp(x, pad, W - pad); y = clamp(y, pad, H - pad);
        pos[drag.i].u = U(x); pos[drag.i].v = V(y);
        if (Math.hypot(x - drag.sx, y - drag.sy) > 8) drag.moved = true;
        recount();
        dirty = true;
      });
      function release(e) {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        const d = drag; drag = null;
        try { ctx.box.releasePointerCapture(d.id); } catch (_) { /* уже отпущен */ }
        if (d.moved) { drags++; ctx.chip('dr', '✋', drags, true); G.sfx('swap'); }
        dirty = true;
        if (!confl && !won && !ctx.over) {
          won = true;
          G.sfx('found');
          const r = ctx.box.getBoundingClientRect();
          for (let k = 0; k < N; k += Math.max(1, Math.floor(N / 4))) G.burst(r.left + P[k].x, r.top + P[k].y, ['✨'], 3, 50);
          const stars = drags <= Math.ceil(N * 1.2) ? 3 : drags <= N * 2 ? 2 : 1;
          ctx.after(650, () => ctx.win({ stars, score: drags, text: 'Перетаскиваний: <b class="hl">' + drags + '</b>' }));
        }
      }
      ctx.listen(ctx.box, 'pointerup', release);
      ctx.listen(ctx.box, 'pointercancel', release);
      ctx.listen(ctx.box, 'lostpointercapture', release);

      /* ----- кадр ----- */
      function render(t) {
        const c = view.begin();
        c.lineCap = 'round';
        const drawEdges = (list, off) => {
          c.beginPath();
          for (let k = 0; k < list.length; k++) {
            const [a, b] = edges[list[k]];
            c.moveTo(P[a].x + off, P[a].y - off * 0.6); c.lineTo(P[b].x + off, P[b].y - off * 0.6);
          }
          c.stroke();
        };
        const okE = [], badE = [], hot = [];
        for (let i = 0; i < edges.length; i++) {
          (bad[i] ? badE : okE).push(i);
          if (drag && (edges[i][0] === drag.i || edges[i][1] === drag.i)) hot.push(i);
        }
        if (hot.length) { c.lineWidth = 11; c.strokeStyle = 'rgba(255,190,90,.3)'; drawEdges(hot, 0); }
        c.lineWidth = 7; c.strokeStyle = won ? 'rgba(255,224,122,.35)' : 'rgba(150,130,255,.22)'; drawEdges(okE, 0);
        c.lineWidth = 2.3; c.strokeStyle = won ? '#ffe07a' : '#e6deff'; drawEdges(okE, 0);
        if (badE.length) {
          const j = Math.sin(t * 46) * 1.5;
          c.lineWidth = 8; c.strokeStyle = 'rgba(255,60,40,.3)'; drawEdges(badE, j);
          c.lineWidth = 2.7; c.strokeStyle = '#ff5a3c'; drawEdges(badE, j);
        }
        for (let i = 0; i < N; i++) {
          if (drag && drag.i === i) {
            c.fillStyle = 'rgba(255,179,71,.3)';
            c.beginPath(); c.arc(P[i].x, P[i].y, R + 9, 0, 7); c.fill();
          }
          c.drawImage(kind[i] ? spC : spD, P[i].x - SZ / 2, P[i].y - SZ / 2, SZ, SZ);
        }
        c.drawImage(spS, P[spiderAt].x - SS / 2, P[spiderAt].y - SS / 2 - R * 0.35, SS, SS);
      }
      ctx.loop((dt, t) => {
        if (!dirty) {
          if (!confl || t - lastT < 0.032) return;   // дрожь красных нитей: 30 кадров/с
        }
        dirty = false; lastT = t;
        render(t);
      });

      ctx.debug = {
        nodes: () => P.map(p => ({ x: p.x, y: p.y })),
        solution: () => sol.map(p => ({ x: X(p.x / CW), y: Y(p.y / CH) })),
        edges: () => edges.map(e => e.slice()),
        crossings: () => confl,
        st: () => ({ drags, confl, won, R, W, H, n: N, e: edges.length, c0, spider: spiderAt }),
        countCross, segCross,
        draw: () => { render(ctx.time); }
      };
    }
  });
})();
