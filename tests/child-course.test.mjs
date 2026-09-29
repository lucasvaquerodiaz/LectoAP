import test from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../scripts/validate-data.mjs';
import {CHILD_COURSE,childConfig} from '../src/child-course.js';
import {createSession,generateItem,isCorrect} from '../src/engine.js';

const data=await loadData();
const rng=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

test('el curso autónomo conserva el orden solicitado, usa seis ítems fáciles y solo palabras grabadas',()=>{
 assert.deepEqual(CHILD_COURSE.map(s=>s.activity),['CF01','CF02','CF03','CF05','CF07','SL01','SL02','SL03','SL05','SL07','SL04','SL06']);
 const recorded=new Set(data.wordAudio.map(a=>a.id));
 for(let index=0;index<CHILD_COURSE.length;index++){
  const config=childConfig(index);
  assert.equal(config.count,6);assert.equal(config.difficulty,'easy');assert.equal(config.audio,true);assert.equal(config.recordedOnly,true);
  assert.equal(config.position,CHILD_COURSE[index].position);
  for(let seed=1;seed<=30;seed++){
   const item=generateItem(data,createSession(config),rng(index*100+seed));
   assert.equal(item.activity,CHILD_COURSE[index].activity);
   assert(isCorrect(item,item.expected));
   if(item.activity==='SL05')assert(data.syllableAudio.some(a=>a.unit===item.target.string));
   else if(data.words.some(w=>w.id===item.target.id)||data.oral.some(w=>w.id===item.target.id)||data.dictationWords.some(w=>w.id===item.target.id))assert(recorded.has(item.target.id));
   for(const option of item.options.filter(o=>o.type==='image'))assert(recorded.has(option.id));
  }
 }
});

test('en fácil M y N no producen negativas engañosas ni distraen como respuestas',()=>{
 const bank=data.words.concat(data.oral);
 for(const activity of ['CF01','CF02','CF03','SL01','SL02','SL03','CF06'])for(const position of ['any','initial','final'])for(let seed=1;seed<=300;seed++){
  const item=generateItem(data,createSession({...childConfig(0),activity,position}),rng(seed*13+activity.length));
  const sound=item.audio[0];
  if(activity==='CF01'&&['m','n'].includes(sound)&&item.expected[0]==='no')assert(!item.target.phonemes.includes(sound==='m'?'n':'m'));
  if(activity==='CF02'&&['m','n'].includes(sound))for(const option of item.options.filter(o=>!item.expected.includes(o.id))){
   const word=bank.find(w=>w.id===option.id);
   assert(!word.phonemes.includes(sound==='m'?'n':'m'));
  }
  if(['CF03','SL01','SL02','SL03','CF06'].includes(activity)){
   if(item.expected.includes('m')&&!item.expected.includes('n'))assert(!item.options.some(o=>o.id==='n'));
   if(item.expected.includes('n')&&!item.expected.includes('m'))assert(!item.options.some(o=>o.id==='m'));
  }
 }
});
