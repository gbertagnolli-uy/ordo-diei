// Regla de la foto de prueba de una tarea: si está activa, hay que subir una imagen antes de completarla.
// La misma función la usan el detalle, el tablero, la lista y la pantalla de aprobación.

export type TareaConFotoPrueba = {
  requiereFotoPrueba?: boolean | null;
  fotoPruebaUrl?: string | null;
};

/** ¿Falta la foto obligatoria para poder completar la tarea? */
export function fotoPruebaPendiente(tarea: TareaConFotoPrueba): boolean {
  return Boolean(tarea.requiereFotoPrueba && !tarea.fotoPruebaUrl);
}

/** ¿La tarea pide o ya tiene una foto de prueba que valga la pena mostrar? */
export function pideFotoPrueba(tarea: TareaConFotoPrueba): boolean {
  return Boolean(tarea.requiereFotoPrueba || tarea.fotoPruebaUrl);
}
