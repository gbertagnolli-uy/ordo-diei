export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarComprasAdmin, listarProductosAdmin } from "@/lib/tienda/server";
import { AdminTiendaView } from "@/components/tienda/admin/AdminTiendaView";

export default async function AdminTiendaPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");
  const rol = session.user.rolFamiliar;

  const [productos, compras, usuarios, cartas] = await Promise.all([
    listarProductosAdmin(rol),
    listarComprasAdmin(rol),
    prisma.usuario.findMany({ select: { id: true, nombre: true, rolFamiliar: true }, orderBy: { id: "asc" } }),
    prisma.carta.findMany({ where: { activa: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
  ]);

  return (
    <AdminTiendaView
      productos={productos}
      compras={compras}
      opciones={{
        usuarios: usuarios.map((u) => ({ id: u.id, nombre: u.nombre, rol: u.rolFamiliar })),
        cartas,
        productos: productos.map((p) => ({ id: p.id, titulo: p.titulo })),
      }}
    />
  );
}
