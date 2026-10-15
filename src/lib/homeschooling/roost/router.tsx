"use client";

// Shim del router de Roost (React Router) para los componentes portados de Roost (msrbuilds/roost@492af47).
// Propio de Ordo: Roost usa React Router 7; Ordo usa App Router.

import NextLink from "next/link";
import { useCallback, type ComponentProps } from "react";
import { useRouter, useParams as useNextParams, useSearchParams as useNextSearchParams } from "next/navigation";

type Cambio = URLSearchParams | ((previo: URLSearchParams) => URLSearchParams);

/**
 * Igual que `useSearchParams` de react-router: `[params, setParams]`. Escribe con `history.pushState`, que Next integra con
 * `useSearchParams` (doc «single-page-applications»): el cambio es instantáneo (no vuelve a ejecutar la página del servidor,
 * que consulta la base) y cada paso queda en el historial, así que el botón «atrás» del navegador vuelve al nivel anterior.
 */
export function useSearchParams(): [URLSearchParams, (siguiente: Cambio) => void] {
  const actuales = useNextSearchParams();
  const setParams = useCallback(
    (siguiente: Cambio) => {
      const previo = new URLSearchParams(actuales.toString());
      const nuevo = typeof siguiente === "function" ? siguiente(previo) : siguiente;
      const qs = nuevo.toString();
      window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
    },
    [actuales]
  );
  return [new URLSearchParams(actuales.toString()), setParams];
}

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string | number) => {
      if (typeof to === "number") router.back();
      else router.push(to);
    },
    [router],
  );
}

export const useParams = useNextParams;

export function Link({ to, ...props }: Omit<ComponentProps<typeof NextLink>, "href"> & { to: string }) {
  return <NextLink href={to} {...props} />;
}
