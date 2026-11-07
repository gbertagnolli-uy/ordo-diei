"use client";

import { createPortal } from "react-dom";
import { Migas, useRanurasBarra } from "./MarcoDashboard";

/**
 * Título y botones de una página dentro de la barra global de /dashboard (lane 280).
 * La barra (botón de colapsar + migas) la dibuja el layout siempre; esto es opcional y solo sirve para
 * pisar el título que sale de rutasDashboard.ts, sumar botones a la derecha o una fila de secciones (pestañas).
 */
export function PageHeader({
  group,
  groupHref,
  title,
  subtitle,
  secciones,
  children,
}: {
  group?: string;
  /** Si se da, el grupo del breadcrumb es un enlace. */
  groupHref?: string;
  title: string;
  subtitle?: string;
  /** Segunda fila de la barra, debajo de las migas (p. ej. las pestañas de Estudio). */
  secciones?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const ranuras = useRanurasBarra();
  return (
    <>
      {ranuras.titulo &&
        createPortal(
          <>
            <div data-titulo-pagina className="flex min-w-0 flex-1">
              <Migas group={group} groupHref={groupHref} title={title} subtitle={subtitle} />
            </div>
            {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
          </>,
          ranuras.titulo,
        )}
      {ranuras.secciones && secciones && createPortal(secciones, ranuras.secciones)}
    </>
  );
}
