import { redirect } from "next/navigation";
import { PanelLiturgia } from "@/components/liturgia/PanelLiturgia";

export const metadata = {
  title: "Liturgia | Ordo Diei",
  description: "Calendario, Misal, Breviario y devociones según el rito tradicional.",
};

/**
 * Panel Liturgia. Antes el Calendarium vivía en esta ruta: los enlaces viejos con `?fecha=` o `?version=`
 * se reenvían a `/calendarium` conservando los parámetros.
 */
export default async function LiturgiaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) {
    for (const valor of Array.isArray(v) ? v : v === undefined ? [] : [v]) query.append(k, valor);
  }
  if (query.size > 0) redirect(`/dashboard/liturgia/calendarium?${query}`);
  return <PanelLiturgia />;
}
