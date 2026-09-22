LECTOAP — AUDIO DE PALABRAS V1

Contenido:
- 19 palabras núcleo de LectoAP ya separadas:
  sol, sal, ala, ola, oso, osa, lana, luna, mano, mesa,
  mula, mono, asa, uno, masa, suma, limón, melón, molino.
- word-audio-manifest.json con procedencia y tiempos de corte.

Nombres de archivo:
- Para máxima compatibilidad, los nombres de archivo no llevan tildes:
  limon.m4a y melon.m4a.
- El manifiesto conserva la ortografía correcta: limón, melón.

Uso recomendado:
1. Copiar `assets/audio/words/` al proyecto LectoAP.
2. Integrar `word-audio-manifest.json` con el manifiesto de recursos de la app.
3. No sustituir estos audios por TTS.
4. Incluirlos en la caché offline de la PWA.

Procesado:
- Recorte individual con margen natural.
- Normalización conservadora de pico.
- Exportación AAC en contenedor M4A para buena compatibilidad con Safari/iPad.
