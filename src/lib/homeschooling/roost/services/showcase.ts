// Portado de vendor/roost/src/services/showcase.ts (msrbuilds/roost@492af47).
// Cambios: mismas funciones (las que usan las pantallas de evidencia) con cuerpo `fetch` a /api/homeschooling/evidencias;
// ids numéricos; estados pendiente/aprobada/ajustar; aprobar acepta estrellas (no dan monedas); pedir ajuste exige comentario.
// Fuera: votos, reseñas, etiquetas, categorías y búsqueda pública.
import { api, consulta } from "./http.ts";
import type { ShowcaseStats, ShowcaseStatus, ShowcaseWithDetails } from "../tipos.ts";

const BASE = "/api/homeschooling/evidencias";

export type FiltrosEvidencia = { alumnoId?: number | null; materiaId?: number | null; mes?: string | null };

export const createShowcase = (d: { titulo?: string | null; nota?: string | null; diaLectivoId?: number | null; imagenes: string[]; alumnoId?: number }) =>
  api<ShowcaseWithDetails>(BASE, { method: "POST", body: d });

export const getShowcaseById = async (id: number): Promise<ShowcaseWithDetails | null> => {
  try {
    return await api<ShowcaseWithDetails>(`${BASE}/${id}`);
  } catch {
    return null;
  }
};

export const getUserShowcases = (f: FiltrosEvidencia & { estado?: ShowcaseStatus; destacada?: boolean } = {}) =>
  api<ShowcaseWithDetails[]>(`${BASE}${consulta({ ...f, destacada: f.destacada ? 1 : undefined })}`);

export const addShowcaseImage = (id: number, url: string, caption?: string | null) =>
  api<ShowcaseWithDetails>(`${BASE}/${id}/imagenes`, { method: "POST", body: { url, pie: caption } });

export const removeShowcaseImage = (id: number, imageId: number) =>
  api<ShowcaseWithDetails>(`${BASE}/${id}/imagenes${consulta({ imagenId: imageId })}`, { method: "DELETE" });

export const getShowcasesForModeration = (estado?: ShowcaseStatus, f: FiltrosEvidencia = {}) =>
  api<ShowcaseWithDetails[]>(`${BASE}${consulta({ ...f, estado })}`);

export const approveShowcase = (id: number, stars?: number | null) =>
  api<ShowcaseWithDetails>(`${BASE}/${id}`, { method: "PATCH", body: { accion: "aprobar", estrellas: stars ?? null } });

export const rejectShowcase = (id: number, comment: string) =>
  api<ShowcaseWithDetails>(`${BASE}/${id}`, { method: "PATCH", body: { accion: "ajustar", comentario: comment } });

export const featureShowcase = (id: number) => api<ShowcaseWithDetails>(`${BASE}/${id}`, { method: "PATCH", body: { accion: "destacar" } });

export const unfeatureShowcase = (id: number) => api<ShowcaseWithDetails>(`${BASE}/${id}`, { method: "PATCH", body: { accion: "quitar_destacada" } });

export const resubmitShowcase = (id: number, d: { titulo?: string | null; nota?: string | null } = {}) =>
  api<ShowcaseWithDetails>(`${BASE}/${id}`, { method: "PATCH", body: { accion: "reenviar", ...d } });

export const deleteShowcase = async (id: number): Promise<void> => {
  await api(`${BASE}/${id}`, { method: "DELETE" });
};

export const getShowcaseStats = () => api<ShowcaseStats>(`${BASE}/estadisticas`);
