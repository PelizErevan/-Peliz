/* =========================================================
   Совиная библиотека: «виселица» со словами.
   Сова-библиотекарь загадала слово из хэллоуинской книги. Игрок называет буквы русского алфавита:
   верная открывается во всех местах слова, за неверную сова теряет перо (всего шесть).
   Подсказка «💡» один раз за уровень открывает случайную букву, но тоже стоит одного пера.
   Буква «ё» считается за «е» (слов с «ё» в словаре нет). Всё на DOM: сова — SVG, который перерисовывается при ошибке.
   ========================================================= */
(function () {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ALPHA = 'абвгдежзийклмнопрстуфхцчшщъыьэюя'.split('');       // 32 буквы
  const FEATHERS = 6;

  /* слово и подсказка-вопрос над ним */
  const WORDS = [
    ['тыква', 'Что это?'], ['мумия', 'Кто это?'], ['зомби', 'Кто это?'], ['ворон', 'Кто это?'], ['упырь', 'Кто это?'], ['леший', 'Кто это?'],
    ['маска', 'Что это?'], ['туман', 'Что это?'], ['зелье', 'Что это?'], ['метла', 'Что это?'], ['свеча', 'Что это?'], ['склеп', 'Где это?'],
    ['ведьма', 'Кто это?'], ['скелет', 'Кто это?'], ['вампир', 'Кто это?'], ['гоблин', 'Кто это?'], ['колдун', 'Кто это?'], ['дракон', 'Кто это?'],
    ['тролль', 'Кто это?'], ['людоед', 'Кто это?'], ['кошмар', 'Что это?'], ['костюм', 'Что это?'], ['фонарь', 'Что это?'], ['лопата', 'Что это?'],
    ['пугало', 'Что это?'], ['могила', 'Где это?'], ['пещера', 'Где это?'], ['подвал', 'Где это?'],
    ['призрак', 'Кто это?'], ['русалка', 'Кто это?'], ['ведьмак', 'Кто это?'], ['чародей', 'Кто это?'], ['домовой', 'Кто это?'], ['великан', 'Кто это?'],
    ['конфета', 'Что это?'], ['паутина', 'Что это?'], ['леденец', 'Что это?'], ['шоколад', 'Что это?'], ['темница', 'Где это?'], ['полночь', 'Когда это?'],
    ['колдунья', 'Кто это?'], ['чудовище', 'Кто это?'], ['вурдалак', 'Кто это?'], ['кикимора', 'Кто это?'], ['горгулья', 'Кто это?'], ['василиск', 'Кто это?'],
    ['минотавр', 'Кто это?'], ['саркофаг', 'Что это?'], ['маскарад', 'Что это?'], ['карнавал', 'Что это?'], ['заклятие', 'Что это?'], ['сладости', 'Что это?'],
    ['паутинка', 'Что это?'], ['карамель', 'Что это?'], ['гробница', 'Где это?'], ['кладбище', 'Где это?'],
    ['оборотень', 'Кто это?'], ['некромант', 'Кто это?'], ['могильщик', 'Кто это?'], ['светлячок', 'Кто это?'], ['привратник', 'Кто это?'], ['привидение', 'Кто это?'],
    ['кровопийца', 'Кто это?'], ['полтергейст', 'Кто это?'], ['сладкоежка', 'Кто это?'], ['проклятие', 'Что это?'], ['мышеловка', 'Что это?'], ['шоколадка', 'Что это?'],
    ['страшилка', 'Что это?'], ['колдовство', 'Что это?'], ['заклинание', 'Что это?'], ['волшебство', 'Что это?'], ['полнолуние', 'Что это?'],
    ['тыквенный', 'Какой?'], ['карамельный', 'Какой?']
  ];
  const last = {};                          // последнее слово каждого уровня: чтобы подряд не повторялось

  const FEATHER_SVG = '<svg viewBox="0 0 24 44" aria-hidden="true"><path d="M12 2 C22 14 22 32 12 42 C2 32 2 14 12 2Z" fill="currentColor" stroke="rgba(30,16,8,.85)" stroke-width="2" stroke-linejoin="round"/><path d="M12 8 V40 M12 18 L7 14 M12 25 L6 20 M12 18 L17 14 M12 25 L18 20" stroke="rgba(30,16,8,.55)" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';

  /* сова: lost — сколько перьев потеряно (0..6). Каждая потеря убирает хохолок или перо крыла и меняет лицо */
  function owlSvg(lost, mood) {
    const m = Math.min(FEATHERS, lost);
    const O = '#2a1a12';
    const wing = (side, k, cx, cy, rot) => {
      const x = side > 0 ? 200 - cx : cx, r = side > 0 ? -rot : rot;
      return `<ellipse cx="${x}" cy="${cy}" rx="7.5" ry="25" transform="rotate(${r} ${x} ${cy})" fill="${k === 2 ? '#6b4328' : '#5b3820'}" stroke="${O}" stroke-width="2.4"/>` +
        `<path d="M${x} ${cy - 18} V${cy + 18}" transform="rotate(${r} ${x} ${cy})" stroke="rgba(255,220,170,.35)" stroke-width="1.6" stroke-linecap="round"/>`;
    };
    const wingsL = (m < 4 ? wing(-1, 0, 47, 130, 17) : '') + (m < 6 ? wing(-1, 1, 54, 134, 9) : '') + wing(-1, 2, 61, 136, 1);
    const wingsR = (m < 3 ? wing(1, 0, 47, 130, 17) : '') + (m < 5 ? wing(1, 1, 54, 134, 9) : '') + wing(1, 2, 61, 136, 1);
    const tufts = (m < 2 ? `<path d="M68 46 L56 16 L88 36Z" fill="#5b3820" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>` : '') +
      (m < 1 ? `<path d="M132 46 L144 16 L112 36Z" fill="#5b3820" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/>` : '');
    /* глаза: чем больше потерь, тем больше испуг */
    const eye = cx => {
      if (m >= 6) {
        return `<path d="M${cx - 7} 65 L${cx + 7} 79 M${cx + 7} 65 L${cx - 7} 79" stroke="#1b1020" stroke-width="3.4" stroke-linecap="round"/>`;
      }
      const pr = m >= 5 ? 3.4 : m >= 3 ? 4.4 : mood === 'happy' ? 8 : 7.4;
      const off = m >= 5 ? (cx < 100 ? -3 : 3) : 0;
      return `<circle cx="${cx}" cy="72" r="13" fill="#fff" stroke="#c9a878" stroke-width="1.5"/>` +
        `<circle cx="${cx + off}" cy="73" r="${pr}" fill="#1b1020"/><circle cx="${cx + off - 2.4}" cy="70" r="2.4" fill="#fff"/>`;
    };
    /* брови: ровные, потом «домиком» */
    const tilt = m === 0 ? 0 : m <= 2 ? 5 : 9;
    const brows = mood === 'happy'
      ? `<path d="M68 55 Q80 47 92 55 M108 55 Q120 47 132 55" stroke="${O}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
      : `<path d="M67 ${52 + tilt * 0.3} L91 ${52 - tilt}" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/><path d="M133 ${52 + tilt * 0.3} L109 ${52 - tilt}" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/>`;
    const sweat = m >= 3 && m < 6 ? '<path d="M141 46 C146 54 148 58 144 62 C140 65 136 62 137 58 C138 54 140 50 141 46Z" fill="#7fd4ff" stroke="#2a6a9a" stroke-width="1.6"/>' : '';
    const beak = m >= 6
      ? `<path d="M92 85 L108 85 L100 104Z" fill="#f2a73a" stroke="${O}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="100" cy="90" rx="4" ry="3.2" fill="#5a1a1a"/>`
      : `<path d="M93 83 L107 83 L100 98Z" fill="#f2a73a" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>`;
    const belly = '<path d="M72 112 q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 10 0 M74 124 q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 10 0 M78 136 q5 5 10 0 q5 5 10 0 q5 5 10 0 q5 5 10 0" stroke="#c9a171" stroke-width="2" fill="none" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 200 196" aria-hidden="true">
      <defs>
        <linearGradient id="owb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a06a44"/><stop offset="1" stop-color="#5e3a24"/></linearGradient>
      </defs>
      <ellipse cx="100" cy="190" rx="70" ry="5" fill="rgba(0,0,0,.35)"/>
      <rect x="38" y="172" width="124" height="16" rx="3" fill="#2f5b7b" stroke="${O}" stroke-width="2.4"/><rect x="46" y="177" width="108" height="3" fill="rgba(255,255,255,.35)"/>
      <rect x="48" y="158" width="104" height="15" rx="3" fill="#7b2d3b" stroke="${O}" stroke-width="2.4"/><rect x="56" y="163" width="88" height="3" fill="rgba(255,255,255,.3)"/><rect x="132" y="158" width="6" height="15" fill="#e0b040"/>
      <rect x="58" y="145" width="84" height="14" rx="3" fill="#6b7b2d" stroke="${O}" stroke-width="2.4"/><rect x="66" y="150" width="68" height="3" fill="rgba(255,255,255,.3)"/>
      <ellipse cx="84" cy="146" rx="9" ry="4" fill="#f2a73a" stroke="${O}" stroke-width="2"/><ellipse cx="116" cy="146" rx="9" ry="4" fill="#f2a73a" stroke="${O}" stroke-width="2"/>
      <path d="M52 112 C52 74 148 74 148 112 C148 150 126 150 100 150 C74 150 52 150 52 112Z" fill="url(#owb)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="100" cy="122" rx="34" ry="30" fill="#f1dcb4"/>${belly}
      ${wingsL}${wingsR}
      <ellipse cx="100" cy="68" rx="46" ry="40" fill="url(#owb)" stroke="${O}" stroke-width="3"/>
      ${tufts}
      <circle cx="80" cy="72" r="20" fill="#f7e8c8" stroke="#c9a878" stroke-width="1.6"/><circle cx="120" cy="72" r="20" fill="#f7e8c8" stroke="#c9a878" stroke-width="1.6"/>
      ${eye(80)}${eye(120)}
      <circle cx="80" cy="72" r="19" fill="none" stroke="#e0b040" stroke-width="3.2"/><circle cx="120" cy="72" r="19" fill="none" stroke="#e0b040" stroke-width="3.2"/>
      <path d="M97 68 Q100 63 103 68" fill="none" stroke="#e0b040" stroke-width="3" stroke-linecap="round"/>
      <path d="M61 70 L53 64 M139 70 L147 64" stroke="#e0b040" stroke-width="3" stroke-linecap="round"/>
      ${brows}${beak}${sweat}
    </svg>`;
  }

  G.mg.register({
    id: 'owl',
    title: 'Совиная библиотека',
    icon: '🦉',
    intro: 'Сова-библиотекарь загадала слово из хэллоуинской книги. Называй буквы: верная откроется в слове, а за каждую ошибку сова теряет перо. Шесть ошибок, и она улетит!',
    quest: 'Угадай слова совы-библиотекаря: за каждую ошибку она теряет перо 🦉',
    doneTitle: 'Весь Тёмный лес пройден!',
    doneIcon: '📚',
    doneText: 'Сова-библиотекарь довольна: все слова угаданы, а книги вернулись на полки. Ты прошёл весь <b class="hl">Тёмный лес</b>!',
    levels: [
      { label: '5–6 букв', min: 5, max: 6, task: 'Сова загадала слово из <b>5–6 букв</b>. Называй буквы: верная открывается, а за ошибку сова теряет перо. Перьев всего <b>шесть</b>.' },
      { label: '6–7 букв', min: 6, max: 7, task: 'Слово подлиннее: <b>6–7 букв</b>. Подсказка 💡 открывает одну букву, но стоит пера, и работает один раз.' },
      { label: '8 букв', min: 8, max: 8, task: 'Слово из <b>8 букв</b>. Начинай с самых частых букв: А, О, Е, И, Н, Т.' },
      { label: '9–11 букв', min: 9, max: 11, task: 'Самые длинные слова: <b>9–11 букв</b>. Над словом написан вопрос-намёк: подумай, о чём он.' }
    ],

    start(ctx, L, cfg) {
      const pool = WORDS.filter(w => w[0].length >= cfg.min && w[0].length <= cfg.max);
      let pick;
      let guard = 0;
      do { pick = pool[G.rand(pool.length)]; } while (pool.length > 1 && last[L] === pick[0] && guard++ < 30);
      last[L] = pick[0];
      const word = pick[0], cat = pick[1];
      const letters = word.split('');
      const used = new Set();
      let feathers = FEATHERS, lost = 0, hintUsed = false, finished = false;

      const root = G.el('div', 'ow-root');
      root.innerHTML =
        '<div class="ow-top"><div class="ow-owl"></div><div class="ow-falls"></div></div>' +
        '<div class="ow-feathers"></div>' +
        '<div class="ow-cat"></div>' +
        '<div class="ow-word"></div>' +
        '<div class="ow-hintbar"><button class="btn btn-small" type="button" data-r="hint">💡 Подсказка</button></div>' +
        '<div class="ow-kb"></div>';
      ctx.box.appendChild(root);
      const owlEl = G.$('.ow-owl', root), falls = G.$('.ow-falls', root), fRow = G.$('.ow-feathers', root);
      const catEl = G.$('.ow-cat', root), wordEl = G.$('.ow-word', root), kb = G.$('.ow-kb', root);
      const hintBtn = G.$('[data-r="hint"]', root);

      /* перья-шкала */
      for (let i = 0; i < FEATHERS; i++) { const f = G.el('i', 'ow-f on'); f.innerHTML = FEATHER_SVG; fRow.appendChild(f); }
      const fIcons = [...fRow.children];
      catEl.textContent = cat;
      /* плитки слова */
      const tiles = letters.map(() => { const t = G.el('span', 'ow-tile'); wordEl.appendChild(t); return t; });
      /* клавиатура */
      const keys = {};
      ALPHA.forEach(ch => {
        const b = G.el('button', 'ow-key', ch);
        b.type = 'button'; b.dataset.ch = ch;
        kb.appendChild(b); keys[ch] = b;
      });

      function drawOwl(mood) { owlEl.innerHTML = owlSvg(lost, mood); }
      drawOwl();

      /* размеры: клавиатура в 3–4 ряда по ширине, сова занимает всё свободное место */
      ctx.onResize((w, h) => {
        const padX = 16, gap = 4, n = letters.length;
        const tw = clamp(Math.floor((w - padX - (n - 1) * 4) / n), 20, 38);
        const wordH = Math.round(tw * 1.25) + 6;
        const fixed = 24 + 18 + wordH + 36 + 5 * 6 + 14;
        const kw8 = (w - padX - 7 * gap) / 8;
        const cols = w >= 480 ? 11 : kw8 >= 31 ? 8 : 7;
        const rows = Math.ceil(ALPHA.length / cols);
        const kw = (w - padX - (cols - 1) * gap) / cols;
        const room = h - fixed - 88;
        const kh = clamp(Math.min(kw * 1.12, Math.floor(room / rows) - gap), 30, 50);
        const kbH = rows * kh + (rows - 1) * gap;
        const owl = clamp(h - fixed - kbH, 80, 200);
        const st = root.style;
        st.setProperty('--tw', tw + 'px'); st.setProperty('--cols', cols); st.setProperty('--kh', Math.round(kh) + 'px'); st.setProperty('--owh', Math.round(owl) + 'px');
      });

      /* ---- счётчики ---- */
      ctx.chip('fe', '🦉', feathers);
      ctx.chip('hint', '💡', 1);
      const shown = () => letters.filter(ch => used.has(ch)).length;
      const upd = () => {
        ctx.goal(shown(), letters.length, 'Букв открыто: ' + shown() + ' из ' + letters.length);
        ctx.chip('fe', '🦉', feathers, true);
        hintBtn.disabled = hintUsed || feathers <= 1 || finished;
      };
      upd();

      function showTiles(reveal) {
        letters.forEach((ch, i) => {
          const t = tiles[i];
          if (used.has(ch)) {
            if (!t.textContent) { t.textContent = ch; t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); }
          } else if (reveal) { t.textContent = ch; t.classList.add('miss'); }
        });
      }
      function featherFall() {
        const f = G.el('div', 'ow-fall');
        f.innerHTML = FEATHER_SVG;
        f.style.left = (28 + G.rand(44)) + '%';
        f.style.setProperty('--dx', (G.rand(70) - 35) + 'px');
        f.style.setProperty('--rot', (G.rand(120) - 60) + 'deg');
        falls.appendChild(f);
        f.addEventListener('animationend', () => f.remove());
      }
      function loseFeather() {
        feathers--; lost++;
        fIcons.forEach((el, i) => { el.classList.toggle('on', i < feathers); el.classList.toggle('off', i >= feathers); });
        drawOwl();
        featherFall();
        owlEl.classList.remove('hit'); void owlEl.offsetWidth; owlEl.classList.add('hit');
      }
      function checkEnd(byHint) {
        if (finished) return;
        if (letters.every(ch => used.has(ch))) {
          finished = true;
          drawOwl('happy');
          owlEl.classList.add('cheer');
          G.sfx('found');
          const r = root.getBoundingClientRect(), b = ctx.box.getBoundingClientRect();
          ctx.burst(r.left - b.left + r.width / 2, 90, ['✨', '📚', '⭐'], 12, 130);
          const stars = lost <= 1 ? 3 : lost <= 3 ? 2 : 1;
          ctx.after(900, () => ctx.win({ stars, score: feathers, text: 'Слово: <b class="hl">' + word.toUpperCase() + '</b>. Потеряно перьев: <b class="hl">' + lost + '</b> из ' + FEATHERS }));
        } else if (feathers <= 0) {
          finished = true;
          showTiles(true);
          owlEl.classList.add('gone');
          ctx.shake();
          ctx.after(900, () => ctx.lose({ title: 'Сова улетела!', icon: '🦉', text: 'Слово было: <b>' + word.toUpperCase() + '</b>. В следующий раз повезёт!' }));
        }
        upd();
      }
      function guess(raw) {
        if (finished || ctx.over || ctx.paused) return false;
        let ch = String(raw || '').toLowerCase();
        if (ch === 'ё') ch = 'е';
        if (!ALPHA.includes(ch) || used.has(ch)) return false;
        used.add(ch);
        const b = keys[ch];
        b.disabled = true;
        if (letters.includes(ch)) {
          b.classList.add('ok');
          G.sfx('good');
          showTiles(false);
        } else {
          b.classList.add('bad');
          G.sfx('thud');
          loseFeather();
        }
        checkEnd();
        return true;
      }
      function hint() {
        if (finished || hintUsed || feathers <= 1 || ctx.over || ctx.paused) return false;
        const left = [...new Set(letters.filter(ch => !used.has(ch)))];
        if (!left.length) return false;
        const ch = left[G.rand(left.length)];
        hintUsed = true;
        ctx.chip('hint', '💡', 0, true);
        used.add(ch);
        keys[ch].disabled = true; keys[ch].classList.add('ok', 'hint');
        G.sfx('ding');
        showTiles(false);
        loseFeather();
        ctx.say('Открыта буква «' + ch.toUpperCase() + '»', 1800);
        checkEnd(true);
        return true;
      }
      ctx.listen(kb, 'click', e => { const b = e.target.closest ? e.target.closest('.ow-key') : null; if (b) guess(b.dataset.ch); });
      ctx.listen(hintBtn, 'click', () => { hint(); });
      ctx.listen(window, 'keydown', e => {
        if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        if (document.querySelector('.modal-back.in')) return;
        if (e.key && e.key.length === 1 && guess(e.key)) e.preventDefault();
      });

      ctx.debug = {
        word: () => word,
        cat: () => cat,
        press: ch => guess(ch),
        hint,
        st: () => ({ feathers, lost, hintUsed, finished, shown: shown(), total: letters.length, used: [...used], mood: owlEl.className }),
        tilesText: () => tiles.map(t => t.textContent || '_').join('')
      };
    }
  });
  G.mg.games.owl._words = WORDS;
})();
