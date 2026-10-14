import { Sparkles } from "lucide-react";
import { PantallaPendiente } from "@/components/liturgia/PantallaPendiente";

export const metadata = { title: "Proprium Sanctorum | Ordo Diei" };

// Marcador de L3: la pantalla real llega con su lane (L7).
export default function Page() {
  return <PantallaPendiente titulo="Proprium Sanctorum" castellano="Propio de los Santos" icono={Sparkles} />;
}
