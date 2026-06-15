const CACHE = 'netlet-v2';
const PRECACHE = [
    './index.html', './cart.html', './account.html', './product.html',
    './deals.html', './wishlist.html', './orders.html', './about.html',
    './logo.png', './inventory.js', './utils.js', './cart.js',
    './product.js', './deals.js', './wishlist.js'
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
    // Supabase API calls have destination 'empty' (fetch()) not 'script'/'worker'
    if (url.includes('.supabase.co') && dest !== 'script') {
        e.respondWith(
            fetch(e.request).catch(() =>
                new Response('[]', { headers: { 'Content-Type': 'application/json' } })
            )
        );
        return;
    }

    // For external CDN resources (scripts/styles): network-first, no cache storage
    if (!url.startsWith(self.location.origin)) {
        e.respondWith(fetch(e.request).catch(() => Response.error()));
        return;
    }

    // Cache-first for same-origin assets
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
