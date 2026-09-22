# Añadir contenido sin reescribir motores

Los JSON de `data/` son la fuente de verdad. No ejecutar los scripts `prepare-content.mjs` o `select-pictograms.mjs` después de editar manualmente: son el registro reproducible de la preparación inicial y sobrescriben esos bancos. No hay generación automática de pronunciación a partir de ortografía.

## Fonema y grafema

Para incorporar /d/, añadir a `phonemes.json` un objeto con `id: "d"`, `ipa: "d"`, `kind: "consonant"`, `status: "active"` y `audio: "assets/audio/phonemes/d.m4a"`. Añadir la grabación en la fuente autorizada `inputs/audio_final/fonemas/assets/audio/phonemes/` y una entrada en su `audio-manifest.json` con procedencia, estado y `graphemes: ["d"]`. Añadir a `graphemes.json` `{ "id": "d", "display": "d", "phonemes": ["d"], "core": false }`. Aparecerá en el selector; no se añade por defecto a las letras activas. No se ha inventado un orden posterior a N.

B y V apuntan ambas a /b/. C exige contexto /k/ o /θ/; Z corresponde a /θ/. LL/Y se preparan para /ʝ/ con contexto cuando proceda; CH se registra como unidad /tʃ/; H tiene lista vacía de fonemas. R requiere distinguir /ɾ/ y /r/. Estas grafías son ejemplos de esquema para ampliación; no están habilitadas como contenido V1. Incorporarlas requiere nuevos bancos transcritos y audios validados, no basta con activarlas arbitrariamente.

## Sílaba

Copiar una entrada de `syllables-v1.json`: `string`, `word`, `displayUpper`, `phonemes`, `graphemes`, `phonemeCount`, `structure`, `requiredLetters`, `priority`, `frequency`, `difficulty`, `recommended`, `interleave`, `writing`, `reading`, `kind`. Solo añadir combinaciones pedagógicamente justificadas. La V1 usa un banco explícito común; las prioridades lexicográficas están registradas, aunque el planificador prioriza diversidad de estructura antes que pesos de frecuencia.

## Palabra

Ejemplo con nueva letra: DADO. Registrar `phonemes: ["d","a","d","o"]`, `graphemes: ["d","a","d","o"]`, `phonemeCount: 4`, `syllableCount: 2`, `structure: "CVCV"`, `initialPhoneme: "d"`, `finalPhoneme: "o"`, `phonemePositions: {"d":[0,2],"a":[1],"o":[3]}`, `requiredLetters:["d","a","o"]`. Completar banderas oral/reading/writing/segmentation/blending, dificultad, significado y recursos siguiendo SOL. La tarea escrita solo será elegible si D está activa. En palabras con dígrafos o H, fonemas y grafemas tendrán longitudes diferentes; revisar las cajas de escritura según grafemas y las de segmentación según fonemas.

Si falta imagen clara, usar `reviewRequired:true`, `image:null`, `imageClarity:"review"`; nunca usar un recurso de otro significado. Las tareas visuales la excluirán. Para grabar una palabra, añadir el archivo en `inputs/audio_final/palabras/assets/audio/words/` y su entrada en el manifiesto de esa fuente. `node scripts/sync-audio.mjs` vincula `wordAudio`, calcula hashes y exige nueva confirmación auditiva si cambian los recursos. Las 19 palabras núcleo ya tienen grabación; NUBE permanece sin audio. No editar rutas con hash a mano. `src/word-audio-policy.js` distingue estímulo oral de ayuda: CF07 y SL07 no ofrecen el nombre de la respuesta; SL06 y VOC01 sí usan la palabra grabada como estímulo.

## Pictogramas

1. Revisar condiciones oficiales de ARASAAC antes de una nueva distribución.
2. `node scripts/fetch-arasaac.mjs --search` guarda candidatos; añadir previamente términos al script para ampliar búsquedas.
3. Comparar etiquetas, acepciones e imágenes. No se aprueba el primer resultado automáticamente.
4. Registrar ID, etiqueta original, URL, autoría, licencia, atribución y razón en `arasaac-manifest.json`.
5. `node scripts/fetch-arasaac.mjs` descarga solo las selecciones aprobadas. Los recursos dudosos van a `arasaac-review.json`, con candidatos y razón. El docente puede revisar los IDs fuera de una sesión.
6. No cambiar los archivos originales de fonemas al preparar imágenes.

## Verificar y publicar

Actualizar `contentVersion` en `version.json`; `appVersion` solo cuando cambie la aplicación. Ejecutar validación, tests, build y prueba de navegador/offline. El build recoge automáticamente los recursos locales nuevos y cambia la huella de caché. Comprobar las palabras nuevas con un docente antes de usarlas. La automatización detecta incoherencias estructurales; no certifica por sí sola transcripción, familiaridad ni significado.
