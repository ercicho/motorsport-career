const CACHE='motorsport-career-cache-v312';
const FILES=[...new Set(['./','./index.html','./cloud.js','./gt7-vehicles.json','./manifest.webmanifest','./icon.svg','./hero.jpg','./stage-kart.jpg','./stage-club.jpg','./stage-gt.jpg','./career-stages.png'])];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('motorsport-career-cache-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}return response;}).catch(()=>caches.match(req)));});
