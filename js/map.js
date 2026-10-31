/* =========================================================
   Карта локаций (SVG) + задания + титульный экран
   ========================================================= */
(function () {
  'use strict';

  /* ---------- маленькие кирпичики для рисования ---------- */
  function pumpkin(x, y, s, face, flip) {
    s = s || 1;
    const f = face ? `
      <polygon points="-13,-22 -5,-22 -9,-30" fill="#3a1200"/><polygon points="13,-22 5,-22 9,-30" fill="#3a1200"/>
      <path d="M-14 -10 L-8 -14 L-3 -9 L2 -14 L8 -9 L14 -13 L12 -4 L6 -7 L1 -2 L-5 -7 L-11 -3 Z" fill="#3a1200"/>
      <polygon points="-13,-22 -5,-22 -9,-30" fill="#ffd45a" opacity=".55"/>` : '';
    return `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})">
      <ellipse cx="-11" cy="-15" rx="16" ry="19" fill="#ff8a1f" stroke="#7a2e00" stroke-width="2"/>
      <ellipse cx="11" cy="-15" rx="16" ry="19" fill="#ff8a1f" stroke="#7a2e00" stroke-width="2"/>
      <ellipse cx="0" cy="-15" rx="14" ry="20" fill="#ff9d38" stroke="#7a2e00" stroke-width="2"/>
      <path d="M-6 -33 Q-9 -15 -6 3 M6 -33 Q9 -15 6 3" stroke="#c45a00" stroke-width="2" fill="none" opacity=".8"/>
      <path d="M-3 -35 Q-1 -44 5 -45 L7 -41 Q2 -40 3 -35 Z" fill="#55861f" stroke="#2c4a0a" stroke-width="1.5"/>${f}</g>`;
  }
  function candyCorn(x, y, s, rot) {
    return `<g transform="translate(${x},${y}) rotate(${rot || 0}) scale(${s || 1})" stroke="#4a2200" stroke-width="3" stroke-linejoin="round">
      <polygon points="0,-90 12,-62 -12,-62" fill="#fff6e0"/>
      <polygon points="-12,-62 12,-62 24,-34 -24,-34" fill="#ff9a1f"/>
      <polygon points="-24,-34 24,-34 36,0 -36,0" fill="#ffd93a"/></g>`;
  }
  function lollipop(x, y, s, c1, c2) {
    return `<g transform="translate(${x},${y}) scale(${s || 1})">
      <rect x="-2.5" y="-62" width="5" height="62" fill="#f1e6d0" stroke="#5a3a20" stroke-width="1.5"/>
      <circle cx="0" cy="-72" r="20" fill="${c1}" stroke="#2a0d44" stroke-width="3"/>
      <path d="M0 -72 m0 0 a4 4 0 1 1 5 5 a9 9 0 1 1 -11 -9 a14 14 0 1 1 17 17" fill="none" stroke="${c2}" stroke-width="4" stroke-linecap="round"/></g>`;
  }
  function arch(x, y, w, h, fill) {
    return `<path d="M${x} ${y + h} V${y + w / 2} Q${x} ${y} ${x + w / 2} ${y} Q${x + w} ${y} ${x + w} ${y + w / 2} V${y + h} Z" fill="${fill}"/>`;
  }
  function win(x, y, w, h, d) {
    return `<g class="win" style="animation-delay:${d || 0}s">${arch(x, y, w, h, '#ffb347')}
      <path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h * 0.5} H${x + w}" stroke="#3a1a00" stroke-width="2"/>
      ${arch(x - 2, y - 2, w + 4, h + 2, 'none').replace('fill="none"', 'fill="none" stroke="#0a0418" stroke-width="3"')}</g>`;
  }
  function bat(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s || 1})" fill="#07030f"><path d="M0 0c-2-5-6-7-12-6 2 2 3 5 2 7-3-1-7-1-11 2 4 0 7 1 8 5 2-2 5-2 7 1 1-2 3-3 6-3z M0 0c2-5 6-7 12-6-2 2-3 5-2 7 3-1 7-1 11 2-4 0-7 1-8 5-2-2-5-2-7 1-1-2-3-3-6-3z"/><circle cx="0" cy="1" r="3"/></g>`;
  }

  /* ---------- Локации ---------- */
  /* Картинка-надгробие из js/art.js (рисуется кодом); низ картинки стоит на земле (y=0) */
  function tombImg(v, w, h, x, rot) {
    if (!G.art) return '';
    const u = G.art.tombUrl(v, Math.round(w), Math.round(h), 5, 2);
    return `<g transform="translate(${x},2)${rot ? ` rotate(${rot})` : ''}"><image href="${u}" x="${-w / 2}" y="${-(h * 0.89).toFixed(1)}" width="${w}" height="${h}"/></g>`;
  }
  function artCemetery() {
    let fence = '';
    for (let i = -6; i <= 6; i++) {
      const x = i * 21;
      fence += `<rect x="${x - 2.5}" y="-58" width="5" height="60" fill="#1d1236"/><polygon points="${x - 4.5},-58 ${x},-72 ${x + 4.5},-58" fill="#1d1236"/>`;
    }
    return `
      <ellipse cx="0" cy="4" rx="160" ry="22" fill="#0b0518"/>
      <ellipse cx="0" cy="2" rx="150" ry="18" fill="#17301f" opacity=".75"/>
      ${fence}
      <rect x="-130" y="-40" width="260" height="5" fill="#1d1236"/><rect x="-130" y="-16" width="260" height="5" fill="#1d1236"/>
      <g stroke="#150d2a" stroke-width="12" stroke-linecap="round" fill="none">
        <path d="M118 6 C118 -30 112 -60 122 -92" /></g>
      <g stroke="#150d2a" stroke-width="7" stroke-linecap="round" fill="none">
        <path d="M122 -92 C106 -112 86 -118 66 -136"/><path d="M122 -92 C138 -112 156 -116 168 -140"/></g>
      <g stroke="#150d2a" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M112 -58 C96 -68 84 -64 74 -80"/><path d="M92 -112 C88 -128 94 -134 90 -148"/><path d="M148 -108 C158 -112 166 -108 172 -116"/></g>
      ${tombImg(4, 80, 100, -92)}
      ${tombImg(3, 112, 132, -12)}
      ${tombImg(1, 72, 92, 66, 8)}
      ${pumpkin(-138, 4, 0.62, true)}
      <g class="ghost-float"><g transform="translate(-30,-118)"><path d="M-20 0 V-24 Q-20 -50 0 -50 Q20 -50 20 -24 V0 Q13 -8 7 0 Q0 -8 -7 0 Q-13 -8 -20 0Z" fill="#fff" opacity=".9"/>
        <ellipse cx="-7" cy="-28" rx="3.5" ry="5" fill="#1b0d33"/><ellipse cx="7" cy="-28" rx="3.5" ry="5" fill="#1b0d33"/><ellipse cx="0" cy="-17" rx="3" ry="4" fill="#1b0d33"/></g></g>
      ${bat(40, -130, 0.9)}${bat(150, -170, 0.7)}`;
  }

  function artMansion() {
    return `
      <ellipse cx="0" cy="6" rx="200" ry="26" fill="#0b0518"/>
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <rect x="-112" y="-132" width="224" height="134" fill="#21123c"/>
        <rect x="-154" y="-180" width="64" height="182" fill="#27154a"/>
        <polygon points="-162,-180 -122,-244 -82,-180" fill="#341a5e"/>
        <rect x="90" y="-160" width="64" height="162" fill="#27154a"/>
        <polygon points="82,-160 122,-222 162,-160" fill="#341a5e"/>
        <polygon points="-76,-132 0,-214 76,-132" fill="#2e1855"/>
        <rect x="52" y="-196" width="18" height="50" fill="#1a0e30"/>
        <rect x="-66" y="-176" width="3" height="46" fill="#08030f"/>
      </g>
      <polygon points="-122,-244 -122,-264 -108,-254" fill="#ff7a1a" stroke="#08030f" stroke-width="2"/>
      <rect x="-123" y="-266" width="2.5" height="24" fill="#08030f"/>
      <circle cx="0" cy="-158" r="17" fill="#ffb347" class="win"/><path d="M0 -175 V-141 M-17 -158 H17" stroke="#3a1a00" stroke-width="2.5"/>
      <circle cx="0" cy="-158" r="18.5" fill="none" stroke="#08030f" stroke-width="3"/>
      ${win(-140, -158, 26, 44, 0.3)}${win(-140, -90, 26, 40, 1.1)}${win(114, -140, 26, 44, 0.7)}${win(114, -80, 26, 36, 1.7)}
      ${win(-92, -108, 26, 42, 0.5)}${win(66, -108, 26, 42, 1.3)}
      <path d="M-24 0 V-44 Q-24 -70 0 -70 Q24 -70 24 -44 V0Z" fill="#0a0418" stroke="#08030f" stroke-width="3"/>
      <path d="M-18 0 V-42 Q-18 -62 0 -62 Q18 -62 18 -42 V0Z" fill="#ff8a1f" opacity=".5" class="win"/>
      <circle cx="9" cy="-28" r="2.6" fill="#ffd45a"/>
      <path d="M-34 0 H34 L40 8 H-40 Z" fill="#150a28" stroke="#08030f" stroke-width="2"/>
      <g class="smoke"><circle cx="61" cy="-210" r="7" fill="#7b6a99" opacity=".5"/><circle cx="67" cy="-228" r="10" fill="#7b6a99" opacity=".35"/><circle cx="76" cy="-250" r="13" fill="#7b6a99" opacity=".22"/></g>
      ${bat(-80, -270, 1)}${bat(100, -258, 0.8)}${bat(-190, -120, 0.7)}
      <path d="M-170 6 q4 -26 12 -34 M-162 6 q-2 -18 -6 -30 M182 6 q-4 -28 -12 -36" stroke="#07030f" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }

  function artPatch() {
    let grass = '';
    for (let i = 0; i < 16; i++) {
      const x = -150 + i * 20 + (i % 3) * 3;
      grass += `<path d="M${x} 6 q2 -14 -3 -22 M${x + 4} 6 q0 -10 6 -16" stroke="#3a6a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    }
    return `
      <ellipse cx="0" cy="6" rx="180" ry="26" fill="#0d0a1e"/>
      <ellipse cx="0" cy="4" rx="170" ry="20" fill="#1e3318" opacity=".85"/>
      ${grass}
      ${candyCorn(-110, 0, 1.05, -6)}${candyCorn(118, 2, 0.9, 7)}
      ${lollipop(-60, 4, 1, '#9be22b', '#2a0d44')}${lollipop(70, 2, 0.9, '#c04cff', '#fff')}
      ${pumpkin(-20, 4, 1.35, true)}${pumpkin(30, 6, 1, false)}${pumpkin(-76, 8, 0.75, false)}${pumpkin(108, 8, 0.7, true)}
      <g stroke="#f3eada" stroke-width="5" fill="none" stroke-linecap="round"><path d="M148 6 V-40 q0 -20 -16 -20 q-10 0 -12 10"/></g>
      <g stroke="#e8283c" stroke-width="5" fill="none" stroke-dasharray="7 9"><path d="M148 6 V-40 q0 -20 -16 -20 q-10 0 -12 10"/></g>
      <path d="M-170 -4 C-150 -30 -120 -18 -100 -4" stroke="#3a6a1a" stroke-width="3" fill="none"/>
      ${bat(0, -130, 0.9)}${bat(-80, -150, 0.7)}`;
  }

  function artShop() {
    return `
      <ellipse cx="0" cy="6" rx="120" ry="18" fill="#0b0518"/>
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <rect x="-60" y="-90" width="120" height="92" fill="#432866"/>
        <path d="M-60 -60 H60 M-60 -30 H60" stroke="#2c1648" stroke-width="3"/>
        <ellipse cx="0" cy="-90" rx="106" ry="15" fill="#241040"/>
        <path d="M-58 -92 C-42 -124 -22 -152 -4 -180 C4 -196 28 -194 38 -180 C24 -178 22 -164 28 -142 C34 -122 46 -106 60 -92 Z" fill="#2c1550"/>
        <path d="M-52 -106 C-30 -98 30 -98 52 -106 L58 -92 C30 -84 -30 -84 -58 -92 Z" fill="#ff7a1a"/>
        <rect x="-8" y="-106" width="16" height="16" rx="3" fill="#ffd45a"/>
      </g>
      <path d="M-22 2 V-40 Q-22 -62 0 -62 Q22 -62 22 -40 V2 Z" fill="#150a28" stroke="#08030f" stroke-width="3"/>
      <path d="M-16 2 V-38 Q-16 -56 0 -56 Q16 -56 16 -38 V2 Z" fill="#ff8a1f" opacity=".55" class="win"/>
      <circle cx="-42" cy="-48" r="9" fill="#b6ff4a" class="win" style="animation-delay:.6s"/><circle cx="-42" cy="-48" r="10.5" fill="none" stroke="#08030f" stroke-width="3"/>
      <circle cx="42" cy="-48" r="9" fill="#ffb347" class="win" style="animation-delay:1.2s"/><circle cx="42" cy="-48" r="10.5" fill="none" stroke="#08030f" stroke-width="3"/>
      <g transform="translate(-92,2)"><path d="M-22 -26 Q-26 -2 -12 0 H12 Q26 -2 22 -26 Z" fill="#1b1b24" stroke="#08030f" stroke-width="3"/>
        <ellipse cx="0" cy="-26" rx="22" ry="6" fill="#7ee022" stroke="#08030f" stroke-width="2.5"/>
        <g class="bubble"><circle cx="-8" cy="-34" r="4" fill="#b6ff4a"/><circle cx="6" cy="-40" r="3" fill="#b6ff4a"/><circle cx="0" cy="-48" r="2.5" fill="#d4ff8a"/></g></g>
      <g transform="translate(86,0)"><path d="M0 0 V-96 H34" stroke="#2a1a10" stroke-width="5" fill="none"/>
        <path d="M14 -96 V-84 M30 -96 V-84" stroke="#2a1a10" stroke-width="2"/>
        <g class="sign"><rect x="6" y="-84" width="34" height="22" rx="4" fill="#5a3a1a" stroke="#2a1a10" stroke-width="2"/><text x="23" y="-69" text-anchor="middle" font-size="12" font-weight="900" fill="#ffd45a">🧪</text></g></g>
      ${bat(-60, -200, 0.8)}`;
  }

  function artHome() {
    let lights = '';
    const cols = ['#ff5a5a', '#ffd45a', '#8aff6a', '#6ab8ff', '#ff8aff'];
    for (let i = 0; i < 9; i++) lights += `<circle class="bulb" style="animation-delay:${i * 0.2}s" cx="${-70 + i * 17.5}" cy="${-98 + Math.abs(Math.sin(i * 0.9)) * 6}" r="3.6" fill="${cols[i % 5]}"/>`;
    return `
      <ellipse cx="0" cy="6" rx="116" ry="18" fill="#0b0518"/>
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <rect x="-70" y="-90" width="140" height="92" fill="#5a3384"/>
        <polygon points="-86,-88 0,-160 86,-88" fill="#2c1550"/>
        <rect x="38" y="-148" width="18" height="40" fill="#241040"/>
        <path d="M-86 -88 L0 -160 L86 -88" fill="none" stroke="#ff7a1a" stroke-width="4"/>
      </g>
      ${lights}
      ${win(-56, -74, 30, 36, 0.4)}${win(26, -74, 30, 36, 1.2)}
      <path d="M-17 2 V-34 Q-17 -52 0 -52 Q17 -52 17 -34 V2 Z" fill="#ff8a1f" stroke="#08030f" stroke-width="3"/>
      <circle cx="9" cy="-20" r="2.5" fill="#ffd45a"/>
      <rect x="-26" y="2" width="52" height="7" rx="2" fill="#2a1648" stroke="#08030f" stroke-width="2"/>
      ${pumpkin(-50, 6, 0.6, true)}${pumpkin(52, 6, 0.5, false)}
      <g class="smoke"><circle cx="47" cy="-158" r="6" fill="#7b6a99" opacity=".5"/><circle cx="53" cy="-174" r="9" fill="#7b6a99" opacity=".3"/></g>
      <circle cx="0" cy="-108" r="9" fill="#ffd45a" class="win"/><path d="M0 -117 V-99 M-9 -108 H9" stroke="#3a1a00" stroke-width="2"/>`;
  }

  /* --- Хранитель правил: каменная арка, призрак-хранитель и летающие карточки-законы --- */
  function ruleCard(x, y, rot, glyph, d) {
    return `<g class="ghost-float" style="animation-delay:${d}s"><g transform="translate(${x},${y}) rotate(${rot})">
      <rect x="-15" y="-21" width="30" height="42" rx="5" fill="#f3e3b8" stroke="#08030f" stroke-width="2.5"/>
      <rect x="-11" y="-17" width="22" height="34" rx="3" fill="none" stroke="#b08a3a" stroke-width="1.5"/>
      <text x="0" y="7" text-anchor="middle" font-size="20" font-weight="900" fill="#3a1a00">${glyph}</text></g></g>`;
  }
  function artRules() {
    return `
      <ellipse cx="0" cy="6" rx="130" ry="20" fill="#0b0518"/>
      <ellipse cx="0" cy="3" rx="118" ry="13" fill="#17301f" opacity=".7"/>
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <rect x="-92" y="-122" width="32" height="124" fill="#3d3460"/>
        <rect x="60" y="-122" width="32" height="124" fill="#3d3460"/>
        <path d="M-106 -118 Q0 -222 106 -118 L106 -96 Q0 -190 -106 -96 Z" fill="#51467a"/>
        <path d="M-14 -176 H14 V-156 H-14 Z" fill="#6a5c9c"/>
      </g>
      <path d="M-60 2 V-92 Q0 -156 60 -92 V2 Z" fill="#150a28"/>
      <path d="M-52 2 V-88 Q0 -142 52 -88 V2 Z" fill="#8a4bff" opacity=".4" class="win"/>
      <g stroke="#9b7ccf" stroke-width="2" fill="none" opacity=".75"><path d="M-82 -94 h10 M-82 -74 h10 M-82 -54 h10 M72 -94 h10 M72 -74 h10 M72 -54 h10"/></g>
      <g class="ghost-float"><g transform="translate(0,-18)">
        <path d="M-24 0 V-34 Q-24 -70 0 -70 Q24 -70 24 -34 V0 Q16 -10 8 0 Q0 -10 -8 0 Q-16 -10 -24 0Z" fill="#efe9ff" opacity=".96"/>
        <path d="M-25 -36 Q0 -86 25 -36 Q0 -54 -25 -36Z" fill="#5b3fb5" stroke="#08030f" stroke-width="2"/>
        <ellipse cx="-8" cy="-38" rx="3.6" ry="5" fill="#1b0d33"/><ellipse cx="8" cy="-38" rx="3.6" ry="5" fill="#1b0d33"/></g></g>
      ${ruleCard(-122, -150, -14, '👻', 0)}${ruleCard(124, -158, 12, '🚪', 1.1)}${ruleCard(0, -244, 0, '=', 0.5)}
      ${bat(-62, -262, 0.8)}${bat(112, -236, 0.7)}`;
  }

  /* --- Старый склеп: каменный мавзолей с железной дверью и свечами --- */
  function artCrypt() {
    return `
      <ellipse cx="0" cy="6" rx="150" ry="22" fill="#0b0518"/>
      <ellipse cx="0" cy="3" rx="135" ry="15" fill="#17301f" opacity=".7"/>
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <rect x="-96" y="-110" width="192" height="112" fill="#6f6a8c"/>
        <polygon points="-114,-108 0,-188 114,-108" fill="#8a85a8"/>
        <polygon points="-86,-116 0,-170 86,-116" fill="#5a5578"/>
        <rect x="-104" y="-120" width="208" height="14" fill="#8a85a8"/>
        <rect x="-84" y="-104" width="16" height="106" fill="#9d98bb"/>
        <rect x="68" y="-104" width="16" height="106" fill="#9d98bb"/>
        <path d="M-40 2 V-62 Q-40 -88 0 -88 Q40 -88 40 -62 V2Z" fill="#150a28"/>
        <path d="M-50 8 H50 L56 14 H-56 Z" fill="#4a4666"/>
      </g>
      <path d="M-30 2 V-58 Q-30 -76 0 -76 Q30 -76 30 -58 V2Z" fill="#ff8a1f" opacity=".35" class="win"/>
      <g stroke="#2a2440" stroke-width="3"><path d="M-20 -72 V0 M0 -76 V0 M20 -72 V0 M-30 -40 H30"/></g>
      <text x="0" y="-132" text-anchor="middle" font-size="30">💀</text>
      <g transform="translate(-72,2)"><rect x="-5" y="-22" width="10" height="22" fill="#f3e3b8" stroke="#08030f" stroke-width="2"/><path class="flame" d="M0 -24 Q-6 -34 0 -42 Q6 -34 0 -24Z" fill="#ffb347"/></g>
      <g transform="translate(72,2)"><rect x="-5" y="-18" width="10" height="18" fill="#f3e3b8" stroke="#08030f" stroke-width="2"/><path class="flame" d="M0 -20 Q-6 -30 0 -38 Q6 -30 0 -20Z" fill="#ffb347"/></g>
      ${tombImg(0, 58, 74, -136)}
      ${tombImg(2, 54, 70, 142, -8)}
      <path d="M-114 -108 q10 22 24 26 M114 -108 q-10 22 -24 26" stroke="#e8e0f5" stroke-width="2" fill="none" opacity=".6"/>
      ${bat(-70, -214, 0.8)}${bat(100, -200, 0.9)}`;
  }

  /* --- Башня ведьмы: кривая башня из каменных блоков и шляпа-крыша --- */
  function artTower() {
    const rows = [
      { y: -40, w: 124, dx: 0, c: '#4b2c78' }, { y: -80, w: 116, dx: 6, c: '#5a3384' }, { y: -120, w: 106, dx: -5, c: '#4b2c78' },
      { y: -160, w: 98, dx: 8, c: '#5a3384' }, { y: -200, w: 88, dx: -4, c: '#4b2c78' }, { y: -240, w: 80, dx: 5, c: '#5a3384' }
    ];
    let blocks = '', wins = '';
    rows.forEach((r, i) => {
      blocks += `<rect x="${-r.w / 2 + r.dx}" y="${r.y}" width="${r.w}" height="42" fill="${r.c}" stroke="#08030f" stroke-width="3" stroke-linejoin="round"/>
        <path d="M${-r.w / 2 + r.dx + 8} ${r.y + 21} H${r.w / 2 + r.dx - 8}" stroke="#2c1648" stroke-width="2"/>`;
      if (i % 2 === 0) wins += win(r.dx - 9, r.y + 8, 18, 26, i * 0.4);
    });
    return `
      <ellipse cx="0" cy="6" rx="110" ry="18" fill="#0b0518"/>
      ${blocks}${wins}
      <path d="M-18 2 V-24 Q-18 -38 0 -38 Q18 -38 18 -24 V2Z" fill="#150a28" stroke="#08030f" stroke-width="3"/>
      <path d="M-12 2 V-22 Q-12 -32 0 -32 Q12 -32 12 -22 V2Z" fill="#ff8a1f" opacity=".5" class="win"/>
      <g stroke="#08030f" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="5" cy="-244" rx="62" ry="10" fill="#241040"/>
        <path d="M-34 -246 C-26 -290 -10 -318 6 -342 C14 -352 30 -346 36 -330 C24 -330 20 -312 24 -290 C28 -272 34 -258 44 -246 Z" fill="#2c1550"/>
        <path d="M-30 -258 C-14 -252 24 -252 40 -258 L44 -246 C20 -240 -20 -240 -34 -246 Z" fill="#ff7a1a"/>
        <rect x="-5" y="-260" width="14" height="14" rx="3" fill="#ffd45a"/>
      </g>
      <path d="M30 -330 L44 -338 L40 -324 Z" fill="#2c1550"/>
      <g class="ghost-float"><circle cx="-92" cy="-190" r="3" fill="#ffe27a"/><circle cx="92" cy="-120" r="2.5" fill="#ffe27a"/></g>
      ${bat(-84, -280, 0.9)}${bat(96, -250, 0.8)}${bat(70, -330, 0.6)}`;
  }

  /* ---------- Локации ---------- */
  const MAP_W = 1660;
  const LOCS = [
    { id: 'cem',  x: 158,  y: 432, s: 1,    top: -190, name: 'Кладбище',          badge: '1', art: artCemetery, stage: 1, hit: [-170, -150, 340, 215] },
    { id: 'man',  x: 480,  y: 352, s: 1,    top: -288, name: 'Комната призраков', badge: '2', art: artMansion,  stage: 2, hit: [-170, -270, 340, 330] },
    { id: 'pat',  x: 820,  y: 432, s: 0.85, top: -150, name: 'Конфетное поле',    badge: '3', art: artPatch,    stage: 3, hit: [-150, -125, 300, 185] },
    { id: 'rk',   x: 1110, y: 384, s: 0.95, top: -262, name: 'Хранитель правил',  badge: '4', art: artRules,    stage: 4, hit: [-130, -250, 260, 280] },
    { id: 'cry',  x: 1300, y: 552, s: 0.9,  top: -190, name: 'Старый склеп',      badge: '5', art: artCrypt,    stage: 5, hit: [-130, -180, 260, 215] },
    { id: 'tow',  x: 1510, y: 404, s: 0.9,  top: -350, name: 'Башня ведьмы',      badge: '6', art: artTower,    stage: 6, hit: [-75, -340, 150, 380] },
    { id: 'shop', x: 310,  y: 548, s: 0.9,  top: -185, name: 'Лавка ведьмы',      badge: '🛒', art: artShop,    stage: 0, hit: [-110, -180, 220, 235] },
    { id: 'home', x: 600,  y: 550, s: 0.95, top: -170, name: 'Мой дом',           badge: '🏠', art: artHome,    stage: 0, hit: [-90, -165, 180, 220] }
  ];
  /* Вторая карта, «Тёмный лес» (js/forest-map.js): локации только у тех игр, что подключены */
  const forestLocs = () => (G.mapKit && G.mapKit.forest ? G.mapKit.forest.locs.filter(l => G.mg && G.mg.games[l.id]) : []);
  const byId = id => LOCS.find(l => l.id === id) || forestLocs().find(l => l.id === id);
  const regionOf = id => { const l = byId(id); return l && l.region === 2 ? 2 : 1; };
  const forestOpen = () => forestLocs().length > 0 && (!!G.state.freeMode || G.state.stage >= G.FOREST_FIRST);
  let region = 1;
  function pickRegion() {
    const pend = G.state.pendingUnlock;
    if (pend && byId(pend) && !G.state.freeMode) {
      // показываем карту, где открывается новая локация, и запоминаем её: вернёмся из игры на ту же карту
      const r0 = regionOf(pend);
      if (G.state.mapRegion !== r0) { G.state.mapRegion = r0; G.save(); }
      return r0;
    }
    let r = G.state.mapRegion;
    if (r === 2 && !forestOpen()) r = 0;
    if (!r) r = forestOpen() && G.state.stage >= G.FOREST_FIRST ? 2 : 1;
    return r;
  }

  function plate(l) {
    const w = Math.max(104, l.name.length * 10.6 + 62);
    return `<g class="plate" transform="translate(0,16)">
      <rect x="${-w / 2}" y="0" width="${w}" height="36" rx="12" fill="#1c0b33" stroke="#ff8a1f" stroke-width="2.5"/>
      <circle cx="${-w / 2 + 19}" cy="18" r="13" fill="#ff7a1a" stroke="#4a1700" stroke-width="2"/>
      <text x="${-w / 2 + 19}" y="${l.badge.length > 1 ? 23 : 24}" text-anchor="middle" font-size="${l.badge.length > 1 ? 14 : 17}" font-weight="900" fill="#2b0d00">${l.badge}</text>
      <text x="19" y="25" text-anchor="middle" font-size="19" fill="#ffe2b0" font-family="var(--font-title)" letter-spacing=".5">${l.name}</text></g>`;
  }

  /* open: всегда открыто (лавка, дом); locked: замок; current: сейчас проходим; done: пройдено.
     Локация, замок которой сейчас снимается, рисуется закрытой, а потом анимация открывает её. */
  function state(l) {
    const s = G.state.stage, free = !!G.state.freeMode;
    if (!l.stage) return 'open';
    if (!free && G.state.pendingUnlock === l.id) return 'locked';
    if (s > l.stage || (G.state.cleared && G.state.cleared[l.stage])) return 'done';
    if (s === l.stage) return 'current';
    return free ? 'open' : 'locked';
  }

  /* холмы: волна нужной ширины от -600 до 2260 */
  function hill(y, amp, wl, ph, fill) {
    let d = `M-600 ${y}`, x = -600, i = 0;
    while (x < 2260) {
      const a = amp * (0.55 + 0.45 * Math.sin(i * 1.7 + ph));
      d += ` Q${x + wl / 2} ${y - a * (i % 2 ? -0.6 : 1)} ${x + wl} ${y}`;
      x += wl; i++;
    }
    return `<path d="${d} V800 H-600Z" fill="${fill}"/>`;
  }
  /* дорога между двумя точками (от основания одной локации до другой) */
  function road(a, b, w, col, dash) {
    const x1 = a.x, y1 = a.y + 18, x2 = b.x, y2 = b.y + 18, mx = (x1 + x2) / 2;
    const d = `M${x1} ${y1} C${mx} ${y1 + 36}, ${mx} ${y2 + 36}, ${x2} ${y2}`;
    return dash
      ? `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-dasharray="${dash}" stroke-linecap="round" fill="none"/>`
      : `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none" opacity=".9"/>`;
  }

  /* Рисует список локаций: стрелка/замок/галочка и невидимая зона нажатия.
     Таблички с названиями рисуются отдельным слоем сверху, чтобы соседние локации их не закрывали. */
  function renderLocs(list) {
    const locs = list.map(l => {
      const st = state(l);
      let mark = '';
      if (st === 'locked') mark = `<circle cx="0" cy="${l.top + 22}" r="27" fill="rgba(8,3,16,.6)"/><text x="0" y="${l.top + 36}" text-anchor="middle" font-size="44" class="lockmark">🔒</text>`;
      if (st === 'done') mark = `<g transform="translate(0,${l.top + 20})"><circle r="17" fill="#6bc100" stroke="#1f4000" stroke-width="3"/><path d="M-8 0 l6 7 l11 -14" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      if (st === 'current') mark = arrowMark(l);
      const gx = (l.hit[0] + l.hit[2] / 2), gy = (l.hit[1] + l.hit[3] / 2);
      return `<g transform="translate(${l.x},${l.y})"><g class="loc ${st}" data-id="${l.id}" tabindex="0" role="button" aria-label="${l.name}">
        <ellipse class="glowbase" cx="${gx}" cy="${gy}" rx="${l.hit[2] * 0.72}" ry="${l.hit[3] * 0.62}" fill="url(#mGlow)"/>
        <g class="art" transform="scale(${l.s})">${l.art()}</g>
        <g class="mark">${mark}</g>
        <rect class="hit" x="${l.hit[0]}" y="${l.hit[1]}" width="${l.hit[2]}" height="${l.hit[3]}" fill="transparent"/>
      </g></g>`;
    }).join('');
    const plates = list.map(l => `<g class="plate-wrap ${state(l)}" data-for="${l.id}" transform="translate(${l.x},${l.y})" pointer-events="none">${plate(l)}</g>`).join('');
    return locs + `<g class="plates">${plates}</g>`;
  }

  /* «Тёмный лес»: ночной лес, две «полосы» локаций вдоль извилистой тропы */
  function forestSVG() {
    const F = G.mapKit.forest;
    const list = forestLocs();
    const chain = G.CHAIN.filter(c => c.region === 2).map(c => byId(c.id)).filter(Boolean);
    let roads = '', dots = '';
    chain.forEach((l, i) => { if (i) { roads += road(chain[i - 1], l, 26, '#10261f'); dots += road(chain[i - 1], l, 3, '#b6ff9a', '1 12'); } });
    const ordered = list.slice().sort((a, b) => a.y - b.y);
    return `<svg id="map-svg" viewBox="0 0 ${F.W} 620" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mGlow"><stop offset="0" stop-color="#9dff6a" stop-opacity=".42"/><stop offset=".6" stop-color="#6adf60" stop-opacity=".16"/><stop offset="1" stop-color="#6adf60" stop-opacity="0"/></radialGradient>
        ${F.defs}
      </defs>
      ${F.back()}
      ${F.front()}
      <g fill="none" stroke-linecap="round">${roads}${dots}</g>
      ${renderLocs(ordered)}
    </svg>`;
  }

  function sceneSVG() {
    if (region === 2) return forestSVG();
    let stars = '';
    for (let i = 0; i < 70; i++) {
      // мерцают только 6 звёзд: каждая анимация в SVG заставляет перерисовывать карту на каждом кадре
      stars += `<circle cx="${-300 + Math.random() * 2200}" cy="${Math.random() * 260}" r="${0.6 + Math.random() * 1.4}" fill="#fff"${i < 6 ? ` class="tw" style="animation-delay:${(Math.random() * 3).toFixed(2)}s"` : ' opacity=".8"'}/>`;
    }
    const chain = G.CHAIN.filter(c => !c.region).map(c => byId(c.id));
    let roads = '', dots = '';
    chain.forEach((l, i) => { if (i) { roads += road(chain[i - 1], l, 30, '#2c1a44'); dots += road(chain[i - 1], l, 3, '#ffb347', '1 12'); } });
    roads += road(byId('man'), byId('shop'), 24, '#2c1a44') + road(byId('man'), byId('home'), 24, '#2c1a44');
    dots += road(byId('man'), byId('shop'), 2.5, '#9b7ccf', '1 11') + road(byId('man'), byId('home'), 2.5, '#9b7ccf', '1 11');

    const locs = renderLocs(LOCS);

    return `<svg id="map-svg" viewBox="0 0 ${MAP_W} 620" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07020f"/><stop offset=".55" stop-color="#1d0a3a"/><stop offset="1" stop-color="#5a1f4a"/></linearGradient>
        <radialGradient id="mGlow"><stop offset="0" stop-color="#ff9626" stop-opacity=".5"/><stop offset=".6" stop-color="#ff7a1a" stop-opacity=".2"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
        <radialGradient id="mMoon" cx=".35" cy=".35"><stop offset="0" stop-color="#fff6d6"/><stop offset=".6" stop-color="#ffd57a"/><stop offset="1" stop-color="#e3a040"/></radialGradient>
        <linearGradient id="mHill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1250"/><stop offset="1" stop-color="#150726"/></linearGradient>
        <linearGradient id="mGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0c30"/><stop offset="1" stop-color="#0a0414"/></linearGradient>
      </defs>
      <rect x="-600" y="-200" width="2900" height="1000" fill="url(#mSky)"/>
      ${stars}
      <circle cx="1250" cy="105" r="66" fill="#ffb347" opacity=".18"/><circle cx="1250" cy="105" r="52" fill="url(#mMoon)"/>
      <circle cx="1234" cy="92" r="9" fill="#e3a040" opacity=".55"/><circle cx="1266" cy="120" r="12" fill="#e3a040" opacity=".5"/><circle cx="1258" cy="82" r="5" fill="#e3a040" opacity=".5"/>
      <g class="cloud"><ellipse cx="260" cy="120" rx="130" ry="14" fill="#2a1052" opacity=".7"/><ellipse cx="330" cy="108" rx="80" ry="12" fill="#2a1052" opacity=".7"/></g>
      <g class="cloud c2"><ellipse cx="720" cy="190" rx="120" ry="12" fill="#2a1052" opacity=".6"/></g>
      <g class="cloud"><ellipse cx="1000" cy="90" rx="120" ry="12" fill="#2a1052" opacity=".6"/></g>
      <g transform="translate(790,92)" fill="#07030f"><path d="M0 0c-3-7-9-10-18-9 3 3 5 7 3 10-4-1-10-1-16 3 6 0 10 2 12 7 3-3 7-3 10 1 2-4 6-5 10-4z M0 0c3-7 9-10 18-9-3 3-5 7-3 10 4-1 10-1 16 3-6 0-10 2-12 7-3-3-7-3-10 1-2-4-6-5-10-4z"/></g>
      ${hill(300, 56, 340, 0.4, 'url(#mHill1)')}
      ${hill(380, 40, 300, 1.9, '#1a0b2f')}
      ${hill(470, 26, 340, 3.1, 'url(#mGround)')}
      <g fill="none" stroke-linecap="round">${roads}${dots}</g>
      ${locs}
    </svg>`;
  }

  function arrowMark(l) {
    return `<g transform="translate(0,${l.top})"><g class="arrow"><path d="M-16 -8 H16 L0 16 Z" fill="#ffb347" stroke="#4a1700" stroke-width="3" stroke-linejoin="round"/></g></g>`;
  }

  /* ---------- Текст заданий ---------- */
  const rkStory = () => (G.rkEngine ? G.rkEngine.STORY_END : 8);
  const rkTotal = () => (G.rkEngine ? G.rkEngine.LEVELS.length : 12);
  const lv = (n, max) => `<span class="q-prog">${Math.max(0, Math.min(max, n - 1))}/${max}</span>`;
  const mgLv = id => { const g = G.mg.games[id], P = G.mg.progress(id); const n = Object.keys(P.stars).filter(k => P.stars[k] > 0).length; return `<span class="q-prog">${n}/${g.levels.length}</span>`; };
  const keyProg = () => { const p = G.hid && G.hid.progress ? G.hid.progress() : { found: 0, total: 3 }; return `<span class="q-prog">${p.found}/${p.total}</span>`; };
  function questText() {
    const s = G.state;
    switch (s.stage) {
      case 1: return `<b>Задание 1.</b> Пройди 10 уровней Block Blast на Кладбище ${lv(s.bbUnlocked, 10)}`;
      case 2: return `<b>Задание 2.</b> Найди Золотой ключ с черепом в трёх комнатах: призраков, библиотеке и подвале 🗝️ ${keyProg()}`;
      case 3: return `<b>Задание 3.</b> Собери конфеты и candy corn на Конфетном поле (комбинации 3, 4, 5 в ряд!) 🍬`;
      case 4: return `<b>Задание 4.</b> Проведи призрака к двери у Хранителя правил: законы-карточки можно двигать! 📜 ${lv(s.rkUnlocked, rkStory())}`;
      case 5: return `<b>Задание 5.</b> Пройди 10 уровней Block Blast в Старом склепе: фигуры там хитрее ⚰️ ${lv(s.bb2Unlocked, 10)}`;
      case 6: return `<b>Задание 6.</b> Построй башню ведьмы: роняй блоки точно один на другой 🏰 ${lv(s.twUnlocked, 6)}`;
      default: {
        const c = G.CHAIN[s.stage - 1];
        const g = c && c.region === 2 && G.mg && G.mg.games[c.id];
        if (g) return `<b>Задание ${s.stage}.</b> ${g.quest || g.intro} ${mgLv(g.id)}`;
        if (s.stage > G.CHAIN.length && forestLocs().length) return `<b>Тёмный лес покорён!</b> Зарабатывай жетоны на любимых локациях и обставляй дом 🏚️`;
        return `<b>Все испытания пройдены!</b> Зарабатывай жетоны на любимых локациях и обставляй дом 🏚️`;
      }
    }
  }

  const BRIEF = {
    cem: () => ({
      title: 'Кладбище', body: `<p class="big">🪦🎃</p>
        <p>Расставляй блоки на поле <b>8×8</b> и собирай полные линии. Набери нужное число очков, чтобы пройти уровень.</p>
        <p>Нужно пройти <span class="hl">10 уровней</span>. Пройдено: <span class="hl">${Math.min(10, G.state.bbUnlocked - 1)}/10</span></p>`,
      btn: 'Играть', go: 'bb'
    }),
    man: () => {
      const p = G.hid && G.hid.progress ? G.hid.progress() : { found: 0, total: 3 };
      return {
        title: 'Комната призраков', body: `<p class="big">🏚️📚⚗️🗝️</p>
        <p>В трёх комнатах (Комната призраков, Старая библиотека и Подвал алхимика) спрятан <span class="hl">Золотой ключ с черепом</span>. Каждый раз он лежит в новом месте. Остерегайся похожих ключей: они не те!</p>
        <p>Следующая комната открывается, когда в предыдущей найден ключ. Найдено: <span class="hl">${p.found}/${p.total}</span></p>
        <p>Включи «фонарь» в комнате, чтобы получить двойную награду.</p>`,
        btn: 'Искать', go: 'hid'
      };
    },
    pat: () => ({
      title: 'Конфетное поле', body: `<p class="big">🍬🌽🎃</p>
        <p>Меняй соседние конфеты местами и собирай <span class="hl">3, 4, 5 в ряд</span> или фигуры Г и Т. Из больших комбинаций получаются волшебные конфеты!</p>
        <p>Собери нужное количество конфет за ограниченное число ходов.</p>`,
      btn: 'Собирать', go: 'm3'
    }),
    rk: () => ({
      title: 'Хранитель правил', body: `<p class="big">👻📜🚪</p>
        <p>Проведи призрака к двери. Но в этом мире всё решают <span class="hl">законы</span>, написанные на карточках: «ПРИЗРАК ЭТО ТЫ», «ОГОНЬ ЭТО ОПАСНО»…</p>
        <p>Карточки можно <b>толкать</b>. Сломай закон, который мешает, или составь новый, который поможет. Пройдено: <span class="hl">${Math.min(rkStory(), G.state.rkUnlocked - 1)}/${rkStory()}</span>${G.state.rkUnlocked > rkStory() ? ` · тайные уровни: <span class="hl">${Math.min(rkTotal() - rkStory(), G.state.rkUnlocked - 1 - rkStory())}/${rkTotal() - rkStory()}</span>` : ''}</p>`,
      btn: 'Играть', go: 'rk'
    }),
    cry: () => ({
      title: 'Старый склеп', body: `<p class="big">⚰️🕯️</p>
        <p>Снова Block Blast, но потруднее: больше «надгробий», а ещё появились <span class="hl">диагональные фигуры</span>.</p>
        <p>Нужно пройти <span class="hl">10 уровней</span>. Пройдено: <span class="hl">${Math.min(10, G.state.bb2Unlocked - 1)}/10</span></p>`,
      btn: 'Играть', go: 'bb2'
    }),
    tow: () => ({
      title: 'Башня ведьмы', body: `<p class="big">🏰🧙‍♀️</p>
        <p>Блок ездит туда-сюда над башней. Нажми, когда он окажется <span class="hl">точно над нижним</span>: всё, что свесится, отвалится, а башня станет уже.</p>
        <p>Идеальное попадание не отрезает ничего. Пройдено уровней: <span class="hl">${Math.min(6, G.state.twUnlocked - 1)}/6</span></p>`,
      btn: 'Строить', go: 'tw'
    })
  };

  /* Окно-описание для игр «Тёмного леса» собирается из их описания */
  function forestBrief(id) {
    const g = G.mg.games[id], P = G.mg.progress(id);
    const n = Object.keys(P.stars).filter(k => P.stars[k] > 0).length;
    return {
      title: g.title, body: `<p class="big">${g.icon}</p><p>${g.intro}</p><p>Пройдено уровней: <span class="hl">${n}/${g.levels.length}</span></p>`,
      btn: g.btn || 'Играть', go: 'mg-' + id
    };
  }

  /* ---------- Анимация снятия замка ---------- */
  async function playUnlock(sc, id) {
    const g = G.$(`.loc[data-id="${id}"]`, sc), l = byId(id);
    if (!g || !l) return;
    G.state.pendingUnlock = null;
    G.save();
    g.classList.add('unlocking');
    const mark = G.$('.lockmark', g);
    await G.sleep(900);
    if (G.current !== 'map') return;
    G.sfx('spooky');
    if (mark) mark.classList.add('unlock-shake');
    await G.sleep(650);
    if (G.current !== 'map') return;
    if (mark) { mark.textContent = '🔓'; mark.classList.remove('unlock-shake'); mark.classList.add('unlock-pop'); }
    g.classList.remove('locked');
    g.classList.add('current');
    const pw = G.$(`.plate-wrap[data-for="${id}"]`, sc);
    if (pw) pw.classList.remove('locked');
    G.sfx('found');
    const r = g.getBoundingClientRect();
    G.burst(r.left + r.width / 2, r.top + r.height * 0.35, ['🔓', '✨', '⭐', '🎃', '🦇'], 22, 170);
    G.toast('🔓 Открыта локация: ' + l.name, 3200);
    await G.sleep(900);
    const holder = G.$('.mark', g);
    if (holder) holder.innerHTML = arrowMark(l);
    g.classList.remove('unlocking');
  }

  /* Рисует карту. keep: оставить положение прокрутки (при переключении режима) */
  function paint(sc, keep) {
    const pending = G.state.pendingUnlock, free = !!G.state.freeMode;
    const hasForest = forestLocs().length > 0;
    const mapW = region === 2 ? G.mapKit.forest.W : MAP_W;
    const oldScroll = keep ? (G.$('.map-scroll', sc) || {}).scrollLeft || 0 : 0;
    sc.innerHTML = `<div class="map-scroll${region === 2 ? ' forest' : ''}">${sceneSVG()}</div><div class="map-hint">↔ листай карту</div>
      ${hasForest ? `<button class="btn btn-small map-region ${region === 2 ? 'btn-ghost' : (forestOpen() ? 'btn-green' : 'btn-ghost')}" id="map-region" type="button">${region === 2 ? '🏚 К городу' : (forestOpen() ? '🌲 Тёмный лес' : '🔒 Тёмный лес')}</button>` : ''}
      <button class="btn btn-small map-free ${free ? 'btn-purple' : 'btn-ghost'}" id="map-free" type="button" aria-pressed="${free}"
        title="${free ? 'Свободный режим включён: все локации и уровни открыты' : 'Включить свободный режим: проходить в любом порядке'}">${free ? '🔓 Свободно' : '🔒 По порядку'}</button>
      <div class="quest-bar panel"><div id="quest-text">${questText()}</div></div>`;
    G.$$('.loc', sc).forEach(g => {
      const pw = G.$(`.plate-wrap[data-for="${g.dataset.id}"]`, sc);
      if (pw) {
        g.addEventListener('mouseenter', () => pw.classList.add('hov'));
        g.addEventListener('mouseleave', () => pw.classList.remove('hov'));
      }
      const go = () => M.open(g.dataset.id);
      g.addEventListener('click', go);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    const rb = G.$('#map-region', sc);
    if (rb) rb.addEventListener('click', () => {
      if (region !== 2 && !forestOpen()) {
        G.sfx('spooky');
        G.toast('🔒 Тёмный лес откроется, когда ты построишь Башню ведьмы');
        return;
      }
      G.sfx('click');
      region = region === 2 ? 1 : 2;
      G.state.mapRegion = region; G.save();
      paint(sc, false);
    });
    G.$('#map-free', sc).addEventListener('click', () => {
      G.state.freeMode = !G.state.freeMode;
      if (G.state.freeMode) G.state.pendingUnlock = null;
      G.save();
      G.sfx(G.state.freeMode ? 'found' : 'click');
      G.toast(G.state.freeMode ? '🔓 Свободный режим: всё открыто' : '🔒 Режим по порядку', 2200);
      paint(sc, true);
    });
    // на узких экранах прокручиваем к текущей (или только что открытой) локации
    const scroll = G.$('.map-scroll', sc);
    requestAnimationFrame(() => {
      const svg = G.$('#map-svg', sc);
      if (!svg || scroll.scrollWidth <= scroll.clientWidth) return;
      if (keep) { scroll.scrollLeft = oldScroll; return; }
      const cur = pending || (G.CHAIN[G.state.stage - 1] || {}).id;
      const t0 = byId(cur);
      const target = t0 && regionOf(t0.id) === region ? t0 : (region === 2 ? forestLocs()[forestLocs().length - 1] : byId('man'));
      const k = svg.getBoundingClientRect().width / mapW;
      scroll.scrollLeft = target.x * k - scroll.clientWidth / 2;
    });
    if (pending && !free && !keep) playUnlock(sc, pending);
  }

  G.mapKit = { pumpkin, candyCorn, lollipop, arch, win, bat, hill, road };

  /* ---------- Модуль карты ---------- */
  const M = G.map = {
    enter: function () {
      const sc = G.$('#screen-map');
      // в свободном режиме замков нет, анимация снятия не нужна
      if (G.state.freeMode && G.state.pendingUnlock) { G.state.pendingUnlock = null; G.save(); }
      region = pickRegion();
      paint(sc, false);
    },

    open: async function (id) {
      const loc = byId(id);
      const st = state(loc);
      G.sfx('click');
      if (st === 'locked') {
        G.sfx('spooky');
        const prev = G.CHAIN[loc.stage - 2];
        G.toast('🔒 Сначала пройди: «' + (prev ? prev.name : '…') + '»');
        const g = G.$(`.loc[data-id="${id}"]`);
        if (g) { g.classList.remove('shake'); void g.getBoundingClientRect(); g.classList.add('shake'); }
        return;
      }
      if (id === 'shop') return G.go('shop');
      if (id === 'home') return G.go('home');
      const b = BRIEF[id] ? BRIEF[id]() : forestBrief(id);
      const done = st === 'done';
      const r = await G.modal({
        title: b.title,
        body: b.body + (done ? '<p class="muted">Ты уже прошёл эту локацию. Можно играть снова за жетоны 🎃</p>' : ''),
        buttons: [{ text: 'Назад', cls: 'btn-ghost btn-small', value: false }, { text: b.btn, cls: 'btn-primary', value: true }],
        dismiss: true
      });
      if (r === true) G.go(b.go);
    },

    refreshQuest: function () {
      const q = G.$('#quest-text');
      if (q) q.innerHTML = questText();
    }
  };

  /* ---------- Титульный экран ---------- */
  G.title = {
    enter: function () {
      const sc = G.$('#screen-title');
      const has = G.state.stage > 1 || G.state.bbUnlocked > 1 || G.state.tokens !== 50 || G.state.placed.length;
      sc.innerHTML = `
        <svg class="title-house" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMax meet">
          <path d="M-600 400 V312 C-400 290 -200 320 0 308 C100 280 200 304 300 286 C400 268 470 304 560 290 C700 268 820 304 1000 280 C1200 262 1400 300 1600 296 V400Z" fill="#0d0518"/>
          <g fill="#07030f" stroke="#07030f" stroke-width="3" stroke-linejoin="round">
            <rect x="410" y="170" width="180" height="140"/><polygon points="402,172 500,92 598,172"/>
            <rect x="362" y="130" width="52" height="180"/><polygon points="354,132 388,60 422,132"/>
            <rect x="586" y="146" width="52" height="164"/><polygon points="578,148 612,78 646,148"/>
            <rect x="532" y="104" width="14" height="40"/>
          </g>
          <g class="titlewins">${win(371, 160, 18, 30, 0.2)}${win(595, 176, 18, 30, 0.9)}${win(430, 200, 20, 34, 0.5)}${win(550, 200, 20, 34, 1.4)}
            <circle cx="500" cy="136" r="11" fill="#ffb347" class="win"/>
            <path d="M488 310 V274 Q488 258 500 258 Q512 258 512 274 V310Z" fill="#ff8a1f" opacity=".7" class="win"/></g>
          <g stroke="#07030f" stroke-linecap="round" fill="none"><path d="M120 308 C120 270 112 240 124 210" stroke-width="10"/><path d="M124 210 C108 190 90 186 70 168 M124 210 C140 190 158 186 170 166" stroke-width="6"/>
            <path d="M880 300 C880 262 888 236 878 206" stroke-width="10"/><path d="M878 206 C894 186 912 182 930 164 M878 206 C862 188 846 184 830 170" stroke-width="6"/></g>
          <g fill="#07030f"><path d="M250 310 V280 Q250 262 264 262 Q278 262 278 280 V310Z"/><path d="M290 312 V288 Q290 274 300 274 Q310 274 310 288 V312Z"/><path d="M720 310 V282 Q720 264 734 264 Q748 264 748 282 V310Z"/><path d="M764 312 V290 Q764 276 774 276 Q784 276 784 290 V312Z"/></g>
        </svg>
        <div class="title-wrap">
          <div class="pumpkin-bounce" style="font-size:64px;filter:drop-shadow(0 0 18px #ff7a1a)">🎃</div>
          <h1 class="title-logo">Хэллоуинская<small>НОЧЬ</small></h1>
          <p class="title-sub">Пройди испытания на двух картах, заработай жетоны и обставь жуткий дом своей мечты.</p>
          <div class="title-btns">
            <button class="btn btn-big" id="t-play" type="button">▶ ${has ? 'Продолжить' : 'Играть'}</button>
            ${has ? '<button class="btn btn-small btn-ghost" id="t-new" type="button">Начать заново</button>' : ''}
          </div>
          <div class="title-foot">Работает без интернета • прогресс сохраняется в браузере</div>
        </div>`;
      G.$('#t-play').addEventListener('click', async () => {
        G.sfx('click');
        if (!G.state.seenIntro) {
          await G.modal({
            title: 'Добро пожаловать!', cls: 'wide',
            body: `<p class="big">🎃👻🦇</p>
              <p>Король Тыкв устраивает Хэллоуинский бал, и ты в списке гостей! Чтобы получить приглашение, пройди <b>шесть испытаний</b> в городе, а потом ещё <b>десять в Тёмном лесу</b>. Они открываются по очереди:</p>
              <p style="text-align:left;margin:10px auto;max-width:380px">
                <b class="hl">1.</b> Кладбище: 10 уровней Block Blast<br>
                <b class="hl">2.</b> Комната призраков: найди Золотой ключ<br>
                <b class="hl">3.</b> Конфетное поле: конфеты в комбинации<br>
                <b class="hl">4.</b> Хранитель правил: головоломка с законами<br>
                <b class="hl">5.</b> Старый склеп: Block Blast потруднее<br>
                <b class="hl">6.</b> Башня ведьмы: строй башню без промаха<br>
                <b class="hl">7–16.</b> Тёмный лес: десять разных мини-игр</p>
              <p>Жетоны 🎃 тратятся в <b>Лавке ведьмы</b> на мебель и украшения для твоего дома.</p>`,
            buttons: [{ text: 'Поехали!', cls: 'btn-primary' }]
          });
          G.state.seenIntro = true; G.save();
        }
        G.go('map');
      });
      const nw = G.$('#t-new');
      if (nw) nw.addEventListener('click', async () => {
        const r = await G.modal({
          title: 'Начать заново?', body: '<p>Весь прогресс, жетоны и мебель будут удалены.</p>',
          buttons: [{ text: 'Отмена', cls: 'btn-ghost btn-small', value: false }, { text: 'Удалить всё', cls: 'btn-purple', value: true }]
        });
        if (r) { G.resetAll(); G.title.enter(); G.toast('Прогресс сброшен'); }
      });
    }
  };
})();
