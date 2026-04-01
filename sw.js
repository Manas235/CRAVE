const CACHE_NAME = 'crave-v4';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/cookie3d.js',
    '/assets/baker_image.png',
    '/assets/biscoff_cookie.png',
    '/assets/triple_choc_cookie.png',
    '/assets/smores_cookie.png',
    '/assets/oatmeal_cookie.png',
    '/assets/macadamia_cookie.png',
    '/assets/matcha_cookie.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install: cache all static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')));
        })
    );
    self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch strategy:
// - Supabase API: network first, cache fallback
// - Everything else: cache first, network fallback
self.addEventListener('fetch', event => {
    const url = event.request.url;

    // Skip non-GET and chrome-extension requests
    if (event.request.method !== 'GET' || url.startsWith('chrome-extension')) return;

    if (url.includes('supabase.co')) {
        // Network first for Supabase (live data), cache as fallback
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Cache first for all static assets
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                });
            })
        );
    }
});
