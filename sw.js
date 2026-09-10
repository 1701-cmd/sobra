const CACHE_NAME = "sobra-offline-v2";

const APP_SHELL = [
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

const EXTRA = [
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
];

async function putAll(cache, urls) {
  for (const url of urls) {
    try {
      await cache.add(url);
    } catch (err) {
      // Um arquivo falhou; não impede o restante do cache.
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await putAll(cache, APP_SHELL);
    await putAll(cache, EXTRA);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (err) {
      if (request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html")) {
        const page = await caches.match("./index.html");
        if (page) return page;
      }
      throw err;
    }
  })());
});
