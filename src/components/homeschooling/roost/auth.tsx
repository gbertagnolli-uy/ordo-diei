"use client";

// Portado de vendor/roost/src/contexts/AuthContext.tsx (msrbuilds/roost@492af47).
// Cambios: sin Supabase Auth; la sesión la lee la page.tsx servidor con getSession() y entra por props.

import { createContext, useContext, type ReactNode } from "react";

export type RolFamiliar = "Padre" | "Madre" | "Hijo" | "Hija";

export interface UsuarioSesion {
  id: number;
  nombre: string;
  rolFamiliar: RolFamiliar;
}

export interface AuthRoost {
  user: { id: number };
  profile: { id: number; display_name: string; rolFamiliar: RolFamiliar };
  isAuthenticated: true;
  esPadre: boolean;
}

const AuthContext = createContext<AuthRoost | null>(null);

export function AuthProvider({ usuario, children }: { usuario: UsuarioSesion; children: ReactNode }) {
  const valor: AuthRoost = {
    user: { id: usuario.id },
    profile: { id: usuario.id, display_name: usuario.nombre, rolFamiliar: usuario.rolFamiliar },
    isAuthenticated: true,
    esPadre: usuario.rolFamiliar === "Padre" || usuario.rolFamiliar === "Madre",
  };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthRoost {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
