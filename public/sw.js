/* HostSphere PWA Service Worker
 * - App-shell precaching
 * - Cache-first for hashed static assets, stale-while-revalidate for the rest
 * - Network-first for navigations with /offline fallback
 * - API requests are NEVER cached (auth-scoped, per-tenant)
 * - Update flow: SKIP_WAITING message + reload on controllerchange
 * - Web Push notification handlers
 */
const CACHE_VERSION = "v2";
const CACHE_NAME = `hostsphere-app-${CACHE_VERSION}`;
const APP_SHELL = [
  "/",
  "/login",
  "/offline",
  "/manifest.json",
  "/pwa-192.png",
  "/pwa-512.png",
  "/pwa-maskable-512.png",
  "/apple-touch-icon.png",
  "/hostsphere-logo.png",
  "/hostsphere-logo.svg",
];

// Routes that render per-user/tenant data must never be cached.
const AUTHED_PREFIX = "/dashboard";
const AUTHED_ROUTES = ["/api/", "/kiosk/", "/tenants"];

function isAuthScoped(pathname) {
  return (
    pathname.startsWith(AUTHED_PREFIX) ||
    AUTHED_ROUTES.some((p) => pathname.startsWith(p))
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        // Tolerant precache — one failed asset must not reject the whole install.
        Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ──────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API responses — they are auth-scoped and per-tenant.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, fall back to cache, then to the offline page.
  if (request.mode === "navigate") {
    const authScoped = isAuthScoped(url.pathname);
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache public, unauthenticated pages. Auth-scoped pages
          // (dashboard, kiosk, tenants) contain per-user data and must
          // never be served to a later offline session.
          if (!authScoped && response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          if (authScoped) {
            // Never fall back to stale user data — show the offline page.
            return (await caches.match("/offline")) || caches.match("/");
          }
          const cached = await caches.match(request);
          if (cached) return cached;
          return (await caches.match("/offline")) || caches.match("/");
        })
    );
    return;
  }

  // Hashed build assets (_next/static): cache-first (immutable).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Everything else same-origin (images, fonts, etc.): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// ── Update flow ─────────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Web Push ────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "HostSphere", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "HostSphere";
  const options = {
    body: data.body || "",
    icon: data.icon || "/pwa-192.png",
    badge: "/pwa-192.png",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client && target) client.navigate(target);
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      })
  );
});
