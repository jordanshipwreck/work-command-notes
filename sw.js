// workcommand-notes-web — shell-only service worker (Phase 28 §PWA / non-scope: "no offline
// editing... the service worker caches the shell, never notes"). Two separate guarantees keep it
// that way, deliberately redundant, and neither depends on naming any cloud provider's domain
// here (a hostname list would only be able to go stale — the check below cannot):
//   1. Every cloud-provider sign-in and API request is served from a DIFFERENT origin than this
//      page's own, so the cross-origin check a few lines down means the fetch handler never even
//      SEES one, let alone caches it. This is the real guarantee.
//   2. A write (any non-GET request) is never intercepted either, so even a same-origin write
//      path could not be cached by accident.
//   3. Since 2026-09-11 the phone's Google sign-in comes back to THIS page with an access token in
//      the URL **fragment**. A fragment is not part of a request — browsers never send one to a
//      server, and it is stripped from `request.url` before a service worker ever sees it — so by
//      the spec there is nothing here to cache. The check below is belt-and-braces anyway: any
//      request whose URL mentions `access_token` bypasses this worker entirely, and a navigation's
//      response is never written to the cache at runtime (the shell is precached at install from
//      token-free URLs). A cached document carrying somebody's live token is the one thing a
//      shell cache must never contain.
// `scripts/deploy-notes-site.sh` rewrites this exact string to 'wc-notes-shell-<build hash>' on every
// deploy (its "sw.js cache stamp" region), so an installed site drops the old shell. Keep it as is.
const CACHE_VERSION = 'wc-notes-shell-dfce67350d86';
const SHELL_ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // `cache: 'reload'` — past the browser's HTTP cache. A new worker installs right after a deploy,
      // and GitHub Pages lets a page sit in the HTTP cache for minutes: precaching THAT would store the
      // previous index.html, whose hashed JS the deploy has already deleted, and break the site.
      .then((cache) => cache.addAll(SHELL_ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
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
  if (req.url.includes('access_token')) return; // a sign-in's answer: straight to the network, never cached

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // /config.json changes when Jordan pastes a client id WITHOUT a rebuild — never cache it,
        // so a stale cache can't hide a real registration. A navigation's response is never
        // written either: the shell is precached at install, and the page a sign-in returns to is
        // a navigation.
        const cacheable = res.ok && req.mode !== 'navigate' && !url.pathname.endsWith('/config.json');
        if (cacheable) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    }),
  );
});
