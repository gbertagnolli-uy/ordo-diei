"use client";

// Propio de Ordo: ícono de un paso de historia por nombre (componente estático para no crear componentes durante el render).

import { createElement } from "react";
import { iconoHistoria } from "./iconosHistoria";

export default function IconoHistoria({ nombre, className }: { nombre: string; className?: string }) {
  return createElement(iconoHistoria(nombre), { className });
}
