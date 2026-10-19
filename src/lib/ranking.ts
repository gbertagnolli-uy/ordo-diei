// Tabla de líderes, podio y acelerador de puntos por puesto (lane 244).
// - Participan en el ranking quienes tienen racha diaria de ingreso a la app de al menos 2 días (`rachaApp.dias >= 2`).
// - Puesto 1 (🥇): acelerador +5% más puntos mientras esté primero.
// - Puesto 2 (🥈): acelerador +3% más puntos mientras esté segundo.
// - Puesto 3 (🥉): acelerador +1% más puntos mientras esté tercero.

export const MIN_RACHA_RANKING = 2;

export type PuestoPodio = 1 | 2 | 3;

export const EMOJI_PODIO: Record<PuestoPodio, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export const ACELERADOR_PODIO: Record<PuestoPodio, number> = {
  1: 5,
  2: 3,
  3: 1,
};

export const ETIQUETA_PODIO: Record<PuestoPodio, string> = {
  1: "1ro",
  2: "2do",
  3: "3ro",
};

export interface UsuarioRankingInput {
  id: number;
  completionPercentage?: number | null;
  stars?: number | null;
  puntosAcumulados?: number | null;
  rachaApp?: { dias?: number | null } | number | null;
  rachaAppDias?: number | null;
  puestoRanking?: number | null;
  emojiPodio?: string | null;
  aceleradorPct?: number | null;
}

export interface InfoRankingUsuario {
  participaRanking: boolean;
  rachaAppDias: number;
  diasFaltantesParaRanking: number;
  puestoRanking: number | null;
  emojiPodio: string | null;
  etiquetaPodio: string | null;
  aceleradorPct: number;
}

export type UsuarioConRanking<T> = T & InfoRankingUsuario;

/** Extrae los días de racha diaria de ingreso a la app de un objeto usuario */
export function rachaAppDiasDe(u?: UsuarioRankingInput | null): number {
  if (!u) return 0;
  if (typeof u.rachaAppDias === "number" && Number.isFinite(u.rachaAppDias)) {
    return Math.max(0, Math.floor(u.rachaAppDias));
  }
  if (typeof u.rachaApp === "number" && Number.isFinite(u.rachaApp)) {
    return Math.max(0, Math.floor(u.rachaApp));
  }
  if (u.rachaApp && typeof u.rachaApp === "object" && typeof u.rachaApp.dias === "number") {
    return Math.max(0, Math.floor(u.rachaApp.dias));
  }
  return 0;
}

/** Participan en el ranking los que tienen racha diaria de ingreso a la app de por lo menos 2 días */
export function participaEnRanking(u?: UsuarioRankingInput | null): boolean {
  return rachaAppDiasDe(u) >= MIN_RACHA_RANKING;
}

export function esPuestoPodio(puesto: number | null | undefined): puesto is PuestoPodio {
  return puesto === 1 || puesto === 2 || puesto === 3;
}

export function emojiPodioPorPuesto(puesto: number | null | undefined): string | null {
  return esPuestoPodio(puesto) ? EMOJI_PODIO[puesto] : null;
}

export function aceleradorPorPuesto(puesto: number | null | undefined): number {
  return esPuestoPodio(puesto) ? ACELERADOR_PODIO[puesto] : 0;
}

export function etiquetaPodioPorPuesto(puesto: number | null | undefined): string | null {
  return esPuestoPodio(puesto) ? ETIQUETA_PODIO[puesto] : null;
}

/** Devuelve el emoji del puesto 1ro (🥇), 2do (🥈) o 3ro (🥉) si el usuario está en el podio */
export function emojiPodioDeUsuario(
  u?: { emojiPodio?: string | null; puestoRanking?: number | null } | null
): string | null {
  if (!u) return null;
  if (typeof u.emojiPodio === "string" && u.emojiPodio.length > 0) return u.emojiPodio;
  return emojiPodioPorPuesto(u.puestoRanking);
}

/** Orden del ranking: 1. % completitud, 2. estrellas, 3. puntos acumulados, 4. racha app, 5. id */
export function compararUsuariosRanking(a: UsuarioRankingInput, b: UsuarioRankingInput): number {
  const diff1 = (b.completionPercentage || 0) - (a.completionPercentage || 0);
  if (diff1 !== 0) return diff1;
  const diff2 = (b.stars || 0) - (a.stars || 0);
  if (diff2 !== 0) return diff2;
  const diff3 = (b.puntosAcumulados || 0) - (a.puntosAcumulados || 0);
  if (diff3 !== 0) return diff3;
  const diff4 = rachaAppDiasDe(b) - rachaAppDiasDe(a);
  if (diff4 !== 0) return diff4;
  return (a.id || 0) - (b.id || 0);
}

export function infoRankingPorPuesto(rachaAppDias: number, puesto: number | null): InfoRankingUsuario {
  const dias = Math.max(0, Math.floor(rachaAppDias || 0));
  const participa = dias >= MIN_RACHA_RANKING && puesto !== null && puesto >= 1;
  const puestoFinal = participa ? puesto : null;
  return {
    participaRanking: participa,
    rachaAppDias: dias,
    diasFaltantesParaRanking: Math.max(0, MIN_RACHA_RANKING - dias),
    puestoRanking: puestoFinal,
    emojiPodio: emojiPodioPorPuesto(puestoFinal),
    etiquetaPodio: etiquetaPodioPorPuesto(puestoFinal),
    aceleradorPct: aceleradorPorPuesto(puestoFinal),
  };
}

/**
 * Calcula la tabla de líderes separando a los participantes (rachaApp >= 2 días)
 * de quienes aún no cumplen los 2 días de racha diaria en la app.
 */
export function calcularRankingUsuarios<T extends UsuarioRankingInput>(users: T[]): {
  participantes: UsuarioConRanking<T>[];
  noParticipantes: UsuarioConRanking<T>[];
  porUsuarioId: Map<number, InfoRankingUsuario>;
} {
  const elegibles = [...users].filter(participaEnRanking).sort(compararUsuariosRanking);
  const noElegibles = [...users].filter((u) => !participaEnRanking(u)).sort(compararUsuariosRanking);

  const porUsuarioId = new Map<number, InfoRankingUsuario>();

  const participantes = elegibles.map((u, idx) => {
    const info = infoRankingPorPuesto(rachaAppDiasDe(u), idx + 1);
    porUsuarioId.set(u.id, info);
    return { ...u, ...info };
  });

  const noParticipantes = noElegibles.map((u) => {
    const info = infoRankingPorPuesto(rachaAppDiasDe(u), null);
    porUsuarioId.set(u.id, info);
    return { ...u, ...info };
  });

  return { participantes, noParticipantes, porUsuarioId };
}

/**
 * Enriquecer una lista de usuarios manteniendo su orden original (p. ej. en login o layout),
 * añadiendo `puestoRanking`, `emojiPodio`, `aceleradorPct` y `participaRanking`.
 */
export function enriquecerUsuariosConRanking<T extends UsuarioRankingInput>(users: T[]): UsuarioConRanking<T>[] {
  const { porUsuarioId } = calcularRankingUsuarios(users);
  return users.map((u) => {
    const info = porUsuarioId.get(u.id) ?? infoRankingPorPuesto(rachaAppDiasDe(u), null);
    return { ...u, ...info };
  });
}

/**
 * Aplica el acelerador de puntos del podio (5% para 1ro, 3% para 2do, 1% para 3ro).
 * Si el usuario gana puntos (> 0) y tiene un acelerador activo (> 0), suma al menos +1 punto.
 */
export function aplicarAceleradorRanking(
  puntos: number,
  aceleradorPct: number
): {
  puntosTotales: number;
  bonoAcelerador: number;
  aceleradorPct: number;
} {
  const base = Math.max(0, Math.round(puntos || 0));
  const pct = Math.max(0, Number(aceleradorPct) || 0);
  if (base <= 0 || pct <= 0) {
    return { puntosTotales: base, bonoAcelerador: 0, aceleradorPct: 0 };
  }
  const bonoAcelerador = Math.max(1, Math.round((base * pct) / 100));
  return {
    puntosTotales: base + bonoAcelerador,
    bonoAcelerador,
    aceleradorPct: pct,
  };
}
