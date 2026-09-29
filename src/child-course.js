import {DEFAULTS} from './engine.js';

export const CHILD_COURSE=[
 {activity:'CF01',position:'any',label:'¿Oyes este sonido?',hint:'Escucha y descubre si suena.',icon:'hear'},
 {activity:'CF02',position:'any',label:'Busca en los dibujos',hint:'Elige los dibujos que tienen el sonido.',icon:'search'},
 {activity:'CF03',position:'initial',label:'El primer sonido',hint:'Escucha cómo empieza.',icon:'first'},
 {activity:'CF05',position:'any',label:'¿Dónde suena?',hint:'Toca los lugares donde lo oyes.',icon:'position'},
 {activity:'CF07',position:'initial',label:'La palabra secreta',hint:'Une los sonidos para descubrirla.',icon:'secret'},
 {activity:'SL01',position:'initial',label:'Sonido y letra',hint:'Escucha y elige su letra.',icon:'sound-letter'},
 {activity:'SL02',position:'initial',label:'Letra y sonido',hint:'Mira la letra y escucha.',icon:'letter-sound'},
 {activity:'SL03',position:'initial',label:'La letra del dibujo',hint:'Busca con qué letra empieza.',icon:'picture-letter'},
 {activity:'SL05',position:'initial',label:'Escucha la sílaba',hint:'Escucha y coloca sus letras.',icon:'syllable'},
 {activity:'SL07',position:'initial',label:'Lee y busca',hint:'Lee y encuentra el dibujo.',icon:'read'},
 {activity:'SL04',position:'initial',label:'Construye con letras',hint:'Ordena las letras para formar.',icon:'build'},
 {activity:'SL06',position:'initial',label:'Escucha la palabra',hint:'Escucha y constrúyela.',icon:'word'}
];

export function childConfig(index){
 const step=CHILD_COURSE[index];
 if(!step)throw Error('Actividad autónoma desconocida');
 return {...DEFAULTS,module:index<5?'CF':'SL',activity:step.activity,position:step.position,
  difficulty:'easy',count:6,audio:true,repetition:true,help:true,recordedOnly:true,
  activeLetters:DEFAULTS.activeLetters.slice(),structures:DEFAULTS.structures.slice()};
}

export function childCompletion(mode,index){return mode==='course'&&index<CHILD_COURSE.length-1?'next':'menu';}

