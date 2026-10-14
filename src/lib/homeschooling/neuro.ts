// Neurodivergencia (H6): qué vista le toca a un alumno y cómo se normalizan las historias sociales. Puro.
// Lo que un navegador no puede hacer (kiosco, batería, permisos del sistema) no se promete: eso es de la APP nativa (D6).

export type PreferenciaVista = { modoRelajado: boolean; primeroDespues: boolean };

/** El modo relajado cambia el aspecto (se aplica en toda la app); Primero/Después cambia la pantalla «Hoy aprendo» */
export function decidirVista(p: PreferenciaVista): { layout: "normal" | "primero-despues"; relajado: boolean } {
  return { layout: p.primeroDespues ? "primero-despues" : "normal", relajado: p.modoRelajado };
}

export type PasoHistoria = { texto: string; icono: string };

/** Íconos Lucide permitidos en una historia (el visor los dibuja por nombre) */
export const ICONOS_HISTORIA = [
  "Sun", "Bed", "Utensils", "School", "Car", "Home", "Users", "Heart", "Smile", "ShoppingBag", "Stethoscope", "BookOpen", "Clock", "Check", "Bus", "Hand",
] as const;
export const ICONO_POR_DEFECTO = "Check";
export const MIN_PASOS = 3;
export const MAX_PASOS = 5;
export const MAX_TEXTO_PASO = 120;

/** Recorta, descarta pasos vacíos, limita el largo y cambia por un ícono válido los que no lo son */
export function normalizarPasos(pasos: { texto?: unknown; icono?: unknown }[]): PasoHistoria[] {
  return pasos
    .map((p) => ({
      texto: String(p.texto ?? "").trim().slice(0, MAX_TEXTO_PASO),
      icono: (ICONOS_HISTORIA as readonly string[]).includes(String(p.icono)) ? String(p.icono) : ICONO_POR_DEFECTO,
    }))
    .filter((p) => p.texto !== "");
}

/** Mensaje de error si la historia no tiene de 3 a 5 pasos con texto (null = válida) */
export function errorDePasos(pasos: { texto?: unknown; icono?: unknown }[]): string | null {
  const n = normalizarPasos(pasos).length;
  if (n < MIN_PASOS) return `Una historia necesita al menos ${MIN_PASOS} pasos con texto`;
  if (pasos.filter((p) => String(p.texto ?? "").trim() !== "").length > MAX_PASOS) return `Una historia tiene como máximo ${MAX_PASOS} pasos`;
  return null;
}

export const PLANTILLAS_HISTORIA: { titulo: string; pasos: PasoHistoria[] }[] = [
  {
    titulo: "Hoy no hay clase",
    pasos: [
      { texto: "Hoy no vamos a hacer las lecciones de siempre.", icono: "Home" },
      { texto: "Es un día distinto, y eso está bien.", icono: "Smile" },
      { texto: "Puedo jugar, descansar o hacer algo tranquilo.", icono: "Heart" },
      { texto: "Mañana vuelve la rutina de siempre.", icono: "Sun" },
    ],
  },
  {
    titulo: "Vamos al médico",
    pasos: [
      { texto: "Hoy vamos a ir al médico, con mamá o papá.", icono: "Car" },
      { texto: "Me va a saludar y me va a mirar para cuidar mi salud.", icono: "Stethoscope" },
      { texto: "Si algo me preocupa, puedo decírselo o apretar la mano de mamá o papá.", icono: "Hand" },
      { texto: "Cuando termine, vuelvo a casa.", icono: "Home" },
    ],
  },
  {
    titulo: "Vienen visitas",
    pasos: [
      { texto: "Hoy van a venir visitas a casa.", icono: "Users" },
      { texto: "Las voy a saludar y después puedo estar donde me sienta cómodo.", icono: "Smile" },
      { texto: "Si necesito calma, puedo ir a mi lugar tranquilo.", icono: "Bed" },
      { texto: "Cuando se vayan, la casa vuelve a estar como siempre.", icono: "Home" },
    ],
  },
];
