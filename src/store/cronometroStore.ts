import { create } from "zustand";

// Cronómetro de tarea (lane 264): qué tarea tiene abierto el modal grande. Sin persistencia:
// si hay una tarea corriendo y nadie abrió el modal, se ve la ventana flotante.
interface CronometroState {
  grandeId: number | null;
  abrirGrande: (tareaId: number) => void;
  minimizar: () => void;
}

export const useCronometroStore = create<CronometroState>()((set) => ({
  grandeId: null,
  abrirGrande: (tareaId) => set({ grandeId: tareaId }),
  minimizar: () => set({ grandeId: null }),
}));
