import {readFile,writeFile} from 'node:fs/promises';
const selections={sol:[7252,'Sol','Astro solar aislado, sin escena meteorológica.'],sal:[25576,'sal','Salero y sustancia visible; no verbo salir.'],ala:[5368,'ala','Ala aislada con plumas reconocibles; se descarta ala de avión.'],ola:[4706,'ola','Ola marina, sin personajes.'],oso:[2488,'oso','Oso pardo animal. No se reutiliza para distinguir OSA.'],luna:[2933,'Luna','Luna creciente.'],mano:[2928,'mano','Mano aislada abierta.'],mesa:[3129,'mesa','Mesa simple de cuatro patas, representación concreta.'],lana:[2948,'lana','Ovillo con hebra.'],mono:[2477,'mono','Animal; descartadas las acepciones de vestimenta.'],suma:[37319,'suma','Operación horizontal sencilla; prioridad secundaria.'],uno:[2627,'uno','Número 1 sin manos ni otras cantidades.'],limon:[3022,'limón','Fruta entera.'],melon:[2469,'melón','Fruta entera y sección que facilita la identificación.'],molino:[13086,'molino','Molino de viento aislado.'],nube:[2883,'nube','Nubes; el docente debe acordar denominación singular.']};
const attribution='Pictogramas: Sergio Palao. Procedencia: ARASAAC (https://arasaac.org). Propiedad: Gobierno de Aragón. Licencia: CC BY-NC-SA.';
const manifest=Object.entries(selections).map(([id,[arasaacId,arasaacLabel,selectionReason]])=>({word:arasaacLabel.toLowerCase(),id,arasaacId:String(arasaacId),arasaacLabel,sourceUrl:`https://static.arasaac.org/pictograms/${arasaacId}/${arasaacId}_300.png`,localFile:`assets/pictograms/${id}.png`,author:'Sergio Palao',owner:'Gobierno de Aragón',source:'ARASAAC',license:'CC BY-NC-SA',licenseSource:'https://arasaac.org/terms-of-use',attribution,reviewRequired:false,selectionReason,reviewMethod:'Semántica de candidatos y revisión visual de imágenes 300 px',verifiedAt:'2026-09-21'}));
const review=[];
for(const word of ['osa','asa','mula','masa']){
 const rows=JSON.parse(await readFile(`data/candidates/${word}.json`,'utf8'));
 const candidates=rows.filter(x=>x.keywords.some(k=>k.keyword.toLowerCase()===word)).map(x=>({id:String(x._id),label:x.keywords.map(k=>k.keyword).join(' / '),url:`https://static.arasaac.org/pictograms/${x._id}/${x._id}_300.png`}));
 const reason=word==='osa'?'Los candidatos son compartidos con OSO y no distinguen el sexo de forma inequívoca.':word==='masa'?'32476 muestra masa extendida; 38442 relaciona una bola con pan. Confirmar denominación masa de pan cruda con el docente.':'No se obtuvo candidato exacto. No se sustituye por una imagen de otra acepción.';
 review.push({word,status:'review_required',candidates,reason});
 manifest.push({word,id:word,arasaacId:null,arasaacLabel:null,sourceUrl:null,localFile:null,author:null,source:'ARASAAC',license:'CC BY-NC-SA',attribution,reviewRequired:true,selectionReason:reason});
}
await writeFile('data/arasaac-manifest.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('data/arasaac-review.json',JSON.stringify(review,null,2)+'\n');
const words=JSON.parse(await readFile('data/words-v1.json','utf8'));for(const w of words){if(w.id==='masa'){w.reviewRequired=true;w.image=null;w.imageClarity='review';}}
await writeFile('data/words-v1.json',JSON.stringify(words,null,2)+'\n');
