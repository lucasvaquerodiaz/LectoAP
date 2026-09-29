import {DEFAULTS} from './engine.js';

export const CHILD_COURSE=[
 {activity:'CF01',position:'any'},
 {activity:'CF02',position:'any'},
 {activity:'CF03',position:'initial'},
 {activity:'CF05',position:'any'},
 {activity:'CF07',position:'initial'},
 {activity:'SL01',position:'initial'},
 {activity:'SL02',position:'initial'},
 {activity:'SL03',position:'initial'},
 {activity:'SL05',position:'initial'},
 {activity:'SL07',position:'initial'},
 {activity:'SL04',position:'initial'},
 {activity:'SL06',position:'initial'}
];

export function childConfig(index){
 const step=CHILD_COURSE[index];
 if(!step)throw Error('Actividad autónoma desconocida');
 return {...DEFAULTS,module:index<5?'CF':'SL',activity:step.activity,position:step.position,
  difficulty:'easy',count:6,audio:true,repetition:true,help:true,recordedOnly:true,
  activeLetters:DEFAULTS.activeLetters.slice(),structures:DEFAULTS.structures.slice()};
}
