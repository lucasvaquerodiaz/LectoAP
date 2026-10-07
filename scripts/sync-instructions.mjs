import {readFile,writeFile,mkdir,readdir,copyFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {soundInstructionIds,letterInstructionIds} from '../src/instruction-cues.js';

const source=resolve('inputs/audio_final/instrucciones');
const target=resolve('public/assets/audio/instructions');
const expected=[...new Set([...soundInstructionIds,'posicion-final','posicion-centro',...Object.values(letterInstructionIds)])];
const rows=[];
const expectedNames=expected.map(id=>id==='posicion-inicio'?'posición-inicio.m4a':`${id}.m4a`);
const actualNames=await readdir(source);
if(actualNames.length!==expectedNames.length||actualNames.some(name=>!expectedNames.includes(name)))throw Error('La carpeta de consignas contiene archivos ausentes o no reconocidos.');
await mkdir(target,{recursive:true});
for(const id of expected){
 const sourceName=id==='posicion-inicio'?'posición-inicio.m4a':`${id}.m4a`;
 const sourceFile=resolve(source,sourceName),bytes=await readFile(sourceFile);
 if(bytes.length<1000||!bytes.includes(Buffer.from('ftyp'))||!bytes.includes(Buffer.from('mp4a')))throw Error(`Grabación M4A/AAC inválida: ${sourceName}`);
 const sha256=createHash('sha256').update(bytes).digest('hex');
 const file=`assets/audio/instructions/${id}.${sha256.slice(0,16)}.m4a`;
 await copyFile(sourceFile,resolve('public',file));
 rows.push({id,file,sourceFile:`inputs/audio_final/instrucciones/${sourceName}`,sha256});
}
for(const name of await readdir(target))if(!rows.some(row=>row.file.endsWith('/'+name)))await rm(resolve(target,name));
await writeFile('data/instruction-audio-manifest.json',JSON.stringify(rows,null,2)+'\n');
console.log(`${rows.length} consignas sincronizadas desde la carpeta del docente.`);
