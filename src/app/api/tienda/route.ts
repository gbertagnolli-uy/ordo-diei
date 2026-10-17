import { conSesion } from "@/lib/tienda/http";
import { obtenerTienda } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

// GET /api/tienda — catálogo de la Tienda para quien pide: saldos, productos con su estado y la oferta del día
export const GET = () => conSesion((s) => obtenerTienda(s.id));
