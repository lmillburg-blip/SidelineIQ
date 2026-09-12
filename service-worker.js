const CACHE='sidelineiq-v01515-1';
const ASSETS=['./','./index.html','./styles.css?v=01515','./app.js?v=01515','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./assets/sidelineiq-primary-brand.png','./assets/sidelineiq-brand-board.png','./assets/sidelineiq-header-logo.png','./assets/sidelineiq-home-feature.png','./assets/sidelineiq-ui-reference.png','./assets/sidelineiq-app-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(resp=>{const clone=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));return resp}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
