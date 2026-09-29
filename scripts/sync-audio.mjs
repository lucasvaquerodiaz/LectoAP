// Import only recordings from the teacher's final input folders.
import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export const sourceRoots={phoneme:'inputs/audio_final/fonemas',word:'inputs/audio_final/palabras',syllable:'inputs/audio_final/palabras'};
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const save=async(path,data)=>writeFile(path,JSON.stringify(data,null,2)+'\n');
const specs={
 phoneme:{manifest:'audio-manifest.json',folder:'phonemes',key:'phoneme'},
 word:{manifest:'word-audio-manifest.json',folder:'words',key:'word'},
 syllable:{manifest:'syllable-audio-manifest.json',folder:'syllables',key:'unit'}
};
const plain=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export async function syncAudio(){
 const prepared={};
 for(const [kind,spec] of Object.entries(specs)){
  const rows=await json(sourceRoots[kind]+'/'+spec.manifest);
  if(new Set(rows.map(x=>x[spec.key])).size!==rows.length)throw Error('Audios duplicados: '+kind);
  prepared[kind]=[];
  for(const entry of rows){
   const id=plain(entry[spec.key]);
   if(entry.file!==`assets/audio/${kind==='phoneme'?'phonemes':'words'}/${id}.m4a`)throw Error('Nombre de archivo no corresponde: '+entry[spec.key]);
   const sourceFile=`${sourceRoots[kind]}/${entry.file}`,bytes=await readFile(sourceFile),hash=sha256(bytes);
   if(bytes.length<1000||!bytes.includes(Buffer.from('ftyp'))||!bytes.includes(Buffer.from('mp4a')))throw Error('M4A/AAC inválido: '+sourceFile);
   const playbackGain=kind!=='phoneme'&&Number.isFinite(entry.playbackGain)&&entry.playbackGain>1?Math.min(entry.playbackGain,2.5):1;
   prepared[kind].push({bytes,entry:{...entry,id,file:`assets/audio/${spec.folder}/${id}.${hash.slice(0,16)}.m4a`,sourceFile,sha256:hash,status:'final_v11',integration:'byte-identical teacher source',playbackGain,...(kind==='phoneme'?{graphemes:[id]}:kind==='word'?{fallback:null,required:true}:{required:true})}});
  }
 }
 if(prepared.phoneme.length!==9||prepared.syllable.length!==38)throw Error('Inventario incompleto de fonemas o sílabas.');
 const oldVerification=await json('data/audio-verification.json');
 const all=Object.values(prepared).flat().map(x=>x.entry);
 const fingerprint=sha256(Buffer.from(JSON.stringify(all.map(x=>[x.sourceFile,x.sha256]))));
 const verification=oldVerification.sourceFingerprint===fingerprint?oldVerification:{sourceFingerprint:fingerprint,status:'pending_listening_confirmation',method:null,previousConfirmation:oldVerification.confirmation,notes:'Los nombres, formatos y hashes no certifican el contenido hablado de los audios nuevos.'};
 for(const [kind,spec] of Object.entries(specs)){
  const dir=resolve('public/assets/audio/'+spec.folder);
  if(!dir.startsWith(resolve('public/assets/audio')+sep))throw Error('Destino fuera del proyecto.');
  await mkdir(dir,{recursive:true});
  const allowed=new Set(prepared[kind].map(x=>x.entry.file.split('/').at(-1)));
  for(const file of await readdir(dir))if(file.endsWith('.m4a')&&!allowed.has(file))await unlink(resolve(dir,file));
  for(const {entry,bytes} of prepared[kind])await writeFile('public/'+entry.file,bytes);
 }
 const phonemes=prepared.phoneme.map(x=>x.entry),words=prepared.word.map(x=>x.entry),syllables=prepared.syllable.map(x=>x.entry);
 await save('data/audio-manifest.json',phonemes);
 await save('data/word-audio-manifest.json',words);
 await save('data/syllable-audio-manifest.json',syllables);
 await save('data/audio-verification.json',verification);
 const phonemeData=await json('data/phonemes.json');
 for(const p of phonemeData){const a=phonemes.find(a=>a.phoneme===p.id);if(a)p.audio=a.file;}
 await save('data/phonemes.json',phonemeData);
 for(const bank of ['words-v1','oral-bank-v1','dictation-words-v1']){
  const rows=await json('data/'+bank+'.json');
  for(const w of rows){const a=words.find(a=>a.id===w.id);w.wordAudio=a?.file||null;w.wordAudioRequired=!!a;}
  await save('data/'+bank+'.json',rows);
 }
 const units=await json('data/syllables-v1.json');
 for(const u of units){const a=syllables.find(a=>a.unit===u.string);u.syllableAudio=a?.file||null;}
 await save('data/syllables-v1.json',units);
 console.log(`Audio sincronizado: ${phonemes.length} fonemas, ${words.length} palabras, ${syllables.length} sílabas; confirmación: ${verification.status}`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await syncAudio();
