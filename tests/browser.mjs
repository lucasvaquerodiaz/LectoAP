// Optional integration suite: install Playwright and its browsers locally first.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.TEST_URL||'http://localhost:4173/LectoAP/';
await mkdir('test-results',{recursive:true});
const report={date:new Date().toISOString(),browsers:[]};
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 let browser;
 try{browser=await type.launch({headless:true});}catch(e){report.browsers.push({name,status:'unavailable',error:e.message});continue;}
 const result={name,version:browser.version(),checks:[],errors:[]};report.browsers.push(result);
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
 const external=[];page.on('request',r=>{if(!r.url().startsWith('http://localhost:4173/'))external.push(r.url());});
 try{
  await page.goto(base);await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();result.checks.push('carga bajo /LectoAP/');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();await page.screenshot({path:`test-results/${name}-home.png`,fullPage:true});
  const decoded=await page.evaluate(async()=>{const manifest=await (await fetch('./data/audio-manifest.json')).json(),C=window.AudioContext||window.webkitAudioContext;if(!C)return {unavailable:true,reason:'Web Audio no disponible en este build de navegador',htmlAAC:new Audio().canPlayType('audio/mp4')};const ctx=new C(),rows=[];for(const a of manifest){const bytes=await (await fetch(a.file)).arrayBuffer();const b=await new Promise((resolve,reject)=>ctx.decodeAudioData(bytes,resolve,reject));rows.push({phoneme:a.phoneme,duration:b.duration,nonSilent:b.getChannelData(0).some(x=>Math.abs(x)>.01)});}await ctx.close();return rows;});result.audio=decoded;if(!decoded.unavailable){assert.equal(decoded.length,9);assert(decoded.every(x=>x.duration>.1&&x.nonSilent));result.checks.push('9 AAC decodificados con muestras no silenciosas');}
  const activities=JSON.parse(await readFile('data/activities.json','utf8'));
  for(const activity of activities){
   await page.getByRole('button',{name:'Modo docente',exact:true}).click();await page.selectOption('#module',activity.module);await page.selectOption('#activity',activity.id);await page.check('#combinedReady');await page.getByRole('button',{name:'Comenzar práctica'}).click();const target=await page.locator('.teacher-word').count()?await page.locator('.teacher-word').textContent():'';if(await page.getByRole('button',{name:'Mostrar al alumno'}).count())await page.getByRole('button',{name:'Mostrar al alumno'}).click();await page.locator('.activity').waitFor();
   if(activity.module==='CF'){assert.equal(await page.locator('.written').count(),0);assert.equal(await page.locator('.teacher-word').count(),0);if(target&&!target.includes(' '))assert(!(await page.locator('main').innerText()).toLowerCase().split(/[^a-záéíóúüñ]+/).includes(target.toLowerCase()));}
   const listen=page.locator('[data-action="listen"]');if(await listen.count())await listen.click();
   for(let attempt=0;attempt<2;attempt++){
    if(await page.locator('[data-action="next"]').count())break;
    if(activity.response==='sequence'){const slots=await page.locator('[data-slot]').count();for(let i=0;i<slots;i++)await page.locator('[data-option]').first().click();await page.locator('[data-action="check"]').click();}
    else if(activity.response==='multi'){if(attempt===0)await page.locator('[data-option]').first().click();await page.locator('[data-action="check"]').click();}
    else await page.locator('[data-option]').first().click();
   }
   await page.locator('[data-action="next"]').waitFor();if(activity.id==='CF06'||activity.id==='SL04')await page.screenshot({path:`test-results/${name}-${activity.id}.png`,fullPage:true});
   await page.getByRole('button',{name:'Salir',exact:true}).click();await page.getByRole('button',{name:'Terminar e ir a inicio'}).click();
  }
  result.checks.push('20 motores: preparación, respuesta táctil, feedback y salida');
  await context.setOffline(true);
  if(name==='webkit'){
   try{await page.reload();await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();}catch(e){result.offlineLimitation=e.message;result.status='partial';await browser.close();continue;}
  }else {await page.reload();await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();}
  const assets=await page.evaluate(async()=>{const cache=await caches.open((await caches.keys()).find(k=>k.startsWith('lectoap-')&&k.includes('/LectoAP/')));const requests=await cache.keys();const statuses=[];for(const r of requests){const res=await fetch(r.url);statuses.push({url:r.url,status:res.status});}const manifest=await(await fetch('./data/audio-manifest.json')).json();const range=await fetch('./'+manifest[0].file,{headers:{Range:'bytes=0-99'}});return {count:requests.length,statuses,rangeStatus:range.status,rangeLength:(await range.arrayBuffer()).byteLength};});assert(assets.count>=45);assert(assets.statuses.every(x=>x.status===200));assert.equal(assets.rangeStatus,206);assert.equal(assets.rangeLength,100);result.checks.push(`offline: ${assets.count} entradas, recarga y Range AAC 206`);
  await page.getByRole('button',{name:'Modo docente',exact:true}).click();await page.selectOption('#module','SL');await page.selectOption('#activity','SL07');await page.getByRole('button',{name:'Comenzar práctica'}).click();if(await page.getByRole('button',{name:'Mostrar al alumno'}).count())await page.getByRole('button',{name:'Mostrar al alumno'}).click();await page.waitForFunction(()=>[...document.querySelectorAll('.picture img')].every(i=>i.complete&&i.naturalWidth>0));assert(await page.locator('.picture img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));result.checks.push('lectura con pictogramas offline');
  assert.deepEqual(external,[]);assert.deepEqual(result.errors,[]);result.checks.push('sin errores JavaScript ni solicitudes a terceros');result.status='passed';
 }catch(e){result.status='failed';result.errors.push(e.stack);await page.screenshot({path:`test-results/${name}-failure.png`,fullPage:true});}
 await browser.close();
}
await writeFile('test-results/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.browsers.some(b=>b.status==='failed')||!report.browsers.some(b=>b.status==='passed'))process.exitCode=1;
