"use client";
// Diario (lane 284): diálogos para crear y editar una etiqueta, una categoría de etiquetas y una categoría de entrada.
// Portado de vendor/Daily_You/lib/widgets/{edit_tag,edit_category,icon_color_label_row}.dart (Demizo/Daily_You@7cc237d)
// y de vendor/moodiary/.../category_repository.dart (ZhuJHua/moodiary@2c552dd) para la categoría de entrada.
import { useState, type ReactNode } from "react";
import { Folder, Palette as PaletaIcono, Tag, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { MAX_NOMBRE, aplanarArbol, limpiarNombre, nombreEscribiendo, validarPadre, type TipoEtiqueta } from "@/lib/diario/etiquetas";
import type { CategoriaVista, EtiquetaVista, GrupoVista } from "@/lib/diario/servidor-catalogo";
import { cn } from "@/lib/utils";
import { IconoEtiqueta } from "./iconos";
import { SelectorColor } from "./SelectorColor";
import { SelectorIcono, type ValorIcono } from "./SelectorIcono";

/** Daily You `IconColorLabelRow`: botón de ícono, botón de color y nombre. */
function FilaIconoColorNombre({
  icono,
  reemplazo,
  color,
  nombre,
  onNombre,
  onIcono,
  onColor,
  sinIcono,
}: {
  icono: ValorIcono;
  reemplazo: typeof Tag;
  color: string | null;
  nombre: string;
  onNombre: (n: string) => void;
  onIcono: (v: ValorIcono) => void;
  onColor: (c: string | null) => void;
  sinIcono?: boolean;
}) {
  const [eligiendo, setEligiendo] = useState<"icono" | "color" | null>(null);
  return (
    <div className="flex items-center gap-2">
      {!sinIcono && (
        <Button type="button" variant="outline" size="icon-lg" aria-label="Elegir ícono" onClick={() => setEligiendo("icono")}>
          <IconoEtiqueta icono={icono.icono} tipoIcono={icono.tipoIcono} reemplazo={reemplazo} color={color} tamano={22} />
        </Button>
      )}
      <Button type="button" variant="outline" size="icon-lg" aria-label="Elegir color" onClick={() => setEligiendo("color")}>
        {color ? <span className="size-5 rounded-full" style={{ backgroundColor: color }} /> : <PaletaIcono />}
      </Button>
      <Input autoFocus={!nombre} value={nombre} maxLength={MAX_NOMBRE} onChange={(e) => onNombre(nombreEscribiendo(e.target.value))} placeholder="Nombre" aria-label="Nombre" />
      {eligiendo === "icono" && (
        <SelectorIcono
          valor={icono}
          color={color}
          onElegir={(v) => {
            onIcono(v);
            setEligiendo(null);
          }}
          onCerrar={() => setEligiendo(null)}
        />
      )}
      {eligiendo === "color" && (
        <SelectorColor
          valor={color}
          onElegir={(c) => {
            onColor(c);
            setEligiendo(null);
          }}
          onCerrar={() => setEligiendo(null)}
        />
      )}
    </div>
  );
}

function Marco({ titulo, children, pie, onCerrar }: { titulo: string; children: ReactNode; pie: ReactNode; onCerrar: () => void }) {
  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">{children}</div>
        <DialogFooter>{pie}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const textoBorrado = (cuantas: number, que: string) => (cuantas ? `«${que}» está puesta en ${cuantas} ${cuantas === 1 ? "entrada" : "entradas"}. Se va a sacar de todas.` : `Se va a borrar «${que}».`);

// ── Etiqueta ────────────────────────────────────────────────────────────────

export function EditarEtiqueta({
  etiqueta,
  nombreInicial,
  grupoInicial = null,
  grupos,
  onGuardar,
  onBorrar,
  onCerrar,
}: {
  etiqueta?: EtiquetaVista;
  nombreInicial?: string;
  grupoInicial?: number | null;
  grupos: GrupoVista[];
  onGuardar: (cuerpo: Record<string, unknown>) => Promise<boolean>;
  onBorrar?: () => Promise<boolean>;
  onCerrar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoEtiqueta>(etiqueta?.tipo ?? "etiqueta");
  const [nombre, setNombre] = useState(etiqueta?.nombre ?? limpiarNombre(nombreInicial ?? ""));
  const [icono, setIcono] = useState<ValorIcono>({ icono: etiqueta?.icono ?? null, tipoIcono: etiqueta?.tipoIcono ?? "emoji" });
  const [color, setColor] = useState<string | null>(etiqueta?.color ?? null);
  const [grupoId, setGrupoId] = useState<number | null>(etiqueta ? etiqueta.grupoId : grupoInicial);
  const [trabajando, setTrabajando] = useState(false);
  const valido = limpiarNombre(nombre).length > 0;

  async function guardar() {
    setTrabajando(true);
    const ok = await onGuardar({ tipo, nombre, ...icono, color, grupoId });
    setTrabajando(false);
    if (ok) onCerrar();
  }

  return (
    <Marco
      titulo={etiqueta ? "Editar etiqueta" : "Nueva etiqueta"}
      onCerrar={onCerrar}
      pie={
        <>
          {etiqueta && onBorrar && (
            <Button
              type="button"
              variant="destructive"
              className="sm:mr-auto"
              disabled={trabajando}
              onClick={async () => {
                if (!window.confirm(`${textoBorrado(etiqueta.usos, etiqueta.nombre)} ¿Seguís?`)) return;
                if (await onBorrar()) onCerrar();
              }}
            >
              <Trash2 /> Borrar
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" disabled={!valido || trabajando} onClick={() => void guardar()}>
            Guardar
          </Button>
        </>
      }
    >
      {etiqueta ? (
        <p className="text-sm text-muted-foreground">{etiqueta.tipo === "contador" ? "Contador: lleva un número en cada entrada" : "Etiqueta"}</p>
      ) : (
        <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 gap-2">
          {(["etiqueta", "contador"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => setTipo(t)}
              className={cn("flex flex-col items-start gap-0.5 rounded-lg border p-2 text-left", tipo === t && "border-primary bg-primary/10")}
            >
              <span className="flex items-center gap-1 font-medium">{t === "etiqueta" ? <Tag className="size-4" /> : <TrendingUp className="size-4" />}{t === "etiqueta" ? "Etiqueta" : "Contador"}</span>
              <span className="text-xs text-muted-foreground">{t === "etiqueta" ? "Se pone o no se pone" : "Lleva un número (horas de sueño, vasos de agua…)"}</span>
            </button>
          ))}
        </div>
      )}
      <FilaIconoColorNombre icono={icono} reemplazo={tipo === "contador" ? TrendingUp : Tag} color={color} nombre={nombre} onNombre={setNombre} onIcono={setIcono} onColor={setColor} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="grupo-etiqueta">Categoría</Label>
        <NativeSelect id="grupo-etiqueta" className="w-full" value={grupoId ?? ""} onChange={(e) => setGrupoId(e.target.value ? Number(e.target.value) : null)}>
          <NativeSelectOption value="">Sin categoría</NativeSelectOption>
          {grupos.map((g) => (
            <NativeSelectOption key={g.id} value={g.id}>
              {g.nombre}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </Marco>
  );
}

// ── Categoría de etiquetas ──────────────────────────────────────────────────

export function EditarGrupo({
  grupo,
  cuantasEtiquetas = 0,
  usosTotales = 0,
  onGuardar,
  onBorrar,
  onCerrar,
}: {
  grupo?: GrupoVista;
  cuantasEtiquetas?: number;
  usosTotales?: number;
  onGuardar: (cuerpo: Record<string, unknown>) => Promise<boolean>;
  onBorrar?: () => Promise<boolean>;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(grupo?.nombre ?? "");
  const [icono, setIcono] = useState<ValorIcono>({ icono: grupo?.icono ?? null, tipoIcono: grupo?.tipoIcono ?? "emoji" });
  const [color, setColor] = useState<string | null>(grupo?.color ?? null);
  const [unica, setUnica] = useState(grupo?.seleccionUnica ?? false);
  const [trabajando, setTrabajando] = useState(false);
  const valido = limpiarNombre(nombre).length > 0;

  return (
    <Marco
      titulo={grupo ? "Editar categoría" : "Nueva categoría de etiquetas"}
      onCerrar={onCerrar}
      pie={
        <>
          {grupo && onBorrar && (
            <Button
              type="button"
              variant="destructive"
              className="sm:mr-auto"
              disabled={trabajando}
              onClick={async () => {
                const aviso = cuantasEtiquetas
                  ? `Se van a borrar «${grupo.nombre}» y sus ${cuantasEtiquetas} ${cuantasEtiquetas === 1 ? "etiqueta" : "etiquetas"}${usosTotales ? `, y se van a sacar de las ${usosTotales} veces que están puestas en entradas` : ""}.`
                  : `Se va a borrar «${grupo.nombre}».`;
                if (!window.confirm(`${aviso} ¿Seguís?`)) return;
                if (await onBorrar()) onCerrar();
              }}
            >
              <Trash2 /> Borrar
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!valido || trabajando}
            onClick={async () => {
              setTrabajando(true);
              const ok = await onGuardar({ nombre, ...icono, color, seleccionUnica: unica });
              setTrabajando(false);
              if (ok) onCerrar();
            }}
          >
            Guardar
          </Button>
        </>
      }
    >
      <FilaIconoColorNombre icono={icono} reemplazo={Folder} color={color} nombre={nombre} onNombre={setNombre} onIcono={setIcono} onColor={setColor} />
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <Label htmlFor="seleccion-unica" className="flex flex-col items-start gap-0.5">
          Una sola por entrada
          <span className="text-xs font-normal text-muted-foreground">Para sentimientos o clima: elegir una reemplaza a la anterior</span>
        </Label>
        <Switch id="seleccion-unica" checked={unica} onCheckedChange={setUnica} />
      </div>
    </Marco>
  );
}

// ── Categoría de la entrada (moodiary) ──────────────────────────────────────

export function EditarCategoria({
  categoria,
  categorias,
  onGuardar,
  onBorrar,
  onCerrar,
}: {
  categoria?: CategoriaVista;
  categorias: CategoriaVista[];
  onGuardar: (cuerpo: Record<string, unknown>) => Promise<boolean>;
  onBorrar?: () => Promise<boolean>;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [color, setColor] = useState<string | null>(categoria?.color ?? null);
  const [padreId, setPadreId] = useState<number | null>(categoria?.padreId ?? null);
  const [trabajando, setTrabajando] = useState(false);
  const valido = limpiarNombre(nombre).length > 0;
  // Solo se ofrecen las madres posibles: no ella misma, no sus hijas y sin pasar del máximo de niveles
  const opciones = aplanarArbol(categorias).filter((c) => {
    try {
      validarPadre(categoria?.id ?? null, c.id, categorias);
      return true;
    } catch {
      return false;
    }
  });
  return (
    <Marco
      titulo={categoria ? "Editar categoría de entrada" : "Nueva categoría de entrada"}
      onCerrar={onCerrar}
      pie={
        <>
          {categoria && onBorrar && (
            <Button
              type="button"
              variant="destructive"
              className="sm:mr-auto"
              disabled={trabajando}
              onClick={async () => {
                if (!window.confirm(`Se va a borrar «${categoria.nombre}». ¿Seguís?`)) return;
                if (await onBorrar()) onCerrar();
              }}
            >
              <Trash2 /> Borrar
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!valido || trabajando}
            onClick={async () => {
              setTrabajando(true);
              const ok = await onGuardar({ nombre, color, padreId });
              setTrabajando(false);
              if (ok) onCerrar();
            }}
          >
            Guardar
          </Button>
        </>
      }
    >
      <FilaIconoColorNombre icono={{ icono: null, tipoIcono: "emoji" }} reemplazo={Folder} color={color} nombre={nombre} onNombre={setNombre} onIcono={() => {}} onColor={setColor} sinIcono />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="padre-categoria">Dentro de</Label>
        <NativeSelect id="padre-categoria" className="w-full" value={padreId ?? ""} onChange={(e) => setPadreId(e.target.value ? Number(e.target.value) : null)}>
          <NativeSelectOption value="">Ninguna (categoría principal)</NativeSelectOption>
          {opciones.map((c) => (
            <NativeSelectOption key={c.id} value={c.id}>
              {"— ".repeat(c.nivel - 1)}
              {c.nombre}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </Marco>
  );
}
