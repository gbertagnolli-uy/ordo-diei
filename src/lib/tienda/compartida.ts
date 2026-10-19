// Lógica pura de Compra Compartida en la Tienda (lane 238):
// - Evaluación de aptitud de cada participante (todos deben cumplir los requisitos del producto,
//   salvo tener monedas suficientes individualmente porque comparten el gasto).
// - Distribución recomendada (no fija) consciente del saldo disponible de cada participante.
// - Validación de la distribución personalizada elegida por el solicitante.

import { MONEDAS, type Costo, type Moneda, type Saldos } from "./monedas.ts";
import { estadoProducto, type DatosEstado, type EntornoEstado } from "./estado.ts";

export interface AptitudParticipante {
  apto: boolean;
  motivo: string | null;
}

/**
 * Evalúa si una persona puede participar en la compra compartida de un producto.
 * Regla: todos los participantes deben cumplir las condiciones del producto (nivel, XP, racha,
 * rol, límite por período, destinatario, sin sanción, etc.), CON EXCEPCIÓN de no tener monedas
 * suficientes por sí solos (`sinSaldo` es válido porque compartirán el gasto).
 */
export function evaluarAptitudParticipante(
  datos: DatosEstado,
  env: EntornoEstado,
  opciones?: { sancionado?: boolean }
): AptitudParticipante {
  if (opciones?.sancionado) {
    return { apto: false, motivo: "Tiene una sanción activa hoy" };
  }
  const r = estadoProducto(datos, env);
  switch (r.estado) {
    case "comprable":
    case "sinSaldo":
      return { apto: true, motivo: null };
    case "bloqueado": {
      const pendientes = env.requisitos.filter((req) => !req.cumplido).map((req) => req.texto);
      return {
        apto: false,
        motivo: pendientes.length > 0 ? `Falta: ${pendientes.join(" · ")}` : "No cumple los requisitos de desbloqueo",
      };
    }
    case "limite":
      return { apto: false, motivo: "Ya alcanzó el límite de compras de este producto" };
    case "oculto":
      if (datos.destinatarios && datos.destinatarios.length > 0 && !datos.destinatarios.includes(datos.usuarioId)) {
        return { apto: false, motivo: "Este producto no está habilitado para esta persona" };
      }
      return { apto: false, motivo: "Este producto no está disponible" };
    case "proximamente":
      return { apto: false, motivo: "Todavía no está a la venta" };
    case "agotado":
      return { apto: false, motivo: "Producto agotado" };
  }
}

export interface ParticipanteConSaldo {
  usuarioId: number;
  saldos: Saldos;
}

export interface AporteParticipante {
  usuarioId: number;
  costos: Costo[];
}

/**
 * Sugiere cuánto paga cada participante para cubrir `costosTotales`.
 * Reparte cada moneda de forma equitativa pero respetando el saldo disponible de cada uno
 * (por ejemplo, si el producto pide 1 estrella + puntos y solo uno tiene estrellas, le sugiere
 * la estrella a quien la tiene y reparte los puntos).
 */
export function recomendarDistribucion(
  costosTotales: Costo[],
  participantes: ParticipanteConSaldo[]
): AporteParticipante[] {
  const n = participantes.length;
  if (n === 0) return [];

  const porUsuario = new Map<number, Map<Moneda, number>>(
    participantes.map((p) => [p.usuarioId, new Map<Moneda, number>()])
  );

  for (const { moneda, monto } of costosTotales) {
    if (monto <= 0) continue;
    const asignado = new Array<number>(n).fill(0);
    const tope = participantes.map((p) => Math.max(0, Math.trunc(p.saldos[moneda] ?? 0)));
    let restante = monto;

    // Fase 1: reparto parejo limitado al saldo real de cada participante
    while (restante > 0) {
      const activos: number[] = [];
      for (let i = 0; i < n; i++) {
        if (asignado[i] < tope[i]) activos.push(i);
      }
      if (activos.length === 0) break;

      const cuota = Math.max(1, Math.floor(restante / activos.length));
      for (const i of activos) {
        if (restante <= 0) break;
        const margen = tope[i] - asignado[i];
        const dar = Math.min(restante, margen, cuota);
        asignado[i] += dar;
        restante -= dar;
      }
    }

    // Fase 2: si entre todos aún no alcanzan el total, reparte el faltante en partes iguales
    if (restante > 0) {
      const base = Math.floor(restante / n);
      const extra = restante % n;
      for (let i = 0; i < n; i++) {
        asignado[i] += base + (i < extra ? 1 : 0);
      }
    }

    for (let i = 0; i < n; i++) {
      if (asignado[i] > 0) {
        porUsuario.get(participantes[i].usuarioId)!.set(moneda, asignado[i]);
      }
    }
  }

  return participantes.map((p) => {
    const mapa = porUsuario.get(p.usuarioId)!;
    const costos: Costo[] = [];
    for (const { moneda } of costosTotales) {
      const m = mapa.get(moneda) ?? 0;
      if (m > 0) costos.push({ moneda, monto: m });
    }
    return { usuarioId: p.usuarioId, costos };
  });
}

export interface EntradaValidacionAporte {
  usuarioId: number;
  costos: Costo[];
  saldos?: Saldos;
  nombre?: string;
}

export type ResultadoValidacionDistribucion =
  | { ok: true; aportes: AporteParticipante[] }
  | { ok: false; error: string };

/**
 * Valida que la distribución elegida cubra exactamente `costosTotales`, que participen al menos
 * 2 personas sin repetirse y que a cada participante le alcance su saldo para lo que va a pagar.
 */
export function validarDistribucion(
  costosTotales: Costo[],
  entradas: EntradaValidacionAporte[]
): ResultadoValidacionDistribucion {
  if (entradas.length < 2) {
    return { ok: false, error: "Seleccioná al menos un participante más para compartir la compra." };
  }

  const ids = new Set<number>();
  for (const e of entradas) {
    if (!Number.isInteger(e.usuarioId) || e.usuarioId <= 0) {
      return { ok: false, error: "Participante no válido." };
    }
    if (ids.has(e.usuarioId)) {
      return { ok: false, error: "No podés repetir el mismo participante." };
    }
    ids.add(e.usuarioId);
  }

  const requeridos = new Map<Moneda, number>();
  for (const c of costosTotales) {
    requeridos.set(c.moneda, (requeridos.get(c.moneda) ?? 0) + c.monto);
  }

  const sumaPorMoneda = new Map<Moneda, number>();
  const normalizados: AporteParticipante[] = [];

  for (const e of entradas) {
    const porMoneda = new Map<Moneda, number>();
    for (const c of e.costos) {
      if (!Number.isInteger(c.monto) || c.monto < 0) {
        return { ok: false, error: "Los montos deben ser números enteros positivos o cero." };
      }
      if (c.monto === 0) continue;
      if (!requeridos.has(c.moneda)) {
        return { ok: false, error: `Este precio no usa ${MONEDAS[c.moneda]?.nombre ?? c.moneda}.` };
      }
      porMoneda.set(c.moneda, (porMoneda.get(c.moneda) ?? 0) + c.monto);
    }

    const costosLimpios: Costo[] = [];
    for (const { moneda } of costosTotales) {
      const m = porMoneda.get(moneda) ?? 0;
      if (m > 0) {
        if (e.saldos && (e.saldos[moneda] ?? 0) < m) {
          const quien = e.nombre ? `A ${e.nombre}` : "A uno de los participantes";
          return {
            ok: false,
            error: `${quien} no le alcanzan sus ${MONEDAS[moneda].nombre.toLowerCase()} (tiene ${e.saldos[moneda] ?? 0} y se le asignaron ${m}).`,
          };
        }
        costosLimpios.push({ moneda, monto: m });
        sumaPorMoneda.set(moneda, (sumaPorMoneda.get(moneda) ?? 0) + m);
      }
    }

    normalizados.push({ usuarioId: e.usuarioId, costos: costosLimpios });
  }

  for (const [moneda, totalReq] of requeridos.entries()) {
    const suma = sumaPorMoneda.get(moneda) ?? 0;
    if (suma !== totalReq) {
      const info = MONEDAS[moneda];
      return {
        ok: false,
        error: `La suma de ${info.nombre.toLowerCase()} entre todos (${suma} ${info.unidad}) debe ser igual al precio total (${totalReq} ${info.unidad}).`,
      };
    }
  }

  return { ok: true, aportes: normalizados };
}
