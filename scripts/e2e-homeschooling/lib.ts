// Recorrido de punta a punta de Homeschooling contra la base REAL (ver README.md). Crea usuarios y datos de prueba con la
// marca «__test_hs» y los borra con limpiar.ts. Solo corre con PERMITIR_TESTS_DB=1, igual que los tests con base.
import { SignJWT } from "jose";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import prisma from "../../src/lib/prisma.ts";

if (process.env.PERMITIR_TESTS_DB !== "1") {
  console.error("Este recorrido escribe en la base real: corré con PERMITIR_TESTS_DB=1 (ver scripts/e2e-homeschooling/README.md).");
  process.exit(2);
}

export { prisma };
export const BASE = process.env.E2E_BASE ?? "http://localhost:3100";
export const DIR = process.env.E2E_SALIDA ?? join(tmpdir(), "hs-e2e");
mkdirSync(join(DIR, "shots"), { recursive: true });
export const CHROMIUM = process.env.CHROMIUM ?? "/usr/bin/chromium";
export const ESTADO = `${DIR}/estado.json`;
export const SUFIJO = "__test_hs_e2e";

const secreto = new TextEncoder().encode(process.env.SESSION_SECRET || "secreto_super_seguro_family_tasker");

export async function cookieDe(u: { id: number; nombre: string; rolFamiliar: string }) {
  return new SignJWT({ user: { id: u.id, nombre: u.nombre, rolFamiliar: u.rolFamiliar }, expires: Date.now() + 864e5 }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("24h").sign(secreto);
}

export const hoyMontevideo = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Montevideo" }).format(new Date());

export async function api(cookie: string, ruta: string, init: { method?: string; body?: unknown; form?: FormData } = {}) {
  const res = await fetch(BASE + ruta, {
    method: init.method ?? (init.body || init.form ? "POST" : "GET"),
    headers: { cookie: `session=${cookie}`, ...(init.body ? { "content-type": "application/json" } : {}) },
    body: init.form ?? (init.body ? JSON.stringify(init.body) : undefined),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

export const guardar = (e: unknown) => writeFileSync(ESTADO, JSON.stringify(e, null, 2));
export const leer = () => (existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, "utf8")) : null);
