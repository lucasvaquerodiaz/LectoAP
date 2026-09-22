# Integración del audio definitivo

La única fuente de audio de V1 es:

- `inputs/audio_final/fonemas/`: 9 fonemas.
- `inputs/audio_final/palabras/`: 19 palabras.

`node scripts/sync-audio.mjs` lee exclusivamente los dos manifiestos de esas carpetas. Copia los archivos sin modificar, calcula SHA-256 y publica rutas con la huella integrada en el nombre. El validador comprueba inventario, asociación, fuente, hash, copia publicada y ausencia de archivos `.m4a` no declarados en `public/assets/audio/`.

La aplicación mantiene dos espacios de nombres separados. `/a/` busca `audio-manifest.json` por `phoneme`; «uno» busca `word-audio-manifest.json` por `id`. Nunca se resuelve un audio por una etiqueta ambigua compartida. La comprobación de ejecución rechaza cualquier entrada cuyo origen no empiece por `inputs/audio_final/` o cuya ruta pública no contenga su huella.

Las 19 palabras se usan como estímulo grabado en dictado y vocabulario. CF07 (integración) y SL07 (leer → imagen) no muestran un botón de palabra completa porque revelaría la respuesta. Las palabras con audio disponible pueden ofrecer denominación opcional en actividades visuales según `wordAudioHelp`; NUBE permanece con fallback docente porque no tiene grabación. Las consignas tampoco están grabadas y las da el docente.

El docente confirmó auditivamente los 28 archivos el 21-09-2026: los nueve fonemas corresponden a /a e i o u l m s n/ y las 19 palabras a sus nombres ortográficos, incluidos LIMÓN y MELÓN. La confirmación está ligada a `data/audio-verification.json` y a la huella de todos los archivos. Cambiar un byte o sustituir un archivo obliga a una nueva confirmación.

## Caché y migración

La generación `audio-final-v1` forma parte del nombre de caché. El service worker precachea los 28 audios y los manifiestos. Si detecta una caché LectoAP anterior a esta generación, activa inmediatamente la versión correctiva, borra las cachés anteriores y recarga las ventanas del mismo scope para retirar audio antiguo que estuviera en memoria. Para actualizaciones posteriores conserva el flujo de espera y activación explícita desde modo docente.

La instalación anterior solo puede recibir esta limpieza tras una carga conectada que instale el nuevo worker. Después se puede probar en modo avión. El service worker atiende peticiones Range (`206`) para M4A; esto evita que Safari/iPad necesite descargar de nuevo un clip ya cacheado.

## Evidencia

`node --test --test-isolation=none tests/*.test.mjs` pasa 31 pruebas: 28 recursos, mapeos A/E/I/O, palabras con tilde, bloqueo de fuente incorrecta, políticas de ayuda, caché y validadores. `node scripts/validate-data.mjs` pasa. El build final contiene 70 recursos: 28 audios definitivos, 16 pictogramas, 2 iconos PNG, código y bancos.

La reproducción técnica se comprobó en Chromium/WebKit de escritorio con HTMLAudio; la decodificación Web Audio y la recarga offline completa se comprobaron en Chromium. El WebKit de automatización de Windows no ofrece la API Web Audio y produjo un error interno al recargar offline; esto no se presenta como prueba de Safari/iPad. La comprobación perceptiva corresponde al docente, no al decodificador.
