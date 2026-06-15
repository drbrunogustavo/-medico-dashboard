const CACHE = "praxis-v1"
const SHELL = ["/", "/manifest.json", "/favicon.svg"]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Network-first: COEP-safe, always fresh content
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return
  const url = new URL(e.request.url)
  // Only cache same-origin requests to stay COEP-safe
  if (url.origin !== location.origin) return
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const clone = r.clone()
        caches.open(CACHE).then((c) => c.put(e.request, clone))
        return r
      })
      .catch(() => caches.match(e.request))
  )
})
