import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('data/candidates/previews',{recursive:true});
const ids=[7252,2798,25576,5368,6890,4706,2488,2933,2928,3129,6562,2948,2477,32476,38442,5868,37319,2627,4889,7291,35677,3022,2469,36153,13086,2883];
for(const id of ids){const r=await fetch(`https://static.arasaac.org/pictograms/${id}/${id}_300.png`);if(!r.ok)throw Error(id);await writeFile(`data/candidates/previews/${id}.png`,new Uint8Array(await r.arrayBuffer()));}
