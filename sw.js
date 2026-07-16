/* CONE CREW — service worker: cache-first so the booth survives bad venue wifi */
const CACHE = 'cone-crew-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/util.js',
  './js/i18n.js',
  './js/audio.js',
  './js/sprites.js',
  './js/cone.js',
  './js/fx.js',
  './js/scenes.js',
  './js/ui.js',
  './js/menu.js',
  './js/stage1.js',
  './js/stage2.js',
  './js/stage3.js',
  './js/main.js',
  './assets/icon.svg',
  './assets/revo-42-r2.jpg',
  './assets/img/cone.png',
  './assets/img/truck.png',
  './assets/img/logo.png',
  './assets/img/bg-menu.jpg',
  './assets/img/bg-dusk.jpg',
  './assets/img/bg-night.jpg',
  './assets/img/bg-depot.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit ||
      fetch(e.request).then((res) => {
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit)
    )
  );
});
