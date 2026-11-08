// Asistente del diario (lane 298): el bucle del agente. Pide un turno al modelo, ejecuta las herramientas que pide (pidiendo permiso según el modo)
// y vuelve a pedir, hasta que responde sin herramientas o se llega al tope de turnos. Puro: el modelo, las herramientas y la aprobación son dependencias.
// Portado de vendor/moodiary/.../data/impl/rig_assistant.dart (`chat`, `_gate`, `_dispatch`) y del bucle del puente en Rust (`maxTurns` = 12; ZhuJHua/moodiary@2c552dd).
// moodiary corre este bucle dentro de la app; acá corre en el navegador y las herramientas se ejecutan en el servidor.

import {
  CONTINUAR_PARA_EL_MODELO,
  MARCA_CONTINUAR,
  MAX_TURNOS,
  PREFIJO_FALLO,
  decodificarArgs,
  esHerramienta,
  necesitaConfirmacion,
  nivelDe,
  omitida,
  registroDe,
  type Herramienta,
  type ModoPermiso,
  type Nivel,
} from "./herramientas.ts";
import { citaParaElModelo } from "./citas.ts";
import type { EventoIA, MensajeIA } from "./protocolos.ts";
import type { TurnoChat } from "./sesiones.ts";

export type MotivoFinAgente = "completo" | "longitud" | "max_turnos" | "cancelado" | "error";

export type EventoAgente =
  | { t: "texto"; d: string }
  | { t: "llamada"; id: string; nombre: string; args: string; nivel: Nivel; pideAprobacion: boolean }
  | { t: "resultado"; id: string; resultado: string }
  | { t: "uso"; entrada: number; salida: number }
  | { t: "fin"; motivo: MotivoFinAgente; mensaje?: string };

export interface DependenciasAgente {
  /** Un turno del modelo, en streaming. Tiene que lanzar `AbortError` (o terminar) si la señal se cancela. */
  turno(mensajes: MensajeIA[], senal: AbortSignal): AsyncIterable<EventoIA>;
  /** Ejecuta una herramienta ya aprobada y devuelve el texto que ve el modelo. */
  ejecutar(nombre: Herramienta, args: Record<string, unknown>, senal: AbortSignal): Promise<string>;
  /** Espera a que la persona apruebe o rechace; `true` = aprobada. Tiene que resolver en `false` al cancelar o vencer. */
  aprobar(id: string, nombre: Herramienta, args: Record<string, unknown>, nivel: Nivel): Promise<boolean>;
}

export interface OpcionesAgente {
  mensajes: MensajeIA[];
  modo: ModoPermiso;
  senal: AbortSignal;
  maxTurnos?: number;
}

const esAborto = (e: unknown) => (e instanceof DOMException && e.name === "AbortError") || (e instanceof Error && e.name === "AbortError");

/** El bucle. Emite lo que la interfaz tiene que mostrar; los mensajes de la conversación del modelo se llevan por dentro. */
export async function* correrAgente(deps: DependenciasAgente, o: OpcionesAgente): AsyncGenerator<EventoAgente> {
  const mensajes = [...o.mensajes];
  const tope = o.maxTurnos ?? MAX_TURNOS;
  for (let turno = 1; turno <= tope; turno++) {
    let texto = "";
    const llamadas: { id: string; nombre: string; args: string }[] = [];
    let motivo: "completo" | "herramientas" | "longitud" | "otro" = "otro";
    try {
      for await (const ev of deps.turno(mensajes, o.senal)) {
        if (ev.t === "texto") {
          texto += ev.d;
          yield { t: "texto", d: ev.d };
        } else if (ev.t === "llamada") {
          llamadas.push({ id: ev.id, nombre: ev.nombre, args: ev.args });
        } else if (ev.t === "uso") {
          yield { t: "uso", entrada: ev.entrada, salida: ev.salida };
        } else if (ev.t === "fin") {
          motivo = ev.motivo;
        } else if (ev.t === "error") {
          yield { t: "fin", motivo: "error", mensaje: ev.mensaje };
          return;
        }
      }
    } catch (e) {
      if (o.senal.aborted || esAborto(e)) yield { t: "fin", motivo: "cancelado" };
      else yield { t: "fin", motivo: "error", mensaje: e instanceof Error ? e.message : "No se pudo hablar con el proveedor" };
      return;
    }
    if (o.senal.aborted) {
      yield { t: "fin", motivo: "cancelado" };
      return;
    }
    // Una respuesta cortada por longitud con una herramienta a medias no se puede ejecutar: se termina el turno
    if (!llamadas.length || motivo === "longitud") {
      yield { t: "fin", motivo: motivo === "longitud" ? "longitud" : "completo" };
      return;
    }
    mensajes.push({ rol: "asistente", texto, llamadas });
    for (const l of llamadas) {
      const args = decodificarArgs(l.args);
      let resultado: string;
      if (!esHerramienta(l.nombre)) {
        yield { t: "llamada", id: l.id, nombre: l.nombre, args: l.args, nivel: "read", pideAprobacion: false };
        resultado = `${PREFIJO_FALLO} unknown tool "${l.nombre}".`;
      } else {
        const nivel = nivelDe(l.nombre, args);
        const pide = necesitaConfirmacion(o.modo, nivel);
        yield { t: "llamada", id: l.id, nombre: l.nombre, args: l.args, nivel, pideAprobacion: pide };
        if (pide && !(await deps.aprobar(l.id, l.nombre, args, nivel))) {
          resultado = omitida(l.nombre);
        } else if (o.senal.aborted) {
          resultado = omitida(l.nombre);
        } else {
          try {
            resultado = await deps.ejecutar(l.nombre, args, o.senal);
          } catch (e) {
            resultado = `${PREFIJO_FALLO} ${l.nombre} threw ${e instanceof Error ? e.message : String(e)}. Check the arguments against the schema, then retry or take another route.`;
          }
        }
      }
      yield { t: "resultado", id: l.id, resultado };
      mensajes.push({ rol: "resultado", id: l.id, nombre: l.nombre, texto: resultado });
      if (o.senal.aborted) {
        yield { t: "fin", motivo: "cancelado" };
        return;
      }
    }
  }
  yield { t: "fin", motivo: "max_turnos" };
}

// ── Historial que se le manda al modelo ─────────────────────────────────────

/**
 * Los turnos guardados → mensajes para el modelo. Los turnos del asistente que usaron herramientas empiezan con el bloque `[tools already run]`
 * (moodiary `recordOf`), no con mensajes de herramienta nativos: así el historial sirve igual con cualquier proveedor.
 */
export function historialParaElModelo(turnos: TurnoChat[]): MensajeIA[] {
  const salida: MensajeIA[] = [];
  for (const t of turnos) {
    if (t.deUsuario) {
      const texto = t.texto.trim() === MARCA_CONTINUAR ? CONTINUAR_PARA_EL_MODELO : citaParaElModelo(t.texto);
      if (texto.trim()) salida.push({ rol: "usuario", texto });
      continue;
    }
    const registro = registroDe(t.llamadas);
    const cuerpo = [registro, t.texto.trim()].filter(Boolean).join("\n\n");
    if (cuerpo) salida.push({ rol: "asistente", texto: cuerpo, llamadas: [] });
  }
  // Los proveedores exigen que la conversación empiece con la persona
  while (salida.length && salida[0].rol !== "usuario") salida.shift();
  return salida;
}

/** moodiary `volatilePrefix`: el contexto del turno va delante del último mensaje de la persona (no se guarda en el historial). */
export function conContexto(mensajes: MensajeIA[], contexto: string): MensajeIA[] {
  if (!contexto) return mensajes;
  const i = mensajes.map((m) => m.rol).lastIndexOf("usuario");
  if (i === -1) return mensajes;
  const m = mensajes[i];
  if (m.rol !== "usuario") return mensajes;
  const copia = [...mensajes];
  copia[i] = { rol: "usuario", texto: `${contexto}\n\n${m.texto}` };
  return copia;
}
