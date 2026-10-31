/* =========================================================
   Процедурная графика: всё рисуется кодом (Canvas), а не берётся из картинок.
   Здесь надгробия, кладбищенская ограда и общие «кисти» (камень, мох, трава, трещины).
   Каждый спрайт рисуется один раз и дальше только копируется drawImage, поэтому почти ничего не стоит.
   Подключается до arcade.js и blockblast.js.
   ========================================================= */
(function () {
  'use strict';
  const A = (G.art = {});
  const TAU = Math.PI * 2;
  const INK = 'rgba(22, 14, 44, .92)';          // цвет контура

  /* детерминированный генератор случайных чисел: одно зерно даёт всегда одну и ту же картинку */
  A.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ---------- кэш спрайтов ---------- */
  const cache = new Map();
  const urls = new Map();
  A.dpr = () => Math.min(2, window.devicePixelRatio || 1);
  /* холст w×h CSS-пикселей (с учётом плотности экрана). draw(c, w, h) рисует в CSS-пикселях */
  A.sprite = function (key, w, h, draw, dprCap) {
    const d = Math.min(dprCap || 2, window.devicePixelRatio || 1);
    const k = key + '|' + w + 'x' + h + '@' + d;
    let s = cache.get(k);
    if (s) { cache.delete(k); cache.set(k, s); return s; }
    s = document.createElement('canvas');
    s.width = Math.max(1, Math.ceil(w * d));
    s.height = Math.max(1, Math.ceil(h * d));
    const c = s.getContext('2d');
    c.scale(d, d);
    draw(c, w, h);
    cache.set(k, s);
    if (cache.size > 200) cache.delete(cache.keys().next().value);
    return s;
  };
  /* то же самое, но результат — строка data:URL (для CSS background-image). Размер фиксированный: 1 пиксель = 1 пиксель */
  A.url = function (key, w, h, draw, scale) {
    const k = key + '|' + w + 'x' + h + '@' + (scale || 1);
    let u = urls.get(k);
    if (u) return u;
    const cv = document.createElement('canvas');
    const sc = scale || 1;
    cv.width = Math.ceil(w * sc); cv.height = Math.ceil(h * sc);
    const c = cv.getContext('2d');
    c.scale(sc, sc);
    draw(c, w, h);
    u = cv.toDataURL('image/png');
    urls.set(k, u);
    return u;
  };

  /* ---------- маленькие «кисти» ---------- */
  /* пучок травы с основанием в (x, y), высота s */
  A.tuft = function (c, x, y, s, rnd, n) {
    const cols = ['#2f5a33', '#3f7640', '#58934a', '#3a6b3a'];
    c.lineCap = 'round';
    n = n || 5;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42 + (rnd() - 0.5) * 0.25;
      const len = s * (0.65 + rnd() * 0.6);
      c.strokeStyle = cols[i % cols.length];
      c.lineWidth = Math.max(1, s * 0.13);
      c.beginPath();
      c.moveTo(x + (i - n / 2) * s * 0.06, y);
      c.quadraticCurveTo(x + Math.cos(a) * len * 0.45 + (rnd() - 0.5) * s * 0.3, y + Math.sin(a) * len * 0.5,
        x + Math.cos(a) * len, y + Math.sin(a) * len);
      c.stroke();
    }
  };
  /* пятно мха: несколько перекрывающихся кружков. Рисуем внутрь уже заданной области (clip) */
  A.moss = function (c, x, y, r, rnd) {
    const cols = ['#4c7a3a', '#5f9246', '#3b6431', '#79ab55'];
    const n = 9 + Math.floor(rnd() * 6);
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, d = rnd() * r;
      c.fillStyle = cols[i % cols.length];
      c.globalAlpha = 0.5 + rnd() * 0.3;
      c.beginPath();
      c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, r * (0.12 + rnd() * 0.16), 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  };
  /* мелкая зернистость внутри текущей области (clip): светлые и тёмные точки */
  A.speckle = function (c, x, y, w, h, rnd, density, a) {
    const n = Math.floor(w * h * (density || 0.05));
    for (let i = 0; i < n; i++) {
      const px = x + rnd() * w, py = y + rnd() * h, s = 0.6 + rnd() * 1.1;
      c.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,' + ((a || 0.14) * rnd()).toFixed(3) + ')' : 'rgba(10,6,30,' + ((a || 0.14) * 1.2 * rnd()).toFixed(3) + ')';
      c.fillRect(px, py, s, s);
    }
  };
  /* трещина: ломаная линия сверху вниз */
  A.crack = function (c, x, y, len, rnd, lw) {
    const pts = [[x, y]];
    let cx = x, cy = y;
    const n = 4 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      cx += (rnd() - 0.5) * len * 0.3; cy += len / n;
      pts.push([cx, cy]);
    }
    c.lineJoin = 'round'; c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      c.strokeStyle = pass ? 'rgba(18,10,40,.6)' : 'rgba(255,255,255,.22)';
      c.lineWidth = lw * (pass ? 1 : 0.9);
      c.beginPath();
      pts.forEach((p, i) => { const px = p[0] + (pass ? 0 : lw * 0.8), py = p[1] + (pass ? 0 : lw * 0.8); i ? c.lineTo(px, py) : c.moveTo(px, py); });
      c.stroke();
    }
  };

  /* ====================================================================
     Надгробия. Пять форм: арка, крест, «домик», плечи с надписью, арка с черепом.
     draw(c, w, h, v, seed): рисует в рамке w×h; основание у нижнего края (0.9·h), под ним тень.
     ==================================================================== */
  const TOMBS = 5;
  A.TOMBS = TOMBS;

  function tombPath(c, v, w, h) {
    const X = u => u * w, Y = u => u * h;
    c.beginPath();
    switch (v) {
      case 0:      // классическая арка
        c.moveTo(X(0.2), Y(0.86)); c.lineTo(X(0.2), Y(0.36));
        c.arc(X(0.5), Y(0.36), X(0.3), Math.PI, 0);
        c.lineTo(X(0.8), Y(0.86)); c.closePath(); break;
      case 1:      // каменный крест
        c.moveTo(X(0.4), Y(0.86)); c.lineTo(X(0.4), Y(0.46)); c.lineTo(X(0.17), Y(0.46)); c.lineTo(X(0.17), Y(0.28));
        c.lineTo(X(0.4), Y(0.28)); c.lineTo(X(0.4), Y(0.06)); c.lineTo(X(0.6), Y(0.06)); c.lineTo(X(0.6), Y(0.28));
        c.lineTo(X(0.83), Y(0.28)); c.lineTo(X(0.83), Y(0.46)); c.lineTo(X(0.6), Y(0.46)); c.lineTo(X(0.6), Y(0.86)); c.closePath(); break;
      case 2:      // «домик»: острая верхушка
        c.moveTo(X(0.25), Y(0.86)); c.lineTo(X(0.25), Y(0.3)); c.lineTo(X(0.5), Y(0.05)); c.lineTo(X(0.75), Y(0.3)); c.lineTo(X(0.75), Y(0.86)); c.closePath(); break;
      case 3:      // широкая плита с «плечами» и круглой верхушкой
        c.moveTo(X(0.14), Y(0.86)); c.lineTo(X(0.14), Y(0.4));
        c.quadraticCurveTo(X(0.14), Y(0.28), X(0.26), Y(0.28)); c.lineTo(X(0.3), Y(0.28));
        c.arc(X(0.5), Y(0.28), X(0.2), Math.PI, 0);
        c.lineTo(X(0.74), Y(0.28)); c.quadraticCurveTo(X(0.86), Y(0.28), X(0.86), Y(0.4));
        c.lineTo(X(0.86), Y(0.86)); c.closePath(); break;
      default:     // низкая круглая плита (для черепа)
        c.moveTo(X(0.16), Y(0.86)); c.lineTo(X(0.16), Y(0.4));
        c.arc(X(0.5), Y(0.4), X(0.34), Math.PI, 0);
        c.lineTo(X(0.84), Y(0.86)); c.closePath();
    }
  }

  /* вырезанный знак: тёмная линия и светлая «тень» ниже неё, как будто знак выбит в камне */
  function carved(c, lw, fn) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.save(); c.translate(0, lw * 0.75);
    c.strokeStyle = 'rgba(255,255,255,.38)'; c.lineWidth = lw; c.beginPath(); fn(); c.stroke();
    c.restore();
    c.strokeStyle = 'rgba(28,18,58,.72)'; c.lineWidth = lw; c.beginPath(); fn(); c.stroke();
  }

  function tombSymbol(c, v, w, h, lw) {
    const X = u => u * w, Y = u => u * h;
    switch (v) {
      case 0:      // крест на арке
        carved(c, lw, () => { c.moveTo(X(0.5), Y(0.2)); c.lineTo(X(0.5), Y(0.56)); c.moveTo(X(0.38), Y(0.32)); c.lineTo(X(0.62), Y(0.32)); });
        carved(c, lw * 0.8, () => { c.moveTo(X(0.34), Y(0.7)); c.lineTo(X(0.66), Y(0.7)); c.moveTo(X(0.4), Y(0.77)); c.lineTo(X(0.6), Y(0.77)); });
        break;
      case 1:      // на кресте только пара насечек
        carved(c, lw * 0.9, () => { c.moveTo(X(0.5), Y(0.54)); c.lineTo(X(0.5), Y(0.7)); c.moveTo(X(0.46), Y(0.62)); c.lineTo(X(0.54), Y(0.62)); });
        break;
      case 2:      // строчки «текста»
        carved(c, lw * 0.85, () => {
          c.moveTo(X(0.4), Y(0.34)); c.lineTo(X(0.6), Y(0.34));
          c.moveTo(X(0.34), Y(0.47)); c.lineTo(X(0.66), Y(0.47));
          c.moveTo(X(0.34), Y(0.58)); c.lineTo(X(0.66), Y(0.58));
          c.moveTo(X(0.4), Y(0.69)); c.lineTo(X(0.6), Y(0.69));
        });
        break;
      case 3: {    // R.I.P.
        const fs = Math.max(6, Math.round(h * 0.17));
        c.font = '900 ' + fs + 'px Georgia, "Times New Roman", serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(255,255,255,.38)'; c.fillText('RIP', X(0.5), Y(0.56) + lw * 0.8);
        c.fillStyle = 'rgba(28,18,58,.78)'; c.fillText('RIP', X(0.5), Y(0.56));
        carved(c, lw * 0.8, () => { c.moveTo(X(0.34), Y(0.7)); c.lineTo(X(0.66), Y(0.7)); });
        break;
      }
      default: {   // череп
        const cx = X(0.5), cy = Y(0.37), r = w * 0.15;
        c.save();
        c.translate(0, lw * 0.7); c.fillStyle = 'rgba(255,255,255,.3)';
        c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); c.fillRect(cx - r * 0.6, cy + r * 0.5, r * 1.2, r * 0.9);
        c.restore();
        c.fillStyle = 'rgba(40,30,70,.34)';
        c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); c.fillRect(cx - r * 0.6, cy + r * 0.5, r * 1.2, r * 0.9);
        c.fillStyle = 'rgba(20,12,44,.88)';
        c.beginPath(); c.ellipse(cx - r * 0.42, cy - r * 0.05, r * 0.26, r * 0.3, 0, 0, TAU); c.ellipse(cx + r * 0.42, cy - r * 0.05, r * 0.26, r * 0.3, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(cx, cy + r * 0.2); c.lineTo(cx - r * 0.12, cy + r * 0.52); c.lineTo(cx + r * 0.12, cy + r * 0.52); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(20,12,44,.7)'; c.lineWidth = Math.max(0.8, lw * 0.55);
        c.beginPath();
        for (let i = -1; i <= 1; i++) { c.moveTo(cx + i * r * 0.28, cy + r * 0.78); c.lineTo(cx + i * r * 0.28, cy + r * 1.3); }
        c.stroke();
        carved(c, lw * 0.9, () => {   // кости крест-накрест
          c.moveTo(X(0.34), Y(0.64)); c.lineTo(X(0.66), Y(0.78)); c.moveTo(X(0.66), Y(0.64)); c.lineTo(X(0.34), Y(0.78));
        });
      }
    }
  }

  A.tomb = function (c, w, h, v, seed) {
    v = ((v % TOMBS) + TOMBS) % TOMBS;
    const rnd = A.rng((seed || 1) * 7919 + v * 104729);
    const lw = Math.max(1.1, w * 0.034);
    /* тень на земле */
    c.fillStyle = 'rgba(0,0,0,.38)';
    c.beginPath(); c.ellipse(w * 0.52, h * 0.885, w * 0.4, h * 0.055, 0, 0, TAU); c.fill();
    /* плинтус (основание) */
    const bx = v === 1 ? 0.3 : v === 3 ? 0.08 : 0.12, bw = 1 - bx * 2;
    c.save();
    c.fillStyle = INK;
    c.beginPath(); c.roundRect ? c.roundRect(w * bx - lw * 0.5, h * 0.78 - lw * 0.5, w * bw + lw, h * 0.12 + lw, w * 0.03) : c.rect(w * bx - lw * 0.5, h * 0.78 - lw * 0.5, w * bw + lw, h * 0.12 + lw); c.fill();
    const pg = c.createLinearGradient(0, h * 0.78, 0, h * 0.9);
    pg.addColorStop(0, '#9a95b8'); pg.addColorStop(1, '#615c82');
    c.fillStyle = pg;
    c.beginPath(); c.roundRect ? c.roundRect(w * bx, h * 0.78, w * bw, h * 0.12, w * 0.025) : c.rect(w * bx, h * 0.78, w * bw, h * 0.12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(w * bx + 1, h * 0.78 + 1, w * bw - 2, Math.max(1, h * 0.018));
    c.restore();
    /* корпус: контур, заливка, текстура камня */
    c.save();
    tombPath(c, v, w, h);
    c.lineJoin = 'round'; c.lineWidth = lw * 2; c.strokeStyle = INK; c.stroke();
    const g = c.createLinearGradient(w * 0.15, 0, w * 0.85, 0);
    g.addColorStop(0, '#dcd8ee'); g.addColorStop(0.45, '#b1accb'); g.addColorStop(1, '#7a759c');
    c.fillStyle = g; c.fill();
    c.clip();
    const sh = c.createLinearGradient(0, 0, 0, h * 0.9);
    sh.addColorStop(0, 'rgba(255,255,255,.22)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(20,10,50,.3)');
    c.fillStyle = sh; c.fillRect(0, 0, w, h);
    /* потёки дождя */
    for (let i = 0; i < 3; i++) {
      const sx = w * (0.28 + rnd() * 0.44), sw = w * (0.03 + rnd() * 0.05);
      const sg = c.createLinearGradient(0, h * 0.1, 0, h * 0.8);
      sg.addColorStop(0, 'rgba(40,30,80,.0)'); sg.addColorStop(0.3, 'rgba(40,30,80,.16)'); sg.addColorStop(1, 'rgba(40,30,80,0)');
      c.fillStyle = sg; c.fillRect(sx, h * 0.1, sw, h * 0.72);
    }
    A.speckle(c, 0, 0, w, h, rnd, 0.055, 0.16);
    /* блик по левому краю */
    c.fillStyle = 'rgba(255,255,255,.3)';
    c.fillRect(w * 0.205, h * 0.18, Math.max(1, w * 0.02), h * 0.6);
    /* мох у основания, иногда сверху */
    A.moss(c, w * (0.28 + rnd() * 0.1), h * 0.8, w * 0.2, rnd);
    if (rnd() > 0.35) A.moss(c, w * (0.62 + rnd() * 0.12), h * 0.82, w * 0.17, rnd);
    if (rnd() > 0.6) A.moss(c, w * (0.4 + rnd() * 0.25), h * 0.12, w * 0.1, rnd);
    if (v !== 4 && v !== 1 && rnd() > 0.4) A.crack(c, w * (0.55 + rnd() * 0.2), h * (0.16 + rnd() * 0.08), h * 0.26, rnd, Math.max(0.9, lw * 0.6));
    tombSymbol(c, v, w, h, lw);
    c.restore();
    /* трава вокруг основания */
    A.tuft(c, w * 0.15, h * 0.895, w * 0.12, rnd, 4);
    A.tuft(c, w * 0.85, h * 0.9, w * 0.13, rnd, 4);
    if (rnd() > 0.4) A.tuft(c, w * 0.5, h * 0.925, w * 0.09, rnd, 3);
  };
  A.tombSprite = function (w, h, v, seed, cap) {
    return A.sprite('tomb' + v + '_' + (seed || 0), w, h, (c, ww, hh) => A.tomb(c, ww, hh, v, seed), cap);
  };

  /* ====================================================================
     Кладбищенская ограда: кованые прутья с остриями, две перекладины, секции стыкуются друг с другом.
     kind 0 — обычная секция, 1 — каменный столб с шаром (углы поля)
     ==================================================================== */
  A.fence = function (c, w, h, kind, seed) {
    const rnd = A.rng((seed || 1) * 31337 + kind * 17);
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.beginPath(); c.ellipse(w * 0.5, h * 0.9, w * 0.5, h * 0.05, 0, 0, TAU); c.fill();
    const iron = c.createLinearGradient(0, 0, 0, h);
    iron.addColorStop(0, '#4a4568'); iron.addColorStop(1, '#2a2542');
    /* перекладины */
    const rails = [h * 0.4, h * 0.74];
    rails.forEach(y => {
      c.fillStyle = INK; c.fillRect(0, y - h * 0.045, w, h * 0.09 + 1);
      c.fillStyle = '#5b5680'; c.fillRect(0, y - h * 0.032, w, h * 0.03);
      c.fillStyle = '#34304f'; c.fillRect(0, y - h * 0.002, w, h * 0.036);
    });
    /* прутья */
    const n = 4, pw = Math.max(2.4, w * 0.095);
    for (let i = 0; i < n; i++) {
      const x = w * (i + 0.5) / n, top = h * (0.2 + (rnd() - 0.5) * 0.02);
      c.fillStyle = INK;
      c.fillRect(x - pw / 2 - 1, top, pw + 2, h * 0.72 - top + 1);
      c.beginPath(); c.moveTo(x - pw * 0.95, top + 1); c.lineTo(x, top - h * 0.14); c.lineTo(x + pw * 0.95, top + 1); c.closePath(); c.fill();
      c.fillStyle = iron; c.fillRect(x - pw / 2, top, pw, h * 0.72 - top);
      c.fillStyle = 'rgba(190,180,235,.5)'; c.fillRect(x - pw / 2 + 0.5, top, Math.max(1, pw * 0.26), h * 0.72 - top);
      const tg = c.createLinearGradient(x - pw, 0, x + pw, 0);
      tg.addColorStop(0, '#8d86b6'); tg.addColorStop(1, '#3f3a60');
      c.fillStyle = tg;
      c.beginPath(); c.moveTo(x - pw * 0.8, top); c.lineTo(x, top - h * 0.12); c.lineTo(x + pw * 0.8, top); c.closePath(); c.fill();
    }
    if (kind === 1) {     // столб-угол
      const pxw = w * 0.5, px = (w - pxw) / 2, top = h * 0.3;
      c.fillStyle = INK; c.fillRect(px - 1.5, top - 1.5, pxw + 3, h * 0.62 + 3);
      const g = c.createLinearGradient(px, 0, px + pxw, 0);
      g.addColorStop(0, '#cfcae4'); g.addColorStop(0.5, '#a39ec2'); g.addColorStop(1, '#6e6990');
      c.fillStyle = g; c.fillRect(px, top, pxw, h * 0.62);
      c.save(); c.beginPath(); c.rect(px, top, pxw, h * 0.62); c.clip();
      A.speckle(c, px, top, pxw, h * 0.62, rnd, 0.06, 0.15);
      A.moss(c, px + pxw * 0.3, h * 0.84, pxw * 0.5, rnd);
      c.restore();
      /* шапка и шар */
      c.fillStyle = INK; c.fillRect(px - w * 0.06 - 1.5, top - h * 0.06 - 1.5, pxw + w * 0.12 + 3, h * 0.08 + 3);
      c.fillStyle = '#b9b4d6'; c.fillRect(px - w * 0.06, top - h * 0.06, pxw + w * 0.12, h * 0.08);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(px - w * 0.06, top - h * 0.06, pxw + w * 0.12, h * 0.02);
      const br = w * 0.13, by = top - h * 0.06 - br * 0.65;
      c.fillStyle = INK; c.beginPath(); c.arc(w / 2, by, br + 1.5, 0, TAU); c.fill();
      const bg = c.createRadialGradient(w * 0.45, by - br * 0.3, 1, w / 2, by, br);
      bg.addColorStop(0, '#f1edff'); bg.addColorStop(1, '#8a84ae');
      c.fillStyle = bg; c.beginPath(); c.arc(w / 2, by, br, 0, TAU); c.fill();
    }
    A.tuft(c, w * 0.08, h * 0.9, w * 0.17, rnd, 4);
    A.tuft(c, w * 0.9, h * 0.91, w * 0.15, rnd, 4);
  };
  A.fenceSprite = function (w, h, kind, seed, cap) {
    return A.sprite('fence' + kind + '_' + (seed || 0), w, h, (c, ww, hh) => A.fence(c, ww, hh, kind, seed), cap);
  };

  /* ====================================================================
     Клетка-надгробие для Block Blast: участок земли и надгробие на нём (квадрат w×w).
     Рисуется 5 вариантов; поле берёт их по положению клетки, чтобы соседние не повторялись.
     ==================================================================== */
  A.tombCell = function (c, w, v, seed) {
    const rnd = A.rng((seed || 1) * 977 + v * 131);
    const r = w * 0.13;
    c.save();
    c.beginPath(); c.roundRect ? c.roundRect(0, 0, w, w, r) : c.rect(0, 0, w, w);
    c.clip();
    const g = c.createLinearGradient(0, 0, 0, w);
    g.addColorStop(0, '#5a5688'); g.addColorStop(0.55, '#3d3963'); g.addColorStop(1, '#262244');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
    const gl = c.createRadialGradient(w * 0.5, w * 0.3, 1, w * 0.5, w * 0.4, w * 0.75);
    gl.addColorStop(0, 'rgba(210,200,255,.28)'); gl.addColorStop(1, 'rgba(210,200,255,0)');
    c.fillStyle = gl; c.fillRect(0, 0, w, w);
    A.speckle(c, 0, 0, w, w, rnd, 0.04, 0.12);
    /* травка по нижним углам */
    A.tuft(c, w * 0.1, w * 0.97, w * 0.2, rnd, 5);
    A.tuft(c, w * 0.9, w * 0.97, w * 0.2, rnd, 5);
    c.restore();
    /* само надгробие чуть меньше клетки */
    c.save();
    c.translate(0, -w * 0.015);
    A.tomb(c, w, w, v, seed);
    c.restore();
    /* тонкая рамка клетки */
    c.strokeStyle = 'rgba(14,8,34,.7)'; c.lineWidth = Math.max(1, w * 0.035);
    c.beginPath(); c.roundRect ? c.roundRect(0.5, 0.5, w - 1, w - 1, r) : c.rect(0.5, 0.5, w - 1, w - 1); c.stroke();
  };
  /* data:URL клетки: размер 64×64 CSS-пикселя, плотность 2 (128×128 пикселей) */
  A.cellUrl = function (v, seed) {
    return A.url('tcell' + v + '_' + (seed || 0), 64, 64, (c, w) => A.tombCell(c, w, v, seed || 3), 2);
  };
  /* data:URL одного надгробия (для карты и мебели) */
  A.tombUrl = function (v, w, h, seed, scale) {
    return A.url('timg' + v + '_' + (seed || 0), w, h, (c, ww, hh) => A.tomb(c, ww, hh, v, seed || 3), scale || 2);
  };
  /* data:URL ограды: n секций подряд, по краям каменные столбы */
  A.fenceUrl = function (w, h, scale) {
    return A.url('fenceRun', w, h, (c, ww, hh) => {
      const post = ww * 0.12, mid = ww - post * 2, n = 3;
      c.save(); c.translate(post, 0);
      for (let i = 0; i < n; i++) { c.save(); c.translate(i * mid / n, 0); A.fence(c, mid / n, hh, 0, 11 + i); c.restore(); }
      c.restore();
      c.save(); A.fence(c, post * 1.7, hh, 1, 5); c.restore();
      c.save(); c.translate(ww - post * 1.7, 0); A.fence(c, post * 1.7, hh, 1, 6); c.restore();
    }, scale || 2);
  };

  /* ====================================================================
     Фоновая подготовка картинок. Пока игрок смотрит на титул и карту, телефон успевает по одной
     нарисовать текстуры, надгробия и ограду, поэтому лавка, дом и Block Blast открываются без задержки.
     Каждая работа маленькая и запускается только в простое. Если нужная картинка понадобилась раньше,
     она просто рисуется на месте (результаты кэшируются).
     ==================================================================== */
  A.warm = function () {
    const jobs = [];
    if (G.tex && G.tex.jobs) G.tex.jobs().forEach(j => jobs.push(j));
    for (let v = 0; v < TOMBS; v++) jobs.push(() => A.cellUrl(v));
    if (G.items && G.items.warmJobs) G.items.warmJobs().forEach(j => jobs.push(j));
    for (let v = 0; v < TOMBS; v++) jobs.push(() => A.tombUrl(v, 112, 132, 5, 2));
    const ric = window.requestIdleCallback ? (cb => window.requestIdleCallback(cb, { timeout: 2500 })) : (cb => setTimeout(() => cb({ timeRemaining: () => 8, didTimeout: false }), 150));
    const run = d => {
      let n = 0;
      while (jobs.length && (n === 0 || d.timeRemaining() > 20) && n < 2) {
        const j = jobs.shift(); n++;
        try { j(); } catch (e) { /* не получилось сейчас, нарисуется при первом показе */ }
      }
      if (jobs.length) ric(run);
    };
    setTimeout(() => ric(run), 600);
  };
})();
