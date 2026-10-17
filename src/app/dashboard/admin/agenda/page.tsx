import { redirect } from "next/navigation";

export default function AdminAgendaRedirect() {
  redirect("/dashboard/admin/aprobaciones");
}

