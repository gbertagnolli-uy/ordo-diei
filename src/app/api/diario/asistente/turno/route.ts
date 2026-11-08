// POST { protocolo, baseUrl, apiKey, modelo, sistema, mensajes, herramientas, maxTokens } → NDJSON de eventos (lane 298).
// Proxy de streaming sin estado hacia el proveedor de modelos que eligió la persona (D1, D5). Exige sesión; no guarda ni registra la clave.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, noAutorizado } from "@/lib/diario/api";
import { MAX_BYTES_PEDIDO, validarPedido } from "@/lib/diario/asistente/pedido";
import { TIEMPO_MAXIMO_MS, turnoDeProveedor } from "@/lib/diario/asistente/servidor-proxy";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const crudo = await req.text();
  if (crudo.length > MAX_BYTES_PEDIDO) return NextResponse.json({ error: "La conversación es demasiado larga" }, { status: 413 });
  let pedido;
  try {
    pedido = validarPedido(JSON.parse(crudo));
  } catch (e) {
    return NextResponse.json({ error: e instanceof SyntaxError ? "Pedido inválido" : e instanceof Error ? e.message : "Pedido inválido" }, { status: 400 });
  }
  const senal = AbortSignal.any([req.signal, AbortSignal.timeout(TIEMPO_MAXIMO_MS)]);
  const codificador = new TextEncoder();
  const flujo = new ReadableStream<Uint8Array>({
    async start(control) {
      try {
        for await (const ev of turnoDeProveedor(pedido, senal)) control.enqueue(codificador.encode(`${JSON.stringify(ev)}\n`));
      } catch {
        try {
          control.enqueue(codificador.encode(`${JSON.stringify({ t: "error", mensaje: "Se cortó la conexión" })}\n`));
        } catch {
          /* el navegador ya se fue */
        }
      } finally {
        try {
          control.close();
        } catch {
          /* ya cerrado */
        }
      }
    },
  });
  return new Response(flujo, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store, no-transform", "x-accel-buffering": "no" } });
}
