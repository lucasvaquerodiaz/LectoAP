// Development-only preparation. Never imported by the student application.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const terms = ['sol','sal','ala','ola','oso','osa','luna','mano','mesa','lana','mula','mono','masa','suma','uno','limón','melón','molino','asa','nube'];
const root = new URL('../', import.meta.url);
const save = async (p,v) => writeFile(new URL(p,root), typeof v === 'string' || v instanceof Uint8Array ? v : JSON.stringify(v,null,2)+'\n');
await mkdir(new URL('data/candidates/',root),{recursive:true});
await mkdir(new URL('public/assets/pictograms/',root),{recursive:true});
if (process.argv.includes('--search')) {
  for (const term of terms) {
    const r = await fetch('https://api.arasaac.org/v1/pictograms/es/search/'+encodeURIComponent(term));
    if (!r.ok) throw new Error(`${term}: HTTP ${r.status}`);
    const rows = await r.json();
    await save('data/candidates/'+term+'.json',rows);
    console.log(term,JSON.stringify(rows.filter(x=>x.keywords.some(k=>k.keyword.toLowerCase()===term)).map(x=>({id:x._id,keywords:x.keywords}))));
  }
} else {
  const selected = JSON.parse(await readFile(new URL('data/arasaac-manifest.json',root),'utf8'));
  for (const item of selected.filter(x=>x.arasaacId && !x.reviewRequired)) {
    const r = await fetch(item.sourceUrl);
    if (!r.ok) throw new Error(`${item.word}: HTTP ${r.status}`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes[0]!==137 || bytes[1]!==80) throw new Error('Not PNG: '+item.word);
    await save('public/'+item.localFile,bytes);
    console.log(item.word,bytes.length);
  }
}
