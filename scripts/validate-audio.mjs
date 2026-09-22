import {readFile,readdir} from 'node:fs/promises';
import {sha256,sourceRoots} from './sync-audio.mjs';
export async function validateAudio(data){
 const errors=[],all=[...data.audio,...data.wordAudio];
 const assert=(ok,message)=>{if(!ok)errors.push(message);};
 for(const [kind,rows] of [['phoneme',data.audio],['word',data.wordAudio]]){
  const source=JSON.parse(await readFile(sourceRoots[kind]+'/'+(kind==='word'?'word-audio-manifest':'audio-manifest')+'.json','utf8'));
  assert(rows.length===source.length,'Inventario audio definitivo incompleto: '+kind);
  assert(new Set(rows.map(a=>a[kind])).size===rows.length,'IDs de audio duplicados: '+kind);
  for(const a of rows){
   const entry=source.find(x=>x[kind]===a[kind]);
   assert(!!entry,'Audio no declarado en fuente definitiva: '+a.id);if(!entry)continue;
   const authoritative=sourceRoots[kind]+'/'+entry.file;
   assert(a.sourceFile===authoritative,'Fuente no definitiva: '+a.id);
   try{const hash=sha256(await readFile(authoritative));assert(a.sha256===hash,'Hash de fuente modificado: '+a.id);assert(a.file===`assets/audio/${kind==='word'?'words':'phonemes'}/${a.id}.${hash.slice(0,16)}.m4a`,'Ruta de audio sin huella correcta: '+a.id);assert(sha256(await readFile('public/'+a.file))===hash,'Audio publicado distinto de fuente: '+a.id);}catch{errors.push('Recurso definitivo ausente: '+a.id);}
  }
 }
 const expectedFingerprint=sha256(Buffer.from(JSON.stringify(all.map(a=>[a.sourceFile,a.sha256]))));
 assert(data.audioVerification.sourceFingerprint===expectedFingerprint,'La confirmación auditiva corresponde a otros archivos');
 assert(data.audioVerification.status==='confirmed_by_teacher','Falta confirmación auditiva del docente');
 for(const p of data.phonemes)assert(p.audio===data.audio.find(a=>a.phoneme===p.id)?.file,'Ruta de fonema desincronizada: '+p.id);
 for(const w of data.words.concat(data.oral)){const a=data.wordAudio.find(a=>a.word===w.word);assert(w.wordAudio===(a?a.file:null),'Palabra asociada a audio incorrecto: '+w.word);}
 for(const dir of ['phonemes','words'])for(const filename of await readdir('public/assets/audio/'+dir))assert(all.some(a=>a.file===`assets/audio/${dir}/${filename}`),'Audio obsoleto o no declarado en public: '+filename);
 return errors;
}
