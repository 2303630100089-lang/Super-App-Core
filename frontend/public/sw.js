// SuperApp Service Worker — offline support, caching, and background sync
// Cache version — bump this string whenever you deploy new static assets
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `superapp-static-${CACHE_VERSION}`;
const API_CACHE = `superapp-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `superapp-images-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/login',
  '/register',
  '/offline',
];

// API paths that can be served from cache when offline (stale-while-revalidate)
const CACHEABLE_API_PATTERNS = [
  /\/api\/users\/profile\//,
  /\/api\/social\/feed/,
  /\/api\/notifications\//,
  /\/api\/marketplace\//,
  /\/api\/food\/restaurants/,
  /\/api\/rides\/nearby/,
  /\/api\/professional\//,
  /\/api\/dating\//,
  /\/api\/productivity\//,
  /\/api\/search\//,
];

// ── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Pre-cache known pages; failures are silently ignored so the SW still installs
      return Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url).catch(() => null)));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !validCaches.includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // ── API requests: network-first, fall back to cache ──────────────────────
  if (url.pathname.startsWith('/api/') || isExternalApi(url)) {
    if (CACHEABLE_API_PATTERNS.some((p) => p.test(url.pathname))) {
      event.respondWith(networkFirstWithCache(request, API_CACHE));
    }
    return;
  }

  // ── Images: cache-first with network fallback ──────────────────────────────
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE));
    return;
  }

  // ── Navigation requests: network-first, offline fallback ─────────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline')))
    );
    return;
  }

  // ── Static assets (_next/static): cache-first ────────────────────────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
    return;
  }

  // Default: stale-while-revalidate for other same-origin requests
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// ── Strategies ───────────────────────────────────────────────────────────────

/** Network first → cache on success, serve cache on failure */
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(
      JSON.stringify({ error: 'Offline — cached data unavailable', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/** Cache first → network on miss */
async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('', { status: 503 });
  }
}

/** Stale-while-revalidate */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(() => null);
  return cached || fetchPromise || new Response('', { status: 503 });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function isImageRequest(request) {
  const accept = request.headers.get('accept') || '';
  return accept.includes('image') || /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?|$)/.test(request.url);
}

function isExternalApi(url) {
  // Match localhost API gateway and common prod hostname suffixes
  // Use endsWith for domain suffix checks to avoid substring-match bypass
  return (url.hostname === 'localhost' && url.port === '5050') ||
    url.hostname.endsWith('.insforge.app') || url.hostname === 'insforge.app' ||
    url.hostname.endsWith('.railway.app') || url.hostname === 'railway.app' ||
    url.hostname.endsWith('.render.com') || url.hostname === 'render.com';
}

// ── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: 'SuperApp', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'SuperApp', {
      body: payload.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
      actions: payload.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/notifications';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
