"use client";
// IndexedDB y el editor (BlockNote) existen solo en el navegador: las notas se cargan sin SSR.
import dynamic from "next/dynamic";

const NotasWorkspace = dynamic(() => import("@/components/notas/NotasWorkspace"), { ssr: false });

export function NotasCliente({ usuarioId }: { usuarioId: string }) {
  return <NotasWorkspace usuarioId={usuarioId} />;
}
