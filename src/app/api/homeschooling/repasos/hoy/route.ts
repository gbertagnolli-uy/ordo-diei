import { conSesion } from "@/lib/tienda/http";
import { repasosDeHoy } from "@/lib/homeschooling/servidor/repasos";

export const dynamic = "force-dynamic";

// GET: hasta 3 mini-preguntas de repaso para hoy (sin la respuesta correcta)
export const GET = () => conSesion((s) => repasosDeHoy(s.id));
