// Primary spoken stimuli are distinct from optional hints and answer choices.
const primaryTarget=new Set(['CF01','CF03','CF04','CF05','CF06','CF08','SL03','SL04','SL06','VOC01']);
export function wordAudioPolicy(item,config){
 const primary=primaryTarget.has(item.activity)?[{id:item.target.id,word:item.target.word}]:[];
 if(item.module==='COMBO'&&item.display){for(const word of item.display.split(/ · | → /))primary.push({id:word.normalize('NFD').replace(/[\u0300-\u036f]/g,''),word});}
 const options=config.help&&item.wordAudioHelp!=='disabled'?item.options.filter(o=>o.type==='image').map(o=>({id:o.id,word:o.label})):[];
 return {primary,options};
}
