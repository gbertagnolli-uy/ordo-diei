"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useThemeStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // On mount, ensure DOM matches store (handles rehydration timing)
  useEffect(() => {
    const stored = localStorage.getItem('ordo-diei-theme');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.darkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch {}
    }
  }, []);

  return <>{children}</>;
}
