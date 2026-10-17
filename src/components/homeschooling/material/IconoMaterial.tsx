// Propio de Ordo (lane 166, M1): ícono de cada tipo de material.
import { AlignLeft, BookOpen, FileCode2, FileText, Globe, HardDrive, Presentation, PlayCircle, type LucideIcon } from "lucide-react";
import type { TipoMaterial } from "@/lib/homeschooling/material";

const ICONOS: Record<TipoMaterial, LucideIcon> = {
  texto: AlignLeft,
  markdown: FileCode2,
  video: PlayCircle,
  pdf: FileText,
  documento: Presentation,
  epub: BookOpen,
  web: Globe,
  archivo: HardDrive,
};

export default function IconoMaterial({ tipo, className }: { tipo: TipoMaterial; className?: string }) {
  const Icono = ICONOS[tipo] ?? Globe;
  return <Icono className={className ?? "size-5"} aria-hidden />;
}
