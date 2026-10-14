import { ScrollText } from "lucide-react";
import { PantallaPendiente } from "@/components/liturgia/PantallaPendiente";

export const metadata = { title: "Ordinarium | Ordo Diei" };

// Marcador de L3: la pantalla real llega con su lane (L8).
export default function Page() {
  return <PantallaPendiente titulo="Ordinarium" castellano="Ordinario" icono={ScrollText} />;
}
