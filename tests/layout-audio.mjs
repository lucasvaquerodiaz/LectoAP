import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const report={};
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4173/');await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`test-results/${name}-narrow.png`,fullPage:true});
 await page.getByRole('button',{name:'Modo docente',exact:true}).click();await page.selectOption('#module','CF');await page.selectOption('#activity','CF07');await page.uncheck('#repetition');await page.getByRole('button',{name:'Comenzar práctica'}).click();if(await page.getByRole('button',{name:'Mostrar al alumno'}).count())await page.getByRole('button',{name:'Mostrar al alumno'}).click();await page.getByRole('button',{name:'▶ Escuchar',exact:true}).click();await page.getByRole('button',{name:'Salir',exact:true}).click();await page.getByRole('button',{name:'Terminar e ir a inicio'}).click();
 const media=await page.evaluate(async()=>{const entries=await(await fetch('./data/audio-manifest.json')).json(),rows=[];for(const entry of entries){const a=new Audio(entry.file);const value=await new Promise(resolve=>{const timer=setTimeout(()=>{a.pause();resolve({status:'timeout'});},4000);a.onended=()=>{clearTimeout(timer);resolve({status:'ended',duration:a.duration});};a.onerror=()=>{clearTimeout(timer);resolve({status:'error',code:a.error?.code});};a.play().catch(e=>{clearTimeout(timer);resolve({status:'blocked',message:e.message});});});rows.push({phoneme:entry.phoneme,...value});if(value.status!=='ended')break;}return rows;});
 assert.deepEqual(errors,[]);report[name]={version:browser.version(),narrowLayout:true,exitDuringAudio:true,htmlAudio:media,errors};await browser.close();
}
await writeFile('test-results/layout-audio-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
