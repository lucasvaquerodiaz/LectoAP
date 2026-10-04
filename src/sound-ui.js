import {SOUND_STEPS,makeSoundItem} from './sound-course.js';

const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const circles=(active,total=3)=>`<div class="sc-circles" aria-hidden="true">${Array.from({length:total},(_,index)=>`<span class="${active===index?'on':''}"></span>`).join('')}</div>`;
const symbol=item=>{
 if(item.step==='hear')return `<div class="sc-lens" aria-hidden="true">${circles(-1)}</div>`;
 if(item.step==='place'||item.step==='first'||item.step==='last')return circles(item.position==='initial'?0:item.position==='middle'?1:2);
 if(item.step.startsWith('blend'))return `<div class="sc-flow" aria-hidden="true">${circles(-1,item.sounds.length)}<span>→</span><span class="sc-flow-result">◯</span></div>`;
 return `<div class="sc-flow" aria-hidden="true"><span class="sc-flow-result">●</span><span>→</span>${circles(-1,item.expected.length)}</div>`;
};

export function startSoundCourse({root,data,player,onExit,startStep=0,single=false}){
 let stepIndex=startStep,itemIndex=0,item=null,answer=[],attempts=0,resolved=false,revealed=false,timer=null,closed=false;
 const recent=[];
 const stop=()=>{closed=true;clearTimeout(timer);player.stop();root.onclick=null;};
 const exit=()=>{stop();onExit();};
 const frame=(body,adult=false)=>{
  root.innerHTML=`<div class="sound-course ${adult?'sound-course-adult':'sound-course-child'}"><header class="sc-header"><span class="sc-mark" aria-hidden="true">👂</span><button class="sc-exit" data-sc="exit" aria-label="Salir al menú">⌂</button></header><main class="sc-main">${body}</main></div>`;
  root.onclick=event=>{
   const control=event.target.closest('[data-sc]');if(!control||!root.contains(control))return;
   const action=control.dataset.sc;
   if(action==='exit')exit();
   else if(action==='begin')begin();
   else if(action==='sound')void playSound();
   else if(action==='stimulus')void playStimulus();
   else if(action==='option-play')void playOption(control.dataset.id);
   else if(action==='choose')choose(control.dataset.id);
   else if(action==='skip')skipStep();
   else if(action==='remove')remove(Number(control.dataset.index));
   else if(action==='clear'){answer=[];render();}
  };
 };
 const guide=()=>{
  if(closed)return;
  frame(`<section class="sc-guide"><span class="eyebrow">SOLO PARA EL ADULTO</span><h1>Guía de los juegos de sonidos</h1><p>Lee las consignas al niño al empezar cada etapa. La pantalla de juego cambia de icono y avanza automáticamente.</p><ol class="sc-guide-list">${(single?[SOUND_STEPS[stepIndex]]:SOUND_STEPS).map(step=>`<li><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.instruction)}</span></li>`).join('')}</ol><p class="footnote">Después de pulsar «Empezar», en la pantalla del niño solo habrá imágenes, círculos e iconos.</p><button class="primary" data-sc="begin">Empezar ${single?'el juego':'el recorrido'} ▶</button></section>`,true);
 };
 const preload=()=>{
  item.sounds.forEach(id=>player.preload('phoneme',id));
  if(item.stimulus==='word')player.preload('word',item.word.id);
  if(item.stimulus==='syllable')player.preload('syllable',item.word.string);
  item.options.forEach(option=>{if(option.type==='phoneme')player.preload('phoneme',option.id);if(option.type==='syllable')player.preload('syllable',option.id);});
 };
 const begin=()=>{
  if(closed)return;
  answer=[];attempts=0;resolved=false;revealed=false;
  item=makeSoundItem(data,stepIndex,itemIndex,recent);
  preload();render();
 };
 const next=()=>{
  if(closed)return;
  player.stop();recent.push(item.word.id);if(recent.length>3)recent.shift();
  itemIndex++;
  if(itemIndex>=SOUND_STEPS[stepIndex].count){if(single){finish();return;}stepIndex++;itemIndex=0;recent.length=0;if(stepIndex>=SOUND_STEPS.length){finish();return;}transition();return;}
  begin();
 };
 const skipStep=()=>{
  if(single||closed)return;
  clearTimeout(timer);player.stop();stepIndex++;itemIndex=0;recent.length=0;
  if(stepIndex>=SOUND_STEPS.length)finish();else transition();
 };
 const finish=()=>frame(`<section class="sc-finish" aria-label="Recorrido de sonidos terminado"><div aria-hidden="true">★</div><button class="primary" data-sc="exit" aria-label="Volver al menú">⌂</button></section>`);
 const transition=()=>{frame(`<section class="sc-transition" aria-label="Nueva etapa de sonidos"><div aria-hidden="true">${SOUND_STEPS[stepIndex].icon}</div></section>`);timer=setTimeout(begin,1800);};
 const playSound=async()=>{try{await player.play(item.sounds);}catch{audioError();}};
 const playStimulus=async()=>{try{if(item.stimulus==='syllable')await player.playSyllable(item.word.string);else await player.playWord(item.word.id);}catch{audioError();}};
 const playOption=async id=>{try{const option=item.options.find(option=>option.id===id);if(!option)return;if(option.type==='syllable')await player.playSyllable(id);else if(option.type==='phoneme')await player.play([id]);}catch{audioError();}};
 const audioError=()=>{const status=root.querySelector('.sc-feedback');if(status){status.textContent='⚠';status.setAttribute('aria-label','No se pudo reproducir el audio. Pide ayuda al adulto.');}};
 const choose=id=>{
  if(resolved)return;
  if(item.kind==='sequence'){
   if(answer.length<item.expected.length)answer.push(id);
   if(answer.length===item.expected.length)check();else render();
  }else{answer=[id];check();}
 };
 const remove=index=>{if(resolved)return;answer.splice(index,1);render();};
 const check=()=>{
  attempts++;
  const correct=item.kind==='sequence'?JSON.stringify(answer)===JSON.stringify(item.expected):answer[0]===item.expected;
  if(correct||attempts>=6){resolved=true;revealed=!correct;answer=Array.isArray(item.expected)?item.expected.slice():[item.expected];render();timer=setTimeout(next,revealed?2400:1500);return;}
  if(item.kind==='sequence')answer=[];
  render(true);
 };
 const render=(wrong=false)=>{
  if(closed)return;
  const step=SOUND_STEPS[stepIndex],progress=Array.from({length:step.count},(_,index)=>`<span class="${index<itemIndex?'done':index===itemIndex?'now':''}"></span>`).join('');
  const soundButton=item.sounds.length?`<button class="sc-play sc-target-sound" data-sc="sound" aria-label="Escuchar ${item.sounds.length===1?'el sonido':'los sonidos separados'}">▶ <span aria-hidden="true">♫</span></button>`:'';
  const stimulusButton=item.stimulus?`<div class="sc-stimulus">${item.stimulus==='word'?`<img src="${escapeHtml(item.word.image)}" alt="">`:''}<button class="sc-play" data-sc="stimulus" aria-label="Escuchar ${item.stimulus==='word'?'la palabra':'la sílaba'}">▶</button></div>`:'';
  const options=item.options.map(option=>{
   const chosen=answer.includes(option.id),correctAnswer=resolved&&(Array.isArray(item.expected)?item.expected.includes(option.id):item.expected===option.id);
   if(option.type==='image')return `<button class="sc-picture ${correctAnswer?'sc-correct':''}" data-sc="choose" data-id="${escapeHtml(option.id)}" aria-label="Elegir imagen"><img src="${escapeHtml(option.image)}" alt=""></button>`;
   if(option.type==='yes'||option.type==='no')return `<button class="sc-binary ${option.type==='yes'?'sc-yes':'sc-no'} ${correctAnswer?'sc-correct':''}" data-sc="choose" data-id="${option.id}" aria-label="${option.type==='yes'?'Sí, se oye':'No se oye'}">${option.type==='yes'?'✓':'×'}</button>`;
   return `<div class="sc-audio-option ${chosen?'sc-chosen':''} ${correctAnswer?'sc-correct':''}"><button data-sc="option-play" data-id="${escapeHtml(option.id)}" aria-label="Escuchar esta opción">▶</button><button data-sc="choose" data-id="${escapeHtml(option.id)}" aria-label="Elegir esta opción">↑</button></div>`;
  }).join('');
  const slots=item.kind==='sequence'?`<div class="sc-slots">${item.expected.map((_,index)=>`<button data-sc="remove" data-index="${index}" aria-label="Quitar sonido ${index+1}" ${index>=answer.length?'disabled':''}>${index<answer.length?'●':'○'}</button>`).join('')}</div>${answer.length&&!resolved?'<button class="sc-clear" data-sc="clear" aria-label="Borrar la respuesta">↶</button>':''}`:'';
  const feedback=resolved?(revealed?'◉':'✓'):wrong?'×':'';
  frame(`<section class="sc-activity" aria-label="Juego de sonidos">${single?'':`<div class="sc-stage-progress" aria-label="Etapa ${stepIndex+1} de ${SOUND_STEPS.length}">${Array.from({length:SOUND_STEPS.length},(_,index)=>`<span class="${index<stepIndex?'done':index===stepIndex?'now':''}"></span>`).join('')}</div><button class="sc-skip" data-sc="skip" aria-label="Pasar a la siguiente tarea">Siguiente tarea →</button>`}<div class="sc-item-progress" aria-label="Juego ${itemIndex+1} de ${step.count}">${progress}</div><div class="sc-symbol">${symbol(item)}</div><div class="sc-inputs">${soundButton}${stimulusButton}</div>${slots}<div class="sc-options">${options}</div><div class="sc-feedback ${resolved&&!revealed?'success':wrong?'mistake':''}" aria-live="polite" aria-label="${resolved?revealed?'Respuesta mostrada':'Correcto':wrong?'Prueba otra vez':''}">${feedback}</div></section>`);
 };
 guide();
 return {stop};
}
