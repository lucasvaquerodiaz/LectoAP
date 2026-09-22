// The only importer for V1 audio. Never reads former packages or caches.
import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export const sourceRoots={phoneme:'inputs/audio_final/fonemas',word:'inputs/audio_final/palabras'};
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const save=async(path,data)=>writeFile(path,JSON.stringify(data,null,2)+'\n');
export async function syncAudio(){
 const manifests={phoneme:await json(sourceRoots.phoneme+'/audio-manifest.json'),word:await json(sourceRoots.word+'/word-audio-manifest.json')};
 const expected={phoneme:[...'aeioulmsn'],word:(await json('data/words-v1.json')).map(w=>w.word)};
 const prepared={phoneme:[],word:[]};
 for(const kind of ['phoneme','word']){
  const rows=manifests[kind];
  if(rows.length!==expected[kind].length||new Set(rows.map(x=>x[kind])).size!==rows.length||expected[kind].some(id=>!rows.some(x=>x[kind]===id)))throw Error('Inventario definitivo incompleto o duplicado: '+kind);
  const folder=kind==='phoneme'?'phonemes':'words';
  for(const entry of rows){
   const id=entry[kind].normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   if(entry.file!==`assets/audio/${folder}/${id}.m4a`)throw Error('Correspondencia de nombre no válida: '+entry[kind]);
   const sourceFile=`${sourceRoots[kind]}/${entry.file}`,bytes=await readFile(sourceFile),hash=sha256(bytes);
   if(!bytes.includes(Buffer.from('ftyp'))||!bytes.includes(Buffer.from('mp4a')))throw Error('No es un AAC/M4A esperado: '+sourceFile);
   prepared[kind].push({bytes,entry:{...entry,id,file:`assets/audio/${folder}/${id}.${hash.slice(0,16)}.m4a`,sourceFile,sha256:hash,status:'final_v1',integration:'byte-identical authoritative final source',...(kind==='phoneme'?{graphemes:[id]}:{fallback:null,required:true})}});
  }
 }
 const fingerprint=sha256(Buffer.from(JSON.stringify(Object.values(prepared).flat().map(x=>[x.entry.sourceFile,x.entry.sha256]))));
 let verification;try{verification=await json('data/audio-verification.json');}catch{}
 if(!verification||verification.sourceFingerprint!==fingerprint)verification={sourceFingerprint:fingerprint,status:'pending_listening_confirmation',method:null,notes:'Los hashes y nombres no certifican el contenido hablado. Pendiente confirmación auditiva explícita del docente para estos archivos.'};
 for(const kind of ['phoneme','word']){
  const dir=resolve('public/assets/audio/'+(kind==='phoneme'?'phonemes':'words'));
  if(!dir.startsWith(resolve('public/assets/audio')+sep))throw Error('Destino fuera del proyecto');
  await mkdir(dir,{recursive:true});
  const allowed=new Set(prepared[kind].map(x=>x.entry.file.split('/').at(-1)));
  for(const file of await readdir(dir))if(file.endsWith('.m4a')&&!allowed.has(file))await unlink(resolve(dir,file));
  for(const {entry,bytes} of prepared[kind])await writeFile('public/'+entry.file,bytes);
 }
 const audio=prepared.phoneme.map(x=>x.entry),words=prepared.word.map(x=>x.entry);
 await save('data/audio-manifest.json',audio);await save('data/word-audio-manifest.json',words);await save('data/audio-verification.json',verification);
 const phonemes=await json('data/phonemes.json');phonemes.forEach(p=>{const a=audio.find(a=>a.phoneme===p.id);if(a)p.audio=a.file;});await save('data/phonemes.json',phonemes);
 for(const bank of ['words-v1','oral-bank-v1']){const rows=await json('data/'+bank+'.json');for(const w of rows){const a=words.find(a=>a.word===w.word);w.wordAudio=a?a.file:null;w.wordAudioRequired=!!a;}await save('data/'+bank+'.json',rows);}
 console.log(`Audio final sincronizado: ${audio.length} fonemas, ${words.length} palabras; verificación: ${verification.status}`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await syncAudio();
