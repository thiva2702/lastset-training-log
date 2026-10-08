const CACHE = 'lastset-v1-beta1-02300';
const OFFLINE_SHELL = new URL('./__lastset_offline_shell__', self.location.href).toString();
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './lastset-theme.css',
  './lastset-premium.css',
  './lastset-brand.css',
  './lastset-identity.css',
  './lastset-v0140.css',
  './lastset-onboarding.css',
  './lastset-offline.css',
  './lastset-explore.css',
  './lastset-anatomy.css',
  './lastset-images.css',
  './lastset-hotfix.css',
  './lastset-calendar.css',
  './lastset-enhancements.js',
  './lastset-premium.js',
  './lastset-hotfix.js',
  './lastset-smartlog-shorthand.js',
  './lastset-core-reliability.js',
  './lastset-memory.js',
  './lastset-intelligence.js',
  './lastset-calendar.js',
  './lastset-workouts.js',
  './lastset-integrity.js',
  './lastset-profile-equipment.js',
  './lastset-navigation.js',
  './lastset-beta.js',
  './lastset-brand.js',
  './lastset-identity.js',
  './lastset-v0140.js',
  './lastset-onboarding.js',
  './lastset-offline.js',
  './lastset-atlas-regions.js',
  './lastset-anatomy.js',
  './lastset-explore.js',
  './assets/anatomy-front.webp',
  './assets/anatomy-back.webp',
  './assets/hero.webp',
  './assets/equipment.webp',
  './assets/home-hero-thiva.webp',
  './assets/lastset-mark.svg'
];

async function primeOfflineCache(){
  const cache=await caches.open(CACHE);

  // Cache assets independently so one optional asset can never invalidate the whole offline install.
  await Promise.allSettled(ASSETS.map(async asset=>{
    const response=await fetch(asset,{cache:'no-store'});
    if(response&&response.ok)await cache.put(asset,response.clone());
  }));

  // Keep a dedicated, stable HTML shell key for WebKit/iOS offline navigation.
  const shell=await fetch('./index.html',{cache:'no-store'});
  if(!shell||!shell.ok)throw new Error('LastSet offline shell could not be cached');
  await cache.put('./index.html',shell.clone());
  await cache.put(OFFLINE_SHELL,shell.clone());
}

self.addEventListener('install', event => {
  event.waitUntil(primeOfflineCache());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('message', event => {
  if(event.data?.type !== 'LASTSET_WARM_OFFLINE') return;
  event.waitUntil(primeOfflineCache());
});

function enhanceHtml(text) {
  let html = text;
  const styles = [
    ['./lastset-theme.css','0138'],
    ['./lastset-premium.css','0138'],
    ['./lastset-images.css','0132'],
    ['./lastset-hotfix.css','0132'],
    ['./lastset-calendar.css','0132'],
    ['./lastset-brand.css','0139'],
    ['./lastset-identity.css','01310'],
    ['./lastset-v0140.css','01402'],
    ['./lastset-onboarding.css','0140'],
    ['./lastset-offline.css','0141'],
    ['./lastset-explore.css','0202'],
    ['./lastset-anatomy.css','0211']
  ];
  const scripts = [
    ['./lastset-enhancements.js','0132'],
    ['./lastset-premium.js','0132'],
    ['./lastset-hotfix.js','0132'],
    ['./lastset-smartlog-shorthand.js','01402'],
    ['./lastset-core-reliability.js','0133'],
    ['./lastset-memory.js','0134'],
    ['./lastset-intelligence.js','0137'],
    ['./lastset-calendar.js','0132'],
    ['./lastset-workouts.js','0132'],
    ['./lastset-integrity.js','0132'],
    ['./lastset-profile-equipment.js','0135'],
    ['./lastset-navigation.js','0141'],
    ['./lastset-beta.js','1beta1'],
    ['./lastset-brand.js','0139'],
    ['./lastset-identity.js','01401'],
    ['./lastset-v0140.js','01402'],
    ['./lastset-onboarding.js','0140'],
    ['./lastset-offline.js','0141'],
    ['./lastset-atlas-regions.js','0210'],
    ['./lastset-anatomy.js','0210'],
    ['./lastset-explore.js','0201']
  ];

  for(const [path,version] of styles){
    const name=path.split('/').pop();
    if(!html.includes(name)) html=html.replace('</head>', '  <link rel="stylesheet" href="'+path+'?v='+version+'">\n</head>');
  }
  for(const [path,version] of scripts){
    const name=path.split('/').pop();
    if(!html.includes(name)) html=html.replace('</body>', '  <script src="'+path+'?v='+version+'"></script>\n</body>');
  }

  html = html.replace('<meta name="theme-color" content="#0b1220" />','<meta name="theme-color" content="#090713" />');
  return html;
}

async function navigationResponse(request){
  try{
    const response=await fetch(request,{cache:'no-store'});
    const text=await response.clone().text();
    const cache=await caches.open(CACHE);
    const shellResponse=new Response(text,{
      status:200,
      headers:{'content-type':'text/html; charset=utf-8'}
    });
    await cache.put('./index.html',shellResponse.clone());
    await cache.put(OFFLINE_SHELL,shellResponse.clone());
    return new Response(enhanceHtml(text),{
      status:response.status,
      statusText:response.statusText,
      headers:{
        'content-type':'text/html; charset=utf-8',
        'cache-control':'no-store, max-age=0'
      }
    });
  }catch(_){
    const cache=await caches.open(CACHE);
    const cached=
      await cache.match(OFFLINE_SHELL) ||
      await cache.match('./index.html',{ignoreSearch:true}) ||
      await cache.match('./',{ignoreSearch:true});
    if(!cached)return Response.error();
    const text=await cached.text();
    return new Response(enhanceHtml(text),{
      headers:{
        'content-type':'text/html; charset=utf-8',
        'cache-control':'no-store, max-age=0'
      }
    });
  }
}

async function staticResponse(request,event){
  const cached=await caches.match(request,{ignoreSearch:true});
  if(cached){
    event.waitUntil(
      fetch(request)
        .then(async response=>{
          if(!response||!response.ok)return;
          const cache=await caches.open(CACHE);
          await cache.put(request,response.clone());
        })
        .catch(()=>{})
    );
    return cached;
  }

  try{
    const response=await fetch(request);
    if(response&&response.ok){
      const cache=await caches.open(CACHE);
      await cache.put(request,response.clone());
    }
    return response;
  }catch(_){
    return caches.match(request,{ignoreSearch:true}).then(hit=>hit||Response.error());
  }
}

self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);
  const sameOrigin=url.origin===self.location.origin;
  const wantsHtml=request.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/app-v12')||url.pathname.endsWith('/app-v12.html');

  if(wantsHtml){
    event.respondWith(navigationResponse(request));
    return;
  }

  if(sameOrigin){
    event.respondWith(staticResponse(request,event));
    return;
  }

  event.respondWith(fetch(request).catch(()=>caches.match(request,{ignoreSearch:true})));
});
