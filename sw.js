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
const CACHE_VERSION = 'wc-notes-shell-3a93974586b9';
const SHELL_ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/workcommand-dark-192.png', './icons/workcommand-dark-512.png', './icons/workcommand-maskable-512.png', './icons/workcommand-dark-180.png', './icons/workcommand-light-180.png', './icons/workcommand-dark-32.png', './icons/workcommand-light-32.png', './assets/index-BYnvUKJ5.js', './assets/BrainPage-DM5wm4aD.js', './assets/Button-HGqEy5Xs.js', './assets/Card-uB3LTUio.js', './assets/DayPage-pTKUG3hD.js', './assets/FolderPickPage-1V0I4bA7.js', './assets/HomePage-BvHBwYXJ.js', './assets/PickerPickPage-DLoGxU9f.js', './assets/SettingsPage-6QNvmT6s.js', './assets/Textarea-DNHbceta.js', './assets/dist-Y3dxntgD.js', './assets/offlineBrain-B9_htK87.js', './assets/pageTree-Dj7RdE8g.js', './assets/todo-trash-DS_7tPTf.js', './assets/BrainPage-D2qNnsfj.css', './assets/Button-DBtpkpvq.css', './assets/Card-CXkPMrjZ.css', './assets/DayPage-B9MyCZgS.css', './assets/FolderPickPage-tXu8aNxe.css', './assets/HomePage-BEQG17U-.css', './assets/PickerPickPage-D9psoUf3.css', './assets/SettingsPage-BWDqBdFf.css', './assets/Textarea-c4ojJqM3.css', './assets/index-2sBhiBSX.css', './assets/pageTree-Bkwn31tO.css'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // `cache: 'reload'` — past the browser's HTTP cache. A new worker installs right after a deploy,
      // and GitHub Pages lets a page sit in the HTTP cache for minutes: precaching THAT would store the
      // previous index.html, whose hashed JS the deploy has already deleted, and break the site.
      .then((cache) => cache.addAll(SHELL_ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      // The site's FIRST install takes over at once — there is no page state to protect yet. A NEW
      // version waits: only the page knows whether anything on it is unsaved, so it is the page
      // (src/lib/appUpdate.ts, task 42) that tells this worker to take over, with SKIP_WAITING below.
      .then(() => (self.registration && self.registration.active ? undefined : self.skipWaiting())),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
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
