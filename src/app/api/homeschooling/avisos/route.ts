import { conSesion } from "@/lib/tienda/http";
import { avisosParaPadre } from "@/lib/homeschooling/servidor/quiz";

export const dynamic = "force-dynamic";

// GET: avisos de repaso para el padre («Leo: 50 % en Fracciones — requiere repaso»)
export const GET = () => conSesion((s) => avisosParaPadre(s), { soloPadres: true });
