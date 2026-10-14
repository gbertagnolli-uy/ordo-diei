import { conSesion } from "@/lib/tienda/http";
import { listarComprasAdmin } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

// GET /api/admin/tienda/compras — compras de la familia (por aprobar, por entregar e historial)
export const GET = () => conSesion((s) => listarComprasAdmin(s.rol), { soloPadres: true });
