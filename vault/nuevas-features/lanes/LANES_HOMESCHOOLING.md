# Plan Maestro de Lanes — Módulo de Homeschooling

> **Contexto:** Especificación detallada de las 6 lanes de trabajo para implementar el ecosistema completo de Homeschooling en Ordo Diei, siguiendo las directrices de `AGENTS.md` (un worktree por lane, commits aislados, integración exclusiva vía `scripts/integrar.sh` y cero `db push`).

---

## 1. Mapa de Dependencias y Fases

```
                    ┌────────────────────────────────────────┐
                    │ LANE H1: Modelo DB, Pacing & Snow Day │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │ LANE H2: LMS, Reproductor & Hoy Aprendo│
                    └───────────┬───────────────────┬────────┘
                                │                   │
                                ▼                   ▼
┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐
│ LANE H3: Evidencia & Portafolio      │ │ LANE H4: Active Recall & Quizzes     │
│ (Showcase Roost, Cámara, Voz, Swipe) │ │ (Checkpoints de Video, SM-2, Cartas) │
└───────────────────┬──────────────────┘ └──────────────────┬───────────────────┘
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │ LANE H5: Compliance, Transcripts & PDF │
                    │ (Leyes Estatales, Carnegie, Reportes)  │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │ LANE H6: Neurodivergencia & Kiosk      │
                    │ (First/Then, Low Sensory, Curfew Mode) │
                    └────────────────────────────────────────┘
```

---

## 2. Resumen de Lanes de Homeschooling

| Lane | Nombre | Alcance Principal | Componentes Base / Adaptados | Tamaño |
| :--- | :--- | :--- | :--- | :--- |
| **H1** | **Modelo DB, Pacing & Snow Day** | Prisma schema aditivo, función pura `repartir()` con lógica de nieve/enfermedad, Server Actions, tests unitarios matemáticos sin UI compleja. | `SPEC.md` §3.2, Prisma 7, node:test (el proyecto no usa Vitest) | **M** |
| **H2** | **LMS, Reproductor & Hoy Aprendo** | Doble interfaz: "Hoy Aprendo" (niño, táctil gigante, XP/incienso) vs "Cockpit Curricular" (padre). Desbloqueo secuencial con candados. | `LessonPlayer.tsx`, `LearnSidebar.tsx`, `ProgressBar.tsx` de Roost | **L** |
| **H3** | **Evidencia & Portafolio Digital** | Botón de cámara nativa en tablet, audio de 10s, subida a `Archivo`, panel de revisión con swipe del padre, galería anual de portafolio. | `ShowcaseSubmit.tsx`, `ShowcaseCard.tsx` de Roost, `SwipeRow.tsx` de Ordo Diei | **L** |
| **H4** | **Active Recall, Checkpoints & Quizzes** | Pausas interactivas en video (YouTube IFrame API), quizzes con umbral $\ge 70\%$, algoritmo SM-2 de repaso espaciado, recompensas de cartas. | `LessonPlayer.tsx` extendido, `HoloCard.tsx`, motor de cartas de Ordo Diei | **L** |
| **H5** | **Compliance Legal & Transcripts** | Activity Journal para horas offline, catálogo de leyes estatales, cálculo automático de Créditos Carnegie y exportador de Transcripts oficiales en PDF. | `CalendarView.tsx` de Roost, `@react-pdf/renderer` o Print CSS | **M** |
| **H6** | **Neurodivergencia & Command Center** | Tableros Primero/Después (First/Then), historias sociales, Modo Baja Estimulación Sensorial, Modo Kiosk y Battery Health Curfew para tablets de pared. | Radix UI, Framer Motion (reduced motion), PWA API | **M** |

---

## 3. Protocolo de Ejecución de Cada Lane (Recordatorio de AGENTS.md)

1. **Creación de Worktree aislado:**
   ```bash
   git worktree add -b task/lane-NN-homeschooling-fase-X ../ordo-diei-lanes/lane-NN dev
   cd ../ordo-diei-lanes/lane-NN && npm install
   ```
2. **Actualizaciones de Base de Datos:**
   - **PROHIBIDO `npx prisma db push`** o `prisma migrate reset`.
   - Generar únicamente el diff SQL:
     ```bash
     npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > /tmp/cambio.sql
     ```
   - Validar que no contenga sentencias `DROP`.
   - Aplicar con `npx prisma db execute --file /tmp/cambio.sql` y luego `npx prisma generate`.
3. **Calidad y Verificación:**
   - Correr suite de pruebas: `npm test` y comprobación de tipos: `npx tsc --noEmit`.
4. **Integración Exclusiva:**
   - Ejecutar `./scripts/integrar.sh` desde el worktree de la lane (toma lock, hace merge de dev, corre tests y hace merge `--no-ff`).
5. **Limpieza posterior:**
   - Remover el worktree desde el repo base: `git worktree remove ../ordo-diei-lanes/lane-NN` y borrar la rama local con `git branch -d`.
