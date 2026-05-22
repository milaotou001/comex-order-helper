const CACHE = "comex-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;

  // navigation → network first, cache fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // static assets → cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((res) => {
        if (res.ok) {
          caches.open(CACHE).then((c) => c.put(event.request, res.clone()));
        }
        return res;
      }).catch(() => cached);

      return cached || fetched;
    })
  );
});
