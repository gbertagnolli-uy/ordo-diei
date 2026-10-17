import type { LucideIcon } from "lucide-react";
import { BookMarked, BookOpen, CalendarDays, CalendarRange, CircleDot, Music, ScrollText, Sparkles } from "lucide-react";

export type PantallaLiturgia = {
  href: string;
  /** Nombre latino de la pantalla (título y breadcrumb). */
  label: string;
  /** Castellano, para tooltips y títulos de pestaña. */
  tooltip: string;
  descripcion: string;
  icon: LucideIcon;
};

export const RAIZ_LITURGIA = "/dashboard/liturgia";

/** Pantallas de la liturgia (SPEC liturgia §8): se llega a todas desde el panel «Liturgia». */
export const PANTALLAS_LITURGIA: PantallaLiturgia[] = [
  { href: `${RAIZ_LITURGIA}/calendarium`, label: "Calendarium", tooltip: "Calendario litúrgico", descripcion: "El calendario litúrgico del mes y qué se celebra cada día.", icon: CalendarDays },
  { href: `${RAIZ_LITURGIA}/breviarium`, label: "Breviarium", tooltip: "Breviario", descripcion: "El Oficio Divino: Maitines, Laudes y las demás Horas del día.", icon: BookOpen },
  { href: `${RAIZ_LITURGIA}/missale`, label: "Missale", tooltip: "Misal", descripcion: "La Santa Misa del día, con sus lecturas y oraciones.", icon: BookMarked },
  { href: `${RAIZ_LITURGIA}/proprium-de-tempore`, label: "Proprium de Tempore", tooltip: "Propio del Tiempo", descripcion: "Los domingos y tiempos del año litúrgico: Adviento, Navidad, Cuaresma, Pascua.", icon: CalendarRange },
  { href: `${RAIZ_LITURGIA}/proprium-sanctorum`, label: "Proprium Sanctorum", tooltip: "Propio de los Santos", descripcion: "Las fiestas y memorias de los santos, día por día.", icon: Sparkles },
  { href: `${RAIZ_LITURGIA}/ordinarium`, label: "Ordinarium", tooltip: "Ordinario", descripcion: "Las partes fijas de la Misa y las preces.", icon: ScrollText },
  { href: `${RAIZ_LITURGIA}/psalterium`, label: "Psalterium", tooltip: "Salterio", descripcion: "Los salmos distribuidos en la semana.", icon: Music },
  { href: `${RAIZ_LITURGIA}/rosarium`, label: "Rosarium", tooltip: "Rosario", descripcion: "Los misterios del Santo Rosario según el día.", icon: CircleDot },
];

/** La pantalla a la que pertenece una ruta (el Breviarium incluye `/breviarium/[hora]`). */
export function pantallaDeRuta(pathname: string | null): PantallaLiturgia | undefined {
  return PANTALLAS_LITURGIA.find((p) => pathname === p.href || pathname?.startsWith(`${p.href}/`));
}
