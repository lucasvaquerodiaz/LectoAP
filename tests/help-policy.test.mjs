import test from 'node:test';
import assert from 'node:assert/strict';
import {canRemoveWrongOption,POSITION_REVEAL_ATTEMPTS,shouldRevealPositions} from '../src/help-policy.js';

test('localizar sonido conserva todos los cuadros de posición y revela tras seis errores',()=>{
 const item={activity:'CF05'};
 assert.equal(canRemoveWrongOption(item),false);
 assert.equal(shouldRevealPositions(item,5),false);
 assert.equal(shouldRevealPositions(item,POSITION_REVEAL_ATTEMPTS),true);
});

test('las ayudas de elección siguen pudiendo quitar distractores',()=>{
 for(const activity of ['CF02','CF03','CF04','CF06','CF07','SL01','SL02','SL03','SL07','S+L01'])
  assert.equal(canRemoveWrongOption({activity}),true,activity);
});
