/* =========================================================
   «Хранитель правил»: движок головоломки и уровни (без DOM).
   Законы читаются с поля: слово-существительное, слово «ЭТО» и слово-свойство
   подряд слева направо или сверху вниз. Слова можно толкать.
   Файл работает и в браузере, и в Node (для проверки решаемости уровней).
   ========================================================= */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.G) root.G.rkEngine = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* Буквы в карте уровня:
     предметы   G призрак, D дверь, C гроб, F огонь, P тыква
     слова      g d c f p  (названия тех же предметов), = «ЭТО»,
                y ТЫ, w ПОБЕДА, s СТОП, x ОПАСНО, u ТОЛКАЙ */
  const OBJS = { G: 'ghost', D: 'door', C: 'coffin', F: 'fire', P: 'pumpkin' };
  const NOUNS = { g: 'ghost', d: 'door', c: 'coffin', f: 'fire', p: 'pumpkin' };
  const PROPS = { y: 'you', w: 'win', s: 'stop', x: 'deadly', u: 'push' };
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };

  const LEVELS = [
    {
      name: 'Дверь', tip: 'Проведи призрака к двери. Двигай пальцем по полю или кнопками.',
      map: [
        'g=y.d=w.',
        '........',
        '........',
        'G......D',
        '........',
        '........'
      ]
    },
    {
      name: 'Огонь не пустит', tip: 'Огонь убивает. Но закон «ОГОНЬ ЭТО ОПАСНО» можно сломать: вытолкни слово из ряда.',
      map: [
        '....F...',
        '.f=xF...',
        '....F..D',
        'G...F...',
        '....F...',
        'g=y.Fd=w'
      ]
    },
    {
      name: 'Гробы-стражи', tip: 'Законы можно читать и сверху вниз. Сломай закон про гробы.',
      map: [
        'g=y.Cd=w',
        '.c..C...',
        '.=..C...',
        '.s..C..D',
        'G...C...',
        '....C...'
      ]
    },
    {
      name: 'Новый закон', tip: 'Дверь не побеждает: такого закона нет. Составь «ДВЕРЬ ЭТО ПОБЕДА».',
      map: [
        'd=......',
        '........',
        '.......D',
        '.....w..',
        'G.......',
        'g=y.....'
      ]
    },
    {
      name: 'Другая победа', tip: 'К двери не пройти. А что, если победой станет что-то другое?',
      map: [
        'g=y.Cc=s',
        '....C...',
        '....C.D.',
        '....CCCC',
        '.pd=w...',
        'G......P'
      ]
    },
    {
      name: 'Я победа', tip: 'Одно слово может быть сразу в двух законах: и по горизонтали, и по вертикали.',
      map: [
        'g=y.....',
        '........',
        '........',
        '...=.w..',
        'G.......',
        '.....D..'
      ]
    },
    {
      name: 'Смена героя', tip: 'Призраку не перейти огонь. Но управлять можно и не призраком.',
      map: [
        '....Ff=x',
        '.g=yF...',
        '....F..D',
        '.p..F...',
        'G...F...',
        '....FP..',
        '....Fd=w'
      ]
    },
    {
      name: 'Хранитель правил', tip: 'Главное испытание. Используй всё, чему научился. Дальше ждут тайные уровни.',
      map: [
        '...FDf=x',
        'g=yF.d=.',
        '...F...w',
        'p..FCCCC',
        '...F....',
        '...F.c=s',
        '..GF.P..'
      ]
    },
    /* ----- Тайные уровни: новый закон ТОЛКАЙ. Слова в углах поля никуда не сдвинуть, зато их можно читать и вниз. ----- */
    {
      name: 'Тележка', tip: 'Гробы стоят стеной, а слово ТОЛКАЙ превращает предмет в тележку. Составь «ГРОБ ЭТО ТОЛКАЙ»: читай закон сверху вниз.',
      map: [
        'c=s.Cd=w',
        '..=.C...',
        '..u.C...',
        '....C..D',
        '...GC...',
        'g=y.C...'
      ]
    },
    {
      name: 'Огонь на колёсах', tip: 'Огонь опасен, но если «ОГОНЬ ЭТО ТОЛКАЙ», его можно отодвинуть и не сгореть.',
      map: [
        'f...Fd=w',
        '=.=.F...',
        'x.u.F...',
        '....F..D',
        '...GF...',
        'g=y.F...'
      ]
    },
    {
      name: 'Дверь без закона', tip: 'Двери нечем победить, а гробы мешают. Нужны сразу два закона, и один из них придётся дописать прямо в стене.',
      map: [
        'c=s.C...',
        '.G..C...',
        '..=.C...',
        'u.d=C..D',
        '....C...',
        'g=ywC...'
      ]
    },
    {
      name: 'Хранитель правил II', tip: 'Две стены: огонь и гробы. Закон можно составить, воспользоваться им и сломать снова.',
      map: [
        'c=s..d=w',
        '=.GF.C..',
        '.=.F.C.D',
        'f.uF.C..',
        '=.uF.C..',
        'x..F.g=y'
      ]
    }
  ];

  /* Основные уровни кончаются на этом номере: после него открывается следующая локация.
     Уровни дальше (тайные) проходить не обязательно. */
  const STORY_END = 8;

  /* ---------- Разбор карты ---------- */
  function parse(rows) {
    const h = rows.length, w = rows[0].length, e = [];
    let id = 1;
    rows.forEach((row, y) => {
      if (row.length !== w) throw new Error('Разная ширина строк: ' + row);
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        if (OBJS[ch]) e.push({ id: id++, t: 'o', k: OBJS[ch], x, y });
        else if (NOUNS[ch]) e.push({ id: id++, t: 'n', k: NOUNS[ch], x, y });
        else if (ch === '=') e.push({ id: id++, t: 'i', k: 'is', x, y });
        else if (PROPS[ch]) e.push({ id: id++, t: 'p', k: PROPS[ch], x, y });
        else throw new Error('Неизвестный символ «' + ch + '»');
      }
    });
    return { w, h, e };
  }
  const clone = st => ({ w: st.w, h: st.h, e: st.e.map(o => ({ id: o.id, t: o.t, k: o.k, x: o.x, y: o.y })) });

  /* ---------- Законы ---------- */
  function rulesOf(st) {
    const w = st.w, size = w * st.h;
    const N = new Array(size).fill(null), I = new Array(size).fill(null), Pp = new Array(size).fill(null);
    for (const o of st.e) {
      const k = o.y * w + o.x;
      if (o.t === 'n') { if (!N[k]) N[k] = o; }
      else if (o.t === 'i') { if (!I[k]) I[k] = o; }
      else if (o.t === 'p') { if (!Pp[k]) Pp[k] = o; }
    }
    const out = [];
    for (let y = 0; y < st.h; y++) for (let x = 0; x < w; x++) {
      const n = N[y * w + x];
      if (!n) continue;
      // вправо
      if (x + 2 < w) {
        const i = I[y * w + x + 1], p = Pp[y * w + x + 2];
        if (i && p) out.push({ noun: n.k, prop: p.k, ids: [n.id, i.id, p.id] });
      }
      // вниз
      if (y + 2 < st.h) {
        const i = I[(y + 1) * w + x], p = Pp[(y + 2) * w + x];
        if (i && p) out.push({ noun: n.k, prop: p.k, ids: [n.id, i.id, p.id] });
      }
    }
    return out;
  }
  function propsOf(rules) {
    const P = {};
    rules.forEach(r => { (P[r.noun] || (P[r.noun] = {}))[r.prop] = true; });
    return P;
  }
  const has = (P, k, prop) => !!(P[k] && P[k][prop]);
  const isPush = (q, P) => q.t !== 'o' || has(P, q.k, 'push');
  const isStop = (q, P) => q.t === 'o' && has(P, q.k, 'stop') && !has(P, q.k, 'push');

  /* ---------- Ход ---------- */
  /* Что нужно сдвинуть, чтобы освободить клетку (x,y) при движении в сторону (dx,dy).
     null: путь закрыт (край поля или СТОП). */
  function shove(s, x, y, dx, dy, P, self) {
    const chain = [];
    for (;;) {
      if (x < 0 || y < 0 || x >= s.w || y >= s.h) return null;
      let any = false;
      for (const q of s.e) {
        if (q === self || q.x !== x || q.y !== y) continue;
        if (isPush(q, P)) { chain.push(q); any = true; }
        else if (isStop(q, P)) return null;
      }
      if (!any) return chain;
      x += dx; y += dy;
    }
  }
  function tryMove(s, o, dx, dy, P) {
    const nx = o.x + dx, ny = o.y + dy;
    const chain = shove(s, nx, ny, dx, dy, P, o);
    if (!chain) return false;
    chain.forEach(q => { q.x += dx; q.y += dy; });
    o.x = nx; o.y = ny;
    return true;
  }

  /* step: один ход в направлении dir ('U','D','L','R').
     Возвращает { st, moved, won, died:[id], noYou, rules }. */
  function step(st, dir) {
    const [dx, dy] = DIRS[dir];
    const rules0 = st._r || (st._r = rulesOf(st));   // законы состояния запоминаем: поиск вызывает step много раз для одного состояния
    const P = propsOf(rules0);
    const youIds = new Set(st.e.filter(o => o.t === 'o' && has(P, o.k, 'you')).map(o => o.id));
    if (!youIds.size) return { st, moved: false, noYou: true, rules: rules0 };
    const s = clone(st);
    let moved = false;
    s.e.filter(o => youIds.has(o.id)).forEach(o => { if (tryMove(s, o, dx, dy, P)) moved = true; });
    if (!moved) return { st, moved: false, rules: rules0 };

    const rules = rulesOf(s), P2 = propsOf(rules);
    s._r = rules;
    const died = [];
    const before = s.e;
    s.e = before.filter(o => {
      if (o.t === 'o' && has(P2, o.k, 'you')) {
        const hit = has(P2, o.k, 'deadly') ||
          before.some(q => q !== o && q.t === 'o' && q.x === o.x && q.y === o.y && has(P2, q.k, 'deadly'));
        if (hit) { died.push(o.id); return false; }
      }
      return true;
    });
    const yous = s.e.filter(o => o.t === 'o' && has(P2, o.k, 'you'));
    const won = yous.some(o => s.e.some(q => q.t === 'o' && q.x === o.x && q.y === o.y && has(P2, q.k, 'win')));
    return { st: s, moved: true, won, died, noYou: yous.length === 0, rules };
  }

  /* ---------- Решатель (поиск в ширину) ---------- */
  /* Ключ состояния: предметы одного вида неразличимы, поэтому сортируем числа, а не строки (так в разы быстрее). */
  const TID = {};
  let tidN = 0;
  const key = st => {
    const a = new Array(st.e.length);
    for (let i = 0; i < a.length; i++) {
      const o = st.e[i], tk = o.t + o.k;
      const t = TID[tk] || (TID[tk] = ++tidN);
      a[i] = t * 10000 + o.y * 100 + o.x;
    }
    return a.sort((p, q) => p - q).join(',');
  };
  function makeSearch(st) {
    const seen = new Set([key(st)]);
    const nodes = [{ st, parent: -1, d: '' }];
    let i = 0;
    /* Один шаг поиска: раскрыть узел i. Возвращает путь, если нашли победу, иначе null. */
    const expand = () => {
      const cur = nodes[i++];
      for (const d of 'UDLR') {
        const r = step(cur.st, d);
        if (!r.moved) continue;
        if (r.won) {
          let path = d, n = cur;
          while (n.parent >= 0) { path = n.d + path; n = nodes[n.parent]; }
          return path;
        }
        if (r.noYou) continue;
        const k = key(r.st);
        if (seen.has(k)) continue;
        seen.add(k);
        nodes.push({ st: r.st, parent: i - 1, d });
      }
      return null;
    };
    return { nodes, expand, get i() { return i; } };
  }
  /* Возвращает строку ходов, например 'RRUL', или null. Блокирует поток: для игры есть solveAsync. */
  function solve(st, maxNodes) {
    maxNodes = maxNodes || 300000;
    const S = makeSearch(st);
    while (S.i < S.nodes.length && S.i < maxNodes) {
      const path = S.expand();
      if (path) return path;
    }
    return null;
  }
  /* То же самое, но думает кусочками по sliceMs миллисекунд и отдаёт управление браузеру между ними,
     так что игра не замирает. cancelled(): вернуть true, чтобы бросить поиск (тогда результат undefined). */
  function solveAsync(st, maxNodes, sliceMs, cancelled) {
    maxNodes = maxNodes || 300000;
    sliceMs = sliceMs || 8;
    return new Promise(resolve => {
      const S = makeSearch(st);
      const run = () => {
        const t0 = Date.now();
        while (S.i < S.nodes.length && S.i < maxNodes) {
          const path = S.expand();
          if (path) { resolve(path); return; }
          if ((S.i & 31) === 0 && Date.now() - t0 > sliceMs) {
            if (cancelled && cancelled()) { resolve(undefined); return; }
            setTimeout(run, 0);
            return;
          }
        }
        resolve(null);
      };
      run();
    });
  }

  return { LEVELS, STORY_END, parse, clone, rulesOf, propsOf, step, solve, solveAsync, DIRS, OBJS, NOUNS, PROPS, key };
});
