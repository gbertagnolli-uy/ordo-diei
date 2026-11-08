"use client";
// Asistente del diario (lane 298): ajustes — modo de permisos y notas para el asistente. Los proveedores y el historial tienen su propio lugar.
// Portado de vendor/moodiary/.../presentation/{assistant_setting_page,permission_mode_sheet,assistant_notes_page}.dart (ZhuJHua/moodiary@2c552dd).
import { useState } from "react";
import { Brain, Cpu, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MAX_CONTEXTO, MIN_CONTEXTO, limiteDeContexto } from "@/lib/diario/asistente/compactacion";
import { MAX_NOTAS, MODOS_PERMISO, type ModoPermiso } from "@/lib/diario/asistente/herramientas";
import type { Ajustes } from "@/lib/diario/asistente/sesiones";
import { Panel } from "./ProveedoresAsistente";

const MODOS: Record<ModoPermiso, { titulo: string; detalle: string }> = {
  confirm: { titulo: "Preguntarme siempre", detalle: "Antes de crear, editar o borrar algo, el asistente te pide permiso. Leer y buscar no pide." },
  auto: { titulo: "Preguntar solo lo delicado", detalle: "Crea y ordena sin preguntar; te pide permiso para borrar o para reemplazar el texto de una entrada." },
  full: { titulo: "No preguntar", detalle: "El asistente hace todo sin pedir permiso. Borrar una entrada no se puede deshacer." },
};

export function AjustesAsistente({
  ajustes,
  cantidadDeSesiones,
  cantidadDeHechos,
  onVolver,
  onGuardar,
  onProveedores,
  onMemoria,
  onBorrarTodo,
}: {
  ajustes: Ajustes;
  cantidadDeSesiones: number;
  cantidadDeHechos: number;
  onVolver: () => void;
  onGuardar: (parcial: Partial<Ajustes>) => void;
  onProveedores: () => void;
  onMemoria: () => void;
  onBorrarTodo: () => void;
}) {
  const [notas, setNotas] = useState(ajustes.notas);
  const [contextoTexto, setContextoTexto] = useState(() => String(ajustes.contexto));
  return (
    <Panel titulo="Ajustes del asistente" onVolver={onVolver}>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Modelo</h4>
          <Button type="button" variant="outline" className="justify-start" onClick={onProveedores}>
            <Cpu /> Proveedores y claves
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Permisos</h4>
          <RadioGroup value={ajustes.modoPermiso} onValueChange={(v) => onGuardar({ modoPermiso: v as ModoPermiso })} className="gap-2">
            {MODOS_PERMISO.map((m) => (
              <Label key={m} htmlFor={`modo-${m}`} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 font-normal">
                <RadioGroupItem id={`modo-${m}`} value={m} className="mt-1" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{MODOS[m].titulo}</span>
                  <span className="text-xs text-muted-foreground">{MODOS[m].detalle}</span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Memoria</h4>
          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <span className="text-xs text-muted-foreground">
              Cuando está encendida, el asistente guarda lo que le contás de vos, solo en este navegador.
            </span>
            <Switch
              checked={ajustes.memoria}
              onCheckedChange={(memoria) => onGuardar({ memoria })}
              aria-label="Memoria del asistente"
            />
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={!ajustes.memoria}
              onClick={onMemoria}
            >
              <Brain /> Ver lo que recuerda ({cantidadDeHechos})
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Contexto</h4>
          <p className="text-xs text-muted-foreground">
            Tamaño del contexto del modelo, en tokens. Cuando la conversación pasa el 75 % de este número, los mensajes viejos se resumen. Si no sabés cuál es, dejá 32000.
          </p>
          <Input
            type="number"
            inputMode="numeric"
            min={MIN_CONTEXTO}
            max={MAX_CONTEXTO}
            step={1000}
            value={contextoTexto}
            onChange={(e) => setContextoTexto(e.target.value)}
            onBlur={() => {
              const acotado = limiteDeContexto(contextoTexto);
              onGuardar({ contexto: acotado });
              setContextoTexto(String(acotado));
            }}
          />
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Notas para el asistente</h4>
          <p className="text-xs text-muted-foreground">Cómo querés que te hable o qué tener en cuenta. Puede cambiar el tono, no las reglas de seguridad.</p>
          <Textarea
            value={notas}
            maxLength={MAX_NOTAS}
            rows={4}
            placeholder="Ej.: Tratame de vos, respondé corto y sin vueltas."
            onChange={(e) => setNotas(e.target.value)}
            onBlur={() => notas !== ajustes.notas && onGuardar({ notas })}
          />
          <span className="text-right text-xs text-muted-foreground">
            {notas.length}/{MAX_NOTAS}
          </span>
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Conversaciones</h4>
          <p className="text-xs text-muted-foreground">Se guardan solo en este navegador. {cantidadDeSesiones} guardadas.</p>
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={cantidadDeSesiones === 0}
              onClick={() => {
                if (window.confirm("¿Borrar todas las conversaciones con el asistente de este navegador?")) onBorrarTodo();
              }}
            >
              <Trash2 /> Borrar todas
            </Button>
          </div>
        </section>
      </div>
    </Panel>
  );
}
