# Lane 119 — Homeschooling: plan de verificación de la implementación

- Rama: `task/lane-119-hs-plan-verificacion` (desde `dev` 4d30904) · Fecha: 2026-10-14
- Tipo: documentación + script de verificación de solo lectura. **No toca código de la app, `vendor/roost/` ni la base.**

## Pedido del usuario (textual)

> Ahora, documenta el proceso de testing y verificación, para asegurarnos que todo se implementó segun lo planificado.
> No quiero smoke test ni testing en navegador, eso lo hago yo, quiero verificación de código, features, verificación del cumplimiento del plan.

## Qué se hizo

1. **`vault/nuevas-features/homeschooling/PLAN_VERIFICACION.md`** (nuevo):
   - tres momentos: autoverificación antes de integrar, verificación independiente en `dev` y auditoría final;
   - métodos y veredictos con severidad;
   - puertas comunes, incluida G2b: los tests de Homeschooling pasan con `TZ=UTC`, `Asia/Tokyo` y `America/Montevideo`;
   - alcance de archivos por lane y filtro del SQL;
   - requisito → evidencia para HS0…H6;
   - vectores de referencia calculados aparte: 18:00, pacing, `sincronizarDia` con los 10 estados, candados, guardia, permisos, video, quizzes, horas;
   - 23 mutaciones;
   - matrices D-1…D-20, HD1…HD16, X1…X21, P1…P5, cobertura del portado, recortes y supuestos [S];
   - qué no se puede verificar sin base real y qué queda para el usuario en el navegador;
   - plantilla de informe.
2. **`vault/nuevas-features/homeschooling/verificacion/verificar_invariantes.sh`** (nuevo, solo lectura): secciones A–H.
   - **A:** alcance por lane o por cada merge en `dev`.
   - **B:** Roost y portado.
   - **C:** capa de datos y rutas.
   - **D:** premios, Tareas y `complete`.
   - **E:** reglas puntuales.
   - **F:** esquema contra ARQ §3.1 y, con `VERIF_BASE=1`, la base con `migrate diff`.
   - **G:** 39 pares origen → destino.
   - **H:** firmas de los services comparadas con el parser de TypeScript.
3. **Contradicciones nuevas encontradas al escribir los vectores**, resueltas en las specs:
   - **X20** (`LANE_H6`): el confeti en modo relajado se condiciona dentro de `celebrate` (`ModalManager.tsx:30-32`). Condicionar solo L48 dejaba el de `LEVEL_UP` y `SURPRISE_AWARD`, y la aceptación dice «no hay confeti».
   - **X21** (`LANE_H4`): «el checkpoint más cercano sin responder» era ambiguo; ahora es el **primero** sin responder con `segundoVideo ≤ t`.
4. Enlaces y referencias:
   - `PLAN_INTEGRACION_ROOST.md`: «Cómo usar» (autoverificación antes de integrar), protocolo §6 y §9 con X20–X21;
   - `README.md` y `lanes/LANES_HOMESCHOOLING.md`: enlace al plan de verificación;
   - `DECISIONES.md`: ronda 8, D32–D33.

## Cómo se probó el script

- **Sobre esta rama (= `dev` + docs):** `0 FALLA, 0 MIRAR`. Todo lo de Homeschooling sale N/A porque todavía no hay código.
- **Sobre un clon descartable con violaciones sembradas** (vendor editado, archivo sin cabecera, origen descartado o inexistente, `react-router-dom`, `dark:`/`surface-*`/`primary-600`/`card`, `confirm()`, `'use server'`, service con Prisma, componente cliente que importa `servidor/`, ruta sin `conSesion` y `params` sin `Promise`, `availablePoints`, `tarea.create` fuera de `hoy.ts`, cálculo de `complete` cambiado, permiso en el orden incorrecto, `MissionCalendar` tocado, `^14.3.8`, `MainDock` con «Estudio», modelo `Materia` sin un campo, 20:00, `getDay`, `.only`, `skip` sin base, imports `@/` en tests):
  - detectó todas, tanto en modo lane como en modo `dev` (por merge);
  - al principio contaba de menos por los subshells de los pipes; se corrigió con `shopt -s lastpipe`.
- **Sobre un clon con código correcto** (cabecera con «Cambios: … ProgressBar», `import type` de Prisma, `onConfirm`, `toast.error`, `bg-card`, `aria-label`, ruta con `params: Promise`): 0 falsas alarmas.
- **Firmas:** la primera versión, con regex, fallaba con genéricos y comparaciones; se reemplazó por el parser de TypeScript del proyecto. Detecta funciones faltantes y parámetros renombrados (`imageId` → `id`, `startDate` → `start`) y acepta opcionales agregados al final (`estrellas?`).
- **Sobre código real:** `dev` avanzó durante la lane con HS0 (lane 118) y H1a (lane 120).
  - Primera corrida: 4 FALLA y 7 MIRAR, **todos falsos positivos del script**: cabeceras de varias líneas, un comentario de `pacing.ts` con «`Date.now()`», el orden `@db.Date @map` frente a `@map @db.Date` y relaciones a modelos de lanes futuras.
  - Se corrigieron: cabecera leída como bloque; comentarios excluidos; atributos de Prisma ordenados al comparar; relación faltante aceptada solo si apunta a un modelo de ARQ que todavía no está en el esquema. Un campo escalar faltante sigue siendo MIRAR.
  - Segunda corrida: **0 FALLA, 0 MIRAR**. Las violaciones sembradas sobre ese código real (vendor, cabecera de 2 líneas sin commit, origen descartado, `Date.now()` fuera de comentario, `activa` borrado del esquema, borrado de Tarea sin filtro) se siguen detectando.
  - **Esto no es la verificación B** de las lanes 118 y 120: queda pendiente.
- **ts-fsrs 5.4.2:** instalado en un directorio aparte del scratchpad, no en el proyecto. Se confirmaron los nombres de la API y el vector `Good` → +10 min, `Again` → +1 min desde una tarjeta nueva. Se anotó en `LANE_H4` y en §6.7.
- **Vectores de §6.1–6.2:** calculados con una implementación de referencia de ARQ §4 regla 3 y con `Intl` (`America/Montevideo` = GMT−3 en enero, julio y octubre de 2026).

## Pendiente

- Nada de esta lane.
- **Siguiente paso del proceso:** verificación independiente (momento B) de HS0 (lane 118) y H1a (lane 120), ya integradas en `dev`. Va en una sesión distinta de la que las escribió.
