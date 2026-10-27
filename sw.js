/* ══════════════════════════════════════════════════════════════
   Tiny Games for Tiny Humans — service worker

   Strategy
   ────────
   • Precache the whole app shell on install, so every page works
     offline after the first visit.
   • Serve same-origin requests stale-while-revalidate: instant load
     from cache, silent refresh in the background.
   • Import the shared game registry so every declared game asset is
     precached without maintaining a second hand-written game list.
   Bump CACHE_VERSION to invalidate every cached asset.
   ══════════════════════════════════════════════════════════════ */

importScripts("./games/registry.js");

const CACHE_VERSION = "v12";
const SHELL_CACHE = `tiny-games-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tiny-games-runtime-${CACHE_VERSION}`;
const CACHE_PREFIX = "tiny-games-";

/* Every URL a page needs to run with no network. Paths are relative to
   the service worker, so the site works from any sub-path too. */
const PRECACHE_URLS = [
  // Hub
  "./",
  "./index.html",
  "./styles.css",
  "./styles.compat.css",
  "./script.js",
  "./pwa.js",
  "./manifest.json",
  "./games/registry.js",
  // Icons
  "./assets/favicon.ico",
  "./assets/favicon-16x16.png",
  "./assets/favicon-32x32.png",
  "./assets/apple-touch-icon.png",
  "./assets/android-chrome-192x192.png",
  "./assets/android-chrome-512x512.png",
  "./assets/maskable-192x192.png",
  "./assets/maskable-512x512.png",
  // Fonts
  "./assets/fonts/fonts.css",
  "./assets/fonts/fredoka-one-400.woff2",
  "./assets/fonts/nunito-variable.woff2",
  ...globalThis.TINY_GAMES_CATALOG.flatMap((game) => game.files),
].filter((url, index, all) => all.indexOf(url) === index);

/* ── install: fill the shell cache ───────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // allSettled: one odd asset must not abort the whole install.
      const results = await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" }))
        )
      );
      results.forEach((result, i) => {
        if (result.status === "rejected") {
          console.warn("[sw] precache miss:", PRECACHE_URLS[i], result.reason);
        }
      });
      await self.skipWaiting();
    })()
  );
});

/* ── activate: drop stale caches, take over open tabs ─────────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith(CACHE_PREFIX) &&
              key !== SHELL_CACHE &&
              key !== RUNTIME_CACHE
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/* ── fetch: cache-first for the shell, network refresh in the back ── */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  const cacheName =
    url.origin === self.location.origin ? SHELL_CACHE : RUNTIME_CACHE;
  event.respondWith(staleWhileRevalidate(request, cacheName));
});

/* Page loads: instant from cache, refreshed in the background. */
async function handleNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });

  const refresh = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const fresh = await refresh;
  if (fresh) return fresh;

  // Offline and this page was never cached — fall back to the hub.
  const hub = await cache.match("./", { ignoreSearch: true });
  return hub || Response.error();
}

/* Assets: serve from cache, update the cache on the side. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const refresh = fetch(request)
    .then((response) => {
      // `opaque` covers no-cors CDN responses; those have ok === false.
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const fresh = await refresh;
  return fresh || Response.error();
}
