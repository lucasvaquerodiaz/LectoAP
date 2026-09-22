# Desarrollo, publicación e iPad

## Entorno local

Instalar Node 20+ con npm. No hay dependencias obligatorias; no se necesita `npm install`. Ejecutar `npm run validate:data`, `npm test`, `npm run build` y `npm start`. El servidor local es únicamente de desarrollo: los usuarios finales reciben archivos estáticos. No hace falta Node en el iPad. El build queda en `dist/`.

Si un entorno restringido impide que el ejecutor de tests lance procesos, ejecutar `node tests/engine.test.mjs`; es la misma suite en un proceso. Para navegador, instalar Playwright opcionalmente y seguir README. No distribuir `node_modules`, `test-results` ni `data/candidates`.

## GitHub Pages

1. Crear un repositorio en la cuenta deseada y subir el proyecto (incluidos `public`, `data`, `src`, `scripts`, `tests`, `inputs/audio_final` y documentación). No subir `dist` generado ni `test-results`.
2. Usar rama `main`, o ajustar `branches` en `.github/workflows/pages.yml` al nombre real.
3. En Settings → Pages → Build and deployment, elegir **GitHub Actions**.
4. Hacer push o ejecutar manualmente «Validate and deploy LectoAP» desde Actions.
5. El workflow valida bancos, ejecuta tests de lógica, crea el build y publica el artefacto con las acciones oficiales de Pages.
6. Abrir la URL que devuelve el job `deploy`, normalmente `https://USUARIO.github.io/REPOSITORIO/`. Conservar la barra final. No se necesita una regla de redirección SPA: no hay rutas de aplicación basadas en History API.

El `start_url`, `scope`, enlaces y cargas de recursos son relativos. El service worker se sirve desde la raíz del build y limita las cachés y peticiones al scope. La prueba local `/LectoAP/` permite comprobar esto antes de publicar. La verificación de la URL real requiere que el usuario proporcione un repositorio y complete el despliegue; no se afirma que ya esté publicado.

## Actualizar

Cambiar las versiones aplicables en `data/version.json`, validar y publicar un nuevo build. Después de la migración correctiva de audio, el worker se instala en espera. La única excepción es retirar una caché anterior a `audio-final-v1`: la corrección se activa, borra la caché antigua y recarga sus ventanas para retirar también el audio que hubiera en memoria. El modo docente ofrece «Buscar actualización» y, cuando hay una en espera, «Actualizar ahora». La activación explícita recarga la aplicación fuera de sesión. Incluso si se olvida subir la versión declarada, la huella de contenido del build cambia la caché. Mantener versiones explícitas permite identificar la entrega.

## Instalar en iPad

1. Abrir la URL HTTPS de Pages en Safari.
2. Esperar a la carga completa y a que aparezca «Aplicación bajo control de la caché local» al volver a inicio.
3. Probar desde modo docente los nueve sonidos y una actividad con imágenes.
4. Compartir → **Añadir a pantalla de inicio** → Añadir.
5. Abrir el icono y comprobar una tanda en modo avión. No comenzar una sesión si falta algún recurso.

AAC/m4a se reproduce con Web Audio desbloqueado por toque; hay alternativa HTMLAudio si no existe AudioContext. La caché atiende solicitudes Range para audio. No se han transcodificado los originales. El sonido audible depende también del volumen, salida de audio y ajustes del dispositivo.

La aplicación usa módulos JavaScript y sintaxis moderna moderada, incluida encadenación opcional: navegadores muy antiguos que no la soporten no abrirán la app. No se garantiza una versión de iOS no probada. La disponibilidad de PWA y conservación de caché depende del navegador/SO; iOS puede desalojar datos al necesitar espacio. No borrar datos del sitio si se quiere conservar el contenido offline.

## Privacidad

Sin identificadores de alumnado, almacenamiento de respuestas, servicios externos ni telemetría. Los recursos y créditos se almacenan en caché. Los enlaces a licencias se abren solo si la persona los activa. El navegador puede comprobar actualizaciones del mismo origen durante apertura/registro; no se llama a ARASAAC durante actividades.
