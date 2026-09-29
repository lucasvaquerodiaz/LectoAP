export const POSITION_REVEAL_ATTEMPTS=6;
export function canRemoveWrongOption(item){return item.activity!=='CF05';}
export function shouldRevealPositions(item,attempts){return item.activity==='CF05'&&attempts>=POSITION_REVEAL_ATTEMPTS;}
