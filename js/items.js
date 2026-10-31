/* =========================================================
   Каталог мебели и украшений (все рисунки — встроенный SVG)
   slot: floor — на полу, wall — на стене, ceiling — под потолком
   w — ширина предмета в % от ширины комнаты
   flat — плоский предмет на полу (ковёр), всегда под остальными
   ========================================================= */
(function () {
  'use strict';
  const O = '#14091e';
  const sv = (vb, body) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
  const bat = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})" fill="${O}" stroke="none"><path d="M0 0c-3-7-9-10-18-9 3 3 5 7 3 10-4-1-10-1-16 3 6 0 10 2 12 7 3-3 7-3 10 1 2-4 6-5 10-4 4 0 8 1 10 4 3-4 7-4 10-1 2-5 6-7 12-7-6-4-12-4-16-3-2-3 0-7 3-10-9-1-15 2-18 9z"/><circle cx="0" cy="1" r="3.2"/></g>`;
  const pump = (x, y, s, face) => `<g transform="translate(${x},${y}) scale(${s})" stroke="#6a2400" stroke-width="2.4">
    <ellipse cx="-10" cy="-15" rx="15" ry="18" fill="#ff8a1f"/><ellipse cx="10" cy="-15" rx="15" ry="18" fill="#ff8a1f"/><ellipse cx="0" cy="-15" rx="12" ry="19" fill="#ffa233"/>
    <path d="M-3 -32 Q-1 -42 6 -43 L8 -38 Q3 -37 4 -32Z" fill="#5a8a1f" stroke="#2c4a0a" stroke-width="2"/>
    ${face ? '<g stroke="none" fill="#3a1200"><polygon points="-10,-20 -4,-20 -7,-28"/><polygon points="10,-20 4,-20 7,-28"/><path d="M-12 -9 L-6 -12 L-2 -8 L2 -12 L7 -8 L12 -11 L9 -2 L4 -5 L0 -1 L-4 -5 L-9 -2Z"/></g>' : ''}</g>`;
  const candle = (x, y, h, flame) => `<g transform="translate(${x},${y})"><rect x="-5" y="${-h}" width="10" height="${h}" rx="2" fill="#f2e8cc" stroke="${O}" stroke-width="2"/>${flame === false ? '' : `<path d="M0 ${-h - 15} q8 9 0 15 q-8 -6 0 -15z" fill="#ffb02e" stroke="none"/><path d="M0 ${-h - 9} q4 4 0 8 q-4 -4 0 -8z" fill="#fff3b0" stroke="none"/>`}</g>`;
  const skullSvg = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})" stroke="#3a2f20" stroke-width="2"><path d="M-14 0 V-9 Q-16 -26 0 -26 Q16 -26 14 -9 V0 Q9 5 5 0 H-5 Q-9 5 -14 0Z" fill="#efe6cf"/><g stroke="none" fill="#1a1020"><ellipse cx="-6" cy="-13" rx="3.8" ry="4.6"/><ellipse cx="6" cy="-13" rx="3.8" ry="4.6"/><path d="M0 -7 l-2.4 5 h4.8z"/></g></g>`;

  const ART = {
    /* ---------- мебель ---------- */
    bed: sv('0 0 200 120', `<g stroke="${O}" stroke-width="3">
      <path d="M14 26 L46 6 H154 L186 26 L178 92 H22 Z" fill="#3b2012"/><path d="M30 26 L54 15 H146 L170 26 L164 80 H36 Z" fill="#4e2c18"/>
      <rect x="22" y="62" width="156" height="34" rx="6" fill="#6a2a9a"/><rect x="22" y="62" width="156" height="10" rx="5" fill="#8a4ac0"/>
      <ellipse cx="54" cy="60" rx="25" ry="10" fill="#efe6cf"/><rect x="26" y="94" width="14" height="22" fill="#2b1608"/><rect x="160" y="94" width="14" height="22" fill="#2b1608"/></g>
      <path d="M100 28 v24 M90 38 h20" stroke="#e0b868" stroke-width="5"/>`),
    armchair: sv('0 0 100 120', `<g stroke="${O}" stroke-width="3">
      <path d="M18 72 V26 L50 2 L82 26 V72Z" fill="#7a1d3a"/><rect x="6" y="62" width="22" height="42" rx="8" fill="#8a2448"/><rect x="72" y="62" width="22" height="42" rx="8" fill="#8a2448"/>
      <rect x="22" y="70" width="56" height="28" rx="6" fill="#a02c58"/><rect x="12" y="102" width="10" height="16" fill="#2b1608"/><rect x="78" y="102" width="10" height="16" fill="#2b1608"/></g>
      <g fill="#e0b868" stroke="${O}" stroke-width="1.5"><circle cx="50" cy="26" r="3.5"/><circle cx="50" cy="40" r="3.5"/><circle cx="50" cy="54" r="3.5"/></g>`),
    sofa: sv('0 0 220 110', `<g stroke="${O}" stroke-width="3">
      <rect x="22" y="14" width="176" height="56" rx="14" fill="#4a1d7a"/><rect x="6" y="46" width="34" height="52" rx="12" fill="#5a2a90"/><rect x="180" y="46" width="34" height="52" rx="12" fill="#5a2a90"/>
      <rect x="34" y="56" width="74" height="36" rx="8" fill="#6a38a8"/><rect x="112" y="56" width="74" height="36" rx="8" fill="#6a38a8"/>
      <rect x="20" y="96" width="12" height="12" fill="#2b1608"/><rect x="188" y="96" width="12" height="12" fill="#2b1608"/></g>${bat(110, 36, 0.9).replace(O, '#e8d0ff')}`),
    table: sv('0 0 160 110', `<g stroke="${O}" stroke-width="3">
      <path d="M34 36 L26 104 M126 36 L134 104 M80 40 V106" stroke-width="8" stroke="#4a2a12"/>
      <ellipse cx="80" cy="30" rx="74" ry="16" fill="#6a4020"/><ellipse cx="80" cy="26" rx="68" ry="12" fill="#7c4c26"/></g>
      <path d="M40 24 Q80 34 120 24" stroke="#4a2a12" stroke-width="2" fill="none"/>`),
    bookshelf: sv('0 0 120 200', `<g stroke="${O}" stroke-width="3"><rect x="6" y="4" width="108" height="192" rx="4" fill="#4a2c18"/><rect x="14" y="12" width="92" height="176" fill="#241208"/>
      <g fill="#5a371c"><rect x="14" y="58" width="92" height="6"/><rect x="14" y="104" width="92" height="6"/><rect x="14" y="150" width="92" height="6"/></g></g>
      <g stroke="${O}" stroke-width="1.5"><rect x="18" y="30" width="9" height="28" fill="#7a1d2e"/><rect x="28" y="24" width="10" height="34" fill="#1d4a5a"/><rect x="39" y="34" width="8" height="24" fill="#4a2c6a"/><rect x="48" y="26" width="11" height="32" fill="#6a4a1d"/><rect x="60" y="32" width="9" height="26" fill="#2c5a3a"/><rect x="72" y="28" width="10" height="30" fill="#8a3a1a"/><rect x="84" y="34" width="8" height="24" fill="#5a1d4a"/>
      <rect x="18" y="76" width="10" height="28" fill="#1d3a2a"/><rect x="29" y="70" width="9" height="34" fill="#7a1d2e"/><rect x="40" y="78" width="11" height="26" fill="#4a2c6a"/><rect x="68" y="72" width="10" height="32" fill="#1d4a5a"/><rect x="80" y="78" width="9" height="26" fill="#8a3a1a"/>
      <rect x="18" y="124" width="9" height="26" fill="#6a4a1d"/><rect x="28" y="118" width="11" height="32" fill="#5a1d4a"/><rect x="40" y="126" width="9" height="24" fill="#2c5a3a"/><rect x="52" y="120" width="10" height="30" fill="#7a1d2e"/>
      <rect x="18" y="168" width="10" height="20" fill="#1d4a5a"/><rect x="30" y="162" width="9" height="26" fill="#4a2c6a"/><rect x="42" y="170" width="11" height="18" fill="#6a4a1d"/></g>${skullSvg(86, 104, 0.8)}${pump(84, 150, 0.45, true)}`),
    wardrobe: sv('0 0 110 190', `<g stroke="${O}" stroke-width="3"><path d="M32 6 H78 L104 50 L98 184 H12 L6 50 Z" fill="#3b2013"/><path d="M55 14 V178" stroke-width="3"/>
      <path d="M30 30 H46 V170 H18 L14 54 Z" fill="#4e2c19" stroke-width="2"/><path d="M80 30 H64 V170 H92 L96 54 Z" fill="#4e2c19" stroke-width="2"/></g>
      <g fill="#e0b868" stroke="${O}" stroke-width="1.5"><circle cx="46" cy="100" r="4"/><circle cx="64" cy="100" r="4"/></g>${bat(55, 60, 0.7).replace(O, '#e0b868')}`),
    cauldron: sv('0 0 120 110', `<g stroke="${O}" stroke-width="3.4"><path d="M16 30 Q8 88 28 96 H92 Q112 88 104 30Z" fill="#23232e"/><ellipse cx="60" cy="30" rx="46" ry="13" fill="#6fd01e"/>
      <path d="M26 96 L20 108 M94 96 L100 108" stroke-width="6"/></g><g fill="#b6ff4a" stroke="${O}" stroke-width="1.5"><circle cx="46" cy="22" r="6"/><circle cx="68" cy="16" r="8"/><circle cx="82" cy="28" r="4"/></g>
      <path d="M30 56 Q36 50 42 56" stroke="#4a4a5e" stroke-width="3" fill="none"/>`),
    fireplace: sv('0 0 200 190', `<g stroke="${O}" stroke-width="3"><rect x="14" y="40" width="172" height="148" fill="#4b4458"/><rect x="4" y="22" width="192" height="24" rx="3" fill="#3a3046"/>
      <path d="M50 188 V104 Q50 62 100 62 Q150 62 150 104 V188Z" fill="#0d0714"/></g>
      <g stroke="none"><path d="M80 186 Q60 150 90 120 Q94 150 108 140 Q122 160 118 186Z" fill="#ff6a1a"/><path d="M100 186 Q92 156 112 134 Q122 160 130 186Z" fill="#ff9a2a"/><path d="M90 186 Q86 168 100 156 Q108 172 106 186Z" fill="#ffe06a"/></g>
      <rect x="64" y="176" width="72" height="12" rx="6" fill="#4a2a14" stroke="${O}" stroke-width="2.4"/>`),
    rug: sv('0 0 240 70', `<ellipse cx="120" cy="36" rx="116" ry="30" fill="#5e1f3c" stroke="#d08a2e" stroke-width="5"/><ellipse cx="120" cy="36" rx="96" ry="23" fill="none" stroke="#d08a2e" stroke-width="2.4" stroke-dasharray="7 5"/>
      <g stroke="#e8d0ff" stroke-width="1.6" fill="none" opacity=".8"><path d="M120 36 L40 36 M120 36 L200 36 M120 36 L68 18 M120 36 L172 18 M120 36 L68 54 M120 36 L172 54"/><ellipse cx="120" cy="36" rx="34" ry="9"/><ellipse cx="120" cy="36" rx="62" ry="17"/></g>
      <g transform="translate(120,36)"><ellipse rx="7" ry="6" fill="${O}"/><circle cy="-7" r="4" fill="${O}"/><g stroke="${O}" stroke-width="2" fill="none"><path d="M-6 -2 L-14 -7 L-17 1 M-7 2 L-15 6 L-17 12 M6 -2 L14 -7 L17 1 M7 2 L15 6 L17 12"/></g></g>`),
    chest: sv('0 0 130 90', `<g stroke="${O}" stroke-width="3.4"><rect x="8" y="34" width="114" height="52" rx="6" fill="#5a3418"/><path d="M8 38 Q8 6 65 4 Q122 6 122 38Z" fill="#6a3e1c"/>
      <rect x="8" y="50" width="114" height="9" fill="#c0902a" opacity=".85"/><rect x="55" y="42" width="20" height="26" rx="3" fill="#e0b040" stroke-width="2.4"/></g><circle cx="65" cy="54" r="3" fill="${O}"/>`),
    clock: sv('0 0 90 210', `<g stroke="${O}" stroke-width="3.4"><rect x="8" y="58" width="74" height="148" rx="5" fill="#4a2c18"/><path d="M8 58 Q8 8 45 4 Q82 8 82 58Z" fill="#5a371c"/>
      <circle cx="45" cy="50" r="30" fill="#efe6cf"/><rect x="24" y="92" width="42" height="94" rx="7" fill="#1d1008"/></g>
      <g stroke="#2a1608" stroke-width="3" fill="none"><path d="M45 50 V30 M45 50 L58 57"/><path d="M45 24V28 M45 72V76 M19 50H23 M67 50H71"/></g><path d="M45 96 V160" stroke="#d0a030" stroke-width="3"/><circle cx="45" cy="166" r="11" fill="#e0b040" stroke="${O}" stroke-width="2.4"/>`),
    throne: sv('0 0 120 170', `<g stroke="#6a2400" stroke-width="3.4"><ellipse cx="34" cy="62" rx="26" ry="56" fill="#ff8a1f"/><ellipse cx="86" cy="62" rx="26" ry="56" fill="#ff8a1f"/><ellipse cx="60" cy="62" rx="24" ry="60" fill="#ffa233"/>
      <path d="M52 8 Q56 -4 68 -2 L70 6 Q62 8 64 14Z" fill="#5a8a1f" stroke="#2c4a0a"/></g>
      <g stroke="${O}" stroke-width="3"><rect x="14" y="98" width="92" height="30" rx="8" fill="#7a1d2e"/><rect x="6" y="84" width="20" height="50" rx="8" fill="#e0b040"/><rect x="94" y="84" width="20" height="50" rx="8" fill="#e0b040"/><rect x="16" y="128" width="14" height="38" fill="#2b1608"/><rect x="90" y="128" width="14" height="38" fill="#2b1608"/></g>
      <g fill="#3a1200"><polygon points="44,40 54,40 49,28"/><polygon points="76,40 66,40 71,28"/><path d="M42 58 L52 54 L58 62 L64 54 L72 62 L78 54 L80 70 L70 64 L60 72 L50 64 L40 72Z"/></g>`),

    /* ---------- настенные ---------- */
    portrait: sv('0 0 100 120', `<g stroke="${O}" stroke-width="3.4"><rect x="6" y="6" width="88" height="108" rx="5" fill="#6a4a1c"/><rect x="15" y="15" width="70" height="90" fill="#1a1426"/></g>
      <ellipse cx="50" cy="56" rx="19" ry="24" fill="#cbbfa0"/><path d="M30 46 Q50 14 70 46 Q64 36 50 35 Q36 36 30 46Z" fill="#cfcfe0"/><ellipse cx="43" cy="54" rx="3.4" ry="3" fill="#111"/><ellipse cx="57" cy="54" rx="3.4" ry="3" fill="#111"/><path d="M43 70 Q50 65 57 70" stroke="#4a2a2a" stroke-width="2" fill="none"/>
      <path d="M15 105 Q34 82 50 84 Q66 82 85 105Z" fill="#2a1f40"/><path d="M42 84 L50 96 L58 84Z" fill="#e8e0ff"/>`),
    window: sv('0 0 120 150', `<g stroke="${O}" stroke-width="3.4"><rect x="12" y="10" width="96" height="130" rx="4" fill="#3a2314"/><rect x="20" y="18" width="80" height="114" fill="#141040"/></g>
      <circle cx="68" cy="52" r="17" fill="#ffe9a8"/><circle cx="76" cy="46" r="15" fill="#141040"/><g fill="#fff"><circle cx="34" cy="34" r="1.6"/><circle cx="48" cy="70" r="1.4"/><circle cx="90" cy="86" r="1.6"/><circle cx="30" cy="96" r="1.2"/></g>
      <path d="M20 132 V104 q10 -4 12 -18 q-8 -2 -9 -12 q12 4 17 16 q2 -14 14 -20 q-7 10 -3 21 q10 -2 14 -12 q0 12 -6 18 q8 4 10 14 V132Z" fill="#0b0818"/>
      <path d="M60 18V132M20 75H100" stroke="#3a2314" stroke-width="5"/><path d="M8 8 H40 C36 56 28 100 10 134 H8Z" fill="#7a1d45" stroke="${O}" stroke-width="2"/><path d="M112 8 H80 C84 56 92 100 110 134 H112Z" fill="#7a1d45" stroke="${O}" stroke-width="2"/>`),
    mirror: sv('0 0 80 130', `<ellipse cx="40" cy="65" rx="34" ry="58" fill="#c89a2a" stroke="${O}" stroke-width="3.4"/><ellipse cx="40" cy="65" rx="27" ry="50" fill="#9ac8e0" stroke="${O}" stroke-width="2.4"/>
      <path d="M26 40 Q40 20 52 30 M24 60 Q36 42 54 50" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/><path d="M40 4 L32 -2 M40 4 L48 -2" stroke="#c89a2a" stroke-width="3" fill="none"/>`),
    skullplate: sv('0 0 80 80', `<rect x="6" y="6" width="68" height="68" rx="8" fill="#4a2c17" stroke="${O}" stroke-width="3.4"/><g stroke="${O}" stroke-width="2" fill="#efe6cf"><rect x="10" y="50" width="60" height="7" rx="3.5" transform="rotate(-18 40 53)"/><rect x="10" y="50" width="60" height="7" rx="3.5" transform="rotate(18 40 53)"/></g>${skullSvg(40, 54, 1.45)}`),
    bats: sv('0 0 160 80', `${bat(30, 18, 1)}${bat(86, 40, 1.3)}${bat(132, 16, 0.8)}${bat(112, 62, 0.6)}`),
    web: sv('0 0 120 120', `<g stroke="#e8e0ff" stroke-width="1.8" fill="none" opacity=".85"><path d="M0 0 L120 0 M0 0 L110 50 M0 0 L82 90 M0 0 L44 114 M0 0 L0 120"/><path d="M30 0 Q22 22 0 30 M60 0 Q46 44 0 60 M90 0 Q70 66 0 90 M118 0 Q92 92 0 118"/></g>
      <g transform="translate(46,54)"><ellipse rx="6" ry="7" fill="${O}"/><circle cy="-7" r="4" fill="${O}"/><path d="M-5 -2 L-13 -7 L-15 1 M-6 2 L-14 6 L-15 12 M5 -2 L13 -7 L15 1 M6 2 L14 6 L15 12" stroke="${O}" stroke-width="1.8" fill="none"/></g>`),

    /* ---------- потолочные ---------- */
    chandelier: sv('0 0 160 110', `<path d="M80 0 V30" stroke="#3a2a1a" stroke-width="3"/><path d="M20 66 Q80 90 140 66 Q128 40 80 36 Q32 40 20 66Z" fill="#2a2030" stroke="${O}" stroke-width="3"/>
      <g stroke="#c89a2a" stroke-width="3" fill="none"><path d="M24 66 Q26 80 36 84 M136 66 Q134 80 124 84 M80 78 V96"/></g>${candle(30, 66, 16)}${candle(60, 74, 18)}${candle(100, 74, 18)}${candle(130, 66, 16)}${candle(80, 40, 18)}`),
    garland: sv('0 0 300 80', `<path d="M0 6 Q75 66 150 50 Q225 66 300 6" stroke="#3a2a1a" stroke-width="3" fill="none"/>
      ${pump(34, 56, 0.55, true)}${pump(92, 70, 0.5, false)}${pump(150, 72, 0.6, true)}${pump(208, 70, 0.5, false)}${pump(266, 56, 0.55, true)}
      <g fill="#ffd45a"><circle cx="62" cy="52" r="3.4"/><circle cx="120" cy="64" r="3.4"/><circle cx="180" cy="64" r="3.4"/><circle cx="238" cy="52" r="3.4"/></g>`),
    hangspider: sv('0 0 40 140', `<path d="M20 0 V90" stroke="#d8d0f0" stroke-width="1.6" opacity=".8"/><g transform="translate(20,102)"><ellipse rx="10" ry="12" fill="${O}"/><circle cy="-12" r="7" fill="${O}"/>
      <g stroke="${O}" stroke-width="2.4" fill="none"><path d="M-8 -3 L-20 -10 L-24 4 M-9 3 L-22 8 L-24 20 M8 -3 L20 -10 L24 4 M9 3 L22 8 L24 20"/></g><circle cx="-3" cy="-14" r="2" fill="#ff4040"/><circle cx="3" cy="-14" r="2" fill="#ff4040"/></g>`),

    /* ---------- напольные украшения ---------- */
    cat: sv('0 0 100 100', `<path d="M24 92 Q10 60 34 46 Q34 24 44 18 L48 4 L58 16 Q66 14 72 18 L78 4 L82 24 Q92 36 84 52 Q92 76 82 92Z" fill="${O}" stroke="#2a1d40" stroke-width="2"/>
      <path d="M26 86 Q-2 80 8 56" stroke="${O}" stroke-width="8" fill="none"/><ellipse cx="55" cy="34" rx="4" ry="5.4" fill="#ffd23a"/><ellipse cx="72" cy="34" rx="4" ry="5.4" fill="#ffd23a"/><path d="M62 42 l-2 3 h4z" fill="#ff8aa0"/>`),
    jack: sv('0 0 80 80', `<circle cx="40" cy="44" r="34" fill="#ffcc55" opacity=".25"/>${pump(40, 70, 1.2, true).replace('#3a1200', '#ffd45a')}`),
    candelabra: sv('0 0 80 170', `<g stroke="${O}" stroke-width="3"><path d="M40 164 V76" stroke="#c89a2a" stroke-width="7"/><path d="M10 164 H70 L62 152 H18Z" fill="#c89a2a"/><path d="M12 56 Q12 86 40 86 Q68 86 68 56" stroke="#c89a2a" stroke-width="5" fill="none"/></g>
      ${candle(12, 56, 28)}${candle(40, 70, 36)}${candle(68, 56, 28)}`),
    ghost: sv('0 0 80 100', `<g opacity=".92"><path d="M10 92 V40 Q10 6 40 6 Q70 6 70 40 V92 Q60 80 50 92 Q40 80 30 92 Q20 80 10 92Z" fill="#f0f4ff" stroke="#8a98c8" stroke-width="2.4"/>
      <ellipse cx="29" cy="40" rx="5" ry="8" fill="#1b2440"/><ellipse cx="51" cy="40" rx="5" ry="8" fill="#1b2440"/><ellipse cx="40" cy="60" rx="6" ry="8" fill="#1b2440"/></g>`),
    crystal: sv('0 0 80 100', `<g stroke="${O}" stroke-width="3"><path d="M14 96 L22 78 H58 L66 96Z" fill="#4a2c6b"/><circle cx="40" cy="48" r="30" fill="#8a5cff" opacity=".85"/></g>
      <path d="M22 42 Q30 24 48 26" stroke="#fff" stroke-width="5" fill="none" opacity=".6"/><g fill="#fff"><circle cx="50" cy="56" r="2.4"/><circle cx="34" cy="62" r="1.8"/><circle cx="56" cy="40" r="1.8"/></g>`),
    broom: sv('0 0 60 190', `<path d="M44 4 L22 140" stroke="#6a4a20" stroke-width="7" stroke-linecap="round"/><g stroke="#14091e" stroke-width="2"><path d="M12 138 L32 140 L40 186 L6 184Z" fill="#c89a3a"/></g><path d="M12 150 H36 M10 164 H38" stroke="#6a4a20" stroke-width="3"/><path d="M14 150 L12 184 M20 148 L20 186 M26 148 L28 186 M32 150 L36 184" stroke="#8a6a20" stroke-width="2"/>`),
    potions: sv('0 0 100 70', `<g stroke="${O}" stroke-width="2.6"><rect x="10" y="22" width="22" height="42" rx="8" fill="#c04cff" opacity=".92"/><rect x="14" y="10" width="14" height="14" rx="2" fill="#6a4a2a"/>
      <path d="M52 64 Q40 62 44 44 L50 26 V12 H62 V26 L68 44 Q72 62 60 64Z" fill="#7ee022" opacity=".92"/><rect x="48" y="6" width="18" height="8" rx="2" fill="#6a4a2a"/>
      <circle cx="82" cy="46" r="17" fill="#ff5a6a" opacity=".92"/><rect x="76" y="20" width="12" height="12" rx="2" fill="#6a4a2a"/></g><g fill="#fff" opacity=".6"><circle cx="18" cy="38" r="2.4"/><circle cx="56" cy="50" r="2.4"/><circle cx="76" cy="42" r="2.4"/></g>`),
    candybowl: sv('0 0 100 70', `<g stroke="${O}" stroke-width="2.4"><polygon points="30,14 38,14 34,2" fill="#fff6e0"/><polygon points="38,14 52,14 46,30 30,30" fill="#ff9a1f" stroke="none"/>
      <circle cx="62" cy="14" r="10" fill="#8a4fff"/><polygon points="48,14 56,6 56,22" fill="#ff7ac8"/><polygon points="76,14 68,6 68,22" fill="#ff7ac8"/><circle cx="46" cy="16" r="8" fill="#ffd93a"/></g>
      <path d="M8 26 Q8 66 50 66 Q92 66 92 26Z" fill="#8a2a4a" stroke="${O}" stroke-width="3.4"/><path d="M8 26 H92" stroke="#e0b868" stroke-width="4"/>`),
    witchhat: sv('0 0 100 90', `<g stroke="${O}" stroke-width="3"><ellipse cx="50" cy="72" rx="46" ry="12" fill="#241040"/><path d="M26 70 C34 50 42 30 50 8 C54 0 64 0 68 8 C62 10 62 22 66 34 C70 48 76 60 78 70 Z" fill="#2c1550"/><path d="M28 62 Q50 72 76 62 L78 70 Q50 82 26 70Z" fill="#ff7a1a"/></g><rect x="46" y="62" width="12" height="12" rx="2" fill="#ffd45a" stroke="${O}" stroke-width="2"/>`)
  };

  /* ---------- Текстуры ----------
     Каждая заливка нужного цвета получает сверху «копию» с рисунком (дерево, ткань, камень…) и тенью.
     Сами плитки рисует js/textures.js; здесь только решаем, какой цвет какой материал. */
  const MATERIALS = {
    wood: ['#2b1608', '#3b2012', '#4e2c18', '#4a2c17', '#5a371c', '#4a2a14', '#5a3418', '#6a3e1c', '#6a4020', '#7c4c26', '#6a4a1c', '#3a2314', '#6a4a2a'],
    woodv: ['#3b2013', '#4e2c19', '#4a2c18', '#c89a3a'],              // волокна вдоль (дверцы, корпус шкафа, стойки, солома)
    leather: ['#7a1d2e', '#1d3a2a', '#1d4a5a', '#2c5a3a', '#4a2c6a', '#5a1d4a', '#6a4a1d', '#8a3a1a'],
    quilt: ['#4a1d7a', '#7a1d3a'],
    weave: ['#5a2a90', '#6a38a8', '#6a2a9a', '#8a4ac0', '#8a2448', '#a02c58', '#7a1d45'],
    stone: ['#4b4458', '#3a3046'],
    iron: ['#23232e', '#2a2030'],
    gold: ['#c89a2a', '#c0902a', '#e0b040'],
    rug: ['#5e1f3c']
  };
  const SHADE = { wood: 'sh-a', woodv: 'sh-a', leather: 'sh-v', quilt: 'sh-a', weave: 'sh-a', stone: 'sh-v', iron: 'sh-h', gold: 'sh-a', rug: '' };
  const MAT_OF = {};
  Object.keys(MATERIALS).forEach(k => MATERIALS[k].forEach(c => { MAT_OF[c] = k; }));
  const texturize = svg => svg.replace(/<(rect|path|ellipse|circle|polygon)\b([^>]*?)\/>/g, (m, tag, attrs) => {
    const f = /\bfill="(#[0-9a-fA-F]{6})"/.exec(attrs);
    const kind = f && MAT_OF[f[1].toLowerCase()];
    if (!kind) return m;
    const a = attrs.replace(/\s*\bfill="#[0-9a-fA-F]{6}"/, '').replace(/\s*\bstroke(?:-[a-z]+)?="[^"]*"/g, '');
    let out = m + `<${tag}${a} fill="url(#tx-${kind})" stroke="none"/>`;
    if (SHADE[kind]) out += `<${tag}${a} fill="url(#${SHADE[kind]})" stroke="none"/>`;
    return out;
  });
  Object.keys(ART).forEach(k => { ART[k] = texturize(ART[k]); });

  /* Предметы-картинки (надгробия, ограда): рисуются при первом показе, а не при запуске игры */
  const img = (w, h, url) => sv('0 0 ' + w + ' ' + h, `<image href="${url}" x="0" y="0" width="${w}" height="${h}"/>`);
  const LAZY = {
    tomb: () => img(80, 100, G.art.tombUrl(0, 80, 100, 3, 2)),
    tombcross: () => img(80, 100, G.art.tombUrl(1, 80, 100, 4, 2)),
    tombrip: () => img(90, 100, G.art.tombUrl(3, 90, 100, 5, 2)),
    tombskull: () => img(80, 100, G.art.tombUrl(4, 80, 100, 6, 2)),
    tombobelisk: () => img(80, 100, G.art.tombUrl(2, 80, 100, 7, 2)),
    fence: () => img(240, 80, G.art.fenceUrl(240, 80, 2))
  };

  /* id, название, раздел, место, цена, ширина (% комнаты), доп. */
  const LIST = [
    // мебель
    { id: 'bed', name: 'Кровать-гроб', cat: 'furniture', slot: 'floor', price: 220, w: 22 },
    { id: 'armchair', name: 'Готическое кресло', cat: 'furniture', slot: 'floor', price: 120, w: 11 },
    { id: 'sofa', name: 'Диван с летучей мышью', cat: 'furniture', slot: 'floor', price: 260, w: 24 },
    { id: 'table', name: 'Стол ведьмы', cat: 'furniture', slot: 'floor', price: 130, w: 16 },
    { id: 'bookshelf', name: 'Книжный шкаф', cat: 'furniture', slot: 'floor', price: 200, w: 13 },
    { id: 'wardrobe', name: 'Шкаф-гроб', cat: 'furniture', slot: 'floor', price: 240, w: 12 },
    { id: 'cauldron', name: 'Ведьмин котёл', cat: 'furniture', slot: 'floor', price: 150, w: 12 },
    { id: 'fireplace', name: 'Камин', cat: 'furniture', slot: 'floor', price: 300, w: 20 },
    { id: 'rug', name: 'Ковёр с пауком', cat: 'furniture', slot: 'floor', price: 90, w: 26, flat: true },
    { id: 'chest', name: 'Сундук с сокровищами', cat: 'furniture', slot: 'floor', price: 110, w: 13 },
    { id: 'clock', name: 'Напольные часы', cat: 'furniture', slot: 'floor', price: 180, w: 9 },
    { id: 'throne', name: 'Трон Короля Тыкв', cat: 'furniture', slot: 'floor', price: 480, w: 13 },
    // украшения
    { id: 'portrait', name: 'Портрет призрака', cat: 'decor', slot: 'wall', price: 70, w: 9 },
    { id: 'window', name: 'Окно с луной', cat: 'decor', slot: 'wall', price: 120, w: 12 },
    { id: 'mirror', name: 'Зеркало', cat: 'decor', slot: 'wall', price: 90, w: 7 },
    { id: 'skullplate', name: 'Череп на стене', cat: 'decor', slot: 'wall', price: 45, w: 7 },
    { id: 'bats', name: 'Стая летучих мышей', cat: 'decor', slot: 'wall', price: 35, w: 13 },
    { id: 'web', name: 'Паутина с пауком', cat: 'decor', slot: 'wall', price: 25, w: 10 },
    { id: 'chandelier', name: 'Люстра со свечами', cat: 'decor', slot: 'ceiling', price: 160, w: 15 },
    { id: 'garland', name: 'Гирлянда из тыкв', cat: 'decor', slot: 'ceiling', price: 70, w: 40 },
    { id: 'hangspider', name: 'Паук на нити', cat: 'decor', slot: 'ceiling', price: 30, w: 4 },
    { id: 'cat', name: 'Чёрный кот', cat: 'decor', slot: 'floor', price: 60, w: 8 },
    { id: 'jack', name: 'Тыква-фонарь', cat: 'decor', slot: 'floor', price: 40, w: 8 },
    { id: 'candelabra', name: 'Канделябр', cat: 'decor', slot: 'floor', price: 55, w: 6 },
    { id: 'ghost', name: 'Дружелюбный призрак', cat: 'decor', slot: 'floor', price: 80, w: 8 },
    { id: 'crystal', name: 'Хрустальный шар', cat: 'decor', slot: 'floor', price: 100, w: 7 },
    { id: 'broom', name: 'Ведьмина метла', cat: 'decor', slot: 'floor', price: 50, w: 5 },
    { id: 'potions', name: 'Зелья', cat: 'decor', slot: 'floor', price: 40, w: 9 },
    { id: 'tomb', name: 'Надгробие', cat: 'decor', slot: 'floor', price: 50, w: 7 },
    { id: 'tombcross', name: 'Каменный крест', cat: 'decor', slot: 'floor', price: 55, w: 7 },
    { id: 'tombrip', name: 'Плита RIP', cat: 'decor', slot: 'floor', price: 60, w: 8 },
    { id: 'tombskull', name: 'Надгробие с черепом', cat: 'decor', slot: 'floor', price: 70, w: 7 },
    { id: 'tombobelisk', name: 'Остроконечное надгробие', cat: 'decor', slot: 'floor', price: 55, w: 7 },
    { id: 'fence', name: 'Кладбищенская ограда', cat: 'decor', slot: 'floor', price: 85, w: 22 },
    { id: 'candybowl', name: 'Чаша с конфетами', cat: 'decor', slot: 'floor', price: 45, w: 9 },
    { id: 'witchhat', name: 'Шляпа ведьмы', cat: 'decor', slot: 'floor', price: 35, w: 8 }
  ];
  LIST.forEach(it => {
    if (LAZY[it.id]) {
      let cached = null;
      Object.defineProperty(it, 'art', { enumerable: true, get() { return cached || (cached = LAZY[it.id]()); } });
    } else it.art = ART[it.id];
  });

  G.items = {
    warmJobs: () => Object.keys(LAZY).map(id => () => { G.items.byId[id].art; }),   // фоновая подготовка картинок-предметов
    list: LIST,
    byId: Object.fromEntries(LIST.map(i => [i.id, i])),
    slotLabel: { floor: 'на пол', wall: 'на стену', ceiling: 'под потолок' }
  };
})();
