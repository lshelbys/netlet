const CACHE = 'netlet-v4';
const PRECACHE = [
    './logo.png', './inventory.js', './utils.js', './cart.js',
    './product.js', './deals.js', './wishlist.js', './IMG_1342.jpeg'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    const url = e.request.url;
    const dest = e.request.destination;

    // Network-first for Supabase DATA API calls only (not CDN scripts)
    if (url.includes('.supabase.co') && dest !== 'script') {
        e.respondWith(
            fetch(e.request).catch(() =>
                new Response('[]', { headers: { 'Content-Type': 'application/json' } })
            )
        );
        return;
    }

    // External CDN: network-first, no cache storage
    if (!url.startsWith(self.location.origin)) {
        e.respondWith(fetch(e.request).catch(() => Response.error()));
        return;
    }

    // HTML pages: network-first so changes are always picked up immediately,
    // fall back to cached version when offline
    if (dest === 'document') {
        e.respondWith(
            fetch(e.request).then(res => {
                if (res.ok) {
                    const clone = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, clone));
                }
                return res;
            }).catch(() => caches.match(e.request))
        );
        return;
    }

    // Cache-first for all other same-origin assets (JS, CSS, images, fonts)
    e.respondWith(
        caches.match(e.request).then(cached =>
            cached || fetch(e.request).then(res => {
                if (res.ok) {
                    const clone = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, clone));
                }
                return res;
            })
        )
    );
});
