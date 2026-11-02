const CACHE_NAME='zip-to-git-pwa-v3';
const APP_SHELL=['./','./index.html','./style.css','./app.js','./jszip.min.js','./manifest.json','./offline.html','./offline.css','./offline.js','./offline.jpg','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-512-maskable.png'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(CACHE_NAME);await c.addAll(APP_SHELL);await self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const n of await caches.keys())if(n!==CACHE_NAME)await caches.delete(n);await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){e.respondWith((async()=>{try{return await fetch(req)}catch(err){const c=await caches.open(CACHE_NAME);return(await c.match('./offline.html'))||new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}})}})());return}
 e.respondWith((async()=>{const c=await caches.open(CACHE_NAME),hit=await c.match(req);
  const net=fetch(req).then(r=>{if(r.ok&&r.type==='basic')c.put(req,r.clone());return r}).catch(()=>null);
  return hit||(await net)||new Response('',{status:503})})());
});
