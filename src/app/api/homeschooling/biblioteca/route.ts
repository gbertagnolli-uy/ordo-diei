import { conSesion } from "@/lib/tienda/http";
import { listarBiblioteca } from "@/lib/homeschooling/servidor/paquetes";

export const dynamic = "force-dynamic";

// GET: los cursos católicos que trae la app (título, edad, lecciones)
export const GET = () => conSesion(async () => listarBiblioteca(), { soloPadres: true });
