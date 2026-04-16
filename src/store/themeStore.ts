import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDarkMode: () => {
        set({ darkMode: !get().darkMode });
      },
    }),
    {
      name: 'ordo-diei-theme',
    }
  )
);
