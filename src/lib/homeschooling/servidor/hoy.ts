// «Hoy aprendo»: lo que le toca estudiar hoy a un alumno (y lo adelantable con navegación libre), con sus lecciones,
// candados y la Tarea de cada día.
import prisma from "../../prisma.ts";
import { aClave, hoyEnFamilia } from "../../habitos/server.ts";
import { estaBloqueado, motivoLeccionBloqueada, rangoTexto } from "../dia.ts";
import { sincronizarDias, TIPOS_CON_LECCIONES, unidadesVistas } from "./progreso.ts";

export type LeccionHoy = {
  id: number;
  titulo: string;
  orden: number;
  instrucciones: string | null;
  url: string | null;
  videoPlataforma: "youtube" | "vimeo" | null;
  videoId: string | null;
  completada: boolean;
  bloqueada: boolean;
  motivo: string | null;
};

export type DiaHoy = {
  diaId: number;
  fecha: string;
  adelantable: boolean;
  estado: string;
  tareaId: number | null;
  tareaEstado: string | null;
  materia: { nombre: string; icono: string | null; color: string | null };
  recurso: { id: number; titulo: string; tipo: string; unidadTipo: string; url: string | null; portadaUrl: string | null };
  rango: string;
  unidadDesde: number;
  unidadHasta: number;
  progreso: number;
  lecciones: LeccionHoy[];
};

export async function leccionesDeHoy(alumnoId: number, hoy = hoyEnFamilia()): Promise<DiaHoy[]> {
  const planes = await prisma.planCurso.findMany({
    where: { alumnoId, estado: "activo" },
    include: {
      recurso: { include: { materia: true, lecciones: { orderBy: { orden: "asc" } } } },
      dias: { orderBy: { fecha: "asc" }, include: { tarea: { select: { estado: true } } } },
    },
  });

  const salida: DiaHoy[] = [];
  for (const plan of planes) {
    const { recurso } = plan;
    const sincronizados = await sincronizarDias(prisma, plan.dias);
    const dias = plan.dias.map((d) => ({ ...d, estado: sincronizados.get(d.id) ?? d.estado }));

    // Hoy, y el siguiente día pendiente si hay navegación libre y el anterior está hecho/omitido (adelantar sí, saltear no)
    const deHoy = dias.find((d) => aClave(d.fecha) === hoy && (d.estado === "pendiente" || d.estado === "hecha"));
    const elegidos: { dia: (typeof dias)[number]; adelantable: boolean }[] = deHoy ? [{ dia: deHoy, adelantable: false }] : [];
    const proximo = dias.find((d) => aClave(d.fecha) > hoy && d.estado === "pendiente");
    if (proximo) {
      const anterior = [...dias].reverse().find((d) => d.fecha < proximo.fecha && d.estado !== "movida");
      const hoyListo = !deHoy || deHoy.estado === "hecha" || deHoy.estado === "omitida";
      if (hoyListo && !estaBloqueado({ fecha: aClave(proximo.fecha), hoy, navegacionLibre: recurso.navegacionLibre, anteriorEstado: anterior?.estado ?? null })) {
        elegidos.push({ dia: proximo, adelantable: true });
      }
    }
    if (elegidos.length === 0) continue;

    const conLecciones = TIPOS_CON_LECCIONES.includes(recurso.tipo);
    const vistas = conLecciones ? await unidadesVistas(prisma, alumnoId, recurso.id) : null;
    const totalHecho = vistas ? new Set([...vistas.conProgreso, ...vistas.cubiertas]).size : dias.filter((d) => d.estado === "hecha" || d.estado === "omitida").reduce((n, d) => n + d.unidadHasta - d.unidadDesde + 1, 0);

    for (const { dia, adelantable } of elegidos) {
      const lecciones: LeccionHoy[] = conLecciones
        ? recurso.lecciones
            .filter((l) => l.orden >= dia.unidadDesde && l.orden <= dia.unidadHasta)
            .map((l) => {
              const previa = recurso.lecciones.find((x) => x.orden === l.orden - 1);
              const motivo = vistas ? motivoLeccionBloqueada(l.orden, previa?.titulo, vistas.satisfecha) : null;
              return {
                id: l.id,
                titulo: l.titulo,
                orden: l.orden,
                instrucciones: l.instrucciones,
                url: l.url,
                videoPlataforma: l.videoPlataforma,
                videoId: l.videoId,
                completada: vistas?.conProgreso.has(l.orden) ?? false,
                bloqueada: !!motivo,
                motivo,
              };
            })
        : [];
      salida.push({
        diaId: dia.id,
        fecha: aClave(dia.fecha),
        adelantable,
        estado: dia.estado,
        tareaId: dia.tareaId,
        tareaEstado: dia.tarea?.estado ?? null,
        materia: { nombre: recurso.materia.nombre, icono: recurso.materia.icono, color: recurso.materia.color },
        recurso: { id: recurso.id, titulo: recurso.titulo, tipo: recurso.tipo, unidadTipo: recurso.unidadTipo, url: recurso.url, portadaUrl: recurso.portadaUrl },
        rango: rangoTexto(recurso.unidadTipo, dia.unidadDesde, dia.unidadHasta),
        unidadDesde: dia.unidadDesde,
        unidadHasta: dia.unidadHasta,
        progreso: recurso.totalUnidades > 0 ? Math.min(100, Math.round((totalHecho / recurso.totalUnidades) * 100)) : 0,
        lecciones,
      });
    }
  }
  return salida;
}

