// UI smoke test against an isolated preview. Its synthetic confirmation never enters the published build.
import {createRequire} from 'node:module';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('test-results/v11-preview');
await mkdir(root,{recursive:true});
for(const dir of ['public','src','data'])await cp(dir,dir==='public'?root:root+'/'+dir,{recursive:true,force:true});
const verification=JSON.parse(await readFile(root+'/data/audio-verification.json','utf8'));
verification.status='confirmed_by_teacher';
await writeFile(root+'/data/audio-verification.json',JSON.stringify(verification));
await writeFile(root+'/sw.js',"self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));");
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.m4a':'audio/mp4','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root+sep))throw Error('Path');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/';
const words=JSON.parse(await readFile('data/words-v1.json','utf8'));
const report=[];
try{
 for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()===404)missing.push(r.url());});
  await page.addInitScript(()=>{
   window.__audioStarts=0;
   const Context=window.AudioContext||window.webkitAudioContext;
   if(Context){const create=Context.prototype.createBufferSource;Context.prototype.createBufferSource=function(...args){const source=create.apply(this,args),start=source.start;source.start=function(...values){window.__audioStarts++;return start.apply(this,values);};return source;};}
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__audioStarts++;return play.apply(this,args);};
  });
  await page.goto(url);
  await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();
  const decoded=await page.evaluate(async()=>{
   const Context=window.AudioContext||window.webkitAudioContext,context=Context?new Context():null;
   const playable=document.createElement('audio').canPlayType('audio/mp4');
   if(!context&&!playable)throw Error('El navegador no admite AAC en MP4');
   let count=0;
   for(const file of ['audio-manifest','word-audio-manifest','syllable-audio-manifest']){
    const entries=await(await fetch('./data/'+file+'.json')).json();
    for(const entry of entries){const response=await fetch('./'+entry.file);if(!response.ok)throw Error(entry.file+': '+response.status);const bytes=await response.arrayBuffer();if(bytes.byteLength<1000)throw Error('Audio vacío: '+entry.file);if(context){const buffer=await context.decodeAudioData(bytes);if(buffer.duration<.1||!buffer.getChannelData(0).some(x=>Math.abs(x)>.005))throw Error('Audio vacío: '+entry.file);}count++;}
   }
   if(context)await context.close();return count;
  });
  assert.equal(decoded,106);
  assert.equal(await page.locator('.module').count(),3);
  await page.getByRole('button',{name:'Modo docente',exact:true}).click();
  assert(!await page.locator('#activity').textContent().then(x=>x.includes('Cambiar un sonido')));
  await page.selectOption('#module','SL');
  await page.selectOption('#activity','SL05');
  await page.getByRole('button',{name:'Comenzar práctica'}).click();
  await page.locator('[data-syllable-id]').waitFor();
  assert.equal(await page.locator('.target-image,.written').count(),0);
  const unit=await page.locator('[data-syllable-id]').getAttribute('data-syllable-id');
  assert(!await page.locator('main').innerText().then(x=>x.includes(unit.toUpperCase())));
  await page.locator('[data-syllable-id]').click();
  await page.waitForTimeout(1200);
  const playback=await page.evaluate(()=>({starts:window.__audioStarts,feedback:document.querySelector('#feedback')?.textContent}));
  assert.equal(playback.feedback,'');
  assert(playback.starts>0);
  await page.locator('[data-syllable-id]').click();
  await page.waitForTimeout(150);
  assert(await page.evaluate(()=>window.__audioStarts)>playback.starts);
  await page.getByRole('button',{name:'Salir',exact:true}).click();
  await page.getByRole('button',{name:'Terminar e ir a inicio'}).click();
  await page.getByRole('button',{name:'Modo docente',exact:true}).click();
  await page.selectOption('#module','SL');
  await page.selectOption('#activity','SL03');
  await page.getByRole('button',{name:'Comenzar práctica'}).click();
  const image=await page.locator('.target-image').getAttribute('src');
  const target=words.find(w=>w.image===image);
  assert(target);
  const wrong=page.locator('[data-option]').filter({hasText:new RegExp('^(?!'+target.graphemes[0].toUpperCase()+'$).+')}).first();
  await wrong.click();assert.equal(await page.locator('#feedback').innerText(),'✗');
  await wrong.click();assert.equal(await page.locator('#feedback').innerText(),'✗');
  assert.equal(await page.locator('#next button').count(),0);
  await page.getByRole('button',{name:'Ayuda: quitar una opción incorrecta'}).click();
  assert.equal(await page.locator('#next button').count(),0);
  await page.locator('[data-option]').filter({hasText:new RegExp('^'+target.graphemes[0].toUpperCase()+'$')}).click();
  assert.equal(await page.locator('#feedback').innerText(),'✓ ¡Muy bien!');
  assert.equal(await page.locator('#next button').count(),0);
  await page.locator('.progress .done').first().waitFor();
  await page.getByRole('button',{name:'Salir',exact:true}).click();
  await page.getByRole('button',{name:'Terminar e ir a inicio'}).click();
  await page.getByRole('button',{name:'Modo docente',exact:true}).click();
  await page.selectOption('#module','CF');
  assert(!await page.locator('#activity').textContent().then(x=>x.includes('Cambiar un sonido')));
  await page.selectOption('#activity','CF03');
  await page.getByRole('button',{name:'Comenzar práctica'}).click();
  assert.equal(await page.locator('.audio-choice').count(),3);
  assert(!/Sonido [123]|Elegir [123]/.test(await page.locator('main').innerText()));
  await page.locator('.audio-choice').first().locator('[data-listen]').click();
  await page.locator('.audio-choice').first().locator('[data-option]').click();
  assert(['✓','✗'].includes(await page.locator('#feedback').innerText()));
  await page.getByRole('button',{name:'Salir',exact:true}).click();
  await page.getByRole('button',{name:'Terminar e ir a inicio'}).click();
  await page.getByRole('button',{name:'Modo docente',exact:true}).click();
  await page.selectOption('#module','COMBO');
  assert(!await page.locator('#activity').textContent().then(x=>x.includes('Qué letra se añadió')));
  await page.selectOption('#activity','S+L01');
  await page.check('#combinedReady');
  await page.getByRole('button',{name:'Comenzar práctica'}).click();
  assert.equal(await page.locator('.shared-word img').count(),2);
  assert.equal(await page.locator('.shared-word [data-word-id]').count(),2);
  assert.equal(await page.locator('.written').count(),0);
  const pairIds=await page.locator('.shared-word [data-word-id]').evaluateAll(bs=>bs.map(b=>b.dataset.wordId));
  const pairWords=pairIds.map(id=>words.find(w=>w.id===id).word.toUpperCase());
  const visible=await page.locator('main').innerText();
  assert(pairWords.every(word=>!visible.includes(word)));
  await page.locator('.shared-word [data-word-id]').first().click();
  await page.locator('.shared-word [data-word-id]').last().click();
  assert.equal(await page.locator('.instruction-icon[aria-label="Comparten"]').count(),1);
  await page.getByRole('button',{name:'Salir',exact:true}).click();
  await page.getByRole('button',{name:'Terminar e ir a inicio'}).click();
  await page.getByRole('button',{name:/Jugar solo/}).click();
  assert.match(await page.locator('.child-progress').innerText(),/actividad 1 de 12/);
  for(let round=0;round<6;round++){
   const choices=page.locator('[data-option]');
   await choices.first().click();
   if((await page.locator('#feedback').innerText()).startsWith('✗'))await choices.last().click();
   await page.waitForFunction(expected=>document.querySelector('.child-progress')?.textContent.includes('actividad 2 de 12')||document.querySelectorAll('.progress .done').length===expected,round+1);
  }
  assert.match(await page.locator('.child-progress').innerText(),/actividad 2 de 12/);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  report.push({browser:name,decoded,unit,correctAfterTwoErrors:true,audioStarts:await page.evaluate(()=>window.__audioStarts),errors,missing});
  await browser.close();
 }
}finally{await new Promise(resolve=>server.close(resolve));}
console.log(JSON.stringify(report,null,2));
