# Audio definitivo de LectoAP

Las únicas fuentes de audio son `inputs/audio_final/fonemas/` y `inputs/audio_final/palabras/`. El inventario contiene 9 fonemas, 59 palabras y 38 unidades de sílaba. Algunas palabras y unidades comparten archivo original; la aplicación publica cada uso en su propio espacio de nombres.

`scripts/sync-audio.mjs` copia los bytes originales a `public/assets/audio/phonemes/`, `words/` y `syllables/`, incorpora una huella SHA-256 en cada ruta y elimina copias anteriores. `scripts/validate-audio.mjs` compara fuente, copia, manifiestos y bancos de actividades. El dictado de sílabas reproduce el archivo completo de la unidad, por ejemplo /la/; el dictado de palabras reproduce la grabación de la palabra. No hay TTS.

El docente confirmó el 29-09-2026 que verificó todos los audios. La declaración está registrada en `data/audio-verification.json` y vinculada a la huella del inventario. La comprobación automática acredita identidad de archivos, decodificación y asociación por nombre; la identificación auditiva del contenido hablado corresponde al docente. Cualquier cambio de archivo deja esa confirmación pendiente hasta nueva revisión.

La generación de caché `audio-v11` retira las generaciones anteriores de LectoAP cuando una instalación se conecta y carga la versión nueva. El service worker incluye todos los audios en la descarga inicial y sirve las peticiones Range (`206`) de los M4A. Una instalación que sigue sin conexión conserva la versión anterior hasta que se conecte.

La suite lógica aprobó 39 comprobaciones. La prueba de interfaz cargó los 106 recursos en Chromium y WebKit, comprobó los controles de audio y no detectó errores JavaScript ni recursos ausentes. La recarga offline de WebKit de automatización produjo un error interno del navegador de pruebas; sigue pendiente verificar esa recarga y la instalación en un iPad físico.
