// Oral-only practice. Child-facing screens never render graphemes or written words.
export const SOUND_STEPS=[
 {id:'hear',count:6,title:'¿Se oye el sonido?',instruction:'Reproduce el sonido y la palabra. Pregunta: «¿Oyes ese sonido en la palabra?». Puede estar en cualquier lugar.',icon:'👂'},
 {id:'place',count:12,title:'Escuchar en un lugar',instruction:'Pregunta si el sonido se oye en el lugar señalado. Los primeros cuatro juegos señalan el principio, los cuatro siguientes el final y los últimos cuatro el centro. Algunas respuestas son «no».',icon:'🔎'},
 {id:'first',count:6,title:'El primer sonido',instruction:'Di: «Escucha la palabra. ¿Cuál es el primer sonido?». El círculo de la izquierda indica el principio. Los botones de respuesta reproducen sonidos.',icon:'◉ ○ ○'},
 {id:'last',count:6,title:'El último sonido',instruction:'Di: «Ahora buscamos el sonido del final. Escucha la palabra. ¿Cuál es el último sonido?». El círculo de la derecha indica el cambio.',icon:'○ ○ ◉'},
 {id:'blend2',count:6,title:'Juntar dos sonidos',instruction:'Di: «Escucha los dos sonidos y júntalos. ¿Cuál de estas tres grabaciones suena igual?». Cada opción reproduce una sílaba completa.',icon:'● ＋ ●'},
 {id:'blend3',count:6,title:'Juntar tres sonidos',instruction:'Di: «Escucha los tres sonidos y júntalos. ¿Qué palabra forman?». El niño toca su imagen.',icon:'● ＋ ● ＋ ●'},
 {id:'segment2',count:6,title:'Separar dos sonidos',instruction:'Di: «Escucha la sílaba. Ahora coloca sus dos sonidos en el mismo orden». Cada botón de respuesta reproduce un fonema.',icon:'● → ○ ○'},
 {id:'segment3',count:6,title:'Separar tres sonidos',instruction:'Di: «Escucha la palabra. Coloca sus tres sonidos en el mismo orden». Puede volver a escuchar la palabra o los fonemas.',icon:'● → ○ ○ ○'}
];

const sample=(entries,rng)=>entries[Math.floor(rng()*entries.length)];
const shuffled=(entries,rng)=>{const result=entries.slice();for(let index=result.length-1;index>0;index--){const other=Math.floor(rng()*(index+1));[result[index],result[other]]=[result[other],result[index]];}return result;};
const otherN=(p)=>p==='m'?'n':p==='n'?'m':null;
const safeNegative=(word,p)=>!word.phonemes.includes(p)&&(!otherN(p)||!word.phonemes.includes(otherN(p)));
const wordPool=data=>{
 const recorded=new Set(data.wordAudio.map(entry=>entry.id));
 return data.words.concat(data.oral).filter(word=>recorded.has(word.id)&&word.oral&&word.image&&!word.reviewRequired&&word.priority<=1&&word.phonemeCount<=4);
};
const phonemeIds=data=>data.audio.map(entry=>entry.phoneme);
const chooseWord=(pool,recent,rng)=>sample(pool.filter(w=>!recent.includes(w.id)).length?pool.filter(w=>!recent.includes(w.id)):pool,rng);
const soundOptions=(data,expected,rng,needed=3)=>{
 const ids=phonemeIds(data),rest=ids.filter(p=>!expected.includes(p)&&!expected.some(e=>otherN(e)===p));
 if(rest.length<needed-expected.length)throw Error('Faltan sonidos para las opciones.');
 return shuffled([...new Set(expected)].concat(shuffled(rest,rng).slice(0,needed-new Set(expected).size)),rng).map(id=>({id,type:'phoneme'}));
};
export function makeSoundItem(data,stepIndex,itemIndex,recent=[],rng=Math.random){
 const step=SOUND_STEPS[stepIndex];if(!step)throw Error('Juego de sonidos desconocido.');
 const words=wordPool(data),ids=phonemeIds(data);
 if(!words.length)throw Error('No hay palabras grabadas para los juegos de sonidos.');
 const item={step:step.id,stepIndex,itemIndex,kind:'choice',options:[],expected:null,stimulus:null,word:null,sounds:[],position:'any'};
 if(step.id==='hear'||step.id==='place'){
  item.position=step.id==='hear'?'any':['initial','final','middle'][Math.floor(itemIndex/4)];
  const positive=step.id==='hear'?itemIndex%3!==2:itemIndex%4!==2;
  const pool=words.filter(w=>item.position!=='middle'||w.phonemeCount>=3);
  const possible=pool.flatMap(w=>ids.filter(p=>positive?(item.position==='any'?w.phonemes.includes(p):item.position==='initial'?w.initialPhoneme===p:item.position==='final'?w.finalPhoneme===p:w.phonemes.slice(1,-1).includes(p)):safeNegative(w,p)).map(p=>({w,p})));
  const fresh=possible.filter(({w})=>!recent.includes(w.id));const selected=sample(fresh.length?fresh:possible,rng);
  if(!selected)throw Error('Faltan contrastes grabados para reconocer sonidos.');
  item.word=selected.w;item.stimulus='word';item.sounds=[selected.p];item.expected=positive?'yes':'no';
  item.options=shuffled([{id:'yes',type:'yes'},{id:'no',type:'no'}],rng);
 }else if(step.id==='first'||step.id==='last'){
  const word=chooseWord(words.filter(w=>w.phonemes.length>=2),recent,rng);
  item.word=word;item.stimulus='word';item.position=step.id==='first'?'initial':'final';
  item.expected=step.id==='first'?word.initialPhoneme:word.finalPhoneme;
  item.options=soundOptions(data,[item.expected],rng);
 }else if(step.id==='blend2'||step.id==='segment2'){
  const recorded=new Set(data.syllableAudio.map(a=>a.unit));
  const units=data.syllables.filter(s=>s.phonemes.length===2&&recorded.has(s.string)&&s.phonemes.every(p=>ids.includes(p)));
  if(units.length<3)throw Error('Faltan sílabas grabadas para el juego.');
  const unit=chooseWord(units,recent,rng);item.word=unit;
  if(step.id==='blend2'){
   item.sounds=unit.phonemes;item.expected=unit.string;
   item.options=shuffled([unit,...shuffled(units.filter(s=>s.string!==unit.string),rng).slice(0,2)],rng).map(s=>({id:s.string,type:'syllable'}));
  }else{
   item.kind='sequence';item.stimulus='syllable';item.expected=unit.phonemes.slice();
   item.options=soundOptions(data,[...new Set(unit.phonemes)],rng,Math.max(3,new Set(unit.phonemes).size+1));
  }
 }else if(step.id==='blend3'||step.id==='segment3'){
  const pool=words.filter(w=>w.phonemeCount===3&&w.phonemes.every(p=>ids.includes(p)));
  if(pool.length<3)throw Error('Faltan palabras grabadas de tres sonidos.');
  const word=chooseWord(pool,recent,rng);item.word=word;
  if(step.id==='blend3'){
   item.sounds=word.phonemes.slice();item.expected=word.id;
   item.options=shuffled([word,...shuffled(pool.filter(w=>w.id!==word.id),rng).slice(0,2)],rng).map(w=>({id:w.id,type:'image',image:w.image}));
  }else{
   item.kind='sequence';item.stimulus='word';item.expected=word.phonemes.slice();
   item.options=soundOptions(data,[...new Set(word.phonemes)],rng,Math.max(4,new Set(word.phonemes).size+1));
  }
 }
 if(!item.options.length||!item.expected)throw Error('No se pudo crear este juego de sonidos.');
 return item;
}
