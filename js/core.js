/* =========================================================
   Хэллоуинская ночь — ядро игры
   Сохранение, экраны, модальные окна, звук (WebAudio),
   частицы и мелкие помощники. Никаких внешних файлов.
   ========================================================= */
(function () {
  'use strict';

  const SAVE_KEY = 'halloween-night-save-v1';

  const defaults = () => ({
    tokens: 50,            // хэллоуинские жетоны
    stage: 1,              // номер текущего испытания по цепочке G.CHAIN (1..16), 17 = всё пройдено
    pendingUnlock: null,   // id локации, замок которой надо красиво снять при следующем показе карты
    cleared: {},           // {номер испытания: true}: пройдено, даже если в свободном режиме не по порядку
    freeMode: false,       // «свободный режим»: все локации и уровни открыты, проходи в любом порядке
    mg: {},                // мини-игры «Тёмного леса»: {id: {unlocked, stars:{L:n}, best:{L:v}}}
    mapRegion: 0,          // какая карта открыта: 0 = выбрать автоматически, 1 = город, 2 = Тёмный лес
    hidRoom: 1,            // «Комната призраков»: сколько комнат открыто (1..3)
    hidRooms: {},          // {номер комнаты: true}: в какой комнате ключ уже найден
    bbUnlocked: 1,         // до какого уровня Block Blast открыт (1..10)
    bbBest: {},            // лучший счёт по уровням
    bb2Unlocked: 1,        // то же для второго Block Blast («Старый склеп»)
    bb2Best: {},
    rkUnlocked: 1,         // «Хранитель правил»: открыто уровней (1..9)
    rkBest: {},            // лучшее число ходов по уровням
    twUnlocked: 1,         // «Башенка»: открыто уровней (1..6)
    twBest: {},            // лучшая высота по уровням
    hidDone: false,
    m3Best: 0,
    owned: {},             // {id: количество}
    placed: [],            // расстановка в доме [{uid,id,x,y,s,f}]
    uid: 1,
    sound: true,
    music: false,
    seenIntro: false
  });

  const G = window.G = { current: null, version: 2 };

  /* Порядок прохождения. Номер испытания (stage) = индекс + 1.
     Лавка ведьмы и дом в цепочку не входят: они открыты всегда. */
  G.CHAIN = [
    { id: 'cem', go: 'bb',  name: 'Кладбище' },
    { id: 'man', go: 'hid', name: 'Комната призраков' },
    { id: 'pat', go: 'm3',  name: 'Конфетное поле' },
    { id: 'rk',  go: 'rk',  name: 'Хранитель правил' },
    { id: 'cry', go: 'bb2', name: 'Старый склеп' },
    { id: 'tow', go: 'tw',  name: 'Башня ведьмы' },
    // вторая карта, «Тёмный лес»: десять мини-игр (js/arcade.js, js/mg-*.js)
    { id: 'swamp',   go: 'mg-swamp',   name: 'Болото призраков',      region: 2 },
    { id: 'bats',    go: 'mg-bats',    name: 'Пещера летучих мышей',  region: 2 },
    { id: 'potion',  go: 'mg-potion',  name: 'Зельеварня',            region: 2 },
    { id: 'pumpkin', go: 'mg-pumpkin', name: 'Тыквенная грядка',      region: 2 },
    { id: 'spider',  go: 'mg-spider',  name: 'Паучья роща',           region: 2 },
    { id: 'maze',    go: 'mg-maze',    name: 'Туманный лабиринт',     region: 2 },
    { id: 'candle',  go: 'mg-candle',  name: 'Часовня свечей',        region: 2 },
    { id: 'grave',   go: 'mg-grave',   name: 'Гробовщик',             region: 2 },
    { id: 'candy',   go: 'mg-candy',   name: 'Дом сладостей',         region: 2 },
    { id: 'owl',     go: 'mg-owl',     name: 'Совиная библиотека',    region: 2 }
  ];
  G.FOREST_FIRST = 7;     // номер испытания, с которого начинается «Тёмный лес»
  /* Испытание n пройдено. Если оно было текущим, открываем следующее (уже пройденные в свободном
     режиме пропускаем). Возвращает true, когда испытание пройдено впервые: тогда игра показывает финальное окно. */
  G.advanceStage = function (n) {
    const s = G.state;
    if (!s.cleared) s.cleared = {};
    const fresh = !s.cleared[n] && !(s.stage > n);
    s.cleared[n] = true;
    if (s.stage === n) {
      let k = n + 1;
      while (k <= G.CHAIN.length && s.cleared[k]) k++;
      s.stage = k;
      s.pendingUnlock = k <= G.CHAIN.length ? G.CHAIN[k - 1].id : null;
    }
    G.save();
    return fresh;
  };
  /* Открыт ли уровень L: по порядку или в свободном режиме */
  G.levelOpen = (L, unlocked) => L <= unlocked || !!G.state.freeMode;

  /* ---------------- Сохранение ---------------- */
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(defaults(), JSON.parse(raw));
    } catch (e) { /* localStorage может быть недоступен */ }
    return defaults();
  }
  G.state = load();
  G.save = function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) { /* ничего страшного */ }
  };
  G.resetAll = function () {
    G.state = defaults();
    G.save();
    G.updateTokens();
    G.updateToggles();
  };

  /* ---------------- Помощники ---------------- */
  G.$ = (sel, root) => (root || document).querySelector(sel);
  G.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  G.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  G.sleep = ms => new Promise(r => setTimeout(r, ms));
  G.rand = n => Math.floor(Math.random() * n);
  G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  G.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.coin = (cls) => `<span class="coin ${cls || ''}">🎃</span>`;

  /* ---------------- Экраны ---------------- */
  G.go = function (name) {
    const prev = G.current;
    if (prev && G[prev] && G[prev].leave) {
      try { G[prev].leave(); } catch (e) { console.error(e); }
    }
    G.$$('.screen').forEach(s => s.classList.remove('active'));
    const sc = document.getElementById('screen-' + name);
    if (!sc) { console.error('Нет экрана', name); return; }
    sc.classList.add('active');
    G.current = name;
    document.body.dataset.screen = name;
    const mgDef = G.mg && G.mg.games && G.mg.games[name.replace(/^mg-/, '')];
    G.$('#hud-title').textContent = ({
      map: 'Хэллоуинская ночь', bb: 'Кладбище', bb2: 'Старый склеп', rk: 'Хранитель правил', tw: 'Башня ведьмы', hid: 'Комната призраков',
      m3: 'Конфетное поле', shop: 'Лавка ведьмы', home: 'Мой дом', title: ''
    })[name] || (name.indexOf('mg-') === 0 && mgDef ? mgDef.title : 'Хэллоуинская ночь');
    if (G[name] && G[name].enter) G[name].enter();
  };

  /* ---------------- Жетоны ---------------- */
  G.updateTokens = function (pulse) {
    G.$('#tokens-n').textContent = G.state.tokens;
    if (pulse) {
      const t = G.$('#tokens');
      t.classList.remove('pulse');
      void t.offsetWidth;
      t.classList.add('pulse');
    }
  };
  G.addTokens = function (n) {
    G.state.tokens += n;
    G.save();
    G.updateTokens(true);
    const r = G.$('#tokens').getBoundingClientRect();
    G.floatText(r.left + r.width / 2, r.bottom + 18, '+' + n + ' 🎃', 'green');
  };
  G.spend = function (n) {
    if (G.state.tokens < n) { G.sfx('bad'); G.toast('Не хватает жетонов 🎃'); return false; }
    G.state.tokens -= n;
    G.save();
    G.updateTokens(true);
    return true;
  };

  /* ---------------- Тосты ---------------- */
  G.toast = function (text, ms) {
    const root = G.$('#toast-root');
    const t = G.el('div', 'toast', text);
    root.appendChild(t);
    while (root.children.length > 2) root.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, ms || 2300);
  };

  /* ---------------- Модальные окна ----------------
     G.modal({title, body, buttons:[{text, cls, value}], cls, dismiss, onMount})
     возвращает Promise со значением нажатой кнопки */
  G.modal = function (opt) {
    return new Promise(resolve => {
      const root = G.$('#modal-root');
      const back = G.el('div', 'modal-back');
      const box = G.el('div', 'modal ' + (opt.cls || ''));
      if (opt.title) box.appendChild(G.el('h2', 'modal-title', opt.title));
      const body = G.el('div', 'modal-body');
      if (opt.body instanceof Node) body.appendChild(opt.body); else body.innerHTML = opt.body || '';
      box.appendChild(body);
      const btns = G.el('div', 'modal-btns');
      let closed = false;
      const close = (v) => {
        if (closed) return;
        closed = true;
        back.classList.remove('in');
        back.classList.add('out');
        setTimeout(() => back.remove(), 200);
        resolve(v);
      };
      (opt.buttons || [{ text: 'ОК' }]).forEach((b, i) => {
        const btn = G.el('button', 'btn ' + (b.cls || ''), b.text);
        btn.type = 'button';
        btn.addEventListener('click', () => { G.sfx('click'); close(b.value !== undefined ? b.value : i); });
        btns.appendChild(btn);
      });
      if ((opt.buttons || [1]).length) box.appendChild(btns);
      back.appendChild(box);
      back._close = close;            // нужно для кнопки «Назад» на Android
      back._dismiss = !!opt.dismiss;
      root.appendChild(back);
      requestAnimationFrame(() => back.classList.add('in'));
      if (opt.dismiss) back.addEventListener('pointerdown', e => { if (e.target === back) close(-1); });
      if (opt.onMount) opt.onMount(box, close);
    });
  };

  /* ---------------- Частицы ----------------
     Все эмодзи летают по одному canvas: раньше каждая частица была отдельным элементом
     с фильтром и анимацией, и на телефоне победа заметно подвисала. */
  const FX = { cv: null, cx: null, parts: [], raf: 0, dpr: 1, sprites: {} };
  function fxSprite(ch) {
    let s = FX.sprites[ch];
    if (!s) {
      s = document.createElement('canvas');
      s.width = s.height = 64;
      const c = s.getContext('2d');
      c.font = '46px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ch, 32, 35);
      FX.sprites[ch] = s;
    }
    return s;
  }
  function fxFit() {
    if (!FX.cv) {
      FX.cv = document.createElement('canvas');
      FX.cx = FX.cv.getContext('2d');
      G.$('#fx-root').insertBefore(FX.cv, G.$('#fx-root').firstChild);
    }
    const d = 1;      // частицы мелкие и быстро исчезают: хватает обычного разрешения, зато в разы меньше работы
    const w = Math.round(window.innerWidth * d), h = Math.round(window.innerHeight * d);
    if (FX.cv.width !== w || FX.cv.height !== h) { FX.cv.width = w; FX.cv.height = h; }
    FX.dpr = d;
    FX.cv.style.display = '';
  }
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function fxLoop(now) {
    const c = FX.cx, d = FX.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, FX.cv.width, FX.cv.height);
    c.setTransform(d, 0, 0, d, 0, 0);
    FX.parts = FX.parts.filter(q => {
      const t = (now - q.t0) / q.dur;
      if (t >= 1) return false;
      let x, y, sc, a, rot;
      if (t < 0.6) {
        const k = easeOut(t / 0.6);
        x = q.dx * k; y = q.dy * k; sc = 0.3 + 0.7 * k; a = 1; rot = q.rot * k;
      } else {
        const k = (t - 0.6) / 0.4;
        x = q.dx * (1 + 0.15 * k); y = q.dy + 40 * k; sc = 1 - 0.1 * k; a = 1 - k; rot = q.rot * (1 + 0.2 * k);
      }
      c.globalAlpha = a;
      c.save();
      c.translate(q.x + x, q.y + y);
      c.rotate(rot * Math.PI / 180);
      const sz = q.size * 1.3 * sc;
      c.drawImage(q.img, -sz / 2, -sz / 2, sz, sz);
      c.restore();
      return true;
    });
    c.globalAlpha = 1;
    if (FX.parts.length) FX.raf = requestAnimationFrame(fxLoop);
    else { FX.raf = 0; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, FX.cv.width, FX.cv.height); FX.cv.style.display = 'none'; }
  }
  G.burst = function (x, y, list, n, spread) {
    list = list || ['🎃', '🦇', '👻', '🍬', '⭐'];
    n = n || 14; spread = spread || 150;
    fxFit();
    const now = performance.now();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = spread * (0.4 + Math.random() * 0.8);
      FX.parts.push({
        img: fxSprite(G.pick(list)), x, y, t0: now, dur: 800 + Math.random() * 600,
        size: 14 + Math.random() * 18, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist - 40, rot: Math.random() * 360 - 180
      });
    }
    if (FX.parts.length > 140) FX.parts.splice(0, FX.parts.length - 140);
    if (!FX.raf) FX.raf = requestAnimationFrame(fxLoop);
  };
  G.confetti = function () {
    const w = window.innerWidth;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => G.burst(w * (0.15 + Math.random() * 0.7), window.innerHeight * (0.25 + Math.random() * 0.3),
        ['🎃', '🦇', '👻', '🍬', '🍭', '⭐', '🕸️'], 12, 200), i * 160);
    }
  };
  G.floatText = function (x, y, text, cls) {
    const root = G.$('#fx-root');
    const t = G.el('div', 'floatText ' + (cls || ''), text);
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    root.appendChild(t);
    t.animate([
      { transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 },
      { transform: 'translate(-50%,-80%) scale(1.15)', opacity: 1, offset: .25 },
      { transform: 'translate(-50%,-190%) scale(1)', opacity: 0 }
    ], { duration: 1100, easing: 'ease-out' }).onfinish = () => t.remove();
  };

  /* ---------------- Звук (WebAudio, без файлов) ---------------- */
  let ac = null, master = null, musicTimer = null, mTick = 0;
  function ctx() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = 0.55;
        master.connect(ac.destination);
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, t0, dur, type, vol, slideTo) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  const semi = (base, s) => base * Math.pow(2, s / 12);
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

  /* Лёгкая вибрация: Android через Capacitor Haptics или navigator.vibrate; на iOS в браузере её нет */
  G.vibrate = function (kind) {
    try {
      const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
      if (H && H.impact) { H.impact({ style: kind === 'heavy' ? 'HEAVY' : 'LIGHT' }); return; }
      if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 40 : 12);
    } catch (e) { /* не страшно */ }
  };
  const VIB = { place: 'light', bad: 'light', boom: 'heavy', win: 'heavy', found: 'heavy', buy: 'light' };

  G.sfx = function (name, n) {
    if (VIB[name] && G.state.sound) G.vibrate(VIB[name]);
    if (!G.state.sound) return;
    const a = ctx(); if (!a) return;
    const t = a.currentTime;
    n = n || 1;
    switch (name) {
      case 'click': tone(520, t, 0.07, 'triangle', 0.1); break;
      case 'pick': tone(700, t, 0.08, 'triangle', 0.12); break;
      case 'place': tone(190, t, 0.14, 'sine', 0.3, 110); tone(380, t, 0.06, 'triangle', 0.08); break;
      case 'swap': tone(300, t, 0.1, 'triangle', 0.14, 480); break;
      case 'bad': tone(170, t, 0.22, 'sawtooth', 0.1, 85); break;
      case 'clear':
        for (let i = 0; i < Math.min(2 + n, 8); i++) tone(semi(330, PENTA[i]), t + i * 0.055, 0.2, 'triangle', 0.14);
        break;
      case 'match':
        for (let i = 0; i < Math.min(2 + n, 7); i++) tone(semi(392, PENTA[i]), t + i * 0.045, 0.16, 'sine', 0.16);
        break;
      case 'boom': tone(260, t, 0.5, 'sawtooth', 0.16, 38); tone(90, t, 0.4, 'square', 0.12, 40); break;
      case 'coin': tone(988, t, 0.07, 'square', 0.06); tone(1319, t + 0.07, 0.18, 'square', 0.06); break;
      case 'buy': tone(784, t, 0.07, 'square', 0.06); tone(1047, t + 0.07, 0.07, 'square', 0.06); tone(1568, t + 0.14, 0.2, 'square', 0.06); break;
      case 'win':
        [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(semi(262, s), t + i * 0.09, 0.4, 'triangle', 0.17));
        break;
      case 'lose':
        [7, 5, 2, -3].forEach((s, i) => tone(semi(262, s), t + i * 0.2, 0.45, 'sawtooth', 0.07));
        break;
      case 'spooky': tone(110, t, 0.7, 'sawtooth', 0.07, 62); tone(116, t, 0.7, 'sawtooth', 0.05, 66); break;
      case 'found':
        [0, 7, 12, 16, 19].forEach((s, i) => tone(semi(392, s), t + i * 0.08, 0.5, 'sine', 0.18));
        break;
      /* короткие звуки для мини-игр */
      case 'pop': tone(520, t, 0.07, 'sine', 0.16, 960); break;
      case 'tick': tone(1250, t, 0.03, 'square', 0.04); break;
      case 'flap': tone(300, t, 0.09, 'triangle', 0.12, 170); break;
      case 'thud': tone(130, t, 0.14, 'sine', 0.28, 55); break;
      case 'ding': tone(1568, t, 0.3, 'sine', 0.12); tone(2349, t + 0.04, 0.22, 'sine', 0.06); break;
      case 'splash': tone(340, t, 0.22, 'sawtooth', 0.05, 110); break;
      case 'whoosh': tone(180, t, 0.18, 'sawtooth', 0.04, 900); break;
      case 'scare': tone(980, t, 0.32, 'sawtooth', 0.1, 190); break;
      case 'good': tone(660, t, 0.08, 'triangle', 0.14); tone(990, t + 0.07, 0.14, 'triangle', 0.14); break;
      case 'note': tone(semi(262, PENTA[(Math.max(1, n) - 1) % PENTA.length]), t, 0.4, 'triangle', 0.2); break;
      default: break;
    }
  };

  /* Фоновая музыка: тихий «мистический» арпеджио */
  const ROOTS = [220, 174.6, 196, 164.8];
  function musicTick() {
    if (!G.state.music) return;
    const a = ctx(); if (!a) return;
    const t = a.currentTime;
    const bar = Math.floor(mTick / 8) % ROOTS.length;
    const root = ROOTS[bar];
    if (mTick % 8 === 0) {
      tone(root / 2, t, 3.6, 'sine', 0.06);
      tone(root / 4, t, 3.6, 'triangle', 0.05);
    }
    const chord = [0, 3, 7, 10, 12, 15];
    const s = chord[Math.floor(Math.random() * chord.length)];
    if (Math.random() < 0.8) tone(semi(root * 2, s), t, 1.3, 'triangle', 0.035);
    if (Math.random() < 0.12) tone(semi(root * 4, chord[Math.floor(Math.random() * 4)]), t, 2, 'sine', 0.025);
    mTick++;
  }
  G.applyMusic = function () {
    clearInterval(musicTimer);
    musicTimer = null;
    if (G.state.music) {
      ctx();
      musicTimer = setInterval(musicTick, 480);
    }
  };
  G.updateToggles = function () {
    G.$('#btn-sound').classList.toggle('off', !G.state.sound);
    G.$('#btn-sound').textContent = G.state.sound ? '🔊' : '🔇';
    G.$('#btn-music').classList.toggle('off', !G.state.music);
  };

  /* ---------------- Подготовка интерфейса ---------------- */
  G.initUI = function () {
    // звёзды на фоне: три слоя, у каждого звёзды заданы через box-shadow
    const stars = G.$('#bg-stars');
    for (let g = 0; g < 3; g++) {
      const layer = document.createElement('i');
      const sh = [];
      for (let i = 0; i < 24; i++) sh.push(`${(Math.random() * 100).toFixed(1)}vw ${(Math.random() * 70).toFixed(1)}vh 0 ${Math.random() < 0.25 ? 1 : 0}px #fff`);
      layer.style.boxShadow = sh.join(',');
      stars.appendChild(layer);
    }
    G.$('#btn-back').addEventListener('click', () => { G.sfx('click'); G.go('map'); });
    G.$('#btn-sound').addEventListener('click', () => {
      G.state.sound = !G.state.sound; G.save(); G.updateToggles(); G.sfx('click');
    });
    G.$('#btn-music').addEventListener('click', () => {
      G.state.music = !G.state.music; G.save(); G.updateToggles(); G.applyMusic();
    });
    G.updateTokens();
    G.updateToggles();
    G.applyMusic();
    // Звук можно запускать только после касания. iOS Safari засчитывает touchend/click,
    // а pointerdown не всегда, поэтому слушаем все, пока контекст не оживёт.
    const evs = ['pointerdown', 'touchend', 'click', 'keydown'];
    let silent = false;
    const unlock = () => {
      const a = ctx();
      if (a && !silent) {          // тихий буфер окончательно «будит» звук на iOS
        silent = true;
        try {
          const src = a.createBufferSource();
          src.buffer = a.createBuffer(1, 1, 22050);
          src.connect(a.destination);
          src.start(0);
        } catch (e) { /* ок */ }
      }
      if (G.state.music && !musicTimer) G.applyMusic();
      if (a && a.state === 'running') evs.forEach(e => window.removeEventListener(e, unlock, true));
    };
    evs.forEach(e => window.addEventListener(e, unlock, true));

    // Свернули приложение: глушим музыку и звуковой движок, вернулись: включаем
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(musicTimer); musicTimer = null;
        if (ac && ac.state === 'running') { try { ac.suspend(); } catch (e) { /* ок */ } }
      } else if (ac) {
        try { ac.resume(); } catch (e) { /* ок */ }
        if (G.state.music) G.applyMusic();
      }
    });
  };

  /* Кнопка «Назад» (Android) и жест «назад»: что-то закрыть или вернуться на карту.
     Возвращает 'modal' | 'map' | 'exit'. */
  G.handleBack = function () {
    const modals = G.$$('#modal-root .modal-back:not(.out)');
    if (modals.length) {
      const m = modals[modals.length - 1];
      const ghost = m.querySelector('.modal-btns .btn-ghost');
      const all = m.querySelectorAll('.modal-btns .btn');
      if (m._dismiss && m._close) m._close(-1);
      else if (ghost) ghost.click();
      else if (all.length === 1) all[0].click();
      return 'modal';
    }
    if (G.current === 'title' || G.current === 'map') return 'exit';
    G.sfx('click');
    G.go('map');
    return 'map';
  };
})();
