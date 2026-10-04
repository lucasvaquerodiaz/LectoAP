import {DEFAULTS} from './engine.js';

export const CHILD_COURSE=[
 {activity:'SL02',position:'initial',label:'Letra y sonido',hint:'Mira la letra y escucha.',icon:'letter-sound'},
 {activity:'SL01',position:'initial',label:'Sonido y letra',hint:'Escucha y elige su letra.',icon:'sound-letter'},
 {activity:'SL03',position:'initial',label:'La letra del dibujo',hint:'Busca con qué letra empieza.',icon:'picture-letter'},
 {activity:'SL08',position:'initial',label:'Lee una sílaba',hint:'Mira dos letras y elige cómo suenan juntas.',icon:'read'},
 {activity:'SL05',position:'initial',label:'Escucha la sílaba',hint:'Escucha y coloca sus letras.',icon:'syllable'},
 {activity:'SL07',position:'initial',label:'Lee y busca',hint:'Lee y encuentra el dibujo.',icon:'read'},
 {activity:'SL04',position:'initial',label:'Construye con letras',hint:'Ordena las letras para formar.',icon:'build'},
 {activity:'SL06',position:'initial',label:'Escucha la palabra',hint:'Escucha y constrúyela.',icon:'word'}
];

export function childConfig(index){
 const step=CHILD_COURSE[index];
 if(!step)throw Error('Actividad autónoma desconocida');
 return {...DEFAULTS,module:'SL',activity:step.activity,position:step.position,
  difficulty:'easy',count:6,audio:true,repetition:true,help:true,recordedOnly:true,
  activeLetters:DEFAULTS.activeLetters.slice(),structures:DEFAULTS.structures.slice()};
}

export function childCompletion(mode,index){return mode==='course'&&index<CHILD_COURSE.length-1?'next':'menu';}
