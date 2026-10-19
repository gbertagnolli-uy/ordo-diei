import { create } from "zustand";
import { persist } from "zustand/middleware";

// Estado del compañero flotante (lane 247), compartido con el Dock: si está oculto y dónde quedó.
// Se guarda por usuario porque en una misma tablet entran varios de la familia.
export type AjusteFlotante = { oculto: boolean; x: number | null; y: number | null };

const INICIAL: AjusteFlotante = { oculto: false, x: null, y: null };

interface CompaneroFlotanteState {
  ajustes: Record<string, AjusteFlotante>;
  /** El almacenamiento del navegador ya se leyó (antes de eso no se sabe si estaba oculto) */
  listo: boolean;
  marcarListo: () => void;
  ocultar: (usuarioId: number) => void;
  mostrar: (usuarioId: number) => void;
  mover: (usuarioId: number, x: number, y: number) => void;
}

export const ajusteDe = (ajustes: Record<string, AjusteFlotante>, usuarioId: number): AjusteFlotante => ajustes[String(usuarioId)] ?? INICIAL;

export const useCompaneroFlotanteStore = create<CompaneroFlotanteState>()(
  persist(
    (set) => ({
      ajustes: {},
      listo: false,
      marcarListo: () => set({ listo: true }),
      ocultar: (usuarioId) => set((s) => ({ ajustes: { ...s.ajustes, [usuarioId]: { ...ajusteDe(s.ajustes, usuarioId), oculto: true } } })),
      mostrar: (usuarioId) => set((s) => ({ ajustes: { ...s.ajustes, [usuarioId]: { ...ajusteDe(s.ajustes, usuarioId), oculto: false } } })),
      mover: (usuarioId, x, y) => set((s) => ({ ajustes: { ...s.ajustes, [usuarioId]: { ...ajusteDe(s.ajustes, usuarioId), x, y } } })),
    }),
    {
      name: "ordo-diei-companero-flotante",
      partialize: (s) => ({ ajustes: s.ajustes }),
      // Se lee al montar (en el servidor no hay localStorage y el HTML tiene que coincidir con el del cliente)
      skipHydration: true,
    },
  ),
);
