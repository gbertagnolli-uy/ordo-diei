import { conSesion } from "@/lib/tienda/http";
import { misCompras } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

// GET /api/tienda/compras — historial de compras de la persona
export const GET = () => conSesion((s) => misCompras(s.id));
