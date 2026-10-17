// Constantes del módulo Homeschooling (ARQUITECTURA_DETALLADA §4 y §5.2).

/** Máximo de unidades por día antes de avisar sobrecarga, según el tipo de unidad */
export const MAX_POR_DIA = { leccion: 4, pagina: 30, capitulo: 1, unidad: 3 } as const;

/** Nota mínima (%) para aprobar un quiz de lección */
export const UMBRAL_APROBACION = 70;

/** Hasta esta hora (APP_TZ) la lección del día cuenta «a tiempo» y paga completo */
export const HORA_LIMITE_LECCION = "18:00";
