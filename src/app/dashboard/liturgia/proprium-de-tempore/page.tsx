import { CalendarRange } from "lucide-react";
import { PantallaPendiente } from "@/components/liturgia/PantallaPendiente";

export const metadata = { title: "Proprium de Tempore | Ordo Diei" };

// Marcador de L3: la pantalla real llega con su lane (L7).
export default function Page() {
  return <PantallaPendiente titulo="Proprium de Tempore" castellano="Propio del Tiempo" icono={CalendarRange} />;
}
