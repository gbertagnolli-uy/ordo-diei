"use client";

// Propio de Ordo (lane 166, M1): material de un día / lección / alumno visto por el padre — lista con abrir, cambiar el límite
// de impresiones, renombrar y quitar — y el botón para agregar.
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { ETIQUETA_TIPO } from "@/lib/homeschooling/material";
import { api, consulta } from "@/lib/homeschooling/roost/services/http";
import type { Destino, MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import { toast } from "@/lib/toast";
import AgregarMaterial from "./AgregarMaterial";
import IconoMaterial from "./IconoMaterial";

const consultaDestino = (d: Destino) => ("diaLectivoId" in d ? consulta({ diaId: d.diaLectivoId }) : "leccionId" in d ? consulta({ leccionId: d.leccionId }) : consulta({ alumnoId: d.alumnoId, fecha: d.fecha }));

export default function ListaMaterial({ destino, contexto, onCambio }: { destino: Destino; contexto?: string; onCambio?: (cantidad: number) => void }) {
  const [lista, setLista] = useState<MaterialVista[] | null>(null);
  const [agregando, setAgregando] = useState(false);
  const clave = JSON.stringify(destino);

  const leer = useCallback(() => api<MaterialVista[]>(`/api/homeschooling/materiales${consultaDestino(JSON.parse(clave) as Destino)}`), [clave]);

  const cargar = useCallback(async () => {
    try {
      const filas = await leer();
      setLista(filas);
      onCambio?.(filas.length);
    } catch (e) {
      setLista([]);
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el material");
    }
  }, [leer, onCambio]);

  // Primera carga: la promesa se resuelve fuera del efecto (sin setState sincrónico)
  useEffect(() => {
    let vigente = true;
    leer()
      .then((filas) => {
        if (!vigente) return;
        setLista(filas);
        onCambio?.(filas.length);
      })
      .catch((e) => {
        if (!vigente) return;
        setLista([]);
        toast.error(e instanceof Error ? e.message : "No se pudo cargar el material");
      });
    return () => {
      vigente = false;
    };
  }, [leer, onCambio]);

  const cambiar = async (m: MaterialVista, cambios: { titulo?: string; limiteImpresiones?: number }) => {
    try {
      await api(`/api/homeschooling/materiales/${m.id}`, { method: "PATCH", body: cambios });
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const quitar = async (m: MaterialVista) => {
    if (!window.confirm(`¿Quitar «${m.titulo}»?`)) return;
    try {
      await api(`/api/homeschooling/materiales/${m.id}`, { method: "DELETE" });
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo quitar");
    }
  };

  return (
    <section aria-label="Material" className="space-y-2">
      {lista === null ? (
        <Skeleton className="h-14 w-full rounded-xl" />
      ) : lista.length === 0 ? (
        <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">Todavía no hay material. Pegá un enlace o un texto y el alumno lo ve en su día.</p>
      ) : (
        <ul className="space-y-2">
          {lista.map((m) => (
            <li key={m.id} className="space-y-2 rounded-xl border bg-card p-3">
              <div className="flex items-start gap-2">
                <IconoMaterial tipo={m.tipo} className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <Input
                    defaultValue={m.titulo}
                    aria-label="Título del material"
                    maxLength={150}
                    className="h-8 border-transparent bg-transparent px-1 font-medium shadow-none hover:border-input focus-visible:border-ring"
                    onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== m.titulo && void cambiar(m, { titulo: e.target.value.trim() })}
                  />
                  <p className="px-1 text-xs text-muted-foreground">{ETIQUETA_TIPO[m.tipo]}{m.contenido !== null ? ` · ${m.contenido.length} caracteres` : ""}</p>
                </div>
                {m.url && (
                  <Button asChild variant="ghost" size="icon-sm" aria-label={`Abrir «${m.titulo}»`}>
                    <a href={m.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" aria-label={`Quitar «${m.titulo}»`} onClick={() => quitar(m)}>
                  <Trash2 />
                </Button>
              </div>
              <div className="flex items-center gap-2 pl-7 text-xs text-muted-foreground">
                <Printer className="size-3.5" aria-hidden />
                <span>Imprimible</span>
                <NativeSelect size="sm" aria-label="Veces que puede imprimirlo" value={m.limiteImpresiones} onChange={(e) => cambiar(m, { limiteImpresiones: Number(e.target.value) })}>
                  {[0, 1, 2, 3, 5].map((n) => (
                    <NativeSelectOption key={n} value={n}>
                      {n === 0 ? "no" : n === 1 ? "1 vez" : `${n} veces`}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {!m.imprimible && m.limiteImpresiones > 0 && <span>(este tipo no se imprime desde la app)</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button variant="outline" className="w-full" onClick={() => setAgregando(true)}>
        <Plus /> Agregar material
      </Button>
      <AgregarMaterial
        open={agregando}
        destino={destino}
        contexto={contexto}
        onClose={() => setAgregando(false)}
        onCreado={() => {
          setAgregando(false);
          void cargar();
        }}
      />
    </section>
  );
}
