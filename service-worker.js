/* =====================================================
   GRANDMA'S ALPHABET BOOK
   SERVICE WORKER
   VERSION 2.6.0
   ===================================================== */

const CACHE_NAME =
    "grandmas-alphabet-book-v2.6.0";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css?v=260",
    "./app.js?v=260",
    "./manifest.json",

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
   Remove old versions of the cache.
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

                                return undefined;
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
   Use the newest network version when available.
   Fall back to the saved offline version.
   ===================================================== */

self.addEventListener(
    "fetch",
    (event) => {
        const request = event.request;

        if (
            request.method !== "GET"
        ) {
            return;
        }

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
                    .catch(() => {
                        return caches.match(
                            "./index.html"
                        );
                    })
            );

            return;
        }

        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (
                        !response ||
                        response.status !== 200 ||
                        response.type === "opaque"
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
   MESSAGE
   Allow the app to activate an updated worker.
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


/* =====================================================
   GRANDMA'S ALPHABET BOOK
   SERVICE WORKER VERSION 2.6.0
   END OF FILE
   ===================================================== */