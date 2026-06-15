const CACHE = 'netlet-v1';
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
    // Network-first for Supabase API calls
    if (e.request.url.includes('supabase')) {
        e.respondWith(fetch(e.request).catch(() => new Response('[]', { headers: { 'Content-Type': 'application/json' } })));
        return;
    }
    // Cache-first for everything else
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
