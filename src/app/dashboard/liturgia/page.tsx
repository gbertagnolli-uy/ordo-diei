import { CalendarDays } from "lucide-react";
import { PantallaPendiente } from "@/components/liturgia/PantallaPendiente";

export const metadata = { title: "Calendarium | Ordo Diei" };

// Marcador de L3: la pantalla real llega con su lane (L4).
export default function Page() {
  return <PantallaPendiente titulo="Calendarium" castellano="Calendario litúrgico" icono={CalendarDays} />;
}
