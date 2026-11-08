// Asistente del diario (lane 298), lado navegador: habla con el proxy de turnos y con la ejecución de herramientas.
// Las llamadas a `fetch` son las únicas con red; el resto de la lógica (bucle, protocolos, permisos) está en src/lib/diario/asistente y tiene pruebas.
import type { DependenciasAgente } from "@/lib/diario/asistente/agente";
import { conContexto } from "@/lib/diario/asistente/agente";
import { MAX_TOKENS_RESUMEN, mensajesParaResumir, normalizarResumen, type MensajeCompactable } from "@/lib/diario/asistente/compactacion";
import { esHerramientaDeMemoria, itemsDe, type HerramientaDeMemoria, type HerramientaDelDiario } from "@/lib/diario/asistente/herramientas";
import { mensajeDeTitulo, normalizarTitulo } from "@/lib/diario/asistente/titulo";
import { MAX_SALIDA_TITULO, REINTENTOS_TITULO, TIEMPO_TITULO_MS, promptDeCompactacion, promptDelTitulo } from "@/lib/diario/asistente/prompt";
import type { EventoIA, MensajeIA, Protocolo } from "@/lib/diario/asistente/protocolos";
import type { Proveedor } from "@/lib/diario/asistente/proveedores";

export interface ConexionModelo {
  proveedor: Proveedor;
  apiKey: string;
  modelo: string;
}

const esEventoIA = (v: unknown): v is EventoIA => typeof v === "object" && v !== null && typeof (v as { t?: unknown }).t === "string";

/** Una línea JSON por evento. Aguanta que un evento llegue partido en varios trozos. */
export async function* leerEventos(res: Response): AsyncGenerator<EventoIA> {
  if (!res.body) return;
  const lector = res.body.getReader();
  const decodificador = new TextDecoder();
  let resto = "";
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      resto += decodificador.decode(value, { stream: true });
      let corte: number;
      while ((corte = resto.indexOf("\n")) !== -1) {
        const linea = resto.slice(0, corte).trim();
        resto = resto.slice(corte + 1);
        if (!linea) continue;
        try {
          const ev: unknown = JSON.parse(linea);
          if (esEventoIA(ev)) yield ev;
        } catch {
          /* línea rota: se ignora */
        }
      }
    }
    const ultima = resto.trim();
    if (ultima) {
      try {
        const ev: unknown = JSON.parse(ultima);
        if (esEventoIA(ev)) yield ev;
      } catch {
        /* ignorada */
      }
    }
  } finally {
    lector.releaseLock();
  }
}

interface PedidoRemoto {
  conexion: ConexionModelo;
  sistema: string;
  mensajes: MensajeIA[];
  herramientas: boolean;
  memoria: boolean;
  maxTokens: number;
}

/** Un turno del modelo a través del proxy del servidor. */
export async function* turnoRemoto(p: PedidoRemoto, senal: AbortSignal): AsyncGenerator<EventoIA> {
  const res = await fetch("/api/diario/asistente/turno", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: senal,
    body: JSON.stringify({
      protocolo: p.conexion.proveedor.protocolo satisfies Protocolo,
      baseUrl: p.conexion.proveedor.baseUrl,
      apiKey: p.conexion.apiKey,
      modelo: p.conexion.modelo,
      sistema: p.sistema,
      mensajes: p.mensajes,
      herramientas: p.herramientas,
      memoria: p.memoria,
      maxTokens: p.maxTokens,
    }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    yield { t: "error", mensaje: typeof d.error === "string" ? d.error : `Error ${res.status}` };
    return;
  }
  yield* leerEventos(res);
}

/** Convierte el Markdown del modelo al documento del editor (el servidor lo vuelve a sanear). Solo se carga el editor si hace falta. */
async function conDocumentos(items: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  if (!items.some((i) => typeof i.content === "string" && i.content.trim())) return items;
  const { markdownADocumento } = await import("../importar/markdown-a-doc");
  return items.map((i) => {
    const doc = typeof i.content === "string" && i.content.trim() ? markdownADocumento(i.content) : null;
    return doc ? { ...i, doc } : i;
  });
}

export async function ejecutarRemoto(nombre: HerramientaDelDiario, args: Record<string, unknown>, senal: AbortSignal): Promise<string> {
  const conTexto = nombre === "createDiary" || nombre === "updateDiary";
  const enviados = conTexto ? { items: await conDocumentos(itemsDe(args)) } : args;
  const res = await fetch("/api/diario/asistente/herramienta", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: senal,
    body: JSON.stringify({ nombre, args: enviados }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof d.error === "string" ? d.error : `Error ${res.status}`);
  return typeof d.resultado === "string" ? d.resultado : "Failed: respuesta vacía";
}

export interface OpcionesDependencias {
  conexion: ConexionModelo;
  sistema: string;
  contexto: string;
  memoria: boolean;
  ejecutarMemoria: (nombre: HerramientaDeMemoria, args: Record<string, unknown>) => Promise<string>;
  aprobar: DependenciasAgente["aprobar"];
  maxTokens: number;
}

/** Las dependencias reales del bucle del agente. */
export function dependenciasReales(o: OpcionesDependencias): DependenciasAgente {
  return {
    turno: (mensajes, senal) => turnoRemoto({ conexion: o.conexion, sistema: o.sistema, mensajes: conContexto(mensajes, o.contexto), herramientas: true, memoria: o.memoria, maxTokens: o.maxTokens }, senal),
    ejecutar: (nombre, args, senal) => (esHerramientaDeMemoria(nombre) ? o.ejecutarMemoria(nombre, args) : ejecutarRemoto(nombre, args, senal)),
    aprobar: o.aprobar,
  };
}

/** moodiary `SessionTitleController.maybeTitle`: un turno corto sin herramientas; se reintenta si no sale un título. */
export async function titularSesion(conexion: ConexionModelo, primerMensaje: string): Promise<string | null> {
  const mensaje = mensajeDeTitulo(primerMensaje);
  if (!mensaje) return null;
  for (let intento = 0; intento <= REINTENTOS_TITULO; intento++) {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), TIEMPO_TITULO_MS);
    try {
      let crudo = "";
      let fallo = false;
      for await (const ev of turnoRemoto({ conexion, sistema: promptDelTitulo(), mensajes: [{ rol: "usuario", texto: mensaje }], herramientas: false, memoria: false, maxTokens: MAX_SALIDA_TITULO }, control.signal)) {
        if (ev.t === "texto") crudo += ev.d;
        else if (ev.t === "error") fallo = true;
      }
      if (fallo) return null;
      const titulo = normalizarTitulo(crudo);
      if (titulo) return titulo;
    } catch {
      return null;
    } finally {
      clearTimeout(reloj);
    }
  }
  return null;
}

/** moodiary ContextCompactionController._summarize: un turno sin herramientas que resume los turnos viejos. `null` si falla o viene vacío. */
export async function compactarConversacion(conexion: ConexionModelo, resumenPrevio: string | null, aResumir: MensajeCompactable[]): Promise<string | null> {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), 60_000);
  try {
    let crudo = "";
    for await (const ev of turnoRemoto({ conexion, sistema: promptDeCompactacion(), mensajes: mensajesParaResumir(resumenPrevio, aResumir), herramientas: false, memoria: false, maxTokens: MAX_TOKENS_RESUMEN }, control.signal)) {
      if (ev.t === "texto") crudo += ev.d;
      else if (ev.t === "error") return null;
    }
    return normalizarResumen(crudo);
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

export async function pedirModelos(p: Proveedor, apiKey: string): Promise<string[]> {
  const res = await fetch("/api/diario/asistente/modelos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ protocolo: p.protocolo, baseUrl: p.baseUrl, apiKey }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof d.error === "string" ? d.error : "No se pudo pedir la lista de modelos");
  return Array.isArray(d.modelos) ? d.modelos.filter((m: unknown): m is string => typeof m === "string") : [];
}
