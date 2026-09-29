# Verificación de la versión 1.4.0

Fecha: 29-09-2026. Contenido 3.1.0.

- `node scripts/validate-data.mjs`: aprobado. 19 palabras núcleo, NUBE oral, 39 palabras nuevas de dictado, 38 sílabas, 20 actividades y 106 recursos de audio declarados.
- `node --test --test-isolation=none tests/*.test.mjs`: 39 comprobaciones aprobadas, incluidas la separación M/N en fácil, las 12 actividades autónomas, sus 6 ítems y la correspondencia de los audios con la fuente.
- `node scripts/build.mjs`: build estático generado con 152 recursos más el service worker. La huella del build cambia al cambiar el contenido.
- `tests/v11-browser.mjs`: recorrido aprobado en Chromium y WebKit de escritorio. Carga y decodifica o comprueba los 106 audios, comprueba dictado de sílaba, corrección sin revelar la solución, borrado, avance automático y transición de la actividad 1 a la 2 del modo infantil. No hubo errores JavaScript ni respuestas 404.

La prueba de recarga offline pasó en Chromium en una ejecución anterior de la PWA. En esta actualización, WebKit para Windows dio un error interno al recargar sin conexión. Una repetición posterior de esa comprobación fue detenida por el límite temporal del revisor automático antes de ejecutarse. No se presenta como verificación en Safari de iPad.

Pendiente de comprobación física: instalación desde Safari en el iPad, reproducción por su altavoz y reapertura en modo avión. Las imágenes OSA, ASA, MULA y MASA siguen excluidas de tareas visuales por revisión pendiente.
