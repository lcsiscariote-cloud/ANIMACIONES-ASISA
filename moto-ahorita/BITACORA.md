# Entrada para la Bitácora del skill `tiktok-video-evolutivo`

(No existe la herramienta `propose_skills` en esta sesión: pegar esto a mano en la sección "Bitácora de aprendizaje".)

- 2026-10-04 | Assisa Motors "AHORITA" (20 s, 120 BPM) | venta de motos + refacciones, marca local | personaje ilustrado en canvas (puro código) + sketch con bucle | variable nueva vs v3 (foto-motion): **estilo y gancho** (moto con ojo-faro, crash zoom desde el ojo, mirada seca) | el humor relatable ("ahorita la arreglo") + personaje fijo + CTA que reutiliza la palabra del chiste ("LLÁMANOS AHORITA") dará más retención, repeticiones y compartidos que la rejilla de modelos | PENDIENTE: pedir métricas a las 48 h (vistas, retención 2 s/6 s, % completo, repeticiones, comentarios, compartidos, visitas al perfil) | conservar el personaje como serie; cambiar solo una variable en el capítulo 2

**Correcciones del usuario:** tono "limpio pero no tan familiar"; objetivo = venta de motos y que hay refacciones; no mencionar aseguradoras ni marcas.

**Técnicas nuevas (recetas):**
- Personaje = silueta de la marca (moto roja del logo) con ojo-faro (párpado, ojeras, ceja, brillo, mejilla feliz). Una sola carrocería continua (carenado→tanque→cola) se lee como deportiva; piezas separadas parecen "blob".
- El problema del chiste se vuelve la llamada a la acción ("ahorita") y el final empalma con el cuadro 0.
- Barrido de marca rojo·blanco·azul como transición; aterrizajes de piezas en tiempo fuerte con nota ascendente; barrido diagonal de pintura que revela la moto nueva.
- Crash zoom out desde el ojo en 0–0.5 s: el último empuje del bucle desemboca en ese mismo plano.
- Alinear a beat: ciclo día/noche con seno (su derivada máxima cae en 2.0, 2.5, 3.0…); segundero a 2 vueltas/s.
- Zona segura: la caja de Anton incluye el ascendente (baseline ≥ y=380 para tamaño 190); las salidas de texto deben fundirse, no subir fuera de zona.
- Burbuja que "teclea": dibujar el texto parcial sin registrarlo y registrar solo el texto completo (si no, el auditor cuenta cada letra como un texto de 0.1 s).

**Herramientas / entorno:**
- `pip install playwright==1.56.0` empata con el Chromium preinstalado (1194); otras versiones piden `playwright install`.
- Exportar con `capture.py video` y grano animado: ~10 s por cuadro (PNG 1080×1920 con ruido). Usar `canvas.toDataURL('image/jpeg', .94)` con `__anim.seek(t)`: ~10 cuadros/s (`assets/render_mp4.py`). Recomprimir con `-crf 23 -maxrate 9M` (el grano infla el bitrate).
- No usar `pkill -f "capture.py ..."` desde la misma línea de comandos (se mata a sí mismo): matar por PID.
- `E.inQuart` no existe en stage-core (solo `inQ`, `inC`, `outQuart`, `inOutQuart`).
- Auditoría completa ≈ 6 min: para iterar usar `review.py` sin `--full` (≈ 2.5 min).

**Tabla estilo × objetivo:** personaje ilustrado + sketch × venta/marca local → sin datos aún (2026-10-04). foto-motion + beat edit × comentarios/marca local → sin datos aún (2026-10-01).

**Auditoría final:** 0 FAIL · 1 WARN (arranque 0.59× del promedio: el hook es una mirada seca a propósito, con crash zoom, tos del motor y ojos en blanco). Rúbrica: legibilidad 5 · jerarquía 4 · composición 4 · movimiento 4 · ritmo 4 · cohesión 4 · color/luz 4 · narrativa 5 · pulido 4 · sonido 3.5 (medido −13.9 LUFS, pero no se pudo escuchar: revisar a oído antes de publicar).
