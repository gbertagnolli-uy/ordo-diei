"use client";
// Asistente del diario (lane 298): la tarjeta que pide permiso antes de que el asistente cambie algo. Qué va a hacer, en palabras, y Permitir / Rechazar.
// Portado de la idea de vendor/moodiary/.../presentation/{tool_approval_card,tool_approval_preview}.dart (ZhuJHua/moodiary@2c552dd).
import { AlertTriangle, Check, ShieldQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { itemsDe, idsDe, esHerramientaDeMemoria, type Herramienta, type Nivel } from "@/lib/diario/asistente/herramientas";
import { CATEGORIAS_HECHO, ROTULO_CATEGORIA, type CategoriaHecho, type Hecho } from "@/lib/diario/asistente/memoria";
import { cn } from "@/lib/utils";

const TITULO: Record<Herramienta, string> = {
  searchDiaries: "Buscar en el diario",
  getDiary: "Leer entradas",
  diaryOverview: "Resumen del diario",
  createDiary: "Crear entradas",
  updateDiary: "Editar entradas",
  deleteDiary: "Borrar entradas",
  listCategories: "Ver categorías",
  createCategory: "Crear categorías",
  updateCategory: "Cambiar categorías",
  deleteCategory: "Borrar categorías",
  recallMemory: "Consultar la memoria",
  rememberFact: "Guardar en la memoria",
  forgetFact: "Borrar de la memoria",
};

const recortar = (s: unknown, max = 140) => {
  const t = typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

/** Las líneas que le muestran a la persona qué va a pasar con cada elemento. */
export function vistaPreviaDe(nombre: Herramienta, args: Record<string, unknown>, hechos: Hecho[] = []): string[] {
  const items = itemsDe(args);
  switch (nombre) {
    case "createDiary":
      return items.map((i) => `${recortar(i.title, 60) || "Sin título"}${i.date ? ` · ${String(i.date)}` : ""} — ${recortar(i.content)}`);
    case "updateDiary":
      return items.map((i) => {
        const cambios = [i.title !== undefined && "título", i.content !== undefined && i.content !== null && "texto (se reemplaza todo)", i.mood !== undefined && "ánimo", i.date !== undefined && "fecha", i.categoryId !== undefined && "categoría"].filter(Boolean);
        return `Entrada ${String(i.id ?? "?")}: ${cambios.join(", ") || "sin cambios"}${i.content ? ` — ${recortar(i.content, 100)}` : ""}`;
      });
    case "deleteDiary":
      return [`Entradas ${idsDe(args).join(", ") || "?"} (no se pueden recuperar)`];
    case "createCategory":
      return items.map((i) => recortar(i.name, 60) || "Sin nombre");
    case "updateCategory":
      return items.map((i) => `Categoría ${String(i.id ?? "?")}${i.name !== undefined ? ` → ${recortar(i.name, 60)}` : ""}${i.parentId !== undefined ? " (cambia de madre)" : ""}`);
    case "deleteCategory":
      return [`Categorías ${idsDe(args).join(", ") || "?"}`];
    case "rememberFact":
      return items.map((i) => {
        const id = typeof i.id === "string" ? i.id.trim() : "";
        if (id) return `Corregir: ${recortar(i.text)}`;
        const cat = typeof i.category === "string" && (CATEGORIAS_HECHO as readonly string[]).includes(i.category) ? (i.category as CategoriaHecho) : "fact";
        return `${ROTULO_CATEGORIA[cat]}: ${recortar(i.text)}`;
      });
    case "forgetFact": {
      const ids = idsDe(args);
      const primeros = ids.slice(0, 8).map((id) => {
        const h = hechos.find((x) => x.id === id);
        return h ? `“${h.texto}”` : id;
      });
      if (ids.length > 8) primeros.push(`… y ${ids.length - 8} más`);
      return primeros;
    }
    default:
      return [];
  }
}

export function TarjetaAprobacion({
  nombre,
  args,
  nivel,
  hechos = [],
  onResolver,
}: {
  nombre: Herramienta;
  args: Record<string, unknown>;
  nivel: Nivel;
  hechos: Hecho[];
  onResolver: (ok: boolean) => void;
}) {
  const lineas = vistaPreviaDe(nombre, args, hechos);
  const destructivo = nivel === "destructive";
  const subtitulo = destructivo ? "No se puede deshacer" : esHerramientaDeMemoria(nombre) ? "Cambia la memoria del asistente" : "Cambia tu diario";
  return (
    <div role="group" aria-label={`Permiso: ${TITULO[nombre]}`} className={cn("rounded-xl border p-3 text-sm", destructivo ? "border-destructive/50 bg-destructive/5" : "border-primary/40 bg-primary/5")}>
      <div className="flex items-center gap-2 font-medium">
        {destructivo ? <AlertTriangle className="size-4 text-destructive" aria-hidden /> : <ShieldQuestion className="size-4 text-primary" aria-hidden />}
        <span>{TITULO[nombre]}</span>
        <span className="ml-auto text-xs font-normal text-muted-foreground">{subtitulo}</span>
      </div>
      {lineas.length > 0 && (
        <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-muted-foreground">
          {lineas.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => onResolver(false)}>
          <X /> Rechazar
        </Button>
        <Button type="button" size="sm" variant={destructivo ? "destructive" : "default"} onClick={() => onResolver(true)}>
          <Check /> Permitir
        </Button>
      </div>
    </div>
  );
}
