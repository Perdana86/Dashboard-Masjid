/* Service Worker for Dashboard Dashboard Masjid PWA
 * - App shell: network-first, offline fallback to cached index
 * - Static assets: stale-while-revalidate
 * - API / PocketBase / external data: network-only (sync stays live online)
 */
const CACHE_VERSION = "masjid-pwa-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isSameOrigin(url) {
  return new URL(url).origin === self.location.origin;
}

// Network-first for navigations (app shell), fallback to cached index when offline.
async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put("/", fresh.clone()).catch(() => {});
    cache.put("/index.html", fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE);
    return (
      (await cache.match(request)) ||
      (await cache.match("/index.html")) ||
      (await cache.match("/")) ||
      Response.error()
    );
  }
}

// Stale-while-revalidate for same-origin static assets.
async function handleAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === "basic") {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

// Cache-first for cross-origin media/fonts, with network fallback.
async function handleCrossOrigin(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API, realtime, or PocketBase data requests — sync must stay live.
  // Using /pb prefix (production standard) instead of Hostinger-specific /hcgi
  if (
    url.pathname.startsWith("/pb/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/api/realtime") ||
    url.pathname.includes("/api/collections/") ||
    url.hostname.includes("pocketbase") ||
    url.hostname.includes("myquran.com")
  ) {
    return; // network-only
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isSameOrigin(request.url)) {
    event.respondWith(handleAsset(request));
    return;
  }

  // Cross-origin: fonts, images, YouTube thumbnails, etc.
  event.respondWith(handleCrossOrigin(request));
});
