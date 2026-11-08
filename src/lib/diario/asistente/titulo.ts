// Asistente del diario (lane 298): título automático de la sesión. Reglas puras.
// Portado de vendor/moodiary/packages/feature/moodiary_assistant/lib/src/application/session_title_controller.dart (`normalizeSessionTitle`; ZhuJHua/moodiary@2c552dd).

import { MAX_BYTES_TITULO, MAX_ENTRADA_TITULO_BYTES, mensajeParaTitular } from "./prompt.ts";

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const DIRECCIONALES = /[​‎‏‪-‮⁠-⁤⁦-⁯﻿]/g;
const PENSAMIENTO = /<think>[\s\S]*?<\/think>/gi;

const bytes = (s: string) => new TextEncoder().encode(s).length;

function recortarBytes(s: string, max: number): string {
  if (bytes(s) <= max) return s;
  let salida = "";
  let usados = 0;
  for (const c of s) {
    const n = bytes(c);
    if (usados + n > max) break;
    salida += c;
    usados += n;
  }
  return salida;
}

/** La primera línea con texto, sin controles ni bloques `<think>`, en una sola línea y de hasta `maxBytes` bytes. */
export function normalizarTitulo(crudo: string, maxBytes = MAX_BYTES_TITULO): string {
  const linea =
    crudo
      .replace(PENSAMIENTO, "")
      .split("\n")
      .map((l) => l.replace(CONTROL, "").replace(DIRECCIONALES, "").replace(/\s+/g, " ").trim())
      .find((l) => l) ?? "";
  return recortarBytes(linea, maxBytes).trimEnd();
}

/** El mensaje para titular, o null si no hay texto o es demasiado largo para mandarlo (moodiary no titula esos casos). */
export function mensajeDeTitulo(primerMensaje: string): string | null {
  if (!primerMensaje.trim()) return null;
  const enmarcado = mensajeParaTitular(primerMensaje);
  return bytes(enmarcado) > MAX_ENTRADA_TITULO_BYTES ? null : enmarcado;
}
