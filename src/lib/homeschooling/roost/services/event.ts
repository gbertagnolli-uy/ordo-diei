// Portado de vendor/roost/src/services/event.ts (msrbuilds/roost@492af47).
// Cambios: las 5 funciones con los mismos nombres, cuerpo `fetch` a /api/homeschooling/actividades; `createEvent` y
// `updateEvent` reciben además `materiaId` y `alumnoIds`; sin RSVP, sin virtual ni URL de reunión.
import { api, consulta } from "./http.ts";
import type { EventWithDetails } from "../tipos.ts";

const BASE = "/api/homeschooling/actividades";

export type EventInput = { materiaId: number; titulo: string; descripcion?: string | null; inicio: string | Date; fin: string | Date; lugar?: string | null; alumnoIds: number[] };

export const getEventsInRange = (desde: string, hasta: string) => api<EventWithDetails[]>(`${BASE}${consulta({ desde, hasta })}`);

export const createEvent = (e: EventInput) => api<EventWithDetails>(BASE, { method: "POST", body: e });

export const updateEvent = (id: number, e: EventInput) => api<EventWithDetails>(`${BASE}/${id}`, { method: "PATCH", body: e });

export const deleteEvent = async (id: number): Promise<void> => {
  await api(`${BASE}/${id}`, { method: "DELETE" });
};

export const getEventAttendees = (id: number) => api<EventWithDetails["participantes"]>(`${BASE}/${id}`);
