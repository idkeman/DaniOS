importScripts('/controller/controller.sw.js');

const CACHE = 'danios-shell-v4';
const ASSETS = [
  '/', '/index.html', '/manifest.webmanifest', '/enhancements.js',
  '/enhancements.css', '/proxy-engine.js', '/version.json', '/icon.svg'
];
const RUNTIME_ROOTS = ['/scram/','/utils/','/controller/','/libcurl/','/wisp/'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key.startsWith('danios-shell-')&&key!==CACHE).map(key=>caches.delete(key))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if (self.$scramjetController?.shouldRoute(event)) {
    event.respondWith(self.$scramjetController.route(event));
    return;
  }
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin||RUNTIME_ROOTS.some(root=>url.pathname.startsWith(root)))return;
  if(!ASSETS.includes(url.pathname)&&url.pathname!=='/')return;
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
    return response;
  })));
});
