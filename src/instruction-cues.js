// One recording per instruction; position changes within the second sound game.
export const soundInstructionIds=[
 'reconocer', 'posicion-inicio', 'aislar-inicio', 'aislar-final',
 'integrar-dos', 'integrar-tres', 'segmentar-dos', 'segmentar-tres'
];

export const letterInstructionIds={
 SL02:'letra-sonido',SL01:'sonido-letra',SL03:'imagen-letra',
 SL08:'leer-silaba',SL05:'dictado-silaba',SL07:'leer-imagen',
 SL04:'construir-palabra',SL06:'dictado-palabra'
};

export function soundInstructionId(stepIndex,itemIndex){
 if(stepIndex===1)return ['posicion-inicio','posicion-final','posicion-centro'][Math.floor(itemIndex/4)];
 return soundInstructionIds[stepIndex]||null;
}

export function letterInstructionId(activity){return letterInstructionIds[activity]||null;}
