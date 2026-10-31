/* =========================================================
   Комнаты 2 и 3 поиска Золотого ключа: «Старая библиотека» и «Подвал алхимика».
   Подключается после hidden.js: берёт из него G.hidKit и регистрирует комнаты через G.hid.addRoom().
   Всё нарисовано кодом (SVG), без картинок; в сцене только лёгкие анимации (transform/opacity).
   Правило сцены: настоящий ключ рисуется ПОД «прикрытиями» (cover), поэтому часть ключа всегда закрыта.
   ========================================================= */
(function () {
  'use strict';
  if (!window.G || !G.hidKit || !G.hid) return;
  const K = G.hidKit, lcg = K.lcg, W = K.W, H = K.H;

  /* ---------- Ложные ключи (кроме серебряного, ржавого и зелёного из hidden.js) ---------- */
  function ringGold(x, y, rot) {      // золотой, но вместо черепа пустое кольцо
    return `<g transform="translate(${x},${y}) rotate(${rot})" stroke="#4d3300" stroke-width="1.6" stroke-linejoin="round">
      <rect x="-9" y="-2.6" width="34" height="5.2" rx="2" fill="#f1c232"/><rect x="15" y="2" width="4.2" height="8" fill="#f1c232"/><rect x="21" y="2" width="4" height="6" fill="#e0a91c"/>
      <circle cx="-18" cy="0" r="8.6" fill="none" stroke="#f1c232" stroke-width="5.4"/><circle cx="-18" cy="0" r="11.4" fill="none"/><circle cx="-18" cy="0" r="5.9" fill="none"/></g>`;
  }
  function crystalKey(x, y, rot) {    // голубой, ледяной
    return `<g transform="translate(${x},${y}) rotate(${rot})" stroke="#10304a" stroke-width="1.6" stroke-linejoin="round">
      <rect x="-9" y="-2.5" width="32" height="5" rx="2" fill="#8fd4ff"/><rect x="14" y="2" width="4" height="8" fill="#8fd4ff"/><rect x="20" y="2" width="4" height="6" fill="#62b4ea"/>
      <path d="M-31 0 L-20 -12 L-9 0 L-20 12Z" fill="#b8e8ff"/><path d="M-20 -12 V12 M-31 0 H-9" stroke-width="1" opacity=".55"/></g>`;
  }
  function copperKey(x, y, rot) {     // медный с квадратной ручкой
    return `<g transform="translate(${x},${y}) rotate(${rot})" stroke="#3a1a08" stroke-width="1.6" stroke-linejoin="round">
      <rect x="-9" y="-2.5" width="32" height="5" rx="1.5" fill="#c8743a"/><rect x="15" y="2" width="5" height="8" fill="#b4642c"/><rect x="21" y="2" width="4" height="5" fill="#b4642c"/>
      <rect x="-28" y="-9" width="19" height="18" rx="2" fill="#d98648"/><rect x="-23" y="-4.5" width="9" height="9" fill="#3a1a08" stroke="none"/></g>`;
  }
  /* на ниточке: ложный ключ висит на гвоздике (точка привязки — сам ключ) */
  function hanging(x, y, draw, len) {
    return `<g><path d="M${x} ${y - len} V${y - 6}" stroke="#a89878" stroke-width="1.6"/><circle cx="${x}" cy="${y - len}" r="3.6" fill="#8a8a96" stroke="#222" stroke-width="1.4"/>${draw(x, y, 90)}</g>`;
  }

  /* ---------- Мелочи для обеих комнат ---------- */
  const BOOK_COLS = ['#7a1d2e', '#1d4a5a', '#4a2c6a', '#6a4a1d', '#2c5a3a', '#8a3a1a', '#3a3a5a', '#5a1d4a', '#1d3a2a', '#9a7a2a'];
  /* Ряд книг; gaps — промежутки [от, до], где книг нет (там стоят предметы) */
  function booksGap(x0, x1, yb, seed, gaps) {
    const rnd = lcg(seed);
    let x = x0, out = '';
    while (x < x1 - 9) {
      const g = gaps && gaps.find(q => x + 8 > q[0] && x < q[1]);
      if (g) { x = g[1]; continue; }
      const w = 10 + rnd() * 9, h = 38 + rnd() * 30, c = BOOK_COLS[Math.floor(rnd() * BOOK_COLS.length)];
      const lean = rnd() < 0.07;
      out += `<g transform="translate(${x.toFixed(1)},${yb})${lean ? ` rotate(-9 ${w / 2} 0)` : ''}"><rect x="0" y="${-h.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${c}" stroke="#14091e" stroke-width="1.4"/>
        <rect x="0" y="${(-h + 6).toFixed(1)}" width="${w.toFixed(1)}" height="3" fill="#e0b050" opacity=".7"/><rect x="0" y="${(-h * 0.45).toFixed(1)}" width="${w.toFixed(1)}" height="2" fill="#e0b050" opacity=".45"/></g>`;
      x += w + (lean ? 8 : 1);
    }
    return out;
  }
  /* книги, лежащие стопкой: (x,y) — низ по центру */
  function stackH(x, y, cols, w0) {
    let out = '', yy = y;
    cols.forEach((c, i) => {
      const w = (w0 || 70) - i * 6, h = 11 + (i % 2) * 3, dx = i % 2 ? 3 : -2;
      out += `<g transform="translate(${x + dx},${yy})"><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="2" fill="${c}" stroke="#14091e" stroke-width="1.6"/><rect x="${-w / 2 + 3}" y="${-h + 3}" width="${w - 6}" height="2" fill="#e0b050" opacity=".7"/></g>`;
      yy -= h;
    });
    return out;
  }
  function hourglass(x, y) {
    return `<g transform="translate(${x},${y})" stroke="#25140a" stroke-width="1.6"><rect x="-10" y="-36" width="20" height="4" rx="1" fill="#8a5a2a"/><rect x="-10" y="-4" width="20" height="4" rx="1" fill="#8a5a2a"/>
      <path d="M-8 -32 L8 -32 L1 -18 L8 -4 L-8 -4 L-1 -18Z" fill="#cfe9ff" opacity=".75"/><path d="M-5 -8 H5 L1 -14Z" fill="#e8c46a" stroke="none"/></g>`;
  }
  function owl(x, y, s) {             // (x, y) — лапки
    return `<g transform="translate(${x},${y}) scale(${s || 1})" stroke="#2a1a0c" stroke-width="2" stroke-linejoin="round">
      <path d="M-22 0 Q-30 -30 -20 -50 Q-14 -66 0 -66 Q14 -66 20 -50 Q30 -30 22 0Z" fill="#7a5a36"/>
      <path d="M-14 0 Q-18 -24 -10 -40 Q0 -32 10 -40 Q18 -24 14 0Z" fill="#d8c49a" stroke="none"/>
      <path d="M-12 -10 q4 4 8 0 M0 -10 q4 4 8 0 M-6 -20 q4 4 8 0 M-8 -30 q4 4 8 0" fill="none" stroke="#7a5a36" stroke-width="1.6"/>
      <path d="M-22 -40 Q-34 -22 -26 -2 Q-20 -18 -18 -36Z" fill="#5e4326"/><path d="M22 -40 Q34 -22 26 -2 Q20 -18 18 -36Z" fill="#5e4326"/>
      <path d="M-16 -60 L-23 -80 L-6 -66Z M16 -60 L23 -80 L6 -66Z" fill="#7a5a36"/>
      <circle cx="-9" cy="-54" r="9.5" fill="#efe6c8"/><circle cx="9" cy="-54" r="9.5" fill="#efe6c8"/>
      <g class="blinker"><circle cx="-9" cy="-54" r="5.6" fill="#ffc83a" stroke="none"/><circle cx="9" cy="-54" r="5.6" fill="#ffc83a" stroke="none"/><circle cx="-9" cy="-54" r="2.5" fill="#111" stroke="none"/><circle cx="9" cy="-54" r="2.5" fill="#111" stroke="none"/></g>
      <path d="M-3.4 -47 L3.4 -47 L0 -40Z" fill="#e08a1c"/><path d="M-12 0 v6 M-6 0 v6 M6 0 v6 M12 0 v6" stroke="#c8861c" stroke-width="3.4"/></g>`;
  }
  function scroll(x, y, len, rot, c) {  // свиток: (x,y) — середина, лежит вдоль оси x до поворота
    return `<g transform="translate(${x},${y}) rotate(${rot})" stroke="#4a3a1a" stroke-width="1.6"><rect x="${-len / 2}" y="-6" width="${len}" height="12" rx="6" fill="${c || '#e8dcb4'}"/>
      <ellipse cx="${-len / 2 + 3}" cy="0" rx="3.4" ry="6" fill="#cdbd8a"/><ellipse cx="${len / 2 - 3}" cy="0" rx="3.4" ry="6" fill="#cdbd8a"/><rect x="${-len / 2 + 14}" y="-6.6" width="5" height="13.2" fill="#a02a2a" stroke="none"/></g>`;
  }

  /* =========================================================
     Комната 2 — «Старая библиотека»
     ========================================================= */
  const LIB_DEFS = `
    <pattern id="hlwall" width="64" height="64" patternUnits="userSpaceOnUse"><rect width="64" height="64" fill="#1d3a36"/>
      <path d="M32 6 L52 32 L32 58 L12 32Z" fill="none" stroke="#2b5249" stroke-width="2"/><path d="M32 20 L41 32 L32 44 L23 32Z" fill="#27493f"/>
      <circle cx="0" cy="0" r="2.6" fill="#8a6a28" opacity=".55"/><circle cx="64" cy="0" r="2.6" fill="#8a6a28" opacity=".55"/><circle cx="0" cy="64" r="2.6" fill="#8a6a28" opacity=".55"/><circle cx="64" cy="64" r="2.6" fill="#8a6a28" opacity=".55"/></pattern>
    <pattern id="hlfloor" width="160" height="44" patternUnits="userSpaceOnUse"><rect width="160" height="44" fill="#4b2f1b"/>
      <rect width="160" height="3" fill="#25140a"/><rect y="22" width="160" height="3" fill="#25140a"/><path d="M80 0V22 M20 22V44 M120 22V44" stroke="#25140a" stroke-width="3"/>
      <path d="M6 12H70 M92 12H150 M30 34H108 M126 34H156" stroke="#5e3b22" stroke-width="1.6" opacity=".7"/></pattern>
    <linearGradient id="hlglass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1236"/><stop offset="1" stop-color="#37508a"/></linearGradient>
    <linearGradient id="hlbeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd2ff" stop-opacity=".26"/><stop offset="1" stop-color="#bcd2ff" stop-opacity="0"/></linearGradient>
    <radialGradient id="hllamp" cx=".5" cy=".5"><stop offset="0" stop-color="#c4ffa0" stop-opacity=".55"/><stop offset="1" stop-color="#c4ffa0" stop-opacity="0"/></radialGradient>
    <radialGradient id="hlglobe" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#6aa8e0"/><stop offset="1" stop-color="#1c3f72"/></radialGradient>`;

  let libCache = '';
  function libScene() {
    if (libCache) return libCache;
    const rnd = lcg(19);
    let panels = '', hi = '', stars = '';
    for (let x = 14; x < W; x += 100) { panels += `<rect x="${x}" y="384" width="82" height="76" rx="3"/>`; hi += `<path d="M${x + 3} 457 V387 H${x + 79}"/>`; }
    for (let i = 0; i < 16; i++) stars += `<circle cx="${(420 + rnd() * 160).toFixed(1)}" cy="${(120 + rnd() * 120).toFixed(1)}" r="${(0.7 + rnd() * 1.2).toFixed(1)}" fill="#fff" opacity=".85"/>`;

    /* левый книжный шкаф: x 36–316, полки на y = 184, 276, 368, 460 */
    const case1 = `<g>
      <rect x="26" y="62" width="300" height="18" rx="3" fill="#5a371c" stroke="#1d1008" stroke-width="3"/>
      <rect x="36" y="78" width="280" height="394" fill="#4a2c17" stroke="#1d1008" stroke-width="4"/>
      <rect x="48" y="92" width="256" height="372" fill="#1a0f08"/>
      ${booksGap(52, 300, 184, 3, [[236, 266]])}${K.skull(251, 184, 1)}
      ${booksGap(52, 300, 276, 8, [[96, 128], [206, 232]])}${hourglass(112, 276)}${K.jar(219, 276, '#7ee022')}
      ${booksGap(52, 300, 368, 12, [[216, 262]])}${K.pumpkinH(240, 368, 0.78, false)}
      ${booksGap(52, 300, 460, 17, [[52, 136]])}${stackH(94, 460, ['#5a1d4a', '#1d4a5a', '#7a1d2e', '#2c5a3a'], 76)}${K.candle(94, 428, 14, 0.8)}
      <g fill="#5a371c" stroke="#1d1008" stroke-width="2.4"><rect x="48" y="184" width="256" height="8"/><rect x="48" y="276" width="256" height="8"/><rect x="48" y="368" width="256" height="8"/><rect x="48" y="460" width="256" height="8"/></g>
      <rect x="44" y="96" width="264" height="4" fill="#c8962e" stroke="#5a3a08" stroke-width="1"/></g>`;

    /* приставная лесенка (стоит на полу, опирается на шкаф) */
    let rungs = '';
    for (let i = 0; i < 8; i++) { const t = (140 + i * 46 - 98) / (472 - 98), xl = 262 + (276 - 262) * t, xr = 298 + (312 - 298) * t, y = 140 + i * 46; rungs += `<path d="M${xl.toFixed(1)} ${y} H${xr.toFixed(1)}" stroke="#c8962e" stroke-width="5" stroke-linecap="round"/>`; }
    const ladder = `<g><path d="M262 98 L276 472 M298 98 L312 472" stroke="#25140a" stroke-width="10" stroke-linecap="round"/><path d="M262 98 L276 472 M298 98 L312 472" stroke="#7a4a22" stroke-width="6" stroke-linecap="round"/>${rungs}
      <circle cx="262" cy="98" r="6" fill="#d0a030" stroke="#5a3a08" stroke-width="1.6"/><circle cx="298" cy="98" r="6" fill="#d0a030" stroke="#5a3a08" stroke-width="1.6"/></g>`;

    /* окно с луной */
    const win = `<g>
      <path d="M392 332 V190 Q392 92 500 92 Q608 92 608 190 V332Z" fill="#6c6c7c" stroke="#232330" stroke-width="4"/>
      <path d="M404 332 V192 Q404 106 500 106 Q596 106 596 192 V332Z" fill="url(#hlglass)"/>
      ${stars}<circle cx="548" cy="170" r="26" fill="#ffe9a8"/><circle cx="558" cy="163" r="23" fill="#10163a"/>
      <circle cx="548" cy="170" r="60" fill="url(#hlmoon)"/>
      <path d="M404 332 V288 q14 -10 18 -30 q-4 -14 -2 -22 q12 10 14 26 q10 -16 8 -34 q10 14 8 36 q12 -6 22 -22 q-2 18 -10 28 q14 2 22 16 V332Z" fill="#070a1c"/>
      <path d="M470 150 q8 -6 14 0 q-4 -2 -8 2 q-4 -4 -6 -2Z M520 124 q8 -6 14 0 q-4 -2 -8 2 q-4 -4 -6 -2Z" fill="#05060f"/>
      <path d="M500 106 V332 M404 222 H596" stroke="#3a3a4a" stroke-width="6"/>
      <rect x="380" y="330" width="240" height="16" rx="3" fill="#7a7a8a" stroke="#232330" stroke-width="2.4"/></g>`;

    /* правая штора (левая — «прикрытие» для ключа) */
    const curtainR = `<g><path d="M628 76 H526 C530 140 532 200 542 246 C550 280 544 312 524 340 H628Z" fill="#7a1d45" stroke="#2a0a18" stroke-width="2.4"/>
      <path d="M596 82 C590 150 598 250 604 338 M562 80 C558 150 560 240 570 336" fill="none" stroke="#5a1232" stroke-width="3.4"/>
      <path d="M628 250 C600 262 568 262 542 246" fill="none" stroke="#d0a030" stroke-width="5" stroke-linecap="round"/><path d="M620 252 v16" stroke="#d0a030" stroke-width="4"/><circle cx="620" cy="272" r="5" fill="#d0a030"/></g>
      <path d="M368 62 H632 V84 Q600 98 560 84 Q520 98 500 84 Q460 98 440 84 Q400 98 368 84Z" fill="#8a2350" stroke="#2a0a18" stroke-width="2.4"/><rect x="362" y="56" width="276" height="8" rx="3" fill="#c8962e" stroke="#5a3a08" stroke-width="1.6"/>`;

    /* настенные подсвечники */
    const sconce = x => `<g><path d="M${x - 14} 270 H${x + 14} M${x} 270 V290" stroke="#c8962e" stroke-width="5" stroke-linecap="round"/><path d="M${x - 14} 270 q0 -8 6 -8" stroke="#c8962e" stroke-width="3" fill="none"/>${K.candle(x, 262, 24, 0.9)}</g>`;

    /* стеклянный шкаф справа: x 706–972, верх y=136 */
    let cab = '';
    const shelfY = [250, 342, 434];
    [[722, 836], [848, 962]].forEach((d, i) => {
      cab += `<rect x="${d[0]}" y="166" width="${d[1] - d[0]}" height="292" fill="#101c22" stroke="#25140a" stroke-width="3"/>`;
      shelfY.forEach((y, j) => { cab += booksGap(d[0] + 4, d[1] - 4, y, 40 + i * 7 + j * 3, i === 1 && j === 2 ? [[900, 944]] : null) + `<rect x="${d[0]}" y="${y}" width="${d[1] - d[0]}" height="7" fill="#5a371c" stroke="#1d1008" stroke-width="2"/>`; });
      cab += `<path d="M${d[0] + 14} 166 L${d[0] + 64} 166 L${d[0] + 6} 300Z M${d[0] + 30} 458 L${d[1] - 8} 330 L${d[1] - 8} 380 L${d[0] + 70} 458Z" fill="#fff" opacity=".05"/>`;
    });
    cab += `<g>${K.skull(926, 434, 0.9)}</g>`;
    const cabinet = `<g><rect x="696" y="136" width="286" height="18" rx="3" fill="#5a371c" stroke="#1d1008" stroke-width="3"/>
      <rect x="706" y="150" width="266" height="322" fill="#4a2c17" stroke="#1d1008" stroke-width="4"/>${cab}
      <rect x="840" y="160" width="12" height="302" fill="#4a2c17"/><circle cx="836" cy="320" r="4.6" fill="#d0a030" stroke="#5a3a08" stroke-width="1.4"/><circle cx="856" cy="320" r="4.6" fill="#d0a030" stroke="#5a3a08" stroke-width="1.4"/></g>`;

    /* письменный стол: верх y≈418–436, тумбы по бокам */
    const desk = `<g>
      <rect x="430" y="458" width="84" height="104" fill="#4a2c17" stroke="#1d1008" stroke-width="3.4"/><rect x="596" y="458" width="84" height="104" fill="#4a2c17" stroke="#1d1008" stroke-width="3.4"/>
      <rect x="514" y="458" width="82" height="104" fill="#150c06"/>
      <rect x="440" y="466" width="64" height="40" rx="2" fill="#5e3a1c" stroke="#25140a" stroke-width="2.4"/><rect x="440" y="512" width="64" height="40" rx="2" fill="#5e3a1c" stroke="#25140a" stroke-width="2.4"/>
      <circle cx="472" cy="486" r="4.4" fill="#d0a030" stroke="#5a3a08" stroke-width="1.4"/><circle cx="472" cy="532" r="4.4" fill="#d0a030" stroke="#5a3a08" stroke-width="1.4"/>
      <rect x="606" y="512" width="64" height="40" rx="2" fill="#5e3a1c" stroke="#25140a" stroke-width="2.4"/><circle cx="638" cy="532" r="4.4" fill="#d0a030" stroke="#5a3a08" stroke-width="1.4"/>
      <rect x="606" y="466" width="64" height="42" fill="#0d0703" stroke="#25140a" stroke-width="2.4"/>
      <rect x="418" y="434" width="276" height="26" fill="#5a371c" stroke="#25140a" stroke-width="3.4"/>
      <polygon points="438,414 674,414 694,436 418,436" fill="#7c4c26" stroke="#25140a" stroke-width="3.4"/>
      <path d="M452 424 H660" stroke="#8d5a2e" stroke-width="2" opacity=".6"/>
      <!-- лампа -->
      <circle cx="476" cy="396" r="64" fill="url(#hllamp)"/>
      <ellipse cx="476" cy="418" rx="17" ry="4.6" fill="#c8962e" stroke="#5a3a08" stroke-width="1.6"/><path d="M476 416 V398" stroke="#c8962e" stroke-width="4"/>
      <path d="M452 400 Q476 372 504 396 L498 402 Q476 386 458 406Z" fill="#1f7a52" stroke="#0a2a1c" stroke-width="2.4"/>
      <!-- раскрытая книга -->
      <g transform="translate(560,418)" stroke="#14091e" stroke-width="1.8" stroke-linejoin="round"><path d="M-44 0 Q-22 -9 0 0 V-14 Q-22 -23 -44 -14Z" fill="#efe3c0"/><path d="M44 0 Q22 -9 0 0 V-14 Q22 -23 44 -14Z" fill="#e6d8b0"/>
        <path d="M-38 -6 q16 -6 32 0 M-38 -11 q16 -6 32 0 M6 -6 q16 -6 32 0 M6 -11 q16 -6 32 0" fill="none" stroke="#8a7a58" stroke-width="1.2"/><path d="M-46 2 Q-22 -7 0 2 Q22 -7 46 2" fill="none" stroke="#7a1d2e" stroke-width="3"/></g>
      <!-- чернильница и перо -->
      <g transform="translate(646,418)"><ellipse cx="0" cy="-5" rx="9" ry="8" fill="#1a1a30" stroke="#05050c" stroke-width="1.8"/><rect x="-4" y="-16" width="8" height="5" fill="#6a4a2a"/>
        <path d="M2 -14 Q22 -50 38 -62 Q30 -38 6 -12Z" fill="#e8e0f0" stroke="#3a3050" stroke-width="1.4"/><path d="M2 -14 L38 -62" stroke="#3a3050" stroke-width="1.4"/></g></g>`;

    /* кресло справа внизу */
    const chair = `<g><ellipse cx="840" cy="612" rx="104" ry="11" fill="#000" opacity=".32"/>
      <path d="M770 548 V452 Q770 424 798 424 H886 Q914 424 914 452 V548Z" fill="#7a2a2a" stroke="#2a0a18" stroke-width="3.4"/>
      <g fill="#531818"><circle cx="802" cy="462" r="3.4"/><circle cx="842" cy="462" r="3.4"/><circle cx="882" cy="462" r="3.4"/><circle cx="822" cy="494" r="3.4"/><circle cx="862" cy="494" r="3.4"/><circle cx="802" cy="522" r="3.4"/><circle cx="842" cy="522" r="3.4"/><circle cx="882" cy="522" r="3.4"/></g>
      <rect x="752" y="524" width="176" height="52" rx="12" fill="#903636" stroke="#2a0a18" stroke-width="3.4"/>
      <rect x="738" y="488" width="40" height="104" rx="16" fill="#7a2a2a" stroke="#2a0a18" stroke-width="3.4"/><rect x="902" y="488" width="40" height="104" rx="16" fill="#7a2a2a" stroke="#2a0a18" stroke-width="3.4"/>
      <rect x="752" y="576" width="176" height="12" fill="#6a2222" stroke="#2a0a18" stroke-width="2.4"/>
      <rect x="748" y="588" width="14" height="22" rx="3" fill="#3a2010" stroke="#150a04" stroke-width="2"/><rect x="918" y="588" width="14" height="22" rx="3" fill="#3a2010" stroke="#150a04" stroke-width="2"/></g>`;

    /* глобус на подставке: центр шара (340,504) */
    const globe = `<g><path d="M340 548 L306 606 M340 548 L374 606 M340 548 V614" stroke="#25140a" stroke-width="9" stroke-linecap="round"/><path d="M340 548 L306 606 M340 548 L374 606 M340 548 V614" stroke="#6a4020" stroke-width="5" stroke-linecap="round"/>
      <circle cx="340" cy="504" r="44" fill="url(#hlglobe)" stroke="#0a1a30" stroke-width="3"/>
      <path d="M318 482 q14 -10 26 -2 q-2 12 -12 14 q-6 12 -16 6Z M350 508 q12 -6 22 4 q-4 16 -16 18 q-8 -8 -6 -22Z M312 516 q8 2 10 12 q-8 6 -12 -4Z" fill="#7aa850" opacity=".9"/>
      <path d="M340 452 A52 52 0 0 1 340 556" transform="rotate(-23 340 504)" fill="none" stroke="#c8962e" stroke-width="5"/><ellipse cx="340" cy="504" rx="46" ry="10" transform="rotate(-23 340 504)" fill="none" stroke="#c8962e" stroke-width="3"/>
      <circle cx="324" cy="488" r="9" fill="#fff" opacity=".18"/></g>`;

    /* корзина со свитками: задняя часть (передняя — «прикрытие») */
    const basketBack = `<g>${scroll(84, 538, 56, -66, '#e8dcb4')}${scroll(126, 536, 60, -102, '#dccfa2')}${scroll(104, 530, 52, -84, '#efe5c0')}</g>`;
    /* нижние книги стопки (верхние — «прикрытие») */
    const booksBase = `<g>${stackH(226, 626, ['#4a2c6a', '#2c5a3a'], 104)}</g>`;

    libCache = `
      <rect width="${W}" height="470" fill="url(#hlwall)"/>
      <rect y="366" width="${W}" height="108" fill="#3b2313"/><g fill="none" stroke="#25140a" stroke-width="2.4">${panels}</g><g fill="none" stroke="#5a371c" stroke-width="1.6" opacity=".8">${hi}</g>
      <rect y="358" width="${W}" height="12" fill="#5a371c" stroke="#25140a" stroke-width="2"/><rect y="466" width="${W}" height="10" fill="#2a170c"/>
      <polygon points="0,474 ${W},474 ${W},${H} 0,${H}" fill="url(#hlfloor)"/>
      <ellipse cx="560" cy="606" rx="330" ry="42" fill="#1d4a3a" stroke="#c8962e" stroke-width="5"/><ellipse cx="560" cy="606" rx="284" ry="32" fill="none" stroke="#c8962e" stroke-width="2.4" stroke-dasharray="9 6" opacity=".8"/><ellipse cx="560" cy="606" rx="200" ry="22" fill="#26604a" opacity=".7"/>
      ${case1}${ladder}${win}${curtainR}${sconce(350)}${sconce(654)}${cabinet}${desk}${chair}${globe}${basketBack}${booksBase}
      <polygon points="404,332 596,332 800,${H} 200,${H}" fill="url(#hlbeam)" pointer-events="none"/>
      <g transform="translate(646,128)"><g class="drift"><path d="M-30 6 Q-15 -4 0 6 V-12 Q-15 -22 -30 -12Z" fill="#efe3c0" stroke="#14091e" stroke-width="1.8"/><path d="M30 6 Q15 -4 0 6 V-12 Q15 -22 30 -12Z" fill="#e6d8b0" stroke="#14091e" stroke-width="1.8"/>
        <path d="M-30 -12 Q-50 -34 -26 -34 Q-18 -26 -14 -16Z M30 -12 Q50 -34 26 -34 Q18 -26 14 -16Z" fill="#cfd8ff" stroke="#14091e" stroke-width="1.4" opacity=".85"/><circle cx="0" cy="-26" r="3" fill="#ffe9a8" opacity=".9"/></g></g>
      ${K.web(0, 0, 1.1, false)}${K.web(W, 0, 1.1, true)}`;
    return libCache;
  }

  /* Прикрытия: рисуются поверх ключа */
  const LIB_SPOTS = [
    { name: 'за шторой', x: 471, y: 324, rot: -3,
      cover: () => `<g><path d="M372 76 H474 C470 140 468 200 458 246 C450 280 456 312 476 340 H372Z" fill="#7a1d45" stroke="#2a0a18" stroke-width="2.4"/>
        <path d="M404 82 C410 150 402 250 396 338 M438 80 C442 150 440 240 430 336" fill="none" stroke="#5a1232" stroke-width="3.4"/>
        <path d="M372 250 C400 262 432 262 458 246" fill="none" stroke="#d0a030" stroke-width="5" stroke-linecap="round"/><path d="M380 252 v16" stroke="#d0a030" stroke-width="4"/><circle cx="380" cy="272" r="5" fill="#d0a030"/></g>` },
    { name: 'в ящике стола', x: 642, y: 487, rot: -5,
      cover: () => `<g><path d="M612 470 L636 466 L644 482 L630 494 L612 492Z" fill="#efe3c0" stroke="#8a7a58" stroke-width="1.6"/><path d="M618 476 H634 M618 482 H638" stroke="#8a7a58" stroke-width="1.2"/>
        <rect x="602" y="496" width="74" height="22" rx="2" fill="#6a4222" stroke="#25140a" stroke-width="2.4"/><circle cx="639" cy="508" r="4.4" fill="#d0a030" stroke="#5a3a08" stroke-width="1.4"/></g>` },
    { name: 'под креслом', x: 848, y: 604, rot: 4,
      cover: () => `<g><ellipse cx="814" cy="603" rx="35" ry="12.5" fill="#274a7a" stroke="#0a1a30" stroke-width="2.4"/><ellipse cx="814" cy="600" rx="28" ry="8" fill="#3a64a0" opacity=".8"/>
        <path d="M779 603 l-8 6 M779 603 l-9 -1 M849 603 l8 6 M849 603 l9 -1" stroke="#e8c46a" stroke-width="2.4" stroke-linecap="round"/><circle cx="814" cy="601" r="3" fill="#e8c46a"/>
        <rect x="918" y="588" width="14" height="22" rx="3" fill="#3a2010" stroke="#150a04" stroke-width="2"/></g>` },
    { name: 'у глобуса', x: 354, y: 604, rot: 8,
      cover: () => `<g><path d="M340 548 V614" stroke="#25140a" stroke-width="9" stroke-linecap="round"/><path d="M340 548 V614" stroke="#6a4020" stroke-width="5" stroke-linecap="round"/>${scroll(334, 606, 52, 14, '#efe3c0')}</g>` },
    { name: 'в корзине со свитками', x: 112, y: 557, rot: -80,
      cover: () => `<g>${scroll(92, 566, 58, 22, '#efe3c0')}<path d="M62 566 H152 L142 628 H72Z" fill="#b4833a" stroke="#4a2c10" stroke-width="3"/>
        <g fill="none" stroke="#7a5420" stroke-width="2"><path d="M65 580 H149 M67 594 H147 M69 608 H145 M71 620 H143"/><path d="M82 566 L78 628 M102 566 V628 M122 566 L126 628"/></g>
        <path d="M62 566 H152" stroke="#8a6228" stroke-width="7" stroke-linecap="round"/></g>` },
    { name: 'в стопке книг', x: 274, y: 592, rot: 3,
      cover: () => `<g>${stackH(224, 596, ['#7a1d2e', '#1d4a5a'], 92)}</g>` },
    { name: 'за совой на шкафу', x: 868, y: 128, rot: -3,
      cover: () => `<g>${owl(848, 136, 1)}</g>` }
  ];
  const LIB_DECOYS = [
    { id: 'silver', x: 548, y: 410, draw: (x, y) => K.silverKey(x, y, 6) },
    { id: 'ring', x: 772, y: 200, draw: (x, y) => hanging(x, y, ringGold, 44) },
    { id: 'crystal', x: 186, y: 536, draw: (x, y) => crystalKey(x, y, -20) }
  ];
  const lib = { n: 2, name: 'Старая библиотека', icon: '📚', spots: LIB_SPOTS, decoys: LIB_DECOYS, first: 140, again: 40, minFirst: 60, minAgain: 10 };
  lib.svg = spot => K.compose(lib, spot, LIB_DEFS, libScene());
  G.hid.addRoom(lib);

  /* =========================================================
     Комната 3 — «Подвал алхимика»
     ========================================================= */
  function flask(x, y, c, s) {          // круглая колба; (x, y) — дно
    return `<g transform="translate(${x},${y}) scale(${s || 1})" stroke="#0a1018" stroke-width="1.8" stroke-linejoin="round"><circle cx="0" cy="-12" r="12" fill="${c}" opacity=".94"/><rect x="-4" y="-35" width="8" height="13" fill="#cfe9ff" opacity=".6"/><rect x="-5.4" y="-39" width="10.8" height="5" rx="1.4" fill="#8a6a3a"/><circle cx="-4.4" cy="-16" r="3" fill="#fff" opacity=".55" stroke="none"/></g>`;
  }
  function vial(x, y, c, s) {           // высокий флакон
    return `<g transform="translate(${x},${y}) scale(${s || 1})" stroke="#0a1018" stroke-width="1.8" stroke-linejoin="round"><rect x="-6.5" y="-30" width="13" height="30" rx="4.5" fill="${c}" opacity=".94"/><rect x="-3.4" y="-38" width="6.8" height="9" fill="#cfe9ff" opacity=".6"/><rect x="-4.6" y="-42" width="9.2" height="5" rx="1.4" fill="#8a6a3a"/><rect x="-3.6" y="-25" width="2.6" height="14" rx="1.3" fill="#fff" opacity=".5" stroke="none"/></g>`;
  }
  function erlen(x, y, c, s) {          // коническая колба
    return `<g transform="translate(${x},${y}) scale(${s || 1})" stroke="#0a1018" stroke-width="1.8" stroke-linejoin="round"><path d="M-4.4 -38 H4.4 V-25 L15 0 H-15 L-4.4 -25Z" fill="${c}" opacity=".94"/><rect x="-5.8" y="-42" width="11.6" height="5" rx="1.4" fill="#8a6a3a"/><path d="M-6 -12 L-2 -22" stroke="#fff" stroke-width="2.4" opacity=".5" stroke-linecap="round"/></g>`;
  }
  const bone = (d, w) => `<path d="${d}" fill="none" stroke="#3a2f20" stroke-width="${(w || 4.6) + 2.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#e4dcc4" stroke-width="${w || 4.6}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const torch = (x, y) => `<g><circle cx="${x}" cy="${y - 30}" r="66" fill="url(#hctorch)"/><path d="M${x - 4} ${y} L${x - 7} ${y + 38} H${x + 7} L${x + 4} ${y}Z" fill="#4a2c17" stroke="#120a04" stroke-width="2"/>
    <path d="M${x - 12} ${y - 8} L${x - 9} ${y + 2} H${x + 9} L${x + 12} ${y - 8}Z" fill="#2a2018" stroke="#0a0806" stroke-width="2"/>
    <g class="flame"><path d="M${x} ${y - 38} q12 16 0 30 q-12 -10 0 -30z" fill="#ff8a1f"/><path d="M${x} ${y - 28} q6 8 0 18 q-6 -6 0 -18z" fill="#fff0a0"/></g></g>`;
  /* пентаграмма на полу в перспективе: центр (cx,cy), полуоси rx и ry */
  function pentagram(cx, cy, rx, ry) {
    const p = [0, 1, 2, 3, 4].map(k => { const a = (-90 + k * 72) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
    const star = [0, 2, 4, 1, 3, 0].map(i => p[i][0].toFixed(1) + ' ' + p[i][1].toFixed(1)).join(' L');
    return `<g fill="none" stroke="#a46bff" stroke-width="3" opacity=".6" class="glowp"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.88}" ry="${ry * 0.88}" stroke-width="1.6"/><path d="M${star}Z" stroke-linejoin="round"/></g>`;
  }

  const CEL_DEFS = `
    <pattern id="hcwall" width="96" height="48" patternUnits="userSpaceOnUse"><rect width="96" height="48" fill="#34404d"/>
      <rect x="4" y="4" width="40" height="16" fill="#3f4c5c" opacity=".7"/><rect x="52" y="28" width="40" height="16" fill="#3f4c5c" opacity=".6"/><rect x="54" y="5" width="36" height="14" fill="#2a3542" opacity=".7"/><rect x="6" y="29" width="36" height="14" fill="#2a3542" opacity=".65"/>
      <path d="M0 0H96 M0 24H96 M0 48H96 M48 0V24 M0 24V48 M96 24V48" stroke="#1a222c" stroke-width="3"/></pattern>
    <pattern id="hcfloor" width="130" height="56" patternUnits="userSpaceOnUse"><rect width="130" height="56" fill="#2f3844"/>
      <rect x="5" y="4" width="55" height="20" fill="#3a4551" opacity=".55"/><rect x="70" y="32" width="54" height="20" fill="#3a4551" opacity=".55"/>
      <path d="M0 0H130 M0 28H130 M65 0V28 M0 28V56 M130 28V56" stroke="#141a22" stroke-width="3"/></pattern>
    <linearGradient id="hcshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070c" stop-opacity=".8"/><stop offset="1" stop-color="#05070c" stop-opacity="0"/></linearGradient>
    <radialGradient id="hctorch" cx=".5" cy=".5"><stop offset="0" stop-color="#ffb347" stop-opacity=".6"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="hcfire" cx=".5" cy=".6"><stop offset="0" stop-color="#ffd060" stop-opacity=".85"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
    <radialGradient id="hcgreen" cx=".5" cy=".5"><stop offset="0" stop-color="#7dff8a" stop-opacity=".55"/><stop offset="1" stop-color="#7dff8a" stop-opacity="0"/></radialGradient>`;

  let celCache = '';
  function celScene() {
    if (celCache) return celCache;

    /* бочка: в сцене только тёмное «жерло», корпус — «прикрытие» */
    const barrelBack = `<g><ellipse cx="112" cy="522" rx="52" ry="12" fill="#0a0604" stroke="#4a2c17" stroke-width="5"/><ellipse cx="112" cy="524" rx="40" ry="7" fill="#1e4a24" opacity=".6"/></g>`;

    /* клетка со скелетом: купол, дно, скелет; прутья — «прикрытие» */
    const cage = `<g><path d="M240 46 V84" stroke="#1a1410" stroke-width="4"/><circle cx="240" cy="87" r="7" fill="none" stroke="#2c2c36" stroke-width="3.4"/>
      ${bone('M240 146 V198', 5)}${bone('M225 157 Q240 166 255 157 M223 169 Q240 180 257 169 M226 181 Q240 191 254 181', 3.4)}
      ${bone('M226 156 L205 176 L209 202 M254 156 L275 176 L271 202', 4.2)}
      <path d="M224 200 Q240 216 256 200 L252 210 Q240 222 228 210Z" fill="#e4dcc4" stroke="#3a2f20" stroke-width="2"/>
      ${bone('M228 210 L206 216 L211 231 M252 210 L277 214 L270 231', 4.6)}
      <path d="M226 142 V134 Q224 122 240 122 Q256 122 254 134 V142 Q250 146 246 142 H234 Q230 146 226 142Z" fill="#efe6cf" stroke="#3a2f20" stroke-width="1.8"/>
      <ellipse cx="234" cy="134" rx="3.6" ry="4.6" fill="#0a0610"/><ellipse cx="246" cy="134" rx="3.6" ry="4.6" fill="#0a0610"/><circle cx="234" cy="134" r="1.9" fill="#7dff8a" class="glowp"/><circle cx="246" cy="134" r="1.9" fill="#7dff8a" class="glowp"/>
      <path d="M196 104 Q240 62 284 104Z" fill="#2c2c36" stroke="#0a0a10" stroke-width="3"/><ellipse cx="240" cy="233" rx="49" ry="8" fill="#2c2c36" stroke="#0a0a10" stroke-width="3"/></g>`;

    /* полка с зельями: две доски, бутылки (кроме тех, что «прикрывают» ключ) */
    const shelf = `<g>
      <rect x="360" y="226" width="284" height="9" fill="#5a371c" stroke="#25140a" stroke-width="2.6"/><rect x="360" y="312" width="284" height="9" fill="#5a371c" stroke="#25140a" stroke-width="2.6"/>
      <path d="M380 235 V252 L396 235 M624 235 V252 L608 235 M380 321 V338 L396 321 M624 321 V338 L608 321" stroke="#25140a" stroke-width="3.4" fill="#4a2c17"/>
      ${vial(384, 226, '#9b5de5')}${flask(416, 226, '#ff7a3a')}${erlen(452, 226, '#4fd36b')}${vial(486, 226, '#ffd23a')}${K.jar(522, 226, '#c04cff')}${flask(556, 226, '#38c8ff')}${vial(590, 226, '#ff4a7a')}${erlen(624, 226, '#7ee022', 0.95)}
      ${flask(384, 312, '#6a5cff')}${vial(416, 312, '#2dd4a4')}${K.skull(450, 312, 1.1)}${erlen(584, 312, '#ff9a2a')}${flask(618, 312, '#e83a8a')}</g>`;

    /* печь с трубой */
    let bricks = '';
    for (let r = 0; r < 8; r++) { const y = 262 + r * 26; bricks += `<path d="M700 ${y}H872"/>`; for (let x = 700 + (r % 2 ? 22 : 0); x < 872; x += 44) bricks += `<path d="M${x} ${y}V${y + 26}"/>`; }
    const furnace = `<g>
      <rect x="760" y="0" width="52" height="252" fill="#3d4552" stroke="#12161d" stroke-width="3"/><path d="M760 62H812 M760 132H812 M760 202H812" stroke="#262c36" stroke-width="6"/>
      <rect x="700" y="244" width="172" height="228" fill="#566070" stroke="#12161d" stroke-width="4"/><g stroke="#2e3640" stroke-width="2" opacity=".85">${bricks}</g>
      <rect x="690" y="234" width="192" height="18" rx="3" fill="#3a4250" stroke="#12161d" stroke-width="3"/>
      <path d="M728 472 V388 Q728 338 786 338 Q844 338 844 388 V472Z" fill="#090507" stroke="#12161d" stroke-width="4"/>
      <ellipse cx="786" cy="438" rx="76" ry="64" fill="url(#hcfire)" class="glowp"/>
      <path d="M738 472 Q760 452 786 458 Q812 450 834 472Z" fill="#ff5a1a"/><path d="M752 472 Q768 462 784 466 Q804 460 820 472Z" fill="#ffb02e"/>
      <g class="flame"><path d="M760 466 Q748 430 776 398 Q780 430 796 420 Q806 442 800 466Z" fill="#ff6a1a"/><path d="M784 466 Q778 436 800 412 Q810 440 818 466Z" fill="#ff9a2a"/><path d="M772 466 Q768 446 786 432 Q794 450 792 466Z" fill="#ffe06a"/></g></g>`;

    /* лестница (вид сбоку); тёмная ниша под ней — тайник */
    const stairs = `<g><polygon points="860,472 860,408 900,408 900,372 940,372 940,336 980,336 980,300 1000,300 1000,472" fill="#5a371c" stroke="#25140a" stroke-width="3.4"/>
      <g fill="#7c4c26" stroke="#25140a" stroke-width="2"><rect x="860" y="408" width="40" height="8"/><rect x="900" y="372" width="40" height="8"/><rect x="940" y="336" width="40" height="8"/><rect x="980" y="300" width="20" height="8"/></g>
      <polygon points="886,472 1000,472 1000,330 886,426" fill="#06080c" stroke="#12161d" stroke-width="3"/>
      <path d="M868 420 V470 M876 424 V470" stroke="#3a2010" stroke-width="2"/></g>`;

    /* стол алхимика: верх y≈428–448; левая сторона занята горелкой с колбой */
    const table = `<g>
      <path d="M356 452 V576 M664 452 V576" stroke="#25140a" stroke-width="17" stroke-linecap="round"/><path d="M356 452 V576 M664 452 V576" stroke="#5a371c" stroke-width="11" stroke-linecap="round"/>
      <rect x="352" y="522" width="316" height="10" fill="#4a2c17" stroke="#25140a" stroke-width="2.4"/>
      ${K.skull(404, 522, 1.2)}${K.jar(470, 522, '#7ee022')}${K.jar(498, 522, '#c04cff')}${stackH(600, 522, ['#4a2c6a', '#1d4a5a', '#7a1d2e'], 66)}
      <rect x="338" y="446" width="344" height="22" fill="#5a371c" stroke="#25140a" stroke-width="3.4"/>
      <polygon points="362,428 658,428 682,448 338,448" fill="#7c4c26" stroke="#25140a" stroke-width="3.4"/><path d="M372 438 H650" stroke="#8d5a2e" stroke-width="2" opacity=".6"/>
      <!-- горелка с кипящей колбой -->
      <path d="M416 438 L428 410 M444 438 L432 410" stroke="#2a2a32" stroke-width="4" stroke-linecap="round"/><path d="M414 414 H446" stroke="#2a2a32" stroke-width="4"/>
      <g class="flame"><path d="M430 400 q9 12 0 24 q-9 -9 0 -24z" fill="#4aa0ff" opacity=".9"/><path d="M430 408 q4 6 0 13 q-4 -5 0 -13z" fill="#d8f0ff"/></g>
      <circle cx="430" cy="380" r="34" fill="url(#hcgreen)" class="glowp"/>
      ${erlen(430, 414, '#5fe08a', 1.35)}
      <circle class="bub" cx="426" cy="352" r="3.4" fill="#aaffc4"/><circle class="bub b2" cx="434" cy="352" r="2.8" fill="#aaffc4"/><circle class="bub b3" cx="430" cy="352" r="2.2" fill="#d6ffe2"/>
      <!-- ступка и свиток -->
      <path d="M606 438 Q608 420 622 420 Q636 420 638 438Z" fill="#6a6a74" stroke="#1a1a22" stroke-width="2.4"/><path d="M626 424 L644 394" stroke="#d8d0b4" stroke-width="6" stroke-linecap="round"/>
      ${scroll(500, 436, 62, 4, '#e8dcb4')}</g>`;

    /* куча черепов: нижние два ряда (верхние — «прикрытие») */
    const pileBack = `<g>${[246, 282, 318, 354].map(x => K.skull(x, 626, 1.5)).join('')}${[264, 300, 336].map(x => K.skull(x, 602, 1.5)).join('')}</g>`;

    celCache = `
      <rect width="${W}" height="470" fill="url(#hcwall)"/><rect width="${W}" height="170" fill="url(#hcshade)"/>
      <polygon points="0,474 ${W},474 ${W},${H} 0,${H}" fill="url(#hcfloor)"/><rect y="466" width="${W}" height="9" fill="#141a22"/>
      ${pentagram(520, 606, 168, 30)}
      <rect width="${W}" height="40" fill="#2b1b10"/><rect y="40" width="${W}" height="7" fill="#120a04"/>
      <path d="M0 47 H70 L0 117Z M1000 47 H930 L1000 117Z" fill="#3a2514" stroke="#120a04" stroke-width="2.4"/>
      ${torch(334, 300)}${torch(674, 300)}
      <g class="swayc" style="transform-origin:520px 46px"><path d="M520 46 V92" stroke="#1a1410" stroke-width="3"/><g transform="translate(520,92)"><circle cx="0" cy="18" r="52" fill="url(#hctorch)"/><rect x="-16" y="-6" width="32" height="6" rx="2" fill="#2a2018"/><path d="M-14 0 H14 L10 36 H-10Z" fill="#2a2018" stroke="#0a0806" stroke-width="2.4"/><path d="M-9 5 H9 L6 31 H-6Z" fill="#ffcf66"/></g></g>
      ${cage}${shelf}${furnace}${stairs}${table}${barrelBack}${pileBack}
      ${K.web(0, 47, 1, false)}${K.web(W, 47, 1, true)}`;
    return celCache;
  }

  const CEL_SPOTS = [
    { name: 'в бочке', x: 112, y: 530, rot: -80,
      cover: () => `<g><path d="M58 522 Q110 546 162 522 Q172 566 164 606 Q110 622 60 606 Q52 566 58 522Z" fill="#6a4020" stroke="#25140a" stroke-width="3.4"/>
        <g stroke="#25140a" stroke-width="2" fill="none"><path d="M82 534 Q78 570 82 614 M104 540 V618 M128 540 Q130 570 128 618 M146 534 Q150 570 146 612"/></g>
        <path d="M54 548 Q110 574 168 548 M52 586 Q110 612 170 586" stroke="#25140a" stroke-width="8" fill="none"/><path d="M54 548 Q110 574 168 548 M52 586 Q110 612 170 586" stroke="#7a8090" stroke-width="3" fill="none"/>
        <g transform="translate(176,566) rotate(14)"><ellipse rx="15" ry="38" fill="#7a4a28" stroke="#25140a" stroke-width="3"/><ellipse rx="9" ry="30" fill="none" stroke="#4a2c17" stroke-width="2"/></g></g>` },
    { name: 'под лестницей', x: 966, y: 458, rot: 0,
      cover: () => `<g><rect x="900" y="428" width="52" height="44" fill="#7a5a30" stroke="#25140a" stroke-width="3"/><path d="M900 444 H952 M900 458 H952" stroke="#4a3418" stroke-width="2"/><path d="M906 428 V472 M946 428 V472" stroke="#2a2a32" stroke-width="4"/>
        ${K.web(1000, 336, 0.6, true)}
        <g class="spider"><line x1="968" y1="330" x2="968" y2="392" stroke="#d8d0f0" stroke-width="1.2" opacity=".6"/><g transform="translate(968,396) scale(.8)"><ellipse cx="0" cy="0" rx="8" ry="9" fill="#0b0810"/><circle cx="0" cy="-9" r="5" fill="#0b0810"/><g stroke="#0b0810" stroke-width="1.8" fill="none"><path d="M-6 -2 L-16 -8 L-20 2 M-7 2 L-18 6 L-20 14 M6 -2 L16 -8 L20 2 M7 2 L18 6 L20 14"/></g><circle cx="-2" cy="-10" r="1.4" fill="#ff4040"/><circle cx="2" cy="-10" r="1.4" fill="#ff4040"/></g></g></g>` },
    { name: 'в золе у печи', x: 818, y: 452, rot: -26,
      cover: () => `<g><path d="M712 476 Q738 452 770 458 Q792 442 822 454 Q852 448 872 478Z" fill="#8c8c96" stroke="#3a3a44" stroke-width="2.4"/><path d="M730 468 Q752 458 772 464 M800 460 Q824 454 848 468" stroke="#6a6a74" stroke-width="2" fill="none"/>
        <path d="M702 502 L842 476" stroke="#12121a" stroke-width="6" stroke-linecap="round"/><path d="M702 502 L842 476" stroke="#5a5a66" stroke-width="2.6" stroke-linecap="round"/><path d="M842 476 q10 -2 10 -12" stroke="#5a5a66" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>` },
    { name: 'за колбами на столе', x: 566, y: 430, rot: -3,
      cover: () => `<g>${flask(548, 436, '#b44cff', 1.3)}${vial(580, 438, '#ff8a2a', 1.15)}${erlen(606, 438, '#38d0ff', 1.0)}</g>` },
    { name: 'на полке с зельями', x: 498, y: 284, rot: -78,
      cover: () => `<g>${flask(486, 312, '#38c8ff', 1.25)}${vial(516, 312, '#ff4a7a', 1.15)}</g>` },
    { name: 'в клетке со скелетом', x: 244, y: 219, rot: 3,
      cover: () => `<g>${bone('M206 214 L234 226', 5.4)}<circle cx="205" cy="213" r="4.6" fill="#e4dcc4" stroke="#3a2f20" stroke-width="2"/>
        <g stroke-linecap="round"><path d="M198 104 V232 M210 104 V232 M222 104 V232 M234 104 V232 M246 104 V232 M258 104 V232 M270 104 V232 M282 104 V232" stroke="#0a0a10" stroke-width="5.6"/><path d="M198 104 V232 M210 104 V232 M222 104 V232 M234 104 V232 M246 104 V232 M258 104 V232 M270 104 V232 M282 104 V232" stroke="#555566" stroke-width="3"/>
        <path d="M196 168 H284 M196 226 H284" stroke="#0a0a10" stroke-width="5.4"/><path d="M196 168 H284 M196 226 H284" stroke="#555566" stroke-width="2.6"/></g></g>` },
    { name: 'в куче черепов', x: 322, y: 592, rot: 10,
      cover: () => `<g>${K.skull(282, 578, 1.5)}${K.skull(318, 578, 1.5)}${K.skull(300, 554, 1.5)}${K.skull(300, 606, 1.5)}</g>` }
  ];
  const CEL_DECOYS = [
    { id: 'rust', x: 322, y: 172, draw: (x, y) => hanging(x, y, K.rustKey, 46) },
    { id: 'crystal', x: 388, y: 436, draw: (x, y) => crystalKey(x, y, -4) },
    { id: 'copper', x: 922, y: 364, draw: (x, y) => copperKey(x, y, -3) }
  ];
  const cel = { n: 3, name: 'Подвал алхимика', icon: '⚗️', spots: CEL_SPOTS, decoys: CEL_DECOYS, first: 180, again: 50, minFirst: 80, minAgain: 10 };
  cel.svg = spot => K.compose(cel, spot, CEL_DEFS, celScene());
  G.hid.addRoom(cel);

})();
