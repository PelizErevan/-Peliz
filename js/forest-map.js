/* =========================================================
   Карта «Тёмный лес»: ночной лес и десять локаций-мини-игр.
   Рисунки собраны из SVG-фигур (без картинок). Локации используют те же
   кирпичики, что и городская карта (G.mapKit из map.js).
   ========================================================= */
(function () {
  'use strict';
  const K = G.mapKit;
  const W = 2000;

  /* ---------- общие детали ---------- */
  const ghostShape = (x, y, s, op) => `<g transform="translate(${x},${y}) scale(${s || 1})" opacity="${op || 0.92}">
    <path d="M-20 0 V-24 Q-20 -50 0 -50 Q20 -50 20 -24 V0 Q13 -8 7 0 Q0 -8 -7 0 Q-13 -8 -20 0Z" fill="#f4fff8"/>
    <ellipse cx="-7" cy="-28" rx="3.5" ry="5" fill="#0f2a24"/><ellipse cx="7" cy="-28" rx="3.5" ry="5" fill="#0f2a24"/><ellipse cx="0" cy="-17" rx="3" ry="4" fill="#0f2a24"/></g>`;
  const wisp = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="${c}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  const shadow = (rx, ry, fill) => `<ellipse cx="0" cy="6" rx="${rx}" ry="${ry}" fill="#030c0d"/><ellipse cx="0" cy="3" rx="${rx - 12}" ry="${ry - 8}" fill="${fill || '#12382c'}" opacity=".8"/>`;
  const candleSmall = (x, y, h) => `<g transform="translate(${x},${y})"><rect x="-4" y="${-h}" width="8" height="${h}" fill="#f3e3b8" stroke="#08030f" stroke-width="2"/>
    <path class="flame" d="M0 ${-h - 1} Q-5 ${-h - 9} 0 ${-h - 17} Q5 ${-h - 9} 0 ${-h - 1}Z" fill="#ffb347"/></g>`;

  /* ---------- 7. Болото призраков ---------- */
  function artSwamp() {
    return `
      ${shadow(172, 26, '#0e3b30')}
      <ellipse cx="-24" cy="-1" rx="104" ry="10" fill="#1f7a5a" opacity=".5"/>
      <ellipse cx="-72" cy="4" rx="22" ry="5" fill="#2f9a45"/><ellipse cx="42" cy="8" rx="18" ry="4.5" fill="#2f9a45"/><ellipse cx="98" cy="1" rx="14" ry="3.5" fill="#37ad4c"/>
      <g stroke="#2d6a35" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M-136 8 Q-140 -30 -132 -62"/><path d="M-126 8 Q-124 -40 -116 -76"/><path d="M-148 8 Q-154 -24 -160 -50"/><path d="M-110 8 Q-106 -22 -100 -44"/></g>
      <g fill="#6a3a1a" stroke="#1d0d05" stroke-width="1.5"><rect x="-136" y="-80" width="8" height="22" rx="4" transform="rotate(8 -132 -62)"/><rect x="-120" y="-92" width="8" height="22" rx="4" transform="rotate(10 -116 -76)"/><rect x="-164" y="-64" width="8" height="20" rx="4" transform="rotate(-8 -160 -50)"/></g>
      <g stroke="#0c0714" stroke-linecap="round" fill="none"><path d="M112 8 C114 -30 104 -66 114 -104" stroke-width="13"/><path d="M114 -104 C98 -124 80 -128 62 -146 M114 -104 C130 -126 150 -130 162 -154" stroke-width="7"/><path d="M112 -70 C132 -78 142 -74 154 -88" stroke-width="5"/></g>
      <g stroke="#2f6a4a" stroke-width="2.4" fill="none" opacity=".75" stroke-linecap="round"><path d="M64 -146 q-6 16 0 30 M80 -128 q-4 14 2 24 M150 -130 q4 14 -2 26 M162 -154 q6 16 0 28"/></g>
      <g class="ghost-float">${ghostShape(8, -70, 1.1)}</g>
      <g class="ghost-float" style="animation-delay:1.4s">${wisp(-64, -52, 4.5, '#c8ff6a')}${wisp(70, -40, 3.5, '#9dffd0')}</g>
      <g transform="translate(-96,8)"><path d="M0 0 V-46" stroke="#2a1a10" stroke-width="5" stroke-linecap="round"/><rect x="-6" y="-56" width="42" height="22" rx="4" fill="#5a3a1a" stroke="#2a1a10" stroke-width="2.5" transform="rotate(-6)"/><text x="15" y="-40" text-anchor="middle" font-size="14" transform="rotate(-6)">💀</text></g>
      ${K.bat(30, -150, 0.7)}`;
  }

  /* ---------- 8. Пещера летучих мышей ---------- */
  function artBats() {
    let teeth = '';
    for (let i = -3; i <= 3; i++) teeth += `<polygon points="${i * 17 - 7},-102 ${i * 17 + 7},-102 ${i * 17},${-102 + 20 + (i % 2 ? 12 : 4)}" fill="#403a5e" stroke="#08030f" stroke-width="2"/>`;
    return `
      ${shadow(168, 24, '#1a2b3a')}
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <path d="M-158 6 Q-160 -84 -70 -128 Q0 -166 74 -124 Q158 -84 156 6 Z" fill="#3b3656"/>
        <path d="M-120 6 Q-118 -62 -60 -100 Q-20 -124 20 -118" fill="none" stroke="#5a5480" stroke-width="3" opacity=".7"/>
        <path d="M-64 6 V-60 Q-64 -106 0 -106 Q64 -106 64 -60 V6 Z" fill="#05020c"/>
      </g>
      ${teeth}
      <g fill="#ffd45a"><circle cx="-20" cy="-52" r="3.2" class="bulb"/><circle cx="-9" cy="-52" r="3.2" class="bulb"/><circle cx="24" cy="-34" r="2.6" class="bulb" style="animation-delay:.7s"/><circle cx="33" cy="-34" r="2.6" class="bulb" style="animation-delay:.7s"/></g>
      <g stroke="#08030f" stroke-width="2.5" fill="#4a4468"><ellipse cx="-122" cy="2" rx="22" ry="12"/><ellipse cx="124" cy="4" rx="26" ry="14"/><ellipse cx="96" cy="-6" rx="16" ry="9"/></g>
      ${K.bat(-96, -150, 1.1)}${K.bat(-40, -188, 0.8)}${K.bat(70, -176, 1)}${K.bat(130, -130, 0.7)}${K.bat(-150, -110, 0.65)}`;
  }

  /* ---------- 9. Зельеварня ---------- */
  function artPotion() {
    return `
      ${shadow(160, 24, '#233327')}
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <rect x="-96" y="-78" width="92" height="80" fill="#4d3562"/>
        <path d="M-96 -52 H-4 M-96 -26 H-4" stroke="#2c1648" stroke-width="2.5"/>
        <path d="M-108 -76 L-52 -142 L8 -76 Z" fill="#2c1550"/>
        <path d="M-102 -82 Q-50 -64 14 -82 L8 -72 Q-50 -56 -108 -72 Z" fill="#6a3f9a"/>
        <rect x="-26" y="-130" width="16" height="42" fill="#2a1a3a"/>
      </g>
      <path d="M-62 2 V-30 Q-62 -46 -48 -46 Q-34 -46 -34 -30 V2Z" fill="#150a28" stroke="#08030f" stroke-width="3"/>
      <path d="M-58 2 V-30 Q-58 -42 -48 -42 Q-38 -42 -38 -30 V2Z" fill="#b6ff4a" opacity=".5" class="win"/>
      <rect x="-86" y="-60" width="18" height="20" rx="3" fill="#b6ff4a" opacity=".85" class="win"/><rect x="-86" y="-60" width="18" height="20" rx="3" fill="none" stroke="#08030f" stroke-width="2.5"/>
      <g class="smoke"><circle cx="-18" cy="-134" r="7" fill="#9bd9c0" opacity=".5"/><circle cx="-12" cy="-152" r="10" fill="#9bd9c0" opacity=".32"/><circle cx="-4" cy="-174" r="13" fill="#9bd9c0" opacity=".2"/></g>
      <g transform="translate(64,4)"><path d="M-44 -52 Q-56 -4 -34 0 H34 Q56 -4 44 -52 Z" fill="#1b1b24" stroke="#08030f" stroke-width="3.5"/>
        <ellipse cx="0" cy="-52" rx="44" ry="11" fill="#7ee022" stroke="#08030f" stroke-width="3"/>
        <ellipse cx="-12" cy="-54" rx="12" ry="3" fill="#d4ff8a" opacity=".6"/>
        <g class="bubble"><circle cx="-14" cy="-64" r="6" fill="#b6ff4a"/><circle cx="10" cy="-72" r="4.5" fill="#d4ff8a"/><circle cx="22" cy="-60" r="3.5" fill="#b6ff4a"/></g>
        <path d="M-34 0 L-42 14 M34 0 L42 14" stroke="#08030f" stroke-width="5" stroke-linecap="round"/></g>
      <g transform="translate(-130,4)"><rect x="-6" y="-22" width="12" height="22" rx="4" fill="#c04cff" stroke="#08030f" stroke-width="2"/><rect x="-3" y="-30" width="6" height="9" fill="#6a4a2a" stroke="#08030f" stroke-width="1.5"/>
        <rect x="14" y="-18" width="12" height="18" rx="4" fill="#4ab8ff" stroke="#08030f" stroke-width="2"/></g>
      ${K.bat(100, -120, 0.7)}`;
  }

  /* ---------- 10. Тыквенная грядка ---------- */
  function artPumpkin() {
    return `
      ${shadow(176, 26, '#243a1c')}
      <g stroke="#3a6a1a" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".9"><path d="M-150 8 q2 -14 -3 -22 M-146 8 q0 -10 6 -16 M140 8 q2 -14 -3 -22 M146 8 q0 -10 6 -16"/></g>
      <g stroke="#6a5030" stroke-width="5" stroke-linecap="round"><path d="M-170 8 V-34 M-146 8 V-30 M-122 8 V-34 M-176 -20 H-116" /></g>
      ${K.pumpkin(-96, 6, 0.95, false)}${K.pumpkin(-44, 10, 0.75, true)}${K.pumpkin(56, 8, 1.1, true)}${K.pumpkin(112, 8, 0.8, false)}${K.pumpkin(150, 10, 0.6, true)}${K.pumpkin(-6, 12, 0.55, false)}
      <g transform="translate(12,2)" stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <path d="M0 4 V-120" stroke="#6a4a20" stroke-width="7" fill="none"/>
        <path d="M-52 -92 H52" stroke="#6a4a20" stroke-width="7" stroke-linecap="round"/>
        <path d="M-22 -96 L22 -96 L18 -52 L-18 -52 Z" fill="#9a7a30"/>
        <path d="M-52 -92 l-4 14 M-44 -92 l-2 12 M52 -92 l4 14 M44 -92 l2 12" stroke="#d8b86a" stroke-width="3"/>
        <circle cx="0" cy="-112" r="15" fill="#d8b86a"/>
        <path d="M-22 -118 H22 L12 -154 H-12 Z" fill="#2a1a14"/><path d="M-30 -118 H30" stroke="#2a1a14" stroke-width="6" stroke-linecap="round"/>
        <circle cx="-5" cy="-113" r="2.2" fill="#2a1a14" stroke="none"/><circle cx="5" cy="-113" r="2.2" fill="#2a1a14" stroke="none"/><path d="M-6 -104 q6 5 12 0" stroke="#2a1a14" stroke-width="1.8" fill="none"/>
      </g>
      <g transform="translate(-30,-100)" fill="#07030f"><path d="M0 0 q8 -12 18 -6 l8 -2 -6 6 q-6 8 -14 6 z"/><circle cx="20" cy="-8" r="1.2" fill="#ffd45a"/></g>
      ${K.bat(100, -170, 0.8)}`;
  }

  /* ---------- 11. Паучья роща ---------- */
  function artSpider() {
    let web = '';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; web += `M0 0 L${(Math.cos(a) * 66).toFixed(1)} ${(Math.sin(a) * 66).toFixed(1)} `; }
    let rings = '';
    [18, 36, 54].forEach(r => { let d = ''; for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 4, rr = r * (i % 2 ? 0.9 : 1); d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1) + ' '; } rings += d + 'Z '; });
    return `
      ${shadow(170, 24, '#1a2a2e')}
      <g stroke="#0c0714" stroke-linecap="round" fill="none"><path d="M-120 8 C-122 -40 -134 -80 -118 -140" stroke-width="15"/><path d="M-118 -140 C-134 -160 -142 -176 -132 -198 M-122 -96 C-98 -110 -88 -128 -92 -150" stroke-width="7"/>
        <path d="M122 8 C124 -40 134 -84 118 -144" stroke-width="15"/><path d="M118 -144 C134 -166 146 -176 140 -204 M122 -92 C98 -104 88 -120 92 -146" stroke-width="7"/></g>
      <g transform="translate(0,-96)" stroke="#e8f0ff" fill="none" stroke-linejoin="round" opacity=".8">
        <path d="${web}" stroke-width="1.4"/><path d="${rings}" stroke-width="1.2"/>
        <path d="M-66 0 L-92 -18 M66 0 L92 -18 M0 -66 L-10 -100 M0 66 L6 96" stroke-width="1.2"/></g>
      <g fill="#bfe8ff" opacity=".9"><circle cx="-36" cy="-96" r="2.6"/><circle cx="24" cy="-72" r="2.2"/><circle cx="40" cy="-110" r="2"/><circle cx="-8" cy="-130" r="2.4"/></g>
      <g class="ghost-float"><g transform="translate(6,-84)"><path d="M0 -40 V-60" stroke="#e8f0ff" stroke-width="1.5"/>
        <ellipse cx="0" cy="0" rx="14" ry="16" fill="#0b0810"/><circle cx="0" cy="-17" r="9" fill="#0b0810"/>
        <g stroke="#0b0810" stroke-width="3" fill="none" stroke-linecap="round"><path d="M-12 -4 L-30 -16 L-36 2 M-13 4 L-32 8 L-34 26 M12 -4 L30 -16 L36 2 M13 4 L32 8 L34 26"/></g>
        <circle cx="-3.5" cy="-19" r="2.4" fill="#ff3a4a"/><circle cx="3.5" cy="-19" r="2.4" fill="#ff3a4a"/><path d="M0 -6 l-4 8 h8z" fill="#c4202e"/></g></g>
      <g fill="#0b0810"><ellipse cx="-70" cy="0" rx="5" ry="4"/><ellipse cx="90" cy="2" rx="4" ry="3.2"/></g>
      ${wisp(-86, -20, 3.2, '#9dffd0')}`;
  }

  /* ---------- 12. Туманный лабиринт ---------- */
  function hedge(x, y, w, h) {
    let leaves = '';
    for (let i = 0; i < Math.max(2, Math.round(w / 18)); i++) leaves += `<circle cx="${x + 9 + i * 18}" cy="${y + 8 + (i % 2) * 10}" r="5" fill="#2f7a3a" opacity=".6"/>`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#1d5a2e" stroke="#08130d" stroke-width="3"/>${leaves}`;
  }
  function artMaze() {
    return `
      ${shadow(176, 26, '#16392a')}
      ${hedge(-160, -92, 62, 94)}${hedge(-96, -122, 44, 124)}${hedge(-48, -82, 28, 84)}${hedge(18, -104, 36, 106)}${hedge(56, -76, 52, 78)}${hedge(108, -112, 52, 114)}
      ${hedge(-140, -50, 44, 52)}${hedge(66, -40, 70, 44)}
      <g stroke="#08130d" stroke-width="3"><path d="M-18 4 V-62 Q-18 -90 0 -90 Q18 -90 18 -62 V4 Z" fill="#05140d"/><path d="M-28 4 V-66 Q-28 -102 0 -102 Q28 -102 28 -66 V4" fill="none" stroke="#2f8a44" stroke-width="7"/></g>
      <path d="M-12 4 V-60 Q-12 -80 0 -80 Q12 -80 12 -60 V4Z" fill="#b6ff9a" opacity=".16"/>
      <g transform="translate(34,-62)"><path d="M0 -26 V0" stroke="#2a1a10" stroke-width="3"/><rect x="-7" y="0" width="14" height="18" rx="3" fill="#ffd45a" class="bulb"/><rect x="-7" y="0" width="14" height="18" rx="3" fill="none" stroke="#08030f" stroke-width="2.5"/></g>
      <ellipse cx="-70" cy="-10" rx="86" ry="12" fill="#cfffe6" opacity=".16"/><ellipse cx="70" cy="-28" rx="90" ry="12" fill="#cfffe6" opacity=".14"/><ellipse cx="0" cy="-70" rx="120" ry="10" fill="#cfffe6" opacity=".1"/>
      <text x="-2" y="-110" text-anchor="middle" font-size="22" font-weight="900" fill="#b6ff9a" font-family="Georgia,serif" opacity=".9">?</text>
      ${K.bat(-108, -150, 0.7)}`;
  }

  /* ---------- 13. Часовня свечей ---------- */
  function artCandle() {
    return `
      ${shadow(160, 24, '#262b3f')}
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <rect x="-86" y="-104" width="172" height="106" fill="#6f6a8c"/>
        <polygon points="-96,-102 0,-170 96,-102" fill="#85809f"/>
        <rect x="-26" y="-208" width="52" height="66" fill="#77729a"/>
        <polygon points="-32,-206 0,-250 32,-206" fill="#4a4566"/>
        <rect x="-70" y="-90" width="12" height="92" fill="#8f8aaf"/><rect x="58" y="-90" width="12" height="92" fill="#8f8aaf"/>
        <path d="M-32 2 V-52 Q-32 -80 0 -80 Q32 -80 32 -52 V2Z" fill="#150a28"/>
        <path d="M-52 10 H52 L58 16 H-58 Z" fill="#4a4666"/>
      </g>
      <path d="M-24 2 V-50 Q-24 -70 0 -70 Q24 -70 24 -50 V2Z" fill="#ffb347" opacity=".55" class="win"/>
      <circle cx="0" cy="-130" r="17" fill="#ffb347" class="win"/><circle cx="0" cy="-130" r="19" fill="none" stroke="#08030f" stroke-width="3"/><path d="M0 -147 V-113 M-17 -130 H17 M-12 -142 L12 -118 M12 -142 L-12 -118" stroke="#3a1a00" stroke-width="2"/>
      <path d="M-8 -190 q8 -10 16 0 v16 h-16z" fill="#05020c"/><circle cx="0" cy="-182" r="3.5" fill="#d8b04a"/>
      ${candleSmall(-110, 4, 22)}${candleSmall(-132, 8, 14)}${candleSmall(110, 4, 24)}${candleSmall(134, 8, 16)}${candleSmall(-48, 12, 12)}${candleSmall(52, 12, 10)}
      <ellipse cx="0" cy="-30" rx="150" ry="70" fill="#ffb347" opacity=".07"/>
      ${K.bat(-94, -230, 0.8)}${K.bat(100, -216, 0.7)}`;
  }

  /* ---------- 14. Гробовщик ---------- */
  function artGrave() {
    let planks = '';
    for (let i = 0; i < 8; i++) planks += `M${-100 + i * 14} -86 V0 `;
    return `
      ${shadow(168, 24, '#23252a')}
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <rect x="-100" y="-86" width="112" height="88" fill="#4a3426"/>
        <path d="${planks}" stroke="#2c1d14" stroke-width="2" fill="none"/>
        <polygon points="-112,-84 -44,-132 24,-84" fill="#2a1d2e"/>
        <rect x="-20" y="-66" width="26" height="30" fill="#05020c"/>
        <path d="M-84 2 V-52 H-40 V2" fill="#1c130d"/>
      </g>
      <rect x="-14" y="-60" width="14" height="20" fill="#ffd45a" class="win"/><path d="M-7 -60 V-40 M-14 -50 H0" stroke="#08030f" stroke-width="2"/>
      <g transform="translate(40,4) rotate(8)" stroke="#08030f" stroke-width="3" stroke-linejoin="round"><polygon points="-18,-110 18,-110 28,-64 18,0 -18,0 -28,-64" fill="#3a2418"/>
        <path d="M-18 -110 L-28 -64 L-18 0 M18 -110 L28 -64 L18 0" fill="none" stroke="#2a1a10"/><path d="M-22 -88 H22 M-26 -40 H26" stroke="#c9a64a" stroke-width="3"/><path d="M0 -104 V-14" stroke="#2a1a10" stroke-width="2"/></g>
      <ellipse cx="108" cy="6" rx="40" ry="10" fill="#2a1d14"/><path d="M72 6 Q108 -22 144 6Z" fill="#3a2a1c" stroke="#08030f" stroke-width="2.5"/>
      <g transform="translate(120,2) rotate(14)"><path d="M0 0 V-84" stroke="#6a4a20" stroke-width="5" stroke-linecap="round"/><path d="M-10 -84 H10 L8 -108 H-8 Z" fill="#8a8aa0" stroke="#08030f" stroke-width="2.5"/></g>
      <g transform="translate(-134,4)"><path d="M-15 0 V-30 Q-15 -48 0 -48 Q15 -48 15 -30 V0Z" fill="#8a86a3" stroke="#2f2848" stroke-width="3.5"/><path d="M-8 -32 H8 M0 -40 V-24" stroke="#4d4868" stroke-width="3" stroke-linecap="round"/></g>
      <g transform="translate(-160,6) rotate(-9)"><path d="M-12 0 V-24 Q-12 -38 0 -38 Q12 -38 12 -24 V0Z" fill="#7d7a98" stroke="#2f2848" stroke-width="3"/></g>
      <g transform="translate(-70,-100)"><path d="M0 -30 V0" stroke="#2a1a10" stroke-width="3"/><rect x="-6" y="0" width="12" height="16" rx="3" fill="#ffd45a" class="bulb"/><rect x="-6" y="0" width="12" height="16" rx="3" fill="none" stroke="#08030f" stroke-width="2.5"/></g>
      ${K.bat(-30, -170, 0.8)}${K.bat(120, -150, 0.7)}`;
  }

  /* ---------- 15. Дом сладостей ---------- */
  function artCandy() {
    let drops = '';
    ['#ff5a8a', '#ffd45a', '#8aff6a', '#6ab8ff', '#ff8aff', '#ff9a1f'].forEach((c, i) => { drops += `<circle cx="${-58 + i * 22}" cy="${-116 + (i % 2) * 12}" r="7" fill="${c}" stroke="#08030f" stroke-width="2"/>`; });
    return `
      ${shadow(164, 24, '#3a2a30')}
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <rect x="-84" y="-92" width="168" height="94" rx="6" fill="#b8683a"/>
        <path d="M-84 -60 H84 M-84 -30 H84" stroke="#8a4a24" stroke-width="3" fill="none"/>
        <polygon points="-102,-88 0,-166 102,-88" fill="#ff8ab5"/>
        <path d="M-102 -88 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0" fill="#fff6fb"/>
        <rect x="-28" y="-60" width="46" height="62" rx="4" fill="#5a3320"/>
        <path d="M-5 -60 V2 M-28 -40 H18 M-28 -18 H18" stroke="#3a2010" stroke-width="2.5"/>
      </g>
      ${drops}
      <circle cx="-62" cy="-62" r="12" fill="#ffd45a" class="win"/><circle cx="-62" cy="-62" r="13.5" fill="none" stroke="#08030f" stroke-width="3"/>
      <rect x="40" y="-72" width="28" height="34" rx="4" fill="#ffd45a" class="win" style="animation-delay:1s"/><rect x="40" y="-72" width="28" height="34" rx="4" fill="none" stroke="#08030f" stroke-width="3"/>
      <g stroke-linecap="round" fill="none"><path d="M-124 6 V-70 q0 -16 14 -16" stroke="#f3eada" stroke-width="7"/><path d="M-124 6 V-70 q0 -16 14 -16" stroke="#e8283c" stroke-width="7" stroke-dasharray="7 9"/></g>
      ${K.lollipop(120, 6, 0.95, '#c04cff', '#fff')}${K.lollipop(144, 8, 0.75, '#9be22b', '#2a0d44')}${K.candyCorn(-150, 6, 0.55, -6)}
      <ellipse cx="0" cy="-60" rx="120" ry="70" fill="#ffd0e8" opacity=".08"/>
      ${K.bat(60, -190, 0.7)}`;
  }

  /* ---------- 16. Совиная библиотека ---------- */
  function artOwl() {
    return `
      ${shadow(150, 24, '#1c2a24')}
      <g fill="#0d3326" stroke="#04140d" stroke-width="3"><circle cx="-56" cy="-186" r="50"/><circle cx="14" cy="-218" r="58"/><circle cx="82" cy="-182" r="48"/><circle cx="-6" cy="-168" r="52"/></g>
      <g fill="#14503a" opacity=".6"><circle cx="-62" cy="-198" r="22"/><circle cx="20" cy="-232" r="24"/><circle cx="84" cy="-196" r="20"/></g>
      <path d="M-62 8 C-58 -40 -52 -100 -44 -150 L44 -150 C52 -100 58 -40 64 8 Z" fill="#3d2a1e" stroke="#0c0714" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M-34 -120 C-30 -80 -28 -40 -26 0 M10 -140 C12 -90 14 -40 18 4 M36 -120 C40 -70 46 -30 50 4" stroke="#241610" stroke-width="3" fill="none" opacity=".8"/>
      <path d="M-62 8 C-90 8 -104 2 -118 -2 M64 8 C92 8 108 2 124 -4" stroke="#3d2a1e" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M-24 6 V-42 Q-24 -66 0 -66 Q24 -66 24 -42 V6 Z" fill="#150a28" stroke="#08030f" stroke-width="3"/>
      <path d="M-18 6 V-42 Q-18 -60 0 -60 Q18 -60 18 -42 V6 Z" fill="#ffb347" opacity=".55" class="win"/><circle cx="11" cy="-26" r="2.8" fill="#ffd45a"/>
      <circle cx="-38" cy="-110" r="11" fill="#ffd45a" class="win"/><circle cx="-38" cy="-110" r="12.5" fill="none" stroke="#08030f" stroke-width="3"/>
      <circle cx="40" cy="-100" r="9" fill="#ffd45a" class="win" style="animation-delay:.8s"/><circle cx="40" cy="-100" r="10.5" fill="none" stroke="#08030f" stroke-width="3"/>
      <g stroke="#08030f" stroke-width="2.5"><rect x="-120" y="-20" width="46" height="12" rx="2" fill="#7a1d2e"/><rect x="-114" y="-32" width="40" height="12" rx="2" fill="#1d4a5a"/><rect x="-118" y="-44" width="36" height="12" rx="2" fill="#6a4a1d" transform="rotate(-4 -100 -38)"/>
        <rect x="76" y="-16" width="42" height="12" rx="2" fill="#4a2c6a"/><rect x="82" y="-28" width="36" height="12" rx="2" fill="#2c5a3a"/></g>
      <g class="ghost-float"><g transform="translate(24,-250)"><ellipse cx="0" cy="0" rx="21" ry="26" fill="#6a4a2a" stroke="#08030f" stroke-width="3"/><polygon points="-18,-18 -22,-34 -8,-24" fill="#6a4a2a" stroke="#08030f" stroke-width="2.5"/><polygon points="18,-18 22,-34 8,-24" fill="#6a4a2a" stroke="#08030f" stroke-width="2.5"/>
        <circle cx="-8" cy="-6" r="8" fill="#fff6c8" stroke="#08030f" stroke-width="2"/><circle cx="8" cy="-6" r="8" fill="#fff6c8" stroke="#08030f" stroke-width="2"/><circle cx="-8" cy="-6" r="3.4" fill="#08030f"/><circle cx="8" cy="-6" r="3.4" fill="#08030f"/>
        <path d="M0 0 l-4 7 h8z" fill="#ff9a1f" stroke="#08030f" stroke-width="1.6"/><path d="M-12 14 q12 8 24 0" stroke="#4a3420" stroke-width="3" fill="none"/></g></g>
      ${wisp(-110, -90, 3.4, '#ffe27a')}`;
  }

  /* ---------- Список локаций: два ряда вдоль тропы ---------- */
  const LOCS = [
    { id: 'swamp',   x: 150,  y: 528, s: 0.9,  top: -190, name: 'Болото призраков',     badge: '7',  art: artSwamp,  stage: 7,  hit: [-160, -170, 320, 205] },
    { id: 'bats',    x: 340,  y: 392, s: 0.84, top: -228, name: 'Пещера мышей',          badge: '8',  art: artBats,   stage: 8,  hit: [-150, -170, 300, 200] },
    { id: 'potion',  x: 530,  y: 532, s: 0.88, top: -176, name: 'Зельеварня',            badge: '9',  art: artPotion, stage: 9,  hit: [-130, -160, 260, 190] },
    { id: 'pumpkin', x: 720,  y: 400, s: 0.84, top: -196, name: 'Тыквенная грядка',      badge: '10', art: artPumpkin, stage: 10, hit: [-160, -170, 320, 200] },
    { id: 'spider',  x: 910,  y: 526, s: 0.9,  top: -210, name: 'Паучья роща',           badge: '11', art: artSpider, stage: 11, hit: [-150, -210, 300, 240] },
    { id: 'maze',    x: 1100, y: 396, s: 0.84, top: -126, name: 'Туманный лабиринт',     badge: '12', art: artMaze,   stage: 12, hit: [-160, -130, 320, 160] },
    { id: 'candle',  x: 1290, y: 534, s: 0.86, top: -250, name: 'Часовня свечей',        badge: '13', art: artCandle, stage: 13, hit: [-140, -250, 280, 280] },
    { id: 'grave',   x: 1480, y: 404, s: 0.84, top: -150, name: 'Гробовщик',             badge: '14', art: artGrave,  stage: 14, hit: [-170, -150, 340, 175] },
    { id: 'candy',   x: 1652, y: 530, s: 0.88, top: -180, name: 'Дом сладостей',         badge: '15', art: artCandy,  stage: 15, hit: [-140, -170, 280, 195] },
    { id: 'owl',     x: 1862, y: 410, s: 0.88, top: -266, name: 'Совиная библиотека',    badge: '16', art: artOwl,    stage: 16, hit: [-150, -285, 300, 315] }
  ].map(l => Object.assign(l, { region: 2 }));

  /* ---------- Фон леса ---------- */
  function pines(y, step, hMin, hMax, seed, fill) {
    let d = '', s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let x = -40; x < W + 60; x += step) {
      const h = hMin + rnd() * (hMax - hMin), w = h * 0.34, yy = y + rnd() * 10;
      d += `M${(x - w).toFixed(0)} ${yy.toFixed(0)}L${x} ${(yy - h * 0.55).toFixed(0)}L${(x + w).toFixed(0)} ${yy.toFixed(0)}Z`;
      d += `M${(x - w * 0.78).toFixed(0)} ${(yy - h * 0.34).toFixed(0)}L${x} ${(yy - h).toFixed(0)}L${(x + w * 0.78).toFixed(0)} ${(yy - h * 0.34).toFixed(0)}Z`;
    }
    return `<path d="${d}" fill="${fill}"/>`;
  }
  function trunkTree(x, h, w, lean) {
    return `<g stroke="#030a0c" stroke-linecap="round" fill="none"><path d="M${x} 640 C${x + lean} ${640 - h * 0.4} ${x - lean} ${640 - h * 0.7} ${x + lean * 0.4} ${640 - h}" stroke-width="${w}"/>
      <path d="M${x + lean * 0.3} ${640 - h * 0.62} C${x + 40} ${640 - h * 0.7} ${x + 56} ${640 - h * 0.8} ${x + 70} ${640 - h * 0.78}" stroke-width="${w * 0.35}"/>
      <path d="M${x - lean * 0.2} ${640 - h * 0.45} C${x - 40} ${640 - h * 0.55} ${x - 60} ${640 - h * 0.6} ${x - 74} ${640 - h * 0.66}" stroke-width="${w * 0.3}"/></g>`;
  }
  function stars() {
    let s = '', n = 41;
    for (let i = 0; i < 60; i++) { n = (n * 16807) % 2147483647; const a = n / 2147483647; n = (n * 16807) % 2147483647; const b = n / 2147483647;
      s += `<circle cx="${(a * W).toFixed(0)}" cy="${(b * 230).toFixed(0)}" r="${(0.7 + (i % 4) * 0.35).toFixed(1)}" fill="#e6fff0" opacity=".8"${i < 5 ? ` class="tw" style="animation-delay:${(i * 0.6).toFixed(1)}s"` : ''}/>`; }
    return s;
  }
  function back() {
    let fire = '';
    for (let i = 0; i < 16; i++) fire += `<circle cx="${(70 + i * 113) % W}" cy="${300 + (i * 53) % 260}" r="2.6" fill="#d8ff7a" opacity=".85"${i < 4 ? ` class="tw" style="animation-delay:${i * 0.7}s"` : ''}/>`;
    return `
      <rect x="-100" y="-200" width="${W + 200}" height="1000" fill="url(#fSky)"/>
      ${stars()}
      <circle cx="300" cy="104" r="64" fill="#cfffd8" opacity=".12"/><circle cx="300" cy="104" r="48" fill="url(#fMoon)"/>
      <circle cx="286" cy="92" r="8" fill="#a8d8b0" opacity=".5"/><circle cx="316" cy="118" r="11" fill="#a8d8b0" opacity=".45"/>
      <g transform="translate(900,110)" fill="#04100f"><path d="M0 0c-3-7-9-10-18-9 3 3 5 7 3 10-4-1-10-1-16 3 6 0 10 2 12 7 3-3 7-3 10 1 2-4 6-5 10-4z M0 0c3-7 9-10 18-9-3 3-5 7-3 10 4-1 10-1 16 3-6 0-10 2-12 7-3-3-7-3-10 1-2-4-6-5-10-4z"/></g>
      <g transform="translate(1420,70) scale(.8)" fill="#04100f"><path d="M0 0c-3-7-9-10-18-9 3 3 5 7 3 10-4-1-10-1-16 3 6 0 10 2 12 7 3-3 7-3 10 1 2-4 6-5 10-4z M0 0c3-7 9-10 18-9-3 3-5 7-3 10 4-1 10-1 16 3-6 0-10 2-12 7-3-3-7-3-10 1-2-4-6-5-10-4z"/></g>
      ${pines(300, 24, 70, 120, 11, '#061a1c')}
      ${pines(350, 30, 90, 150, 23, '#082428')}
      <ellipse cx="500" cy="330" rx="520" ry="22" fill="#9fffd0" opacity=".07"/><ellipse cx="1400" cy="346" rx="560" ry="20" fill="#9fffd0" opacity=".07"/>
      ${pines(430, 38, 110, 190, 37, '#0b2d2a')}
      <rect x="-100" y="418" width="${W + 200}" height="400" fill="url(#fGround)"/>
      <ellipse cx="300" cy="470" rx="420" ry="16" fill="#b6ffe0" opacity=".06"/><ellipse cx="1200" cy="486" rx="520" ry="16" fill="#b6ffe0" opacity=".06"/>
      ${fire}`;
  }
  function front() {
    return `
      ${trunkTree(-10, 330, 38, 16)}${trunkTree(W + 6, 360, 40, -18)}${trunkTree(760, 120, 14, 6)}${trunkTree(1340, 110, 13, -5)}
      <ellipse cx="400" cy="610" rx="360" ry="22" fill="#b6ffe0" opacity=".07"/><ellipse cx="1300" cy="604" rx="420" ry="20" fill="#b6ffe0" opacity=".07"/>
      <g fill="#ffd0f0" stroke="#08130d" stroke-width="1.5"><g transform="translate(60,590)"><rect x="-2" y="-10" width="4" height="10" fill="#e8e0f0"/><ellipse cx="0" cy="-12" rx="11" ry="7" fill="#d62839"/><circle cx="-4" cy="-13" r="1.8" fill="#fff"/><circle cx="4" cy="-11" r="1.6" fill="#fff"/></g>
        <g transform="translate(1260,596)"><rect x="-2" y="-8" width="4" height="8" fill="#e8e0f0"/><ellipse cx="0" cy="-10" rx="9" ry="6" fill="#9b5cff"/><circle cx="-3" cy="-11" r="1.5" fill="#fff"/></g>
        <g transform="translate(1810,588)"><rect x="-2" y="-9" width="4" height="9" fill="#e8e0f0"/><ellipse cx="0" cy="-11" rx="10" ry="6.5" fill="#ff9a1f"/><circle cx="3" cy="-12" r="1.6" fill="#fff"/></g></g>`;
  }
  const defs = `
    <linearGradient id="fSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030812"/><stop offset=".5" stop-color="#0a2630"/><stop offset="1" stop-color="#1c5a48"/></linearGradient>
    <radialGradient id="fMoon" cx=".35" cy=".35"><stop offset="0" stop-color="#f4fff0"/><stop offset=".6" stop-color="#cfeed0"/><stop offset="1" stop-color="#90c8a8"/></radialGradient>
    <linearGradient id="fGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2f26"/><stop offset=".5" stop-color="#0a1f1c"/><stop offset="1" stop-color="#050e10"/></linearGradient>`;

  G.mapKit.forest = { W, locs: LOCS, defs, back, front };
})();
