/* =========================================================
   Гробовщик: сокобан на ночном кладбище.
   Гробовщик умеет только толкать гробы (тянуть нельзя), по одному, не через стены и другие гробы.
   Нужно, чтобы все гробы встали на могилы. Стены: надгробия и кладбищенская ограда (рисуются кодом, см. art.js).
   Управление: свайп по полю = шаг; если не отпускать палец, гробовщик идёт дальше. Смена направления: ведём палец
   в другую сторону. На ПК: стрелки или WASD, Z / Backspace = шаг назад. Шагов назад можно делать сколько угодно.
   Карты проверены точным перебором: par — наименьшее число шагов, sol — одно из кратчайших решений
   (U вверх, R вправо, D вниз, L влево). Звёзды: шагов ≤ 1,3·par — 3★, ≤ 1,8·par — 2★, иначе 1★.
   ========================================================= */
(function () {
  'use strict';
  const A = G.art;

  /* # стена, пробел пол, . могила, $ гроб, @ гробовщик, * гроб на могиле, + гробовщик на могиле */
  const MAPS = [
    { rows: ['######', '#    #', '# $  #', '## .##', '#. $@#', '######'], par: 13, sol: 'LLURUULLDRURD' },
    { rows: ['#######', '## . .#', '##$  .#', '# $   #', '#@$   #', '####  #', '#######'], par: 31, sol: 'RLURDRRDRUUULULLDDLDRRUUDDRDRUU' },
    { rows: ['########', '####   #', '#   #$.#', '#   .$@#', '#  #$# #', '#. #   #', '########'], par: 53, sol: 'LLLLRRRRDDLLUDRRUULLRRUULDRDDDLLUURLLULLDDURRRDDRRUUL' },
    { rows: ['########', '#   .###', '# # $@##', '#    $ #', '# .# # #', '#.$# $ #', '#  #  .#', '########'], par: 56, sol: 'LDLUDLDLDDRULUUUURRDRDDDDRRUUULLDDRLUULLRUULLDDDURRRRRDD' },
    { rows: ['#########', '#       #', '# $  $ ##', '##@#.#  #', '#.$ $  ##', '# ..#$ ##', '# .#    #', '#########'], par: 57, sol: 'DLDRURRUUURRDDDLLLLRRUUULLDDDDURRRRDDLURULLLRRRUULULDLLDD' }
  ];

  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];     // 0 вверх, 1 вправо, 2 вниз, 3 влево
  const STEP = 0.11, UNDO = 0.08, BUMP = 0.1;       // длительности движений, секунд
  const SWIPE = 24, LEASH = 12;                     // порог свайпа и «поводок», px
  const FIRST = 0.3, AGAIN = 0.13;                  // задержка до повтора шага и период повторов, секунд
  const TAU = Math.PI * 2;
  const INK = 'rgba(22, 14, 44, .92)';
  const SPR_OF = [2, 1, 0, 3];                      // направление взгляда → вид спрайта (вверх: спиной, вниз: лицом)
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
  }

  /* транспонирование карты: клетка (x, y) переходит в (y, x) */
  function transpose(rows) {
    const W = Math.max.apply(null, rows.map(r => r.length)), out = [];
    for (let x = 0; x < W; x++) out.push(rows.map(r => (r[x] === undefined ? '#' : r[x])).join(''));
    return out;
  }

  /* ---------- разбор карты ---------- */
  function parse(m) {
    const rows = m.rows, H = rows.length;
    let W = 0;
    rows.forEach(r => { W = Math.max(W, r.length); });
    const wall = new Uint8Array(W * H), goal = new Uint8Array(W * H), boxes = [];
    let player = { x: 1, y: 1 };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ch = rows[y][x] === undefined ? '#' : rows[y][x];
        const i = y * W + x;
        if (ch === '#') wall[i] = 1;
        if (ch === '.' || ch === '*' || ch === '+') goal[i] = 1;
        if (ch === '$' || ch === '*') boxes.push({ x, y });
        if (ch === '@' || ch === '+') player = { x, y };
      }
    }
    /* клетки, куда гробовщик может дойти (по ним решаем, как рисовать стены) */
    const reach = new Uint8Array(W * H);
    const st = [player.y * W + player.x];
    reach[st[0]] = 1;
    while (st.length) {
      const i = st.pop(), x = i % W, y = (i / W) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d], ny = y + DY[d];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (wall[j] || reach[j]) continue;
        reach[j] = 1; st.push(j);
      }
    }
    return { W, H, wall, goal, boxes, player, reach };
  }

  /* ---------- спрайты (все клетка×клетка, один раз) ---------- */
  const spr = (name, cs, draw) => A.sprite('gv' + name, cs, cs, draw, 1.25);

  /* могила: свежая яма с кромкой земли и холмиком */
  const pitSprite = cs => spr('pit', cs, (c, w) => {
    const lw = Math.max(1.2, w * 0.04);
    c.fillStyle = 'rgba(150, 255, 200, .12)';
    c.beginPath(); c.ellipse(w * 0.5, w * 0.52, w * 0.48, w * 0.5, 0, 0, TAU); c.fill();
    const x = w * 0.2, y = w * 0.08, pw = w * 0.6, ph = w * 0.82;
    c.fillStyle = INK; rr(c, x - lw, y - lw, pw + lw * 2, ph + lw * 2, w * 0.15 + lw); c.fill();
    const eg = c.createLinearGradient(0, y, 0, y + ph);
    eg.addColorStop(0, '#94693f'); eg.addColorStop(1, '#5f402a');
    c.fillStyle = eg; rr(c, x, y, pw, ph, w * 0.14); c.fill();
    const ix = x + w * 0.07, iy = y + w * 0.08, iw = pw - w * 0.14, ih = ph - w * 0.16;
    const ig = c.createLinearGradient(0, iy, 0, iy + ih);
    ig.addColorStop(0, '#050308'); ig.addColorStop(0.7, '#1c110f'); ig.addColorStop(1, '#3a2418');
    c.fillStyle = ig; rr(c, ix, iy, iw, ih, w * 0.1); c.fill();
    c.fillStyle = 'rgba(255, 220, 170, .16)';
    c.fillRect(ix + w * 0.03, iy + ih - w * 0.035, iw - w * 0.06, Math.max(1, w * 0.02));
    /* холмик земли и пара камешков */
    const mound = (mx, my, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(mx, my, rx, ry, 0, 0, TAU); c.fill(); };
    mound(w * 0.8, w * 0.9, w * 0.15, w * 0.07, '#5a3d27');
    mound(w * 0.72, w * 0.92, w * 0.12, w * 0.06, '#6f4b30');
    mound(w * 0.78, w * 0.88, w * 0.08, w * 0.035, '#86603d');
    c.fillStyle = '#9a9aa8'; c.beginPath(); c.ellipse(w * 0.16, w * 0.9, w * 0.035, w * 0.025, 0, 0, TAU); c.fill();
  });

  /* гроб (вид сверху с небольшим боком); placed — гроб уже на могиле: золотой крест светится */
  const coffinSprite = (cs, placed) => spr(placed ? 'cofp' : 'cof', cs, (c, w) => {
    const cx = w / 2, cy = w * 0.47;
    const pts = [[-0.17, -0.4], [0.17, -0.4], [0.3, -0.17], [0.2, 0.4], [-0.2, 0.4], [-0.3, -0.17]];
    const path = (dy, k) => {
      c.beginPath();
      pts.forEach((p, i) => { const X = cx + p[0] * w * k, Y = cy + p[1] * w * k + dy; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); });
      c.closePath();
    };
    const lw = Math.max(1.3, w * 0.045);
    c.lineJoin = 'round';
    if (placed) {
      const gl = c.createRadialGradient(cx, cy, w * 0.1, cx, cy, w * 0.52);
      gl.addColorStop(0, 'rgba(255, 230, 130, .42)'); gl.addColorStop(1, 'rgba(255, 230, 130, 0)');
      c.fillStyle = gl; c.fillRect(0, 0, w, w);
    }
    c.fillStyle = 'rgba(0, 0, 0, .35)';
    c.beginPath(); c.ellipse(cx, w * 0.9, w * 0.26, w * 0.045, 0, 0, TAU); c.fill();
    /* борт */
    path(w * 0.06, 1); c.lineWidth = lw * 2; c.strokeStyle = INK; c.stroke();
    c.fillStyle = placed ? '#3a2616' : '#4a2f1b'; c.fill();
    /* крышка */
    path(0, 1); c.lineWidth = lw * 2; c.strokeStyle = INK; c.stroke();
    const g = c.createLinearGradient(cx - w * 0.3, 0, cx + w * 0.3, 0);
    g.addColorStop(0, placed ? '#b27846' : '#c0834a'); g.addColorStop(0.5, placed ? '#92613a' : '#a26b3c'); g.addColorStop(1, '#5f3c21');
    c.fillStyle = g; c.fill();
    c.save();
    path(0, 1); c.clip();
    /* прожилки дерева */
    c.lineWidth = Math.max(0.7, w * 0.012); c.strokeStyle = 'rgba(60, 30, 10, .28)';
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      for (let s = 0; s <= 8; s++) { const yy = cy - w * 0.4 + (w * 0.8) * s / 8, xx = cx + i * w * 0.075 + Math.sin(s * 0.9 + i) * w * 0.012; if (s) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
      c.stroke();
    }
    /* блик сверху и тень снизу */
    const sh = c.createLinearGradient(0, cy - w * 0.4, 0, cy + w * 0.4);
    sh.addColorStop(0, 'rgba(255, 235, 200, .25)'); sh.addColorStop(0.5, 'rgba(255, 235, 200, 0)'); sh.addColorStop(1, 'rgba(30, 10, 0, .25)');
    c.fillStyle = sh; c.fillRect(0, 0, w, w);
    c.restore();
    /* внутренняя фаска крышки */
    path(0, 0.76); c.lineWidth = Math.max(0.8, w * 0.016); c.strokeStyle = 'rgba(255, 225, 175, .3)'; c.stroke();
    /* крест */
    const gold = c.createLinearGradient(0, cy - w * 0.3, 0, cy + w * 0.05);
    gold.addColorStop(0, placed ? '#fff1b0' : '#ffe08a'); gold.addColorStop(1, '#d9962b');
    c.fillStyle = gold; c.strokeStyle = 'rgba(70, 36, 8, .85)'; c.lineWidth = Math.max(0.8, w * 0.022);
    c.beginPath(); c.rect(cx - w * 0.033, cy - w * 0.3, w * 0.066, w * 0.34); c.fill(); c.stroke();
    c.beginPath(); c.rect(cx - w * 0.1, cy - w * 0.22, w * 0.2, w * 0.06); c.fill(); c.stroke();
  });

  /* гробовщик: вид спереди (0), справа (1), сзади (2), слева (3 — зеркало правого) */
  const diggerSprite = (cs, view) => spr('dg' + view, cs, (c, w) => {
    let v = view;
    if (v === 3) { c.translate(w, 0); c.scale(-1, 1); v = 1; }
    const cx = w / 2, lw = Math.max(1.2, w * 0.04);
    const COAT = ['#7a9a5c', '#4a6638'], SKIN = ['#f6dcb8', '#cfa67c'], BAND = '#9a64f0', SCARF = '#f39a2e', BOOT = '#2b2133';
    const line = () => { c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); };
    c.lineJoin = 'round'; c.lineCap = 'round';
    const shadow = () => { c.fillStyle = 'rgba(0, 0, 0, .36)'; c.beginPath(); c.ellipse(cx, w * 0.915, w * 0.27, w * 0.05, 0, 0, TAU); c.fill(); };
    const boot = (x, y, bw) => { c.fillStyle = BOOT; rr(c, x, y, bw, w * 0.11, w * 0.04); c.fill(); line(); };
    const coat = (x0, x1, y0, y1, hem0, hem1) => {
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(hem1, y1); c.lineTo(hem0, y1); c.closePath();
      const cg = c.createLinearGradient(hem0, 0, hem1, 0); cg.addColorStop(0, COAT[0]); cg.addColorStop(1, COAT[1]);
      c.fillStyle = cg; c.fill(); line();
    };
    const shovelBlade = (x, y, ang, len, bw) => {     // лезвие лопаты: основание в (x, y), направление ang
      c.save(); c.translate(x, y); c.rotate(ang);
      c.beginPath(); c.moveTo(0, -bw / 2); c.lineTo(len * 0.55, -bw / 2); c.quadraticCurveTo(len * 1.05, -bw * 0.4, len, 0); c.quadraticCurveTo(len * 1.05, bw * 0.4, len * 0.55, bw / 2); c.lineTo(0, bw / 2); c.closePath();
      const mg = c.createLinearGradient(0, -bw / 2, 0, bw / 2); mg.addColorStop(0, '#eceff8'); mg.addColorStop(1, '#8e94ad');
      c.fillStyle = mg; c.fill(); line();
      c.restore();
    };
    const hat = (hx, hy) => {
      c.fillStyle = '#2c2346';
      c.beginPath(); c.ellipse(hx, hy, w * 0.28, w * 0.07, 0, 0, TAU); c.fill(); line();
      c.beginPath(); c.moveTo(hx - w * 0.15, hy - w * 0.01); c.lineTo(hx - w * 0.12, hy - w * 0.17); c.quadraticCurveTo(hx, hy - w * 0.23, hx + w * 0.12, hy - w * 0.17); c.lineTo(hx + w * 0.15, hy - w * 0.01); c.closePath();
      c.fillStyle = '#3a2f5c'; c.fill(); line();
      c.fillStyle = BAND; c.fillRect(hx - w * 0.145, hy - w * 0.075, w * 0.29, w * 0.045);
      c.fillStyle = '#f2c14e'; c.fillRect(hx - w * 0.03, hy - w * 0.08, w * 0.06, w * 0.055);
    };
    const head = (hx, hy) => {
      const hg = c.createRadialGradient(hx - w * 0.05, hy - w * 0.06, w * 0.02, hx, hy, w * 0.19);
      hg.addColorStop(0, SKIN[0]); hg.addColorStop(1, SKIN[1]);
      c.fillStyle = hg; c.beginPath(); c.arc(hx, hy, w * 0.17, 0, TAU); c.fill(); line();
    };
    shadow();
    if (v === 0) {
      /* спереди */
      boot(w * 0.32, w * 0.8, w * 0.16); boot(w * 0.52, w * 0.8, w * 0.16);
      /* лопата стоит справа */
      c.strokeStyle = INK; c.lineWidth = w * 0.06; c.beginPath(); c.moveTo(w * 0.87, w * 0.3); c.lineTo(w * 0.87, w * 0.8); c.stroke();
      c.strokeStyle = '#a8743f'; c.lineWidth = w * 0.032; c.beginPath(); c.moveTo(w * 0.87, w * 0.3); c.lineTo(w * 0.87, w * 0.8); c.stroke();
      c.strokeStyle = INK; c.lineWidth = w * 0.055; c.beginPath(); c.moveTo(w * 0.82, w * 0.3); c.lineTo(w * 0.92, w * 0.3); c.stroke();
      c.strokeStyle = '#a8743f'; c.lineWidth = w * 0.03; c.beginPath(); c.moveTo(w * 0.82, w * 0.3); c.lineTo(w * 0.92, w * 0.3); c.stroke();
      shovelBlade(w * 0.87, w * 0.76, Math.PI / 2, w * 0.17, w * 0.15);
      coat(w * 0.31, w * 0.69, w * 0.49, w * 0.84, w * 0.24, w * 0.76);
      c.strokeStyle = 'rgba(20, 30, 15, .45)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(cx, w * 0.6); c.lineTo(cx, w * 0.84); c.stroke();
      c.fillStyle = '#35271a'; c.fillRect(w * 0.29, w * 0.67, w * 0.42, w * 0.05);
      c.fillStyle = '#f2c14e'; c.fillRect(cx - w * 0.035, w * 0.665, w * 0.07, w * 0.06);
      /* руки */
      c.fillStyle = COAT[1];
      c.beginPath(); c.ellipse(w * 0.255, w * 0.62, w * 0.06, w * 0.13, 0.12, 0, TAU); c.fill(); line();
      c.beginPath(); c.ellipse(w * 0.765, w * 0.61, w * 0.06, w * 0.13, -0.3, 0, TAU); c.fill(); line();
      c.fillStyle = SKIN[0]; c.beginPath(); c.arc(w * 0.245, w * 0.74, w * 0.05, 0, TAU); c.fill(); line();
      c.beginPath(); c.arc(w * 0.82, w * 0.7, w * 0.05, 0, TAU); c.fill(); line();
      /* шарф, голова, шляпа */
      c.fillStyle = SCARF; rr(c, cx - w * 0.17, w * 0.46, w * 0.34, w * 0.085, w * 0.04); c.fill(); line();
      c.fillStyle = '#d97a1c'; rr(c, cx + w * 0.06, w * 0.52, w * 0.075, w * 0.15, w * 0.03); c.fill(); line();
      head(cx, w * 0.36);
      c.fillStyle = '#251a35';
      c.beginPath(); c.ellipse(cx - w * 0.07, w * 0.375, w * 0.024, w * 0.036, 0, 0, TAU); c.ellipse(cx + w * 0.07, w * 0.375, w * 0.024, w * 0.036, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(cx - w * 0.062, w * 0.362, w * 0.009, 0, TAU); c.arc(cx + w * 0.078, w * 0.362, w * 0.009, 0, TAU); c.fill();
      c.fillStyle = '#e0987a'; c.beginPath(); c.arc(cx, w * 0.415, w * 0.026, 0, TAU); c.fill();
      c.fillStyle = 'rgba(240, 120, 120, .3)'; c.beginPath(); c.arc(cx - w * 0.115, w * 0.42, w * 0.032, 0, TAU); c.arc(cx + w * 0.115, w * 0.42, w * 0.032, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(70, 30, 30, .7)'; c.lineWidth = Math.max(1, w * 0.014);
      c.beginPath(); c.arc(cx, w * 0.435, w * 0.04, 0.2, Math.PI - 0.2); c.stroke();
      hat(cx, w * 0.265);
    } else if (v === 2) {
      /* сзади: на спине лопата */
      boot(w * 0.32, w * 0.8, w * 0.16); boot(w * 0.52, w * 0.8, w * 0.16);
      coat(w * 0.31, w * 0.69, w * 0.49, w * 0.84, w * 0.24, w * 0.76);
      c.fillStyle = '#35271a'; c.fillRect(w * 0.29, w * 0.67, w * 0.42, w * 0.05);
      c.fillStyle = COAT[1];
      c.beginPath(); c.ellipse(w * 0.255, w * 0.62, w * 0.06, w * 0.13, 0.12, 0, TAU); c.fill(); line();
      c.beginPath(); c.ellipse(w * 0.745, w * 0.62, w * 0.06, w * 0.13, -0.12, 0, TAU); c.fill(); line();
      c.fillStyle = SKIN[0]; c.beginPath(); c.arc(w * 0.245, w * 0.74, w * 0.05, 0, TAU); c.arc(w * 0.755, w * 0.74, w * 0.05, 0, TAU); c.fill();
      /* лопата по диагонали */
      c.strokeStyle = INK; c.lineWidth = w * 0.06; c.beginPath(); c.moveTo(w * 0.3, w * 0.4); c.lineTo(w * 0.66, w * 0.76); c.stroke();
      c.strokeStyle = '#a8743f'; c.lineWidth = w * 0.032; c.beginPath(); c.moveTo(w * 0.3, w * 0.4); c.lineTo(w * 0.66, w * 0.76); c.stroke();
      shovelBlade(w * 0.64, w * 0.74, Math.PI / 4, w * 0.2, w * 0.15);
      c.fillStyle = SCARF; rr(c, cx - w * 0.17, w * 0.46, w * 0.34, w * 0.085, w * 0.04); c.fill(); line();
      c.fillStyle = '#5a4030'; c.beginPath(); c.arc(cx, w * 0.35, w * 0.17, 0, TAU); c.fill(); line();
      hat(cx, w * 0.265);
    } else {
      /* справа: лопата в руках, острием вперёд */
      boot(w * 0.36, w * 0.8, w * 0.17); boot(w * 0.5, w * 0.8, w * 0.19);
      coat(w * 0.33, w * 0.63, w * 0.49, w * 0.84, w * 0.29, w * 0.67);
      c.fillStyle = '#35271a'; c.fillRect(w * 0.31, w * 0.67, w * 0.34, w * 0.05);
      c.fillStyle = SCARF; rr(c, cx - w * 0.15, w * 0.46, w * 0.3, w * 0.085, w * 0.04); c.fill(); line();
      c.fillStyle = '#d97a1c'; rr(c, cx - w * 0.2, w * 0.5, w * 0.075, w * 0.15, w * 0.03); c.fill(); line();
      head(w * 0.52, w * 0.36);
      c.fillStyle = '#e0987a'; c.beginPath(); c.arc(w * 0.7, w * 0.395, w * 0.034, 0, TAU); c.fill(); line();
      c.fillStyle = '#251a35'; c.beginPath(); c.ellipse(w * 0.61, w * 0.37, w * 0.022, w * 0.036, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(w * 0.615, w * 0.358, w * 0.009, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(70, 30, 30, .7)'; c.lineWidth = Math.max(1, w * 0.014);
      c.beginPath(); c.arc(w * 0.62, w * 0.43, w * 0.03, 0.2, Math.PI - 0.5); c.stroke();
      hat(w * 0.52, w * 0.265);
      /* лопата и рука */
      c.strokeStyle = INK; c.lineWidth = w * 0.06; c.beginPath(); c.moveTo(w * 0.42, w * 0.5); c.lineTo(w * 0.8, w * 0.72); c.stroke();
      c.strokeStyle = '#a8743f'; c.lineWidth = w * 0.032; c.beginPath(); c.moveTo(w * 0.42, w * 0.5); c.lineTo(w * 0.8, w * 0.72); c.stroke();
      shovelBlade(w * 0.78, w * 0.71, 0.52, w * 0.2, w * 0.15);
      c.fillStyle = COAT[1]; c.beginPath(); c.ellipse(w * 0.55, w * 0.6, w * 0.06, w * 0.12, -0.9, 0, TAU); c.fill(); line();
      c.fillStyle = SKIN[0]; c.beginPath(); c.arc(w * 0.64, w * 0.66, w * 0.05, 0, TAU); c.fill(); line();
    }
  });

  /* ---------- земля и стены (рисуются сразу на всё поле) ---------- */
  function drawGround(sc, x, y, cs, rnd, alt) {
    sc.fillStyle = alt ? '#35493d' : '#304439';
    sc.fillRect(x, y, cs + 0.5, cs + 0.5);
    const gr = sc.createLinearGradient(x, y, x + cs, y + cs);
    gr.addColorStop(0, 'rgba(255, 255, 255, .06)'); gr.addColorStop(1, 'rgba(0, 0, 0, .1)');
    sc.fillStyle = gr; sc.fillRect(x, y, cs + 0.5, cs + 0.5);
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) A.tuft(sc, x + cs * (0.1 + rnd() * 0.8), y + cs * (0.35 + rnd() * 0.6), cs * (0.1 + rnd() * 0.06), rnd, 3);
    if (rnd() > 0.72) {
      sc.fillStyle = 'rgba(190, 200, 210, .3)';
      sc.beginPath(); sc.ellipse(x + cs * (0.15 + rnd() * 0.7), y + cs * (0.2 + rnd() * 0.7), cs * 0.05, cs * 0.035, 0, 0, TAU); sc.fill();
    }
    if (rnd() > 0.92) {
      const fx = x + cs * (0.2 + rnd() * 0.6), fy = y + cs * (0.3 + rnd() * 0.5);
      sc.fillStyle = rnd() > 0.5 ? '#f4e9ff' : '#ffd98a';
      for (let k = 0; k < 5; k++) { sc.beginPath(); sc.arc(fx + Math.cos(k * 1.26) * cs * 0.03, fy + Math.sin(k * 1.26) * cs * 0.03, cs * 0.018, 0, TAU); sc.fill(); }
      sc.fillStyle = '#e8a33a'; sc.beginPath(); sc.arc(fx, fy, cs * 0.014, 0, TAU); sc.fill();
    }
  }
  function drawHedge(sc, x, y, cs, rnd) {
    sc.fillStyle = '#16231d'; sc.fillRect(x, y, cs + 0.5, cs + 0.5);
    for (let i = 0; i < 4; i++) {
      sc.fillStyle = rnd() > 0.5 ? 'rgba(36, 66, 48, .75)' : 'rgba(10, 20, 14, .7)';
      sc.beginPath(); sc.arc(x + cs * (0.15 + rnd() * 0.7), y + cs * (0.15 + rnd() * 0.7), cs * (0.16 + rnd() * 0.14), 0, TAU); sc.fill();
    }
  }

  G.mg.register({
    id: 'grave',
    title: 'Гробовщик',
    icon: '⚰️',
    intro: 'Гробовщик не любит беспорядок: каждому гробу нужна своя могила. Гробы можно только толкать, и только по одному. Не загони гроб в угол!',
    quest: 'Расставь гробы по могилам: гробы можно только толкать ⚰️',
    doneTitle: 'Все упокоены!',
    doneIcon: '⚰️',
    doneText: 'Каждый гроб лёг в свою могилу, и на кладбище снова тихо. Следующая остановка: <b class="hl">Дом сладостей</b>.',
    lowerBetter: true,
    levels: [
      { label: '6×6', map: 0, task: 'Гробовщик может только <b>толкать</b> гробы ⚰️, тянуть нельзя. Поставь оба гроба на <b>могилы</b>. Свайп — шаг, держи палец — иди дальше.' },
      { label: '7×7', map: 1, task: '<b>Три гроба</b>. Не загоняй гроб в угол: оттуда его уже не достать. «↩ Шаг назад» можно нажимать сколько угодно.' },
      { label: '8×7', map: 2, task: 'Тесный двор: <b>3 гроба</b> и много надгробий. Сначала подумай, какой гроб на какую могилу.' },
      { label: '8×8', map: 3, task: '<b>4 гроба</b>, и порядок важен. Иногда гроб нужно сперва отодвинуть, чтобы пройти дальше.' },
      { label: '9×8', map: 4, task: 'Главное кладбище: <b>5 гробов</b>. Не торопись, шаг назад всегда под рукой.' }
    ],

    start(ctx, L, cfg) {
      let m = MAPS[cfg.map];
      /* широкую карту на узком вертикальном экране поворачиваем (транспонируем): клетки получаются крупнее.
         Головоломка от этого не меняется. Решаем один раз при старте, дальше поле только масштабируется. */
      const box0 = ctx.size();
      const wide = Math.max.apply(null, m.rows.map(r => r.length)) > m.rows.length;
      const turned = wide && box0.h > box0.w * 1.1;
      if (turned) m = { par: m.par, sol: m.sol, rows: transpose(m.rows) };
      const g = parse(m);
      const W = g.W, H = g.H, N = g.boxes.length, par = m.par;
      const wall = g.wall, goal = g.goal;
      const pl = { x: g.player.x, y: g.player.y, vx: g.player.x, vy: g.player.y };
      const boxes = g.boxes.map(b => ({ x: b.x, y: b.y, vx: b.x, vy: b.y, pulse: 0 }));
      const hist = [];                    // сделанные шаги: { d, bi } (bi — какой гроб толкнули или -1)
      let face = 2, anim = null, won = false, moves = 0, dirty = true, statDirty = true;
      const queue = [];
      const warned = new Set();

      /* холст только под поле */
      const cv = document.createElement('canvas');
      cv.className = 'mg-cv';
      ctx.box.appendChild(cv);
      const view = { cv, c: cv.getContext('2d'), dpr: 1 };
      let cs = 40, ox = 0, oy = 0, bw = 0, bh = 0;
      view.fit = () => {
        const d = Math.min(1.25, window.devicePixelRatio || 1);
        const pw = Math.max(1, Math.round(bw * d)), ph = Math.max(1, Math.round(bh * d));
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
        cv.style.left = ox + 'px'; cv.style.top = oy + 'px';
        cv.style.width = bw + 'px'; cv.style.height = bh + 'px';
        view.dpr = pw / bw;
      };
      view.begin = () => {
        const c = view.c;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, cv.width, cv.height);
        c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
        return c;
      };
      const bar = G.el('div', 'gv-bar');
      bar.innerHTML = '<button class="btn btn-small" type="button" data-r="undo">↩ Шаг назад</button>';
      ctx.box.appendChild(bar);
      const undoBtn = G.$('[data-r="undo"]', bar);
      ctx.onResize((w, h) => {
        const area = h - 56;
        cs = clamp(Math.floor(Math.min((w - 10) / W, (area - 4) / H)), 24, 76);
        bw = cs * W; bh = cs * H;
        ox = Math.round((w - bw) / 2);
        oy = Math.max(2, Math.round((area - bh) / 2) + 2);
        view.fit();
        statDirty = true; dirty = true;
      });

      const at = (x, y) => x < 0 || y < 0 || x >= W || y >= H || wall[y * W + x] === 1;
      const boxAt = (x, y) => boxes.findIndex(b => b.x === x && b.y === y);
      const onGoal = b => goal[b.y * W + b.x] === 1;
      const placed = () => boxes.reduce((a, b) => a + (onGoal(b) ? 1 : 0), 0);
      const cellC = (x, y) => ({ x: ox + (x + 0.5) * cs, y: oy + (y + 0.5) * cs });

      /* ---- счётчики ---- */
      ctx.chip('mv', '👣', 0);
      ctx.chip('par', '🎯', par);
      const upd = bump => {
        const p = placed();
        ctx.goal(p, N, 'Гробов на месте: ' + p + ' из ' + N);
        ctx.chip('mv', '👣', moves, bump);
        undoBtn.disabled = hist.length === 0;
      };
      upd();

      /* ---- ход ---- */
      function startAnim(dur, kind, d) {
        const items = [];
        const add = o => { if (o.vx !== o.x || o.vy !== o.y) items.push({ o, x0: o.vx, y0: o.vy, x1: o.x, y1: o.y }); };
        add(pl); boxes.forEach(add);
        anim = { t: 0, dur, items, kind: kind || 'move', d, bi: -1 };
        return anim;
      }
      function perform(d, repeated) {
        face = d;
        const nx = pl.x + DX[d], ny = pl.y + DY[d];
        let bi = -1;
        let blocked = at(nx, ny);
        if (!blocked) {
          bi = boxAt(nx, ny);
          if (bi >= 0) {
            const bx = nx + DX[d], by = ny + DY[d];
            if (at(bx, by) || boxAt(bx, by) >= 0) blocked = true;
          }
        }
        if (blocked) {
          if (repeated) return;
          anim = { t: 0, dur: BUMP, items: [], kind: 'bump', d, bi: -1 };
          G.sfx('tick');
          dirty = true;
          return;
        }
        pl.x = nx; pl.y = ny;
        if (bi >= 0) { boxes[bi].x += DX[d]; boxes[bi].y += DY[d]; }
        hist.push({ d, bi });
        moves = hist.length;
        const a = startAnim(STEP, 'move', d);
        a.bi = bi;
        if (bi >= 0) G.sfx('thud');
        upd(true);
        dirty = true;
      }
      function request(d, repeated) {
        if (ctx.over || ctx.paused || won) return;
        if (anim) { if (queue.length < (repeated ? 1 : 2)) queue.push(d); return; }
        perform(d, repeated);
      }
      function undo() {
        if (ctx.over || ctx.paused || won) return;
        if (!hist.length) { ctx.say('Дальше назад некуда: это начало', 1600); return; }
        queue.length = 0;
        const h = hist.pop();
        pl.x -= DX[h.d]; pl.y -= DY[h.d];
        if (h.bi >= 0) { boxes[h.bi].x -= DX[h.d]; boxes[h.bi].y -= DY[h.d]; }
        moves = hist.length;
        face = h.d;
        startAnim(UNDO, 'undo', h.d);
        G.sfx('swap');
        upd(true);
        dirty = true;
      }
      /* угол без могилы: гроб уже не вытащить */
      function stuck(b) {
        if (onGoal(b)) return false;
        const v = at(b.x, b.y - 1) || at(b.x, b.y + 1), hz = at(b.x - 1, b.y) || at(b.x + 1, b.y);
        return v && hz;
      }
      function finishAnim() {
        const a = anim;
        anim = null;
        a.items.forEach(it => { it.o.vx = it.x1; it.o.vy = it.y1; });
        pl.vx = pl.x; pl.vy = pl.y;
        if (a.kind === 'move' && a.bi >= 0) {
          const b = boxes[a.bi];
          if (onGoal(b)) {
            b.pulse = 1;
            G.sfx('good');
            const p = cellC(b.x, b.y);
            ctx.burst(p.x, p.y, ['✨'], 5, 70);
          } else if (stuck(b)) {
            const key = b.x + ',' + b.y;
            if (!warned.has(key)) { warned.add(key); ctx.say('Гроб застрял в углу! Нажми «↩ Шаг назад»', 2600); }
          }
        }
        if (!won && placed() === N) {
          won = true;
          queue.length = 0; held = -1;
          G.sfx('found');
          boxes.forEach(b => { const p = cellC(b.x, b.y); ctx.burst(p.x, p.y, ['✨', '⭐'], 4, 90); });
          const stars = moves <= Math.ceil(par * 1.3) ? 3 : moves <= Math.ceil(par * 1.8) ? 2 : 1;
          ctx.after(750, () => ctx.win({ stars, score: moves, text: 'Шагов: <b class="hl">' + moves + '</b> (минимум: ' + par + ')' }));
        }
      }

      /* ---- ввод: свайп, удержание, клавиатура ---- */
      let touch = null, held = -1, repeatAt = 0;
      const keys = [];
      ctx.listen(ctx.box, 'pointerdown', e => {
        if (e.target.closest && e.target.closest('button')) return;
        if (ctx.over || ctx.paused || won) return;
        e.preventDefault();
        touch = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
        held = -1;
        try { ctx.box.setPointerCapture(e.pointerId); } catch (_) { /* не страшно */ }
      });
      ctx.listen(ctx.box, 'pointermove', e => {
        if (!touch || e.pointerId !== touch.id) return;
        if (held >= 0) {
          /* уже идём: точка отсчёта тянется за пальцем вдоль движения, чтобы развернуться было легко */
          if (held % 2) { const al = held === 1 ? e.clientX - touch.ox : touch.ox - e.clientX; if (al > LEASH) touch.ox = e.clientX - (held === 1 ? LEASH : -LEASH); }
          else { const al = held === 2 ? e.clientY - touch.oy : touch.oy - e.clientY; if (al > LEASH) touch.oy = e.clientY - (held === 2 ? LEASH : -LEASH); }
        }
        const dx = e.clientX - touch.ox, dy = e.clientY - touch.oy;
        const ax = Math.abs(dx), ay = Math.abs(dy);
        const mx = Math.max(ax, ay);
        if (mx < SWIPE || mx < Math.min(ax, ay) * 1.25) return;
        const d = ax > ay ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
        if (d === held) return;
        touch.ox = e.clientX; touch.oy = e.clientY;
        held = d; repeatAt = ctx.time + FIRST;
        request(d, false);
      });
      const up = e => { if (touch && (!e || e.pointerId === touch.id)) { touch = null; held = keys.length ? keys[keys.length - 1] : -1; } };
      ctx.listen(ctx.box, 'pointerup', up);
      ctx.listen(ctx.box, 'pointercancel', up);
      ctx.listen(ctx.box, 'lostpointercapture', up);
      const KEYS = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, KeyW: 0, KeyD: 1, KeyS: 2, KeyA: 3 };
      ctx.listen(window, 'keydown', e => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.querySelector('.modal-back.in')) return;
        if (e.code === 'KeyZ' || e.code === 'Backspace') { e.preventDefault(); if (!e.repeat) undo(); return; }
        const d = KEYS[e.code];
        if (d === undefined) return;
        e.preventDefault();
        if (e.repeat) return;
        const i = keys.indexOf(d); if (i >= 0) keys.splice(i, 1);
        keys.push(d);
        if (!touch) { held = d; repeatAt = ctx.time + FIRST; }
        request(d, false);
      });
      ctx.listen(window, 'keyup', e => {
        const d = KEYS[e.code];
        if (d === undefined) return;
        const i = keys.indexOf(d); if (i >= 0) keys.splice(i, 1);
        if (!touch) held = keys.length ? keys[keys.length - 1] : -1;
      });
      ctx.listen(undoBtn, 'click', () => { undo(); });

      /* ---- рисование ---- */
      const stat = document.createElement('canvas');
      let spCof, spCofP, spDig = [];
      function renderStatic() {
        spCof = coffinSprite(cs, false); spCofP = coffinSprite(cs, true);
        spDig = [0, 1, 2, 3].map(v => diggerSprite(cs, v));
        const D = view.dpr;
        const pw = Math.ceil(bw * D), ph = Math.ceil(bh * D);
        if (stat.width !== pw || stat.height !== ph) { stat.width = pw; stat.height = ph; }
        const sc = stat.getContext('2d');
        sc.setTransform(D, 0, 0, D, 0, 0);
        sc.clearRect(0, 0, bw, bh);
        const rnd = A.rng(4242 + cfg.map * 101);
        const pit = pitSprite(cs);
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = y * W + x, X = x * cs, Y = y * cs;
            if (wall[i]) {
              const ring = x === 0 || y === 0 || x === W - 1 || y === H - 1;
              let near = false;
              for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < W && ny < H && g.reach[ny * W + nx]) { near = true; break; }
              }
              if (!ring && !near) { drawHedge(sc, X, Y, cs, rnd); continue; }
              drawGround(sc, X, Y, cs, rnd, (x + y) % 2);
              if (ring) {
                const corner = (x === 0 || x === W - 1) && (y === 0 || y === H - 1);
                sc.drawImage(A.fenceSprite(cs, cs, corner ? 1 : 0, 1 + ((x + y) % 2), 1.25), X, Y, cs, cs);
              } else {
                sc.drawImage(A.tombSprite(cs, cs, (x * 3 + y * 5 + cfg.map) % A.TOMBS, 1 + ((x * 7 + y * 3) % 2), 1.25), X, Y, cs, cs);
              }
            } else {
              drawGround(sc, X, Y, cs, rnd, (x + y) % 2);
              if (goal[i]) sc.drawImage(pit, X, Y, cs, cs);
            }
          }
        }
      }

      function render() {
        const c = view.begin();
        c.drawImage(stat, 0, 0, bw, bh);
        const cofW = spCof, cofP = spCofP;
        for (let i = 0; i < boxes.length; i++) {
          const b = boxes[i];
          const isPlaced = onGoal(b) && !(anim && anim.bi === i && anim.kind === 'move');
          const sp = isPlaced ? cofP : cofW;
          const k = 1 + 0.12 * Math.sin(Math.min(1, b.pulse) * Math.PI);
          const sz = cs * k;
          c.drawImage(sp, b.vx * cs + cs / 2 - sz / 2, b.vy * cs + cs / 2 - sz / 2, sz, sz);
        }
        /* гробовщик: шаг с небольшим подскоком, при упоре в стену — «качок» */
        let px = pl.vx, py = pl.vy, hop = 0;
        if (anim) {
          if (anim.kind === 'bump') {
            const s = Math.sin(Math.PI * Math.min(1, anim.t)) * 0.12;
            px += DX[anim.d] * s; py += DY[anim.d] * s;
          } else if (anim.kind === 'move') hop = Math.abs(Math.sin(Math.PI * Math.min(1, anim.t))) * 0.07;
        }
        c.drawImage(spDig[SPR_OF[face]], px * cs, (py - hop) * cs, cs, cs);
      }

      ctx.loop((dt, t) => {
        /* повтор шага, пока палец (или клавиша) удерживается */
        if (held >= 0 && !won && t >= repeatAt) { repeatAt = t + AGAIN; request(held, true); }
        let need = dirty;
        if (anim) {
          anim.t += dt / anim.dur;
          const k = Math.min(1, anim.t);
          anim.items.forEach(it => { it.o.vx = it.x0 + (it.x1 - it.x0) * k; it.o.vy = it.y0 + (it.y1 - it.y0) * k; });
          need = true;
          if (anim.t >= 1) {
            finishAnim();
            if (!won && queue.length) perform(queue.shift(), false);
          }
        }
        for (let i = 0; i < boxes.length; i++) if (boxes[i].pulse > 0) { boxes[i].pulse = Math.max(0, boxes[i].pulse - dt * 3.2); need = true; }
        if (!need) return;
        if (statDirty) { renderStatic(); statDirty = false; }
        render();
        dirty = false;
      });

      ctx.debug = {
        rows: m.rows.slice(),
        turned,
        par: () => par,
        pos: () => ({ c: pl.x, r: pl.y, face }),
        boxes: () => boxes.map(b => ({ c: b.x, r: b.y })),
        moves: () => moves,
        placed,
        busy: () => !!anim || queue.length > 0,
        st: () => ({ moves, par, placed: placed(), total: N, won, hist: hist.length, cs, held, busy: !!anim, queue: queue.length }),
        press: d => request(d, false),
        undo,
        cellPx: () => ({ x: ox, y: oy, cs, w: bw, h: bh }),
        wallAt: (x, y) => at(x, y),
        rebuild: () => { statDirty = true; renderStatic(); statDirty = false; dirty = true; }
      };
    }
  });
  G.mg.games.grave._maps = MAPS;
})();
