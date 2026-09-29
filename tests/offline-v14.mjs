import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.m4a':'audio/mp4','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  let url=new URL(req.url,'http://localhost').pathname;
  if(!url.startsWith('/LectoAP/'))throw Error('Scope');
  url=url.slice('/LectoAP'.length);
  const path=resolve(root,'.'+(url.endsWith('/')?url+'index.html':url));
  if(!path.startsWith(root+sep))throw Error('Path');
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url=`http://127.0.0.1:${server.address().port}/LectoAP/`;
const reports=[];
try{
 for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true});
  try{
   const context=await browser.newContext({serviceWorkers:'allow'});
   const page=await context.newPage();
   await page.goto(url);
   await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();
   await page.evaluate(()=>navigator.serviceWorker.ready);
   await page.reload();
   await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
   await context.setOffline(true);
   const inventory=await page.evaluate(async()=>{
    const names=['audio-manifest','word-audio-manifest','syllable-audio-manifest'];
    let count=0;
    for(const name of names){
     const manifest=await(await fetch('./data/'+name+'.json')).json();
     for(const row of manifest){const response=await fetch('./'+row.file);if(!response.ok||(await response.arrayBuffer()).byteLength<1000)throw Error('Audio offline: '+row.file);count++;}
    }
    const first=await(await fetch('./data/syllable-audio-manifest.json')).json();
    const range=await fetch('./'+first[0].file,{headers:{Range:'bytes=0-99'}});
    return {count,rangeStatus:range.status,rangeBytes:(await range.arrayBuffer()).byteLength};
   });
   assert.deepEqual(inventory,{count:106,rangeStatus:206,rangeBytes:100});
   let reload='ok';
   try{await page.reload();await page.getByRole('heading',{name:'Un sonido cada vez.'}).waitFor();}
   catch(e){if(name==='chromium')throw e;reload='unavailable in this WebKit test runtime';}
   reports.push({browser:name,...inventory,offline:true,reload});
   await context.close();
  }finally{await browser.close();}
 }
}finally{await new Promise(done=>server.close(done));}
console.log(JSON.stringify(reports,null,2));
