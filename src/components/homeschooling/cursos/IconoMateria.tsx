"use client";

// Propio de Ordo: ícono Lucide de una materia por nombre (componente estático, sin crear componentes durante el render).

import { createElement } from "react";
import { iconoDe } from "./iconos";

export default function IconoMateria({ nombre, className }: { nombre?: string | null; className?: string }) {
  return createElement(iconoDe(nombre), { className });
}
