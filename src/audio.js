// Separate namespaces: a phoneme ID can never resolve to a word recording.
export class PhonemeAudio {
 constructor(phonemes,words=[],verification={status:'pending'}){
  this.manifest=phonemes;this.words=words;this.verification=verification;
  this.context=null;this.buffers={};this.sources=[];this.token=0;this.element=null;this.cancelPending=null;
 }
 entry(kind,id){
  if(this.verification.status!=='confirmed_by_teacher')throw Error('Audio pendiente de confirmación auditiva del docente.');
  const entry=(kind==='word'?this.words:this.manifest).find(x=>kind==='word'?x.id===id:x.phoneme===id);
  if(!entry)throw Error(kind==='word'?'Esta palabra todavía necesita la voz del docente.':'No hay grabación de este sonido.');
  if(!entry.sourceFile.startsWith('inputs/audio_final/')||!entry.file.includes(entry.sha256.slice(0,16)))throw Error('Audio ajeno a la fuente definitiva.');
  return entry;
 }
 async unlock(){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;this.context=this.context||new C();if(this.context.state==='suspended')await this.context.resume();}
 stop(){this.token++;this.sources.forEach(s=>{try{s.stop();}catch{}});this.sources=[];if(this.element){this.element.pause();this.element=null;}if(this.cancelPending){this.cancelPending();this.cancelPending=null;}}
 async buffer(entry){
  if(this.buffers[entry.file])return this.buffers[entry.file];
  const response=await fetch(entry.file);if(!response.ok)throw Error('No se pudo cargar el audio definitivo.');
  const bytes=await response.arrayBuffer();
  if(globalThis.crypto&&crypto.subtle){const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==entry.sha256)throw Error('El audio recibido no coincide con el definitivo.');}
  const result=await new Promise((resolve,reject)=>this.context.decodeAudioData(bytes,resolve,reject));this.buffers[entry.file]=result;return result;
 }
 play(ids,gap=.42){return this.playEntries(ids.map(id=>this.entry('phoneme',id)),gap);}
 playWord(id){return this.playEntries([this.entry('word',id)],0);}
 async playEntries(entries,gap){
  this.stop();const token=this.token;await this.unlock();
  if(this.context){const buffers=await Promise.all(entries.map(e=>this.buffer(e)));if(token!==this.token)return;let at=this.context.currentTime+.04;for(const b of buffers){const source=this.context.createBufferSource();source.buffer=b;source.connect(this.context.destination);source.start(at);this.sources.push(source);at+=b.duration+gap;}return;}
  for(const entry of entries){
   if(token!==this.token)return;
   await new Promise((resolve,reject)=>{const a=new Audio(entry.file);this.element=a;this.cancelPending=resolve;a.onended=()=>{this.cancelPending=null;resolve();};a.onerror=()=>{this.cancelPending=null;reject(Error('No se puede reproducir el audio definitivo.'));};a.play().catch(reject);});
   if(gap&&token===this.token)await new Promise(resolve=>setTimeout(resolve,gap*1000));
  }
 }
}
