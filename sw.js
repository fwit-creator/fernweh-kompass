/* Offline-Hülle: App-Dateien und Karten werden beim ersten Besuch gespeichert.
   Live-Daten (Klima, Wikipedia, Relays) laufen immer übers Netz. */
const VERSION="fk2-v1";
const SHELL=["./","index.html","styles.css","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png",
  "vendor/d3.min.js","vendor/topojson-client.min.js","vendor/nostr.bundle.js","vendor/countries-110m.json","vendor/countries-50m.json",
  "js/data.js","js/core.js","js/live.js","js/sync.js","js/globe.js","js/scene.js","js/app.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  if(u.origin===location.origin){
    // App-Dateien: erst Netz (damit Updates ankommen), sonst Cache
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("index.html"))));
  }else if(u.hostname.endsWith("fonts.googleapis.com")||u.hostname.endsWith("fonts.gstatic.com")){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const c=res.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return res})));
  }
});
