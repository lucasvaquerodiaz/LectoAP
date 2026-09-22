/* Final-audio migration retires unsafe legacy caches; later updates wait for teacher. */
const VERSION='__VERSION__';
const GENERATION='audio-final-v1';
const PREFIX='lectoap-'+self.registration.scope+'-';
const CACHE=PREFIX+GENERATION+'-'+VERSION;
const ASSETS=__ASSETS__;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);await cache.addAll(ASSETS.map(path=>new Request(path,{cache:'reload'})));
 const legacy=(await caches.keys()).some(key=>key.startsWith(PREFIX)&&!key.startsWith(PREFIX+GENERATION+'-'));
 if(legacy)await self.skipWaiting();
})()));
self.addEventListener('message',event=>{if(event.data&&event.data.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys(),legacy=keys.some(key=>key.startsWith(PREFIX)&&!key.startsWith(PREFIX+GENERATION+'-'));
 for(const key of keys)if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
 // An old page also holds audio and manifests in memory. Reload it after corrective migration.
 if(legacy)for(const client of await self.clients.matchAll({type:'window'}))if(client.url.startsWith(self.registration.scope))await client.navigate(client.url);
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);let response=await cache.match(url.href);
  if(url.pathname.includes('/assets/audio/')&&!response)return new Response('Audio obsoleto o no autorizado',{status:410});
  if(!response&&event.request.mode==='navigate')response=await cache.match(new URL('./index.html',self.registration.scope).href);
  if(!response)return fetch(event.request);
  const range=event.request.headers.get('range');
  if(range){const bytes=await response.arrayBuffer(),match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match)return new Response(null,{status:416});let start=match[1]?Number(match[1]):Math.max(0,bytes.byteLength-Number(match[2])),end=match[1]?(match[2]?Number(match[2]):bytes.byteLength-1):bytes.byteLength-1;end=Math.min(end,bytes.byteLength-1);if(start>end||start>=bytes.byteLength)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.byteLength}`}});return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':response.headers.get('Content-Type')||'audio/mp4','Content-Range':`bytes ${start}-${end}/${bytes.byteLength}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});}
  return response;
 })());
});
