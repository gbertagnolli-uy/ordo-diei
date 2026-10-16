// «Tu parte de hoy» (vault/ENGAGEMENT_PLAN.md): mini-misiones de los padres según lo que falta. Módulo puro.
// Miden acciones reales (registrar el comportamiento de los hijos, cargar Estudio, aprobar), no solo abrir la app.
export type ClaveMision = "comportamiento" | "estudio" | "pendientes" | "mensaje";

export const PUNTOS_MISION = 5;
export const MAX_MISIONES = 3;

export type ContextoMisiones = {
  /** Hijos de la familia y cuántos ya tienen un registro de comportamiento hoy */
  hijos: { id: number; nombre: string; registradoHoy: boolean }[];
  /** Material, comentarios y calificaciones que cargó el adulto hoy en Estudio */
  estudioHoy: number;
  /** Tareas de los hijos esperando su aprobación */
  pendientes: number;
  /** Tareas que aprobó hoy */
  aprobadasHoy: number;
  /** Mensajes a un hijo y publicaciones en el muro que escribió hoy */
  mensajesHoy: number;
};

export type Mision = {
  clave: ClaveMision;
  titulo: string;
  detalle: string;
  actual: number;
  total: number;
  hecha: boolean;
  href: string;
  puntos: number;
};

/** «Ana, Luis y 2 más»: no se alarga con familias grandes */
const nombres = (lista: string[], max = 3) => (lista.length <= max ? lista.join(", ") : `${lista.slice(0, max).join(", ")} y ${lista.length - max} más`);

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

function candidatas(c: ContextoMisiones): Mision[] {
  const lista: Mision[] = [];

  if (c.hijos.length > 0) {
    const faltan = c.hijos.filter((h) => !h.registradoHoy);
    lista.push({
      clave: "comportamiento",
      titulo: "Registrá cómo se portó cada hijo",
      detalle: faltan.length === 0 ? "Todos tienen su día registrado: el cofre depende de eso." : `Falta: ${nombres(faltan.map((h) => h.nombre))}. De esto depende su cofre.`,
      actual: c.hijos.length - faltan.length,
      total: c.hijos.length,
      hecha: faltan.length === 0,
      href: "/dashboard/admin/conducta",
      puntos: PUNTOS_MISION,
    });
  }

  lista.push({
    clave: "estudio",
    titulo: "Cargá algo en Estudio",
    detalle: c.estudioHoy > 0 ? "Hoy ya sumaste material, una nota o un comentario." : "Un material, una nota o un comentario alcanza.",
    actual: Math.min(1, c.estudioHoy),
    total: 1,
    hecha: c.estudioHoy > 0,
    href: "/dashboard/homeschooling",
    puntos: PUNTOS_MISION,
  });

  if (c.pendientes > 0 || c.aprobadasHoy > 0) {
    const hecha = c.aprobadasHoy > 0 && c.pendientes === 0;
    lista.push({
      clave: "pendientes",
      titulo: "Revisá lo que esperan los chicos",
      detalle: c.pendientes > 0 ? `${c.pendientes} ${plural(c.pendientes, "tarea espera", "tareas esperan")} tu aprobación.` : "No queda nada por aprobar.",
      actual: hecha ? 1 : 0,
      total: 1,
      hecha,
      href: "/dashboard/admin/agenda",
      puntos: PUNTOS_MISION,
    });
  }

  lista.push({
    clave: "mensaje",
    titulo: "Escribile algo a un hijo",
    detalle: c.mensajesHoy > 0 ? "Hoy ya les escribiste." : "Un mensaje o una publicación en el muro de la familia alcanza.",
    actual: Math.min(1, c.mensajesHoy),
    total: 1,
    hecha: c.mensajesHoy > 0,
    href: "/dashboard/homeschooling/mensajes",
    puntos: PUNTOS_MISION,
  });

  return lista;
}

/**
 * Las misiones de hoy: hasta tres, por prioridad. Las que ya se cumplieron (`premiadas`) se conservan
 * aunque lo que faltaba cambie durante el día (por ejemplo, llega una tarea para aprobar).
 */
export function misionesDeHoy(c: ContextoMisiones, premiadas: readonly string[] = []): Mision[] {
  const todas = candidatas(c);
  const elegidas = todas.slice(0, MAX_MISIONES);
  for (const clave of premiadas) {
    if (elegidas.some((m) => m.clave === clave)) continue;
    const m = todas.find((x) => x.clave === clave);
    if (!m) continue;
    // Ocupa el lugar de la última misión que todavía no se premió
    const i = elegidas.findLastIndex((x) => !premiadas.includes(x.clave));
    if (i >= 0) elegidas[i] = m;
  }
  // Lo ya premiado no se deshace: cuenta como hecho aunque después cambie lo que falta
  return elegidas.map((m) => (premiadas.includes(m.clave) ? { ...m, hecha: true, actual: m.total } : m));
}
