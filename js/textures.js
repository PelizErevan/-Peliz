/* =========================================================
   Процедурные текстуры: дерево, ткань, камень, металл, ковёр, обои, доски пола.
   Всё рисуется кодом (Canvas) один раз, превращается в маленькие PNG-плитки
   и подключается к SVG-мебели как <pattern>. Никаких картинок в файлах игры.
   Плитки полупрозрачные: они кладутся поверх плоского цвета предмета,
   поэтому один рисунок «дерева» подходит и к тёмному шкафу, и к светлому столу.
   ========================================================= */
(function () {
  'use strict';
  const A = G.art;
  const TAU = Math.PI * 2;
  const T = (G.tex = { ready: false });
  const S = 128;                       // сторона плитки в пикселях
  const UNITS = 64;                    // а в единицах рисунка (viewBox) она занимает 64×64

  /* рисует fn несколько раз со сдвигами на период, чтобы плитка бесшовно склеивалась */
  function wrap(c, w, h, fn) {
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      c.save(); c.translate(dx * w, dy * h); fn(); c.restore();
    }
  }
  function make(w, h, draw) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    return cv;
  }

  /* ---------- дерево: волнистые волокна, широкие тёмные/светлые полосы, сучок, поры ---------- */
  function wood(c, w, h) {
    const rnd = A.rng(1103);
    for (let i = 0; i < 10; i++) {
      const y = rnd() * h, bh = 6 + rnd() * 20, light = rnd() > 0.5;
      c.fillStyle = light ? 'rgba(255,208,140,' + (0.05 + rnd() * 0.07).toFixed(3) + ')' : 'rgba(16,6,0,' + (0.07 + rnd() * 0.09).toFixed(3) + ')';
      wrap(c, w, h, () => c.fillRect(0, y, w, bh));
    }
    for (let i = 0; i < 46; i++) {
      const y0 = rnd() * h, amp = 1 + rnd() * 3.4, ph = rnd() * TAU, k = 1 + Math.floor(rnd() * 2), lw = 0.6 + rnd() * 1.6;
      const dark = rnd() > 0.38;
      c.strokeStyle = dark ? 'rgba(18,7,0,' + (0.12 + rnd() * 0.24).toFixed(3) + ')' : 'rgba(255,216,150,' + (0.07 + rnd() * 0.15).toFixed(3) + ')';
      c.lineWidth = lw; c.lineCap = 'round';
      wrap(c, w, h, () => {
        c.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = y0 + Math.sin(ph + x / w * TAU * k) * amp + Math.sin(ph * 1.7 + x / w * TAU * (k + 1)) * amp * 0.35;
          x ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      });
    }
    /* сучок: кольца вокруг тёмной точки */
    const kx = w * (0.25 + rnd() * 0.5), ky = h * (0.25 + rnd() * 0.5);
    wrap(c, w, h, () => {
      for (let r = 11; r >= 2; r -= 2.2) {
        c.strokeStyle = 'rgba(20,8,0,' + (0.12 + (11 - r) * 0.025).toFixed(3) + ')'; c.lineWidth = 1.1;
        c.beginPath(); c.ellipse(kx, ky, r * 1.9, r * 0.8, 0, 0, TAU); c.stroke();
      }
      c.fillStyle = 'rgba(14,5,0,.42)'; c.beginPath(); c.ellipse(kx, ky, 3.6, 1.8, 0, 0, TAU); c.fill();
    });
    /* поры */
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w, y = rnd() * h, l = 2 + rnd() * 5;
      c.strokeStyle = 'rgba(16,6,0,' + (0.1 + rnd() * 0.16).toFixed(3) + ')'; c.lineWidth = 0.8;
      wrap(c, w, h, () => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y + (rnd() - 0.5) * 0.8); c.stroke(); });
    }
  }

  /* ---------- ткань: переплетение нитей ---------- */
  function weave(c, w, h) {
    const rnd = A.rng(2207), p = 4;
    for (let j = 0; j < h / p; j++) for (let i = 0; i < w / p; i++) {
      const over = (i + j) % 2 === 0;
      const j1 = 0.7 + rnd() * 0.6;
      if (over) {
        c.fillStyle = 'rgba(255,255,255,' + (0.085 * j1).toFixed(3) + ')'; c.fillRect(i * p, j * p, p - 1.2, p);
        c.fillStyle = 'rgba(0,0,0,' + (0.1 * j1).toFixed(3) + ')'; c.fillRect(i * p + p - 1.2, j * p, 1.2, p);
      } else {
        c.fillStyle = 'rgba(255,255,255,' + (0.075 * j1).toFixed(3) + ')'; c.fillRect(i * p, j * p, p, p - 1.2);
        c.fillStyle = 'rgba(0,0,0,' + (0.1 * j1).toFixed(3) + ')'; c.fillRect(i * p, j * p + p - 1.2, p, 1.2);
      }
    }
    for (let i = 0; i < 90; i++) {   // ворсинки
      c.fillStyle = 'rgba(255,255,255,' + (0.06 + rnd() * 0.1).toFixed(3) + ')';
      c.fillRect(rnd() * w, rnd() * h, 1, 1);
    }
  }

  /* ---------- стёганая обивка: ромбы-подушечки, швы и пуговицы в узлах ---------- */
  function quilt(c, w, h) {
    const hw = w / 2, hh = h / 2;
    const puff = (cx, cy) => {
      const g = c.createRadialGradient(cx - hw * 0.22, cy - hh * 0.3, 2, cx, cy, hw * 0.95);
      g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,10,.34)');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(cx, cy - hh); c.lineTo(cx + hw, cy); c.lineTo(cx, cy + hh); c.lineTo(cx - hw, cy); c.closePath(); c.fill();
    };
    puff(hw, hh); puff(0, 0); puff(w, 0); puff(0, h); puff(w, h);
    c.lineCap = 'round';
    const seam = (x1, y1, x2, y2) => {
      c.strokeStyle = 'rgba(8,0,20,.6)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x1 + 1.4, y1 + 1.4); c.lineTo(x2 + 1.4, y2 + 1.4); c.stroke();
    };
    wrap(c, w, h, () => { seam(hw, 0, w, hh); seam(w, hh, hw, h); seam(hw, h, 0, hh); seam(0, hh, hw, 0); });
    const button = (x, y) => {
      c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(x + 0.9, y + 1.3, 4, 0, TAU); c.fill();
      const g = c.createRadialGradient(x - 1.2, y - 1.4, 0.5, x, y, 3.8);
      g.addColorStop(0, 'rgba(255,238,175,.98)'); g.addColorStop(1, 'rgba(165,105,22,.98)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill();
    };
    wrap(c, w, h, () => { button(hw, 0); button(w, hh); button(hw, h); button(0, hh); });
    weave(c, w, h);
  }

  /* ---------- камень: неровные блоки со швами, крапинки ---------- */
  function stone(c, w, h) {
    const rnd = A.rng(4409), rh = h / 2;
    c.fillStyle = 'rgba(6,3,16,.5)'; c.fillRect(0, 0, w, h);                   // раствор
    const stones = [[0, 0, 0.55], [0, 0.55, 0.45], [1, 0.15, 0.65], [1, 0.8, 0.35]];
    stones.forEach(([row, fx, fw]) => {
      const x = fx * w, y = row * rh, bw = fw * w, t = rnd();
      wrap(c, w, h, () => {
        const g = c.createLinearGradient(x, y, x + bw * 0.3, y + rh);
        g.addColorStop(0, t > 0.5 ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.22)');
        g.addColorStop(1, t > 0.5 ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.03)');
        c.fillStyle = g;
        c.beginPath(); c.roundRect ? c.roundRect(x + 2, y + 2, bw - 4, rh - 4, 8) : c.rect(x + 2, y + 2, bw - 4, rh - 4); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(x + 7, y + 3.5); c.lineTo(x + bw - 8, y + 3.5); c.stroke();
        c.strokeStyle = 'rgba(5,2,15,.3)'; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(x + 7, y + rh - 3.5); c.lineTo(x + bw - 8, y + rh - 3.5); c.stroke();
      });
    });
    for (let i = 0; i < 170; i++) {
      const px = rnd() * w, py = rnd() * h, s = 0.6 + rnd() * 1.5;
      c.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,' + (0.14 * rnd()).toFixed(3) + ')' : 'rgba(5,2,15,' + (0.24 * rnd()).toFixed(3) + ')';
      wrap(c, w, h, () => c.fillRect(px, py, s, s));
    }
  }

  /* ---------- чугун: чеканка из мелких вмятин и тёмные подтёки ---------- */
  function iron(c, w, h) {
    const rnd = A.rng(5501);
    for (let i = 0; i < 46; i++) {
      const x = rnd() * w, y = rnd() * h, r = 4 + rnd() * 8;
      wrap(c, w, h, () => {
        const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, 0.5, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,.075)'); g.addColorStop(0.65, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,12,.22)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      });
    }
    for (let i = 0; i < 14; i++) {
      c.strokeStyle = 'rgba(255,255,255,' + (0.02 + rnd() * 0.035).toFixed(3) + ')'; c.lineWidth = 0.8;
      const y = rnd() * h; wrap(c, w, h, () => { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + (rnd() - 0.5) * 2); c.stroke(); });
    }
    for (let i = 0; i < 70; i++) { c.fillStyle = 'rgba(0,0,10,' + (0.12 * rnd()).toFixed(3) + ')'; c.fillRect(rnd() * w, rnd() * h, 1.6, 1.6); }
  }

  /* ---------- золото/латунь: узкие блики и тёмные полосы ---------- */
  function gold(c, w, h) {
    const rnd = A.rng(6607);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,244,170,.38)'); g.addColorStop(0.25, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(90,50,0,.3)'); g.addColorStop(0.8, 'rgba(255,236,150,.18)'); g.addColorStop(1, 'rgba(255,244,170,.38)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const y = rnd() * h, hl = rnd() > 0.45;
      c.strokeStyle = hl ? 'rgba(255,248,200,' + (0.1 + rnd() * 0.22).toFixed(3) + ')' : 'rgba(70,35,0,' + (0.1 + rnd() * 0.2).toFixed(3) + ')';
      c.lineWidth = 0.6 + rnd() * 1.6;
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }
    for (let i = 0; i < 80; i++) { c.fillStyle = 'rgba(255,250,210,' + (0.15 * rnd()).toFixed(3) + ')'; c.fillRect(rnd() * w, rnd() * h, 1.2, 1.2); }
  }

  /* ---------- ковёр: шерстяной ворс и ромбовый узор ---------- */
  function rug(c, w, h) {
    const rnd = A.rng(7703);
    const step = 4;
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,' + (0.03 + rnd() * 0.07).toFixed(3) + ')' : 'rgba(0,0,0,' + (0.04 + rnd() * 0.1).toFixed(3) + ')';
      c.fillRect(x, y, step - 1, step - 1);
    }
    const dia = (cx, cy, r, col, lw) => {
      c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
      c.moveTo(cx, cy - r); c.lineTo(cx + r, cy); c.lineTo(cx, cy + r); c.lineTo(cx - r, cy); c.closePath(); c.stroke();
    };
    wrap(c, w, h, () => {
      dia(w / 2, h / 2, 40, 'rgba(255,214,120,.32)', 2.4);
      dia(w / 2, h / 2, 26, 'rgba(255,214,120,.26)', 1.8);
      dia(w / 2, h / 2, 12, 'rgba(255,214,120,.34)', 2);
      dia(0, 0, 26, 'rgba(255,214,120,.22)', 1.8);
      c.fillStyle = 'rgba(255,214,120,.3)'; c.beginPath(); c.arc(w / 2, h / 2, 3, 0, TAU); c.fill();
    });
  }

  /* ---------- кожа/переплёт: мягкая «галька» и тёмные потёртости ---------- */
  function leather(c, w, h) {
    const rnd = A.rng(8801);
    for (let i = 0; i < 150; i++) {
      const x = rnd() * w, y = rnd() * h, r = 3 + rnd() * 3.4;
      wrap(c, w, h, () => {
        const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.3, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(1, 'rgba(0,0,0,.13)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      });
    }
    for (let i = 0; i < 7; i++) {
      c.strokeStyle = 'rgba(0,0,0,' + (0.06 + rnd() * 0.06).toFixed(3) + ')'; c.lineWidth = 1 + rnd();
      const y = rnd() * h; wrap(c, w, h, () => { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + (rnd() - 0.5) * 6); c.stroke(); });
    }
  }

  /* ====================================================================
     Комната дома: обои с узором и дощатый пол. Рисуются крупными плитками (для CSS-фона).
     ==================================================================== */
  /* обои 192×256 пикселей (96×128 CSS): полосы и «дамасский» узор из лепестков, лун и летучих мышей */
  function wallpaper(c, w, h) {
    const rnd = A.rng(9901);
    const sw = w / 4;                                  // четыре полосы по 48 пикселей
    for (let i = 0; i < 4; i++) {
      const g = c.createLinearGradient(i * sw, 0, (i + 1) * sw, 0);
      const a = i % 2 ? ['#352a5e', '#2f2556'] : ['#2b2147', '#271e42'];
      g.addColorStop(0, a[0]); g.addColorStop(1, a[1]);
      c.fillStyle = g; c.fillRect(i * sw, 0, sw, h);
    }
    c.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 4; i++) c.fillRect(i * sw, 0, 2, h);
    c.fillStyle = 'rgba(0,0,0,.18)';
    for (let i = 0; i < 4; i++) c.fillRect(i * sw + sw - 2, 0, 2, h);
    /* узор: цветок из четырёх лепестков с ромбом в центре */
    const bloom = (cx, cy, r, col) => {
      c.save(); c.translate(cx, cy); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1.4;
      for (let k = 0; k < 4; k++) {
        c.save(); c.rotate(k * Math.PI / 2);
        c.beginPath(); c.moveTo(0, -r * 0.2); c.bezierCurveTo(r * 0.5, -r * 0.5, r * 0.4, -r * 1.05, 0, -r * 1.25); c.bezierCurveTo(-r * 0.4, -r * 1.05, -r * 0.5, -r * 0.5, 0, -r * 0.2); c.fill();
        c.restore();
      }
      c.beginPath(); c.moveTo(0, -r * 0.3); c.lineTo(r * 0.3, 0); c.lineTo(0, r * 0.3); c.lineTo(-r * 0.3, 0); c.closePath(); c.fill();
      c.restore();
    };
    const motif = (cx, cy, col) => {
      bloom(cx, cy, 15, col);
      c.fillStyle = col;
      c.beginPath(); c.arc(cx, cy - 36, 3, 0, TAU); c.fill();         // бусины между цветами
      c.beginPath(); c.arc(cx, cy + 36, 3, 0, TAU); c.fill();
    };
    for (let i = 0; i < 4; i += 2) {
      wrap(c, w, h, () => { motif(i * sw + sw, h * 0.25, 'rgba(255,220,150,.10)'); motif(i * sw + sw, h * 0.75, 'rgba(255,220,150,.10)'); });
    }
    /* мелкие летучие мыши на светлых полосах */
    const bat = (x, y, s) => {
      c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = 'rgba(8,3,24,.28)';
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-3, -7, -9, -10, -18, -9); c.bezierCurveTo(-15, -6, -13, -2, -15, 1); c.bezierCurveTo(-11, 0, -7, 2, -5, 6);
      c.bezierCurveTo(-3, 3, -1, 3, 0, 5); c.bezierCurveTo(1, 3, 3, 3, 5, 6); c.bezierCurveTo(7, 2, 11, 0, 15, 1); c.bezierCurveTo(13, -2, 15, -6, 18, -9); c.bezierCurveTo(9, -10, 3, -7, 0, 0); c.fill();
      c.restore();
    };
    wrap(c, w, h, () => { bat(sw * 2.5, h * 0.5, 0.55); bat(sw * 0.5, h * 0.0 + 6, 0.5); bat(sw * 0.5, h, 0.5); });
    /* штукатурка: мелкая зернистость */
    for (let i = 0; i < 600; i++) {
      c.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,' + (0.05 * rnd()).toFixed(3) + ')' : 'rgba(0,0,0,' + (0.1 * rnd()).toFixed(3) + ')';
      c.fillRect(rnd() * w, rnd() * h, 1.4, 1.4);
    }
  }

  /* пол 256×256 (128×128 CSS): две вертикальные доски, швы, гвозди, сучки, разный оттенок */
  function floor(c, w, h) {
    const rnd = A.rng(9913), pw = w / 4, tones = ['#5a3722', '#4e2e1b', '#603c25', '#52321e'];
    for (let i = 0; i < 4; i++) {
      const x = i * pw;
      const g = c.createLinearGradient(x, 0, x + pw, 0);
      g.addColorStop(0, tones[i]); g.addColorStop(0.5, tones[(i + 1) % 4]); g.addColorStop(1, tones[i]);
      c.fillStyle = g; c.fillRect(x, 0, pw, h);
      /* волокна идут вдоль доски (вертикально), период по высоте = h */
      for (let k = 0; k < 20; k++) {
        const gx = x + 3 + rnd() * (pw - 6), amp = 0.6 + rnd() * 1.8, ph = rnd() * TAU, per = 1 + Math.floor(rnd() * 2);
        const dark = rnd() > 0.4;
        c.strokeStyle = dark ? 'rgba(20,8,0,' + (0.12 + rnd() * 0.2).toFixed(3) + ')' : 'rgba(255,200,130,' + (0.06 + rnd() * 0.1).toFixed(3) + ')';
        c.lineWidth = 0.7 + rnd() * 1.3;
        wrap(c, w, h, () => {
          c.beginPath();
          for (let y = 0; y <= h; y += 6) { const xx = gx + Math.sin(ph + y / h * TAU * per) * amp; y ? c.lineTo(xx, y) : c.moveTo(xx, y); }
          c.stroke();
        });
      }
      /* сучок */
      if (rnd() > 0.35) {
        const kx = x + pw * (0.3 + rnd() * 0.4), ky = rnd() * h;
        wrap(c, w, h, () => {
          for (let r = 9; r >= 2; r -= 2) { c.strokeStyle = 'rgba(20,8,0,' + (0.1 + (9 - r) * 0.03).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.ellipse(kx, ky, r * 0.8, r * 1.8, 0, 0, TAU); c.stroke(); }
          c.fillStyle = 'rgba(14,5,0,.4)'; c.beginPath(); c.ellipse(kx, ky, 2, 4, 0, 0, TAU); c.fill();
        });
      }
      /* стык досок по длине (со сдвигом у каждой доски) */
      const jy = (i * 0.37 + 0.2) % 1 * h;
      c.fillStyle = 'rgba(8,3,0,.55)'; c.fillRect(x, jy, pw, 2);
      c.fillStyle = 'rgba(255,200,130,.12)'; c.fillRect(x, jy + 2, pw, 1);
      c.fillStyle = 'rgba(20,10,4,.6)';
      [x + 8, x + pw - 8].forEach(nx => { c.beginPath(); c.arc(nx, jy + 8, 1.6, 0, TAU); c.fill(); c.beginPath(); c.arc(nx, jy - 7, 1.6, 0, TAU); c.fill(); });
    }
    /* швы между досками */
    for (let i = 0; i < 4; i++) {
      c.fillStyle = 'rgba(8,3,0,.75)'; c.fillRect(i * pw - 1.2, 0, 2.4, h);
      c.fillStyle = 'rgba(255,200,130,.1)'; c.fillRect(i * pw + 1.2, 0, 1, h);
    }
    for (let i = 0; i < 260; i++) { c.fillStyle = 'rgba(0,0,0,' + (0.12 * rnd()).toFixed(3) + ')'; c.fillRect(rnd() * w, rnd() * h, 1.3, 1.3); }
  }

  /* плинтус 256×64: тёмное дерево со светлой кромкой */
  function board(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5a4488'); g.addColorStop(0.18, '#46346f'); g.addColorStop(1, '#1d1432');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, 0, w, 3);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, h - 3, w, 3);
    const rnd = A.rng(9929);
    for (let i = 0; i < 14; i++) {
      c.strokeStyle = 'rgba(255,255,255,' + (0.04 + rnd() * 0.06).toFixed(3) + ')'; c.lineWidth = 1;
      const y = 6 + rnd() * (h - 12); c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + (rnd() - 0.5) * 2); c.stroke();
    }
  }

  const ROOM = { wallpaper: [192, 256, wallpaper], floor: [256, 256, floor], board: [256, 64, board] };
  const roomCache = {};
  /* data:URL для CSS-фона комнаты: T.roomUrl('wallpaper' | 'floor' | 'board') */
  T.roomUrl = function (name) {
    if (roomCache[name]) return roomCache[name];
    const r = ROOM[name];
    return (roomCache[name] = make(r[0], r[1], r[2]).toDataURL('image/png'));
  };

  /* ---------- освещение: общий градиент «свет сверху-слева, тень снизу-справа» ---------- */
  const TILES = { wood, weave, quilt, stone, iron, gold, rug, leather };

  T.canvas = function (name) { return make(S, S, TILES[name]); };
  const urlCache = {};
  T.url = function (name) {
    return urlCache[name] || (urlCache[name] = T.canvas(name).toDataURL('image/png'));
  };

  /* Список маленьких работ для фонового прогрева (см. G.art.warm): по плитке за раз, в конце подключение к странице */
  T.jobs = function () {
    const j = Object.keys(TILES).map(n => () => T.url(n));
    ['wallpaper', 'floor', 'board'].forEach(n => j.push(() => T.roomUrl(n)));
    j.push(() => T.install());
    return j;
  };

  /* Общий блок <defs> с плитками; подключается к странице один раз, предметы ссылаются на него как fill="url(#tx-имя)" */
  T.install = function () {
    if (T.ready) return;
    T.ready = true;
    const defs = Object.keys(TILES).map(n =>
      '<pattern id="tx-' + n + '" patternUnits="userSpaceOnUse" width="' + UNITS + '" height="' + UNITS + '"><image href="' + T.url(n) + '" width="' + UNITS + '" height="' + UNITS + '"/></pattern>'
    ).join('') +
      /* дерево с вертикальными волокнами (дверцы, ножки) */
      '<pattern id="tx-woodv" patternUnits="userSpaceOnUse" width="' + UNITS + '" height="' + UNITS + '" patternTransform="rotate(90)"><image href="' + T.url('wood') + '" width="' + UNITS + '" height="' + UNITS + '"/></pattern>' +
      '<linearGradient id="sh-a" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".24"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0a0018" stop-opacity=".34"/></linearGradient>' +
      '<linearGradient id="sh-h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0a0018" stop-opacity=".32"/></linearGradient>' +
      '<linearGradient id="sh-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0a0018" stop-opacity=".36"/></linearGradient>';
    const holder = document.createElement('div');
    holder.id = 'tex-defs';
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><defs>' + defs + '</defs></svg>';
    document.body.appendChild(holder);
  };
})();
