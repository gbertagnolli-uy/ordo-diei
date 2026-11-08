// GET → { count } de notificaciones sin leer (contador del sidebar). Lane 276.
import { responder } from "@/lib/social/servidor/http";
import { contarNoLeidas } from "@/lib/social/servidor/notificaciones";

export const dynamic = "force-dynamic";

export async function GET() {
  return responder(async (actor) => ({ count: await contarNoLeidas(actor) }));
}
