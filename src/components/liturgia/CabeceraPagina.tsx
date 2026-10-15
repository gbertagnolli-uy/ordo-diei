"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { pantallaDeRuta } from "./navegacion";

/** Barra superior de todas las pantallas de liturgia: trigger del sidebar y breadcrumb «Liturgia › Pantalla». */
export function CabeceraPagina() {
  const pantalla = pantallaDeRuta(usePathname());
  if (!pantalla) return <PageHeader title="Liturgia" />;
  return <PageHeader group="Liturgia" groupHref="/dashboard/liturgia" title={pantalla.label} subtitle={pantalla.tooltip} />;
}
