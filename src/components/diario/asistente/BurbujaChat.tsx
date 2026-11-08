"use client";
// Asistente del diario (lane 298): un mensaje del chat. La persona, en una burbuja a la derecha; el asistente, con su Markdown, las herramientas que usó
// (una ficha por llamada, con el resumen de lo que hizo) y las entradas que tocó (fichas que se abren). Portado de la idea de
// vendor/moodiary/.../presentation/{assistant_page,chat_list,diary_citations,assistant_tool_ui}.dart (ZhuJHua/moodiary@2c552dd).
import { useState } from "react";
import { AlertCircle, BookOpen, Check, Copy, FilePlus2, FilePenLine, Loader2, RefreshCw, Trash2, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { citasDe, rotuloDeCita, separarCita, type Cita, type TipoCita } from "@/lib/diario/asistente/citas";
import { decodificarArgs, resumenDe, PREFIJO_FALLO, PREFIJO_OMITIDA, type LlamadaRegistrada } from "@/lib/diario/asistente/herramientas";
import type { TurnoChat } from "@/lib/diario/asistente/sesiones";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAbrirEntrada } from "../enlaces/ContextoEnlaces";
import { MarkdownChat } from "./MarkdownChat";

const NOMBRE_HERRAMIENTA: Record<string, string> = {
  searchDiaries: "Buscar",
  getDiary: "Leer",
  diaryOverview: "Resumen",
  createDiary: "Crear entrada",
  updateDiary: "Editar entrada",
  deleteDiary: "Borrar entrada",
  listCategories: "Categorías",
  createCategory: "Crear categoría",
  updateCategory: "Cambiar categoría",
  deleteCategory: "Borrar categoría",
};

function FichaHerramienta({ l, esperando }: { l: LlamadaRegistrada; esperando: boolean }) {
  const fallo = l.hecha && l.resultado.startsWith(PREFIJO_FALLO);
  const rechazada = l.hecha && l.resultado.startsWith(PREFIJO_OMITIDA);
  const resumen = l.hecha ? resumenDe(l.nombre, decodificarArgs(l.args), l.resultado) : esperando ? "Esperando tu permiso" : "Trabajando…";
  return (
    <li className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs", fallo ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground")}>
      {!l.hecha ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : fallo || rechazada ? <X className="size-3.5" aria-hidden /> : <Check className="size-3.5 text-primary" aria-hidden />}
      <Wrench className="size-3 opacity-60" aria-hidden />
      <span className="font-medium text-foreground">{NOMBRE_HERRAMIENTA[l.nombre] ?? l.nombre}</span>
      <span className="truncate">{resumen}</span>
    </li>
  );
}

const ICONO_CITA: Record<TipoCita, typeof BookOpen> = { leida: BookOpen, creada: FilePlus2, editada: FilePenLine, borrada: Trash2 };
const TEXTO_CITA: Record<TipoCita, string> = { leida: "Leída", creada: "Creada", editada: "Editada", borrada: "Borrada" };

function FichaCita({ cita, rotulo }: { cita: Cita; rotulo: string }) {
  const abrir = useAbrirEntrada();
  const Icono = ICONO_CITA[cita.tipo];
  const abrible = !!abrir && cita.tipo !== "borrada";
  return (
    <button
      type="button"
      disabled={!abrible}
      onClick={() => abrir?.(cita.id)}
      className={cn("inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", abrible ? "hover:bg-muted" : "opacity-70", cita.tipo === "borrada" && "line-through")}
      title={abrible ? "Abrir la entrada" : undefined}
    >
      <Icono className="size-3.5 shrink-0" aria-hidden />
      <span className="shrink-0 text-muted-foreground">{TEXTO_CITA[cita.tipo]}</span>
      <span className="truncate">{rotulo}</span>
    </button>
  );
}

export function BurbujaUsuario({ turno }: { turno: TurnoChat }) {
  const abrir = useAbrirEntrada();
  const { id, texto } = separarCita(turno.texto);
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm leading-6 whitespace-pre-wrap text-primary-foreground">
        {id !== null && (
          <button type="button" disabled={!abrir} onClick={() => abrir?.(id)} className="mb-1 flex items-center gap-1 rounded-md bg-primary-foreground/15 px-2 py-0.5 text-xs">
            <BookOpen className="size-3" aria-hidden /> Entrada {id}
          </button>
        )}
        {texto}
      </div>
    </div>
  );
}

export function BurbujaAsistente({
  turno,
  enCurso,
  esperandoPermiso,
  puedeRegenerar,
  onRegenerar,
  onContinuar,
}: {
  turno: TurnoChat;
  /** El turno se está escribiendo ahora. */
  enCurso: boolean;
  /** Ids de las llamadas que esperan permiso. */
  esperandoPermiso: ReadonlySet<string>;
  puedeRegenerar: boolean;
  onRegenerar: () => void;
  onContinuar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const citas = citasDe(turno.llamadas);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(turno.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {turno.llamadas.length > 0 && (
        <ul className="flex w-full max-w-[95%] flex-col gap-1" aria-label="Herramientas usadas">
          {turno.llamadas.map((l) => (
            <FichaHerramienta key={l.id} l={l} esperando={esperandoPermiso.has(l.id)} />
          ))}
        </ul>
      )}
      {turno.texto ? (
        <div className="max-w-[95%] rounded-2xl rounded-bl-md bg-muted/60 px-3.5 py-2">
          <MarkdownChat texto={turno.texto} />
        </div>
      ) : enCurso && !turno.llamadas.length ? (
        <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Pensando…
        </div>
      ) : null}
      {citas.length > 0 && (
        <div className="flex max-w-[95%] flex-wrap gap-1.5" aria-label="Entradas">
          {citas.slice(0, 12).map((c) => (
            <FichaCita key={c.id} cita={c} rotulo={rotuloDeCita(c.id, turno.llamadas)} />
          ))}
        </div>
      )}
      {turno.error && (
        <div role="alert" className="flex max-w-[95%] items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> <span>{turno.error}</span>
        </div>
      )}
      {turno.truncado && !enCurso && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          La respuesta se cortó por el límite de largo.
          <Button type="button" size="xs" variant="outline" onClick={onContinuar}>
            Seguir
          </Button>
        </div>
      )}
      {!enCurso && (turno.texto || puedeRegenerar) && (
        <div className="flex items-center gap-1 text-muted-foreground">
          {turno.texto && (
            <Button type="button" size="icon-xs" variant="ghost" aria-label="Copiar la respuesta" onClick={() => void copiar()}>
              {copiado ? <Check /> : <Copy />}
            </Button>
          )}
          {puedeRegenerar && (
            <Button type="button" size="icon-xs" variant="ghost" aria-label="Responder de nuevo" onClick={onRegenerar}>
              <RefreshCw />
            </Button>
          )}
          {turno.salidaTokens > 0 && <span className="px-1 text-[11px]">{turno.entradaTokens + turno.salidaTokens} tokens</span>}
        </div>
      )}
    </div>
  );
}
