import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { RutinaClientPage } from "@/components/rutina/RutinaClientPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rutina y Horarios | Ordo Diei",
  description: "Gestión de la rutina familiar diaria, semanal y mensual con temporizador en vivo.",
};

export default async function HorariosPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }

  return <RutinaClientPage currentUser={session.user} />;
}
