// ZEMI Service Worker — cache + offline + push
const VERSION = "zemi-v3";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const HTML_CACHE = `${VERSION}-html`;

const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.jpg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Strategy:
//  - HTML navigations: NetworkFirst (timeout) -> cached -> offline shell
//  - Same-origin static (JS/CSS/img/font): StaleWhileRevalidate
//  - Supabase API: NetworkFirst with short cache for GETs
//  - Other: passthrough
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never intercept internal OAuth or auth callbacks
  if (url.pathname.startsWith("/~oauth")) return;

  // HTML navigations
  if (req.mode === "navigate") {
    event.respondWith(networkFirstHTML(req));
    return;
  }

  // Same-origin static
  if (url.origin === self.location.origin) {
    if (/\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)) {
      event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
      return;
    }
  }

  // Supabase REST GETs (non-realtime)
  if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/")) {
    event.respondWith(networkFirstAPI(req));
    return;
  }
});

async function networkFirstHTML(req) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const fresh = await Promise.race([
      fetch(req),
      new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 3500)),
    ]);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    const shell = await caches.match("/");
    if (shell) return shell;
    return new Response("<h1>Offline</h1><p>Konekte sou entènèt pou kontinye.</p>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 503,
    });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirstAPI(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(req);
    if (fresh.status === 200) cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw new Error("offline-and-no-cache");
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "ZEMI", body: event.data?.text() || "" }; }
  const title = data.title || "ZEMI";
  const options = {
    body: data.body || "",
    icon: "/favicon.jpg",
    badge: "/favicon.jpg",
    data: { url: data.url || "/" },
    tag: data.tag || "zemi",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
