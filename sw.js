// Înregistrare Service Worker bazat pe căi relative
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  return self.clients.claim();
});

// Permite trecerea tuturor cererilor către rețea (fără caching agresiv)
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});
