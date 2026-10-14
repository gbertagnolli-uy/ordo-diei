import { Music } from "lucide-react";
import { PantallaPendiente } from "@/components/liturgia/PantallaPendiente";

export const metadata = { title: "Psalterium | Ordo Diei" };

// Marcador de L3: la pantalla real llega con su lane (L8).
export default function Page() {
  return <PantallaPendiente titulo="Psalterium" castellano="Salterio" icono={Music} />;
}
