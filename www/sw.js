const CACHE_NAME='fall-jump-v190-walking-2';
const FILES=['./index.html','./pastel.css','./level-generator.js','./fever.js','./skins.js','./goals.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('fall-jump-')&&name!==CACHE_NAME).map(name=>caches.delete(name))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).catch(async()=>{
    const cached=await caches.match(event.request);
    if(cached)return cached;
    if(event.request.mode==='navigate')return caches.match('./index.html');
    return Response.error();
  }));
});
