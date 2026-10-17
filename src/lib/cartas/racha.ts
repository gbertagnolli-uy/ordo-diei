// Racha efectiva y estrellas por racha (vault/ECONOMIA_CARTAS.md §8)

import { differenceInCalendarDays } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { APP_TZ } from "./eventos.ts";
import { DIAS_RACHA_POR_ESTRELLA } from "./economia.ts";

/**
 * Racha vigente: `streakDays` solo se actualiza al completar una tarea, así que si la última fue
 * antes de ayer (en `APP_TZ`) la racha ya se cortó aunque el número guardado siga alto.
 */
export function rachaEfectiva(
  streakDays: number | null | undefined,
  ultimaTarea: Date | null | undefined,
  ahora: Date = new Date(),
  timezone: string = APP_TZ
): number {
  if (!ultimaTarea || !streakDays || streakDays <= 0) return 0;
  const dias = differenceInCalendarDays(new TZDate(ahora, timezone), new TZDate(ultimaTarea, timezone));
  return dias <= 1 ? streakDays : 0;
}

/** Estrellas que gana quien acaba de pasar de `antes` a `despues` días de racha (1 cada 7 días) */
export function estrellasPorRacha(antes: number, despues: number): number {
  if (despues <= antes) return 0;
  return Math.floor(despues / DIAS_RACHA_POR_ESTRELLA) - Math.floor(antes / DIAS_RACHA_POR_ESTRELLA);
}
