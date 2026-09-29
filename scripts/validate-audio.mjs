import {readFile,readdir} from 'node:fs/promises';
import {sha256,sourceRoots} from './sync-audio.mjs';
const specs={
 phoneme:{rows:'audio',manifest:'audio-manifest.json',key:'phoneme',folder:'phonemes'},
 word:{rows:'wordAudio',manifest:'word-audio-manifest.json',key:'word',folder:'words'},
 syllable:{rows:'syllableAudio',manifest:'syllable-audio-manifest.json',key:'unit',folder:'syllables'}
};
export async function validateAudio(data){
 const errors=[],assert=(ok,message)=>{if(!ok)errors.push(message);};
 const all=[];
 for(const [kind,spec] of Object.entries(specs)){
  const rows=data[spec.rows]||[];
  const source=JSON.parse(await readFile(sourceRoots[kind]+'/'+spec.manifest,'utf8'));
  assert(rows.length===source.length,'Inventario audio definitivo incompleto: '+kind);
  assert(new Set(rows.map(a=>a[spec.key])).size===rows.length,'IDs de audio duplicados: '+kind);
  for(const a of rows){
   const entry=source.find(x=>x[spec.key]===a[spec.key]);
   assert(!!entry,'Audio no declarado en fuente definitiva: '+a.id);if(!entry)continue;
   const authoritative=sourceRoots[kind]+'/'+entry.file;
   assert(a.sourceFile===authoritative,'Fuente no definitiva: '+a.id);
   try{
    const original=await readFile(authoritative),hash=sha256(original);
    assert(original.length>1000&&original.includes(Buffer.from('ftyp'))&&original.includes(Buffer.from('mp4a')),'AAC inválido: '+a.id);
    assert(a.sha256===hash,'Hash de fuente modificado: '+a.id);
    assert(a.file===`assets/audio/${spec.folder}/${a.id}.${hash.slice(0,16)}.m4a`,'Ruta de audio sin huella correcta: '+a.id);
    assert(sha256(await readFile('public/'+a.file))===hash,'Audio publicado distinto de fuente: '+a.id);
   }catch{errors.push('Recurso definitivo ausente: '+a.id);}
  }
  all.push(...rows);
  for(const filename of await readdir('public/assets/audio/'+spec.folder))assert(rows.some(a=>a.file===`assets/audio/${spec.folder}/${filename}`),'Audio obsoleto o no declarado en public: '+filename);
 }
 const expectedFingerprint=sha256(Buffer.from(JSON.stringify(all.map(a=>[a.sourceFile,a.sha256]))));
 assert(data.audioVerification.sourceFingerprint===expectedFingerprint,'La confirmación auditiva corresponde a otros archivos');
 assert(data.audioVerification.status==='confirmed_by_teacher','Falta confirmación auditiva del docente');
 for(const p of data.phonemes)assert(p.audio===data.audio.find(a=>a.phoneme===p.id)?.file,'Ruta de fonema desincronizada: '+p.id);
 for(const w of data.words.concat(data.oral,data.dictationWords||[])){
  const a=data.wordAudio.find(a=>a.id===w.id);
  assert(w.wordAudio===(a?a.file:null),'Palabra asociada a audio incorrecto: '+w.word);
 }
 for(const s of data.syllables){
  const a=data.syllableAudio.find(a=>a.unit===s.string);
  assert(s.syllableAudio===a?.file,'Unidad asociada a audio incorrecto: '+s.string);
 }
 return errors;
}
