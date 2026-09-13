const CACHE = 'lastset-v0126-calendar';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './lastset-theme.css',
  './lastset-premium.css',
  './lastset-images.css',
  './lastset-hotfix.css',
  './lastset-calendar.css',
  './lastset-enhancements.js',
  './lastset-premium.js',
  './lastset-hotfix.js',
  './lastset-calendar.js',
  './assets/hero.webp',
  './assets/equipment.webp',
  './assets/home-hero-thiva.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

function enhanceHtml(text) {
  let html = text;
  if (!html.includes('lastset-theme.css')) {
    html = html.replace('</head>', '  <link rel="stylesheet" href="./lastset-theme.css?v=0126">\n  <link rel="stylesheet" href="./lastset-premium.css?v=0126">\n  <link rel="stylesheet" href="./lastset-images.css?v=0126">\n  <link rel="stylesheet" href="./lastset-hotfix.css?v=0126">\n  <link rel="stylesheet" href="./lastset-calendar.css?v=0126">\n</head>');
  } else {
    if (!html.includes('lastset-hotfix.css')) {
      html = html.replace('</head>', '  <link rel="stylesheet" href="./lastset-hotfix.css?v=0126">\n</head>');
    }
    if (!html.includes('lastset-calendar.css')) {
      html = html.replace('</head>', '  <link rel="stylesheet" href="./lastset-calendar.css?v=0126">\n</head>');
    }
  }
  if (!html.includes('lastset-enhancements.js')) {
    html = html.replace('</body>', '  <script src="./lastset-enhancements.js?v=0126"></script>\n  <script src="./lastset-premium.js?v=0126"></script>\n  <script src="./lastset-hotfix.js?v=0126"></script>\n  <script src="./lastset-calendar.js?v=0126"></script>\n</body>');
  } else {
    if (!html.includes('lastset-hotfix.js')) {
      html = html.replace('</body>', '  <script src="./lastset-hotfix.js?v=0126"></script>\n</body>');
    }
    if (!html.includes('lastset-calendar.js')) {
      html = html.replace('</body>', '  <script src="./lastset-calendar.js?v=0126"></script>\n</body>');
    }
  }
  html = html.replace('<meta name="theme-color" content="#0b1220" />', '<meta name="theme-color" content="#090713" />');
  return html;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const wantsHtml = event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');

  if (wantsHtml) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(async response => {
          const text = await response.clone().text();
          const enhanced = enhanceHtml(text);
          return new Response(enhanced, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers({
              'content-type': 'text/html; charset=utf-8',
              'cache-control': 'no-store, max-age=0'
            })
          });
        })
        .catch(async () => {
          const cached = await caches.match('./index.html');
          if (!cached) return Response.error();
          const text = await cached.text();
          return new Response(enhanceHtml(text), {
            headers: { 'content-type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
