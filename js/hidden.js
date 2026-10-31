/* =========================================================
   Уровень 2 — поиск Золотого ключа с черепом в трёх комнатах:
   «Комната призраков», «Старая библиотека» (js/hidden-rooms.js) и «Подвал алхимика».
   Ключ каждый раз прячется в новом месте. Есть ложные ключи!
   ========================================================= */
(function () {
  'use strict';

  const W = 1000, H = 640;
  const HIT_R = 30;          // радиус клика по настоящему ключу (в единицах сцены)
  const HINT_COST = 15;

  /* ---------- Псевдослучайность для «книг» (чтобы сцена не менялась) ---------- */
  function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  /* ---------- Ключи ---------- */
  function goldKey(x, y, rot, s) {
    return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s || 1})" stroke="#4d3300" stroke-width="1.8" stroke-linejoin="round">
      <rect x="-9" y="-2.8" width="34" height="5.6" rx="2" fill="#f1c232"/>
      <rect x="15" y="2" width="4.2" height="8" fill="#f1c232"/><rect x="21" y="2" width="4" height="6" fill="#e0a91c"/>
      <circle cx="-18" cy="0" r="10.5" fill="#f6cf45"/>
      <circle cx="-21" cy="-2" r="2.6" fill="#2a1900" stroke="none"/><circle cx="-15" cy="-2" r="2.6" fill="#2a1900" stroke="none"/>
      <path d="M-20 5 H-16" stroke-width="1.6"/><path d="M-9 -3 L-9 3" stroke-width="1.2"/></g>`;
  }
  function silverKey(x, y, rot) {
    return `<g transform="translate(${x},${y}) rotate(${rot})" stroke="#2a2d3a" stroke-width="1.6" stroke-linejoin="round">
      <rect x="-9" y="-2.5" width="32" height="5" rx="2" fill="#c9ced9"/><rect x="14" y="2" width="4" height="8" fill="#c9ced9"/><rect x="20" y="2" width="4" height="6" fill="#aab0bd"/>
      <circle cx="-17" cy="0" r="9" fill="none" stroke="#c9ced9" stroke-width="5"/><circle cx="-17" cy="0" r="11.4" fill="none"/></g>`;
  }
  function rustKey(x, y, rot) {
    return `<g transform="translate(${x},${y}) rotate(${rot})" stroke="#2a1306" stroke-width="1.6" stroke-linejoin="round">
      <rect x="-9" y="-2.5" width="32" height="5" rx="1.5" fill="#8a4a24"/><rect x="16" y="2" width="6" height="7" fill="#7a3f1d"/>
      <rect x="-26" y="-8" width="17" height="16" rx="3" fill="#9a5528"/><rect x="-22" y="-4" width="9" height="8" fill="#2a1306" stroke="none"/></g>`;
  }
  function greenKey(x, y, rot) {
    return `<g transform="translate(${x},${y}) rotate(${rot})" stroke="#0d2a22" stroke-width="1.6" stroke-linejoin="round">
      <rect x="-9" y="-2.5" width="32" height="5" rx="2" fill="#3f9a7a"/><rect x="14" y="2" width="4" height="8" fill="#3f9a7a"/><rect x="20" y="2" width="4" height="8" fill="#2f7a60"/>
      <circle cx="-22" cy="0" r="6.5" fill="#4fb08e"/><circle cx="-15" cy="-6" r="6.5" fill="#4fb08e"/><circle cx="-15" cy="6" r="6.5" fill="#4fb08e"/>
      <circle cx="-17" cy="0" r="3" fill="#0d2a22" stroke="none"/></g>`;
  }
  const keyIconSVG = `<svg viewBox="-34 -18 72 36" class="hid-keyicon">${goldKey(0, 0, 0, 1)}</svg>`;

  /* ---------- Предметы сцены ---------- */
  function skull(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s || 1})"><path d="M-12 0 V-8 Q-14 -22 0 -22 Q14 -22 12 -8 V0 Q8 4 4 0 H-4 Q-8 4 -12 0Z" fill="#efe6cf" stroke="#3a2f20" stroke-width="1.6"/>
      <ellipse cx="-5" cy="-11" rx="3.2" ry="4" fill="#1a1020"/><ellipse cx="5" cy="-11" rx="3.2" ry="4" fill="#1a1020"/><path d="M0 -6 l-2 4 h4z" fill="#1a1020"/></g>`;
  }
  function candle(x, y, h, s) {
    return `<g transform="translate(${x},${y}) scale(${s || 1})"><rect x="-5" y="${-h}" width="10" height="${h}" rx="2" fill="#f2e8cc" stroke="#6a5a38" stroke-width="1.4"/>
      <path d="M-5 ${-h + 6} q-3 6 0 10" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>
      <g class="flame"><path d="M0 ${-h - 16} q8 10 0 16 q-8 -6 0 -16z" fill="#ffb02e"/><path d="M0 ${-h - 10} q4 5 0 9 q-4 -4 0 -9z" fill="#fff3b0"/></g>
      <circle cx="0" cy="${-h - 6}" r="22" fill="url(#hglowc)"/></g>`;
  }
  function pumpkinH(x, y, s, face) {
    return `<g transform="translate(${x},${y}) scale(${s || 1})"><ellipse cx="-10" cy="-14" rx="15" ry="17" fill="#ff8a1f" stroke="#7a2e00" stroke-width="2"/><ellipse cx="10" cy="-14" rx="15" ry="17" fill="#ff8a1f" stroke="#7a2e00" stroke-width="2"/>
      <ellipse cx="0" cy="-14" rx="12" ry="18" fill="#ff9d38" stroke="#7a2e00" stroke-width="2"/><path d="M-3 -31 Q-1 -40 5 -41 L7 -37 Q2 -36 3 -31Z" fill="#55861f" stroke="#2c4a0a" stroke-width="1.4"/>
      ${face ? '<polygon points="-10,-20 -4,-20 -7,-27" fill="#3a1200"/><polygon points="10,-20 4,-20 7,-27" fill="#3a1200"/><path d="M-11 -9 L-6 -12 L-2 -8 L2 -12 L7 -8 L11 -11 L9 -3 L4 -6 L0 -2 L-4 -6 L-9 -3Z" fill="#3a1200"/>' : ''}</g>`;
  }
  function web(x, y, s, flip) {
    return `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})" stroke="#e8e0ff" stroke-width="1.2" fill="none" opacity=".55">
      <path d="M0 0 L120 0 M0 0 L110 50 M0 0 L80 90 M0 0 L40 115 M0 0 L0 120"/>
      <path d="M30 0 Q22 22 0 30 M60 0 Q46 44 0 60 M90 0 Q70 66 0 90"/></g>`;
  }
  function jar(x, y, c) {
    return `<g transform="translate(${x},${y})"><rect x="-9" y="-30" width="18" height="30" rx="5" fill="${c}" stroke="#1a0f2a" stroke-width="1.6" opacity=".92"/><rect x="-6" y="-35" width="12" height="6" rx="2" fill="#6a4a2a" stroke="#1a0f2a" stroke-width="1.4"/>
      <circle cx="-2" cy="-14" r="2.4" fill="#fff" opacity=".5"/><circle cx="3" cy="-20" r="1.8" fill="#fff" opacity=".5"/></g>`;
  }
  function bookRow(x0, x1, yb, seed, extra) {
    const rnd = lcg(seed);
    const cols = ['#7a1d2e', '#1d4a5a', '#4a2c6a', '#6a4a1d', '#2c5a3a', '#8a3a1a', '#3a3a5a', '#5a1d4a', '#1d3a2a'];
    let x = x0, out = '';
    while (x < x1 - 12) {
      if (extra && extra[Math.round(x)]) { out += extra[Math.round(x)]; x += 30; continue; }
      const w = 10 + rnd() * 9, h = 38 + rnd() * 30, c = cols[Math.floor(rnd() * cols.length)];
      const lean = rnd() < 0.08;
      out += `<g transform="translate(${x},${yb})${lean ? ` rotate(-9 ${w / 2} 0)` : ''}"><rect x="0" y="${-h}" width="${w}" height="${h}" fill="${c}" stroke="#14091e" stroke-width="1.4"/>
        <rect x="0" y="${-h + 6}" width="${w}" height="3" fill="#e0b050" opacity=".7"/><rect x="0" y="${-h * 0.45}" width="${w}" height="2" fill="#e0b050" opacity=".45"/></g>`;
      x += w + (lean ? 8 : 1);
    }
    return out;
  }

  /* ---------- Места, где может быть спрятан ключ ---------- */
  // x, y — положение ключа; rot — поворот; cover — что лежит поверх (рисуется всегда!)
  const SPOTS = [
    { name: 'книжная полка', x: 421, y: 268, rot: -6,
      cover: () => `<g transform="translate(436,290)"><g transform="rotate(-12)"><rect x="-8" y="-60" width="16" height="60" fill="#5a1d4a" stroke="#14091e" stroke-width="1.4"/><rect x="-8" y="-52" width="16" height="3" fill="#e0b050" opacity=".7"/></g>
        <g transform="translate(12,0) rotate(7)"><rect x="-9" y="-54" width="18" height="54" fill="#1d4a5a" stroke="#14091e" stroke-width="1.4"/><rect x="-9" y="-46" width="18" height="3" fill="#e0b050" opacity=".7"/></g></g>` },
    { name: 'камин', x: 652, y: 452, rot: 4,
      cover: () => `<g><ellipse cx="650" cy="466" rx="40" ry="7" fill="#2a2430" opacity=".9"/><g transform="translate(662,458) rotate(-8)"><rect x="-38" y="-9" width="76" height="18" rx="8" fill="#4a2a14" stroke="#1d0f06" stroke-width="2"/><circle cx="38" cy="0" r="8" fill="#6a3a1c" stroke="#1d0f06" stroke-width="1.5"/><path d="M-30 -2 H30" stroke="#2a1608" stroke-width="2"/></g></g>` },
    { name: 'под столом', x: 128, y: 528, rot: -4,
      cover: () => `<g><path d="M108 540 Q104 520 122 516 L146 518 Q158 522 156 540 Z" fill="#2a1a12" stroke="#0e0806" stroke-width="2"/><path d="M118 520 Q130 528 144 520" stroke="#5a3a28" stroke-width="2" fill="none"/>
        ${web(98, 500, 0.38, false)}</g>` },
    { name: 'подоконник', x: 232, y: 296, rot: 8,
      cover: () => `<g transform="translate(222,310)"><path d="M-16 0 L-12 -22 H12 L16 0Z" fill="#8a4a24" stroke="#2a1306" stroke-width="2"/><rect x="-14" y="-26" width="28" height="6" rx="2" fill="#a05a2c" stroke="#2a1306" stroke-width="1.6"/>
        <path d="M0 -26 q-10 -22 -20 -28 M0 -26 q4 -26 -4 -40 M0 -26 q14 -18 24 -24" stroke="#1a0f10" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>` },
    { name: 'под ковром', x: 252, y: 582, rot: 22,
      cover: () => `<g><path d="M196 560 Q232 548 268 566 L252 594 Q220 598 192 590Z" fill="#7a2a4c" stroke="#d08a2e" stroke-width="3"/><path d="M200 566 Q232 556 262 570" stroke="#d08a2e" stroke-width="2" fill="none" opacity=".7"/></g>` },
    { name: 'котёл', x: 844, y: 512, rot: -10,
      cover: () => `<g><circle cx="826" cy="510" r="6" fill="#b6ff4a" opacity=".85"/><circle cx="858" cy="506" r="8" fill="#9be22b" opacity=".85"/><circle cx="842" cy="500" r="4" fill="#d4ff8a" opacity=".9"/>
        <path d="M880 470 Q868 500 846 516" stroke="#3a2a1a" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="842" cy="518" rx="10" ry="6" fill="#3a2a1a"/></g>` },
    { name: 'сундук', x: 742, y: 556, rot: 12,
      cover: () => `<g><circle cx="722" cy="562" r="7" fill="#f0c030" stroke="#7a5a10" stroke-width="1.6"/><circle cx="734" cy="568" r="7" fill="#e0a820" stroke="#7a5a10" stroke-width="1.6"/><circle cx="756" cy="566" r="7" fill="#f0c030" stroke="#7a5a10" stroke-width="1.6"/><circle cx="768" cy="560" r="6" fill="#e0a820" stroke="#7a5a10" stroke-width="1.6"/>
        ${skull(752, 574, 0.7)}</g>` },
    { name: 'верх шкафа', x: 396, y: 112, rot: -3,
      cover: () => `<g>${pumpkinH(414, 122, 0.9, true)}${web(340, 108, 0.5, false)}</g>` }
  ];

  const DECOYS = [
    { id: 'silver', x: 168, y: 413, draw: (x, y) => silverKey(x, y, 12) },
    { id: 'rust', x: 783, y: 150, draw: (x, y) => `<g><path d="M783 128 V140" stroke="#999" stroke-width="2"/><circle cx="783" cy="126" r="4" fill="#bbb" stroke="#333" stroke-width="1.5"/>${rustKey(x, y, 90)}</g>` },
    { id: 'green', x: 700, y: 226, draw: (x, y) => greenKey(x, y, -62) }
  ];

  /* ---------- Рисуем комнату ---------- */
  function roomSVG(spot) {
    const rnd = lcg(7);
    const shelfExtras = {
      [Math.round(316)]: skull(332, 206, 1),
      [Math.round(470)]: jar(484, 206, '#7ee022'),
      [Math.round(330)]: '',
    };
    // полки: y нижней кромки книг
    const shelves = `
      ${bookRow(306, 500, 206, 11, { 316: skull(330, 206, 1.1) })}
      ${bookRow(306, 500, 290, 23, { 470: jar(486, 290, '#c04cff') })}
      ${bookRow(306, 500, 374, 31, { 400: pumpkinH(414, 374, 0.9, false) })}
      ${bookRow(306, 500, 458, 47, { 330: `<g transform="translate(346,458)"><circle cx="0" cy="-20" r="19" fill="#7ad0ff" opacity=".75" stroke="#14091e" stroke-width="2"/><ellipse cx="-6" cy="-26" rx="6" ry="4" fill="#fff" opacity=".6"/><rect x="-14" y="-4" width="28" height="6" fill="#4a2c17" stroke="#14091e" stroke-width="1.5"/></g>` })}`;

    let stars = '';
    for (let i = 0; i < 14; i++) stars += `<circle cx="${84 + rnd() * 150}" cy="${84 + rnd() * 100}" r="${0.8 + rnd() * 1.3}" fill="#fff" opacity=".85"/>`;

    return `<svg id="hid-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hwall" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#2b2147"/><path d="M30 8 L38 30 L30 52 L22 30Z" fill="#372a5e"/><circle cx="0" cy="0" r="3" fill="#372a5e"/><circle cx="60" cy="0" r="3" fill="#372a5e"/><circle cx="0" cy="60" r="3" fill="#372a5e"/><circle cx="60" cy="60" r="3" fill="#372a5e"/></pattern>
        <pattern id="hfloor" width="140" height="46" patternUnits="userSpaceOnUse"><rect width="140" height="46" fill="#4a2c1c"/><rect width="140" height="3" fill="#2a170d"/><path d="M70 0V23 M0 23H140 M0 23" stroke="#2a170d" stroke-width="2.4"/><path d="M0 34 H140" stroke="#5a3624" stroke-width="1.5" opacity=".6"/></pattern>
        <linearGradient id="hglass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0a2e"/><stop offset="1" stop-color="#3a2a6a"/></linearGradient>
        <radialGradient id="hglowc"><stop offset="0" stop-color="#ffcc66" stop-opacity=".55"/><stop offset="1" stop-color="#ffcc66" stop-opacity="0"/></radialGradient>
        <radialGradient id="hfire" cx=".5" cy=".6"><stop offset="0" stop-color="#ffcc55" stop-opacity=".7"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient>
        <radialGradient id="hvig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
      </defs>

      <!-- стена и пол -->
      <rect width="${W}" height="480" fill="url(#hwall)"/>
      <rect y="380" width="${W}" height="100" fill="#1d1432"/>
      <g stroke="#2e2150" stroke-width="3" fill="none"><rect x="20" y="396" width="150" height="70"/><rect x="190" y="396" width="150" height="70"/><rect x="530" y="396" width="20" height="70"/><rect x="800" y="396" width="90" height="70"/><rect x="900" y="396" width="90" height="70"/></g>
      <rect y="372" width="${W}" height="10" fill="#3b2a5e"/>
      <polygon points="0,470 ${W},470 ${W},${H} 0,${H}" fill="url(#hfloor)"/>
      <rect y="466" width="${W}" height="8" fill="#2a1a40"/>

      <!-- окно с луной -->
      <rect x="62" y="62" width="196" height="248" rx="6" fill="#3a2314" stroke="#1d1008" stroke-width="4"/>
      <rect x="76" y="76" width="168" height="220" fill="url(#hglass)"/>
      ${stars}
      <circle cx="196" cy="128" r="30" fill="#ffe9a8"/><circle cx="208" cy="120" r="27" fill="#161240"/>
      <path d="M76 296 V250 q18 -6 20 -30 q-14 -4 -16 -22 q22 8 30 28 q4 -26 24 -34 q-12 16 -6 36 q18 -4 26 -24 q0 20 -10 32 q14 6 18 22 V296Z" fill="#0b0818"/>
      <path d="M160 76V296M76 160H244" stroke="#3a2314" stroke-width="8"/>
      <path d="M62 62 H132 C124 140 112 222 70 300 L62 300Z" fill="#7a1d45" stroke="#2a0a18" stroke-width="2"/>
      <path d="M92 70 C96 140 92 220 70 296 M114 66 C116 130 108 200 90 260" stroke="#5a1232" stroke-width="3" fill="none"/>
      <path d="M258 62 H190 C198 140 210 222 250 300 L258 300Z" fill="#7a1d45" stroke="#2a0a18" stroke-width="2"/>
      <path d="M230 70 C226 140 230 220 250 296 M208 66 C206 130 214 200 232 260" stroke="#5a1232" stroke-width="3" fill="none"/>
      <path d="M52 56 H268 V84 Q244 98 220 84 Q196 98 160 84 Q124 98 100 84 Q76 98 52 84Z" fill="#8a2350" stroke="#2a0a18" stroke-width="2"/>
      <rect x="48" y="308" width="224" height="14" rx="3" fill="#4a2c17" stroke="#1d1008" stroke-width="2"/>

      <!-- книжный шкаф -->
      <rect x="290" y="112" width="230" height="360" rx="4" fill="#4a2c17" stroke="#1d1008" stroke-width="4"/>
      <rect x="302" y="124" width="206" height="336" fill="#241208"/>
      <g fill="#5a371c" stroke="#1d1008" stroke-width="2.4"><rect x="302" y="206" width="206" height="8"/><rect x="302" y="290" width="206" height="8"/><rect x="302" y="374" width="206" height="8"/><rect x="302" y="458" width="206" height="8"/></g>
      ${shelves}
      <rect x="280" y="104" width="250" height="14" rx="3" fill="#5a371c" stroke="#1d1008" stroke-width="2.4"/>

      <!-- портрет -->
      <g><rect x="610" y="72" width="130" height="150" rx="6" fill="#6a4a1c" stroke="#2a1a08" stroke-width="4"/><rect x="620" y="82" width="110" height="130" fill="#1a1426"/>
        <ellipse cx="675" cy="140" rx="30" ry="38" fill="#cbbfa0"/><path d="M640 122 Q675 78 710 122 Q700 108 675 106 Q650 108 640 122Z" fill="#cfcfe0"/>
        <ellipse cx="664" cy="136" rx="5" ry="4" fill="#111"/><ellipse cx="686" cy="136" rx="5" ry="4" fill="#111"/><path d="M664 162 Q675 156 686 162" stroke="#4a2a2a" stroke-width="2" fill="none"/>
        <path d="M620 212 Q650 176 675 178 Q700 176 730 212Z" fill="#2a1f40"/><path d="M660 178 L675 196 L690 178Z" fill="#e8e0ff"/></g>

      <!-- камин -->
      <rect x="566" y="256" width="208" height="214" fill="#4b4458" stroke="#1d1826" stroke-width="3"/>
      <g stroke="#2e2838" stroke-width="2" opacity=".8"><path d="M566 290H774 M566 326H774 M566 362H774 M566 398H774 M566 434H774"/><path d="M606 256V290 M690 256V290 M740 290V326 M634 290V326 M590 326V362 M670 326V362 M730 326V362 M610 362V398 M700 362V398"/></g>
      <path d="M600 470 V350 Q600 300 670 300 Q740 300 740 350 V470Z" fill="#0d0714" stroke="#1d1826" stroke-width="4"/>
      <ellipse cx="670" cy="430" rx="80" ry="70" fill="url(#hfire)"/>
      <g class="flame"><path d="M650 450 Q630 410 660 380 Q664 410 680 400 Q690 420 684 450Z" fill="#ff6a1a"/><path d="M672 450 Q664 420 686 396 Q696 424 704 450Z" fill="#ff9a2a"/><path d="M660 450 Q656 430 672 416 Q680 434 678 450Z" fill="#ffe06a"/></g>
      <rect x="544" y="236" width="252" height="24" rx="3" fill="#3a3046" stroke="#1d1826" stroke-width="3"/>
      ${candle(585, 236, 34, 1)}${skull(670, 236, 1.1)}${candle(758, 236, 26, 1)}

      <!-- напольные часы -->
      <g><rect x="836" y="150" width="116" height="320" rx="6" fill="#4a2c17" stroke="#1d1008" stroke-width="4"/><path d="M836 150 Q836 96 894 90 Q952 96 952 150Z" fill="#5a371c" stroke="#1d1008" stroke-width="4"/>
        <circle cx="894" cy="150" r="38" fill="#efe6cf" stroke="#1d1008" stroke-width="4"/>
        <g stroke="#2a1608" stroke-width="3" stroke-linecap="round"><path d="M894 122V130 M894 170V178 M866 150H874 M914 150H922"/><path d="M894 150 L894 130" stroke-width="3.5"/><path d="M894 150 L910 158" stroke-width="3"/></g>
        <rect x="860" y="204" width="68" height="190" rx="8" fill="#1d1008" stroke="#1d1008" stroke-width="2"/>
        <g class="pend"><line x1="894" y1="210" x2="894" y2="362" stroke="#d0a030" stroke-width="3"/><circle cx="894" cy="366" r="14" fill="#e0b040" stroke="#5a3a08" stroke-width="2.4"/></g></g>

      <!-- ковёр -->
      <ellipse cx="410" cy="574" rx="250" ry="48" fill="#5e1f3c" stroke="#d08a2e" stroke-width="5"/>
      <ellipse cx="410" cy="574" rx="210" ry="38" fill="none" stroke="#d08a2e" stroke-width="2.4" stroke-dasharray="8 6" opacity=".8"/>
      <ellipse cx="410" cy="574" rx="150" ry="26" fill="#7a2a4c" opacity=".7"/>
      <path d="M410 552 L430 574 L410 596 L390 574Z" fill="#d08a2e" opacity=".8"/>

      <!-- стол -->
      <g><ellipse cx="150" cy="430" rx="86" ry="17" fill="#6a4020" stroke="#2a1608" stroke-width="3"/><ellipse cx="150" cy="426" rx="80" ry="13" fill="#7c4c26"/>
        <path d="M92 440 L82 528 M208 440 L218 528 M150 448 V534" stroke="#4a2a12" stroke-width="9" stroke-linecap="round"/>
        <rect x="108" y="404" width="42" height="12" rx="3" fill="#7a1d2e" stroke="#14091e" stroke-width="1.6"/><rect x="110" y="394" width="38" height="11" rx="3" fill="#1d4a5a" stroke="#14091e" stroke-width="1.6"/>
        ${candle(182, 420, 24, 1)}${candle(136, 420, 30, 0.9)}
        <g transform="translate(206,420)"><ellipse cx="0" cy="-9" rx="11" ry="9" fill="#d8d0e8" stroke="#3a3050" stroke-width="1.6"/><path d="M10 -10 q8 -2 8 6" stroke="#3a3050" stroke-width="2" fill="none"/></g></g>

      <!-- сундук -->
      <g><rect x="690" y="548" width="116" height="62" rx="6" fill="#5a3418" stroke="#1d0f06" stroke-width="3.4"/>
        <path d="M690 548 Q690 520 748 518 Q806 520 806 548Z" fill="#6a3e1c" stroke="#1d0f06" stroke-width="3.4" transform="rotate(-6 748 548)"/>
        <rect x="690" y="570" width="116" height="9" fill="#c0902a" opacity=".8"/><rect x="738" y="560" width="20" height="26" rx="3" fill="#e0b040" stroke="#5a3a08" stroke-width="2"/></g>

      <!-- котёл -->
      <g><path d="M800 484 Q792 540 812 548 H878 Q900 540 890 484Z" fill="#1c1c26" stroke="#07070c" stroke-width="3.4"/>
        <ellipse cx="845" cy="486" rx="50" ry="14" fill="#6fd01e" stroke="#07070c" stroke-width="3"/>
        <g stroke="#07070c" stroke-width="5" stroke-linecap="round"><path d="M814 546 L808 562 M876 546 L884 562"/></g></g>

      <!-- чёрный кот -->
      <g class="cat" transform="translate(950,556)"><path d="M-22 30 Q-30 0 -8 -14 Q-6 -34 4 -38 L8 -52 L16 -40 Q24 -42 28 -38 L34 -52 L38 -34 Q46 -22 38 -8 Q44 14 36 30Z" fill="#0b0810"/>
        <path d="M-22 26 Q-44 20 -40 4" stroke="#0b0810" stroke-width="7" fill="none" stroke-linecap="round"/>
        <g class="eyes"><ellipse cx="14" cy="-26" rx="3.4" ry="4.6" fill="#ffd23a"/><ellipse cx="28" cy="-26" rx="3.4" ry="4.6" fill="#ffd23a"/></g></g>

      <!-- метла, тыквы, паутины -->
      <g stroke-linecap="round"><path d="M22 470 L40 250" stroke="#6a4a20" stroke-width="7"/><path d="M12 482 Q8 520 -4 540 M22 482 Q22 520 24 546 M34 480 Q42 516 56 538 M44 472 Q58 500 72 520" stroke="#b8902a" stroke-width="5" fill="none"/></g>
      ${pumpkinH(284, 546, 0.95, true)}${pumpkinH(978, 618, 0.8, false)}
      ${pumpkinH(24, 618, 0.7, true)}
      <g class="spider"><line x1="590" y1="0" x2="590" y2="70" stroke="#d8d0f0" stroke-width="1.2" opacity=".6"/><g transform="translate(590,76)"><ellipse cx="0" cy="0" rx="8" ry="9" fill="#0b0810"/><circle cx="0" cy="-9" r="5" fill="#0b0810"/><g stroke="#0b0810" stroke-width="1.8" fill="none"><path d="M-6 -2 L-16 -8 L-20 2 M-7 2 L-18 6 L-20 14 M6 -2 L16 -8 L20 2 M7 2 L18 6 L20 14"/></g><circle cx="-2" cy="-10" r="1.4" fill="#ff4040"/><circle cx="2" cy="-10" r="1.4" fill="#ff4040"/></g></g>
      <g fill="#0b0810"><g transform="translate(360,0)"><path d="M0 0 V14"/><path d="M0 14 c-4-6-10-8-18-6 3 3 4 6 3 9-4-2-10-1-14 3 5 0 9 2 11 6 3-3 6-3 9 1 2-3 5-4 9-3 4-1 7 0 9 3 2-4 6-4 9-1 2-4 6-6 11-6-4-4-10-5-14-3-1-3 0-6 3-9-8-2-14 0-18 6z" transform="translate(0,6) rotate(180 0 8)"/></g></g>
      <g class="chand"><path d="M500 0 V34" stroke="#3a2a1a" stroke-width="3"/><path d="M440 52 Q500 70 560 52 Q548 38 500 34 Q452 38 440 52Z" fill="#2a2030" stroke="#07070c" stroke-width="2.4"/>
        ${candle(456, 52, 14, 0.85)}${candle(500, 58, 16, 0.85)}${candle(544, 52, 14, 0.85)}</g>
      ${web(0, 0, 1.2, false)}${web(1000, 0, 1.2, true)}
      <g class="ghostH"><g transform="translate(540,170)" opacity=".55"><path d="M-26 0 V-30 Q-26 -62 0 -62 Q26 -62 26 -30 V0 Q17 -10 9 0 Q0 -10 -9 0 Q-17 -10 -26 0Z" fill="#e8f0ff"/><ellipse cx="-9" cy="-34" rx="4" ry="6" fill="#1b2440"/><ellipse cx="9" cy="-34" rx="4" ry="6" fill="#1b2440"/><ellipse cx="0" cy="-20" rx="5" ry="7" fill="#1b2440"/></g></g>

      <!-- ложные ключи -->
      ${DECOYS.map(d => `<g class="decoy" data-id="${d.id}">${d.draw(d.x, d.y)}</g>`).join('')}

      <!-- настоящий ключ: между мебелью и «прикрытиями» -->
      <g id="hid-key" class="goldkey">${goldKey(spot.x, spot.y, spot.rot, 1)}</g>

      <!-- прикрытия -->
      <g class="hcov">${SPOTS.map(s => s.cover()).join('')}</g>

      <rect width="${W}" height="${H}" fill="url(#hvig)" pointer-events="none"/>
      <g id="hid-fx"></g>
    </svg>`;
  }

  /* ---------- Комнаты ----------
     Комната — объект {n, name, icon, spots, decoys, svg(spot), first, again, minFirst, minAgain}.
     Комнаты 2 и 3 подключает js/hidden-rooms.js через G.hid.addRoom(). */
  const ROOMS = [];
  const BASE_DEFS = `<radialGradient id="hglowc"><stop offset="0" stop-color="#ffcc66" stop-opacity=".55"/><stop offset="1" stop-color="#ffcc66" stop-opacity="0"/></radialGradient>
    <radialGradient id="hvig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>`;
  /* Общая «сборка» сцены для новых комнат: сцена, ложные ключи, настоящий ключ, прикрытия, виньетка */
  function compose(room, spot, defs, scene) {
    return `<svg id="hid-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>${BASE_DEFS}${defs}</defs>
      ${scene}
      ${room.decoys.map(d => `<g class="decoy" data-id="${d.id}">${d.draw(d.x, d.y)}</g>`).join('')}
      <g id="hid-key" class="goldkey">${goldKey(spot.x, spot.y, spot.rot, 1)}</g>
      <g class="hcov">${room.spots.map(s => s.cover()).join('')}</g>
      <rect width="${W}" height="${H}" fill="url(#hvig)" pointer-events="none"/>
      <g id="hid-fx"></g>
    </svg>`;
  }
  G.hidKit = { W, H, lcg, goldKey, silverKey, rustKey, greenKey, skull, candle, pumpkinH, web, jar, bookRow, compose };

  /* ---------- Прогресс по комнатам ---------- */
  const prog = () => {
    const st = G.state;
    if (!st.hidRooms) st.hidRooms = {};
    if (st.hidDone && !st.hidRooms[1]) st.hidRooms[1] = true;     // сохранения старых версий: первый ключ уже найден
    return st.hidRooms;
  };
  const list = () => ROOMS.filter(Boolean);
  const roomOpen = n => n === 1 || !!prog()[n - 1] || !!G.state.freeMode;
  const foundCount = () => list().filter(r => prog()[r.n]).length;
  const firstUnfound = except => list().find(r => r.n !== except && !prog()[r.n] && roomOpen(r.n));

  /* ---------- Модуль ---------- */
  let room, spot, mistakes, t0, timer, found, lantern, session = 0, hintsUsed = 0;
  const M = G.hid = {
    _force: null,       // для проверки: номер места, где спрятан ключ
    _room: null,        // выбор комнаты на ближайший вход (кнопка «Комнаты», «Следующая комната», проверки)
    addRoom: function (def) { ROOMS[def.n - 1] = def; },
    rooms: list,
    progress: () => ({ found: foundCount(), total: list().length }),

    enter: function () {
      const rooms = list();
      let r = M._room != null ? rooms.find(x => x.n === M._room) : null;
      if (!r) r = firstUnfound() || rooms.find(x => x.n === G.state.hidRoom && roomOpen(x.n)) || rooms[0];
      M._room = null;
      start(r);
    },
    leave: function () { clearInterval(timer); session++; }
  };

  function start(r) {
    session++;
    room = r;
    G.state.hidRoom = r.n; G.save();
    found = false; mistakes = 0; hintsUsed = 0; lantern = false;
    spot = r.spots[M._force != null ? M._force : G.rand(r.spots.length)];
    const total = list().length;
    const sc = G.$('#screen-hid');
    G.$('#hud-title').textContent = r.name;
    sc.innerHTML = `
      <div class="game-col hid">
        <div class="hid-top">
          <div class="hid-task panel">${keyIconSVG}<div><small>${r.icon} ${r.name} · комната ${r.n} из ${total}</small><b>Золотой ключ с черепом</b></div></div>
          <div class="hid-stats">
            <div class="chip" title="Время">⏱ <b id="hid-time">0:00</b></div>
            <div class="chip" title="Промахи">💀 <b id="hid-miss">0</b></div>
          </div>
        </div>
        <div class="hid-scene-wrap" id="hid-wrap">
          <div class="hid-scene">${r.svg(spot)}<div class="hid-dark" id="hid-dark"></div></div>
        </div>
        <div class="hid-bar">
          <button class="btn btn-small btn-ghost" id="hid-rooms" type="button">🚪 Комнаты</button>
          <button class="btn btn-small btn-purple" id="hid-hint" type="button">💡 Подсказка · ${HINT_COST} ${G.coin('sm')}</button>
          <button class="btn btn-small btn-ghost" id="hid-zoom" type="button">🔍 Приблизить</button>
          <button class="btn btn-small btn-ghost" id="hid-lamp" type="button">🔦 Фонарь: выкл (награда ×2)</button>
        </div>
      </div>`;
    const svg = G.$('#hid-svg');
    svg.addEventListener('click', onClick);
    G.$('#hid-hint').addEventListener('click', hint);
    G.$('#hid-lamp').addEventListener('click', toggleLamp);
    G.$('#hid-zoom').addEventListener('click', toggleZoom);
    G.$('#hid-rooms').addEventListener('click', () => { G.sfx('click'); showRooms(); });
    const wrap = G.$('.hid-scene', sc);
    const move = ev => {
      if (!lantern) return;
      const rc = wrap.getBoundingClientRect();
      const dark = G.$('#hid-dark');
      dark.style.setProperty('--lx', (ev.clientX - rc.left) + 'px');
      dark.style.setProperty('--ly', (ev.clientY - rc.top) + 'px');
    };
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerdown', move);
    t0 = Date.now();
    clearInterval(timer);
    timer = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      const el = G.$('#hid-time');
      if (el) el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }, 500);
    if (!G.state.hidSeen) {
      G.state.hidSeen = true; G.save();
      G.toast('🔎 Кликни на Золотой ключ с черепом. Осторожно: есть ложные!', 4200);
    }
  }

  /* окно «Комнаты»: выбор комнаты; следующая открывается, когда в предыдущей найден ключ */
  async function showRooms() {
    const P = prog(), my = session;
    const wrap = G.el('div', 'hid-rooms');
    list().forEach(r => {
      const open = roomOpen(r.n), done = !!P[r.n];
      const b = G.el('button', 'hid-room' + (done ? ' done' : '') + (open ? '' : ' locked') + (room && r.n === room.n ? ' cur' : ''));
      b.type = 'button'; b.disabled = !open; b.dataset.n = r.n;
      b.innerHTML = `<span class="hr-ico">${open ? r.icon : '🔒'}</span><span class="hr-txt"><b>${r.n}. ${r.name}</b><small>${!open ? 'Сначала найди ключ в комнате ' + (r.n - 1) : done ? 'Ключ найден ✔ (повтор: награда меньше)' : 'Ключ ещё не найден: награда ' + r.first + ' 🎃'}</small></span>`;
      wrap.appendChild(b);
    });
    const d = G.el('div');
    const all = foundCount() >= list().length;
    d.innerHTML = all ? `<p>Все ${list().length} ключа найдены. Можно искать снова: за повторный поиск жетонов дают меньше.</p>`
      : `<p>Найди Золотой ключ в каждой комнате: ${foundCount()} из ${list().length}. Когда найдены все три, откроется Конфетное поле.</p>`;
    d.appendChild(wrap);
    const picked = await G.modal({
      title: '🚪 Комнаты', cls: 'wide', body: d, dismiss: true,
      buttons: [{ text: 'Закрыть', cls: 'btn-ghost btn-small', value: 0 }],
      onMount: (box, close) => { G.$$('.hid-room', box).forEach(b => b.addEventListener('click', () => { if (!b.disabled) { G.sfx('click'); close(+b.dataset.n); } })); }
    });
    if (my !== session || G.current !== 'hid') return;
    if (picked > 0 && (!room || picked !== room.n)) { M._room = picked; M.enter(); }
  }

  function toScene(ev) {
    const svg = G.$('#hid-svg');
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function ripple(x, y, cls) {
    const fx = G.$('#hid-fx');
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 6);
    c.setAttribute('class', 'ripple ' + (cls || ''));
    fx.appendChild(c);
    setTimeout(() => c.remove(), 900);
  }

  function onClick(ev) {
    if (found) return;
    const p = toScene(ev);
    const k = spot;
    /* на маленьком экране палец толще ключа: радиус попадания не меньше 16 пикселей (для ложных ключей 14) */
    const px = G.$('#hid-svg').getScreenCTM().a || 1;
    const hit = Math.max(HIT_R, 16 / px), dhit = Math.max(26, 14 / px);
    if (Math.hypot(p.x - k.x, p.y - k.y) <= hit) return win(ev);
    for (const d of room.decoys) {
      if (Math.hypot(p.x - d.x, p.y - d.y) <= dhit) {
        ripple(d.x, d.y, 'warn');
        G.sfx('bad');
        G.toast('🗝️ Это не тот ключ! Нужен золотой, с черепом на ручке.', 2600);
        return;
      }
    }
    mistakes++;
    G.$('#hid-miss').textContent = mistakes;
    ripple(p.x, p.y, 'miss');
    G.sfx('spooky');
    G.floatText(ev.clientX, ev.clientY - 10, mistakes % 3 === 0 ? 'Холодно...' : 'Мимо!', 'red');
  }

  function toggleZoom() {
    const w = G.$('#hid-wrap');
    const on = !w.classList.contains('zoomed');
    w.classList.toggle('zoomed', on);
    G.$('#hid-zoom').textContent = on ? '🔍 Отдалить' : '🔍 Приблизить';
    G.sfx('click');
    if (on) { w.scrollLeft = (w.scrollWidth - w.clientWidth) / 2; w.scrollTop = (w.scrollHeight - w.clientHeight) / 2; }
    if (lantern) { const d = G.$('#hid-dark'), sc = G.$('.hid-scene').getBoundingClientRect(); d.style.setProperty('--lx', sc.width / 2 + 'px'); d.style.setProperty('--ly', sc.height / 2 + 'px'); }
  }

  function toggleLamp() {
    lantern = !lantern;
    const dark = G.$('#hid-dark');
    dark.classList.toggle('on', lantern);
    const wrap = G.$('.hid-scene');
    const r = wrap.getBoundingClientRect();
    dark.style.setProperty('--lx', r.width / 2 + 'px');
    dark.style.setProperty('--ly', r.height / 2 + 'px');
    dark.style.setProperty('--lr', Math.max(90, r.width * 0.15) + 'px');
    G.$('#hid-lamp').textContent = lantern ? '🔦 Фонарь: вкл (награда ×2)' : '🔦 Фонарь: выкл (награда ×2)';
    G.$('#hid-lamp').classList.toggle('btn-green', lantern);
    G.$('#hid-lamp').classList.toggle('btn-ghost', !lantern);
    G.sfx('click');
    if (lantern) G.toast('Веди пальцем или мышью — луч покажет, что в темноте.', 2800);
  }

  function hint() {
    if (found) return;
    const free = G.state.tokens < HINT_COST;
    if (!free && !G.spend(HINT_COST)) return;
    hintsUsed++;
    G.sfx('coin');
    const fx = G.$('#hid-fx');
    const ox = (Math.random() - 0.5) * 70, oy = (Math.random() - 0.5) * 50;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', spot.x + ox); c.setAttribute('cy', spot.y + oy); c.setAttribute('r', 95);
    c.setAttribute('class', 'hintring');
    fx.appendChild(c);
    setTimeout(() => c.remove(), 4500);
    G.toast(free ? '💡 Подсказка бесплатна: жетонов мало' : '💡 Ключ где-то в круге', 2400);
    if (lantern) {
      const dark = G.$('#hid-dark'), wrap = G.$('.hid-scene'), r = wrap.getBoundingClientRect(), svg = G.$('#hid-svg');
      const m = svg.getScreenCTM();
      dark.style.setProperty('--lx', (m.a * (spot.x + ox) + m.e - r.left) + 'px');
      dark.style.setProperty('--ly', (m.d * (spot.y + oy) + m.f - r.top) + 'px');
    }
  }

  /* комната 1 — «Комната призраков» */
  M.addRoom({ n: 1, name: 'Комната призраков', icon: '🏚️', spots: SPOTS, decoys: DECOYS, svg: roomSVG, first: 100, again: 30, minFirst: 40, minAgain: 10 });

  async function win(ev) {
    found = true;
    clearInterval(timer);
    const my = session;
    const dark = G.$('#hid-dark'); if (dark) dark.classList.remove('on');
    const keyEl = G.$('#hid-key');
    keyEl.classList.add('foundkey');
    ripple(spot.x, spot.y, 'ok');
    G.sfx('found');
    const m = G.$('#hid-svg').getScreenCTM();
    const sx = m.a * spot.x + m.e, sy = m.d * spot.y + m.f;
    G.burst(sx, sy, ['✨', '🗝️', '⭐', '🎃'], 18, 160);
    const secs = Math.floor((Date.now() - t0) / 1000);
    const P = prog();
    const first = !P[room.n];
    let tok = first ? room.first : room.again;
    tok = Math.max(first ? room.minFirst : room.minAgain, tok - mistakes * (first ? 8 : 3));
    if (lantern) tok *= 2;
    G.addTokens(tok);
    let unlockedStage = false;
    if (first) {
      P[room.n] = true;
      if (room.n === 1) G.state.hidDone = true;                   // для совместимости со старыми сохранениями
      if (foundCount() >= list().length && G.advanceStage(2)) unlockedStage = true;
    }
    G.save();
    await G.sleep(1100);
    if (my !== session) return;
    G.confetti();
    const hiding = spot.name;
    const timeTxt = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    if (unlockedStage) {
      await G.modal({
        title: 'Все ключи найдены!',
        body: `<p class="big">🗝️🗝️🗝️</p><p>В последней комнате ключ лежал: <b class="hl">${hiding}</b>. Время: ${timeTxt}, промахов: ${mistakes}.</p>
          <p>Три золотых ключа открыли дорогу на <b class="hl">Конфетное поле</b>!</p><div class="reward">+${tok} ${G.coin()}</div>`,
        buttons: [{ text: 'На карту', cls: 'btn-primary' }]
      });
      if (my !== session) return;
      G.go('map');
      return;
    }
    const nxt = first ? firstUnfound(room.n) : null;
    const choice = await G.modal({
      title: 'Ключ найден!',
      body: `<p class="big">🗝️✨</p><p>Он лежал: <b class="hl">${hiding}</b>. Время: ${timeTxt}, промахов: ${mistakes}.</p>
        <div class="reward">+${tok} ${G.coin()}</div>${first ? `<p class="muted">Ключей найдено: ${foundCount()} из ${list().length}</p>` : '<p class="muted">Повторный поиск даёт меньше жетонов</p>'}
        ${nxt ? `<p>Открыта комната: <b class="hl">${nxt.name}</b>!</p>` : ''}`,
      buttons: [{ text: 'На карту', cls: 'btn-ghost btn-small', value: 'map' }, nxt ? { text: 'Следующая комната ▶', cls: 'btn-primary', value: 'next' } : { text: 'Искать снова', cls: 'btn-primary', value: 'again' }]
    });
    if (my !== session) return;
    if (choice === 'next' && nxt) { M._room = nxt.n; M.enter(); }
    else if (choice === 'again') { M._room = room.n; M.enter(); }
    else G.go('map');
  }
})();
