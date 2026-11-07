"use client";
// Portado de vendor/homebranch-web/src/app/routes/dashboard/book.tsx (lane 270, fase 2): portada, título, autor,
// sinopsis, estado de lectura de este usuario y un único botón principal (Leer / Escuchar / Seguir). Sin estadísticas.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Check, Headphones } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { EstadoBiblioteca } from "@/lib/biblioteca/reglas";
import type { LibroDetalle } from "@/lib/biblioteca/servidor";

const TEXTO_ESTADO: Record<EstadoBiblioteca, string> = { sin_empezar: "Sin empezar", leyendo: "Leyendo", leido: "Leído" };

export function DetalleLibro({ libro }: { libro: LibroDetalle }) {
  const router = useRouter();
  const [estado, setEstado] = useState(libro.estado);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const destino = libro.esAudiolibro ? `/dashboard/biblioteca/escuchar/${libro.id}` : `/dashboard/biblioteca/leer/${libro.id}`;
  const textoBoton = estado === "leyendo" ? "Seguir" : libro.esAudiolibro ? "Escuchar" : "Leer";
  const sinArchivos = libro.archivos.length === 0;

  async function marcar(nuevo: EstadoBiblioteca) {
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(`/api/biblioteca/libros/${libro.id}/posicion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porcentaje: nuevo === "leido" ? 100 : nuevo === "sin_empezar" ? 0 : libro.porcentaje, estado: nuevo }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "No se pudo guardar");
      setEstado(datos.estado);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Button asChild variant="ghost" className="min-h-11 self-start">
        <Link href="/dashboard/biblioteca">
          <ArrowLeft /> Biblioteca
        </Link>
      </Button>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-md sm:mx-0">
          {libro.portadaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={libro.portadaUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col justify-between rounded-md border bg-muted p-4">
              <p className="line-clamp-5 font-serif font-semibold">{libro.titulo}</p>
              {libro.autor && <p className="text-xs text-muted-foreground">{libro.autor}</p>}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold">{libro.titulo}</h1>
            {libro.autor && <p className="text-muted-foreground">{libro.autor}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{TEXTO_ESTADO[estado]}</Badge>
            {libro.esAudiolibro && (
              <Badge variant="outline">
                <Headphones /> Audiolibro
              </Badge>
            )}
          </div>
          {estado === "leyendo" && <Progress value={libro.porcentaje} className="h-1.5" aria-label={`Leído ${Math.round(libro.porcentaje)} %`} />}
          <div className="flex flex-wrap gap-2">
            <Button asChild={!sinArchivos} disabled={sinArchivos} className="min-h-11">
              {sinArchivos ? (
                <span>Sin archivos</span>
              ) : (
                <Link href={destino}>
                  {libro.esAudiolibro ? <Headphones /> : <BookOpen />} {textoBoton}
                </Link>
              )}
            </Button>
            {estado !== "leido" ? (
              <Button variant="outline" className="min-h-11" disabled={guardando} onClick={() => void marcar("leido")}>
                <Check /> Marcar como leído
              </Button>
            ) : (
              <Button variant="outline" className="min-h-11" disabled={guardando} onClick={() => void marcar("leyendo")}>
                Volver a leer
              </Button>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {libro.sinopsis && <p className="whitespace-pre-line leading-relaxed">{libro.sinopsis}</p>}
        </div>
      </div>
    </div>
  );
}
