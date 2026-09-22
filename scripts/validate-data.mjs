import {validateAudio} from './validate-audio.mjs';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const readJSON=async name=>JSON.parse(await readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
export async function loadData(){const map={words:'words-v1',oral:'oral-bank-v1',syllables:'syllables-v1',phonemes:'phonemes',graphemes:'graphemes',activities:'activities',relations:'relations',vocabulary:'vocabulary',audio:'audio-manifest',wordAudio:'word-audio-manifest',audioVerification:'audio-verification',arasaac:'arasaac-manifest',review:'arasaac-review',version:'version'};const data={};await Promise.all(Object.entries(map).map(async([k,v])=>data[k]=await readJSON(v)));return data;}
export async function validateData(data){const errors=[];const assert=(ok,msg)=>{if(!ok)errors.push(msg);};const exists=async p=>{try{await access(new URL('../public/'+p,import.meta.url));return true;}catch{return false;}};
 const unique=(rows,key,name)=>assert(new Set(rows.map(x=>x[key])).size===rows.length,`Duplicados en ${name}`);
 for(const key of ['words','oral','syllables','phonemes','graphemes','activities'])unique(data[key],'id',key);
 unique(data.words.concat(data.oral),'id','banco combinado');
 const knownGraphemes=data.graphemes.map(g=>g.id);
 for(const w of data.words.concat(data.oral,data.syllables)){
  assert(w.phonemeCount===w.phonemes.length,`${w.id}: número de fonemas`);
  const structure=w.phonemes.map(p=>'aeiou'.includes(p)?'V':'C').join('');
  assert(w.structure===structure,`${w.id}: estructura`);
  assert(w.graphemes.join('')===w.word,`${w.id}: grafemas/ortografía`);
  assert(w.graphemes.every(g=>knownGraphemes.includes(g)),`${w.id}: grafema sin declarar`);
  assert(w.graphemes.every(g=>w.requiredLetters.includes(g))&&w.requiredLetters.every(g=>w.graphemes.includes(g)),`${w.id}: letras necesarias`);
  if(w.kind!=='syllable'){
   assert(w.initialPhoneme===w.phonemes[0]&&w.finalPhoneme===w.phonemes.at(-1),`${w.id}: extremos`);
   for(const p of new Set(w.phonemes))assert(JSON.stringify(w.phonemePositions[p])===JSON.stringify(w.phonemes.flatMap((v,i)=>v===p?[i]:[])),`${w.id}: posiciones de ${p}`);
   if(w.imageRequired&&!w.reviewRequired)assert(!!w.image&&await exists(w.image),`${w.id}: imagen ausente o ruta rota`);
   if(w.image)assert(await exists(w.image),`${w.id}: ruta imagen rota`);
   if(w.wordAudioRequired)assert(!!w.wordAudio&&await exists(w.wordAudio),`${w.id}: falta audio de palabra requerido`);
   if(w.graphemes.includes('ó')&&w.writing)assert(w.requiresAccentSupport,`${w.id}: escritura sin control de tilde`);
  }
 }
 for(const p of data.phonemes){const a=data.audio.find(a=>a.phoneme===p.id);assert(!!a,`${p.id}: sin manifiesto audio`);assert(!!a&&await exists(a.file),`${p.id}: audio ausente`);}
 for(const a of data.arasaac.filter(a=>!a.reviewRequired)){assert(!!a.arasaacId,`${a.word}: ARASAAC ID ausente después de aprobación`);assert(!!a.localFile&&await exists(a.localFile),`${a.word}: recurso ARASAAC ausente`);assert(!!a.author&&!!a.license&&!!a.attribution,`${a.word}: atribución incompleta`);}
 for(const w of data.words.concat(data.oral).filter(w=>w.image&&!w.reviewRequired))assert(data.arasaac.some(a=>a.localFile===w.image&&!a.reviewRequired),`${w.id}: imagen sin aprobación`);
 assert(data.activities.every(a=>['allowed','optional','disabled'].includes(a.wordAudioHelp)),'Política de ayuda inválida');
 errors.push(...await validateAudio(data));
 return errors;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const d=await loadData(),errors=await validateData(d);if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Datos válidos: ${d.words.length} palabras núcleo, ${d.oral.length} oral adicional, ${d.syllables.length} sílabas/vocales, ${d.activities.length} actividades, ${d.audio.length+d.wordAudio.length} audios (${d.audio.length} fonemas + ${d.wordAudio.length} palabras). ${d.review.length} imágenes excluidas pendientes de revisión.`);}
