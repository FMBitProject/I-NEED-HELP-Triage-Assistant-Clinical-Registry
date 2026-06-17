const CACHE = "ineedhelp-v1";

const PRECACHE = ["/dashboard", "/patients", "/triage/new"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache API routes — always go to network
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for Next.js static chunks (content-hashed, safe to cache forever)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            caches.open(CACHE).then((c) => c.put(request, res.clone()));
            return res;
          })
      )
    );
    return;
  }

  // Network-first for everything else; fall back to cache when offline
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.method === "GET") {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            new Response(
              `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Offline – I-NEED-HELP</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}
.box{text-align:center;padding:2rem}.icon{font-size:3rem}.h{font-size:1.25rem;font-weight:700;color:#1e293b;margin:.5rem 0}
.p{color:#64748b;margin:0 0 1.5rem}.btn{background:#1d4ed8;color:#fff;border:none;padding:.75rem 1.5rem;border-radius:.5rem;font-size:1rem;cursor:pointer}
</style></head><body><div class="box"><div class="icon">📡</div>
<p class="h">Tidak ada koneksi</p>
<p class="p">Pastikan perangkat terhubung ke internet,<br>lalu coba lagi.</p>
<button class="btn" onclick="location.reload()">Coba Lagi</button></div></body></html>`,
              { headers: { "Content-Type": "text/html; charset=utf-8" } }
            )
        )
      )
  );
});
