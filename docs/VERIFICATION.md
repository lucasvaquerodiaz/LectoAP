# Verificación de la entrega

21-09-2026. Windows; Node del entorno de desarrollo. Aplicación 1.0.0 / contenido 1.0.0. Build final: `9dc93e92e13f` (el script muestra la huella de cada regeneración). 50 archivos, 345.589 bytes sin compresión, aproximadamente 338 KiB. No incluye navegadores de pruebas ni candidatos de imágenes.

## Lógica y bancos

`node tests/engine.test.mjs`: **23 pruebas aprobadas, 0 fallidas**. Se ejecutó también el runner con aislamiento desactivado porque el sandbox impide crear subprocesos del runner convencional; no es un fallo de los tests. Fuera de ese sandbox, `npm test` ejecuta la misma suite mediante `node --test`.

Incluye 20 actividades × 80 semillas de generación, filtros por letras, NUBE, tildes, exactitud de conjuntos/respuestas, distractores, mezcla V/CV/VC, introducción de tres ítems, adaptación, ayudas, banco corrupto, conservación binaria de audio, manifest y restricciones de recursos. Se añadió una prueba de ampliación B/V → /b/ para evitar asumir una correspondencia universal uno a uno.

`node scripts/validate-data.mjs`: **aprobado**. 19 palabras núcleo, 1 palabra oral adicional, 34 sílabas/vocales, 20 actividades, 9 audios y 4 imágenes pendientes excluidas de tareas visuales.

`node scripts/build.mjs`: **aprobado**. Build estático relativo para GitHub Pages, precaché completa, iconos PNG 192/512 y manifest.

## Navegadores

| Comprobación | Chromium 151.0.7922.34 | WebKit 26.5 para Windows |
|---|---|---|
| Carga bajo `/LectoAP/` | Aprobada | Aprobada |
| 20 motores: preparación, respuesta, feedback, salida | Aprobada | Aprobada |
| Ausencia de palabra escrita objetivo en CF | Aprobada | Aprobada |
| Decodificación Web Audio de 9 AAC, muestras no silenciosas | Aprobada | API no disponible en este build |
| HTMLAudio: reproducción hasta `ended`, 9 clips | Aprobada | Aprobada |
| Recarga offline y petición de los 50 recursos cacheados | Aprobada | No verificada: error interno del navegador de pruebas al recargar offline |
| Range AAC: 206 y 100 bytes pedidos | Aprobada offline | No certificada offline |
| Lectura con imágenes offline | Aprobada | No certificada offline |
| Actualización en espera durante actividad | Aprobada | No ejecutada |
| Activación explícita y eliminación de caché anterior | Aprobada | No ejecutada |
| Tanda completa de 5 ítems y final | Aprobada | No ejecutada |
| Salir/reanudar una respuesta corregida | Aprobada | Recorrido básico de salida aprobado |
| 390×844 sin desbordamiento horizontal | Aprobada | Aprobada |
| Salida durante audio sin errores JavaScript | Aprobada | Aprobada |

Las pruebas de interfaz usan 1024×768 con soporte táctil emulado, más 390×844 para diseño estrecho. Se revisaron visualmente las capturas de inicio, segmentación y construcción. Algunas pantallas pueden requerir desplazamiento vertical. La emulación no equivale a un iPad físico.

En el recorrido completo Chromium no se detectaron errores JavaScript ni solicitudes a terceros. Los recorridos de interfaz y audio de WebKit tampoco registraron errores JavaScript de la app. El error offline de WebKit es un fallo reportado por su automatización y se conserva como limitación, no se oculta ni se considera aprobado.

## Audio

SHA-256 de cada copia coincide con su original. Sin nuevos recortes, transcodificación ni TTS. Duraciones comprobadas por reproducción/decodificación: A 0,68 s; E 0,83 s; I 0,69 s; O 0,82 s; U 0,74 s; L 0,74 s; M 0,77 s; S 0,86 s; N 0,93 s. No se realizó una nueva valoración humana de pronunciación: se conserva la validación y procedencia del manifiesto aportado. La comprobación automatizada de reproducción no verifica el volumen o la salida física de un iPad.

## Evidencia y reproducción

Los scripts `tests/browser.mjs`, `tests/update.mjs` y `tests/layout-audio.mjs` se pueden ejecutar con Playwright opcional. `test-results/` contiene informes completos y capturas locales, excluidos de Git por su carácter generado. Una copia de los informes se incluye en `docs/verification-results.json`.

Se corrigieron durante las pruebas una recarga inicial innecesaria, la conservación del botón Continuar al volver de la pantalla de salida y una posible referencia a un botón ya retirado al salir durante la reproducción. También se corrigió un falso positivo del test textual que encontraba ALA dentro de «palabra»; la comprobación final compara palabras completas.

## No verificado

- Safari en un iPad real, modelos antiguos y versiones específicas de iPadOS.
- Instalación efectiva en pantalla de inicio y conservación de caché durante días.
- URL de GitHub Pages desplegada: no se proporcionó un repositorio de destino.
- Validación educativa con alumnado y lectores de pantalla físicos.
- Aprobación de OSA, ASA, MULA y MASA como imágenes inequívocas.

Para completar aceptación en el centro: desplegar con la guía, abrir en el iPad, probar los nueve sonidos, instalar, activar modo avión y realizar una tanda CF y otra SL. Registrar modelo de iPad y versión de Safari/iPadOS junto con el resultado.
