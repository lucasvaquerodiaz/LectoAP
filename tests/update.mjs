import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true}),page=await browser.newPage();
const original=await readFile('dist/sw.js','utf8');
try{
 await page.goto('http://localhost:4173/');await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await page.getByRole('button',{name:'Modo docente',exact:true}).click();await page.selectOption('#module','SL');await page.selectOption('#activity','SL01');await page.getByRole('button',{name:'Comenzar práctica'}).click();if(await page.getByRole('button',{name:'Mostrar al alumno'}).count())await page.getByRole('button',{name:'Mostrar al alumno'}).click();
 await writeFile('dist/sw.js',original.replace("const VERSION='","const VERSION='update-test-"));
 await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting);
 assert.equal(await page.locator('.activity').count(),1);assert.equal(await page.getByRole('button',{name:'Actualizar ahora'}).count(),0);
 await page.locator('[data-option]').first().click();if(!await page.locator('[data-action="next"]').count())await page.locator('[data-option]').first().click();
 await page.getByRole('button',{name:'Salir',exact:true}).click();await page.getByRole('button',{name:'Seguir practicando'}).click();assert.equal(await page.locator('[data-action="next"]').count(),1);
 await page.getByRole('button',{name:'Salir',exact:true}).click();await page.getByRole('button',{name:'Terminar e ir a inicio'}).click();await page.getByRole('button',{name:'Modo docente',exact:true}).click();await page.getByRole('button',{name:'Actualizar ahora'}).waitFor();await page.getByRole('button',{name:'Actualizar ahora'}).click();await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();
 const keys=await page.evaluate(()=>caches.keys());assert(keys.some(k=>k.includes('update-test-')));assert.equal(keys.filter(k=>k.startsWith('lectoap-http://localhost:4173/-')).length,1);
 // Complete a full session with correction; response records must not double count.
 await page.getByRole('button',{name:'Modo docente',exact:true}).click();await page.selectOption('#module','SL');await page.selectOption('#activity','SL01');await page.selectOption('#count','5');await page.getByRole('button',{name:'Comenzar práctica'}).click();
 for(let i=0;i<5;i++){if(await page.getByRole('button',{name:'Mostrar al alumno'}).count())await page.getByRole('button',{name:'Mostrar al alumno'}).click();await page.locator('[data-option]').first().click();if(!await page.locator('[data-action="next"]').count())await page.locator('[data-option]').first().click();await page.getByRole('button',{name:'Continuar',exact:true}).click();}
 await page.getByRole('heading',{name:'Hemos practicado juntos.'}).waitFor();assert(await page.getByText('5 oportunidades para escuchar y aprender.').count());
 const report={browser:browser.version(),passed:true,checks:['actualización permanece esperando durante sesión','activación explícita docente recarga fuera de sesión','caché anterior eliminada en el mismo scope','salir y volver conserva continuar sin duplicar respuestas','tanda completa de 5 ítems y pantalla final']};await writeFile('test-results/update-report.json',JSON.stringify(report,null,2));console.log(report);
}finally{await writeFile('dist/sw.js',original);await browser.close();}
