// Inventory the teacher's recordings without guessing spoken content.
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root='inputs/audio_final/palabras';
const folder=root+'/assets/audio/words';
export const syllableGroups={
 CV:'ma me mi mo mu la le li lo lu sa se si so su na ne ni no nu'.split(' '),
 VC:'al el es en un on'.split(' '),
 CVC:'sal sol son sin mes mis mal mil las los nos sus'.split(' ')
};
const accents={limon:'limón',melon:'melón',mision:'misión',salmon:'salmón',salon:'salón'};
const spelling=id=>accents[id]||id;
const plain=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const save=(path,rows)=>writeFile(path,JSON.stringify(rows,null,2)+'\n');
const oldWords=JSON.parse(await readFile('data/words-v1.json','utf8'));
const files=(await readdir(folder)).filter(x=>x.endsWith('.m4a')).map(x=>x.slice(0,-4));
const units=Object.values(syllableGroups).flat(),unitSet=new Set(units);
if(units.length!==38||unitSet.size!==38||units.some(x=>!files.includes(x)))throw Error('Faltan unidades de las 38 grabadas.');
if(new Set(files).size!==files.length)throw Error('Nombres de audio duplicados.');
const lexical=new Set(oldWords.map(w=>w.id));
for(const id of files)if(!unitSet.has(id))lexical.add(id);
const accounted=new Set([...lexical,...units]);
if(files.some(id=>!accounted.has(id)))throw Error('Grabación sin categoría.');
const sourceRows=[...lexical].sort().map(id=>{
 const word=spelling(id);
 return {word,file:`assets/audio/words/${id}.m4a`,source:'Archivo individual aportado por el docente',status:'provided_by_teacher'};
});
const syllableRows=Object.entries(syllableGroups).flatMap(([structure,ids])=>ids.map(unit=>({
 unit,structure,file:`assets/audio/words/${unit}.m4a`,status:'provided_by_teacher'
})));
const syllableBank=Object.entries(syllableGroups).flatMap(([structure,ids])=>ids.map(unit=>({
 id:'sy-'+unit,string:unit,word:unit,displayUpper:unit.toUpperCase(),
 phonemes:[...unit],graphemes:[...unit],phonemeCount:unit.length,structure,
 requiredLetters:[...new Set(unit)],priority:structure==='CVC'?3:structure==='VC'?2:1,
 frequency:'common',difficulty:structure==='CVC'?3:structure==='VC'?2:1,
 recommended:true,interleave:true,writing:true,reading:true,kind:'syllable',
 syllableAudio:null
})));
const dictationBank=[...lexical].filter(id=>!oldWords.some(w=>w.id===id)&&id!=='nube').sort().map(id=>{
 const word=spelling(id),graphemes=[...word],requiredLetters=[...new Set(graphemes)];
 if(![...plain(word)].every(c=>'aeioulmsn'.includes(c)))throw Error('Palabra fuera del repertorio inicial: '+word);
 return {id,word,displayUpper:word.toUpperCase(),phonemes:[...plain(word)],graphemes,
  phonemeCount:graphemes.length,syllableCount:null,
  structure:[...plain(word)].map(c=>'aeiou'.includes(c)?'V':'C').join(''),
  initialPhoneme:plain(word)[0],finalPhoneme:plain(word).at(-1),
  phonemePositions:Object.fromEntries([...new Set(plain(word))].map(c=>[c,[...plain(word)].flatMap((x,i)=>x===c?[i]:[])])),
  requiredLetters,oral:true,reading:false,writing:true,requiresAccentSupport:graphemes.some(g=>g!==plain(g)),
  segmentation:false,blending:false,imageRequired:false,image:null,reviewRequired:false,
  difficulty:graphemes.length<=4?1:graphemes.length<=5?2:3,
  priority:graphemes.length<=4?1:3,wordAudio:null,wordAudioRequired:true,
  kind:'dictation-word'
 };
});
await save(root+'/word-audio-manifest.json',sourceRows);
await save(root+'/syllable-audio-manifest.json',syllableRows);
await save('data/syllables-v1.json',syllableBank);
await save('data/dictation-words-v1.json',dictationBank);
console.log(JSON.stringify({sourceFiles:files.length,wordRecordings:sourceRows.length,syllableRecordings:syllableRows.length,newDictationWords:dictationBank.length,excludedFromDictation:['nube']}));
