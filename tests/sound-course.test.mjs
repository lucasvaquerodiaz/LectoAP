import test from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../scripts/validate-data.mjs';
import {SOUND_STEPS,makeSoundItem} from '../src/sound-course.js';

const data=await loadData();
const seeded=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

test('el recorrido oral pasa de reconocer a aislar, integrar y segmentar sin respuestas escritas',()=>{
 assert.deepEqual(SOUND_STEPS.map(s=>[s.id,s.count]),[
  ['hear',6],['place',12],['first',6],['last',6],['blend2',6],['blend3',6],['segment2',6],['segment3',6]
 ]);
 const words=new Set(data.wordAudio.map(a=>a.id));
 const syllables=new Set(data.syllableAudio.map(a=>a.unit));
 for(let step=0;step<SOUND_STEPS.length;step++)for(let index=0;index<SOUND_STEPS[step].count;index++)for(let seed=1;seed<=40;seed++){
  const item=makeSoundItem(data,step,index,[],seeded(seed+step*1000+index*100));
  assert(!item.options.some(o=>o.type==='text'));
  assert(item.kind==='sequence'?item.expected.every(p=>item.options.some(o=>o.id===p)):item.options.some(o=>o.id===item.expected));
  if(item.stimulus==='word'||item.step==='blend3')assert(words.has(item.word.id));
  if(item.stimulus==='syllable'||item.step==='blend2')assert(syllables.has(item.word.string));
  if(['blend2','blend3'].includes(item.step))assert.equal(item.options.length,3);
  if(['blend2','blend3'].includes(item.step))for(const option of item.options.filter(o=>o.id!==item.expected)){
   const other=item.step==='blend2'?data.syllables.find(s=>s.string===option.id):data.words.concat(data.oral).find(w=>w.id===option.id);
   if(item.word.phonemes.includes('m')&&!item.word.phonemes.includes('n'))assert(!(other.phonemes.includes('n')&&!other.phonemes.includes('m')));
   if(item.word.phonemes.includes('n')&&!item.word.phonemes.includes('m'))assert(!(other.phonemes.includes('m')&&!other.phonemes.includes('n')));
  }
  if(item.step==='place'){
   assert.equal(item.position,['initial','final','middle'][Math.floor(index/4)]);
   const sound=item.sounds[0],heard=item.position==='initial'?item.word.initialPhoneme===sound:item.position==='final'?item.word.finalPhoneme===sound:item.word.phonemes.slice(1,-1).includes(sound);
   assert.equal(heard,item.expected==='yes');
  }
  if(['hear','place'].includes(item.step)&&item.expected==='no'&&['m','n'].includes(item.sounds[0]))assert(!item.word.phonemes.includes(item.sounds[0]==='m'?'n':'m'));
 }
});
