import { CircleDot } from "lucide-react";
import { PantallaPendiente } from "@/components/liturgia/PantallaPendiente";

export const metadata = { title: "Rosarium | Ordo Diei" };

// Marcador de L3: la pantalla real llega con su lane (L9).
export default function Page() {
  return <PantallaPendiente titulo="Rosarium" castellano="Mysteria Rosarii" icono={CircleDot} />;
}
