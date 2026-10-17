// Propio de Ordo: íconos Lucide y colores de tema que puede elegir una materia (Roost usa avatar y paleta propias).
import { BookOpen, Brain, Calculator, Church, Code, Dumbbell, FlaskConical, Globe, History, Landmark, Languages, Microscope, Music, Palette, PenLine, Trees, type LucideIcon } from "lucide-react";

const ICONOS: Record<string, LucideIcon> = {
  BookOpen, Calculator, FlaskConical, Microscope, Globe, Languages, PenLine, History, Landmark, Church, Music, Palette, Dumbbell, Trees, Brain, Code,
};

export const ICONOS_MATERIA = Object.keys(ICONOS);
export const iconoDe = (nombre?: string | null): LucideIcon => (nombre && ICONOS[nombre]) || BookOpen;

/** Tokens del tema (no hex): el color sigue al tema claro/oscuro */
export const COLORES_MATERIA = [
  { id: "primary", etiqueta: "Principal" },
  { id: "success", etiqueta: "Verde" },
  { id: "warning", etiqueta: "Ámbar" },
  { id: "destructive", etiqueta: "Rojo" },
] as const;

/** Color CSS (variable del tema) para eventos de calendario y chips */
export const colorCss = (id?: string | null) => `var(--${COLORES_MATERIA.some((c) => c.id === id) ? id : "primary"})`;
