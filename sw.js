// Shelby Tracker Service Worker
const VERSION = "v5";
const STATIC_CACHE = `shelby-static-${VERSION}`;
const RUNTIME_CACHE = `shelby-runtime-${VERSION}`;

// Every file that must be available offline, with paths relative to sw.js (project root).
const APP_SHELL = [
    "./index.html",
    "./manifest.json",
    "./pages/GYM.html",
    "./pages/SHELBY_PROGRESS.html",
    "./pages/ANALYTICS.html",
    "./pages/SETTINGS.html",
    "./js/db.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-192-maskable.png",
    "./icons/icon-512-maskable.png"
];

const OFFLINE_URL = "./index.html";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
                    .map((name) => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Navigations: network-first, fall back to cache, then offline shell.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
                )
        );
        return;
    }

    // Same-origin app files: cache-first, refresh in background.
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const fetchPromise = fetch(request)
                    .then((response) => {
                        if (response && response.ok) {
                            const copy = response.clone();
                            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
                        }
                        return response;
                    })
                    .catch(() => cached);
                return cached || fetchPromise;
            })
        );
        return;
    }

    // Cross-origin (e.g. Google Fonts): stale-while-revalidate, best effort.
    event.respondWith(
        caches.match(request).then((cached) => {
            const fetchPromise = fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || fetchPromise;
        })
    );
});
