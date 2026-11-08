"use client";
// Asistente del diario (lane 298): los proveedores de modelos. Elegir uno de la lista (Anthropic, OpenAI, DeepSeek…) o cargar uno propio por URL,
// poner la clave (queda solo en este navegador, D1) y el modelo. Portado de la idea de vendor/moodiary/.../presentation/assistant_provider_{list,picker,edit}_page.dart
// (ZhuJHua/moodiary@2c552dd), con presets fijos en lugar del catálogo remoto.
import { useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, KeyRound, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { MAX_CLAVE, MAX_MODELO, MAX_NOMBRE_PROVEEDOR, PRESETS, idProveedor, presetDe, proveedorDePreset, validarUrlBase, type Proveedor } from "@/lib/diario/asistente/proveedores";
import { PROTOCOLOS, type Protocolo } from "@/lib/diario/asistente/protocolos";
import { toast } from "@/lib/toast";
import { pedirModelos } from "./cliente";

const ETIQUETA_PROTOCOLO: Record<Protocolo, string> = { "openai-completions": "Compatible con OpenAI (chat/completions)", "anthropic-messages": "Anthropic (messages)" };

function Edicion({ inicial, claveInicial, onGuardar, onCancelar }: { inicial: Proveedor; claveInicial: string; onGuardar: (p: Proveedor, clave: string) => void; onCancelar: () => void }) {
  const [p, setP] = useState<Proveedor>(inicial);
  const [clave, setClave] = useState(claveInicial);
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const propio = p.presetId === null;
  const preset = presetDe(p.presetId);

  async function traerModelos() {
    setCargando(true);
    try {
      const { base } = validarUrlBase(p.baseUrl);
      if (!clave.trim()) throw new Error("Primero poné la clave");
      const modelos = await pedirModelos({ ...p, baseUrl: base }, clave.trim());
      if (!modelos.length) throw new Error("El proveedor no devolvió modelos");
      setP((x) => ({ ...x, modelos, modelo: modelos.includes(x.modelo) ? x.modelo : modelos[0] }));
      toast.success(`${modelos.length} modelos`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo pedir la lista");
    } finally {
      setCargando(false);
    }
  }

  function guardar() {
    try {
      const nombre = p.nombre.trim();
      if (!nombre) throw new Error("Poné un nombre");
      const { base } = validarUrlBase(p.baseUrl);
      if (!p.modelo.trim()) throw new Error("Elegí un modelo");
      if (!clave.trim()) throw new Error("Falta la clave");
      if (/[\r\n]/.test(clave)) throw new Error("La clave no es válida");
      onGuardar({ ...p, nombre, baseUrl: base, modelo: p.modelo.trim(), modelos: [...new Set([p.modelo.trim(), ...p.modelos])] }, clave.trim());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="prov-nombre">Nombre</Label>
        <Input id="prov-nombre" value={p.nombre} maxLength={MAX_NOMBRE_PROVEEDOR} onChange={(e) => setP({ ...p, nombre: e.target.value })} />
      </div>
      {propio && (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-url">Dirección (https)</Label>
            <Input id="prov-url" value={p.baseUrl} placeholder="https://api.ejemplo.com/v1" inputMode="url" autoCapitalize="none" onChange={(e) => setP({ ...p, baseUrl: e.target.value })} />
            <p className="text-xs text-muted-foreground">Solo https y direcciones públicas: el servidor no se conecta a redes internas.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-protocolo">Protocolo</Label>
            <NativeSelect id="prov-protocolo" value={p.protocolo} onChange={(e) => setP({ ...p, protocolo: e.target.value as Protocolo })}>
              {PROTOCOLOS.map((x) => (
                <NativeSelectOption key={x} value={x}>
                  {ETIQUETA_PROTOCOLO[x]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="prov-clave">Clave de API</Label>
        <div className="flex gap-2">
          <Input id="prov-clave" type={verClave ? "text" : "password"} value={clave} maxLength={MAX_CLAVE} autoComplete="off" autoCapitalize="none" spellCheck={false} onChange={(e) => setClave(e.target.value)} />
          <Button type="button" variant="outline" size="icon" aria-label={verClave ? "Ocultar la clave" : "Mostrar la clave"} onClick={() => setVerClave((v) => !v)}>
            {verClave ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Se guarda solo en este navegador. {preset ? `La sacás en ${preset.clave}. ` : ""}Cada pregunta pasa por el servidor de Ordo Diei para llegar al proveedor, y ahí no se guarda.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="prov-modelo">Modelo</Label>
        <Input id="prov-modelo" value={p.modelo} list="prov-modelos" maxLength={MAX_MODELO} autoCapitalize="none" spellCheck={false} onChange={(e) => setP({ ...p, modelo: e.target.value })} />
        <datalist id="prov-modelos">
          {[...new Set([...p.modelos, ...(preset?.modelos ?? [])])].map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <div>
          <Button type="button" variant="outline" size="sm" disabled={cargando} onClick={() => void traerModelos()}>
            {cargando ? <Loader2 className="animate-spin" /> : <KeyRound />} Traer los modelos del proveedor
          </Button>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="button" onClick={guardar}>
          <Check /> Guardar
        </Button>
      </div>
    </div>
  );
}

export function ProveedoresAsistente({
  proveedores,
  claves,
  activoId,
  onVolver,
  onGuardar,
  onBorrar,
  onActivar,
}: {
  proveedores: Proveedor[];
  claves: Record<string, string>;
  activoId: string | null;
  onVolver: () => void;
  onGuardar: (p: Proveedor, clave: string) => void;
  onBorrar: (id: string) => void;
  onActivar: (id: string) => void;
}) {
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [agregando, setAgregando] = useState(proveedores.length === 0);

  if (editando) {
    return (
      <Panel titulo={proveedores.some((p) => p.id === editando.id) ? "Editar proveedor" : "Nuevo proveedor"} onVolver={() => setEditando(null)}>
        <Edicion
          inicial={editando}
          claveInicial={claves[editando.id] ?? ""}
          onGuardar={(p, clave) => {
            onGuardar(p, clave);
            setEditando(null);
            setAgregando(false);
          }}
          onCancelar={() => setEditando(null)}
        />
      </Panel>
    );
  }

  return (
    <Panel titulo="Proveedores de modelos" onVolver={onVolver}>
      <p className="mb-3 text-sm text-muted-foreground">
        El asistente usa tu propia cuenta con un proveedor de modelos. Ordo Diei no incluye ninguno ni se queda con tu clave: queda en este navegador.
      </p>
      {proveedores.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {proveedores.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-xl border p-3">
              <button type="button" className="flex min-w-0 flex-1 flex-col text-left" onClick={() => onActivar(p.id)} aria-pressed={p.id === activoId}>
                <span className="flex items-center gap-2 font-medium">
                  {p.nombre}
                  {p.id === activoId && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">En uso</span>}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {p.modelo || "Sin modelo"} · {claves[p.id] ? "con clave" : "falta la clave"}
                </span>
              </button>
              <Button type="button" variant="ghost" size="icon" aria-label={`Editar ${p.nombre}`} onClick={() => setEditando(p)}>
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Quitar ${p.nombre}`}
                onClick={() => {
                  if (window.confirm(`¿Quitar ${p.nombre}? También se borra su clave de este navegador.`)) onBorrar(p.id);
                }}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {agregando || proveedores.length === 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Elegí un proveedor</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESETS.map((pr) => (
              <button key={pr.id} type="button" className="rounded-xl border p-3 text-left hover:bg-muted" onClick={() => setEditando(proveedorDePreset(pr))}>
                <span className="block font-medium">{pr.nombre}</span>
                <span className="block truncate text-xs text-muted-foreground">{pr.modelos[0]}</span>
              </button>
            ))}
            <button
              type="button"
              className="rounded-xl border border-dashed p-3 text-left hover:bg-muted"
              onClick={() => setEditando({ id: idProveedor(), nombre: "", presetId: null, protocolo: "openai-completions", baseUrl: "https://", modelo: "", modelos: [] })}
            >
              <span className="block font-medium">Otro proveedor</span>
              <span className="block text-xs text-muted-foreground">Cualquier servicio compatible, por su dirección</span>
            </button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => setAgregando(true)}>
          <Plus /> Agregar proveedor
        </Button>
      )}
    </Panel>
  );
}

export function Panel({ titulo, onVolver, children }: { titulo: string; onVolver: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Volver" onClick={onVolver}>
          <ArrowLeft />
        </Button>
        <h3 className="text-base font-semibold">{titulo}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}
