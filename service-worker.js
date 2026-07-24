// =====================================================
// Grandma's Alphabet Book
// Version 2.4.0 Service Worker
// =====================================================

"use strict";

const CACHE_NAME =
    "grandmas-alphabet-book-v2-4-0";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css?v=240",
    "./app.js?v=240",
    "./manifest.json"
];

/* =====================================================
   INSTALL
   Save the main app files for offline use.
   ===================================================== */

self.addEventListener(
    "install",
    (event) => {
        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then((cache) => {
                    return cache.addAll(APP_FILES);
                })
        );

        self.skipWaiting();
    }
);

/* =====================================================
   ACTIVATE
   Remove older cached versions.
   ===================================================== */

self.addEventListener(
    "activate",
    (event) => {
        event.waitUntil(
            caches
                .keys()
                .then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map(
                            (cacheName) => {
                                if (
                                    cacheName !==
                                    CACHE_NAME
                                ) {
                                    return caches.delete(
                                        cacheName
                                    );
                                }

                                return null;
                            }
                        )
                    );
                })
                .then(() => {
                    return self.clients.claim();
                })
        );
    }
);

/* =====================================================
   FETCH
   Use the newest online file when available.
   Fall back to the saved offline copy.
   ===================================================== */

self.addEventListener(
    "fetch",
    (event) => {
        if (
            event.request.method !== "GET"
        ) {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    const responseCopy =
                        networkResponse.clone();

                    caches
                        .open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(
                                event.request,
                                responseCopy
                            );
                        });

                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(
                        event.request
                    );
                })
        );
    }
);