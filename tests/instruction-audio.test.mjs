import test from 'node:test';
import assert from 'node:assert/strict';
import {loadData,validateData} from '../scripts/validate-data.mjs';
import {PhonemeAudio} from '../src/audio.js';
import {SOUND_STEPS} from '../src/sound-course.js';
import {CHILD_COURSE} from '../src/child-course.js';
import {soundInstructionId,letterInstructionId} from '../src/instruction-cues.js';

const data=await loadData();

test('las 18 consignas se asocian a cada etapa y a cada juego de letras',()=>{
 const ids=new Set(data.instructionAudio.map(entry=>entry.id));
 assert.equal(ids.size,18);
 for(let step=0;step<SOUND_STEPS.length;step++)for(let item=0;item<SOUND_STEPS[step].count;item++)assert(ids.has(soundInstructionId(step,item)));
 assert.deepEqual([0,3,4,7,8,11].map(i=>soundInstructionId(1,i)),['posicion-inicio','posicion-inicio','posicion-final','posicion-final','posicion-centro','posicion-centro']);
 for(const game of CHILD_COURSE)assert(ids.has(letterInstructionId(game.activity)));
 const player=new PhonemeAudio(data.audio,data.wordAudio,data.audioVerification,data.syllableAudio,data.instructionAudio);
 for(const id of ids)assert.equal(player.entry('instruction',id).id,id);
 assert.throws(()=>player.entry('instruction','no-existe'));
});

test('cada consigna offline conserva los bytes de su fuente',async()=>{
 assert.deepEqual(await validateData(data),[]);
});
