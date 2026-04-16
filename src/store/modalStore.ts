import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  type: "CONFIRM_TASK" | "USER_STATS" | "RULES" | "TASK_SUCCESS" | "HISTORY" | "LEADERBOARD" | "SURPRISE_AWARD" | null;
  data: any;
  openModal: (type: "CONFIRM_TASK" | "USER_STATS" | "RULES" | "TASK_SUCCESS" | "HISTORY" | "LEADERBOARD" | "SURPRISE_AWARD", data?: any) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: null,
  data: null,
  openModal: (type, data = null) => set({ isOpen: true, type, data }),
  closeModal: () => set({ isOpen: false, type: null, data: null }),
}));
