import { conSesion } from "@/lib/tienda/http";
import { estadisticasEvidencias } from "@/lib/homeschooling/servidor/evidencia";

export const dynamic = "force-dynamic";

// GET: contadores de la bandeja de revisión (solo padres)
export const GET = () => conSesion((s) => estadisticasEvidencias(s), { soloPadres: true });
