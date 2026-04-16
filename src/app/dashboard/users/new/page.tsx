import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ClientPage from "./ClientPage";

export default async function NewUserServerPage() {
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect("/");
  }

  const { user } = session;
  const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";
  
  if (!isParent) {
    redirect("/dashboard");
  }

  return <ClientPage />;
}
