---
lane: 301
titulo: Trazabilidad de las fuentes de animación de moodiary (cierre de la lane 300)
plane: "#31"
estado: integrada
rama: task/lane-301-vendor-animaciones
agente: claude
actualizado: 2026-11-08
---

# Lane 301 — Fuentes de animación en `vendor/moodiary`

La lane 300 portó las animaciones de moodiary pero no copió a `vendor/moodiary` los fuentes que se leyeron, lo que rompía la regla de trazabilidad. Esta lane lo cierra. Solo documentación y copias de fuentes de terceros; no toca código de `src/`.

## Qué se hace
- Se copian, sin cambios y desde el clon `repos-externos/moodiary` (commit `2c552ddd7939a054122380397fb914cf000824b0`, el mismo que el resto del vendor): `mui/.../themes/page_transitions.dart`, `mui/.../components/basic/{select_mark,loading,ink_well}.dart`, `mui/.../components/common/chip_bar.dart`, `moodiary_diary/.../widget/diary_tile_frame.dart`, `moodiary_assistant/.../presentation/assistant_notice.dart`. `calendar_page.dart`, `search_page.dart` y `diary_page.dart` ya estaban.
- `vendor/moodiary/ORIGEN.md`: sección «Ampliación (lane 301)» con la lista y lo que se portó y no se portó.
- `THIRD_PARTY_NOTICES.md`: se agregan 300/301 a la lista de lanes de moodiary.

## Archivos en alcance
`vendor/moodiary/**` (7 fuentes nuevos, `ORIGEN.md`) y `THIRD_PARTY_NOTICES.md`. Sin base de datos, sin pruebas, sin código de `src/`.

## Microtareas
- [x] M1 · Copiar los siete fuentes y documentar en `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M2 · (PR #107) Commit con paths explícitos, PR (`abrir-pr.sh`), integración, `limpiar-lane.sh 301`, BACKLOG_PLANE («Próxima lane libre: 302»).

## Bitácora
- 2026-11-08 · claude · INICIO 301 (desde `dev` = `baac659`). Trabajo directo de X7: son copias de fuentes y documentación, no implementación.
- 2026-11-08 · claude · FIN 301: siete fuentes copiados, ORIGEN.md y THIRD_PARTY_NOTICES al día. Suite existente verde (corrida por abrir-pr.sh, tras instalar dependencias en el worktree). PR #107 integrado, lane limpiada.
