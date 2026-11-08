// Marco global de /dashboard (lane 280): el layout dibuja la barra superior y el padding de todas las pantallas.
// Este archivo es la única fuente de los nombres de las rutas (migas automáticas) y de las pantallas sin padding.
// Pantalla nueva: agregá su ruta a RUTAS; no le pongas SidebarTrigger ni padding exterior.

export type MigaRuta = {
  /** Grupo del breadcrumb (el mismo nombre que en la barra lateral). */
  group?: string;
  /** Si se da, el grupo es un enlace. */
  groupHref?: string;
  title: string;
};

const ADMIN = { group: "Administración", groupHref: "/dashboard/admin" };
const BIBLIOTECA = { group: "Biblioteca", groupHref: "/dashboard/biblioteca" };

/** Prefijo de ruta → migas. Gana el prefijo más largo; una página puede pisarlas con <PageHeader>. */
export const RUTAS: Record<string, MigaRuta> = {
  "/dashboard": { group: "Mis tareas", title: "Inicio" },
  "/dashboard/imprimir/agenda-semanal": { group: "Mis tareas", title: "Agenda semanal" },
  // Rutina
  "/dashboard/horarios": { group: "Rutina", title: "Horarios" },
  "/dashboard/habitos": { group: "Rutina", title: "Mis hábitos" },
  "/dashboard/homeschooling": { title: "Estudio" },
  "/dashboard/mis-premios": { group: "Rutina", title: "Mis premios" },
  "/dashboard/premio-grupal": { group: "Rutina", title: "Premio grupal" },
  // Liturgia
  "/dashboard/liturgia": { title: "Liturgia" },
  // Lectura y escritura
  "/dashboard/biblioteca": { group: "Lectura y escritura", title: "Biblioteca" },
  "/dashboard/biblioteca/gestionar": { ...BIBLIOTECA, title: "Gestionar" },
  "/dashboard/biblioteca/libro": { ...BIBLIOTECA, title: "Libro" },
  "/dashboard/biblioteca/leer": { ...BIBLIOTECA, title: "Lector" },
  "/dashboard/notas": { group: "Lectura y escritura", title: "Notas" },
  "/dashboard/diario": { group: "Lectura y escritura", title: "Mi diario" },
  "/dashboard/diario/familia": { group: "Lectura y escritura", title: "Diario familiar" },
  // Colección
  "/dashboard/cartas": { group: "Colección", title: "Cartas" },
  "/dashboard/cartas/admin": { group: "Colección", title: "Administración de Cartas" },
  "/dashboard/companero": { group: "Colección", title: "Compañero" },
  "/dashboard/tienda": { group: "Colección", title: "Tienda" },
  // Administración
  "/dashboard/admin": { ...ADMIN, title: "Panel de administración" },
  "/dashboard/admin/aprobaciones": { ...ADMIN, title: "Aprobaciones" },
  "/dashboard/admin/comportamiento": { ...ADMIN, title: "Regalar premio" },
  "/dashboard/admin/conducta": { ...ADMIN, title: "Registrar conducta" },
  "/dashboard/admin/hijos": { ...ADMIN, title: "Resumen de los hijos" },
  "/dashboard/admin/premio-grupal": { ...ADMIN, title: "Premio grupal" },
  "/dashboard/admin/reposo": { ...ADMIN, title: "Reposo" },
  "/dashboard/admin/rutina": { ...ADMIN, title: "Rutina familiar" },
  "/dashboard/admin/tareas": { ...ADMIN, title: "Tareas" },
  "/dashboard/admin/tienda": { ...ADMIN, title: "Tienda" },
  "/dashboard/premios": { ...ADMIN, title: "Premios sorpresa" },
  "/dashboard/tasks/new": { ...ADMIN, title: "Nueva tarea" },
  "/dashboard/users/new": { ...ADMIN, title: "Nuevo miembro" },
  "/dashboard/users/pines": { ...ADMIN, title: "Restablecer PIN" },
  // Cuenta y hogar
  "/dashboard/perfil": { group: "Cuenta", title: "Perfil" },
  "/dashboard/logros": { group: "Cuenta", title: "Mis logros" },
  "/dashboard/rules": { group: "Hogar", title: "Reglas del hogar" },
};

const coincide = (pathname: string, prefijo: string) => pathname === prefijo || pathname.startsWith(`${prefijo}/`);

/** Migas de una ruta: la entrada de RUTAS con el prefijo más largo que coincide. */
export function migasDeRuta(pathname: string | null): MigaRuta {
  if (!pathname) return { title: "Ordo Diei" };
  let mejor = "";
  for (const prefijo of Object.keys(RUTAS)) {
    if (coincide(pathname, prefijo) && prefijo.length > mejor.length) mejor = prefijo;
  }
  return mejor ? RUTAS[mejor] : { title: "Ordo Diei" };
}

/**
 * Pantallas que ocupan todo el espacio y manejan sus propios bordes: el layout no les pone padding.
 * `exacta` solo coincide con la ruta misma; si no, también con sus subrutas.
 */
export const SIN_PADDING: { ruta: string; exacta?: boolean }[] = [
  // Tablero de tareas: el panel lateral va pegado al borde y la altura se calcula con la ventana
  { ruta: "/dashboard", exacta: true },
  // Editor de notas a pantalla completa
  { ruta: "/dashboard/notas" },
  // Chat de Estudio: en el celular va de borde a borde
  { ruta: "/dashboard/homeschooling/mensajes" },
  // Una materia: columna de lecciones pegada al borde (la grilla de materias sí lleva padding)
  { ruta: "/dashboard/homeschooling/materias/" },
];

export function llevaPadding(pathname: string | null): boolean {
  if (!pathname) return true;
  return !SIN_PADDING.some(({ ruta, exacta }) =>
    exacta ? pathname === ruta : ruta.endsWith("/") ? pathname.startsWith(ruta) : coincide(pathname, ruta),
  );
}
