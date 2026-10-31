/* Service worker: кладёт всю игру в кэш браузера, чтобы она открывалась без интернета.
   Обновил игру? Поменяй номер в VERSION, и старый кэш удалится. */
const VERSION = 'halloween-night-v6';

const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'css/base.css', 'css/map.css', 'css/blockblast.css', 'css/hidden.css', 'css/match3.css', 'css/rules.css', 'css/tower.css', 'css/arcade.css',
  'css/mg-swamp.css', 'css/mg-bats.css', 'css/mg-potion.css', 'css/mg-pumpkin.css', 'css/mg-spider.css', 'css/mg-maze.css', 'css/mg-candle.css', 'css/mg-grave.css', 'css/mg-candy.css', 'css/mg-owl.css',
  'css/shop.css', 'css/mobile.css',
  'js/core.js', 'js/items.js', 'js/map.js', 'js/forest-map.js', 'js/blockblast.js', 'js/hidden.js', 'js/hidden-rooms.js', 'js/match3.js',
  'js/rk-engine.js', 'js/rules.js', 'js/tower.js', 'js/art.js', 'js/textures.js', 'js/arcade.js',
  'js/mg-swamp.js', 'js/mg-bats.js', 'js/mg-potion.js', 'js/mg-pumpkin.js', 'js/mg-spider.js', 'js/mg-maze.js', 'js/mg-candle.js', 'js/mg-grave.js', 'js/mg-candy.js', 'js/mg-owl.js',
  'js/shop.js', 'js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    })
  );
});
