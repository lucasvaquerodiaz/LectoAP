export const DEFAULTS = {module:'CF',activity:'CF07',activeLetters:[...'aeioulmsn'],case:'upper',count:6,difficulty:'auto',audio:true,repetition:true,help:true,position:'initial',accentSupport:false,combinedReady:false,structures:['V','CV','VC','CVC','VCV','CVV','CVCV','CVCVC','CVCVCV'],introduce:''};
export const ALL_STRUCTURES=[...DEFAULTS.structures,'VCCV','CVCCV','CVCCVC','CVCVV','CVCVVC','VCVCCV','VCVCVC','CVCVCVV'];
export const normalizeLetter=letter=>String(letter).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const shuffle=(a,rng=Math.random)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function getWords(bank,{task='oral',activeLetters=DEFAULTS.activeLetters,maxPhonemes=99,requireImage=false,accentSupport=false,structures=null}={}){
 return bank.filter(w=>w[task] && w.phonemeCount<=maxPhonemes && (!structures||structures.includes(w.structure)) && (!requireImage||w.image&&!w.reviewRequired) && (!['reading','writing'].includes(task)||w.requiredLetters.every(l=>activeLetters.some(a=>normalizeLetter(a)===normalizeLetter(l))||(l==='ó'&&activeLetters.includes('o')&&(task==='reading'||accentSupport)))) && (task!=='writing'||!w.requiresAccentSupport||accentSupport));
}
export function distance(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=0;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length];}
export const similarityStep=(index,count)=>Math.min(2,Math.floor(index*3/Math.max(1,count)));
export const safeMNContrast=(a,b)=>{
 const aM=a.phonemes.includes('m'),aN=a.phonemes.includes('n'),bM=b.phonemes.includes('m'),bN=b.phonemes.includes('n');
 return !(aM&&!aN&&bN&&!bM)&&!(aN&&!aM&&bM&&!bN);
};
export function distractors(target,pool,n,level,rng=Math.random){return shuffle(pool.filter(w=>w.id!==target.id&&w.image!==target.image&&safeMNContrast(target,w)),rng).sort((a,b)=>{
 const da=distance(target.phonemes,a.phonemes),db=distance(target.phonemes,b.phonemes);
 if(level===0)return Number(a.initialPhoneme===target.initialPhoneme)-Number(b.initialPhoneme===target.initialPhoneme)||db-da;
 if(level===2)return da-db||Number(b.initialPhoneme===target.initialPhoneme)-Number(a.initialPhoneme===target.initialPhoneme);
 return Math.abs(da-2)-Math.abs(db-2);
}).slice(0,n);}
export function adaptiveState(difficulty='auto'){return {level:difficulty==='hard'?2:difficulty==='medium'?1:0,recent:[],sinceChange:0,reason:'Inicio',dimension:'distractorSimilarity'};}
export function adapt(state,correct,automatic=true){const next={...state,recent:state.recent.concat(!!correct).slice(-10),sinceChange:state.sinceChange+1};if(!automatic||next.recent.length<5)return next;const rate=next.recent.filter(Boolean).length/next.recent.length;if(rate<=.4&&next.level>0){next.level=0;next.sinceChange=0;next.reason='Simplificación clara de una dimensión';}else if(next.sinceChange>=5&&rate<.6&&next.level>0){next.level--;next.sinceChange=0;next.reason='Simplificar una dimensión';}else if(next.sinceChange>=5&&rate>.9&&next.level<2){next.level++;next.sinceChange=0;next.reason='Aumentar una dimensión';}return next;}
const positions=(w,p,position)=>position==='initial'?w.initialPhoneme===p:position==='final'?w.finalPhoneme===p:w.phonemes.includes(p);
const makeOption=(id,label,type='text')=>({id:String(id),label:String(label),type});
const imageOption=w=>({id:w.id,label:w.word,type:'image',image:w.image});
const easyMNFilter=(options,expected)=>{
 const correct=new Set(expected.map(normalizeLetter));
 if(correct.has('m')&&!correct.has('n'))return options.filter(o=>o.id!=='n');
 if(correct.has('n')&&!correct.has('m'))return options.filter(o=>o.id!=='m');
 return options;
};
const relatedSymbol=(a,b)=>'aeiou'.includes(normalizeLetter(a))==='aeiou'.includes(normalizeLetter(b));
const rankedSymbols=(options,expected,similarity,rng)=>{
 const reference=expected[0];
 return shuffle(options,rng).sort((a,b)=>similarity===0?Number(relatedSymbol(reference,a.id))-Number(relatedSymbol(reference,b.id)):similarity===2?Number(relatedSymbol(reference,b.id))-Number(relatedSymbol(reference,a.id)):0);
};
export function validateItem(item){
 if(!item||!item.expected.length)throw Error('Ítem sin respuesta');
 if(new Set(item.options.map(o=>o.id)).size!==item.options.length)throw Error('Distractores idénticos');
 if(item.options.filter(o=>o.type==='image').some((o,i,a)=>a.findIndex(x=>x.image===o.image)!==i))throw Error('Imágenes duplicadas');
 if(item.expected.some(x=>!item.options.some(o=>o.id===String(x))))throw Error('Respuesta ausente');
 if(!['multi','sequence'].includes(item.response)&&item.expected.length!==1)throw Error('Más de una respuesta');
 return item;
}
export function isCorrect(item,answer){return item.response==='sequence'?JSON.stringify(answer)===JSON.stringify(item.expected):JSON.stringify(answer.slice().sort())===JSON.stringify(item.expected.slice().sort());}
export function createSession(config){return {config:{...DEFAULTS,...config},adaptive:adaptiveState(config.difficulty),history:[],responses:[],introCount:0};}
export function generateItem(data,session,rng=Math.random){
 const c=session.config,activity=data.activities.find(x=>x.id===c.activity);if(!activity)throw Error('Actividad desconocida');
 if(activity.module==='COMBO'&&!c.combinedReady)throw Error('Confirma en modo docente que ya se trabajaron conciencia fonémica y correspondencias.');
 const enabledGraphemes=data.graphemes.filter(g=>c.activeLetters.includes(g.id));
 const level=session.adaptive.level,similarity=similarityStep(session.history.length,c.count),active=[...new Set(enabledGraphemes.flatMap(g=>g.phonemes))].filter(x=>data.phonemes.some(p=>p.id===x));
 if(active.length<2)throw Error('Activa al menos dos fonemas para ofrecer alternativas.');
 const written=activity.module==='SL'||activity.module==='COMBO';
 const task=written?(['SL04','SL05','SL06'].includes(c.activity)?'writing':'reading'):'oral';
 const max=c.difficulty==='hard'?6:c.difficulty==='medium'?5:4;
 const fullBank=c.activity==='SL06'?data.words.concat(data.dictationWords||[]):data.words.concat(written?[]:data.oral);
 const recorded=new Set(data.wordAudio.map(a=>a.id));
 const bank=c.recordedOnly?fullBank.filter(w=>recorded.has(w.id)):fullBank;
 let pool=getWords(bank,{task,activeLetters:c.activeLetters,accentSupport:c.accentSupport,maxPhonemes:max,structures:c.structures}).filter(w=>w.priority<=(c.difficulty==='hard'?3:c.difficulty==='medium'?3:1));
 const imagePool=pool.filter(w=>w.image&&!w.reviewRequired);
 let targets=pool;
 if(['CF01','CF02','CF03','CF04','CF05','CF06','CF07','CF08','SL03','SL04','SL07','S+L01','VOC01','VOC02'].includes(c.activity))targets=imagePool;
 if(['CF06','CF07','SL06'].includes(c.activity))targets=targets.filter(w=>w.phonemes.every(p=>active.includes(p)));
 if(c.activity==='CF06')targets=targets.filter(w=>w.segmentation);
 if(c.activity==='CF07')targets=targets.filter(w=>w.blending);
 if(c.activity==='SL05')targets=getWords(data.syllables,{task:'writing',activeLetters:c.activeLetters,structures:c.structures});
 if(c.activity==='SL08')targets=getWords(data.syllables,{task:'reading',activeLetters:c.activeLetters,structures:c.structures}).filter(s=>s.phonemeCount===2&&data.syllableAudio.some(a=>a.unit===s.string));
 if(c.activity==='SL01')targets=active.map(p=>({id:p,word:p,phonemes:[p],graphemes:enabledGraphemes.filter(g=>g.phonemes.includes(p)&&!g.contextRequired).map(g=>g.id),structure:'aeiou'.includes(p)?'V':'C',initialPhoneme:p,finalPhoneme:p})).filter(t=>t.graphemes.length);
 if(c.activity==='SL02')targets=enabledGraphemes.filter(g=>g.phonemes.length===1&&!g.contextRequired&&active.includes(g.phonemes[0])).map(g=>({id:g.id,word:g.display,phonemes:g.phonemes,graphemes:[g.id],structure:'aeiou'.includes(g.phonemes[0])?'V':'C'}));
 if(c.activity==='CF04')targets=targets.filter(w=>w.phonemeCount<=5);
 if(c.activity==='VOC02')targets=targets.filter(w=>data.vocabulary.some(v=>v.wordId===w.id));
 const order=shuffle(targets,rng);const counts={};session.history.forEach(x=>counts[x.structure]=(counts[x.structure]||0)+1);
 const intro=c.introduce&&session.introCount<3;const last=session.history[session.history.length-1];
 if(intro&&!targets.some(w=>w.structure===c.introduce))throw Error('La estructura que quieres introducir no tiene estímulos compatibles en esta actividad. Cambia la estructura o los filtros.');
 order.sort((a,b)=>{if(intro)return Number(b.structure===c.introduce)-Number(a.structure===c.introduce);return ((counts[a.structure]||0)-(counts[b.structure]||0))*10+Number(a.id===last?.targetId)-Number(b.id===last?.targetId);});
 let lastError='No hay palabras compatibles con las letras y estructuras activas.';
 for(const target of order){
  try{
   const item={activity:c.activity,module:activity.module,response:activity.response,target,structure:target.structure,options:[],expected:[],prompt:'',audio:[],wordAudioHelp:activity.wordAudioHelp,level,similarityLevel:similarity,teacher:target.word};
   const phonemeOpts=shuffle(active,rng).map(p=>makeOption(p,'Escuchar','audio'));
   const letterOpts=shuffle(enabledGraphemes,rng).map(g=>makeOption(g.id,g.display));
   const imageChoices=(t=target)=>{const ds=distractors(t,imagePool,2,similarity,rng);if(ds.length<2)throw Error('Se necesitan tres imágenes compatibles.');item.options=shuffle([t,...ds],rng).map(imageOption);item.expected=[t.id];};
   let p;
   switch(c.activity){
    case 'CF01': p=shuffle(active.filter(sound=>!['m','n'].includes(sound)||target.phonemes.includes(sound)||!target.phonemes.includes(sound==='m'?'n':'m')),rng)[0];if(!p)throw Error('No hay contraste claro entre M y N.');item.audio=[p];item.prompt='¿Oyes este sonido en la palabra?';item.options=shuffle([makeOption('yes','Sí'),makeOption('no','No')],rng);item.expected=[target.phonemes.includes(p)?'yes':'no'];break;
    case 'CF02':{const safeNo=sound=>imagePool.filter(w=>!positions(w,sound,c.position)&&(!['m','n'].includes(sound)||!w.phonemes.includes(sound==='m'?'n':'m')));p=shuffle(active.filter(sound=>imagePool.some(w=>positions(w,sound,c.position))&&safeNo(sound).length>=2),rng)[0];if(!p)throw Error('No hay contraste para esta posición.');item.audio=[p];item.prompt=c.position==='initial'?'Busca las que empiezan por este sonido.':c.position==='final'?'Busca las que acaban en este sonido.':'Busca las que tienen este sonido.';const yes=shuffle(imagePool.filter(w=>positions(w,p,c.position)),rng).slice(0,2);const no=distractors(yes[0],safeNo(p),2,similarity,rng);item.options=shuffle(yes.concat(no),rng).map(imageOption);item.expected=yes.map(w=>w.id);item.teacher='Nombra las imágenes de izquierda a derecha: '+item.options.map(o=>o.label).join(', ');break;}
    case 'CF03':p=c.position==='final'?target.finalPhoneme:target.initialPhoneme;if(!active.includes(p))throw Error('Sonido no activo');item.prompt=c.position==='final'?'¿Cuál es el último sonido?':'¿Cuál es el primer sonido?';item.options=phonemeOpts;item.expected=[p];break;
    case 'CF04':{item.prompt='¿Cuántos sonidos tiene?';const wrong=shuffle([1,2,3,4,5].filter(x=>x!==target.phonemeCount),rng).sort((a,b)=>similarity===0?Math.abs(b-target.phonemeCount)-Math.abs(a-target.phonemeCount):similarity===2?Math.abs(a-target.phonemeCount)-Math.abs(b-target.phonemeCount):Math.abs(Math.abs(a-target.phonemeCount)-2)-Math.abs(Math.abs(b-target.phonemeCount)-2));item.options=shuffle([target.phonemeCount,...wrong.slice(0,2)].map(x=>makeOption(x,x)),rng);item.expected=[String(target.phonemeCount)];break;}
    case 'CF05':p=shuffle(target.phonemes.filter(p=>active.includes(p)),rng)[0];if(!p)throw Error('Sin fonema activo');item.audio=[p];item.prompt='Toca los lugares de este sonido.';item.options=target.phonemes.map((_,i)=>makeOption(i,'','box'));item.expected=target.phonemePositions[p].map(String);break;
    case 'CF06':item.prompt='Escucha, elige y coloca un sonido en cada caja.';item.expected=target.phonemes;item.options=shuffle(phonemeOpts.filter(o=>target.phonemes.includes(o.id)).concat(rankedSymbols(easyMNFilter(phonemeOpts.filter(o=>!target.phonemes.includes(o.id)),item.expected),item.expected,similarity,rng).slice(0,1+similarity)),rng);break;
    case 'CF07':item.prompt='Une los sonidos. ¿Qué palabra es?';item.audio=target.phonemes;imageChoices();break;
    case 'CF08':{const rows=data.relations.manipulations.filter(r=>r.from===target.id&&imagePool.some(w=>w.id===r.to)&&active.includes(r.phoneme));if(!rows.length)throw Error('No hay cambio compatible.');const row=rows[0],to=imagePool.find(w=>w.id===row.to);item.prompt='Escucha la palabra. Cambia el sonido '+(row.index+1)+' por el que se escucha. ¿Qué palabra queda?';item.teacher=`Di ${target.word}. Sustituye el sonido ${row.index+1} por el que se escucha.`;item.audio=[row.phoneme];imageChoices(to);break;}
    case 'SL01':item.prompt=target.graphemes.length>1?'Escucha y elige las letras que representan este sonido.':'Escucha y elige la letra.';item.audio=target.phonemes;item.options=letterOpts.filter(o=>!enabledGraphemes.find(g=>g.id===o.id).contextRequired);item.expected=target.graphemes;if(item.expected.length>1)item.response='multi';break;
    case 'SL02':item.prompt='¿Cómo suena esta letra?';item.display=target.word;item.options=phonemeOpts;item.expected=target.phonemes;break;
    case 'SL03':p=target.graphemes[0];if(!c.activeLetters.includes(p))throw Error('Letra no activa');item.prompt='¿Con qué letra empieza?';item.options=letterOpts;item.expected=[p];break;
    case 'SL04':case 'SL05':case 'SL06':{item.prompt=c.activity==='SL04'?'Construye la palabra.':c.activity==='SL05'?'Escucha y construye la sílaba.':'Escucha y construye la palabra.';item.audio=c.activity==='SL04'?[]:target.phonemes;item.expected=target.graphemes;const correct=[...new Set(target.graphemes)];const wrong=rankedSymbols(easyMNFilter(letterOpts.filter(o=>!correct.includes(o.id)),correct),correct,similarity,rng).slice(0,similarity);item.options=shuffle(correct.map(g=>makeOption(g,g)).concat(wrong),rng);break;}
    case 'SL07':item.prompt='Lee y elige la imagen.';item.display=target.word;imageChoices();break;
    case 'SL08':{item.prompt='Lee la sílaba y elige cómo suena.';item.display=target.string;const other=getWords(data.syllables,{task:'reading',activeLetters:c.activeLetters,structures:c.structures}).filter(s=>s.phonemeCount===2&&s.string!==target.string&&data.syllableAudio.some(a=>a.unit===s.string));const ds=shuffle(other.filter(s=>safeMNContrast(target,s)),rng).sort((a,b)=>{const da=distance(target.phonemes,a.phonemes),db=distance(target.phonemes,b.phonemes);return similarity===0?db-da:similarity===2?da-db:Math.abs(da-2)-Math.abs(db-2);}).slice(0,2);if(ds.length<2)throw Error('Faltan sílabas grabadas para comparar.');item.options=shuffle([target,...ds],rng).map(s=>makeOption(s.string,'Escuchar','syllable'));item.expected=[target.string];break;}
    case 'S+L01':{const targetLetters=new Set(target.graphemes.map(normalizeLetter));const other=shuffle(imagePool.filter(w=>w.id!==target.id&&w.graphemes.some(g=>targetLetters.has(normalizeLetter(g)))),rng)[0];if(!other)throw Error('Falta pareja');item.prompt='Elige todas las letras que comparten.';item.pair=[target,other];const letters=[...new Set(target.graphemes.concat(other.graphemes).map(normalizeLetter))];item.options=shuffle(letters,rng).map(g=>makeOption(g,g));item.expected=[...new Set(target.graphemes.filter(g=>other.graphemes.some(h=>normalizeLetter(h)===normalizeLetter(g))).map(normalizeLetter))];break;}
    case 'S+L02':{const rows=data.relations.additions.filter(r=>r.phonemesTo.every(p=>active.includes(p)));if(!rows.length)throw Error('Falta pareja de adición compatible');const row=rows[0];item.prompt='¿Qué letra se añadió?';item.display=row.from+' → '+row.to;item.options=letterOpts;item.expected=[row.added];break;}
    case 'S+L03':{const row=data.relations.changes.find(([a,b])=>a===target.id&&pool.some(w=>w.id===b));if(!row)throw Error('Falta pareja de cambio');const to=pool.find(w=>w.id===row[1]);const index=target.phonemes.findIndex((p,i)=>p!==to.phonemes[i]);item.prompt='¿Qué letra aparece en el lugar de la anterior?';item.display=target.word+' → '+to.word;item.options=letterOpts;item.expected=[to.graphemes[index]];break;}
    case 'VOC01':item.prompt='Escucha la palabra y elige la imagen.';imageChoices();break;
    case 'VOC02':item.teacher=data.vocabulary.find(v=>v.wordId===target.id).prompt;item.prompt=item.teacher;imageChoices();break;
    default:throw Error('Motor no implementado');
   }
   if(['CF03','SL01','SL02','SL03','S+L03'].includes(c.activity)){
    const correct=item.options.filter(o=>item.expected.includes(o.id));
    const wrong=easyMNFilter(item.options.filter(o=>!item.expected.includes(o.id)),item.expected);
    item.options=shuffle(correct.concat(rankedSymbols(wrong,item.expected,similarity,rng).slice(0,level+2)),rng);
    item.adaptiveDimension='optionCount';
   }else item.adaptiveDimension=c.activity==='CF06'?'optionCount':'distractorSimilarity';
   if(c.activity==='CF06')item.options=easyMNFilter(item.options,item.expected);
   item.showImage=['CF01','CF03','CF04','CF05','CF06','SL03','SL04'].includes(c.activity);
   if(['SL05','SL06'].includes(c.activity))item.audio=[]; // Recorded unit or word is the dictation stimulus.
   validateItem(item);return item;
  }catch(e){lastError=e.message;}
 }
 throw Error(lastError+' Ajusta el modo docente.');
}
export function recordResponse(session,item,correct){session.history.push({targetId:item.target.id,structure:item.structure,level:item.level});session.responses.push(!!correct);session.introCount++;session.adaptive=adapt(session.adaptive,correct,session.config.difficulty==='auto');}
