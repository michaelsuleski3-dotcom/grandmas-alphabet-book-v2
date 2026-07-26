/* =====================================================
   Grandma's Alphabet Book
   Service Worker — Version 2.5.0
   ===================================================== */

"use strict";

const CACHE_NAME =
    "grandmas-alphabet-book-v2-5-1";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css?v=250",
    "./app.js?v=250",
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
                    return cache.addAll(
                        APP_FILES
                    );
                })
                .then(() => {
                    return self.skipWaiting();
                })
        );
    }
);

/* =====================================================
   ACTIVATE

   Remove older versions of the app cache.
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

   HTML pages:
   Try the internet first, then use the saved version.

   App files:
   Use the saved version first, while checking for
   an updated version in the background.

   Other files:
   Try the internet first and save successful responses.
   ===================================================== */

self.addEventListener(
    "fetch",
    (event) => {
        const request =
            event.request;

        if (
            request.method !== "GET"
        ) {
            return;
        }

        const requestUrl =
            new URL(request.url);

        /*
        Page navigation
        */

        if (
            request.mode === "navigate"
        ) {
            event.respondWith(
                fetch(request)
                    .then((response) => {
                        const responseCopy =
                            response.clone();

                        caches
                            .open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(
                                    "./index.html",
                                    responseCopy
                                );
                            });

                        return response;
                    })
                    .catch(async () => {
                        return (
                            await caches.match(
                                "./index.html"
                            )
                        ) || (
                            await caches.match(
                                "./"
                            )
                        );
                    })
            );

            return;
        }

        /*
        Local application files
        */

        if (
            requestUrl.origin ===
            self.location.origin
        ) {
            event.respondWith(
                caches
                    .match(request)
                    .then(
                        (cachedResponse) => {
                            const networkResponse =
                                fetch(request)
                                    .then(
                                        (response) => {
                                            if (
                                                response &&
                                                response.ok
                                            ) {
                                                const responseCopy =
                                                    response.clone();

                                                caches
                                                    .open(
                                                        CACHE_NAME
                                                    )
                                                    .then(
                                                        (cache) => {
                                                            cache.put(
                                                                request,
                                                                responseCopy
                                                            );
                                                        }
                                                    );
                                            }

                                            return response;
                                        }
                                    )
                                    .catch(() => {
                                        return cachedResponse;
                                    });

                            return (
                                cachedResponse ||
                                networkResponse
                            );
                        }
                    )
            );

            return;
        }

        /*
        External resources, including the PDF library
        */

        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (
                        !response ||
                        (
                            !response.ok &&
                            response.type !==
                            "opaque"
                        )
                    ) {
                        return response;
                    }

                    const responseCopy =
                        response.clone();

                    caches
                        .open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(
                                request,
                                responseCopy
                            );
                        });

                    return response;
                })
                .catch(() => {
                    return caches.match(
                        request
                    );
                })
        );
    }
);

/* =====================================================
   UPDATE MESSAGE

   Allows the app to activate a newly installed
   service worker immediately.
   ===================================================== */

self.addEventListener(
    "message",
    (event) => {
        if (
            event.data ===
            "SKIP_WAITING"
        ) {
            self.skipWaiting();
        }
    }
);