// Separate namespaces: a phoneme ID can never resolve to a word recording.
export class PhonemeAudio {
 constructor(phonemes,words=[],verification={status:'pending'},syllables=[]){
  this.manifest=phonemes;this.words=words;this.syllables=syllables;this.verification=verification;
  this.context=null;this.buffers={};this.sources=[];this.token=0;this.element=null;this.cancelPending=null;
  this.pendingBytes=new Map();
 }
 entry(kind,id){
  if(this.verification.status!=='confirmed_by_teacher')throw Error('Audio pendiente de confirmación auditiva del docente.');
  const entry=(kind==='word'?this.words:kind==='syllable'?this.syllables:this.manifest).find(x=>kind==='word'?x.id===id:kind==='syllable'?x.unit===id:x.phoneme===id);
  if(!entry)throw Error(kind==='word'?'Esta palabra todavía necesita la voz del docente.':kind==='syllable'?'No hay grabación de esta unidad.':'No hay grabación de este sonido.');
  if(!entry.sourceFile.startsWith('inputs/audio_final/')||!entry.file.includes(entry.sha256.slice(0,16)))throw Error('Audio ajeno a la fuente definitiva.');
  return entry;
 }
 async unlock(){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;this.context=this.context||new C();if(this.context.state==='suspended')await this.context.resume();}
 stop(){this.token++;this.sources.forEach(s=>{try{s.stop();}catch{}});this.sources=[];if(this.element){this.element.pause();this.element=null;}if(this.cancelPending){this.cancelPending();this.cancelPending=null;}}
 async bytes(entry){
  if(!this.pendingBytes.has(entry.file))this.pendingBytes.set(entry.file,(async()=>{
   const response=await fetch(entry.file);if(!response.ok)throw Error('No se pudo cargar el audio definitivo.');
   const bytes=await response.arrayBuffer();
   if(globalThis.crypto&&crypto.subtle){const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==entry.sha256)throw Error('El audio recibido no coincide con el definitivo.');}
   return bytes;
  })().catch(e=>{this.pendingBytes.delete(entry.file);throw e;}));
  return this.pendingBytes.get(entry.file);
 }
 preload(kind,id){try{void this.bytes(this.entry(kind,id)).catch(()=>{});}catch{}}
 async buffer(entry){
  if(this.buffers[entry.file])return this.buffers[entry.file];
  const bytes=await this.bytes(entry);
  const result=await new Promise((resolve,reject)=>this.context.decodeAudioData(bytes.slice(0),resolve,reject));this.buffers[entry.file]=result;return result;
 }
 playbackSettings(buffer,entry){
  const samples=buffer.getChannelData(0),windowSize=Math.max(1,Math.floor(buffer.sampleRate*.01)),levels=[];let maximum=0;
  for(let start=0;start<samples.length;start+=windowSize){let sum=0,end=Math.min(samples.length,start+windowSize);for(let i=start;i<end;i++)sum+=samples[i]*samples[i];const level=Math.sqrt(sum/(end-start));levels.push(level);maximum=Math.max(maximum,level);}
  if(maximum<.0005)return {offset:0,duration:buffer.duration,gain:entry.playbackGain||1};
  const threshold=Math.max(.0005,maximum*.025);let first=0,last=levels.length-1;
  for(let i=0;i<levels.length-2;i++)if(levels[i]>=threshold&&levels[i+1]>=threshold&&levels[i+2]>=threshold){first=i;break;}
  for(let i=levels.length-1;i>=2;i--)if(levels[i]>=threshold&&levels[i-1]>=threshold&&levels[i-2]>=threshold){last=i;break;}
  const offset=Math.max(0,first*windowSize/buffer.sampleRate-.02),end=Math.min(buffer.duration,(last+1)*windowSize/buffer.sampleRate+.08),duration=Math.max(.05,end-offset);
  let sum=0,count=0;for(let i=Math.floor(offset*buffer.sampleRate);i<Math.min(samples.length,Math.ceil(end*buffer.sampleRate));i++){sum+=samples[i]*samples[i];count++;}
  const rms=count?Math.sqrt(sum/count):0,target=entry.phoneme?.07:.1,preferred=entry.playbackGain||1;
  return {offset,duration,gain:rms>.0005?Math.max(.65,Math.min(4,preferred*target/rms)):preferred};
 }
 play(ids,gap=.42){return this.playEntries(ids.map(id=>this.entry('phoneme',id)),gap);}
 playWord(id){return this.playEntries([this.entry('word',id)],0);}
 playSyllable(id){return this.playEntries([this.entry('syllable',id)],0);}
 async playEntries(entries,gap){
  this.stop();const token=this.token;await this.unlock();
  if(this.context){const buffers=await Promise.all(entries.map(e=>this.buffer(e)));if(token!==this.token)return;let at=this.context.currentTime+.04;for(let i=0;i<buffers.length;i++){const b=buffers[i],entry=entries[i],settings=this.playbackSettings(b,entry),source=this.context.createBufferSource();source.buffer=b;const gain=this.context.createGain(),limiter=this.context.createDynamicsCompressor();gain.gain.value=settings.gain;limiter.threshold.value=-1;limiter.knee.value=0;limiter.ratio.value=20;limiter.attack.value=.003;limiter.release.value=.15;source.connect(gain);gain.connect(limiter);limiter.connect(this.context.destination);source.start(at,settings.offset,settings.duration);this.sources.push(source);at+=settings.duration+gap;}return;}
  for(const entry of entries){
   if(token!==this.token)return;
   await new Promise((resolve,reject)=>{const a=new Audio(entry.file);this.element=a;this.cancelPending=resolve;a.onended=()=>{this.cancelPending=null;resolve();};a.onerror=()=>{this.cancelPending=null;reject(Error('No se puede reproducir el audio definitivo.'));};a.play().catch(reject);});
   if(gap&&token===this.token)await new Promise(resolve=>setTimeout(resolve,gap*1000));
  }
 }
}

