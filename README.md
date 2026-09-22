# LectoAP V1 · audio definitivo (app 1.1.0 / contenido 2.0.0)

PWA estática de práctica educativa guiada por un docente: conciencia fonémica, correspondencias sonido-letra, lectura/escritura inicial, comparación de palabras y vocabulario. Sin cuentas, backend, analítica ni historial personal. Interfaz propia, recursos locales y 9 fonemas definitivos y 19 palabras grabadas.

## Ejecutar

Node 20 o posterior para desarrollar (no para usar la app). No hay dependencias obligatorias que instalar.

```sh
npm run validate:data
npm test
npm run build
npm start
```

Abrir http://localhost:4173/ o http://localhost:4173/LectoAP/ para probar rutas de subdirectorio. No abrir `index.html` directamente mediante `file://`. Si el entorno no dispone de npm, los equivalentes son `node scripts/validate-data.mjs`, `node --test --test-isolation=none tests/*.test.mjs`, `node scripts/build.mjs` y `node scripts/serve.mjs`.

## Uso con alumnado

1. Elegir módulo y actividad en modo docente.
2. Activar letras y estructuras ya trabajadas; seleccionar tanda de 5, 6, 8 o 10 ítems.
3. Para introducir una estructura, elegirla en el desplegable: tres ensayos iniciales y mezcla posterior cuando hay otras estructuras elegibles.
4. Las palabras grabadas se escuchan con «Escuchar palabra». La ficha docente aparece solo cuando falta una grabación (por ejemplo, NUBE o SALA) o el audio está desactivado. Las consignas no grabadas pueden ser leídas por el docente.
5. En conciencia fonémica no aparecen las grafías objetivo en la pantalla del alumno. En segmentación, escuchar y elegir un sonido por caja. En escritura, tocar letras para colocarlas; una letra puede reutilizarse.
6. Tras un error hay otro intento; tras el segundo, modelado. Solo la primera respuesta alimenta la adaptación. No hay puntos, vidas ni recompensas competitivas.

Las ayudas que revelan la solución se desactivan por motor. El botón de repetición controla la secuencia presentada; los botones de audio que forman parte de la respuesta siguen siendo utilizables. Si se desactiva el audio, el docente pronuncia también los sonidos. La app no usa TTS. El dictado de palabras reproduce la palabra real completa; integración mantiene los fonemas aislados y no revela su palabra completa.

## Contenido y motores

- 20 actividades sobre cuatro tipos reutilizables de respuesta: elección, elección múltiple, audio y secuencia.
- CF01–CF08; SL01–SL07; S+L01–S+L03; VOC01–VOC02.
- 19 palabras núcleo registradas; cuatro imágenes pendientes excluidas de tareas visuales: OSA, ASA, MULA, MASA. Pueden usarse palabras escritas compatibles sin una imagen validada en los motores que no la requieren.
- 34 estímulos de sílabas/vocales: 5 V, 20 CV y 9 VC prioritarias.
- Banco oral adicional inicial pequeño: NUBE, con transcripción /n u b e/ y pictograma revisado. No se incluyeron automáticamente las listas orientativas sin revisión.
- 16 pictogramas locales de ARASAAC, incluidos 15 del banco núcleo y NUBE.
- Comparación avanzada ALA → SALA: SALA no forma parte del núcleo inicial.
- LIMÓN y MELÓN mantienen tilde; escritura solo al habilitar Ó.

La adaptación usa hasta 10 primeras respuestas, necesita al menos 5, mantiene 75–90 %, simplifica por debajo del 60 % y vuelve al nivel más fácil con ≤40 %. Sube un nivel con >90 % tras al menos 5 respuestas desde el último cambio. Modifica semejanza de distractores en tareas de imágenes o número de alternativas en correspondencias; longitud/estructuras se deciden por el docente. No promete cambios automáticos en motores sin esa dimensión (contar, construir o comparar conjuntos).

## Estructura

```text
src/             interfaz, audio, generación/adaptación y plantilla de SW
public/          HTML, manifest, iconos, audio y pictogramas locales
data/            bancos editables, relaciones y manifiestos
data/candidates/ búsquedas y candidatos de preparación (no se publican)
scripts/         validación, build, servidor local y preparación ARASAAC
tests/           pruebas de lógica y suite opcional de navegador
docs/            pedagogía, autoría, despliegue y auditoría
inputs/          originales recibidos, intactos
dist/            build publicable generado
```

## Pruebas de navegador opcionales

```sh
npm install --no-save playwright
npx playwright install chromium webkit
npm run build
npm start
# En otra terminal:
node tests/browser.mjs
```

Los resultados se guardan en `test-results/`. La suite de navegador no es una dependencia de producción. Consulte `docs/VERIFICATION.md` para resultados reales y límites. WebKit de escritorio no equivale a un iPad físico.

## Publicación e instalación

Ver [DEPLOYMENT.md](docs/DEPLOYMENT.md). El workflow incluido valida, prueba y publica `dist/` mediante GitHub Pages. Hace falta un repositorio del usuario: no se creó ni publicó uno sin un destino indicado. En iPad: abrir la URL HTTPS en Safari, completar la primera carga, Compartir → Añadir a pantalla de inicio. Antes de una sesión, comprobar funcionamiento en modo avión.

La migración correctiva desde una caché anterior retira los audios incorrectos y recarga las ventanas del mismo scope, reiniciando cualquier sesión antigua. Las actualizaciones posteriores vuelven al flujo de espera y activación docente. Una instalación desconectada debe conectarse y abrirse al menos una vez para recibir la corrección. La caché combina versión de aplicación, versión de contenido y huella del build. Cada instalación tiene su propio scope. iOS puede desalojar cachés por espacio: si ocurre, volver a completar una carga conectada.

Ver [créditos y licencias](CREDITS_AND_LICENSES.md), [pedagogía](docs/PEDAGOGY.md), [autoría de contenido](docs/CONTENT_AUTHORING.md) y [auditoría](docs/ACCEPTANCE_AUDIT.md).

## Única fuente de audio

`inputs/audio_final/fonemas/` y `inputs/audio_final/palabras/` son las únicas fuentes. Ejecutar `node scripts/sync-audio.mjs` tras una modificación autorizada. El script usa los manifiestos de esas carpetas, conserva los bytes, genera rutas con SHA-256 y retira copias obsoletas de `public/assets/audio/`. La validación compara fuente, banco, manifiesto y copia publicada; el build falla ante desajustes.

La confirmación auditiva de los 28 archivos la realizó el docente y quedó registrada en `data/audio-verification.json`, vinculada a sus hashes. Un cambio posterior deja la confirmación pendiente hasta nueva revisión. Ver `docs/AUDIO_FINAL_INTEGRATION.md` para pruebas, caché y limitaciones.
