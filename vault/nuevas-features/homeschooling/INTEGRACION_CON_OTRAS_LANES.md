# Homeschooling · lo que quedó fuera y cómo se engancha (análisis)

> Pedido del usuario (2026-10-15): "Tambien lo que quedó fuera analiza si se debe hacer, en caso que si analiza como hacerlo."
> Estado al 2026-10-15: N4 (inactividad) y la pantalla de rutina/temporizador (lane 109) existen en `dev`; **N2, N3, N5, N6 y N13 como tales no**. Cada punto dice si se debe hacer, por qué y cómo.

## Resumen

| Tema | ¿Se hace en Homeschooling? | Estado |
|---|---|---|
| N4 · inactividad | **Sí, ahora** | Hecho: `useMantenerActivo` en visor, foto, reloj, cronómetro y video |
| N13 · temporizador visual | **Sí, mínimo** | Hecho: `TemporizadorLeccion` (anillo verde→rojo) y `Cronometro` |
| N2 · sonidos de efectos | **Sí, pero cuando exista el motor** | Esperando N2 y la carpeta de sonidos del usuario; contrato abajo |
| N3 · música de fondo | **No hay nada propio que hacer** | Solo la señal «video» (hecha) para que baje |
| N5 · borradores | **Sí, cuando exista** | Esperando N5; plan de registro abajo |
| N6 · cierre por inactividad | **Nada propio** | Las exenciones ya están puestas |
| Kiosco, Curfew, Battery Health | **No** | APP nativa (D6) |

## N4 · inactividad (hecho)
`lib/actividad.ts` ya existe. Lo que Estudio tiene de largo sin tocar la pantalla —mirar un video, hacer un quiz, subir fotos, un reloj o un cronómetro corriendo— registra una **exención** con `useMantenerActivo(motivo, activo)`, para que N6 no cierre la sesión ni active el reposo en medio:
`homeschooling-visor` (visor de lección), `video` (mientras reproduce), `homeschooling-evidencia` (subida de fotos), `homeschooling-temporizador` y `homeschooling-cronometro`.

## N13 · temporizador visual (hecho, mínimo)
`TemporizadorDisco` (lane 109) está atado a las etapas de la rutina (`EtapaRutina`, sonidos, ahorro de pantalla), así que no se reutiliza. Se hizo lo que necesita una lección:
- `neuro/TemporizadorLeccion`: anillo que se vacía del verde al ámbar y al rojo (`faseDe`), tiempo en grande, empezar/pausar/reiniciar, **sin sonido ni parpadeo** (apto para modo relajado). En Primero/Después, con el tiempo estimado de la Tarea.
- `horas/Cronometro`: «Cronometrar» en Actividades; guarda el inicio en `localStorage` (sigue contando si se cierra la pantalla) y al parar abre el formulario con inicio y fin cargados.
- Si más adelante nace un `TemporizadorVisual` general (N13), `TemporizadorLeccion` se reemplaza por él con la misma firma `{ minutos }`.

## N2 · sonidos de efectos (cuando exista)
**Se debe hacer**, porque el modo relajado de H6 prometía «silenciar fanfarrias» y hoy no hay nada que silenciar. **No se puede ahora**: el usuario va a aportar la carpeta de sonidos (D1/D2 de `DECISIONES.md`) y no se crean sonidos.
Cómo, cuando N2 tenga motor:
1. El motor expone un único `reproducir(nombre)` y **no suena si `document.documentElement.dataset.relajado` está activo** (la misma señal que ya corta el confeti en `ModalManager.celebrate`).
2. Estudio lo llama en tres lugares y solo ahí: acierto/fallo del checkpoint (`CheckpointOverlay`), resultado del `QuizFinal` y victoria al completar la Tarea del día (`VisorLeccion.cerrarLeccion`, junto a `TASK_SUCCESS`).
3. Cada sonido se puede apagar por alumno desde `ConfigAudio` de N3; Homeschooling no guarda nada propio.
Este requisito se agregó a `sonidos-ui/SPEC.md`.

## N3 · música de fondo
Nada propio. Mientras suena un video, la música debería bajar: N3 puede consultar la exención `video` del registro de `actividad.ts` (ya la registra `ReproductorLeccion`). Agregado a `musica-fondo/SPEC.md`.

## N5 · borradores (cuando exista)
**Se debe hacer.** Hoy solo `EnviarEvidencia` guarda un borrador, en `localStorage` (`hs_evidencia_borrador`, 7 días) como Roost. Cuando exista `useBorrador`/`BorradorRegistro` (spec §4), se registran estos formularios con su clave y modo:

| Formulario | Clave | Modo | Por qué |
|---|---|---|---|
| `EnviarEvidencia` | `hs:evidencia` | `solo-borrador` | enviar avisa al padre; que decida la persona al volver. Las fotos ya subidas son referencias (`/api/archivos/…`) |
| `AsistenteCurso` | `hs:plan-nuevo` | `solo-borrador` | crea planes y días |
| `ActividadForm` | `hs:actividad` | `solo-borrador` | suma horas a varios hijos |
| `EditorPreguntas` | `hs:preguntas:<leccionId>` | `solo-borrador` | reemplaza todas las preguntas |
| `EditorHistoria` | `hs:historia:<id o nueva>` | `solo-borrador` | |
| `MateriaForm`, `CursoForm`, `LeccionForm` | `hs:materia`, `hs:curso`, `hs:leccion:<cursoId>` | `solo-borrador` | |
| `QuizFinal` | — | **no se registra** | es un examen en curso: al volver se rehace; guardar respuestas a medias sería hacer trampa |
| `Cronometro` | — | **no se registra** | ya persiste su inicio |

Al migrar, la clave `hs_evidencia_borrador` se lee una vez, se sube como borrador y se borra. Nada de esto lleva PIN ni datos sensibles.

## N6 · cierre por inactividad
Nada propio. Con las exenciones de arriba, un niño que mira un video de 20 minutos no es expulsado; al pasar a Estudio sin interacción por 60 s se aplica la regla general (guardar borradores y salir).

## Fuera de alcance por decisión (D6): Kiosco, Curfew, Battery Health
Un navegador no puede bloquear la tablet, apagar la pantalla a ciertas horas ni leer o limitar la batería. Son de la APP nativa; `guarda.test.ts` falla si Homeschooling empieza a usar esas APIs.
