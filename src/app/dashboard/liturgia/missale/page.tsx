import { BookMarked } from "lucide-react";
import { PantallaPendiente } from "@/components/liturgia/PantallaPendiente";

export const metadata = { title: "Missale | Ordo Diei" };

// Marcador de L3: la pantalla real llega con su lane (L6).
export default function Page() {
  return <PantallaPendiente titulo="Missale" castellano="Misal" icono={BookMarked} />;
}
