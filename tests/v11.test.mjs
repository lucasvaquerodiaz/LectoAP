import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadData} from '../scripts/validate-data.mjs';
import {DEFAULTS,createSession,generateItem} from '../src/engine.js';
import {PhonemeAudio} from '../src/audio.js';
const data=await loadData();
const rng=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

test('dictado de CV, VC y CVC usa la grabación de la unidad sin pista visual',()=>{
 for(const structure of ['CV','VC','CVC']){
  const item=generateItem(data,createSession({...DEFAULTS,activity:'SL05',difficulty:'hard',structures:[structure]}),rng(17));
  assert.equal(item.target.structure,structure);
  assert(data.syllableAudio.some(a=>a.unit===item.target.string&&a.file===item.target.syllableAudio));
  assert.deepEqual(item.audio,[]);
  assert.equal(item.display,undefined);
  assert.equal(item.showImage,false);
  assert.deepEqual(item.expected,item.target.graphemes);
 }
 assert.deepEqual(Object.groupBy(data.syllables,s=>s.structure).CV.length,20);
 assert.equal(data.syllables.filter(s=>s.structure==='VC').length,6);
 assert.equal(data.syllables.filter(s=>s.structure==='CVC').length,12);
});
test('LEO entra en dictado sin pictograma; NUBE sigue excluida y las tildes se conservan',()=>{
 assert(data.dictationWords.some(w=>w.id==='leo'&&w.wordAudio&&!w.image));
 let sawLeo=false;
 for(let seed=1;seed<100;seed++){
  const item=generateItem(data,createSession({...DEFAULTS,activity:'SL06',difficulty:'easy',structures:['CVV']}),rng(seed));
  if(item.target.id==='leo'){sawLeo=true;assert.equal(item.showImage,false);assert.deepEqual(item.expected,['l','e','o']);}
  assert.notEqual(item.target.id,'nube');
 }
 assert(sawLeo);
 assert(!data.dictationWords.some(w=>w.id==='nube'));
 for(const id of ['limon','melon','mision','salmon','salon'])assert(data.wordAudio.find(a=>a.id===id).word.includes('ó'));
});
test('M/N nunca se ofrecen como contraste entre sí',()=>{
 let easyM=0,easyN=0;
 for(const activity of ['CF03','SL02','SL01'])for(let seed=1;seed<250;seed++){
  const easy=generateItem(data,createSession({...DEFAULTS,activity,difficulty:'easy'}),rng(seed));
  if(easy.expected.includes('m')){easyM++;assert(!easy.options.some(o=>o.id==='n'));}
  if(easy.expected.includes('n')){easyN++;assert(!easy.options.some(o=>o.id==='m'));}
  const hard=generateItem(data,createSession({...DEFAULTS,activity,difficulty:'hard'}),rng(seed));
  if(hard.expected.includes('m')&&!hard.expected.includes('n'))assert(!hard.options.some(o=>o.id==='n'));
  if(hard.expected.includes('n')&&!hard.expected.includes('m'))assert(!hard.options.some(o=>o.id==='m'));
 }
 assert(easyM>0&&easyN>0);
});
test('SOL y MELÓN comparten O y L sin duplicar Ó',()=>{
 let found=false;
 for(let seed=1;seed<1000;seed++){
  const item=generateItem(data,createSession({...DEFAULTS,activity:'S+L01',module:'COMBO',combinedReady:true,difficulty:'hard'}),rng(seed));
  if(item.pair.some(w=>w.id==='sol')&&item.pair.some(w=>w.id==='melon')){
   found=true;assert(item.expected.includes('o')&&item.expected.includes('l'));assert(!item.options.some(o=>o.id==='ó'));break;
  }
 }
 assert(found);
});
test('un segundo ▶ detiene el audio anterior',async()=>{
 const p=new PhonemeAudio(data.audio,data.wordAudio,{...data.audioVerification,status:'confirmed_by_teacher'},data.syllableAudio);
 const sources=[];
 const gainNode={gain:{},connect(){}},compressor={threshold:{},knee:{},ratio:{},attack:{},release:{},connect(){}};
 p.context={state:'running',currentTime:0,destination:{},resume:async()=>{},createGain:()=>gainNode,createDynamicsCompressor:()=>compressor,createBufferSource(){
  const source={stopped:false,connect(){},start(){},stop(){this.stopped=true;}};sources.push(source);return source;
 }};
 p.buffer=async()=>({duration:1,sampleRate:1000,getChannelData:()=>new Float32Array(1000).fill(.1)});
 await p.play(['m']);await p.play(['n']);
 assert.equal(sources.length,2);assert.equal(sources[0].stopped,true);assert.equal(sources[1].stopped,false);
});
test('las grabaciones nuevas suben de volumen con control de picos',async()=>{
 const connections=[],gain={gain:{value:1},connect(next){connections.push(['gain',next]);}},limiter={threshold:{},knee:{},ratio:{},attack:{},release:{},connect(next){connections.push(['limiter',next]);}},source={connect(next){connections.push(['source',next]);},start(){}};
 const p=new PhonemeAudio(data.audio,data.wordAudio,{...data.audioVerification,status:'confirmed_by_teacher'},data.syllableAudio);
 p.context={state:'running',currentTime:0,destination:{name:'destination'},resume:async()=>{},createBufferSource:()=>source,createGain:()=>gain,createDynamicsCompressor:()=>limiter};
 p.buffer=async()=>({duration:1,sampleRate:1000,getChannelData:()=>new Float32Array(1000).fill(.1)});
 await p.playEntries([{file:'new-word.m4a',playbackGain:2.5}],0);
 assert(Math.abs(gain.gain.value-2.5)<.001);assert.equal(limiter.threshold.value,-1);assert.equal(limiter.ratio.value,20);
 assert.deepEqual(connections.map(([from])=>from),['source','gain','limiter']);
});
test('el reproductor elimina silencio inicial y nivela la señal conservando margen de ataque',()=>{
 const samples=new Float32Array(2000);samples.fill(.02,500,1400);
 const p=new PhonemeAudio(data.audio,data.wordAudio,{...data.audioVerification,status:'confirmed_by_teacher'},data.syllableAudio);
 const settings=p.playbackSettings({duration:2,sampleRate:1000,getChannelData:()=>samples},{phoneme:'s',playbackGain:2.5});
 assert.equal(settings.offset,.48);assert.equal(settings.duration,1);assert.equal(settings.gain,4);
});
test('no quedan archivos de audio anteriores en el catálogo público',async()=>{
 for(const kind of ['audio','wordAudio','syllableAudio'])for(const row of data[kind]){
  const bytes=await readFile(new URL('../public/'+row.file,import.meta.url));
  assert(bytes.length>1000);assert(row.file.includes(row.sha256.slice(0,16)));
 }
});
