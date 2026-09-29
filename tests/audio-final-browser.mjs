import {createRequire} from 'node:module';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const manifest=JSON.parse(await readFile('data/audio-manifest.json','utf8')).concat(JSON.parse(await readFile('data/word-audio-manifest.json','utf8')));
const legacyRoot=resolve('test-results/legacy-audio-app');
await mkdir(legacyRoot+'/assets/audio/phonemes',{recursive:true});
// Use a known non-phoneme recording to model the legacy mis-assignment (the old source package
// is intentionally no longer kept in the project after the final-source migration).
await copyFile('inputs/audio_final/palabras/assets/audio/words/uno.m4a',legacyRoot+'/assets/audio/phonemes/a.m4a');
const legacyWorker=await readFile(legacyRoot+'/sw.js','utf8');
await writeFile(legacyRoot+'/sw.js',legacyWorker.replaceAll('audio-final-v1','legacy-v0').replace(/const VERSION='[^']+'/,"const VERSION='legacy-build'"));
let servingFinal=false;
const server=createServer(async(req,res)=>{try{const root=resolve(servingFinal?'dist':'test-results/legacy-audio-app');const path=new URL(req.url,'http://localhost').pathname;const file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root+sep))throw Error('Path');const bytes=await readFile(file);const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.m4a':'audio/mp4','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};res.writeHead(200,{'Content-Type':mime[extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(4174,'127.0.0.1',resolve));
const report={};
try{
 for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true}),context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   servingFinal=name!=='chromium';await page.goto('http://localhost:4174/');await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   if(name==='chromium'){
    // Seed the actual former installation, including its incorrect old audio.
    const old=await page.evaluate(async()=>{window.__legacyMarker=true;return [...new Uint8Array(await(await fetch('assets/audio/phonemes/a.m4a')).arrayBuffer())];});assert.notEqual(createHash('sha256').update(Buffer.from(old)).digest('hex'),manifest[0].sha256);
    servingFinal=true;
    await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});
    await page.waitForFunction(()=>!window.__legacyMarker);
    await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();
    const keys=await page.evaluate(()=>caches.keys());assert(keys.length>0&&keys.every(k=>k.includes('audio-final-v1')));
    assert.equal(await page.evaluate(async()=>(await fetch('assets/audio/phonemes/a.m4a')).status),410);
    report.migration={passed:true,oldCacheDeleted:true,oldRuntimeReloaded:true,oldAudioURLStatus:410};
   }
   await page.getByRole('button',{name:'Modo docente',exact:true}).click();await page.selectOption('#module','SL');await page.selectOption('#activity','SL06');await page.getByRole('button',{name:'Comenzar práctica'}).click();
   assert.equal(await page.getByRole('button',{name:'Mostrar al alumno'}).count(),0);
   const wordButton=page.locator('[data-word-id]').first();await wordButton.waitFor();await wordButton.click();assert.equal(await page.locator('[data-action="listen"]').count(),0);
   await page.getByRole('button',{name:'Salir',exact:true}).click();await page.getByRole('button',{name:'Terminar e ir a inicio'}).click();
   const media=await page.evaluate(async entries=>{const rows=[];for(const entry of entries){const a=new Audio(entry.file);const status=await new Promise(resolve=>{const timer=setTimeout(()=>{a.pause();resolve('timeout');},7000);a.onended=()=>{clearTimeout(timer);resolve('ended');};a.onerror=()=>{clearTimeout(timer);resolve('error');};a.play().catch(()=>{clearTimeout(timer);resolve('blocked');});});rows.push({id:entry.phoneme||entry.word,kind:entry.phoneme?'phoneme':'word',status,duration:a.duration});if(status!=='ended')break;}return rows;},manifest);
   assert.equal(media.length,28);assert(media.every(r=>r.status==='ended'&&r.duration>0));
   report[name]={version:browser.version(),wordDictation:true,media,errors};
   if(name==='chromium'){
    await context.setOffline(true);await page.reload();await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();
    const hashes=await page.evaluate(async entries=>{const result=[];for(const a of entries){const r=await fetch(a.file);const bytes=await r.arrayBuffer();const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');result.push({id:a.id,digest,status:r.status});}return result;},manifest);
    assert.deepEqual(hashes.map(x=>x.digest),manifest.map(x=>x.sha256));assert(hashes.every(x=>x.status===200));
    const range=await page.evaluate(async file=>{const r=await fetch(file,{headers:{Range:'bytes=0-99'}});return {status:r.status,length:(await r.arrayBuffer()).byteLength};},manifest[9].file);assert.deepEqual(range,{status:206,length:100});report.chromium.offline={all28HashesMatch:true,wordRange:range};
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 }
 await writeFile('test-results/audio-final-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await new Promise(resolve=>server.close(resolve));}
