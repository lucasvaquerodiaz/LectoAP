# Auditoría contra la especificación

Fecha: 21-09-2026. Aplicación 1.1.0; contenido 2.0.0. Se diferencia implementación de verificación real. La V1 usa 9 fonemas y 19 palabras de las fuentes definitivas; la voz docente es fallback de palabras sin grabación. La revisión actual de audio se detalla en AUDIO_FINAL_INTEGRATION.md. No se declara validación en iPad físico ni despliegue real en GitHub Pages.

| § | Requisito | Estado y evidencia |
|---|---|---|
| 1 | Objetivo educativo | Cuatro módulos, interfaz sin elementos competitivos; castellano. |
| 2 | Principios pedagógicos | Consigna breve, reintento, modelado, CF sin palabra escrita en alumno; guía en PEDAGOGY. Pilotaje educativo pendiente. |
| 3 | Nueve letras; ampliación | A E I O U L M S N configurables. JSON ampliables sin inventar secuencia posterior. |
| 4 | Fonema ≠ grafema | Inventarios separados y transcripción explícita; prueba sintética B/V → /b/. Grafías contextuales futuras no se presentan como correspondencias aisladas sin contexto. |
| 5 | Cuatro módulos | CF, SL, combinado y vocabulario. Combinado requiere confirmación docente de trabajo previo. |
| 6 | Motores | CF01–08, SL01–07 y S+L01–03 operativos. CF08 implementa sustitución como extensión; eliminación/adición/inversión fonémica no se añadieron. |
| 7 | Estructuras | V, CV, VC, CVC, VCV, CVCV, CVCVC, CVCVCV en datos y filtros. |
| 8 | Bloqueado/intercalado | Introducción opcional de 3 ítems; luego priorización de estructuras menos practicadas. Verificado V/CV/VC. Si solo una estructura es elegible no se inventa diversidad. |
| 9 | Adaptación | Ventana hasta 10; mínimo 5; una dimensión por cambio. Semejanza en imágenes o número de opciones en correspondencias/segmentación. Otros motores mantienen la estructura de la tarea. |
| 10 | Feedback | Mensaje breve, segundo intento y solución/modelado sin castigo. Se registra solo primera respuesta. |
| 11 | Tandas | 6 predeterminado; 5/6/8/10. Repetir, otra actividad, inicio. Sesión completa probada. |
| 12 | Sílabas | 20 CV prioritarias, 9 VC y 5 vocales. Datos explícitos, sin pseudopalabras polisilábicas. |
| 13 | Palabras núcleo | 19 registros. LOMA fuera; MONO animal. OSA/ASA/MULA/MASA pendientes de imagen y excluidas de motores visuales. LIMÓN/MELÓN conservan tilde. |
| 14 | Pares útiles | Relaciones declaradas; distractores por distancia fonémica; cambios explícitos. Pares con imágenes dudosas no entran en distractores visuales. |
| 15 | Banco oral | Banco adicional inicial de una palabra, NUBE, revisada. Lista orientativa extensa no incorporada sin revisión. CF puede trabajar /n/ de NUBE sin habilitar B en lectura. |
| 16 | Modelo de palabras | Campos solicitados, posiciones, transcripción, permisos, recursos y revisión. |
| 17 | Modelo de sílabas | Estructura, fonemas, letras, prioridad/frecuencia y permisos declarados. Selección restringida al banco recomendado. |
| 18 | Audios | 28 audios definitivos con hashes, confirmación auditiva del docente y verificación técnica. Safari/iPad físico pendiente. |
| 19 | ARASAAC local | 16 PNG oficiales de 300 px descargados. Ninguna búsqueda durante sesiones. |
| 20 | Selección visual | Candidatos comparados semántica y visualmente en hoja de contacto. No selección automática del primer resultado. |
| 21 | Manifiesto ARASAAC | IDs, etiquetas, URLs, autor, propietario, licencia y razón; condiciones oficiales consultadas. |
| 22 | Licencias/fuentes | CREDITS_AND_LICENSES y pantalla interna. Sin copias de materiales pedagógicos. No se aportaron publicaciones para verificar citas bibliográficas. |
| 23 | Ayuda oral | Política por motor; integración, lectura y dictado no ofrecen denominación de opciones. Audio real; docente solo como fallback, sin TTS. |
| 24 | Tipografía | Mayúscula/minúscula de imprenta; ligada diferida por no seleccionar una fuente licenciada. |
| 25 | Interfaz alumno | Demanda única, botones grandes, poca decoración. Revisión visual en capturas 1024×768; algunas pantallas requieren desplazamiento. |
| 26 | Tacto | Toque para seleccionar/colocar, cajas para quitar, borrar último. No depende de arrastre ni teclado. |
| 27 | Modo docente | Módulo, motor, letras, longitud de tanda, dificultad, auto, audio, repetición, ayudas, posición, estructuras, Ó y preparación del combinado. Ajustes permanecen en memoria de la apertura. |
| 28 | Sin perfiles | Sin cuentas, nombres, base de datos ni persistencia de resultados. |
| 29 | Privacidad | Sin rastreadores; comprobado que el recorrido no pide recursos a terceros. Actualizaciones del mismo origen. |
| 30 | Arquitectura | HTML/CSS/JS estáticos sin dependencias de producción; Node únicamente para herramientas de desarrollo. |
| 31 | iPad | Controles táctiles y diseño adaptable. Chromium y WebKit de escritorio probados; antigüedad de hardware e instalación real en iPad pendientes. No se promete iOS antiguo. |
| 32 | PWA/offline | Manifest, worker versionado, precaché completa y Range AAC. Offline aprobado en Chromium. WebKit de Windows falla internamente al simular recarga offline; no se certifica ahí. |
| 33 | GitHub Pages | Workflow y rutas relativas; subdirectorio /LectoAP/ probado localmente. Publicación remota pendiente de repositorio/destino. |
| 34 | Repositorio | src, public, data, scripts, tests, docs e inputs. Build separado. |
| 35 | Validadores | Cantidad, estructura, extremos/posiciones, grafemas declarados, rutas, imagen, audio exigido, IDs aprobados, duplicados y opciones/respuestas de ítem. Las letras habilitadas se validan al generar. |
| 36 | Generación restringida | Filtros por permisos, letras, longitud, estructura, claridad y prioridad; validación antes de presentar. Configuraciones insuficientes producen aviso. |
| 37 | Distractores | Distancia fonémica graduada; solo imágenes aprobadas y distintas. Tres opciones visuales; nivel afecta semejanza. |
| 38 | Pruebas automáticas | 31 pruebas de lógica/datos; suite navegador 20 motores; offline/audio; suite actualización y tanda completa. Ver VERIFICATION. |
| 39 | Escenarios pedagógicos | NUBE fuera de escritura; SOL=3; distractores; adaptación alta/baja; mezcla V/CV/VC; tildes probadas. |
| 40 | Accesibilidad | HTML semántico, foco, etiquetas, estado en vivo, texto/icono además del color y reduced motion. Sin auditoría con lector de pantalla real. Las opciones visuales se denominan por número para no revelar la respuesta. |
| 41 | Rendimiento | Sin frameworks, vídeos ni fuentes descargadas. V1 completa en caché; candidatos de preparación fuera del build. |
| 42 | Documentación pedagógica | PEDAGOGY en formulación propia; limitación bibliográfica explícita. |
| 43 | Añadir contenido | CONTENT_AUTHORING con fonema, grafema, sílaba, palabra, recurso y validación. |
| 44 | Versiones separadas | appVersion y contentVersion, generación audio-final-v1 y huellas SHA-256 de audio y build. |
| 45 | Aceptación | Apertura, motores, letras, audio, pictogramas, construcción, adaptación, offline y ausencia de errores: pruebas locales. Instalación iPad y Pages real no verificadas. |
| 46 | Orden | Se inspeccionaron fuentes, definieron datos/motores y revisaron recursos antes de refinar interfaz; después PWA y pruebas. |
| 47 | Estética | Sencilla, tranquila, sin animación ni decoración competitiva. |
| 48 | Prohibiciones | Sin backend/cuentas/TTS/analítica/articulemas/copias/alteración de audios ni eliminación de tildes. |
| 49 | Entregables | Código, bancos, recursos aprobados, manifiestos, scripts, PWA, pruebas y documentación incluidos. Recursos dudosos e implantación externa expresamente pendientes. |
| 50 | Dudas ARASAAC | arasaac-review.json conserva razones/candidatos. No se bloquean el resto de motores. |
| 51 | Informe final | README, VERIFICATION y esta auditoría; resumen en la conversación. |
| 52 | Prioridad | Se excluye contenido visual ambiguo y se conserva el audio; se prioriza funcionamiento antes que estética. |

## Pendientes concretos

- OSA: los IDs 2488, 2869 y 2868 comparten denominación con oso; no distinguen la palabra sin ayuda adicional.
- ASA y MULA: la consulta exacta no aportó candidato fiable; no se sustituyen silenciosamente por asa de otra acepción o por burro/caballo.
- MASA: candidatos 32476 (masa extendida) y 38442 (bola relacionada con pan). Confirmar cuál representa mejor masa de pan cruda para este alumnado.
- Probar en el iPad real: salida audible, instalación, recarga offline y persistencia de caché; WebKit de pruebas no lo sustituye.
- Publicar y verificar URL real de GitHub Pages cuando exista un repositorio seleccionado.
- Pilotaje educativo, expansión revisada del banco oral y eventual fuente ligada.

Estos pendientes no se presentan como comprobaciones completadas. No se publicaron recursos ambiguos como si estuvieran aprobados.
