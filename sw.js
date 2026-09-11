// workcommand-notes-web — shell-only service worker (Phase 28 §PWA / non-scope: "no offline
// editing... the service worker caches the shell, never notes"). Two separate guarantees keep it
// that way, deliberately redundant, and neither depends on naming any cloud provider's domain
// here (a hostname list would only be able to go stale — the check below cannot):
//   1. Every cloud-provider sign-in and API request is served from a DIFFERENT origin than this
//      page's own, so the cross-origin check a few lines down means the fetch handler never even
//      SEES one, let alone caches it. This is the real guarantee.
//   2. A write (any non-GET request) is never intercepted either, so even a same-origin write
//      path could not be cached by accident.
const CACHE_VERSION = 'wc-notes-shell-v1';
const SHELL_ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // never cache a write
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never cache anything not served by this page

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // /config.json changes when Jordan pastes a client id WITHOUT a rebuild — never cache it,
        // so a stale cache can't hide a real registration.
        if (!url.pathname.endsWith('/config.json') && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    }),
  );
});
