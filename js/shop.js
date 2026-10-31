/* =========================================================
   Лавка ведьмы (магазин за жетоны) и «Мой дом» (расстановка)
   ========================================================= */
(function () {
  'use strict';

  const ITEMS = () => G.items.list;
  const byId = id => G.items.byId[id];
  const owned = id => G.state.owned[id] || 0;
  const placedCount = id => G.state.placed.filter(p => p.id === id).length;
  const ratio = it => {
    if (it._ratio) return it._ratio;
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(it.art);
    it._ratio = m ? (+m[2]) / (+m[1]) : 1;
    return it._ratio;
  };

  /* ============================ МАГАЗИН ============================ */
  let tab = 'all';
  const GREETINGS = [
    'Заходи, путник! Для дома у меня найдётся что-нибудь жуткое.',
    'Жетоны звенят, а мебель сама не купится!',
    'Паутина бесплатно, остальное за жетоны.',
    'Кот одобряет эту покупку. Он всегда одобряет дорогие.',
    'Для идеального дома не хватает только тыквы. Или двух.'
  ];

  G.shop = {
    enter: function () { renderShop(); },
    leave: function () { }
  };

  function renderShop() {
    if (G.tex) G.tex.install();            // текстуры мебели (js/textures.js)
    const sc = G.$('#screen-shop');
    const keep = G.$('.shop-grid', sc) ? G.$('.shop-grid', sc).scrollTop : 0;
    const list = ITEMS().filter(i => tab === 'all' || i.cat === tab).sort((a, b) => a.price - b.price);
    const tabBtn = (id, label) => `<button class="tab ${tab === id ? 'on' : ''}" data-tab="${id}" type="button">${label}</button>`;
    sc.innerHTML = `
      <div class="game-col shop">
        <div class="shop-head panel">
          <div class="keeper">🧙</div>
          <div class="speech">${G.pick(GREETINGS)}</div>
          <button class="btn btn-small btn-purple" id="shop-home" type="button">🏠 Мой дом</button>
        </div>
        <div class="tabs">${tabBtn('all', 'Всё')}${tabBtn('furniture', '🛋️ Мебель')}${tabBtn('decor', '🕯️ Украшения')}</div>
        <div class="shop-grid">
          ${list.map(it => {
            const have = owned(it.id), afford = G.state.tokens >= it.price;
            return `<div class="card ${afford ? '' : 'poor'}" data-id="${it.id}">
              ${have ? `<span class="badge">×${have}</span>` : ''}
              <div class="card-art">${it.art}</div>
              <div class="card-name">${it.name}</div>
              <div class="card-slot">${G.items.slotLabel[it.slot]}</div>
              <button class="btn btn-small ${afford ? 'btn-green' : ''}" data-buy="${it.id}" type="button" ${afford ? '' : 'disabled'}>${G.coin('sm')} ${it.price}</button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    G.$$('.tab', sc).forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; G.sfx('click'); renderShop(); }));
    G.$('#shop-home').addEventListener('click', () => { G.sfx('click'); G.go('home'); });
    G.$$('[data-buy]', sc).forEach(b => b.addEventListener('click', () => buy(b.dataset.buy, b)));
    const grid = G.$('.shop-grid', sc);
    if (grid) grid.scrollTop = keep;
  }

  function buy(id, btn) {
    const it = byId(id);
    if (!it) return;
    if (!G.spend(it.price)) return;
    G.state.owned[id] = owned(id) + 1;
    G.save();
    G.sfx('buy');
    const r = btn.getBoundingClientRect();
    G.burst(r.left + r.width / 2, r.top, ['✨', '🎃', '⭐'], 8, 70);
    G.toast(`Куплено: ${it.name}. Поставь в доме 🏠`, 2200);
    renderShop();
  }

  /* ============================== ДОМ ============================== */
  let sel = null;       // выбранный uid
  let drag = null;

  G.home = {
    enter: function () {
      sel = null;
      if (G.tex) G.tex.install();
      const sc = G.$('#screen-home');
      sc.innerHTML = `
        <div class="game-col home">
          <div class="home-top">
            <div class="muted home-hint">Расставляй мебель и украшения как хочешь</div>
            <div class="home-btns">
              <button class="btn btn-small btn-purple" id="home-shop" type="button">🛒 Лавка</button>
              <button class="btn btn-small btn-ghost" id="home-clear" type="button">Убрать всё</button>
            </div>
          </div>
          <div class="room" id="room">
            <div class="room-wall"></div><div class="room-floor"></div><div class="room-board"></div>
            <div class="room-items" id="room-items"></div>
            <div class="room-empty" id="room-empty">Комната пуста. Загляни в лавку ведьмы и купи мебель 🛒</div>
          </div>
          <div class="home-tools panel" id="home-tools"></div>
          <div class="inv" id="inv"></div>
        </div>`;
      G.$('#home-shop').addEventListener('click', () => { G.sfx('click'); G.go('shop'); });
      G.$('#home-clear').addEventListener('click', clearAll);
      const room = G.$('#room');
      if (G.tex) {   // обои, пол и плинтус рисует код (js/textures.js)
        room.style.setProperty('--wall', 'url(' + G.tex.roomUrl('wallpaper') + ')');
        room.style.setProperty('--floor', 'url(' + G.tex.roomUrl('floor') + ')');
        room.style.setProperty('--board', 'url(' + G.tex.roomUrl('board') + ')');
      }
      room.addEventListener('pointerdown', ev => {
        if (ev.target.closest('.hitem')) return;
        select(null);
      });
      renderRoom(); renderInv(); renderTools();
    },
    leave: function () { endDrag(); }
  };

  function geom(p) {
    const it = byId(p.id);
    const wPct = it.w * (p.s || 1);
    const hPct = wPct * ratio(it) * 1.6;        // комната 16:10
    return { it, wPct, hPct };
  }
  function clampItem(p) {
    const { it, hPct } = geom(p);
    p.x = G.clamp(p.x, 3, 97);
    if (it.slot === 'floor') {
      let bottom = p.y + hPct / 2;
      bottom = G.clamp(bottom, it.flat ? 70 : 64, 98);
      p.y = bottom - hPct / 2;
    } else if (it.slot === 'wall') {
      const lo = 3 + hPct / 2, hi = Math.max(lo, 60 - hPct / 2);
      p.y = G.clamp(p.y, lo, hi);
    } else {
      const lo = hPct / 2, hi = Math.max(lo, 32);
      p.y = G.clamp(p.y, lo, hi);
    }
  }
  function zOf(p) {
    const { it, hPct } = geom(p);
    if (it.flat) return 1;
    if (it.slot === 'wall') return 2;
    if (it.slot === 'ceiling') return 3;
    return 10 + Math.round((p.y + hPct / 2) * 10);
  }

  function renderRoom() {
    const wrap = G.$('#room-items');
    wrap.innerHTML = '';
    G.state.placed.forEach(p => {
      const { it, wPct } = geom(p);
      const d = G.el('div', 'hitem' + (p.uid === sel ? ' sel' : ''), it.art);
      d.dataset.uid = p.uid;
      d.style.width = wPct + '%';
      d.style.left = p.x + '%';
      d.style.top = p.y + '%';
      d.style.zIndex = zOf(p);
      d.style.setProperty('--flip', p.f ? -1 : 1);
      d.addEventListener('pointerdown', ev => startDrag(ev, p));
      d.title = it.name;
      wrap.appendChild(d);
    });
    G.$('#room-empty').style.display = G.state.placed.length ? 'none' : 'grid';
  }
  function updateItemEl(p) {
    const d = G.$(`.hitem[data-uid="${p.uid}"]`);
    if (!d) return;
    const { wPct } = geom(p);
    d.style.width = wPct + '%';
    d.style.left = p.x + '%';
    d.style.top = p.y + '%';
    d.style.zIndex = zOf(p);
    d.style.setProperty('--flip', p.f ? -1 : 1);
  }

  function renderInv() {
    const inv = G.$('#inv');
    const mine = ITEMS().filter(i => owned(i.id) > 0);
    if (!mine.length) {
      inv.innerHTML = `<div class="inv-empty panel">Сумка пуста. В <b>Лавке ведьмы</b> можно купить мебель и украшения за жетоны 🎃</div>`;
      return;
    }
    inv.innerHTML = `<div class="inv-row">${mine.map(it => {
      const left = owned(it.id) - placedCount(it.id);
      return `<button class="inv-card ${left <= 0 ? 'none' : ''}" data-id="${it.id}" type="button" title="${it.name}">
        <span class="inv-art">${it.art}</span><small>${it.name}</small><b>${left}</b></button>`;
    }).join('')}</div>`;
    G.$$('.inv-card', inv).forEach(b => b.addEventListener('click', () => addToRoom(b.dataset.id)));
  }

  function renderTools() {
    const t = G.$('#home-tools');
    const p = G.state.placed.find(x => x.uid === sel);
    if (!p) {
      t.innerHTML = `<span class="muted">Нажми на предмет в сумке, чтобы поставить его в комнату. Перетаскивай предметы пальцем или мышью.</span>`;
      return;
    }
    const it = byId(p.id);
    t.innerHTML = `<b class="tool-name">${it.name}</b>
      <button class="btn btn-small btn-ghost" data-act="flip" type="button" title="Отразить">↔</button>
      <button class="btn btn-small btn-ghost" data-act="minus" type="button" title="Меньше">➖</button>
      <button class="btn btn-small btn-ghost" data-act="plus" type="button" title="Больше">➕</button>
      <button class="btn btn-small btn-purple" data-act="remove" type="button">В сумку</button>`;
    G.$$('[data-act]', t).forEach(b => b.addEventListener('click', () => act(b.dataset.act)));
  }

  function select(uid) {
    sel = uid;
    G.$$('.hitem').forEach(d => d.classList.toggle('sel', +d.dataset.uid === uid));
    renderTools();
  }

  function addToRoom(id) {
    const it = byId(id);
    if (owned(id) - placedCount(id) <= 0) { G.sfx('bad'); G.toast('Все такие предметы уже в комнате'); return; }
    const p = { uid: G.state.uid++, id, x: 25 + G.rand(50), y: it.slot === 'floor' ? 80 : it.slot === 'wall' ? 30 : 12, s: 1, f: 0 };
    clampItem(p);
    G.state.placed.push(p);
    G.save();
    G.sfx('place');
    renderRoom(); renderInv();
    select(p.uid);
    const d = G.$(`.hitem[data-uid="${p.uid}"]`);
    if (d) d.classList.add('pop');
  }

  function act(a) {
    const p = G.state.placed.find(x => x.uid === sel);
    if (!p) return;
    if (a === 'flip') p.f = p.f ? 0 : 1;
    else if (a === 'plus') p.s = Math.min(1.8, +(p.s + 0.15).toFixed(2));
    else if (a === 'minus') p.s = Math.max(0.5, +(p.s - 0.15).toFixed(2));
    else if (a === 'remove') {
      G.state.placed = G.state.placed.filter(x => x.uid !== p.uid);
      G.save(); G.sfx('click');
      sel = null;
      renderRoom(); renderInv(); renderTools();
      return;
    }
    clampItem(p);
    G.save(); G.sfx('click');
    updateItemEl(p);
  }

  async function clearAll() {
    if (!G.state.placed.length) return;
    const r = await G.modal({
      title: 'Убрать всё?', body: '<p>Все предметы вернутся в сумку. Они не пропадут.</p>',
      buttons: [{ text: 'Отмена', cls: 'btn-ghost btn-small', value: false }, { text: 'Убрать', cls: 'btn-purple', value: true }]
    });
    if (!r) return;
    G.state.placed = []; sel = null;
    G.save(); renderRoom(); renderInv(); renderTools();
  }

  /* ---------- перетаскивание в комнате ---------- */
  function startDrag(ev, p) {
    ev.preventDefault();
    ev.stopPropagation();
    select(p.uid);
    const room = G.$('#room').getBoundingClientRect();
    drag = { p, room, dx: ev.clientX - (room.left + p.x / 100 * room.width), dy: ev.clientY - (room.top + p.y / 100 * room.height), moved: false };
    window.addEventListener('pointermove', onDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    G.sfx('pick');
  }
  function onDrag(ev) {
    if (!drag) return;
    const { p, room } = drag;
    p.x = (ev.clientX - drag.dx - room.left) / room.width * 100;
    p.y = (ev.clientY - drag.dy - room.top) / room.height * 100;
    clampItem(p);
    drag.moved = true;
    updateItemEl(p);
  }
  function endDrag() {
    window.removeEventListener('pointermove', onDrag);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    if (drag) {
      if (drag.moved) { G.save(); G.sfx('place'); }
      drag = null;
    }
  }
})();
