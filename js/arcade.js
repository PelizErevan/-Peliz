/* =========================================================
   Аркада: общий каркас мини-игр «Тёмного леса»
   Каждая игра регистрируется через G.mg.register({...}) и получает готовый экран:
   шапку («Уровни», номер уровня, «Заново»), строку счётчиков, цель-полоску, игровое поле
   (ctx.box), карточку с заданием, выбор уровня, награды, звёзды и переход по цепочке.
   Файлы игр: js/mg-<id>.js и css/mg-<id>.css. Подробности: GAME_SPEC.md.
   ========================================================= */
(function () {
  'use strict';

  const MG = G.mg = { games: {}, order: [], dpr: Math.min(2, window.devicePixelRatio || 1) };
  let curCtx = null;
  MG.cur = () => curCtx;            // текущий уровень (нужен автотестам)

  /* ---------------- Прогресс ---------------- */
  MG.progress = function (id) {
    const all = G.state.mg || (G.state.mg = {});
    let p = all[id];
    if (!p || typeof p !== 'object') p = all[id] = { unlocked: 1, stars: {}, best: {} };
    if (!p.stars) p.stars = {};
    if (!p.best) p.best = {};
    if (!(p.unlocked >= 1)) p.unlocked = 1;
    return p;
  };

  /* ---------------- Спрайты (кэш canvas) ----------------
     Рисуем один раз, потом drawImage. Размеры округляйте: каждый новый размер = новый спрайт. */
  const sprites = new Map();           // последние использованные спрайты (старые вытесняются)
  MG.sprite = function (key, w, h, draw) {
    const k = key + '|' + w + 'x' + h;
    let s = sprites.get(k);
    if (s) {
      sprites.delete(k);               // «освежить»: переносим в конец очереди
      sprites.set(k, s);
      return s;
    }
    const d = MG.dpr;
    s = document.createElement('canvas');
    s.width = Math.ceil(w * d);
    s.height = Math.ceil(h * d);
    const c = s.getContext('2d');
    c.scale(d, d);
    draw(c, w, h);
    sprites.set(k, s);
    if (sprites.size > 320) sprites.delete(sprites.keys().next().value);
    return s;
  };
  MG.emoji = function (ch, size) {
    size = Math.round(size);
    return MG.sprite('e' + ch, size, size, (c, w) => {
      c.font = Math.round(size * 0.8) + 'px serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(ch, w / 2, w / 2 + size * 0.06);
    });
  };

  /* Убирает из цепочки игры «Тёмного леса», которых нет в сборке (порядок сохраняется) */
  MG.trimChain = function () {
    for (let i = G.CHAIN.length - 1; i >= 0; i--) {
      if (G.CHAIN[i].region && !MG.games[G.CHAIN[i].id]) G.CHAIN.splice(i, 1);
    }
  };

  /* ---------------- Регистрация игры ---------------- */
  MG.register = function (def) {
    const idx = G.CHAIN.findIndex(c => c.id === def.id);
    if (idx < 0) throw new Error('mg: в G.CHAIN нет этапа ' + def.id);
    def.stage = idx + 1;
    def.screen = 'mg-' + def.id;
    MG.games[def.id] = def;
    if (MG.order.indexOf(def.id) < 0) MG.order.push(def.id);
    let sc = document.getElementById('screen-' + def.screen);
    if (!sc) {
      sc = G.el('section', 'screen');
      sc.id = 'screen-' + def.screen;
      G.$('#app').appendChild(sc);
    }
    sc.classList.add('mg-screen', 'mg-' + def.id);
    G[def.screen] = controller(def, sc);
  };

  const reward = (def, L) => def.reward ? def.reward(L) : 25 + 10 * L;

  /* ---------------- Контроллер одной игры ---------------- */
  function controller(def, sc) {
    const N = def.levels.length;
    let session = 0, level = 0, ctx = null, inst = null;
    let boxEl, titleEl, chipsEl, goalEl, goalFill, goalTxt;

    const C = {
      def,
      enter: function () {
        session++;
        teardown();
        sc.innerHTML = `
          <div class="game-col mg">
            <div class="game-head">
              <button class="btn btn-small btn-ghost" data-act="levels" type="button">☰ Уровни</button>
              <div class="game-title" data-r="title">${def.title}</div>
              <button class="btn btn-small btn-purple" data-act="restart" type="button" title="Начать уровень заново">🔄</button>
            </div>
            <div class="mg-info">
              <div class="mg-chips"></div>
              <div class="bar mg-goalbar" hidden><i></i><span class="bar-label"></span></div>
            </div>
            <div class="mg-box"></div>
          </div>`;
        boxEl = G.$('.mg-box', sc);
        titleEl = G.$('[data-r="title"]', sc);
        chipsEl = G.$('.mg-chips', sc);
        goalEl = G.$('.mg-goalbar', sc);
        goalFill = G.$('i', goalEl);
        goalTxt = G.$('.bar-label', goalEl);
        G.$('[data-act="levels"]', sc).addEventListener('click', () => { G.sfx('click'); showLevels(); });
        G.$('[data-act="restart"]', sc).addEventListener('click', () => {
          if (!level) { showLevels(); return; }
          G.sfx('click');
          startLevel(level, true);
        });
        level = 0;
        showLevels();
      },
      leave: function () {
        session++;
        teardown();
      }
    };

    /* ---------- Выбор уровня ---------- */
    async function showLevels() {
      const my = session;
      const P = MG.progress(def.id);
      const playing = !!(ctx && !ctx.over && !ctx.dead);
      if (playing) ctx.paused = true;
      const wrap = G.el('div', 'mg-levels');
      wrap.style.setProperty('--cols', Math.min(N, 5));
      let cur = 0;
      for (let L = 1; L <= N; L++) if (!cur && P.stars[L] === undefined && G.levelOpen(L, P.unlocked)) cur = L;
      for (let L = 1; L <= N; L++) {
        const done = P.stars[L] > 0, open = G.levelOpen(L, P.unlocked);
        const b = G.el('button', 'bb-lvl' + (done ? ' done' : '') + (open ? '' : ' locked') + (L === cur ? ' cur' : ''));
        b.type = 'button';
        const lab = (def.levels[L - 1].label || '');
        b.innerHTML = `<span class="n">${open ? L : '🔒'}</span><small>${lab}</small>${done ? '<i>✔</i>' : ''}`;
        b.disabled = !open;
        b.dataset.l = L;
        wrap.appendChild(b);
      }
      const doneN = Object.keys(P.stars).filter(k => P.stars[k] > 0).length;
      const body = G.el('div');
      body.innerHTML = `<p>${def.intro || ''}</p>`;
      body.appendChild(wrap);
      body.insertAdjacentHTML('beforeend', `<p class="muted">Пройдено: <b class="hl">${doneN}/${N}</b>. Награда за новый уровень растёт!</p>`);
      const picked = await G.modal({
        title: def.icon + ' ' + def.title, cls: 'wide', body,
        buttons: playing
          ? [{ text: 'Продолжить', cls: 'btn-primary', value: 0 }, { text: 'На карту', cls: 'btn-ghost btn-small', value: -1 }]
          : [{ text: 'На карту', cls: 'btn-ghost btn-small', value: -1 }],
        onMount: (box, close) => {
          G.$$('.bb-lvl', box).forEach(b => b.addEventListener('click', () => { if (!b.disabled) { G.sfx('click'); close(+b.dataset.l); } }));
        }
      });
      if (my !== session) return;
      if (picked > 0) startLevel(picked);
      else if (picked === -1) G.go('map');
      else if (ctx) ctx.paused = false;
    }

    /* ---------- Старт уровня ---------- */
    function startLevel(L, skipCard) {
      teardown();
      const my = ++session;
      level = L;
      const cfg = def.levels[L - 1];
      const x = ctx = makeCtx(L, cfg);
      curCtx = x;
      titleEl.textContent = 'Уровень ' + L;
      chipsEl.innerHTML = '';
      goalEl.hidden = true;
      boxEl.innerHTML = '';
      const begin = () => {
        if (my !== session || x.dead) return;
        x._run();
        try { inst = def.start(x, L, cfg) || null; }
        catch (e) { console.error(e); G.toast('Ошибка в игре'); }
      };
      if (skipCard) { begin(); return; }
      const card = G.el('div', 'mg-card');
      card.innerHTML = `
        <div class="mg-card-n">Уровень ${L} из ${N}</div>
        <div class="mg-card-ico">${def.icon}</div>
        <div class="mg-card-task">${cfg.task || def.task || ''}</div>
        <button class="btn btn-primary btn-big" type="button" data-r="play">Играть ▶</button>`;
      boxEl.appendChild(card);
      G.$('[data-r="play"]', card).addEventListener('click', () => { G.sfx('click'); card.remove(); begin(); });
    }

    function teardown() {
      const x = ctx;
      ctx = null;
      if (x) {
        x.dead = true;
        x._stop();
        if (curCtx === x) curCtx = null;
      }
      if (inst && inst.destroy) { try { inst.destroy(); } catch (e) { console.error(e); } }
      inst = null;
      if (boxEl) boxEl.innerHTML = '';
    }

    /* ---------- Контекст уровня (то, что видит игра) ---------- */
    function makeCtx(L, cfg) {
      const tasks = [], loops = [], cleanups = [];
      let raf = 0, last = 0, say = null;
      const x = {
        L, N, cfg, def,
        box: boxEl, root: boxEl.parentNode,
        time: 0,            // игровое время в секундах (без пауз)
        paused: false,      // true, пока открыто меню уровней
        over: false,        // уровень закончен (win/lose вызваны)
        dead: false,        // экран закрыт
        debug: {},          // сюда игра кладёт функции для автотестов
        sfx: G.sfx,
        alive: () => !x.dead && !x.over
      };

      /* Цикл кадров: dt в секундах (не больше 0.05), на паузе и после конца не вызывается */
      function frame(now) {
        if (x.dead) return;
        raf = requestAnimationFrame(frame);
        let dt = (now - last) / 1000;
        last = now;
        if (!(dt > 0)) dt = 0.016;
        if (dt > 0.05) dt = 0.05;
        if (x.paused || x.over) return;
        x.time += dt;
        for (let i = 0; i < tasks.length; i++) {
          const t = tasks[i];
          if (t.dead) { tasks.splice(i--, 1); continue; }
          if (x.time >= t.at) {
            if (t.every) { t.at += t.every; if (t.at < x.time) t.at = x.time + t.every; }
            else { t.dead = true; tasks.splice(i--, 1); }
            try { t.fn(); } catch (e) { console.error(e); }
            if (x.over || x.dead) return;
          }
        }
        for (let i = 0; i < loops.length; i++) {
          try { loops[i](dt, x.time); } catch (e) { console.error(e); }
          if (x.over || x.dead) return;
        }
      }
      x._run = () => { last = performance.now(); raf = requestAnimationFrame(frame); };
      x._stop = () => {
        cancelAnimationFrame(raf);
        cleanups.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } });
        tasks.length = loops.length = 0;
      };

      /* кадры и таймеры (учитывают паузу) */
      x.loop = fn => { loops.push(fn); return () => { const i = loops.indexOf(fn); if (i >= 0) loops.splice(i, 1); }; };
      x.after = (ms, fn) => { const t = { at: x.time + ms / 1000, fn }; tasks.push(t); return { cancel: () => { t.dead = true; } }; };
      x.every = (ms, fn) => { const t = { at: x.time + ms / 1000, every: ms / 1000, fn }; tasks.push(t); return { cancel: () => { t.dead = true; } }; };
      x.onCleanup = fn => { cleanups.push(fn); };
      x.listen = (target, type, fn, opts) => {
        target.addEventListener(type, fn, opts);
        cleanups.push(() => target.removeEventListener(type, fn, opts));
      };

      /* размеры поля */
      x.size = () => ({ w: boxEl.clientWidth, h: boxEl.clientHeight });
      x.onResize = fn => {
        let pw = -1, ph = -1;
        const run = () => {
          const w = boxEl.clientWidth, h = boxEl.clientHeight;
          if (w === pw && h === ph) return;
          pw = w; ph = h;
          try { fn(w, h); } catch (e) { console.error(e); }
        };
        run();
        if (window.ResizeObserver) {
          const ro = new ResizeObserver(() => { if (!x.dead) run(); });
          ro.observe(boxEl);
          cleanups.push(() => ro.disconnect());
        } else x.listen(window, 'resize', run);
      };

      /* canvas во всё поле. view.begin() очищает и настраивает масштаб: дальше рисуем в CSS-пикселях */
      x.canvas = function (dprCap) {
        const cap = dprCap || 1.5;
        const cv = document.createElement('canvas');
        cv.className = 'mg-cv';
        boxEl.appendChild(cv);
        const view = { cv, c: cv.getContext('2d'), w: 0, h: 0, dpr: 1 };
        view.fit = function () {
          const w = boxEl.clientWidth, h = boxEl.clientHeight;
          const d = Math.min(cap, window.devicePixelRatio || 1);
          const pw = Math.max(1, Math.round(w * d)), ph = Math.max(1, Math.round(h * d));
          if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
          view.w = w; view.h = h; view.dpr = d;
        };
        view.begin = function () {
          const c = view.c;
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.clearRect(0, 0, cv.width, cv.height);
          c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
          return c;
        };
        view.fit();
        x.onResize(() => view.fit());
        return view;
      };

      /* координаты касания внутри поля и эффекты в координатах поля */
      x.rel = e => { const r = boxEl.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      x.burst = (bx, by, list, n, spread) => { const r = boxEl.getBoundingClientRect(); G.burst(r.left + bx, r.top + by, list, n, spread); };
      x.float = (bx, by, text, cls) => { const r = boxEl.getBoundingClientRect(); G.floatText(r.left + bx, r.top + by, text, cls); };
      x.shake = () => {
        boxEl.classList.remove('mg-shake');
        void boxEl.offsetWidth;
        boxEl.classList.add('mg-shake');
      };
      x.say = (text, ms) => {
        if (say) say.remove();
        say = G.el('div', 'mg-say', text);
        boxEl.appendChild(say);
        const me = say;
        setTimeout(() => { if (me === say) say = null; me.remove(); }, ms || 2200);
      };

      /* счётчики над полем и цель-полоска */
      x.chip = function (id, label, value, bump) {
        let c = G.$('[data-c="' + id + '"]', chipsEl);
        if (!c) {
          c = G.el('div', 'chip', label + ' <b></b>');
          c.dataset.c = id;
          chipsEl.appendChild(c);
        }
        const b = c.lastElementChild;
        const v = String(value);
        if (b.textContent !== v) {
          b.textContent = v;
          if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
        }
        return c;
      };
      x.goal = function (cur, max, text) {
        goalEl.hidden = false;
        goalFill.style.width = Math.max(0, Math.min(100, max > 0 ? cur / max * 100 : 0)) + '%';
        goalTxt.textContent = text !== undefined ? text : cur + ' / ' + max;
      };
      /* обратный отсчёт: чип со временем; по нулю зовёт onEnd. Возвращает {left, add(sec)} */
      x.countdown = function (sec, onEnd, opt) {
        opt = opt || {};
        const T = { left: sec, add: s => { T.left += s; } };
        let shown = -1;
        x.loop(dt => {
          if (T.paused) return;
          T.left -= dt;
          const s = Math.max(0, Math.ceil(T.left));
          if (s !== shown) {
            shown = s;
            x.chip(opt.id || 'time', opt.label || '⏱', s);
            if (s <= (opt.warn === undefined ? 5 : opt.warn) && s > 0) G.sfx('tick');
          }
          if (T.left <= 0) { T.left = 0; if (onEnd) onEnd(); }
        });
        return T;
      };

      /* конец уровня */
      x.win = opt => finish(x, true, typeof opt === 'number' ? { stars: opt } : (opt || {}));
      x.lose = opt => finish(x, false, typeof opt === 'string' ? { text: opt } : (opt || {}));
      return x;
    }

    /* ---------- Победа и поражение ---------- */
    async function finish(x, isWin, opt) {
      if (x.over || x.dead) return;
      x.over = true;
      const my = session;
      const L = x.L;
      const P = MG.progress(def.id);
      if (isWin) {
        const stars = G.clamp(Math.round(opt.stars || 1), 1, 3);
        const first = !(P.stars[L] > 0);
        const tok = first ? reward(def, L) : Math.round(reward(def, L) * 0.4);
        P.stars[L] = Math.max(P.stars[L] || 0, stars);
        if (typeof opt.score === 'number') {
          const old = P.best[L];
          P.best[L] = old === undefined ? opt.score : (def.lowerBetter ? Math.min(old, opt.score) : Math.max(old, opt.score));
        }
        P.unlocked = Math.max(P.unlocked, Math.min(N, L + 1));
        const fresh = L === N ? G.advanceStage(def.stage) : false;
        G.sfx('win');
        G.confetti();
        G.addTokens(tok);
        G.save();
        await G.sleep(750);
        if (my !== session) return;
        if (fresh) {
          await G.modal({
            title: def.doneTitle || 'Испытание пройдено!',
            body: `<p class="big">${def.doneIcon || def.icon}</p><p>${def.doneText || ''}</p><div class="reward">+${tok} ${G.coin()}</div>`,
            buttons: [{ text: 'На карту', cls: 'btn-primary' }]
          });
          if (my !== session) return;
          G.go('map');
          return;
        }
        const r = await G.modal({
          title: 'Уровень пройден!',
          body: `<div class="stars">${'⭐'.repeat(stars)}</div>${opt.text ? `<p>${opt.text}</p>` : ''}
            <div class="reward">+${tok} ${G.coin()}</div>${first ? '' : '<p class="muted">Повторное прохождение: награда меньше</p>'}`,
          buttons: [
            { text: 'Уровни', cls: 'btn-ghost btn-small', value: 'levels' },
            L < N ? { text: 'Дальше ▶', cls: 'btn-primary', value: 'next' } : { text: 'Ещё раз', cls: 'btn-primary', value: 'again' }
          ]
        });
        if (my !== session) return;
        if (r === 'next') startLevel(L + 1);
        else if (r === 'again') startLevel(L, true);
        else showLevels();
      } else {
        G.sfx('lose');
        await G.sleep(550);
        if (my !== session) return;
        const r = await G.modal({
          title: opt.title || 'Не вышло!',
          body: `<p class="big">${opt.icon || '💀'}</p><p>${opt.text || 'Попробуй ещё раз.'}</p>`,
          buttons: [{ text: 'Уровни', cls: 'btn-ghost btn-small', value: 'levels' }, { text: 'Заново', cls: 'btn-primary', value: 'again' }]
        });
        if (my !== session) return;
        if (r === 'again') startLevel(L, true); else showLevels();
      }
    }

    return C;
  }
})();
