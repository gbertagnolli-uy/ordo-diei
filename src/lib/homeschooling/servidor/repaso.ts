// Repaso espaciado con ts-fsrs (algoritmo FSRS de Anki). Este módulo es el único que importa la librería: el resto del
// código trabaja con `TarjetaGuardada` (la Card serializada) y con fechas.
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";

export const ACIERTOS_PARA_RESOLVER = 3;
export const INTERVALO_RESUELTA_DIAS = 30;

/** Card tal cual (fechas como texto en el JSON) más los aciertos seguidos */
export type TarjetaGuardada = Omit<Card, "due" | "last_review"> & { due: string; last_review?: string | null; _aciertos: number };

const planificador = fsrs();

const aGuardada = (c: Card, aciertos: number): TarjetaGuardada => ({
  ...c,
  due: c.due.toISOString(),
  last_review: c.last_review ? c.last_review.toISOString() : null,
  _aciertos: aciertos,
});

const aCard = (t: TarjetaGuardada): Card => ({ ...t, due: new Date(t.due), last_review: t.last_review ? new Date(t.last_review) : undefined }) as Card;

export function nuevaTarjeta(ahora: Date): { tarjeta: TarjetaGuardada; proximo: Date } {
  const card = createEmptyCard(ahora);
  return { tarjeta: aGuardada(card, 0), proximo: card.due };
}

/** Acierto = Good, fallo = Again. Resuelta tras 3 aciertos seguidos con un intervalo ≥ 30 días. */
export function responderTarjeta(guardada: TarjetaGuardada, acierto: boolean, ahora: Date) {
  const { card } = planificador.next(aCard(guardada), ahora, acierto ? Rating.Good : Rating.Again);
  const aciertos = acierto ? (guardada._aciertos ?? 0) + 1 : 0;
  return {
    tarjeta: aGuardada(card, aciertos),
    proximo: card.due,
    resuelta: aciertos >= ACIERTOS_PARA_RESOLVER && card.scheduled_days >= INTERVALO_RESUELTA_DIAS,
  };
}

/** Calificación de 4 niveles (recitado frente a un padre): otra vez / difícil / bien / fácil. Dominada tras 3 «bien» o «fácil» seguidos con ≥ 30 días. */
export type NivelRecitado = "otra_vez" | "dificil" | "bien" | "facil";
const RATING: Record<NivelRecitado, Grade> = { otra_vez: Rating.Again, dificil: Rating.Hard, bien: Rating.Good, facil: Rating.Easy };

export function responderNivel(guardada: TarjetaGuardada, nivel: NivelRecitado, ahora: Date) {
  const { card } = planificador.next(aCard(guardada), ahora, RATING[nivel]);
  const acierto = nivel === "bien" || nivel === "facil";
  const aciertos = acierto ? (guardada._aciertos ?? 0) + 1 : 0;
  return {
    tarjeta: aGuardada(card, aciertos),
    proximo: card.due,
    resuelta: aciertos >= ACIERTOS_PARA_RESOLVER && card.scheduled_days >= INTERVALO_RESUELTA_DIAS,
  };
}
