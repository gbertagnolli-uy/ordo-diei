// Ejecuta el Perl original de Divinum Officium (D47). Un proceso por documento; sin servidor web.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { nombreVersionDO, type Hora, type VersionLiturgica } from "../../src/lib/liturgia/tipos.ts";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const DO_RAIZ = join(RAIZ, "vendor", "divinum-officium");
export const DO_WWW = join(DO_RAIZ, "web", "www");
const CGI = join(DO_RAIZ, "web", "cgi-bin");
const PERL5LIB = join(RAIZ, ".cache", "do-perl5", "lib", "perl5");
const DO_LIBRO = join(RAIZ, "scripts", "liturgia", "do-libro.pl");

export function verificarInstalacion(): void {
  if (!existsSync(join(CGI, "horas", "officium.pl"))) {
    throw new Error("Falta Divinum Officium: corré `npm run liturgia:descargar`.");
  }
}

// Tope global de procesos Perl simultáneos (cada uno ocupa ~30 MB): lo fija generar.ts con --concurrencia.
let maxProcesos = 8;
let activos = 0;
const espera: (() => void)[] = [];

export function limitarProcesos(n: number): void {
  maxProcesos = Math.max(1, n);
}

async function conCupo<T>(fn: () => Promise<T>): Promise<T> {
  while (activos >= maxProcesos) await new Promise<void>((ok) => espera.push(ok));
  activos++;
  try {
    return await fn();
  } finally {
    activos--;
    espera.shift()?.();
  }
}

function ejecutarPerl(args: string[], cwd: string, stdin?: string, timeoutMs = 60_000): Promise<string> {
  return conCupo(() => lanzarPerl(args, cwd, stdin, timeoutMs));
}

function lanzarPerl(args: string[], cwd: string, stdin?: string, timeoutMs = 60_000): Promise<string> {
  return new Promise((ok, fallar) => {
    const hijo = spawn("perl", args, {
      cwd,
      env: { ...process.env, PERL5LIB: [PERL5LIB, process.env.PERL5LIB].filter(Boolean).join(":") },
    });
    const partes: Buffer[] = [];
    hijo.stdout.on("data", (d: Buffer) => partes.push(d));
    hijo.stderr.on("data", () => {}); // DO escribe cookies y avisos por stderr
    const reloj = setTimeout(() => {
      hijo.kill("SIGKILL");
      fallar(new Error(`perl ${args[0]} superó ${timeoutMs} ms`));
    }, timeoutMs);
    hijo.on("error", (e) => {
      clearTimeout(reloj);
      fallar(e);
    });
    hijo.on("close", (codigo) => {
      clearTimeout(reloj);
      if (codigo !== 0) fallar(new Error(`perl ${args[0]} terminó con código ${codigo}`));
      else ok(Buffer.concat(partes).toString("utf8"));
    });
    if (stdin !== undefined) hijo.stdin.end(stdin);
    else hijo.stdin.end();
  });
}

/** Quita las cabeceras CGI (`Content-type`) que anteceden a la primera línea en blanco. */
export function quitarCabeceras(salida: string): string {
  const m = /^(?:[A-Za-z-]+:[^\n]*\n)+\r?\n/.exec(salida);
  return m ? salida.slice(m[0].length) : salida;
}

const mmddyyyy = (iso: string) => `${iso.slice(5, 7)}-${iso.slice(8, 10)}-${iso.slice(0, 4)}`;

export async function ejecutarHora(iso: string, version: VersionLiturgica, hora: Hora): Promise<string> {
  const q = `date1=${mmddyyyy(iso)}&command=pray${hora}&version=${nombreVersionDO(version)}&lang1=Latin&lang2=Espanol&content=1`;
  return quitarCabeceras(await ejecutarPerl(["officium.pl", q], join(CGI, "horas")));
}

export async function ejecutarMisa(iso: string, version: VersionLiturgica): Promise<string> {
  const q = `date=${mmddyyyy(iso)}&command=praySanctaMissa&version=${nombreVersionDO(version)}&lang1=Latin&lang2=Espanol&content=1`;
  return quitarCabeceras(await ejecutarPerl(["missa.pl", q], join(CGI, "missa")));
}

export type LibroCrudo = { archivo: string; secciones: Record<string, string> | null };

/** Exporta archivos de libro ya resueltos por `setupstring` (do-libro.pl). */
export async function ejecutarLibros(
  version: VersionLiturgica,
  idioma: "Latin" | "Espanol",
  area: "horas" | "missa",
  archivos: string[],
): Promise<Map<string, Record<string, string> | null>> {
  const salida = await ejecutarPerl(
    [DO_LIBRO, DO_RAIZ, nombreVersionDO(version), idioma, area],
    join(CGI, area === "missa" ? "missa" : "horas"),
    archivos.join("\n") + "\n",
    300_000,
  );
  const mapa = new Map<string, Record<string, string> | null>();
  for (const l of salida.split("\n")) {
    if (!l.startsWith("{")) continue;
    const o = JSON.parse(l) as LibroCrudo;
    mapa.set(o.archivo, o.secciones);
  }
  return mapa;
}
