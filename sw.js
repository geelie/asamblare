// Service Worker Asamblare
// La fiecare modificare a fișierelor aplicației, schimbă numărul versiunii de mai jos.
const VERSION = "asamblare-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.webp",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(CORE))
      .catch(() => {}) // dacă un fișier lipsește, instalarea nu se blochează
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Doar fișierele aplicației și bibliotecile/fonturile din CDN trec prin cache.
// Supabase (API, realtime, storage, poze) merge mereu direct în rețea.
const CDN_HOSTS = [
  "cdn.jsdelivr.net",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];

function putIfOk(req, res) {
  if (res && (res.ok || res.type === "opaque")) {
    const copy = res.clone();
    caches.open(VERSION).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !CDN_HOSTS.includes(url.hostname)) return;

  // Pagina: întâi rețeaua (mereu versiunea nouă), cache doar ca rezervă offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => putIfOk(req, res))
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html"))),
    );
    return;
  }

  // Restul: din cache instant, actualizat în fundal.
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => putIfOk(req, res))
        .catch(() => cached);
      return cached || net;
    }),
  );
});
