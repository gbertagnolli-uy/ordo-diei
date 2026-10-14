import { BookOpen } from "lucide-react";
import { PantallaPendiente } from "@/components/liturgia/PantallaPendiente";

export const metadata = { title: "Breviarium | Ordo Diei" };

// Marcador de L3: la pantalla real llega con su lane (L5).
export default function Page() {
  return <PantallaPendiente titulo="Breviarium" castellano="Breviario" icono={BookOpen} />;
}
