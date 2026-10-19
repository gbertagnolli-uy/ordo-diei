import { create } from 'zustand';

export type ModalType = "CONFIRM_TASK" | "USER_STATS" | "RULES" | "TASK_SUCCESS" | "HISTORY" | "LEADERBOARD" | "SURPRISE_AWARD" | "MOOD_SELECTOR" | "LEVEL_UP" | "ORACION" | "HABITO" | "DAILY_WELCOME";

interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data: any;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: null,
  data: null,
  openModal: (type, data = null) => set({ isOpen: true, type, data }),
  closeModal: () => set({ isOpen: false, type: null, data: null }),
}));
