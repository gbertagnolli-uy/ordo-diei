# Lane 244 — Acelerador de Puntos por Podio, Elegibilidad por Racha Diaria y Emojis en Fotos

## Objetivo
1. **Premio / Acelerador por puesto en la Tabla de Líderes:**
   - **1er puesto (`🥇`):** Acelerador de **+5% más puntos** mientras esté primero.
   - **2do puesto (`🥈`):** Acelerador de **+3% más puntos**.
   - **3er puesto (`🥉`):** Acelerador de **+1% más puntos**.
2. **Elegibilidad en el Ranking:**
   - Participan en el ranking únicamente los integrantes con **racha diaria de ingreso a la app de por lo menos 2 días** (`rachaApp.dias >= 2`).
3. **Emoji del puesto en la foto:**
   - Mostrar el emoji `🥇`, `🥈` o `🥉` sobre la foto de los 3 primeros puestos tanto en el **perfil**, en el **sidebar**, en la **pantalla de login** (selector de usuario y pantalla de PIN), como en la **Tabla de Líderes** y el **Árbol Familiar**.

## Cambios realizados
- `src/lib/ranking.ts` y `src/lib/ranking.test.ts`:
  - Módulo puro con `MIN_RACHA_RANKING = 2`, `EMOJI_PODIO`, `ACELERADOR_PODIO` (`{ 1: 5, 2: 3, 3: 1 }`), `participaEnRanking`, `calcularRankingUsuarios`, `enriquecerUsuariosConRanking` y `aplicarAceleradorRanking`.
- `src/lib/engagement/servidor.ts`:
  - `mapaRankingDeFamilia`, `infoRankingDeUsuario` y `enriquecerConRachaYRanking` para enriquecer cualquier lista de usuarios con su racha diaria de ingreso y su puesto/emoji/acelerador.
- `src/lib/recompensaTarea.ts`, `src/lib/recompensaTarea.test.ts` y `src/app/api/tasks/[id]/complete/route.ts`:
  - Aplicación del acelerador de puntos por podio (`+5%`, `+3%`, `+1%`) al completar tareas y desglose en el modal `TASK_SUCCESS`.
- `src/lib/habitos/server.ts` y `src/lib/habitos/aprobaciones.ts`:
  - Aplicación del acelerador de puntos por podio al registrar o aprobar hábitos con puntos.
- `src/app/page.tsx`, `src/components/auth/UserSelector.tsx`, `src/components/auth/AuthPageClient.tsx`:
  - Enriquecimiento de `initialUsers` en login con racha y ranking, y visualización de `emojiPodio` (`🥇`, `🥈`, `🥉`) en la foto del selector y del teclado de PIN.
- `src/app/dashboard/layout.tsx` y `src/components/app/NavUser.tsx`:
  - Visualización de `emojiPodio` en la foto del sidebar y del menú desplegable, indicador del acelerador activo y notificación cuando el usuario asciende al 1er puesto.
- `src/app/dashboard/perfil/page.tsx`, `src/app/api/companero/route.ts`, `src/components/perfil/PerfilResumen.tsx` y `src/components/perfil/PerfilView.tsx`:
  - Visualización de `emojiPodio` en la foto de perfil y badge del puesto y acelerador activo.
- `src/components/dashboard/LeaderboardModal.tsx`, `src/components/dashboard/FamilyTree.tsx`, `src/components/dashboard/ModalManager.tsx`:
  - Tabla de líderes filtrada por `rachaApp.dias >= 2`, badges de aceleradores de podio (`+5%`, `+3%`, `+1%`), emojis en las fotos y sección informativa para quienes aún tienen menos de 2 días de racha de ingreso.
