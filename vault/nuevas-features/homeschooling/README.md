# Homeschooling — casi una app nueva extra

> Estado: **lista para implementar** (2026-10-14, v3.1). **Empezar por [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md)** (Roost portado desde `vendor/roost/`); esquema y reglas en [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md); resumen en [`SPEC.md`](SPEC.md); cómo se verifica lo implementado en [`PLAN_VERIFICACION.md`](PLAN_VERIFICACION.md). Las secciones de abajo son el pedido original y la investigación (historial).

## 1. Pedido del usuario (textual)

> Empecemos la planificación de estas nuevas features:
>
> Marketplace (Para canjear alguna de las monedas de la app por premios fisicos reales)
> Homeschooling (Complejo, es casi una app nueva extra)
> Sonidos UI para recompensas y acciones en la APP
> Meal planner
> Temporizadores Visuales
> Idle State: Marco de Fotos Dinamico en pantalla principal donde aparecen las fotos de los usuarios para iniciar sesion
> Kiosk Mode / App Pinning
> Musica de fondo
>
> Anota todo esto en el vault en carpetas separadas.
>
> (Más la investigación pegada: [`../ref/investigacion-1-centros-de-comando.md`](../ref/investigacion-1-centros-de-comando.md) y [`../ref/investigacion-2-software-puro.md`](../ref/investigacion-2-software-puro.md).)

Línea que corresponde a esta feature: **«Homeschooling (Complejo, es casi una app nueva extra)»**

## 2. Qué dice la investigación (resumen por bloque)

**Automatización curricular («Set & Forget»)** — inv. 2 §1
- **Pacing dinámico**: el padre importa un recurso (libro de 300 págs., curso de 120 videos); el algoritmo lo reparte entre los días lectivos, salta fines de semana y festivos. **«Snow Day Logic»**: si el niño se enferma, el padre marca «día no lectivo» y se recalcula sin romper la fecha de fin. (Homeschool Scheduler, Panda, Time4Learning.) Inv. 1 §4: «Pacing Automático (Auto-Advance)».
- **Desbloqueo secuencial**: la lección 4 no se ve hasta aprobar el quiz de la 3 con >70 %.
- **Doble interfaz admin vs. estudiante**: mismos datos, dos vistas (padre: tablas, rúbricas, overrides; niño: tarjetas grandes, barras de progreso, avatares).

**LMS interactivo «Play & Go»** — inv. 1 §4 e inv. 2 §3
- El niño toca la tarjeta «Ciencias» → video embebido + quiz; al aprobar se desbloquea la siguiente.
- Reproductor con **checkpoints embebidos** (pausa a los 3 min y pregunta).
- **Pizarra/sandbox táctil** junto al video (OCR o validación básica).

**Compliance, portafolio y export (el «moat»)** — inv. 2 §4
- Generador de portafolio 1-click en PDF (fotos, horas, calificaciones, formato por jurisdicción) — feature premium.
- **Cámara para evidencia de aprendizaje** (foto con fecha/hora al portafolio del padre; el padre aprueba desde el móvil).
- **Transcript builder** (créditos, GPA) para secundaria.

**Priorización de la investigación**
- Could-Have (océano azul): auto-pacing, reportes PDF. Quick win RICE: pacing dinámico. Core/alto esfuerzo: motor de evidencia (cámara). Monetización: tier premium ($9/mes sugerido) por reportes/transcripts.
- **Won't-Have por ahora: motor de video LMS propio** → embeber enlaces de YouTube/Vimeo o LTI de Canvas.
- Ventaja propuesta: «**Middleware Familiar**», el dashboard que orquesta contenido ajeno.

## 3. Lo que ya existe en el repo

- `Libro` + `HABITO_LIBRO.md` (lane 38): hábito ligado a un libro, con progreso. Es el embrión del pacing; revisar antes de duplicar.
- Hábitos con franjas, niveles y XP (`HABITOS_Y_NIVELES.md`), aprobación de padres (`APROBACION_HABITOS.md`).
- `Archivo` (uploads) por si sirve para evidencias.

## 4. Propuesta de fases (a validar)

Es grande: dividir en lanes encadenadas, cada una entregable sola.
1. **Currículo y pacing**: entidad Curso/Recurso + lecciones + calendario lectivo (días no lectivos, feriados) + «lección del día» en la vista del niño.
2. **Evidencia**: foto por lección/tarea, aprobación del padre.
3. **Quiz y desbloqueo secuencial** (contenido embebido de terceros, sin hostear video).
4. **Portafolio/PDF** y horas registradas.
5. (Más adelante) transcript, pizarra.

## 5. Preguntas abiertas (RESUELTAS como decisiones HD1–HD14 en `ARQUITECTURA_DETALLADA.md` §1)

1. ¿Quién es el usuario objetivo: solo esta familia o producto para otras familias (SaaS)? Cambia compliance/monetización.
2. ¿Jurisdicción para los reportes (Uruguay u otra)?
3. ¿Contenido propio o solo enlaces/PDF/libros físicos?
4. ¿Cómo se conecta con hábitos/libros existentes (¿una lección es un hábito del día?) y con XP/monedas?
5. ¿Cámara en la tablet de pared o en el móvil del niño?
