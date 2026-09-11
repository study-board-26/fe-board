/* オフラインでも開けるようにする。ネットワーク優先・失敗したらキャッシュ。 */
var C = 'fe-board-v5';
var ASSETS = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(C)
    .then(function (c) { return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () {}); })); })
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys()
    .then(function (ks) { return Promise.all(ks.map(function (k) { return k === C ? null : caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  if (new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.status === 200 && res.type === 'basic') {
      var cp = res.clone(); caches.open(C).then(function (c) { c.put(r, cp); });
    }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) {
      if (m) return m;
      if (r.mode === 'navigate') return caches.match('./index.html');
      return new Response('', { status: 504 });
    });
  }));
});
